import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ACUPOINTS,
  CRANIOSACRAL_PROFILES,
  DIAPHRAGMS,
  DIAGNOSTIC_TESTS,
  MERIDIANS,
  MOVEMENT_PATTERNS,
  MUDRAS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  NEURO_PROFILES,
  NOSODES,
  ORGANS,
  STRUCTURAL_ELEMENTS,
  SYMPTOMS,
  TAPING_APPLICATIONS,
  TRUST_MANIPULATIONS,
  getEntityTypeLabel,
  matchCircadianPeriodsByText,
} from '../data';
import { CircadianPeriodId, EntityType, SelectedEntity } from '../types/atlas';
import { fuzzyMatchScore } from '../utils/fuzzySearch';
import { useDirectoryOverrides } from '../utils/directoryOverridesStore';
import { ArrowUpRight, Search, X } from 'lucide-react';

export type SearchDirectoryTab =
  | 'mudras'
  | 'nosodes'
  | 'taping'
  | 'trusts'
  | 'tests'
  | 'patterns'
  | 'craniosacral';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (entity: SelectedEntity) => void;
  onSelectSymptom?: (symptomId: string) => void;
  onSelectDirectoryTab?: (tab: SearchDirectoryTab, itemId?: string) => void;
}

interface SearchRecord {
  key: string;
  kind: 'entity' | 'symptom' | 'directory';
  entity?: SelectedEntity;
  symptomId?: string;
  directoryTab?: SearchDirectoryTab;
  directoryItemId?: string;
  circadianPeriods?: CircadianPeriodId[];
  badgeLabel: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  keywords: string;
}

