import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MMTCustomPhoto,
  MMTPositionType,
  MMTVectorArrow,
  MMTVectorArrowType,
  Muscle,
} from '../types/atlas';
import {
  MMT_ARROW_KIND_META,
  MMT_MEDIA_UPDATED_EVENT,
  MMT_POSITION_OPTIONS,
  compressImageFile,
  deleteCustomPhoto,
  exportAnnotatedPhotoPng,
  loadCustomPhotosForMuscle,
  loadOverlayArrows,
  saveCustomPhoto,
  saveOverlayArrows,
} from '../utils/mmtMediaStore';
import { createEntityId } from '../utils/patientDatabase';
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Maximize2,
  MousePointer,
  PenTool,
  Plus,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

interface ClinicalPhotoRef {
  src: string;
  caption: string;
  attribution: string;
}

interface MuscleAtlasPlateSpec {
  plateSrc: string;
  plateTitle: string;
  /** Exact normalized target coordinate (%) on the OpenStax plate */
  xPct: number;
  yPct: number;
  /** Pressure angle (deg, 0=right, 90=down, 180=left, -90=up) for vector compass */
  pressureAngleDeg: number;
  /** Patient resistance vector angle (deg) */
  patientAngleDeg: number;
  poseSummary: string;
  clinicalPhoto?: ClinicalPhotoRef;
}

const PHOTO_PSOAS: ClinicalPhotoRef = {
  src: './anatomy/mmt/mmt_psoas.jpg',
  caption:
    'Клиническое ММТ сгибателей бедра / подвздошно-поясничной мышцы: фиксация таза и вектор давления на дистальную часть бедра',
  attribution: 'Wikimedia Commons · CC BY-SA 4.0',
};

const PHOTO_RECTUS_FEMORIS: ClinicalPhotoRef = {
  src: './anatomy/mmt/mmt_rectus_femoris.jpg',
  caption:
    'Мануальное мышечное тестирование передней группы мышц бедра: стабилизация контралатерального таза и давление над коленным суставом',
  attribution: 'Wikimedia Commons · CC BY-SA 4.0',
};

const PHOTO_SHOULDER_ELEVATION: ClinicalPhotoRef = {
  src: './anatomy/mmt/mmt_neer_shoulder.jpg',
  caption:
    'Клиническая схема позиционирования плечевого сустава, фиксации лопатки и вектора нагрузки на плечевой пояс',
  attribution: 'Wikimedia Commons · CC BY-SA 4.0',
};

