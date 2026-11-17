import { Muscle } from '../types/atlas';

export interface MuscleAnatomyImageMeta {
  src: string;
  caption: string;
  attribution: string;
  isIndividualPlate: boolean;
}

const INDIVIDUAL_MUSCLE_IMAGES: Record<string, MuscleAnatomyImageMeta> = {
  masseter: {
    src: '/anatomy/muscles/masseter.png',
    caption: 'Жевательная мышца (m. masseter) — поверхностная и глубокая порции',
    attribution: 'Wikimedia Commons · Henry Gray Anatomy (Public Domain)',
    isIndividualPlate: true,
  },
  scm: {
    src: '/anatomy/muscles/scm.png',
    caption: 'Грудино-ключично-сосцевидная мышца (m. sternocleidomastoideus)',
    attribution: 'Wikimedia Commons · Anatomography (CC BY-SA 2.1 jp)',
    isIndividualPlate: true,
  },
  'upper-trapezius': {
    src: '/anatomy/muscles/trapezius.svg',
    caption: 'Трапециевидная мышца (m. trapezius) — верхняя, средняя и нижняя порции',
    attribution: 'Wikimedia Commons · Trapezius muscle (CC BY-SA 4.0)',
    isIndividualPlate: true,
  },
  'middle-lower-trapezius': {
    src: '/anatomy/muscles/trapezius.svg',
    caption: 'Средняя и нижняя порции трапециевидной мышцы (m. trapezius)',
    attribution: 'Wikimedia Commons · Trapezius muscle (CC BY-SA 4.0)',
    isIndividualPlate: true,
  },
  'pectoralis-major-clavicular': {
    src: '/anatomy/muscles/pectoralis_major.png',
    caption: 'Большая грудная мышца (m. pectoralis major) — ключичная головка',
    attribution: 'Wikimedia Commons · Pectoralis major (CC BY 4.0)',
    isIndividualPlate: true,
  },
  'pectoralis-major-sternal': {
    src: '/anatomy/muscles/pectoralis_major.png',
    caption: 'Большая грудная мышца (m. pectoralis major) — грудино-рёберная головка',
    attribution: 'Wikimedia Commons · Pectoralis major (CC BY 4.0)',
    isIndividualPlate: true,
  },
  deltoid: {
    src: '/anatomy/muscles/deltoid.jpg',
    caption: 'Дельтовидная мышца (m. deltoideus) — передняя, средняя и задняя порции',
    attribution: 'Wikimedia Commons · Deltoid muscle (CC0 Public Domain)',
    isIndividualPlate: true,
  },
  'serratus-anterior': {
    src: '/anatomy/muscles/serratus_anterior.png',
    caption: 'Передняя зубчатая мышца (m. serratus anterior) — зубцы и крепление к лопатке',
    attribution: 'Wikimedia Commons · Anatomography (CC BY-SA 2.1 jp)',
    isIndividualPlate: true,
  },
  'latissimus-dorsi': {
    src: '/anatomy/muscles/latissimus_dorsi.png',
    caption: 'Широчайшая мышца спины (m. latissimus dorsi) и пояснично-грудная фасция',
    attribution: 'Wikimedia Commons · Henry Gray Anatomy (Public Domain)',
    isIndividualPlate: true,
  },
  iliopsoas: {
    src: '/anatomy/muscles/psoas.png',
    caption: 'Подвздошно-поясничная мышца (m. iliopsoas) — большая поясничная и подвздошная части',
    attribution: 'Wikimedia Commons · Gray Plate 430 (Public Domain)',
    isIndividualPlate: true,
  },
  'quadratus-lumborum': {
    src: '/anatomy/muscles/psoas.png',
    caption: 'Квадратная мышца поясницы (m. quadratus lumborum) и поясничный отдел',
    attribution: 'Wikimedia Commons · Gray Plate 430 (Public Domain)',
    isIndividualPlate: true,
  },
  piriformis: {
    src: '/anatomy/muscles/piriformis.png',
    caption: 'Грушевидная мышца (m. piriformis) и выход седалищного нерва',
    attribution: 'Wikimedia Commons · Gray Plate 434 (Public Domain)',
    isIndividualPlate: true,
  },
  'rectus-abdominis': {
    src: '/anatomy/muscles/rectus_abdominis.png',
    caption: 'Прямая мышца живота (m. rectus abdominis) и сухожильные перемычки',
    attribution: 'Wikimedia Commons · Rectus abdominis (CC BY-SA 3.0)',
    isIndividualPlate: true,
  },
  'quadriceps-femoris': {
    src: '/anatomy/muscles/quadriceps.png',
    caption: 'Четырёхглавая мышца бедра (m. quadriceps femoris) — прямая и широкие головки',
    attribution: 'Wikimedia Commons · Gray Plate 430 Anterior Thigh (Public Domain)',
    isIndividualPlate: true,
  },
  gastrocnemius: {
    src: '/anatomy/muscles/gastrocnemius.jpg',
    caption: 'Икроножная мышца (m. gastrocnemius) и ахиллово сухожилие',
    attribution: 'Wikimedia Commons · Posterior leg anatomy (CC BY-SA)',
    isIndividualPlate: true,
  },
  'tibialis-anterior': {
    src: '/anatomy/muscles/tibialis_anterior.png',
    caption: 'Передняя большеберцовая мышца (m. tibialis anterior)',
    attribution: 'Wikimedia Commons · Anatomography (CC BY-SA 2.1 jp)',
    isIndividualPlate: true,
  },
};

