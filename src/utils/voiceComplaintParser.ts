import {
  BODY_SILHOUETTE_PLATE,
  findNearestMuscles,
  inferBodyViewFromX,
  inferZoneFromCoord,
} from '../data/musclePlateCoords';
import {
  CIRCADIAN_MAP,
  INTAKE_QUESTIONS,
  MUSCLES,
  SYMPTOMS,
  matchCircadianPeriodsByText,
} from '../data';
import {
  CircadianPeriodId,
  ComplaintStageKey,
  PainBodyView,
  PainMapPoint,
  PainMarkerType,
  PatientComplaintEvent,
  SymptomProfile,
} from '../types/atlas';
import { fuzzyMatchScore } from './fuzzySearch';
import { createEntityId } from './patientDatabase';

export type VoiceTargetMode = 'auto' | 'painmap' | 'timeline';

interface RegionTemplate {
  id: string;
  label: string;
  keywords: string[];
  defaultView: PainBodyView;
  anteriorCoord?: { centerX: number; rightX: number; leftX: number; y: number };
  posteriorCoord?: { centerX: number; rightX: number; leftX: number; y: number };
  preferredMuscleIds?: string[];
}

// Anatomical region dictionary calibrated to muscles_front_back.svg (1000 x 871)
// Anterior midline = 250 (viewer's left x < 250 = patient RIGHT; viewer's right x > 250 = patient LEFT)
// Posterior midline = 773 (viewer's left x < 773 = patient LEFT; viewer's right x > 773 = patient RIGHT)
const VOICE_REGION_TEMPLATES: RegionTemplate[] = [
  {
    id: 'tmj',
    label: 'ВНЧС / челюсть',
    keywords: ['внчс', 'челюст', 'жевательн', 'височно-нижнечелюст', 'бруксизм', 'скул'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 250, rightX: 222, leftX: 278, y: 108 },
    preferredMuscleIds: ['masseter', 'lateral-pterygoid'],
  },
  {
    id: 'temple',
    label: 'Висок / ухо',
    keywords: ['висок', 'височн', 'ухо', 'ушах', 'ухе', 'тиннитус', 'шум в ушах', 'писк в ушах'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 250, rightX: 218, leftX: 282, y: 66 },
    preferredMuscleIds: ['temporalis', 'upper-trapezius'],
  },
  {
    id: 'occiput',
    label: 'Затылок / голова сзади',
    keywords: ['затыл', 'подзатылоч', 'субокципитал'],
    defaultView: 'posterior',
    posteriorCoord: { centerX: 773, rightX: 794, leftX: 752, y: 106 },
    preferredMuscleIds: ['suboccipitals'],
  },
  {
    id: 'head',
    label: 'Голова / лоб',
    keywords: ['голов', 'лоб', 'мигрен', 'глаз'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 250, rightX: 230, leftX: 270, y: 58 },
    posteriorCoord: { centerX: 773, rightX: 792, leftX: 754, y: 74 },
    preferredMuscleIds: ['temporalis', 'suboccipitals'],
  },
  {
    id: 'neck',
    label: 'Шея / шейный отдел',
    keywords: ['шея', 'шее', 'шею', 'шейном', 'шейный', 'шейн', 'горл', 'трапеци', 'надплеч'],
    defaultView: 'posterior',
    anteriorCoord: { centerX: 250, rightX: 230, leftX: 270, y: 152 },
    posteriorCoord: { centerX: 773, rightX: 816, leftX: 730, y: 156 },
    preferredMuscleIds: ['upper-trapezius', 'cervical-extensors', 'scm', 'scalenes'],
  },
  {
    id: 'shoulder',
    label: 'Плечо / дельта',
    keywords: ['плеч', 'дельт', 'плечев'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 190, rightX: 148, leftX: 352, y: 214 },
    posteriorCoord: { centerX: 820, rightX: 896, leftX: 650, y: 214 },
    preferredMuscleIds: ['deltoid', 'supraspinatus', 'subscapularis'],
  },
  {
    id: 'scapula',
    label: 'Лопатка / межлопаточная область',
    keywords: ['лопатк', 'между лопат', 'межлопат', 'ромбовид', 'подостн', 'надостн'],
    defaultView: 'posterior',
    posteriorCoord: { centerX: 773, rightX: 816, leftX: 730, y: 234 },
    preferredMuscleIds: ['rhomboids', 'infraspinatus', 'supraspinatus'],
  },
  {
    id: 'elbow',
    label: 'Локоть / предплечье',
    keywords: ['локт', 'локоть', 'локтев', 'предплеч', 'эпикондилит'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 120, rightX: 118, leftX: 382, y: 312 },
    posteriorCoord: { centerX: 890, rightX: 904, leftX: 642, y: 312 },
    preferredMuscleIds: ['brachioradialis', 'biceps-brachii', 'triceps-brachii'],
  },
  {
    id: 'hand',
    label: 'Кисть / запястье / ладонь',
    keywords: ['кист', 'запяст', 'ладон', 'палец руки', 'пальцы рук', 'лучезапяст'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 92, rightX: 92, leftX: 408, y: 396 },
    posteriorCoord: { centerX: 924, rightX: 926, leftX: 620, y: 396 },
    preferredMuscleIds: ['wrist-flexors', 'wrist-extensors'],
  },
  {
    id: 'chest',
    label: 'Грудь / грудина / рёбра',
    keywords: ['груд', 'грудин', 'рёбра', 'ребра', 'ребр', 'межребер', 'сердц', 'ключ'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 250, rightX: 212, leftX: 288, y: 224 },
    posteriorCoord: { centerX: 773, rightX: 810, leftX: 736, y: 268 },
    preferredMuscleIds: ['pectoralis-major-clavicular', 'pectoralis-major-sternal', 'pectoralis-minor'],
  },
  {
    id: 'thoracic-back',
    label: 'Грудной отдел спины',
    keywords: ['грудном отделе', 'грудной отдел', 'спина', 'спине', 'спину', 'широчайш'],
    defaultView: 'posterior',
    posteriorCoord: { centerX: 773, rightX: 814, leftX: 732, y: 296 },
    preferredMuscleIds: ['erector-spinae', 'latissimus-dorsi', 'middle-lower-trapezius'],
  },
  {
    id: 'abdomen',
    label: 'Живот / эпигастрий / подреберье',
    keywords: ['живот', 'эпигастр', 'желуд', 'подребер', 'пупк', 'кишечник', 'подвздошн', 'пресс', 'пах'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 250, rightX: 216, leftX: 284, y: 344 },
    preferredMuscleIds: ['rectus-abdominis', 'obliques-abdominis', 'iliopsoas'],
  },
  {
    id: 'lumbar',
    label: 'Поясница / крестец / КПС',
    keywords: ['поясниц', 'пояснич', 'крестц', 'крестец', 'кпс', 'люмбаг', 'низ спины'],
    defaultView: 'posterior',
    posteriorCoord: { centerX: 773, rightX: 804, leftX: 742, y: 382 },
    anteriorCoord: { centerX: 250, rightX: 220, leftX: 280, y: 425 },
    preferredMuscleIds: ['quadratus-lumborum', 'erector-spinae', 'iliopsoas'],
  },
  {
    id: 'glute',
    label: 'Ягодица / таз / грушевидная',
    keywords: ['ягодиц', 'ягодич', 'грушевид', 'таз', 'тазу', 'ишиас', 'седалищ'],
    defaultView: 'posterior',
    posteriorCoord: { centerX: 773, rightX: 818, leftX: 728, y: 448 },
    anteriorCoord: { centerX: 250, rightX: 185, leftX: 315, y: 458 },
    preferredMuscleIds: ['piriformis', 'gluteus-medius', 'gluteus-maximus'],
  },
  {
    id: 'hip-thigh',
    label: 'Бедро / тазобедренный сустав',
    keywords: ['бедр', 'бедро', 'тазобедрен', 'квадрицепс', 'хамстринг', 'бицепс бедра', 'приводящ'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 212, rightX: 205, leftX: 295, y: 538 },
    posteriorCoord: { centerX: 773, rightX: 816, leftX: 730, y: 550 },
    preferredMuscleIds: ['quadriceps-femoris', 'tensor-fasciae-latae', 'hamstrings'],
  },
  {
    id: 'knee',
    label: 'Колено / коленный сустав',
    keywords: ['колен', 'подколен', 'надколен', 'мениск'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 212, rightX: 208, leftX: 292, y: 634 },
    posteriorCoord: { centerX: 773, rightX: 814, leftX: 732, y: 628 },
    preferredMuscleIds: ['popliteus', 'quadriceps-femoris', 'sartorius'],
  },
  {
    id: 'calf',
    label: 'Голень / икра / ахилл',
    keywords: ['икр', 'икронож', 'ахилл', 'голен', 'камбаловид', 'большеберцов', 'малоберцов'],
    defaultView: 'posterior',
    posteriorCoord: { centerX: 773, rightX: 814, leftX: 732, y: 710 },
    anteriorCoord: { centerX: 212, rightX: 208, leftX: 292, y: 720 },
    preferredMuscleIds: ['gastrocnemius', 'soleus', 'tibialis-anterior'],
  },
  {
    id: 'ankle-foot',
    label: 'Стопа / голеностоп / пятка',
    keywords: ['стоп', 'голеностоп', 'лодыж', 'пятк', 'подошв', 'свод стопы'],
    defaultView: 'anterior',
    anteriorCoord: { centerX: 212, rightX: 208, leftX: 292, y: 808 },
    posteriorCoord: { centerX: 773, rightX: 814, leftX: 732, y: 806 },
    preferredMuscleIds: ['fibularis-peroneus', 'tibialis-posterior', 'tibialis-anterior'],
  },
];

