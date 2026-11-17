import { IntakeDomain, MMTProvocationTag, QuestionnaireItem } from '../types/atlas';

export const INTAKE_DOMAIN_META: Record<
  IntakeDomain,
  { label: string; shortLabel: string; description: string; colorClass: string }
> = {
  structural: {
    label: 'Структура и биомеханика',
    shortLabel: 'Структура',
    description: 'Травмы, осанка, ВНЧС, суставы, перегрузки миофасциальных цепей',
    colorClass: 'text-blue-700',
  },
  visceral: {
    label: 'Висцеральная сфера',
    shortLabel: 'Висцера',
    description: 'ЖКТ, сфинктеры, дыхание, почки, органы малого таза и диафрагмы',
    colorClass: 'text-emerald-700',
  },
  emotional: {
    label: 'Эмоции и стресс',
    shortLabel: 'Эмоции',
    description: 'Психоэмоциональное напряжение, соматизация по У-Син, ЭСР',
    colorClass: 'text-rose-700',
  },
  energetic: {
    label: 'Энергетика и ЭМИ',
    shortLabel: 'Энергия',
    description: 'Переключение К-27, сбой меридианов, истощение, ЭМИ-нагрузка',
    colorClass: 'text-violet-700',
  },
  chemical: {
    label: 'Химия и токсины',
    shortLabel: 'Химия',
    description: 'Ксенобиотики, аллергии, пищевые непереносимости, детокс печени/почек',
    colorClass: 'text-amber-700',
  },
};

export const MMT_PROVOCATION_LABELS: Record<
  MMTProvocationTag,
  { label: string; hint: string }
> = {
  'tl-organ': {
    label: 'ТЛ органа меняет тонус',
    hint: 'Висцеро-моторная связь: первична дисфункция или птоз связанного органа/сфинктера.',
  },
  'tl-esr-frontal': {
    label: 'ТЛ лобных бугров (ЭСР)',
    hint: 'Эмоциональная доминанта: требуется удержание лобных бугров и височное простукивание.',
  },
  'tl-k27-switching': {
    label: 'ТЛ К-27 / Переключение',
    hint: 'Нейрологическая дезорганизация: сначала отработайте KI-27 + пупок и перекрёстный шаг.',
  },
  'tl-diaphragm-breath': {
    label: 'Дыхательная проба / диафрагма',
    hint: 'Тонус зависит от фазы вдоха/выдоха: требуется декомпрессия одной из 5 диафрагм.',
  },
  'chemical-olfactory': {
    label: 'Химическая / ольфакторная проба',
    hint: 'Токсический или пищевой триггер: проверьте НЛ-зоны Чапмена и кофакторы детоксикации.',
  },
  'tl-joint-cranial': {
    label: 'ТЛ сустава / краниума',
    hint: 'Локальная суставная фиксация, торсия КПС/СБС или туннельная компрессия нерва.',
  },
  'nl-nv-reflex': {
    label: 'Реакция на НЛ / НВ точки',
    hint: 'Рефлекторный застой: стимулируйте нейролимфатическую зону (30 с) и НВ Беннетта.',
  },
};

