import React, { useEffect, useRef, useState } from 'react';
import { Check, Play, RotateCcw, Square, Timer, Volume2, VolumeX } from 'lucide-react';

export interface FatigueAssessment {
  label: string;
  shortLabel: string;
  badgeClass: string;
  clinicalNote: string;
}

export function classifyHoldFatigue(seconds: number): FatigueAssessment {
  if (seconds < 3) {
    return {
      label: 'Быстрое истощение (< 3 с)',
      shortLabel: 'Быстр. истощ.',
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
      clinicalNote:
        'Срыв удержания в первые 3 секунды: выраженная первичная гипотония, нарушение миотатического рефлекса или активная провокация.',
    };
  }
  if (seconds < 6) {
    return {
      label: 'Умеренное истощение (3–5.9 с)',
      shortLabel: 'Истощ. 3–6 с',
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
      clinicalNote:
        'Первичное включение сохранно, но наступает раннее утомление при изометрии: вероятен дефицит метаболической/сосудистой или эмоциональной поддержки.',
    };
  }
  return {
    label: 'Стойкое удержание (≥ 6 с)',
    shortLabel: 'Устойчива',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    clinicalNote:
      'Мышца уверенно удерживает изометрическое сокращение: нормальная функциональная выносливость.',
  };
}

function playSoftCueBeep(freq = 880, durationMs = 140) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, durationMs + 60);
  } catch {
    // Ignore audio context restrictions cleanly
  }
}

interface MMTHoldTimerProps {
  muscleId?: string;
  leftHoldSec?: number;
  rightHoldSec?: number;
  onSaveHoldTime?: (side: 'left' | 'right', seconds: number | undefined) => void;
}

const TARGET_PRESETS = [
  { sec: 3, label: '3 с · Базовый' },
  { sec: 6, label: '6 с · Выносливость' },
  { sec: 10, label: '10 с · Нагрузка' },
  { sec: 0, label: 'Без отсечки' },
] as const;

