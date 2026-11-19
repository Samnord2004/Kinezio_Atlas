import { StructuralElementKind, StructuralElementProfile } from '../types/atlas';
import { JOINTS_350_NEW } from './joints360';
import { SKELETON_206_BONES } from './skeleton206';
import { getStructuralAnatomyImage } from './structuralImages';

function attachImages(list: StructuralElementProfile[]): StructuralElementProfile[] {
  return list.map((item) => {
    const img = getStructuralAnatomyImage(item);
    return {
      ...item,
      imageSrc: img.src,
      imageCaption: img.caption,
      imageAttribution: img.attribution,
    };
  });
}

const RAW_FASCIAS: StructuralElementProfile[] = [
  {
    id: 'fascia-cervicalis',
    kind: 'fascia',
    name: 'Шейная фасция (поверхностная и предпозвоночная пластинки)',
    latinName: 'Fascia cervicalis (lamina superficialis, pretrachealis et prevertebralis)',
    zone: 'cervical',
    side: 'both',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Окружает мышцы шеи, трахею, щитовидную железу, подъязычную кость и сосудисто-нервный пучок; непрерывно переходит вверх в основание черепа и вниз — в средостение и внутригрудную фасцию.',
    biomechanicsAndFunction:
      'Передаёт кранио-цервикальное и дыхательное скольжение между челюстно-подъязычной зоной, ключицами и верхней грудной апертурой, стабилизируя шейный лордоз.',
    palpationLandmark:
      'Передне-боковая поверхность шеи вдоль медиального края ГКС (SCM), надгрудинная ямка и надключичные ямки; мягкий тест сдвига фасциальных листков вверх–вниз.',
    dysfunctionSigns: [
      'Чувство «кома в горле», скованность при глотании и поворотах головы',
      'Головные боли напряжения и застой венозного/лимфатического оттока от головы',
      'Двусторонняя гипотония глубоких сгибателей шеи и лестничных мышц при вертикальной тракции',
    ],
    kinesiologyTestAndProvocation:
      'ММТ индикаторной мышцы при мягком фасциальном смещении тканей шеи краниально/каудально или при ТЛ подъязычной кости; восстановление тонуса после релиза подтверждает вектор блока.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Миофасциальный релиз пластинок шеи и верхней апертуры',
        technique:
          'Мягкое трёхплоскостное раскручивание поверхностной и предтрахеальной фасции от подъязычной кости к рукоятке грудины на длинном выдохе пациента.',
        durationOrDose: '60–90 сек на уровень',
      },
      {
        modality: 'Краниосакральная',
        title: 'Декомпрессия основания черепа и C0–C1',
        technique:
          'Мягкий подзатылочный релиз с тракцией кпереди до ощущения равномерного скольжения затылочной и височной фасций.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['scm', 'scalenes', 'deep-neck-flexors', 'suprahyoid-infrahyoid', 'suboccipitals'],
    relatedOrganIds: ['sinuses', 'lungs'],
    relatedDiaphragmIds: ['cranial-tentorium', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'conception', 'triple-warmer'],
    relatedChainIds: ['deep-front-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 158 },
  },
  {
    id: 'fascia-clavipectoralis',
    kind: 'fascia',
    name: 'Ключично-грудная фасция',
    latinName: 'Fascia clavipectoralis',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Расположена глубоко под большой грудной мышцей между ключицей, подключичной мышцей и малой грудной мышцей; переходит в подмышечную фасцию и подвешивающую связку подмышки.',
    biomechanicsAndFunction:
      'Координирует наклон лопатки, защищает подключичные сосуды и плечевое сплетение в рёберно-ключичном и малогрудном тоннелях.',
    palpationLandmark:
      'Подключичная ямка (проекция подключичной мышцы) и клювовидный отросток лопатки медиальнее дельтовидно-грудной борозды.',
    dysfunctionSigns: [
      'Протракция плеч, округление верхней части спины, синдром малой грудной мышцы',
      'Онемение пальцев руки при отведении/подъёме руки вверх',
      'Болезненность точек KI-27 и LU-1 с рефлекторным падением тонуса мышц руки',
    ],
    kinesiologyTestAndProvocation:
      'ММТ дельтовидной или клювовидно-плечевой мышцы при подъёме руки на 110–130° или ТЛ под ключицей; усиление гипотонии на вдохе указывает на укорочение фасции.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Сброс ключично-грудной фасции и малой грудной мышцы',
        technique:
          'Мягкое фасциальное раскрытие от клювовидного отростка к грудине и 3–5 рёбрам во время медленной наружной ротации плеча.',
        durationOrDose: '3–4 дыхательных цикла',
      },
      {
        modality: 'Рефлекторная (НЛ / НВ)',
        title: 'Стимуляция подключичных лимфатических коллекторов (KI-27)',
        technique:
          'Деликатный помпаж венозного угла и подключичной зоны для снятия отёка фасциального тоннеля.',
        durationOrDose: '30 сек с каждой стороны',
      },
    ],
    relatedMuscleIds: ['pectoralis-minor', 'pectoralis-major-clavicular', 'coracobrachialis', 'subscapularis'],
    relatedOrganIds: ['lungs', 'heart'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['lung', 'kidney', 'pericardium'],
    relatedChainIds: ['arm-lines', 'deep-front-line'],
    svgCoords: { view: 'anterior', x: 204, y: 196 },
  },
  {
    id: 'fascia-thoracolumbalis',
    kind: 'fascia',
    name: 'Грудопоясничная фасция (задний и средний листки)',
    latinName: 'Fascia thoracolumbalis',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Многослойный ромбовидный фасциальный комплекс от остистых отростков T7–S3 к гребням подвздошных костей; объединяет тяги широчайшей мышцы спины, большой ягодичной и поперечной мышцы живота.',
    biomechanicsAndFunction:
      'Передаёт диагональную нагрузку при ходьбе (контралатеральная передача силы от ноги к руке) и создаёт гидравлический «корсет» поясницы при напряжении кор-мышц.',
    palpationLandmark:
      'Ромб Михаэлиса над крестцом, боковой край мышцы, выпрямляющей позвоночник, и область над L3–L5 между XII ребром и подвздошным гребнем.',
    dysfunctionSigns: [
      'Хроническая тянущая боль в пояснице при длительном стоянии или утренней скованности',
      'Ограничение ротации грудопоясничного перехода и скольжения между слоями фасции',
      'Потеря связи между большой ягодичной и противоположной широчайшей мышцами при тесте шага',
    ],
    kinesiologyTestAndProvocation:
      'Перекрёстный тест функциональной цепи (одновременный ММТ большой ягодичной справа и широчайшей слева) + ТЛ по центру грудопоясничной фасции на уровне L3–L4.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Межслойный сдвиг и раскрутка грудопоясничной фасции',
        technique:
          'Поперечное растяжение поверхностного и глубокого листков фасции от остистых отростков к латеральному шву с активным дыханием животом.',
        durationOrDose: '60–90 сек',
      },
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Синхронизация задней функциональной петли',
        technique:
          'Одновременная эксцентрическая активация большой ягодичной и противоположной широчайшей мышц в положении лёжа на животе.',
        durationOrDose: '4–5 повторений с ретестом ММТ',
      },
    ],
    relatedMuscleIds: ['latissimus-dorsi', 'erector-spinae', 'quadratus-lumborum', 'gluteus-maximus'],
    relatedOrganIds: ['kidneys', 'large-intestine'],
    relatedDiaphragmIds: ['thoracoabdominal', 'pelvic-floor'],
    relatedMeridianIds: ['bladder', 'governing'],
    relatedChainIds: ['functional-lines', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 372 },
  },
  {
    id: 'fascia-endothoracica',
    kind: 'fascia',
    name: 'Внутригрудная фасция и перикардиальные связки',
    latinName: 'Fascia endothoracica et ligg. sternopericardiaca',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Выстилает грудную полость изнутри, срастается с париетальной плеврой, перикардом, грудиной (грудино-перикардиальные связки) и диафрагмой, продолжаясь к шее (купол плевры).',
    biomechanicsAndFunction:
      'Подвешивает сердце и лёгкие в средостении, координирует расширение верхних рёбер и передаёт кранио-висцеральные тяги на шейно-грудной переход.',
    palpationLandmark:
      'Рукоятка и тело грудины, II–V грудино-рёберные сочленения слева, зона мечевидного отростка.',
    dysfunctionSigns: [
      'Стеснение в груди, невозможность сделать полный глубокий вдох без боли в межлопаточной зоне',
      'Рецидивирующие блоки позвонков T3–T6 и C7–T1 после мануальных трастов',
      'Эмоциональный панцирь грудной клетки и снижение вариабельности сердечного ритма',
    ],
    kinesiologyTestAndProvocation:
      'ММТ подлопаточной или грудинной порции БГМ при фазовом вдохе и лёгкой дорсальной компрессии грудины (провокация грудино-перикардиальных связок).',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Освобождение грудино-перикардиальных связок',
        technique:
          'Непрямой баланс натяжения между рукояткой/мечевидным отростком грудины спереди и сегментом T4–T6 сзади до точки тканевого покоя.',
        durationOrDose: '60–90 сек',
      },
    ],
    relatedMuscleIds: ['pectoralis-major-sternal', 'subscapularis', 'serratus-anterior'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'thoracoabdominal'],
    relatedMeridianIds: ['pericardium', 'heart', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 258, y: 244 },
  },
  {
    id: 'fascia-iliopsoas',
    kind: 'fascia',
    name: 'Подвздошная фасция и ретроперитонеальные фасции (Тольда)',
    latinName: 'Fascia iliaca et fascia retroperitonealis',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Выстилает переднюю поверхность квадратной мышцы поясницы, большой поясничной и подвздошной мышц; тесно спаяна с фасцией восходящей/нисходящей ободочной кишки (фасция Тольда) и почечной фасцией.',
    biomechanicsAndFunction:
      'Передаёт висцеральное скольжение кишечника и почек прямо на поясничный лордоз, тазобедренный сустав и диафрагмальные ножки.',
    palpationLandmark:
      'Подвздошные ямки на 2–3 см медиальнее ПВПО (ASIS) с мягким погружением на выдохе к крылу подвздошной кости.',
    dysfunctionSigns: [
      'Стойкая слабость подвздошно-поясничной мышцы, скрученный таз и боль в паху',
      'Колит, вздутие или запоры, совпадающие со спазмом поясницы по утрам',
      'Туннельная компрессия бедренного и латерального кожного нерва бедра',
    ],
    kinesiologyTestAndProvocation:
      'ММТ подвздошно-поясничной мышцы (в отведении и наружной ротации бедра) с провокацией висцерального сдвига слепой/сигмовидной кишки вверх и медиально.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Релиз фасции Тольда и подвздошной фасции',
        technique:
          'Согнув ноги пациента в коленях, мягко мобилизовать боковые каналы толстой кишки медиально, освобождая фасциальный лист от подвздошно-поясничной мышцы.',
        durationOrDose: '60 сек с каждой стороны',
      },
    ],
    relatedMuscleIds: ['iliopsoas', 'quadratus-lumborum', 'rectus-abdominis'],
    relatedOrganIds: ['large-intestine', 'kidneys', 'urogenital'],
    relatedDiaphragmIds: ['thoracoabdominal', 'pelvic-floor'],
    relatedMeridianIds: ['kidney', 'large-intestine'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 218, y: 406 },
  },
  {
    id: 'fascia-lata-itb',
    kind: 'fascia',
    name: 'Широкая фасция бедра и подвздошно-большеберцовый тракт (ITB)',
    latinName: 'Fascia lata et tractus iliotibialis',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Плотнейший латеральный фасциальный футляр бедра от гребня подвздошной кости до бугорка Жерди на большеберцовой кости; принимает сухожилия НШФБ и большой ягодичной мышцы.',
    biomechanicsAndFunction:
      'Стабилизирует таз и колено во фронтальной плоскости в фазе опоры на одну ногу (работает как латеральный трос крана).',
    palpationLandmark:
      'Боковая поверхность бедра от большого вертела к наружному мыщелку бедра и бугорку Жерди.',
    dysfunctionSigns: [
      'Латеральная боль в колене («колено бегуна») и щелчки в области большого вертела',
      'Гипертонус НШФБ (TFL) на фоне гипотонии средней ягодичной мышцы',
      'Перекос таза во фронтальной плоскости при тесте Тренделенбурга',
    ],
    kinesiologyTestAndProvocation:
      'Ортопедический тест Обера (ограничение приведения бедра) + ММТ средней ягодичной при ТЛ вдоль тракта ITB на латеральной поверхности бедра.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Декомпрессия межмышечных перегородок бедра',
        technique:
          'Мягкое фасциальное отделение ITB от латеральной широкой мышцы бедра (впереди) и бицепса бедра (сзади) без грубого болезненного давления.',
        durationOrDose: '60 сек по всей длине бедра',
      },
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Включение средней ягодичной мышцы',
        technique:
          'После релиза тракта активировать среднюю ягодичную и проверить НЛ-точки по гребню подвздошной кости.',
        durationOrDose: '20–30 сек + ретест ММТ',
      },
    ],
    relatedMuscleIds: ['tensor-fasciae-latae', 'gluteus-medius', 'gluteus-maximus', 'quadriceps-femoris'],
    relatedOrganIds: ['large-intestine', 'gallbladder'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['gallbladder', 'large-intestine'],
    relatedChainIds: ['lateral-line', 'spiral-line'],
    svgCoords: { view: 'anterior', x: 184, y: 540 },
  },
  {
    id: 'fascia-cruris',
    kind: 'fascia',
    name: 'Глубокая фасция голени и межкостная перепонка',
    latinName: 'Fascia cruris et membrana interossea cruris',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Разделяет передний, латеральный и глубокий задний футляры голени; натянута между большеберцовой и малоберцовой костями и переходит в удерживатели сухожилий голеностопа.',
    biomechanicsAndFunction:
      'Работает как мышечно-венозная помпа голени и обеспечивает синхронное скольжение малоберцовой кости вверх–вниз при шаге.',
    palpationLandmark:
      'Борозда между большеберцовой костью и малоберцовыми мышцами спереди-латерально и медиальный край камбаловидной мышцы сзади.',
    dysfunctionSigns: [
      'Синдром расколотой голени (шинсплинт), чувство распирания и судороги икр',
      'Отек лодыжек к вечеру и фиксация головки малоберцовой кости',
      'Дисбаланс между передней и задней большеберцовыми мышцами',
    ],
    kinesiologyTestAndProvocation:
      'ММТ малоберцовых или задней большеберцовой мышцы при пружинирующей тракции малоберцовой кости и ТЛ межкостной перепонки голени.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Релиз межкостной мембраны и удерживателей голеностопа',
        technique:
          'Мягкое «встречное» сближение и сдвиг большеберцовой и малоберцовой костей с дыханием, затем раскрытие переднего удерживателя разгибателей.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['tibialis-anterior', 'tibialis-posterior', 'fibularis-peroneus', 'soleus'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['bladder', 'stomach', 'gallbladder'],
    relatedChainIds: ['lateral-line', 'deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 734, y: 716 },
  },
  {
    id: 'aponeurosis-plantaris',
    kind: 'fascia',
    name: 'Подошвенный апоневроз (фасция стопы)',
    latinName: 'Aponeurosis plantaris',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Мощный продольный соединительнотканный тяж от пяточного бугра до головок плюсневых костей, функционально продолжающийся через надкостницу пятки в ахиллово сухожилие.',
    biomechanicsAndFunction:
      'Формирует «эффект лебёдки» (Windlass mechanism) при перекате стопы и является дистальной стартовой точкой Поверхностной задней цепи.',
    palpationLandmark:
      'Медиальный край продольного свода стопы и передне-медиальная поверхность пяточного бугра.',
    dysfunctionSigns: [
      'Стартовая утренняя боль в пятке (подошвенный фасциит, «пяточная шпора»)',
      'Рефлекторное укорочение всей задней поверхности бедра и скованность шеи',
      'Плоскостопие или ригидный высокий свод с перегрузкой головок плюсневых костей',
    ],
    kinesiologyTestAndProvocation:
      'Тест Джека (пассивное тыльное сгибание I пальца стопы) + ТЛ медиального края подошвенного апоневроза с ММТ задней большеберцовой и хамстрингов.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Фасциальный релиз подошвенного апоневроза и триггеров свода',
        technique:
          'Продольное фасциальное раскрытие апоневроза в сочетании с мягким тыльным сгибанием пальцев стопы, начиная от пяточного бугра к плюсне.',
        durationOrDose: '60 сек + мобилизация пяточной кости',
      },
    ],
    relatedMuscleIds: ['gastrocnemius', 'soleus', 'tibialis-posterior', 'hamstrings'],
    relatedOrganIds: ['urogenital', 'kidneys'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['bladder', 'kidney'],
    relatedChainIds: ['superficial-back-line'],
    svgCoords: { view: 'posterior', x: 814, y: 822 },
  },
  // === ПОВЕРХНОСТНЫЕ (ПОДКОЖНЫЕ) ФАСЦИИ ===
  {
    id: 'fascia-superficialis-head-smas',
    kind: 'fascia',
    name: 'Поверхностная фасция лица (SMAS) и сухожильный шлем',
    latinName: 'Fascia superficialis capitis et galea aponeurotica (SMAS)',
    zone: 'head',
    side: 'both',
    categoryLabel: 'Поверхностные фасции (подкожные)',
    anatomyAndLocation:
      'Подкожная мышечно-апоневротическая система лица (SMAS) и сухожильный шлем свода черепа, связывающие мимические мышцы, лобное и затылочное брюшки надчерепной мышцы.',
    biomechanicsAndFunction:
      'Обеспечивает скольжение кожи, подкожный венозный/лимфатический дренаж лица и черепа, а также передаёт натяжение Поверхностной задней цепи к надбровным дугам.',
    palpationLandmark:
      'Подкожное смещение кожи теменной области (скальпа), височной зоны и щёчной области по дуге от уха к углу рта.',
    dysfunctionSigns: [
      'Спайка скальпа с надкостницей черепа и давящие головные боли «каски»',
      'Пастозность лица, нарушение лимфооттока и асимметрия мимики',
      'Ограничение подвижности кожи над височной костью и ВНЧС',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ или мягкий кожно-фасциальный сдвиг скальпа кзади/кпереди с ММТ индикаторной мышцы и оценкой объёма открывания рта.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Освобождение сухожильного шлема и SMAS',
        technique:
          'Мягкое плавающее смещение кожи свода черепа и височной области в сторону лёгкости до выравнивания сдвига во всех 4 векторах.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['temporalis', 'masseter', 'suboccipitals'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium', 'oral-diaphragm'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'bladder'],
    relatedChainIds: ['superficial-back-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 52 },
  },
  {
    id: 'fascia-superficialis-colli-platysma',
    kind: 'fascia',
    name: 'Поверхностная подкожная фасция шеи и футляр платизмы',
    latinName: 'Tela subcutanea colli et fascia platysmatis',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Поверхностные фасции (подкожные)',
    anatomyAndLocation:
      'Тонкий подкожный слой от края нижней челюсти до II ребра, содержащий подкожную мышцу шеи (платизму), поверхностные вены шеи и кожные нервы шейного сплетения.',
    biomechanicsAndFunction:
      'Амортизирует сдвигающие нагрузки кожи шеи при глотании и поворотах головы, обеспечивая поверхностный лимфатический и венозный отток от лица к подключичным узлам.',
    palpationLandmark:
      'Подкожная складка над грудино-ключично-сосцевидной мышцей и ключицей при лёгком напряжении углов рта вниз.',
    dysfunctionSigns: [
      'Тяжистость передней поверхности шеи и поверхностное натяжение подбородка',
      'Затруднение поверхностного лимфооттока шеи и отёчность подчелюстной зоны',
      'Кожная аллодиния в области рубцов щитовидной железы или ключицы',
    ],
    kinesiologyTestAndProvocation:
      'Подкожный сдвиг фасции над ключицей вверх/вниз (ТЛ-провокация поверхностных рецепторов Руффини) + ММТ ГКС или сгибателей шеи.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Скин-роллинг и релиз поверхностной фасции шеи',
        technique:
          'Поверхностное безболезненное смещение кожи с подкожной клетчаткой от нижнего края челюсти к подключичной ямке.',
        durationOrDose: '30–45 сек',
      },
    ],
    relatedMuscleIds: ['scm', 'suprahyoid-infrahyoid', 'pectoralis-major-clavicular'],
    relatedOrganIds: ['sinuses', 'lungs'],
    relatedDiaphragmIds: ['oral-diaphragm', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'conception', 'large-intestine'],
    relatedChainIds: ['superficial-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 142 },
  },
  {
    id: 'fascia-superficialis-abdominis-camper-scarpa',
    kind: 'fascia',
    name: 'Поверхностная подкожная фасция живота (Кампера и Скарпы)',
    latinName: 'Tela subcutanea abdominis (fascia Camperi et Scarpae)',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Поверхностные фасции (подкожные)',
    anatomyAndLocation:
      'Состоит из поверхностного жирового слоя (фасция Кампера) и глубокой мембранозной пластинки (фасция Скарпы), переходящей книзу в широкую фасцию бедра и фасцию промежности (Коллеса).',
    biomechanicsAndFunction:
      'Распределяет кожно-подкожное натяжение передней брюшной стенки, участвует в поверхностной лимфодинамике и реагирует на послеоперационные рубцы (аппендэктомия, кесарево сечение).',
    palpationLandmark:
      'Оценка скольжения подкожной клетчатки выше и ниже пупка, особенно вдоль паховой связки и послеоперационных рубцов.',
    dysfunctionSigns: [
      'Спайки и уплотнения подкожной клетчатки вокруг старых рубцов живота',
      'Глобальная или региональная гипотония прямой/косых мышц живота от кожного рубца',
      'Задержка поверхностного лимфооттока в нижней половине живота',
    ],
    kinesiologyTestAndProvocation:
      'Кожно-фасциальный сдвиг и провокация рубца/подкожного слоя Скарпы с одновременным ММТ прямой мышцы живота или подвздошно-поясничной.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Освобождение фасции Скарпы и рубцовых тяг',
        technique:
          'Мягкое поверхностное раскручивание подкожного слоя и кожных рубцов в направлении натяжения с ретестом мышц кора.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['rectus-abdominis', 'obliques-abdominis', 'm-transversus-abdominis-r', 'm-transversus-abdominis-l'],
    relatedOrganIds: ['small-intestine', 'large-intestine', 'stomach'],
    relatedDiaphragmIds: ['thoracoabdominal', 'pelvic-floor', 'urogenital-diaphragm'],
    relatedMeridianIds: ['stomach', 'conception', 'spleen'],
    relatedChainIds: ['superficial-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 332 },
  },
  {
    id: 'fascia-superficialis-dorsi-glutea',
    kind: 'fascia',
    name: 'Поверхностная подкожная фасция спины и ягодичной области',
    latinName: 'Tela subcutanea dorsi et regionis gluteae',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Поверхностные фасции (подкожные)',
    anatomyAndLocation:
      'Подкожный фиброзно-жировой слой от затылка до крестца и ягодиц, богатый кожными механорецепторами и ветвями верхних/средних ягодичных нервов (clunial nerves).',
    biomechanicsAndFunction:
      'Обеспечивает свободное скольжение кожи над остистыми отростками и грудопоясничной фасцией при наклоне туловища вперёд и скручивании.',
    palpationLandmark:
      'Тест кожной складки Киблера вдоль позвоночника и над подвздошными гребнями (зона ягодичных нервов).',
    dysfunctionSigns: [
      'Болезненный и тугой валик в тесте Киблера («прилипшая» кожа к пояснице)',
      'Туннельное раздражение верхних ягодичных кожных нервов над гребнем таза',
      'Жгучая или ноющая поверхностная боль по краю крестца без неврологического дефицита',
    ],
    kinesiologyTestAndProvocation:
      'Щипковый кожно-фасциальный тест Киблера (skin rolling) вдоль паравертебральной зоны с ретестом ягодичных мышц.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Скин-роллинг (мобилизация кожно-подкожного слоя спины)',
        technique:
          'Плавное перекатывание кожной складки вдоль длинной оси спины и косо от позвоночника к гребню таза до исчезновения «залипания».',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['erector-spinae', 'latissimus-dorsi', 'gluteus-maximus', 'gluteus-medius'],
    relatedOrganIds: ['kidneys'],
    relatedDiaphragmIds: ['thoracoabdominal', 'pelvic-floor'],
    relatedMeridianIds: ['bladder', 'governing'],
    relatedChainIds: ['superficial-back-line', 'functional-lines'],
    svgCoords: { view: 'posterior', x: 773, y: 318 },
  },
  {
    id: 'fascia-superficialis-brachii-antebrachii',
    kind: 'fascia',
    name: 'Поверхностная подкожная фасция верхней конечности',
    latinName: 'Tela subcutanea brachii et antebrachii',
    zone: 'upper-limb',
    side: 'both',
    categoryLabel: 'Поверхностные фасции (подкожные)',
    anatomyAndLocation:
      'Подкожный слой плеча и предплечья, заключающий головную и основную подкожные вены руки (vv. cephalica et basilica), поверхностные лимфососуды и кожные ветви нервов.',
    biomechanicsAndFunction:
      'Защищает поверхностный венозно-лимфатический отток руки и снижает трение кожи при полном сгибании/разгибании локтя и вращении предплечья.',
    palpationLandmark:
      'Подкожная клетчатка локтевой ямки, латерального края бицепса и тыла предплечья.',
    dysfunctionSigns: [
      'Чувство стянутости кожи предплечья и поверхностное жжение после травм или инъекций',
      'Склонность к пастозности кисти и нарушению скольжения над локтевым отростком',
    ],
    kinesiologyTestAndProvocation:
      'Кожно-фасциальный сдвиг вдоль продольной оси плеча/предплечья с ММТ дельтовидной или сгибателей запястья.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Поверхностный фасциальный дренаж верхней конечности',
        technique:
          'Лёгкое проксимальное натяжение подкожной фасции плеча и предплечья по ходу лимфооттока к подмышечным коллекторам.',
        durationOrDose: '30–45 сек',
      },
    ],
    relatedMuscleIds: ['deltoid', 'biceps-brachii', 'brachioradialis', 'wrist-extensors'],
    relatedOrganIds: ['lungs', 'heart'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['lung', 'large-intestine', 'pericardium'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 132, y: 268 },
  },
  {
    id: 'fascia-superficialis-femoris-cruris',
    kind: 'fascia',
    name: 'Поверхностная подкожная фасция бедра и голени',
    latinName: 'Tela subcutanea femoris et cruris',
    zone: 'lower-limb',
    side: 'both',
    categoryLabel: 'Поверхностные фасции (подкожные)',
    anatomyAndLocation:
      'Подкожная соединительнотканная сеть нижней конечности, формирующая футляры для большой и малой подкожных вен ноги и поверхностных лимфатических коллекторов к паховым узлам.',
    biomechanicsAndFunction:
      'Поддерживает подкожный гидростатический баланс ноги, уменьшает венозный застой и амортизирует кожные рецепторы при опоре и ходьбе.',
    palpationLandmark:
      'Медиальная поверхность бедра и голени (проекция большой подкожной вены) и область подкожной клетчатки вокруг колена.',
    dysfunctionSigns: [
      'Тяжесть в ногах к вечеру, отёчность лодыжек и «целлюлитное» уплотнение подкожных перегородок',
      'Болезненность при кожном щипке по внутренней поверхности бедра и колена',
    ],
    kinesiologyTestAndProvocation:
      'Кожный сдвиг медиальной поверхности бедра/голени вверх к паховой связке с ММТ портняжной, нежной и ягодичных мышц.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Мягкое освобождение подкожного футляра бедра и голени',
        technique:
          'Послойное сдвигание подкожной ткани вверх в направлении паховых и подколенных лимфоузлов с мягким помпажом.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['sartorius', 'm-gracilis-r', 'm-gracilis-l', 'quadriceps-femoris', 'gastrocnemius'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['pelvic-floor', 'plantar-popliteal'],
    relatedMeridianIds: ['spleen', 'liver', 'kidney'],
    relatedChainIds: ['deep-front-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 214, y: 582 },
  },
  // === ДОПОЛНИТЕЛЬНЫЕ ГЛУБОКИЕ ФАСЦИИ (МЫШЦЫ, СОСУДЫ И НЕРВЫ) ===
  {
    id: 'fascia-vagina-carotica',
    kind: 'fascia',
    name: 'Сонное фасциальное влагалище (футляр сосудов и вагуса)',
    latinName: 'Vagina carotica (fascia cervicalis)',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Плотная трубчатая конденсация глубокой шейной фасции от яремного отверстия черепа до дуги аорты/средостения; окружает общую/внутреннюю сонную артерию, внутреннюю яремную вену и блуждающий нерв.',
    biomechanicsAndFunction:
      'Защищает магистральный сосудисто-нервный пучок и блуждающий нерв от смещений мышц шеи; напряжение влагалища вызывает вегетативную дисрегуляцию и венозный застой головы.',
    palpationLandmark:
      'Борозда кнутри от переднего края грудино-ключично-сосцевидной мышцы (осторожная поверхностно-фасциальная пальпация без давления на каротидный синус).',
    dysfunctionSigns: [
      'Рефлекторная гипотония ключичной БГМ (желудок/блуждающий нерв) при повороте или разгибании шеи',
      'Пульсирующий шум в ушах, ощущение распирания в голове, ортостатическая слабость',
      'Нарушение скольжения между ГКС и глубоким нейрососудистым пучком',
    ],
    kinesiologyTestAndProvocation:
      'Деликатная ТЛ вдоль переднего края ГКС с оценкой тонуса ключичной БГМ и дыхательной провокацией верхней грудной апертуры.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Сверхлёгкое непрямое освобождение сонного влагалища',
        technique:
          'Без сдавления артерии: деликатное сближение ГКС и трахеального футляра с лёгкой фасциальной индукцией скольжения вверх–вниз до расслабления тканей.',
        durationOrDose: '30–45 сек',
      },
    ],
    relatedMuscleIds: ['scm', 'scalenes', 'deep-neck-flexors', 'pectoralis-major-clavicular'],
    relatedOrganIds: ['stomach', 'heart', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium', 'oral-diaphragm', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'pericardium', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 232, y: 148 },
  },
  {
    id: 'fascia-axillaris-brachii',
    kind: 'fascia',
    name: 'Подмышечная фасция и глубокая фасция плеча с перегородками',
    latinName: 'Fascia axillaris et fascia brachii (septa intermuscularia)',
    zone: 'upper-limb',
    side: 'both',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Плотная глубокая оболочка купола подмышки и мышц плеча, образующая медиальную и латеральную межмышечные перегородки плеча вокруг плечевой артерии и нервов плечевого сплетения.',
    biomechanicsAndFunction:
      'Разделяет сгибательный и разгибательный футляры плеча, формирует «нейро-сосудистые ворота» при отведении руки и защищает срединный, локтевой и лучевой нервы.',
    palpationLandmark:
      'Свод подмышечной впадины (подвешивающая связка) и медиальная двуглавая борозда плеча.',
    dysfunctionSigns: [
      'Тянущая боль по внутренней поверхности плеча и парестезии пальцев при отведении руки',
      'Гипотония бицепса/трицепса или широчайшей мышцы при провокации подмышечного свода',
    ],
    kinesiologyTestAndProvocation:
      'ММТ дельтовидной, двуглавой и трёхглавой мышц при ТЛ медиальной межмышечной перегородки плеча или свода подмышки.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Межмышечный релиз плеча и подвешивающей связки подмышки',
        technique:
          'Мягкое фасциальное разделение двуглавой и трёхглавой мышц вдоль медиальной/латеральной перегородок плеча без компрессии сосудисто-нервного пучка.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['biceps-brachii', 'triceps-brachii', 'latissimus-dorsi', 'pectoralis-minor'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['heart', 'pericardium', 'lung'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 148, y: 236 },
  },
  {
    id: 'fascia-antebrachii-interossea',
    kind: 'fascia',
    name: 'Глубокая фасция предплечья и межкостная перепонка',
    latinName: 'Fascia antebrachii et membrana interossea antebrachii',
    zone: 'upper-limb',
    side: 'both',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Плотный футляр предплечья, связанный с лацертусом фиброзусом бицепса проксимально и удерживателями сгибателей/разгибателей дистально, плюс косо-волокнистая межкостная перепонка между лучевой и локтевой костями.',
    biomechanicsAndFunction:
      'Передаёт осевую нагрузку с кисти через лучевую кость на локтевую и плечевую кости, формируя гидравлическую опору для сгибателей и разгибателей пальцев.',
    palpationLandmark:
      'Апоневроз бицепса в локтевой ямке и межостный промежуток по центру тыльной/ладонной стороны предплечья.',
    dysfunctionSigns: [
      'Эпикондилит («локоть теннисиста» / «локоть гольфиста») и усталость предплечья при захвате',
      'Ограничение пронации–супинации предплечья и ноющая боль запястья',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ межкостной мембраны предплечья или апоневроза бицепса с ММТ плечелучевой и разгибателей/сгибателей запястья.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Сбалансированное натяжение межкостной перепонки предплечья',
        technique:
          'Мягкое продольное и диагональное раскрытие между лучевой и локтевой костями во время медленной пронации и супинации кисти.',
        durationOrDose: '45 сек',
      },
    ],
    relatedMuscleIds: ['brachioradialis', 'biceps-brachii', 'wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['large-intestine', 'lungs'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['lung', 'large-intestine', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 102, y: 356 },
  },
  {
    id: 'aponeurosis-palmaris',
    kind: 'fascia',
    name: 'Ладонный апоневроз и удерживатель сгибателей (карпальный канал)',
    latinName: 'Aponeurosis palmaris et retinaculum musculorum flexorum',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Треугольная фиброзная пластинка ладони (продолжение сухожилия длинной ладонной мышцы) и поперечная связка запястья (крыша запястного канала над срединным нервом).',
    biomechanicsAndFunction:
      'Защищает сухожилия сгибателей пальцев, поверхностную ладонную сосудистую дугу и срединный нерв, формируя дистальную точку опоры Глубокой/Поверхностной передних цепей руки.',
    palpationLandmark:
      'Центр ладони между возвышением большого пальца и мизинца, а также дистальная запястная складка (канал Гийона и карпальный канал).',
    dysfunctionSigns: [
      'Онемение I–III пальцев кисти по ночам (синдром запястного канала)',
      'Начальное фиброзное уплотнение ладони (контрактура Дюпюитрена) и слабость щипкового хвата',
    ],
    kinesiologyTestAndProvocation:
      'Проба Фалена (сгибание запястий 60 с) + ТЛ поперечной связки запястья с ММТ мышцы, противопоставляющей большой палец.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Поперечное раскрытие карпальной связки и ладонного апоневроза',
        technique:
          'Мягкое разведение возвышений тенара и гипотенара в стороны при нейтральном положении запястья на выдохе пациента.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['wrist-flexors', 'brachioradialis'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['pericardium', 'heart', 'lung'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 82, y: 422 },
  },
  {
    id: 'fascia-canalis-adductorius',
    kind: 'fascia',
    name: 'Фасция приводящего канала (Гунтера) и бедренное влагалище',
    latinName: 'Lamina vastoadductoria et vagina femoralis',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Глубокие фасции (мышцы, сосуды и нервы)',
    anatomyAndLocation:
      'Глубокая фасциальная перегородка (сухожильная мембрана Гунтера) между приводящими мышцами и медиальной широкой мышцей бедра под портняжной мышцей; содержит бедренную артерию, вену и подкожный нерв (n. saphenus).',
    biomechanicsAndFunction:
      'Направляет магистральные сосуды бедра в подколенную ямку; спазм приводящей группы пережимает сосудисто-нервный канал, нарушая питание колена и голени.',
    palpationLandmark:
      'Нижне-медиальная треть бедра вдоль переднего края портняжной мышцы на 6–8 см выше медиального надмыщелка.',
    dysfunctionSigns: [
      'Тянущая боль или онемение по внутренней поверхности колена и голени (компрессия n. saphenus)',
      'Венозный застой голени и слабость медиальной головки квадрицепса',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ нижней трети Гунтерова канала с ММТ портняжной, нежной и четырёхглавой мышцы бедра.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Декомпрессия фасциальной мембраны Гунтера',
        technique:
          'Мягкое фасциальное отделение портняжной и медиальной широкой мышц бедра от приводящих в положении сгибания и наружной ротации бедра.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['hip-adductors', 'sartorius', 'm-gracilis-r', 'm-gracilis-l', 'quadriceps-femoris'],
    relatedOrganIds: ['urogenital', 'kidneys'],
    relatedDiaphragmIds: ['pelvic-floor', 'plantar-popliteal'],
    relatedMeridianIds: ['spleen', 'liver', 'kidney'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 222, y: 562 },
  },
  // === ДОПОЛНИТЕЛЬНЫЕ ВИСЦЕРАЛЬНЫЕ ФАСЦИИ (ВОКРУГ ОРГАНОВ) ===
  {
    id: 'fascia-visceralis-dura-tmo',
    kind: 'fascia',
    name: 'Твёрдая мозговая оболочка черепа и спинного мозга (дуральная труба)',
    latinName: 'Dura mater encephali et spinalis (ТМО)',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Мощная висцеро-менингеальная оболочка, выстилающая внутреннюю поверхность черепа (серп мозга, намёт мозжечка) и образующая нерастяжимую дуральную трубку от затылка C0–C2 до крестца S2.',
    biomechanicsAndFunction:
      'Окружает и механически защищает головной и спинной мозг, циркуляцию ликвора и венозные синусы черепа; синхронизирует дыхательный и краниосакральный ритмы между головой и тазом.',
    palpationLandmark:
      'Косвенная оценка через синхронную пальпацию затылочной чешуи (C0) и крестца (S2) в краниосакральном ритме.',
    dysfunctionSigns: [
      'Двусторонние или мигрирующие мышечные дисфункции по всему телу, зависящие от положения шеи/таза',
      'Положительный феномен двойной ТЛ «Затылок C0 + Крестец S2»',
      'Головные боли, усиливающиеся при наклоне головы вперёд (тест натяжения ТМО)',
    ],
    kinesiologyTestAndProvocation:
      'Двойная терапевтическая локализация (ТЛ на C0–C2 и S2 одновременно) + ММТ индикаторной мышцы при сгибании шеи с подъёмом ног.',
    correctionSteps: [
      {
        modality: 'Краниосакральная',
        title: 'Уравновешивание дуральной трубы C0–S2 и мембран черепа',
        technique:
          'Мягкое синхронное прослушивание и балансировка краниального (подзатылочная зона) и сакрального (S2) полюсов ТМО до точки покоя (still-point).',
        durationOrDose: '60–120 сек',
      },
    ],
    relatedMuscleIds: ['suboccipitals', 'piriformis', 'pelvic-floor-muscles', 'erector-spinae'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium', 'pelvic-floor'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 72 },
  },
  {
    id: 'fascia-visceralis-suprapleuralis',
    kind: 'fascia',
    name: 'Надплевральная фасция Сибсона и висцеральный футляр шеи',
    latinName: 'Membrana suprapleuralis (fascia Sibsoni) et lamina pretrachealis',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Укреплённый купол внутригрудной фасции, подвешенный на поперечном отростке C7 к внутреннему краю I ребра; покрывает верхушку лёгкого и продолжается на трахею, пищевод и щитовидную железу.',
    biomechanicsAndFunction:
      'Удерживает верхушки лёгких при перепадах внутригрудного давления, координирует скольжение пищевода/трахеи при глотании и связывает висцеральную шею со средостением.',
    palpationLandmark:
      'Надключичная ямка сразу кзади от ключицы и медиальнее передней лестничной мышцы; висцеральный цилиндр трахеи/щитовидной железы.',
    dysfunctionSigns: [
      'Ощущение «нехватки верхушечного вдоха», сухое першение и натяжение над ключицей',
      'Ограничение сдвига трахеи в сторону при глотании и гипотония передней зубчатой / дельтовидной мышц',
    ],
    kinesiologyTestAndProvocation:
      'Мягкое смещение щитовидного/трахеального комплекса вверх-в сторону или ТЛ надключичной ямки на вдохе с ММТ дельтовидной мышцы.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Декомпрессия мембраны Сибсона и висцеральной шеи',
        technique:
          'Мягкая кранио-каудальная балансировка I ребра и висцерального футляра трахеи во время спокойного носового дыхания пациента.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['scalenes', 'scm', 'suprahyoid-infrahyoid', 'deltoid'],
    relatedOrganIds: ['lungs', 'heart'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'oral-diaphragm'],
    relatedMeridianIds: ['lung', 'stomach', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 176 },
  },
  {
    id: 'fascia-visceralis-transversalis-peritoneum',
    kind: 'fascia',
    name: 'Висцеральная фасция брюшной полости (поперечная, брюшина, брыжейка)',
    latinName: 'Fascia transversalis, peritoneum parietale et radix mesenterii',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Непрерывный внутренний мешок живота: поперечная фасция, предбрюшинная клетчатка, париетальная брюшина и корень брыжейки тонкой кишки (от L2 слева к правому КПС).',
    biomechanicsAndFunction:
      'Поддерживает внутрибрюшное давление, подвешивает тонкий кишечник к задней брюшной стенке и обеспечивает свободное скольжение петель ЖКТ при дыхании.',
    palpationLandmark:
      'Косая линия корня брыжейки: от точки на 2–3 см левее и выше пупка (связка Трейтца) к правой подвздошной ямке (илеоцекальный угол).',
    dysfunctionSigns: [
      'Тянущие боли в пояснице L2–L5 и правом КПС, усиливающиеся после еды',
      'Дисбаланс прямой мышцы живота и четырёхглавой мышцы бедра (связь с тонким кишечником)',
    ],
    kinesiologyTestAndProvocation:
      'Мягкая висцеральная провокация корня брыжейки краниально/медиально с ММТ прямой мышцы живота или четырёхглавой бедра.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Мобилизация корня брыжейки и париетальной брюшины',
        technique:
          'При согнутых коленях пациента мягкое поддерживающее смещение петель тонкой кишки вдоль оси корня брыжейки вверх-влево на выдохе.',
        durationOrDose: '60–90 сек',
      },
    ],
    relatedMuscleIds: ['m-transversus-abdominis-r', 'm-transversus-abdominis-l', 'rectus-abdominis', 'quadriceps-femoris', 'iliopsoas'],
    relatedOrganIds: ['small-intestine', 'large-intestine', 'stomach'],
    relatedDiaphragmIds: ['thoracoabdominal', 'pelvic-floor'],
    relatedMeridianIds: ['small-intestine', 'stomach', 'spleen'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 368 },
  },
  {
    id: 'fascia-visceralis-renalis-gerota',
    kind: 'fascia',
    name: 'Почечная фасция (Герота) и околопочечный висцеральный футляр',
    latinName: 'Fascia renalis (Gerotae) et capsula adiposa',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Фиброзный футляр (передний листок Тольда и задний листок Цукеркандля), окутывающий почку, надпочечник и околопочечную жировую клетчатку; вверху срастается с грудобрюшной диафрагмой, медиально прилежит к psoas.',
    biomechanicsAndFunction:
      'Удерживает почку в физиологическом подвесе и допускает её вертикальную дыхательную экскурсию 2–3 см вдоль «рельсы» большой поясничной мышцы.',
    palpationLandmark:
      'Проекция почек в подреберье спереди-латерально и в косто-вертебральном углу под XII ребром сзади.',
    dysfunctionSigns: [
      'Стойкая слабость подвздошно-поясничной и портняжной/нежной мышц',
      'Поясничная боль при длительном стоянии, ослабевающая лёжа (нефроптоз/фасциальное натяжение)',
    ],
    kinesiologyTestAndProvocation:
      'ММТ подвздошно-поясничной мышцы при мягкой краниальной поддержке почечного ложа вверх под реберную дугу (положительный тест указывает на птоз/фиксацию фасции Герота).',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Висцеральный подъём и балансировка фасции Герота',
        technique:
          'В положении лёжа на спине с согнутыми ногами мягко сопровождать почку вверх и медиально на фазе выдоха, освобождая спайку с psoas.',
        durationOrDose: '4–5 дыхательных циклов',
      },
    ],
    relatedMuscleIds: ['iliopsoas', 'quadratus-lumborum', 'sartorius', 'm-gracilis-r', 'm-gracilis-l'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['thoracoabdominal'],
    relatedMeridianIds: ['kidney', 'bladder'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'posterior', x: 742, y: 344 },
  },
  {
    id: 'fascia-visceralis-endopelvina',
    kind: 'fascia',
    name: 'Висцеральная фасция малого таза (эндопельвическая) и связки тазовых органов',
    latinName: 'Fascia pelvis visceralis (endopelvina) et ligg. sacrouterina / pubovesicalia',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Висцеральные фасции (вокруг органов)',
    anatomyAndLocation:
      'Органно-подвешивающая фасциальная сеть малого таза (крестцово-маточные, лобково-пузырные и кардинальные связки), подвешивающая мочевой пузырь, матку/простату и прямую кишку над тазовой и мочеполовой диафрагмами.',
    biomechanicsAndFunction:
      'Амортизирует давление на органы малого таза при прыжках, кашле и дыхании, напрямую связывая висцеральный статус таза с крестцом (S2–S4) и приводящими мышцами бедра.',
    palpationLandmark:
      'Надлобковая область кзади от лобкового симфиза (мягкое погружение на выдохе) и ости седалища / связки крестца.',
    dysfunctionSigns: [
      'Тазовые боли, нарушение тонуса приводящих мышц бедра, грушевидной и мышц тазового дна',
      'Рецидивирующие торсии крестца (S2–S4) и хроническое напряжение мочеполовой диафрагмы',
    ],
    kinesiologyTestAndProvocation:
      'Надлобковая висцеральная провокация (мягкое смещение мочевого пузыря/матки вверх) с ММТ приводящих мышц бедра, грушевидной и большой ягодичной.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Синхронизация эндопельвической фасции с крестцом',
        technique:
          'Деликатное надлобковое висцеральное прослушивание и уравновешивание крестцово-пузырных / крестцово-маточных тяг на спокойном выдохе.',
        durationOrDose: '60–90 сек',
      },
    ],
    relatedMuscleIds: ['pelvic-floor-muscles', 'hip-adductors', 'piriformis', 'gluteus-maximus'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor', 'urogenital-diaphragm'],
    relatedMeridianIds: ['kidney', 'conception', 'bladder'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 444 },
  },
];

