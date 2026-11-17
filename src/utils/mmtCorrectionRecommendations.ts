import {
  CRANIOSACRAL_PROFILES,
  DIAGNOSTIC_TESTS,
  MUDRAS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  NOSODES,
  TAPING_APPLICATIONS,
  TRUST_MANIPULATIONS,
} from '../data';
import {
  CraniosacralProfile,
  DiagnosticTestProfile,
  MMTSessionRecord,
  MudraProfile,
  Muscle,
  NosodeProfile,
  TapingApplicationProfile,
  TrustManipulationProfile,
} from '../types/atlas';

export type MuscleWeaknessContext =
  | 'bilateral-weakness'
  | 'unilateral-weakness'
  | 'fatigue-weakness'
  | 'hypertonia'
  | 'provocation-only'
  | 'normotonia';

export interface HighlightedTapingRecommendation {
  item: TapingApplicationProfile;
  score: number;
  isHighlighted: boolean;
  priorityBadge: string;
  clinicalReason: string;
}

export interface HighlightedNosodeRecommendation {
  item: NosodeProfile;
  score: number;
  isHighlighted: boolean;
  priorityBadge: string;
  clinicalReason: string;
}

export interface HighlightedTrustRecommendation {
  item: TrustManipulationProfile;
  score: number;
  isHighlighted: boolean;
  priorityBadge: string;
  clinicalReason: string;
  safetyTests: DiagnosticTestProfile[];
}

export interface ContextualCorrectionPlan {
  context: MuscleWeaknessContext;
  headline: string;
  subheadline: string;
  actionUrgency: 'priority' | 'attention' | 'reference';
  taping: HighlightedTapingRecommendation[];
  nosodes: HighlightedNosodeRecommendation[];
  trusts: HighlightedTrustRecommendation[];
  craniosacral: CraniosacralProfile[];
  mudras: MudraProfile[];
  tests: DiagnosticTestProfile[];
  clinicalDirectives: string[];
}

export function detectMuscleWeaknessContext(record: MMTSessionRecord): MuscleWeaknessContext {
  const leftWeak = record.leftTone === 'hypotonia';
  const rightWeak = record.rightTone === 'hypotonia';
  const leftHyper = record.leftTone === 'hypertonia';
  const rightHyper = record.rightTone === 'hypertonia';

  const hasFastFatigue =
    (record.holdTimeLeftSec !== undefined && record.holdTimeLeftSec < 4.0) ||
    (record.holdTimeRightSec !== undefined && record.holdTimeRightSec < 4.0);

  if (leftWeak && rightWeak) return 'bilateral-weakness';
  if (leftWeak || rightWeak) {
    return hasFastFatigue ? 'fatigue-weakness' : 'unilateral-weakness';
  }
  if (hasFastFatigue) return 'fatigue-weakness';
  if (leftHyper || rightHyper) return 'hypertonia';
  if (record.provocations.length > 0) return 'provocation-only';
  return 'normotonia';
}

function getMuscleChains(muscleId: string): string[] {
  return MYOFASCIAL_CHAINS.filter((ch) => ch.muscleIds.includes(muscleId)).map((ch) => ch.id);
}

function getZoneFallbacksForTrust(muscle: Muscle): string[] {
  switch (muscle.zone) {
    case 'head':
      return ['trust-cervical-c0-c1'];
    case 'cervical':
      return ['trust-cervical-c0-c1', 'trust-cervical-c3-c7', 'trust-cervicothoracic-c7-th1'];
    case 'upper-limb':
      return ['trust-cervical-c3-c7', 'trust-cervicothoracic-c7-th1'];
    case 'thoracic':
      return ['trust-thoracic-anterior-pistol', 'trust-cervicothoracic-c7-th1'];
    case 'lumbar':
      return ['trust-lumbar-roll-l1-l5', 'trust-sij-pelvis-manipulation'];
    case 'lower-limb':
      return ['trust-sij-pelvis-manipulation', 'trust-talonavicular-foot-thrust'];
  }
}