function detectClauseSide(clauseLower: string): 'left' | 'right' | 'center' {
  if (/(слева|лев[аоуые]|по левому|левую|левый|левом)/i.test(clauseLower)) return 'left';
  if (/(справа|прав[аоуые]|по правому|правую|правый|правом)/i.test(clauseLower)) return 'right';
  return 'center';
}

function detectClauseView(clauseLower: string, defaultView: PainBodyView): PainBodyView {
  if (/(спереди|передн|живот|груд|эпигастр|лиц|лоб|челюст|пах)/i.test(clauseLower)) {
    return 'anterior';
  }
  if (/(сзади|задн|спин|поясниц|крестц|ягодиц|лопат|затыл|под коленом|подколен|икр|ахилл|пятк)/i.test(clauseLower)) {
    return 'posterior';
  }
  return defaultView;
}

function detectMarkerType(clauseLower: string): PainMarkerType {
  if (/(триггер|тяж|уплотн|спазм|компресси)/i.test(clauseLower)) {
    return 'trigger_point';
  }
  if (/(слабост|слаб[аоуые]|гипотони|не держит|подламыва)/i.test(clauseLower)) {
    return 'weak_muscle';
  }
  return 'pain';
}

function extractVasIntensity(text: string): number | undefined {
  const lower = text.toLowerCase();
  const explicitMatch =
    lower.match(/(?:ваш|интенсивност\S*|оценк\S*|боль\S*|на)\s*(\d{1,2})\s*(?:из\s*10|\/\s*10|балл\S*)/) ??
    lower.match(/(\d{1,2})\s*(?:из\s*10|\/\s*10|балл\S*)/);
  if (explicitMatch) {
    const n = Number(explicitMatch[1]);
    if (n >= 1 && n <= 10) return n;
  }
  if (/(невыносим|резк|остр|сильн|выражен|жгуч|прострел)/i.test(lower)) return 8;
  if (/(умерен|ноет|ноющ|тянущ|дискомфорт|щелч|хруст)/i.test(lower)) return 5;
  if (/(слабая боль|лёгк|легк|незначительн)/i.test(lower)) return 3;
  return undefined;
}