const MUSCLE_PLATE_SPECS: Record<string, MuscleAtlasPlateSpec> = {
  // === 1. ГОЛОВА И ВНЧС ===
  masseter: {
    plateSrc: './anatomy/mmt/openstax_head_chewing.png',
    plateTitle: 'Жевательные мышцы (поверхностный и глубокий слои)',
    xPct: 22,
    yPct: 65,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на спине или сидя; зубы сомкнуты, давление на подбородок вниз',
  },
  temporalis: {
    plateSrc: './anatomy/mmt/openstax_head_chewing.png',
    plateTitle: 'Височная мышца и латеральная поверхность черепа',
    xPct: 26,
    yPct: 26,
    pressureAngleDeg: 110,
    patientAngleDeg: -70,
    poseSummary: 'Рот слегка приоткрыт, давление на подбородок вниз и кпереди',
  },
  'lateral-pterygoid': {
    plateSrc: './anatomy/mmt/openstax_head_chewing.png',
    plateTitle: 'Латеральная крыловидная мышца (глубокая диссекция)',
    xPct: 78,
    yPct: 44,
    pressureAngleDeg: 0,
    patientAngleDeg: 180,
    poseSummary: 'Нижняя челюсть выдвинута вперёд/в сторону; давление назад к ВНЧС',
  },
  'medial-pterygoid': {
    plateSrc: './anatomy/mmt/openstax_head_chewing.png',
    plateTitle: 'Медиальная крыловидная мышца (внутренний угол челюсти)',
    xPct: 76,
    yPct: 65,
    pressureAngleDeg: 115,
    patientAngleDeg: -65,
    poseSummary: 'Зубы сомкнуты со смещением челюсти; вектор давления вниз и медиально',
  },
  suboccipitals: {
    plateSrc: './anatomy/mmt/openstax_neck_lateral.png',
    plateTitle: 'Подзатылочные мышцы (область C0–C1–C2)',
    xPct: 77,
    yPct: 25,
    pressureAngleDeg: 150,
    patientAngleDeg: -30,
    poseSummary: 'Лёжа на спине, мягкий кивок в суставе C0–C1; вектор к флексии краниовертебрально',
  },

  // === 2. ШЕЙНЫЙ ОТДЕЛ ===
  'suprahyoid-infrahyoid': {
    plateSrc: './anatomy/mmt/openstax_neck_front.png',
    plateTitle: 'Надподъязычная и подподъязычная группы мышц',
    xPct: 49,
    yPct: 44,
    pressureAngleDeg: -80,
    patientAngleDeg: 100,
    poseSummary: 'Лёжа на спине, язык прижат к твёрдому нёбу, подъязычная кость стабилизирована',
  },
  scm: {
    plateSrc: './anatomy/mmt/openstax_neck_lateral.png',
    plateTitle: 'Грудино-ключично-сосцевидная мышца (боковая поверхность)',
    xPct: 12,
    yPct: 42,
    pressureAngleDeg: 68,
    patientAngleDeg: -112,
    poseSummary: 'Лёжа на спине, голова приподнята и ротирована в противоположную сторону',
  },
  scalenes: {
    plateSrc: './anatomy/mmt/openstax_neck_lateral.png',
    plateTitle: 'Лестничные мышцы (передняя, средняя, задняя)',
    xPct: 13,
    yPct: 68,
    pressureAngleDeg: 75,
    patientAngleDeg: -105,
    poseSummary: 'Лёжа на спине, сгибание шеи 25° с ротацией 15° в сторону тестирования',
  },
  'deep-neck-flexors': {
    plateSrc: './anatomy/mmt/openstax_neck_front.png',
    plateTitle: 'Передняя поверхность шеи и проекция глубоких сгибателей',
    xPct: 49,
    yPct: 30,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на спине, втягивание подбородка («двойной подбородок»), подъём головы',
  },
  'cervical-extensors': {
    plateSrc: './anatomy/mmt/openstax_neck_lateral.png',
    plateTitle: 'Разгибатели шеи (ременная, полуостистая, длиннейшая головы)',
    xPct: 87,
    yPct: 45,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на животе, голова выведена за край кушетки в разгибании',
  },
  'upper-trapezius': {
    plateSrc: './anatomy/mmt/openstax_pectoral_girdle.png',
    plateTitle: 'Верхняя порция трапециевидной мышцы',
    xPct: 70,
    yPct: 56,
    pressureAngleDeg: 98,
    patientAngleDeg: -82,
    poseSummary: 'Сидя, надплечье поднято к уху, голова наклонена в сторону теста',
  },
  'levator-scapulae': {
    plateSrc: './anatomy/mmt/openstax_neck_lateral.png',
    plateTitle: 'Мышца, поднимающая лопатку (боковой и задний виды)',
    xPct: 16,
    yPct: 48,
    pressureAngleDeg: 85,
    patientAngleDeg: -95,
    poseSummary: 'Сидя или лёжа, элевация верхнего угла лопатки с приведением',
  },

  // === 3. ГРУДНОЙ ОТДЕЛ И ПЛЕЧЕВОЙ ПОЯС ===
  'pectoralis-major-clavicular': {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Большая грудная мышца (ключичная порция)',
    xPct: 18,
    yPct: 12,
    pressureAngleDeg: -30,
    patientAngleDeg: 150,
    poseSummary: 'Лёжа на спине, рука согнута под 90° и слегка приведена (вверх-кнаружи)',
  },
  'pectoralis-major-sternal': {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Большая грудная мышца (грудинная порция)',
    xPct: 20,
    yPct: 17,
    pressureAngleDeg: -50,
    patientAngleDeg: 130,
    poseSummary: 'Лёжа на спине, рука под 90°, вектор давления кнаружи-вверх по диагонали',
  },
  'pectoralis-minor': {
    plateSrc: './anatomy/mmt/openstax_pectoral_girdle.png',
    plateTitle: 'Малая грудная мышца (передне-латеральный вид)',
    xPct: 21,
    yPct: 31,
    pressureAngleDeg: 100,
    patientAngleDeg: -80,
    poseSummary: 'Лёжа на спине, протракция и передний наклон плечевого сустава к потолку',
  },
  'serratus-anterior': {
    plateSrc: './anatomy/mmt/openstax_thorax.png',
    plateTitle: 'Передняя зубчатая мышца (рёберные зубцы)',
    xPct: 36,
    yPct: 68,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Сидя/лёжа, рука вытянута вперёд под 110–120° с протракцией лопатки',
  },
  deltoid: {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Дельтовидная мышца (средняя, передняя и задняя порции)',
    xPct: 57,
    yPct: 17,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Сидя, отведение плеча 90° в нейтральной ротации, локоть 90°',
    clinicalPhoto: PHOTO_SHOULDER_ELEVATION,
  },
  supraspinatus: {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Надостная мышца (надостная ямка лопатки)',
    xPct: 82,
    yPct: 58,
    pressureAngleDeg: 85,
    patientAngleDeg: -95,
    poseSummary: 'Сидя/стоя, отведение плеча 15–30° в плоскости лопатки (Empty Can / Full Can)',
    clinicalPhoto: PHOTO_SHOULDER_ELEVATION,
  },
  infraspinatus: {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Подостная и малая круглая мышцы (наружные ротаторы)',
    xPct: 82,
    yPct: 68,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа или сидя, локоть 90°, наружная ротация плеча против давления внутрь',
  },
  subscapularis: {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Подлопаточная мышца (передняя поверхность лопатки)',
    xPct: 25,
    yPct: 65,
    pressureAngleDeg: -90,
    patientAngleDeg: 90,
    poseSummary: 'Лёжа на животе/спине, плечо отведено на 90°, внутренняя ротация предплечья',
  },
  'middle-lower-trapezius': {
    plateSrc: './anatomy/mmt/openstax_pectoral_girdle.png',
    plateTitle: 'Средняя и нижняя порции трапециевидной мышцы',
    xPct: 72,
    yPct: 74,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на животе, рука отведена на 90° (средняя) или 135° (нижняя) вверх',
  },
  rhomboids: {
    plateSrc: './anatomy/mmt/openstax_pectoral_girdle.png',
    plateTitle: 'Большая и малая ромбовидные мышцы',
    xPct: 85,
    yPct: 68,
    pressureAngleDeg: 0,
    patientAngleDeg: 180,
    poseSummary: 'Сидя/лёжа на животе, рука приведена и локоть отведён назад (ретракция лопатки)',
  },
  'latissimus-dorsi': {
    plateSrc: './anatomy/mmt/openstax_upper_limb.png',
    plateTitle: 'Широчайшая мышца спины (задне-латеральный вид)',
    xPct: 69,
    yPct: 32,
    pressureAngleDeg: -20,
    patientAngleDeg: 160,
    poseSummary: 'Лёжа на животе/спине, прямая рука во внутренней ротации приводится к тазу',
  },
  'erector-spinae': {
    plateSrc: './anatomy/mmt/openstax_neck_back.png',
    plateTitle: 'Мышца, выпрямляющая позвоночник (подвздошно-рёберная и длиннейшая)',
    xPct: 41,
    yPct: 62,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на животе с фиксированным тазом, разгибание грудопоясничного отдела',
  },

  // === 4. ВЕРХНЯЯ КОНЕЧНОСТЬ ===
  coracobrachialis: {
    plateSrc: './anatomy/mmt/openstax_forearm.png',
    plateTitle: 'Клювовидно-плечевая и передние мышцы плеча',
    xPct: 23,
    yPct: 12,
    pressureAngleDeg: 60,
    patientAngleDeg: -120,
    poseSummary: 'Лёжа на спине, плечо согнуто 45–60°, локоть максимально согнут, кисть супинирована',
  },
  'biceps-brachii': {
    plateSrc: './anatomy/mmt/openstax_forearm.png',
    plateTitle: 'Двуглавая мышца плеча (длинная и короткая головки)',
    xPct: 29,
    yPct: 18,
    pressureAngleDeg: 75,
    patientAngleDeg: -105,
    poseSummary: 'Сидя/лёжа, локоть согнут под 90°, предплечье в супинации',
  },
  'triceps-brachii': {
    plateSrc: './anatomy/mmt/openstax_forearm.png',
    plateTitle: 'Трёхглавая мышца плеча (задняя поверхность плеча)',
    xPct: 82,
    yPct: 18,
    pressureAngleDeg: -75,
    patientAngleDeg: 105,
    poseSummary: 'Лёжа на животе/спине, предплечье разогнуто на ~15° от прямого угла',
  },
  brachioradialis: {
    plateSrc: './anatomy/mmt/openstax_forearm.png',
    plateTitle: 'Плечелучевая мышца (латеральный край предплечья)',
    xPct: 24,
    yPct: 41,
    pressureAngleDeg: 80,
    patientAngleDeg: -100,
    poseSummary: 'Сидя, локоть 90°, предплечье в среднем положении (большой палец вверх)',
  },
  'wrist-flexors': {
    plateSrc: './anatomy/mmt/openstax_forearm.png',
    plateTitle: 'Сгибатели запястья (ладонная поверхность предплечья)',
    xPct: 26,
    yPct: 48,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Предплечье фиксировано супинированным, кисть в ладонном сгибании',
  },
  'wrist-extensors': {
    plateSrc: './anatomy/mmt/openstax_forearm.png',
    plateTitle: 'Разгибатели запястья и пальцев (тыльная поверхность)',
    xPct: 76,
    yPct: 44,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Предплечье пронировано, кисть в тыльном разгибании, давление к сгибанию',
  },

  // === 5. ПОЯСНИЧНО-ТАЗОВЫЙ РЕГИОН ===
  iliopsoas: {
    plateSrc: './anatomy/mmt/openstax_abdomen.png',
    plateTitle: 'Подвздошно-поясничная мышца (psoas major и iliacus)',
    xPct: 60,
    yPct: 74,
    pressureAngleDeg: 65,
    patientAngleDeg: -115,
    poseSummary: 'Лёжа на спине, бедро согнуто 30–45°, отведено 15–20° и ротировано кнаружи',
    clinicalPhoto: PHOTO_PSOAS,
  },
  'quadratus-lumborum': {
    plateSrc: './anatomy/mmt/openstax_abdomen.png',
    plateTitle: 'Квадратная мышца поясницы (задняя брюшная стенка)',
    xPct: 39,
    yPct: 58,
    pressureAngleDeg: 180,
    patientAngleDeg: 0,
    poseSummary: 'Лёжа на спине, латерофлексия туловища и ног в сторону тестируемой мышцы',
  },
  'rectus-abdominis': {
    plateSrc: './anatomy/mmt/openstax_abdomen.png',
    plateTitle: 'Прямая мышца живота (передняя брюшная стенка)',
    xPct: 39,
    yPct: 24,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на спине, корпус приподнят с отрывом лопаток (или удержание ног)',
  },
  'obliques-abdominis': {
    plateSrc: './anatomy/mmt/openstax_abdomen.png',
    plateTitle: 'Наружная, внутренняя косые и поперечная мышцы живота',
    xPct: 46,
    yPct: 20,
    pressureAngleDeg: 70,
    patientAngleDeg: -110,
    poseSummary: 'Лёжа на спине с ротацией грудной клетки к противоположному бедру',
  },
  'pelvic-floor-muscles': {
    plateSrc: './anatomy/mmt/openstax_pelvic_floor.png',
    plateTitle: 'Диафрагма таза (мышца, поднимающая задний проход)',
    xPct: 45,
    yPct: 50,
    pressureAngleDeg: 0,
    patientAngleDeg: 180,
    poseSummary: 'Оценка через индикаторные мышцы (приводящие/ягодичные) на провокации тазового дна',
  },
  piriformis: {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Грушевидная мышца (глубокий слой ягодичной области)',
    xPct: 77,
    yPct: 63,
    pressureAngleDeg: 0,
    patientAngleDeg: 180,
    poseSummary: 'Сидя (колено 90°) или лёжа на животе, тест наружной ротации бедра',
  },
  'gluteus-medius': {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Средняя и малая ягодичные мышцы (отводящие бедро)',
    xPct: 78,
    yPct: 56,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на боку (или на спине), отведение прямой ноги в нейтральной ротации',
  },
  'gluteus-maximus': {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Большая ягодичная мышца (задняя поверхность таза)',
    xPct: 71,
    yPct: 67,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: 'Лёжа на животе, колено согнуто на 90° для выключения хамстрингов, разгибание бедра',
  },
  'obturator-internus': {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Внутренняя запирательная и близнецовые мышцы',
    xPct: 72,
    yPct: 62,
    pressureAngleDeg: 180,
    patientAngleDeg: 0,
    poseSummary: 'Сидя со свешенными голенями, наружная ротация бедра из позиции 90° флексии',
  },
  'tensor-fasciae-latae': {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Напрягатель широкой фасции бедра (TFL)',
    xPct: 15,
    yPct: 21,
    pressureAngleDeg: 45,
    patientAngleDeg: -135,
    poseSummary: 'Лёжа на спине, бедро согнуто 30°, отведено 20° и ротировано внутрь',
    clinicalPhoto: PHOTO_RECTUS_FEMORIS,
  },

  // === 6. НИЖНЯЯ КОНЕЧНОСТЬ ===
  'quadriceps-femoris': {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Четырёхглавая мышца бедра (прямая и широкие головки)',
    xPct: 19,
    yPct: 29,
    pressureAngleDeg: 85,
    patientAngleDeg: -95,
    poseSummary: 'Лёжа на спине (бедро 45°, колено 90°) или сидя, тестирование прямой мышцы/разгибания',
    clinicalPhoto: PHOTO_RECTUS_FEMORIS,
  },
  hamstrings: {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Задняя группа бедра (двуглавая, полусухожильная, полуперепончатая)',
    xPct: 76,
    yPct: 82,
    pressureAngleDeg: 65,
    patientAngleDeg: -115,
    poseSummary: 'Лёжа на животе, колено согнуто 60–70°, вектор давления к разгибанию голени',
  },
  'hip-adductors': {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Приводящие мышцы бедра (длинная, короткая, большая, тонкая)',
    xPct: 25,
    yPct: 72,
    pressureAngleDeg: 0,
    patientAngleDeg: 180,
    poseSummary: 'Лёжа на боку/спине, приведение прямой ноги против отводящего давления',
    clinicalPhoto: PHOTO_RECTUS_FEMORIS,
  },
  sartorius: {
    plateSrc: './anatomy/mmt/openstax_pelvis_thigh.png',
    plateTitle: 'Портняжная мышца (косое пересечение бедра)',
    xPct: 21,
    yPct: 25,
    pressureAngleDeg: 35,
    patientAngleDeg: -145,
    poseSummary: 'Лёжа на спине, сгибание + отведение + наружная ротация бедра и флексия колена',
    clinicalPhoto: PHOTO_RECTUS_FEMORIS,
  },
  popliteus: {
    plateSrc: './anatomy/mmt/openstax_lower_leg.png',
    plateTitle: 'Подколенная мышца (глубокий задний слой колена)',
    xPct: 89,
    yPct: 25,
    pressureAngleDeg: 0,
    patientAngleDeg: 180,
    poseSummary: 'Сидя или лёжа на животе, внутренняя ротация голени при согнутом колене 90°',
  },
  gastrocnemius: {
    plateSrc: './anatomy/mmt/openstax_lower_leg.png',
    plateTitle: 'Икроножная мышца (медиальная и латеральная головки)',
    xPct: 59,
    yPct: 36,
    pressureAngleDeg: -10,
    patientAngleDeg: 170,
    poseSummary: 'Лёжа на животе/спине с прямым коленом, подошвенное сгибание стопы',
  },
  soleus: {
    plateSrc: './anatomy/mmt/openstax_lower_leg.png',
    plateTitle: 'Камбаловидная мышца (глубокая задняя поверхность голени)',
    xPct: 58,
    yPct: 53,
    pressureAngleDeg: -90,
    patientAngleDeg: 90,
    poseSummary: 'Лёжа на животе с коленом, согнутым под 90° (исключение икроножной)',
  },
  'tibialis-anterior': {
    plateSrc: './anatomy/mmt/openstax_lower_leg.png',
    plateTitle: 'Передняя большеберцовая мышца (передний компартмент голени)',
    xPct: 23,
    yPct: 30,
    pressureAngleDeg: 65,
    patientAngleDeg: -115,
    poseSummary: 'Лёжа на спине, тыльное сгибание и инверсия стопы; давление вниз и в эверсию',
  },
  'tibialis-posterior': {
    plateSrc: './anatomy/mmt/openstax_lower_leg.png',
    plateTitle: 'Задняя большеберцовая мышца (глубокий задний компартмент)',
    xPct: 91,
    yPct: 52,
    pressureAngleDeg: -45,
    patientAngleDeg: 135,
    poseSummary: 'Стопа в подошвенном сгибании и инверсии; вектор к тыльному сгибанию и эверсии',
  },
  'fibularis-peroneus': {
    plateSrc: './anatomy/mmt/openstax_lower_leg.png',
    plateTitle: 'Длинная и короткая малоберцовые мышцы (латеральный компартмент)',
    xPct: 21,
    yPct: 41,
    pressureAngleDeg: 135,
    patientAngleDeg: -45,
    poseSummary: 'Стопа в подошвенном сгибании и эверсии; давление к инверсии и тыльному сгибанию',
  },
};

