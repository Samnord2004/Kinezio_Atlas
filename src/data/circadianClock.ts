import { CircadianPeriodId } from '../types/atlas';

export type DayPart = 'Ночь' | 'Утро' | 'День' | 'Вечер';

export interface CircadianSlot {
  id: CircadianPeriodId;
  order: number;
  startHour: number;
  endHour: number;
  hoursLabel: string;
  practicalWindow: string;
  shortLabel: string;
  dayPart: DayPart;
  organTitle: string;
  meridianId: string;
  oppositeMeridianId: string;
  organIds: string[];
  muscleIds: string[];
  keyAcupointCodes: string[];
  physiologicalProcess: string;
  clinicalMeaning: string;
  typicalComplaints: string[];
  mmtFocus: string;
  searchTokens: string[];
}

export const CIRCADIAN_SLOTS: CircadianSlot[] = [
  {
    id: '01-03',
    order: 1,
    startHour: 1,
    endHour: 3,
    hoursLabel: '01:00 – 03:00',
    practicalWindow: '01:00–03:00 (глубокая ночь)',
    shortLabel: '01–03 · Печень',
    dayPart: 'Ночь',
    organTitle: 'Печень (LR)',
    meridianId: 'liver',
    oppositeMeridianId: 'small-intestine',
    organIds: ['liver', 'gallbladder'],
    muscleIds: ['pectoralis-major-sternal', 'rhomboids', 'temporalis'],
    keyAcupointCodes: ['LR-3', 'LR-8', 'LR-14'],
    physiologicalProcess:
      'Пик фаз I и II биотрансформации токсинов, синтеза жёлчи и восстановления гликогена; обновление крови и связочно-сухожильного аппарата.',
    clinicalMeaning:
      'Дискомфорт или регулярные пробуждения в 01:00–03:00 указывают на перегрузку детоксикационной функции печени, застой жёлчи или спазм правого купола диафрагмы.',
    typicalComplaints: [
      'Пробуждение в 01:00–03:00 с чувством жара или тревоги',
      'Тяжесть и распирание в правом подреберье, горечь',
      'Ночные судороги в икроножных мышцах и тяга в правом плече',
    ],
    mmtFocus:
      'Тестируйте грудинную порцию большой грудной мышцы (PMS) и ромбовидные мышцы; проверьте НЛ-зону 5-го межреберья справа.',
    searchTokens: ['1 ночи', '2 ночи', '3 ночи', '01:00', '02:00', '03:00', '1-3', 'с 1 до 3', 'печень', 'судороги ночью'],
  },
  {
    id: '03-05',
    order: 2,
    startHour: 3,
    endHour: 5,
    hoursLabel: '03:00 – 05:00',
    practicalWindow: '03:00–05:00 (предутренние часы)',
    shortLabel: '03–05 · Лёгкие',
    dayPart: 'Ночь',
    organTitle: 'Лёгкие и плевра (LU)',
    meridianId: 'lung',
    oppositeMeridianId: 'bladder',
    organIds: ['lungs'],
    muscleIds: ['deltoid', 'serratus-anterior', 'scalenes'],
    keyAcupointCodes: ['LU-9', 'LU-7', 'LU-1'],
    physiologicalProcess:
      'Максимальное перераспределение венозной крови в малый круг, оксигенация тканей и переход к предутренней фазе кортизолового подъёма.',
    clinicalMeaning:
      'Пробуждение с кашлем, заложенностью носа или ощущением нехватки воздуха в 03:00–05:00 свидетельствует о застое в куполе плевры, спазме грудобрюшной диафрагмы и перегрузке канала Лёгких.',
    typicalComplaints: [
      'Предутренний сухой кашель или одышка в 03:00–05:00',
      'Онемение пальцев рук и ломящая боль в надплечьях к утру',
      'Заложенность носа и чувство стеснения в верхней части груди',
    ],
    mmtFocus:
      'Протестируйте среднюю дельтовидную, переднюю зубчатую и лестничные мышцы; оцените экскурсию 1-го ребра и купол плевры.',
    searchTokens: ['4 утра', '3 утра', '5 утра', '03:00', '04:00', '05:00', '3-5', 'с 3 до 5', 'предутрен', 'лёгкие'],
  },
  {
    id: '05-07',
    order: 3,
    startHour: 5,
    endHour: 7,
    hoursLabel: '05:00 – 07:00',
    practicalWindow: '05:00–07:00 (раннее утро)',
    shortLabel: '05–07 · Толст. киш.',
    dayPart: 'Утро',
    organTitle: 'Толстый кишечник (LI)',
    meridianId: 'large-intestine',
    oppositeMeridianId: 'kidney',
    organIds: ['large-intestine', 'sinuses'],
    muscleIds: ['tensor-fasciae-latae', 'quadratus-lumborum', 'hamstrings'],
    keyAcupointCodes: ['LI-4', 'LI-11', 'ST-25'],
    physiologicalProcess:
      'Активация утренней перистальтики толстой кишки, завершение всасывания воды и подготовка кишечника к эвакуации.',
    clinicalMeaning:
      'Спазмы внизу живота, вздутие, урчание, утренние запоры или тянущая боль в пояснице при пробуждении с 05:00 до 07:00 указывают на дисфункцию илеоцекального клапана (ИЦК) и толстой кишки.',
    typicalComplaints: [
      'Раннеутреннее вздутие и тянущая боль в правой или левой подвздошной области',
      'Стартовая скованность поясницы с утра до посещения туалета',
      'Лобно-челюстная тяжесть и заложенность носовых пазух после сна',
    ],
    mmtFocus:
      'Оцените напрягатель широкой фасции бедра (TFL), квадратную мышцу поясницы и хамстринги; проведите ТЛ илеоцекального клапана.',
    searchTokens: ['5 утра', '6 утра', '05:00', '06:00', '07:00', '5-7', 'с 5 до 7', 'толстый кишечник', 'запор утром'],
  },
  {
    id: '06-09',
    order: 4,
    startHour: 6,
    endHour: 9,
    hoursLabel: '06:00 – 09:00',
    practicalWindow: '06:00–08:00 / 07:00–09:00 (утро натощак)',
    shortLabel: '06–09 · Желудок',
    dayPart: 'Утро',
    organTitle: 'Желудок и кардия (ST)',
    meridianId: 'stomach',
    oppositeMeridianId: 'pericardium',
    organIds: ['stomach'],
    muscleIds: ['pectoralis-major-clavicular', 'masseter', 'deep-neck-flexors', 'biceps-brachii'],
    keyAcupointCodes: ['ST-36', 'ST-41', 'CV-12'],
    physiologicalProcess:
      'Максимальная утренняя секреция соляной кислоты и пепсиногена, подготовка слизистой желудка к первому приёму пищи, пик кортизоловой мобилизации (6–8 утра).',
    clinicalMeaning:
      'Дискомфорт, подташнивание, спазм в эпигастрии, комок в горле или тяжесть в шее и челюстях с 06:00 до 08:00–09:00 утра свидетельствуют о нарушении функций желудка, кардии или кислотности.',
    typicalComplaints: [
      'Тяжесть, жжение, «сосание» или тошнота в эпигастрии с 6 до 8 утра',
      'Утренний спазм челюстей (бруксизм) и боль в передней поверхности шеи',
      'Отрыжка, дискомфорт натощак или сразу после раннего завтрака',
    ],
    mmtFocus:
      'Первичный тест — ключичная порция большой грудной мышцы (PMC), жевательная и глубокие сгибатели шеи; проверьте НЛ 5-го межреберья слева и CV-12.',
    searchTokens: [
      '6 утра',
      '7 утра',
      '8 утра',
      '9 утра',
      '6-8',
      '6 до 8',
      'с 6 до 8',
      '7-9',
      'с 7 до 9',
      '06:00',
      '07:00',
      '08:00',
      '09:00',
      'натощак',
      'утром',
      'желудок',
    ],
  },
  {
    id: '09-11',
    order: 5,
    startHour: 9,
    endHour: 11,
    hoursLabel: '09:00 – 11:00',
    practicalWindow: '09:00–11:00 (первая половина дня)',
    shortLabel: '09–11 · Селезёнка',
    dayPart: 'Утро',
    organTitle: 'Селезёнка и поджелудочная железа (SP)',
    meridianId: 'spleen',
    oppositeMeridianId: 'triple-warmer',
    organIds: ['pancreas'],
    muscleIds: ['latissimus-dorsi', 'middle-lower-trapezius', 'triceps-brachii'],
    keyAcupointCodes: ['SP-2', 'SP-3', 'SP-6'],
    physiologicalProcess:
      'Активный выброс пищеварительных ферментов и инсулина, распределение питательных веществ после завтрака, лимфатическая и иммунная переработка.',
    clinicalMeaning:
      'Слабость, сонливость, дрожь от голода, тяга к сладкому или тяжесть под левым ребром в 09:00–11:00 указывают на перегрузку поджелудочной железы и гликемическую нестабильность.',
    typicalComplaints: [
      'Резкий упадок сил и туман через 1–2 часа после завтрака (09:00–11:00)',
      'Тянущие боли под левой лопаткой и по задней поверхности плеча',
      'Отёчность тканей и распирание в левом подреберье',
    ],
    mmtFocus:
      'Протестируйте широчайшую мышцу спины, среднюю/нижнюю трапецию и трицепс; проверьте НЛ-зону 7-го межреберья слева и LR-13.',
    searchTokens: ['9 утра', '10 утра', '11 утра', '09:00', '10:00', '11:00', '9-11', 'с 9 до 11', 'поджелудочная', 'селезёнка', 'после завтрака'],
  },
  {
    id: '11-13',
    order: 6,
    startHour: 11,
    endHour: 13,
    hoursLabel: '11:00 – 13:00',
    practicalWindow: '11:00–13:00 (полдень)',
    shortLabel: '11–13 · Сердце',
    dayPart: 'День',
    organTitle: 'Сердце и коронарная ось (HT)',
    meridianId: 'heart',
    oppositeMeridianId: 'gallbladder',
    organIds: ['heart'],
    muscleIds: ['subscapularis'],
    keyAcupointCodes: ['HT-7', 'HT-9', 'CV-14'],
    physiologicalProcess:
      'Пик минутного объёма кровообращения и центральной гемодинамики; максимальная нагрузка на сердечно-сосудистую и вегетативную регуляцию.',
    clinicalMeaning:
      'Полуденное сердцебиение, потливость, тревожность, боль в левом плечевом суставе в 11:00–13:00 сигнализируют о напряжении перикарда и дисбалансе канала Сердца.',
    typicalComplaints: [
      'Стеснение в груди и сердцебиение ближе к полудню (11:00–13:00)',
      'Боль в передне-внутреннем отделе левого плеча и под лопаткой',
      'Эмоциональное перенапряжение и приливы жара к лицу в середине дня',
    ],
    mmtFocus:
      'Обязательно протестируйте подлопаточную мышцу (внутреннюю ротацию плеча) и грудино-перикардиальные связки; ТЛ CV-14 / HT-7.',
    searchTokens: ['11 дня', '12 дня', 'полдень', '11:00', '12:00', '13:00', '11-13', 'с 11 до 13', 'сердце', 'полуденный'],
  },
  {
    id: '13-15',
    order: 7,
    startHour: 13,
    endHour: 15,
    hoursLabel: '13:00 – 15:00',
    practicalWindow: '13:00–15:00 (после обеда)',
    shortLabel: '13–15 · Тонк. киш.',
    dayPart: 'День',
    organTitle: 'Тонкий кишечник и всасывание (SI)',
    meridianId: 'small-intestine',
    oppositeMeridianId: 'liver',
    organIds: ['small-intestine'],
    muscleIds: ['rectus-abdominis', 'quadriceps-femoris'],
    keyAcupointCodes: ['SI-3', 'SI-4', 'CV-4'],
    physiologicalProcess:
      'Основная фаза ферментативного расщепления и всасывания нутриентов, аминокислот и липидов через ворсинки тонкой кишки и брыжейку.',
    clinicalMeaning:
      'Послеобеденное вздутие, урчание вокруг пупка, выраженная слабость в ногах и «туман в голове» с 13:00 до 15:00 говорят о перегрузке тонкого кишечника и корня брыжейки.',
    typicalComplaints: [
      'Послеобеденное распирание в центре живота и «туман» с 13:00 до 15:00',
      'Ощущение слабости в мышцах передней поверхности бедра и пресса',
      'Скованность в области лопаток и задне-боковой шее в середине дня',
    ],
    mmtFocus:
      'Протестируйте прямую мышцу живота и четырёхглавую мышцу бедра; оцените натяжение корня брыжейки и точку SI-3.',
    searchTokens: ['13:00', '14:00', '15:00', '13-15', 'с 13 до 15', 'после обеда', 'тонкий кишечник', 'час дня', 'два дня'],
  },
  {
    id: '15-17',
    order: 8,
    startHour: 15,
    endHour: 17,
    hoursLabel: '15:00 – 17:00',
    practicalWindow: '15:00–17:00 (вторая половина дня)',
    shortLabel: '15–17 · Моч. пузырь',
    dayPart: 'День',
    organTitle: 'Мочевой пузырь и венозно-ликворный дренаж (BL)',
    meridianId: 'bladder',
    oppositeMeridianId: 'lung',
    organIds: ['kidneys', 'urogenital'],
    muscleIds: ['erector-spinae', 'tibialis-anterior', 'fibularis-peroneus', 'gastrocnemius'],
    keyAcupointCodes: ['BL-40', 'BL-60', 'BL-23'],
    physiologicalProcess:
      'Активация фильтрации и выведения метаболитов почками-мочевым пузырём, перераспределение жидкости вдоль паравертебральной цепи.',
    clinicalMeaning:
      'Нарастание боли вдоль всего позвоночника, тяжесть в затылке и скованность икроножных мышц с 15:00 до 17:00 свидетельствуют о перегрузке задней цепи и меридиана Мочевого пузыря.',
    typicalComplaints: [
      'Боль в затылке и вдоль позвоночника во второй половине дня (15:00–17:00)',
      'Тяжесть и налитость в икрах, щелчки и нестабильность голеностопа при ходьбе',
      'Учащённое мочеиспускание или дискомфорт в крестце к концу рабочего дня',
    ],
    mmtFocus:
      'Проверьте переднюю и заднюю большеберцовые мышцы, малоберцовые мышцы и длинные разгибатели спины; ТЛ BL-40 / BL-60.',
    searchTokens: ['15:00', '16:00', '17:00', '15-17', 'с 15 до 17', 'мочевой пузырь', 'три часа', 'четыре часа', 'пять вечера', 'голеностоп', 'щелчки'],
  },
  {
    id: '17-19',
    order: 9,
    startHour: 17,
    endHour: 19,
    hoursLabel: '17:00 – 19:00',
    practicalWindow: '17:00–19:00 (ранний вечер)',
    shortLabel: '17–19 · Почки',
    dayPart: 'Вечер',
    organTitle: 'Почки и надпочечники (KI)',
    meridianId: 'kidney',
    oppositeMeridianId: 'large-intestine',
    organIds: ['kidneys', 'urogenital'],
    muscleIds: ['iliopsoas', 'upper-trapezius', 'sartorius', 'soleus'],
    keyAcupointCodes: ['KI-3', 'KI-7', 'KI-27'],
    physiologicalProcess:
      'Восстановление водно-электролитного баланса, фильтрационная и эндокринно-надпочечниковая регуляция (переключение со стрессового кортизола на отдых).',
    clinicalMeaning:
      'Резкая усталость, зябкость стоп, тянущая боль в пояснице и ощущение «подламывания» коленей в 17:00–19:00 — классический маркер истощения почек/надпочечников и гипотонии подвздошно-поясничной мышцы.',
    typicalComplaints: [
      'Вечерний провал энергии, зябкость стоп и ломота в пояснице с 17:00 до 19:00',
      'Писк или звон в ушах к концу дня, нестабильность коленей и голеностопа',
      'Отёчность вокруг глаз или лодыжек к концу дня',
    ],
    mmtFocus:
      'Тестируйте подвздошно-поясничную мышцу (psoas), верхнюю трапецию и портняжную/камбаловидную («надпочечниковую группу»); ТЛ точки KI-27 + пупок.',
    searchTokens: ['17:00', '18:00', '19:00', '17-19', 'с 17 до 19', 'вечером', 'почки', 'надпочечники', 'шесть вечера', 'семь вечера', 'писк в ушах', 'шум в ушах', 'щелчки'],
  },
  {
    id: '19-21',
    order: 10,
    startHour: 19,
    endHour: 21,
    hoursLabel: '19:00 – 21:00',
    practicalWindow: '19:00–21:00 (вечер)',
    shortLabel: '19–21 · Перикард',
    dayPart: 'Вечер',
    organTitle: 'Перикард и сосудистый тонус (PC)',
    meridianId: 'pericardium',
    oppositeMeridianId: 'stomach',
    organIds: ['heart', 'urogenital'],
    muscleIds: ['piriformis', 'gluteus-medius', 'gluteus-maximus', 'hip-adductors'],
    keyAcupointCodes: ['PC-6', 'PC-7', 'CV-17'],
    physiologicalProcess:
      'Вечернее переключение вегетативной нервной системы в парасимпатический режим, регуляция периферического кровообращения и тазового венозного возврата.',
    clinicalMeaning:
      'Тревожное сжатие за грудиной, тяжесть в малом тазу, отечность ног и спазм ягодично-грушевидной зоны в 19:00–21:00 говорят о перегрузке перикарда и нехватке парасимпатического торможения.',
    typicalComplaints: [
      'Вечерняя тревожность и чувство «тисков» в центре груди с 19:00 до 21:00',
      'Ноющая боль в ягодицах и малом тазу после рабочего дня',
      'Тяжесть и пульсация в венах нижних конечностей вечером',
    ],
    mmtFocus:
      'Протестируйте грушевидную, большую/среднюю ягодичные мышцы и приводящие; оцените грудино-перикардиальные связки и точку PC-6.',
    searchTokens: ['19:00', '20:00', '21:00', '19-21', 'с 19 до 21', 'перикард', 'восемь вечера', 'девять вечера'],
  },
  {
    id: '21-23',
    order: 11,
    startHour: 21,
    endHour: 23,
    hoursLabel: '21:00 – 23:00',
    practicalWindow: '21:00–23:00 (перед сном)',
    shortLabel: '21–23 · Сань-Цзяо',
    dayPart: 'Вечер',
    organTitle: 'Тройной обогреватель / Эндокринная ось (TE)',
    meridianId: 'triple-warmer',
    oppositeMeridianId: 'spleen',
    organIds: ['heart', 'pancreas'],
    muscleIds: ['upper-trapezius', 'infraspinatus', 'temporalis'],
    keyAcupointCodes: ['TE-5', 'TE-3', 'TE-10'],
    physiologicalProcess:
      'Синхронизация нейроэндокринной и терморегуляторной систем (эпифиз/мелатонин, щитовидная железа, надпочечники), снижение симпатического тонуса перед сном.',
    clinicalMeaning:
      'Невозможность расслабиться перед сном, ощущение «горячей головы при холодных ногах», бруксизм и шум в ушах в 21:00–23:00 указывают на избыток Ян в канале Тройного обогревателя.',
    typicalComplaints: [
      'Трудности засыпания, внутреннее возбуждение и приливы жара в 21:00–23:00',
      'Сжатие челюстей перед сном, напряжение в висках и надплечьях',
      'Шум в ушах и повышенная чувствительность к свету/гаджетам вечером',
    ],
    mmtFocus:
      'Оцените подостную мышцу (тимус/TE), верхнюю трапецию и височную мышцу; проверьте переключение K-27 и ЭМИ-провокацию.',
    searchTokens: ['21:00', '22:00', '23:00', '21-23', 'с 21 до 23', 'перед сном', 'бессонница', 'тройной обогреватель', 'шум в ушах', 'писк', 'звон', 'тиннитус'],
  },
  {
    id: '23-01',
    order: 12,
    startHour: 23,
    endHour: 1,
    hoursLabel: '23:00 – 01:00',
    practicalWindow: '23:00–01:00 (около полуночи)',
    shortLabel: '23–01 · Жёлч. пузырь',
    dayPart: 'Ночь',
    organTitle: 'Жёлчный пузырь и желчеотток (GB)',
    meridianId: 'gallbladder',
    oppositeMeridianId: 'heart',
    organIds: ['gallbladder', 'liver'],
    muscleIds: ['popliteus', 'piriformis', 'tensor-fasciae-latae', 'temporalis'],
    keyAcupointCodes: ['GB-34', 'GB-20', 'GB-43'],
    physiologicalProcess:
      'Ночная эвакуация концентрированной жёлчи, регуляция липидного обмена и запуск глубинного клеточного восстановления тканей.',
    clinicalMeaning:
      'Бодрствование около полуночи, ночные боли в правом боку/под лопаткой, височная головная боль и боль в латеральном бедре с 23:00 до 01:00 говорят о спазме сфинктера Одди и застое в жёлчном пузыре.',
    typicalComplaints: [
      'Тяжесть или распирание в правом подреберье после позднего ужина (23:00–01:00)',
      'Пульсирующая височная головная боль, щелчки и боль в наружной части колена',
      'Неспособность уснуть до часу ночи с ощущением горечи во рту и звоном в ушах',
    ],
    mmtFocus:
      'Тестируйте подколенную мышцу (popliteus), грушевидную и TFL; проверьте проекцию сфинктера Одди и точку GB-34.',
    searchTokens: ['23:00', '00:00', '01:00', 'полночь', '23-01', 'с 23 до 1', 'жёлчный', 'желчный', 'ночью', 'щелчки в колене', 'хруст'],
  },
];

