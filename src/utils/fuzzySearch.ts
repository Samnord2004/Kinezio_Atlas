const EN_TO_RU_MAP: Record<string, string> = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з',
  '[': 'х', ']': 'ъ', a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л',
  l: 'д', ';': 'ж', "'": 'э', z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь',
  ',': 'б', '.': 'ю',
};

const RU_TO_EN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_RU_MAP).map(([en, ru]) => [ru, en])
);

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[-–—_/,.:;()«»"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function convertEnToRuLayout(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => EN_TO_RU_MAP[ch] ?? ch)
    .join('');
}

export function convertRuToEnLayout(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => RU_TO_EN_MAP[ch] ?? ch)
    .join('');
}

const CLINICAL_SYNONYM_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  ['поясниц', 'спин', 'люмбалг', 'прострел', 'крестец', 'таз', 'подвздошн', 'квадратн'],
  ['шея', 'шей', 'подзатылоч', 'трапец', 'холка', 'гкс', 'цервикал'],
  ['голова', 'головн', 'мигрен', 'висок', 'внчс', 'челюст', 'жевательн', 'бруксизм'],
  ['плечо', 'плечев', 'лопатк', 'дельт', 'надостн', 'подлопаточ', 'рука'],
  ['колено', 'колен', 'бедро', 'бедр', 'четырехглав', 'хамстринг', 'ягодиц', 'грушевид'],
  ['стопа', 'стоп', 'пятк', 'подошв', 'голеностоп', 'ахилл', 'икр', 'большеберц', 'малоберц'],
  ['ладонь', 'ладон', 'кисть', 'кист', 'запяст', 'пальц', 'туннель'],
  ['желудок', 'желудоч', 'гастрит', 'изжог', 'тошнот', 'эпигастр', 'утром', 'кислот'],
  ['печень', 'печен', 'желч', 'подребер', 'гореч', 'детокс', 'ночью'],
  ['почки', 'почек', 'почеч', 'отек', 'мочеточ', 'усталост', 'надпочеч'],
  ['кишечник', 'кишеч', 'живот', 'вздут', 'запор', 'илеоцекал', 'дисбиоз'],
  ['дыхание', 'легкие', 'легк', 'бронх', 'кашел', 'одышк', 'диафрагм', 'ребр'],
  ['сердце', 'серд', 'тахикард', 'грудь', 'грудин', 'перикард'],
  ['стресс', 'тревог', 'нерв', 'психосомат', 'эмоц', 'паник', 'бессонниц', 'срыв'],
  ['нервн', 'рецептор', 'веретен', 'гольджи', 'вегетатив', 'симпат', 'парасимпат', 'соматич', 'синапс', 'стоя', 'сидя', 'лежа'],
  ['тейп', 'тейпир', 'кинезиотейп', 'лент', 'лифтинг', 'аппликац', 'лимфодренаж'],
  ['траст', 'манипуляц', 'хруст', 'hvla', 'блок', 'мобилизац', 'позвонок', 'вправлен'],
  ['нозод', 'ампул', 'провокац', 'паразит', 'грибок', 'кандид', 'вирус', 'бактер', 'металл', 'ртуть', 'токсин', 'аллерг', 'гистамин', 'глютен'],
  ['мудра', 'мудры', 'пальцев', 'ваю', 'гьян', 'сурья', 'притхви', 'апана', 'шунья', 'анджали'],
  ['шум', 'писк', 'звон', 'тиннитус', 'уш', 'ухо', 'ушах', 'свист'],
  ['щелчк', 'щелка', 'хруст', 'заклини', 'подвывих', 'сустав', 'нестабильн'],
  ['локоть', 'локтев', 'предплеч', 'эпикондил', 'лучев'],
  ['голеностоп', 'лодыжк', 'ахилл', 'стоп', 'малоберц'],
];

