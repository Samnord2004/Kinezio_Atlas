import React, { useEffect, useState } from 'react';
import { DirectoryEntryOverride, EditableDirectorySection } from '../types/atlas';
import {
  EDITABLE_FIELD_SCHEMAS,
  SECTION_LABELS,
  getNestedValue,
  makeOverrideKey,
  resetDirectoryEntryOverride,
  saveDirectoryEntryOverride,
  useDirectoryOverrides,
} from '../utils/directoryOverridesStore';
import { Check, Edit3, FileText, RotateCcw, X } from 'lucide-react';

interface DirectoryEditButtonProps {
  section: EditableDirectorySection;
  item: { id: string } & Record<string, unknown>;
  itemLabel?: string;
  compact?: boolean;
}

export const DirectoryCustomNoteBanner: React.FC<{
  override?: DirectoryEntryOverride;
}> = ({ override }) => {
  if (!override?.customClinicalNote) return null;
  return (
    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-950">
          <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Клиническая корректировка врача</span>
        </span>
        <span className="text-[11px] font-mono tabular-nums text-amber-700">
          {new Date(override.updatedAt).toLocaleDateString('ru-RU')}
        </span>
      </div>
      <p className="text-amber-950 leading-relaxed whitespace-pre-line">
        {override.customClinicalNote}
      </p>
    </div>
  );
};

export const DirectoryEditButton: React.FC<DirectoryEditButtonProps> = ({
  section,
  item,
  itemLabel,
  compact = false,
}) => {
  const { overrides } = useDirectoryOverrides();
  const override = overrides[makeOverrideKey(section, item.id)];
  const isModified = Boolean(override);

  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [customNote, setCustomNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);

  const schema = EDITABLE_FIELD_SCHEMAS[section];

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, string> = {};
    for (const field of schema) {
      const ovVal = override?.fields?.[field.path];
      const baseVal = ovVal !== undefined ? ovVal : getNestedValue(item, field.path);
      if (field.kind === 'list') {
        initial[field.path] = Array.isArray(baseVal) ? baseVal.join('\n') : String(baseVal ?? '');
      } else {
        initial[field.path] = String(baseVal ?? '');
      }
    }
    setDraftValues(initial);
    setCustomNote(override?.customClinicalNote ?? '');
    setSavedFlag(false);
  }, [isOpen, item, override, schema]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const changedFields: Record<string, string | string[]> = {};
      for (const field of schema) {
        const raw = draftValues[field.path] ?? '';
        const origVal = getNestedValue(item, field.path);
        if (field.kind === 'list') {
          const parsedList = raw
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
          const origList = Array.isArray(origVal) ? origVal.map((x) => String(x).trim()) : [];
          if (JSON.stringify(parsedList) !== JSON.stringify(origList)) {
            changedFields[field.path] = parsedList;
          } else if (override?.fields?.[field.path] !== undefined) {
            // Keep explicit match if reverted manually per field, or drop
            changedFields[field.path] = parsedList;
          }
        } else {
          const trimmed = raw.trim();
          const origStr = String(origVal ?? '').trim();
          if (trimmed !== origStr) {
            changedFields[field.path] = raw;
          }
        }
      }

      if (Object.keys(changedFields).length === 0 && !customNote.trim()) {
        await resetDirectoryEntryOverride(section, item.id);
      } else {
        await saveDirectoryEntryOverride(section, item.id, changedFields, customNote);
      }
      setSavedFlag(true);
      setTimeout(() => setIsOpen(false), 320);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetDirectoryEntryOverride(section, item.id);
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    itemLabel ||
    String(item.name || item.title || item.russianName || item.id);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 border rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } font-medium ${
          isModified
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }`}
        title="Редактировать описание, методику, параметры или заметку врача"
      >
        <Edit3 className="w-3.5 h-3.5 shrink-0" />
        <span>{isModified ? 'Изменено · Править' : 'Редактировать данные'}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/70">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                  <span className="font-medium text-blue-700">{SECTION_LABELS[section]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px]">{item.id}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Корректировка данных: {displayName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Закрыть редактор"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-slate-700 leading-relaxed">
                Все исправления сохраняются локально в базе вашего устройства, включаются в
                резервные копии, зеркальные копии и пакеты обмена через Яндекс.Диск / Google Диск.
                Вы в любой момент можете сбросить запись к исходному справочнику.
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1.5">
                <label className="block font-semibold text-amber-950">
                  Персональная клиническая заметка врача (добавляется к карточке)
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Например: особенность провокации на приёме, авторский нюанс укладки, дозировка..."
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-3.5">
                {schema.map((field) => {
                  const val = draftValues[field.path] ?? '';
                  return (
                    <div key={field.path} className="space-y-1">
                      <label className="block font-semibold text-slate-800">{field.label}</label>
                      {field.kind === 'text' ? (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setDraftValues((prev) => ({ ...prev, [field.path]: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      ) : (
                        <textarea
                          rows={field.kind === 'list' ? 4 : 3}
                          value={val}
                          onChange={(e) =>
                            setDraftValues((prev) => ({ ...prev, [field.path]: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              {isModified ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить к исходному справочнику</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">Используются эталонные данные</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savedFlag ? 'Сохранено' : 'Сохранить изменения'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
