import React, { useEffect, useMemo, useState } from 'react';
import { DIAPHRAGMS, MUSCLES, TRUST_MANIPULATIONS } from '../data';
import { SelectedEntity, TrustRegionCategory } from '../types/atlas';
import { fuzzyMatches } from '../utils/fuzzySearch';
import {
  DIRECTORY_MEDIA_UPDATED_EVENT,
  loadDirectoryPhotoCountsBySection,
} from '../utils/directoryMediaStore';
import { DirectoryPhotoGallery } from './DirectoryPhotoGallery';
import {
  DirectoryCustomNoteBanner,
  DirectoryEditButton,
} from './DirectoryEntryEditor';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';
import {
  AlertOctagon,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Compass,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface TrustManipulationsViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  initialTrustId?: string | null;
}

const TRUST_REGIONS: ReadonlyArray<{ id: TrustRegionCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все отделы' },
  { id: 'Шейный отдел (C0–C7)', label: 'Шейный (C0–C7)' },
  { id: 'Грудной отдел и рёбра', label: 'Грудной отдел' },
  { id: 'Поясничный отдел (L1–L5)', label: 'Поясница (L1–L5)' },
  { id: 'Таз и КПС', label: 'Таз и КПС' },
  { id: 'Периферические суставы', label: 'Суставы / стопа' },
];

