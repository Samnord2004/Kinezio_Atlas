import { StructuralElementKind, StructuralElementProfile } from '../types/atlas';

export interface StructuralAnatomyImageMeta {
  src: string;
  caption: string;
  attribution: string;
}

const SPECIFIC_STRUCTURAL_IMAGES: Record<string, StructuralAnatomyImageMeta> = {
  // Fasciae
  'fascia-cervicalis': {
    src: './anatomy/structural/fascia_cervical.png',
    caption: 'Шейная фасция: поверхностная, предтрахеальная и предпозвоночная пластинки',
    attribution: 'Wikimedia Commons · Henry Gray / Cervical fascia (Public Domain)',
  },
  'fascia-clavipectoralis': {
    src: './anatomy/mmt/openstax_thorax.png',
    caption: 'Ключично-грудная фасция и передняя стенка грудной клетки',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'fascia-thoracolumbalis': {
    src: './anatomy/structural/fascia_thoracolumbar.png',
    caption: 'Грудопоясничная фасция и поверхностный/глубокий апоневроз спины',
    attribution: 'Wikimedia Commons · Thoracolumbar fascia (CC BY-SA)',
  },
  'fascia-endothoracica': {
    src: './anatomy/mmt/openstax_thorax.png',
    caption: 'Внутригрудная фасция и фасциальный каркас средостения',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'fascia-iliopsoas': {
    src: './anatomy/muscles/psoas.png',
    caption: 'Подвздошная фасция, подвздошно-поясничная мышца и ретроперитонеальный футляр',
    attribution: 'Wikimedia Commons · Gray Plate 430 (Public Domain)',
  },
  'fascia-lata-itb': {
    src: './anatomy/chains/commons_lateral_tfl_itb.png',
    caption: 'Широкая фасция бедра и подвздошно-большеберцовый тракт (ITB)',
    attribution: 'Wikimedia Commons · Henry Gray Plate 431 (Public Domain)',
  },
  'fascia-cruris': {
    src: './anatomy/mmt/openstax_lower_leg.png',
    caption: 'Глубокая фасция голени, футляры и межкостная перепонка',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'aponeurosis-plantaris': {
    src: './anatomy/structural/fascia_plantar.png',
    caption: 'Подошвенный апоневроз (Aponeurosis plantaris) и свод стопы',
    attribution: 'Wikimedia Commons · Plantar fascia / Gray (Public Domain)',
  },

  // Tendons
  'tendon-biceps-long-head': {
    src: './anatomy/mmt/openstax_upper_limb.png',
    caption: 'Сухожилие длинной головки бицепса в межбугорковой борозде плеча',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'tendon-rotator-cuff': {
    src: './anatomy/structural/tendon_rotator_cuff.png',
    caption: 'Сухожилия вращательной манжеты плечевого сустава',
    attribution: 'Wikimedia Commons · Rotator cuff anatomy (CC BY-SA)',
  },
  'tendon-common-extensor': {
    src: './anatomy/mmt/openstax_forearm.png',
    caption: 'Общее сухожилие разгибателей и супинаторов у латерального надмыщелка',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'tendon-diaphragm-crura': {
    src: './anatomy/diaphragm.png',
    caption: 'Центральное сухожилие и ножки грудобрюшной диафрагмы',
    attribution: 'Wikimedia Commons · Human diaphragm (CC BY-SA)',
  },
  'tendon-rectus-femoral': {
    src: './anatomy/muscles/quadriceps.png',
    caption: 'Сухожилие четырёхглавой мышцы бедра и собственная связка надколенника',
    attribution: 'Wikimedia Commons · Gray Plate 430 (Public Domain)',
  },
  'tendon-pes-anserinus': {
    src: './anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Поверхностная «гусиная лапка» на медиальном мыщелке большеберцовой кости',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'tendon-achilles': {
    src: './anatomy/structural/tendon_achilles.png',
    caption: 'Ахиллово (пяточное) сухожилие и трёхглавая мышца голени',
    attribution: 'Wikimedia Commons · Calcaneal (Achilles) tendon anatomy',
  },
  'tendon-tibialis-posterior': {
    src: './anatomy/mmt/openstax_foot.png',
    caption: 'Сухожилие задней большеберцовой мышцы и удерживатели голеностопа',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },

  // Joints
  'joint-tmj': {
    src: './anatomy/structural/joint_tmj.png',
    caption: 'Височно-нижнечелюстной сустав (ВНЧС), суставной диск и капсула',
    attribution: 'Wikimedia Commons · Henry Gray Plate 311 (Public Domain)',
  },
  'joint-ao-c0c1': {
    src: './anatomy/structural/joint_spine.png',
    caption: 'Межпозвоночные и атланто-затылочные сочленения позвоночника',
    attribution: 'Wikimedia Commons · Vertebral joints / Gray (Public Domain)',
  },
  'joint-scj-acj': {
    src: './anatomy/structural/joint_sternoclavicular.png',
    caption: 'Грудино-ключичный и акромиально-ключичный суставы плечевого пояса',
    attribution: 'Henry Gray · Plate 325, Wikimedia Commons (Public Domain)',
  },
  'joint-ghj': {
    src: './anatomy/structural/joint_shoulder.png',
    caption: 'Плечевой сустав (Articulatio humeri) — капсула и связочный аппарат',
    attribution: 'Wikimedia Commons · Shoulder joint diagram (CC BY-SA)',
  },
  'joint-elbow-radioulnar': {
    src: './anatomy/structural/joint_elbow.png',
    caption: 'Локтевой и проксимальный лучелоктевой суставы',
    attribution: 'Wikimedia Commons · Elbow joint diagram (CC BY-SA)',
  },
  'joint-costovertebral': {
    src: './anatomy/structural/joint_costovertebral.png',
    caption: 'Рёберно-позвоночные и грудино-рёберные сочленения грудной клетки',
    attribution: 'Henry Gray · Plate 314, Wikimedia Commons (Public Domain)',
  },
  'joint-sij': {
    src: './anatomy/structural/joint_sacroiliac.png',
    caption: 'Крестцово-подвздошное сочленение (КПС) и связки тазового кольца',
    attribution: 'Wikimedia Commons · Sacroiliac joint / Pelvis ligaments',
  },
  'joint-hip': {
    src: './anatomy/structural/joint_hip.png',
    caption: 'Тазобедренный сустав (Articulatio coxae) и подвздошно-бедренная связка',
    attribution: 'Wikimedia Commons · Henry Gray Plate 339 (Public Domain)',
  },
  'joint-knee': {
    src: './anatomy/structural/joint_knee.png',
    caption: 'Коленный сустав (Articulatio genus) — мениски, крестообразные и коллатеральные связки',
    attribution: 'Wikimedia Commons · Knee joint diagram (CC BY-SA)',
  },
  'joint-ankle-subtalar': {
    src: './anatomy/structural/joint_ankle.png',
    caption: 'Голеностопный (надтаранный) и подтаранный суставы стопы',
    attribution: 'Wikimedia Commons · Ankle joint anatomy',
  },

  // Vessels & Lymphatics
  'vessel-carotid-jugular': {
    src: './anatomy/structural/vessel_neck_carotid.png',
    caption: 'Сонные артерии и яремные вены области головы и шеи',
    attribution: 'Wikimedia Commons · Carotid & jugular anatomy (Public Domain)',
  },
  'vessel-subclavian-tos': {
    src: './anatomy/structural/vessel_arteries.png',
    caption: 'Подключичные и подмышечные магистральные сосуды верхней апертуры',
    attribution: 'Wikimedia Commons · Human Arterial System (CC BY-SA)',
  },
  'vessel-thoracic-duct': {
    src: './anatomy/structural/vessel_lymphatic.png',
    caption: 'Грудной лимфатический проток, цистерна хили и регионарные коллекторы',
    attribution: 'Wikimedia Commons · Human Lymphatic System',
  },
  'vessel-aorta-celiac': {
    src: './anatomy/structural/vessel_arteries.png',
    caption: 'Брюшная аорта, чревный ствол и брыжеечные артерии',
    attribution: 'Wikimedia Commons · Human Arterial System (CC BY-SA)',
  },
  'vessel-portal-hepatic': {
    src: './anatomy/structural/vessel_portal.png',
    caption: 'Система воротной вены печени и порто-кавальные анастомозы',
    attribution: 'Wikimedia Commons · Hepatic portal vein diagram',
  },
  'vessel-iliac-pelvic': {
    src: './anatomy/structural/vessel_veins.png',
    caption: 'Подвздошные сосуды и венозный отток малого таза',
    attribution: 'Wikimedia Commons · Human Venous System (CC BY-SA)',
  },
  'vessel-femoral-popliteal': {
    src: './anatomy/structural/vessel_arteries.png',
    caption: 'Бедренная, глубокая бедренная и подколенная сосудистые магистрали',
    attribution: 'Wikimedia Commons · Human Arterial System (CC BY-SA)',
  },
  'vessel-saphenous-pedal': {
    src: './anatomy/structural/vessel_veins.png',
    caption: 'Большая подкожная вена, тарзальный канал и сосуды стопы',
    attribution: 'Wikimedia Commons · Human Venous System (CC BY-SA)',
  },
  'fascia-superficialis-head-smas': {
    src: './anatomy/head_neck_gray378.png',
    caption: 'Поверхностная фасция лица, SMAS и сухожильный шлем (Galea aponeurotica)',
    attribution: 'Wikimedia Commons · Henry Gray Plate 378 (Public Domain)',
  },
  'fascia-superficialis-colli-platysma': {
    src: './anatomy/neck_gray385.png',
    caption: 'Поверхностная подкожная фасция шеи и футляр платизмы',
    attribution: 'Henry Gray · Plate 385, Wikimedia Commons (Public Domain)',
  },
  'fascia-superficialis-abdominis-camper-scarpa': {
    src: './anatomy/mmt/openstax_abdomen.png',
    caption: 'Поверхностная подкожная фасция живота (пластинки Кампера и Скарпы)',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'fascia-superficialis-dorsi-glutea': {
    src: './anatomy/structural/fascia_lumbar_section.png',
    caption: 'Поверхностная подкожная фасция спины, поясничные слои и ягодичная область',
    attribution: 'Henry Gray · Plate 388, Wikimedia Commons (Public Domain)',
  },
  'fascia-superficialis-brachii-antebrachii': {
    src: './anatomy/mmt/openstax_upper_limb.png',
    caption: 'Поверхностная подкожная фасция верхней конечности',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'fascia-superficialis-femoris-cruris': {
    src: './anatomy/mmt/openstax_pelvis_thigh.png',
    caption: 'Поверхностная подкожная фасция бедра и голени',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'fascia-vagina-carotica': {
    src: './anatomy/structural/fascia_neck_sheath.png',
    caption: 'Сонное фасциальное влагалище и компартменты глубокой фасции шеи',
    attribution: 'Henry Gray · Plate 384, Wikimedia Commons (Public Domain)',
  },
  'fascia-axillaris-brachii': {
    src: './anatomy/mmt/openstax_upper_limb.png',
    caption: 'Подмышечная фасция и глубокая фасция плеча',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'fascia-antebrachii-interossea': {
    src: './anatomy/mmt/openstax_forearm.png',
    caption: 'Глубокая фасция предплечья и межкостная перепонка',
    attribution: 'OpenStax Anatomy & Physiology 2e · CC BY 4.0',
  },
  'aponeurosis-palmaris': {
    src: './anatomy/structural/fascia_palmar.png',
    caption: 'Ладонный апоневроз и удерживатель сгибателей кисти (карпальный канал)',
    attribution: 'Henry Gray · Plate 423, Wikimedia Commons (Public Domain)',
  },
  'fascia-canalis-adductorius': {
    src: './anatomy/structural/fascia_femoral_canal.png',
    caption: 'Бедренное влагалище, треугольник и фасция приводящего (Гунтерова) канала',
    attribution: 'Henry Gray · Plate 549, Wikimedia Commons (Public Domain)',
  },
  'fascia-visceralis-dura-tmo': {
    src: './anatomy/structural/fascia_dura_mater.png',
    caption: 'Твёрдая мозговая оболочка черепа, серп мозга и венозные синусы (ТМО)',
    attribution: 'Henry Gray · Plate 769, Wikimedia Commons (Public Domain)',
  },
  'fascia-visceralis-suprapleuralis': {
    src: './anatomy/structural/fascia_neck_sheath.png',
    caption: 'Надплевральная фасция Сибсона и глубокие висцеральные листки шеи',
    attribution: 'Henry Gray · Plate 384, Wikimedia Commons (Public Domain)',
  },
  'fascia-visceralis-transversalis-peritoneum': {
    src: './anatomy/structural/fascia_peritoneum.png',
    caption: 'Поперечная фасция, париетальная брюшина и висцеральные связки брюшной полости',
    attribution: 'Henry Gray · Plate 1039, Wikimedia Commons (Public Domain)',
  },
  'fascia-visceralis-renalis-gerota': {
    src: './anatomy/structural/fascia_renal_gerota.png',
    caption: 'Почечная фасция Герота и околопочечный забрюшинный футляр',
    attribution: 'Henry Gray · Plate 1120, Wikimedia Commons (Public Domain)',
  },
  'fascia-visceralis-endopelvina': {
    src: './anatomy/structural/diaphragm_pelvic.png',
    caption: 'Висцеральная тазовая (эндопельвическая) фасция и мышцы тазового дна',
    attribution: 'Henry Gray · Plate 404, Wikimedia Commons (Public Domain)',
  },
};

export function resolveJointAnatomyImage(
  id: string,
  name: string,
  categoryLabel: string
): StructuralAnatomyImageMeta {
  const hay = `${id} ${name} ${categoryLabel}`.toLowerCase();
  if (hay.includes('наковальн') || hay.includes('молоточ') || hay.includes('стремен') || hay.includes('ossicle') || hay.includes('incud')) {
    return {
      src: './anatomy/structural/bone_ossicles.png',
      caption: `${name} — суставы слуховых косточек среднего уха`,
      attribution: 'Henry Gray · Plate 917, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('зубоальвеоляр') || hay.includes('гомфоз') || hay.includes('dentoalveolar')) {
    return {
      src: './anatomy/structural/joint_dentoalveolar.png',
      caption: `${name} — зубоальвеолярное соединение (периодонтальная связка)`,
      attribution: 'Henry Gray · Plate 1003, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('внчс') || hay.includes('височно-нижнечелюст') || hay.includes('tmj')) {
    return {
      src: './anatomy/structural/joint_tmj.png',
      caption: `${name} — височно-нижнечелюстной сустав и суставной диск`,
      attribution: 'Henry Gray · Plate 311, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('гортан') || hay.includes('перстне') || hay.includes('щитоподъяз') || hay.includes('черпаловид')) {
    return {
      src: './anatomy/structural/joint_larynx.png',
      caption: `${name} — хрящевые сочленения и связки гортани`,
      attribution: 'Henry Gray · Plate 953, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('шов') || hay.includes('синхондроз') || hay.includes('череп') || hay.includes('sbs')) {
    return {
      src: './anatomy/structural/bone_skull.png',
      caption: `${name} — швы черепа и сфенобазилярный синхондроз`,
      attribution: 'Henry Gray · Plate 188, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('межпозвоночн') ||
    hay.includes('унковертебр') ||
    (hay.includes('симфиз') && !hay.includes('лобков'))
  ) {
    return {
      src: './anatomy/structural/joint_iv_disc.png',
      caption: `${name} — межпозвоночный диск, фиброзное кольцо и связки`,
      attribution: 'Henry Gray · Plate 301, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('позвон') ||
    hay.includes('дугоотрост') ||
    hay.includes('фасеточ') ||
    hay.includes('атлант') ||
    hay.includes('пояснич') ||
    hay.includes('крестцово-копчик')
  ) {
    return {
      src: './anatomy/structural/joint_spine.png',
      caption: `${name} — фасеточные и краниовертебральные суставы позвоночника`,
      attribution: 'Wikimedia Commons · Vertebral joints / Gray (Public Domain)',
    };
  }
  if (hay.includes('рёберно-позвоноч') || hay.includes('рёберно-попереч') || hay.includes('головки ребра') || hay.includes('costovert') || hay.includes('costotrans')) {
    return {
      src: './anatomy/structural/joint_costovertebral.png',
      caption: `${name} — рёберно-позвоночные и рёберно-поперечные сочленения`,
      attribution: 'Henry Gray · Plate 314, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('рёбер') || hay.includes('ребер') || hay.includes('грудино-рёбер') || hay.includes('межхрящ') || hay.includes('рукоятко-грудин') || hay.includes('грудино-мечевид') || hay.includes('cost')) {
    return {
      src: './anatomy/structural/bone_thorax.png',
      caption: `${name} — грудино-рёберные и межхрящевые соединения грудной клетки`,
      attribution: 'Henry Gray · Plate 112, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('грудино-ключич') || hay.includes('sternoclav')) {
    return {
      src: './anatomy/structural/joint_sternoclavicular.png',
      caption: `${name} — грудино-ключичный сустав и суставной диск`,
      attribution: 'Henry Gray · Plate 325, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('ключич') || hay.includes('clavic')) {
    return {
      src: './anatomy/structural/bone_pectoral_girdle.png',
      caption: `${name} — суставы пояса верхней конечности`,
      attribution: 'Henry Gray · Plate 200, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('плечев') && !hay.includes('плечелоктев') && !hay.includes('плечелучев')) {
    return {
      src: './anatomy/structural/joint_shoulder.png',
      caption: `${name} — плечевой сустав`,
      attribution: 'Wikimedia Commons · Shoulder joint diagram (CC BY-SA)',
    };
  }
  if (hay.includes('локтев') || hay.includes('лучелоктев') || hay.includes('предплеч')) {
    return {
      src: './anatomy/structural/joint_elbow.png',
      caption: `${name} — локтевой комплекс и лучелоктевые суставы`,
      attribution: 'Wikimedia Commons · Elbow joint diagram (CC BY-SA)',
    };
  }
  if (hay.includes('стопы') || hay.includes('плюсн') || hay.includes('предплюсн') || hay.includes('клино') || hay.includes('шопар') || hay.includes('лисфранк') || hay.includes('педис') || hay.includes('pedis') || hay.includes('пяточно') || hay.includes('таранно')) {
    return {
      src: './anatomy/structural/joint_foot_ligaments.png',
      caption: `${name} — суставы предплюсны, плюсны и связки стопы`,
      attribution: 'Henry Gray · Plate 355, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('лучезапяст') ||
    hay.includes('запяст') ||
    hay.includes('пяст') ||
    hay.includes('кисти') ||
    hay.includes('гороховид') ||
    hay.includes('фалан') ||
    hay.includes('carpal') ||
    hay.includes('manus')
  ) {
    return {
      src: './anatomy/structural/joint_wrist_hand.png',
      caption: `${name} — суставы запястья, пястья и пальцев кисти`,
      attribution: 'Henry Gray · Plate 334, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('крестцово-подвздош') || hay.includes('лобков') || hay.includes('кпс') || hay.includes('sacroiliac') || hay.includes('pubic')) {
    return {
      src: './anatomy/structural/joint_sacroiliac.png',
      caption: `${name} — сочленения тазового кольца`,
      attribution: 'Wikimedia Commons · Sacroiliac joint / Pelvis ligaments',
    };
  }
  if (hay.includes('тазобедрен') || hay.includes('coxae')) {
    return {
      src: './anatomy/structural/joint_hip.png',
      caption: `${name} — тазобедренный сустав`,
      attribution: 'Wikimedia Commons · Henry Gray Plate 339 (Public Domain)',
    };
  }
  if (hay.includes('колен') || hay.includes('надколен') || hay.includes('межберц') || hay.includes('голен')) {
    return {
      src: './anatomy/structural/joint_knee.png',
      caption: `${name} — коленный комплекс и межберцовые соединения`,
      attribution: 'Wikimedia Commons · Knee joint diagram (CC BY-SA)',
    };
  }
  if (hay.includes('голеностоп') || hay.includes('подтаран') || hay.includes('talocrural') || hay.includes('subtalar')) {
    return {
      src: './anatomy/structural/joint_ankle.png',
      caption: `${name} — голеностопный и подтаранный суставы`,
      attribution: 'Wikimedia Commons · Ankle joint anatomy',
    };
  }
  return {
    src: './anatomy/structural/joint_spine.png',
    caption: name,
    attribution: 'Wikimedia Commons · Open Anatomical Atlas',
  };
}

export function resolveBoneAnatomyImage(
  id: string,
  name: string,
  categoryLabel: string
): StructuralAnatomyImageMeta {
  const hay = `${id} ${name} ${categoryLabel}`.toLowerCase();
  if (hay.includes('молоточек') || hay.includes('наковальн') || hay.includes('стремя') || hay.includes('ossicle')) {
    return {
      src: './anatomy/structural/bone_ossicles.png',
      caption: `${name} — слуховые косточки среднего уха`,
      attribution: 'Henry Gray · Plate 917, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('подъязыч')) {
    return {
      src: './anatomy/structural/diaphragm_oral.png',
      caption: `${name} — подъязычная кость и мышцы дна полости рта`,
      attribution: 'Henry Gray · Plate 386, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('череп') ||
    hay.includes('лобн') ||
    hay.includes('темен') ||
    hay.includes('височ') ||
    hay.includes('затылоч') ||
    hay.includes('клиновид') ||
    hay.includes('решётч') ||
    hay.includes('челюст') ||
    hay.includes('скулов') ||
    hay.includes('носов') ||
    hay.includes('слёзн') ||
    hay.includes('нёбн') ||
    hay.includes('сошник')
  ) {
    return {
      src: './anatomy/structural/bone_skull.png',
      caption: `${name} — кости мозгового и лицевого черепа`,
      attribution: 'Henry Gray · Plate 188, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('позвонок') ||
    hay.includes('атлант') ||
    hay.includes('аксис') ||
    hay.includes('позвоночник') ||
    hay.includes('крестец') ||
    hay.includes('копчик')
  ) {
    return {
      src: './anatomy/neuro/vertebral_column.png',
      caption: `${name} — позвоночный столб и осевые сегменты`,
      attribution: 'Wikimedia Commons · Vertebral Column (CC BY-SA)',
    };
  }
  if (hay.includes('грудин') || hay.includes('ребро') || hay.includes('рёбр')) {
    return {
      src: './anatomy/structural/bone_thorax.png',
      caption: `${name} — грудная клетка, грудина и рёбра`,
      attribution: 'Henry Gray · Plate 112, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('ключиц') || hay.includes('лопатк')) {
    return {
      src: './anatomy/structural/bone_pectoral_girdle.png',
      caption: `${name} — кости пояса верхней конечности`,
      attribution: 'Henry Gray · Plate 200, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('предплюсн') ||
    hay.includes('таранн') ||
    hay.includes('пяточн') ||
    hay.includes('ладьевидная кость стопы') ||
    hay.includes('клиновидная кость стопы') ||
    hay.includes('кубовидн') ||
    hay.includes('плюснев') ||
    hay.includes('стопы')
  ) {
    return {
      src: './anatomy/structural/bone_foot.png',
      caption: `${name} — кости предплюсны, плюсны и пальцев стопы`,
      attribution: 'Wikimedia Commons · Bones of the Foot (CC BY-SA)',
    };
  }
  if (
    hay.includes('запяст') ||
    hay.includes('ладьевидная кость кисти') ||
    hay.includes('полулун') ||
    hay.includes('трёхгран') ||
    hay.includes('гороховид') ||
    hay.includes('трапеци') ||
    hay.includes('головчат') ||
    hay.includes('крючковид') ||
    hay.includes('пястн') ||
    hay.includes('кисти')
  ) {
    return {
      src: './anatomy/structural/bone_hand.png',
      caption: `${name} — кости запястья, пястья и фаланги кисти`,
      attribution: 'Henry Gray · Plate 219, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('плечев') || hay.includes('лучев') || hay.includes('локтев')) {
    return {
      src: './anatomy/structural/bone_upper_limb.png',
      caption: `${name} — кости свободной верхней конечности`,
      attribution: 'Henry Gray · Plate 207, Wikimedia Commons (Public Domain)',
    };
  }
  if (hay.includes('тазовая кость')) {
    return {
      src: './anatomy/structural/bone_pelvis.png',
      caption: `${name} — кости тазового кольца`,
      attribution: 'Henry Gray · Plate 241, Wikimedia Commons (Public Domain)',
    };
  }
  if (
    hay.includes('бедрен') ||
    hay.includes('надколен') ||
    hay.includes('большеберц') ||
    hay.includes('малоберц')
  ) {
    return {
      src: './anatomy/structural/bone_lower_limb.png',
      caption: `${name} — кости свободной нижней конечности`,
      attribution: 'Wikimedia Commons · Lower limb skeleton / Gray (Public Domain)',
    };
  }
  return {
    src: './anatomy/neuro/vertebral_column.png',
    caption: `${name} — скелет человека`,
    attribution: 'Wikimedia Commons · Vertebral Column & Skeleton (CC BY-SA)',
  };
}

export function getStructuralAnatomyImage(
  item: Pick<StructuralElementProfile, 'id' | 'kind' | 'name' | 'categoryLabel' | 'imageSrc' | 'imageCaption' | 'imageAttribution'>
): StructuralAnatomyImageMeta {
  if (item.imageSrc) {
    return {
      src: item.imageSrc,
      caption: item.imageCaption ?? item.name,
      attribution: item.imageAttribution ?? 'Открытый анатомический атлас',
    };
  }
  if (SPECIFIC_STRUCTURAL_IMAGES[item.id]) {
    return SPECIFIC_STRUCTURAL_IMAGES[item.id];
  }
  if (item.kind === 'bone') {
    return resolveBoneAnatomyImage(item.id, item.name, item.categoryLabel);
  }
  if (item.kind === 'joint') {
    return resolveJointAnatomyImage(item.id, item.name, item.categoryLabel);
  }
  const FALLBACK_BY_KIND: Record<StructuralElementKind, StructuralAnatomyImageMeta> = {
    fascia: {
      src: './anatomy/structural/fascia_thoracolumbar.png',
      caption: item.name,
      attribution: 'Wikimedia Commons · Open Anatomical Atlas',
    },
    tendon: {
      src: './anatomy/structural/tendon_achilles.png',
      caption: item.name,
      attribution: 'Wikimedia Commons · Open Anatomical Atlas',
    },
    joint: {
      src: './anatomy/structural/joint_knee.png',
      caption: item.name,
      attribution: 'Wikimedia Commons · Open Anatomical Atlas',
    },
    bone: {
      src: './anatomy/neuro/vertebral_column.png',
      caption: item.name,
      attribution: 'Wikimedia Commons · Vertebral Column & Skeleton (CC BY-SA)',
    },
    vessel: {
      src: './anatomy/structural/vessel_arteries.png',
      caption: item.name,
      attribution: 'Wikimedia Commons · Human Vascular System (CC BY-SA)',
    },
  };
  return FALLBACK_BY_KIND[item.kind];
}
