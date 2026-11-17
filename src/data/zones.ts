import {
  AnatomicalDivision,
  AnatomicalSide,
  AnatomicalZone,
  Muscle,
  Organ,
  SymptomProfile,
} from '../types/atlas';

export const ANATOMICAL_SIDE_META: Record<
  AnatomicalSide,
  { id: AnatomicalSide; label: string; shortLabel: string; anatomicalTerm: string }
> = {
  anterior: {
    id: 'anterior',
    label: 'Передняя поверхность (вентральная)',
    shortLabel: 'Передние',
    anatomicalTerm: 'Facies anterior / ventralis',
  },
  posterior: {
    id: 'posterior',
    label: 'Задняя поверхность (дорсальная)',
    shortLabel: 'Задние',
    anatomicalTerm: 'Facies posterior / dorsalis',
  },
};

export const ANATOMICAL_DIVISIONS: Array<{
  id: AnatomicalDivision;
  code: string;
  title: string;
  shortTitle: string;
  taLatin: string;
  description: string;
}> = [
  {
    id: 'axial',
    code: 'I. Осевой отдел',
    title: 'Осевой скелет и туловище (Голова, Шея, Грудь, Поясница и Таз)',
    shortTitle: 'Осевой отдел',
    taLatin: 'Partes axiales corporis (Caput, Collum, Thorax, Abdomen et Pelvis)',
    description:
      'Кранио-сакральная ось, 5 горизонтальных диафрагм, висцеральные полости и первичные постуральные стабилизаторы.',
  },
  {
    id: 'appendicular',
    code: 'II. Добавочный отдел',
    title: 'Добавочный скелет (Верхние и Нижние конечности)',
    shortTitle: 'Конечности',
    taLatin: 'Membra (Membrum superius et Membrum inferius)',
    description:
      'Свободные конечности, суставы-амортизаторы и дистальные сегменты миофасциальных линий рук и ног.',
  },
];

