import React, { useEffect, useMemo, useState } from 'react';
import {
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_SIDE_META,
  ANATOMICAL_ZONES,
  CIRCADIAN_MAP,
  CIRCADIAN_SLOTS,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  ORGANS,
  SYMPTOMS,
  getSymptomSide,
  getTriadCorrections,
  matchCircadianPeriodsByText,
} from '../data';
import {
  AnatomicalSide,
  AnatomicalZoneId,
  CircadianPeriodId,
  SelectedEntity,
  SymptomCause,
} from '../types/atlas';
import { MMTSchematicDiagram } from './MMTSchematicDiagram';
import { fuzzyMatchScore } from '../utils/fuzzySearch';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Search,
  Stethoscope,
  Sun,
  X,
} from 'lucide-react';

interface SymptomSearchViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onOpenTimeline?: (symptomId: string, circadianPeriod?: CircadianPeriodId) => void;
  initialSymptomId?: string | null;
}

const QUICK_SYMPTOMS = [
  { label: 'С 6 до 8 утра (желудок)', query: 'с 6 до 8' },
  { label: 'Шум (писк) в ушах', query: 'шум в ушах' },
  { label: 'Щелчки в колене', query: 'щелчки в колене' },
  { label: 'Щелчки голеностоп', query: 'щелчки в голеностопе' },
  { label: 'Щелчки кисть / палец', query: 'щелчки в кисти' },
  { label: 'Щелчки в локте', query: 'щелчки в локте' },
  { label: 'Боль в пояснице', query: 'поясница' },
  { label: 'Пробуждение 01–03 (печень)', query: '01:00' },
  { label: 'Пятка утром', query: 'пятке' },
  { label: 'Щелчок ВНЧС', query: 'внчс' },
  { label: 'Немеют руки', query: 'немеют' },
  { label: 'Упадок сил 17–19', query: '17:00' },
];