function resolveMusclePlateSpec(muscle: Muscle): MuscleAtlasPlateSpec {
  if (MUSCLE_PLATE_SPECS[muscle.id]) {
    return MUSCLE_PLATE_SPECS[muscle.id];
  }
  const hay = `${muscle.id} ${muscle.name} ${muscle.latinName}`.toLowerCase();
  let plateSrc = './anatomy/mmt/openstax_pelvis_thigh.png';
  let plateTitle = 'Анатомический регион скелетной мускулатуры';
  if (muscle.zone === 'head') {
    plateSrc = './anatomy/mmt/openstax_head_chewing.png';
    plateTitle = 'Мускулатура головы, мимического и жевательного комплекса';
  } else if (muscle.zone === 'cervical') {
    plateSrc =
      hay.includes('задн') || hay.includes('подзатылоч') || hay.includes('ременн') || hay.includes('выйн')
        ? './anatomy/mmt/openstax_neck_back.png'
        : hay.includes('лестнич')
        ? './anatomy/mmt/openstax_neck_lateral.png'
        : './anatomy/mmt/openstax_neck_front.png';
    plateTitle = 'Анатомический регион мышц шеи';
  } else if (muscle.zone === 'upper-limb') {
    plateSrc =
      hay.includes('предплеч') ||
      hay.includes('кист') ||
      hay.includes('пальц') ||
      hay.includes('запяст') ||
      hay.includes('ладон') ||
      hay.includes('червеобраз') ||
      hay.includes('межкостн')
        ? './anatomy/mmt/openstax_forearm.png'
        : './anatomy/mmt/openstax_upper_limb.png';
    plateTitle = 'Мышцы верхней конечности (плечо, предплечье, кисть)';
  } else if (muscle.zone === 'thoracic') {
    plateSrc =
      hay.includes('спин') ||
      hay.includes('лопат') ||
      hay.includes('ромб') ||
      hay.includes('остист') ||
      hay.includes('длиннейш') ||
      hay.includes('многораздел') ||
      hay.includes('вращател')
        ? './anatomy/mmt/openstax_pectoral_girdle.png'
        : './anatomy/mmt/openstax_thorax.png';
    plateTitle = 'Мышцы грудного отдела и плечевого пояса';
  } else if (muscle.zone === 'lumbar') {
    plateSrc =
      hay.includes('промеж') || hay.includes('тазов') || hay.includes('сфинктер') || hay.includes('задний проход')
        ? './anatomy/mmt/openstax_pelvic_floor.png'
        : hay.includes('ягодич') || hay.includes('запирател') || hay.includes('близнецов')
        ? './anatomy/mmt/openstax_pelvis_thigh.png'
        : './anatomy/mmt/openstax_abdomen.png';
    plateTitle = 'Мышцы брюшной стенки, поясницы и таза';
  } else if (muscle.zone === 'lower-limb') {
    plateSrc =
      hay.includes('стоп') || hay.includes('подошв') || hay.includes('плюсн')
        ? './anatomy/mmt/openstax_foot.png'
        : hay.includes('голен') || hay.includes('малоберц') || hay.includes('камбалов') || hay.includes('большеберц')
        ? './anatomy/mmt/openstax_lower_leg.png'
        : './anatomy/mmt/openstax_pelvis_thigh.png';
    plateTitle = 'Мышцы нижней конечности (бедро, голень, стопа)';
  }

  return {
    plateSrc,
    plateTitle,
    xPct: 50,
    yPct: 48,
    pressureAngleDeg: 90,
    patientAngleDeg: -90,
    poseSummary: `${muscle.mmt.patientPosition}. ${muscle.mmt.pressureVector}`,
  };
}

