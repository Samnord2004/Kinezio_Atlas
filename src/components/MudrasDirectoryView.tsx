import React, { useEffect, useMemo, useState } from 'react';
import { MERIDIANS, MUDRAS, MUSCLES, ORGANS } from '../data';
import { MudraDomainCategory, SelectedEntity } from '../types/atlas';
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
import { ArrowUpRight, Camera, CheckCircle2, Hand, Search, Stethoscope } from 'lucide-react';

interface MudrasDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  initialMudraId?: string | null;
}

const MUDRA_CATEGORIES: ReadonlyArray<{ id: MudraDomainCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все мудры' },
  { id: 'Структурная', label: 'Структурная' },
  { id: 'Эмоциональная', label: 'Эмоциональная' },
  { id: 'Энергетическая', label: 'Энергетическая' },
  { id: 'Химическая', label: 'Химическая' },
  { id: 'Висцеральная', label: 'Висцеральная' },
  { id: 'Балансирующая', label: 'Балансирующая' },
];

export const MudrasDirectoryView: React.FC<MudrasDirectoryViewProps> = ({
  onOpenInAtlas,
  initialMudraId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<MudraDomainCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeMudraId, setActiveMudraId] = useState<string>(initialMudraId ?? MUDRAS[0].id);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialMudraId && MUDRAS.some((m) => m.id === initialMudraId)) {
      setCategoryFilter('all');
      setQuery('');
      setActiveMudraId(initialMudraId);
    }
  }, [initialMudraId]);

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('mudra').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const filteredMudras = useMemo(() => {
    return MUDRAS.filter((m) => {
      if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
      if (!query.trim()) return true;
      return fuzzyMatches(
        query,
        `${m.name} ${m.sanskritName} ${m.category} ${m.diagnosticRole} ${m.fingerPosition} ${m.positiveDiagnosticSign}`
      );
    });
  }, [categoryFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveMudra = useMemo(
    () =>
      filteredMudras.find((m) => m.id === activeMudraId) ?? filteredMudras[0] ?? MUDRAS[0],
    [filteredMudras, activeMudraId]
  );

  const activeMudra = useMemo(
    () => applyOverride('mudra', rawActiveMudra),
    [applyOverride, rawActiveMudra]
  );

  const activeMudraOverride = getOverride('mudra', rawActiveMudra.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Справочник коррекции</span>
            <span aria-hidden="true">·</span>
            <span>Прикладная кинезиология и пальцевые пробы</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Мудры: диагностика приоритета и коррекция в ММТ
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Пальцевые локализаторы (мудры) позволяют быстро определить ведущий уровень дисфункции
            — структурный, эмоциональный, энергетический, химический или висцеральный — и
            провести прицельную коррекцию под контролем индикаторной мышцы.
          </p>
        </div>

        <div className="relative min-w-[260px] shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Название мудры, уровень, палец..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {MUDRA_CATEGORIES.map((cat) => {
          const count =
            cat.id === 'all'
              ? MUDRAS.length
              : MUDRAS.filter((m) => m.category === cat.id).length;
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
            <span>Справочник мудр ({filteredMudras.length})</span>
            <span>Уровень воздействия</span>
          </div>

          {filteredMudras.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              По фильтру мудры не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {filteredMudras.map((m) => {
                const isSelected = activeMudra.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMudraId(m.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3.5 ${
                      isSelected ? 'bg-blue-50/75' : 'hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={m.imageSrc}
                      alt={m.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-blue-700 mb-0.5">
                        <span className="truncate">{m.category}</span>
                        {(photoCounts[m.id] ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 shrink-0">
                            <Camera className="w-3 h-3 text-blue-700" />
                            {photoCounts[m.id]}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {m.name}
                      </div>
                      <div className="text-xs italic text-slate-500 mt-0.5 truncate">
                        {m.sanskritName}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detailed Diagnostic & Correction Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-semibold text-blue-700">{activeMudra.category}</span>
                <span aria-hidden="true">·</span>
                <span className="italic">{activeMudra.sanskritName}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {activeMudra.name}
              </h2>
            </div>
            <DirectoryEditButton
              section="mudra"
              item={rawActiveMudra as unknown as { id: string } & Record<string, unknown>}
              itemLabel={activeMudra.name}
            />
          </div>

          <DirectoryCustomNoteBanner override={activeMudraOverride} />

          {/* Open-Source Visual Photo + Custom Photos & Finger Position */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-5 flex flex-col">
              <DirectoryPhotoGallery
                section="mudra"
                itemId={activeMudra.id}
                itemName={activeMudra.name}
                defaultImageSrc={activeMudra.imageSrc}
                defaultImageCaption={activeMudra.fingerPosition}
                defaultImageAttribution={activeMudra.imageAttribution}
                defaultSlideLabel="Эталон"
                photoTitlePlaceholder="Например: Свой вариант укладки пальцев"
                photoCaptionPlaceholder="Комментарий к укладке кисти и контакту пальцев..."
                vectorPresets={['Контакт пальцев', 'Направление давления', 'Точка локализации']}
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Hand className="w-4 h-4 text-blue-700" />
                  <span>Положение пальцев (укладка кисти)</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  {activeMudra.fingerPosition}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="text-xs font-semibold text-slate-900">
                  Клиническое назначение в кинезиологии
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                  {activeMudra.diagnosticRole}
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-step Diagnostic Protocol via MMT */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-50/70 border-b border-slate-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Способ диагностики с применением мудры и ММТ
              </h3>
            </div>
            <div className="p-4 space-y-3 text-xs sm:text-[13px]">
              <ol className="space-y-2 text-slate-700">
                {activeMudra.mmtDiagnosticSteps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 leading-relaxed">
                <span className="font-semibold">Положительный диагностический критерий: </span>
                {activeMudra.positiveDiagnosticSign}
              </div>
            </div>
          </section>

          {/* Correction Protocol */}
          <section className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Алгоритм коррекции и ретеста
                </h3>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-600">
                {activeMudra.durationAndBreathing}
              </span>
            </div>
            <div className="p-4 space-y-3 text-xs sm:text-[13px]">
              <ul className="space-y-2 text-slate-700">
                {activeMudra.correctionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-mono font-bold text-emerald-700 shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950 leading-relaxed">
                <span className="font-semibold">Практическое примечание: </span>
                {activeMudra.contraindicationsOrNotes}
              </div>
            </div>
          </section>

          {/* Atlas Cross-Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-xs">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Индикаторные мышцы</div>
              <div className="space-y-1">
                {activeMudra.relatedMuscleIds.map((id) => {
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
              <div className="font-semibold text-slate-800 mb-1">Органы и системы</div>
              <div className="space-y-1">
                {activeMudra.relatedOrganIds.map((id) => {
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
              <div className="font-semibold text-slate-800 mb-1">Связанные меридианы</div>
              <div className="space-y-1">
                {activeMudra.relatedMeridianIds.map((id) => {
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
          </div>
        </div>
      </div>
    </div>
  );
};
