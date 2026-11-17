// Calibrated pixel coordinates for all acupoints on:
// 1. /anatomy/acupuncture_body_chart.jpg (1400 x 1436, Public Domain)
// 2. /anatomy/acupuncture/hand_palmar.png (1280 x 1280, DBCLS TogoTV CC BY 4.0)
// 3. /anatomy/acupuncture/hand_dorsal.png (1280 x 1280, DBCLS TogoTV CC BY 4.0)
// 4. /anatomy/acupuncture/foot_plantar.png (1280 x 1280, DBCLS TogoTV CC BY 4.0)
// 5. /anatomy/acupuncture/foot_dorsal.png (1280 x 1280, DBCLS TogoTV CC BY 4.0)

export const ACUPUNCTURE_PLATE_META = {
  src: '/anatomy/acupuncture_body_chart.jpg',
  width: 1400,
  height: 1436,
  sourceAttribution: 'Wikimedia Commons · Атлас 12 меридианов и акупунктурных точек (Public Domain)',
};

export type DetailPlateId = 'hand-palmar' | 'hand-dorsal' | 'foot-plantar' | 'foot-dorsal';

export interface DetailPlateMeta {
  id: DetailPlateId;
  region: 'hand' | 'foot';
  title: string;
  subtitle: string;
  src: string;
  attribution: string;
  orientationHint: string;
}

export const ACUPUNCTURE_DETAIL_PLATES: Record<DetailPlateId, DetailPlateMeta> = {
  'hand-palmar': {
    id: 'hand-palmar',
    region: 'hand',
    title: 'Ладонь и запястье (ладонная поверхность · Инь)',
    subtitle: 'Меридианы Лёгких (LU), Перикарда (PC) и Сердца (HT)',
    src: '/anatomy/acupuncture/hand_palmar.png',
    attribution: 'DBCLS TogoTV / Wikimedia Commons (CC BY 4.0)',
    orientationHint: 'Большой палец справа · Мизинец слева (правая кисть, ладонная проекция)',
  },
  'hand-dorsal': {
    id: 'hand-dorsal',
    region: 'hand',
    title: 'Тыл кисти (тыльная поверхность · Ян)',
    subtitle: 'Меридианы Толстого кишечника (LI), Тройного обогревателя (TE) и Тонкого кишечника (SI)',
    src: '/anatomy/acupuncture/hand_dorsal.png',
    attribution: 'DBCLS TogoTV / Wikimedia Commons (CC BY 4.0)',
    orientationHint: 'Большой палец слева · Мизинец справа (правая кисть, тыльная проекция)',
  },
  'foot-plantar': {
    id: 'foot-plantar',
    region: 'foot',
    title: 'Подошва и медиальный свод стопы (Инь)',
    subtitle: 'Меридианы Почек (KI) и Селезёнки (SP)',
    src: '/anatomy/acupuncture/foot_plantar.png',
    attribution: 'DBCLS TogoTV / Wikimedia Commons (CC BY 4.0)',
    orientationHint: 'I палец и внутренний свод справа · V палец слева (правая стопа, подошва)',
  },
  'foot-dorsal': {
    id: 'foot-dorsal',
    region: 'foot',
    title: 'Тыл стопы и латеральная лодыжка (Ян / Печень)',
    subtitle: 'Меридианы Желудка (ST), Печени (LR), Жёлчного пузыря (GB) и Мочевого пузыря (BL)',
    src: '/anatomy/acupuncture/foot_dorsal.png',
    attribution: 'DBCLS TogoTV / Wikimedia Commons (CC BY 4.0)',
    orientationHint: 'I палец слева · V палец и наружный край справа (правая стопа, тыл)',
  },
};

export interface DetailPlateCoord {
  plate: DetailPlateId;
  /** Percentage 0..100 */
  xPct: number;
  /** Percentage 0..100 */
  yPct: number;
}

