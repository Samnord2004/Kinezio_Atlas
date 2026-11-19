import React, { useEffect, useMemo, useState } from 'react';
import {
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_ZONES,
  CIRCADIAN_MAP,
  CIRCADIAN_SLOTS,
  INTAKE_DOMAIN_META,
  INTAKE_QUESTIONS,
  SYMPTOMS,
} from '../data';
import {
  STAGE_META,
  TimelineStageNode,
  buildClinicalCascadeTimeline,
} from '../data/complaintTimeline';
import {
  AnatomicalZoneId,
  CircadianPeriodId,
  ComplaintStageKey,
  IntakeDomain,
  PatientComplaintEvent,
  PatientProfile,
  PatientVisitRecord,
  SelectedEntity,
} from '../types/atlas';
import { CircadianClockPanel } from './CircadianClockPanel';
import { formatDisplayDate } from '../utils/clinicalExport';
import { createEntityId } from '../utils/patientDatabase';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Plus,
  Stethoscope,
  Sun,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface ComplaintTimelineViewProps {
  onOpenInAtlas: (entity: SelectedEntity) => void;
  activePatient: PatientProfile | null;
  patientVisits: PatientVisitRecord[];
  onSaveComplaintEvent?: (patientId: string, event: PatientComplaintEvent) => Promise<void>;
  onDeleteComplaintEvent?: (patientId: string, eventId: string) => Promise<void>;
  onOpenVisitInSession?: (visit: PatientVisitRecord) => void;
  onStartMmtWithSymptom?: (symptomId: string) => void;
  onOpenSymptomSearch?: (symptomId: string) => void;
  onOpenPatientsTab?: () => void;
  initialSymptomId?: string | null;
  initialCircadianPeriod?: CircadianPeriodId | null;
}

const SVG_W = 840;
const SVG_H = 220;
const PAD_L = 48;
const PAD_R = 36;
const PAD_T = 24;
const PAD_B = 34;
const PLOT_W = SVG_W - PAD_L - PAD_R;
const PLOT_H = SVG_H - PAD_T - PAD_B;

