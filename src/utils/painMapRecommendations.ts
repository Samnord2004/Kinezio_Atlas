import {
  ANATOMICAL_ZONES,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  ORGANS,
  SYMPTOMS,
  getCrossReferences,
  getTriadCorrections,
} from '../data';
import {
  AnatomicalSide,
  AnatomicalZoneId,
  Diaphragm,
  Meridian,
  Muscle,
  MyofascialChain,
  Organ,
  PainMapPoint,
  PainMarkerType,
  SymptomProfile,
  TriadCorrectionBundle,
} from '../types/atlas';

export const PAIN_MARKER_META: Record<
  PainMarkerType,
  {
    label: string;
    shortLabel: string;
    clinicalRole: string;
    actionHint: string;
    badgeClass: string;
    textClass: string;
    hex: string;
  }
> = {
  pain: {
    label: 'Зона боли',
    shortLabel: 'Боль',
    clinicalRole: 'Локальная или отражённая болевая зона',
    actionHint:
      'Выполните ТЛ на зону боли при тесте сильной индикаторной мышцы. Если боль отражённая — ищите первичную гипотонию в антагонистах и миофасциальной цепи.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    textClass: 'text-rose-700',
    hex: '#e11d48',
  },
  trigger_point: {
    label: 'Триггерная точка',
    shortLabel: 'Триггер',
    clinicalRole: 'Болезненное миофасциальное уплотнение (ТТ)',
    actionHint:
      'Проведите ишемическую компрессию (30–60 с) или ПИР, затем обязательно протестируйте антагонист на скрытую гипотонию и проверьте НЛ-зоны Чапмена.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    textClass: 'text-amber-700',
    hex: '#d97706',
  },
  weak_muscle: {
    label: 'Слабая мышца',
    shortLabel: 'Слабость',
    clinicalRole: 'Гипотоничная / выключенная мышца по ММТ',
    actionHint:
      'Приоритетная цель коррекции: проверьте НЛ спереди/сзади (30 с), НВ Беннетта (45 с), висцеро-моторную связь с органом, меридианную точку и нутриенты.',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    textClass: 'text-blue-700',
    hex: '#1d4ed8',
  },
};

export interface PainMuscleRecommendation {
  muscle: Muscle;
  markerTypes: PainMarkerType[];
  pointCount: number;
  maxIntensity: number;
  triad: TriadCorrectionBundle;
  organs: Organ[];
  diaphragms: Diaphragm[];
  meridians: Meridian[];
  chains: MyofascialChain[];
}

export interface PainMapRecommendations {
  counts: Record<PainMarkerType, number>;
  sideCounts: Record<AnatomicalSide, number>;
  zones: Array<{
    id: AnatomicalZoneId;
    name: string;
    classifierCode: string;
    anteriorCount: number;
    posteriorCount: number;
    count: number;
  }>;
  muscleRecommendations: PainMuscleRecommendation[];
  symptomMatches: Array<{ symptom: SymptomProfile; score: number; matchedMuscles: string[] }>;
  organs: Organ[];
  diaphragms: Diaphragm[];
  meridians: Meridian[];
  chains: MyofascialChain[];
  recommendedQueueMuscleIds: string[];
}

export function getEffectiveMuscleIdsForPoint(point: PainMapPoint): string[] {
  const ordered: string[] = [];
  if (point.primaryMuscleId) ordered.push(point.primaryMuscleId);
  point.matchedMuscleIds.forEach((id) => {
    if (!ordered.includes(id)) ordered.push(id);
  });
  return ordered;
}