const REGIONAL_MUSCLE_IMAGES: Record<string, MuscleAnatomyImageMeta> = {
  temporalis: {
    src: '/anatomy/mmt/openstax_head_chewing.png',
    caption: 'Височная и жевательная мускулатура головы (анатомическая таблица)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'lateral-pterygoid': {
    src: '/anatomy/mmt/openstax_head_chewing.png',
    caption: 'Крыловидные и жевательные мышцы височно-нижнечелюстного сустава',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'medial-pterygoid': {
    src: '/anatomy/mmt/openstax_head_chewing.png',
    caption: 'Медиальная крыловидная мышца и мускулатура нижней челюсти',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'suprahyoid-infrahyoid': {
    src: '/anatomy/mmt/openstax_neck_front.png',
    caption: 'Надподъязычная и подподъязычная группы мышц передней поверхности шеи',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  scalenes: {
    src: '/anatomy/mmt/openstax_neck_lateral.png',
    caption: 'Лестничные мышцы и боковой треугольник шеи (плечевое сплетение)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'deep-neck-flexors': {
    src: '/anatomy/mmt/openstax_neck_front.png',
    caption: 'Глубокие сгибатели шеи и передняя шейная мускулатура',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  suboccipitals: {
    src: '/anatomy/mmt/openstax_neck_back.png',
    caption: 'Подзатылочные мышцы и краниоцервикальный переход C0–C2',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'cervical-extensors': {
    src: '/anatomy/mmt/openstax_neck_back.png',
    caption: 'Задние разгибатели шеи (ременная, полуостистая мышцы)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'levator-scapulae': {
    src: '/anatomy/mmt/openstax_neck_back.png',
    caption: 'Мышца, поднимающая лопатку, и шейно-лопаточный регион',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'pectoralis-minor': {
    src: '/anatomy/mmt/openstax_thorax.png',
    caption: 'Малая грудная мышца и передняя стенка грудной клетки',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  rhomboids: {
    src: '/anatomy/mmt/openstax_pectoral_girdle.png',
    caption: 'Ромбовидные мышцы и стабилизаторы лопатки сзади',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  subscapularis: {
    src: '/anatomy/mmt/openstax_pectoral_girdle.png',
    caption: 'Мышцы ротаторной манжеты плеча и лопаточной области',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  supraspinatus: {
    src: '/anatomy/mmt/openstax_pectoral_girdle.png',
    caption: 'Надостная мышца и ротаторная манжета плечевого сустава',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  infraspinatus: {
    src: '/anatomy/mmt/openstax_pectoral_girdle.png',
    caption: 'Подостная мышца и задние стабилизаторы плечевого сустава',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'erector-spinae': {
    src: '/anatomy/mmt/openstax_pectoral_girdle.png',
    caption: 'Мышца, выпрямляющая позвоночник, и грудопоясничный отдел',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  coracobrachialis: {
    src: '/anatomy/mmt/openstax_upper_limb.png',
    caption: 'Клювовидно-плечевая мышца и передняя группа плеча',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'biceps-brachii': {
    src: '/anatomy/mmt/openstax_upper_limb.png',
    caption: 'Двуглавая мышца плеча (m. biceps brachii) — длинная и короткая головки',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'triceps-brachii': {
    src: '/anatomy/mmt/openstax_upper_limb.png',
    caption: 'Трёхглавая мышца плеча (m. triceps brachii) — задний компартмент плеча',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  brachioradialis: {
    src: '/anatomy/mmt/openstax_forearm.png',
    caption: 'Плечелучевая мышца и предплечье',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'wrist-flexors': {
    src: '/anatomy/mmt/openstax_forearm.png',
    caption: 'Сгибатели запястья и кисти (передний компартмент предплечья)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'wrist-extensors': {
    src: '/anatomy/mmt/openstax_forearm.png',
    caption: 'Разгибатели запястья и кисти (задний компартмент предплечья)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'obliques-abdominis': {
    src: '/anatomy/mmt/openstax_abdomen.png',
    caption: 'Наружная и внутренняя косые мышцы живота',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'pelvic-floor-muscles': {
    src: '/anatomy/mmt/openstax_pelvic_floor.png',
    caption: 'Мышцы тазового дна и промежности (тазовая диафрагма)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'obturator-internus': {
    src: '/anatomy/mmt/openstax_pelvic_floor.png',
    caption: 'Внутренняя запирательная мышца и глубокие ротаторы таза',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'tensor-fasciae-latae': {
    src: '/anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Напрягатель широкой фасции бедра (TFL) и илиотибиальный тракт',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'gluteus-medius': {
    src: '/anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Средняя ягодичная мышца (m. gluteus medius) — латеральный стабилизатор таза',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'gluteus-maximus': {
    src: '/anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Большая ягодичная мышца (m. gluteus maximus) — главный разгибатель бедра',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  hamstrings: {
    src: '/anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Экстензоры бедра / мышцы задней поверхности бедра (хамстринги)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'hip-adductors': {
    src: '/anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Приводящие мышцы бедра (медиальный компартмент)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  sartorius: {
    src: '/anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Портняжная мышца (m. sartorius) — передняя поверхность бедра',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  popliteus: {
    src: '/anatomy/mmt/openstax_lower_leg.png',
    caption: 'Подколенная мышца (m. popliteus) и задняя область колена',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  soleus: {
    src: '/anatomy/mmt/openstax_lower_leg.png',
    caption: 'Камбаловидная мышца (m. soleus) — глубокий сгибатель голени',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'tibialis-posterior': {
    src: '/anatomy/mmt/openstax_foot.png',
    caption: 'Задняя большеберцовая мышца и свод стопы',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
  'fibularis-peroneus': {
    src: '/anatomy/mmt/openstax_lower_leg.png',
    caption: 'Длинная и короткая малоберцовые мышцы (латеральный компартмент голени)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
    isIndividualPlate: false,
  },
};

export function getMuscleAnatomyImage(muscle: Muscle): MuscleAnatomyImageMeta {
  if (muscle.anatomyImage) {
    return {
      src: muscle.anatomyImage.src,
      caption: muscle.anatomyImage.caption || muscle.name,
      attribution: muscle.anatomyImage.attribution || 'Открытый анатомический атлас',
      isIndividualPlate: true,
    };
  }
  if (INDIVIDUAL_MUSCLE_IMAGES[muscle.id]) {
    return INDIVIDUAL_MUSCLE_IMAGES[muscle.id];
  }
  if (REGIONAL_MUSCLE_IMAGES[muscle.id]) {
    return REGIONAL_MUSCLE_IMAGES[muscle.id];
  }

  switch (muscle.zone) {
    case 'head':
      return {
        src: '/anatomy/head_neck_gray378.png',
        caption: `${muscle.name} (голова и ВНЧС)`,
        attribution: 'Henry Gray · Public Domain',
        isIndividualPlate: false,
      };
    case 'cervical':
      return {
        src: '/anatomy/neck_gray385.png',
        caption: `${muscle.name} (шейный отдел)`,
        attribution: 'Henry Gray · Public Domain',
        isIndividualPlate: false,
      };
    case 'thoracic':
      return {
        src: '/anatomy/mmt/openstax_thorax.png',
        caption: `${muscle.name} (грудной отдел)`,
        attribution: 'OpenStax · CC BY 4.0',
        isIndividualPlate: false,
      };
    case 'lumbar':
      return {
        src: '/anatomy/mmt/openstax_abdomen.png',
        caption: `${muscle.name} (пояснично-брюшной отдел)`,
        attribution: 'OpenStax · CC BY 4.0',
        isIndividualPlate: false,
      };
    default:
      return {
        src: '/anatomy/mmt/openstax_pelvis_thigh.png',
        caption: `${muscle.name} (таз и нижняя конечность)`,
        attribution: 'OpenStax · CC BY 4.0',
        isIndividualPlate: false,
      };
  }
}