export const INTAKE_QUESTIONS: QuestionnaireItem[] = [
  // === 1. СТРУКТУРА И БИОМЕХАНИКА ===
  {
    id: 'q-str-lumbar-morning',
    domain: 'structural',
    question: 'Есть ли боль, прострелы или утренняя скованность в пояснице / крестце?',
    clinicalClue:
      'Указывает на потерю стабилизации пояснично-тазового кольца, дисфункцию КПС или фасеточных суставов L4–S1.',
    suggestedCause: 'Гипотония подвздошно-поясничной / ягодичных мышц и спазм квадратной мышцы поясницы',
    recommendedMuscleIds: ['iliopsoas', 'quadratus-lumborum', 'gluteus-maximus', 'gluteus-medius'],
    organIds: ['kidneys', 'large-intestine'],
    diaphragmIds: ['pelvic-floor', 'thoracoabdominal'],
    meridianIds: ['kidney', 'bladder'],
  },
  {
    id: 'q-str-tmj-dental',
    domain: 'structural',
    question: 'Отмечаются ли щелчки, хруст в челюсти, бруксизм или недавнее лечение у стоматолога?',
    clinicalClue:
      'Стоматологические вмешательства и окклюзионные нарушения запускают нисходящие постуральные перекосы вплоть до таза.',
    suggestedCause: 'Дисбаланс крыловидных/жевательных мышц, торсия височных костей и СБС',
    recommendedMuscleIds: ['masseter', 'temporalis', 'lateral-pterygoid', 'medial-pterygoid'],
    organIds: ['stomach', 'gallbladder'],
    diaphragmIds: ['cranial-tentorium'],
    meridianIds: ['stomach', 'gallbladder'],
  },
  {
    id: 'q-str-neck-headache',
    domain: 'structural',
    question: 'Беспокоят ли головные боли напряжения, боль в затылке или скованность шеи?',
    clinicalClue:
      'Часто обусловлено блоком краниоцервикального перехода C0–C2, миодуральным мостом и слабостью глубоких сгибателей.',
    suggestedCause: 'Перегрузка подзатылочных и верхней трапеции на фоне слабости глубоких сгибателей шеи',
    recommendedMuscleIds: ['suboccipitals', 'deep-neck-flexors', 'cervical-extensors', 'upper-trapezius'],
    organIds: ['gallbladder', 'sinuses'],
    diaphragmIds: ['cranial-tentorium', 'hyoid-thoracic-inlet'],
    meridianIds: ['gallbladder', 'bladder'],
  },
  {
    id: 'q-str-shoulder-arm',
    domain: 'structural',
    question: 'Есть ли боль в плече при подъёме руки, между лопатками или онемение в пальцах?',
    clinicalClue:
      'Дифференцируйте импинджмент ротаторной манжеты от синдрома верхней грудной апертуры (TOS) и 1-го ребра.',
    suggestedCause: 'Компрессия лестничными/малой грудной мышцами или гипотония ротаторной манжеты',
    recommendedMuscleIds: ['scalenes', 'pectoralis-minor', 'supraspinatus', 'serratus-anterior'],
    organIds: ['lungs', 'liver'],
    diaphragmIds: ['hyoid-thoracic-inlet'],
    meridianIds: ['lung', 'triple-warmer'],
  },
  {
    id: 'q-str-knee-foot',
    domain: 'structural',
    question: 'Бывают ли боли в коленях, судороги в икрах, боли в пятке или подворачивание стопы?',
    clinicalClue:
      'Восходящие дисфункции стопы и колена часто являются первичным драйвером перекоса таза.',
    suggestedCause: 'Несостоятельность свода стопы (задняя большеберцовая) или блокада подколенной мышцы',
    recommendedMuscleIds: ['popliteus', 'tibialis-posterior', 'fibularis-peroneus', 'gastrocnemius'],
    organIds: ['gallbladder', 'urogenital'],
    diaphragmIds: ['plantar-popliteal'],
    meridianIds: ['bladder', 'gallbladder'],
  },

  // === 2. ВИСЦЕРАЛЬНАЯ СФЕРА ===
  {
    id: 'q-vis-stomach-reflux',
    domain: 'visceral',
    question: 'Есть ли тяжесть в эпигастрии, изжога, отрыжка или дискомфорт после еды?',
    clinicalClue:
      'Признак дисфункции желудка, кардии или левого купола грудобрюшной диафрагмы.',
    suggestedCause: 'Висцеро-моторная гипотония ключичной порции ПМЖ, бицепса и плечелучевой мышцы',
    recommendedMuscleIds: ['pectoralis-major-clavicular', 'biceps-brachii', 'brachioradialis'],
    organIds: ['stomach'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['stomach'],
  },
  {
    id: 'q-vis-liver-gb',
    domain: 'visceral',
    question: 'Отмечается ли тяжесть/горечь в правом подреберье или непереносимость жирной пищи?',
    clinicalClue:
      'Спазм сфинктера Одди и перегрузка жёлчного пузыря/печени дают характерные боли в правом плече, шее и колене.',
    suggestedCause: 'Дисфункция печени и жёлчного пузыря (грудинная ПМЖ, ромбовидная, подколенная)',
    recommendedMuscleIds: ['pectoralis-major-sternal', 'rhomboids', 'popliteus'],
    organIds: ['liver', 'gallbladder'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['liver', 'gallbladder'],
  },
  {
    id: 'q-vis-gut-bloating',
    domain: 'visceral',
    question: 'Беспокоит ли вздутие живота, урчание, запоры или чередование стула?',
    clinicalClue:
      'Нарушение моторики тонкого/толстого кишечника и сбой илеоцекального клапана (ИЦК).',
    suggestedCause: 'Гипотония TFL, квадрицепса или прямой мышцы живота из-за висцерального раздражения',
    recommendedMuscleIds: ['tensor-fasciae-latae', 'quadriceps-femoris', 'rectus-abdominis'],
    organIds: ['large-intestine', 'small-intestine'],
    diaphragmIds: ['thoracoabdominal', 'pelvic-floor'],
    meridianIds: ['large-intestine', 'small-intestine'],
  },
  {
    id: 'q-vis-breathing-diaphragm',
    domain: 'visceral',
    question: 'Ощущается ли нехватка глубокого вдоха, скованность в грудной клетке или диафрагме?',
    clinicalClue:
      'Фиксация грудобрюшной диафрагмы нарушает лимфодренаж и синхронность тазового и краниального этажей.',
    suggestedCause: 'Дисфункция диафрагмального каскада и блуждающего/диафрагмального нервов',
    recommendedMuscleIds: ['serratus-anterior', 'pectoralis-minor', 'iliopsoas'],
    organIds: ['lungs', 'heart'],
    diaphragmIds: ['thoracoabdominal', 'hyoid-thoracic-inlet'],
    meridianIds: ['lung', 'conception'],
  },
  {
    id: 'q-vis-pelvic-uro',
    domain: 'visceral',
    question: 'Есть ли отёки, боли внизу живота, частые позывы или слабость тазового дна?',
    clinicalClue:
      'Вовлекает почки, мочеполовую систему и глубокие мышцы тазового кольца.',
    suggestedCause: 'Дисфункция тазовой диафрагмы, почек и внутренней запирательной/грушевидной мышц',
    recommendedMuscleIds: ['pelvic-floor-muscles', 'obturator-internus', 'piriformis', 'hip-adductors'],
    organIds: ['urogenital', 'kidneys'],
    diaphragmIds: ['pelvic-floor'],
    meridianIds: ['kidney', 'bladder'],
  },
  {
    id: 'q-vis-morning-stomach-06-09',
    domain: 'visceral',
    question: 'Появляется ли дискомфорт, тошнота, спазм или тяжесть в животе именно утром с 06:00 до 09:00?',
    clinicalClue:
      'Время 06:00–09:00 (пик 06:00–08:00 / 07:00–09:00) соответствует активности Желудка (ST) и Толстого кишечника (LI 05:00–07:00).',
    suggestedCause: 'Утреннее нарушение функции желудка, кардии или кислотно-перистальтического ритма (ST/LI)',
    recommendedMuscleIds: ['pectoralis-major-clavicular', 'masseter', 'biceps-brachii', 'tensor-fasciae-latae'],
    organIds: ['stomach', 'large-intestine'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['stomach', 'large-intestine'],
  },

  // === 3. ЭМОЦИИ И СТРЕСС ===
  {
    id: 'q-emo-chronic-stress',
    domain: 'emotional',
    question: 'Пребывает ли пациент в длительном стрессе, тревоге, эмоциональном напряжении?',
    clinicalClue:
      'Активирует гипоталамо-надпочечниковую ось и выключает мышцы стресс-адаптации (портняжную, тонкую, камбаловидную).',
    suggestedCause: 'Истощение надпочечников и фиксация эмоциональной доминанты на лобных буграх (ЭСР)',
    recommendedMuscleIds: ['sartorius', 'hip-adductors', 'soleus', 'pectoralis-major-clavicular'],
    organIds: ['stomach', 'heart'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['stomach', 'triple-warmer'],
  },
  {
    id: 'q-emo-throat-chest',
    domain: 'emotional',
    question: 'Возникает ли ощущение «кома в горле», стеснение в груди или невысказанной обиды?',
    clinicalClue:
      'Классическая висцеро-эмоциональная реакция подъязычной зоны, перикарда и меридианов Сердца/Лёгких.',
    suggestedCause: 'Психосоматический блок верхней грудной апертуры, перикарда и подъязычной кости',
    recommendedMuscleIds: ['suprahyoid-infrahyoid', 'subscapularis', 'scm'],
    organIds: ['heart', 'lungs'],
    diaphragmIds: ['hyoid-thoracic-inlet', 'thoracoabdominal'],
    meridianIds: ['heart', 'pericardium', 'conception'],
  },
  {
    id: 'q-emo-anger-sleep',
    domain: 'emotional',
    question: 'Есть ли вспышки раздражения/гнева или ночные пробуждения в 01:00–03:00 (часы Печени)?',
    clinicalClue:
      'Согласно У-Син, подавленный или острый гнев блокирует канал Печени/Жёлчного пузыря и мышцы плечевого пояса/колена.',
    suggestedCause: 'Эмоциональная перегрузка канала Печени (LR) и необходимость височного простукивания',
    recommendedMuscleIds: ['pectoralis-major-sternal', 'rhomboids', 'popliteus'],
    organIds: ['liver', 'gallbladder'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['liver', 'gallbladder'],
  },
  {
    id: 'q-emo-fear-burnout',
    domain: 'emotional',
    question: 'Присутствуют ли глубинные страхи, тревожные предчувствия, эмоциональное выгорание?',
    clinicalClue:
      'Эмоция страха истощает первоэлемент Вода (Почки) и приводит к хронической гипотонии поясничного стабилизатора.',
    suggestedCause: 'Эмоциональное истощение канала Почек (KI) — требуется лобно-затылочная коррекция',
    recommendedMuscleIds: ['iliopsoas', 'upper-trapezius', 'tibialis-posterior'],
    organIds: ['kidneys'],
    diaphragmIds: ['cranial-tentorium', 'pelvic-floor'],
    meridianIds: ['kidney'],
  },

  // === 4. ЭНЕРГЕТИЧЕСКОЕ ВОЗДЕЙСТВИЕ И ЭМИ ===
  {
    id: 'q-ene-switching-focus',
    domain: 'energetic',
    question: 'Отмечается ли рассеянность, путаница лево/право, трудность переключения внимания?',
    clinicalClue:
      'Высокий риск неврологической дезорганизации («Switching»): без коррекции К-27 результаты всех последующих тестов ММТ могут быть ложными.',
    suggestedCause: 'Неврологическое «переключение» (Switching К-27) и межполушарная десинхронизация',
    recommendedMuscleIds: ['supraspinatus', 'scm', 'iliopsoas'],
    organIds: ['kidneys'],
    diaphragmIds: ['hyoid-thoracic-inlet', 'cranial-tentorium'],
    meridianIds: ['kidney', 'governing'],
  },
  {
    id: 'q-ene-emi-gadgets',
    domain: 'energetic',
    question: 'Есть ли усталость при долгой работе за ПК/смартфоном или чувствительность к ЭМИ?',
    clinicalClue:
      'Электромагнитный стресс нагружает тимус (канал Трёх обогревателей) и сбивает поверхностную полярность.',
    suggestedCause: 'ЭМИ-перегрузка, инверсия полярности и слабость меридиана Трёх обогревателей (TE)',
    recommendedMuscleIds: ['infraspinatus', 'supraspinatus', 'middle-lower-trapezius'],
    organIds: ['heart', 'lungs'],
    diaphragmIds: ['hyoid-thoracic-inlet'],
    meridianIds: ['triple-warmer', 'pericardium'],
  },
  {
    id: 'q-ene-energy-dips',
    domain: 'energetic',
    question: 'Бывают ли резкие «провалы энергии» в строго определённые часы суток?',
    clinicalClue:
      'Циркадная связь привязана к 2-часовому пику конкретного меридиана (например, 09–11 Селезёнка, 15–17 Мочевой пузырь, 17–19 Почки).',
    suggestedCause: 'Дисбаланс тока Ци по суточному меридианному кругу (правило «Мать–Сын» / Ло-пункт)',
    recommendedMuscleIds: ['latissimus-dorsi', 'middle-lower-trapezius', 'iliopsoas'],
    organIds: ['pancreas', 'kidneys'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['spleen', 'kidney', 'conception'],
  },
  {
    id: 'q-ene-night-lungs-kidneys-clock',
    domain: 'energetic',
    question: 'Возникают ли пробуждения в 03:00–05:00 (кашель/нехватка воздуха) или резкий спад сил в 17:00–21:00?',
    clinicalClue:
      '03:00–05:00 — максимум меридиана Лёгких (LU); 17:00–19:00 — Почек (KI); 19:00–21:00 — Перикарда (PC).',
    suggestedCause: 'Циркадная перегрузка дыхательного (LU) или почечно-сосудистого (KI/PC) контура',
    recommendedMuscleIds: ['deltoid', 'serratus-anterior', 'iliopsoas', 'piriformis'],
    organIds: ['lungs', 'kidneys', 'heart'],
    diaphragmIds: ['hyoid-thoracic-inlet', 'thoracoabdominal', 'pelvic-floor'],
    meridianIds: ['lung', 'kidney', 'pericardium'],
  },

  // === 5. ХИМИЧЕСКОЕ ВОЗДЕЙСТВИЕ И ТОКСИНЫ ===
  {
    id: 'q-che-chemical-smells',
    domain: 'chemical',
    question: 'Есть ли непереносимость запахов (парфюм, химия), утренний «туман» или приём множества лекарств?',
    clinicalClue:
      'Указывает на перегрузку I и II фаз детоксикации печени и накопление ксенобиотиков.',
    suggestedCause: 'Токсическая / ксенобиотическая нагрузка на печень и желчевыводящие пути',
    recommendedMuscleIds: ['pectoralis-major-sternal', 'rhomboids', 'latissimus-dorsi'],
    organIds: ['liver', 'gallbladder'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['liver', 'gallbladder'],
  },
  {
    id: 'q-che-food-allergy',
    domain: 'chemical',
    question: 'Есть ли аллергии, кожные высыпания или ухудшение самочувствия после конкретных продуктов?',
    clinicalClue:
      'Связь с пищевой непереносимостью (глютен, молочный белок, сахар), гистамином и проницаемостью кишечника.',
    suggestedCause: 'Гистаминовая/пищевая нагрузка, дисбиоз и дисфункция илеоцекального клапана',
    recommendedMuscleIds: ['tensor-fasciae-latae', 'quadriceps-femoris', 'quadratus-lumborum'],
    organIds: ['large-intestine', 'small-intestine', 'pancreas'],
    diaphragmIds: ['thoracoabdominal'],
    meridianIds: ['large-intestine', 'spleen', 'stomach'],
  },
  {
    id: 'q-che-heavy-metals-edema',
    domain: 'chemical',
    question: 'Наблюдаются ли хронические отёки, металлический привкус или контакт с токсинами на работе/в быту?',
    clinicalClue:
      'Требуется оценка ренального клиренса, лимфатических коллекторов и сублингвальный тест антиоксидантов.',
    suggestedCause: 'Нагрузка тяжёлыми металлами/метаболитами и лимфостаз почек/верхней апертуры',
    recommendedMuscleIds: ['iliopsoas', 'soleus', 'tibialis-posterior'],
    organIds: ['kidneys', 'liver'],
    diaphragmIds: ['hyoid-thoracic-inlet', 'pelvic-floor'],
    meridianIds: ['kidney', 'liver'],
  },
];
