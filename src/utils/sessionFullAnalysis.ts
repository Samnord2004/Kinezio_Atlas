import {
  ACUPOINTS,
  CIRCADIAN_MAP,
  CLINICAL_PROTOCOLS,
  CRANIOSACRAL_PROFILES,
  DIAGNOSTIC_TESTS,
  DIAPHRAGMS,
  INTAKE_DOMAIN_META,
  MERIDIANS,
  MMT_PROVOCATION_LABELS,
  MOVEMENT_PATTERNS,
  MUDRAS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  NEURO_PROFILES,
  NOSODES,
  ORGANS,
  SYMPTOMS,
  TAPING_APPLICATIONS,
  TRUST_MANIPULATIONS,
  getTriadCorrections,
} from '../data';
import {
  Acupoint,
  CircadianPeriodId,
  ClinicalCaseProtocol,
  CraniosacralProfile,
  DiagnosticTestProfile,
  Diaphragm,
  IntakeDomain,
  MMTSessionRecord,
  Meridian,
  MovementPatternProfile,
  MudraProfile,
  Muscle,
  MyofascialChain,
  NeuroPhysiologyProfile,
  NosodeProfile,
  Organ,
  PainMapPoint,
  PostureAssessmentRecord,
  QuestionSeverity,
  QuestionnaireItem,
  TapingApplicationProfile,
  TrustManipulationProfile,
} from '../types/atlas';
import { buildPainMapRecommendations } from './painMapRecommendations';

export interface RootCauseHypothesis {
  id: string;
  tier: 'primary' | 'secondary' | 'compensatory';
  domainLabel: string;
  title: string;
  evidence: string;
  correctionSummary: string;
}

export interface FullSessionSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  rationale: string;
  actionSteps: string[];
  targetType:
    | 'atlas_muscle'
    | 'atlas_chain'
    | 'atlas_organ'
    | 'atlas_diaphragm'
    | 'atlas_meridian'
    | 'atlas_acupoint'
    | 'atlas_neuro'
    | 'tab_tests'
    | 'tab_patterns'
    | 'dir_protocol'
    | 'dir_mudra'
    | 'dir_nosode'
    | 'dir_taping'
    | 'dir_trust'
    | 'dir_craniosacral';
  targetId: string;
}

export interface FullSessionSectionBlock {
  sectionKey: string;
  sectionTitle: string;
  badgeText: string;
  priority: 'high' | 'medium' | 'support';
  summary: string;
  items: FullSessionSectionItem[];
}

export interface SessionFullAnalysisResult {
  totalFindingsCount: number;
  dysfunctionalMuscles: Array<{ muscle: Muscle; record: MMTSessionRecord }>;
  rootCauses: RootCauseHypothesis[];
  sections: FullSessionSectionBlock[];
}

export interface SessionFullAnalysisInput {
  chiefComplaint: string;
  complaintTimeWindow?: CircadianPeriodId | '';
  domainScores: Record<IntakeDomain, { score: number; maxScore: number; pct: number }>;
  positiveItems: Array<{ item: QuestionnaireItem; severity: QuestionSeverity }>;
  painMap: PainMapPoint[];
  postureAssessments: PostureAssessmentRecord[];
  muscleQueue: string[];
  mmtRecords: Record<string, MMTSessionRecord>;
}

