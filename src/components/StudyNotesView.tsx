import React, { useEffect, useMemo, useState } from 'react';
import { LEARNING_CURRICULUM } from '../data';
import { StudyNote } from '../types/atlas';
import {
  STUDY_NOTES_UPDATED_EVENT,
  STUDY_NOTE_TAGS,
  loadStudyNotes,
  saveStudyNotes,
} from '../utils/studyNotesStore';
import { createEntityId } from '../utils/patientDatabase';
import {
  Bookmark,
  Check,
  Download,
  Edit3,
  FileText,
  NotebookPen,
  Pin,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

export const StudyNotesView: React.FC = () => {
  const [notes, setNotes] = useState<StudyNote[]>(() => loadStudyNotes());
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<number | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<StudyNote['tag'] | 'all'>('all');

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    () => loadStudyNotes()[0]?.id ?? null
  );
  const [isEditing, setIsEditing] = useState(false);

  // Draft editor state
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftStage, setDraftStage] = useState<number | ''>('');
  const [draftTag, setDraftTag] = useState<StudyNote['tag']>('Теория ММТ');
  const [draftPinned, setDraftPinned] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setNotes(loadStudyNotes());
    window.addEventListener(STUDY_NOTES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(STUDY_NOTES_UPDATED_EVENT, refresh);
  }, []);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...notes]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      })
      .filter((n) => {
        if (stageFilter !== 'all' && n.stageNumber !== stageFilter) return false;
        if (tagFilter !== 'all' && n.tag !== tagFilter) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tag.toLowerCase().includes(q)
        );
      });
  }, [notes, query, stageFilter, tagFilter]);

  const activeNote = useMemo(
    () =>
      filteredNotes.find((n) => n.id === selectedNoteId) ?? filteredNotes[0] ?? null,
    [filteredNotes, selectedNoteId]
  );

  const startNewNote = () => {
    setDraftId(undefined);
    setDraftTitle('');
    setDraftContent('');
    setDraftStage(stageFilter === 'all' ? '' : stageFilter);
    setDraftTag(tagFilter === 'all' ? 'Теория ММТ' : tagFilter);
    setDraftPinned(false);
    setIsEditing(true);
  };

  const startEditNote = (note: StudyNote) => {
    setDraftId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setDraftStage(note.stageNumber ?? '');
    setDraftTag(note.tag);
    setDraftPinned(note.pinned);
    setIsEditing(true);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim() && !draftContent.trim()) return;
    const now = new Date().toISOString();

    let updated: StudyNote[];
    let savedId: string;
    if (draftId) {
      savedId = draftId;
      updated = notes.map((n) =>
        n.id === draftId
          ? {
              ...n,
              title: draftTitle.trim() || 'Заметка без названия',
              content: draftContent.trim(),
              stageNumber: draftStage === '' ? undefined : Number(draftStage),
              tag: draftTag,
              pinned: draftPinned,
              updatedAt: now,
            }
          : n
      );
    } else {
      const created: StudyNote = {
        id: createEntityId('note'),
        title: draftTitle.trim() || 'Новая учебная заметка',
        content: draftContent.trim(),
        stageNumber: draftStage === '' ? undefined : Number(draftStage),
        tag: draftTag,
        pinned: draftPinned,
        createdAt: now,
        updatedAt: now,
      };
      savedId = created.id;
      updated = [created, ...notes];
    }

    setNotes(updated);
    saveStudyNotes(updated);
    setSelectedNoteId(savedId);
    setIsEditing(false);
  };

  const handleTogglePin = (note: StudyNote) => {
    const updated = notes.map((n) =>
      n.id === note.id
        ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
        : n
    );
    setNotes(updated);
    saveStudyNotes(updated);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    saveStudyNotes(updated);
    setConfirmDeleteId(null);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(updated[0]?.id ?? null);
    }
  };

  const handleExportNotesTxt = () => {
    const lines: string[] = [
      'КОНСПЕКТ СПЕЦИАЛИСТА — КИНЕЗИОАТЛАС',
      `Дата выгрузки: ${new Date().toLocaleDateString('ru-RU')}`,
      `Всего записей: ${filteredNotes.length}`,
      '================================================================',
      '',
    ];

    filteredNotes.forEach((n, idx) => {
      const stName = n.stageNumber
        ? LEARNING_CURRICULUM.find((s) => s.stepNumber === n.stageNumber)?.title
        : null;
      lines.push(`${idx + 1}. ${n.title}`);
      lines.push(
        `Категория: ${n.tag}${n.stageNumber ? ` · Этап ${n.stageNumber} (${stName ?? ''})` : ''}${
          n.pinned ? ' · Закреплено' : ''
        }`
      );
      lines.push('-'.repeat(48));
      lines.push(n.content);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinezioatlas_conspect_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">Обучение</span>
            <span aria-hidden="true">·</span>
            <span>Личный клинический блокнот специалиста (офлайн)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Конспект для заметок по курсу и практике
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Фиксируйте клинические правила, собственные векторы тестов, схемы взаимосвязей и
            разборы случаев. Записи автоматически сохраняются локально и доступны для экспорта.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportNotesTxt}
            disabled={filteredNotes.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" />
            <span>Экспорт .TXT</span>
          </button>

          <button
            type="button"
            onClick={startNewNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Новая заметка</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
              stageFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Все этапы
          </button>
          {LEARNING_CURRICULUM.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStageFilter(st.stepNumber)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                stageFilter === st.stepNumber
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Этап {st.stepNumber}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value as StudyNote['tag'] | 'all')}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="all">Все разделы заметок</option>
            {STUDY_NOTE_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по заметкам..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Записи в конспекте ({filteredNotes.length})</span>
            <span>Закреплённые сверху</span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-sm text-slate-500">
              <NotebookPen className="w-7 h-7 text-slate-300 mx-auto" />
              <p>По выбранному фильтру заметок нет.</p>
              <button
                type="button"
                onClick={startNewNote}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                Создать новую заметку
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredNotes.map((note) => {
                const isSelected = !isEditing && activeNote?.id === note.id;
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setIsEditing(false);
                    }}
                    className={`w-full px-4 py-3.5 text-left transition-colors cursor-pointer space-y-1 ${
                      isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-medium text-blue-700">
                        {note.tag}
                        {note.stageNumber ? ` · Этап ${note.stageNumber}` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        {note.pinned && <Pin className="w-3 h-3 text-amber-600" />}
                        {new Date(note.updatedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {note.title}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {note.content}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail / Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          {isEditing ? (
            <form onSubmit={handleSaveDraft} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  {draftId ? 'Редактирование заметки' : 'Новая запись в конспект'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Заголовок заметки
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Например: Алгоритм дифференциации ТЛ на желудок и печень"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Привязка к этапу курса
                  </label>
                  <select
                    value={draftStage}
                    onChange={(e) =>
                      setDraftStage(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">Без привязки к конкретному этапу</option>
                    {LEARNING_CURRICULUM.map((st) => (
                      <option key={st.id} value={st.stepNumber}>
                        Этап {st.stepNumber}: {st.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Категория конспекта
                  </label>
                  <select
                    value={draftTag}
                    onChange={(e) => setDraftTag(e.target.value as StudyNote['tag'])}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {STUDY_NOTE_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Текст конспекта
                </label>
                <textarea
                  rows={10}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Запишите важные связи, углы вектора ММТ, комбинации точек, выводы после практики..."
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftPinned}
                    onChange={(e) => setDraftPinned(e.target.checked)}
                    className="rounded border-slate-300 text-blue-700"
                  />
                  <span>Закрепить вверху конспекта</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Сохранить в конспект</span>
                  </button>
                </div>
              </div>
            </form>
          ) : activeNote ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-blue-700">{activeNote.tag}</span>
                    {activeNote.stageNumber && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          Этап {activeNote.stageNumber}:{' '}
                          {LEARNING_CURRICULUM.find(
                            (s) => s.stepNumber === activeNote.stageNumber
                          )?.title ?? ''}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Обновлено {new Date(activeNote.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeNote.title}</h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(activeNote)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      activeNote.pinned
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{activeNote.pinned ? 'Закреплено' : 'Закрепить'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startEditNote(activeNote)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Изменить</span>
                  </button>

                  {confirmDeleteId === activeNote.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(activeNote.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                      >
                        Удалить
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(activeNote.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Удалить заметку"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl whitespace-pre-wrap text-sm text-slate-800 leading-relaxed min-h-[260px]">
                {activeNote.content}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">
                Выберите заметку слева или создайте новую запись
              </div>
              <button
                type="button"
                onClick={startNewNote}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Добавить заметку</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
