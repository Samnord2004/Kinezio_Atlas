import {
  ANATOMICAL_ZONES,
  DIAPHRAGMS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  ORGANS,
  getTriadCorrections,
} from './index';
import {
  ComplaintStageKey,
  Diaphragm,
  Meridian,
  Muscle,
  MyofascialChain,
  Organ,
  SymptomProfile,
} from '../types/atlas';

export interface TimelineProcessItem {
  system:
    | 'Нейромышечная система'
    | 'Миофасциальные цепи и суставы'
    | 'Висцера и лимфодренаж'
    | 'Вегетатика, меридианы и биохимия';
  summary: string;
  mechanism: string;
}

export interface TimelineStageNode {
  key: ComplaintStageKey;
  order: number;
  timeframe: string;
  title: string;
  shortTitle: string;
  clinicalState: string;
  painIndex: number;
  compensationLoad: number;
  systemicLoad: number;
  expectedHoldSec: string;
  processes: TimelineProcessItem[];
  practitionerFocus: string[];
  linkedMuscles: Muscle[];
  linkedOrgans: Organ[];
  linkedDiaphragms: Diaphragm[];
  linkedMeridians: Meridian[];
  linkedChains: MyofascialChain[];
}

export const STAGE_META: Record<
  ComplaintStageKey,
  {
    order: number;
    timeframe: string;
    label: string;
    shortLabel: string;
  }
> = {
  acute: {
    order: 1,
    timeframe: '0–72 ч',
    label: 'Острая ноцицептивная фаза',
    shortLabel: 'Острая (0–72 ч)',
  },
  subacute: {
    order: 2,
    timeframe: '3–14 дней',
    label: 'Рефлекторная гипотония и спазм',
    shortLabel: 'Подострая (3–14 дн)',
  },
  fascial: {
    order: 3,
    timeframe: '2–6 недель',
    label: 'Фасциально-цепная адаптация',
    shortLabel: 'Цепная (2–6 нед)',
  },
  visceral: {
    order: 4,
    timeframe: '1–6 месяцев',
    label: 'Висцеро-вегетативное закрепление',
    shortLabel: 'Висцеральная (1–6 мес)',
  },
  chronic: {
    order: 5,
    timeframe: '6+ месяцев',
    label: 'Системная декомпенсация и истощение',
    shortLabel: 'Хроническая (6+ мес)',
  },
  recovery: {
    order: 6,
    timeframe: 'Коррекция',
    label: 'Реэдукация и восстановление нормотонии',
    shortLabel: 'Коррекция',
  },
};

