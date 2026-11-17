import {
  ACUPOINTS,
  ANATOMICAL_ZONES,
  CIRCADIAN_MAP,
  INTAKE_DOMAIN_META,
  MMT_PROVOCATION_LABELS,
  MUSCLES,
  getCrossReferences,
  getTriadCorrections,
} from '../data';
import {
  CircadianPeriodId,
  Diaphragm,
  IntakeDomain,
  MMTResultTone,
  MMTSessionRecord,
  Meridian,
  Muscle,
  Organ,
  PainMapPoint,
  QuestionSeverity,
  QuestionnaireItem,
  TriadCorrectionBundle,
} from '../types/atlas';
import { PAIN_MARKER_META } from './painMapRecommendations';
import { describeBodySide } from '../data/musclePlateCoords';

export interface DomainScoreSummary {
  score: number;
  maxScore: number;
  pct: number;
}

export interface PositiveIntakeFinding {
  item: QuestionnaireItem;
  severity: QuestionSeverity;
}

export interface MusclePlanEntry {
  muscle: Muscle;
  record: MMTSessionRecord;
  isDysfunctional: boolean;
  isRecommendedByIntake: boolean;
  provocationDirectives: Array<{ label: string; hint: string }>;
  triad: TriadCorrectionBundle;
}

export interface ClinicalExportInput {
  patientName: string;
  visitDate: string;
  specialistName: string;
  chiefComplaint: string;
  complaintTimeWindow?: CircadianPeriodId;
  domainScores: Record<IntakeDomain, DomainScoreSummary>;
  positiveItems: PositiveIntakeFinding[];
  suggestedMuscleIds: string[];
  organs: Organ[];
  diaphragms: Diaphragm[];
  meridians: Meridian[];
  muscleQueue: string[];
  mmtRecords: Record<string, MMTSessionRecord>;
  painMap?: PainMapPoint[];
  stats: {
    tested: number;
    abnormal: number;
    corrected: number;
  };
}

export interface StructuredCorrectionPlan {
  priorityMuscles: MusclePlanEntry[];
  normotonicMuscles: Array<{ muscle: Muscle; record: MMTSessionRecord }>;
  untestedQueueMuscles: Muscle[];
  dominantDomains: Array<{
    domain: IntakeDomain;
    label: string;
    pct: number;
    strategy: string;
  }>;
  balancingPoints: Array<{ code: string; name: string; location: string; meridianName: string }>;
}

const DOMAIN_CORRECTION_GUIDELINES: Record<IntakeDomain, string> = {
  structural:
    'Приоритет структурно-биомеханической коррекции: устранение суставных фиксаций и триггерных зон, ПИР/фасциальный релиз укороченных антагонистов, реэдукация мышечных цепей и стабилизация таза/стопы.',
  visceral:
    'Приоритет висцеральной коррекции: мягкая мобилизация связочного аппарата органов, работа с диафрагмами (грудобрюшной и тазовой), стимуляция зон Чапмана (НЛ 30 сек) и ретест ассоциированных мышц.',
  emotional:
    'Приоритет эмоционально-стрессовой коррекции: ЭСР (удержание лобных бугров), височный тэппинг, проработка психоэмоциональной темы ведущего меридиана с одновременной ТЛ и дыхательным сопровождением.',
  energetic:
    'Приоритет энергетической балансировки: исключение свитчинга (ТЛ К-27 + пупок), балансировка ведущих меридианов по правилу «Полдень–Полночь» или «Мать–Сын» через тонизирующие/седативные точки, снятие ЭМИ-стресса.',
  chemical:
    'Приоритет химико-метаболической поддержки: оценка толерантности к нутриентам через ММТ (ольфакторная/сублингвальная провокация), поддержка дренажа печени/лимфы, коррекция микробиоты, гидратация и восполнение кофакторов.',
};

