import {
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_SIDE_META,
  ANATOMICAL_ZONES,
  getMuscleSide,
  getOrganSide,
  getSymptomSide,
} from './zones';
import { MUSCLES as BASE_MUSCLES } from './muscles';
import { EXPANDED_MUSCLES } from './musclesExpanded';
import { COMPLETE_HUMAN_MUSCLES } from './musclesComplete';
import { DIAPHRAGMS, ORGANS } from './organsAndDiaphragms';
import { ACUPOINTS, MERIDIANS } from './meridiansAndPoints';
import { CLINICAL_PROTOCOLS } from './protocols';
import { MYOFASCIAL_CHAINS } from './myofascialChains';
import { SYMPTOMS } from './symptoms';
import { TRIAD_PILLARS_REFERENCE, getTriadCorrections } from './triadCorrections';
import {
  CIRCADIAN_MAP,
  CIRCADIAN_SLOTS,
  matchCircadianPeriodsByText,
} from './circadianClock';
import {
  INTAKE_DOMAIN_META,
  INTAKE_QUESTIONS,
  MMT_PROVOCATION_LABELS,
} from './questionnaire';
import { LEARNING_CURRICULUM } from './learningCurriculum';
import { MUDRAS } from './mudras';
import { NOSODES } from './nosodes';
import { TAPING_APPLICATIONS } from './taping';
import { TRUST_MANIPULATIONS } from './trustManipulations';
import { NEURO_PROFILES } from './neurophysiology';
import { DIAGNOSTIC_TESTS } from './diagnosticTests';
import { MOVEMENT_PATTERNS } from './movementPatterns';
import { CRANIOSACRAL_PROFILES } from './craniosacral';
import { getMuscleAnatomyImage } from './muscleAnatomyImages';
import {
  BONES,
  FASCIAS,
  JOINTS,
  STRUCTURAL_ELEMENTS,
  STRUCTURAL_KIND_LABELS,
  TENDONS,
  VESSELS,
  findStructuralElement,
} from './structuralSystems';
import {
  Acupoint,
  Diaphragm,
  EntityType,
  Meridian,
  MudraProfile,
  Muscle,
  MyofascialChain,
  NeuroPhysiologyProfile,
  NosodeProfile,
  Organ,
  SelectedEntity,
  StructuralElementKind,
  StructuralElementProfile,
} from '../types/atlas';

const MUSCLES: Muscle[] = [...BASE_MUSCLES, ...EXPANDED_MUSCLES, ...COMPLETE_HUMAN_MUSCLES];

export {
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_SIDE_META,
  ANATOMICAL_ZONES,
  getMuscleSide,
  getOrganSide,
  getSymptomSide,
  MUSCLES,
  ORGANS,
  DIAPHRAGMS,
  MERIDIANS,
  ACUPOINTS,
  CLINICAL_PROTOCOLS,
  MYOFASCIAL_CHAINS,
  SYMPTOMS,
  TRIAD_PILLARS_REFERENCE,
  getTriadCorrections,
  CIRCADIAN_SLOTS,
  CIRCADIAN_MAP,
  matchCircadianPeriodsByText,
  INTAKE_QUESTIONS,
  INTAKE_DOMAIN_META,
  MMT_PROVOCATION_LABELS,
  LEARNING_CURRICULUM,
  MUDRAS,
  NOSODES,
  TAPING_APPLICATIONS,
  TRUST_MANIPULATIONS,
  NEURO_PROFILES,
  DIAGNOSTIC_TESTS,
  MOVEMENT_PATTERNS,
  CRANIOSACRAL_PROFILES,
  getMuscleAnatomyImage,
  FASCIAS,
  TENDONS,
  JOINTS,
  BONES,
  VESSELS,
  STRUCTURAL_ELEMENTS,
  STRUCTURAL_KIND_LABELS,
  findStructuralElement,
};

export interface CrossReferenceBundle {
  muscles: Muscle[];
  organs: Organ[];
  diaphragms: Diaphragm[];
  meridians: Meridian[];
  acupoints: Acupoint[];
  chains: MyofascialChain[];
  neuro: NeuroPhysiologyProfile[];
  fascias: StructuralElementProfile[];
  tendons: StructuralElementProfile[];
  joints: StructuralElementProfile[];
  bones: StructuralElementProfile[];
  vessels: StructuralElementProfile[];
}

