import { useEffect, useState } from 'react';
import { DirectoryEntryOverride, EditableDirectorySection } from '../types/atlas';

const DB_NAME = 'kinezioatlas_directory_overrides_v1';
const DB_VERSION = 1;
const STORE_OVERRIDES = 'overrides';
const LS_CACHE_KEY = 'kinezioatlas_directory_overrides_ls_v1';

export const DIRECTORY_OVERRIDES_UPDATED_EVENT = 'kinezioatlas:directory-overrides-updated';

export type EditableFieldKind = 'text' | 'textarea' | 'list';

export interface EditableFieldDescriptor {
  path: string;
  label: string;
  kind: EditableFieldKind;
  hint?: string;
}

export const SECTION_LABELS: Record<EditableDirectorySection, string> = {
  muscle: 'Атлас мышц / ММТ',
  chain: 'Миофасциальная цепь (МФЦ)',
  meridian: 'Меридиан ТКМ',
  acupoint: 'Акупунктурная точка',
  organ: 'Висцеральный орган',
  diaphragm: 'Диафрагма тела',
  neuro: 'Нейрофизиология и рецепторы',
  tests: 'Тест / Диагностическая проба',
  patterns: 'Паттерн движения',
  protocol: 'Клинический протокол',
  mudra: 'Мудра (пальцевая проба)',
  nosode: 'Нозод / Диагностическая ампула',
  taping: 'Кинезиотейпирование',
  trust: 'Мануальная манипуляция (Траст)',
  craniosacral: 'Краниосакральная коррекция',
  fascia: 'Фасциальная структура',
  tendon: 'Сухожилие и связка',
  joint: 'Суставной комплекс',
  bone: 'Костный ориентир / кость',
  vessel: 'Сосуд / лимфоколлектор',
};

