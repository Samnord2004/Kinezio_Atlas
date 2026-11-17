import React, { useMemo, useState } from 'react';
import {
  ACUPOINTS,
  ANATOMICAL_SIDE_META,
  ANATOMICAL_ZONES,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  NEURO_PROFILES,
  ORGANS,
  getCrossReferences,
  getEntityTitle,
  getEntityTypeLabel,
  getMuscleAnatomyImage,
  getMuscleSide,
  getOrganSide,
  getRelatedMudrasAndNosodes,
  getTriadCorrections,
} from '../data';
import { CorrectionStep, SelectedEntity } from '../types/atlas';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FlaskConical,
  Hand,
  Info,
  Maximize2,
  Sparkles,
  X,
} from 'lucide-react';
import { MMTSchematicDiagram } from './MMTSchematicDiagram';
import { AcupunctureBodyMap } from './AcupunctureBodyMap';
import { DirectoryPhotoGallery } from './DirectoryPhotoGallery';
import {
  DirectoryCustomNoteBanner,
  DirectoryEditButton,
} from './DirectoryEntryEditor';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';
import { EditableDirectorySection } from '../types/atlas';

interface EntityInspectorProps {
  selectedEntity: SelectedEntity;
  history: SelectedEntity[];
  onSelectEntity: (entity: SelectedEntity) => void;
  onNavigateBack: () => void;
  onOpenTab?: (tab: 'mudras' | 'nosodes' | 'taping' | 'trusts') => void;
}

