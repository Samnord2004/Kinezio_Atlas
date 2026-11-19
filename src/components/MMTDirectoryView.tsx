import React, { useEffect, useMemo, useState } from 'react';
import {
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_SIDE_META,
  ANATOMICAL_ZONES,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  ORGANS,
  getMuscleAnatomyImage,
  getMuscleSide,
} from '../data';
import {
  AnatomicalSide,
  AnatomicalZoneId,
  MMTSessionRecord,
  SelectedEntity,
} from '../types/atlas';
import { fuzzyMatches } from '../utils/fuzzySearch';
import { ArrowUpRight, Layers, Search } from 'lucide-react';
import { MMTSchematicDiagram } from './MMTSchematicDiagram';
import { DirectoryPhotoGallery } from './DirectoryPhotoGallery';
import { MMTHoldTimer } from './MMTHoldTimer';
import {
  ContextDirectoryTab,
  MMTContextualCorrectionPanel,
} from './MMTContextualCorrectionPanel';
import { AnatomicalZoneClassifierPanel } from './AnatomicalZoneClassifierPanel';
import {
  DirectoryCustomNoteBanner,
  DirectoryEditButton,
} from './DirectoryEntryEditor';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';

interface MMTDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onOpenDirectoryTab?: (tab: ContextDirectoryTab, itemId?: string) => void;
}

