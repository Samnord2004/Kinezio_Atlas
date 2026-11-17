import React, { useEffect, useMemo, useState } from 'react';
import { DIAGNOSTIC_TESTS, DIAPHRAGMS, MUSCLES, TRUST_MANIPULATIONS } from '../data';
import { DiagnosticTestCategory, SelectedEntity } from '../types/atlas';
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
  Camera,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface DiagnosticTestsViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onOpenTrustTab?: (trustId?: string) => void;
  initialTestId?: string | null;
}

const TEST_CATEGORIES: ReadonlyArray<{ id: DiagnosticTestCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все тесты и пробы' },
  { id: 'Ортопедические и сосудистые допуски', label: 'Сосудистые и ортопед. допуски' },
  { id: 'Кинезиологические рефлексы (Чапмен / Беннетт)', label: 'Рефлексы (Чапмен / Беннетт)' },
  { id: 'Нейродинамика и провокации ММТ', label: 'Нейродинамика и провокации' },
  { id: 'Краниосакральные и височные пробы', label: 'Височное простукивание' },
];

export const DiagnosticTestsView: React.FC<DiagnosticTestsViewProps> = ({
  onOpenInAtlas,
  onOpenTrustTab,
  initialTestId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<DiagnosticTestCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeTestId, setActiveTestId] = useState<string>(
    initialTestId && DIAGNOSTIC_TESTS.some((t) => t.id === initialTestId)
      ? initialTestId
      : DIAGNOSTIC_TESTS[0].id
  );
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialTestId && DIAGNOSTIC_TESTS.some((t) => t.id === initialTestId)) {
      setActiveTestId(initialTestId);
      setCategoryFilter('all');
    }
  }, [initialTestId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('tests').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredTests = useMemo(() => {
    return DIAGNOSTIC_TESTS.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${t.name} ${t.latinOrAlias} ${t.category} ${t.targetRegion} ${t.clinicalPurpose} ${t.physiologicalMechanism} ${t.positiveDeviations.join(' ')} ${t.commonErrors.join(' ')}`
      );
    });
  }, [categoryFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveTest = useMemo(
    () =>
      filteredTests.find((t) => t.id === activeTestId) ??
      filteredTests[0] ??
      DIAGNOSTIC_TESTS[0],
    [filteredTests, activeTestId]
  );

  const activeTest = useMemo(
    () => applyOverride('tests', rawActiveTest),
    [applyOverride, rawActiveTest]
  );

  const activeTestOverride = getOverride('tests', rawActiveTest.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Атлас</span>
            <span aria-hidden="true">·</span>
            <span>Клиническая верификация, безопасность трастов и рефлекторные пробы</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Справочник диагностических тестов, рефлексов и височного простукивания
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Полные протоколы всех проб справочника (де Клейна, Шарпа–Пурсера, Чапмена, Беннетта,
            Височное простукивание, Шпурлинга, Эдсона/Райта, Ласега, Жилле/Патрика, Оттавы,
            Томпсона, KI-27): механика, норма, отклонения и типичные ошибки проведения.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: Шарпа, Клейна, Чапмен, височное..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {TEST_CATEGORIES.map((c) => (
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
        {/* Left List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Пробы и рефлексы ({filteredTests.length})</span>
            <span>Категория</span>
          </div>

          {filteredTests.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Тесты по вашему запросу не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">
              {filteredTests.map((t) => {
                const isSelected = activeTest.id === t.id;
                const count = photoCounts[t.id] ?? 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTestId(t.id)}
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
                        {t.name}
                      </div>
                      {count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-blue-700 shrink-0">
                          <Camera className="w-3 h-3" />
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{t.category}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {t.targetRegion}
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
                <span className="font-medium text-blue-700">{activeTest.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeTest.targetRegion}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-balance">{activeTest.name}</h2>
              <p className="text-xs italic text-slate-500">{activeTest.latinOrAlias}</p>
            </div>
            <DirectoryEditButton
              section="tests"
              item={rawActiveTest as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activeTest.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activeTestOverride} />

          {/* Image + Purpose & Mechanism */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="flex-1 min-h-[210px] bg-white flex items-center justify-center p-3">
                <img
                  src={activeTest.imageSrc}
                  alt={activeTest.name}
                  referrerPolicy="no-referrer"
                  className="max-h-56 w-full object-contain rounded"
                />
              </div>
              <div className="px-3 py-2 bg-white border-t border-slate-200 text-[11px] text-slate-500">
                {activeTest.imageAttribution}
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">
                  Клиническая цель и назначение
                </div>
                <p className="text-slate-700 leading-relaxed">{activeTest.clinicalPurpose}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">
                  Анатомо-физиологический механизм
                </div>
                <p className="text-slate-700 leading-relaxed">{activeTest.physiologicalMechanism}</p>
              </div>
            </div>
          </div>

          {/* Preparation & Step-by-Step Execution */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <ClipboardList className="w-4 h-4 text-blue-700" />
              <span>Подготовка и детальный способ проведения</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Исходная укладка:</strong>{' '}
              {activeTest.preparationAndPosition}
            </p>
            <ol className="space-y-2 text-slate-700 leading-relaxed pt-1">
              {activeTest.executionSteps.map((step, idx) => (
                <li key={idx} className="p-2.5 bg-white border border-slate-200 rounded-md">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Results: Normal vs Positive Deviations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Нормальный результат (Отрицательная проба)</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{activeTest.normalResult}</p>
            </div>

            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Отклонения (Положительный тест)</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activeTest.positiveDeviations.map((dev, idx) => (
                  <li key={idx}>{dev}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Consequences & Common Errors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Типичные ошибки при проведении</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activeTest.commonErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="font-semibold text-slate-900">
                Последствия нарушений и противопоказания
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activeTest.consequencesIfMissedOrAbnormal.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
              <p className="text-rose-800 font-medium pt-1 border-t border-slate-200">
                Противопоказания к пробе: {activeTest.contraindications}
              </p>
            </div>
          </div>

          {/* Custom Photo & Vector Arrows Gallery */}
          <DirectoryPhotoGallery
            section="tests"
            itemId={activeTest.id}
            itemName={activeTest.name}
            defaultImageSrc={activeTest.imageSrc}
            defaultImageCaption={activeTest.clinicalPurpose}
            defaultImageAttribution={activeTest.imageAttribution}
          />

          {/* Cross-Links */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            {activeTest.relatedMuscleIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">Связанные мышцы:</span>
                {activeTest.relatedMuscleIds.map((mId) => {
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
            )}

            {activeTest.relatedDiaphragmIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">Диафрагмы:</span>
                {activeTest.relatedDiaphragmIds.map((dId) => {
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
            )}

            {onOpenTrustTab && activeTest.relatedTrustIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">Манипуляции допуска:</span>
                {activeTest.relatedTrustIds.map((tId) => {
                  const tr = TRUST_MANIPULATIONS.find((item) => item.id === tId);
                  if (!tr) return null;
                  return (
                    <button
                      key={tId}
                      type="button"
                      onClick={() => onOpenTrustTab(tId)}
                      className="text-orange-700 hover:underline font-medium cursor-pointer"
                    >
                      {tr.segmentLevel} →
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
