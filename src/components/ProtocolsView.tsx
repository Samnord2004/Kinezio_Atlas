import React, { useMemo, useState } from 'react';
import {
  CLINICAL_PROTOCOLS,
  DIAPHRAGMS,
  MUSCLES,
  ORGANS,
  TRIAD_PILLARS_REFERENCE,
  getEntityTitle,
} from '../data';
import { SelectedEntity } from '../types/atlas';
import { ArrowUpRight } from 'lucide-react';
import { DirectoryPhotoGallery } from './DirectoryPhotoGallery';
import {
  DirectoryCustomNoteBanner,
  DirectoryEditButton,
} from './DirectoryEntryEditor';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';

interface ProtocolsViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({ onOpenInAtlas }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeCaseId, setActiveCaseId] = useState<string>(CLINICAL_PROTOCOLS[0].id);

  const categories = useMemo(
    () => [
      'all',
      'Структурно-висцеральный',
      'Диафрагмальный каскад',
      'Кранио-мандибулярный',
      'Меридианный дисбаланс',
      'Эмоциональная коррекция',
      'Энергетическое воздействие',
      'Химическое воздействие',
    ],
    []
  );

  const filteredProtocols = useMemo(() => {
    if (selectedCategory === 'all') return CLINICAL_PROTOCOLS;
    return CLINICAL_PROTOCOLS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveCase = useMemo(
    () => filteredProtocols.find((p) => p.id === activeCaseId) ?? filteredProtocols[0],
    [filteredProtocols, activeCaseId]
  );

  const activeCase = useMemo(
    () => (rawActiveCase ? applyOverride('protocol', rawActiveCase) : undefined),
    [applyOverride, rawActiveCase]
  );

  const activeCaseOverride = rawActiveCase ? getOverride('protocol', rawActiveCase.id) : undefined;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Клинические протоколы коррекции дисфункций
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Пошаговые алгоритмы остеопатической и кинезиологической коррекции по всей Триаде здоровья:
          структурно-висцеральные техники, диафрагмальный каскад, эмоциональное снятие стресса (ЭСР),
          энергетическая балансировка (К-27 / ЭМИ / меридианы) и химическая детоксикация.
        </p>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'Все протоколы' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Case Selector + Active Protocol Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-3">
          {filteredProtocols.map((prot) => {
            const isActive = activeCase?.id === prot.id;
            return (
              <button
                key={prot.id}
                type="button"
                onClick={() => setActiveCaseId(prot.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-medium text-blue-700 mb-1">{prot.category}</div>
                <h2 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">
                  {prot.title}
                </h2>
                <p className="text-xs text-slate-600 line-clamp-2">{prot.primaryFinding}</p>
              </button>
            );
          })}

          {/* Quick Diaphragm Release Sequence Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Иерархия проверки 7 диафрагм тела
            </h3>
            <p className="text-xs text-slate-500">
              Нажмите на любую диафрагму для перехода к её связям на анатомической схеме
            </p>
            <div className="divide-y divide-slate-100">
              {DIAPHRAGMS.map((d, index) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onOpenInAtlas({ type: 'diaphragm', id: d.id })}
                  className="w-full py-2 flex items-center justify-between text-left hover:text-blue-700 transition-colors cursor-pointer text-xs"
                >
                  <span className="font-medium text-slate-800">
                    <span className="font-mono text-slate-400 mr-2">0{index + 1}.</span>
                    {d.name.split('(')[0].trim()}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeCase && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">{activeCase.category}</div>
                <h2 className="text-xl font-bold text-slate-900">{activeCase.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {rawActiveCase && (
                  <DirectoryEditButton
                    section="protocol"
                    item={rawActiveCase as unknown as { id: string } & Record<string, unknown>}
                    itemLabel={activeCase.title}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onOpenInAtlas(activeCase.triggerEntity)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>
                    Открыть в Атласе: {getEntityTitle(activeCase.triggerEntity).split('(')[0].trim()}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <DirectoryCustomNoteBanner override={activeCaseOverride} />

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="font-semibold text-slate-900">Клиническая картина</div>
              <p className="text-slate-700 leading-relaxed">{activeCase.primaryFinding}</p>
              <div className="pt-1.5 border-t border-slate-200 text-blue-900 font-medium">
                Цепь связей: {activeCase.chainSummary}
              </div>
            </div>

            <DirectoryPhotoGallery
              section="protocol"
              itemId={activeCase.id}
              itemName={activeCase.title}
              photoTitlePlaceholder="Например: Схема коррекции / результат до и после"
              photoCaptionPlaceholder="Этап протокола, точки контакта или фото пациента..."
              vectorPresets={['Направление коррекции', 'Точка ТЛ', 'Фиксация']}
              compactStripWhenEmpty
            />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Диагностический алгоритм (ТЛ и провокации)
              </h3>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
                {activeCase.diagnosticAlgorithm.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Последовательность лечебной коррекции
              </h3>
              <div className="space-y-3">
                {activeCase.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-blue-700">{s.modality}</span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {s.durationOrDose}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">{s.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.technique}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Matrix of Quick Triggers */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-slate-700 mb-2">
                Быстрый переход к ключевым индикаторам и органам:
              </h3>
              <div className="flex flex-wrap gap-3 text-xs">
                {MUSCLES.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'muscle', id: m.id })}
                    className="text-blue-700 hover:underline cursor-pointer"
                  >
                    {m.name.split('(')[0].trim()}
                  </button>
                ))}
                {ORGANS.slice(0, 4).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'organ', id: o.id })}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    {o.name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Triad of Health: Emotional, Energetic & Chemical Quick Reference */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Базовые алгоритмы Триады здоровья: Эмоции · Энергия · Химия
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Стандартизированные провокации в ММТ и пошаговые методы коррекции неструктурных факторов
            дисфункции
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {TRIAD_PILLARS_REFERENCE.map((pillar) => (
            <div
              key={pillar.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">{pillar.title}</h3>
                <p className="text-[11px] text-blue-700 font-medium mt-0.5">{pillar.subtitle}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-800 block mb-0.5">
                  Диагностика и провокация в ММТ
                </span>
                <p className="text-slate-600 leading-relaxed">{pillar.diagnostic}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block mb-1">
                  Методика коррекции
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 leading-relaxed">
                  {pillar.correction.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
