import React, { useMemo, useState } from 'react';
import {
  Diaphragm,
  Meridian,
  Muscle,
  Organ,
  SelectedEntity,
} from '../types/atlas';
import { GitBranch, Maximize2, Network, X } from 'lucide-react';

interface MuscleConnectionsGraphProps {
  muscle: Muscle;
  diaphragms: Diaphragm[];
  meridians: Meridian[];
  organs: Organ[];
  onSelectEntity: (entity: SelectedEntity) => void;
}

type GraphCategoryFilter = 'all' | 'diaphragm' | 'meridian' | 'organ';

type NodeKind = 'muscle' | 'diaphragm' | 'meridian' | 'organ';

interface GraphNode {
  key: string;
  kind: NodeKind;
  id: string;
  title: string;
  shortTitle: string;
  meta: string;
  prefix: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  tier: 'primary' | 'secondary';
  kind: 'diaphragm' | 'meridian' | 'organ' | 'cross';
  label: string;
}

const VB_W = 520;
const VB_H = 380;
const CENTER_X = 260;
const CENTER_Y = 188;
const CENTER_W = 160;
const CENTER_H = 46;

function truncateLabel(text: string, maxLen: number): string {
  const clean = text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`;
}

function getTopSectorPositions(count: number): Array<{ x: number; y: number }> {
  if (count === 1) return [{ x: 260, y: 46 }];
  if (count === 2) {
    return [
      { x: 158, y: 48 },
      { x: 362, y: 48 },
    ];
  }
  if (count === 3) {
    return [
      { x: 96, y: 66 },
      { x: 260, y: 30 },
      { x: 424, y: 66 },
    ];
  }
  return [
    { x: 86, y: 80 },
    { x: 172, y: 30 },
    { x: 348, y: 30 },
    { x: 434, y: 80 },
  ];
}

function getBottomLeftPositions(count: number): Array<{ x: number; y: number }> {
  if (count === 1) return [{ x: 124, y: 296 }];
  if (count === 2) {
    return [
      { x: 102, y: 264 },
      { x: 146, y: 326 },
    ];
  }
  if (count === 3) {
    return [
      { x: 88, y: 244 },
      { x: 112, y: 296 },
      { x: 160, y: 348 },
    ];
  }
  return [
    { x: 86, y: 230 },
    { x: 88, y: 272 },
    { x: 112, y: 314 },
    { x: 168, y: 354 },
  ];
}

function getBottomRightPositions(count: number): Array<{ x: number; y: number }> {
  if (count === 1) return [{ x: 396, y: 296 }];
  if (count === 2) {
    return [
      { x: 418, y: 264 },
      { x: 374, y: 326 },
    ];
  }
  if (count === 3) {
    return [
      { x: 432, y: 244 },
      { x: 408, y: 296 },
      { x: 360, y: 348 },
    ];
  }
  return [
    { x: 434, y: 230 },
    { x: 432, y: 272 },
    { x: 408, y: 314 },
    { x: 352, y: 354 },
  ];
}

const NODE_STYLE: Record<
  NodeKind,
  {
    fill: string;
    activeFill: string;
    stroke: string;
    text: string;
    subtext: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  muscle: {
    fill: '#0F172A',
    activeFill: '#1E293B',
    stroke: '#2563EB',
    text: '#FFFFFF',
    subtext: '#94A3B8',
    badgeBg: '#1D4ED8',
    badgeText: '#FFFFFF',
  },
  diaphragm: {
    fill: '#FFFBEB',
    activeFill: '#FEF3C7',
    stroke: '#D97706',
    text: '#78350F',
    subtext: '#B45309',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
  },
  meridian: {
    fill: '#EEF2FF',
    activeFill: '#E0E7FF',
    stroke: '#4F46E5',
    text: '#1E1B4B',
    subtext: '#4338CA',
    badgeBg: '#E0E7FF',
    badgeText: '#3730A3',
  },
  organ: {
    fill: '#ECFDF5',
    activeFill: '#D1FAE5',
    stroke: '#059669',
    text: '#064E3B',
    subtext: '#047857',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
  },
};

const EDGE_COLOR: Record<GraphEdge['kind'], string> = {
  diaphragm: '#D97706',
  meridian: '#4F46E5',
  organ: '#059669',
  cross: '#64748B',
};

function computeCurvePath(a: GraphNode, b: GraphNode, curveBias = 0.14): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx - dy * curveBias;
  const cy = my + dx * curveBias;
  return `M ${a.x} ${a.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
}

export const MuscleConnectionsGraph: React.FC<MuscleConnectionsGraphProps> = ({
  muscle,
  diaphragms,
  meridians,
  organs,
  onSelectEntity,
}) => {
  const [filter, setFilter] = useState<GraphCategoryFilter>('all');
  const [showSecondaryLinks, setShowSecondaryLinks] = useState<boolean>(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const visibleDiaphragms = useMemo(
    () => (filter === 'all' || filter === 'diaphragm' ? diaphragms.slice(0, 4) : []),
    [diaphragms, filter]
  );
  const visibleMeridians = useMemo(
    () => (filter === 'all' || filter === 'meridian' ? meridians.slice(0, 4) : []),
    [meridians, filter]
  );
  const visibleOrgans = useMemo(
    () => (filter === 'all' || filter === 'organ' ? organs.slice(0, 4) : []),
    [organs, filter]
  );

  const { nodes, edges, nodeMap } = useMemo(() => {
    const centerNode: GraphNode = {
      key: `muscle:${muscle.id}`,
      kind: 'muscle',
      id: muscle.id,
      title: muscle.name,
      shortTitle: truncateLabel(muscle.name, 20),
      meta: `${muscle.latinName} · ${muscle.spinalSegment}`,
      prefix: 'МЫШЦА',
      x: CENTER_X,
      y: CENTER_Y,
      width: CENTER_W,
      height: CENTER_H,
    };

    const dCoords = getTopSectorPositions(visibleDiaphragms.length);
    const oCoords = getBottomLeftPositions(visibleOrgans.length);
    const mCoords = getBottomRightPositions(visibleMeridians.length);

    const dNodes: GraphNode[] = visibleDiaphragms.map((d, idx) => ({
      key: `diaphragm:${d.id}`,
      kind: 'diaphragm',
      id: d.id,
      title: d.name,
      shortTitle: truncateLabel(d.name, 17),
      meta: d.level,
      prefix: 'Д',
      x: dCoords[idx].x,
      y: dCoords[idx].y,
      width: 142,
      height: 34,
    }));

    const oNodes: GraphNode[] = visibleOrgans.map((o, idx) => ({
      key: `organ:${o.id}`,
      kind: 'organ',
      id: o.id,
      title: o.name,
      shortTitle: truncateLabel(o.name, 17),
      meta: o.system,
      prefix: 'О',
      x: oCoords[idx].x,
      y: oCoords[idx].y,
      width: 142,
      height: 34,
    }));

    const mNodes: GraphNode[] = visibleMeridians.map((mer, idx) => ({
      key: `meridian:${mer.id}`,
      kind: 'meridian',
      id: mer.id,
      title: `${mer.code} · ${mer.name}`,
      shortTitle: `${mer.code} · ${truncateLabel(mer.name, 13)}`,
      meta: `${mer.element} · ${mer.activeHours}`,
      prefix: 'М',
      x: mCoords[idx].x,
      y: mCoords[idx].y,
      width: 144,
      height: 34,
    }));

    const allNodes = [centerNode, ...dNodes, ...oNodes, ...mNodes];
    const map = new Map<string, GraphNode>();
    allNodes.forEach((n) => map.set(n.key, n));

    const edgeList: GraphEdge[] = [];

    dNodes.forEach((n) => {
      edgeList.push({
        id: `${centerNode.key}->${n.key}`,
        from: centerNode.key,
        to: n.key,
        tier: 'primary',
        kind: 'diaphragm',
        label: 'Фасциально-диафрагмальная связь',
      });
    });

    oNodes.forEach((n) => {
      edgeList.push({
        id: `${centerNode.key}->${n.key}`,
        from: centerNode.key,
        to: n.key,
        tier: 'primary',
        kind: 'organ',
        label: 'Висцеро-моторный рефлекс',
      });
    });

    mNodes.forEach((n) => {
      edgeList.push({
        id: `${centerNode.key}->${n.key}`,
        from: centerNode.key,
        to: n.key,
        tier: 'primary',
        kind: 'meridian',
        label: 'Меридианно-мышечная ассоциация',
      });
    });

    // Secondary cross-links between displayed organs, diaphragms, and meridians
    const addedCross = new Set<string>();
    const pushCross = (k1: string, k2: string, label: string) => {
      const canonical = k1 < k2 ? `${k1}<->${k2}` : `${k2}<->${k1}`;
      if (addedCross.has(canonical)) return;
      if (!map.has(k1) || !map.has(k2)) return;
      addedCross.add(canonical);
      edgeList.push({
        id: canonical,
        from: k1,
        to: k2,
        tier: 'secondary',
        kind: 'cross',
        label,
      });
    };

    visibleOrgans.forEach((org) => {
      visibleDiaphragms.forEach((dia) => {
        if (org.diaphragmIds.includes(dia.id) || dia.organIds.includes(org.id)) {
          pushCross(`organ:${org.id}`, `diaphragm:${dia.id}`, 'Орган ↔ Диафрагма');
        }
      });
      visibleMeridians.forEach((mer) => {
        if (org.meridianIds.includes(mer.id) || mer.organIds.includes(org.id)) {
          pushCross(`organ:${org.id}`, `meridian:${mer.id}`, 'Орган ↔ Меридиан');
        }
      });
    });

    visibleDiaphragms.forEach((dia) => {
      visibleMeridians.forEach((mer) => {
        if (dia.meridianIds.includes(mer.id) || mer.diaphragmIds.includes(dia.id)) {
          pushCross(`diaphragm:${dia.id}`, `meridian:${mer.id}`, 'Диафрагма ↔ Меридиан');
        }
      });
    });

    return { nodes: allNodes, edges: edgeList, nodeMap: map };
  }, [muscle, visibleDiaphragms, visibleMeridians, visibleOrgans]);

  const renderedEdges = useMemo(
    () => (showSecondaryLinks ? edges : edges.filter((e) => e.tier === 'primary')),
    [edges, showSecondaryLinks]
  );

  const activeRelatedKeys = useMemo(() => {
    if (!hoveredKey) return null;
    const set = new Set<string>([hoveredKey]);
    renderedEdges.forEach((e) => {
      if (e.from === hoveredKey) set.add(e.to);
      if (e.to === hoveredKey) set.add(e.from);
    });
    return set;
  }, [hoveredKey, renderedEdges]);

  const hoveredNode = hoveredKey ? nodeMap.get(hoveredKey) : undefined;
  const hoveredEdgeCount = useMemo(() => {
    if (!hoveredKey) return 0;
    return renderedEdges.filter((e) => e.from === hoveredKey || e.to === hoveredKey).length;
  }, [hoveredKey, renderedEdges]);

  const totalSatellites = diaphragms.length + meridians.length + organs.length;
  if (totalSatellites === 0) return null;

  const secondaryCount = edges.filter((e) => e.tier === 'secondary').length;

  const renderSvgCanvas = (large = false) => (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Интерактивный граф связей мышцы ${muscle.name}`}
      className={`w-full h-auto block select-none ${large ? 'max-h-[72vh]' : ''}`}
    >
      <defs>
        <pattern
          id={`graph-grid-${large ? 'lg' : 'sm'}`}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 26 0 L 0 0 0 26"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="0.6"
            strokeOpacity="0.65"
          />
        </pattern>
      </defs>

      {/* Background grid */}
      <rect width={VB_W} height={VB_H} fill="#F8FAFC" rx="8" />
      <rect
        width={VB_W}
        height={VB_H}
        fill={`url(#graph-grid-${large ? 'lg' : 'sm'})`}
        rx="8"
      />

      {/* Sector guide labels */}
      {(filter === 'all' || filter === 'diaphragm') && visibleDiaphragms.length > 0 && (
        <text
          x={14}
          y={18}
          fontSize="9"
          fontWeight="600"
          fill="#B45309"
          letterSpacing="0.06em"
        >
          ДИАФРАГМЫ ({diaphragms.length})
        </text>
      )}
      {(filter === 'all' || filter === 'organ') && visibleOrgans.length > 0 && (
        <text
          x={14}
          y={VB_H - 10}
          fontSize="9"
          fontWeight="600"
          fill="#047857"
          letterSpacing="0.06em"
        >
          ОРГАНЫ ({organs.length})
        </text>
      )}
      {(filter === 'all' || filter === 'meridian') && visibleMeridians.length > 0 && (
        <text
          x={VB_W - 14}
          y={VB_H - 10}
          textAnchor="end"
          fontSize="9"
          fontWeight="600"
          fill="#4338CA"
          letterSpacing="0.06em"
        >
          МЕРИДИАНЫ ({meridians.length})
        </text>
      )}

      {/* Edges (secondary behind primary) */}
      {[...renderedEdges]
        .sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'secondary' ? -1 : 1))
        .map((edge, idx) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const isHighlighted =
            !hoveredKey || edge.from === hoveredKey || edge.to === hoveredKey;
          const bias =
            edge.tier === 'secondary'
              ? idx % 2 === 0
                ? 0.16
                : -0.16
              : idx % 2 === 0
              ? 0.08
              : -0.08;
          const d = computeCurvePath(fromNode, toNode, bias);

          return (
            <path
              key={edge.id}
              d={d}
              fill="none"
              stroke={EDGE_COLOR[edge.kind]}
              strokeWidth={
                edge.tier === 'primary'
                  ? isHighlighted && hoveredKey
                    ? 2.4
                    : 1.7
                  : isHighlighted && hoveredKey
                  ? 1.7
                  : 1.15
              }
              strokeDasharray={edge.tier === 'secondary' ? '4 3' : undefined}
              strokeOpacity={
                !hoveredKey
                  ? edge.tier === 'primary'
                    ? 0.72
                    : 0.45
                  : isHighlighted
                  ? 0.95
                  : 0.14
              }
              className="transition-opacity duration-150"
            />
          );
        })}

      {/* Nodes */}
      {nodes.map((node) => {
        const style = NODE_STYLE[node.kind];
        const isHovered = hoveredKey === node.key;
        const isConnected = !activeRelatedKeys || activeRelatedKeys.has(node.key);
        const x = node.x - node.width / 2;
        const y = node.y - node.height / 2;
        const isCenter = node.kind === 'muscle';

        return (
          <g
            key={node.key}
            role={isCenter ? undefined : 'button'}
            tabIndex={isCenter ? -1 : 0}
            aria-label={
              isCenter
                ? `Выбранная мышца: ${node.title}`
                : `Открыть ${node.title} (${node.meta})`
            }
            onMouseEnter={() => setHoveredKey(node.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onFocus={() => setHoveredKey(node.key)}
            onBlur={() => setHoveredKey(null)}
            onClick={() => {
              if (!isCenter) {
                setIsExpanded(false);
                onSelectEntity({ type: node.kind, id: node.id });
              }
            }}
            onKeyDown={(e) => {
              if (!isCenter && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setIsExpanded(false);
                onSelectEntity({ type: node.kind, id: node.id });
              }
            }}
            style={{
              opacity: isConnected ? 1 : 0.3,
              cursor: isCenter ? 'default' : 'pointer',
              transition: 'opacity 150ms ease',
            }}
          >
            <rect
              x={x}
              y={y}
              width={node.width}
              height={node.height}
              rx={isCenter ? 8 : 6}
              fill={isHovered ? style.activeFill : style.fill}
              stroke={style.stroke}
              strokeWidth={isHovered || isCenter ? 1.8 : 1.15}
            />

            {isCenter ? (
              <>
                <text
                  x={node.x}
                  y={node.y - 6}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fill={style.text}
                >
                  {node.shortTitle}
                </text>
                <text
                  x={node.x}
                  y={node.y + 10}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill={style.subtext}
                >
                  {truncateLabel(muscle.spinalSegment, 22)}
                </text>
              </>
            ) : (
              <>
                {/* Explicit category tag prefix inside node */}
                <rect
                  x={x + 5}
                  y={y + 6}
                  width={18}
                  height={22}
                  rx={4}
                  fill={style.badgeBg}
                />
                <text
                  x={x + 14}
                  y={node.y + 3.5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={style.badgeText}
                >
                  {node.prefix}
                </text>
                <text
                  x={x + 28}
                  y={node.y - 1}
                  fontSize="9.5"
                  fontWeight="600"
                  fill={style.text}
                >
                  {node.shortTitle}
                </text>
                <text
                  x={x + 28}
                  y={node.y + 10.5}
                  fontSize="8"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill={style.subtext}
                >
                  {truncateLabel(node.meta, 19)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );

  return (
    <>
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        {/* Top Toolbar */}
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Network className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="text-xs font-semibold text-slate-900 truncate">
              Граф связей мышцы
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {secondaryCount > 0 && (
              <button
                type="button"
                onClick={() => setShowSecondaryLinks((v) => !v)}
                className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1 ${
                  showSecondaryLinks
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
                title="Показать перекрёстные связи между органами, диафрагмами и меридианами"
              >
                <GitBranch className="w-3 h-3" />
                <span>Контур ({secondaryCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              title="Развернуть схему"
              aria-label="Развернуть интерактивный граф связей"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filter Segmented Control */}
        <div className="px-3 py-2 border-b border-slate-100 bg-white flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'all', label: `Все (${totalSatellites})` },
              { id: 'diaphragm', label: `Диафрагмы (${diaphragms.length})`, count: diaphragms.length },
              { id: 'meridian', label: `Меридианы (${meridians.length})`, count: meridians.length },
              { id: 'organ', label: `Органы (${organs.length})`, count: organs.length },
            ] as const
          ).map((tab) => {
            const disabled = 'count' in tab && tab.count === 0;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums ${
                  disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : active
                    ? 'bg-slate-900 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Interactive SVG Canvas */}
        <div className="p-2 bg-white">{renderSvgCanvas(false)}</div>

        {/* Live Telemetry Readout Bar */}
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/80 text-[11px] text-slate-600 flex items-center justify-between gap-2 min-h-[34px]">
          {hoveredNode ? (
            <>
              <div className="min-w-0 truncate">
                <span className="font-semibold text-slate-900">{hoveredNode.title}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span>{hoveredNode.meta}</span>
              </div>
              <span className="font-mono tabular-nums text-slate-500 shrink-0">
                {hoveredNode.kind === 'muscle'
                  ? `${hoveredEdgeCount} связей`
                  : `Перейти · ${hoveredEdgeCount} зв.`}
              </span>
            </>
          ) : (
            <>
              <span className="truncate">
                Наведите на узел для подсветки контура · Нажмите для перехода
              </span>
              <span className="font-mono tabular-nums text-slate-500 shrink-0">
                Сплошные — прямые · Пунктир — контур
              </span>
            </>
          )}
        </div>
      </div>

      {/* Expanded Graph Lightbox */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-blue-700">
                  Интерактивная схема взаимосвязей
                </div>
                <h4 className="text-base font-bold text-slate-900 truncate">{muscle.name}</h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {secondaryCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSecondaryLinks((v) => !v)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                      showSecondaryLinks
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Контурные связи ({secondaryCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-md cursor-pointer"
                  aria-label="Закрыть схему"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-white">{renderSvgCanvas(true)}</div>

            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
              {hoveredNode ? (
                <div className="truncate">
                  <strong className="text-slate-900">{hoveredNode.title}</strong>
                  <span className="mx-1.5 text-slate-400">·</span>
                  <span>{hoveredNode.meta}</span>
                </div>
              ) : (
                <span>
                  Д — диафрагмы · М — меридианы · О — внутренние органы. Нажмите на любой узел для открытия его карточки в атласе.
                </span>
              )}
              <span className="font-mono tabular-nums text-slate-500">
                Узлов: {nodes.length} · Связей: {renderedEdges.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
