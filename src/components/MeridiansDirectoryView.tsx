import React, { useMemo, useState } from 'react';
import { ACUPOINTS, MERIDIANS, MUSCLES, ORGANS } from '../data';
import { SelectedEntity } from '../types/atlas';
import { fuzzyMatchScore } from '../utils/fuzzySearch';
import { ArrowUpRight, Search } from 'lucide-react';
import { AcupunctureBodyMap } from './AcupunctureBodyMap';
import {
  DirectoryCustomNoteBanner,
  DirectoryEditButton,
} from './DirectoryEntryEditor';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';

interface MeridiansDirectoryViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
}

export const MeridiansDirectoryView: React.FC<MeridiansDirectoryViewProps> = ({
  onOpenInAtlas,
}) => {
  const [selectedMeridianId, setSelectedMeridianId] = useState<string>(MERIDIANS[0].id);
  const [selectedAcupointId, setSelectedAcupointId] = useState<string | null>(
    MERIDIANS[0].acupointIds[0] ?? null
  );
  const [pointQuery, setPointQuery] = useState('');

  const { apply: applyOverride, getOverride } = useDirectoryOverrides();

  const rawActiveMeridian = useMemo(
    () => MERIDIANS.find((m) => m.id === selectedMeridianId) ?? MERIDIANS[0],
    [selectedMeridianId]
  );

  const activeMeridian = useMemo(
    () => applyOverride('meridian', rawActiveMeridian),
    [applyOverride, rawActiveMeridian]
  );

  const activeMeridianOverride = getOverride('meridian', rawActiveMeridian.id);

  const meridianPoints = useMemo(() => {
    const q = pointQuery.trim();
    if (!q) {
      return ACUPOINTS.filter((pt) => pt.meridianId === activeMeridian.id);
    }
    return ACUPOINTS.map((pt) => {
      const mer = MERIDIANS.find((m) => m.id === pt.meridianId);
      const searchable = `${pt.code} ${pt.chineseName} ${pt.russianName} ${pt.role} ${pt.localization} ${pt.anatomicalLandmark} ${pt.balancingEffect} ${mer ? `${mer.code} ${mer.name}` : ''}`;
      const score = fuzzyMatchScore(q, searchable, `${pt.code} ${pt.chineseName} ${pt.russianName}`);
      return { pt, score };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.pt);
  }, [activeMeridian.id, pointQuery]);

  const handleSelectPointOnBody = (ptId: string) => {
    const pt = ACUPOINTS.find((a) => a.id === ptId);
    if (pt) {
      setPointQuery('');
      setSelectedMeridianId(pt.meridianId);
      setSelectedAcupointId(pt.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Меридианы и карта акупунктурных точек на теле, ладонях и стопах
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Тонизирующие, седативные, Юань-источники, Ло-пункты, сигнальные (Мо), сочувственные (Шу),
            а также точки ладоней/кистей (PC-8, HT-8, LU-10, LU-11, LI-3, SI-1) и стоп (SP-1, LR-1,
            ST-44, GB-41, BL-62, KI-2, KI-6). Всего точек: {ACUPOINTS.length}.
          </p>
        </div>
        <div className="relative min-w-[290px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={pointQuery}
            onChange={(e) => setPointQuery(e.target.value)}
            placeholder="Поиск точки (ST-36, PC-8, ладонь, стопа, Юань...)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Meridian Selector Column */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Меридианы и сосуды ({MERIDIANS.length})</span>
            <span>Активность</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
            {MERIDIANS.map((mer) => {
              const isSelected = mer.id === activeMeridian.id && !pointQuery.trim();
              return (
                <button
                  key={mer.id}
                  type="button"
                  onClick={() => {
                    setPointQuery('');
                    setSelectedMeridianId(mer.id);
                    setSelectedAcupointId(mer.acupointIds[0] ?? null);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      <span className="font-mono text-blue-700 mr-1.5">{mer.code}</span>
                      {mer.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {mer.element} · {mer.polarity}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                    {mer.activeHours.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Meridian Detail, Body Map & Acupoints Matrix */}
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive Acupuncture Body Chart */}
          <AcupunctureBodyMap
            activeMeridianId={pointQuery.trim() ? undefined : activeMeridian.id}
            selectedAcupointId={selectedAcupointId}
            onSelectAcupoint={handleSelectPointOnBody}
          />

          {!pointQuery.trim() && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-mono font-semibold text-blue-700">
                      {activeMeridian.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Элемент: {activeMeridian.element}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeMeridian.polarity}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Макс. активность: {activeMeridian.activeHours}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeMeridian.name}</h2>
                  <p className="text-xs italic text-slate-500 mt-0.5">
                    {activeMeridian.chineseName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <DirectoryEditButton
                    section="meridian"
                    item={rawActiveMeridian as unknown as { id: string } & Record<string, unknown>}
                    itemLabel={activeMeridian.name}
                  />
                  <button
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'meridian', id: activeMeridian.id })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Открыть в Атласе</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <DirectoryCustomNoteBanner override={activeMeridianOverride} />

              <p className="text-xs leading-relaxed text-slate-700">
                <strong>Ход меридиана:</strong> {activeMeridian.pathwaySummary}
              </p>

              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-950 leading-relaxed">
                <strong>Правило балансировки (У-Син / Ло–Юань):</strong>{' '}
                {activeMeridian.balancingRule}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <div className="font-semibold text-slate-800 mb-1">
                    Мышцы-индикаторы меридиана
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {activeMeridian.muscleIds.map((mId) => {
                      const m = MUSCLES.find((item) => item.id === mId);
                      if (!m) return null;
                      return (
                        <button
                          key={mId}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'muscle', id: mId })}
                          className="text-blue-700 hover:underline cursor-pointer text-left"
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Связанные органы</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {activeMeridian.organIds.map((oId) => {
                      const o = ORGANS.find((item) => item.id === oId);
                      if (!o) return null;
                      return (
                        <button
                          key={oId}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'organ', id: oId })}
                          className="text-emerald-700 hover:underline cursor-pointer text-left"
                        >
                          {o.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acupoints List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {pointQuery.trim()
                  ? `Результаты поиска точек (${meridianPoints.length})`
                  : `Акупунктурные точки балансировки (${meridianPoints.length})`}
              </h3>
            </div>

            {meridianPoints.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Точки по данному запросу не найдены.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {meridianPoints.map((rawPt) => {
                  const pt = applyOverride('acupoint', rawPt);
                  const ptOverride = getOverride('acupoint', rawPt.id);
                  const isHighlighted = pt.id === selectedAcupointId;
                  return (
                    <div
                      key={pt.id}
                      onClick={() => setSelectedAcupointId(pt.id)}
                      className={`p-5 space-y-2.5 transition-colors cursor-pointer ${
                        isHighlighted ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-0.5">
                            <span className="font-mono font-semibold text-rose-700">{pt.code}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-800">{pt.role}</span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">
                            {pt.chineseName} — {pt.russianName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DirectoryEditButton
                            compact
                            section="acupoint"
                            item={rawPt as unknown as { id: string } & Record<string, unknown>}
                            itemLabel={`${pt.code} ${pt.russianName}`}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInAtlas({ type: 'acupoint', id: pt.id });
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer shrink-0"
                          >
                            <span>Открыть в Атласе</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <DirectoryCustomNoteBanner override={ptOverride} />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="font-semibold text-slate-800 mb-0.5">Локализация</div>
                          <p className="text-slate-600 leading-relaxed">{pt.localization}</p>
                          <p className="text-slate-500 mt-1">
                            <strong>Ориентир:</strong> {pt.anatomicalLandmark}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="font-semibold text-slate-800 mb-0.5">
                            Балансирующий эффект и глубина
                          </div>
                          <p className="text-slate-600 leading-relaxed">{pt.balancingEffect}</p>
                          <p className="text-slate-500 mt-1">
                            <strong>Метод:</strong> {pt.depthAndAngle}
                          </p>
                        </div>
                      </div>
                    </div>
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