export const TrustManipulationsView: React.FC<TrustManipulationsViewProps> = ({
  onOpenInAtlas,
  initialTrustId,
}) => {
  const [regionFilter, setRegionFilter] = useState<TrustRegionCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeTrustId, setActiveTrustId] = useState<string>(
    initialTrustId ?? TRUST_MANIPULATIONS[0].id
  );
  const [checkedPreScreens, setCheckedPreScreens] = useState<Record<string, boolean>>({});
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialTrustId && TRUST_MANIPULATIONS.some((t) => t.id === initialTrustId)) {
      setRegionFilter('all');
      setQuery('');
      setActiveTrustId(initialTrustId);
    }
  }, [initialTrustId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('trust').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredTrusts = useMemo(() => {
    return TRUST_MANIPULATIONS.filter((t) => {
      if (regionFilter !== 'all' && t.region !== regionFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${t.name} ${t.segmentLevel} ${t.region} ${t.biomechanicalIndication} ${t.thrustVectorAndBarrier}`
      );
    });
  }, [regionFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveTrust = useMemo(
    () =>
      filteredTrusts.find((t) => t.id === activeTrustId) ??
      filteredTrusts[0] ??
      TRUST_MANIPULATIONS[0],
    [filteredTrusts, activeTrustId]
  );

  const activeTrust = useMemo(
    () => applyOverride('trust', rawActiveTrust),
    [applyOverride, rawActiveTrust]
  );

  const activeTrustOverride = getOverride('trust', rawActiveTrust.id);

  const allPreScreensChecked = activeTrust.preScreeningTests.every(
    (_, idx) => checkedPreScreens[`${activeTrust.id}-${idx}`]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Справочник коррекции</span>
            <span aria-hidden="true">·</span>
            <span>Мануальная медицина и HVLA-техники под контролем ММТ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Справочник мануальных (трастовых) манипуляций
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Высокоскоростные низкоамплитудные манипуляции (HVLA) для разблокировки суставных
            сегментов: обязательный скрининг «красных флагов», провокация барьера в ММТ, точный
            вектор импульса и критерии ретеста.
          </p>
        </div>

        <div className="relative min-w-[270px] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Атлант, C0-C1, грудной, КПС, поясница..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Region Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {TRUST_REGIONS.map((reg) => {
          const count =
            reg.id === 'all'
              ? TRUST_MANIPULATIONS.length
              : TRUST_MANIPULATIONS.filter((t) => t.region === reg.id).length;
          return (
            <button
              key={reg.id}
              type="button"
              onClick={() => setRegionFilter(reg.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                regionFilter === reg.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {reg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Манипуляции ({filteredTrusts.length})</span>
            <span>Сегмент</span>
          </div>

          {filteredTrusts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              По данному запросу манипуляции не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {filteredTrusts.map((t) => {
                const isSelected = activeTrust.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTrustId(t.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3.5 ${
                      isSelected ? 'bg-blue-50/75' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={t.imageSrc}
                      alt={t.name}
                      className="w-14 h-14 rounded-lg object-contain border border-slate-200 bg-slate-50 shrink-0 p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-blue-700 mb-0.5">
                        <span className="truncate">{t.region}</span>
                        {(photoCounts[t.id] ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 shrink-0">
                            <Camera className="w-3 h-3 text-blue-700" />
                            {photoCounts[t.id]}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {t.segmentLevel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-700">{activeTrust.region}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{activeTrust.segmentLevel}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{activeTrust.name}</h2>
            </div>
            <DirectoryEditButton
              section="trust"
              item={rawActiveTrust as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activeTrust.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activeTrustOverride} />

          {/* Image + Biomechanical Indication */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-5 flex flex-col">
              <DirectoryPhotoGallery
                section="trust"
                itemId={activeTrust.id}
                itemName={activeTrust.name}
                defaultImageSrc={activeTrust.imageSrc}
                defaultImageCaption={activeTrust.thrustVectorAndBarrier}
                defaultImageAttribution={activeTrust.imageAttribution}
                defaultSlideLabel="Анатомия"
                photoTitlePlaceholder="Например: Укладка пациента и захват"
                photoCaptionPlaceholder="Точка контакта, фиксация и вектор HVLA-импульса..."
                vectorPresets={['Вектор траста', 'Контакт врача', 'Стабилизация', 'Выход на барьер']}
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <div className="font-semibold text-slate-900">Биомеханические показания</div>
                <p className="text-slate-700 leading-relaxed">
                  {activeTrust.biomechanicalIndication}
                </p>
              </div>

              <div className="p-4 bg-rose-50/75 border border-rose-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                  <AlertOctagon className="w-4 h-4 text-rose-700" />
                  <span>Красные флаги и абсолютные противопоказания</span>
                </div>
                <ul className="space-y-1 text-rose-950">
                  {activeTrust.redFlagsAndContraindications.map((flag, i) => (
                    <li key={i} className="leading-relaxed">
                      • {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Pre-Screening Safety Checklist */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-amber-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  Обязательные тесты допуска перед трастом
                </h3>
              </div>
              <span
                className={`text-xs font-semibold ${
                  allPreScreensChecked ? 'text-emerald-700' : 'text-amber-800'
                }`}
              >
                {allPreScreensChecked ? 'Допуск подтверждён' : 'Отметьте пробы'}
              </span>
            </div>
            <div className="p-4 space-y-2 text-xs">
              {activeTrust.preScreeningTests.map((test, idx) => {
                const key = `${activeTrust.id}-${idx}`;
                const checked = Boolean(checkedPreScreens[key]);
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setCheckedPreScreens((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="leading-relaxed">{test}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Technique Execution: Position, Contact, Vector */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-50/70 border-b border-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Биомеханика укладки и вектор импульса (HVLA)
              </h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs sm:text-[13px]">
              <div className="p-4 space-y-1">
                <div className="font-semibold text-slate-900">1. Укладка пациента</div>
                <p className="text-slate-700 leading-relaxed">{activeTrust.patientPosition}</p>
              </div>
              <div className="p-4 space-y-1">
                <div className="font-semibold text-slate-900">2. Точка контакта и стабилизация врача</div>
                <p className="text-slate-700 leading-relaxed">{activeTrust.practitionerContacts}</p>
              </div>
              <div className="p-4 space-y-1">
                <div className="font-semibold text-slate-900">3. Выход на барьер и вектор траста</div>
                <p className="text-blue-950 leading-relaxed font-medium">
                  {activeTrust.thrustVectorAndBarrier}
                </p>
              </div>
              <div className="p-4 bg-emerald-50/60 flex items-start gap-2 text-xs text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Контрольный ретест ММТ: </span>
                  {activeTrust.mmtRetestCriteria}
                </div>
              </div>
            </div>
          </section>

          {/* Atlas Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Мышцы-индикаторы сегмента</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {activeTrust.relatedMuscleIds.map((id) => {
                  const m = MUSCLES.find((item) => item.id === id);
                  if (!m) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'muscle', id })}
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline cursor-pointer"
                    >
                      <span>{m.name.split('(')[0].trim()}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-800 mb-1">Связанные диафрагмы</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {activeTrust.relatedDiaphragmIds.map((id) => {
                  const d = DIAPHRAGMS.find((item) => item.id === id);
                  if (!d) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'diaphragm', id })}
                      className="inline-flex items-center gap-1 text-amber-800 hover:underline cursor-pointer"
                    >
                      <span>{d.name.split('(')[0].trim()}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