export function getEntityTitle(entity: SelectedEntity): string {
  switch (entity.type) {
    case 'muscle':
      return MUSCLES.find((m) => m.id === entity.id)?.name ?? 'Мышца';
    case 'organ':
      return ORGANS.find((o) => o.id === entity.id)?.name ?? 'Орган';
    case 'diaphragm':
      return DIAPHRAGMS.find((d) => d.id === entity.id)?.name ?? 'Диафрагма';
    case 'meridian':
      return MERIDIANS.find((m) => m.id === entity.id)?.name ?? 'Меридиан';
    case 'acupoint': {
      const pt = ACUPOINTS.find((a) => a.id === entity.id);
      return pt ? `${pt.code} (${pt.chineseName})` : 'Точка';
    }
    case 'chain':
      return MYOFASCIAL_CHAINS.find((c) => c.id === entity.id)?.name ?? 'Миофасциальная цепь';
    case 'neuro':
      return NEURO_PROFILES.find((n) => n.id === entity.id)?.name ?? 'Нервная система и позы';
    case 'fascia':
    case 'tendon':
    case 'joint':
    case 'bone':
    case 'vessel':
      return (
        findStructuralElement(entity.type, entity.id)?.name ??
        STRUCTURAL_KIND_LABELS[entity.type].singular
      );
  }
}

export function getEntityTypeLabel(type: EntityType): string {
  switch (type) {
    case 'muscle':
      return 'Мышца';
    case 'organ':
      return 'Орган';
    case 'diaphragm':
      return 'Диафрагма';
    case 'meridian':
      return 'Меридиан';
    case 'acupoint':
      return 'Акупунктурная точка';
    case 'chain':
      return 'Миофасциальная цепь';
    case 'neuro':
      return 'Нервная система и позы';
    case 'fascia':
      return 'Фасция';
    case 'tendon':
      return 'Сухожилие';
    case 'joint':
      return 'Сустав';
    case 'bone':
      return 'Кость / Ориентир';
    case 'vessel':
      return 'Сосуд / Коллектор';
  }
}

const STRUCTURAL_TYPES = new Set<StructuralElementKind>([
  'fascia',
  'tendon',
  'joint',
  'bone',
  'vessel',
]);

