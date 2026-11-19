import type {
  AutomaticSpeechRecognitionOutput,
  AutomaticSpeechRecognitionPipeline,
  env,
} from '@huggingface/transformers';

type CustomCacheAdapter = NonNullable<(typeof env)['customCache']>;

export type SpeechModelQuality = 'fast' | 'accurate';

export interface TranscribeProgress {
  phase: 'decoding' | 'loading-model' | 'transcribing';
  percent?: number;
  message: string;
}

const WHISPER_MODELS: Record<SpeechModelQuality, string> = {
  fast: 'onnx-community/whisper-tiny',
  accurate: 'onnx-community/whisper-base',
};

const pipelineCache: Partial<Record<SpeechModelQuality, Promise<AutomaticSpeechRecognitionPipeline>>> = {};

function createElectronDiskCache(): CustomCacheAdapter | null {
  if (typeof window === 'undefined') return null;
  const bridge = window.kinezioDesktop;
  if (!bridge?.speechCacheRead || !bridge?.speechCacheWrite) return null;

  return {
    match: async (request: string): Promise<Response | undefined> => {
      try {
        const res = await bridge.speechCacheRead?.(request);
        if (!res?.ok || !res.bytes) return undefined;
        const copy = new Uint8Array(res.bytes.byteLength);
        copy.set(res.bytes);
        return new Response(copy, {
          status: 200,
          headers: {
            'content-type': res.contentType || 'application/octet-stream',
            'content-length': String(copy.byteLength),
          },
        });
      } catch {
        return undefined;
      }
    },
    put: async (
      request: string,
      response: Response,
      progress_callback?: (data: { progress: number; loaded: number; total: number }) => void
    ): Promise<void> => {
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const totalHeader = Number(response.headers.get('content-length') || 0);
      let bytes: Uint8Array;

      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.byteLength;
            if (progress_callback && totalHeader > 0) {
              progress_callback({
                progress: Math.min(100, (loaded / totalHeader) * 100),
                loaded,
                total: totalHeader,
              });
            }
          }
        }

        bytes = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
      } else {
        bytes = new Uint8Array(await response.arrayBuffer());
        if (progress_callback) {
          progress_callback({
            progress: 100,
            loaded: bytes.byteLength,
            total: bytes.byteLength,
          });
        }
      }

      await bridge.speechCacheWrite?.(request, bytes, contentType);
    },
  };
}

async function decodeBlobTo16kMonoPCM(blob: Blob): Promise<Float32Array> {
  if (typeof window === 'undefined') {
    throw new Error('Аудиодекодер доступен только в графическом интерфейсе.');
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('В этой среде недоступен Web Audio API для обработки записи.');
  }

  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioCtx();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    if (decoded.duration < 0.15) {
      throw new Error('Запись слишком короткая — продиктуйте жалобу и остановите запись.');
    }

    const targetSampleRate = 16000;
    const frameCount = Math.max(1, Math.ceil(decoded.duration * targetSampleRate));
    const offlineCtx = new OfflineAudioContext(1, frameCount, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    return new Float32Array(rendered.getChannelData(0));
  } finally {
    try {
      await audioCtx.close();
    } catch {
      // Ignore close error
    }
  }
}

async function getWhisperPipeline(
  quality: SpeechModelQuality,
  onProgress?: (p: TranscribeProgress) => void
): Promise<AutomaticSpeechRecognitionPipeline> {
  const existing = pipelineCache[quality];
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const { env, pipeline } = await import('@huggingface/transformers');
    const desktopCache = createElectronDiskCache();
    const canUseBrowserCache =
      typeof window !== 'undefined' &&
      window.location.protocol !== 'file:' &&
      'caches' in window;

    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    if (desktopCache) {
      env.useCustomCache = true;
      env.customCache = desktopCache;
      env.useBrowserCache = false;
    } else {
      env.useCustomCache = false;
      env.useBrowserCache = canUseBrowserCache;
    }
    env.useWasmCache = true;

    const modelId = WHISPER_MODELS[quality];
    onProgress?.({
      phase: 'loading-model',
      percent: 5,
      message:
        quality === 'fast'
          ? 'Подготовка локальной модели Whisper Tiny (~45 МБ при 1-м запуске)...'
          : 'Подготовка локальной модели Whisper Base (~75 МБ при 1-м запуске)...',
    });

    return pipeline('automatic-speech-recognition', modelId, {
      progress_callback: (info: { status?: string; progress?: number; file?: string }) => {
        if (info.status === 'progress' && typeof info.progress === 'number') {
          const pct = Math.max(5, Math.min(95, Math.round(info.progress)));
          onProgress?.({
            phase: 'loading-model',
            percent: pct,
            message: `Загрузка офлайн-модели речи (${pct}%)...`,
          });
        } else if (info.status === 'ready') {
          onProgress?.({
            phase: 'transcribing',
            percent: 96,
            message: 'Модель готова, выполняется распознавание русской речи...',
          });
        }
      },
    });
  })().catch((err) => {
    delete pipelineCache[quality];
    throw err;
  });

  pipelineCache[quality] = promise;
  return promise;
}

export async function transcribeAudioBlobToRussian(
  blob: Blob,
  options?: {
    quality?: SpeechModelQuality;
    onProgress?: (p: TranscribeProgress) => void;
  }
): Promise<string> {
  const quality = options?.quality ?? 'fast';
  const onProgress = options?.onProgress;

  onProgress?.({
    phase: 'decoding',
    percent: 2,
    message: 'Преобразование аудиодорожки 16 кГц...',
  });

  const pcm16k = await decodeBlobTo16kMonoPCM(blob);

  let transcriber: AutomaticSpeechRecognitionPipeline;
  try {
    transcriber = await getWhisperPipeline(quality, onProgress);
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const isNetworkErr = /fetch|network|failed to load|enotfound|offline/i.test(rawMsg);
    if (isNetworkErr) {
      throw new Error(
        'Локальная модель Whisper ещё не сохранена на этот ПК. Подключите интернет один раз для загрузки (~45 МБ), после чего распознавание будет работать полностью офлайн.'
      );
    }
    throw new Error(`Не удалось инициализировать локальный распознаватель речи (${rawMsg}).`);
  }

  onProgress?.({
    phase: 'transcribing',
    percent: 98,
    message: 'Распознавание русской речи и терминов...',
  });

  const result = await transcriber(pcm16k, {
    language: 'russian',
    task: 'transcribe',
    chunk_length_s: 25,
    stride_length_s: 5,
  });

  const out = Array.isArray(result)
    ? (result as AutomaticSpeechRecognitionOutput[]).map((r) => r.text).join(' ')
    : (result as AutomaticSpeechRecognitionOutput).text;

  const cleaned = (out || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    throw new Error('Речь на записи не обнаружена. Попробуйте говорить чётче ближе к микрофону.');
  }

  onProgress?.({
    phase: 'transcribing',
    percent: 100,
    message: 'Распознавание завершено.',
  });

  return cleaned;
}