function boundedLevenshtein(a: string, b: string, maxDist = 2): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let minInRow = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < minInRow) minInRow = curr[j];
    }
    if (minInRow > maxDist) return maxDist + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function scoreSingleToken(token: string, haystackNorm: string, haystackWords: string[]): number {
  if (token.length < 2) {
    return haystackWords.includes(token) ? 3 : 0;
  }

  // 1. Direct substring match
  if (haystackNorm.includes(token)) {
    const wordPrefix = haystackWords.some((w) => w.startsWith(token));
    return wordPrefix ? 40 : 28;
  }

  // 2. Prefix stem match (ignore last 1-2 Russian inflection endings when token >= 4)
  if (token.length >= 4) {
    const stem = token.slice(0, Math.max(3, token.length - 2));
    if (haystackNorm.includes(stem)) return 22;
  }

  // 3. Clinical synonym group expansion
  for (const group of CLINICAL_SYNONYM_GROUPS) {
    const matchesGroup = group.some((stem) => token.includes(stem) || stem.includes(token));
    if (matchesGroup) {
      if (group.some((alt) => haystackNorm.includes(alt))) {
        return 14;
      }
    }
  }

  // 4. Typo tolerance (Levenshtein distance <= 1 for 4..6 chars, <= 2 for >= 7 chars)
  if (token.length >= 4) {
    const maxDist = token.length >= 7 ? 2 : 1;
    for (const w of haystackWords) {
      if (w.length < 3) continue;
      const compareTarget = w.length > token.length + 2 ? w.slice(0, token.length + 1) : w;
      const dist = boundedLevenshtein(token, compareTarget, maxDist);
      if (dist <= maxDist) {
        return dist === 1 ? 16 : 10;
      }
    }
  }

  return 0;
}

/**
 * Intuitive clinical search scorer:
 * - Tolerates typos & Russian inflection endings
 * - Converts accidentally mistyped EN/RU keyboard layouts
 * - Expands everyday patient/doctor phrasing via clinical synonyms
 * Returns 0 if irrelevant, or positive score (>0) sorted by relevance.
 */
export function fuzzyMatchScore(
  rawQuery: string,
  searchableText: string,
  titleText = ''
): number {
  const qNorm = normalizeSearchText(rawQuery);
  if (!qNorm) return 1;

  const titleNorm = normalizeSearchText(titleText);
  const hayNorm = normalizeSearchText(`${titleText} ${searchableText}`);
  const hayWords = hayNorm.split(' ').filter(Boolean);

  const countTitleTokenHits = (tokens: string[]) =>
    tokens.filter((t) => t.length >= 3 && titleNorm.includes(t)).length;

  // Fast exact phrase boosts
  if (titleNorm && titleNorm.includes(qNorm)) {
    return titleNorm.startsWith(qNorm) ? 240 : 200;
  }
  if (hayNorm.includes(qNorm)) {
    const tokens = qNorm.split(' ').filter(Boolean);
    return 150 + countTitleTokenHits(tokens) * 20;
  }

  const candidateQueries = [qNorm];
  const swappedRu = normalizeSearchText(convertEnToRuLayout(rawQuery));
  const swappedEn = normalizeSearchText(convertRuToEnLayout(rawQuery));
  if (swappedRu && swappedRu !== qNorm) candidateQueries.push(swappedRu);
  if (swappedEn && swappedEn !== qNorm) candidateQueries.push(swappedEn);

  let bestScore = 0;

  for (const variant of candidateQueries) {
    const tokens = variant.split(' ').filter(Boolean);
    if (tokens.length === 0) continue;

    let total = 0;
    let matchedCount = 0;
    for (const t of tokens) {
      const s = scoreSingleToken(t, hayNorm, hayWords);
      if (s > 0) {
        matchedCount++;
        total += s;
        if (t.length >= 3 && titleNorm && titleNorm.includes(t)) total += 25;
      }
    }

    // Require all tokens when <= 2 tokens, or at least half rounded up for long conversational queries
    const minNeeded = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.6);
    if (matchedCount >= minNeeded) {
      bestScore = Math.max(bestScore, total);
    }
  }

  return bestScore;
}

export function fuzzyMatches(rawQuery: string, searchableText: string, titleText = ''): boolean {
  return fuzzyMatchScore(rawQuery, searchableText, titleText) > 0;
}