export const ACUPOINT_DETAIL_COORDS: Record<string, DetailPlateCoord> = {
  // ===== HAND: PALMAR (hand_palmar.png) =====
  // Thumb on RIGHT (x~62..74), Middle finger center (x~47), Little finger on LEFT (x~27..41)
  'lu-11': { plate: 'hand-palmar', xPct: 73.5, yPct: 33.5 },
  'lu-10': { plate: 'hand-palmar', xPct: 68.5, yPct: 53.0 },
  'lu-9': { plate: 'hand-palmar', xPct: 56.5, yPct: 73.5 },
  'lu-7': { plate: 'hand-palmar', xPct: 56.5, yPct: 86.0 },
  'pc-9': { plate: 'hand-palmar', xPct: 47.0, yPct: 5.5 },
  'pc-8': { plate: 'hand-palmar', xPct: 52.5, yPct: 49.0 },
  'pc-7': { plate: 'hand-palmar', xPct: 47.5, yPct: 73.0 },
  'pc-6': { plate: 'hand-palmar', xPct: 47.0, yPct: 88.0 },
  'ht-9': { plate: 'hand-palmar', xPct: 27.5, yPct: 27.0 },
  'ht-8': { plate: 'hand-palmar', xPct: 33.5, yPct: 49.0 },
  'ht-7': { plate: 'hand-palmar', xPct: 41.5, yPct: 71.0 },
  'ht-5': { plate: 'hand-palmar', xPct: 41.5, yPct: 82.0 },

  // ===== HAND: DORSAL (hand_dorsal.png) =====
  // Thumb on LEFT (x~27..40), Index (x~41..44), Ring/Little on RIGHT (x~61..74)
  'li-2': { plate: 'hand-dorsal', xPct: 40.5, yPct: 34.0 },
  'li-3': { plate: 'hand-dorsal', xPct: 41.5, yPct: 43.0 },
  'li-4': { plate: 'hand-dorsal', xPct: 37.5, yPct: 49.5 },
  'li-6': { plate: 'hand-dorsal', xPct: 45.5, yPct: 88.0 },
  'te-3': { plate: 'hand-dorsal', xPct: 63.0, yPct: 45.0 },
  'te-5': { plate: 'hand-dorsal', xPct: 57.5, yPct: 87.0 },
  'si-1': { plate: 'hand-dorsal', xPct: 74.5, yPct: 21.0 },
  'si-3': { plate: 'hand-dorsal', xPct: 68.5, yPct: 46.0 },
  'si-4': { plate: 'hand-dorsal', xPct: 64.5, yPct: 65.0 },

  // ===== FOOT: PLANTAR & MEDIAL (foot_plantar.png) =====
  // Big toe & medial border on RIGHT (x~61..66), 2nd/3rd toe cleft (x~49.5)
  'ki-1': { plate: 'foot-plantar', xPct: 49.5, yPct: 34.0 },
  'ki-2': { plate: 'foot-plantar', xPct: 65.0, yPct: 57.0 },
  'ki-3': { plate: 'foot-plantar', xPct: 63.0, yPct: 73.0 },
  'ki-6': { plate: 'foot-plantar', xPct: 63.0, yPct: 78.5 },
  'sp-1': { plate: 'foot-plantar', xPct: 65.5, yPct: 6.5 },
  'sp-2': { plate: 'foot-plantar', xPct: 66.5, yPct: 22.0 },
  'sp-3': { plate: 'foot-plantar', xPct: 65.5, yPct: 31.5 },
  'sp-4': { plate: 'foot-plantar', xPct: 64.5, yPct: 48.5 },

  // ===== FOOT: DORSAL & LATERAL (foot_dorsal.png) =====
  // Big toe on LEFT (x~38.5), 2nd toe (x~48..50), 4th/5th toe on RIGHT (x~60..67)
  'lr-1': { plate: 'foot-dorsal', xPct: 42.0, yPct: 6.0 },
  'lr-2': { plate: 'foot-dorsal', xPct: 44.0, yPct: 21.5 },
  'lr-3': { plate: 'foot-dorsal', xPct: 44.5, yPct: 42.0 },
  'st-45': { plate: 'foot-dorsal', xPct: 50.5, yPct: 6.0 },
  'st-44': { plate: 'foot-dorsal', xPct: 51.5, yPct: 23.0 },
  'st-42': { plate: 'foot-dorsal', xPct: 50.5, yPct: 52.0 },
  'st-41': { plate: 'foot-dorsal', xPct: 46.5, yPct: 72.0 },
  'sp-5': { plate: 'foot-dorsal', xPct: 37.5, yPct: 71.0 },
  'gb-43': { plate: 'foot-dorsal', xPct: 62.0, yPct: 29.0 },
  'gb-41': { plate: 'foot-dorsal', xPct: 60.0, yPct: 46.0 },
  'gb-40': { plate: 'foot-dorsal', xPct: 57.5, yPct: 71.0 },
  'bl-67': { plate: 'foot-dorsal', xPct: 67.0, yPct: 17.0 },
  'bl-65': { plate: 'foot-dorsal', xPct: 64.5, yPct: 37.5 },
  'bl-62': { plate: 'foot-dorsal', xPct: 58.5, yPct: 79.0 },
  'bl-60': { plate: 'foot-dorsal', xPct: 57.5, yPct: 86.0 },
};