function detectStage(textLower: string): ComplaintStageKey {
  if (/(сегодня|вчера|остр|впервые|внезапн|прострел|сутки|дня назад|1 день|2 дня)/i.test(textLower)) {
    return 'acute';
  }
  if (/(?:^|[^а-яё])(полгода|год|лет|хроническ\S*|давно|постоянн\S*|месяцами|истощен\S*)(?:$|[^а-яё])/i.test(textLower)) {
    return 'chronic';
  }
  if (/(висцер|орган|желуд|печен|желч|кишечник|поджелудоч|после еды|натощак|месяц)/i.test(textLower)) {
    return 'visceral';
  }
  if (/(отдаёт|отдает|ирради|по ноге|по руке|цеп|недел)/i.test(textLower)) {
    return 'fascial';
  }
  if (/(лучше|восстан|прошло|после коррекции|легче)/i.test(textLower)) {
    return 'recovery';
  }
  return 'subacute';
}

function mapHourToPeriod(hour24: number): CircadianPeriodId {
  const h = ((hour24 % 24) + 24) % 24;
  if (h >= 1 && h < 3) return '01-03';
  if (h >= 3 && h < 5) return '03-05';
  if (h >= 5 && h < 6.5) return '05-07';
  if (h >= 6.5 && h < 9) return '06-09';
  if (h >= 9 && h < 11) return '09-11';
  if (h >= 11 && h < 13) return '11-13';
  if (h >= 13 && h < 15) return '13-15';
  if (h >= 15 && h < 17) return '15-17';
  if (h >= 17 && h < 19) return '17-19';
  if (h >= 19 && h < 21) return '19-21';
  if (h >= 21 && h < 23) return '21-23';
  return '23-01';
}

