import React, { useEffect, useMemo, useState } from 'react';
import { CRANIOSACRAL_PROFILES, DIAPHRAGMS, MERIDIANS, MUSCLES } from '../data';
import { CraniosacralCategory, SelectedEntity } from '../types/atlas';
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
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Camera,
  CheckCircle2,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface CraniosacralDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onOpenTestsTab?: (testId?: string) => void;
  initialProfileId?: string | null;
}

const CRANIO_CATEGORIES: ReadonlyArray<{ id: CraniosacralCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все кранио-техники' },
  { id: 'Сфенобазилярный синхондроз (СБС)', label: 'СБС (основание черепа)' },
  { id: 'Мембраны, швы и ВНЧС', label: 'Мембраны, швы, ВНЧС' },
  { id: 'Краниосакральная ось и дренаж', label: 'Ось Затылок — Крестец' },
  {
    id: 'Нейрокраниальные техники (Височное простукивание / CV-4)',
    label: 'CV-4 и Височное простукивание',
  },
];

export const CraniosacralDirectoryView: React.FC<CraniosacralDirectoryViewProps> = ({
  onOpenInAtlas,
  onOpenTestsTab,
  initialProfileId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CraniosacralCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(
    initialProfileId && CRANIOSACRAL_PROFILES.some((c) => c.id === initialProfileId)
      ? initialProfileId
      : CRANIOSACRAL_PROFILES[0].id
  );
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialProfileId && CRANIOSACRAL_PROFILES.some((c) => c.id === initialProfileId)) {
      setActiveId(initialProfileId);
      setCategoryFilter('all');
    }
  }, [initialProfileId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('craniosacral').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredProfiles = useMemo(() => {
    return CRANIOSACRAL_PROFILES.filter((cs) => {
      if (categoryFilter !== 'all' && cs.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${cs.name} ${cs.latinOrSubtitle} ${cs.category} ${cs.anatomicalFocus} ${cs.physiologicalMechanism} ${cs.dysfunctionSigns.join(' ')}`
      );
    });
  }, [categoryFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveProfile = useMemo(
    () =>
      filteredProfiles.find((c) => c.id === activeId) ??
      filteredProfiles[0] ??
      CRANIOSACRAL_PROFILES[0],
    [filteredProfiles, activeId]
  );

  const activeProfile = useMemo(
    () => applyOverride('craniosacral', rawActiveProfile),
    [applyOverride, rawActiveProfile]
  );

  const activeProfileOverride = getOverride('craniosacral', rawActiveProfile.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Справочник коррекции</span>
            <span aria-hidden="true">·</span>
            <span>Первичный дыхательный механизм, ТМО, швы черепа и вегетативная ось</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Справочник краниосакральной коррекции
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Техники работы со сфенобазилярным синхондрозом (СБС), яремным отверстием (вагус),
            компрессией IV желудочка (CV-4), височными костями, дуральной осью S2 и височным
            простукиванием с верификацией в ММТ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="СБС, CV-4, вагус, крестец, височное..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          {onOpenTestsTab && (
            <button
              type="button"
              onClick={() => onOpenTestsTab('test-temporal-tap')}
              className="px-3 py-2 text-xs font-semibold text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Проба «Височное простукивание» →
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {CRANIO_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              categoryFilter === c.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Кранио-модули ({filteredProfiles.length})</span>
            <span>Уровень</span>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Техники по запросу не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">
              {filteredProfiles.map((cs) => {
                const isSelected = activeProfile.id === cs.id;
                const count = photoCounts[cs.id] ?? 0;
                return (
                  <button
                    key={cs.id}
                    type="button"
                    onClick={() => setActiveId(cs.id)}
                    className={`w-full p-4 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {cs.name}
                      </div>
                      {count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-blue-700 shrink-0">
                          <Camera className="w-3 h-3" />
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{cs.category}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {cs.latinOrSubtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-violet-700">{activeProfile.category}</span>
                <span aria-hidden="true">·</span>
                <span>Краниосакральная система</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-balance">{activeProfile.name}</h2>
              <p className="text-xs italic text-slate-500">{activeProfile.latinOrSubtitle}</p>
            </div>
            <DirectoryEditButton
              section="craniosacral"
              item={rawActiveProfile as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activeProfile.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activeProfileOverride} />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="flex-1 min-h-[210px] bg-white flex items-center justify-center p-3">
                <img
                  src={activeProfile.imageSrc}
                  alt={activeProfile.name}
                  referrerPolicy="no-referrer"
                  className="max-h-56 w-full object-contain rounded"
                />
              </div>
              <div className="px-3 py-2 bg-white border-t border-slate-200 text-[11px] text-slate-500">
                {activeProfile.imageAttribution}
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">Анатомический фокус</div>
                <p className="text-slate-700 leading-relaxed">{activeProfile.anatomicalFocus}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">
                  Биомеханика и физиологический механизм
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {activeProfile.physiologicalMechanism}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Assessment + Signs/Consequences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-950">
                <Brain className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Диагностика КСР и провокация в ММТ</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 leading-relaxed">
                {activeProfile.diagnosticAssessment.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Признаки дисфункции и последствия</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activeProfile.dysfunctionSigns.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-rose-200/80 text-slate-700 space-y-0.5">
                <strong className="text-slate-900 block">Клинические последствия:</strong>
                {activeProfile.clinicalConsequences.map((c, idx) => (
                  <div key={idx}>• {c}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Correction Steps */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Протокол краниосакральной коррекции</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {activeProfile.correctionSteps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-emerald-800">{st.modality}</span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      {st.durationOrDose}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{st.title}</div>
                  <p className="text-slate-700 leading-relaxed">{st.technique}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Errors */}
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Техника безопасности и частые ошибки</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
              {activeProfile.safetyAndErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>

          <DirectoryPhotoGallery
            section="craniosacral"
            itemId={activeProfile.id}
            itemName={activeProfile.name}
            defaultImageSrc={activeProfile.imageSrc}
            defaultImageCaption={activeProfile.latinOrSubtitle}
            defaultImageAttribution={activeProfile.imageAttribution}
          />

          {/* Cross-Links */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Мышцы-маркеры:</span>
              {activeProfile.relatedMuscleIds.map((mId) => {
                const m = MUSCLES.find((item) => item.id === mId);
                if (!m) return null;
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'muscle', id: mId })}
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium cursor-pointer"
                  >
                    <span>{m.name}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Диафрагмы:</span>
              {activeProfile.relatedDiaphragmIds.map((dId) => {
                const d = DIAPHRAGMS.find((item) => item.id === dId);
                if (!d) return null;
                return (
                  <button
                    key={dId}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'diaphragm', id: dId })}
                    className="text-amber-700 hover:underline font-medium cursor-pointer"
                  >
                    {d.name.split('(')[0].trim()} →
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Меридианы:</span>
              {activeProfile.relatedMeridianIds.map((merId) => {
                const mer = MERIDIANS.find((item) => item.id === merId);
                if (!mer) return null;
                return (
                  <button
                    key={merId}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'meridian', id: merId })}
                    className="text-violet-700 hover:underline font-medium cursor-pointer"
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
  );
};