export const MMTHoldTimer: React.FC<MMTHoldTimerProps> = ({
  muscleId,
  leftHoldSec,
  rightHoldSec,
  onSaveHoldTime,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [targetSec, setTargetSec] = useState<number>(6);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [justSavedSide, setJustSavedSide] = useState<'left' | 'right' | null>(null);

  const startTimestampRef = useRef<number | null>(null);
  const baseElapsedRef = useRef<number>(0);
  const phase3AlertedRef = useRef(false);
  const targetAlertedRef = useRef(false);

  // Stop & reset timer cleanly when switching to a different muscle
  useEffect(() => {
    setIsRunning(false);
    setElapsedMs(0);
    baseElapsedRef.current = 0;
    startTimestampRef.current = null;
    phase3AlertedRef.current = false;
    targetAlertedRef.current = false;
    setJustSavedSide(null);
  }, [muscleId]);

  useEffect(() => {
    if (!isRunning) return;
    startTimestampRef.current = performance.now();

    const interval = window.setInterval(() => {
      if (startTimestampRef.current === null) return;
      const nowElapsed = baseElapsedRef.current + (performance.now() - startTimestampRef.current);
      setElapsedMs(nowElapsed);

      const sec = nowElapsed / 1000;
      if (soundEnabled && targetSec !== 3 && !phase3AlertedRef.current && sec >= 3) {
        phase3AlertedRef.current = true;
        playSoftCueBeep(660, 90);
      }
      if (soundEnabled && targetSec > 0 && !targetAlertedRef.current && sec >= targetSec) {
        targetAlertedRef.current = true;
        playSoftCueBeep(980, 180);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [isRunning, soundEnabled, targetSec]);

  const handleStartStop = () => {
    if (isRunning) {
      if (startTimestampRef.current !== null) {
        const finalMs = baseElapsedRef.current + (performance.now() - startTimestampRef.current);
        baseElapsedRef.current = finalMs;
        setElapsedMs(finalMs);
      }
      startTimestampRef.current = null;
      setIsRunning(false);
    } else {
      // If starting fresh after a completed run or paused run, allow resume or fresh start cleanly
      setIsRunning(true);
    }
  };

  const handleRestartFresh = () => {
    baseElapsedRef.current = 0;
    setElapsedMs(0);
    phase3AlertedRef.current = false;
    targetAlertedRef.current = false;
    startTimestampRef.current = performance.now();
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    baseElapsedRef.current = 0;
    startTimestampRef.current = null;
    phase3AlertedRef.current = false;
    targetAlertedRef.current = false;
    setElapsedMs(0);
  };

  const elapsedSec = Math.round((elapsedMs / 1000) * 10) / 10;
  const formattedSec = elapsedSec.toFixed(1);
  const progressPct =
    targetSec > 0 ? Math.min(100, Math.round((elapsedSec / targetSec) * 100)) : Math.min(100, Math.round((elapsedSec / 10) * 100));

  const currentAssessment = elapsedMs > 0 ? classifyHoldFatigue(elapsedSec) : null;

  const handleRecordToChart = (side: 'left' | 'right') => {
    if (!onSaveHoldTime || elapsedMs <= 0) return;
    // Stop timer if currently running while capturing exact split
    if (isRunning && startTimestampRef.current !== null) {
      const finalMs = baseElapsedRef.current + (performance.now() - startTimestampRef.current);
      const rounded = Math.round((finalMs / 1000) * 10) / 10;
      baseElapsedRef.current = finalMs;
      setElapsedMs(finalMs);
      startTimestampRef.current = null;
      setIsRunning(false);
      onSaveHoldTime(side, rounded);
    } else {
      onSaveHoldTime(side, elapsedSec);
    }
    setActiveSide(side);
    setJustSavedSide(side);
    setTimeout(() => setJustSavedSide(null), 1800);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-700 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              Таймер удержания сокращения и оценки истощения мышцы
            </div>
            <div className="text-[11px] text-slate-500">
              Фиксируйте время до «срыва» удержания: &lt; 3 с — быстрое истощение, 3–6 с — снижение выносливости, ≥ 6 с — норма
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            soundEnabled
              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              : 'bg-slate-100 border-slate-200 text-slate-400'
          }`}
          title="Звуковой сигнал на отметках 3 с и целевом пороге"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled ? 'Звук вкл.' : 'Без звука'}</span>
        </button>
      </div>

      {/* Main Timer Display + Target Presets + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="min-w-[92px]">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 leading-none">
              {formattedSec} <span className="text-sm font-semibold text-slate-500">с</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {targetSec > 0 ? `Цель: ${targetSec.toFixed(0)} с` : 'Свободный замер'}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleStartStop}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Стоп (Срыв)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{elapsedMs > 0 ? 'Продолжить' : 'Старт теста'}</span>
                </>
              )}
            </button>

            {!isRunning && elapsedMs > 0 && (
              <button
                type="button"
                onClick={handleRestartFresh}
                className="px-2.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Сбросить и сразу запустить новый замер"
              >
                Новый замер
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={elapsedMs === 0 && !isRunning}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Сбросить таймер"
              title="Сбросить таймер"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Target Threshold Presets */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          {TARGET_PRESETS.map((preset) => (
            <button
              key={preset.sec}
              type="button"
              onClick={() => {
                setTargetSec(preset.sec);
                targetAlertedRef.current = false;
              }}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                targetSec === preset.sec
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linear Fatigue Phase Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              elapsedSec < 3
                ? 'bg-rose-500'
                : elapsedSec < 6
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono tabular-nums text-slate-400">
          <span>0 с</span>
          <span>3 с (фаза А)</span>
          <span>{targetSec > 0 ? `${targetSec} с (цель)` : '6+ с (выносливость)'}</span>
        </div>
      </div>

      {/* Live / Recorded Fatigue Classification */}
      {currentAssessment && (
        <div
          className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${currentAssessment.badgeClass}`}
        >
          <div>
            <span className="font-bold">{currentAssessment.label}: </span>
            <span>{currentAssessment.clinicalNote}</span>
          </div>
        </div>
      )}

      {/* Record to Patient Session (Left / Right) when callback is provided */}
      {onSaveHoldTime && (
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 font-medium">Сохранить в карту:</span>
            <button
              type="button"
              disabled={elapsedMs <= 0}
              onClick={() => handleRecordToChart('left')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                justSavedSide === 'left' || (activeSide === 'left' && leftHoldSec !== undefined)
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {justSavedSide === 'left' && <Check className="w-3 h-3" />}
              <span>Левая (L){elapsedMs > 0 ? `: ${formattedSec} с` : ''}</span>
            </button>

            <button
              type="button"
              disabled={elapsedMs <= 0}
              onClick={() => handleRecordToChart('right')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                justSavedSide === 'right' || (activeSide === 'right' && rightHoldSec !== undefined)
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {justSavedSide === 'right' && <Check className="w-3 h-3" />}
              <span>Правая (R){elapsedMs > 0 ? `: ${formattedSec} с` : ''}</span>
            </button>
          </div>

          {(leftHoldSec !== undefined || rightHoldSec !== undefined) && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums">
              {leftHoldSec !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                    classifyHoldFatigue(leftHoldSec).badgeClass
                  }`}
                >
                  Л: {leftHoldSec.toFixed(1)} с
                  <button
                    type="button"
                    onClick={() => onSaveHoldTime('left', undefined)}
                    className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                    aria-label="Очистить время слева"
                  >
                    ×
                  </button>
                </span>
              )}
              {rightHoldSec !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
                    classifyHoldFatigue(rightHoldSec).badgeClass
                  }`}
                >
                  П: {rightHoldSec.toFixed(1)} с
                  <button
                    type="button"
                    onClick={() => onSaveHoldTime('right', undefined)}
                    className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                    aria-label="Очистить время справа"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