function detectCircadianHintsPrioritized(textLower: string): CircadianPeriodId[] {
  const explicit: CircadianPeriodId[] = [];

  // 1. Explicit numeric time ranges like "с 6 до 8 утра", "с 21 до 23 часов", "17:00-19:00"
  const rangeMatch = textLower.match(
    /(?:с\s*)?(\d{1,2})(?::\d{2})?\s*(?:-|–|—|до)\s*(\d{1,2})(?::\d{2})?(?:\s*(?:утра|вечера|ночи|дня|час\S*|ч))?/
  );
  if (rangeMatch) {
    let startH = Number(rangeMatch[1]) % 24;
    let endH = Number(rangeMatch[2]) % 24;
    if (textLower.includes('вечер')) {
      if (startH >= 5 && startH <= 11) startH += 12;
      if (endH >= 5 && endH <= 11) endH += 12;
    }
    if (textLower.includes('дня')) {
      if (startH >= 1 && startH <= 5) startH += 12;
      if (endH >= 1 && endH <= 6) endH += 12;
    }
    const span = (endH - startH + 24) % 24;
    const midH = span > 0 && span <= 6 ? (startH + span / 2) % 24 : startH;
    explicit.push(mapHourToPeriod(midH));
  }

  // 2. Spoken day-part context phrases
  if (/(натощак|с 6 до 8|с шести до восьми|в 7 утра|в 8 утра)/i.test(textLower)) explicit.push('06-09');
  if (/(после завтрак|в 10 утра|с 9 до 11)/i.test(textLower)) explicit.push('09-11');
  if (/(после обед|в 14|в 2 часа дня|с 13 до 15)/i.test(textLower)) explicit.push('13-15');
  if (/(к вечеру|после работы|в 18|в 6 вечера|в 5 вечера|с 17 до 19)/i.test(textLower)) explicit.push('17-19');
  if (/(перед сном|вечером поздно|в 22|в 10 вечера|с 21 до 23)/i.test(textLower)) explicit.push('21-23');
  if (/(полночь|около 12 ночи|с 23 до 1)/i.test(textLower)) explicit.push('23-01');
  if (/(среди ночи|в 2 ночи|в 1 ночи|с 1 до 3)/i.test(textLower)) explicit.push('01-03');
  if (/(под утро|в 4 утра|в 3 ночи|с 3 до 5)/i.test(textLower)) explicit.push('03-05');
  if (/(ранним утром|в 5 утра|с 5 до 7)/i.test(textLower)) explicit.push('05-07');

  if (explicit.length > 0) {
    return Array.from(new Set(explicit));
  }

  return matchCircadianPeriodsByText(textLower);
}

const STOP_WORDS = new Set([
  'пациент',
  'жалуется',
  'жалоба',
  'жалобы',
  'боль',
  'болит',
  'справа',
  'слева',
  'утром',
  'вечером',
  'днем',
  'днём',
  'ночью',
  'часов',
  'часа',
  'баллов',
  'балла',
  'очень',
  'сильно',
  'перед',
  'после',
]);

