import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DirectoryCustomPhoto,
  DirectoryMediaSection,
  MMTVectorArrow,
  MMTVectorArrowType,
} from '../types/atlas';
import {
  MMT_ARROW_KIND_META,
  compressImageFile,
  exportAnnotatedPhotoPng,
} from '../utils/mmtMediaStore';
import {
  DIRECTORY_MEDIA_UPDATED_EVENT,
  deleteDirectoryPhoto,
  loadDirectoryOverlayArrows,
  loadDirectoryPhotos,
  makeDirectoryEntryKey,
  saveDirectoryOverlayArrows,
  saveDirectoryPhoto,
} from '../utils/directoryMediaStore';
import { createEntityId } from '../utils/patientDatabase';
import {
  Camera,
  Check,
  Download,
  ImagePlus,
  Maximize2,
  MousePointer,
  PenTool,
  Plus,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

interface DirectoryPhotoGalleryProps {
  section: DirectoryMediaSection;
  itemId: string;
  itemName: string;
  defaultImageSrc?: string;
  defaultImageCaption?: string;
  defaultImageAttribution?: string;
  defaultSlideLabel?: string;
  photoTitlePlaceholder?: string;
  photoCaptionPlaceholder?: string;
  vectorPresets?: string[];
  /** When true and no defaultImageSrc exists, renders a compact horizontal add-photo strip when empty */
  compactStripWhenEmpty?: boolean;
}

const DEFAULT_VECTOR_PRESETS = [
  'Направление воздействия',
  'Точка контакта',
  'Фиксация',
  'Вектор смещения',
];

type ActiveSlide = 'default' | string; // string = custom photo id

export const DirectoryPhotoGallery: React.FC<DirectoryPhotoGalleryProps> = ({
  section,
  itemId,
  itemName,
  defaultImageSrc,
  defaultImageCaption,
  defaultImageAttribution,
  defaultSlideLabel = 'Схема',
  photoTitlePlaceholder = 'Например: Свой ракурс / укладка',
  photoCaptionPlaceholder = 'Пояснение к фото, точка контакта или нюанс выполнения...',
  vectorPresets = DEFAULT_VECTOR_PRESETS,
  compactStripWhenEmpty = false,
}) => {
  const [customPhotos, setCustomPhotos] = useState<DirectoryCustomPhoto[]>([]);
  const [defaultArrows, setDefaultArrows] = useState<MMTVectorArrow[]>([]);
  const [activeSlide, setActiveSlide] = useState<ActiveSlide>(
    defaultImageSrc ? 'default' : ''
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Add photo panel state
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newImageDataUrl, setNewImageDataUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Vector arrow editor state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activeArrowKind, setActiveArrowKind] =
    useState<MMTVectorArrowType>('practitioner_pressure');
  const [draftArrowLabel, setDraftArrowLabel] = useState(vectorPresets[0] ?? 'Вектор');
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [drawingDraft, setDrawingDraft] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    arrowId: string;
    endpoint: 'start' | 'end';
  } | null>(null);

  const inlineStageRef = useRef<HTMLDivElement>(null);
  const lightboxStageRef = useRef<HTMLDivElement>(null);

  const defaultOverlayKey = `${makeDirectoryEntryKey(section, itemId)}::default`;

  const refreshMedia = useCallback(async () => {
    const [photos, dArrows] = await Promise.all([
      loadDirectoryPhotos(section, itemId),
      defaultImageSrc ? loadDirectoryOverlayArrows(defaultOverlayKey) : Promise.resolve([]),
    ]);
    setCustomPhotos(photos);
    setDefaultArrows(dArrows);
    return photos;
  }, [section, itemId, defaultImageSrc, defaultOverlayKey]);

  useEffect(() => {
    let active = true;
    setSelectedArrowId(null);
    setDrawingDraft(null);
    setDraggingHandle(null);
    setIsAddPhotoOpen(false);
    setConfirmDeleteId(null);
    setNewImageDataUrl('');
    setNewTitle('');
    setNewCaption('');
    setUploadError('');
    setIsDrawingMode(false);
    setDraftArrowLabel(vectorPresets[0] ?? 'Вектор');

    refreshMedia().then((photos) => {
      if (!active) return;
      if (photos.length > 0) {
        setActiveSlide(photos[0].id);
      } else {
        setActiveSlide(defaultImageSrc ? 'default' : '');
      }
    });

    const handleMediaEvent = () => {
      refreshMedia();
    };
    window.addEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, handleMediaEvent);
    return () => {
      active = false;
      window.removeEventListener(DIRECTORY_MEDIA_UPDATED_EVENT, handleMediaEvent);
    };
  }, [section, itemId, defaultImageSrc, refreshMedia, vectorPresets]);

  const activeCustomPhoto = useMemo(
    () => customPhotos.find((p) => p.id === activeSlide) ?? null,
    [customPhotos, activeSlide]
  );

  const activeMedia = useMemo(() => {
    if (activeCustomPhoto) {
      return {
        mode: 'custom' as const,
        src: activeCustomPhoto.imageDataUrl,
        title: activeCustomPhoto.title,
        caption: activeCustomPhoto.caption,
        attribution: `Загруженное фото специалиста · ${activeCustomPhoto.title}`,
        arrows: activeCustomPhoto.arrows,
      };
    }
    if (defaultImageSrc) {
      return {
        mode: 'default' as const,
        src: defaultImageSrc,
        title: defaultSlideLabel,
        caption: defaultImageCaption ?? itemName,
        attribution: defaultImageAttribution
          ? `Источник: ${defaultImageAttribution}`
          : 'Иллюстрация справочника',
        arrows: defaultArrows,
      };
    }
    return null;
  }, [
    activeCustomPhoto,
    defaultImageSrc,
    defaultSlideLabel,
    defaultImageCaption,
    defaultImageAttribution,
    itemName,
    defaultArrows,
  ]);

  const persistActiveArrows = useCallback(
    async (nextArrows: MMTVectorArrow[]) => {
      if (activeCustomPhoto) {
        const updated: DirectoryCustomPhoto = {
          ...activeCustomPhoto,
          arrows: nextArrows,
          updatedAt: new Date().toISOString(),
        };
        setCustomPhotos((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        await saveDirectoryPhoto(updated);
      } else if (defaultImageSrc) {
        setDefaultArrows(nextArrows);
        await saveDirectoryOverlayArrows(defaultOverlayKey, nextArrows);
      }
    },
    [activeCustomPhoto, defaultImageSrc, defaultOverlayKey]
  );

  const selectedArrow = useMemo(
    () => activeMedia?.arrows.find((a) => a.id === selectedArrowId) ?? null,
    [activeMedia, selectedArrowId]
  );

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Выберите файл изображения (JPG, PNG, WEBP).');
      return;
    }
    setUploadError('');
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1400, 0.86);
      setNewImageDataUrl(compressed);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Ошибка обработки изображения'
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
    e.target.value = '';
  };

  const handleDropFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await processImageFile(file);
          break;
        }
      }
    }
  };

  const handleSaveNewPhoto = async () => {
    if (!newImageDataUrl) {
      setUploadError('Сначала выберите или перетащите фотографию.');
      return;
    }
    const now = new Date().toISOString();
    const fallbackTitle = `Фото ${customPhotos.length + 1}`;
    const photoTitle = newTitle.trim() || fallbackTitle;
    const photo: DirectoryCustomPhoto = {
      id: createEntityId('dirimg'),
      section,
      itemId,
      entryKey: makeDirectoryEntryKey(section, itemId),
      title: photoTitle,
      caption: newCaption.trim() || `${itemName} — ${photoTitle}`,
      imageDataUrl: newImageDataUrl,
      arrows: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveDirectoryPhoto(photo);
    setCustomPhotos((prev) => [...prev, photo]);
    setActiveSlide(photo.id);
    setIsAddPhotoOpen(false);
    setNewImageDataUrl('');
    setNewTitle('');
    setNewCaption('');
    setUploadError('');
  };

  const handleDeletePhoto = async (photoId: string) => {
    await deleteDirectoryPhoto(photoId, section);
    const remaining = customPhotos.filter((p) => p.id !== photoId);
    setCustomPhotos(remaining);
    setConfirmDeleteId(null);
    setSelectedArrowId(null);
    if (remaining.length > 0) {
      setActiveSlide(remaining[0].id);
    } else {
      setActiveSlide(defaultImageSrc ? 'default' : '');
    }
  };

  // Pointer drawing helpers
  const toNormalizedCoords = (
    clientX: number,
    clientY: number,
    containerEl: HTMLDivElement | null
  ): { x: number; y: number } => {
    if (!containerEl) return { x: 50, y: 50 };
    const rect = containerEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 50, y: 50 };
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
  };

  const handleStagePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    containerEl: HTMLDivElement | null
  ) => {
    if (!isDrawingMode || !activeMedia) return;
    if ((e.target as HTMLElement).dataset.arrowHandle) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pt = toNormalizedCoords(e.clientX, e.clientY, containerEl);
    setSelectedArrowId(null);
    setDrawingDraft({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
  };

  const handleStagePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    containerEl: HTMLDivElement | null
  ) => {
    if (!isDrawingMode || !activeMedia) return;
    const pt = toNormalizedCoords(e.clientX, e.clientY, containerEl);

    if (draggingHandle) {
      const updated = activeMedia.arrows.map((a) => {
        if (a.id !== draggingHandle.arrowId) return a;
        return draggingHandle.endpoint === 'start'
          ? { ...a, x1: pt.x, y1: pt.y }
          : { ...a, x2: pt.x, y2: pt.y };
      });
      if (activeCustomPhoto) {
        setCustomPhotos((prev) =>
          prev.map((p) =>
            p.id === activeCustomPhoto.id ? { ...p, arrows: updated } : p
          )
        );
      } else {
        setDefaultArrows(updated);
      }
      return;
    }

    if (drawingDraft) {
      setDrawingDraft((prev) =>
        prev ? { ...prev, x2: pt.x, y2: pt.y } : null
      );
    }
  };

  const handleStagePointerUp = async () => {
    if (!activeMedia) return;
    if (draggingHandle) {
      setDraggingHandle(null);
      await persistActiveArrows(activeMedia.arrows);
      return;
    }

    if (drawingDraft) {
      const dx = drawingDraft.x2 - drawingDraft.x1;
      const dy = drawingDraft.y2 - drawingDraft.y1;
      const dist = Math.hypot(dx, dy);
      setDrawingDraft(null);
      if (dist < 2.2) return;

      const newArrow: MMTVectorArrow = {
        id: createEntityId('dirvec'),
        x1: drawingDraft.x1,
        y1: drawingDraft.y1,
        x2: drawingDraft.x2,
        y2: drawingDraft.y2,
        kind: activeArrowKind,
        label: draftArrowLabel.trim() || undefined,
      };
      const next = [...activeMedia.arrows, newArrow];
      setSelectedArrowId(newArrow.id);
      await persistActiveArrows(next);
    }
  };

  const handleUpdateSelectedArrow = async (patch: Partial<MMTVectorArrow>) => {
    if (!selectedArrowId || !activeMedia) return;
    const next = activeMedia.arrows.map((a) =>
      a.id === selectedArrowId ? { ...a, ...patch } : a
    );
    await persistActiveArrows(next);
  };

  const handleDeleteArrow = async (arrowId: string) => {
    if (!activeMedia) return;
    const next = activeMedia.arrows.filter((a) => a.id !== arrowId);
    if (selectedArrowId === arrowId) setSelectedArrowId(null);
    await persistActiveArrows(next);
  };

  const handleUndoArrow = async () => {
    if (!activeMedia || activeMedia.arrows.length === 0) return;
    setSelectedArrowId(null);
    await persistActiveArrows(activeMedia.arrows.slice(0, -1));
  };

  const handleClearArrows = async () => {
    if (!activeMedia) return;
    setSelectedArrowId(null);
    await persistActiveArrows([]);
  };

  const renderArrowsSvgOverlay = (stageKind: 'inline' | 'lightbox') => {
    if (!activeMedia) return null;
    const markerPrefix = `dirvec-${section}-${itemId}-${stageKind}`;
    const allToRender = drawingDraft
      ? [
          ...activeMedia.arrows,
          {
            id: '__draft__',
            ...drawingDraft,
            kind: activeArrowKind,
            label: draftArrowLabel.trim() || undefined,
          },
        ]
      : activeMedia.arrows;

    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 w-full h-full ${
          isDrawingMode ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
      >
        <defs>
          {(Object.keys(MMT_ARROW_KIND_META) as MMTVectorArrowType[]).map((kind) => (
            <marker
              key={kind}
              id={`${markerPrefix}-${kind}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4.2"
              markerHeight="4.2"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.2 L 9 5 L 0 8.8 z" fill={MMT_ARROW_KIND_META[kind].color} />
            </marker>
          ))}
        </defs>

        {allToRender.map((arr) => {
          const meta = MMT_ARROW_KIND_META[arr.kind];
          const isSelected = arr.id === selectedArrowId;
          const isDraft = arr.id === '__draft__';
          const midX = (arr.x1 + arr.x2) / 2;
          const midY = (arr.y1 + arr.y2) / 2;

          return (
            <g key={arr.id}>
              <line
                x1={arr.x1}
                y1={arr.y1}
                x2={arr.x2}
                y2={arr.y2}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={isSelected ? 1.8 : 1.45}
                strokeLinecap="round"
              />
              <line
                x1={arr.x1}
                y1={arr.y1}
                x2={arr.x2}
                y2={arr.y2}
                stroke={meta.color}
                strokeWidth={isSelected ? 1.05 : 0.8}
                strokeDasharray={arr.kind === 'patient_action' ? '2 1.2' : undefined}
                strokeLinecap="round"
                markerEnd={`url(#${markerPrefix}-${arr.kind})`}
                opacity={isDraft ? 0.85 : 1}
                className={isDrawingMode && !isDraft ? 'pointer-events-auto cursor-pointer' : ''}
                onClick={(e) => {
                  if (!isDrawingMode || isDraft) return;
                  e.stopPropagation();
                  setSelectedArrowId(arr.id);
                }}
              />
              <circle
                cx={arr.x1}
                cy={arr.y1}
                r={isSelected ? 1.5 : 1.1}
                fill="#ffffff"
                stroke={meta.color}
                strokeWidth="0.65"
              />
              {arr.label && (
                <g transform={`translate(${midX}, ${Math.max(4, midY - 2.8)})`}>
                  <text
                    textAnchor="middle"
                    fontSize="2.8"
                    fontWeight="700"
                    fill="#ffffff"
                    stroke="#ffffff"
                    strokeWidth="0.9"
                    paintOrder="stroke"
                    className="select-none"
                  >
                    {arr.label}
                  </text>
                  <text
                    textAnchor="middle"
                    fontSize="2.8"
                    fontWeight="700"
                    fill={meta.color}
                    className="select-none"
                  >
                    {arr.label}
                  </text>
                </g>
              )}
              {isDrawingMode && !isDraft && (
                <>
                  <circle
                    cx={arr.x1}
                    cy={arr.y1}
                    r={isSelected ? 2.2 : 1.7}
                    fill="#ffffff"
                    stroke={meta.color}
                    strokeWidth="0.7"
                    data-arrow-handle="start"
                    className="pointer-events-auto cursor-grab"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedArrowId(arr.id);
                      setDraggingHandle({ arrowId: arr.id, endpoint: 'start' });
                    }}
                  />
                  <circle
                    cx={arr.x2}
                    cy={arr.y2}
                    r={isSelected ? 2.2 : 1.7}
                    fill={meta.color}
                    stroke="#ffffff"
                    strokeWidth="0.7"
                    data-arrow-handle="end"
                    className="pointer-events-auto cursor-grab"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedArrowId(arr.id);
                      setDraggingHandle({ arrowId: arr.id, endpoint: 'end' });
                    }}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderDrawingToolbar = () => {
    if (!activeMedia) return null;
    return (
      <div className="px-3 py-2.5 bg-slate-100/90 border-t border-slate-200 space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {(Object.keys(MMT_ARROW_KIND_META) as MMTVectorArrowType[]).map((kind) => {
              const meta = MMT_ARROW_KIND_META[kind];
              const active = activeArrowKind === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setActiveArrowKind(kind);
                    if (selectedArrow) {
                      handleUpdateSelectedArrow({ kind });
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? `${meta.bgBadge} ${meta.textBadge}`
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndoArrow}
              disabled={activeMedia.arrows.length === 0}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <Undo2 className="w-3 h-3" />
              <span>Отменить</span>
            </button>
            <button
              type="button"
              onClick={handleClearArrows}
              disabled={activeMedia.arrows.length === 0}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-700 bg-white border border-rose-200 rounded hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Очистить</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="text"
            value={selectedArrow ? selectedArrow.label ?? '' : draftArrowLabel}
            onChange={(e) => {
              if (selectedArrow) {
                handleUpdateSelectedArrow({ label: e.target.value });
              } else {
                setDraftArrowLabel(e.target.value);
              }
            }}
            placeholder="Подпись стрелки..."
            className="flex-1 min-w-[140px] px-2 py-1 text-[11px] bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
          />
          {selectedArrow && (
            <button
              type="button"
              onClick={() => handleDeleteArrow(selectedArrow.id)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Удалить</span>
            </button>
          )}
        </div>

        {vectorPresets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[10px]">
            {vectorPresets.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  if (selectedArrow) {
                    handleUpdateSelectedArrow({ label: lbl });
                  } else {
                    setDraftArrowLabel(lbl);
                  }
                }}
                className="px-1.5 py-0.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 rounded cursor-pointer"
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Compact empty strip for sections without a built-in default photo (Chains / Protocols)
  if (compactStripWhenEmpty && !activeMedia && !isAddPhotoOpen) {
    return (
      <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <ImagePlus className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Фотоматериалы и схемы специалиста (0)</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAddPhotoOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-md cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>Добавить фото</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        {/* Top Controls Header */}
        <div className="px-2.5 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
          {/* Slide Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-0.5 bg-slate-100 rounded-md text-[11px] font-medium min-w-0">
            {customPhotos.map((cp) => (
              <button
                key={cp.id}
                type="button"
                onClick={() => {
                  setActiveSlide(cp.id);
                  setSelectedArrowId(null);
                  setConfirmDeleteId(null);
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer max-w-[140px] ${
                  activeSlide === cp.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={cp.title}
              >
                <Camera className="w-3 h-3 text-blue-700 shrink-0" />
                <span className="truncate">{cp.title}</span>
              </button>
            ))}

            {defaultImageSrc && (
              <button
                type="button"
                onClick={() => {
                  setActiveSlide('default');
                  setSelectedArrowId(null);
                  setConfirmDeleteId(null);
                }}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSlide === 'default' || !activeCustomPhoto
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {defaultSlideLabel}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddPhotoOpen((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isAddPhotoOpen
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-blue-700 border-slate-200 hover:bg-blue-50/60 hover:border-blue-300'
              }`}
              title="Добавить свою фотографию или схему в этот раздел"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить фото</span>
            </button>

            {activeMedia && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDrawingMode((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isDrawingMode
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Нарисовать стрелки и пометки на фото"
                >
                  {isDrawingMode ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Готово</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="w-3 h-3" />
                      <span>
                        {activeMedia.arrows.length > 0
                          ? `(${activeMedia.arrows.length})`
                          : 'Стрелки'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded cursor-pointer shrink-0"
                  title="Увеличить изображение"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inline Add Photo Form */}
        {isAddPhotoOpen && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDropFile}
            onPaste={handlePasteImage}
            className={`p-3 border-b border-blue-200 space-y-2.5 text-xs transition-colors ${
              isDragOver ? 'bg-blue-100/70' : 'bg-blue-50/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">
                Добавить фото: {itemName}
              </span>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={photoTitlePlaceholder}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder={photoCaptionPlaceholder}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium rounded-md cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-700" />
                <span>{isCompressing ? 'Сжатие...' : 'Выбрать фото / камеру'}</span>
              </button>

              {newImageDataUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={newImageDataUrl}
                    alt="Превью"
                    className="w-10 h-8 object-cover rounded border border-slate-200"
                  />
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Готово
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500">
                  Можно перетащить файл или вставить (Ctrl+V)
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveNewPhoto}
                disabled={!newImageDataUrl || isCompressing}
                className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-semibold rounded-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Сохранить</span>
              </button>
            </div>

            {uploadError && <p className="text-[11px] text-rose-700">{uploadError}</p>}
          </div>
        )}

        {/* Active Image Stage */}
        {activeMedia && (
          <div
            className={`relative flex-1 min-h-[190px] bg-white flex items-center justify-center p-2 ${
              isDrawingMode ? '' : 'cursor-zoom-in'
            }`}
            onClick={() => {
              if (!isDrawingMode) setIsLightboxOpen(true);
            }}
          >
            <div
              ref={inlineStageRef}
              onPointerDown={(e) => handleStagePointerDown(e, inlineStageRef.current)}
              onPointerMove={(e) => handleStagePointerMove(e, inlineStageRef.current)}
              onPointerUp={handleStagePointerUp}
              className="relative inline-block max-w-full select-none touch-none"
            >
              <img
                src={activeMedia.src}
                alt={activeMedia.caption || itemName}
                className="max-h-[220px] w-full object-contain rounded block mx-auto pointer-events-none"
              />
              {(activeMedia.arrows.length > 0 || isDrawingMode) &&
                renderArrowsSvgOverlay('inline')}
            </div>
          </div>
        )}

        {/* Vector Toolbar when drawing mode active */}
        {isDrawingMode && renderDrawingToolbar()}

        {/* Caption & Footer Actions */}
        {activeMedia && (
          <div className="px-3 py-2 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
            <div className="min-w-0 flex-1">
              {activeCustomPhoto && activeCustomPhoto.caption && (
                <div className="text-[11px] text-slate-700 font-medium truncate mb-0.5">
                  {activeCustomPhoto.caption}
                </div>
              )}
              <div className="truncate">{activeMedia.attribution}</div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeMedia.arrows.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    exportAnnotatedPhotoPng(
                      activeMedia.src,
                      activeMedia.arrows,
                      `${section}_${itemId}_${activeMedia.title}`
                    )
                  }
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded cursor-pointer"
                  title="Сохранить PNG со стрелками"
                >
                  <Download className="w-3 h-3 text-blue-700" />
                  <span>PNG</span>
                </button>
              )}

              {activeCustomPhoto &&
                (confirmDeleteId === activeCustomPhoto.id ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(activeCustomPhoto.id)}
                      className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                    >
                      Удалить
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded cursor-pointer"
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(activeCustomPhoto.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Удалить это фото"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && activeMedia && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {itemName} — {activeMedia.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">{activeMedia.attribution}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawingMode((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                    isDrawingMode
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isDrawingMode ? (
                    <>
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Закончить разметку</span>
                    </>
                  ) : (
                    <>
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Стрелки ({activeMedia.arrows.length})</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 bg-slate-50 flex flex-col items-center gap-3 overflow-y-auto flex-1">
              {(customPhotos.length > 0 && defaultImageSrc) || customPhotos.length > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
                  {customPhotos.map((cp) => (
                    <button
                      key={cp.id}
                      type="button"
                      onClick={() => setActiveSlide(cp.id)}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        activeSlide === cp.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cp.title}
                    </button>
                  ))}
                  {defaultImageSrc && (
                    <button
                      type="button"
                      onClick={() => setActiveSlide('default')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        activeSlide === 'default' || !activeCustomPhoto
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {defaultSlideLabel}
                    </button>
                  )}
                </div>
              ) : null}

              <div
                ref={lightboxStageRef}
                onPointerDown={(e) => handleStagePointerDown(e, lightboxStageRef.current)}
                onPointerMove={(e) => handleStagePointerMove(e, lightboxStageRef.current)}
                onPointerUp={handleStagePointerUp}
                className="relative inline-block max-w-full select-none touch-none"
              >
                <img
                  src={activeMedia.src}
                  alt={activeMedia.caption || itemName}
                  className="max-h-[60vh] w-auto object-contain rounded-lg pointer-events-none"
                />
                {(activeMedia.arrows.length > 0 || isDrawingMode) &&
                  renderArrowsSvgOverlay('lightbox')}
              </div>
            </div>

            {isDrawingMode && renderDrawingToolbar()}

            {activeMedia.caption && (
              <div className="px-5 py-3 border-t border-slate-200 text-xs text-slate-700 leading-relaxed shrink-0">
                {activeMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
