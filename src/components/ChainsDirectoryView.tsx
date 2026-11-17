import React, { useEffect, useMemo, useState } from 'react';
import {
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  ORGANS,
} from '../data';
import { SelectedEntity } from '../types/atlas';
import {
  DIRECTORY_MEDIA_UPDATED_EVENT,
  loadDirectoryPhotoCountsBySection,
} from '../utils/directoryMediaStore';
import { ArrowUpRight, Camera, Search } from 'lucide-react';
import { DirectoryPhotoGallery } from './DirectoryPhotoGallery';
import {
  DirectoryCustomNoteBanner,
  DirectoryEditButton,
} from './DirectoryEntryEditor';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';

interface ChainsDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
}

export const ChainsDirectoryView: React.FC<ChainsDirectoryViewProps> = ({
  onOpenInAtlas,
}) => {
  const [planeFilter, setPlaneFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [activeChainId, setActiveChainId] = useState<string>(MYOFASCIAL_CHAINS[0].id);
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const refresh = () => {
      loadDirectoryPhotoCountsBySection('chain').then(setPhotoCounts);
    };
    refresh();
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, refresh);
  }, []);

  const planes = useMemo(
    () => [
      'all',
      'Сагиттальная',
      'Фронтальная',
      'Спирально-диагональная',
      'Глубинная осевая',
      'Плечевой пояс',
    ],
    []
  );

  const filteredChains = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MYOFASCIAL_CHAINS.filter((c) => {
      if (planeFilter !== 'all' && c.plane !== planeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.englishName.toLowerCase().includes(q) ||
        c.shortCode.toLowerCase().includes(q) ||
        c.pathwaySegments.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [planeFilter, query]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveChain = useMemo(
    () =>
      filteredChains.find((c) => c.id === activeChainId) ??
      filteredChains[0] ??
      MYOFASCIAL_CHAINS[0],
    [filteredChains, activeChainId]
  );

  const activeChain = useMemo(
    () => applyOverride('chain', rawActiveChain),
    [applyOverride, rawActiveChain]
  );

  const activeChainOverride = getOverride('chain', rawActiveChain.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Справочник миофасциальных цепей (Анатомические поезда)
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Полный разбор миофасциальных меридианов: непрерывность фасциального пути,
            постуральные маркеры, кинезиологическое тестирование (ТЛ) и связи с диафрагмами,
            органами и каналами ТКМ.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Цепь, мышца или фасция..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Plane Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {planes.map((pl) => (
          <button
            key={pl}
            type="button"
            onClick={() => setPlaneFilter(pl)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              planeFilter === pl
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {pl === 'all' ? `Все цепи (${MYOFASCIAL_CHAINS.length})` : pl}
          </button>
        ))}
      </div>

      {/* Split Directory Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Миофасциальные цепи ({filteredChains.length})</span>
            <span>Плоскость</span>
          </div>

          {filteredChains.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              По заданному фильтру цепи не найдены.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredChains.map((ch) => {
                const isSelected = activeChain.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChainId(ch.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center gap-3 ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    {ch.imageSrc && (
                      <img
                        src={ch.imageSrc}
                        alt={ch.name}
                        className="w-14 h-14 rounded-lg object-contain border border-slate-200 bg-white p-0.5 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: ch.color }}
                          />
                          <span className="font-mono tabular-nums font-semibold text-slate-700 truncate">
                            {ch.shortCode}
                          </span>
                        </div>
                        {(photoCounts[ch.id] ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 shrink-0">
                            <Camera className="w-3 h-3 text-blue-700" />
                            {photoCounts[ch.id]}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm font-semibold leading-snug ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {ch.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {ch.plane} · {ch.muscleIds.length} мышц · {ch.diaphragmIds.length} диафрагм
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono font-semibold text-slate-800">
                  {activeChain.shortCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeChain.plane}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{activeChain.name}</h2>
              <p className="text-xs italic text-slate-500 mt-0.5">{activeChain.englishName}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DirectoryEditButton
                section="chain"
                item={rawActiveChain as unknown as { id: string } & Record<string, unknown>}
                itemLabel={activeChain.name}
              />
              <button
                type="button"
                onClick={() => onOpenInAtlas({ type: 'chain', id: activeChain.id })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Показать траекторию на атласе</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <DirectoryCustomNoteBanner override={activeChainOverride} />

          {/* Open-Source Anatomical Illustration + Biomechanical Role */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className="md:col-span-5 flex flex-col">
              <DirectoryPhotoGallery
                section="chain"
                itemId={activeChain.id}
                itemName={activeChain.name}
                defaultImageSrc={activeChain.imageSrc}
                defaultImageCaption={activeChain.imageCaption}
                defaultImageAttribution={activeChain.imageAttribution}
                defaultSlideLabel="Анатомия"
                photoTitlePlaceholder="Например: Оценка осанки / ход цепи на пациенте"
                photoCaptionPlaceholder="Линия натяжения, фасциальные укорочения или триггеры..."
                vectorPresets={['Линия тяги', 'Фасциальный блок', 'Компенсация']}
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex-1">
                <div className="font-semibold text-slate-900">Биомеханическая роль цепи</div>
                <p className="text-slate-700 leading-relaxed">{activeChain.biomechanicalRole}</p>
              </div>
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1.5">
                <div className="font-semibold text-blue-950">
                  Кинезиологическая стратегия (ТЛ и ретест)
                </div>
                <p className="text-blue-900 leading-relaxed">
                  {activeChain.kinesiologyTestStrategy}
                </p>
              </div>
            </div>
          </div>

          {/* Continuous Anatomical Pathway */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Анатомический ход цепи (звено за звеном)
            </h3>
            <ol className="space-y-1.5 text-xs text-slate-700">
              {activeChain.pathwaySegments.map((seg, idx) => (
                <li
                  key={idx}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start gap-2.5"
                >
                  <span className="font-mono tabular-nums text-slate-400 font-semibold shrink-0">
                    0{idx + 1}.
                  </span>
                  <span className="leading-relaxed">{seg}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Postural Dysfunction Signs */}
          <div className="p-3.5 border border-slate-200 rounded-lg text-xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              Постуральные признаки дисфункции цепи
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
              {activeChain.posturalDysfunctionSigns.map((sign, i) => (
                <li key={i}>{sign}</li>
              ))}
            </ul>
          </div>

          {/* Cross-Links Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Мышцы цепи</div>
              <div className="space-y-1">
                {activeChain.muscleIds.map((mId) => {
                  const m = MUSCLES.find((item) => item.id === mId);
                  if (!m) return null;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'muscle', id: mId })}
                      className="block text-left text-blue-700 hover:underline cursor-pointer"
                    >
                      {m.name.split('(')[0].trim()} →
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Диафрагмы</div>
              <div className="space-y-1">
                {activeChain.diaphragmIds.map((dId) => {
                  const d = DIAPHRAGMS.find((item) => item.id === dId);
                  if (!d) return null;
                  return (
                    <button
                      key={dId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'diaphragm', id: dId })}
                      className="block text-left text-amber-700 hover:underline cursor-pointer"
                    >
                      {d.name.split('(')[0].trim()} →
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Органы</div>
              <div className="space-y-1">
                {activeChain.organIds.map((oId) => {
                  const o = ORGANS.find((item) => item.id === oId);
                  if (!o) return null;
                  return (
                    <button
                      key={oId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'organ', id: oId })}
                      className="block text-left text-emerald-700 hover:underline cursor-pointer"
                    >
                      {o.name.split('(')[0].trim()} →
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Меридианы</div>
              <div className="space-y-1">
                {activeChain.meridianIds.map((merId) => {
                  const mer = MERIDIANS.find((item) => item.id === merId);
                  if (!mer) return null;
                  return (
                    <button
                      key={merId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'meridian', id: merId })}
                      className="block text-left text-slate-800 hover:underline cursor-pointer"
                    >
                      {mer.code} {mer.name.replace('Меридиан ', '')} →
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Correction Steps */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Протокол коррекции миофасциальной цепи
            </h3>
            <div className="space-y-2.5">
              {activeChain.correctionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-blue-700">{step.modality}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {step.durationOrDose}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.technique}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