export function getCrossReferences(entity: SelectedEntity): CrossReferenceBundle {
  const muscleIdSet = new Set<string>();
  const organIdSet = new Set<string>();
  const diaphragmIdSet = new Set<string>();
  const meridianIdSet = new Set<string>();
  const acupointIdSet = new Set<string>();
  const chainIdSet = new Set<string>();
  const neuroIdSet = new Set<string>();
  const structuralIdSet = new Set<string>();

  if (entity.type === 'muscle') {
    const m = MUSCLES.find((item) => item.id === entity.id);
    if (m) {
      m.organIds.forEach((id) => organIdSet.add(id));
      m.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
      m.meridianIds.forEach((id) => meridianIdSet.add(id));
    }
    ORGANS.forEach((o) => {
      if (o.muscleIds.includes(entity.id)) organIdSet.add(o.id);
    });
    DIAPHRAGMS.forEach((d) => {
      if (d.muscleIds.includes(entity.id)) diaphragmIdSet.add(d.id);
    });
    MERIDIANS.forEach((mer) => {
      if (mer.muscleIds.includes(entity.id)) meridianIdSet.add(mer.id);
    });
    MYOFASCIAL_CHAINS.forEach((ch) => {
      if (ch.muscleIds.includes(entity.id)) chainIdSet.add(ch.id);
    });
    NEURO_PROFILES.forEach((np) => {
      if (np.relatedMuscleIds.includes(entity.id)) neuroIdSet.add(np.id);
    });
    STRUCTURAL_ELEMENTS.forEach((el) => {
      if (el.relatedMuscleIds.includes(entity.id)) structuralIdSet.add(el.id);
    });
  } else if (entity.type === 'organ') {
    const o = ORGANS.find((item) => item.id === entity.id);
    if (o) {
      o.muscleIds.forEach((id) => muscleIdSet.add(id));
      o.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
      o.meridianIds.forEach((id) => meridianIdSet.add(id));
    }
    MUSCLES.forEach((m) => {
      if (m.organIds.includes(entity.id)) muscleIdSet.add(m.id);
    });
    DIAPHRAGMS.forEach((d) => {
      if (d.organIds.includes(entity.id)) diaphragmIdSet.add(d.id);
    });
    MERIDIANS.forEach((mer) => {
      if (mer.organIds.includes(entity.id)) meridianIdSet.add(mer.id);
    });
    MYOFASCIAL_CHAINS.forEach((ch) => {
      if (ch.organIds.includes(entity.id)) chainIdSet.add(ch.id);
    });
    STRUCTURAL_ELEMENTS.forEach((el) => {
      if (el.relatedOrganIds.includes(entity.id)) structuralIdSet.add(el.id);
    });
  } else if (entity.type === 'diaphragm') {
    const d = DIAPHRAGMS.find((item) => item.id === entity.id);
    if (d) {
      d.muscleIds.forEach((id) => muscleIdSet.add(id));
      d.organIds.forEach((id) => organIdSet.add(id));
      d.meridianIds.forEach((id) => meridianIdSet.add(id));
    }
    MUSCLES.forEach((m) => {
      if (m.diaphragmIds.includes(entity.id)) muscleIdSet.add(m.id);
    });
    ORGANS.forEach((o) => {
      if (o.diaphragmIds.includes(entity.id)) organIdSet.add(o.id);
    });
    MERIDIANS.forEach((mer) => {
      if (mer.diaphragmIds.includes(entity.id)) meridianIdSet.add(mer.id);
    });
    MYOFASCIAL_CHAINS.forEach((ch) => {
      if (ch.diaphragmIds.includes(entity.id)) chainIdSet.add(ch.id);
    });
    NEURO_PROFILES.forEach((np) => {
      if (np.relatedDiaphragmIds.includes(entity.id)) neuroIdSet.add(np.id);
    });
    STRUCTURAL_ELEMENTS.forEach((el) => {
      if (el.relatedDiaphragmIds.includes(entity.id)) structuralIdSet.add(el.id);
    });
  } else if (entity.type === 'meridian') {
    const mer = MERIDIANS.find((item) => item.id === entity.id);
    if (mer) {
      mer.muscleIds.forEach((id) => muscleIdSet.add(id));
      mer.organIds.forEach((id) => organIdSet.add(id));
      mer.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
      mer.acupointIds.forEach((id) => acupointIdSet.add(id));
    }
    MUSCLES.forEach((m) => {
      if (m.meridianIds.includes(entity.id)) muscleIdSet.add(m.id);
    });
    ORGANS.forEach((o) => {
      if (o.meridianIds.includes(entity.id)) organIdSet.add(o.id);
    });
    DIAPHRAGMS.forEach((d) => {
      if (d.meridianIds.includes(entity.id)) diaphragmIdSet.add(d.id);
    });
    ACUPOINTS.forEach((pt) => {
      if (pt.meridianId === entity.id) acupointIdSet.add(pt.id);
    });
    MYOFASCIAL_CHAINS.forEach((ch) => {
      if (ch.meridianIds.includes(entity.id)) chainIdSet.add(ch.id);
    });
    NEURO_PROFILES.forEach((np) => {
      if (np.relatedMeridianIds.includes(entity.id)) neuroIdSet.add(np.id);
    });
    STRUCTURAL_ELEMENTS.forEach((el) => {
      if (el.relatedMeridianIds.includes(entity.id)) structuralIdSet.add(el.id);
    });
  } else if (entity.type === 'acupoint') {
    const pt = ACUPOINTS.find((item) => item.id === entity.id);
    if (pt) {
      meridianIdSet.add(pt.meridianId);
      const mer = MERIDIANS.find((m) => m.id === pt.meridianId);
      if (mer) {
        mer.muscleIds.forEach((id) => muscleIdSet.add(id));
        mer.organIds.forEach((id) => organIdSet.add(id));
        mer.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
        mer.acupointIds.forEach((id) => {
          if (id !== pt.id) acupointIdSet.add(id);
        });
      }
      MYOFASCIAL_CHAINS.forEach((ch) => {
        if (ch.meridianIds.includes(pt.meridianId)) chainIdSet.add(ch.id);
      });
      STRUCTURAL_ELEMENTS.forEach((el) => {
        if (el.relatedMeridianIds.includes(pt.meridianId)) structuralIdSet.add(el.id);
      });
    }
  } else if (entity.type === 'chain') {
    const ch = MYOFASCIAL_CHAINS.find((item) => item.id === entity.id);
    if (ch) {
      ch.muscleIds.forEach((id) => muscleIdSet.add(id));
      ch.organIds.forEach((id) => organIdSet.add(id));
      ch.diaphragmIds.forEach((id) => diaphragmIdSet.add(id));
      ch.meridianIds.forEach((id) => meridianIdSet.add(id));
    }
    STRUCTURAL_ELEMENTS.forEach((el) => {
      if (el.relatedChainIds.includes(entity.id)) structuralIdSet.add(el.id);
    });
  } else if (entity.type === 'neuro') {
    const np = NEURO_PROFILES.find((item) => item.id === entity.id);
    if (np) {
      np.relatedMuscleIds.forEach((id) => muscleIdSet.add(id));
      np.relatedDiaphragmIds.forEach((id) => diaphragmIdSet.add(id));
      np.relatedMeridianIds.forEach((id) => meridianIdSet.add(id));
    }
  } else if (STRUCTURAL_TYPES.has(entity.type as StructuralElementKind)) {
    const el = findStructuralElement(entity.type as StructuralElementKind, entity.id);
    if (el) {
      el.relatedMuscleIds.forEach((id) => muscleIdSet.add(id));
      el.relatedOrganIds.forEach((id) => organIdSet.add(id));
      el.relatedDiaphragmIds.forEach((id) => diaphragmIdSet.add(id));
      el.relatedMeridianIds.forEach((id) => meridianIdSet.add(id));
      el.relatedChainIds.forEach((id) => chainIdSet.add(id));

      // Surface highest-affinity sibling structural elements sharing muscles (capped per kind for clarity)
      const scoredByKind = new Map<StructuralElementKind, Array<{ id: string; score: number }>>();
      STRUCTURAL_ELEMENTS.forEach((other) => {
        if (other.id === el.id) return;
        const sharedCount = other.relatedMuscleIds.filter((mid) =>
          el.relatedMuscleIds.includes(mid)
        ).length;
        if (sharedCount === 0) return;
        const score = sharedCount * 3 + (other.zone === el.zone ? 4 : 0) + (other.side === el.side ? 1 : 0);
        const bucket = scoredByKind.get(other.kind) ?? [];
        bucket.push({ id: other.id, score });
        scoredByKind.set(other.kind, bucket);
      });
      scoredByKind.forEach((bucket) => {
        bucket
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .forEach((entry) => structuralIdSet.add(entry.id));
      });
    }
  }

  // Always populate balancing acupoints from linked meridians if not directly selected
  if (entity.type !== 'meridian' && entity.type !== 'acupoint') {
    meridianIdSet.forEach((merId) => {
      const mer = MERIDIANS.find((m) => m.id === merId);
      mer?.acupointIds.forEach((ptId) => acupointIdSet.add(ptId));
    });
  }

  // Surface relevant neurophysiology modules via linked meridians/diaphragms if not directly selected
  if (entity.type !== 'neuro') {
    NEURO_PROFILES.forEach((np) => {
      const sharesMeridian = np.relatedMeridianIds.some((id) => meridianIdSet.has(id));
      const sharesDiaphragm = np.relatedDiaphragmIds.some((id) => diaphragmIdSet.has(id));
      if (sharesMeridian || sharesDiaphragm) {
        neuroIdSet.add(np.id);
      }
    });
  }

  return {
    muscles: MUSCLES.filter((m) => muscleIdSet.has(m.id)),
    organs: ORGANS.filter((o) => organIdSet.has(o.id)),
    diaphragms: DIAPHRAGMS.filter((d) => diaphragmIdSet.has(d.id)),
    meridians: MERIDIANS.filter((m) => meridianIdSet.has(m.id)),
    acupoints: ACUPOINTS.filter((p) => acupointIdSet.has(p.id)),
    chains: MYOFASCIAL_CHAINS.filter((c) => chainIdSet.has(c.id)),
    neuro: NEURO_PROFILES.filter((n) => neuroIdSet.has(n.id)),
    fascias: FASCIAS.filter((f) => structuralIdSet.has(f.id)),
    tendons: TENDONS.filter((t) => structuralIdSet.has(t.id)),
    joints: JOINTS.filter((j) => structuralIdSet.has(j.id)),
    bones: BONES.filter((b) => structuralIdSet.has(b.id)),
    vessels: VESSELS.filter((v) => structuralIdSet.has(v.id)),
  };
}

