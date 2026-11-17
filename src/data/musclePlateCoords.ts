import { AnatomicalZoneId, Muscle, PainBodyView } from '../types/atlas';

export const BODY_SILHOUETTE_PLATE = {
  src: './anatomy/muscles_front_back.svg',
  width: 1000,
  height: 871,
  anteriorMidX: 250,
  posteriorMidX: 773,
  splitX: 500,
  sourceAttribution: 'Wikimedia Commons · Muscles front and back (CC BY-SA)',
} as const;

// Calibrated coordinates on muscles_front_back.svg (1000 x 871):
// Left figure centered at x=250 (anterior), Right figure centered at x=773 (posterior)
export const MUSCLE_PLATE_COORDS: Record<string, { x: number; y: number }> = {
  masseter: { x: 222, y: 112 },
  temporalis: { x: 282, y: 64 },
  'lateral-pterygoid': { x: 274, y: 98 },
  scm: { x: 234, y: 150 },
  'deep-neck-flexors': { x: 250, y: 146 },
  scalenes: { x: 218, y: 164 },
  'upper-trapezius': { x: 722, y: 175 },
  'pectoralis-major-clavicular': { x: 214, y: 196 },
  'pectoralis-major-sternal': { x: 212, y: 238 },
  deltoid: { x: 148, y: 216 },
  'serratus-anterior': { x: 180, y: 288 },
  'latissimus-dorsi': { x: 822, y: 310 },
  rhomboids: { x: 752, y: 238 },
  iliopsoas: { x: 220, y: 438 },
  'quadratus-lumborum': { x: 735, y: 378 },
  piriformis: { x: 736, y: 454 },
  'rectus-abdominis': { x: 266, y: 336 },
  'tensor-fasciae-latae': { x: 175, y: 462 },
  'gluteus-medius': { x: 826, y: 416 },
  'medial-pterygoid': { x: 270, y: 114 },
  suboccipitals: { x: 773, y: 108 },
  'suprahyoid-infrahyoid': { x: 250, y: 134 },
  'cervical-extensors': { x: 773, y: 136 },
  'levator-scapulae': { x: 748, y: 178 },
  'pectoralis-minor': { x: 288, y: 214 },
  subscapularis: { x: 318, y: 232 },
  supraspinatus: { x: 822, y: 192 },
  infraspinatus: { x: 822, y: 224 },
  'middle-lower-trapezius': { x: 773, y: 250 },
  'erector-spinae': { x: 788, y: 345 },
  coracobrachialis: { x: 172, y: 235 },
  'biceps-brachii': { x: 138, y: 280 },
  'triceps-brachii': { x: 886, y: 282 },
  brachioradialis: { x: 116, y: 338 },
  'wrist-flexors': { x: 92, y: 392 },
  'wrist-extensors': { x: 924, y: 392 },
  'obliques-abdominis': { x: 216, y: 342 },
  'gluteus-maximus': { x: 748, y: 442 },
  'pelvic-floor-muscles': { x: 250, y: 464 },
  'obturator-internus': { x: 804, y: 464 },
  'quadriceps-femoris': { x: 212, y: 535 },
  hamstrings: { x: 735, y: 550 },
  'hip-adductors': { x: 236, y: 532 },
  sartorius: { x: 280, y: 545 },
  popliteus: { x: 740, y: 628 },
  gastrocnemius: { x: 736, y: 695 },
  soleus: { x: 808, y: 742 },
  'tibialis-anterior': { x: 215, y: 725 },
  'tibialis-posterior': { x: 794, y: 728 },
  'fibularis-peroneus': { x: 294, y: 735 },
};

export function inferBodyViewFromX(x: number): PainBodyView {
  return x < BODY_SILHOUETTE_PLATE.splitX ? 'anterior' : 'posterior';
}

export function inferZoneFromCoord(x: number, y: number): AnatomicalZoneId {
  const isAnterior = x < BODY_SILHOUETTE_PLATE.splitX;
  const midX = isAnterior ? BODY_SILHOUETTE_PLATE.anteriorMidX : BODY_SILHOUETTE_PLATE.posteriorMidX;
  const dx = Math.abs(x - midX);

  if (y < 122) return 'head';
  if (y < 182 && dx < 68) return 'cervical';
  // Upper limbs sit laterally from shoulders down to fingertips (y 182..470, dx > 72)
  if (y >= 180 && y <= 475 && dx > 72) return 'upper-limb';
  if (y < 330) return 'thoracic';
  if (y < 475) return 'lumbar';
  return 'lower-limb';
}

export function findNearestMuscles(
  x: number,
  y: number,
  muscles: Muscle[],
  limit = 3
): Array<{ muscle: Muscle; distance: number }> {
  const clickView = inferBodyViewFromX(x);
  const midX =
    clickView === 'anterior'
      ? BODY_SILHOUETTE_PLATE.anteriorMidX
      : BODY_SILHOUETTE_PLATE.posteriorMidX;

  const scored: Array<{ muscle: Muscle; distance: number }> = [];

  for (const muscle of muscles) {
    const coord = MUSCLE_PLATE_COORDS[muscle.id];
    if (!coord) continue;
    const muscleView: PainBodyView =
      coord.x < BODY_SILHOUETTE_PLATE.splitX ? 'anterior' : 'posterior';

    let dist: number;
    if (muscleView === clickView) {
      const dDirect = Math.hypot(x - coord.x, y - coord.y);
      const mirroredX = 2 * midX - coord.x;
      const dMirrored = Math.hypot(x - mirroredX, y - coord.y);
      dist = Math.min(dDirect, dMirrored);
    } else {
      // Map coordinate symmetrically to the opposite figure midline with a soft penalty
      const otherMid =
        muscleView === 'anterior'
          ? BODY_SILHOUETTE_PLATE.anteriorMidX
          : BODY_SILHOUETTE_PLATE.posteriorMidX;
      const dxFromMid = Math.abs(x - midX);
      const mappedX1 = otherMid + dxFromMid;
      const mappedX2 = otherMid - dxFromMid;
      dist =
        Math.min(
          Math.hypot(mappedX1 - coord.x, y - coord.y),
          Math.hypot(mappedX2 - coord.x, y - coord.y)
        ) + 65;
    }

    scored.push({ muscle, distance: dist });
  }

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, limit);
}

export function describeBodySide(x: number): string {
  const isAnterior = x < BODY_SILHOUETTE_PLATE.splitX;
  if (isAnterior) {
    // Viewer's left on anterior figure = patient's right
    const diff = x - BODY_SILHOUETTE_PLATE.anteriorMidX;
    if (Math.abs(diff) <= 18) return 'по средней линии спереди';
    return diff < 0 ? 'справа спереди' : 'слева спереди';
  }
  // Viewer's left on posterior figure = patient's left
  const diff = x - BODY_SILHOUETTE_PLATE.posteriorMidX;
  if (Math.abs(diff) <= 18) return 'по средней линии сзади';
  return diff < 0 ? 'слева сзади' : 'справа сзади';
}