export function buildFullSessionAnalysis(
  input: SessionFullAnalysisInput
): SessionFullAnalysisResult {
  const {
    complaintTimeWindow,
    domainScores,
    positiveItems,
    painMap,
    postureAssessments,
    muscleQueue,
    mmtRecords,
  } = input;

  const painRecs = buildPainMapRecommendations(painMap);

  // Collect dysfunctional / provoked / priority muscles
  const dysfunctionalMuscles: Array<{ muscle: Muscle; record: MMTSessionRecord }> = [];
  const activeMuscleIds = new Set<string>();
  const abnormalMuscleIds = new Set<string>();
  let hasBilateralWeakness = false;
  let hasUnilateralWeakness = false;
  let hasHypertonia = false;
  let hasFastFatigue = false;
  const activeProvocations = new Set<string>();

  muscleQueue.forEach((mId) => {
    const muscle = MUSCLES.find((m) => m.id === mId);
    if (!muscle) return;
    const rec = mmtRecords[mId];
    if (!rec) return;

    const leftWeak = rec.leftTone === 'hypotonia';
    const rightWeak = rec.rightTone === 'hypotonia';
    const leftHyper = rec.leftTone === 'hypertonia';
    const rightHyper = rec.rightTone === 'hypertonia';
    const fastFatigue =
      (rec.holdTimeLeftSec !== undefined && rec.holdTimeLeftSec < 4.0) ||
      (rec.holdTimeRightSec !== undefined && rec.holdTimeRightSec < 4.0);

    if (leftWeak && rightWeak) hasBilateralWeakness = true;
    else if (leftWeak || rightWeak) hasUnilateralWeakness = true;
    if (leftHyper || rightHyper) hasHypertonia = true;
    if (fastFatigue) hasFastFatigue = true;
    rec.provocations.forEach((p) => activeProvocations.add(p));

    if (
      leftWeak ||
      rightWeak ||
      leftHyper ||
      rightHyper ||
      fastFatigue ||
      rec.provocations.length > 0
    ) {
      dysfunctionalMuscles.push({ muscle, record: rec });
      abnormalMuscleIds.add(mId);
      activeMuscleIds.add(mId);
    }
  });

  // Also include pain map & posture priority muscles if no MMT abnormal yet or as context
  painRecs.muscleRecommendations.forEach((r) => activeMuscleIds.add(r.muscle.id));
  postureAssessments.forEach((pa) => {
    pa.priorityMuscleIds.forEach((mId) => activeMuscleIds.add(mId));
  });
  if (activeMuscleIds.size === 0) {
    muscleQueue.slice(0, 4).forEach((id) => activeMuscleIds.add(id));
  }

  // ==================== 1. ROOT CAUSE SYNTHESIS ====================
  const rootCauses: RootCauseHypothesis[] = [];

  if (painRecs.autonomicSomaticAlert) {
    rootCauses.push({
      id: 'rc-ans-sns',
      tier: 'primary',
      domainLabel: 'Вегетативная и Соматическая НС',
      title: 'Инвариантный триггер (не меняется стоя, сидя и лёжа)',
      evidence: `На карте боли отмечены зоны/триггеры (${painRecs.constantPosturePoints.length || painRecs.multiPosturePersistentMuscles.length}), сохраняющиеся независимо от позы.`,
      correctionSummary:
        'Исключить неврологический свитчинг (KI-27 + CV-8), провести височное простукивание, оценить тонус ВНС (блуждающий нерв / CV-4) и висцеральную иннервацию.',
    });
  }

  if (hasBilateralWeakness || hasFastFatigue) {
    rootCauses.push({
      id: 'rc-systemic-chemical',
      tier: 'primary',
      domainLabel: 'Химия · Висцера · Нервный ресурс',
      title: hasBilateralWeakness
        ? 'Двусторонняя гипотония по ММТ (системное угнетение)'
        : 'Быстрое истощение мышцы при удержании (< 4.0 сек)',
      evidence: dysfunctionalMuscles
        .filter(
          ({ record }) =>
            (record.leftTone === 'hypotonia' && record.rightTone === 'hypotonia') ||
            (record.holdTimeLeftSec !== undefined && record.holdTimeLeftSec < 4) ||
            (record.holdTimeRightSec !== undefined && record.holdTimeRightSec < 4)
        )
        .map(({ muscle }) => muscle.name)
        .slice(0, 4)
        .join(', '),
      correctionSummary:
        'Проверка нозодов/ампул нейтрализации, нутриентная поддержка, стимуляция НЛ-зон Чапмена (30 с) и НВ Беннетта (45 с), исключение свитчинга.',
    });
  }

  if (hasUnilateralWeakness) {
    rootCauses.push({
      id: 'rc-unilateral-struct',
      tier: 'primary',
      domainLabel: 'Структура · Сегмент · Сустав',
      title: 'Односторонняя гипотония (афферентный/корешковый или суставной блок)',
      evidence: dysfunctionalMuscles
        .filter(
          ({ record }) =>
            (record.leftTone === 'hypotonia') !== (record.rightTone === 'hypotonia')
        )
        .map(
          ({ muscle, record }) =>
            `${muscle.name} (${record.leftTone === 'hypotonia' ? 'Л↓' : 'П↓'})`
        )
        .slice(0, 4)
        .join(', '),
      correctionSummary:
        'Провести тесты допуска (Шарпа–Пурсера, де Клейна, Жилле/Ласега), выполнить адресную мобилизацию или HVLA-траст сегмента и стабилизировать тонизирующим тейпом.',
    });
  }

  const significantPostureAngles = postureAssessments.flatMap((pa) =>
    pa.angles.filter((a) => a.severity !== 'normal')
  );
  if (significantPostureAngles.length > 0) {
    const topAngles = [...significantPostureAngles]
      .sort((a, b) => b.absAngleDeg - a.absAngleDeg)
      .slice(0, 3);
    rootCauses.push({
      id: 'rc-posture-angles',
      tier: 'secondary',
      domainLabel: 'Постурология (Фото-анализ углов)',
      title: 'Угловые отклонения оси тела и конечностей по лазерному уровню',
      evidence: topAngles
        .map((a) => `${a.label}: ${a.angleDeg > 0 ? '+' : ''}${a.angleDeg}°`)
        .join(' · '),
      correctionSummary: topAngles[0].attentionVector,
    });
  }

  const topDomain = (Object.keys(domainScores) as IntakeDomain[])
    .map((d) => ({ domain: d, pct: domainScores[d].pct }))
    .sort((a, b) => b.pct - a.pct)[0];
  if (topDomain && topDomain.pct > 0) {
    rootCauses.push({
      id: 'rc-intake-triad',
      tier: 'secondary',
      domainLabel: `Триада здоровья: ${INTAKE_DOMAIN_META[topDomain.domain].label}`,
      title: `Доминирующая сфера по анамнезу (${topDomain.pct}%)`,
      evidence:
        positiveItems
          .filter((p) => p.item.domain === topDomain.domain)
          .slice(0, 2)
          .map((p) => p.item.suggestedCause)
          .join('; ') || 'Выявлена нагрузка по опроснику анамнеза.',
      correctionSummary:
        'Приоритетная коррекция по ведущему домену с ретестом ключевых индикаторных мышц.',
    });
  }

  if (complaintTimeWindow && CIRCADIAN_MAP[complaintTimeWindow]) {
    const slot = CIRCADIAN_MAP[complaintTimeWindow];
    rootCauses.push({
      id: 'rc-circadian',
      tier: 'compensatory',
      domainLabel: 'Биологические часы (ТКМ)',
      title: `Пик симптомов ${slot.practicalWindow} — меридиан «${slot.organTitle}»`,
      evidence: slot.clinicalMeaning,
      correctionSummary:
        'Оценить ассоциированные мышцы органа, точки балансировки меридиана (Правило Полдень–Полночь / Мать–Сын) и висцеральную подвижность.',
    });
  }

  if (hasHypertonia) {
    rootCauses.push({
      id: 'rc-hypertonia',
      tier: 'compensatory',
      domainLabel: 'Компенсаторный гипертонус',
      title: 'Выявлен гипертонус мышц-синергистов / антагонистов (Гипер ↑)',
      evidence: dysfunctionalMuscles
        .filter(
          ({ record }) => record.leftTone === 'hypertonia' || record.rightTone === 'hypertonia'
        )
        .map(({ muscle }) => muscle.name)
        .slice(0, 4)
        .join(', '),
      correctionSummary:
        'Не растягивать гипертоничную мышцу вслепую — найдите слабый антагонист и примените декомпрессионное тейпирование / сближение веретён.',
    });
  }

  // ==================== 2. BUILD ALL-SECTIONS CORRECTION PLAN ====================
  const sections: FullSessionSectionBlock[] = [];
  const activeMuscleObjects = MUSCLES.filter((m) => activeMuscleIds.has(m.id));
  const organIdSet = new Set<string>();
  const diaphragmIdSet = new Set<string>();
  const meridianIdSet = new Set<string>();

  activeMuscleObjects.forEach((m) => {
    m.organIds.forEach((id) => organIdSet.add(id));
    m.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
    m.meridianIds.forEach((id) => meridianIdSet.add(id));
  });
  positiveItems.forEach(({ item }) => {
    item.organIds.forEach((id) => organIdSet.add(id));
    item.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
    item.meridianIds.forEach((id) => meridianIdSet.add(id));
  });
  if (complaintTimeWindow && CIRCADIAN_MAP[complaintTimeWindow]) {
    CIRCADIAN_MAP[complaintTimeWindow].muscleIds.forEach((mId) => activeMuscleIds.add(mId));
  }

  // Section 1: Myofascial Chains & Muscles
  const matchedChains: MyofascialChain[] = MYOFASCIAL_CHAINS.filter((ch) =>
    ch.muscleIds.some((mId) => activeMuscleIds.has(mId))
  );
  sections.push({
    sectionKey: 'chains',
    sectionTitle: '1. Миофасциальные цепи (МФЦ) и целевые мышцы',
    badgeText: `Цепей: ${matchedChains.length} · Мышц: ${activeMuscleObjects.length}`,
    priority: abnormalMuscleIds.size > 0 || significantPostureAngles.length > 0 ? 'high' : 'medium',
    summary:
      'Глобальная перестройка статики и распределение фасциального натяжения по данным ММТ и углов тела.',
    items: [
      ...matchedChains.slice(0, 4).map(
        (ch): FullSessionSectionItem => ({
          id: `ch-${ch.id}`,
          title: ch.name,
          subtitle: `${ch.shortCode} · ${ch.plane} · ${ch.biomechanicalRole}`,
          rationale: `Задействованы мышцы цепи: ${ch.muscleIds
            .filter((id) => activeMuscleIds.has(id))
            .map((id) => MUSCLES.find((m) => m.id === id)?.name)
            .filter(Boolean)
            .slice(0, 3)
            .join(', ')}`,
          actionSteps: [
            `Стратегия тестирования: ${ch.kinesiologyTestStrategy}`,
            ...(ch.correctionSteps[0]
              ? [`${ch.correctionSteps[0].title}: ${ch.correctionSteps[0].technique}`]
              : [
                  'Пальпация и миофасциальный релиз по линии цепи от дистального якоря (стопа/кисть) к центру.',
                ]),
          ],
          targetType: 'atlas_chain',
          targetId: ch.id,
        })
      ),
      ...dysfunctionalMuscles.slice(0, 4).map(
        ({ muscle, record }): FullSessionSectionItem => ({
          id: `m-${muscle.id}`,
          title: `${muscle.name} (${record.leftTone === 'hypotonia' ? 'Л↓' : record.leftTone === 'hypertonia' ? 'Л↑' : 'Л ok'} / ${record.rightTone === 'hypotonia' ? 'П↓' : record.rightTone === 'hypertonia' ? 'П↑' : 'П ok'})`,
          subtitle: `${muscle.spinalSegment} · ${muscle.reflexes.visceromotorLink}`,
          rationale:
            record.provocations.length > 0
              ? `Провокации: ${record.provocations.map((p) => MMT_PROVOCATION_LABELS[p].label).join(', ')}`
              : 'Выявлено отклонение тонуса в ММТ',
          actionSteps: [
            `НЛ спереди/сзади (30 с): ${muscle.reflexes.neurolymphaticAnterior} / ${muscle.reflexes.neurolymphaticPosterior}`,
            `НВ Беннетта (45 с): ${muscle.reflexes.neurovascular}`,
            ...(muscle.correctionSteps[0]
              ? [`[${muscle.correctionSteps[0].modality}] ${muscle.correctionSteps[0].technique}`]
              : []),
          ],
          targetType: 'atlas_muscle',
          targetId: muscle.id,
        })
      ),
    ],
  });

  // Section 2: Visceral (Organs & Diaphragms)
  const matchedOrgans: Organ[] = ORGANS.filter((o) => organIdSet.has(o.id));
  const matchedDiaphragms: Diaphragm[] = DIAPHRAGMS.filter((d) => diaphragmIdSet.has(d.id));
  if (matchedDiaphragms.length === 0) {
    matchedDiaphragms.push(...DIAPHRAGMS.slice(0, 2));
  }
  sections.push({
    sectionKey: 'visceral',
    sectionTitle: '2. Висцеральная коррекция (Органы и Диафрагмы)',
    badgeText: `Органов: ${matchedOrgans.length} · Диафрагм: ${matchedDiaphragms.length}`,
    priority:
      activeProvocations.has('tl-organ') ||
      activeProvocations.has('tl-diaphragm-breath') ||
      domainScores.visceral.pct >= 25
        ? 'high'
        : 'medium',
    summary:
      'Снятие висцеро-моторного торможения: работа со связочным аппаратом органов и освобождение грудобрюшной / тазовой диафрагм.',
    items: [
      ...matchedOrgans.slice(0, 4).map(
        (o): FullSessionSectionItem => ({
          id: `org-${o.id}`,
          title: o.name,
          subtitle: `${o.system} · ${o.visceralMobility}`,
          rationale: `Ассоциированные мышцы в сеансе: ${o.muscleIds
            .map((id) => MUSCLES.find((m) => m.id === id)?.name)
            .filter(Boolean)
            .slice(0, 3)
            .join(', ')}`,
          actionSteps: o.correctionSteps.slice(0, 2).map((s) => `${s.title}: ${s.technique}`),
          targetType: 'atlas_organ',
          targetId: o.id,
        })
      ),
      ...matchedDiaphragms.slice(0, 3).map(
        (d): FullSessionSectionItem => ({
          id: `dia-${d.id}`,
          title: d.name,
          subtitle: `${d.level} · ${d.anatomy}`,
          rationale: d.dysfunctionImpact,
          actionSteps: d.correctionSteps.slice(0, 2).map((s) => `${s.title}: ${s.technique}`),
          targetType: 'atlas_diaphragm',
          targetId: d.id,
        })
      ),
    ],
  });

  // Section 3: Meridians & Acupoints
  const matchedMeridians: Meridian[] = MERIDIANS.filter((m) => meridianIdSet.has(m.id));
  const matchedAcupoints: Acupoint[] = [];
  matchedMeridians.forEach((mer) => {
    mer.acupointIds.slice(0, 2).forEach((pId) => {
      const pt = ACUPOINTS.find((a) => a.id === pId);
      if (pt && !matchedAcupoints.some((x) => x.id === pt.id)) matchedAcupoints.push(pt);
    });
  });
  sections.push({
    sectionKey: 'meridians',
    sectionTitle: '3. Меридианы и Акупунктурные точки (ТКМ)',
    badgeText: `Меридианов: ${matchedMeridians.length} · Точек: ${matchedAcupoints.length}`,
    priority:
      domainScores.energetic.pct >= 25 || Boolean(complaintTimeWindow) ? 'high' : 'support',
    summary:
      'Восстановление энергетического потока через тонизирующие / седативные точки, правило «Полдень–Полночь» и биологические часы.',
    items: matchedMeridians.slice(0, 4).map((mer) => {
      const pts = ACUPOINTS.filter((p) => mer.acupointIds.includes(p.id)).slice(0, 2);
      const pairedCode = mer.pairedMeridianId
        ? MERIDIANS.find((x) => x.id === mer.pairedMeridianId)?.code ?? mer.pairedMeridianId
        : mer.polarity;
      return {
        id: `mer-${mer.id}`,
        title: `${mer.code} · ${mer.name} (${mer.activeHours})`,
        subtitle: `Элемент: ${mer.element} · Полдень–Полночь / Пара: ${pairedCode}`,
        rationale: `${mer.balancingRule}. ${mer.pathwaySummary}`,
        actionSteps: pts.map(
          (p) => `Точка ${p.code} (${p.chineseName}): ${p.localization} — ${p.balancingEffect}`
        ),
        targetType: 'atlas_meridian',
        targetId: mer.id,
      };
    }),
  });

  // Section 4: Neurophysiology & Receptors (ANS / SNS)
  const matchedNeuro: NeuroPhysiologyProfile[] = NEURO_PROFILES.filter((np) => {
    if (
      painRecs.autonomicSomaticAlert &&
      ['neuro-somatic', 'neuro-sympathetic', 'neuro-parasympathetic', 'neuro-posture-lying-sitting-standing'].includes(np.id)
    ) {
      return true;
    }
    if (activeProvocations.has('tl-k27-switching') && np.id === 'neuro-switching-disorganization') {
      return true;
    }
    if (hasFastFatigue && np.id === 'neuro-synaptic-exhaustion') return true;
    return np.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId));
  }).slice(0, 4);

  sections.push({
    sectionKey: 'neuro',
    sectionTitle: '4. Нейрофизиология, Рецепторы и Вегетативная/Соматическая НС',
    badgeText: painRecs.autonomicSomaticAlert
      ? 'ПРИОРИТЕТ: Инвариантный триггер (ВНС/СНС)'
      : `Модулей: ${matchedNeuro.length}`,
    priority:
      painRecs.autonomicSomaticAlert ||
      activeProvocations.has('tl-k27-switching') ||
      hasFastFatigue
        ? 'high'
        : 'medium',
    summary:
      'Коррекция свитчинга (KI-27), вегетативного дисбаланса (симпатика/парасимпатика), проприоцепции веретён и органа Гольджи.',
    items: (matchedNeuro.length > 0 ? matchedNeuro : NEURO_PROFILES.slice(0, 3)).map((np) => ({
      id: `neuro-${np.id}`,
      title: np.name,
      subtitle: np.latinOrSubtitle,
      rationale: np.physiologicalMechanism,
      actionSteps: np.correctionSteps.slice(0, 2).map((s) => `${s.title}: ${s.technique}`),
      targetType: 'atlas_neuro',
      targetId: np.id,
    })),
  });

  // Section 5: Craniosacral Correction
  const matchedCranio: CraniosacralProfile[] = CRANIOSACRAL_PROFILES.filter(
    (cs) =>
      cs.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      cs.relatedMeridianIds.some((merId) => meridianIdSet.has(merId)) ||
      (painRecs.autonomicSomaticAlert &&
        ['cst-cv4-stillpoint', 'cst-jugular-vagus'].includes(cs.id))
  ).slice(0, 4);

  sections.push({
    sectionKey: 'craniosacral',
    sectionTitle: '5. Краниосакральная коррекция (КСТ)',
    badgeText: `Техник: ${matchedCranio.length || 2}`,
    priority:
      activeProvocations.has('tl-joint-cranial') ||
      painRecs.autonomicSomaticAlert ||
      significantPostureAngles.some((a) => a.targetRegion === 'cervical')
        ? 'high'
        : 'medium',
    summary:
      'Балансировка сфенобазилярного синхондроза (СБС), мембран взаимного натяжения, ВНЧС, CV-4 стилл-поинт и яремного отверстия (n. vagus).',
    items: (matchedCranio.length > 0 ? matchedCranio : CRANIOSACRAL_PROFILES.slice(0, 2)).map(
      (cs) => ({
        id: `cst-${cs.id}`,
        title: cs.name,
        subtitle: cs.anatomicalFocus,
        rationale: cs.physiologicalMechanism,
        actionSteps: cs.correctionSteps.slice(0, 2).map((s) => `${s.title}: ${s.technique}`),
        targetType: 'dir_craniosacral',
        targetId: cs.id,
      })
    ),
  });

  // Section 6: HVLA Thrusts & Safety Tests
  const matchedTrusts: TrustManipulationProfile[] = TRUST_MANIPULATIONS.filter(
    (tr) =>
      tr.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      tr.relatedDiaphragmIds.some((dId) => diaphragmIdSet.has(dId))
  ).slice(0, 4);

  const matchedSafetyTests: DiagnosticTestProfile[] = DIAGNOSTIC_TESTS.filter(
    (dt) =>
      dt.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      matchedTrusts.some((tr) => dt.relatedTrustIds.includes(tr.id))
  ).slice(0, 4);

  sections.push({
    sectionKey: 'trusts',
    sectionTitle: '6. Трасты (Мануальные манипуляции) и Обязательные тесты допуска',
    badgeText: `Трастов: ${matchedTrusts.length || 2} · Проб: ${matchedSafetyTests.length || 2}`,
    priority:
      hasUnilateralWeakness || activeProvocations.has('tl-joint-cranial') ? 'high' : 'support',
    summary:
      'Сегментарная разблокировка суставов позвоночника, КПС и стопы СТРОГО после отрицательных сосудистых и ортопедических проб допуска.',
    items: [
      ...(matchedTrusts.length > 0 ? matchedTrusts : TRUST_MANIPULATIONS.slice(0, 2)).map(
        (tr): FullSessionSectionItem => ({
          id: `tr-${tr.id}`,
          title: `${tr.name} (${tr.segmentLevel})`,
          subtitle: tr.biomechanicalIndication,
          rationale: `Обязательный допуск перед трастом: ${tr.preScreeningTests.join(', ')}`,
          actionSteps: [
            `Укладка: ${tr.patientPosition}`,
            `Импульс: ${tr.thrustVectorAndBarrier}`,
            `Критерий ретеста: ${tr.mmtRetestCriteria}`,
          ],
          targetType: 'dir_trust',
          targetId: tr.id,
        })
      ),
      ...matchedSafetyTests.slice(0, 2).map(
        (dt): FullSessionSectionItem => ({
          id: `dt-${dt.id}`,
          title: `Проба: ${dt.name}`,
          subtitle: dt.category,
          rationale: dt.clinicalPurpose,
          actionSteps: [
            `Положительный признак: ${dt.positiveDeviations[0] ?? dt.normalResult}`,
            `Противопоказания: ${dt.contraindications}`,
          ],
          targetType: 'tab_tests',
          targetId: dt.id,
        })
      ),
    ],
  });

  // Section 7: Taping
  const matchedTaping: TapingApplicationProfile[] = TAPING_APPLICATIONS.filter(
    (tp) =>
      tp.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      tp.relatedChainIds.some((cId) => matchedChains.some((ch) => ch.id === cId))
  ).slice(0, 4);

  sections.push({
    sectionKey: 'taping',
    sectionTitle: '7. Кинезиотейпирование (закрепление результата приёма)',
    badgeText: `Аппликаций: ${matchedTaping.length || 2}`,
    priority: abnormalMuscleIds.size > 0 ? 'high' : 'support',
    summary:
      'Стабилизация восстановленного тонуса на 3–5 дней (15–25% от начала к прикреплению) или фасциальная декомпрессия (10–15%).',
    items: (matchedTaping.length > 0 ? matchedTaping : TAPING_APPLICATIONS.slice(0, 2)).map(
      (tp) => ({
        id: `tp-${tp.id}`,
        title: `${tp.name} (${tp.tensionPercent})`,
        subtitle: `${tp.category} · ${tp.tapeCutForm}`,
        rationale: tp.directionRule,
        actionSteps: [
          ...tp.applicationSteps.slice(0, 2),
          `Контроль ММТ: ${tp.mmtVerification}`,
        ],
        targetType: 'dir_taping',
        targetId: tp.id,
      })
    ),
  });

  // Section 8: Nosodes & Chemistry / Nutrients
  const matchedNosodes: NosodeProfile[] = NOSODES.filter(
    (no) =>
      no.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      no.relatedOrganIds.some((oId) => organIdSet.has(oId)) ||
      no.relatedMeridianIds.some((merId) => meridianIdSet.has(merId))
  ).slice(0, 4);

  const uniqueNutrients = Array.from(
    new Set(activeMuscleObjects.flatMap((m) => m.nutrients))
  ).slice(0, 8);

  sections.push({
    sectionKey: 'nosodes',
    sectionTitle: '8. Нозоды, Биохимия и Нутриентная поддержка',
    badgeText: `Нозодов: ${matchedNosodes.length || 2} · Нутриентов: ${uniqueNutrients.length}`,
    priority:
      hasBilateralWeakness ||
      hasFastFatigue ||
      activeProvocations.has('chemical-olfactory') ||
      domainScores.chemical.pct >= 25
        ? 'high'
        : 'medium',
    summary:
      'Выявление скрытой токсической, инфекционной или метаболической нагрузки и подбор кофакторов/органопрепаратов.',
    items: (matchedNosodes.length > 0 ? matchedNosodes : NOSODES.slice(0, 2)).map((no) => ({
      id: `no-${no.id}`,
      title: `${no.name} (${no.latinOrCode})`,
      subtitle: `${no.ampouleRole} · Потенция ${no.potencyRange}`,
      rationale: no.purpose,
      actionSteps: [
        `Тест-провокация: ${no.positiveTestSign}`,
        `Нейтрализация: ${no.neutralizationCheck}`,
        ...(uniqueNutrients.length > 0
          ? [`Нутриенты по мышцам сеанса: ${uniqueNutrients.join(', ')}`]
          : []),
      ],
      targetType: 'dir_nosode',
      targetId: no.id,
    })),
  });

  // Section 9: Mudras & Emotional Correction (ESR)
  const matchedMudras: MudraProfile[] = MUDRAS.filter(
    (mu) =>
      mu.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      mu.relatedOrganIds.some((oId) => organIdSet.has(oId)) ||
      mu.relatedMeridianIds.some((merId) => meridianIdSet.has(merId))
  ).slice(0, 4);

  const esrItems = activeMuscleObjects.slice(0, 2).map((m) => {
    const triad = getTriadCorrections(
      { type: 'muscle', id: m.id },
      { muscles: [m], organs: matchedOrgans, meridians: matchedMeridians }
    );
    return `${m.name}: ${triad.emotional.correctionMethod}`;
  });

  sections.push({
    sectionKey: 'mudras',
    sectionTitle: '9. Мудры (пальцевые пробы) и Эмоциональная коррекция (ЭСР)',
    badgeText: `Мудр: ${matchedMudras.length || 2}`,
    priority:
      domainScores.emotional.pct >= 25 || activeProvocations.has('tl-esr-frontal')
        ? 'high'
        : 'support',
    summary:
      'Локализация ведущего этажа дисфункции (структура/химия/эмоции/энергия) через пальцевые моды и снятие лимбического стресса (лобные бугры ЭСР).',
    items: (matchedMudras.length > 0 ? matchedMudras : MUDRAS.slice(0, 2)).map((mu) => ({
      id: `mu-${mu.id}`,
      title: `${mu.name} (${mu.sanskritName})`,
      subtitle: `${mu.category} · ${mu.fingerPosition}`,
      rationale: mu.diagnosticRole,
      actionSteps: [
        `Проба: ${mu.positiveDiagnosticSign}`,
        ...mu.correctionSteps.slice(0, 1),
        ...(esrItems[0] ? [`ЭСР в контексте мышцы: ${esrItems[0]}`] : []),
      ],
      targetType: 'dir_mudra',
      targetId: mu.id,
    })),
  });

  // Section 10: Movement Patterns & Clinical Protocols
  const matchedPatterns: MovementPatternProfile[] = MOVEMENT_PATTERNS.filter(
    (mp) =>
      mp.relatedMuscleIds.some((mId) => activeMuscleIds.has(mId)) ||
      mp.relatedChainIds.some((cId) => matchedChains.some((ch) => ch.id === cId))
  ).slice(0, 3);

  const matchedProtocols: ClinicalCaseProtocol[] = CLINICAL_PROTOCOLS.filter((pr) => {
    if (pr.triggerEntity.type === 'muscle' && activeMuscleIds.has(pr.triggerEntity.id)) return true;
    if (pr.triggerEntity.type === 'organ' && organIdSet.has(pr.triggerEntity.id)) return true;
    if (pr.triggerEntity.type === 'diaphragm' && diaphragmIdSet.has(pr.triggerEntity.id)) return true;
    if (pr.triggerEntity.type === 'meridian' && meridianIdSet.has(pr.triggerEntity.id)) return true;
    return activeMuscleObjects.some((m) =>
      pr.chainSummary.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
    );
  }).slice(0, 2);

  sections.push({
    sectionKey: 'patterns',
    sectionTitle: '10. Паттерны движений и Комплексные протоколы',
    badgeText: `Паттернов: ${matchedPatterns.length || 2} · Протоколов: ${matchedProtocols.length || 1}`,
    priority: significantPostureAngles.length > 0 || abnormalMuscleIds.size > 0 ? 'high' : 'support',
    summary:
      'Переобучение правильного порядка включения мышц (локомоция, дыхание, походка) чтобы углы осанки и тонус закрепились в движении.',
    items: [
      ...(matchedPatterns.length > 0 ? matchedPatterns : MOVEMENT_PATTERNS.slice(0, 2)).map(
        (mp): FullSessionSectionItem => ({
          id: `mp-${mp.id}`,
          title: mp.name,
          subtitle: mp.category,
          rationale: mp.physiologicalDescription,
          actionSteps: [
            `Порядок рекрутирования: ${mp.recruitmentSequence.slice(0, 2).join(' → ')}`,
            `Реобучение: ${mp.correctionAndRetraining[0] ?? mp.testingAndMmtCheck[0] ?? ''}`,
          ],
          targetType: 'tab_patterns',
          targetId: mp.id,
        })
      ),
      ...(matchedProtocols.length > 0 ? matchedProtocols : CLINICAL_PROTOCOLS.slice(0, 1)).map(
        (pr): FullSessionSectionItem => ({
          id: `pr-${pr.id}`,
          title: `Протокол: ${pr.title}`,
          subtitle: pr.category,
          rationale: pr.primaryFinding,
          actionSteps: pr.steps.slice(0, 2).map((s) => `${s.title}: ${s.technique}`),
          targetType: 'dir_protocol',
          targetId: pr.id,
        })
      ),
    ],
  });

  // Also check if any symptom match adds insight
  void SYMPTOMS;

  const totalFindingsCount =
    positiveItems.length +
    painMap.length +
    significantPostureAngles.length +
    dysfunctionalMuscles.length;

  return {
    totalFindingsCount,
    dysfunctionalMuscles,
    rootCauses,
    sections,
  };
}
