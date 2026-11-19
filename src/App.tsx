import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ACUPOINTS,
  ANATOMICAL_DIVISIONS,
  ANATOMICAL_SIDE_META,
  ANATOMICAL_ZONES,
  BONES,
  DIAPHRAGMS,
  FASCIAS,
  JOINTS,
  MERIDIANS,
  MUSCLES,
  MYOFASCIAL_CHAINS,
  NEURO_PROFILES,
  ORGANS,
  TENDONS,
  VESSELS,
  getMuscleSide,
  getOrganSide,
} from './data';
import {
  AnatomicalSide,
  AnatomicalZoneId,
  CircadianPeriodId,
  EntityType,
  PatientComplaintEvent,
  PatientProfile,
  PatientVisitRecord,
  PostureAssessmentRecord,
  SelectedEntity,
} from './types/atlas';
import {
  AtlasPlateId,
  OpenSourceAtlasViewer,
} from './components/OpenSourceAtlasViewer';
import { EntityInspector } from './components/EntityInspector';
import { MMTDirectoryView } from './components/MMTDirectoryView';
import { ChainsDirectoryView } from './components/ChainsDirectoryView';
import { MeridiansDirectoryView } from './components/MeridiansDirectoryView';
import { ProtocolsView } from './components/ProtocolsView';
import { SymptomSearchView } from './components/SymptomSearchView';
import { IntakeSessionView } from './components/IntakeSessionView';
import { PatientsView } from './components/PatientsView';
import { ComplaintTimelineView } from './components/ComplaintTimelineView';
import { LearningSystemView } from './components/LearningSystemView';
import { StudyNotesView } from './components/StudyNotesView';
import { MudrasDirectoryView } from './components/MudrasDirectoryView';
import { NosodesDirectoryView } from './components/NosodesDirectoryView';
import { TapingDirectoryView } from './components/TapingDirectoryView';
import { TrustManipulationsView } from './components/TrustManipulationsView';
import { DiagnosticTestsView } from './components/DiagnosticTestsView';
import { MovementPatternsView } from './components/MovementPatternsView';
import { CraniosacralDirectoryView } from './components/CraniosacralDirectoryView';
import { ContextDirectoryTab } from './components/MMTContextualCorrectionPanel';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LocalHostingModal, ModalTab } from './components/LocalHostingModal';
import { AnatomicalZoneClassifierPanel } from './components/AnatomicalZoneClassifierPanel';
import { fuzzyMatchScore } from './utils/fuzzySearch';
import { setupAutoMirrorListeners } from './utils/desktopStorageEngine';
import { checkServiceWorkerUpdate } from './utils/appUpdater';
import {
  PATIENT_DB_UPDATED_EVENT,
  createEntityId,
  deletePatientProfile,
  deletePatientVisit,
  importDatabaseSnapshot,
  loadPatientDatabase,
  savePatientProfile,
  savePatientVisit,
} from './utils/patientDatabase';
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Laptop,
  Layers,
  Maximize2,
  Minimize2,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

type WorkspaceBlock = 'crm' | 'learning' | 'atlas_group' | 'correction_dir';

type WorkspaceTab =
  | 'patients'
  | 'intake'
  | 'timeline'
  | 'symptoms'
  | 'learning'
  | 'notes'
  | 'atlas'
  | 'chains'
  | 'meridians'
  | 'tests'
  | 'patterns'
  | 'protocols'
  | 'mudras'
  | 'nosodes'
  | 'taping'
  | 'mmt'
  | 'trusts'
  | 'craniosacral';
type SidebarCategory =
  | 'muscle'
  | 'chain'
  | 'organ'
  | 'diaphragm'
  | 'meridian'
  | 'neuro'
  | 'fascia'
  | 'tendon'
  | 'joint'
  | 'bone'
  | 'vessel';

interface NavBlockDefinition {
  id: WorkspaceBlock;
  label: string;
  items: ReadonlyArray<{ id: WorkspaceTab; label: string }>;
}

const NAV_BLOCKS: ReadonlyArray<NavBlockDefinition> = [
  {
    id: 'crm',
    label: 'CRM',
    items: [
      { id: 'patients', label: 'Пациенты' },
      { id: 'intake', label: 'Анамнез' },
      { id: 'timeline', label: 'Шкала жалоб' },
      { id: 'symptoms', label: 'Справочник клинических жалоб' },
    ],
  },
  {
    id: 'learning',
    label: 'Обучение',
    items: [
      { id: 'learning', label: 'Пошаговый курс' },
      { id: 'notes', label: 'Конспект для заметок' },
    ],
  },
  {
    id: 'atlas_group',
    label: 'Атлас',
    items: [
      { id: 'atlas', label: 'Атлас мышц' },
      { id: 'chains', label: 'Мио-фасциальные цепи МФЦ' },
      { id: 'meridians', label: 'Меридианы и карта акупунктурных точек' },
      { id: 'tests', label: 'Тесты и Пробы' },
      { id: 'patterns', label: 'Паттерны движений' },
    ],
  },
  {
    id: 'correction_dir',
    label: 'Справочник коррекции',
    items: [
      { id: 'protocols', label: 'Протоколы' },
      { id: 'mudras', label: 'Мудры' },
      { id: 'nosodes', label: 'Нозоды' },
      { id: 'taping', label: 'Тейпирование' },
      { id: 'mmt', label: 'ММТ' },
      { id: 'trusts', label: 'Трасты' },
      { id: 'craniosacral', label: 'Краниосакральная коррекция' },
    ],
  },
];

