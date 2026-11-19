import React, { useMemo, useRef, useState } from 'react';
import { ANATOMICAL_ZONES, MUSCLES } from '../data';
import {
  BODY_SILHOUETTE_PLATE,
  MUSCLE_PLATE_COORDS,
  describeBodySide,
  findNearestMuscles,
  inferBodyViewFromX,
  inferZoneFromCoord,
} from '../data/musclePlateCoords';
import {
  BodyPosturePosition,
  PainMapPoint,
  PainMarkerType,
  SelectedEntity,
  TriggerPostureBehavior,
} from '../types/atlas';
import {
  BODY_POSTURE_META,
  PAIN_MARKER_META,
  TRIGGER_BEHAVIOR_META,
  buildPainMapRecommendations,
  getEffectiveMuscleIdsForPoint,
} from '../utils/painMapRecommendations';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Plus,
  Save,
  Sparkles,
  Stethoscope,
  Trash2,
  Zap,
} from 'lucide-react';

interface PainMapViewProps {
  points: PainMapPoint[];
  onChangePoints: (nextPoints: PainMapPoint[]) => void;
  muscleQueue: string[];
  onAddMusclesToQueue: (muscleIds: string[], switchToMmtMuscleId?: string) => void;
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onSaveToPatient?: () => Promise<void> | void;
  hasLinkedPatient?: boolean;
  saveFeedback?: string | null;
  onProceedToPosture?: () => void;
  onGoToMmt?: () => void;
}

type ViewFocus = 'both' | 'anterior' | 'posterior';