export function getRelatedMudrasAndNosodes(
  entity: SelectedEntity,
  refs?: CrossReferenceBundle
): {
  mudras: MudraProfile[];
  nosodes: NosodeProfile[];
} {
  const bundle = refs ?? getCrossReferences(entity);
  const muscleIds = new Set(bundle.muscles.map((m) => m.id));
  const organIds = new Set(bundle.organs.map((o) => o.id));
  const meridianIds = new Set(bundle.meridians.map((m) => m.id));

  if (entity.type === 'muscle') muscleIds.add(entity.id);
  if (entity.type === 'organ') organIds.add(entity.id);
  if (entity.type === 'meridian') meridianIds.add(entity.id);

  const matchedMudras = MUDRAS.filter(
    (mu) =>
      mu.relatedMuscleIds.some((id) => muscleIds.has(id)) ||
      mu.relatedOrganIds.some((id) => organIds.has(id)) ||
      mu.relatedMeridianIds.some((id) => meridianIds.has(id))
  );

  const matchedNosodes = NOSODES.filter(
    (no) =>
      no.relatedMuscleIds.some((id) => muscleIds.has(id)) ||
      no.relatedOrganIds.some((id) => organIds.has(id)) ||
      no.relatedMeridianIds.some((id) => meridianIds.has(id))
  );

  return {
    mudras: matchedMudras.length > 0 ? matchedMudras.slice(0, 4) : MUDRAS.slice(0, 2),
    nosodes: matchedNosodes.slice(0, 4),
  };
}