export function buildPainMapRecommendations(points: PainMapPoint[]): PainMapRecommendations {
  const counts: Record<PainMarkerType, number> = {
    pain: 0,
    trigger_point: 0,
    weak_muscle: 0,
  };

  const sideCounts: Record<AnatomicalSide, number> = {
    anterior: 0,
    posterior: 0,
  };
  const zoneCounts = new Map<
    AnatomicalZoneId,
    { total: number; anterior: number; posterior: number }
  >();
  const muscleAccumulator = new Map<
    string,
    { types: Set<PainMarkerType>; count: number; maxIntensity: number }
  >();

  points.forEach((pt) => {
    counts[pt.type]++;
    sideCounts[pt.view]++;
    const zAcc = zoneCounts.get(pt.zoneId) ?? { total: 0, anterior: 0, posterior: 0 };
    zAcc.total += 1;
    if (pt.view === 'anterior') zAcc.anterior += 1;
    else zAcc.posterior += 1;
    zoneCounts.set(pt.zoneId, zAcc);

    const muscleIds = pt.primaryMuscleId
      ? [pt.primaryMuscleId, ...pt.matchedMuscleIds.slice(0, 1)]
      : pt.matchedMuscleIds.slice(0, 2);

    muscleIds.forEach((mId, idx) => {
      // Primary muscle gets full weight; secondary nearby muscles still tracked
      const existing = muscleAccumulator.get(mId) ?? {
        types: new Set<PainMarkerType>(),
        count: 0,
        maxIntensity: 0,
      };
      existing.types.add(pt.type);
      if (idx === 0) existing.count += 1;
      existing.maxIntensity = Math.max(existing.maxIntensity, pt.intensity ?? 5);
      muscleAccumulator.set(mId, existing);
    });
  });

  const zones = Array.from(zoneCounts.entries())
    .map(([id, zAcc]) => {
      const zoneMeta = ANATOMICAL_ZONES.find((z) => z.id === id);
      return {
        id,
        name: zoneMeta?.name ?? id,
        classifierCode: zoneMeta?.classifierCode ?? '',
        anteriorCount: zAcc.anterior,
        posteriorCount: zAcc.posterior,
        count: zAcc.total,
      };
    })
    .sort((a, b) => b.count - a.count);

  const organSet = new Set<string>();
  const diaphragmSet = new Set<string>();
  const meridianSet = new Set<string>();
  const chainSet = new Set<string>();

  const muscleRecommendations: PainMuscleRecommendation[] = [];

  muscleAccumulator.forEach((acc, mId) => {
    const muscle = MUSCLES.find((m) => m.id === mId);
    if (!muscle) return;

    const refs = getCrossReferences({ type: 'muscle', id: muscle.id });
    const triad = getTriadCorrections(
      { type: 'muscle', id: muscle.id },
      {
        muscles: [muscle],
        organs: refs.organs,
        meridians: refs.meridians,
      }
    );

    refs.organs.forEach((o) => organSet.add(o.id));
    refs.diaphragms.forEach((d) => diaphragmSet.add(d.id));
    refs.meridians.forEach((mer) => meridianSet.add(mer.id));
    refs.chains.forEach((ch) => chainSet.add(ch.id));

    muscleRecommendations.push({
      muscle,
      markerTypes: Array.from(acc.types),
      pointCount: Math.max(1, acc.count),
      maxIntensity: acc.maxIntensity,
      triad,
      organs: refs.organs,
      diaphragms: refs.diaphragms,
      meridians: refs.meridians,
      chains: refs.chains,
    });
  });

  // Sort: weak_muscle & trigger_point & higher intensity/count first
  muscleRecommendations.sort((a, b) => {
    const weight = (rec: PainMuscleRecommendation) =>
      rec.pointCount * 10 +
      (rec.markerTypes.includes('weak_muscle') ? 6 : 0) +
      (rec.markerTypes.includes('trigger_point') ? 4 : 0) +
      rec.maxIntensity * 0.5;
    return weight(b) - weight(a);
  });

  // Match symptoms from SYMPTOMS directory by active zones & muscles
  const activeZones = new Set(zoneCounts.keys());
  const activeMuscleSet = new Set(muscleAccumulator.keys());

  const symptomMatches =
    points.length === 0
      ? []
      : SYMPTOMS.map((sym) => {
          let score = 0;
          if (activeZones.has(sym.zone)) {
            score += 2 + (zoneCounts.get(sym.zone)?.total ?? 0);
          }
          const matchedMuscles: string[] = [];
          sym.mmtPlan.forEach((planItem) => {
            if (activeMuscleSet.has(planItem.muscleId)) {
              score += 5;
              const mName = MUSCLES.find((m) => m.id === planItem.muscleId)?.name;
              if (mName) matchedMuscles.push(mName);
            }
          });
          return { symptom: sym, score, matchedMuscles };
        })
          .filter((item) => item.score >= 3)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

  // Include muscles suggested by top matched symptoms as candidate MMT targets
  const queueIds = new Set<string>();
  muscleRecommendations.forEach((rec) => queueIds.add(rec.muscle.id));
  symptomMatches.slice(0, 3).forEach((sm) => {
    sm.symptom.mmtPlan.slice(0, 2).forEach((mp) => queueIds.add(mp.muscleId));
  });

  return {
    counts,
    sideCounts,
    zones,
    muscleRecommendations,
    symptomMatches,
    organs: ORGANS.filter((o) => organSet.has(o.id)),
    diaphragms: DIAPHRAGMS.filter((d) => diaphragmSet.has(d.id)),
    meridians: MERIDIANS.filter((m) => meridianSet.has(m.id)),
    chains: MYOFASCIAL_CHAINS.filter((c) => chainSet.has(c.id)),
    recommendedQueueMuscleIds: Array.from(queueIds),
  };
}