function createPointId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pm_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `pm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const PainMapView: React.FC<PainMapViewProps> = ({
  points,
  onChangePoints,
  muscleQueue,
  onAddMusclesToQueue,
  onOpenInAtlas,
  onSaveToPatient,
  hasLinkedPatient = false,
  saveFeedback = null,
  onProceedToPosture,
  onGoToMmt,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeTool, setActiveTool] = useState<PainMarkerType>('pain');
  const [activePosture, setActivePosture] = useState<BodyPosturePosition>('standing');
  const [defaultTriggerBehavior, setDefaultTriggerBehavior] =
    useState<TriggerPostureBehavior>('varies_with_posture');
  const [postureFilter, setPostureFilter] = useState<'all' | BodyPosturePosition>('all');
  const [viewFocus, setViewFocus] = useState<ViewFocus>('both');
  const [defaultIntensity, setDefaultIntensity] = useState<number>(6);
  const [showMuscleLandmarks, setShowMuscleLandmarks] = useState<boolean>(true);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(
    points[0]?.id ?? null
  );
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    zoneName: string;
    nearestMuscleName: string;
  } | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const visiblePoints = useMemo(() => {
    if (postureFilter === 'all') return points;
    return points.filter((p) => (p.posture ?? 'standing') === postureFilter);
  }, [points, postureFilter]);

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedPointId) ?? null,
    [points, selectedPointId]
  );

  const recommendations = useMemo(
    () => buildPainMapRecommendations(points),
    [points]
  );

  const viewBoxStr = useMemo(() => {
    if (viewFocus === 'anterior') return `0 0 500 ${BODY_SILHOUETTE_PLATE.height}`;
    if (viewFocus === 'posterior') return `500 0 500 ${BODY_SILHOUETTE_PLATE.height}`;
    return `0 0 ${BODY_SILHOUETTE_PLATE.width} ${BODY_SILHOUETTE_PLATE.height}`;
  }, [viewFocus]);

  const clientToSvgCoord = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    const clampedX = Math.max(0, Math.min(BODY_SILHOUETTE_PLATE.width, Math.round(transformed.x)));
    const clampedY = Math.max(0, Math.min(BODY_SILHOUETTE_PLATE.height, Math.round(transformed.y)));
    return { x: clampedX, y: clampedY };
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coord = clientToSvgCoord(e.clientX, e.clientY);
    if (!coord) return;
    const zoneId = inferZoneFromCoord(coord.x, coord.y);
    const zoneMeta = ANATOMICAL_ZONES.find((z) => z.id === zoneId);
    const bodyView = inferBodyViewFromX(coord.x);
    const aspectLabel =
      bodyView === 'anterior'
        ? zoneMeta?.anteriorAspect.shortLabel
        : zoneMeta?.posteriorAspect.shortLabel;
    const zoneName = `${zoneMeta?.shortName ?? ''} (${aspectLabel ?? ''})`;
    const nearest = findNearestMuscles(coord.x, coord.y, MUSCLES, 1)[0];
    setHoverInfo({
      x: coord.x,
      y: coord.y,
      zoneName,
      nearestMuscleName: nearest?.muscle.name ?? '',
    });
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    if (target.closest('[data-pain-marker="true"]')) return;

    const coord = clientToSvgCoord(e.clientX, e.clientY);
    if (!coord) return;

    const nearest = findNearestMuscles(coord.x, coord.y, MUSCLES, 3);
    const matchedMuscleIds = nearest.map((item) => item.muscle.id);
    const zoneId = inferZoneFromCoord(coord.x, coord.y);

    const newPoint: PainMapPoint = {
      id: createPointId(),
      type: activeTool,
      view: inferBodyViewFromX(coord.x),
      x: coord.x,
      y: coord.y,
      intensity: activeTool === 'weak_muscle' ? undefined : defaultIntensity,
      posture: activePosture,
      triggerBehavior: defaultTriggerBehavior,
      zoneId,
      matchedMuscleIds,
      primaryMuscleId: matchedMuscleIds[0],
      note: '',
      createdAt: new Date().toISOString(),
    };

    const next = [...points, newPoint];
    onChangePoints(next);
    setSelectedPointId(newPoint.id);
    setConfirmClearAll(false);
  };

  const updatePoint = (id: string, patch: Partial<PainMapPoint>) => {
    onChangePoints(points.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePoint = (id: string) => {
    const next = points.filter((p) => p.id !== id);
    onChangePoints(next);
    if (selectedPointId === id) {
      setSelectedPointId(next[0]?.id ?? null);
    }
  };

  const queuedSet = useMemo(() => new Set(muscleQueue), [muscleQueue]);

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Marker Tool Mode + Silhouette View + Save */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Карта боли, триггерных точек и слабых мышц
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Выберите режим отметки и кликните по силуэту человека. Координаты сохраняются в карту
              пациента, а справочник автоматически подбирает мышцы, рефлексы, причины и коррекцию.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {saveFeedback && (
              <span className="text-xs font-medium text-emerald-700">{saveFeedback}</span>
            )}
            {onSaveToPatient && (
              <button
                type="button"
                onClick={onSaveToPatient}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {hasLinkedPatient ? 'Сохранить в карту пациента' : 'Сохранить карту боли'}
                </span>
              </button>
            )}
            {onProceedToPosture && (
              <button
                type="button"
                onClick={onProceedToPosture}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Далее: Анализ углов по фото</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {(recommendations.recommendedQueueMuscleIds.length > 0 || onGoToMmt) && (
              <button
                type="button"
                onClick={() => {
                  if (recommendations.recommendedQueueMuscleIds.length > 0) {
                    onAddMusclesToQueue(
                      recommendations.recommendedQueueMuscleIds,
                      recommendations.recommendedQueueMuscleIds[0]
                    );
                  } else if (onGoToMmt) {
                    onGoToMmt();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  Перейти к ММТ
                  {recommendations.recommendedQueueMuscleIds.length > 0
                    ? ` (+${recommendations.recommendedQueueMuscleIds.length})`
                    : ''}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mode & View Segmented Controls */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Marker Type Tool */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Инструмент клика:</span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  {
                    id: 'pain' as PainMarkerType,
                    label: 'Зона боли',
                    icon: Flame,
                    activeClass: 'bg-rose-600 text-white shadow-xs',
                  },
                  {
                    id: 'trigger_point' as PainMarkerType,
                    label: 'Триггерная точка',
                    icon: Zap,
                    activeClass: 'bg-amber-600 text-white shadow-xs',
                  },
                  {
                    id: 'weak_muscle' as PainMarkerType,
                    label: 'Слабая мышца',
                    icon: Activity,
                    activeClass: 'bg-blue-700 text-white shadow-xs',
                  },
                ] as const
              ).map((tool) => {
                const Icon = tool.icon;
                const active = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active ? tool.activeClass : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTool !== 'weak_muscle' && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 ml-1">
                <span>ВАШ:</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={defaultIntensity}
                  onChange={(e) => setDefaultIntensity(Number(e.target.value))}
                  className="w-20 accent-rose-600 cursor-pointer"
                />
                <span className="font-mono tabular-nums font-semibold text-slate-900 w-7">
                  {defaultIntensity}/10
                </span>
              </label>
            )}
          </div>

          {/* Silhouette Focus & Landmarks */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'both', label: 'Спереди и сзади' },
                  { id: 'anterior', label: 'Спереди' },
                  { id: 'posterior', label: 'Сзади' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewFocus(v.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewFocus === v.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowMuscleLandmarks((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showMuscleLandmarks
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showMuscleLandmarks ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>Ориентиры мышц</span>
            </button>
          </div>
        </div>

        {/* Body Posture (Standing / Sitting / Lying) & Trigger Behavior Controls */}
        <div className="pt-3 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Положение тела при отметке:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['standing', 'sitting', 'lying'] as BodyPosturePosition[]).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setActivePosture(pos)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePosture === pos
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {BODY_POSTURE_META[pos].label}
                </button>
              ))}
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <span className="font-medium text-slate-600">Реакция триггера:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['varies_with_posture', 'constant_all_postures'] as TriggerPostureBehavior[]).map(
                (beh) => (
                  <button
                    key={beh}
                    type="button"
                    onClick={() => setDefaultTriggerBehavior(beh)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      defaultTriggerBehavior === beh
                        ? beh === 'constant_all_postures'
                          ? 'bg-violet-700 text-white shadow-xs'
                          : 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {TRIGGER_BEHAVIOR_META[beh].shortLabel}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">Фильтр по позе:</span>
            {(
              [
                { id: 'all' as const, label: `Все (${points.length})` },
                { id: 'standing' as const, label: `Стоя (${recommendations.postureCounts.standing})` },
                { id: 'sitting' as const, label: `Сидя (${recommendations.postureCounts.sitting})` },
                { id: 'lying' as const, label: `Лёжа (${recommendations.postureCounts.lying})` },
              ] as const
            ).map((pf) => (
              <button
                key={pf.id}
                type="button"
                onClick={() => setPostureFilter(pf.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer ${
                  postureFilter === pf.id
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Autonomic / Somatic Nervous System Alert when Trigger Does NOT Change across Standing/Sitting/Lying */}
      {recommendations.autonomicSomaticAlert && (
        <div className="p-4 bg-violet-50 border border-violet-300 rounded-xl space-y-2.5 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-violet-950">
                  Клинический сигнал: триггер/боль НЕ меняется при смене позы (Стоя / Сидя / Лёжа)
                </div>
                <p className="text-slate-700 leading-relaxed max-w-4xl">
                  Когда болевой триггер остаётся одинаковым во всех трёх положениях (стоя, сидя и
                  лёжа), ведущая причина выходит за рамки чистой гравитационной биомеханики — это
                  прямой намёк на нарушение{' '}
                  <strong>вегетативной (ВНС) и соматической нервной системы</strong> (центральная
                  сенситизация, дисфункция блуждающего нерва, переключатель KI-27, краниосакральный
                  или висцерально-вегетативный конфликт).
                </p>
              </div>
            </div>

            {onGoToMmt && (
              <button
                type="button"
                onClick={onGoToMmt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Проверить в ММТ (KI-27 / ТЛ НС)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recommendations.recommendedNeuroProfiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-violet-200/80">
              <span className="font-semibold text-violet-900 inline-flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                Открыть протоколы НС в Атласе:
              </span>
              {recommendations.recommendedNeuroProfiles.map((np) => (
                <button
                  key={np.id}
                  type="button"
                  onClick={() => onOpenInAtlas({ type: 'neuro', id: np.id })}
                  className="px-2.5 py-1 bg-white border border-violet-200 hover:bg-violet-100 text-violet-900 font-medium rounded-md cursor-pointer"
                >
                  {np.name} →
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Split Console: Left Silhouette Canvas (7 cols) + Right Point Editor & List (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Human Silhouette */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                Зона боли ({recommendations.counts.pain})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rotate-45 bg-amber-600 inline-block" />
                Триггер ({recommendations.counts.trigger_point})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-700 inline-block" />
                Слабая мышца ({recommendations.counts.weak_muscle})
              </span>
            </div>

            {points.length > 0 && (
              <div>
                {confirmClearAll ? (
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onChangePoints([]);
                        setSelectedPointId(null);
                        setConfirmClearAll(false);
                      }}
                      className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                    >
                      Очистить все ({points.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2 py-0.5 text-[11px] text-slate-600 bg-slate-200 rounded cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(true)}
                    className="text-[11px] text-slate-500 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Очистить карту
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative bg-white p-3 flex items-center justify-center min-h-[480px] lg:h-[620px]">
            <svg
              ref={svgRef}
              viewBox={viewBoxStr}
              onClick={handleSvgClick}
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoverInfo(null)}
              className="w-full h-full max-h-[590px] cursor-crosshair select-none"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Интерактивный силуэт тела для отметки зон боли, триггерных точек и слабых мышц"
            >
              {/* Open-source anterior/posterior anatomical silhouette */}
              <image
                href={BODY_SILHOUETTE_PLATE.src}
                x={0}
                y={0}
                width={BODY_SILHOUETTE_PLATE.width}
                height={BODY_SILHOUETTE_PLATE.height}
                opacity={0.92}
              />

              {/* View Labels */}
              {viewFocus !== 'posterior' && (
                <text
                  x={250}
                  y={24}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={700}
                  fill="#334155"
                >
                  ВИД СПЕРЕДИ
                </text>
              )}
              {viewFocus !== 'anterior' && (
                <text
                  x={773}
                  y={24}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={700}
                  fill="#334155"
                >
                  ВИД СЗАДИ
                </text>
              )}

              {/* Subtle Reference Muscle Landmarks */}
              {showMuscleLandmarks &&
                MUSCLES.map((m) => {
                  const coord = MUSCLE_PLATE_COORDS[m.id];
                  if (!coord) return null;
                  return (
                    <g key={m.id} className="pointer-events-none">
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={4.5}
                        fill="rgba(30, 64, 175, 0.16)"
                        stroke="rgba(30, 64, 175, 0.45)"
                        strokeWidth={1}
                      />
                    </g>
                  );
                })}

              {/* Saved Patient Pain / Trigger / Weak Muscle Markers */}
              {visiblePoints.map((pt) => {
                const idx = points.findIndex((p) => p.id === pt.id);
                const isSelected = pt.id === selectedPointId;
                const meta = PAIN_MARKER_META[pt.type];
                const isConstant = pt.triggerBehavior === 'constant_all_postures';
                const haloRadius =
                  pt.type === 'pain'
                    ? 16 + (pt.intensity ?? 5) * 1.6
                    : pt.type === 'trigger_point'
                      ? 14
                      : 16;

                return (
                  <g
                    key={pt.id}
                    data-pain-marker="true"
                    transform={`translate(${pt.x}, ${pt.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPointId(pt.id);
                    }}
                    className="cursor-pointer"
                  >
                    {/* Soft pain radiation / selection ring */}
                    <circle
                      cx={0}
                      cy={0}
                      r={haloRadius}
                      fill={
                        pt.type === 'pain'
                          ? 'rgba(225, 29, 72, 0.16)'
                          : pt.type === 'trigger_point'
                            ? 'rgba(217, 119, 6, 0.15)'
                            : 'rgba(29, 78, 216, 0.14)'
                      }
                      stroke={isSelected ? meta.hex : 'transparent'}
                      strokeWidth={isSelected ? 2 : 0}
                      strokeDasharray={isSelected ? '4 2' : undefined}
                    />

                    {/* Distinct shape per marker type (non-hue-only) */}
                    {pt.type === 'pain' && (
                      <circle
                        cx={0}
                        cy={0}
                        r={11}
                        fill={meta.hex}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                    )}

                    {pt.type === 'trigger_point' && (
                      <rect
                        x={-9}
                        y={-9}
                        width={18}
                        height={18}
                        rx={2}
                        transform="rotate(45)"
                        fill={meta.hex}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                    )}

                    {pt.type === 'weak_muscle' && (
                      <rect
                        x={-10}
                        y={-10}
                        width={20}
                        height={20}
                        rx={4}
                        fill={meta.hex}
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                    )}

                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill="#ffffff"
                      className="pointer-events-none select-none"
                    >
                      {idx + 1}
                    </text>

                    {/* Posture Tag & Constant NS Marker Badge */}
                    {(pt.posture || isConstant) && (
                      <text
                        x={0}
                        y={-15}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight={700}
                        fill={isConstant ? '#6d28d9' : '#0f172a'}
                        className="pointer-events-none select-none"
                      >
                        {pt.posture ? BODY_POSTURE_META[pt.posture].shortLabel : ''}
                        {isConstant ? ' [НС!]' : ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Crosshair Hover Coordinate Readout */}
            {hoverInfo ? (
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 text-white rounded-lg text-[11px]">
                <span className="font-medium truncate">
                  {hoverInfo.zoneName} · Ориентир: {hoverInfo.nearestMuscleName}
                </span>
                <span className="font-mono tabular-nums text-slate-300 shrink-0">
                  x={hoverInfo.x} · y={hoverInfo.y}
                </span>
              </div>
            ) : (
              <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50/95 border border-slate-200 text-slate-500 rounded-lg text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-blue-700" />
                  Кликните на любую область тела для постановки метки ({PAIN_MARKER_META[activeTool].label})
                </span>
                <span className="hidden sm:inline truncate">
                  {BODY_SILHOUETTE_PLATE.sourceAttribution}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Marker Inspector + Marked Points List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Marker Editor */}
          {selectedPoint ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-500">
                    Точка #{points.findIndex((p) => p.id === selectedPoint.id) + 1} · x=
                    {selectedPoint.x}, y={selectedPoint.y} ·{' '}
                    {describeBodySide(selectedPoint.x)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {ANATOMICAL_ZONES.find((z) => z.id === selectedPoint.zoneId)?.classifierCode}{' '}
                    — {ANATOMICAL_ZONES.find((z) => z.id === selectedPoint.zoneId)?.name}
                  </h3>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {selectedPoint.view === 'anterior'
                      ? ANATOMICAL_ZONES.find((z) => z.id === selectedPoint.zoneId)
                          ?.anteriorAspect.title
                      : ANATOMICAL_ZONES.find((z) => z.id === selectedPoint.zoneId)
                          ?.posteriorAspect.title}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePoint(selectedPoint.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-md cursor-pointer"
                  title="Удалить отметку"
                  aria-label="Удалить отметку"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Change Marker Type */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-600 block">Тип находки</span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['pain', 'trigger_point', 'weak_muscle'] as PainMarkerType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updatePoint(selectedPoint.id, { type: t })}
                      className={`py-1.5 px-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        selectedPoint.type === t
                          ? t === 'pain'
                            ? 'bg-rose-600 text-white'
                            : t === 'trigger_point'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-700 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {PAIN_MARKER_META[t].shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Posture & Trigger Invariance Selector */}
              <div className="space-y-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 block">
                    Положение тела (для дифференциации триггера)
                  </span>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-white border border-slate-200 rounded-md">
                    {(['standing', 'sitting', 'lying'] as BodyPosturePosition[]).map((pos) => {
                      const active = (selectedPoint.posture ?? 'standing') === pos;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => updatePoint(selectedPoint.id, { posture: pos })}
                          className={`py-1 px-2 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                            active
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {BODY_POSTURE_META[pos].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-600 block">
                    Поведение триггера при смене позы
                  </span>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-white border border-slate-200 rounded-md">
                    {(
                      ['varies_with_posture', 'constant_all_postures'] as TriggerPostureBehavior[]
                    ).map((beh) => {
                      const active =
                        (selectedPoint.triggerBehavior ?? 'varies_with_posture') === beh;
                      return (
                        <button
                          key={beh}
                          type="button"
                          onClick={() => updatePoint(selectedPoint.id, { triggerBehavior: beh })}
                          className={`py-1 px-2 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                            active
                              ? beh === 'constant_all_postures'
                                ? 'bg-violet-700 text-white'
                                : 'bg-blue-700 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {TRIGGER_BEHAVIOR_META[beh].shortLabel}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {
                      TRIGGER_BEHAVIOR_META[
                        selectedPoint.triggerBehavior ?? 'varies_with_posture'
                      ].description
                    }
                  </p>
                </div>
              </div>

              {/* Intensity Slider */}
              {selectedPoint.type !== 'weak_muscle' && (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600 font-medium">Интенсивность (ВАШ):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={selectedPoint.intensity ?? 5}
                      onChange={(e) =>
                        updatePoint(selectedPoint.id, { intensity: Number(e.target.value) })
                      }
                      className="w-28 accent-rose-600 cursor-pointer"
                    />
                    <span className="font-mono tabular-nums font-bold text-slate-900 w-9 text-right">
                      {selectedPoint.intensity ?? 5}/10
                    </span>
                  </div>
                </div>
              )}

              {/* Primary & Matched Muscles */}
              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] font-medium text-slate-600 block">
                  Целевая мышца (подобрана по координатам — можно уточнить):
                </label>
                <select
                  value={selectedPoint.primaryMuscleId ?? ''}
                  onChange={(e) =>
                    updatePoint(selectedPoint.id, {
                      primaryMuscleId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  {selectedPoint.matchedMuscleIds.length > 0 && (
                    <optgroup label="Ближайшие по координатам">
                      {selectedPoint.matchedMuscleIds.map((mId) => {
                        const m = MUSCLES.find((item) => item.id === mId);
                        return m ? (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.spinalSegment.split('·')[0].trim()})
                          </option>
                        ) : null;
                      })}
                    </optgroup>
                  )}
                  <optgroup label="Все мышцы справочника (50)">
                    {MUSCLES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {selectedPoint.matchedMuscleIds.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                    <span>Рядом:</span>
                    {selectedPoint.matchedMuscleIds.map((mId) => {
                      const m = MUSCLES.find((item) => item.id === mId);
                      if (!m) return null;
                      const isPrimary = selectedPoint.primaryMuscleId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updatePoint(selectedPoint.id, { primaryMuscleId: m.id })}
                          className={`hover:underline cursor-pointer ${
                            isPrimary ? 'font-semibold text-blue-700' : 'text-slate-600'
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clinical Note */}
              <div className="space-y-1 text-xs">
                <label className="text-[11px] font-medium text-slate-600 block">
                  Заметка врача (иррадиация, характер боли, пальпация):
                </label>
                <input
                  type="text"
                  value={selectedPoint.note ?? ''}
                  onChange={(e) => updatePoint(selectedPoint.id, { note: e.target.value })}
                  placeholder="Например: отдаёт по латеральному краю бедра, плотный тяж..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Action Hint for Marker Type + Quick MMT Push */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className={`font-semibold ${PAIN_MARKER_META[selectedPoint.type].textClass}`}>
                  {PAIN_MARKER_META[selectedPoint.type].clinicalRole}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {PAIN_MARKER_META[selectedPoint.type].actionHint}
                </p>
                {selectedPoint.primaryMuscleId && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onAddMusclesToQueue(
                          getEffectiveMuscleIdsForPoint(selectedPoint).slice(0, 2),
                          selectedPoint.primaryMuscleId
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Тестировать в ММТ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInAtlas({ type: 'muscle', id: selectedPoint.primaryMuscleId! })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      <span>В Атлас</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-2">
              <Crosshair className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Отметьте зоны на силуэте</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Кликните по любой точке силуэта слева, чтобы зафиксировать зону боли, триггерную
                точку или слабую мышцу. Координаты и рекомендации справочника появятся здесь
                автоматически.
              </p>
            </div>
          )}

          {/* List of Marked Points */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>Отмеченные точки ({points.length})</span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Передн.: {recommendations.sideCounts.anterior} · Задн.:{' '}
                {recommendations.sideCounts.posterior} · Зон: {recommendations.zones.length}
              </span>
            </div>

            {points.length === 0 ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                Пока не добавлено ни одной отметки.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {visiblePoints.map((pt) => {
                  const idx = points.findIndex((p) => p.id === pt.id);
                  const meta = PAIN_MARKER_META[pt.type];
                  const m = MUSCLES.find((item) => item.id === pt.primaryMuscleId);
                  const isSel = pt.id === selectedPointId;
                  const isConst = pt.triggerBehavior === 'constant_all_postures';
                  return (
                    <div
                      key={pt.id}
                      onClick={() => setSelectedPointId(pt.id)}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSel ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-mono font-bold text-slate-500 tabular-nums">
                            #{idx + 1}
                          </span>
                          <span className={`font-semibold ${meta.textClass}`}>
                            {meta.shortLabel}
                          </span>
                          {pt.posture && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                              {BODY_POSTURE_META[pt.posture].shortLabel}
                            </span>
                          )}
                          {isConst && (
                            <span className="px-1.5 py-0.2 bg-violet-100 text-violet-800 rounded text-[10px] font-semibold">
                              Неизм. (НС!)
                            </span>
                          )}
                          {pt.intensity !== undefined && (
                            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                              ВАШ {pt.intensity}/10
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-slate-900 truncate mt-0.5">
                          {m?.name ?? 'Мышца не выбрана'} ·{' '}
                          <span className="text-slate-500 font-normal">
                            {describeBodySide(pt.x)}
                          </span>
                        </div>
                        {pt.note && (
                          <div className="text-[11px] text-slate-500 truncate">{pt.note}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePoint(pt.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                        aria-label="Удалить точку"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Directory Recommendations Section */}
      {points.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>Рекомендации из справочника по отмеченным зонам</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Автоматический подбор мышц для ММТ, рефлекторных точек Чапмена/Беннетта, органов,
                меридианов и симптомокомплексов по координатам карты боли.
              </p>
            </div>

            {recommendations.recommendedQueueMuscleIds.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onAddMusclesToQueue(recommendations.recommendedQueueMuscleIds)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  Добавить все ({recommendations.recommendedQueueMuscleIds.length}) в план ММТ
                </span>
              </button>
            )}
          </div>

          {/* Linked Systems Overview */}
          {(recommendations.organs.length > 0 ||
            recommendations.diaphragms.length > 0 ||
            recommendations.meridians.length > 0 ||
            recommendations.chains.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">Висцеральные связи</div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {recommendations.organs.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'organ', id: o.id })}
                      className="text-emerald-700 hover:underline font-medium cursor-pointer text-left"
                    >
                      {o.name} →
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">Диафрагмы</div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {recommendations.diaphragms.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'diaphragm', id: d.id })}
                      className="text-amber-700 hover:underline font-medium cursor-pointer text-left"
                    >
                      {d.name.split('(')[0].trim()} →
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">Меридианы</div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {recommendations.meridians.map((mer) => (
                    <button
                      key={mer.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'meridian', id: mer.id })}
                      className="text-rose-700 hover:underline font-medium cursor-pointer text-left"
                    >
                      {mer.code} {mer.name} →
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">Миофасциальные цепи</div>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {recommendations.chains.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'chain', id: ch.id })}
                      className="text-violet-700 hover:underline font-medium cursor-pointer text-left"
                    >
                      {ch.name} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Muscle Recommendations */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Целевые мышцы, рефлексы и протокол коррекции ({recommendations.muscleRecommendations.length})
            </h4>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {recommendations.muscleRecommendations.map((rec) => {
                const inQueue = queuedSet.has(rec.muscle.id);
                return (
                  <div
                    key={rec.muscle.id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{rec.muscle.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {rec.muscle.latinName} · {rec.muscle.spinalSegment.split('·')[0].trim()}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                          {rec.markerTypes.map((mt) => (
                            <span
                              key={mt}
                              className={`font-semibold ${PAIN_MARKER_META[mt].textClass}`}
                            >
                              {PAIN_MARKER_META[mt].shortLabel}
                            </span>
                          ))}
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">отметок: {rec.pointCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAddMusclesToQueue([rec.muscle.id], rec.muscle.id)}
                          className={`px-2.5 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                            inQueue
                              ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                              : 'bg-blue-700 text-white hover:bg-blue-800'
                          }`}
                        >
                          {inQueue ? 'Тестировать в ММТ' : '+ В план ММТ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'muscle', id: rec.muscle.id })}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md cursor-pointer"
                          title="Открыть в Атласе"
                          aria-label="Открыть в Атласе"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-600 leading-relaxed">
                      <div>
                        <strong className="text-slate-800">НЛ-точки (Чапман):</strong> спереди —{' '}
                        {rec.muscle.reflexes.neurolymphaticAnterior}; сзади —{' '}
                        {rec.muscle.reflexes.neurolymphaticPosterior}
                      </div>
                      <div>
                        <strong className="text-slate-800">НВ-точка (Беннетт):</strong>{' '}
                        {rec.muscle.reflexes.neurovascular}
                      </div>
                      <div>
                        <strong className="text-emerald-800">Висцеро-моторная связь:</strong>{' '}
                        {rec.muscle.reflexes.visceromotorLink}
                      </div>
                      <div>
                        <strong className="text-rose-700">Эмоции (ЭСР):</strong>{' '}
                        {rec.triad.emotional.correctionMethod}
                      </div>
                      <div>
                        <strong className="text-violet-700">Энергия / точки:</strong>{' '}
                        {rec.triad.energetic.keyPointsOrNutrients}
                      </div>
                      <div>
                        <strong className="text-emerald-700">Нутриенты:</strong>{' '}
                        {rec.muscle.nutrients.join(', ')}
                      </div>
                    </div>

                    {rec.muscle.correctionSteps.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1">
                        <div className="font-semibold text-slate-800">Рекомендуемые техники:</div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {rec.muscle.correctionSteps.slice(0, 2).map((st, idx) => (
                            <li key={idx}>
                              <strong className="text-slate-800">[{st.modality}] {st.title}:</strong>{' '}
                              {st.technique}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matched Symptom Profiles from Directory */}
          {recommendations.symptomMatches.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Возможные симптомокомплексы из справочника ({recommendations.symptomMatches.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {recommendations.symptomMatches.map(({ symptom, matchedMuscles }) => (
                  <div
                    key={symptom.id}
                    className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2"
                  >
                    <div className="font-bold text-slate-900">{symptom.title}</div>
                    {matchedMuscles.length > 0 && (
                      <div className="text-[11px] text-blue-700 font-medium">
                        Совпадение по мышцам: {matchedMuscles.join(', ')}
                      </div>
                    )}
                    <p className="text-slate-600 leading-relaxed">{symptom.clinicalSummary}</p>
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="font-semibold text-slate-800">Вероятные причины:</div>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        {symptom.possibleCauses.slice(0, 2).map((c, idx) => (
                          <li key={idx}>
                            <strong>{c.category}:</strong> {c.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {symptom.diagnosticMethods.length > 0 && (
                      <div className="text-[11px] text-slate-600 pt-1">
                        <strong className="text-slate-800">Диагностика:</strong>{' '}
                        {symptom.diagnosticMethods[0].method} —{' '}
                        {symptom.diagnosticMethods[0].positiveSign}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
