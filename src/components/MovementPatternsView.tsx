import React, { useEffect, useMemo, useState } from 'react';
import { MOVEMENT_PATTERNS, MUSCLES, MYOFASCIAL_CHAINS } from '../data';
import { MovementPatternCategory, SelectedEntity } from '../types/atlas';
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
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Repeat,
  Search,
} from 'lucide-react';

interface MovementPatternsViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  initialPatternId?: string | null;
}

const PATTERN_CATEGORIES: ReadonlyArray<{ id: MovementPatternCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все паттерны' },
  { id: 'Локомоция и глобальная интеграция', label: 'Локомоция, ползание, переворот' },
  { id: 'Плечевой пояс и шея', label: 'Плечо и шея' },
  { id: 'Таз и нижняя конечность', label: 'Таз, бедро и стопа' },
  { id: 'Дыхательный паттерн', label: 'Дыхание и диафрагмы' },
];

export const MovementPatternsView: React.FC<MovementPatternsViewProps> = ({
  onOpenInAtlas,
  initialPatternId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<MovementPatternCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activePatternId, setActivePatternId] = useState<string>(
    initialPatternId && MOVEMENT_PATTERNS.some((p) => p.id === initialPatternId)
      ? initialPatternId
      : MOVEMENT_PATTERNS[0].id
  );
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialPatternId && MOVEMENT_PATTERNS.some((p) => p.id === initialPatternId)) {
      setActivePatternId(initialPatternId);
      setCategoryFilter('all');
    }
  }, [initialPatternId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('patterns').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredPatterns = useMemo(() => {
    return MOVEMENT_PATTERNS.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${p.name} ${p.subtitle} ${p.category} ${p.physiologicalDescription} ${p.dysfunctionSigns.join(' ')} ${p.biomechanicalConsequences.join(' ')}`
      );
    });
  }, [categoryFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActivePattern = useMemo(
    () =>
      filteredPatterns.find((p) => p.id === activePatternId) ??
      filteredPatterns[0] ??
      MOVEMENT_PATTERNS[0],
    [filteredPatterns, activePatternId]
  );

  const activePattern = useMemo(
    () => applyOverride('patterns', rawActivePattern),
    [applyOverride, rawActivePattern]
  );

  const activePatternOverride = getOverride('patterns', rawActivePattern.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Атлас</span>
            <span aria-hidden="true">·</span>
            <span>Моторный контроль, рекрутинг мышц и переобучение движений</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Справочник паттернов движений (биомеханика и дисфункции)
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Физиологическая последовательность включения мышц, визуальная и ММТ-диагностика
            патологических подмен, биомеханические последствия нарушений и пошаговое переобучение.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Паттерн, ходьба, бедро, дыхание..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {PATTERN_CATEGORIES.map((c) => (
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
            <span>Двигательные паттерны ({filteredPatterns.length})</span>
            <span>Регион</span>
          </div>

          {filteredPatterns.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Паттерны движений по запросу не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">
              {filteredPatterns.map((p) => {
                const isSelected = activePattern.id === p.id;
                const count = photoCounts[p.id] ?? 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePatternId(p.id)}
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
                        {p.name}
                      </div>
                      {count > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-blue-700 shrink-0">
                          <Camera className="w-3 h-3" />
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{p.category}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">{p.subtitle}</div>
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
                <span className="font-medium text-blue-700">{activePattern.category}</span>
                <span aria-hidden="true">·</span>
                <span>Моторный контроль</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-balance">{activePattern.name}</h2>
              <p className="text-xs italic text-slate-500">{activePattern.subtitle}</p>
            </div>
            <DirectoryEditButton
              section="patterns"
              item={rawActivePattern as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activePattern.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activePatternOverride} />

          {/* Image + Physiology */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="flex-1 min-h-[210px] bg-white flex items-center justify-center p-3">
                <img
                  src={activePattern.imageSrc}
                  alt={activePattern.name}
                  referrerPolicy="no-referrer"
                  className="max-h-56 w-full object-contain rounded"
                />
              </div>
              <div className="px-3 py-2 bg-white border-t border-slate-200 text-[11px] text-slate-500">
                {activePattern.imageAttribution}
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">
                  Описание физиологического паттерна
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {activePattern.physiologicalDescription}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="font-semibold text-slate-900">
                  Правильная очередность включения мышц
                </div>
                <ul className="space-y-1 text-slate-700 leading-relaxed">
                  {activePattern.recruitmentSequence.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Testing Check + Dysfunction Signs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-blue-950">
                <Activity className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Методика тестирования и проверки в ММТ</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activePattern.testingAndMmtCheck.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Признаки дисфункции и мышечных подмен</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activePattern.dysfunctionSigns.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Biomechanical & Systemic Consequences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-1.5">
              <div className="font-semibold text-amber-950">
                Биомеханические последствия нарушения
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activePattern.biomechanicalConsequences.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-semibold text-slate-900">
                Системные и вегетативные последствия
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                {activePattern.systemicConsequences.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Correction & Retraining */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-950">
              <Repeat className="w-4 h-4 text-emerald-700" />
              <span>Алгоритм коррекции и переобучения паттерна</span>
            </div>
            <ul className="space-y-1.5 text-slate-700 leading-relaxed">
              {activePattern.correctionAndRetraining.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            {activePattern.commonErrors.length > 0 && (
              <div className="pt-2 border-t border-emerald-200 text-rose-800">
                <strong>Ошибки коррекции:</strong> {activePattern.commonErrors.join(' · ')}
              </div>
            )}
          </div>

          <DirectoryPhotoGallery
            section="patterns"
            itemId={activePattern.id}
            itemName={activePattern.name}
            defaultImageSrc={activePattern.imageSrc}
            defaultImageCaption={activePattern.subtitle}
            defaultImageAttribution={activePattern.imageAttribution}
          />

          {/* Cross-Links */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">Ключевые мышцы:</span>
              {activePattern.relatedMuscleIds.map((mId) => {
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
              <span className="font-semibold text-slate-800">Миофасциальные цепи:</span>
              {activePattern.relatedChainIds.map((cId) => {
                const ch = MYOFASCIAL_CHAINS.find((item) => item.id === cId);
                if (!ch) return null;
                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'chain', id: cId })}
                    className="text-violet-700 hover:underline font-medium cursor-pointer"
                  >
                    {ch.name.split('(')[0].trim()} →
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