const TAB_TO_BLOCK: Record<WorkspaceTab, WorkspaceBlock> = {
  patients: 'crm',
  intake: 'crm',
  timeline: 'crm',
  symptoms: 'crm',
  learning: 'learning',
  notes: 'learning',
  atlas: 'atlas_group',
  chains: 'atlas_group',
  meridians: 'atlas_group',
  tests: 'atlas_group',
  patterns: 'atlas_group',
  protocols: 'correction_dir',
  mudras: 'correction_dir',
  nosodes: 'correction_dir',
  taping: 'correction_dir',
  mmt: 'correction_dir',
  trusts: 'correction_dir',
  craniosacral: 'correction_dir',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('atlas');
  const [lastTabByBlock, setLastTabByBlock] = useState<Record<WorkspaceBlock, WorkspaceTab>>({
    crm: 'patients',
    learning: 'learning',
    atlas_group: 'atlas',
    correction_dir: 'protocols',
  });

  const activeBlock = TAB_TO_BLOCK[activeTab];

  const [targetDirectoryItemId, setTargetDirectoryItemId] = useState<string | null>(null);

  const selectTab = useCallback((tab: WorkspaceTab) => {
    setActiveTab(tab);
    setTargetDirectoryItemId(null);
    setLastTabByBlock((prev) => ({
      ...prev,
      [TAB_TO_BLOCK[tab]]: tab,
    }));
  }, []);

  const handleOpenDirectoryTab = useCallback(
    (tab: ContextDirectoryTab, itemId?: string) => {
      setActiveTab(tab);
      setTargetDirectoryItemId(itemId ?? null);
      setLastTabByBlock((prev) => ({
        ...prev,
        [TAB_TO_BLOCK[tab]]: tab,
      }));
    },
    []
  );

  const selectBlock = useCallback(
    (blockId: WorkspaceBlock) => {
      if (activeBlock === blockId) {
        const defaultTab = NAV_BLOCKS.find((b) => b.id === blockId)?.items[0].id;
        if (defaultTab) selectTab(defaultTab);
      } else {
        selectTab(lastTabByBlock[blockId]);
      }
    },
    [activeBlock, lastTabByBlock, selectTab]
  );

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>({
    type: 'muscle',
    id: 'iliopsoas',
  });
  const [history, setHistory] = useState<SelectedEntity[]>([
    { type: 'muscle', id: 'iliopsoas' },
  ]);

  // Atlas Explorer sidebar state
  const [zoneFilter, setZoneFilter] = useState<AnatomicalZoneId | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<AnatomicalSide | 'all'>('all');
  const [sidebarCategory, setSidebarCategory] = useState<SidebarCategory>('muscle');
  const [fasciaLayerFilter, setFasciaLayerFilter] = useState<
    'all' | 'superficial' | 'deep' | 'visceral'
  >('all');
  const [jointSizeFilter, setJointSizeFilter] = useState<'all' | 'major' | 'small'>('all');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [visibleSidebarLimit, setVisibleSidebarLimit] = useState(80);

  // Open-source anatomical plate state
  const [isStageExpanded, setIsStageExpanded] = useState(false);
  const [activePlate, setActivePlate] = useState<AtlasPlateId>('muscles');
  const [zoomZone, setZoomZone] = useState<AnatomicalZoneId | 'all'>('all');
  const [visibleLayers, setVisibleLayers] = useState({
    muscles: true,
    organs: true,
    diaphragms: true,
    acupoints: true,
    chains: true,
    fascias: false,
    tendons: false,
    joints: false,
    bones: false,
    vessels: false,
  });

  // Global search, zone classifier & local hosting modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClassifierOpen, setIsClassifierOpen] = useState(false);
  const [isHostingModalOpen, setIsHostingModalOpen] = useState(false);
  const [hostingModalTab, setHostingModalTab] = useState<ModalTab>('storage');
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [storageSyncNonce, setStorageSyncNonce] = useState(0);
  const [targetSymptomId, setTargetSymptomId] = useState<string | null>(null);
  const [targetCircadianPeriod, setTargetCircadianPeriod] = useState<CircadianPeriodId | null>(null);

  // Offline patient database state
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [visits, setVisits] = useState<PatientVisitRecord[]>([]);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [loadedVisit, setLoadedVisit] = useState<PatientVisitRecord | null>(null);
  const [sessionResetNonce, setSessionResetNonce] = useState(0);

  const refreshDatabaseFromStorage = useCallback(async () => {
    const { patients: loadedPatients, visits: loadedVisits } = await loadPatientDatabase();
    setPatients(loadedPatients);
    setVisits(loadedVisits);
    setStorageSyncNonce((n) => n + 1);
  }, []);

  // Load offline database (IndexedDB + localStorage fallback), auto-mirroring & SW updates on mount
  useEffect(() => {
    let cancelled = false;
    loadPatientDatabase().then(({ patients: loadedPatients, visits: loadedVisits }) => {
      if (cancelled) return;
      setPatients(loadedPatients);
      setVisits(loadedVisits);
    });

    const handleDbUpdated = () => {
      loadPatientDatabase().then(({ patients: loadedPatients, visits: loadedVisits }) => {
        if (cancelled) return;
        setPatients(loadedPatients);
        setVisits(loadedVisits);
      });
    };
    window.addEventListener(PATIENT_DB_UPDATED_EVENT, handleDbUpdated);

    const stopAutoMirror = setupAutoMirrorListeners();

    checkServiceWorkerUpdate().then((sw) => {
      if (!cancelled && sw.waitingReady) {
        setSwUpdateAvailable(true);
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener(PATIENT_DB_UPDATED_EVENT, handleDbUpdated);
      stopAutoMirror();
    };
  }, []);

  // Keyboard shortcut Cmd/Ctrl + K for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsHostingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activePatient = useMemo(
    () => patients.find((p) => p.id === activePatientId) ?? null,
    [patients, activePatientId]
  );

  // Patient database handlers
  const handleSavePatient = useCallback(
    async (
      data: Omit<PatientProfile, 'id' | 'createdAt' | 'updatedAt'>,
      existingId?: string
    ): Promise<PatientProfile> => {
      const now = new Date().toISOString();
      const existing = existingId ? patients.find((p) => p.id === existingId) : undefined;
      const profile: PatientProfile = existing
        ? { ...existing, ...data, updatedAt: now }
        : {
            id: createEntityId('pat'),
            createdAt: now,
            updatedAt: now,
            ...data,
          };

      await savePatientProfile(profile);
      setPatients((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
      return profile;
    },
    [patients]
  );

  const handleDeletePatient = useCallback(
    async (patientId: string) => {
      await deletePatientProfile(patientId);
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      setVisits((prev) => prev.filter((v) => v.patientId !== patientId));
      if (activePatientId === patientId) {
        setActivePatientId(null);
      }
    },
    [activePatientId]
  );

  const handleDeleteVisit = useCallback(async (visitId: string) => {
    await deletePatientVisit(visitId);
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
  }, []);

  const handleImportDatabaseJson = useCallback(async (jsonText: string) => {
    const {
      patients: mergedPatients,
      visits: mergedVisits,
      addedCount,
    } = await importDatabaseSnapshot(jsonText);
    setPatients(mergedPatients);
    setVisits(mergedVisits);
    return addedCount;
  }, []);

  const handleSaveVisitToPatient = useCallback(
    async (
      visitData: Omit<PatientVisitRecord, 'id' | 'createdAt' | 'updatedAt'>,
      existingVisitId?: string,
      fallbackPatientName?: string
    ): Promise<PatientVisitRecord | null> => {
      const now = new Date().toISOString();
      let resolvedPatientId = visitData.patientId;

      // Auto-create patient card if user saved an unlinked intake session
      if (!resolvedPatientId) {
        const autoName =
          fallbackPatientName?.trim() ||
          `Пациент от ${new Date().toLocaleDateString('ru-RU')}`;
        const newProfile: PatientProfile = {
          id: createEntityId('pat'),
          fullName: autoName,
          cardNumber: `К-${String(patients.length + 1).padStart(3, '0')}`,
          painMap: visitData.painMap,
          postureAssessments: visitData.postureAssessments,
          createdAt: now,
          updatedAt: now,
        };
        await savePatientProfile(newProfile);
        setPatients((prev) => [newProfile, ...prev]);
        setActivePatientId(newProfile.id);
        resolvedPatientId = newProfile.id;
      } else {
        const targetPatient = patients.find((p) => p.id === resolvedPatientId);
        if (targetPatient) {
          const touchedPatient: PatientProfile = {
            ...targetPatient,
            painMap:
              visitData.painMap !== undefined ? visitData.painMap : targetPatient.painMap,
            postureAssessments:
              visitData.postureAssessments !== undefined
                ? visitData.postureAssessments
                : targetPatient.postureAssessments,
            updatedAt: now,
          };
          await savePatientProfile(touchedPatient);
          setPatients((prev) => [
            touchedPatient,
            ...prev.filter((p) => p.id !== touchedPatient.id),
          ]);
        }
      }

      const existingVisit = existingVisitId
        ? visits.find((v) => v.id === existingVisitId)
        : undefined;

      const visitRecord: PatientVisitRecord = existingVisit
        ? {
            ...existingVisit,
            ...visitData,
            patientId: resolvedPatientId,
            updatedAt: now,
          }
        : {
            id: createEntityId('vis'),
            createdAt: now,
            updatedAt: now,
            ...visitData,
            patientId: resolvedPatientId,
          };

      await savePatientVisit(visitRecord);
      setVisits((prev) => [visitRecord, ...prev.filter((v) => v.id !== visitRecord.id)]);
      return visitRecord;
    },
    [patients, visits]
  );

  const handleStartNewVisit = useCallback((patientId: string) => {
    setActivePatientId(patientId);
    setLoadedVisit(null);
    setSessionResetNonce((n) => n + 1);
    setActiveTab('intake');
  }, []);

  const handleOpenVisitInSession = useCallback((visit: PatientVisitRecord) => {
    setActivePatientId(visit.patientId);
    setLoadedVisit({ ...visit });
    setActiveTab('intake');
  }, []);

  const handleSaveComplaintEvent = useCallback(
    async (patientId: string, event: PatientComplaintEvent) => {
      const target = patients.find((p) => p.id === patientId);
      if (!target) return;
      const updated: PatientProfile = {
        ...target,
        complaintsTimeline: [event, ...(target.complaintsTimeline ?? [])],
        updatedAt: new Date().toISOString(),
      };
      await savePatientProfile(updated);
      setPatients((prev) => [updated, ...prev.filter((p) => p.id !== updated.id)]);
    },
    [patients]
  );

  const handleDeleteComplaintEvent = useCallback(
    async (patientId: string, eventId: string) => {
      const target = patients.find((p) => p.id === patientId);
      if (!target) return;
      const updated: PatientProfile = {
        ...target,
        complaintsTimeline: (target.complaintsTimeline ?? []).filter((e) => e.id !== eventId),
        updatedAt: new Date().toISOString(),
      };
      await savePatientProfile(updated);
      setPatients((prev) => [updated, ...prev.filter((p) => p.id !== updated.id)]);
    },
    [patients]
  );

  const handleSavePatientPostureAssessments = useCallback(
    async (patientId: string, assessments: PostureAssessmentRecord[]) => {
      const target = patients.find((p) => p.id === patientId);
      if (!target) return;
      const updated: PatientProfile = {
        ...target,
        postureAssessments: assessments,
        updatedAt: new Date().toISOString(),
      };
      await savePatientProfile(updated);
      setPatients((prev) => [updated, ...prev.filter((p) => p.id !== updated.id)]);
    },
    [patients]
  );

  const syncPlateForEntity = useCallback((entity: SelectedEntity, switchPlate: boolean) => {
    const CORE_HEAD_IDS = new Set([
      'temporalis',
      'masseter',
      'lateral-pterygoid',
      'medial-pterygoid',
      'suboccipitals',
    ]);
    const CORE_NECK_IDS = new Set([
      'suprahyoid-infrahyoid',
      'scm',
      'scalenes',
      'deep-neck-flexors',
      'cervical-extensors',
      'levator-scapulae',
    ]);

    if (entity.type === 'muscle') {
      const m = MUSCLES.find((item) => item.id === entity.id);
      if (switchPlate && m) {
        if (CORE_HEAD_IDS.has(m.id)) {
          setActivePlate('head');
        } else if (CORE_NECK_IDS.has(m.id)) {
          setActivePlate('neck');
        } else {
          setActivePlate('muscles');
          if (m.id.startsWith('m-')) {
            setZoomZone(m.zone);
          }
        }
      }
      setVisibleLayers((prev) => ({ ...prev, muscles: true }));
      setSidebarCategory('muscle');
    } else if (entity.type === 'chain') {
      if (switchPlate) {
        setActivePlate('muscles');
        setZoomZone('all');
      }
      setVisibleLayers((prev) => ({ ...prev, chains: true, muscles: true }));
      setSidebarCategory('chain');
    } else if (entity.type === 'organ') {
      if (switchPlate) setActivePlate('organs');
      setVisibleLayers((prev) => ({ ...prev, organs: true, diaphragms: true }));
      setSidebarCategory('organ');
    } else if (entity.type === 'diaphragm') {
      if (switchPlate) setActivePlate('diaphragm');
      setVisibleLayers((prev) => ({ ...prev, diaphragms: true }));
      setSidebarCategory('diaphragm');
    } else if (entity.type === 'meridian') {
      if (switchPlate) setActivePlate('meridians');
      setVisibleLayers((prev) => ({ ...prev, acupoints: true }));
      setSidebarCategory('meridian');
    } else if (entity.type === 'acupoint') {
      if (switchPlate) setActivePlate('meridians');
      setVisibleLayers((prev) => ({ ...prev, acupoints: true }));
    } else if (entity.type === 'neuro') {
      setSidebarCategory('neuro');
    } else if (entity.type === 'fascia') {
      if (switchPlate) setActivePlate('muscles');
      setVisibleLayers((prev) => ({ ...prev, fascias: true }));
      setSidebarCategory('fascia');
    } else if (entity.type === 'tendon') {
      if (switchPlate) setActivePlate('muscles');
      setVisibleLayers((prev) => ({ ...prev, tendons: true }));
      setSidebarCategory('tendon');
    } else if (entity.type === 'joint') {
      if (switchPlate) setActivePlate('muscles');
      setVisibleLayers((prev) => ({ ...prev, joints: true }));
      setSidebarCategory('joint');
    } else if (entity.type === 'bone') {
      if (switchPlate) setActivePlate('muscles');
      setVisibleLayers((prev) => ({ ...prev, bones: true }));
      setSidebarCategory('bone');
    } else if (entity.type === 'vessel') {
      if (switchPlate) setActivePlate('muscles');
      setVisibleLayers((prev) => ({ ...prev, vessels: true }));
      setSidebarCategory('vessel');
    }
  }, []);

  const handleSelectEntity = useCallback(
    (entity: SelectedEntity, switchPlate = true) => {
      setSelectedEntity(entity);
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.type === entity.type && last.id === entity.id) return prev;
        return [...prev.slice(-11), entity];
      });
      syncPlateForEntity(entity, switchPlate);
    },
    [syncPlateForEntity]
  );

  const handleNavigateBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const nextHistory = prev.slice(0, -1);
      const target = nextHistory[nextHistory.length - 1];
      setSelectedEntity(target);
      syncPlateForEntity(target, true);
      return nextHistory;
    });
  }, [syncPlateForEntity]);

  const handleOpenInAtlas = useCallback(
    (entity: SelectedEntity) => {
      handleSelectEntity(entity, true);
      setActiveTab('atlas');
    },
    [handleSelectEntity]
  );

  const handleToggleLayer = useCallback(
    (
      layer:
        | 'muscles'
        | 'organs'
        | 'diaphragms'
        | 'acupoints'
        | 'chains'
        | 'fascias'
        | 'tendons'
        | 'joints'
        | 'bones'
        | 'vessels'
    ) => {
      setVisibleLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    },
    []
  );

  // Filtered sidebar items with intuitive fuzzy matching
  const sidebarItems = useMemo(() => {
    const q = sidebarSearch.trim();

    const rankAndMap = <T,>(
      items: T[],
      getSearchText: (item: T) => { title: string; searchable: string },
      mapItem: (item: T) => {
        type: EntityType;
        id: string;
        title: string;
        subtitle: string;
      }
    ) => {
      if (!q) return items.map(mapItem);
      return items
        .map((item) => {
          const { title, searchable } = getSearchText(item);
          return { item, score: fuzzyMatchScore(q, searchable, title) };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => mapItem(x.item));
    };

    if (sidebarCategory === 'muscle') {
      const zoneFiltered = MUSCLES.filter((m) => {
        if (zoneFilter !== 'all' && m.zone !== zoneFilter) return false;
        if (sideFilter !== 'all' && getMuscleSide(m) !== sideFilter) return false;
        return true;
      });
      return rankAndMap(
        zoneFiltered,
        (m) => ({
          title: m.name,
          searchable: `${m.name} ${m.latinName} ${m.spinalSegment} ${m.innervation}`,
        }),
        (m) => ({
          type: 'muscle' as EntityType,
          id: m.id,
          title: m.name,
          subtitle: `${ANATOMICAL_ZONES.find((z) => z.id === m.zone)?.shortName ?? ''} · ${
            ANATOMICAL_SIDE_META[getMuscleSide(m)].shortLabel
          } · ${m.spinalSegment.split('·')[0].trim()}`,
        })
      );
    }

    if (sidebarCategory === 'chain') {
      return rankAndMap(
        MYOFASCIAL_CHAINS,
        (ch) => ({
          title: ch.name,
          searchable: `${ch.name} ${ch.englishName} ${ch.shortCode} ${ch.plane} ${ch.pathwaySegments.join(' ')}`,
        }),
        (ch) => ({
          type: 'chain' as EntityType,
          id: ch.id,
          title: ch.name,
          subtitle: `${ch.shortCode} · ${ch.plane}`,
        })
      );
    }

    if (sidebarCategory === 'organ') {
      const zoneFiltered = ORGANS.filter((o) => {
        if (zoneFilter !== 'all' && o.zone !== zoneFilter) return false;
        if (sideFilter !== 'all') {
          const oSide = getOrganSide(o);
          if (oSide !== 'both' && oSide !== sideFilter) return false;
        }
        return true;
      });
      return rankAndMap(
        zoneFiltered,
        (o) => ({
          title: o.name,
          searchable: `${o.name} ${o.latinName} ${o.system} ${o.dysfunctionSigns.join(' ')}`,
        }),
        (o) => ({
          type: 'organ' as EntityType,
          id: o.id,
          title: o.name,
          subtitle: o.system,
        })
      );
    }

    if (sidebarCategory === 'diaphragm') {
      const zoneFiltered = DIAPHRAGMS.filter(
        (d) => zoneFilter === 'all' || d.zone === zoneFilter
      );
      return rankAndMap(
        zoneFiltered,
        (d) => ({
          title: d.name,
          searchable: `${d.name} ${d.latinName} ${d.level} ${d.dysfunctionImpact}`,
        }),
        (d) => ({
          type: 'diaphragm' as EntityType,
          id: d.id,
          title: d.name,
          subtitle: d.level,
        })
      );
    }

    if (sidebarCategory === 'neuro') {
      return rankAndMap(
        NEURO_PROFILES,
        (np) => ({
          title: np.name,
          searchable: `${np.name} ${np.latinOrSubtitle} ${np.category} ${np.physiologicalMechanism} ${np.muscleInteraction} ${np.postureInfluence} ${np.diagnosticAlgorithm.join(' ')}`,
        }),
        (np) => ({
          type: 'neuro' as EntityType,
          id: np.id,
          title: np.name,
          subtitle: `${np.category} · ${np.latinOrSubtitle}`,
        })
      );
    }

    if (
      sidebarCategory === 'fascia' ||
      sidebarCategory === 'tendon' ||
      sidebarCategory === 'joint' ||
      sidebarCategory === 'bone' ||
      sidebarCategory === 'vessel'
    ) {
      const sourceList =
        sidebarCategory === 'fascia'
          ? FASCIAS
          : sidebarCategory === 'tendon'
          ? TENDONS
          : sidebarCategory === 'joint'
          ? JOINTS
          : sidebarCategory === 'bone'
          ? BONES
          : VESSELS;

      const filtered = sourceList.filter((item) => {
        if (zoneFilter !== 'all' && item.zone !== zoneFilter) return false;
        if (sideFilter !== 'all' && item.side !== 'both' && item.side !== sideFilter) return false;
        if (sidebarCategory === 'fascia' && fasciaLayerFilter !== 'all') {
          if (
            fasciaLayerFilter === 'superficial' &&
            !item.categoryLabel.startsWith('Поверхностные')
          ) {
            return false;
          }
          if (fasciaLayerFilter === 'deep' && !item.categoryLabel.startsWith('Глубокие')) {
            return false;
          }
          if (fasciaLayerFilter === 'visceral' && !item.categoryLabel.startsWith('Висцеральные')) {
            return false;
          }
        }
        if (sidebarCategory === 'joint' && jointSizeFilter !== 'all') {
          if (
            jointSizeFilter === 'major' &&
            !item.categoryLabel.startsWith('Крупные и средние суставы')
          ) {
            return false;
          }
          if (
            jointSizeFilter === 'small' &&
            !item.categoryLabel.startsWith('Мелкие суставы')
          ) {
            return false;
          }
        }
        return true;
      });

      return rankAndMap(
        filtered,
        (el) => ({
          title: el.name,
          searchable: `${el.name} ${el.latinName} ${el.categoryLabel} ${el.anatomyAndLocation} ${el.palpationLandmark}`,
        }),
        (el) => ({
          type: el.kind as EntityType,
          id: el.id,
          title: el.name,
          subtitle: `${el.latinName.split('(')[0].trim()} · ${el.categoryLabel}`,
        })
      );
    }

    return rankAndMap(
      MERIDIANS,
      (mer) => ({
        title: `${mer.code} ${mer.name}`,
        searchable: `${mer.code} ${mer.name} ${mer.chineseName} ${mer.element} ${mer.activeHours}`,
      }),
      (mer) => ({
        type: 'meridian' as EntityType,
        id: mer.id,
        title: `${mer.code} ${mer.name}`,
        subtitle: `${mer.element} · ${mer.activeHours}`,
      })
    );
  }, [sidebarCategory, fasciaLayerFilter, jointSizeFilter, zoneFilter, sideFilter, sidebarSearch]);

  useEffect(() => {
    setVisibleSidebarLimit(80);
  }, [sidebarCategory, fasciaLayerFilter, jointSizeFilter, zoneFilter, sideFilter, sidebarSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <header className="print:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Zone 1: Brand mark from uploaded logo + wordmark */}
        <button
          type="button"
          onClick={() => selectTab('atlas')}
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer font-display"
        >
          <img
            src="./assets/aistudio/logo_f7cf1eaa.png"
            alt="Логотип КинезиоАтлас"
            className="w-8 h-8 object-contain shrink-0"
          />
          <span>КинезиоАтлас</span>
        </button>

        {/* Zone 2: 4 Top-Level Navigation Blocks (CRM · Обучение · Атлас · Справочник коррекции) */}
        <nav
          aria-label="Основные блоки"
          className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl"
        >
          {NAV_BLOCKS.map((block) => {
            const isBlockActive = activeBlock === block.id;
            const Icon =
              block.id === 'crm'
                ? Users
                : block.id === 'learning'
                ? GraduationCap
                : block.id === 'atlas_group'
                ? Layers
                : BookOpen;

            return (
              <button
                key={block.id}
                type="button"
                onClick={() => selectBlock(block.id)}
                className={`inline-flex items-center gap-1.5 px-3 xl:px-4 py-1.5 rounded-lg text-xs xl:text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isBlockActive
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{block.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Offline / Install / Search actions */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          <button
            type="button"
            onClick={() => {
              setHostingModalTab(swUpdateAvailable ? 'updates' : 'storage');
              setIsHostingModalOpen(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              swUpdateAvailable
                ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
            }`}
            title="Хранилище на диске, зеркальные копии, бэкапы, обмен через облако, обновления и сборка macOS .dmg"
          >
            <Laptop className={`w-3.5 h-3.5 ${swUpdateAvailable ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">
              {swUpdateAvailable ? 'Обновить' : 'База, ПК и .dmg'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Поиск</span>
          </button>
        </div>
      </header>

      {/* Mobile / Tablet Primary Block Switcher (below lg) */}
      <div className="print:hidden lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
        {NAV_BLOCKS.map((block) => {
          const isBlockActive = activeBlock === block.id;
          return (
            <button
              key={block.id}
              type="button"
              onClick={() => selectBlock(block.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                isBlockActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {block.label}
            </button>
          );
        })}
      </div>

      {/* Block Sub-Navigation Bar (Always visible for the active block) */}
      <div className="print:hidden bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {(NAV_BLOCKS.find((b) => b.id === activeBlock)?.items ?? []).map((navItem) => {
              const active = activeTab === navItem.id;
              return (
                <button
                  key={navItem.id}
                  type="button"
                  onClick={() => selectTab(navItem.id)}
                  className={`px-3 py-2.5 border-b-2 text-xs sm:text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-blue-700 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium'
                  }`}
                >
                  {navItem.label}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
            <span>Раздел:</span>
            <span className="font-semibold text-slate-600">
              {NAV_BLOCKS.find((b) => b.id === activeBlock)?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Intuitive Clinical Workflow & Active Patient Strip (CRM block only) */}
      {activeBlock === 'crm' && (
        <div className="print:hidden bg-slate-100/80 border-b border-slate-200 px-4 sm:px-6 py-2">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            {activePatient ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 font-semibold text-blue-800">
                  <UserCheck className="w-3.5 h-3.5" />
                  Активный пациент: {activePatient.fullName}
                </span>
                {activePatient.cardNumber && (
                  <span className="font-mono text-slate-500">({activePatient.cardNumber})</span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('patients')}
                  className="text-blue-700 hover:underline font-medium cursor-pointer"
                >
                  Открыть карту
                </button>
                <span className="text-slate-300" aria-hidden="true">
                  |
                </span>
                <button
                  type="button"
                  onClick={() => handleStartNewVisit(activePatient.id)}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-medium cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Начать новый приём</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePatientId(null)}
                  className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Сбросить выбор активного пациента"
                  aria-label="Сбросить выбор активного пациента"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span className="font-semibold text-slate-800">Маршрут приёма:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('patients')}
                  className="hover:text-blue-700 cursor-pointer"
                >
                  1. Пациенты ({patients.length})
                </button>
                <span className="text-slate-300">→</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('symptoms')}
                  className="hover:text-blue-700 cursor-pointer"
                >
                  2. Справочник клинических жалоб
                </button>
                <span className="text-slate-300">→</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className="hover:text-blue-700 cursor-pointer"
                >
                  3. Шкала процессов
                </button>
                <span className="text-slate-300">→</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('intake')}
                  className="hover:text-blue-700 cursor-pointer"
                >
                  4. Анамнез, фото-анализ и ММТ
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
              <span>Карт в базе: {patients.length}</span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span>Приёмов: {visits.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'patients' && (
          <PatientsView
            patients={patients}
            visits={visits}
            activePatientId={activePatientId}
            onSelectPatient={setActivePatientId}
            onSavePatient={handleSavePatient}
            onDeletePatient={handleDeletePatient}
            onDeleteVisit={handleDeleteVisit}
            onStartNewVisit={handleStartNewVisit}
            onOpenVisitInSession={handleOpenVisitInSession}
            onImportDatabaseJson={handleImportDatabaseJson}
          />
        )}

        {activeTab === 'atlas' && (
          <div className="space-y-4">
            {/* Compact Clinical Context Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight text-balance">
                  Атлас мануально-мышечного тестирования и перекрёстных связей
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Анатомические таблицы открытых атласов (Грей, OpenStax, Wikimedia Commons) с
                  выделением мышц, цепей, фасций, сухожилий, суставов, костей, сосудов, органов, диафрагм и точек.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 shrink-0 tabular-nums">
                <span>{MUSCLES.length} мышц</span>
                <span aria-hidden="true">·</span>
                <span>{FASCIAS.length} фасций</span>
                <span aria-hidden="true">·</span>
                <span>{TENDONS.length} сухожилий</span>
                <span aria-hidden="true">·</span>
                <span>{JOINTS.length} суставов</span>
                <span aria-hidden="true">·</span>
                <span>{BONES.length} костей</span>
                <span aria-hidden="true">·</span>
                <span>{VESSELS.length} сосудов</span>
                <span aria-hidden="true">·</span>
                <span>{ORGANS.length} органов</span>
                <span aria-hidden="true">·</span>
                <span>{ACUPOINTS.length} точек</span>
              </div>
            </div>

            {/* 3-Column Clinical Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Zone & Structure Explorer (3 cols) */}
              {!isStageExpanded && (
                <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden lg:h-[740px]">
                  {/* Zone & Surface Classifier Selector */}
                  <div className="p-3 border-b border-slate-200 space-y-2.5 bg-slate-50/70">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        Классификатор зон
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsClassifierOpen(true)}
                        className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Таблица TA →
                      </button>
                    </div>

                    {/* Anterior / Posterior Body Surface Switcher */}
                    <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/70 rounded-md text-[11px]">
                      {(
                        [
                          { id: 'all', label: 'Все' },
                          { id: 'anterior', label: 'Передние' },
                          { id: 'posterior', label: 'Задние' },
                        ] as const
                      ).map((sideOpt) => (
                        <button
                          key={sideOpt.id}
                          type="button"
                          onClick={() => setSideFilter(sideOpt.id)}
                          className={`py-1 px-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap truncate ${
                            sideFilter === sideOpt.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sideOpt.label}
                        </button>
                      ))}
                    </div>

                    {/* Classifier Divisions: Axial vs Appendicular */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setZoneFilter('all');
                          setZoomZone('all');
                        }}
                        className={`w-full px-2.5 py-1 text-xs font-medium rounded-md border text-left transition-colors cursor-pointer whitespace-nowrap truncate ${
                          zoneFilter === 'all'
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Все анатомические зоны
                      </button>

                      {ANATOMICAL_DIVISIONS.map((div) => {
                        const divZones = ANATOMICAL_ZONES.filter((z) => z.division === div.id);
                        return (
                          <div key={div.id} className="space-y-1">
                            <div className="text-[10px] font-semibold text-slate-500 px-0.5">
                              {div.code}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {divZones.map((z) => {
                                const sideCount = MUSCLES.filter(
                                  (m) =>
                                    m.zone === z.id &&
                                    (sideFilter === 'all' || getMuscleSide(m) === sideFilter)
                                ).length;
                                return (
                                  <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => {
                                      setZoneFilter(z.id);
                                      setZoomZone(z.id);
                                      if (
                                        (activePlate === 'head' || activePlate === 'neck') &&
                                        z.id !== 'head' &&
                                        z.id !== 'cervical'
                                      ) {
                                        setActivePlate('muscles');
                                      }
                                    }}
                                    className={`px-2 py-1 text-[11px] font-medium rounded-md border text-left transition-colors cursor-pointer flex items-center justify-between gap-1 ${
                                      zoneFilter === z.id
                                        ? 'bg-blue-700 text-white border-blue-700'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className="truncate">{z.shortName}</span>
                                    <span
                                      className={`text-[10px] font-mono tabular-nums shrink-0 ${
                                        zoneFilter === z.id ? 'text-blue-100' : 'text-slate-400'
                                      }`}
                                    >
                                      {sideCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Segmented Tabs */}
                  <div className="px-3 pt-2.5 pb-2 border-b border-slate-200 space-y-2">
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                      {(
                        [
                          { id: 'muscle', label: `Мышцы (${MUSCLES.length})` },
                          { id: 'fascia', label: `Фасции (${FASCIAS.length})` },
                          { id: 'tendon', label: `Сухож. (${TENDONS.length})` },
                          { id: 'joint', label: `Суставы (${JOINTS.length})` },
                          { id: 'bone', label: `Кости (${BONES.length})` },
                          { id: 'vessel', label: `Сосуды (${VESSELS.length})` },
                          { id: 'chain', label: `Цепи (${MYOFASCIAL_CHAINS.length})` },
                          { id: 'organ', label: `Органы (${ORGANS.length})` },
                          { id: 'diaphragm', label: `Диафр. (${DIAPHRAGMS.length})` },
                          { id: 'meridian', label: `Мерид. (${MERIDIANS.length})` },
                          { id: 'neuro', label: `НС (${NEURO_PROFILES.length})` },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSidebarCategory(cat.id);
                            if (cat.id === 'fascia') setVisibleLayers((p) => ({ ...p, fascias: true }));
                            if (cat.id === 'tendon') setVisibleLayers((p) => ({ ...p, tendons: true }));
                            if (cat.id === 'joint') setVisibleLayers((p) => ({ ...p, joints: true }));
                            if (cat.id === 'bone') setVisibleLayers((p) => ({ ...p, bones: true }));
                            if (cat.id === 'vessel') setVisibleLayers((p) => ({ ...p, vessels: true }));
                          }}
                          className={`px-1.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap truncate ${
                            sidebarCategory === cat.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {sidebarCategory === 'fascia' && (
                      <div
                        className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-md text-[10px]"
                        aria-label="Слой фасций"
                      >
                        {(
                          [
                            { id: 'all', label: 'Все' },
                            { id: 'superficial', label: 'Поверхн.' },
                            { id: 'deep', label: 'Глубокие' },
                            { id: 'visceral', label: 'Висцер.' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFasciaLayerFilter(opt.id)}
                            className={`py-1 px-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap truncate ${
                              fasciaLayerFilter === opt.id
                                ? 'bg-white text-teal-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {sidebarCategory === 'joint' && (
                      <div
                        className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-md text-[10px]"
                        aria-label="Группа суставов"
                      >
                        {(
                          [
                            { id: 'all', label: 'Все (360)' },
                            { id: 'major', label: 'Крупн./сред.' },
                            { id: 'small', label: 'Мелкие' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setJointSizeFilter(opt.id)}
                            className={`py-1 px-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap truncate ${
                              jointSizeFilter === opt.id
                                ? 'bg-white text-indigo-800 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        placeholder="Фильтр списка..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Scrollable Structure List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {sidebarItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        В выбранной зоне нет записей по фильтру.
                      </div>
                    ) : (
                      <>
                        {sidebarItems.slice(0, visibleSidebarLimit).map((item) => {
                          const isActive =
                            selectedEntity.type === item.type && selectedEntity.id === item.id;
                          return (
                            <button
                              key={`${item.type}-${item.id}`}
                              type="button"
                              onClick={() =>
                                handleSelectEntity({ type: item.type, id: item.id }, true)
                              }
                              className={`w-full px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                                isActive ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`text-xs font-semibold leading-snug ${
                                  isActive ? 'text-blue-900' : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {item.subtitle}
                              </div>
                            </button>
                          );
                        })}
                        {sidebarItems.length > visibleSidebarLimit && (
                          <div className="p-3 bg-slate-50/80 flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setVisibleSidebarLimit((v) => v + 100)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                            >
                              Показать ещё {Math.min(100, sidebarItems.length - visibleSidebarLimit)}
                            </button>
                            <button
                              type="button"
                              onClick={() => setVisibleSidebarLimit(sidebarItems.length)}
                              className="px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                            >
                              Все ({sidebarItems.length})
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </aside>
              )}

              {/* Center Column: Open-Source Interactive Anatomical Plate Viewer */}
              <section
                className={`${
                  isStageExpanded ? 'lg:col-span-8' : 'lg:col-span-5'
                } flex flex-col gap-2.5 lg:h-[740px]`}
              >
                <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    Анатомический атлас (открытые медицинские таблицы)
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStageExpanded((v) => !v)}
                    className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isStageExpanded ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        Показать список
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        Расширить атлас
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  <OpenSourceAtlasViewer
                    selectedEntity={selectedEntity}
                    onSelectEntity={(ent) => handleSelectEntity(ent, false)}
                    activePlate={activePlate}
                    onChangePlate={setActivePlate}
                    zoomZone={zoomZone}
                    onChangeZoomZone={setZoomZone}
                    sideFilter={sideFilter}
                    visibleLayers={visibleLayers}
                    onToggleLayer={handleToggleLayer}
                  />
                </div>
              </section>

              {/* Right Column: Cross-References & Correction Protocols (4 cols) */}
              <section className="lg:col-span-4 lg:h-[740px]">
                <EntityInspector
                  selectedEntity={selectedEntity}
                  history={history}
                  onSelectEntity={(ent) => handleSelectEntity(ent, true)}
                  onNavigateBack={handleNavigateBack}
                  onOpenTab={(tab) => selectTab(tab)}
                />
              </section>
            </div>
          </div>
        )}

        {activeTab === 'symptoms' && (
          <SymptomSearchView
            onOpenInAtlas={handleOpenInAtlas}
            onOpenTimeline={(symId, period) => {
              setTargetSymptomId(symId);
              setTargetCircadianPeriod(period ?? null);
              setActiveTab('timeline');
            }}
            initialSymptomId={targetSymptomId}
          />
        )}

        {activeTab === 'timeline' && (
          <ComplaintTimelineView
            onOpenInAtlas={handleOpenInAtlas}
            activePatient={activePatient}
            patientVisits={visits.filter((v) => v.patientId === activePatient?.id)}
            onSaveComplaintEvent={handleSaveComplaintEvent}
            onDeleteComplaintEvent={handleDeleteComplaintEvent}
            onOpenVisitInSession={handleOpenVisitInSession}
            onStartMmtWithSymptom={(symId) => {
              setTargetSymptomId(symId);
              setActiveTab('intake');
            }}
            onOpenSymptomSearch={(symId) => {
              setTargetSymptomId(symId);
              setActiveTab('symptoms');
            }}
            onOpenPatientsTab={() => setActiveTab('patients')}
            initialSymptomId={targetSymptomId}
            initialCircadianPeriod={targetCircadianPeriod}
          />
        )}

        {activeTab === 'intake' && (
          <IntakeSessionView
            onOpenInAtlas={handleOpenInAtlas}
            patients={patients}
            activePatientId={activePatientId}
            onSelectPatientId={setActivePatientId}
            loadedVisit={loadedVisit}
            sessionResetNonce={sessionResetNonce}
            patientVisits={visits}
            onSaveVisitToPatient={handleSaveVisitToPatient}
            onSaveComplaintEvent={handleSaveComplaintEvent}
            onDeleteComplaintEvent={handleDeleteComplaintEvent}
            onSavePatientPostureAssessments={handleSavePatientPostureAssessments}
            onOpenPatientsTab={() => setActiveTab('patients')}
            onOpenTimelineTab={() => selectTab('timeline')}
            onOpenDirectoryTab={handleOpenDirectoryTab}
            onOpenWorkspaceTab={(tab) => selectTab(tab)}
          />
        )}

        {activeTab === 'learning' && (
          <LearningSystemView
            key={`learning-${storageSyncNonce}`}
            onOpenInAtlas={handleOpenInAtlas}
            onOpenNotes={() => selectTab('notes')}
          />
        )}

        {activeTab === 'notes' && <StudyNotesView key={`notes-${storageSyncNonce}`} />}

        {activeTab === 'mmt' && (
          <MMTDirectoryView
            onOpenInAtlas={handleOpenInAtlas}
            onOpenDirectoryTab={handleOpenDirectoryTab}
          />
        )}

        {activeTab === 'chains' && <ChainsDirectoryView onOpenInAtlas={handleOpenInAtlas} />}

        {activeTab === 'meridians' && (
          <MeridiansDirectoryView onOpenInAtlas={handleOpenInAtlas} />
        )}

        {activeTab === 'protocols' && <ProtocolsView onOpenInAtlas={handleOpenInAtlas} />}

        {activeTab === 'mudras' && (
          <MudrasDirectoryView
            onOpenInAtlas={handleOpenInAtlas}
            initialMudraId={targetDirectoryItemId}
          />
        )}

        {activeTab === 'nosodes' && (
          <NosodesDirectoryView
            onOpenInAtlas={handleOpenInAtlas}
            onOpenMudras={() => selectTab('mudras')}
            initialNosodeId={targetDirectoryItemId}
          />
        )}

        {activeTab === 'taping' && (
          <TapingDirectoryView
            onOpenInAtlas={handleOpenInAtlas}
            initialTapeId={targetDirectoryItemId}
          />
        )}

        {activeTab === 'trusts' && (
          <TrustManipulationsView
            onOpenInAtlas={handleOpenInAtlas}
            initialTrustId={targetDirectoryItemId}
          />
        )}

        {activeTab === 'craniosacral' && (
          <CraniosacralDirectoryView
            onOpenInAtlas={handleOpenInAtlas}
            onOpenTestsTab={(testId?: string) => handleOpenDirectoryTab('tests', testId)}
            initialProfileId={targetDirectoryItemId}
          />
        )}

        {activeTab === 'tests' && (
          <DiagnosticTestsView
            onOpenInAtlas={handleOpenInAtlas}
            initialTestId={targetDirectoryItemId}
          />
        )}

        {activeTab === 'patterns' && (
          <MovementPatternsView
            onOpenInAtlas={handleOpenInAtlas}
            initialPatternId={targetDirectoryItemId}
          />
        )}
      </main>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEntity={handleOpenInAtlas}
        onSelectSymptom={(symId) => {
          setTargetSymptomId(symId);
          selectTab('symptoms');
        }}
        onSelectDirectoryTab={handleOpenDirectoryTab}
      />

      <LocalHostingModal
        isOpen={isHostingModalOpen}
        onClose={() => setIsHostingModalOpen(false)}
        initialTab={hostingModalTab}
        onDataImported={refreshDatabaseFromStorage}
        onOpenPatientsBackup={() => {
          setIsHostingModalOpen(false);
          setActiveTab('patients');
        }}
      />

      {isClassifierOpen && (
        <AnatomicalZoneClassifierPanel
          isModal
          activeZoneId={zoneFilter}
          activeSide={sideFilter}
          onSelectFilter={(zId, side) => {
            setZoneFilter(zId);
            setZoomZone(zId);
            if (side) setSideFilter(side);
            setActivePlate('muscles');
            setIsClassifierOpen(false);
          }}
          onSelectEntity={(ent) => {
            handleSelectEntity(ent, true);
            setActiveTab('atlas');
            setIsClassifierOpen(false);
          }}
          onClose={() => setIsClassifierOpen(false)}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
