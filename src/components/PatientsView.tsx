import React, { useMemo, useRef, useState } from 'react';
import {
  ANATOMICAL_ZONES,
  CIRCADIAN_MAP,
  DIAPHRAGMS,
  INTAKE_DOMAIN_META,
  INTAKE_QUESTIONS,
  MERIDIANS,
  MUSCLES,
  ORGANS,
} from '../data';
import {
  IntakeDomain,
  PatientProfile,
  PatientVisitRecord,
  QuestionSeverity,
} from '../types/atlas';
import { PAIN_MARKER_META } from '../utils/painMapRecommendations';
import { describeBodySide } from '../data/musclePlateCoords';
import {
  ClinicalExportInput,
  downloadTextReport,
  exportClinicalPdf,
  formatDisplayDate,
} from '../utils/clinicalExport';
import { PatientDatabaseSnapshot } from '../utils/patientDatabase';
import {
  Calendar,
  Download,
  Edit3,
  FileDown,
  FileText,
  FolderOpen,
  History,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface PatientsViewProps {
  patients: PatientProfile[];
  visits: PatientVisitRecord[];
  activePatientId: string | null;
  onSelectPatient: (patientId: string | null) => void;
  onSavePatient: (
    data: Omit<PatientProfile, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<PatientProfile>;
  onDeletePatient: (patientId: string) => Promise<void>;
  onDeleteVisit: (visitId: string) => Promise<void>;
  onStartNewVisit: (patientId: string) => void;
  onOpenVisitInSession: (visit: PatientVisitRecord) => void;
  onImportDatabaseJson: (jsonText: string) => Promise<number>;
}

function buildExportInputFromVisit(
  patient: PatientProfile,
  visit: PatientVisitRecord
): ClinicalExportInput {
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
    const sev = visit.answers[q.id] ?? 0;
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

  let tested = 0;
  let abnormal = 0;
  let corrected = 0;
  visit.muscleQueue.forEach((mId) => {
    const rec = visit.mmtRecords[mId];
    if (!rec) return;
    if (rec.leftTone !== 'untested' || rec.rightTone !== 'untested') tested++;
    if (
      rec.leftTone === 'hypotonia' ||
      rec.leftTone === 'hypertonia' ||
      rec.rightTone === 'hypotonia' ||
      rec.rightTone === 'hypertonia'
    ) {
      abnormal++;
    }
    if (rec.correctionApplied || rec.retestNormotonia) corrected++;
  });

  return {
    patientName: patient.fullName,
    visitDate: visit.visitDate,
    specialistName: visit.specialistName,
    chiefComplaint: visit.chiefComplaint,
    complaintTimeWindow: visit.complaintTimeWindow,
    domainScores,
    positiveItems,
    suggestedMuscleIds: Array.from(suggestedMuscleIds),
    organs: ORGANS.filter((o) => organIds.has(o.id)),
    diaphragms: DIAPHRAGMS.filter((d) => diaphragmIds.has(d.id)),
    meridians: MERIDIANS.filter((m) => meridianIds.has(m.id)),
    muscleQueue: visit.muscleQueue,
    mmtRecords: visit.mmtRecords,
    painMap: visit.painMap ?? patient.painMap,
    stats: { tested, abnormal, corrected },
  };
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  visits,
  activePatientId,
  onSelectPatient,
  onSavePatient,
  onDeletePatient,
  onDeleteVisit,
  onStartNewVisit,
  onOpenVisitInSession,
  onImportDatabaseJson,
}) => {
  const [query, setQuery] = useState('');
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Муж.' | 'Жен.' | 'Не указан'>('Не указан');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [confirmDeletePatientId, setConfirmDeletePatientId] = useState<string | null>(null);
  const [confirmDeleteVisitId, setConfirmDeleteVisitId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3200);
  };

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.cardNumber ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q) ||
        (p.anamnesis ?? '').toLowerCase().includes(q)
    );
  }, [patients, query]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === activePatientId) ?? filteredPatients[0] ?? null,
    [patients, activePatientId, filteredPatients]
  );

  const selectedPatientVisits = useMemo(() => {
    if (!selectedPatient) return [];
    return visits.filter((v) => v.patientId === selectedPatient.id);
  }, [visits, selectedPatient]);

  const openCreateForm = () => {
    setEditingId(undefined);
    setFullName('');
    setBirthDate('');
    setGender('Не указан');
    setPhone('');
    setCardNumber(`К-${String(patients.length + 1).padStart(3, '0')}`);
    setAnamnesis('');
    setIsEditingForm(true);
  };

  const openEditForm = (p: PatientProfile) => {
    setEditingId(p.id);
    setFullName(p.fullName);
    setBirthDate(p.birthDate ?? '');
    setGender(p.gender ?? 'Не указан');
    setPhone(p.phone ?? '');
    setCardNumber(p.cardNumber ?? '');
    setAnamnesis(p.anamnesis ?? '');
    setIsEditingForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    const saved = await onSavePatient(
      {
        fullName: fullName.trim(),
        birthDate: birthDate.trim() || undefined,
        gender,
        phone: phone.trim() || undefined,
        cardNumber: cardNumber.trim() || undefined,
        anamnesis: anamnesis.trim() || undefined,
      },
      editingId
    );
    onSelectPatient(saved.id);
    setIsEditingForm(false);
    showStatus(editingId ? 'Карта пациента обновлена' : 'Новый пациент добавлен в базу');
  };

  const handleBackupJson = () => {
    const snapshot: PatientDatabaseSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      patients,
      visits,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KinezioAtlas_Baza_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    showStatus('Резервная копия базы пациентов (.JSON) скачана');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const added = await onImportDatabaseJson(text);
      showStatus(`База импортирована успешно (новых карт: ${added})`);
    } catch {
      showStatus('Ошибка чтения файла резервной копии JSON');
    } finally {
      e.target.value = '';
    }
  };

  const summarizeVisit = (v: PatientVisitRecord) => {
    let tested = 0;
    let abnormal = 0;
    let corrected = 0;
    v.muscleQueue.forEach((mId) => {
      const rec = v.mmtRecords[mId];
      if (!rec) return;
      if (rec.leftTone !== 'untested' || rec.rightTone !== 'untested') tested++;
      if (
        rec.leftTone === 'hypotonia' ||
        rec.leftTone === 'hypertonia' ||
        rec.rightTone === 'hypotonia' ||
        rec.rightTone === 'hypertonia'
      ) {
        abnormal++;
      }
      if (rec.correctionApplied || rec.retestNormotonia) corrected++;
    });

    const domainHits: Record<IntakeDomain, number> = {
      structural: 0,
      visceral: 0,
      emotional: 0,
      energetic: 0,
      chemical: 0,
    };
    INTAKE_QUESTIONS.forEach((q) => {
      domainHits[q.domain] += v.answers[q.id] ?? 0;
    });
    const topDomain = (Object.keys(domainHits) as IntakeDomain[]).sort(
      (a, b) => domainHits[b] - domainHits[a]
    )[0];

    return {
      tested,
      total: v.muscleQueue.length,
      abnormal,
      corrected,
      topDomainLabel: domainHits[topDomain] > 0 ? INTAKE_DOMAIN_META[topDomain].shortLabel : 'Опрос не заполнен',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            База пациентов (локальный офлайн-реестр)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Все карты, история ММТ-приёмов, время удержания мышц и планы коррекции хранятся
            локально на вашем устройстве (IndexedDB) без необходимости подключения к интернету.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBackupJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Резервная копия (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Импорт (.JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Новый пациент</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg">
          {statusMessage}
        </div>
      )}

      {/* Create / Edit Patient Modal Card */}
      {isEditingForm && (
        <form
          onSubmit={handleSubmitForm}
          className="bg-white border border-blue-300 rounded-xl p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {editingId ? 'Редактирование карты пациента' : 'Новая карта пациента'}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditingForm(false)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-5">
              <label className="block font-medium text-slate-700 mb-1">ФИО пациента *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Например: Смирнов Алексей Петрович"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">№ карты</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="К-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-medium text-slate-700 mb-1">Дата рождения</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Пол</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Муж.' | 'Жен.' | 'Не указан')}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="Не указан">Не указан</option>
                <option value="Муж.">Муж.</option>
                <option value="Жен.">Жен.</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block font-medium text-slate-700 mb-1">Телефон / Контакт</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="md:col-span-8">
              <label className="block font-medium text-slate-700 mb-1">
                Базовый анамнез, операции, противопоказания
              </label>
              <input
                type="text"
                value={anamnesis}
                onChange={(e) => setAnamnesis(e.target.value)}
                placeholder="Например: аппендэктомия (2018), сколиоз грудопоясничного перехода, аллергия на..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              Сохранить карту
            </button>
          </div>
        </form>
      )}

      {/* Main 2-Column Patient Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Пациенты ({patients.length})
              </span>
              <span className="font-mono tabular-nums text-slate-500">
                Визитов: {visits.length}
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по ФИО, карте, телефону..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  {patients.length === 0
                    ? 'В локальной базе пока нет пациентов.'
                    : 'Пациенты по запросу не найдены.'}
                </p>
                {patients.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить первого пациента</span>
                  </button>
                )}
              </div>
            ) : (
              filteredPatients.map((p) => {
                const count = visits.filter((v) => v.patientId === p.id).length;
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPatient(p.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {p.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {p.cardNumber ? `№ ${p.cardNumber}` : 'Без номера'}
                        {p.phone ? ` · ${p.phone}` : ''}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {count} приз.
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Card & Visit History */}
        <div className="lg:col-span-8 space-y-5">
          {!selectedPatient ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">Выберите или создайте пациента</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Создайте карту пациента, чтобы фиксировать динамику ММТ от приёма к приёму,
                сравнивать скорость удержания мышц и выгружать историю обследований в PDF.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Создать карту пациента</span>
              </button>
            </div>
          ) : (
            <>
              {/* Patient Profile Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      {selectedPatient.cardNumber && (
                        <span className="font-mono font-semibold text-blue-700">
                          Карта № {selectedPatient.cardNumber}
                        </span>
                      )}
                      {selectedPatient.gender && selectedPatient.gender !== 'Не указан' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{selectedPatient.gender}</span>
                        </>
                      )}
                      {selectedPatient.birthDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDisplayDate(selectedPatient.birthDate)}
                          </span>
                        </>
                      )}
                      {selectedPatient.phone && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedPatient.phone}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedPatient.fullName}</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(selectedPatient)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Изменить</span>
                    </button>

                    {confirmDeletePatientId === selectedPatient.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeletePatient(selectedPatient.id);
                            setConfirmDeletePatientId(null);
                            showStatus('Карта пациента удалена');
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                        >
                          Удалить точно
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePatientId(null)}
                          className="px-2 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePatientId(selectedPatient.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg cursor-pointer"
                        title="Удалить карту пациента"
                        aria-label="Удалить карту пациента"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onStartNewVisit(selectedPatient.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Начать приём ММТ</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-semibold text-slate-800 block mb-0.5">
                    Анамнез и базовые заметки
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedPatient.anamnesis ||
                      'Базовый анамнез не заполнен. Нажмите «Изменить», чтобы добавить операции, травмы или противопоказания.'}
                  </p>
                </div>

                {selectedPatient.painMap && selectedPatient.painMap.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        Сохранённая карта боли ({selectedPatient.painMap.length} отм.)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Автозагружается при новом приёме
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedPatient.painMap.map((pt, idx) => {
                        const m = MUSCLES.find((item) => item.id === pt.primaryMuscleId);
                        const zName =
                          ANATOMICAL_ZONES.find((z) => z.id === pt.zoneId)?.shortName ?? pt.zoneId;
                        return (
                          <div
                            key={pt.id}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-[11px]"
                          >
                            <span className={`font-semibold ${PAIN_MARKER_META[pt.type].textClass}`}>
                              {idx + 1}. [{PAIN_MARKER_META[pt.type].shortLabel}]
                            </span>{' '}
                            <span className="font-medium text-slate-800">
                              {m?.name ?? zName}
                            </span>{' '}
                            <span className="text-slate-400 font-mono tabular-nums">
                              ({describeBodySide(pt.x)}, {pt.x}:{pt.y})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Visit History */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-700" />
                    История приёмов и сеансов ММТ ({selectedPatientVisits.length})
                  </h3>
                </div>

                {selectedPatientVisits.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-xs text-slate-500">
                      У этого пациента ещё нет сохранённых приёмов. Начните сеанс «Опросник ММТ» и
                      нажмите «Сохранить в карту пациента».
                    </p>
                    <button
                      type="button"
                      onClick={() => onStartNewVisit(selectedPatient.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Провести первый приём</span>
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {selectedPatientVisits.map((v) => {
                      const stats = summarizeVisit(v);
                      return (
                        <div key={v.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/60">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="font-mono font-semibold text-slate-900">
                                  {formatDisplayDate(v.visitDate)}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="text-blue-700 font-medium">
                                  Доминанта: {stats.topDomainLabel}
                                </span>
                                {v.specialistName && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{v.specialistName}</span>
                                  </>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                                {v.chiefComplaint || 'Приём без указания жалобы'}
                              </div>
                              {v.complaintTimeWindow && CIRCADIAN_MAP[v.complaintTimeWindow] && (
                                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 inline-flex items-center gap-1.5 mt-1 font-mono tabular-nums">
                                  <span>{CIRCADIAN_MAP[v.complaintTimeWindow].practicalWindow}</span>
                                  <span>·</span>
                                  <span className="font-sans font-medium">
                                    {CIRCADIAN_MAP[v.complaintTimeWindow].organTitle}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono tabular-nums shrink-0">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                ММТ: {stats.tested}/{stats.total}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                Дисф.: {stats.abnormal}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Скорр.: {stats.corrected}
                              </span>
                              {v.painMap && v.painMap.length > 0 && (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  Точек боли: {v.painMap.length}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenVisitInSession(v)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Открыть в сеансе ММТ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  exportClinicalPdf(buildExportInputFromVisit(selectedPatient, v))
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                              >
                                <FileDown className="w-3.5 h-3.5 text-blue-700" />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadTextReport(buildExportInputFromVisit(selectedPatient, v))
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-600" />
                                <span>.TXT</span>
                              </button>
                            </div>

                            {confirmDeleteVisitId === v.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onDeleteVisit(v.id);
                                    setConfirmDeleteVisitId(null);
                                    showStatus('Запись визита удалена');
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 rounded cursor-pointer"
                                >
                                  Удалить
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteVisitId(null)}
                                  className="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded cursor-pointer"
                                >
                                  Отмена
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteVisitId(v.id)}
                                className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Удалить</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