function createDefaultRecord(muscleId: string): MMTSessionRecord {
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

export function formatToneText(tone: MMTResultTone): string {
  switch (tone) {
    case 'normotonia':
      return 'Норма';
    case 'hypotonia':
      return 'Гипо ↓';
    case 'hypertonia':
      return 'Гипер ↑';
    default:
      return 'Не тест.';
  }
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return new Date().toLocaleDateString('ru-RU');
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDate;
}

export function buildStructuredCorrectionPlan(
  data: ClinicalExportInput
): StructuredCorrectionPlan {
  const priorityMuscles: MusclePlanEntry[] = [];
  const normotonicMuscles: Array<{ muscle: Muscle; record: MMTSessionRecord }> = [];
  const untestedQueueMuscles: Muscle[] = [];

  const suggestedSet = new Set(data.suggestedMuscleIds);
  const painMapMuscleIds = new Set<string>();
  (data.painMap ?? []).forEach((pt) => {
    if (pt.primaryMuscleId) painMapMuscleIds.add(pt.primaryMuscleId);
  });

  const orderedMuscleIds = Array.from(
    new Set([...data.muscleQueue, ...Array.from(painMapMuscleIds)])
  );

  orderedMuscleIds.forEach((mId) => {
    const muscle = MUSCLES.find((m) => m.id === mId);
    if (!muscle) return;
    const record = data.mmtRecords[mId] ?? createDefaultRecord(mId);
    const isTested = record.leftTone !== 'untested' || record.rightTone !== 'untested';
    const isDysfunctional =
      record.leftTone === 'hypotonia' ||
      record.leftTone === 'hypertonia' ||
      record.rightTone === 'hypotonia' ||
      record.rightTone === 'hypertonia' ||
      record.provocations.length > 0;

    if (
      isDysfunctional ||
      (!isTested && (suggestedSet.has(mId) || painMapMuscleIds.has(mId)))
    ) {
      const crossRefs = getCrossReferences({ type: 'muscle', id: muscle.id });
      const triad = getTriadCorrections(
        { type: 'muscle', id: muscle.id },
        {
          muscles: [muscle],
          organs: crossRefs.organs,
          meridians: crossRefs.meridians,
        }
      );

      priorityMuscles.push({
        muscle,
        record,
        isDysfunctional,
        isRecommendedByIntake: suggestedSet.has(mId) || painMapMuscleIds.has(mId),
        provocationDirectives: record.provocations.map((tag) => ({
          label: MMT_PROVOCATION_LABELS[tag].label,
          hint: MMT_PROVOCATION_LABELS[tag].hint,
        })),
        triad,
      });
    } else if (isTested) {
      normotonicMuscles.push({ muscle, record });
    } else {
      untestedQueueMuscles.push(muscle);
    }
  });

  const dominantDomains = (Object.keys(data.domainScores) as IntakeDomain[])
    .map((domain) => ({
      domain,
      label: INTAKE_DOMAIN_META[domain].label,
      pct: data.domainScores[domain].pct,
      strategy: DOMAIN_CORRECTION_GUIDELINES[domain],
    }))
    .filter((d) => d.pct > 0)
    .sort((a, b) => b.pct - a.pct);

  const seenPointIds = new Set<string>();
  const balancingPoints: Array<{
    code: string;
    name: string;
    location: string;
    meridianName: string;
  }> = [];

  data.meridians.forEach((mer) => {
    mer.acupointIds.slice(0, 2).forEach((ptId) => {
      if (seenPointIds.has(ptId)) return;
      const pt = ACUPOINTS.find((a) => a.id === ptId);
      if (pt) {
        seenPointIds.add(ptId);
        balancingPoints.push({
          code: pt.code,
          name: pt.chineseName,
          location: pt.localization,
          meridianName: `${mer.code} ${mer.name}`,
        });
      }
    });
  });

  return {
    priorityMuscles,
    normotonicMuscles,
    untestedQueueMuscles,
    dominantDomains,
    balancingPoints,
  };
}

export function buildClinicalTextReport(data: ClinicalExportInput): string {
  const plan = buildStructuredCorrectionPlan(data);
  const sep = '========================================================================';
  const subSep = '------------------------------------------------------------------------';

  const lines: string[] = [
    sep,
    'КЛИНИЧЕСКАЯ КАРТА ПРИЁМА И ПЛАН КОРРЕКЦИИ (КинезиоАтлас)',
    sep,
    `Дата приёма:      ${formatDisplayDate(data.visitDate)}`,
    `Пациент:          ${data.patientName.trim() || 'Не указан'}`,
    `Специалист:       ${data.specialistName.trim() || 'Не указан'}`,
    `Ведущая жалоба:   ${data.chiefComplaint.trim() || 'Не указана'}`,
    ...(data.complaintTimeWindow && CIRCADIAN_MAP[data.complaintTimeWindow]
      ? [
          `Время дискомф.:   ${CIRCADIAN_MAP[data.complaintTimeWindow].practicalWindow} → ${CIRCADIAN_MAP[data.complaintTimeWindow].organTitle}`,
        ]
      : []),
    `Сводка ММТ:       Протестировано ${data.stats.tested}/${data.muscleQueue.length} | Дисфункций: ${data.stats.abnormal} | Скорректировано: ${data.stats.corrected}`,
    '',
    '1. РЕЗУЛЬТАТЫ ОПРОСНИКА ПО ТРИАДЕ ЗДОРОВЬЯ',
    subSep,
    ...(Object.keys(data.domainScores) as IntakeDomain[]).map((d) => {
      const s = data.domainScores[d];
      return `  • ${INTAKE_DOMAIN_META[d].label}: ${s.pct}% (${s.score} из ${s.maxScore} баллов)`;
    }),
    '',
    '2. ВЫЯВЛЕННЫЕ ЖАЛОБЫ И ВЕРОЯТНЫЕ ПЕРВОПРИЧИНЫ',
    subSep,
    ...(data.positiveItems.length > 0
      ? data.positiveItems.flatMap(({ item, severity }, i) => [
          `  ${i + 1}. [${severity === 2 ? 'ВЫРАЖЕННО' : 'УМЕРЕННО'} · ${INTAKE_DOMAIN_META[item.domain].shortLabel}] ${item.question}`,
          `     → Вероятная причина: ${item.suggestedCause}`,
        ])
      : ['  Положительных ответов по опроснику не отмечено.']),
    '',
    '3. ЖУРНАЛ МАНУАЛЬНО-МЫШЕЧНОГО ТЕСТИРОВАНИЯ (ММТ)',
    subSep,
    ...data.muscleQueue.flatMap((mId) => {
      const m = MUSCLES.find((item) => item.id === mId);
      if (!m) return [];
      const rec = data.mmtRecords[mId] ?? createDefaultRecord(mId);
      const status = rec.retestNormotonia
        ? 'Ретест: Нормотония'
        : rec.correctionApplied
          ? 'Коррекция выполнена'
          : rec.leftTone === 'hypotonia' ||
              rec.leftTone === 'hypertonia' ||
              rec.rightTone === 'hypotonia' ||
              rec.rightTone === 'hypertonia'
            ? 'Требует коррекции'
            : 'Без патологии / не завершено';
      const provStr =
        rec.provocations.length > 0
          ? ` | Провокации: ${rec.provocations.map((p) => MMT_PROVOCATION_LABELS[p].label).join(', ')}`
          : '';
      const holdParts: string[] = [];
      if (rec.holdTimeLeftSec !== undefined) holdParts.push(`Л=${rec.holdTimeLeftSec.toFixed(1)} с`);
      if (rec.holdTimeRightSec !== undefined) holdParts.push(`П=${rec.holdTimeRightSec.toFixed(1)} с`);
      const holdStr = holdParts.length > 0 ? ` | Удержание: ${holdParts.join(', ')}` : '';
      const noteStr = rec.notes.trim() ? `\n     Заметка: ${rec.notes.trim()}` : '';
      return [
        `  • ${m.name} (${m.spinalSegment.split('·')[0].trim()})`,
        `    Л: ${formatToneText(rec.leftTone)} | П: ${formatToneText(rec.rightTone)}${holdStr} | Статус: ${status}${provStr}${noteStr}`,
      ];
    }),
    ...(data.painMap && data.painMap.length > 0
      ? [
          '',
          '3.5. КАРТА БОЛИ, ТРИГГЕРНЫЕ ТОЧКИ И СЛАБЫЕ МЫШЦЫ',
          subSep,
          ...data.painMap.map((pt, idx) => {
            const typeLabel = PAIN_MARKER_META[pt.type].label;
            const zoneName = ANATOMICAL_ZONES.find((z) => z.id === pt.zoneId)?.shortName ?? pt.zoneId;
            const muscleName =
              MUSCLES.find((m) => m.id === pt.primaryMuscleId)?.name ?? 'Мышца не указана';
            const vas = pt.intensity !== undefined ? ` | ВАШ: ${pt.intensity}/10` : '';
            const note = pt.note?.trim() ? ` | Заметка: ${pt.note.trim()}` : '';
            return `  ${idx + 1}. [${typeLabel}] ${muscleName} — ${zoneName}, ${describeBodySide(pt.x)} (x=${pt.x}, y=${pt.y})${vas}${note}`;
          }),
        ]
      : []),
    '',
    '4. СФОРМИРОВАННЫЙ ПЛАН КОРРЕКЦИИ ДЛЯ КАРТЫ ПАЦИЕНТА',
    subSep,
  ];

  if (plan.dominantDomains.length > 0) {
    lines.push('  4.1. Стратегические направления по профилю Триады здоровья:');
    plan.dominantDomains.forEach((dom) => {
      lines.push(`    • ${dom.label} (${dom.pct}%): ${dom.strategy}`);
    });
    lines.push('');
  }

  if (plan.priorityMuscles.length > 0) {
    lines.push('  4.2. Протокол коррекции по выявленным и приоритетным мышцам:');
    plan.priorityMuscles.forEach((entry, idx) => {
      const m = entry.muscle;
      lines.push(
        `  [${idx + 1}] ${m.name} (${m.latinName}) — Л: ${formatToneText(entry.record.leftTone)} / П: ${formatToneText(entry.record.rightTone)}`
      );
      if (entry.provocationDirectives.length > 0) {
        lines.push('      Активные провокации:');
        entry.provocationDirectives.forEach((pd) => {
          lines.push(`        - ${pd.label}: ${pd.hint}`);
        });
      }
      lines.push(`      НЛ-рефлексы (Чапман): спереди — ${m.reflexes.neurolymphaticAnterior}; сзади — ${m.reflexes.neurolymphaticPosterior}`);
      lines.push(`      НВ-точки (Беннетт):  ${m.reflexes.neurovascular}`);
      lines.push(`      Висцеро-моторная связь: ${m.reflexes.visceromotorLink}`);
      if (m.correctionSteps.length > 0) {
        lines.push('      Техники коррекции:');
        m.correctionSteps.forEach((st) => {
          lines.push(`        - [${st.modality} · ${st.durationOrDose}] ${st.title}: ${st.technique}`);
        });
      }
      lines.push(`      Триада (Эмоции / ЭСР): ${entry.triad.emotional.correctionMethod}`);
      lines.push(`      Триада (Энергия / точки): ${entry.triad.energetic.keyPointsOrNutrients}`);
      lines.push(`      Триада (Химия / нутриенты): ${m.nutrients.join(', ')}`);
      if (entry.record.notes.trim()) {
        lines.push(`      Примечание специалиста: ${entry.record.notes.trim()}`);
      }
      lines.push('');
    });
  } else {
    lines.push(
      '  Дисфункциональных или приоритетных мышц для адресной коррекции пока не выделено.'
    );
    lines.push('');
  }

  if (data.organs.length > 0 || data.diaphragms.length > 0 || plan.balancingPoints.length > 0) {
    lines.push('  4.3. Взаимосвязанные органы, диафрагмы и акупунктурные точки:');
    if (data.organs.length > 0) {
      lines.push(`    • Органы для висцеральной проверки: ${data.organs.map((o) => o.name).join(', ')}`);
    }
    if (data.diaphragms.length > 0) {
      lines.push(`    • Диафрагмы для релиза: ${data.diaphragms.map((d) => d.name).join(', ')}`);
    }
    if (plan.balancingPoints.length > 0) {
      lines.push('    • Ключевые точки балансировки меридианов:');
      plan.balancingPoints.forEach((pt) => {
        lines.push(`      - ${pt.code} (${pt.name}, ${pt.meridianName}): ${pt.location}`);
      });
    }
    lines.push('');
  }

  lines.push(sep);
  lines.push('Подпись специалиста: ______________________   Дата: ' + formatDisplayDate(data.visitDate));
  lines.push(sep);

  return lines.join('\n');
}

function makeExportFilename(patientName: string, visitDate: string, ext: 'txt' | 'pdf'): string {
  const cleanName = (patientName.trim() || 'Пациент')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 40);
  const cleanDate = (visitDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, '');
  return `Karta_${cleanName}_${cleanDate}.${ext}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadTextReport(data: ClinicalExportInput): void {
  const content = buildClinicalTextReport(data);
  // Prepend UTF-8 BOM so Windows Notepad & Russian EHR systems decode Cyrillic cleanly
  const blob = new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, makeExportFilename(data.patientName, data.visitDate, 'txt'));
}

// ==================== PURE TYPESCRIPT MULTI-PAGE A4 PDF GENERATOR ====================

const PAGE_W = 1654; // A4 @ 200 DPI
const PAGE_H = 2339;
const MARGIN_X = 100;
const MARGIN_TOP = 96;
const MARGIN_BOTTOM = 108;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 1454 px

interface PdfPageCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  y: number;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n');
  const result: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      result.push('');
      continue;
    }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        result.push(currentLine);
        currentLine = words[i];
      }
    }
    result.push(currentLine);
  }

  return result;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildMultiPagePdfBlob(canvases: HTMLCanvasElement[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushStr = (str: string) => {
    pushBytes(encoder.encode(str));
  };

  // PDF Header + binary marker
  pushStr('%PDF-1.4\n');
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const pageCount = canvases.length;
  const totalObjects = 2 + pageCount * 3;
  const offsets = new Array<number>(totalObjects + 1).fill(0);

  // 1: Catalog
  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  const kidsRefs = canvases.map((_, idx) => `${3 + idx * 3} 0 R`).join(' ');
  offsets[2] = offset;
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${pageCount} >>\nendobj\n`);

  // Pages, Contents, Images
  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;

    const dataUrl = canvases[i].toDataURL('image/jpeg', 0.92);
    const jpegBase64 = dataUrl.split(',')[1];
    const jpegBytes = base64ToUint8Array(jpegBase64);

    // Page object (595.28 x 841.89 pt = standard A4)
    offsets[pageObjId] = offset;
    pushStr(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content stream
    const streamCmd = `q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[contentObjId] = offset;
    pushStr(
      `${contentObjId} 0 obj\n<< /Length ${streamCmd.length} >>\nstream\n${streamCmd}endstream\nendobj\n`
    );

    // Image XObject
    offsets[imageObjId] = offset;
    pushStr(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${PAGE_W} /Height ${PAGE_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');
  }

  // XRef table
  const xrefOffset = offset;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr('0000000000 65535 f \r\n');
  for (let id = 1; id <= totalObjects; id++) {
    pushStr(`${String(offsets[id]).padStart(10, '0')} 00000 n \r\n`);
  }

  pushStr(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const blobParts: BlobPart[] = chunks.map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    return copy.buffer;
  });
  return new Blob(blobParts, { type: 'application/pdf' });
}

export async function exportClinicalPdf(data: ClinicalExportInput): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  const plan = buildStructuredCorrectionPlan(data);
  const pages: PdfPageCanvas[] = [];
  const dateStr = formatDisplayDate(data.visitDate);
  const patientLabel = data.patientName.trim() || 'Не указан';
  const fontBody = '"IBM Plex Sans", system-ui, -apple-system, sans-serif';
  const fontDisplay = '"Plus Jakarta Sans", "IBM Plex Sans", system-ui, sans-serif';
  const fontMono = '"IBM Plex Mono", ui-monospace, monospace';

  const createPage = (isFirst: boolean): PdfPageCanvas => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Running header on continuation pages
    let startY = MARGIN_TOP;
    if (!isFirst) {
      ctx.font = `600 20px ${fontBody}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(`КинезиоАтлас · Карта приёма · Пациент: ${patientLabel} · ${dateStr}`, MARGIN_X, 68);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN_X, 82);
      ctx.lineTo(PAGE_W - MARGIN_X, 82);
      ctx.stroke();
      startY = 114;
    }

    const page: PdfPageCanvas = { canvas, ctx, y: startY };
    pages.push(page);
    return page;
  };

  let cur = createPage(true);

  const ensureSpace = (needed: number) => {
    if (cur.y + needed > PAGE_H - MARGIN_BOTTOM) {
      cur = createPage(false);
    }
  };

  const drawSectionHeading = (numTitle: string) => {
    ensureSpace(74);
    cur.y += 14;
    cur.ctx.fillStyle = '#1d4ed8';
    cur.ctx.fillRect(MARGIN_X, cur.y - 24, 8, 30);
    cur.ctx.font = `700 28px ${fontDisplay}`;
    cur.ctx.fillStyle = '#0f172a';
    cur.ctx.fillText(numTitle, MARGIN_X + 20, cur.y);
    cur.y += 14;
    cur.ctx.strokeStyle = '#cbd5e1';
    cur.ctx.lineWidth = 2;
    cur.ctx.beginPath();
    cur.ctx.moveTo(MARGIN_X, cur.y);
    cur.ctx.lineTo(PAGE_W - MARGIN_X, cur.y);
    cur.ctx.stroke();
    cur.y += 28;
  };

  const drawParagraph = (
    text: string,
    opts?: {
      x?: number;
      width?: number;
      font?: string;
      color?: string;
      lineHeight?: number;
      gapAfter?: number;
    }
  ) => {
    const x = opts?.x ?? MARGIN_X;
    const width = opts?.width ?? CONTENT_W;
    const font = opts?.font ?? `400 22px ${fontBody}`;
    const color = opts?.color ?? '#334155';
    const lineHeight = opts?.lineHeight ?? 31;
    const gapAfter = opts?.gapAfter ?? 8;

    cur.ctx.font = font;
    const lines = wrapTextLines(cur.ctx, text, width);
    for (const line of lines) {
      ensureSpace(lineHeight + 8);
      cur.ctx.font = font;
      cur.ctx.fillStyle = color;
      cur.ctx.fillText(line, x, cur.y);
      cur.y += lineHeight;
    }
    cur.y += gapAfter;
  };

  // ==================== HEADER BANNER ====================
  cur.ctx.fillStyle = '#f8fafc';
  cur.ctx.strokeStyle = '#cbd5e1';
  cur.ctx.lineWidth = 2;
  cur.ctx.fillRect(MARGIN_X, cur.y, CONTENT_W, 212);
  cur.ctx.strokeRect(MARGIN_X, cur.y, CONTENT_W, 212);
  cur.ctx.fillStyle = '#1d4ed8';
  cur.ctx.fillRect(MARGIN_X, cur.y, CONTENT_W, 8);

  cur.ctx.font = `700 34px ${fontDisplay}`;
  cur.ctx.fillStyle = '#0f172a';
  cur.ctx.fillText('КЛИНИЧЕСКАЯ КАРТА ПРИЁМА И ПЛАН КОРРЕКЦИИ', MARGIN_X + 28, cur.y + 54);

  cur.ctx.font = `500 20px ${fontBody}`;
  cur.ctx.fillStyle = '#475569';
  cur.ctx.fillText(
    'КинезиоАтлас · Прикладная кинезиология, ММТ и остеопатия',
    MARGIN_X + 28,
    cur.y + 88
  );

  // Patient metadata 2x2 grid
  cur.ctx.font = `600 22px ${fontBody}`;
  cur.ctx.fillStyle = '#0f172a';
  cur.ctx.fillText(`Пациент: ${patientLabel}`, MARGIN_X + 28, cur.y + 136);
  cur.ctx.fillText(`Дата приёма: ${dateStr}`, MARGIN_X + 820, cur.y + 136);

  cur.ctx.font = `400 21px ${fontBody}`;
  cur.ctx.fillStyle = '#334155';
  const complaintText = `Ведущая жалоба: ${data.chiefComplaint.trim() || 'Не указана'}`;
  const specText = `Специалист: ${data.specialistName.trim() || 'Не указан'}`;
  cur.ctx.fillText(
    complaintText.length > 58 ? `${complaintText.slice(0, 57)}…` : complaintText,
    MARGIN_X + 28,
    cur.y + 174
  );
  cur.ctx.fillText(specText, MARGIN_X + 820, cur.y + 174);

  cur.y += 238;

  if (data.complaintTimeWindow && CIRCADIAN_MAP[data.complaintTimeWindow]) {
    const cSlot = CIRCADIAN_MAP[data.complaintTimeWindow];
    drawParagraph(
      `Время дискомфорта (${cSlot.practicalWindow}) → ${cSlot.organTitle}: ${cSlot.clinicalMeaning}`,
      {
        font: `500 20px ${fontBody}`,
        color: '#92400e',
        lineHeight: 27,
        gapAfter: 16,
      }
    );
  }

  // ==================== KPI STRIP ====================
  const kpiW = (CONTENT_W - 48) / 4;
  const kpis = [
    { label: 'Причин по опросу', val: String(data.positiveItems.length), color: '#0f172a' },
    {
      label: 'Протестировано мышц',
      val: `${data.stats.tested} / ${data.muscleQueue.length}`,
      color: '#0f172a',
    },
    { label: 'Дисфункций ММТ', val: String(data.stats.abnormal), color: '#be123c' },
    { label: 'Скорректировано', val: String(data.stats.corrected), color: '#047857' },
  ];
  kpis.forEach((k, idx) => {
    const kx = MARGIN_X + idx * (kpiW + 16);
    cur.ctx.fillStyle = '#f8fafc';
    cur.ctx.strokeStyle = '#e2e8f0';
    cur.ctx.lineWidth = 2;
    cur.ctx.fillRect(kx, cur.y, kpiW, 92);
    cur.ctx.strokeRect(kx, cur.y, kpiW, 92);

    cur.ctx.font = `500 19px ${fontBody}`;
    cur.ctx.fillStyle = '#64748b';
    cur.ctx.fillText(k.label, kx + 18, cur.y + 34);

    cur.ctx.font = `700 32px ${fontDisplay}`;
    cur.ctx.fillStyle = k.color;
    cur.ctx.fillText(k.val, kx + 18, cur.y + 74);
  });
  cur.y += 126;

  // ==================== SECTION 1: QUESTIONNAIRE & TRIAD PROFILE ====================
  drawSectionHeading('1. Результаты опросника по Триаде здоровья');

  (Object.keys(data.domainScores) as IntakeDomain[]).forEach((domain) => {
    const s = data.domainScores[domain];
    const meta = INTAKE_DOMAIN_META[domain];
    ensureSpace(58);
    cur.ctx.font = `600 22px ${fontBody}`;
    cur.ctx.fillStyle = '#1e293b';
    cur.ctx.fillText(meta.label, MARGIN_X, cur.y);

    cur.ctx.font = `600 21px ${fontMono}`;
    cur.ctx.fillStyle = '#475569';
    const pctLabel = `${s.pct}% (${s.score}/${s.maxScore})`;
    const labelW = cur.ctx.measureText(pctLabel).width;
    cur.ctx.fillText(pctLabel, PAGE_W - MARGIN_X - labelW, cur.y);

    cur.y += 12;
    cur.ctx.fillStyle = '#e2e8f0';
    cur.ctx.fillRect(MARGIN_X, cur.y, CONTENT_W, 14);
    cur.ctx.fillStyle = s.pct >= 50 ? '#be123c' : s.pct > 0 ? '#1d4ed8' : '#cbd5e1';
    cur.ctx.fillRect(MARGIN_X, cur.y, Math.max(0, Math.round((CONTENT_W * s.pct) / 100)), 14);
    cur.y += 38;
  });

  cur.y += 10;
  if (data.positiveItems.length === 0) {
    drawParagraph('Положительных ответов по опроснику не зафиксировано.', {
      color: '#64748b',
    });
  } else {
    drawParagraph('Выявленные симптомы и вероятные первопричины:', {
      font: `600 23px ${fontBody}`,
      color: '#0f172a',
      gapAfter: 10,
    });
    data.positiveItems.forEach(({ item, severity }, idx) => {
      const sevTag = severity === 2 ? '[ВЫРАЖЕННО]' : '[УМЕРЕННО]';
      drawParagraph(
        `${idx + 1}. ${sevTag} (${INTAKE_DOMAIN_META[item.domain].shortLabel}) ${item.question}`,
        {
          font: `600 21px ${fontBody}`,
          color: severity === 2 ? '#9f1239' : '#0f172a',
          lineHeight: 28,
          gapAfter: 2,
        }
      );
      drawParagraph(`Вероятная причина: ${item.suggestedCause}`, {
        x: MARGIN_X + 26,
        width: CONTENT_W - 26,
        font: `400 20px ${fontBody}`,
        color: '#334155',
        lineHeight: 27,
        gapAfter: 10,
      });
    });
  }

  // ==================== SECTION 2: MMT RESULTS ====================
  drawSectionHeading('2. Результаты мануально-мышечного тестирования (ММТ)');

  data.muscleQueue.forEach((mId) => {
    const m = MUSCLES.find((item) => item.id === mId);
    if (!m) return;
    const rec = data.mmtRecords[mId] ?? createDefaultRecord(mId);
    const statusText = rec.retestNormotonia
      ? 'Ретест: Нормотония'
      : rec.correctionApplied
        ? 'Коррекция выполнена'
        : rec.leftTone === 'hypotonia' ||
            rec.leftTone === 'hypertonia' ||
            rec.rightTone === 'hypotonia' ||
            rec.rightTone === 'hypertonia'
          ? 'Требует коррекции'
          : 'Протокол в норме / не завершено';

    ensureSpace(88);
    cur.ctx.fillStyle = '#f8fafc';
    cur.ctx.strokeStyle = '#e2e8f0';
    cur.ctx.lineWidth = 1.5;
    cur.ctx.fillRect(MARGIN_X, cur.y - 22, CONTENT_W, 44);
    cur.ctx.strokeRect(MARGIN_X, cur.y - 22, CONTENT_W, 44);

    cur.ctx.font = `600 21px ${fontBody}`;
    cur.ctx.fillStyle = '#0f172a';
    cur.ctx.fillText(m.name, MARGIN_X + 14, cur.y + 8);

    const toneInfo = `Л: ${formatToneText(rec.leftTone)}  |  П: ${formatToneText(rec.rightTone)}  |  ${statusText}`;
    cur.ctx.font = `500 19px ${fontMono}`;
    cur.ctx.fillStyle = rec.retestNormotonia
      ? '#047857'
      : rec.leftTone === 'hypotonia' || rec.rightTone === 'hypotonia'
        ? '#be123c'
        : '#334155';
    const infoW = cur.ctx.measureText(toneInfo).width;
    cur.ctx.fillText(toneInfo, PAGE_W - MARGIN_X - 14 - infoW, cur.y + 7);
    cur.y += 34;

    const holdParts: string[] = [];
    if (rec.holdTimeLeftSec !== undefined) {
      const cat = rec.holdTimeLeftSec < 3 ? 'быстр. истощ.' : rec.holdTimeLeftSec < 6 ? 'истощ. 3–6с' : 'стойкая';
      holdParts.push(`Л: ${rec.holdTimeLeftSec.toFixed(1)} с (${cat})`);
    }
    if (rec.holdTimeRightSec !== undefined) {
      const cat = rec.holdTimeRightSec < 3 ? 'быстр. истощ.' : rec.holdTimeRightSec < 6 ? 'истощ. 3–6с' : 'стойкая';
      holdParts.push(`П: ${rec.holdTimeRightSec.toFixed(1)} с (${cat})`);
    }
    if (holdParts.length > 0) {
      drawParagraph(`Время удержания сокращения: ${holdParts.join('  |  ')}`, {
        x: MARGIN_X + 16,
        width: CONTENT_W - 16,
        font: `500 19px ${fontMono}`,
        color: '#1e40af',
        lineHeight: 26,
        gapAfter: 2,
      });
    }

    if (rec.provocations.length > 0) {
      drawParagraph(
        `Положительные провокации / ТЛ: ${rec.provocations.map((p) => MMT_PROVOCATION_LABELS[p].label).join(', ')}`,
        {
          x: MARGIN_X + 16,
          width: CONTENT_W - 16,
          font: `500 19px ${fontBody}`,
          color: '#6d28d9',
          lineHeight: 26,
          gapAfter: 2,
        }
      );
    }
    if (rec.notes.trim()) {
      drawParagraph(`Заметка специалиста: ${rec.notes.trim()}`, {
        x: MARGIN_X + 16,
        width: CONTENT_W - 16,
        font: `400 19px ${fontBody}`,
        color: '#475569',
        lineHeight: 26,
        gapAfter: 6,
      });
    }
    cur.y += 8;
  });

  // ==================== SECTION 2.5: PAIN MAP ====================
  if (data.painMap && data.painMap.length > 0) {
    drawSectionHeading('Карта боли, триггерных точек и слабых мышц');
    data.painMap.forEach((pt, idx) => {
      const typeLabel = PAIN_MARKER_META[pt.type].label;
      const zoneName = ANATOMICAL_ZONES.find((z) => z.id === pt.zoneId)?.shortName ?? pt.zoneId;
      const muscleName =
        MUSCLES.find((m) => m.id === pt.primaryMuscleId)?.name ?? 'Мышца не выбрана';
      const vas = pt.intensity !== undefined ? ` · ВАШ ${pt.intensity}/10` : '';
      const note = pt.note?.trim() ? ` — ${pt.note.trim()}` : '';
      drawParagraph(
        `${idx + 1}. [${typeLabel}] ${muscleName} (${zoneName}, ${describeBodySide(pt.x)}, x=${pt.x}, y=${pt.y}${vas})${note}`,
        {
          x: MARGIN_X + 14,
          width: CONTENT_W - 14,
          font: `400 20px ${fontBody}`,
          color: pt.type === 'pain' ? '#9f1239' : pt.type === 'trigger_point' ? '#92400e' : '#1e3a8a',
          lineHeight: 27,
          gapAfter: 6,
        }
      );
    });
  }

  // ==================== SECTION 3: CORRECTION PLAN ====================
  drawSectionHeading('3. Сформированный план коррекции для карты пациента');

  if (plan.dominantDomains.length > 0) {
    drawParagraph('3.1. Приоритеты коррекции по сферам Триады здоровья:', {
      font: `700 23px ${fontBody}`,
      color: '#0f172a',
      gapAfter: 8,
    });
    plan.dominantDomains.forEach((dom) => {
      drawParagraph(`• ${dom.label} (${dom.pct}%): ${dom.strategy}`, {
        x: MARGIN_X + 14,
        width: CONTENT_W - 14,
        font: `400 21px ${fontBody}`,
        color: '#334155',
        lineHeight: 29,
        gapAfter: 8,
      });
    });
    cur.y += 8;
  }

  if (plan.priorityMuscles.length > 0) {
    drawParagraph('3.2. Адресные протоколы коррекции по мышцам:', {
      font: `700 23px ${fontBody}`,
      color: '#0f172a',
      gapAfter: 10,
    });

    plan.priorityMuscles.forEach((entry, idx) => {
      const m = entry.muscle;
      ensureSpace(130);
      cur.ctx.fillStyle = '#eff6ff';
      cur.ctx.strokeStyle = '#bfdbfe';
      cur.ctx.lineWidth = 2;
      cur.ctx.fillRect(MARGIN_X, cur.y - 24, CONTENT_W, 44);
      cur.ctx.strokeRect(MARGIN_X, cur.y - 24, CONTENT_W, 44);

      cur.ctx.font = `700 22px ${fontBody}`;
      cur.ctx.fillStyle = '#1e3a8a';
      cur.ctx.fillText(
        `${idx + 1}. ${m.name} (${m.latinName}) — Л: ${formatToneText(entry.record.leftTone)}, П: ${formatToneText(entry.record.rightTone)}`,
        MARGIN_X + 16,
        cur.y + 6
      );
      cur.y += 38;

      if (entry.provocationDirectives.length > 0) {
        entry.provocationDirectives.forEach((pd) => {
          drawParagraph(`▸ Провокация «${pd.label}»: ${pd.hint}`, {
            x: MARGIN_X + 16,
            width: CONTENT_W - 16,
            font: `500 20px ${fontBody}`,
            color: '#1e40af',
            lineHeight: 27,
            gapAfter: 4,
          });
        });
      }

      drawParagraph(
        `НЛ (Чапман): спереди — ${m.reflexes.neurolymphaticAnterior}; сзади — ${m.reflexes.neurolymphaticPosterior}. НВ (Беннетт): ${m.reflexes.neurovascular}. Орган: ${m.reflexes.visceromotorLink}.`,
        {
          x: MARGIN_X + 16,
          width: CONTENT_W - 16,
          font: `400 20px ${fontBody}`,
          color: '#334155',
          lineHeight: 27,
          gapAfter: 6,
        }
      );

      m.correctionSteps.forEach((st) => {
        drawParagraph(`• [${st.modality} · ${st.durationOrDose}] ${st.title}: ${st.technique}`, {
          x: MARGIN_X + 22,
          width: CONTENT_W - 22,
          font: `400 20px ${fontBody}`,
          color: '#1e293b',
          lineHeight: 27,
          gapAfter: 4,
        });
      });

      drawParagraph(
        `Триада: Эмоции (ЭСР) — ${entry.triad.emotional.correctionMethod} | Энергия — ${entry.triad.energetic.keyPointsOrNutrients} | Нутриенты — ${m.nutrients.join(', ')}.`,
        {
          x: MARGIN_X + 16,
          width: CONTENT_W - 16,
          font: `400 19px ${fontBody}`,
          color: '#475569',
          lineHeight: 26,
          gapAfter: 16,
        }
      );
    });
  }

  if (data.organs.length > 0 || data.diaphragms.length > 0 || plan.balancingPoints.length > 0) {
    drawParagraph('3.3. Взаимосвязанные структуры и точки балансировки:', {
      font: `700 23px ${fontBody}`,
      color: '#0f172a',
      gapAfter: 8,
    });
    if (data.organs.length > 0) {
      drawParagraph(`• Органы: ${data.organs.map((o) => o.name).join(', ')}`, {
        x: MARGIN_X + 14,
        width: CONTENT_W - 14,
        font: `400 21px ${fontBody}`,
        gapAfter: 6,
      });
    }
    if (data.diaphragms.length > 0) {
      drawParagraph(`• Диафрагмы: ${data.diaphragms.map((d) => d.name).join(', ')}`, {
        x: MARGIN_X + 14,
        width: CONTENT_W - 14,
        font: `400 21px ${fontBody}`,
        gapAfter: 6,
      });
    }
    if (plan.balancingPoints.length > 0) {
      plan.balancingPoints.forEach((pt) => {
        drawParagraph(`• ${pt.code} (${pt.name}, ${pt.meridianName}): ${pt.location}`, {
          x: MARGIN_X + 14,
          width: CONTENT_W - 14,
          font: `400 20px ${fontBody}`,
          lineHeight: 27,
          gapAfter: 4,
        });
      });
    }
  }

  // ==================== SIGNATURE BLOCK ====================
  ensureSpace(90);
  cur.y += 20;
  cur.ctx.strokeStyle = '#cbd5e1';
  cur.ctx.lineWidth = 2;
  cur.ctx.beginPath();
  cur.ctx.moveTo(MARGIN_X, cur.y);
  cur.ctx.lineTo(PAGE_W - MARGIN_X, cur.y);
  cur.ctx.stroke();
  cur.y += 38;
  cur.ctx.font = `500 21px ${fontBody}`;
  cur.ctx.fillStyle = '#334155';
  cur.ctx.fillText(
    `Подпись специалиста: ____________________________     Дата: ${dateStr}`,
    MARGIN_X,
    cur.y
  );

  // Add page numbers on all pages
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    p.ctx.font = `400 18px ${fontMono}`;
    p.ctx.fillStyle = '#64748b';
    p.ctx.fillText('Сформировано в системе «КинезиоАтлас»', MARGIN_X, PAGE_H - 48);
    const numText = `Стр. ${idx + 1} из ${totalPages}`;
    const numW = p.ctx.measureText(numText).width;
    p.ctx.fillText(numText, PAGE_W - MARGIN_X - numW, PAGE_H - 48);
  });

  const pdfBlob = buildMultiPagePdfBlob(pages.map((p) => p.canvas));
  triggerBlobDownload(pdfBlob, makeExportFilename(data.patientName, data.visitDate, 'pdf'));
}
