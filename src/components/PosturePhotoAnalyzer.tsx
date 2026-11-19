import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MUSCLES, MYOFASCIAL_CHAINS } from '../data';
import {
  PostureAssessmentRecord,
  PostureCalibrationLine,
  PostureLandmarkPoint,
  PosturePhase,
  PosturePhotoView,
  SelectedEntity,
} from '../types/atlas';
import {
  POSTURE_PHASE_META,
  POSTURE_SETUP_GUIDELINES,
  POSTURE_VIEW_META,
  calculatePostureMetrics,
  comparePostureAssessments,
  createDefaultCalibration,
  createDefaultLandmarksForView,
} from '../utils/postureAnalysisEngine';
import { createEntityId } from '../utils/patientDatabase';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Compass,
  Crosshair,
  GitCompare,
  Grid,
  Info,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';

interface PosturePhotoAnalyzerProps {
  assessments: PostureAssessmentRecord[];
  onSaveAssessment: (record: PostureAssessmentRecord) => void;
  onDeleteAssessment: (id: string) => void;
  onAddMusclesToMmt?: (muscleIds: string[], switchToMmtMuscleId?: string) => void;
  onGoToMmt?: () => void;
  onOpenInAtlas?: (entity: SelectedEntity) => void;
  patientId?: string;
  visitId?: string;
  compactMode?: boolean;
}

type ToolInteractionMode = 'landmarks' | 'laser';

function compressImageToDataUrl(file: File): Promise<{ dataUrl: string; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1150;
        let w = img.naturalWidth || 800;
        let h = img.naturalHeight || 1066;
        const aspect = w / h;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            w = maxDim;
            h = Math.round(maxDim / aspect);
          } else {
            h = maxDim;
            w = Math.round(maxDim * aspect);
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: String(reader.result), aspectRatio: aspect });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.84),
          aspectRatio: Number(aspect.toFixed(4)),
        });
      };
      img.onerror = () => reject(new Error('Не удалось декодировать изображение.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
    reader.readAsDataURL(file);
  });
}

