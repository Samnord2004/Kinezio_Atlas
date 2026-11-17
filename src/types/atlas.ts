export type AnatomicalZoneId =
  | 'head'
  | 'cervical'
  | 'thoracic'
  | 'upper-limb'
  | 'lumbar'
  | 'lower-limb';

export type EntityType =
  | 'muscle'
  | 'organ'
  | 'diaphragm'
  | 'meridian'
  | 'acupoint'
  | 'chain'
  | 'neuro';

export interface SelectedEntity {
  type: EntityType;
  id: string;
}

export type AnatomicalSide = 'anterior' | 'posterior';

export type AnatomicalDivision = 'axial' | 'appendicular';

export interface AnatomicalZoneAspect {
  side: AnatomicalSide;
  shortLabel: string;
  title: string;
  taLatin: string;
  landmarks: string;
  clinicalFocus: string;
}

export interface AnatomicalZone {
  id: AnatomicalZoneId;
  order: number;
  classifierCode: string;
  division: AnatomicalDivision;
  divisionLabel: string;
  name: string;
  shortName: string;
  segments: string;
  description: string;
  biomechanicalFocus: string;
  anteriorAspect: AnatomicalZoneAspect;
  posteriorAspect: AnatomicalZoneAspect;
}

export interface MMTProtocol {
  patientPosition: string;
  practitionerPosition: string;
  testAction: string;
  pressureVector: string;
  stabilization: string;
  commonErrors: string[];
  normotoniaSign: string;
  hypotoniaSign: string;
}

export interface ReflexPoints {
  neurolymphaticAnterior: string;
  neurolymphaticPosterior: string;
  neurovascular: string;
  visceromotorLink: string;
}

export interface CorrectionStep {
  modality:
    | 'Структурная / Миофасциальная'
    | 'Висцеральная остеопатия'
    | 'Краниосакральная'
    | 'Рефлекторная (НЛ / НВ)'
    | 'Меридианная (Акупунктура)'
    | 'Нутритивная поддержка'
    | 'Эмоциональная коррекция (ЭСР)'
    | 'Энергетическая / Меридианная'
    | 'Химическая / Детокс-коррекция';
  title: string;
  technique: string;
  durationOrDose: string;
}

export interface Muscle {
  id: string;
  name: string;
  latinName: string;
  zone: AnatomicalZoneId;
  origin: string;
  insertion: string;
  innervation: string;
  spinalSegment: string;
  function: string;
  mmt: MMTProtocol;
  reflexes: ReflexPoints;
  nutrients: string[];
  organIds: string[];
  diaphragmIds: string[];
  meridianIds: string[];
  correctionSteps: CorrectionStep[];
  clinicalNotes: string;
  svgRegion: {
    view: 'anterior' | 'posterior' | 'both';
    cx: number;
    cy: number;
    labelSide: 'left' | 'right';
  };
  anatomyImage?: {
    src: string;
    caption: string;
    attribution: string;
  };
}

export interface Organ {
  id: string;
  name: string;
  latinName: string;
  zone: AnatomicalZoneId;
  system: string;
  visceralMobility: string;
  visceromotorMechanism: string;
  dysfunctionSigns: string[];
  muscleIds: string[];
  diaphragmIds: string[];
  meridianIds: string[];
  correctionSteps: CorrectionStep[];
  svgCoords: { x: number; y: number };
}

export interface Diaphragm {
  id: string;
  name: string;
  latinName: string;
  level: string;
  zone: AnatomicalZoneId;
  anatomy: string;
  biomechanics: string;
  dysfunctionImpact: string;
  muscleIds: string[];
  organIds: string[];
  meridianIds: string[];
  correctionSteps: CorrectionStep[];
  svgY: number;
}

export type AcupointRole =
  | 'Тонизирующая (Восполнение)'
  | 'Седативная (Рассеивание)'
  | 'Пособник (Юань)'
  | 'Ло-пункт (Связующая)'
  | 'Сигнальная (Мо)'
  | 'Сочувственная (Шу)'
  | 'Противоболевая (Си)'
  | 'Точка-ключ / Общая'
  | (string & {});

