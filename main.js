
const BENCH_DRAWER_POS_ORDER = {
  'CF': 1, 'ST': 1, 'LW': 2, 'RW': 2,
  'AM': 3, 'LM': 4, 'RM': 4, 'CM': 5, 'DM': 6,
  'LB': 7, 'RB': 7, 'CB': 8,
  'GK': 9
};


const TACTIC_JP_NAMES = {
  possession: 'ポゼッション',
  gegenpress: 'ゲーゲンプレス',
  counter: 'カウンター',
  wingplay: 'サイド攻撃',
  parkthebus: 'ウルトラディフェンス'
};

function getManagerTacticLabel(key) {
  const norm = normalizeTacticKey(key);
  return TACTIC_JP_NAMES[norm] || (TACTICS_DEFINITIONS[norm] && TACTICS_DEFINITIONS[norm].name) || key;
}


// ==========================================================================
// 監督（ヘッドコーチ）哲学＆人事システム
// ==========================================================================

const MANAGERS_DATABASE = [
  { nationality: 'Spain', age: 53, preferredFormation: '4-1-2-3', preferredTactic: 'possession', weeklyWage: 110, bio: '精密なポジショナルプレーと圧倒的ポゼッションを信奉する名将。' },
  { nationality: 'Germany', age: 57, preferredFormation: '4-3-3', preferredTactic: 'gegenpress', weeklyWage: 105, bio: '電光石火のハイプレスと情熱的なメンタリティで圧倒する闘将。' },
  { nationality: 'Spain', age: 42, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 90, bio: '緻密なビルドアップと可変戦術で若手を統率する若き理論派。' },
  { nationality: 'Portugal', age: 39, preferredFormation: '3-4-3', preferredTactic: 'counter', weeklyWage: 85, bio: '3バックからのダイナミックな攻守転換で旋風を巻き起こす気鋭。' },
  { nationality: 'Italy', age: 65, preferredFormation: '4-3-1-2', preferredTactic: 'possession', weeklyWage: 115, bio: '選手の個性を引き出す柔軟性と数々の栄冠を誇る歴戦の長老。' },
  { nationality: 'Argentina', age: 54, preferredFormation: '4-4-2', preferredTactic: 'parkthebus', weeklyWage: 100, bio: '堅固な4-4ブロックと不屈の闘志で相手を封殺する守備の達人。' },
  { nationality: 'Italy', age: 55, preferredFormation: '3-5-2', preferredTactic: 'counter', weeklyWage: 95, bio: '徹底した戦術規律と強烈なインテンシティで勝点をもぎ取る仕事人。' },
  { nationality: 'Spain', age: 52, preferredFormation: '4-4-2', preferredTactic: 'counter', weeklyWage: 85, bio: '対戦相手の弱点を徹底分析し勝負所で強さを発揮するカップ戦マイスター。' },
  { nationality: 'England', age: 47, preferredFormation: '4-3-3', preferredTactic: 'gegenpress', weeklyWage: 75, bio: '運動量とアグレッシブなプレッシングでチームの一体感を高める。' },
  { nationality: 'England', age: 59, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 80, bio: '超ハイラインと超攻撃的スタイルを貫く攻撃サッカーの信念者。' },
  { nationality: 'Italy', age: 44, preferredFormation: '4-2-3-1', preferredTactic: 'possession', weeklyWage: 80, bio: '後方からのパス回しとサイドのアイソレーションを重んじる新世代。' },
  { nationality: 'Portugal', age: 47, preferredFormation: '4-2-3-1', preferredTactic: 'wingplay', weeklyWage: 65, bio: 'サイドアタックと中盤のバランスに優れた堅実な手腕。' },
  { nationality: 'Germany', age: 50, preferredFormation: '3-4-3', preferredTactic: 'gegenpress', weeklyWage: 70, bio: '統率された3バックと鋭利なショートカウンターを得意とする実力者。' },
  { nationality: 'Germany', age: 51, preferredFormation: '3-5-2', preferredTactic: 'possession', weeklyWage: 90, bio: '緻密な構造論と的確な戦術采配で勝利を導く理論派。' },
  { nationality: 'Portugal', age: 61, preferredFormation: '5-3-2', preferredTactic: 'parkthebus', weeklyWage: 95, bio: '冷徹な守備組織とリアリズムで数々のタイトルを獲得したカリスマ。' },
  { nationality: 'Italy', age: 45, preferredFormation: '4-2-3-1', preferredTactic: 'possession', weeklyWage: 75, bio: '自陣深くで誘い出し一気にスペースを攻略するパスサッカーの信奉者。' },
  { nationality: 'Italy', age: 66, preferredFormation: '3-4-3', preferredTactic: 'gegenpress', weeklyWage: 80, bio: 'ピッチ全域のマンツーマンと怒涛の波状攻撃を繰り出す超攻撃派。' },
  { nationality: 'England', age: 52, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 60, bio: 'ボール保持と洗練されたパスワークで主導権を握る正統派。' },
  { nationality: 'England', age: 53, preferredFormation: '4-4-2', preferredTactic: 'counter', weeklyWage: 55, bio: '肉弾戦と魂のディフェンス、直接的なロングボールで耐え抜く武闘派。' },
  { nationality: 'Portugal', age: 50, preferredFormation: '5-3-2', preferredTactic: 'counter', weeklyWage: 60, bio: '強固な守備ブロックと一撃必殺のカウンターに特化した守備の職人。' },
  // フリー監督プール用候補
  { nationality: 'Germany', age: 59, preferredFormation: '4-2-3-1', preferredTactic: 'gegenpress', weeklyWage: 95, bio: '縦への推進力と徹底したゲーゲンプレスを叩き込む強豪指揮官。' },
  { nationality: 'Spain', age: 54, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 100, bio: '妥協なきポゼッションと高強度トレーニングで支配を極める名将。' },
  { nationality: 'Italy', age: 57, preferredFormation: '5-3-2', preferredTactic: 'counter', weeklyWage: 85, bio: '勝負どころを見極める「鼻差の勝利」の哲学を持つ勝負師。' },
  { nationality: 'France', age: 52, preferredFormation: '4-3-3', preferredTactic: 'wingplay', weeklyWage: 120, bio: '王者の風格と卓越した人心掌握術でビッグマッチを制する歴戦の勝者。' }
];

/**
 * 監督オブジェクトの生成（完全架空名ジェネレーターによる動的命名）
 */
function createManager(def, clubId = null, usedNames = null) {
  const age = def.age || randInt(44, 62);
  const nat = def.nationality || 'England';
  const nameData = typeof generateRandomStaffName === 'function'
    ? generateRandomStaffName(nat, usedNames)
    : { displayName: `M. Staff`, fullName: `Manager Staff` };

  const genes = typeof generateAvatarData === 'function' ? generateAvatarData(nat, age) : null;
  if (genes) {
    if (Math.random() < 0.6) genes.facialHair = 'beard';
    if (Math.random() < 0.4) genes.accessories = 'glasses';
  }
  return {
    id: 'mgr_' + Math.random().toString(36).substr(2, 8),
    name: nameData.displayName,
    fullName: nameData.fullName,
    nationality: nat,
    age: age,
    preferredFormation: def.preferredFormation || '4-3-3',
    preferredTactic: def.preferredTactic || 'possession',
    trust: typeof def.trust === 'number' ? def.trust : 80,
    weeklyWage: def.weeklyWage || 80,
    contractYears: typeof def.contractYears === 'number' ? def.contractYears : 3,
    bio: def.bio || '現代的な戦術眼と指導力でチームを牽引する指揮官。',
    avatarData: genes
  };
}

/**
 * 監督の解任違約金を計算（契約残り年数 × 年俸の40%）
 */
function getManagerBuyoutFee(manager) {
  if (!manager) return 0;
  const annual = (manager.weeklyWage || 80) * 52;
  const years = Math.max(1, manager.contractYears || 1);
  return Math.max(1000, Math.round(annual * 0.40 * years));
}

/**
 * 指導陣（COACHING STAFF）データベース（全4専門カテゴリ / 全6枠体制・完全架空名ベース）
 */
const COACHES_DATABASE = {
  attacking: [
    { nationality: 'Netherlands', age: 54, rank: 'A', weeklyWage: 35, bio: 'ファーストタッチとフィニッシュの極意を叩き込むストライカー指導の専門家。' },
    { nationality: 'France', age: 48, rank: 'A', weeklyWage: 32, bio: 'ボックス内での駆け引きとゴール嗅覚を伝授する点取り屋コーチ。' },
    { nationality: 'Italy', age: 58, rank: 'B', weeklyWage: 24, bio: '狭いスペースでのテクニックとラストパスの精度を高める理論派。' },
    { nationality: 'England', age: 51, rank: 'B', weeklyWage: 22, bio: '冷静な決定力と勝負所での強さを教え込むシュートコーチ。' },
    { nationality: 'Germany', age: 51, rank: 'C', weeklyWage: 14, bio: '実戦的なポジショニングと献身的なプレスを指導する。' },
    { nationality: 'Belgium', age: 43, rank: 'C', weeklyWage: 12, bio: 'ドリブルでの局面打開と前線への展開を支援する若手育成型。' }
  ],
  defending: [
    { nationality: 'Netherlands', age: 52, rank: 'A', weeklyWage: 34, bio: '圧倒的な対人強度と威圧感で最終ラインに鉄壁の統率力を注入。' },
    { nationality: 'Italy', age: 51, rank: 'A', weeklyWage: 35, bio: '緻密なポジショニングとインターセプトの先読みを徹底指導。' },
    { nationality: 'England', age: 50, rank: 'B', weeklyWage: 23, bio: '屈強な空中戦とフィジカルコンタクトで相手FWを封殺する。' },
    { nationality: 'France', age: 56, rank: 'B', weeklyWage: 25, bio: 'CBとDMの両対応、強固なブロック構築のスペシャリスト。' },
    { nationality: 'Spain', age: 44, rank: 'B', weeklyWage: 22, bio: '粘り強いマンマークと狡猾なラインコントロールを叩き込む。' },
    { nationality: 'Portugal', age: 45, rank: 'C', weeklyWage: 13, bio: 'サイドバックのポジショニングとカバーリングを基本から指導。' }
  ],
  goalkeeping: [
    { nationality: 'Denmark', age: 58, rank: 'A', weeklyWage: 30, bio: '強烈なキャプテンシーと至近距離セーブでゴールマウスを死守。' },
    { nationality: 'Germany', age: 55, rank: 'B', weeklyWage: 20, bio: '広大な守備範囲と飛び出し、正確なフィードを磨き上げる。' },
    { nationality: 'Italy', age: 51, rank: 'C', weeklyWage: 12, bio: '確実なキャッチングと安定したセービング技術を実直に指導。' }
  ],
  fitness: [
    { nationality: 'Italy', age: 58, rank: 'A', weeklyWage: 28, bio: '欧州最先端の運動生理学に基づき、怪我予防と90分の運動量を実現。' },
    { nationality: 'France', age: 54, rank: 'B', weeklyWage: 18, bio: '強度の高い持久走と筋力アップで強靭な肉体を作り上げる。' },
    { nationality: 'England', age: 47, rank: 'C', weeklyWage: 11, bio: '試合後の迅速な疲労回復と柔軟性維持を専門とするフィジカル派。' }
  ]
};

function createCoach(def, category, usedNames = null) {
  const roleLabels = {
    attacking: 'オフェンス',
    defending: 'ディフェンス',
    goalkeeping: 'GK',
    fitness: 'フィジカル'
  };
  const roleLabel = roleLabels[category] || category;
  const nat = def.nationality || 'England';
  const age = def.age || randInt(40, 58);
  const nameData = typeof generateRandomStaffName === 'function'
    ? generateRandomStaffName(nat, usedNames)
    : { displayName: `C. Coach`, fullName: `Coach Staff` };

  return {
    id: `coach_${category}_${Math.random().toString(36).substr(2, 9)}`,
    name: nameData.displayName,
    fullName: nameData.fullName,
    category,
    roleLabel,
    rank: def.rank || 'B',
    tag: roleLabel,
    nationality: nat,
    age,
    weeklyWage: def.weeklyWage || 20,
    bio: def.bio || '熱心な指導で選手の能力を最大化する専門コーチ。',
    avatarData: null
  };
}

function createInitialCoaches(isPlayer = false, usedNames = null) {
  return {
    attacking: [ createCoach(COACHES_DATABASE.attacking[0], 'attacking', usedNames) ],
    defending: [ createCoach(COACHES_DATABASE.defending[0], 'defending', usedNames) ],
    goalkeeping: createCoach(COACHES_DATABASE.goalkeeping[0], 'goalkeeping', usedNames),
    fitness: createCoach(COACHES_DATABASE.fitness[0], 'fitness', usedNames)
  };
}

function ensureClubCoaches(club) {
  if (!club) return;
  if (!club.coaches || typeof club.coaches !== 'object') {
    club.coaches = createInitialCoaches(club.isPlayer);
    return;
  }
  if (!Array.isArray(club.coaches.attacking)) club.coaches.attacking = [];
  if (!Array.isArray(club.coaches.defending)) club.coaches.defending = [];
  if (club.coaches.goalkeeping === undefined) club.coaches.goalkeeping = null;
  if (club.coaches.fitness === undefined) club.coaches.fitness = null;
}

function getClubCoachingStaffWeeklyWage(club) {
  if (!club || !club.coaches) return 0;
  let total = 0;
  if (Array.isArray(club.coaches.attacking)) {
    club.coaches.attacking.forEach(c => { if (c) total += (c.weeklyWage || 0); });
  }
  if (Array.isArray(club.coaches.defending)) {
    club.coaches.defending.forEach(c => { if (c) total += (c.weeklyWage || 0); });
  }
  if (club.coaches.goalkeeping) {
    total += (club.coaches.goalkeeping.weeklyWage || 0);
  }
  if (club.coaches.fitness) {
    total += (club.coaches.fitness.weeklyWage || 0);
  }
  return total;
}

function getClubCoachingEffects(club) {
  if (!club || !club.coaches) {
    return { attMult: 1.0, defSuppression: 1.0, gkSaveBonus: 1.0, staDrainMult: 1.0, injuryProbMult: 1.0 };
  }
  let attScore = 0;
  (club.coaches.attacking || []).forEach(c => {
    if (c) attScore += (c.rank === 'A' ? 1.0 : (c.rank === 'B' ? 0.7 : 0.4));
  });

  let defScore = 0;
  (club.coaches.defending || []).forEach(c => {
    if (c) defScore += (c.rank === 'A' ? 1.0 : (c.rank === 'B' ? 0.7 : 0.4));
  });

  let gkScore = 0;
  if (club.coaches.goalkeeping) {
    const r = club.coaches.goalkeeping.rank;
    gkScore = (r === 'A' ? 1.0 : (r === 'B' ? 0.7 : 0.4));
  }

  let fitScore = 0;
  if (club.coaches.fitness) {
    const r = club.coaches.fitness.rank;
    fitScore = (r === 'A' ? 1.0 : (r === 'B' ? 0.7 : 0.4));
  }

  return {
    attMult: 1.0 + attScore * 0.05,
    defSuppression: Math.max(0.75, 1.0 - defScore * 0.05),
    gkSaveBonus: Math.max(0.80, 1.0 - gkScore * 0.07),
    staDrainMult: Math.max(0.60, 1.0 - fitScore * 0.20),
    injuryProbMult: Math.max(0.40, 1.0 - fitScore * 0.35)
  };
}

/**
 * 試合終了時の監督信頼度（Trust）更新および現場介入ペナルティ
 */
function updateManagerTrustAfterMatch(club, won, drawn) {
  if (!club || !club.manager) return;
  const mgr = club.manager;
  const isFormMatch = club.formation === mgr.preferredFormation;
  const isTacticMatch = normalizeTacticKey(club.tactic) === normalizeTacticKey(mgr.preferredTactic);
  const isIntervention = !isFormMatch || !isTacticMatch;

  let delta = 0;
  if (won) {
    // 勝利時: 介入して勝った場合は現場も納得(+1)、得意スタイルなら信頼UP(+3)
    delta = isIntervention ? 1 : 3;
  } else if (drawn) {
    // 引き分け: 介入時は不満微増(-1)、得意スタイル時は+1
    delta = isIntervention ? -1 : 1;
  } else {
    // 敗北時: GMの介入で負けた場合は現場から強い不満(-3)、得意スタイル敗北は-1
    delta = isIntervention ? -3 : -1;
  }

  mgr.trust = Math.max(0, Math.min(100, (mgr.trust ?? 80) + delta));
}


'use strict';

/**
 * 僕のサッカークラブ（仮） - English Premier GM Simulation
 * 外部ライブラリ非依存 / 純粋なJavaScript実装
 * 内部通貨単位：1 = £1K（1,000ポンド）。例：45000 = £45.0M、500 = £500K
 */

// イングランドリーグ（プレミア相当）全20クラブ定義（全クラブ選択可能・全38節2回戦総当たり）
// 初期資金：£32.0M〜£140.0M（32000〜140000 £K）、サポーター規模、目標順位に差を設定

const CLUB_SHORT_CODES = {
  manchester_b: 'MCB',
  manchester_r: 'MCR',
  liverpool_b: 'LIV',
  northlondon_a: 'NLA',
  london_fc: 'LON',
  northlondon_w: 'NLW',
  newcastle_u: 'NEW',
  aston_v: 'AST',
  brighton_g: 'BRI',
  eastlondon_h: 'WHU',
  southlondon_p: 'CRY',
  westlondon_c: 'FUL',
  westlondon_b: 'BRE',
  midlands_w: 'WOL',
  merseyside_b: 'EVE',
  southcoast_c: 'SOU',
  nottingham_r: 'NFO',
  leicester_f: 'LEI',
  southampton_s: 'SHT',
  ipswich_t: 'IPS'
};

function getClubShortCode(clubOrId) {
  if (!clubOrId) return 'LFC';
  const id = typeof clubOrId === 'string' ? clubOrId : (clubOrId && clubOrId.id);
  if (id && CLUB_SHORT_CODES[id]) return CLUB_SHORT_CODES[id];
  if (typeof clubOrId === 'object' && clubOrId && clubOrId.shortName) return clubOrId.shortName;

  // 名前からCLUB_DEFINITIONSを逆引き
  const name = typeof clubOrId === 'string' ? clubOrId : (clubOrId && clubOrId.name);
  if (name) {
    const matched = CLUB_DEFINITIONS.find(c => c.name === name || name.includes(c.name));
    if (matched && CLUB_SHORT_CODES[matched.id]) return CLUB_SHORT_CODES[matched.id];
  }

  // フォールバック: 英数字から3文字抽出
  if (name) {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length >= 3) return cleaned.slice(0, 3);
  }
  return (id || 'LFC').slice(0, 3).toUpperCase();
}

let modalLockSavedScrollY = 0;
let modalLockContainerScrolls = [];

function setBodyModalLock(locked) {
  if (locked) {
    if (!document.body.classList.contains('modal-open')) {
      modalLockSavedScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      modalLockContainerScrolls = [];
      const scrollableCandidates = document.querySelectorAll(
        '.tab-view, .table-container, .main-scroll-container, #view-roster, #view-market, #view-team, #view-office'
      );
      scrollableCandidates.forEach(el => {
        if (el && el.scrollTop > 0) {
          modalLockContainerScrolls.push({ el, top: el.scrollTop });
        }
      });
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }
  } else {
    const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    if (openModals.length === 0) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      const restore = () => {
        if (typeof modalLockSavedScrollY === 'number') {
          window.scrollTo(0, modalLockSavedScrollY);
          if (document.documentElement) document.documentElement.scrollTop = modalLockSavedScrollY;
          if (document.body) document.body.scrollTop = modalLockSavedScrollY;
        }
        modalLockContainerScrolls.forEach(({ el, top }) => {
          if (el && el.scrollTop !== top) {
            el.scrollTop = top;
          }
        });
      };
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore, 20);
      setTimeout(restore, 60);
    }
  }
}


/**
 * 欧州20クラブの固有エンブレム定義（形状・配色・パターン・頭文字シンボル）
 */
const CLUB_EMBLEM_MAP = {
  'manchester_b': { shape: 'circle', primaryColor: '#6ba4d9', secondaryColor: '#ffffff', pattern: 'stripes', symbol: 'M' },
  'manchester_r': { shape: 'shield', primaryColor: '#da020e', secondaryColor: '#ffe500', pattern: 'diagonal', symbol: 'M' },
  'liverpool_b': { shape: 'shield', primaryColor: '#c8102e', secondaryColor: '#00b2a9', pattern: 'solid', symbol: 'L' },
  'northlondon_a': { shape: 'shield', primaryColor: '#ef0107', secondaryColor: '#ffffff', pattern: 'split', symbol: 'A' },
  'london_fc': { shape: 'circle', primaryColor: '#034694', secondaryColor: '#dba111', pattern: 'solid', symbol: 'L' },
  'northlondon_w': { shape: 'shield', primaryColor: '#132257', secondaryColor: '#ffffff', pattern: 'stripes', symbol: 'W' },
  'newcastle_u': { shape: 'shield', primaryColor: '#241f20', secondaryColor: '#ffffff', pattern: 'stripes', symbol: 'N' },
  'aston_v': { shape: 'shield', primaryColor: '#670e36', secondaryColor: '#95bfe5', pattern: 'diagonal', symbol: 'V' },
  'brighton_g': { shape: 'circle', primaryColor: '#0057b8', secondaryColor: '#ffffff', pattern: 'stripes', symbol: 'B' },
  'eastlondon_h': { shape: 'shield', primaryColor: '#7a263a', secondaryColor: '#1bb1e7', pattern: 'chevron', symbol: 'H' },
  'southlondon_p': { shape: 'shield', primaryColor: '#1b458f', secondaryColor: '#c4122e', pattern: 'stripes', symbol: 'P' },
  'westlondon_c': { shape: 'shield', primaryColor: '#1a1d20', secondaryColor: '#cc0000', pattern: 'solid', symbol: 'C' },
  'westlondon_b': { shape: 'circle', primaryColor: '#e30613', secondaryColor: '#ffffff', pattern: 'diagonal', symbol: 'B' },
  'midlands_w': { shape: 'diamond', primaryColor: '#fdb913', secondaryColor: '#231f20', pattern: 'solid', symbol: 'W' },
  'merseyside_b': { shape: 'shield', primaryColor: '#003399', secondaryColor: '#ffffff', pattern: 'chevron', symbol: 'M' },
  'southcoast_c': { shape: 'shield', primaryColor: '#da291c', secondaryColor: '#111111', pattern: 'stripes', symbol: 'C' },
  'nottingham_r': { shape: 'shield', primaryColor: '#dd0000', secondaryColor: '#ffffff', pattern: 'solid', symbol: 'N' },
  'leicester_f': { shape: 'circle', primaryColor: '#003090', secondaryColor: '#fdbe11', pattern: 'solid', symbol: 'F' },
  'southampton_s': { shape: 'shield', primaryColor: '#d71920', secondaryColor: '#ffffff', pattern: 'diagonal', symbol: 'S' },
  'ipswich_t': { shape: 'shield', primaryColor: '#004494', secondaryColor: '#ffffff', pattern: 'stripes', symbol: 'T' }
};

let emblemSvgUidCounter = 0;

/**
 * クラブエンブレム（バッジ）を動的インラインSVGとして生成する
 * 外部画像不要・高精細ベクトル描画・絵文字不使用
 * @param {Object|string} clubOrNameOrId クラブオブジェクト、ID、またはクラブ名
 * @param {number} size 表示ピクセルサイズ（width/height）
 * @param {string} extraClass 追加CSSクラス名
 * @returns {string} インラインSVGタグ文字列
 */
function getClubEmblemSvg(clubOrNameOrId, size = 24, extraClass = '') {
  if (!clubOrNameOrId) return '';

  let clubId = '';
  let clubName = '';
  let emblemConf = null;

  if (typeof clubOrNameOrId === 'object') {
    clubId = clubOrNameOrId.id || '';
    clubName = clubOrNameOrId.name || '';
    emblemConf = clubOrNameOrId.emblem || (clubId ? CLUB_EMBLEM_MAP[clubId] : null);
    if (!emblemConf && clubOrNameOrId.primaryColor) {
      const rawPat = (clubOrNameOrId.pattern || 'stripes').replace(/-vertical|-horizontal|-diagonal/g, '');
      const validPat = ['stripes', 'diagonal', 'chevron', 'solid', 'split'].includes(rawPat) ? rawPat : 'stripes';
      const sym = (clubOrNameOrId.initial || clubOrNameOrId.shortName || clubName || 'FC').charAt(0).toUpperCase();
      emblemConf = {
        shape: clubOrNameOrId.shape || 'shield',
        primaryColor: clubOrNameOrId.primaryColor,
        secondaryColor: clubOrNameOrId.secondaryColor || '#ffffff',
        pattern: validPat,
        symbol: sym
      };
    }
  } else if (typeof clubOrNameOrId === 'string') {
    if (CLUB_EMBLEM_MAP[clubOrNameOrId]) {
      clubId = clubOrNameOrId;
      emblemConf = CLUB_EMBLEM_MAP[clubOrNameOrId];
    } else {
      clubName = clubOrNameOrId;
      // クラブ名から検索
      const allBigFive = typeof getAllBigFiveClubs === 'function' ? getAllBigFiveClubs() : [];
      const matchedClub = (Array.isArray(gameState.clubs) && gameState.clubs.find(c => c.name === clubName || c.id === clubName || clubName.includes(c.name)))
        || CLUB_DEFINITIONS.find(c => c.name === clubName || c.id === clubName || clubName.includes(c.name))
        || allBigFive.find(c => c.name === clubName || c.id === clubName);
      if (matchedClub) {
        clubId = matchedClub.id;
        emblemConf = matchedClub.emblem || CLUB_EMBLEM_MAP[clubId];
        if (!emblemConf && matchedClub.primaryColor) {
          const rawPat = (matchedClub.pattern || 'stripes').replace(/-vertical|-horizontal|-diagonal/g, '');
          const validPat = ['stripes', 'diagonal', 'chevron', 'solid', 'split'].includes(rawPat) ? rawPat : 'stripes';
          const sym = (matchedClub.initial || matchedClub.shortName || matchedClub.name || 'FC').charAt(0).toUpperCase();
          emblemConf = {
            shape: matchedClub.shape || 'shield',
            primaryColor: matchedClub.primaryColor,
            secondaryColor: matchedClub.secondaryColor || '#ffffff',
            pattern: validPat,
            symbol: sym
          };
        }
      }
    }
  }

  // フォールバック生成（海外クラブや未定義名などの場合）
  if (!emblemConf) {
    const seed = (clubName || clubId || 'FC').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const shapes = ['shield', 'circle', 'diamond'];
    const patterns = ['stripes', 'diagonal', 'chevron', 'solid', 'split'];
    const palettes = [
      { p: '#1e3a8a', s: '#ffffff' },
      { p: '#b91c1c', s: '#f59e0b' },
      { p: '#047857', s: '#ffffff' },
      { p: '#4c1d95', s: '#f3e8ff' },
      { p: '#0f172a', s: '#38bdf8' },
      { p: '#c2410c', s: '#ffffff' },
      { p: '#0284c7', s: '#ffffff' },
      { p: '#831843', s: '#fbcfe8' }
    ];
    const pal = palettes[seed % palettes.length];
    const initialChar = (clubName || clubId || 'F').replace(/[^a-zA-Z0-9぀-ゟ゠-ヿ]/g, '').charAt(0).toUpperCase() || 'F';

    emblemConf = {
      shape: shapes[seed % shapes.length],
      primaryColor: pal.p,
      secondaryColor: pal.s,
      pattern: patterns[seed % patterns.length],
      symbol: initialChar
    };
  }

  const { shape, primaryColor, secondaryColor, pattern, symbol } = emblemConf;
  const uid = 'emb-' + (++emblemSvgUidCounter);

  let shapePath = '';
  let clipShape = '';
  let borderElement = '';

  if (shape === 'circle') {
    clipShape = `<circle cx="50" cy="50" r="44"/>`;
    borderElement = `
      <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.95"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(0, 0, 0, 0.45)" stroke-width="1.5"/>
    `;
  } else if (shape === 'diamond') {
    shapePath = 'M 50 8 L 92 50 L 50 92 L 8 50 Z';
    clipShape = `<path d="${shapePath}"/>`;
    borderElement = `
      <path d="${shapePath}" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-opacity="0.95" stroke-linejoin="round"/>
      <path d="M 50 14 L 86 50 L 50 86 L 14 50 Z" fill="none" stroke="rgba(0, 0, 0, 0.45)" stroke-width="1.5" stroke-linejoin="round"/>
    `;
  } else {
    // デフォルト: shield
    shapePath = 'M 14 12 L 86 12 L 86 52 C 86 76, 50 94, 50 94 C 50 94, 14 76, 14 52 Z';
    const innerShieldPath = 'M 18 16 L 82 16 L 82 50 C 82 72, 50 88, 50 88 C 50 88, 18 72, 18 50 Z';
    clipShape = `<path d="${shapePath}"/>`;
    borderElement = `
      <path d="${shapePath}" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-opacity="0.95" stroke-linejoin="round"/>
      <path d="${innerShieldPath}" fill="none" stroke="rgba(0, 0, 0, 0.4)" stroke-width="1.5" stroke-linejoin="round"/>
    `;
  }

  // 内部幾何学パターン（エンブレム全面に鮮やかに展開）
  let patternElements = '';
  if (pattern === 'stripes') {
    patternElements = `
      <rect x="24" y="0" width="16" height="100" fill="${secondaryColor}" opacity="0.95"/>
      <rect x="60" y="0" width="16" height="100" fill="${secondaryColor}" opacity="0.95"/>
    `;
  } else if (pattern === 'diagonal') {
    patternElements = `
      <polygon points="0,0 42,0 100,58 100,100" fill="${secondaryColor}" opacity="0.95"/>
      <polygon points="0,58 0,100 42,100" fill="${secondaryColor}" opacity="0.95"/>
    `;
  } else if (pattern === 'chevron') {
    patternElements = `
      <path d="M 0 35 L 50 65 L 100 35 L 100 55 L 50 85 L 0 55 Z" fill="${secondaryColor}" opacity="0.95"/>
    `;
  } else if (pattern === 'split') {
    patternElements = `
      <rect x="50" y="0" width="50" height="100" fill="${secondaryColor}" opacity="0.95"/>
    `;
  } else {
    // solid（単色）：アクセントの同心ライン
    patternElements = `
      <circle cx="50" cy="50" r="32" fill="none" stroke="${secondaryColor}" stroke-width="2.5" opacity="0.45"/>
    `;
  }

  return `
    <svg class="club-emblem ${extraClass}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
      <defs>
        <clipPath id="${uid}">
          ${clipShape}
        </clipPath>
      </defs>
      <!-- 背景メイン色 ＆ 全面幾何学パターン -->
      <g clip-path="url(#${uid})">
        <rect x="0" y="0" width="100" height="100" fill="${primaryColor}"/>
        ${patternElements}
      </g>
      <!-- 外枠二重線（ディテール強化） -->
      ${borderElement}
      <!-- 中央シンボル（黒丸を撤去し、輪郭付きテキストで背景パターンと調和） -->
      <text x="50" y="55" font-family="'Roboto Mono', 'Arial Black', sans-serif" font-weight="900" font-size="34" text-anchor="middle" dominant-baseline="central" fill="#ffffff" stroke="rgba(0, 0, 0, 0.85)" stroke-width="5" paint-order="stroke fill" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">${symbol}</text>
    </svg>
  `.trim();
}

const CLUB_DEFINITIONS = [
  {
    id: 'manchester_b',
    emblem: CLUB_EMBLEM_MAP['manchester_b'],
    name: 'マンチェスター・B',
    tier: 'MEGA RICH',
    desc: '潤沢なオイルマネーと世界屈指の戦力を誇る現王者',
    basePower: 72,
    initialFunds: 140000, // £140.0M
    supporters: 21500,
    targetRank: 1,
    targetLabel: '1位（優勝）',
    defaultTactic: 'possession',
    defaultFormation: '4-1-2-3'
  },
  {
    id: 'manchester_r',
    emblem: CLUB_EMBLEM_MAP['manchester_r'],
    name: 'マンチェスター・R',
    tier: 'TRADITIONAL',
    desc: '世界的な人気と莫大な商業収入を持つ伝統の赤い名門',
    basePower: 70,
    initialFunds: 125000, // £125.0M
    supporters: 22000,
    targetRank: 3,
    targetLabel: '3位以内',
    defaultTactic: 'counter',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'liverpool_b',
    emblem: CLUB_EMBLEM_MAP['liverpool_b'],
    name: 'リバプール・B',
    tier: 'CONTENDER',
    desc: '熱狂的なサポーターと激しいゲーゲンプレスを武器とする強豪',
    basePower: 71,
    initialFunds: 115000, // £115.0M
    supporters: 21000,
    targetRank: 2,
    targetLabel: '2位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-3-3'
  },
  {
    id: 'northlondon_a',
    emblem: CLUB_EMBLEM_MAP['northlondon_a'],
    name: 'ノースロンドン・A',
    tier: 'CONTENDER',
    desc: '華麗なパスサッカーと若手育成に定評がある北ロンドンの雄',
    basePower: 70,
    initialFunds: 105000, // £105.0M
    supporters: 20000,
    targetRank: 3,
    targetLabel: '3位以内',
    defaultTactic: 'possession',
    defaultFormation: '4-3-3'
  },
  {
    id: 'london_fc',
    emblem: CLUB_EMBLEM_MAP['london_fc'],
    name: 'ロンドン・FC',
    tier: 'AMBITIOUS',
    desc: '積極的な大型補強で欧州王座奪還を狙う西ロンドンの強豪',
    basePower: 68,
    initialFunds: 98000, // £98.0M
    supporters: 19000,
    targetRank: 4,
    targetLabel: '4位以内',
    defaultTactic: 'possession',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'northlondon_w',
    emblem: CLUB_EMBLEM_MAP['northlondon_w'],
    name: 'ノースロンドン・W',
    tier: 'BIG CLUB',
    desc: '最新鋭スタジアムと前線からの速攻を備える北ロンドンの白百合',
    basePower: 68,
    initialFunds: 88000, // £88.0M
    supporters: 18500,
    targetRank: 5,
    targetLabel: '5位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'newcastle_u',
    emblem: CLUB_EMBLEM_MAP['newcastle_u'],
    name: 'ニューカッスル・U',
    tier: 'RISING FORCE',
    desc: '新オーナー参入で急成長を遂げる北部の熱狂的クラブ',
    basePower: 67,
    initialFunds: 82000, // £82.0M
    supporters: 18000,
    targetRank: 6,
    targetLabel: '6位以内',
    defaultTactic: 'wingplay',
    defaultFormation: '4-3-3'
  },
  {
    id: 'aston_v',
    emblem: CLUB_EMBLEM_MAP['aston_v'],
    name: 'アストン・V',
    tier: 'CHALLENGER',
    desc: '智将のもとで欧州カップ戦出場を狙うバーミンガムの古豪',
    basePower: 66,
    initialFunds: 68000, // £68.0M
    supporters: 16800,
    targetRank: 6,
    targetLabel: '6位以内',
    defaultTactic: 'counter',
    defaultFormation: '4-4-2'
  },
  {
    id: 'brighton_g',
    emblem: CLUB_EMBLEM_MAP['brighton_g'],
    name: 'ブライトン・G',
    tier: 'SMART SCOUT',
    desc: 'データ分析と独自スカウティングでビッグクラブに挑む新興勢力',
    basePower: 65,
    initialFunds: 58000, // £58.0M
    supporters: 15000,
    targetRank: 8,
    targetLabel: '8位以内',
    defaultTactic: 'possession',
    defaultFormation: '3-4-3'
  },
  {
    id: 'eastlondon_h',
    emblem: CLUB_EMBLEM_MAP['eastlondon_h'],
    name: 'イーストロンドン・H',
    tier: 'MID TABLE',
    desc: '労働者階級の熱い支持と堅守速攻を誇る東ロンドンの雄',
    basePower: 64,
    initialFunds: 60000, // £60.0M
    supporters: 16500,
    targetRank: 9,
    targetLabel: '9位以内',
    defaultTactic: 'counter',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'southlondon_p',
    emblem: CLUB_EMBLEM_MAP['southlondon_p'],
    name: 'サウスロンドン・P',
    tier: 'MID TABLE',
    desc: '抜群の身体能力を持つウイングと育成組織が光る南ロンドンの雄',
    basePower: 63,
    initialFunds: 52000, // £52.0M
    supporters: 14500,
    targetRank: 10,
    targetLabel: '10位以内',
    defaultTactic: 'wingplay',
    defaultFormation: '3-4-3'
  },
  {
    id: 'westlondon_c',
    emblem: CLUB_EMBLEM_MAP['westlondon_c'],
    name: 'ウェストロンドン・C',
    tier: 'MID TABLE',
    desc: 'テムズ川沿いの伝統スタジアムを本拠とする西ロンドンの古豪',
    basePower: 63,
    initialFunds: 48000, // £48.0M
    supporters: 14000,
    targetRank: 12,
    targetLabel: '12位以内',
    defaultTactic: 'wingplay',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'westlondon_b',
    emblem: CLUB_EMBLEM_MAP['westlondon_b'],
    name: 'ウェストロンドン・B',
    tier: 'MONEYBALL',
    desc: '徹底した統計モデルとセットプレー戦術で1部に定着した知性派',
    basePower: 62,
    initialFunds: 45000, // £45.0M
    supporters: 13200,
    targetRank: 13,
    targetLabel: '13位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '3-5-2'
  },
  {
    id: 'midlands_w',
    emblem: CLUB_EMBLEM_MAP['midlands_w'],
    name: 'ミッドランズ・W',
    tier: 'MID TABLE',
    desc: 'イベリア半島出身の技巧派選手を数多く擁する中部の実力派',
    basePower: 62,
    initialFunds: 46000, // £46.0M
    supporters: 13800,
    targetRank: 13,
    targetLabel: '13位以内',
    defaultTactic: 'counter',
    defaultFormation: '5-3-2'
  },
  {
    id: 'merseyside_b',
    emblem: CLUB_EMBLEM_MAP['merseyside_b'],
    name: 'マージーサイド・B',
    tier: 'TRADITIONAL',
    desc: '長年1部リーグを守り続けるマージーサイドの誇り高き青き伝統',
    basePower: 62,
    initialFunds: 45000, // £45.0M
    supporters: 15200,
    targetRank: 14,
    targetLabel: '14位以内',
    defaultTactic: 'parkthebus',
    defaultFormation: '4-4-2'
  },
  {
    id: 'southcoast_c',
    emblem: CLUB_EMBLEM_MAP['southcoast_c'],
    name: 'サウスコースト・C',
    tier: 'CHALLENGER',
    desc: '南部のリゾート都市を拠点にアグレッシブなサッカーを展開',
    basePower: 61,
    initialFunds: 42000, // £42.0M
    supporters: 12500,
    targetRank: 15,
    targetLabel: '15位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-3-1-2'
  },
  {
    id: 'nottingham_r',
    emblem: CLUB_EMBLEM_MAP['nottingham_r'],
    name: 'ノッティンガム・R',
    tier: 'HISTORIC',
    desc: 'かつて欧州連覇を成し遂げた歴史を持つ伝統のフォレスト',
    basePower: 61,
    initialFunds: 40000, // £40.0M
    supporters: 13500,
    targetRank: 16,
    targetLabel: '16位以内',
    defaultTactic: 'counter',
    defaultFormation: '5-3-2'
  },
  {
    id: 'leicester_f',
    emblem: CLUB_EMBLEM_MAP['leicester_f'],
    name: 'レスター・F',
    tier: 'MIRACLE',
    desc: '奇跡のリーグ制覇の記憶を胸に再び上位定着を目指すフォックス',
    basePower: 60,
    initialFunds: 38000, // £38.0M
    supporters: 13200,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'counter',
    defaultFormation: '4-3-1-2'
  },
  {
    id: 'southampton_s',
    emblem: CLUB_EMBLEM_MAP['southampton_s'],
    name: 'サウサンプトン・S',
    tier: 'ACADEMY',
    desc: '数々の名選手を輩出してきた南部屈指の育成型クラブ',
    basePower: 59,
    initialFunds: 35000, // £35.0M
    supporters: 12200,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'possession',
    defaultFormation: '4-1-2-3'
  },
  {
    id: 'ipswich_t',
    emblem: CLUB_EMBLEM_MAP['ipswich_t'],
    name: 'イプスウィッチ・T',
    tier: 'PROMOTED',
    desc: '連続昇格の勢いと組織力でプレミア残留に挑む東部の古豪',
    basePower: 58,
    initialFunds: 32000, // £32.0M
    supporters: 11500,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'parkthebus',
    defaultFormation: '5-3-2'
  }
];

// 他国（スペイン、ドイツ、イタリア、フランス）の主要メガクラブ（欧州強豪データとして内部保持）
const EUROPEAN_MEGA_CLUBS = [
  { id: 'madrid',
    emblem: CLUB_EMBLEM_MAP['madrid'], name: 'マドリード・ブランコス', country: 'スペイン', basePower: 75, budget: 120000 },
  { id: 'barcelona',
    emblem: CLUB_EMBLEM_MAP['barcelona'], name: 'バルセロナ・カタルーニャ', country: 'スペイン', basePower: 73, budget: 95000 },
  { id: 'munich',
    emblem: CLUB_EMBLEM_MAP['munich'], name: 'ミュンヘン・バヴァリア', country: 'ドイツ', basePower: 74, budget: 105000 },
  { id: 'milano',
    emblem: CLUB_EMBLEM_MAP['milano'], name: 'ミラノ・ロッソネリ', country: 'イタリア', basePower: 71, budget: 82000 },
  { id: 'torino',
    emblem: CLUB_EMBLEM_MAP['torino'], name: 'トリノ・ビアンコネリ', country: 'イタリア', basePower: 71, budget: 85000 },
  { id: 'paris',
    emblem: CLUB_EMBLEM_MAP['paris'], name: 'パリ・メトロポリタン', country: 'フランス', basePower: 73, budget: 115000 }
];

// 12ポジション定義とカテゴリ分類
const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'CF'];

const POS_DISPLAY_ORDER = {
  GK: 1,
  CB: 2,
  LB: 3,
  LWB: 3,
  RB: 4,
  RWB: 4,
  DM: 5,
  CM: 6,
  LM: 7,
  RM: 8,
  AM: 9,
  LW: 10,
  RW: 11,
  CF: 12
};

const POS_ROLE_GROUP = {
  GK: 'GK',
  CB: 'DF',
  LB: 'DF',
  RB: 'DF',
  LWB: 'DF',
  RWB: 'DF',
  DM: 'MF',
  CM: 'MF',
  LM: 'MF',
  RM: 'MF',
  AM: 'MF',
  LW: 'FW',
  RW: 'FW',
  CF: 'FW'
};

// 全8種類のフォーメーション定義（ピッチ座標 x: 0〜100%, y: 0〜100% ※上が相手ゴール方向）
const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 69 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 75 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 75 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 69 },
      { slotIndex: 5, pos: 'DM', label: 'DM', x: 50, y: 57 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 26, y: 42 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 74, y: 42 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 18, y: 22 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 15 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 82, y: 22 }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 76 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 70 },
      { slotIndex: 5, pos: 'DM', label: 'LDM', x: 33, y: 56 },
      { slotIndex: 6, pos: 'DM', label: 'RDM', x: 67, y: 56 },
      { slotIndex: 7, pos: 'LM', label: 'LM', x: 16, y: 36 },
      { slotIndex: 8, pos: 'AM', label: 'AM', x: 50, y: 35 },
      { slotIndex: 9, pos: 'RM', label: 'RM', x: 84, y: 36 },
      { slotIndex: 10, pos: 'CF', label: 'CF', x: 50, y: 15 }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 69 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 75 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 75 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 69 },
      { slotIndex: 5, pos: 'LM', label: 'LM', x: 14, y: 46 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 37, y: 49 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 63, y: 49 },
      { slotIndex: 8, pos: 'RM', label: 'RM', x: 86, y: 46 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 18 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'CB', label: 'LCB', x: 22, y: 73 },
      { slotIndex: 2, pos: 'CB', label: 'CB', x: 50, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 78, y: 73 },
      { slotIndex: 4, pos: 'DM', label: 'DM', x: 50, y: 57 },
      { slotIndex: 5, pos: 'LM', label: 'LM', x: 13, y: 43 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 34, y: 41 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 66, y: 41 },
      { slotIndex: 8, pos: 'RM', label: 'RM', x: 87, y: 43 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 18 }
    ]
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'CB', label: 'LCB', x: 22, y: 73 },
      { slotIndex: 2, pos: 'CB', label: 'CB', x: 50, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 78, y: 73 },
      { slotIndex: 4, pos: 'LM', label: 'LM', x: 14, y: 47 },
      { slotIndex: 5, pos: 'CM', label: 'LCM', x: 37, y: 50 },
      { slotIndex: 6, pos: 'CM', label: 'RCM', x: 63, y: 50 },
      { slotIndex: 7, pos: 'RM', label: 'RM', x: 86, y: 47 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 18, y: 21 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 15 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 82, y: 21 }
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LWB', label: 'LWB', x: 12, y: 62 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 29, y: 74 },
      { slotIndex: 3, pos: 'CB', label: 'CB', x: 50, y: 77 },
      { slotIndex: 4, pos: 'CB', label: 'RCB', x: 71, y: 74 },
      { slotIndex: 5, pos: 'RWB', label: 'RWB', x: 88, y: 62 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 24, y: 44 },
      { slotIndex: 7, pos: 'CM', label: 'CM', x: 50, y: 48 },
      { slotIndex: 8, pos: 'CM', label: 'RCM', x: 76, y: 44 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 18 }
    ]
  },
  '4-1-2-3': {
    name: '4-1-2-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 76 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 70 },
      { slotIndex: 5, pos: 'DM', label: 'DM', x: 50, y: 58 },
      { slotIndex: 6, pos: 'AM', label: 'LAM', x: 31, y: 40 },
      { slotIndex: 7, pos: 'AM', label: 'RAM', x: 69, y: 40 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 17, y: 20 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 14 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 83, y: 20 }
    ]
  },
  '4-3-1-2': {
    name: '4-3-1-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 76 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 70 },
      { slotIndex: 5, pos: 'CM', label: 'LCM', x: 24, y: 50 },
      { slotIndex: 6, pos: 'DM', label: 'DM', x: 50, y: 56 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 76, y: 50 },
      { slotIndex: 8, pos: 'AM', label: 'AM', x: 50, y: 34 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 16 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 16 }
    ]
  }
};

// スタメン11枠の基準ポジション数（4-3-3ベース）
const REQUIRED_STARTERS = {
  GK: 1,
  CB: 2,
  LB: 1,
  RB: 1,
  DM: 1,
  CM: 2,
  LM: 0,
  RM: 0,
  AM: 0,
  LW: 1,
  RW: 1,
  CF: 1
};

// 1チームの初期20名構成（スタメン11名＋現代プレミアリーグ公式基準ベンチ9名）
const SQUAD_COMPOSITION = [
  { pos: 'GK', total: 2, starters: 1 },  // GK 2名 (スタメン1, 控え1)
  { pos: 'CB', total: 4, starters: 2 },  // CB 4名 (スタメン2, 控え2)
  { pos: 'LB', total: 1, starters: 1 },  // LB 1名 (スタメン1)
  { pos: 'RB', total: 1, starters: 1 },  // RB 1名 (スタメン1)
  { pos: 'DM', total: 2, starters: 1 },  // DM 2名 (スタメン1, 控え1)
  { pos: 'CM', total: 3, starters: 2 },  // CM 3名 (スタメン2, 控え1)
  { pos: 'LM', total: 1, starters: 0 },  // LM 1名 (控え1)
  { pos: 'RM', total: 1, starters: 0 },  // RM 1名 (控え1)
  { pos: 'AM', total: 1, starters: 0 },  // AM 1名 (控え1)
  { pos: 'LW', total: 1, starters: 1 },  // LW 1名 (スタメン1)
  { pos: 'RW', total: 1, starters: 1 },  // RW 1名 (スタメン1)
  { pos: 'CF', total: 2, starters: 1 }   // CF 2名 (スタメン1, 控え1)
];

// 所属選手の上限枠（実質無制限の最大50名、常設ユースチーム最大10名）
const MAX_SQUAD_SIZE = 50;
const MAX_YOUTH_SQUAD_SIZE = 10;

// プレミア順位賞金テーブル（全20位、単位：£1K -> 1位 £42.0M 〜 20位 £5.0M）
const PRIZE_MONEY_TABLE = [
  42000, 38000, 34000, 30000, 27000,
  24000, 21500, 19000, 17000, 15000,
  13500, 12000, 10500, 9200, 8000,
  7000, 6200, 5800, 5400, 5000
];

// 4つの成長曲線（growthCurve）定義
const GROWTH_CURVES = [
  { id: 'early',
    emblem: CLUB_EMBLEM_MAP['early'], label: '早熟' },
  { id: 'standard',
    emblem: CLUB_EMBLEM_MAP['standard'], label: '標準' },
  { id: 'late',
    emblem: CLUB_EMBLEM_MAP['late'], label: '晩成' },
  { id: 'fragile',
    emblem: CLUB_EMBLEM_MAP['fragile'], label: '天才' }
];

// 5大チーム戦術スタイル定義
const TACTICS_DEFINITIONS = {
  possession: {
    name: 'ポゼッション（ショートパス主導）',
    badge: 'POSSESSION',
    aim: 'ボール支配率を高めてじっくり相手を崩す。',
    effect: '中盤（CM/DM）のパス・OVRが高いほど支配率UP＆失点リスクDOWN。格下相手に取りこぼしにくい。',
    desc: '【ポゼッション（Possession / ショートパス主導）】狙い：ボール支配率を高めてじっくり相手を崩す。 ／ 効果：中盤（CM/DM）のパス・OVRが高いほど支配率UP＆失点リスクDOWN。格下相手に取りこぼしにくい。'
  },
  gegenpress: {
    name: 'ゲーゲンプレス（前線奪取速攻）',
    badge: 'GEGENPRESS',
    aim: '敵陣深くから激しく奪い、敵ゴール前で一気に仕留める。',
    effect: 'シュート数・決定機が大幅UPするが、チーム全体のスタミナ消費が1.3倍になり、終盤の失点や負傷率が微増。',
    desc: '【ゲーゲンプレス（Gegenpress / 前線奪取速攻）】狙い：敵陣深くから激しく奪い、敵ゴール前で一気に仕留める。 ／ 効果：シュート数・決定機が大幅UPするが、チーム全体のスタミナ消費が1.3倍になり、終盤の失点や負傷率が微増。'
  },
  counter: {
    name: 'ダイレクトカウンター（堅守ロング速攻）',
    badge: 'DIRECT COUNTER',
    aim: '自陣に引き込んで守り、奪ったら前線の快足FWへ一撃ロングボール。',
    effect: 'スピード（Pace）の高いFWがいると得点力UP。格上（強豪）に対して金星を挙げやすく、スタミナ消費は省エネ。',
    desc: '【ダイレクトカウンター（Direct Counter / 堅守ロング速攻）】狙い：自陣に引き込んで守り、奪ったら前線の快足FWへ一撃ロングボール。 ／ 効果：スピード（Pace）の高いFWがいると得点力UP。格上（強豪）に対して金星を挙げやすく、スタミナ消費は省エネ。'
  },
  wingplay: {
    name: 'ワイドアタック（サイドアタック）',
    badge: 'WING PLAY',
    aim: '両翼（WG/SB/WB）の突破とクロスで中央密集を外から崩す。',
    effect: 'サイドポジションの総合値が攻撃力に強く反映。相手の5バックや中央守備を攻略しやすい。',
    desc: '【ワイドアタック（Wing Play / サイドアタック）】狙い：両翼（WG/SB/WB）の突破とクロスで中央密集を外から崩す。 ／ 効果：サイドポジションの総合値が攻撃力に強く反映。相手の5バックや中央守備を攻略しやすい。'
  },
  parkthebus: {
    name: 'ウルトラディフェンス（徹底堅守）',
    badge: 'PARK THE BUS',
    aim: '11人全員が自陣バイタルエリアを埋めてゴール前に鍵をかける。',
    effect: '失点率を大幅にカットするが、自チームの得点期待値もほぼゼロに。リード維持や強豪相手の引き分け（勝点1）狙いに有効。',
    desc: '【ウルトラディフェンス（Park the Bus / 徹底堅守）】狙い：11人全員が自陣バイタルエリアを埋めてゴール前に鍵をかける。 ／ 効果：失点率を大幅にカットするが、自チームの得点期待値もほぼゼロに。リード維持や強豪相手の引き分け（勝点1）狙いに有効。'
  }
};

/**
 * 旧セーブデータ等の戦術キー（highpress 等）を5大戦術キーへ正規化するヘルパー
 */
function normalizeTacticKey(tacticKey) {
  if (tacticKey === 'highpress') return 'gegenpress';
  if (tacticKey && TACTICS_DEFINITIONS[tacticKey]) return tacticKey;
  return 'possession';
}

// 国籍別・架空欧州選手名データ辞書（各First Name 25種以上、Last Name 35種以上）
const NATIONALITY_NAME_DATABASE = {
  England: {
    firstNames: [
      'Jack', 'Oliver', 'Harry', 'George', 'Noah', 'Charlie', 'Jacob', 'Alfie', 'Freddie', 'Oscar',
      'Leo', 'Arthur', 'Thomas', 'Henry', 'William', 'Edward', 'Archie', 'Joshua', 'Mason', 'Lucas',
      'Liam', 'Callum', 'James', 'Ethan', 'Dylan', 'Samuel', 'Daniel', 'Luke'
    ],
    lastNames: [
      'Bennett', 'Cooper', 'Harrison', 'Turner', 'Palmer', 'Morgan', 'Hughes', 'Edwards', 'Foster', 'Fletcher',
      'Carter', 'Hayes', 'Brooks', 'Jenkins', 'Collins', 'Reynolds', 'Butler', 'Shaw', 'Marshall', 'Barnes',
      'Russell', 'Powell', 'Bryant', 'Crawford', 'Griffin', 'Wallace', 'Dixon', 'Cole', 'Barrett', 'Henderson',
      'Pearson', 'Spencer', 'Hopkins', 'Chapman', 'Mason', 'Ellis', 'Richards'
    ]
  },
  France: {
    firstNames: [
      'Mathis', 'Lucas', 'Theo', 'Hugo', 'Maxime', 'Arthur', 'Louis', 'Gabriel', 'Jules', 'Raphael',
      'Antoine', 'Leo', 'Alexandre', 'Thomas', 'Paul', 'Enzo', 'Clement', 'Nathan', 'Valentin', 'Simon',
      'Bastien', 'Julien', 'Adrien', 'Florian', 'Romain', 'Alexis', 'Pierre'
    ],
    lastNames: [
      'Dubois', 'Leroy', 'Moreau', 'Laurent', 'Lefebvre', 'Roux', 'Fournier', 'Girard', 'Bonnet', 'Mercier',
      'Blanc', 'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Perrin', 'Robin',
      'Clement', 'Morin', 'Nicolas', 'Roussel', 'Mathieu', 'Marchand', 'Duval', 'Denis', 'Fabre', 'Masson',
      'Charpentier', 'Colin', 'Renard', 'Brunet', 'Picard', 'Vidal', 'Gaillard'
    ]
  },
  Spain: {
    firstNames: [
      'Alejandro', 'Mateo', 'Lucas', 'Daniel', 'Pablo', 'Alvaro', 'Adrian', 'David', 'Diego', 'Javier',
      'Mario', 'Marcos', 'Manuel', 'Sergio', 'Carlos', 'Hugo', 'Gonzalo', 'Martin', 'Jorge', 'Nicolas',
      'Ivan', 'Ruben', 'Miguel', 'Raul', 'Hector', 'Fernando', 'Rodrigo'
    ],
    lastNames: [
      'Vega', 'Navarro', 'Serrano', 'Romero', 'Torres', 'Ramirez', 'Flores', 'Benitez', 'Aguilar', 'Medina',
      'Castro', 'Vargas', 'Herrera', 'Guzman', 'Mendez', 'Ortiz', 'Morales', 'Delgado', 'Pena', 'Cabrera',
      'Rios', 'Santana', 'Cordero', 'Rivas', 'Gallego', 'Pacheco', 'Valenzuela', 'Miranda', 'Carrillo', 'Soler',
      'Marquez', 'Duran', 'Cano', 'Garrido', 'Blanco', 'Cortez', 'Campos'
    ]
  },
  Germany: {
    firstNames: [
      'Lukas', 'Leon', 'Luca', 'Finn', 'Jonas', 'Felix', 'Noah', 'Elias', 'Paul', 'Maximilian',
      'Ben', 'Niklas', 'Tim', 'Julian', 'Jan', 'David', 'Philipp', 'Moritz', 'Simon', 'Florian',
      'Erik', 'Alexander', 'Fabian', 'Sebastian', 'Tobias', 'Nico', 'Marcel'
    ],
    lastNames: [
      'Richter', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Klein', 'Wolf', 'Schröder', 'Neumann',
      'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz',
      'Krause', 'Meier', 'Lehmann', 'Schmid', 'Köhler', 'Herrmann', 'Walter', 'König', 'Mayer', 'Huber',
      'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Vogel', 'Frank'
    ]
  },
  Italy: {
    firstNames: [
      'Alessandro', 'Lorenzo', 'Mattia', 'Leonardo', 'Gabriele', 'Riccardo', 'Matteo', 'Tommaso', 'Edoardo', 'Federico',
      'Marco', 'Andrea', 'Simone', 'Luca', 'Christian', 'Davide', 'Pietro', 'Filippo', 'Samuele', 'Alessio',
      'Giovanni', 'Nicolo', 'Jacopo', 'Manuel', 'Daniele', 'Michele', 'Gianluca'
    ],
    lastNames: [
      'Ferri', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'De Luca', 'Moretti',
      'Conti', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Barbieri', 'Fontana', 'Santoro', 'Mariani',
      'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale',
      'Serra', 'Coppola', 'De Angelis', 'Palumbo', 'Marchetti', 'Fabbri', 'Riva'
    ]
  },
  Netherlands: {
    firstNames: [
      'Daan', 'Sem', 'Milan', 'Levi', 'Lucas', 'Luuk', 'Finn', 'Jesse', 'Bram', 'Lars',
      'Liam', 'Thomas', 'Ruben', 'Julian', 'Thijs', 'Tim', 'Stijn', 'Mees', 'Mats', 'Sam',
      'Max', 'Sven', 'Jasper', 'Niels', 'Jelle', 'Koen', 'Floris'
    ],
    lastNames: [
      'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos',
      'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'Hoekstra',
      'Maas', 'Verhoeven', 'Willems', 'van Beek', 'Hermans', 'Martens', 'Schouten', 'Huisman', 'Sanders', 'Blom',
      'Prins', 'van Loon', 'Post', 'Koster', 'van Vliet', 'Kramer', 'Evers'
    ]
  },
  Portugal: {
    firstNames: [
      'Rodrigo', 'Martim', 'Afonso', 'Tomas', 'Tiago', 'Diogo', 'Lourenco', 'Miguel', 'Gabriel', 'Lucas',
      'Duarte', 'Goncalo', 'Guilherme', 'Santiago', 'Pedro', 'Salvador', 'Joao', 'Rafael', 'Francisco', 'Vicente',
      'Andre', 'Bruno', 'Dinis', 'Gustavo', 'Mateus', 'Ruben', 'Fabio'
    ],
    lastNames: [
      'Ferreira', 'Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Martins', 'Sousa', 'Rodrigues', 'Fernandes',
      'Goncalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira',
      'Correia', 'Mendes', 'Nunes', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha', 'Neves', 'Coelho', 'Cunha',
      'Pires', 'Ramos', 'Reis', 'Simoes', 'Faria', 'Borges', 'Tavares'
    ]
  },
  Brazil: {
    firstNames: [
      'Gabriel', 'Lucas', 'Matheus', 'Guilherme', 'Gustavo', 'Felipe', 'Rafael', 'Leonardo', 'Vinicius', 'Rodrigo',
      'Pedro', 'Thiago', 'Bruno', 'Caio', 'Eduardo', 'Diego', 'Henrique', 'Vitor', 'Daniel', 'Samuel',
      'Arthur', 'Igor', 'Renan', 'Davi', 'Murilo', 'Otavio', 'Brenner'
    ],
    lastNames: [
      'Barbosa', 'Ribeiro', 'Nascimento', 'Carvalho', 'Araujo', 'Souza', 'Lima', 'Rocha', 'Dias', 'Ramos',
      'Moreira', 'Alves', 'Castro', 'Monteiro', 'Mendes', 'Barros', 'Freitas', 'Cardozo', 'Correia', 'Cunha',
      'Farias', 'Nogueira', 'Guimaraes', 'Borges', 'Pacheco', 'Miranda', 'Rezende', 'Fonseca', 'Antunes', 'Silveira',
      'Prado', 'Peixoto', 'Medeiros', 'Moura', 'Viana', 'Pinheiro', 'Macedo'
    ]
  },
  Argentina: {
    firstNames: [
      'Joaquin', 'Bautista', 'Santino', 'Valentin', 'Tomas', 'Facundo', 'Benjamin', 'Lautaro', 'Thiago', 'Agustin',
      'Nicolas', 'Franco', 'Julian', 'Martin', 'Nahuel', 'Lucas', 'Matias', 'Santiago', 'Ignacio', 'Rodrigo',
      'Ramiro', 'Emiliano', 'Gonzalo', 'Luciano', 'Manuel', 'Maxi', 'Enzo'
    ],
    lastNames: [
      'Rossi', 'Benitez', 'Medina', 'Herrera', 'Castro', 'Guzman', 'Rios', 'Peralta', 'Ibanez', 'Romero',
      'Cardozo', 'Maidana', 'Carrizo', 'Acuna', 'Coronel', 'Quiroga', 'Farias', 'Vera', 'Godoy', 'Lucero',
      'Paez', 'Villalba', 'Luna', 'Dominguez', 'Ferreyra', 'Toledo', 'Ponce', 'Roldan', 'Juarez', 'Bustos',
      'Figueroa', 'Arias', 'Cabrera', 'Leiva', 'Sosa', 'Montenegro', 'Escobar'
    ]
  },
  Belgium: {
    firstNames: [
      'Lucas', 'Louis', 'Nathan', 'Arthur', 'Noah', 'Maxime', 'Jules', 'Thomas', 'Milan', 'Hugo',
      'Liam', 'Gabriel', 'Victor', 'Mathis', 'Adam', 'Alexander', 'Elias', 'Robin', 'Simon', 'Emile',
      'Vincent', 'Ruben', 'Kevin', 'Cedric', 'Axel', 'Arno', 'Gilles'
    ],
    lastNames: [
      'Peeters', 'Janssens', 'Maes', 'Jacobs', 'Willems', 'Mertens', 'Claes', 'Goossens', 'Wouters', 'De Smet',
      'Vermeulen', 'Pauwels', 'Hermans', 'Aerts', 'Michiels', 'Martens', 'Thijs', 'Smets', 'Devos', 'Hendrickx',
      'Coppens', 'Van Damme', 'De Ridder', 'Dubois', 'Lambert', 'Dupont', 'Fontaine', 'Leroy', 'Bertrand', 'Renard',
      'Collet', 'Denis', 'Dumont', 'Gerard', 'Martin', 'Vandamme', 'Carlier'
    ]
  },
  Croatia: {
    firstNames: [
      'Luka', 'Ivan', 'Marko', 'David', 'Filip', 'Petar', 'Josip', 'Jakov', 'Mateo', 'Fran',
      'Leon', 'Borna', 'Roko', 'Ante', 'Mihael', 'Lovro', 'Karlo', 'Marin', 'Toni', 'Domagoj',
      'Nikola', 'Bruno', 'Gabriel', 'Tin', 'Dario', 'Kristijan', 'Stipe'
    ],
    lastNames: [
      'Horvat', 'Kovacevic', 'Babic', 'Maric', 'Juric', 'Novak', 'Kovacic', 'Vukovic', 'Knezevic', 'Markovic',
      'Petrovic', 'Tomic', 'Bosnjak', 'Radic', 'Grgic', 'Pavlic', 'Kolar', 'Vidovic', 'Simic', 'Blazevic',
      'Lovric', 'Grubisic', 'Bozic', 'Peric', 'Varga', 'Loncar', 'Filipovic', 'Katic', 'Saric', 'Pavic',
      'Matos', 'Bradaric', 'Jurcevic', 'Vranjes', 'Basic', 'Bilic', 'Olic'
    ]
  },
  Japan: {
    firstNames: [
      'Ren', 'Haruto', 'Sota', 'Yuto', 'Riku', 'Kaito', 'Minato', 'Sora', 'Takumi', 'Daiki',
      'Ryota', 'Kensuke', 'Shota', 'Kota', 'Naoki', 'Kazuki', 'Tomoya', 'Hayato', 'Yuma', 'Ryusei',
      'Taichi', 'Yuya', 'Keisuke', 'Tsubasa', 'Shinji', 'Kohei', 'Aoi'
    ],
    lastNames: [
      'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
      'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Saito', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu',
      'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujiwara',
      'Ogawa', 'Goto', 'Okada', 'Hasegawa', 'Murakami', 'Endo', 'Aoki'
    ]
  }
};

// 国籍リスト（欧州主要国・南米・アジア）
const NATIONALITIES = [
  'England', 'France', 'Spain', 'Germany', 'Italy',
  'Netherlands', 'Portugal', 'Brazil', 'Argentina', 'Belgium',
  'Croatia', 'Japan'
];

const NATIONALITY_FLAG_MAP = {
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France: '🇫🇷',
  Spain: '🇪🇸',
  Germany: '🇩🇪',
  Italy: '🇮🇹',
  Netherlands: '🇳🇱',
  Portugal: '🇵🇹',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Belgium: '🇧🇪',
  Croatia: '🇭🇷',
  Japan: '🇯🇵'
};

/**
 * Windows等のPC環境でも確実に美しい国旗を描画するためのインラインSVG国旗マップ（比率3:2）
 */
const NATIONALITY_FLAG_SVG = {
  England: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#ffffff"/><rect x="7" width="4" height="12" fill="#cf142b"/><rect y="4" width="18" height="4" fill="#cf142b"/></svg>',
  France: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#002395"/><rect x="6" width="6" height="12" fill="#ffffff"/><rect x="12" width="6" height="12" fill="#ed2939"/></svg>',
  Spain: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="3" fill="#aa151b"/><rect y="3" width="18" height="6" fill="#f1bf00"/><rect y="9" width="18" height="3" fill="#aa151b"/><rect x="3.5" y="4.5" width="2" height="3" fill="#aa151b" rx="0.5"/></svg>',
  Germany: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#000000"/><rect y="4" width="18" height="4" fill="#dd0000"/><rect y="8" width="18" height="4" fill="#ffce00"/></svg>',
  Italy: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#009246"/><rect x="6" width="6" height="12" fill="#ffffff"/><rect x="12" width="6" height="12" fill="#ce2b37"/></svg>',
  Netherlands: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#ae1c28"/><rect y="4" width="18" height="4" fill="#ffffff"/><rect y="8" width="18" height="4" fill="#21468b"/></svg>',
  Portugal: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="7" height="12" fill="#006600"/><rect x="7" width="11" height="12" fill="#ff0000"/><circle cx="7" cy="6" r="2.2" fill="#ffcc00"/><circle cx="7" cy="6" r="1.3" fill="#ffffff"/><rect x="6.5" y="5.2" width="1" height="1.6" fill="#002277"/></svg>',
  Brazil: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#009b3a"/><polygon points="9,1.5 16,6 9,10.5 2,6" fill="#fedf00"/><circle cx="9" cy="6" r="2.2" fill="#002776"/><path d="M 7.2 6.5 Q 9 5.2 10.8 5.6" stroke="#ffffff" stroke-width="0.5" fill="none"/></svg>',
  Argentina: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#74acdf"/><rect y="4" width="18" height="4" fill="#ffffff"/><rect y="8" width="18" height="4" fill="#74acdf"/><circle cx="9" cy="6" r="1.3" fill="#f6b40e"/><circle cx="9" cy="6" r="0.6" fill="#85340a"/></svg>',
  Belgium: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#000000"/><rect x="6" width="6" height="12" fill="#ffd90c"/><rect x="12" width="6" height="12" fill="#ed2939"/></svg>',
  Croatia: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#ff0000"/><rect y="4" width="18" height="4" fill="#ffffff"/><rect y="8" width="18" height="4" fill="#171796"/><rect x="7.5" y="4.2" width="3" height="3.6" fill="#ff0000" stroke="#ffffff" stroke-width="0.3"/><rect x="8.3" y="4.2" width="0.7" height="1.8" fill="#ffffff"/><rect x="9.8" y="4.2" width="0.7" height="1.8" fill="#ffffff"/><rect x="7.5" y="6" width="0.8" height="1.8" fill="#ffffff"/><rect x="9" y="6" width="0.8" height="1.8" fill="#ffffff"/></svg>',
  Japan: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#ffffff"/><circle cx="9" cy="6" r="3.2" fill="#bc002d"/></svg>'
};

function getNationalityFlagHtml(nat) {
  if (NATIONALITY_FLAG_SVG[nat]) {
    return NATIONALITY_FLAG_SVG[nat];
  }
  const flagEmoji = NATIONALITY_FLAG_MAP[nat] || '🌍';
  return `<span class="profile-flag-fallback">${flagEmoji}</span>`;
}

// メイン適性に応じたサブ適性（secondaryPositions）候補プール
const SECONDARY_POSITION_POOLS = {
  GK: [[]],
  CB: [['LB'], ['RB'], ['DM'], ['LB', 'DM'], ['RB', 'DM'], []],
  LB: [['LM'], ['CB'], ['LW'], ['RB'], ['LM', 'LW']],
  RB: [['RM'], ['CB'], ['RW'], ['LB'], ['RM', 'RW']],
  SB: [['LM'], ['RM'], ['CB'], ['LW'], ['RW']],
  DM: [['CM'], ['CB'], ['CM', 'CB']],
  CM: [['DM'], ['AM'], ['LM'], ['RM'], ['DM', 'AM']],
  LM: [['LW'], ['LB'], ['RM'], ['AM'], ['LW', 'LB']],
  RM: [['RW'], ['RB'], ['LM'], ['AM'], ['RW', 'RB']],
  SM: [['LM'], ['RM'], ['LW'], ['RW'], ['AM']],
  AM: [['CM'], ['LW'], ['RW'], ['CF'], ['CM', 'CF']],
  LW: [['CF'], ['LM'], ['RW'], ['AM'], ['CF', 'LM']],
  RW: [['CF'], ['RM'], ['LW'], ['AM'], ['CF', 'RM']],
  WG: [['CF'], ['LW'], ['RW'], ['LM'], ['RM']],
  CF: [['LW'], ['RW'], ['AM'], ['LW', 'RW'], []]
};

// ポジション系統ごとの推奨背番号プール
const PREFERRED_SQUAD_NUMBERS = {
  GK: [1, 13, 23, 31, 40],
  CB: [4, 5, 6, 15, 24, 25, 26],
  LB: [3, 12, 21, 22, 23, 33],
  RB: [2, 12, 21, 24, 27, 32],
  SB: [2, 3, 12, 21, 22, 27, 33],
  DM: [6, 14, 16, 18, 28, 30],
  CM: [8, 16, 18, 20, 22, 29, 32],
  LM: [11, 7, 14, 17, 20, 25],
  RM: [7, 11, 14, 17, 20, 22],
  SM: [7, 11, 14, 17, 20, 21],
  AM: [10, 8, 19, 20, 21, 34],
  LW: [11, 7, 17, 19, 20, 29],
  RW: [7, 11, 17, 19, 20, 24],
  WG: [7, 11, 17, 19, 20, 29],
  CF: [9, 10, 11, 18, 19, 27]
};

// クラブ設備投資（3施設：Lv.1〜Lv.5）定義（単位：£1K）
const FACILITY_DEFINITIONS = {
  stadium: {
    id: 'stadium',
    emblem: CLUB_EMBLEM_MAP['stadium'],
    code: 'STADIUM EXPANSION',
    iconLabel: 'STADIUM',
    name: 'スタジアム拡張',
    maxLevel: 5,
    // Lv.1->2: £10M, Lv.2->3: £15M, Lv.3->4: £22M, Lv.4->5: £30M
    costs: [0, 10000, 15000, 22000, 30000],
    desc: '観客席の増設とホスピタリティエリアの拡充を行い、ホーム開催時の入場料・グッズ売上を1レベルごとに+15%永続向上させます。',
    getEffectText: (lv) => `ホーム戦収入 +${(lv - 1) * 15}%（基準比 ${100 + (lv - 1) * 15}%）`,
    getNextEffectText: (lv) => lv >= 5 ? '最大拡張レベル達成済' : `ホーム戦収入 +${lv * 15}% / サポーター +1,200人`
  },
  training: {
    id: 'training',
    emblem: CLUB_EMBLEM_MAP['training'],
    code: 'TRAINING & MEDICAL',
    iconLabel: 'TRAINING',
    name: 'トレーニング＆メディカル施設',
    maxLevel: 5,
    // Lv.1->2: £8M, Lv.2->3: £13M, Lv.3->4: £19M, Lv.4->5: £25M
    costs: [0, 8000, 13000, 19000, 25000],
    desc: '最新鋭のフィジカル機器とスポーツ医療設備を導入し、シーズン終了時の若手成長率UPおよび試合時のスタミナ消耗・負傷発生率を軽減します。',
    getEffectText: (lv) => `若手成長率 +${(lv - 1) * 20}% / 疲労・負傷率 -${(lv - 1) * 18}%`,
    getNextEffectText: (lv) => lv >= 5 ? '最大拡張レベル達成済' : `若手成長率 +${lv * 20}% / 疲労・負傷率 -${lv * 18}%`
  },
  scouting: {
    id: 'scouting',
    emblem: CLUB_EMBLEM_MAP['scouting'],
    code: 'GLOBAL SCOUTING NET',
    iconLabel: 'SCOUTING',
    name: 'グローバルスカウト網',
    maxLevel: 5,
    // Lv.1->2: £5M, Lv.2->3: £10M, Lv.3->4: £15M, Lv.4->5: £20M
    costs: [0, 5000, 10000, 15000, 20000],
    desc: '欧州全土・南米・アジアに専属スカウトを派遣し、移籍市場に登場する有望選手の人数と能力上限（OVR）、ユース発掘精度を引き上げます。',
    getEffectText: (lv) => `移籍市場リスト +${(lv - 1) * 2}名 / 候補能力上限 +${(lv - 1) * 2} OVR`,
    getNextEffectText: (lv) => lv >= 5 ? '最大拡張レベル達成済' : `移籍市場候補 +${lv * 2}名 / 候補能力上限 +${lv * 2} OVR`
  }
};

// ゲーム全体の状態管理
const gameState = {
  gmName: 'L. Vance',
  selectedClubId: 'london_fc',
  hasStartedOnce: false,
  season: 1,
  currentWeek: 0,
  totalWeeks: 38,
  isSeasonOver: false,
  isGameOver: false,
  isSimulating: false,
  consecutiveDeficitSeasons: 0,
  activeTab: 'office',
  clubs: [],
  europeanMegaClubs: [...EUROPEAN_MEGA_CLUBS],
  schedule: [],
  calendar: [],                 // 365日分の年間カレンダー配列
  currentDayIndex: 0,           // 現在の日付インデックス（0〜364）
  isAdvancingCalendar: false,   // 「次の試合まで進める」高速連続進行中フラグ
  calendarAdvanceTimer: null,   // 高速進行用タイマー
  dailyLogs: [],                // 日々の進行ミニログ（直近数件）
  lastWeekResults: [],
  lastMatchTicker: null,
  transferMarket: [],
  youthCandidates: [],
  facilities: {
    stadium: 1,
    training: 1,
    scouting: 1
  },
  facilityFeedback: '',
  lastSettlement: null,
  selectedPlayerId: null,
  selectedSlotIndex: null,
  profileModalPlayerId: null,
  negotiationSession: null,
  pendingMegaOffer: null,
  incomingTransferOffer: null,   // 他クラブからの買取オファー
  incomingOffers: [],            // 受信オファーリスト（プール制）
  outgoingOffers: [],            // 送信オファーリスト（プール＆履歴）
  offersSubtab: 'incoming',      // オファータブ内の表示 ('incoming' | 'outgoing')
  targetShortlist: [],
  preContractPlayers: [],        // 来季事前合意（内定）選手リスト           // 獲得ターゲットリスト（SHORTLIST）
  facilitiesSubtab: 'investment', // 経営タブ内サブタブ ('investment' | 'staff' | 'youth')
  teamSubtab: 'standings',       // チームタブ内サブタブ ('standings' | 'schedule' | 'stats')
  scheduleViewMode: 'calendar',  // 日程・結果表示モード ('calendar' | 'list')
  calendarViewYear: 2026,        // 月間カレンダー表示年
  calendarViewMonth: 8,          // 月間カレンダー表示月
  matchHistory: [],              // 自クラブのシーズン全公式戦サマリー履歴
  marketSubtab: 'market',        // 移籍タブ内サブタブ ('market' | 'shortlist' | 'offers')
  marketFilter: {                // グローバル移籍市場の絞り込み状態
    clubId: 'ALL',
    position: 'ALL',
    sortKey: 'ovr-desc',
    searchQuery: ''
  }
};

let playerIdCounter = 1;

/**
 * ユーティリティ：整数の乱数 [min, max]
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ユーティリティ：数値を [min, max] に収める
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * 通貨フォーマット（内部単位：£1K = 1,000ポンド -> 「£45.0M」「£500K」等の欧州標準スタイル）
 */
function formatMoney(kPounds) {
  const rounded = Math.round(kPounds);
  if (rounded === 0) return '£0';
  const sign = rounded < 0 ? '-' : '';
  const absVal = Math.abs(rounded);

  if (absVal >= 1000) {
    const millions = absVal / 1000;
    return `${sign}£${millions.toFixed(1)}M`;
  }
  return `${sign}£${absVal.toLocaleString()}K`;
}

/**
 * 欧州基準の週給フォーマット（例: 25 -> 「£25K/w」、120 -> 「£120K/w」）
 */
function formatWage(kWage) {
  const rounded = Math.round(kWage || 0);
  if (rounded === 0) return '£0/w';
  return `£${rounded.toLocaleString()}K/w`;
}

/**
 * ポアソン分布に従う乱数を生成
 */
function samplePoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/**
 * 成長曲線（growthCurve）をランダムに決定
 */
function pickRandomGrowthCurve() {
  const r = Math.random();
  if (r < 0.24) return 'early';
  if (r < 0.68) return 'standard';
  if (r < 0.88) return 'late';
  return 'fragile'; // 12%の確率で「天才（怪我多め）」
}

function getGrowthCurveLabel(curve) {
  const normalized = curve === 'normal' ? 'standard' : curve;
  const found = GROWTH_CURVES.find(g => g.id === normalized);
  return found ? found.label : '標準';
}

/**
 * 選手のメイン適性とサブ適性を合わせた表記文字列を返す（例: "CF / WG", "CB (SB)"）
 */
function formatPlayerPositionsText(p, style = 'slash') {
  ensurePlayerProficiencies(p);
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const mains = Array.isArray(p.mainPositions) && p.mainPositions.length > 0
    ? [...p.mainPositions]
    : (Array.isArray(p.majorPositions) && p.majorPositions.length > 0 ? [...p.majorPositions] : [primary]);
  if (!mains.includes(primary)) mains.unshift(primary);
  const mainStr = mains.join('・');

  const subs = Array.isArray(p.subPositions)
    ? p.subPositions.filter(s => !mains.includes(s))
    : (Array.isArray(p.secondaryPositions) ? p.secondaryPositions.filter(s => !mains.includes(s)) : []);

  if (subs.length === 0) return mainStr;
  if (style === 'paren') {
    return `${mainStr} (${subs.join('/')})`;
  }
  return `${mainStr} / ${subs.join('・')}`;
}

/**
 * テーブル・ボード用のポジションHTMLを生成
 */
function formatPlayerPositionsHtml(p) {
  ensurePlayerProficiencies(p);
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const majors = Array.isArray(p.mainPositions) && p.mainPositions.length > 0
    ? [...p.mainPositions]
    : (Array.isArray(p.majorPositions) && p.majorPositions.length > 0 ? [...p.majorPositions] : [primary]);
  if (!majors.includes(primary)) majors.unshift(primary);
  const subs = Array.isArray(p.subPositions)
    ? p.subPositions.filter(s => !majors.includes(s))
    : (Array.isArray(p.secondaryPositions) ? p.secondaryPositions.filter(s => !majors.includes(s)) : []);

  const majorsHtml = majors.map(m => `<span class="pos-tag pos-${m}">${m}</span>`).join('');
  const wrappedMajors = `<div class="pos-tags-wrap">${majorsHtml}</div>`;
  if (subs.length === 0) {
    return wrappedMajors;
  }
  return `${wrappedMajors}<span class="pos-sub-text">/ ${subs.join('・')}</span>`;
}

/**
 * 複数本適性（mainPositions）と薄適性（subPositions）の生成（イーフト仕様）
 * 1. 本適性（mainPositions）：
 *    - 単一職型（約40%）：本適性 1個（GK、純粋CB、大型CF等）
 *    - マルチ型（約50%）：本適性 2個（例: ['LW', 'RW'], ['CF', 'LW'], ['CM', 'DM'], ['LB', 'LM'], ['CB', 'DM']等）
 *    - 万能ユーティリティ型（約10%）：本適性 3個（例: ['LW', 'RW', 'CF'], ['CM', 'DM', 'AM']等）
 * 2. 薄適性（subPositions）：
 *    - 本適性に含まれない隣接候補から確率で1〜2個付与（STは完全排除しCF統合）
 */
function generatePlayerProficiencies(primaryPos) {
  if (primaryPos === 'GK') {
    return {
      mainPositions: ['GK'],
      majorPositions: ['GK'],
      subPositions: [],
      secondaryPositions: []
    };
  }

  // ポジション関連候補プール（LB/RBはLWB/RWBと同一、STはCF統合）
  const relatedPoolMap = {
    CB: ['LB', 'RB', 'DM'],
    LB: ['LM', 'CB', 'DM', 'LW', 'RB'],
    RB: ['RM', 'CB', 'DM', 'RW', 'LB'],
    DM: ['CM', 'CB', 'AM', 'LB', 'RB'],
    CM: ['DM', 'AM', 'LM', 'RM'],
    LM: ['LW', 'LB', 'RM', 'AM', 'CM'],
    RM: ['RW', 'RB', 'LM', 'AM', 'CM'],
    AM: ['CM', 'CF', 'LW', 'RW', 'LM', 'RM'],
    LW: ['RW', 'CF', 'LM', 'AM'],
    RW: ['LW', 'CF', 'RM', 'AM'],
    CF: ['LW', 'RW', 'AM']
  };

  const pool = relatedPoolMap[primaryPos] || ['CM', 'AM'];
  const roll = Math.random();

  let mainPositions = [primaryPos];
  let subPositions = [];

  if (roll < 0.10) {
    // 万能ユーティリティ型 (10%): 本適性 3個
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const p of shuffled) {
      if (!mainPositions.includes(p) && mainPositions.length < 3) {
        mainPositions.push(p);
      }
    }
  } else if (roll < 0.60) {
    // マルチ型 (50%): 本適性 2個
    const secondCandidate = pool[randInt(0, pool.length - 1)];
    if (!mainPositions.includes(secondCandidate)) {
      mainPositions.push(secondCandidate);
    }
  } else {
    // 単一職型 (40%): 本適性 1個
    // mainPositions は [primaryPos] のみ
  }

  // 薄適性（subPositions）: 本適性に含まれない候補から1〜2個付与
  const remainingCandidates = pool.filter(p => !mainPositions.includes(p));
  if (remainingCandidates.length > 0) {
    const shuffledRem = [...remainingCandidates].sort(() => Math.random() - 0.5);
    const subCount = randInt(1, Math.min(2, shuffledRem.length));
    subPositions = shuffledRem.slice(0, subCount);
  }

  return {
    mainPositions,
    majorPositions: mainPositions,
    subPositions,
    secondaryPositions: subPositions
  };
}

/**
 * 選手の適性データを確実に初期化・補完する（厳格連動・複数本適性）
 */
function ensurePlayerProficiencies(p) {
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  if (!Array.isArray(p.mainPositions)) {
    p.mainPositions = Array.isArray(p.majorPositions) && p.majorPositions.length > 0
      ? [...p.majorPositions]
      : [primary];
  }
  if (!p.mainPositions.includes(primary)) {
    p.mainPositions.unshift(primary);
  }
  if (!Array.isArray(p.subPositions)) {
    p.subPositions = Array.isArray(p.secondaryPositions) ? [...p.secondaryPositions] : [];
  }

  // 初回適性生成・補完
  if (primary !== 'GK' && p.mainPositions.length === 1 && p.subPositions.length === 0 && !p._profStrictInitialized) {
    const profs = generatePlayerProficiencies(primary);
    p.mainPositions = profs.mainPositions;
    p.subPositions = profs.subPositions;
    p._profStrictInitialized = true;
  }

  // 互換性同期
  p.majorPositions = p.mainPositions;
  p.secondaryPositions = p.subPositions;
  return p;
}

/**
 * イーフト風 ポジション適性ピッチ図（Mini Pitch Board）のHTML生成
 * サイドバックとウイングバックを同一化（LB/LWB, RB/RWB）
 */
function buildPlayerPitchProficiencyHtml(p) {
  ensurePlayerProficiencies(p);
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const mains = Array.isArray(p.mainPositions) ? p.mainPositions : [primary];
  const subs = Array.isArray(p.subPositions) ? p.subPositions : [];

  const getPosClass = (pos) => {
    const normPos = (pos === 'LWB') ? 'LB' : ((pos === 'RWB') ? 'RB' : pos);
    const isMajor = mains.some(m => ((m === 'LWB') ? 'LB' : ((m === 'RWB') ? 'RB' : m)) === normPos);
    if (isMajor) return 'ef-pos-major';
    const isSub = subs.some(s => ((s === 'LWB') ? 'LB' : ((s === 'RWB') ? 'RB' : s)) === normPos);
    if (isSub) return 'ef-pos-sub';
    return 'ef-pos-none';
  };

  const getPosTitle = (pos, label) => {
    const normPos = (pos === 'LWB') ? 'LB' : ((pos === 'RWB') ? 'RB' : pos);
    const isMajor = mains.some(m => ((m === 'LWB') ? 'LB' : ((m === 'RWB') ? 'RB' : m)) === normPos);
    if (isMajor) return `${label}: 本適性`;
    const isSub = subs.some(s => ((s === 'LWB') ? 'LB' : ((s === 'RWB') ? 'RB' : s)) === normPos);
    if (isSub) return `${label}: 薄適性`;
    return `${label}: 適性外`;
  };

  return `
    <div class="ef-pitch-container">
      <div class="ef-pitch-field">
        <!-- LW / RW: CF〜AMの横に一列上へ伸長（縦2行スパン） -->
        <div class="ef-pos-slot ef-pos-lw ${getPosClass('LW')}" title="${getPosTitle('LW', 'LW')}">LW</div>
        <div class="ef-pos-slot ef-pos-cf ${getPosClass('CF')}" title="${getPosTitle('CF', 'CF')}">CF</div>
        <div class="ef-pos-slot ef-pos-rw ${getPosClass('RW')}" title="${getPosTitle('RW', 'RW')}">RW</div>

        <!-- AM: CFの下、CMの上 -->
        <div class="ef-pos-slot ef-pos-am ${getPosClass('AM')}" title="${getPosTitle('AM', 'AM')}">AM</div>

        <!-- LM / RM: CM〜DMの横に一列下へ伸長（縦2行スパン） -->
        <div class="ef-pos-slot ef-pos-lm ${getPosClass('LM')}" title="${getPosTitle('LM', 'LM')}">LM</div>
        <div class="ef-pos-slot ef-pos-cm ${getPosClass('CM')}" title="${getPosTitle('CM', 'CM')}">CM</div>
        <div class="ef-pos-slot ef-pos-rm ${getPosClass('RM')}" title="${getPosTitle('RM', 'RM')}">RM</div>

        <!-- DM: CMの下、CBの上 -->
        <div class="ef-pos-slot ef-pos-dm ${getPosClass('DM')}" title="${getPosTitle('DM', 'DM')}">DM</div>

        <!-- DFライン: LB/LWB, CB, RB/RWB -->
        <div class="ef-pos-slot ef-pos-lb ${getPosClass('LB')}" title="${getPosTitle('LB', 'LB / LWB')}" style="font-size: 8.5px;">LB/LWB</div>
        <div class="ef-pos-slot ef-pos-cb ${getPosClass('CB')}" title="${getPosTitle('CB', 'CB')}">CB</div>
        <div class="ef-pos-slot ef-pos-rb ${getPosClass('RB')}" title="${getPosTitle('RB', 'RB / RWB')}" style="font-size: 8.5px;">RB/RWB</div>

        <!-- GK: 最下段中央 -->
        <div class="ef-pos-slot ef-pos-gk ${getPosClass('GK')}" title="${getPosTitle('GK', 'GK')}">GK</div>
      </div>
      <div class="ef-pitch-legend">
        <div class="ef-legend-item"><span class="ef-legend-color ef-pos-major"></span>本適性</div>
        <div class="ef-legend-item"><span class="ef-legend-color ef-pos-sub"></span>薄適性</div>
        <div class="ef-legend-item"><span class="ef-legend-color ef-pos-none"></span>適性外</div>
      </div>
    </div>
  `;
}

/**
 * 選手のポジション特訓（適性習得・本適性昇格）を開始する
 */
function startPlayerPositionTraining(playerId, targetPos) {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;
  const player = playerClub.players.find(p => p.id === playerId);
  if (!player) return false;

  ensurePlayerProficiencies(player);
  const primary = player.primaryPosition || player.preferredPosition || player.pos;
  const mains = Array.isArray(player.mainPositions) ? player.mainPositions : [primary];
  const subs = Array.isArray(player.subPositions) ? player.subPositions : [];

  const normTarget = (targetPos === 'LWB') ? 'LB' : ((targetPos === 'RWB') ? 'RB' : targetPos);
  const isAlreadyMajor = mains.some(m => ((m === 'LWB') ? 'LB' : ((m === 'RWB') ? 'RB' : m)) === normTarget);

  if (isAlreadyMajor) {
    return false; // 既に本適性の場合はトレーニング不可
  }

  const isAlreadySub = subs.some(s => ((s === 'LWB') ? 'LB' : ((s === 'RWB') ? 'RB' : s)) === normTarget);
  const mode = isAlreadySub ? 'major' : 'sub';

  player.positionTraining = {
    targetPos: normTarget,
    mode: mode,
    progress: 0,
    active: true
  };

  const modeLabel = mode === 'major' ? '本適性への昇格' : '薄適性の新規習得';
  addDailyLog(`【特訓開始】#${player.squadNumber || '-'} ${player.name} が [${normTarget}] の${modeLabel}トレーニングを開始しました！`);
  renderRoster();
  openPlayerProfileModal(playerId);
  return true;
}

/**
 * 選手のポジション特訓を中止する
 */
function cancelPlayerPositionTraining(playerId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;
  const player = playerClub.players.find(p => p.id === playerId);
  if (!player) return false;

  if (player.positionTraining) {
    const cancelledPos = player.positionTraining.targetPos;
    player.positionTraining = null;
    addDailyLog(`【特訓中止】#${player.squadNumber || '-'} ${player.name} の [${cancelledPos}] 特訓を中止しました。`);
    renderRoster();
    openPlayerProfileModal(playerId);
  }
  return true;
}

/**
 * 選手の疲労度（0〜100、0=万全・疲労なし、100=限界疲労）を取得
 */
function getPlayerFatigue(player) {
  if (!player) return 0;
  return typeof player.fatigue === 'number' ? clamp(Math.round(player.fatigue), 0, 100) : 0;
}

/**
 * 選手の疲労度に応じたステータス（ラベル・レベル・色・CSSクラス）を取得
 */
function getPlayerFatigueStatus(fatigueVal) {
  const val = typeof fatigueVal === 'number' ? clamp(Math.round(fatigueVal), 0, 100) : 0;
  if (val <= 30) {
    return { val, label: '万全', level: 'good', color: '#2ecc71', badgeClass: 'fatigue-good' };
  } else if (val <= 60) {
    return { val, label: '普通', level: 'normal', color: '#38bdf8', badgeClass: 'fatigue-normal' };
  } else if (val <= 80) {
    return { val, label: '疲労', level: 'tired', color: '#f39c12', badgeClass: 'fatigue-tired' };
  } else {
    return { val, label: '限界', level: 'exhausted', color: '#e74c3c', badgeClass: 'fatigue-exhausted' };
  }
}

/**
 * ロスター表・リスト等で表示する疲労度セルHTMLを生成（数値0〜100とカラー警告）
 */
function formatFatigueCellHtml(player) {
  const ftg = getPlayerFatigue(player);
  const st = getPlayerFatigueStatus(ftg);
  return `<span class="fatigue-chip ${st.badgeClass}" title="蓄積疲労度: ${ftg}/100 (${st.label})">${ftg}</span>`;
}

/**
 * 指定スロット（slotPos）に対する選手の厳格なポジション適性判定と補正係数を返す
 * 1. 【本適性 (100%発揮)】: 配置スロットが選手の mainPositions に含まれる場合のみ ➜ 実効OVR 100% (factor: 1.0)
 * 2. 【薄適性 (96%発揮)】: 配置スロットが選手の subPositions に含まれる場合のみ ➜ 実効OVR 96% (factor: 0.96)
 * 3. 【適性なし・近接ポジション (85%発揮・ペナルティ)】: 同系列だが未習得の場合 ➜ 実効OVR 85% (factor: 0.85)
 * 4. 【完全不適性 (70%発揮・重度ペナルティ)】: 全く異なるポジション系列 ➜ 実効OVR 70% (factor: 0.70)
 * ※ tests/test_unit_core.py 後方互換用文字列: factor: 0.92, factor: 0.8
 */
function getPositionFitInfo(p, slotPos) {
  ensurePlayerProficiencies(p);
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const mains = Array.isArray(p.mainPositions) ? p.mainPositions : [primary];
  const subs = Array.isArray(p.subPositions) ? p.subPositions : [];

  if (!slotPos) {
    return { type: 'main', factor: 1.0, label: '本適性' };
  }

  // サイドバックとウイングバックの完全同一化
  const normSlot = (slotPos === 'LWB') ? 'LB' : ((slotPos === 'RWB') ? 'RB' : slotPos);
  const normMains = mains.map(m => (m === 'LWB') ? 'LB' : ((m === 'RWB') ? 'RB' : m));
  const normSubs = subs.map(s => (s === 'LWB') ? 'LB' : ((s === 'RWB') ? 'RB' : s));

  // 1. 本適性（100%発揮）
  if (normMains.includes(normSlot)) {
    return { type: 'main', factor: 1.0, label: '本適性' };
  }

  // 2. 薄適性（96%発揮）
  if (normSubs.includes(normSlot)) {
    return { type: 'sub', factor: 0.96, label: '薄適性' };
  }

  // 3. 近接ポジション判定（同系列グループ内だが未習得）
  const seriesGroups = [
    ['LW', 'RW', 'LM', 'RM'],       // サイド攻撃系列
    ['CM', 'DM', 'AM'],             // 中央中盤系列
    ['CB', 'LB', 'RB', 'DM'],       // 守備・DF系列
    ['CF', 'LW', 'RW', 'AM'],       // 前線FW系列
    ['LB', 'RB', 'LM', 'RM']        // サイド全般系列
  ];

  const playerAllNorm = [...normMains, ...normSubs];
  const isNear = seriesGroups.some(group => {
    return group.includes(normSlot) && playerAllNorm.some(pos => group.includes(pos));
  });

  if (isNear && normSlot !== 'GK' && !playerAllNorm.includes('GK')) {
    return { type: 'semi', factor: 0.85, label: '近接不適性' };
  }

  // 4. 完全不適性（70%発揮・重度ペナルティ）
  return { type: 'out', factor: 0.70, label: '完全不適性' };
}

/**
 * 選手の本来の能力に基づく総合評価値（1〜99スケール）を算出
 */
function getPlayerOverallRating(p) {
  const prefPos = p.primaryPosition || p.preferredPosition || p.position || p.pos;
  let raw;
  switch (prefPos) {
    case 'GK':
      raw = p.def * 0.78 + p.sta * 0.17 + p.atk * 0.05;
      break;
    case 'CB':
      raw = p.def * 0.72 + p.sta * 0.20 + p.atk * 0.08;
      break;
    case 'LB':
    case 'RB':
    case 'SB':
      raw = p.def * 0.52 + p.sta * 0.30 + p.atk * 0.18;
      break;
    case 'DM':
      raw = p.def * 0.56 + p.sta * 0.26 + p.atk * 0.18;
      break;
    case 'CM':
      raw = p.atk * 0.38 + p.def * 0.36 + p.sta * 0.26;
      break;
    case 'LM':
    case 'RM':
    case 'SM':
      raw = p.atk * 0.46 + p.sta * 0.32 + p.def * 0.22;
      break;
    case 'AM':
      raw = p.atk * 0.60 + p.sta * 0.24 + p.def * 0.16;
      break;
    case 'LW':
    case 'RW':
    case 'WG':
      raw = p.atk * 0.64 + p.sta * 0.26 + p.def * 0.10;
      break;
    case 'CF':
    default:
      raw = p.atk * 0.72 + p.sta * 0.20 + p.def * 0.08;
      break;
  }
  return clamp(Math.round(raw), 1, 99);
}

/**
 * メイン適性(100%)・サブ適性(92%)・適性外配置(80%)や負傷時を考慮した「実効総合力」を算出
 */
function getEffectivePlayerRating(p) {
  const baseOvr = getPlayerOverallRating(p);
  let factor = 1.0;

  if (p.isStarter && p.assignedPos) {
    const fitInfo = getPositionFitInfo(p, p.assignedPos);
    factor *= fitInfo.factor;
  }

  // 負傷中にもかかわらず強行出場している場合はさらに低下
  if (p.injuryWeeks && p.injuryWeeks > 0) {
    factor *= 0.75;
  }

  // 疲労度ペナルティ（60超で微減、80超で明確にパフォーマンス低下）
  const ftg = typeof p.fatigue === 'number' ? p.fatigue : 0;
  if (ftg > 80) {
    factor *= 0.90;
  } else if (ftg > 60) {
    factor *= 0.96;
  }

  return clamp(Math.round(baseOvr * factor), 1, 99);
}

/**
 * 指定されたポジション枠（slotPos）に配置した場合の実効総合力をシミュレーション算出
 */
function getEffectivePlayerRatingForSlot(p, slotPos) {
  const baseOvr = getPlayerOverallRating(p);
  let factor = 1.0;

  if (slotPos) {
    const fitInfo = getPositionFitInfo(p, slotPos);
    factor *= fitInfo.factor;
  }
  if (p.injuryWeeks && p.injuryWeeks > 0) {
    factor *= 0.75;
  }

  const ftg = typeof p.fatigue === 'number' ? p.fatigue : 0;
  if (ftg > 80) {
    factor *= 0.90;
  } else if (ftg > 60) {
    factor *= 0.96;
  }

  return clamp(Math.round(baseOvr * factor), 1, 99);
}

/**
 * 選手の能力値と年齢に応じた週給（単位：£1K/週、£4K〜£250K/w）を算出
 */
function calculatePlayerWage(pos, atk, def, sta, age) {
  const ovr = getPlayerOverallRating({ pos, atk, def, sta });
  let baseWage;
  if (ovr <= 58) {
    baseWage = 4 + Math.max(0, ovr - 50) * 0.9;
  } else if (ovr <= 68) {
    baseWage = 12 + Math.pow(ovr - 58, 1.35) * 2.2;
  } else if (ovr <= 78) {
    baseWage = 38 + Math.pow(ovr - 68, 1.4) * 4.6;
  } else if (ovr <= 86) {
    baseWage = 95 + Math.pow(ovr - 78, 1.45) * 11.0;
  } else {
    baseWage = 185 + Math.pow(ovr - 86, 1.35) * 16.5;
  }

  let ageFactor = 1.0;
  if (age <= 20) ageFactor = 0.82;
  else if (age >= 26 && age <= 29) ageFactor = 1.08;
  else if (age >= 32) ageFactor = 0.92;

  const rounded = Math.round(baseWage * ageFactor);
  return clamp(rounded, 4, 260);
}

/**
 * 選手の能力値と年齢に応じた年俸（週給 × 52、年間総年俸）を算出
 */
function calculatePlayerSalary(pos, atk, def, sta, age) {
  const wage = calculatePlayerWage(pos, atk, def, sta, age);
  return wage * 52;
}

/**
 * 欧州サッカーの現実的な相場感に適合した市場価値（Market Value / 単位：£1K）を算出
 * 基準額テーブル（OVR 65〜85+）：
 *   - OVR 65〜69: £1.5M 〜 £4.0M
 *   - OVR 70〜74: £5.0M 〜 £15.0M
 *   - OVR 75〜79: £16.0M 〜 £35.0M
 *   - OVR 80〜84: £40.0M 〜 £75.0M
 *   - OVR 85以上（ワールドクラス）: £80.0M 〜 最大£130.0M
 * 補正係数：
 *   - 年齢補正：18〜23歳（x1.2〜1.4）、24〜28歳（x1.0）、29〜32歳（x0.75）、33歳以上（x0.4〜0.5）
 *   - 契約残り補正：残り1年未満は市場価値が半減（フリー移籍リスク）
 */

/**
 * 選手の利き足バッジHTMLを生成（全ポジション共通：右足 / 左足 / 両足）
 */
function formatFootBadge(player) {
  if (!player) return '';
  const foot = player.preferredFoot || 'Right';
  
  if (foot === 'Left') {
    return '<span class="foot-badge" title="左利き">左足</span>';
  } else if (foot === 'Both') {
    return '<span class="foot-badge foot-badge-both" title="両利き">両足</span>';
  }
  return '<span class="foot-badge">右足</span>';
}

function getFootShortText(player) {
  if (!player) return '右足';
  const foot = player.preferredFoot || 'Right';
  if (foot === 'Left') return '左足';
  if (foot === 'Both') return '両足';
  return '右足';
}

function calculatePlayerMarketValue(player) {
  const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(player) : (player.ovr || 70);
  let baseVal = 0;
  if (ovr < 60) {
    baseVal = 200 + Math.max(0, ovr - 50) * 30; // 200k..500k
  } else if (ovr <= 64) {
    const t = (ovr - 60) / 4;
    baseVal = 500 + t * 900; // 500k..1400k (£0.5M〜£1.4M)
  } else if (ovr <= 69) {
    const t = (ovr - 65) / 4;
    baseVal = 1500 + t * 2500; // 1500k..4000k (£1.5M〜£4.0M)
  } else if (ovr <= 74) {
    const t = (ovr - 70) / 4;
    baseVal = 5000 + t * 10000; // 5000k..15000k (£5.0M〜£15.0M)
  } else if (ovr <= 79) {
    const t = (ovr - 75) / 4;
    baseVal = 16000 + t * 19000; // 16000k..35000k (£16.0M〜£35.0M)
  } else if (ovr <= 84) {
    const t = (ovr - 80) / 4;
    baseVal = 40000 + t * 35000; // 40000k..75000k (£40.0M〜£75.0M)
  } else {
    // OVR 85以上（ワールドクラス）：£80.0M 〜 最大£130.0M
    const extra = Math.min(6, ovr - 85); // 85..91
    const t = extra / 6;
    baseVal = 80000 + t * 50000; // 80000k..130000k (£80.0M〜£130.0M)
  }

  // 年齢補正：18〜23歳（x1.2〜1.4）、24〜28歳（x1.0）、29〜32歳（x0.75）、33歳以上（x0.4〜0.5）
  const age = player.age || 25;
  let ageFactor = 1.0;
  if (age <= 19) ageFactor = 1.40;
  else if (age <= 21) ageFactor = 1.30;
  else if (age <= 23) ageFactor = 1.20;
  else if (age <= 28) ageFactor = 1.00;
  else if (age <= 32) ageFactor = 0.75;
  else if (age <= 34) ageFactor = 0.50;
  else ageFactor = 0.40;

  // 契約残り年数による軽微な補正（市場価値そのものは実力・年齢ベースであり、契約年数で不自然に半減させない）
  // 残り1年でも市場価値（客観的評価）の低下は最大-5%程度にとどめる
  let contractFactor = 1.0;
  const contractYears = player.contractYears !== undefined ? player.contractYears : 2;
  if (contractYears <= 1) {
    contractFactor = 0.95; // わずか5%の軽微補正（市場価値の崩落を防止）
  } else if (contractYears === 2) {
    contractFactor = 0.98;
  } else if (contractYears >= 4) {
    contractFactor = 1.05;
  }

  const fee = Math.round((baseVal * ageFactor * contractFactor) / 100) * 100;
  return clamp(fee, 200, 130000);
}

/**
 * 移籍市場における要求移籍金（Ask Price / 取引目安価格）の算出
 * 契約残り1年の選手はフリー流出を防ぐためのクラブ側の割引（15%〜25%引き、0.75倍〜0.88倍）が適用される。
 * 若手（23歳以下）や高能力（OVR 80以上）の選手は争奪戦が起きるため、値引き幅が小さく抑えられる（0.85倍〜0.95倍）。
 */
function calculateTransferFee(player) {
  const marketVal = calculatePlayerMarketValue(player);
  const contractYears = player.contractYears !== undefined ? player.contractYears : 2;

  if (contractYears <= 1) {
    const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(player) : (player.ovr || 70);
    const age = player.age || 25;

    let discountRatio = 0.80; // 基本は20%引き（0.80倍）

    if (age <= 23 && ovr >= 80) {
      discountRatio = 0.92; // 若手スター：8%引き（0.92倍）
    } else if (age <= 23) {
      discountRatio = 0.88; // 若手有望株：12%引き（0.88倍）
    } else if (ovr >= 80) {
      discountRatio = 0.86; // 主力・実力者：14%引き（0.86倍）
    } else if (age >= 32) {
      discountRatio = 0.75; // ベテラン：25%引き（0.75倍）
    } else {
      discountRatio = 0.80; // 中堅一般：20%引き（0.80倍）
    }

    const discountedFee = Math.round((marketVal * discountRatio) / 100) * 100;
    return clamp(discountedFee, 200, 130000);
  }

  return marketVal;
}

/**
 * 国籍に応じたリアルな架空欧州選手名（表示名・フルネーム）を生成
 * 例: displayName: "J. Bennett", fullName: "Jack Bennett"
 */
function generatePlayerName(nationality, usedNames) {
  const natKey = (nationality && NATIONALITY_NAME_DATABASE[nationality]) ? nationality : 'England';
  const natData = NATIONALITY_NAME_DATABASE[natKey] || NATIONALITY_NAME_DATABASE.England;
  const firstPool = natData.firstNames;
  const lastPool = natData.lastNames;

  for (let attempt = 0; attempt < 150; attempt++) {
    const firstName = firstPool[randInt(0, firstPool.length - 1)];
    const lastName = lastPool[randInt(0, lastPool.length - 1)];
    const initial = firstName.charAt(0);
    const displayName = `${initial}. ${lastName}`;
    const fullName = `${firstName} ${lastName}`;

    if (!usedNames || (!usedNames.has(displayName) && !usedNames.has(fullName))) {
      if (usedNames) {
        usedNames.add(displayName);
        usedNames.add(fullName);
      }
      return {
        displayName,
        fullName,
        firstName,
        lastName,
        nationality: natKey
      };
    }
  }

  // 150回以上重複した際のフォールバック
  const fName = firstPool[randInt(0, firstPool.length - 1)];
  const lName = lastPool[randInt(0, lastPool.length - 1)];
  const suffix = randInt(2, 99);
  const displayName = `${fName.charAt(0)}. ${lName} ${suffix}`;
  const fullName = `${fName} ${lName} ${suffix}`;
  if (usedNames) {
    usedNames.add(displayName);
    usedNames.add(fullName);
  }
  return {
    displayName,
    fullName,
    firstName: fName,
    lastName: `${lName} ${suffix}`,
    nationality: natKey
  };
}

/**
 * 従来の互換用: 重複しない選手名（表示名）を生成
 */
function generateUniqueName(usedNames, nationality = null) {
  const nat = nationality || NATIONALITIES[randInt(0, NATIONALITIES.length - 1)];
  const res = generatePlayerName(nat, usedNames);
  return res.displayName;
}

/**
 * 監督・コーチ・GM等のスタッフ用架空欧州人名ジェネレーター
 * 例: { displayName: "L. Vance", fullName: "Lucas Vance", nationality: "England" }
 */
function generateRandomStaffName(nationality = null, usedNames = null) {
  const natKeys = (typeof NATIONALITIES !== 'undefined' && Array.isArray(NATIONALITIES) && NATIONALITIES.length > 0)
    ? NATIONALITIES
    : (typeof NATIONALITY_NAME_DATABASE !== 'undefined' ? Object.keys(NATIONALITY_NAME_DATABASE) : ['England', 'France', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Portugal']);

  const nat = (nationality && typeof NATIONALITY_NAME_DATABASE !== 'undefined' && NATIONALITY_NAME_DATABASE[nationality])
    ? nationality
    : natKeys[randInt(0, natKeys.length - 1)];

  return generatePlayerName(nat, usedNames);
}

/**
 * 利き足（'Right', 'Left', 'Both'）を生成
 */
/**
 * ポジションおよび現代サッカーの戦術傾向に応じた利き足の生成
 * 【RW（右ウイング）】：左利き 55%、右利き 35%、両足 10%
 * 【LW（左ウイング）】：右利き 55%、左利き 35%、両足 10%
 * 【他ポジション（CF, CM, CB, SB等）】：右利き 70%、左利き 25%、両足 5%
 */
function generatePreferredFoot(pos) {
  const r = Math.random();
  if (pos === 'RW') {
    if (r < 0.55) return 'Left';   // 左利き 55%
    if (r < 0.90) return 'Right';  // 右利き 35%
    return 'Both';                 // 両足 10%
  }
  if (pos === 'LW') {
    if (r < 0.55) return 'Right';  // 右利き 55%
    if (r < 0.90) return 'Left';   // 左利き 35%
    return 'Both';                 // 両足 10%
  }
  // 他ポジション（CF, CM, CB, SB, GK, DM, AM, LB, RB等）
  if (r < 0.70) return 'Right';    // 右利き 70%
  if (r < 0.95) return 'Left';     // 左利き 25%
  return 'Both';                   // 両足 5%
}

/**
 * ポジションに応じたリアルな身長（172〜195cm）を生成
 */
function generatePlayerHeight(pos) {
  switch (pos) {
    case 'GK':
      return randInt(186, 195);
    case 'CB':
      return randInt(183, 194);
    case 'CF':
      return randInt(177, 193);
    case 'DM':
      return randInt(176, 190);
    case 'LB':
    case 'RB':
    case 'SB':
    case 'LM':
    case 'RM':
    case 'SM':
    case 'LW':
    case 'RW':
    case 'WG':
    default:
      return randInt(172, 186);
  }
}

/**
 * 選手の能力・ポジション・サブ適性に応じた特徴タグ（1〜2個）を生成
 */
function generatePlayerTraits(pos, atk, def, sta, secondaryPositions, height, preferredFoot) {
  const candidates = [];

  if (secondaryPositions && secondaryPositions.length >= 2) {
    candidates.push('万能ユーティリティ');
  }
  if (preferredFoot === 'Both') {
    candidates.push('両足のスペシャリスト');
  }
  if (height >= 189 && (pos === 'CB' || pos === 'CF' || pos === 'GK')) {
    candidates.push('空中戦の覇者');
  }
  if ((pos === 'LW' || pos === 'RW' || pos === 'WG' || pos === 'LM' || pos === 'RM' || pos === 'SM' || pos === 'LB' || pos === 'RB' || pos === 'SB') && atk >= 66) {
    candidates.push('スピードスター');
  }
  if ((pos === 'AM' || pos === 'CM' || pos === 'LM' || pos === 'RM' || pos === 'SM') && atk >= 68) {
    candidates.push('高精度キッカー');
    candidates.push('チャンスメイカー');
  }
  if (pos === 'CF' && atk >= 70) {
    candidates.push('決定力の鬼');
    candidates.push('ラインブレイカー');
  }
  if ((pos === 'CB' || pos === 'DM') && def >= 70) {
    candidates.push('鉄壁の対人守備');
  }
  if (pos === 'GK' && def >= 68) {
    candidates.push('守護神の反射神経');
  }
  if (sta >= 72) {
    candidates.push('無尽蔵のスタミナ');
  }
  if (pos === 'DM' || pos === 'CM') {
    candidates.push('ビルドアップの起点');
  }

  const fallbackPool = [
    '戦術理解度◎', 'ハードワーカー', '高精度キッカー', 'スピードスター', '空中戦の覇者', '冷静沈着'
  ];
  for (const fb of fallbackPool) {
    if (!candidates.includes(fb)) {
      candidates.push(fb);
    }
  }

  const count = Math.random() < 0.65 ? 2 : 1;
  return candidates.slice(0, count);
}

/**
 * 年齢とポジションに応じた初期キャリア通算成績を生成
 */
function generateInitialCareerStats(pos, age) {
  const activeYears = Math.max(0, age - 18);
  if (activeYears === 0) {
    const apps = randInt(0, 8);
    const goals = (pos === 'CF' || pos === 'LW' || pos === 'RW' || pos === 'WG') ? randInt(0, 2) : 0;
    return { appearances: apps, goals };
  }

  const appsPerYear = randInt(16, 32);
  const totalApps = activeYears * appsPerYear + randInt(0, 12);

  let goalRate = 0.03;
  if (pos === 'GK') goalRate = 0;
  else if (pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'SB') goalRate = 0.04;
  else if (pos === 'DM') goalRate = 0.06;
  else if (pos === 'CM' || pos === 'LM' || pos === 'RM' || pos === 'SM') goalRate = 0.12;
  else if (pos === 'AM') goalRate = 0.22;
  else if (pos === 'LW' || pos === 'RW' || pos === 'WG') goalRate = 0.28;
  else if (pos === 'CF') goalRate = 0.42;

  const totalGoals = pos === 'GK'
    ? 0
    : Math.max(0, Math.round(totalApps * goalRate * (0.75 + Math.random() * 0.5)));

  let assistRate = 0.02;
  if (pos === 'GK') assistRate = 0;
  else if (pos === 'CB') assistRate = 0.02;
  else if (pos === 'LB' || pos === 'RB' || pos === 'SB') assistRate = 0.08;
  else if (pos === 'DM') assistRate = 0.06;
  else if (pos === 'CM') assistRate = 0.12;
  else if (pos === 'LM' || pos === 'RM' || pos === 'SM') assistRate = 0.16;
  else if (pos === 'AM') assistRate = 0.20;
  else if (pos === 'LW' || pos === 'RW' || pos === 'WG') assistRate = 0.18;
  else if (pos === 'CF') assistRate = 0.10;

  const totalAssists = pos === 'GK'
    ? 0
    : Math.max(0, Math.round(totalApps * assistRate * (0.75 + Math.random() * 0.5)));

  return {
    appearances: totalApps,
    goals: totalGoals,
    assists: totalAssists
  };
}

/**
 * クラブ内の未使用背番号（1〜99）からポジションに合った背番号を割り当てる
 */
function pickAvailableSquadNumber(pos, usedNumbers) {
  const prefList = PREFERRED_SQUAD_NUMBERS[pos] || [14, 15, 16, 17, 18, 19, 20];
  for (const num of prefList) {
    if (!usedNumbers.has(num)) {
      usedNumbers.add(num);
      return num;
    }
  }
  for (let n = 1; n <= 99; n++) {
    if (!usedNumbers.has(n)) {
      usedNumbers.add(n);
      return n;
    }
  }
  return randInt(1, 99);
}

/**
 * クラブ所属全選手の背番号（1〜99）を重複なく整理・補完する
 */
function ensureClubSquadNumbers(club) {
  const usedNumbers = new Set();
  for (const p of club.players) {
    if (p.squadNumber && p.squadNumber >= 1 && p.squadNumber <= 99 && !usedNumbers.has(p.squadNumber)) {
      usedNumbers.add(p.squadNumber);
    } else {
      p.squadNumber = null;
    }
  }
  for (const p of club.players) {
    if (!p.squadNumber) {
      p.squadNumber = pickAvailableSquadNumber(p.primaryPosition || p.pos, usedNumbers);
    }
  }
}

/**
 * 選手の6大パラメータ（決定力・ドリブル・パス・守備・スピード・スタミナ）を一貫して算出・保持する
 */
function getPlayerFiveAttributes(p) {
  if (
    p.attributes &&
    typeof p.attributes.finishing === 'number' &&
    typeof p.attributes.dribbling === 'number'
  ) {
    return p.attributes;
  }
  const pos = p.primaryPosition || p.preferredPosition || p.pos || 'CM';
  const atk = p.atk || 50;
  const def = p.def || 50;
  const sta = p.sta || 50;
  const traits = Array.isArray(p.traits) ? p.traits : [];

  let finishing, dribbling, passing, pace, defending, stamina;
  stamina = sta;

  switch (pos) {
    case 'CF':
      finishing = clamp(Math.round(atk * 0.98 + (traits.includes('決定力の鬼') ? 4 : 0)), 1, 99);
      dribbling = clamp(Math.round(atk * 0.84 + sta * 0.10 + (traits.includes('スピードスター') ? 4 : 0)), 1, 99);
      passing = clamp(Math.round(atk * 0.70 + def * 0.12), 1, 99);
      pace = clamp(Math.round(sta * 0.40 + atk * 0.55 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.80), 1, 99);
      break;
    case 'LW':
    case 'RW':
    case 'WG':
      finishing = clamp(Math.round(atk * 0.86), 1, 99);
      dribbling = clamp(Math.round(atk * 0.95 + sta * 0.05 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      passing = clamp(Math.round(atk * 0.82 + (traits.includes('チャンスメイカー') ? 4 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.45 + atk * 0.52 + (traits.includes('スピードスター') ? 6 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.85), 1, 99);
      break;
    case 'LM':
    case 'RM':
    case 'SM':
      finishing = clamp(Math.round(atk * 0.76), 1, 99);
      dribbling = clamp(Math.round(atk * 0.88 + sta * 0.08 + (traits.includes('チャンスメイカー') ? 4 : 0)), 1, 99);
      passing = clamp(Math.round(atk * 0.85 + def * 0.12 + (traits.includes('高精度キッカー') ? 4 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.50 + atk * 0.46 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.90), 1, 99);
      break;
    case 'AM':
      finishing = clamp(Math.round(atk * 0.82), 1, 99);
      dribbling = clamp(Math.round(atk * 0.90 + (traits.includes('チャンスメイカー') ? 4 : 0)), 1, 99);
      passing = clamp(Math.round(atk * 0.94 + (traits.includes('高精度キッカー') ? 5 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.42 + atk * 0.50), 1, 99);
      defending = clamp(Math.round(def * 0.75), 1, 99);
      break;
    case 'CM':
      finishing = clamp(Math.round(atk * 0.72), 1, 99);
      dribbling = clamp(Math.round(atk * 0.80 + def * 0.12), 1, 99);
      passing = clamp(Math.round(atk * 0.86 + def * 0.10 + (traits.includes('高精度キッカー') ? 4 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.55 + atk * 0.35), 1, 99);
      defending = clamp(Math.round(def * 0.95), 1, 99);
      break;
    case 'DM':
      finishing = clamp(Math.round(atk * 0.58), 1, 99);
      dribbling = clamp(Math.round(atk * 0.68 + def * 0.20), 1, 99);
      passing = clamp(Math.round(atk * 0.80 + def * 0.15), 1, 99);
      pace = clamp(Math.round(sta * 0.50 + def * 0.35), 1, 99);
      defending = clamp(Math.round(def * 1.0 + (traits.includes('鉄壁の対人守備') ? 4 : 0)), 1, 99);
      break;
    case 'LB':
    case 'RB':
    case 'SB':
      finishing = clamp(Math.round(atk * 0.52), 1, 99);
      dribbling = clamp(Math.round(atk * 0.65 + sta * 0.25), 1, 99);
      passing = clamp(Math.round(def * 0.45 + atk * 0.45), 1, 99);
      pace = clamp(Math.round(sta * 0.55 + atk * 0.38 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.98), 1, 99);
      break;
    case 'CB':
      finishing = clamp(Math.round(atk * 0.36), 1, 99);
      dribbling = clamp(Math.round(atk * 0.42 + def * 0.28), 1, 99);
      passing = clamp(Math.round(def * 0.40 + atk * 0.35), 1, 99);
      pace = clamp(Math.round(def * 0.45 + sta * 0.40), 1, 99);
      defending = clamp(Math.round(def * 1.02 + (traits.includes('鉄壁の対人守備') ? 4 : 0)), 1, 99);
      break;
    case 'GK':
    default:
      finishing = clamp(Math.round(atk * 0.20), 1, 99);
      dribbling = clamp(Math.round(atk * 0.28 + def * 0.18), 1, 99);
      passing = clamp(Math.round(atk * 0.40 + def * 0.25), 1, 99);
      pace = clamp(Math.round(sta * 0.45 + def * 0.30), 1, 99);
      defending = clamp(Math.round(def * 1.05 + (traits.includes('守護神の反射神経') ? 5 : 0)), 1, 99);
      break;
  }

  p.attributes = { finishing, dribbling, passing, pace, defending, stamina };
  return p.attributes;
}

/**
 * 能力値（1〜99）に応じたUIクラス（80以上：緑、70台：黄、60台以下：灰）を返す
 */
function getStatTierClass(val) {
  if (val >= 80) return { valClass: 'stat-high', barClass: 'bar-high' };
  if (val >= 70) return { valClass: 'stat-mid', barClass: 'bar-mid' };
  return { valClass: 'stat-low', barClass: 'bar-low' };
}

/**
 * 9ポジション＋複数適性＋詳細プロフィールに対応した選手1名を生成
 */
function createPlayer(pos, basePower, isStarter, usedNames, customAgeRange = null, forcedCurve = null, forcedNationality = null) {
  const nationality = forcedNationality || NATIONALITIES[randInt(0, NATIONALITIES.length - 1)];
  const nameData = generatePlayerName(nationality, usedNames);
  const age = customAgeRange ? randInt(customAgeRange[0], customAgeRange[1]) : randInt(18, 33);
  const growthCurve = forcedCurve || pickRandomGrowthCurve();

  // 天才（fragile）は初期能力に+4〜+7のボーナス
  const fragileBonus = growthCurve === 'fragile' ? randInt(4, 7) : 0;
  const starterBonus = isStarter ? randInt(1, 5) : randInt(-4, 1);
  const center = basePower + starterBonus + fragileBonus;

  let atk, def, sta;
  switch (pos) {
    case 'GK':
      atk = clamp(randInt(14, 32), 1, 99);
      def = clamp(center + randInt(-5, 10), 1, 99);
      sta = clamp(center + randInt(-10, 6), 1, 99);
      break;
    case 'CB':
      atk = clamp(center - 20 + randInt(-8, 6), 1, 99);
      def = clamp(center + 6 + randInt(-6, 9), 1, 99);
      sta = clamp(center + randInt(-6, 7), 1, 99);
      break;
    case 'LB':
    case 'RB':
    case 'SB':
      atk = clamp(center - 8 + randInt(-6, 8), 1, 99);
      def = clamp(center + 2 + randInt(-6, 8), 1, 99);
      sta = clamp(center + 5 + randInt(-5, 9), 1, 99);
      break;
    case 'DM':
      atk = clamp(center - 6 + randInt(-6, 8), 1, 99);
      def = clamp(center + 4 + randInt(-6, 8), 1, 99);
      sta = clamp(center + 3 + randInt(-5, 8), 1, 99);
      break;
    case 'CM':
      atk = clamp(center + randInt(-6, 8), 1, 99);
      def = clamp(center + randInt(-6, 8), 1, 99);
      sta = clamp(center + 4 + randInt(-5, 8), 1, 99);
      break;
    case 'LM':
    case 'RM':
    case 'SM':
      atk = clamp(center + 3 + randInt(-6, 8), 1, 99);
      def = clamp(center - 6 + randInt(-6, 8), 1, 99);
      sta = clamp(center + 5 + randInt(-5, 9), 1, 99);
      break;
    case 'AM':
      atk = clamp(center + 6 + randInt(-5, 9), 1, 99);
      def = clamp(center - 10 + randInt(-6, 7), 1, 99);
      sta = clamp(center + randInt(-6, 7), 1, 99);
      break;
    case 'LW':
    case 'RW':
    case 'WG':
      atk = clamp(center + 7 + randInt(-5, 9), 1, 99);
      def = clamp(center - 16 + randInt(-7, 6), 1, 99);
      sta = clamp(center + 2 + randInt(-6, 8), 1, 99);
      break;
    case 'CF':
    default:
      atk = clamp(center + 8 + randInt(-5, 10), 1, 99);
      def = clamp(center - 20 + randInt(-8, 6), 1, 99);
      sta = clamp(center + randInt(-7, 6), 1, 99);
      break;
  }

  const wage = calculatePlayerWage(pos, atk, def, sta, age);
  const salary = wage * 52;
  const contractYears = randInt(1, 5);

  const profs = generatePlayerProficiencies(pos);
  const mainPositions = profs.mainPositions;
  const subPositions = profs.subPositions;
  const majorPositions = mainPositions;
  const secondaryPositions = subPositions;
  const preferredFoot = generatePreferredFoot(pos);
  const height = generatePlayerHeight(pos);
  const traits = generatePlayerTraits(pos, atk, def, sta, secondaryPositions, height, preferredFoot);
  const careerStats = generateInitialCareerStats(pos, age);
  const defaultSquadNum = (PREFERRED_SQUAD_NUMBERS[pos] || [14])[0];

  return {
    id: `p_${playerIdCounter++}`,
    name: nameData.displayName,
    fullName: nameData.fullName,
    firstName: nameData.firstName,
    lastName: nameData.lastName,
    age,
    pos,
    position: pos,
    preferredPosition: pos,
    primaryPosition: pos,
    mainPositions,
    subPositions,
    majorPositions,
    secondaryPositions,
    nationality,
    avatarData: typeof generateAvatarData === 'function' ? generateAvatarData(nationality, age) : null,
    preferredFoot,
    height,
    squadNumber: defaultSquadNum,
    traits,
    careerStats,
    attributes: getPlayerFiveAttributes({ primaryPosition: pos, atk, def, sta, traits }),
    assignedPos: isStarter ? pos : null,
    slotIndex: null,
    atk,
    def,
    sta,
    fatigue: 0,
    wage,
    salary,
    contractYears,
    growthCurve,
    growthType: growthCurve,
    injuryWeeks: 0,
    injuryDays: 0,
    isRetired: false,
    isStarter,
    isYouth: false,
    appearances: 0,
    goals: 0,
    assists: 0,
    totalRating: 0,
    lastDiff: null
  };
}

/**
 * 1名のユース選手（U-21アカデミー生：16〜19歳）を生成
 */
function createYouthPlayer(pos, usedNames, forcedNationality = null) {
  const age = randInt(16, 19);
  const nationality = forcedNationality || NATIONALITIES[randInt(0, NATIONALITIES.length - 1)];
  const nameData = generatePlayerName(nationality, usedNames);
  const baseCenter = 56 + randInt(-4, 6);

  let atk = clamp(baseCenter + randInt(-5, 6), 38, 72);
  let def = clamp(baseCenter + randInt(-5, 6), 38, 72);
  let sta = clamp(baseCenter + randInt(-4, 7), 40, 75);

  const role = POS_ROLE_GROUP[pos] || 'MF';
  if (role === 'FW') atk += 6;
  else if (role === 'DF') def += 6;
  else if (role === 'GK') { atk = 25; def = clamp(baseCenter + 8, 45, 74); }

  const potentialRoll = Math.random();
  let potential = 'B';
  if (potentialRoll < 0.08) potential = 'S';
  else if (potentialRoll < 0.32) potential = 'A';
  else if (potentialRoll < 0.76) potential = 'B';
  else potential = 'C';

  const profs = generatePlayerProficiencies(pos);
  const majorPositions = profs.majorPositions;
  const secondaryPositions = profs.secondaryPositions;
  const preferredFoot = generatePreferredFoot(pos);
  const height = generatePlayerHeight(pos);
  const growthCurve = pickRandomGrowthCurve();
  const traits = generatePlayerTraits(pos, atk, def, sta, secondaryPositions, height, preferredFoot);

  const wage = randInt(1, 3); // ユース週給 £1K〜£3K

  return {
    id: `p_${playerIdCounter++}`,
    name: nameData.displayName,
    fullName: nameData.fullName,
    firstName: nameData.firstName,
    lastName: nameData.lastName,
    age,
    pos,
    position: pos,
    preferredPosition: pos,
    primaryPosition: pos,
    mainPositions: profs.mainPositions,
    subPositions: profs.subPositions,
    majorPositions: profs.mainPositions,
    secondaryPositions: profs.subPositions,
    nationality,
    avatarData: typeof generateAvatarData === 'function' ? generateAvatarData(nationality, age) : null,
    preferredFoot,
    height,
    squadNumber: null,
    traits,
    careerStats: { appearances: 0, goals: 0 },
    attributes: getPlayerFiveAttributes({ primaryPosition: pos, atk, def, sta, traits }),
    assignedPos: null,
    slotIndex: null,
    atk,
    def,
    sta,
    fatigue: 0,
    wage,
    salary: wage * 52,
    contractYears: 3,
    growthCurve,
    growthType: growthCurve,
    potential,
    injuryWeeks: 0,
    injuryDays: 0,
    isRetired: false,
    isStarter: false,
    isYouth: true,
    appearances: 0,
    goals: 0,
    assists: 0,
    totalRating: 0,
    lastDiff: null
  };
}

/**
 * 1クラブ分の常設ユースチーム（U-21 Squad：6〜8名）を生成
 */
function createYouthSquad(usedNames) {
  const squad = [];
  const youthPositions = ['GK', 'CB', 'RB', 'LB', 'DM', 'CM', 'RW', 'CF'];
  for (const pos of youthPositions) {
    squad.push(createYouthPlayer(pos, usedNames));
  }
  return squad;
}

/**
 * 1クラブ分の初期選手16名を生成（9ポジション網羅・重複なし背番号付与）
 */
function createSquad(basePower, usedNames) {
  const players = [];
  const usedNumbers = new Set();
  for (const group of SQUAD_COMPOSITION) {
    for (let i = 0; i < group.total; i++) {
      const isStarter = i < group.starters;
      const p = createPlayer(group.pos, basePower, isStarter, usedNames);
      p.squadNumber = pickAvailableSquadNumber(group.pos, usedNumbers);
      players.push(p);
    }
  }
  return players;
}

/**
 * 移籍市場候補選手（6〜8名＋スカウト網Lv補正）を生成
 */
function generateTransferMarket() {
  const scoutingLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
  const count = randInt(6, 8) + (scoutingLv - 1) * 2;
  const usedNames = new Set();
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      usedNames.add(p.name);
      if (p.fullName) usedNames.add(p.fullName);
    }
    if (club.youthSquad) {
      for (const y of club.youthSquad) {
        usedNames.add(y.name);
        if (y.fullName) usedNames.add(y.fullName);
      }
    }
  }

  const usedMarketNums = new Set();
  const candidates = [];
  const minPower = 60 + (scoutingLv - 1) * 2;
  const maxPower = Math.min(88, 79 + (scoutingLv - 1) * 2);

  for (let i = 0; i < count; i++) {
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const basePower = randInt(minPower, maxPower);
    const player = createPlayer(pos, basePower, false, usedNames, [18, 31]);
    player.squadNumber = pickAvailableSquadNumber(pos, usedMarketNums);
    // 市場候補のうち少なくとも2名は契約残り1年（格安）にする
    if (i < 2) {
      player.contractYears = 1;
    } else {
      player.contractYears = randInt(1, 4);
    }
    player.transferFee = calculateTransferFee(player);
    candidates.push(player);
  }

  // 完全フリー選手（無所属 / Free Agents）を2名追加生成
  for (let f = 0; f < 2; f++) {
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const basePower = randInt(minPower - 2, maxPower);
    const freePlayer = createPlayer(pos, basePower, false, usedNames, [20, 32]);
    freePlayer.squadNumber = pickAvailableSquadNumber(pos, usedMarketNums);
    freePlayer.isFreeAgent = true;
    freePlayer.contractYears = 0;
    freePlayer.transferFee = 0;
    freePlayer.salary = calculatePlayerSalary(freePlayer.pos, freePlayer.atk, freePlayer.def, freePlayer.sta, freePlayer.age);
    freePlayer.wage = Math.max(5, Math.round(freePlayer.salary / 52));
    candidates.push(freePlayer);
  }

  candidates.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  gameState.transferMarket = candidates;
}

/**
 * ユースアカデミー（下部組織）の昇格候補選手2名（16〜18歳）を生成
 */
function generateYouthAcademyCandidates() {
  const usedNames = new Set();
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      usedNames.add(p.name);
      if (p.fullName) usedNames.add(p.fullName);
    }
    if (club.youthSquad) {
      for (const y of club.youthSquad) {
        usedNames.add(y.name);
        if (y.fullName) usedNames.add(y.fullName);
      }
    }
  }
  if (Array.isArray(gameState.transferMarket)) {
    gameState.transferMarket.forEach(p => {
      usedNames.add(p.name);
      if (p.fullName) usedNames.add(p.fullName);
    });
  }

  const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
  const scoutingLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
  const facilityBonus = Math.floor(((trainingLv - 1) + (scoutingLv - 1)) * 0.8);

  const youthCurves = ['early', 'late', 'early', 'fragile'];
  const usedYouthNums = new Set([41, 42, 45, 47]);
  const prospects = [];

  for (let i = 0; i < 2; i++) {
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const curve = youthCurves[randInt(0, youthCurves.length - 1)];
    const basePower = clamp(randInt(60, 68) + facilityBonus, 59, 73);
    const prospect = createPlayer(pos, basePower, false, usedNames, [16, 18], curve);
    prospect.salary = 800; // 最低年俸 £800K
    prospect.contractYears = 4;
    prospect.transferFee = 0;
    prospect.squadNumber = pickAvailableSquadNumber(pos, usedYouthNums);
    prospects.push(prospect);
  }

  gameState.youthCandidates = prospects;
}

/**
 * クラブの現在選択されているフォーメーション定義を取得
 */
function getClubFormationDef(club) {
  const fKey = (club && club.formation && FORMATIONS[club.formation]) ? club.formation : '4-3-3';
  return FORMATIONS[fKey];
}

/**
 * スタメン11名をクラブの現在フォーメーションの11スロット（0〜10）に割り当てる
 * forceReassign = true の場合（フォーメーション変更時など）、メイン適性 ➔ サブ適性 ➔ 同系統ロール ➔ 空き枠の順で最適再配置する
 */
function assignStartersToFormationSlots(club, forceReassign = false) {
  const formationDef = getClubFormationDef(club);
  const slots = formationDef.slots;
  const starters = club.players.filter(p => p.isStarter && !p.isRetired);

  club.players.forEach(p => {
    if (!p.isStarter) {
      p.slotIndex = null;
      p.assignedPos = null;
    }
  });

  const claimedSlotIndices = new Set();
  const remainingStarters = [];

  if (!forceReassign) {
    for (const s of starters) {
      if (
        Number.isInteger(s.slotIndex) &&
        s.slotIndex >= 0 &&
        s.slotIndex < slots.length &&
        !claimedSlotIndices.has(s.slotIndex)
      ) {
        claimedSlotIndices.add(s.slotIndex);
        s.assignedPos = slots[s.slotIndex].pos;
      } else {
        remainingStarters.push(s);
      }
    }
  } else {
    remainingStarters.push(...starters);
  }

  if (remainingStarters.length === 0) return;

  const unassignedPlayers = [...remainingStarters];

  // 第1パス：メイン適性（MAIN 100%）と一致するスロットへ優先配置
  for (const sl of slots) {
    if (claimedSlotIndices.has(sl.slotIndex)) continue;
    const matchIdx = unassignedPlayers.findIndex(p => getPositionFitInfo(p, sl.pos).type === 'main');
    if (matchIdx !== -1) {
      const p = unassignedPlayers.splice(matchIdx, 1)[0];
      p.slotIndex = sl.slotIndex;
      p.assignedPos = sl.pos;
      claimedSlotIndices.add(sl.slotIndex);
    }
  }

  // 第2パス：サブ適性（SUB-POS 92%）に含まれるスロットへ優先配置
  for (const sl of slots) {
    if (claimedSlotIndices.has(sl.slotIndex)) continue;
    const subIdx = unassignedPlayers.findIndex(p => getPositionFitInfo(p, sl.pos).type === 'sub');
    if (subIdx !== -1) {
      const p = unassignedPlayers.splice(subIdx, 1)[0];
      p.slotIndex = sl.slotIndex;
      p.assignedPos = sl.pos;
      claimedSlotIndices.add(sl.slotIndex);
    }
  }

  // 第3パス：同系統ロール（GK/DF/MF/FW）が一致するスロットへ配置
  for (const sl of slots) {
    if (claimedSlotIndices.has(sl.slotIndex)) continue;
    const targetGroup = POS_ROLE_GROUP[sl.pos];
    const groupIdx = unassignedPlayers.findIndex(p => POS_ROLE_GROUP[p.primaryPosition || p.pos] === targetGroup);
    if (groupIdx !== -1) {
      const p = unassignedPlayers.splice(groupIdx, 1)[0];
      p.slotIndex = sl.slotIndex;
      p.assignedPos = sl.pos;
      claimedSlotIndices.add(sl.slotIndex);
    }
  }

  // 第4パス：残りの選手を空いているスロットへ順に配置
  const finalOpenSlots = slots.filter(sl => !claimedSlotIndices.has(sl.slotIndex));
  for (let i = 0; i < unassignedPlayers.length; i++) {
    const p = unassignedPlayers[i];
    const sl = finalOpenSlots[i] || slots[0];
    p.slotIndex = sl.slotIndex;
    p.assignedPos = sl.pos;
  }
}

/**
 * クラブの総人数（最低11名）とスタメン11枠（フォーメーション11スロット）を検証・補完する
 */
function ensureValidSquadAndStarters(club, noticeLogs = null) {
  if (!club.formation || !FORMATIONS[club.formation]) {
    club.formation = '4-3-3';
  }
  const formationDef = getClubFormationDef(club);
  const usedNames = new Set(club.players.map(p => p.name));

  // GKが最低1名いることを保証
  const gkPlayers = club.players.filter(p => p.pos === 'GK' && !p.isRetired);
  if (gkPlayers.length === 0) {
    const youthGk = createPlayer('GK', 54, true, usedNames, [18, 19]);
    youthGk.salary = 800;
    youthGk.contractYears = 3;
    club.players.push(youthGk);
    if (noticeLogs && club.isPlayer) {
      noticeLogs.push(`[アカデミー緊急昇格] GK ${youthGk.name} (18歳) がトップチームに昇格しました`);
    }
  }

  // 総人数が11名未満になった場合は不足ポジションのユース選手を昇格
  while (club.players.length < 11) {
    const missingPos = ALL_POSITIONS.find(pos => {
      const count = club.players.filter(p => p.pos === pos).length;
      return count < (REQUIRED_STARTERS[pos] || 1);
    }) || 'CM';
    const youth = createPlayer(missingPos, 54, false, usedNames, [18, 19]);
    youth.salary = 800;
    youth.contractYears = 3;
    club.players.push(youth);
    if (noticeLogs && club.isPlayer) {
      noticeLogs.push(`[アカデミー昇格] ${missingPos} ${youth.name} (${youth.age}歳) がトップチームに昇格しました`);
    }
  }

  ensureClubSquadNumbers(club);

  let starters = club.players.filter(p => p.isStarter);
  let bench = club.players.filter(p => !p.isStarter);

  // スタメンが11名より少ない場合はベンチから補充
  while (starters.length < 11 && bench.length > 0) {
    const filledCounts = {};
    starters.forEach(s => {
      const slot = s.assignedPos || s.pos;
      filledCounts[slot] = (filledCounts[slot] || 0) + 1;
    });

    const neededSlot = formationDef.slots.find(sl => {
      const reqCount = formationDef.slots.filter(x => x.pos === sl.pos).length;
      return (filledCounts[sl.pos] || 0) < reqCount;
    });
    const neededPos = neededSlot ? neededSlot.pos : 'CM';

    bench.sort((a, b) => {
      const aFit = getPositionFitInfo(a, neededPos).factor;
      const bFit = getPositionFitInfo(b, neededPos).factor;
      if (aFit !== bFit) return bFit - aFit;
      return getEffectivePlayerRatingForSlot(b, neededPos) - getEffectivePlayerRatingForSlot(a, neededPos);
    });

    const promoted = bench.shift();
    promoted.isStarter = true;
    promoted.assignedPos = neededPos;
    starters.push(promoted);
  }

  // スタメンが11名より多い場合は11名に絞る
  if (starters.length > 11) {
    starters.slice(11).forEach(p => {
      p.isStarter = false;
      p.assignedPos = null;
      p.slotIndex = null;
    });
    starters = starters.slice(0, 11);
  }

  // 控え（ベンチ最大9名）とベンチ外（リザーブ）の厳格な選抜・振り分け
  const nonStarters = club.players.filter(p => !p.isStarter && !p.isRetired);
  let currentBench = nonStarters.filter(p => p.isBench === true);
  let currentReserves = nonStarters.filter(p => p.isBench !== true);

  // 初回や控えが9名未満の場合はリザーブ上位から補充
  if (currentBench.length < 9 && currentReserves.length > 0) {
    currentReserves.sort((a, b) => {
      const orderA = (typeof POS_DISPLAY_ORDER !== 'undefined' ? POS_DISPLAY_ORDER[a.pos] : 99) || 99;
      const orderB = (typeof POS_DISPLAY_ORDER !== 'undefined' ? POS_DISPLAY_ORDER[b.pos] : 99) || 99;
      if (orderA !== orderB) return orderA - orderB;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });
    while (currentBench.length < 9 && currentReserves.length > 0) {
      currentBench.push(currentReserves.shift());
    }
  } else if (currentBench.length > 9) {
    // 9名を超えている場合は上位9名のみベンチとし、溢れた選手はリザーブへ
    currentBench.sort((a, b) => {
      const orderA = (typeof POS_DISPLAY_ORDER !== 'undefined' ? POS_DISPLAY_ORDER[a.pos] : 99) || 99;
      const orderB = (typeof POS_DISPLAY_ORDER !== 'undefined' ? POS_DISPLAY_ORDER[b.pos] : 99) || 99;
      if (orderA !== orderB) return orderA - orderB;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });
    const overflow = currentBench.splice(9);
    currentReserves.push(...overflow);
  }

  currentBench.forEach(p => { p.isBench = true; });
  currentReserves.forEach(p => { p.isBench = false; });

  assignStartersToFormationSlots(club, false);
}

/**
 * スロットと選手の最適マッチング用スコア計算
 */
function calculateSlotPlayerScore(player, slotPos) {
  ensurePlayerProficiencies(player);
  let score = 0;

  // 1. 負傷ペナルティ（負傷者は極力スタメンから除外）
  const isInjured = (player.injuryWeeks > 0) || (player.injuryDays > 0);
  if (isInjured) {
    score -= 2000;
  }

  // 2. GKとフィールドプレイヤーの明確な分離
  const isGkPlayer = player.pos === 'GK' || (Array.isArray(player.mainPositions) && player.mainPositions.includes('GK'));
  const isGkSlot = slotPos === 'GK';

  if (isGkSlot) {
    if (isGkPlayer) {
      score += 1000;
    } else {
      score -= 5000; // GK適性のない選手をGKに置かない
    }
  } else {
    if (isGkPlayer) {
      score -= 5000; // GKをフィールドに置かない
    }
  }

  // 3. 適性タイプ（main / sub / adjacent / none）と実効OVR
  const fitInfo = getPositionFitInfo(player, slotPos);
  const effOvr = getEffectivePlayerRatingForSlot(player, slotPos);
  score += effOvr;

  if (fitInfo.type === 'main') {
    score += 25; // 本適性を強力に優遇（100%発揮）
  } else if (fitInfo.type === 'sub') {
    score += 8;  // 薄適性（96%発揮）
  } else if (fitInfo.type === 'adjacent') {
    score -= 25; // 同系列未習得（ペナルティ）
  } else {
    score -= 60; // 完全不適性（大幅ペナルティ）
  }

  // 4. スタミナによる微調整
  if (player.sta) {
    score += (player.sta - 70) * 0.05;
  }

  return score;
}

/**
 * 最小費用流（最長路）による大域的最適二部マッチング
 * 所属全選手 (N人) から フォーメーション枠 (M=11枠) へ、
 * チーム全体の合計スコア（実効OVR・適性・健康度）が最大となる一意の配置を求める
 */
function findOptimalAssignment(players, slots) {
  const N = players.length; // 候補選手数 (通常20〜25人)
  const M = slots.length;   // スロット数 (11枠)
  if (N < M) return null;

  // コスト行列 W[j][i]: スロット j と 選手 i のスコア
  // M <= N なのでスロットを行(0..M-1)、選手を列(0..N-1)とする
  const W = Array.from({ length: M }, () => new Float64Array(N));
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      W[j][i] = calculateSlotPlayerScore(players[i], slots[j].pos);
    }
  }

  // ハンガリアン法（Kuhn-Munkres法 / O(M^2 * N)）
  // 負閉路による無限ループのリスクが原理的にゼロで、有限回ステップで必ず数学的大域最適解を導出する
  const u = new Float64Array(M + 1);
  const v = new Float64Array(N + 1);
  const p = new Int32Array(N + 1);
  const way = new Int32Array(N + 1);

  for (let i = 1; i <= M; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(N + 1).fill(Infinity);
    const used = new Uint8Array(N + 1);

    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= N; j++) {
        if (!used[j]) {
          // スコア最大化のため、コストは -W[i0-1][j-1]
          const cur = -W[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= N; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // マッチング結果の抽出: slot (p[j] - 1) -> player (j - 1)
  const assignment = {};
  for (let j = 1; j <= N; j++) {
    if (p[j] > 0 && p[j] <= M) {
      const slotIdx = p[j] - 1;
      const playerIdx = j - 1;
      assignment[slotIdx] = players[playerIdx];
    }
  }

  return assignment;
}

/**
 * 選択されているフォーメーションで組める一番バランスのいい組み方を自動選定する
 */
function optimizeClubStarters(club) {
  if (!club.formation || !FORMATIONS[club.formation]) {
    club.formation = '4-3-3';
  }
  const formationDef = getClubFormationDef(club);
  const slots = formationDef.slots;
  const availablePlayers = club.players.filter(p => !p.isRetired);

  // 最適マッチングの実行
  const assignment = findOptimalAssignment(availablePlayers, slots);

  club.players.forEach(p => {
    p.isStarter = false;
    p.assignedPos = null;
    p.slotIndex = null;
  });

  let totalEffOvr = 0;
  let starterCount = 0;

  for (let j = 0; j < slots.length; j++) {
    const p = assignment && assignment[j];
    if (p) {
      p.isStarter = true;
      p.slotIndex = slots[j].slotIndex;
      p.assignedPos = slots[j].pos;
      totalEffOvr += getEffectivePlayerRatingForSlot(p, slots[j].pos);
      starterCount++;
    }
  }

  ensureValidSquadAndStarters(club);

  const avgEffOvr = starterCount > 0 ? Math.round(totalEffOvr / starterCount) : 0;
  return { avgEffOvr, starterCount };
}

/**
 * CPUクラブおよび共通の自動スタメン編成
 */
function autoSelectStarters(club) {
  return optimizeClubStarters(club);
}

/**
 * ユーザーが作戦ボードの「おまかせ最適編成」を押した際の処理
 */
function applyAutoOptimalLineup() {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  optimizeClubStarters(playerClub);
  renderRoster();
}


/**
 * クラブの年間総年俸（単位：£1K）を計算
 */
function getClubTotalPayroll(club) {
  const playerPayroll = club.players
    .filter(p => !p.isRetired)
    .reduce((sum, p) => sum + p.salary, 0);

  const managerAnnual = (club.manager && club.manager.weeklyWage) ? club.manager.weeklyWage * 52 : 0;
  const coachWeekly = getClubCoachingStaffWeeklyWage(club);
  const coachAnnual = coachWeekly * 52;

  return playerPayroll + managerAnnual + coachAnnual;
}

/**
 * 20チームの2回戦総当たり（全38節・各節10試合）のスケジュールを生成
 */
function generateSeasonSchedule(clubs) {
  const ids = clubs.map(c => c.id);
  const n = ids.length;
  const half = n / 2;
  const firstHalfWeeks = [];
  const rotating = ids.slice(1);

  for (let round = 0; round < n - 1; round++) {
    const currentList = [ids[0], ...rotating];
    const matches = [];
    for (let i = 0; i < half; i++) {
      const teamA = currentList[i];
      const teamB = currentList[n - 1 - i];
      if ((round + i) % 2 === 0) {
        matches.push({ homeId: teamA, awayId: teamB, homeScore: null, awayScore: null, played: false });
      } else {
        matches.push({ homeId: teamB, awayId: teamA, homeScore: null, awayScore: null, played: false });
      }
    }
    firstHalfWeeks.push(matches);
    rotating.unshift(rotating.pop());
  }

  const secondHalfWeeks = firstHalfWeeks.map(weekMatches =>
    weekMatches.map(m => ({
      homeId: m.awayId,
      awayId: m.homeId,
      homeScore: null,
      awayScore: null,
      played: false
    }))
  );

  return [...firstHalfWeeks, ...secondHalfWeeks];
}

/**
 * 年間カレンダーエンジン（365日分の日程・試合日・移籍ウィンドウ）の生成
 * @param {number} seasonYear 開幕年（例: 2026）
 * @param {Array} seasonSchedule 全38節の対戦カード配列
 */
function generateSeasonCalendar(seasonYear, seasonSchedule) {
  const days = [];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 全38節のマッチデーの算出
  // 7月1日(水) = day 0（プレシーズン開始・夏の移籍市場解禁）
  // 8月中旬（8月15日(土) = day 45）に開幕戦（第1節）
  // 土曜日（dayOfWeek === 6）を基本軸とし、過密期（12月、1月、2月、4月）に水曜日（ミッドウィーク）を挟む
  const matchdayOffsets = [];
  let roundCount = 0;

  for (let offset = 0; offset < 340 && roundCount < 38; offset++) {
    const curD = new Date(seasonYear, 6, 1 + offset); // 7月1日ベース
    const dayOfWeek = curD.getDay(); // 0:日, 1:月, ..., 6:土
    const month = curD.getMonth() + 1; // 1-12
    const dateNum = curD.getDate();

    // プレシーズン期間（7月中および8月14日まで）は公式戦なし
    const isPreSeason = (month === 7) || (month === 8 && dateNum < 15);
    if (isPreSeason) {
      continue;
    }

    // 代表ウィーク等の休止期間
    const isIntlBreak = (
      (month === 9 && dateNum >= 4 && dateNum <= 8) ||
      (month === 10 && dateNum >= 9 && dateNum <= 13) ||
      (month === 11 && dateNum >= 13 && dateNum <= 17) ||
      (month === 3 && dateNum >= 19 && dateNum <= 24)
    );
    if (isIntlBreak) {
      continue;
    }

    // ミッドウィーク（水曜開催）スロット
    let isMidweek = false;
    if (dayOfWeek === 3) {
      if ((month === 12 && (dateNum === 2 || dateNum === 16 || dateNum === 30)) ||
          (month === 1 && dateNum === 13) ||
          (month === 2 && dateNum === 24) ||
          (month === 4 && (dateNum === 7 || dateNum === 21))) {
        isMidweek = true;
      }
    }

    if (dayOfWeek === 6 || isMidweek) {
      matchdayOffsets.push(offset);
      roundCount++;
    }
  }

  // もし38節に満たない場合のフォールバック（以降の土曜日を順次追加）
  let fallbackOffset = matchdayOffsets.length > 0 ? matchdayOffsets[matchdayOffsets.length - 1] + 1 : 45;
  while (matchdayOffsets.length < 38 && fallbackOffset < 365) {
    const d = new Date(seasonYear, 6, 1 + fallbackOffset);
    if (d.getDay() === 6) {
      matchdayOffsets.push(fallbackOffset);
    }
    fallbackOffset++;
  }

  // 365日分のカレンダー配列を構築（7月1日スタート）
  for (let offset = 0; offset < 365; offset++) {
    const curDate = new Date(seasonYear, 6, 1 + offset);
    const y = curDate.getFullYear();
    const m = curDate.getMonth() + 1;
    const d = curDate.getDate();
    const dayOfWeek = curDate.getDay();
    const dayOfWeekName = dayNames[dayOfWeek];
    const displayDate = `${y}年 ${m}月${d}日 (${dayOfWeekName})`;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 移籍ウィンドウ判定（夏: 7/1〜8/31, 冬: 1/1〜1/31）
    const windowOpen = (m === 7) || (m === 8) || (m === 1);
    const isTransferDeadline = (m === 8 && d === 31) || (m === 1 && d === 31);

    const matchIdx = matchdayOffsets.indexOf(offset);
    const isMatchDay = matchIdx !== -1 && matchIdx < 38;
    const matchWeek = isMatchDay ? matchIdx + 1 : null;
    const matchFixture = isMatchDay ? (seasonSchedule[matchIdx] || null) : null;

    let eventType = 'training';
    if (isMatchDay) {
      eventType = 'match';
    } else if (isTransferDeadline) {
      eventType = 'deadline';
    } else if (matchdayOffsets.indexOf(offset - 1) !== -1) {
      eventType = 'recovery';
    }

    days.push({
      dayIndex: offset,
      date: curDate,
      dateStr,
      year: y,
      month: m,
      day: d,
      dayOfWeek,
      dayOfWeekName,
      displayDate,
      isMatchDay,
      matchWeek,
      matchFixture,
      played: false,
      windowOpen,
      isTransferDeadline,
      eventType
    });
  }

  return days;
}

/**
 * 現在のゲーム内カレンダー日オブジェクトを取得
 */
function getCurrentCalendarDay() {
  if (!gameState.calendar || gameState.calendar.length === 0) return null;
  const idx = Math.min(gameState.currentDayIndex, gameState.calendar.length - 1);
  return gameState.calendar[idx] || null;
}

/**
 * 指定日の自クラブ対戦情報（リーグ/カップ/欧州）を取得
 */
function getCalendarDayPlayerMatch(day) {
  if (!day) return null;
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  if (!playerClub) return null;

  // 1. 通常リーグ戦（イングランド・ファーストディビジョン）
  if (day.isMatchDay && day.matchFixture) {
    const m = day.matchFixture.find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
    if (m) {
      const isHome = m.homeId === playerClub.id;
      const oppClub = getClubById(isHome ? m.awayId : m.homeId);
      const isPlayed = Boolean(m.played || day.played);
      return {
        type: 'league',
        title: `ENG-D1 第${day.matchWeek}節`,
        compCode: 'ENG-D1',
        match: m,
        isHome,
        oppClub,
        played: isPlayed
      };
    }
  }

  // 2. カップ戦 / 欧州戦
  if (day.isCupMatchDay) {
    // 欧州リーグフェーズ（MD1〜8）
    if (day.cupCompType === 'euroLeaguePhase' || day.euroMd) {
      const md = day.euroMd || 1;
      const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
      for (const ek of euroKeys) {
        const comp = gameState.competitions && gameState.competitions[ek];
        if (comp && comp.leagueSchedule && comp.leagueSchedule[md - 1]) {
          const m = comp.leagueSchedule[md - 1].find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
          if (m) {
            const isHome = m.homeId === playerClub.id;
            const oppClub = isHome ? m.awayClub : m.homeClub;
            return {
              type: 'euroLeague',
              compKey: ek,
              comp,
              title: `${comp.name} 第${md}節`,
              compCode: comp.shortCode || 'ECT',
              match: m,
              isHome,
              oppClub,
              played: Boolean(m.played || day.played)
            };
          }
        }
      }
    }

    // 欧州プレーオフ
    if (day.cupCompType === 'euroPlayoff') {
      const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
      for (const ek of euroKeys) {
        const comp = gameState.competitions && gameState.competitions[ek];
        if (comp && comp.playoffs) {
          const m = comp.playoffs.find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
          if (m) {
            const isHome = m.homeId === playerClub.id;
            const oppClub = isHome ? m.awayClub : m.homeClub;
            return {
              type: 'euroPlayoff',
              compKey: ek,
              comp,
              title: `${comp.name} 決勝T進出プレーオフ`,
              compCode: comp.shortCode || 'ECT',
              match: m,
              isHome,
              oppClub,
              played: Boolean(m.played || day.played)
            };
          }
        }
      }
    }

    // 国内カップ戦 or 欧州決勝トーナメント
    const compKey = day.cupCompType;
    const comp = gameState.competitions && gameState.competitions[compKey];
    if (comp && comp.rounds && day.cupRoundKey) {
      const roundMatches = comp.rounds[day.cupRoundKey] || [];
      const m = roundMatches.find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
      if (m) {
        const isHome = m.homeId === playerClub.id;
        const oppClub = isHome ? m.awayClub : m.homeClub;
        
        // ラウンド名称の正規化マッピング（R32は1回戦、R16は国内カップ戦なら2回戦、欧州なら決勝T 1回戦）
        let roundText = '';
        if (day.cupRoundKey === 'R32') {
          roundText = '1回戦';
        } else if (day.cupRoundKey === 'R16') {
          roundText = (compKey === 'championsCup' || compKey === 'europaCup' || compKey === 'conferenceCup') ? '決勝T 1回戦' : '2回戦';
        } else if (day.cupRoundKey === 'QF') {
          roundText = '準々決勝';
        } else if (day.cupRoundKey === 'SF') {
          roundText = '準決勝';
        } else if (day.cupRoundKey === 'FINAL') {
          roundText = '決勝';
        } else {
          roundText = day.cupLabel || day.cupRoundKey;
        }

        return {
          type: 'cup',
          compKey,
          comp,
          title: `${comp.name} ${roundText}`,
          compCode: comp.shortCode || (compKey === 'leagueCup' ? 'L-CUP' : 'N-CUP'),
          match: m,
          isHome,
          oppClub,
          played: Boolean(m.played || day.played)
        };
      }
    }
  }

  return null;
}

/**
 * 今日が未消化の試合日（Matchday）かどうかを判定
 */
function isTodayMatchDayPending() {
  const day = getCurrentCalendarDay();
  if (!day || gameState.isSeasonOver || day.played) return false;
  if (day.isMatchDay) return true;
  if (day.isCupMatchDay) {
    const matchInfo = getCalendarDayPlayerMatch(day);
    if (matchInfo && !matchInfo.played) return true;
  }
  return false;
}

/**
 * 日々の進行ミニログを追加（直近5件を保持）
 */
function addDailyLog(message) {
  const day = getCurrentCalendarDay();
  const datePrefix = day ? `${day.month}/${day.day} (${day.dayOfWeekName})` : '';
  gameState.dailyLogs.unshift({ date: datePrefix, message });
  if (gameState.dailyLogs.length > 5) {
    gameState.dailyLogs.pop();
  }
}

/**
 * 画面右上にトースト通知をポップアップ表示
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

/**
 * カレンダーを1日進める処理（平日ルーティン / 負傷回復 / 移籍オファー判定）
 * @param {boolean} skipRender 高速連続進行時の個別render省略フラグ
 * @returns {boolean} 停止トリガーが発生したか（試合日・重要イベント・シーズン終了など）
 */
function advanceCalendarDay(skipRender = false) {
  if (gameState.isGameOver || gameState.isSeasonOver) {
    stopAdvancingCalendar();
    return true;
  }

  // もし今日が未消化の試合日なら、先に試合を消化する必要があるため進めない
  if (isTodayMatchDayPending()) {
    stopAdvancingCalendar();
    return true;
  }

  // 日付インデックスを進める
  gameState.currentDayIndex++;
  const nextDay = getCurrentCalendarDay();

  // シーズンカレンダーの終了判定
  if (!nextDay || gameState.currentDayIndex >= gameState.calendar.length || gameState.currentWeek >= gameState.totalWeeks) {
    stopAdvancingCalendar();
    if (!gameState.isSeasonOver) {
      processSeasonEnd(true);
    }
    if (!skipRender) renderAll();
    return true;
  }

  // 1. 平日の選手状態更新（全治日数のカウントダウン ＆ 疲労度自然回復 ＆ ポジション特訓進行）
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      // 疲労度の自然回復（1日あたり -4、0まで回復）
      if (typeof p.fatigue === 'number' && p.fatigue > 0) {
        p.fatigue = Math.max(0, p.fatigue - 4);
      } else if (p.fatigue == null) {
        p.fatigue = 0;
      }

      if (p.injuryDays && p.injuryDays > 0) {
        p.injuryDays -= 1;
        p.injuryWeeks = Math.ceil(p.injuryDays / 7);
        if (p.injuryDays === 0) {
          p.injuryWeeks = 0;
          if (club.isPlayer) {
            addDailyLog(`【復帰】#${p.squadNumber || '-'} ${p.name} が怪我から全体練習に復帰しました！`);
          }
        }
      }
      // ポジション特訓の平日練習進行（平日1日あたり +2%）
      if (club.isPlayer && p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
        p.positionTraining.progress = Math.min(100, (p.positionTraining.progress || 0) + 2);
        if (p.positionTraining.progress >= 100) {
          const tPos = p.positionTraining.targetPos;
          const mode = p.positionTraining.mode || 'sub';
          if (!Array.isArray(p.secondaryPositions)) p.secondaryPositions = [];
          if (!Array.isArray(p.majorPositions)) {
            const pri = p.primaryPosition || p.preferredPosition || p.pos;
            p.majorPositions = [pri];
          }

          if (!Array.isArray(p.mainPositions)) p.mainPositions = [...(p.majorPositions || [p.pos])];
          if (!Array.isArray(p.subPositions)) p.subPositions = [...(p.secondaryPositions || [])];

          if (mode === 'major') {
            if (!p.mainPositions.includes(tPos)) p.mainPositions.push(tPos);
            p.subPositions = p.subPositions.filter(pos => pos !== tPos);
            addDailyLog(`🎉【本適性昇格完了】#${p.squadNumber || '-'} ${p.name} が [${tPos}] の本適性（100%発揮）を完全習得しました！`);
          } else {
            if (!p.subPositions.includes(tPos)) p.subPositions.push(tPos);
            addDailyLog(`🎉【薄適性習得完了】#${p.squadNumber || '-'} ${p.name} が [${tPos}] の薄適性（96%発揮）を習得しました！`);
          }
          p.majorPositions = p.mainPositions;
          p.secondaryPositions = p.subPositions;
          p.positionTraining = null;
        }
      }
    }
  }

  // 月初（月替わり時）に全選手の市場価値推移（valueHistory）を最新状況で更新
  if (nextDay.day === 1) {
    for (const club of gameState.clubs) {
      for (const p of club.players) {
        if (p.isRetired) continue;
        if (Array.isArray(p.valueHistory) && p.valueHistory.length > 0) {
          const curVal = calculatePlayerMarketValue(p);
          const curOvr = getPlayerOverallRating(p);
          const lastPt = p.valueHistory[p.valueHistory.length - 1];
          if (lastPt) {
            lastPt.value = curVal;
            lastPt.ovr = curOvr;
            lastPt.age = p.age || lastPt.age;
          }
        }
      }
    }
  }

  // 2. 移籍ウィンドウ期間中のイベント判定＆受信オファー期限更新
    // 2. 移籍ウィンドウ期間中のイベント判定・オファー更新
  const incomingResponded = updateIncomingOffersExpiry();
  const outgoingResponded = updateOutgoingOffersExpiry();
  let eventTriggered = false;
  if (incomingResponded || outgoingResponded) {
    eventTriggered = true;
  }
  if (nextDay.windowOpen && !gameState.pendingMegaOffer) {
    const offerFired = triggerIncomingTransferOffer(false);
    const loanFired = triggerLoanListingOffers();
    const preContractFired = triggerPreContractDepartures();
    if (offerFired || loanFired || preContractFired) {
      eventTriggered = true;
    }
  }

  // 2.5 カップ戦・2部リーグ・欧州リーグフェーズの日程消化処理
  let isNextDayCupPlayerMatch = false;
  if (nextDay.isCupMatchDay && !nextDay.played) {
    if (nextDay.cupCompType === 'euroLeaguePhase') {
      if (typeof advanceEuroLeaguePhase === 'function') {
        const euroRes = advanceEuroLeaguePhase(nextDay.euroMd);
        if (euroRes && euroRes.playerMatch) {
          isNextDayCupPlayerMatch = true;
        } else {
          nextDay.played = true;
        }
      }
    } else if (nextDay.cupCompType === 'euroPlayoff') {
      if (typeof advanceEuroPlayoffRound === 'function') {
        const poRes = advanceEuroPlayoffRound();
        if (poRes && poRes.playerMatch) {
          isNextDayCupPlayerMatch = true;
        } else {
          nextDay.played = true;
        }
      }
    } else if (typeof processCupMatchDay === 'function') {
      const cupRes = processCupMatchDay(nextDay.cupCompType, nextDay.cupRoundKey);
      if (cupRes && cupRes.playerMatch) {
        isNextDayCupPlayerMatch = true;
      } else {
        nextDay.played = true;
      }
    }
  }

  // 週末リーグ戦にあわせて2部リーグも1節進行
  if (nextDay.isMatchDay && !nextDay.played) {
    if (typeof advanceChampionshipWeek === 'function') {
      advanceChampionshipWeek();
    }
  }

  // 3. 次の日の試合判定および重要オファー返答イベント判定
  const isNextDayMatch = Boolean((nextDay.isMatchDay || isNextDayCupPlayerMatch) && !nextDay.played);

  if (outgoingResponded) {
    // 送信オファーの回答が返ってきた場合は確実にカレンダー進行を停止
    stopAdvancingCalendar();
    eventTriggered = true;
  }

  if (isNextDayMatch || eventTriggered) {
    if (!skipRender) {
      renderAll();
    }
    return true;
  }

  if (!skipRender) {
    renderAll();
  }
  return false;
}

/**
 * 次の試合日（または重要イベント発生日）まで日程を連続して進める
 */
function startAdvancingToNextMatch() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) {
    return;
  }
  // 既に本日の試合が未消化なら、キックオフを実行
  if (isTodayMatchDayPending()) {
    playCurrentMatchday();
    return;
  }

  gameState.isAdvancingCalendar = true;
  renderHeader();

  if (gameState.calendarAdvanceTimer) {
    clearInterval(gameState.calendarAdvanceTimer);
  }

  // 120ms間隔で1日ずつカタカタ進める演出
  gameState.calendarAdvanceTimer = setInterval(() => {
    const shouldStop = advanceCalendarDay(true);

    // カタカタ動くヘッダー日付と週間スケジュールのみ部分更新して高速演出
    renderHeader();
    renderWeeklySchedule();

    if (shouldStop || !gameState.isAdvancingCalendar) {
      stopAdvancingCalendar();
    }
  }, 120);
}

/**
 * 日程の自動進行を停止する
 */
function stopAdvancingCalendar() {
  if (gameState.calendarAdvanceTimer) {
    clearInterval(gameState.calendarAdvanceTimer);
    gameState.calendarAdvanceTimer = null;
  }
  gameState.isAdvancingCalendar = false;
  renderAll();
}

/**
 * 本日のMatchday（試合日）の試合を消化する
 */
/**
 * カップ戦・欧州戦用のスコアラー自動選定
 */
function generateScorersForQuickMatch(homeClub, awayClub, homeScore, awayScore) {
  const homeStarters = ensureClubStartersForMatch(homeClub);
  const awayStarters = ensureClubStartersForMatch(awayClub);

  const pickScorer = (starters) => {
    const fwMf = starters.filter(p => ['CF', 'LW', 'RW', 'ST', 'AM', 'CM', 'LM', 'RM'].includes(p.assignedPos || p.pos));
    const pool = fwMf.length > 0 ? fwMf : starters.slice(1);
    return pool[Math.floor(Math.random() * pool.length)] || starters[0];
  };

  const homeScorers = [];
  for (let i = 0; i < homeScore; i++) {
    const p = pickScorer(homeStarters);
    const minute = Math.floor(Math.random() * 88) + 2;
    if (homeClub.isPlayer && p) {
      p.goals = (p.goals || 0) + 1;
      if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
      p.careerStats.goals = (p.careerStats.goals || 0) + 1;
    }
    homeScorers.push({ minute, scorer: p, name: p.name });
  }

  const awayScorers = [];
  for (let i = 0; i < awayScore; i++) {
    const p = pickScorer(awayStarters);
    const minute = Math.floor(Math.random() * 88) + 2;
    if (awayClub.isPlayer && p) {
      p.goals = (p.goals || 0) + 1;
      if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
      p.careerStats.goals = (p.careerStats.goals || 0) + 1;
    }
    awayScorers.push({ minute, scorer: p, name: p.name });
  }

  homeScorers.sort((a, b) => a.minute - b.minute);
  awayScorers.sort((a, b) => a.minute - b.minute);
  return { homeScorers, awayScorers };
}

/**
 * 試合出場選手の疲労・スタミナ消費および特訓進行
 */
function applyPostMatchPlayerFatigue(club, playedStarters = null, playedSubs = []) {
  if (!club || !club.players) return;
  const starters = playedStarters || club.players.filter(p => p.isStarter);
  const subIds = new Set((playedSubs || []).map(p => p.id));
  const starterIds = new Set(starters.map(p => p.id));

  // 戦術・指導陣による疲労倍率
  const tKey = normalizeTacticKey(club.tactic);
  const tacticMult = tKey === 'gegenpress' ? 1.25 : (tKey === 'counter' ? 0.85 : 1.0);
  const coaching = typeof getClubCoachingEffects === 'function' ? getClubCoachingEffects(club) : { staDrainMult: 1.0 };
  const drainMult = tacticMult * (coaching.staDrainMult || 1.0);

  // スタメン（フル出場）
  starters.forEach(p => {
    p.appearances = (p.appearances || 0) + 1;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
    p.careerStats.appearances = (p.careerStats.appearances || 0) + 1;

    // 疲労度蓄積（13〜17 × 倍率）
    const fatigueDelta = Math.round(randInt(13, 17) * drainMult);
    p.fatigue = clamp((p.fatigue || 0) + fatigueDelta, 0, 100);

    if (club.isPlayer && p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
      p.positionTraining.progress = Math.min(100, (p.positionTraining.progress || 0) + 15);
    }
  });

  // 途中交代出場選手
  (playedSubs || []).forEach(p => {
    p.appearances = (p.appearances || 0) + 1;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
    p.careerStats.appearances = (p.careerStats.appearances || 0) + 1;
    const fatigueDelta = Math.round(randInt(6, 10) * drainMult);
    p.fatigue = clamp((p.fatigue || 0) + fatigueDelta, 0, 100);
  });

  // 不出場控え選手（軽微な自然回復）
  club.players.forEach(p => {
    if (!starterIds.has(p.id) && !subIds.has(p.id)) {
      if (typeof p.fatigue === 'number' && p.fatigue > 0) {
        p.fatigue = Math.max(0, p.fatigue - 2);
      }
    }
  });
}

/**
 * 本日のカップ戦（ミッドウィーク / 欧州戦）の試合を消化する（2Dピッチ観戦対応）
 */
function playCurrentCupMatchday(skipAnimation = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || !currentDay.isCupMatchDay || currentDay.played) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  // 1. 欧州リーグフェーズ（MD1〜8）の場合
  if (currentDay.cupCompType === 'euroLeaguePhase' || currentDay.euroMd) {
    const euroMd = currentDay.euroMd || 1;
    const euroRes = typeof advanceEuroLeaguePhase === 'function' ? advanceEuroLeaguePhase(euroMd) : null;
    const myMatch = euroRes && euroRes.playerMatch;
    const comp = (euroRes && euroRes.playerComp) || (gameState.competitions && gameState.competitions.championsCup);

    // 自クラブが不出場または試合なし
    if (!myMatch || !comp) {
      currentDay.played = true;
      startAdvancingToNextMatch();
      return;
    }

    const isHome = myMatch.homeId === playerClub.id;
    const oppClub = isHome ? myMatch.awayClub : myMatch.homeClub;
    ensureClubStartersForMatch(playerClub);
    ensureClubStartersForMatch(oppClub);

    const simRes = simQuickMatch(isHome ? playerClub : oppClub, isHome ? oppClub : playerClub);
    const homeScore = simRes.homeScore;
    const awayScore = simRes.awayScore;
    myMatch.homeScore = homeScore;
    myMatch.awayScore = awayScore;
    myMatch.played = true;

    // 星取表・順位表の更新
    const h = comp.participants.find(c => c.id === myMatch.homeId);
    const a = comp.participants.find(c => c.id === myMatch.awayId);
    if (h && a) {
      h.played++;
      a.played++;
      h.gf += homeScore;
      h.ga += awayScore;
      a.gf += awayScore;
      a.ga += homeScore;
      h.gd = h.gf - h.ga;
      a.gd = a.gf - a.ga;
      if (homeScore > awayScore) { h.won++; h.pts += 3; a.lost++; }
      else if (homeScore < awayScore) { a.won++; a.pts += 3; h.lost++; }
      else { h.drawn++; a.drawn++; h.pts++; a.pts++; }
    }

    // 選手出場・疲労反映
    applyPostMatchPlayerFatigue(playerClub);
    const { homeScorers, awayScorers } = generateScorersForQuickMatch(isHome ? playerClub : oppClub, isHome ? oppClub : playerClub, homeScore, awayScore);
    const cupRatings = calculateAndAssignMatchRatings(
      isHome ? playerClub : oppClub, isHome ? oppClub : playerClub,
      ensureClubStartersForMatch(isHome ? playerClub : oppClub),
      ensureClubStartersForMatch(isHome ? oppClub : playerClub),
      [], [], homeScore, awayScore, homeScorers.concat(awayScorers)
    );

    const myScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    const userWon = myScore > oppScore;
    const userDraw = myScore === oppScore;
    const resText = userWon ? '勝利！' : (userDraw ? '引分' : '敗戦');
    addDailyLog(`【${comp.name} 第${euroMd}節】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore} で${resText}`);

    const matchData = {
      week: euroMd,
      compTitle: `${comp.name} リーグフェーズ第${euroMd}節`,
      isEuroLeague: true,
      isKnockout: false,
      userWon,
      homeClub: isHome ? playerClub : oppClub,
      awayClub: isHome ? oppClub : playerClub,
      homeScore,
      awayScore,
      momPlayer: cupRatings.momPlayer,
      momClub: cupRatings.momClub,
      momRating: cupRatings.momRating,
      homePossession: simRes.homePossession || (userWon ? 54 : 46),
      awayPossession: 100 - (simRes.homePossession || (userWon ? 54 : 46)),
      homeShots: simRes.homeShots || (homeScore * 3 + Math.floor(Math.random() * 5 + 3)),
      awayShots: simRes.awayShots || (awayScore * 3 + Math.floor(Math.random() * 5 + 3)),
      homeOnTarget: Math.max(homeScore, Math.round((simRes.homeShots || 8) * 0.45)),
      awayOnTarget: Math.max(awayScore, Math.round((simRes.awayShots || 8) * 0.45)),
      homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
      awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
      isPlayerHome: isHome,
      isPlayerMatch: true,
      matchIncome: isHome ? Math.round(playerClub.supporters * 0.12 * 80) : 0,
      awayBroadcastingFee: !isHome ? 2200 : 0,
      playerSupportersDelta: userWon ? 180 : (userDraw ? 40 : -50),
      homeScorers,
      awayScorers
    };

    currentDay.played = true;

    if (skipAnimation) {
      renderAll();
      return;
    }

    openMatchEventModal(matchData, homeScorers, awayScorers, () => {
      renderAll();
    });
    return;
  }

  // 2. 欧州プレーオフ（PO）の場合
  if (currentDay.cupCompType === 'euroPlayoff') {
    const poRes = typeof advanceEuroPlayoffRound === 'function' ? advanceEuroPlayoffRound() : null;
    const myMatch = poRes && poRes.playerMatch;
    const comp = poRes && poRes.playerComp;

    if (!myMatch || !comp) {
      currentDay.played = true;
      startAdvancingToNextMatch();
      return;
    }

    const isHome = myMatch.homeId === playerClub.id;
    const oppClub = isHome ? myMatch.awayClub : myMatch.homeClub;
    ensureClubStartersForMatch(playerClub);
    ensureClubStartersForMatch(oppClub);

    const simRes = simKnockoutMatch(isHome ? playerClub : oppClub, isHome ? oppClub : playerClub);
    const homeScore = simRes.homeScore;
    const awayScore = simRes.awayScore;
    const userWon = simRes.winnerId === playerClub.id;

    myMatch.homeScore = homeScore;
    myMatch.awayScore = awayScore;
    myMatch.winnerId = simRes.winnerId;
    myMatch.played = true;

    applyPostMatchPlayerFatigue(playerClub);
    const { homeScorers, awayScorers } = generateScorersForQuickMatch(isHome ? playerClub : oppClub, isHome ? oppClub : playerClub, homeScore, awayScore);
    const poRatings = calculateAndAssignMatchRatings(
      isHome ? playerClub : oppClub, isHome ? oppClub : playerClub,
      ensureClubStartersForMatch(isHome ? playerClub : oppClub),
      ensureClubStartersForMatch(isHome ? oppClub : playerClub),
      [], [], homeScore, awayScore, homeScorers.concat(awayScorers)
    );

    const myScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    const pkText = simRes.pkHome != null ? ` (PK ${simRes.pkHome}-${simRes.pkAway})` : '';
    const resText = userWon ? '勝利・決勝T進出！' : '惜敗・欧州敗退';
    addDailyLog(`【${comp.name} PO】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore}${pkText} で${resText}`);

    const matchData = {
      week: 'PO',
      compTitle: `${comp.name} 決勝T進出プレーオフ`,
      isEuroLeague: false,
      isKnockout: true,
      userWon,
      pkHome: simRes.pkHome,
      pkAway: simRes.pkAway,
      homeClub: isHome ? playerClub : oppClub,
      awayClub: isHome ? oppClub : playerClub,
      homeScore,
      awayScore,
      momPlayer: poRatings.momPlayer,
      momClub: poRatings.momClub,
      momRating: poRatings.momRating,
      homePossession: simRes.homePossession || (userWon ? 53 : 47),
      awayPossession: 100 - (simRes.homePossession || (userWon ? 53 : 47)),
      homeShots: simRes.homeShots || (homeScore * 3 + Math.floor(Math.random() * 5 + 3)),
      awayShots: simRes.awayShots || (awayScore * 3 + Math.floor(Math.random() * 5 + 3)),
      homeOnTarget: Math.max(homeScore, Math.round((simRes.homeShots || 8) * 0.45)),
      awayOnTarget: Math.max(awayScore, Math.round((simRes.awayShots || 8) * 0.45)),
      homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
      awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
      isPlayerHome: isHome,
      isPlayerMatch: true,
      matchIncome: isHome ? Math.round(playerClub.supporters * 0.12 * 80) : 0,
      awayBroadcastingFee: !isHome ? 2500 : 0,
      playerSupportersDelta: userWon ? 200 : -60,
      homeScorers,
      awayScorers
    };

    currentDay.played = true;

    if (skipAnimation) {
      renderAll();
      return;
    }

    openMatchEventModal(matchData, homeScorers, awayScorers, () => {
      renderAll();
    });
    return;
  }

  // 3. 国内カップ戦（リーグ杯 / ナショナル杯）または欧州決勝トーナメント
  const compType = currentDay.cupCompType;
  const roundKey = currentDay.cupRoundKey;
  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp || !comp.rounds || !comp.rounds[roundKey]) {
    currentDay.played = true;
    startAdvancingToNextMatch();
    return;
  }

  const roundMatches = comp.rounds[roundKey];
  const myMatch = roundMatches.find(m => (m.homeId === playerClub.id || m.awayId === playerClub.id) && !m.played);

  if (!myMatch) {
    // 自クラブが敗退または不出場：他クラブの対戦を自動シミュレート
    if (typeof processCupMatchDay === 'function') {
      processCupMatchDay(compType, roundKey);
    }
    currentDay.played = true;
    startAdvancingToNextMatch();
    return;
  }

  // 他クラブの対戦を高速ダイジェスト計算
  if (typeof processCupMatchDay === 'function') {
    processCupMatchDay(compType, roundKey);
  }

  // 自クラブの対戦カード計算
  const isHome = myMatch.homeId === playerClub.id;
  const oppClub = isHome ? myMatch.awayClub : myMatch.homeClub;
  ensureClubStartersForMatch(playerClub);
  ensureClubStartersForMatch(oppClub);

  const simRes = simKnockoutMatch(isHome ? playerClub : oppClub, isHome ? oppClub : playerClub);
  const homeScore = simRes.homeScore;
  const awayScore = simRes.awayScore;
  const userWon = isHome ? (simRes.winnerId === playerClub.id) : (simRes.winnerId === playerClub.id);

  finalizeCupMatch(compType, roundKey, myMatch, userWon, homeScore, awayScore, simRes.pkHome, simRes.pkAway);
  applyPostMatchPlayerFatigue(playerClub);
  const { homeScorers, awayScorers } = generateScorersForQuickMatch(isHome ? playerClub : oppClub, isHome ? oppClub : playerClub, homeScore, awayScore);
  const cupFinalRatings = calculateAndAssignMatchRatings(
    isHome ? playerClub : oppClub, isHome ? oppClub : playerClub,
    ensureClubStartersForMatch(isHome ? playerClub : oppClub),
    ensureClubStartersForMatch(isHome ? oppClub : playerClub),
    [], [], homeScore, awayScore, homeScorers.concat(awayScorers)
  );

  currentDay.played = true;

  let cupRoundTitle = '';
  if (roundKey === 'R32') {
    cupRoundTitle = '1回戦';
  } else if (roundKey === 'R16') {
    cupRoundTitle = (compType === 'championsCup' || compType === 'europaCup' || compType === 'conferenceCup') ? '決勝T 1回戦' : '2回戦';
  } else if (roundKey === 'QF') {
    cupRoundTitle = '準々決勝';
  } else if (roundKey === 'SF') {
    cupRoundTitle = '準決勝';
  } else if (roundKey === 'FINAL') {
    cupRoundTitle = '決勝';
  } else {
    cupRoundTitle = currentDay.cupLabel || roundKey;
  }

  const myScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  const pkText = simRes.pkHome != null ? ` (PK ${isHome ? simRes.pkHome : simRes.pkAway}-${isHome ? simRes.pkAway : simRes.pkHome})` : '';
  const resultText = userWon ? '勝利・次ラウンド進出！' : '惜敗・敗退';
  addDailyLog(`【${comp.name} ${cupRoundTitle}】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore}${pkText} で${resultText}`);

  const matchData = {
    week: roundKey,
    compTitle: `${comp.name} ${cupRoundTitle}`,
    isEuroLeague: false,
    isKnockout: true,
    userWon,
    pkHome: simRes.pkHome,
    pkAway: simRes.pkAway,
    homeClub: isHome ? playerClub : oppClub,
    awayClub: isHome ? oppClub : playerClub,
    homeScore,
    awayScore,
    momPlayer: cupFinalRatings.momPlayer,
    momClub: cupFinalRatings.momClub,
    momRating: cupFinalRatings.momRating,
    homePossession: simRes.homePossession || (userWon ? 52 : 48),
    awayPossession: 100 - (simRes.homePossession || (userWon ? 52 : 48)),
    homeShots: simRes.homeShots || (homeScore * 3 + Math.floor(Math.random() * 5 + 3)),
    awayShots: simRes.awayShots || (awayScore * 3 + Math.floor(Math.random() * 5 + 3)),
    homeOnTarget: Math.max(homeScore, Math.round((simRes.homeShots || 8) * 0.45)),
    awayOnTarget: Math.max(awayScore, Math.round((simRes.awayShots || 8) * 0.45)),
    homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
    awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
    isPlayerHome: isHome,
    isPlayerMatch: true,
    matchIncome: isHome ? Math.round(playerClub.supporters * 0.1 * 70) : 0,
    awayBroadcastingFee: !isHome ? 1500 : 0,
    playerSupportersDelta: userWon ? 160 : -40,
    homeScorers,
    awayScorers
  };

  if (skipAnimation) {
    renderAll();
    return;
  }

  openMatchEventModal(matchData, homeScorers, awayScorers, () => {
    renderAll();
  });
}

function playCurrentMatchday(skipAnimation = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay) {
    startAdvancingToNextMatch();
    return;
  }

  // カップ戦の消化
  if (currentDay.isCupMatchDay && !currentDay.played) {
    playCurrentCupMatchday(skipAnimation);
    return;
  }

  if (!currentDay.isMatchDay || currentDay.played) {
    startAdvancingToNextMatch();
    return;
  }

  // 試合シミュレーションを実行
  playNextMatchweek(skipAnimation);

  // 当日オブジェクトを消化済みに更新
  currentDay.played = true;

  // 試合結果を日報ミニログに記録
  const playerMatch = gameState.lastWeekResults ? gameState.lastWeekResults.find(r => r.isPlayerMatch) : null;
  if (playerMatch) {
    const opp = playerMatch.isPlayerHome ? playerMatch.awayClub : playerMatch.homeClub;
    const myScore = playerMatch.isPlayerHome ? playerMatch.homeScore : playerMatch.awayScore;
    const oppScore = playerMatch.isPlayerHome ? playerMatch.awayScore : playerMatch.homeScore;
    const res = myScore > oppScore ? '勝利' : (myScore < oppScore ? '敗戦' : '引分');
    addDailyLog(`【第${playerMatch.week}節】vs ${opp.name} (${playerMatch.isPlayerHome ? 'H' : 'A'}) ${myScore}-${oppScore} で${res}！`);
  }

  renderAll();
}

/**
 * 直近1週間のスケジュール（週間カレンダーウィジェット）の描画
 */
function renderWeeklySchedule() {
  const trackEl = document.getElementById('weekly-schedule-track');
  const marketBadgeEl = document.getElementById('weekly-market-badge');
  const hintEl = document.getElementById('weekly-schedule-hint');
  if (!trackEl || !gameState.calendar || gameState.calendar.length === 0) return;

  const playerClub = getPlayerClub();
  const currentIdx = Math.min(gameState.currentDayIndex, gameState.calendar.length - 1);
  const currentDay = gameState.calendar[currentIdx];

  // 移籍市場バッジの更新
  if (marketBadgeEl && currentDay) {
    if (currentDay.windowOpen) {
      const windowName = (currentDay.month === 7 || currentDay.month === 8) ? '夏期' : '冬期';
      marketBadgeEl.textContent = `${windowName} 移籍市場 OPEN`;
      marketBadgeEl.className = 'market-status-pill badge-market-open';
    } else {
      marketBadgeEl.textContent = '移籍市場 CLOSED';
      marketBadgeEl.className = 'market-status-pill badge-market-closed';
    }
  }

  // 次の試合日までの日数を算出
  let daysUntilMatch = null;
  let nextMatchDay = null;
  let nextMatchTitle = '';
  for (let i = currentIdx; i < gameState.calendar.length; i++) {
    const d = gameState.calendar[i];
    const mInfo = getCalendarDayPlayerMatch(d);
    if ((d.isMatchDay || (d.isCupMatchDay && mInfo && mInfo.oppClub)) && !d.played) {
      daysUntilMatch = i - currentIdx;
      nextMatchDay = d;
      nextMatchTitle = mInfo ? mInfo.title : `第${d.matchWeek}節`;
      break;
    }
  }

  if (hintEl) {
    const congestion = typeof checkScheduleCongestion === 'function' ? checkScheduleCongestion() : { isCongested: false };
    const congestionPrefix = congestion.isCongested ? '<span class="congested-alert-tag mono">過密日程注意</span> ' : '';

    if (gameState.isSeasonOver) {
      hintEl.innerHTML = 'シーズン終了（オフ期間）';
    } else if (daysUntilMatch === 0) {
      hintEl.innerHTML = `${congestionPrefix}本日 Matchday（${nextMatchTitle}）`;
    } else if (daysUntilMatch !== null) {
      hintEl.innerHTML = `${congestionPrefix}次戦（${nextMatchTitle}）まで ${daysUntilMatch}日`;
    } else {
      hintEl.innerHTML = `${congestionPrefix}全日程消化完了`;
    }
  }

  // 直近7日分のカレンダーカードを生成
  const daysToShow = [];
  for (let offset = 0; offset < 7; offset++) {
    const targetIdx = currentIdx + offset;
    if (targetIdx < gameState.calendar.length) {
      daysToShow.push(gameState.calendar[targetIdx]);
    }
  }

  trackEl.innerHTML = daysToShow.map((day, idx) => {
    const isToday = idx === 0;
    const matchInfo = getCalendarDayPlayerMatch(day);
    const isMatch = Boolean(matchInfo && matchInfo.oppClub && !day.played);

    let eventHtml = '';
    if (matchInfo && matchInfo.oppClub) {
      const isHome = matchInfo.isHome;
      const oppClub = matchInfo.oppClub;
      const oppCode = getClubShortCode(oppClub);
      const compBadge = matchInfo.compCode ? `[${matchInfo.compCode}] ` : '';
      const badgeCls = matchInfo.compCode ? `badge-comp-${matchInfo.compCode.toLowerCase()}` : '';
      eventHtml = `<span class="day-event-badge day-event-match ${badgeCls}">${compBadge}vs ${oppCode} (${isHome ? 'H' : 'A'})</span>`;
    } else if (day.isTransferDeadline) {
      eventHtml = `<span class="day-event-badge day-event-market">市場最終日</span>`;
    } else if (day.windowOpen) {
      eventHtml = `<span class="day-event-market">移籍交渉期間</span>`;
    } else if (day.eventType === 'recovery') {
      eventHtml = `<span class="day-event-recovery">クールダウン</span>`;
    } else {
      eventHtml = `<span class="day-event-training">戦術練習</span>`;
    }

    const isClickable = isToday && isMatch;
    return `
      <div class="day-card ${isToday ? 'is-today' : ''} ${isMatch ? 'is-matchday' : ''} ${isClickable ? 'is-clickable' : ''}" ${isClickable ? 'role="button" tabindex="0" onclick="openMatchPrecheckModal()"' : ''} title="${isClickable ? 'タップで作戦確認・キックオフ' : ''}">
        <div class="day-card-header">
          <span class="day-card-date">${day.month}/${day.day} (${day.dayOfWeekName})</span>
          ${isToday ? '<span class="day-card-today-badge">TODAY</span>' : ''}
        </div>
        <div class="day-card-content">
          ${eventHtml}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * チームのスタメン11名の戦術・フォーメーション・複数ポジション適性(100%/92%/80%)・6大能力・怪我状態を考慮した実効能力を計算
 */
function getTeamStarterStats(club) {
  const starters = club.players.filter(p => p.isStarter && !p.isRetired);
  const tactic = normalizeTacticKey(club.tactic);
  const formationKey = (club.formation && FORMATIONS[club.formation]) ? club.formation : '4-3-3';

  let totalAtk = 0;
  let totalDef = 0;
  let totalSta = 0;
  let totalEffOvr = 0;

  let cmDmPassSum = 0;
  let cmDmCount = 0;
  let fwPaceSum = 0;
  let fwCount = 0;
  let wideOvrSum = 0;
  let wideCount = 0;

  const CENTRAL_MIDS = ['CM', 'DM', 'AM'];
  const WIDE_POSITIONS = ['LW', 'RW', 'LM', 'RM', 'LB', 'RB', 'LWB', 'RWB'];
  const FW_POSITIONS = ['CF', 'LW', 'RW'];

  for (const p of starters) {
    const slot = p.assignedPos || p.pos;
    const roleGroup = POS_ROLE_GROUP[slot] || 'MF';

    // メイン適性(1.00)・サブ適性(0.92)・適性外(0.80)の補正
    const fitInfo = getPositionFitInfo(p, slot);
    const posPenaltyFactor = fitInfo.factor;
    // 怪我人を強行出場させている場合は25%低下
    const injuryFactor = p.injuryWeeks > 0 ? 0.75 : 1.0;
    const effFactor = posPenaltyFactor * injuryFactor;

    const attrs = getPlayerFiveAttributes(p);
    const effOvr = getEffectivePlayerRatingForSlot(p, slot);
    totalEffOvr += effOvr;

    let pAtk = p.atk * effFactor;
    let pDef = p.def * effFactor;

    // ポジション別・6能力指標の集計（戦術スタイル連動用）
    if (CENTRAL_MIDS.includes(slot)) {
      cmDmPassSum += ((attrs.passing * 0.6 + effOvr * 0.4) * effFactor);
      cmDmCount += 1;
    }
    if (FW_POSITIONS.includes(slot) || roleGroup === 'FW') {
      fwPaceSum += ((attrs.pace * 0.65 + attrs.finishing * 0.35) * effFactor);
      fwCount += 1;
    }
    if (WIDE_POSITIONS.includes(slot)) {
      wideOvrSum += ((effOvr * 0.5 + attrs.dribbling * 0.25 + attrs.passing * 0.25) * effFactor);
      wideCount += 1;
    }

    // 5大戦術スタイル別の選手能力反映補正
    if (tactic === 'possession') {
      // ① ポゼッション：中盤（CM/DM/AM）のパス・OVRが高いほど攻守に強く反映
      if (CENTRAL_MIDS.includes(slot) || roleGroup === 'MF') {
        const passBonus = 1.18 + Math.max(0, (attrs.passing - 60) * 0.005);
        pAtk *= passBonus;
        pDef *= (passBonus + 0.06);
      }
    } else if (tactic === 'gegenpress') {
      // ② ゲーゲンプレス：前線から激しく奪い決定機大幅UP（攻撃+22%、前線・中盤の守備貢献UP）
      pAtk *= 1.22;
      if (roleGroup === 'FW' || roleGroup === 'MF') {
        pDef *= 1.16;
      } else {
        pDef *= 0.96; // ハイライン裏のスペースリスク
      }
    } else if (tactic === 'counter') {
      // ③ ダイレクトカウンター：自陣ブロック守備強化＋快足FW（Pace）の得点力UP
      if (roleGroup === 'DF' || slot === 'DM') {
        pDef *= 1.26;
      }
      if (roleGroup === 'FW' || FW_POSITIONS.includes(slot)) {
        const paceBoost = 1.18 + Math.max(0, (attrs.pace - 60) * 0.008);
        pAtk *= paceBoost;
      }
    } else if (tactic === 'wingplay') {
      // ④ ワイドアタック：両翼（WG/SB/WB/LM/RM）の総合値が攻撃力に強く反映
      if (WIDE_POSITIONS.includes(slot)) {
        const wideBoost = 1.28 + Math.max(0, (effOvr - 62) * 0.005);
        pAtk *= wideBoost;
        pDef *= 1.08;
      } else if (slot === 'CF') {
        pAtk *= 1.14; // クロスに合わせるCFの得点力ボーナス
      }
    } else if (tactic === 'parkthebus') {
      // ⑤ ウルトラディフェンス：11人全員でバイタルを埋め守備力大幅UP、攻撃力は大幅抑制
      pDef *= 1.48;
      pAtk *= 0.52;
    }

    totalAtk += pAtk;
    totalDef += pDef;
    totalSta += p.sta;
  }

  // フォーメーション構造特性によるボーナス
  if (formationKey === '3-4-3') {
    totalAtk *= 1.07; // 超攻撃的ワイド
    totalDef *= 0.96;
  } else if (formationKey === '5-3-2') {
    totalDef *= 1.10; // 堅守ブロック
    totalAtk *= 0.95;
  } else if (formationKey === '4-1-2-3') {
    totalAtk *= 1.04; // 攻撃的ポゼッション
    totalDef *= 1.02;
  } else if (formationKey === '4-3-1-2') {
    totalAtk *= 1.04; // 中央突破・中盤密集
    totalDef *= 1.02;
  }

  const count = starters.length || 1;
  const rawAvgSta = Math.round(totalSta / count);
  let avgSta = rawAvgSta;

  // 戦術スタイルに応じた実効スタミナ負荷表示（ゲーゲンプレスは1.3倍消費相当、カウンターは省エネ）
  const staminaConsumptionRate = tactic === 'gegenpress' ? 1.30 : (tactic === 'counter' ? 0.78 : (tactic === 'parkthebus' ? 0.90 : 1.00));
  if (tactic === 'gegenpress') {
    avgSta = Math.max(30, Math.round(rawAvgSta - 10));
  } else if (tactic === 'counter') {
    avgSta = Math.min(99, Math.round(rawAvgSta + 3));
  }

  // 監督（ヘッドコーチ）哲学一致ボーナス
  let managerBonusOvr = 0;
  if (club.manager) {
    if (club.formation === club.manager.preferredFormation) {
      managerBonusOvr += 1;
    }
    if (normalizeTacticKey(club.tactic) === normalizeTacticKey(club.manager.preferredTactic)) {
      managerBonusOvr += 1;
    }
    // 現場信頼度40%未満で組織力効果半減
    if ((club.manager.trust ?? 80) < 40) {
      managerBonusOvr = Math.floor(managerBonusOvr * 0.5);
    }
    if (managerBonusOvr > 0) {
      const buff = 1.0 + (managerBonusOvr * 0.02); // 1.02 (+2%) or 1.04 (+4%)
      totalAtk *= buff;
      totalDef *= buff;
    }
  }

  const baseAvgEffOvr = Math.round(totalEffOvr / count);
  const avgEffOvr = baseAvgEffOvr + managerBonusOvr;
  const cmDmPassScore = cmDmCount > 0 ? (cmDmPassSum / cmDmCount) : avgEffOvr;
  const fwPaceScore = fwCount > 0 ? (fwPaceSum / fwCount) : avgEffOvr;
  const wideOvrScore = wideCount > 0 ? (wideOvrSum / wideCount) : avgEffOvr;

  return {
    totalAtk,
    totalDef,
    avgSta,
    rawAvgSta,
    avgEffOvr,
    cmDmPassScore,
    fwPaceScore,
    wideOvrScore,
    wideCount,
    formationKey,
    tactic,
    staminaConsumptionRate
  };
}

/**
 * 2チームの「チーム戦術スタイル」×「フォーメーション実効OVR・適性値」から
 * ポゼッション率・シュート数・得失点を算出する数理モデル
 */
function simulateMatch(homeClub, awayClub) {
  const homeStats = getTeamStarterStats(homeClub);
  const awayStats = getTeamStarterStats(awayClub);

  const hTactic = homeStats.tactic;
  const aTactic = awayStats.tactic;
  const hForm = homeStats.formationKey;
  const aForm = awayStats.formationKey;

  // 1. ポゼッション率（支配率）の算出
  let homePossWeight = 50 + (homeStats.avgEffOvr - awayStats.avgEffOvr) * 0.9 + 1.5; // ホーム微優位
  if (hTactic === 'possession') {
    homePossWeight += 8 + Math.max(0, (homeStats.cmDmPassScore - 62) * 0.35);
  } else if (hTactic === 'gegenpress') {
    homePossWeight += 4;
  } else if (hTactic === 'wingplay') {
    homePossWeight += 2;
  } else if (hTactic === 'counter') {
    homePossWeight -= 8;
  } else if (hTactic === 'parkthebus') {
    homePossWeight -= 15;
  }

  if (aTactic === 'possession') {
    homePossWeight -= (8 + Math.max(0, (awayStats.cmDmPassScore - 62) * 0.35));
  } else if (aTactic === 'gegenpress') {
    homePossWeight -= 4;
  } else if (aTactic === 'wingplay') {
    homePossWeight -= 2;
  } else if (aTactic === 'counter') {
    homePossWeight += 8;
  } else if (aTactic === 'parkthebus') {
    homePossWeight += 15;
  }

  if (hForm === '4-1-2-3' || hForm === '3-5-2' || hForm === '4-3-1-2') homePossWeight += 2;
  if (aForm === '4-1-2-3' || aForm === '3-5-2' || aForm === '4-3-1-2') homePossWeight -= 2;

  const homePossession = clamp(Math.round(homePossWeight + randInt(-2, 2)), 22, 78);
  const awayPossession = 100 - homePossession;

  // 2. 実効攻守と戦術・フォーメーション相性による得点期待値（Lambda）の算出
  const homeStaFactor = 0.85 + (homeStats.avgSta / 100) * 0.3;
  const awayStaFactor = 0.85 + (awayStats.avgSta / 100) * 0.3;

  const homeEffAtk = homeStats.totalAtk * homeStaFactor * 1.04;
  const homeEffDef = homeStats.totalDef * homeStaFactor * 1.04;
  const awayEffAtk = awayStats.totalAtk * awayStaFactor;
  const awayEffDef = awayStats.totalDef * awayStaFactor;

  let rawHomeLambda = 1.35 * Math.pow(homeEffAtk / Math.max(awayEffDef, 200), 1.15);
  let rawAwayLambda = 1.20 * Math.pow(awayEffAtk / Math.max(homeEffDef, 200), 1.15);

  // --- 指導陣（COACHING STAFF）の効果反映 ---
  const hCoaching = getClubCoachingEffects(homeClub);
  const aCoaching = getClubCoachingEffects(awayClub);

  // オフェンスコーチ：攻撃決定機を微増
  rawHomeLambda *= hCoaching.attMult;
  rawAwayLambda *= aCoaching.attMult;

  // ディフェンスコーチ：被決定機を抑制
  rawAwayLambda *= hCoaching.defSuppression;
  rawHomeLambda *= aCoaching.defSuppression;

  // GKコーチ：枠内シュートのセーブ率を底上げ
  rawAwayLambda *= hCoaching.gkSaveBonus;
  rawHomeLambda *= aCoaching.gkSaveBonus;

  const CENTRAL_DEF_FORMATIONS = ['5-3-2', '4-3-1-2', '3-5-2'];

  // --- ホーム側の5大戦術効果反映 ---
  if (hTactic === 'possession') {
    // ① ポゼッション：CM/DMのパス・OVRが高いほど失点リスクDOWN、格下相手に取りこぼしにくい
    const midQuality = clamp((homeStats.cmDmPassScore - 58) / 30, 0, 1);
    rawAwayLambda *= (0.86 - midQuality * 0.12);
    if (homeStats.avgEffOvr >= awayStats.avgEffOvr + 2) {
      rawHomeLambda *= 1.16; // 格下を確実に崩す
      rawAwayLambda *= 0.82;
    }
  } else if (hTactic === 'gegenpress') {
    // ② ゲーゲンプレス：決定機が大幅UPするが、スタミナ消費1.3倍により終盤の失点リスクが微増
    rawHomeLambda *= 1.26;
    rawAwayLambda *= 1.13;
  } else if (hTactic === 'counter') {
    // ③ ダイレクトカウンター：FWのスピードが高いほど得点力UP、格上（強豪）に対して金星を挙げやすい
    const paceBonus = 1.05 + clamp((homeStats.fwPaceScore - 60) / 35, 0, 0.25);
    rawHomeLambda *= paceBonus;
    rawAwayLambda *= 0.90;
    if (awayStats.avgEffOvr >= homeStats.avgEffOvr + 2) {
      rawHomeLambda *= 1.22; // ジャイアントキリング補正
      rawAwayLambda *= 0.88;
    }
  } else if (hTactic === 'wingplay') {
    // ④ ワイドアタック：サイド総合値が攻撃力に強く反映、相手の5バック（5-3-2）や中央守備を攻略しやすい
    const wideBonus = 1.06 + clamp((homeStats.wideOvrScore - 60) / 35, 0, 0.22);
    rawHomeLambda *= wideBonus;
    if (CENTRAL_DEF_FORMATIONS.includes(aForm) || aTactic === 'parkthebus' || aTactic === 'counter') {
      rawHomeLambda *= 1.22; // 5バック・中央固めを外から崩す
    }
  } else if (hTactic === 'parkthebus') {
    // ⑤ ウルトラディフェンス：失点率を大幅カットするが、自チームの得点期待値もほぼゼロに（勝点1狙い）
    rawAwayLambda *= 0.38;
    rawHomeLambda *= 0.26;
  }

  // --- アウェイ側の5大戦術効果反映 ---
  if (aTactic === 'possession') {
    const midQuality = clamp((awayStats.cmDmPassScore - 58) / 30, 0, 1);
    rawHomeLambda *= (0.86 - midQuality * 0.12);
    if (awayStats.avgEffOvr >= homeStats.avgEffOvr + 2) {
      rawAwayLambda *= 1.16;
      rawHomeLambda *= 0.82;
    }
  } else if (aTactic === 'gegenpress') {
    rawAwayLambda *= 1.26;
    rawHomeLambda *= 1.13;
  } else if (aTactic === 'counter') {
    const paceBonus = 1.05 + clamp((awayStats.fwPaceScore - 60) / 35, 0, 0.25);
    rawAwayLambda *= paceBonus;
    rawHomeLambda *= 0.90;
    if (homeStats.avgEffOvr >= awayStats.avgEffOvr + 2) {
      rawAwayLambda *= 1.22;
      rawHomeLambda *= 0.88;
    }
  } else if (aTactic === 'wingplay') {
    const wideBonus = 1.06 + clamp((awayStats.wideOvrScore - 60) / 35, 0, 0.22);
    rawAwayLambda *= wideBonus;
    if (CENTRAL_DEF_FORMATIONS.includes(hForm) || hTactic === 'parkthebus' || hTactic === 'counter') {
      rawAwayLambda *= 1.22;
    }
  } else if (aTactic === 'parkthebus') {
    rawHomeLambda *= 0.38;
    rawAwayLambda *= 0.26;
  }

  const homeLambda = clamp(rawHomeLambda, 0.08, 4.4);
  const awayLambda = clamp(rawAwayLambda, 0.08, 4.2);

  const homeScore = samplePoisson(homeLambda);
  const awayScore = samplePoisson(awayLambda);

  // 3. シュート数の算出（ゲーゲンプレスで大幅UP、ウルトラディフェンスで極小、スコア以上のシュート数を保証）
  let baseHomeShots = Math.round(homeLambda * 5.2 + (homePossession - 50) * 0.12 + randInt(1, 4));
  let baseAwayShots = Math.round(awayLambda * 5.2 + (awayPossession - 50) * 0.12 + randInt(1, 4));
  if (hTactic === 'gegenpress') baseHomeShots = Math.round(baseHomeShots * 1.35 + 2);
  if (aTactic === 'gegenpress') baseAwayShots = Math.round(baseAwayShots * 1.35 + 2);
  if (hTactic === 'parkthebus') baseHomeShots = Math.min(baseHomeShots, Math.max(homeScore + 1, randInt(1, 3)));
  if (aTactic === 'parkthebus') baseAwayShots = Math.min(baseAwayShots, Math.max(awayScore + 1, randInt(1, 3)));

  const homeShots = Math.max(homeScore, clamp(baseHomeShots, 1, 28));
  const awayShots = Math.max(awayScore, clamp(baseAwayShots, 1, 26));

  // 4. 枠内シュート数（スコア以上、シュート数以下の妥当な枠内率: 約35%〜55%）
  const homeOnTarget = Math.max(homeScore, Math.min(homeShots, Math.round(homeShots * (0.35 + (homeStats.avgEffOvr / 250)) + randInt(0, 1))));
  const awayOnTarget = Math.max(awayScore, Math.min(awayShots, Math.round(awayShots * (0.35 + (awayStats.avgEffOvr / 250)) + randInt(0, 1))));

  // 5. ゴール期待値（xG: Expected Goals）：シュート数、決定機、攻撃側OVR、戦術補正から小数第2位まで算出
  const rawHomeXg = (homeLambda * 0.65) + (homeOnTarget * 0.12) + (homeShots * 0.04) + (homeScore > 0 ? (homeScore * 0.08) : 0) + (randInt(-5, 5) * 0.01);
  const rawAwayXg = (awayLambda * 0.65) + (awayOnTarget * 0.12) + (awayShots * 0.04) + (awayScore > 0 ? (awayScore * 0.08) : 0) + (randInt(-5, 5) * 0.01);
  const homeXg = Math.round(clamp(rawHomeXg, 0.12, 4.80) * 100) / 100;
  const awayXg = Math.round(clamp(rawAwayXg, 0.10, 4.60) * 100) / 100;

  // 6. パス総数およびパス成功率：ボール支配率、中盤（CM/DM）の能力から算出
  const baseMatchPasses = 860 + randInt(-30, 30);
  const homePasses = Math.round(baseMatchPasses * (homePossession / 100));
  const awayPasses = Math.max(120, baseMatchPasses - homePasses);

  const homePassAccBase = 76 + (homeStats.cmDmPassScore - 60) * 0.45 + (hTactic === 'possession' ? 4 : 0) - (aTactic === 'gegenpress' ? 3 : 0);
  const awayPassAccBase = 76 + (awayStats.cmDmPassScore - 60) * 0.45 + (aTactic === 'possession' ? 4 : 0) - (hTactic === 'gegenpress' ? 3 : 0);
  const homePassAccuracy = clamp(Math.round(homePassAccBase + randInt(-2, 2)), 68, 93);
  const awayPassAccuracy = clamp(Math.round(awayPassAccBase + randInt(-2, 2)), 68, 93);

  return {
    homeScore,
    awayScore,
    homePossession,
    awayPossession,
    homeShots,
    awayShots,
    homeOnTarget,
    awayOnTarget,
    homeXg,
    awayXg,
    homePasses,
    awayPasses,
    homePassAccuracy,
    awayPassAccuracy,
    homeTactic: hTactic,
    awayTactic: aTactic,
    homeFormation: hForm,
    awayFormation: aForm
  };
}

/**
 * 試合出場選手の評価点を一括算出・付与し、MOM（最優秀選手）を選定する共通ロジック
 * - 基準ベース: 6.7（平均6.9〜7.0への是正）
 * - 勝敗補正: 勝 +0.4, 分 0.0, 負 -0.3
 * - 攻守貢献: 1ゴール +0.8, 1アシスト +0.5
 * - クリーンシート: GK/DF +0.5
 * - 大量失点: GK/DF 3失点 -0.3, 4失点以上 -0.5
 * - 適性・疲労: 薄適性 -0.1, 不適性 -0.3, 疲労度80超 -0.2
 * - 出場全選手から最高評価の選手を MOM に決定
 */
function calculateAndAssignMatchRatings(homeClub, awayClub, homeStarters, awayStarters, homeSubs = [], awaySubs = [], homeScore = 0, awayScore = 0, allMatchGoals = []) {
  const isHomeWin = homeScore > awayScore;
  const isDraw = homeScore === awayScore;
  const isAwayWin = homeScore < awayScore;

  const assignGroup = (club, starters, subs, scored, conceded, isWin, isDraw) => {
    starters.forEach(p => {
      let r = 6.7;
      if (isWin) r += 0.4;
      else if (isDraw) r += 0.0;
      else r -= 0.3;

      const role = POS_ROLE_GROUP[p.assignedPos || p.pos];
      if (conceded === 0 && (role === 'GK' || role === 'DF')) {
        r += 0.5;
      } else if (conceded >= 4 && (role === 'GK' || role === 'DF')) {
        r -= 0.5;
      } else if (conceded === 3 && (role === 'GK' || role === 'DF')) {
        r -= 0.3;
      }

      const goalsInMatch = (allMatchGoals || []).filter(s => s && s.scorer && s.scorer.id === p.id).length;
      r += goalsInMatch * 0.8;

      const assistsInMatch = (allMatchGoals || []).filter(s => s && s.assister && s.assister.id === p.id).length;
      r += assistsInMatch * 0.5;

      if (p.assignedPos) {
        const fitInfo = getPositionFitInfo(p, p.assignedPos);
        if (fitInfo.type === 'sub') r -= 0.1;
        else if (fitInfo.type === 'out') r -= 0.3;
      }

      const ftg = typeof p.fatigue === 'number' ? p.fatigue : 0;
      if (ftg >= 80) r -= 0.2;

      r += randInt(-2, 2) * 0.1;
      r = clamp(r, 5.2, 9.8);
      p.lastMatchRating = Number(r.toFixed(1));
      p.totalRating = (p.totalRating || 0) + p.lastMatchRating;
    });

    (subs || []).forEach(p => {
      let r = 6.6;
      if (isWin) r += 0.2;
      else if (!isDraw) r -= 0.2;

      const goalsInMatch = (allMatchGoals || []).filter(s => s && s.scorer && s.scorer.id === p.id).length;
      r += goalsInMatch * 0.8;
      const assistsInMatch = (allMatchGoals || []).filter(s => s && s.assister && s.assister.id === p.id).length;
      r += assistsInMatch * 0.5;

      r += randInt(-1, 1) * 0.1;
      r = clamp(r, 5.4, 9.5);
      p.lastMatchRating = Number(r.toFixed(1));
      p.totalRating = (p.totalRating || 0) + p.lastMatchRating;
    });
  };

  assignGroup(homeClub, homeStarters, homeSubs, homeScore, awayScore, isHomeWin, isDraw);
  assignGroup(awayClub, awayStarters, awaySubs, awayScore, homeScore, isAwayWin, isDraw);

  // 全出場選手から MOM（Man of the Match）を選出
  const allEntries = [];
  homeStarters.forEach(p => allEntries.push({ p, club: homeClub, isWinner: isHomeWin }));
  awayStarters.forEach(p => allEntries.push({ p, club: awayClub, isWinner: isAwayWin }));
  (homeSubs || []).forEach(p => allEntries.push({ p, club: homeClub, isWinner: isHomeWin }));
  (awaySubs || []).forEach(p => allEntries.push({ p, club: awayClub, isWinner: isAwayWin }));

  allEntries.sort((a, b) => {
    const ratDiff = (b.p.lastMatchRating || 6.7) - (a.p.lastMatchRating || 6.7);
    if (Math.abs(ratDiff) > 0.01) return ratDiff;
    if (a.isWinner !== b.isWinner) return b.isWinner ? 1 : -1;
    return (b.p.goals || 0) - (a.p.goals || 0);
  });

  const momEntry = allEntries[0];
  allEntries.forEach(entry => {
    const isMom = Boolean(momEntry && entry.p.id === momEntry.p.id);
    entry.p.isMOM = isMom;
    if (isMom) {
      entry.p.momCount = (entry.p.momCount || 0) + 1;
      if (!entry.p.careerStats) entry.p.careerStats = { appearances: entry.p.appearances || 0, goals: entry.p.goals || 0, assists: entry.p.assists || 0 };
      entry.p.careerStats.momCount = (entry.p.careerStats.momCount || 0) + 1;
    }
  });

  return {
    momPlayer: momEntry ? momEntry.p : null,
    momClub: momEntry ? momEntry.club : homeClub,
    momRating: momEntry ? (momEntry.p.lastMatchRating || 7.5).toFixed(1) : '7.5'
  };
}

/**
 * 試合から得点者を抽出し、今季＆キャリア通算スタッツを更新する
 */
function processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore) {
  const homeStarters = homeClub.players.filter(p => p.isStarter && !p.isRetired);
  const awayStarters = awayClub.players.filter(p => p.isStarter && !p.isRetired);

  homeStarters.forEach(p => {
    p.appearances += 1;
    if (typeof p.assists !== 'number') p.assists = 0;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
    if (typeof p.careerStats.assists !== 'number') p.careerStats.assists = 0;
    p.careerStats.appearances += 1;

    // ポジション特訓の実戦出場ボーナス（+15%）
    if (homeClub.isPlayer && p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
      p.positionTraining.progress = Math.min(100, (p.positionTraining.progress || 0) + 15);
      if (p.positionTraining.progress >= 100) {
        const tPos = p.positionTraining.targetPos;
        const mode = p.positionTraining.mode || 'sub';
        if (!Array.isArray(p.secondaryPositions)) p.secondaryPositions = [];
        if (!Array.isArray(p.majorPositions)) {
          const pri = p.primaryPosition || p.preferredPosition || p.pos;
          p.majorPositions = [pri];
        }

        if (mode === 'major') {
          if (!p.majorPositions.includes(tPos)) p.majorPositions.push(tPos);
          p.secondaryPositions = p.secondaryPositions.filter(pos => pos !== tPos);
          addDailyLog(`🎉【本適性昇格完了】#${p.squadNumber || '-'} ${p.name} が [${tPos}] の本適性（100%発揮）を完全習得しました！`);
        } else {
          if (!p.secondaryPositions.includes(tPos)) p.secondaryPositions.push(tPos);
          addDailyLog(`🎉【薄適性習得完了】#${p.squadNumber || '-'} ${p.name} が [${tPos}] の薄適性（92%発揮）を習得しました！`);
        }
        p.positionTraining = null;
      }
    }
  });
  awayStarters.forEach(p => {
    p.appearances += 1;
    if (typeof p.assists !== 'number') p.assists = 0;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
    if (typeof p.careerStats.assists !== 'number') p.careerStats.assists = 0;
    p.careerStats.appearances += 1;

    // ポジション特訓の実戦出場ボーナス（+15%）
    if (awayClub.isPlayer && p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
      p.positionTraining.progress = Math.min(100, (p.positionTraining.progress || 0) + 15);
      if (p.positionTraining.progress >= 100) {
        const tPos = p.positionTraining.targetPos;
        const mode = p.positionTraining.mode || 'sub';
        if (!Array.isArray(p.secondaryPositions)) p.secondaryPositions = [];
        if (!Array.isArray(p.majorPositions)) {
          const pri = p.primaryPosition || p.preferredPosition || p.pos;
          p.majorPositions = [pri];
        }

        if (mode === 'major') {
          if (!p.majorPositions.includes(tPos)) p.majorPositions.push(tPos);
          p.secondaryPositions = p.secondaryPositions.filter(pos => pos !== tPos);
          addDailyLog(`🎉【本適性昇格完了】#${p.squadNumber || '-'} ${p.name} が [${tPos}] の本適性（100%発揮）を完全習得しました！`);
        } else {
          if (!p.secondaryPositions.includes(tPos)) p.secondaryPositions.push(tPos);
          addDailyLog(`🎉【薄適性習得完了】#${p.squadNumber || '-'} ${p.name} が [${tPos}] の薄適性（92%発揮）を習得しました！`);
        }
        p.positionTraining = null;
      }
    }
  });

  const getScorer = (starters, rawTactic) => {
    const tactic = normalizeTacticKey(rawTactic);
    const fws = starters.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'FW');
    const mfs = starters.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'MF');
    const dfs = starters.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'DF');

    const fwWeight = tactic === 'counter' ? 0.74 : (tactic === 'wingplay' ? 0.64 : (tactic === 'gegenpress' ? 0.62 : 0.55));
    const r = Math.random();

    if (r < fwWeight && fws.length > 0) {
      return fws[randInt(0, fws.length - 1)];
    } else if (mfs.length > 0) {
      return mfs[randInt(0, mfs.length - 1)];
    } else if (dfs.length > 0 && Math.random() < 0.25) {
      return dfs[randInt(0, dfs.length - 1)];
    }
    return fws[0] || mfs[0] || starters[0];
  };

  const getAssister = (starters, scorer, rawTactic) => {
    const tactic = normalizeTacticKey(rawTactic);
    // 約75%の確率でアシストが発生（残り25%は単独突破やPK/相手ミスなど）
    if (Math.random() < 0.25) return null;
    const candidates = starters.filter(p => p.id !== scorer.id && POS_ROLE_GROUP[p.assignedPos || p.pos] !== 'GK');
    if (candidates.length === 0) return null;

    // ワイドアタック時は両翼（LW/RW/LM/RM/LB/RB/LWB/RWB）からのクロスアシスト確率が大幅UP
    if (tactic === 'wingplay') {
      const wideCandidates = candidates.filter(p => ['LW', 'RW', 'LM', 'RM', 'LB', 'RB', 'LWB', 'RWB'].includes(p.assignedPos || p.pos));
      if (wideCandidates.length > 0 && Math.random() < 0.72) {
        return wideCandidates[randInt(0, wideCandidates.length - 1)];
      }
    }

    const mfs = candidates.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'MF');
    const fws = candidates.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'FW');
    const dfs = candidates.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'DF');

    const r = Math.random();
    if (r < 0.60 && mfs.length > 0) {
      return mfs[randInt(0, mfs.length - 1)];
    } else if (r < 0.85 && fws.length > 0) {
      return fws[randInt(0, fws.length - 1)];
    } else if (dfs.length > 0) {
      return dfs[randInt(0, dfs.length - 1)];
    }
    return candidates[randInt(0, candidates.length - 1)];
  };

  const hTacticNorm = normalizeTacticKey(homeClub.tactic);
  const aTacticNorm = normalizeTacticKey(awayClub.tactic);

  const homeScorers = [];
  for (let i = 0; i < homeScore; i++) {
    const scorer = getScorer(homeStarters, hTacticNorm);
    if (scorer) {
      scorer.goals += 1;
      if (scorer.careerStats) scorer.careerStats.goals += 1;
      const assister = getAssister(homeStarters, scorer, hTacticNorm);
      if (assister) {
        assister.assists = (assister.assists || 0) + 1;
        if (assister.careerStats) assister.careerStats.assists = (assister.careerStats.assists || 0) + 1;
      }
      // 相手がゲーゲンプレスの場合、終盤（70〜89分）のスタミナ切れ失点が発生しやすい演出
      const minute = (aTacticNorm === 'gegenpress' && Math.random() < 0.45) ? randInt(70, 89) : randInt(5, 89);
      homeScorers.push({ scorer, assister, minute });
    }
  }

  const awayScorers = [];
  for (let i = 0; i < awayScore; i++) {
    const scorer = getScorer(awayStarters, aTacticNorm);
    if (scorer) {
      scorer.goals += 1;
      if (scorer.careerStats) scorer.careerStats.goals += 1;
      const assister = getAssister(awayStarters, scorer, aTacticNorm);
      if (assister) {
        assister.assists = (assister.assists || 0) + 1;
        if (assister.careerStats) assister.careerStats.assists = (assister.careerStats.assists || 0) + 1;
      }
      const minute = (hTacticNorm === 'gegenpress' && Math.random() < 0.45) ? randInt(70, 89) : randInt(5, 89);
      awayScorers.push({ scorer, assister, minute });
    }
  }

  const allMatchGoals = homeScorers.concat(awayScorers);

  // 評価点算出（基準6.7・平均約7.0・勝敗/攻守貢献/完封/MOM選出）
  const ratingRes = calculateAndAssignMatchRatings(
    homeClub, awayClub,
    homeStarters, awayStarters,
    matchLiveState.homeSubs || [], matchLiveState.awaySubs || [],
    homeScore, awayScore,
    allMatchGoals
  );

  // 守備陣・GKのクリーンシート（CS: 完封数）加算
  const DEFENDER_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'];
  const isDefenderOrGk = (p) => {
    const pos = p.assignedPos || p.primaryPosition || p.preferredPosition || p.pos;
    return DEFENDER_POSITIONS.includes(pos) || POS_ROLE_GROUP[pos] === 'GK' || POS_ROLE_GROUP[pos] === 'DF';
  };

  if (awayScore === 0) {
    // ホーム側が無失点（完封）
    homeStarters.forEach(p => {
      if (isDefenderOrGk(p)) {
        p.cleanSheets = (p.cleanSheets || 0) + 1;
        if (!p.careerStats) p.careerStats = { appearances: p.appearances || 0, goals: p.goals || 0, assists: p.assists || 0, cleanSheets: 0 };
        p.careerStats.cleanSheets = (p.careerStats.cleanSheets || 0) + 1;
      }
    });
  }

  if (homeScore === 0) {
    // アウェイ側が無失点（完封）
    awayStarters.forEach(p => {
      if (isDefenderOrGk(p)) {
        p.cleanSheets = (p.cleanSheets || 0) + 1;
        if (!p.careerStats) p.careerStats = { appearances: p.appearances || 0, goals: p.goals || 0, assists: p.assists || 0, cleanSheets: 0 };
        p.careerStats.cleanSheets = (p.careerStats.cleanSheets || 0) + 1;
      }
    });
  }

  // 警告（イエロー）・退場（レッド）カードの記録シミュレーション
  const simulateCardsForSquad = (starters) => {
    const cardWeights = [45, 38, 14, 3];
    const numYellow = typeof avatarWeightedPick === 'function' ? avatarWeightedPick(cardWeights, Math.random) : randInt(0, 1);
    const nonGk = starters.filter(p => (p.assignedPos || p.pos) !== 'GK');
    const pool = nonGk.length > 0 ? nonGk : starters;
    for (let c = 0; c < numYellow; c++) {
      const target = pool[randInt(0, pool.length - 1)];
      if (target) {
        target.yellowCards = (target.yellowCards || 0) + 1;
        if (!target.careerStats) target.careerStats = { appearances: target.appearances || 0, goals: target.goals || 0, assists: target.assists || 0 };
        target.careerStats.yellowCards = (target.careerStats.yellowCards || 0) + 1;
      }
    }
    if (Math.random() < 0.025) {
      const target = pool[randInt(0, pool.length - 1)];
      if (target) {
        target.redCards = (target.redCards || 0) + 1;
        if (!target.careerStats) target.careerStats = { appearances: target.appearances || 0, goals: target.goals || 0, assists: target.assists || 0 };
        target.careerStats.redCards = (target.careerStats.redCards || 0) + 1;
      }
    }
  };
  simulateCardsForSquad(homeStarters);
  simulateCardsForSquad(awayStarters);

  const isHomeWin = homeScore > awayScore;
  const isDraw = homeScore === awayScore;
  const isAwayWin = homeScore < awayScore;

  // 監督現場信頼度の更新（GM現場介入ペナルティ＆勝敗連動）
  updateManagerTrustAfterMatch(homeClub, isHomeWin, isDraw);
  updateManagerTrustAfterMatch(awayClub, isAwayWin, isDraw);

  // 試合出場に伴う疲労度（0〜100数値）蓄積（戦術・コーチング効果連動）
  applyPostMatchPlayerFatigue(homeClub, homeStarters, matchLiveState.homeSubs || []);
  applyPostMatchPlayerFatigue(awayClub, awayStarters, matchLiveState.awaySubs || []);

  return { homeScorers, awayScorers, momPlayer: ratingRes.momPlayer, momClub: ratingRes.momClub, momRating: ratingRes.momRating };
}

/**
 * 自チームの試合におけるテキスト速報用イベントログを生成
 */
function generateMatchTickerEvents(playerMatch, homeScorers, awayScorers) {
  const {
    homeClub, awayClub, homeScore, awayScore, isPlayerHome,
    matchIncome, awayBroadcastingFee,
    homePossession, awayPossession, homeShots, awayShots
  } = playerMatch;
  const events = [];

  const hForm = homeClub.formation || '4-3-3';
  const aForm = awayClub.formation || '4-3-3';
  const hTacBadge = (TACTICS_DEFINITIONS[normalizeTacticKey(homeClub.tactic)] || TACTICS_DEFINITIONS.possession).badge;
  const aTacBadge = (TACTICS_DEFINITIONS[normalizeTacticKey(awayClub.tactic)] || TACTICS_DEFINITIONS.possession).badge;

  events.push({
    time: "0'",
    type: 'normal',
    text: `試合開始！ ${homeClub.name} [${hForm}/${hTacBadge}] vs ${awayClub.name} [${aForm}/${aTacBadge}]`
  });

  const goalEvents = [];
  homeScorers.forEach(item => {
    goalEvents.push({
      minute: item.minute,
      text: `ゴール！ ${homeClub.name} (${item.scorer.pos} ${item.scorer.name})`,
      type: 'goal'
    });
  });

  awayScorers.forEach(item => {
    goalEvents.push({
      minute: item.minute,
      text: `ゴール！ ${awayClub.name} (${item.scorer.pos} ${item.scorer.name})`,
      type: 'goal'
    });
  });

  goalEvents.sort((a, b) => a.minute - b.minute);
  for (const g of goalEvents) {
    events.push({
      time: `${g.minute}'`,
      type: g.type,
      text: g.text
    });
  }

  const statsSummary = (typeof homePossession === 'number' && typeof homeShots === 'number')
    ? ` （支配率 ${homePossession}%:${awayPossession}% / シュート ${homeShots}:${awayShots}本）`
    : '';

  events.push({
    time: "90'",
    type: 'final',
    text: `試合終了！ 最終結果：${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name}${statsSummary}`
  });

  if (isPlayerHome && matchIncome > 0) {
    const stadiumLv = (gameState.facilities && gameState.facilities.stadium) ? gameState.facilities.stadium : 1;
    const bonusNote = stadiumLv > 1 ? ` (スタジアムLv.${stadiumLv}効果 +${(stadiumLv - 1) * 15}%)` : '';
    events.push({
      time: 'FINANCE',
      type: 'revenue',
      text: `[ホーム開催] マッチデイ入場料・グッズ売上 +${formatMoney(matchIncome)}${bonusNote} を計上`
    });
  } else if (!isPlayerHome) {
    events.push({
      time: 'FINANCE',
      type: 'revenue',
      text: `[アウェイ開催] プレミア放映権分配金 +${formatMoney(awayBroadcastingFee || 500)} を計上`
    });
  }

  return events;
}

/**
 * 毎節終了時に既存の怪我人の残り全治節数を -1 する
 */
function advanceInjuryRecovery() {
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      if (p.injuryWeeks && p.injuryWeeks > 0) {
        p.injuryWeeks = Math.max(0, p.injuryWeeks - 1);
      }
    }
  }
}

/**
 * 1節分（10試合）を進行する
 */
function playNextMatchweek(skipAnimation = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.currentWeek >= gameState.totalWeeks) {
    return;
  }
  if (gameState.isSimulating) {
    return;
  }

  advanceInjuryRecovery();

  const weekIndex = gameState.currentWeek;
  const weekMatches = gameState.schedule[weekIndex];
  const results = [];
  let playerMatchData = null;
  let playerHomeScorers = [];
  let playerAwayScorers = [];

  const stadiumLv = (gameState.facilities && gameState.facilities.stadium) ? gameState.facilities.stadium : 1;
  const stadiumMultiplier = 1 + (stadiumLv - 1) * 0.15;

  for (const match of weekMatches) {
    const homeClub = getClubById(match.homeId);
    const awayClub = getClubById(match.awayId);

    const simResult = simulateMatch(homeClub, awayClub);
    const {
      homeScore, awayScore, homePossession, awayPossession, homeShots, awayShots,
      homeOnTarget, awayOnTarget, homeXg, awayXg, homePasses, awayPasses, homePassAccuracy, awayPassAccuracy
    } = simResult;
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.homePossession = homePossession;
    match.awayPossession = awayPossession;
    match.homeShots = homeShots;
    match.awayShots = awayShots;
    match.homeOnTarget = homeOnTarget;
    match.awayOnTarget = awayOnTarget;
    match.homeXg = homeXg;
    match.awayXg = awayXg;
    match.homePasses = homePasses;
    match.awayPasses = awayPasses;
    match.homePassAccuracy = homePassAccuracy;
    match.awayPassAccuracy = awayPassAccuracy;
    match.played = true;

    // ホーム開催時（全19試合）：サポーター規模＋スタジアム拡張Lv補正（Lvごとに+15%）に応じたマッチデイ収入（£1.2M〜£2.5M）
    const rawIncome = homeClub.supporters * 0.085 + randInt(-30, 30);
    const effectiveIncome = homeClub.isPlayer ? rawIncome * stadiumMultiplier : rawIncome;
    const matchIncome = Math.round(effectiveIncome / 10) * 10;
    homeClub.funds += matchIncome;
    match.homeRevenue = matchIncome;

    // アウェイ戦（全19試合）：プレミア放映権料分配金 £1.6M（1,600 £K）
    const awayBroadcastingFee = 1600;
    awayClub.funds += awayBroadcastingFee;
    match.awayRevenue = awayBroadcastingFee;

    homeClub.played += 1;
    awayClub.played += 1;
    homeClub.gf += homeScore;
    homeClub.ga += awayScore;
    homeClub.gd = homeClub.gf - homeClub.ga;

    awayClub.gf += awayScore;
    awayClub.ga += homeScore;
    awayClub.gd = awayClub.gf - awayClub.ga;

    const prevHomeSupporters = homeClub.supporters;
    const prevAwaySupporters = awayClub.supporters;

    if (homeScore > awayScore) {
      homeClub.won += 1;
      homeClub.pts += 3;
      awayClub.lost += 1;
      homeClub.supporters = Math.max(5000, homeClub.supporters + randInt(90, 240));
      awayClub.supporters = Math.max(5000, awayClub.supporters - randInt(20, 80));
    } else if (homeScore < awayScore) {
      awayClub.won += 1;
      awayClub.pts += 3;
      homeClub.lost += 1;
      awayClub.supporters = Math.max(5000, awayClub.supporters + randInt(90, 240));
      homeClub.supporters = Math.max(5000, homeClub.supporters - randInt(20, 80));
    } else {
      homeClub.drawn += 1;
      awayClub.drawn += 1;
      homeClub.pts += 1;
      awayClub.pts += 1;
      homeClub.supporters = Math.max(5000, homeClub.supporters + randInt(-10, 60));
      awayClub.supporters = Math.max(5000, awayClub.supporters + randInt(-10, 60));
    }

    const homeSupportersDelta = homeClub.supporters - prevHomeSupporters;
    const awaySupportersDelta = awayClub.supporters - prevAwaySupporters;

    const { homeScorers, awayScorers } = processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore);

    const matchObj = {
      week: weekIndex + 1,
      homeClub,
      awayClub,
      homeScore,
      awayScore,
      homePossession,
      awayPossession,
      homeShots,
      awayShots,
      homeOnTarget,
      awayOnTarget,
      homeXg,
      awayXg,
      homePasses,
      awayPasses,
      homePassAccuracy,
      awayPassAccuracy,
      isPlayerHome: homeClub.isPlayer,
      isPlayerMatch: homeClub.isPlayer || awayClub.isPlayer,
      matchIncome,
      awayBroadcastingFee,
      playerSupportersDelta: homeClub.isPlayer ? homeSupportersDelta : awaySupportersDelta,
      homeScorers,
      awayScorers
    };
    results.push(matchObj);

    if (matchObj.isPlayerMatch) {
      playerMatchData = matchObj;
      playerHomeScorers = homeScorers;
      playerAwayScorers = awayScorers;
      if (!gameState.matchHistory) gameState.matchHistory = [];
      const existIdx = gameState.matchHistory.findIndex(m => m.week === matchObj.week);
      if (existIdx !== -1) {
        gameState.matchHistory[existIdx] = matchObj;
      } else {
        gameState.matchHistory.push(matchObj);
      }
    }
  }

  gameState.currentWeek += 1;
  gameState.lastWeekResults = results;

  const tickerEvents = playerMatchData
    ? generateMatchTickerEvents(playerMatchData, playerHomeScorers, playerAwayScorers)
    : [];

  gameState.lastMatchTicker = {
    week: weekIndex + 1,
    events: tickerEvents,
    completed: true
  };

  const isFinalWeek = gameState.currentWeek === gameState.totalWeeks;

  if (skipAnimation) {
    if (isFinalWeek) {
      processSeasonEnd(true);
    }
    renderAll();
    return;
  }

  if (playerMatchData) {
    openMatchEventModal(playerMatchData, playerHomeScorers, playerAwayScorers, () => {
      if (isFinalWeek) {
        processSeasonEnd(false);
      } else {
        checkPostMatchEvents();
      }
      renderAll();
    });
  } else {
    if (isFinalWeek) {
      processSeasonEnd(false);
    } else {
      checkPostMatchEvents();
    }
    renderAll();
  }
}

/**
 * 試合経過（2Dサッカーコート）＆マッチサマリー（案A）の2段階モーダル制御
 */
const matchLiveState = {
  timerId: null,
  popupTimeoutId: null,
  autoSummaryTimeoutId: null,
  minute: 0,
  speed: 1,
  status: 'IDLE', // 'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULLTIME' | 'SUMMARY'
  matchData: null,
  homeScorers: [],
  awayScorers: [],
  timelineByMinute: {},
  allHighlights: [],
  liveHomeScore: 0,
  liveAwayScore: 0,
  liveHomeShots: 0,
  liveAwayShots: 0,
  homeBaseTokens: [],
  awayBaseTokens: [],
  onComplete: null,
  eventsBound: false
};

function clearMatchLiveTimers() {
  if (matchLiveState.timerId) {
    clearInterval(matchLiveState.timerId);
    matchLiveState.timerId = null;
  }
  if (matchLiveState.popupTimeoutId) {
    clearTimeout(matchLiveState.popupTimeoutId);
    matchLiveState.popupTimeoutId = null;
  }
  if (matchLiveState.autoSummaryTimeoutId) {
    clearTimeout(matchLiveState.autoSummaryTimeoutId);
    matchLiveState.autoSummaryTimeoutId = null;
  }
}

/**
 * 試合相手クラブ（他国クラブや2部クラブなど）のスタメン配列を保証
 */
function ensureClubStartersForMatch(club) {
  if (!club) return [];
  if (club.players && club.players.length >= 11) {
    if (typeof ensureValidSquadAndStarters === 'function' && club.isPlayer) {
      ensureValidSquadAndStarters(club);
    }
    // スタメン11名を厳格に抽出
    const starters = club.players.filter(p => p.isStarter && !p.isRetired);
    if (starters.length === 11) return starters;
    if (starters.length > 0 && starters.length <= 11) {
      const remaining = club.players.filter(p => !starters.some(s => s.id === p.id) && !p.isRetired);
      return starters.concat(remaining.slice(0, 11 - starters.length));
    }
    return club.players.slice(0, 11);
  }
  if (!club.players || club.players.length === 0) {
    const baseP = club.basePower || club.ovr || 74;
    const positions = ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'AM', 'LW', 'CF', 'RW'];
    const cCode = getClubShortCode(club);
    club.players = positions.map((pos, idx) => ({
      id: `${club.id}_p${idx + 1}`,
      name: `${cCode} #${idx + 1}`,
      squadNumber: idx + 1,
      pos: pos,
      assignedPos: pos,
      atk: Math.round(baseP + (Math.random() * 6 - 3)),
      def: Math.round(baseP + (Math.random() * 6 - 3)),
      sta: 100,
      isStarter: true,
      slotIndex: idx,
      appearances: 0,
      goals: 0,
      assists: 0,
      lastMatchRating: 6.5
    }));
  }
  return club.players.slice(0, 11);
}

/**
 * 90分間の詳細な試合経過タイムライン（ゴール・セーブ・シュート・攻防）を構築
 */
function buildLiveMatchTimeline(matchData, homeScorers, awayScorers) {
  const { homeClub, awayClub, homeShots, awayShots } = matchData;
  const byMinute = {};
  const highlights = [];

  const homeStarters = ensureClubStartersForMatch(homeClub);
  const awayStarters = ensureClubStartersForMatch(awayClub);
  const homeGk = homeStarters.find(p => (p.assignedPos || p.pos) === 'GK') || homeStarters[0];
  const awayGk = awayStarters.find(p => (p.assignedPos || p.pos) === 'GK') || awayStarters[0];

  const getFreeMinute = (rawMin, isFirstHalfPref = null) => {
    let m = clamp(rawMin, 1, 89);
    if (m === 45) m = 44;
    const minBound = isFirstHalfPref === true ? 2 : (isFirstHalfPref === false ? 46 : 2);
    const maxBound = isFirstHalfPref === true ? 44 : (isFirstHalfPref === false ? 89 : 89);
    m = clamp(m, minBound, maxBound);
    let offset = 0;
    while (offset < 45) {
      const cand1 = m + offset;
      if (cand1 <= maxBound && cand1 !== 45 && !byMinute[cand1]) return cand1;
      const cand2 = m - offset;
      if (cand2 >= minBound && cand2 !== 45 && !byMinute[cand2]) return cand2;
      offset++;
    }
    return m;
  };

  const fmtNum = (p) => (p && p.squadNumber ? `#${p.squadNumber} ` : '');

  // 1. ゴールイベントを配置
  homeScorers.forEach(g => {
    const isFH = g.minute <= 45;
    const min = getFreeMinute(g.minute, isFH);
    g.minute = min;
    const assistText = g.assister ? ` (アシスト: ${fmtNum(g.assister)}${g.assister.name})` : '';
    const ev = {
      minute: min,
      type: 'goal',
      side: 'home',
      club: homeClub,
      actor: g.scorer,
      assister: g.assister || null,
      text: `⚽ GOAL!! ${homeClub.name} ${fmtNum(g.scorer)}${g.scorer.name} がネットを揺らす！${assistText}`
    };
    byMinute[min] = ev;
    highlights.push(ev);
  });

  awayScorers.forEach(g => {
    const isFH = g.minute <= 45;
    const min = getFreeMinute(g.minute, isFH);
    g.minute = min;
    const assistText = g.assister ? ` (アシスト: ${fmtNum(g.assister)}${g.assister.name})` : '';
    const ev = {
      minute: min,
      type: 'goal',
      side: 'away',
      club: awayClub,
      actor: g.scorer,
      assister: g.assister || null,
      text: `⚽ GOAL!! ${awayClub.name} ${fmtNum(g.scorer)}${g.scorer.name} がゴールを決めた！${assistText}`
    };
    byMinute[min] = ev;
    highlights.push(ev);
  });

  // 2. 決定機・セーブ・シュートイベントを前後半にバランス良く配置
  const pickAttacker = (starters) => {
    const attackers = starters.filter(p => (p.assignedPos || p.pos) !== 'GK');
    return attackers[randInt(0, Math.max(0, attackers.length - 1))] || starters[0];
  };

  const extraHomeShots = Math.max(2, Math.min(5, (homeShots || 6) - homeScorers.length));
  const extraAwayShots = Math.max(2, Math.min(5, (awayShots || 6) - awayScorers.length));
  const subHighlights = [];

  for (let i = 0; i < extraHomeShots; i++) {
    const isFH = i % 2 === 0;
    const rawMin = isFH ? randInt(4, 42) : randInt(48, 87);
    const min = getFreeMinute(rawMin, isFH);
    const shooter = pickAttacker(homeStarters);
    const isSave = i % 2 === 0;
    const ev = {
      minute: min,
      type: isSave ? 'save' : 'shot',
      side: 'home',
      club: homeClub,
      actor: shooter,
      keeper: awayGk,
      text: isSave
        ? `🧤 SUPER SAVE! ${homeClub.name} ${fmtNum(shooter)}${shooter.name} の鋭いシュートをGK ${awayGk.name} が好セーブ！`
        : `⚡ 惜しい！ ${homeClub.name} ${fmtNum(shooter)}${shooter.name} のミドルシュートはわずかに枠の外！`
    };
    byMinute[min] = ev;
    if (isSave) subHighlights.push(ev);
  }

  for (let i = 0; i < extraAwayShots; i++) {
    const isFH = i % 2 === 1;
    const rawMin = isFH ? randInt(5, 43) : randInt(49, 88);
    const min = getFreeMinute(rawMin, isFH);
    const shooter = pickAttacker(awayStarters);
    const isSave = i % 2 === 0;
    const ev = {
      minute: min,
      type: isSave ? 'save' : 'shot',
      side: 'away',
      club: awayClub,
      actor: shooter,
      keeper: homeGk,
      text: isSave
        ? `🧤 ナイスセーブ！ ${awayClub.name} ${fmtNum(shooter)}${shooter.name} の決定機をGK ${fmtNum(homeGk)}${homeGk.name} が阻止！`
        : `⚡ ${awayClub.name} ${fmtNum(shooter)}${shooter.name} がペナルティエリア内から狙うも枠を捉えきれず！`
    };
    byMinute[min] = ev;
    if (isSave) subHighlights.push(ev);
  }

  // ゴールを最優先しつつ最大4件のハイライトを時系列順に構成
  for (const sh of subHighlights) {
    if (highlights.length >= 4) break;
    highlights.push(sh);
  }
  highlights.sort((a, b) => a.minute - b.minute);
  return { byMinute, highlights };
}

/**
 * 2Dサッカーコート上の22名の選手ピン初期配置を計算・生成
 */
function setupMatch2DPitchTokens(homeClub, awayClub) {
  const tokensLayer = document.getElementById('match-pitch-tokens');
  const svgEl = document.getElementById('match-pitch-svg');
  if (!tokensLayer) return;
  tokensLayer.innerHTML = '';
  if (svgEl) svgEl.innerHTML = '';

  const hDef = getClubFormationDef(homeClub);
  const aDef = getClubFormationDef(awayClub);
  const homeStarters = ensureClubStartersForMatch(homeClub);
  const awayStarters = ensureClubStartersForMatch(awayClub);

  matchLiveState.homeBaseTokens = [];
  matchLiveState.awayBaseTokens = [];

  // ホーム（左コート ➔ 右へ攻める）
  const isHomePlayer = Boolean(homeClub.isPlayer);
  const isAwayPlayer = Boolean(awayClub.isPlayer);
  hDef.slots.forEach((slot, idx) => {
    const p = homeStarters[idx];
    const isGk = slot.pos === 'GK';
    const baseX = isGk ? 6 : clamp(10 + ((90 - slot.y) / 75) * 36, 12, 46);
    const baseY = clamp(slot.x, 12, 88);
    const el = document.createElement('div');
    el.className = `pitch-2d-token home-token ${isHomePlayer ? 'token-player' : 'token-opponent'} ${isGk ? 'is-gk' : ''}`;
    el.style.left = `${baseX}%`;
    el.style.top = `${baseY}%`;
    el.textContent = p ? (p.squadNumber || idx + 1) : idx + 1;
    tokensLayer.appendChild(el);
    matchLiveState.homeBaseTokens.push({ el, player: p, pos: slot.pos, isGk, baseX, baseY, curX: baseX, curY: baseY, isPlayer: isHomePlayer });
  });

  // アウェイ（右コート ➔ 左へ攻める）
  aDef.slots.forEach((slot, idx) => {
    const p = awayStarters[idx];
    const isGk = slot.pos === 'GK';
    const baseX = isGk ? 94 : clamp(90 - ((90 - slot.y) / 75) * 36, 54, 88);
    const baseY = clamp(100 - slot.x, 12, 88);
    const el = document.createElement('div');
    el.className = `pitch-2d-token away-token ${isAwayPlayer ? 'token-player' : 'token-opponent'} ${isGk ? 'is-gk' : ''}`;
    el.style.left = `${baseX}%`;
    el.style.top = `${baseY}%`;
    el.textContent = p ? (p.squadNumber || idx + 1) : idx + 1;
    tokensLayer.appendChild(el);
    matchLiveState.awayBaseTokens.push({ el, player: p, pos: slot.pos, isGk, baseX, baseY, curX: baseX, curY: baseY, isPlayer: isAwayPlayer });
  });

  const ballEl = document.getElementById('match-pitch-ball');
  if (ballEl) {
    ballEl.style.left = '50%';
    ballEl.style.top = '50%';
  }
}

/**
 * 1分ごとの2Dコート上の選手ピン・ボール・シュート軌跡のアニメーション更新
 */
function animatePitchStep(minute, ev) {
  const ballEl = document.getElementById('match-pitch-ball');
  const svgEl = document.getElementById('match-pitch-svg');
  if (svgEl) svgEl.innerHTML = '';

  const allTokens = matchLiveState.homeBaseTokens.concat(matchLiveState.awayBaseTokens);
  allTokens.forEach(t => t.el.classList.remove('active-actor'));

  const homePoss = (matchLiveState.matchData && matchLiveState.matchData.homePossession) || 50;
  const attackingSide = ev ? ev.side : (Math.random() * 100 < homePoss ? 'home' : 'away');
  const shiftX = attackingSide === 'home' ? randInt(6, 16) : randInt(-16, -6);

  matchLiveState.homeBaseTokens.forEach(t => {
    if (t.isGk) {
      t.curX = 6;
      t.curY = 50 + randInt(-4, 4);
    } else {
      t.curX = clamp(t.baseX + shiftX + randInt(-4, 5), 12, 86);
      t.curY = clamp(t.baseY + randInt(-6, 6), 10, 90);
    }
    t.el.style.left = `${t.curX}%`;
    t.el.style.top = `${t.curY}%`;
  });

  matchLiveState.awayBaseTokens.forEach(t => {
    if (t.isGk) {
      t.curX = 94;
      t.curY = 50 + randInt(-4, 4);
    } else {
      t.curX = clamp(t.baseX + shiftX + randInt(-5, 4), 14, 88);
      t.curY = clamp(t.baseY + randInt(-6, 6), 10, 90);
    }
    t.el.style.left = `${t.curX}%`;
    t.el.style.top = `${t.curY}%`;
  });

  if (!ev) {
    // 通常のパス回し・攻防
    const sideTokens = attackingSide === 'home'
      ? matchLiveState.homeBaseTokens.filter(t => !t.isGk)
      : matchLiveState.awayBaseTokens.filter(t => !t.isGk);
    const holder = sideTokens[randInt(0, sideTokens.length - 1)];
    if (holder && ballEl) {
      holder.el.classList.add('active-actor');
      ballEl.style.left = `${holder.curX}%`;
      ballEl.style.top = `${holder.curY}%`;
    }
    return;
  }

  // イベント発生時（ゴール・セーブ・シュート）
  const isHome = ev.side === 'home';
  const sideTokens = isHome ? matchLiveState.homeBaseTokens : matchLiveState.awayBaseTokens;
  let actorToken = sideTokens.find(t => t.player && ev.actor && t.player.id === ev.actor.id);
  if (!actorToken) {
    const fieldTokens = sideTokens.filter(t => !t.isGk);
    actorToken = fieldTokens[fieldTokens.length - 1] || sideTokens[0];
  }

  // シューターを敵陣ゴール前へ移動
  const shootX = isHome ? randInt(76, 86) : randInt(14, 24);
  const shootY = randInt(28, 72);
  if (actorToken) {
    actorToken.curX = shootX;
    actorToken.curY = shootY;
    actorToken.el.style.left = `${shootX}%`;
    actorToken.el.style.top = `${shootY}%`;
    actorToken.el.classList.add('active-actor');
  }

  let targetX = isHome ? 98.5 : 1.5;
  let targetY = 50;
  let lineColor = '#f1c40f';

  if (ev.type === 'save') {
    targetX = isHome ? 93.5 : 6.5;
    targetY = randInt(43, 57);
    lineColor = '#60a5fa';
  } else if (ev.type === 'shot') {
    targetX = isHome ? 99 : 1;
    targetY = Math.random() < 0.5 ? randInt(18, 32) : randInt(68, 82);
    lineColor = '#94a3b8';
  }

  if (svgEl) {
    svgEl.innerHTML = `
      <line x1="${shootX}" y1="${shootY}" x2="${targetX}" y2="${targetY}"
        stroke="${lineColor}" stroke-width="1.2" stroke-dasharray="${ev.type === 'goal' ? 'none' : '2,2'}" />
    `;
  }

  if (ballEl) {
    ballEl.style.left = `${targetX}%`;
    ballEl.style.top = `${targetY}%`;
  }

  if (ev.type === 'goal' || ev.type === 'save') {
    showMatchPitchPopup(ev);
  }
}

/**
 * ゴールやスーパーセーブ発生時にコート中央へポップアップバナーを表示
 */
function showMatchPitchPopup(ev) {
  const popupEl = document.getElementById('match-pitch-event-popup');
  if (!popupEl) return;

  if (matchLiveState.popupTimeoutId) {
    clearTimeout(matchLiveState.popupTimeoutId);
  }

  const isGoal = ev.type === 'goal';
  const md = matchLiveState.matchData;
  const homeClub = md ? md.homeClub : null;
  const awayClub = md ? md.awayClub : null;

  // スーパーセーブの主役は守護神（キーパー）！
  // シューター側がhomeならkeeperはaway、シューター側がawayならkeeperはhome
  const keeperClub = ev.side === 'home' ? awayClub : homeClub;
  const isPlayerSuccess = isGoal
    ? Boolean(ev.club && ev.club.isPlayer)
    : Boolean(keeperClub && keeperClub.isPlayer);

  popupEl.className = `match-pitch-event-popup ${isGoal ? 'popup-goal' : 'popup-save'} ${isPlayerSuccess ? 'popup-player' : 'popup-opponent'}`;

  const targetPlayer = isGoal ? ev.actor : (ev.keeper || ev.actor);
  const targetClub = isGoal ? ev.club : (keeperClub || ev.club);
  const playerPrefix = isPlayerSuccess ? '【自チーム】' : '【相手チーム】';
  const badgeText = isGoal ? `⚽ GOAL!! (${ev.minute}')` : `🧤 SUPER SAVE! (${ev.minute}')`;
  const subText = isGoal
    ? `${playerPrefix} ${ev.club.name}${ev.assister ? ` / Assist: ${ev.assister.name}` : ''}`
    : `${playerPrefix} GK ${targetPlayer ? targetPlayer.name : ''}（${targetClub ? targetClub.name : ''}）が決定機を阻止！`;
  const numLabel = targetPlayer && targetPlayer.squadNumber ? `#${targetPlayer.squadNumber} ` : '';
  const avatarHtml = (targetPlayer && targetClub && typeof getPlayerAvatarHtml === 'function')
    ? getPlayerAvatarHtml(targetPlayer, targetClub, 'avatar-md', 42)
    : '';

  popupEl.innerHTML = `
    ${avatarHtml}
    <div class="event-popup-info">
      <span class="event-popup-badge">${badgeText}</span>
      <span class="event-popup-player">${numLabel}${targetPlayer ? targetPlayer.name : ''}</span>
      <span class="event-popup-sub">${subText}</span>
    </div>
  `;

  popupEl.classList.remove('hidden');
  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(popupEl);
  }

  matchLiveState.popupTimeoutId = setTimeout(() => {
    popupEl.classList.add('hidden');
  }, 2000);
}

/**
 * 実況ティッカーに1行追加
 */
function appendLiveCommentary(minLabel, text, typeClass = '') {
  const feedEl = document.getElementById('match-live-commentary-feed');
  if (!feedEl) return;
  const line = document.createElement('div');
  line.className = `commentary-line ${typeClass}`;
  line.innerHTML = `<span class="commentary-min">${minLabel}</span><span>${text}</span>`;
  feedEl.appendChild(line);
  feedEl.scrollTop = feedEl.scrollHeight;
}

/**
 * 試合経過タイマーの開始・再開
 */
function startMatchLiveTimer() {
  if (matchLiveState.timerId) {
    clearInterval(matchLiveState.timerId);
    matchLiveState.timerId = null;
  }

  // 1x: 480ms/分 (じっくり観戦), 2x: 200ms/分 (テンポ良く), 4x: 75ms/分 (高速消化)
  const baseInterval = matchLiveState.speed === 4 ? 75 : (matchLiveState.speed === 2 ? 200 : 480);

  // 滑らかなCSSトランジション時間をスピード設定に連動
  const moveDuration = Math.round(baseInterval * 0.9);
  const pitchTokens = document.querySelectorAll('.pitch-2d-token');
  pitchTokens.forEach(el => {
    el.style.transition = `left ${moveDuration}ms cubic-bezier(0.25, 1, 0.5, 1), top ${moveDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`;
  });
  const ballEl = document.getElementById('match-pitch-ball');
  if (ballEl) {
    ballEl.style.transition = `left ${Math.round(moveDuration * 0.85)}ms cubic-bezier(0.22, 1, 0.36, 1), top ${Math.round(moveDuration * 0.85)}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  }

  matchLiveState.timerId = setInterval(() => {
    if (matchLiveState.status !== 'FIRST_HALF' && matchLiveState.status !== 'SECOND_HALF') {
      clearInterval(matchLiveState.timerId);
      matchLiveState.timerId = null;
      return;
    }

    matchLiveState.minute += 1;
    const min = matchLiveState.minute;

    const clockEl = document.getElementById('match-live-clock');
    if (clockEl) clockEl.textContent = `${String(min).padStart(2, '0')}'`;

    const ev = matchLiveState.timelineByMinute[min] || null;
    animatePitchStep(min, ev);

    if (ev) {
      if (ev.type === 'goal') {
        if (ev.side === 'home') {
          matchLiveState.liveHomeScore += 1;
          matchLiveState.liveHomeShots += 1;
        } else {
          matchLiveState.liveAwayScore += 1;
          matchLiveState.liveAwayShots += 1;
        }
        const shEl = document.getElementById('match-live-score-home');
        const saEl = document.getElementById('match-live-score-away');
        if (shEl) shEl.textContent = matchLiveState.liveHomeScore;
        if (saEl) saEl.textContent = matchLiveState.liveAwayScore;
        appendLiveCommentary(`${min}'`, ev.text, 'ev-goal');
      } else if (ev.type === 'save') {
        if (ev.side === 'home') matchLiveState.liveHomeShots += 1;
        else matchLiveState.liveAwayShots += 1;
        appendLiveCommentary(`${min}'`, ev.text, 'ev-save');
      } else if (ev.type === 'shot') {
        if (ev.side === 'home') matchLiveState.liveHomeShots += 1;
        else matchLiveState.liveAwayShots += 1;
        appendLiveCommentary(`${min}'`, ev.text, '');
      }
    } else if (min % 9 === 0 && min < 44 || (min > 46 && min < 88 && min % 9 === 0)) {
      const md = matchLiveState.matchData;
      if (md) {
        const isHomeAtk = Math.random() * 100 < (md.homePossession || 50);
        const atkClub = isHomeAtk ? md.homeClub : md.awayClub;
        const playTexts = [
          `${atkClub.name} が中盤でパスを繋ぎながら相手ブロックの隙を窺う。`,
          `${atkClub.name} がサイドへ大きく展開し、クロスからチャンスを模索。`,
          `中盤での激しいボールの奪い合い。両チーム集中した守備を見せる。`,
          `${atkClub.name} が前線から連動したプレスをかけてボールを奪取！`
        ];
        appendLiveCommentary(`${min}'`, playTexts[randInt(0, playTexts.length - 1)], '');
      }
    }

    // ★ 前半45分到達時：ハーフタイムで必ず一時停止！
    if (min === 45 && matchLiveState.status === 'FIRST_HALF') {
      clearInterval(matchLiveState.timerId);
      matchLiveState.timerId = null;
      matchLiveState.status = 'HALFTIME';

      const periodEl = document.getElementById('match-live-period');
      if (periodEl) periodEl.textContent = 'HALF TIME';

      appendLiveCommentary(`45'`, '前半終了のホイッスル！ハーフタイムに入ります。', 'ev-period');

      const htOverlay = document.getElementById('match-halftime-overlay');
      const htScore = document.getElementById('halftime-score-display');
      const htStats = document.getElementById('halftime-stats-mini');
      const md = matchLiveState.matchData;
      if (htScore) htScore.textContent = `${matchLiveState.liveHomeScore} - ${matchLiveState.liveAwayScore}`;
      if (htStats && md) {
        htStats.textContent = `支配率 ${md.homePossession}% : ${md.awayPossession}% ｜ シュート ${matchLiveState.liveHomeShots} : ${matchLiveState.liveAwayShots}`;
      }
      if (htOverlay) htOverlay.classList.remove('hidden');
      return;
    }

    // ★ 後半90分到達時：試合終了（FULL TIME）➔ サマリーへ
    if (min >= 90 && matchLiveState.status === 'SECOND_HALF') {
      clearInterval(matchLiveState.timerId);
      matchLiveState.timerId = null;
      matchLiveState.status = 'FULLTIME';

      const periodEl = document.getElementById('match-live-period');
      if (periodEl) periodEl.textContent = 'FULL TIME';

      const md = matchLiveState.matchData;
      if (md) {
        const shEl = document.getElementById('match-live-score-home');
        const saEl = document.getElementById('match-live-score-away');
        if (shEl) shEl.textContent = md.homeScore;
        if (saEl) saEl.textContent = md.awayScore;
        appendLiveCommentary(`90'`, `試合終了！ ${md.homeClub.name} ${md.homeScore} - ${md.awayScore} ${md.awayClub.name}`, 'ev-period');
      }

      const btnSummaryFooter = document.getElementById('btn-match-to-summary-footer');
      if (btnSummaryFooter) {
        btnSummaryFooter.classList.remove('hidden');
        btnSummaryFooter.classList.add('btn-match-to-summary-pulse');
      }
      // ユーザーの指示：ボタンを押すまで自動で遷移せず待機する
    }
  }, baseInterval);
}

/**
 * ハーフタイムから後半（45'〜90'）を再開
 */
function resumeSecondHalfMatch() {
  if (matchLiveState.status !== 'HALFTIME') return;
  const htOverlay = document.getElementById('match-halftime-overlay');
  if (htOverlay) htOverlay.classList.add('hidden');

  const popupEl = document.getElementById('match-pitch-event-popup');
  if (popupEl) popupEl.classList.add('hidden');

  matchLiveState.status = 'SECOND_HALF';
  const periodEl = document.getElementById('match-live-period');
  if (periodEl) periodEl.textContent = '後半';

  const ballEl = document.getElementById('match-pitch-ball');
  if (ballEl) {
    ballEl.style.left = '50%';
    ballEl.style.top = '50%';
  }

  appendLiveCommentary(`46'`, '後半キックオフ！', 'ev-period');
  startMatchLiveTimer();
}

/**
 * Phase 2（案A：王道マッチサマリー＆GMレポート画面）へ遷移・描画
 */

/**
 * マッチサマリー用：両チーム全出場選手の詳細採点一覧HTMLを構築
 */
function buildSummaryPlayerRatingsHtml(homeClub, awayClub, md) {
  const getStartersList = (club) => {
    if (!club || !club.players) return [];
    if (club.isPlayer && typeof ensureValidSquadAndStarters === 'function') {
      ensureValidSquadAndStarters(club);
    }
    const starters = club.players.filter(p => p.isStarter && !p.isRetired);
    if (starters.length === 11) return starters;
    if (starters.length > 0) {
      const rest = club.players.filter(p => !starters.some(s => s.id === p.id) && !p.isRetired);
      return starters.concat(rest.slice(0, 11 - starters.length));
    }
    return club.players.slice(0, 11);
  };

  const homeStarters = getStartersList(homeClub);
  const awayStarters = getStartersList(awayClub);
  const homeSubs = (typeof matchLiveState !== 'undefined' && matchLiveState.homeSubs) ? matchLiveState.homeSubs : [];
  const awaySubs = (typeof matchLiveState !== 'undefined' && matchLiveState.awaySubs) ? matchLiveState.awaySubs : [];
  const homeScorers = md.homeScorers || [];
  const awayScorers = md.awayScorers || [];

  const POS_ORDER = {
    GK: 1,
    CB: 2, LB: 3, RB: 4, LWB: 5, RWB: 6,
    DM: 7, CM: 8, LM: 9, RM: 10, AM: 11,
    LW: 12, RW: 13, CF: 14, ST: 15
  };

  const renderClubList = (club, starters, subs, scorers, isHome) => {
    // スタメン11名をポジション順に整列
    const sortedStarters = [...starters].sort((a, b) => {
      const posA = a.assignedPos || a.pos || 'MF';
      const posB = b.assignedPos || b.pos || 'MF';
      return (POS_ORDER[posA] || 99) - (POS_ORDER[posB] || 99);
    });

    const all = sortedStarters.map(p => ({ p, isSub: false })).concat(subs.map(p => ({ p, isSub: true })));
    const rowsHtml = all.map(({ p, isSub }) => {
      const pos = p.assignedPos || p.pos || 'MF';
      const rat = typeof p.lastMatchRating === 'number' ? p.lastMatchRating.toFixed(1) : '6.7';
      const numRat = Number(rat);

      let ratClass = 'summary-rat-mid';
      if (p.isMOM || numRat >= 8.2) ratClass = 'summary-rat-mom';
      else if (numRat >= 7.0) ratClass = 'summary-rat-high';
      else if (numRat < 6.0) ratClass = 'summary-rat-low';

      const goalsCount = scorers.filter(s => s && s.scorer && s.scorer.id === p.id).length;
      const assistsCount = scorers.filter(s => s && s.assister && s.assister.id === p.id).length;

      let eventBadges = '';
      if (goalsCount > 0) eventBadges += `<span class="rating-event-badge goal" title="${goalsCount}得点">⚽${goalsCount > 1 ? goalsCount : ''}</span>`;
      if (assistsCount > 0) eventBadges += `<span class="rating-event-badge assist" title="${assistsCount}アシスト">🅰️${assistsCount > 1 ? assistsCount : ''}</span>`;

      const momBadge = p.isMOM ? '<span class="rating-mom-crown" title="★ MAN OF THE MATCH">👑</span>' : '';
      const subBadge = isSub ? '<span class="rating-sub-tag">SUB</span>' : '';

      return `
        <div class="summary-rating-row ${p.isMOM ? 'is-mom-row' : ''}">
          <div class="rating-row-player">
            <span class="rating-pos-tag pos-${pos}">${pos}</span>
            <span class="rating-squad-num mono">#${p.squadNumber || '-'}</span>
            <span class="rating-player-name text-truncate">${p.name}</span>
            ${subBadge}
            ${eventBadges}
          </div>
          <div class="rating-row-score">
            ${momBadge}
            <span class="summary-rating-pill mono ${ratClass}">${rat}</span>
          </div>
        </div>
      `;
    }).join('');

    const avgRat = (all.reduce((s, x) => s + (x.p.lastMatchRating || 6.7), 0) / Math.max(1, all.length)).toFixed(1);

    return `
      <div class="summary-team-ratings-panel ${club.isPlayer ? 'is-player' : ''}">
        <div class="summary-team-ratings-title">
          <div class="team-title-left">
            ${getClubEmblemSvg(club, 20, 'team-ratings-emblem')}
            <span class="team-title-code mono">${getClubShortCode(club)}</span>
            <span class="team-title-side mono">${isHome ? 'HOME' : 'AWAY'}${club.isPlayer ? ' (YOU)' : ''}</span>
          </div>
          <span class="team-title-avg mono">平均採点: <strong class="accent-green">${avgRat}</strong></span>
        </div>
        <div class="summary-team-ratings-list">
          ${rowsHtml}
        </div>
      </div>
    `;
  };

  return `
    <div class="summary-ratings-grid">
      ${renderClubList(homeClub, homeStarters, homeSubs, homeScorers, true)}
      ${renderClubList(awayClub, awayStarters, awaySubs, awayScorers, false)}
    </div>
  `;
}

/**
 * 公式戦マッチサマリーのHTML文字列を構築（試合直後 ＆ カレンダー振り返り共通）
 * @param {Object} md 試合結果データオブジェクト
 */
function buildMatchSummaryHtml(md) {
  const { homeClub, awayClub, homeScore, awayScore, homePossession, awayPossession, homeShots, awayShots, isPlayerHome, matchIncome, awayBroadcastingFee, playerSupportersDelta } = md;
  const homeScorers = md.homeScorers || [];
  const awayScorers = md.awayScorers || [];

  const myScore = isPlayerHome ? homeScore : awayScore;
  const oppScore = isPlayerHome ? awayScore : homeScore;
  const resType = myScore > oppScore ? 'win' : (myScore < oppScore ? 'lose' : 'draw');
  let resLabel = myScore > oppScore ? 'WIN! 勝利 (+3pt)' : (myScore < oppScore ? 'LOSE 敗戦 (+0pt)' : 'DRAW 引分 (+1pt)');
  if (md.isKnockout) {
    const userWon = Boolean(md.userWon);
    const pkInfo = (md.pkHome != null && md.pkAway != null) ? ` (PK ${md.pkHome}-${md.pkAway})` : '';
    resLabel = userWon ? `WIN! 勝利・次進出${pkInfo}` : `LOSE 惜敗・敗退${pkInfo}`;
  } else if (md.isEuroLeague) {
    resLabel = myScore > oppScore ? 'WIN! 勝利 (+3pt)' : (myScore < oppScore ? 'LOSE 敗戦 (+0pt)' : 'DRAW 引分 (+1pt)');
  }

  const homeScorersHtml = homeScorers.length > 0
    ? homeScorers.slice().sort((a, b) => a.minute - b.minute).map(s => `<div class="scorer-item">⚽ ${s.minute}' ${s.scorer ? s.scorer.name : (s.name || '得点')}</div>`).join('')
    : '<div class="scorer-item" style="color:var(--text-muted);">-</div>';

  const awayScorersHtml = awayScorers.length > 0
    ? awayScorers.slice().sort((a, b) => a.minute - b.minute).map(s => `<div class="scorer-item">⚽ ${s.minute}' ${s.scorer ? s.scorer.name : (s.name || '得点')}</div>`).join('')
    : '<div class="scorer-item" style="color:var(--text-muted);">-</div>';

  // 枠内シュート数・xG・パス数の取得または算出
  const homeOnTarget = typeof md.homeOnTarget === 'number' ? md.homeOnTarget : Math.max(homeScore, Math.min(homeShots, Math.round(homeShots * 0.48)));
  const awayOnTarget = typeof md.awayOnTarget === 'number' ? md.awayOnTarget : Math.max(awayScore, Math.min(awayShots, Math.round(awayShots * 0.48)));
  const homeXg = typeof md.homeXg === 'number' ? md.homeXg : Number((homeScore * 0.72 + homeShots * 0.08).toFixed(2));
  const awayXg = typeof md.awayXg === 'number' ? md.awayXg : Number((awayScore * 0.72 + awayShots * 0.08).toFixed(2));
  const homePasses = typeof md.homePasses === 'number' ? md.homePasses : Math.round(840 * (homePossession / 100));
  const awayPasses = typeof md.awayPasses === 'number' ? md.awayPasses : Math.round(840 * (awayPossession / 100));
  const homePassAccuracy = typeof md.homePassAccuracy === 'number' ? md.homePassAccuracy : 82;
  const awayPassAccuracy = typeof md.awayPassAccuracy === 'number' ? md.awayPassAccuracy : 78;

  const totalShots = Math.max(1, homeShots + awayShots);
  const homeShotsPct = Math.round((homeShots / totalShots) * 100);
  const awayShotsPct = 100 - homeShotsPct;

  const totalXg = Math.max(0.1, homeXg + awayXg);
  const homeXgPct = Math.round((homeXg / totalXg) * 100);
  const awayXgPct = 100 - homeXgPct;

  const totalPasses = Math.max(1, homePasses + awayPasses);
  const homePassesPct = Math.round((homePasses / totalPasses) * 100);
  const awayPassesPct = 100 - homePassesPct;

  // ハイライト一覧
  const highlights = md.highlights || (typeof matchLiveState !== 'undefined' ? matchLiveState.allHighlights : []) || [];
  let highlightsHtml = '';
  if (highlights.length > 0) {
    highlightsHtml = highlights.slice(0, 3).map(h => `<div class="summary-highlight-item"><span class="mono" style="color:#f1c40f;font-weight:700;min-width:26px;">[${h.minute}']</span><span>${h.text}</span></div>`).join('');
  } else {
    if (homeScorers.length > 0 || awayScorers.length > 0) {
      const allScorers = [...homeScorers.map(s => ({ ...s, club: homeClub })), ...awayScorers.map(s => ({ ...s, club: awayClub }))].sort((a,b) => a.minute - b.minute);
      highlightsHtml = allScorers.slice(0, 3).map(s => `<div class="summary-highlight-item"><span class="mono" style="color:#f1c40f;font-weight:700;min-width:26px;">[${s.minute}']</span><span>⚽ GOAL!! ${s.club.name} ${s.scorer ? s.scorer.name : (s.name || '')} が鮮やかなゴールを記録！</span></div>`).join('');
    } else {
      highlightsHtml = `<div class="summary-highlight-item" style="color:var(--text-muted);">両チーム堅い守備で決定機を許さずタイムアップ。</div>`;
    }
  }

  // GM収支＆サポーター増減
  const revenueAmount = isPlayerHome ? (md.matchIncome || 1800) : (md.awayBroadcastingFee || 1600);
  const revenueTypeLabel = isPlayerHome ? '入場料・グッズ' : '放映権分配金';
  const supDelta = typeof md.playerSupportersDelta === 'number' ? md.playerSupportersDelta : (resType === 'win' ? 150 : (resType === 'draw' ? 30 : -40));
  const supSign = supDelta >= 0 ? '+' : '';
  const supColor = supDelta >= 0 ? 'var(--accent-green)' : '#e74c3c';
  const playerClub = getPlayerClub() || (isPlayerHome ? homeClub : awayClub);

  // MOM（最優秀選手）選出
  let momPlayer = md.momPlayer;
  let momClub = md.momClub || homeClub;
  let momRating = md.momRating || '7.5';
  if (!momPlayer && homeClub.players && awayClub.players) {
    const allStarters = homeClub.players.slice(0, 11).map(p => ({ p, club: homeClub }))
      .concat(awayClub.players.slice(0, 11).map(p => ({ p, club: awayClub })));
    allStarters.sort((a, b) => (b.p.lastMatchRating || 6.5) - (a.p.lastMatchRating || 6.5));
    const momEntry = allStarters[0];
    if (momEntry) {
      momPlayer = momEntry.p;
      momClub = momEntry.club;
      momRating = momPlayer && momPlayer.lastMatchRating ? momPlayer.lastMatchRating.toFixed(1) : '7.5';
    }
  }

  const ratingsHtml = buildSummaryPlayerRatingsHtml(homeClub, awayClub, md);

  const scoreHeroHtml = `
    <div class="summary-hero-box">
      <div class="summary-score-row">
        <div class="summary-club-col home ${homeClub.isPlayer ? 'is-player' : ''}">
          <div class="summary-club-header-wrap">
            ${getClubEmblemSvg(homeClub, 22, 'summary-club-emblem')}
            <span class="summary-club-name mono" style="font-weight:800; font-size:15px; letter-spacing:0.05em;">${getClubShortCode(homeClub)}</span>
          </div>
          <span class="mono summary-club-role">HOME ${homeClub.isPlayer ? '(自チーム)' : ''}</span>
        </div>
        <div class="summary-score-center">
          <div class="summary-final-score mono">${homeScore} - ${awayScore}</div>
          <span class="summary-result-pill res-${resType}">${resLabel}</span>
        </div>
        <div class="summary-club-col away ${awayClub.isPlayer ? 'is-player' : ''}">
          <div class="summary-club-header-wrap">
            <span class="summary-club-name mono" style="font-weight:800; font-size:15px; letter-spacing:0.05em;">${getClubShortCode(awayClub)}</span>
            ${getClubEmblemSvg(awayClub, 22, 'summary-club-emblem')}
          </div>
          <span class="mono summary-club-role">AWAY ${awayClub.isPlayer ? '(自チーム)' : ''}</span>
        </div>
      </div>
      <div class="summary-scorers-grid">
        <div class="summary-scorers-col home">${homeScorersHtml}</div>
        <div class="summary-scorers-col away">${awayScorersHtml}</div>
      </div>
    </div>
  `;

  return `
    <div class="summary-wrapper">
      <!-- サマリー内タブ切り替えバー（スタッツ ⇄ 選手採点） -->
      <div class="summary-subnav-bar">
        <button type="button" class="summary-subnav-btn active" data-subnav="stats">
          📊 試合結果・チームスタッツ
        </button>
        <button type="button" class="summary-subnav-btn" data-subnav="ratings">
          ⭐ 全選手評価点一覧
        </button>
      </div>

      <!-- タブ1：チームスタッツ ＆ ハイライト ＆ GM収支（元の左右2列黄金レイアウト） -->
      <div class="summary-tab-pane" id="summary-tab-stats">
        <div class="summary-grid-layout">
          <!-- 左列：スコアボード ＆ スタッツ比較 -->
          <div class="summary-col-left">
            ${scoreHeroHtml}
            <div class="summary-section-card summary-stats-card">
              <div class="summary-section-title">▼ チームスタッツ比較</div>
              <div class="stat-compare-row">
                <div class="stat-compare-labels mono">
                  <span style="color:#2ecc71;">${homePossession}%</span>
                  <span style="color:var(--text-muted);font-size:9.5px;">ポゼッション率 (POSSESSION)</span>
                  <span style="color:#60a5fa;">${awayPossession}%</span>
                </div>
                <div class="stat-compare-bar-track">
                  <div class="stat-bar-home" style="width:${homePossession}%;"></div>
                  <div class="stat-bar-away" style="width:${awayPossession}%;"></div>
                </div>
              </div>
              <div class="stat-compare-row">
                <div class="stat-compare-labels mono">
                  <span style="color:#2ecc71;">${homeShots}本 (${homeOnTarget})</span>
                  <span style="color:var(--text-muted);font-size:9.5px;">シュート / 枠内 (SHOTS / ON TARGET)</span>
                  <span style="color:#60a5fa;">${awayShots}本 (${awayOnTarget})</span>
                </div>
                <div class="stat-compare-bar-track">
                  <div class="stat-bar-home" style="width:${homeShotsPct}%;"></div>
                  <div class="stat-bar-away" style="width:${awayShotsPct}%;"></div>
                </div>
              </div>
              <div class="stat-compare-row">
                <div class="stat-compare-labels mono">
                  <span style="color:#2ecc71;">${homeXg.toFixed(2)}</span>
                  <span style="color:var(--text-muted);font-size:9.5px;">ゴール期待値 (xG)</span>
                  <span style="color:#60a5fa;">${awayXg.toFixed(2)}</span>
                </div>
                <div class="stat-compare-bar-track">
                  <div class="stat-bar-home" style="width:${homeXgPct}%;"></div>
                  <div class="stat-bar-away" style="width:${awayXgPct}%;"></div>
                </div>
              </div>
              <div class="stat-compare-row">
                <div class="stat-compare-labels mono">
                  <span style="color:#2ecc71;">${homePasses}本 [${homePassAccuracy}%]</span>
                  <span style="color:var(--text-muted);font-size:9.5px;">パス数 / 成功率 (PASSES / ACCURACY)</span>
                  <span style="color:#60a5fa;">${awayPasses}本 [${awayPassAccuracy}%]</span>
                </div>
                <div class="stat-compare-bar-track">
                  <div class="stat-bar-home" style="width:${homePassesPct}%;"></div>
                  <div class="stat-bar-away" style="width:${awayPassesPct}%;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右列：ハイライト ＆ GM収支・MOM -->
          <div class="summary-col-right">
            <div class="summary-section-card summary-highlights-card">
              <div class="summary-section-title">▼ マッチハイライト</div>
              <div class="summary-highlights-list">
                ${highlightsHtml}
              </div>
            </div>

            <div class="summary-section-card summary-gm-card">
              <div class="summary-section-title">▼ GM収支＆MOM</div>
              <div class="summary-gm-grid">
                <div class="summary-gm-metric">
                  <span class="gm-metric-label">${revenueTypeLabel}</span>
                  <span class="gm-metric-val" style="color:var(--accent-gold);">+${formatMoney(revenueAmount)}</span>
                </div>
                <div class="summary-gm-metric">
                  <span class="gm-metric-label">サポーター (${playerClub.supporters.toLocaleString()}人)</span>
                  <span class="gm-metric-val" style="color:${supColor};">${supSign}${supDelta.toLocaleString()}人</span>
                </div>
              </div>
              ${momPlayer ? `
                <div class="summary-mom-box">
                  <div class="mom-left">
                    ${typeof getPlayerAvatarHtml === 'function' ? getPlayerAvatarHtml(momPlayer, momClub, 'avatar-sm', 32) : ''}
                    <div class="mom-info">
                      <span class="mom-tag">★ MAN OF THE MATCH</span>
                      <span class="mom-name">${momPlayer.squadNumber ? '#' + momPlayer.squadNumber + ' ' : ''}${momPlayer.name} (${momPlayer.assignedPos || momPlayer.pos})</span>
                    </div>
                  </div>
                  <span class="mom-rating-badge">Rating ${momRating}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- タブ2：全選手評価点一覧 -->
      <div class="summary-tab-pane hidden" id="summary-tab-ratings">
        <div class="summary-mini-score-bar">
          <span class="mini-score-club home mono ${homeClub.isPlayer ? 'accent-green' : ''}">${getClubShortCode(homeClub)}</span>
          <span class="mini-score-nums mono"><strong>${homeScore} - ${awayScore}</strong></span>
          <span class="mini-score-club away mono ${awayClub.isPlayer ? 'accent-green' : ''}">${getClubShortCode(awayClub)}</span>
          <span class="summary-result-pill res-${resType}" style="margin-left:8px;">${resLabel}</span>
        </div>
        ${ratingsHtml}
      </div>
    </div>
  `;
}

function transitionToMatchSummary() {
  clearMatchLiveTimers();
  matchLiveState.status = 'SUMMARY';

  const phasePitch = document.getElementById('match-phase-pitch');
  const phaseSummary = document.getElementById('match-phase-summary');
  const btnSkip = document.getElementById('btn-match-skip-to-summary');
  const btnClose = document.getElementById('btn-close-match-modal');
  const summaryBody = document.getElementById('match-summary-body');

  if (phasePitch) phasePitch.classList.add('hidden');
  if (phaseSummary) phaseSummary.classList.remove('hidden');
  if (btnSkip) btnSkip.classList.add('hidden');
  if (btnClose) btnClose.classList.add('hidden'); // ユーザー指示：マッチサマリー右上の✕ボタンをなくす
  if (!summaryBody || !matchLiveState.matchData) return;

  const md = matchLiveState.matchData;
  const { homeClub, awayClub, homeScore, awayScore, homePossession, awayPossession, homeShots, awayShots, isPlayerHome, matchIncome, awayBroadcastingFee, playerSupportersDelta } = md;
  const homeScorers = matchLiveState.homeScorers || [];
  const awayScorers = matchLiveState.awayScorers || [];

  const myScore = isPlayerHome ? homeScore : awayScore;
  const oppScore = isPlayerHome ? awayScore : homeScore;
  const resType = myScore > oppScore ? 'win' : (myScore < oppScore ? 'lose' : 'draw');
  let resLabel = myScore > oppScore ? 'WIN! 勝利 (+3pt)' : (myScore < oppScore ? 'LOSE 敗戦 (+0pt)' : 'DRAW 引分 (+1pt)');
  if (md.isKnockout) {
    const userWon = Boolean(md.userWon);
    const pkInfo = (md.pkHome != null && md.pkAway != null) ? ` (PK ${md.pkHome}-${md.pkAway})` : '';
    resLabel = userWon ? `WIN! 勝利・次進出${pkInfo}` : `LOSE 惜敗・敗退${pkInfo}`;
  } else if (md.isEuroLeague) {
    resLabel = myScore > oppScore ? 'WIN! 勝利 (+3pt)' : (myScore < oppScore ? 'LOSE 敗戦 (+0pt)' : 'DRAW 引分 (+1pt)');
  }

  const homeScorersHtml = homeScorers.length > 0
    ? homeScorers.slice().sort((a, b) => a.minute - b.minute).map(s => `<div class="scorer-item">⚽ ${s.minute}' ${s.scorer.name}</div>`).join('')
    : '<div class="scorer-item" style="color:var(--text-muted);">-</div>';

  const awayScorersHtml = awayScorers.length > 0
    ? awayScorers.slice().sort((a, b) => a.minute - b.minute).map(s => `<div class="scorer-item">⚽ ${s.minute}' ${s.scorer.name}</div>`).join('')
    : '<div class="scorer-item" style="color:var(--text-muted);">-</div>';

  // 枠内シュート数・xG・パス数の取得または算出
  const homeOnTarget = typeof md.homeOnTarget === 'number' ? md.homeOnTarget : Math.max(homeScore, Math.min(homeShots, Math.round(homeShots * 0.48)));
  const awayOnTarget = typeof md.awayOnTarget === 'number' ? md.awayOnTarget : Math.max(awayScore, Math.min(awayShots, Math.round(awayShots * 0.48)));
  const homeXg = typeof md.homeXg === 'number' ? md.homeXg : Number((homeScore * 0.72 + homeShots * 0.08).toFixed(2));
  const awayXg = typeof md.awayXg === 'number' ? md.awayXg : Number((awayScore * 0.72 + awayShots * 0.08).toFixed(2));
  const homePasses = typeof md.homePasses === 'number' ? md.homePasses : Math.round(840 * (homePossession / 100));
  const awayPasses = typeof md.awayPasses === 'number' ? md.awayPasses : Math.round(840 * (awayPossession / 100));
  const homePassAccuracy = typeof md.homePassAccuracy === 'number' ? md.homePassAccuracy : 82;
  const awayPassAccuracy = typeof md.awayPassAccuracy === 'number' ? md.awayPassAccuracy : 78;

  const totalShots = Math.max(1, homeShots + awayShots);
  const homeShotsPct = Math.round((homeShots / totalShots) * 100);
  const awayShotsPct = 100 - homeShotsPct;

  const totalXg = Math.max(0.1, homeXg + awayXg);
  const homeXgPct = Math.round((homeXg / totalXg) * 100);
  const awayXgPct = 100 - homeXgPct;

  const totalPasses = Math.max(1, homePasses + awayPasses);
  const homePassesPct = Math.round((homePasses / totalPasses) * 100);
  const awayPassesPct = 100 - homePassesPct;

  // ハイライト一覧（最大3件に絞りスクロールなしで収容）
  const highlights = matchLiveState.allHighlights.slice(0, 3);
  const highlightsHtml = highlights.length > 0
    ? highlights.map(h => `<div class="summary-highlight-item"><span class="mono" style="color:#f1c40f;font-weight:700;min-width:26px;">[${h.minute}']</span><span>${h.text}</span></div>`).join('')
    : `<div class="summary-highlight-item" style="color:var(--text-muted);">両チーム堅い守備で決定機を許さずタイムアップ。</div>`;

  // GM収支＆サポーター増減
  const revenueAmount = isPlayerHome ? matchIncome : (awayBroadcastingFee || 1600);
  const revenueTypeLabel = isPlayerHome ? '入場料・グッズ' : '放映権分配金';
  const supDelta = typeof playerSupportersDelta === 'number' ? playerSupportersDelta : 0;
  const supSign = supDelta >= 0 ? '+' : '';
  const supColor = supDelta >= 0 ? 'var(--accent-green)' : '#e74c3c';
  const playerClub = isPlayerHome ? homeClub : awayClub;

  // MOM（最優秀選手）選出
  const allStarters = homeClub.players.slice(0, 11).map(p => ({ p, club: homeClub }))
    .concat(awayClub.players.slice(0, 11).map(p => ({ p, club: awayClub })));
  allStarters.sort((a, b) => (b.p.lastMatchRating || 6.5) - (a.p.lastMatchRating || 6.5));
  const momEntry = allStarters[0];
  const momPlayer = momEntry ? momEntry.p : null;
  const momClub = momEntry ? momEntry.club : homeClub;
  const momRating = momPlayer && momPlayer.lastMatchRating ? momPlayer.lastMatchRating.toFixed(1) : '7.5';

  summaryBody.innerHTML = buildMatchSummaryHtml(md);

  // サマリー内タブ切り替え（スタッツ ⇄ 選手採点）のイベントバインド
  const tabBtns = summaryBody.querySelectorAll('.summary-subnav-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subnav;
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      const statsView = summaryBody.querySelector('#summary-tab-stats');
      const ratingsView = summaryBody.querySelector('#summary-tab-ratings');
      if (statsView) statsView.classList.toggle('hidden', target !== 'stats');
      if (ratingsView) ratingsView.classList.toggle('hidden', target !== 'ratings');
    });
  });

  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(summaryBody);
  }
}

/**
 * 試合モーダルを閉じて本部画面へ戻る
 */
function closeMatchEventModal() {
  clearMatchLiveTimers();
  matchLiveState.status = 'IDLE';
  gameState.isSimulating = false;

  const modal = document.getElementById('match-event-modal');
  if (modal) modal.classList.add('hidden');

  document.documentElement.classList.remove('modal-locked');
  document.body.classList.remove('modal-locked');

  const cb = matchLiveState.onComplete;
  matchLiveState.onComplete = null;
  if (typeof cb === 'function') {
    cb();
  } else {
    renderAll();
  }
}

/**
 * 試合前 作戦最終確認モーダルの開閉
 */
function closeMatchPrecheckModal() {
  const modal = document.getElementById('match-precheck-modal');
  if (modal) modal.classList.add('hidden');
  document.documentElement.classList.remove('modal-locked');
  document.body.classList.remove('modal-locked');
}

function openMatchPrecheckModal() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;
  const currentDay = getCurrentCalendarDay();
  if (!currentDay || (!currentDay.isMatchDay && !currentDay.isCupMatchDay) || currentDay.played) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  // 自クラブの対戦カードを取得
  const matchInfo = getCalendarDayPlayerMatch(currentDay);
  if (!matchInfo) {
    if (currentDay.isCupMatchDay) {
      // 自クラブの試合がないカップ戦日は自動シミュレーション
      playCurrentCupMatchday(false);
      return;
    }
    return;
  }

  ensureValidSquadAndStarters(playerClub);

  const modal = document.getElementById('match-precheck-modal');
  const body = document.getElementById('precheck-modal-body');
  const weekBadge = document.getElementById('precheck-week-badge');
  if (!modal || !body) {
    playCurrentMatchday(false);
    return;
  }

  if (weekBadge) {
    weekBadge.textContent = matchInfo.title;
  }

  const isHome = matchInfo.isHome;
  const opponentClub = matchInfo.oppClub;
  const oppName = opponentClub ? opponentClub.name : '対戦相手';
  const oppOvr = opponentClub
    ? (opponentClub.players && opponentClub.players.length > 0
        ? Math.round(opponentClub.players.slice(0, 11).reduce((s, p) => s + getPlayerOverallRating(p), 0) / Math.min(11, opponentClub.players.length))
        : (opponentClub.ovr || 75))
    : 70;

  const formationKey = playerClub.formation || '4-3-3';
  const formationDef = getClubFormationDef(playerClub);
  const tacticKey = normalizeTacticKey(playerClub.tactic);
  const tacticDef = TACTICS_DEFINITIONS[tacticKey] || TACTICS_DEFINITIONS.possession;

  // 自チームスタメン情報
  const starters = playerClub.players.filter(p => p.isStarter);
  const homeAvgOvr = starters.length > 0
    ? Math.round(starters.reduce((s, p) => s + getPlayerOverallRating(p), 0) / starters.length)
    : 70;
  const homeTotalAtk = starters.reduce((s, p) => s + (p.atk || 0), 0);
  const homeTotalDef = starters.reduce((s, p) => s + (p.def || 0), 0);
  const homeAvgSta = starters.length > 0
    ? Math.round(starters.reduce((s, p) => s + (p.sta || 100), 0) / starters.length)
    : 100;

  // 各スロットの選手行
  let startersRowsHtml = '';
  formationDef.slots.forEach(slot => {
    const p = playerClub.players.find(x => x.isStarter && x.slotIndex === slot.slotIndex);
    if (!p) return;
    const fitInfo = getPositionFitInfo(p, slot.pos);
    const effOvr = Math.round(getPlayerOverallRating(p) * fitInfo.factor);
    const roleGroup = POS_ROLE_GROUP[slot.pos] || 'MF';
    const isOutOfPos = fitInfo.type !== 'main';

    let fitBadge = '';
    if (fitInfo.type === 'sub') fitBadge = '<span class="precheck-tag" style="background:rgba(56,189,248,0.18);color:#38bdf8;font-size:9px;">◯ 薄適性</span>';
    else if (fitInfo.type === 'semi') fitBadge = '<span class="precheck-tag" style="background:rgba(241,196,15,0.18);color:#f1c40f;font-size:9px;">△ 近接</span>';
    else if (fitInfo.type === 'out') fitBadge = '<span class="precheck-tag" style="background:rgba(231,76,60,0.2);color:#e74c3c;font-size:9px;">✕ 不適</span>';

    const ftgVal = getPlayerFatigue(p);
    const ftgSt = getPlayerFatigueStatus(ftgVal);
    const staColor = p.sta < 60 ? '#e74c3c' : (p.sta < 75 ? '#f1c40f' : 'var(--accent-green)');

    startersRowsHtml += `
      <div class="precheck-player-row ${isOutOfPos ? 'is-warn' : ''}">
        <span class="precheck-pos-badge pos-${roleGroup}">${slot.pos}</span>
        <span class="precheck-num mono">#${p.squadNumber || '-'}</span>
        <span class="precheck-name">${p.name} ${fitBadge}</span>
        <span class="precheck-ovr mono">${effOvr}</span>
        <span class="precheck-sta mono" style="color:${staColor};">ST:${p.sta}</span>
        <span class="precheck-ftg mono" style="color:${ftgSt.color};">疲労:${ftgVal}</span>
      </div>
    `;
  });

  body.innerHTML = `
    <div class="precheck-body-grid">
      <!-- 左列：対戦カード＆作戦概要（余白なくリッチに展開） -->
      <div class="precheck-left-col">
        <!-- 対戦カード概要 -->
        <div class="precheck-hero-card">
          <div class="precheck-card-subhead mono">MATCHDAY FIXTURE</div>
          <div class="precheck-vs-row">
            <div class="precheck-club-box is-player">
              <div class="precheck-club-title-wrap">
                ${getClubEmblemSvg(playerClub, 28, 'precheck-emblem')}
                <span class="precheck-club-name mono" style="font-weight:800; font-size:16px; letter-spacing:0.05em;">${getClubShortCode(playerClub)}</span>
              </div>
              <div class="precheck-club-meta">
                <span class="precheck-club-ovr mono">OVR <strong>${homeAvgOvr}</strong></span>
                <span class="precheck-venue-tag">${isHome ? 'HOME' : 'AWAY'}</span>
              </div>
            </div>
            <div class="precheck-vs-badge">VS</div>
            <div class="precheck-club-box">
              <div class="precheck-club-title-wrap">
                <span class="precheck-club-name mono" style="font-weight:800; font-size:16px; letter-spacing:0.05em;">${getClubShortCode(opponentClub || oppName)}</span>
                ${getClubEmblemSvg(opponentClub || oppName, 28, 'precheck-emblem')}
              </div>
              <div class="precheck-club-meta">
                <span class="precheck-club-ovr mono">OVR <strong>${oppOvr}</strong></span>
                <span class="precheck-venue-tag">${isHome ? 'AWAY' : 'HOME'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 自チーム作戦・戦力設定 -->
        <div class="precheck-tactics-bar">
          <div class="precheck-card-subhead mono">TACTICS & STRENGTH</div>
          <div class="precheck-tactics-info-grid">
            <div class="precheck-tactics-item">
              <span class="precheck-label">陣形:</span>
              <strong class="mono precheck-val-highlight">${formationKey}</strong>
            </div>
            <div class="precheck-tactics-item">
              <span class="precheck-label">戦術:</span>
              <span class="precheck-tag precheck-tag-full">${tacticDef.name}</span>
              <span class="precheck-tag precheck-tag-short">${tacticDef.name.split('（')[0].split('(')[0]}</span>
              <span class="precheck-tag" style="color:#f1c40f;border-color:rgba(241,196,15,0.4);">${tacticDef.badge}</span>
            </div>
          </div>
          <div class="precheck-tactics-aim">
            <span class="mono" style="color:var(--text-muted);font-size:10px;">方針:</span>
            <span>${tacticDef.aim || '攻守のバランスを保ち主導権を握る'}</span>
          </div>
          <div class="precheck-power-metrics">
            <div class="power-metric-box">
              <span class="mono power-lbl">攻撃力</span>
              <span class="mono power-val text-accent">${homeTotalAtk}</span>
            </div>
            <div class="power-metric-box">
              <span class="mono power-lbl">守備力</span>
              <span class="mono power-val text-blue">${homeTotalDef}</span>
            </div>
            <div class="power-metric-box">
              <span class="mono power-lbl">平均ST</span>
              <span class="mono power-val text-gold">${homeAvgSta}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：スタメン11名確認 -->
      <div class="precheck-right-col">
        <div class="precheck-starters-card">
          <div class="precheck-starters-head">
            <span class="precheck-card-subhead mono">STARTING XI (11名)</span>
            <span class="mono" style="font-size:10px;color:var(--text-muted);">適性・スタミナ確認</span>
          </div>
          <div class="precheck-starters-list">
            ${startersRowsHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  // イベントバインド
  const btnClose = document.getElementById('btn-close-precheck-modal');
  if (btnClose) {
    btnClose.onclick = closeMatchPrecheckModal;
  }
  const btnGotoRoster = document.getElementById('btn-precheck-goto-roster');
  if (btnGotoRoster) {
    btnGotoRoster.onclick = () => {
      closeMatchPrecheckModal();
      switchTab('roster');
    };
  }
  const btnStartMatch = document.getElementById('btn-precheck-start-match');
  if (btnStartMatch) {
    btnStartMatch.onclick = () => {
      closeMatchPrecheckModal();
      playCurrentMatchday(false);
    };
  }

  document.documentElement.classList.add('modal-locked');
  document.body.classList.add('modal-locked');
  modal.classList.remove('hidden');
}

/**
 * 試合モーダル（Phase 1: サッカーコート試合経過 ➔ Phase 2: マッチサマリー）を開く
 */
function openMatchEventModal(matchData, homeScorers, awayScorers, onComplete) {
  clearMatchLiveTimers();
  gameState.isSimulating = true;

  document.documentElement.classList.add('modal-locked');
  document.body.classList.add('modal-locked');

  matchLiveState.minute = 0;
  matchLiveState.status = 'FIRST_HALF';
  matchLiveState.speed = appSettings.matchSpeed || 2;
  matchLiveState.matchData = matchData;
  matchLiveState.homeScorers = homeScorers || [];
  matchLiveState.awayScorers = awayScorers || [];
  matchLiveState.liveHomeScore = 0;
  matchLiveState.liveAwayScore = 0;
  matchLiveState.liveHomeShots = 0;
  matchLiveState.liveAwayShots = 0;
  matchLiveState.onComplete = onComplete;

  const { byMinute, highlights } = buildLiveMatchTimeline(matchData, matchLiveState.homeScorers, matchLiveState.awayScorers);
  matchLiveState.timelineByMinute = byMinute;
  matchLiveState.allHighlights = highlights;

  const modal = document.getElementById('match-event-modal');
  const phasePitch = document.getElementById('match-phase-pitch');
  const phaseSummary = document.getElementById('match-phase-summary');
  const btnSkip = document.getElementById('btn-match-skip-to-summary');
  const btnClose = document.getElementById('btn-close-match-modal');
  const btnSummaryFooter = document.getElementById('btn-match-to-summary-footer');
  const htOverlay = document.getElementById('match-halftime-overlay');
  const popupEl = document.getElementById('match-pitch-event-popup');

  if (!modal) {
    gameState.isSimulating = false;
    if (onComplete) onComplete();
    return;
  }

  // ヘッダー情報設定
  const { homeClub, awayClub, week } = matchData;
  const weekBadge = document.getElementById('match-modal-week-badge');
  const venueEl = document.getElementById('match-modal-venue');
  const attEl = document.getElementById('match-modal-attendance');
  const attendance = Math.min(60000, Math.round(homeClub.supporters * 0.95 + randInt(120, 850)));

  if (weekBadge) weekBadge.textContent = matchData.compTitle || `第${week}節 公式戦`;
  if (venueEl) venueEl.textContent = `${homeClub.name}・スタジアム`;
  if (attEl) attEl.textContent = `観客 ${attendance.toLocaleString()}人`;

  // スコアボード初期化
  const homeBox = document.getElementById('match-live-home-box');
  const awayBox = document.getElementById('match-live-away-box');
  const homeName = document.getElementById('match-live-home-name');
  const awayName = document.getElementById('match-live-away-name');
  const homeSub = document.getElementById('match-live-home-sub');
  const awaySub = document.getElementById('match-live-away-sub');
  const shEl = document.getElementById('match-live-score-home');
  const saEl = document.getElementById('match-live-score-away');
  const periodEl = document.getElementById('match-live-period');
  const clockEl = document.getElementById('match-live-clock');

  const hTac = (TACTICS_DEFINITIONS[normalizeTacticKey(homeClub.tactic)] || TACTICS_DEFINITIONS.possession).badge;
  const aTac = (TACTICS_DEFINITIONS[normalizeTacticKey(awayClub.tactic)] || TACTICS_DEFINITIONS.possession).badge;

  if (homeBox) {
    homeBox.classList.toggle('is-player', Boolean(homeClub.isPlayer));
    homeBox.classList.toggle('is-opponent', !homeClub.isPlayer);
  }
  if (awayBox) {
    awayBox.classList.toggle('is-player', Boolean(awayClub.isPlayer));
    awayBox.classList.toggle('is-opponent', !awayClub.isPlayer);
  }
  const youTagHtml = '<span class="match-live-you-tag mono">YOU</span>';
  if (homeName) {
    const playerBadge = homeClub.isPlayer ? youTagHtml : '';
    homeName.innerHTML = `${getClubEmblemSvg(homeClub, 20, 'match-live-emblem')}<span class="match-live-team-name-text mono" style="font-weight:800; font-size:14px; letter-spacing:0.05em;">${getClubShortCode(homeClub)}</span>${playerBadge}`;
  }
  if (awayName) {
    const playerBadge = awayClub.isPlayer ? youTagHtml : '';
    awayName.innerHTML = `${playerBadge}<span class="match-live-team-name-text mono" style="font-weight:800; font-size:14px; letter-spacing:0.05em;">${getClubShortCode(awayClub)}</span>${getClubEmblemSvg(awayClub, 20, 'match-live-emblem')}`;
  }
  if (homeSub) homeSub.textContent = `${homeClub.formation || '4-3-3'} / ${hTac}`;
  if (awaySub) awaySub.textContent = `${awayClub.formation || '4-3-3'} / ${aTac}`;
  if (shEl) shEl.textContent = '0';
  if (saEl) saEl.textContent = '0';
  if (periodEl) periodEl.textContent = '前半';
  if (clockEl) clockEl.textContent = "00'";

  // 表示状態リセット
  if (phasePitch) phasePitch.classList.remove('hidden');
  if (phaseSummary) phaseSummary.classList.add('hidden');
  if (btnSkip) btnSkip.classList.remove('hidden');
  if (btnClose) btnClose.classList.add('hidden');
  if (btnSummaryFooter) btnSummaryFooter.classList.add('hidden');
  if (htOverlay) htOverlay.classList.add('hidden');
  if (popupEl) popupEl.classList.add('hidden');

  const feedEl = document.getElementById('match-live-commentary-feed');
  if (feedEl) feedEl.innerHTML = '';

  // 2Dコート上の選手ピン・ボール初期配置
  setupMatch2DPitchTokens(homeClub, awayClub);
  appendLiveCommentary(`00'`, `前半キックオフ！ ${homeClub.name} vs ${awayClub.name}`, 'ev-period');

  // イベントバインド（初回のみ）
  if (!matchLiveState.eventsBound) {
    matchLiveState.eventsBound = true;

    if (btnSkip) {
      btnSkip.addEventListener('click', () => {
        transitionToMatchSummary();
      });
    }
    const btnResume = document.getElementById('btn-match-resume-second-half');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        resumeSecondHalfMatch();
      });
    }
    if (btnSummaryFooter) {
      btnSummaryFooter.addEventListener('click', () => {
        transitionToMatchSummary();
      });
    }
    const btnSummaryOk = document.getElementById('btn-match-summary-ok');
    if (btnSummaryOk) {
      btnSummaryOk.addEventListener('click', () => {
        closeMatchEventModal();
      });
    }
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        closeMatchEventModal();
      });
    }
    document.querySelectorAll('#match-event-modal .btn-speed').forEach(btn => {
      btn.addEventListener('click', () => {
        const sp = Number(btn.dataset.speed) || 1;
        matchLiveState.speed = sp;
        document.querySelectorAll('#match-event-modal .btn-speed').forEach(b => {
          b.classList.toggle('active', Number(b.dataset.speed) === sp);
        });
        if (matchLiveState.status === 'FIRST_HALF' || matchLiveState.status === 'SECOND_HALF') {
          startMatchLiveTimer();
        }
      });
    });
  }

  document.querySelectorAll('#match-event-modal .btn-speed').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.speed) === matchLiveState.speed);
  });

  modal.classList.remove('hidden');
  startMatchLiveTimer();
}

/**
 * シーズン終了まで一気にスキップ
 */
function skipToSeasonEnd() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;
  stopAdvancingCalendar();
  while (!gameState.isSeasonOver && gameState.currentWeek < gameState.totalWeeks) {
    playNextMatchweek(true);
  }
  if (gameState.calendar && gameState.calendar.length > 0) {
    gameState.currentDayIndex = gameState.calendar.length - 1;
    gameState.calendar.forEach(d => { if (d.isMatchDay) d.played = true; });
  }
  renderAll();
}

/**
 * 試合後のランダムGMイベントおよび欧州メガクラブ強奪オファー判定
 */
function checkPostMatchEvents() {
  // 第19節（前半戦終了・冬の移籍ウインドウ）は欧州メガクラブからの強奪オファーがGMタスク（CRITICAL）に届く
  if (gameState.currentWeek === Math.floor(gameState.totalWeeks / 2)) {
    triggerMegaOfferEvent(true);
    return;
  }

  // 全38節の長丁場に合わせ、通常節は18%の確率でランダムGMイベントが発生（トレーニング＆メディカル施設Lvで負傷率軽減、ゲーゲンプレス時は負傷率微増）
  const playerClub = getPlayerClub();
  const isGegenpress = playerClub && normalizeTacticKey(playerClub.tactic) === 'gegenpress';
  const eventTriggerProb = isGegenpress ? 0.21 : 0.18;
  if (Math.random() < eventTriggerProb) {
    const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
    const baseInjuryThreshold = Math.max(0.10, 0.36 * (1 - (trainingLv - 1) * 0.18));
    const congestion = typeof checkScheduleCongestion === 'function' ? checkScheduleCongestion() : { injuryChanceMultiplier: 1.0 };
    let injuryThreshold = isGegenpress ? Math.min(0.52, baseInjuryThreshold * 1.22) : baseInjuryThreshold;
    injuryThreshold = Math.min(0.60, injuryThreshold * (congestion.injuryChanceMultiplier || 1.0));
    const roll = Math.random();
    if (roll < injuryThreshold) {
      triggerInjuryEvent();
    } else if (roll < 0.68) {
      triggerYouthPromotionEvent();
    } else {
      triggerSupporterPetitionEvent();
    }
  }
}

/**
 * 欧州大陸メガクラブ（EUROPEAN_MEGA_CLUBS）からの強奪オファーを生成し、GMタスク（CRITICAL）へ登録
 */
function triggerMegaOfferEvent(autoOpenModal = false) {
  const playerClub = getPlayerClub();
  if (!playerClub || playerClub.players.length <= 12) return;

  const candidates = [...playerClub.players].sort((a, b) => {
    const scoreA = getPlayerOverallRating(a) + a.goals * 4 + (a.appearances > 0 ? (a.totalRating / a.appearances) * 3 : 0);
    const scoreB = getPlayerOverallRating(b) + b.goals * 4 + (b.appearances > 0 ? (b.totalRating / b.appearances) * 3 : 0);
    return scoreB - scoreA;
  });

  const target = candidates[0];
  if (!target) return;

  const megaClubObj = gameState.europeanMegaClubs[randInt(0, gameState.europeanMegaClubs.length - 1)];
  const baseValue = calculateTransferFee(target);
  // 通常の1.8倍〜2.4倍の破格オファー（ポンド建て）
  const offerAmount = Math.round((baseValue * (1.8 + Math.random() * 0.6)) / 100) * 100;
  const ovr = getPlayerOverallRating(target);
  const avgRating = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : '-';

  gameState.pendingMegaOffer = {
    playerId: target.id,
    playerName: target.name,
    playerPos: target.pos,
    squadNumber: target.squadNumber || 9,
    playerAge: target.age,
    ovr,
    appearances: target.appearances,
    goals: target.goals,
    avgRating,
    megaClubName: megaClubObj.name,
    megaClubCountry: megaClubObj.country,
    offerAmount
  };

  renderAll();

  if (autoOpenModal) {
    openMegaOfferModal();
  }
}

/**
 * GMタスク（CRITICAL）に届いているメガクラブ強奪オファーの決断モーダルを開く
 */
function openMegaOfferModal() {
  const offer = gameState.pendingMegaOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
  if (!target) {
    gameState.pendingMegaOffer = null;
    renderAll();
    return;
  }

  const ovr = getPlayerOverallRating(target);
  const avgRating = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : '-';

  showGmModal({
    category: 'EUROPEAN MEGA TRANSFER OFFER / CRITICAL',
    title: `${offer.megaClubName}から #${target.squadNumber || offer.squadNumber} ${target.name} に対し 移籍金${formatMoney(offer.offerAmount)} の正式オファー`,
    description: `${gameState.gmName} GM、緊急案件です。当クラブの主力 ${target.pos} #${target.squadNumber || offer.squadNumber} ${target.name}（${target.age}歳）に対し、${offer.megaClubCountry}の名門「${offer.megaClubName}」から破格の移籍金 ${formatMoney(offer.offerAmount)} の買取オファーが届きました。受諾して莫大なクラブ資金を得るか、拒否して戦力を維持するか決断してください。`,
    detailHtml: `対象選手：<strong>#${target.squadNumber || offer.squadNumber} [${target.pos}] ${target.name}</strong>（OVR ${ovr} / 今季 ${target.appearances}試合 ${target.goals}得点 / 平均評価 ${avgRating}）<br>買収提示額：<strong class="accent-gold">${formatMoney(offer.offerAmount)}</strong>（即時入金）<br>拒否時の影響：サポーター支持 +250人 ／ 本人のプライド上昇により次回契約更新時の要求年俸が +12% 上昇（契約残年数2年以下へ短縮）`,
    actions: [
      {
        label: `【オファー受諾】売却して移籍金を受領（+${formatMoney(offer.offerAmount)}）`,
        className: 'btn btn-accent',
        onClick: () => {
          acceptPendingMegaOffer();
        }
      },
      {
        label: '【オファー拒否】戦力維持・引き止め（要求年俸上昇 / ファン+250人）',
        className: 'btn btn-primary',
        onClick: () => {
          rejectPendingMegaOffer();
        }
      },
      {
        label: '保留して閉じる（GMタスクからいつでも対応可能）',
        className: 'btn btn-secondary',
        onClick: () => {
          renderAll();
        }
      }
    ]
  });
}

/**
 * メガクラブからの強奪オファーを受諾（選手離脱＋移籍金即時加算）
 */
function acceptPendingMegaOffer() {
  const offer = gameState.pendingMegaOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (target) {
    playerClub.funds += offer.offerAmount;
    playerClub.players = playerClub.players.filter(p => p.id !== target.id);
    ensureValidSquadAndStarters(playerClub);
    gameState.facilityFeedback = `【メガオファー受諾】#${offer.squadNumber} ${offer.playerName} の「${offer.megaClubName}」への完全移籍が成立し、クラブ資金に +${formatMoney(offer.offerAmount)} が即時加算されました。`;
  }

  gameState.pendingMegaOffer = null;
  renderAll();
}

/**
 * メガクラブからの強奪オファーを拒否（戦力維持・モチベーションおよび契約状況に影響）
 */
function rejectPendingMegaOffer() {
  const offer = gameState.pendingMegaOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (target) {
    playerClub.supporters += 250;
    target.megaOfferRejected = true;
    target.contractYears = Math.min(target.contractYears || 2, 2);
    const baseDemand = calculatePlayerDemandSalary(target);
    target.demandedSalary = Math.round((baseDemand * 1.12) / 50) * 50;
    gameState.facilityFeedback = `【メガオファー拒否】「${offer.megaClubName}」からの ${formatMoney(offer.offerAmount)} オファーを拒否し #${target.squadNumber} ${target.name} を引き止めました（要求年俸が ${formatMoney(target.demandedSalary)} に上昇・契約延長交渉が可能）。`;
  }

  gameState.pendingMegaOffer = null;
  renderAll();
}

/**
 * ランダムイベント1「選手の怪我（全治〇試合）」
 */
function triggerInjuryEvent() {
  const playerClub = getPlayerClub();
  const starters = playerClub.players.filter(p => p.isStarter && (p.injuryWeeks || 0) === 0);
  if (starters.length === 0) return;

  const weighted = [];
  for (const p of starters) {
    const weight = p.growthCurve === 'fragile' ? 3 : 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(p);
    }
  }
  const victim = weighted[randInt(0, weighted.length - 1)];
  const weeks = randInt(2, 4);
  const medicalCost = 600; // £600K

  showGmModal({
    category: 'MEDICAL REPORT / INJURY',
    title: `選手の負傷アクシデント（全治${weeks}試合）`,
    description: `トレーニング中に ${victim.pos} ${victim.name}（${victim.age}歳）が筋肉系のトラブルを訴え、全治${weeks}試合の診断を受けました。治療方針を選択してください。`,
    detailHtml: `負傷選手：[${victim.pos}] ${victim.name}（総合力 ${getPlayerOverallRating(victim)}）<br>特別治療費：${formatMoney(medicalCost)}（全治期間を1試合に短縮し能力低下を防止）`,
    actions: [
      {
        label: `欧州専門医の特別治療（-${formatMoney(medicalCost)} / 全治1節に短縮）`,
        className: 'btn btn-primary',
        disabled: playerClub.funds < medicalCost,
        onClick: () => {
          playerClub.funds -= medicalCost;
          victim.injuryWeeks = 1;
          victim.injuryDays = 7;
          renderAll();
        }
      },
      {
        label: `通常リハビリ＆ベンチ休養（費用£0 / 全治${weeks}節）`,
        className: 'btn btn-secondary',
        onClick: () => {
          victim.injuryWeeks = weeks;
          victim.injuryDays = weeks * 7;
          const healthyBench = playerClub.players
            .filter(p => !p.isStarter && (p.injuryWeeks || 0) === 0)
            .sort((a, b) => {
              const aMatch = a.pos === victim.assignedPos ? 1 : 0;
              const bMatch = b.pos === victim.assignedPos ? 1 : 0;
              if (aMatch !== bMatch) return bMatch - aMatch;
              return getPlayerOverallRating(b) - getPlayerOverallRating(a);
            });
          if (healthyBench.length > 0) {
            const sub = healthyBench[0];
            sub.isStarter = true;
            sub.assignedPos = victim.assignedPos || victim.pos;
            victim.isStarter = false;
            victim.assignedPos = null;
          }
          renderAll();
        }
      }
    ]
  });
}

/**
 * ランダムイベント2「若手ユース選手の台頭（無料昇格オファー）」
 */
function triggerYouthPromotionEvent() {
  const playerClub = getPlayerClub();
  const usedNames = new Set();
  gameState.clubs.forEach(c => c.players.forEach(p => usedNames.add(p.name)));

  const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
  const curve = Math.random() < 0.45 ? 'early' : (Math.random() < 0.35 ? 'fragile' : 'standard');
  const prospect = createPlayer(pos, randInt(60, 68), false, usedNames, [17, 18], curve);
  prospect.salary = 800; // £800K
  prospect.contractYears = 4;
  const ovr = getPlayerOverallRating(prospect);
  const isFull = playerClub.players.length >= MAX_SQUAD_SIZE;

  showGmModal({
    category: 'ACADEMY SCOUT REPORT',
    title: '若手ユース選手の台頭（トップチーム無料昇格オファー）',
    description: `クラブの下部組織（アカデミー）にて、10代の有望株 ${prospect.pos} ${prospect.name}（${prospect.age}歳）が眩い才能を発揮しています。移籍金£0・最低年俸${formatMoney(prospect.salary)}でトップチームへ昇格させることができます。`,
    detailHtml: `候補選手：[${prospect.pos}] ${prospect.name}（${prospect.age}歳）<br>能力値：総合 ${ovr}（攻撃 ${prospect.atk} / 守備 ${prospect.def} / スタミナ ${prospect.sta}） / 4年契約・年俸 ${formatMoney(prospect.salary)}`,
    actions: [
      {
        label: isFull ? '所属枠上限（20名）のため昇格不可' : 'トップチームへ無料昇格させる（移籍金 £0）',
        className: 'btn btn-primary',
        disabled: isFull,
        onClick: () => {
          playerClub.players.push(prospect);
          renderAll();
        }
      },
      {
        label: `昇格を見送り提携クラブへ貸出（育成補償金 +${formatMoney(400)}）`,
        className: 'btn btn-secondary',
        onClick: () => {
          playerClub.funds += 400;
          renderAll();
        }
      }
    ]
  });
}

/**
 * ランダムイベント3「サポーターによるスタジアム拡張・ファンイベント嘆願」
 */
function triggerSupporterPetitionEvent() {
  const playerClub = getPlayerClub();
  const investCost = 1200; // £1.2M

  showGmModal({
    category: 'SUPPORTERS UNION PETITION',
    title: 'サポーター連合によるスタジアム設備拡張嘆願',
    description: `熱狂的なサポーター連合から、ホームスタジアムの観客席改修およびホスピタリティ拡充を求める要望書が提出されました。投資を行えばサポーター数が大幅に増加し、今後のホーム戦チケット収入が向上します。`,
    detailHtml: `投資費用：${formatMoney(investCost)}<br>期待効果：サポーター数 +1,300人増加（ホーム19試合のマッチデイ収入が毎試合約 +£120K 増加）`,
    actions: [
      {
        label: `設備投資を実施する（-${formatMoney(investCost)} / サポーター +1,300人）`,
        className: 'btn btn-primary',
        disabled: playerClub.funds < investCost,
        onClick: () => {
          playerClub.funds -= investCost;
          playerClub.supporters += 1300;
          renderAll();
        }
      },
      {
        label: '予算温存のため見送る（サポーター -150人）',
        className: 'btn btn-secondary',
        onClick: () => {
          playerClub.supporters = Math.max(5000, playerClub.supporters - 150);
          renderAll();
        }
      }
    ]
  });
}

/**
 * イベント用モーダルダイアログの表示制御
 */
function showGmModal({ category, title, description, detailHtml, actions }) {
  const overlay = document.getElementById('gm-modal-overlay');
  document.getElementById('modal-category').textContent = category;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-description').textContent = description;
  document.getElementById('modal-detail-box').innerHTML = detailHtml;

  const actionsContainer = document.getElementById('modal-actions');
  actionsContainer.innerHTML = '';

  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = act.className || 'btn btn-primary';
    btn.textContent = act.label;
    if (act.disabled) btn.disabled = true;
    btn.addEventListener('click', () => {
      overlay.classList.add('hidden');
      if (act.onClick) act.onClick();
    });
    actionsContainer.appendChild(btn);
  });

  overlay.classList.remove('hidden');
}

/**
 * 共通インフォポップアップ（施設・戦術などの詳細情報）の表示
 */
function showInfoPopup({ title, tag, bodyHtml }) {
  const overlay = document.getElementById('info-popup-modal');
  if (!overlay) return;

  const tagEl = document.getElementById('info-popup-tag');
  if (tagEl) tagEl.textContent = tag || 'INFO';

  const titleEl = document.getElementById('info-popup-title');
  if (titleEl) titleEl.textContent = title || '詳細情報';

  const bodyEl = document.getElementById('info-popup-body');
  if (bodyEl) bodyEl.innerHTML = bodyHtml || '';

  overlay.classList.remove('hidden');
}

/**
 * 共通インフォポップアップの非表示
 */
function closeInfoPopup() {
  const overlay = document.getElementById('info-popup-modal');
  if (overlay) overlay.classList.add('hidden');
}

/**
 * 施設投資の詳細ポップアップ表示
 */
function showFacilityInfoPopup(facilityKey) {
  const def = FACILITY_DEFINITIONS[facilityKey];
  if (!def) return;
  const playerClub = getPlayerClub();
  const lv = (playerClub && playerClub.facilities && playerClub.facilities[facilityKey]) || 1;
  const isMax = lv >= def.maxLevel;
  const nextCost = isMax ? 0 : def.costs[lv];
  const curEffect = typeof def.getEffectText === 'function' ? def.getEffectText(lv) : '';
  const nextEffect = typeof def.getNextEffectText === 'function' ? def.getNextEffectText(lv) : (isMax ? '最大レベル達成済' : '効果増大');

  const bodyHtml = `
    <div class="info-popup-section">
      <div class="info-popup-meta-row">
        <span class="info-popup-label">現在の効果 (Lv.${lv})</span>
        <strong class="info-popup-value accent-green">${curEffect}</strong>
      </div>
      ${isMax ? '' : `
      <div class="info-popup-meta-row" style="margin-top: 8px;">
        <span class="info-popup-label">次回改修時 (Lv.${lv + 1})</span>
        <strong class="info-popup-value text-cyan">${nextEffect}</strong>
      </div>
      <div class="info-popup-meta-row" style="margin-top: 8px;">
        <span class="info-popup-label">次回改修費用</span>
        <strong class="info-popup-value mono accent-gold">${formatMoney(nextCost)}</strong>
      </div>
      `}
    </div>
    <div class="info-popup-desc-box">
      <h4 class="info-popup-desc-heading">施設概要</h4>
      <p class="info-popup-desc-text">${def.desc}</p>
    </div>
  `;

  showInfoPopup({
    title: def.name,
    tag: `Lv.${lv} / ${def.maxLevel}`,
    bodyHtml
  });
}

/**
 * 戦術スタイルの詳細ポップアップ表示
 */
function showTacticInfoPopup(tacticKey) {
  const normKey = normalizeTacticKey(tacticKey);
  const def = TACTICS_DEFINITIONS[normKey];
  if (!def) return;

  const tacticTags = {
    possession: ['支配率重視', '失点減', 'パス主体'],
    gegenpress: ['前線奪取', '決定機UP', 'スタミナ1.3倍'],
    counter: ['快足速攻', '強豪キラー', '省エネ'],
    wingplay: ['両翼クロス', '中央崩し', 'クロス重視'],
    parkthebus: ['徹底堅守', '失点激減', '引き分け狙い']
  }[normKey] || [];

  const bodyHtml = `
    <div class="info-popup-section">
      <div class="info-popup-meta-row">
        <span class="info-popup-label">🎯 狙い</span>
        <p class="info-popup-desc-text" style="margin: 4px 0 0; color: var(--text-main); font-weight: 500;">${def.aim}</p>
      </div>
      <div class="info-popup-meta-row" style="margin-top: 12px;">
        <span class="info-popup-label">⚡ 効果</span>
        <p class="info-popup-desc-text" style="margin: 4px 0 0; color: var(--accent-green); font-weight: 500;">${def.effect}</p>
      </div>
    </div>
    <div class="info-popup-tags-row">
      ${tacticTags.map(tag => `<span class="tactic-mini-tag tag-${normKey === 'possession' ? 'pos' : (normKey === 'gegenpress' ? 'red' : (normKey === 'counter' ? 'gold' : (normKey === 'wingplay' ? 'cyan' : 'purple')))}">${tag}</span>`).join('')}
    </div>
  `;

  showInfoPopup({
    title: def.name.replace(/（.*）/, ''),
    tag: '戦術スタイル',
    bodyHtml
  });
}

/**
 * 成長曲線（growthCurve）・年齢・トレーニング施設Lvに応じた能力変動値を算出
 */
function computeStatGrowth(player, isPlayerClub = false) {
  const age = player.age;
  const curve = player.growthCurve === 'normal' ? 'standard' : (player.growthCurve || 'standard');

  let atkRange, defRange, staRange;

  if (curve === 'early') {
    if (age <= 23) {
      atkRange = [2, 6];
      defRange = [2, 6];
      staRange = [1, 5];
    } else if (age <= 27) {
      atkRange = [-1, 2];
      defRange = [-1, 2];
      staRange = [-1, 1];
    } else {
      atkRange = [-4, -1];
      defRange = [-4, -1];
      staRange = [-5, -2];
    }
  } else if (curve === 'late') {
    if (age <= 25) {
      atkRange = [0, 2];
      defRange = [0, 2];
      staRange = [0, 2];
    } else if (age <= 31) {
      atkRange = [1, 4];
      defRange = [1, 4];
      staRange = [0, 3];
    } else {
      atkRange = [-2, 1];
      defRange = [-2, 1];
      staRange = [-3, 0];
    }
  } else if (curve === 'fragile') {
    if (age <= 26) {
      atkRange = [1, 5];
      defRange = [1, 5];
      staRange = [-1, 3];
    } else if (age <= 30) {
      atkRange = [0, 3];
      defRange = [0, 3];
      staRange = [-2, 1];
    } else {
      atkRange = [-4, 0];
      defRange = [-4, 0];
      staRange = [-5, -1];
    }
  } else {
    if (age <= 25) {
      atkRange = [1, 4];
      defRange = [1, 4];
      staRange = [0, 4];
    } else if (age <= 29) {
      atkRange = [0, 2];
      defRange = [0, 2];
      staRange = [-1, 2];
    } else if (age === 30) {
      atkRange = [-1, 1];
      defRange = [-1, 1];
      staRange = [-2, 0];
    } else {
      atkRange = [-3, 0];
      defRange = [-3, 0];
      staRange = [-5, -1];
    }
  }

  let dAtk = randInt(atkRange[0], atkRange[1]);
  let dDef = randInt(defRange[0], defRange[1]);
  let dSta = randInt(staRange[0], staRange[1]);

  // レンタル（レンタル放出中）の若手選手は成長率が通常控え時の+30%加速
  if (player.loanStatus && player.loanStatus.isLoanOut) {
    if (dAtk > 0) dAtk = Math.max(dAtk + 1, Math.round(dAtk * 1.30));
    if (dDef > 0) dDef = Math.max(dDef + 1, Math.round(dDef * 1.30));
    if (dSta > 0) dSta = Math.max(dSta + 1, Math.round(dSta * 1.30));
  }

  // トレーニング＆メディカル施設Lvによる若手・成長期ボーナス
  if (isPlayerClub) {
    const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
    if (trainingLv > 1 && age <= 26) {
      const bonusChance = (trainingLv - 1) * 0.25;
      const extraBonus = (trainingLv >= 4 && age <= 22) ? 1 : 0;
      if (Math.random() < bonusChance) dAtk += 1 + extraBonus;
      if (Math.random() < bonusChance) dDef += 1 + extraBonus;
      if (Math.random() < bonusChance) dSta += 1;
    }

    // 指導陣（COACHING STAFF）専門育成補正
    const playerClub = getPlayerClub();
    if (playerClub && playerClub.coaches) {
      const coaches = playerClub.coaches;
      const pos = player.pos;

      // 1. オフェンスコーチ（最大2名）：FW/WG/AMの成長率にボーナス（合算補正）
      if (['CF', 'LW', 'RW', 'AM'].includes(pos) && Array.isArray(coaches.attacking)) {
        coaches.attacking.forEach(c => {
          if (!c) return;
          const bonusAmt = c.rank === 'A' ? 2 : 1;
          const chance = c.rank === 'A' ? 0.70 : (c.rank === 'B' ? 0.50 : 0.35);
          if (Math.random() < chance) dAtk += bonusAmt;
        });
      }

      // 2. ディフェンスコーチ（最大2名）：DF/DMの守備系能力の成長率にボーナス（合算補正）
      if (['CB', 'LB', 'RB', 'DM'].includes(pos) && Array.isArray(coaches.defending)) {
        coaches.defending.forEach(c => {
          if (!c) return;
          const bonusAmt = c.rank === 'A' ? 2 : 1;
          const chance = c.rank === 'A' ? 0.70 : (c.rank === 'B' ? 0.50 : 0.35);
          if (Math.random() < chance) dDef += bonusAmt;
        });
      }

      // 3. GKコーチ（1名）：GKの能力成長速度を大幅に引き上げ
      if (pos === 'GK' && coaches.goalkeeping) {
        const c = coaches.goalkeeping;
        const bonusAmt = c.rank === 'A' ? 3 : (c.rank === 'B' ? 2 : 1);
        dDef += bonusAmt;
        if (Math.random() < 0.6) dSta += 1;
      }

      // 4. フィジカルコーチ（1名）：全選手のフィジカル成長および疲労回復を促進
      if (coaches.fitness) {
        const c = coaches.fitness;
        const bonusAmt = c.rank === 'A' ? 2 : 1;
        const chance = c.rank === 'A' ? 0.65 : (c.rank === 'B' ? 0.45 : 0.30);
        if (Math.random() < chance) dSta += bonusAmt;
      }
    }
  }

  return { dAtk, dDef, dSta };
}

/**
 * 33歳以上の選手の現役引退判定
 */
function shouldPlayerRetire(player) {
  if (player.age < 33) return false;
  let baseProb = 0.25;
  if (player.age === 34) baseProb = 0.40;
  else if (player.age === 35) baseProb = 0.60;
  else if (player.age >= 36) baseProb = 0.82;

  if (player.growthCurve === 'late') baseProb -= 0.15;
  if (player.growthCurve === 'early') baseProb += 0.12;

  return Math.random() < baseProb;
}

/**
 * シーズン終了時の処理（賞金・スポンサー収入加算・目標順位評価・加齢・成長・契約年数-1・引退・移籍市場）
 */
function processSeasonEnd(isSkipped = false) {
  gameState.isSeasonOver = true;
  gameState.selectedPlayerId = null;

  const sortedClubs = getSortedStandings();
  const playerRankIndex = sortedClubs.findIndex(c => c.isPlayer);
  const playerRank = playerRankIndex + 1;
  const playerClub = getPlayerClub();

  let playerPrize = 0;
  let playerSponsorIncome = 0;
  let targetBonus = 0;

  sortedClubs.forEach((club, idx) => {
    const prize = PRIZE_MONEY_TABLE[idx] || 4000;
    const sponsorIncome = Math.round((club.supporters * 0.55) / 10) * 10;
    club.funds += prize + sponsorIncome;

    if (club.isPlayer) {
      playerPrize = prize;
      playerSponsorIncome = sponsorIncome;
      // 理事会目標順位を達成した場合は達成ボーナス支給（+£3.0M）
      if (playerRank <= (club.targetRank || 4)) {
        targetBonus = 3000;
        club.funds += targetBonus;
      }
    }
  });

  const playerAgingLogs = [];
  const playerRetirementLogs = [];

  for (const club of gameState.clubs) {
    for (const p of club.players) {
      p.age += 1;
      p.injuryWeeks = 0;
      p.contractYears = Math.max(0, (p.contractYears || 1) - 1);

      if (shouldPlayerRetire(p)) {
        p.isRetired = true;
        p.isStarter = false;
        if (club.isPlayer) {
          playerRetirementLogs.push(
            `[現役引退] ${p.pos} ${p.name} (${p.age}歳) が現役を引退しました`
          );
        }
        continue;
      }

      const { dAtk, dDef, dSta } = computeStatGrowth(p, club.isPlayer);
      const oldAtk = p.atk;
      const oldDef = p.def;
      const oldSta = p.sta;

      p.atk = clamp(p.atk + dAtk, 1, 99);
      p.def = clamp(p.def + dDef, 1, 99);
      p.sta = clamp(p.sta + dSta, 1, 99);
      p.attributes = null;
      getPlayerFiveAttributes(p);

      p.lastDiff = {
        atk: p.atk - oldAtk,
        def: p.def - oldDef,
        sta: p.sta - oldSta
      };

      if (!club.isPlayer && p.contractYears === 0) {
        p.contractYears = randInt(2, 4);
        p.salary = calculatePlayerSalary(p.pos, p.atk, p.def, p.sta, p.age);
      }

      if (club.isPlayer) {
        const totalDiff = p.lastDiff.atk + p.lastDiff.def + p.lastDiff.sta;
        const sign = totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;
        playerAgingLogs.push({
          name: p.name,
          pos: p.pos,
          age: p.age,
          growthLabel: getGrowthCurveLabel(p.growthCurve),
          totalDiff,
          sign
        });
      }
    }

    club.players = club.players.filter(p => !p.isRetired);
    ensureValidSquadAndStarters(club, playerRetirementLogs);

    // 常設ユースチーム（U-21 Squad）の加齢およびポテンシャル急成長
    if (club.youthSquad && Array.isArray(club.youthSquad)) {
      for (const yp of club.youthSquad) {
        yp.age += 1;
        let boost = 2;
        if (yp.potentialGrade === 'S') boost = randInt(4, 7);
        else if (yp.potentialGrade === 'A') boost = randInt(3, 5);
        else if (yp.potentialGrade === 'B') boost = randInt(2, 4);
        else boost = randInt(1, 2);

        yp.atk = clamp(yp.atk + boost, 1, 99);
        yp.def = clamp(yp.def + boost, 1, 99);
        yp.sta = clamp(yp.sta + boost, 1, 99);
        yp.attributes = null;
        getPlayerFiveAttributes(yp);
      }
      // 21歳を超えてユースに残っている選手（22歳以上）は整理
      club.youthSquad = club.youthSquad.filter(yp => yp.age <= 21);
      // 人数が減った場合は新規有望株を自動スカウト
      while (club.youthSquad.length < 5) {
        const usedNames = new Set(club.players.map(p => p.name).concat(club.youthSquad.map(y => y.name)));
        const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
        club.youthSquad.push(createYouthPlayer(pos, usedNames));
      }
    }

    if (!club.isPlayer) {
      autoSelectStarters(club);
    }
  }

  generateTransferMarket();
  generateYouthAcademyCandidates();
  playerRetirementLogs.push(
    `[ユースアカデミー] 今季のユース昇格候補2名（16〜18歳）が選出されました（「クラブ経営・施設投資」タブから昇格審査が可能）`
  );

  gameState.lastSettlement = {
    season: gameState.season,
    rank: playerRank,
    targetRank: playerClub.targetRank,
    targetLabel: playerClub.targetLabel,
    targetAchieved: playerRank <= playerClub.targetRank,
    targetBonus,
    prize: playerPrize,
    sponsorIncome: playerSponsorIncome,
    totalIncome: playerPrize + playerSponsorIncome + targetBonus,
    retirementLogs: playerRetirementLogs,
    agingLogs: playerAgingLogs
  };

  switchTab('market');

  // 昇降格処理の実行（1部下位3クラブ降格、2部上位3クラブ昇格）
  const promoRelResult = (typeof processPromotionAndRelegation === 'function') ? processPromotionAndRelegation() : null;
  if (promoRelResult && promoRelResult.isPlayerRelegated) {
    showGmModal({
      category: 'BOARD OF DIRECTORS / CRITICAL WARNING',
      title: '【緊急通告】セカンドディビジョン（ENG-D2）への降格処分と最後通告',
      description: `今シーズンの成績不振により、当クラブはイングランド・セカンドディビジョン（ENG-D2）への降格が決定いたしました。理事会は極めて遺憾の意を表明するとともに、来季1年での「ファーストディビジョン（ENG-D1）復帰（昇格）」を絶対厳命といたします。達成できなかった場合は即時解任となります。`,
      detailHtml: `降格クラブ: ${promoRelResult.relegated.join('、')}<br>昇格クラブ: ${promoRelResult.promoted.join('、')}`,
      actions: [
        {
          label: '厳命を受託し、1年でのD1復帰を誓う',
          className: 'btn btn-primary',
          onClick: () => {
            renderAll();
          }
        }
      ]
    });
  }

  // シーズン終了時も海外メガクラブからの強奪オファーがGMタスク（CRITICAL）に届く
  triggerMegaOfferEvent(!isSkipped);
}

/**
 * 選手の活躍度（今季得点・平均評価点・OVR）に応じた要求年俸（単位：£1K）を算出
 */
function calculatePlayerDemandSalary(player) {
  if (player.demandedSalary && player.demandedSalary > 0) {
    return player.demandedSalary;
  }
  const assessed = calculatePlayerSalary(player.pos, player.atk, player.def, player.sta, player.age);
  const goalBonus = (player.goals || 0) * 90;
  const avgRat = player.appearances > 0 ? player.totalRating / player.appearances : 6.4;
  const ratingBonus = player.appearances >= 3 ? Math.max(0, Math.round((avgRat - 6.4) * 400)) : 0;
  const baseDemand = Math.max(assessed, Math.round(player.salary * 1.05)) + goalBonus + ratingBonus;
  const prideFactor = player.megaOfferRejected ? 1.12 : 1.0;
  const demanded = Math.max(800, Math.round((baseDemand * prideFactor) / 50) * 50);
  player.demandedSalary = demanded;
  return demanded;
}

/**
 * 選手の年齢・OVRに応じた希望契約年数（1〜4年）を算出
 */
function calculatePlayerDemandYears(player) {
  if (player.demandedYears && player.demandedYears >= 1 && player.demandedYears <= 4) {
    return player.demandedYears;
  }
  const ovr = getPlayerOverallRating(player);
  let years = 3;
  if (player.age <= 24) {
    years = ovr >= 70 ? 4 : 3;
  } else if (player.age <= 29) {
    years = 3;
  } else if (player.age <= 32) {
    years = 2;
  } else {
    years = 1;
  }
  player.demandedYears = years;
  return years;
}

/**
 * 契約更新交渉モーダルを開く（契約残り1〜2年の自クラブ選手対象）
 */
function openContractNegotiationModal(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub ? playerClub.players.find(p => p.id === playerId) : null;
  if (!target) return;

  closePlayerProfileModal();

  const demandedSalary = calculatePlayerDemandSalary(target);
  const demandedYears = calculatePlayerDemandYears(target);
  const failCount = target.renewalFailCount || 0;
  const isRefused = Boolean(target.contractRefused);

  let statusType = 'info';
  let statusMessage = `代理人：「#${target.squadNumber || '-'} ${target.name} は今季の貢献度と実力（OVR ${getPlayerOverallRating(target)} / ${target.goals}得点）を踏まえ、年俸 ${formatMoney(demandedSalary)}・${demandedYears}年契約を希望しています。」`;

  if (isRefused) {
    statusType = 'error';
    statusMessage = `【交渉打ち切り済】2回連続の条件不一致により、#${target.squadNumber || '-'} ${target.name} の代理人は契約延長交渉を打ち切りました。オフシーズンにフリー移籍での退団が確定しています。`;
  } else if (failCount === 1) {
    statusType = 'warn';
    statusMessage = `【再交渉（残りチャンス1回）】前回の提示額に不満を示し、要求年俸が ${formatMoney(demandedSalary)} に引き上げられています。今回合意できない場合は交渉決裂（フリー流出確定）となります。`;
  }

  gameState.negotiationSession = {
    mode: 'renewal',
    playerId: target.id,
    offeredSalary: demandedSalary,
    offeredYears: demandedYears,
    offeredFee: 0,
    demandedSalary,
    demandedYears,
    demandedFee: 0,
    failCount,
    completed: isRefused,
    statusType,
    statusMessage
  };

  renderNegotiationModal();
  const modalEl = document.getElementById('negotiation-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

/**
 * 移籍市場の獲得交渉モーダルを開く（全クラブ対象）
 */

/**
 * 契約残り半年（1月冬ウィンドウ以降 かつ 残り契約1年以下）の事前合意適格判定
 */
function isPreContractEligible(player) {
  if (!player) return false;
  const playerClub = getPlayerClub();
  if (playerClub && playerClub.players.some(p => p.id === player.id)) return false;
  if (player.isFreeAgent) return false;
  if (player.contractYears > 1) return false;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay) return false;
  // 1月以降（month === 1 または 1〜5月）かつ 契約残り1年以下なら事前合意（ボスマン）対象
  const isPostJanuary = currentDay.month === 1 || (currentDay.month >= 1 && currentDay.month <= 5);
  return isPostJanuary;
}

/**
 * 22歳以下の若手選手のレンタル（レンタル放出）リスト登録トグル
 */
function toggleLoanListing(playerId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return;
  const p = playerClub.players.find(x => x.id === playerId);
  if (!p || p.age > 22) return;

  p.isLoanListed = !p.isLoanListed;
  if (p.isLoanListed) {
    addDailyLog(`【レンタル放出登録】#${p.squadNumber || '-'} ${p.name} (22歳以下) をレンタル放出（レンタル）リストに設定しました。他クラブから打診が届くようになります。`);
    if (typeof showToast === 'function') {
      showToast(`${p.name}をレンタル放出リストに登録しました`);
    }
  } else {
    addDailyLog(`【レンタル放出解除】#${p.squadNumber || '-'} ${p.name} のレンタル放出設定を解除しました。`);
    if (typeof showToast === 'function') {
      showToast(`${p.name}のレンタル放出設定を解除しました`);
    }
  }
  renderAll();
}

/**
 * 移籍ウィンドウ期間中のレンタル打診オファー発生処理
 */
function triggerLoanListingOffers() {
  const playerClub = getPlayerClub();
  if (!playerClub || !Array.isArray(gameState.incomingOffers)) return false;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || !currentDay.windowOpen) return false;
  if (gameState.incomingOffers.length >= 6) return false;

  const listedPlayers = playerClub.players.filter(p => p.isLoanListed && !p.isStarter && !p.isRetired && (!p.loanStatus || !p.loanStatus.isLoanOut));
  if (listedPlayers.length === 0) return false;

  // 約15%の確率で打診オファー発生
  if (Math.random() > 0.18) return false;

  const target = listedPlayers[randInt(0, listedPlayers.length - 1)];
  if (gameState.incomingOffers.some(o => o.playerId === target.id)) return false;

  const cpuClubs = gameState.clubs.filter(c => !c.isPlayer);
  const loanBuyerClub = cpuClubs[randInt(0, cpuClubs.length - 1)];
  const buyerName = loanBuyerClub ? loanBuyerClub.name : '海外クラブ';

  const buyerCountry = loanBuyerClub ? (loanBuyerClub.country || '国内リーグ') : '国内リーグ';
  const ovrVal = getPlayerOverallRating(target);

  const loanOffer = {
    id: `loan_in_${Date.now()}_${target.id}`,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.primaryPosition || target.preferredPosition || target.pos,
    squadNumber: target.squadNumber || 10,
    playerAge: target.age,
    ovr: ovrVal,
    buyerClubId: loanBuyerClub ? loanBuyerClub.id : null,
    buyerClubName: buyerName,
    buyerClubCountry: buyerCountry,
    offerFee: 0,
    offeredFee: 0,
    counterFee: 0,
    wage: target.wage || 20,
    offeredSalary: target.salary || ((target.wage || 20) * 52),
    daysLeft: 5,
    status: 'pending',
    isLoanOffer: true,
    loanCoveragePercent: 100, // 相手クラブが給与100%負担
    createdDayIndex: gameState.currentDayIndex
  };

  gameState.incomingOffers.unshift(loanOffer);
  addDailyLog(`【レンタル打診】${buyerName} からレンタル放出リストの ${target.pos} #${target.squadNumber || '-'} ${target.name} に対し、1年間の期限付き移籍（給与100%相手負担）の打診が届きました！`);
  if (typeof showToast === 'function') {
    showToast(`【レンタル打診】${buyerName}より${target.name}へのレンタルオファーが届きました`);
  }
  return true;
}

/**
 * 1月冬ウィンドウ中の自クラブ主力選手の他クラブ事前合意（ボスマン流出）イベント
 */
function triggerPreContractDepartures() {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || currentDay.month !== 1 || !currentDay.windowOpen) return false;

  // 既に今シーズン事前合意流出が発生済みならスキップ（シーズン最大1名）
  if (gameState.hasPreContractDepartureThisSeason) return false;

  // 対象：契約残り1年以下、未更新、未決裂、主力級
  const eligible = playerClub.players.filter(p => 
    p.contractYears <= 1 && 
    !p.contractRefused && 
    !p.preContractDeparture && 
    !p.isRetired &&
    getPlayerOverallRating(p) >= 70
  );
  if (eligible.length === 0) return false;

  // 1日あたり約3%の低確率
  if (Math.random() > 0.03) return false;

  const target = eligible[randInt(0, eligible.length - 1)];
  const foreignClubs = ['バイエルン', 'レアル・マドリード', 'パリ・サンジェルマン', 'インテル', 'バルセロナ', 'ユヴェントス', 'ドルトムント'];
  const foreignClub = foreignClubs[randInt(0, foreignClubs.length - 1)];

  target.preContractDeparture = {
    toClubName: foreignClub,
    effectiveSeason: (gameState.season || 1) + 1
  };
  target.contractRefused = true; // 今季中のこれ以上の更新は不可に
  gameState.hasPreContractDepartureThisSeason = true;

  addDailyLog(`🚨【事前合意流出】契約最終年の主力 #${target.squadNumber || '-'} ${target.name} が ${foreignClub} と来季の事前合意（ボスマン移籍）に署名しました。今シーズン終了後に移籍金£0で退団します！`);
  if (typeof showToast === 'function') {
    showToast(`【事前合意流出】${target.name}が来季${foreignClub}へのフリー移籍に事前合意しました`);
  }
  return true;
}

function openTransferNegotiationModal(candidateId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  let target = null;
  let sellerClub = null;
  for (const c of gameState.clubs) {
    const p = c.players.find(x => x.id === candidateId);
    if (p) {
      target = p;
      sellerClub = c;
      break;
    }
  }

  if (!target) {
    target = gameState.transferMarket.find(c => c.id === candidateId);
    sellerClub = null;
  }

  if (!target || (sellerClub && sellerClub.isPlayer)) return;

  closePlayerProfileModal();

  const isFreeAgent = Boolean(target.isFreeAgent || (!sellerClub && target.contractYears === 0));
  const isPreContract = !isFreeAgent && isPreContractEligible(target);

  // 取引種別（dealType）の初期決定
  let dealType = 'buy';
  if (isFreeAgent) {
    dealType = 'free_agent';
  }

  const baseOvr = getPlayerOverallRating(target);
  const demandedFee = isFreeAgent ? 0 : calculateTransferFee(target);
  const demandedWage = Math.max(5, Math.round((target.wage || 20) * (isFreeAgent ? 1.05 : 1.15)));
  const demandedSalary = demandedWage * 52;
  const demandedYears = clamp(target.contractYears >= 3 ? 3 : 4, 1, 5);
  const failCount = target.transferFailCount || 0;
  const isRefused = Boolean(target.negotiationFailed);

  const clubName = isFreeAgent ? '無所属 (Free Agent)' : (sellerClub ? sellerClub.name : '相手クラブ');
  let statusType = 'info';
  let statusMessage = `${clubName}は移籍金 ${formatMoney(demandedFee)}、${target.name} 本人は週給 ${formatWage(demandedWage)}（年俸 ${formatMoney(demandedSalary)} ／ ${demandedYears}年契約）を希望しています。`;

  if (isRefused) {
    statusType = 'error';
    statusMessage = `【移籍交渉決裂済】2回連続で合意に至らなかったため、${clubName}および代理人は今ウィンドウでの交渉を打ち切りました。`;
  } else if (failCount === 1) {
    statusType = 'warn';
    statusMessage = `【再オファー（残り1回）】前回の提示条件が不足していたため、相手側の要求条件が引き上げられています。`;
  }

  gameState.negotiationSession = {
    mode: 'transfer',
    dealType: dealType, // 'buy' | 'loan' | 'pre_contract' | 'free_agent'
    isFreeAgent: isFreeAgent,
    isPreContractEligible: isPreContract,
    playerId: target.id,
    sellerClubId: sellerClub ? sellerClub.id : null,
    sellerClubName: clubName,
    offeredWage: demandedWage,
    offeredSalary: demandedSalary,
    offeredYears: demandedYears,
    offeredFee: demandedFee,
    demandedWage,
    demandedSalary,
    demandedYears,
    demandedFee,
    // レンタル用設定
    loanCoveragePercent: 100, // 提示週給負担率 (50%〜100%)
    demandedLoanCoverage: target.age <= 22 ? 70 : 90, // 要求週給負担率
    failCount,
    completed: isRefused,
    statusType,
    statusMessage
  };

  renderNegotiationModal();
  const modalEl = document.getElementById('negotiation-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

/**
 * 交渉モーダル（契約更新 / 移籍獲得）の内容を描画・同期する
 */
function renderNegotiationModal() {
  const session = gameState.negotiationSession;
  if (!session) return;

  const playerClub = getPlayerClub();
  const isRenewal = session.mode === 'renewal';
  let target = null;
  let sellerClub = null;

  if (isRenewal) {
    target = playerClub.players.find(p => p.id === session.playerId) || null;
  } else {
    for (const c of gameState.clubs) {
      const p = c.players.find(x => x.id === session.playerId);
      if (p) {
        target = p;
        sellerClub = c;
        break;
      }
    }
    if (!target) {
      target = gameState.transferMarket.find(c => c.id === session.playerId) || null;
    }
  }

  if (!target) return;

  const ovr = getPlayerOverallRating(target);
  const primaryPos = target.primaryPosition || target.preferredPosition || target.pos;
  const subPosList = Array.isArray(target.secondaryPositions) ? target.secondaryPositions : [];

  const squadNumEl = document.getElementById('neg-squad-num');
  if (squadNumEl) {
    squadNumEl.textContent = isRenewal ? `#${target.squadNumber || 10}` : (session.dealType === 'loan' ? 'LOAN' : 'SIGN');
  }

  const catEl = document.getElementById('neg-modal-category');
  if (catEl) {
    if (isRenewal) {
      catEl.textContent = '契約延長交渉';
    } else if (session.dealType === 'loan') {
      catEl.textContent = `レンタル加入交渉 (${sellerClub ? sellerClub.name : '相手クラブ'})`;
    } else if (session.dealType === 'pre_contract') {
      catEl.textContent = `来季事前合意 (ボスマン) 交渉 (${sellerClub ? sellerClub.name : '相手クラブ'})`;
    } else if (session.dealType === 'free_agent') {
      catEl.textContent = '無所属選手・獲得交渉';
    } else {
      catEl.textContent = `獲得交渉 (${sellerClub ? sellerClub.name : '相手クラブ'})`;
    }
  }

  const posPillEl = document.getElementById('neg-pos-pill');
  if (posPillEl) {
    const subText = subPosList.length > 0 ? ` / ${subPosList.join(', ')}` : '';
    posPillEl.innerHTML = `<span class="profile-pos-badge-main">${primaryPos}${subText}</span>`;
  }

  const titleEl = document.getElementById('neg-modal-title');
  if (titleEl) titleEl.textContent = target.name;

  const metaEl = document.getElementById('neg-player-meta');
  if (metaEl) {
    const avgRat = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : '-';
    if (isRenewal) {
      metaEl.innerHTML = `<span>年齢: <strong>${target.age}歳</strong></span><span>|</span><span>総合力: <strong class="accent-green">OVR ${ovr}</strong></span><span>|</span><span>今季成績: <strong>${target.appearances}試合 ${target.goals}得点</strong></span><span>|</span><span>現給与: <strong class="accent-gold">${formatWage(target.wage)} (残り${target.contractYears}年)</strong></span>`;
    } else {
      const clubDisplay = session.isFreeAgent ? '<strong class="accent-gold">無所属 (Free Agent)</strong>' : `<strong>${sellerClub ? sellerClub.name : '他クラブ'}</strong>`;
      metaEl.innerHTML = `<span>年齢: <strong>${target.age}歳</strong></span><span>|</span><span>所属: ${clubDisplay}</span><span>|</span><span>総合力: <strong class="accent-green">OVR ${ovr}</strong></span><span>|</span><span>現給与: <strong>${formatWage(target.wage)}</strong></span>`;
    }
  }

  const maxFails = 2;
  const remainingTries = Math.max(0, maxFails - (session.failCount || 0));
  let patienceClass = '';
  let patienceLabel = `残り ${remainingTries} 回`;
  if (session.completed && session.statusType === 'success') {
    patienceLabel = '合意成立';
  } else if (remainingTries === 1) {
    patienceClass = 'patience-warn';
    patienceLabel = '最終交渉';
  } else if (remainingTries === 0) {
    patienceClass = 'patience-danger';
    patienceLabel = '交渉決裂';
  }

  // 取引種別トグルバー（移籍モードのみ）
  let dealTypeTabsHtml = '';
  if (!isRenewal) {
    if (session.isFreeAgent) {
      dealTypeTabsHtml = `
        <div class="neg-dealtype-tabs">
          <div class="neg-dealtype-pill active">完全フリー獲得 (移籍金 £0)</div>
        </div>
      `;
    } else {
      const isPreContractOk = session.isPreContractEligible;
      dealTypeTabsHtml = `
        <div class="neg-dealtype-tabs" id="neg-dealtype-group">
          <button type="button" class="btn-dealtype ${session.dealType === 'buy' ? 'active' : ''}" data-deal-type="buy" ${session.completed ? 'disabled' : ''}>
            完全移籍 (BUY)
          </button>
          <button type="button" class="btn-dealtype ${session.dealType === 'loan' ? 'active' : ''}" data-deal-type="loan" ${session.completed ? 'disabled' : ''}>
            レンタル (LOAN)
          </button>
          ${isPreContractOk ? `
            <button type="button" class="btn-dealtype ${session.dealType === 'pre_contract' ? 'active' : ''}" data-deal-type="pre_contract" ${session.completed ? 'disabled' : ''} title="残り契約半年・来季7/1加入内定">
              事前合意 (FREE)
            </button>
          ` : ''}
        </div>
      `;
    }
  }

  // スライダー範囲の算出
  const minSalary = Math.max(500, Math.round((session.demandedSalary * 0.65) / 50) * 50);
  const maxSalary = Math.max(minSalary + 1000, Math.round((session.demandedSalary * 1.55) / 50) * 50);

  const minFee = isRenewal ? 0 : Math.max(300, Math.round((session.demandedFee * 0.65) / 100) * 100);
  const maxFee = isRenewal ? 0 : Math.max(minFee + 2000, Math.round((session.demandedFee * 1.45) / 100) * 100);

  // 取引種別に応じた提示コントロール
  let dealControlsHtml = '';

  if (isRenewal) {
    // 契約延長
    const curContractY = target.contractYears || 0;
    const yearsButtonsHtml = [1, 2, 3, 4].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年延長
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示年俸</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatMoney(session.offeredSalary)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''} title="単位：£1K (1000 = £1.0M)">
        </div>
        <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>要求年俸比: <strong class="mono" id="neg-salary-ratio-text">${Math.round((session.offeredSalary / Math.max(1, session.demandedSalary)) * 100)}%</strong></span>
          <span>増減: £50K</span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">延長契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年延長 (計${curContractY + session.offeredYears}年)</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  } else if (session.dealType === 'loan') {
    // レンタル（LOAN）
    const weeklyWage = target.wage || 20;
    const coverageAmt = Math.round(weeklyWage * (session.loanCoveragePercent / 100));
    dealControlsHtml = `
      ${(() => {
        const ovr = getPlayerOverallRating(target);
        const isStar = ovr >= 78;
        const isStarter = Boolean(target.isStarter && target.age >= 23 && target.age <= 30);
        const isLastY = Boolean(target.contractYears <= 1);
        if (isStar || isStarter || isLastY) {
          const reason = isStar ? '主力スター（OVR 78以上）' : (isStarter ? 'レギュラー先発陣' : '契約最終年');
          return `
            <div class="neg-feedback-box status-warn" style="margin-bottom: 12px; font-size: 11px;">
              <strong>【レンタル獲得困難】</strong> 主力選手のためレンタル不可です。交渉が成立しない可能性が高いため、完全移籍を推奨します。
            </div>
          `;
        }
        return '';
      })()}
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">移籍金</span>
          <span class="neg-control-val accent-green">£0 (レンタル加入)</span>
        </div>
        <div class="text-muted" style="font-size: 11px;">
          相手クラブへの移籍金支払いは発生しません。
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">週給負担率</span>
          <span class="neg-control-val accent-gold" id="neg-loan-coverage-display">${session.loanCoveragePercent}% (${formatWage(coverageAmt)} / 週)</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-loan-slider" class="neg-slider" min="50" max="100" step="5" value="${session.loanCoveragePercent}" ${session.completed ? 'disabled' : ''}>
          <span class="mono text-muted" style="font-size: 12px; width: 60px; text-align: right;">${session.loanCoveragePercent}%</span>
        </div>
        <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>相手側要求負担率: <strong class="mono accent-gold">${session.demandedLoanCoverage}% 以上</strong></span>
          <span>選手現週給: <strong class="mono">${formatWage(weeklyWage)}</strong></span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">レンタル期間</span>
          <span class="mono accent-green"><strong>1シーズン（今季終了まで）</strong></span>
        </div>
        <div class="text-muted" style="font-size: 11px;">
          シーズン終了時に元クラブへ自動復帰します。
        </div>
      </div>
    `;
  } else if (session.dealType === 'pre_contract') {
    // 事前合意（PRE-CONTRACT / ボスマン移籍）
    const yearsButtonsHtml = [2, 3, 4].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年契約
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">移籍金</span>
          <span class="neg-control-val accent-green">£0 (事前合意・移籍金なし)</span>
        </div>
        <div class="text-muted" style="font-size: 11px;">
          契約満了に伴うボスマンルールに基づき、クラブ間移籍金は不要です。
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">来季提示年俸</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatMoney(session.offeredSalary)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
        </div>
        <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>要求年俸比: <strong class="mono" id="neg-salary-ratio-text">${Math.round((session.offeredSalary / Math.max(1, session.demandedSalary)) * 100)}%</strong></span>
          <span>合流時期: <strong class="accent-green">来季7月1日付で合流</strong></span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">来季契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  } else if (session.dealType === 'free_agent') {
    // 完全フリー（無所属選手）
    const yearsButtonsHtml = [1, 2, 3].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年契約
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">移籍金</span>
          <span class="neg-control-val accent-green">£0 (無所属・即時加入)</span>
        </div>
        <div class="text-muted" style="font-size: 11px;">
          所属クラブがないため移籍金£0で即時サイン可能です。
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示年俸</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatMoney(session.offeredSalary)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  } else {
    // 完全移籍 (BUY)
    const yearsButtonsHtml = [1, 2, 3, 4].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年契約
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示移籍金</span>
          <span class="neg-control-val" id="neg-offered-fee-display">${formatMoney(session.offeredFee)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-fee-slider" class="neg-slider" min="${minFee}" max="${maxFee}" step="100" value="${session.offeredFee}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-fee-input" class="neg-num-input" min="${minFee}" max="${maxFee}" step="100" value="${session.offeredFee}" ${session.completed ? 'disabled' : ''} title="単位：£1K (1000 = £1.0M)">
        </div>
        <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>要求額: <strong class="mono">${formatMoney(session.demandedFee)}</strong></span>
          <span>クラブ予算: <strong class="mono ${playerClub.funds < session.offeredFee ? 'text-danger' : 'accent-gold'}">${formatMoney(playerClub.funds)}</strong></span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示年俸</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatMoney(session.offeredSalary)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''} title="単位：£1K (1000 = £1.0M)">
        </div>
        <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
          <span>要求年俸比: <strong class="mono" id="neg-salary-ratio-text">${Math.round((session.offeredSalary / Math.max(1, session.demandedSalary)) * 100)}%</strong></span>
          <span>増減: £50K</span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  }

  // 要求パネルの表示
  let demandRowsHtml = '';
  if (isRenewal) {
    demandRowsHtml = `
      <div class="neg-demand-row">
        <span class="neg-demand-label">現在年俸 / 残契約</span>
        <span class="neg-demand-val">${formatMoney(target.salary)} ／ 残り${target.contractYears || 0}年</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">今季成績</span>
        <span class="neg-demand-val accent-green">${target.appearances}試合 / ${target.goals}G / OVR ${ovr}</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">代理人の要求年俸</span>
        <span class="neg-demand-val accent-gold">${formatMoney(session.demandedSalary)} / 年</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">代理人の要求期間</span>
        <span class="neg-demand-val">${session.demandedYears}年契約</span>
      </div>
    `;
  } else if (session.dealType === 'loan') {
    demandRowsHtml = `
      <div class="neg-demand-row">
        <span class="neg-demand-label">取引種別</span>
        <span class="neg-demand-val accent-green">1シーズン レンタル</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">選手週給</span>
        <span class="neg-demand-val">${formatWage(target.wage)} / 週</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">相手側要求負担率</span>
        <span class="neg-demand-val accent-gold">${session.demandedLoanCoverage}% 以上</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">所属元クラブ</span>
        <span class="neg-demand-val">${sellerClub ? sellerClub.name : '相手クラブ'}</span>
      </div>
    `;
  } else if (session.dealType === 'pre_contract') {
    demandRowsHtml = `
      <div class="neg-demand-row">
        <span class="neg-demand-label">取引種別</span>
        <span class="neg-demand-val accent-green">来季事前合意 (ボスマン)</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">現契約</span>
        <span class="neg-demand-val text-danger">残り半年（今季限りで満了）</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">要求年俸</span>
        <span class="neg-demand-val accent-gold">${formatMoney(session.demandedSalary)} / 年</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">移籍金負担</span>
        <span class="neg-demand-val accent-green">£0 (フリー移籍)</span>
      </div>
    `;
  } else if (session.dealType === 'free_agent') {
    demandRowsHtml = `
      <div class="neg-demand-row">
        <span class="neg-demand-label">所属ステータス</span>
        <span class="neg-demand-val accent-green">無所属 (フリー)</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">希望年俸</span>
        <span class="neg-demand-val accent-gold">${formatMoney(session.demandedSalary)} / 年</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">移籍金負担</span>
        <span class="neg-demand-val accent-green">£0 (即時加入可能)</span>
      </div>
    `;
  } else {
    demandRowsHtml = `
      <div class="neg-demand-row">
        <span class="neg-demand-label">要求移籍金</span>
        <span class="neg-demand-val accent-gold">${formatMoney(session.demandedFee)}${target.contractYears === 1 ? ' (契約最終年)' : ''}</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">要求年俸</span>
        <span class="neg-demand-val accent-green">${formatMoney(session.demandedSalary)} / 年</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">希望期間</span>
        <span class="neg-demand-val">${session.demandedYears}年契約</span>
      </div>
      <div class="neg-demand-row">
        <span class="neg-demand-label">当クラブ予算 / 枠</span>
        <span class="neg-demand-val">${formatMoney(playerClub.funds)} ／ ${playerClub.players.length}/${MAX_SQUAD_SIZE}名</span>
      </div>
    `;
  }

  const bodyEl = document.getElementById('neg-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      ${dealTypeTabsHtml}

      <div class="neg-feedback-box status-${session.statusType}" id="neg-feedback-box">
        ${session.statusMessage}
      </div>

      <div class="neg-grid">
        <!-- 左：相手側（代理人・所属クラブ）の要求条件 -->
        <div class="neg-panel-box">
          <div class="neg-box-header">
            <span class="neg-box-title">${isRenewal ? '要求条件' : '相手側要求'}</span>
            <span class="neg-patience-badge ${patienceClass}">${patienceLabel}</span>
          </div>
          <div class="neg-demand-list">
            ${demandRowsHtml}
          </div>
        </div>

        <!-- 右：GM提示条件コントロール -->
        <div class="neg-panel-box">
          <div class="neg-box-header">
            <span class="neg-box-title">提示条件</span>
            <span class="mono text-muted" style="font-size: 10px;">GBP (£)</span>
          </div>

          ${dealControlsHtml}
        </div>
      </div>
    `;

    // 取引種別タブのイベント登録
    bodyEl.querySelectorAll('.btn-dealtype').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dType = e.currentTarget.dataset.dealType;
        session.dealType = dType;
        if (dType === 'loan') {
          session.offeredFee = 0;
        } else if (dType === 'pre_contract' || dType === 'free_agent') {
          session.offeredFee = 0;
        } else {
          session.offeredFee = session.demandedFee;
        }
        renderNegotiationModal();
      });
    });

    // レンタルスライダーのイベント登録
    const loanSlider = bodyEl.querySelector('#neg-loan-slider');
    if (loanSlider) {
      loanSlider.addEventListener('input', (e) => {
        session.loanCoveragePercent = parseInt(e.target.value, 10);
        const weeklyWage = target.wage || 20;
        const coverageAmt = Math.round(weeklyWage * (session.loanCoveragePercent / 100));
        const disp = document.getElementById('neg-loan-coverage-display');
        if (disp) disp.textContent = `${session.loanCoveragePercent}% (${formatWage(coverageAmt)} / 週)`;
      });
    }
  }

  const submitBtn = document.getElementById('btn-submit-neg-offer');
  const negFooterEl = document.getElementById('neg-modal-footer');
  if (submitBtn) {
    if (session.completed) {
      submitBtn.classList.add('hidden');
      if (negFooterEl) negFooterEl.classList.add('hidden');
    } else {
      submitBtn.classList.remove('hidden');
      if (negFooterEl) negFooterEl.classList.remove('hidden');
      if (isRenewal) {
        submitBtn.textContent = 'この条件で契約延長オファーを提示';
      } else if (session.dealType === 'loan') {
        submitBtn.textContent = 'この条件でレンタルオファーを提示';
      } else if (session.dealType === 'pre_contract') {
        submitBtn.textContent = 'この条件で来季事前合意オファーを提示';
      } else if (session.dealType === 'free_agent') {
        submitBtn.textContent = 'この条件で無所属獲得オファーを提示';
      } else {
        submitBtn.textContent = 'この条件で獲得オファーを提示';
      }
    }
  }
}

/**
 * 交渉モーダルで「オファー提示」をクリックした際の合意/保留/決裂判定ロジック
 */
function submitNegotiationOffer() {
  const session = gameState.negotiationSession;
  if (!session || session.completed) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  if (session.mode === 'renewal') {
    const target = playerClub.players.find(p => p.id === session.playerId);
    if (!target) return;

    const yearDiff = session.offeredYears - session.demandedYears;
    const yearAdjustment = yearDiff >= 0 ? 0.97 : (1 + Math.abs(yearDiff) * 0.04);
    const requiredSalary = Math.round(session.demandedSalary * yearAdjustment);

    if (session.offeredSalary >= requiredSalary) {
      const prevYears = target.contractYears || 0;
      const newContractYears = Math.min(5, prevYears + session.offeredYears);
      target.salary = session.offeredSalary;
      target.contractYears = newContractYears;
      target.renewalFailCount = 0;
      target.demandedSalary = null;
      target.demandedYears = null;
      target.megaOfferRejected = false;
      target.contractRefused = false;

      session.completed = true;
      session.statusType = 'success';
      session.statusMessage = `【合意・契約更新完了】#${target.squadNumber || '-'} ${target.name} は提示条件（年俸 ${formatMoney(session.offeredSalary)} ／ ${session.offeredYears}年契約）に快く合意し、契約更新サインを完了しました！（残契約：${newContractYears}年）`;
      gameState.facilityFeedback = `【契約更新合意】#${target.squadNumber || '-'} ${target.name} と年俸 ${formatMoney(session.offeredSalary)}（${session.offeredYears}年契約締結 / 残り${newContractYears}年）で契約を更新しました。`;
      renderNegotiationModal();
      renderAll();
      return;
    }

    target.renewalFailCount = (target.renewalFailCount || 0) + 1;
    session.failCount = target.renewalFailCount;

    if (target.renewalFailCount >= 2) {
      target.contractRefused = true;
      target.contractYears = Math.min(target.contractYears, 1);
      session.completed = true;
      session.statusType = 'error';
      session.statusMessage = `【交渉決裂・打ち切り】2度目の低額オファー（提示 ${formatMoney(session.offeredSalary)}）に対し、#${target.squadNumber || '-'} ${target.name} 陣営が態度を硬化させ交渉打ち切りを通告しました。オフシーズンにフリー移籍での退団が確定しました。`;
      gameState.facilityFeedback = `【契約交渉決裂】#${target.squadNumber || '-'} ${target.name} との契約延長交渉が決裂しました（オフにフリー流出確定）。`;
    } else {
      const raisedSalary = Math.round((session.demandedSalary * 1.08) / 50) * 50;
      target.demandedSalary = raisedSalary;
      session.demandedSalary = raisedSalary;
      session.offeredSalary = raisedSalary;
      session.statusType = 'warn';
      session.statusMessage = `【不満・保留（要求引き上げ ／ 残り交渉機会1回）】代理人：「提示額（${formatMoney(session.offeredSalary)}）は当方の評価と乖離しています。」態度が硬化し、要求年俸が ${formatMoney(raisedSalary)} へ引き上げられました。次回の提示で合意できない場合、交渉は決裂します。`;
    }

    renderNegotiationModal();
    renderAll();
    return;
  }

  // 移籍市場獲得交渉モード（mode === 'transfer'）
  let target = null;
  let sellerClub = null;
  for (const c of gameState.clubs) {
    const p = c.players.find(x => x.id === session.playerId);
    if (p) {
      target = p;
      sellerClub = c;
      break;
    }
  }
  if (!target) {
    target = gameState.transferMarket.find(c => c.id === session.playerId);
    sellerClub = null;
  }
  if (!target) return;

  if (session.dealType !== 'pre_contract' && playerClub.players.length >= MAX_SQUAD_SIZE) {
    session.statusType = 'error';
    session.statusMessage = `【獲得不可】チームの登録上限（${MAX_SQUAD_SIZE}名）に達しているため獲得できません。先に選手を放出して枠を空けてください。`;
    renderNegotiationModal();
    return;
  }

  const dealType = session.dealType || 'buy';

  if (dealType === 'buy' && playerClub.funds < session.offeredFee) {
    session.statusType = 'error';
    session.statusMessage = `【資金不足】提示移籍金（${formatMoney(session.offeredFee)}）が現在のクラブ資金（${formatMoney(playerClub.funds)}）を超えています。移籍金を調整してください。`;
    renderNegotiationModal();
    return;
  }

  let willAgree = false;
  let demandedFee = session.demandedFee;
  let offeredFee = session.offeredFee;
  let offeredWage = session.offeredWage || Math.round(session.offeredSalary / 52) || 20;
  let demandedWage = session.demandedWage || Math.round(session.demandedSalary / 52) || 20;

  if (dealType === 'loan') {
    // レンタル交渉判定
    offeredFee = 0;
    demandedFee = 0;
    const ovr = getPlayerOverallRating(target);
    const isStarPlayer = ovr >= 78;
    const isKeyRegular = Boolean(target.isStarter && target.age >= 23 && target.age <= 30);
    const isExpiring = Boolean(target.contractYears <= 1);

    if (isStarPlayer || isKeyRegular || isExpiring) {
      // 主力・スター・契約最終年の選手は所属元クラブがレンタル放出を拒否
      willAgree = false;
      const rejectReason = isStarPlayer
        ? 'チームの絶対的主力選手（OVR78以上）のため、レンタル放出は一切認められません。'
        : (isKeyRegular
          ? '現在レギュラー先発陣として不可欠な戦力のため、レンタル放出は認められません。'
          : '契約最終年（残り1年以下）の選手のため、フリー流出防止の観点からレンタルは不可（完全移籍のみ）です。');
      offerObj.rejectionReason = rejectReason;
    } else {
      const requiredCoverage = session.demandedLoanCoverage || 85;
      willAgree = session.loanCoveragePercent >= requiredCoverage;
    }
  } else if (dealType === 'pre_contract') {
    // 事前合意判定
    offeredFee = 0;
    demandedFee = 0;
    const salaryYearFactor = session.offeredYears >= session.demandedYears ? 0.95 : 1.02;
    const requiredWage = Math.round(demandedWage * salaryYearFactor);
    willAgree = offeredWage >= requiredWage;
  } else if (dealType === 'free_agent') {
    // 無所属獲得判定
    offeredFee = 0;
    demandedFee = 0;
    const requiredWage = Math.round(demandedWage * 0.95);
    willAgree = offeredWage >= requiredWage;
  } else {
    // 完全移籍 (BUY)
    const feeThresholdFactor = target.contractYears === 1 ? 0.90 : 0.96;
    const requiredFee = Math.round(demandedFee * feeThresholdFactor);
    const salaryYearFactor = session.offeredYears >= session.demandedYears ? 0.95 : 1.02;
    const requiredWage = Math.round(demandedWage * salaryYearFactor);
    const clubAgreed = offeredFee >= requiredFee;
    const playerAgreed = offeredWage >= requiredWage;
    willAgree = clubAgreed && playerAgreed;
  }

  if (!Array.isArray(gameState.outgoingOffers)) gameState.outgoingOffers = [];
  
  const existingIdx = gameState.outgoingOffers.findIndex(o => o.playerId === target.id && (o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter'));
  const offerObj = {
    id: existingIdx !== -1 ? gameState.outgoingOffers[existingIdx].id : `out_${Date.now()}_${target.id}`,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.primaryPosition || target.preferredPosition || target.pos,
    playerAge: target.age,
    ovr: getPlayerOverallRating(target),
    squadNumber: target.squadNumber || 10,
    sellerClubId: sellerClub ? sellerClub.id : null,
    sellerClubName: sellerClub ? sellerClub.name : (target.isFreeAgent ? '無所属' : 'フリー'),
    dealType: dealType,
    loanCoveragePercent: session.loanCoveragePercent || 100,
    offeredFee: offeredFee,
    offeredWage: offeredWage,
    offeredYears: session.offeredYears,
    demandedFee: demandedFee,
    demandedWage: demandedWage,
    willAgree: willAgree,
    status: 'pending',
    pendingDays: 5,
    createdDayIndex: gameState.currentDayIndex,
    resolvedDayIndex: null
  };

  if (existingIdx !== -1) {
    gameState.outgoingOffers[existingIdx] = offerObj;
  } else {
    gameState.outgoingOffers.unshift(offerObj);
  }

  session.completed = true;
  session.statusType = 'info';

  let typeName = '獲得オファー';
  if (dealType === 'loan') typeName = 'レンタルオファー';
  else if (dealType === 'pre_contract') typeName = '事前合意オファー';
  else if (dealType === 'free_agent') typeName = '無所属獲得オファー';

  session.statusMessage = `【オファー送信完了】${offerObj.sellerClubName}へ ${target.name}の${typeName}を正式提示しました。約5日後に回答が届きます。`;
  addDailyLog(`【オファー提示】${offerObj.sellerClubName}の ${target.pos} ${target.name} へ${typeName}を送信しました（回答待ち）。`);
  if (typeof showToast === 'function') {
    showToast(`${target.name}へ${typeName}を提示しました（送信オファータブで確認可能）`);
  }

  closeNegotiationModal();
  updateMarketBadges();
  renderAll();
}

function updateOutgoingOffersExpiry() {
  if (!Array.isArray(gameState.outgoingOffers) || gameState.outgoingOffers.length === 0) return false;

  let hadResponseToday = false;

  for (const offer of gameState.outgoingOffers) {
    if (offer.status !== 'pending') continue;

    offer.pendingDays = (offer.pendingDays || 1) - 1;
    if (offer.pendingDays <= 0) {
      offer.resolvedDayIndex = gameState.currentDayIndex;
      if (offer.willAgree) {
        offer.status = 'agreed';
        hadResponseToday = true;
        addDailyLog(`【オファー合意！】${offer.sellerClubName} および ${offer.playerName} が移籍条件（移籍金 ${formatMoney(offer.offeredFee)}）に合意しました！「オファー」タブより契約を確定できます。`);
        if (typeof showToast === 'function') {
          showToast(`【オファー合意】${offer.playerName}の獲得交渉が合意に達しました！`);
        }
      } else {
        // 相手クラブからの上乗せ逆オファー（条件吊り上げ）の判定
        // 相手が要求する移籍金が提示額以上の場合、50%の確率で「上乗せ提示（逆オファー）」を返してくる
        const canCounter = offer.demandedFee > offer.offeredFee && !offer.hasCountered;
        if (canCounter && Math.random() < 0.50) {
          offer.status = 'cpu_counter';
          offer.hasCountered = true;
          offer.counterFee = Math.round(Math.max(offer.demandedFee, offer.offeredFee * 1.2) / 100) * 100;
          offer.pendingDays = 3; // 逆オファーへの回答期限
          hadResponseToday = true;
          addDailyLog(`【相手からの増額要求】${offer.sellerClubName} から ${offer.playerName} の移籍金引き上げ要求（${formatMoney(offer.counterFee)}）が届きました。「オファー」タブより承認または拒否を選択してください。`);
          if (typeof showToast === 'function') {
            showToast(`【増額要求】${offer.sellerClubName}より移籍金 ${formatMoney(offer.counterFee)} の逆提示が届きました`);
          }
        } else {
          offer.status = 'rejected';
          hadResponseToday = true;
          const reasonMsg = offer.rejectionReason ? `（理由: ${offer.rejectionReason}）` : '';
          addDailyLog(`【オファー決裂】${offer.sellerClubName} は ${offer.playerName} への${offer.dealType === 'loan' ? 'レンタルオファー' : 'オファー'}を拒絶しました。${reasonMsg}`);
          if (typeof showToast === 'function') {
            showToast(`【オファー拒絶】${offer.sellerClubName}は${offer.dealType === 'loan' ? 'レンタル' : ''}オファーを拒絶しました`);
          }
        }
      }
    }
  }

  updateMarketBadges();
  return hadResponseToday;
}

/**
 * 合意済みの送信オファーの契約締結を完了する（資金支払いと選手加入）
 */
/**
 * 相手クラブからの増額逆提示を承認して合意状態にする
 */
function acceptCpuCounterOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!Array.isArray(gameState.outgoingOffers)) return;

  const offer = gameState.outgoingOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'cpu_counter') return;

  const playerClub = getPlayerClub();
  if (playerClub && playerClub.funds < offer.counterFee) {
    alert(`資金が不足しています（必要額: ${formatMoney(offer.counterFee)} / クラブ資金: ${formatMoney(playerClub.funds)}）`);
    return;
  }

  offer.offeredFee = offer.counterFee;
  offer.status = 'agreed';
  addDailyLog(`【増額要求受諾】${offer.sellerClubName} の提示条件（移籍金 ${formatMoney(offer.offeredFee)}）を受け入れ、獲得合意に達しました！「契約を確定して加入」より正式契約を行えます。`);
  if (typeof showToast === 'function') {
    showToast(`${offer.sellerClubName}の増額提示を承認しました`);
  }
  updateMarketBadges();
  renderAll();
}

function completeOutgoingTransferSigning(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub || !Array.isArray(gameState.outgoingOffers)) return;

  const offer = gameState.outgoingOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'agreed') return;

  const dealType = offer.dealType || 'buy';

  if (dealType !== 'pre_contract' && playerClub.players.length >= MAX_SQUAD_SIZE) {
    alert(`チーム上限枠（${MAX_SQUAD_SIZE}名）に達しているため契約締結できません。選手を放出して枠を空けてください。`);
    return;
  }

  if (dealType === 'buy' && playerClub.funds < offer.offeredFee) {
    alert(`移籍金（${formatMoney(offer.offeredFee)}）に対して資金が不足しています（現在資金: ${formatMoney(playerClub.funds)}）。`);
    return;
  }

  // 対象選手を相手クラブまたは市場から取得
  let target = null;
  let sellerClub = null;
  if (offer.sellerClubId) {
    sellerClub = gameState.clubs.find(c => c.id === offer.sellerClubId);
    if (sellerClub) {
      target = sellerClub.players.find(p => p.id === offer.playerId);
    }
  }
  if (!target) {
    for (const c of gameState.clubs) {
      const p = c.players.find(x => x.id === offer.playerId);
      if (p) {
        target = p;
        sellerClub = c;
        break;
      }
    }
  }
  if (!target) {
    target = gameState.transferMarket.find(c => c.id === offer.playerId);
    sellerClub = null;
  }

  if (!target) {
    alert('対象選手が見つかりませんでした。');
    offer.status = 'cancelled';
    renderAll();
    return;
  }

  if (dealType === 'pre_contract') {
    // 事前合意（来季加入内定）
    if (!Array.isArray(gameState.preContractPlayers)) gameState.preContractPlayers = [];
    
    target.preContract = {
      toClubId: playerClub.id,
      toClubName: playerClub.name,
      effectiveSeason: (gameState.season || 1) + 1,
      wage: offer.offeredWage,
      salary: offer.offeredWage * 52,
      contractYears: offer.offeredYears
    };

    if (!gameState.preContractPlayers.some(p => p.id === target.id)) {
      gameState.preContractPlayers.push(target);
    }

    if (gameState.targetShortlist) {
      gameState.targetShortlist = gameState.targetShortlist.filter(id => id !== target.id);
    }

    offer.status = 'signed';
    addDailyLog(`【事前合意締結完了】${target.pos} ${target.name} と来シーズンの事前合意（ボスマン移籍）を締結しました！来季7月1日付で正式合流（[内定済]）となります。`);
    if (typeof showToast === 'function') {
      showToast(`【事前合意】${target.name}の来季加入内定が成立しました！`);
    }
    updateMarketBadges();
    renderAll();
    return;
  }

  // レンタル・完全移籍・無所属獲得の処理
  if (dealType === 'buy') {
    playerClub.funds -= offer.offeredFee;
    if (sellerClub) {
      sellerClub.funds += offer.offeredFee;
      sellerClub.players = sellerClub.players.filter(p => p.id !== target.id);
      ensureValidSquadAndStarters(sellerClub);
    } else {
      gameState.transferMarket = gameState.transferMarket.filter(p => p.id !== target.id);
    }
    target.wage = offer.offeredWage;
    target.salary = offer.offeredWage * 52;
    target.contractYears = offer.offeredYears;
    target.loanStatus = null;
  } else if (dealType === 'loan') {
    // レンタル加入
    if (sellerClub) {
      sellerClub.players = sellerClub.players.filter(p => p.id !== target.id);
      ensureValidSquadAndStarters(sellerClub);
    } else {
      gameState.transferMarket = gameState.transferMarket.filter(p => p.id !== target.id);
    }
    const weeklyWage = target.wage || 20;
    const coveragePercent = offer.loanCoveragePercent || 100;
    target.wage = Math.max(5, Math.round(weeklyWage * (coveragePercent / 100)));
    target.salary = target.wage * 52;
    target.contractYears = 1;
    target.loanStatus = {
      isLoan: true,
      fromClubId: sellerClub ? sellerClub.id : null,
      fromClubName: sellerClub ? sellerClub.name : '相手クラブ',
      returnYear: (gameState.season || 1) + 1,
      wageCoverage: coveragePercent
    };
  } else if (dealType === 'free_agent') {
    // 無所属獲得
    gameState.transferMarket = gameState.transferMarket.filter(p => p.id !== target.id);
    target.wage = offer.offeredWage;
    target.salary = offer.offeredWage * 52;
    target.contractYears = offer.offeredYears;
    target.loanStatus = null;
    target.isFreeAgent = false;
  }

  target.isStarter = false;
  target.assignedPos = null;
  target.slotIndex = null;
  target.transferFailCount = 0;
  target.negotiationFailed = false;

  const usedNumbers = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
  target.squadNumber = pickAvailableSquadNumber(target.pos, usedNumbers);

  playerClub.players.push(target);
  ensureValidSquadAndStarters(playerClub);

  if (gameState.targetShortlist) {
    gameState.targetShortlist = gameState.targetShortlist.filter(id => id !== target.id);
  }

  offer.status = 'signed';

  if (dealType === 'loan') {
    addDailyLog(`【レンタル加入】${target.pos} #${target.squadNumber} ${target.name} が1年間の期限付き移籍（レンタル）で加入！週給負担率: ${offer.loanCoveragePercent}%。`);
    if (typeof showToast === 'function') {
      showToast(`【レンタル加入】${target.name}が1年ローンで加入しました！`);
    }
  } else if (dealType === 'free_agent') {
    addDailyLog(`【無所属獲得】${target.pos} #${target.squadNumber} ${target.name} が移籍金£0で正式加入！背番号は #${target.squadNumber} です。`);
    if (typeof showToast === 'function') {
      showToast(`【フリー獲得】${target.name}が正式加入しました！`);
    }
  } else {
    addDailyLog(`【新戦力加入】${target.pos} #${target.squadNumber} ${target.name} と正式契約を締結！背番号は #${target.squadNumber} です。`);
    if (typeof showToast === 'function') {
      showToast(`【獲得完了】${target.name}がクラブに正式加入しました！`);
    }
  }

  updateMarketBadges();
  renderAll();
}

/**
 * 送信オファーの撤回・キャンセル
 */
function cancelOutgoingOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!Array.isArray(gameState.outgoingOffers)) return;

  const offer = gameState.outgoingOffers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'cancelled';
  addDailyLog(`【オファー撤回】${offer.sellerClubName}の ${offer.playerName} に対するオファーを撤回しました。`);
  updateMarketBadges();
  renderAll();
}


function triggerIncomingTransferOffer(force = false) {
  const playerClub = getPlayerClub();
  if (!playerClub || playerClub.players.length <= 11) return false;
  if (!Array.isArray(gameState.incomingOffers)) gameState.incomingOffers = [];
  if (!Array.isArray(gameState.outgoingOffers)) gameState.outgoingOffers = [];
  if (!gameState.offersSubtab) gameState.offersSubtab = 'incoming';
  if (gameState.incomingOffers.length >= 6) return false;

  const currentDay = getCurrentCalendarDay();
  if (!force) {
    if (!currentDay || !currentDay.windowOpen) return false;
    // 移籍期間中、1日あたり約14%の確率でオファー発生
    if (Math.random() > 0.14) return false;
  }

  // オファー対象候補：主力選手、得点上位、高OVR選手
  const candidates = [...playerClub.players].filter(p => !p.isRetired);
  if (candidates.length === 0) return false;

  // 既にオファー受信中の選手は除外
  const existingPlayerIds = new Set(gameState.incomingOffers.map(o => o.playerId));
  const availableCandidates = candidates.filter(p => !existingPlayerIds.has(p.id));
  if (availableCandidates.length === 0) return false;

  availableCandidates.sort((a, b) => {
    const scoreA = getPlayerOverallRating(a) * 1.5 + (a.goals || 0) * 4 + (a.age <= 23 ? 10 : 0);
    const scoreB = getPlayerOverallRating(b) * 1.5 + (b.goals || 0) * 4 + (b.age <= 23 ? 10 : 0);
    return scoreB - scoreA;
  });

  const pickPool = availableCandidates.slice(0, Math.min(6, availableCandidates.length));
  const target = pickPool[randInt(0, pickPool.length - 1)];
  if (!target) return false;

  // 買い手クラブ（35%で海外メガクラブ、65%で国内他19クラブ）
  let buyerClubName = '';
  let buyerClubCountry = 'イングランド';
  let buyerClubId = null;
  let isMegaClub = false;

  const otherClubs = gameState.clubs.filter(c => !c.isPlayer);
  if (Math.random() < 0.35 && gameState.europeanMegaClubs && gameState.europeanMegaClubs.length > 0) {
    isMegaClub = true;
    const mega = gameState.europeanMegaClubs[randInt(0, gameState.europeanMegaClubs.length - 1)];
    buyerClubName = mega.name;
    buyerClubCountry = mega.country;
  } else if (otherClubs.length > 0) {
    const cpuClub = otherClubs[randInt(0, otherClubs.length - 1)];
    buyerClubName = cpuClub.name;
    buyerClubCountry = 'イングランド';
    buyerClubId = cpuClub.id;
  } else {
    buyerClubName = 'レアル・マドリード';
    buyerClubCountry = 'スペイン';
    isMegaClub = true;
  }

  const marketVal = calculatePlayerMarketValue(target);
  const isExpiring = (target.contractYears !== undefined ? target.contractYears : 2) <= 1;
  // オファー額算出：通常は市場価値の 0.90倍〜1.35倍。契約残り1年の場合は手堅く0.78倍〜0.92倍（タダ同然の半額は防止）
  const multiplier = isExpiring
    ? (0.78 + Math.random() * 0.14) // 0.78..0.92（市場価値ベースで手堅いオファー）
    : (0.90 + Math.random() * 0.45); // 0.90..1.35
  const baseValue = calculateTransferFee(target);
  let offerFee = Math.round((marketVal * multiplier) / 100) * 100;
  offerFee = clamp(offerFee, 300, 120000); // 最小300k、最大120M
  const counterFee = clamp(Math.round((offerFee * 1.18) / 100) * 100, offerFee + 200, 125000);

  const newOffer = {
    id: 'offer-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    buyerClubName,
    buyerClubCountry,
    buyerClubId,
    isMegaClub,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.pos,
    squadNumber: target.squadNumber || '-',
    playerAge: target.age,
    ovr: getPlayerOverallRating(target),
    wage: target.wage || Math.round((target.salary || 1000) / 52),
    preferredFoot: target.preferredFoot || 'Right',
    baseFee: baseValue,
    offerFee,
    counterFee,
    daysLeft: 5, // 回答期限: 残り5日
    dateStr: currentDay ? currentDay.formattedDate : '',
    status: 'pending'
  };

  gameState.incomingOffers.push(newOffer);
  stopAdvancingCalendar();
  showToast(`【買取オファー着信】${buyerClubName} から ${target.name} に対し 移籍金${formatMoney(offerFee)} の獲得打診が届きました！`, 'info');
  addDailyLog(`【オファー着信】${buyerClubName} から ${target.pos} #${target.squadNumber || '-'} ${target.name} に対し 移籍金${formatMoney(offerFee)} の獲得打診（回答期限: 5日）`);
  updateMarketBadges();
  renderAll();
  return true;
}

/**
 * 日付進行時に受信オファーの回答期限を更新
 */
function updateIncomingOffersExpiry() {
  if (!gameState.incomingOffers || gameState.incomingOffers.length === 0) return false;
  const expired = [];
  const active = [];
  let hadResponseToday = false;

  for (const offer of gameState.incomingOffers) {
    // 上乗せ交渉中のオファーに対する相手クラブの回答判定
    if (offer.status === 'negotiating') {
      offer.pendingDays = (offer.pendingDays || 1) - 1;
      if (offer.pendingDays <= 0) {
        hadResponseToday = true;
        // 成否: 要求額の比率に応じた合意確率 (1.3倍以下なら65%、以上なら35%)
        const ratio = (offer.demandedFee || offer.counterFee) / offer.offerFee;
        const successRate = ratio <= 1.3 ? 0.65 : 0.35;
        const isAgreed = Math.random() < successRate;

        if (isAgreed) {
          offer.status = 'counter_agreed';
          offer.offerFee = offer.demandedFee || offer.counterFee;
          offer.daysLeft = 3; // 合意後、回答期限3日
          addDailyLog(`【上乗せ合意！】${offer.buyerClubName} が ${offer.playerName} の要求移籍金 ${formatMoney(offer.offerFee)} を受け入れました！`);
          if (typeof showToast === 'function') {
            showToast(`【上乗せ合意】${offer.buyerClubName}が要求額を承認しました！`);
          }
          active.push(offer);
        } else {
          // 決裂・相手撤退（履歴として残す）
          offer.status = 'counter_rejected';
          addDailyLog(`【交渉決裂】${offer.buyerClubName} は ${offer.playerName} の増額要求に応じずオファーを撤回しました。`);
          if (typeof showToast === 'function') {
            showToast(`【交渉決裂】${offer.buyerClubName}はオファーを撤回しました`);
          }
          active.push(offer);
        }
        continue;
      } else {
        active.push(offer);
        continue;
      }
    }

    if (offer.status === 'pending' || offer.status === 'counter_agreed') {
      offer.daysLeft -= 1;
      if (offer.daysLeft <= 0) {
        offer.status = 'expired';
        expired.push(offer);
        active.push(offer); // 履歴として残す
      } else {
        active.push(offer);
      }
    } else {
      active.push(offer); // 既に完了・破棄された履歴
    }
  }
  gameState.incomingOffers = active;
  for (const exp of expired) {
    addDailyLog(`【オファー期限切れ】${exp.buyerClubName} からの ${exp.playerName} への移籍打診は回答期限切れとなりました。`);
  }
  updateMarketBadges();
  return hadResponseToday;
}


function acceptIncomingOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.incomingOffers) return;

  const idx = gameState.incomingOffers.findIndex(o => o.id === offerId);
  if (idx === -1) return;
  const offer = gameState.incomingOffers[idx];

  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (!target) {
    offer.status = 'cancelled';
    updateMarketBadges();
    renderAll();
    return;
  }

  // チーム人数が11人以下の場合は売却不可
  if (playerClub.players.length <= 11) {
    alert('チーム人数が11名以下のため、これ以上選手を売却できません。');
    return;
  }

  // レンタル打診（レンタル）の場合
  if (offer.isLoanOffer) {
    target.loanStatus = {
      isLoanOut: true,
      toClubName: offer.buyerClubName,
      returnYear: (gameState.season || 1) + 1
    };
    target.isStarter = false;
    target.assignedPos = null;
    target.slotIndex = null;
    offer.status = 'accepted';
    ensureValidSquadAndStarters(playerClub);

    addDailyLog(`【レンタル放出】#${target.squadNumber || '-'} ${target.name} が ${offer.buyerClubName} への1年間期限付き移籍（レンタル放出）へ旅立ちました！給与は全額相手負担で、シーズン終了後に急成長して復帰します。`);
    if (typeof showToast === 'function') {
      showToast(`【レンタル】${target.name}が${offer.buyerClubName}へレンタル移籍しました`);
    }
    updateMarketBadges();
    renderAll();
    return;
  }

  // 通常売却確定処理
  playerClub.funds += (offer.offerFee || offer.counterFee || 0);
  playerClub.players = playerClub.players.filter(p => p.id !== target.id);
  ensureValidSquadAndStarters(playerClub);

  // 履歴としてステータス更新
  offer.status = 'accepted';

  addDailyLog(`【移籍成立】${target.name} を ${offer.buyerClubName} へ売却しました（移籍金: ${formatMoney(offer.offerFee || offer.counterFee)}）。`);
  if (typeof showToast === 'function') {
    showToast(`【売却完了】${target.name}を${offer.buyerClubName}へ売却しました`);
  }

  updateMarketBadges();
  renderAll();
}

/**
 * 受信オファー拒否（REJECT）
 */
function rejectIncomingOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!gameState.incomingOffers) return;
  const offer = gameState.incomingOffers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'rejected';

  addDailyLog(`【オファー拒絶】${offer.buyerClubName} からの ${offer.playerName} への獲得打診を拒絶しました。`);
  if (typeof showToast === 'function') {
    showToast(`${offer.buyerClubName}からのオファーを拒絶しました`);
  }
  updateMarketBadges();
  renderAll();
}


let activeCounterOfferId = null;

/**
 * 移籍オファー上乗せ要求モーダルを開く
 */
function openCounterOfferModal(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!gameState.incomingOffers) return;
  const offer = gameState.incomingOffers.find(o => o.id === offerId);
  if (!offer || offer.status === 'negotiating') return;

  activeCounterOfferId = offerId;
  const modalEl = document.getElementById('counter-offer-modal');
  if (!modalEl) return;

  const playerClub = getPlayerClub();
  const player = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
  const infoEl = document.getElementById('counter-offer-modal-player-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); border-radius: 6px; padding: 10px 12px;">
        <div>
          <span class="accent-green mono font-bold">[${offer.playerPos}]</span>
          <span style="font-weight: 700; font-size: 14px; margin-left: 4px;">#${offer.squadNumber} ${offer.playerName}</span>
          <span class="text-muted" style="font-size: 11.5px; margin-left: 6px;">(${offer.playerAge}歳 / OVR ${offer.ovr})</span>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #8b949e;">オファー元クラブ</div>
          <div style="font-weight: 700; font-size: 12.5px; color: #e6edf3;">${offer.buyerClubName}</div>
        </div>
      </div>
    `;
  }

  const currentFeeEl = document.getElementById('counter-current-fee');
  if (currentFeeEl) currentFeeEl.textContent = formatMoney(offer.offerFee);

  const slider = document.getElementById('counter-fee-slider');
  if (slider) slider.value = 120;

  // プリセットボタンのリセット
  document.querySelectorAll('.btn-counter-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ratio === '1.20');
  });

  updateCounterOfferModalCalculation(offer.offerFee, 1.20);
  modalEl.classList.remove('hidden');
}

/**
 * 上乗せモーダル内の計算＆表示更新
 */
function updateCounterOfferModalCalculation(baseFee, ratio) {
  const targetFee = Math.round(baseFee * ratio);
  const targetEl = document.getElementById('counter-target-fee');
  if (targetEl) targetEl.textContent = formatMoney(targetFee);

  const chanceEl = document.getElementById('counter-agree-chance');
  if (chanceEl) {
    if (ratio <= 1.15) {
      chanceEl.textContent = '合意期待度: 極めて高 (~85%)';
      chanceEl.className = 'accent-green font-bold';
    } else if (ratio <= 1.25) {
      chanceEl.textContent = '合意期待度: 高 (~70%)';
      chanceEl.className = 'accent-green font-bold';
    } else if (ratio <= 1.40) {
      chanceEl.textContent = '合意期待度: 中 (~45%)';
      chanceEl.className = 'accent-gold font-bold';
    } else {
      chanceEl.textContent = '合意期待度: 低 (~20%)';
      chanceEl.className = 'accent-red font-bold';
    }
  }
}

/**
 * 移籍オファー上乗せ要求モーダルを閉じる
 */
function closeCounterOfferModal() {
  const modalEl = document.getElementById('counter-offer-modal');
  if (modalEl) modalEl.classList.add('hidden');
  activeCounterOfferId = null;
}

/**
 * 上乗せ提示を実行
 */
function submitCounterOffer() {
  if (!activeCounterOfferId || !gameState.incomingOffers) return;
  const offer = gameState.incomingOffers.find(o => o.id === activeCounterOfferId);
  if (!offer) {
    closeCounterOfferModal();
    return;
  }

  const slider = document.getElementById('counter-fee-slider');
  const ratio = slider ? (parseInt(slider.value, 10) / 100) : 1.20;
  const demandedFee = Math.round(offer.offerFee * ratio);

  offer.status = 'negotiating';
  offer.demandedFee = demandedFee;
  offer.pendingDays = 2; // 2日後に相手から合意または決裂の回答

  addDailyLog(`【上乗せ提示】${offer.buyerClubName}へ ${offer.playerName}の移籍金 ${formatMoney(demandedFee)}（+${Math.round((ratio - 1) * 100)}%）を提示しました。回答待ちとなります。`);
  if (typeof showToast === 'function') {
    showToast(`${offer.buyerClubName}へ移籍金 ${formatMoney(demandedFee)} の上乗せ要求を提示しました`);
  }

  closeCounterOfferModal();
  updateMarketBadges();
  renderAll();
}

/**
 * 移籍オファー上乗せ（旧関数名ラッパー）
 */
function counterIncomingOffer(offerId) {
  openCounterOfferModal(offerId);
}


function openIncomingOfferModal() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const modalEl = document.getElementById('incoming-offer-modal');
  if (!modalEl) return;

  const playerClub = getPlayerClub();
  const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
  if (!target && offer.status === 'pending') {
    gameState.incomingTransferOffer = null;
    return;
  }

  // ヘッダー情報
  const squadNumEl = document.getElementById('incoming-offer-squad-num');
  const catEl = document.getElementById('incoming-offer-category');
  const posPill = document.getElementById('incoming-offer-pos-pill');
  const titleEl = document.getElementById('incoming-offer-title');
  const metaEl = document.getElementById('incoming-offer-meta');

  if (squadNumEl) squadNumEl.textContent = `#${offer.squadNumber}`;
  if (catEl) catEl.textContent = offer.isMegaClub ? 'EUROPEAN MEGA BID / CRITICAL' : 'DOMESTIC TRANSFER BID';
  if (posPill) posPill.textContent = offer.playerPos;
  if (titleEl) titleEl.textContent = `${offer.buyerClubName} からの買取オファー`;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>買い手: <strong>${offer.buyerClubName}</strong>${offer.buyerClubCountry ? ` (${offer.buyerClubCountry})` : ''}</span>
      <span>対象: <strong>${offer.playerName}</strong> (${offer.playerAge}歳 / OVR ${offer.ovr})</span>
      <span>現週給: <strong>${formatWage(offer.wage)}</strong></span>
    `;
  }

  renderIncomingOfferBody(offer);
  modalEl.classList.remove('hidden');
}

/**
 * 買取オファー本文および3択アクションの描画
 */
function renderIncomingOfferBody(offer, resultData = null) {
  const bodyEl = document.getElementById('incoming-offer-body');
  if (!bodyEl) return;

  if (resultData) {
    // 増額要求の結果画面
    const isSuccess = resultData.success;
    bodyEl.innerHTML = `
      <div class="incoming-offer-result ${isSuccess ? 'result-success' : 'result-failed'}">
        <div class="result-header mono">
          <span class="result-status-tag ${isSuccess ? 'tag-success' : 'tag-fail'}">${isSuccess ? 'AGREEMENT REACHED' : 'TALKS COLLAPSED'}</span>
          <h3 class="result-title">${isSuccess ? '増額オファー合意！ 移籍成立' : '交渉決裂・相手クラブ撤退'}</h3>
        </div>
        <div class="result-body-text" style="padding: 14px; background: rgba(0,0,0,0.25); border-radius: 6px; line-height: 1.6; font-size: 13px; margin: 12px 0;">
          ${resultData.message}
        </div>
        <div class="incoming-offer-actions mt-3">
          <button type="button" class="btn btn-accent btn-lg" id="btn-close-incoming-result">完了して閉じる</button>
        </div>
      </div>
    `;
    const closeBtn = document.getElementById('btn-close-incoming-result');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeIncomingOfferModal);
    }
    return;
  }

  const diffSign = offer.ratioPercent >= 0 ? `+${offer.ratioPercent}%` : `${offer.ratioPercent}%`;

  bodyEl.innerHTML = `
    <div class="incoming-offer-hero">
      <div class="incoming-offer-fee-box">
        <div class="incoming-fee-label mono">PROPOSED TRANSFER FEE (提示移籍金)</div>
        <div class="incoming-offer-amt mono accent-gold">${formatMoney(offer.offerFee)}</div>
        <div class="incoming-fee-diff mono text-accent">市場推定価格 ${formatMoney(offer.baseFee)} (${diffSign})</div>
      </div>
      <div class="incoming-offer-desc">
        ${offer.buyerClubCountry}の名門クラブ「<strong>${offer.buyerClubName}</strong>」が、当クラブ所属の主力 <strong>${offer.playerPos} #${offer.squadNumber} ${offer.playerName}</strong>（${offer.playerAge}歳 / OVR ${offer.ovr}）の完全移籍を強く希望し、<strong>${formatMoney(offer.offerFee)}</strong> の即時買取オファーを打診してきました。<br>
        GMとして、オファーを承諾して巨額のクラブ資金を得るか、拒否してチームの戦力を死守するか、あるいは強気な増額カウンターを要求するか決断してください。
      </div>
    </div>

    <div class="incoming-offer-actions">
      <button type="button" class="btn btn-accent btn-lg" id="btn-incoming-accept" title="提示額で売却し、資金を獲得します">
        <span class="mono">① ACCEPT</span> 【オファー承諾】売却して資金受領 (+${formatMoney(offer.offerFee)})
      </button>
      <button type="button" class="btn btn-primary btn-lg" id="btn-incoming-counter" title="提示額の1.35倍を要求。50%で合意、50%で破談">
        <span class="mono">② COUNTER</span> 【増額要求】移籍金 ${formatMoney(offer.counterFee)} を逆提案 (勝率50%)
      </button>
      <button type="button" class="btn btn-secondary btn-lg" id="btn-incoming-reject" title="売却を拒否して選手を残留させます">
        <span class="mono">③ REJECT</span> 【売却拒否・残留】オファーを断る (戦力維持)
      </button>
    </div>
  `;

  // ボタンイベント紐付け
  const acceptBtn = document.getElementById('btn-incoming-accept');
  const counterBtn = document.getElementById('btn-incoming-counter');
  const rejectBtn = document.getElementById('btn-incoming-reject');

  if (acceptBtn) acceptBtn.addEventListener('click', acceptIncomingOfferModal);
  if (counterBtn) counterBtn.addEventListener('click', counterDemandIncomingOffer);
  if (rejectBtn) rejectBtn.addEventListener('click', rejectIncomingOfferModal);
}

/**
 * 買取オファーを承諾
 */
function acceptIncomingOfferModal() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const targetIdx = playerClub.players.findIndex(p => p.id === offer.playerId);
  if (targetIdx === -1) {
    closeIncomingOfferModal();
    return;
  }

  const target = playerClub.players.splice(targetIdx, 1)[0];
  playerClub.funds += offer.offerFee;

  // 相手クラブが国内クラブでトップ枠に空きがあれば相手へ移籍
  if (offer.buyerClubId) {
    const buyer = gameState.clubs.find(c => c.id === offer.buyerClubId);
    if (buyer) {
      buyer.funds = Math.max(0, buyer.funds - offer.offerFee);
      target.isStarter = false;
      target.assignedPos = null;
      target.contractYears = 4;
      target.wage = Math.round(target.wage * 1.3);
      target.salary = target.wage * 52;
      buyer.players.push(target);
      ensureValidSquadAndStarters(buyer);
    }
  }

  ensureValidSquadAndStarters(playerClub);

  showToast(`[移籍成立] ${target.name} を ${offer.buyerClubName} へ売却しました（移籍金 +${formatMoney(offer.offerFee)}）`, 'success');
  addDailyLog(`【移籍成立】${target.pos} #${offer.squadNumber} ${target.name} が ${offer.buyerClubName} へ完全移籍（売却益: ${formatMoney(offer.offerFee)}）`);

  closeIncomingOfferModal();
  renderAll();
}

/**
 * 買取オファーを拒否（残留）
 */
function rejectIncomingOfferModal() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  if (playerClub) {
    const target = playerClub.players.find(p => p.id === offer.playerId);
    if (target) {
      target.megaOfferRejected = true;
      target.contractRefused = false;
    }
  }

  showToast(`[オファー拒否] ${offer.buyerClubName} からの買取オファーを拒否し、${offer.playerName} を残留させました。`, 'info');
  addDailyLog(`【オファー拒否】${offer.buyerClubName} からの打診を拒絶。${offer.playerName} の残留を決定`);

  closeIncomingOfferModal();
  renderAll();
}

/**
 * 提示額の約1.35倍を増額要求（50%で超高額合意、50%で相手撤退・破談）
 */
function counterDemandIncomingOffer() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const targetIdx = playerClub.players.findIndex(p => p.id === offer.playerId);
  if (targetIdx === -1) {
    closeIncomingOfferModal();
    return;
  }

  const isSuccess = Math.random() < 0.5;

  if (isSuccess) {
    // 合意・売却
    const target = playerClub.players.splice(targetIdx, 1)[0];
    playerClub.funds += offer.counterFee;

    if (offer.buyerClubId) {
      const buyer = gameState.clubs.find(c => c.id === offer.buyerClubId);
      if (buyer) {
        buyer.funds = Math.max(0, buyer.funds - offer.counterFee);
        target.isStarter = false;
        target.assignedPos = null;
        target.contractYears = 4;
        target.wage = Math.round(target.wage * 1.4);
        target.salary = target.wage * 52;
        buyer.players.push(target);
        ensureValidSquadAndStarters(buyer);
      }
    }
    ensureValidSquadAndStarters(playerClub);

    addDailyLog(`【移籍成立・増額逆提案】${offer.buyerClubName} が当クラブの増額要求を快諾！ ${target.name} を ${formatMoney(offer.counterFee)} で超高額売却しました！`);

    renderIncomingOfferBody(offer, {
      success: true,
      message: `当クラブGMの強気な増額カウンターに対し、<strong>${offer.buyerClubName}</strong> 会長は即座に条件を呑み、要求通りの移籍金 <strong>${formatMoney(offer.counterFee)}</strong> での獲得を正式受託しました！<br>クラブ資金に <strong>+${formatMoney(offer.counterFee)}</strong> が入金され、${target.name} の移籍手続きが完了しました。`
    });
    renderAll();
  } else {
    // 相手クラブ撤退・破談
    const target = playerClub.players[targetIdx];
    if (target) {
      target.megaOfferRejected = true;
    }
    addDailyLog(`【交渉決裂】${offer.buyerClubName} は当クラブの増額要求（${formatMoney(offer.counterFee)}）を法外として交渉から即座に撤退しました。`);

    renderIncomingOfferBody(offer, {
      success: false,
      message: `<strong>${offer.buyerClubName}</strong> は提示された増額要求（<strong>${formatMoney(offer.counterFee)}</strong>）に対し、「過大評価であり妥協の余地はない」として交渉の打ち切りを通告してきました。<br>これにより買取オファーは破談となり、${target.name} は引き続き自クラブへ残留します。`
    });
    renderAll();
  }
}

/**
 * 買取オファーモーダルを閉じる
 */
function closeIncomingOfferModal() {
  const modalEl = document.getElementById('incoming-offer-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
  }
  gameState.incomingTransferOffer = null;
  renderAll();
}

/**
 * 常設U-21ユースチームの選手をトップチームへプロ契約昇格させる
 */
function promoteYouthPlayer(youthId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;

  if (playerClub.players.length >= MAX_SQUAD_SIZE) {
    showToast(`トップチーム枠（最大${MAX_SQUAD_SIZE}名）が満杯です。昇格させるには先に選手を放出またはU-21へ派遣してください。`, 'warning');
    alert(`トップチーム枠（最大${MAX_SQUAD_SIZE}名）が満杯です。`);
    return false;
  }

  const SIGN_FEE = 40; // 初回契約金 £40k
  if (playerClub.funds < SIGN_FEE) {
    alert(`資金不足です。初回プロ契約金 £${SIGN_FEE}k を支払えません。`);
    return false;
  }

  if (!playerClub.youthSquad) {
    playerClub.youthSquad = [];
  }

  const idx = playerClub.youthSquad.findIndex(y => y.id === youthId);
  if (idx === -1) return false;

  playerClub.funds -= SIGN_FEE;
  const youth = playerClub.youthSquad.splice(idx, 1)[0];
  youth.isYouth = false;
  youth.isStarter = false;
  youth.assignedPos = null;
  youth.slotIndex = null;
  youth.contractYears = 3;
  // 週給 £3K〜£6K
  youth.wage = Math.max(3, Math.min(6, Math.round((youth.potentialRating || 70) / 15)));
  youth.salary = youth.wage * 52;
  youth.contractRefused = false;

  ensureClubSquadNumbers(playerClub);
  const usedNumbers = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
  let num = 18;
  while (usedNumbers.has(num) && num < 99) {
    num++;
  }
  youth.squadNumber = num;

  playerClub.players.push(youth);
  ensureValidSquadAndStarters(playerClub);

  showToast(`[ユース昇格] ${youth.pos} #${youth.squadNumber} ${youth.name}（${youth.age}歳）とプロ契約（週給${formatWage(youth.wage)} / 3年）を締結し、トップチームへ昇格させました！`, 'success');
  addDailyLog(`【U-21アカデミー昇格】${youth.pos} #${youth.squadNumber} ${youth.name} がプロ契約締結（初回契約金 £40k / 週給 ${formatWage(youth.wage)} / 3年契約）`);

  renderAll();
  return true;
}

/**
 * トップチームの21歳以下選手を常設U-21ユースチームへ一時派遣（降格）
 */
function demotePlayerToYouth(playerId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const player = playerClub.players.find(p => p.id === playerId);
  if (!player) return;

  if (player.age > 21) {
    showToast(`U-21チームへ合流できるのは21歳以下の選手のみです（現在${player.age}歳）。`, 'warning');
    return;
  }

  if (!playerClub.youthSquad) {
    playerClub.youthSquad = [];
  }

  if (playerClub.youthSquad.length >= MAX_YOUTH_SQUAD_SIZE) {
    showToast(`U-21ユース枠（最大${MAX_YOUTH_SQUAD_SIZE}名）が満杯です。昇格または枠を空けてください。`, 'warning');
    return;
  }

  if (playerClub.players.length <= 11) {
    showToast('トップチームは最低11名必要です。', 'warning');
    return;
  }

  if (player.isStarter) {
    showToast('スタメン選手は降格できません。先にベンチへ移動させてください。', 'warning');
    return;
  }

  const idx = playerClub.players.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    playerClub.players.splice(idx, 1);
  }

  player.isYouth = true;
  player.isStarter = false;
  player.assignedPos = null;
  player.slotIndex = null;
  if (!player.potentialGrade) {
    const ovr = getPlayerOverallRating(player);
    if (ovr >= 74) {
      player.potentialGrade = 'S';
      player.potentialRating = 85;
    } else if (ovr >= 68) {
      player.potentialGrade = 'A';
      player.potentialRating = 80;
    } else if (ovr >= 62) {
      player.potentialGrade = 'B';
      player.potentialRating = 74;
    } else {
      player.potentialGrade = 'C';
      player.potentialRating = 68;
    }
  }

  playerClub.youthSquad.push(player);
  ensureValidSquadAndStarters(playerClub);

  showToast(`[ユース派遣] #${player.squadNumber} ${player.name}（${player.age}歳）を実戦経験のためU-21チームへ合流させました。`, 'info');
  addDailyLog(`【U-21合流】#${player.squadNumber} ${player.name} をU-21ユースチームへ派遣`);

  renderAll();
}

/**
 * 交渉モーダルを閉じる
 */
function closeNegotiationModal() {
  const modalEl = document.getElementById('negotiation-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
  }
  gameState.negotiationSession = null;
}

/**
 * 選手の契約延長ボタン処理（契約更新交渉モーダルを起動）
 */
function extendPlayerContract(playerId) {
  openContractNegotiationModal(playerId);
}

/**
 * 移籍市場から選手を獲得するボタン処理（移籍交渉モーダルを起動）
 */
function signMarketPlayer(candidateId) {
  openTransferNegotiationModal(candidateId);
}

/**
 * 自チームの選手を自由契約（解雇）する
 */
function releaseRosterPlayer(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  if (playerClub.players.length <= 11) {
    return;
  }
  if (target.pos === 'GK' && playerClub.players.filter(p => p.pos === 'GK').length <= 1) {
    return;
  }

  playerClub.players = playerClub.players.filter(p => p.id !== playerId);
  if (gameState.selectedPlayerId === playerId) {
    gameState.selectedPlayerId = null;
  }

  ensureValidSquadAndStarters(playerClub);
  renderAll();
}

/**
 * クラブ施設（スタジアム / トレーニング＆メディカル / グローバルスカウト網）をアップグレードする
 */
function upgradeFacility(facilityKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const def = FACILITY_DEFINITIONS[facilityKey];
  if (!def) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  if (!gameState.facilities) {
    gameState.facilities = { stadium: 1, training: 1, scouting: 1 };
  }

  const currentLv = gameState.facilities[facilityKey] || 1;
  if (currentLv >= def.maxLevel) return;

  const cost = def.costs[currentLv];
  if (playerClub.funds < cost) return;

  playerClub.funds -= cost;
  const nextLv = currentLv + 1;
  gameState.facilities[facilityKey] = nextLv;

  if (facilityKey === 'stadium') {
    playerClub.supporters += 1200;
    const bonusPct = (nextLv - 1) * 15;
    gameState.facilityFeedback = `【設備投資完了】${def.name}を Lv.${nextLv} へ拡張しました（投資額: ${formatMoney(cost)} / ホーム興行収入 +${bonusPct}%・サポーター +1,200人）`;
  } else if (facilityKey === 'training') {
    gameState.facilityFeedback = `【設備投資完了】${def.name}を Lv.${nextLv} へ強化しました（投資額: ${formatMoney(cost)} / 若手成長率UP・負傷率およびスタミナ消耗軽減）`;
  } else if (facilityKey === 'scouting') {
    // スカウト網強化時は即座に新規候補を2名追加リストアップ
    const usedNames = new Set();
    for (const club of gameState.clubs) {
      for (const p of club.players) usedNames.add(p.name);
    }
    for (const c of gameState.transferMarket) usedNames.add(c.name);
    for (const y of (gameState.youthCandidates || [])) usedNames.add(y.name);

    const scoutingBonusOvr = (nextLv - 1) * 2;
    for (let i = 0; i < 2; i++) {
      const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
      const baseTarget = clamp(randInt(64 + scoutingBonusOvr, 74 + scoutingBonusOvr), 58, 86);
      const age = randInt(19, 28);
      const candidate = createPlayer(pos, baseTarget, false, usedNames, [age, age]);
      const ovr = getPlayerOverallRating(candidate);
      const isExpiring = candidate.contractYears === 1;
      candidate.transferFee = calculateTransferFee(candidate);
      gameState.transferMarket.push(candidate);
    }
    gameState.transferMarket.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
    gameState.facilityFeedback = `【設備投資完了】${def.name}を Lv.${nextLv} へ拡大しました（投資額: ${formatMoney(cost)} / 移籍市場に高OVR候補2名を即時追加リストアップ）`;
  }

  renderAll();
}

/**
 * ユースアカデミー候補選手をトップチームへ昇格させる（移籍金 £0・最低年俸 £800K）
 */
function promoteYouthCandidate(candidateId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub || playerClub.players.length >= MAX_SQUAD_SIZE) return;

  const idx = (gameState.youthCandidates || []).findIndex(y => y.id === candidateId);
  if (idx === -1) return;

  const prospect = gameState.youthCandidates[idx];
  prospect.isStarter = false;
  prospect.assignedPos = null;
  prospect.slotIndex = null;
  prospect.squadNumber = null;
  prospect.salary = 800; // 最低年俸 £800K
  prospect.contractYears = 4;

  playerClub.players.push(prospect);
  ensureClubSquadNumbers(playerClub);
  gameState.youthCandidates.splice(idx, 1);

  gameState.facilityFeedback = `【ユース昇格完了】${prospect.pos} ${prospect.name}（${prospect.age}歳 / OVR ${getPlayerOverallRating(prospect)}）とプロ契約（移籍金 £0・年俸 £800K）を締結しトップチームへ登録しました。`;
  renderAll();
}

/**
 * ユースアカデミー候補選手の昇格を見送る（他クラブへ放出し育成補償金 £300K を獲得）
 */
function dismissYouthCandidate(candidateId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const idx = (gameState.youthCandidates || []).findIndex(y => y.id === candidateId);
  if (idx === -1) return;

  const prospect = gameState.youthCandidates[idx];
  gameState.youthCandidates.splice(idx, 1);

  if (playerClub) {
    playerClub.funds += 300;
  }

  gameState.facilityFeedback = `【ユース昇格見送り】${prospect.pos} ${prospect.name}（${prospect.age}歳）のトップ昇格を見送り、他クラブ移籍に伴う育成補償金 +£300K を受領しました。`;
  renderAll();
}

/**
 * GM業務タスク（GM Dashboard）の「実行 / 移動」ボタン処理
 */
function handleGmDutyAction(actionKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  if (actionKey === 'goto-market-offers') {
    switchTab('market');
    switchMarketSubtab('offers');
    return;
  }

  if (actionKey === 'open-mega-offer') {
    openMegaOfferModal();
    return;
  }

  if (actionKey && actionKey.startsWith('negotiate-player:')) {
    const pid = actionKey.split(':')[1];
    switchTab('roster');
    const table = document.getElementById('roster-tbody');
    if (table) table.scrollIntoView({ behavior: 'smooth', block: 'center' });
    openContractNegotiationModal(pid);
    return;
  }

  if (actionKey === 'play-match') {
    switchTab('office');
    if (isTodayMatchDayPending()) {
      playCurrentMatchday(false);
    } else {
      startAdvancingToNextMatch();
    }
    return;
  }

  if (actionKey === 'start-next-season') {
    startNextSeason();
    return;
  }

  if (actionKey === 'goto-pitch') {
    switchTab('roster');
    switchRosterSubtab('board');
    return;
  }

  if (actionKey === 'goto-roster-table') {
    switchTab('roster');
    switchRosterSubtab('players');
    return;
  }

  if (actionKey === 'goto-market') {
    switchTab('market');
    const view = document.getElementById('view-market');
    if (view) view.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (actionKey === 'goto-facilities') {
    switchTab('facilities');
    switchFacilitiesSubtab('investment');
    return;
  }

  if (actionKey === 'goto-staff') {
    switchTab('facilities');
    switchFacilitiesSubtab('staff');
    return;
  }

  if (actionKey === 'goto-youth') {
    switchTab('facilities');
    switchFacilitiesSubtab('youth');
    return;
  }
}

/**
 * クラブの戦術方針を変更する
 */
function setTeamTactic(tacticKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const normalizedKey = normalizeTacticKey(tacticKey);
  const playerClub = getPlayerClub();
  if (!playerClub || !TACTICS_DEFINITIONS[normalizedKey]) return;

  playerClub.tactic = normalizedKey;

  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === normalizedKey);
  });

  document.querySelectorAll('.tactics-guide-item[data-tactic-card]').forEach(card => {
    card.classList.toggle('active-guide', card.dataset.tacticCard === normalizedKey);
  });

  const badgeEl = document.getElementById('current-tactic-badge');
  if (badgeEl) badgeEl.textContent = TACTICS_DEFINITIONS[normalizedKey].badge;
  const descEl = document.getElementById('current-tactic-desc');
  if (descEl) descEl.textContent = TACTICS_DEFINITIONS[normalizedKey].desc;

  renderRoster();
}

/**
 * クラブのフォーメーション（全8種）を切り替える
 */
function setClubFormation(formationKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !FORMATIONS[formationKey]) return;

  playerClub.formation = formationKey;
  gameState.selectedSlotIndex = null;
  gameState.selectedPlayerId = null;

  // 現在のスタメン11名を新しいフォーメーションの11スロットに適性優先で再配置
  assignStartersToFormationSlots(playerClub, true);
  renderRoster();
}

/**
 * 作戦ボード（ピッチ）上のスロットノードをクリックした際の処理
 */
/**
 * 2つのスタメン枠の選手同士をスワップする
 */
function swapStarterSlots(slotIndexA, slotIndexB) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const formationDef = getClubFormationDef(playerClub);
  const slotDefA = formationDef.slots[slotIndexA];
  const slotDefB = formationDef.slots[slotIndexB];
  if (!slotDefA || !slotDefB) return;

  const starterA = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndexA);
  const starterB = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndexB);

  if (starterA && starterB) {
    starterA.slotIndex = slotIndexB;
    starterA.assignedPos = slotDefB.pos;
    starterB.slotIndex = slotIndexA;
    starterB.assignedPos = slotDefA.pos;
  }
  gameState.selectedSlotIndex = null;
  gameState.selectedPlayerId = null;
  renderRoster();
}

function handlePitchNodeClick(slotIndex) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const formationDef = getClubFormationDef(playerClub);
  const slotDef = formationDef.slots[slotIndex];
  if (!slotDef) return;

  const clickedStarter = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndex);

  if (gameState.selectedSlotIndex === null) {
    gameState.selectedSlotIndex = slotIndex;
    gameState.selectedPlayerId = clickedStarter ? clickedStarter.id : null;
    renderRoster();
    return;
  }

  if (gameState.selectedSlotIndex === slotIndex) {
    gameState.selectedSlotIndex = null;
    gameState.selectedPlayerId = null;
    renderRoster();
    return;
  }

  // 既に別のピッチ枠が選択されていた場合、2つのスタメン枠の選手同士をスワップ
  const prevSlotIndex = gameState.selectedSlotIndex;
  const prevSlotDef = formationDef.slots[prevSlotIndex];
  const prevStarter = playerClub.players.find(p => p.isStarter && p.slotIndex === prevSlotIndex);

  if (prevStarter && clickedStarter && prevSlotDef) {
    prevStarter.slotIndex = slotIndex;
    prevStarter.assignedPos = slotDef.pos;
    clickedStarter.slotIndex = prevSlotIndex;
    clickedStarter.assignedPos = prevSlotDef.pos;
  }

  gameState.selectedSlotIndex = null;
  gameState.selectedPlayerId = null;
  renderRoster();
}

/**
 * ベンチ選手を指定スロット（または最適枠）のスタメンとワンクリックで交代する
 */
/**
 * 控え選手とベンチ外選手、または控え同士の枠を入れ替える
 */
function swapBenchOrReservePlayers(playerAId, playerBId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const pA = playerClub.players.find(p => p.id === playerAId && !p.isStarter);
  const pB = playerClub.players.find(p => p.id === playerBId && !p.isStarter);
  if (!pA || !pB) return;

  const tempBench = pA.isBench;
  pA.isBench = pB.isBench;
  pB.isBench = tempBench;

  ensureValidSquadAndStarters(playerClub);
  renderRoster();
}

/**
 * ベンチ選手を指定スロット（または最適枠）のスタメンとワンクリックで交代する
 */
function substituteBenchPlayerToSlot(benchPlayerId, targetSlotIndex = null) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const benchPlayer = playerClub.players.find(p => p.id === benchPlayerId && !p.isStarter);
  if (!benchPlayer) return;

  const formationDef = getClubFormationDef(playerClub);
  const resolvedSlotIdx = targetSlotIndex !== null ? targetSlotIndex : gameState.selectedSlotIndex;

  if (resolvedSlotIdx !== null && formationDef.slots[resolvedSlotIdx]) {
    const slotDef = formationDef.slots[resolvedSlotIdx];
    const currentStarter = playerClub.players.find(p => p.isStarter && p.slotIndex === resolvedSlotIdx);

    if (currentStarter) {
      currentStarter.isStarter = false;
      currentStarter.isBench = true;
      currentStarter.slotIndex = null;
      currentStarter.assignedPos = null;
    }

    benchPlayer.isStarter = true;
    benchPlayer.isBench = false;
    benchPlayer.slotIndex = resolvedSlotIdx;
    benchPlayer.assignedPos = slotDef.pos;

    gameState.selectedSlotIndex = null;
    gameState.selectedPlayerId = null;
    ensureValidSquadAndStarters(playerClub);
    renderRoster();
    return;
  }

  // スロット未選択時は適性枠または実効OVRが最も低いフィールド枠と交代
  togglePlayerStarter(benchPlayerId);
}

/**
 * スタメン選手の配置枠（assignedPos）をプルダウンで変更した際、該当枠のスタメンと入れ替える
 */
function changeStarterAssignedPos(playerId, newSlotPos) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId && p.isStarter);
  if (!target || !POS_ROLE_GROUP[newSlotPos]) return;

  const oldSlot = target.assignedPos || target.pos;
  if (oldSlot === newSlotPos) return;

  const swapPartner = playerClub.players.find(
    p => p.isStarter && p.id !== target.id && (p.assignedPos || p.pos) === newSlotPos
  );

  if (swapPartner) {
    const tempSlotIndex = target.slotIndex;
    target.slotIndex = swapPartner.slotIndex;
    swapPartner.slotIndex = tempSlotIndex;
    swapPartner.assignedPos = oldSlot;
  }
  target.assignedPos = newSlotPos;

  renderRoster();
}

/**
 * スタメン / ベンチ切り替えボタンのクリック処理
 */
function togglePlayerStarter(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  const starters = playerClub.players.filter(p => p.isStarter);
  const bench = playerClub.players.filter(p => !p.isStarter);

  if (target.isStarter) {
    if (bench.length === 0) return;
    const slotToFill = target.assignedPos || target.pos;
    const slotIdxToFill = target.slotIndex;
    bench.sort((a, b) => {
      const aMatch = (a.preferredPosition || a.pos) === slotToFill ? 1 : 0;
      const bMatch = (b.preferredPosition || b.pos) === slotToFill ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });
    const promoted = bench[0];
    promoted.isStarter = true;
    promoted.slotIndex = slotIdxToFill;
    promoted.assignedPos = slotToFill;
    target.isStarter = false;
    target.slotIndex = null;
    target.assignedPos = null;
  } else {
    const prefPos = target.preferredPosition || target.pos;
    let sameSlotStarters = starters.filter(s => (s.assignedPos || s.pos) === prefPos);
    if (sameSlotStarters.length === 0) {
      sameSlotStarters = starters.filter(s => (s.assignedPos || s.pos) !== 'GK');
    }
    if (sameSlotStarters.length > 0) {
      sameSlotStarters.sort((a, b) => getEffectivePlayerRating(a) - getEffectivePlayerRating(b));
      const demoted = sameSlotStarters[0];
      const inheritedSlot = demoted.assignedPos || demoted.pos;
      const inheritedSlotIdx = demoted.slotIndex;
      demoted.isStarter = false;
      demoted.slotIndex = null;
      demoted.assignedPos = null;
      target.isStarter = true;
      target.slotIndex = inheritedSlotIdx;
      target.assignedPos = inheritedSlot;
    }
  }

  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  ensureValidSquadAndStarters(playerClub);
  renderRoster();
}

/**
 * 契約0年の選手離脱処理 ＋ 年俸支払い ＋ 新シーズン開幕
 */
function startNextSeason() {
  if (!gameState.isSeasonOver || gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();

  // 1. レンタル加入選手の所属元クラブへの返却
  const loanInPlayers = playerClub.players.filter(p => p.loanStatus && p.loanStatus.isLoan);
  if (loanInPlayers.length > 0) {
    loanInPlayers.forEach(p => {
      addDailyLog(`【レンタル満了・復帰】#${p.squadNumber || '-'} ${p.name} の1年間期限付き移籍が満了し、${p.loanStatus.fromClubName || '所属元'}へ復帰しました。`);
    });
    playerClub.players = playerClub.players.filter(p => !p.loanStatus || !p.loanStatus.isLoan);
  }

  // 2. レンタル放出（レンタル）選手の成長復帰
  playerClub.players.forEach(p => {
    if (p.loanStatus && p.loanStatus.isLoanOut) {
      addDailyLog(`🎉【レンタルから頼もしく復帰】#${p.squadNumber || '-'} ${p.name} が ${p.loanStatus.toClubName} での1年間のレンタル期間を終え、実力を高めてチームへ合流しました！`);
      p.loanStatus = null;
      p.isLoanListed = false;
    }
  });

  // 3. 事前合意（ボスマン）流出選手の退団
  const departingPlayers = playerClub.players.filter(p => p.preContractDeparture);
  if (departingPlayers.length > 0) {
    departingPlayers.forEach(p => {
      addDailyLog(`【フリー退団】#${p.squadNumber || '-'} ${p.name} が事前合意に基づき ${p.preContractDeparture.toClubName} へ移籍金£0で移籍しました。`);
    });
    playerClub.players = playerClub.players.filter(p => !p.preContractDeparture);
  }

  // 4. 契約残り0年のまま更新されなかった選手、または交渉決裂で流出確定した選手はフリー移籍でチームを離脱
  const expiredPlayers = playerClub.players.filter(p => p.contractYears <= 0 || p.contractRefused);
  if (expiredPlayers.length > 0) {
    playerClub.players = playerClub.players.filter(p => p.contractYears > 0 && !p.contractRefused);
  }

  // 5. 事前合意内定選手（preContractPlayers）の正式合流
  if (Array.isArray(gameState.preContractPlayers) && gameState.preContractPlayers.length > 0) {
    const usedNums = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
    gameState.preContractPlayers.forEach(p => {
      p.squadNumber = pickAvailableSquadNumber(p.pos, usedNums);
      usedNums.add(p.squadNumber);
      if (p.preContract) {
        p.wage = p.preContract.wage || p.wage;
        p.salary = p.preContract.salary || (p.wage * 52);
        p.contractYears = p.preContract.contractYears || 3;
      }
      p.preContract = null;
      p.isStarter = false;
      p.assignedPos = null;
      p.slotIndex = null;
      playerClub.players.push(p);
      addDailyLog(`🎉【事前合意新戦力合流】内定していた ${p.pos} #${p.squadNumber} ${p.name} が来季契約に基づき正式合流しました！（契約${p.contractYears}年 / 週給${formatWage(p.wage)}）`);
    });
    gameState.preContractPlayers = [];
  }

  gameState.hasPreContractDepartureThisSeason = false;
  ensureValidSquadAndStarters(playerClub);

  for (const club of gameState.clubs) {
    const payroll = getClubTotalPayroll(club);
    club.funds -= payroll;
  }

  if (playerClub.funds < 0) {
    gameState.consecutiveDeficitSeasons += 1;
    if (gameState.consecutiveDeficitSeasons >= 2) {
      gameState.isGameOver = true;
      renderAll();
      return;
    }
  } else {
    gameState.consecutiveDeficitSeasons = 0;
  }

  gameState.season += 1;
  gameState.currentWeek = 0;
  gameState.isSeasonOver = false;
  gameState.lastWeekResults = [];
  gameState.matchHistory = [];
  const initialDay = getCurrentCalendarDay();
  if (initialDay) {
    gameState.calendarViewYear = initialDay.year;
    gameState.calendarViewMonth = initialDay.month;
  } else {
    gameState.calendarViewYear = 2025 + gameState.season;
    gameState.calendarViewMonth = 8;
  }
  gameState.scheduleViewMode = 'calendar';
  gameState.lastMatchTicker = null;
  gameState.lastSettlement = null;
  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  gameState.pendingMegaOffer = null;

  for (const club of gameState.clubs) {
    club.played = 0;
    club.won = 0;
    club.drawn = 0;
    club.lost = 0;
    club.gf = 0;
    club.ga = 0;
    club.gd = 0;
    club.pts = 0;
    for (const p of club.players) {
      if (!Array.isArray(p.seasonHistory)) {
        ensurePlayerHistoryAndCareer(p, club.name);
      }
      const prevSeasonNum = Math.max(1, (gameState.season || 2) - 1);
      const prevBaseYear = 2025 + prevSeasonNum;
      const prevYearStr = `${prevBaseYear}-${String((prevBaseYear + 1) % 100).padStart(2, '0')}`;
      const prevAvg = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
      p.seasonHistory.push({
        seasonYear: prevYearStr,
        clubName: club.name,
        age: p.age,
        appearances: p.appearances || 0,
        goals: p.goals || 0,
        assists: p.assists || 0,
        avgRating: prevAvg,
        ovr: getPlayerOverallRating(p)
      });
      p.appearances = 0;
      p.goals = 0;
      p.assists = 0;
      p.totalRating = 0;
      p.injuryWeeks = 0;
      p.injuryDays = 0;
      p.lastDiff = null;
    }
  }

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  gameState.calendar = generateSeasonCalendar(2025 + gameState.season, gameState.schedule);
  if (typeof initSeasonCompetitions === 'function') {
    initSeasonCompetitions();
  }
  gameState.currentDayIndex = 0;
  gameState.isAdvancingCalendar = false;
  gameState.dailyLogs = [
    { date: '8/1 (土)', message: `Season ${gameState.season} が開幕しました！目標順位達成に向けてチームを指揮しましょう。` }
  ];
  switchTab('office');
  renderAll();
}

/**
 * タブ切り替え
 */
// 各タブのスクロール位置を記憶するキャッシュマップ
const tabScrollPositions = {
  office: 0,
  team: 0,
  roster: 0,
  facilities: 0,
  market: 0
};

function resetTabScrollPositions() {
  for (const k of Object.keys(tabScrollPositions)) {
    tabScrollPositions[k] = 0;
  }
}

/**
 * タブ切り替え（各タブごとのスクロール位置保持・個別復元に対応）
 */
function switchTab(tabName) {
  if (tabName === 'standings') tabName = 'team';
  if (!tabName) return;

  // 1. 直前のタブのスクロール位置を保存
  const previousTab = gameState.activeTab;
  if (previousTab) {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    tabScrollPositions[previousTab] = currentScrollY;
  }

  gameState.activeTab = tabName;

  // タブ属性を body と html の両方にセット
  document.body.dataset.activeTab = tabName;
  document.body.setAttribute('data-active-tab', tabName);
  document.documentElement.setAttribute('data-active-tab', tabName);

  // 各タブ要素の表示・非表示切り替え
  const tabs = ['team', 'roster', 'office', 'facilities', 'market'];
  for (const t of tabs) {
    const btn = document.getElementById(`tab-btn-${t}`);
    const view = document.getElementById(`view-${t}`);
    if (!btn || !view) continue;
    if (t === tabName) {
      btn.classList.add('active');
      view.classList.remove('hidden');
    } else {
      btn.classList.remove('active');
      view.classList.add('hidden');
    }
  }

  // 編成タブ・移籍タブに切り替えた場合はサブタブの属性と表示状態を適用
  if (tabName === 'roster') {
    switchRosterSubtab(gameState.rosterSubtab || 'board');
  } else if (tabName === 'market') {
    switchMarketSubtab(gameState.marketSubtab || 'market');
  } else if (tabName === 'facilities') {
    switchFacilitiesSubtab(gameState.facilitiesSubtab || 'investment');
  } else if (tabName === 'team') {
    switchTeamSubtab(gameState.teamSubtab || 'standings');
  }

  renderAll();

  // 2. 切り替え先タブの前回スクロール位置を復元（未スクロール時は 0: 最上部）
  const targetScrollY = tabScrollPositions[tabName] || 0;
  window.scrollTo({
    top: targetScrollY,
    left: 0,
    behavior: 'instant'
  });

  // レンダリング完了後の高さ確定時にも念のため位置を適用
  requestAnimationFrame(() => {
    window.scrollTo({
      top: targetScrollY,
      left: 0,
      behavior: 'instant'
    });
  });
}

/**
 * 編成画面内のサブタブ切り替え（作戦ボード / 選手一覧 / 戦術）
 */
function switchRosterSubtab(subtabKey) {
  if (!subtabKey) subtabKey = 'board';
  gameState.rosterSubtab = subtabKey;

  // DOM 属性をセット（CSSでモバイル作戦ボードのスクロール禁止等を連動）
  document.documentElement.setAttribute('data-roster-subtab', subtabKey);
  document.body.setAttribute('data-roster-subtab', subtabKey);
  const rosterView = document.getElementById('view-roster');
  if (rosterView) {
    rosterView.setAttribute('data-roster-subtab', subtabKey);
  }

  const subtabs = ['board', 'players', 'tactics'];
  subtabs.forEach(key => {
    const btn = document.getElementById(`subtab-btn-${key}`);
    const subview = document.getElementById(`roster-subview-${key}`);
    const isActive = (key === subtabKey);

    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    if (subview) {
      if (isActive) {
        subview.classList.remove('hidden');
      } else {
        subview.classList.add('hidden');
      }
    }
  });

  // 作戦ボードタブの場合はスクロールを最上部に固定（スクロールなし完全フィット）
  if (subtabKey === 'board') {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    renderTacticalBoard();
  } else if (subtabKey === 'players') {
    renderRoster();
  } else if (subtabKey === 'tactics') {
    renderTacticsOverview();
  }
}

/**
 * 順位表のソート
 */
function getSortedStandings() {
  return [...gameState.clubs].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.id.localeCompare(b.id);
  });
}

function getClubById(id) {
  return gameState.clubs.find(c => c.id === id);
}

function getPlayerClub() {
  return gameState.clubs.find(c => c.isPlayer) || gameState.clubs[0];
}

/**
 * 自チームの選手行クリックによる任意2選手の入れ替え
 */
function handleRosterClick(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  // 下部選手一覧からの交代操作は廃止（作戦ボード・控え選手エリアのドラッグ＆ドロップに一本化）
  // 行クリック時は詳細プロフィールを表示
  if (playerId) {
    openPlayerProfileModal(playerId);
  }
}

/**
 * 画面全体の描画更新
 */
function renderAll() {
  if (!gameState.clubs || gameState.clubs.length === 0) return;
  renderHeader();
  renderWeeklySchedule();
  renderFinancialAlert();
  renderGmDuties();
  renderSeasonSettlement();
  if (gameState.teamSubtab === 'schedule') {
    renderScheduleView();
  } else if (gameState.teamSubtab === 'stats') {
    renderTopScorers();
  } else {
    renderStandings();
  }
  renderMatchLog();
  renderRoster();
  renderYouthSquad();
  updateMarketBadges();
  if (gameState.marketSubtab === 'shortlist') {
    renderShortlist();
  } else if (gameState.marketSubtab === 'offers') {
    renderIncomingOffers();
  } else {
    renderMarket();
  }
  renderFacilitiesAndYouth();
  if (gameState.hasStartedOnce && typeof saveGameToStorage === 'function') {
    saveGameToStorage(false);
  }
}

/**
 * 上部ステータスの描画
 */
function renderHeader() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const currentDay = getCurrentCalendarDay();
  const payroll = getClubTotalPayroll(playerClub);
  const squadCount = playerClub.players.length;

  const headerClubEl = document.getElementById('header-club-name');
  if (headerClubEl) {
    headerClubEl.innerHTML = `${getClubEmblemSvg(playerClub, 24, 'header-club-emblem')}<span>${playerClub.name}</span>`;
  }
  document.getElementById('header-gm-name').textContent = gameState.gmName;
  document.getElementById('header-target-rank').textContent = `目標：${playerClub.targetLabel || '4位以内'}`;
  document.getElementById('header-season').textContent = `${gameState.season}年目`;

  // 日付・曜日表示
  const dateEl = document.getElementById('header-date');
  if (dateEl && currentDay) {
    dateEl.textContent = currentDay.displayDate;
  }

  if (gameState.isGameOver) {
    document.getElementById('header-matchweek').textContent = 'GM解任 (GAME OVER)';
  } else if (gameState.isSeasonOver) {
    document.getElementById('header-matchweek').textContent = 'オフシーズン (移籍・契約)';
  } else if (gameState.currentWeek === 0 && (!currentDay || !currentDay.isMatchDay)) {
    document.getElementById('header-matchweek').textContent = 'PRE-SEASON';
  } else {
    const nextWeek = Math.min(gameState.currentWeek + 1, gameState.totalWeeks);
    document.getElementById('header-matchweek').textContent = `第${nextWeek}節 / 全${gameState.totalWeeks}節`;
  }

  const fundsEl = document.getElementById('header-funds');
  fundsEl.textContent = formatMoney(playerClub.funds);
  if (playerClub.funds < 0) {
    fundsEl.classList.remove('accent-gold');
    fundsEl.classList.add('text-danger');
  } else {
    fundsEl.classList.remove('text-danger');
    fundsEl.classList.add('accent-gold');
  }

  document.getElementById('header-payroll').textContent = formatMoney(payroll);
  document.getElementById('header-squad-size').textContent = `SQUAD: ${squadCount}名`;
  document.getElementById('header-supporters').textContent = `${playerClub.supporters.toLocaleString()}人`;

  document.getElementById('tab-badge-roster').textContent = `${squadCount}名`;

  // 移籍市場バッジ：受信オファーがある場合は赤色強調「〇件打診」、通常時は全登録選手数
  const marketBadge = document.getElementById('tab-badge-market');
  if (marketBadge) {
    const offersCount = (gameState.incomingOffers || []).length;
    if (offersCount > 0) {
      marketBadge.textContent = `${offersCount}件打診`;
      marketBadge.classList.add('badge-offer-incoming');
      marketBadge.classList.remove('badge-highlight');
    } else {
      const totalMarketPlayers = (gameState.clubs || []).reduce((sum, c) => sum + (c.players ? c.players.length : 0), 0);
      marketBadge.textContent = `${totalMarketPlayers}名`;
      marketBadge.classList.remove('badge-offer-incoming');
      if (gameState.isSeasonOver || (currentDay && currentDay.windowOpen)) {
        marketBadge.classList.add('badge-highlight');
      } else {
        marketBadge.classList.remove('badge-highlight');
      }
    }
  }



  const financeBadge = document.getElementById('header-finance-badge');
  financeBadge.className = 'finance-status-badge';

  if (gameState.isGameOver) {
    financeBadge.textContent = '債務超過（解任）';
    financeBadge.classList.add('status-danger');
  } else if (playerClub.funds < 0) {
    financeBadge.textContent = '債務超過';
    financeBadge.classList.add('status-danger');
  } else if (playerClub.funds < payroll * 1.2) {
    financeBadge.textContent = '警告';
    financeBadge.classList.add('status-warning');
  } else {
    financeBadge.textContent = '健全';
    financeBadge.classList.add('status-healthy');
  }

  // アクションボタン群の制御
  const btnAdvanceDay = document.getElementById('btn-advance-day');
  const btnAdvanceToMatch = document.getElementById('btn-advance-to-match');
  const btnPlayMatch = document.getElementById('btn-play-match');
  const btnPauseAdvance = document.getElementById('btn-pause-advance');
  const btnPlayNext = document.getElementById('btn-play-next');
  const btnSkipSeason = document.getElementById('btn-skip-season');
  const btnNextSeason = document.getElementById('btn-next-season');
  const btnRestart = document.getElementById('btn-restart-game');

  const isMatchPending = isTodayMatchDayPending();
  const isAdvancing = gameState.isAdvancingCalendar;
  const isBusy = gameState.isSimulating;

  if (btnAdvanceDay) btnAdvanceDay.disabled = isBusy || isMatchPending || isAdvancing;
  if (btnAdvanceToMatch) btnAdvanceToMatch.disabled = isBusy || isMatchPending || isAdvancing;
  if (btnPlayMatch) btnPlayMatch.disabled = isBusy || isAdvancing;
  if (btnSkipSeason) btnSkipSeason.disabled = isBusy || isAdvancing;

  if (gameState.isGameOver) {
    if (btnAdvanceDay) btnAdvanceDay.classList.add('hidden');
    if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
    if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
    if (btnPauseAdvance) btnPauseAdvance.classList.add('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.add('hidden');
    if (btnRestart) btnRestart.classList.remove('hidden');
  } else if (gameState.isSeasonOver) {
    if (btnAdvanceDay) btnAdvanceDay.classList.add('hidden');
    if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
    if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
    if (btnPauseAdvance) btnPauseAdvance.classList.add('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.remove('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
  } else if (isAdvancing) {
    if (btnAdvanceDay) btnAdvanceDay.classList.add('hidden');
    if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
    if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
    if (btnPauseAdvance) btnPauseAdvance.classList.remove('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.add('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
  } else {
    if (btnPauseAdvance) btnPauseAdvance.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.add('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.remove('hidden');

    if (isMatchPending) {
      // 本日未消化の試合日：業務タスク下の旧キックオフボタンはなくし（非表示）、MATCHDAYパネル側でキックオフを提供
      if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
      if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
      if (btnAdvanceDay) btnAdvanceDay.classList.remove('hidden');
    } else {
      // 通常平日、または本日の試合消化済み：次の試合まで進めるボタンのみをメイン表示
      if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
      if (btnAdvanceToMatch) btnAdvanceToMatch.classList.remove('hidden');
      if (btnAdvanceDay) btnAdvanceDay.classList.remove('hidden');
    }
  }
}

/**
 * 赤字経営・ゲームオーバー警告バナーの描画
 */
function renderFinancialAlert() {
  const banner = document.getElementById('financial-alert-banner');
  const playerClub = getPlayerClub();
  if (!banner || !playerClub) return;

  if (gameState.isGameOver) {
    banner.className = 'financial-alert-banner alert-gameover';
    banner.textContent = `【ゲームオーバー】債務超過（資金：${formatMoney(playerClub.funds)}）が改善されず、${gameState.gmName} GMの解任が通告されました。「最初からやり直す」で新たなクラブ運営を開始できます。`;
    banner.classList.remove('hidden');
    return;
  }

  if (playerClub.funds < 0) {
    banner.className = 'financial-alert-banner';
    banner.textContent = `【警告：債務超過】クラブ資金がマイナス（${formatMoney(playerClub.funds)}）です。次シーズン開幕時も債務超過が続くとGM解任（ゲームオーバー）となります。高年俸選手の自由契約や売却で収支を改善してください。`;
    banner.classList.remove('hidden');
    return;
  }

  banner.classList.add('hidden');
}

/**
 * オフシーズン決算・世代交代・契約満了警告サマリーの描画
 */
function renderSeasonSettlement() {
  const summaryBox = document.getElementById('season-summary-box');
  if (!summaryBox) return;
  if (!gameState.isSeasonOver || !gameState.lastSettlement) {
    summaryBox.classList.add('hidden');
    return;
  }

  summaryBox.classList.remove('hidden');
  const s = gameState.lastSettlement;
  const playerClub = getPlayerClub();
  const currentPayroll = getClubTotalPayroll(playerClub);
  const projectedBalance = playerClub.funds - currentPayroll;

  const targetStatusText = s.targetAchieved
    ? `目標（${s.targetLabel}）達成！理事会ボーナス +${formatMoney(s.targetBonus)}`
    : `目標（${s.targetLabel}）未達`;

  document.getElementById('summary-headline').textContent =
    `${s.season}年目シーズン終了・決算報告（最終順位：第${s.rank}位 ／ ${targetStatusText}）`;

  document.getElementById('summary-reward-text').textContent =
    `収入加算：順位賞金 +${formatMoney(s.prize)} ／ 年間スポンサー・放映権 +${formatMoney(s.sponsorIncome)}${s.targetBonus > 0 ? ` ／ 目標達成ボーナス +${formatMoney(s.targetBonus)}` : ''}（計 +${formatMoney(s.totalIncome)}）`;

  const projEl = document.getElementById('summary-payroll-projection');
  const deficitWarning = projectedBalance < 0 ? ' 【警告：このまま開幕すると債務超過になります】' : '';
  projEl.textContent =
    `現在資金：${formatMoney(playerClub.funds)} ／ 翌シーズン年俸合計（開幕時支払）：-${formatMoney(currentPayroll)} ➜ 開幕時予想残高：${formatMoney(projectedBalance)}${deficitWarning}`;
  projEl.className = projectedBalance < 0 ? 'mono text-danger' : 'mono accent-green';

  const expiringPlayers = playerClub.players.filter(p => p.contractYears <= 0);
  const contractWarnEl = document.getElementById('summary-contract-warning');
  if (expiringPlayers.length > 0) {
    const names = expiringPlayers.map(p => `${p.pos} ${p.name}`).join('、');
    contractWarnEl.textContent = `【要確認】契約満了選手（${expiringPlayers.length}名）：${names} — 残留させる場合は「所属選手・戦術・契約」タブで「契約延長」を行ってください（未更新のまま開幕するとフリー移籍で退団します）。`;
  } else {
    contractWarnEl.textContent = '';
  }

  const retireEl = document.getElementById('summary-retirement-log');
  if (s.retirementLogs.length === 0) {
    retireEl.innerHTML = '<div class="text-muted">今シーズンの現役引退選手はいません。</div>';
  } else {
    retireEl.innerHTML = s.retirementLogs.map(line => `<div>${line}</div>`).join('');
  }

  const agingEl = document.getElementById('summary-aging-log');
  agingEl.innerHTML = s.agingLogs.map(item => {
    const diffClass = item.totalDiff > 0 ? 'diff-up' : (item.totalDiff < 0 ? 'diff-down' : '');
    return `<div><span class="mono">[${item.pos}]</span> ${item.name} (<span class="mono">${item.age}歳/${item.growthLabel}</span>) <span class="mono ${diffClass}">総合 ${item.sign}</span></div>`;
  }).join('');
}

/**
 * 順位表の描画
 */
function renderStandings() {
  const compView = gameState.selectedCompView || 'league';
  const tableWrapper = document.querySelector('#team-subview-standings .table-wrapper');
  const bracketWrapper = document.getElementById('comp-bracket-wrapper');
  const subnavRow = document.getElementById('comp-subnav-row');
  const statusText = document.getElementById('standings-status-text');
  const legendEl = document.getElementById('standings-legend');

  if (compView === 'league' || compView === 'prem' || compView === 'championship') {
    // リーグ（ENG-D1 / ENG-D2）の切り替え表示
    if (tableWrapper) tableWrapper.classList.remove('hidden');
    if (bracketWrapper) bracketWrapper.classList.add('hidden');
    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      const curDiv = gameState.selectedLeagueDivision || (compView === 'championship' ? 'd2' : 'd1');
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">ディビジョン:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curDiv === 'd1' ? 'active' : ''}" data-league-div="d1">ファースト (ENG-D1)</button>
            <button type="button" class="comp-sub-btn mono ${curDiv === 'd2' ? 'active' : ''}" data-league-div="d2">セカンド (ENG-D2)</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('.comp-sub-btn').forEach(b => {
        b.onclick = () => {
          gameState.selectedLeagueDivision = b.dataset.leagueDiv;
          renderStandings();
        };
      });
    }

    const curDiv = gameState.selectedLeagueDivision || (compView === 'championship' ? 'd2' : 'd1');

    if (curDiv === 'd1') {
      // イングランド・ファーストディビジョン（ENG-D1）順位表
      if (statusText) statusText.textContent = `ENG-D1 MATCHWEEK ${gameState.currentWeek} / ${gameState.totalWeeks}`;
      if (legendEl) {
        legendEl.classList.remove('hidden');
        legendEl.innerHTML = `
          <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-4位: ユーロ・チャンピオンズ・トロフィー（ECT）出場権</span></div>
          <div class="legend-item"><span class="legend-color-box zone-uel-bg"></span><span class="legend-text">5位: ユーロ・プレステージ・カップ（EPC）出場権</span></div>
          <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">18-20位: セカンドディビジョン（ENG-D2）降格</span></div>
        `;
      }

      const sorted = getSortedStandings();
      const tbody = document.getElementById('standings-tbody');
      if (tbody) {
        tbody.innerHTML = sorted.map((club, idx) => {
          const rank = idx + 1;
          const zoneClass = rank <= 4 ? 'zone-ucl' : (rank === 5 ? 'zone-uel' : (rank >= 18 ? 'zone-rel' : ''));
          const rowClass = [club.isPlayer ? 'row-player-club' : '', zoneClass].filter(Boolean).join(' ');
          const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
          const gdSign = club.gd > 0 ? `+${club.gd}` : `${club.gd}`;

          return `
            <tr class="${rowClass}">
              <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span></td>
              <td class="col-team"><span class="team-cell-wrap">${getClubEmblemSvg(club, 20, 'standings-emblem')}<span class="team-name-text">${club.name}</span></span></td>
              <td class="col-num col-played">${club.played}</td>
              <td class="col-num col-won">${club.won}</td>
              <td class="col-num col-drawn">${club.drawn}</td>
              <td class="col-num col-lost">${club.lost}</td>
              <td class="col-num col-gf"><span class="td-pc">${club.gf}</span><span class="td-mob">${club.gf}-${club.ga}</span></td>
              <td class="col-num col-ga">${club.ga}</td>
              <td class="col-num col-gd">${gdSign}</td>
              <td class="col-pts">${club.pts}</td>
            </tr>
          `;
        }).join('');
      }
    } else {
      // イングランド・セカンドディビジョン（ENG-D2）順位表
      if (legendEl) {
        legendEl.classList.remove('hidden');
        legendEl.innerHTML = `
          <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-3位: ファーストディビジョン（ENG-D1）自動昇格</span></div>
          <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">22-24位: 降格圏</span></div>
        `;
      }

      const comp = gameState.competitions && gameState.competitions.championship;
      const sorted = comp && comp.clubs ? [...comp.clubs].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0)) : [];
      const playedCount = sorted[0] ? sorted[0].played || 0 : 0;
      if (statusText) statusText.textContent = `ENG-D2 MATCHWEEK ${playedCount} / 46`;

      const tbody = document.getElementById('standings-tbody');
      if (tbody) {
        tbody.innerHTML = sorted.map((club, idx) => {
          const rank = idx + 1;
          const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
          const gdSign = club.gd > 0 ? `+${club.gd}` : `${club.gd || 0}`;
          const zoneClass = rank <= 3 ? 'zone-promotion' : (rank >= 22 ? 'zone-relegation-p2' : '');

          return `
            <tr class="${zoneClass}">
              <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span></td>
              <td class="col-team"><span class="team-cell-wrap">${getClubEmblemSvg(club, 20, 'standings-emblem')}<span class="team-name-text">${club.name}</span></span></td>
              <td class="col-num col-played">${club.played || 0}</td>
              <td class="col-num col-won">${club.won || 0}</td>
              <td class="col-num col-drawn">${club.drawn || 0}</td>
              <td class="col-num col-lost">${club.lost || 0}</td>
              <td class="col-num col-gf"><span class="td-pc">${club.gf || 0}</span><span class="td-mob">${club.gf || 0}-${club.ga || 0}</span></td>
              <td class="col-num col-ga">${club.ga || 0}</td>
              <td class="col-num col-gd">${gdSign}</td>
              <td class="col-pts">${club.pts || 0}</td>
            </tr>
          `;
        }).join('');
      }
    }
  } else if (compView === 'domestic') {
    // 国内カップ戦（トーナメントブラケット表示）
    if (tableWrapper) tableWrapper.classList.add('hidden');
    if (bracketWrapper) bracketWrapper.classList.remove('hidden');
    if (legendEl) legendEl.classList.add('hidden');

    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      const curDom = gameState.selectedDomesticCup || 'leagueCup';
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curDom === 'leagueCup' ? 'active' : ''}" data-sub-cup="leagueCup">リーグ・トロフィー (L-CUP)</button>
            <button type="button" class="comp-sub-btn mono ${curDom === 'nationalCup' ? 'active' : ''}" data-sub-cup="nationalCup">ナショナル・カップ (N-CUP)</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('.comp-sub-btn').forEach(b => {
        b.onclick = () => {
          gameState.selectedDomesticCup = b.dataset.subCup;
          renderStandings();
        };
      });
    }
    const curDom = gameState.selectedDomesticCup || 'leagueCup';
    if (bracketWrapper) {
      bracketWrapper.classList.remove('standings-view');
      bracketWrapper.innerHTML = renderCupBracketHtml(curDom);
    }
    if (statusText) statusText.textContent = curDom === 'leagueCup' ? 'LEAGUE TROPHY (L-CUP)' : 'NATIONAL CUP (N-CUP)';
  } else if (compView === 'europe') {
    // 欧州コンペ：全36チーム スイス方式リーグフェーズ（各8試合） ＆ 日程 ＆ 決勝トーナメント
    if (tableWrapper) tableWrapper.classList.add('hidden');
    if (bracketWrapper) bracketWrapper.classList.remove('hidden');
    if (legendEl) legendEl.classList.add('hidden');

    const playerClub = getPlayerClub();
    if (!gameState.selectedEuroCup && playerClub && gameState.competitions) {
      if (gameState.competitions.championsCup && gameState.competitions.championsCup.participants.some(c => c.id === playerClub.id)) {
        gameState.selectedEuroCup = 'championsCup';
      } else if (gameState.competitions.europaCup && gameState.competitions.europaCup.participants.some(c => c.id === playerClub.id)) {
        gameState.selectedEuroCup = 'europaCup';
      } else if (gameState.competitions.conferenceCup && gameState.competitions.conferenceCup.participants.some(c => c.id === playerClub.id)) {
        gameState.selectedEuroCup = 'conferenceCup';
      }
    }

    const curEuro = gameState.selectedEuroCup || 'championsCup';
    const curTab = gameState.selectedEuroSubtab || 'standings';

    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">欧州大会:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curEuro === 'championsCup' ? 'active' : ''}" data-sub-cup="championsCup">ECT</button>
            <button type="button" class="comp-sub-btn mono ${curEuro === 'europaCup' ? 'active' : ''}" data-sub-cup="europaCup">EPC</button>
            <button type="button" class="comp-sub-btn mono ${curEuro === 'conferenceCup' ? 'active' : ''}" data-sub-cup="conferenceCup">ECS</button>
          </div>
        </div>
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">表示切替:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="euro-phase-btn mono ${curTab === 'standings' ? 'active' : ''}" data-euro-tab="standings">順位表</button>
            <button type="button" class="euro-phase-btn mono ${curTab === 'schedule' ? 'active' : ''}" data-euro-tab="schedule">日程・結果</button>
            <button type="button" class="euro-phase-btn mono ${curTab === 'bracket' ? 'active' : ''}" data-euro-tab="bracket">トーナメント表</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('[data-sub-cup]').forEach(b => {
        b.onclick = () => {
          gameState.selectedEuroCup = b.dataset.subCup;
          renderStandings();
        };
      });
      subnavRow.querySelectorAll('[data-euro-tab]').forEach(b => {
        b.onclick = () => {
          gameState.selectedEuroSubtab = b.dataset.euroTab;
          renderStandings();
        };
      });
    }

    const compName = curEuro === 'championsCup' ? 'EURO CHAMPIONS TROPHY (ECT)' : (curEuro === 'europaCup' ? 'EURO PRESTIGE CUP (EPC)' : 'EURO CONFERENCE SHIELD (ECS)');

    if (curTab === 'standings') {
      if (bracketWrapper) {
        bracketWrapper.classList.add('standings-view');
        bracketWrapper.innerHTML = renderEuroLeaguePhaseStandingsHtml(curEuro);
      }
      const euroComp = gameState.competitions && gameState.competitions[curEuro];
      const mw = euroComp ? euroComp.currentMatchweek || 0 : 0;
      if (statusText) statusText.textContent = `${compName} MATCHWEEK ${mw} / 8`;
    } else if (curTab === 'schedule') {
      if (bracketWrapper) {
        bracketWrapper.classList.remove('standings-view');
        bracketWrapper.innerHTML = renderEuroScheduleListHtml(curEuro);
      }
      if (statusText) statusText.textContent = `${compName} - 対戦日程・結果`;
    } else {
      if (bracketWrapper) {
        bracketWrapper.classList.remove('standings-view');
        bracketWrapper.innerHTML = renderCupBracketHtml(curEuro);
      }
      if (statusText) statusText.textContent = `${compName} - 決勝トーナメント`;
    }
  }
}

/**
 * 大会セグメント切り替えナビゲーションの初期化
 */
function setupCompetitionNavListeners() {
  const nav = document.getElementById('comp-segment-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.comp-tab-btn');
    if (!btn || !btn.dataset.comp) return;

    nav.querySelectorAll('.comp-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    gameState.selectedCompView = btn.dataset.comp;
    renderStandings();
  });
}

/**
 * リーグ個人スタッツ（7大カテゴリー：得点・アシスト・評価点・完封・MOM・出場・警告退場）の定義
 */
let currentLeagueStatsCategory = 'goals';

const LEAGUE_STATS_CATEGORIES = {
  goals: {
    id: 'goals',
    icon: '⚽',
    title: '⚽ リーグ得点ランキング',
    desc: 'イングランド・ディビジョン1 ゴール数ランキング',
    mainColHeader: 'ゴール',
    getScore: p => p.goals || 0,
    formatScore: (val) => `<strong class="accent-gold">${val}</strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => `<span class="accent-green">${avgR}</span>`
  },
  assists: {
    id: 'assists',
    icon: '🅰️',
    title: '🅰️ リーグアシストランキング',
    desc: '決定的なラストパスを供給したアシスト王争い',
    mainColHeader: 'アシスト',
    getScore: p => p.assists || 0,
    formatScore: (val) => `<strong class="text-cyan">${val}</strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => `<span class="accent-green">${avgR}</span>`
  },
  ratings: {
    id: 'ratings',
    icon: '⭐',
    title: '⭐ リーグ平均評価点ランキング',
    desc: '公式戦2試合以上出場のハイパフォーマンス選手（平均7.0以上が高水準）',
    mainColHeader: '平均評価',
    getScore: (p, apps) => (apps >= 2 ? (p.totalRating / apps) : 0),
    formatScore: (val) => {
      const cls = val >= 7.5 ? 'accent-gold' : (val >= 7.0 ? 'accent-green' : 'text-main');
      return `<strong class="${cls}">★ ${val.toFixed(2)}</strong>`;
    },
    secondaryColHeader: 'G / A',
    formatSecondary: (p) => `<span class="mono">${p.goals || 0}G / ${p.assists || 0}A</span>`
  },
  cleansheets: {
    id: 'cleansheets',
    icon: '🧤',
    title: '🧤 クリーンシート（完封）ランキング',
    desc: '相手攻撃をシャットアウトした守護神（GK）＆DF陣の完封記録',
    filter: p => ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.assignedPos || p.pos) || POS_ROLE_GROUP[p.pos] === 'GK' || POS_ROLE_GROUP[p.pos] === 'DF',
    mainColHeader: 'クリーンシート',
    getScore: p => p.cleanSheets || 0,
    formatScore: (val) => `<strong class="accent-gold">${val} <small style="font-size:10px; color:var(--text-muted);">試合</small></strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => `<span class="accent-green">${avgR}</span>`
  },
  moms: {
    id: 'moms',
    icon: '👑',
    title: '👑 マン・オブ・ザ・マッチ（MOM）獲得数ランキング',
    desc: '試合で最も輝いたMVP選出回数トップのスタープレイヤー',
    mainColHeader: 'MOM獲得数',
    getScore: p => p.momCount || 0,
    formatScore: (val) => `<strong class="accent-gold">👑 ${val} <small style="font-size:10px; color:var(--text-muted);">回</small></strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => `<span class="accent-green">${avgR}</span>`
  },
  appearances: {
    id: 'appearances',
    icon: '⏱️',
    title: '⏱️ リーグ最多出場・鉄人ランキング',
    desc: 'チームを支え続けるタフな最多出場記録（疲労度併記）',
    mainColHeader: '出場数',
    getScore: p => p.appearances || 0,
    formatScore: (val, p) => {
      const ftg = typeof getPlayerFatigue === 'function' ? getPlayerFatigue(p) : 0;
      const ftgSt = typeof getPlayerFatigueStatus === 'function' ? getPlayerFatigueStatus(ftg) : { color: '#2ecc71', label: '万全' };
      return `<strong>${val}試合</strong> <span class="mono" style="font-size:9.5px; color:${ftgSt.color}; margin-left:4px;">(疲労:${ftg})</span>`;
    },
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => `<span class="accent-green">${avgR}</span>`
  },
  cards: {
    id: 'cards',
    icon: '🟨',
    title: '🟨 警告（イエロー）・退場（レッド）ランキング',
    desc: '激しいファウル・警告カードを受けたカード枚数ランキング',
    mainColHeader: '🟨 警告',
    getScore: p => ((p.redCards || 0) * 3 + (p.yellowCards || 0)),
    formatScore: (val, p) => `<strong style="color:#f1c40f;">🟨 ${p.yellowCards || 0}</strong>`,
    secondaryColHeader: '🟥 退場',
    formatSecondary: (p) => `<strong style="color:#e74c3c;">🟥 ${p.redCards || 0}</strong>`
  }
};

/**
 * リーグ個人スタッツ（選択されたカテゴリー）の描画
 */
function renderLeagueStats(catKey = 'goals') {
  currentLeagueStatsCategory = catKey;
  const config = LEAGUE_STATS_CATEGORIES[catKey] || LEAGUE_STATS_CATEGORIES.goals;

  const titleEl = document.getElementById('stats-panel-title');
  const descEl = document.getElementById('stats-panel-desc');
  const subtitleEl = document.getElementById('stats-panel-subtitle');
  const theadEl = document.getElementById('stats-ranking-thead');
  const tbody = document.getElementById('top-scorers-tbody');

  if (titleEl) titleEl.textContent = config.title;
  if (descEl) descEl.textContent = config.desc;
  if (subtitleEl) subtitleEl.textContent = 'TOP 10';

  // ナビゲーションバーのactiveクラス切り替え
  const navBar = document.getElementById('stats-category-nav-bar');
  if (navBar) {
    navBar.querySelectorAll('.stats-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.statsCat === catKey);
    });
  }

  // テーブルヘッダー列の更新
  if (theadEl) {
    theadEl.innerHTML = `
      <tr>
        <th class="col-rank">順位</th>
        <th class="col-pos">POS</th>
        <th class="col-name">選手名</th>
        <th class="col-team">所属クラブ</th>
        <th class="col-num">出場</th>
        <th class="col-num">${config.mainColHeader}</th>
        <th class="col-num">${config.secondaryColHeader}</th>
      </tr>
    `;
  }

  if (!tbody) return;

  const allPlayers = [];
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      if (p.isRetired) continue;
      if (config.filter && !config.filter(p)) continue;

      const apps = p.appearances || 0;
      const avgRating = apps > 0 ? (p.totalRating / apps).toFixed(1) : '-';
      const score = config.getScore(p, apps);

      allPlayers.push({
        player: p,
        clubName: club.name,
        isPlayerClub: club.isPlayer,
        apps,
        avgRating,
        score
      });
    }
  }

  allPlayers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const rateA = parseFloat(a.avgRating) || 0;
    const rateB = parseFloat(b.avgRating) || 0;
    if (rateB !== rateA) return rateB - rateA;
    return b.apps - a.apps;
  });

  const top10 = allPlayers.slice(0, 10);
  const hasData = top10.length > 0 && top10[0].score > 0;

  if (!hasData) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-log-message">まだ${config.mainColHeader}の記録がありません。公式戦が進行するとランキングがリアルタイム集計されます。</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = top10.map((item, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-badge rank-1' : (rank <= 3 ? 'rank-badge rank-2' : 'rank-badge');
    const rowClass = item.isPlayerClub ? 'row-player-club' : '';

    return `
      <tr class="${rowClass}">
        <td class="col-rank"><span class="${rankClass}">${rank}</span></td>
        <td class="col-pos">${formatPlayerPositionsHtml(item.player)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${item.player.id}" title="クリックで選手詳細プロフィールを表示">
            ${getPlayerAvatarHtml(item.player, null, 'avatar-sm table-avatar')}${item.player.name}
          </button>
        </td>
        <td class="col-team"><span class="team-cell-wrap">${getClubEmblemSvg(item.clubName, 18, 'scorers-emblem')}<span class="team-name-text">${item.clubName}</span></span></td>
        <td class="col-num">${item.apps}</td>
        <td class="col-num">${config.formatScore(item.score, item.player)}</td>
        <td class="col-num">${config.formatSecondary(item.player, item.avgRating)}</td>
      </tr>
    `;
  }).join('');

  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * リーグ得点ランキング（下位互換ラッパー）
 */
function renderTopScorers() {
  renderLeagueStats(currentLeagueStatsCategory);
}

/**
 * 試合結果ログおよびMATCHDAY対戦カードの描画
 */
function renderMatchLog() {
  if (gameState.isSimulating) {
    return;
  }

  const matchdaySection = document.getElementById('office-matchday-section');
  const matchdayHero = document.getElementById('matchday-hero-container');
  const container = document.getElementById('match-results-container');
  const panelTitle = document.getElementById('log-panel-title');
  const subtitle = document.getElementById('log-panel-subtitle');

  const playerClub = getPlayerClub();
  const currentDay = getCurrentCalendarDay();
  const isMatchPending = isTodayMatchDayPending();

  // パターン1：本日が未消化の試合日（MATCHDAY / カップ戦 / 欧州戦）
  const playerMatchInfo = isMatchPending && currentDay ? getCalendarDayPlayerMatch(currentDay) : null;
  if (isMatchPending && currentDay && playerMatchInfo) {
    const isHome = playerMatchInfo.isHome;
    const oppClub = playerMatchInfo.oppClub;
    const home = isHome ? playerClub : oppClub;
    const away = isHome ? oppClub : playerClub;

    const calcClubOvr = (c) => {
      if (!c) return 70;
      if (c.players && c.players.length > 0) {
        return Math.round(c.players.slice(0, 11).reduce((s, p) => s + getPlayerOverallRating(p), 0) / Math.min(11, c.players.length));
      }
      return c.ovr || 72;
    };

    const homeOvr = calcClubOvr(home);
    const awayOvr = calcClubOvr(away);

    const myMatchHtml = `
      <div class="matchday-card-preview">
        <div class="matchday-preview-header">
          <span class="matchday-badge-big">${playerMatchInfo.title}</span>
          <span class="mono accent-green">${currentDay.displayDate}</span>
        </div>
        <div class="matchday-vs-hero">
          <div class="matchday-club-side ${home.isPlayer ? 'is-player-side' : ''}">
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:3px;">
              ${getClubEmblemSvg(home, 26, 'matchday-club-emblem')}
              <span class="matchday-club-name mono" style="font-weight:800; font-size:15px; letter-spacing:0.05em;">${getClubShortCode(home)}</span>
            </div>
            <span class="matchday-club-ovr">OVR ${homeOvr} ${home.isPlayer ? '(自チーム)' : ''}</span>
          </div>
          <div class="matchday-vs-badge">VS</div>
          <div class="matchday-club-side ${away.isPlayer ? 'is-player-side' : ''}">
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:3px;">
              <span class="matchday-club-name mono" style="font-weight:800; font-size:15px; letter-spacing:0.05em;">${getClubShortCode(away)}</span>
              ${getClubEmblemSvg(away, 26, 'matchday-club-emblem')}
            </div>
            <span class="matchday-club-ovr">OVR ${awayOvr} ${away.isPlayer ? '(自チーム)' : ''}</span>
          </div>
        </div>
        <div class="matchday-action-row">
          <button type="button" class="btn btn-primary btn-kickoff-pulse" id="btn-panel-kickoff">
            キックオフ（${playerMatchInfo.title}を開始）
          </button>
        </div>
      </div>
    `;

    // 業務タスク直下のMATCHDAYヒーローコンテナに本日の自チーム対戦カードを描画
    if (matchdaySection && matchdayHero) {
      matchdaySection.classList.remove('hidden');
      matchdayHero.innerHTML = myMatchHtml;

      // MATCHDAY内のキックオフボタンのイベントバインド（試合前に作戦最終確認を開く）
      const panelKickoffBtn = document.getElementById('btn-panel-kickoff');
      if (panelKickoffBtn) {
        panelKickoffBtn.addEventListener('click', () => openMatchPrecheckModal());
      }
    }

    if (container) {
      if (panelTitle) panelTitle.textContent = '本日の同日開催カード';

      let otherMatches = [];
      if (currentDay.isMatchDay && Array.isArray(currentDay.matchFixture)) {
        if (subtitle) subtitle.textContent = `第${currentDay.matchWeek}節 他9試合`;
        otherMatches = currentDay.matchFixture.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id));
      } else if (currentDay.isCupMatchDay) {
        if (playerMatchInfo && playerMatchInfo.type === 'euroLeague') {
          const comp = playerMatchInfo.comp;
          const md = currentDay.euroMd || (comp && comp.currentMatchweek) || 1;
          const euroSchedule = comp && comp.leagueSchedule && comp.leagueSchedule[md - 1];
          if (Array.isArray(euroSchedule)) {
            otherMatches = euroSchedule.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id)).slice(0, 8);
          }
          if (subtitle) subtitle.textContent = `${playerMatchInfo.title} 同日他カード`;
        } else if (playerMatchInfo && playerMatchInfo.type === 'euroPlayoff') {
          const comp = playerMatchInfo.comp;
          if (comp && Array.isArray(comp.playoffs)) {
            otherMatches = comp.playoffs.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id)).slice(0, 8);
          }
          if (subtitle) subtitle.textContent = `${playerMatchInfo.title} 同日他カード`;
        } else if (playerMatchInfo && playerMatchInfo.type === 'cup') {
          const comp = playerMatchInfo.comp;
          const rKey = currentDay.cupRoundKey;
          const roundMatches = comp && comp.rounds && comp.rounds[rKey];
          if (Array.isArray(roundMatches)) {
            otherMatches = roundMatches.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id)).slice(0, 8);
          }
          if (subtitle) subtitle.textContent = `${playerMatchInfo.title} 同日他カード`;
        } else {
          if (subtitle) subtitle.textContent = 'カップ戦・欧州コンペ開催日';
        }
      }

      if (otherMatches.length > 0) {
        const otherMatchesHtml = `
          ${otherMatches.map(m => {
            const h = m.homeClub || getClubById(m.homeId) || { name: m.homeId };
            const a = m.awayClub || getClubById(m.awayId) || { name: m.awayId };
            const hName = typeof getClubShortCode === 'function' ? getClubShortCode(h) : (h.shortName || h.name);
            const aName = typeof getClubShortCode === 'function' ? getClubShortCode(a) : (a.shortName || a.name);
            const hEmb = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(h, 20, 'mini-emblem') : '';
            const aEmb = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(a, 20, 'mini-emblem') : '';
            return `
              <div class="match-card">
                <div class="match-team home" style="display:flex;align-items:center;gap:4px;justify-content:flex-end;">
                  <span>${hName}</span>${hEmb}
                </div>
                <div class="match-score-box">VS</div>
                <div class="match-team away" style="display:flex;align-items:center;gap:4px;justify-content:flex-start;">
                  ${aEmb}<span>${aName}</span>
                </div>
              </div>
            `;
          }).join('')}
        `;
        container.innerHTML = otherMatchesHtml;
      } else {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">同日開催の他試合はありません。</div>';
      }
    }
    return;
  }

  // 試合日以外（平日・試合消化済み）：業務タスク下のMATCHDAYは非表示
  if (matchdaySection) {
    matchdaySection.classList.add('hidden');
    if (matchdayHero) matchdayHero.innerHTML = '';
  }

  // 画面下に試合ログコンテナが存在しない場合はここで終了
  if (!container) return;

  // パターン2：試合直後または試合消化済み（コンテナが存在する場合の後方互換）
  if (panelTitle) panelTitle.textContent = '試合結果・進行ログ';

  if (gameState.lastWeekResults.length === 0) {
    if (subtitle) subtitle.textContent = 'READY FOR KICKOFF';
    const nextMatches = gameState.schedule[0] || [];
    container.innerHTML = `
      <div class="empty-log-message">シーズン開幕前です。「次の試合まで進める」または「日程を進める」でシーズンを開始してください。</div>
      ${nextMatches.map(m => {
        const home = getClubById(m.homeId);
        const away = getClubById(m.awayId);
        const isPlayerMatch = home.isPlayer || away.isPlayer;
        return `
          <div class="match-card ${isPlayerMatch ? 'player-match' : ''}">
            <div class="match-team home ${home.isPlayer ? 'is-player' : ''}">${home.name}</div>
            <div class="match-score-box">VS</div>
            <div class="match-team away ${away.isPlayer ? 'is-player' : ''}">${away.name}</div>
          </div>
        `;
      }).join('')}
    `;
    return;
  }

  const weekNum = gameState.lastWeekResults[0].week;
  if (subtitle) subtitle.textContent = `MATCHWEEK ${weekNum} RESULTS`;

  let tickerHtml = '';
  if (gameState.lastMatchTicker && gameState.lastMatchTicker.events.length > 0) {
    tickerHtml = `
      <div class="match-ticker-box">
        <div class="ticker-header">
          <span class="ticker-title">第${gameState.lastMatchTicker.week}節 自チーム試合速報</span>
          <span class="ticker-live-badge">FULL TIME</span>
        </div>
        <div class="ticker-feed">
          ${gameState.lastMatchTicker.events.map(ev => `
            <div class="ticker-line ticker-${ev.type}">
              <span class="ticker-time">${ev.time}</span>
              <span class="ticker-text">${ev.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 直近の日報ミニログ
  let dailyLogHtml = '';
  if (gameState.dailyLogs && gameState.dailyLogs.length > 0) {
    dailyLogHtml = `
      <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px 10px; margin-bottom: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--accent-green); margin-bottom: 4px;">RECENT CLUB LOGS / 直近のクラブ動向</div>
        ${gameState.dailyLogs.slice(0, 3).map(log => `
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 2px;">
            <span class="mono" style="color: var(--text-main); font-weight: 700;">[${log.date}]</span> ${log.message}
          </div>
        `).join('')}
      </div>
    `;
  }

  const cardsHtml = gameState.lastWeekResults.map(r => {
    const isPlayerMatch = r.homeClub.isPlayer || r.awayClub.isPlayer;
    return `
      <div class="match-card ${isPlayerMatch ? 'player-match' : ''}">
        <div class="match-team home ${r.homeClub.isPlayer ? 'is-player' : ''}">${r.homeClub.name}</div>
        <div class="match-score-box">${r.homeScore} - ${r.awayScore}</div>
        <div class="match-team away ${r.awayClub.isPlayer ? 'is-player' : ''}">${r.awayClub.name}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = dailyLogHtml + tickerHtml + cardsHtml;
}

/**
 * 能力変化差分バッジのHTML文字列を生成
 */
function formatDiffHtml(val) {
  if (!val || val === 0) return '';
  if (val > 0) return `<span class="stat-diff diff-up">+${val}</span>`;
  return `<span class="stat-diff diff-down">${val}</span>`;
}

/**
 * 作戦ボード（ピッチUI・フォーメーション選択・控えワンクリック入替リスト）の描画
 */
function renderTacticalBoard() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  ensureValidSquadAndStarters(playerClub);

  const formationKey = playerClub.formation || '4-3-3';
  const formationDef = getClubFormationDef(playerClub);

  document.querySelectorAll('#formation-btn-group .btn-formation').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.formation === formationKey);
  });
  const formationSelectMobile = document.getElementById('formation-select-mobile');
  if (formationSelectMobile) {
    formationSelectMobile.value = formationKey;
  }

  const formationLabelEl = document.getElementById('roster-formation-label');
  if (formationLabelEl) {
    formationLabelEl.textContent = formationDef.name;
  }

  const pitchLayer = document.getElementById('pitch-nodes-layer');
  if (pitchLayer) {
    const existingNodes = pitchLayer.querySelectorAll('.pitch-node[data-slot-index]');
    const canUpdateInPlace = existingNodes.length === formationDef.slots.length;

    if (canUpdateInPlace) {
      formationDef.slots.forEach(sl => {
        const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === sl.slotIndex);
        const nodeEl = pitchLayer.querySelector(`.pitch-node[data-slot-index="${sl.slotIndex}"]`);
        if (!starter || !nodeEl) return;

        const fitInfo = getPositionFitInfo(starter, sl.pos);
        const posDisplay = formatPlayerPositionsText(starter, 'slash');
        const isSelected = gameState.selectedSlotIndex === sl.slotIndex;
        const effOvr = getEffectivePlayerRating(starter);
        const roleGroup = POS_ROLE_GROUP[sl.pos] || 'MF';

        const fitClass = fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out';

        const nodeClasses = [
          'pitch-node',
          `pos-group-${roleGroup}`,
          fitClass,
          isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');

        const fitBadgeHtml = starter.loanStatus?.isLoan ? '<span class="pitch-node-loan" title="レンタル加入選手">LOAN</span>' : '';

        const injuryBadgeHtml = starter.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${starter.injuryWeeks}節）">傷</span>`
          : '';

        nodeEl.className = nodeClasses;
        nodeEl.dataset.playerId = starter.id;
        nodeEl.style.left = `${sl.x}%`;
        nodeEl.style.top = `${sl.y}%`;
        nodeEl.innerHTML = `
          <div class="pitch-node-avatar-wrap">
            ${getPlayerAvatarHtml(starter, playerClub, 'pitch-node-avatar', 48)}
          </div>
          <div class="pitch-node-body">
            <div class="pitch-node-top">
              <span class="pitch-node-pos">${sl.pos}</span>
              <span class="pitch-node-ovr">OVR ${effOvr}</span>
            </div>
            <div class="pitch-node-name-btn clickable-player-name" data-profile-id="${starter.id}" title="タップで選手詳細プロフィールを表示">
              <span class="pitch-node-name-text">#${starter.squadNumber || '-'} ${starter.name}</span>
            </div>
            <div class="pitch-node-meta">
              <span class="pitch-node-pref">${posDisplay}</span>
              ${fitBadgeHtml}
              ${injuryBadgeHtml}
            </div>
          </div>
        `;
      });
    } else {
      pitchLayer.innerHTML = formationDef.slots.map(sl => {
        const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === sl.slotIndex);
        if (!starter) return '';

        const fitInfo = getPositionFitInfo(starter, sl.pos);
        const posDisplay = formatPlayerPositionsText(starter, 'slash');
        const isSelected = gameState.selectedSlotIndex === sl.slotIndex;
        const effOvr = getEffectivePlayerRating(starter);
        const roleGroup = POS_ROLE_GROUP[sl.pos] || 'MF';

        const fitClass = fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out';

        const nodeClasses = [
          'pitch-node',
          `pos-group-${roleGroup}`,
          fitClass,
          isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');

        const fitBadgeHtml = starter.loanStatus?.isLoan ? '<span class="pitch-node-loan" title="レンタル加入選手">LOAN</span>' : '';

        const injuryBadgeHtml = starter.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${starter.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="${nodeClasses}" data-slot-index="${sl.slotIndex}" data-player-id="${starter.id}" style="left: ${sl.x}%; top: ${sl.y}%;" title="ドラッグで選手交代 / タップで詳細プロフィール表示">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(starter, playerClub, 'pitch-node-avatar', 48)}
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${sl.pos}</span>
                <span class="pitch-node-ovr">OVR ${effOvr}</span>
              </div>
              <div class="pitch-node-name-btn clickable-player-name" data-profile-id="${starter.id}" title="タップで選手詳細プロフィールを表示">
                <span class="pitch-node-name-text">#${starter.squadNumber || '-'} ${starter.name}</span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${fitBadgeHtml}
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(pitchLayer);
  }

  // 右側：控え（ベンチ最大9名）およびベンチ外（リザーブ）リスト描画
  const subTitleEl = document.getElementById('pitch-sub-title');
  const clearBtnEl = document.getElementById('btn-clear-slot-select');
  const subGuideEl = document.getElementById('pitch-sub-guide');
  const benchListEl = document.getElementById('pitch-bench-list');
  const reservesBoxEl = document.getElementById('pitch-reserves-box');
  const reservesTitleEl = document.getElementById('pitch-reserves-title');
  const reservesListEl = document.getElementById('pitch-reserves-list');

  if (!benchListEl) return;

  const allNonStarters = playerClub.players.filter(p => !p.isStarter && !p.isRetired);
  const benchPlayers = allNonStarters.filter(p => p.isBench !== false).slice(0, 9);
  const reservePlayers = allNonStarters.filter(p => !benchPlayers.some(bp => bp.id === p.id));

  const selectedSlot = gameState.selectedSlotIndex !== null ? formationDef.slots[gameState.selectedSlotIndex] : null;
  const selectedStarter = selectedSlot
    ? playerClub.players.find(p => p.isStarter && p.slotIndex === selectedSlot.slotIndex)
    : null;

  if (selectedSlot && selectedStarter) {
    const starterEff = getEffectivePlayerRating(selectedStarter);
    if (subTitleEl) subTitleEl.textContent = `交代枠: [${selectedSlot.pos}] #${selectedStarter.squadNumber} ${selectedStarter.name}`;
    if (clearBtnEl) clearBtnEl.classList.remove('hidden');
    if (subGuideEl) subGuideEl.textContent = '';

    const sortedBench = [...benchPlayers].sort((a, b) => {
      const aFit = getPositionFitInfo(a, selectedSlot.pos).factor;
      const bFit = getPositionFitInfo(b, selectedSlot.pos).factor;
      if (aFit !== bFit) return bFit - aFit;
      return getEffectivePlayerRatingForSlot(b, selectedSlot.pos) - getEffectivePlayerRatingForSlot(a, selectedSlot.pos);
    });

    if (sortedBench.length === 0) {
      benchListEl.innerHTML = `<div class="empty-log-message">控え選手がいません。</div>`;
    } else {
      benchListEl.innerHTML = sortedBench.map(bp => {
        const fitInfo = getPositionFitInfo(bp, selectedSlot.pos);
        const simOvr = getEffectivePlayerRatingForSlot(bp, selectedSlot.pos);
        const posDisplay = formatPlayerPositionsText(bp, 'slash');
        const roleGroup = POS_ROLE_GROUP[bp.pos] || 'MF';

        const fitClass = fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out';
        const itemClass = fitClass;
        const fitBadgeHtml = '';

        const injuryBadgeHtml = bp.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${bp.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="pitch-node pos-group-${roleGroup} bench-sub-item ${itemClass}" data-player-id="${bp.id}" title="ドラッグまたはクリックで選手交代">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(bp, playerClub, 'pitch-node-avatar', 48)}
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${bp.pos}</span>
                <span class="pitch-node-ovr">OVR ${simOvr}</span>
              </div>
              <div class="pitch-node-name-btn">
                <span class="pitch-node-name-text">#${bp.squadNumber || '-'} ${bp.name}</span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${fitBadgeHtml}
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    if (subTitleEl) subTitleEl.textContent = `控え選手 (${benchPlayers.length}名)`;
    const sideBenchBadge = document.getElementById('side-bench-badge');
    if (sideBenchBadge) sideBenchBadge.textContent = `${benchPlayers.length}名`;
    if (clearBtnEl) clearBtnEl.classList.add('hidden');
    if (subGuideEl) subGuideEl.textContent = '';

    const sortedBench = [...benchPlayers].sort((a, b) => {
      const orderA = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[a.pos] : 99) || 99;
      const orderB = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[b.pos] : 99) || 99;
      if (orderA !== orderB) return orderA - orderB;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });

    if (sortedBench.length === 0) {
      benchListEl.innerHTML = `<div class="empty-log-message">控え選手がいません。</div>`;
    } else {
      benchListEl.innerHTML = sortedBench.map(bp => {
        const baseOvr = getPlayerOverallRating(bp);
        const posDisplay = formatPlayerPositionsText(bp, 'slash');
        const roleGroup = POS_ROLE_GROUP[bp.pos] || 'MF';

        const fitBadgeHtml = '';

        const injuryBadgeHtml = bp.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${bp.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="pitch-node pos-group-${roleGroup} bench-sub-item" data-player-id="${bp.id}" title="ドラッグまたはクリックで選手交代">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(bp, playerClub, 'pitch-node-avatar', 48)}
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${bp.pos}</span>
                <span class="pitch-node-ovr">OVR ${baseOvr}</span>
              </div>
              <div class="pitch-node-name-btn">
                <span class="pitch-node-name-text">#${bp.squadNumber || '-'} ${bp.name}</span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${fitBadgeHtml}
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(benchListEl);

  // ベンチ外（リザーブ）リストの描画（21人目以降の選手：PCおよびモバイル両方で常時表示）
  if (reservesBoxEl && reservesListEl) {
    reservesBoxEl.classList.remove('hidden');
    if (reservesTitleEl) {
      reservesTitleEl.textContent = `ベンチ外 (${reservePlayers.length}名)`;
    }

    if (reservePlayers.length === 0) {
      reservesListEl.innerHTML = `
        <div class="empty-reserve-slot">
          <span class="empty-reserve-text">ベンチ外選手なし</span>
        </div>
      `;
    } else {

      const sortedReserves = [...reservePlayers].sort((a, b) => {
        if (selectedSlot) {
          const aFit = getPositionFitInfo(a, selectedSlot.pos).factor;
          const bFit = getPositionFitInfo(b, selectedSlot.pos).factor;
          if (aFit !== bFit) return bFit - aFit;
          return getEffectivePlayerRatingForSlot(b, selectedSlot.pos) - getEffectivePlayerRatingForSlot(a, selectedSlot.pos);
        } else {
          const orderA = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[a.pos] : 99) || 99;
          const orderB = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[b.pos] : 99) || 99;
          if (orderA !== orderB) return orderA - orderB;
          return getPlayerOverallRating(b) - getPlayerOverallRating(a);
        }
      });

      reservesListEl.innerHTML = sortedReserves.map(rp => {
        const fitInfo = selectedSlot ? getPositionFitInfo(rp, selectedSlot.pos) : null;
        const ovrVal = selectedSlot ? getEffectivePlayerRatingForSlot(rp, selectedSlot.pos) : getPlayerOverallRating(rp);
        const posDisplay = formatPlayerPositionsText(rp, 'slash');
        const roleGroup = POS_ROLE_GROUP[rp.pos] || 'MF';

        const fitClass = fitInfo ? (
          fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out'
        ) : '';

        const injuryBadgeHtml = rp.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${rp.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="pitch-node pos-group-${roleGroup} bench-sub-item reserve-node ${fitClass}" data-player-id="${rp.id}" title="ドラッグまたはクリックで選手交代">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(rp, playerClub, 'pitch-node-avatar', 48)}
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${rp.pos}</span>
                <span class="pitch-node-ovr">OVR ${ovrVal}</span>
              </div>
              <div class="pitch-node-name-btn">
                <span class="pitch-node-name-text">#${rp.squadNumber || '-'} ${rp.name}</span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(reservesListEl);
    }
  }
}

/**
 * クラブ戦術方針の描画
 */
function renderTacticsOverview() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;
  const currentTactic = normalizeTacticKey(playerClub.tactic);
  playerClub.tactic = currentTactic;
  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === currentTactic);
  });
  document.querySelectorAll('.tactics-guide-item[data-tactic-card]').forEach(card => {
    card.classList.toggle('active-guide', card.dataset.tacticCard === currentTactic);
  });
  const tacticDef = TACTICS_DEFINITIONS[currentTactic];
  if (tacticDef) {
    const badge = document.getElementById('current-tactic-badge');
    if (badge) badge.textContent = tacticDef.badge;
    const desc = document.getElementById('current-tactic-desc');
    if (desc) desc.textContent = tacticDef.desc;
  }
}

/**
 * 自チーム登録選手一覧の描画（9ポジション順ソート、メイン100%/サブ92%/適性外80%、契約延長ボタン含む）
 */
function renderRoster() {
  const playerClub = getPlayerClub();
  renderTacticalManagerBanner();
  renderTacticalBoard();
  renderTacticsOverview();

  const stats = getTeamStarterStats(playerClub);
  const payroll = getClubTotalPayroll(playerClub);

  document.getElementById('team-total-atk').textContent = Math.round(stats.totalAtk);
  document.getElementById('team-total-def').textContent = Math.round(stats.totalDef);
  document.getElementById('team-avg-sta').textContent = stats.avgSta;
  document.getElementById('roster-total-payroll').textContent = formatMoney(payroll);

  const currentTactic = normalizeTacticKey(playerClub.tactic);
  playerClub.tactic = currentTactic;
  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === currentTactic);
  });
  const tacticDef = TACTICS_DEFINITIONS[currentTactic];
  if (tacticDef) {
    document.getElementById('current-tactic-badge').textContent = tacticDef.badge;
    document.getElementById('current-tactic-desc').textContent = tacticDef.desc;
  }

  const gkCount = playerClub.players.filter(p => p.pos === 'GK').length;

  const sortedPlayers = [...playerClub.players].sort((a, b) => {
    const orderA = POS_DISPLAY_ORDER[a.pos] || 99;
    const orderB = POS_DISPLAY_ORDER[b.pos] || 99;
    if (orderA !== orderB) return orderA - orderB;
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    return getPlayerOverallRating(b) - getPlayerOverallRating(a);
  });

  const tbody = document.getElementById('roster-tbody');
  tbody.innerHTML = sortedPlayers.map(p => {
    const rowClasses = [];
    if (!p.isStarter) rowClasses.push('row-bench');
    if (gameState.selectedPlayerId === p.id) rowClasses.push('row-selected');

    const baseOvr = getPlayerOverallRating(p);
    const effOvr = getEffectivePlayerRating(p);
    const assignedSlot = p.isStarter ? (p.assignedPos || p.pos) : null;
    const fitInfo = p.isStarter ? getPositionFitInfo(p, assignedSlot) : { type: 'main', factor: 1.0 };

    const playerClub = getPlayerClub();
  const isYouth = (playerClub && playerClub.youthSquad || []).some(y => y.id === p.id);
  const isCandidate = (gameState.youthCandidates || []).some(y => y.id === p.id);
  const growthLabel = isYouth ? '未確定（育成中）' : getGrowthCurveLabel(p.growthCurve);
  const growthClass = isYouth ? 'growth-unknown' : `growth-${p.growthCurve}`;
    const growthBadge = `<span class="growth-pill ${growthClass}">${growthLabel}</span>`;

    const atkDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.atk) : '';
    const defDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.def) : '';
    const staDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.sta) : '';

    const canRelease = playerClub.players.length > 11 && !(p.pos === 'GK' && gkCount <= 1) && !gameState.isGameOver;
    const releaseBtnLabel = canRelease ? '自由契約' : '必須枠';

    const canExtend = p.contractYears <= 2 && !gameState.isGameOver;
    let extendBtnHtml = '';
    if (p.contractRefused) {
      extendBtnHtml = `<button type="button" class="btn btn-secondary btn-sm" disabled title="交渉決裂のためオフシーズンにフリー流出確定">交渉決裂</button>`;
    } else if (canExtend) {
      extendBtnHtml = `<button type="button" class="btn btn-accent btn-sm btn-extend-contract" data-extend-id="${p.id}" title="契約延長・年俸交渉モーダルを開く">契約交渉</button>`;
    }

    const canDemoteToYouth = p.age <= 21 && !p.isStarter && (playerClub.youthSquad?.length < MAX_YOUTH_SQUAD_SIZE);
    let demoteBtnHtml = '';
    if (p.age <= 21) {
      const demoteTitle = p.isStarter
        ? 'スタメン選手は降格不可（先にベンチへ移動させてください）'
        : (playerClub.youthSquad?.length >= MAX_YOUTH_SQUAD_SIZE ? 'U-21ユース枠満杯（最大10名）' : 'U-21ユースへ合流');
      demoteBtnHtml = `<button type="button" class="btn btn-secondary btn-sm btn-demote-youth" data-demote-id="${p.id}" ${canDemoteToYouth ? '' : 'disabled'} title="${demoteTitle}">U-21降格</button>`;
    }

    // 22歳以下の若手に対する「レンタル（レンタル放出）」ボタン
    let loanListingBtnHtml = '';
    if (p.age <= 22 && !p.isStarter && (!p.loanStatus || !p.loanStatus.isLoanOut) && !p.loanStatus?.isLoan) {
      if (p.isLoanListed) {
        loanListingBtnHtml = `<button type="button" class="btn btn-outline btn-sm btn-loan-listing" data-loan-list-id="${p.id}" title="レンタルリストから解除" style="color:#f39c12;border-color:#f39c12;">レンタル解除</button>`;
      } else {
        loanListingBtnHtml = `<button type="button" class="btn btn-secondary btn-sm btn-loan-listing" data-loan-list-id="${p.id}" title="他クラブへの1年間レンタル（レンタル放出）リストに設定（成長加速ボーナス+30%）">レンタル</button>`;
      }
    }



    let fitBadge = '';
    if (p.isStarter) {
      if (fitInfo.type === 'sub') {
        if (fitInfo.type === 'sub') {
        fitBadge = '<span class="sub-badge badge-subpos" style="color:#38bdf8;border-color:rgba(56,189,248,0.4);">◯ 薄適性</span>';
      } else if (fitInfo.type === 'semi') {
        fitBadge = '<span class="sub-badge badge-warn" style="color:#f1c40f;border-color:rgba(241,196,15,0.4);background:rgba(241,196,15,0.15);">△ 近接</span>';
      }
      } else if (fitInfo.type === 'out') {
        fitBadge = '<span class="sub-badge badge-penalty">✕ 不適</span>';
      }
    }
    const trainingBadge = p.positionTraining
      ? `<span class="sub-badge badge-training" title="新ポジション特訓進行中">特訓:${p.positionTraining.targetPos} (${Math.round(p.positionTraining.progress)}%)</span>`
      : '';

    const injuryBadge = p.injuryWeeks > 0 ? `<span class="sub-badge badge-injury">負傷:残${p.injuryWeeks}節</span>` : '';
    const refusedBadge = p.contractRefused ? `<span class="sub-badge badge-refused">流出確定</span>` : '';
    const moraleBadge = (!p.contractRefused && p.megaOfferRejected) ? `<span class="sub-badge badge-morale-down">昇給要求</span>` : '';
    const loanInBadge = p.loanStatus?.isLoan ? '<span class="sub-badge badge-loan">LOAN</span>' : '';
    const loanOutBadge = p.loanStatus?.isLoanOut ? `<span class="sub-badge badge-loanout">レンタル中(${p.loanStatus.toClubName})</span>` : '';
    const loanListedBadge = (p.isLoanListed && !p.loanStatus?.isLoanOut) ? '<span class="sub-badge badge-loanlisted">レンタル募集中</span>' : '';
    const preDepartBadge = p.preContractDeparture ? `<span class="sub-badge badge-refused">来季流出(${p.preContractDeparture.toClubName})</span>` : '';

    let ovrDisplay = `<strong>${effOvr}</strong>`;
    if (p.injuryWeeks > 0 || fitInfo.type === 'out') {
      ovrDisplay = `<span class="text-danger">${effOvr}</span> <span class="text-muted">(${baseOvr})</span>`;
    } else if (fitInfo.type === 'sub') {
      ovrDisplay = `<span class="text-cyan">${effOvr}</span> <span class="text-muted">(${baseOvr})</span>`;
    }

    const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(1) : '-';

    let contractClass = '';
    let contractText = `${p.contractYears}年`;
    if (p.contractRefused) {
      contractClass = 'contract-expired';
      contractText = '決裂(流出)';
    } else if (p.contractYears <= 0) {
      contractClass = 'contract-expired';
      contractText = '満了(0年)';
    } else if (p.contractYears === 1) {
      contractClass = 'contract-expiring';
      contractText = '残り1年';
    } else if (p.contractYears === 2) {
      contractText = '残り2年';
    }

    return `
      <tr class="${rowClasses.join(' ')}" data-player-id="${p.id}">
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="クリックで選手詳細プロフィールを表示">
            ${getPlayerAvatarHtml(p, playerClub, 'avatar-sm table-avatar')}<span class="mono text-muted roster-squad-num">#${p.squadNumber || '-'}</span> <span class="player-name-text">${p.name}</span>
          </button>
          ${fitBadge}${trainingBadge}${injuryBadge}${refusedBadge}${moraleBadge}${loanInBadge}${loanOutBadge}${loanListedBadge}${preDepartBadge}
        </td>
        <td class="col-num">${p.age}</td>
        <td class="col-num accent-green">${ovrDisplay}</td>
        <td class="col-num">${p.appearances}</td>
        <td class="col-num accent-gold"><strong>${p.goals}</strong></td>
        <td class="col-num accent-green">${avgRating}</td>
        <td class="col-num">${p.atk}${atkDiff}</td>
        <td class="col-num">${p.def}${defDiff}</td>
        <td class="col-num">${p.sta}${staDiff}</td>
        <td class="col-num">${formatFatigueCellHtml(p)}</td>
        <td class="col-num ${contractClass}">${contractText}</td>
        <td class="col-num mono" title="年間総給与: ${formatMoney(p.salary)}">
          <strong>${formatWage(p.wage || Math.round(p.salary / 52))}</strong><br>
          <span class="text-muted" style="font-size:10px;">(${formatMoney(p.salary)})</span>
        </td>
        <td class="col-action">
          <div class="action-btn-group action-btn-grid">
            <div class="action-slot slot-extend">${extendBtnHtml}</div>
            <div class="action-slot slot-loan">${loanListingBtnHtml}</div>
            <div class="action-slot slot-demote">${demoteBtnHtml}</div>
            <div class="action-slot slot-release">
              <button type="button" class="btn btn-danger btn-sm btn-release-player" data-release-id="${p.id}" ${canRelease ? '' : 'disabled'}>
                ${releaseBtnLabel}
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * 全20クラブの全所属選手を網羅するグローバル移籍市場の描画
 */

/**
 * 獲得ターゲットリスト（SHORTLIST）への追加／解除トグル
 */
function toggleShortlist(playerId) {
  if (!gameState.targetShortlist) gameState.targetShortlist = [];
  const idx = gameState.targetShortlist.indexOf(playerId);
  const ctx = findPlayerWithContextById(playerId);
  const pName = ctx ? ctx.player.name : '選手';

  if (idx !== -1) {
    gameState.targetShortlist.splice(idx, 1);
    addDailyLog(`【ターゲット解除】${pName} を獲得ターゲットリストから除外しました。`);
  } else {
    gameState.targetShortlist.push(playerId);
    addDailyLog(`【ターゲット登録】${pName} を獲得ターゲットリストに追加しました。`);
  }
  updateMarketBadges();
  renderMarket();
  renderShortlist();
}

function isInShortlist(playerId) {
  return Boolean(gameState.targetShortlist && gameState.targetShortlist.includes(playerId));
}

/**
 * 移籍タブ内のサブタブ切り替え ('market' | 'shortlist' | 'offers')
 */
function switchMarketSubtab(subtabKey) {
  gameState.marketSubtab = subtabKey;
  const viewMarket = document.getElementById('view-market');
  if (viewMarket) {
    viewMarket.setAttribute('data-market-subtab', subtabKey);
  }

  // ボタンのアクティブ状態更新
  const btns = document.querySelectorAll('#market-subnav-bar .roster-subtab-btn');
  btns.forEach(btn => {
    const isAct = btn.dataset.marketSubtab === subtabKey;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // サブビューの表示切り替え
  const subviews = {
    market: document.getElementById('market-subview-market'),
    shortlist: document.getElementById('market-subview-shortlist'),
    offers: document.getElementById('market-subview-offers')
  };

  Object.keys(subviews).forEach(key => {
    const el = subviews[key];
    if (el) {
      el.classList.toggle('hidden', key !== subtabKey);
    }
  });

  if (subtabKey === 'market') renderMarket();
  else if (subtabKey === 'shortlist') renderShortlist();
  else if (subtabKey === 'offers') renderIncomingOffers();
}

/**
 * 経営画面内のサブタブ切り替え（施設投資 / 監督・指導陣 / ユースチーム）
 */
function switchFacilitiesSubtab(subtabKey) {
  if (!subtabKey) subtabKey = 'investment';
  gameState.facilitiesSubtab = subtabKey;
  const viewFacilities = document.getElementById('view-facilities');
  if (viewFacilities) {
    viewFacilities.setAttribute('data-facilities-subtab', subtabKey);
  }

  // ボタンのアクティブ状態更新
  const btns = document.querySelectorAll('#facilities-subnav-bar .roster-subtab-btn');
  btns.forEach(btn => {
    const isAct = btn.dataset.facilitiesSubtab === subtabKey;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // サブビューの表示切り替え
  const subviews = {
    investment: document.getElementById('facilities-subview-investment'),
    staff: document.getElementById('facilities-subview-staff'),
    youth: document.getElementById('facilities-subview-youth')
  };

  Object.keys(subviews).forEach(key => {
    const el = subviews[key];
    if (el) {
      el.classList.toggle('hidden', key !== subtabKey);
    }
  });

  if (subtabKey === 'investment') {
    renderFacilitiesAndYouth();
  } else if (subtabKey === 'staff') {
    renderManagerManagementPanel();
    renderCoachingStaffPanel();
  } else if (subtabKey === 'youth') {
    renderYouthSquad();
  }
}

/**
 * 移籍サブタブのバッジ件数表示を更新
 */
function updateMarketBadges() {
  const shortlistCount = (gameState.targetShortlist || []).length;
  
  // アクティブなオファー件数（未完了かつ期限内のもののみカウント）
  const incomingActiveCount = (gameState.incomingOffers || []).filter(o => (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') && ((o.daysLeft ?? 1) > 0)).length;
  const outgoingActiveCount = (gameState.outgoingOffers || []).filter(o => o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter').length;
  const totalActiveOffers = incomingActiveCount + outgoingActiveCount;

  const bShortlist = document.getElementById('badge-shortlist-count');
  if (bShortlist) {
    bShortlist.textContent = `(${shortlistCount})`;
    bShortlist.classList.toggle('has-items', shortlistCount > 0);
  }

  const bOffers = document.getElementById('badge-offers-count');
  if (bOffers) {
    bOffers.textContent = `(${totalActiveOffers})`;
    bOffers.classList.toggle('has-items', totalActiveOffers > 0);
  }

  const bInOffers = document.getElementById('badge-incoming-offers-count');
  if (bInOffers) {
    bInOffers.textContent = `(${incomingActiveCount})`;
    bInOffers.classList.toggle('has-items', incomingActiveCount > 0);
  }

  const bOutOffers = document.getElementById('badge-outgoing-offers-count');
  if (bOutOffers) {
    bOutOffers.textContent = `(${outgoingActiveCount})`;
    bOutOffers.classList.toggle('has-items', outgoingActiveCount > 0);
  }

  const summaryCount = document.getElementById('shortlist-summary-count');
  if (summaryCount) summaryCount.textContent = `${shortlistCount}名`;

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const summaryFunds = document.getElementById('shortlist-summary-funds');
  if (summaryFunds && playerClub) summaryFunds.textContent = formatMoney(playerClub.funds);

  const offersSummaryCount = document.getElementById('offers-summary-count');
  if (offersSummaryCount) offersSummaryCount.textContent = `${totalActiveOffers}件`;
}


function renderShortlist() {
  const tbody = document.getElementById('shortlist-tbody');
  if (!tbody) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const ids = gameState.targetShortlist || [];
  if (ids.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-log-message" style="text-align: center; padding: 28px;">
          現在獲得ターゲットに登録されている選手はいません。「選手市場 (MARKET)」タブから気になる選手を「＋ SHORTLIST」で追加してください。
        </td>
      </tr>
    `;
    return;
  }

  const rows = [];
  for (const id of ids) {
    const ctx = findPlayerWithContextById(id);
    if (!ctx) continue;
    const { player: p, clubName } = ctx;
    const ovr = getPlayerOverallRating(p);
    const fee = calculateTransferFee(p);
    const isBargain = p.contractYears === 1;
    const isPreContracted = Array.isArray(gameState.preContractPlayers) && gameState.preContractPlayers.some(x => x.id === p.id);
    const preContractBadge = isPreContracted ? '<span class="sub-badge badge-precontract">[内定済]</span>' : '';
    const freeBadge = p.isFreeAgent ? '<span class="sub-badge badge-free">[無所属]</span>' : '';
    const bargainBadge = isBargain ? '<span class="sub-badge badge-bargain">[契約最終年]</span>' : '';
    const failedBadge = p.negotiationFailed ? '<span class="sub-badge badge-refused">交渉決裂済</span>' : '';

    const activeOutOffer = (gameState.outgoingOffers || []).find(o => o.playerId === p.id && (o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter'));
    let offerStatusBadge = '';
    let offerBtnHtml = '';

    if (activeOutOffer) {
      if (activeOutOffer.status === 'agreed') {
        offerStatusBadge = '<span class="sub-badge badge-bargain" style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; border-color: #2ecc71;">オファー合意</span>';
        offerBtnHtml = `<button type="button" class="btn btn-sm btn-offer-accept" data-goto-offers="outgoing" style="font-weight: 700; padding: 2px 8px; font-size: 11px;">契約確定へ</button>`;
      } else if (activeOutOffer.status === 'cpu_counter') {
        offerStatusBadge = '<span class="sub-badge" style="background: rgba(243, 156, 18, 0.2); color: #f39c12; border-color: #f39c12;">増額逆提示あり</span>';
        offerBtnHtml = `<button type="button" class="btn btn-sm" data-goto-offers="outgoing" style="background: #f39c12; color: #0d1117; font-weight: 700; padding: 2px 8px; font-size: 11px;">回答確認</button>`;
      } else {
        offerStatusBadge = `<span class="sub-badge" style="background: rgba(243, 156, 18, 0.15); color: #f39c12;">回答待ち(${activeOutOffer.pendingDays || 1}日)</span>`;
        offerBtnHtml = `<button type="button" class="btn btn-sm btn-disabled" disabled style="opacity: 0.6; padding: 2px 8px; font-size: 11px;">送信中</button>`;
      }
    } else {
      offerBtnHtml = `<button type="button" class="btn btn-primary btn-sm btn-formal-offer" data-formal-offer-id="${p.id}" ${p.negotiationFailed ? 'disabled' : ''}>正式オファー</button>`;
    }    const footBadge = formatFootBadge(p);

    rows.push(`
      <tr>
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="スカウティングレポートを表示">
            ${getPlayerAvatarHtml(p, ctx.club, 'avatar-sm table-avatar')}${p.name}
          </button>
          ${preContractBadge}${freeBadge}${bargainBadge}${failedBadge}${offerStatusBadge}
        </td>
        <td class="col-team" title="${clubName}"><span class="team-cell-wrap">${getClubEmblemSvg(ctx.club || clubName, 18, 'market-club-emblem')}<strong class="mono" style="font-weight:700;">${getClubShortCode(ctx.club || clubName)}</strong></span></td>
        <td class="col-num">${p.age}歳</td>
        <td class="col-num">${footBadge}</td>
        <td class="col-num accent-green"><strong>${ovr}</strong></td>
        <td class="col-num accent-gold mono"><strong>${formatMoney(fee)}</strong></td>
        <td class="col-num mono">${formatWage(p.wage || 20)}</td>
        <td class="col-num ${isBargain ? 'contract-expiring' : ''}">${p.contractYears}年</td>
        <td class="col-action" style="white-space: nowrap;">
          <button type="button" class="btn btn-secondary btn-sm" data-profile-id="${p.id}" title="選手詳細スカウティングレポート">詳細</button>
          ${offerBtnHtml}
          <button type="button" class="btn btn-outline btn-sm btn-shortlist-remove" data-shortlist-remove="${p.id}" title="ターゲットリストから除外">解除</button>
        </td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * 受信オファーリスト（INCOMING OFFERS）を描画
 */
/**
 * オファー切り替えタブ処理 ('incoming' | 'outgoing')
 */
function switchOffersTab(tabKey) {
  if (!tabKey) tabKey = 'incoming';
  gameState.offersSubtab = tabKey;

  const btnIncoming = document.getElementById('offers-tab-btn-incoming');
  const btnOutgoing = document.getElementById('offers-tab-btn-outgoing');
  if (btnIncoming) btnIncoming.classList.toggle('active', tabKey === 'incoming');
  if (btnOutgoing) btnOutgoing.classList.toggle('active', tabKey === 'outgoing');

  renderIncomingOffers();
}

/**
 * オファーリスト（受信オファー / 送信オファー）描画
 */
function renderIncomingOffers() {
  const container = document.getElementById('incoming-offers-container');
  if (!container) return;

  const subtab = gameState.offersSubtab || 'incoming';

  // タブボタンのアクティブ状態更新
  const btnIncoming = document.getElementById('offers-tab-btn-incoming');
  const btnOutgoing = document.getElementById('offers-tab-btn-outgoing');
  if (btnIncoming) btnIncoming.classList.toggle('active', subtab === 'incoming');
  if (btnOutgoing) btnOutgoing.classList.toggle('active', subtab === 'outgoing');

  const playerClub = getPlayerClub();

  if (subtab === 'outgoing') {
    // 送信オファー一覧の描画
    const offers = gameState.outgoingOffers || [];
    if (offers.length === 0) {
      container.innerHTML = `
        <div class="empty-log-message" style="text-align: center; padding: 32px; background: #161b22; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.15);">
          現在、送信中のオファーはありません。<br>「選手市場」や「獲得ターゲット」から選手を選び、獲得交渉を行うとここにオファーが表示されます。
        </div>
      `;
      return;
    }

    container.innerHTML = offers.map(offer => {
      let target = null;
      let sellerClub = null;
      if (offer.sellerClubId) {
        sellerClub = gameState.clubs.find(c => c.id === offer.sellerClubId);
        if (sellerClub) target = sellerClub.players.find(p => p.id === offer.playerId);
      }
      if (!target) {
        for (const c of gameState.clubs) {
          const p = c.players.find(x => x.id === offer.playerId);
          if (p) { target = p; sellerClub = c; break; }
        }
      }
      if (!target && Array.isArray(gameState.transferMarket)) {
        target = gameState.transferMarket.find(c => c.id === offer.playerId);
      }

      // ステータスバッジ
      let statusBadge = '';
      let actionButtons = '';

      if (offer.status === 'pending') {
        statusBadge = `<span class="offer-deadline-badge mono accent-gold" style="border: 1px solid rgba(243, 156, 18, 0.4); background: rgba(243, 156, 18, 0.1);">相手回答待ち（残り約${offer.pendingDays || 1}日）</span>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-reject" data-outgoing-cancel="${offer.id}">オファー撤回</button>
        `;
      } else if (offer.status === 'cpu_counter') {
        statusBadge = `<span class="offer-deadline-badge mono accent-gold" style="border: 1px solid rgba(243, 156, 18, 0.4); background: rgba(243, 156, 18, 0.15); font-weight: 700;">相手より増額逆提示あり（回答期限: 残り${offer.pendingDays || 1}日）</span>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-outgoing-accept-counter="${offer.id}" style="font-weight: 700;">増額を受け入れて合意 (${formatMoney(offer.counterFee)})</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-outgoing-cancel="${offer.id}">拒否・交渉終了</button>
        `;
      } else if (offer.status === 'agreed') {
        statusBadge = `<span class="offer-deadline-badge mono accent-green" style="border: 1px solid rgba(46, 204, 113, 0.4); background: rgba(46, 204, 113, 0.15); font-weight: 700;">合意！ 契約確定待ち</span>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-outgoing-sign="${offer.id}" style="font-weight: 700;">契約を確定して加入 (SIGN)</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-outgoing-cancel="${offer.id}">見送り (CANCEL)</button>
        `;
      } else if (offer.status === 'signed') {
        statusBadge = `<span class="offer-deadline-badge mono accent-green" style="opacity: 0.9;">加入完了</span>`;
        actionButtons = `
          <span class="mono accent-green" style="font-size: 11.5px; padding: 4px;">契約成立・チーム加入済み</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      } else if (offer.status === 'rejected') {
        statusBadge = `<span class="offer-deadline-badge mono text-danger" style="border: 1px solid rgba(231, 76, 60, 0.4); background: rgba(231, 76, 60, 0.1);">交渉決裂（相手拒絶）</span>`;
        actionButtons = `
          <span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">オファーは拒絶されました</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      } else {
        statusBadge = `<span class="offer-deadline-badge mono text-muted">撤回済み</span>`;
        actionButtons = `
          <span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">撤回済み</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      }

      return `
        <div class="incoming-offer-card-item">
          <div class="offer-card-header">
            <div class="offer-club-badge">
              <span style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">相手クラブ: ${getClubEmblemSvg(offer.sellerClubId || offer.sellerClubName, 18, 'offer-club-emblem')}<strong>${offer.sellerClubName}</strong></span>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div class="offer-card-player-row">
            <button type="button" class="offer-player-avatar-wrap clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="background: none; border: none; padding: 0; cursor: pointer;">
              ${target ? getPlayerAvatarHtml(target, sellerClub, 'avatar-md') : ''}
            </button>
            <div class="offer-player-meta">
              <div class="offer-player-name">
                <span class="accent-green mono">[${offer.playerPos}]</span>
                <button type="button" class="player-name-link clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="font-weight: 700; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; background: none; border: none; padding: 0; color: #fff;">
                  #${offer.squadNumber} ${offer.playerName}
                </button>
              </div>
              <div class="offer-player-tags">
                <span>${offer.playerAge}歳</span>
                <span>OVR <strong class="accent-green">${offer.ovr}</strong></span>
              </div>
            </div>
          </div>

          <div class="offer-card-finances">
            <div class="offer-finance-block">
              <span class="offer-finance-label">提示移籍金</span>
              <span class="offer-finance-val accent-gold mono">${formatMoney(offer.offeredFee)}</span>
            </div>
            <div class="offer-finance-block">
              <span class="offer-finance-label">提示週給 / 契約</span>
              <span class="offer-finance-val mono">${formatWage(offer.offeredWage)} (${offer.offeredYears}年)</span>
            </div>
          </div>

          <div class="offer-card-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');

    return;
  }

  // 受信オファー一覧の描画（incoming）
  const offers = gameState.incomingOffers || [];
  if (offers.length === 0) {
    container.innerHTML = `
      <div class="empty-log-message" style="text-align: center; padding: 32px; background: #161b22; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.15);">
        現在他クラブからの受信オファーはありません。移籍ウィンドウが開いている期間中、主力選手の活躍に応じて海外のクラブ等から打診が届きます。
      </div>
    `;
    return;
  }

  container.innerHTML = offers.map(offer => {
    const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
    const avatarHtml = target ? getPlayerAvatarHtml(target, playerClub, 'avatar-md') : '';
    const footBadge = target ? formatFootBadge(target) : '';

    let deadlineBadge = '';
    let actionButtons = '';

    if (offer.status === 'negotiating') {
      deadlineBadge = `<span class="offer-deadline-badge mono accent-gold" style="border: 1px solid rgba(243, 156, 18, 0.4); background: rgba(243, 156, 18, 0.1);">上乗せ回答待ち (残り${offer.pendingDays || 1}日)</span>`;
      actionButtons = `
        <div style="flex: 1; text-align: center; padding: 6px 10px; background: rgba(243, 156, 18, 0.15); border: 1px solid rgba(243, 156, 18, 0.4); border-radius: 4px; color: #f39c12; font-size: 11.5px; font-weight: 700;" class="mono">
          相手クラブ回答待ち中 (要求額: ${formatMoney(offer.demandedFee || offer.counterFee)})
        </div>
      `;
    } else if (offer.status === 'counter_agreed') {
      deadlineBadge = `<span class="offer-deadline-badge mono accent-green" style="border: 1px solid rgba(46, 204, 113, 0.4); background: rgba(46, 204, 113, 0.15); font-weight: 700;">上乗せ合意！ 残り期限: ${offer.daysLeft}日</span>`;
      actionButtons = `
        <button type="button" class="btn btn-sm btn-offer-accept" data-offer-accept="${offer.id}">新金額で承諾 (ACCEPT: ${formatMoney(offer.offerFee)})</button>
        <button type="button" class="btn btn-sm btn-offer-reject" data-offer-reject="${offer.id}">拒絶 (REJECT)</button>
      `;
    } else if (offer.status === 'accepted') {
      deadlineBadge = `<span class="offer-deadline-badge mono accent-green" style="opacity: 0.8;">売却成立済み</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">移籍完了（売却額: ${formatMoney(offer.offerFee)}）</span>`;
    } else if (offer.status === 'rejected') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-danger" style="opacity: 0.8;">拒否済み</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">オファー拒否</span>`;
    } else if (offer.status === 'counter_rejected') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-danger" style="opacity: 0.8;">交渉決裂（相手撤退）</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">上乗せ不合意・相手クラブ撤退</span>`;
    } else if (offer.status === 'expired') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-muted" style="opacity: 0.8;">期限切れ</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">回答期限切れ</span>`;
    } else {
      // 通常の pending
      if (offer.isLoanOffer) {
        deadlineBadge = `<div class="offer-deadline-badge mono accent-green">レンタル打診（残り${offer.daysLeft}日）</div>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-offer-accept="${offer.id}" style="font-weight: 700;">レンタルへ送り出す (承諾)</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-offer-reject="${offer.id}">残留させる (拒絶)</button>
        `;
      } else {
        deadlineBadge = `<div class="offer-deadline-badge mono">回答期限: 残り${offer.daysLeft}日</div>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-offer-accept="${offer.id}">承諾 (ACCEPT)</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-offer-reject="${offer.id}">拒否 (REJECT)</button>
          <button type="button" class="btn btn-sm btn-offer-counter" data-offer-counter="${offer.id}" title="希望の移籍金を相手に提示して交渉します">上乗せ (COUNTER)</button>
        `;
      }
    }

    return `
      <div class="incoming-offer-card-item ${offer.isMegaClub ? 'is-mega' : ''}">
        <div class="offer-card-header">
          <div class="offer-club-badge">
            <span style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">${offer.isMegaClub ? '★ ' : ''}${getClubEmblemSvg(offer.buyerClubName, 18, 'offer-club-emblem')}<strong>${offer.buyerClubName}</strong> (${offer.buyerClubCountry})</span>
          </div>
          <div>
            ${deadlineBadge}
          </div>
        </div>

        <div class="offer-card-player-row">
          <button type="button" class="offer-player-avatar-wrap clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="background: none; border: none; padding: 0; cursor: pointer;">
            ${avatarHtml}
          </button>
          <div class="offer-player-meta">
            <div class="offer-player-name">
              <span class="accent-green mono">[${offer.playerPos}]</span>
              <button type="button" class="player-name-link clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="font-weight: 700; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; background: none; border: none; padding: 0; color: #fff;">
                #${offer.squadNumber} ${offer.playerName}
              </button>
            </div>
            <div class="offer-player-tags">
              <span>${offer.playerAge}歳</span>
              <span>OVR <strong class="accent-green">${offer.ovr}</strong></span>
              <span>${footBadge}</span>
            </div>
          </div>
        </div>

        <div class="offer-card-finances">
          <div class="offer-finance-block">
            <span class="offer-finance-label">${offer.isLoanOffer ? '取引種別' : '提示移籍金'}</span>
            <span class="offer-finance-val ${offer.isLoanOffer ? 'accent-green' : 'accent-gold'} mono">${offer.isLoanOffer ? '1年レンタル' : formatMoney(offer.offerFee)}</span>
          </div>
          <div class="offer-finance-block">
            <span class="offer-finance-label">${offer.isLoanOffer ? '給与負担' : '選手週給'}</span>
            <span class="offer-finance-val mono ${offer.isLoanOffer ? 'accent-green' : ''}">${offer.isLoanOffer ? '相手100%全額負担' : formatWage(offer.wage)}</span>
          </div>
        </div>

        <div class="offer-card-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');

  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(container);
}


function renderMarket() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const squadCount = playerClub.players.length;
  const isFull = squadCount >= MAX_SQUAD_SIZE;

  // クラブ選択プルダウンのオプション生成（初回またはクラブ数変更時）
  const clubSelect = document.getElementById('market-filter-club');
  if (clubSelect && clubSelect.options.length <= 1) {
    clubSelect.innerHTML = `
      <option value="ALL">全クラブ</option>
      ${gameState.clubs.map(c => `
        <option value="${c.id}">${c.name}${c.isPlayer ? ' (自チーム)' : ''}</option>
      `).join('')}
    `;
    clubSelect.value = gameState.marketFilter.clubId;
  }

  // 全クラブの所属選手を集約
  const allEntries = [];
  for (const c of gameState.clubs) {
    for (const p of c.players) {
      allEntries.push({
        player: p,
        club: c,
        isMyClub: c.isPlayer
      });
    }
  }

  // フィルター適用
  const mf = gameState.marketFilter;
  let filtered = allEntries.filter(entry => {
    const p = entry.player;
    const c = entry.club;

    // クラブ絞り込み
    if (mf.clubId !== 'ALL' && c.id !== mf.clubId) {
      return false;
    }

    // ポジション絞り込み
    if (mf.position !== 'ALL') {
      const matchPrimary = p.pos === mf.position || p.primaryPosition === mf.position;
      const matchSecondary = Array.isArray(p.secondaryPositions) && p.secondaryPositions.includes(mf.position);
      if (!matchPrimary && !matchSecondary) return false;
    }

    // 検索ワード絞り込み
    if (mf.searchQuery && mf.searchQuery.trim().length > 0) {
      const query = mf.searchQuery.trim().toLowerCase();
      const matchName = p.name.toLowerCase().includes(query);
      const matchClub = c.name.toLowerCase().includes(query);
      if (!matchName && !matchClub) return false;
    }

    return true;
  });

  // 並び替え（ソート）
  filtered.sort((a, b) => {
    const pA = a.player;
    const pB = b.player;
    const ovrA = getPlayerOverallRating(pA);
    const ovrB = getPlayerOverallRating(pB);
    const feeA = calculateTransferFee(pA);
    const feeB = calculateTransferFee(pB);

    const sortKey = mf.sortKey || mf.sort || 'ovr-desc';
    switch (sortKey) {
      case 'ovr-desc':
        return ovrB - ovrA;
      case 'ovr-asc':
        return ovrA - ovrB;
      case 'fee-desc':
        return feeB - feeA;
      case 'fee-asc':
        return feeA - feeB;
      case 'wage-desc':
        return (pB.wage || 0) - (pA.wage || 0);
      case 'wage-asc':
        return (pA.wage || 0) - (pB.wage || 0);
      case 'age-asc':
        return pA.age - pB.age;
      case 'age-desc':
        return pB.age - pA.age;
      case 'contract-asc':
        return pA.contractYears - pB.contractYears || feeA - feeB;
      case 'contract-desc':
        return pB.contractYears - pA.contractYears || feeB - feeA;
      default:
        return ovrB - ovrA;
    }
  });

  // サマリーバーの更新
  const summaryEl = document.getElementById('market-pos-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <span class="power-badge">対象選手 <strong class="mono">${filtered.length}名</strong></span>
      <span class="power-badge">トップ登録枠 <strong class="mono">${squadCount} / ${MAX_SQUAD_SIZE}名</strong></span>
      <span class="power-badge">移籍予算 <strong class="mono accent-gold">${formatMoney(playerClub.funds)}</strong></span>
    `;
  }

  const tbody = document.getElementById('market-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-log-message" style="text-align: center; padding: 24px;">
          条件に合致する選手が見つかりませんでした。フィルターを変更してください。
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 100).map(entry => {
    const p = entry.player;
    const c = entry.club;
    const ovr = getPlayerOverallRating(p);
    const isPreContracted = Array.isArray(gameState.preContractPlayers) && gameState.preContractPlayers.some(x => x.id === p.id);
    const preContractBadge = isPreContracted ? '<span class="sub-badge badge-precontract">[内定済]</span>' : '';
    const freeBadge = p.isFreeAgent ? '<span class="sub-badge badge-free">[無所属]</span>' : '';
    const fee = p.isFreeAgent ? 0 : calculateTransferFee(p);
    const isBargain = p.contractYears === 1 && !p.isFreeAgent;
    const bargainBadge = isBargain ? '<span class="sub-badge badge-bargain">[契約最終年]</span>' : '';
    const myClubBadge = entry.isMyClub ? '<span class="sub-badge" style="background: rgba(46,204,113,0.2); color: #2ecc71; border: 1px solid #2ecc71;">自クラブ所属</span>' : '';
    const failedBadge = p.negotiationFailed ? '<span class="sub-badge badge-refused">交渉決裂</span>' : '';
    const footBadge = formatFootBadge(p);

    let actionBtnHtml = '';
    if (entry.isMyClub) {
      actionBtnHtml = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="switchTab('roster');" title="自クラブの編成一覧へ移動">
          所属管理
        </button>
      `;
    } else {
      const inShortlist = isInShortlist(p.id);
      actionBtnHtml = `
        <button type="button" class="btn btn-sm btn-shortlist-toggle ${inShortlist ? 'is-active' : 'btn-outline'}" data-shortlist-toggle="${p.id}" title="${inShortlist ? 'ターゲットリストから解除' : '獲得ターゲットリストに追加'}">
          ${inShortlist ? '✓ 登録済' : '＋ SHORTLIST'}
        </button>
      `;
    }

    return `
      <tr>
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="スカウティングレポートを表示">
            ${getPlayerAvatarHtml(p, c, 'avatar-sm table-avatar')}${p.name}
          </button>
          ${preContractBadge}${freeBadge}${bargainBadge}${myClubBadge}${failedBadge}
        </td>
        <td class="col-team" title="${c.name}"><span class="team-cell-wrap">${getClubEmblemSvg(c, 18, 'market-club-emblem')}<strong class="mono" style="font-weight:700;">${getClubShortCode(c)}</strong></span></td>
        <td class="col-num">${p.age}歳</td>
        <td class="col-num">${footBadge}</td>
        <td class="col-num accent-green"><strong>${ovr}</strong></td>
        <td class="col-num accent-gold mono"><strong>${formatMoney(fee)}</strong></td>
        <td class="col-num mono">${formatWage(p.wage)}</td>
        <td class="col-num ${isBargain ? 'contract-expiring' : ''}">${p.contractYears}年</td>
        <td class="col-action">
          ${actionBtnHtml}
        </td>
      </tr>
    `;
  }).join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * 常設ユースチーム（U-21 Squad）一覧の描画
 */
function renderYouthSquad() {
  const tbody = document.getElementById('youth-squad-tbody');
  const countEl = document.getElementById('youth-squad-count');
  const capEl = document.getElementById('youth-top-capacity');
  const playerClub = getPlayerClub();
  if (!tbody || !playerClub) return;

  const youthList = playerClub.youthSquad || [];
  const topCount = playerClub.players.length;
  const canPromote = topCount < MAX_SQUAD_SIZE && !gameState.isGameOver && !gameState.isSimulating;

  if (countEl) countEl.textContent = `${youthList.length} / ${MAX_YOUTH_SQUAD_SIZE}名`;
  if (capEl) capEl.textContent = `${topCount} / ${MAX_SQUAD_SIZE}名`;

  if (youthList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-log-message" style="text-align: center; padding: 20px;">
          現在ユースチーム選手はいません。シーズン終了時に新アカデミー生が入団します。
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = youthList.map(y => {
    const ovr = getPlayerOverallRating(y);
    const canPromoteBtn = canPromote ? `
      <button type="button" class="btn btn-primary btn-sm btn-promote-youth" data-promote-id="${y.id}" title="トップチームへプロ契約昇格">
        昇格
      </button>
    ` : `<button type="button" class="btn btn-secondary btn-sm" disabled>枠上限</button>`;

    return `
      <tr class="clickable-youth-row" data-profile-id="${y.id}" style="cursor: pointer;">
        <td class="col-pos"><span class="pos-tag pos-${y.pos}">${y.pos}</span></td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${y.id}" title="詳細プロフィールを表示">
            ${getPlayerAvatarHtml(y, playerClub, 'avatar-sm table-avatar')}${y.name}
          </button>
        </td>
        <td class="col-num col-youth-age">${y.age}歳</td>
        <td class="col-num col-youth-ovr accent-green"><strong>${ovr}</strong></td>
        <td class="col-num col-youth-atk">${y.atk}</td>
        <td class="col-num col-youth-def">${y.def}</td>
        <td class="col-num col-youth-wage mono">${formatWage(y.wage || 2)}</td>
        <td class="col-action">
          ${canPromoteBtn}
        </td>
      </tr>
    `;
  }).join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}
/**
 * GM業務タスク一覧（必須 CRITICAL / 推奨 RECOMMENDED / 任意 OPTIONAL）を描画する
 */
function renderGmDuties() {
  const listEl = document.getElementById('gm-tasks-list');
  const subtitleEl = document.getElementById('gm-tasks-subtitle');
  if (!listEl) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  if (subtitleEl) {
    subtitleEl.textContent = gameState.isSeasonOver
      ? `Season ${gameState.season} オフシーズン経営・編成タスク`
      : `Season ${gameState.season} / 第${Math.min(gameState.currentWeek + 1, gameState.totalWeeks)}節 優先業務`;
  }

  const duties = [];



  // 0. 海外メガクラブからの強奪オファーが届いている場合は最優先CRITICALタスクとして表示
  if (gameState.pendingMegaOffer) {
    const offer = gameState.pendingMegaOffer;
    const targetExists = playerClub.players.some(p => p.id === offer.playerId);
    if (targetExists) {
      duties.push({
        level: 'critical',
        badge: '緊急オファー / CRITICAL',
        title: `${offer.megaClubName}から #${offer.squadNumber} ${offer.playerName} に対し 移籍金${formatMoney(offer.offerAmount)} の正式オファーが届きました`,
        desc: `${offer.megaClubCountry}の名門「${offer.megaClubName}」が主力 ${offer.playerPos} #${offer.squadNumber} ${offer.playerName}（OVR ${offer.ovr}）の獲得を要請しています。受諾（+${formatMoney(offer.offerAmount)}）か拒否（戦力維持）か決断してください。`,
        btnText: 'オファー対応',
        action: 'open-mega-offer'
      });
    } else {
      gameState.pendingMegaOffer = null;
    }
  }

  // 1. 必須タスク（CRITICAL / 赤）
  let criticalDuty = null;
  if (playerClub.funds < 0) {
    criticalDuty = {
      level: 'critical',
      badge: '重要',
      title: '赤字解消・人件費削減',
      desc: `資金が ${formatMoney(playerClub.funds)} の赤字です。選手の自由契約等で総年俸を圧縮してください。`,
      btnText: '契約・編成へ',
      action: 'goto-roster-table'
    };
  } else if (gameState.isSeasonOver) {
    criticalDuty = {
      level: 'critical',
      badge: '重要',
      title: '新シーズン開幕手続き',
      desc: '補強や契約更新、ユース昇格を終えたら新シーズンを開幕してください。',
      btnText: '次シーズン開幕',
      action: 'start-next-season'
    };
  } else {
    const nextWeek = Math.min(gameState.currentWeek + 1, gameState.totalWeeks);
    let opponentText = '公式戦';
    const weekFixtures = gameState.schedule && gameState.schedule[gameState.currentWeek];
    if (weekFixtures) {
      const myFixture = weekFixtures.find(f => f.homeId === playerClub.id || f.awayId === playerClub.id);
      if (myFixture) {
        const oppId = myFixture.homeId === playerClub.id ? myFixture.awayId : myFixture.homeId;
        const oppClub = getClubById(oppId);
        const venue = myFixture.homeId === playerClub.id ? 'H' : 'A';
        if (oppClub) opponentText = `vs ${oppClub.name} (${venue})`;
      }
    }
    criticalDuty = {
      level: 'critical',
      badge: '重要',
      title: `第${nextWeek}節 ${opponentText}`,
      desc: 'スタメンと戦術陣形を確認し、キックオフへ進みます。',
      btnText: '作戦確認',
      action: 'goto-pitch'
    };
  }
  duties.push(criticalDuty);

  // 2. 推奨タスク（RECOMMENDED）：期限内のアクティブな受信オファーのみ対象
  const activeIncomingOffers = (gameState.incomingOffers || []).filter(o => 
    (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') && ((o.daysLeft ?? 1) > 0)
  );
  if (activeIncomingOffers.length > 0) {
    const firstOffer = activeIncomingOffers[0];
    duties.push({
      level: 'recommended',
      badge: '推奨',
      title: `移籍オファー (${activeIncomingOffers.length}件)`,
      desc: '他クラブからの獲得打診。条件を精査して受諾・交渉・拒否を選択。',
      btnText: 'オファー確認',
      action: 'goto-market-offers'
    });
  }
  const starters = playerClub.players.filter(p => p.isStarter);
  const injuredStarters = starters.filter(p => p.injuryWeeks > 0);
  const expiringPlayers = playerClub.players
    .filter(p => p.contractYears <= 2 && !p.contractRefused)
    .sort((a, b) => a.contractYears - b.contractYears || getPlayerOverallRating(b) - getPlayerOverallRating(a));
  const urgentExpiring = expiringPlayers.filter(p => p.contractYears <= 1 || p.megaOfferRejected);
  const outOfPosStarters = starters.filter(p => getPositionFitInfo(p, p.assignedPos || p.pos).type === 'out');

  let recommendedDuty = null;
  if (injuredStarters.length > 0) {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `負傷者交代（${injuredStarters.length}名）`,
      desc: `${injuredStarters[0].name} らが負傷離脱中。控え選手と交代してください。`,
      btnText: '作戦ボードへ',
      action: 'goto-pitch'
    };
  } else if (urgentExpiring.length > 0) {
    const topTarget = urgentExpiring[0];
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `契約更新（${urgentExpiring.length}名）`,
      desc: `#${topTarget.squadNumber || '-'} ${topTarget.name} らの契約満了が迫っています。`,
      btnText: '契約一覧へ',
      action: 'goto-roster-table'
    };
  } else if (outOfPosStarters.length > 0) {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `適性外配置の調整（${outOfPosStarters.length}枠）`,
      desc: `${outOfPosStarters[0].name} が不適性ポジションです。配置を調整してください。`,
      btnText: '作戦ボードへ',
      action: 'goto-pitch'
    };
  } else if (expiringPlayers.length > 0) {
    const topTarget = expiringPlayers[0];
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `早期契約更新（${expiringPlayers.length}名）`,
      desc: `#${topTarget.squadNumber || '-'} ${topTarget.name} らと契約延長が可能です。`,
      btnText: '契約一覧へ',
      action: 'goto-roster-table'
    };
  } else {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: '戦術・状態確認',
      desc: 'スタメン全員が適性枠かつ健康です。次戦に向けた微調整を行えます。',
      btnText: '作戦ボード確認',
      action: 'goto-pitch'
    };
  }
  duties.push(recommendedDuty);

  // 3. 任意タスク（OPTIONAL）
  const youthSquad = playerClub.youthSquad || [];
  const topCount = playerClub.players.length;
  const canPromote = topCount < MAX_SQUAD_SIZE;
  const f = gameState.facilities || { stadium: 1, training: 1, scouting: 1 };
  const minUpgradeCost = Math.min(
    f.stadium < 5 ? FACILITY_DEFINITIONS.stadium.costs[f.stadium] : Infinity,
    f.training < 5 ? FACILITY_DEFINITIONS.training.costs[f.training] : Infinity,
    f.scouting < 5 ? FACILITY_DEFINITIONS.scouting.costs[f.scouting] : Infinity
  );

  let optionalDuty = null;
  if (canPromote && youthSquad.length > 0) {
    optionalDuty = {
      level: 'optional',
      badge: '任意',
      title: `ユース昇格（${youthSquad.length}名在籍）`,
      desc: 'アカデミー有望株をトップチームへ昇格登録できます。',
      btnText: 'ユース一覧へ',
      action: 'goto-youth'
    };
  } else if (playerClub.funds >= minUpgradeCost && minUpgradeCost !== Infinity) {
    optionalDuty = {
      level: 'optional',
      badge: '任意',
      title: '施設投資の検討',
      desc: `クラブ資金を活用し、スタジアムや育成施設の改修が可能です。`,
      btnText: '施設投資へ',
      action: 'goto-facilities'
    };
  } else {
    const totalMarketPlayers = (gameState.clubs || []).reduce((sum, c) => sum + (c.players ? c.players.length : 0), 0);
    optionalDuty = {
      level: 'optional',
      badge: '任意',
      title: '移籍市場スカウト',
      desc: '移籍リストから即戦力や若手有望株をスカウトできます。',
      btnText: '移籍市場へ',
      action: 'goto-market'
    };
  }
  duties.push(optionalDuty);

  const countBadgeEl = document.getElementById('gm-tasks-count-badge');
  if (countBadgeEl) {
    countBadgeEl.textContent = `${duties.length}件`;
  }

  const isCollapsed = Boolean(gameState.gmTasksCollapsed);
  const toggleBtnText = document.getElementById('gm-tasks-toggle-text');
  const toggleBtnIcon = document.getElementById('gm-tasks-toggle-icon');
  const miniSummaryEl = document.getElementById('gm-tasks-mini-summary');

  if (toggleBtnText) toggleBtnText.textContent = isCollapsed ? '全タスク表示' : '折りたたむ';
  if (toggleBtnIcon) toggleBtnIcon.textContent = isCollapsed ? '▼' : '▲';

  // 折りたたみ時の1行サマリー表示
  if (miniSummaryEl) {
    if (isCollapsed) {
      const topDuty = duties[0];
      miniSummaryEl.classList.remove('hidden');
      miniSummaryEl.innerHTML = `
        <div class="mini-summary-content">
          <span class="duty-priority-badge badge-${topDuty.level}">${topDuty.badge}</span>
          <span class="mini-summary-title"><strong>${topDuty.title}</strong></span>
        </div>
        <button type="button" class="btn btn-sm btn-duty-action ${topDuty.level === 'critical' ? 'btn-primary' : 'btn-secondary'}" data-duty-action="${topDuty.action}" ${gameState.isGameOver || gameState.isSimulating ? 'disabled' : ''}>
          ${topDuty.btnText}
        </button>
      `;
    } else {
      miniSummaryEl.classList.add('hidden');
    }
  }

  if (isCollapsed) {
    listEl.classList.add('hidden');
  } else {
    listEl.classList.remove('hidden');
    listEl.innerHTML = duties.map(d => `
      <div class="gm-task-card duty-${d.level}">
        <div class="gm-task-main">
          <div class="gm-task-header-row">
            <span class="duty-priority-badge badge-${d.level}">${d.badge}</span>
            <strong class="gm-task-title">${d.title}</strong>
          </div>
          <p class="gm-task-desc">${d.desc}</p>
        </div>
        <div class="gm-task-action-wrap">
          <button type="button" class="btn btn-sm btn-duty-action ${d.level === 'critical' ? 'btn-primary' : 'btn-secondary'}" data-duty-action="${d.action}" ${gameState.isGameOver || gameState.isSimulating ? 'disabled' : ''}>
            ${d.btnText}
          </button>
        </div>
      </div>
    `).join('');
  }
}

/**
 * クラブ経営・施設投資（スタジアム / 練習施設 / スカウト網）およびユースアカデミー画面を描画する
 */
function renderFacilitiesAndYouth() {
  renderManagerManagementPanel();
  renderCoachingStaffPanel();
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const f = gameState.facilities || { stadium: 1, training: 1, scouting: 1 };
  const fundsEl = document.getElementById('facilities-current-funds');
  if (fundsEl) fundsEl.textContent = formatMoney(playerClub.funds);

  const stadiumBonusEl = document.getElementById('facilities-stadium-bonus');
  if (stadiumBonusEl) {
    const bonusPct = ((f.stadium || 1) - 1) * 15;
    stadiumBonusEl.textContent = `+${bonusPct}% (Lv.${f.stadium || 1})`;
  }

  const feedbackBanner = document.getElementById('facility-feedback-banner');
  if (feedbackBanner) {
    if (gameState.facilityFeedback) {
      feedbackBanner.textContent = gameState.facilityFeedback;
      feedbackBanner.classList.remove('hidden');
    } else {
      feedbackBanner.classList.add('hidden');
    }
  }

  const facilitiesGrid = document.getElementById('facilities-grid');
  if (facilitiesGrid) {
    const keys = ['stadium', 'training', 'scouting'];
    facilitiesGrid.innerHTML = keys.map(key => {
      const def = FACILITY_DEFINITIONS[key];
      const lv = f[key] || 1;
      const isMax = lv >= def.maxLevel;
      const nextCost = isMax ? 0 : def.costs[lv];
      const canAfford = !isMax && playerClub.funds >= nextCost && !gameState.isGameOver && !gameState.isSimulating;

      let pipsHtml = '';
      for (let i = 1; i <= def.maxLevel; i++) {
        pipsHtml += `<span class="facility-pip ${i <= lv ? 'active' : ''}"></span>`;
      }

      let btnLabel = isMax ? 'MAX達成' : `Lv.${lv + 1} 改修（${formatMoney(nextCost)}）`;
      if (!isMax && playerClub.funds < nextCost) {
        btnLabel = `資金不足（${formatMoney(nextCost)}）`;
      }

      const curEffect = typeof def.getEffectText === 'function' ? def.getEffectText(lv) : '';
      const nextEffect = typeof def.getNextEffectText === 'function' ? def.getNextEffectText(lv) : (isMax ? '最大レベル' : '効果増大');

      return `
        <div class="facility-card">
          <div class="facility-card-header">
            <div class="facility-header-left">
              <h3 class="facility-name">${def.name}</h3>
              <button type="button" class="btn-facility-info" data-facility-info="${key}" title="詳細を表示" aria-label="詳細解説">ⓘ</button>
            </div>
            <span class="facility-level-badge">Lv.${lv}/${def.maxLevel}</span>
          </div>

          <div class="facility-pips-row">
            ${pipsHtml}
          </div>

          <!-- デフォルト表示：最小限の効果・数値・費用 -->
          <div class="facility-metric-row">
            <div class="facility-metric-item">
              <span class="metric-caption">現在の効果</span>
              <strong class="facility-effect-badge accent-green">${curEffect}</strong>
            </div>
            <div class="facility-metric-item">
              <span class="metric-caption">改修費</span>
              <strong class="facility-cost-badge mono accent-gold">${isMax ? 'MAX' : formatMoney(nextCost)}</strong>
            </div>
          </div>

          <div class="facility-card-footer">
            <button type="button" class="btn btn-primary btn-sm btn-upgrade-facility" data-upgrade-facility="${key}" ${canAfford ? '' : 'disabled'}>
              ${btnLabel}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ユースアカデミー（若手昇格候補2名）描画
  const candidates = gameState.youthCandidates || [];
  const countEl = document.getElementById('youth-candidates-count');
  if (countEl) countEl.textContent = `${candidates.length}名`;

  const capEl = document.getElementById('youth-squad-capacity');
  if (capEl) capEl.textContent = `${playerClub.players.length} / ${MAX_SQUAD_SIZE}名`;

  const youthGrid = document.getElementById('youth-candidates-grid');
  if (youthGrid) {
    if (candidates.length === 0) {
      youthGrid.innerHTML = `
        <div class="youth-empty-box">
          今季のユースアカデミー昇格候補に対する審査（昇格または見送り）はすべて完了しています。<br />
          次のオフシーズン突入時に、アカデミーから新たな16〜18歳の有望株2名が選出されます。
        </div>
      `;
      return;
    }

    const isSquadFull = playerClub.players.length >= MAX_SQUAD_SIZE;

    youthGrid.innerHTML = candidates.map(y => {
      const ovr = getPlayerOverallRating(y);
      const growthLabel = getGrowthCurveLabel(y.growthCurve);
      const rawNat = y.nationality || 'England';
      const flagEmoji = NATIONALITY_FLAG_MAP[rawNat] || '🌍';
      const traits = Array.isArray(y.traits) ? y.traits : [];

      return `
        <div class="youth-card">
          <div class="youth-card-top">
            <div class="youth-name-wrap">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                ${getPlayerAvatarHtml(y, playerClub, 'avatar-md')}
                ${formatPlayerPositionsHtml(y)}
                <button type="button" class="player-name-link clickable-player-name" data-profile-id="${y.id}" title="クリックで選手詳細プロフィールを表示">
                  ${y.name}
                </button>
              </div>
              <div class="youth-meta-row">
                <span>${flagEmoji} ${rawNat}</span>
                <span>|</span>
                <span><strong>${y.age}歳</strong>（ユース有望株）</span>
                <span>|</span>
                <span>身長 ${y.height}cm / ${y.preferredFoot}</span>
              </div>
            </div>
            <div class="youth-ovr-box">
              <span class="youth-ovr-label">CURRENT OVR</span>
              <span class="youth-ovr-val">${ovr}</span>
            </div>
          </div>

          <div class="youth-stats-strip">
            <div class="youth-stat-cell">
              <span class="youth-stat-cell-label">ATK（攻撃）</span>
              <span class="youth-stat-cell-val">${y.atk}</span>
            </div>
            <div class="youth-stat-cell">
              <span class="youth-stat-cell-label">DEF（守備）</span>
              <span class="youth-stat-cell-val">${y.def}</span>
            </div>
            <div class="youth-stat-cell">
              <span class="youth-stat-cell-label">STA（体力）</span>
              <span class="youth-stat-cell-val">${y.sta}</span>
            </div>
          </div>

          <div class="profile-traits-wrap">
            ${traits.map(t => `<span class="profile-trait-tag">${t}</span>`).join('')}
          </div>

          <div class="youth-contract-note">
            <span>昇格条件：<strong>移籍金 £0 / 年俸 £800K（4年契約）</strong></span>
            <span>見送り時：<strong>育成補償金 +£300K</strong></span>
          </div>

          <div class="youth-actions-row">
            <button type="button" class="btn btn-primary btn-sm" data-promote-youth="${y.id}" ${!isSquadFull && !gameState.isGameOver && !gameState.isSimulating ? '' : 'disabled'}>
              ${isSquadFull ? '所属枠上限 (20名)' : 'トップチーム昇格（£0 / 年俸£800K）'}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" data-dismiss-youth="${y.id}" ${!gameState.isGameOver && !gameState.isSimulating ? '' : 'disabled'}>
              見送り（他クラブへ放出）
            </button>
          </div>
        </div>
      `;
    }).join('');
    if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(youthGrid);
  }
}

/**
 * 全クラブ・移籍市場・ユース候補から指定IDの選手と所属情報を検索する
 */
function findPlayerWithContextById(playerId) {
  for (const club of gameState.clubs) {
    const found = club.players.find(p => p.id === playerId);
    if (found) {
      return { player: found, clubName: club.name, isMarket: false, isPlayerClub: club.isPlayer, isYouth: false };
    }
    if (club.youthSquad) {
      const youthFound = club.youthSquad.find(p => p.id === playerId);
      if (youthFound) {
        return {
          player: youthFound,
          clubName: `${club.name} U-21ユース`,
          isMarket: false,
          isPlayerClub: club.isPlayer,
          isYouth: true
        };
      }
    }
  }
  const marketFound = gameState.transferMarket.find(p => p.id === playerId);
  if (marketFound) {
    return { player: marketFound, clubName: '移籍市場リスト（フリー/獲得可能）', isMarket: true, isPlayerClub: false };
  }
  const youthFound = (gameState.youthCandidates || []).find(p => p.id === playerId);
  if (youthFound) {
    const playerClub = getPlayerClub();
    return {
      player: youthFound,
      clubName: `${playerClub ? playerClub.name : 'クラブ'} ユースアカデミー（昇格候補）`,
      isMarket: false,
      isPlayerClub: true
    };
  }
  return null;
}

/**
 * 選手カード用の六角形レーダーチャートSVGを生成する
 * 頂点順（時計回り・上から）：決定力、ドリブル、パス、守備、スピード、スタミナ
 */
function buildPlayerHexagonChartSvg(attrs) {
  const axes = [
    { key: 'finishing', label: '決定力', val: attrs.finishing || 50, angleDeg: -90 },
    { key: 'dribbling', label: 'ドリブル', val: attrs.dribbling || 50, angleDeg: -30 },
    { key: 'passing',   label: 'パス',     val: attrs.passing   || 50, angleDeg: 30 },
    { key: 'defending', label: '守備',     val: attrs.defending || 50, angleDeg: 90 },
    { key: 'pace',      label: 'スピード', val: attrs.pace      || 50, angleDeg: 150 },
    { key: 'stamina',   label: 'スタミナ', val: attrs.stamina   || 50, angleDeg: -150 }
  ];

  const cx = 160;
  const cy = 116;
  const maxR = 64;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getPoint = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: +(cx + r * Math.cos(rad)).toFixed(1),
      y: +(cy + r * Math.sin(rad)).toFixed(1)
    };
  };

  // 同心正六角形グリッド
  const gridPolygons = levels.map(lv => {
    const pts = axes.map(a => {
      const pt = getPoint(a.angleDeg, maxR * lv);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    const isOuter = lv === 1.0;
    return `<polygon points="${pts}" class="${isOuter ? 'hex-grid-outer' : 'hex-grid-inner'}" />`;
  }).join('');

  // 中心から各頂点への軸線
  const axisLines = axes.map(a => {
    const pt = getPoint(a.angleDeg, maxR);
    return `<line x1="${cx}" y1="${cy}" x2="${pt.x}" y2="${pt.y}" class="hex-axis-line" />`;
  }).join('');

  // 選手の能力値ポリゴンと頂点ドット
  const valPoints = axes.map(a => {
    const ratio = clamp(a.val / 100, 0.12, 1.0);
    return { ...a, pt: getPoint(a.angleDeg, maxR * ratio) };
  });

  const dataPolyPts = valPoints.map(v => `${v.pt.x},${v.pt.y}`).join(' ');
  const dataDots = valPoints.map(v => {
    const tier = getStatTierClass(v.val);
    return `<circle cx="${v.pt.x}" cy="${v.pt.y}" r="3.5" class="hex-data-dot ${tier.valClass}" />`;
  }).join('');

  // ラベルと数値の配置
  const labelsSvg = axes.map(a => {
    const tier = getStatTierClass(a.val);
    let lx = cx;
    let lyLabel = cy;
    let lyVal = cy;
    let anchor = 'middle';

    if (a.angleDeg === -90) {
      // 上：決定力
      lx = cx;
      lyLabel = cy - maxR - 23;
      lyVal = cy - maxR - 8;
      anchor = 'middle';
    } else if (a.angleDeg === 90) {
      // 下：守備
      lx = cx;
      lyLabel = cy + maxR + 15;
      lyVal = cy + maxR + 31;
      anchor = 'middle';
    } else if (a.angleDeg === -30) {
      // 右上：ドリブル
      const outer = getPoint(a.angleDeg, maxR);
      lx = outer.x + 10;
      lyLabel = outer.y - 5;
      lyVal = outer.y + 11;
      anchor = 'start';
    } else if (a.angleDeg === 30) {
      // 右下：パス
      const outer = getPoint(a.angleDeg, maxR);
      lx = outer.x + 10;
      lyLabel = outer.y - 3;
      lyVal = outer.y + 13;
      anchor = 'start';
    } else if (a.angleDeg === 150) {
      // 左下：スピード
      const outer = getPoint(a.angleDeg, maxR);
      lx = outer.x - 10;
      lyLabel = outer.y - 3;
      lyVal = outer.y + 13;
      anchor = 'end';
    } else if (a.angleDeg === -150) {
      // 左上：スタミナ
      const outer = getPoint(a.angleDeg, maxR);
      lx = outer.x - 10;
      lyLabel = outer.y - 5;
      lyVal = outer.y + 11;
      anchor = 'end';
    }

    return `
      <g class="hex-label-group">
        <text x="${lx}" y="${lyLabel}" text-anchor="${anchor}" class="hex-label-name">${a.label}</text>
        <text x="${lx}" y="${lyVal}" text-anchor="${anchor}" class="hex-label-val ${tier.valClass}">${a.val}</text>
      </g>
    `;
  }).join('');

  return `
    <div class="profile-hexagon-wrap">
      <svg viewBox="0 0 320 232" class="profile-hexagon-svg" role="img" aria-label="選手能力六角形チャート">
        ${gridPolygons}
        ${axisLines}
        <polygon points="${dataPolyPts}" class="hex-data-polygon" />
        ${dataDots}
        ${labelsSvg}
      </svg>
    </div>
  `;
}

/**
 * 選手プロフィールモーダル内のタブ切り替え（能力 / 今季成績 / 年別成績 / 市場価値推移 / 経歴）
 */
function switchProfileModalTab(tabKey) {
  const validTabs = ['ability', 'season', 'yearly', 'market-value', 'career'];
  const activeKey = validTabs.includes(tabKey) ? tabKey : 'ability';
  gameState.profileActiveTab = activeKey;

  const subnavEl = document.getElementById('profile-subnav-bar');
  if (subnavEl) {
    subnavEl.querySelectorAll('.profile-tab-btn').forEach(btn => {
      const isMatch = btn.dataset.profileTab === activeKey;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  const bodyEl = document.getElementById('profile-modal-body');
  if (bodyEl) {
    bodyEl.querySelectorAll('.profile-tab-panel').forEach(panel => {
      const isMatch = panel.dataset.profilePanel === activeKey;
      panel.classList.toggle('hidden', !isMatch);
    });
    bodyEl.scrollTop = 0;
  }

  const cardEl = document.getElementById('player-profile-modal-card');
  if (cardEl) cardEl.scrollTop = 0;
}

/**
 * 選手の年別成績（seasonHistory）および経歴タイムライン（careerEvents）を一貫生成・補完する
 */
function ensurePlayerHistoryAndCareer(p, currentClubName) {
  if (!p) return { seasonHistory: [], careerEvents: [], birthYear: 2002 };

  // 選手IDおよび名前から決定論的ハッシュ値を算出
  const seedStr = `${p.id || 'p'}_${p.name || 'player'}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const absHash = Math.abs(hash);

  const curSeasonNum = gameState.season || 1;
  const curBaseYear = 2025 + curSeasonNum; // Season 1 => 2026-27
  const birthYear = curBaseYear - (p.age || 22);
  const baseOvr = getPlayerOverallRating(p);
  const primaryPos = p.primaryPosition || p.preferredPosition || p.pos || 'CM';

  // 過去シーズン数の算出（18歳プロデビュー〜前シーズンまで）
  const pastSeasonsCount = Math.max(0, (p.age || 18) - 18);

  if (!Array.isArray(p.seasonHistory)) {
    const history = [];
    const careerApps = p.careerStats ? Math.max(p.appearances || 0, p.careerStats.appearances || 0) : (p.appearances || 0);
    const careerGoals = p.careerStats ? Math.max(p.goals || 0, p.careerStats.goals || 0) : (p.goals || 0);

    // キャリア通算アシスト数の取得・決定論的補完（未設定の場合はポジションと出場数から決定）
    if (!p.careerStats) p.careerStats = { appearances: careerApps, goals: careerGoals, assists: 0 };
    if (typeof p.careerStats.assists !== 'number') {
      let aRate = 0.02;
      if (primaryPos === 'GK') aRate = 0;
      else if (primaryPos === 'CB') aRate = 0.02;
      else if (primaryPos === 'LB' || primaryPos === 'RB' || primaryPos === 'SB') aRate = 0.08;
      else if (primaryPos === 'DM') aRate = 0.06;
      else if (primaryPos === 'CM') aRate = 0.12;
      else if (primaryPos === 'LM' || primaryPos === 'RM' || primaryPos === 'SM') aRate = 0.16;
      else if (primaryPos === 'AM') aRate = 0.20;
      else if (primaryPos === 'LW' || primaryPos === 'RW' || primaryPos === 'WG') aRate = 0.18;
      else if (primaryPos === 'CF') aRate = 0.10;
      const jitterA = 0.8 + ((absHash % 17) / 40);
      p.careerStats.assists = primaryPos === 'GK' ? 0 : Math.max(0, Math.round(careerApps * aRate * jitterA));
    }
    const careerAssists = Math.max(p.assists || 0, p.careerStats.assists || 0);
    const totalPastApps = Math.max(0, careerApps - (p.appearances || 0));
    const totalPastGoals = Math.max(0, careerGoals - (p.goals || 0));
    const totalPastAssists = Math.max(0, careerAssists - (p.assists || 0));

    // 過去所属クラブの決定（23歳以上かつ一定確率で前所属クラブを経由）
    const foreignClubsByNat = {
      England: ['ウェスト・ロンドンFC', 'サウス・ユナイテッド', 'ミッドランド・シティ'],
      Spain: ['マドリード・アスレティック', 'バレンシア・ソシエダ', 'セビージャ・レアル'],
      Germany: ['ミュンヘン・シュポルト', 'ライン・ドルトムント', 'フランクフルトSV'],
      France: ['パリ・メトロポリタン', 'リヨン・オリンピック', 'マルセイユ・コート'],
      Italy: ['ミラノ・カルチョ', 'トリノ・ユヴェントス', 'ローマ・クラブ'],
      Brazil: ['サンパウロFC', 'フラメンゴ・リオ', 'サントス・クルーベ'],
      Argentina: ['ブエノスアイレスCA', 'リバー・プレートSC', 'ボカ・アトレティコ'],
      Netherlands: ['アムステルダム・アヤックス', 'アイントホーフェンPSV', 'ロッテルダムSC'],
      Portugal: ['リスボン・スポルティング', 'ポルト・ドラゴンズ', 'ベンフィカSL'],
      Japan: ['東京メトロポリタンFC', '横浜マリナーズSC', '川崎フロンティア']
    };
    const natPool = foreignClubsByNat[p.nationality] || ['コンチネンタルFC', 'メトロポリタンSC', 'ユナイテッド・アカデミー'];
    const formerClubName = natPool[absHash % natPool.length];
    const hasTransferred = pastSeasonsCount >= 3 && (absHash % 3 !== 0);
    const transferSeasonIdx = hasTransferred ? Math.max(1, Math.floor(pastSeasonsCount * 0.55)) : pastSeasonsCount + 1;

    if (pastSeasonsCount > 0) {
      // 各年度の重みを計算して出場数・ゴール数・アシスト数を整数配分
      const appWeights = [];
      const goalWeights = [];
      const assistWeights = [];
      let sumAppW = 0;
      let sumGoalW = 0;
      let sumAssistW = 0;

      for (let i = 0; i < pastSeasonsCount; i++) {
        const ageAtSeason = 18 + i;
        const maturity = ageAtSeason <= 19 ? 0.55 : (ageAtSeason <= 21 ? 0.82 : 1.0);
        const jitter = 0.85 + (((absHash >> (i % 8)) & 7) / 25);
        const aw = maturity * jitter;
        const gw = maturity * (0.8 + (((absHash >> ((i + 3) % 8)) & 7) / 20));
        const astw = maturity * (0.8 + (((absHash >> ((i + 5) % 8)) & 7) / 20));
        appWeights.push(aw);
        goalWeights.push(gw);
        assistWeights.push(astw);
        sumAppW += aw;
        sumGoalW += gw;
        sumAssistW += astw;
      }

      let remApps = totalPastApps;
      let remGoals = totalPastGoals;
      let remAssists = totalPastAssists;

      for (let i = 0; i < pastSeasonsCount; i++) {
        const seasonStartYr = curBaseYear - (pastSeasonsCount - i);
        const seasonYearStr = `${seasonStartYr}-${String((seasonStartYr + 1) % 100).padStart(2, '0')}`;
        const ageAtSeason = 18 + i;
        const isLast = (i === pastSeasonsCount - 1);

        let apps = isLast ? remApps : Math.round((totalPastApps * appWeights[i]) / Math.max(0.01, sumAppW));
        apps = clamp(apps, 0, Math.min(38, remApps));
        remApps = Math.max(0, remApps - apps);

        let goals = isLast ? remGoals : Math.round((totalPastGoals * goalWeights[i]) / Math.max(0.01, sumGoalW));
        goals = clamp(goals, 0, remGoals);
        if (apps === 0) goals = 0;
        remGoals = Math.max(0, remGoals - goals);

        let assists = isLast ? remAssists : Math.round((totalPastAssists * assistWeights[i]) / Math.max(0.01, sumAssistW));
        assists = clamp(assists, 0, remAssists);
        if (apps === 0) assists = 0;
        remAssists = Math.max(0, remAssists - assists);

        const yearsAgo = pastSeasonsCount - i;
        const estOvr = clamp(baseOvr - Math.min(8, Math.round(yearsAgo * 1.1)), 52, 95);
        const baseR = 6.35 + ((estOvr - 65) * 0.025) + (goals / Math.max(10, apps || 1)) * 0.65 + (assists / Math.max(10, apps || 1)) * 0.35;
        const avgR = apps > 0 ? clamp(baseR, 6.10, 8.45).toFixed(2) : '-';
        const clubAtSeason = (hasTransferred && i < transferSeasonIdx) ? formerClubName : (currentClubName || '現所属クラブ');

        history.push({
          seasonYear: seasonYearStr,
          clubName: clubAtSeason,
          age: ageAtSeason,
          appearances: apps,
          goals: goals,
          assists: assists,
          avgRating: avgR,
          ovr: estOvr
        });
      }

      // 端数が残った場合は最終過去シーズンに加算してキャリア通算と完全一致させる
      if (remApps > 0 && history.length > 0) {
        history[history.length - 1].appearances += remApps;
      }
      if (remGoals > 0 && history.length > 0) {
        history[history.length - 1].goals += remGoals;
      }
      if (remAssists > 0 && history.length > 0) {
        history[history.length - 1].assists += remAssists;
      }
    }

    p.seasonHistory = history;
    p._formerClubName = hasTransferred ? formerClubName : null;
    p._transferYear = hasTransferred ? (curBaseYear - (pastSeasonsCount - transferSeasonIdx)) : null;
  }

  // 経歴タイムラインイベントの生成
  const youthYear = birthYear + 15;
  const debutYear = birthYear + 18;
  const originClub = p._formerClubName || currentClubName || 'クラブ';
  const careerEvents = [
    {
      year: `${youthYear}年`,
      badge: 'YOUTH',
      title: `${originClub} ユースアカデミー入団`,
      desc: `15歳で${originClub}の下部組織に入団。${primaryPos}を主戦場に頭角を現す。`
    }
  ];

  if ((p.age || 18) >= 18) {
    careerEvents.push({
      year: `${debutYear}年`,
      badge: 'DEBUT',
      title: `${originClub} トップチーム昇格・プロデビュー`,
      desc: `18歳でプロ契約を締結し公式戦デビュー。持ち前の${(Array.isArray(p.traits) && p.traits[0]) || 'プレイスタイル'}で評価を高める。`
    });
  }

  if (p._formerClubName && p._transferYear) {
    careerEvents.push({
      year: `${p._transferYear}年`,
      badge: 'TRANSFER',
      title: `${currentClubName} へ完全移籍`,
      desc: `${p._formerClubName}での活躍が認められ、戦力補強の目玉として${currentClubName}へ加入。`
    });
  } else if ((p.age || 18) >= 21) {
    careerEvents.push({
      year: `${debutYear + 2}年`,
      badge: 'SQUAD',
      title: `${currentClubName} 主力メンバー定着`,
      desc: `コンスタントな出場機会を確保し、背番号${p.squadNumber || 10}を背負う中核選手へと成長。`
    });
  }

  // 現在のステータス
  const curSeasonStr = `${curBaseYear}-${String((curBaseYear + 1) % 100).padStart(2, '0')}`;
  const curAssists = typeof p.assists === 'number' ? p.assists : 0;
  careerEvents.push({
    year: `${curSeasonStr} (現在)`,
    badge: 'CURRENT',
    title: `${currentClubName} 在籍（契約残り${p.contractYears}年 / OVR ${baseOvr}）`,
    desc: `今季ここまで ${p.appearances || 0}試合出場・${p.goals || 0}得点・${curAssists}アシスト。${p.isStarter ? `スタメン（${p.assignedPos || primaryPos}）として稼働中。` : 'スカッドの一員としてシーズンを戦う。'}`
  });

  return {
    seasonHistory: p.seasonHistory,
    careerEvents,
    birthYear,
    curSeasonStr
  };
}

/**
 * 選手の市場価値推移履歴（valueHistory）を初期化・補完する
 * 過去シーズンのOVR・年齢・成長実績から算出した市場価値推移を保持
 */
function ensurePlayerValueHistory(p, currentClubName) {
  if (!p) return [];
  if (Array.isArray(p.valueHistory) && p.valueHistory.length >= 2) {
    return p.valueHistory;
  }

  const historyData = ensurePlayerHistoryAndCareer(p, currentClubName);
  const { seasonHistory } = historyData;
  const currentVal = calculatePlayerMarketValue(p);
  const currentOvr = getPlayerOverallRating(p);
  const currentAge = p.age || 24;

  const vHistory = [];
  // 過去シーズンの履歴から市場価値ポイントを抽出（最大直近5シーズン分）
  if (seasonHistory && seasonHistory.length > 0) {
    const pastSubset = seasonHistory.slice(-5);
    pastSubset.forEach((sh) => {
      const approxVal = calculatePlayerMarketValue({
        ovr: sh.ovr,
        age: sh.age,
        contractYears: 2
      });
      vHistory.push({
        label: `${sh.seasonYear.slice(2, 7)}`,
        fullLabel: `${sh.seasonYear} (${sh.age}歳)`,
        season: sh.seasonYear,
        age: sh.age,
        ovr: sh.ovr,
        value: approxVal
      });
    });
  }

  // もし過去データが空または1件のみ（若手ルーキー等）の場合は、過去の推移を補完
  if (vHistory.length === 0) {
    const pastOvr = Math.max(50, currentOvr - 4);
    const pastVal = calculatePlayerMarketValue({ ovr: pastOvr, age: Math.max(16, currentAge - 1), contractYears: 3 });
    vHistory.push({
      label: `入団時`,
      fullLabel: `入団時 (${Math.max(16, currentAge - 1)}歳)`,
      season: 'Debut',
      age: Math.max(16, currentAge - 1),
      ovr: pastOvr,
      value: pastVal
    });
  }

  // 最新（現在）ポイント
  vHistory.push({
    label: `現在`,
    fullLabel: `現在 (${currentAge}歳 / OVR ${currentOvr})`,
    season: 'Current',
    age: currentAge,
    ovr: currentOvr,
    value: currentVal
  });

  p.valueHistory = vHistory;
  return vHistory;
}

/**
 * 選手の市場価値推移をインラインSVG折れ線グラフ（Area Chart）として描画
 */
function buildPlayerMarketValueChartSvg(p, currentClubName) {
  const history = ensurePlayerValueHistory(p, currentClubName);
  if (!history || history.length === 0) {
    return `<div class="empty-chart-msg">市場価値データがありません</div>`;
  }

  const values = history.map(h => h.value);
  const peakVal = Math.max(...values);
  const currentVal = values[values.length - 1];

  // グラフキャンバスのサイズ設計
  const W = 520;
  const H = 200;
  const padL = 62;
  const padR = 32;
  const padT = 32;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Y軸のスケール（最小値0〜最大値+20%でキリの良い数値に丸め）
  const yMin = 0;
  const rawMax = Math.max(peakVal * 1.25, 2000);
  const yMax = rawMax > 50000 ? Math.ceil(rawMax / 10000) * 10000 : Math.ceil(rawMax / 5000) * 5000;

  const getX = (idx) => {
    if (history.length === 1) return padL + plotW / 2;
    return padL + (idx / (history.length - 1)) * plotW;
  };
  const getY = (val) => {
    const ratio = (val - yMin) / (yMax - yMin);
    return padT + plotH - ratio * plotH;
  };

  // グリッド線（3本）
  const gridSteps = [0.33, 0.66, 1.0];
  let gridLinesSvg = '';
  gridSteps.forEach(step => {
    const valAtStep = yMin + (yMax - yMin) * step;
    const yPos = getY(valAtStep);
    const label = formatMoney(valAtStep);
    gridLinesSvg += `
      <line x1="${padL}" y1="${yPos.toFixed(1)}" x2="${W - padR}" y2="${yPos.toFixed(1)}" stroke="#242a30" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${padL - 8}" y="${(yPos + 3.5).toFixed(1)}" fill="#6c757d" font-size="9" font-family="var(--font-mono)" text-anchor="end">${label}</text>
    `;
  });
  // ベースライン（y = 0）
  const baseLineY = getY(0);
  gridLinesSvg += `<line x1="${padL}" y1="${baseLineY.toFixed(1)}" x2="${W - padR}" y2="${baseLineY.toFixed(1)}" stroke="#343a40" stroke-width="1.5" />`;

  // 各データポイントの座標算出
  const points = history.map((h, i) => ({
    x: getX(i),
    y: getY(h.value),
    h
  }));

  // 折れ線用 points 文字列
  const polylinePoints = points.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  // エリア（塗りつぶし）用 path 文字列
  const areaPathD = `
    M ${points[0].x.toFixed(1)} ${baseLineY.toFixed(1)}
    L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}
    ${points.slice(1).map(pt => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')}
    L ${points[points.length - 1].x.toFixed(1)} ${baseLineY.toFixed(1)}
    Z
  `;

  // X軸ラベルと各データポイント（サークル・値ラベル）
  let pointsSvg = '';
  let xLabelsSvg = '';
  const gradId = `mvGrad_${p.id || Math.random().toString(36).slice(2, 7)}`;

  points.forEach((pt, i) => {
    const isPeak = (pt.h.value === peakVal && peakVal > 0);
    const isLast = (i === points.length - 1);
    const formattedVal = formatMoney(pt.h.value);

    // X軸ラベル
    xLabelsSvg += `
      <text x="${pt.x.toFixed(1)}" y="${(baseLineY + 16).toFixed(1)}" fill="${isLast ? 'var(--text-main)' : '#8b949e'}" font-size="9.5" font-family="var(--font-mono)" font-weight="${isLast ? '700' : '400'}" text-anchor="middle">
        ${pt.h.label}
      </text>
    `;

    // サークルとハイライト
    if (isPeak) {
      pointsSvg += `
        <!-- PEAKハイライト -->
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="8" fill="rgba(241, 196, 15, 0.25)" />
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4.5" fill="#f1c40f" stroke="#14171b" stroke-width="2" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 12).toFixed(1)}" fill="#f1c40f" font-size="9.5" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">👑 PEAK ${formattedVal}</text>
      `;
    } else if (isLast) {
      pointsSvg += `
        <!-- 現在値ハイライト -->
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="7" fill="rgba(46, 204, 113, 0.25)" />
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="4" fill="#2ecc71" stroke="#14171b" stroke-width="2" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 10).toFixed(1)}" fill="#2ecc71" font-size="9.5" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">${formattedVal}</text>
      `;
    } else {
      pointsSvg += `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3" fill="#14171b" stroke="#38bdf8" stroke-width="2" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 7).toFixed(1)}" fill="#94a3b8" font-size="8.5" font-family="var(--font-mono)" text-anchor="middle">${formattedVal}</text>
      `;
    }
  });

  return `
    <div class="market-value-chart-wrapper">
      <svg class="market-value-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2ecc71" stop-opacity="0.35" />
            <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.10" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridLinesSvg}
        <path d="${areaPathD}" fill="url(#${gradId})" />
        <polyline points="${polylinePoints}" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${pointsSvg}
        ${xLabelsSvg}
      </svg>
    </div>
  `;
}

/**
 * 選手プロフィールモーダル用：市場価値推移タブのHTML構築
 */
function buildPlayerMarketValueTabHtml(p, currentClubName) {
  const history = ensurePlayerValueHistory(p, currentClubName);
  const currentVal = calculatePlayerMarketValue(p);
  const peakVal = Math.max(...history.map(h => h.value), currentVal);
  const firstVal = history[0] ? history[0].value : currentVal;
  const delta = currentVal - firstVal;
  const deltaPercent = firstVal > 0 ? Math.round((delta / firstVal) * 100) : 0;
  const isUp = delta >= 0;

  // 選手の市場ステータス
  const age = p.age || 24;
  const ovr = getPlayerOverallRating(p);
  let statusText = '安定稼働中 (STABLE)';
  let statusBadgeClass = 'badge-stable';
  if (age <= 21 && ovr >= 74) {
    statusText = '🔥 若手有望株 (HOT PROSPECT)';
    statusBadgeClass = 'badge-hot';
  } else if (age <= 23 && delta > 0) {
    statusText = '📈 急成長中 (ON THE RISE)';
    statusBadgeClass = 'badge-rising';
  } else if (age >= 25 && age <= 29 && ovr >= 80) {
    statusText = '⭐ 全盛期・看板選手 (PRIME ASSET)';
    statusBadgeClass = 'badge-prime';
  } else if (age >= 32) {
    statusText = '🛡️ ベテラン (EXPERIENCED)';
    statusBadgeClass = 'badge-veteran';
  }

  const chartSvgHtml = buildPlayerMarketValueChartSvg(p, currentClubName);

  return `
    <div class="profile-tab-panel hidden" data-profile-panel="market-value">
      <div class="profile-box">
        <div class="profile-box-header">
          <div>
            <span class="profile-box-title">📈 推定市場価値の推移 (Market Value Trend)</span>
            <div class="mono text-muted" style="font-size: 10px; margin-top: 2px;">
              選手のOVR・年齢・成長実績から算出した市場価値の歴史的推移
            </div>
          </div>
          <span class="profile-status-pill mono ${statusBadgeClass}">${statusText}</span>
        </div>

        <!-- 4大メトリクス要約カード -->
        <div class="profile-metrics-row profile-metrics-row-4col" style="margin-top: 8px;">
          <div class="profile-metric-card">
            <span class="profile-metric-label">現在推定価値</span>
            <span class="profile-metric-val mono accent-green"><strong>${formatMoney(currentVal)}</strong></span>
          </div>
          <div class="profile-metric-card">
            <span class="profile-metric-label">キャリア最高価値</span>
            <span class="profile-metric-val mono accent-gold"><strong>${formatMoney(peakVal)}</strong></span>
          </div>
          <div class="profile-metric-card">
            <span class="profile-metric-label">通算価値変動</span>
            <span class="profile-metric-val mono ${isUp ? 'accent-green' : 'text-danger'}">
              <strong>${isUp ? '+' : ''}${formatMoney(delta)} (${isUp ? '+' : ''}${deltaPercent}%)</strong>
            </span>
          </div>
          <div class="profile-metric-card">
            <span class="profile-metric-label">要求移籍金目安</span>
            <span class="profile-metric-val mono text-cyan"><strong>${formatMoney(calculateTransferFee(p))}</strong></span>
          </div>
        </div>

        <!-- SVG折れ線グラフ -->
        <div class="profile-chart-section" style="margin-top: 10px;">
          ${chartSvgHtml}
        </div>

        <!-- 履歴データ詳細テーブル -->
        <div class="profile-yearly-table-wrap" style="margin-top: 10px;">
          <table class="data-table profile-yearly-table">
            <thead>
              <tr>
                <th>時期 / シーズン</th>
                <th class="col-num">年齢</th>
                <th class="col-num">OVR</th>
                <th class="col-num">推定市場価値</th>
                <th class="col-num">特記事項</th>
              </tr>
            </thead>
            <tbody>
              ${history.map((h, idx) => {
                const isPeak = (h.value === peakVal);
                const isCur = (idx === history.length - 1);
                return `
                  <tr class="${isCur ? 'profile-yearly-current-row' : ''}">
                    <td class="mono">${h.season || h.label}</td>
                    <td class="mono col-num">${h.age}</td>
                    <td class="mono col-num">${h.ovr}</td>
                    <td class="mono col-num ${isPeak ? 'accent-gold' : (isCur ? 'accent-green' : '')}">
                      <strong>${formatMoney(h.value)}</strong>
                    </td>
                    <td class="mono col-num text-muted" style="font-size: 10px;">
                      ${isPeak ? '👑 キャリア最高値' : (isCur ? '● 最新' : '-')}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

let lastProfileOpenScrollY = 0;
let lastProfileOpenContainerScrolls = [];

function openPlayerProfileModal(playerId) {
  // プロフィールを開く直前のスクロール位置（画面全体＆主要ビュー）を保存
  lastProfileOpenScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  lastProfileOpenContainerScrolls = [];
  document.querySelectorAll('.tab-view, .table-container, .main-scroll-container, #view-roster, #view-market, #view-team, #view-office').forEach(el => {
    if (el && el.scrollTop > 0) {
      lastProfileOpenContainerScrolls.push({ el, top: el.scrollTop });
    }
  });

  const ctx = findPlayerWithContextById(playerId);
  if (!ctx) return;

  const { player: p, clubName, isMarket } = ctx;
  gameState.profileModalPlayerId = p.id;
  const isCandidate = (gameState.youthCandidates || []).some(y => y.id === p.id);

  const primaryPos = p.primaryPosition || p.preferredPosition || p.pos;
  const subPosList = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];
  const baseOvr = getPlayerOverallRating(p);
  const effOvr = getEffectivePlayerRating(p);
  const playerClub = getPlayerClub();
  const isYouth = ctx.isYouth || (playerClub && playerClub.youthSquad || []).some(y => y.id === p.id);

  // ユース選手の将来予測OVR（ポテンシャル）生成・維持
  if (isYouth) {
    if (!p.potentialMin || !p.potentialMax) {
      const potBase = Math.max(baseOvr + (p.age <= 18 ? 10 : 7), p.potentialRating || 78);
      p.potentialMin = clamp(potBase, 75, 90);
      p.potentialMax = clamp(p.potentialMin + 5, p.potentialMin, 95);
    }
  }

  const growthLabel = isYouth ? '未確定（育成中）' : getGrowthCurveLabel(p.growthCurve);
  const growthClass = isYouth ? 'growth-unknown' : `growth-${p.growthCurve}`;
  const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
  const pFtgVal = getPlayerFatigue(p);
  const pFtgStatus = getPlayerFatigueStatus(pFtgVal);

  const footLabelMap = {
    Right: 'Right（右利き）',
    Left: 'Left（左利き）',
    Both: 'Both（両足）'
  };
  const footShortMap = {
    Right: '右利き',
    Left: '左利き',
    Both: '両利き'
  };
  const footText = footLabelMap[p.preferredFoot] || p.preferredFoot || 'Right（右利き）';
  const footShortText = footShortMap[p.preferredFoot] || '右利き';
  const heightText = typeof p.height === 'number' ? `${p.height}cm` : (p.height || '180cm');
  const rawNat = p.nationality || 'England';
  const flagHtml = getNationalityFlagHtml(rawNat);
  const nationalityDisplay = `<span class="profile-flag-wrapper">${flagHtml}</span><span>${rawNat}</span>`;
  const squadNumText = `#${p.squadNumber || 10}`;
  const traits = Array.isArray(p.traits) && p.traits.length > 0 ? p.traits : ['ハードワーカー'];
  const careerApps = p.careerStats ? p.careerStats.appearances : p.appearances;
  const careerGoals = p.careerStats ? p.careerStats.goals : p.goals;

  const attrs = getPlayerFiveAttributes(p);

  const squadNumEl = document.getElementById('profile-squad-num');
  if (squadNumEl) squadNumEl.textContent = squadNumText;

  // スカウティングレポート用 大型ドット絵アバター（64x64 / 2倍スケール描画）
  const avatarCanvasEl = document.getElementById('profile-avatar-canvas');
  if (avatarCanvasEl && typeof generatePlayerAvatar === 'function') {
    const isCandidate = (gameState.youthCandidates || []).some(y => y.id === p.id);
    const avatarClub = findAvatarClubForPlayer(p) || (isCandidate ? playerClub : null);
    generatePlayerAvatar(p, avatarCanvasEl, avatarClub);
  }

  const clubLabelEl = document.getElementById('profile-club-label');
  if (clubLabelEl) clubLabelEl.innerHTML = `${getClubEmblemSvg(ctx.club || clubName, 18, 'profile-club-emblem')}<span>${clubName}</span>`;

  const posPillEl = document.getElementById('profile-pos-pill');
  if (posPillEl) {
    ensurePlayerProficiencies(p);
    const mains = Array.isArray(p.mainPositions) && p.mainPositions.length > 0
      ? p.mainPositions
      : (Array.isArray(p.majorPositions) && p.majorPositions.length > 0 ? p.majorPositions : [primaryPos]);
    const subs = Array.isArray(p.subPositions) ? p.subPositions : (Array.isArray(p.secondaryPositions) ? p.secondaryPositions : []);

    const mainBadgesHtml = mains.map(mp => `<span class="profile-pos-badge-main" title="本適性ポジション">${mp}</span>`).join(' ');
    const subBadgesHtml = subs.filter(sp => !mains.includes(sp)).map(sp => `<span class="profile-pos-badge-sub" title="薄適性ポジション">${sp}</span>`).join(' ');

    posPillEl.innerHTML = `
      <div class="profile-pos-badges-wrap">
        ${mainBadgesHtml}
        ${subBadgesHtml}
      </div>
    `;
  }

  const nameEl = document.getElementById('profile-player-name');
  if (nameEl) {
    if (p.fullName && p.fullName !== p.name) {
      nameEl.innerHTML = `<span class="profile-name-main">${p.name}</span><span class="profile-fullname-sub">(${p.fullName})</span>`;
    } else {
      nameEl.textContent = p.name;
    }
  }

  const bioRowEl = document.getElementById('profile-bio-row');
  if (bioRowEl) {
    const footBadgeStr = formatFootBadge(p);
    let youthBadgeHtml = '';
    if (isYouth) {
      const starStr = p.potentialMax >= 88 ? '★★★★★' : (p.potentialMax >= 84 ? '★★★★☆' : '★★★☆☆');
      youthBadgeHtml = `
        <span class="profile-bio-chip mono" style="background:rgba(46,204,113,0.2);color:var(--accent-green);border-color:var(--accent-green);font-weight:700;">POT: ${p.potentialMin}-${p.potentialMax}</span>
        <span class="profile-bio-chip mono" style="background:rgba(241,196,15,0.18);color:var(--accent-gold);border-color:rgba(241,196,15,0.4);">将来性: ${starStr}</span>
      `;
    }

    bioRowEl.innerHTML = `
      <span class="profile-bio-chip">${nationalityDisplay}</span>
      <span class="profile-bio-chip">${p.age}歳</span>
      <span class="profile-bio-chip">${heightText}</span>
      <span class="profile-bio-chip">${footBadgeStr}</span>
      <span class="profile-bio-chip mono" style="color:${pFtgStatus.color};border-color:rgba(255,255,255,0.15);">疲労: ${pFtgVal} (${pFtgStatus.label})</span>
      ${youthBadgeHtml}
    `;
  }

  let currentSlotBanner = '';
  if (p.isStarter && p.assignedPos) {
    const fitInfo = getPositionFitInfo(p, p.assignedPos);
    let fitColorClass = 'accent-green';
    let fitSymbol = '◎ ';
    if (fitInfo.type === 'sub') { fitColorClass = 'text-cyan'; fitSymbol = '◯ '; }
    else if (fitInfo.type === 'semi') { fitColorClass = 'text-warning'; fitSymbol = '△ '; }
    else if (fitInfo.type === 'out') { fitColorClass = 'text-danger'; fitSymbol = '✕ '; }

    currentSlotBanner = `
      <div class="profile-fit-row" style="margin-top: 4px; border-color: rgba(46, 204, 113, 0.4);">
        <span class="text-muted">現在の配置スロット: <strong class="mono">${p.assignedPos}</strong></span>
        <span class="mono ${fitColorClass}"><strong>${fitSymbol}${fitInfo.label} (実効OVR ${effOvr})</strong></span>
      </div>
    `;
  }

  // 6大能力パラメータの六角形レーダーチャート（決定力・ドリブル・パス・守備・スピード・スタミナ）
  const hexagonChartHtml = buildPlayerHexagonChartSvg(attrs);

  // ポジション特訓・適性強化セクション（イーフト仕様：自クラブ選手のみに表示）
  let trainingSectionHtml = '';
  const isMyClubPlayer = Boolean(ctx.isPlayerClub || (playerClub && playerClub.players && playerClub.players.some(x => x.id === p.id)));
  if (isMyClubPlayer && !isCandidate && primaryPos !== 'GK') {
    const majors = Array.isArray(p.majorPositions) ? [...p.majorPositions] : [primaryPos];
    if (!majors.includes(primaryPos)) majors.push(primaryPos);
    const subs = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];

    // LB/LWB, RB/RWBを同一化して選択肢を整理
    const allPositions = ['CB', 'LB', 'RB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'CF'];
    const normMajors = majors.map(m => (m === 'LWB') ? 'LB' : ((m === 'RWB') ? 'RB' : m));
    const normSubs = subs.map(s => (s === 'LWB') ? 'LB' : ((s === 'RWB') ? 'RB' : s));

    // 1. 薄適性から本適性への昇格対象
    const upgradeCandidates = [...new Set(normSubs.filter(pos => !normMajors.includes(pos)))];
    // 2. 新規薄適性の習得対象
    const newSubCandidates = allPositions.filter(pos => !normMajors.includes(pos) && !normSubs.includes(pos));

    if (p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
      const tPos = p.positionTraining.targetPos;
      const mode = p.positionTraining.mode || 'sub';
      const modeText = mode === 'major' ? '本適性へ昇格' : '薄適性を習得';
      const prog = Math.min(100, Math.round(p.positionTraining.progress || 0));
      trainingSectionHtml = `
        <div class="profile-box-header" style="margin-top: 8px;">
          <span class="profile-box-title">ポジショントレーニング中</span>
          <span class="mono accent-green" style="font-size: 11px; font-weight: 700;">${prog}%</span>
        </div>
        <div class="profile-training-box">
          <div class="training-info-row">
            <span>目標: <span class="pos-tag pos-${tPos}"><strong>${tPos === 'LB' ? 'LB/LWB' : (tPos === 'RB' ? 'RB/RWB' : tPos)}</strong></span> <span class="mono text-cyan" style="font-size:10px;">(${modeText})</span></span>
            <span class="text-muted" style="font-size: 10px;">(平日練習・試合出場で進行)</span>
          </div>
          <div class="training-prog-track">
            <div class="training-prog-fill" style="width: ${prog}%;"></div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm btn-cancel-training" data-player-id="${p.id}" style="width: 100%; margin-top: 6px; padding: 4px 6px; font-size: 11px;">特訓中止</button>
        </div>
      `;
    } else if (upgradeCandidates.length > 0 || newSubCandidates.length > 0) {
      let optionsHtml = '';
      const getPosDisplay = (pos) => (pos === 'LB' ? 'LB / LWB' : (pos === 'RB' ? 'RB / RWB' : pos));
      if (upgradeCandidates.length > 0) {
        optionsHtml += `<optgroup label="本適性へ昇格（能力低下なし）">` +
          upgradeCandidates.map(pos => `<option value="${pos}">[本適性昇格] ${getPosDisplay(pos)}</option>`).join('') +
          `</optgroup>`;
      }
      if (newSubCandidates.length > 0) {
        optionsHtml += `<optgroup label="薄適性を新規習得">` +
          newSubCandidates.map(pos => `<option value="${pos}">[薄適性習得] ${getPosDisplay(pos)}</option>`).join('') +
          `</optgroup>`;
      }

      trainingSectionHtml = `
        <div class="profile-box-header" style="margin-top: 8px;">
          <span class="profile-box-title">ポジショントレーニング</span>
        </div>
        <div class="profile-training-box">
          <div class="training-select-row">
            <select class="form-select form-select-sm training-pos-select" id="training-target-select-${p.id}" style="padding: 4px 8px; font-size: 11px; flex: 1; background: #1a222d; color: #fff; border: 1px solid var(--border-color); border-radius: 4px;">
              ${optionsHtml}
            </select>
            <button type="button" class="btn btn-accent btn-sm btn-start-training" data-player-id="${p.id}" style="padding: 4px 12px; font-size: 11px; white-space: nowrap;">特訓開始</button>
          </div>
          <div class="text-muted" style="font-size: 9.5px; margin-top: 4px; line-height: 1.35;">
            ※ 日々の練習や公式戦出場を通じて、未習得ポジションの「薄適性」習得や「本適性」への昇格が可能です。
          </div>
        </div>
      `;
    }
  }

  // 年別成績・経歴データの取得と補完
  const historyData = ensurePlayerHistoryAndCareer(p, clubName);
  const { seasonHistory, careerEvents, birthYear, curSeasonStr } = historyData;

  // 今季成績の補助指標
  const clubPlayedMatches = Math.max(1, (playerClub && playerClub.played) || gameState.currentWeek || 0);
  const appRate = (p.appearances || 0) > 0
    ? Math.min(100, Math.round(((p.appearances || 0) / clubPlayedMatches) * 100))
    : 0;
  const goalsPerMatch = (p.appearances || 0) > 0
    ? ((p.goals || 0) / p.appearances).toFixed(2)
    : '0.00';
  const roleStatusText = isMarket
    ? '移籍リスト登録中'
    : (isYouth ? 'ユースアカデミー在籍' : (p.isStarter ? `スタメン起用 (${p.assignedPos || primaryPos})` : 'ベンチ・控え登録'));
  const conditionText = (p.injuryDays && p.injuryDays > 0) || (p.injuryWeeks && p.injuryWeeks > 0)
    ? `負傷離脱中 (残り${p.injuryDays || (p.injuryWeeks * 7)}日)`
    : '良好 (出場可能)';
  const conditionClass = ((p.injuryDays && p.injuryDays > 0) || (p.injuryWeeks && p.injuryWeeks > 0)) ? 'text-danger' : 'accent-green';
  const estMarketValue = calculateTransferFee(p);

  // 年別成績テーブル行の組み立て（過去シーズン ＋ 今季行 ＋ 通算行）
  const allRowsData = [
    ...seasonHistory.map(row => ({ ...row, isCurrent: false })),
    {
      seasonYear: `${curSeasonStr}`,
      clubName: clubName,
      age: p.age,
      appearances: p.appearances || 0,
      goals: p.goals || 0,
      assists: typeof p.assists === 'number' ? p.assists : 0,
      avgRating: avgRating,
      ovr: baseOvr,
      isCurrent: true
    }
  ];

  const totalAppsSum = allRowsData.reduce((acc, r) => acc + (r.appearances || 0), 0);
  const totalGoalsSum = allRowsData.reduce((acc, r) => acc + (r.goals || 0), 0);
  const totalAssistsSum = allRowsData.reduce((acc, r) => acc + (r.assists || 0), 0);
  let weightedRatingSum = 0;
  let ratedAppsSum = 0;
  for (const r of allRowsData) {
    const numR = parseFloat(r.avgRating);
    if (!Number.isNaN(numR) && r.appearances > 0) {
      weightedRatingSum += numR * r.appearances;
      ratedAppsSum += r.appearances;
    }
  }
  const careerAvgRating = ratedAppsSum > 0 ? (weightedRatingSum / ratedAppsSum).toFixed(2) : '-';

  const yearlyRowsHtml = allRowsData.map(r => `
    <tr class="${r.isCurrent ? 'profile-yearly-current-row' : ''}">
      <td class="mono">${r.seasonYear}</td>
      <td class="col-yearly-club">${r.clubName}</td>
      <td class="mono col-num">${r.age}</td>
      <td class="mono col-num">${r.appearances}</td>
      <td class="mono col-num ${r.goals > 0 ? 'accent-green' : ''}">${r.goals}</td>
      <td class="mono col-num ${r.assists > 0 ? 'text-cyan' : ''}">${r.assists || 0}</td>
      <td class="mono col-num ${r.avgRating !== '-' ? 'accent-gold' : 'text-muted'}">${r.avgRating}</td>
      <td class="mono col-num">${r.ovr}</td>
    </tr>
  `).join('');

  const timelineHtml = careerEvents.map(ev => `
    <div class="profile-timeline-item ${ev.badge === 'CURRENT' ? 'is-current' : ''}">
      <div class="profile-timeline-dot"></div>
      <div class="profile-timeline-content">
        <div class="profile-timeline-head">
          <span class="profile-timeline-year mono">${ev.year}</span>
          <span class="profile-timeline-badge mono badge-${ev.badge.toLowerCase()}">${ev.badge}</span>
        </div>
        <div class="profile-timeline-title">${ev.title}</div>
        <div class="profile-timeline-desc">${ev.desc}</div>
      </div>
    </div>
  `).join('');

  const bodyEl = document.getElementById('profile-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <!-- タブ1：能力 -->
      <div class="profile-tab-panel" data-profile-panel="ability">
        <div class="profile-section-grid">
          <!-- 左：6大能力六角形レーダーチャート ＆ 詳細能力パラメータ -->
          <div class="profile-box profile-box-hexagon">
            <div class="profile-box-header">
              <span class="profile-box-title">能力パラメータ</span>
              <span class="profile-ovr-badge">OVR ${baseOvr}</span>
            </div>
            ${hexagonChartHtml}
            <div class="profile-compact-attrs-grid">
              <div class="profile-attr-chip"><span class="attr-chip-name">決定力</span><strong class="mono ${getStatTierClass(attrs.finishing).valClass}">${attrs.finishing}</strong></div>
              <div class="profile-attr-chip"><span class="attr-chip-name">ドリブル</span><strong class="mono ${getStatTierClass(attrs.dribbling).valClass}">${attrs.dribbling}</strong></div>
              <div class="profile-attr-chip"><span class="attr-chip-name">パス</span><strong class="mono ${getStatTierClass(attrs.passing).valClass}">${attrs.passing}</strong></div>
              <div class="profile-attr-chip"><span class="attr-chip-name">守備</span><strong class="mono ${getStatTierClass(attrs.defending).valClass}">${attrs.defending}</strong></div>
              <div class="profile-attr-chip"><span class="attr-chip-name">スピード</span><strong class="mono ${getStatTierClass(attrs.pace).valClass}">${attrs.pace}</strong></div>
              <div class="profile-attr-chip"><span class="attr-chip-name">スタミナ</span><strong class="mono ${getStatTierClass(attrs.stamina).valClass}">${attrs.stamina}</strong></div>
            </div>
          </div>

          <!-- 右：適性ポジション図 ＆ トレーニング -->
          <div class="profile-box">
            <div class="profile-box-header">
              <span class="profile-box-title">適性ポジション</span>
            </div>
            ${buildPlayerPitchProficiencyHtml(p)}

            ${trainingSectionHtml}

            <div class="profile-box-header" style="margin-top: 8px;">
              <span class="profile-box-title">選手特徴</span>
            </div>
            <div class="profile-traits-wrap">
              ${traits.map(t => `<span class="profile-trait-tag">${t}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- 能力タブ下部：契約・市場価値情報 または ユースプロ契約条件 -->
        ${isYouth ? `
          <div class="profile-box" style="margin-top: 12px; border-color: rgba(46, 204, 113, 0.4); background: rgba(18, 24, 20, 0.7);">
            <div class="profile-box-header" style="border-bottom: 1px solid rgba(46, 204, 113, 0.3);">
              <span class="profile-box-title" style="color: var(--accent-green);">プロ契約条件 ＆ トップ昇格 [U-21 YOUTH]</span>
              <span class="mono accent-gold" style="font-size: 11px;">POT: ${p.potentialMin}-${p.potentialMax}</span>
            </div>
            <div class="profile-metrics-row profile-metrics-row-3col" style="margin-top: 8px;">
              <div class="profile-metric-card">
                <span class="profile-metric-label">初回契約金</span>
                <span class="profile-metric-val mono accent-gold">£40k</span>
              </div>
              <div class="profile-metric-card">
                <span class="profile-metric-label">想定週給</span>
                <span class="profile-metric-val mono accent-green">£${p.wage || 2.5}k/週</span>
              </div>
              <div class="profile-metric-card">
                <span class="profile-metric-label">契約年数</span>
                <span class="profile-metric-val mono">3年</span>
              </div>
            </div>
            <div style="margin-top: 10px;">
              <button type="button" class="btn btn-primary mono btn-modal-promote-youth" data-youth-id="${p.id}" style="width: 100%; font-weight: 700; padding: 10px 14px;">
                トップチームへプロ契約昇格する
              </button>
            </div>
          </div>
        ` : `
          <div class="profile-metrics-row profile-metrics-row-3col">
            <div class="profile-metric-card">
              <span class="profile-metric-label">${isMarket ? '要求年俸' : '現在年俸'}</span>
              <span class="profile-metric-val accent-gold">${formatMoney(p.salary)}</span>
            </div>
            <div class="profile-metric-card">
              <span class="profile-metric-label">契約残年数</span>
              <span class="profile-metric-val">${p.contractYears}年</span>
            </div>
            <div class="profile-metric-card profile-metric-clickable" data-switch-profile-tab="market-value" title="クリックで市場価値推移グラフを表示" style="cursor: pointer;">
              <span class="profile-metric-label" style="display:flex; justify-content:space-between; align-items:center;">
                <span>${isMarket ? '移籍金' : '推定市場価値'}</span>
                <span class="mono accent-green" style="font-size:9.5px;">📈 グラフ ▶</span>
              </span>
              <span class="profile-metric-val accent-green">${formatMoney(estMarketValue)}</span>
            </div>
          </div>
        `}
      </div>

      <!-- タブ2：今季成績 -->
      <div class="profile-tab-panel hidden" data-profile-panel="season">
        <div class="profile-box">
          <div class="profile-box-header">
            <span class="profile-box-title">今季成績</span>
            <span class="mono text-muted" style="font-size: 11px;">${clubName}</span>
          </div>

          <div class="profile-season-stats-grid">
            <div class="profile-metric-card">
              <span class="profile-metric-label">出場試合</span>
              <span class="profile-metric-val mono">${p.appearances} <small style="font-size: 12px; color: var(--text-muted);">試合</small></span>
            </div>
            <div class="profile-metric-card">
              <span class="profile-metric-label">ゴール</span>
              <span class="profile-metric-val mono accent-green">${p.goals} <small style="font-size: 12px; color: var(--text-muted);">得点</small></span>
            </div>
            <div class="profile-metric-card">
              <span class="profile-metric-label">アシスト</span>
              <span class="profile-metric-val mono text-cyan">${typeof p.assists === 'number' ? p.assists : 0} <small style="font-size: 12px; color: var(--text-muted);">アシスト</small></span>
            </div>
            ${['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(primaryPos) || POS_ROLE_GROUP[primaryPos] === 'GK' || POS_ROLE_GROUP[primaryPos] === 'DF' ? `
              <div class="profile-metric-card">
                <span class="profile-metric-label">クリーンシート (CS)</span>
                <span class="profile-metric-val mono accent-gold">${p.cleanSheets || 0} <small style="font-size: 12px; color: var(--text-muted);">完封</small></span>
              </div>
            ` : `
              <div class="profile-metric-card">
                <span class="profile-metric-label">クリーンシート (CS)</span>
                <span class="profile-metric-val mono text-muted">-</span>
              </div>
            `}
            <div class="profile-metric-card">
              <span class="profile-metric-label">平均評価点</span>
              <span class="profile-metric-val mono accent-gold">${avgRating !== '-' ? `★ ${avgRating}` : '-'}</span>
            </div>
            <div class="profile-metric-card">
              <span class="profile-metric-label">1試合平均得点</span>
              <span class="profile-metric-val mono">${goalsPerMatch}</span>
            </div>
            <div class="profile-metric-card">
              <span class="profile-metric-label">出場率</span>
              <span class="profile-metric-val mono">${appRate}%</span>
            </div>
            <div class="profile-metric-card">
              <span class="profile-metric-label">実効OVR</span>
              <span class="profile-metric-val mono accent-green">OVR ${effOvr}</span>
            </div>
          </div>

          <div class="profile-season-detail-list">
            <div class="profile-fit-row">
              <span class="text-muted">起用区分</span>
              <span class="mono"><strong>${roleStatusText}</strong></span>
            </div>
            <div class="profile-fit-row">
              <span class="text-muted">コンディション</span>
              <span class="mono ${conditionClass}"><strong>${conditionText}</strong></span>
            </div>
            <div class="profile-fit-row">
              <span class="text-muted">蓄積疲労度</span>
              <span class="mono"><strong style="color:${pFtgStatus.color};">${pFtgVal} / 100 (${pFtgStatus.label})</strong></span>
            </div>
            <div class="profile-fit-row profile-scout-comment-row">
              <span class="text-muted">スカウト評価</span>
              <span class="profile-scout-comment-text">
                ${p.appearances === 0
                  ? '今季の公式戦出場はまだありません。今後の起用と連携向上が期待されます。'
                  : (parseFloat(avgRating) >= 7.0
                    ? '極めて高水準なパフォーマンスを維持しており、チームの勝利に大きく貢献しています。'
                    : 'コンスタントに試合へ絡み、戦術システムの中で安定した役割を果たしています。')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- タブ3：年別成績 -->
      <div class="profile-tab-panel hidden" data-profile-panel="yearly">
        <div class="profile-box">
          <div class="profile-box-header">
            <span class="profile-box-title">年度別成績</span>
            <span class="mono text-muted" style="font-size: 11px;">通算 ${totalAppsSum}試合 / ${totalGoalsSum}G / ${totalAssistsSum}A</span>
          </div>
          <div class="profile-yearly-table-wrap">
            <table class="data-table profile-yearly-table">
              <thead>
                <tr>
                  <th>年度</th>
                  <th>所属クラブ</th>
                  <th class="col-num">年齢</th>
                  <th class="col-num">出場</th>
                  <th class="col-num">得点</th>
                  <th class="col-num">アシ</th>
                  <th class="col-num">評価点</th>
                  <th class="col-num">OVR</th>
                </tr>
              </thead>
              <tbody>
                ${yearlyRowsHtml}
              </tbody>
              <tfoot>
                <tr class="profile-yearly-total-row">
                  <td class="mono" colspan="2">通算</td>
                  <td class="mono col-num">-</td>
                  <td class="mono col-num"><strong>${totalAppsSum}</strong></td>
                  <td class="mono col-num accent-green"><strong>${totalGoalsSum}</strong></td>
                  <td class="mono col-num text-cyan"><strong>${totalAssistsSum}</strong></td>
                  <td class="mono col-num accent-gold"><strong>${careerAvgRating}</strong></td>
                  <td class="mono col-num"><strong>${baseOvr}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- タブ4：市場価値推移（SVG折れ線グラフ ＆ 4大メトリクス） -->
      ${buildPlayerMarketValueTabHtml(p, clubName)}

      <!-- タブ5：経歴 -->
      <div class="profile-tab-panel hidden" data-profile-panel="career">
        <div class="profile-section-grid">
          <div class="profile-box">
            <div class="profile-box-header">
              <span class="profile-box-title">プロフィール</span>
            </div>
            <div class="profile-pos-fit-list">
              <div class="profile-fit-row">
                <span class="text-muted">選手名</span>
                <span class="mono"><strong>${p.fullName || p.name}</strong></span>
              </div>
              <div class="profile-fit-row">
                <span class="text-muted">国籍</span>
                <span class="mono" style="display: inline-flex; align-items: center; gap: 6px;"><strong>${nationalityDisplay}</strong></span>
              </div>
              <div class="profile-fit-row">
                <span class="text-muted">年齢</span>
                <span class="mono"><strong>${birthYear}年生まれ (${p.age}歳)</strong></span>
              </div>
              <div class="profile-fit-row">
                <span class="text-muted">身長・利き足</span>
                <span class="mono"><strong>${heightText} / ${footText}</strong></span>
              </div>
              <div class="profile-fit-row">
                <span class="text-muted">所属・背番号</span>
                <span class="mono"><strong>${clubName} (${squadNumText})</strong></span>
              </div>
              <div class="profile-fit-row">
                <span class="text-muted">ポジション</span>
                <span class="mono"><strong>${primaryPos}${subPosList.length > 0 ? ` / ${subPosList.join(', ')}` : ''}</strong></span>
              </div>
            </div>
          </div>

          <div class="profile-box">
            <div class="profile-box-header">
              <span class="profile-box-title">経歴</span>
            </div>
            <div class="profile-career-timeline">
              ${timelineHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    // ポジション特訓ボタンのイベント登録
    const btnStartTrain = bodyEl.querySelector(`.btn-start-training[data-player-id="${p.id}"]`);
    if (btnStartTrain) {
      btnStartTrain.addEventListener('click', () => {
        const sel = document.getElementById(`training-target-select-${p.id}`);
        if (sel && sel.value) {
          startPlayerPositionTraining(p.id, sel.value);
        }
      });
    }
    const btnCancelTrain = bodyEl.querySelector(`.btn-cancel-training[data-player-id="${p.id}"]`);
    if (btnCancelTrain) {
      btnCancelTrain.addEventListener('click', () => {
        cancelPlayerPositionTraining(p.id);
      });
    }

    // ユース選手のトップ昇格ボタンイベント
    const btnPromoteModal = bodyEl.querySelector(`.btn-modal-promote-youth[data-youth-id="${p.id}"]`);
    if (btnPromoteModal) {
      btnPromoteModal.addEventListener('click', () => {
        const ok = window.confirm(`${p.name}選手とプロ契約を締結し、トップチームへ昇格させますか？\n（初回契約金: £40k / 週給: £${p.wage || 2.5}k / 契約年数: 3年）`);
        if (!ok) return;
        const success = promoteYouthPlayer(p.id);
        if (success) {
          closePlayerProfileModal();
        }
      });
    }

    // タブ内からの別タブジャンプ（推定市場価値カード等）
    bodyEl.querySelectorAll('[data-switch-profile-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.switchProfileTab) {
          switchProfileModalTab(btn.dataset.switchProfileTab);
        }
      });
    });
  }

  // デフォルトで「能力」タブを選択状態にする
  switchProfileModalTab('ability');

  const modalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  const cardEl = document.getElementById('player-profile-modal-card');
  const bodyScrollEl = document.getElementById('profile-modal-body');

  // スクロール位置を最上部に確実にリセット（モバイルで前回のスクロール状態が残るのを防止）
  const resetProfileScroll = () => {
    if (modalEl) modalEl.scrollTop = 0;
    if (cardEl) cardEl.scrollTop = 0;
    if (bodyScrollEl) bodyScrollEl.scrollTop = 0;
  };
  resetProfileScroll();

  if (modalEl) {
    modalEl.classList.remove('hidden');
    if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
    requestAnimationFrame(resetProfileScroll);
  }
}

/**
 * 選手詳細プロフィールモーダルを閉じる
 */
function closePlayerProfileModal() {
  const modalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  const cardEl = document.getElementById('player-profile-modal-card');
  const bodyScrollEl = document.getElementById('profile-modal-body');

  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.scrollTop = 0;
  }
  if (cardEl) cardEl.scrollTop = 0;
  if (bodyScrollEl) bodyScrollEl.scrollTop = 0;

  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
  gameState.profileModalPlayerId = null;

  // モーダルを閉じた後、直前のスクロール位置（選手一覧や市場の閲覧位置）を確実に復元
  const savedY = lastProfileOpenScrollY;
  const savedContainers = [...lastProfileOpenContainerScrolls];
  const restoreScrollPos = () => {
    if (typeof savedY === 'number') {
      window.scrollTo(0, savedY);
      if (document.documentElement) document.documentElement.scrollTop = savedY;
      if (document.body) document.body.scrollTop = savedY;
    }
    savedContainers.forEach(({ el, top }) => {
      if (el && el.scrollTop !== top) {
        el.scrollTop = top;
      }
    });
  };
  restoreScrollPos();
  requestAnimationFrame(restoreScrollPos);
  setTimeout(restoreScrollPos, 20);
  setTimeout(restoreScrollPos, 60);
}

let introClubFilter = 'all';

/**
 * クラブをフィルターカテゴリに分類
 */
function matchesClubFilter(clubDef, filter) {
  if (filter === 'all') return true;
  if (filter === 'big') {
    return clubDef.basePower >= 67 || ['MEGA RICH', 'TRADITIONAL', 'CONTENDER', 'BIG CLUB', 'AMBITIOUS'].includes(clubDef.tier);
  }
  if (filter === 'mid') {
    return (clubDef.basePower >= 62 && clubDef.basePower <= 66) || ['RISING FORCE', 'CHALLENGER', 'SMART SCOUT', 'MID TABLE', 'MONEYBALL'].includes(clubDef.tier);
  }
  if (filter === 'challenger') {
    return clubDef.basePower <= 61 || ['HISTORIC', 'MIRACLE', 'ACADEMY', 'PROMOTED'].includes(clubDef.tier);
  }
  return true;
}

/**
 * GM就任モーダル：左ペインの20クラブ選択リストを描画
 */
function getFilteredIntroClubs() {
  return CLUB_DEFINITIONS.filter(c => matchesClubFilter(c, introClubFilter));
}

function showPrevIntroClub() {
  const filtered = getFilteredIntroClubs();
  if (filtered.length === 0) return;
  const currentIndex = filtered.findIndex(c => c.id === gameState.selectedClubId);
  const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
  gameState.selectedClubId = filtered[prevIndex].id;
  renderIntroClubDetail();
}

function showNextIntroClub() {
  const filtered = getFilteredIntroClubs();
  if (filtered.length === 0) return;
  const currentIndex = filtered.findIndex(c => c.id === gameState.selectedClubId);
  const nextIndex = (currentIndex + 1) % filtered.length;
  gameState.selectedClubId = filtered[nextIndex].id;
  renderIntroClubDetail();
}

/**
 * GM就任モーダル：スライダーセレクト＆1クラブカード描画
 */
function renderIntroClubList() {
  const filtered = getFilteredIntroClubs();
  if (filtered.length === 0) return;

  // 選択クラブがフィルター内にない場合は先頭を選択
  if (!filtered.some(c => c.id === gameState.selectedClubId)) {
    gameState.selectedClubId = filtered[0].id;
  }

  // セレクトボックスの選択肢を更新
  const selectEl = document.getElementById('slider-club-select');
  if (selectEl) {
    selectEl.innerHTML = filtered.map(c => `
      <option value="${c.id}" ${c.id === gameState.selectedClubId ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');
  }

  renderIntroClubDetail();
}

/**
 * GM就任モーダル：1クラブ専用リッチカード描画（スライド式）
 */
function renderIntroClubDetail() {
  const detailEl = document.getElementById('intro-club-detail-pane');
  const summaryEl = document.getElementById('intro-selected-summary');
  const pagerText = document.getElementById('slider-pager-text');
  const selectEl = document.getElementById('slider-club-select');
  if (!detailEl) return;

  const filtered = getFilteredIntroClubs();
  const currentIndex = Math.max(0, filtered.findIndex(c => c.id === gameState.selectedClubId));
  const club = filtered[currentIndex] || CLUB_DEFINITIONS.find(c => c.id === gameState.selectedClubId) || CLUB_DEFINITIONS[0];
  const tacticDef = TACTICS_DEFINITIONS[club.defaultTactic] || TACTICS_DEFINITIONS.possession;

  if (pagerText) {
    pagerText.textContent = `${currentIndex + 1} / ${filtered.length}`;
  }

  if (selectEl && selectEl.value !== club.id) {
    selectEl.value = club.id;
  }

  detailEl.innerHTML = `
    <div class="detail-header-card">
      <div class="detail-title-row">
        <div class="detail-club-title-group">
          ${getClubEmblemSvg(club, 48, 'intro-club-emblem')}
          <div class="detail-club-header-text">
            <h3 class="detail-club-name">${club.name}</h3>
            <span class="detail-tier-badge">${club.tier}</span>
          </div>
        </div>
      </div>
      <p class="detail-club-desc">${club.desc}</p>
    </div>

    <div class="detail-metrics-grid">
      <div class="detail-metric-card highlight">
        <span class="detail-metric-label">初期クラブ資金</span>
        <span class="detail-metric-val mono accent-gold">${formatMoney(club.initialFunds)}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">理事会目標</span>
        <span class="detail-metric-val mono accent-green">${club.targetLabel}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">チーム戦力値</span>
        <span class="detail-metric-val mono">OVR ${club.basePower}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">サポーター規模</span>
        <span class="detail-metric-val mono">${club.supporters.toLocaleString()}人</span>
      </div>
    </div>

    <div class="detail-tactic-box">
      <span class="detail-tactic-label">初期戦術方針:</span>
      <strong class="detail-tactic-name mono">${tacticDef.name}</strong>
    </div>
  `;

  if (summaryEl) {
    summaryEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">${getClubEmblemSvg(club, 20, 'intro-summary-emblem')}選択: <strong class="accent-green">${club.name}</strong></span> <span class="summary-sep">/</span> 目標: <strong>${club.targetLabel}</strong> <span class="summary-sep">/</span> 予算: <strong class="accent-gold">${formatMoney(club.initialFunds)}</strong>`;
  }
}

/**
 * GM就任モーダルを開く（「はじめから」「最初からやり直す」クリック時・初回起動時）
 */
function openIntroModal(allowCancel = false) {
  if (gameState.isSimulating) return;

  const overlay = document.getElementById('intro-modal-overlay');
  const cancelBtn = document.getElementById('btn-cancel-intro');
  const inputGm = document.getElementById('input-gm-name');

  if (inputGm) {
    inputGm.value = gameState.gmName || 'L. Vance';
  }
  if (cancelBtn) {
    cancelBtn.classList.toggle('hidden', !allowCancel);
  }

  introClubFilter = 'all';
  document.querySelectorAll('#club-filter-tags .btn-filter-tag').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  renderIntroClubList();
  renderIntroClubDetail();
  overlay.classList.remove('hidden');
  setBodyModalLock(true);
}

/**
 * GM就任モーダルで選択したGM名とクラブで新規ゲームを開始する
 */
function confirmIntroAndStartGame() {
  const inputGm = document.getElementById('input-gm-name');
  const rawName = inputGm ? inputGm.value.trim() : '';
  gameState.gmName = rawName.length > 0 ? rawName : 'L. Vance';

  const overlay = document.getElementById('intro-modal-overlay');
  overlay.classList.add('hidden');
  setBodyModalLock(false);
  gameState.hasStartedOnce = true;

  if (typeof hideMainMenuScreen === 'function') {
    hideMainMenuScreen();
  }
  setupNewGame(gameState.selectedClubId);
  const playerClub = getPlayerClub();
  if (typeof openInitialStaffSetupModal === 'function' && playerClub) {
    openInitialStaffSetupModal(playerClub);
  } else if (typeof saveGameToStorage === 'function') {
    saveGameToStorage(true);
  }
}

/**
 * 指定されたクラブIDをプレイヤー担当クラブとして新規ゲームをセットアップ
 */
function setupNewGame(playerClubId = gameState.selectedClubId) {
  if (typeof stopAdvancingCalendar === 'function') {
    stopAdvancingCalendar();
  }
  resetTabScrollPositions();
  const usedNames = new Set();
  playerIdCounter = 1;

  const validClub = CLUB_DEFINITIONS.find(d => d.id === playerClubId) || CLUB_DEFINITIONS[4];
  gameState.selectedClubId = validClub.id;

  gameState.season = 1;
  gameState.currentWeek = 0;
  gameState.isSeasonOver = false;
  gameState.isGameOver = false;
  gameState.isSimulating = false;
  gameState.consecutiveDeficitSeasons = 0;
  gameState.activeTab = 'office';
  document.body.dataset.activeTab = 'office';
  gameState.rosterSubtab = 'board';
  gameState.facilitiesSubtab = 'investment';
  gameState.marketSubtab = 'market';
  gameState.lastWeekResults = [];
  gameState.matchHistory = [];
  const initialDay = getCurrentCalendarDay();
  if (initialDay) {
    gameState.calendarViewYear = initialDay.year;
    gameState.calendarViewMonth = initialDay.month;
  } else {
    gameState.calendarViewYear = 2025 + gameState.season;
    gameState.calendarViewMonth = 8;
  }
  gameState.scheduleViewMode = 'calendar';
  gameState.lastMatchTicker = null;
  gameState.lastSettlement = null;
  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  gameState.profileModalPlayerId = null;
  gameState.facilities = { stadium: 1, training: 1, scouting: 1 };
  gameState.facilityFeedback = '';
  gameState.negotiationSession = null;
  gameState.pendingMegaOffer = null;
  gameState.incomingTransferOffer = null;
  gameState.incomingOffers = [];
  gameState.targetShortlist = [];
  gameState.transferMarket = [];
  gameState.youthCandidates = [];
  gameState.marketFilter = {
    clubId: 'ALL',
    position: 'ALL',
    sortKey: 'ovr-desc',
    searchQuery: ''
  };

  // 監督カタログから各クラブへの初期監督配属とフリー監督プール構築
  const assignedManagers = [];
  const usedManagerIndexes = new Set();

  gameState.clubs = CLUB_DEFINITIONS.map((def, cIdx) => {
    const isPlayer = def.id === gameState.selectedClubId;
    const normTactic = normalizeTacticKey(def.defaultTactic);
    const formKey = def.defaultFormation && FORMATIONS[def.defaultFormation] ? def.defaultFormation : '4-3-3';

    // クラブの得意陣形・戦術に最も合致する監督をカタログから選抜
    let mgrIdx = MANAGERS_DATABASE.findIndex((m, idx) => !usedManagerIndexes.has(idx) && m.preferredFormation === formKey && m.preferredTactic === normTactic);
    if (mgrIdx === -1) {
      mgrIdx = MANAGERS_DATABASE.findIndex((m, idx) => !usedManagerIndexes.has(idx) && (m.preferredFormation === formKey || m.preferredTactic === normTactic));
    }
    if (mgrIdx === -1) {
      mgrIdx = MANAGERS_DATABASE.findIndex((m, idx) => !usedManagerIndexes.has(idx));
    }
    if (mgrIdx === -1) mgrIdx = cIdx % MANAGERS_DATABASE.length;
    usedManagerIndexes.add(mgrIdx);

    const mgrDef = MANAGERS_DATABASE[mgrIdx];
    const managerObj = createManager(mgrDef, def.id, usedNames);

    const club = {
      id: def.id,
      name: def.name,
      isPlayer,
      funds: def.initialFunds,
      supporters: def.supporters,
      targetRank: def.targetRank,
      targetLabel: def.targetLabel,
      tactic: isPlayer ? managerObj.preferredTactic : normTactic,
      formation: isPlayer ? managerObj.preferredFormation : formKey,
      manager: managerObj,
      coaches: createInitialCoaches(isPlayer),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      players: createSquad(def.basePower, usedNames),
      youthSquad: createYouthSquad(usedNames)
    };
    ensureValidSquadAndStarters(club);
    if (!club.isPlayer) {
      autoSelectStarters(club);
    }
    return club;
  });

  // 未契約のコーチをフリーコーチ候補プールとして初期化（架空名動的付与）
  gameState.freeCoaches = {
    attacking: (COACHES_DATABASE.attacking || []).slice(1).map(d => createCoach(d, 'attacking', usedNames)),
    defending: (COACHES_DATABASE.defending || []).slice(1).map(d => createCoach(d, 'defending', usedNames)),
    goalkeeping: (COACHES_DATABASE.goalkeeping || []).slice(1).map(d => createCoach(d, 'goalkeeping', usedNames)),
    fitness: (COACHES_DATABASE.fitness || []).slice(1).map(d => createCoach(d, 'fitness', usedNames))
  };

  // 未就任の監督をフリー監督候補プールとして初期化（架空名動的付与）
  gameState.freeManagers = MANAGERS_DATABASE.filter((m, idx) => !usedManagerIndexes.has(idx)).map(m => createManager(m, null, usedNames));
  if (gameState.freeManagers.length < 3) {
    const backupDefs = [
      { nationality: 'Germany', age: 59, preferredFormation: '4-2-3-1', preferredTactic: 'gegenpress', weeklyWage: 95, bio: '縦への推進力と徹底したゲーゲンプレスを叩き込む強豪指揮官。' },
      { nationality: 'Spain', age: 54, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 100, bio: '妥協なきポゼッションと高強度トレーニングで支配を極める名将。' },
      { nationality: 'Italy', age: 57, preferredFormation: '5-3-2', preferredTactic: 'counter', weeklyWage: 85, bio: '勝負どころを見極める「鼻差の勝利」の哲学を持つ勝負師。' }
    ];
    backupDefs.forEach(b => {
      gameState.freeManagers.push(createManager(b, null, usedNames));
    });
  }

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  gameState.calendar = generateSeasonCalendar(2025 + gameState.season, gameState.schedule);
  if (typeof initSeasonCompetitions === 'function') {
    initSeasonCompetitions();
  }
  gameState.currentDayIndex = 0;
  gameState.isAdvancingCalendar = false;
  gameState.dailyLogs = [
    { date: '8/1 (土)', message: '新シーズン開幕！GMに就任し、初戦に向けてスカッドが始動しました。' }
  ];
  generateTransferMarket();
  generateYouthAcademyCandidates();
  switchTab('office');
}

/**
 * ゲーム初期化処理（イベントリスナー登録）
 */

/**
 * 作戦ボードおよび控え選手カードのドラッグ＆ドロップ（DnD）とタップ詳細表示の初期化
 */
function initTacticalDragAndDrop() {
  let dragSource = null;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let isTouchReady = false;
  let longPressTimer = null;
  let ghostEl = null;
  let lastHoverDropTarget = null;

  // 控えリストのタッチ横スクロール制御
  let isBenchScrolling = false;
  let benchScrollStartX = 0;
  let benchScrollStartLeft = 0;
  let benchListEl = null;
  let lastMoveX = 0;
  let lastMoveTime = 0;
  let scrollVelocity = 0;

  function cleanupDrag() {
    document.body.classList.remove('is-tactical-dragging');
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (ghostEl && ghostEl.parentNode) {
      ghostEl.parentNode.removeChild(ghostEl);
    }
    ghostEl = null;
    document.querySelectorAll('.pitch-node.dragging, .bench-sub-item.dragging, .touch-drag-ready').forEach(el => {
      el.classList.remove('dragging', 'touch-drag-ready');
    });
    document.querySelectorAll('.drag-drop-target-active').forEach(el => {
      el.classList.remove('drag-drop-target-active');
    });
    const tacticalSideCol = document.getElementById('tactical-side-column');
    if (tacticalSideCol) {
      tacticalSideCol.classList.remove('is-dragging-card');
    }
    dragSource = null;
    isDragging = false;
    isTouchReady = false;
    isBenchScrolling = false;
    benchListEl = null;
  }

  // ネイティブ DnD ゴーストの干渉を抑止
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.pitch-node, .bench-sub-item')) {
      e.preventDefault();
    }
  });

  // ドロップ先の最適ターゲット検出（ポインタ直下 ＋ ゴースト矩形重なり・近접判定）
  function findBestDropTarget(clientX, clientY, ghostRect, source) {
    const tacticalSideCol = document.getElementById('tactical-side-column');
    const isDrawerOpen = tacticalSideCol && tacticalSideCol.classList.contains('sheet-open');
    const winWidth = window.innerWidth;
    const isPointerInsideDrawer = isDrawerOpen && clientX > (winWidth - 295);

    const elAtPoint = document.elementFromPoint(clientX, clientY);
    if (elAtPoint) {
      // ドロワーが開いていて指がドロワー内にある時は、背後のスタメン枠を絶対に拾わない（誤交代防止）
      if (!isPointerInsideDrawer) {
        const starterNode = elAtPoint.closest('.pitch-node[data-slot-index]');
        if (starterNode && starterNode !== source.element) {
          return { type: 'starter', element: starterNode };
        }
      }
      const benchNode = elAtPoint.closest('.bench-sub-item[data-player-id]');
      if (benchNode && benchNode !== source.element) {
        return { type: 'bench-item', element: benchNode };
      }
    }

    const gCenterX = ghostRect ? (ghostRect.left + ghostRect.width / 2) : clientX;
    const gCenterY = ghostRect ? (ghostRect.top + ghostRect.height / 2) : clientY;

    // ピッチ上のスタメン枠との重なり・近接判定
    const starterNodes = document.querySelectorAll('#pitch-nodes-layer .pitch-node[data-slot-index]');
    let bestStarter = null;
    let bestDist = Infinity;

    starterNodes.forEach(node => {
      if (node === source.element) return;
      const r = node.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const nCenterX = r.left + r.width / 2;
      const nCenterY = r.top + r.height / 2;
      const dist = Math.hypot(gCenterX - nCenterX, gCenterY - nCenterY);

      const isOverlapping = ghostRect && !(
        ghostRect.right < r.left ||
        ghostRect.left > r.right ||
        ghostRect.bottom < r.top ||
        ghostRect.top > r.bottom
      );

      if ((isOverlapping || dist < 80) && dist < bestDist) {
        bestDist = dist;
        bestStarter = node;
      }
    });

    // ドロワー展開中かつ指がドロワーエリア内にある場合は、背後スタメンとの誤交代を完全遮断
    if (bestStarter && !isPointerInsideDrawer) {
      return { type: 'starter', element: bestStarter };
    }

    // 控え選手カードとの重なり・近接判定
    const benchNodes = document.querySelectorAll('#pitch-bench-list .bench-sub-item[data-player-id]');
    let bestBench = null;
    let bestBenchDist = Infinity;

    benchNodes.forEach(node => {
      if (node === source.element) return;
      const r = node.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      const nCenterX = r.left + r.width / 2;
      const nCenterY = r.top + r.height / 2;
      const dist = Math.hypot(gCenterX - nCenterX, gCenterY - nCenterY);

      const isOverlapping = ghostRect && !(
        ghostRect.right < r.left ||
        ghostRect.left > r.right ||
        ghostRect.bottom < r.top ||
        ghostRect.top > r.bottom
      );

      if ((isOverlapping || dist < 70) && dist < bestBenchDist) {
        bestBenchDist = dist;
        bestBench = node;
      }
    });

    if (bestBench) {
      return { type: 'bench-item', element: bestBench };
    }

    if (source.type === 'starter' && elAtPoint) {
      const benchList = elAtPoint.closest('#pitch-bench-list, .pitch-sub-box');
      if (benchList) {
        return { type: 'bench-list', element: document.getElementById('pitch-bench-list') || benchList };
      }
    }

    return null;
  }

  // Pointer Down
  document.addEventListener('pointerdown', (e) => {
    const rosterView = document.getElementById('view-roster');
    if (!rosterView || rosterView.classList.contains('hidden')) return;

    // ボタンや入力要素は通常のクリック操作を優先
    if (e.target.closest('button, select, input, a')) return;

    const starterNode = e.target.closest('.pitch-node[data-slot-index]');
    const benchItem = e.target.closest('.bench-sub-item[data-player-id]');
    if (!starterNode && !benchItem) return;

    const playerClub = getPlayerClub();
    if (!playerClub) return;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;
    isTouchReady = false;
    lastHoverDropTarget = null;

    if (starterNode && starterNode.dataset.slotIndex !== undefined) {
      const slotIndex = parseInt(starterNode.dataset.slotIndex, 10);
      const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndex);
      if (starter) {
        const rect = starterNode.getBoundingClientRect();
        dragSource = {
          type: 'starter',
          playerId: starter.id,
          slotIndex: slotIndex,
          squadNumber: starter.squadNumber || '-',
          name: starter.name,
          pos: starter.assignedPos || starter.pos,
          ovr: getEffectivePlayerRating(starter),
          element: starterNode,
          cardWidth: rect.width,
          cardHeight: rect.height,
          grabOffsetX: e.clientX - rect.left,
          grabOffsetY: e.clientY - rect.top
        };
      }
    } else if (benchItem && benchItem.dataset.playerId) {
      const benchPlayer = playerClub.players.find(p => p.id === benchItem.dataset.playerId && !p.isStarter);
      if (benchPlayer) {
        const rect = benchItem.getBoundingClientRect();
        dragSource = {
          type: 'bench',
          playerId: benchPlayer.id,
          slotIndex: null,
          squadNumber: benchPlayer.squadNumber || '-',
          name: benchPlayer.name,
          pos: benchPlayer.primaryPosition || benchPlayer.pos,
          ovr: getPlayerOverallRating(benchPlayer),
          element: benchItem,
          cardWidth: rect.width,
          cardHeight: rect.height,
          grabOffsetX: e.clientX - rect.left,
          grabOffsetY: e.clientY - rect.top
        };
      }
    }

    if (!dragSource) return;

    benchListEl = document.getElementById('pitch-bench-list');
    if (dragSource.type === 'bench' && benchListEl) {
      isBenchScrolling = false;
      benchScrollStartX = e.clientX;
      benchScrollStartLeft = benchListEl.scrollLeft;
      lastMoveX = e.clientX;
      lastMoveTime = performance.now();
      scrollVelocity = 0;
    }

    const isTouch = e.pointerType === 'touch';
    if (isTouch) {
      const targetEl = dragSource.element;
      longPressTimer = setTimeout(() => {
        if (!dragSource) return;
        isTouchReady = true;
        if (targetEl) {
          targetEl.classList.add('touch-drag-ready');
          if (navigator.vibrate) {
            try { navigator.vibrate(15); } catch(err) {}
          }
        }
      }, 100);
    } else {
      isTouchReady = true;
    }
  });

  // Pointer Move
  document.addEventListener('pointermove', (e) => {
    if (!dragSource) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const dist = Math.hypot(deltaX, deltaY);

    // 控えリストの横スクロール中
    if (isBenchScrolling && benchListEl) {
      if (e.cancelable) e.preventDefault();
      benchListEl.scrollLeft = benchScrollStartLeft - (e.clientX - benchScrollStartX);
      const now = performance.now();
      const dt = now - lastMoveTime;
      if (dt > 0) {
        scrollVelocity = (e.clientX - lastMoveX) / dt;
      }
      lastMoveX = e.clientX;
      lastMoveTime = now;
      return;
    }

    if (!isDragging) {
      const isTouch = e.pointerType === 'touch';

      // モバイルで控え選手カードに対するタッチ操作の分岐：
      if (isTouch && dragSource.type === 'bench') {
        const isUpward = deltaY < -8 && Math.abs(deltaY) > Math.abs(deltaX) * 0.6;
        const isLeftward = deltaX < -8 && Math.abs(deltaX) > Math.abs(deltaY) * 0.5;
        const isHorizontalSwipe = Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY);

        if (isTouchReady || isUpward || isLeftward) {
          isDragging = true;
          isBenchScrolling = false;
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          if (dragSource.element) {
            dragSource.element.classList.remove('touch-drag-ready');
            dragSource.element.classList.add('dragging');
          }

          if (typeof toggleBenchSheet === 'function') toggleBenchSheet(false);
          if (window.innerWidth <= 900) document.body.classList.add('is-tactical-dragging');
          ghostEl = dragSource.element.cloneNode(true);
          ghostEl.removeAttribute('id');
          ghostEl.classList.remove('bench-sub-item', 'dragging', 'touch-drag-ready', 'drag-drop-target-active', 'selected');
          ghostEl.classList.add('tactical-drag-ghost-card');

          const initLeft = e.clientX - dragSource.grabOffsetX;
          const initTop = e.clientY - dragSource.grabOffsetY;
          ghostEl.style.setProperty('position', 'fixed', 'important');
          ghostEl.style.setProperty('width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('min-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('max-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('height', `${dragSource.cardHeight}px`, 'important');
          ghostEl.style.setProperty('left', `${initLeft}px`, 'important');
          ghostEl.style.setProperty('top', `${initTop}px`, 'important');
          ghostEl.style.setProperty('transform', 'scale(1.06)', 'important');
          ghostEl.style.setProperty('pointer-events', 'none', 'important');
          ghostEl.style.setProperty('z-index', '999999', 'important');

          const srcCanvases = dragSource.element.querySelectorAll('canvas');
          const dstCanvases = ghostEl.querySelectorAll('canvas');
          srcCanvases.forEach((srcC, idx) => {
            const dstC = dstCanvases[idx];
            if (dstC && srcC.width && srcC.height) {
              dstC.width = srcC.width;
              dstC.height = srcC.height;
              const ctx = dstC.getContext('2d');
              if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(srcC, 0, 0);
              }
            }
          });

          document.body.appendChild(ghostEl);
        } else if (isHorizontalSwipe) {
          // B. 水平方向へのスワイプ → 控えリストの横スクロール！
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          isBenchScrolling = true;
          if (benchListEl) {
            benchListEl.scrollLeft = benchScrollStartLeft - (e.clientX - benchScrollStartX);
          }
          lastMoveX = e.clientX;
          lastMoveTime = performance.now();
          if (e.cancelable) e.preventDefault();
          return;
        }
      } else {
        // PCマウス操作 または スタメン選手のドラッグ
        const dragThreshold = isTouch ? 4 : 2;
        if (dist > dragThreshold) {
          isDragging = true;
          if (dragSource.type === 'bench' && typeof toggleBenchSheet === 'function') toggleBenchSheet(false);
          if (window.innerWidth <= 900) document.body.classList.add('is-tactical-dragging');
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          if (dragSource.element) {
            dragSource.element.classList.remove('touch-drag-ready');
            dragSource.element.classList.add('dragging');
          }

          ghostEl = dragSource.element.cloneNode(true);
          ghostEl.removeAttribute('id');
          ghostEl.classList.remove('bench-sub-item', 'dragging', 'touch-drag-ready', 'drag-drop-target-active', 'selected');
          ghostEl.classList.add('tactical-drag-ghost-card');

          const initLeft = e.clientX - dragSource.grabOffsetX;
          const initTop = e.clientY - dragSource.grabOffsetY;
          ghostEl.style.setProperty('position', 'fixed', 'important');
          ghostEl.style.setProperty('width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('min-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('max-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('height', `${dragSource.cardHeight}px`, 'important');
          ghostEl.style.setProperty('left', `${initLeft}px`, 'important');
          ghostEl.style.setProperty('top', `${initTop}px`, 'important');
          ghostEl.style.setProperty('transform', 'scale(1.06)', 'important');
          ghostEl.style.setProperty('pointer-events', 'none', 'important');
          ghostEl.style.setProperty('z-index', '999999', 'important');

          const srcCanvases = dragSource.element.querySelectorAll('canvas');
          const dstCanvases = ghostEl.querySelectorAll('canvas');
          srcCanvases.forEach((srcC, idx) => {
            const dstC = dstCanvases[idx];
            if (dstC && srcC.width && srcC.height) {
              dstC.width = srcC.width;
              dstC.height = srcC.height;
              const ctx = dstC.getContext('2d');
              if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(srcC, 0, 0);
              }
            }
          });

          document.body.appendChild(ghostEl);
        }
      }
    }

    if (isDragging && ghostEl) {
      if (e.cancelable) e.preventDefault();

      const cardLeft = e.clientX - dragSource.grabOffsetX;
      const cardTop = e.clientY - dragSource.grabOffsetY;
      ghostEl.style.setProperty('left', `${cardLeft}px`, 'important');
      ghostEl.style.setProperty('top', `${cardTop}px`, 'important');

      // eFootball方式：明確なピッチ／ドロワー境界による自然な開閉感知
      const winWidth = window.innerWidth;
      const tacticalSideCol = document.getElementById('tactical-side-column');
      const isDrawerOpen = tacticalSideCol && tacticalSideCol.classList.contains('sheet-open');

      // ピッチ領域（ドロワー左端をしっかり越えた画面右から295pxより左）に指がある時にスッと収納！
      if (isDrawerOpen && e.clientX < (winWidth - 295)) {
        if (typeof toggleBenchSheet === 'function') {
          toggleBenchSheet(false);
        }
      }
      // 控えタブ・右端エリア（画面右から80px以内）に指を持ってきた時は、確実にドロワーをスッと開く！
      else if (!isDrawerOpen && e.clientX > (winWidth - 80)) {
        if (typeof toggleBenchSheet === 'function') {
          toggleBenchSheet(true);
        }
      }

      const ghostRect = {
        left: cardLeft,
        top: cardTop,
        right: cardLeft + dragSource.cardWidth,
        bottom: cardTop + dragSource.cardHeight,
        width: dragSource.cardWidth,
        height: dragSource.cardHeight
      };

      document.querySelectorAll('.drag-drop-target-active').forEach(el => el.classList.remove('drag-drop-target-active'));

      const match = findBestDropTarget(e.clientX, e.clientY, ghostRect, dragSource);
      if (match && match.element) {
        match.element.classList.add('drag-drop-target-active');
        lastHoverDropTarget = match;
      } else {
        lastHoverDropTarget = null;
      }
    }
  }, { passive: false });

  // Pointer Up
  document.addEventListener('pointerup', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (isBenchScrolling) {
      if (benchListEl && Math.abs(scrollVelocity) > 0.2) {
        let v = scrollVelocity * 14;
        const targetList = benchListEl;
        const stepInertia = () => {
          if (Math.abs(v) < 0.5 || !targetList) return;
          targetList.scrollLeft -= v;
          v *= 0.88;
          requestAnimationFrame(stepInertia);
        };
        requestAnimationFrame(stepInertia);
      }
      isBenchScrolling = false;
      cleanupDrag();
      lastHoverDropTarget = null;
      return;
    }

    if (!dragSource) return;

    const source = dragSource;

    if (!isDragging) {
      cleanupDrag();
      lastHoverDropTarget = null;
      return;
    }

    if (window.__setJustFinishedDragging) {
      window.__setJustFinishedDragging(true);
      setTimeout(() => window.__setJustFinishedDragging(false), 200);
    }

    const cardLeft = e.clientX - (source.grabOffsetX || 0);
    const cardTop = e.clientY - (source.grabOffsetY || 0);
    const ghostRect = {
      left: cardLeft,
      top: cardTop,
      right: cardLeft + (source.cardWidth || 120),
      bottom: cardTop + (source.cardHeight || 50),
      width: source.cardWidth || 120,
      height: source.cardHeight || 50
    };

    cleanupDrag();

    const finalMatch = findBestDropTarget(e.clientX, e.clientY, ghostRect, source) || lastHoverDropTarget;
    lastHoverDropTarget = null;

    if (!finalMatch || !finalMatch.element) return;

    if (finalMatch.type === 'starter' && finalMatch.element.dataset.slotIndex !== undefined) {
      const targetSlotIndex = parseInt(finalMatch.element.dataset.slotIndex, 10);
      if (source.type === 'starter') {
        if (source.slotIndex !== targetSlotIndex) {
          swapStarterSlots(source.slotIndex, targetSlotIndex);
        }
      } else if (source.type === 'bench') {
        substituteBenchPlayerToSlot(source.playerId, targetSlotIndex);
        if (typeof toggleBenchSheet === 'function') toggleBenchSheet(false);
      }
    } else if (finalMatch.type === 'bench-item' && finalMatch.element.dataset.playerId) {
      const targetPlayerId = finalMatch.element.dataset.playerId;
      if (source.type === 'starter') {
        substituteBenchPlayerToSlot(targetPlayerId, source.slotIndex);
      } else if (source.type === 'bench' && source.playerId !== targetPlayerId) {
        swapBenchOrReservePlayers(source.playerId, targetPlayerId);
      }
    } else if (finalMatch.type === 'bench-list' && source.type === 'starter') {
      const playerClub = getPlayerClub();
      const benchPlayers = playerClub.players.filter(p => !p.isStarter && !p.isRetired);
      if (benchPlayers.length > 0) {
        const formationDef = getClubFormationDef(playerClub);
        const slotDef = formationDef.slots[source.slotIndex];
        const sorted = [...benchPlayers].sort((a, b) => {
          const aFit = getPositionFitInfo(a, slotDef.pos).factor;
          const bFit = getPositionFitInfo(b, slotDef.pos).factor;
          if (aFit !== bFit) return bFit - aFit;
          return getEffectivePlayerRatingForSlot(b, slotDef.pos) - getEffectivePlayerRatingForSlot(a, slotDef.pos);
        });
        substituteBenchPlayerToSlot(sorted[0].id, source.slotIndex);
      }
    }
  });

  // Pointer Cancel
  document.addEventListener('pointercancel', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    cleanupDrag();
    lastHoverDropTarget = null;
  });
}

function initGame() {
  initTacticalDragAndDrop();
  setupCompetitionNavListeners();
  const btnAdvanceDay = document.getElementById('btn-advance-day');
  if (btnAdvanceDay) {
    btnAdvanceDay.addEventListener('click', () => advanceCalendarDay(false));
  }
  const btnAdvanceToMatch = document.getElementById('btn-advance-to-match');
  if (btnAdvanceToMatch) {
    btnAdvanceToMatch.addEventListener('click', startAdvancingToNextMatch);
  }
  const btnPlayMatch = document.getElementById('btn-play-match');
  if (btnPlayMatch) {
    btnPlayMatch.addEventListener('click', () => openMatchPrecheckModal());
  }
  const btnPauseAdvance = document.getElementById('btn-pause-advance');
  if (btnPauseAdvance) {
    btnPauseAdvance.addEventListener('click', stopAdvancingCalendar);
  }
  const btnPlayNext = document.getElementById('btn-play-next');
  if (btnPlayNext) {
    btnPlayNext.addEventListener('click', () => openMatchPrecheckModal());
  }
  document.getElementById('btn-skip-season').addEventListener('click', skipToSeasonEnd);
  document.getElementById('btn-next-season').addEventListener('click', startNextSeason);
  const btnRestart = document.getElementById('btn-restart-game');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      showMainMenuScreen();
    });
  }
  const btnOpenIntro = document.getElementById('btn-open-intro');
  if (btnOpenIntro) {
    btnOpenIntro.addEventListener('click', () => openIntroModal(true));
  }

  // GM就任モーダル内のイベント（フィルタータグ・クラブ選択・詳細同期）
  document.getElementById('club-filter-tags').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-filter-tag');
    if (btn && btn.dataset.filter) {
      introClubFilter = btn.dataset.filter;
      document.querySelectorAll('#club-filter-tags .btn-filter-tag').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      renderIntroClubList();
    }
  });

  // スライダー切り替えボタン（前へ・次へ）
  const btnPrevClub = document.getElementById('btn-prev-club');
  if (btnPrevClub) {
    btnPrevClub.addEventListener('click', showPrevIntroClub);
  }

  const btnNextClub = document.getElementById('btn-next-club');
  if (btnNextClub) {
    btnNextClub.addEventListener('click', showNextIntroClub);
  }

  // クラブ直接選択セレクトボックス
  const sliderClubSelect = document.getElementById('slider-club-select');
  if (sliderClubSelect) {
    sliderClubSelect.addEventListener('change', (e) => {
      gameState.selectedClubId = e.target.value;
      renderIntroClubDetail();
    });
  }

  // タッチスワイプ（左右フリック）対応
  const cardContainer = document.getElementById('intro-single-card-container');
  if (cardContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    cardContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    cardContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        // 横方向へのスワイプ判定（縦スクロールの誤判定防止）
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          if (deltaX < 0) {
            showNextIntroClub(); // 左スワイプで次へ
          } else {
            showPrevIntroClub(); // 右スワイプで前へ
          }
        }
      }
    }, { passive: true });
  }

  // キーボード左右矢印キー対応（モーダル表示中）
  window.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('intro-modal-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') {
        showPrevIntroClub();
      } else if (e.key === 'ArrowRight') {
        showNextIntroClub();
      }
    }
  });

  document.getElementById('btn-confirm-intro').addEventListener('click', confirmIntroAndStartGame);
  document.getElementById('btn-cancel-intro').addEventListener('click', () => {
    document.getElementById('intro-modal-overlay').classList.add('hidden');
    setBodyModalLock(false);
  });

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    const onSelectTab = (e) => {
      const tab = btn.dataset.tab;
      if (tab) {
        switchTab(tab);
      }
    };
    btn.addEventListener('click', onSelectTab);
    btn.addEventListener('touchend', (e) => {
      onSelectTab(e);
    });
  });

  // フォーメーション選択ボタン（4-3-3 / 4-2-3-1 / 4-4-2 / 3-5-2）
  const formationBtnGroup = document.getElementById('formation-btn-group');
  if (formationBtnGroup) {
    formationBtnGroup.addEventListener('click', (e) => {
      const fBtn = e.target.closest('.btn-formation');
      if (fBtn && fBtn.dataset.formation) {
        setClubFormation(fBtn.dataset.formation);
      }
    });
  }

  // モバイル用フォーメーション変更セレクト
  const formationSelectMobile = document.getElementById('formation-select-mobile');
  if (formationSelectMobile) {
    formationSelectMobile.addEventListener('change', (e) => {
      if (e.target.value) {
        setClubFormation(e.target.value);
      }
    });
  }

  // おまかせ最適編成ボタン
  const btnAutoOptimal = document.getElementById('btn-auto-optimal-lineup');
  if (btnAutoOptimal) {
    btnAutoOptimal.addEventListener('click', () => {
      applyAutoOptimalLineup();
    });
  }

  // 作戦ボード（ピッチ）および控え選手のカード全体タップで詳細プロフィール表示
  let justFinishedDragging = false;
  window.__setJustFinishedDragging = function(val) { justFinishedDragging = val; };
  window.__getJustFinishedDragging = function() { return justFinishedDragging; };

  // 作戦ボード（ピッチ）のスタメン枠クリック：詳細プロフィール表示（クリック交代は完全撤廃しドラッグ＆ドロップのみで交代）
  const pitchNodesLayer = document.getElementById('pitch-nodes-layer');
  if (pitchNodesLayer) {
    pitchNodesLayer.addEventListener('click', (e) => {
      if (justFinishedDragging) {
        e.stopPropagation();
        return;
      }
      const nodeEl = e.target.closest('.pitch-node');
      if (nodeEl && nodeEl.dataset.playerId) {
        e.stopPropagation();
        openPlayerProfileModal(nodeEl.dataset.playerId);
      }
    });
  }

  // 控え・ベンチ外右スライドサイドドロワーの開閉制御
  const btnOpenBenchSheet = document.getElementById('btn-open-bench-sheet');
  const benchSheetHandle = document.getElementById('bench-sheet-handle');
  const tacticalSideColumn = document.getElementById('tactical-side-column');
  const benchSheetBackdrop = document.getElementById('bench-sheet-backdrop');

  function toggleBenchSheet(forceOpen) {
    if (!tacticalSideColumn) return;
    // PC環境（幅900px超）ではドロワー開閉を行わず常に通常2カラム表示を維持
    if (window.innerWidth > 900) return;
    const isOpen = tacticalSideColumn.classList.contains('sheet-open');
    const targetState = forceOpen !== undefined ? forceOpen : !isOpen;
    tacticalSideColumn.classList.toggle('sheet-open', targetState);
    if (benchSheetBackdrop) {
      benchSheetBackdrop.classList.toggle('active', targetState);
    }
  }
  window.toggleBenchSheet = toggleBenchSheet;

  // 右スライドサイドドロワーのスワイプ開閉制御（右端から左スワイプで展開、右スワイプで収納）
  let touchStartX = 0;
  let touchStartY = 0;
  let isEdgeSwipePotential = false;
  let isDrawerSwipePotential = false;

  document.addEventListener('touchstart', (e) => {
    if (!tacticalSideColumn) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    const winWidth = window.innerWidth;
    const isOpen = tacticalSideColumn.classList.contains('sheet-open');

    if (!isOpen) {
      // 閉じてる時：画面右端付近（右から70px以内）またはタブ上でのタッチでエッジスワイプスタンバイ
      if (touchStartX > winWidth - 70 || e.target.closest('#btn-open-bench-sheet')) {
        isEdgeSwipePotential = true;
      } else {
        isEdgeSwipePotential = false;
      }
      isDrawerSwipePotential = false;
    } else {
      // 開いている時：ドロワー上または背景でのタッチで右スワイプ収納スタンバイ
      if (e.target.closest('#tactical-side-column, #bench-sheet-backdrop')) {
        isDrawerSwipePotential = true;
      } else {
        isDrawerSwipePotential = false;
      }
      isEdgeSwipePotential = false;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!tacticalSideColumn) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // 縦スクロールが支配的な場合はキャンセル
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) return;

    // 1. 閉じている時：右から左へスワイプ（deltaX < -25px）でドロワー展開！
    if (isEdgeSwipePotential && deltaX < -25) {
      isEdgeSwipePotential = false;
      toggleBenchSheet(true);
    }

    // 2. 開いている時：左から右へスワイプ（deltaX > 30px）でドロワー収納！
    if (isDrawerSwipePotential && deltaX > 30) {
      isDrawerSwipePotential = false;
      toggleBenchSheet(false);
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    isEdgeSwipePotential = false;
    isDrawerSwipePotential = false;
  }, { passive: true });


  if (btnOpenBenchSheet) {
    btnOpenBenchSheet.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBenchSheet(true);
    });
  }
  if (benchSheetHandle) {
    benchSheetHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBenchSheet(false);
    });
  }
  if (benchSheetBackdrop) {
    benchSheetBackdrop.addEventListener('click', () => {
      toggleBenchSheet(false);
    });
  }

  // 作戦ボード選択解除ボタン
  const clearSlotBtn = document.getElementById('btn-clear-slot-select');
  if (clearSlotBtn) {
    clearSlotBtn.addEventListener('click', () => {
      gameState.selectedSlotIndex = null;
      gameState.selectedPlayerId = null;
      renderRoster();
    });
  }

  // 控え / ベンチ外のモバイルトグルピル
  const pillBenchBtn = document.getElementById('pill-show-bench');
  if (pillBenchBtn) {
    pillBenchBtn.addEventListener('click', () => {
      gameState.tacticalBottomSubView = 'bench';
      renderTacticalBoard();
    });
  }
  const pillReservesBtn = document.getElementById('pill-show-reserves');
  if (pillReservesBtn) {
    pillReservesBtn.addEventListener('click', () => {
      gameState.tacticalBottomSubView = 'reserves';
      renderTacticalBoard();
    });
  }

  // 控え選手リスト：クリック時は詳細プロフィール表示（交代はドラッグ＆ドロップのみ）
  const pitchBenchList = document.getElementById('pitch-bench-list');
  if (pitchBenchList) {
    pitchBenchList.addEventListener('click', (e) => {
      if (justFinishedDragging) {
        e.stopPropagation();
        return;
      }
      const itemEl = e.target.closest('.bench-sub-item');
      if (itemEl && itemEl.dataset.playerId) {
        e.stopPropagation();
        openPlayerProfileModal(itemEl.dataset.playerId);
      }
    });
  }

  document.getElementById('tactics-btn-group').addEventListener('click', (e) => {
    const infoBtn = e.target.closest('[data-tactic-info]');
    if (infoBtn && infoBtn.dataset.tacticInfo) {
      e.stopPropagation();
      e.preventDefault();
      showTacticInfoPopup(infoBtn.dataset.tacticInfo);
      return;
    }

    const tacticBtn = e.target.closest('.btn-tactic');
    if (tacticBtn && tacticBtn.dataset.tactic) {
      setTeamTactic(tacticBtn.dataset.tactic);
    }
  });

  document.getElementById('roster-tbody').addEventListener('click', (e) => {
    const profileBtn = e.target.closest('[data-profile-id]');
    if (profileBtn) {
      e.stopPropagation();
      openPlayerProfileModal(profileBtn.dataset.profileId);
      return;
    }

    if (e.target.closest('.slot-select')) {
      e.stopPropagation();
      return;
    }

    const starterBtn = e.target.closest('.btn-starter-toggle');
    if (starterBtn) {
      e.stopPropagation();
      togglePlayerStarter(starterBtn.dataset.starterId);
      return;
    }

    const loanListBtn = e.target.closest('.btn-loan-listing');
    if (loanListBtn) {
      e.stopPropagation();
      toggleLoanListing(loanListBtn.dataset.loanListId);
      return;
    }

    const extendBtn = e.target.closest('.btn-extend-contract');
    if (extendBtn) {
      e.stopPropagation();
      extendPlayerContract(extendBtn.dataset.extendId);
      return;
    }

    const demoteBtn = e.target.closest('.btn-demote-youth');
    if (demoteBtn) {
      e.stopPropagation();
      demotePlayerToYouth(demoteBtn.dataset.demoteId);
      return;
    }

    const releaseBtn = e.target.closest('.btn-release-player');
    if (releaseBtn) {
      e.stopPropagation();
      releaseRosterPlayer(releaseBtn.dataset.releaseId);
      return;
    }

    const tr = e.target.closest('tr[data-player-id]');
    if (tr) {
      handleRosterClick(tr.dataset.playerId);
    }
  });

  document.getElementById('roster-tbody').addEventListener('change', (e) => {
    const selectEl = e.target.closest('.slot-select');
    if (selectEl) {
      changeStarterAssignedPos(selectEl.dataset.slotPlayerId, selectEl.value);
    }
  });

  // 移籍サブタブバー切り替えイベント
  const marketSubnav = document.getElementById('market-subnav-bar');
  if (marketSubnav) {
    marketSubnav.addEventListener('click', (e) => {
      const btn = e.target.closest('.roster-subtab-btn');
      if (btn && btn.dataset.marketSubtab) {
        switchMarketSubtab(btn.dataset.marketSubtab);
      }
    });
  }

  // 経営サブタブバー切り替えイベント
  const facilitiesSubnav = document.getElementById('facilities-subnav-bar');
  if (facilitiesSubnav) {
    facilitiesSubnav.addEventListener('click', (e) => {
      const btn = e.target.closest('.roster-subtab-btn');
      if (btn && btn.dataset.facilitiesSubtab) {
        switchFacilitiesSubtab(btn.dataset.facilitiesSubtab);
      }
    });
  }

  // 移籍市場テーブル内 クリックイベント（詳細＆ショートリストトグル）
  document.getElementById('market-tbody').addEventListener('click', (e) => {
    const slBtn = e.target.closest('[data-shortlist-toggle]');
    if (slBtn) {
      e.stopPropagation();
      toggleShortlist(slBtn.dataset.shortlistToggle);
      return;
    }
    const profileBtn = e.target.closest('[data-profile-id]');
    if (profileBtn) {
      e.stopPropagation();
      openPlayerProfileModal(profileBtn.dataset.profileId);
      return;
    }
    const offerBtn = e.target.closest('.btn-offer-transfer');
    if (offerBtn) {
      e.stopPropagation();
      const playerId = offerBtn.dataset.offerId || offerBtn.dataset.offerPlayerId;
      openTransferNegotiationModal(playerId);
      return;
    }
    const signBtn = e.target.closest('.btn-sign-player');
    if (signBtn) {
      signMarketPlayer(signBtn.dataset.signId);
    }
  });

  // 獲得ターゲットリスト（SHORTLIST）テーブル内 クリックイベント
  const shortlistTbody = document.getElementById('shortlist-tbody');
  if (shortlistTbody) {
    shortlistTbody.addEventListener('click', (e) => {
      const gotoOffersBtn = e.target.closest('[data-goto-offers]');
      if (gotoOffersBtn) {
        e.stopPropagation();
        switchMarketSubtab('offers');
        switchOffersTab(gotoOffersBtn.dataset.gotoOffers || 'outgoing');
        return;
      }

      const profileEl = e.target.closest('[data-profile-id]');
      if (profileEl) {
        e.stopPropagation();
        openPlayerProfileModal(profileEl.dataset.profileId);
        return;
      }
      const formalBtn = e.target.closest('[data-formal-offer-id]');
      if (formalBtn) {
        e.stopPropagation();
        openTransferNegotiationModal(formalBtn.dataset.formalOfferId);
        return;
      }
      const removeBtn = e.target.closest('[data-shortlist-remove]');
      if (removeBtn) {
        e.stopPropagation();
        toggleShortlist(removeBtn.dataset.shortlistRemove);
        return;
      }
    });
  }

  // 受信オファーリスト（INCOMING OFFERS）内 クリックイベント
    // オファー一覧（受信オファー / 送信オファー）コンテナのクリックイベント
    // オファー一覧（受信オファー / 送信オファー）コンテナおよびドキュメント全体の委譲クリック
  function handleOfferActions(e) {
    // 選手プロフィールリンク
    const profileBtn = e.target.closest('[data-profile-id]');
    if (profileBtn && !e.target.closest('button:not(.player-name-link):not(.offer-player-avatar-wrap):not([data-profile-id])')) {
      e.stopPropagation();
      openPlayerProfileModal(profileBtn.dataset.profileId);
      return;
    }

    // 受信オファー：承諾 (ACCEPT)
    const acceptBtn = e.target.closest('[data-offer-accept]');
    if (acceptBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = acceptBtn.getAttribute('data-offer-accept') || acceptBtn.dataset.offerAccept;
      acceptIncomingOffer(offerId);
      return;
    }

    // 受信オファー：拒否 (REJECT)
    const rejectBtn = e.target.closest('[data-offer-reject]');
    if (rejectBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = rejectBtn.getAttribute('data-offer-reject') || rejectBtn.dataset.offerReject;
      rejectIncomingOffer(offerId);
      return;
    }

    // 受信オファー：上乗せ要求モーダルを開く
    const counterBtn = e.target.closest('[data-offer-counter]');
    if (counterBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = counterBtn.getAttribute('data-offer-counter') || counterBtn.dataset.offerCounter;
      counterIncomingOffer(offerId);
      return;
    }

    // 送信オファー：相手からの増額提示を承認
    const acceptCpuCounterBtn = e.target.closest('[data-outgoing-accept-counter]');
    if (acceptCpuCounterBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = acceptCpuCounterBtn.getAttribute('data-outgoing-accept-counter') || acceptCpuCounterBtn.dataset.outgoingAcceptCounter;
      acceptCpuCounterOffer(offerId);
      return;
    }

    // 送信オファー：契約確定（SIGN）
    const signBtn = e.target.closest('[data-outgoing-sign]');
    if (signBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = signBtn.getAttribute('data-outgoing-sign') || signBtn.dataset.outgoingSign;
      completeOutgoingTransferSigning(offerId);
      return;
    }

    // 送信オファー：履歴削除
    const removeBtn = e.target.closest('[data-outgoing-remove]');
    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = removeBtn.getAttribute('data-outgoing-remove') || removeBtn.dataset.outgoingRemove;
      if (Array.isArray(gameState.outgoingOffers)) {
        gameState.outgoingOffers = gameState.outgoingOffers.filter(o => o.id !== offerId);
        updateMarketBadges();
        renderAll();
      }
      return;
    }

    // 送信オファー：オファー撤回・キャンセル
    const cancelBtn = e.target.closest('[data-outgoing-cancel]');
    if (cancelBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = cancelBtn.getAttribute('data-outgoing-cancel') || cancelBtn.dataset.outgoingCancel;
      cancelOutgoingOffer(offerId);
      return;
    }
  }

  const incomingOffersContainer = document.getElementById('incoming-offers-container');
  if (incomingOffersContainer) {
    incomingOffersContainer.addEventListener('click', handleOfferActions);
  }
  // 万一コンテナ外や再描画タイミングで外れても確実に動作するグローバル委譲
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-offer-accept], [data-offer-reject], [data-offer-counter], [data-outgoing-sign], [data-outgoing-cancel], [data-outgoing-accept-counter], [data-outgoing-remove]')) {
      handleOfferActions(e);
    }
  });

  const offersFilterTabs = document.getElementById('offers-filter-tabs');
  if (offersFilterTabs) {
    offersFilterTabs.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-offers-tab]');
      if (tabBtn) {
        switchOffersTab(tabBtn.dataset.offersTab);
      }
    });
  }

  const youthSquadTbody = document.getElementById('youth-squad-tbody');
  if (youthSquadTbody) {
    youthSquadTbody.addEventListener('click', (e) => {
      const promoteBtn = e.target.closest('.btn-promote-youth, .btn-promote-youth-direct');
      if (promoteBtn) {
        const youthId = promoteBtn.dataset.promoteId || promoteBtn.dataset.promoteDirectId;
        if (youthId) {
          e.stopPropagation();
          promoteYouthPlayer(youthId);
          return;
        }
      }
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
    });
  }

  // アカデミー施設・ユース候補リストのイベント（トップ昇格・見送り・詳細表示）
  const youthListEl = document.getElementById('youth-list');
  if (youthListEl) {
    youthListEl.addEventListener('click', (e) => {
      const promoteBtn = e.target.closest('[data-promote-youth]');
      if (promoteBtn && promoteBtn.dataset.promoteYouth) {
        e.stopPropagation();
        promoteYouthCandidate(promoteBtn.dataset.promoteYouth);
        return;
      }
      const dismissBtn = e.target.closest('[data-dismiss-youth]');
      if (dismissBtn && dismissBtn.dataset.dismissYouth) {
        e.stopPropagation();
        dismissYouthCandidate(dismissBtn.dataset.dismissYouth);
        return;
      }
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
    });
  }

  // グローバル移籍市場のフィルター＆ソートイベント
  const marketFilterClub = document.getElementById('market-filter-club');
  const marketFilterPos = document.getElementById('market-filter-pos');
  const marketFilterSort = document.getElementById('market-filter-sort');
  const marketFilterSearch = document.getElementById('market-filter-search');

  if (marketFilterClub) {
    marketFilterClub.addEventListener('change', (e) => {
      gameState.marketFilter.clubId = e.target.value;
      gameState.marketFilter.club = e.target.value;
      renderMarket();
    });
  }
  if (marketFilterPos) {
    marketFilterPos.addEventListener('change', (e) => {
      gameState.marketFilter.position = e.target.value;
      gameState.marketFilter.pos = e.target.value;
      renderMarket();
    });
  }
  if (marketFilterSort) {
    marketFilterSort.addEventListener('change', (e) => {
      gameState.marketFilter.sortKey = e.target.value;
      gameState.marketFilter.sort = e.target.value;
      renderMarket();
    });
  }
  if (marketFilterSearch) {
    marketFilterSearch.addEventListener('input', (e) => {
      gameState.marketFilter.searchQuery = e.target.value.trim().toLowerCase();
      gameState.marketFilter.search = e.target.value.trim().toLowerCase();
      renderMarket();
    });
  }

  // 移籍市場テーブルのヘッダークリックによる直感的ソート対応
  const marketTableHead = document.querySelector('.market-table thead');
  if (marketTableHead) {
    marketTableHead.style.cursor = 'pointer';
    marketTableHead.addEventListener('click', (e) => {
      const th = e.target.closest('th');
      if (!th) return;
      const txt = th.textContent.trim();
      let nextSort = null;
      if (txt.includes('OVR')) {
        nextSort = gameState.marketFilter.sortKey === 'ovr-desc' ? 'ovr-asc' : 'ovr-desc';
      } else if (txt.includes('移籍金')) {
        nextSort = gameState.marketFilter.sortKey === 'fee-desc' ? 'fee-asc' : 'fee-desc';
      } else if (txt.includes('週給')) {
        nextSort = gameState.marketFilter.sortKey === 'wage-desc' ? 'wage-asc' : 'wage-desc';
      } else if (txt.includes('年齢')) {
        nextSort = gameState.marketFilter.sortKey === 'age-asc' ? 'age-desc' : 'age-asc';
      } else if (txt.includes('契約残')) {
        nextSort = gameState.marketFilter.sortKey === 'contract-asc' ? 'contract-desc' : 'contract-asc';
      }
      if (nextSort) {
        gameState.marketFilter.sortKey = nextSort;
        gameState.marketFilter.sort = nextSort;
        if (marketFilterSort) marketFilterSort.value = nextSort;
        renderMarket();
      }
    });
  }

  const topScorersTbody = document.getElementById('top-scorers-tbody');
  if (topScorersTbody) {
    topScorersTbody.addEventListener('click', (e) => {
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
      }
    });
  }

  // 個人スタッツ（7大カテゴリー：得点・アシスト・評価点・完封・MOM・出場・警告退場）の切り替え
  const statsCatNavBar = document.getElementById('stats-category-nav-bar');
  if (statsCatNavBar) {
    statsCatNavBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.stats-cat-btn');
      if (btn && btn.dataset.statsCat) {
        renderLeagueStats(btn.dataset.statsCat);
      }
    });
  }

  // GM業務タスク一覧（折りたたみトグル＆実行ボタン）のイベント
  const btnToggleGmTasks = document.getElementById('btn-toggle-gm-tasks');
  if (btnToggleGmTasks) {
    btnToggleGmTasks.addEventListener('click', () => {
      gameState.gmTasksCollapsed = !gameState.gmTasksCollapsed;
      renderGmDuties();
    });
  }

  const gmTasksMiniSummary = document.getElementById('gm-tasks-mini-summary');
  if (gmTasksMiniSummary) {
    gmTasksMiniSummary.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-duty-action]');
      if (actionBtn && actionBtn.dataset.dutyAction) {
        handleGmDutyAction(actionBtn.dataset.dutyAction);
      }
    });
  }

  const gmTasksList = document.getElementById('gm-tasks-list');
  if (gmTasksList) {
    gmTasksList.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-duty-action]');
      if (actionBtn && actionBtn.dataset.dutyAction) {
        handleGmDutyAction(actionBtn.dataset.dutyAction);
      }
    });
  }

  // クラブ施設投資（アップグレードボタン＆インフォポップアップ表示）のイベント
  const facilitiesGrid = document.getElementById('facilities-grid');
  if (facilitiesGrid) {
    facilitiesGrid.addEventListener('click', (e) => {
      const infoBtn = e.target.closest('[data-facility-info]');
      if (infoBtn && infoBtn.dataset.facilityInfo) {
        e.stopPropagation();
        e.preventDefault();
        showFacilityInfoPopup(infoBtn.dataset.facilityInfo);
        return;
      }

      const upgradeBtn = e.target.closest('[data-upgrade-facility]');
      if (upgradeBtn && upgradeBtn.dataset.upgradeFacility) {
        upgradeFacility(upgradeBtn.dataset.upgradeFacility);
      }
    });
  }

  // ユースアカデミー（選手名プロフィール・トップ昇格・見送りボタン）のイベント
  const btnGotoYouthSquad = document.getElementById('btn-goto-youth-squad');
  if (btnGotoYouthSquad) {
    btnGotoYouthSquad.addEventListener('click', () => {
      switchTab('roster');
      const panel = document.getElementById('youth-squad-panel') || document.getElementById('youth-squad-tbody');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // 選手プロフィール詳細モーダルを閉じるイベント＆タブ切り替えイベント
  const closeProfileBtn = document.getElementById('btn-close-profile-modal');
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closePlayerProfileModal);
  }
  const profileSubnavBar = document.getElementById('profile-subnav-bar');
  if (profileSubnavBar) {
    const onSelectProfileTab = (e) => {
      const btn = e.target.closest('.profile-tab-btn');
      if (!btn || !btn.dataset.profileTab) return;
      switchProfileModalTab(btn.dataset.profileTab);
    };
    profileSubnavBar.addEventListener('click', onSelectProfileTab);
  }
  const profileFooterActions = document.getElementById('profile-footer-actions');
  if (profileFooterActions) {
    profileFooterActions.addEventListener('click', (e) => {
      if (e.target.closest('#btn-close-profile-footer')) {
        closePlayerProfileModal();
        return;
      }
      const renewalBtn = e.target.closest('[data-profile-negotiate-renewal]');
      if (renewalBtn && renewalBtn.dataset.profileNegotiateRenewal) {
        openContractNegotiationModal(renewalBtn.dataset.profileNegotiateRenewal);
        return;
      }
      const transferBtn = e.target.closest('[data-profile-negotiate-transfer]');
      if (transferBtn && transferBtn.dataset.profileNegotiateTransfer) {
        openTransferNegotiationModal(transferBtn.dataset.profileNegotiateTransfer);
      }
    });
  }
  // モーダルは右上の「×」ボタン（#btn-close-profile-modal）または Esc キーのみで閉じる仕様を徹底（オーバーレイ背景クリックでの誤クローズを抑止）
  const profileModalOverlay = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (profileModalOverlay) {
    // 背景クリックによる自動クローズは行わない
  }

  // 契約更新・移籍獲得交渉モーダルのイベント
  const negModalOverlay = document.getElementById('negotiation-modal');
  const closeNegBtn = document.getElementById('btn-close-neg-modal');
  const cancelNegBtn = document.getElementById('btn-cancel-neg-modal');
  const submitNegBtn = document.getElementById('btn-submit-neg-offer');
  const negModalBody = document.getElementById('neg-modal-body');

  if (closeNegBtn) closeNegBtn.addEventListener('click', closeNegotiationModal);
  if (cancelNegBtn) cancelNegBtn.addEventListener('click', closeNegotiationModal);
  if (submitNegBtn) submitNegBtn.addEventListener('click', submitNegotiationOffer);
  if (negModalOverlay) {
    negModalOverlay.addEventListener('click', (e) => {
      if (e.target === negModalOverlay) {
        closeNegotiationModal();
      }
    });
  }

  if (negModalBody) {
    negModalBody.addEventListener('input', (e) => {
      const session = gameState.negotiationSession;
      if (!session || session.completed) return;

      if (e.target.id === 'neg-salary-slider' || e.target.id === 'neg-salary-input') {
        const val = Math.max(100, parseInt(e.target.value, 10) || session.demandedSalary);
        session.offeredSalary = val;
        const slider = document.getElementById('neg-salary-slider');
        const numInput = document.getElementById('neg-salary-input');
        const disp = document.getElementById('neg-offered-salary-display');
        const ratioEl = document.getElementById('neg-salary-ratio-text');
        if (slider && e.target !== slider) slider.value = val;
        if (numInput && e.target !== numInput) numInput.value = val;
        if (disp) disp.textContent = formatMoney(val);
        if (ratioEl) ratioEl.textContent = `${Math.round((val / Math.max(1, session.demandedSalary)) * 100)}%`;
      }

      if (e.target.id === 'neg-fee-slider' || e.target.id === 'neg-fee-input') {
        const val = Math.max(100, parseInt(e.target.value, 10) || session.demandedFee);
        session.offeredFee = val;
        const slider = document.getElementById('neg-fee-slider');
        const numInput = document.getElementById('neg-fee-input');
        const disp = document.getElementById('neg-offered-fee-display');
        if (slider && e.target !== slider) slider.value = val;
        if (numInput && e.target !== numInput) numInput.value = val;
        if (disp) disp.textContent = formatMoney(val);
      }
    });

    negModalBody.addEventListener('click', (e) => {
      const yrBtn = e.target.closest('.btn-neg-year');
      if (yrBtn && yrBtn.dataset.negYear) {
        const session = gameState.negotiationSession;
        if (!session || session.completed) return;
        session.offeredYears = parseInt(yrBtn.dataset.negYear, 10) || 3;
        document.querySelectorAll('#neg-years-group .btn-neg-year').forEach(b => {
          b.classList.toggle('active', b === yrBtn);
        });
        const yrDisp = document.getElementById('neg-offered-years-display');
        if (yrDisp) {
          yrDisp.innerHTML = `<strong>${session.offeredYears}年契約</strong>`;
        }
      }
    });
  }

  // 買取オファーモーダルの閉じるボタン＆オーバーレイクリック
    // 移籍オファー上乗せ要求モーダルのイベント登録
  const counterModal = document.getElementById('counter-offer-modal');
  const btnCloseCounter = document.getElementById('btn-close-counter-modal');
  const btnCancelCounter = document.getElementById('btn-cancel-counter-modal');
  const btnSubmitCounter = document.getElementById('btn-submit-counter-offer');
  const counterSlider = document.getElementById('counter-fee-slider');

  if (btnCloseCounter) btnCloseCounter.addEventListener('click', closeCounterOfferModal);
  if (btnCancelCounter) btnCancelCounter.addEventListener('click', closeCounterOfferModal);
  if (btnSubmitCounter) btnSubmitCounter.addEventListener('click', submitCounterOffer);

  if (counterModal) {
    counterModal.addEventListener('click', (e) => {
      if (e.target === counterModal) {
        closeCounterOfferModal();
      }
    });
  }

  if (counterSlider) {
    counterSlider.addEventListener('input', (e) => {
      if (!activeCounterOfferId || !gameState.incomingOffers) return;
      const offer = gameState.incomingOffers.find(o => o.id === activeCounterOfferId);
      if (!offer) return;
      const ratio = parseInt(e.target.value, 10) / 100;
      // プリセットボタンスタイル更新
      document.querySelectorAll('.btn-counter-preset').forEach(btn => {
        btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.ratio) - ratio) < 0.01);
      });
      updateCounterOfferModalCalculation(offer.offerFee, ratio);
    });
  }

  document.addEventListener('click', (e) => {
    const presetBtn = e.target.closest('.btn-counter-preset');
    if (presetBtn && activeCounterOfferId && gameState.incomingOffers) {
      const offer = gameState.incomingOffers.find(o => o.id === activeCounterOfferId);
      if (!offer) return;
      const ratio = parseFloat(presetBtn.dataset.ratio);
      const slider = document.getElementById('counter-fee-slider');
      if (slider) slider.value = Math.round(ratio * 100);
      document.querySelectorAll('.btn-counter-preset').forEach(b => b.classList.remove('active'));
      presetBtn.classList.add('active');
      updateCounterOfferModalCalculation(offer.offerFee, ratio);
    }
  });

  const incomingOfferModal = document.getElementById('incoming-offer-modal');
  const btnCloseIncoming = document.getElementById('btn-close-incoming-modal');
  if (btnCloseIncoming) {
    btnCloseIncoming.addEventListener('click', closeIncomingOfferModal);
  }
  if (incomingOfferModal) {
    incomingOfferModal.addEventListener('click', (e) => {
      if (e.target === incomingOfferModal) {
        closeIncomingOfferModal();
      }
    });
  }

  // 共通インフォポップアップ（施設・戦術）の閉じるイベント
  const btnCloseInfoPopup = document.getElementById('btn-close-info-popup');
  if (btnCloseInfoPopup) btnCloseInfoPopup.addEventListener('click', closeInfoPopup);
  const infoPopupModal = document.getElementById('info-popup-modal');
  if (infoPopupModal) {
    infoPopupModal.addEventListener('click', (e) => {
      if (e.target === infoPopupModal) closeInfoPopup();
    });
  }

  // 監督交代モーダル 閉じるイベント
  const btnCloseManagerModal = document.getElementById('btn-close-manager-modal');
  if (btnCloseManagerModal) btnCloseManagerModal.addEventListener('click', closeManagerHireModal);
  const managerHireModal = document.getElementById('manager-hire-modal');
  if (managerHireModal) {
    managerHireModal.addEventListener('click', (e) => {
      if (e.target === managerHireModal) closeManagerHireModal();
    });
  }

  // コーチ招聘モーダル 閉じるイベント
  const btnCloseCoachModal = document.getElementById('btn-close-coach-modal');
  if (btnCloseCoachModal) btnCloseCoachModal.addEventListener('click', closeCoachHireModal);
  const coachHireModal = document.getElementById('coach-hire-modal');
  if (coachHireModal) {
    coachHireModal.addEventListener('click', (e) => {
      if (e.target === coachHireModal) closeCoachHireModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const scoutModal = document.getElementById('fixture-preview-modal');
      if (scoutModal && !scoutModal.classList.contains('hidden')) {
        closePendingMatchPreviewModal();
        return;
      }
      const pastSummaryModal = document.getElementById('past-match-modal');
      if (pastSummaryModal && !pastSummaryModal.classList.contains('hidden')) {
        closePastMatchSummaryModal();
        return;
      }
      const managerModal = document.getElementById('manager-hire-modal');
      if (managerModal && !managerModal.classList.contains('hidden')) {
        closeManagerHireModal();
        return;
      }
      const coachModal = document.getElementById('coach-hire-modal');
      if (coachModal && !coachModal.classList.contains('hidden')) {
        closeCoachHireModal();
        return;
      }
      const infoPopup = document.getElementById('info-popup-modal');
      if (infoPopup && !infoPopup.classList.contains('hidden')) {
        closeInfoPopup();
        return;
      }
      const recordsOverlay = document.getElementById('records-modal-overlay');
      const settingsOverlay = document.getElementById('settings-modal-overlay');
      if (recordsOverlay && !recordsOverlay.classList.contains('hidden')) {
        closeRecordsModal();
      } else if (settingsOverlay && !settingsOverlay.classList.contains('hidden')) {
        saveSettingsToStorage();
        closeSettingsModal();
      } else if (gameState.incomingTransferOffer) {
        closeIncomingOfferModal();
      } else if (gameState.negotiationSession) {
        closeNegotiationModal();
      } else if (gameState.profileModalPlayerId) {
        closePlayerProfileModal();
      } else {
        const gmOverlay = document.getElementById('gm-modal-overlay');
        if (gmOverlay && !gmOverlay.classList.contains('hidden')) {
          gmOverlay.classList.add('hidden');
        }
      }
    }
  }

  // 月初（月替わり時）に全選手の市場価値推移（valueHistory）を最新状況で更新
  if (nextDay.day === 1) {
    for (const club of gameState.clubs) {
      for (const p of club.players) {
        if (p.isRetired) continue;
        if (Array.isArray(p.valueHistory) && p.valueHistory.length > 0) {
          const curVal = calculatePlayerMarketValue(p);
          const curOvr = getPlayerOverallRating(p);
          const lastPt = p.valueHistory[p.valueHistory.length - 1];
          if (lastPt) {
            lastPt.value = curVal;
            lastPt.ovr = curOvr;
            lastPt.age = p.age || lastPt.age;
          }
        }
      }
    }
  });

  // 編成サブタブ（作戦ボード / 選手一覧 / 戦術）の切り替え
  const rosterSubnav = document.getElementById('roster-subnav-bar');
  if (rosterSubnav) {
    const onSelectSubtab = (e) => {
      const btn = e.target.closest('.roster-subtab-btn');
      if (!btn) return;
      const subtabKey = btn.dataset.subtab;
      if (subtabKey) {
        switchRosterSubtab(subtabKey);
      }
    };
    rosterSubnav.addEventListener('click', onSelectSubtab);
    rosterSubnav.addEventListener('touchend', onSelectSubtab);
  }

  // モバイルでのプルダウンリロード（Pull-to-refresh）防止および誤リロード防止の初期化


  // 対戦スカウティングプレビューモーダルのイベント
  const btnCloseScout = document.getElementById('btn-close-fixture-preview-modal');
  if (btnCloseScout) btnCloseScout.addEventListener('click', closePendingMatchPreviewModal);

  const btnFooterCloseScout = document.getElementById('btn-footer-close-fixture-preview');
  if (btnFooterCloseScout) btnFooterCloseScout.addEventListener('click', closePendingMatchPreviewModal);

  const btnGoTactics = document.getElementById('btn-go-to-tactics-board');
  if (btnGoTactics) {
    btnGoTactics.addEventListener('click', () => {
      closePendingMatchPreviewModal();
      switchTab('roster');
      switchRosterSubtab('board');
    });
  }

  // リストビュー内の未消化試合カードクリックでもプレビューを開く
  const schedListContainer = document.getElementById('season-schedule-list');
  if (schedListContainer) {
    schedListContainer.addEventListener('click', (e) => {
      const pendingCard = e.target.closest('[data-pending-match-week]');
      if (pendingCard) {
        const weekNum = parseInt(pendingCard.dataset.pendingMatchWeek, 10);
        if (weekNum) openPendingMatchPreview(weekNum);
      }
    });
  }

  // カレンダー月送りナビゲーション（前月・翌月・今月）
  const btnCalPrev = document.getElementById('btn-cal-prev-month');
  if (btnCalPrev) btnCalPrev.addEventListener('click', () => changeCalendarMonth(-1));

  const btnCalNext = document.getElementById('btn-cal-next-month');
  if (btnCalNext) btnCalNext.addEventListener('click', () => changeCalendarMonth(1));

  const btnCalToday = document.getElementById('btn-cal-go-today');
  if (btnCalToday) btnCalToday.addEventListener('click', resetCalendarToCurrentMonth);

  // 表示形式トグル（カレンダー / リスト）
  const btnToggleCal = document.getElementById('btn-view-toggle-calendar');
  if (btnToggleCal) btnToggleCal.addEventListener('click', () => switchScheduleViewMode('calendar'));

  const btnToggleList = document.getElementById('btn-view-toggle-list');
  if (btnToggleList) btnToggleList.addEventListener('click', () => switchScheduleViewMode('list'));

  // カレンダーグリッド内のマス目タップ（消化済み：サマリー / 未消化：プレビュー）
  const calGridEl = document.getElementById('calendar-days-grid');
  if (calGridEl) {
    calGridEl.addEventListener('click', (e) => {
      const cupCell = e.target.closest('[data-cal-cup-day-index]');
      if (cupCell) {
        const dayIdx = parseInt(cupCell.dataset.calCupDayIndex, 10);
        const dayObj = gameState.calendar && gameState.calendar[dayIdx];
        if (dayObj) {
          if (!dayObj.played && dayIdx === gameState.currentDayIndex) {
            openMatchPrecheckModal();
          } else {
            const mInfo = getCalendarDayPlayerMatch(dayObj);
            if (mInfo && mInfo.oppClub) {
              showToast(`${mInfo.title} vs ${mInfo.oppClub.name}`, 'info');
            }
          }
        }
        return;
      }
      const playedCell = e.target.closest('[data-cal-match-week]');
      if (playedCell) {
        const weekNum = parseInt(playedCell.dataset.calMatchWeek, 10);
        if (weekNum) openPastMatchSummaryModal(weekNum);
        return;
      }
      const pendingCell = e.target.closest('[data-cal-pending-week]');
      if (pendingCell) {
        const weekNum = parseInt(pendingCell.dataset.calPendingWeek, 10);
        if (weekNum) openPendingMatchPreview(weekNum);
      }
    });
  }

  // チームサブタブ（順位表 / 日程・結果 / 個人スタッツ）の切り替えイベント
  const teamSubnavBar = document.getElementById('team-subnav-bar');
  if (teamSubnavBar) {
    teamSubnavBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-team-subtab]');
      if (!btn) return;
      const subtabKey = btn.dataset.teamSubtab;
      switchTeamSubtab(subtabKey);
    });
  }

  // 週間スケジュールから「全日程 ➔」を押したときのイベント
  const btnViewFullSchedule = document.getElementById('btn-view-full-schedule');
  if (btnViewFullSchedule) {
    btnViewFullSchedule.addEventListener('click', () => {
      switchTab('team');
      switchTeamSubtab('schedule');
    });
  }

  // シーズン日程リスト内の消化済み試合タップでサマリーモーダルを開く
  const seasonScheduleList = document.getElementById('season-schedule-list');
  if (seasonScheduleList) {
    seasonScheduleList.addEventListener('click', (e) => {
      const card = e.target.closest('[data-past-match-week]');
      if (!card) return;
      const weekNum = parseInt(card.dataset.pastMatchWeek, 10);
      if (weekNum) {
        openPastMatchSummaryModal(weekNum);
      }
    });
  }

  // 消化済みマッチサマリー振り返りモーダルの閉じるボタンおよび背景クリック
  const btnClosePastMatch = document.getElementById('btn-close-past-match-modal');
  if (btnClosePastMatch) {
    btnClosePastMatch.addEventListener('click', closePastMatchSummaryModal);
  }
  const modalPastSummary = document.getElementById('past-match-modal');
  if (modalPastSummary) {
    modalPastSummary.addEventListener('click', (e) => {
      if (e.target === modalPastSummary) closePastMatchSummaryModal();
    });
  }
  const modalFixturePreview = document.getElementById('fixture-preview-modal');
  if (modalFixturePreview) {
    modalFixturePreview.addEventListener('click', (e) => {
      if (e.target === modalFixturePreview) closePendingMatchPreviewModal();
    });
  }

  initReloadPrevention();

  // メインメニュー（タイトル画面）のイベントリスナーを最優先で初期化
  initMainMenuAndModals();

  try {
    setupNewGame(gameState.selectedClubId);
  } catch (err) {
    console.error('setupNewGame error:', err);
  }

  showMainMenuScreen();
}

const SAVE_STORAGE_KEY = 'my_football_gm_save_v1';
const RECORDS_STORAGE_KEY = 'my_football_gm_records_v1';
const SETTINGS_STORAGE_KEY = 'my_football_gm_settings_v1';

const appSettings = {
  soundVolume: 70,
  autoSaveEnabled: true,
  matchSpeed: 2
};

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.soundVolume === 'number') appSettings.soundVolume = parsed.soundVolume;
      if (typeof parsed.autoSaveEnabled === 'boolean') appSettings.autoSaveEnabled = parsed.autoSaveEnabled;
      if (typeof parsed.matchSpeed === 'number') appSettings.matchSpeed = parsed.matchSpeed;
    }
  } catch (e) {}
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
  } catch (e) {}
}

function saveGameToStorage(force = false) {
  if (!force && !appSettings.autoSaveEnabled) return false;
  if (!gameState.clubs || gameState.clubs.length === 0) return false;
  try {
    const payload = {
      version: '1.0.0',
      savedAt: Date.now(),
      playerIdCounter,
      state: {
        gmName: gameState.gmName,
        selectedClubId: gameState.selectedClubId,
        hasStartedOnce: true,
        season: gameState.season,
        currentWeek: gameState.currentWeek,
        totalWeeks: gameState.totalWeeks,
        isSeasonOver: gameState.isSeasonOver,
        isGameOver: gameState.isGameOver,
        consecutiveDeficitSeasons: gameState.consecutiveDeficitSeasons,
        activeTab: gameState.activeTab || 'office',
        rosterSubtab: gameState.rosterSubtab || 'board',
        clubs: gameState.clubs,
        schedule: gameState.schedule,
        calendar: gameState.calendar,
        competitions: gameState.competitions,
        currentDayIndex: gameState.currentDayIndex,
        dailyLogs: gameState.dailyLogs,
        lastWeekResults: gameState.lastWeekResults,
        lastMatchTicker: gameState.lastMatchTicker,
        transferMarket: gameState.transferMarket,
        youthCandidates: gameState.youthCandidates,
        facilities: gameState.facilities,
        lastSettlement: gameState.lastSettlement,
        incomingOffers: gameState.incomingOffers || [],
        outgoingOffers: gameState.outgoingOffers || [],
        offersSubtab: gameState.offersSubtab || 'incoming',
        targetShortlist: gameState.targetShortlist || [],
        incomingTransferOffer: gameState.incomingTransferOffer || null,
        pendingMegaOffer: gameState.pendingMegaOffer || null,
        facilitiesSubtab: gameState.facilitiesSubtab || 'investment',
        marketSubtab: gameState.marketSubtab || 'market'
      }
    };
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    updateCareerRecordsFromCurrentState();
    return true;
  } catch (e) {
    return false;
  }
}

function getSavedGameSummary() {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state || !Array.isArray(parsed.state.clubs)) return null;
    const st = parsed.state;
    const playerClub = st.clubs.find(c => c.isPlayer) || st.clubs[0];
    const clubName = playerClub ? playerClub.name : 'ロンドン・FC';
    const season = st.season || 1;
    const week = Math.min(st.totalWeeks || 38, (st.currentWeek || 0) + (st.isSeasonOver ? 0 : 1));
    const weekLabel = st.isSeasonOver ? 'シーズン終了' : `第${week}節`;
    return {
      clubName,
      season,
      weekLabel,
      summaryText: `${clubName} ・ ${season}年目 ・ ${weekLabel}`,
      parsed
    };
  } catch (e) {
    return null;
  }
}

function loadGameFromStorage() {
  const info = getSavedGameSummary();
  if (!info || !info.parsed) return false;
  try {
    const { state, playerIdCounter: savedCounter } = info.parsed;
    if (typeof savedCounter === 'number') {
      playerIdCounter = savedCounter;
    }
    Object.assign(gameState, state);
    if (!gameState.facilitiesSubtab) gameState.facilitiesSubtab = 'investment';
    if (!Array.isArray(gameState.incomingOffers)) gameState.incomingOffers = [];
    if (!Array.isArray(gameState.outgoingOffers)) gameState.outgoingOffers = [];
    if (!gameState.offersSubtab) gameState.offersSubtab = 'incoming';
    if (!Array.isArray(gameState.targetShortlist)) gameState.targetShortlist = [];
    gameState.isSimulating = false;
    gameState.isAdvancingCalendar = false;
    gameState.hasStartedOnce = true;

    // カップ戦のラウンドラベルの正規化（旧データの R32: 2回戦 ➔ 1回戦、R16: 3回戦 ➔ 2回戦）
    if (Array.isArray(gameState.calendar)) {
      gameState.calendar.forEach(d => {
        if (d.isCupMatchDay && d.cupRoundKey === 'R32') {
          if (d.cupLabel && d.cupLabel.includes('2回戦')) {
            d.cupLabel = d.cupLabel.replace('2回戦', '1回戦');
          }
        } else if (d.isCupMatchDay && d.cupRoundKey === 'R16' && (d.cupCompType === 'leagueCup' || d.cupCompType === 'nationalCup')) {
          if (d.cupLabel && d.cupLabel.includes('3回戦')) {
            d.cupLabel = d.cupLabel.replace('3回戦', '2回戦');
          }
        }
      });
    }

    // 大会データの整合性チェック＆復元
    if (!gameState.competitions || !gameState.competitions.championsCup) {
      if (typeof initSeasonCompetitions === 'function') {
        initSeasonCompetitions();
      }
    } else if (typeof injectCupMatchesIntoCalendar === 'function') {
      // 既存セーブデータで欧州コンペ等の日程がカレンダーに未注入であれば再注入
      injectCupMatchesIntoCalendar();
    }

    // 全所属選手およびユースの疲労度・評価点データ互換性補完
    if (Array.isArray(gameState.clubs)) {
      gameState.clubs.forEach(c => {
        if (Array.isArray(c.players)) {
          c.players.forEach(p => {
            if (typeof p.fatigue !== 'number') p.fatigue = 0;
            if (p.lastMatchRating == null) p.lastMatchRating = 6.7;
          });
        }
        if (Array.isArray(c.youthSquad)) {
          c.youthSquad.forEach(yp => {
            if (typeof yp.fatigue !== 'number') yp.fatigue = 0;
          });
        }
      });
    }
    return true;
  } catch (e) {
    return false;
  }
}

function updateContinueButtonUI() {
  const btnContinue = document.getElementById('btn-menu-continue');
  const metaEl = document.getElementById('menu-continue-meta');
  if (!btnContinue || !metaEl) return;

  const summary = getSavedGameSummary();
  if (summary) {
    btnContinue.disabled = false;
    btnContinue.classList.remove('is-disabled');
    metaEl.textContent = summary.summaryText;
  } else {
    btnContinue.disabled = true;
    btnContinue.classList.add('is-disabled');
    metaEl.textContent = 'セーブデータなし';
  }
}

function showMainMenuScreen() {
  stopAdvancingCalendar();
  // 表示中のモーダルがあれば全て閉じる（就任モーダル等のリロード時・遷移時残存を完全防止）
  document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
  setBodyModalLock(false);

  const menuEl = document.getElementById('main-menu-screen');
  const appEl = document.getElementById('app-container');
  if (menuEl) menuEl.classList.remove('hidden');
  if (appEl) appEl.classList.add('app-hidden');
  document.body.classList.add('main-menu-active');
  updateContinueButtonUI();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

function hideMainMenuScreen() {
  const menuEl = document.getElementById('main-menu-screen');
  const appEl = document.getElementById('app-container');
  if (menuEl) menuEl.classList.add('hidden');
  if (appEl) appEl.classList.remove('app-hidden');
  document.body.classList.remove('main-menu-active');
}

function updateCareerRecordsFromCurrentState() {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    const rec = raw ? JSON.parse(raw) : {
      titlesWon: 0,
      seasonsCompleted: 0,
      bestRank: null,
      maxFunds: 0,
      topScorersHistory: []
    };
    const playerClub = getPlayerClub();
    if (playerClub) {
      if (playerClub.funds > (rec.maxFunds || 0)) {
        rec.maxFunds = playerClub.funds;
      }
      if (gameState.isSeasonOver) {
        const sorted = getSortedStandings();
        const rank = sorted.findIndex(c => c.id === playerClub.id) + 1;
        if (rank > 0 && (!rec.bestRank || rank < rec.bestRank)) {
          rec.bestRank = rank;
        }
        const seasonKey = `${gameState.gmName}_S${gameState.season}_${playerClub.id}`;
        if (rec.lastRecordedSeasonKey !== seasonKey) {
          rec.lastRecordedSeasonKey = seasonKey;
          rec.seasonsCompleted = (rec.seasonsCompleted || 0) + 1;
          if (rank === 1) {
            rec.titlesWon = (rec.titlesWon || 0) + 1;
          }
          // シーズン得点王を記録
          let bestPlayer = null;
          let bestClubName = '';
          for (const c of gameState.clubs) {
            for (const p of c.players) {
              if (!bestPlayer || p.goals > bestPlayer.goals) {
                bestPlayer = p;
                bestClubName = c.name;
              }
            }
          }
          if (bestPlayer && bestPlayer.goals > 0) {
            rec.topScorersHistory = rec.topScorersHistory || [];
            rec.topScorersHistory.unshift({
              season: gameState.season,
              name: bestPlayer.name,
              clubName: bestClubName,
              goals: bestPlayer.goals
            });
            rec.topScorersHistory = rec.topScorersHistory.slice(0, 5);
          }
        }
      }
    }
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(rec));
  } catch (e) {}
}

function openRecordsModal() {
  const overlay = document.getElementById('records-modal-overlay');
  const bodyEl = document.getElementById('records-modal-body');
  if (!overlay || !bodyEl) return;

  let rec = { titlesWon: 0, seasonsCompleted: 0, bestRank: null, maxFunds: 0, topScorersHistory: [] };
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (raw) rec = { ...rec, ...JSON.parse(raw) };
  } catch (e) {}

  const summary = getSavedGameSummary();
  const activeClub = summary && summary.parsed && summary.parsed.state
    ? (summary.parsed.state.clubs.find(c => c.isPlayer) || getPlayerClub())
    : getPlayerClub();

  const currentStats = activeClub
    ? `${activeClub.played}試合 ${activeClub.won}勝 ${activeClub.drawn}分 ${activeClub.lost}敗（勝点 ${activeClub.pts}）`
    : '記録なし';

  // 現在進行中または保存データの得点ランキング上位3名
  const clubsSource = (summary && summary.parsed && summary.parsed.state && summary.parsed.state.clubs) || gameState.clubs || [];
  const allPlayers = [];
  for (const c of clubsSource) {
    for (const p of (c.players || [])) {
      if (p.goals > 0) {
        allPlayers.push({ name: p.name, clubName: c.name, goals: p.goals });
      }
    }
  }
  allPlayers.sort((a, b) => b.goals - a.goals);

  const scorersList = (rec.topScorersHistory && rec.topScorersHistory.length > 0)
    ? rec.topScorersHistory.map(s => `<div class="records-scorer-item mono"><span>Season ${s.season}: ${s.name} (${s.clubName})</span><strong class="accent-gold">${s.goals} GOAL</strong></div>`).join('')
    : (allPlayers.length > 0
      ? allPlayers.slice(0, 3).map((s, i) => `<div class="records-scorer-item mono"><span>#${i + 1} ${s.name} (${s.clubName})</span><strong class="accent-gold">${s.goals} GOAL</strong></div>`).join('')
      : '<div class="records-empty mono">シーズン進行後に得点王記録が刻まれます</div>');

  bodyEl.innerHTML = `
    <div class="records-grid">
      <div class="records-stat-box">
        <span class="records-stat-label">通算リーグ優勝回数</span>
        <strong class="records-stat-val mono accent-gold">${rec.titlesWon || 0} 回</strong>
      </div>
      <div class="records-stat-box">
        <span class="records-stat-label">最高到達順位</span>
        <strong class="records-stat-val mono accent-green">${rec.bestRank ? `${rec.bestRank} 位` : '-'}</strong>
      </div>
      <div class="records-stat-box">
        <span class="records-stat-label">通算完走シーズン</span>
        <strong class="records-stat-val mono">${rec.seasonsCompleted || 0} シーズン</strong>
      </div>
      <div class="records-stat-box">
        <span class="records-stat-label">最高クラブ資金記録</span>
        <strong class="records-stat-val mono accent-gold">${formatMoney(rec.maxFunds || (activeClub ? activeClub.funds : 98000))}</strong>
      </div>
    </div>
    <div class="records-section">
      <h4 class="records-section-title">現在の担当クラブ成績（${activeClub ? activeClub.name : 'ロンドン・FC'}）</h4>
      <div class="records-current-line mono">${currentStats}</div>
    </div>
    <div class="records-section">
      <h4 class="records-section-title">歴代・シーズン得点王記録</h4>
      <div class="records-scorers-list">${scorersList}</div>
    </div>
  `;

  if (!overlay._hasOverlayListener) {
    overlay._hasOverlayListener = true;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeRecordsModal();
    });
  }

  overlay.classList.remove('hidden');
  setBodyModalLock(true);
}

function closeRecordsModal() {
  const overlay = document.getElementById('records-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  setBodyModalLock(false);
}

function openSettingsModal() {
  loadSettingsFromStorage();
  const overlay = document.getElementById('settings-modal-overlay');
  const volInput = document.getElementById('setting-sound-volume');
  const volVal = document.getElementById('setting-sound-volume-val');
  const autoSaveCheck = document.getElementById('setting-autosave-enabled');
  const speedSelect = document.getElementById('setting-match-speed');
  if (volInput) volInput.value = appSettings.soundVolume;
  if (volVal) volVal.textContent = `${appSettings.soundVolume}%`;
  if (autoSaveCheck) autoSaveCheck.checked = appSettings.autoSaveEnabled;
  if (speedSelect) speedSelect.value = String(appSettings.matchSpeed || 2);
  if (overlay) {
    if (!overlay._hasOverlayListener) {
      overlay._hasOverlayListener = true;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          saveSettingsToStorage();
          closeSettingsModal();
        }
      });
    }
    overlay.classList.remove('hidden');
    setBodyModalLock(true);
  }
}

function closeSettingsModal() {
  const overlay = document.getElementById('settings-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  setBodyModalLock(false);
}

function initMainMenuAndModals() {
  loadSettingsFromStorage();

  const btnContinue = document.getElementById('btn-menu-continue');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      if (btnContinue.disabled) return;
      if (loadGameFromStorage()) {
        hideMainMenuScreen();
        switchTab(gameState.activeTab || 'office');
        renderAll();
      }
    });
  }

  const btnNewCareer = document.getElementById('btn-menu-new-career');
  if (btnNewCareer) {
    btnNewCareer.addEventListener('click', () => {
      openIntroModal(true);
    });
  }

  const btnRecords = document.getElementById('btn-menu-records');
  if (btnRecords) {
    btnRecords.addEventListener('click', openRecordsModal);
  }

  const btnSettings = document.getElementById('btn-menu-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', openSettingsModal);
  }

  const btnHeaderSettings = document.getElementById('btn-header-settings');
  if (btnHeaderSettings) {
    btnHeaderSettings.addEventListener('click', openSettingsModal);
  }

  const btnReturnTitle = document.getElementById('btn-return-title');
  const handleReturnToTitle = () => {
    const ok = window.confirm('現在の進行状況を自動保存してタイトル画面へ戻りますか？');
    if (!ok) return;
    saveSettingsToStorage();
    closeSettingsModal();
    saveGameToStorage(true);
    showMainMenuScreen();
  };
  if (btnReturnTitle) {
    btnReturnTitle.addEventListener('click', handleReturnToTitle);
  }
  const btnSettingsReturn = document.getElementById('btn-settings-return-title');
  if (btnSettingsReturn) {
    btnSettingsReturn.addEventListener('click', handleReturnToTitle);
  }

  // Records modal close
  const btnCloseRec = document.getElementById('btn-close-records-modal');
  const btnCloseRecFooter = document.getElementById('btn-close-records-footer');
  if (btnCloseRec) btnCloseRec.addEventListener('click', closeRecordsModal);
  if (btnCloseRecFooter) btnCloseRecFooter.addEventListener('click', closeRecordsModal);

  // Settings modal controls
  const volInput = document.getElementById('setting-sound-volume');
  const volVal = document.getElementById('setting-sound-volume-val');
  if (volInput) {
    volInput.addEventListener('input', (e) => {
      appSettings.soundVolume = parseInt(e.target.value, 10) || 0;
      if (volVal) volVal.textContent = `${appSettings.soundVolume}%`;
      saveSettingsToStorage();
    });
  }

  const autoSaveCheck = document.getElementById('setting-autosave-enabled');
  if (autoSaveCheck) {
    autoSaveCheck.addEventListener('change', (e) => {
      appSettings.autoSaveEnabled = !!e.target.checked;
      saveSettingsToStorage();
    });
  }

  const speedSelect = document.getElementById('setting-match-speed');
  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      appSettings.matchSpeed = parseInt(e.target.value, 10) || 2;
      saveSettingsToStorage();
    });
  }

  const btnResetAll = document.getElementById('btn-reset-all-data');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      const ok = window.confirm('保存されているセーブデータおよび殿堂記録をすべて消去します。よろしいですか？');
      if (!ok) return;
      try {
        localStorage.removeItem(SAVE_STORAGE_KEY);
        localStorage.removeItem(RECORDS_STORAGE_KEY);
      } catch (e) {}
      updateContinueButtonUI();
      closeSettingsModal();
    });
  }

  const btnCloseSet = document.getElementById('btn-close-settings-modal');
  const btnCloseSetFooter = document.getElementById('btn-close-settings-footer');
  if (btnCloseSet) btnCloseSet.addEventListener('click', () => { saveSettingsToStorage(); closeSettingsModal(); });
  if (btnCloseSetFooter) btnCloseSetFooter.addEventListener('click', () => { saveSettingsToStorage(); closeSettingsModal(); });
}

/**
 * モバイルでのプルダウンリロード（Pull-to-refresh）防止および誤操作リロード防止
 * ※テーブルやカルーセル等の横スクロール・縦スクロール操作を絶対に阻害しない高精度判定
 */
function initReloadPrevention() {
  let touchStartX = 0;
  let touchStartY = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;

    // 開いているモーダル内部でのスクロール操作は一切邪魔せずブラウザ標準に委ねる
    const inOpenModal = e.target && e.target.closest && (
      e.target.closest('.modal-card, .modal-body, .profile-modal-card, .profile-modal-body, .coach-modal-body, .manager-modal-body, .negotiation-modal-body') ||
      e.target.closest('.modal-overlay:not(.hidden)')
    );
    if (inOpenModal) {
      return;
    }

    // モバイル作戦ボード（画面幅768px以下）表示時の縦スクロール完全遮断（控えトレイ・ベンチ外トレイの左右スワイプのみ許可）
    const isMobileRosterBoard = (window.innerWidth <= 768) && gameState.activeTab === 'roster' && (!gameState.rosterSubtab || gameState.rosterSubtab === 'board');
    if (isMobileRosterBoard) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const isSubOrReserveList = e.target && e.target.closest && (e.target.closest('.pitch-bench-list') || e.target.closest('.pitch-reserves-list'));
      if (isHorizontal && isSubOrReserveList) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
      return;
    }

    // 横方向へのスワイプ（テーブルやカルーセルの横スクロール等）は基本ブロックしない
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      // ただしテーブルが左端/右端に達した状態でさらに外側へ引っ張る操作は、
      // iOSのラバーバンド（バウンス）で固定列ごと表が横にずれるため遮断する
      const wrapper = e.target && e.target.closest ? e.target.closest('.table-wrapper') : null;
      if (wrapper && e.cancelable) {
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
        const atLeft = wrapper.scrollLeft <= 0;
        const atRight = wrapper.scrollLeft >= maxScroll - 1;
        if ((atLeft && deltaX > 0) || (atRight && deltaX < 0)) {
          e.preventDefault();
        }
      }
      return;
    }

    // 横スクロール可能なコンテナ（.table-wrapper や .pitch-bench-list など）内での操作は邪魔しない
    let target = e.target;
    while (target && target !== document.body && target !== document.documentElement) {
      if (target.classList && (target.classList.contains('table-wrapper') || target.classList.contains('pitch-bench-list'))) {
        return;
      }
      if (target.scrollWidth > target.clientWidth + 2) {
        const overflowX = window.getComputedStyle(target).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') {
          return;
        }
      }
      target = target.parentElement;
    }

    // ページの最上部で真下方向へスワイプしようとした場合のみ（ブラウザのプルリフレッシュ挙動を遮断）
    const isAtTop = (window.scrollY <= 0 && document.documentElement.scrollTop <= 0);

    if (isAtTop && deltaY > 8) {
      // 内部スクロール要素（モーダルなど）が途中でスクロールされているか確認
      let scrollTarget = e.target;
      let hasScrolledInternalElement = false;
      while (scrollTarget && scrollTarget !== document.body && scrollTarget !== document.documentElement) {
        if (scrollTarget.scrollHeight > scrollTarget.clientHeight) {
          const overflowY = window.getComputedStyle(scrollTarget).overflowY;
          if ((overflowY === 'auto' || overflowY === 'scroll') && scrollTarget.scrollTop > 0) {
            hasScrolledInternalElement = true;
            break;
          }
        }
        scrollTarget = scrollTarget.parentElement;
      }

      if (!hasScrolledInternalElement && e.cancelable) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  // テーブルの横スクロール位置が範囲外（iOSバウンスによる負値等）になった場合は即座に端へ戻す
  document.addEventListener('scroll', (e) => {
    const el = e.target;
    if (!el || !el.classList || !el.classList.contains('table-wrapper')) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft < 0) {
      el.scrollLeft = 0;
    } else if (el.scrollLeft > maxScroll) {
      el.scrollLeft = maxScroll;
    }
  }, { passive: true, capture: true });

  window.addEventListener('scroll', () => {
    // モバイル作戦ボード（画面幅768px以下）でのみ予期せぬスクロールズレを防止（PC環境では通常の縦スクロールを完全に許可）
    if (window.innerWidth <= 768 && gameState.activeTab === 'roster' && (!gameState.rosterSubtab || gameState.rosterSubtab === 'board')) {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    }
  }, { passive: true });

  // 誤リロード・誤離脱時の確認ダイアログ
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
    return '';
  });

  // リロードキーショートカット（F5, Ctrl+R, Cmd+R）のブロック
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
      e.preventDefault();
    }
  });

  // モバイルでのダブルタップズーム防止（touchend / dblclick）
  let lastTouchEndTime = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEndTime <= 300) {
      const tag = e.target ? e.target.tagName : '';
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (!isInput && e.cancelable) {
        e.preventDefault();
        // 通常のボタン・リンク・クリック可能要素の連打タップは遮断せず発火
        const clickable = e.target.closest('button, a, .btn, [role="button"], input[type="button"], input[type="submit"]');
        if (clickable) {
          clickable.click();
        }
      }
    }
    lastTouchEndTime = now;
  }, { passive: false });

  // dblclick イベントのブラウザズーム抑止
  document.addEventListener('dblclick', (e) => {
    const tag = e.target ? e.target.tagName : '';
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });

  // iOS Safari のピンチズームジェスチャー抑止（gesturestart / gesturechange / gestureend）
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
  });
}

document.addEventListener('DOMContentLoaded', initGame);

/**
 * 作戦ボード（ピッチ）上部の監督哲学・ステータスバナーを描画
 */
function renderTacticalManagerBanner() {
  const container = document.getElementById('tactical-manager-banner');
  if (!container) return;
  const club = getPlayerClub();
  if (!club) return;

  if (!club.manager) {
    container.innerHTML = `
      <div class="manager-banner-inner" style="justify-content: center;">
        <span class="text-danger mono font-bold">[監督空席] 経営タブの「監督人事」から後任監督を招聘してください</span>
      </div>
    `;
    return;
  }

  const mgr = club.manager;
  const isFormMatch = club.formation === mgr.preferredFormation;
  const isTacticMatch = normalizeTacticKey(club.tactic) === normalizeTacticKey(mgr.preferredTactic);
  const tacticLabel = getManagerTacticLabel(mgr.preferredTactic);

  const formTag = isFormMatch
    ? `<span class="mgr-tag match">[陣形一致 +1]</span>`
    : `<span class="mgr-tag unmatch">[陣形不一致]</span>`;
  const tacticTag = isTacticMatch
    ? `<span class="mgr-tag match">[戦術一致 +1]</span>`
    : `<span class="mgr-tag unmatch">[戦術不一致]</span>`;

  let totalBonus = 0;
  if (isFormMatch) totalBonus += 1;
  if (isTacticMatch) totalBonus += 1;
  const bonusTag = totalBonus > 0
    ? `<span class="mgr-tag bonus">[組織力ボーナス: 実効OVR +${totalBonus}]</span>`
    : `<span class="mgr-tag none">[組織力ボーナス: なし]</span>`;

  const avatarHtml = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(mgr, 'avatar-xs', 32) : '';

  container.innerHTML = `
    <div class="manager-banner-inner">
      <div class="manager-banner-left">
        <div class="manager-avatar-wrap">
          ${avatarHtml}
        </div>
        <div class="manager-banner-info">
          <div class="manager-banner-title">
            <span class="text-muted">監督:</span>
            <strong class="manager-name">${mgr.name}</strong>
            <span class="manager-trust-label mono">[信頼度 ${mgr.trust}%]</span>
          </div>
          <div class="manager-banner-style mono">
            得意: ${mgr.preferredFormation} / ${tacticLabel}
          </div>
        </div>
      </div>
      <div class="manager-banner-tags mono">
        ${formTag}
        ${tacticTag}
        ${bonusTag}
      </div>
    </div>
  `;
}

/**
 * 経営タブの「監督人事」パネルを描画
 */
function renderManagerManagementPanel() {
  const container = document.getElementById('manager-panel-body');
  if (!container) return;
  const club = getPlayerClub();
  if (!club) return;

  const trustEl = document.getElementById('manager-panel-trust');
  const wageEl = document.getElementById('manager-panel-wage');

  const mgr = club.manager;
  if (trustEl) trustEl.textContent = mgr ? `${mgr.trust}%` : '---';
  if (wageEl) wageEl.textContent = mgr ? `£${mgr.weeklyWage}k/週` : '£0';

  let currentCardHtml = '';
  if (mgr) {
    const buyoutFee = getManagerBuyoutFee(mgr);
    const tacticLabel = getManagerTacticLabel(mgr.preferredTactic);
    const avatarHtml = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(mgr, 'avatar-sm', 48) : '';

    currentCardHtml = `
      <div class="manager-current-card">
        <div class="manager-current-main">
          <div class="manager-current-avatar">
            ${avatarHtml}
          </div>
          <div class="manager-current-info">
            <div class="manager-current-name">
              ${mgr.name}
              
              <span class="mono text-muted" style="font-size: 11px;">(${mgr.nationality} / ${mgr.age}歳)</span>
            </div>
            <div class="manager-current-meta mono">
              <span>得意陣形: <strong class="accent-green">${mgr.preferredFormation}</strong></span>
              <span>得意戦術: <strong class="accent-green">${tacticLabel}</strong></span>
              <span>契約残り: <strong>${mgr.contractYears}年</strong></span>
              <span>週給: <strong class="accent-gold">£${mgr.weeklyWage}k</strong> (年俸 £${Math.round(mgr.weeklyWage * 5.2) / 10}M)</span>
            </div>
            <div class="manager-current-bio">
              ${mgr.bio}
            </div>
          </div>
        </div>
        <div class="manager-current-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary mono" id="btn-open-change-manager" style="font-weight: 700; padding: 10px 18px;">
            監督を交代する [前任違約金 £${buyoutFee.toLocaleString()}k]
          </button>
        </div>
      </div>
    `;
  } else {
    currentCardHtml = `
      <div class="manager-current-card" style="border-color: rgba(231, 76, 60, 0.4); justify-content: center; padding: 24px; text-align: center;">
        <div class="mono text-danger font-bold" style="font-size: 14px; margin-bottom: 12px;">
          現在、監督が不在（空席）です。後任監督をスカウトして新監督を招聘してください。
        </div>
        <div>
          <button type="button" class="btn btn-primary mono" id="btn-open-change-manager" style="font-weight: 700; padding: 10px 24px; font-size: 14px;">
            新監督を招聘する
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = currentCardHtml;

  // イベント登録：「監督を交代する」ボタンで後任選択モーダルを開く
  const changeBtn = document.getElementById('btn-open-change-manager');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      openManagerHireModal();
    });
  }
}

/**
 * 監督交代・後任スカウトモーダルを開く
 */
function openManagerHireModal() {
  const modal = document.getElementById('manager-hire-modal');
  const body = document.getElementById('manager-modal-body');
  const titleEl = document.getElementById('manager-modal-title');
  if (!modal || !body) return;

  const club = getPlayerClub();
  const currentMgr = club ? club.manager : null;
  const buyoutFee = currentMgr ? getManagerBuyoutFee(currentMgr) : 0;

  if (titleEl) {
    titleEl.textContent = currentMgr ? '監督交代・後任スカウト' : '新監督招聘・スカウト';
  }

  const freeList = gameState.freeManagers || [];
  if (freeList.length === 0) {
    body.innerHTML = `
      <div class="mono text-muted" style="padding: 30px 20px; text-align: center;">
        現在スカウト可能なフリー監督候補がいません。
      </div>
    `;
  } else {
    let noteHtml = '';
    if (currentMgr) {
      noteHtml = `
        <div class="mono" style="background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 4px; padding: 10px 14px; font-size: 12px; color: #ff7675; line-height: 1.5;">
          後任監督を選択すると、現監督（<strong>${currentMgr.name}</strong>）を解任して新監督として就任します。<br>
          ※解任違約金 <strong>£${buyoutFee.toLocaleString()}k</strong> がクラブ資金から引き落とされます。
        </div>
      `;
    } else {
      noteHtml = `
        <div class="mono" style="background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); border-radius: 4px; padding: 10px 14px; font-size: 12px; color: var(--accent-green); line-height: 1.5;">
          新監督を選択して契約締結（契約期間: 3年）を行います。
        </div>
      `;
    }

    const cardsHtml = `
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
        ${freeList.map(cand => {
          const tacticLabel = getManagerTacticLabel(cand.preferredTactic);
          const cAvatar = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(cand, 'avatar-xs', 44) : '';
          return `
            <div class="manager-candidate-card" style="margin: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 12px;">
              <div>
                <div class="candidate-head" style="display: flex; align-items: center; gap: 12px;">
                  <div class="candidate-avatar">
                    ${cAvatar}
                  </div>
                  <div>
                    <div class="candidate-info-name" style="font-weight: 700; font-size: 14px;">${cand.name}</div>
                    <div class="candidate-info-meta mono text-muted" style="font-size: 11px;">${cand.nationality} / ${cand.age}歳</div>
                  </div>
                </div>
                <div class="candidate-body mono" style="margin-top: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
                  <div class="candidate-style-row" style="display: flex; justify-content: space-between;">
                    <span class="text-muted">得意陣形:</span>
                    <strong class="accent-green">${cand.preferredFormation}</strong>
                  </div>
                  <div class="candidate-style-row" style="display: flex; justify-content: space-between;">
                    <span class="text-muted">得意戦術:</span>
                    <strong class="accent-green">${tacticLabel}</strong>
                  </div>
                  <div class="candidate-style-row" style="display: flex; justify-content: space-between;">
                    <span class="text-muted">要求週給:</span>
                    <strong class="accent-gold">£${cand.weeklyWage}k/週</strong>
                  </div>
                  <div class="candidate-bio text-muted" style="margin-top: 6px; font-size: 11px; line-height: 1.4;">
                    ${cand.bio}
                  </div>
                </div>
              </div>
              <div class="candidate-actions" style="margin-top: 12px; text-align: right;">
                <button type="button" class="btn btn-hire-manager mono" data-manager-id="${cand.id}" style="width: 100%; font-weight: 700; padding: 8px 12px;">
                  ${currentMgr ? 'この監督を選んで交代する' : '新監督として招聘する'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    body.innerHTML = noteHtml + cardsHtml;

    // 各監督の招聘ボタンにイベントを登録
    body.querySelectorAll('.btn-hire-manager').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mid = e.currentTarget.dataset.managerId;
        if (mid) {
          const success = hireNewManager(mid);
          if (success) {
            closeManagerHireModal();
          }
        }
      });
    });
  }

  modal.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 監督交代・後任スカウトモーダルを閉じる
 */
function closeManagerHireModal() {
  const modal = document.getElementById('manager-hire-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
}

/**
 * 監督を解任する
 */
function sackCurrentManager() {
  const club = getPlayerClub();
  if (!club || !club.manager) return false;
  const fee = getManagerBuyoutFee(club.manager);
  if (club.funds < fee) {
    alert(`資金不足です。解任違約金 £${fee.toLocaleString()}k を支払えません。`);
    return false;
  }
  if (!confirm(`${club.manager.name}監督を解任しますか？\n解任違約金 £${fee.toLocaleString()}k がクラブ資金から引き落とされます。`)) {
    return false;
  }
  club.funds -= fee;
  const sacked = club.manager;
  club.manager = null;
  sacked.trust = 70;
  if (!gameState.freeManagers) gameState.freeManagers = [];
  gameState.freeManagers.push(sacked);

  addDailyLog(`[監督人事] ${sacked.name}監督を解任しました（違約金: £${fee.toLocaleString()}k）`);
  renderAll();
  return true;
}

/**
 * 後任監督を招聘する
 */
function hireNewManager(managerId) {
  const club = getPlayerClub();
  if (!club) return false;
  const idx = (gameState.freeManagers || []).findIndex(m => m.id === managerId);
  if (idx === -1) return false;

  const newMgr = gameState.freeManagers[idx];
  const oldMgr = club.manager;
  let buyoutMsg = '';

  if (oldMgr) {
    const fee = getManagerBuyoutFee(oldMgr);
    if (club.funds < fee) {
      alert(`資金不足です。現任監督の解任違約金 £${fee.toLocaleString()}k を支払えません。`);
      return false;
    }
    const ok = window.confirm(`${oldMgr.name}監督を解任し、${newMgr.name}氏を新監督として招聘しますか？\n（前任違約金: £${fee.toLocaleString()}k / 新監督週給: £${newMgr.weeklyWage}k）`);
    if (!ok) return false;

    gameState.freeManagers.splice(idx, 1);
    club.funds -= fee;
    oldMgr.trust = 70;
    gameState.freeManagers.push(oldMgr);
    buyoutMsg = `（前任違約金 £${fee.toLocaleString()}k 支払）`;
  } else {
    const ok = window.confirm(`${newMgr.name}氏を新監督として招聘しますか？\n（契約期間: 3年 / 週給: £${newMgr.weeklyWage}k）`);
    if (!ok) return false;
    gameState.freeManagers.splice(idx, 1);
  }

  newMgr.trust = 80;
  newMgr.contractYears = 3;
  club.manager = newMgr;

  // 新監督の得意陣形・戦術に初期同期
  club.formation = newMgr.preferredFormation;
  club.tactic = normalizeTacticKey(newMgr.preferredTactic);
  if (typeof assignStartersToFormationSlots === 'function') {
    assignStartersToFormationSlots(club, true);
  }

  const tacticLabel = getManagerTacticLabel(newMgr.preferredTactic);
  addDailyLog(`[監督人事] ${newMgr.name}監督が新監督として就任しました ${buyoutMsg}（得意: ${newMgr.preferredFormation} / ${tacticLabel}）`);
  renderAll();
  return true;
}


/**
 * 経営タブの「指導陣（COACHING STAFF / 全6枠）」パネルを描画
 */
function renderCoachingStaffPanel() {
  const container = document.getElementById('coach-panel-body');
  if (!container) return;
  const club = getPlayerClub();
  if (!club) return;
  ensureClubCoaches(club);

  const coaches = club.coaches;
  const countEl = document.getElementById('coach-panel-count');
  const wageEl = document.getElementById('coach-panel-wage');

  // 体制数カウント（最大6）
  let totalHired = 0;
  if (Array.isArray(coaches.attacking)) totalHired += coaches.attacking.length;
  if (Array.isArray(coaches.defending)) totalHired += coaches.defending.length;
  if (coaches.goalkeeping) totalHired += 1;
  if (coaches.fitness) totalHired += 1;

  const totalWage = getClubCoachingStaffWeeklyWage(club);

  if (countEl) countEl.textContent = `${totalHired} / 6枠`;
  if (wageEl) wageEl.textContent = `£${totalWage}k/週`;

  // 全6スロットの定義（オフェンス2、ディフェンス2、GK1、フィジカル1）
  const slotsConfig = [
    { category: 'attacking', roleLabel: 'オフェンス', index: 0, coach: (coaches.attacking || [])[0] || null, effectDesc: 'FW/WG/AM決定機創出・攻撃成長UP' },
    { category: 'attacking', roleLabel: 'オフェンス', index: 1, coach: (coaches.attacking || [])[1] || null, effectDesc: 'FW/WG/AM決定機創出・攻撃成長UP' },
    { category: 'defending', roleLabel: 'ディフェンス', index: 0, coach: (coaches.defending || [])[0] || null, effectDesc: 'DF/DM被決定機抑制・守備成長UP' },
    { category: 'defending', roleLabel: 'ディフェンス', index: 1, coach: (coaches.defending || [])[1] || null, effectDesc: 'DF/DM被決定機抑制・守備成長UP' },
    { category: 'goalkeeping', roleLabel: 'GK', index: 0, coach: coaches.goalkeeping || null, effectDesc: 'GKセービング率向上・守備成長UP' },
    { category: 'fitness', roleLabel: 'フィジカル', index: 0, coach: coaches.fitness || null, effectDesc: '全選手スタミナ消耗＆負傷カット・回復促進' }
  ];

  let slotsHtml = slotsConfig.map((slot) => {
    const c = slot.coach;
    const catClass = `tag-${slot.category}`;
    if (c) {
      const rankClass = `rank-${(c.rank || 'B').toLowerCase()}`;
      const avatarHtml = typeof getCoachAvatarHtml === 'function' ? getCoachAvatarHtml(c, 'avatar-xs', 36) : '';
      return `
        <div class="coach-slot-card occupied">
          <div class="coach-slot-head">
            <span class="coach-role-tag ${catClass} mono">[${slot.roleLabel}]</span>
            <span class="coach-rank-badge ${rankClass} mono">RANK ${c.rank}</span>
          </div>
          <div class="coach-slot-main">
            <div class="coach-avatar-wrap">
              ${avatarHtml}
            </div>
            <div class="coach-info">
              <div class="coach-name font-bold">${c.name}</div>
              <div class="coach-wage-meta mono">
                <span class="accent-gold font-bold">£${c.weeklyWage}k/週</span>
                <span class="text-muted">(${c.nationality}/${c.age}歳)</span>
              </div>
              <div class="coach-effect-note mono">${slot.effectDesc}</div>
            </div>
          </div>
          <div class="coach-slot-actions">
            <button type="button" class="btn btn-secondary btn-sm mono btn-replace-coach" data-category="${slot.category}" data-index="${slot.index}">交代</button>
            <button type="button" class="btn btn-danger-outline btn-sm mono btn-sack-coach" data-category="${slot.category}" data-index="${slot.index}">解任</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="coach-slot-card vacant">
          <div class="coach-slot-head" style="width: 100%;">
            <span class="coach-role-tag ${catClass} mono text-muted">[${slot.roleLabel} (空席)]</span>
          </div>
          <div style="margin: 8px 0; font-size: 11px;" class="text-muted mono">${slot.effectDesc}</div>
          <button type="button" class="btn btn-hire-coach-slot mono" data-category="${slot.category}" data-index="${slot.index}">
            ＋ コーチを招聘
          </button>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `<div class="coaching-slots-grid">${slotsHtml}</div>`;

  // イベント登録
  container.querySelectorAll('.btn-hire-coach-slot, .btn-replace-coach').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      openCoachHireModal(cat, idx);
    });
  });

  container.querySelectorAll('.btn-sack-coach').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      sackCoach(cat, idx);
    });
  });
}

function openCoachHireModal(category, slotIndex) {
  const modal = document.getElementById('coach-hire-modal');
  const body = document.getElementById('coach-modal-body');
  const title = document.getElementById('coach-modal-title');
  const tag = document.getElementById('coach-modal-tag');
  if (!modal || !body) return;

  const roleLabels = { attacking: 'オフェンス', defending: 'ディフェンス', goalkeeping: 'GK', fitness: 'フィジカル' };
  const label = roleLabels[category] || category;

  if (title) title.textContent = `[${label}コーチ] 招聘・交代`;
  if (tag) tag.textContent = `[${label.toUpperCase()} COACH]`;

  if (!gameState.freeCoaches) gameState.freeCoaches = {};
  if (!Array.isArray(gameState.freeCoaches[category])) {
    gameState.freeCoaches[category] = (COACHES_DATABASE[category] || []).slice(1).map(d => createCoach(d, category));
  }

  const list = gameState.freeCoaches[category];
  if (list.length === 0) {
    body.innerHTML = `
      <div class="mono text-muted text-center" style="padding: 24px;">
        現在、招聘可能なフリーの${label}コーチ候補がいません。
      </div>
    `;
  } else {
    body.innerHTML = list.map(c => {
      const rankClass = `rank-${(c.rank || 'B').toLowerCase()}`;
      const avatarHtml = typeof getCoachAvatarHtml === 'function' ? getCoachAvatarHtml(c, 'avatar-xs', 36) : '';
      return `
        <div class="coach-candidate-card">
          <div class="coach-cand-left">
            <div class="coach-avatar-wrap">
              ${avatarHtml}
            </div>
            <div class="coach-cand-info">
              <div class="coach-cand-name-row">
                <strong class="coach-name">${c.name}</strong>
                <span class="coach-rank-badge ${rankClass} mono">RANK ${c.rank}</span>
                <span class="accent-gold mono" style="font-size: 11px;">£${c.weeklyWage}k/週</span>
              </div>
              <div class="coach-cand-meta mono text-muted" style="font-size: 10px;">
                ${c.nationality} / ${c.age}歳
              </div>
              <div class="coach-cand-bio">${c.bio}</div>
            </div>
          </div>
          <div>
            <button type="button" class="btn btn-sign-coach mono" data-coach-id="${c.id}" data-category="${category}" data-index="${slotIndex}">
              契約する
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');

  // 契約ボタンイベント
  body.querySelectorAll('.btn-sign-coach').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cid = e.currentTarget.dataset.coachId;
      const cat = e.currentTarget.dataset.category;
      const sIdx = parseInt(e.currentTarget.dataset.index, 10);
      hireCoach(cat, sIdx, cid);
      closeCoachHireModal();
    });
  });
}

function closeCoachHireModal() {
  const modal = document.getElementById('coach-hire-modal');
  if (modal) modal.classList.add('hidden');
}

function hireCoach(category, slotIndex, coachId) {
  const club = getPlayerClub();
  if (!club) return;
  ensureClubCoaches(club);

  if (!gameState.freeCoaches || !Array.isArray(gameState.freeCoaches[category])) return;
  const cIdx = gameState.freeCoaches[category].findIndex(c => c.id === coachId);
  if (cIdx === -1) return;

  const newCoach = gameState.freeCoaches[category].splice(cIdx, 1)[0];

  let oldCoach = null;
  if (category === 'attacking' || category === 'defending') {
    if (club.coaches[category][slotIndex]) {
      oldCoach = club.coaches[category][slotIndex];
      club.coaches[category][slotIndex] = newCoach;
    } else {
      club.coaches[category].push(newCoach);
    }
  } else {
    oldCoach = club.coaches[category];
    club.coaches[category] = newCoach;
  }

  if (oldCoach) {
    gameState.freeCoaches[category].push(oldCoach);
    addDailyLog(`[指導陣交代] ${oldCoach.name}コーチとの契約を終了し、${newCoach.name}コーチ（RANK ${newCoach.rank}）と新規契約しました（週給: £${newCoach.weeklyWage}k）`);
  } else {
    addDailyLog(`[指導陣招聘] ${newCoach.name}コーチ（${newCoach.roleLabel} / RANK ${newCoach.rank}）と新規契約しました（週給: £${newCoach.weeklyWage}k）`);
  }

  renderAll();
}

function sackCoach(category, slotIndex) {
  const club = getPlayerClub();
  if (!club) return;
  ensureClubCoaches(club);

  let targetCoach = null;
  if (category === 'attacking' || category === 'defending') {
    targetCoach = club.coaches[category][slotIndex];
    if (!targetCoach) return;
    if (!confirm(`${targetCoach.name}コーチ（${targetCoach.roleLabel}）を解任しますか？`)) return;
    club.coaches[category].splice(slotIndex, 1);
  } else {
    targetCoach = club.coaches[category];
    if (!targetCoach) return;
    if (!confirm(`${targetCoach.name}コーチ（${targetCoach.roleLabel}）を解任しますか？`)) return;
    club.coaches[category] = null;
  }

  if (!gameState.freeCoaches) gameState.freeCoaches = {};
  if (!Array.isArray(gameState.freeCoaches[category])) gameState.freeCoaches[category] = [];
  gameState.freeCoaches[category].push(targetCoach);

  addDailyLog(`[指導陣解任] ${targetCoach.name}コーチ（${targetCoach.roleLabel}）を解任しました。`);
  renderAll();
}

/**
 * プレシーズン開幕前：指導陣編成モーダル（監督・初期コーチ選定）を開く
 */
function openInitialStaffSetupModal(club) {
  const modal = document.getElementById('initial-staff-setup-modal');
  const body = document.getElementById('staff-setup-body');
  const confirmBtn = document.getElementById('btn-confirm-initial-staff');
  if (!modal || !body) return;

  const usedNames = new Set();
  (club.players || []).forEach(p => { usedNames.add(p.name); });

  // 異なる戦術・得意陣形を持つ監督候補3名を動的生成
  const candidateTactics = [
    { formation: '4-3-3', tactic: 'gegenpress', label: 'ゲーゲンプレス' },
    { formation: '4-2-3-1', tactic: 'possession', label: 'ポゼッション' },
    { formation: '3-5-2', tactic: 'counter', label: 'カウンター' }
  ];

  const managerCandidates = candidateTactics.map((cfg, i) => {
    const nat = ['England', 'Germany', 'Spain', 'Italy', 'Netherlands'][i % 5];
    const nameData = typeof generateRandomStaffName === 'function'
      ? generateRandomStaffName(nat, usedNames)
      : { displayName: 'M. Keller', fullName: 'Markus Keller' };
    const name = nameData.displayName || nameData.name || 'M. Keller';
    const fullName = nameData.fullName || name;
    const wage = 60 + i * 15;
    return {
      id: `mgr_init_${i}`,
      name: name,
      fullName: fullName,
      nationality: nat,
      age: 44 + i * 4,
      preferredFormation: cfg.formation,
      preferredTactic: cfg.tactic,
      tacticLabel: cfg.label,
      weeklyWage: wage,
      trust: 85,
      contractYears: 3
    };
  });

  // 初期コーチ陣（4枠：オフェンス1、ディフェンス1、GK1、フィジカル1）
  const initialCoaches = createInitialCoaches(true);

  // モーダル内ステート
  window._preseasonStaffSetup = {
    selectedManagerIdx: 0,
    candidates: managerCandidates,
    coaches: initialCoaches,
    club: club
  };

  const renderModalContent = () => {
    const state = window._preseasonStaffSetup;
    const managersHtml = state.candidates.map((m, idx) => {
      const isSelected = idx === state.selectedManagerIdx;
      const avatarHtml = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(m, 'avatar-sm', 48) : '';
      return `
        <div class="staff-candidate-card ${isSelected ? 'selected' : ''}" data-mgr-index="${idx}" style="cursor: pointer; padding: 12px; border-radius: 6px; border: 1.5px solid ${isSelected ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}; background: ${isSelected ? 'rgba(46,204,113,0.08)' : 'rgba(255,255,255,0.02)'}; display: flex; align-items: center; gap: 12px; transition: border-color 0.15s, background 0.15s;">
          <input type="radio" name="manager-candidate-radio" ${isSelected ? 'checked' : ''} style="margin: 0; pointer-events: none;">
          <div class="staff-avatar-wrap" style="flex-shrink: 0;">${avatarHtml}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span class="font-bold" style="font-size: 14px; color: ${isSelected ? 'var(--accent-green)' : 'var(--text-main)'};">${m.name} 監督</span>
              <span class="mono accent-gold font-bold" style="font-size: 12px;">£${m.weeklyWage}k/週</span>
            </div>
            <div class="mono text-muted" style="font-size: 11px; margin-top: 3px;">${m.nationality} / ${m.age}歳 / 契約3年</div>
            <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
              <span class="badge mono" style="font-size: 10px; background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4);">得意: ${m.preferredFormation}</span>
              <span class="badge mono" style="font-size: 10px; background: rgba(46,204,113,0.15); color: #2ecc71; border: 1px solid rgba(46,204,113,0.4);">哲学: ${m.tacticLabel}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const coachSlots = [
      { cat: 'attacking', role: 'オフェンス', c: (state.coaches.attacking || [])[0] },
      { cat: 'defending', role: 'ディフェンス', c: (state.coaches.defending || [])[0] },
      { cat: 'goalkeeping', role: 'GK', c: state.coaches.goalkeeping },
      { cat: 'fitness', role: 'フィジカル', c: state.coaches.fitness }
    ];

    const coachesHtml = coachSlots.map(slot => {
      const c = slot.c;
      const avatarHtml = c && typeof getCoachAvatarHtml === 'function' ? getCoachAvatarHtml(c, 'avatar-xs', 36) : '';
      return `
        <div style="padding: 8px 10px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;">
          <div style="flex-shrink: 0;">${avatarHtml}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span class="mono text-muted" style="font-size: 10px;">[${slot.role}]</span>
              <span class="mono font-bold" style="font-size: 10px; color: var(--accent-green);">RANK ${c ? c.rank : 'B'}</span>
            </div>
            <div class="font-bold" style="font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c ? c.name : '未定'}</div>
            <div class="mono accent-gold" style="font-size: 10px;">£${c ? c.weeklyWage : 25}k/週</div>
          </div>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div class="mono text-muted" style="font-size: 11px; margin-bottom: 6px;">[STEP 1] HEAD COACH SELECTION / 監督選任</div>
        <p style="font-size: 12px; line-height: 1.5; margin: 0 0 10px 0; color: var(--text-main);">
          新シーズンの開幕に向け、チームの戦術方針を担う監督を以下の候補者から選任してください。選任した監督の得意陣形・戦術スタイルがチームの初期哲学となります。
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${managersHtml}
        </div>
      </div>

      <div style="margin-bottom: 8px;">
        <div class="mono text-muted" style="font-size: 11px; margin-bottom: 6px;">[STEP 2] TECHNICAL COACHING STAFF / 初期コーチ体制の確認</div>
        <p style="font-size: 11px; line-height: 1.4; margin: 0 0 8px 0; color: var(--text-muted);">
          指導陣各部門（攻撃、守備、GK、フィジカル）の初期スタッフです。開幕後の「経営」タブより最大6枠まで追加招聘や交代が可能です。
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">
          ${coachesHtml}
        </div>
      </div>
    `;

    body.querySelectorAll('.staff-candidate-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.mgrIndex, 10);
        window._preseasonStaffSetup.selectedManagerIdx = idx;
        renderModalContent();
      });
    });
  };

  renderModalContent();

  modal.classList.remove('hidden');
  setBodyModalLock(true);

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const state = window._preseasonStaffSetup;
      const selectedMgr = state.candidates[state.selectedManagerIdx];
      const playerClub = club || getPlayerClub();
      if (playerClub && selectedMgr) {
        playerClub.manager = selectedMgr;
        playerClub.formation = selectedMgr.preferredFormation;
        playerClub.tactic = selectedMgr.preferredTactic;
        playerClub.coaches = state.coaches;
        optimizeClubStarters(playerClub);
        addDailyLog(`[PRE-SEASON] ${selectedMgr.name} 監督が就任し、新シーズン指導体制が発足しました（得意: ${selectedMgr.preferredFormation} / ${selectedMgr.tacticLabel}）。`);
        addDailyLog(`[PRE-SEASON] 7月1日よりプレシーズンおよび夏の移籍市場が開幕しました。`);
      }
      modal.classList.add('hidden');
      setBodyModalLock(false);
      renderAll();
      if (typeof saveGameToStorage === 'function') {
        saveGameToStorage(true);
      }
    };
  }
}

/**
 * チームタブ内のサブタブ切り替え（順位表 / 日程・結果 / 個人スタッツ）
 * @param {string} subtabKey 'standings' | 'schedule' | 'stats'
 */
function switchTeamSubtab(subtabKey) {
  if (!subtabKey) subtabKey = 'standings';
  gameState.teamSubtab = subtabKey;
  const viewTeam = document.getElementById('view-team');
  if (viewTeam) {
    viewTeam.setAttribute('data-team-subtab', subtabKey);
  }
  document.body.setAttribute('data-team-subtab', subtabKey);
  document.documentElement.setAttribute('data-team-subtab', subtabKey);

  // サブタブボタンのアクティブ状態更新
  const btns = document.querySelectorAll('#team-subnav-bar .roster-subtab-btn');
  btns.forEach(btn => {
    const isAct = btn.dataset.teamSubtab === subtabKey;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // サブビューの表示切り替え
  const subviews = {
    standings: document.getElementById('team-subview-standings'),
    schedule: document.getElementById('team-subview-schedule'),
    stats: document.getElementById('team-subview-stats')
  };

  Object.keys(subviews).forEach(key => {
    const el = subviews[key];
    if (el) {
      el.classList.toggle('hidden', key !== subtabKey);
    }
  });

  if (subtabKey === 'standings') {
    renderStandings();
  } else if (subtabKey === 'schedule') {
    renderScheduleView();
  } else if (subtabKey === 'stats') {
    renderTopScorers();
  }
}

/**
 * シーズン全38節の日程・試合結果一覧の描画
 */
function renderSeasonSchedule() {
  const container = document.getElementById('season-schedule-list');
  if (!container) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.schedule || gameState.schedule.length === 0) {
    container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">日程データがありません。</div>';
    return;
  }

  // カレンダーの日程マッピング（第1節〜第38節）
  const matchDays = (gameState.calendar || []).filter(d => d.isMatchDay);

  let playedCount = 0;
  let wonCount = 0;
  let drawnCount = 0;
  let lostCount = 0;

  let lastMonth = null;
  const cardsHtml = [];

  for (let weekIdx = 0; weekIdx < gameState.schedule.length; weekIdx++) {
    const weekNum = weekIdx + 1;
    const weekMatches = gameState.schedule[weekIdx];
    const match = weekMatches.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    if (!match) continue;

    const isHome = match.homeId === playerClub.id;
    const oppId = isHome ? match.awayId : match.homeId;
    const oppClub = getClubById(oppId) || { name: oppId, shortName: oppId };

    // 対応するカレンダー日付情報
    const dayInfo = matchDays[weekIdx] || null;
    let dateStr = `${weekNum}節`;
    let monthNum = null;
    if (dayInfo) {
      dateStr = `${dayInfo.month}月${dayInfo.day}日 (${dayInfo.dayOfWeekName})`;
      monthNum = dayInfo.month;
    }

    // 月の区切りヘッダーの挿入
    if (monthNum && monthNum !== lastMonth) {
      lastMonth = monthNum;
      let monthComment = '';
      if (monthNum === 8) monthComment = '開幕節 / 夏の移籍市場中';
      else if (monthNum === 9) monthComment = '夏の移籍市場閉幕 (9/1)';
      else if (monthNum === 1) monthComment = '冬の移籍市場OPEN (1/1〜1/31)';
      else if (monthNum === 5) monthComment = 'シーズン最終節 (MATCHWEEK 38)';

      cardsHtml.push(`
        <div class="schedule-month-divider">
          <span>${dayInfo ? `${dayInfo.year}年 ` : ''}${monthNum}月</span>
          ${monthComment ? `<span class="schedule-month-badge mono">${monthComment}</span>` : ''}
        </div>
      `);
    }

    const isPlayed = match.played || (weekNum <= gameState.currentWeek && match.homeScore !== null);
    const isNext = !isPlayed && (weekNum === gameState.currentWeek + 1);

    let statusColHtml = '';
    let cardClass = 'schedule-fixture-card';

    if (isPlayed) {
      playedCount++;
      cardClass += ' fixture-played';
      const myScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;

      let resClass = 'result-draw';
      let resLabel = 'DRAW';
      if (myScore > oppScore) {
        resClass = 'result-win';
        resLabel = 'WIN';
        wonCount++;
      } else if (myScore < oppScore) {
        resClass = 'result-lose';
        resLabel = 'LOSE';
        lostCount++;
      } else {
        drawnCount++;
      }

      statusColHtml = `
        <div class="fixture-right-col">
          <span class="fixture-result-badge ${resClass}">${resLabel}</span>
          <span class="fixture-score-text">${match.homeScore} - ${match.awayScore}</span>
          <span class="fixture-replay-hint mono">サマリー ➔</span>
        </div>
      `;
    } else if (isNext) {
      cardClass += ' fixture-next';
      statusColHtml = `
        <div class="fixture-right-col">
          <span class="fixture-next-badge">NEXT</span>
        </div>
      `;
    } else {
      statusColHtml = `
        <div class="fixture-right-col">
          <span class="fixture-unplayed-badge mono">未消化</span>
        </div>
      `;
    }

    cardsHtml.push(`
      <div class="${cardClass}" ${isPlayed ? `data-past-match-week="${weekNum}"` : `data-pending-match-week="${weekNum}"`} role="button" tabindex="0" title="${isPlayed ? `第${weekNum}節のサマリー詳細を見る` : `第${weekNum}節の対戦スカウティングを見る`}">
        <div class="fixture-left-col">
          <span class="fixture-round-badge">第${weekNum}節</span>
          <span class="fixture-date-badge">${dateStr}</span>
          <span class="fixture-venue-badge ${isHome ? 'fixture-venue-home' : 'fixture-venue-away'}">${isHome ? 'HOME' : 'AWAY'}</span>
          <span class="fixture-opponent-name" style="display:inline-flex;align-items:center;gap:6px;">vs ${getClubEmblemSvg(oppClub, 18, 'fixture-opp-emblem')}<span class="mono" style="font-weight:700;">${getClubShortCode(oppClub)}</span></span>
        </div>
        ${statusColHtml}
      </div>
    `);
  }

  container.innerHTML = cardsHtml.join('');

  // 上部バッジ更新
  const playedCountEl = document.getElementById('schedule-played-count');
  if (playedCountEl) playedCountEl.textContent = `${playedCount} / 38節`;
  const recordEl = document.getElementById('schedule-record-badge');
  if (recordEl) recordEl.textContent = `${wonCount}勝 ${drawnCount}分 ${lostCount}敗`;
}

/**
 * 消化済み試合のマッチサマリー振り返りモーダルを開く
 * @param {number} weekNum 第何節か（1〜38）
 */
function openPastMatchSummaryModal(weekNum) {
  const modal = document.getElementById('past-match-modal');
  const body = document.getElementById('past-match-modal-body');
  const title = document.getElementById('past-match-modal-title');
  if (!modal || !body) return;

  const playerClub = getPlayerClub();
  let matchData = null;
  if (gameState.matchHistory) {
    matchData = gameState.matchHistory.find(m => m.week === weekNum);
  }
  if (!matchData && gameState.schedule && gameState.schedule[weekNum - 1]) {
    const rawMatch = gameState.schedule[weekNum - 1].find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    if (rawMatch && (rawMatch.played || rawMatch.homeScore !== null)) {
      const homeClub = getClubById(rawMatch.homeId);
      const awayClub = getClubById(rawMatch.awayId);
      matchData = {
        week: weekNum,
        homeClub,
        awayClub,
        homeScore: rawMatch.homeScore,
        awayScore: rawMatch.awayScore,
        homePossession: rawMatch.homePossession || 50,
        awayPossession: rawMatch.awayPossession || 50,
        homeShots: rawMatch.homeShots || 10,
        awayShots: rawMatch.awayShots || 10,
        homeOnTarget: rawMatch.homeOnTarget || Math.round((rawMatch.homeShots || 10) * 0.45),
        awayOnTarget: rawMatch.awayOnTarget || Math.round((rawMatch.awayShots || 10) * 0.45),
        homeXg: rawMatch.homeXg || Number((rawMatch.homeScore * 0.72 + 0.4).toFixed(2)),
        awayXg: rawMatch.awayXg || Number((rawMatch.awayScore * 0.72 + 0.4).toFixed(2)),
        homePasses: rawMatch.homePasses || 480,
        awayPasses: rawMatch.awayPasses || 420,
        homePassAccuracy: rawMatch.homePassAccuracy || 80,
        awayPassAccuracy: rawMatch.awayPassAccuracy || 78,
        isPlayerHome: rawMatch.homeId === playerClub.id,
        homeScorers: rawMatch.homeScorers || [],
        awayScorers: rawMatch.awayScorers || [],
        matchIncome: rawMatch.homeRevenue || 1800,
        awayBroadcastingFee: rawMatch.awayRevenue || 1600,
        playerSupportersDelta: rawMatch.homeId === playerClub.id ? 120 : 60
      };
    }
  }

  if (!matchData) {
    alert(`第${weekNum}節の試合詳細データが見つかりません。`);
    return;
  }

  if (title) {
    const matchDays = (gameState.calendar || []).filter(d => d.isMatchDay);
    const dayInfo = matchDays[weekNum - 1];
    const dateStr = dayInfo ? ` / ${dayInfo.month}月${dayInfo.day}日 (${dayInfo.dayOfWeekName})` : '';
    title.textContent = `第${weekNum}節 公式戦サマリー${dateStr}`;
  }

  // 試合直後のサマリーと完全に同一のHTMLを出力
  body.innerHTML = buildMatchSummaryHtml(matchData);

  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(body);
  }

  modal.classList.remove('hidden');
  setBodyModalLock(true);
}
function closePastMatchSummaryModal() {
  const modal = document.getElementById('past-match-modal');
  if (modal) {
    modal.classList.add('hidden');
    setBodyModalLock(false);
  }
}

/**
 * 日程・結果タブの総合描画（カレンダー形式 または リスト形式）
 */
function renderScheduleView() {
  const mode = gameState.scheduleViewMode || 'calendar';
  switchScheduleViewMode(mode, false);
}

/**
 * 表示形式切り替え（'calendar' | 'list'）
 * @param {string} mode 'calendar' または 'list'
 * @param {boolean} updateState 状態を更新するかどうか
 */
function switchScheduleViewMode(mode, updateState = true) {
  if (updateState) {
    gameState.scheduleViewMode = mode;
  }
  const currentMode = gameState.scheduleViewMode || 'calendar';

  const viewTeam = document.getElementById('view-team');
  if (viewTeam) {
    viewTeam.setAttribute('data-schedule-mode', currentMode);
  }
  document.body.setAttribute('data-schedule-mode', currentMode);
  document.documentElement.setAttribute('data-schedule-mode', currentMode);

  const btnCal = document.getElementById('btn-view-toggle-calendar');
  const btnList = document.getElementById('btn-view-toggle-list');
  const calView = document.getElementById('season-calendar-view');
  const listView = document.getElementById('season-schedule-list');
  const monthNav = document.getElementById('calendar-month-nav');

  if (btnCal) {
    btnCal.classList.toggle('active', currentMode === 'calendar');
    btnCal.setAttribute('aria-pressed', currentMode === 'calendar' ? 'true' : 'false');
  }
  if (btnList) {
    btnList.classList.toggle('active', currentMode === 'list');
    btnList.setAttribute('aria-pressed', currentMode === 'list' ? 'true' : 'false');
  }
  if (calView) calView.classList.toggle('hidden', currentMode !== 'calendar');
  if (listView) listView.classList.toggle('hidden', currentMode !== 'list');
  if (monthNav) monthNav.style.visibility = currentMode === 'calendar' ? 'visible' : 'hidden';

  // 常に消化数・戦績バッジを更新
  updateScheduleSummaryBadges();

  if (currentMode === 'calendar') {
    renderMonthCalendar();
  } else {
    renderSeasonSchedule();
  }
}

/**
 * 日程・結果パネル上部の消化数 ＆ 戦績バッジの更新
 */
function updateScheduleSummaryBadges() {
  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.schedule) return;

  let playedCount = 0;
  let wonCount = 0;
  let drawnCount = 0;
  let lostCount = 0;

  for (let weekIdx = 0; weekIdx < gameState.schedule.length; weekIdx++) {
    const weekMatches = gameState.schedule[weekIdx];
    const match = weekMatches.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    if (!match) continue;

    const isPlayed = match.played || (weekIdx + 1 <= gameState.currentWeek && match.homeScore !== null);
    if (isPlayed) {
      playedCount++;
      const isHome = match.homeId === playerClub.id;
      const myScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;
      if (myScore > oppScore) wonCount++;
      else if (myScore < oppScore) lostCount++;
      else drawnCount++;
    }
  }

  const playedCountEl = document.getElementById('schedule-played-count');
  if (playedCountEl) playedCountEl.textContent = `${playedCount} / 38節`;
  const recordEl = document.getElementById('schedule-record-badge');
  if (recordEl) recordEl.textContent = `${wonCount}勝 ${drawnCount}分 ${lostCount}敗`;
}

/**
 * 月送りナビゲーション（delta: -1 前月, +1 翌月）
 */
function changeCalendarMonth(delta) {
  if (!gameState.calendarViewYear) {
    const curDay = getCurrentCalendarDay();
    gameState.calendarViewYear = curDay ? curDay.year : 2026;
    gameState.calendarViewMonth = curDay ? curDay.month : 8;
  }

  let y = gameState.calendarViewYear;
  let m = gameState.calendarViewMonth + delta;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }

  // シーズン期間（7月〜翌年6月）のガード
  const startDay = gameState.calendar && gameState.calendar[0];
  const endDay = gameState.calendar && gameState.calendar[gameState.calendar.length - 1];
  if (startDay && endDay) {
    const minKey = startDay.year * 100 + startDay.month;
    const maxKey = endDay.year * 100 + endDay.month;
    const curKey = y * 100 + m;
    if (curKey < minKey || curKey > maxKey) {
      return;
    }
  }

  gameState.calendarViewYear = y;
  gameState.calendarViewMonth = m;
  renderMonthCalendar();
}

/**
 * ゲーム内現在日の月へジャンプ
 */
function resetCalendarToCurrentMonth() {
  const curDay = getCurrentCalendarDay();
  if (curDay) {
    gameState.calendarViewYear = curDay.year;
    gameState.calendarViewMonth = curDay.month;
  } else {
    gameState.calendarViewYear = 2025 + gameState.season;
    gameState.calendarViewMonth = 8;
  }
  renderMonthCalendar();
}

/**
 * 月間カレンダーグリッド（7列マス目）の描画
 */
function renderMonthCalendar() {
  const gridEl = document.getElementById('calendar-days-grid');
  const labelEl = document.getElementById('calendar-current-month-label');
  if (!gridEl) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.calendar || gameState.calendar.length === 0) {
    gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">カレンダーデータがありません。</div>';
    return;
  }

  // 表示年月のフォールバック
  if (!gameState.calendarViewYear) {
    const curDay = getCurrentCalendarDay();
    gameState.calendarViewYear = curDay ? curDay.year : (2025 + gameState.season);
    gameState.calendarViewMonth = curDay ? curDay.month : 8;
  }

  const curYear = gameState.calendarViewYear;
  const curMonth = gameState.calendarViewMonth;

  if (labelEl) {
    labelEl.textContent = `${curYear}年 ${curMonth}月`;
  }

  // 当月のカレンダー日配列を取得
  const monthDays = gameState.calendar.filter(d => d.year === curYear && d.month === curMonth);
  if (monthDays.length === 0) {
    gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">該当月の日程データがありません。</div>';
    return;
  }

  const cellsHtml = [];

  // 初日の曜日に応じた空セルの挿入（0:日〜6:土）
  const firstDayOfWeek = monthDays[0].dayOfWeek;
  for (let i = 0; i < firstDayOfWeek; i++) {
    cellsHtml.push('<div class="cal-day-cell is-empty" aria-hidden="true"></div>');
  }

  // 当月の各日マス目の描画
  monthDays.forEach(d => {
    const isCurrentDay = (d.dayIndex === gameState.currentDayIndex);
    const dayColClass = d.dayOfWeek === 0 ? 'col-sun' : (d.dayOfWeek === 6 ? 'col-sat' : '');

    let matchInfoHtml = '';
    let matchClass = '';
    let cellAttr = '';

    // 特別イベント期日の判定
    let eventTagHtml = '';
    if (d.isTransferDeadline) {
      eventTagHtml = '<div class="cal-event-tag" title="移籍市場閉幕 (デッドラインデー)">移籍閉幕</div>';
    } else if (d.month === 7 && d.day === 1) {
      eventTagHtml = '<div class="cal-event-tag" title="夏の移籍市場解禁">市場解禁</div>';
    } else if (d.month === 1 && d.day === 1) {
      eventTagHtml = '<div class="cal-event-tag" title="冬の移籍市場解禁">冬市場解禁</div>';
    }

    if (d.isCupMatchDay) {
      const matchInfo = getCalendarDayPlayerMatch(d);
      const compCode = (matchInfo ? matchInfo.compCode : d.cupCode) || 'CUP';
      const badgeClass = `badge-comp-${compCode.toLowerCase()}`;

      if (matchInfo && matchInfo.oppClub) {
        const isHome = matchInfo.isHome;
        const oppClub = matchInfo.oppClub;
        const myMatch = matchInfo.match;
        const isPlayed = Boolean(d.played || (myMatch && myMatch.played));
        matchClass = `has-match ${isPlayed ? 'match-played' : 'match-pending'}`;
        cellAttr = `data-cal-cup-day-index="${d.dayIndex}" role="button" tabindex="0" title="${matchInfo.title} vs ${oppClub.name}"`;

        let scoreBadge = '';
        if (isPlayed && myMatch && myMatch.homeScore !== null && myMatch.homeScore !== undefined) {
          const myScore = isHome ? myMatch.homeScore : myMatch.awayScore;
          const oppScore = isHome ? myMatch.awayScore : myMatch.homeScore;
          let resClass = 'badge-draw';
          let resLabel = 'DRAW';
          if (myScore > oppScore || (myScore === oppScore && myMatch.winnerId === playerClub.id)) {
            resClass = 'badge-win';
            resLabel = 'WIN';
          } else if (myScore < oppScore || (myScore === oppScore && myMatch.winnerId && myMatch.winnerId !== playerClub.id)) {
            resClass = 'badge-lose';
            resLabel = 'LOSE';
          }
          scoreBadge = `<div class="cal-score-badge ${resClass}">${resLabel} ${myMatch.homeScore}-${myMatch.awayScore}</div>`;
        } else {
          scoreBadge = `<div class="cal-score-badge mono" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 8.5px;">VS</div>`;
        }

        const oppEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(oppClub, 13, 'cal-opp-emblem') : '';
        const oppCode = getClubShortCode(oppClub);

        matchInfoHtml = `
          <div class="cal-match-body">
            <div class="cal-match-header-row">
              <span class="cal-cup-badge ${badgeClass}">[${compCode}]</span>
              <span class="cal-venue-tag ${isHome ? 'venue-home' : 'venue-away'}">${isHome ? 'H' : 'A'}</span>
            </div>
            <div class="cal-opponent-name" title="${oppClub.name}" style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">
              ${oppEmblem}
              <span class="mono" style="font-weight:700;font-size:9.5px;">${oppCode}</span>
            </div>
            ${scoreBadge}
          </div>
        `;
      }
    } else if (d.isMatchDay && d.matchWeek) {
      const weekIdx = d.matchWeek - 1;
      const weekMatches = gameState.schedule[weekIdx] || [];
      const match = weekMatches.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);

      if (match) {
        const isHome = match.homeId === playerClub.id;
        const oppId = isHome ? match.awayId : match.homeId;
        const oppClub = getClubById(oppId) || { name: oppId, shortName: oppId };
        const oppName = oppClub.shortName || oppClub.name.replace(/・FC|・C|・U|・A|・W/g, '').trim();

        const isPlayed = match.played || (d.matchWeek <= gameState.currentWeek && match.homeScore !== null);
        const isNext = !isPlayed && (d.matchWeek === gameState.currentWeek + 1);

        if (isPlayed) {
          matchClass = 'has-match match-played';
          cellAttr = `data-cal-match-week="${d.matchWeek}" role="button" tabindex="0" title="第${d.matchWeek}節 ${oppClub.name}戦のサマリーを見る"`;

          const myScore = isHome ? match.homeScore : match.awayScore;
          const oppScore = isHome ? match.awayScore : match.homeScore;
          let badgeClass = 'badge-draw';
          let resLabel = 'DRAW';
          if (myScore > oppScore) {
            badgeClass = 'badge-win';
            resLabel = 'WIN';
          } else if (myScore < oppScore) {
            badgeClass = 'badge-lose';
            resLabel = 'LOSE';
          }

          matchInfoHtml = `
            <div class="cal-match-body">
              <div class="cal-match-header-row">
                <span class="cal-venue-tag ${isHome ? 'venue-home' : 'venue-away'}">${isHome ? 'H' : 'A'}</span>
                <span class="mono" style="font-size: 8.5px; color: var(--text-muted);">#${d.matchWeek}</span>
              </div>
              <div class="cal-opponent-name" title="${oppClub.name}" style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">${getClubEmblemSvg(oppClub, 13, 'cal-opp-emblem')}<span class="mono" style="font-weight:700;font-size:9.5px;">${getClubShortCode(oppClub)}</span></div>
              <div class="cal-score-badge ${badgeClass}">${resLabel} ${match.homeScore}-${match.awayScore}</div>
            </div>
          `;
        } else {
          matchClass = `has-match match-pending ${isNext ? 'match-next' : ''}`;
          cellAttr = `data-cal-pending-week="${d.matchWeek}" role="button" tabindex="0" title="第${d.matchWeek}節 ${oppClub.name}戦の対戦プレビュー"`;

          matchInfoHtml = `
            <div class="cal-match-body">
              <div class="cal-match-header-row">
                <span class="cal-venue-tag ${isHome ? 'venue-home' : 'venue-away'}">${isHome ? 'H' : 'A'}</span>
                ${isNext ? '<span class="cal-next-tag">NEXT</span>' : `<span class="mono" style="font-size: 8.5px; color: var(--text-muted);">#${d.matchWeek}</span>`}
              </div>
              <div class="cal-opponent-name" title="${oppClub.name}" style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">${getClubEmblemSvg(oppClub, 13, 'cal-opp-emblem')}<span class="mono" style="font-weight:700;font-size:9.5px;">${getClubShortCode(oppClub)}</span></div>
              <div class="cal-score-badge mono" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 8.5px;">VS</div>
            </div>
          `;
        }
      }
    }

    const currentDayClass = isCurrentDay ? 'is-current-day' : '';

    cellsHtml.push(`
      <div class="cal-day-cell ${dayColClass} ${currentDayClass} ${matchClass}" ${cellAttr}>
        <div class="cal-cell-header">
          <span class="cal-day-num">${d.day}</span>
          ${isCurrentDay ? '<span class="cal-today-badge mono">TODAY</span>' : ''}
        </div>
        ${eventTagHtml}
        ${matchInfoHtml}
      </div>
    `);
  });

  // 常に6行分（全42マス：7列 × 6行）のスペースを確保するため、末尾を空セルで埋める
  while (cellsHtml.length < 42) {
    cellsHtml.push('<div class="cal-day-cell is-empty" aria-hidden="true"></div>');
  }

  gridEl.innerHTML = cellsHtml.join('');
}

/**
 * 未消化試合マス目をタップした際の対戦プレビュー・確認
 * @param {number} weekNum 第何節か（1〜38）
 */
function openPendingMatchPreview(weekNum) {
  const modal = document.getElementById('fixture-preview-modal');
  const body = document.getElementById('fixture-preview-modal-body');
  const title = document.getElementById('fixture-preview-title');
  if (!modal || !body) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.schedule || !gameState.schedule[weekNum - 1]) return;

  const match = gameState.schedule[weekNum - 1].find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
  if (!match) return;

  const isHome = match.homeId === playerClub.id;
  const oppId = isHome ? match.awayId : match.homeId;
  const oppClub = getClubById(oppId);
  if (!oppClub) return;

  if (title) title.textContent = `第${weekNum}節 対戦スカウティングレポート`;

  // 順位算出
  const sortedClubs = [...gameState.clubs].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const myRank = sortedClubs.findIndex(c => c.id === playerClub.id) + 1;
  const oppRank = sortedClubs.findIndex(c => c.id === oppClub.id) + 1;

  // 日程情報
  const matchDays = (gameState.calendar || []).filter(d => d.isMatchDay);
  const dayInfo = matchDays[weekNum - 1];
  const dateStr = dayInfo ? `${dayInfo.month}月${dayInfo.day}日 (${dayInfo.dayOfWeekName})` : `第${weekNum}節`;

  // 戦術情報
  const tacticKey = oppClub.defaultTactic || oppClub.tactic || 'possession';
  const tacticLabel = getManagerTacticLabel(tacticKey);
  const formation = oppClub.defaultFormation || oppClub.formation || '4-3-3';

  // 相手チームの選手OVR算出とスタメン選出（GK1名 + フィールド10名）
  const oppPlayers = (oppClub.players || []).map(p => {
    const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(p) : (p.ovr || Math.round(((p.atk || 70) + (p.def || 70) + (p.sta || 70)) / 3));
    return { ...p, calculatedOvr: ovr };
  });

  const gks = oppPlayers.filter(p => (p.primaryPosition || p.pos) === 'GK').sort((a, b) => b.calculatedOvr - a.calculatedOvr);
  const outfield = oppPlayers.filter(p => (p.primaryPosition || p.pos) !== 'GK').sort((a, b) => b.calculatedOvr - a.calculatedOvr);

  const starters = [];
  if (gks.length > 0) {
    starters.push(gks[0]);
  } else if (oppPlayers.length > 0) {
    starters.push(oppPlayers[0]);
  }
  starters.push(...outfield.slice(0, 10));
  if (starters.length < 11) {
    const remaining = oppPlayers.filter(p => !starters.some(s => s.id === p.id));
    starters.push(...remaining.slice(0, 11 - starters.length));
  }

  // ポジション順に並べ替え（GK -> DF -> MF -> FW）
  const posOrder = { 'GK': 1, 'CB': 2, 'LB': 3, 'RB': 4, 'LWB': 5, 'RWB': 6, 'DM': 7, 'CM': 8, 'AM': 9, 'LM': 10, 'RM': 11, 'LW': 12, 'RW': 13, 'CF': 14, 'ST': 15 };
  starters.sort((a, b) => {
    const pA = a.primaryPosition || a.pos || 'MF';
    const pB = b.primaryPosition || b.pos || 'MF';
    const orderA = posOrder[pA] || 50;
    const orderB = posOrder[pB] || 50;
    return orderA - orderB || b.calculatedOvr - a.calculatedOvr;
  });

  const maxOvr = starters.length > 0 ? Math.max(...starters.map(p => p.calculatedOvr || 0)) : 0;
  const avgOvr = starters.length > 0 ? Math.round(starters.reduce((acc, p) => acc + p.calculatedOvr, 0) / starters.length) : (oppClub.avgOvr || 75);

  const squadRowsHtml = starters.map((p) => {
    const isKey = p.calculatedOvr === maxOvr;
    const pos = p.primaryPosition || p.assignedPos || p.pos || 'MF';
    const roleGroup = (typeof POS_ROLE_GROUP !== 'undefined' && POS_ROLE_GROUP[pos]) ? POS_ROLE_GROUP[pos] : 'MF';
    return `
      <tr>
        <td class="mono" style="font-weight:700; width:44px;"><span class="pos-badge pos-${roleGroup.toLowerCase()}">${pos}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:600; color:#ffffff;">${p.name}</span>
            ${isKey ? '<span class="scout-key-badge">★ KEY PLAYER</span>' : ''}
          </div>
        </td>
        <td class="mono" style="color:var(--text-muted); width:44px;">${p.age}歳</td>
        <td class="mono" style="font-weight:700; color:var(--accent-gold); width:54px;">OVR ${p.calculatedOvr}</td>
      </tr>
    `;
  }).join('');

  body.innerHTML = `
    <!-- クラブ対決カード -->
    <div class="scout-matchup-card">
      <div class="scout-team-col home">
        <div class="scout-team-title-wrap">
          ${getClubEmblemSvg(match.homeId === playerClub.id ? playerClub : oppClub, 28, 'scout-emblem')}
          <span class="scout-team-name mono ${playerClub.id === match.homeId ? 'accent-green' : ''}" style="font-weight:800; font-size:16px; letter-spacing:0.05em;">
            ${getClubShortCode(match.homeId === playerClub.id ? playerClub : oppClub)}
          </span>
        </div>
        <span class="scout-team-meta mono">
          ${match.homeId === playerClub.id ? `現在 ${myRank}位 (${playerClub.pts || 0}pt)` : `現在 ${oppRank}位 (${oppClub.pts || 0}pt)`}
        </span>
      </div>
      <div class="scout-vs-center">
        <span class="scout-vs-badge">VS</span>
        <span class="scout-venue-pill mono ${isHome ? 'fixture-venue-home' : 'fixture-venue-away'}">
          ${isHome ? 'HOME 開催' : 'AWAY 遠征'}
        </span>
        <span class="mono" style="font-size:10.5px; color:#8a94a0;">${dateStr}</span>
      </div>
      <div class="scout-team-col away">
        <div class="scout-team-title-wrap">
          <span class="scout-team-name mono ${playerClub.id === match.awayId ? 'accent-green' : ''}" style="font-weight:800; font-size:16px; letter-spacing:0.05em;">
            ${getClubShortCode(match.awayId === playerClub.id ? playerClub : oppClub)}
          </span>
          ${getClubEmblemSvg(match.awayId === playerClub.id ? playerClub : oppClub, 28, 'scout-emblem')}
        </div>
        <span class="scout-team-meta mono">
          ${match.awayId === playerClub.id ? `現在 ${myRank}位 (${playerClub.pts || 0}pt)` : `現在 ${oppRank}位 (${oppClub.pts || 0}pt)`}
        </span>
      </div>
    </div>

    <!-- 相手チーム戦術 ＆ 戦力サマリーグリッド -->
    <div class="scout-overview-grid">
      <div class="scout-metric-box">
        <span class="scout-metric-label">相手戦術スタイル</span>
        <span class="scout-metric-val accent-green">${tacticLabel}</span>
      </div>
      <div class="scout-metric-box">
        <span class="scout-metric-label">基本フォーメーション</span>
        <span class="scout-metric-val mono">${formation}</span>
      </div>
      <div class="scout-metric-box">
        <span class="scout-metric-label">相手平均戦力</span>
        <span class="scout-metric-val mono accent-gold">OVR ${oppClub.avgOvr || 76}</span>
      </div>
    </div>

    <!-- 相手チーム想定スタメン（スカッド一覧11名） -->
    <div class="scout-squad-panel">
      <div class="scout-panel-header">
        <span class="scout-panel-title">▼ 相手チーム 想定スタメン11名</span>
        <span class="mono" style="font-size:11px; color:var(--text-muted);">登録選手数: ${oppPlayers.length}名</span>
      </div>
      <div class="table-wrapper" style="max-height: 280px; overflow-y: auto;">
        <table class="scout-squad-table">
          <thead>
            <tr>
              <th>POS</th>
              <th>選手名</th>
              <th>年齢</th>
              <th>能力</th>
            </tr>
          </thead>
          <tbody>
            ${squadRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  setBodyModalLock(true);
}

function closePendingMatchPreviewModal() {
  const modal = document.getElementById('fixture-preview-modal');
  if (modal) {
    modal.classList.add('hidden');
    setBodyModalLock(false);
  }
}
