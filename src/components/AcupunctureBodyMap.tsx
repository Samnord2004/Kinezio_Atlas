import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACUPOINTS, MERIDIANS } from '../data';
import {
  ACUPUNCTURE_DETAIL_PLATES,
  ACUPUNCTURE_PLATE_META,
  ACUPOINT_BODY_COORDS,
  ACUPOINT_DETAIL_COORDS,
  DetailPlateId,
} from '../data/acupointBodyCoords';
import { Minus, Move, Plus, RotateCcw } from 'lucide-react';

export type AcupunctureRegionPreset = 'all' | 'anterior' | 'posterior' | 'head' | 'hand' | 'foot';

interface AcupunctureBodyMapProps {
  activeMeridianId?: string;
  selectedAcupointId?: string | null;
  onSelectAcupoint?: (acupointId: string) => void;
  compact?: boolean;
}

const REGION_PRESETS: Array<{ id: AcupunctureRegionPreset; label: string }> = [
  { id: 'all', label: 'Весь силуэт' },
  { id: 'anterior', label: 'Спереди (Инь)' },
  { id: 'posterior', label: 'Сзади (Ян)' },
  { id: 'head', label: 'Голова' },
  { id: 'hand', label: 'Кисти (ладонь/тыл)' },
  { id: 'foot', label: 'Стопы (подошва/тыл)' },
];

