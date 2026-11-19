import React, { useState } from 'react';
import { SelectedEntity } from '../types/atlas';
import { ContextDirectoryTab } from './MMTContextualCorrectionPanel';
import {
  FullSessionSectionItem,
  SessionFullAnalysisResult,
} from '../utils/sessionFullAnalysis';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
} from 'lucide-react';

export type AtlasOrSectionTarget =
  | { kind: 'entity'; entity: SelectedEntity }
  | { kind: 'directory'; tab: ContextDirectoryTab; itemId?: string }
  | { kind: 'workspace'; tab: 'tests' | 'patterns' | 'protocols' };

interface SessionFullCorrectionAnalysisProps {
  analysis: SessionFullAnalysisResult;
  onNavigateTarget: (target: AtlasOrSectionTarget) => void;
}

export const SessionFullCorrectionAnalysis: React.FC<SessionFullCorrectionAnalysisProps> = ({
  analysis,
  onNavigateTarget,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    analysis.sections.forEach((sec) => {
      init[sec.sectionKey] = sec.priority === 'high' || sec.priority === 'medium';
    });
    return init;
  });

  const toggleSection = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = (open: boolean) => {
    const next: Record<string, boolean> = {};
    analysis.sections.forEach((s) => {
      next[s.sectionKey] = open;
    });
    setExpandedKeys(next);
  };

  const handleOpenItem = (item: FullSessionSectionItem) => {
    switch (item.targetType) {
      case 'atlas_muscle':
        onNavigateTarget({ kind: 'entity', entity: { type: 'muscle', id: item.targetId } });
        break;
      case 'atlas_chain':
        onNavigateTarget({ kind: 'entity', entity: { type: 'chain', id: item.targetId } });
        break;
      case 'atlas_organ':
        onNavigateTarget({ kind: 'entity', entity: { type: 'organ', id: item.targetId } });
        break;
      case 'atlas_diaphragm':
        onNavigateTarget({ kind: 'entity', entity: { type: 'diaphragm', id: item.targetId } });
        break;
      case 'atlas_meridian':
        onNavigateTarget({ kind: 'entity', entity: { type: 'meridian', id: item.targetId } });
        break;
      case 'atlas_acupoint':
        onNavigateTarget({ kind: 'entity', entity: { type: 'acupoint', id: item.targetId } });
        break;
      case 'atlas_neuro':
        onNavigateTarget({ kind: 'entity', entity: { type: 'neuro', id: item.targetId } });
        break;
      case 'dir_mudra':
        onNavigateTarget({ kind: 'directory', tab: 'mudras', itemId: item.targetId });
        break;
      case 'dir_nosode':
        onNavigateTarget({ kind: 'directory', tab: 'nosodes', itemId: item.targetId });
        break;
      case 'dir_taping':
        onNavigateTarget({ kind: 'directory', tab: 'taping', itemId: item.targetId });
        break;
      case 'dir_trust':
        onNavigateTarget({ kind: 'directory', tab: 'trusts', itemId: item.targetId });
        break;
      case 'dir_craniosacral':
        onNavigateTarget({ kind: 'directory', tab: 'craniosacral', itemId: item.targetId });
        break;
      case 'dir_protocol':
        onNavigateTarget({ kind: 'workspace', tab: 'protocols' });
        break;
      case 'tab_tests':
        onNavigateTarget({ kind: 'workspace', tab: 'tests' });
        break;
      case 'tab_patterns':
        onNavigateTarget({ kind: 'workspace', tab: 'patterns' });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Root Cause Synthesis Cards */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Интегральный анализ после ММТ</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Анализ вероятных первопричин ({analysis.rootCauses.length}) и системная карта коррекции
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Объединяет данные анамнеза, временной шкалы, карты боли (в т.ч. позы стоя/сидя/лёжа),
              углов по фото и результатов ММТ по всем 10 разделам системы.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-cyan-300">
            Клинических находок: {analysis.totalFindingsCount}
          </div>
        </div>

        {analysis.rootCauses.length === 0 ? (
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300">
            Отметьте результаты ММТ (слабость / гипертонус / время удержания / провокации) или
            заполните анамнез и фото-анализ углов, чтобы сформировались приоритетные гипотезы первопричин.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {analysis.rootCauses.map((rc) => (
              <div
                key={rc.id}
                className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 font-semibold">
                    {rc.domainLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      rc.tier === 'primary'
                        ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                        : rc.tier === 'secondary'
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {rc.tier === 'primary'
                      ? 'Первичное звено'
                      : rc.tier === 'secondary'
                        ? 'Вторичный фактор'
                        : 'Компенсация'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-start gap-1.5">
                  {rc.tier === 'primary' && (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{rc.title}</span>
                </div>
                {rc.evidence && (
                  <p className="text-slate-300 leading-relaxed">
                    <strong className="text-slate-100">Основание:</strong> {rc.evidence}
                  </p>
                )}
                <p className="text-cyan-100/90 leading-relaxed pt-1 border-t border-slate-700/80">
                  <strong>Тактика:</strong> {rc.correctionSummary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All 10 Correction Sections */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Способы коррекции по всем возможным разделам ({analysis.sections.length})</span>
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => expandAll(true)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-slate-700 font-medium cursor-pointer"
            >
              Развернуть все
            </button>
            <button
              type="button"
              onClick={() => expandAll(false)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-slate-700 font-medium cursor-pointer"
            >
              Свернуть все
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {analysis.sections.map((sec) => {
            const isOpen = Boolean(expandedKeys[sec.sectionKey]);
            return (
              <div
                key={sec.sectionKey}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(sec.sectionKey)}
                  className="w-full px-4 py-3.5 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{sec.sectionTitle}</span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                          sec.priority === 'high'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : sec.priority === 'medium'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {sec.priority === 'high'
                          ? 'Высокий приоритет'
                          : sec.priority === 'medium'
                            ? 'Рекомендуется'
                            : 'Поддержка'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {sec.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{sec.summary}</p>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {sec.items.length === 0 ? (
                      <div className="text-slate-500 col-span-2">
                        Нет прямых совпадений в текущем приёме.
                      </div>
                    ) : (
                      sec.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/40 flex flex-col justify-between gap-2.5"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                                {item.subtitle && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenItem(item)}
                                className="print:hidden inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-md shrink-0 cursor-pointer"
                              >
                                <span>Открыть</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </div>

                            <p className="text-slate-600 leading-relaxed">{item.rationale}</p>

                            {item.actionSteps.length > 0 && (
                              <ul className="space-y-1 pt-1.5 border-t border-slate-200/80 text-slate-700">
                                {item.actionSteps.map((st, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{st}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