function matchBestSymptom(cleanedText: string, circadianPeriod?: CircadianPeriodId): SymptomProfile | undefined {
  const meaningfulTokens = cleanedText
    .toLowerCase()
    .replace(/[^а-яёa-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  if (meaningfulTokens.length === 0) return undefined;
  const focusedQuery = meaningfulTokens.join(' ');

  let bestSym: SymptomProfile | undefined;
  let bestScore = 0;

  for (const sym of SYMPTOMS) {
    const titleLower = sym.title.toLowerCase();
    const keywordsLower = sym.keywords.map((k) => k.toLowerCase());
    let score = fuzzyMatchScore(focusedQuery, `${sym.title} ${sym.keywords.join(' ')}`, sym.title);

    // Boost exact keyword/phrase stem matches
    for (const kw of keywordsLower) {
      if (kw.length >= 4 && cleanedText.toLowerCase().includes(kw)) {
        score += 45;
      }
    }
    for (const tok of meaningfulTokens) {
      const stem = tok.slice(0, Math.min(tok.length, 5));
      if (titleLower.includes(stem)) score += 30;
    }
    if (circadianPeriod && sym.timeProfile.circadianPeriods.includes(circadianPeriod)) {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSym = sym;
    }
  }

  return bestScore >= 40 ? bestSym : undefined;
}

function resolvePlateXY(
  template: RegionTemplate,
  view: PainBodyView,
  side: 'left' | 'right' | 'center'
): { x: number; y: number } {
  const hasAnt = Boolean(template.anteriorCoord);
  const hasPost = Boolean(template.posteriorCoord);
  const finalView: PainBodyView =
    view === 'anterior' ? (hasAnt ? 'anterior' : 'posterior') : hasPost ? 'posterior' : 'anterior';

  if (finalView === 'anterior' && template.anteriorCoord) {
    const c = template.anteriorCoord;
    const x = side === 'right' ? c.rightX : side === 'left' ? c.leftX : c.centerX;
    return { x, y: c.y };
  }
  if (template.posteriorCoord) {
    const c = template.posteriorCoord;
    const x = side === 'right' ? c.rightX : side === 'left' ? c.leftX : c.centerX;
    return { x, y: c.y };
  }
  return { x: BODY_SILHOUETTE_PLATE.anteriorMidX, y: 340 };
}

export interface ParsedVoiceComplaintResult {
  cleanedText: string;
  chiefComplaint: string;
  intensity: number;
  circadianPeriod?: CircadianPeriodId;
  stage: ComplaintStageKey;
  matchedSymptom?: SymptomProfile;
  painPoints: PainMapPoint[];
  recommendedMuscleIds: string[];
  matchedQuestionIds: string[];
  timelineEvent: Omit<PatientComplaintEvent, 'id' | 'createdAt'>;
}

export function parseVoiceComplaint(rawTranscript: string): ParsedVoiceComplaintResult {
  const cleanedText = rawTranscript.replace(/\s+/g, ' ').trim();
  const lower = cleanedText.toLowerCase();

  const globalIntensity = extractVasIntensity(cleanedText) ?? 6;
  const circadianPeriods = detectCircadianHintsPrioritized(lower);
  const circadianPeriod = circadianPeriods[0];
  const stage = detectStage(lower);
  const matchedSymptom = matchBestSymptom(cleanedText, circadianPeriod);

  // Split transcript into clinical clauses for multi-point Pain Map generation
  const clauses = cleanedText
    .split(/(?:[,.;!?]+|\s+(?:и\s+также|а\s+также|плюс|еще|ещё|и\s+(?=болит|боль|триггер|слабост|тянет|ноет|стреляет|щелк|хруст|шум|писк)))/i)
    .map((c) => c.trim())
    .filter((c) => c.length >= 3);

  const clausesToScan = clauses.length > 0 ? clauses : [cleanedText];
  const painPoints: PainMapPoint[] = [];
  const usedSignatures = new Set<string>();
  const muscleSet = new Set<string>();

  clausesToScan.forEach((clause) => {
    const clauseLower = clause.toLowerCase();
    const clauseSide = detectClauseSide(clauseLower);
    const clauseType = detectMarkerType(clauseLower);
    const clauseVas = extractVasIntensity(clause) ?? globalIntensity;

    const matchedTemplates = VOICE_REGION_TEMPLATES.filter((tpl) =>
      tpl.keywords.some((kw) => clauseLower.includes(kw))
    );

    matchedTemplates.forEach((tpl) => {
      const view = detectClauseView(clauseLower, tpl.defaultView);
      const { x, y } = resolvePlateXY(tpl, view, clauseSide);
      const signature = `${tpl.id}:${view}:${clauseSide}:${clauseType}`;
      if (usedSignatures.has(signature)) return;
      usedSignatures.add(signature);

      const nearest = findNearestMuscles(x, y, MUSCLES, 3).map((m) => m.muscle.id);
      const preferred = (tpl.preferredMuscleIds ?? []).filter((id) =>
        MUSCLES.some((m) => m.id === id)
      );
      const mergedMuscles = Array.from(new Set([...preferred, ...nearest])).slice(0, 4);
      mergedMuscles.forEach((id) => muscleSet.add(id));

      painPoints.push({
        id: createEntityId('pm'),
        type: clauseType,
        view: inferBodyViewFromX(x),
        x,
        y,
        intensity: clauseType === 'weak_muscle' ? undefined : clauseVas,
        zoneId: inferZoneFromCoord(x, y),
        matchedMuscleIds: mergedMuscles,
        primaryMuscleId: mergedMuscles[0],
        note: `Голосовой ввод: ${clause}`,
        createdAt: new Date().toISOString(),
      });
    });
  });

  // Fallback: if no explicit region keyword was spoken, use matchedSymptom zone
  if (painPoints.length === 0 && matchedSymptom) {
    matchedSymptom.mmtPlan.slice(0, 3).forEach((p) => muscleSet.add(p.muscleId));
    const zoneTpl = VOICE_REGION_TEMPLATES.find((tpl) =>
      tpl.preferredMuscleIds?.some((id) => id === matchedSymptom?.mmtPlan[0]?.muscleId)
    );
    if (zoneTpl) {
      const side = detectClauseSide(lower);
      const { x, y } = resolvePlateXY(zoneTpl, zoneTpl.defaultView, side);
      const nearest = findNearestMuscles(x, y, MUSCLES, 3).map((m) => m.muscle.id);
      const mergedMuscles = Array.from(
        new Set([...matchedSymptom.mmtPlan.map((p) => p.muscleId), ...nearest])
      ).slice(0, 4);
      painPoints.push({
        id: createEntityId('pm'),
        type: detectMarkerType(lower),
        view: inferBodyViewFromX(x),
        x,
        y,
        intensity: globalIntensity,
        zoneId: inferZoneFromCoord(x, y),
        matchedMuscleIds: mergedMuscles,
        primaryMuscleId: mergedMuscles[0],
        note: `Голосовой ввод: ${cleanedText}`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (matchedSymptom) {
    matchedSymptom.mmtPlan.forEach((p) => muscleSet.add(p.muscleId));
  }
  if (circadianPeriod && CIRCADIAN_MAP[circadianPeriod]) {
    CIRCADIAN_MAP[circadianPeriod].muscleIds.forEach((id) => muscleSet.add(id));
  }

  // Match up to 2 relevant questionnaire items so live Triad profile updates naturally
  const matchedQuestionIds: string[] = [];
  if (cleanedText.length >= 4) {
    const scoredQs = INTAKE_QUESTIONS.map((q) => ({
      id: q.id,
      score: fuzzyMatchScore(
        cleanedText,
        `${q.question} ${q.clinicalClue} ${q.suggestedCause}`,
        q.question
      ),
    }))
      .filter((x) => x.score >= 42)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    scoredQs.forEach((sq) => matchedQuestionIds.push(sq.id));
  }

  const slot = circadianPeriod ? CIRCADIAN_MAP[circadianPeriod] : undefined;
  const bodyProcessesNoteParts: string[] = [];
  if (slot) {
    bodyProcessesNoteParts.push(
      `Биологические часы (${slot.practicalWindow}): ${slot.organTitle} — ${slot.clinicalMeaning}`
    );
  }
  if (matchedSymptom) {
    bodyProcessesNoteParts.push(`Симптом справочника: ${matchedSymptom.title}`);
  }
  bodyProcessesNoteParts.push(`Диктовка врача: «${cleanedText}»`);

  const chiefComplaint =
    cleanedText.length > 140 ? `${cleanedText.slice(0, 137)}...` : cleanedText;

  return {
    cleanedText,
    chiefComplaint,
    intensity: globalIntensity,
    circadianPeriod,
    stage,
    matchedSymptom,
    painPoints,
    recommendedMuscleIds: Array.from(muscleSet),
    matchedQuestionIds,
    timelineEvent: {
      eventDate: new Date().toISOString().slice(0, 10),
      stage,
      title: chiefComplaint || matchedSymptom?.title || 'Жалоба (голосовой ввод)',
      symptomId: matchedSymptom?.id,
      circadianPeriod,
      intensity: globalIntensity,
      bodyProcessesNote: bodyProcessesNoteParts.join(' · '),
    },
  };
}