export const CIRCADIAN_MAP: Record<CircadianPeriodId, CircadianSlot> = CIRCADIAN_SLOTS.reduce(
  (acc, slot) => {
    acc[slot.id] = slot;
    return acc;
  },
  {} as Record<CircadianPeriodId, CircadianSlot>
);

/**
 * Распознаёт упоминание времени суток в поисковом запросе (например: "6 до 8", "7:30", "в 2 ночи", "18 часов")
 * и возвращает подходящие ID интервалов биологических часов органов.
 */
export function matchCircadianPeriodsByText(rawQuery: string): CircadianPeriodId[] {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return [];

  const matched = new Set<CircadianPeriodId>();

  // 1. Check explicit token hits
  CIRCADIAN_SLOTS.forEach((slot) => {
    if (slot.searchTokens.some((tok) => q.includes(tok))) {
      matched.add(slot.id);
    }
  });

  // 2. Parse numeric hours like "с 6 до 8", "6-8", "17:30", "в 2 часа"
  const rangeMatch = q.match(/(?:с\s*)?(\d{1,2})(?::\d{2})?\s*(?:-|–|—|до)\s*(\d{1,2})(?::\d{2})?/);
  const singleHourMatch = q.match(/(?:^|\s|в\s*)(\d{1,2})(?::\d{2}|\s*(?:ч|час|утра|вечера|ночи|дня))/);

  const normalizeHour = (h: number): number => {
    let hour = h % 24;
    if (q.includes('вечер') && hour >= 5 && hour <= 11) hour += 12;
    if (q.includes('дня') && hour >= 1 && hour <= 5) hour += 12;
    if ((q.includes('ночи') || q.includes('ночь')) && hour === 12) hour = 0;
    return hour;
  };

  const addForHour = (hour: number) => {
    const h = ((hour % 24) + 24) % 24;
    if (h >= 1 && h < 3) matched.add('01-03');
    if (h >= 3 && h < 5) matched.add('03-05');
    if (h >= 5 && h < 7) matched.add('05-07');
    if (h >= 6 && h < 9) matched.add('06-09');
    if (h >= 9 && h < 11) matched.add('09-11');
    if (h >= 11 && h < 13) matched.add('11-13');
    if (h >= 13 && h < 15) matched.add('13-15');
    if (h >= 15 && h < 17) matched.add('15-17');
    if (h >= 17 && h < 19) matched.add('17-19');
    if (h >= 19 && h < 21) matched.add('19-21');
    if (h >= 21 && h < 23) matched.add('21-23');
    if (h >= 23 || h < 1) matched.add('23-01');
  };

  if (rangeMatch) {
    const start = normalizeHour(Number(rangeMatch[1]));
    const end = normalizeHour(Number(rangeMatch[2]));
    const span = end >= start ? end - start : 24 - start + end;
    for (let step = 0; step <= Math.min(span, 12); step++) {
      addForHour((start + step) % 24);
    }
  } else if (singleHourMatch) {
    addForHour(normalizeHour(Number(singleHourMatch[1])));
  }

  return Array.from(matched);
}