function buildSmoothPolyline(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return '';
  return coords.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export const ComplaintTimelineView: React.FC<ComplaintTimelineViewProps> = ({
  onOpenInAtlas,
  activePatient,
  patientVisits,
  onSaveComplaintEvent,
  onDeleteComplaintEvent,
  onOpenVisitInSession,
  onStartMmtWithSymptom,
  onOpenSymptomSearch,
  onOpenPatientsTab,
  initialSymptomId,
  initialCircadianPeriod,
}) => {
  const [zoneFilter, setZoneFilter] = useState<AnatomicalZoneId | 'all'>('all');
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>(
    initialSymptomId ?? SYMPTOMS[0].id
  );
  const [activeStageIndex, setActiveStageIndex] = useState<number>(2);
  const [viewMode, setViewMode] = useState<'circadian' | 'cascade' | 'patient'>(
    initialCircadianPeriod ? 'circadian' : 'circadian'
  );
  const [selectedCircadianPeriod, setSelectedCircadianPeriod] = useState<CircadianPeriodId>(
    initialCircadianPeriod ?? '06-09'
  );

  // New complaint timeline event form
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [eventStage, setEventStage] = useState<ComplaintStageKey>('subacute');
  const [eventCircadianPeriod, setEventCircadianPeriod] = useState<CircadianPeriodId | ''>('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventSymptomId, setEventSymptomId] = useState<string>(SYMPTOMS[0].id);
  const [eventIntensity, setEventIntensity] = useState<number>(6);
  const [eventNote, setEventNote] = useState('');

  useEffect(() => {
    if (initialSymptomId && SYMPTOMS.some((s) => s.id === initialSymptomId)) {
      setSelectedSymptomId(initialSymptomId);
      setZoneFilter('all');
      const sym = SYMPTOMS.find((s) => s.id === initialSymptomId);
      if (sym?.timeProfile.circadianPeriods[0]) {
        setSelectedCircadianPeriod(sym.timeProfile.circadianPeriods[0]);
      }
    }
  }, [initialSymptomId]);

  useEffect(() => {
    if (initialCircadianPeriod) {
      setSelectedCircadianPeriod(initialCircadianPeriod);
      setViewMode('circadian');
    }
  }, [initialCircadianPeriod]);

  const filteredSymptoms = useMemo(() => {
    if (zoneFilter === 'all') return SYMPTOMS;
    return SYMPTOMS.filter((s) => s.zone === zoneFilter);
  }, [zoneFilter]);

  const activeSymptom = useMemo(() => {
    return (
      filteredSymptoms.find((s) => s.id === selectedSymptomId) ??
      SYMPTOMS.find((s) => s.id === selectedSymptomId) ??
      filteredSymptoms[0] ??
      SYMPTOMS[0]
    );
  }, [filteredSymptoms, selectedSymptomId]);

  const stages: TimelineStageNode[] = useMemo(
    () => buildClinicalCascadeTimeline(activeSymptom),
    [activeSymptom]
  );

  const activeStage = stages[activeStageIndex] ?? stages[0];

  // Coordinates for the 3-curve SVG physiological dynamics chart
  const chartGeometry = useMemo(() => {
    const n = stages.length;
    const xAt = (i: number) =>
      n <= 1 ? PAD_L : PAD_L + (i / (n - 1)) * PLOT_W;
    const yAt = (val: number) =>
      PAD_T + PLOT_H - (Math.max(0, Math.min(100, val)) / 100) * PLOT_H;

    const painPts = stages.map((st, i) => ({ x: xAt(i), y: yAt(st.painIndex), val: st.painIndex }));
    const compPts = stages.map((st, i) => ({
      x: xAt(i),
      y: yAt(st.compensationLoad),
      val: st.compensationLoad,
    }));
    const sysPts = stages.map((st, i) => ({
      x: xAt(i),
      y: yAt(st.systemicLoad),
      val: st.systemicLoad,
    }));

    return { xAt, yAt, painPts, compPts, sysPts };
  }, [stages]);

  // Combined patient chronological entries (events + visits)
  const patientChronology = useMemo(() => {
    if (!activePatient) return [];

    type ChronologyEntry =
      | {
          kind: 'event';
          id: string;
          date: string;
          event: PatientComplaintEvent;
        }
      | {
          kind: 'visit';
          id: string;
          date: string;
          visit: PatientVisitRecord;
          abnormalCount: number;
          correctedCount: number;
          testedCount: number;
          avgHoldSec: number | null;
          topDomainLabel: string;
        };

    const items: ChronologyEntry[] = [];

    (activePatient.complaintsTimeline ?? []).forEach((ev) => {
      items.push({ kind: 'event', id: ev.id, date: ev.eventDate, event: ev });
    });

    patientVisits.forEach((v) => {
      let testedCount = 0;
      let abnormalCount = 0;
      let correctedCount = 0;
      const holdSamples: number[] = [];

      v.muscleQueue.forEach((mId) => {
        const rec = v.mmtRecords[mId];
        if (!rec) return;
        if (rec.leftTone !== 'untested' || rec.rightTone !== 'untested') testedCount++;
        if (
          rec.leftTone === 'hypotonia' ||
          rec.leftTone === 'hypertonia' ||
          rec.rightTone === 'hypotonia' ||
          rec.rightTone === 'hypertonia'
        ) {
          abnormalCount++;
        }
        if (rec.correctionApplied || rec.retestNormotonia) correctedCount++;
        if (rec.holdTimeLeftSec !== undefined) holdSamples.push(rec.holdTimeLeftSec);
        if (rec.holdTimeRightSec !== undefined) holdSamples.push(rec.holdTimeRightSec);
      });

      const domainScores: Record<IntakeDomain, number> = {
        structural: 0,
        visceral: 0,
        emotional: 0,
        energetic: 0,
        chemical: 0,
      };
      INTAKE_QUESTIONS.forEach((q) => {
        domainScores[q.domain] += v.answers[q.id] ?? 0;
      });
      const topDomain = (Object.keys(domainScores) as IntakeDomain[]).sort(
        (a, b) => domainScores[b] - domainScores[a]
      )[0];

      const avgHoldSec =
        holdSamples.length > 0
          ? Number(
              (holdSamples.reduce((sum, x) => sum + x, 0) / holdSamples.length).toFixed(1)
            )
          : null;

      items.push({
        kind: 'visit',
        id: v.id,
        date: v.visitDate,
        visit: v,
        abnormalCount,
        correctedCount,
        testedCount,
        avgHoldSec,
        topDomainLabel:
          domainScores[topDomain] > 0 ? INTAKE_DOMAIN_META[topDomain].shortLabel : 'Без опросника',
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [activePatient, patientVisits]);

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !onSaveComplaintEvent || !eventTitle.trim()) return;
    const newEvent: PatientComplaintEvent = {
      id: createEntityId('cmp'),
      eventDate,
      stage: eventStage,
      circadianPeriod: eventCircadianPeriod || undefined,
      title: eventTitle.trim(),
      symptomId: eventSymptomId || undefined,
      intensity: eventIntensity,
      bodyProcessesNote: eventNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await onSaveComplaintEvent(activePatient.id, newEvent);
    setEventTitle('');
    setEventNote('');
    setEventCircadianPeriod('');
    setIsAddingEvent(false);
    // Sync timeline stage with newly added event stage
    const stageIdx = stages.findIndex((s) => s.key === eventStage);
    if (stageIdx >= 0) setActiveStageIndex(stageIdx);
    if (eventSymptomId) setSelectedSymptomId(eventSymptomId);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 text-balance">
              Временная шкала клинических жалоб и процессов в организме
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Пошаговая модель развития жалобы от острого болевого триггера до фасциальной,
              висцеральной и системной перестройки организма — с контролем процессов по этапам и
              личной хронологией пациента.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('circadian')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'circadian'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Часы суток (24 ч)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cascade')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'cascade'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Этапы развития (6 фаз)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('patient')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'patient'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Хронология пациента
                {activePatient ? ` (${patientChronology.length})` : ''}
              </span>
            </button>
          </div>
        </div>

        {viewMode !== 'patient' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 mr-1">Быстрый разбор жалоб:</span>
            {[
              { id: 'tinnitus-ear-ringing', label: 'Шум (писк) в ушах' },
              { id: 'knee-joint-clicking', label: 'Щелчки в колене' },
              { id: 'ankle-joint-clicking', label: 'Щелчки в голеностопе' },
              { id: 'wrist-hand-clicking', label: 'Щелчки в кисти' },
              { id: 'elbow-joint-clicking', label: 'Щелчки в локте' },
              { id: 'low-back-pain-lumbar', label: 'Боль в пояснице' },
            ].map((item) => {
              const targetSym = SYMPTOMS.find((s) => s.id === item.id);
              if (!targetSym) return null;
              const isSelected = viewMode === 'cascade' && activeSymptom.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedSymptomId(item.id);
                    setZoneFilter('all');
                    if (targetSym.timeProfile.circadianPeriods[0]) {
                      setSelectedCircadianPeriod(targetSym.timeProfile.circadianPeriods[0]);
                    }
                    setViewMode('cascade');
                  }}
                  className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-700 font-medium'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Complaint / Symptom Selector Bar (shown in cascade mode) */}
        {viewMode === 'cascade' && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              <div className="lg:col-span-4">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Анатомическая зона
                </label>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value as AnatomicalZoneId | 'all')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="all">Все анатомические зоны ({SYMPTOMS.length} жалоб)</option>
                  {ANATOMICAL_DIVISIONS.map((div) => (
                    <optgroup key={div.id} label={`${div.code} · ${div.shortTitle}`}>
                      {ANATOMICAL_ZONES.filter((z) => z.division === div.id).map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.classifierCode} — {z.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-6">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Клиническая жалоба / симптомокомплекс для анализа процессов
                </label>
                <select
                  value={activeSymptom.id}
                  onChange={(e) => setSelectedSymptomId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-medium text-slate-900"
                >
                  {filteredSymptoms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2 flex items-end justify-end pt-3 lg:pt-4">
                {onStartMmtWithSymptom && (
                  <button
                    type="button"
                    onClick={() => onStartMmtWithSymptom(activeSymptom.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>На приём ММТ</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <strong className="text-amber-900">
                  Время возникновения дискомфорта ({activeSymptom.timeProfile.peakWindow}):
                </strong>{' '}
                <span className="text-slate-700">
                  {activeSymptom.timeProfile.organClockInterpretation}
                </span>
              </div>
              {activeSymptom.timeProfile.circadianPeriods[0] && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCircadianPeriod(activeSymptom.timeProfile.circadianPeriods[0]);
                    setViewMode('circadian');
                  }}
                  className="text-blue-700 hover:underline font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Открыть на часах 24ч →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==================== VIEW 0: 24-HOUR CIRCADIAN ORGAN CLOCK ==================== */}
      {viewMode === 'circadian' && (
        <CircadianClockPanel
          selectedPeriodId={selectedCircadianPeriod}
          onSelectPeriod={setSelectedCircadianPeriod}
          onOpenInAtlas={onOpenInAtlas}
          onSelectSymptomForCascade={(symptomId) => {
            setSelectedSymptomId(symptomId);
            setZoneFilter('all');
            setViewMode('cascade');
          }}
          onOpenSymptomSearch={onOpenSymptomSearch}
          onStartMmtWithSymptom={onStartMmtWithSymptom}
        />
      )}

      {/* ==================== VIEW 1: PHYSIOLOGICAL CASCADE TIMELINE ==================== */}
      {viewMode === 'cascade' && (
        <div className="space-y-6">
          {/* Interactive Timeline Axis + Multi-System Dynamics Curve */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Динамика системной нагрузки во времени · {activeSymptom.title}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mt-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-rose-600 inline-block" />
                    Болевой / ноцицептивный сигнал
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-700 inline-block" />
                    Компенсация цепей и триггеров
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dotted border-emerald-600 inline-block" />
                    Висцеро-вегетативная и биохим. нагрузка
                  </span>
                </div>
              </div>

              {/* Active Stage Numerical Telemetry HUD */}
              <div className="flex items-center gap-4 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-400 block">БОЛЬ</span>
                  <span className="font-bold text-rose-700">{activeStage.painIndex}%</span>
                </div>
                <span className="text-slate-300">|</span>
                <div>
                  <span className="text-[10px] text-slate-400 block">КОМПЕНС.</span>
                  <span className="font-bold text-blue-700">{activeStage.compensationLoad}%</span>
                </div>
                <span className="text-slate-300">|</span>
                <div>
                  <span className="text-[10px] text-slate-400 block">ВИСЦЕРА</span>
                  <span className="font-bold text-emerald-700">{activeStage.systemicLoad}%</span>
                </div>
              </div>
            </div>

            {/* SVG Timeline Curve Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full min-w-[620px] h-52 select-none"
                role="img"
                aria-label="График развития клинических процессов во времени"
              >
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = chartGeometry.yAt(val);
                  return (
                    <g key={val}>
                      <line
                        x1={PAD_L}
                        y1={y}
                        x2={SVG_W - PAD_R}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                      />
                      <text
                        x={PAD_L - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fill="#64748b"
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Selected Stage Vertical Hairline */}
                <line
                  x1={chartGeometry.xAt(activeStageIndex)}
                  y1={PAD_T - 6}
                  x2={chartGeometry.xAt(activeStageIndex)}
                  y2={SVG_H - PAD_B + 6}
                  stroke="#1d4ed8"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />

                {/* Paths */}
                <path
                  d={buildSmoothPolyline(chartGeometry.sysPts)}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="3 4"
                />
                <path
                  d={buildSmoothPolyline(chartGeometry.compPts)}
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                />
                <path
                  d={buildSmoothPolyline(chartGeometry.painPts)}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth={3}
                />

                {/* Clickable Stage Columns & Points */}
                {stages.map((st, idx) => {
                  const x = chartGeometry.xAt(idx);
                  const isActive = idx === activeStageIndex;
                  const pPt = chartGeometry.painPts[idx];
                  const cPt = chartGeometry.compPts[idx];
                  const sPt = chartGeometry.sysPts[idx];

                  return (
                    <g
                      key={st.key}
                      onClick={() => setActiveStageIndex(idx)}
                      className="cursor-pointer"
                    >
                      {/* Invisible wider hit zone */}
                      <rect
                        x={x - PLOT_W / (stages.length * 2)}
                        y={0}
                        width={PLOT_W / stages.length}
                        height={SVG_H}
                        fill="transparent"
                      />

                      <circle
                        cx={sPt.x}
                        cy={sPt.y}
                        r={isActive ? 6 : 4}
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <circle
                        cx={cPt.x}
                        cy={cPt.y}
                        r={isActive ? 6 : 4}
                        fill="#1d4ed8"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <circle
                        cx={pPt.x}
                        cy={pPt.y}
                        r={isActive ? 7 : 4.5}
                        fill="#e11d48"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />

                      <text
                        x={x}
                        y={SVG_H - 10}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={isActive ? 700 : 500}
                        fill={isActive ? '#1d4ed8' : '#475569'}
                      >
                        {st.timeframe}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive 6-Stage Stepper Timeline Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-200">
              {stages.map((st, idx) => {
                const isActive = idx === activeStageIndex;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setActiveStageIndex(idx)}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-mono tabular-nums ${
                        isActive ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      0{st.order}. {st.timeframe}
                    </div>
                    <div className="text-xs font-semibold leading-snug mt-0.5 line-clamp-2">
                      {st.shortTitle.includes('·')
                        ? st.shortTitle.split('·')[1].trim()
                        : st.shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Deep Process Inspector */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-blue-700">
                    Этап 0{activeStage.order} · {activeStage.timeframe}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Ожидаемое удержание ММТ: {activeStage.expectedHoldSec}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{activeStage.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {activeStage.clinicalState}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={activeStageIndex === 0}
                  onClick={() => setActiveStageIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Ранее</span>
                </button>
                <button
                  type="button"
                  disabled={activeStageIndex === stages.length - 1}
                  onClick={() => setActiveStageIndex((i) => Math.min(stages.length - 1, i + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  <span>Далее</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Physiological Process Layers */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>Какие процессы происходят в организме на этом этапе</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStage.processes.map((proc) => (
                  <div
                    key={proc.system}
                    className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5"
                  >
                    <div className="text-[11px] font-semibold text-blue-700">{proc.system}</div>
                    <div className="text-sm font-bold text-slate-900">{proc.summary}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{proc.mechanism}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Anatomical Entities + Practitioner Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              <div className="lg:col-span-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Вовлечённые структуры (переход в Атлас)
                </div>

                {activeStage.linkedMuscles.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">Мышцы-индикаторы и антагонисты:</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {activeStage.linkedMuscles.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'muscle', id: m.id })}
                          className="inline-flex items-center gap-0.5 text-blue-700 hover:underline font-medium cursor-pointer"
                        >
                          <span>{m.name}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeStage.linkedOrgans.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">Органы и висцеральные связи:</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {activeStage.linkedOrgans.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'organ', id: o.id })}
                          className="inline-flex items-center gap-0.5 text-emerald-700 hover:underline font-medium cursor-pointer"
                        >
                          <span>{o.name}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeStage.linkedDiaphragms.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">Диафрагмы:</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {activeStage.linkedDiaphragms.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'diaphragm', id: d.id })}
                          className="inline-flex items-center gap-0.5 text-amber-700 hover:underline font-medium cursor-pointer"
                        >
                          <span>{d.name.split('(')[0].trim()}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(activeStage.linkedMeridians.length > 0 || activeStage.linkedChains.length > 0) && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">Меридианы и фасциальные цепи:</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {activeStage.linkedMeridians.map((mer) => (
                        <button
                          key={mer.id}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'meridian', id: mer.id })}
                          className="inline-flex items-center gap-0.5 text-rose-700 hover:underline font-medium cursor-pointer"
                        >
                          <span>{mer.code} {mer.name}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                      {activeStage.linkedChains.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => onOpenInAtlas({ type: 'chain', id: ch.id })}
                          className="inline-flex items-center gap-0.5 text-violet-700 hover:underline font-medium cursor-pointer"
                        >
                          <span>{ch.name}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-6 p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-2.5 text-xs">
                <div className="font-semibold text-blue-900">
                  Тактика специалиста на этапе «{activeStage.timeframe}»
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-700 leading-relaxed">
                  {activeStage.practitionerFocus.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: PATIENT PERSONAL TIMELINE ==================== */}
      {viewMode === 'patient' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          {!activePatient ? (
            <div className="py-10 text-center space-y-3">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">
                Активный пациент не выбран
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Выберите пациента в локальной базе, чтобы фиксировать историю возникновения его
                жалоб, видеть хронологию приёмов ММТ и отслеживать восстановление процессов во
                времени.
              </p>
              {onOpenPatientsTab && (
                <button
                  type="button"
                  onClick={onOpenPatientsTab}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  <span>Выбрать пациента в базе</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">
                    Персональная шкала жалоб и динамики · Карта{' '}
                    {activePatient.cardNumber ?? 'б/н'}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{activePatient.fullName}</h2>
                </div>

                {onSaveComplaintEvent && (
                  <button
                    type="button"
                    onClick={() => setIsAddingEvent((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить эпизод жалобы</span>
                  </button>
                )}
              </div>

              {/* Add Complaint Event Form */}
              {isAddingEvent && (
                <form
                  onSubmit={handleAddEventSubmit}
                  className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-3 text-xs"
                >
                  <div className="font-semibold text-slate-900">
                    Новый эпизод на временной шкале пациента
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-slate-600 font-medium mb-1">Дата эпизода</label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-slate-600 font-medium mb-1">
                        Стадия процесса на момент события
                      </label>
                      <select
                        value={eventStage}
                        onChange={(e) => setEventStage(e.target.value as ComplaintStageKey)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                      >
                        {(Object.keys(STAGE_META) as ComplaintStageKey[]).map((key) => (
                          <option key={key} value={key}>
                            {STAGE_META[key].shortLabel} — {STAGE_META[key].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <label className="block text-slate-600 font-medium mb-1">
                        Связь со справочником симптомов
                      </label>
                      <select
                        value={eventSymptomId}
                        onChange={(e) => setEventSymptomId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                      >
                        <option value="">Без привязки</option>
                        {SYMPTOMS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-8">
                      <label className="block text-slate-600 font-medium mb-1">
                        Жалоба, триггер или событие *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Например: Прострел в пояснице после подъёма тяжести / начало бруксизма..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-slate-600 font-medium mb-1">
                        Время суток (когда возникает)
                      </label>
                      <select
                        value={eventCircadianPeriod}
                        onChange={(e) =>
                          setEventCircadianPeriod(e.target.value as CircadianPeriodId | '')
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                      >
                        <option value="">Не привязано ко времени</option>
                        {CIRCADIAN_SLOTS.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.hoursLabel} — {slot.organTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-slate-600 font-medium mb-1">
                        Интенсивность (ВАШ): {eventIntensity}/10
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={eventIntensity}
                        onChange={(e) => setEventIntensity(Number(e.target.value))}
                        className="w-full accent-rose-600 mt-1 cursor-pointer"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-slate-600 font-medium mb-1">
                        Какие процессы выявлены / примечание
                      </label>
                      <input
                        type="text"
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        placeholder="Например: перегружен желудок/квадратная..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="px-3 py-1.5 text-slate-600 bg-white border border-slate-200 rounded-md cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer"
                    >
                      Сохранить в шкалу
                    </button>
                  </div>
                </form>
              )}

              {/* Chronological Timeline List */}
              {patientChronology.length === 0 ? (
                <div className="p-8 text-center border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600">
                    На временной шкале пациента пока нет записей. Добавьте эпизод жалобы или
                    сохраните приём в разделе «Анамнез и ММТ».
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4">
                  {/* Vertical timeline spine */}
                  <div
                    aria-hidden="true"
                    className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-200"
                  />

                  {patientChronology.map((entry) => {
                    if (entry.kind === 'event') {
                      const ev = entry.event;
                      const stageMeta = STAGE_META[ev.stage];
                      const linkedSym = ev.symptomId
                        ? SYMPTOMS.find((s) => s.id === ev.symptomId)
                        : undefined;
                      return (
                        <div key={entry.id} className="relative">
                          <span
                            aria-hidden="true"
                            className="absolute -left-[19px] top-4 w-2.5 h-2.5 rounded-full bg-amber-600 border-2 border-white"
                          />
                          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/40 space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 text-slate-500">
                                <span className="font-mono font-semibold text-slate-900">
                                  {formatDisplayDate(ev.eventDate)}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-amber-800">
                                  {stageMeta.shortLabel}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-rose-700 font-semibold">
                                  ВАШ {ev.intensity}/10
                                </span>
                                {ev.circadianPeriod && CIRCADIAN_MAP[ev.circadianPeriod] && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCircadianPeriod(ev.circadianPeriod!);
                                        setViewMode('circadian');
                                      }}
                                      className="font-mono text-blue-700 hover:underline cursor-pointer"
                                    >
                                      {CIRCADIAN_MAP[ev.circadianPeriod].hoursLabel} (
                                      {CIRCADIAN_MAP[ev.circadianPeriod].organTitle})
                                    </button>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {linkedSym && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSymptomId(linkedSym.id);
                                      setActiveStageIndex(stageMeta.order - 1);
                                      setViewMode('cascade');
                                    }}
                                    className="text-blue-700 hover:underline font-medium cursor-pointer"
                                  >
                                    Процессы в организме →
                                  </button>
                                )}
                                {onDeleteComplaintEvent && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteComplaintEvent(activePatient.id, ev.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    aria-label="Удалить событие"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-sm font-bold text-slate-900">{ev.title}</div>
                            {ev.bodyProcessesNote && (
                              <p className="text-slate-600 leading-relaxed">
                                {ev.bodyProcessesNote}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Visit entry
                    const v = entry.visit;
                    return (
                      <div key={entry.id} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -left-[19px] top-4 w-2.5 h-2.5 rounded-full bg-blue-700 border-2 border-white"
                        />
                        <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-slate-500">
                              <span className="font-mono font-semibold text-slate-900">
                                {formatDisplayDate(v.visitDate)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-blue-700">
                                Приём ММТ · Доминанта: {entry.topDomainLabel}
                              </span>
                              {v.specialistName && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{v.specialistName}</span>
                                </>
                              )}
                            </div>

                            {onOpenVisitInSession && (
                              <button
                                type="button"
                                onClick={() => onOpenVisitInSession(v)}
                                className="text-blue-700 hover:underline font-medium cursor-pointer"
                              >
                                Открыть визит →
                              </button>
                            )}
                          </div>

                          <div className="text-sm font-bold text-slate-900">
                            {v.chiefComplaint || 'Приём без указания жалобы'}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-slate-600">
                            <span>Протестировано: {entry.testedCount}/{v.muscleQueue.length}</span>
                            <span className="text-rose-700">Дисфункций ММТ: {entry.abnormalCount}</span>
                            <span className="text-emerald-700">Скорректировано: {entry.correctedCount}</span>
                            {entry.avgHoldSec !== null && (
                              <span className="text-blue-700">
                                Сред. удержание: {entry.avgHoldSec} с
                              </span>
                            )}
                            {v.painMap && v.painMap.length > 0 && (
                              <span className="text-amber-700">
                                Отметок на карте боли: {v.painMap.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