const QUICK_VECTOR_LABELS = [
  'Давление врача',
  'Движение пациента',
  'Фиксация таза',
  'Фиксация лопатки',
  'Ротация',
  'Отведение',
];

type ActiveSlideId = 'photo' | 'anatomy' | string; // string = custom photo id

interface MMTSchematicDiagramProps {
  muscle: Muscle;
}

export const MMTSchematicDiagram: React.FC<MMTSchematicDiagramProps> = ({ muscle }) => {
  const spec = useMemo(() => resolveMusclePlateSpec(muscle), [muscle]);

  const [customPhotos, setCustomPhotos] = useState<MMTCustomPhoto[]>([]);
  const [builtinPhotoArrows, setBuiltinPhotoArrows] = useState<MMTVectorArrow[]>([]);
  const [builtinAnatomyArrows, setBuiltinAnatomyArrows] = useState<MMTVectorArrow[]>([]);

  const [activeSlide, setActiveSlide] = useState<ActiveSlideId>(
    spec.clinicalPhoto ? 'photo' : 'anatomy'
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Add photo modal/panel state
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newPositionType, setNewPositionType] = useState<MMTPositionType>('supine');
  const [newPositionLabel, setNewPositionLabel] = useState('Лёжа на спине');
  const [newCaption, setNewCaption] = useState('');
  const [newImageDataUrl, setNewImageDataUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive vector arrow editor state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeArrowKind, setActiveArrowKind] =
    useState<MMTVectorArrowType>('practitioner_pressure');
  const [draftArrowLabel, setDraftArrowLabel] = useState('Давление врача');
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);

  // Dragging state for drawing new arrow or adjusting existing arrow handle
  const [drawingDraft, setDrawingDraft] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    arrowId: string;
    endpoint: 'start' | 'end';
  } | null>(null);

  const inlineStageRef = useRef<HTMLDivElement>(null);
  const lightboxStageRef = useRef<HTMLDivElement>(null);

  const refreshMedia = useCallback(async () => {
    const [photos, pArrows, aArrows] = await Promise.all([
      loadCustomPhotosForMuscle(muscle.id),
      loadOverlayArrows(`${muscle.id}::photo`),
      loadOverlayArrows(`${muscle.id}::anatomy`),
    ]);
    setCustomPhotos(photos);
    setBuiltinPhotoArrows(pArrows);
    setBuiltinAnatomyArrows(aArrows);
    return photos;
  }, [muscle.id]);

  // Reload media when muscle switches or external component updates media
  useEffect(() => {
    let active = true;
    setSelectedArrowId(null);
    setDrawingDraft(null);
    setDraggingHandle(null);
    setIsAddPhotoOpen(false);
    setConfirmDeletePhotoId(null);

    refreshMedia().then((photos) => {
      if (!active) return;
      if (photos.length > 0) {
        setActiveSlide(photos[0].id);
      } else {
        setActiveSlide(spec.clinicalPhoto ? 'photo' : 'anatomy');
      }
    });

    const handleMediaEvent = () => {
      refreshMedia();
    };
    window.addEventListener(MMT_MEDIA_UPDATED_EVENT, handleMediaEvent);
    return () => {
      active = false;
      window.removeEventListener(MMT_MEDIA_UPDATED_EVENT, handleMediaEvent);
    };
  }, [muscle.id, spec.clinicalPhoto, refreshMedia]);

  const activeCustomPhoto = useMemo(
    () => customPhotos.find((p) => p.id === activeSlide) ?? null,
    [customPhotos, activeSlide]
  );

  // Resolve what image & arrows are currently displayed
  const activeMedia = useMemo(() => {
    if (activeCustomPhoto) {
      return {
        mode: 'custom' as const,
        src: activeCustomPhoto.imageDataUrl,
        caption: activeCustomPhoto.caption || activeCustomPhoto.positionLabel,
        attribution: `Фото положения: ${activeCustomPhoto.positionLabel}`,
        arrows: activeCustomPhoto.arrows,
      };
    }
    if (activeSlide === 'photo' && spec.clinicalPhoto) {
      return {
        mode: 'photo' as const,
        src: spec.clinicalPhoto.src,
        caption: spec.clinicalPhoto.caption,
        attribution: spec.clinicalPhoto.attribution,
        arrows: builtinPhotoArrows,
      };
    }
    return {
      mode: 'anatomy' as const,
      src: spec.plateSrc,
      caption: spec.plateTitle,
      attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
      arrows: builtinAnatomyArrows,
    };
  }, [activeCustomPhoto, activeSlide, spec, builtinPhotoArrows, builtinAnatomyArrows]);

  const persistActiveArrows = useCallback(
    async (nextArrows: MMTVectorArrow[]) => {
      if (activeCustomPhoto) {
        const updated: MMTCustomPhoto = {
          ...activeCustomPhoto,
          arrows: nextArrows,
          updatedAt: new Date().toISOString(),
        };
        setCustomPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        await saveCustomPhoto(updated);
      } else if (activeMedia.mode === 'photo') {
        setBuiltinPhotoArrows(nextArrows);
        await saveOverlayArrows(`${muscle.id}::photo`, nextArrows);
      } else {
        setBuiltinAnatomyArrows(nextArrows);
        await saveOverlayArrows(`${muscle.id}::anatomy`, nextArrows);
      }
    },
    [activeCustomPhoto, activeMedia.mode, muscle.id]
  );

  const selectedArrow = useMemo(
    () => activeMedia.arrows.find((a) => a.id === selectedArrowId) ?? null,
    [activeMedia.arrows, selectedArrowId]
  );

  const toNormalizedCoords = (
    clientX: number,
    clientY: number,
    containerEl: HTMLDivElement | null
  ): { x: number; y: number } => {
    if (!containerEl) return { x: 50, y: 50 };
    const rect = containerEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 50, y: 50 };
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  };

  const handleStagePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    containerEl: HTMLDivElement | null
  ) => {
    if (!isDrawingMode) return;
    // Do not start drawing if clicking an existing handle or button
    if ((e.target as HTMLElement).dataset.arrowHandle) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pt = toNormalizedCoords(e.clientX, e.clientY, containerEl);
    setSelectedArrowId(null);
    setDrawingDraft({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
  };

  const handleStagePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    containerEl: HTMLDivElement | null
  ) => {
    if (!isDrawingMode) return;
    const pt = toNormalizedCoords(e.clientX, e.clientY, containerEl);

    if (draggingHandle) {
      const updated = activeMedia.arrows.map((a) => {
        if (a.id !== draggingHandle.arrowId) return a;
        return draggingHandle.endpoint === 'start'
          ? { ...a, x1: pt.x, y1: pt.y }
          : { ...a, x2: pt.x, y2: pt.y };
      });
      if (activeCustomPhoto) {
        setCustomPhotos((prev) =>
          prev.map((p) => (p.id === activeCustomPhoto.id ? { ...p, arrows: updated } : p))
        );
      } else if (activeMedia.mode === 'photo') {
        setBuiltinPhotoArrows(updated);
      } else {
        setBuiltinAnatomyArrows(updated);
      }
      return;
    }

    if (drawingDraft) {
      setDrawingDraft((prev) => (prev ? { ...prev, x2: pt.x, y2: pt.y } : null));
    }
  };

  const handleStagePointerUp = async () => {
    if (draggingHandle) {
      setDraggingHandle(null);
      await persistActiveArrows(activeMedia.arrows);
      return;
    }

    if (drawingDraft) {
      const dx = drawingDraft.x2 - drawingDraft.x1;
      const dy = drawingDraft.y2 - drawingDraft.y1;
      const dist = Math.hypot(dx, dy);
      setDrawingDraft(null);
      if (dist < 2.2) return; // ignore accidental tiny click

      const newArrow: MMTVectorArrow = {
        id: createEntityId('vec'),
        x1: drawingDraft.x1,
        y1: drawingDraft.y1,
        x2: drawingDraft.x2,
        y2: drawingDraft.y2,
        kind: activeArrowKind,
        label: draftArrowLabel.trim() || undefined,
      };
      const next = [...activeMedia.arrows, newArrow];
      setSelectedArrowId(newArrow.id);
      await persistActiveArrows(next);
    }
  };

  const handleDeleteArrow = async (arrowId: string) => {
    const next = activeMedia.arrows.filter((a) => a.id !== arrowId);
    if (selectedArrowId === arrowId) setSelectedArrowId(null);
    await persistActiveArrows(next);
  };

  const handleUndoArrow = async () => {
    if (activeMedia.arrows.length === 0) return;
    const next = activeMedia.arrows.slice(0, -1);
    setSelectedArrowId(null);
    await persistActiveArrows(next);
  };

  const handleClearArrows = async () => {
    setSelectedArrowId(null);
    await persistActiveArrows([]);
  };

  const handleUpdateSelectedArrow = async (patch: Partial<MMTVectorArrow>) => {
    if (!selectedArrowId) return;
    const next = activeMedia.arrows.map((a) => (a.id === selectedArrowId ? { ...a, ...patch } : a));
    await persistActiveArrows(next);
  };

  const handlePickPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1400, 0.86);
      setNewImageDataUrl(compressed);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Ошибка обработки фото');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveNewPhoto = async () => {
    if (!newImageDataUrl) {
      setUploadError('Выберите фотографию с устройства или камеры.');
      return;
    }
    const now = new Date().toISOString();
    const posDefault =
      MMT_POSITION_OPTIONS.find((p) => p.id === newPositionType)?.label ?? 'Положение ММТ';
    const photo: MMTCustomPhoto = {
      id: createEntityId('mmtimg'),
      muscleId: muscle.id,
      positionType: newPositionType,
      positionLabel: newPositionLabel.trim() || posDefault,
      caption: newCaption.trim() || `${muscle.name} — ${newPositionLabel.trim() || posDefault}`,
      imageDataUrl: newImageDataUrl,
      arrows: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveCustomPhoto(photo);
    setCustomPhotos((prev) => [...prev, photo]);
    setActiveSlide(photo.id);
    setIsAddPhotoOpen(false);
    setNewImageDataUrl('');
    setNewCaption('');
    setIsDrawingMode(true); // immediately invite specialist to draw movement arrows!
  };

  const handleDeleteCurrentCustomPhoto = async (photoId: string) => {
    await deleteCustomPhoto(photoId);
    const remaining = customPhotos.filter((p) => p.id !== photoId);
    setCustomPhotos(remaining);
    setConfirmDeletePhotoId(null);
    setSelectedArrowId(null);
    if (remaining.length > 0) {
      setActiveSlide(remaining[0].id);
    } else {
      setActiveSlide(spec.clinicalPhoto ? 'photo' : 'anatomy');
    }
  };

  const renderVectorCompass = (size = 44) => {
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.34;
    const radP = (spec.pressureAngleDeg * Math.PI) / 180;
    const px = cx + Math.cos(radP) * r;
    const py = cy + Math.sin(radP) * r;

    const radT = (spec.patientAngleDeg * Math.PI) / 180;
    const tx = cx + Math.cos(radT) * (r * 0.78);
    const ty = cy + Math.sin(radT) * (r * 0.78);

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        aria-label="Компас вектора давления ММТ"
      >
        <defs>
          <marker
            id={`comp-red-${muscle.id}`}
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#dc2626" />
          </marker>
          <marker
            id={`comp-blue-${muscle.id}`}
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#1d4ed8" />
          </marker>
        </defs>
        <circle cx={cx} cy={cy} r={size * 0.45} fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
        <line
          x1={cx}
          y1={cy}
          x2={tx}
          y2={ty}
          stroke="#1d4ed8"
          strokeWidth="1.8"
          strokeDasharray="2.5 2"
          markerEnd={`url(#comp-blue-${muscle.id})`}
        />
        <line
          x1={cx}
          y1={cy}
          x2={px}
          y2={py}
          stroke="#dc2626"
          strokeWidth="2.2"
          markerEnd={`url(#comp-red-${muscle.id})`}
        />
      </svg>
    );
  };

  const renderArrowsSvgOverlay = (stageKind: 'inline' | 'lightbox') => {
    const markerPrefix = `vec-${muscle.id}-${stageKind}`;
    const allToRender = drawingDraft
      ? [
          ...activeMedia.arrows,
          {
            id: '__draft__',
            ...drawingDraft,
            kind: activeArrowKind,
            label: draftArrowLabel.trim() || undefined,
          },
        ]
      : activeMedia.arrows;

    const draftAngle = drawingDraft
      ? Math.round(
          (Math.atan2(drawingDraft.y2 - drawingDraft.y1, drawingDraft.x2 - drawingDraft.x1) * 180) /
            Math.PI
        )
      : null;

    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 w-full h-full ${
          isDrawingMode ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
      >
        <defs>
          {(Object.keys(MMT_ARROW_KIND_META) as MMTVectorArrowType[]).map((kind) => (
            <marker
              key={kind}
              id={`${markerPrefix}-${kind}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4.2"
              markerHeight="4.2"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill={MMT_ARROW_KIND_META[kind].color} />
            </marker>
          ))}
        </defs>

        {allToRender.map((arr) => {
          const meta = MMT_ARROW_KIND_META[arr.kind];
          const isSelected = arr.id === selectedArrowId;
          const isDraft = arr.id === '__draft__';
          const midX = (arr.x1 + arr.x2) / 2;
          const midY = (arr.y1 + arr.y2) / 2;

          return (
            <g key={arr.id}>
              {/* White contrast halo */}
              <line
                x1={arr.x1}
                y1={arr.y1}
                x2={arr.x2}
                y2={arr.y2}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={isSelected ? 1.8 : 1.45}
                strokeLinecap="round"
              />
              {/* Main vector shaft */}
              <line
                x1={arr.x1}
                y1={arr.y1}
                x2={arr.x2}
                y2={arr.y2}
                stroke={meta.color}
                strokeWidth={isSelected ? 1.05 : 0.8}
                strokeDasharray={arr.kind === 'patient_action' ? '2 1.2' : undefined}
                strokeLinecap="round"
                markerEnd={`url(#${markerPrefix}-${arr.kind})`}
                opacity={isDraft ? 0.85 : 1}
                className={isDrawingMode && !isDraft ? 'pointer-events-auto cursor-pointer' : ''}
                onClick={(e) => {
                  if (!isDrawingMode || isDraft) return;
                  e.stopPropagation();
                  setSelectedArrowId(arr.id);
                }}
              />
              {/* Origin dot */}
              <circle
                cx={arr.x1}
                cy={arr.y1}
                r={isSelected ? 1.5 : 1.1}
                fill="#ffffff"
                stroke={meta.color}
                strokeWidth="0.65"
              />

              {/* Label pill rendered cleanly on SVG */}
              {arr.label && (
                <g transform={`translate(${midX}, ${Math.max(4, midY - 2.8)})`}>
                  <text
                    textAnchor="middle"
                    fontSize="2.8"
                    fontWeight="700"
                    fill="#ffffff"
                    stroke="#ffffff"
                    strokeWidth="0.9"
                    paintOrder="stroke"
                    className="select-none"
                  >
                    {arr.label}
                  </text>
                  <text
                    textAnchor="middle"
                    fontSize="2.8"
                    fontWeight="700"
                    fill={meta.color}
                    className="select-none"
                  >
                    {arr.label}
                  </text>
                </g>
              )}

              {/* Interactive drag handles when drawing mode is active */}
              {isDrawingMode && !isDraft && (
                <>
                  <circle
                    cx={arr.x1}
                    cy={arr.y1}
                    r={isSelected ? 2.2 : 1.7}
                    fill="#ffffff"
                    stroke={meta.color}
                    strokeWidth="0.7"
                    data-arrow-handle="start"
                    className="pointer-events-auto cursor-grab"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedArrowId(arr.id);
                      setDraggingHandle({ arrowId: arr.id, endpoint: 'start' });
                    }}
                  />
                  <circle
                    cx={arr.x2}
                    cy={arr.y2}
                    r={isSelected ? 2.2 : 1.7}
                    fill={meta.color}
                    stroke="#ffffff"
                    strokeWidth="0.7"
                    data-arrow-handle="end"
                    className="pointer-events-auto cursor-grab"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedArrowId(arr.id);
                      setDraggingHandle({ arrowId: arr.id, endpoint: 'end' });
                    }}
                  />
                </>
              )}
            </g>
          );
        })}

        {drawingDraft && draftAngle !== null && (
          <text
            x={Math.min(92, Math.max(8, drawingDraft.x2))}
            y={Math.max(5, drawingDraft.y2 - 3)}
            textAnchor="middle"
            fontSize="2.9"
            fontWeight="700"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth="0.8"
            paintOrder="stroke"
          >
            {draftAngle}°
          </text>
        )}
      </svg>
    );
  };

  const renderDrawingToolbar = () => (
    <div className="px-3.5 py-2.5 bg-slate-100/90 border-t border-slate-200 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(MMT_ARROW_KIND_META) as MMTVectorArrowType[]).map((kind) => {
            const meta = MMT_ARROW_KIND_META[kind];
            const active = activeArrowKind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setActiveArrowKind(kind);
                  setDraftArrowLabel(meta.shortLabel);
                  if (selectedArrow) {
                    handleUpdateSelectedArrow({ kind });
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer ${
                  active
                    ? `${meta.bgBadge} ${meta.textBadge} shadow-2xs`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{meta.shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndoArrow}
            disabled={activeMedia.arrows.length === 0}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            title="Отменить последнюю стрелку"
          >
            <Undo2 className="w-3 h-3" />
            <span>Отменить</span>
          </button>
          <button
            type="button"
            onClick={handleClearArrows}
            disabled={activeMedia.arrows.length === 0}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-700 bg-white border border-rose-200 rounded-md hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Очистить ({activeMedia.arrows.length})</span>
          </button>
        </div>
      </div>

      {/* Label input + Quick presets */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={selectedArrow ? selectedArrow.label ?? '' : draftArrowLabel}
          onChange={(e) => {
            if (selectedArrow) {
              handleUpdateSelectedArrow({ label: e.target.value });
            } else {
              setDraftArrowLabel(e.target.value);
            }
          }}
          placeholder={
            selectedArrow ? 'Подпись выбранной стрелки...' : 'Подпись для новой стрелки...'
          }
          className="flex-1 min-w-[180px] px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
        />
        {selectedArrow && (
          <button
            type="button"
            onClick={() => handleDeleteArrow(selectedArrow.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Удалить стрелку</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-slate-500">Быстрые подписи:</span>
        {QUICK_VECTOR_LABELS.map((lbl) => (
          <button
            key={lbl}
            type="button"
            onClick={() => {
              if (selectedArrow) {
                handleUpdateSelectedArrow({ label: lbl });
              } else {
                setDraftArrowLabel(lbl);
              }
            }}
            className="px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded cursor-pointer"
          >
            {lbl}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-600">
        Проведите курсором или пальцем по изображению от точки приложения силы по направлению
        вектора. Нажмите на стрелку или её крайние точки, чтобы изменить подпись или угол.
      </p>
    </div>
  );

  return (
    <>
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">
              Анатомия, фото положений и векторы ММТ: {muscle.name}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {activeCustomPhoto ? activeCustomPhoto.caption : spec.poseSummary}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddPhotoOpen((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                isAddPhotoOpen
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Загрузить фото ММТ в нужном положении"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить фото</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDrawingMode((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                isDrawingMode
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Нарисовать стрелки вектора движения прямо на изображении"
            >
              {isDrawingMode ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Готово ({activeMedia.arrows.length})</span>
                </>
              ) : (
                <>
                  <PenTool className="w-3 h-3" />
                  <span>Стрелки ({activeMedia.arrows.length})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
              title="Открыть схему крупнее"
              aria-label="Увеличить схему ММТ"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Position / Plate Switcher Bar */}
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-[11px] font-medium">
            {customPhotos.map((cp) => (
              <button
                key={cp.id}
                type="button"
                onClick={() => {
                  setActiveSlide(cp.id);
                  setSelectedArrowId(null);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeSlide === cp.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3 h-3 text-blue-700" />
                <span>{cp.positionLabel}</span>
                {cp.arrows.length > 0 && (
                  <span className="font-mono tabular-nums text-[10px] text-slate-500">
                    ({cp.arrows.length})
                  </span>
                )}
              </button>
            ))}

            {spec.clinicalPhoto && (
              <button
                type="button"
                onClick={() => {
                  setActiveSlide('photo');
                  setSelectedArrowId(null);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeSlide === 'photo'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Эталонное фото
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveSlide('anatomy');
                setSelectedArrowId(null);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSlide === 'anatomy'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Атлас мышцы
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {activeMedia.arrows.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  exportAnnotatedPhotoPng(
                    activeMedia.src,
                    activeMedia.arrows,
                    `${muscle.id}_${activeCustomPhoto?.positionLabel ?? activeMedia.mode}`
                  )
                }
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
                title="Сохранить изображение с нарисованными стрелками в PNG"
              >
                <Download className="w-3 h-3 text-blue-700" />
                <span>PNG со стрелками</span>
              </button>
            )}

            {activeCustomPhoto &&
              (confirmDeletePhotoId === activeCustomPhoto.id ? (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteCurrentCustomPhoto(activeCustomPhoto.id)}
                    className="px-2 py-1 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                  >
                    Удалить
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePhotoId(null)}
                    className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeletePhotoId(activeCustomPhoto.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  title="Удалить это фото положения"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>
        </div>

        {/* Inline Add Photo Form */}
        {isAddPhotoOpen && (
          <div className="p-3.5 bg-blue-50/60 border-b border-blue-200 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-slate-900">
                Добавить фотографию для положения ММТ ({muscle.name})
              </div>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Положение пациента
                </label>
                <select
                  value={newPositionType}
                  onChange={(e) => {
                    const nextType = e.target.value as MMTPositionType;
                    setNewPositionType(nextType);
                    const preset = MMT_POSITION_OPTIONS.find((p) => p.id === nextType);
                    if (preset && nextType !== 'custom') {
                      setNewPositionLabel(preset.label);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                >
                  {MMT_POSITION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Название вкладки (например: «Сидя, локоть 90°»)
                </label>
                <input
                  type="text"
                  value={newPositionLabel}
                  onChange={(e) => setNewPositionLabel(e.target.value)}
                  placeholder="Лёжа на спине"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Комментарий к укладке и фиксации
              </label>
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Например: Фиксация подвздошной кости противоположной рукой, тест отведения 30°"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickPhotoFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium rounded-md cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>{isCompressing ? 'Сжатие...' : 'Выбрать фото с ПК / камеры'}</span>
              </button>

              {newImageDataUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={newImageDataUrl}
                    alt="Превью фото ММТ"
                    className="w-12 h-9 object-cover rounded border border-slate-200"
                  />
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Фото готово к сохранению
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveNewPhoto}
                disabled={!newImageDataUrl || isCompressing}
                className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-semibold rounded-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Сохранить и нарисовать стрелки</span>
              </button>
            </div>

            {uploadError && <p className="text-[11px] text-rose-700">{uploadError}</p>}
          </div>
        )}

        {/* Main Image + Interactive Vector Arrows Stage */}
        <div
          className={`relative bg-white flex items-center justify-center p-2 ${
            isDrawingMode ? '' : 'cursor-zoom-in'
          }`}
          onClick={() => {
            if (!isDrawingMode) setIsLightboxOpen(true);
          }}
        >
          <div
            ref={inlineStageRef}
            onPointerDown={(e) => handleStagePointerDown(e, inlineStageRef.current)}
            onPointerMove={(e) => handleStagePointerMove(e, inlineStageRef.current)}
            onPointerUp={handleStagePointerUp}
            className="relative inline-block max-w-full select-none touch-none"
          >
            <img
              src={activeMedia.src}
              alt={`${muscle.name} — ${activeMedia.caption}`}
              className="w-full max-h-[320px] object-contain rounded block mx-auto pointer-events-none"
              loading="lazy"
            />

            {/* Exact target muscle location marker on OpenStax anatomical plate */}
            {activeMedia.mode === 'anatomy' && (
              <div
                style={{ left: `${spec.xPct}%`, top: `${spec.yPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <div className="w-7 h-7 rounded-full border-2 border-blue-700 bg-blue-600/20 flex items-center justify-center shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-700 ring-2 ring-white" />
                </div>
              </div>
            )}

            {/* Vector Arrows Overlay */}
            {(activeMedia.arrows.length > 0 || isDrawingMode) && renderArrowsSvgOverlay('inline')}
          </div>
        </div>

        {/* Interactive Vector Toolbar when drawing mode is active */}
        {isDrawingMode && renderDrawingToolbar()}

        {/* Clinical Execution & Vector Breakdown */}
        <div className="px-3.5 py-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
          <div className="flex items-start gap-3">
            {renderVectorCompass(46)}
            <div className="min-w-0 flex-1 space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                  <ArrowRight className="w-3 h-3" />
                  Вектор давления врача:
                </span>
                <span className="text-slate-800">{muscle.mmt.pressureVector}</span>
              </div>
              <div className="text-[11px] text-slate-600 leading-snug">
                <strong className="text-slate-800">Стабилизация:</strong> {muscle.mmt.stabilization}
              </div>
            </div>
          </div>

          {activeMedia.arrows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/70 text-[11px]">
              <span className="font-semibold text-slate-700">
                Стрелки на схеме ({activeMedia.arrows.length}):
              </span>
              {(Object.keys(MMT_ARROW_KIND_META) as MMTVectorArrowType[]).map((k) => {
                const count = activeMedia.arrows.filter((a) => a.kind === k).length;
                if (count === 0) return null;
                return (
                  <span key={k} className="inline-flex items-center gap-1.5 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: MMT_ARROW_KIND_META[k].color }}
                    />
                    <span>
                      {MMT_ARROW_KIND_META[k].shortLabel}: {count}
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
            <span>{activeMedia.attribution}</span>
            <span>Методика ММТ: Атлас Г. К. Кирдогло · F. Kendall · D. Walther</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal (supports drawing large precision arrows too) */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl max-h-[94vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {muscle.name} — {activeMedia.caption}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{muscle.mmt.patientPosition}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawingMode((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                    isDrawingMode
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isDrawingMode ? (
                    <>
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Закончить разметку</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Рисовать стрелки</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                  aria-label="Закрыть схему"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-white flex flex-col items-center gap-3 overflow-y-auto flex-1">
              <div className="flex flex-wrap items-center justify-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                {customPhotos.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => setActiveSlide(cp.id)}
                    className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      activeSlide === cp.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cp.positionLabel}
                  </button>
                ))}
                {spec.clinicalPhoto && (
                  <button
                    type="button"
                    onClick={() => setActiveSlide('photo')}
                    className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      activeSlide === 'photo'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Фото клинического теста (Commons)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSlide('anatomy')}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    activeSlide === 'anatomy'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Анатомическая таблица (OpenStax)
                </button>
              </div>

              <div
                ref={lightboxStageRef}
                onPointerDown={(e) => handleStagePointerDown(e, lightboxStageRef.current)}
                onPointerMove={(e) => handleStagePointerMove(e, lightboxStageRef.current)}
                onPointerUp={handleStagePointerUp}
                className="relative inline-block max-w-full select-none touch-none"
              >
                <img
                  src={activeMedia.src}
                  alt={muscle.name}
                  className="max-h-[56vh] w-auto object-contain rounded-lg mx-auto pointer-events-none"
                />
                {activeMedia.mode === 'anatomy' && (
                  <div
                    style={{ left: `${spec.xPct}%`, top: `${spec.yPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <div className="w-9 h-9 rounded-full border-2 border-blue-700 bg-blue-600/20 flex items-center justify-center shadow">
                      <div className="w-3 h-3 rounded-full bg-blue-700 ring-2 ring-white" />
                    </div>
                  </div>
                )}

                {(activeMedia.arrows.length > 0 || isDrawingMode) &&
                  renderArrowsSvgOverlay('lightbox')}
              </div>
            </div>

            {isDrawingMode && renderDrawingToolbar()}

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shrink-0">
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Положение:</span>
                <span className="text-slate-600">{muscle.mmt.patientPosition}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Стабилизация:</span>
                <span className="text-slate-600">{muscle.mmt.stabilization}</span>
              </div>
              <div>
                <span className="font-semibold text-red-700 block mb-0.5">Вектор давления:</span>
                <span className="text-slate-600">{muscle.mmt.pressureVector}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