export const SymptomSearchView: React.FC<SymptomSearchViewProps> = ({
  onOpenInAtlas,
  onOpenTimeline,
  initialSymptomId,
}) => {
  const [query, setQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<AnatomicalZoneId | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<AnatomicalSide | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<CircadianPeriodId | 'all'>('all');
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>(
    initialSymptomId ?? SYMPTOMS[0].id
  );
  const [selectedMmtMuscleId, setSelectedMmtMuscleId] = useState<string>(
    SYMPTOMS[0].mmtPlan[0].muscleId
  );

  useEffect(() => {
    if (initialSymptomId) {
      const found = SYMPTOMS.find((s) => s.id === initialSymptomId);
      if (found) {
        setSelectedSymptomId(found.id);
        setSelectedMmtMuscleId(found.mmtPlan[0]?.muscleId ?? MUSCLES[0].id);
        setZoneFilter('all');
        setTimeFilter('all');
        setQuery('');
      }
    }
  }, [initialSymptomId]);

  const detectedPeriodsFromQuery = useMemo(
    () => matchCircadianPeriodsByText(query),
    [query]
  );

  const activeClockHintSlot = useMemo(() => {
    if (timeFilter !== 'all') return CIRCADIAN_MAP[timeFilter];
    if (detectedPeriodsFromQuery.length > 0) {
      return CIRCADIAN_MAP[detectedPeriodsFromQuery[0]];
    }
    return null;
  }, [timeFilter, detectedPeriodsFromQuery]);

  const filteredSymptoms = useMemo(() => {
    const q = query.trim();
    const textPeriods = matchCircadianPeriodsByText(q);

    const base = SYMPTOMS.filter((sym) => {
      if (zoneFilter !== 'all' && sym.zone !== zoneFilter) return false;
      if (sideFilter !== 'all') {
        const symSide = getSymptomSide(sym, MUSCLES);
        if (symSide !== 'both' && symSide !== sideFilter) return false;
      }
      if (
        timeFilter !== 'all' &&
        !sym.timeProfile.circadianPeriods.includes(timeFilter)
      ) {
        return false;
      }
      return true;
    });

    if (!q) return base;

    return base
      .map((sym) => {
        const matchesDetectedTime =
          textPeriods.length > 0 &&
          textPeriods.some((pid) => sym.timeProfile.circadianPeriods.includes(pid));

        const muscleNames = sym.mmtPlan
          .map((p) => {
            const m = MUSCLES.find((item) => item.id === p.muscleId);
            return m ? `${m.name} ${m.latinName} ${p.rationale}` : '';
          })
          .join(' ');
        const organNames = sym.organIds
          .map((id) => ORGANS.find((o) => o.id === id)?.name ?? '')
          .join(' ');
        const causeText = sym.possibleCauses
          .map((c) => `${c.title} ${c.mechanism} ${c.category}`)
          .join(' ');
        const diagText = sym.diagnosticMethods
          .map((d) => `${d.method} ${d.howToPerform}`)
          .join(' ');
        const timeText = `${sym.timeProfile.peakWindow} ${sym.timeProfile.triggerContext} ${sym.timeProfile.organClockInterpretation}`;

        const haystack = `${sym.keywords.join(' ')} ${sym.clinicalSummary} ${timeText} ${causeText} ${diagText} ${muscleNames} ${organNames}`;
        const score =
          fuzzyMatchScore(q, haystack, sym.title) + (matchesDetectedTime ? 120 : 0);

        return { sym, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.sym);
  }, [query, zoneFilter, sideFilter, timeFilter]);

  const activeSymptom = useMemo(() => {
    return (
      filteredSymptoms.find((s) => s.id === selectedSymptomId) ??
      filteredSymptoms[0] ??
      null
    );
  }, [filteredSymptoms, selectedSymptomId]);

  useEffect(() => {
    if (activeSymptom) {
      const stillInPlan = activeSymptom.mmtPlan.some(
        (p) => p.muscleId === selectedMmtMuscleId
      );
      if (!stillInPlan && activeSymptom.mmtPlan[0]) {
        setSelectedMmtMuscleId(activeSymptom.mmtPlan[0].muscleId);
      }
    }
  }, [activeSymptom, selectedMmtMuscleId]);

  const activeMmtMuscle = useMemo(() => {
    return MUSCLES.find((m) => m.id === selectedMmtMuscleId) ?? MUSCLES[0];
  }, [selectedMmtMuscleId]);

  const activeMmtPlanItem = useMemo(() => {
    return activeSymptom?.mmtPlan.find((p) => p.muscleId === activeMmtMuscle.id);
  }, [activeSymptom, activeMmtMuscle.id]);

  const activeTriadCorrections = useMemo(() => {
    if (!activeSymptom) return null;
    return getTriadCorrections(
      { type: 'muscle', id: activeMmtMuscle.id },
      {
        muscles: [activeMmtMuscle],
        organs: ORGANS.filter((o) => activeSymptom.organIds.includes(o.id)),
        meridians: MERIDIANS.filter((m) => activeSymptom.meridianIds.includes(m.id)),
      }
    );
  }, [activeSymptom, activeMmtMuscle]);

  const getCauseAccent = (category: SymptomCause['category']) => {
    switch (category) {
      case 'Биомеханическая':
        return 'text-blue-700';
      case 'Висцеральная':
        return 'text-emerald-700';
      case 'Кранио-диафрагмальная':
        return 'text-amber-700';
      case 'Меридианно-вегетативная':
        return 'text-violet-700';
    }
  };

  const getExpectedStateColor = (state: string) => {
    if (state.startsWith('Гипотония')) return 'text-rose-700';
    if (state.startsWith('Гипертонус')) return 'text-amber-700';
    return 'text-blue-700';
  };

  return (
    <div className="space-y-6">
      {/* Search & Clinical + Circadian Filter Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Справочник клинических жалоб, поиск по симптоматике и времени суток
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Введите жалобу, симптом или время появления дискомфорта (например: «с 6 до 8 утра»,
              «в 2 ночи», «боль в пятке», «ВНЧС») — система свяжет время суток с биологическими
              часами органов, покажет причины, пробы ТЛ и целевые мышцы для ММТ.
            </p>
          </div>
          <div className="text-xs text-slate-500 tabular-nums shrink-0">
            Найдено жалоб: <strong className="text-slate-900">{filteredSymptoms.length}</strong> из{' '}
            {SYMPTOMS.length}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по жалобе или времени суток (например: с 6 до 8 утра, 01:00, натощак, боль в пояснице, ВНЧС, пятка, заложенность носа)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="Очистить поиск"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Symptom Shortcuts + Region Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 mr-1">Частые жалобы и часы:</span>
            {QUICK_SYMPTOMS.map((item) => {
              const isSelected = query.toLowerCase() === item.query;
              return (
                <button
                  key={item.query}
                  type="button"
                  onClick={() => setQuery(isSelected ? '' : item.query)}
                  className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* 24-Hour Circadian Time-of-Day Filter Strip */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Временная шкала жалоб — когда возникает дискомфорт:</span>
              </span>
              {timeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setTimeFilter('all')}
                  className="text-blue-700 hover:underline font-medium cursor-pointer"
                >
                  Сбросить фильтр по времени
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  timeFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Все часы (24ч)
              </button>
              {CIRCADIAN_SLOTS.map((slot) => {
                const isSelected = timeFilter === slot.id;
                const count = SYMPTOMS.filter((s) =>
                  s.timeProfile.circadianPeriods.includes(slot.id)
                ).length;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setTimeFilter(isSelected ? 'all' : slot.id)}
                    className={`px-2.5 py-1.5 text-[11px] font-mono tabular-nums rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/60'
                    }`}
                    title={`${slot.hoursLabel}: ${slot.organTitle}`}
                  >
                    {slot.shortLabel} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Circadian Organ Clock Interpretation Banner */}
          {activeClockHintSlot && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-blue-950 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>
                    Время {activeClockHintSlot.practicalWindow} →{' '}
                    <span className="text-blue-700">{activeClockHintSlot.organTitle}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {activeClockHintSlot.organIds[0] && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenInAtlas({ type: 'organ', id: activeClockHintSlot.organIds[0] })
                      }
                      className="text-emerald-700 hover:underline font-medium cursor-pointer"
                    >
                      Орган в Атласе →
                    </button>
                  )}
                  {onOpenTimeline && activeSymptom && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTimeline(activeSymptom.id, activeClockHintSlot.id)
                      }
                      className="text-blue-700 hover:underline font-medium cursor-pointer"
                    >
                      Открыть на шкале 24ч →
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {activeClockHintSlot.clinicalMeaning}
              </p>
              <p className="text-[11px] text-slate-600">
                <strong className="text-slate-800">Фокус ММТ:</strong>{' '}
                {activeClockHintSlot.mmtFocus}
              </p>
            </div>
          )}

          {/* Classifier: Anterior/Posterior Surface + Axial/Appendicular Regions */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Поверхность тела:</span>
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'all', label: `Все (${SYMPTOMS.length})` },
                    { id: 'anterior', label: ANATOMICAL_SIDE_META.anterior.shortLabel },
                    { id: 'posterior', label: ANATOMICAL_SIDE_META.posterior.shortLabel },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSideFilter(opt.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      sideFilter === opt.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setZoneFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  zoneFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Все регионы ({SYMPTOMS.length})
              </button>
              {ANATOMICAL_DIVISIONS.map((div) => (
                <div
                  key={div.id}
                  className="flex flex-wrap items-center gap-1 px-2 py-1 bg-slate-100/80 rounded-lg"
                >
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">
                    {div.shortTitle}:
                  </span>
                  {ANATOMICAL_ZONES.filter((z) => z.division === div.id).map((z) => {
                    const count = SYMPTOMS.filter((s) => s.zone === z.id).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setZoneFilter(z.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          zoneFilter === z.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {z.shortName} ({count})
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Split Workspace */}
      {filteredSymptoms.length === 0 || !activeSymptom ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
          <p className="text-sm font-medium text-slate-800">
            По запросу «{query}» клинических совпадений не найдено.
          </p>
          <p className="text-xs text-slate-500">
            Попробуйте указать локализацию или время появления жалобы (например: «с 6 до 8», «утром»,
            «боль в пояснице», «колено», «печень») или сбросьте фильтры.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setZoneFilter('all');
              setTimeFilter('all');
            }}
            className="mt-2 px-4 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer"
          >
            Показать все жалобы ({SYMPTOMS.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Matching Symptoms List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Клинические жалобы ({filteredSymptoms.length})</span>
              <span>Время пика · ММТ</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[860px] overflow-y-auto">
              {filteredSymptoms.map((sym) => {
                const isActive = sym.id === activeSymptom.id;
                const zoneMeta = ANATOMICAL_ZONES.find((z) => z.id === sym.zone);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => {
                      setSelectedSymptomId(sym.id);
                      if (sym.mmtPlan[0]) {
                        setSelectedMmtMuscleId(sym.mmtPlan[0].muscleId);
                      }
                    }}
                    className={`w-full px-4 py-3.5 text-left transition-colors cursor-pointer ${
                      isActive ? 'bg-blue-50/75' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                      <span className="font-medium text-blue-700">{zoneMeta?.shortName}</span>
                      <span className="font-mono tabular-nums text-slate-500 truncate max-w-[175px]">
                        {sym.timeProfile.peakWindow}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-semibold leading-snug ${
                        isActive ? 'text-blue-900' : 'text-slate-900'
                      }`}
                    >
                      {sym.title}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {sym.possibleCauses.length} прич. · {sym.mmtPlan.length} ММТ ·{' '}
                      {sym.keywords.slice(0, 3).join(', ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Full Differential Breakdown + Time Profile + Interactive MMT Schematics */}
          <div className="lg:col-span-8 space-y-5">
            {/* Summary Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-medium text-blue-700 inline-flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5" />
                      Дифференциальный разбор жалобы
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ANATOMICAL_ZONES.find((z) => z.id === activeSymptom.zone)?.name}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {activeSymptom.title}
                  </h2>
                </div>

                {onOpenTimeline && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenTimeline(
                        activeSymptom.id,
                        activeSymptom.timeProfile.circadianPeriods[0]
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Шкала времени (24ч и этапы) →</span>
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {activeSymptom.clinicalSummary}
              </p>

              {/* Time-of-Day Circadian Box */}
              <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Временная шкала дискомфорта: </span>
                    <span className="font-mono text-amber-900">
                      {activeSymptom.timeProfile.peakWindow}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {activeSymptom.timeProfile.circadianPeriods.map((pid) => {
                      const slot = CIRCADIAN_MAP[pid];
                      if (!slot) return null;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => setTimeFilter(pid)}
                          className="px-2 py-0.5 text-[11px] font-mono bg-white border border-amber-300 text-amber-900 rounded hover:bg-amber-100 cursor-pointer"
                          title={`Отфильтровать жалобы по окну ${slot.hoursLabel}`}
                        >
                          {slot.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-slate-700">
                  <strong className="text-slate-900">Когда проявляется:</strong>{' '}
                  {activeSymptom.timeProfile.triggerContext}.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Значение по часам органов:</strong>{' '}
                  {activeSymptom.timeProfile.organClockInterpretation}
                </p>
              </div>

              {/* 1. Possible Causes */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">
                  1. Возможные причины дисфункции
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeSymptom.possibleCauses.map((cause, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-1 text-xs"
                    >
                      <div className={`font-semibold ${getCauseAccent(cause.category)}`}>
                        {cause.category}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {cause.title}
                      </h4>
                      <p className="text-slate-600 leading-relaxed">{cause.mechanism}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Diagnostic Methods */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">
                  2. Способы диагностики (ТЛ, провокации и клинические пробы)
                </h3>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                  {activeSymptom.diagnosticMethods.map((diag, idx) => (
                    <div key={idx} className="p-3.5 space-y-1">
                      <div className="font-semibold text-slate-900 text-sm">
                        {idx + 1}. {diag.method}
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Проведение:</strong> {diag.howToPerform}
                      </p>
                      <p className="text-blue-800 font-medium leading-relaxed">
                        Положительный критерий: {diag.positiveSign}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. MMT Testing Plan & Live Diagram */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    3. Целевые мышцы для ММТ и схема тестирования
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Выберите мышцу из плана, чтобы увидеть позу пациента, позицию врача, вектор
                    давления и критерии оценки
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInAtlas({ type: 'muscle', id: activeMmtMuscle.id })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Открыть в Атласе: {activeMmtMuscle.name.split('(')[0].trim()}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Muscle selector grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeSymptom.mmtPlan.map((planItem) => {
                  const m = MUSCLES.find((item) => item.id === planItem.muscleId);
                  if (!m) return null;
                  const isSelected = m.id === activeMmtMuscle.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMmtMuscleId(m.id)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-300'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] mb-0.5">
                        <span className={`font-semibold ${getExpectedStateColor(planItem.expectedState)}`}>
                          {planItem.expectedState}
                        </span>
                        <span className="font-mono text-slate-400">
                          {m.spinalSegment.split('·')[0].trim()}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{m.name}</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {planItem.rationale}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Live MMT Diagram & Test Breakdown */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start pt-2">
                <div className="xl:col-span-7">
                  <MMTSchematicDiagram muscle={activeMmtMuscle} />
                </div>

                <div className="xl:col-span-5 border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs bg-white">
                  <div className="p-3 bg-slate-50/70">
                    <div className="font-bold text-slate-900 text-sm">
                      {activeMmtMuscle.name}
                    </div>
                    <div className="text-[11px] italic text-slate-500">
                      {activeMmtMuscle.latinName}
                    </div>
                    {activeMmtPlanItem && (
                      <div className="text-[11px] font-medium text-blue-800 mt-1">
                        Роль в жалобе: {activeMmtPlanItem.expectedState}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="font-semibold text-slate-800 block mb-0.5">
                      Положение пациента
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {activeMmtMuscle.mmt.patientPosition}
                    </p>
                  </div>
                  <div className="p-3">
                    <span className="font-semibold text-slate-800 block mb-0.5">
                      Позиция врача и фиксация
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {activeMmtMuscle.mmt.practitionerPosition}{' '}
                      {activeMmtMuscle.mmt.stabilization}
                    </p>
                  </div>
                  <div className="p-3">
                    <span className="font-semibold text-slate-800 block mb-0.5">
                      Вектор давления
                    </span>
                    <p className="text-red-700 font-medium leading-relaxed">
                      {activeMmtMuscle.mmt.pressureVector}
                    </p>
                  </div>
                  <div className="p-3 space-y-2 bg-slate-50/50">
                    <div>
                      <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Нормотония:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {activeMmtMuscle.mmt.normotoniaSign}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-rose-700 inline-flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Гипотония:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {activeMmtMuscle.mmt.hypotoniaSign}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Linked Cross-References & Correction Strategy */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  4. Базовая последовательность коррекции
                </h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                  {activeSymptom.correctionStrategy.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              {activeTriadCorrections && (
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-900">
                    Дополнительная коррекция Триады: Эмоции · Энергия · Химия
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-rose-200/80 bg-rose-50/30 space-y-1">
                      <div className="font-semibold text-rose-700">Эмоциональная коррекция</div>
                      <p className="text-slate-700 leading-relaxed">
                        {activeTriadCorrections.emotional.correctionMethod}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-violet-200/80 bg-violet-50/30 space-y-1">
                      <div className="font-semibold text-violet-700">Энергетическое воздействие</div>
                      <p className="text-slate-700 leading-relaxed">
                        {activeTriadCorrections.energetic.correctionMethod}
                      </p>
                      <p className="text-[11px] text-violet-900 font-medium">
                        {activeTriadCorrections.energetic.keyPointsOrNutrients}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-200/80 bg-emerald-50/30 space-y-1">
                      <div className="font-semibold text-emerald-700">Химическое воздействие</div>
                      <p className="text-slate-700 leading-relaxed">
                        {activeTriadCorrections.chemical.correctionMethod}
                      </p>
                      <p className="text-[11px] text-emerald-900 font-medium">
                        {activeTriadCorrections.chemical.keyPointsOrNutrients}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Органы</div>
                  <div className="space-y-1">
                    {activeSymptom.organIds.map((oId) => {
                      const org = ORGANS.find((o) => o.id === oId);
                      if (!org) return null;
                      return (
                        <button
                          key={oId}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'organ', id: oId })}
                          className="block text-left text-emerald-700 hover:underline cursor-pointer"
                        >
                          {org.name} →
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-800 mb-1">Диафрагмы</div>
                  <div className="space-y-1">
                    {activeSymptom.diaphragmIds.map((dId) => {
                      const diaph = DIAPHRAGMS.find((d) => d.id === dId);
                      if (!diaph) return null;
                      return (
                        <button
                          key={dId}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'diaphragm', id: dId })}
                          className="block text-left text-amber-700 hover:underline cursor-pointer"
                        >
                          {diaph.name.split('(')[0].trim()} →
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-800 mb-1">Миофасц. цепи</div>
                  <div className="space-y-1">
                    {activeSymptom.chainIds.map((cId) => {
                      const ch = MYOFASCIAL_CHAINS.find((c) => c.id === cId);
                      if (!ch) return null;
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'chain', id: cId })}
                          className="block text-left text-violet-700 hover:underline cursor-pointer"
                        >
                          {ch.name.split('(')[0].trim()} →
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-800 mb-1">Меридианы</div>
                  <div className="space-y-1">
                    {activeSymptom.meridianIds.map((mId) => {
                      const mer = MERIDIANS.find((m) => m.id === mId);
                      if (!mer) return null;
                      return (
                        <button
                          key={mId}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'meridian', id: mId })}
                          className="block text-left text-blue-700 hover:underline cursor-pointer"
                        >
                          {mer.code} {mer.name} →
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
