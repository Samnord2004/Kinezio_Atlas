import React, { useMemo, useState } from 'react';
import {
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_ZONES,
  MUSCLES,
  getMuscleSide,
} from '../data';
import {
  AnatomicalDivision,
  AnatomicalSide,
  AnatomicalZoneId,
  SelectedEntity,
} from '../types/atlas';
import { ArrowUpRight, Layers, X } from 'lucide-react';

interface AnatomicalZoneClassifierPanelProps {
  onSelectFilter?: (zoneId: AnatomicalZoneId, side?: AnatomicalSide) => void;
  onSelectEntity?: (entity: SelectedEntity) => void;
  onClose?: () => void;
  activeZoneId?: AnatomicalZoneId | 'all';
  activeSide?: AnatomicalSide | 'all';
  isModal?: boolean;
}

export const AnatomicalZoneClassifierPanel: React.FC<
  AnatomicalZoneClassifierPanelProps
> = ({
  onSelectFilter,
  onSelectEntity,
  onClose,
  activeZoneId = 'all',
  activeSide = 'all',
  isModal = false,
}) => {
  const [divisionFilter, setDivisionFilter] = useState<AnatomicalDivision | 'all'>('all');

  const divisionsToShow = useMemo(() => {
    if (divisionFilter === 'all') return ANATOMICAL_DIVISIONS;
    return ANATOMICAL_DIVISIONS.filter((d) => d.id === divisionFilter);
  }, [divisionFilter]);

  const totalAnterior = useMemo(
    () => MUSCLES.filter((m) => getMuscleSide(m) === 'anterior').length,
    []
  );
  const totalPosterior = useMemo(
    () => MUSCLES.filter((m) => getMuscleSide(m) === 'posterior').length,
    []
  );

  const body = (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Классификатор Terminologia Anatomica и прикладной кинезиологии</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            Анатомические зоны: Передняя (вентральная) и Задняя (дорсальная) поверхности
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Всего {MUSCLES.length} мышц ММТ: {totalAnterior} на передней поверхности и{' '}
            {totalPosterior} на задней поверхности. Нажмите на сторону зоны или конкретную мышцу
            для фильтрации.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setDivisionFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer ${
                divisionFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все отделы (6)
            </button>
            {ANATOMICAL_DIVISIONS.map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => setDivisionFilter(div.id)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap cursor-pointer ${
                  divisionFilter === div.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {div.shortTitle}
              </button>
            ))}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
              aria-label="Закрыть классификатор"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {divisionsToShow.map((division) => {
          const zones = ANATOMICAL_ZONES.filter((z) => z.division === division.id);
          return (
            <div key={division.id} className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 px-1">
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    {division.code}: {division.title}
                  </span>
                  <span className="text-[11px] italic text-slate-500 ml-2">
                    {division.taLatin}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{division.description}</span>
              </div>

              <div className="space-y-3">
                {zones.map((zone) => {
                  const anteriorMuscles = MUSCLES.filter(
                    (m) => m.zone === zone.id && getMuscleSide(m) === 'anterior'
                  );
                  const posteriorMuscles = MUSCLES.filter(
                    (m) => m.zone === zone.id && getMuscleSide(m) === 'posterior'
                  );
                  const isZoneSelected = activeZoneId === zone.id;

                  return (
                    <div
                      key={zone.id}
                      className={`border rounded-xl overflow-hidden ${
                        isZoneSelected
                          ? 'border-blue-400 bg-blue-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-blue-700">
                            {zone.classifierCode}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{zone.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            · {zone.segments}
                          </span>
                        </div>
                        {onSelectFilter && (
                          <button
                            type="button"
                            onClick={() => onSelectFilter(zone.id)}
                            className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            Фильтровать всю зону ({anteriorMuscles.length + posteriorMuscles.length}) →
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        {/* Передняя поверхность */}
                        <div
                          className={`p-4 space-y-2.5 ${
                            isZoneSelected && activeSide === 'anterior' ? 'bg-sky-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[11px] font-bold text-sky-800">
                                Передняя поверхность (вентральная) · {anteriorMuscles.length} мышц
                              </div>
                              <div className="text-xs font-semibold text-slate-900 mt-0.5">
                                {zone.anteriorAspect.title}
                              </div>
                              <div className="text-[11px] italic text-slate-500">
                                {zone.anteriorAspect.taLatin}
                              </div>
                            </div>
                            {onSelectFilter && (
                              <button
                                type="button"
                                onClick={() => onSelectFilter(zone.id, 'anterior')}
                                className="px-2 py-1 text-[11px] font-semibold text-sky-800 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Передние →
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <strong className="text-slate-800">Ориентиры:</strong>{' '}
                            {zone.anteriorAspect.landmarks}
                          </p>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <strong className="text-slate-800">Фокус ММТ:</strong>{' '}
                            {zone.anteriorAspect.clinicalFocus}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {anteriorMuscles.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() =>
                                  onSelectEntity
                                    ? onSelectEntity({ type: 'muscle', id: m.id })
                                    : onSelectFilter?.(zone.id, 'anterior')
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:border-sky-400 hover:text-sky-900 rounded-md cursor-pointer"
                              >
                                <span>{m.name.split('(')[0].trim()}</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Задняя поверхность */}
                        <div
                          className={`p-4 space-y-2.5 ${
                            isZoneSelected && activeSide === 'posterior' ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[11px] font-bold text-amber-800">
                                Задняя поверхность (дорсальная) · {posteriorMuscles.length} мышц
                              </div>
                              <div className="text-xs font-semibold text-slate-900 mt-0.5">
                                {zone.posteriorAspect.title}
                              </div>
                              <div className="text-[11px] italic text-slate-500">
                                {zone.posteriorAspect.taLatin}
                              </div>
                            </div>
                            {onSelectFilter && (
                              <button
                                type="button"
                                onClick={() => onSelectFilter(zone.id, 'posterior')}
                                className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Задние →
                              </button>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <strong className="text-slate-800">Ориентиры:</strong>{' '}
                            {zone.posteriorAspect.landmarks}
                          </p>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <strong className="text-slate-800">Фокус ММТ:</strong>{' '}
                            {zone.posteriorAspect.clinicalFocus}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {posteriorMuscles.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() =>
                                  onSelectEntity
                                    ? onSelectEntity({ type: 'muscle', id: m.id })
                                    : onSelectFilter?.(zone.id, 'posterior')
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:border-amber-400 hover:text-amber-900 rounded-md cursor-pointer"
                              >
                                <span>{m.name.split('(')[0].trim()}</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/45 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 my-6"
          onClick={(e) => e.stopPropagation()}
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">{body}</div>
  );
};