const QUICK_SEARCH_CHIPS = [
  'грудопоясничная фасция',
  'ахиллово сухожилие',
  'ВНЧС',
  'крестец',
  'грудной проток',
  'височное простукивание',
  'паттерн шага',
  'с 6 до 8',
  'шум в ушах',
  'кандида',
  'тейп',
  'траст',
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
  onSelectSymptom,
  onSelectDirectoryTab,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const getTypeColor = (type: EntityType) => {
    switch (type) {
      case 'muscle':
        return 'text-blue-700';
      case 'organ':
        return 'text-emerald-700';
      case 'diaphragm':
        return 'text-amber-700';
      case 'meridian':
        return 'text-slate-700';
      case 'acupoint':
        return 'text-rose-700';
      case 'chain':
        return 'text-violet-700';
      case 'neuro':
        return 'text-cyan-700';
      case 'fascia':
        return 'text-teal-700';
      case 'tendon':
        return 'text-orange-700';
      case 'joint':
        return 'text-indigo-700';
      case 'bone':
        return 'text-stone-700';
      case 'vessel':
        return 'text-red-700';
    }
  };

  const { apply: applyOverride, overrides } = useDirectoryOverrides();

  const allRecords = useMemo<SearchRecord[]>(() => {
    const records: SearchRecord[] = [];
    SYMPTOMS.forEach((sym) =>
      records.push({
        key: `sym-${sym.id}`,
        kind: 'symptom',
        symptomId: sym.id,
        circadianPeriods: sym.timeProfile.circadianPeriods,
        badgeLabel: `Жалоба · ${sym.timeProfile.peakWindow}`,
        badgeColor: 'text-rose-700',
        title: sym.title,
        subtitle: `${sym.possibleCauses.length} прич. · ${sym.mmtPlan.length} мышц ММТ`,
        keywords: `${sym.title} ${sym.keywords.join(' ')} ${sym.timeProfile.peakWindow} ${sym.timeProfile.triggerContext} ${sym.timeProfile.organClockInterpretation} ${sym.clinicalSummary}`,
      })
    );
    MUSCLES.forEach((rawM) => {
      const m = applyOverride('muscle', rawM);
      records.push({
        key: `muscle-${m.id}`,
        kind: 'entity',
        entity: { type: 'muscle', id: m.id },
        badgeLabel: getEntityTypeLabel('muscle'),
        badgeColor: getTypeColor('muscle'),
        title: m.name,
        subtitle: `${m.latinName} · ${m.spinalSegment}`,
        keywords: `${m.name} ${m.latinName} ${m.spinalSegment} ${m.innervation} ${m.mmt.pressureVector} ${m.clinicalNotes}`,
      });
    });
    NEURO_PROFILES.forEach((rawNp) => {
      const np = applyOverride('neuro', rawNp);
      records.push({
        key: `neuro-${np.id}`,
        kind: 'entity',
        entity: { type: 'neuro', id: np.id },
        badgeLabel: `${getEntityTypeLabel('neuro')} · ${np.category}`,
        badgeColor: getTypeColor('neuro'),
        title: np.name,
        subtitle: np.latinOrSubtitle,
        keywords: `${np.name} ${np.latinOrSubtitle} ${np.category} ${np.physiologicalMechanism} ${np.muscleInteraction} ${np.postureInfluence} ${np.diagnosticAlgorithm.join(' ')} ${np.positiveDysfunctionSigns.join(' ')}`,
      });
    });
    ORGANS.forEach((rawO) => {
      const o = applyOverride('organ', rawO);
      records.push({
        key: `organ-${o.id}`,
        kind: 'entity',
        entity: { type: 'organ', id: o.id },
        badgeLabel: getEntityTypeLabel('organ'),
        badgeColor: getTypeColor('organ'),
        title: o.name,
        subtitle: `${o.latinName} · ${o.system}`,
        keywords: `${o.name} ${o.latinName} ${o.system} ${o.visceromotorMechanism}`,
      });
    });
    DIAPHRAGMS.forEach((d) =>
      records.push({
        key: `diaphragm-${d.id}`,
        kind: 'entity',
        entity: { type: 'diaphragm', id: d.id },
        badgeLabel: getEntityTypeLabel('diaphragm'),
        badgeColor: getTypeColor('diaphragm'),
        title: d.name,
        subtitle: d.level,
        keywords: `${d.name} ${d.latinName} ${d.level}`,
      })
    );
    MERIDIANS.forEach((mer) =>
      records.push({
        key: `meridian-${mer.id}`,
        kind: 'entity',
        entity: { type: 'meridian', id: mer.id },
        badgeLabel: getEntityTypeLabel('meridian'),
        badgeColor: getTypeColor('meridian'),
        title: `${mer.code} — ${mer.name}`,
        subtitle: `${mer.element} · ${mer.polarity} · ${mer.activeHours}`,
        keywords: `${mer.code} ${mer.name} ${mer.chineseName} ${mer.element}`,
      })
    );
    ACUPOINTS.forEach((pt) =>
      records.push({
        key: `acupoint-${pt.id}`,
        kind: 'entity',
        entity: { type: 'acupoint', id: pt.id },
        badgeLabel: getEntityTypeLabel('acupoint'),
        badgeColor: getTypeColor('acupoint'),
        title: `${pt.code} — ${pt.chineseName} (${pt.russianName})`,
        subtitle: pt.role,
        keywords: `${pt.code} ${pt.chineseName} ${pt.russianName} ${pt.role} ${pt.localization} ${pt.anatomicalLandmark}`,
      })
    );
    MYOFASCIAL_CHAINS.forEach((ch) =>
      records.push({
        key: `chain-${ch.id}`,
        kind: 'entity',
        entity: { type: 'chain', id: ch.id },
        badgeLabel: getEntityTypeLabel('chain'),
        badgeColor: getTypeColor('chain'),
        title: ch.name,
        subtitle: `${ch.shortCode} · ${ch.plane}`,
        keywords: `${ch.name} ${ch.englishName} ${ch.shortCode} ${ch.plane} ${ch.pathwaySegments.join(' ')}`,
      })
    );
    STRUCTURAL_ELEMENTS.forEach((rawEl) => {
      const el = applyOverride(rawEl.kind, rawEl);
      records.push({
        key: `${el.kind}-${el.id}`,
        kind: 'entity',
        entity: { type: el.kind, id: el.id },
        badgeLabel: `${getEntityTypeLabel(el.kind)} · ${el.categoryLabel}`,
        badgeColor: getTypeColor(el.kind),
        title: el.name,
        subtitle: `${el.latinName} · ${el.palpationLandmark}`,
        keywords: `${el.name} ${el.latinName} ${el.categoryLabel} ${el.anatomyAndLocation} ${el.biomechanicsAndFunction} ${el.palpationLandmark} ${el.kinesiologyTestAndProvocation} ${el.dysfunctionSigns.join(' ')}`,
      });
    });
    MUDRAS.forEach((mu) =>
      records.push({
        key: `mudra-${mu.id}`,
        kind: 'directory',
        directoryTab: 'mudras',
        directoryItemId: mu.id,
        badgeLabel: `Мудра · ${mu.category}`,
        badgeColor: 'text-indigo-700',
        title: `${mu.name} (${mu.sanskritName})`,
        subtitle: `${mu.fingerPosition} · ММТ-диагностика и коррекция`,
        keywords: `${mu.name} ${mu.sanskritName} ${mu.category} ${mu.diagnosticRole} ${mu.fingerPosition} ${mu.positiveDiagnosticSign} ${mu.correctionSteps.join(' ')}`,
      })
    );
    NOSODES.forEach((no) =>
      records.push({
        key: `nosode-${no.id}`,
        kind: 'directory',
        directoryTab: 'nosodes',
        directoryItemId: no.id,
        badgeLabel: `Нозод / Ампула · ${no.category}`,
        badgeColor: 'text-teal-700',
        title: `${no.name} (${no.latinOrCode})`,
        subtitle: no.purpose,
        keywords: `${no.name} ${no.latinOrCode} ${no.category} ${no.purpose} ${no.positiveTestSign} ${no.mmtDiagnosticSteps.join(' ')} ${no.neutralizationCheck}`,
      })
    );
    TAPING_APPLICATIONS.forEach((tp) =>
      records.push({
        key: `taping-${tp.id}`,
        kind: 'directory',
        directoryTab: 'taping',
        directoryItemId: tp.id,
        badgeLabel: `Тейпирование · ${tp.category}`,
        badgeColor: 'text-sky-700',
        title: tp.name,
        subtitle: `${tp.tapeCutForm} · натяжение ${tp.tensionPercent}`,
        keywords: `${tp.name} ${tp.regionLabel} ${tp.category} ${tp.tapeCutForm} ${tp.tensionPercent} ${tp.indications.join(' ')} ${tp.directionRule} ${tp.mmtVerification}`,
      })
    );
    TRUST_MANIPULATIONS.forEach((tr) =>
      records.push({
        key: `trust-${tr.id}`,
        kind: 'directory',
        directoryTab: 'trusts',
        directoryItemId: tr.id,
        badgeLabel: `Траст (HVLA) · ${tr.region}`,
        badgeColor: 'text-orange-700',
        title: tr.name,
        subtitle: `${tr.segmentLevel} · вектор: ${tr.thrustVectorAndBarrier}`,
        keywords: `${tr.name} ${tr.region} ${tr.segmentLevel} ${tr.biomechanicalIndication} ${tr.thrustVectorAndBarrier} ${tr.patientPosition} ${tr.mmtRetestCriteria}`,
      })
    );
    DIAGNOSTIC_TESTS.forEach((rawDt) => {
      const dt = applyOverride('tests', rawDt);
      records.push({
        key: `test-${dt.id}`,
        kind: 'directory',
        directoryTab: 'tests',
        directoryItemId: dt.id,
        badgeLabel: `Тест / Проба · ${dt.category}`,
        badgeColor: 'text-rose-700',
        title: dt.name,
        subtitle: `${dt.latinOrAlias} · ${dt.targetRegion}`,
        keywords: `${dt.name} ${dt.latinOrAlias} ${dt.category} ${dt.clinicalPurpose} ${dt.targetRegion} ${dt.physiologicalMechanism} ${dt.executionSteps.join(' ')} ${dt.positiveDeviations.join(' ')} ${dt.commonErrors.join(' ')}`,
      });
    });
    MOVEMENT_PATTERNS.forEach((rawMp) => {
      const mp = applyOverride('patterns', rawMp);
      records.push({
        key: `pattern-${mp.id}`,
        kind: 'directory',
        directoryTab: 'patterns',
        directoryItemId: mp.id,
        badgeLabel: `Паттерн движения · ${mp.category}`,
        badgeColor: 'text-violet-700',
        title: mp.name,
        subtitle: mp.subtitle,
        keywords: `${mp.name} ${mp.subtitle} ${mp.category} ${mp.physiologicalDescription} ${mp.recruitmentSequence.join(' ')} ${mp.dysfunctionSigns.join(' ')} ${mp.biomechanicalConsequences.join(' ')} ${mp.correctionAndRetraining.join(' ')}`,
      });
    });
    CRANIOSACRAL_PROFILES.forEach((rawCs) => {
      const cs = applyOverride('craniosacral', rawCs);
      records.push({
        key: `cranio-${cs.id}`,
        kind: 'directory',
        directoryTab: 'craniosacral',
        directoryItemId: cs.id,
        badgeLabel: `Краниосакральная · ${cs.category}`,
        badgeColor: 'text-indigo-700',
        title: cs.name,
        subtitle: `${cs.latinOrSubtitle} · ${cs.anatomicalFocus}`,
        keywords: `${cs.name} ${cs.latinOrSubtitle} ${cs.category} ${cs.anatomicalFocus} ${cs.physiologicalMechanism} ${cs.diagnosticAssessment.join(' ')} ${cs.dysfunctionSigns.join(' ')} ${cs.clinicalConsequences.join(' ')}`,
      });
    });
    return records;
  }, [applyOverride, overrides]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return allRecords.slice(0, 12);
    const matchedPeriods = matchCircadianPeriodsByText(q);

    return allRecords
      .map((r) => {
        let score = fuzzyMatchScore(q, r.keywords, r.title);
        if (
          matchedPeriods.length > 0 &&
          r.circadianPeriods &&
          r.circadianPeriods.some((p) => matchedPeriods.includes(p))
        ) {
          score += 120;
        }
        return { record: r, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map((item) => item.record);
  }, [allRecords, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center pt-14 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Интуитивный поиск: жалоба, опечатка, ладонь/стопа, нозод, тейп, траст, нервная система, ST-36..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              aria-label="Очистить запрос"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
            aria-label="Закрыть поиск"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intuitive Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 mr-1">Подсказки:</span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuery(chip)}
              className={`px-2 py-0.5 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                query.toLowerCase() === chip
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 space-y-1">
              <p>Ничего не найдено по запросу «{query}».</p>
              <p className="text-xs text-slate-400">
                Попробуйте ввести часть слова, симптом, время суток («с 6 до 8»), нозод («кандида»),
                мудру, тейп, траст или код точки.
              </p>
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  if (r.kind === 'symptom' && r.symptomId && onSelectSymptom) {
                    onSelectSymptom(r.symptomId);
                  } else if (r.kind === 'directory' && r.directoryTab && onSelectDirectoryTab) {
                    onSelectDirectoryTab(r.directoryTab, r.directoryItemId);
                  } else if (r.entity) {
                    onSelectEntity(r.entity);
                  }
                  onClose();
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] mb-0.5">
                    <span className={`font-medium ${r.badgeColor}`}>{r.badgeLabel}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">{r.title}</div>
                  <div className="text-xs text-slate-500 truncate">{r.subtitle}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