export interface Acupoint {
  id: string;
  code: string;
  chineseName: string;
  russianName: string;
  meridianId: string;
  role: AcupointRole;
  localization: string;
  anatomicalLandmark: string;
  depthAndAngle: string;
  balancingEffect: string;
  indications: string[];
  svgCoords: {
    view: 'anterior' | 'posterior';
    x: number;
    y: number;
  };
}

export interface Meridian {
  id: string;
  code: string;
  name: string;
  chineseName: string;
  element: 'Дерево' | 'Огонь' | 'Огонь-Министр' | 'Земля' | 'Металл' | 'Вода' | 'Чудесный сосуд';
  polarity: 'Инь' | 'Ян' | 'Срединный';
  activeHours: string;
  pairedMeridianId?: string;
  pathwaySummary: string;
  excessSymptoms: string[];
  deficiencySymptoms: string[];
  balancingRule: string;
  muscleIds: string[];
  organIds: string[];
  diaphragmIds: string[];
  acupointIds: string[];
  correctionSteps: CorrectionStep[];
}

export interface ClinicalCaseProtocol {
  id: string;
  title: string;
  category:
    | 'Структурно-висцеральный'
    | 'Диафрагмальный каскад'
    | 'Меридианный дисбаланс'
    | 'Кранио-мандибулярный'
    | 'Эмоциональная коррекция'
    | 'Энергетическое воздействие'
    | 'Химическое воздействие';
  primaryFinding: string;
  triggerEntity: SelectedEntity;
  chainSummary: string;
  diagnosticAlgorithm: string[];
  steps: CorrectionStep[];
}

export interface MyofascialChain {
  id: string;
  shortCode: string;
  name: string;
  englishName: string;
  plane: 'Сагиттальная' | 'Фронтальная' | 'Спирально-диагональная' | 'Глубинная осевая' | 'Плечевой пояс';
  biomechanicalRole: string;
  pathwaySegments: string[];
  posturalDysfunctionSigns: string[];
  kinesiologyTestStrategy: string;
  muscleIds: string[];
  organIds: string[];
  diaphragmIds: string[];
  meridianIds: string[];
  correctionSteps: CorrectionStep[];
  color: string;
  imageSrc?: string;
  imageCaption?: string;
  imageAttribution?: string;
  /** Normalized SVG coordinates (0..1000 x 0..871) matching muscles_front_back.svg (left half = anterior, right half = posterior) */
  platePaths: {
    view: 'anterior' | 'posterior';
    points: Array<[number, number]>;
  }[];
}

export interface SymptomCause {
  category:
    | 'Биомеханическая'
    | 'Висцеральная'
    | 'Кранио-диафрагмальная'
    | 'Меридианно-вегетативная';
  title: string;
  mechanism: string;
}

export interface DiagnosticMethod {
  method: string;
  howToPerform: string;
  positiveSign: string;
}

export interface SymptomMMTRecommendation {
  muscleId: string;
  expectedState:
    | 'Гипотония (первичный индикатор)'
    | 'Гипертонус (компенсация)'
    | 'Реактивность при провокации';
  rationale: string;
}

export type CircadianPeriodId =
  | '01-03'
  | '03-05'
  | '05-07'
  | '06-09'
  | '09-11'
  | '11-13'
  | '13-15'
  | '15-17'
  | '17-19'
  | '19-21'
  | '21-23'
  | '23-01';

export interface SymptomTimeProfile {
  peakWindow: string;
  circadianPeriods: CircadianPeriodId[];
  triggerContext: string;
  organClockInterpretation: string;
}

export interface SymptomProfile {
  id: string;
  title: string;
  zone: AnatomicalZoneId;
  keywords: string[];
  timeProfile: SymptomTimeProfile;
  clinicalSummary: string;
  possibleCauses: SymptomCause[];
  diagnosticMethods: DiagnosticMethod[];
  mmtPlan: SymptomMMTRecommendation[];
  organIds: string[];
  diaphragmIds: string[];
  meridianIds: string[];
  chainIds: string[];
  correctionStrategy: string[];
}