export const ANATOMICAL_ZONES: AnatomicalZone[] = [
  {
    id: 'head',
    order: 1,
    classifierCode: 'TA-01 · Caput',
    division: 'axial',
    divisionLabel: 'Осевой отдел',
    name: 'Голова и ВНЧС',
    shortName: 'Голова и ВНЧС',
    segments: 'ЧМН V, VII, XI · C0–C1',
    description:
      'Кранио-мандибулярный комплекс, жевательные и крыловидные мышцы, подзатылочная группа, ВНЧС и намёт мозжечка. Ключевая зона нисходящих постуральных дисфункций и окклюзионно-висцеральных рефлексов.',
    biomechanicalFocus:
      'Синхронизация сфенобазилярного синхондроза (СБС), балансировка окклюзии, декомпрессия краниоцервикального перехода C0–C1 и яремного отверстия.',
    anteriorAspect: {
      side: 'anterior',
      shortLabel: 'Передняя (Лицо и ВНЧС)',
      title: 'Лицевой череп, височно-нижнечелюстная и височная области',
      taLatin: 'Regiones faciales et regio temporalis (anterior)',
      landmarks: 'Скуловая дуга, ВНЧС, ветвь нижней челюсти, височная ямка, придаточные пазухи.',
      clinicalFocus: 'Окклюзия и бруксизм (жевательная, височная, крыловидные мышцы), тройничный нерв V3.',
    },
    posteriorAspect: {
      side: 'posterior',
      shortLabel: 'Задняя (Затылок C0–C1)',
      title: 'Затылочная и подзатылочная (краниоцервикальная) области',
      taLatin: 'Regio occipitalis et regio suboccipitalis (posterior)',
      landmarks: 'Наружный затылочный выступ, выйные линии, атланто-затылочный переход C0–C1, затылочно-сосцевидный шов.',
      clinicalFocus: 'Миодуральный мост к ТМО, вестибуло-окулярный рефлекс, выход позвоночной артерии и ЧМН XI.',
    },
  },
  {
    id: 'cervical',
    order: 2,
    classifierCode: 'TA-02 · Collum',
    division: 'axial',
    divisionLabel: 'Осевой отдел',
    name: 'Шейный отдел и подъязычная зона',
    shortName: 'Шея и подъяз.',
    segments: 'C1–C7 · Подъязычная кость · Плечевое сплетение',
    description:
      'Переходная зона между черепом и грудной клеткой: над- и подподъязычные мышцы, глубокие сгибатели и разгибатели шеи, ГКС, лестничные мышцы и верхняя апертура грудной клетки.',
    biomechanicalFocus:
      'Стабилизация краниоцервикального перехода C0–C2, центрирование подъязычной кости при глотании и речи, освобождение диафрагмального нерва (C3–C5) и верхней апертуры.',
    anteriorAspect: {
      side: 'anterior',
      shortLabel: 'Передняя (Горло, ГКС, лестничные)',
      title: 'Передний и латеральный треугольники шеи, подъязычная диафрагма',
      taLatin: 'Regio cervicalis anterior et lateralis (ventralis)',
      landmarks: 'Подъязычная кость, щитовидный хрящ, грудино-ключично-сосцевидная мышца, межлестничная щель, 1-е ребро.',
      clinicalFocus: 'Глубокие сгибатели шеи, ГКС и лестничные; лимфо-венозный дренаж черепа и верхняя апертура.',
    },
    posteriorAspect: {
      side: 'posterior',
      shortLabel: 'Задняя (Выйная и шейно-лопат.)',
      title: 'Задняя область шеи (выйная) и шейно-грудной переход C7–Th1',
      taLatin: 'Regio cervicalis posterior (Regio nuchae)',
      landmarks: 'Выйная связка, остистые отростки C2–C7, верхний угол лопатки, надплечье.',
      clinicalFocus: 'Реактивный гипертонус верхней трапециевидной, мышцы, поднимающей лопатку и разгибателей шеи.',
    },
  },
  {
    id: 'thoracic',
    order: 3,
    classifierCode: 'TA-03 · Thorax',
    division: 'axial',
    divisionLabel: 'Осевой отдел',
    name: 'Грудной отдел и плечевой пояс',
    shortName: 'Грудь и плечо',
    segments: 'Th1–Th12 · Рёберный каркас · Лопатка',
    description:
      'Регион основных висцеро-моторных индикаторов органов грудной полости и верхнего этажа брюшной полости, ротаторной манжеты плеча, грудных мышц и разгибателей спины.',
    biomechanicalFocus:
      'Мобилизация грудино-рёберных и рёберно-позвоночных суставов, координация лопаточно-грудного ритма и синхронизация грудобрюшной диафрагмы.',
    anteriorAspect: {
      side: 'anterior',
      shortLabel: 'Передняя (Грудная клетка)',
      title: 'Передняя грудная стенка, ключично-грудная и подмышечная области',
      taLatin: 'Regio thoracica anterior, regio pectoralis et axillaris',
      landmarks: 'Грудина, II–VI рёберные хрящи, клювовидный отросток, дельтовидно-грудная борозда, передняя зубчатая линия.',
      clinicalFocus: 'Индикаторы желудка (PMC), печени (PMS), лёгких (дельтовидная/зубчатая) и сердца (подлопаточная), малая грудная.',
    },
    posteriorAspect: {
      side: 'posterior',
      shortLabel: 'Задняя (Спина и лопатка)',
      title: 'Лопаточная, межлопаточная и грудопоясничная дорсальная области',
      taLatin: 'Regio scapularis, interscapularis et dorsalis thoracis',
      landmarks: 'Ость и медиальный край лопатки, позвонки Th1–Th12, задняя подмышечная линия, надостная/подостная ямки.',
      clinicalFocus: 'Вращательная манжета (надостная/подостная), ромбовидные, средняя/нижняя трапеция, широчайшая и разгибатели спины.',
    },
  },
  {
    id: 'lumbar',
    order: 4,
    classifierCode: 'TA-04 · Abdomen et Pelvis',
    division: 'axial',
    divisionLabel: 'Осевой отдел',
    name: 'Поясничный отдел, живот и тазовое кольцо',
    shortName: 'Поясница и таз',
    segments: 'L1–L5 · S1–S5 · Тазовое дно',
    description:
      'Опорно-силовой центр тела: передняя брюшная стенка, подвздошно-поясничная, квадратная поясницы, ягодичная группа, грушевидная, внутренняя запирательная и мышцы тазового дна.',
    biomechanicalFocus:
      'Балансировка тазового кольца, крестцово-подвздошных сочленений (КПС) и тазовой диафрагмы; устранение поясничного гиперлордоза и висцерального птоза.',
    anteriorAspect: {
      side: 'anterior',
      shortLabel: 'Передняя (Живот, пах, ППМ)',
      title: 'Передняя брюшная стенка, подвздошно-паховая и тазовая области',
      taLatin: 'Regio abdominalis anterior, inguinalis et pelvis (ventralis)',
      landmarks: 'Белая линия живота, пупочное кольцо, паховая связка, ПВПО, лобковый симфиз, малый вертел.',
      clinicalFocus: 'Прямая и косые мышцы живота, подвздошно-поясничная мышца (psoas), TFL и тазовая диафрагма.',
    },
    posteriorAspect: {
      side: 'posterior',
      shortLabel: 'Задняя (Поясница и ягодицы)',
      title: 'Поясничная, крестцовая и ягодичная области',
      taLatin: 'Regio lumbalis, sacralis et regio glutealis (dorsalis)',
      landmarks: 'XII ребро, гребень подвздошной кости, ЗВПО, КПС, крестец, большой вертел и седалищный бугор.',
      clinicalFocus: 'Квадратная мышца поясницы (m. QL), грушевидная, большая/средняя ягодичные и внутренняя запирательная мышцы.',
    },
  },
  {
    id: 'upper-limb',
    order: 5,
    classifierCode: 'TA-05 · Membrum superius',
    division: 'appendicular',
    divisionLabel: 'Добавочный отдел (конечности)',
    name: 'Верхние конечности',
    shortName: 'Верх. конечн.',
    segments: 'C5–Th1 · Плечо – Предплечье – Кисть',
    description:
      'Свободная верхняя конечность и дистальные сегменты миофасциальных линий рук: бицепс, трицепс, клювовидно-плечевая, плечелучевая мышца, сгибатели и разгибатели запястья.',
    biomechanicalFocus:
      'Освобождение фасциальных перегородок плеча, локтевого сустава, межкостной мембраны предплечья и карпального канала с проверкой шейно-грудной компрессии.',
    anteriorAspect: {
      side: 'anterior',
      shortLabel: 'Передняя (Сгибатели и ладонь)',
      title: 'Передняя область плеча, локтевая ямка, переднее предплечье и ладонь',
      taLatin: 'Regio brachii anterior, fossa cubitalis, antebrachii anterior et palma manus',
      landmarks: 'Бицепс, клювовидный отросток, локтевая ямка, карпальный канал, тенар и гипотенар.',
      clinicalFocus: 'Сгибательная и пронирующая цепь руки: бицепс, клювовидно-плечевая, плечелучевая, сгибатели кисти.',
    },
    posteriorAspect: {
      side: 'posterior',
      shortLabel: 'Задняя (Разгибатели и тыл)',
      title: 'Задняя область плеча, локтевая область, заднее предплечье и тыл кисти',
      taLatin: 'Regio brachii posterior, cubitalis posterior, antebrachii posterior et dorsum manus',
      landmarks: 'Локтевой отросток (олекранон), латеральный надмыщелок, головка лучевой кости, удерживатель разгибателей.',
      clinicalFocus: 'Разгибательная стабилизация и супинация: трицепс плеча (поджелудочная) и разгибатели кисти/пальцев.',
    },
  },
  {
    id: 'lower-limb',
    order: 6,
    classifierCode: 'TA-06 · Membrum inferius',
    division: 'appendicular',
    divisionLabel: 'Добавочный отдел (конечности)',
    name: 'Нижние конечности',
    shortName: 'Ниж. конечн.',
    segments: 'L2–S2 · Бедро – Голень – Стопа',
    description:
      'Опорно-рессорный контур тела: четырёхглавая и задняя группа бедра (хамстринги), приводящие мышцы, портняжная, подколенная, икроножная, камбаловидная, большеберцовые и малоберцовые мышцы.',
    biomechanicalFocus:
      'Устранение восходящих постуральных дисфункций от свода стопы и сустава Шопара/Лисфранка, выравнивание оси колена и сбалансированное включение стабилизаторов шага.',
    anteriorAspect: {
      side: 'anterior',
      shortLabel: 'Передняя (Бедро спереди, голень, тыл стопы)',
      title: 'Передняя и медиально-латеральная области бедра, передняя голень и тыл стопы',
      taLatin: 'Regio femoris anterior/medialis, genus anterior, cruris anterior et dorsum pedis',
      landmarks: 'Надколенник, бугристость большеберцовой кости, медиальная поверхность бедра, латеральная лодыжка, сустав Шопара.',
      clinicalFocus: 'Четырёхглавая бедра, приводящие, портняжная, передняя большеберцовая и малоберцовые стабилизаторы.',
    },
    posteriorAspect: {
      side: 'posterior',
      shortLabel: 'Задняя (Хамстринги, подкол., икры, подошва)',
      title: 'Задняя область бедра, подколенная ямка, задняя голень и подошва стопы',
      taLatin: 'Regio femoris posterior, fossa poplitea, cruris posterior et planta pedis',
      landmarks: 'Подколенная ямка, суставная щель колена сзади, ахиллово сухожилие, пяточный бугор, подошвенный апоневроз.',
      clinicalFocus: 'Хамстринги, подколенная мышца (popliteus), икроножная, камбаловидная и задняя большеберцовая мышцы.',
    },
  },
];

export function getMuscleSide(muscle: Muscle): AnatomicalSide {
  return muscle.svgRegion.view === 'posterior' ? 'posterior' : 'anterior';
}

export function getOrganSide(organ: Organ): AnatomicalSide | 'both' {
  if (organ.id === 'kidneys') return 'posterior';
  if (organ.id === 'lungs') return 'both';
  return 'anterior';
}

export function getSymptomSide(
  symptom: SymptomProfile,
  muscles: Muscle[]
): AnatomicalSide | 'both' {
  let ant = 0;
  let post = 0;
  for (const item of symptom.mmtPlan) {
    const m = muscles.find((entry) => entry.id === item.muscleId);
    if (!m) continue;
    if (m.svgRegion.view === 'posterior') post++;
    else ant++;
  }
  if (ant > 0 && post > 0) {
    if (ant >= post * 2) return 'anterior';
    if (post >= ant * 2) return 'posterior';
    return 'both';
  }
  if (post > 0) return 'posterior';
  return 'anterior';
}
