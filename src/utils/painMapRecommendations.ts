import {
  ANATOMICAL_ZONES,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  NEURO_PROFILES,
  ORGANS,
  SYMPTOMS,
  getCrossReferences,
  getTriadCorrections,
} from '../data';
import {
  AnatomicalSide,
  AnatomicalZoneId,
  BodyPosturePosition,
  Diaphragm,
  Meridian,
  Muscle,
  MyofascialChain,
  NeuroPhysiologyProfile,
  Organ,
  PainMapPoint,
  PainMarkerType,
  SymptomProfile,
  TriadCorrectionBundle,
  TriggerPostureBehavior,
} from '../types/atlas';

export const BODY_POSTURE_META: Record<
  BodyPosturePosition,
  { label: string; shortLabel: string; clinicalRole: string }
> = {
  standing: {
    label: 'Стоя',
    shortLabel: 'Стоя',
    clinicalRole: 'Осевая гравитационная нагрузка и восходящая цепь (стопа → таз → позвоночник)',
  },
  sitting: {
    label: 'Сидя',
    shortLabel: 'Сидя',
    clinicalRole: 'Исключена компенсация стоп/коленей: доминирует таз, поясница, шея и ВНЧС',
  },
  lying: {
    label: 'Лёжа',
    shortLabel: 'Лёжа',
    clinicalRole: 'Разгрузка осевой гравитации: проявляются висцеральные, краниальные и сосудисто-нервные триггеры',
  },
};

export const TRIGGER_BEHAVIOR_META: Record<
  TriggerPostureBehavior,
  { label: string; shortLabel: string; description: string }
> = {
  varies_with_posture: {
    label: 'Меняется в позах (стоя / сидя / лёжа)',
    shortLabel: 'Зависит от позы',
    description:
      'Триггер исчезает или ослабевает при смене позы — ведущий компонент биомеханический (стопа, суставной блок, фасциальная цепь).',
  },
  constant_all_postures: {
    label: 'НЕ меняется стоя, сидя и лёжа',
    shortLabel: 'Неизменный (НС!)',
    description:
      'Постоянство триггера независимо от гравитации (стоя/сидя/лёжа) — клинический маркер нарушения вегетативной и соматической нервной системы!',
  },
};

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
      'Выполните ТЛ на зону боли при тесте сильной индикаторной мышцы. Проверьте изменение боли стоя, сидя и лёжа.',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    textClass: 'text-rose-700',
    hex: '#e11d48',
  },
  trigger_point: {
    label: 'Триггерная точка',
    shortLabel: 'Триггер',
    clinicalRole: 'Болезненное миофасциальное уплотнение (ТТ)',
    actionHint:
      'Оцените реакцию триггера при переходе стоя → сидя → лёжа. Если триггер НЕ меняется в 3 позах — приоритетно тестируйте вегетативную и соматическую НС!',
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
  postureCounts: Record<BodyPosturePosition | 'unspecified', number>;
  constantPosturePoints: PainMapPoint[];
  multiPosturePersistentMuscles: string[];
  autonomicSomaticAlert: boolean;
  recommendedNeuroProfiles: NeuroPhysiologyProfile[];
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

  const postureCounts: Record<BodyPosturePosition | 'unspecified', number> = {
    standing: 0,
    sitting: 0,
    lying: 0,
    unspecified: 0,
  };

  const posturesByMuscleOrZone = new Map<string, Set<BodyPosturePosition>>();
  const constantPosturePoints: PainMapPoint[] = [];

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
    if (pt.posture) {
      postureCounts[pt.posture]++;
      const sigKey = pt.primaryMuscleId ?? pt.zoneId;
      const set = posturesByMuscleOrZone.get(sigKey) ?? new Set<BodyPosturePosition>();
      set.add(pt.posture);
      posturesByMuscleOrZone.set(sigKey, set);
    } else {
      postureCounts.unspecified++;
    }

    if (pt.triggerBehavior === 'constant_all_postures') {
      constantPosturePoints.push(pt);
    }

    const zAcc = zoneCounts.get(pt.zoneId) ?? { total: 0, anterior: 0, posterior: 0 };
    zAcc.total += 1;
    if (pt.view === 'anterior') zAcc.anterior += 1;
    else zAcc.posterior += 1;
    zoneCounts.set(pt.zoneId, zAcc);

    const muscleIds = pt.primaryMuscleId
      ? [pt.primaryMuscleId, ...pt.matchedMuscleIds.slice(0, 1)]
      : pt.matchedMuscleIds.slice(0, 2);

    muscleIds.forEach((mId, idx) => {
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

  // Also detect if same muscle/zone appears across all 3 postures (standing, sitting, lying)
  const multiPosturePersistentMuscles: string[] = [];
  posturesByMuscleOrZone.forEach((pSet, sigKey) => {
    if (pSet.size >= 3) {
      multiPosturePersistentMuscles.push(sigKey);
    }
  });

  const autonomicSomaticAlert =
    constantPosturePoints.length > 0 || multiPosturePersistentMuscles.length > 0;

  const recommendedNeuroProfiles = autonomicSomaticAlert
    ? NEURO_PROFILES.filter((np) =>
        [
          'neuro-somatic',
          'neuro-sympathetic',
          'neuro-parasympathetic',
          'neuro-posture-lying-sitting-standing',
          'neuro-switching-disorganization',
        ].includes(np.id)
      )
    : [];

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

  muscleRecommendations.sort((a, b) => {
    const weight = (rec: PainMuscleRecommendation) =>
      rec.pointCount * 10 +
      (rec.markerTypes.includes('weak_muscle') ? 6 : 0) +
      (rec.markerTypes.includes('trigger_point') ? 4 : 0) +
      rec.maxIntensity * 0.5;
    return weight(b) - weight(a);
  });

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

  const queueIds = new Set<string>();
  muscleRecommendations.forEach((rec) => queueIds.add(rec.muscle.id));
  symptomMatches.slice(0, 3).forEach((sm) => {
    sm.symptom.mmtPlan.slice(0, 2).forEach((mp) => queueIds.add(mp.muscleId));
  });

  return {
    counts,
    sideCounts,
    postureCounts,
    constantPosturePoints,
    multiPosturePersistentMuscles,
    autonomicSomaticAlert,
    recommendedNeuroProfiles,
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
