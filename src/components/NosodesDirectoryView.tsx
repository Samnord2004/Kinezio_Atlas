import React, { useEffect, useMemo, useState } from 'react';
import { MERIDIANS, MUDRAS, MUSCLES, NOSODES, ORGANS } from '../data';
import { NosodeCategory, SelectedEntity } from '../types/atlas';
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
  FlaskConical,
  Search,
  Sparkles,
  Stethoscope,
} from 'lucide-react';

interface NosodesDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onOpenMudras?: () => void;
  initialNosodeId?: string | null;
}

const NOSODE_CATEGORIES: ReadonlyArray<{ id: NosodeCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все нозоды' },
  { id: 'Инфекционно-паразитарные', label: 'Инфекционно-паразитарные' },
  { id: 'Токсины и металлы', label: 'Токсины и металлы' },
  { id: 'Пищевые и гистаминовые', label: 'Пищевые и гистаминовые' },
  { id: 'Метаболические и ферментные', label: 'Метаболические и ферментные' },
  { id: 'Органно-тканевые', label: 'Органно-тканевые' },
  { id: 'Иммунно-стрессовые', label: 'Иммунно-стрессовые' },
];

export const NosodesDirectoryView: React.FC<NosodesDirectoryViewProps> = ({
  onOpenInAtlas,
  onOpenMudras,
  initialNosodeId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<NosodeCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeNosodeId, setActiveNosodeId] = useState<string>(
    initialNosodeId ?? NOSODES[0].id
  );
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialNosodeId && NOSODES.some((n) => n.id === initialNosodeId)) {
      setCategoryFilter('all');
      setQuery('');
      setActiveNosodeId(initialNosodeId);
    }
  }, [initialNosodeId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('nosode').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredNosodes = useMemo(() => {
    return NOSODES.filter((n) => {
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${n.name} ${n.latinOrCode} ${n.category} ${n.purpose} ${n.ampouleRole} ${n.neutralizationCheck} ${n.placementZones.join(' ')}`
      );
    });
  }, [categoryFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveNosode = useMemo(
    () =>
      filteredNosodes.find((n) => n.id === activeNosodeId) ?? filteredNosodes[0] ?? NOSODES[0],
    [filteredNosodes, activeNosodeId]
  );

  const activeNosode = useMemo(
    () => applyOverride('nosode', rawActiveNosode),
    [applyOverride, rawActiveNosode]
  );

  const activeNosodeOverride = getOverride('nosode', rawActiveNosode.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Справочник коррекции</span>
            <span aria-hidden="true">·</span>
            <span>Информационно-биохимическое тестирование в ММТ</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Диагностические ампулы (нозоды и органопрепараты)
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Применение стеклянных диагностических ампул и нозодов в прикладной кинезиологии:
            правила внесения в контур пациента, выявление скрытых инфекционных, токсических,
            пищевых и метаболических нагрузок и феномен нейтрализации.
          </p>
        </div>

        <div className="relative min-w-[270px] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Кандида, металлы, ВЭБ, гистамин..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {NOSODE_CATEGORIES.map((cat) => {
          const count =
            cat.id === 'all'
              ? NOSODES.length
              : NOSODES.filter((n) => n.category === cat.id).length;
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
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Справочник ампул ({filteredNosodes.length})</span>
            <span>Категория / Потенция</span>
          </div>

          {filteredNosodes.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              По запросу диагностические ампулы не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {filteredNosodes.map((n) => {
                const isSelected = activeNosode.id === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setActiveNosodeId(n.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3.5 ${
                      isSelected ? 'bg-blue-50/75' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={n.imageSrc}
                      alt={n.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-blue-700 mb-0.5">
                        <span className="truncate">{n.category}</span>
                        {(photoCounts[n.id] ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 shrink-0">
                            <Camera className="w-3 h-3 text-blue-700" />
                            {photoCounts[n.id]}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {n.name}
                      </div>
                      <div className="text-xs italic text-slate-500 mt-0.5 truncate">
                        {n.latinOrCode}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-700">{activeNosode.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeNosode.ampouleRole}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {activeNosode.name}
              </h2>
              <p className="text-xs font-mono text-slate-500">{activeNosode.latinOrCode}</p>
            </div>
            <DirectoryEditButton
              section="nosode"
              item={rawActiveNosode as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activeNosode.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activeNosodeOverride} />

          {/* Photo + Placement */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-5 flex flex-col">
              <DirectoryPhotoGallery
                section="nosode"
                itemId={activeNosode.id}
                itemName={activeNosode.name}
                defaultImageSrc={activeNosode.imageSrc}
                defaultImageCaption={activeNosode.purpose}
                defaultImageAttribution={activeNosode.imageAttribution}
                defaultSlideLabel="Эталон"
                photoTitlePlaceholder="Например: Свой набор ампул / зона аппликации"
                photoCaptionPlaceholder="Потенция, производитель ампулы или зона на теле..."
                vectorPresets={['Зона ампулы', 'Рецепторная точка', 'Точка ТЛ']}
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <FlaskConical className="w-4 h-4 text-blue-700" />
                  <span>Назначение и потенции ({activeNosode.potencyRange})</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  {activeNosode.purpose}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="text-xs font-semibold text-slate-900">
                  Зоны размещения ампулы на теле
                </div>
                <ul className="space-y-1 text-xs text-slate-700">
                  {activeNosode.placementZones.map((zone, i) => (
                    <li key={i} className="leading-relaxed">
                      • {zone}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step-by-step MMT Diagnostics */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-50/70 border-b border-slate-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Алгоритм тестирования ампулой в ММТ
              </h3>
            </div>
            <div className="p-4 space-y-3 text-xs sm:text-[13px]">
              <ol className="space-y-2 text-slate-700">
                {activeNosode.mmtDiagnosticSteps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 leading-relaxed">
                <span className="font-semibold">Положительный тест: </span>
                {activeNosode.positiveTestSign}
              </div>
            </div>
          </section>

          {/* Neutralization & Correction */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Феномен нейтрализации и протокол коррекции
              </h3>
            </div>
            <div className="p-4 space-y-3 text-xs sm:text-[13px]">
              <div className="p-3 bg-violet-50/60 border border-violet-200 rounded-lg text-xs text-violet-950 leading-relaxed">
                <span className="font-semibold">Подбор корректора (нейтрализация): </span>
                {activeNosode.neutralizationCheck}
              </div>
              <ul className="space-y-2 text-slate-700">
                {activeNosode.correctionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-amber-50/75 border border-amber-200 rounded-lg text-xs text-amber-950 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Частая ошибка при работе с ампулой: </span>
                  {activeNosode.commonErrors}
                </div>
              </div>
            </div>
          </section>

          {/* Cross-Links to Atlas & Mudras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Мышцы-индикаторы</div>
              <div className="space-y-1">
                {activeNosode.relatedMuscleIds.map((id) => {
                  const m = MUSCLES.find((item) => item.id === id);
                  if (!m) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'muscle', id })}
                      className="inline-flex items-center gap-1 text-blue-700 hover:underline mr-2 cursor-pointer"
                    >
                      <span>{m.name.split('(')[0].trim()}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-800 mb-1">Органы</div>
              <div className="space-y-1">
                {activeNosode.relatedOrganIds.map((id) => {
                  const o = ORGANS.find((item) => item.id === id);
                  if (!o) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'organ', id })}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline mr-2 cursor-pointer"
                    >
                      <span>{o.name}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-800 mb-1">Меридианы</div>
              <div className="space-y-1">
                {activeNosode.relatedMeridianIds.map((id) => {
                  const mer = MERIDIANS.find((item) => item.id === id);
                  if (!mer) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'meridian', id })}
                      className="inline-flex items-center gap-1 text-violet-700 hover:underline mr-2 cursor-pointer"
                    >
                      <span>
                        {mer.code} {mer.name}
                      </span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-800 mb-1">Сочетанные мудры</div>
              <div className="space-y-1">
                {activeNosode.relatedMudraIds.map((id) => {
                  const mu = MUDRAS.find((item) => item.id === id);
                  if (!mu) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onOpenMudras?.()}
                      className="inline-flex items-center gap-1 text-amber-800 hover:underline mr-2 cursor-pointer text-left"
                    >
                      <span>{mu.name.split('(')[0].trim()}</span>
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
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
