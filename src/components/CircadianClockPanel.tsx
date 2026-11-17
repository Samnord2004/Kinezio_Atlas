import React, { useMemo } from 'react';
import {
  ACUPOINTS,
  CIRCADIAN_MAP,
  CIRCADIAN_SLOTS,
  MERIDIANS,
  MUSCLES,
  ORGANS,
  SYMPTOMS,
} from '../data';
import { CircadianPeriodId, SelectedEntity } from '../types/atlas';
import { ArrowUpRight, Clock, Stethoscope, Sun } from 'lucide-react';

interface CircadianClockPanelProps {
  selectedPeriodId: CircadianPeriodId;
  onSelectPeriod: (id: CircadianPeriodId) => void;
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onSelectSymptomForCascade?: (symptomId: string) => void;
  onOpenSymptomSearch?: (symptomId: string) => void;
  onStartMmtWithSymptom?: (symptomId: string) => void;
}

const CX = 170;
const CY = 170;
const R_OUTER = 138;
const R_INNER = 64;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildSectorPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polarToXY(cx, cy, rOut, startDeg);
  const p2 = polarToXY(cx, cy, rOut, endDeg);
  const p3 = polarToXY(cx, cy, rIn, endDeg);
  const p4 = polarToXY(cx, cy, rIn, startDeg);
  return [
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `A ${rOut} ${rOut} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `A ${rIn} ${rIn} 0 0 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

/** Order clockwise on 24h dial starting at 00:00 (top = 23–01 centered at 0°, 06–09 around 105° etc.) */
const CLOCK_ANGLE_CENTERS: Record<CircadianPeriodId, number> = {
  '23-01': 0,
  '01-03': 30,
  '03-05': 60,
  '05-07': 90,
  '06-09': 120,
  '09-11': 150,
  '11-13': 180,
  '13-15': 210,
  '15-17': 240,
  '17-19': 270,
  '19-21': 300,
  '21-23': 330,
};

export const CircadianClockPanel: React.FC<CircadianClockPanelProps> = ({
  selectedPeriodId,
  onSelectPeriod,
  onOpenInAtlas,
  onSelectSymptomForCascade,
  onOpenSymptomSearch,
  onStartMmtWithSymptom,
}) => {
  const activeSlot = CIRCADIAN_MAP[selectedPeriodId] ?? CIRCADIAN_SLOTS[3];

  const activeMeridian = useMemo(
    () => MERIDIANS.find((m) => m.id === activeSlot.meridianId),
    [activeSlot.meridianId]
  );
  const oppositeMeridian = useMemo(
    () => MERIDIANS.find((m) => m.id === activeSlot.oppositeMeridianId),
    [activeSlot.oppositeMeridianId]
  );
  const activeOrgans = useMemo(
    () => ORGANS.filter((o) => activeSlot.organIds.includes(o.id)),
    [activeSlot.organIds]
  );
  const activeMuscles = useMemo(
    () => MUSCLES.filter((m) => activeSlot.muscleIds.includes(m.id)),
    [activeSlot.muscleIds]
  );
  const activeAcupoints = useMemo(
    () => ACUPOINTS.filter((p) => activeSlot.keyAcupointCodes.includes(p.code)),
    [activeSlot.keyAcupointCodes]
  );
  const matchingSymptoms = useMemo(
    () =>
      SYMPTOMS.filter((s) =>
        s.timeProfile.circadianPeriods.includes(activeSlot.id)
      ),
    [activeSlot.id]
  );

  const oppositePeriodSlot = useMemo(
    () => CIRCADIAN_SLOTS.find((s) => s.meridianId === activeSlot.oppositeMeridianId),
    [activeSlot.oppositeMeridianId]
  );

  return (
    <div className="space-y-5">
      {/* 24-Hour Horizontal Strip Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Суточная шкала возникновения дискомфорта (Биологические часы органов, 24 ч)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Выберите интервал времени, когда у пациента чаще всего возникает боль, спазм или
              дискомфорт (например, 06:00–08:00/09:00 → Желудок)
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shrink-0">
            Пик: <strong className="text-blue-700">{activeSlot.hoursLabel}</strong> · {activeSlot.organTitle}
          </div>
        </div>

        {/* 12 Horizontal 2-hour Slots across 24h */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {CIRCADIAN_SLOTS.map((slot) => {
            const isActive = slot.id === activeSlot.id;
            const symCount = SYMPTOMS.filter((s) =>
              s.timeProfile.circadianPeriods.includes(slot.id)
            ).length;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSelectPeriod(slot.id)}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-700 border-blue-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-mono tabular-nums">
                  <span className={isActive ? 'text-blue-100' : 'text-slate-500'}>
                    {slot.hoursLabel}
                  </span>
                  <span className={isActive ? 'text-blue-200' : 'text-slate-400'}>
                    {symCount} ж.
                  </span>
                </div>
                <div className="text-xs font-bold leading-snug mt-0.5 truncate">
                  {slot.organTitle}
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {slot.dayPart}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clock Dial SVG + Active Organ-Hour Deep Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive 24h SVG Dial */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center space-y-3">
          <div className="w-full flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Циферблат 24 часа</span>
            <span className="font-mono text-[11px]">Закон «Полдень–Полночь»</span>
          </div>

          <svg
            viewBox="0 0 340 340"
            className="w-full max-w-[320px] h-auto select-none"
            role="img"
            aria-label="Суточные биологические часы органов и меридианов"
          >
            {/* Outer subtle reference ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_OUTER + 16}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
            />

            {CIRCADIAN_SLOTS.map((slot) => {
              const centerDeg = CLOCK_ANGLE_CENTERS[slot.id];
              const startDeg = centerDeg - 15;
              const endDeg = centerDeg + 15;
              const isSelected = slot.id === activeSlot.id;
              const isOpposite = oppositePeriodSlot?.id === slot.id;

              const labelPos = polarToXY(CX, CY, (R_INNER + R_OUTER) / 2, centerDeg);
              const hourPos = polarToXY(CX, CY, R_OUTER + 24, centerDeg);

              let fill = '#f8fafc';
              let stroke = '#cbd5e1';
              let textColor = '#334155';

              if (isSelected) {
                fill = '#1d4ed8';
                stroke = '#1e3a8a';
                textColor = '#ffffff';
              } else if (isOpposite) {
                fill = '#fef3c7';
                stroke = '#d97706';
                textColor = '#92400e';
              }

              const shortMer = slot.organTitle.match(/\(([^)]+)\)/)?.[1] ?? slot.id;

              return (
                <g
                  key={slot.id}
                  onClick={() => onSelectPeriod(slot.id)}
                  className="cursor-pointer"
                >
                  <path
                    d={buildSectorPath(CX, CY, R_INNER, R_OUTER, startDeg, endDeg)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill={textColor}
                  >
                    {shortMer}
                  </text>
                  <text
                    x={hourPos.x}
                    y={hourPos.y + 3}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight={isSelected ? 700 : 500}
                    fill={isSelected ? '#1d4ed8' : '#64748b'}
                  >
                    {slot.id}
                  </text>
                </g>
              );
            })}

            {/* Center hub summary */}
            <circle cx={CX} cy={CY} r={R_INNER - 4} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5} />
            <text
              x={CX}
              y={CY - 12}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fontFamily="IBM Plex Mono, monospace"
              fill="#1d4ed8"
            >
              {activeSlot.hoursLabel}
            </text>
            <text
              x={CX}
              y={CY + 5}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight={700}
              fill="#0f172a"
            >
              {activeSlot.organTitle.split('(')[0].trim()}
            </text>
            <text
              x={CX}
              y={CY + 22}
              textAnchor="middle"
              fontSize={9}
              fill="#64748b"
            >
              {activeMeridian?.element ?? ''} · {activeMeridian?.polarity ?? ''}
            </text>
          </svg>

          <div className="w-full text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-4 pt-1 border-t border-slate-100">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-700 inline-block" />
              Пик активности (максимум Ци)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-200 border border-amber-500 inline-block" />
              Минимум (12 ч напротив)
            </span>
          </div>
        </div>

        {/* Right: Detailed Physiological & Clinical Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="space-y-1 pb-3 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-bold text-blue-700 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeSlot.practicalWindow}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeSlot.dayPart}</span>
                {activeMeridian && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Первоэлемент: <strong className="text-slate-800">{activeMeridian.element}</strong>
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{activeSlot.organTitle}</h3>
              <p className="text-sm text-slate-700 leading-relaxed pt-1">
                {activeSlot.clinicalMeaning}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-semibold text-blue-800">
                  Процессы в организме в эти часы
                </div>
                <p className="text-slate-700 leading-relaxed">{activeSlot.physiologicalProcess}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="font-semibold text-emerald-800">
                  На что обратить внимание в ММТ
                </div>
                <p className="text-slate-700 leading-relaxed">{activeSlot.mmtFocus}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-900">
                Типичный дискомфорт пациента в период {activeSlot.hoursLabel}:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {activeSlot.typicalComplaints.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {oppositeMeridian && oppositePeriodSlot && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-slate-700">
                <strong className="text-amber-900">Правило «Полдень–Полночь»:</strong> в период{' '}
                <span className="font-mono">{activeSlot.hoursLabel}</span> минимальной активностью
                обладает противоположный канал{' '}
                <button
                  type="button"
                  onClick={() =>
                    onOpenInAtlas({ type: 'meridian', id: oppositeMeridian.id })
                  }
                  className="text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  {oppositeMeridian.code} {oppositeMeridian.name}
                </button>{' '}
                (его пик — {oppositePeriodSlot.hoursLabel}). При избытке одного меридиана возможен
                дефицит в противоположном.
              </div>
            )}

            {/* Quick Links into Atlas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <div className="font-semibold text-slate-800 mb-1">Мышцы-индикаторы ММТ</div>
                <div className="space-y-1">
                  {activeMuscles.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'muscle', id: m.id })}
                      className="block text-left text-blue-700 hover:underline cursor-pointer"
                    >
                      {m.name} →
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">Органы и меридиан</div>
                <div className="space-y-1">
                  {activeOrgans.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'organ', id: o.id })}
                      className="block text-left text-emerald-700 hover:underline cursor-pointer"
                    >
                      {o.name} →
                    </button>
                  ))}
                  {activeMeridian && (
                    <button
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'meridian', id: activeMeridian.id })}
                      className="block text-left text-violet-700 hover:underline cursor-pointer"
                    >
                      {activeMeridian.code} {activeMeridian.name} →
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">Точки коррекции</div>
                <div className="space-y-1">
                  {activeAcupoints.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'acupoint', id: pt.id })}
                      className="block text-left text-rose-700 hover:underline cursor-pointer"
                    >
                      {pt.code} ({pt.chineseName}) →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Matching Complaints from Directory for this Time Window */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Клинические жалобы справочника для интервала {activeSlot.hoursLabel} (
                {matchingSymptoms.length})
              </h3>
            </div>

            {matchingSymptoms.length === 0 ? (
              <p className="text-xs text-slate-500">
                Для данного интервала пока не привязаны отдельные жалобы.
              </p>
            ) : (
              <div className="space-y-2.5">
                {matchingSymptoms.map((sym) => (
                  <div
                    key={sym.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-[11px] text-amber-800 font-semibold">
                        {sym.timeProfile.peakWindow}
                      </div>
                      <div className="text-sm font-bold text-slate-900">{sym.title}</div>
                      <p className="text-slate-600 line-clamp-2">{sym.clinicalSummary}</p>
                    </div>

                    <div className="flex flex-wrap sm:flex-col items-end gap-1.5 shrink-0">
                      {onOpenSymptomSearch && (
                        <button
                          type="button"
                          onClick={() => onOpenSymptomSearch(sym.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <span>Разбор симптома</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                      {onSelectSymptomForCascade && (
                        <button
                          type="button"
                          onClick={() => onSelectSymptomForCascade(sym.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md cursor-pointer"
                        >
                          <span>Этапы развития →</span>
                        </button>
                      )}
                      {onStartMmtWithSymptom && (
                        <button
                          type="button"
                          onClick={() => onStartMmtWithSymptom(sym.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer"
                        >
                          <Stethoscope className="w-3 h-3" />
                          <span>На приём ММТ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
