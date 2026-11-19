import {
  AnatomicalSide,
  AnatomicalZoneId,
  CorrectionStep,
  PainBodyView,
  StructuralElementProfile,
} from '../types/atlas';
import { resolveBoneAnatomyImage } from './structuralImages';

interface BoneSeed {
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

function makeBone(seed: BoneSeed): StructuralElementProfile {
  const img = resolveBoneAnatomyImage(seed.id, seed.name, seed.categoryLabel);
  return {
    id: seed.id,
    kind: 'bone',
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
        title: `Мобилизация и разгрузка прикреплений (${seed.name})`,
        technique:
          'Мягкое позиционное выведение сегмента в сторону фасилитации на дыхании пациента с последующим снятием тяги прикрепляющихся мышц и ретестом ММТ.',
        durationOrDose: '45–60 сек',
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

function mirrorX(view: PainBodyView, rightSideX: number, lat: 'r' | 'l'): number {
  const mid = view === 'anterior' ? 250 : 773;
  // On anterior plate viewer-left (<250) = patient RIGHT. On posterior plate viewer-right (>773) = patient RIGHT.
  const dx = Math.abs(rightSideX - mid);
  if (view === 'anterior') {
    return lat === 'r' ? mid - dx : mid + dx;
  }
  return lat === 'r' ? mid + dx : mid - dx;
}

interface PairedBoneBlueprint {
  baseId: string;
  name: string;
  latinBase: string;
  adjGender: 'f' | 'm' | 'n'; // feminine: правая/левая, masculine: правый/левый, neuter: правое/левое
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
  view: PainBodyView;
  rightX: number;
  y: number;
}

function makePairedBones(bp: PairedBoneBlueprint): StructuralElementProfile[] {
  const latLabel = {
    f: { r: ['правая', 'dextra'], l: ['левая', 'sinistra'] },
    m: { r: ['правый', 'dexter'], l: ['левый', 'sinister'] },
    n: { r: ['правое', 'dextrum'], l: ['левое', 'sinistrum'] },
  }[bp.adjGender];

  return (['r', 'l'] as const).map((lat) => {
    const [ruSide, laSide] = latLabel[lat];
    return makeBone({
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
      correctionSteps: bp.correctionSteps,
      relatedMuscleIds: bp.relatedMuscleIds,
      relatedOrganIds: bp.relatedOrganIds,
      relatedDiaphragmIds: bp.relatedDiaphragmIds,
      relatedMeridianIds: bp.relatedMeridianIds,
      relatedChainIds: bp.relatedChainIds,
      svgCoords: {
        view: bp.view,
        x: mirrorX(bp.view, bp.rightX, lat),
        y: bp.y,
      },
    });
  });
}

// ============================================================================
// 1. ЧЕРЕП МОЗГОВОЙ (8 костей) И ЛИЦЕВОЙ (14 костей) + СЛУХОВЫЕ (6) + ПОДЪЯЗЫЧНАЯ (1) = 29
// ============================================================================
const SKULL_AND_HEAD_BONES: StructuralElementProfile[] = [
  makeBone({
    id: 'bone-frontal',
    name: 'Лобная кость',
    latinName: 'Os frontale',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп мозговой (8)',
    anatomyAndLocation:
      'Непарная кость переднего отдела свода и основания черепа: формирует лоб, верхний край глазниц, надбровные дуги и лобные пазухи.',
    biomechanicsAndFunction:
      'В краниосакральной системе следует за клиновидной костью (флексия — расширение наружных углов и уплощение лобной чешуи; метопический шов передаёт тяги серпа мозга).',
    palpationLandmark: 'Лобные бугры, надпереносье (глабелла), надглазничный край и лобно-скуловые отростки.',
    dysfunctionSigns: [
      'Лобные головные боли напряжения, тяжесть над глазами, застой в лобных пазухах',
      'Ограничение схождения лобно-теменного (венечного) шва после травм лба',
    ],
    kinesiologyTestAndProvocation:
      'Лёгкий краниальный лифт лобной кости («фронтальный лифт») с ретестом глубоких сгибателей шеи и ГКС.',
    relatedMuscleIds: ['temporalis', 'suboccipitals'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'stomach', 'governing'],
    relatedChainIds: ['superficial-back-line', 'superficial-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 40 },
  }),
  ...makePairedBones({
    baseId: 'bone-parietal',
    name: 'Теменная кость',
    latinBase: 'Os parietale',
    adjGender: 'f',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Череп мозговой (8)',
    anatomyAndLocation:
      'Парная четырёхугольная пластинчатая кость, образующая верхнебоковую крышу свода черепа и место крепления височной фасции.',
    biomechanicsAndFunction:
      'При краниальном вдохе теменные кости совершают наружную ротацию и разведение в сагиттальном шве, разгружая верхний сагиттальный венозный синус.',
    palpationLandmark: 'Теменные бугры, сагиттальный и чешуйчатый (височно-теменной) швы.',
    dysfunctionSigns: [
      'Сдавление теменно-височного шва с мигренозными болями и тяжестью в макушке',
      'Асимметрия нейрососудистых точек Беннетта на теменных буграх',
    ],
    kinesiologyTestAndProvocation:
      'Тест «теменного лифта» (мягкая тракция вверх и латерально) с оценкой изменения тонуса индикаторной мышцы.',
    relatedMuscleIds: ['temporalis', 'upper-trapezius'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['gallbladder', 'bladder', 'governing'],
    relatedChainIds: ['superficial-back-line', 'lateral-line'],
    view: 'posterior',
    rightX: 792,
    y: 42,
  }),
  ...makePairedBones({
    baseId: 'bone-temporal',
    name: 'Височная кость',
    latinBase: 'Os temporale',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп мозговой (8)',
    anatomyAndLocation:
      'Парная кость бокового основания черепа (чешуя, пирамида, сосцевидный отросток); вмещает ВНЧС, внутреннее/среднее ухо и яремное отверстие (ЧМН IX, X, XI).',
    biomechanicsAndFunction:
      'Работает как «шестерёнка» основания черепа (наружная/внутренняя ротация вокруг пирамиды); к сосцевидному отростку крепятся ГКС и ременная мышца.',
    palpationLandmark: 'Сосцевидный отросток за ухом, скуловой отросток и чешуя над ушной раковиной.',
    dysfunctionSigns: [
      'Шум в ушах, головокружение, дисфункция ВНЧС и сбой равновесия',
      'Компрессия яремного отверстия и дисфункция блуждающего (X) / добавочного (XI) нервов',
    ],
    kinesiologyTestAndProvocation:
      'ММТ ГКС и трапециевидной мышцы при ТЛ сосцевидного отростка и ротационной провокации височной кости.',
    relatedMuscleIds: ['scm', 'temporalis', 'upper-trapezius', 'masseter'],
    relatedOrganIds: ['sinuses', 'stomach'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['gallbladder', 'triple-warmer'],
    relatedChainIds: ['lateral-line', 'deep-front-line'],
    view: 'anterior',
    rightX: 214,
    y: 72,
  }),
  makeBone({
    id: 'bone-occipital',
    name: 'Затылочная кость',
    latinName: 'Os occipitale',
    zone: 'head',
    side: 'posterior',
    categoryLabel: 'Череп мозговой (8)',
    anatomyAndLocation:
      'Непарная кость заднего основания черепа с большим затылочным отверстием, мыщелками для атланта (C0–C1) и наружным затылочным выступом.',
    biomechanicsAndFunction:
      'Задний полюс сфенобазилярного синхондроза (СБС) и место прикрепления выйной связки, трапеции, подзатылочных мышц и твёрдой мозговой оболочки.',
    palpationLandmark: 'Наружный затылочный бугор (инион), верхняя/нижняя выйные линии, затылочные мыщелки.',
    dysfunctionSigns: [
      'Фиксация C0–C1 и подзатылочного треугольника, головные боли напряжения',
      'Натяжение ТМО с рефлекторным изменением положения крестца (связь Ловетта)',
    ],
    kinesiologyTestAndProvocation:
      'Краниальная провокация чешуи затылка и мыщелков на вдохе/выдохе с ретестом индикаторной мышцы.',
    relatedMuscleIds: ['suboccipitals', 'upper-trapezius', 'cervical-extensors'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    svgCoords: { view: 'posterior', x: 773, y: 82 },
  }),
  makeBone({
    id: 'bone-sphenoid',
    name: 'Клиновидная кость',
    latinName: 'Os sphenoidale',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп мозговой (8)',
    anatomyAndLocation:
      'Центральная «бабочковидная» кость основания черепа: тело с турецким седлом (гипофиз), малые/большие крылья и крыловидные отростки (место начала крыловидных мышц).',
    biomechanicsAndFunction:
      'Ведущая шестерня сфенобазилярного синхондроза (СБС); определяет симметрию глазниц, нейроэндокринный фон и баланс жевательно-глотательной мускулатуры.',
    palpationLandmark: 'Большие крылья клиновидной кости в височной ямке сразу за латеральным краем глазниц (птерион).',
    dysfunctionSigns: [
      'Торсия и латеральный сдвиг СБС, асимметрия глазниц и ВНЧС',
      'Мигрени, зрительное утомление и краниальные вегетативные сбои',
    ],
    kinesiologyTestAndProvocation:
      'Пальцевая провокация больших крыльев клиновидной кости по векторам СБС с ММТ индикаторной мышцы.',
    relatedMuscleIds: ['lateral-pterygoid', 'medial-pterygoid', 'temporalis'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['gallbladder', 'stomach', 'triple-warmer'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 222, y: 66 },
  }),
  makeBone({
    id: 'bone-ethmoid',
    name: 'Решётчатая кость',
    latinName: 'Os ethmoidale',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп мозговой (8)',
    anatomyAndLocation:
      'Непарная воздухоносная кость на границе передней черепной ямки и полости носа; к её петушиному гребню (crista galli) крепится передний полюс серпа мозга.',
    biomechanicsAndFunction:
      'Главный «передний якорь» серпа большого мозга; застой в решётчатых ячейках нарушает краниальный ритм передней черепной ямки и обоняние.',
    palpationLandmark: 'Переносица (корень носа, назион) и медиальный угол глазниц (непрямой контакт).',
    dysfunctionSigns: [
      'Заложенность носа, этмоидиты, снижение обоняния и боль в корне носа',
      'Реактивное напряжение лобно-решётчатого шва и переднего полюса ТМО',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ переносицы и мягкий передне-задний тест эластичности между назионом и затылком.',
    relatedMuscleIds: ['deep-neck-flexors', 'suboccipitals'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'governing', 'large-intestine'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 64 },
  }),

  // Лицевой череп (14)
  ...makePairedBones({
    baseId: 'bone-maxilla',
    name: 'Верхнечелюстная кость (верхняя челюсть)',
    latinBase: 'Maxilla',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Парная воздухоносная кость (гайморова пазуха), формирующая верхнюю зубную дугу, твёрдое нёбо и дно глазницы.',
    biomechanicsAndFunction:
      'Непосредственно контактирует с клиновидной костью через сошник и нёбные кости; сужение верхней челюсти или односторонняя компрессия швов нарушает прикус и дренаж пазух.',
    palpationLandmark: 'Собачья ямка под глазницей, альвеолярный отросток и нёбный шов.',
    dysfunctionSigns: [
      'Асимметрия прикуса, гаймориты, бруксизм и лицевые боли',
      'Ограничение наружной ротации лица и дисфункция меридиана желудка (ST)',
    ],
    kinesiologyTestAndProvocation:
      'Интраоральная оценка нёбного шва и мягкий «раздвигающий» тест верхних челюстей с контролем ММТ.',
    relatedMuscleIds: ['masseter', 'temporalis', 'medial-pterygoid'],
    relatedOrganIds: ['sinuses', 'stomach'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['stomach', 'large-intestine'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 238,
    y: 88,
  }),
  ...makePairedBones({
    baseId: 'bone-zygomatic',
    name: 'Скуловая кость',
    latinBase: 'Os zygomaticum',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Парная прочная кость латерального отдела лица, соединяющая верхнюю челюсть, лобную и височную кости через скуловую дугу (место начала жевательной мышцы).',
    biomechanicsAndFunction:
      'Распределяет жевательную нагрузку от зубов вверх на свод черепа и механически связывает височную кость с лицевым скелетом.',
    palpationLandmark: 'Выступающее тело скулы и вся скуловая дуга кпереди от ушной раковины.',
    dysfunctionSigns: [
      'Лицевая асимметрия, односторонняя перегрузка жевательной мышцы',
      'Посттравматические блоки скуловой дуги с иррадиацией в ВНЧС и глаз',
    ],
    kinesiologyTestAndProvocation:
      'ММТ жевательной мышцы и глубоких сгибателей шеи при лёгком лифте/ротации скуловой кости.',
    relatedMuscleIds: ['masseter', 'temporalis'],
    relatedOrganIds: ['sinuses', 'stomach'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['small-intestine', 'stomach', 'gallbladder'],
    relatedChainIds: ['lateral-line'],
    view: 'anterior',
    rightX: 222,
    y: 82,
  }),
  ...makePairedBones({
    baseId: 'bone-nasal',
    name: 'Носовая кость',
    latinBase: 'Os nasale',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Парная узкая прямоугольная пластинка, формирующая костную спинку носа и стыкующаяся с лобной костью и лобным отростком верхней челюсти.',
    biomechanicsAndFunction:
      'Через носолобный и межносовой швы отражает травмы лица и влияет на носовое дыхание и проприоцепцию средней линии.',
    palpationLandmark: 'Костная часть спинки носа от переносицы до перехода в хрящевой отдел.',
    dysfunctionSigns: [
      'Смещение спинки носа после ударов/падений, хроническая заложенность одной ноздри',
      'Локальная болезненность у точки BL-1 / BL-2',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ носовых костей и тест носового дыхания каждой ноздрёй с ретестом мышц диафрагмы.',
    relatedMuscleIds: ['deep-neck-flexors'],
    relatedOrganIds: ['sinuses', 'lungs'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'large-intestine'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 246,
    y: 74,
  }),
  ...makePairedBones({
    baseId: 'bone-lacrimal',
    name: 'Слёзная кость',
    latinBase: 'Os lacrimale',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Парная тончайшая костная пластинка переднего отдела медиальной стенки глазницы с ямкой слёзного мешка.',
    biomechanicsAndFunction:
      'Связана с носослёзным каналом и медиальным полюсом глазницы; участвует в микроподвижности решётчато-верхнечелюстного комплекса.',
    palpationLandmark: 'Внутренний (медиальный) край глазницы у слёзного канальца (исключительно деликатный контакт).',
    dysfunctionSigns: [
      'Слезотечение на ветру, застой носослёзного протока, рецидивирующие конъюнктивиты',
      'Натяжение медиального угла глазницы в проекции точки BL-1',
    ],
    kinesiologyTestAndProvocation:
      'Лёгкая пальцевая ТЛ медиального угла глазницы при оценке тонуса шейных ротаторов.',
    relatedMuscleIds: ['scm', 'suboccipitals'],
    relatedOrganIds: ['sinuses', 'liver'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['bladder', 'liver'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 242,
    y: 70,
  }),
  ...makePairedBones({
    baseId: 'bone-palatine',
    name: 'Нёбная кость',
    latinBase: 'Os palatinum',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Парная L-образная кость между верхней челюстью спереди и крыловидными отростками клиновидной кости сзади; формирует заднюю треть твёрдого нёба и часть глазницы.',
    biomechanicsAndFunction:
      'Механический «адаптер» между лицевым черепом (верхняя челюсть) и основанием черепа (клиновидная кость); при её блоке клиновидная кость фиксируется.',
    palpationLandmark: 'Задний край твёрдого нёба (интраорально у последних моляров) перед переходом в мягкое нёбо.',
    dysfunctionSigns: [
      'Хроническое напряжение в области крылонёбной ямки, заложенность носоглотки',
      'Рецидивирующая торсия СБС и спазм крыловидных мышц',
    ],
    kinesiologyTestAndProvocation:
      'Деликатная интраоральная ТЛ заднего края твёрдого нёба с ММТ индикаторной мышцы.',
    relatedMuscleIds: ['medial-pterygoid', 'lateral-pterygoid'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['stomach', 'conception'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 244,
    y: 94,
  }),
  ...makePairedBones({
    baseId: 'bone-inferior-nasal-concha',
    name: 'Нижняя носовая раковина',
    latinBase: 'Concha nasalis inferior',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Парная самостоятельная изогнутая губчатая кость на боковой стенке полости носа под средним носовым ходом.',
    biomechanicsAndFunction:
      'Регулирует турбулентность, согревание и увлажнение вдыхаемого воздуха; её кавернозная слизистая рефлекторно связана с тазовым дном и лёгкими.',
    palpationLandmark: 'Проецируется латерально от крыльев носа (непрямая работа через грушевидную апертуру и верхнюю челюсть).',
    dysfunctionSigns: [
      'Вазомоторный ринит, заложенность носа в положении лёжа на боку',
      'Рефлекторное ограничение носового вдоха со снижением экскурсии диафрагмы',
    ],
    kinesiologyTestAndProvocation:
      'Сравнительный ММТ мышцы-индикатора при свободном носовом дыхании и с закрытием одной ноздри.',
    relatedMuscleIds: ['deep-neck-flexors'],
    relatedOrganIds: ['sinuses', 'lungs'],
    relatedDiaphragmIds: ['cranial-tentorium', 'thoracoabdominal'],
    relatedMeridianIds: ['lung', 'large-intestine'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 245,
    y: 82,
  }),
  makeBone({
    id: 'bone-vomer',
    name: 'Сошник',
    latinName: 'Vomer',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Непарная трапециевидная пластинка, формирующая задненижнюю часть костной перегородки носа между телом клиновидной кости сверху и нёбным гребнем снизу.',
    biomechanicsAndFunction:
      'Передаёт краниосакральную флексию клиновидной кости прямо на твёрдое нёбо (эффект «насоса сфено-вомерного сочленения»).',
    palpationLandmark: 'Средний нёбный шов (проекция снизу через твёрдое нёбо) и нижний отдел носовой перегородки.',
    dysfunctionSigns: [
      'Искривление носовой перегородки, односторонняя обструкция дыхания',
      'Нарушение кранио-фациального ритма после травм носа и ортодонтических вмешательств',
    ],
    kinesiologyTestAndProvocation:
      'ТЛ срединного нёбного шва и костной части перегородки носа на фазах дыхания.',
    relatedMuscleIds: ['medial-pterygoid', 'deep-neck-flexors'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['governing', 'conception'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 82 },
  }),
  makeBone({
    id: 'bone-mandible',
    name: 'Нижняя челюсть',
    latinName: 'Mandibula',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Череп лицевой (14)',
    anatomyAndLocation:
      'Единственная подвижная непарная кость черепа (подковообразное тело и две ветви с мыщелковыми и венечными отростками).',
    biomechanicsAndFunction:
      'Главный передний балансир головы и шеи: её положение задаёт натяжение жевательных, надподъязычных и глубоких сгибателей шеи.',
    palpationLandmark: 'Углы нижней челюсти, нижний край тела, подбородочный бугорок и суставные головки перед козелками ушей.',
    dysfunctionSigns: [
      'Смещение нижней челюсти в сторону при открывании рта, скрежет зубами (бруксизм)',
      'Нисходящее влияние на таз, шейный лордоз и тонус приводящих мышц',
    ],
    kinesiologyTestAndProvocation:
      'ММТ при сжатии челюстей, широком открывании рта и с тестовым ватным валиком на премолярах.',
    relatedMuscleIds: ['masseter', 'temporalis', 'lateral-pterygoid', 'medial-pterygoid', 'suprahyoid-infrahyoid'],
    relatedOrganIds: ['stomach', 'sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium', 'hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'large-intestine', 'gallbladder'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 114 },
  }),

  // Слуховые косточки (6)
  ...makePairedBones({
    baseId: 'bone-malleus',
    name: 'Молоточек (слуховая косточка)',
    latinBase: 'Malleus',
    adjGender: 'm',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Слуховые косточки (6)',
    anatomyAndLocation:
      'Латеральная слуховая косточка барабанной полости среднего уха; рукоятка сращена с барабанной перепонкой, головка сочленяется с наковальней (m. tensor tympani).',
    biomechanicsAndFunction:
      'Передаёт и демпфирует акустические колебания; рефлекторно связан с тройничным нервом (V3) через мышцу, напрягающую барабанную перепонку.',
    palpationLandmark: 'Недоступен для прямой пальпации; непрямая оценка через височную кость и прослушивание слуховой трубы.',
    dysfunctionSigns: [
      'Гиперакузия, щелчки в ухе при жевании/зевании, заложенность среднего уха',
      'Посттравматический или баротравматический дисбаланс V3 (связь с ВНЧС)',
    ],
    kinesiologyTestAndProvocation:
      'Провокация мягким сжатием ушной раковины / глотанием с закрытым носом и ММТ жевательной мышцы.',
    relatedMuscleIds: ['masseter', 'lateral-pterygoid'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['triple-warmer', 'gallbladder', 'small-intestine'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 212,
    y: 80,
  }),
  ...makePairedBones({
    baseId: 'bone-incus',
    name: 'Наковальня (слуховая косточка)',
    latinBase: 'Incus',
    adjGender: 'f',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Слуховые косточки (6)',
    anatomyAndLocation:
      'Центральная слуховая косточка среднего уха между молоточком и стременем, фиксированная связками в надбарабанном углублении височной кости.',
    biomechanicsAndFunction:
      'Работает как рычаг-трансформатор амплитуды и давления звуковых волн от барабанной перепонки к овальному окну.',
    palpationLandmark: 'Проекция — область позади наружного слухового прохода у основания пирамиды височной кости.',
    dysfunctionSigns: [
      'Снижение остроты слуха (кондуктивная тугоухость), ушной звон при торсии височной кости',
    ],
    kinesiologyTestAndProvocation:
      'Оценка ротации височной кости и рефлекса равновесия в ММТ при звуковом стимуле.',
    relatedMuscleIds: ['scm', 'temporalis'],
    relatedOrganIds: ['sinuses'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['triple-warmer', 'kidney'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 210,
    y: 84,
  }),
  ...makePairedBones({
    baseId: 'bone-stapes',
    name: 'Стремя (слуховая косточка)',
    latinBase: 'Stapes',
    adjGender: 'n',
    zone: 'head',
    side: 'anterior',
    categoryLabel: 'Слуховые косточки (6)',
    anatomyAndLocation:
      'Самая маленькая кость человеческого тела (~3 мм); её основание вставлено в окно преддверия внутреннего уха (место крепления стременной мышцы, ЧМН VII).',
    biomechanicsAndFunction:
      'Передаёт механические колебания на перилимфу улитки и вестибулярный аппарат.',
    palpationLandmark: 'Глубоко в пирамиде височной кости (ориентир — козелок и слуховой проход).',
    dysfunctionSigns: [
      'Вестибулярное головокружение, тиннитус и акустический дискомфорт при спазме стременной мышцы',
    ],
    kinesiologyTestAndProvocation:
      'Проба вестибуло-моторного ответа (поворот головы с фиксацией взгляда) при ММТ ГКС.',
    relatedMuscleIds: ['scm', 'suboccipitals'],
    relatedOrganIds: ['sinuses', 'kidneys'],
    relatedDiaphragmIds: ['cranial-tentorium'],
    relatedMeridianIds: ['triple-warmer', 'kidney', 'gallbladder'],
    relatedChainIds: ['deep-front-line'],
    view: 'anterior',
    rightX: 208,
    y: 88,
  }),

  // Подъязычная кость (1)
  makeBone({
    id: 'bone-hyoid',
    name: 'Подъязычная кость',
    latinName: 'Os hyoideum',
    zone: 'cervical',
    side: 'anterior',
    categoryLabel: 'Подъязычная кость (1)',
    anatomyAndLocation:
      'Непарная подковообразная кость передней поверхности шеи (уровень C3–C4), не имеющая костных суставов — подвешена в мышечном гамаке между челюстью, височной костью, грудиной и лопатками.',
    biomechanicsAndFunction:
      'Центральный «гироскоп» равновесия шеи, глотания, фонации и передней глубокой линии (DFL); малейшее смещение перегружает C0–C2 и лопатку.',
    palpationLandmark: 'Между дном полости рта и верхним краем щитовидного хряща гортани (большие рога по бокам).',
    dysfunctionSigns: [
      'Смещение кости влево/вправо при глотании, «ком в горле», усталость голоса',
      'Рецидивирующий блок C2–C3 и одностороннее напряжение лопаточно-подъязычной мышцы',
    ],
    kinesiologyTestAndProvocation:
      'ММТ глубоких сгибателей шеи или ГКС при мягком смещении подъязычной кости вправо/влево и при глотании.',
    relatedMuscleIds: ['suprahyoid-infrahyoid', 'scm', 'deep-neck-flexors'],
    relatedOrganIds: ['stomach', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['conception', 'stomach', 'kidney'],
    relatedChainIds: ['deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 136 },
  }),
];

// ============================================================================
// 2. ПОЗВОНОЧНЫЙ СТОЛБ (26 костей): C1–C7 (7), Th1–Th12 (12), L1–L5 (5), Крестец (1), Копчик (1)
// ============================================================================
const CERVICAL_SPECIFICS: Array<{
  code: string;
  title: string;
  latin: string;
  y: number;
  lovett: string;
  muscles: string[];
  organ: string[];
  notes: string;
}> = [
  {
    code: 'C1',
    title: 'Первый шейный позвонок C1 (Атлант)',
    latin: 'Vertebra cervicalis I (Atlas)',
    y: 114,
    lovett: 'L5',
    muscles: ['suboccipitals', 'deep-neck-flexors', 'scm'],
    organ: ['sinuses'],
    notes: 'Не имеет тела и остистого отростка; удерживает затылок (C0–C1) и ротируется вокруг зуба C2. Парный Ловетт-сегмент с L5.',
  },
  {
    code: 'C2',
    title: 'Второй шейный позвонок C2 (Аксис / Осевой)',
    latin: 'Vertebra cervicalis II (Axis)',
    y: 121,
    lovett: 'L4',
    muscles: ['suboccipitals', 'cervical-extensors', 'deep-neck-flexors'],
    organ: ['sinuses'],
    notes: 'Имеет зубовидный отросток — главную ось ротации головы (50% всего поворота шеи); первый пальпируемый остистый отросток под затылком. Парный с L4.',
  },
  {
    code: 'C3',
    title: 'Третий шейный позвонок C3',
    latin: 'Vertebra cervicalis III (C3)',
    y: 128,
    lovett: 'L3',
    muscles: ['deep-neck-flexors', 'levator-scapulae', 'scalenes'],
    organ: ['sinuses', 'lungs'],
    notes: 'Уровень подъязычной кости и верхнего корешка диафрагмального нерва (C3–C5); парный Ловетт-сегмент с L3.',
  },
  {
    code: 'C4',
    title: 'Четвёртый шейный позвонок C4',
    latin: 'Vertebra cervicalis IV (C4)',
    y: 135,
    lovett: 'L2',
    muscles: ['scalenes', 'levator-scapulae', 'upper-trapezius'],
    organ: ['lungs'],
    notes: 'Ключевой сегмент диафрагмального нерва (C4 — «дыхательный центр шеи»); блок C4 напрямую угнетает грудобрюшную диафрагму. Парный с L2.',
  },
  {
    code: 'C5',
    title: 'Пятый шейный позвонок C5',
    latin: 'Vertebra cervicalis V (C5)',
    y: 142,
    lovett: 'L1',
    muscles: ['deltoid', 'supraspinatus', 'biceps-brachii', 'rhomboids'],
    organ: ['lungs', 'heart'],
    notes: 'Уровень максимальной подвижности шеи (вершина лордоза); формирует миотом дельтовидной, надостной и бицепса. Парный с L1.',
  },
  {
    code: 'C6',
    title: 'Шестой шейный позвонок C6',
    latin: 'Vertebra cervicalis VI (C6)',
    y: 149,
    lovett: 'Th12',
    muscles: ['biceps-brachii', 'brachioradialis', 'wrist-extensors', 'pectoralis-major-clavicular'],
    organ: ['stomach', 'lungs'],
    notes: 'Сонный бугорок (Chassaignac) на поперечном отростке — место прижатия сонной артерии; миотом разгибателей запястья и бицепса.',
  },
  {
    code: 'C7',
    title: 'Седьмой шейный позвонок C7 (Выступающий)',
    latin: 'Vertebra cervicalis VII (Vertebra prominens)',
    y: 156,
    lovett: 'Th11',
    muscles: ['triceps-brachii', 'wrist-flexors', 'middle-lower-trapezius'],
    organ: ['heart', 'lungs'],
    notes: 'Длинный нераздвоенный остистый отросток шейно-грудного перехода (зона Вдовьего горбика и звёздчатого ганглия); миотом C7 — трицепс и сгибатели запястья.',
  },
];

const CERVICAL_VERTEBRAE: StructuralElementProfile[] = CERVICAL_SPECIFICS.map((cv) =>
  makeBone({
    id: `bone-vertebra-${cv.code.toLowerCase()}`,
    name: cv.title,
    latinName: cv.latin,
    zone: 'cervical',
    side: 'posterior',
    categoryLabel: 'Позвоночный столб (26)',
    anatomyAndLocation: cv.notes,
    biomechanicsAndFunction: `Обеспечивает сгибание/разгибание и сопряжённую ротацию-латерофлексию шейного отдела; кинезиологический партнёр по правилу Ловетта: ${cv.lovett}.`,
    palpationLandmark: `Остистый отросток и фасеточные суставы на уровне ${cv.code} (по средней линии задней поверхности шеи и в 1,5 см латеральнее).`,
    dysfunctionSigns: [
      `Сегментарный блок ${cv.code} (FRS/ERS), локальная болезненность фасетки`,
      `Ослабление миотома ${cv.code} или ответное скручивание партнёрского сегмента ${cv.lovett}`,
    ],
    kinesiologyTestAndProvocation: `ТЛ дугоотростчатого сустава и остистого отростка ${cv.code} + ММТ индикаторной или ассоциированной мышцы с коррекцией по Ловетту (${cv.lovett}).`,
    relatedMuscleIds: cv.muscles,
    relatedOrganIds: cv.organ,
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'cranial-tentorium'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    svgCoords: { view: 'posterior', x: 773, y: cv.y },
  })
);

const THORACIC_META: Array<{ n: number; organ: string[]; muscles: string[]; lovett: string; note: string }> = [
  { n: 1, organ: ['heart', 'lungs'], muscles: ['wrist-flexors', 'pectoralis-minor'], lovett: 'Th10', note: 'Уровень I ребра и звёздчатого симпатического ганглия; иннервация кисти (T1).' },
  { n: 2, organ: ['heart', 'lungs'], muscles: ['subscapularis', 'rhomboids'], lovett: 'Th9', note: 'Симпатический висцеротом сердца и лёгких; зона между верхними углами лопаток.' },
  { n: 3, organ: ['lungs', 'heart'], muscles: ['serratus-anterior', 'deltoid'], lovett: 'Th8', note: 'Уровень ости лопатки и корня лёгких (точка Шу лёгких BL-13); сопряжён с Th8.' },
  { n: 4, organ: ['heart', 'gallbladder'], muscles: ['subscapularis', 'popliteus'], lovett: 'Th7', note: 'Уровень бифуркации трахеи и дуги аорты; кардио-перикардиальная вегетативная зона.' },
  { n: 5, organ: ['heart', 'stomach'], muscles: ['pectoralis-major-clavicular', 'pectoralis-major-sternal'], lovett: 'Th6', note: 'Симпатическая иннервация желудка и сердца (уровень точки BL-15); зона грудины.' },
  { n: 6, organ: ['stomach', 'liver', 'pancreas'], muscles: ['pectoralis-major-clavicular', 'pectoralis-major-sternal'], lovett: 'Th5', note: 'Верхний полюс желудка и диафрагмального купола; вершина грудного кифоза.' },
  { n: 7, organ: ['stomach', 'liver', 'pancreas'], muscles: ['latissimus-dorsi', 'triceps-brachii'], lovett: 'Th4', note: 'Уровень нижнего угла лопатки в нейтрали; висцеротом поджелудочной железы и печени.' },
  { n: 8, organ: ['liver', 'gallbladder', 'stomach'], muscles: ['pectoralis-major-sternal', 'latissimus-dorsi'], lovett: 'Th3', note: 'Чревная симпатическая регуляция печени и жёлчных путей.' },
  { n: 9, organ: ['liver', 'gallbladder', 'kidneys'], muscles: ['latissimus-dorsi', 'obliques-abdominis'], lovett: 'Th2', note: 'Нижнегрудной переход к диафрагме; большой внутренностный нерв к надпочечникам.' },
  { n: 10, organ: ['small-intestine', 'kidneys'], muscles: ['quadriceps-femoris', 'rectus-abdominis'], lovett: 'Th1', note: 'Уровень мечевидно-пупочной оси и иннервации тонкого кишечника / почек.' },
  { n: 11, organ: ['kidneys', 'large-intestine'], muscles: ['iliopsoas', 'tensor-fasciae-latae'], lovett: 'C7', note: 'Первое плавающее ребро (XI); ключевой переходной уровень почечного сплетения.' },
  { n: 12, organ: ['kidneys', 'large-intestine', 'urogenital'], muscles: ['iliopsoas', 'quadratus-lumborum'], lovett: 'C6', note: 'Грудопоясничный переход Th12–L1: место прохождения аорты и ножек диафрагмы; вертебрально-кожный нерв.' },
];

const THORACIC_VERTEBRAE: StructuralElementProfile[] = THORACIC_META.map((tv) =>
  makeBone({
    id: `bone-vertebra-th${tv.n}`,
    name: `Грудной позвонок Th${tv.n}`,
    latinName: `Vertebra thoracica ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][tv.n - 1]} (Th${tv.n})`,
    zone: 'thoracic',
    side: 'posterior',
    categoryLabel: 'Позвоночный столб (26)',
    anatomyAndLocation: `${tv.note} Формирует рёберно-позвоночные суставы с ${tv.n}-й парой рёбер и контактирует с пограничным симпатическим стволом.`,
    biomechanicsAndFunction: `Обеспечивает ротацию туловища и дыхательную экскурсию ${tv.n}-х рёбер; партнёр Ловетта: ${tv.lovett}.`,
    palpationLandmark: `Остистый и поперечные отростки позвонка Th${tv.n} (учитывается черепицеобразный наклон остистых отростков в средней зоне на 1 сегмент ниже тела).`,
    dysfunctionSigns: [
      `Блок сегмента Th${tv.n} и сопряжённого ребра, межрёберная иррадиация`,
      `Вегетативно-висцеральная реакция на органы проекции и слабость мышц-индикаторов`,
    ],
    kinesiologyTestAndProvocation: `ТЛ остистого отростка Th${tv.n} и углов ${tv.n}-х рёбер на вдохе/выдохе + ретест партнёра ${tv.lovett}.`,
    relatedMuscleIds: [...tv.muscles, 'erector-spinae'],
    relatedOrganIds: tv.organ,
    relatedDiaphragmIds: ['thoracoabdominal'],
    relatedMeridianIds: ['bladder', 'governing'],
    relatedChainIds: ['superficial-back-line', 'spiral-line'],
    svgCoords: { view: 'posterior', x: 773, y: Math.round(166 + (tv.n - 1) * 14.5) },
  })
);

const LUMBAR_META: Array<{ n: number; lovett: string; muscles: string[]; organ: string[]; note: string }> = [
  { n: 1, lovett: 'C5', muscles: ['iliopsoas', 'quadratus-lumborum'], organ: ['large-intestine', 'kidneys'], note: 'Верхний поясничный позвонок; паховый уровень, крепление ножек диафрагмы и илиогипогастральный нерв.' },
  { n: 2, lovett: 'C4', muscles: ['iliopsoas', 'quadriceps-femoris'], organ: ['large-intestine', 'small-intestine'], note: 'Ключевое крепление большой поясничной мышцы (psoas) и верхняя граница бедренного сплетения.' },
  { n: 3, lovett: 'C3', muscles: ['quadriceps-femoris', 'iliopsoas', 'hip-adductors'], organ: ['small-intestine', 'urogenital'], note: 'Вершина поясничного лордоза (уровень пупка спереди); центр тяжести туловища и миотом L3 (квадрицепс).' },
  { n: 4, lovett: 'C2', muscles: ['tibialis-anterior', 'gluteus-medius', 'tensor-fasciae-latae'], organ: ['large-intestine', 'urogenital'], note: 'Ориентир по линии Тюфье (гребни таза); самая частая зона дисковых нагрузок и миотом L4 (передняя большеберцовая).' },
  { n: 5, lovett: 'C1', muscles: ['gluteus-medius', 'fibularis-peroneus', 'hamstrings', 'piriformis'], organ: ['urogenital', 'large-intestine'], note: 'Пояснично-крестцовый шарнир (подвздошно-поясничная связка); сопряжён с атлантом C1 по Ловетту.' },
];

const LUMBAR_VERTEBRAE: StructuralElementProfile[] = LUMBAR_META.map((lv) =>
  makeBone({
    id: `bone-vertebra-l${lv.n}`,
    name: `Поясничный позвонок L${lv.n}`,
    latinName: `Vertebra lumbalis ${['I', 'II', 'III', 'IV', 'V'][lv.n - 1]} (L${lv.n})`,
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Позвоночный столб (26)',
    anatomyAndLocation: `${lv.note} Массивное почковидное тело и сагиттально ориентированные дугоотростчатые суставы.`,
    biomechanicsAndFunction: `Несёт осевую нагрузку туловища, работает по законам Фрайетта; кинезиологический партнёр по Ловетту: ${lv.lovett}.`,
    palpationLandmark: `Остистый и поперечные отростки L${lv.n} по средней линии поясницы (L4 на линии гребней подвздошных костей).`,
    dysfunctionSigns: [
      `Поясничная боль, блок FRS/ERS сегмента L${lv.n}, анталгический наклон таза`,
      `Ослабление миотома L${lv.n} и ответное напряжение в шейном сегменте ${lv.lovett}`,
    ],
    kinesiologyTestAndProvocation: `ТЛ сегмента L${lv.n} в сгибании/разгибании + ММТ миотома и проверка сопряжённого позвонка ${lv.lovett}.`,
    relatedMuscleIds: [...lv.muscles, 'erector-spinae'],
    relatedOrganIds: lv.organ,
    relatedDiaphragmIds: ['thoracoabdominal', 'pelvic-floor'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    svgCoords: { view: 'posterior', x: 773, y: Math.round(338 + (lv.n - 1) * 16) },
  })
);

const SACRUM_AND_COCCYX: StructuralElementProfile[] = [
  makeBone({
    id: 'bone-sacrum',
    name: 'Крестец',
    latinName: 'Os sacrum',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Позвоночный столб (26)',
    anatomyAndLocation:
      'Крупная клиновидная треугольная кость из 5 сросшихся позвонков S1–S5; сочленяется с L5 и подвздошными костями (КПС), внутри на уровне S2 фиксируется твёрдая мозговая оболочка.',
    biomechanicsAndFunction:
      'Нижний полюс краниосакрального механизма (нутация/контрнутация синхронна затылочной кости) и фундамент позвоночного столба в шаге.',
    palpationLandmark: 'Основание крестца, крестцовые борозды медиальнее ЗВПО (PSIS), срединный гребень и нижние латеральные углы (ILA).',
    dysfunctionSigns: [
      'Торсия крестца, крестцово-подвздошный болевой синдром при сидении/ходьбе',
      'Нисходящая или восходящая дисфункция твёрдой мозговой оболочки и грушевидной мышцы',
    ],
    kinesiologyTestAndProvocation:
      'Тест сфинкса, ММТ ягодичных и грушевидной мышц при ТЛ углов крестца и дыхательном синхронизирующем тесте.',
    relatedMuscleIds: ['piriformis', 'gluteus-maximus', 'erector-spinae', 'pelvic-floor-muscles'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor', 'cranial-tentorium'],
    relatedMeridianIds: ['governing', 'bladder'],
    relatedChainIds: ['superficial-back-line', 'deep-front-line'],
    svgCoords: { view: 'posterior', x: 773, y: 418 },
  }),
  makeBone({
    id: 'bone-coccyx',
    name: 'Копчик',
    latinName: 'Os coccygis',
    zone: 'lumbar',
    side: 'posterior',
    categoryLabel: 'Позвоночный столб (26)',
    anatomyAndLocation:
      'Дистальный рудимент позвоночника (3–5 сросшихся позвонков) с терминальной нитью ТМО и креплением мышц тазового дна и наружного сфинктера.',
    biomechanicsAndFunction:
      'Работает как передне-задний амортизатор тазовой диафрагмы при посадке; падения на ягодицы вызывают передний/латеральный загиб копчика с тягой на весь дуральный мешок.',
    palpationLandmark: 'Верхушка копчика в верхней трети межъягодичной складки (деликатная наружная пальпация через ткани).',
    dysfunctionSigns: [
      'Кокцигодиния (резкая боль при сидении и вставании), спазм тазового дна',
      'Рефрактерные головные боли и поясничные блоки после старых падений на лёд/ступеньки',
    ],
    kinesiologyTestAndProvocation:
      'ММТ мышц тазового дна, грушевидной или индикаторной мышцы при мягкой ТЛ верхушки копчика.',
    relatedMuscleIds: ['pelvic-floor-muscles', 'gluteus-maximus', 'obturator-internus'],
    relatedOrganIds: ['urogenital', 'large-intestine'],
    relatedDiaphragmIds: ['pelvic-floor', 'cranial-tentorium'],
    relatedMeridianIds: ['governing', 'conception'],
    relatedChainIds: ['deep-front-line', 'superficial-back-line'],
    svgCoords: { view: 'posterior', x: 773, y: 444 },
  }),
];

// ============================================================================
// 3. ГРУДНАЯ КЛЕТКА (25 костей): Грудина (1) + Рёбра I–XII R/L (24)
// ============================================================================
const RIB_ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const THORAX_BONES: StructuralElementProfile[] = [
  makeBone({
    id: 'bone-sternum',
    name: 'Грудина (рукоятка, тело и мечевидный отросток)',
    latinName: 'Sternum (Manubrium, Corpus et Processus xiphoideus)',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Грудная клетка (25)',
    anatomyAndLocation:
      'Непарная плоская губчатая кость передней стенки груди, объединяющая ключицы, хрящи I–VII рёбер, ГКС, грудные и прямые мышцы живота, а изнутри — перикардиальные связки.',
    biomechanicsAndFunction:
      'Движется по типу «ручки насоса» при дыхании; внутрикостные напряжения от ушибов или операций на грудине мгновенно блокируют плечевой пояс и сердце/лёгкие рефлекторно.',
    palpationLandmark: 'Яремная вырезка, угол грудины (угол Людовика, уровень II ребра), тело грудины и мечевидный отросток.',
    dysfunctionSigns: [
      'Сдавление за грудиной без ИБС, сутулость, асимметрия ключиц',
      'Слабость грудинной/ключичной порций БГМ при лёгком нажатии на грудину',
    ],
    kinesiologyTestAndProvocation:
      'ММТ большой грудной мышцы при лёгкой вентрально-дорсальной или ротационной провокации рукоятки и тела грудины.',
    relatedMuscleIds: ['pectoralis-major-sternal', 'pectoralis-major-clavicular', 'scm', 'rectus-abdominis'],
    relatedOrganIds: ['heart', 'lungs', 'stomach'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet', 'thoracoabdominal'],
    relatedMeridianIds: ['conception', 'kidney', 'stomach'],
    relatedChainIds: ['superficial-front-line', 'deep-front-line'],
    svgCoords: { view: 'anterior', x: 250, y: 218 },
  }),
  ...RIB_ROMANS.flatMap((roman, idx) => {
    const num = idx + 1;
    const typeLabel =
      num <= 7 ? 'истинное ребро' : num <= 10 ? 'ложное ребро' : 'колеблющееся (плавающее) ребро';
    const muscles =
      num === 1
        ? ['scalenes', 'pectoralis-major-clavicular']
        : num <= 5
        ? ['pectoralis-minor', 'serratus-anterior', 'pectoralis-major-sternal']
        : num <= 10
        ? ['serratus-anterior', 'obliques-abdominis', 'rectus-abdominis']
        : ['quadratus-lumborum', 'latissimus-dorsi', 'obliques-abdominis'];
    return makePairedBones({
      baseId: `bone-rib-${num}`,
      name: `${num}-е ребро (${typeLabel})`,
      latinBase: `Costa ${roman}`,
      adjGender: 'n',
      zone: num >= 11 ? 'lumbar' : 'thoracic',
      side: 'anterior',
      categoryLabel: 'Грудная клетка (25)',
      anatomyAndLocation: `Парная дугообразная кость грудной клетки (уровень Th${num}); ${
        num === 1
          ? 'расположена прямо под ключицей, служит местом крепления передней и средней лестничных мышц и дном верхней апертуры'
          : num <= 7
          ? 'крепится собственным хрящом к грудине и позвонку Th' + num
          : num <= 10
          ? 'соединяется хрящевой дугой с VII ребром и фиксирует купол диафрагмы'
          : 'свободно заканчивается в мышцах брюшной стенки, связана с квадратной мышцей поясницы и диафрагмой'
      }.`,
      biomechanicsAndFunction: `Обеспечивает ${
        num <= 5 ? 'верхнее («ручка насоса»)' : num <= 10 ? 'нижнее («ручка ведра»)' : 'боковое стабилизационное'
      } расширение грудной клетки и дыхательную помпу.`,
      palpationLandmark: `Хрящевое крепление спереди (или свободный край для XI–XII), боковая поверхность по подмышечной линии и угол ребра сзади у Th${num}.`,
      dysfunctionSigns: [
        `Инспираторный (зафиксировано вверху) или экспираторный (опущено) блок ${num}-го ребра`,
        num === 1
          ? 'Сдавление плечевого сплетения и подключичной артерии (синдром TOS)'
          : 'Межрёберная боль на глубоком вдохе и локальный гипертонус сегмента',
      ],
      kinesiologyTestAndProvocation: `ТЛ ${num}-го ребра на максимальном вдохе vs выдохе с оценкой тонуса связанных мышц.`,
      relatedMuscleIds: muscles,
      relatedOrganIds: num <= 5 ? ['lungs', 'heart'] : ['liver', 'stomach', 'kidneys'],
      relatedDiaphragmIds: num === 1 ? ['hyoid-thoracic-inlet'] : ['thoracoabdominal'],
      relatedMeridianIds: ['lung', 'gallbladder', 'liver', 'spleen'],
      relatedChainIds: ['lateral-line', 'deep-front-line', 'spiral-line'],
      view: 'anterior',
      rightX: num <= 3 ? 216 : num <= 8 ? 204 : 196,
      y: Math.round(170 + idx * 11.5),
    });
  }),
];

// ============================================================================
// 4. ПЛЕЧЕВОЙ ПОЯС И ВЕРХНИЕ КОНЕЧНОСТИ (64 кости = 32 R + 32 L)
// ============================================================================
const CARPAL_BONES: Array<{ id: string; ru: string; la: string; xOff: number; yOff: number; note: string }> = [
  { id: 'scaphoid', ru: 'Ладьевидная кость кисти', la: 'Os scaphoideum', xOff: -6, yOff: 0, note: 'Крупнейшая кость проксимального ряда запястья со стороны большого пальца; ключевой амортизатор при падении на кисть.' },
  { id: 'lunate', ru: 'Полулунная кость запястья', la: 'Os lunatum', xOff: 0, yOff: 0, note: 'Центральный «замковый камень» запястья в глубине карпального канала; чаще других подвывихивается к ладони.' },
  { id: 'triquetrum', ru: 'Трёхгранная кость запястья', la: 'Os triquetrum', xOff: 6, yOff: 0, note: 'Медиальная кость проксимального ряда со стороны мизинца; сочленяется с треугольным фиброзно-хрящевым комплексом.' },
  { id: 'pisiform', ru: 'Гороховидная кость запястья', la: 'Os pisiforme', xOff: 9, yOff: 4, note: 'Сесамовидная кость в толще сухожилия локтевого сгибателя запястья; формирует латеральную стенку канала Гийона.' },
  { id: 'trapezium', ru: 'Кость-трапеция запястья', la: 'Os trapezium', xOff: -8, yOff: 10, note: 'Дистальный ряд под I пястной костью; образует седловидный сустав большого пальца (ризартроз).' },
  { id: 'trapezoid', ru: 'Трапециевидная кость запястья', la: 'Os trapezoideum', xOff: -3, yOff: 10, note: 'Малая кость дистального ряда под II пястной костью, жёстко заклиненная в запястной арке.' },
  { id: 'capitate', ru: 'Головчатая кость запястья', la: 'Os capitatum', xOff: 2, yOff: 10, note: 'Самая крупная кость запястья и ось вращения кисти (соединяется с III пястной костью).' },
  { id: 'hamate', ru: 'Крючковидная кость запястья', la: 'Os hamatum', xOff: 8, yOff: 10, note: 'Несёт крючок на ладонной поверхности — ориентир канала Гийона и опоры ладонного апоневроза.' },
];

const METACARPAL_ROMANS = ['I', 'II', 'III', 'IV', 'V'];
const FINGER_NAMES = ['I (большого)', 'II (указательного)', 'III (среднего)', 'IV (безымянного)', 'V (мизинца)'];

const UPPER_LIMB_BONES: StructuralElementProfile[] = [
  ...makePairedBones({
    baseId: 'bone-clavicle',
    name: 'Ключица',
    latinBase: 'Clavicula',
    adjGender: 'f',
    zone: 'thoracic',
    side: 'anterior',
    categoryLabel: 'Плечевой пояс и рука (64)',
    anatomyAndLocation: 'S-образная трубчатая кость, единственная костная распорка между грудиной и лопаткой; под ней проходят подключичные сосуды и плечевое сплетение.',
    biomechanicsAndFunction: 'Поднимается, отводится назад и ротируется при подъёме руки; ограничивает опускание I ребра при гипертонусе подключичной мышцы.',
    palpationLandmark: 'Весь подкожный контур от грудино-ключичного до акромиально-ключичного сустава.',
    dysfunctionSigns: [
      'Асимметрия надплечий, щёлканье SCJ/ACJ, компрессия сосудов в рёберно-ключичном зазоре',
      'Слабость ключичной порции большой грудной и дельтовидной мышц',
    ],
    kinesiologyTestAndProvocation: 'ММТ ключичной БГМ при лёгкой мобилизации ключицы вверх/вниз или дорсально.',
    relatedMuscleIds: ['pectoralis-major-clavicular', 'scm', 'deltoid', 'upper-trapezius'],
    relatedOrganIds: ['stomach', 'lungs'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['stomach', 'kidney', 'large-intestine'],
    relatedChainIds: ['arm-lines', 'deep-front-line'],
    view: 'anterior',
    rightX: 204,
    y: 180,
  }),
  ...makePairedBones({
    baseId: 'bone-scapula',
    name: 'Лопатка',
    latinBase: 'Scapula',
    adjGender: 'f',
    zone: 'thoracic',
    side: 'posterior',
    categoryLabel: 'Плечевой пояс и рука (64)',
    anatomyAndLocation: 'Плоская треугольная кость на уровне II–VII рёбер; служит плавающей платформой для 17 мышц плечевого пояса, спины и манжеты плеча.',
    biomechanicsAndFunction: 'Обеспечивает 1/3 амплитуды отведения руки вверх; положение медиального края и нижнего угла определяет лопаточно-грудной ритм.',
    palpationLandmark: 'Ость лопатки (T3), акромион, медиальный край, нижний угол (T7) и клювовидный отросток спереди.',
    dysfunctionSigns: [
      'Крыловидная лопатка (слабость передней зубчатой / нижней трапеции)',
      'Импинджмент плеча и хруст под лопаткой',
    ],
    kinesiologyTestAndProvocation: 'ММТ передней зубчатой, ромбовидных и вращательной манжеты при фиксации или ротации угла лопатки.',
    relatedMuscleIds: ['serratus-anterior', 'rhomboids', 'levator-scapulae', 'middle-lower-trapezius', 'supraspinatus', 'infraspinatus', 'subscapularis'],
    relatedOrganIds: ['lungs', 'heart', 'gallbladder'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['small-intestine', 'bladder', 'triple-warmer'],
    relatedChainIds: ['arm-lines', 'spiral-line'],
    view: 'posterior',
    rightX: 824,
    y: 234,
  }),
  ...makePairedBones({
    baseId: 'bone-humerus',
    name: 'Плечевая кость',
    latinBase: 'Humerus',
    adjGender: 'f',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Плечевой пояс и рука (64)',
    anatomyAndLocation: 'Длинная трубчатая кость плеча с шаровидной головкой вверху, межбугорковой бороздой, дельтовидной бугристостью и мыщелком для локтя внизу.',
    biomechanicsAndFunction: 'Центрирование головки зависит от вращательной манжеты; при смещении головки кпереди возникает тендинит длинной головки бицепса.',
    palpationLandmark: 'Большой и малый бугорки плеча, дельтовидная бугристость, латеральный и медиальный надмыщелки локтя.',
    dysfunctionSigns: [
      'Передне-верхнее смещение головки плеча, ночные боли в плече',
      'Эпикондилит надмыщелков плеча («локоть теннисиста / гольфиста»)',
    ],
    kinesiologyTestAndProvocation: 'ММТ дельтовидной и бицепса при центрирующем сдвиге головки плеча кзади/вниз.',
    relatedMuscleIds: ['deltoid', 'biceps-brachii', 'triceps-brachii', 'coracobrachialis', 'supraspinatus'],
    relatedOrganIds: ['heart', 'lungs', 'stomach'],
    relatedDiaphragmIds: ['hyoid-thoracic-inlet'],
    relatedMeridianIds: ['heart', 'lung', 'large-intestine', 'small-intestine'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 144,
    y: 258,
  }),
  ...makePairedBones({
    baseId: 'bone-radius',
    name: 'Лучевая кость',
    latinBase: 'Radius',
    adjGender: 'f',
    zone: 'upper-limb',
    side: 'anterior',
    categoryLabel: 'Плечевой пояс и рука (64)',
    anatomyAndLocation: 'Латеральная кость предплечья (со стороны большого пальца), вращающаяся вокруг локтевой при пронации/супинации и несущая 80% нагрузки от запястья.',
    biomechanicsAndFunction: 'Головка лучевой кости часто смещается вперёд/кзади при падениях на вытянутую руку или спазме бицепса, ослабляя разгибатели кисти.',
    palpationLandmark: 'Головка лучевой кости (под латеральным надмыщелком) и шиловидный отросток у основания большого пальца.',
    dysfunctionSigns: [
      'Ограничение супинации/пронации, латеральная боль в локте и «туннель» у запястья',
      'Слабость плечелучевой мышцы и лучевых разгибателей запястья',
    ],
    kinesiologyTestAndProvocation: 'ММТ плечелучевой и разгибателей запястья при переднем/заднем сдвиге головки лучевой кости.',
    relatedMuscleIds: ['brachioradialis', 'biceps-brachii', 'wrist-extensors', 'wrist-flexors'],
    relatedOrganIds: ['large-intestine', 'lungs'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['lung', 'large-intestine'],
    relatedChainIds: ['arm-lines'],
    view: 'anterior',
    rightX: 106,
    y: 356,
  }),
  ...makePairedBones({
    baseId: 'bone-ulna',
    name: 'Локтевая кость',
    latinBase: 'Ulna',
    adjGender: 'f',
    zone: 'upper-limb',
    side: 'posterior',
    categoryLabel: 'Плечевой пояс и рука (64)',
    anatomyAndLocation: 'Медиальная кость предплечья (со стороны мизинца); образует массивный локтевой отросток (олекранон) и блоковидный сустав с плечом.',
    biomechanicsAndFunction: 'Задаёт стабильную ось локтя; при креплении трёхглавой мышцы к олекранону отражает баланс поджелудочной железы/селезёнки (через трицепс) и меридиана сердца/тонкой кишки.',
    palpationLandmark: 'Локтевой отросток, весь задний край локтевой кости и её дистальная головка со стороны мизинца.',
    dysfunctionSigns: [
      'Боль у медиального надмыщелка и локтевого нерва в кубитальном канале',
      'Ограничение полного разгибания локтя, дистальная нестабильность TFCC',
    ],
    kinesiologyTestAndProvocation: 'ММТ трицепса и сгибателей запястья при лёгкой медиально-латеральной провокации локтя.',
    relatedMuscleIds: ['triceps-brachii', 'wrist-flexors', 'wrist-extensors'],
    relatedOrganIds: ['pancreas', 'heart', 'small-intestine'],
    relatedDiaphragmIds: [],
    relatedMeridianIds: ['heart', 'small-intestine', 'triple-warmer'],
    relatedChainIds: ['arm-lines'],
    view: 'posterior',
    rightX: 904,
    y: 356,
  }),
  ...CARPAL_BONES.flatMap((cp) =>
    makePairedBones({
      baseId: `bone-carpal-${cp.id}`,
      name: cp.ru,
      latinBase: cp.la,
      adjGender: 'f',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Плечевой пояс и рука (64)',
      anatomyAndLocation: `${cp.note} Входит в арку запястного канала и сочленяется по законам запястной кинематики.`,
      biomechanicsAndFunction: 'Обеспечивает амортизацию опоры на ладонь и скольжение сухожилий сгибателей/разгибателей кисти.',
      palpationLandmark: 'Ладонная и тыльная поверхности запястья в соответствующей колонне (лучевой / центральной / локтевой).',
      dysfunctionSigns: [
        'Локальная боль в запястье при отжиманиях, щелчок, симптомы карпального канала',
        'Слабость щипкового или кистевого хвата в ММТ',
      ],
      kinesiologyTestAndProvocation: 'ММТ сгибателей/разгибателей кисти и противопоставления большого пальца при мягком тыльном/ладонном сдвиге кости.',
      relatedMuscleIds: ['wrist-flexors', 'wrist-extensors', 'brachioradialis'],
      relatedOrganIds: ['large-intestine', 'lungs', 'heart'],
      relatedDiaphragmIds: [],
      relatedMeridianIds: ['pericardium', 'heart', 'lung', 'large-intestine'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: 78 + cp.xOff,
      y: 416 + cp.yOff,
    })
  ),
  ...METACARPAL_ROMANS.flatMap((roman, idx) =>
    makePairedBones({
      baseId: `bone-metacarpal-${idx + 1}`,
      name: `${roman} пястная кость кисти`,
      latinBase: `Os metacarpi ${roman}`,
      adjGender: 'f',
      zone: 'upper-limb',
      side: 'anterior',
      categoryLabel: 'Плечевой пояс и рука (64)',
      anatomyAndLocation: `Трубчатая кость ладонного отдела кисти для ${FINGER_NAMES[idx]} пальца (основание, тело и головка пястно-фалангового сустава); между пястными расположены межкостные мышцы кисти.`,
      biomechanicsAndFunction: `Формирует поперечный и продольный своды кисти, передаёт усилие хвата и точку приложения червеобразных и межкостных мышц.`,
      palpationLandmark: 'Тыльная поверхность кисти от запястно-пястного основания до костяшки пястно-фалангового сустава.',
      dysfunctionSigns: [
        `Снижение подвижности ${roman} запястно-пястного сочленения, боль в своде ладони`,
        idx === 0 ? 'Ризартроз основания I пястной кости' : 'Перегрузка межкостных пространств при тонкой моторике',
      ],
      kinesiologyTestAndProvocation: `Сдвиг основания ${roman} пястной кости относительно дистального ряда запястья с контролем силы хвата.`,
      relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
      relatedOrganIds: idx <= 1 ? ['lungs', 'large-intestine'] : ['heart', 'small-intestine'],
      relatedDiaphragmIds: [],
      relatedMeridianIds: idx === 0 ? ['lung'] : idx === 1 ? ['large-intestine'] : ['pericardium', 'heart'],
      relatedChainIds: ['arm-lines'],
      view: 'anterior',
      rightX: 68 + idx * 5,
      y: 438,
    })
  ),
  // 14 фаланг пальцев кисти × 2 = 28
  ...[0, 1, 2, 3, 4].flatMap((fingerIdx) => {
    const roman = METACARPAL_ROMANS[fingerIdx];
    const parts: Array<{ code: 'proximal' | 'middle' | 'distal'; ru: string; la: string; yOff: number }> =
      fingerIdx === 0
        ? [
            { code: 'proximal', ru: 'Проксимальная фаланга', la: 'Phalanx proximalis', yOff: 448 },
            { code: 'distal', ru: 'Дистальная фаланга', la: 'Phalanx distalis', yOff: 458 },
          ]
        : [
            { code: 'proximal', ru: 'Проксимальная фаланга', la: 'Phalanx proximalis', yOff: 450 },
            { code: 'middle', ru: 'Средняя фаланга', la: 'Phalanx media', yOff: 458 },
            { code: 'distal', ru: 'Дистальная фаланга', la: 'Phalanx distalis', yOff: 466 },
          ];
    return parts.flatMap((ph) =>
      makePairedBones({
        baseId: `bone-hand-phalanx-${fingerIdx + 1}-${ph.code}`,
        name: `${ph.ru} ${FINGER_NAMES[fingerIdx]} пальца кисти`,
        latinBase: `${ph.la} digiti ${roman} manus`,
        adjGender: 'f',
        zone: 'upper-limb',
        side: 'anterior',
        categoryLabel: 'Плечевой пояс и рука (64)',
        anatomyAndLocation: `Короткая трубчатая кость ${FINGER_NAMES[fingerIdx]} пальца кисти; к дистальным и средним фалангам крепятся глубокий и поверхностный сгибатели и разгибатели пальцев, здесь же находятся начальные/конечные точки меридианов рук.`,
        biomechanicsAndFunction: 'Обеспечивает точный захват, мелкую моторику и концевое натяжение миофасциальных линий рук.',
        palpationLandmark: 'Дорсальная и ладонная поверхности соответствующего межфалангового сегмента.',
        dysfunctionSigns: [
          'Тугоподвижность межфаланговых суставов, «щёлкающий палец», узелки Гебердена/Бушара',
          'Посттравматическая гипотония цепи сгибателей/разгибателей руки',
        ],
        kinesiologyTestAndProvocation: 'ММТ глубокого сгибателя / разгибателя пальцев и тракция межфалангового сустава.',
        relatedMuscleIds: ['wrist-flexors', 'wrist-extensors'],
        relatedOrganIds: fingerIdx <= 1 ? ['lungs', 'large-intestine'] : ['heart', 'small-intestine'],
        relatedDiaphragmIds: [],
        relatedMeridianIds: fingerIdx === 0 ? ['lung'] : fingerIdx === 1 ? ['large-intestine'] : fingerIdx === 4 ? ['heart', 'small-intestine'] : ['pericardium', 'triple-warmer'],
        relatedChainIds: ['arm-lines'],
        view: 'anterior',
        rightX: 64 + fingerIdx * 5,
        y: ph.yOff,
      })
    );
  }),
];

// ============================================================================
// 5. ТАЗОВЫЙ ПОЯС И НИЖНИЕ КОНЕЧНОСТИ (62 кости = 31 R + 31 L)
// ============================================================================
const TARSAL_BONES: Array<{ id: string; ru: string; la: string; xOff: number; y: number; muscles: string[]; note: string }> = [
  { id: 'talus', ru: 'Таранная кость стопы', la: 'Talus', xOff: 0, y: 794, muscles: ['tibialis-anterior', 'soleus', 'fibularis-peroneus'], note: 'Не имеет ни одного мышечного крепления; формирует голеностопный блок и распределяет весь вес тела между пяткой и передним отделом.' },
  { id: 'calcaneus', ru: 'Пяточная кость стопы', la: 'Calcaneus', xOff: 4, y: 816, muscles: ['gastrocnemius', 'soleus', 'tibialis-posterior'], note: 'Крупнейшая кость предплюсны; принимает ахиллово сухожилие сзади и подошвенный апоневроз снизу.' },
  { id: 'navicular', ru: 'Ладьевидная кость стопы', la: 'Os naviculare', xOff: -6, y: 806, muscles: ['tibialis-posterior', 'tibialis-anterior'], note: 'Замковый камень медиального продольного свода стопы (бугристость — место прикрепления задней большеберцовой мышцы).' },
  { id: 'medial-cuneiform', ru: 'Медиальная клиновидная кость стопы', la: 'Os cuneiforme mediale', xOff: -8, y: 816, muscles: ['tibialis-anterior', 'fibularis-peroneus', 'tibialis-posterior'], note: 'Опора I плюсневой кости; снизу крепятся передняя большеберцовая и длинная малоберцовая мышцы («стремя стопы»).' },
  { id: 'intermediate-cuneiform', ru: 'Промежуточная клиновидная кость стопы', la: 'Os cuneiforme intermedium', xOff: -2, y: 818, muscles: ['tibialis-posterior'], note: 'Центральный клин II луча стопы (Ключ сустава Лисфранка); обеспечивает жёсткость среднего отдела.' },
  { id: 'lateral-cuneiform', ru: 'Латеральная клиновидная кость стопы', la: 'Os cuneiforme laterale', xOff: 4, y: 818, muscles: ['tibialis-posterior', 'fibularis-peroneus'], note: 'Переходное звено между центральным сводом и кубовидной костью (III луч Лисфранка).' },
  { id: 'cuboid', ru: 'Кубовидная кость стопы', la: 'Os cuboideum', xOff: 10, y: 816, muscles: ['fibularis-peroneus', 'soleus'], note: 'Ключевой элемент наружного продольного свода стопы; под ней проходит сухожилие длинной малоберцовой мышцы (синдром кубовидной кости).' },
];

const METATARSAL_ROMANS = ['I', 'II', 'III', 'IV', 'V'];
const TOE_NAMES = ['I (большого)', 'II (второго)', 'III (третьего)', 'IV (четвёртого)', 'V (мизинца)'];

const LOWER_LIMB_BONES: StructuralElementProfile[] = [
  ...makePairedBones({
    baseId: 'bone-pelvic-os-coxae',
    name: 'Тазовая кость (подвздошная, седалищная, лобковая)',
    latinBase: 'Os coxae',
    adjGender: 'f',
    zone: 'lumbar',
    side: 'anterior',
    categoryLabel: 'Таз и нижняя конечность (62)',
    anatomyAndLocation: 'Парная массивная кость тазового кольца, сросшаяся к взрослому возрасту из подвздошной, седалищной и лобковой костей; сзади образует КПС с крестцом, спереди — лобковый симфиз, снаружи — вертлужную впадину.',
    biomechanicsAndFunction: 'Переднее/заднее вращение и «инфлер/аутфлер» смещение меняют длину ноги и тонус всей мускулатуры бедра, тазового дна и поясницы.',
    palpationLandmark: 'ПВПО (ASIS), гребень подвздошной кости, ЗВПО (PSIS), седалищный бугор и лобковая ветвь.',
    dysfunctionSigns: [
      'Скрученный таз (PI/AS), кажущаяся разница длины ног, односторонняя боль в КПС или паху',
      'Дисбаланс приводящих, ягодичных, подвздошно-поясничной и хамстрингов',
    ],
    kinesiologyTestAndProvocation: 'Сравнение высоты ПВПО/ЗВПО, тест Жилле и ММТ ягодичных и подвздошной мышц при коррекции тазовыми блоками.',
    relatedMuscleIds: ['iliopsoas', 'gluteus-medius', 'gluteus-maximus', 'hip-adductors', 'hamstrings', 'piriformis'],
    relatedOrganIds: ['urogenital', 'large-intestine', 'small-intestine'],
    relatedDiaphragmIds: ['pelvic-floor'],
    relatedMeridianIds: ['gallbladder', 'bladder', 'kidney', 'conception'],
    relatedChainIds: ['deep-front-line', 'lateral-line', 'superficial-back-line'],
    view: 'anterior',
    rightX: 204,
    y: 446,
  }),
  ...makePairedBones({
    baseId: 'bone-femur',
    name: 'Бедренная кость',
    latinBase: 'Femur',
    adjGender: 'f',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Таз и нижняя конечность (62)',
    anatomyAndLocation: 'Самая длинная и прочная трубчатая кость скелета (головка, шейка, большой и малый вертелы, диафиз с шероховатой линией и медиальный/латеральный мыщелки).',
    biomechanicsAndFunction: 'Угол антеверсии шейки и скольжение мыщелков задают ось ноги от тазобедренного сустава к колену; место крепления ягодичных, приводящих и широких мышц бедра.',
    palpationLandmark: 'Большой вертел бедра, медиальный и латеральный мыщелки и надмыщелки колена.',
    dysfunctionSigns: [
      'Боль у большого вертела, внутренняя/наружная ротационная установка бедра при шаге',
      'Перегрузка колена и поясницы вследствие дисбаланса ротаторов бедра',
    ],
    kinesiologyTestAndProvocation: 'Проба Патрика–Фабера, тест Крейга (антеверсия шейки бедра) и ММТ приводящих/ягодичных при ротации бедра.',
    relatedMuscleIds: ['quadriceps-femoris', 'hamstrings', 'hip-adductors', 'gluteus-medius', 'piriformis', 'iliopsoas'],
    relatedOrganIds: ['small-intestine', 'urogenital', 'gallbladder'],
    relatedDiaphragmIds: ['pelvic-floor', 'plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'gallbladder', 'spleen', 'bladder'],
    relatedChainIds: ['superficial-front-line', 'superficial-back-line', 'lateral-line'],
    view: 'anterior',
    rightX: 208,
    y: 544,
  }),
  ...makePairedBones({
    baseId: 'bone-patella',
    name: 'Надколенник',
    latinBase: 'Patella',
    adjGender: 'm',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Таз и нижняя конечность (62)',
    anatomyAndLocation: 'Крупнейшая сесамовидная кость в толще сухожилия четырёхглавой мышцы бедра, скользящая по блоку бедренной кости.',
    biomechanicsAndFunction: 'Увеличивает рычаг разгибания колена на ~30%; дисбаланс между латеральной (ITB) и медиальной широкой (VMO) мышцами уводит надколенник кнаружи.',
    palpationLandmark: 'Верхний и нижний полюсы надколенника, медиальная и латеральная фасетки при расслабленном колене.',
    dysfunctionSigns: [
      'Хондромаляция надколенника, хруст и боль при приседании/спуске по лестнице',
      'Латеральный трекинг надколенника и фиксация собственной связки',
    ],
    kinesiologyTestAndProvocation: 'ММТ четырёхглавой мышцы бедра при лёгком смещении надколенника медиально/латерально и вверх/вниз.',
    relatedMuscleIds: ['quadriceps-femoris', 'tensor-fasciae-latae', 'sartorius'],
    relatedOrganIds: ['small-intestine'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'spleen'],
    relatedChainIds: ['superficial-front-line'],
    view: 'anterior',
    rightX: 212,
    y: 626,
  }),
  ...makePairedBones({
    baseId: 'bone-tibia',
    name: 'Большеберцовая кость',
    latinBase: 'Tibia',
    adjGender: 'f',
    zone: 'lower-limb',
    side: 'anterior',
    categoryLabel: 'Таз и нижняя конечность (62)',
    anatomyAndLocation: 'Крупная медиальная несущая кость голени (мыщелки плато, бугристость для связки надколенника, гусиная лапка и медиальная лодыжка).',
    biomechanicsAndFunction: 'Несёт ~85% осевой нагрузки голени; ротационный сдвиг плато относительно бедра перегружает мениски и подколенную мышцу.',
    palpationLandmark: 'Бугристость большеберцовой кости, передний гребень голени и медиальная лодыжка.',
    dysfunctionSigns: [
      'Боль у «гусиной лапки», шинсплинт, ротационный блок колена (невозможность полного разгибания)',
      'Туннель тарзального канала за медиальной лодыжкой',
    ],
    kinesiologyTestAndProvocation: 'ММТ подколенной, передней и задней большеберцовых мышц при ротационной провокации голени.',
    relatedMuscleIds: ['tibialis-anterior', 'tibialis-posterior', 'popliteus', 'sartorius', 'quadriceps-femoris'],
    relatedOrganIds: ['kidneys', 'urogenital', 'gallbladder'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['stomach', 'spleen', 'liver', 'kidney'],
    relatedChainIds: ['deep-front-line', 'superficial-front-line', 'spiral-line'],
    view: 'anterior',
    rightX: 218,
    y: 718,
  }),
  ...makePairedBones({
    baseId: 'bone-fibula',
    name: 'Малоберцовая кость',
    latinBase: 'Fibula',
    adjGender: 'f',
    zone: 'lower-limb',
    side: 'posterior',
    categoryLabel: 'Таз и нижняя конечность (62)',
    anatomyAndLocation: 'Тонкая латеральная кость голени: головка вверху (место крепления бицепса бедра и малоберцового нерва) и латеральная лодыжка внизу в вилке голеностопа.',
    biomechanicsAndFunction: 'Скользит краниально при тыльном сгибании стопы; фиксация головки МБК вверх или кзади мгновенно ослабляет малоберцовые мышцы и ягодицу.',
    palpationLandmark: 'Головка малоберцовой кости на 2 см ниже наружной щели колена и латеральная лодыжка голеностопа.',
    dysfunctionSigns: [
      'Переднее или заднее смещение головки МБК, частые подвороты голеностопа',
      'Посттравматическая слабость малоберцовых мышц и латеральная нестабильность колена',
    ],
    kinesiologyTestAndProvocation: 'ММТ малоберцовых мышц и бицепса бедра при передне-заднем скольжении головки малоберцовой кости.',
    relatedMuscleIds: ['fibularis-peroneus', 'hamstrings', 'soleus'],
    relatedOrganIds: ['urogenital', 'gallbladder'],
    relatedDiaphragmIds: ['plantar-popliteal'],
    relatedMeridianIds: ['gallbladder', 'bladder'],
    relatedChainIds: ['lateral-line', 'spiral-line'],
    view: 'posterior',
    rightX: 734,
    y: 718,
  }),
  ...TARSAL_BONES.flatMap((tb) =>
    makePairedBones({
      baseId: `bone-tarsal-${tb.id}`,
      name: tb.ru,
      latinBase: tb.la,
      adjGender: tb.id === 'talus' ? 'f' : tb.id === 'calcaneus' ? 'f' : tb.id === 'navicular' ? 'f' : tb.id === 'cuboid' ? 'f' : 'f',
      zone: 'lower-limb',
      side: tb.id === 'calcaneus' ? 'posterior' : 'anterior',
      categoryLabel: 'Таз и нижняя конечность (62)',
      anatomyAndLocation: tb.note,
      biomechanicsAndFunction: 'Ключевое костное звено рессорного свода стопы, голеностопно-подтаранного механизма и проприоцептивного старта шага.',
      palpationLandmark: 'Опознаётся по соответствующему анатомическому отделу (медиальная/латеральная лодыжка, пяточный бугор, медиальный и латеральный края свода).',
      dysfunctionSigns: [
        'Локальная болезненность свода, уплощение или жёсткость стопы, подвороты голеностопа',
        'Восходящая гипотония ягодичных мышц и квадратной поясницы в положении стоя',
      ],
      kinesiologyTestAndProvocation: 'ММТ задней большеберцовой / малоберцовых / большой ягодичной мышцы в положении стоя и при позиционной провокации кости.',
      relatedMuscleIds: tb.muscles,
      relatedOrganIds: ['kidneys', 'urogenital'],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: ['kidney', 'bladder', 'stomach', 'spleen'],
      relatedChainIds: ['deep-front-line', 'superficial-back-line', 'lateral-line'],
      view: tb.id === 'calcaneus' ? 'posterior' : 'anterior',
      rightX: tb.id === 'calcaneus' ? 810 : 216 + tb.xOff,
      y: tb.y,
    })
  ),
  ...METATARSAL_ROMANS.flatMap((roman, idx) =>
    makePairedBones({
      baseId: `bone-metatarsal-${idx + 1}`,
      name: `${roman} плюсневая кость стопы`,
      latinBase: `Os metatarsi ${roman}`,
      adjGender: 'f',
      zone: 'lower-limb',
      side: 'anterior',
      categoryLabel: 'Таз и нижняя конечность (62)',
      anatomyAndLocation: `Трубчатая кость переднего отдела стопы для ${TOE_NAMES[idx]} пальца${
        idx === 0
          ? ' (несёт до 40% опоры толчка и две сесамовидные кости под головкой)'
          : idx === 4
          ? ' (выраженная бугристость основания — место крепления короткой малоберцовой мышцы)'
          : ' (формирует поперечную арку переднего свода стопы)'
      }.`,
      biomechanicsAndFunction: 'Обеспечивает перекат переднего отдела стопы, упругость поперечного свода и финальный толчок пальцами.',
      palpationLandmark: `Тыл и подошвенная проекция головки и основания ${roman} плюсневой кости.`,
      dysfunctionSigns: [
        idx === 0 ? 'Hallux valgus, метатарзалгия I луча' : 'Натоптыши под головками плюсневых костей, поперечное плоскостопие',
        'Ослабление переката и компенсаторный гипертонус икр',
      ],
      kinesiologyTestAndProvocation: `Дорсально-плантарная мобилизация ${roman} плюсневой кости с оценкой тонуса мышц голени и ягодичных.`,
      relatedMuscleIds: ['tibialis-anterior', 'fibularis-peroneus', 'tibialis-posterior'],
      relatedOrganIds: idx === 0 ? ['stomach', 'liver'] : ['stomach', 'kidneys'],
      relatedDiaphragmIds: ['plantar-popliteal'],
      relatedMeridianIds: idx === 0 ? ['spleen', 'liver'] : idx === 4 ? ['bladder'] : ['stomach', 'gallbladder'],
      relatedChainIds: ['superficial-front-line', 'superficial-back-line', 'lateral-line'],
      view: 'anterior',
      rightX: 204 + idx * 5,
      y: 832,
    })
  ),
  // 14 фаланг пальцев стопы × 2 = 28
  ...[0, 1, 2, 3, 4].flatMap((toeIdx) => {
    const roman = METATARSAL_ROMANS[toeIdx];
    const parts: Array<{ code: 'proximal' | 'middle' | 'distal'; ru: string; la: string; y: number }> =
      toeIdx === 0
        ? [
            { code: 'proximal', ru: 'Проксимальная фаланга', la: 'Phalanx proximalis', y: 842 },
            { code: 'distal', ru: 'Дистальная фаланга', la: 'Phalanx distalis', y: 850 },
          ]
        : [
            { code: 'proximal', ru: 'Проксимальная фаланга', la: 'Phalanx proximalis', y: 842 },
            { code: 'middle', ru: 'Средняя фаланга', la: 'Phalanx media', y: 848 },
            { code: 'distal', ru: 'Дистальная фаланга', la: 'Phalanx distalis', y: 854 },
          ];
    return parts.flatMap((ph) =>
      makePairedBones({
        baseId: `bone-foot-phalanx-${toeIdx + 1}-${ph.code}`,
        name: `${ph.ru} ${TOE_NAMES[toeIdx]} пальца стопы`,
        latinBase: `${ph.la} digiti ${roman} pedis`,
        adjGender: 'f',
        zone: 'lower-limb',
        side: 'anterior',
        categoryLabel: 'Таз и нижняя конечность (62)',
        anatomyAndLocation: `Короткая трубчатая кость ${TOE_NAMES[toeIdx]} пальца стопы; точка приложения длинных и коротких сгибателей/разгибателей пальцев стопы и терминальных точек ножных меридианов.`,
        biomechanicsAndFunction: 'Завершает фазу отталкивания в шаге (эффект лебёдки подошвенного апоневроза) и даёт проприоцептивный сигнал равновесия в ЦНС.',
        palpationLandmark: 'Дорсальная и подошвенная поверхности соответствующей фаланги пальца стопы.',
        dysfunctionSigns: [
          'Молоткообразная или когтеобразная деформация пальцев, ограничение тыльного разгибания I пальца (Hallux rigidus)',
          'Падение глобального постурального тонуса при болезненных мозолях и блоках фаланг',
        ],
        kinesiologyTestAndProvocation: 'Тест Джека (пассивное разгибание I пальца) и тракция межфаланговых суставов с ретестом ягодичных мышц.',
        relatedMuscleIds: ['tibialis-anterior', 'gastrocnemius', 'soleus'],
        relatedOrganIds: ['stomach', 'liver', 'kidneys'],
        relatedDiaphragmIds: ['plantar-popliteal'],
        relatedMeridianIds: toeIdx === 0 ? ['spleen', 'liver'] : toeIdx === 4 ? ['bladder'] : ['stomach', 'gallbladder'],
        relatedChainIds: ['superficial-back-line', 'superficial-front-line'],
        view: 'anterior',
        rightX: 204 + toeIdx * 5,
        y: ph.y,
      })
    );
  }),
];

export const SKELETON_206_BONES: StructuralElementProfile[] = [
  ...SKULL_AND_HEAD_BONES,
  ...CERVICAL_VERTEBRAE,
  ...THORACIC_VERTEBRAE,
  ...LUMBAR_VERTEBRAE,
  ...SACRUM_AND_COCCYX,
  ...THORAX_BONES,
  ...UPPER_LIMB_BONES,
  ...LOWER_LIMB_BONES,
];