export function buildClinicalCascadeTimeline(symptom: SymptomProfile): TimelineStageNode[] {
  const zoneName =
    ANATOMICAL_ZONES.find((z) => z.id === symptom.zone)?.name ?? symptom.zone;

  const muscles = symptom.mmtPlan
    .map((p) => MUSCLES.find((m) => m.id === p.muscleId))
    .filter((m): m is Muscle => Boolean(m));

  const primaryHypotonic =
    symptom.mmtPlan.find((p) => p.expectedState.includes('Гипотония')) ??
    symptom.mmtPlan[0];
  const primaryMuscle =
    MUSCLES.find((m) => m.id === primaryHypotonic?.muscleId) ?? muscles[0];

  const hypertonicItem =
    symptom.mmtPlan.find((p) => p.expectedState.includes('Гипертонус')) ??
    symptom.mmtPlan[1];
  const secondaryMuscle =
    MUSCLES.find((m) => m.id === hypertonicItem?.muscleId) ?? muscles[1] ?? primaryMuscle;

  const organs = ORGANS.filter((o) => symptom.organIds.includes(o.id));
  const diaphragms = DIAPHRAGMS.filter((d) => symptom.diaphragmIds.includes(d.id));
  const meridians = MERIDIANS.filter((m) => symptom.meridianIds.includes(m.id));
  const chains = MYOFASCIAL_CHAINS.filter((c) => symptom.chainIds.includes(c.id));

  const biomechanicalCause = symptom.possibleCauses.find((c) => c.category === 'Биомеханическая');
  const visceralCause = symptom.possibleCauses.find((c) => c.category === 'Висцеральная');
  const cranialCause = symptom.possibleCauses.find((c) => c.category === 'Кранио-диафрагмальная');
  const meridianCause = symptom.possibleCauses.find((c) => c.category === 'Меридианно-вегетативная');

  const triad = getTriadCorrections(
    primaryMuscle ? { type: 'muscle', id: primaryMuscle.id } : { type: 'organ', id: organs[0]?.id ?? 'liver' },
    { muscles, organs, meridians }
  );

  const organNames = organs.map((o) => o.name).join(', ') || 'сегментарно связанные органы';
  const diaphragmNames =
    diaphragms.map((d) => d.name.split('(')[0].trim()).join(', ') || 'грудобрюшная и тазовая диафрагмы';
  const chainNames = chains.map((c) => c.name).join(', ') || 'сопряжённые миофасциальные цепи';
  const meridianNames =
    meridians.map((m) => `${m.code} ${m.name}`).join(', ') || 'связанные каналы';
  const nutrientsList = primaryMuscle?.nutrients.slice(0, 3).join(', ') || 'Магний, витамины группы B';

  return [
    {
      key: 'acute',
      order: 1,
      timeframe: '0–72 часа',
      title: 'Острая ноцицептивная реакция и защитное торможение',
      shortTitle: '0–72 ч · Триггер',
      clinicalState:
        'Локальный болевой импульс запускает гамма-мотонейронное торможение целевой мышцы и защитный спазм окружающих тканей.',
      painIndex: 86,
      compensationLoad: 32,
      systemicLoad: 22,
      expectedHoldSec: '0.5–2.0 с (острое рефлекторное выключение)',
      processes: [
        {
          system: 'Нейромышечная система',
          summary: `Острая гипотония: ${primaryMuscle?.name ?? 'индикаторная мышца'}`,
          mechanism:
            primaryHypotonic?.rationale ||
            `Резкое снижение эфферентного ответа в сегменте ${primaryMuscle?.spinalSegment ?? zoneName} из-за ноцицептивного блока.`,
        },
        {
          system: 'Миофасциальные цепи и суставы',
          summary: `Защитное «шинирование» в зоне «${zoneName}»`,
          mechanism:
            'Агонисты и синергисты фиксируют суставно-связочный сегмент, ограничивая амплитуду движения для защиты от микротравмы.',
        },
        {
          system: 'Висцера и лимфодренаж',
          summary: 'Локальный отёк и венозно-лимфатическая реакция',
          mechanism:
            `Повышение проницаемости капилляров; раннее раздражение нейролимфатических зон (${primaryMuscle?.reflexes.neurolymphaticAnterior ?? 'по Чапмену'}).`,
        },
        {
          system: 'Вегетатика, меридианы и биохимия',
          summary: 'Симпатический выброс катехоламинов и простагландинов',
          mechanism:
            'Активация симпато-адреналовой оси повышает болевую чувствительность и усиливает тоническое напряжение кранио-цервикального перехода.',
        },
      ],
      practitionerFocus: [
        'Мягкая терапевтическая локализация (ТЛ) зоны боли без форсированного давления.',
        `Оценка первичного тонуса мышцы «${primaryMuscle?.name ?? 'индикатора'}» и исключение острого воспалительного/травматического блока.`,
        'Щадящий дренаж НЛ-зон и дыхательная разгрузка без грубых суставных манипуляций.',
      ],
      linkedMuscles: muscles.slice(0, 2),
      linkedOrgans: organs.slice(0, 1),
      linkedDiaphragms: diaphragms.slice(0, 1),
      linkedMeridians: [],
      linkedChains: [],
    },
    {
      key: 'subacute',
      order: 2,
      timeframe: '3–14 дней',
      title: 'Дисбаланс антагонистов и формирование триггерных точек',
      shortTitle: '3–14 дн · Адаптация',
      clinicalState:
        'Пока первичная мышца остаётся гипотоничной, синергисты и антагонисты берут нагрузку на себя и уходят в гипертонус с триггерными точками.',
      painIndex: 72,
      compensationLoad: 58,
      systemicLoad: 36,
      expectedHoldSec: '1.5–3.5 с (быстрое утомление при удержании)',
      processes: [
        {
          system: 'Нейромышечная система',
          summary: `Компенсаторный гипертонус: ${secondaryMuscle?.name ?? 'мышцы-синергисты'}`,
          mechanism:
            biomechanicalCause?.mechanism ||
            `Перегрузка антагониста формирует активные миофасциальные триггеры и искажает нормальный двигательный паттерн.`,
        },
        {
          system: 'Миофасциальные цепи и суставы',
          summary: `Укорочение связочно-фасциальных футляров (${chainNames})`,
          mechanism:
            'Коллагеновые волокна фасции перестраиваются вдоль вектора избыточной тяги, снижая скольжение между мышечными слоями.',
        },
        {
          system: 'Висцера и лимфодренаж',
          summary: `Нарастание застоя по НЛ-зонам (${organNames})`,
          mechanism:
            `Застой лимфы в проекции: ${primaryMuscle?.reflexes.neurolymphaticAnterior ?? 'передняя грудная/абдоминальная зона'}.`,
        },
        {
          system: 'Вегетатика, меридианы и биохимия',
          summary: `Локальный расход АТФ, магния и витаминов B (${nutrientsList})`,
          mechanism:
            'Длительно спазмированные волокна переходят на анаэробный гликолиз с накоплением лактата и ионов H+, раздражающих ноцицепторы.',
        },
      ],
      practitionerFocus: [
        symptom.diagnosticMethods[0]
          ? `${symptom.diagnosticMethods[0].method}: ${symptom.diagnosticMethods[0].positiveSign}`
          : 'Проведите двусторонний ММТ с таймером удержания (оцените скорость истощения < 3 сек).',
        'Отдифференцируйте первичную гипотонию от вторичного спазма: сблизьте брюшко гипертоничной мышцы или поработайте с её веретёнами.',
      ],
      linkedMuscles: muscles,
      linkedOrgans: organs.slice(0, 2),
      linkedDiaphragms: diaphragms.slice(0, 1),
      linkedMeridians: meridians.slice(0, 1),
      linkedChains: chains.slice(0, 1),
    },
    {
      key: 'fascial',
      order: 3,
      timeframe: '2–6 недель',
      title: 'Миофасциальный и диафрагмальный перенос напряжения',
      shortTitle: '2–6 нед · Цепи',
      clinicalState:
        'Дисфункция выходит за пределы исходного сегмента: перекос передаётся через миофасциальные поезда и горизонтальные диафрагмы тела.',
      painIndex: 62,
      compensationLoad: 82,
      systemicLoad: 54,
      expectedHoldSec: '2.0–4.5 с (включение синергистов при тесте)',
      processes: [
        {
          system: 'Нейромышечная система',
          summary: 'Рекрутирование дистанционных компенсаторов и шаговый сбой',
          mechanism:
            'Моторная кора переписывает программу стабилизации: при ходьбе или стоянии включаются отдалённые мышцы шеи, таза или голени.',
        },
        {
          system: 'Миофасциальные цепи и суставы',
          summary: `Распространение тяги по цепям: ${chainNames}`,
          mechanism:
            cranialCause?.mechanism ||
            'Асимметрия одной зоны передаётся через фасциальные узлы на соседние регионы (правило сводных братьев Ловетта).',
        },
        {
          system: 'Висцера и лимфодренаж',
          summary: `Асинхронность дыхательного поршня (${diaphragmNames})`,
          mechanism:
            'Ограничение экскурсии диафрагмы ухудшает венозный возврат от таза и печени, поддерживая хроническую отёчность тканей.',
        },
        {
          system: 'Вегетатика, меридианы и биохимия',
          summary: `Перегрузка меридианов (${meridianNames})`,
          mechanism:
            meridianCause?.mechanism ||
            'Начинает проявляться вегетативная реакция в виде колебаний сосудистого тонуса и повышенной утомляемости.',
        },
      ],
      practitionerFocus: [
        'Проверьте соосность диафрагм при задержке вдоха и выдоха во время ММТ.',
        `Оцените состояние всей цепи (${chainNames}) — жалобы могут мигрировать от исходной точки.`,
        'Используйте провокации ТЛ на суставы и диафрагмы для поиска ведущего звена цепи.',
      ],
      linkedMuscles: muscles,
      linkedOrgans: organs,
      linkedDiaphragms: diaphragms,
      linkedMeridians: meridians,
      linkedChains: chains,
    },
    {
      key: 'visceral',
      order: 4,
      timeframe: '1–6 месяцев',
      title: 'Висцеро-моторная фиксация и меридианный дисбаланс',
      shortTitle: '1–6 мес · Висцера',
      clinicalState:
        'Локальная структура подстраивается под натяжение связок внутренних органов; висцеро-моторный рефлекс закрепляет гипотонию мышцы.',
      painIndex: 55,
      compensationLoad: 88,
      systemicLoad: 78,
      expectedHoldSec: '1.5–3.0 с (неустойчивость при ТЛ органа)',
      processes: [
        {
          system: 'Нейромышечная система',
          summary: `Стойкая висцеро-моторная ингибиция (${primaryMuscle?.reflexes.visceromotorLink ?? organNames})`,
          mechanism:
            'Афферентный поток от растянутой или застойной связки органа тормозит мотонейроны ассоциированной скелетной мышцы на уровне спинного мозга.',
        },
        {
          system: 'Миофасциальные цепи и суставы',
          summary: 'Закрепление постуральной торсии (скрученный таз / сколиотическая дуга)',
          mechanism:
            'Тело «уходит» в безболевую позу вокруг проблемного органа, формируя стабильные суставные блоки в позвоночнике.',
        },
        {
          system: 'Висцера и лимфодренаж',
          summary: `Нарушение мобильности и мотильности: ${organNames}`,
          mechanism:
            visceralCause?.mechanism ||
            'Уменьшение физиологического скольжения органа при дыхании усиливает нагрузку на диафрагмы и брыжейку.',
        },
        {
          system: 'Вегетатика, меридианы и биохимия',
          summary: `Эмоционально-энергетический якорь (${triad.emotional.triggerTheme})`,
          mechanism:
            `Снижение циркуляции в каналах ${meridianNames}; формируется связь симптома со стрессом и нарушением детоксикации (${triad.chemical.keyPointsOrNutrients}).`,
        },
      ],
      practitionerFocus: [
        `Проведите висцеральный лифтинг и ТЛ проекции: ${organNames} — оцените мгновенный прирост тонуса в ММТ.`,
        `Примените нейролимфатический массаж (30 с) и удержание НВ-точек Беннетта (${primaryMuscle?.reflexes.neurovascular ?? 'лобные бугры'}).`,
        `Оцените необходимость нутритивной поддержки: ${nutrientsList}.`,
      ],
      linkedMuscles: muscles,
      linkedOrgans: organs,
      linkedDiaphragms: diaphragms,
      linkedMeridians: meridians,
      linkedChains: chains,
    },
    {
      key: 'chronic',
      order: 5,
      timeframe: '6+ месяцев',
      title: 'Системная декомпенсация, свиттинг и краниальное истощение',
      shortTitle: '6+ мес · Истощение',
      clinicalState:
        'Резервы адаптации исчерпаны: формируются перекрёстные жалобы (стопа ↔ таз ↔ ВНЧС), быстрое истощение мышц и дезорганизация нервной системы.',
      painIndex: 68,
      compensationLoad: 95,
      systemicLoad: 92,
      expectedHoldSec: '< 2.0 с (быстрое падение силы, свиттинг)',
      processes: [
        {
          system: 'Нейромышечная система',
          summary: 'Истощение адаптационного резерва и двусторонняя гипотония / свиттинг',
          mechanism:
            'При удержании сокращения сила падает за 1–3 секунды; при ТЛ точек К-27 + пупок выявляется неврологическая дезорганизация.',
        },
        {
          system: 'Миофасциальные цепи и суставы',
          summary: 'Восходяще-нисходящая торсия (краниум ↔ диафрагмы ↔ стопы)',
          mechanism:
            'Фиксируются все этажи компенсации: дисфункция одной зоны поддерживается натяжением твёрдой мозговой оболочки и окклюзией ВНЧС.',
        },
        {
          system: 'Висцера и лимфодренаж',
          summary: 'Системный лимфатический стаз и перегрузка органов детоксикации',
          mechanism:
            'Хроническое раздражение диафрагм и кишечника повышает токсическую и иммунную нагрузку на печень и почки.',
        },
        {
          system: 'Вегетатика, меридианы и биохимия',
          summary: 'Истощение кортизоловой оси, ЭСР-реактивность и дефицит кофакторов',
          mechanism:
            `Актуализируется эмоционально-стрессовая фиксация (${triad.emotional.correctionMethod}) и метаболическое истощение (${triad.chemical.correctionMethod}).`,
        },
      ],
      practitionerFocus: [
        'Обязательно проверьте свиттинг (ТЛ К-27 + пупок) и краниальную твёрдую мозговую оболочку ДО локального релиза.',
        'Определите иерархию приоритета через ТЛ (структура vs висцера vs эмоции vs энергия vs химия).',
        'Работайте поэтапно: не снимайте все компенсаторные зажимы за один визит без восстановления первичных стабилизаторов.',
      ],
      linkedMuscles: muscles,
      linkedOrgans: organs,
      linkedDiaphragms: diaphragms,
      linkedMeridians: meridians,
      linkedChains: chains,
    },
    {
      key: 'recovery',
      order: 6,
      timeframe: 'Этап коррекции',
      title: 'Восстановление нормотонии, ретест и переобучение паттерна',
      shortTitle: 'Коррекция · Ремиссия',
      clinicalState:
        'После устранения первопричины по Триаде здоровья восстанавливается афферентный контроль, исчезает болевой блок и стабилизируется тонус.',
      painIndex: 18,
      compensationLoad: 24,
      systemicLoad: 26,
      expectedHoldSec: '6.0+ с (стойкая нормотония без дрожания)',
      processes: [
        {
          system: 'Нейромышечная система',
          summary: `Восстановление нормотонии «${primaryMuscle?.name ?? 'целевой мышцы'}» при ретесте`,
          mechanism:
            'Мышца мгновенно и плавно удерживает сопротивление ≥ 6 сек без включения синергистов; триггерные точки антагонистов уходят спонтанно.',
        },
        {
          system: 'Миофасциальные цепи и суставы',
          summary: `Синхронизация цепей (${chainNames}) и разгрузка суставов`,
          mechanism:
            'Выравнивается осевая нагрузка; восходящие и нисходящие фасциальные тяги уравновешиваются в шаговом паттерне.',
        },
        {
          system: 'Висцера и лимфодренаж',
          summary: `Свободный дыхательный ход диафрагм и мобильность (${organNames})`,
          mechanism:
            'Восстанавливается физиологический ритм органов и венозно-лимфатический отток без болезненности в точках Чапмена.',
        },
        {
          system: 'Вегетатика, меридианы и биохимия',
          summary: `Балансировка каналов (${meridianNames}) и закрепление метаболизма`,
          mechanism:
            `Переход вегетатики в парасимпатический режим восстановления; адресная поддержка нутриентами (${nutrientsList}).`,
        },
      ],
      practitionerFocus: [
        ...symptom.correctionStrategy,
        'Обязательный финальный ретест ММТ с таймером (цель: удержание ≥ 6 сек и нормализация тонуса в покое и в шаге).',
      ],
      linkedMuscles: muscles,
      linkedOrgans: organs,
      linkedDiaphragms: diaphragms,
      linkedMeridians: meridians,
      linkedChains: chains,
    },
  ];
}