const CorrectionStepsList: React.FC<{ steps: CorrectionStep[] }> = ({ steps }) => {
  if (steps.length === 0) return null;
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={`${step.title}-${index}`}
          className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-blue-700">{step.modality}</span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {step.durationOrDose}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h4>
          <p className="text-xs leading-relaxed text-slate-600">{step.technique}</p>
        </div>
      ))}
    </div>
  );
};

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  selectedEntity,
  history,
  onSelectEntity,
  onNavigateBack,
  onOpenTab,
}) => {
  const [imageZoom, setImageZoom] = useState<{
    src: string;
    title: string;
    caption: string;
  } | null>(null);

  const crossRefs = useMemo(() => getCrossReferences(selectedEntity), [selectedEntity]);
  const relatedMudrasAndNosodes = useMemo(
    () => getRelatedMudrasAndNosodes(selectedEntity, crossRefs),
    [selectedEntity, crossRefs]
  );
  const triadCorrections = useMemo(
    () =>
      getTriadCorrections(selectedEntity, {
        muscles: crossRefs.muscles,
        organs: crossRefs.organs,
        meridians: crossRefs.meridians,
      }),
    [selectedEntity, crossRefs]
  );

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const muscle = useMemo(() => {
    if (selectedEntity.type !== 'muscle') return undefined;
    const raw = MUSCLES.find((m) => m.id === selectedEntity.id);
    return raw ? applyOverride('muscle', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const muscleAnatomy = useMemo(
    () => (muscle ? getMuscleAnatomyImage(muscle) : undefined),
    [muscle]
  );

  const organ = useMemo(() => {
    if (selectedEntity.type !== 'organ') return undefined;
    const raw = ORGANS.find((o) => o.id === selectedEntity.id);
    return raw ? applyOverride('organ', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const diaphragm = useMemo(() => {
    if (selectedEntity.type !== 'diaphragm') return undefined;
    const raw = DIAPHRAGMS.find((d) => d.id === selectedEntity.id);
    return raw ? applyOverride('diaphragm', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const meridian = useMemo(() => {
    if (selectedEntity.type !== 'meridian') return undefined;
    const raw = MERIDIANS.find((m) => m.id === selectedEntity.id);
    return raw ? applyOverride('meridian', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const acupoint = useMemo(() => {
    if (selectedEntity.type !== 'acupoint') return undefined;
    const raw = ACUPOINTS.find((a) => a.id === selectedEntity.id);
    return raw ? applyOverride('acupoint', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const chain = useMemo(() => {
    if (selectedEntity.type !== 'chain') return undefined;
    const raw = MYOFASCIAL_CHAINS.find((c) => c.id === selectedEntity.id);
    return raw ? applyOverride('chain', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const neuro = useMemo(() => {
    if (selectedEntity.type !== 'neuro') return undefined;
    const raw = NEURO_PROFILES.find((n) => n.id === selectedEntity.id);
    return raw ? applyOverride('neuro', raw) : undefined;
  }, [selectedEntity, applyOverride]);

  const activeRawEntity = useMemo(() => {
    switch (selectedEntity.type) {
      case 'muscle':
        return MUSCLES.find((m) => m.id === selectedEntity.id);
      case 'organ':
        return ORGANS.find((o) => o.id === selectedEntity.id);
      case 'diaphragm':
        return DIAPHRAGMS.find((d) => d.id === selectedEntity.id);
      case 'meridian':
        return MERIDIANS.find((m) => m.id === selectedEntity.id);
      case 'acupoint':
        return ACUPOINTS.find((a) => a.id === selectedEntity.id);
      case 'chain':
        return MYOFASCIAL_CHAINS.find((c) => c.id === selectedEntity.id);
      case 'neuro':
        return NEURO_PROFILES.find((n) => n.id === selectedEntity.id);
    }
  }, [selectedEntity]);

  const activeOverride = getOverride(
    selectedEntity.type as EditableDirectorySection,
    selectedEntity.id
  );

  const zoneMeta = useMemo(() => {
    const zId = muscle?.zone ?? organ?.zone ?? diaphragm?.zone;
    return zId ? ANATOMICAL_ZONES.find((z) => z.id === zId) : undefined;
  }, [muscle, organ, diaphragm]);

  const entitySideLabel = useMemo(() => {
    if (muscle) {
      return ANATOMICAL_SIDE_META[getMuscleSide(muscle)].label;
    }
    if (acupoint) {
      return ANATOMICAL_SIDE_META[acupoint.svgCoords.view].label;
    }
    if (organ) {
      const s = getOrganSide(organ);
      return s === 'both' ? 'Передняя и задняя проекции' : ANATOMICAL_SIDE_META[s].label;
    }
    return undefined;
  }, [muscle, acupoint, organ]);

  const correctionSteps: CorrectionStep[] = useMemo(() => {
    if (muscle) return muscle.correctionSteps;
    if (organ) return organ.correctionSteps;
    if (diaphragm) return diaphragm.correctionSteps;
    if (meridian) return meridian.correctionSteps;
    if (chain) return chain.correctionSteps;
    if (neuro) return neuro.correctionSteps;
    if (acupoint) {
      const parentMeridian = MERIDIANS.find((m) => m.id === acupoint.meridianId);
      return parentMeridian?.correctionSteps ?? [];
    }
    return [];
  }, [muscle, organ, diaphragm, meridian, acupoint, chain, neuro]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header & History Trail */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white">
        {history.length > 1 && (
          <div className="flex items-center gap-2 mb-2.5 text-xs text-slate-500 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={onNavigateBack}
              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 font-medium shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Назад
            </button>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {history.slice(-4).map((item, idx, arr) => (
                <React.Fragment key={`${item.type}-${item.id}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onSelectEntity(item)}
                    className={`hover:text-slate-900 transition-colors cursor-pointer ${
                      idx === arr.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500'
                    }`}
                  >
                    {getEntityTitle(item).split('(')[0].trim()}
                  </button>
                  {idx < arr.length - 1 && <span aria-hidden="true">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Quiet 1-line metadata kicker (zero-pill rule) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
          <span className="font-medium text-blue-700">
            {getEntityTypeLabel(selectedEntity.type)}
          </span>
          {zoneMeta && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {zoneMeta.classifierCode} — {zoneMeta.name}
              </span>
            </>
          )}
          {entitySideLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">{entitySideLabel}</span>
            </>
          )}
          {muscle && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{muscle.spinalSegment}</span>
            </>
          )}
          {organ && (
            <>
              <span aria-hidden="true">·</span>
              <span>{organ.system}</span>
            </>
          )}
          {diaphragm && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{diaphragm.level}</span>
            </>
          )}
          {meridian && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{meridian.code}</span>
              <span aria-hidden="true">·</span>
              <span>{meridian.element}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{meridian.activeHours}</span>
            </>
          )}
          {acupoint && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{acupoint.code}</span>
              <span aria-hidden="true">·</span>
              <span>{acupoint.role}</span>
            </>
          )}
          {chain && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{chain.shortCode}</span>
              <span aria-hidden="true">·</span>
              <span>{chain.plane}</span>
            </>
          )}
          {neuro && (
            <>
              <span aria-hidden="true">·</span>
              <span>{neuro.category}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900 leading-tight text-balance">
              {muscle?.name ??
                organ?.name ??
                diaphragm?.name ??
                meridian?.name ??
                chain?.name ??
                neuro?.name ??
                (acupoint ? `${acupoint.code} — ${acupoint.chineseName} (${acupoint.russianName})` : '')}
            </h2>
            {(muscle?.latinName ||
              organ?.latinName ||
              diaphragm?.latinName ||
              meridian?.chineseName ||
              chain?.englishName ||
              neuro?.latinOrSubtitle) && (
              <p className="text-xs italic text-slate-500 mt-0.5">
                {muscle?.latinName ??
                  organ?.latinName ??
                  diaphragm?.latinName ??
                  meridian?.chineseName ??
                  chain?.englishName ??
                  neuro?.latinOrSubtitle}
              </p>
            )}
          </div>
          {activeRawEntity && (
            <DirectoryEditButton
              compact
              section={selectedEntity.type as EditableDirectorySection}
              item={activeRawEntity as unknown as { id: string } & Record<string, unknown>}
              itemLabel={
                muscle?.name ??
                organ?.name ??
                diaphragm?.name ??
                meridian?.name ??
                chain?.name ??
                neuro?.name ??
                acupoint?.russianName
              }
            />
          )}
        </div>
      </div>

      {/* Scrollable Clinical Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <DirectoryCustomNoteBanner override={activeOverride} />
        {/* ==================== 1. PRIMARY CLINICAL DETAILS ==================== */}
        {muscle && (
          <>
            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-900">Анатомия и биомеханика</h3>
              {muscleAnatomy && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    className="relative bg-white flex items-center justify-center p-2 cursor-zoom-in"
                    onClick={() =>
                      setImageZoom({
                        src: muscleAnatomy.src,
                        title: muscle.name,
                        caption: `${muscleAnatomy.caption} (${muscleAnatomy.attribution})`,
                      })
                    }
                  >
                    <img
                      src={muscleAnatomy.src}
                      alt={muscleAnatomy.caption}
                      className="max-h-44 w-full object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageZoom({
                          src: muscleAnatomy.src,
                          title: muscle.name,
                          caption: `${muscleAnatomy.caption} (${muscleAnatomy.attribution})`,
                        });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-white text-slate-700 border border-slate-200 rounded-md cursor-pointer"
                      title="Увеличить анатомию мышцы"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="px-3 py-1.5 border-t border-slate-200 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span className="truncate font-medium text-slate-700">
                      {muscleAnatomy.caption}
                    </span>
                    <span className="shrink-0">{muscleAnatomy.attribution}</span>
                  </div>
                </div>
              )}
              <dl className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <dt className="text-slate-500 mb-0.5">Начало и прикрепление</dt>
                  <dd className="text-slate-800 leading-relaxed">
                    <strong>Начало:</strong> {muscle.origin}. <strong>Прикрепление:</strong>{' '}
                    {muscle.insertion}.
                  </dd>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <dt className="text-slate-500 mb-0.5">Иннервация и функция</dt>
                  <dd className="text-slate-800 leading-relaxed">
                    <strong>Нерв:</strong> {muscle.innervation}. <strong>Функция:</strong>{' '}
                    {muscle.function}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Протокол мануально-мышечного тестирования (ММТ)
              </h3>
              <MMTSchematicDiagram muscle={muscle} />
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                <div className="p-3">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Исходное положение пациента
                  </span>
                  <p className="text-slate-600 leading-relaxed">{muscle.mmt.patientPosition}</p>
                </div>
                <div className="p-3">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Позиция врача и фиксация
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {muscle.mmt.practitionerPosition} {muscle.mmt.stabilization}
                  </p>
                </div>
                <div className="p-3">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Тест-действие и вектор давления
                  </span>
                  <p className="text-slate-600 leading-relaxed mb-1">{muscle.mmt.testAction}</p>
                  <p className="text-blue-800 font-medium leading-relaxed">
                    Вектор давления: {muscle.mmt.pressureVector}
                  </p>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60">
                  <div>
                    <span className="font-semibold text-emerald-700 inline-flex items-center gap-1 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Нормотония
                    </span>
                    <p className="text-slate-600 leading-relaxed">{muscle.mmt.normotoniaSign}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-rose-700 inline-flex items-center gap-1 mb-0.5">
                      <Info className="w-3.5 h-3.5" />
                      Гипотония / дисфункция
                    </span>
                    <p className="text-slate-600 leading-relaxed">{muscle.mmt.hypotoniaSign}</p>
                  </div>
                </div>
                {muscle.mmt.commonErrors.length > 0 && (
                  <div className="p-3">
                    <span className="font-semibold text-slate-800 block mb-1">
                      Частые ошибки при тестировании
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {muscle.mmt.commonErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Рефлекторные зоны (НЛ / НВ) и нутритивная поддержка
              </h3>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <p className="text-slate-700 leading-relaxed">
                  <strong>НЛ спереди (Чапмен):</strong> {muscle.reflexes.neurolymphaticAnterior}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>НЛ сзади (Чапмен):</strong> {muscle.reflexes.neurolymphaticPosterior}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>НВ-точка (Беннетт):</strong> {muscle.reflexes.neurovascular}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Висцеро-моторная связь:</strong> {muscle.reflexes.visceromotorLink}
                </p>
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <strong>Нутриенты:</strong> {muscle.nutrients.join(' · ')}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                {muscle.clinicalNotes}
              </p>
            </section>
          </>
        )}

        {organ && (
          <section className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Висцеральная мобильность и механизм связи
              </h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>Дыхательная мобильность:</strong> {organ.visceralMobility}
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Висцеро-моторный рефлекс:</strong> {organ.visceromotorMechanism}
              </p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1.5">Клинические маркеры дисфункции</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {organ.dysfunctionSigns.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {diaphragm && (
          <section className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Анатомия и биомеханика</h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>Анатомия:</strong> {diaphragm.anatomy}
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Биомеханика:</strong> {diaphragm.biomechanics}
              </p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">Последствия дисфункции</h4>
              <p className="text-slate-600 leading-relaxed">{diaphragm.dysfunctionImpact}</p>
            </div>
          </section>
        )}

        {meridian && (
          <section className="space-y-3 text-xs">
            <AcupunctureBodyMap
              activeMeridianId={meridian.id}
              onSelectAcupoint={(ptId) => onSelectEntity({ type: 'acupoint', id: ptId })}
              compact
            />
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Ход меридиана и правило балансировки</h3>
              <p className="text-slate-700 leading-relaxed">{meridian.pathwaySummary}</p>
              <p className="text-blue-900 font-medium leading-relaxed pt-1 border-t border-slate-200">
                Правило коррекции: {meridian.balancingRule}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-1">Признаки избытка (Ян / Полнота)</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {meridian.excessSymptoms.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-1">Признаки недостатка (Инь / Пустота)</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {meridian.deficiencySymptoms.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {acupoint && (
          <section className="space-y-3 text-xs">
            <AcupunctureBodyMap
              activeMeridianId={acupoint.meridianId}
              selectedAcupointId={acupoint.id}
              onSelectAcupoint={(ptId) => onSelectEntity({ type: 'acupoint', id: ptId })}
              compact
            />
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Локализация и техника воздействия</h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>Точная локализация:</strong> {acupoint.localization}
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Анатомический ориентир:</strong> {acupoint.anatomicalLandmark}
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Глубина / метод:</strong> {acupoint.depthAndAngle}
              </p>
              <p className="text-blue-900 font-medium leading-relaxed pt-1 border-t border-slate-200">
                Балансирующий эффект: {acupoint.balancingEffect}
              </p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-1">Клинические показания</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {acupoint.indications.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {chain && (
          <section className="space-y-3 text-xs">
            <DirectoryPhotoGallery
              section="chain"
              itemId={chain.id}
              itemName={chain.name}
              defaultImageSrc={chain.imageSrc}
              defaultImageCaption={chain.imageCaption}
              defaultImageAttribution={chain.imageAttribution}
              defaultSlideLabel="Анатомия"
              photoTitlePlaceholder="Например: Оценка осанки / ход цепи"
              photoCaptionPlaceholder="Линия натяжения, фасциальный блок или триггеры..."
              vectorPresets={['Линия тяги', 'Фасциальный блок', 'Компенсация']}
            />
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Биомеханика и тестирование цепи</h3>
              <p className="text-slate-700 leading-relaxed">{chain.biomechanicalRole}</p>
              <p className="text-blue-900 font-medium leading-relaxed pt-1 border-t border-slate-200">
                Стратегия ТЛ: {chain.kinesiologyTestStrategy}
              </p>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-slate-900">Анатомическая непрерывность пути</h4>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 leading-relaxed">
                {chain.pathwaySegments.map((seg, i) => (
                  <li key={i}>{seg}</li>
                ))}
              </ol>
            </div>
            <div className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-slate-900">Постуральные признаки дисфункции</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                {chain.posturalDysfunctionSigns.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {neuro && (
          <section className="space-y-3 text-xs">
            <DirectoryPhotoGallery
              section="neuro"
              itemId={neuro.id}
              itemName={neuro.name}
              defaultImageSrc={neuro.imageSrc}
              defaultImageCaption={neuro.physiologicalMechanism}
              defaultImageAttribution={neuro.imageAttribution}
              defaultSlideLabel="Схема НС"
              photoTitlePlaceholder="Например: Схема провокации / поза при ММТ"
              photoCaptionPlaceholder="Комментарий к укладке стоя/сидя/лёжа или зоне рецепторов..."
              vectorPresets={['Рефлекторный путь', 'Рецепторная зона', 'Стимул / нагрузка']}
            />

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Физиологический механизм и связь с мышцами
              </h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>Механизм:</strong> {neuro.physiologicalMechanism}
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>Влияние на мышечный тонус в ММТ:</strong> {neuro.muscleInteraction}
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
              <h4 className="font-semibold text-blue-950">
                Положение тела при ММТ (стоя / сидя / лёжа)
              </h4>
              <p className="text-blue-900 leading-relaxed">{neuro.postureInfluence}</p>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-slate-900">
                Алгоритм диагностики нарушений НС
              </h4>
              <ol className="list-decimal pl-4 space-y-1 text-slate-700 leading-relaxed">
                {neuro.diagnosticAlgorithm.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5">
              <h4 className="font-semibold text-rose-900">Маркеры дисфункции в клинике</h4>
              <ul className="list-disc pl-4 space-y-1 text-rose-950 leading-relaxed">
                {neuro.positiveDysfunctionSigns.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ==================== 2. CROSS-REFERENCES MATRIX ==================== */}
        <section className="pt-4 border-t border-slate-200 space-y-3.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Перекрёстные взаимосвязанные структуры
            </h3>
            <p className="text-xs text-slate-500">
              Нажмите на любую связанную структуру для мгновенного перехода и перестройки схемы
            </p>
          </div>

          {/* Linked Myofascial Chains */}
          {crossRefs.chains.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                Миофасциальные цепи ({crossRefs.chains.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.chains.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'chain', id: item.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-violet-50/60 border border-slate-200 hover:border-violet-300 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.shortCode} · {item.plane}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Muscles */}
          {crossRefs.muscles.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                Связанные мышцы ({crossRefs.muscles.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.muscles.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'muscle', id: item.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.latinName} · {item.spinalSegment}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Organs */}
          {crossRefs.organs.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                Внутренние органы ({crossRefs.organs.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.organs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'organ', id: item.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{item.system}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Diaphragms */}
          {crossRefs.diaphragms.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                Остеопатические диафрагмы ({crossRefs.diaphragms.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.diaphragms.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'diaphragm', id: item.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{item.level}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Meridians */}
          {crossRefs.meridians.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                Связанные меридианы ({crossRefs.meridians.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.meridians.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'meridian', id: item.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        <span className="font-mono text-blue-700 mr-1.5">{item.code}</span>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.element} · {item.polarity} · {item.activeHours}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Balancing Acupoints */}
          {crossRefs.acupoints.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-600" />
                Акупунктурные точки балансировки ({crossRefs.acupoints.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.acupoints.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'acupoint', id: pt.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        <span className="font-mono text-rose-700 mr-1.5">{pt.code}</span>
                        {pt.chineseName} — {pt.russianName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{pt.role}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linked Neurophysiology & Posture Modules */}
          {crossRefs.neuro.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-700" />
                Нервные системы, рецепторы и позы ({crossRefs.neuro.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {crossRefs.neuro.map((np) => (
                  <button
                    key={np.id}
                    type="button"
                    onClick={() => onSelectEntity({ type: 'neuro', id: np.id })}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">{np.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{np.category}</div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ==================== 2.5. MUDRAS & NOSODES IN ATLAS ==================== */}
        <section className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Мудры и диагностические ампулы (нозоды)
              </h3>
              <p className="text-xs text-slate-500">
                Прицельные пальцевые локализаторы и провокационные ампулы для этой структуры
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {relatedMudrasAndNosodes.mudras.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <Hand className="w-3.5 h-3.5 text-blue-700" />
                    Релевантные мудры ({relatedMudrasAndNosodes.mudras.length})
                  </span>
                  {onOpenTab && (
                    <button
                      type="button"
                      onClick={() => onOpenTab('mudras')}
                      className="text-blue-700 hover:underline font-medium cursor-pointer"
                    >
                      Справочник мудр →
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {relatedMudrasAndNosodes.mudras.map((mu) => (
                    <div
                      key={mu.id}
                      className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-md"
                    >
                      <img
                        src={mu.imageSrc}
                        alt={mu.name}
                        className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 leading-snug">{mu.name}</div>
                        <div className="text-[11px] text-slate-600 leading-snug mt-0.5">
                          {mu.diagnosticRole}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedMudrasAndNosodes.nosodes.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <FlaskConical className="w-3.5 h-3.5 text-violet-700" />
                    Диагностические ампулы-нозоды ({relatedMudrasAndNosodes.nosodes.length})
                  </span>
                  {onOpenTab && (
                    <button
                      type="button"
                      onClick={() => onOpenTab('nosodes')}
                      className="text-violet-700 hover:underline font-medium cursor-pointer"
                    >
                      Справочник нозодов →
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {relatedMudrasAndNosodes.nosodes.map((no) => (
                    <div
                      key={no.id}
                      className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-md"
                    >
                      <img
                        src={no.imageSrc}
                        alt={no.name}
                        className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 leading-snug">{no.name}</div>
                        <div className="text-[11px] text-slate-600 leading-snug mt-0.5">
                          {no.positiveTestSign}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================== 3. CORRECTION PROTOCOLS ==================== */}
        {correctionSteps.length > 0 && (
          <section className="pt-4 border-t border-slate-200 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Протоколы коррекции выявленных дисфункций
              </h3>
              <p className="text-xs text-slate-500">
                Рекомендуемая последовательность мануальных, висцеральных и рефлекторных техник
              </p>
            </div>
            <CorrectionStepsList steps={correctionSteps} />
          </section>
        )}

        {/* ==================== 4. TRIAD: EMOTIONAL / ENERGETIC / CHEMICAL ==================== */}
        <section className="pt-4 border-t border-slate-200 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Коррекция по факторам: Эмоции · Энергия · Химия
            </h3>
            <p className="text-xs text-slate-500">
              Провокации и техники коррекции при эмоциональном, энергетическом или токсическом
              генезе дисфункции
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            {(
              [
                {
                  item: triadCorrections.emotional,
                  accent: 'text-rose-700',
                  border: 'border-rose-200/80 bg-rose-50/30',
                },
                {
                  item: triadCorrections.energetic,
                  accent: 'text-violet-700',
                  border: 'border-violet-200/80 bg-violet-50/30',
                },
                {
                  item: triadCorrections.chemical,
                  accent: 'text-emerald-700',
                  border: 'border-emerald-200/80 bg-emerald-50/30',
                },
              ] as const
            ).map(({ item, accent, border }) => (
              <div key={item.domain} className={`p-3.5 border rounded-lg space-y-1.5 ${border}`}>
                <div className={`font-semibold ${accent}`}>{item.domain}</div>
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Триггер:</strong> {item.triggerTheme}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Провокация ММТ:</strong>{' '}
                  {item.diagnosticProvocation}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Коррекция:</strong> {item.correctionMethod}
                </p>
                <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-200/70">
                  <strong className="text-slate-800">Опора (точки / нутриенты):</strong>{' '}
                  {item.keyPointsOrNutrients}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {imageZoom && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setImageZoom(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{imageZoom.title}</h3>
                <p className="text-xs text-slate-500">{imageZoom.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setImageZoom(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 bg-slate-50 flex justify-center">
              <img
                src={imageZoom.src}
                alt={imageZoom.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