export interface TriadCorrectionDomain {
  domain: 'Эмоциональная коррекция' | 'Энергетическое воздействие' | 'Химическое воздействие';
  triggerTheme: string;
  diagnosticProvocation: string;
  correctionMethod: string;
  keyPointsOrNutrients: string;
}

export interface TriadCorrectionBundle {
  emotional: TriadCorrectionDomain;
  energetic: TriadCorrectionDomain;
  chemical: TriadCorrectionDomain;
}

export type IntakeDomain =
  | 'structural'
  | 'visceral'
  | 'emotional'
  | 'energetic'
  | 'chemical';

export type QuestionSeverity = 0 | 1 | 2; // 0 = Нет, 1 = Умеренно / Иногда, 2 = Выраженно / Часто

export interface QuestionnaireItem {
  id: string;
  domain: IntakeDomain;
  question: string;
  clinicalClue: string;
  suggestedCause: string;
  recommendedMuscleIds: string[];
  organIds: string[];
  diaphragmIds: string[];
  meridianIds: string[];
}

export type MMTResultTone = 'untested' | 'normotonia' | 'hypotonia' | 'hypertonia';

export type MMTProvocationTag =
  | 'tl-organ'
  | 'tl-esr-frontal'
  | 'tl-k27-switching'
  | 'tl-diaphragm-breath'
  | 'chemical-olfactory'
  | 'tl-joint-cranial'
  | 'nl-nv-reflex';

export interface MMTSessionRecord {
  muscleId: string;
  leftTone: MMTResultTone;
  rightTone: MMTResultTone;
  holdTimeLeftSec?: number;
  holdTimeRightSec?: number;
  provocations: MMTProvocationTag[];
  correctionApplied: boolean;
  retestNormotonia: boolean;
  notes: string;
}

export type PainMarkerType = 'pain' | 'trigger_point' | 'weak_muscle';

export type PainBodyView = 'anterior' | 'posterior';

export interface PainMapPoint {
  id: string;
  type: PainMarkerType;
  view: PainBodyView;
  /** Normalized coordinates (0..1000 x 0..871) on the front/back anatomical plate */
  x: number;
  y: number;
  /** Pain / tenderness intensity (VAS 1..10) */
  intensity?: number;
  zoneId: AnatomicalZoneId;
  matchedMuscleIds: string[];
  primaryMuscleId?: string;
  note?: string;
  createdAt: string;
}

export type ComplaintStageKey =
  | 'acute'
  | 'subacute'
  | 'fascial'
  | 'visceral'
  | 'chronic'
  | 'recovery';

