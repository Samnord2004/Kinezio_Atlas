import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CIRCADIAN_MAP,
  CIRCADIAN_SLOTS,
  DIAPHRAGMS,
  INTAKE_DOMAIN_META,
  INTAKE_QUESTIONS,
  MERIDIANS,
  MMT_PROVOCATION_LABELS,
  MUSCLES,
  ORGANS,
  SYMPTOMS,
  getCrossReferences,
  getTriadCorrections,
  matchCircadianPeriodsByText,
} from '../data';
import {
  CircadianPeriodId,
  IntakeDomain,
  MMTProvocationTag,
  MMTResultTone,
  MMTSessionRecord,
  PainMapPoint,
  PatientComplaintEvent,
  PatientProfile,
  PatientVisitRecord,
  QuestionSeverity,
  SelectedEntity,
} from '../types/atlas';
import { MMTSchematicDiagram } from './MMTSchematicDiagram';
import { MMTHoldTimer, classifyHoldFatigue } from './MMTHoldTimer';
import {
  ContextDirectoryTab,
  MMTContextualCorrectionPanel,
} from './MMTContextualCorrectionPanel';
import { PainMapView } from './PainMapView';
import { PAIN_MARKER_META } from '../utils/painMapRecommendations';
import { describeBodySide } from '../data/musclePlateCoords';
import { createEntityId } from '../utils/patientDatabase';
import { STAGE_META } from '../data/complaintTimeline';
import {
  ParsedVoiceComplaintResult,
  VoiceTargetMode,
  parseVoiceComplaint,
} from '../utils/voiceComplaintParser';
import {
  ClinicalExportInput,
  buildClinicalTextReport,
  buildStructuredCorrectionPlan,
  downloadTextReport,
  exportClinicalPdf,
  formatDisplayDate,
} from '../utils/clinicalExport';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  FileDown,
  FileText,
  Lightbulb,
  Mic,
  MicOff,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Square,
  Users,
} from 'lucide-react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface IntakeSessionViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  patients?: PatientProfile[];
  activePatientId?: string | null;
  onSelectPatientId?: (patientId: string | null) => void;
  loadedVisit?: PatientVisitRecord | null;
  sessionResetNonce?: number;
  onSaveVisitToPatient?: (
    visitData: Omit<PatientVisitRecord, 'id' | 'createdAt' | 'updatedAt'>,
    existingVisitId?: string,
    fallbackPatientName?: string
  ) => Promise<PatientVisitRecord | null>;
  onSaveComplaintEvent?: (patientId: string, event: PatientComplaintEvent) => Promise<void>;
  onOpenPatientsTab?: () => void;
  onOpenTimelineTab?: () => void;
  onOpenDirectoryTab?: (tab: ContextDirectoryTab, itemId?: string) => void;
}

type SessionStep = 'questionnaire' | 'painmap' | 'mmt' | 'summary';

const DEFAULT_BASELINE_MUSCLES = [
  'iliopsoas',
  'pectoralis-major-clavicular',
  'pectoralis-major-sternal',
  'piriformis',
  'supraspinatus',
  'masseter',
];

const STORAGE_KEY = 'kinezioatlas_intake_session_v1';

interface PersistedSession {
  patientName: string;
  visitDate: string;
  specialistName: string;
  chiefComplaint: string;
  complaintTimeWindow?: CircadianPeriodId;
  answers: Record<string, QuestionSeverity>;
  muscleQueue: string[];
  mmtRecords: Record<string, MMTSessionRecord>;
  painMap?: PainMapPoint[];
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyRecord(muscleId: string): MMTSessionRecord {
  return {
    muscleId,
    leftTone: 'untested',
    rightTone: 'untested',
    provocations: [],
    correctionApplied: false,
    retestNormotonia: false,
    notes: '',
  };
}

export const IntakeSessionView: React.FC<IntakeSessionViewProps> = ({
  onOpenInAtlas,
  patients = [],
  activePatientId = null,
  onSelectPatientId,
  loadedVisit = null,
  sessionResetNonce = 0,
  onSaveVisitToPatient,
  onSaveComplaintEvent,
  onOpenPatientsTab,
  onOpenTimelineTab,
  onOpenDirectoryTab,
}) => {
  const [step, setStep] = useState<SessionStep>('questionnaire');
  const [domainFilter, setDomainFilter] = useState<IntakeDomain | 'all'>('all');
  const [patientName, setPatientName] = useState('');
  const [visitDate, setVisitDate] = useState<string>(getTodayIso);
  const [specialistName, setSpecialistName] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [complaintTimeWindow, setComplaintTimeWindow] = useState<CircadianPeriodId | ''>('');
  const [answers, setAnswers] = useState<Record<string, QuestionSeverity>>({});
  const [muscleQueue, setMuscleQueue] = useState<string[]>(DEFAULT_BASELINE_MUSCLES);
  const [mmtRecords, setMmtRecords] = useState<Record<string, MMTSessionRecord>>({});
  const [painMap, setPainMap] = useState<PainMapPoint[]>([]);
  const [activeMuscleId, setActiveMuscleId] = useState<string>(DEFAULT_BASELINE_MUSCLES[0]);
  const [muscleToAdd, setMuscleToAdd] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [currentVisitId, setCurrentVisitId] = useState<string | undefined>(undefined);
  const [saveVisitFeedback, setSaveVisitFeedback] = useState<string | null>(null);

  // Web Speech API voice dictation state
  const [voiceTarget, setVoiceTarget] = useState<VoiceTargetMode>('auto');
  const [isRecording, setIsRecording] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string | null>(null);
  const [voiceErrorMsg, setVoiceErrorMsg] = useState<string | null>(null);
  const [lastVoiceParse, setLastVoiceParse] = useState<ParsedVoiceComplaintResult | null>(null);
  const [showVoiceEditor, setShowVoiceEditor] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const dictationTextRef = useRef<string>('');
  const lastAppliedSignatureRef = useRef<string>('');
  const voiceSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);

  const activePatientObj = useMemo(
    () => patients.find((p) => p.id === activePatientId) ?? null,
    [patients, activePatientId]
  );

  // Sync patientName (and saved painMap when starting with an existing patient)
  useEffect(() => {
    if (activePatientObj) {
      setPatientName(activePatientObj.fullName);
      if (!loadedVisit && activePatientObj.painMap && activePatientObj.painMap.length > 0) {
        setPainMap((prev) => (prev.length === 0 ? activePatientObj.painMap ?? [] : prev));
      }
    }
  }, [activePatientObj, loadedVisit]);

  // Hydrate when a historical visit is explicitly opened from PatientsView
  useEffect(() => {
    if (!loadedVisit) return;
    setCurrentVisitId(loadedVisit.id);
    setVisitDate(loadedVisit.visitDate);
    setSpecialistName(loadedVisit.specialistName);
    setChiefComplaint(loadedVisit.chiefComplaint);
    setComplaintTimeWindow(loadedVisit.complaintTimeWindow ?? '');
    setAnswers(loadedVisit.answers);
    const nextQueue =
      loadedVisit.muscleQueue.length > 0 ? loadedVisit.muscleQueue : DEFAULT_BASELINE_MUSCLES;
    setMuscleQueue(nextQueue);
    setActiveMuscleId(nextQueue[0]);
    setMmtRecords(loadedVisit.mmtRecords);
    setPainMap(loadedVisit.painMap ?? []);
    setStep('summary');
  }, [loadedVisit]);

