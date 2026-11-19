import {
  AnatomicalZoneId,
  PostureAngleMetric,
  PostureAssessmentRecord,
  PostureCalibrationLine,
  PostureLandmarkPoint,
  PosturePhase,
  PosturePhotoView,
} from '../types/atlas';

export const POSTURE_VIEW_META: Record<
  PosturePhotoView,
  {
    label: string;
    shortLabel: string;
    laserSetupTip: string;
    additionalMarkers: string[];
  }
> = {
  anterior: {
    label: 'Спереди (фронтальная плоскость)',
    shortLabel: 'Спереди',
    laserSetupTip:
      'Вертикальный луч лазера проходит строго по средней линии стоп (между медиальными лодыжками), пупку и яремной вырезке; горизонтальный луч — через акромионы или ПВПО таза.',
    additionalMarkers: [
      'Яремная вырезка грудины и центр переносицы',
      'Оба акромиально-ключичных сустава (наклейки/маркер)',
      'Передние верхние подвздошные ости (ПВПО / ASIS)',
      'Центры надколенников и бугристости большеберцовых костей',
      'Центры голеностопных суставов (стопы на ширине таза, босиком)',
    ],
  },
  posterior: {
    label: 'Сзади (дорсальная плоскость)',
    shortLabel: 'Сзади',
    laserSetupTip:
      'Вертикальный луч лазера совмещается с серединой межстопной опоры, межъягодичной складкой и остистым отростком C7; горизонтальный — через нижние углы лопаток или ЗВПО.',
    additionalMarkers: [
      'Остистый отросток C7 и Th12/L3 (точечные маркеры)',
      'Нижние углы лопаток (слева и справа)',
      'Задние верхние подвздошные ости (ЗВПО / PSIS, «ямочки Венеры»)',
      'Середины подколенных ямок',
      'Центры ахилловых сухожилий и пяточных бугров (оценка вальгуса стоп)',
    ],
  },
  lateral_left: {
    label: 'Профиль слева (сагиттальная плоскость)',
    shortLabel: 'Профиль Л',
    laserSetupTip:
      'Вертикальный лазерный отвес устанавливается в 1–2 см кпереди от наружной лодыжки; пациент стоит естественно в профиль с опущенными руками.',
    additionalMarkers: [
      'Козелок левого уха (проекция атланто-окципитального сустава)',
      'Центр головки плечевой кости (акромион)',
      'ПВПО и ЗВПО с левой стороны (для расчёта угла наклона таза!)',
      'Большой вертел бедренной кости',
      'Латеральный мыщелок бедра (ось колена) и латеральная лодыжка',
    ],
  },
  lateral_right: {
    label: 'Профиль справа (сагиттальная плоскость)',
    shortLabel: 'Профиль П',
    laserSetupTip:
      'Вертикальный лазерный отвес проходит в 1–2 см кпереди от правой наружной лодыжки; обязателен маркер большого вертела и козелка уха.',
    additionalMarkers: [
      'Козелок правого уха (ориентир краниовертебрального перехода)',
      'Правый акромион (ориентир протракции плечевого пояса)',
      'ПВПО и ЗВПО справа (наклоны таза в сагиттали)',
      'Большой вертел правой бедренной кости',
      'Латеральный мыщелок правого колена и наружная лодыжка',
    ],
  },
};

export const POSTURE_PHASE_META: Record<
  PosturePhase,
  { label: string; badgeClass: string }
