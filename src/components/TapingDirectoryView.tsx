import React, { useEffect, useMemo, useState } from 'react';
import { MUSCLES, MYOFASCIAL_CHAINS, TAPING_APPLICATIONS } from '../data';
import { SelectedEntity, TapingCategory } from '../types/atlas';
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
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Ruler,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface TapingDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  initialTapeId?: string | null;
}

const TAPING_CATEGORIES: ReadonlyArray<{ id: TapingCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все аппликации' },
  { id: 'Мышечная (поддержка / тонизация)', label: 'Тонизация / поддержка' },
  { id: 'Мышечная (декомпрессия / расслабление)', label: 'Декомпрессия / спазм' },
  { id: 'Связочно-суставная', label: 'Связки и суставы' },
  { id: 'Лимфодренажная и фасциальная', label: 'Лимфодренаж / фасции' },
];

export const TapingDirectoryView: React.FC<TapingDirectoryViewProps> = ({
  onOpenInAtlas,
  initialTapeId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<TapingCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeTapeId, setActiveTapeId] = useState<string>(
    initialTapeId ?? TAPING_APPLICATIONS[0].id
  );
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialTapeId && TAPING_APPLICATIONS.some((t) => t.id === initialTapeId)) {
      setCategoryFilter('all');
      setQuery('');
      setActiveTapeId(initialTapeId);
    }
  }, [initialTapeId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('taping').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredTapes = useMemo(() => {
    return TAPING_APPLICATIONS.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${t.name} ${t.regionLabel} ${t.category} ${t.tapeCutForm} ${t.indications.join(' ')}`
      );
    });
  }, [categoryFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveTape = useMemo(
    () =>
      filteredTapes.find((t) => t.id === activeTapeId) ??
      filteredTapes[0] ??
      TAPING_APPLICATIONS[0],
    [filteredTapes, activeTapeId]
  );

  const activeTape = useMemo(
    () => applyOverride('taping', rawActiveTape),
    [applyOverride, rawActiveTape]
  );

  const activeTapeOverride = getOverride('taping', rawActiveTape.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Справочник коррекции</span>
            <span aria-hidden="true">·</span>
            <span>Закрепление коррекции ММТ и разгрузка тканей</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Справочник кинезиотейпирования
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Техника нарезки (I, Y, веер/лимфа), точные проценты натяжения, направление аппликации
            для тонизации или декомпрессии мышцы, а также обязательный контроль по ретесту ММТ.
          </p>
        </div>

        <div className="relative min-w-[270px] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Плечо, поясница, колено, лимфа, стопа..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {TAPING_CATEGORIES.map((cat) => {
          const count =
            cat.id === 'all'
              ? TAPING_APPLICATIONS.length
              : TAPING_APPLICATIONS.filter((t) => t.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Протоколы тейпирования ({filteredTapes.length})</span>
            <span>Натяжение</span>
          </div>

          {filteredTapes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              По вашему запросу аппликации не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {filteredTapes.map((t) => {
                const isSelected = activeTape.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTapeId(t.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3.5 ${
                      isSelected ? 'bg-blue-50/75' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={t.imageSrc}
                      alt={t.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-blue-700 mb-0.5">
                        <span className="truncate">{t.category}</span>
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
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{t.regionLabel}</div>
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
                <span className="font-semibold text-blue-700">{activeTape.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeTape.regionLabel}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{activeTape.name}</h2>
            </div>
            <DirectoryEditButton
              section="taping"
              item={rawActiveTape as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activeTape.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activeTapeOverride} />

          {/* Photo + Tension/Cut Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-5 flex flex-col">
              <DirectoryPhotoGallery
                section="taping"
                itemId={activeTape.id}
                itemName={activeTape.name}
                defaultImageSrc={activeTape.imageSrc}
                defaultImageCaption={activeTape.directionRule}
                defaultImageAttribution={activeTape.imageAttribution}
                defaultSlideLabel="Схема"
                photoTitlePlaceholder="Например: Аппликация на пациенте (этап 1)"
                photoCaptionPlaceholder="Процент натяжения, якорь, длина полосы тейпа..."
                vectorPresets={['Якорь (0%)', 'Вектор натяжения', 'Декомпрессия', 'Лимфоотток']}
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Ruler className="w-4 h-4 text-blue-700" />
                  <span>Параметры ленты и натяжения</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Натяжение:</strong> {activeTape.tensionPercent}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Форма нарезки:</strong> {activeTape.tapeCutForm}
                </p>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1 text-xs">
                <div className="font-semibold text-blue-950">Правило вектора аппликации</div>
                <p className="text-blue-900 leading-relaxed">{activeTape.directionRule}</p>
              </div>
            </div>
          </div>

          {/* Indications */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="font-semibold text-slate-900">Показания к применению</div>
            <ul className="space-y-1 text-slate-700">
              {activeTape.indications.map((ind, i) => (
                <li key={i} className="leading-relaxed">
                  • {ind}
                </li>
              ))}
            </ul>
          </div>

          {/* Step-by-Step Application */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">Пошаговая техника наклеивания</h3>
              <span className="text-[11px] font-mono text-slate-500">
                {activeTape.wearTimeAndRemoval.split('·')[0].trim()}
              </span>
            </div>
            <div className="p-4 space-y-3 text-xs sm:text-[13px]">
              <ol className="space-y-2 text-slate-700">
                {activeTape.applicationSteps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Верификация в ММТ: </span>
                  {activeTape.mmtVerification}
                </div>
              </div>
              <div className="p-3 bg-amber-50/75 border border-amber-200 rounded-lg text-xs text-amber-950 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Противопоказания и снятие: </span>
                  {activeTape.contraindications}. {activeTape.wearTimeAndRemoval}
                </div>
              </div>
            </div>
          </section>

          {/* Atlas Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Целевые мышцы</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {activeTape.relatedMuscleIds.map((id) => {
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
              <div className="font-semibold text-slate-800 mb-1">Миофасциальные цепи</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {activeTape.relatedChainIds.map((id) => {
                  const ch = MYOFASCIAL_CHAINS.find((item) => item.id === id);
                  if (!ch) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'chain', id })}
                      className="inline-flex items-center gap-1 text-violet-700 hover:underline cursor-pointer"
                    >
                      <span>{ch.name.split('(')[0].trim()}</span>
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