export interface AcupointBodyCoord {
  x: number;
  y: number;
  view: 'anterior' | 'posterior';
}

export const ACUPOINT_BODY_COORDS: Record<string, AcupointBodyCoord> = {
  // Меридиан Желудка (ST)
  'st-6': { view: 'anterior', x: 320, y: 185 },
  'st-25': { view: 'anterior', x: 326, y: 608 },
  'st-36': { view: 'anterior', x: 267, y: 1106 },
  'st-40': { view: 'anterior', x: 263, y: 1210 },
  'st-41': { view: 'anterior', x: 315, y: 1356 },
  'st-42': { view: 'anterior', x: 314, y: 1378 },
  'st-45': { view: 'anterior', x: 315, y: 1406 },

  // Меридиан Селезёнки (SP)
  'sp-2': { view: 'anterior', x: 338, y: 1400 },
  'sp-3': { view: 'anterior', x: 336, y: 1392 },
  'sp-4': { view: 'anterior', x: 334, y: 1384 },
  'sp-5': { view: 'anterior', x: 325, y: 1364 },
  'sp-6': { view: 'anterior', x: 318, y: 1296 },

  // Меридиан Печени (LR)
  'lr-2': { view: 'anterior', x: 326, y: 1402 },
  'lr-3': { view: 'anterior', x: 322, y: 1386 },
  'lr-5': { view: 'anterior', x: 318, y: 1246 },
  'lr-8': { view: 'anterior', x: 314, y: 1030 },
  'lr-13': { view: 'anterior', x: 245, y: 550 },
  'lr-14': { view: 'anterior', x: 264, y: 468 },

  // Меридиан Жёлчного пузыря (GB)
  'gb-20': { view: 'posterior', x: 1076, y: 162 },
  'gb-25': { view: 'anterior', x: 252, y: 584 },
  'gb-30': { view: 'posterior', x: 1142, y: 690 },
  'gb-34': { view: 'anterior', x: 244, y: 1074 },
  'gb-38': { view: 'anterior', x: 274, y: 1272 },
  'gb-40': { view: 'anterior', x: 294, y: 1366 },
  'gb-43': { view: 'anterior', x: 298, y: 1402 },

  // Меридиан Лёгких (LU)
  'lu-1': { view: 'anterior', x: 242, y: 292 },
  'lu-5': { view: 'anterior', x: 152, y: 484 },
  'lu-7': { view: 'anterior', x: 92, y: 654 },
  'lu-9': { view: 'anterior', x: 84, y: 678 },

  // Меридиан Толстого кишечника (LI)
  'li-2': { view: 'anterior', x: 56, y: 760 },
  'li-4': { view: 'anterior', x: 68, y: 730 },
  'li-6': { view: 'anterior', x: 112, y: 618 },
  'li-11': { view: 'anterior', x: 138, y: 510 },

  // Меридиан Почек (KI)
  'ki-1': { view: 'posterior', x: 1076, y: 1396 },
  'ki-3': { view: 'posterior', x: 1066, y: 1348 },
  'ki-7': { view: 'posterior', x: 1074, y: 1304 },
  'ki-27': { view: 'anterior', x: 332, y: 266 },

  // Меридиан Мочевого пузыря (BL)
  'bl-13': { view: 'posterior', x: 1072, y: 318 },
  'bl-17': { view: 'posterior', x: 1072, y: 400 },
  'bl-23': { view: 'posterior', x: 1072, y: 538 },
  'bl-40': { view: 'posterior', x: 1094, y: 1038 },
  'bl-60': { view: 'posterior', x: 1094, y: 1344 },
  'bl-65': { view: 'posterior', x: 1104, y: 1378 },
  'bl-67': { view: 'posterior', x: 1110, y: 1396 },

  // Меридиан Тонкого кишечника (SI)
  'si-3': { view: 'posterior', x: 1254, y: 752 },
  'si-4': { view: 'posterior', x: 1244, y: 696 },
  'si-8': { view: 'posterior', x: 1200, y: 506 },

  // Меридиан Перикарда (PC)
  'pc-6': { view: 'anterior', x: 108, y: 645 },
  'pc-7': { view: 'anterior', x: 100, y: 682 },
  'pc-9': { view: 'anterior', x: 68, y: 805 },

  // Меридиан Тройного обогревателя (TE)
  'te-3': { view: 'posterior', x: 1266, y: 742 },
  'te-5': { view: 'posterior', x: 1254, y: 656 },
  'te-10': { view: 'posterior', x: 1218, y: 492 },

  // Меридиан Сердца (HT)
  'ht-5': { view: 'anterior', x: 120, y: 672 },
  'ht-7': { view: 'anterior', x: 118, y: 686 },
  'ht-9': { view: 'anterior', x: 112, y: 792 },

  // Срединные сосуды (CV и GV)
  'cv-4': { view: 'anterior', x: 357, y: 670 },
  'cv-5': { view: 'anterior', x: 357, y: 650 },
  'cv-12': { view: 'anterior', x: 357, y: 520 },
  'cv-14': { view: 'anterior', x: 357, y: 472 },
  'cv-17': { view: 'anterior', x: 357, y: 405 },
  'gv-14': { view: 'posterior', x: 1043, y: 256 },
  'gv-20': { view: 'posterior', x: 1043, y: 52 },

  // Кисти и ладони
  'pc-8': { view: 'anterior', x: 96, y: 745 },
  'ht-8': { view: 'anterior', x: 110, y: 748 },
  'lu-10': { view: 'anterior', x: 82, y: 716 },
  'lu-11': { view: 'anterior', x: 72, y: 754 },
  'li-3': { view: 'anterior', x: 62, y: 742 },
  'si-1': { view: 'posterior', x: 1252, y: 792 },

  // Стопы и подошвы
  'sp-1': { view: 'anterior', x: 342, y: 1408 },
  'lr-1': { view: 'anterior', x: 332, y: 1408 },
  'st-44': { view: 'anterior', x: 318, y: 1394 },
  'gb-41': { view: 'anterior', x: 296, y: 1384 },
  'bl-62': { view: 'posterior', x: 1102, y: 1362 },
  'ki-2': { view: 'posterior', x: 1066, y: 1378 },
  'ki-6': { view: 'posterior', x: 1064, y: 1362 },
};