> = {
  before: {
    label: 'До коррекции',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  after: {
    label: 'После коррекции',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  followup: {
    label: 'Контроль в динамике',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
};

export const POSTURE_SETUP_GUIDELINES: Array<{ title: string; detail: string }> = [
  {
    title: '1. Фиксация камеры и дистанция',
    detail:
      'Штатив со встроенным пузырьковым/цифровым уровнем на расстоянии 2.5–3.0 м от пациента, объектив строго перпендикулярен стене на высоте таза/солнечного сплетения (минимизирует перспективное искажение конечностей).',
  },
  {
    title: '2. Калибровка перекрёстным лазером',
    detail:
      'Направьте вертикальный луч вдоль отвеса тела и горизонтальный луч через таз/плечи. На фото задайте 2 точки по линии вертикального лазера — система математически компенсирует любой остаточный наклон камеры.',
  },
  {
    title: '3. Дополнительные анатомические ориентиры (метки)',
    detail:
      'Наклейте контрастные круглые стикеры (1–1.5 см) на кожу/одежду в проекциях: козелки ушей, акромионы, C7, нижние углы лопаток, ПВПО (ASIS) и ЗВПО (PSIS), большой вертел, центры надколенников и лодыжки.',
  },
  {
    title: '4. Стандартизация позы и стоп',
    detail:
      'Пациент без обуви и носков на ровном полу, стопы параллельно на ширине таза (10–15 см), взгляд прямо на удалённую точку на уровне глаз, сделать 2–3 спокойных вдоха-выдоха перед снимком.',
  },
];

export function createDefaultCalibration(): PostureCalibrationLine {
  return {
    verticalOffsetDeg: 0,
    plumbX1: 50,
    plumbY1: 6,
    plumbX2: 50,
    plumbY2: 94,
    horizonY: 50,
    aspectRatio: 0.75,
  };
}

export function createDefaultLandmarksForView(
  view: PosturePhotoView
): PostureLandmarkPoint[] {
  switch (view) {
    case 'anterior':
      return [
        { id: 'ear_r', label: 'Козелок / ухо справа пациента (R)', shortLabel: 'Ухо R', x: 44, y: 13 },
        { id: 'ear_l', label: 'Козелок / ухо слева пациента (L)', shortLabel: 'Ухо L', x: 56, y: 13 },
        { id: 'acromion_r', label: 'Акромион справа пациента (R)', shortLabel: 'Плечо R', x: 37, y: 24 },
        { id: 'acromion_l', label: 'Акромион слева пациента (L)', shortLabel: 'Плечо L', x: 63, y: 24 },
        { id: 'asis_r', label: 'ПВПО таза справа (ASIS R)', shortLabel: 'Таз R', x: 43, y: 47 },
        { id: 'asis_l', label: 'ПВПО таза слева (ASIS L)', shortLabel: 'Таз L', x: 57, y: 47 },
        { id: 'knee_r', label: 'Центр надколенника справа (R)', shortLabel: 'Колено R', x: 45, y: 69 },
        { id: 'knee_l', label: 'Центр надколенника слева (L)', shortLabel: 'Колено L', x: 55, y: 69 },
        { id: 'ankle_r', label: 'Голеностоп справа (R)', shortLabel: 'Стопа R', x: 46, y: 90 },
        { id: 'ankle_l', label: 'Голеностоп слева (L)', shortLabel: 'Стопа L', x: 54, y: 90 },
      ];
    case 'posterior':
      return [
        { id: 'occiput_l', label: 'Ухо / сосцевидный отросток слева (L)', shortLabel: 'Голова L', x: 44, y: 13 },
        { id: 'occiput_r', label: 'Ухо / сосцевидный отросток справа (R)', shortLabel: 'Голова R', x: 56, y: 13 },
        { id: 'c7', label: 'Остистый отросток C7', shortLabel: 'C7', x: 50, y: 21 },
        { id: 'scapula_l', label: 'Нижний угол лопатки слева (L)', shortLabel: 'Лопатка L', x: 40, y: 31 },
        { id: 'scapula_r', label: 'Нижний угол лопатки справа (R)', shortLabel: 'Лопатка R', x: 60, y: 31 },
        { id: 'psis_l', label: 'ЗВПО таза слева (PSIS L)', shortLabel: 'ЗВПО L', x: 44, y: 48 },
        { id: 'psis_r', label: 'ЗВПО таза справа (PSIS R)', shortLabel: 'ЗВПО R', x: 56, y: 48 },
        { id: 's1', label: 'Крестец S1 / межъягодичная складка', shortLabel: 'S1', x: 50, y: 51 },
        { id: 'heel_l', label: 'Пятка / центр ахилла слева (L)', shortLabel: 'Пятка L', x: 46, y: 91 },
        { id: 'heel_r', label: 'Пятка / центр ахилла справа (R)', shortLabel: 'Пятка R', x: 54, y: 91 },
      ];
    case 'lateral_left':
    case 'lateral_right': {
      const facingDir = view === 'lateral_left' ? -1 : 1; // left profile usually faces left
      return [
        { id: 'tragus', label: 'Козелок уха (ось головы)', shortLabel: 'Ухо', x: 50 + facingDir * 2, y: 13 },
        { id: 'acromion', label: 'Акромион (плечевой сустав)', shortLabel: 'Плечо', x: 50, y: 24 },
        { id: 'asis_lat', label: 'ПВПО таза (спереди)', shortLabel: 'ПВПО', x: 50 + facingDir * 5, y: 46 },
        { id: 'psis_lat', label: 'ЗВПО таза (сзади)', shortLabel: 'ЗВПО', x: 50 - facingDir * 5, y: 45 },
        { id: 'trochanter', label: 'Большой вертел бедра', shortLabel: 'Вертел', x: 50, y: 49 },
        { id: 'knee_lat', label: 'Латеральный мыщелок колена', shortLabel: 'Колено', x: 50 + facingDir * 1, y: 70 },
        { id: 'malleolus_lat', label: 'Латеральная лодыжка', shortLabel: 'Лодыжка', x: 50, y: 90 },
      ];
    }
  }
}

export function computeLaserVerticalOffsetDeg(
  cal: PostureCalibrationLine,
  aspectRatio = cal.aspectRatio ?? 0.75
): number {
  let dx = (cal.plumbX2 - cal.plumbX1) * aspectRatio;
  let dy = cal.plumbY2 - cal.plumbY1;
  // Normalize direction top -> bottom
  if (dy < 0) {
    dx = -dx;
    dy = -dy;
  }
  if (Math.abs(dy) < 0.001 && Math.abs(dx) < 0.001) return 0;
  // Angle in degrees relative to vertical axis (clockwise positive)
  return Number(((Math.atan2(dx, dy) * 180) / Math.PI).toFixed(2));
}

function getLandmark(
  landmarks: PostureLandmarkPoint[],
  id: string
): PostureLandmarkPoint | undefined {
  return landmarks.find((l) => l.id === id);
}

/** Signed angle of horizontal pair pLeftScreen -> pRightScreen compensated by laser vertical offset */
function calcHorizontalTiltDeg(
  pLeftScreen: PostureLandmarkPoint,
  pRightScreen: PostureLandmarkPoint,
  laserTiltDeg: number,
  aspectRatio: number
): number {
  const dx = (pRightScreen.x - pLeftScreen.x) * aspectRatio;
  const dy = pRightScreen.y - pLeftScreen.y;
  const rawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Positive rawDeg means right-on-screen point is lower (larger y)
  return Number((rawDeg - laserTiltDeg).toFixed(1));
}

/** Signed angle of segment pTop -> pBottom from true vertical (positive = leans right on screen) */
function calcVerticalDeviationDeg(
  pTop: PostureLandmarkPoint,
  pBottom: PostureLandmarkPoint,
  laserTiltDeg: number,
  aspectRatio: number
): number {
  const dx = (pTop.x - pBottom.x) * aspectRatio;
  const dy = pBottom.y - pTop.y;
  if (Math.abs(dy) < 0.01) return 0;
  const rawDeg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return Number((rawDeg - laserTiltDeg).toFixed(1));
}

/** Angle at middle point b formed by a -> b -> c (deviation from 180 straight line) */
function calcThreePointBendDeg(
  a: PostureLandmarkPoint,
  b: PostureLandmarkPoint,
  c: PostureLandmarkPoint,
  aspectRatio: number
): number {
  const v1x = (a.x - b.x) * aspectRatio;
  const v1y = a.y - b.y;
  const v2x = (c.x - b.x) * aspectRatio;
  const v2y = c.y - b.y;
  const cross = v1x * v2y - v1y * v2x;
  const dot = v1x * v2x + v1y * v2y;
  const interior = Math.abs((Math.atan2(cross, dot) * 180) / Math.PI);
  const deviation = Math.max(0, 180 - interior);
  // Signed by cross product sign so valgus vs varus / flexion vs recurvatum is clear
  return Number(((cross >= 0 ? 1 : -1) * deviation).toFixed(1));
}

function classifySeverity(absDeg: number, mildThreshold = 1.5, sigThreshold = 3.5): 'normal' | 'mild' | 'significant' {
  if (absDeg >= sigThreshold) return 'significant';
  if (absDeg >= mildThreshold) return 'mild';
  return 'normal';
}

export function calculatePostureMetrics(
  view: PosturePhotoView,
  landmarks: PostureLandmarkPoint[],
  calibration: PostureCalibrationLine
): {
  laserOffsetDeg: number;
  angles: PostureAngleMetric[];
  summaryVector: string;
  priorityMuscleIds: string[];
} {
  const aspectRatio = calibration.aspectRatio ?? 0.75;
  const laserOffsetDeg = computeLaserVerticalOffsetDeg(calibration, aspectRatio);
  const angles: PostureAngleMetric[] = [];

  if (view === 'anterior') {
    const earR = getLandmark(landmarks, 'ear_r');
    const earL = getLandmark(landmarks, 'ear_l');
    const acrR = getLandmark(landmarks, 'acromion_r');
    const acrL = getLandmark(landmarks, 'acromion_l');
    const asisR = getLandmark(landmarks, 'asis_r');
    const asisL = getLandmark(landmarks, 'asis_l');
    const kneeR = getLandmark(landmarks, 'knee_r');
    const kneeL = getLandmark(landmarks, 'knee_l');
    const ankleR = getLandmark(landmarks, 'ankle_r');
    const ankleL = getLandmark(landmarks, 'ankle_l');

    if (earR && earL) {
      const deg = calcHorizontalTiltDeg(earR, earL, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg);
      const dir =
        absDeg < 1.0
          ? 'Голова симметрична по горизонту'
          : deg > 0
            ? 'Наклон головы влево (левое ухо ниже)'
            : 'Наклон головы вправо (правое ухо ниже)';
      angles.push({
        id: 'head_tilt_front',
        label: 'Наклон головы (козелки / уши)',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection: dir,
        severity: sev,
        targetRegion: 'cervical',
        attentionVector:
          sev === 'normal'
            ? 'КВ-переход уравновешен, удерживайте зрительный контроль.'
            : 'Проверить ГКС (SCM), верхнюю трапецию, лестничные мышцы и атланто-окципитальный сегмент C0–C1; исключить дисфункцию ВНЧС и глазодвигательные рефлексы.',
        recommendedMuscleIds: ['scm', 'upper-trapezius', 'scalenes', 'suboccipitals'],
        recommendedChainIds: ['lateral-line', 'spiral-line'],
      });
    }

    if (acrR && acrL) {
      const deg = calcHorizontalTiltDeg(acrR, acrL, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg);
      const lowSide = deg > 0 ? 'левое' : 'правое';
      const highSide = deg > 0 ? 'правое' : 'левое';
      const dir =
        absDeg < 1.0
          ? 'Надплечья на одном уровне'
          : `${highSide[0].toUpperCase()}${highSide.slice(1)} плечо выше (${lowSide} опущено)`;
      angles.push({
        id: 'shoulder_tilt_front',
        label: 'Перекос линии плеч (акромионы)',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection: dir,
        severity: sev,
        targetRegion: 'upper-limb',
        attentionVector:
          sev === 'normal'
            ? 'Плечевой пояс сбалансирован.'
            : `На стороне поднятого плеча (${highSide}) искать укорочение верхней трапеции и поднимающей лопатку; на опущенной (${lowSide}) — слабость передней зубчатой, средней/нижней трапеции или висцеральную тягу диафрагмы/печени/желудка.`,
        recommendedMuscleIds: [
          'upper-trapezius',
          'levator-scapulae',
          'middle-lower-trapezius',
          'serratus-anterior',
          'pectoralis-minor',
        ],
        recommendedChainIds: ['arm-lines', 'lateral-line'],
      });
    }

    if (asisR && asisL) {
      const deg = calcHorizontalTiltDeg(asisR, asisL, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg, 1.2, 3.0);
      const dir =
        absDeg < 1.0
          ? 'Таз во фронтальной плоскости ровный'
          : deg > 0
            ? 'Перекос таза: левая ПВПО ниже (правый таз поднят)'
            : 'Перекос таза: правая ПВПО ниже (левый таз поднят)';
      angles.push({
        id: 'pelvis_tilt_front',
        label: 'Перекос таза (линия ПВПО / ASIS)',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection: dir,
        severity: sev,
        targetRegion: 'lumbar',
        attentionVector:
          sev === 'normal'
            ? 'Тазовое кольцо во фронте стабильно.'
            : 'Тестировать квадратную мышцу поясницы, среднюю ягодичную, ТФЛ, ППМ (подвздошно-поясничную) и приводящие бедра; оценить функциональную/анатомическую разницу длины ног и блок КПС.',
        recommendedMuscleIds: [
          'quadratus-lumborum',
          'gluteus-medius',
          'tensor-fasciae-latae',
          'iliopsoas',
          'hip-adductors',
        ],
        recommendedChainIds: ['lateral-line', 'deep-front-line'],
      });
    }

    if (asisR && kneeR && ankleR) {
      const bendR = calcThreePointBendDeg(asisR, kneeR, ankleR, aspectRatio);
      const absBend = Math.abs(bendR);
      const sev = classifySeverity(absBend, 3.0, 6.5);
      // On anterior view, kneeR shifted toward midline (x > asisR.x) -> positive cross -> valgus
      const kind = absBend < 2.5 ? 'Ось правой ноги ровная' : bendR < 0 ? 'Вальгус правого колена (завал внутрь)' : 'Варус правого колена (отведение наружу)';
      angles.push({
        id: 'knee_axis_r',
        label: 'Ось правого колена (ПВПО–Колено–Стопа R)',
        angleDeg: bendR,
        absAngleDeg: absBend,
        deviationDirection: kind,
        severity: sev,
        targetRegion: 'lower-limb',
        attentionVector:
          sev === 'normal'
            ? 'Биомеханическая ось правой нижней конечности в пределах нормы.'
            : 'При вальгусе: проверить гипотонию средней ягодичной и задней большеберцовой + гипертонус ТФЛ/приводящих; при варусе: подколенную мышцу и малоберцовую группу.',
        recommendedMuscleIds: [
          'gluteus-medius',
          'tibialis-posterior',
          'tensor-fasciae-latae',
          'popliteus',
          'fibularis-peroneus',
        ],
        recommendedChainIds: ['lateral-line', 'spiral-line'],
      });
    }

    if (asisL && kneeL && ankleL) {
      const bendL = calcThreePointBendDeg(asisL, kneeL, ankleL, aspectRatio);
      const absBend = Math.abs(bendL);
      const sev = classifySeverity(absBend, 3.0, 6.5);
      // For left leg on right side of image, inward valgus shifts kneeL left (x < asisL.x) -> bendL > 0
      const kind = absBend < 2.5 ? 'Ось левой ноги ровная' : bendL > 0 ? 'Вальгус левого колена (завал внутрь)' : 'Варус левого колена (отведение наружу)';
      angles.push({
        id: 'knee_axis_l',
        label: 'Ось левого колена (ПВПО–Колено–Стопа L)',
        angleDeg: bendL,
        absAngleDeg: absBend,
        deviationDirection: kind,
        severity: sev,
        targetRegion: 'lower-limb',
        attentionVector:
          sev === 'normal'
            ? 'Биомеханическая ось левой нижней конечности в норме.'
            : 'Протестировать левые стабилизаторы таза и свода стопы (средняя ягодичная, задняя/передняя большеберцовые, ТФЛ, портняжная).',
        recommendedMuscleIds: [
          'gluteus-medius',
          'tibialis-posterior',
          'tibialis-anterior',
          'sartorius',
        ],
        recommendedChainIds: ['lateral-line', 'deep-front-line'],
      });
    }

    if (acrR && acrL && ankleR && ankleL) {
      const topMid: PostureLandmarkPoint = {
        id: 'top_mid',
        label: 'Середина плеч',
        shortLabel: 'Верх',
        x: (acrR.x + acrL.x) / 2,
        y: (acrR.y + acrL.y) / 2,
      };
      const botMid: PostureLandmarkPoint = {
        id: 'bot_mid',
        label: 'Центр стоп',
        shortLabel: 'Опора',
        x: (ankleR.x + ankleL.x) / 2,
        y: (ankleR.y + ankleL.y) / 2,
      };
      const shiftDeg = calcVerticalDeviationDeg(topMid, botMid, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(shiftDeg);
      const sev = classifySeverity(absDeg, 1.2, 2.5);
      angles.push({
        id: 'plumb_shift_front',
        label: 'Отклонение оси тела от лазерного отвеса',
        angleDeg: shiftDeg,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.0
            ? 'Центр тяжести на линии лазерного отвеса'
            : shiftDeg > 0
              ? 'Смещение верхнего центра масс влево относительно стоп'
              : 'Смещение верхнего центра масс вправо относительно стоп',
        severity: sev,
        targetRegion: 'thoracic',
        attentionVector:
          sev === 'normal'
            ? 'Латеральный баланс тела сохранён.'
            : 'Приоритетно проверить вестибулярно-височный паттерн, диафрагмы (тазовую/грудобрюшную/апертуру), спиральную и латеральную фасциальные цепи.',
        recommendedMuscleIds: ['obliques-abdominis', 'quadratus-lumborum', 'iliopsoas'],
        recommendedChainIds: ['spiral-line', 'lateral-line', 'deep-front-line'],
      });
    }
  } else if (view === 'posterior') {
    const occL = getLandmark(landmarks, 'occiput_l');
    const occR = getLandmark(landmarks, 'occiput_r');
    const c7 = getLandmark(landmarks, 'c7');
    const scapL = getLandmark(landmarks, 'scapula_l');
    const scapR = getLandmark(landmarks, 'scapula_r');
    const psisL = getLandmark(landmarks, 'psis_l');
    const psisR = getLandmark(landmarks, 'psis_r');
    const s1 = getLandmark(landmarks, 's1');
    const heelL = getLandmark(landmarks, 'heel_l');
    const heelR = getLandmark(landmarks, 'heel_r');

    if (occL && occR) {
      const deg = calcHorizontalTiltDeg(occL, occR, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg);
      angles.push({
        id: 'head_tilt_back',
        label: 'Положение головы и подзатылочной области',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.0
            ? 'Затылочная линия горизонтальна'
            : deg > 0
              ? 'Наклон головы вправо (правый сосцевидный отросток ниже)'
              : 'Наклон головы влево (левый сосцевидный отросток ниже)',
        severity: sev,
        targetRegion: 'cervical',
        attentionVector:
          sev === 'normal'
            ? 'Кранио-цервикальный переход сзади симметричен.'
            : 'Оценить подзатылочные мышцы, ременные/разгибатели шеи, ротацию атланта C0–C1 и натяжение твёрдой мозговой оболочки.',
        recommendedMuscleIds: ['suboccipitals', 'cervical-extensors', 'upper-trapezius'],
        recommendedChainIds: ['superficial-back-line'],
      });
    }

    if (scapL && scapR) {
      const deg = calcHorizontalTiltDeg(scapL, scapR, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg);
      angles.push({
        id: 'scapula_tilt_back',
        label: 'Уровень нижних углов лопаток',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.0
            ? 'Лопатки на одном уровне'
            : deg > 0
              ? 'Правая лопатка ниже / левая поднята'
              : 'Левая лопатка ниже / правая поднята',
        severity: sev,
        targetRegion: 'thoracic',
        attentionVector:
          sev === 'normal'
            ? 'Лопаточно-грудной баланс в норме.'
            : 'Проверить ромбовидные, среднюю/нижнюю трапецию, широчайшую мышцу спины, переднюю зубчатую и ротацию грудных позвонков Th3–Th8.',
        recommendedMuscleIds: [
          'rhomboids',
          'middle-lower-trapezius',
          'latissimus-dorsi',
          'serratus-anterior',
        ],
        recommendedChainIds: ['arm-lines', 'functional-lines'],
      });
    }

    if (psisL && psisR) {
      const deg = calcHorizontalTiltDeg(psisL, psisR, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg, 1.2, 3.0);
      angles.push({
        id: 'psis_tilt_back',
        label: 'Уровень ЗВПО таза (КПС сзади)',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.0
            ? 'Задние ости таза (ЗВПО) горизонтальны'
            : deg > 0
              ? 'Правая ЗВПО ниже (скрученный таз / восходящая дисфункция стопы справа)'
              : 'Левая ЗВПО ниже (скрученный таз / восходящая дисфункция стопы слева)',
        severity: sev,
        targetRegion: 'lumbar',
        attentionVector:
          sev === 'normal'
            ? 'Крестцово-подвздошные сочленения визуально ровные.'
            : 'Провести тест Жилле/Флексионный тест стоя и сидя для дифференцировки блока КПС, протестировать грушевидную, большую/среднюю ягодичные и связки таза.',
        recommendedMuscleIds: ['piriformis', 'gluteus-maximus', 'gluteus-medius', 'obturator-internus'],
        recommendedChainIds: ['superficial-back-line', 'spiral-line'],
      });
    }

    if (c7 && s1) {
      const spineDeg = calcVerticalDeviationDeg(c7, s1, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(spineDeg);
      const sev = classifySeverity(absDeg, 1.2, 2.8);
      angles.push({
        id: 'spine_c7_s1_back',
        label: 'Отвес позвоночника C7 → S1 (сколиотический сдвиг)',
        angleDeg: spineDeg,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.0
            ? 'Ось C7–S1 строго совпадает с лазерным отвесом'
            : spineDeg > 0
              ? 'Отклонение оси C7 вправо от линии крестца S1'
              : 'Отклонение оси C7 влево от линии крестца S1',
        severity: sev,
        targetRegion: 'thoracic',
        attentionVector:
          sev === 'normal'
            ? 'Позвоночная вертикаль C7–S1 центрирована.'
            : 'Выявлено боковое смещение туловища: оценить разгибатель позвоночника, квадратную поясницы, висцеро-фасциальную фиксацию и необходимость сегментарной коррекции.',
        recommendedMuscleIds: ['erector-spinae', 'quadratus-lumborum', 'obliques-abdominis'],
        recommendedChainIds: ['spiral-line', 'superficial-back-line'],
      });
    }

    if (heelL && heelR) {
      const deg = calcHorizontalTiltDeg(heelL, heelR, laserOffsetDeg, aspectRatio);
      const absDeg = Math.abs(deg);
      const sev = classifySeverity(absDeg, 1.5, 3.0);
      angles.push({
        id: 'heel_level_back',
        label: 'Уровень и установка пяточных областей',
        angleDeg: deg,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.2
            ? 'Пяточные опоры симметричны'
            : deg > 0
              ? 'Правый пяточный маркер ниже'
              : 'Левый пяточный маркер ниже',
        severity: sev,
        targetRegion: 'lower-limb',
        attentionVector:
          sev === 'normal'
            ? 'Опора стоп сзади симметрична.'
            : 'Проверить таранно-ладьевидный сустав, икроножную/камбаловидную и заднюю большеберцовую мышцы (восходящее влияние на таз и шею).',
        recommendedMuscleIds: ['tibialis-posterior', 'gastrocnemius', 'soleus', 'fibularis-peroneus'],
        recommendedChainIds: ['superficial-back-line', 'deep-front-line'],
      });
    }
  } else {
    // Sagittal views: lateral_left | lateral_right
    const facingDir = view === 'lateral_left' ? -1 : 1; // anterior direction on screen: -1 left, +1 right
    const tragus = getLandmark(landmarks, 'tragus');
    const acromion = getLandmark(landmarks, 'acromion');
    const asisLat = getLandmark(landmarks, 'asis_lat');
    const psisLat = getLandmark(landmarks, 'psis_lat');
    const trochanter = getLandmark(landmarks, 'trochanter');
    const kneeLat = getLandmark(landmarks, 'knee_lat');
    const malleolus = getLandmark(landmarks, 'malleolus_lat');

    if (tragus && acromion) {
      const rawDeg = calcVerticalDeviationDeg(tragus, acromion, laserOffsetDeg, aspectRatio);
      // Forward protrusion has sign matching facingDir
      const forwardSigned = rawDeg * facingDir;
      const absDeg = Math.abs(forwardSigned);
      const sev = classifySeverity(absDeg, 5.0, 12.0);
      angles.push({
        id: 'head_protraction_lat',
        label: 'Протракция головы (козелок → акромион к вертикали)',
        angleDeg: Number(forwardSigned.toFixed(1)),
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 5.0
            ? 'Позиция головы над плечевым поясом физиологична'
            : forwardSigned > 0
              ? `Выдвижение головы вперёд (протракция +${absDeg.toFixed(1)}°)`
              : `Смещение головы кзади (${absDeg.toFixed(1)}°)`,
        severity: sev,
        targetRegion: 'cervical',
        attentionVector:
          sev === 'normal'
            ? 'Сагиттальный баланс шеи сохранён.'
            : 'Характерный паттерн слабости глубоких сгибателей шеи и гипертонуса подзатылочных мышц, ГКС (SCM), малой грудной и жевательных мышц (ВНЧС).',
        recommendedMuscleIds: [
          'deep-neck-flexors',
          'suboccipitals',
          'scm',
          'pectoralis-minor',
          'masseter',
        ],
        recommendedChainIds: ['deep-front-line', 'superficial-front-line'],
      });
    }

    if (acromion && trochanter) {
      const rawDeg = calcVerticalDeviationDeg(acromion, trochanter, laserOffsetDeg, aspectRatio);
      const forwardSigned = rawDeg * facingDir;
      const absDeg = Math.abs(forwardSigned);
      const sev = classifySeverity(absDeg, 2.0, 5.0);
      angles.push({
        id: 'trunk_lean_lat',
        label: 'Сагиттальный наклон туловища (акромион → вертел)',
        angleDeg: Number(forwardSigned.toFixed(1)),
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 2.0
            ? 'Туловище сбалансировано над тазобедренным суставом'
            : forwardSigned > 0
              ? 'Передний наклон / сутулость верхней половины тела'
              : 'Отклонение корпуса назад (sway-back / прогиб)',
        severity: sev,
        targetRegion: 'thoracic',
        attentionVector:
          sev === 'normal'
            ? 'Ось плечо–таз в сагиттали стабильна.'
            : 'Проверить баланс грудобрюшной диафрагмы, прямой мышцы живота, разгибателей спины и малой/большой грудных мышц.',
        recommendedMuscleIds: [
          'pectoralis-major-clavicular',
          'rectus-abdominis',
          'erector-spinae',
          'middle-lower-trapezius',
        ],
        recommendedChainIds: ['superficial-front-line', 'superficial-back-line'],
      });
    }

    if (asisLat && psisLat) {
      // If facing left (-1), front (asis) is left of back (psis)
      const leftPt = facingDir === -1 ? asisLat : psisLat;
      const rightPt = facingDir === -1 ? psisLat : asisLat;
      const rawTilt = calcHorizontalTiltDeg(leftPt, rightPt, laserOffsetDeg, aspectRatio);
      // Anterior tilt means ASIS is LOWER (larger y) than PSIS
      const anteriorTiltDeg = Number(
        (facingDir === -1 ? -rawTilt : rawTilt).toFixed(1)
      );
      const absDeg = Math.abs(anteriorTiltDeg);
      const sev = classifySeverity(absDeg, 8.0, 14.0);
      angles.push({
        id: 'pelvic_sagittal_tilt',
        label: 'Сагиттальный наклон таза (ПВПО → ЗВПО)',
        angleDeg: anteriorTiltDeg,
        absAngleDeg: absDeg,
        deviationDirection:
          anteriorTiltDeg > 10
            ? `Усиленный передний наклон таза (+${anteriorTiltDeg}° · гиперлордоз)`
            : anteriorTiltDeg < 2
              ? `Задний наклон таза / сглаженный лордоз (${anteriorTiltDeg}°)`
              : `Физиологический наклон таза (${anteriorTiltDeg}°)`,
        severity: sev,
        targetRegion: 'lumbar',
        attentionVector:
          anteriorTiltDeg > 10
            ? 'Перегружены ППМ (iliopsoas) и прямая бедра при гипотонии ягодичных и мышц живота (нижний перекрёстный синдром).'
            : anteriorTiltDeg < 2
              ? 'Укорочены хамстринги и прямая живота при слабости подвздошно-поясничной и разгибателей поясницы.'
              : 'Сагиттальная позиция таза оптимальна (норма 4–10°).',
        recommendedMuscleIds:
          anteriorTiltDeg > 10
            ? ['iliopsoas', 'gluteus-maximus', 'rectus-abdominis', 'pelvic-floor-muscles']
            : ['hamstrings', 'iliopsoas', 'erector-spinae', 'quadriceps-femoris'],
        recommendedChainIds: ['deep-front-line', 'superficial-back-line'],
      });
    }

    if (trochanter && kneeLat && malleolus) {
      const bend = calcThreePointBendDeg(trochanter, kneeLat, malleolus, aspectRatio);
      const signedKnee = Number((bend * facingDir).toFixed(1));
      const absDeg = Math.abs(signedKnee);
      const sev = classifySeverity(absDeg, 3.0, 7.0);
      // When knee is shifted posteriorly relative to trochanter-malleolus, it's recurvatum
      const dir =
        absDeg < 3.0
          ? 'Коленный сустав в нейтральном выпрямлении'
          : signedKnee < 0
            ? 'Рекурвация (переразгибание колена назад)'
            : 'Сгибательная установка колена (сдвиг вперёд)';
      angles.push({
        id: 'knee_sagittal_lat',
        label: 'Сагиттальная ось колена (Вертел–Колено–Лодыжка)',
        angleDeg: signedKnee,
        absAngleDeg: absDeg,
        deviationDirection: dir,
        severity: sev,
        targetRegion: 'lower-limb',
        attentionVector:
          sev === 'normal'
            ? 'Колено в сагиттали стабильно.'
            : 'Оценить баланс подколенной мышцы, хамстрингов, четырёхглавой бедра и икроножной/камбаловидной мышц.',
        recommendedMuscleIds: ['popliteus', 'hamstrings', 'quadriceps-femoris', 'gastrocnemius'],
        recommendedChainIds: ['superficial-back-line', 'superficial-front-line'],
      });
    }

    if (tragus && malleolus) {
      const rawDeg = calcVerticalDeviationDeg(tragus, malleolus, laserOffsetDeg, aspectRatio);
      const forwardSigned = Number((rawDeg * facingDir).toFixed(1));
      const absDeg = Math.abs(forwardSigned);
      const sev = classifySeverity(absDeg, 1.5, 3.5);
      angles.push({
        id: 'global_plumb_lat',
        label: 'Глобальный вектор оси тела (Ухо → Лодыжка к лазеру)',
        angleDeg: forwardSigned,
        absAngleDeg: absDeg,
        deviationDirection:
          absDeg < 1.5
            ? 'Глобальная ось тела выровнена по лазерному отвесу'
            : forwardSigned > 0
              ? `Падающий тип осанки вперёд (+${absDeg.toFixed(1)}°)`
              : `Отклонение общего центра тяжести назад (−${absDeg.toFixed(1)}°)`,
        severity: sev,
        targetRegion: 'lower-limb',
        attentionVector:
          sev === 'normal'
            ? 'Глобальное постуральное равновесие в норме.'
            : 'Переднее смещение перегружает заднюю цепь и камбаловидную/икроножную (при гипотонии передней большеберцовой); заднее смещение перегружает переднюю цепь и ППМ.',
        recommendedMuscleIds:
          forwardSigned > 0
            ? ['tibialis-anterior', 'soleus', 'gastrocnemius', 'deep-neck-flexors']
            : ['iliopsoas', 'quadriceps-femoris', 'rectus-abdominis'],
        recommendedChainIds: ['superficial-back-line', 'superficial-front-line', 'deep-front-line'],
      });
    }
  }

  // Deduplicate priority muscles ranked by severity
  const muscleWeight = new Map<string, number>();
  angles.forEach((ang) => {
    const w = ang.severity === 'significant' ? 3 : ang.severity === 'mild' ? 1 : 0;
    if (w === 0) return;
    ang.recommendedMuscleIds.forEach((mId) => {
      muscleWeight.set(mId, (muscleWeight.get(mId) ?? 0) + w);
    });
  });

  const priorityMuscleIds = Array.from(muscleWeight.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 8);

  const significantAngles = angles
    .filter((a) => a.severity !== 'normal')
    .sort((a, b) => b.absAngleDeg - a.absAngleDeg);

  const summaryVector =
    significantAngles.length === 0
      ? 'Значимых угловых отклонений от линии лазерного уровня не выявлено — осанка сбалансирована.'
      : `Ведущие отклонения: ${significantAngles
          .slice(0, 3)
          .map((a) => `${a.deviationDirection} (${a.absAngleDeg.toFixed(1)}°)`)
          .join('; ')}. Вектор внимания врача: ${significantAngles[0].attentionVector}`;

  return {
    laserOffsetDeg,
    angles,
    summaryVector,
    priorityMuscleIds,
  };
}

export interface PostureAngleDeltaRow {
  metricId: string;
  label: string;
  beforeDeg: number;
  afterDeg: number;
  deltaAbsDeg: number; // negative = improvement (closer to 0)
  beforeDirection: string;
  afterDirection: string;
  improved: boolean;
}

export function comparePostureAssessments(
  before: PostureAssessmentRecord,
  after: PostureAssessmentRecord
): PostureAngleDeltaRow[] {
  const rows: PostureAngleDeltaRow[] = [];
  before.angles.forEach((bMetric) => {
    const aMetric = after.angles.find((a) => a.id === bMetric.id);
    if (!aMetric) return;
    // Special handling for sagittal pelvic tilt where physiologic target is ~7 deg rather than 0
    const isSagittalPelvis = bMetric.id === 'pelvic_sagittal_tilt';
    const beforeDist = isSagittalPelvis
      ? Math.abs(bMetric.angleDeg - 7)
      : bMetric.absAngleDeg;
    const afterDist = isSagittalPelvis
      ? Math.abs(aMetric.angleDeg - 7)
      : aMetric.absAngleDeg;
    const delta = Number((afterDist - beforeDist).toFixed(1));
    rows.push({
      metricId: bMetric.id,
      label: bMetric.label,
      beforeDeg: bMetric.angleDeg,
      afterDeg: aMetric.angleDeg,
      deltaAbsDeg: delta,
      beforeDirection: bMetric.deviationDirection,
      afterDirection: aMetric.deviationDirection,
      improved: delta < -0.3,
    });
  });
  return rows;
}
