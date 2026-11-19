import React, { useEffect, useMemo, useState } from 'react';
import { LEARNING_CURRICULUM } from '../data';
import {
  LearningProgressState,
  LearningQuestion,
  LearningQuestionKind,
  LearningStage,
  SelectedEntity,
} from '../types/atlas';
import {
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  GitCompare,
  GraduationCap,
  Link2,
  Lock,
  Maximize2,
  NotebookPen,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { appendStudyNote } from '../utils/studyNotesStore';

const LS_LEARNING_PROGRESS_KEY = 'kinezioatlas_learning_progress_v1';

interface LearningSystemViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  onOpenNotes?: () => void;
}

interface QuestionEvaluation {
  isCorrect: boolean;
  selectedOptionIndex?: number;
  /** Map of pairId -> chosen currentLabel */
  chosenMatches?: Record<string, string>;
}

const DEFAULT_PROGRESS: LearningProgressState = {
  unlockedStep: 1,
  results: {},
};

function loadProgress(): LearningProgressState {
  try {
    const raw = localStorage.getItem(LS_LEARNING_PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<LearningProgressState>;
    return {
      unlockedStep:
        typeof parsed.unlockedStep === 'number' && parsed.unlockedStep >= 1
          ? Math.min(LEARNING_CURRICULUM.length, parsed.unlockedStep)
          : 1,
      results: parsed.results ?? {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(state: LearningProgressState): void {
  try {
    localStorage.setItem(LS_LEARNING_PROGRESS_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function deterministicShuffle<T>(items: T[], seedText: string): T[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) % 1000003;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function getKindMeta(q: LearningQuestion): {
  label: string;
  textClass: string;
  accentBg: string;
} {
  if (q.kind === 'review') {
    return {
      label: `Повторение · Этап ${q.linkedStageNumber ?? ''}${
        q.linkedStageTitle ? ` (${q.linkedStageTitle})` : ''
      }`,
      textClass: 'text-amber-800',
      accentBg: 'bg-amber-50 border-amber-200',
    };
  }
  if (q.kind === 'connection') {
    return {
      label: `Поиск взаимосвязей · Этап ${q.linkedStageNumber ?? ''} ↔ изучаемый этап`,
      textClass: 'text-violet-800',
      accentBg: 'bg-violet-50 border-violet-200',
    };
  }
  return {
    label: 'Новый материал этапа',
    textClass: 'text-blue-800',
    accentBg: 'bg-blue-50 border-blue-200',
  };
}

export const LearningSystemView: React.FC<LearningSystemViewProps> = ({
  onOpenInAtlas,
  onOpenNotes,
}) => {
  const [progress, setProgress] = useState<LearningProgressState>(() => loadProgress());
  const [activeStepNumber, setActiveStepNumber] = useState<number>(() => {
    const p = loadProgress();
    return p.unlockedStep;
  });
  const [stageMode, setStageMode] = useState<'study' | 'quiz'>('study');

  // Quiz state for the currently selected stage
  const [evaluations, setEvaluations] = useState<Record<string, QuestionEvaluation>>({});
  const [pendingSingleChoice, setPendingSingleChoice] = useState<Record<string, number>>({});
  const [pendingMatches, setPendingMatches] = useState<Record<string, Record<string, string>>>({});
  const [activeMatchLeftId, setActiveMatchLeftId] = useState<Record<string, string | null>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  // Visual aid lightbox & quick study note state
  const [visualLightbox, setVisualLightbox] = useState<{
    src: string;
    caption: string;
    attribution: string;
    title: string;
  } | null>(null);
  const [savedLessonNoteIds, setSavedLessonNoteIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const activeStage: LearningStage = useMemo(
    () =>
      LEARNING_CURRICULUM.find((s) => s.stepNumber === activeStepNumber) ??
      LEARNING_CURRICULUM[0],
    [activeStepNumber]
  );

  // Reset transient quiz inputs when switching stages cleanly
  const handleSelectStage = (stepNum: number) => {
    if (stepNum > progress.unlockedStep) return;
    setActiveStepNumber(stepNum);
    setStageMode('study');
    setEvaluations({});
    setPendingSingleChoice({});
    setPendingMatches({});
    setActiveMatchLeftId({});
  };

  const handleRestartQuiz = () => {
    setEvaluations({});
    setPendingSingleChoice({});
    setPendingMatches({});
    setActiveMatchLeftId({});
  };

  const handleResetAllProgress = () => {
    const fresh: LearningProgressState = { unlockedStep: 1, results: {} };
    setProgress(fresh);
    setActiveStepNumber(1);
    setStageMode('study');
    handleRestartQuiz();
    setConfirmReset(false);
  };

  const recordStageCompletionIfFinished = (nextEvals: Record<string, QuestionEvaluation>) => {
    const totalCount = activeStage.questions.length;
    const answeredCount = activeStage.questions.filter((q) => Boolean(nextEvals[q.id])).length;
    if (answeredCount < totalCount) return;

    const correctCount = activeStage.questions.filter((q) => nextEvals[q.id]?.isCorrect).length;
    const scorePct = Math.round((correctCount / totalCount) * 100);
    const passed = scorePct >= activeStage.passThresholdPct;

    setProgress((prev) => {
      const prevBest = prev.results[activeStage.id]?.scorePct ?? 0;
      const prevPassed = prev.results[activeStage.id]?.passed ?? false;
      const nextUnlocked = passed
        ? Math.min(LEARNING_CURRICULUM.length, Math.max(prev.unlockedStep, activeStage.stepNumber + 1))
        : prev.unlockedStep;

      return {
        unlockedStep: nextUnlocked,
        results: {
          ...prev.results,
          [activeStage.id]: {
            scorePct: Math.max(prevBest, scorePct),
            correctCount,
            totalCount,
            passed: prevPassed || passed,
            completedAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  const handleCheckSingleChoice = (q: LearningQuestion) => {
    const chosen = pendingSingleChoice[q.id];
    if (chosen === undefined) return;
    const isCorrect = chosen === q.correctOptionIndex;
    const nextEvals: Record<string, QuestionEvaluation> = {
      ...evaluations,
      [q.id]: {
        isCorrect,
        selectedOptionIndex: chosen,
      },
    };
    setEvaluations(nextEvals);
    recordStageCompletionIfFinished(nextEvals);
  };

  const handleCheckConnectionMatch = (q: LearningQuestion) => {
    const pairs = q.matchPairs ?? [];
    const chosen = pendingMatches[q.id] ?? {};
    if (Object.keys(chosen).length < pairs.length) return;

    const allCorrect = pairs.every((pair) => chosen[pair.id] === pair.currentLabel);
    const nextEvals: Record<string, QuestionEvaluation> = {
      ...evaluations,
      [q.id]: {
        isCorrect: allCorrect,
        chosenMatches: { ...chosen },
      },
    };
    setEvaluations(nextEvals);
    recordStageCompletionIfFinished(nextEvals);
  };

  const handleSelectPairConnection = (qId: string, rightLabel: string) => {
    const leftId = activeMatchLeftId[qId];
    if (!leftId) return;
    setPendingMatches((prev) => {
      const currentMap = { ...(prev[qId] ?? {}) };
      // Ensure 1-to-1 bijection: remove rightLabel if assigned elsewhere
      Object.keys(currentMap).forEach((k) => {
        if (currentMap[k] === rightLabel) delete currentMap[k];
      });
      currentMap[leftId] = rightLabel;
      return { ...prev, [qId]: currentMap };
    });
    setActiveMatchLeftId((prev) => ({ ...prev, [qId]: null }));
  };

  // Live Quiz Summary Breakdown
  const quizSummary = useMemo(() => {
    const total = activeStage.questions.length;
    const answered = activeStage.questions.filter((q) => Boolean(evaluations[q.id])).length;
    const correct = activeStage.questions.filter((q) => evaluations[q.id]?.isCorrect).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = answered === total && pct >= activeStage.passThresholdPct;

    const byKind = (['new', 'review', 'connection'] as LearningQuestionKind[]).map((kind) => {
      const subset = activeStage.questions.filter((q) => q.kind === kind);
      const subCorrect = subset.filter((q) => evaluations[q.id]?.isCorrect).length;
      return { kind, total: subset.length, correct: subCorrect };
    });

    return { total, answered, correct, pct, passed, byKind };
  }, [activeStage, evaluations]);

  const completedStagesCount = useMemo(
    () => LEARNING_CURRICULUM.filter((st) => progress.results[st.id]?.passed).length,
    [progress.results]
  );

  const nextStage = useMemo(
    () => LEARNING_CURRICULUM.find((s) => s.stepNumber === activeStage.stepNumber + 1) ?? null,
    [activeStage.stepNumber]
  );

  return (
    <div className="space-y-6">
      {/* Header & Mastery Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Система пошагового обучения</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {LEARNING_CURRICULUM.length} этапов от базового ММТ к мастерству коррекции
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight text-balance">
            Спиральное обучение прикладной кинезиологии и ММТ
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Изучайте теорию последовательно. На каждом новом шаге тест проверяет новый материал,
            повторяет предыдущие этапы и оценивает понимание перекрёстных взаимосвязей.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenNotes && (
            <button
              type="button"
              onClick={onOpenNotes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <NotebookPen className="w-3.5 h-3.5" />
              <span>Конспект для заметок</span>
            </button>
          )}

          <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <div className="text-[11px] text-slate-500">Освоено этапов</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {completedStagesCount} / {LEARNING_CURRICULUM.length}
            </div>
          </div>

          {confirmReset ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetAllProgress}
                className="px-3 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Сбросить всё
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить прогресс</span>
            </button>
          )}
        </div>
      </div>

      {/* 10-Stage Progression Rail (2 symmetric rows on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {LEARNING_CURRICULUM.map((st) => {
          const isUnlocked = st.stepNumber <= progress.unlockedStep;
          const isActive = st.stepNumber === activeStage.stepNumber;
          const res = progress.results[st.id];
          const isPassed = Boolean(res?.passed);

          return (
            <button
              key={st.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => handleSelectStage(st.stepNumber)}
              className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col justify-between gap-2 ${
                !isUnlocked
                  ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed'
                  : isActive
                  ? 'bg-blue-700 border-blue-700 text-white cursor-pointer'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-blue-400 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                <span className={isActive ? 'text-blue-100' : 'text-slate-500'}>
                  Этап {String(st.stepNumber).padStart(2, '0')}
                </span>
                {!isUnlocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                ) : isPassed ? (
                  <span
                    className={`inline-flex items-center gap-1 font-sans font-semibold ${
                      isActive ? 'text-emerald-200' : 'text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {res.scorePct}%
                  </span>
                ) : (
                  <span className={isActive ? 'text-blue-100' : 'text-blue-700'}>Открыт</span>
                )}
              </div>

              <div>
                <div className="text-xs font-bold leading-snug line-clamp-2">{st.title}</div>
                <div
                  className={`text-[11px] mt-1 ${
                    isActive ? 'text-blue-100' : isUnlocked ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {st.levelLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Stage Header + Mode Switcher */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-700 font-mono tabular-nums">
                Этап {activeStage.stepNumber} из {LEARNING_CURRICULUM.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeStage.levelLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Порог перехода: {activeStage.passThresholdPct}%
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{activeStage.title}</h2>
            <p className="text-sm text-slate-600">{activeStage.subtitle}</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start">
            <button
              type="button"
              onClick={() => setStageMode('study')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                stageMode === 'study'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>1. Теория этапа ({activeStage.lessons.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStageMode('quiz')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                stageMode === 'quiz'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Тест и взаимосвязи ({activeStage.questions.length})</span>
            </button>
          </div>
        </div>

        {/* STAGE MODE 1: STUDY LESSONS */}
        {stageMode === 'study' && (
          <div className="p-5 sm:p-6 space-y-6">
            {activeStage.bridgeFromPrevious && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <GitCompare className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <div className="font-semibold text-slate-900 mb-0.5">
                    Логический мостик от предыдущего этапа
                  </div>
                  <p>{activeStage.bridgeFromPrevious}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {activeStage.lessons.map((lesson) => (
                <article
                  key={lesson.id}
                  className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 bg-white"
                >
                  <div className="space-y-3">
                    <h3 className="text-base font-bold text-slate-900">{lesson.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{lesson.summary}</p>

                    {lesson.visualAid && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                        <div className="relative group bg-white flex items-center justify-center p-2">
                          <img
                            src={lesson.visualAid.src}
                            alt={lesson.visualAid.caption}
                            loading="lazy"
                            className="w-full h-48 object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setVisualLightbox({
                                src: lesson.visualAid!.src,
                                caption: lesson.visualAid!.caption,
                                attribution: lesson.visualAid!.attribution,
                                title: lesson.title,
                              })
                            }
                            className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white/95 hover:bg-white border border-slate-200 rounded-md shadow-xs cursor-pointer"
                            title="Увеличить схему"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Увеличить</span>
                          </button>
                        </div>
                        <div className="px-3 py-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="text-slate-700 leading-snug">
                            {lesson.visualAid.caption}
                          </span>
                          <span className="text-slate-400 shrink-0">
                            {lesson.visualAid.attribution}
                          </span>
                        </div>
                      </div>
                    )}

                    <ul className="space-y-2 text-xs sm:text-[13px] text-slate-700">
                      {lesson.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="font-mono text-blue-700 font-bold shrink-0 mt-0.5">
                            0{idx + 1}.
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-900">Клиническое правило: </span>
                      {lesson.clinicalRule}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      {lesson.atlasLinks && lesson.atlasLinks.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-500">В Атласе:</span>
                          {lesson.atlasLinks.map((lnk) => (
                            <button
                              key={`${lnk.entity.type}-${lnk.entity.id}`}
                              type="button"
                              onClick={() => onOpenInAtlas(lnk.entity)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer"
                            >
                              <span>{lnk.label}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2">
                        {savedLessonNoteIds[lesson.id] ? (
                          <>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                              <span>Сохранено в конспект</span>
                            </span>
                            {onOpenNotes && (
                              <button
                                type="button"
                                onClick={onOpenNotes}
                                className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                              >
                                Открыть →
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              appendStudyNote({
                                title: lesson.title,
                                content: `${lesson.summary}\n\nКлючевые тезисы:\n${lesson.keyPoints
                                  .map((pt, i) => `${i + 1}. ${pt}`)
                                  .join('\n')}\n\nКлиническое правило: ${lesson.clinicalRule}`,
                                stageNumber: activeStage.stepNumber,
                                tag:
                                  activeStage.stepNumber === 1 || activeStage.stepNumber === 2
                                    ? 'Теория ММТ'
                                    : activeStage.stepNumber === 5 || activeStage.stepNumber === 8
                                    ? 'Точки и мудры'
                                    : 'Взаимосвязи',
                              });
                              setSavedLessonNoteIds((prev) => ({ ...prev, [lesson.id]: true }));
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5 text-blue-700" />
                            <span>В конспект</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Тест содержит вопросы по текущему этапу
                {activeStage.stepNumber > 1
                  ? ', проверку материала предыдущих этапов и задания на поиск взаимосвязей.'
                  : '.'}
              </div>
              <button
                type="button"
                onClick={() => setStageMode('quiz')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Перейти к тесту этапа →</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE MODE 2: CUMULATIVE & CONNECTION QUIZ */}
        {stageMode === 'quiz' && (
          <div className="p-5 sm:p-6 space-y-6">
            {/* Live Quiz Metrics Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500">Выполнено вопросов</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {quizSummary.answered} / {quizSummary.total}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500">Текущий результат</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {quizSummary.correct} верных ({quizSummary.pct}%)
                </div>
              </div>
              {quizSummary.byKind.map((bk) => {
                if (bk.total === 0 || bk.kind === 'new') return null;
                return (
                  <div key={bk.kind} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">
                      {bk.kind === 'review' ? 'Повторение прошлых этапов' : 'Поиск взаимосвязей'}
                    </div>
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {bk.correct} / {bk.total}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Questions List */}
            <div className="space-y-5">
              {activeStage.questions.map((q, qIdx) => {
                const kindMeta = getKindMeta(q);
                const evaluation = evaluations[q.id];

                return (
                  <div
                    key={q.id}
                    className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white"
                  >
                    {/* Question Kicker + Prompt */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            Вопрос {qIdx + 1}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className={`font-medium ${kindMeta.textClass}`}>
                            {kindMeta.label}
                          </span>
                        </div>

                        {evaluation && (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              evaluation.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {evaluation.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Верно</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                <span>Требует разбора</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                        {q.prompt}
                      </h3>
                    </div>

                    {/* FORMAT A: SINGLE CHOICE */}
                    {q.format === 'single-choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const selected = evaluation
                            ? evaluation.selectedOptionIndex === oIdx
                            : pendingSingleChoice[q.id] === oIdx;
                          const isCorrectOption = oIdx === q.correctOptionIndex;

                          let btnStyle =
                            'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
                          if (evaluation) {
                            if (isCorrectOption) {
                              btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950';
                            } else if (selected && !isCorrectOption) {
                              btnStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                            } else {
                              btnStyle = 'bg-slate-50/50 border-slate-200 text-slate-500';
                            }
                          } else if (selected) {
                            btnStyle = 'bg-blue-50 border-blue-600 text-blue-950';
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={Boolean(evaluation)}
                              onClick={() =>
                                setPendingSingleChoice((prev) => ({ ...prev, [q.id]: oIdx }))
                              }
                              className={`w-full px-4 py-3 rounded-lg border text-left text-xs sm:text-sm transition-colors flex items-start gap-3 ${btnStyle} ${
                                evaluation ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span className="font-mono font-semibold shrink-0 mt-0.5">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}

                        {!evaluation && (
                          <div className="pt-1">
                            <button
                              type="button"
                              disabled={pendingSingleChoice[q.id] === undefined}
                              onClick={() => handleCheckSingleChoice(q)}
                              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-lg cursor-pointer"
                            >
                              Проверить ответ
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FORMAT B: INTERACTIVE CONNECTION-MATCH BUILDER */}
                    {q.format === 'connection-match' && q.matchPairs && (
                      <ConnectionMatchQuestionBlock
                        question={q}
                        evaluation={evaluation}
                        chosenMap={pendingMatches[q.id] ?? {}}
                        activeLeftId={activeMatchLeftId[q.id] ?? null}
                        onSelectLeft={(pairId) =>
                          setActiveMatchLeftId((prev) => ({
                            ...prev,
                            [q.id]: prev[q.id] === pairId ? null : pairId,
                          }))
                        }
                        onSelectRight={(rightLabel) => handleSelectPairConnection(q.id, rightLabel)}
                        onClearPair={(pairId) =>
                          setPendingMatches((prev) => {
                            const nextMap = { ...(prev[q.id] ?? {}) };
                            delete nextMap[pairId];
                            return { ...prev, [q.id]: nextMap };
                          })
                        }
                        onCheck={() => handleCheckConnectionMatch(q)}
                      />
                    )}

                    {/* Detailed Explanation After Answer */}
                    {evaluation && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                        <span className="font-semibold text-slate-900">Клинический разбор: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage Completion Result Panel */}
            {quizSummary.answered === quizSummary.total && (
              <div
                className={`p-5 rounded-xl border space-y-4 ${
                  quizSummary.passed
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-amber-50 border-amber-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {quizSummary.passed
                        ? `Этап ${activeStage.stepNumber} успешно усвоен (${quizSummary.pct}%)`
                        : `Набрано ${quizSummary.pct}% (необходимо минимум ${activeStage.passThresholdPct}%)`}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1">
                      {quizSummary.passed
                        ? nextStage
                          ? `Открыт доступ к следующему уровню: «Этап ${nextStage.stepNumber}. ${nextStage.title}».`
                          : `Вы успешно завершили все ${LEARNING_CURRICULUM.length} этапов обучения прикладной кинезиологии и ММТ!`
                        : 'Повторите конспекты этапа и попробуйте пройти тест ещё раз для перехода на следующий шаг.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRestartQuiz}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      Пройти тест заново
                    </button>
                    {!quizSummary.passed && (
                      <button
                        type="button"
                        onClick={() => setStageMode('study')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg cursor-pointer"
                      >
                        Вернуться к теории
                      </button>
                    )}
                    {quizSummary.passed && nextStage && (
                      <button
                        type="button"
                        onClick={() => handleSelectStage(nextStage.stepNumber)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                      >
                        <span>Перейти к Этапу {nextStage.stepNumber}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Aid Zoom Lightbox */}
      {visualLightbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 flex items-center justify-center p-4"
          onClick={() => setVisualLightbox(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {visualLightbox.title}
                </div>
                <div className="text-xs text-slate-500 truncate">{visualLightbox.caption}</div>
              </div>
              <button
                type="button"
                onClick={() => setVisualLightbox(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Закрыть изображение"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={visualLightbox.src}
                alt={visualLightbox.caption}
                className="max-h-[68vh] w-auto object-contain rounded"
              />
            </div>
            <div className="px-4 py-2.5 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex items-center justify-between">
              <span>Открытый источник: {visualLightbox.attribution}</span>
              <button
                type="button"
                onClick={() => setVisualLightbox(null)}
                className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ConnectionMatchQuestionBlockProps {
  question: LearningQuestion;
  evaluation?: QuestionEvaluation;
  chosenMap: Record<string, string>;
  activeLeftId: string | null;
  onSelectLeft: (pairId: string) => void;
  onSelectRight: (rightLabel: string) => void;
  onClearPair: (pairId: string) => void;
  onCheck: () => void;
}

const ConnectionMatchQuestionBlock: React.FC<ConnectionMatchQuestionBlockProps> = ({
  question,
  evaluation,
  chosenMap,
  activeLeftId,
  onSelectLeft,
  onSelectRight,
  onClearPair,
  onCheck,
}) => {
  const pairs = useMemo(() => question.matchPairs ?? [], [question.matchPairs]);
  const shuffledRight = useMemo(
    () =>
      deterministicShuffle(
        pairs.map((p) => p.currentLabel),
        question.id
      ),
    [pairs, question.id]
  );

  const rightToIndex = useMemo(() => {
    const map: Record<string, string> = {};
    shuffledRight.forEach((lbl, idx) => {
      map[lbl] = String.fromCharCode(1040 + idx); // А, Б, В, Г
    });
    return map;
  }, [shuffledRight]);

  const allPaired = pairs.every((p) => Boolean(chosenMap[p.id]));

  return (
    <div className="space-y-3">
      {!evaluation && (
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-violet-700 shrink-0" />
          <span>
            {activeLeftId
              ? 'Теперь выберите соответствующий элемент справа:'
              : 'Нажмите на элемент слева (из пройденного материала), затем на связанный элемент справа.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Previous Stage Elements */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-500">
            Элементы предыдущего этапа
          </div>
          {pairs.map((pair, idx) => {
            const matchedRight = evaluation
              ? evaluation.chosenMatches?.[pair.id]
              : chosenMap[pair.id];
            const isLeftSelected = activeLeftId === pair.id;
            const isPairCorrect = evaluation ? matchedRight === pair.currentLabel : false;

            let cardStyle = 'bg-white border-slate-200 hover:border-blue-400';
            if (evaluation) {
              cardStyle = isPairCorrect
                ? 'bg-emerald-50 border-emerald-400'
                : 'bg-rose-50 border-rose-400';
            } else if (isLeftSelected) {
              cardStyle = 'bg-blue-50 border-blue-600 ring-1 ring-blue-600';
            } else if (matchedRight) {
              cardStyle = 'bg-violet-50/70 border-violet-300';
            }

            return (
              <div
                key={pair.id}
                className={`p-3 rounded-lg border text-xs transition-colors ${cardStyle}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    disabled={Boolean(evaluation)}
                    onClick={() => onSelectLeft(pair.id)}
                    className={`flex-1 text-left flex items-start gap-2 ${
                      evaluation ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-slate-900 leading-snug">
                      {pair.prevLabel}
                    </span>
                  </button>

                  {matchedRight && !evaluation && (
                    <button
                      type="button"
                      onClick={() => onClearPair(pair.id)}
                      className="text-[11px] font-mono font-semibold text-violet-700 hover:text-rose-700 shrink-0 cursor-pointer"
                      title="Отменить связь"
                    >
                      ↔ {rightToIndex[matchedRight]} ✕
                    </button>
                  )}
                </div>

                {matchedRight && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-700">
                    <span className="font-semibold">Ваша связь ({rightToIndex[matchedRight]}): </span>
                    {matchedRight}
                  </div>
                )}

                {evaluation && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] space-y-1">
                    {!isPairCorrect && (
                      <div className="text-emerald-800 font-semibold">
                        Верная пара: {pair.currentLabel}
                      </div>
                    )}
                    <div className="text-slate-600">{pair.rationale}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Current Stage Elements */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-500">
            Связанные структуры изучаемого этапа
          </div>
          {shuffledRight.map((rightLbl, idx) => {
            const letter = String.fromCharCode(1040 + idx);
            const linkedPairIdx = pairs.findIndex((p) => chosenMap[p.id] === rightLbl);
            const isAssigned = linkedPairIdx >= 0;

            return (
              <button
                key={rightLbl}
                type="button"
                disabled={Boolean(evaluation) || !activeLeftId}
                onClick={() => onSelectRight(rightLbl)}
                className={`w-full p-3 rounded-lg border text-left text-xs transition-colors flex items-start justify-between gap-2 ${
                  evaluation
                    ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-default'
                    : activeLeftId
                    ? 'bg-white border-blue-300 hover:bg-blue-50 text-slate-900 cursor-pointer'
                    : isAssigned
                    ? 'bg-violet-50/70 border-violet-300 text-slate-900'
                    : 'bg-slate-50/60 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono font-bold text-slate-900 shrink-0">{letter}.</span>
                  <span className="leading-snug">{rightLbl}</span>
                </div>
                {isAssigned && !evaluation && (
                  <span className="font-mono font-semibold text-violet-800 shrink-0">
                    ← {linkedPairIdx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!evaluation && (
        <div className="pt-1">
          <button
            type="button"
            disabled={!allPaired}
            onClick={onCheck}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-lg cursor-pointer"
          >
            Проверить взаимосвязи ({Object.keys(chosenMap).length}/{pairs.length})
          </button>
        </div>
      )}
    </div>
  );
};
