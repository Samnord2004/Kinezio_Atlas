import {
  AnatomicalSide,
  AnatomicalZoneId,
  CorrectionStep,
  PainBodyView,
  StructuralElementProfile,
} from '../types/atlas';
import { resolveJointAnatomyImage } from './structuralImages';

interface JointSeed {
  id: string;
  name: string;
  latinName: string;
  zone: AnatomicalZoneId;
  side: AnatomicalSide;
  categoryLabel: string;
  anatomyAndLocation: string;
  biomechanicsAndFunction: string;
  palpationLandmark: string;
  dysfunctionSigns: string[];
  kinesiologyTestAndProvocation: string;
  correctionSteps?: CorrectionStep[];
  relatedMuscleIds: string[];
  relatedOrganIds: string[];
  relatedDiaphragmIds: string[];
  relatedMeridianIds: string[];
  relatedChainIds: string[];
  svgCoords: { view: PainBodyView; x: number; y: number };
}

function makeJoint(seed: JointSeed): StructuralElementProfile {
  const img = resolveJointAnatomyImage(seed.id, seed.name, seed.categoryLabel);
  return {
    id: seed.id,
    kind: 'joint',
    name: seed.name,
    latinName: seed.latinName,
    zone: seed.zone,
    side: seed.side,
    categoryLabel: seed.categoryLabel,
    anatomyAndLocation: seed.anatomyAndLocation,
    biomechanicsAndFunction: seed.biomechanicsAndFunction,
    palpationLandmark: seed.palpationLandmark,
    dysfunctionSigns: seed.dysfunctionSigns,
    kinesiologyTestAndProvocation: seed.kinesiologyTestAndProvocation,
    correctionSteps: seed.correctionSteps ?? [
      {
        modality: 'Структурная / Миофасциальная',
        title: `Мягкая декомпрессия и артрокинематический релиз (${seed.name})`,
        technique:
          'Выведение сустава в позицию наименьшего натяжения с лёгкой тракцией вдоль суставной щели на выдохе пациента и ретестом ассоциированной индикаторной мышцы.',
        durationOrDose: '30–45 сек',
      },
    ],
    relatedMuscleIds: seed.relatedMuscleIds,
    relatedOrganIds: seed.relatedOrganIds,
    relatedDiaphragmIds: seed.relatedDiaphragmIds,
    relatedMeridianIds: seed.relatedMeridianIds,
    relatedChainIds: seed.relatedChainIds,
    svgCoords: seed.svgCoords,
    imageSrc: img.src,
    imageCaption: img.caption,
    imageAttribution: img.attribution,
  };
}

function mirrorJointX(view: PainBodyView, rightX: number, lat: 'r' | 'l'): number {
  const mid = view === 'anterior' ? 250 : 773;
  const dx = Math.abs(rightX - mid);
  if (view === 'anterior') {
    return lat === 'r' ? mid - dx : mid + dx;
  }
  return lat === 'r' ? mid + dx : mid - dx;
}

interface PairedJointBlueprint {
  baseId: string;
  name: string;
  latinBase: string;
  adjGender: 'm' | 'f' | 'n';
  zone: AnatomicalZoneId;
  side: AnatomicalSide;
  categoryLabel: string;
  anatomyAndLocation: string;
  biomechanicsAndFunction: string;
  palpationLandmark: string;
  dysfunctionSigns: string[];
  kinesiologyTestAndProvocation: string;
  relatedMuscleIds: string[];
  relatedOrganIds: string[];
  relatedDiaphragmIds: string[];
  relatedMeridianIds: string[];
  relatedChainIds: string[];
  view: PainBodyView;
  rightX: number;
  y: number;
}

function makePairedJoints(bp: PairedJointBlueprint): StructuralElementProfile[] {
  const latLabel = {
    m: { r: ['правый', 'dexter'], l: ['левый', 'sinister'] },
    f: { r: ['правая', 'dextra'], l: ['левая', 'sinistra'] },
    n: { r: ['правое', 'dextrum'], l: ['левое', 'sinistrum'] },
  }[bp.adjGender];

  return (['r', 'l'] as const).map((lat) => {
    const [ruSide, laSide] = latLabel[lat];
    return makeJoint({
      id: `${bp.baseId}-${lat}`,
      name: `${bp.name} (${ruSide})`,
      latinName: `${bp.latinBase} (${laSide})`,
      zone: bp.zone,
      side: bp.side,
      categoryLabel: bp.categoryLabel,
      anatomyAndLocation: bp.anatomyAndLocation,
      biomechanicsAndFunction: bp.biomechanicsAndFunction,
      palpationLandmark: bp.palpationLandmark,
      dysfunctionSigns: bp.dysfunctionSigns,
      kinesiologyTestAndProvocation: bp.kinesiologyTestAndProvocation,
      relatedMuscleIds: bp.relatedMuscleIds,
      relatedOrganIds: bp.relatedOrganIds,
      relatedDiaphragmIds: bp.relatedDiaphragmIds,
      relatedMeridianIds: bp.relatedMeridianIds,
      relatedChainIds: bp.relatedChainIds,
      svgCoords: {
        view: bp.view,
        x: mirrorJointX(bp.view, bp.rightX, lat),
        y: bp.y,
      },
    });
  });
}

// ============================================================================
// ЧАСТЬ I. КРУПНЫЕ И СРЕДНИЕ СУСТАВЫ (42 новых + 9 базовых = 51)
// Обеспечивают основные движения тела, локомоцию и перенос осевой нагрузки
// ============================================================================