export const EDITABLE_FIELD_SCHEMAS: Record<EditableDirectorySection, EditableFieldDescriptor[]> = {
  muscle: [
    { path: 'name', label: 'Название мышцы', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'origin', label: 'Начало крепления (Origin)', kind: 'textarea' },
    { path: 'insertion', label: 'Прикрепление (Insertion)', kind: 'textarea' },
    { path: 'innervation', label: 'Иннервация', kind: 'text' },
    { path: 'spinalSegment', label: 'Спинальный сегмент', kind: 'text' },
    { path: 'function', label: 'Биомеханическая функция', kind: 'textarea' },
    { path: 'mmt.patientPosition', label: 'ММТ: исходное положение пациента', kind: 'textarea' },
    { path: 'mmt.practitionerPosition', label: 'ММТ: позиция и руки врача', kind: 'textarea' },
    { path: 'mmt.testAction', label: 'ММТ: тестовое движение', kind: 'textarea' },
    { path: 'mmt.pressureVector', label: 'ММТ: вектор давления', kind: 'textarea' },
    { path: 'mmt.stabilization', label: 'ММТ: стабилизация', kind: 'textarea' },
    { path: 'mmt.normotoniaSign', label: 'Критерий нормотонии', kind: 'text' },
    { path: 'mmt.hypotoniaSign', label: 'Критерий гипотонии', kind: 'text' },
    { path: 'mmt.commonErrors', label: 'Частые ошибки тестирования (каждый пункт с новой строки)', kind: 'list' },
    { path: 'reflexes.neurolymphaticAnterior', label: 'Нейролимфатический рефлекс (передний)', kind: 'text' },
    { path: 'reflexes.neurolymphaticPosterior', label: 'Нейролимфатический рефлекс (задний)', kind: 'text' },
    { path: 'reflexes.neurovascular', label: 'Нейрососудистый рефлекс (Беннетта)', kind: 'text' },
    { path: 'reflexes.visceromotorLink', label: 'Висцеро-моторная связь', kind: 'textarea' },
    { path: 'clinicalNotes', label: 'Клинические примечания', kind: 'textarea' },
  ],
  chain: [
    { path: 'name', label: 'Название миофасциальной цепи', kind: 'text' },
    { path: 'englishName', label: 'Международное название', kind: 'text' },
    { path: 'biomechanicalRole', label: 'Биомеханическая роль цепи', kind: 'textarea' },
    { path: 'kinesiologyTestStrategy', label: 'Кинезиологическая стратегия (ТЛ и ретест)', kind: 'textarea' },
    { path: 'pathwaySegments', label: 'Звенья цепи (по одному с новой строки)', kind: 'list' },
    { path: 'posturalDysfunctionSigns', label: 'Постуральные признаки дисфункции (с новой строки)', kind: 'list' },
  ],
  meridian: [
    { path: 'name', label: 'Название меридиана', kind: 'text' },
    { path: 'chineseName', label: 'Традиционное название', kind: 'text' },
    { path: 'activeHours', label: 'Часы максимальной активности', kind: 'text' },
    { path: 'pathwaySummary', label: 'Ход меридиана', kind: 'textarea' },
    { path: 'balancingRule', label: 'Правило балансировки (У-Син / Ло–Юань)', kind: 'textarea' },
    { path: 'excessSymptoms', label: 'Симптомы избытка (с новой строки)', kind: 'list' },
    { path: 'deficiencySymptoms', label: 'Симптомы недостатка (с новой строки)', kind: 'list' },
  ],
  acupoint: [
    { path: 'russianName', label: 'Название точки', kind: 'text' },
    { path: 'chineseName', label: 'Китайское название', kind: 'text' },
    { path: 'role', label: 'Функциональная роль точки', kind: 'text' },
    { path: 'localization', label: 'Топографическая локализация', kind: 'textarea' },
    { path: 'anatomicalLandmark', label: 'Анатомический ориентир', kind: 'textarea' },
    { path: 'depthAndAngle', label: 'Способ, глубина и угол воздействия', kind: 'text' },
    { path: 'balancingEffect', label: 'Балансирующий эффект', kind: 'textarea' },
    { path: 'indications', label: 'Показания к применению (с новой строки)', kind: 'list' },
  ],
  organ: [
    { path: 'name', label: 'Название органа', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'system', label: 'Система организма', kind: 'text' },
    { path: 'visceralMobility', label: 'Висцеральная мобильность и мотильность', kind: 'textarea' },
    { path: 'visceromotorMechanism', label: 'Висцеро-моторный механизм', kind: 'textarea' },
    { path: 'dysfunctionSigns', label: 'Признаки дисфункции (с новой строки)', kind: 'list' },
  ],
  diaphragm: [
    { path: 'name', label: 'Название диафрагмы', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'level', label: 'Анатомический уровень', kind: 'text' },
    { path: 'anatomy', label: 'Анатомия и прикрепления', kind: 'textarea' },
    { path: 'biomechanics', label: 'Биомеханика дыхательного цикла', kind: 'textarea' },
    { path: 'dysfunctionImpact', label: 'Влияние дисфункции на каскад', kind: 'textarea' },
  ],
  neuro: [
    { path: 'name', label: 'Название модуля / рецептора', kind: 'text' },
    { path: 'latinOrSubtitle', label: 'Подзаголовок / латынь', kind: 'text' },
    { path: 'physiologicalMechanism', label: 'Физиологический механизм', kind: 'textarea' },
    { path: 'muscleInteraction', label: 'Взаимодействие с мышечным тонусом', kind: 'textarea' },
    { path: 'postureInfluence', label: 'Влияние положения тела и постуры', kind: 'textarea' },
    { path: 'diagnosticAlgorithm', label: 'Алгоритм диагностики (с новой строки)', kind: 'list' },
    { path: 'positiveDysfunctionSigns', label: 'Признаки нарушения (с новой строки)', kind: 'list' },
  ],
  tests: [
    { path: 'name', label: 'Название теста / пробы', kind: 'text' },
    { path: 'latinOrAlias', label: 'Синоним / международное название', kind: 'text' },
    { path: 'targetRegion', label: 'Целевой регион', kind: 'text' },
    { path: 'clinicalPurpose', label: 'Клиническая цель и назначение', kind: 'textarea' },
    { path: 'physiologicalMechanism', label: 'Анатомо-физиологический механизм', kind: 'textarea' },
    { path: 'preparationAndPosition', label: 'Исходная укладка и подготовка', kind: 'textarea' },
    { path: 'executionSteps', label: 'Шаги проведения пробы (по пунктам с новой строки)', kind: 'list' },
    { path: 'normalResult', label: 'Нормальный результат (Отрицательная проба)', kind: 'textarea' },
    { path: 'positiveDeviations', label: 'Отклонения и положительный результат (с новой строки)', kind: 'list' },
    { path: 'consequencesIfMissedOrAbnormal', label: 'Последствия пропуска патологии (с новой строки)', kind: 'list' },
    { path: 'commonErrors', label: 'Типичные ошибки проведения (с новой строки)', kind: 'list' },
    { path: 'contraindications', label: 'Противопоказания', kind: 'textarea' },
  ],
  patterns: [
    { path: 'name', label: 'Название двигательного паттерна', kind: 'text' },
    { path: 'subtitle', label: 'Подзаголовок', kind: 'text' },
    { path: 'physiologicalDescription', label: 'Описание физиологического паттерна', kind: 'textarea' },
    { path: 'recruitmentSequence', label: 'Очерёдность включения мышц (с новой строки)', kind: 'list' },
    { path: 'testingAndMmtCheck', label: 'Методика тестирования и проверки в ММТ (с новой строки)', kind: 'list' },
    { path: 'dysfunctionSigns', label: 'Признаки дисфункции и подмен (с новой строки)', kind: 'list' },
    { path: 'biomechanicalConsequences', label: 'Биомеханические последствия нарушения (с новой строки)', kind: 'list' },
    { path: 'systemicConsequences', label: 'Системные и вегетативные последствия (с новой строки)', kind: 'list' },
    { path: 'correctionAndRetraining', label: 'Коррекция и моторное переобучение (с новой строки)', kind: 'list' },
    { path: 'commonErrors', label: 'Типичные ошибки оценки (с новой строки)', kind: 'list' },
  ],
  protocol: [
    { path: 'title', label: 'Название клинического протокола', kind: 'text' },
    { path: 'primaryFinding', label: 'Клиническая картина', kind: 'textarea' },
    { path: 'chainSummary', label: 'Цепь связей', kind: 'textarea' },
    { path: 'diagnosticAlgorithm', label: 'Алгоритм диагностики (с новой строки)', kind: 'list' },
  ],
  mudra: [
    { path: 'name', label: 'Название мудры', kind: 'text' },
    { path: 'sanskritName', label: 'Санскритское название', kind: 'text' },
    { path: 'fingerPosition', label: 'Положение пальцев (укладка кисти)', kind: 'textarea' },
    { path: 'diagnosticRole', label: 'Клиническое назначение', kind: 'textarea' },
    { path: 'mmtDiagnosticSteps', label: 'Шаги диагностики в ММТ (с новой строки)', kind: 'list' },
    { path: 'positiveDiagnosticSign', label: 'Положительный диагностический критерий', kind: 'textarea' },
    { path: 'correctionSteps', label: 'Алгоритм коррекции и ретеста (с новой строки)', kind: 'list' },
    { path: 'durationAndBreathing', label: 'Длительность и дыхание', kind: 'text' },
    { path: 'contraindicationsOrNotes', label: 'Примечания и ограничения', kind: 'textarea' },
  ],
  nosode: [
    { path: 'name', label: 'Название ампулы / нозода', kind: 'text' },
    { path: 'latinOrCode', label: 'Код / латынь', kind: 'text' },
    { path: 'potencyRange', label: 'Диапазон потенций', kind: 'text' },
    { path: 'purpose', label: 'Назначение ампулы', kind: 'textarea' },
    { path: 'placementZones', label: 'Зоны размещения на теле (с новой строки)', kind: 'list' },
    { path: 'mmtDiagnosticSteps', label: 'Алгоритм тестирования в ММТ (с новой строки)', kind: 'list' },
    { path: 'positiveTestSign', label: 'Положительный критерий теста', kind: 'textarea' },
    { path: 'neutralizationCheck', label: 'Феномен нейтрализации', kind: 'textarea' },
    { path: 'correctionSteps', label: 'Стратегия коррекции (с новой строки)', kind: 'list' },
    { path: 'commonErrors', label: 'Частые ошибки тестирования', kind: 'textarea' },
  ],
  taping: [
    { path: 'name', label: 'Название аппликации', kind: 'text' },
    { path: 'regionLabel', label: 'Регион тела', kind: 'text' },
    { path: 'tensionPercent', label: 'Процент натяжения', kind: 'text' },
    { path: 'tapeCutForm', label: 'Форма нарезки тейпа', kind: 'text' },
    { path: 'directionRule', label: 'Правило вектора аппликации', kind: 'textarea' },
    { path: 'indications', label: 'Показания к применению (с новой строки)', kind: 'list' },
    { path: 'applicationSteps', label: 'Пошаговая техника наклеивания (с новой строки)', kind: 'list' },
    { path: 'mmtVerification', label: 'Контроль ретеста ММТ', kind: 'textarea' },
    { path: 'wearTimeAndRemoval', label: 'Срок ношения и снятие', kind: 'text' },
    { path: 'contraindications', label: 'Противопоказания', kind: 'textarea' },
  ],
  trust: [
    { path: 'name', label: 'Название манипуляции (траста)', kind: 'text' },
    { path: 'segmentLevel', label: 'Сегмент', kind: 'text' },
    { path: 'biomechanicalIndication', label: 'Биомеханические показания', kind: 'textarea' },
    { path: 'preScreeningTests', label: 'Обязательные допуски / тесты безопасности (с новой строки)', kind: 'list' },
    { path: 'patientPosition', label: 'Укладка пациента', kind: 'textarea' },
    { path: 'practitionerContacts', label: 'Точки контакта врача', kind: 'textarea' },
    { path: 'thrustVectorAndBarrier', label: 'Выход на барьер и вектор импульса', kind: 'textarea' },
    { path: 'mmtRetestCriteria', label: 'Критерии ретеста ММТ', kind: 'textarea' },
    { path: 'redFlagsAndContraindications', label: 'Красные флаги и противопоказания (с новой строки)', kind: 'list' },
  ],
  craniosacral: [
    { path: 'name', label: 'Название техники КСР', kind: 'text' },
    { path: 'latinOrSubtitle', label: 'Подзаголовок / латынь', kind: 'text' },
    { path: 'anatomicalFocus', label: 'Анатомический фокус', kind: 'textarea' },
    { path: 'physiologicalMechanism', label: 'Биомеханика и физиологический механизм', kind: 'textarea' },
    { path: 'diagnosticAssessment', label: 'Диагностика КСР и провокация в ММТ (с новой строки)', kind: 'list' },
    { path: 'dysfunctionSigns', label: 'Признаки дисфункции (с новой строки)', kind: 'list' },
    { path: 'clinicalConsequences', label: 'Клинические последствия (с новой строки)', kind: 'list' },
    { path: 'safetyAndErrors', label: 'Противопоказания и ошибки выполнения (с новой строки)', kind: 'list' },
  ],
  fascia: [
    { path: 'name', label: 'Название фасциальной структуры', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'anatomyAndLocation', label: 'Топография и анатомический ход', kind: 'textarea' },
    { path: 'biomechanicsAndFunction', label: 'Биомеханическая и дренажная функция', kind: 'textarea' },
    { path: 'palpationLandmark', label: 'Пальпаторный ориентир', kind: 'textarea' },
    { path: 'kinesiologyTestAndProvocation', label: 'Провокация и ММТ-диагностика', kind: 'textarea' },
    { path: 'dysfunctionSigns', label: 'Признаки дисфункции (с новой строки)', kind: 'list' },
  ],
  tendon: [
    { path: 'name', label: 'Название сухожилия / связки', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'anatomyAndLocation', label: 'Анатомия и прикрепления', kind: 'textarea' },
    { path: 'biomechanicsAndFunction', label: 'Биомеханическая функция', kind: 'textarea' },
    { path: 'palpationLandmark', label: 'Пальпаторный ориентир и ТЛ', kind: 'textarea' },
    { path: 'kinesiologyTestAndProvocation', label: 'Тест Гольджи / провокация ММТ', kind: 'textarea' },
    { path: 'dysfunctionSigns', label: 'Признаки тендинопатии (с новой строки)', kind: 'list' },
  ],
  joint: [
    { path: 'name', label: 'Название сустава', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'anatomyAndLocation', label: 'Анатомическое строение', kind: 'textarea' },
    { path: 'biomechanicsAndFunction', label: 'Биомеханика и артрокинематика', kind: 'textarea' },
    { path: 'palpationLandmark', label: 'Суставная щель и ориентир', kind: 'textarea' },
    { path: 'kinesiologyTestAndProvocation', label: 'Ортопедические тесты и ТЛ', kind: 'textarea' },
    { path: 'dysfunctionSigns', label: 'Признаки суставного блока (с новой строки)', kind: 'list' },
  ],
  bone: [
    { path: 'name', label: 'Название кости / ориентира', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'anatomyAndLocation', label: 'Топография и ориентиры', kind: 'textarea' },
    { path: 'biomechanicsAndFunction', label: 'Остеопатическая роль и ось движения', kind: 'textarea' },
    { path: 'palpationLandmark', label: 'Костный ориентир для пальпации', kind: 'textarea' },
    { path: 'kinesiologyTestAndProvocation', label: 'ТЛ и вектор коррекции в ММТ', kind: 'textarea' },
    { path: 'dysfunctionSigns', label: 'Признаки костной фиксации (с новой строки)', kind: 'list' },
  ],
  vessel: [
    { path: 'name', label: 'Название сосуда / коллектора', kind: 'text' },
    { path: 'latinName', label: 'Латинское название', kind: 'text' },
    { path: 'anatomyAndLocation', label: 'Анатомический ход и туннели', kind: 'textarea' },
    { path: 'biomechanicsAndFunction', label: 'Гемодинамическая / лимфодренажная роль', kind: 'textarea' },
    { path: 'palpationLandmark', label: 'Проекция пульсации / дренажной точки', kind: 'textarea' },
    { path: 'kinesiologyTestAndProvocation', label: 'Сосудистые пробы и ТЛ в ММТ', kind: 'textarea' },
    { path: 'dysfunctionSigns', label: 'Признаки компрессии / застоя (с новой строки)', kind: 'list' },
  ],
};