function generateReferenceTemplateDataUrl(view: PosturePhotoView): {
  dataUrl: string;
  aspectRatio: number;
} {
  const w = 600;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: '', aspectRatio: 0.75 };

  // Calibration studio backdrop with laser grid
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 50; x < w; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 50; y < h; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Simulated green/cyan vertical & horizontal laser level beam
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 20);
  ctx.lineTo(w / 2, h - 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(40, h * 0.47);
  ctx.lineTo(w - 40, h * 0.47);
  ctx.stroke();

  // Simplified schematic silhouette for practice calibration
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.fillStyle = 'rgba(51, 65, 85, 0.55)';
  ctx.lineWidth = 2;

  if (view === 'anterior' || view === 'posterior') {
    // Head
    ctx.beginPath();
    ctx.ellipse(300, 102, 34, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Torso
    ctx.beginPath();
    ctx.moveTo(222, 190);
    ctx.lineTo(378, 190);
    ctx.lineTo(348, 385);
    ctx.lineTo(252, 385);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Legs
    ctx.strokeRect(256, 385, 36, 330);
    ctx.strokeRect(308, 385, 36, 330);
  } else {
    const dir = view === 'lateral_left' ? -1 : 1;
    ctx.beginPath();
    ctx.ellipse(300 + dir * 10, 102, 32, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeRect(272, 184, 56, 200);
    ctx.strokeRect(280, 384, 40, 330);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px ui-monospace, monospace';
  ctx.fillText(`КАЛИБРОВОЧНЫЙ ШАБЛОН · ${POSTURE_VIEW_META[view].shortLabel.toUpperCase()}`, 24, 34);

  return { dataUrl: canvas.toDataURL('image/png'), aspectRatio: 0.75 };
}

export const PosturePhotoAnalyzer: React.FC<PosturePhotoAnalyzerProps> = ({
  assessments,
  onSaveAssessment,
  onDeleteAssessment,
  onAddMusclesToMmt,
  onGoToMmt,
  onOpenInAtlas,
  patientId,
  visitId,
  compactMode = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasBoxRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<PosturePhotoView>('anterior');
  const [phase, setPhase] = useState<PosturePhase>('before');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [calibration, setCalibration] = useState<PostureCalibrationLine>(createDefaultCalibration);
  const [landmarks, setLandmarks] = useState<PostureLandmarkPoint[]>(() =>
    createDefaultLandmarksForView('anterior')
  );
  const [notes, setNotes] = useState('');
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);

  const [interactionMode, setInteractionMode] = useState<ToolInteractionMode>('landmarks');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<
    { kind: 'landmark'; id: string } | { kind: 'laser'; end: 1 | 2 } | null
  >(null);
  const [showLaserGrid, setShowLaserGrid] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [compareBeforeId, setCompareBeforeId] = useState<string>('');
  const [compareAfterId, setCompareAfterId] = useState<string>('');

  // Auto-select pair for Before/After comparison when assessments change
  useEffect(() => {
    const befores = assessments.filter((a) => a.phase === 'before');
    const afters = assessments.filter((a) => a.phase === 'after' || a.phase === 'followup');
    if (!compareBeforeId && befores[0]) setCompareBeforeId(befores[0].id);
    if (!compareAfterId && afters[0]) {
      const sameViewAfter = afters.find((a) => a.view === befores[0]?.view) ?? afters[0];
      setCompareAfterId(sameViewAfter.id);
    }
  }, [assessments, compareBeforeId, compareAfterId]);

  const metrics = useMemo(
    () => calculatePostureMetrics(view, landmarks, calibration),
    [view, landmarks, calibration]
  );

  const handleViewChange = (nextView: PosturePhotoView) => {
    setView(nextView);
    setLandmarks(createDefaultLandmarksForView(nextView));
    setSelectedLandmarkId(null);
    setEditingAssessmentId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, aspectRatio } = await compressImageToDataUrl(file);
      setPhotoDataUrl(dataUrl);
      setCalibration((prev) => ({ ...prev, aspectRatio }));
      setEditingAssessmentId(null);
      setSaveSuccessMsg(null);
    } catch {
      // ignore invalid file
    } finally {
      e.target.value = '';
    }
  };

  const handleLoadPracticeTemplate = () => {
    const tpl = generateReferenceTemplateDataUrl(view);
    if (!tpl.dataUrl) return;
    setPhotoDataUrl(tpl.dataUrl);
    setCalibration((prev) => ({ ...prev, aspectRatio: tpl.aspectRatio }));
    setLandmarks(createDefaultLandmarksForView(view));
    setEditingAssessmentId(null);
  };

  const getNormalizedCoords = useCallback((clientX: number, clientY: number) => {
    const box = canvasBoxRef.current;
    if (!box) return null;
    const rect = box.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingTarget) return;
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    if (!pt) return;
    if (draggingTarget.kind === 'landmark') {
      setLandmarks((prev) =>
        prev.map((lm) => (lm.id === draggingTarget.id ? { ...lm, x: pt.x, y: pt.y } : lm))
      );
    } else if (draggingTarget.kind === 'laser') {
      setCalibration((prev) =>
        draggingTarget.end === 1
          ? { ...prev, plumbX1: pt.x, plumbY1: pt.y }
          : { ...prev, plumbX2: pt.x, plumbY2: pt.y }
      );
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingTarget) return;
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('[data-handle="true"]')) return;
    const pt = getNormalizedCoords(e.clientX, e.clientY);
    if (!pt) return;

    if (interactionMode === 'landmarks' && selectedLandmarkId) {
      setLandmarks((prev) =>
        prev.map((lm) => (lm.id === selectedLandmarkId ? { ...lm, x: pt.x, y: pt.y } : lm))
      );
      // Advance to next landmark for super-fast workflow!
      const idx = landmarks.findIndex((l) => l.id === selectedLandmarkId);
      if (idx >= 0 && idx < landmarks.length - 1) {
        setSelectedLandmarkId(landmarks[idx + 1].id);
      }
    }
  };

  const handleSaveCurrentAssessment = () => {
    if (!photoDataUrl) return;
    const record: PostureAssessmentRecord = {
      id: editingAssessmentId ?? createEntityId('post'),
      patientId,
      visitId,
      phase,
      view,
      capturedAt: new Date().toISOString(),
      photoDataUrl,
      laserCalibration: {
        ...calibration,
        verticalOffsetDeg: metrics.laserOffsetDeg,
      },
      landmarks,
      angles: metrics.angles,
      summaryVector: metrics.summaryVector,
      priorityMuscleIds: metrics.priorityMuscleIds,
      notes: notes.trim() || undefined,
    };
    onSaveAssessment(record);
    setEditingAssessmentId(record.id);
    setSaveSuccessMsg('Замер по фото и углы отклонений сохранены в карту приёма');
    setTimeout(() => setSaveSuccessMsg(null), 3200);
  };

  const handleLoadAssessmentForEdit = (rec: PostureAssessmentRecord) => {
    setEditingAssessmentId(rec.id);
    setView(rec.view);
    setPhase(rec.phase);
    setPhotoDataUrl(rec.photoDataUrl);
    setCalibration(rec.laserCalibration);
    setLandmarks(rec.landmarks);
    setNotes(rec.notes ?? '');
    setSelectedLandmarkId(null);
  };

  const compareBefore = assessments.find((a) => a.id === compareBeforeId) ?? null;
  const compareAfter = assessments.find((a) => a.id === compareAfterId) ?? null;
  const comparisonRows = useMemo(() => {
    if (!compareBefore || !compareAfter || compareBefore.id === compareAfter.id) return [];
    return comparePostureAssessments(compareBefore, compareAfter);
  }, [compareBefore, compareAfter]);

  // Helper line segments per view for optical overlay
  const overlayPairs = useMemo(() => {
    const byId = new Map(landmarks.map((l) => [l.id, l]));
    const pairs: Array<{ a: PostureLandmarkPoint; b: PostureLandmarkPoint; color: string; dashed?: boolean }> = [];
    const add = (id1: string, id2: string, color: string, dashed = false) => {
      const a = byId.get(id1);
      const b = byId.get(id2);
      if (a && b) pairs.push({ a, b, color, dashed });
    };
    if (view === 'anterior') {
      add('ear_r', 'ear_l', '#38bdf8');
      add('acromion_r', 'acromion_l', '#38bdf8');
      add('asis_r', 'asis_l', '#f59e0b');
      add('knee_r', 'knee_l', '#a78bfa');
      add('ankle_r', 'ankle_l', '#a78bfa');
      add('asis_r', 'knee_r', '#fb7185', true);
      add('knee_r', 'ankle_r', '#fb7185', true);
      add('asis_l', 'knee_l', '#34d399', true);
      add('knee_l', 'ankle_l', '#34d399', true);
    } else if (view === 'posterior') {
      add('occiput_l', 'occiput_r', '#38bdf8');
      add('scapula_l', 'scapula_r', '#38bdf8');
      add('psis_l', 'psis_r', '#f59e0b');
      add('heel_l', 'heel_r', '#a78bfa');
      add('c7', 's1', '#f43f5e', true);
    } else {
      add('tragus', 'acromion', '#38bdf8', true);
      add('acromion', 'trochanter', '#38bdf8');
      add('asis_lat', 'psis_lat', '#f59e0b');
      add('trochanter', 'knee_lat', '#34d399');
      add('knee_lat', 'malleolus_lat', '#34d399');
      add('tragus', 'malleolus_lat', '#f43f5e', true);
    }
    return pairs;
  }, [view, landmarks]);

  const severityBadgeClass = (sev: 'normal' | 'mild' | 'significant') => {
    if (sev === 'significant') return 'text-rose-700 bg-rose-50 border-rose-200';
    if (sev === 'mild') return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-700 font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Оптический гониометр · Лазерная калибровка</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Анализ положения тела и конечностей по фотографии (углы и вектор внимания)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Загрузите вертикальный снимок пациента с лазерным уровнем, откалибруйте отвес лазера и
              расставьте анатомические ориентиры — система рассчитает углы перекоса, определит
              приоритетные мышцы и сохранит результат в карту пациента для сравнения «До / После».
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSetupGuide((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-blue-700" />
              <span>{showSetupGuide ? 'Скрыть памятку ориентиров' : 'Ориентиры и съёмка лазером'}</span>
            </button>
            {onGoToMmt && (
              <button
                type="button"
                onClick={onGoToMmt}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Перейти к ММТ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Setup & Anatomical Markers Guide */}
        {showSetupGuide && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="font-bold text-slate-900">
              Рекомендации по фотосъёмке с лазерным уровнем и дополнительные ориентиры
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POSTURE_SETUP_GUIDELINES.map((g) => (
                <div key={g.title} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="font-semibold text-slate-900">{g.title}</div>
                  <p className="text-slate-600 leading-relaxed">{g.detail}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-lg space-y-1">
              <div className="font-semibold text-cyan-950">
                Дополнительные ориентиры для проекции «{POSTURE_VIEW_META[view].shortLabel}»:
              </div>
              <p className="text-slate-700">{POSTURE_VIEW_META[view].laserSetupTip}</p>
              <ul className="list-disc pl-5 text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 pt-1">
                {POSTURE_VIEW_META[view].additionalMarkers.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Controls Strip: Phase + View + Upload */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Phase Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['before', 'after', 'followup'] as PosturePhase[]).map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setPhase(ph)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    phase === ph
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {POSTURE_PHASE_META[ph].label}
                </button>
              ))}
            </div>

            {/* Anatomical View Selector */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['anterior', 'posterior', 'lateral_left', 'lateral_right'] as PosturePhotoView[]).map(
                (vw) => (
                  <button
                    key={vw}
                    type="button"
                    onClick={() => handleViewChange(vw)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      view === vw
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {POSTURE_VIEW_META[vw].shortLabel}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleFileUpload(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{photoDataUrl ? 'Заменить фото' : 'Загрузить фото с лазером'}</span>
            </button>
            <button
              type="button"
              onClick={handleLoadPracticeTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Открыть калибровочную сетку-шаблон для разметки без фото"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-700" />
              <span>Калибр. шаблон</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Optical Viewport + Telemetry & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Calibrated Interactive Photo Canvas */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 text-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInteractionMode('landmarks')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                  interactionMode === 'landmarks'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Метки тела</span>
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode('laser')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                  interactionMode === 'laser'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Калибровка лазера</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
              <span className="text-slate-300">
                Поправка лазера:{' '}
                <strong className="text-cyan-300">
                  {metrics.laserOffsetDeg > 0 ? `+${metrics.laserOffsetDeg}` : metrics.laserOffsetDeg}°
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setShowLaserGrid((v) => !v)}
                className={`p-1 rounded border cursor-pointer ${
                  showLaserGrid
                    ? 'border-cyan-500/60 text-cyan-300 bg-slate-800'
                    : 'border-slate-700 text-slate-400'
                }`}
                title="Переключить координатную сетку лазера"
                aria-label="Сетка лазера"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalibration((prev) => ({
                    ...createDefaultCalibration(),
                    aspectRatio: prev.aspectRatio,
                  }));
                  setLandmarks(createDefaultLandmarksForView(view));
                }}
                className="p-1 rounded border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Сбросить метки и отвес"
                aria-label="Сбросить метки"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Optical Viewport */}
          {!photoDataUrl ? (
            <div className="bg-slate-950 text-slate-200 p-8 min-h-[480px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center">
                <Camera className="w-7 h-7 text-cyan-400" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-sm font-bold text-white">
                  Загрузите вертикальное фото с лазерным уровнем
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {POSTURE_VIEW_META[view].laserSetupTip}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Выбрать фото (.jpg / .png)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadPracticeTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer"
                >
                  <span>Открыть шаблон-сетку</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-3 flex flex-col items-center">
              <div
                ref={canvasBoxRef}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDraggingTarget(null)}
                onPointerLeave={() => setDraggingTarget(null)}
                onClick={handleCanvasClick}
                className="relative w-full max-w-[520px] select-none touch-none overflow-hidden rounded-lg border border-slate-700 cursor-crosshair"
                style={{
                  aspectRatio: String(calibration.aspectRatio || 0.75),
                }}
              >
                <img
                  src={photoDataUrl}
                  alt={`Постурограмма ${POSTURE_VIEW_META[view].label}`}
                  className="w-full h-full object-contain pointer-events-none block"
                  draggable={false}
                />

                {/* SVG Vector & Laser Overlay */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  {/* Background Grid */}
                  {showLaserGrid && (
                    <g stroke="rgba(148,163,184,0.22)" strokeWidth="0.22">
                      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
                        <React.Fragment key={v}>
                          <line x1={v} y1={0} x2={v} y2={100} />
                          <line x1={0} y1={v} x2={100} y2={v} />
                        </React.Fragment>
                      ))}
                    </g>
                  )}

                  {/* Laser Reference Plumb Line */}
                  <line
                    x1={calibration.plumbX1}
                    y1={calibration.plumbY1}
                    x2={calibration.plumbX2}
                    y2={calibration.plumbY2}
                    stroke="#ef4444"
                    strokeWidth="0.55"
                    strokeDasharray="1.8 1.1"
                  />

                  {/* Anatomical Segment Vectors */}
                  {overlayPairs.map((seg, i) => (
                    <line
                      key={i}
                      x1={seg.a.x}
                      y1={seg.a.y}
                      x2={seg.b.x}
                      y2={seg.b.y}
                      stroke={seg.color}
                      strokeWidth="0.55"
                      strokeDasharray={seg.dashed ? '1.4 0.9' : undefined}
                    />
                  ))}
                </svg>

                {/* Laser Calibration Handles */}
                {interactionMode === 'laser' && (
                  <>
                    {(
                      [
                        { end: 1 as const, x: calibration.plumbX1, y: calibration.plumbY1, lbl: 'Лазер верх' },
                        { end: 2 as const, x: calibration.plumbX2, y: calibration.plumbY2, lbl: 'Лазер низ' },
                      ] as const
                    ).map((h) => (
                      <div
                        key={h.end}
                        data-handle="true"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDraggingTarget({ kind: 'laser', end: h.end });
                        }}
                        style={{ left: `${h.x}%`, top: `${h.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-rose-600/90 border-2 border-white shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center"
                        title={h.lbl}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    ))}
                  </>
                )}

                {/* Landmark Draggable Crosshair Handles */}
                {landmarks.map((lm) => {
                  const isSelected = selectedLandmarkId === lm.id;
                  return (
                    <div
                      key={lm.id}
                      data-handle="true"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setInteractionMode('landmarks');
                        setSelectedLandmarkId(lm.id);
                        setDraggingTarget({ kind: 'landmark', id: lm.id });
                      }}
                      style={{ left: `${lm.x}%`, top: `${lm.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group ${
                        isSelected ? 'z-20' : 'z-10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform ${
                          isSelected
                            ? 'bg-cyan-400 border-white scale-125 shadow-lg'
                            : 'bg-slate-900/80 border-cyan-400 hover:scale-110'
                        }`}
                      >
                        <div className="w-1 h-1 rounded-full bg-white" />
                      </div>
                      <span
                        className={`pointer-events-none absolute left-3 -top-2 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900/85 text-slate-100 border border-slate-700'
                        }`}
                      >
                        {lm.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Landmark Quick Selector Strip under canvas */}
              <div className="w-full max-w-[520px] mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-mono">
                  {interactionMode === 'laser'
                    ? 'Перетащите 2 красные точки на луч лазера в фото'
                    : 'Клик по метке → клик на фото для быстрого позиционирования:'}
                </span>
                <div className="w-full flex flex-wrap gap-1 pt-0.5">
                  {landmarks.map((lm) => {
                    const active = selectedLandmarkId === lm.id;
                    return (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => {
                          setInteractionMode('landmarks');
                          setSelectedLandmarkId(active ? null : lm.id);
                        }}
                        className={`px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {lm.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Calculated Angles, Doctor Attention Vectors & Save Actions */}
        <div className="lg:col-span-6 space-y-4">
          {/* Primary Clinical Summary Vector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Рассчитанные углы отклонений и вектор внимания врача
                </h3>
                <p className="text-[11px] text-slate-500">
                  {POSTURE_VIEW_META[view].label} · Компенсация наклона камеры:{' '}
                  <span className="font-mono tabular-nums">{metrics.laserOffsetDeg}°</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccessMsg && (
                  <span className="text-xs font-medium text-emerald-700">{saveSuccessMsg}</span>
                )}
                <button
                  type="button"
                  disabled={!photoDataUrl}
                  onClick={handleSaveCurrentAssessment}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingAssessmentId ? 'Обновить замер' : 'Сохранить фото-анализ'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs leading-relaxed">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1">
                Куда направить вектор внимания
              </div>
              {metrics.summaryVector}
            </div>

            {/* Angles Table */}
            <div className="space-y-2">
              {metrics.angles.map((ang) => (
                <div
                  key={ang.id}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/60 space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{ang.label}</div>
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${
                          ang.severity === 'significant'
                            ? 'text-rose-700'
                            : ang.severity === 'mild'
                              ? 'text-amber-800'
                              : 'text-emerald-700'
                        }`}
                      >
                        {ang.deviationDirection}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded border font-mono text-xs font-bold tabular-nums shrink-0 ${severityBadgeClass(
                        ang.severity
                      )}`}
                    >
                      {ang.angleDeg > 0 ? `+${ang.angleDeg.toFixed(1)}°` : `${ang.angleDeg.toFixed(1)}°`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">{ang.attentionVector}</p>

                  {ang.recommendedChainIds.length > 0 && onOpenInAtlas && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                      <span className="text-slate-400">Цепи:</span>
                      {ang.recommendedChainIds.map((cId) => {
                        const ch = MYOFASCIAL_CHAINS.find((c) => c.id === cId);
                        if (!ch) return null;
                        return (
                          <button
                            key={cId}
                            type="button"
                            onClick={() => onOpenInAtlas({ type: 'chain', id: cId })}
                            className="text-blue-700 hover:underline font-medium cursor-pointer"
                          >
                            {ch.name} →
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recommended MMT Target Muscles */}
            {metrics.priorityMuscleIds.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    Приоритетные мышцы для ММТ по отклонениям углов ({metrics.priorityMuscleIds.length}):
                  </span>
                  {onAddMusclesToMmt && (
                    <button
                      type="button"
                      onClick={() =>
                        onAddMusclesToMmt(
                          metrics.priorityMuscleIds,
                          metrics.priorityMuscleIds[0]
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить в план и открыть ММТ</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {metrics.priorityMuscleIds.map((mId) => {
                    const m = MUSCLES.find((item) => item.id === mId);
                    if (!m) return null;
                    return (
                      <span
                        key={mId}
                        className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-medium"
                      >
                        {m.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes input */}
            <div className="pt-2 border-t border-slate-200">
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Примечание к постурограмме:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Например: съёмка с лазерным отвесом до коррекции таза и К-27..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Saved Photos & Before / After Comparison inside Patient Card */}
      {!compactMode && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-blue-700" />
                <span>Сохранённые фото-анализы и динамика «До / После» ({assessments.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Все сохранённые снимки и углы автоматически прикрепляются к карте пациента для
                сравнения результатов до и после коррекции.
              </p>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Пока нет сохранённых замеров по фото. Загрузите снимок выше и нажмите «Сохранить
                фото-анализ», чтобы зафиксировать исходные углы «До коррекции».
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Gallery of saved assessments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assessments.map((rec) => {
                  const phaseMeta = POSTURE_PHASE_META[rec.phase];
                  const sigCount = rec.angles.filter((a) => a.severity === 'significant').length;
                  return (
                    <div
                      key={rec.id}
                      className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded border text-[10px] font-semibold ${phaseMeta.badgeClass}`}
                          >
                            {phaseMeta.label}
                          </span>
                          <div className="font-bold text-slate-900 mt-1">
                            {POSTURE_VIEW_META[rec.view].shortLabel}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                            {new Date(rec.capturedAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <img
                          src={rec.photoDataUrl}
                          alt="Миниатюра"
                          className="w-14 h-18 object-cover rounded border border-slate-300 bg-slate-900 shrink-0"
                        />
                      </div>

                      <div className="text-[11px] text-slate-600 line-clamp-2">
                        {rec.summaryVector}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          Откл. &gt;пор.: <strong className="text-slate-800">{sigCount}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadAssessmentForEdit(rec)}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer"
                          >
                            Открыть
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAssessment(rec.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            aria-label="Удалить замер"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Before vs After Comparator */}
              {assessments.length >= 2 && (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-900">
                      Сравнение углов «До» и «После» (Δ коррекции)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={compareBeforeId}
                        onChange={(e) => setCompareBeforeId(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                      >
                        <option value="">Замер «До»...</option>
                        {assessments.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{POSTURE_PHASE_META[a.phase].label}] {POSTURE_VIEW_META[a.view].shortLabel} (
                            {new Date(a.capturedAt).toLocaleDateString('ru-RU')})
                          </option>
                        ))}
                      </select>
                      <span className="text-slate-400">vs</span>
                      <select
                        value={compareAfterId}
                        onChange={(e) => setCompareAfterId(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                      >
                        <option value="">Замер «После»...</option>
                        {assessments.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{POSTURE_PHASE_META[a.phase].label}] {POSTURE_VIEW_META[a.view].shortLabel} (
                            {new Date(a.capturedAt).toLocaleDateString('ru-RU')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {comparisonRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse bg-white rounded-lg overflow-hidden border border-slate-200">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-left">
                            <th className="px-3 py-2 font-semibold">Угол / сегмент</th>
                            <th className="px-3 py-2 font-semibold">До</th>
                            <th className="px-3 py-2 font-semibold">После</th>
                            <th className="px-3 py-2 font-semibold">Динамика Δ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {comparisonRows.map((row) => (
                            <tr key={row.metricId}>
                              <td className="px-3 py-2 font-medium text-slate-900">{row.label}</td>
                              <td className="px-3 py-2 font-mono tabular-nums text-rose-700">
                                {row.beforeDeg.toFixed(1)}°
                              </td>
                              <td className="px-3 py-2 font-mono tabular-nums text-emerald-700">
                                {row.afterDeg.toFixed(1)}°
                              </td>
                              <td className="px-3 py-2 font-mono tabular-nums">
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    row.improved
                                      ? 'text-emerald-700'
                                      : row.deltaAbsDeg > 0.3
                                        ? 'text-rose-700'
                                        : 'text-slate-500'
                                  }`}
                                >
                                  {row.improved && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {row.deltaAbsDeg > 0
                                    ? `+${row.deltaAbsDeg.toFixed(1)}°`
                                    : `${row.deltaAbsDeg.toFixed(1)}°`}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Выберите два замера одной и той же проекции (например, «Спереди До» и «Спереди После»),
                      чтобы рассчитать дельту углов.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
