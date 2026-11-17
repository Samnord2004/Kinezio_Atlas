import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACUPOINTS,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  ORGANS,
  getCrossReferences,
} from '../data';
import { ACUPOINT_BODY_COORDS, ACUPUNCTURE_PLATE_META } from '../data/acupointBodyCoords';
import { MUSCLE_PLATE_COORDS } from '../data/musclePlateCoords';
import { AnatomicalSide, AnatomicalZoneId, SelectedEntity } from '../types/atlas';
import { Maximize, Minus, Move, Plus, RotateCcw } from 'lucide-react';

export type AtlasPlateId =
  | 'muscles'
  | 'head'
  | 'neck'
  | 'organs'
  | 'diaphragm'
  | 'meridians';

interface OpenSourceAtlasViewerProps {
  selectedEntity: SelectedEntity;
  onSelectEntity: (entity: SelectedEntity) => void;
  activePlate: AtlasPlateId;
  onChangePlate: (plate: AtlasPlateId) => void;
  zoomZone: AnatomicalZoneId | 'all';
  onChangeZoomZone: (zone: AnatomicalZoneId | 'all') => void;
  sideFilter?: AnatomicalSide | 'all';
  visibleLayers: {
    muscles: boolean;
    organs: boolean;
    diaphragms: boolean;
    acupoints: boolean;
    chains: boolean;
  };
  onToggleLayer: (
    layer: 'muscles' | 'organs' | 'diaphragms' | 'acupoints' | 'chains'
  ) => void;
}

interface PlateMeta {
  id: AtlasPlateId;
  label: string;
  src: string;
  width: number;
  height: number;
  sourceAttribution: string;
}

const PLATES: Record<AtlasPlateId, PlateMeta> = {
  muscles: {
    id: 'muscles',
    label: 'Мышцы и цепи',
    src: './anatomy/muscles_front_back.svg',
    width: 1000,
    height: 871,
    sourceAttribution: 'Wikimedia Commons · Muscles front and back (CC BY-SA)',
  },
  head: {
    id: 'head',
    label: 'Голова и ВНЧС',
    src: './anatomy/head_neck_gray378.png',
    width: 620,
    height: 700,
    sourceAttribution: 'Henry Gray, Anatomy of the Human Body · Plate 378 (Public Domain)',
  },
  neck: {
    id: 'neck',
    label: 'Шейный отдел',
    src: './anatomy/neck_gray385.png',
    width: 553,
    height: 593,
    sourceAttribution: 'Henry Gray, Anatomy of the Human Body · Plate 385 (Public Domain)',
  },
  organs: {
    id: 'organs',
    label: 'Внутренние органы',
    src: './anatomy/internal_organs.svg',
    width: 1363,
    height: 1212,
    sourceAttribution: 'Mikael Häggström · Internal organs, Wikimedia Commons (CC0)',
  },
  diaphragm: {
    id: 'diaphragm',
    label: 'Диафрагмы',
    src: './anatomy/diaphragm.png',
    width: 600,
    height: 600,
    sourceAttribution: 'Wikimedia Commons · Human diaphragm (CC BY-SA)',
  },
  meridians: {
    id: 'meridians',
    label: 'Меридианы и точки',
    src: ACUPUNCTURE_PLATE_META.src,
    width: ACUPUNCTURE_PLATE_META.width,
    height: ACUPUNCTURE_PLATE_META.height,
    sourceAttribution: ACUPUNCTURE_PLATE_META.sourceAttribution,
  },
};

// Muscle plate coordinates imported from ../data/musclePlateCoords

// Calibrated coordinates on head_neck_gray378.png (620 x 700)
const HEAD_PLATE_COORDS: Record<string, { type: 'muscle' | 'diaphragm'; x: number; y: number }> = {
  temporalis: { type: 'muscle', x: 355, y: 215 },
  masseter: { type: 'muscle', x: 290, y: 348 },
  'lateral-pterygoid': { type: 'muscle', x: 312, y: 306 },
  'medial-pterygoid': { type: 'muscle', x: 280, y: 385 },
  suboccipitals: { type: 'muscle', x: 505, y: 345 },
  'suprahyoid-infrahyoid': { type: 'muscle', x: 270, y: 460 },
  scm: { type: 'muscle', x: 392, y: 425 },
  'upper-trapezius': { type: 'muscle', x: 472, y: 465 },
  'cranial-tentorium': { type: 'diaphragm', x: 445, y: 160 },
};