export const AcupunctureBodyMap: React.FC<AcupunctureBodyMapProps> = ({
  activeMeridianId,
  selectedAcupointId,
  onSelectAcupoint,
  compact = false,
}) => {
  const [regionPreset, setRegionPreset] = useState<AcupunctureRegionPreset>('all');
  const [showAllPoints, setShowAllPoints] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const activeMeridian = useMemo(
    () => MERIDIANS.find((m) => m.id === activeMeridianId),
    [activeMeridianId]
  );

  const selectedDetailCoord = useMemo(
    () => (selectedAcupointId ? ACUPOINT_DETAIL_COORDS[selectedAcupointId] : undefined),
    [selectedAcupointId]
  );

  // Auto-switch to hand/foot plate when a hand or foot acupoint is selected
  useEffect(() => {
    if (!selectedAcupointId) return;
    const detail = ACUPOINT_DETAIL_COORDS[selectedAcupointId];
    if (detail) {
      const region = ACUPUNCTURE_DETAIL_PLATES[detail.plate].region;
      setRegionPreset(region);
      return;
    }

    if (!compact) return;
    const coord = ACUPOINT_BODY_COORDS[selectedAcupointId];
    if (!coord) return;
    setRegionPreset(coord.view);
    if (coord.view === 'anterior') {
      setScale(1.85);
      setPan({ x: 85, y: coord.y > 900 ? -110 : coord.y < 360 ? 95 : 10 });
    } else {
      setScale(1.85);
      setPan({ x: -85, y: coord.y > 900 ? -110 : coord.y < 360 ? 95 : 10 });
    }
  }, [compact, selectedAcupointId]);

  // If user switches to a compact meridian view whose points are mostly hand/foot or trunk, reset properly
  useEffect(() => {
    if (selectedAcupointId) return;
    if (compact) setRegionPreset('all');
  }, [activeMeridianId, compact, selectedAcupointId]);

  const applyPreset = useCallback((preset: AcupunctureRegionPreset) => {
    setRegionPreset(preset);
    if (preset === 'all') {
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else if (preset === 'anterior') {
      setScale(1.85);
      setPan({ x: 115, y: 0 });
    } else if (preset === 'posterior') {
      setScale(1.85);
      setPan({ x: -115, y: 0 });
    } else if (preset === 'head') {
      setScale(2.5);
      setPan({ x: 145, y: 190 });
    } else {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const visibleAcupoints = useMemo(() => {
    return ACUPOINTS.filter((pt) => {
      if (!ACUPOINT_BODY_COORDS[pt.id]) return false;
      if (showAllPoints) return true;
      if (selectedAcupointId && pt.id === selectedAcupointId) return true;
      if (activeMeridianId && pt.meridianId === activeMeridianId) return true;
      return !activeMeridianId;
    });
  }, [activeMeridianId, selectedAcupointId, showAllPoints]);

  // Meridian pathway lines separated by anterior vs posterior view
  const meridianPaths = useMemo(() => {
    if (!activeMeridian) return { anterior: '', posterior: '' };
    const antPts: string[] = [];
    const postPts: string[] = [];
    activeMeridian.acupointIds.forEach((ptId) => {
      const c = ACUPOINT_BODY_COORDS[ptId];
      if (!c) return;
      if (c.view === 'anterior') antPts.push(`${c.x},${c.y}`);
      else postPts.push(`${c.x},${c.y}`);
    });
    return {
      anterior: antPts.length >= 2 ? antPts.join(' ') : '',
      posterior: postPts.length >= 2 ? postPts.join(' ') : '',
    };
  }, [activeMeridian]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => Math.min(4, Math.max(0.85, Number((prev + delta).toFixed(2)))));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button[data-acupoint="true"]')) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStartRef.current) return;
      setPan({
        x: dragStartRef.current.panX + (e.clientX - dragStartRef.current.x),
        y: dragStartRef.current.panY + (e.clientY - dragStartRef.current.y),
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const selectedPointObj = useMemo(
    () => ACUPOINTS.find((p) => p.id === selectedAcupointId),
    [selectedAcupointId]
  );

  const isDetailMode = regionPreset === 'hand' || regionPreset === 'foot';

  const activeDetailPlates: DetailPlateId[] = useMemo(() => {
    if (regionPreset === 'hand') {
      if (compact && selectedDetailCoord?.plate.startsWith('hand-')) {
        return [selectedDetailCoord.plate];
      }
      return ['hand-palmar', 'hand-dorsal'];
    }
    if (regionPreset === 'foot') {
      if (compact && selectedDetailCoord?.plate.startsWith('foot-')) {
        return [selectedDetailCoord.plate];
      }
      return ['foot-plantar', 'foot-dorsal'];
    }
    return [];
  }, [regionPreset, compact, selectedDetailCoord]);

  const getPointsForDetailPlate = useCallback(
    (plateId: DetailPlateId) => {
      return ACUPOINTS.filter((pt) => {
        const dc = ACUPOINT_DETAIL_COORDS[pt.id];
        if (!dc || dc.plate !== plateId) return false;
        if (isDetailMode) {
          // On dedicated hand/foot plates, show all points for that hand/foot plate so the practitioner sees landmarks clearly
          return true;
        }
        if (showAllPoints) return true;
        if (selectedAcupointId && pt.id === selectedAcupointId) return true;
        if (activeMeridianId && pt.meridianId === activeMeridianId) return true;
        return !activeMeridianId;
      });
    },
    [isDetailMode, showAllPoints, selectedAcupointId, activeMeridianId]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {!compact &&
            REGION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  regionPreset === preset.id
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}

          {compact && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800">
                Локализация ({selectedPointObj ? selectedPointObj.code : activeMeridian?.code})
              </span>
              {selectedDetailCoord && (
                <div className="inline-flex items-center gap-1 p-0.5 bg-slate-200/70 rounded text-[10px]">
                  <button
                    type="button"
                    onClick={() =>
                      setRegionPreset(ACUPUNCTURE_DETAIL_PLATES[selectedDetailCoord.plate].region)
                    }
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer whitespace-nowrap ${
                      isDetailMode ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {ACUPUNCTURE_DETAIL_PLATES[selectedDetailCoord.plate].region === 'hand'
                      ? 'Кисть крупно'
                      : 'Стопа крупно'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer whitespace-nowrap ${
                      !isDetailMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Весь силуэт
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          {!compact && !isDetailMode && (
            <button
              type="button"
              onClick={() => setShowAllPoints((v) => !v)}
              className={`px-2.5 py-1 rounded border font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showAllPoints
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showAllPoints ? 'Только активный меридиан' : `Все ${ACUPOINTS.length} точек`}
            </button>
          )}

          {!isDetailMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.85, Number((s - 0.25).toFixed(2))))}
                className="p-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                aria-label="Уменьшить масштаб"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono tabular-nums text-slate-600 min-w-[38px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(4, Number((s + 0.25).toFixed(2))))}
                className="p-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                aria-label="Увеличить масштаб"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="p-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Сбросить масштаб"
                aria-label="Сбросить масштаб"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {isDetailMode && !compact && (
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              ← К общему силуэту
            </button>
          )}
        </div>
      </div>

      {/* ==================== HAND & FOOT DETAILED ANATOMICAL PLATES ==================== */}
      {isDetailMode ? (
        <div className="bg-white p-3 sm:p-4 space-y-3">
          {(hoveredCode || selectedPointObj) && (
            <div className="bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-md truncate">
              {hoveredCode ??
                (selectedPointObj
                  ? `${selectedPointObj.code} · ${selectedPointObj.chineseName} (${selectedPointObj.russianName})`
                  : '')}
            </div>
          )}

          <div
            className={`grid gap-4 ${
              activeDetailPlates.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {activeDetailPlates.map((plateId) => {
              const meta = ACUPUNCTURE_DETAIL_PLATES[plateId];
              const platePoints = getPointsForDetailPlate(plateId);

              // Connect meridian points sitting on this plate if activeMeridian is selected
              const meridianPolylinePoints = activeMeridian
                ? activeMeridian.acupointIds
                    .map((id) => ACUPOINT_DETAIL_COORDS[id])
                    .filter((c): c is NonNullable<typeof c> => Boolean(c && c.plate === plateId))
                    .map((c) => `${c.xPct * 10},${c.yPct * 10}`)
                    .join(' ')
                : '';

              return (
                <div
                  key={plateId}
                  className="border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden flex flex-col"
                >
                  <div className="px-3.5 py-2 border-b border-slate-200 bg-white">
                    <div className="text-xs font-bold text-slate-900">{meta.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{meta.subtitle}</div>
                  </div>

                  <div
                    className={`relative bg-white flex items-center justify-center p-2 ${
                      compact ? 'h-[250px]' : 'h-[360px] sm:h-[400px]'
                    }`}
                  >
                    <div className="relative h-full aspect-square max-w-full">
                      <img
                        src={meta.src}
                        alt={meta.title}
                        draggable={false}
                        className="w-full h-full object-contain pointer-events-none block select-none"
                      />

                      {meridianPolylinePoints && meridianPolylinePoints.includes(' ') && (
                        <svg
                          viewBox="0 0 1000 1000"
                          className="absolute inset-0 w-full h-full pointer-events-none"
                        >
                          <polyline
                            points={meridianPolylinePoints}
                            fill="none"
                            stroke={plateId.includes('palmar') || plateId.includes('plantar') ? '#e11d48' : '#1d4ed8'}
                            strokeWidth={7}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="14 10"
                            opacity={0.75}
                          />
                        </svg>
                      )}

                      <div className="absolute inset-0">
                        {platePoints.map((pt) => {
                          const coord = ACUPOINT_DETAIL_COORDS[pt.id];
                          if (!coord) return null;
                          const isSelected = pt.id === selectedAcupointId;
                          const isOnActiveMeridian =
                            activeMeridianId && pt.meridianId === activeMeridianId;

                          return (
                            <button
                              key={pt.id}
                              type="button"
                              data-acupoint="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAcupoint?.(pt.id);
                              }}
                              onMouseEnter={() =>
                                setHoveredCode(
                                  `${pt.code} · ${pt.chineseName} — ${pt.russianName} (${pt.role.split(' ')[0]})`
                                )
                              }
                              onMouseLeave={() => setHoveredCode(null)}
                              style={{ left: `${coord.xPct}%`, top: `${coord.yPct}%` }}
                              aria-label={`${pt.code} ${pt.chineseName}`}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-transform duration-150 cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'w-5 h-5 bg-blue-700 border-white ring-4 ring-blue-500/35 scale-125 z-30'
                                  : isOnActiveMeridian
                                    ? 'w-4 h-4 bg-rose-600 border-white ring-2 ring-rose-500/30 z-20 hover:scale-125'
                                    : 'w-3.5 h-3.5 bg-amber-500 border-white shadow-xs z-10 hover:scale-125 hover:bg-rose-600'
                              }`}
                            >
                              <span
                                className={`pointer-events-none absolute left-full ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-xs ${
                                  isSelected
                                    ? 'bg-blue-700 text-white'
                                    : isOnActiveMeridian
                                      ? 'bg-rose-700 text-white'
                                      : 'bg-white/95 text-slate-800 border border-slate-300'
                                }`}
                              >
                                {pt.code}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span className="truncate">{meta.orientationHint}</span>
                    <span className="shrink-0 font-mono">{platePoints.length} т.</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Анатомические схемы кисти и стопы: DBCLS TogoTV / Wikimedia Commons (CC BY 4.0)
            </span>
            <span>Кликните по любой точке на схеме для просмотра локализации и показаний</span>
          </div>
        </div>
      ) : (
        /* ==================== FULL BODY CHART VIEWPORT ==================== */
        <div
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`relative bg-white overflow-hidden select-none flex items-center justify-center ${
            compact ? 'h-[260px]' : 'h-[430px] sm:h-[490px]'
          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {(hoveredCode || selectedPointObj) && (
            <div className="absolute top-2.5 left-3 z-20 pointer-events-none bg-slate-900/90 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xs max-w-[90%] truncate">
              {hoveredCode ??
                (selectedPointObj
                  ? `${selectedPointObj.code} · ${selectedPointObj.chineseName} (${selectedPointObj.russianName})`
                  : '')}
            </div>
          )}

          <div
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
              aspectRatio: `${ACUPUNCTURE_PLATE_META.width} / ${ACUPUNCTURE_PLATE_META.height}`,
            }}
            className="relative max-h-full max-w-full h-full flex items-center justify-center p-2"
          >
            <div
              className="relative w-full h-full"
              style={{
                aspectRatio: `${ACUPUNCTURE_PLATE_META.width} / ${ACUPUNCTURE_PLATE_META.height}`,
              }}
            >
              <img
                src={ACUPUNCTURE_PLATE_META.src}
                alt="Анатомическая схема акупунктурных точек и меридианов"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none block"
              />

              {/* Meridian Pathway Connecting Line */}
              <svg
                viewBox={`0 0 ${ACUPUNCTURE_PLATE_META.width} ${ACUPUNCTURE_PLATE_META.height}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="xMidYMid meet"
              >
                {meridianPaths.anterior && (
                  <polyline
                    points={meridianPaths.anterior}
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 7"
                    opacity={0.75}
                  />
                )}
                {meridianPaths.posterior && (
                  <polyline
                    points={meridianPaths.posterior}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 7"
                    opacity={0.75}
                  />
                )}
              </svg>

              {/* Interactive Calibrated Acupoint Hotspots */}
              <div className="absolute inset-0">
                {visibleAcupoints.map((pt) => {
                  const coord = ACUPOINT_BODY_COORDS[pt.id];
                  if (!coord) return null;
                  const leftPct = (coord.x / ACUPUNCTURE_PLATE_META.width) * 100;
                  const topPct = (coord.y / ACUPUNCTURE_PLATE_META.height) * 100;
                  const isSelected = pt.id === selectedAcupointId;
                  const isOnActiveMeridian = activeMeridianId && pt.meridianId === activeMeridianId;

                  return (
                    <button
                      key={pt.id}
                      type="button"
                      data-acupoint="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAcupoint?.(pt.id);
                      }}
                      onMouseEnter={() =>
                        setHoveredCode(`${pt.code} · ${pt.chineseName} (${pt.role.split(' ')[0]})`)
                      }
                      onMouseLeave={() => setHoveredCode(null)}
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                      aria-label={`${pt.code} ${pt.chineseName}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-transform duration-150 cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'w-4.5 h-4.5 bg-blue-700 border-white ring-4 ring-blue-500/35 scale-125 z-30'
                          : isOnActiveMeridian
                            ? 'w-3.5 h-3.5 bg-rose-600 border-white ring-2 ring-rose-500/30 z-20 hover:scale-125'
                            : 'w-2.5 h-2.5 bg-white/95 border-rose-500 z-10 hover:scale-125'
                      }`}
                    >
                      {(isSelected || isOnActiveMeridian) && (
                        <span
                          className={`pointer-events-none absolute left-full ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-xs ${
                            isSelected
                              ? 'bg-blue-700 text-white'
                              : 'bg-white/95 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {pt.code}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Caption */}
          <div className="absolute bottom-0 inset-x-0 px-3 py-1 bg-white/92 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate">{ACUPUNCTURE_PLATE_META.sourceAttribution}</span>
            <span className="hidden sm:inline-flex items-center gap-1 shrink-0 ml-2">
              <Move className="w-3 h-3" />
              Клик по точке · Колёсико: масштаб
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
