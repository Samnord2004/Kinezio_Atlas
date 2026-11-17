import React, { useMemo, useState } from 'react';
import { MMTSessionRecord, Muscle } from '../types/atlas';
import { buildMMTContextualCorrections } from '../utils/mmtCorrectionRecommendations';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Layers,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

export type ContextDirectoryTab =
  | 'taping'
  | 'nosodes'
  | 'trusts'
  | 'mudras'
  | 'tests'
  | 'patterns'
  | 'craniosacral';

interface MMTContextualCorrectionPanelProps {
  muscle: Muscle;
  record: MMTSessionRecord;
  onOpenDirectoryTab?: (tab: ContextDirectoryTab, itemId?: string) => void;
  /** Optional inline weakness state controls when used in standalone MMT Directory */
  onChangeQuickTone?: (patch: Partial<MMTSessionRecord>) => void;
}

type MethodFilterTab = 'all' | 'taping' | 'nosodes' | 'trusts' | 'cranio_tests';

export const MMTContextualCorrectionPanel: React.FC<MMTContextualCorrectionPanelProps> = ({
  muscle,
  record,
  onOpenDirectoryTab,
  onChangeQuickTone,
}) => {
  const [activeFilter, setActiveFilter] = useState<MethodFilterTab>('all');
  const [expandedCardKey, setExpandedCardKey] = useState<string | null>(null);

  const plan = useMemo(
    () => buildMMTContextualCorrections(muscle, record),
    [muscle, record]
  );

  const toggleExpand = (key: string) => {
    setExpandedCardKey((prev) => (prev === key ? null : key));
  };

  const urgencyBadge =
    plan.actionUrgency === 'priority'
      ? { label: 'Приоритетная коррекция', cls: 'text-rose-700 font-semibold' }
      : plan.actionUrgency === 'attention'
        ? { label: 'Требует проверки', cls: 'text-amber-700 font-semibold' }
        : { label: 'Справочный контур', cls: 'text-slate-600 font-medium' };

  const leftWeak = record.leftTone === 'hypotonia';
  const rightWeak = record.rightTone === 'hypotonia';
  const isHyper = record.leftTone === 'hypertonia' || record.rightTone === 'hypertonia';
  const hasFatigue =
    (record.holdTimeLeftSec !== undefined && record.holdTimeLeftSec < 4.0) ||
    (record.holdTimeRightSec !== undefined && record.holdTimeRightSec < 4.0);

  return (
    <section
      aria-label="Контекстная панель методов коррекции по результатам ММТ"
      className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
    >
      {/* Header strip */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-700 inline-flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Контекстная панель коррекции
            </span>
            <span aria-hidden="true">·</span>
            <span className={urgencyBadge.cls}>{urgencyBadge.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-600">
              Л: {leftWeak ? 'Слабость ↓' : record.leftTone === 'hypertonia' ? 'Гипер ↑' : record.leftTone === 'normotonia' ? 'Норма' : '—'}
              {' / '}
              П: {rightWeak ? 'Слабость ↓' : record.rightTone === 'hypertonia' ? 'Гипер ↑' : record.rightTone === 'normotonia' ? 'Норма' : '—'}
              {hasFatigue ? ' · Срыв <4.0с' : ''}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-snug text-balance">
            {plan.headline}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{plan.subheadline}</p>
        </div>

        {/* Optional simulation / quick MMT outcome selector for MMT Directory */}
        {onChangeQuickTone && (
          <div className="flex flex-col items-start lg:items-end gap-1.5 shrink-0">
            <span className="text-[11px] font-medium text-slate-500">
              Моделировать находку ММТ:
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-[11px]">
              {(
                [
                  {
                    id: 'norm',
                    label: 'Норма',
                    active: !leftWeak && !rightWeak && !isHyper && !hasFatigue,
                    patch: {
                      leftTone: 'normotonia',
                      rightTone: 'normotonia',
                      holdTimeLeftSec: 5.0,
                      holdTimeRightSec: 5.0,
                      provocations: [],
                    },
                  },
                  {
                    id: 'uni',
                    label: 'Слабость (1 ст.)',
                    active: (leftWeak !== rightWeak) && !hasFatigue,
                    patch: {
                      leftTone: 'hypotonia',
                      rightTone: 'normotonia',
                      holdTimeLeftSec: 4.5,
                      holdTimeRightSec: 5.0,
                    },
                  },
                  {
                    id: 'bi',
                    label: 'Слабость (2 ст.)',
                    active: leftWeak && rightWeak,
                    patch: {
                      leftTone: 'hypotonia',
                      rightTone: 'hypotonia',
                      holdTimeLeftSec: 4.2,
                      holdTimeRightSec: 4.2,
                    },
                  },
                  {
                    id: 'fatigue',
                    label: 'Истощение <4с',
                    active: hasFatigue && !(leftWeak && rightWeak),
                    patch: {
                      leftTone: 'hypotonia',
                      rightTone: 'normotonia',
                      holdTimeLeftSec: 2.3,
                      holdTimeRightSec: 5.0,
                    },
                  },
                  {
                    id: 'hyper',
                    label: 'Гипертонус ↑',
                    active: isHyper && !leftWeak && !rightWeak,
                    patch: {
                      leftTone: 'hypertonia',
                      rightTone: 'normotonia',
                      holdTimeLeftSec: 5.0,
                      holdTimeRightSec: 5.0,
                    },
                  },
                ] as Array<{
                  id: string;
                  label: string;
                  active: boolean;
                  patch: Partial<MMTSessionRecord>;
                }>
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChangeQuickTone(preset.patch)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    preset.active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Priority Directives when weakness/dysfunction is active */}
      {plan.clinicalDirectives.length > 0 && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
          <div className="font-semibold text-slate-900">
            Алгоритм коррекции при текущем статусе мышцы:
          </div>
          <ul className="space-y-1 text-slate-700 leading-relaxed">
            {plan.clinicalDirectives.map((dir, i) => (
              <li key={i}>{dir}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Modality Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          {(
            [
              { id: 'all', label: 'Все методы (3 группы)' },
              { id: 'taping', label: `Тейпирование (${plan.taping.length})` },
              { id: 'nosodes', label: `Нозоды (${plan.nosodes.length})` },
              { id: 'trusts', label: `Манипуляции (${plan.trusts.length})` },
              {
                id: 'cranio_tests',
                label: `Краниосакральная и тесты (${plan.craniosacral.length + plan.tests.length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {plan.mudras.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-medium text-slate-700">Быстрая мудра-проверка:</span>
            {plan.mudras.map((mu) => (
              <button
                key={mu.id}
                type="button"
                onClick={() => onOpenDirectoryTab?.('mudras', mu.id)}
                className="text-blue-700 hover:underline font-medium cursor-pointer whitespace-nowrap"
              >
                {mu.name.split('(')[0].trim()} →
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3-Column Contextual Correction Grid: Taping / Nosodes / Manipulations */}
      {(activeFilter === 'all' ||
        activeFilter === 'taping' ||
        activeFilter === 'nosodes' ||
        activeFilter === 'trusts') && (
        <div
          className={`grid grid-cols-1 gap-4 ${
            activeFilter === 'all' ? 'xl:grid-cols-3' : 'lg:grid-cols-2'
          }`}
        >
          {/* COLUMN 1: TAPING */}
          {(activeFilter === 'all' || activeFilter === 'taping') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Layers className="w-3.5 h-3.5 text-sky-700" />
                  Кинезиотейпирование
                </span>
                {onOpenDirectoryTab && (
                  <button
                    type="button"
                    onClick={() => onOpenDirectoryTab('taping', plan.taping[0]?.item.id)}
                    className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer whitespace-nowrap"
                  >
                    Справочник →
                  </button>
                )}
              </div>

              {plan.taping.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  Специфических аппликаций не найдено — используйте лимфодренажный или мышечный вектор.
                </div>
              ) : (
                plan.taping.map(({ item, isHighlighted, priorityBadge, clinicalReason }) => {
                  const cardKey = `tape-${item.id}`;
                  const expanded = expandedCardKey === cardKey;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3.5 space-y-2 transition-colors text-xs ${
                        isHighlighted
                          ? 'bg-sky-50/50 border-sky-300'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-[11px] font-semibold text-sky-800">
                            {priorityBadge}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(cardKey)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white cursor-pointer shrink-0"
                          aria-label="Развернуть технику тейпирования"
                        >
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                        {item.tapeCutForm} · {item.tensionPercent}
                      </div>

                      <p className="text-[11px] text-slate-700 leading-relaxed">{clinicalReason}</p>

                      {expanded && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-2 text-[11px]">
                          <p className="text-slate-700">
                            <strong className="text-slate-900">Вектор:</strong> {item.directionRule}
                          </p>
                          <div className="space-y-0.5 text-slate-700">
                            <strong className="text-slate-900 block">Шаги наложения:</strong>
                            {item.applicationSteps.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>
                          <p className="text-emerald-800 font-medium">
                            Ретест: {item.mmtVerification}
                          </p>
                          <p className="text-rose-700">
                            <strong>Противопоказания:</strong> {item.contraindications}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(cardKey)}
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          {expanded ? 'Свернуть схему' : 'Пошаговая схема'}
                        </button>
                        {onOpenDirectoryTab && (
                          <button
                            type="button"
                            onClick={() => onOpenDirectoryTab('taping', item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                          >
                            <span>Открыть с фото</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* COLUMN 2: NOSODES */}
          {(activeFilter === 'all' || activeFilter === 'nosodes') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-700" />
                  Нозоды и ампулы
                </span>
                {onOpenDirectoryTab && (
                  <button
                    type="button"
                    onClick={() => onOpenDirectoryTab('nosodes', plan.nosodes[0]?.item.id)}
                    className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer whitespace-nowrap"
                  >
                    Справочник →
                  </button>
                )}
              </div>

              {plan.nosodes.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  Прямых висцеро-химических нозодов не сопоставлено — оцените Сурья-мудру и базовые ферменты/токсины.
                </div>
              ) : (
                plan.nosodes.map(({ item, isHighlighted, priorityBadge, clinicalReason }) => {
                  const cardKey = `nosode-${item.id}`;
                  const expanded = expandedCardKey === cardKey;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3.5 space-y-2 transition-colors text-xs ${
                        isHighlighted
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-[11px] font-semibold text-emerald-800">
                            {priorityBadge}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(cardKey)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white cursor-pointer shrink-0"
                          aria-label="Развернуть протокол нозода"
                        >
                          {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-600 font-mono">
                        {item.ampouleRole} · {item.potencyRange.split('(')[0].trim()}
                      </div>

                      <p className="text-[11px] text-slate-700 leading-relaxed">{clinicalReason}</p>

                      {expanded && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-2 text-[11px]">
                          <p className="text-slate-700">
                            <strong className="text-slate-900">Куда приложить:</strong>{' '}
                            {item.placementZones.join(' · ')}
                          </p>
                          <div className="space-y-0.5 text-slate-700">
                            <strong className="text-slate-900 block">Тестирование в ММТ:</strong>
                            {item.mmtDiagnosticSteps.map((s, idx) => (
                              <div key={idx}>{s}</div>
                            ))}
                          </div>
                          <p className="text-emerald-800 font-medium">
                            Нейтрализация: {item.neutralizationCheck}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(cardKey)}
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          {expanded ? 'Свернуть протокол' : 'Тест нейтрализации'}
                        </button>
                        {onOpenDirectoryTab && (
                          <button
                            type="button"
                            onClick={() => onOpenDirectoryTab('nosodes', item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                          >
                            <span>Открыть нозод</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* COLUMN 3: MANIPULATIONS / TRUSTS */}
          {(activeFilter === 'all' || activeFilter === 'trusts') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Activity className="w-3.5 h-3.5 text-amber-700" />
                  Манипуляции и трасты (HVLA)
                </span>
                {onOpenDirectoryTab && (
                  <button
                    type="button"
                    onClick={() => onOpenDirectoryTab('trusts', plan.trusts[0]?.item.id)}
                    className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer whitespace-nowrap"
                  >
                    Справочник →
                  </button>
                )}
              </div>

              {plan.trusts.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  Прямых трастовых техник не найдено — выполните мягкую миофасциальную мобилизацию.
                </div>
              ) : (
                plan.trusts.map(
                  ({ item, isHighlighted, priorityBadge, clinicalReason, safetyTests }) => {
                    const cardKey = `trust-${item.id}`;
                    const expanded = expandedCardKey === cardKey;
                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-3.5 space-y-2 transition-colors text-xs ${
                          isHighlighted
                            ? 'bg-amber-50/50 border-amber-300'
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-[11px] font-semibold text-amber-800">
                              {priorityBadge}
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {item.name}
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExpand(cardKey)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white cursor-pointer shrink-0"
                            aria-label="Развернуть технику манипуляции"
                          >
                            {expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-600 font-mono">
                          {item.segmentLevel}
                        </div>

                        <p className="text-[11px] text-slate-700 leading-relaxed">{clinicalReason}</p>

                        {safetyTests.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-rose-800">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-semibold">Тесты допуска:</span>
                            {safetyTests.map((st, idx) => (
                              <React.Fragment key={st.id}>
                                <button
                                  type="button"
                                  onClick={() => onOpenDirectoryTab?.('tests', st.id)}
                                  className="underline hover:text-rose-950 cursor-pointer text-left"
                                >
                                  {st.name.split('(')[0].trim()}
                                </button>
                                {idx < safetyTests.length - 1 && <span aria-hidden="true">·</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        )}

                        {expanded && (
                          <div className="pt-2 border-t border-slate-200/80 space-y-2 text-[11px]">
                            <p className="text-slate-700">
                              <strong className="text-slate-900">Укладка и контакт:</strong>{' '}
                              {item.patientPosition} {item.practitionerContacts}
                            </p>
                            <p className="text-slate-700">
                              <strong className="text-slate-900">Вектор и барьер:</strong>{' '}
                              {item.thrustVectorAndBarrier}
                            </p>
                            <div className="text-rose-800 space-y-0.5">
                              <strong className="inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Красные флаги (запрет траста):
                              </strong>
                              {item.redFlagsAndContraindications.map((rf, idx) => (
                                <div key={idx}>• {rf}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleExpand(cardKey)}
                            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            {expanded ? 'Свернуть технику' : 'Барьер и красные флаги'}
                          </button>
                          {onOpenDirectoryTab && (
                            <button
                              type="button"
                              onClick={() => onOpenDirectoryTab('trusts', item.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                            >
                              <span>Открыть манипуляцию</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Craniosacral, Temporal Tap & Diagnostic Tests Footer / Tab */}
      {(activeFilter === 'all' || activeFilter === 'cranio_tests') &&
        (plan.craniosacral.length > 0 || plan.tests.length > 0) && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {plan.craniosacral.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                    <Brain className="w-3.5 h-3.5 text-violet-700" />
                    Краниосакральная коррекция для этой мышцы
                  </span>
                  {onOpenDirectoryTab && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenDirectoryTab('craniosacral', plan.craniosacral[0]?.id)
                      }
                      className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer"
                    >
                      Все кранио-техники →
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {plan.craniosacral.map((cs) => (
                    <button
                      key={cs.id}
                      type="button"
                      onClick={() => onOpenDirectoryTab?.('craniosacral', cs.id)}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-violet-50/50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-slate-900 flex items-center justify-between gap-2">
                        <span>{cs.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {cs.anatomicalFocus}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {plan.tests.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                    Справочные пробы, рефлексы и височное простукивание
                  </span>
                  {onOpenDirectoryTab && (
                    <button
                      type="button"
                      onClick={() => onOpenDirectoryTab('tests', plan.tests[0]?.id)}
                      className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer"
                    >
                      Все тесты и пробы →
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {plan.tests.map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => onOpenDirectoryTab?.('tests', dt.id)}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-slate-900 flex items-center justify-between gap-2">
                        <span>{dt.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {dt.clinicalPurpose}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </section>
  );
};