function getZoneFallbacksForTaping(muscle: Muscle): string[] {
  switch (muscle.zone) {
    case 'upper-limb':
    case 'cervical':
      return ['tape-shoulder-deltoid-support', 'tape-lymphatic-fan-drainage'];
    case 'thoracic':
    case 'lumbar':
      return ['tape-lumbar-erector-decompress', 'tape-lymphatic-fan-drainage'];
    case 'lower-limb':
      return [
        'tape-knee-patella-stabilization',
        'tape-achilles-calf-decompression',
        'tape-ankle-foot-arch-support',
      ];
    case 'head':
      return ['tape-lymphatic-fan-drainage'];
  }
}

export function buildMMTContextualCorrections(
  muscle: Muscle,
  record: MMTSessionRecord
): ContextualCorrectionPlan {
  const context = detectMuscleWeaknessContext(record);
  const chainIds = new Set(getMuscleChains(muscle.id));
  const organIds = new Set(muscle.organIds);
  const meridianIds = new Set(muscle.meridianIds);
  const diaphragmIds = new Set(muscle.diaphragmIds);

  const hasChemicalProvocation = record.provocations.includes('chemical-olfactory');
  const hasOrganProvocation = record.provocations.includes('tl-organ');
  const hasJointCranialProvocation = record.provocations.includes('tl-joint-cranial');
  const hasSwitching = record.provocations.includes('tl-k27-switching');
  const hasEsr = record.provocations.includes('tl-esr-frontal');

  const isAnyWeakness =
    context === 'bilateral-weakness' ||
    context === 'unilateral-weakness' ||
    context === 'fatigue-weakness';

  // 1. Score & Highlight TAPING APPLICATIONS
  const zoneTapeFallbacks = new Set(getZoneFallbacksForTaping(muscle));
  const taping: HighlightedTapingRecommendation[] = TAPING_APPLICATIONS.map((tp) => {
    let score = 0;
    const directMuscle = tp.relatedMuscleIds.includes(muscle.id);
    const sharedChain = tp.relatedChainIds.some((cId) => chainIds.has(cId));
    const zoneFallback = zoneTapeFallbacks.has(tp.id);

    if (directMuscle) score += 60;
    if (sharedChain) score += 30;
    if (zoneFallback) score += 20;

    const isToning = tp.category === 'Мышечная (поддержка / тонизация)';
    const isDecompress = tp.category === 'Мышечная (декомпрессия / расслабление)';
    const isJoint = tp.category === 'Связочно-суставная';
    const isLymph = tp.category === 'Лимфодренажная и фасциальная';

    if (isAnyWeakness && (isToning || isJoint)) score += 35;
    if (context === 'hypertonia' && (isDecompress || isLymph)) score += 40;
    if (record.provocations.includes('nl-nv-reflex') && isLymph) score += 35;

    let clinicalReason = 'Региональная поддержка мышцы и миофасциальной цепи после коррекции.';
    let priorityBadge = 'Совместимо по зоне';

    if (directMuscle && isAnyWeakness) {
      priorityBadge = 'Приоритет при слабости · Тонизация/опора';
      clinicalReason = `Прямое показание для «${muscle.name}»: накладывается от проксимального начала к прикреплению с натяжением ${tp.tensionPercent} для закрепления тонуса на 3–5 дней.`;
    } else if (directMuscle && context === 'hypertonia') {
      priorityBadge = 'Приоритет при гипертонусе · Декомпрессия';
      clinicalReason = `Снимает избыточную фасциальную тягу над «${muscle.name}» (якоря 0%, рабочая зона на растянутой ткани).`;
    } else if (directMuscle) {
      priorityBadge = 'Прямая аппликация для мышцы';
      clinicalReason = `Тейпирование «${muscle.name}» для стабилизации результата ММТ (${tp.tapeCutForm}).`;
    } else if (sharedChain || zoneFallback) {
      priorityBadge = isAnyWeakness ? 'Стабилизация цепи при слабости' : 'Региональный вариант';
      clinicalReason = `Поддержка сопряжённой миофасциальной цепи и смежных стабилизаторов после ретеста.`;
    }

    return {
      item: tp,
      score,
      isHighlighted: (directMuscle || sharedChain || zoneFallback) && score >= 45,
      priorityBadge,
      clinicalReason,
    };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 2. Score & Highlight NOSODES / AMPOULES
  const nosodes: HighlightedNosodeRecommendation[] = NOSODES.map((no) => {
    let score = 0;
    const directMuscle = no.relatedMuscleIds.includes(muscle.id);
    const sharedOrgan = no.relatedOrganIds.some((oId) => organIds.has(oId));
    const sharedMeridian = no.relatedMeridianIds.some((mId) => meridianIds.has(mId));

    if (directMuscle) score += 55;
    if (sharedOrgan) score += 45;
    if (sharedMeridian) score += 25;

    const isMetabolicCorrector =
      no.ampouleRole === 'Корректор / органопрепарат (тестирует ресурс)';

    if (context === 'bilateral-weakness') score += 40;
    if (context === 'fatigue-weakness' && isMetabolicCorrector) score += 45;
    if (hasChemicalProvocation || hasOrganProvocation) score += 35;

    let priorityBadge = 'Висцеро-химический скрининг';
    let clinicalReason = no.purpose;

    if (context === 'bilateral-weakness') {
      priorityBadge = 'Высокий приоритет · Двусторонняя слабость';
      clinicalReason = `Двустороннее падение «${muscle.name}» часто связано с токсическим, инфекционным или ферментным фактором ассоциированного органа. Проверьте ампулу и тест нейтрализации.`;
    } else if (context === 'fatigue-weakness') {
      priorityBadge = isMetabolicCorrector
        ? 'Приоритет · Быстрое истощение (<4с)'
        : 'Провокация синаптической усталости';
      clinicalReason = `Истощение тонуса на таймере указывает на метаболический/медиаторный дефицит или хроническую нагрузку (${no.latinOrCode}).`;
    } else if (directMuscle || sharedOrgan) {
      priorityBadge = 'Связь через орган / меридиан';
      clinicalReason = `Ассоциация с органами «${muscle.reflexes.visceromotorLink}» — тестируйте в контуре для выявления скрытого химического триггера.`;
    }

    return {
      item: no,
      score,
      isHighlighted:
        (directMuscle || sharedOrgan || context === 'bilateral-weakness' || hasChemicalProvocation) &&
        score >= 50,
      priorityBadge,
      clinicalReason,
    };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // 3. Score & Highlight MANIPULATIONS / HVLA TRUSTS
  const zoneTrustFallbacks = new Set(getZoneFallbacksForTrust(muscle));
  const trusts: HighlightedTrustRecommendation[] = TRUST_MANIPULATIONS.map((tr) => {
    let score = 0;
    const directMuscle = tr.relatedMuscleIds.includes(muscle.id);
    const sharedDiaphragm = tr.relatedDiaphragmIds.some((dId) => diaphragmIds.has(dId));
    const zoneFallback = zoneTrustFallbacks.has(tr.id);

    if (directMuscle) score += 60;
    if (sharedDiaphragm) score += 25;
    if (zoneFallback) score += 20;

    if (context === 'unilateral-weakness') score += 45;
    if (context === 'hypertonia') score += 30;
    if (hasJointCranialProvocation) score += 40;
    if (context === 'bilateral-weakness') score += 10;

    const safetyTests = DIAGNOSTIC_TESTS.filter(
      (dt) =>
        dt.relatedTrustIds.includes(tr.id) ||
        dt.relatedMuscleIds.some((mId) => tr.relatedMuscleIds.includes(mId))
    ).slice(0, 3);

    let priorityBadge = 'Сегментарный доступ';
    let clinicalReason = tr.biomechanicalIndication;

    if (context === 'unilateral-weakness' && (directMuscle || zoneFallback)) {
      priorityBadge = 'Приоритет · Односторонняя слабость (миотом/КПС)';
      clinicalReason = `Односторонняя гипотония «${muscle.name}» (${muscle.spinalSegment}) требует исключения фасеточного блока / блока КПС или предплюсны после прохождения тестов допуска.`;
    } else if (hasJointCranialProvocation) {
      priorityBadge = 'Подтверждено суставной провокацией (ТЛ)';
      clinicalReason = `Положительная суставная ТЛ указывает на целесообразность мобилизации или траста «${tr.segmentLevel}» с последующим ретестом.`;
    } else if (directMuscle) {
      priorityBadge = 'Прямая связь с сегментом мышцы';
      clinicalReason = `Восстановление биомеханики сегмента «${tr.segmentLevel}» снимает афферентное торможение мышцы.`;
    }

    return {
      item: tr,
      score,
      isHighlighted: (directMuscle || zoneFallback) && score >= 55,
      priorityBadge,
      clinicalReason,
      safetyTests,
    };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 4. Related Craniosacral corrections (including Temporal Tap)
  const craniosacral = CRANIOSACRAL_PROFILES.filter(
    (cs) =>
      cs.relatedMuscleIds.includes(muscle.id) ||
      cs.relatedDiaphragmIds.some((dId) => diaphragmIds.has(dId)) ||
      cs.relatedMeridianIds.some((mId) => meridianIds.has(mId))
  ).slice(0, 3);

  // 5. Related Mudras
  const mudras = MUDRAS.filter(
    (mu) =>
      mu.relatedMuscleIds.includes(muscle.id) ||
      mu.relatedOrganIds.some((oId) => organIds.has(oId)) ||
      mu.relatedMeridianIds.some((mId) => meridianIds.has(mId))
  ).slice(0, 3);

  // 6. Safety & Diagnostic Tests relevant to this muscle & trust
  const testIdsSeen = new Set<string>();
  const tests: DiagnosticTestProfile[] = [];
  const pushTest = (t: DiagnosticTestProfile) => {
    if (!testIdsSeen.has(t.id)) {
      testIdsSeen.add(t.id);
      tests.push(t);
    }
  };
  DIAGNOSTIC_TESTS.filter(
    (dt) =>
      dt.relatedMuscleIds.includes(muscle.id) ||
      dt.relatedDiaphragmIds.some((dId) => diaphragmIds.has(dId))
  ).forEach(pushTest);
  if (hasEsr || context === 'bilateral-weakness') {
    const tTap = DIAGNOSTIC_TESTS.find((dt) => dt.id === 'test-temporal-tap');
    if (tTap) pushTest(tTap);
  }
  if (hasSwitching || context === 'bilateral-weakness' || context === 'hypertonia') {
    const k27 = DIAGNOSTIC_TESTS.find((dt) => dt.id === 'test-k27-switching-spindle');
    if (k27) pushTest(k27);
  }

  // 7. Headline, subheadline & step-by-step clinical directives
  let headline = 'Контекстная карта коррекции для мышцы';
  let subheadline =
    'Выберите отклонение тонуса (слабость слева/справа, истощение по таймеру или гипертонус), чтобы подсветить приоритетные методы.';
  let actionUrgency: 'priority' | 'attention' | 'reference' = 'reference';
  const clinicalDirectives: string[] = [];

  if (context === 'bilateral-weakness') {
    actionUrgency = 'priority';
    headline = 'Выявлена двусторонняя слабость (Гипо ↓ L + R) — приоритет системного и висцерально-химического звена';
    subheadline =
      'Двустороннее снижение тонуса редко бывает чисто локальной травмой: проверьте переключение KI-27, ампулы-нозоды, орган-ассоциацию и краниосакральный уровень перед локальным тейпированием.';
    clinicalDirectives.push(
      '1. Исключите переключение (ТЛ KI-27 + пупок CV-8) и проверьте Сурья/Притхви-мудру для поиска ведущего этажа.',
      `2. Протестируйте нозоды и органопрепараты по связи «${muscle.reflexes.visceromotorLink}» с тестом нейтрализации.`,
      '3. При восстановлении силы выполните декомпрессию краниосакральной оси / диафрагм и закрепите тонизирующим кинезиотейпом.'
    );
  } else if (context === 'unilateral-weakness') {
    actionUrgency = 'priority';
    const weakSideText =
      record.leftTone === 'hypotonia' ? 'слева (L)' : 'справа (R)';
    headline = `Выявлена односторонняя слабость ${weakSideText} — приоритет структуры, манипуляции и тейпирования`;
    subheadline =
      `Односторонняя гипотония «${muscle.name}» (${muscle.spinalSegment}) чаще всего связана с суставным/корешковым блоком, туннельным ущемлением нерва или локальным триггером/НЛ.`;
    clinicalDirectives.push(
      `1. Проведите обязательные тесты допуска для сегмента «${muscle.spinalSegment}» (проба де Клейна / Шарпа–Пурсера для шеи, Ласега / Жилле для поясницы и таза).`,
      '2. Выполните прицельную мобилизацию или HVLA-траст (при отсутствии красных флагов) + разгрузку сухожильного аппарата Гольджи / НЛ-зон.',
      '3. После возврата нормотонии ≥5 с зафиксируйте эффект тонизирующим кинезиотейпом (15–25% от начала к прикреплению).'
    );
  } else if (context === 'fatigue-weakness') {
    actionUrgency = 'priority';
    headline = 'Выявлено быстрое истощение тонуса (< 4.0 сек по таймеру) — дефицит ресурса / синаптическая усталость';
    subheadline =
      'Мышца стартует, но «плывёт» при удержании: приоритетно проверьте нозоды/корректоры, нутриенты, рефлексы Чапмена (НЛ) и Беннетта (НВ).';
    clinicalDirectives.push(
      '1. Подберите ампулу-корректор или проверьте провокационный нозод (вирусный/грибковый/надпочечники) с замером времени удержания до ≥5.0 с.',
      '2. Простимулируйте НЛ-зоны (30 с) и удерживайте НВ-точки Беннетта (45 с) для восстановления перфузии.',
      '3. Наложите поддерживающий кинезиотейп на период адаптации.'
    );
  } else if (context === 'hypertonia') {
    actionUrgency = 'attention';
    headline = 'Выявлен гипертонус / гиперфасилитация (Гипер ↑) — требуется декомпрессия и снятие компенсации';
    subheadline =
      'Гипертоничная мышца часто компенсирует слабость своего антагониста или перегрузку симпатической НС.';
    clinicalDirectives.push(
      '1. Проверьте сближение мышечных веретён (торможение) и оцените симметричного антагониста.',
      '2. Примените декомпрессионное тейпирование (10–15% на растянутую ткань), краниосакральный релиз CV-4 / ЭСР или мягкий траст заблокированного сегмента.'
    );
  } else if (context === 'provocation-only') {
    actionUrgency = 'attention';
    headline = 'Тонус реагирует на провокации / ТЛ — скрытая компенсированная дисфункция';
    subheadline =
      'В покое мышца держит, но срывается при терапевтической локализации: подсвечены методы по активным тегам провокаций.';
    clinicalDirectives.push(
      '1. Устраните первичный фактор провокации (ТЛ органа, шва черепа, рубца или химический триггер) и проверьте исчезновение срыва на ретесте.'
    );
  }

  return {
    context,
    headline,
    subheadline,
    actionUrgency,
    taping,
    nosodes,
    trusts,
    craniosacral,
    mudras,
    tests: tests.slice(0, 4),
    clinicalDirectives,
  };
}