export function makeOverrideKey(section: EditableDirectorySection, itemId: string): string {
  return `${section}::${itemId}`;
}

function readCachedOverrides(): Record<string, DirectoryEntryOverride> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DirectoryEntryOverride>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCachedOverrides(map: Record<string, DirectoryEntryOverride>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

function openOverridesDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_OVERRIDES)) {
          db.createObjectStore(STORE_OVERRIDES, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function notifyOverridesUpdated(key?: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DIRECTORY_OVERRIDES_UPDATED_EVENT, { detail: { key } }));
  }
}

export function getAllDirectoryOverridesSync(): Record<string, DirectoryEntryOverride> {
  return readCachedOverrides();
}

export async function loadAllDirectoryOverrides(): Promise<Record<string, DirectoryEntryOverride>> {
  const cached = readCachedOverrides();
  const db = await openOverridesDb();
  if (!db) return cached;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_OVERRIDES, 'readonly');
      const req = tx.objectStore(STORE_OVERRIDES).getAll();
      req.onsuccess = () => {
        const rows = (req.result as DirectoryEntryOverride[]) ?? [];
        const map: Record<string, DirectoryEntryOverride> = { ...cached };
        for (const r of rows) {
          if (r && r.key) {
            const existing = map[r.key];
            if (!existing || (r.updatedAt ?? '') >= (existing.updatedAt ?? '')) {
              map[r.key] = r;
            }
          }
        }
        writeCachedOverrides(map);
        db.close();
        resolve(map);
      };
      req.onerror = () => {
        db.close();
        resolve(cached);
      };
    } catch {
      db.close();
      resolve(cached);
    }
  });
}

