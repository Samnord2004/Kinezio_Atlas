import { StudyNote } from '../types/atlas';
import { createEntityId } from './patientDatabase';

const LS_STUDY_NOTES_KEY = 'kinezioatlas_study_notes_v1';
export const STUDY_NOTES_UPDATED_EVENT = 'kinezioatlas:study-notes-updated';

export const STUDY_NOTE_TAGS: ReadonlyArray<StudyNote['tag']> = [
  'Теория ММТ',
  'Взаимосвязи',
  'Клинический случай',
  'Точки и мудры',
  'Общее',
];

const STARTER_NOTES: StudyNote[] = [
  {
    id: 'note-starter-mmt',
    title: 'Чек-лист чистоты ММТ перед сеансом',
    content:
      '1. Проверить нормотонию и способность к торможению (сближение веретён) выбранной индикаторной мышцы.\n2. Проверить переключение KI-27 под ключицами и пупок.\n3. Жёстко стабилизировать таз или лопатку — давление нарастает плавно (1–1.5 с), удержание 4–5 секунд по таймеру.',
    stageNumber: 1,
    tag: 'Теория ММТ',
    pinned: true,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'note-starter-clock',
    title: 'Связка «Время жалобы → Орган → Мышца → Мудра»',
    content:
      'Утренний дискомфорт с 06:00 до 08:30–09:00 → Желудок (ST) → Ключичная порция БГМ (PMC) → НЛ 5-е межреберье слева → Притхви-мудра / ST-36, ST-41.\nНочное пробуждение 01:00–03:00 → Печень (LR) → Грудинная БГМ (PMS) → НЛ 5-е межреберье справа → Апана/Сурья-мудра.',
    stageNumber: 5,
    tag: 'Взаимосвязи',
    pinned: false,
    createdAt: '2026-01-16T10:00:00.000Z',
    updatedAt: '2026-01-16T10:00:00.000Z',
  },
];

export function loadStudyNotes(): StudyNote[] {
  try {
    const raw = localStorage.getItem(LS_STUDY_NOTES_KEY);
    if (!raw) return STARTER_NOTES;
    const parsed = JSON.parse(raw) as StudyNote[];
    return Array.isArray(parsed) ? parsed : STARTER_NOTES;
  } catch {
    return STARTER_NOTES;
  }
}

export function saveStudyNotes(notes: StudyNote[]): void {
  try {
    localStorage.setItem(LS_STUDY_NOTES_KEY, JSON.stringify(notes));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STUDY_NOTES_UPDATED_EVENT));
    }
  } catch {
    // ignore storage errors
  }
}

export function appendStudyNote(input: {
  title: string;
  content: string;
  stageNumber?: number;
  tag?: StudyNote['tag'];
  pinned?: boolean;
}): StudyNote {
  const now = new Date().toISOString();
  const note: StudyNote = {
    id: createEntityId('note'),
    title: input.title.trim() || 'Новая заметка',
    content: input.content.trim(),
    stageNumber: input.stageNumber,
    tag: input.tag ?? 'Теория ММТ',
    pinned: Boolean(input.pinned),
    createdAt: now,
    updatedAt: now,
  };
  const current = loadStudyNotes();
  saveStudyNotes([note, ...current]);
  return note;
}