  // Reset to a fresh session when started from PatientsView
  useEffect(() => {
    if (sessionResetNonce <= 0) return;
    setCurrentVisitId(undefined);
    setVisitDate(getTodayIso());
    setChiefComplaint('');
    setComplaintTimeWindow('');
    setAnswers({});
    setMuscleQueue(DEFAULT_BASELINE_MUSCLES);
    setMmtRecords({});
    setPainMap(activePatientObj?.painMap ?? []);
    setActiveMuscleId(DEFAULT_BASELINE_MUSCLES[0]);
    setStep('questionnaire');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, [sessionResetNonce, activePatientObj]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedSession>;
        if (parsed.patientName) setPatientName(parsed.patientName);
        if (parsed.visitDate) setVisitDate(parsed.visitDate);
        if (parsed.specialistName) setSpecialistName(parsed.specialistName);
        if (parsed.chiefComplaint) setChiefComplaint(parsed.chiefComplaint);
        if (parsed.complaintTimeWindow) setComplaintTimeWindow(parsed.complaintTimeWindow);
        if (parsed.answers) setAnswers(parsed.answers);
        if (Array.isArray(parsed.muscleQueue) && parsed.muscleQueue.length > 0) {
          setMuscleQueue(parsed.muscleQueue);
          setActiveMuscleId(parsed.muscleQueue[0]);
        }
        if (parsed.mmtRecords) setMmtRecords(parsed.mmtRecords);
        if (Array.isArray(parsed.painMap)) setPainMap(parsed.painMap);
      }
    } catch {
      // Ignore malformed local storage
    }
  }, []);

  // Persist session changes
  useEffect(() => {
    try {
      const payload: PersistedSession = {
        patientName,
        visitDate,
        specialistName,
        chiefComplaint,
        complaintTimeWindow: complaintTimeWindow || undefined,
        answers,
        muscleQueue,
        mmtRecords,
        painMap,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    patientName,
    visitDate,
    specialistName,
    chiefComplaint,
    complaintTimeWindow,
    answers,
    muscleQueue,
    mmtRecords,
    painMap,
  ]);

  // Domain scoring & detected causes from questionnaire
  const analysis = useMemo(() => {
    const domainScores: Record<IntakeDomain, { score: number; maxScore: number; pct: number }> = {
      structural: { score: 0, maxScore: 0, pct: 0 },
      visceral: { score: 0, maxScore: 0, pct: 0 },
      emotional: { score: 0, maxScore: 0, pct: 0 },
      energetic: { score: 0, maxScore: 0, pct: 0 },
      chemical: { score: 0, maxScore: 0, pct: 0 },
    };

    const positiveItems: Array<{ item: (typeof INTAKE_QUESTIONS)[number]; severity: QuestionSeverity }> =
      [];

    INTAKE_QUESTIONS.forEach((q) => {
      domainScores[q.domain].maxScore += 2;
      const sev = answers[q.id] ?? 0;
      domainScores[q.domain].score += sev;
      if (sev > 0) {
        positiveItems.push({ item: q, severity: sev });
      }
    });

    (Object.keys(domainScores) as IntakeDomain[]).forEach((d) => {
      const { score, maxScore } = domainScores[d];
      domainScores[d].pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    });

    positiveItems.sort((a, b) => b.severity - a.severity);

    const suggestedMuscleIds = new Set<string>();
    const organIds = new Set<string>();
    const diaphragmIds = new Set<string>();
    const meridianIds = new Set<string>();

    positiveItems.forEach(({ item }) => {
      item.recommendedMuscleIds.forEach((id) => suggestedMuscleIds.add(id));
      item.organIds.forEach((id) => organIds.add(id));
      item.diaphragmIds.forEach((id) => diaphragmIds.add(id));
      item.meridianIds.forEach((id) => meridianIds.add(id));
    });

    return {
      domainScores,
      positiveItems,
      suggestedMuscleIds: Array.from(suggestedMuscleIds),
      organs: ORGANS.filter((o) => organIds.has(o.id)),
      diaphragms: DIAPHRAGMS.filter((d) => diaphragmIds.has(d.id)),
      meridians: MERIDIANS.filter((m) => meridianIds.has(m.id)),
    };
  }, [answers]);

  // Set answer severity and automatically add recommended muscles to MMT queue
  const handleAnswerChange = (questionId: string, severity: QuestionSeverity) => {
    setAnswers((prev) => ({ ...prev, [questionId]: severity }));
    if (severity > 0) {
      const q = INTAKE_QUESTIONS.find((item) => item.id === questionId);
      if (q) {
        setMuscleQueue((prev) => {
          const next = new Set(prev);
          q.recommendedMuscleIds.forEach((id) => next.add(id));
          return Array.from(next);
        });
      }
    }
  };

  const syncRecommendedToQueue = () => {
    if (analysis.suggestedMuscleIds.length === 0) return;
    setMuscleQueue((prev) => {
      const next = new Set([...analysis.suggestedMuscleIds, ...prev]);
      const arr = Array.from(next);
      setActiveMuscleId(arr[0]);
      return arr;
    });
    setStep('mmt');
  };

  const handleAddMuscle = () => {
    if (!muscleToAdd) return;
    setMuscleQueue((prev) => (prev.includes(muscleToAdd) ? prev : [...prev, muscleToAdd]));
    setActiveMuscleId(muscleToAdd);
    setMuscleToAdd('');
  };

  const activeMuscle = useMemo(
    () => MUSCLES.find((m) => m.id === activeMuscleId) ?? MUSCLES[0],
    [activeMuscleId]
  );

  const activeRecord: MMTSessionRecord = useMemo(
    () => mmtRecords[activeMuscle.id] ?? createEmptyRecord(activeMuscle.id),
    [mmtRecords, activeMuscle.id]
  );

  const updateRecord = (muscleId: string, patch: Partial<MMTSessionRecord>) => {
    setMmtRecords((prev) => {
      const current = prev[muscleId] ?? createEmptyRecord(muscleId);
      return { ...prev, [muscleId]: { ...current, ...patch } };
    });
  };

  const toggleProvocation = (muscleId: string, tag: MMTProvocationTag) => {
    const current = mmtRecords[muscleId] ?? createEmptyRecord(muscleId);
    const exists = current.provocations.includes(tag);
    const nextTags = exists
      ? current.provocations.filter((t) => t !== tag)
      : [...current.provocations, tag];
    updateRecord(muscleId, { provocations: nextTags });
  };

  const activeCrossRefs = useMemo(
    () => getCrossReferences({ type: 'muscle', id: activeMuscle.id }),
    [activeMuscle.id]
  );

  const activeTriad = useMemo(
    () =>
      getTriadCorrections(
        { type: 'muscle', id: activeMuscle.id },
        {
          muscles: [activeMuscle],
          organs: activeCrossRefs.organs,
          meridians: activeCrossRefs.meridians,
        }
      ),
    [activeMuscle, activeCrossRefs]
  );

  const hasDysfunction =
    activeRecord.leftTone === 'hypotonia' ||
    activeRecord.leftTone === 'hypertonia' ||
    activeRecord.rightTone === 'hypotonia' ||
    activeRecord.rightTone === 'hypertonia' ||
    activeRecord.provocations.length > 0;

  // Compute summary stats across queue
  const mmtStats = useMemo(() => {
    let tested = 0;
    let abnormal = 0;
    let corrected = 0;
    const abnormalMuscles: Array<{ muscle: (typeof MUSCLES)[number]; record: MMTSessionRecord }> =
      [];

    muscleQueue.forEach((mId) => {
      const rec = mmtRecords[mId];
      const m = MUSCLES.find((item) => item.id === mId);
      if (!rec || !m) return;
      const isTested = rec.leftTone !== 'untested' || rec.rightTone !== 'untested';
      if (isTested) tested++;
      const isAbn =
        rec.leftTone === 'hypotonia' ||
        rec.leftTone === 'hypertonia' ||
        rec.rightTone === 'hypotonia' ||
        rec.rightTone === 'hypertonia';
      if (isAbn) {
        abnormal++;
        abnormalMuscles.push({ muscle: m, record: rec });
      }
      if (rec.correctionApplied || rec.retestNormotonia) corrected++;
    });

    return { tested, abnormal, corrected, abnormalMuscles };
  }, [muscleQueue, mmtRecords]);

  const applyParsedVoiceResult = useCallback(
    async (rawText: string, target: VoiceTargetMode) => {
      const cleaned = rawText.trim();
      if (!cleaned) return;
      const sig = `${target}::${cleaned}`;
      const isDuplicateRun = lastAppliedSignatureRef.current === sig;

      const parsed = parseVoiceComplaint(cleaned);
      setLastVoiceParse(parsed);

      const appliedSummaries: string[] = [];

      // 1. Auto-fill "Шкала жалоб" (leading complaint + circadian slot + patient timeline event + questionnaire hints)
      if (target === 'auto' || target === 'timeline') {
        setChiefComplaint(parsed.chiefComplaint);
        if (parsed.circadianPeriod) {
          setComplaintTimeWindow(parsed.circadianPeriod);
        }
        if (parsed.matchedQuestionIds.length > 0) {
          setAnswers((prev) => {
            const next = { ...prev };
            parsed.matchedQuestionIds.forEach((qId) => {
              if (!next[qId]) next[qId] = 1;
            });
            return next;
          });
        }

        if (activePatientObj && onSaveComplaintEvent && !isDuplicateRun) {
          await onSaveComplaintEvent(activePatientObj.id, {
            id: createEntityId('cmp'),
            createdAt: new Date().toISOString(),
            ...parsed.timelineEvent,
          });
          appliedSummaries.push('Шкала жалоб (записано в карту пациента)');
        } else {
          appliedSummaries.push('Шкала жалоб (жалоба и суточный ритм)');
        }
      }

      // 2. Auto-fill "Карта боли" (anatomical coordinates + VAS + matched muscles)
      if (target === 'auto' || target === 'painmap') {
        if (parsed.painPoints.length > 0 && !isDuplicateRun) {
          setPainMap((prev) => [...prev, ...parsed.painPoints]);
          appliedSummaries.push(`Карта боли (+${parsed.painPoints.length} отм.)`);
        } else if (parsed.painPoints.length > 0) {
          appliedSummaries.push(`Карта боли (${parsed.painPoints.length} отм.)`);
        }
      }

      // 3. Sync recommended MMT muscles into queue
      if (parsed.recommendedMuscleIds.length > 0) {
        setMuscleQueue((prev) => Array.from(new Set([...parsed.recommendedMuscleIds, ...prev])));
      }

      lastAppliedSignatureRef.current = sig;
      setVoiceErrorMsg(null);
      setVoiceStatusMsg(
        appliedSummaries.length > 0
          ? `Заполнено: ${appliedSummaries.join(' · ')}`
          : 'Текст жалобы распознан. При необходимости уточните зону боли или время суток.'
      );
    },
    [activePatientObj, onSaveComplaintEvent]
  );

  // Stop Web Speech API gracefully on unmount
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const toggleVoiceDictation = useCallback(() => {
    setVoiceErrorMsg(null);

    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        setIsRecording(false);
      }
      return;
    }

    const SpeechCtor = getSpeechRecognitionCtor();
    if (!SpeechCtor) {
      setShowVoiceEditor(true);
      setVoiceErrorMsg(
        'Web Speech API недоступен в этом браузере (используйте Chrome/Edge/Safari). Введите или вставьте текст жалобы ниже и нажмите «Заполнить поля».'
      );
      return;
    }

    setShowVoiceEditor(true);
    setVoiceStatusMsg(null);
    setInterimTranscript('');

    const recognition = new SpeechCtor();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceErrorMsg(null);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0]?.transcript ?? '';
        if (res.isFinal) {
          finalChunk += txt + ' ';
        } else {
          interimChunk += txt;
        }
      }

      if (finalChunk.trim()) {
        const merged = [dictationTextRef.current.trim(), finalChunk.trim()]
          .filter(Boolean)
          .join(' ');
        dictationTextRef.current = merged;
        setDictationText(merged);
      }
      setInterimTranscript(interimChunk.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      setIsRecording(false);
      setInterimTranscript('');
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceErrorMsg(
          'Доступ к микрофону запрещён. Разрешите использование микрофона в настройках браузера.'
        );
      } else if (event.error === 'no-speech') {
        setVoiceErrorMsg('Речь не распознана — нажмите на микрофон ещё раз и продиктуйте жалобу.');
      } else if (event.error === 'audio-capture') {
        setVoiceErrorMsg('Микрофон не найден. Проверьте подключение аудиоустройства.');
      } else if (event.error !== 'aborted') {
        setVoiceErrorMsg(`Ошибка распознавания речи (${event.error}).`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
      recognitionRef.current = null;
      const finalSpeech = dictationTextRef.current.trim();
      if (finalSpeech) {
        void applyParsedVoiceResult(finalSpeech, voiceTarget);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsRecording(false);
      setVoiceErrorMsg('Не удалось запустить микрофон. Попробуйте ещё раз.');
    }
  }, [isRecording, voiceTarget, applyParsedVoiceResult]);

  const handleResetSession = () => {
    setCurrentVisitId(undefined);
    if (!activePatientObj) {
      setPatientName('');
    }
    setVisitDate(getTodayIso());
    setChiefComplaint('');
    setComplaintTimeWindow('');
    setAnswers({});
    setMuscleQueue(DEFAULT_BASELINE_MUSCLES);
    setMmtRecords({});
    setPainMap([]);
    setActiveMuscleId(DEFAULT_BASELINE_MUSCLES[0]);
    setDictationText('');
    dictationTextRef.current = '';
    setInterimTranscript('');
    setLastVoiceParse(null);
    setVoiceStatusMsg(null);
    setVoiceErrorMsg(null);
    lastAppliedSignatureRef.current = '';
    setStep('questionnaire');
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAddPainMusclesToQueue = (muscleIds: string[], switchToMmtMuscleId?: string) => {
    if (muscleIds.length > 0) {
      setMuscleQueue((prev) => Array.from(new Set([...prev, ...muscleIds])));
    }
    if (switchToMmtMuscleId) {
      setActiveMuscleId(switchToMmtMuscleId);
      setStep('mmt');
    }
  };

  const handleSaveToPatientCard = async () => {
    if (!onSaveVisitToPatient) return;
    const saved = await onSaveVisitToPatient(
      {
        patientId: activePatientObj?.id ?? '',
        visitDate,
        specialistName,
        chiefComplaint,
        complaintTimeWindow: complaintTimeWindow || undefined,
        answers,
        muscleQueue,
        mmtRecords,
        painMap,
      },
      currentVisitId,
      patientName.trim() || undefined
    );
    if (saved) {
      setCurrentVisitId(saved.id);
      if (!activePatientObj && saved.patientId && onSelectPatientId) {
        onSelectPatientId(saved.patientId);
      }
      setSaveVisitFeedback('Приём и карта боли сохранены в карту пациента');
      setTimeout(() => setSaveVisitFeedback(null), 3000);
    }
  };

  const toneLabelShort = (tone: MMTResultTone) => {
    switch (tone) {
      case 'normotonia':
        return 'Норма';
      case 'hypotonia':
        return 'Гипо ↓';
      case 'hypertonia':
        return 'Гипер ↑';
      default:
        return '—';
    }
  };

  const toneBadgeColor = (tone: MMTResultTone) => {
    switch (tone) {
      case 'normotonia':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'hypotonia':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'hypertonia':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  const exportPayload: ClinicalExportInput = useMemo(
    () => ({
      patientName,
      visitDate,
      specialistName,
      chiefComplaint,
      complaintTimeWindow: complaintTimeWindow || undefined,
      domainScores: analysis.domainScores,
      positiveItems: analysis.positiveItems,
      suggestedMuscleIds: analysis.suggestedMuscleIds,
      organs: analysis.organs,
      diaphragms: analysis.diaphragms,
      meridians: analysis.meridians,
      muscleQueue,
      mmtRecords,
      painMap,
      stats: {
        tested: mmtStats.tested,
        abnormal: mmtStats.abnormal,
        corrected: mmtStats.corrected,
      },
    }),
    [
      patientName,
      visitDate,
      specialistName,
      chiefComplaint,
      complaintTimeWindow,
      analysis,
      muscleQueue,
      mmtRecords,
      painMap,
      mmtStats,
    ]
  );

  const structuredPlan = useMemo(
    () => buildStructuredCorrectionPlan(exportPayload),
    [exportPayload]
  );

  const textReportPreview = useMemo(() => buildClinicalTextReport(exportPayload), [exportPayload]);

  const showTempFeedback = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => setExportFeedback(null), 2800);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(textReportPreview);
      setCopiedSummary(true);
      showTempFeedback('Заключение и план коррекции скопированы в буфер обмена');
      setTimeout(() => setCopiedSummary(false), 2200);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  const handleDownloadTxt = () => {
    downloadTextReport(exportPayload);
    showTempFeedback('Текстовая карта (.txt) сформирована и скачана');
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportClinicalPdf(exportPayload);
      showTempFeedback('PDF-карта пациента сформирована и скачана');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const visibleQuestions = useMemo(() => {
    if (domainFilter === 'all') return INTAKE_QUESTIONS;
    return INTAKE_QUESTIONS.filter((q) => q.domain === domainFilter);
  }, [domainFilter]);

  const activeMuscleIndex = muscleQueue.indexOf(activeMuscle.id);
  const nextMuscleId =
    activeMuscleIndex >= 0 && activeMuscleIndex < muscleQueue.length - 1
      ? muscleQueue[activeMuscleIndex + 1]
      : null;

  return (
    <div className="space-y-6">
      {/* Header & Stepper */}
      <div className="print:hidden bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Опросный лист выявления причин и сеанс ММТ
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Системный опрос пациента по Триаде здоровья (структура, висцера, эмоции, энергетика,
              химия), автоматический план ММТ и интерактивные подсказки тестирующему в процессе
              проведения тестов и коррекции.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Новый приём</span>
          </button>
        </div>

        {/* Patient Database Linker + Metadata + Step Switcher */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          {onSelectPatientId && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  Карта из базы:
                </span>
                <select
                  value={activePatientId ?? ''}
                  onChange={(e) => {
                    const nextId = e.target.value || null;
                    onSelectPatientId(nextId);
                    setCurrentVisitId(undefined);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="">Без привязки (разовый приём)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                      {p.cardNumber ? ` (${p.cardNumber})` : ''}
                    </option>
                  ))}
                </select>
                {onOpenPatientsTab && (
                  <button
                    type="button"
                    onClick={onOpenPatientsTab}
                    className="text-blue-700 hover:underline font-medium cursor-pointer"
                  >
                    Открыть базу пациентов →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {saveVisitFeedback && (
                  <span className="text-emerald-700 font-medium">{saveVisitFeedback}</span>
                )}
                {onSaveVisitToPatient && (
                  <button
                    type="button"
                    onClick={handleSaveToPatientCard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {currentVisitId ? 'Обновить визит в карте' : 'Сохранить в карту пациента'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-3">
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Пациент (ФИО или № карты)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div className="lg:col-span-3 flex items-center gap-1.5">
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => {
                  const val = e.target.value;
                  setChiefComplaint(val);
                  const detected = matchCircadianPeriodsByText(val);
                  if (detected.length > 0 && !complaintTimeWindow) {
                    setComplaintTimeWindow(detected[0]);
                  }
                }}
                placeholder="Ведущая жалоба (напр.: с 6 до 8 утра)..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={toggleVoiceDictation}
                title={
                  isRecording
                    ? 'Остановить голосовую запись и заполнить поля'
                    : 'Надиктовать жалобы пациента через микрофон (Web Speech API)'
                }
                aria-label={isRecording ? 'Остановить запись микрофона' : 'Надиктовать жалобы'}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-blue-700 hover:bg-blue-800 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Стоп</span>
                  </>
                ) : (
                  <>
                    {voiceSupported ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>Микрофон</span>
                  </>
                )}
              </button>
            </div>
            <div className="lg:col-span-6 flex flex-wrap items-center justify-end gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'questionnaire', label: '1. Опросный лист' },
                  { id: 'painmap', label: `2. Карта боли (${painMap.length})` },
                  { id: 'mmt', label: `3. ММТ (${muscleQueue.length})` },
                  { id: 'summary', label: '4. Сводка' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    step === s.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Dictation Console (Web Speech API -> Pain Map & Complaint Timeline) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-700" />
                  Голосовая диктовка жалоб (Web Speech API)
                </span>
                {isRecording && (
                  <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse inline-block" />
                    Идёт запись речи (ru-RU)...
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500">Заполнять:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-md">
                  {(
                    [
                      { id: 'auto', label: 'Карта + Шкала' },
                      { id: 'painmap', label: 'Карта боли' },
                      { id: 'timeline', label: 'Шкала жалоб' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVoiceTarget(opt.id)}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        voiceTarget === opt.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowVoiceEditor((v) => !v)}
                  className="text-[11px] text-blue-700 hover:underline font-medium cursor-pointer whitespace-nowrap"
                >
                  {showVoiceEditor ? 'Свернуть текст' : 'Редактор текста'}
                </button>
              </div>
            </div>

            {(showVoiceEditor || isRecording || dictationText.length > 0 || Boolean(interimTranscript)) && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={dictationText}
                    onChange={(e) => {
                      dictationTextRef.current = e.target.value;
                      setDictationText(e.target.value);
                    }}
                    placeholder="Надиктуйте или введите: «Боль в пояснице справа на 7 из 10 с 6 до 8 утра и триггер в левом плече»..."
                    className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void applyParsedVoiceResult(dictationText, voiceTarget)}
                      disabled={!dictationText.trim()}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Заполнить поля
                    </button>
                    {dictationText && (
                      <button
                        type="button"
                        onClick={() => {
                          dictationTextRef.current = '';
                          setDictationText('');
                          setInterimTranscript('');
                          setLastVoiceParse(null);
                          setVoiceStatusMsg(null);
                          lastAppliedSignatureRef.current = '';
                        }}
                        className="px-2.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer whitespace-nowrap"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                </div>

                {interimTranscript && (
                  <div className="px-2.5 py-1 bg-white border border-blue-200 rounded text-[11px] text-slate-600 italic">
                    Распознаётся: {interimTranscript}
                  </div>
                )}
              </div>
            )}

            {voiceErrorMsg && (
              <div className="text-[11px] text-rose-700 font-medium">{voiceErrorMsg}</div>
            )}

            {voiceStatusMsg && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
                <span className="font-medium text-emerald-700">{voiceStatusMsg}</span>
                <div className="flex flex-wrap items-center gap-3">
                  {lastVoiceParse && lastVoiceParse.painPoints.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep('painmap')}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      Открыть Карту боли ({painMap.length}) →
                    </button>
                  )}
                  {onOpenTimelineTab && (
                    <button
                      type="button"
                      onClick={onOpenTimelineTab}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      Открыть Шкалу жалоб →
                    </button>
                  )}
                </div>
              </div>
            )}

            {lastVoiceParse && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200/80">
                <span>
                  <strong className="text-slate-800">ВАШ:</strong>{' '}
                  <span className="font-mono tabular-nums">{lastVoiceParse.intensity}/10</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-slate-800">Фаза:</strong>{' '}
                  {STAGE_META[lastVoiceParse.stage].shortLabel}
                </span>
                {lastVoiceParse.circadianPeriod && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="text-slate-800">Часы органа:</strong>{' '}
                      {CIRCADIAN_MAP[lastVoiceParse.circadianPeriod].shortLabel}
                    </span>
                  </>
                )}
                {lastVoiceParse.matchedSymptom && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="text-slate-800">Симптом:</strong>{' '}
                      {lastVoiceParse.matchedSymptom.title}
                    </span>
                  </>
                )}
                {lastVoiceParse.painPoints.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="text-slate-800">Отметки на карте:</strong>{' '}
                      {lastVoiceParse.painPoints
                        .map((pt) => {
                          const m = MUSCLES.find((item) => item.id === pt.primaryMuscleId);
                          return `${PAIN_MARKER_META[pt.type].shortLabel} (${m?.name ?? pt.zoneId})`;
                        })
                        .join(', ')}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Circadian Time-of-Day & Quick Complaint Preset Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs">
            <div className="lg:col-span-5">
              <select
                value=""
                onChange={(e) => {
                  const sym = SYMPTOMS.find((s) => s.id === e.target.value);
                  if (!sym) return;
                  setChiefComplaint(sym.title);
                  if (sym.timeProfile.circadianPeriods[0]) {
                    setComplaintTimeWindow(sym.timeProfile.circadianPeriods[0]);
                  }
                  const symMuscles = sym.mmtPlan.map((p) => p.muscleId);
                  if (symMuscles.length > 0) {
                    setMuscleQueue((prev) => Array.from(new Set([...symMuscles, ...prev])));
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="">
                  Выбрать типовую жалобу из справочника ({SYMPTOMS.length}) + авто-план ММТ...
                </option>
                {SYMPTOMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.timeProfile.peakWindow}] {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-7 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Время дискомфорта:</span>
              </div>
              <select
                value={complaintTimeWindow}
                onChange={(e) => setComplaintTimeWindow(e.target.value as CircadianPeriodId | '')}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="">Не привязано ко времени суток</option>
                {CIRCADIAN_SLOTS.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.practicalWindow} → {slot.organTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const activePeriodId =
              complaintTimeWindow || matchCircadianPeriodsByText(chiefComplaint)[0];
            const slot = activePeriodId ? CIRCADIAN_MAP[activePeriodId] : null;
            if (!slot) return null;
            return (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-amber-950">
                    Подсказка по времени суток ({slot.practicalWindow}): активен орган «{slot.organTitle}»
                  </div>
                  <p className="text-slate-700 leading-snug">{slot.clinicalMeaning}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMuscleQueue((prev) => Array.from(new Set([...slot.muscleIds, ...prev])));
                    if (slot.muscleIds[0]) setActiveMuscleId(slot.muscleIds[0]);
                    setStep('mmt');
                  }}
                  className="px-3 py-1.5 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Тестировать мышцы ({slot.muscleIds.length}) →
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ==================== STEP 1: QUESTIONNAIRE ==================== */}
      {step === 'questionnaire' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Domain Filter + Questions */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setDomainFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  domainFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Все сферы ({INTAKE_QUESTIONS.length})
              </button>
              {(Object.keys(INTAKE_DOMAIN_META) as IntakeDomain[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomainFilter(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    domainFilter === d
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {INTAKE_DOMAIN_META[d].shortLabel}
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {visibleQuestions.map((q, idx) => {
                const sev = answers[q.id] ?? 0;
                const meta = INTAKE_DOMAIN_META[q.domain];
                return (
                  <div
                    key={q.id}
                    className={`p-4 transition-colors ${
                      sev > 0 ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-mono tabular-nums text-slate-400">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={`font-semibold ${meta.colorClass}`}>{meta.label}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                          {q.question}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{q.clinicalClue}</p>
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start">
                        {(
                          [
                            { val: 0, label: 'Нет' },
                            { val: 1, label: 'Иногда' },
                            { val: 2, label: 'Выраженно' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt.val)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                              sev === opt.val
                                ? opt.val === 2
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : opt.val === 1
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {sev > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-blue-900 font-medium">
                          Вероятная причина: {q.suggestedCause}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          В план ММТ: {q.recommendedMuscleIds.length} мышц
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Root Cause Profile & Recommended MMT Plan */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Профиль вероятных причин (Триада)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Обновляется автоматически по мере заполнения опросного листа
                </p>
              </div>

              <div className="space-y-2.5">
                {(Object.keys(analysis.domainScores) as IntakeDomain[]).map((d) => {
                  const s = analysis.domainScores[d];
                  const meta = INTAKE_DOMAIN_META[d];
                  return (
                    <div key={d} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${meta.colorClass}`}>{meta.label}</span>
                        <span className="font-mono tabular-nums text-slate-600">{s.pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  Приоритетные гипотезы ({analysis.positiveItems.length})
                </div>
                {analysis.positiveItems.length === 0 ? (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Отметьте «Иногда» или «Выраженно» напротив жалоб пациента слева, чтобы система
                    выделила вероятные причины и сформировала план ММТ.
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-slate-700 max-h-48 overflow-y-auto pr-1">
                    {analysis.positiveItems.map(({ item, severity }) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                            severity === 2
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {severity === 2 ? '!!' : '!'}
                        </span>
                        <span className="leading-snug">{item.suggestedCause}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">План ММТ ({muscleQueue.length})</span>
                  {analysis.suggestedMuscleIds.length > 0 && (
                    <span className="text-blue-700 font-medium">
                      +{analysis.suggestedMuscleIds.length} по опросу
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    analysis.suggestedMuscleIds.length > 0
                      ? syncRecommendedToQueue()
                      : setStep('mmt')
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Перейти к проведению ММТ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: INTERACTIVE PAIN MAP ==================== */}
      {step === 'painmap' && (
        <PainMapView
          points={painMap}
          onChangePoints={setPainMap}
          muscleQueue={muscleQueue}
          onAddMusclesToQueue={handleAddPainMusclesToQueue}
          onOpenInAtlas={onOpenInAtlas}
          onSaveToPatient={onSaveVisitToPatient ? handleSaveToPatientCard : undefined}
          hasLinkedPatient={Boolean(activePatientObj)}
          saveFeedback={saveVisitFeedback}
        />
      )}

      {/* ==================== STEP 3: LIVE MMT & GUIDED CORRECTION ==================== */}
      {step === 'mmt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: MMT Testing Queue */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Мышцы сеанса ММТ ({muscleQueue.length})</span>
                <span className="font-mono tabular-nums text-slate-500">
                  Тест: {mmtStats.tested}/{muscleQueue.length}
                </span>
              </div>

              {/* Add any of 50 muscles */}
              <div className="flex items-center gap-1.5">
                <select
                  value={muscleToAdd}
                  onChange={(e) => setMuscleToAdd(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                >
                  <option value="">+ Добавить мышцу из 50...</option>
                  {MUSCLES.filter((m) => !muscleQueue.includes(m.id)).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMuscle}
                  disabled={!muscleToAdd}
                  className="p-1.5 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-40 cursor-pointer shrink-0"
                  aria-label="Добавить мышцу в тест"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">
              {muscleQueue.map((mId) => {
                const m = MUSCLES.find((item) => item.id === mId);
                if (!m) return null;
                const rec = mmtRecords[mId] ?? createEmptyRecord(mId);
                const isActive = m.id === activeMuscle.id;
                const isRecommended = analysis.suggestedMuscleIds.includes(m.id);

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMuscleId(m.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer ${
                      isActive ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-semibold leading-snug ${
                            isActive ? 'text-blue-900' : 'text-slate-900'
                          }`}
                        >
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{m.spinalSegment.split('·')[0].trim()}</span>
                          {isRecommended && (
                            <span className="text-blue-700 font-medium">· По опросу</span>
                          )}
                        </div>
                      </div>

                      {rec.retestNormotonia && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-medium">
                      <span
                        className={`px-1.5 py-0.5 rounded border ${toneBadgeColor(rec.leftTone)}`}
                      >
                        Л: {toneLabelShort(rec.leftTone)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded border ${toneBadgeColor(rec.rightTone)}`}
                      >
                        П: {toneLabelShort(rec.rightTone)}
                      </span>
                      {(rec.holdTimeLeftSec !== undefined || rec.holdTimeRightSec !== undefined) && (
                        <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 font-mono tabular-nums">
                          {rec.holdTimeLeftSec !== undefined ? `${rec.holdTimeLeftSec.toFixed(1)}с` : '—'}
                          {' / '}
                          {rec.holdTimeRightSec !== undefined ? `${rec.holdTimeRightSec.toFixed(1)}с` : '—'}
                        </span>
                      )}
                      {rec.provocations.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700">
                          ТЛ: {rec.provocations.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active Muscle Guided Testing + Live Correction Workbench */}
          <div className="lg:col-span-8 space-y-5">
            {/* Active Muscle Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                    {activeMuscle.spinalSegment} · {activeMuscle.innervation}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeMuscle.name}</h2>
                  <p className="text-xs italic text-slate-500">{activeMuscle.latinName}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenInAtlas({ type: 'muscle', id: activeMuscle.id })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <span>В Атлас</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  {nextMuscleId && (
                    <button
                      type="button"
                      onClick={() => setActiveMuscleId(nextMuscleId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                    >
                      <span>Следующая мышца</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* MMT Diagram + Live Tester Hints ("На что обратить внимание") */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-6">
                  <MMTSchematicDiagram muscle={activeMuscle} />
                </div>

                <div className="xl:col-span-6 p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Подсказки тестирующему: на что обратить внимание</span>
                  </div>

                  <div className="space-y-1.5 text-slate-700">
                    <p>
                      <strong className="text-slate-900">1. Исходная позиция и фиксация:</strong>{' '}
                      {activeMuscle.mmt.patientPosition} {activeMuscle.mmt.stabilization}
                    </p>
                    <p>
                      <strong className="text-slate-900">2. Вектор давления:</strong>{' '}
                      <span className="text-red-700 font-medium">
                        {activeMuscle.mmt.pressureVector}
                      </span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-amber-200/70 space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      Частые ошибки и подмены синергистами:
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-snug">
                      {activeMuscle.mmt.commonErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      <li>
                        При двусторонней слабости сначала исключите неврологическое «переключение»
                        (ТЛ точек К-27 + пупок).
                      </li>
                      <li>
                        Если мышца «сильная», но не реагирует на щепок/сближение веретён — проверьте
                        скрытый гипертонус.
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/70 text-[11px]">
                    <div className="p-2 bg-white rounded border border-emerald-200/70">
                      <span className="font-semibold text-emerald-700 block">Нормотония</span>
                      <span className="text-slate-600">{activeMuscle.mmt.normotoniaSign}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-rose-200/70">
                      <span className="font-semibold text-rose-700 block">Гипотония</span>
                      <span className="text-slate-600">{activeMuscle.mmt.hypotoniaSign}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hold Contraction & Muscle Fatigue Timer */}
              <MMTHoldTimer
                muscleId={activeMuscle.id}
                leftHoldSec={activeRecord.holdTimeLeftSec}
                rightHoldSec={activeRecord.holdTimeRightSec}
                onSaveHoldTime={(side, seconds) =>
                  updateRecord(
                    activeMuscle.id,
                    side === 'left' ? { holdTimeLeftSec: seconds } : { holdTimeRightSec: seconds }
                  )
                }
              />

              {/* Record Test Results (Left / Right) & Provocations */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="text-xs font-bold text-slate-900">
                  Фиксация результата ММТ и провокаций в процессе теста
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      { side: 'leftTone', label: 'Левая сторона (L)' },
                      { side: 'rightTone', label: 'Правая сторона (R)' },
                    ] as const
                  ).map(({ side, label }) => (
                    <div key={side} className="space-y-1.5">
                      <div className="text-xs font-medium text-slate-700">{label}</div>
                      <div className="grid grid-cols-4 gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                        {(
                          [
                            { id: 'untested', label: 'Не тест.' },
                            { id: 'normotonia', label: 'Норма' },
                            { id: 'hypotonia', label: 'Гипо ↓' },
                            { id: 'hypertonia', label: 'Гипер ↑' },
                          ] as const
                        ).map((opt) => {
                          const selected = activeRecord[side] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateRecord(activeMuscle.id, { [side]: opt.id })}
                              className={`py-1.5 px-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                                selected
                                  ? opt.id === 'hypotonia'
                                    ? 'bg-rose-600 text-white'
                                    : opt.id === 'hypertonia'
                                      ? 'bg-amber-600 text-white'
                                      : opt.id === 'normotonia'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-700 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Provocations encountered during testing */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-700">
                    Какие провокации / ТЛ изменили тонус во время теста?
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(MMT_PROVOCATION_LABELS) as MMTProvocationTag[]).map((tag) => {
                      const active = activeRecord.provocations.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleProvocation(activeMuscle.id, tag)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-blue-700 text-white border-blue-700 font-medium'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {MMT_PROVOCATION_LABELS[tag].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Contextual Correction Panel (Taping · Nosodes · Manipulations · Craniosacral & Safety Tests) */}
            <MMTContextualCorrectionPanel
              muscle={activeMuscle}
              record={activeRecord}
              onOpenDirectoryTab={onOpenDirectoryTab}
            />

            {/* Dynamic Real-Time Correction Guide */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {hasDysfunction
                      ? 'Рекомендуемая коррекция прямо сейчас (по данным ММТ)'
                      : 'План коррекции при выявлении дисфункции'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {hasDysfunction
                      ? 'Выявлены отклонения тонуса или положительная провокация — используйте алгоритм ниже и проведите ретест'
                      : 'Отметьте «Гипо ↓», «Гипер ↑» или провокацию выше, чтобы получить приоритетный протокол коррекции'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      updateRecord(activeMuscle.id, {
                        correctionApplied: !activeRecord.correctionApplied,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                      activeRecord.correctionApplied
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Коррекция выполнена</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateRecord(activeMuscle.id, {
                        correctionApplied: true,
                        retestNormotonia: !activeRecord.retestNormotonia,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                      activeRecord.retestNormotonia
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ретест: Нормотония</span>
                  </button>
                </div>
              </div>

              {/* Provocation-Specific Immediate Directives */}
              {activeRecord.provocations.length > 0 && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1.5 text-xs">
                  <div className="font-semibold text-blue-900">
                    Приоритет по выбранным провокациям:
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    {activeRecord.provocations.map((tag) => (
                      <li key={tag}>
                        <strong>{MMT_PROVOCATION_LABELS[tag].label}:</strong>{' '}
                        {MMT_PROVOCATION_LABELS[tag].hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concrete Correction Steps + Reflexes + Triad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="font-semibold text-slate-900">Рефлексы и висцеро-моторная связь</div>
                  <p className="text-slate-600">
                    <strong>НЛ спереди (30 с):</strong> {activeMuscle.reflexes.neurolymphaticAnterior}
                  </p>
                  <p className="text-slate-600">
                    <strong>НЛ сзади:</strong> {activeMuscle.reflexes.neurolymphaticPosterior}
                  </p>
                  <p className="text-slate-600">
                    <strong>НВ (Беннетт, 45 с):</strong> {activeMuscle.reflexes.neurovascular}
                  </p>
                  <p className="text-emerald-800 font-medium">
                    Орган: {activeMuscle.reflexes.visceromotorLink}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="font-semibold text-slate-900">
                    Эмоции · Энергия · Химия для этой мышцы
                  </div>
                  <p className="text-slate-600">
                    <strong className="text-rose-700">Эмоции (ЭСР):</strong>{' '}
                    {activeTriad.emotional.correctionMethod}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-violet-700">Энергия / точки:</strong>{' '}
                    {activeTriad.energetic.keyPointsOrNutrients}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-emerald-700">Химия / нутриенты:</strong>{' '}
                    {activeMuscle.nutrients.join(', ')}
                  </p>
                </div>
              </div>

              {activeMuscle.correctionSteps.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800">
                    Пошаговые техники коррекции ({activeMuscle.name})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {activeMuscle.correctionSteps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-blue-700">{st.modality}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {st.durationOrDose}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900">{st.title}</div>
                        <p className="text-slate-600 leading-relaxed">{st.technique}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practitioner Session Notes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <label className="text-xs font-medium text-slate-700 block">
                  Заметки по тесту и реакции на коррекцию
                </label>
                <input
                  type="text"
                  value={activeRecord.notes}
                  onChange={(e) => updateRecord(activeMuscle.id, { notes: e.target.value })}
                  placeholder="Например: гипотония справа восстановилась после лифтинга печени и стимуляции НЛ 5 м/р..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: SESSION SUMMARY, CORRECTION PLAN & EXPORT ==================== */}
      {step === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 print:border-0 print:p-0 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
                <ClipboardCheck className="w-4 h-4" />
                Итоговая сводка приёма и выгрузка в карту пациента
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {patientName ? `Пациент: ${patientName}` : 'Клиническая карта приёма'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>Дата приёма: {formatDisplayDate(visitDate)}</span>
                {specialistName.trim() && <span>Специалист: {specialistName.trim()}</span>}
                {chiefComplaint.trim() && <span>Жалоба: {chiefComplaint.trim()}</span>}
              </div>
            </div>

            {/* Export Action Bar */}
            <div className="print:hidden flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Формирование PDF...' : 'Скачать PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Скачать .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Копировать текст</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Печать</span>
              </button>
            </div>
          </div>

          {/* Optional Session Stamp Fields & Export Feedback */}
          <div className="print:hidden grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Дата приёма (для карты)
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="md:col-span-5">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Специалист (ФИО, квалификация)
              </label>
              <input
                type="text"
                value={specialistName}
                onChange={(e) => setSpecialistName(e.target.value)}
                placeholder="Например: Иванов И.И., врач-остеопат / кинезиолог"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="md:col-span-4 flex items-end justify-between md:justify-end gap-2 pt-3 md:pt-5">
              {exportFeedback ? (
                <span className="text-xs font-medium text-emerald-700">{exportFeedback}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTextPreview((v) => !v)}
                  className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                >
                  {showTextPreview
                    ? 'Скрыть текстовый предпросмотр'
                    : 'Показать текст для вставки в МИС'}
                </button>
              )}
            </div>
          </div>

          {showTextPreview && (
            <div className="print:hidden space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                Предпросмотр текстового заключения для карты пациента:
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-72 overflow-y-auto whitespace-pre-wrap">
                {textReportPreview}
              </pre>
            </div>
          )}

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Выявлено причин по опросу</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {analysis.positiveItems.length}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Протестировано мышц</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {mmtStats.tested} / {muscleQueue.length}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Дисфункций ММТ</div>
              <div className="text-lg font-bold text-rose-700 tabular-nums mt-0.5">
                {mmtStats.abnormal}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500">Скорректировано / Ретест</div>
              <div className="text-lg font-bold text-emerald-700 tabular-nums mt-0.5">
                {mmtStats.corrected}
              </div>
            </div>
          </div>

          {/* Triad Breakdown + Tested Muscles Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Профиль Триады здоровья по опроснику
              </h3>
              <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                {(Object.keys(analysis.domainScores) as IntakeDomain[]).map((d) => {
                  const s = analysis.domainScores[d];
                  return (
                    <div key={d} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-800">
                          {INTAKE_DOMAIN_META[d].label}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600">{s.pct}%</span>
                      </div>
                      <div className="h-2 bg-white border border-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-700 rounded-full"
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {analysis.positiveItems.length > 0 && (
                <div className="p-4 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-slate-900">
                    Причины по опроснику ({analysis.positiveItems.length})
                  </div>
                  <ul className="space-y-1.5 text-slate-700">
                    {analysis.positiveItems.map(({ item, severity }) => (
                      <li key={item.id} className="leading-snug">
                        <span
                          className={`font-semibold ${
                            severity === 2 ? 'text-rose-700' : 'text-amber-700'
                          }`}
                        >
                          [{severity === 2 ? 'Выраж.' : 'Умер.'}]
                        </span>{' '}
                        {item.suggestedCause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.organs.length > 0 && (
                <div className="p-4 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-slate-900">
                    Приоритетные структуры для проверки в Атласе
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.organs.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => onOpenInAtlas({ type: 'organ', id: o.id })}
                        className="text-emerald-700 hover:underline cursor-pointer"
                      >
                        {o.name} →
                      </button>
                    ))}
                    {analysis.diaphragms.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onOpenInAtlas({ type: 'diaphragm', id: d.id })}
                        className="text-amber-700 hover:underline cursor-pointer"
                      >
                        {d.name.split('(')[0].trim()} →
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Журнал ММТ и проведённой коррекции
              </h3>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs overflow-hidden">
                {muscleQueue.map((mId) => {
                  const m = MUSCLES.find((item) => item.id === mId);
                  if (!m) return null;
                  const rec = mmtRecords[mId] ?? createEmptyRecord(mId);
                  return (
                    <div
                      key={m.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMuscleId(m.id);
                            setStep('mmt');
                          }}
                          className="font-semibold text-slate-900 hover:text-blue-700 cursor-pointer text-left"
                        >
                          {m.name}
                        </button>
                        {rec.provocations.length > 0 && (
                          <div className="text-[11px] text-violet-700">
                            ТЛ: {rec.provocations.map((p) => MMT_PROVOCATION_LABELS[p].label).join(' · ')}
                          </div>
                        )}
                        {rec.notes && <div className="text-[11px] text-slate-500">{rec.notes}</div>}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded border font-medium ${toneBadgeColor(rec.leftTone)}`}
                        >
                          Л: {toneLabelShort(rec.leftTone)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border font-medium ${toneBadgeColor(rec.rightTone)}`}
                        >
                          П: {toneLabelShort(rec.rightTone)}
                        </span>
                        {rec.holdTimeLeftSec !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded border font-mono tabular-nums ${
                              classifyHoldFatigue(rec.holdTimeLeftSec).badgeClass
                            }`}
                          >
                            Удерж. Л: {rec.holdTimeLeftSec.toFixed(1)} с
                          </span>
                        )}
                        {rec.holdTimeRightSec !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded border font-mono tabular-nums ${
                              classifyHoldFatigue(rec.holdTimeRightSec).badgeClass
                            }`}
                          >
                            Удерж. П: {rec.holdTimeRightSec.toFixed(1)} с
                          </span>
                        )}
                        {rec.retestNormotonia && (
                          <span className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">
                            Ретест: Норма
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Formed Correction Plan Section */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Сформированный план коррекции (включается в экспорт PDF и .TXT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Формируется автоматически из выявленных сфер опросника, положительных провокаций ММТ,
                рефлексов Чапмана/Беннетта и протоколов Триады здоровья.
              </p>
            </div>

            {structuredPlan.dominantDomains.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {structuredPlan.dominantDomains.map((dom) => (
                  <div
                    key={dom.domain}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{dom.label}</span>
                      <span className="font-mono tabular-nums text-blue-700">{dom.pct}%</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{dom.strategy}</p>
                  </div>
                ))}
              </div>
            )}

            {structuredPlan.priorityMuscles.length > 0 ? (
              <div className="space-y-3">
                {structuredPlan.priorityMuscles.map((entry, idx) => (
                  <div
                    key={entry.muscle.id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {entry.muscle.name}{' '}
                        <span className="font-normal italic text-slate-500 text-xs">
                          ({entry.muscle.latinName})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium">
                        <span
                          className={`px-2 py-0.5 rounded border ${toneBadgeColor(entry.record.leftTone)}`}
                        >
                          Л: {toneLabelShort(entry.record.leftTone)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border ${toneBadgeColor(entry.record.rightTone)}`}
                        >
                          П: {toneLabelShort(entry.record.rightTone)}
                        </span>
                      </div>
                    </div>

                    {entry.provocationDirectives.length > 0 && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1 text-slate-700">
                        <div className="font-semibold text-blue-900">
                          Приоритет по провокациям:
                        </div>
                        {entry.provocationDirectives.map((pd, pIdx) => (
                          <div key={pIdx}>
                            <strong>{pd.label}:</strong> {pd.hint}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1 text-slate-600">
                        <div>
                          <strong className="text-slate-800">НЛ спереди / сзади:</strong>{' '}
                          {entry.muscle.reflexes.neurolymphaticAnterior} /{' '}
                          {entry.muscle.reflexes.neurolymphaticPosterior}
                        </div>
                        <div>
                          <strong className="text-slate-800">НВ (Беннетт):</strong>{' '}
                          {entry.muscle.reflexes.neurovascular}
                        </div>
                        <div>
                          <strong className="text-emerald-800">Орган:</strong>{' '}
                          {entry.muscle.reflexes.visceromotorLink}
                        </div>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <div>
                          <strong className="text-rose-700">Эмоции (ЭСР):</strong>{' '}
                          {entry.triad.emotional.correctionMethod}
                        </div>
                        <div>
                          <strong className="text-violet-700">Энергия / точки:</strong>{' '}
                          {entry.triad.energetic.keyPointsOrNutrients}
                        </div>
                        <div>
                          <strong className="text-emerald-700">Химия / нутриенты:</strong>{' '}
                          {entry.muscle.nutrients.join(', ')}
                        </div>
                      </div>
                    </div>

                    {entry.muscle.correctionSteps.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1">
                        <div className="font-semibold text-slate-800">Техники коррекции:</div>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {entry.muscle.correctionSteps.map((st, sIdx) => (
                            <li key={sIdx}>
                              <strong className="text-slate-800">
                                [{st.modality} · {st.durationOrDose}] {st.title}:
                              </strong>{' '}
                              {st.technique}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-slate-200 rounded-xl text-xs text-slate-500">
                Отметьте жалобы в опросном листе или дисфункции в процессе ММТ, чтобы в план коррекции
                добавились адресные протоколы.
              </div>
            )}

            {painMap.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">
                    Карта боли, триггерные точки и слабые мышцы ({painMap.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('painmap')}
                    className="print:hidden text-blue-700 hover:underline font-medium cursor-pointer"
                  >
                    Открыть карту боли →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                  {painMap.map((pt, idx) => {
                    const m = MUSCLES.find((item) => item.id === pt.primaryMuscleId);
                    return (
                      <div key={pt.id} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-semibold text-slate-900">
                          {idx + 1}.{' '}
                          <span className={PAIN_MARKER_META[pt.type].textClass}>
                            [{PAIN_MARKER_META[pt.type].shortLabel}]
                          </span>{' '}
                          {m?.name ?? 'Мышца не указана'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {describeBodySide(pt.x)} · x={pt.x}, y={pt.y}
                          {pt.intensity !== undefined ? ` · ВАШ ${pt.intensity}/10` : ''}
                        </div>
                        {pt.note && <div className="text-[11px] text-slate-600 mt-0.5">{pt.note}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {structuredPlan.balancingPoints.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-900">
                  Точки балансировки меридианов по данным опросника:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                  {structuredPlan.balancingPoints.map((pt) => (
                    <div key={pt.code}>
                      <strong className="text-slate-800">
                        {pt.code} ({pt.name}, {pt.meridianName}):
                      </strong>{' '}
                      {pt.location}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