export async function saveDirectoryEntryOverride(
  section: EditableDirectorySection,
  itemId: string,
  fields: Record<string, string | string[]>,
  customClinicalNote?: string
): Promise<DirectoryEntryOverride> {
  const key = makeOverrideKey(section, itemId);
  const record: DirectoryEntryOverride = {
    key,
    section,
    itemId,
    fields,
    customClinicalNote: customClinicalNote?.trim() ? customClinicalNote.trim() : undefined,
    updatedAt: new Date().toISOString(),
  };

  const map = readCachedOverrides();
  map[key] = record;
  writeCachedOverrides(map);

  const db = await openOverridesDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_OVERRIDES, 'readwrite');
        tx.objectStore(STORE_OVERRIDES).put(record);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
  }

  notifyOverridesUpdated(key);
  return record;
}

export async function resetDirectoryEntryOverride(
  section: EditableDirectorySection,
  itemId: string
): Promise<void> {
  const key = makeOverrideKey(section, itemId);
  const map = readCachedOverrides();
  delete map[key];
  writeCachedOverrides(map);

  const db = await openOverridesDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_OVERRIDES, 'readwrite');
        tx.objectStore(STORE_OVERRIDES).delete(key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
  }

  notifyOverridesUpdated(key);
}

export async function importDirectoryOverridesBatch(
  incoming: Record<string, DirectoryEntryOverride>,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ added: number; updated: number }> {
  const current = mode === 'replace' ? {} : await loadAllDirectoryOverrides();
  const next: Record<string, DirectoryEntryOverride> = { ...current };
  let added = 0;
  let updated = 0;

  for (const [key, item] of Object.entries(incoming ?? {})) {
    if (!item || typeof item.itemId !== 'string' || typeof item.section !== 'string') continue;
    const prev = next[key];
    if (!prev) {
      added++;
      next[key] = item;
    } else if (mode === 'replace' || (item.updatedAt ?? '') > (prev.updatedAt ?? '')) {
      updated++;
      next[key] = item;
    }
  }

  writeCachedOverrides(next);

  const db = await openOverridesDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_OVERRIDES, 'readwrite');
        const store = tx.objectStore(STORE_OVERRIDES);
        if (mode === 'replace') store.clear();
        for (const rec of Object.values(next)) {
          store.put(rec);
        }
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
  }

  notifyOverridesUpdated();
  return { added, updated };
}