export const MMTDirectoryView: React.FC<MMTDirectoryViewProps> = ({
  onOpenInAtlas,
  onOpenDirectoryTab,
}) => {
  const [zoneFilter, setZoneFilter] = useState<AnatomicalZoneId | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<AnatomicalSide | 'all'>('all');
  const [showClassifier, setShowClassifier] = useState(false);
  const [query, setQuery] = useState('');
  const [activeMuscleId, setActiveMuscleId] = useState<string>(MUSCLES[0].id);
  const [visibleLimit, setVisibleLimit] = useState(80);
  const [simRecordMap, setSimRecordMap] = useState<Record<string, MMTSessionRecord>>({});

  useEffect(() => {
    setVisibleLimit(80);
  }, [zoneFilter, sideFilter, query]);

  const filteredMuscles = useMemo(() => {
    return MUSCLES.filter((m) => {
      if (zoneFilter !== 'all' && m.zone !== zoneFilter) return false;
      if (sideFilter !== 'all' && getMuscleSide(m) !== sideFilter) return false;
      if (!query.trim()) return true;
      const orgNames = m.organIds
        .map((id) => ORGANS.find((o) => o.id === id)?.name ?? '')
        .join(' ');
      return fuzzyMatches(
        query,
        `${m.name} ${m.latinName} ${m.spinalSegment} ${m.innervation} ${m.function} ${orgNames}`
      );
    });
  }, [zoneFilter, sideFilter, query]);

  const anteriorCount = useMemo(
    () =>
      MUSCLES.filter(
        (m) => (zoneFilter === 'all' || m.zone === zoneFilter) && getMuscleSide(m) === 'anterior'
      ).length,
    [zoneFilter]
  );
  const posteriorCount = useMemo(
    () =>
      MUSCLES.filter(
        (m) => (zoneFilter === 'all' || m.zone === zoneFilter) && getMuscleSide(m) === 'posterior'
      ).length,
    [zoneFilter]
  );

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveMuscle = useMemo(() => {
    return (
      filteredMuscles.find((m) => m.id === activeMuscleId) ??
      filteredMuscles[0] ??
      MUSCLES[0]
    );
  }, [filteredMuscles, activeMuscleId]);

  const activeMuscle = useMemo(
    () => applyOverride('muscle', rawActiveMuscle),
    [applyOverride, rawActiveMuscle]
  );

  const activeMuscleOverride = getOverride('muscle', rawActiveMuscle.id);

  const activeMuscleAnatomy = useMemo(
    () => getMuscleAnatomyImage(activeMuscle),
    [activeMuscle]
  );

  const activeZoneMeta = useMemo(
    () => ANATOMICAL_ZONES.find((z) => z.id === activeMuscle.zone),
    [activeMuscle.zone]
  );

  const activeSimRecord = useMemo<MMTSessionRecord>(() => {
    const existing = simRecordMap[activeMuscle.id];
    if (existing) return existing;
    return {
      muscleId: activeMuscle.id,
      leftTone: 'hypotonia',
      rightTone: 'normotonia',
      provocations: [],
      correctionApplied: false,
      retestNormotonia: false,
      notes: '',
    };
  }, [simRecordMap, activeMuscle.id]);

  const updateSimRecord = (patch: Partial<MMTSessionRecord>) => {
    setSimRecordMap((prev) => ({
      ...prev,
      [activeMuscle.id]: {
        ...(prev[activeMuscle.id] ?? {
          muscleId: activeMuscle.id,
          leftTone: 'hypotonia',
          rightTone: 'normotonia',
          provocations: [],
          correctionApplied: false,
          retestNormotonia: false,
          notes: '',
        }),
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Directory Header & Zone Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Справочник мануально-мышечного тестирования (ММТ)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Стандартизированные позиции тестирования, векторы давления, рефлексы Чапмена/Беннетта и
            висцеральные связи по зонам.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Мышца, латынь, нерв или орган..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Classifier Controls: Surface (Anterior / Posterior) + Division Zones */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Поверхность тела:</span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: `Все (${anteriorCount + posteriorCount})` },
                  { id: 'anterior', label: `Передняя поверхность (${anteriorCount})` },
                  { id: 'posterior', label: `Задняя поверхность (${posteriorCount})` },
                ] as const
              ).map((sideOpt) => (
                <button
                  key={sideOpt.id}
                  type="button"
                  onClick={() => setSideFilter(sideOpt.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    sideFilter === sideOpt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sideOpt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowClassifier((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showClassifier
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-slate-50 text-blue-700 border-slate-200 hover:bg-blue-50/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showClassifier ? 'Скрыть классификатор TA' : 'Классификатор зон (Передние / Задние)'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setZoneFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              zoneFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Все зоны ({MUSCLES.filter((m) => sideFilter === 'all' || getMuscleSide(m) === sideFilter).length})
          </button>

          {ANATOMICAL_DIVISIONS.map((div) => (
            <div
              key={div.id}
              className="flex flex-wrap items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <span className="text-[11px] font-semibold text-slate-500 mr-1">
                {div.shortTitle}:
              </span>
              {ANATOMICAL_ZONES.filter((z) => z.division === div.id).map((z) => {
                const count = MUSCLES.filter(
                  (m) =>
                    m.zone === z.id && (sideFilter === 'all' || getMuscleSide(m) === sideFilter)
                ).length;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setZoneFilter(z.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      zoneFilter === z.id
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {z.shortName} ({count})
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showClassifier && (
        <AnatomicalZoneClassifierPanel
          activeZoneId={zoneFilter}
          activeSide={sideFilter}
          onSelectFilter={(zId, side) => {
            setZoneFilter(zId);
            if (side) setSideFilter(side);
            setShowClassifier(false);
          }}
          onSelectEntity={(ent) => {
            if (ent.type === 'muscle') {
              setActiveMuscleId(ent.id);
              setZoneFilter('all');
              setSideFilter('all');
              setShowClassifier(false);
            } else {
              onOpenInAtlas(ent);
            }
          }}
          onClose={() => setShowClassifier(false)}
        />
      )}

      {/* Split Directory Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Table / List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Мышцы ({filteredMuscles.length})</span>
            <span>Сегмент / Орган</span>
          </div>

          {filteredMuscles.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              По вашему запросу мышц не найдено. Попробуйте изменить фильтр.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {filteredMuscles.slice(0, visibleLimit).map((m) => {
                const isSelected = activeMuscle.id === m.id;
                const linkedOrgans = m.organIds
                  .map((id) => ORGANS.find((o) => o.id === id)?.name.split('(')[0].trim())
                  .filter(Boolean)
                  .join(', ');
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMuscleId(m.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {m.name}
                      </div>
                      <div className="text-xs italic text-slate-500 truncate">{m.latinName}</div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate">
                        {ANATOMICAL_ZONES.find((z) => z.id === m.zone)?.shortName} ·{' '}
                        {ANATOMICAL_SIDE_META[getMuscleSide(m)].shortLabel}
                        {linkedOrgans ? ` · ${linkedOrgans}` : ''}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0 mt-0.5">
                      {m.spinalSegment.split('·')[0].trim()}
                    </span>
                  </button>
                );
              })}
              {filteredMuscles.length > visibleLimit && (
                <div className="p-3 bg-slate-50/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((v) => v + 100)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Показать ещё {Math.min(100, filteredMuscles.length - visibleLimit)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(filteredMuscles.length)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                  >
                    Показать все ({filteredMuscles.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Detailed MMT Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono font-semibold text-blue-700">
                  {activeZoneMeta?.classifierCode}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeZoneMeta?.name}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">
                  {ANATOMICAL_SIDE_META[getMuscleSide(activeMuscle)].label}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{activeMuscle.spinalSegment}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{activeMuscle.name}</h2>
              <p className="text-xs italic text-slate-500 mt-0.5">{activeMuscle.latinName}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DirectoryEditButton
                section="muscle"
                item={rawActiveMuscle as unknown as { id: string } & Record<string, unknown>}
                itemLabel={activeMuscle.name}
              />
              <button
                type="button"
                onClick={() => onOpenInAtlas({ type: 'muscle', id: activeMuscle.id })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Показать на схеме и связи</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <DirectoryCustomNoteBanner override={activeMuscleOverride} />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs items-stretch">
            <div className="md:col-span-5">
              <DirectoryPhotoGallery
                section="muscle"
                itemId={activeMuscle.id}
                itemName={activeMuscle.name}
                defaultImageSrc={activeMuscleAnatomy.src}
                defaultImageCaption={activeMuscleAnatomy.caption}
                defaultImageAttribution={activeMuscleAnatomy.attribution}
                defaultSlideLabel="Анатомия"
                photoTitlePlaceholder="Например: Вектор тяги / триггерная зона"
                photoCaptionPlaceholder="Анатомический ориентир, положение конечности при ММТ..."
                vectorPresets={['Вектор давления ММТ', 'Направление волокон', 'Триггерная точка']}
              />
            </div>

            <div className="md:col-span-7 flex flex-col justify-between gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 mb-1">Анатомическое крепление</div>
                <p className="text-slate-600 leading-relaxed mb-1">
                  <strong>Начало:</strong> {activeMuscle.origin}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Прикрепление:</strong> {activeMuscle.insertion}
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 mb-1">Иннервация и функция</div>
                <p className="text-slate-600 leading-relaxed mb-1">
                  <strong>Нерв:</strong> {activeMuscle.innervation}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Функция:</strong> {activeMuscle.function}
                </p>
              </div>
            </div>
          </div>

          {/* MMT Protocol */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Методика проведения ММТ
            </h3>
            <MMTSchematicDiagram muscle={activeMuscle} />
            <MMTHoldTimer
              muscleId={activeMuscle.id}
              leftHoldSec={activeSimRecord.holdTimeLeftSec}
              rightHoldSec={activeSimRecord.holdTimeRightSec}
              onSaveHoldTime={(side, seconds) => {
                if (seconds === undefined) {
                  updateSimRecord(
                    side === 'left'
                      ? { holdTimeLeftSec: undefined }
                      : { holdTimeRightSec: undefined }
                  );
                  return;
                }
                updateSimRecord(
                  side === 'left'
                    ? {
                        holdTimeLeftSec: seconds,
                        leftTone: seconds < 4.0 ? 'hypotonia' : 'normotonia',
                      }
                    : {
                        holdTimeRightSec: seconds,
                        rightTone: seconds < 4.0 ? 'hypotonia' : 'normotonia',
                      }
                );
              }}
            />
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
              <div className="p-3.5">
                <span className="font-semibold text-slate-800 block mb-0.5">
                  1. Положение пациента
                </span>
                <p className="text-slate-600 leading-relaxed">{activeMuscle.mmt.patientPosition}</p>
              </div>
              <div className="p-3.5">
                <span className="font-semibold text-slate-800 block mb-0.5">
                  2. Позиция врача и стабилизация
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {activeMuscle.mmt.practitionerPosition} {activeMuscle.mmt.stabilization}
                </p>
              </div>
              <div className="p-3.5">
                <span className="font-semibold text-slate-800 block mb-0.5">
                  3. Тестовое движение и вектор сопротивления
                </span>
                <p className="text-slate-600 leading-relaxed mb-1">{activeMuscle.mmt.testAction}</p>
                <p className="text-blue-800 font-medium leading-relaxed">
                  Вектор давления: {activeMuscle.mmt.pressureVector}
                </p>
              </div>
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
                <div>
                  <span className="font-semibold text-emerald-700 block mb-0.5">Нормотония</span>
                  <p className="text-slate-600 leading-relaxed">{activeMuscle.mmt.normotoniaSign}</p>
                </div>
                <div>
                  <span className="font-semibold text-rose-700 block mb-0.5">
                    Гипотония / Нарушение
                  </span>
                  <p className="text-slate-600 leading-relaxed">{activeMuscle.mmt.hypotoniaSign}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Contextual Correction Panel */}
          <MMTContextualCorrectionPanel
            muscle={activeMuscle}
            record={activeSimRecord}
            onOpenDirectoryTab={onOpenDirectoryTab}
            onChangeQuickTone={updateSimRecord}
          />

          {/* Cross-Links Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Миофасц. цепи</div>
              <div className="space-y-1">
                {MYOFASCIAL_CHAINS.filter((ch) =>
                  ch.muscleIds.includes(activeMuscle.id)
                ).map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'chain', id: ch.id })}
                    className="block text-left text-violet-700 hover:underline cursor-pointer"
                  >
                    {ch.name.split('(')[0].trim()} →
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Органы</div>
              <div className="space-y-1">
                {activeMuscle.organIds.map((oId) => {
                  const org = ORGANS.find((o) => o.id === oId);
                  if (!org) return null;
                  return (
                    <button
                      key={oId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'organ', id: oId })}
                      className="block text-left text-emerald-700 hover:underline cursor-pointer"
                    >
                      {org.name} →
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Диафрагмы</div>
              <div className="space-y-1">
                {activeMuscle.diaphragmIds.map((dId) => {
                  const diaph = DIAPHRAGMS.find((d) => d.id === dId);
                  if (!diaph) return null;
                  return (
                    <button
                      key={dId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'diaphragm', id: dId })}
                      className="block text-left text-amber-700 hover:underline cursor-pointer"
                    >
                      {diaph.name.split('(')[0].trim()} →
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Меридианы</div>
              <div className="space-y-1">
                {activeMuscle.meridianIds.map((mId) => {
                  const mer = MERIDIANS.find((m) => m.id === mId);
                  if (!mer) return null;
                  return (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => onOpenInAtlas({ type: 'meridian', id: mId })}
                      className="block text-left text-blue-700 hover:underline cursor-pointer"
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

    </div>
  );
};