// Calibrated coordinates on neck_gray385.png (553 x 593)
const NECK_PLATE_COORDS: Record<string, { type: 'muscle' | 'diaphragm'; x: number; y: number }> = {
  'suprahyoid-infrahyoid': { type: 'muscle', x: 165, y: 245 },
  scm: { type: 'muscle', x: 274, y: 335 },
  scalenes: { type: 'muscle', x: 316, y: 392 },
  'upper-trapezius': { type: 'muscle', x: 426, y: 438 },
  'deep-neck-flexors': { type: 'muscle', x: 178, y: 285 },
  'cervical-extensors': { type: 'muscle', x: 370, y: 220 },
  'levator-scapulae': { type: 'muscle', x: 352, y: 320 },
  'hyoid-thoracic-inlet': { type: 'diaphragm', x: 245, y: 486 },
};

// Calibrated coordinates on internal_organs.svg (1363 x 1212)
const ORGAN_PLATE_COORDS: Record<string, { x: number; y: number }> = {
  sinuses: { x: 645, y: 175 },
  lungs: { x: 765, y: 530 },
  heart: { x: 660, y: 560 },
  liver: { x: 585, y: 675 },
  gallbladder: { x: 565, y: 765 },
  stomach: { x: 735, y: 695 },
  pancreas: { x: 705, y: 755 },
  kidneys: { x: 545, y: 795 },
  'small-intestine': { x: 665, y: 920 },
  'large-intestine': { x: 560, y: 955 },
  urogenital: { x: 655, y: 1085 },
};

// Calibrated coordinates on diaphragm.png (600 x 600)
const DIAPHRAGM_PLATE_COORDS: Record<string, { x: number; y: number }> = {
  'cranial-tentorium': { x: 300, y: 28 },
  'hyoid-thoracic-inlet': { x: 300, y: 118 },
  thoracoabdominal: { x: 300, y: 308 },
  'pelvic-floor': { x: 300, y: 515 },
  'plantar-popliteal': { x: 300, y: 575 },
};

// Acupoints calibrated in src/data/acupointBodyCoords.ts on acupuncture_body_chart.jpg (1400 x 1436)

function pointsToSvgPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    d += ` Q ${x0} ${y0} ${cx} ${cy}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

export const OpenSourceAtlasViewer: React.FC<OpenSourceAtlasViewerProps> = ({
  selectedEntity,
  onSelectEntity,
  activePlate,
  onChangePlate,
  zoomZone,
  onChangeZoomZone,
  sideFilter = 'all',
  visibleLayers,
  onToggleLayer,
}) => {
  const plate = PLATES[activePlate];
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const crossRefs = useMemo(() => getCrossReferences(selectedEntity), [selectedEntity]);

  const linkedIds = useMemo(() => {
    const set = new Set<string>();
    crossRefs.muscles.forEach((m) => set.add(`muscle:${m.id}`));
    crossRefs.organs.forEach((o) => set.add(`organ:${o.id}`));
    crossRefs.diaphragms.forEach((d) => set.add(`diaphragm:${d.id}`));
    crossRefs.acupoints.forEach((p) => set.add(`acupoint:${p.id}`));
    crossRefs.chains.forEach((c) => set.add(`chain:${c.id}`));
    return set;
  }, [crossRefs]);

  const activeChainsToDraw = useMemo(() => {
    if (selectedEntity.type === 'chain') {
      return MYOFASCIAL_CHAINS.filter((c) => c.id === selectedEntity.id);
    }
    if (visibleLayers.chains && crossRefs.chains.length > 0) {
      return [crossRefs.chains[0]];
    }
    return [];
  }, [selectedEntity, visibleLayers.chains, crossRefs.chains]);

  // Apply zoom presets when zoomZone, sideFilter, or activePlate changes
  useEffect(() => {
    if (activePlate !== 'muscles') {
      setScale(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    if (zoomZone === 'all') {
      if (sideFilter === 'anterior') {
        setScale(1.65);
        setPan({ x: 165, y: 0 });
      } else if (sideFilter === 'posterior') {
        setScale(1.65);
        setPan({ x: -175, y: 0 });
      } else {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }
      return;
    }

    const sideShiftX = sideFilter === 'posterior' ? -240 : sideFilter === 'anterior' ? 110 : 0;

    if (zoomZone === 'head') {
      setScale(2.35);
      setPan({ x: 90 + sideShiftX * 0.65, y: 230 });
    } else if (zoomZone === 'cervical') {
      setScale(2.2);
      setPan({ x: 80 + sideShiftX * 0.65, y: 165 });
    } else if (zoomZone === 'thoracic') {
      setScale(1.75);
      setPan({ x: 40 + sideShiftX * 0.65, y: 65 });
    } else if (zoomZone === 'upper-limb') {
      setScale(1.85);
      setPan({ x: 140 + sideShiftX * 0.65, y: 20 });
    } else if (zoomZone === 'lumbar') {
      setScale(1.85);
      setPan({ x: 35 + sideShiftX * 0.65, y: -55 });
    } else if (zoomZone === 'lower-limb') {
      setScale(1.75);
      setPan({ x: 35 + sideShiftX * 0.65, y: -175 });
    }
  }, [zoomZone, sideFilter, activePlate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    setScale((prev) => Math.min(4, Math.max(0.85, Number((prev + delta).toFixed(2)))));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button[data-hotspot="true"]')) return;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const resetViewport = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    onChangeZoomZone('all');
  }, [onChangeZoomZone]);

  // Compute active markers for the current open-source plate
  const markers = useMemo(() => {
    const list: Array<{
      key: string;
      entity: SelectedEntity;
      x: number;
      y: number;
      label: string;
      kind: 'muscle' | 'organ' | 'diaphragm' | 'acupoint';
    }> = [];

    if (activePlate === 'muscles') {
      if (visibleLayers.muscles) {
        MUSCLES.forEach((m) => {
          const coord = MUSCLE_PLATE_COORDS[m.id];
          if (!coord) return;
          const markerSide: AnatomicalSide = coord.x < 500 ? 'anterior' : 'posterior';
          const isSelected = selectedEntity.type === 'muscle' && selectedEntity.id === m.id;
          if (sideFilter !== 'all' && markerSide !== sideFilter && !isSelected) return;
          list.push({
            key: `m-${m.id}`,
            entity: { type: 'muscle', id: m.id },
            x: coord.x,
            y: coord.y,
            label: m.name,
            kind: 'muscle',
          });
        });
      }
      if (visibleLayers.diaphragms) {
        list.push(
          {
            key: 'd-tent',
            entity: { type: 'diaphragm', id: 'cranial-tentorium' },
            x: 250,
            y: 44,
            label: 'Намёт мозжечка (Краниальная диафрагма)',
            kind: 'diaphragm',
          },
          {
            key: 'd-hyoid',
            entity: { type: 'diaphragm', id: 'hyoid-thoracic-inlet' },
            x: 250,
            y: 168,
            label: 'Верхняя апертура / Подъязычная диафрагма',
            kind: 'diaphragm',
          },
          {
            key: 'd-thoraco',
            entity: { type: 'diaphragm', id: 'thoracoabdominal' },
            x: 250,
            y: 280,
            label: 'Грудобрюшная диафрагма',
            kind: 'diaphragm',
          },
          {
            key: 'd-pelvic',
            entity: { type: 'diaphragm', id: 'pelvic-floor' },
            x: 250,
            y: 446,
            label: 'Тазовая диафрагма',
            kind: 'diaphragm',
          },
          {
            key: 'd-plantar',
            entity: { type: 'diaphragm', id: 'plantar-popliteal' },
            x: 773,
            y: 632,
            label: 'Подколенная и подошвенная опора',
            kind: 'diaphragm',
          }
        );
      }
    } else if (activePlate === 'head') {
      Object.entries(HEAD_PLATE_COORDS).forEach(([id, cfg]) => {
        if (cfg.type === 'muscle') {
          const m = MUSCLES.find((item) => item.id === id);
          if (m) {
            list.push({
              key: `hm-${id}`,
              entity: { type: 'muscle', id },
              x: cfg.x,
              y: cfg.y,
              label: m.name,
              kind: 'muscle',
            });
          }
        } else {
          const d = DIAPHRAGMS.find((item) => item.id === id);
          if (d) {
            list.push({
              key: `hd-${id}`,
              entity: { type: 'diaphragm', id },
              x: cfg.x,
              y: cfg.y,
              label: d.name,
              kind: 'diaphragm',
            });
          }
        }
      });
    } else if (activePlate === 'neck') {
      Object.entries(NECK_PLATE_COORDS).forEach(([id, cfg]) => {
        if (cfg.type === 'muscle') {
          const m = MUSCLES.find((item) => item.id === id);
          if (m) {
            list.push({
              key: `nm-${id}`,
              entity: { type: 'muscle', id },
              x: cfg.x,
              y: cfg.y,
              label: m.name,
              kind: 'muscle',
            });
          }
        } else {
          const d = DIAPHRAGMS.find((item) => item.id === id);
          if (d) {
            list.push({
              key: `nd-${id}`,
              entity: { type: 'diaphragm', id },
              x: cfg.x,
              y: cfg.y,
              label: d.name,
              kind: 'diaphragm',
            });
          }
        }
      });
    } else if (activePlate === 'organs') {
      ORGANS.forEach((o) => {
        const coord = ORGAN_PLATE_COORDS[o.id];
        if (coord) {
          list.push({
            key: `o-${o.id}`,
            entity: { type: 'organ', id: o.id },
            x: coord.x,
            y: coord.y,
            label: o.name,
            kind: 'organ',
          });
        }
      });
      if (visibleLayers.diaphragms) {
        list.push({
          key: 'od-thoraco',
          entity: { type: 'diaphragm', id: 'thoracoabdominal' },
          x: 681,
          y: 625,
          label: 'Грудобрюшная диафрагма',
          kind: 'diaphragm',
        });
      }
    } else if (activePlate === 'diaphragm') {
      DIAPHRAGMS.forEach((d) => {
        const coord = DIAPHRAGM_PLATE_COORDS[d.id];
        if (coord) {
          list.push({
            key: `dp-${d.id}`,
            entity: { type: 'diaphragm', id: d.id },
            x: coord.x,
            y: coord.y,
            label: d.name,
            kind: 'diaphragm',
          });
        }
      });
    } else if (activePlate === 'meridians') {
      ACUPOINTS.forEach((pt) => {
        const coord = ACUPOINT_BODY_COORDS[pt.id];
        if (!coord) return;
        const isSelectedPt = selectedEntity.type === 'acupoint' && selectedEntity.id === pt.id;
        if (sideFilter !== 'all' && pt.svgCoords.view !== sideFilter && !isSelectedPt) return;
        const isLinkedPt = linkedIds.has(`acupoint:${pt.id}`);
        const isMeridianActive =
          selectedEntity.type === 'meridian' && pt.meridianId === selectedEntity.id;
        // Show all mapped acupoints or highlight linked ones cleanly
        if (isSelectedPt || isLinkedPt || isMeridianActive || visibleLayers.acupoints) {
          list.push({
            key: `pt-${pt.id}`,
            entity: { type: 'acupoint', id: pt.id },
            x: coord.x,
            y: coord.y,
            label: `${pt.code} ${pt.chineseName} — ${pt.russianName}`,
            kind: 'acupoint',
          });
        }
      });
    }

    return list;
  }, [activePlate, visibleLayers, selectedEntity, linkedIds, sideFilter]);

  const getMarkerStyle = (
    entity: SelectedEntity,
    kind: 'muscle' | 'organ' | 'diaphragm' | 'acupoint'
  ) => {
    const isSelected = selectedEntity.type === entity.type && selectedEntity.id === entity.id;
    const isLinked = linkedIds.has(`${entity.type}:${entity.id}`);

    if (isSelected) {
      return {
        bg: 'bg-blue-700 text-white border-white shadow-md scale-125 z-30',
        ring: 'ring-4 ring-blue-500/35',
      };
    }
    if (isLinked) {
      if (kind === 'organ') {
        return {
          bg: 'bg-emerald-600 text-white border-white shadow-sm scale-110 z-20',
          ring: 'ring-2 ring-emerald-500/30',
        };
      }
      if (kind === 'diaphragm') {
        return {
          bg: 'bg-amber-600 text-white border-white shadow-sm scale-110 z-20',
          ring: 'ring-2 ring-amber-500/30',
        };
      }
      if (kind === 'acupoint') {
        return {
          bg: 'bg-rose-600 text-white border-white shadow-sm scale-110 z-20',
          ring: 'ring-2 ring-rose-500/30',
        };
      }
      return {
        bg: 'bg-blue-600 text-white border-white shadow-sm scale-110 z-20',
        ring: 'ring-2 ring-blue-400/30',
      };
    }

    // Default muted marker
    if (kind === 'organ') {
      return { bg: 'bg-white/95 text-emerald-700 border-emerald-500/70 hover:scale-110 z-10', ring: '' };
    }
    if (kind === 'diaphragm') {
      return { bg: 'bg-white/95 text-amber-700 border-amber-500/70 hover:scale-110 z-10', ring: '' };
    }
    if (kind === 'acupoint') {
      return { bg: 'bg-white/95 text-rose-700 border-rose-500/70 hover:scale-110 z-10', ring: '' };
    }
    return { bg: 'bg-white/95 text-slate-800 border-slate-500/70 hover:border-blue-600 hover:scale-110 z-10', ring: '' };
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Top Plate & Zoom Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
        {/* Open-Source Plate Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {(
            ['muscles', 'head', 'neck', 'organs', 'diaphragm', 'meridians'] as AtlasPlateId[]
          ).map((pid) => (
            <button
              key={pid}
              type="button"
              onClick={() => onChangePlate(pid)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePlate === pid
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {PLATES[pid].label}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.85, Number((s - 0.25).toFixed(2))))}
            className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            title="Уменьшить масштаб"
            aria-label="Уменьшить масштаб"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono tabular-nums text-slate-600 text-[11px] min-w-[46px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(4, Number((s + 0.25).toFixed(2))))}
            className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            title="Увеличить масштаб"
            aria-label="Увеличить масштаб"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetViewport}
            className="inline-flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer ml-1"
            title="Сбросить масштаб и позицию"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Сброс</span>
          </button>
        </div>
      </div>

      {/* Layer & Region Bar */}
      <div className="px-3.5 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          {activePlate === 'muscles' && (
            <>
              {(
                [
                  { id: 'all', label: 'Весь силуэт' },
                  { id: 'head', label: 'Голова' },
                  { id: 'cervical', label: 'Шея' },
                  { id: 'thoracic', label: 'Грудь' },
                  { id: 'upper-limb', label: 'Руки' },
                  { id: 'lumbar', label: 'Таз' },
                  { id: 'lower-limb', label: 'Ноги' },
                ] as const
              ).map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => onChangeZoomZone(z.id)}
                  className={`px-2 py-0.5 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    zoomZone === z.id
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </>
          )}
          {activePlate === 'meridians' && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue-600 inline-block" /> Тай-инь (LU, SP)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-red-600 inline-block" /> Тай-ян (SI, BL)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" /> Ян-мин (LI, ST)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-500 inline-block" /> Цзюэ-инь (PC, LR)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-fuchsia-600 inline-block" /> Шао-ян (TE, GB)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-slate-800 inline-block" /> Шао-инь (HT, KI)
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {activePlate === 'muscles' && (
            <>
              <button
                type="button"
                onClick={() => onToggleLayer('muscles')}
                className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap ${
                  visibleLayers.muscles
                    ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                Мышцы
              </button>
              <button
                type="button"
                onClick={() => onToggleLayer('diaphragms')}
                className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap ${
                  visibleLayers.diaphragms
                    ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                Диафрагмы
              </button>
              <button
                type="button"
                onClick={() => onToggleLayer('chains')}
                className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap ${
                  visibleLayers.chains
                    ? 'bg-violet-50 border-violet-200 text-violet-800 font-medium'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                Миофасц. цепи
              </button>
            </>
          )}
          {activePlate === 'meridians' && (
            <button
              type="button"
              onClick={() => onToggleLayer('acupoints')}
              className={`px-2 py-0.5 rounded border cursor-pointer whitespace-nowrap ${
                visibleLayers.acupoints
                  ? 'bg-rose-50 border-rose-200 text-rose-800 font-medium'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              Все точки
            </button>
          )}
        </div>
      </div>

      {/* Interactive Pan/Zoom Anatomical Plate Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative flex-1 min-h-[380px] bg-white overflow-hidden select-none flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Active Chain Info Banner if a chain is overlaid */}
        {activePlate === 'muscles' && activeChainsToDraw.length > 0 && (
          <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex justify-between items-start gap-2">
            <div className="pointer-events-auto bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs flex items-center gap-2 text-xs">
              <span
                className="w-3 h-1 rounded-full shrink-0"
                style={{ backgroundColor: activeChainsToDraw[0].color }}
              />
              <button
                type="button"
                onClick={() =>
                  onSelectEntity({ type: 'chain', id: activeChainsToDraw[0].id })
                }
                className="font-semibold text-slate-900 hover:text-blue-700 cursor-pointer text-left"
              >
                {activeChainsToDraw[0].name}
              </button>
              <span className="text-slate-400 hidden sm:inline">·</span>
              <span className="text-slate-500 hidden sm:inline">
                {activeChainsToDraw[0].plane}
              </span>
            </div>
          </div>
        )}

        {/* Hovered Marker Floating Label */}
        {hoveredLabel && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-slate-900/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap max-w-[90%] truncate">
            {hoveredLabel}
          </div>
        )}

        {/* Zoomable & Pannable Plate Aspect Box */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            aspectRatio: `${plate.width} / ${plate.height}`,
          }}
          className="relative max-h-full max-w-full h-full flex items-center justify-center p-3"
        >
          <div
            className="relative w-full h-full"
            style={{ aspectRatio: `${plate.width} / ${plate.height}` }}
          >
            <img
              src={plate.src}
              alt={plate.label}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none block"
            />

            {/* Precision SVG Overlay for Myofascial Chains */}
            {activePlate === 'muscles' && activeChainsToDraw.length > 0 && (
              <svg
                viewBox={`0 0 ${plate.width} ${plate.height}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="xMidYMid meet"
              >
                {activeChainsToDraw.map((chain) =>
                  chain.platePaths.map((p, idx) => (
                    <g key={`${chain.id}-${idx}`}>
                      <path
                        d={pointsToSvgPath(p.points)}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.75}
                      />
                      <path
                        d={pointsToSvgPath(p.points)}
                        fill="none"
                        stroke={chain.color}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={selectedEntity.type === 'chain' ? undefined : '8 5'}
                      />
                      {p.points.map(([px, py], ptIdx) => (
                        <circle
                          key={ptIdx}
                          cx={px}
                          cy={py}
                          r={4.5}
                          fill={chain.color}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      ))}
                    </g>
                  ))
                )}
              </svg>
            )}

            {/* Interactive Calibrated Hotspots Layer */}
            <div className="absolute inset-0">
              {markers.map((m) => {
                const leftPct = (m.x / plate.width) * 100;
                const topPct = (m.y / plate.height) * 100;
                const style = getMarkerStyle(m.entity, m.kind);
                const isSelected =
                  selectedEntity.type === m.entity.type && selectedEntity.id === m.entity.id;

                return (
                  <button
                    key={m.key}
                    type="button"
                    data-hotspot="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntity(m.entity);
                    }}
                    onMouseEnter={() => setHoveredLabel(m.label)}
                    onMouseLeave={() => setHoveredLabel(null)}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    aria-label={m.label}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-transform duration-150 cursor-pointer flex items-center justify-center ${
                      m.kind === 'acupoint' ? 'w-3.5 h-3.5' : 'w-4 h-4'
                    } ${style.bg} ${style.ring}`}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Attribution & Pan Hint */}
        <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 bg-white/90 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="truncate">{plate.sourceAttribution}</span>
          <span className="hidden sm:inline-flex items-center gap-1 shrink-0 ml-2">
            <Move className="w-3 h-3" />
            Колёсико: масштаб · Перетаскивание: панорама
          </span>
        </div>
      </div>
    </div>
  );
};