export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (cur == null || typeof cur !== 'object') return undefined;
    const val = cur[part];
    if (i === parts.length - 1) return val;
    cur = val as Record<string, unknown>;
  }
  return undefined;
}

function setNestedClone<T extends object>(obj: T, path: string, value: unknown): T {
  const parts = path.split('.');
  if (parts.length === 1) {
    return { ...(obj as Record<string, unknown>), [parts[0]]: value } as T;
  }
  const [head, ...rest] = parts;
  const currentChild = (obj as Record<string, unknown>)[head];
  const childObj =
    currentChild && typeof currentChild === 'object' ? { ...(currentChild as object) } : {};
  return {
    ...(obj as Record<string, unknown>),
    [head]: setNestedClone(childObj, rest.join('.'), value),
  } as T;
}

export function applyDirectoryOverride<T extends { id: string }>(
  section: EditableDirectorySection,
  item: T,
  overridesMap?: Record<string, DirectoryEntryOverride>
): T {
  const map = overridesMap ?? readCachedOverrides();
  const ov = map[makeOverrideKey(section, item.id)];
  if (!ov || !ov.fields) return item;

  let merged: T = { ...item };
  for (const [path, val] of Object.entries(ov.fields)) {
    merged = setNestedClone(merged, path, val);
  }
  return merged;
}

export function useDirectoryOverrides() {
  const [overrides, setOverrides] = useState<Record<string, DirectoryEntryOverride>>(() =>
    readCachedOverrides()
  );

  useEffect(() => {
    let active = true;
    loadAllDirectoryOverrides().then((loaded) => {
      if (active) setOverrides(loaded);
    });
    const handleUpdate = () => {
      loadAllDirectoryOverrides().then((loaded) => {
        if (active) setOverrides(loaded);
      });
    };
    window.addEventListener(DIRECTORY_OVERRIDES_UPDATED_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(DIRECTORY_OVERRIDES_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  return {
    overrides,
    getOverride: (section: EditableDirectorySection, itemId: string) =>
      overrides[makeOverrideKey(section, itemId)],
    hasOverride: (section: EditableDirectorySection, itemId: string) =>
      Boolean(overrides[makeOverrideKey(section, itemId)]),
    apply: <T extends { id: string }>(section: EditableDirectorySection, item: T): T =>
      applyDirectoryOverride(section, item, overrides),
  };
}