export const FASCIAS: StructuralElementProfile[] = attachImages(RAW_FASCIAS);

const RAW_TENDONS: StructuralElementProfile[] = [
  {
    id: 'tendon-biceps-long-head',
    kind: 'tendon',
    name: 'Сухожилие длинной головки бицепса и поперечная связка',
    latinName: 'Tendo capitis longi m. bicipitis brachii',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Сухожилия плечевого пояса',
    anatomyAndLocation:
      'Проходит внутри плечевого сустава от надсуставного бугорка лопатки через межбугорковую борозду плечевой кости, удерживается поперечной связкой плеча.',
    biomechanicsAndFunction:
      'Центрирует головку плечевой кости при подъёме руки и удерживает переднюю стабильность плечевого сустава.',
    palpationLandmark:
      'Межбугорковая борозда на передней поверхности головки плеча (пальпируется на 2–3 см ниже акромиона при лёгкой наружной ротации).',
    dysfunctionSigns: [
      'Острая или ноющая боль по передней поверхности плеча, усиливающаяся при заведении руки за спину',
      'Щелчки и подвывих сухожилия при супинации/ротации плеча',
      'Тендинопатия, связанная с дисфункцией желудка (меридиан ST) или передним смещением головки плеча',
    ],
    kinesiologyTestAndProvocation:
      'Тест Спида и тест Ергасона (боль в борозде при супинации против сопротивления) + ММТ бицепса с провокацией смещения сухожилия медиально/латерально.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Центрирование сухожилия в межбугорковой борозде',
        technique:
          'Выполнение теста рецепторов Гольджи на сухожилии + дорсальное центрирование головки плечевой кости и релиз малой грудной мышцы.',
        durationOrDose: '30–45 сек с ретестом ММТ',
      },
      {
        modality: 'Рефлекторная (НЛ / НВ)',
        title: 'Проверка висцеро-моторной связи с желудком',
        technique:
          'ТЛ эпигастрия (CV-12) и НЛ-точки 5–6 межреберье слева при слабости двуглавой мышцы.',
        durationOrDose: '30 сек НЛ-активации',
      },
    ],
    relatedMuscleIds: ['biceps-brachii', 'pectoralis-minor', 'subscapularis'],
    relatedOrganIds: ['stomach'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['lung', 'stomach', 'pericardium'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 146, y: 242 },
  },
  {
    id: 'tendon-rotator-cuff',
    kind: 'tendon',
    name: 'Сухожилия вращательной манжеты плеча (надостная, подостная, подлопаточная)',
    latinName: 'Tendines musculorum rotatorum humeri',
    zone: 'upper-limb',
    side: 'posterior',
    categoryLabel: 'Сухожилия плечевого пояса',
    anatomyAndLocation:
      'Срастаются в единую сухожильно-капсулярную манжету вокруг большого и малого бугорков плечевой кости (критическая зона гипоперфузии у большого бугорка).',
    biomechanicsAndFunction:
      'Динамически прижимает головку плеча к суставной впадине лопатки, предотвращая импинджмент под акромионом.',
    palpationLandmark:
      'Передний край акромиона и большой бугорок плечевой кости (надостная — при заведении руки назад, подостная — сзади от бугорка).',
    dysfunctionSigns: [
      '«Болезненная дуга» при отведении руки от 60° до 120°',
      'Невозможность спать на больном плече и ночные прострелы',
      'Гипотония надостной/подлопаточной мышц с компенсаторным гипертонусом верхней трапеции',
    ],
    kinesiologyTestAndProvocation:
      'Тест Джоба («пустая банка») для надостной мышцы, тест Хоукинса–Кеннеди на импинджмент и провокация субакромиального пространства.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Сброс аппарата Гольджи манжеты и мобилизация лопатки',
        technique:
          'Сближение концов сухожилий (техника сухожильного релиза Гольджи) на фоне каудальной мобилизации головки плечевой кости.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['supraspinatus', 'infraspinatus', 'subscapularis', 'deltoid', 'serratus-anterior'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['governing', 'heart', 'small-intestine'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'posterior', x: 842, y: 204 },
  },
  {
    id: 'tendon-common-extensor',
    kind: 'tendon',
    name: 'Общее сухожилие разгибателей и супинаторов предплечья',
    latinName: 'Tendo extensorum communis (epicondylus lateralis humeri)',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Сухожилия верхней конечности',
    anatomyAndLocation:
      'Начинается от латерального надмыщелка плечевой кости (лучевой разгибатель запястья короткий, общий разгибатель пальцев) над головкой лучевой кости.',
    biomechanicsAndFunction:
      'Стабилизирует запястье при хвате кисти и передает нагрузку на локоть через цепь разгибателей руки.',
    palpationLandmark:
      'Наружный надмыщелок плечевой кости и на 1–2 см дистальнее по брюшку короткого лучевого разгибателя запястья.',
    dysfunctionSigns: [
      'Жгучая боль по наружному краю локтя («локоть теннисиста», латеральный эпикондилит)',
      'Слабость хвата, боль при поднятии чашки или повороте ключа',
      'Часто вторичен к блоку головки лучевой кости или слабости разгибателей запястья',
    ],
    kinesiologyTestAndProvocation:
      'Тест Козена / Милла + ММТ лучевых разгибателей запястья при ТЛ латерального надмыщелка и заднем сдвиге головки лучевой кости.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Коррекция головки лучевой кости и сухожильного шва',
        technique:
          'Освобождение кольцевой связки лучевой кости, техника на сухожилии (перекрёстное трение 30 сек) + кинезиотейпирование разгрузки предплечья.',
        durationOrDose: '45–60 сек + ТЛ ретест',
      },
    ],
    relatedMuscleIds: ['wrist-extensors', 'brachioradialis', 'triceps-brachii'],
    relatedOrganIds: ['large-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['large-intestine', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 112, y: 314 },
  },
  {
    id: 'tendon-diaphragm-crura',
    kind: 'tendon',
    name: 'Центральное сухожилие и сухожильные ножки диафрагмы',
    latinName: 'Centrum tendineum et crura diaphragmatis',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Осевые сухожильные структуры',
    anatomyAndLocation:
      'Трёхлистный сухожильный центр под перикардом (место фиксации нижней полой вены) и правая/левая мышечно-сухожильные ножки, крепящиеся к передней поверхности тел L1–L3 и передней продольной связке.',
    biomechanicsAndFunction:
      'Обеспечивает поршневое движение диафрагмы и прямо связывает дыхание с поясничным отделом и большой поясничной мышцей (медиальная дугообразная связка).',
    palpationLandmark:
      'Подмечевидная зона глубоко к телам верхних поясничных позвонков (проекция чревного сплетения) и 8–10 рёберные дуги.',
    dysfunctionSigns: [
      'Поверхностное грудное дыхание, ощущение «подпора» под мечевидным отростком',
      'Рецидивирующие боли в T12–L2 и сбой рефлекса сгибания/разгибания тазобедренного сустава',
      'Рефлюкс-эзофагит (дисфункция пищеводного отверстия диафрагмы)',
    ],
    kinesiologyTestAndProvocation:
      'ММТ подвздошно-поясничной мышцы на максимальном вдохе vs на максимальном выдохе (выявление фиксации ножек диафрагмы).',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Синхронизация куполов и сухожильных ножек диафрагмы',
        technique:
          'Мягкий передне-задний контакт на уровне мечевидного отростка и T12–L2 с сопровождением фаз глубокого дыхания до раскрытия нижних рёбер.',
        durationOrDose: '5–6 медленных дыхательных циклов',
      },
    ],
    relatedMuscleIds: ['iliopsoas', 'quadratus-lumborum', 'rectus-abdominis'],
    relatedOrganIds: ['stomach', 'liver', 'heart'],
    relatedDiaphragmIds: ['thoracoabdominal'],
    relatedMeridianIds: ['conception', 'stomach', 'liver'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 296 },
  },
  {
    id: 'tendon-rectus-femoral',
    kind: 'tendon',
    name: 'Сухожилие квадрицепса и собственная связка надколенника',
    latinName: 'Tendo m. quadricipitis femoris et lig. patellae',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Сухожилия нижней конечности',
    anatomyAndLocation:
      'Продолжение прямой и широких мышц бедра, охватывающее надколенник и прикрепляющееся к бугристости большеберцовой кости.',
    biomechanicsAndFunction:
      'Увеличивает плечо силы разгибания колена на 30% и является замыкающим элементом Поверхностной фронтальной линии при прыжках и ходьбе вниз.',
    palpationLandmark:
      'Верхний полюс надколенника, нижний полюс надколенника и бугристость большеберцовой кости.',
    dysfunctionSigns: [
      'Боль под или над надколенником («колено прыгуна»), дискомфорт при спуске по лестнице',
      'Тугоподвижность и смещение надколенника латерально',
      'Гипотония прямой мышцы бедра при висцеральной нагрузке тонкого кишечника',
    ],
    kinesiologyTestAndProvocation:
      'ММТ квадрицепса + провокация сдвига надколенника вверх/вниз и медиально/латерально (выявление фасциального укорочения сухожилия).',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Мобилизация надколенника и сухожилия Гольджи',
        technique:
          'Мягкое смещение надколенника по 4 векторам до барьера с удержанием, затем эксцентрическая нагрузка на сухожилие и тейпирование надколенника.',
        durationOrDose: '45 сек',
      },
    ],
    relatedMuscleIds: ['quadriceps-femoris', 'sartorius', 'tensor-fasciae-latae'],
    relatedOrganIds: ['small-intestine'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'small-intestine', 'spleen'],
    relatedChainIds: ['superficial-front-line'],
    svgCoords: { view: 'anterior', x: 208, y: 634 },
  },
  {
    id: 'tendon-pes-anserinus',
    kind: 'tendon',
    name: 'Сухожилия «гусиной лапки» (портняжная, тонкая, полусухожильная)',
    latinName: 'Pes anserinus superficialis',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Сухожилия нижней конечности',
    anatomyAndLocation:
      'Общее место прикрепления трёх мышц из разных групп (портняжной, тонкой и полусухожильной) на передне-медиальной поверхности проксимального отдела большеберцовой кости.',
    biomechanicsAndFunction:
      'Динамически защищает колено от вальгусного отклонения и избыточной наружной ротации голени; координирует Спиральную и Глубинную цепи.',
    palpationLandmark:
      'Медиальная поверхность большеберцовой кости на 4–5 см ниже медиальной суставной щели колена.',
    dysfunctionSigns: [
      'Острая локальная болезненность по внутренней стороне ниже колена (анзериновый бурсит/тендинит)',
      'Нарушение баланса между приводящими мышцами, портняжной (надпочечники) и хамстрингами',
      'Плоско-вальгусная установка стоп с внутренней ротацией бедра',
    ],
    kinesiologyTestAndProvocation:
      'ММТ портняжной и стройной мышц с ТЛ зоны гусиной лапки; проверяется связь с функцией надпочечников (портняжная/строгая).',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Дифференцированный релиз сухожилий гусиной лапки и НЛ-коррекция',
        technique:
          'Мягкий миофасциальный релиз портняжной и полусухожильной мышц + проверка и стимуляция НЛ-рефлексов надпочечников.',
        durationOrDose: '45 сек',
      },
    ],
    relatedMuscleIds: ['sartorius', 'hip-adductors', 'hamstrings', 'popliteus'],
    relatedOrganIds: ['kidneys', 'large-intestine'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['spleen', 'kidney', 'liver'],
    relatedChainIds: ['spiral-line', 'deep-front-line'],
    svgCoords: { view: 'anterior', x: 230, y: 658 },
  },
  {
    id: 'tendon-achilles',
    kind: 'tendon',
    name: 'Ахиллово (пяточное) сухожилие',
    latinName: 'Tendo calcaneus (Achillis)',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Сухожилия нижней конечности',
    anatomyAndLocation:
      'Общее сухожилие икроножной и камбаловидной мышц (скрученные на ~90° волокна), крепящееся к задней поверхности пяточного бугра.',
    biomechanicsAndFunction:
      'Накапливает и отдаёт упругую энергию при ходьбе и беге; прямо зависит от венозного оттока из малого таза и состояния надпочечников.',
    palpationLandmark:
      'На 2–6 см выше пяточного бугра (критическая гипососудистая зона сухожилия) и место энтезиса на пятке.',
    dysfunctionSigns: [
      'Утренняя скованность, утолщение и болезненность сухожилия при первых шагах',
      'Щелчки или укорочение тыльного сгибания стопы',
      'Гипотония икроножной/камбаловидной мышцы на фоне стресса или дегидратации',
    ],
    kinesiologyTestAndProvocation:
      'Тест Томпсона (сжатие икры — отсутствие подошвенного сгибания) + ММТ камбаловидной и икроножной мышц при сближении пяточного бугра к икре (проба Гольджи).',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Синхронизация рецепторов Гольджи ахиллова сухожилия',
        technique:
          'Техника сближения мест прикрепления икроножной/камбаловидной мышц с лёгким давлением в средней трети сухожилия, затем эксцентрический сброс.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['gastrocnemius', 'soleus', 'hamstrings'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['bladder', 'kidney'],
    relatedChainIds: ['superficial-back-line'],
    svgCoords: { view: 'posterior', x: 742, y: 782 },
  },
  {
    id: 'tendon-tibialis-posterior',
    kind: 'tendon',
    name: 'Сухожилие задней большеберцовой мышцы и пружинная связка',
    latinName: 'Tendo m. tibialis posterioris et lig. calcaneonaviculare plantare',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Сухожилия нижней конечности',
    anatomyAndLocation:
      'Огибает сзади и снизу медиальную лодыжку под удерживателем сгибателей и веерообразно крепится к ладьевидной, клиновидным и II–IV плюсневым костям.',
    biomechanicsAndFunction:
      'Главный динамический супинатор и «подпорка» медиального продольного свода стопы; ключевой стабилизатор Глубинной фронтальной цепи.',
    palpationLandmark:
      'Позади медиальной лодыжки и у бугристости ладьевидной кости стопы.',
    dysfunctionSigns: [
      'Прогрессирующее уплощение продольного свода стопы и завал пятки в вальгус',
      'Боль по внутренней поверхности лодыжки после ходьбы',
      'Сочетается со слабостью диафрагмы и тазового дна (ГФЦ)',
    ],
    kinesiologyTestAndProvocation:
      'ММТ задней большеберцовой мышцы (инверсия и подошвенное сгибание) + тест удержания свода при подъёме на носок одной ноги.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Освобождение ретромаллеолярного канала и мобилизация ладьевидной кости',
        technique:
          'Мягкое раскрытие удерживателя сгибателей за медиальной лодыжкой, дорсально-медиальная коррекция ладьевидной кости и тейпирование свода.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['tibialis-posterior', 'tibialis-anterior', 'fibularis-peroneus', 'pelvic-floor-muscles'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['plantar-popliteal', 'pelvic-floor'],
    relatedMeridianIds: ['kidney', 'spleen'],
    relatedChainIds: ['deep-front-line', 'spiral-line'],
    svgCoords: { view: 'posterior', x: 786, y: 798 },
  },
];