const MAJOR_SINGLE_JOINTS: StructuralElementProfile[] = [
  makeJoint({
    id: 'joint-atlantoaxial-med',
    name: 'Срединный атланто-осевой сустав (C1–C2, зуб аксиса)',
    latinName: 'Articulatio atlantoaxialis mediana',
    zone: 'cervical',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Осевой скелет и шея',
    anatomyAndLocation:
      'Цилиндрическое сочленение между зубом осевого позвонка (C2), передней дугой атланта (C1) и поперечной связкой атланта.',
    biomechanicsAndFunction:
      'Обеспечивает до 50% всей ротации головы влево и вправо вокруг вертикальной оси зуба аксиса.',
    palpationLandmark:
      'Проекция задней дуги С1 и остистого отростка С2 сразу ниже затылочной ямки.',
    dysfunctionSigns: [
      'Резкое одностороннее ограничение поворота головы и субокципитальные головные боли',
      'Позитивный тест Шарпа–Пурсера (нестабильность поперечной связки — красный флаг для трастов!)',
      'Нарушение вестибуло-глазодвигательной координации',
    ],
    kinesiologyTestAndProvocation:
      'Обязательный скрининг Шарпа–Пурсера и де Клейна перед любым тестом; далее ММТ глубоких сгибателей шеи при лёгкой ротации головы.',
    relatedMuscleIds: ['suboccipitals', 'deep-neck-flexors', 'scm'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 122 },
  }),
  makeJoint({
    id: 'joint-lumbosacral-l5s1',
    name: 'Пояснично-крестцовый переход и симфиз L5–S1',
    latinName: 'Articulatio lumbosacralis (Symphysis L5–S1)',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Позвоночник и таз',
    anatomyAndLocation:
      'Опорный пояснично-крестцовый шарнир между телом L5, основанием крестца (мысом), межпозвоночным диском L5–S1 и подвздошно-поясничными связками.',
    biomechanicsAndFunction:
      'Переносит вес всего туловища и верхних конечностей на тазовое кольцо; определяет угол наклона таза и нагрузку на корешок S1.',
    palpationLandmark:
      'На 2–3 см ниже межостистого промежутка L4–L5 (уровень верхней границы гребней подвздошных костей).',
    dysfunctionSigns: [
      'Пояснично-крестцовая боль при наклоне и переходе из сидения в положение стоя',
      'Иррадиация по задней поверхности ноги (корешки L5/S1) и слабость икроножной/большой ягодичной мышц',
      'Защитный спазм квадратной мышцы поясницы и многораздельных мышц',
    ],
    kinesiologyTestAndProvocation:
      'Сравнительный ММТ большой ягодичной и разгибателей большого пальца стопы сидя vs лёжа + ТЛ зоны L5–S1.',
    relatedMuscleIds: ['gluteus-maximus', 'quadratus-lumborum', 'iliopsoas', 'erector-spinae'],
    relatedOrganIds: ['large-intestine', 'urogenital'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['bladder', 'governing'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    svgCoords: { view: 'posterior', x: 773, y: 392 },
  }),
  makeJoint({
    id: 'joint-sacrococcygeal',
    name: 'Крестцово-копчиковый симфиз (сочленение)',
    latinName: 'Articulatio sacrococcygea (Symphysis sacrococcygea)',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Позвоночник и таз',
    anatomyAndLocation:
      'Полуподвижное хрящевое соединение между верхушкой крестца и I копчиковым позвонком; место нижнего якорения твёрдой мозговой оболочки (filum terminale).',
    biomechanicsAndFunction:
      'Амортизирует посадку и передаёт натяжение тазового дна и дуральной трубы к затылку.',
    palpationLandmark:
      'Межъягодичная складка ниже заднего края S5 (пальпируется мягко и строго снаружи с согласия пациента).',
    dysfunctionSigns: [
      'Кокцигодиния (боль при сидении на твёрдом и вставании)',
      'Рецидивирующий блок затылка C0–C1 и ВНЧС после старых падений на копчик',
      'Слабость мышц тазового дна и приводящих бедра',
    ],
    kinesiologyTestAndProvocation:
      'Одновременная ТЛ на копчик и затылок при ММТ грушевидной или прямой мышцы живота.',
    relatedMuscleIds: ['pelvic-floor-muscles', 'gluteus-maximus', 'piriformis'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor', 'cranial-tentorium'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 454 },
  }),
  makeJoint({
    id: 'joint-pubic-symphysis',
    name: 'Лобковый симфиз (полуподвижное сочленение таза)',
    latinName: 'Symphysis pubica',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Позвоночник и таз',
    anatomyAndLocation:
      'Срединный фиброзно-хрящевой полусустав с межлобковым диском, соединяющий правую и левую лобковые кости спереди тазового кольца.',
    biomechanicsAndFunction:
      'Замыкает переднюю арку таза, гасит сдвиговые нагрузки при ходьбе (чередование шага) и балансирует тягу прямой мышцы живота и приводящих бедра.',
    palpationLandmark:
      'Верхний и передний край лобковых бугорков по средней линии над промежностью.',
    dysfunctionSigns: [
      'Симфизит, ARS-синдром, боль в паху и над лобком при разведении ног или повороте в постели',
      '«Ступенька» (сдвиг одной лобковой кости выше/ниже другой)',
      'Двусторонняя или односторонняя слабость приводящих бедра и прямой мышцы живота',
    ],
    kinesiologyTestAndProvocation:
      'ММТ приводящих бедра и прямой мышцы живота при ТЛ лобкового симфиза; симметричный «хлопок» при изометрическом сведении-разведении согнутых коленей.',
    relatedMuscleIds: ['hip-adductors', 'rectus-abdominis', 'pelvic-floor-muscles'],
    relatedOrganIds: ['urogenital', 'kidneys'],
    relatedDiaphragmIds: ['urogenital-diaphragm', 'pelvic-floor'],
    relatedMeridianIds: ['conception', 'liver', 'kidney'],
    relatedChainIds: ['deep-front-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 448 },
  }),
];

const MAJOR_PAIRED_BLUEPRINTS: PairedJointBlueprint[] = [
  {
    baseId: 'joint-tmj',
    name: 'Височно-нижнечелюстной сустав',
    latinBase: 'Articulatio temporomandibularis',
    adjGender: 'm',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Голова и шея',
    anatomyAndLocation:
      'Парный комбинированный сустав с внутрисуставным диском между головкой нижней челюсти и ямкой височной кости.',
    biomechanicsAndFunction:
      'Обеспечивает опускание, подъём, выдвижение и боковые смещения челюсти; синхронизирован с C0–C1 и осанкой.',
    palpationLandmark: 'На 1 см кпереди от козелка ушной раковины.',
    dysfunctionSigns: ['Щелчки, девиация челюсти, бруксизм', 'Утренние головные боли и гипертонус шеи'],
    kinesiologyTestAndProvocation: 'ММТ индикаторной мышцы при открывании рта и с тестовым ватным валиком.',
    relatedMuscleIds: ['masseter', 'temporalis', 'lateral-pterygoid', 'medial-pterygoid'],
    relatedOrganIds: ['stomach', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium', 'oral-diaphragm'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'triple-warmer'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 222,
    y: 94,
  },
  {
    baseId: 'joint-atlantooccipital',
    name: 'Атланто-затылочный сустав (C0–C1)',
    latinBase: 'Articulatio atlantooccipitalis',
    adjGender: 'm',
    zone: 'cervical',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Осевой скелет и шея',
    anatomyAndLocation:
      'Парный мыщелковый сустав между мыщелком затылочной кости и верхней суставной ямкой атланта C1.',
    biomechanicsAndFunction:
      'Осуществляет кивательные движения головы (сгибание–разгибание) и лёгкий наклон в сторону для удержания вестибулярного горизонта.',
    palpationLandmark: 'Под затылочным бугром кнаружи от средней линии за углом челюсти.',
    dysfunctionSigns: ['Компрессия C0–C1 и подзатылочная боль', 'Рефлекторный гипертонус подзатылочных мышц'],
    kinesiologyTestAndProvocation: 'ММТ глубоких сгибателей шеи при лёгком сгибании (кивке) и ТЛ зоны C0–C1.',
    relatedMuscleIds: ['suboccipitals', 'deep-neck-flexors'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'gallbladder'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    view: 'posterior',
    rightX: 785,
    y: 114,
  },
  {
    baseId: 'joint-atlantoaxial-lat',
    name: 'Латеральный атланто-осевой сустав (C1–C2)',
    latinBase: 'Articulatio atlantoaxialis lateralis',
    adjGender: 'm',
    zone: 'cervical',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Осевой скелет и шея',
    anatomyAndLocation:
      'Парный плоский скользящий сустав между нижней суставной поверхностью латеральной массы атланта и верхней суставной поверхностью аксиса.',
    biomechanicsAndFunction:
      'Направляет ротационное скольжение C1 по C2 и передаёт нагрузку от черепа на шейные дугоотростчатые суставы.',
    palpationLandmark: 'Задний бугорок поперечного отростка C1 между сосцевидным отростком и ветвью челюсти.',
    dysfunctionSigns: ['Боль при повороте головы и асимметрия нижней косой мышцы головы'],
    kinesiologyTestAndProvocation: 'Провокация ротации головы после проб допуска C1–C2 + ТЛ области C1–C2.',
    relatedMuscleIds: ['suboccipitals', 'levator-scapulae', 'scm'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'gallbladder'],
    relatedChainIds: ['spiral-line'],
    view: 'posterior',
    rightX: 787,
    y: 124,
  },
  {
    baseId: 'joint-sternoclavicular',
    name: 'Грудино-ключичный сустав (ГКС / SCJ)',
    latinBase: 'Articulatio sternoclavicularis',
    adjGender: 'm',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Пояс верхней конечности',
    anatomyAndLocation:
      'Седловидный сустав с внутрисуставным диском между грудинным концом ключицы и ключичной вырезкой рукоятки грудины.',
    biomechanicsAndFunction:
      'Единственный костный мост между рукой и осевым скелетом; обеспечивает подъём, выдвижение и ротацию ключицы.',
    palpationLandmark: 'Верхнелатеральный угол рукоятки грудины по обе стороны яремной вырезки.',
    dysfunctionSigns: ['Переднее или верхнее выпячивание головки ключицы', 'Слабость ключичной порции БГМ'],
    kinesiologyTestAndProvocation: 'ММТ ключичной БГМ при лёгком сдвиге медиального конца ключицы кзади/вниз.',
    relatedMuscleIds: ['pectoralis-major-clavicular', 'scm', 'upper-trapezius'],
    relatedOrganIds: ['lungs', 'stomach'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['kidney', 'stomach'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 232,
    y: 178,
  },
  {
    baseId: 'joint-acromioclavicular',
    name: 'Акромиально-ключичный сустав (АКС / ACJ)',
    latinBase: 'Articulatio acromioclavicularis',
    adjGender: 'm',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Пояс верхней конечности',
    anatomyAndLocation:
      'Плоский сустав между акромиальным концом ключицы и акромионом лопатки, укреплённый клювовидно-ключичной связкой.',
    biomechanicsAndFunction:
      'Тонкая подстройка положения лопатки на грудной клетке при подъёме руки выше 90° («симптом болезненной дуги 150–180°»).',
    palpationLandmark: 'Латеральный край ключицы в 2 см медиальнее наружного края акромиона.',
    dysfunctionSigns: ['Боль в верхнем полюсе плеча при горизонтальном приведении руки', 'Щелчок при жиме вверх'],
    kinesiologyTestAndProvocation: 'Тест горизонтального приведения руки + ММТ верхней трапеции и дельтовидной с ТЛ АКС.',
    relatedMuscleIds: ['upper-trapezius', 'deltoid', 'supraspinatus'],
    relatedOrganIds: ['lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['large-intestine', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 168,
    y: 184,
  },
  {
    baseId: 'joint-glenohumeral',
    name: 'Плечевой сустав (плечелопаточный)',
    latinBase: 'Articulatio humeri (glenohumeralis)',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Верхняя конечность',
    anatomyAndLocation:
      'Многоосный шаровидный сустав между головкой плечевой кости и суставной впадиной лопатки с хрящевой губой.',
    biomechanicsAndFunction:
      'Самый подвижный сустав тела (3 оси); требует динамического центрирования мышцами вращательной манжеты.',
    palpationLandmark: 'Ниже и кнаружи от клювовидного отростка / под краем акромиона.',
    dysfunctionSigns: ['Импинджмент-синдром, адгезивный капсулит', 'Переднее смещение головки плеча'],
    kinesiologyTestAndProvocation: 'ММТ надостной, подлопаточной и передней зубчатой мышц при тракции головки плеча.',
    relatedMuscleIds: ['deltoid', 'supraspinatus', 'infraspinatus', 'subscapularis', 'serratus-anterior'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['lung', 'heart', 'small-intestine', 'large-intestine'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 158,
    y: 204,
  },
  {
    baseId: 'joint-humeroulnar',
    name: 'Плечелоктевой сустав',
    latinBase: 'Articulatio humeroulnaris',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Верхняя конечность',
    anatomyAndLocation:
      'Блоковидный сустав между блоком плечевой кости и блоковидной вырезкой локтевой кости.',
    biomechanicsAndFunction:
      'Ведущий сустав сгибания и разгибания локтя; задаёт физиологический вальгусный угол (carrying angle).',
    palpationLandmark: 'Медиальная суставная щель локтя и область локтевого отростка сзади.',
    dysfunctionSigns: ['Ограничение конечного разгибания локтя', 'Медиальный эпикондилит («локоть гольфиста»)'],
    kinesiologyTestAndProvocation: 'ММТ бицепса, плечевой мышцы и трицепса с ТЛ медиальной суставной щели локтя.',
    relatedMuscleIds: ['biceps-brachii', 'triceps-brachii', 'wrist-flexors'],
    relatedOrganIds: ['small-intestine', 'heart'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['heart', 'small-intestine', 'pericardium'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 126,
    y: 308,
  },
  {
    baseId: 'joint-humeroradial',
    name: 'Плечелучевой сустав',
    latinBase: 'Articulatio humeroradialis',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Верхняя конечность',
    anatomyAndLocation:
      'Шаровидное по форме сочленение между головкой мыщелка плечевой кости и ямкой головки лучевой кости.',
    biomechanicsAndFunction:
      'Участвует в сгибании/разгибании локтя и пронации/супинации; передаёт осевой упор от кисти на плечо.',
    palpationLandmark: 'Латеральнее локтевого отростка сразу дистальнее латерального надмыщелка плеча.',
    dysfunctionSigns: ['Латеральная боль в локте («локоть теннисиста»)', 'Болезненность при упоре на ладонь'],
    kinesiologyTestAndProvocation: 'ММТ плечелучевой и разгибателей кисти при дистальном/проксимальном сдвиге лучевой кости.',
    relatedMuscleIds: ['brachioradialis', 'wrist-extensors', 'biceps-brachii'],
    relatedOrganIds: ['large-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['large-intestine', 'lung'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 114,
    y: 306,
  },
  {
    baseId: 'joint-radioulnar-prox',
    name: 'Проксимальный лучелоктевой сустав',
    latinBase: 'Articulatio radioulnaris proximalis',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Верхняя конечность',
    anatomyAndLocation:
      'Цилиндрический сустав между суставной окружностью головки лучевой кости и лучевой вырезкой локтевой кости внутри кольцевой связки.',
    biomechanicsAndFunction:
      'Обеспечивает вращение лучевой кости вокруг локтевой при пронации и супинации предплечья.',
    palpationLandmark: 'Вращающаяся головка лучевой кости в 2 см дистальнее латерального надмыщелка.',
    dysfunctionSigns: ['Подвывих/переднее смещение головки лучевой кости', 'Резкое ограничение супинации'],
    kinesiologyTestAndProvocation: 'ММТ супинатора и плечелучевой при дорсальной/вентральной провокации головки луча.',
    relatedMuscleIds: ['brachioradialis', 'biceps-brachii', 'wrist-extensors'],
    relatedOrganIds: ['large-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['large-intestine', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 118,
    y: 314,
  },
  {
    baseId: 'joint-radioulnar-dist',
    name: 'Дистальный лучелоктевой сустав (ДЛЛС)',
    latinBase: 'Articulatio radioulnaris distalis',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Верхняя конечность',
    anatomyAndLocation:
      'Цилиндрический сустав между головкой локтевой кости и локтевой вырезкой лучевой кости с треугольным фиброзно-хрящевым комплексом (TFCC).',
    biomechanicsAndFunction:
      'Замыкает ось вращения предплечья у запястья; стабилизируется квадратным пронатором.',
    palpationLandmark: 'Между шиловидным отростком локтевой кости и тылом дистальной лучевой кости.',
    dysfunctionSigns: ['Боль на ульнарной стороне запястья при вращении кисти', 'Щелчок при повороте ключа'],
    kinesiologyTestAndProvocation: 'ММТ сгибателей/разгибателей кисти при сжатии или сдвиге ДЛЛС.',
    relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['small-intestine', 'heart'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['small-intestine', 'heart', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 90,
    y: 410,
  },
  {
    baseId: 'joint-radiocarpal',
    name: 'Лучезапястный сустав',
    latinBase: 'Articulatio radiocarpea',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Верхняя конечность',
    anatomyAndLocation:
      'Эллипсовидный (мыщелковый) сустав между запястной суставной поверхностью лучевой кости, суставным диском и проксимальным рядом костей запястья (ладьевидной, полулунной, трёхгранной).',
    biomechanicsAndFunction:
      'Обеспечивает сгибание, разгибание, лучевое/локтевое отведение и циркумдукцию кисти.',
    palpationLandmark: 'Линия сгибательной складки запястья между шиловидными отростками лучевой и локтевой костей.',
    dysfunctionSigns: ['Карпальный туннельный синдром, сдвиг полулунной кости', 'Боль при отжиманиях и упоре на кисть'],
    kinesiologyTestAndProvocation: 'Проба Фалена + ММТ противопоставляющей большой палец мышцы и сгибателей запястья.',
    relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['lungs', 'large-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['lung', 'pericardium', 'heart'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 84,
    y: 416,
  },
  {
    baseId: 'joint-sacroiliac',
    name: 'Крестцово-подвздошное сочленение (КПС)',
    latinBase: 'Articulatio sacroiliaca',
    adjGender: 'n',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Позвоночник и таз',
    anatomyAndLocation:
      'Плоский тугой сустав между ушковидными поверхностями крестца и подвздошной кости, стабилизированный мощными крестцово-подвздошными и крестцово-бугорной связками.',
    biomechanicsAndFunction:
      'Выполняет микродвижения нутации/контрнутации крестца в шаге и переносит осевую нагрузку на ноги.',
    palpationLandmark: 'Зона сразу медиальнее и ниже задней верхней подвздошной ости (ЗВПО / PSIS).',
    dysfunctionSigns: ['Односторонняя боль в зоне ЗВПО с иррадиацией в ягодицу/пах', 'Асимметрия длины ног'],
    kinesiologyTestAndProvocation: 'Тест Жилле + ММТ грушевидной и большой ягодичной при ТЛ щели КПС.',
    relatedMuscleIds: ['piriformis', 'gluteus-maximus', 'gluteus-medius', 'quadratus-lumborum'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['bladder', 'kidney'],
    relatedChainIds: ['functional-lines', 'superficial-back-line'],
    view: 'posterior',
    rightX: 798,
    y: 408,
  },
  {
    baseId: 'joint-coxae',
    name: 'Тазобедренный сустав',
    latinBase: 'Articulatio coxae',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Чашеобразный сустав между головкой бедренной кости и вертлужной впадиной таза с суставной губой и связкой головки бедра.',
    biomechanicsAndFunction:
      'Основной трёхосный сустав шага и опоры; потеря разгибания или внутренней ротации перегружает поясницу.',
    palpationLandmark: 'Латеральнее пульса бедренной артерии под паховой складкой и над большим вертелом.',
    dysfunctionSigns: ['Боль в паху («С-симптом»), ограничение внутренней ротации', 'Позитивный тест Фабера'],
    kinesiologyTestAndProvocation: 'Тест Патрика–Фабера и тест Томаса + ММТ ягодичных и iliopsoas с тракцией бедра.',
    relatedMuscleIds: ['iliopsoas', 'gluteus-medius', 'gluteus-maximus', 'obturator-internus', 'hip-adductors'],
    relatedOrganIds: ['urogenital', 'gallbladder'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['gallbladder', 'liver', 'kidney'],
    relatedChainIds: ['deep-front-line', 'lateral-line', 'spiral-line'],
    view: 'anterior',
    rightX: 196,
    y: 472,
  },
  {
    baseId: 'joint-tibiofemoral',
    name: 'Коленный (бедренно-большеберцовый) сустав',
    latinBase: 'Articulatio genus (tibiofemoralis)',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Мыщелковый сустав между мыщелками бедра и большеберцовой кости с медиальным/латеральным менисками и крестообразными связками.',
    biomechanicsAndFunction:
      'Сгибание/разгибание голени с обязательным «винтовым механизмом» наружной ротации в терминальном разгибании.',
    palpationLandmark: 'Медиальная и латеральная суставные щели по бокам от связки надколенника.',
    dysfunctionSigns: ['Недостаток полного разгибания, щелчки, нестабильность', 'Дисфункция подколенной мышцы'],
    kinesiologyTestAndProvocation: 'ММТ подколенной мышцы, квадрицепса и хамстрингов + ТЛ суставной щели колена.',
    relatedMuscleIds: ['popliteus', 'quadriceps-femoris', 'hamstrings', 'gastrocnemius'],
    relatedOrganIds: ['gallbladder', 'small-intestine'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'bladder'],
    relatedChainIds: ['superficial-front-line', 'superficial-back-line', 'spiral-line'],
    view: 'anterior',
    rightX: 214,
    y: 626,
  },
  {
    baseId: 'joint-patellofemoral',
    name: 'Бедренно-надколенниковый сустав',
    latinBase: 'Articulatio patellofemoralis',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Сочленение суставной поверхности надколенника с надколенниковой поверхностью бедренной кости внутри сухожилия квадрицепса.',
    biomechanicsAndFunction:
      'Увеличивает плечо рычага четырёхглавой мышцы бедра на 30% при разгибании колена.',
    palpationLandmark: 'Контуры надколенника и суставная фасетка при расслабленной ноге.',
    dysfunctionSigns: ['Боль спереди колена при спуске по лестнице и сидении', 'Латеральный трекинг надколенника'],
    kinesiologyTestAndProvocation: 'Оценка скольжения надколенника медиально/каудально + ММТ vastus medialis.',
    relatedMuscleIds: ['quadriceps-femoris', 'tensor-fasciae-latae', 'sartorius'],
    relatedOrganIds: ['small-intestine'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'spleen'],
    relatedChainIds: ['superficial-front-line', 'lateral-line'],
    view: 'anterior',
    rightX: 214,
    y: 618,
  },
  {
    baseId: 'joint-tibiofibular-prox',
    name: 'Проксимальный межберцовый сустав',
    latinBase: 'Articulatio tibiofibularis proximalis',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Плоский сустав между головкой малоберцовой кости и малоберцовой суставной поверхностью латерального мыщелка большеберцовой кости.',
    biomechanicsAndFunction:
      'Обеспечивает амортизирующее скольжение малоберцовой кости вверх и наружную ротацию при тыльном сгибании стопы.',
    palpationLandmark: 'Головка малоберцовой кости снаружи-сзади ниже латеральной щели колена.',
    dysfunctionSigns: ['Переднее или заднее смещение головки малоберцовой кости', 'Боль по латеральному колену/голени'],
    kinesiologyTestAndProvocation: 'ММТ длинной малоберцовой мышцы и бицепса бедра при сдвиге головки кпереди/кзади.',
    relatedMuscleIds: ['fibularis-peroneus', 'hamstrings', 'popliteus'],
    relatedOrganIds: ['kidneys', 'gallbladder'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['gallbladder', 'bladder'],
    relatedChainIds: ['lateral-line', 'spiral-line'],
    view: 'posterior',
    rightX: 822,
    y: 634,
  },
  {
    baseId: 'joint-tibiofibular-dist',
    name: 'Дистальный межберцовый синдесмоз',
    latinBase: 'Syndesmosis tibiofibularis (distalis)',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Прочное фиброзное соединение между малоберцовой вырезкой большеберцовой кости и дистальным концом малоберцовой кости.',
    biomechanicsAndFunction:
      'Удерживает эластичную «вилку» голеностопного сустава, слегка расходясь при тыльном сгибании стопы.',
    palpationLandmark: 'Передний межберцовый зазор на 2–3 см выше линии голеностопного сустава.',
    dysfunctionSigns: ['Боль спереди лодыжки при приседании («высокое растяжение голеностопа»)', 'Блок тыльного сгибания'],
    kinesiologyTestAndProvocation: 'Тест сжатия берцовых костей (Squeeze test) + ММТ передней большеберцовой мышцы.',
    relatedMuscleIds: ['tibialis-anterior', 'fibularis-peroneus', 'tibialis-posterior'],
    relatedOrganIds: ['kidneys'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['gallbladder', 'stomach'],
    relatedChainIds: ['lateral-line', 'superficial-front-line'],
    view: 'anterior',
    rightX: 204,
    y: 774,
  },
  {
    baseId: 'joint-talocrural',
    name: 'Голеностопный (надтаранный) сустав',
    latinBase: 'Articulatio talocruralis',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Блоковидный сустав между вилкой берцовых костей (медиальная и латеральная лодыжки) и блоком таранной кости.',
    biomechanicsAndFunction:
      'Осуществляет тыльное и подошвенное сгибание стопы в сагиттальной плоскости при перекате шага.',
    palpationLandmark: 'Передняя суставная щель на уровне лодыжек по бокам от сухожилия передней большеберцовой.',
    dysfunctionSigns: ['Переднее смещение таранной кости после подворотов стопы', 'Ограничение тыльного сгибания'],
    kinesiologyTestAndProvocation: 'Тест выпада к стене (Lunge test) + ММТ ягодичных и малоберцовых при дорсальной коррекции таранной кости.',
    relatedMuscleIds: ['tibialis-anterior', 'soleus', 'gastrocnemius', 'tibialis-posterior'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'bladder', 'kidney'],
    relatedChainIds: ['superficial-front-line', 'superficial-back-line'],
    view: 'anterior',
    rightX: 214,
    y: 788,
  },
  {
    baseId: 'joint-subtalar',
    name: 'Подтаранный (таранно-пяточный) сустав',
    latinBase: 'Articulatio subtalaris (talocalcanea)',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — Нижняя конечность',
    anatomyAndLocation:
      'Сложный цилиндроидный сустав между задними суставными поверхностями таранной и пяточной костей.',
    biomechanicsAndFunction:
      'Обеспечивает эверсию/инверсию пятки и гасит торсионные удары при приземлении на пятку.',
    palpationLandmark: 'Пазуха предплюсны кпереди от наружной лодыжки и подлодыжечный контур пятки сзади.',
    dysfunctionSigns: ['Завал пятки в вальгус или ригидный супинационный блок', 'Восходящая торсия таза'],
    kinesiologyTestAndProvocation: 'ММТ задней большеберцовой и малоберцовых при мягкой латерально-медиальной мобилизации пяточной кости.',
    relatedMuscleIds: ['tibialis-posterior', 'fibularis-peroneus', 'soleus'],
    relatedOrganIds: ['kidneys'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['kidney', 'bladder'],
    relatedChainIds: ['spiral-line', 'deep-front-line'],
    view: 'posterior',
    rightX: 814,
    y: 806,
  },
];

// ============================================================================
// ЧАСТЬ II. МЕЛКИЕ СУСТАВЫ (308 новых + 1 обзорный рёберный = 309)
// Отвечают за гибкость позвоночника/конечностей, дыхание и ударную амортизацию
// ============================================================================

interface SpineSegSpec {
  code: string;
  idKey: string;
  zone: AnatomicalZoneId;
  y: number;
  muscles: string[];
  organs: string[];
}

const SPINE_SEGMENTS_23: SpineSegSpec[] = [
  // Cervical (6)
  { code: 'C2–C3', idKey: 'c2-c3', zone: 'cervical', y: 130, muscles: ['cervical-extensors', 'deep-neck-flexors'], organs: ['sinuses'] },
  { code: 'C3–C4', idKey: 'c3-c4', zone: 'cervical', y: 138, muscles: ['scalenes', 'levator-scapulae'], organs: ['lungs'] },
  { code: 'C4–C5', idKey: 'c4-c5', zone: 'cervical', y: 146, muscles: ['deltoid', 'supraspinatus'], organs: ['lungs'] },
  { code: 'C5–C6', idKey: 'c5-c6', zone: 'cervical', y: 154, muscles: ['biceps-brachii', 'brachioradialis'], organs: ['stomach'] },
  { code: 'C6–C7', idKey: 'c6-c7', zone: 'cervical', y: 162, muscles: ['triceps-brachii', 'wrist-extensors'], organs: ['large-intestine'] },
  { code: 'C7–Th1', idKey: 'c7-th1', zone: 'cervical', y: 170, muscles: ['pectoralis-major-clavicular', 'upper-trapezius'], organs: ['heart', 'lungs'] },
  // Thoracic (12)
  { code: 'Th1–Th2', idKey: 'th1-th2', zone: 'thoracic', y: 184, muscles: ['rhomboids', 'serratus-anterior'], organs: ['heart', 'lungs'] },
  { code: 'Th2–Th3', idKey: 'th2-th3', zone: 'thoracic', y: 196, muscles: ['rhomboids', 'pectoralis-major-sternal'], organs: ['lungs'] },
  { code: 'Th3–Th4', idKey: 'th3-th4', zone: 'thoracic', y: 208, muscles: ['serratus-anterior', 'erector-spinae'], organs: ['lungs', 'heart'] },
  { code: 'Th4–Th5', idKey: 'th4-th5', zone: 'thoracic', y: 220, muscles: ['pectoralis-major-sternal', 'erector-spinae'], organs: ['gallbladder'] },
  { code: 'Th5–Th6', idKey: 'th5-th6', zone: 'thoracic', y: 232, muscles: ['pectoralis-major-clavicular', 'latissimus-dorsi'], organs: ['stomach', 'liver'] },
  { code: 'Th6–Th7', idKey: 'th6-th7', zone: 'thoracic', y: 244, muscles: ['latissimus-dorsi', 'erector-spinae'], organs: ['pancreas', 'stomach'] },
  { code: 'Th7–Th8', idKey: 'th7-th8', zone: 'thoracic', y: 256, muscles: ['latissimus-dorsi', 'rectus-abdominis'], organs: ['pancreas'] },
  { code: 'Th8–Th9', idKey: 'th8-th9', zone: 'thoracic', y: 268, muscles: ['rectus-abdominis', 'obliques-abdominis'], organs: ['liver'] },
  { code: 'Th9–Th10', idKey: 'th9-th10', zone: 'thoracic', y: 280, muscles: ['obliques-abdominis', 'sartorius'], organs: ['kidneys'] },
  { code: 'Th10–Th11', idKey: 'th10-th11', zone: 'thoracic', y: 292, muscles: ['iliopsoas', 'quadriceps-femoris'], organs: ['small-intestine', 'kidneys'] },
  { code: 'Th11–Th12', idKey: 'th11-th12', zone: 'thoracic', y: 304, muscles: ['iliopsoas', 'erector-spinae'], organs: ['kidneys'] },
  { code: 'Th12–L1', idKey: 'th12-l1', zone: 'lumbar', y: 318, muscles: ['iliopsoas', 'quadratus-lumborum'], organs: ['kidneys', 'large-intestine'] },
  // Lumbar (5)
  { code: 'L1–L2', idKey: 'l1-l2', zone: 'lumbar', y: 332, muscles: ['iliopsoas', 'quadratus-lumborum'], organs: ['large-intestine'] },
  { code: 'L2–L3', idKey: 'l2-l3', zone: 'lumbar', y: 346, muscles: ['quadriceps-femoris', 'hip-adductors'], organs: ['small-intestine'] },
  { code: 'L3–L4', idKey: 'l3-l4', zone: 'lumbar', y: 360, muscles: ['quadriceps-femoris', 'tibialis-anterior'], organs: ['urogenital'] },
  { code: 'L4–L5', idKey: 'l4-l5', zone: 'lumbar', y: 374, muscles: ['gluteus-medius', 'tensor-fasciae-latae'], organs: ['large-intestine', 'urogenital'] },
  { code: 'L5–S1', idKey: 'l5-s1', zone: 'lumbar', y: 388, muscles: ['gluteus-maximus', 'hamstrings', 'piriformis'], organs: ['urogenital', 'large-intestine'] },
];

// 1. Дугоотростчатые (фасеточные) суставы C2–S1 (23 × 2 = 46)
const FACET_JOINTS: StructuralElementProfile[] = SPINE_SEGMENTS_23.flatMap((seg) =>
  makePairedJoints({
    baseId: `joint-facet-${seg.idKey}`,
    name: `Дугоотростчатый (фасеточный) сустав ${seg.code}`,
    latinBase: `Articulatio zygapophysialis ${seg.code}`,
    adjGender: 'm',
    zone: seg.zone,
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Фасеточные суставы позвоночника',
    anatomyAndLocation: `Парный плоский сустав между нижним суставным отростком вышележащего и верхним суставным отростком нижележащего позвонка сегмента ${seg.code}.`,
    biomechanicsAndFunction:
      'Задаёт плоскость и объём гибкости (сгибания, разгибания, ротации и бокового наклона) позвоночно-двигательного сегмента.',
    palpationLandmark: `Паравертебрально на 1.5–2 см латеральнее межостистого промежутка ${seg.code}.`,
    dysfunctionSigns: [
      `Локальный фасеточный блок ${seg.code}, болезненность при разгибании и ипсилатеральном наклоне`,
      'Рефлекторная гипотония или фасилитация мышц миотома данного сегмента',
    ],
    kinesiologyTestAndProvocation: `Дыхательная и векторая провокация сегмента ${seg.code} (ТЛ) с ММТ ассоциированной мышцы миотома.`,
    relatedMuscleIds: seg.muscles,
    relatedOrganIds: seg.organs,
    relatedDiaphragmIds: seg.zone === 'thoracic' ? ['thoracoabdominal'] : seg.zone === 'lumbar' ? ['pelvic-floor'] : ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['bladder', 'governing'],
    relatedChainIds: ['superficial-back-line', 'spiral-line'],
    view: 'posterior',
    rightX: 786,
    y: seg.y,
  })
);

// 2. Межпозвоночные симфизы C2–L5 (22, т.к. L5–S1 входит в крупные/средние)
const IV_SYMPHYSES: StructuralElementProfile[] = SPINE_SEGMENTS_23.slice(0, 22).map((seg) =>
  makeJoint({
    id: `joint-iv-symphysis-${seg.idKey}`,
    name: `Межпозвоночный симфиз (дисковый сустав) ${seg.code}`,
    latinName: `Symphysis intervertebralis ${seg.code}`,
    zone: seg.zone,
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Межпозвоночные симфизы',
    anatomyAndLocation: `Полуподвижное хрящевое соединение тел позвонков ${seg.code} через фиброзное кольцо и пульпозное ядро межпозвоночного диска.`,
    biomechanicsAndFunction:
      'Главная гидравлическая подушка вертикальной амортизации позвоночника; равномерно распределяет компрессионную нагрузку.',
    palpationLandmark: `Проекция позвоночно-двигательного сегмента ${seg.code} по средней линии спины.`,
    dysfunctionSigns: [
      `Осевая дисковая боль ${seg.code}, усиливающаяся в положении сидя и при пробе Вальсальвы`,
      'Корешковая иррадиация или слабость индикаторных мышц миотома в положении сидя/стоя при силе лёжа',
    ],
    kinesiologyTestAndProvocation: `Постуральный тест ММТ (лёжа vs сидя vs стоя) с осевой компрессией или лёгкой тракцией сегмента ${seg.code}.`,
    relatedMuscleIds: seg.muscles,
    relatedOrganIds: seg.organs,
    relatedDiaphragmIds: seg.zone === 'thoracic' ? ['thoracoabdominal'] : ['pelvic-floor'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: seg.y },
  })
);

// 3. Унковертебральные суставы Люшка C3–C7 (4 × 2 = 8)
const UNCOVERTEBRAL_JOINTS: StructuralElementProfile[] = [
  { code: 'C3–C4', idKey: 'c3-c4', y: 138, muscles: ['scalenes', 'deep-neck-flexors'] },
  { code: 'C4–C5', idKey: 'c4-c5', y: 146, muscles: ['deltoid', 'supraspinatus'] },
  { code: 'C5–C6', idKey: 'c5-c6', y: 154, muscles: ['biceps-brachii', 'brachioradialis'] },
  { code: 'C6–C7', idKey: 'c6-c7', y: 162, muscles: ['triceps-brachii', 'wrist-extensors'] },
].flatMap((lvl) =>
  makePairedJoints({
    baseId: `joint-uncovertebral-${lvl.idKey}`,
    name: `Унковертебральный сустав Люшка ${lvl.code}`,
    latinBase: `Articulatio uncovertebralis (Luschka) ${lvl.code}`,
    adjGender: 'm',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Фасеточные суставы позвоночника',
    anatomyAndLocation: `Парный микросустав между крючковидным отростком нижележащего и боковым краем тела вышележащего шейного позвонка (${lvl.code}).`,
    biomechanicsAndFunction:
      'Направляет сгибание-разгибание шеи и ограничивает избыточный боковой сдвиг; соседствует с позвоночной артерией и шейным корешком.',
    palpationLandmark: `Передне-боковая проекция тел шейных позвонков ${lvl.code} позади ГКС.`,
    dysfunctionSigns: ['Шейная радикулопатия, локальный хруст при наклоне шеи', 'Иррадиация в надплечье и руку'],
    kinesiologyTestAndProvocation: `После проб безопасности — ММТ мышц миотома ${lvl.code} при лёгком боковом сдвиге шеи.`,
    relatedMuscleIds: lvl.muscles,
    relatedOrganIds: ['sinuses', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['large-intestine', 'small-intestine'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 242,
    y: lvl.y,
  })
);

// 4. Грудино-рёберные и рёберно-позвоночные суставы (66 новых):
// 4a. Суставы головок рёбер I–XII (12 × 2 = 24)
const COSTOVERTEBRAL_HEAD_JOINTS: StructuralElementProfile[] = Array.from({ length: 12 }, (_, idx) => {
  const num = idx + 1;
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][idx];
  return makePairedJoints({
    baseId: `joint-costovertebral-head-${num}`,
    name: `Сустав головки ${roman} ребра`,
    latinBase: `Articulatio capitis costae ${roman}`,
    adjGender: 'm',
    zone: 'thoracic',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Рёберно-позвоночные и грудино-рёберные',
    anatomyAndLocation: `Сочленение головки ${roman} ребра с рёберными ямками грудных позвонков; тесно прилежит к симпатическому стволу.`,
    biomechanicsAndFunction:
      'Обеспечивает дыхательную ось подъёма и опускания ребра при вдохе/выдохе и тонкую ротацию грудной клетки.',
    palpationLandmark: `На 2 см латеральнее остистого отростка Th${num}.`,
    dysfunctionSigns: [`Инспираторный или экспираторный блок ${roman} ребра`, 'Межрёберная невралгия и вегетативный сбой'],
    kinesiologyTestAndProvocation: `ММТ грудной или ромбовидной мышцы на максимальном вдохе/выдохе с ТЛ зоны Th${num}.`,
    relatedMuscleIds: ['serratus-anterior', 'rhomboids', 'erector-spinae'],
    relatedOrganIds: num <= 5 ? ['lungs', 'heart'] : ['liver', 'stomach', 'kidneys'],
    relatedDiaphragmIds: num <= 2 ? ['hyoid-thoracic-inlet'] : ['thoracoabdominal'],
    relatedMeridianIds: ['bladder', 'lung'],
    relatedChainIds: ['spiral-line', 'lateral-line'],
    view: 'posterior',
    rightX: 794,
    y: 178 + idx * 11,
  });
}).flat();

// 4b. Рёберно-поперечные суставы I–X (10 × 2 = 20)
const COSTOTRANSVERSE_JOINTS: StructuralElementProfile[] = Array.from({ length: 10 }, (_, idx) => {
  const num = idx + 1;
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][idx];
  return makePairedJoints({
    baseId: `joint-costotransverse-${num}`,
    name: `Рёберно-поперечный сустав ${roman} ребра`,
    latinBase: `Articulatio costotransversaria ${roman}`,
    adjGender: 'm',
    zone: 'thoracic',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Рёберно-позвоночные и грудино-рёберные',
    anatomyAndLocation: `Сустав между бугорком ${roman} ребра и рёберной ямкой поперечного отростка позвонка Th${num}.`,
    biomechanicsAndFunction:
      'Задаёт вращательную траекторию ребра («ручка насоса» для верхних рёбер, «ручка ведра» для нижних).',
    palpationLandmark: `На 3 см латеральнее остистого отростка Th${num} у бугорка ${roman} ребра.`,
    dysfunctionSigns: [`Подвывих бугорка ${roman} ребра кзади/кпереди`, 'Точечная боль под лопаткой при глубоком вдохе'],
    kinesiologyTestAndProvocation: `ММТ ромбовидной или передней зубчатой при мягком надавливании на угол ${roman} ребра.`,
    relatedMuscleIds: ['erector-spinae', 'rhomboids', 'serratus-anterior'],
    relatedOrganIds: num <= 5 ? ['lungs', 'heart'] : ['stomach', 'liver'],
    relatedDiaphragmIds: num === 1 ? ['hyoid-thoracic-inlet'] : ['thoracoabdominal'],
    relatedMeridianIds: ['bladder', 'gallbladder'],
    relatedChainIds: ['lateral-line', 'spiral-line'],
    view: 'posterior',
    rightX: 804,
    y: 180 + idx * 11,
  });
}).flat();

// 4c. Грудино-рёберные суставы I–VII (7 × 2 = 14)
const STERNOCOSTAL_JOINTS: StructuralElementProfile[] = Array.from({ length: 7 }, (_, idx) => {
  const num = idx + 1;
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][idx];
  return makePairedJoints({
    baseId: `joint-sternocostal-${num}`,
    name: `Грудино-рёберное сочленение ${roman} ребра`,
    latinBase: `Articulatio sternocostalis ${roman}`,
    adjGender: 'n',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Рёберно-позвоночные и грудино-рёберные',
    anatomyAndLocation:
      num === 1
        ? 'Синхондроз хряща I ребра с рукояткой грудины — фундамент верхней грудной апертуры.'
        : `Синовиальный сустав хряща ${roman} ребра с рёберной вырезкой края грудины.`,
    biomechanicsAndFunction:
      'Амортизирует переднее расширение грудной клетки на вдохе; локализация нейролимфатических точек Чапмена в межреберьях.',
    palpationLandmark: `Парастернальный край грудины на уровне ${roman} хряща ребра.`,
    dysfunctionSigns: [`Болезненность у грудины (синдром Титце) на уровне ${roman} ребра`, 'Асимметрия подъёма груди на вдохе'],
    kinesiologyTestAndProvocation: `ТЛ парастернальной зоны ${roman} ребра + ММТ грудных мышц и подключичной зоны.`,
    relatedMuscleIds: ['pectoralis-major-clavicular', 'pectoralis-major-sternal', 'pectoralis-minor'],
    relatedOrganIds: num <= 3 ? ['lungs', 'heart'] : ['stomach', 'liver'],
    relatedDiaphragmIds: num <= 2 ? ['hyoid-thoracic-inlet'] : ['thoracoabdominal'],
    relatedMeridianIds: ['kidney', 'stomach', 'pericardium'],
    relatedChainIds: ['superficial-front-line', 'deep-front-line'],
    view: 'anterior',
    rightX: 236,
    y: 188 + idx * 14,
  });
}).flat();

// 4d. Межхрящевые суставы VI–IX рёбер (3 × 2 = 6) + 2 симфиза грудины = 8
const INTERCHONDRAL_AND_STERNAL_JOINTS: StructuralElementProfile[] = [
  ...[
    { id: '6-7', name: 'VI–VII рёбер', y: 274 },
    { id: '7-8', name: 'VII–VIII рёбер', y: 286 },
    { id: '8-9', name: 'VIII–IX рёбер', y: 298 },
  ].flatMap((ic) =>
    makePairedJoints({
      baseId: `joint-interchondral-${ic.id}`,
      name: `Межхрящевой сустав ${ic.name}`,
      latinBase: `Articulatio interchondralis (${ic.id})`,
      adjGender: 'm',
      zone: 'thoracic',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Рёберно-позвоночные и грудино-рёберные',
      anatomyAndLocation: `Подвижный сустав между смежными хрящами рёберной дуги (${ic.name}) в месте прикрепления грудобрюшной диафрагмы.`,
      biomechanicsAndFunction:
        'Обеспечивает упругое раскрытие нижней рёберной дуги при диафрагмальном вдохе и амортизацию корпуса.',
      palpationLandmark: `Нижний край передней рёберной дуги (${ic.name}).`,
      dysfunctionSigns: ['Синдром «щёлкающего ребра», колотье под рёбрами', 'Ограничение экскурсии купола диафрагмы'],
      kinesiologyTestAndProvocation: 'ММТ прямой мышцы живота и косых мышц при ТЛ рёберной дуги на вдохе.',
      relatedMuscleIds: ['rectus-abdominis', 'obliques-abdominis'],
      relatedOrganIds: ['liver', 'stomach', 'gallbladder'],
      relatedDiaphragmIds: ['thoracoabdominal'],
      relatedMeridianIds: ['liver', 'stomach', 'gallbladder'],
      relatedChainIds: ['deep-front-line', 'spiral-line'],
      view: 'anterior',
      rightX: 224,
      y: ic.y,
    })
  ),
  makeJoint({
    id: 'joint-manubriosternal',
    name: 'Рукоятко-грудинный симфиз (угол Луи)',
    latinName: 'Symphysis manubriosternalis',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Рёберно-позвоночные и грудино-рёберные',
    anatomyAndLocation:
      'Хрящевой полусустав на границе рукоятки и тела грудины на уровне II рёбер (угол грудины).',
    biomechanicsAndFunction:
      'Шарнир «ручки насоса» при дыхании: сгибается и разгибается на 2–4° на каждом вдохе.',
    palpationLandmark: 'Горизонтальный гребень на верхней трети грудины на уровне II межреберья.',
    dysfunctionSigns: ['Ригидность передней грудной стенки, поверхностное ключичное дыхание', 'Связь со стрессом (зона перикарда)'],
    kinesiologyTestAndProvocation: 'ТЛ на угол грудины при глубоком вдохе с ретестом грудинной БГМ.',
    relatedMuscleIds: ['pectoralis-major-sternal', 'pectoralis-major-clavicular'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'thoracoabdominal'],
    relatedMeridianIds: ['conception', 'pericardium'],
    relatedChainIds: ['superficial-front-line', 'deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 204 },
  }),
  makeJoint({
    id: 'joint-xiphosternal',
    name: 'Грудино-мечевидный симфиз',
    latinName: 'Symphysis xiphosternalis',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Рёберно-позвоночные и грудино-рёберные',
    anatomyAndLocation:
      'Хрящевой полусустав между нижней частью тела грудины и мечевидным отростком (крепится прямая мышца живота и передняя часть диафрагмы).',
    biomechanicsAndFunction:
      'Амортизирует передачу силы между прессом, белой линией живота и передним краем грудобрюшной диафрагмы.',
    palpationLandmark: 'Вершина подгрудинного угла под телом грудины.',
    dysfunctionSigns: ['Болезненность под ложечкой, рефлекторный спазм переднего купола диафрагмы'],
    kinesiologyTestAndProvocation: 'ММТ прямой мышцы живота при деликатной ТЛ мечевидного сочленения.',
    relatedMuscleIds: ['rectus-abdominis', 'm-thoracoabdominal-diaphragm'],
    relatedOrganIds: ['stomach', 'heart'],
    relatedDiaphragmIds: ['thoracoabdominal'],
    relatedMeridianIds: ['conception', 'stomach'],
    relatedChainIds: ['superficial-front-line', 'deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 266 },
  }),
];

// 5. Краниальные швы / синхондрозы (8) + слуховые суставы (4) = 12
const CRANIAL_AND_EAR_SMALL_JOINTS: StructuralElementProfile[] = [
  makeJoint({
    id: 'joint-sbs-synchondrosis',
    name: 'Сфенобазилярный синхондроз (СБС, шов основания черепа)',
    latinName: 'Synchondrosis sphenobasilaris',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Краниальные швы и сочленения',
    anatomyAndLocation:
      'Центральный краниосакральный шарнир основания черепа между телом клиновидной кости и базилярной частью затылочной кости.',
    biomechanicsAndFunction:
      'Ведущий центр краниального ритмического импульса (КРИ 6–12/мин), управляющий флексией/экстензией всего черепа и дуральной трубы.',
    palpationLandmark: 'Слушающий захват по Сазерленду: большие крылья сфеноида + затылочная чешуя.',
    dysfunctionSigns: ['Торсия, стрейн, компрессия СБС', 'Системное падение тонуса постуральных мышц и таза'],
    kinesiologyTestAndProvocation: 'Двойная ТЛ на висок (большие крылья) и затылок + тест вдоха/выдоха.',
    relatedMuscleIds: ['temporalis', 'suboccipitals', 'piriformis'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 82 },
  }),
  makeJoint({
    id: 'joint-suture-coronal',
    name: 'Венечный шов черепа',
    latinName: 'Sutura coronalis',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Краниальные швы и сочленения',
    anatomyAndLocation:
      'Зубчатый шов между чешуёй лобной кости и передними краями обеих теменных костей.',
    biomechanicsAndFunction:
      'Обеспечивает микроподвижность свода черепа и демпфирование передне-заднего натяжения серпа мозга.',
    palpationLandmark: 'Линия поперёк черепа на 2–3 см кзади от линии роста волос.',
    dysfunctionSigns: ['Лобные головные боли, напряжение лобно-височного перехода'],
    kinesiologyTestAndProvocation: 'ММТ индикаторной мышцы при мягкой ТЛ вдоль венечного шва на вдохе/выдохе.',
    relatedMuscleIds: ['temporalis', 'suboccipitals'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['governing', 'stomach', 'gallbladder'],
    relatedChainIds: ['superficial-back-line'],
    svgCoords: { view: 'anterior', x: 250, y: 42 },
  }),
  makeJoint({
    id: 'joint-suture-sagittal',
    name: 'Сагиттальный шов черепа',
    latinName: 'Sutura sagittalis',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Краниальные швы и сочленения',
    anatomyAndLocation:
      'Срединный шов между правой и левой теменными костями; под ним проходит верхний сагиттальный венозный синус.',
    biomechanicsAndFunction:
      'Раскрывается при краниальной флексии, регулируя венозный дренаж и баланс правого/левого полушарий.',
    palpationLandmark: 'Срединная линия свода черепа от брегмы к ламбде (проходит через GV-20).',
    dysfunctionSigns: ['Теменные боли «обручем», венозный застой черепа'],
    kinesiologyTestAndProvocation: 'Мягкое латеральное раскрытие шва (V-spread) или ТЛ точки GV-20.',
    relatedMuscleIds: ['temporalis', 'upper-trapezius'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['governing'],
    relatedChainIds: ['superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 36 },
  }),
  makeJoint({
    id: 'joint-suture-lambdoid',
    name: 'Ламбдовидный шов черепа',
    latinName: 'Sutura lambdoidea',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Краниальные швы и сочленения',
    anatomyAndLocation:
      'Шов между затылочной чешуёй и задними краями теменных костей (место проекции поперечного синуса и намёта мозжечка).',
    biomechanicsAndFunction:
      'Амортизирует натяжение намёта мозжечка и задней фасциальной цепи шеи.',
    palpationLandmark: 'Треугольная дуга в затылочно-теменной области.',
    dysfunctionSigns: ['Затылочные мигрени, спазм подзатылочных мышц'],
    kinesiologyTestAndProvocation: 'ТЛ ламбдовидного шва на вдохе/выдохе при ММТ шеи и грушевидной.',
    relatedMuscleIds: ['suboccipitals', 'upper-trapezius'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'governing'],
    relatedChainIds: ['superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 66 },
  }),
  ...makePairedJoints({
    baseId: 'joint-suture-occipitomastoid',
    name: 'Затылочно-сосцевидный шов (зона яремного отверстия)',
    latinBase: 'Sutura occipitomastoidea',
    adjGender: 'm',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — Краниальные швы и сочленения',
    anatomyAndLocation:
      'Шов между сосцевидной частью височной кости и затылочной костью; через него открывается яремное отверстие (ЧМН IX, X, XI и яремная вена).',
    biomechanicsAndFunction:
      'Критичен для свободного выхода блуждающего нерва (X) и венозного оттока из черепа.',
    palpationLandmark: 'Бороздка сразу кзади от сосцевидного отростка височной кости.',
    dysfunctionSigns: ['Вагусная дисфункция, шум в ушах, слабость ГКС/трапеции', 'Утренние распирающие головные боли'],
    kinesiologyTestAndProvocation: 'ТЛ зоны сразу за мочкой уха с ретестом висцеральных индикаторных мышц (БГМ/широчайшая).',
    relatedMuscleIds: ['scm', 'upper-trapezius', 'suboccipitals'],
    relatedOrganIds: ['stomach', 'heart', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['gallbladder', 'triple-warmer', 'bladder'],
    relatedChainIds: ['lateral-line', 'deep-front-line'],
    view: 'posterior',
    rightX: 794,
    y: 88,
  }),
  ...makePairedJoints({
    baseId: 'joint-suture-squamous',
    name: 'Чешуйчатый (височно-теменной) шов',
    latinBase: 'Sutura squamosa',
    adjGender: 'm',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Краниальные швы и сочленения',
    anatomyAndLocation:
      'Косой перекрывающий шов между чешуёй височной кости и нижним краем теменной кости (траектория Temporal Tap).',
    biomechanicsAndFunction:
      'Допускает ротационное «колесообразное» скольжение височной кости при краниальном дыхании и жевании.',
    palpationLandmark: 'Дугообразная линия вокруг ушной раковины под височной мышцей.',
    dysfunctionSigns: ['Височные боли, блок височной кости при дисфункции ВНЧС', 'Асимметрия слуха и прикуса'],
    kinesiologyTestAndProvocation: 'ТЛ дуги шва или проба височного простукивания (Temporal Tap) с ретестом.',
    relatedMuscleIds: ['temporalis', 'masseter'],
    relatedOrganIds: ['gallbladder', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['gallbladder', 'triple-warmer'],
    relatedChainIds: ['lateral-line'],
    view: 'anterior',
    rightX: 218,
    y: 66,
  }),
  ...makePairedJoints({
    baseId: 'joint-incudomalleolar',
    name: 'Наковальне-молоточковый сустав среднего уха',
    latinBase: 'Articulatio incudomallearis',
    adjGender: 'm',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Суставы слуховых косточек',
    anatomyAndLocation:
      'Миниатюрный седловидный сустав в барабанной полости височной кости между головкой молоточка и телом наковальни.',
    biomechanicsAndFunction:
      'Передаёт и усиливает акустические колебания барабанной перепонки во внутреннее ухо.',
    palpationLandmark: 'Глубокая проекция барабанной полости кзади от ВНЧС (оценивается косвенно через височную кость).',
    dysfunctionSigns: ['Гиперакузия, тиннитус при дисфункции ВНЧС и медиальной крыловидной мышцы'],
    kinesiologyTestAndProvocation: 'ММТ при акустической/челюстной провокации и мягком ушном релизе височной кости.',
    relatedMuscleIds: ['temporalis', 'medial-pterygoid'],
    relatedOrganIds: ['sinuses', 'kidneys'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['triple-warmer', 'gallbladder', 'small-intestine'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 214,
    y: 80,
  }),
  ...makePairedJoints({
    baseId: 'joint-incudostapedial',
    name: 'Наковальне-стременной сустав среднего уха',
    latinBase: 'Articulatio incudostapedia',
    adjGender: 'm',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Суставы слуховых косточек',
    anatomyAndLocation:
      'Самый маленький шаровидный сустав тела человека между длинной ножкой наковальни и головкой стремени.',
    biomechanicsAndFunction:
      'Трансформирует колебания слуховой цепи на овальное окно улитки; защищается стременной мышцей от сверхгромких звуков.',
    palpationLandmark: 'Внутренняя проекция пирамиды височной кости.',
    dysfunctionSigns: ['Заложенность уха, шумовая утомляемость на фоне спазма ВНЧС/лицевого нерва'],
    kinesiologyTestAndProvocation: 'Тест ТЛ височной кости и ВНЧС при звуковой провокации.',
    relatedMuscleIds: ['temporalis', 'masseter'],
    relatedOrganIds: ['kidneys', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['triple-warmer', 'kidney'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 216,
    y: 84,
  }),
];

// 6. Мелкие суставы кисти (56 новых = 28 × 2 R/L)
const HAND_SMALL_JOINTS: StructuralElementProfile[] = [
  ...makePairedJoints({
    baseId: 'joint-midcarpal',
    name: 'Среднезапястный сустав кисти',
    latinBase: 'Articulatio mediocarpalis',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Кисть и запястье',
    anatomyAndLocation:
      'S-образный сустав между проксимальным и дистальным рядами костей запястья.',
    biomechanicsAndFunction:
      'Добавляет до 40% сгибания/разгибания кисти и обеспечивает тонкую пластичность свода ладони.',
    palpationLandmark: 'На 1.5 см дистальнее линии лучезапястного сустава по тылу кисти.',
    dysfunctionSigns: ['Тугоподвижность запястья после падения на ладонь', 'Снижение силы хвата'],
    kinesiologyTestAndProvocation: 'ММТ сгибателей/разгибателей кисти при тыльно-ладонной провокации рядов запястья.',
    relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['lungs', 'heart'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['pericardium', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 78,
    y: 424,
  }),
  ...makePairedJoints({
    baseId: 'joint-pisiform',
    name: 'Сустав гороховидной кости',
    latinBase: 'Articulatio ossis pisiformis',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Кисть и запястье',
    anatomyAndLocation:
      'Отдельный плоский сустав между гороховидной и трёхгранной костями на ульнарном крае запястья (вход в канал Гийона).',
    biomechanicsAndFunction:
      'Усиливает рычаг локтевого сгибателя запястья и защищает локтевой нерв.',
    palpationLandmark: 'Подвижная «горошина» у основания гипотенара (точка HT-7).',
    dysfunctionSigns: ['Боль при упоре в ладонь, парестезия IV–V пальцев (синдром канала Гийона)'],
    kinesiologyTestAndProvocation: 'ММТ отводящей мизинец мышцы при смещении гороховидной кости.',
    relatedMuscleIds: ['wrist-flexors', 'm-flexor-carpi-ulnaris-r', 'm-abductor-digiti-minimi-manus-r'],
    relatedOrganIds: ['heart', 'small-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['heart', 'small-intestine'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 88,
    y: 422,
  }),
  ...[
    { id: 'scapholunate', name: 'Ладьевидно-полулунный межзапястный сустав', latin: 'Art. intercarpalis scapholunata', x: 74, y: 422 },
    { id: 'lunotriquetral', name: 'Полулунно-трёхгранный межзапястный сустав', latin: 'Art. intercarpalis lunotriquetralis', x: 82, y: 422 },
    { id: 'trapeziotrapezoid', name: 'Трапециевидно-трапециевидный сустав', latin: 'Art. intercarpalis trapeziotrapezoidea', x: 72, y: 428 },
    { id: 'capitohamate', name: 'Головчато-крючковидный сустав', latin: 'Art. intercarpalis capitohamata', x: 82, y: 428 },
  ].flatMap((ic) =>
    makePairedJoints({
      baseId: `joint-intercarpal-${ic.id}`,
      name: ic.name,
      latinBase: ic.latin,
      adjGender: 'm',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Кисть и запястье',
      anatomyAndLocation: 'Межзапястное сочленение, стабилизированное прочными межкостными связками запястья.',
      biomechanicsAndFunction: 'Амортизирует ударную нагрузку на запястье и распределяет тягу сухожилий предплечья.',
      palpationLandmark: 'Соответствующий сектор тыла запястья между рядами костей.',
      dysfunctionSigns: ['Локальный хруст, слабость щипкового и силового хвата'],
      kinesiologyTestAndProvocation: 'ТЛ соответствующего сектора запястья с ММТ сгибателей кисти.',
      relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
      relatedOrganIds: ['lungs'],
      relatedDiaphragmIds: [],
      relatedMeridianIds: ['pericardium', 'lung'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: ic.x,
      y: ic.y,
    })
  ),
  ...['I', 'II', 'III', 'IV', 'V'].flatMap((roman, idx) =>
    makePairedJoints({
      baseId: `joint-cmc-hand-${idx + 1}`,
      name: `Запястно-пястный сустав ${roman} пальца кисти`,
      latinBase: `Articulatio carpometacarpalis ${roman} manus`,
      adjGender: 'm',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Кисть и запястье',
      anatomyAndLocation:
        idx === 0
          ? 'Седловидный сустав между костью-трапецией и I пястной костью — обеспечивает противопоставление большого пальца.'
          : `Малоподвижный сустав между дистальным рядом запястья и основанием ${roman} пястной кости.`,
      biomechanicsAndFunction:
        idx === 0 ? 'Ключ к захвату и оппозиции I пальца.' : 'Стабилизирует поперечный свод кисти и прочную опору пястья.',
      palpationLandmark: `Основание ${roman} пястной кости со стороны тыла/ладони.`,
      dysfunctionSigns: [idx === 0 ? 'Ризартроз (боль у основания большого пальца)' : `Боль у основания ${roman} пястной кости`],
      kinesiologyTestAndProvocation: 'ММТ мышц тенара/гипотенара при тракции или сдвиге основания пястной кости.',
      relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
      relatedOrganIds: idx === 0 ? ['lungs'] : ['large-intestine', 'heart'],
      relatedDiaphragmIds: [],
      relatedMeridianIds: idx <= 1 ? ['lung', 'large-intestine'] : ['pericardium', 'heart'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: 66 + idx * 5,
      y: 432,
    })
  ),
  ...[
    { id: '2-3', name: 'II–III', x: 74 },
    { id: '3-4', name: 'III–IV', x: 79 },
    { id: '4-5', name: 'IV–V', x: 84 },
  ].flatMap((im) =>
    makePairedJoints({
      baseId: `joint-intermetacarpal-${im.id}`,
      name: `Межпястный сустав (${im.name} пястные кости)`,
      latinBase: `Articulatio intermetacarpalis (${im.id})`,
      adjGender: 'm',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Кисть и запястье',
      anatomyAndLocation: `Плоское сочленение между основаниями ${im.name} пястных костей.`,
      biomechanicsAndFunction: 'Допускает лёгкую деформацию поперечного свода кисти при обхвате предметов.',
      palpationLandmark: `Основания ${im.name} пястных костей по тылу кисти.`,
      dysfunctionSigns: ['Скованность пястного свода после длительной работы рукой'],
      kinesiologyTestAndProvocation: 'Тест сдвига пястных костей вверх-вниз с ретестом разгибателей пальцев.',
      relatedMuscleIds: ['wrist-extensors', 'wrist-flexors'],
      relatedOrganIds: [],
      relatedDiaphragmIds: [],
      relatedMeridianIds: ['triple-warmer', 'pericardium'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: im.x,
      y: 438,
    })
  ),
  ...['I', 'II', 'III', 'IV', 'V'].flatMap((roman, idx) =>
    makePairedJoints({
      baseId: `joint-mcp-hand-${idx + 1}`,
      name: `Пястно-фаланговый сустав ${roman} пальца кисти`,
      latinBase: `Articulatio metacarpophalangea ${roman} manus`,
      adjGender: 'm',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Кисть и запястье',
      anatomyAndLocation: `Шаровидно-мыщелковый сустав между головкой ${roman} пястной кости и основанием проксимальной фаланги.`,
      biomechanicsAndFunction: 'Обеспечивает сгибание, разгибание и отведение-приведение пальца.',
      palpationLandmark: `Костяшка ${roman} пястно-фалангового сустава.`,
      dysfunctionSigns: ['Тугоподвижность «костяшек», боль при сжатии кулака'],
      kinesiologyTestAndProvocation: `Изолированный ММТ сгибания/отведения ${roman} пальца + лёгкая дистракция.`,
      relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
      relatedOrganIds: idx === 0 ? ['lungs'] : ['heart', 'large-intestine'],
      relatedDiaphragmIds: [],
      relatedMeridianIds: idx === 0 ? ['lung'] : idx === 1 ? ['large-intestine'] : ['pericardium', 'heart'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: 60 + idx * 6,
      y: 454,
    })
  ),
  // Межфаланговые суставы кисти: 9 суставов × 2 = 18
  ...[
    { id: 'ip-1', name: 'Межфаланговый сустав I (большого) пальца кисти', latin: 'Art. interphalangea I manus', x: 56, y: 462 },
    { id: 'pip-2', name: 'Проксимальный межфаланговый сустав II пальца кисти', latin: 'Art. interphalangea proximalis II manus', x: 64, y: 468 },
    { id: 'dip-2', name: 'Дистальный межфаланговый сустав II пальца кисти', latin: 'Art. interphalangea distalis II manus', x: 64, y: 478 },
    { id: 'pip-3', name: 'Проксимальный межфаланговый сустав III пальца кисти', latin: 'Art. interphalangea proximalis III manus', x: 70, y: 470 },
    { id: 'dip-3', name: 'Дистальный межфаланговый сустав III пальца кисти', latin: 'Art. interphalangea distalis III manus', x: 70, y: 482 },
    { id: 'pip-4', name: 'Проксимальный межфаланговый сустав IV пальца кисти', latin: 'Art. interphalangea proximalis IV manus', x: 76, y: 468 },
    { id: 'dip-4', name: 'Дистальный межфаланговый сустав IV пальца кисти', latin: 'Art. interphalangea distalis IV manus', x: 76, y: 478 },
    { id: 'pip-5', name: 'Проксимальный межфаланговый сустав V пальца кисти', latin: 'Art. interphalangea proximalis V manus', x: 82, y: 464 },
    { id: 'dip-5', name: 'Дистальный межфаланговый сустав V пальца кисти', latin: 'Art. interphalangea distalis V manus', x: 82, y: 472 },
  ].flatMap((ip) =>
    makePairedJoints({
      baseId: `joint-${ip.id}`,
      name: ip.name,
      latinBase: ip.latin,
      adjGender: 'm',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Кисть и запястье',
      anatomyAndLocation: 'Блоковидный одноосный сустав между смежными фалангами пальца кисти с коллатеральными связками.',
      biomechanicsAndFunction: 'Обеспечивает точное сгибание и разгибание сегментов пальцев при мелкой моторике.',
      palpationLandmark: 'Тыльные складки соответствующей фаланги пальца.',
      dysfunctionSigns: ['Локальное уплотнение капсулы, «щёлкающий палец», утренняя скованность'],
      kinesiologyTestAndProvocation: 'Изолированный ММТ сгибателя фаланги с мягкой тракцией сустава.',
      relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
      relatedOrganIds: [],
      relatedDiaphragmIds: [],
      relatedMeridianIds: ['lung', 'large-intestine', 'heart', 'small-intestine'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: ip.x,
      y: ip.y,
    })
  ),
];

// 7. Мелкие суставы стопы (58 новых = 29 × 2 R/L)
const FOOT_SMALL_JOINTS: StructuralElementProfile[] = [
  ...makePairedJoints({
    baseId: 'joint-talocalcaneonavicular',
    name: 'Таранно-пяточно-ладьевидный сустав (медиальная часть Шопара)',
    latinBase: 'Articulatio talocalcaneonavicularis',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
    anatomyAndLocation:
      'Шаровидный комплексный сустав между головкой таранной кости, ладьевидной костью и пружинной связкой пятки.',
    biomechanicsAndFunction:
      'Управляет высотой медиального продольного свода и адаптацией стопы к неровностям грунта.',
    palpationLandmark: 'Медиальный край стопы кпереди от лодыжки вплоть до бугристости ладьевидной кости.',
    dysfunctionSigns: ['Опущение ладьевидной кости, плоскостопие, боль в своде'],
    kinesiologyTestAndProvocation: 'ММТ задней большеберцовой мышцы и psoas при подъёме ладьевидной кости.',
    relatedMuscleIds: ['tibialis-posterior', 'tibialis-anterior'],
    relatedOrganIds: ['kidneys'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['spleen', 'kidney'],
    relatedChainIds: ['deep-front-line', 'spiral-line'],
    view: 'anterior',
    rightX: 222,
    y: 804,
  }),
  ...makePairedJoints({
    baseId: 'joint-calcaneocuboid',
    name: 'Пяточно-кубовидный сустав (латеральная часть Шопара)',
    latinBase: 'Articulatio calcaneocuboidalis',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
    anatomyAndLocation:
      'Седловидный сустав между передней поверхностью пяточной кости и кубовидной костью.',
    biomechanicsAndFunction:
      'Формирует жёсткий латеральный рычаг отталкивания и служит шкивом для длинной малоберцовой мышцы.',
    palpationLandmark: 'По латеральному краю стопы кпереди от пяточного бугра и позади основания V плюсневой кости.',
    dysfunctionSigns: ['Подошвенное провисание кубовидной кости («синдром кубовидной кости»)', 'Боль после подворота стопы'],
    kinesiologyTestAndProvocation: 'ММТ длинной малоберцовой мышцы и TFL при ТЛ кубовидной кости.',
    relatedMuscleIds: ['fibularis-peroneus', 'tensor-fasciae-latae'],
    relatedOrganIds: ['gallbladder'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['bladder', 'gallbladder'],
    relatedChainIds: ['lateral-line', 'spiral-line'],
    view: 'anterior',
    rightX: 204,
    y: 808,
  }),
  ...[
    { id: 'cuneonavicular', name: 'Клиноладьевидный сустав стопы', latin: 'Art. cuneonavicularis', x: 218, y: 814 },
    { id: 'intercuneiform-med', name: 'Медиально-промежуточный межклиновидный сустав', latin: 'Art. intercuneiformis medialis', x: 220, y: 818 },
    { id: 'intercuneiform-lat', name: 'Промежуточно-латеральный межклиновидный сустав', latin: 'Art. intercuneiformis lateralis', x: 214, y: 818 },
    { id: 'cuboideocuneiform', name: 'Кубовидно-клиновидный сустав стопы', latin: 'Art. cuneocuboidea', x: 208, y: 816 },
  ].flatMap((ts) =>
    makePairedJoints({
      baseId: `joint-${ts.id}`,
      name: ts.name,
      latinBase: ts.latin,
      adjGender: 'm',
      zone: 'lower-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
      anatomyAndLocation: 'Плоский сустав среднего отдела стопы, формирующий поперечную и продольную амортизацию.',
      biomechanicsAndFunction: 'Преобразует стопу из гибкого амортизатора (пронация) в жёсткий рычаг толчка (супинация).',
      palpationLandmark: 'Тыльный свод среднего отдела стопы кпереди от ладьевидной кости.',
      dysfunctionSigns: ['Боль в подъёме стопы при опоре на носок', 'Рефлекторная слабость передней большеберцовой'],
      kinesiologyTestAndProvocation: 'ТЛ соответствующего сустава среднего отдела с ретестом большеберцовых мышц.',
      relatedMuscleIds: ['tibialis-anterior', 'tibialis-posterior', 'fibularis-peroneus'],
      relatedOrganIds: ['stomach', 'pancreas'],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: ['stomach', 'spleen'],
      relatedChainIds: ['deep-front-line', 'superficial-front-line'],
      view: 'anterior',
      rightX: ts.x,
      y: ts.y,
    })
  ),
  ...['I', 'II', 'III', 'IV', 'V'].flatMap((roman, idx) =>
    makePairedJoints({
      baseId: `joint-tmt-foot-${idx + 1}`,
      name: `Предплюсне-плюсневый сустав Лисфранка (${roman} луч)`,
      latinBase: `Articulatio tarsometatarsea ${roman} (Lisfranc)`,
      adjGender: 'm',
      zone: 'lower-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
      anatomyAndLocation: `Плоское сочленение между клиновидными/кубовидной костями и основанием ${roman} плюсневой кости.`,
      biomechanicsAndFunction: 'Формирует ключевую арку Лисфранка для передачи силы при отталкивании передним отделом стопы.',
      palpationLandmark: `Тыл стопы у основания ${roman} плюсневой кости.`,
      dysfunctionSigns: [`Блок ${roman} луча стопы`, 'Боль в плюсне при беге и прыжках'],
      kinesiologyTestAndProvocation: `Сдвиг основания ${roman} плюсневой кости вверх-вниз при ММТ малоберцовых или ягодичных.`,
      relatedMuscleIds: ['tibialis-anterior', 'fibularis-peroneus', 'tibialis-posterior'],
      relatedOrganIds: ['stomach', 'gallbladder'],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: ['stomach', 'liver', 'gallbladder', 'bladder'],
      relatedChainIds: ['superficial-front-line', 'lateral-line'],
      view: 'anterior',
      rightX: 224 - idx * 5,
      y: 824,
    })
  ),
  ...[
    { id: '1-2', name: 'I–II', x: 222 },
    { id: '2-3', name: 'II–III', x: 217 },
    { id: '3-4', name: 'III–IV', x: 212 },
    { id: '4-5', name: 'IV–V', x: 207 },
  ].flatMap((im) =>
    makePairedJoints({
      baseId: `joint-intermetatarsal-${im.id}`,
      name: `Межплюсневый сустав (${im.name} плюсневые кости)`,
      latinBase: `Articulatio intermetatarsea (${im.id})`,
      adjGender: 'm',
      zone: 'lower-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
      anatomyAndLocation: `Сочленение между основаниями ${im.name} плюсневых костей, укреплённое межкостными связками.`,
      biomechanicsAndFunction: 'Демпфирует распластывание поперечного свода стопы при нагрузке на передний отдел.',
      palpationLandmark: `Межплюсневые промежутки проксимального тыла стопы (${im.name}).`,
      dysfunctionSigns: ['Поперечное плоскостопие, метатарзалгия, натоптыши'],
      kinesiologyTestAndProvocation: 'Поперечное сжатие плюсневых костей с оценкой индикаторной мышцы.',
      relatedMuscleIds: ['fibularis-peroneus', 'tibialis-posterior'],
      relatedOrganIds: [],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: ['stomach', 'liver'],
      relatedChainIds: ['deep-front-line'],
      view: 'anterior',
      rightX: im.x,
      y: 830,
    })
  ),
  ...['I', 'II', 'III', 'IV', 'V'].flatMap((roman, idx) =>
    makePairedJoints({
      baseId: `joint-mtp-foot-${idx + 1}`,
      name: `Плюсне-фаланговый сустав ${roman} пальца стопы`,
      latinBase: `Articulatio metatarsophalangea ${roman} pedis`,
      adjGender: 'm',
      zone: 'lower-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
      anatomyAndLocation: `Эллипсовидный сустав между головкой ${roman} плюсневой кости и проксимальной фалангой пальца стопы.`,
      biomechanicsAndFunction:
        idx === 0
          ? 'Главный шарнир переката шага (требует минимум 60° тыльного сгибания для включения большой ягодичной!).'
          : 'Обеспечивает баланс и опору при финальном отталкивании стопы.',
      palpationLandmark: `Подушечка и тыльный контур головки ${roman} плюсневой кости.`,
      dysfunctionSigns: [idx === 0 ? 'Hallux rigidus / valgus, срыв отталкивания и слабость ягодичной' : 'Метатарзалгия, молоткообразная деформация'],
      kinesiologyTestAndProvocation: `Пассивное тыльное сгибание ${roman} пальца + ММТ большой ягодичной и сгибателей пальцев.`,
      relatedMuscleIds: ['gastrocnemius', 'soleus', 'gluteus-maximus', 'tibialis-anterior'],
      relatedOrganIds: idx === 0 ? ['liver', 'stomach'] : ['gallbladder', 'kidneys'],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: idx === 0 ? ['liver', 'spleen'] : ['stomach', 'gallbladder', 'bladder'],
      relatedChainIds: ['superficial-back-line', 'superficial-front-line'],
      view: 'anterior',
      rightX: 226 - idx * 6,
      y: 840,
    })
  ),
  // Межфаланговые суставы стопы: 9 суставов × 2 = 18
  ...[
    { id: 'foot-ip-1', name: 'Межфаланговый сустав I (большого) пальца стопы', latin: 'Art. interphalangea I pedis', x: 226, y: 848 },
    { id: 'foot-pip-2', name: 'Проксимальный межфаланговый сустав II пальца стопы', latin: 'Art. interphalangea proximalis II pedis', x: 220, y: 847 },
    { id: 'foot-dip-2', name: 'Дистальный межфаланговый сустав II пальца стопы', latin: 'Art. interphalangea distalis II pedis', x: 220, y: 854 },
    { id: 'foot-pip-3', name: 'Проксимальный межфаланговый сустав III пальца стопы', latin: 'Art. interphalangea proximalis III pedis', x: 214, y: 847 },
    { id: 'foot-dip-3', name: 'Дистальный межфаланговый сустав III пальца стопы', latin: 'Art. interphalangea distalis III pedis', x: 214, y: 853 },
    { id: 'foot-pip-4', name: 'Проксимальный межфаланговый сустав IV пальца стопы', latin: 'Art. interphalangea proximalis IV pedis', x: 208, y: 846 },
    { id: 'foot-dip-4', name: 'Дистальный межфаланговый сустав IV пальца стопы', latin: 'Art. interphalangea distalis IV pedis', x: 208, y: 852 },
    { id: 'foot-pip-5', name: 'Проксимальный межфаланговый сустав V пальца стопы', latin: 'Art. interphalangea proximalis V pedis', x: 202, y: 845 },
    { id: 'foot-dip-5', name: 'Дистальный межфаланговый сустав V пальца стопы', latin: 'Art. interphalangea distalis V pedis', x: 202, y: 850 },
  ].flatMap((ip) =>
    makePairedJoints({
      baseId: `joint-${ip.id}`,
      name: ip.name,
      latinBase: ip.latin,
      adjGender: 'm',
      zone: 'lower-limb',
      side: 'anterior',
      categoryLabel: 'Мелкие суставы — Стопа и предплюсна',
      anatomyAndLocation: 'Блоковидный сустав фаланг пальца стопы.',
      biomechanicsAndFunction: 'Адаптация пальцев стопы к микрорельефу опоры и распределение нагрузки толчка.',
      palpationLandmark: 'Межфаланговый сустав соответствующего пальца стопы.',
      dysfunctionSigns: ['Молоткообразное сгибание пальцев, мозоли, потеря опоры'],
      kinesiologyTestAndProvocation: 'Мягкая тракция фаланги при ММТ малоберцовых / длинного сгибателя пальцев.',
      relatedMuscleIds: ['tibialis-anterior', 'gastrocnemius'],
      relatedOrganIds: [],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: ['stomach', 'gallbladder', 'bladder'],
      relatedChainIds: ['superficial-back-line', 'superficial-front-line'],
      view: 'anterior',
      rightX: ip.x,
      y: ip.y,
    })
  ),
];

// 8. Суставы гортани (4) + межкостные синдесмозы (4) + 32 зубоальвеолярных гомфоза = 40
const LARYNX_SYNDESMOSES_AND_GOMPHOSES: StructuralElementProfile[] = [
  ...makePairedJoints({
    baseId: 'joint-cricothyroid',
    name: 'Перстнещитовидный сустав гортани',
    latinBase: 'Articulatio cricothyroidea',
    adjGender: 'm',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Гортань и фиброзные синдесмозы',
    anatomyAndLocation: 'Парный сустав между нижним рогом щитовидного хряща и суставной площадкой перстневидного хряща.',
    biomechanicsAndFunction: 'Регулирует натяжение голосовых связок при наклоне щитовидного хряща вперёд.',
    palpationLandmark: 'Боковая стенка перстнещитовидной щели шеи (пальпация предельно деликатная).',
    dysfunctionSigns: ['Осиплость голоса, напряжение передней шеи и подъязычной области'],
    kinesiologyTestAndProvocation: 'Фонационная провокация (длительный гласный звук) или лёгкая ТЛ гортани с ММТ шеи.',
    relatedMuscleIds: ['suprahyoid-infrahyoid', 'deep-neck-flexors'],
    relatedOrganIds: ['lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'oral-diaphragm'],
    relatedMeridianIds: ['conception', 'stomach'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 245,
    y: 146,
  }),
  ...makePairedJoints({
    baseId: 'joint-cricoarytenoid',
    name: 'Перстнечерпаловидный сустав гортани',
    latinBase: 'Articulatio cricoarytenoidea',
    adjGender: 'm',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Гортань и фиброзные синдесмозы',
    anatomyAndLocation: 'Цилиндрический сустав между основанием черпаловидного хряща и верхним краем перстневидного хряща.',
    biomechanicsAndFunction: 'Сближает и разводит голосовые складки при дыхании, кашле и речи.',
    palpationLandmark: 'Задневерхняя проекция гортани (тестируется функционально через голос и дыхание).',
    dysfunctionSigns: ['Быстрая голосовая утомляемость, ком в горле при стрессе'],
    kinesiologyTestAndProvocation: 'ММТ индикаторной мышцы на фоне шёпота/гласного звука и релиза передней фасции шеи.',
    relatedMuscleIds: ['suprahyoid-infrahyoid', 'scm'],
    relatedOrganIds: ['lungs'],
    relatedDiaphragmIds: ['oral-diaphragm', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['conception', 'lung'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 247,
    y: 142,
  }),
  ...makePairedJoints({
    baseId: 'joint-syndesmosis-forearm',
    name: 'Межкостный синдесмоз предплечья (мембрана)',
    latinBase: 'Syndesmosis radioulnaris (Membrana interossea antebrachii)',
    adjGender: 'm',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Гортань и фиброзные синдесмозы',
    anatomyAndLocation: 'Фиброзная полуподвижная связка, натянутая между межкостными краями лучевой и локтевой костей.',
    biomechanicsAndFunction: 'Передаёт продольную нагрузку с лучевой кости на локтевую и стабилизирует вращение предплечья.',
    palpationLandmark: 'Промежуток между лучевой и локтевой костями по средней трети предплечья.',
    dysfunctionSigns: ['Ноющая боль в глубине предплечья после упора на руки или работы с мышью'],
    kinesiologyTestAndProvocation: 'Поперечная пружинящая провокация костей предплечья с ММТ сгибателей кисти.',
    relatedMuscleIds: ['brachioradialis', 'wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['large-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['triple-warmer', 'large-intestine'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 102,
    y: 362,
  }),
  ...makePairedJoints({
    baseId: 'joint-syndesmosis-leg',
    name: 'Межкостный синдесмоз голени (мембрана)',
    latinBase: 'Syndesmosis tibiofibularis media (Membrana interossea cruris)',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Мелкие суставы — Гортань и фиброзные синдесмозы',
    anatomyAndLocation: 'Прочный фиброзный синдесмоз между большеберцовой и малоберцовой костями голени.',
    biomechanicsAndFunction: 'Управляет эластическим схождением-расхождением вилки голеностопа и венозной помпой голени.',
    palpationLandmark: 'Латеральнее гребня большеберцовой кости в средней трети голени.',
    dysfunctionSigns: ['Шинсплинт, распирание в голени, слабость большеберцовых мышц'],
    kinesiologyTestAndProvocation: 'ММТ передней/задней большеберцовой мышцы при сближении берцовых костей.',
    relatedMuscleIds: ['tibialis-anterior', 'tibialis-posterior', 'fibularis-peroneus'],
    relatedOrganIds: ['kidneys'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'gallbladder'],
    relatedChainIds: ['deep-front-line', 'lateral-line'],
    view: 'anterior',
    rightX: 204,
    y: 716,
  }),
  // 32 зубоальвеолярных соединения (гомфозы) — важнейшие стоматогнатические триггеры в прикладной кинезиологии
  ...[
    { jaw: 'upper', jawRu: 'верхней челюсти', y: 96, teeth: [
      { code: '18', name: 'правый III моляр (зуб мудрости)', x: 230 },
      { code: '17', name: 'правый II моляр', x: 232 },
      { code: '16', name: 'правый I моляр', x: 234 },
      { code: '15', name: 'правый II премоляр', x: 236 },
      { code: '14', name: 'правый I премоляр', x: 238 },
      { code: '13', name: 'правый клык', x: 241 },
      { code: '12', name: 'правый латеральный резец', x: 244 },
      { code: '11', name: 'правый медиальный резец', x: 248 },
      { code: '21', name: 'левый медиальный резец', x: 252 },
      { code: '22', name: 'левый латеральный резец', x: 256 },
      { code: '23', name: 'левый клык', x: 259 },
      { code: '24', name: 'левый I премоляр', x: 262 },
      { code: '25', name: 'левый II премоляр', x: 264 },
      { code: '26', name: 'левый I моляр', x: 266 },
      { code: '27', name: 'левый II моляр', x: 268 },
      { code: '28', name: 'левый III моляр (зуб мудрости)', x: 270 },
    ] },
    { jaw: 'lower', jawRu: 'нижней челюсти', y: 106, teeth: [
      { code: '48', name: 'правый III моляр (зуб мудрости)', x: 230 },
      { code: '47', name: 'правый II моляр', x: 232 },
      { code: '46', name: 'правый I моляр', x: 234 },
      { code: '45', name: 'правый II премоляр', x: 236 },
      { code: '44', name: 'правый I премоляр', x: 238 },
      { code: '43', name: 'правый клык', x: 241 },
      { code: '42', name: 'правый латеральный резец', x: 244 },
      { code: '41', name: 'правый медиальный резец', x: 248 },
      { code: '31', name: 'левый медиальный резец', x: 252 },
      { code: '32', name: 'левый латеральный резец', x: 256 },
      { code: '33', name: 'левый клык', x: 259 },
      { code: '34', name: 'левый I премоляр', x: 262 },
      { code: '35', name: 'левый II премоляр', x: 264 },
      { code: '36', name: 'левый I моляр', x: 266 },
      { code: '37', name: 'левый II моляр', x: 268 },
      { code: '38', name: 'левый III моляр (зуб мудрости)', x: 270 },
    ] },
  ].flatMap((jawGrp) =>
    jawGrp.teeth.map((t) =>
      makeJoint({
        id: `joint-gomphosis-${t.code}`,
        name: `Зубоальвеолярный сустав (гомфоз ${t.code} — ${t.name} ${jawGrp.jawRu})`,
        latinName: `Articulatio dentoalveolaris (Gomphosis dens ${t.code})`,
        zone: 'head',
        side: 'anterior',
        categoryLabel: 'Мелкие суставы — Зубоальвеолярные соединения (стоматогнатика)',
        anatomyAndLocation: `Фиброзное соединение (вколачивание) корня зуба ${t.code} с альвеолярной лункой ${jawGrp.jawRu} через периодонтальную связку (богатую механорецепторами тройничного нерва V).`,
        biomechanicsAndFunction:
          'Обеспечивает микроамортизацию жевательного давления (0.05–0.15 мм) и мгновенно информирует ствол мозга о высоте прикуса и окклюзионных контактах.',
        palpationLandmark: `Проекция альвеолярного отростка ${jawGrp.jawRu} в области зуба ${t.code} (ТЛ снаружи по щеке/губе).`,
        dysfunctionSigns: [
          `Окклюзионная перегрузка, завышенная пломба/коронка или хронический очаг у корня зуба ${t.code}`,
          'Внезапная асимметрия тонуса мышц таза и шеи при смыкании зубов (позитивный тест тестового ватного валика)',
        ],
        kinesiologyTestAndProvocation: `Накусывание тестового ватного валика в зоне зуба ${t.code} или ТЛ проекции корня с ретестом сильной индикаторной мышцы.`,
        relatedMuscleIds: ['masseter', 'temporalis', 'lateral-pterygoid', 'suprahyoid-infrahyoid'],
        relatedOrganIds: ['stomach', 'sinuses'],
        relatedDiaphragmIds: ['oral-diaphragm', 'cranial-tentorium'],
        relatedMeridianIds: ['stomach', 'large-intestine', 'gallbladder'],
        relatedChainIds: ['deep-front-line'],
        svgCoords: { view: 'anterior', x: t.x, y: jawGrp.y },
      })
    )
  ),
];

export const JOINTS_350_NEW: StructuralElementProfile[] = [
  ...MAJOR_SINGLE_JOINTS, // 4
  ...MAJOR_PAIRED_BLUEPRINTS.flatMap(makePairedJoints), // 38
  ...FACET_JOINTS, // 46
  ...IV_SYMPHYSES, // 22
  ...UNCOVERTEBRAL_JOINTS, // 8
  ...COSTOVERTEBRAL_HEAD_JOINTS, // 24
  ...COSTOTRANSVERSE_JOINTS, // 20
  ...STERNOCOSTAL_JOINTS, // 14
  ...INTERCHONDRAL_AND_STERNAL_JOINTS, // 8
  ...CRANIAL_AND_EAR_SMALL_JOINTS, // 12
  ...HAND_SMALL_JOINTS, // 56
  ...FOOT_SMALL_JOINTS, // 58
  ...LARYNX_SYNDESMOSES_AND_GOMPHOSES, // 40
];