export interface PatientComplaintEvent {
  id: string;
  eventDate: string;
  stage: ComplaintStageKey;
  title: string;
  symptomId?: string;
  circadianPeriod?: CircadianPeriodId;
  intensity: number;
  bodyProcessesNote?: string;
  createdAt: string;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  birthDate?: string;
  gender?: 'Муж.' | 'Жен.' | 'Не указан';
  phone?: string;
  cardNumber?: string;
  anamnesis?: string;
  painMap?: PainMapPoint[];
  complaintsTimeline?: PatientComplaintEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientVisitRecord {
  id: string;
  patientId: string;
  visitDate: string;
  specialistName: string;
  chiefComplaint: string;
  complaintTimeWindow?: CircadianPeriodId;
  answers: Record<string, QuestionSeverity>;
  muscleQueue: string[];
  mmtRecords: Record<string, MMTSessionRecord>;
  painMap?: PainMapPoint[];
  createdAt: string;
  updatedAt: string;
}

export type MMTVectorArrowType = 'practitioner_pressure' | 'patient_action' | 'stabilization';

export type MMTPositionType = 'supine' | 'prone' | 'side' | 'sitting' | 'standing' | 'custom';

export interface MMTVectorArrow {
  id: string;
  /** Normalized coordinates (0..100%) on the photo/diagram frame */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: MMTVectorArrowType;
  label?: string;
}

export interface MMTCustomPhoto {
  id: string;
  muscleId: string;
  positionType: MMTPositionType;
  positionLabel: string;
  caption: string;
  imageDataUrl: string;
  arrows: MMTVectorArrow[];
  createdAt: string;
  updatedAt: string;
}

export type LearningStageId =
  | 'stage-1-mmt'
  | 'stage-2-muscles'
  | 'stage-3-chains'
  | 'stage-4-visceral'
  | 'stage-5-meridians'
  | 'stage-6-triad'
  | 'stage-7-neuro-posture'
  | 'stage-8-methods-tools'
  | 'stage-9-cranio-patterns';

export type LearningQuestionKind = 'new' | 'review' | 'connection';

export interface LearningVisualAid {
  src: string;
  caption: string;
  attribution: string;
}

export interface LearningLessonSection {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  clinicalRule: string;
  visualAid?: LearningVisualAid;
  atlasLinks?: Array<{
    entity: SelectedEntity;
    label: string;
  }>;
}

export interface LearningMatchPair {
  id: string;
  prevLabel: string;
  currentLabel: string;
  rationale: string;
}

export interface LearningQuestion {
  id: string;
  kind: LearningQuestionKind;
  format: 'single-choice' | 'connection-match';
  /** Which previous stage is reviewed or linked (for 'review' and 'connection' questions) */
  linkedStageNumber?: number;
  linkedStageTitle?: string;
  prompt: string;
  hint?: string;
  /** Used when format === 'single-choice' */
  options?: string[];
  correctOptionIndex?: number;
  /** Used when format === 'connection-match' */
  matchPairs?: LearningMatchPair[];
  explanation: string;
}

export interface LearningStage {
  id: LearningStageId;
  stepNumber: number;
  levelLabel: string;
  title: string;
  subtitle: string;
  bridgeFromPrevious?: string;
  passThresholdPct: number;
  lessons: LearningLessonSection[];
  questions: LearningQuestion[];
}

export interface LearningStageResult {
  scorePct: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  completedAt: string;
}

export interface LearningProgressState {
  unlockedStep: number;
  results: Record<string, LearningStageResult>;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  stageNumber?: number;
  tag: 'Теория ММТ' | 'Клинический случай' | 'Взаимосвязи' | 'Точки и мудры' | 'Общее';
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MudraDomainCategory =
  | 'Структурная'
  | 'Эмоциональная'
  | 'Энергетическая'
  | 'Химическая'
  | 'Висцеральная'
  | 'Балансирующая';

export interface MudraProfile {
  id: string;
  name: string;
  sanskritName: string;
  category: MudraDomainCategory;
  imageSrc: string;
  imageAttribution: string;
  fingerPosition: string;
  diagnosticRole: string;
  mmtDiagnosticSteps: string[];
  positiveDiagnosticSign: string;
  correctionSteps: string[];
  durationAndBreathing: string;
  relatedMuscleIds: string[];
  relatedOrganIds: string[];
  relatedMeridianIds: string[];
  contraindicationsOrNotes: string;
}

export type NosodeCategory =
  | 'Инфекционно-паразитарные'
  | 'Токсины и металлы'
  | 'Пищевые и гистаминовые'
  | 'Метаболические и ферментные'
  | 'Органно-тканевые'
  | 'Иммунно-стрессовые';

export interface NosodeProfile {
  id: string;
  name: string;
  latinOrCode: string;
  category: NosodeCategory;
  potencyRange: string;
  ampouleRole: 'Провокационный нозод (выявляет нагрузку)' | 'Корректор / органопрепарат (тестирует ресурс)';
  imageSrc: string;
  imageAttribution: string;
  purpose: string;
  placementZones: string[];
  mmtDiagnosticSteps: string[];
  positiveTestSign: string;
  neutralizationCheck: string;
  correctionSteps: string[];
  commonErrors: string;
  relatedMuscleIds: string[];
  relatedOrganIds: string[];
  relatedMeridianIds: string[];
  relatedMudraIds: string[];
}

export type TapingCategory =
  | 'Мышечная (поддержка / тонизация)'
  | 'Мышечная (декомпрессия / расслабление)'
  | 'Связочно-суставная'
  | 'Лимфодренажная и фасциальная';

export interface TapingApplicationProfile {
  id: string;
  name: string;
  regionLabel: string;
  category: TapingCategory;
  tensionPercent: string;
  tapeCutForm: string;
  directionRule: string;
  imageSrc: string;
  imageAttribution: string;
  indications: string[];
  applicationSteps: string[];
  mmtVerification: string;
  wearTimeAndRemoval: string;
  contraindications: string;
  relatedMuscleIds: string[];
  relatedChainIds: string[];
}

export type TrustRegionCategory =
  | 'Шейный отдел (C0–C7)'
  | 'Грудной отдел и рёбра'
  | 'Поясничный отдел (L1–L5)'
  | 'Таз и КПС'
  | 'Периферические суставы';

export interface TrustManipulationProfile {
  id: string;
  name: string;
  segmentLevel: string;
  region: TrustRegionCategory;
  imageSrc: string;
  imageAttribution: string;
  biomechanicalIndication: string;
  preScreeningTests: string[];
  patientPosition: string;
  practitionerContacts: string;
  thrustVectorAndBarrier: string;
  mmtRetestCriteria: string;
  redFlagsAndContraindications: string[];
  relatedMuscleIds: string[];
  relatedDiaphragmIds: string[];
}

export type NeuroTopicCategory =
  | 'Нервные окончания (рецепторы)'
  | 'Отделы нервной системы'
  | 'Положения при ММТ (стоя / сидя / лёжа)'
  | 'Диагностика нарушений НС';

export interface NeuroPhysiologyProfile {
  id: string;
  name: string;
  latinOrSubtitle: string;
  category: NeuroTopicCategory;
  imageSrc: string;
  imageAttribution: string;
  physiologicalMechanism: string;
  muscleInteraction: string;
  postureInfluence: string;
  diagnosticAlgorithm: string[];
  positiveDysfunctionSigns: string[];
  correctionSteps: CorrectionStep[];
  relatedMuscleIds: string[];
  relatedDiaphragmIds: string[];
  relatedMeridianIds: string[];
}

export type DirectoryMediaSection =
  | 'mudra'
  | 'nosode'
  | 'taping'
  | 'trust'
  | 'neuro'
  | 'chain'
  | 'protocol'
  | 'tests'
  | 'patterns'
  | 'craniosacral';

export interface DirectoryCustomPhoto {
  id: string;
  section: DirectoryMediaSection;
  itemId: string;
  entryKey: string;
  title: string;
  caption: string;
  imageDataUrl: string;
  arrows: MMTVectorArrow[];
  createdAt: string;
  updatedAt: string;
}

export type DiagnosticTestCategory =
  | 'Ортопедические и сосудистые допуски'
  | 'Кинезиологические рефлексы (Чапмен / Беннетт)'
  | 'Нейродинамика и провокации ММТ'
  | 'Краниосакральные и височные пробы';

export interface DiagnosticTestProfile {
  id: string;
  name: string;
  latinOrAlias: string;
  category: DiagnosticTestCategory;
  targetRegion: string;
  imageSrc: string;
  imageAttribution: string;
  clinicalPurpose: string;
  physiologicalMechanism: string;
  preparationAndPosition: string;
  executionSteps: string[];
  normalResult: string;
  positiveDeviations: string[];
  consequencesIfMissedOrAbnormal: string[];
  commonErrors: string[];
  contraindications: string;
  relatedMuscleIds: string[];
  relatedTrustIds: string[];
  relatedDiaphragmIds: string[];
}

export type MovementPatternCategory =
  | 'Локомоция и глобальная интеграция'
  | 'Плечевой пояс и шея'
  | 'Таз и нижняя конечность'
  | 'Дыхательный паттерн';

export interface MovementPatternProfile {
  id: string;
  name: string;
  subtitle: string;
  category: MovementPatternCategory;
  imageSrc: string;
  imageAttribution: string;
  physiologicalDescription: string;
  recruitmentSequence: string[];
  testingAndMmtCheck: string[];
  dysfunctionSigns: string[];
  biomechanicalConsequences: string[];
  systemicConsequences: string[];
  correctionAndRetraining: string[];
  commonErrors: string[];
  relatedMuscleIds: string[];
  relatedChainIds: string[];
}

export type CraniosacralCategory =
  | 'Сфенобазилярный синхондроз (СБС)'
  | 'Мембраны, швы и ВНЧС'
  | 'Краниосакральная ось и дренаж'
  | 'Нейрокраниальные техники (Височное простукивание / CV-4)';

export interface CraniosacralProfile {
  id: string;
  name: string;
  latinOrSubtitle: string;
  category: CraniosacralCategory;
  imageSrc: string;
  imageAttribution: string;
  anatomicalFocus: string;
  physiologicalMechanism: string;
  diagnosticAssessment: string[];
  dysfunctionSigns: string[];
  clinicalConsequences: string[];
  correctionSteps: CorrectionStep[];
  safetyAndErrors: string[];
  relatedMuscleIds: string[];
  relatedDiaphragmIds: string[];
  relatedMeridianIds: string[];
}

export type EditableDirectorySection =
  | 'muscle'
  | 'chain'
  | 'meridian'
  | 'acupoint'
  | 'organ'
  | 'diaphragm'
  | 'neuro'
  | 'tests'
  | 'patterns'
  | 'protocol'
  | 'mudra'
  | 'nosode'
  | 'taping'
  | 'trust'
  | 'craniosacral';

export interface DirectoryEntryOverride {
  key: string;
  section: EditableDirectorySection;
  itemId: string;
  fields: Record<string, string | string[]>;
  customClinicalNote?: string;
  updatedAt: string;
}

export type DiskFolderRole = 'primary' | 'mirror' | 'backup' | 'cloudSync';

export interface DiskFolderStatus {
  role: DiskFolderRole;
  configured: boolean;
  label: string;
  pathOrName: string;
  permissionGranted: boolean;
  lastSyncedAt?: string;
  backend: 'electron' | 'fs-access' | 'unavailable';
}

export interface BackupFileMeta {
  filename: string;
  sizeBytes?: number;
  modifiedAt: string;
  sourceBackend: 'electron' | 'fs-access';
}

export interface KinezioAtlasExchangePackage {
  format: 'kinezioatlas-exchange';
  schemaVersion: 2;
  appVersion: string;
  sourceMachineId: string;
  sourceMachineLabel: string;
  cloudTarget?: 'yandex' | 'google' | 'file';
  exportedAt: string;
  stats: {
    patients: number;
    visits: number;
    studyNotes: number;
    directoryOverrides: number;
    customPhotos: number;
  };
  data: {
    patients: PatientProfile[];
    visits: PatientVisitRecord[];
    studyNotes: StudyNote[];
    learningProgress: LearningProgressState | null;
    mmtPhotos: MMTCustomPhoto[];
    mmtOverlayArrows: Record<string, MMTVectorArrow[]>;
    directoryPhotos: DirectoryCustomPhoto[];
    directoryOverlayArrows: Record<string, MMTVectorArrow[]>;
    directoryOverrides: Record<string, DirectoryEntryOverride>;
  };
}

export interface SyncMergeReport {
  mode: 'merge' | 'replace';
  sourceMachineLabel: string;
  exportedAt: string;
  patientsAdded: number;
  patientsUpdated: number;
  visitsAdded: number;
  visitsUpdated: number;
  notesAdded: number;
  notesUpdated: number;
  photosAdded: number;
  overridesAdded: number;
  overridesUpdated: number;
  totalPatients: number;
  totalVisits: number;
}

export interface AppVersionManifest {
  version: string;
  releaseDate: string;
  notes: string[];
  dmgUrl?: string;
  zipUrl?: string;
  releasesPageUrl?: string;
}

export interface UpdateCheckResult {
  status: 'up-to-date' | 'sw-ready' | 'remote-available' | 'error';
  currentVersion: string;
  latestVersion: string;
  checkedAt: string;
  releaseDate?: string;
  notes?: string[];
  downloadUrl?: string;
  message: string;
}