export const TENDONS: StructuralElementProfile[] = attachImages(RAW_TENDONS);

const RAW_JOINTS: StructuralElementProfile[] = [
  {
    id: 'joint-tmj',
    kind: 'joint',
    name: 'Височно-нижнечелюстной сустав (ВНЧС)',
    latinName: 'Articulatio temporomandibularis',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — голова и ВНЧС',
    anatomyAndLocation:
      'Парный комбинированный сустав между головкой нижней челюсти и нижнечелюстной ямкой височной кости с внутрисуставным фиброзно-хрящевым диском.',
    biomechanicsAndFunction:
      'Глобальный неврологический «переключатель» осанки (связан с тройничным и вестибулярным ядрами); дисфункция прикуса мгновенно меняет тонус мышц шеи, таза и стоп.',
    palpationLandmark:
      'На 1 см кпереди от козелка ушной раковины (оценка симметрии и времени выхода суставных головок при открывании рта).',
    dysfunctionSigns: [
      'Щелчки, хруст, S-образное отклонение челюсти при открывании рта',
      'Бруксизм, боли в шее, шум в ушах и утренние головные боли',
      'Восстановление слабых мышц тела при прокладке ватного валика между зубами (позитивный тест стоматогнатической системы)',
    ],
    kinesiologyTestAndProvocation:
      'ММТ сильной индикаторной мышцы при открытом/сжатом рте, смещении челюсти влево/вправо и при ТЛ самого ВНЧС. Проверка переключения с тестовым валиком.',
    correctionSteps: [
      {
        modality: 'Краниосакральная',
        title: 'Декомпрессия ВНЧС и балансировка крыловидных мышц',
        technique:
          'Интраоральный релиз латеральной и медиальной крыловидных мышц + мягкая каудальная декомпрессия нижней челюсти на выдохе.',
        durationOrDose: '45–60 сек с каждой стороны',
      },
    ],
    relatedMuscleIds: ['masseter', 'temporalis', 'lateral-pterygoid', 'medial-pterygoid', 'suprahyoid-infrahyoid'],
    relatedOrganIds: ['stomach', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'triple-warmer', 'small-intestine'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 214, y: 94 },
  },
  {
    id: 'joint-ao-c0c1',
    kind: 'joint',
    name: 'Атланто-затылочный и атланто-осевой суставы (C0–C1–C2)',
    latinName: 'Articulationes atlantooccipitalis et atlantoaxialis',
    zone: 'cervical',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — шейный отдел',
    anatomyAndLocation:
      'Верхний шейный комплекс между мыщелками затылочной кости, атлантом (C1) и аксисом (C2); защищён мощной крестообразной и крыловидными связками.',
    biomechanicsAndFunction:
      'Обеспечивает 50% кивательных движений (C0–C1) и 50% ротации головы (C1–C2); поддерживает глазной и вестибулярный горизонты.',
    palpationLandmark:
      'Выйная линия затылка и поперечные отростки C1 (между сосцевидным отростком и углом нижней челюсти).',
    dysfunctionSigns: [
      'Затылочные боли, головокружение, нарушение зрения и тонуса подъязычной области',
      'Ограничение ротации шеи в одну сторону и компенсаторный сколиоз позвоночника',
      'Персистирующий гипертонус подзатылочных мышц',
    ],
    kinesiologyTestAndProvocation:
      'После пробы безопасности Шарпа–Пурсера и де Клейна — ММТ глубоких сгибателей шеи при лёгком повороте головы или ТЛ подзатылочной ямки C0–C1.',
    correctionSteps: [
      {
        modality: 'Краниосакральная',
        title: 'Мягкий атланто-затылочный релиз (AO Release)',
        technique:
          'Подушечками пальцев под затылочной чешуёй (не давя на С1) дождаться расслабления подзатылочных мышц и декомпрессии мыщелков.',
        durationOrDose: '60–90 сек',
      },
    ],
    relatedMuscleIds: ['suboccipitals', 'deep-neck-flexors', 'scm', 'cervical-extensors'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'gallbladder', 'governing'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    svgCoords: { view: 'posterior', x: 773, y: 118 },
  },
  {
    id: 'joint-scj-acj',
    kind: 'joint',
    name: 'Грудино-ключичный и акромиально-ключичный суставы',
    latinName: 'Articulationes sternoclavicularis et acromioclavicularis',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — плечевой пояс',
    anatomyAndLocation:
      'Единственные истинные костные сочленения, соединяющие верхнюю конечность с осевым скелетом через S-образную ключицу.',
    biomechanicsAndFunction:
      'Позволяют ключице подниматься, вращаться вокруг оси и уходить назад при подъёме руки над головой; защищают сосуды верхней апертуры.',
    palpationLandmark:
      'Медиальный конец ключицы у вырезки грудины (SCJ) и латеральный край ключицы у акромиона (ACJ).',
    dysfunctionSigns: [
      'Щелчок или боль при отведении руки выше 120°',
      'Выпячивание или фиксация медиальной головки ключицы в переднем положении',
      'Рефлекторная слабость ключичной порции большой грудной мышцы',
    ],
    kinesiologyTestAndProvocation:
      'ММТ ключичной БГМ и надостной мышц при лёгком смещении медиального конца ключицы кпереди/кзади/вниз.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Мобилизация ключицы (SCJ / ACJ) на фазах дыхания',
        technique:
          'Мягкое скольжение медиального конца ключицы дорсально и каудально во время выдоха и отведения руки пациента.',
        durationOrDose: '4–5 дыхательных циклов',
      },
    ],
    relatedMuscleIds: ['pectoralis-major-clavicular', 'upper-trapezius', 'scm', 'deltoid'],
    relatedOrganIds: ['stomach', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['kidney', 'stomach', 'large-intestine'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 212, y: 178 },
  },
  {
    id: 'joint-ghj',
    kind: 'joint',
    name: 'Плечевой сустав (плечелопаточное сочленение)',
    latinName: 'Articulatio humeri',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — плечевой пояс',
    anatomyAndLocation:
      'Шаровидный сустав с наибольшей амплитудой в организме между большой головкой плечевой кости и мелкой суставной впадиной лопатки с суставной губой.',
    biomechanicsAndFunction:
      'Центрирование головки зависит от слаженной пары «передняя/задняя манжета + нижняя трапеция + передняя зубчатая мышца».',
    palpationLandmark:
      'Передняя, латеральная (под акромионом) и задняя суставная щель плечевого сустава.',
    dysfunctionSigns: [
      'Синдром «замороженного плеча» (адгезивный капсулит), переднее смещение головки плеча',
      'Боль при заведении руки за спину и наружной ротации',
      'Нарушение плече-лопаточного ритма (крыловидная лопатка)',
    ],
    kinesiologyTestAndProvocation:
      'Оценка плече-лопаточного ритма + ММТ дельтовидной, подлопаточной и передней зубчатой мышц при дорсальной/каудальной тракции головки плеча.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Центрирование и каудальное скольжение плечевого сустава',
        technique:
          'Дорсально-каудальная тракция головки плечевой кости при мягком релизе задней/нижней капсулы и восстановлении тонуса передней зубчатой мышцы.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['deltoid', 'supraspinatus', 'infraspinatus', 'subscapularis', 'serratus-anterior', 'coracobrachialis'],
    relatedOrganIds: ['heart', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['small-intestine', 'large-intestine', 'heart', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 158, y: 204 },
  },
  {
    id: 'joint-elbow-radioulnar',
    kind: 'joint',
    name: 'Локтевой и проксимальный лучелоктевой суставы',
    latinName: 'Articulatio cubiti et articulatio radioulnaris proximalis',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — верхняя конечность',
    anatomyAndLocation:
      'Комплексный сустав из плечелоктевого, плечелучевого и проксимального лучелоктевого сочленений (головка лучевой кости в кольцевой связке).',
    biomechanicsAndFunction:
      'Обеспечивает сгибание/разгибание предплечья и пронацию/супинацию; головка лучевой кости часто смещается вперёд/кзади при падениях на руку или спазме двуглавой мышцы.',
    palpationLandmark:
      'Головка лучевой кости дистальнее латерального надмыщелка (прокручивается при пронации/супинации).',
    dysfunctionSigns: [
      'Ограничение полного разгибания или супинации предплечья',
      'Боль по латеральному или медиальному надмыщелку, иррадиирующая в кисть',
      'Вторичная слабость разгибателей кисти и плечелучевой мышцы',
    ],
    kinesiologyTestAndProvocation:
      'ММТ плечелучевой мышцы и разгибателей запястья при смещении головки лучевой кости кпереди или кзади.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Репозиция головки лучевой кости',
        technique:
          'Мягкий импульс или мобилизация головки лучевой кости в направлении восстановления тонуса по ММТ (обычно дорсально при супинации или вентрально при пронации).',
        durationOrDose: '20–30 сек + ретест',
      },
    ],
    relatedMuscleIds: ['brachioradialis', 'biceps-brachii', 'triceps-brachii', 'wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['large-intestine', 'small-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['lung', 'large-intestine', 'heart', 'pericardium'],
    relatedChainIds: ['arm-lines'],
    svgCoords: { view: 'anterior', x: 120, y: 306 },
  },
  {
    id: 'joint-costovertebral',
    kind: 'joint',
    name: 'Рёберно-позвоночные и грудино-рёберные сочленения',
    latinName: 'Articulationes costovertebrales et sternocostales',
    zone: 'thoracic',
    side: 'posterior',
    categoryLabel: 'Мелкие суставы — грудная клетка и позвоночник',
    anatomyAndLocation:
      'Двойное сочленение каждого ребра с телами и поперечными отростками грудных позвонков, плюс переднее хрящевое крепление к грудине; тесно соседствуют с симпатическим стволом.',
    biomechanicsAndFunction:
      'Обеспечивают «ручку ведра» (нижние рёбра) и «ручку насоса» (верхние рёбра) при вдохе; реберно-позвоночный блок провоцирует межрёберную невралгию и вегетативный сбой.',
    palpationLandmark:
      'Паравертебрально на 2–3 см от остистых отростков (углы и бугорки рёбер T1–T12) и хрящи грудины спереди.',
    dysfunctionSigns: [
      'Колющая боль в груди или под лопаткой на глубоком вдохе («остеохондроз с иррадиацией в сердце»)',
      'Асимметрия экскурсии грудной клетки на вдохе',
      'Реактивность симпатической нервной системы на уровне соответствующих внутренних органов',
    ],
    kinesiologyTestAndProvocation:
      'ММТ ромбовидных или грудных мышц на максимальном вдохе/выдохе + ТЛ угла блокированного ребра.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Дыхательная мобилизация рёберно-позвоночного угла',
        technique:
          'Мягкая стабилизация угла ребра кпереди/вниз на вдохе (для инспираторного блока) или сопротивление выдоху (экспираторный блок) с последующим ретестом.',
        durationOrDose: '4 дыхательных цикла',
      },
    ],
    relatedMuscleIds: ['serratus-anterior', 'rhomboids', 'erector-spinae', 'pectoralis-major-sternal'],
    relatedOrganIds: ['lungs', 'heart', 'liver', 'stomach'],
    relatedDiaphragmIds: ['thoracoabdominal', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['bladder', 'lung', 'gallbladder'],
    relatedChainIds: ['spiral-line', 'lateral-line'],
    svgCoords: { view: 'posterior', x: 742, y: 268 },
  },
  {
    id: 'joint-sij',
    kind: 'joint',
    name: 'Крестцово-подвздошное сочленение (КПС)',
    latinName: 'Articulatio sacroiliaca',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Крупные и средние суставы — таз',
    anatomyAndLocation:
      'Ушковидное сочленение между крестцом и подвздошной костью, стабилизированное мощнейшими межкостной, крестцово-бугорной и крестцово-остистой связками.',
    biomechanicsAndFunction:
      'Гасит ударные нагрузки от нижних конечностей и выполняет циклы нутации/контрнутации крестца в фазе шага (силовое замыкание с помощью большой ягодичной и широчайшей мышц).',
    palpationLandmark:
      'Задние верхние подвздошные ости (ЗВПО / PSIS) и крестцовая борозда по обе стороны от S1–S3.',
    dysfunctionSigns: [
      'Односторонняя глубокая боль в зоне ЗВПО с иррадиацией в пах или заднюю поверхность бедра',
      'Положительный феномен опережения при наклоне вперёд (тест Жилле / сгибательный тест стоя)',
      'Разная «функциональная длина ног» и слабость грушевидной / ягодичной мышц с одной стороны',
    ],
    kinesiologyTestAndProvocation:
      'Тест Жилле (подъём бедра стоя), проба Патрика–Фабера, ММТ большой/средней ягодичной и грушевидной мышц с ТЛ линии КПС (категория таза I, II или III по Де Жарнетту).',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Балансировка подвздошной кости и крестцово-бугорной связки',
        technique:
          'Определение вектора сдвига подвздошной кости (PI/AS или Inflare/Outflare) через ТЛ КПС, мягкая тракция с тазовыми блоками Сото или мышечно-энергетическая техника (ПИР).',
        durationOrDose: '2–3 минуты на тазовых блоках / 3 цикла ПИР',
      },
    ],
    relatedMuscleIds: ['piriformis', 'gluteus-maximus', 'gluteus-medius', 'quadratus-lumborum', 'iliopsoas'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['bladder', 'kidney', 'governing'],
    relatedChainIds: ['functional-lines', 'superficial-back-line', 'lateral-line'],
    svgCoords: { view: 'posterior', x: 748, y: 408 },
  },
  {
    id: 'joint-hip',
    kind: 'joint',
    name: 'Тазобедренный сустав',
    latinName: 'Articulatio coxae',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — нижняя конечность',
    anatomyAndLocation:
      'Глубокий чашеобразный сустав между головкой бедренной кости и вертлужной впадиной таза с прочной Y-образной подвздошно-бедренной связкой.',
    biomechanicsAndFunction:
      'Обеспечивает 3-осевое движение ноги в шаге; ограничение разгибания или внутренней ротации мгновенно перегружает поясницу (L4–L5) и колено.',
    palpationLandmark:
      'Паховая складка кнаружи от пульсации бедренной артерии и область над большим вертелом.',
    dysfunctionSigns: [
      'Паховая боль («С-симптом»), скованность при надевании носков и внутренней ротации бедра',
      'Положительный тест Патрика и укорочение подвздошно-поясничной мышцы / прямой бедра',
      'Латеральное смещение или передний импинджмент головки бедра',
    ],
    kinesiologyTestAndProvocation:
      'Тест Томаса и тест Фабера + ММТ внутренней запирательной, подвздошно-поясничной и средней ягодичной мышц при аксиальной декомпрессии сустава.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Латерально-каудальная тракция и центрирование тазобедренного сустава',
        technique:
          'Ритмичная тракция вдоль шейки бедра (под углом 45°) с внутренней/наружной ротацией и ретестом ММТ приводящих и ягодичных мышц.',
        durationOrDose: '60 сек',
      },
    ],
    relatedMuscleIds: ['iliopsoas', 'gluteus-medius', 'gluteus-maximus', 'obturator-internus', 'hip-adductors'],
    relatedOrganIds: ['urogenital', 'gallbladder'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['gallbladder', 'liver', 'kidney'],
    relatedChainIds: ['deep-front-line', 'spiral-line', 'lateral-line'],
    svgCoords: { view: 'anterior', x: 196, y: 472 },
  },
  {
    id: 'joint-knee',
    kind: 'joint',
    name: 'Коленный и проксимальный межберцовый суставы',
    latinName: 'Articulatio genus et articulatio tibiofibularis proximalis',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — нижняя конечность',
    anatomyAndLocation:
      'Сложный мыщелковый сустав (бедро–большеберцовая кость–надколенник) с двумя менисками и крестообразными/коллатеральными связками, связанный с головкой малоберцовой кости.',
    biomechanicsAndFunction:
      'В терминальном разгибании голень немного ротируется наружу (подколенная мышца «отпирает» колено в начале сгибания); колено часто страдает как «жертва» между стопой и тазом.',
    palpationLandmark:
      'Медиальная и латеральная суставные щели с обеих сторон связки надколенника, а также головка малоберцовой кости снаружи-сзади.',
    dysfunctionSigns: [
      'Блок полного разгибания или боль в подколенной ямке',
      'Гипертонус/гипотония подколенной мышцы (ключевой стабилизатор колена, связь с жёлчным пузырём)',
      'Переднее или заднее смещение головки малоберцовой кости и ротационный сдвиг голени',
    ],
    kinesiologyTestAndProvocation:
      'ММТ подколенной мышцы (внутренняя ротация голени при 20–30° сгибания) и оценка передне-заднего сдвига головки малоберцовой кости.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Коррекция головки малоберцовой кости и подколенной мышцы',
        technique:
          'Мягкое скольжение головки малоберцовой кости кпереди или кзади по вектору восстановления тонуса ММТ + релиз подколенной фасции.',
        durationOrDose: '30–45 сек',
      },
    ],
    relatedMuscleIds: ['popliteus', 'quadriceps-femoris', 'hamstrings', 'gastrocnemius', 'sartorius'],
    relatedOrganIds: ['gallbladder', 'small-intestine'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['gallbladder', 'stomach', 'bladder'],
    relatedChainIds: ['spiral-line', 'superficial-back-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 214, y: 626 },
  },
  {
    id: 'joint-ankle-subtalar',
    kind: 'joint',
    name: 'Голеностопный и подтаранный суставы стопы',
    latinName: 'Articulationes talocruralis et subtalaris',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Крупные и средние суставы — нижняя конечность',
    anatomyAndLocation:
      'Надтаранный (блоковидный: большеберцовая/малоберцовая вилка и блок таранной кости) и подтаранный (между таранной и пяточной костями) суставы.',
    biomechanicsAndFunction:
      'Управляют пронацией/супинацией стопы при опоре на пятку; после старых подворотов голеностопа таранная кость часто остаётся в передней фиксации, «отключая» ягодичные мышцы через проприоцепцию.',
    palpationLandmark:
      'Шейка таранной кости кпереди от обеих лодыжек и подлодыжечные бороздки (синус предплюсны).',
    dysfunctionSigns: [
      'Ограничение тыльного сгибания в тесте приседа или у стенки (колено не доходит до носка)',
      'Повторяющиеся подвороты стопы кнаружи (инверсионные травмы)',
      'Глобальная гипотония мышц таза и поясницы, пропадающая при фиксации стопы в нейтрали',
    ],
    kinesiologyTestAndProvocation:
      'Оценка скольжения таранной кости кзади при тыльном сгибании + ММТ большой ягодичной и малоберцовых мышц с ТЛ голеностопного и подтаранного суставов.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Дорсальное центрирование таранной кости и мобилизация подтаранного сустава',
        technique:
          'Лёгкая аксиальная тракция стопы с мягкой дорсальной коррекцией таранной кости в вилку голеностопа (часто с лёгким трастом или МЭТ) + проверка малоберцовых мышц.',
        durationOrDose: '30–45 сек + ретест шага',
      },
    ],
    relatedMuscleIds: ['tibialis-anterior', 'tibialis-posterior', 'fibularis-peroneus', 'soleus'],
    relatedOrganIds: ['kidneys', 'urogenital'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'bladder', 'kidney'],
    relatedChainIds: ['lateral-line', 'superficial-front-line', 'spiral-line'],
    svgCoords: { view: 'anterior', x: 214, y: 786 },
  },
];

export const JOINTS: StructuralElementProfile[] = [
  ...attachImages(RAW_JOINTS),
  ...JOINTS_350_NEW,
];

export const BONES: StructuralElementProfile[] = SKELETON_206_BONES;

const RAW_VESSELS: StructuralElementProfile[] = [
  {
    id: 'vessel-carotid-jugular',
    kind: 'vessel',
    name: 'Сонная артерия и внутренняя яремная вена (яремное отверстие)',
    latinName: 'A. carotis communis et v. jugularis interna',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Сосуды головы и шеи',
    anatomyAndLocation:
      'Проходят в едином сонном влагалище под грудино-ключично-сосцевидной мышцей вместе с блуждающим нервом (X); яремная вена обеспечивает >90% венозного оттока из полости черепа через яремное отверстие.',
    biomechanicsAndFunction:
      'Беспрепятственный венозный отток критичен для стабильности внутричерепного давления; компрессия на уровне С0–С1, ГКС или верхней апертуры вызывает венозный застой мозга.',
    palpationLandmark:
      'Медиальный край ГКС (оценка пульсации и симметрии напряжения фасциального влагалища; грубое давление на область каротидного синуса противопоказано!).',
    dysfunctionSigns: [
      'Распирающие утренние головные боли («тяжёлая голова»), мешки под глазами, шум в ушах',
      'Постнагрузочное головокружение и вегетативная лабильность',
      'Положительная проба де Клейна / компрессия верхней грудной апертуры',
    ],
    kinesiologyTestAndProvocation:
      'Оценка венозного дренажа: проба Вальсальвы / мягкое раскрытие яремной области или венозных синусов с ретестом глубоких сгибателей шеи.',
    correctionSteps: [
      {
        modality: 'Краниосакральная',
        title: 'Дренаж венозных синусов черепа и освобождение верхней апертуры',
        technique:
          'Мягкое фасциальное раскрытие затылочно-сосцевидного шва (зона яремного отверстия) и венозного угла под ключицей без давления на сонный синус.',
        durationOrDose: '60–90 сек',
      },
      {
        modality: 'Рефлекторная (НЛ / НВ)',
        title: 'Нейрососудистая коррекция (точки Беннетта) на лобных и теменных буграх',
        technique:
          'Лёгкий контакт до появления синхронной капиллярной пульсации 60–70 уд/мин.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['scm', 'suboccipitals', 'scalenes', 'deep-neck-flexors'],
    relatedOrganIds: ['sinuses', 'heart'],
    relatedDiaphragmIds: ['cranial-tentorium', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'small-intestine', 'governing'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 234, y: 146 },
  },
  {
    id: 'vessel-subclavian-tos',
    kind: 'vessel',
    name: 'Подключичные сосуды и подмышечный сосудистый пучок (зоны TOS)',
    latinName: 'A. et v. subclavia / axillaris',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Сосуды верхней апертуры и рук',
    anatomyAndLocation:
      'Проходят три узких анатомических перешейка (синдром грудного выхода TOS): межлестничное пространство, рёберно-ключичный зазор и под малой грудной мышцей.',
    biomechanicsAndFunction:
      'Обеспечивают артериальное питание всей верхней конечности и венозно-лимфатический сброс в венозный угол (область точки KI-27).',
    palpationLandmark:
      'Надключичная ямка между передней и средней лестничными мышцами и зона под клювовидным отростком.',
    dysfunctionSigns: [
      'Холодные бледные или отёчные кисти, быстрая усталость рук при работе на весу (укладка волос, вождение)',
      'Ослабление радиального пульса при отведении руки вверх (позитивные пробы Адсона, Райта, Рооса)',
      'Асимметричное снижение ММТ всей верхней конечности при поднятии рук вверх',
    ],
    kinesiologyTestAndProvocation:
      'Проба Адсона (вдох + поворот головы к руке + контроль пульса), проба Райта (отведение руки 120°) и ММТ сгибателей кисти во время провокации трех тоннелей TOS.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Трехуровневая декомпрессия TOS (лестничные · ключица · малая грудная)',
        technique:
          'Последовательный мягкий релиз передней/средней лестничных мышц, опускание I ребра, мобилизация ключицы и расслабление малой грудной мышцы с контролем пульса и ММТ.',
        durationOrDose: '2–3 минуты поэтапно',
      },
    ],
    relatedMuscleIds: ['scalenes', 'pectoralis-minor', 'coracobrachialis', 'pectoralis-major-clavicular'],
    relatedOrganIds: ['lungs', 'heart'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['lung', 'pericardium', 'heart'],
    relatedChainIds: ['arm-lines', 'deep-front-line'],
    svgCoords: { view: 'anterior', x: 202, y: 184 },
  },
  {
    id: 'vessel-thoracic-duct',
    kind: 'vessel',
    name: 'Грудной лимфатический проток и млечная цистерна',
    latinName: 'Ductus thoracicus et cisterna chyli',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Лимфатические коллекторы',
    anatomyAndLocation:
      'Главный лимфатический коллектор тела: начинается от цистерны хили на уровне T12–L2 (между ножками диафрагмы), поднимается в заднем средостении и впадает в левый венозный угол.',
    biomechanicsAndFunction:
      'Собирает лимфу от нижних конечностей, таза, живота, левой половины груди и левой руки; работает исключительно за счёт присасывающего действия грудобрюшной диафрагмы и свободы верхней апертуры.',
    palpationLandmark:
      'Эпигастрий на 3–4 см выше пупка глубоко по центру (проекция цистерны хили) и левая надключичная ямка (точка входа в венозный угол).',
    dysfunctionSigns: [
      'Хроническая отёчность лица/ног, пастозность тканей и застой в малом тазу',
      'Ощущение токсической усталости, замедленное восстановление и болезненность НЛ-точек Чапмена',
      '«Выпадение» индикаторных мышц левой стороны при блоке диафрагмы',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ левого венозного угла (KI-27 слева) или зоны цистерны хили на глубоком вдохе при ММТ грудной мышцы или поясничной мышцы.',
    correctionSteps: [
      {
        modality: 'Рефлекторная (НЛ / НВ)',
        title: 'Сброс венозного угла (терминальный дренаж) и активация цистерны хили',
        technique:
          'Правило лимфатического дренажа сверху вниз: сначала мягкий помпаж левой/правой надключичных ямок (30 сек), затем диафрагмальное дыхание с мягкой вибрацией под мечевидным отростком.',
        durationOrDose: '60–90 сек',
      },
    ],
    relatedMuscleIds: ['pectoralis-major-clavicular', 'iliopsoas', 'rectus-abdominis'],
    relatedOrganIds: ['small-intestine', 'liver', 'kidneys'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'thoracoabdominal'],
    relatedMeridianIds: ['kidney', 'spleen', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 266, y: 174 },
  },
  {
    id: 'vessel-aorta-celiac',
    kind: 'vessel',
    name: 'Брюшная аорта, чревный ствол и брыжеечные сосуды',
    latinName: 'Aorta abdominalis, truncus coeliacus et a. mesenterica superior',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Висцеральные сосуды туловища',
    anatomyAndLocation:
      'Проходит забрюшинно чуть левее средней линии спереди от тел позвонков L1–L4 (бифуркация на L4); чревный ствол кровоснабжает желудок, печень и селезёнку на уровне T12–L1.',
    biomechanicsAndFunction:
      'Ткани корня брыжейки и сосудистые ножки органов задают ось висцеральной подвижности; спазм ножек диафрагмы или аортального сплетения меняет тонус мышц живота и спины.',
    palpationLandmark:
      'Срединная линия живота от эпигастрия до пупка (оценка направления и симметрии пульсации и расслабленности околоаортальной фасции; при аневризме пальпация запрещена!).',
    dysfunctionSigns: [
      'Смещённая, жёсткая пульсация в эпигастрии, тяжесть в верхней части живота после еды',
      'Рецидивирующий блок сегмента T12–L2 и слабость прямой мышцы живота / подвздошно-поясничной',
      'Вегетативная тревога солнечного сплетения',
    ],
    kinesiologyTestAndProvocation:
      'ММТ большой грудной (ключичной) или поясничной мышцы при мягкой висцеральной тракции эпигастрия (направленное слушание к позвоночнику) на выдохе.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Снятие напряжения чревного сплетения и корня брыжейки',
        technique:
          'Деликатный контакт на эпигастрии и по линии корня брыжейки (от левого подреберья к правой подвздошной ямке) на мягком выдохе без силового давления.',
        durationOrDose: '60 сек',
      },
    ],
    relatedMuscleIds: ['rectus-abdominis', 'iliopsoas', 'erector-spinae'],
    relatedOrganIds: ['stomach', 'pancreas', 'small-intestine', 'liver'],
    relatedDiaphragmIds: ['thoracoabdominal'],
    relatedMeridianIds: ['stomach', 'spleen', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 254, y: 332 },
  },
  {
    id: 'vessel-portal-hepatic',
    kind: 'vessel',
    name: 'Воротная вена печени и печёночный венозный отток',
    latinName: 'V. portae hepatis et vv. hepaticae',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Висцеральные сосуды туловища',
    anatomyAndLocation:
      'Воротная вена собирает всю кровь от ЖКТ (желудка, кишечника, поджелудочной железы, селезёнки) в ворота печени через гепатодуоденальную связку.',
    biomechanicsAndFunction:
      'Обеспечивает 75% кровотока печени и первую линию фильтрации/детоксикации; скорость портального тока зависит от перепада давления между грудной клеткой и брюшной полостью при вдохе.',
    palpationLandmark:
      'Правое подреберье в зоне проекции ворот печени и жёлчного пузыря (медиальнее среднеключичной линии под VII–IX рёбрами).',
    dysfunctionSigns: [
      'Полнокровие и тяжесть в правом подреберье, геморроидальный/тазовый венозный застой',
      'Слабость грудинной порции большой грудной мышцы (справа) и ромбовидной мышцы',
      'Позитивные химические/детоксикационные провокации в ММТ',
    ],
    kinesiologyTestAndProvocation:
      'ММТ большой грудной (грудинной порции) и ромбовидной справа при мягком приподнимании правого края рёберной дуги (висцеральный лифт печени) и на глубоком вдохе.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Висцеральный помпаж и лифтинг печени',
        technique:
          'Пальцы мягко под правую рёберную дугу: ритмичное сближение/поддержка правого купола печени на выдохе (усиление оттока из синусоидов) — противопоказано при острых гепатитах и ЖКБ с крупными камнями.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['pectoralis-major-sternal', 'rhomboids', 'serratus-anterior'],
    relatedOrganIds: ['liver', 'gallbladder', 'small-intestine'],
    relatedDiaphragmIds: ['thoracoabdominal'],
    relatedMeridianIds: ['liver', 'gallbladder'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 214, y: 312 },
  },
  {
    id: 'vessel-iliac-pelvic',
    kind: 'vessel',
    name: 'Подвздошные сосуды и венозное сплетение малого таза',
    latinName: 'A. et v. iliaca communis / interna / externa',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Сосуды таза и нижней конечности',
    anatomyAndLocation:
      'От бифуркации аорты на L4 разделяются на внутреннюю (питание тазовых органов, ягодиц) и наружную (переходит в бедренную артерию под паховой связкой) ветви.',
    biomechanicsAndFunction:
      'Спазм подвздошно-поясничной мышцы, фиксация тазовой диафрагмы или рубцы в нижней трети живота нарушают венозно-лимфатический отток от малого таза и ног.',
    palpationLandmark:
      'Линия от пупка к середине паховой связки; сосудистая лакуна под паховой связкой.',
    dysfunctionSigns: [
      'Хронические тазовые боли, ощущение распирания внизу живота и варикоз малого таза',
      'Двустороннее или одностороннее ослабление приводящих и ягодичных мышц стоя vs лёжа',
      'Похолодание стоп и судороги икр по ночам',
    ],
    kinesiologyTestAndProvocation:
      'Сравнительный ММТ мышц нижней конечности лёжа vs стоя + проба ТЛ на тазовую диафрагму и область паховой связки.',
    correctionSteps: [
      {
        modality: 'Висцеральная остеопатия',
        title: 'Синхронизация тазовой и грудобрюшной диафрагм (венозная помпа)',
        technique:
          'Мягкий релиз тазового дна и подвздошной фасции с последующим активным диафрагмальным дыханием в положении с приподнятым тазом.',
        durationOrDose: '60–90 сек',
      },
    ],
    relatedMuscleIds: ['iliopsoas', 'pelvic-floor-muscles', 'obturator-internus', 'hip-adductors'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor', 'thoracoabdominal'],
    relatedMeridianIds: ['kidney', 'bladder', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 224, y: 448 },
  },
  {
    id: 'vessel-femoral-popliteal',
    kind: 'vessel',
    name: 'Бедренная и подколенная артерии (бедренный и Гунтеров каналы)',
    latinName: 'A. et v. femoralis / poplitea',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Сосуды таза и нижней конечности',
    anatomyAndLocation:
      'Проходят по Скарпову треугольнику под портняжной мышцей в приводящий (Гунтеров) канал и выходят в подколенную ямку через сухожильную щель большой приводящей мышцы.',
    biomechanicsAndFunction:
      'Резкий гипертонус портняжной, приводящих или подколенной мышц сдавливает сосудисто-нервный пучок на входе или выходе канала приводящих мышц.',
    palpationLandmark:
      'Пульсация бедренной артерии под паховой связкой (середина между ПВПО и лобком) и пульс в центре подколенной ямки при полусогнутом колене.',
    dysfunctionSigns: [
      'Тяжесть и скованность в колене/икре при ходьбе на дистанцию, венозная сетка у внутреннего колена',
      'Онемение передне-медиальной поверхности голени (подкожный нерв в Гунтеровом канале)',
      'Слабость подколенной мышцы и мышц задней поверхности голени',
    ],
    kinesiologyTestAndProvocation:
      'ММТ подколенной мышцы и приводящих бедра при ТЛ дистальной трети медиальной поверхности бедра (выход Гунтерова канала) и подколенной ямки.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Освобождение приводящего (Гунтерова) канала и подколенной диафрагмы',
        technique:
          'Мягкое фасциальное отделение портняжной и приводящей мышц от медиальной широкой мышцы бедра + декомпрессия подколенной ямки.',
        durationOrDose: '45–60 сек',
      },
    ],
    relatedMuscleIds: ['sartorius', 'hip-adductors', 'popliteus', 'gastrocnemius'],
    relatedOrganIds: ['small-intestine', 'urogenital'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['spleen', 'liver', 'bladder'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 230, y: 518 },
  },
  {
    id: 'vessel-saphenous-pedal',
    kind: 'vessel',
    name: 'Подкожная вена, тарзальный канал и тыльная артерия стопы',
    latinName: 'V. saphena magna, canalis tarsalis et a. dorsalis pedis',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Сосуды таза и нижней конечности',
    anatomyAndLocation:
      'Большая подкожная вена поднимается кпереди от медиальной лодыжки вдоль голени и бедра; задняя большеберцовая артерия/нерв проходят в тарзальном канале за медиальной лодыжкой.',
    biomechanicsAndFunction:
      'Ключевые маркеры периферического кровообращения стопы; ущемление в тарзальном канале имитирует пяточную шпору и снижает проприоцептивный ответ всей стопы.',
    palpationLandmark:
      'Пульсация тыльной артерии стопы (между сухожилиями разгибателя I и II пальцев на подъёме стопы) и задней большеберцовой артерии за медиальной лодыжкой.',
    dysfunctionSigns: [
      'Жжение и покалывание по подошве стопы (тарзальный туннельный синдром)',
      'Вечерний отёк стоп и лодыжек, расширение вен по внутреннему краю голени',
      'Положительная проба на снижение пульсации или холодные пальцы стоп',
    ],
    kinesiologyTestAndProvocation:
      'Контроль пульсации тыльной артерии стопы (обязательный скрининг до ортопедических/тейпирующих манипуляций!) + симптом Тинеля за медиальной лодыжкой.',
    correctionSteps: [
      {
        modality: 'Структурная / Миофасциальная',
        title: 'Освобождение тарзального канала и венозной помпы стопы',
        technique:
          'Мягкое фасциальное раскрытие удерживателя сгибателей за медиальной лодыжкой, мобилизация таранной кости и лимфодренажное тейпирование от стопы вверх.',
        durationOrDose: '45 сек',
      },
    ],
    relatedMuscleIds: ['tibialis-posterior', 'tibialis-anterior', 'soleus', 'gastrocnemius'],
    relatedOrganIds: ['kidneys', 'heart'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['spleen', 'liver', 'stomach', 'kidney'],
    relatedChainIds: ['deep-front-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 222, y: 804 },
  },
];

export const VESSELS: StructuralElementProfile[] = attachImages(RAW_VESSELS);

export const STRUCTURAL_ELEMENTS: StructuralElementProfile[] = [
  ...FASCIAS,
  ...TENDONS,
  ...JOINTS,
  ...BONES,
  ...VESSELS,
];

export const STRUCTURAL_KIND_LABELS: Record<StructuralElementKind, { singular: string; plural: string }> = {
  fascia: { singular: 'Фасция', plural: 'Фасции' },
  tendon: { singular: 'Сухожилие', plural: 'Сухожилия' },
  joint: { singular: 'Сустав', plural: 'Суставы' },
  bone: { singular: 'Кость / Ориентир', plural: 'Кости' },
  vessel: { singular: 'Сосуд / Коллектор', plural: 'Сосуды' },
};

export function findStructuralElement(
  kind: StructuralElementKind,
  id: string
): StructuralElementProfile | undefined {
  return STRUCTURAL_ELEMENTS.find((item) => item.kind === kind && item.id === id);
}
