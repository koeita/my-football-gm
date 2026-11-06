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

function setBodyModalLock(locked) {
  if (locked) {
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  } else {
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }
}

function getClubShortCode(clubOrId) {
  const id = typeof clubOrId === 'string' ? clubOrId : (clubOrId && clubOrId.id);
  if (id && CLUB_SHORT_CODES[id]) return CLUB_SHORT_CODES[id];
  if (typeof clubOrId === 'object' && clubOrId && clubOrId.shortName) return clubOrId.shortName;
  return 'LFC';
}

function setBodyModalLock(locked) {
  if (locked) {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  } else {
    const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
    if (openModals.length === 0) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }
}

const CLUB_DEFINITIONS = [
  {
    id: 'manchester_b',
    name: 'マンチェスター・B',
    tier: 'MEGA RICH',
    desc: '潤沢なオイルマネーと世界屈指の戦力を誇る現王者',
    basePower: 72,
    initialFunds: 140000, // £140.0M
    supporters: 21500,
    targetRank: 1,
    targetLabel: '1位（優勝）',
    defaultTactic: 'possession'
  },
  {
    id: 'manchester_r',
    name: 'マンチェスター・R',
    tier: 'TRADITIONAL',
    desc: '世界的な人気と莫大な商業収入を持つ伝統の赤い名門',
    basePower: 70,
    initialFunds: 125000, // £125.0M
    supporters: 22000,
    targetRank: 3,
    targetLabel: '3位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'liverpool_b',
    name: 'リバプール・B',
    tier: 'CONTENDER',
    desc: '熱狂的なサポーターと激しいハイプレスを武器とする強豪',
    basePower: 71,
    initialFunds: 115000, // £115.0M
    supporters: 21000,
    targetRank: 2,
    targetLabel: '2位以内',
    defaultTactic: 'highpress'
  },
  {
    id: 'northlondon_a',
    name: 'ノースロンドン・A',
    tier: 'CONTENDER',
    desc: '華麗なパスサッカーと若手育成に定評がある北ロンドンの雄',
    basePower: 70,
    initialFunds: 105000, // £105.0M
    supporters: 20000,
    targetRank: 3,
    targetLabel: '3位以内',
    defaultTactic: 'possession'
  },
  {
    id: 'london_fc',
    name: 'ロンドン・FC',
    tier: 'AMBITIOUS',
    desc: '積極的な大型補強で欧州王座奪還を狙う西ロンドンの強豪',
    basePower: 68,
    initialFunds: 98000, // £98.0M
    supporters: 19000,
    targetRank: 4,
    targetLabel: '4位以内',
    defaultTactic: 'possession'
  },
  {
    id: 'northlondon_w',
    name: 'ノースロンドン・W',
    tier: 'BIG CLUB',
    desc: '最新鋭スタジアムと鋭い速攻を備える北ロンドンの白百合',
    basePower: 68,
    initialFunds: 88000, // £88.0M
    supporters: 18500,
    targetRank: 5,
    targetLabel: '5位以内',
    defaultTactic: 'highpress'
  },
  {
    id: 'newcastle_u',
    name: 'ニューカッスル・U',
    tier: 'RISING FORCE',
    desc: '新オーナー参入で急成長を遂げる北部の熱狂的クラブ',
    basePower: 67,
    initialFunds: 82000, // £82.0M
    supporters: 18000,
    targetRank: 6,
    targetLabel: '6位以内',
    defaultTactic: 'highpress'
  },
  {
    id: 'aston_v',
    name: 'アストン・V',
    tier: 'CHALLENGER',
    desc: '智将のもとで欧州カップ戦出場を狙うバーミンガムの古豪',
    basePower: 66,
    initialFunds: 68000, // £68.0M
    supporters: 16800,
    targetRank: 6,
    targetLabel: '6位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'brighton_g',
    name: 'ブライトン・G',
    tier: 'SMART SCOUT',
    desc: 'データ分析と独自スカウティングでビッグクラブに挑む新興勢力',
    basePower: 65,
    initialFunds: 58000, // £58.0M
    supporters: 15000,
    targetRank: 8,
    targetLabel: '8位以内',
    defaultTactic: 'possession'
  },
  {
    id: 'eastlondon_h',
    name: 'イーストロンドン・H',
    tier: 'MID TABLE',
    desc: '労働者階級の熱い支持と堅守速攻を誇る東ロンドンの雄',
    basePower: 64,
    initialFunds: 60000, // £60.0M
    supporters: 16500,
    targetRank: 9,
    targetLabel: '9位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'southlondon_p',
    name: 'サウスロンドン・P',
    tier: 'MID TABLE',
    desc: '抜群の身体能力を持つウイングと育成組織が光る南ロンドンの雄',
    basePower: 63,
    initialFunds: 52000, // £52.0M
    supporters: 14500,
    targetRank: 10,
    targetLabel: '10位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'westlondon_c',
    name: 'ウェストロンドン・C',
    tier: 'MID TABLE',
    desc: 'テムズ川沿いの伝統スタジアムを本拠とする西ロンドンの古豪',
    basePower: 63,
    initialFunds: 48000, // £48.0M
    supporters: 14000,
    targetRank: 12,
    targetLabel: '12位以内',
    defaultTactic: 'possession'
  },
  {
    id: 'westlondon_b',
    name: 'ウェストロンドン・B',
    tier: 'MONEYBALL',
    desc: '徹底した統計モデルとセットプレー戦術で1部に定着した知性派',
    basePower: 62,
    initialFunds: 45000, // £45.0M
    supporters: 13200,
    targetRank: 13,
    targetLabel: '13位以内',
    defaultTactic: 'highpress'
  },
  {
    id: 'midlands_w',
    name: 'ミッドランズ・W',
    tier: 'MID TABLE',
    desc: 'イベリア半島出身の技巧派選手を数多く擁する中部の実力派',
    basePower: 62,
    initialFunds: 46000, // £46.0M
    supporters: 13800,
    targetRank: 13,
    targetLabel: '13位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'merseyside_b',
    name: 'マージーサイド・B',
    tier: 'TRADITIONAL',
    desc: '長年1部リーグを守り続けるマージーサイドの誇り高き青き伝統',
    basePower: 62,
    initialFunds: 45000, // £45.0M
    supporters: 15200,
    targetRank: 14,
    targetLabel: '14位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'southcoast_c',
    name: 'サウスコースト・C',
    tier: 'CHALLENGER',
    desc: '南部のリゾート都市を拠点にアグレッシブなサッカーを展開',
    basePower: 61,
    initialFunds: 42000, // £42.0M
    supporters: 12500,
    targetRank: 15,
    targetLabel: '15位以内',
    defaultTactic: 'highpress'
  },
  {
    id: 'nottingham_r',
    name: 'ノッティンガム・R',
    tier: 'HISTORIC',
    desc: 'かつて欧州連覇を成し遂げた歴史を持つ伝統のフォレスト',
    basePower: 61,
    initialFunds: 40000, // £40.0M
    supporters: 13500,
    targetRank: 16,
    targetLabel: '16位以内',
    defaultTactic: 'counter'
  },
  {
    id: 'leicester_f',
    name: 'レスター・F',
    tier: 'MIRACLE',
    desc: '奇跡のリーグ制覇の記憶を胸に再び上位定着を目指すフォックス',
    basePower: 60,
    initialFunds: 38000, // £38.0M
    supporters: 13200,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'counter'
  },
  {
    id: 'southampton_s',
    name: 'サウサンプトン・S',
    tier: 'ACADEMY',
    desc: '数々の名選手を輩出してきた南部屈指の育成型クラブ',
    basePower: 59,
    initialFunds: 35000, // £35.0M
    supporters: 12200,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'possession'
  },
  {
    id: 'ipswich_t',
    name: 'イプスウィッチ・T',
    tier: 'PROMOTED',
    desc: '連続昇格の勢いと組織力でプレミア残留に挑む東部の古豪',
    basePower: 58,
    initialFunds: 32000, // £32.0M
    supporters: 11500,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'highpress'
  }
];

// 他国（スペイン、ドイツ、イタリア、フランス）の主要メガクラブ（欧州強豪データとして内部保持）
const EUROPEAN_MEGA_CLUBS = [
  { id: 'madrid', name: 'マドリード・ブランコス', country: 'スペイン', basePower: 75, budget: 120000 },
  { id: 'barcelona', name: 'バルセロナ・カタルーニャ', country: 'スペイン', basePower: 73, budget: 95000 },
  { id: 'munich', name: 'ミュンヘン・バヴァリア', country: 'ドイツ', basePower: 74, budget: 105000 },
  { id: 'milano', name: 'ミラノ・ロッソネリ', country: 'イタリア', basePower: 71, budget: 82000 },
  { id: 'torino', name: 'トリノ・ビアンコネリ', country: 'イタリア', basePower: 71, budget: 85000 },
  { id: 'paris', name: 'パリ・メトロポリタン', country: 'フランス', basePower: 73, budget: 115000 }
];

// 12ポジション定義とカテゴリ分類
const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'CF'];

const POS_DISPLAY_ORDER = {
  GK: 1,
  CB: 2,
  LB: 3,
  RB: 4,
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
  DM: 'MF',
  CM: 'MF',
  LM: 'MF',
  RM: 'MF',
  AM: 'MF',
  LW: 'FW',
  RW: 'FW',
  CF: 'FW'
};

// 4種類のフォーメーション定義（ピッチ座標 x: 0〜100%, y: 0〜100% ※上が相手ゴール方向）
const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 15, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 38, y: 73 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 62, y: 73 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 85, y: 70 },
      { slotIndex: 5, pos: 'DM', label: 'DM', x: 50, y: 54 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 28, y: 43 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 72, y: 43 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 20, y: 22 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 15 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 80, y: 22 }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 15, y: 72 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 38, y: 74 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 62, y: 74 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 85, y: 72 },
      { slotIndex: 5, pos: 'DM', label: 'LDM', x: 35, y: 55 },
      { slotIndex: 6, pos: 'DM', label: 'RDM', x: 65, y: 55 },
      { slotIndex: 7, pos: 'LM', label: 'LM', x: 18, y: 36 },
      { slotIndex: 8, pos: 'AM', label: 'AM', x: 50, y: 35 },
      { slotIndex: 9, pos: 'RM', label: 'RM', x: 82, y: 36 },
      { slotIndex: 10, pos: 'CF', label: 'CF', x: 50, y: 15 }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 15, y: 71 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 38, y: 73 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 62, y: 73 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 85, y: 71 },
      { slotIndex: 5, pos: 'LM', label: 'LM', x: 15, y: 46 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 38, y: 48 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 62, y: 48 },
      { slotIndex: 8, pos: 'RM', label: 'RM', x: 85, y: 46 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 35, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 65, y: 18 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'CB', label: 'LCB', x: 24, y: 72 },
      { slotIndex: 2, pos: 'CB', label: 'CB', x: 50, y: 74 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 76, y: 72 },
      { slotIndex: 4, pos: 'DM', label: 'DM', x: 50, y: 56 },
      { slotIndex: 5, pos: 'LM', label: 'LM', x: 14, y: 43 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 35, y: 42 },
      { slotIndex: 7, pos: 'AM', label: 'AM', x: 65, y: 42 },
      { slotIndex: 8, pos: 'RM', label: 'RM', x: 86, y: 43 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 35, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 65, y: 18 }
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

// 1チームの初期16名構成（4-3-3のスタメン11名＋各フォーメーション対応ベンチ5名）
const SQUAD_COMPOSITION = [
  { pos: 'GK', total: 2, starters: 1 },
  { pos: 'CB', total: 3, starters: 2 },
  { pos: 'LB', total: 1, starters: 1 },
  { pos: 'RB', total: 1, starters: 1 },
  { pos: 'DM', total: 1, starters: 1 },
  { pos: 'CM', total: 2, starters: 2 },
  { pos: 'LM', total: 1, starters: 0 },
  { pos: 'RM', total: 1, starters: 0 },
  { pos: 'AM', total: 1, starters: 0 },
  { pos: 'LW', total: 1, starters: 1 },
  { pos: 'RW', total: 1, starters: 1 },
  { pos: 'CF', total: 1, starters: 1 }
];

// 所属選手の上限枠（トップチーム最大25名、常設ユースチーム最大10名）
const MAX_SQUAD_SIZE = 25;
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
  { id: 'early', label: '早熟' },
  { id: 'standard', label: '標準' },
  { id: 'late', label: '晩成' },
  { id: 'fragile', label: '天才' }
];

// 戦術定義
const TACTICS_DEFINITIONS = {
  possession: {
    name: 'ポゼッション（支配）',
    badge: 'POSSESSION',
    desc: '【ポゼッション（支配）】：中盤（DM/CM/LM/RM/AM）の能力が攻守に強く反映される。得点・失点ともにロースコア傾向。'
  },
  counter: {
    name: 'カウンター（速攻）',
    badge: 'COUNTER ATTACK',
    desc: '【カウンター（速攻）】：前線（LW/RW/CF）の攻撃力と最終ライン（CB/LB/RB）の守備力が重視される。引き分けが減り波乱が起きやすい。'
  },
  highpress: {
    name: 'ハイプレス（前線守備）',
    badge: 'HIGH PRESS',
    desc: '【ハイプレス（前線守備）】：全体能力に+8%ボーナスがつくが、試合後の疲労（スタミナ減少）が大きくなる。'
  }
};

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
  gmName: 'A. ファーガソン',
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
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const subs = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];
  if (subs.length === 0) return primary;
  if (style === 'paren') {
    return `${primary} (${subs.join('/')})`;
  }
  return `${primary} / ${subs.join('・')}`;
}

/**
 * テーブル・ボード用のポジションHTMLを生成
 */
function formatPlayerPositionsHtml(p) {
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const subs = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];
  if (subs.length === 0) {
    return `<span class="pos-tag pos-${primary}">${primary}</span>`;
  }
  return `<span class="pos-tag pos-${primary}">${primary}</span><span class="pos-sub-text">/ ${subs.join('・')}</span>`;
}

/**
 * 指定スロット（slotPos）に対する選手のポジション適性判定と補正係数を返す
 * - メイン配置 (primaryPosition一致): 1.00 (100%) -> type: 'main'
 * - サブ適性配置 (secondaryPositionsに含まれる): 0.92 (92%) -> type: 'sub'
 * - 適性外配置 (上記以外): 0.80 (80%) -> type: 'out'
 */
function getPositionFitInfo(p, slotPos) {
  const primary = p.primaryPosition || p.preferredPosition || p.pos;
  const subs = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];

  if (!slotPos || slotPos === primary) {
    return { type: 'main', factor: 1.00, label: 'MAIN 100%' };
  }
  if (subs.includes(slotPos)) {
    return { type: 'sub', factor: 0.92, label: 'SUB-POS 92%' };
  }
  return { type: 'out', factor: 0.80, label: '適性外 80%' };
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
 * 移籍市場での市場価格・推定移籍金（単位：£1K、£1.5M〜£90.0M）を算出
 * 契約残り1年の選手は約50%OFFの割安価格
 */
function calculateTransferFee(player) {
  const ovr = getPlayerOverallRating(player);
  let baseVal;
  if (ovr <= 60) {
    baseVal = 1500 + Math.max(0, ovr - 50) * 220;
  } else if (ovr <= 70) {
    baseVal = 3800 + Math.pow(ovr - 60, 1.35) * 520;
  } else if (ovr <= 80) {
    baseVal = 11000 + Math.pow(ovr - 70, 1.45) * 2000;
  } else if (ovr <= 86) {
    baseVal = 39000 + Math.pow(ovr - 80, 1.4) * 4800;
  } else {
    baseVal = 70000 + Math.pow(ovr - 86, 1.3) * 6000;
  }

  const ageFactor = player.age <= 22 ? 1.30 : (player.age <= 25 ? 1.15 : (player.age >= 31 ? 0.60 : (player.age >= 34 ? 0.35 : 1.0)));

  let contractFactor = 1.0;
  if (player.contractYears === 1) contractFactor = 0.50; // 残り1年は約50%OFF
  else if (player.contractYears === 2) contractFactor = 0.85;
  else if (player.contractYears >= 4) contractFactor = 1.20;

  const fee = Math.round((baseVal * ageFactor * contractFactor) / 100) * 100;
  return clamp(fee, 1500, 95000);
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
 * 利き足（'Right', 'Left', 'Both'）を生成
 */
function generatePreferredFoot(pos) {
  const r = Math.random();
  if (pos === 'LB' || pos === 'LM' || pos === 'LW') {
    if (r < 0.76) return 'Left';
    if (r < 0.88) return 'Both';
    return 'Right';
  }
  if (pos === 'RB' || pos === 'RM' || pos === 'RW') {
    if (r < 0.76) return 'Right';
    if (r < 0.88) return 'Both';
    return 'Left';
  }
  if (pos === 'SB' || pos === 'WG' || pos === 'SM') {
    if (r < 0.56) return 'Right';
    if (r < 0.86) return 'Left';
    return 'Both';
  }
  if (r < 0.68) return 'Right';
  if (r < 0.90) return 'Left';
  return 'Both';
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

  return {
    appearances: totalApps,
    goals: totalGoals
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
 * 選手の5大パラメータ（決定力・パス・スピード・守備・スタミナ）を一貫して算出・保持する
 */
function getPlayerFiveAttributes(p) {
  if (p.attributes && typeof p.attributes.finishing === 'number') {
    return p.attributes;
  }
  const pos = p.primaryPosition || p.preferredPosition || p.pos || 'CM';
  const atk = p.atk || 50;
  const def = p.def || 50;
  const sta = p.sta || 50;
  const traits = Array.isArray(p.traits) ? p.traits : [];

  let finishing, passing, pace, defending, stamina;
  stamina = sta;

  switch (pos) {
    case 'CF':
      finishing = clamp(Math.round(atk * 0.98 + (traits.includes('決定力の鬼') ? 4 : 0)), 1, 99);
      passing = clamp(Math.round(atk * 0.70 + def * 0.12), 1, 99);
      pace = clamp(Math.round(sta * 0.40 + atk * 0.55 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.80), 1, 99);
      break;
    case 'LW':
    case 'RW':
    case 'WG':
      finishing = clamp(Math.round(atk * 0.86), 1, 99);
      passing = clamp(Math.round(atk * 0.82 + (traits.includes('チャンスメイカー') ? 4 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.45 + atk * 0.52 + (traits.includes('スピードスター') ? 6 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.85), 1, 99);
      break;
    case 'LM':
    case 'RM':
    case 'SM':
      finishing = clamp(Math.round(atk * 0.76), 1, 99);
      passing = clamp(Math.round(atk * 0.85 + def * 0.12 + (traits.includes('高精度キッカー') ? 4 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.50 + atk * 0.46 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.90), 1, 99);
      break;
    case 'AM':
      finishing = clamp(Math.round(atk * 0.82), 1, 99);
      passing = clamp(Math.round(atk * 0.94 + (traits.includes('高精度キッカー') ? 5 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.42 + atk * 0.50), 1, 99);
      defending = clamp(Math.round(def * 0.75), 1, 99);
      break;
    case 'CM':
      finishing = clamp(Math.round(atk * 0.72), 1, 99);
      passing = clamp(Math.round(atk * 0.86 + def * 0.10 + (traits.includes('高精度キッカー') ? 4 : 0)), 1, 99);
      pace = clamp(Math.round(sta * 0.55 + atk * 0.35), 1, 99);
      defending = clamp(Math.round(def * 0.95), 1, 99);
      break;
    case 'DM':
      finishing = clamp(Math.round(atk * 0.58), 1, 99);
      passing = clamp(Math.round(atk * 0.80 + def * 0.15), 1, 99);
      pace = clamp(Math.round(sta * 0.50 + def * 0.35), 1, 99);
      defending = clamp(Math.round(def * 1.0 + (traits.includes('鉄壁の対人守備') ? 4 : 0)), 1, 99);
      break;
    case 'LB':
    case 'RB':
    case 'SB':
      finishing = clamp(Math.round(atk * 0.52), 1, 99);
      passing = clamp(Math.round(def * 0.45 + atk * 0.45), 1, 99);
      pace = clamp(Math.round(sta * 0.55 + atk * 0.38 + (traits.includes('スピードスター') ? 5 : 0)), 1, 99);
      defending = clamp(Math.round(def * 0.98), 1, 99);
      break;
    case 'CB':
      finishing = clamp(Math.round(atk * 0.36), 1, 99);
      passing = clamp(Math.round(def * 0.40 + atk * 0.35), 1, 99);
      pace = clamp(Math.round(def * 0.45 + sta * 0.40), 1, 99);
      defending = clamp(Math.round(def * 1.02 + (traits.includes('鉄壁の対人守備') ? 4 : 0)), 1, 99);
      break;
    case 'GK':
    default:
      finishing = clamp(Math.round(atk * 0.20), 1, 99);
      passing = clamp(Math.round(atk * 0.40 + def * 0.25), 1, 99);
      pace = clamp(Math.round(sta * 0.45 + def * 0.30), 1, 99);
      defending = clamp(Math.round(def * 1.05 + (traits.includes('守護神の反射神経') ? 5 : 0)), 1, 99);
      break;
  }

  p.attributes = { finishing, passing, pace, defending, stamina };
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

  const subPool = SECONDARY_POSITION_POOLS[pos] || [[]];
  const secondaryPositions = [...subPool[randInt(0, subPool.length - 1)]];
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
    secondaryPositions,
    nationality,
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

  const subPool = SECONDARY_POSITION_POOLS[pos] || [[]];
  const secondaryPositions = [...subPool[randInt(0, subPool.length - 1)]];
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
    secondaryPositions,
    nationality,
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

  // 第1パス：メイン適性（primaryPosition）と完全一致するスロットへ優先配置
  for (const sl of slots) {
    if (claimedSlotIndices.has(sl.slotIndex)) continue;
    const matchIdx = unassignedPlayers.findIndex(p => (p.primaryPosition || p.preferredPosition || p.pos) === sl.pos);
    if (matchIdx !== -1) {
      const p = unassignedPlayers.splice(matchIdx, 1)[0];
      p.slotIndex = sl.slotIndex;
      p.assignedPos = sl.pos;
      claimedSlotIndices.add(sl.slotIndex);
    }
  }

  // 第2パス：サブ適性（secondaryPositions）に含まれるスロットへ優先配置（92%発揮）
  for (const sl of slots) {
    if (claimedSlotIndices.has(sl.slotIndex)) continue;
    const subIdx = unassignedPlayers.findIndex(p => Array.isArray(p.secondaryPositions) && p.secondaryPositions.includes(sl.pos));
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

  assignStartersToFormationSlots(club, false);
}

/**
 * CPUクラブのスタメン11名を最適配置で自動編成
 */
function autoSelectStarters(club) {
  if (!club.formation || !FORMATIONS[club.formation]) {
    club.formation = '4-3-3';
  }
  const formationDef = getClubFormationDef(club);

  club.players.forEach(p => {
    p.isStarter = false;
    p.assignedPos = null;
    p.slotIndex = null;
  });

  const available = [...club.players].filter(p => !p.isRetired);

  for (const sl of formationDef.slots) {
    const candidates = available.filter(p => !p.isStarter);
    if (candidates.length === 0) break;

    candidates.sort((a, b) => {
      const aHealthy = (a.injuryWeeks || 0) === 0 ? 1 : 0;
      const bHealthy = (b.injuryWeeks || 0) === 0 ? 1 : 0;
      if (aHealthy !== bHealthy) return bHealthy - aHealthy;

      const aFit = getPositionFitInfo(a, sl.pos).factor;
      const bFit = getPositionFitInfo(b, sl.pos).factor;
      if (aFit !== bFit) return bFit - aFit;

      return getEffectivePlayerRatingForSlot(b, sl.pos) - getEffectivePlayerRatingForSlot(a, sl.pos);
    });

    const chosen = candidates[0];
    chosen.isStarter = true;
    chosen.slotIndex = sl.slotIndex;
    chosen.assignedPos = sl.pos;
  }

  ensureValidSquadAndStarters(club);
}

/**
 * クラブの年間総年俸（単位：£1K）を計算
 */
function getClubTotalPayroll(club) {
  return club.players
    .filter(p => !p.isRetired)
    .reduce((sum, p) => sum + p.salary, 0);
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

  // 全38節のマッチデー（dayOffset: 0〜290日程度）の算出
  // 8月1日(土) = day 0 (第1節)
  // 土曜日（dayOfWeek === 6）を基本軸とし、過密期（12月、1月、2月、4月）に水曜日（ミッドウィーク）を挟む
  const matchdayOffsets = [];
  let roundCount = 0;

  for (let offset = 0; offset < 310 && roundCount < 38; offset++) {
    const curD = new Date(seasonYear, 7, 1 + offset);
    const dayOfWeek = curD.getDay(); // 0:日, 1:月, ..., 6:土
    const month = curD.getMonth() + 1; // 1-12
    const dateNum = curD.getDate();

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
  let fallbackOffset = matchdayOffsets.length > 0 ? matchdayOffsets[matchdayOffsets.length - 1] + 1 : 0;
  while (matchdayOffsets.length < 38 && fallbackOffset < 360) {
    const d = new Date(seasonYear, 7, 1 + fallbackOffset);
    if (d.getDay() === 6) {
      matchdayOffsets.push(fallbackOffset);
    }
    fallbackOffset++;
  }

  // 365日分のカレンダー配列を構築
  for (let offset = 0; offset < 365; offset++) {
    const curDate = new Date(seasonYear, 7, 1 + offset);
    const y = curDate.getFullYear();
    const m = curDate.getMonth() + 1;
    const d = curDate.getDate();
    const dayOfWeek = curDate.getDay();
    const dayOfWeekName = dayNames[dayOfWeek];
    const displayDate = `${y}年 ${m}月${d}日 (${dayOfWeekName})`;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 移籍ウィンドウ判定（夏: 8/1〜8/31, 冬: 1/1〜1/31）
    const windowOpen = (m === 8) || (m === 1);
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
 * 今日が未消化の試合日（Matchday）かどうかを判定
 */
function isTodayMatchDayPending() {
  const day = getCurrentCalendarDay();
  return Boolean(day && day.isMatchDay && !day.played && !gameState.isSeasonOver);
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
  const currentDay = getCurrentCalendarDay();
  if (currentDay && currentDay.isMatchDay && !currentDay.played) {
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

  // 1. 平日の選手状態更新（全治日数のカウントダウン）
  for (const club of gameState.clubs) {
    for (const p of club.players) {
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
    }
  }

  // 2. 移籍ウィンドウ期間中のイベント判定（双方向の他クラブ買取オファー）
  let eventTriggered = false;
  if (nextDay.windowOpen && !gameState.incomingTransferOffer && !gameState.pendingMegaOffer) {
    const offerFired = triggerIncomingTransferOffer(false);
    if (offerFired) {
      eventTriggered = true;
    }
  }

  // 3. 次の日が試合日（未消化）かどうか
  const isNextDayMatch = Boolean(nextDay.isMatchDay && !nextDay.played);

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
function playCurrentMatchday(skipAnimation = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || !currentDay.isMatchDay || currentDay.played) {
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
      const windowName = currentDay.month === 8 ? '夏期' : '冬期';
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
  for (let i = currentIdx; i < gameState.calendar.length; i++) {
    const d = gameState.calendar[i];
    if (d.isMatchDay && !d.played) {
      daysUntilMatch = i - currentIdx;
      nextMatchDay = d;
      break;
    }
  }

  if (hintEl) {
    if (gameState.isSeasonOver) {
      hintEl.textContent = 'シーズン終了（オフ期間）';
    } else if (daysUntilMatch === 0) {
      hintEl.textContent = `本日 Matchday（第${nextMatchDay.matchWeek}節）`;
    } else if (daysUntilMatch !== null) {
      hintEl.textContent = `次の試合（第${nextMatchDay.matchWeek}節）まで あと${daysUntilMatch}日`;
    } else {
      hintEl.textContent = '全日程消化完了';
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
    const isMatch = day.isMatchDay && !day.played;

    let eventHtml = '';
    if (day.isMatchDay) {
      let fixtureText = `第${day.matchWeek}節`;
      if (playerClub && day.matchFixture) {
        const myFix = day.matchFixture.find(f => f.homeId === playerClub.id || f.awayId === playerClub.id);
        if (myFix) {
          const isHome = myFix.homeId === playerClub.id;
          const oppId = isHome ? myFix.awayId : myFix.homeId;
          const oppClub = getClubById(oppId);
          const oppName = oppClub ? (oppClub.name.length > 8 ? oppClub.name.substring(0, 7) + '..' : oppClub.name) : '相手';
          fixtureText = `vs ${oppName} (${isHome ? 'H' : 'A'})`;
        }
      }
      eventHtml = `<span class="day-event-badge day-event-match">${fixtureText}</span>`;
    } else if (day.isTransferDeadline) {
      eventHtml = `<span class="day-event-badge day-event-market">市場最終日</span>`;
    } else if (day.windowOpen) {
      eventHtml = `<span class="day-event-market">移籍交渉期間</span>`;
    } else if (day.eventType === 'recovery') {
      eventHtml = `<span class="day-event-recovery">クールダウン</span>`;
    } else {
      eventHtml = `<span class="day-event-training">戦術練習</span>`;
    }

    return `
      <div class="day-card ${isToday ? 'is-today' : ''} ${isMatch ? 'is-matchday' : ''}">
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
 * チームのスタメン11名の戦術・複数ポジション適性(100%/92%/80%)・怪我状態を考慮した実効能力を計算
 */
function getTeamStarterStats(club) {
  const starters = club.players.filter(p => p.isStarter && !p.isRetired);
  const tactic = club.tactic || 'possession';

  let totalAtk = 0;
  let totalDef = 0;
  let totalSta = 0;

  for (const p of starters) {
    const slot = p.assignedPos || p.pos;
    const roleGroup = POS_ROLE_GROUP[slot] || 'MF';

    // メイン適性(1.00)・サブ適性(0.92)・適性外(0.80)の補正
    const fitInfo = getPositionFitInfo(p, slot);
    const posPenaltyFactor = fitInfo.factor;
    // 怪我人を強行出場させている場合は25%低下
    const injuryFactor = p.injuryWeeks > 0 ? 0.75 : 1.0;

    let pAtk = p.atk * posPenaltyFactor * injuryFactor;
    let pDef = p.def * posPenaltyFactor * injuryFactor;

    if (tactic === 'possession') {
      if (roleGroup === 'MF') {
        pAtk *= 1.30;
        pDef *= 1.30;
      }
    } else if (tactic === 'counter') {
      if (roleGroup === 'FW') pAtk *= 1.35;
      if (roleGroup === 'DF') pDef *= 1.35;
    } else if (tactic === 'highpress') {
      pAtk *= 1.08;
      pDef *= 1.08;
    }

    totalAtk += pAtk;
    totalDef += pDef;
    totalSta += p.sta;
  }

  const count = starters.length || 1;
  let avgSta = Math.round(totalSta / count);

  if (tactic === 'highpress') {
    avgSta = Math.max(30, avgSta - 9);
  }

  return {
    totalAtk,
    totalDef,
    avgSta
  };
}

/**
 * 2チームのスタメン能力値と戦術からスコアを算出する数理モデル
 */
function simulateMatch(homeClub, awayClub) {
  const homeStats = getTeamStarterStats(homeClub);
  const awayStats = getTeamStarterStats(awayClub);

  const homeStaFactor = 0.85 + (homeStats.avgSta / 100) * 0.3;
  const awayStaFactor = 0.85 + (awayStats.avgSta / 100) * 0.3;

  const homeEffAtk = homeStats.totalAtk * homeStaFactor * 1.04;
  const homeEffDef = homeStats.totalDef * homeStaFactor * 1.04;
  const awayEffAtk = awayStats.totalAtk * awayStaFactor;
  const awayEffDef = awayStats.totalDef * awayStaFactor;

  let rawHomeLambda = 1.38 * Math.pow(homeEffAtk / Math.max(awayEffDef, 200), 1.15);
  let rawAwayLambda = 1.22 * Math.pow(awayEffAtk / Math.max(homeEffDef, 200), 1.15);

  if (homeClub.tactic === 'possession') rawHomeLambda *= 0.86;
  if (awayClub.tactic === 'possession') rawAwayLambda *= 0.86;

  if (homeClub.tactic === 'counter') rawHomeLambda *= 1.12;
  if (awayClub.tactic === 'counter') rawAwayLambda *= 1.12;

  const homeLambda = clamp(rawHomeLambda, 0.25, 4.2);
  const awayLambda = clamp(rawAwayLambda, 0.25, 4.0);

  const homeScore = samplePoisson(homeLambda);
  const awayScore = samplePoisson(awayLambda);

  return { homeScore, awayScore };
}

/**
 * 試合から得点者を抽出し、今季＆キャリア通算スタッツを更新する
 */
function processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore) {
  const homeStarters = homeClub.players.filter(p => p.isStarter && !p.isRetired);
  const awayStarters = awayClub.players.filter(p => p.isStarter && !p.isRetired);

  homeStarters.forEach(p => {
    p.appearances += 1;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0 };
    p.careerStats.appearances += 1;
  });
  awayStarters.forEach(p => {
    p.appearances += 1;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0 };
    p.careerStats.appearances += 1;
  });

  const getScorer = (starters, tactic) => {
    const fws = starters.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'FW');
    const mfs = starters.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'MF');
    const dfs = starters.filter(p => POS_ROLE_GROUP[p.assignedPos || p.pos] === 'DF');

    const fwWeight = tactic === 'counter' ? 0.72 : 0.56;
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

  const homeScorers = [];
  for (let i = 0; i < homeScore; i++) {
    const scorer = getScorer(homeStarters, homeClub.tactic);
    if (scorer) {
      scorer.goals += 1;
      if (scorer.careerStats) scorer.careerStats.goals += 1;
      homeScorers.push({ scorer, minute: randInt(5, 89) });
    }
  }

  const awayScorers = [];
  for (let i = 0; i < awayScore; i++) {
    const scorer = getScorer(awayStarters, awayClub.tactic);
    if (scorer) {
      scorer.goals += 1;
      if (scorer.careerStats) scorer.careerStats.goals += 1;
      awayScorers.push({ scorer, minute: randInt(5, 89) });
    }
  }

  const allMatchGoals = homeScorers.concat(awayScorers);

  const assignRatings = (starters, scored, conceded, isWin, isDraw) => {
    starters.forEach(p => {
      let r = 6.2;
      if (isWin) r += 0.6;
      else if (isDraw) r += 0.1;
      else r -= 0.3;

      const role = POS_ROLE_GROUP[p.assignedPos || p.pos];
      if (conceded === 0 && (role === 'GK' || role === 'DF')) {
        r += 0.5;
      }

      const goalsInMatch = allMatchGoals.filter(s => s.scorer.id === p.id).length;
      r += goalsInMatch * 0.8;

      if (p.assignedPos) {
        const fitInfo = getPositionFitInfo(p, p.assignedPos);
        if (fitInfo.type === 'sub') r -= 0.1;
        else if (fitInfo.type === 'out') r -= 0.4;
      }

      r += randInt(-2, 2) * 0.1;
      r = clamp(r, 5.0, 9.5);
      p.totalRating += r;
    });
  };

  const isHomeWin = homeScore > awayScore;
  const isDraw = homeScore === awayScore;
  const isAwayWin = homeScore < awayScore;

  assignRatings(homeStarters, homeScore, awayScore, isHomeWin, isDraw);
  assignRatings(awayStarters, awayScore, homeScore, isAwayWin, isDraw);

  // ハイプレス選択時はスタメンのスタミナが微減（トレーニング＆メディカル施設Lvで軽減）
  const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
  const homeFatigueProb = homeClub.isPlayer ? Math.max(0.05, 0.20 * (1 - (trainingLv - 1) * 0.18)) : 0.20;
  const awayFatigueProb = awayClub.isPlayer ? Math.max(0.05, 0.20 * (1 - (trainingLv - 1) * 0.18)) : 0.20;

  if (homeClub.tactic === 'highpress' && Math.random() < homeFatigueProb) {
    homeStarters.forEach(p => { p.sta = Math.max(30, p.sta - 1); });
  }
  if (awayClub.tactic === 'highpress' && Math.random() < awayFatigueProb) {
    awayStarters.forEach(p => { p.sta = Math.max(30, p.sta - 1); });
  }

  return { homeScorers, awayScorers };
}

/**
 * 自チームの試合におけるテキスト速報用イベントログを生成
 */
function generateMatchTickerEvents(playerMatch, homeScorers, awayScorers) {
  const { homeClub, awayClub, homeScore, awayScore, isPlayerHome, matchIncome, awayBroadcastingFee } = playerMatch;
  const events = [];

  events.push({
    time: "0'",
    type: 'normal',
    text: `試合開始！ ${homeClub.name} vs ${awayClub.name}`
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

  events.push({
    time: "90'",
    type: 'final',
    text: `試合終了！ 最終結果：${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name}`
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

    const { homeScore, awayScore } = simulateMatch(homeClub, awayClub);
    match.homeScore = homeScore;
    match.awayScore = awayScore;
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

    const { homeScorers, awayScorers } = processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore);

    const matchObj = {
      week: weekIndex + 1,
      homeClub,
      awayClub,
      homeScore,
      awayScore,
      isPlayerHome: homeClub.isPlayer,
      isPlayerMatch: homeClub.isPlayer || awayClub.isPlayer,
      matchIncome,
      awayBroadcastingFee
    };
    results.push(matchObj);

    if (matchObj.isPlayerMatch) {
      playerMatchData = matchObj;
      playerHomeScorers = homeScorers;
      playerAwayScorers = awayScorers;
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
    completed: skipAnimation
  };

  const isFinalWeek = gameState.currentWeek === gameState.totalWeeks;

  if (skipAnimation) {
    if (isFinalWeek) {
      processSeasonEnd(true);
    }
    renderAll();
    return;
  }

  runMatchTickerAnimation(tickerEvents, () => {
    if (isFinalWeek) {
      processSeasonEnd(false);
    } else {
      checkPostMatchEvents();
    }
    renderAll();
  });
}

/**
 * テキスト速報ログアニメーション演出（約1秒）
 */
function runMatchTickerAnimation(events, onComplete) {
  gameState.isSimulating = true;
  renderHeader();

  const container = document.getElementById('match-results-container');
  const subtitle = document.getElementById('log-panel-subtitle');
  subtitle.textContent = `MATCHWEEK ${gameState.currentWeek} LIVE TICKER`;

  container.innerHTML = `
    <div class="match-ticker-box">
      <div class="ticker-header">
        <span class="ticker-title">第${gameState.currentWeek}節 自チーム速報</span>
        <span class="ticker-live-badge">MATCH IN PROGRESS</span>
      </div>
      <div class="ticker-feed" id="ticker-feed"></div>
    </div>
  `;

  const feedEl = document.getElementById('ticker-feed');
  const stepDelay = Math.max(150, Math.floor(900 / Math.max(events.length, 1)));
  let eventIdx = 0;

  const intervalId = setInterval(() => {
    if (eventIdx < events.length) {
      const ev = events[eventIdx];
      const lineEl = document.createElement('div');
      lineEl.className = `ticker-line ticker-${ev.type}`;
      lineEl.innerHTML = `<span class="ticker-time">${ev.time}</span><span class="ticker-text">${ev.text}</span>`;
      feedEl.appendChild(lineEl);
      eventIdx++;
    } else {
      clearInterval(intervalId);
      gameState.isSimulating = false;
      if (gameState.lastMatchTicker) {
        gameState.lastMatchTicker.completed = true;
      }
      if (onComplete) onComplete();
    }
  }, stepDelay);
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

  // 全38節の長丁場に合わせ、通常節は18%の確率でランダムGMイベントが発生（トレーニング＆メディカル施設Lvで負傷率軽減）
  if (Math.random() < 0.18) {
    const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
    const injuryThreshold = Math.max(0.10, 0.36 * (1 - (trainingLv - 1) * 0.18));
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
    description: `トレーニング中に ${victim.pos} ${victim.name}（${victim.age}歳 / ${getGrowthCurveLabel(victim.growthCurve)}）が筋肉系のトラブルを訴え、全治${weeks}試合の診断を受けました。治療方針を選択してください。`,
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
    detailHtml: `候補選手：[${prospect.pos}] ${prospect.name}（${prospect.age}歳 / 成長曲線：${getGrowthCurveLabel(prospect.growthCurve)}）<br>能力値：総合 ${ovr}（攻撃 ${prospect.atk} / 守備 ${prospect.def} / スタミナ ${prospect.sta}） / 4年契約・年俸 ${formatMoney(prospect.salary)}`,
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
            `[現役引退] ${p.pos} ${p.name} (${p.age}歳 / ${getGrowthCurveLabel(p.growthCurve)}) が現役を引退しました`
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

  const demandedFee = calculateTransferFee(target);
  const demandedWage = Math.max(5, Math.round((target.wage || 20) * 1.15));
  const demandedSalary = demandedWage * 52;
  const demandedYears = clamp(target.contractYears >= 3 ? 3 : 4, 1, 5);
  const failCount = target.transferFailCount || 0;
  const isRefused = Boolean(target.negotiationFailed);

  const clubName = sellerClub ? sellerClub.name : '相手クラブ';
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
    squadNumEl.textContent = isRenewal ? `#${target.squadNumber || 10}` : 'SIGN';
  }

  const catEl = document.getElementById('neg-modal-category');
  if (catEl) {
    catEl.textContent = isRenewal
      ? 'CONTRACT RENEWAL NEGOTIATION（契約延長・引き止め交渉）'
      : `TRANSFER OFFER NEGOTIATION（獲得交渉 — ${sellerClub ? sellerClub.name : '相手クラブ'}）`;
  }

  const posPillEl = document.getElementById('neg-pos-pill');
  if (posPillEl) {
    const subText = subPosList.length > 0 ? ` / SUB: ${subPosList.join(',')}` : '';
    posPillEl.innerHTML = `<span class="profile-pos-badge-main">MAIN: ${primaryPos}${subText}</span>`;
  }

  const titleEl = document.getElementById('neg-modal-title');
  if (titleEl) titleEl.textContent = target.name;

  const metaEl = document.getElementById('neg-player-meta');
  if (metaEl) {
    const avgRat = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : '-';
    metaEl.innerHTML = isRenewal
      ? `<span>年齢: <strong>${target.age}歳</strong></span><span>|</span><span>総合力: <strong class="accent-green">OVR ${ovr}</strong></span><span>|</span><span>今季成績: <strong>${target.appearances}試合 ${target.goals}得点</strong></span><span>|</span><span>現給与: <strong class="accent-gold">${formatWage(target.wage)} (残り${target.contractYears}年)</strong></span>`
      : `<span>年齢: <strong>${target.age}歳</strong></span><span>|</span><span>所属: <strong>${sellerClub ? sellerClub.name : '他クラブ'}</strong></span><span>|</span><span>総合力: <strong class="accent-green">OVR ${ovr}</strong></span><span>|</span><span>現給与: <strong>${formatWage(target.wage)}</strong></span>`;
  }

  const maxFails = 2;
  const remainingTries = Math.max(0, maxFails - (session.failCount || 0));
  let patienceClass = '';
  let patienceLabel = `交渉猶予：残り ${remainingTries} 回`;
  if (session.completed && session.statusType === 'success') {
    patienceLabel = '合意成立 (AGREED)';
  } else if (remainingTries === 1) {
    patienceClass = 'patience-warn';
    patienceLabel = '最終交渉 (LAST CHANCE)';
  } else if (remainingTries === 0) {
    patienceClass = 'patience-danger';
    patienceLabel = '交渉決裂 (BREAKDOWN)';
  }

  // スライダー範囲の算出
  const minSalary = Math.max(500, Math.round((session.demandedSalary * 0.65) / 50) * 50);
  const maxSalary = Math.max(minSalary + 1000, Math.round((session.demandedSalary * 1.55) / 50) * 50);

  const minFee = isRenewal ? 0 : Math.max(300, Math.round((session.demandedFee * 0.65) / 100) * 100);
  const maxFee = isRenewal ? 0 : Math.max(minFee + 2000, Math.round((session.demandedFee * 1.45) / 100) * 100);

  const feeControlHtml = isRenewal ? '' : `
    <div class="neg-control-group">
      <div class="neg-control-header">
        <span class="neg-control-label">提示移籍金（所属元クラブへの支払額）</span>
        <span class="neg-control-val" id="neg-offered-fee-display">${formatMoney(session.offeredFee)}</span>
      </div>
      <div class="neg-slider-row">
        <input type="range" id="neg-fee-slider" class="neg-slider" min="${minFee}" max="${maxFee}" step="100" value="${session.offeredFee}" ${session.completed ? 'disabled' : ''}>
        <input type="number" id="neg-fee-input" class="neg-num-input" min="${minFee}" max="${maxFee}" step="100" value="${session.offeredFee}" ${session.completed ? 'disabled' : ''} title="単位：£1K (1000 = £1.0M)">
      </div>
      <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
        <span>相手クラブ要求額: <strong class="mono">${formatMoney(session.demandedFee)}</strong></span>
        <span>現在クラブ予算: <strong class="mono ${playerClub.funds < session.offeredFee ? 'text-danger' : 'accent-gold'}">${formatMoney(playerClub.funds)}</strong></span>
      </div>
    </div>
  `;

  const curContractY = target.contractYears || 0;

  const yearsButtonsHtml = [1, 2, 3, 4].map(yr => `
    <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
      ${yr}年契約
    </button>
  `).join('');

  const demandRowsHtml = isRenewal ? `
    <div class="neg-demand-row">
      <span class="neg-demand-label">現在の年俸 ／ 現在の残契約</span>
      <span class="neg-demand-val">${formatMoney(target.salary)} ／ 残り${curContractY}年</span>
    </div>
    <div class="neg-demand-row">
      <span class="neg-demand-label">今季の活躍度（出場 / ゴール / OVR）</span>
      <span class="neg-demand-val accent-green">${target.appearances}試合 / ${target.goals}G / OVR ${ovr}</span>
    </div>
    <div class="neg-demand-row">
      <span class="neg-demand-label">代理人の要求年俸</span>
      <span class="neg-demand-val accent-gold">${formatMoney(session.demandedSalary)} / 年</span>
    </div>
    <div class="neg-demand-row">
      <span class="neg-demand-label">代理人の要求契約期間</span>
      <span class="neg-demand-val">${session.demandedYears}年契約</span>
    </div>
  ` : `
    <div class="neg-demand-row">
      <span class="neg-demand-label">所属元クラブの要求移籍金</span>
      <span class="neg-demand-val accent-gold">${formatMoney(session.demandedFee)}${target.contractYears === 1 ? ' (残1年割安)' : ''}</span>
    </div>
    <div class="neg-demand-row">
      <span class="neg-demand-label">選手本人の要求年俸</span>
      <span class="neg-demand-val accent-green">${formatMoney(session.demandedSalary)} / 年</span>
    </div>
    <div class="neg-demand-row">
      <span class="neg-demand-label">選手の希望契約期間</span>
      <span class="neg-demand-val">${session.demandedYears}年契約</span>
    </div>
    <div class="neg-demand-row">
      <span class="neg-demand-label">当クラブ予算 ／ 登録枠</span>
      <span class="neg-demand-val">${formatMoney(playerClub.funds)} ／ ${playerClub.players.length}/${MAX_SQUAD_SIZE}名</span>
    </div>
  `;

  const bodyEl = document.getElementById('neg-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="neg-feedback-box status-${session.statusType}" id="neg-feedback-box">
        ${session.statusMessage}
      </div>

      <div class="neg-grid">
        <!-- 左：相手側（代理人・所属クラブ）の要求条件 -->
        <div class="neg-panel-box">
          <div class="neg-box-header">
            <span class="neg-box-title">${isRenewal ? 'AGENT DEMANDS（代理人・選手要求）' : 'CLUB & AGENT DEMANDS（相手側要求条件）'}</span>
            <span class="neg-patience-badge ${patienceClass}">${patienceLabel}</span>
          </div>
          <div class="neg-demand-list">
            ${demandRowsHtml}
          </div>
        </div>

        <!-- 右：GM提示条件コントロール -->
        <div class="neg-panel-box">
          <div class="neg-box-header">
            <span class="neg-box-title">GM OFFER TERMS（当クラブ提示条件の調整）</span>
            <span class="mono text-muted" style="font-size: 10px;">GBP (£)</span>
          </div>

          ${feeControlHtml}

          <div class="neg-control-group">
            <div class="neg-control-header">
              <span class="neg-control-label">提示年俸（年間サラリー）</span>
              <span class="neg-control-val" id="neg-offered-salary-display">${formatMoney(session.offeredSalary)}</span>
            </div>
            <div class="neg-slider-row">
              <input type="range" id="neg-salary-slider" class="neg-slider" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''}>
              <input type="number" id="neg-salary-input" class="neg-num-input" min="${minSalary}" max="${maxSalary}" step="50" value="${session.offeredSalary}" ${session.completed ? 'disabled' : ''} title="単位：£1K (1000 = £1.0M)">
            </div>
            <div class="text-muted" style="font-size: 11px; display: flex; justify-content: space-between;">
              <span>要求年俸比: <strong class="mono" id="neg-salary-ratio-text">${Math.round((session.offeredSalary / Math.max(1, session.demandedSalary)) * 100)}%</strong></span>
              <span>増減ステップ: £50K</span>
            </div>
          </div>

          <div class="neg-control-group">
            <div class="neg-control-header">
              <span class="neg-control-label">提示契約年数（1〜4年）</span>
              <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
            </div>
            <div class="neg-years-group" id="neg-years-group">
              ${yearsButtonsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const submitBtn = document.getElementById('btn-submit-neg-offer');
  const cancelBtn = document.getElementById('btn-cancel-neg-modal');
  if (submitBtn) {
    if (session.completed) {
      submitBtn.classList.add('hidden');
    } else {
      submitBtn.classList.remove('hidden');
      submitBtn.textContent = isRenewal ? 'この条件で契約延長オファーを提示' : 'この条件で獲得オファーを提示';
    }
  }
  if (cancelBtn) {
    cancelBtn.textContent = session.completed ? '閉じる' : '交渉を保留して閉じる';
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

    // 契約年数が要求より短い場合は年俸の要求水準がわずかに上がり、長い場合はわずかに緩和
    const yearDiff = session.offeredYears - session.demandedYears;
    const yearAdjustment = yearDiff >= 0 ? 0.97 : (1 + Math.abs(yearDiff) * 0.04);
    const requiredSalary = Math.round(session.demandedSalary * yearAdjustment);

    if (session.offeredSalary >= requiredSalary) {
      // 合意（契約更新成立：既存の残り年数に提示契約年数が加算）
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

    // 不満・決裂判定
    target.renewalFailCount = (target.renewalFailCount || 0) + 1;
    session.failCount = target.renewalFailCount;

    if (target.renewalFailCount >= 2) {
      // 2回連続決裂 -> 交渉打ち切り（オフにフリー流出確定）
      target.contractRefused = true;
      target.contractYears = Math.min(target.contractYears, 1);
      session.completed = true;
      session.statusType = 'error';
      session.statusMessage = `【交渉決裂・打ち切り】2度目の低額オファー（提示 ${formatMoney(session.offeredSalary)}）に対し、#${target.squadNumber || '-'} ${target.name} 陣営が態度を硬化させ交渉打ち切りを通告しました。オフシーズンにフリー移籍での退団が確定しました。`;
      gameState.facilityFeedback = `【契約交渉決裂】#${target.squadNumber || '-'} ${target.name} との契約延長交渉が決裂しました（オフにフリー流出確定）。`;
    } else {
      // 1回目不満・保留（要求引き上げ）
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

  if (playerClub.players.length >= MAX_SQUAD_SIZE) {
    session.statusType = 'error';
    session.statusMessage = `【獲得不可】チームの所属選手枠が上限（${MAX_SQUAD_SIZE}名）に達しているため獲得できません。先に選手を整理してください。`;
    renderNegotiationModal();
    return;
  }

  if (playerClub.funds < session.offeredFee) {
    session.statusType = 'error';
    session.statusMessage = `【予算不足】提示移籍金（${formatMoney(session.offeredFee)}）が現在のクラブ資金（${formatMoney(playerClub.funds)}）を超えています。移籍金を調整してください。`;
    renderNegotiationModal();
    return;
  }

  const feeThresholdFactor = target.contractYears === 1 ? 0.90 : 0.96;
  const requiredFee = Math.round(session.demandedFee * feeThresholdFactor);
  const offeredWage = session.offeredWage || Math.round(session.offeredSalary / 52) || 20;
  const demandedWage = session.demandedWage || Math.round(session.demandedSalary / 52) || 20;
  const salaryYearFactor = session.offeredYears >= session.demandedYears ? 0.95 : 1.02;
  const requiredWage = Math.round(demandedWage * salaryYearFactor);

  const clubAgreed = session.offeredFee >= requiredFee;
  const playerAgreed = offeredWage >= requiredWage;

  if (clubAgreed && playerAgreed) {
    // 移籍成立！
    playerClub.funds -= session.offeredFee;
    if (sellerClub) {
      sellerClub.funds += session.offeredFee;
      sellerClub.players = sellerClub.players.filter(p => p.id !== target.id);
      ensureValidSquadAndStarters(sellerClub);
    } else {
      gameState.transferMarket = gameState.transferMarket.filter(p => p.id !== target.id);
    }

    target.wage = offeredWage;
    target.salary = offeredWage * 52;
    target.contractYears = session.offeredYears;
    target.isStarter = false;
    target.assignedPos = null;
    target.slotIndex = null;
    target.transferFailCount = 0;
    target.negotiationFailed = false;

    const usedNumbers = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
    target.squadNumber = pickAvailableSquadNumber(target.pos, usedNumbers);

    playerClub.players.push(target);
    ensureValidSquadAndStarters(playerClub);

    session.completed = true;
    session.statusType = 'success';
    session.statusMessage = `【移籍合意・獲得完了】${sellerClub ? sellerClub.name : '相手クラブ'}および ${target.name} 本人と全面合意に達しました！移籍金 ${formatMoney(session.offeredFee)}・週給 ${formatWage(offeredWage)}（${session.offeredYears}年契約 / 背番号 #${target.squadNumber}）で当クラブへ正式加入しました。`;
    gameState.facilityFeedback = `【新戦力獲得】${target.pos} #${target.squadNumber} ${target.name} を移籍金 ${formatMoney(session.offeredFee)}・週給 ${formatWage(offeredWage)} で獲得しました。`;
    addDailyLog(`【大型補強】${target.pos} #${target.squadNumber} ${target.name} を移籍金 ${formatMoney(session.offeredFee)} で獲得！`);
    renderNegotiationModal();
    renderAll();
    return;
  }

  target.transferFailCount = (target.transferFailCount || 0) + 1;
  session.failCount = target.transferFailCount;

  if (target.transferFailCount >= 2) {
    target.negotiationFailed = true;
    session.completed = true;
    session.statusType = 'error';
    session.statusMessage = `【交渉打ち切り】2度目のオファーも折り合わず、${sellerClub ? sellerClub.name : '相手クラブ'}および選手側は交渉から撤退しました。今ウィンドウでの獲得は不可能です。`;
  } else {
    const raisedFee = Math.round((session.demandedFee * 1.08) / 100) * 100;
    const raisedWage = Math.max(demandedWage + 2, Math.round(demandedWage * 1.06));
    session.demandedFee = raisedFee;
    session.offeredFee = raisedFee;
    session.demandedWage = raisedWage;
    session.offeredWage = raisedWage;
    session.demandedSalary = raisedWage * 52;
    session.offeredSalary = raisedWage * 52;
    session.statusType = 'warn';

    let reasonMsg = '';
    if (!clubAgreed && !playerAgreed) {
      reasonMsg = '移籍金・個人給与ともに相手側の希望に届いていません。';
    } else if (!clubAgreed) {
      reasonMsg = `所属元クラブが移籍金（希望 ${formatMoney(raisedFee)}）の増額を求めています。`;
    } else {
      reasonMsg = `選手本人が週給（希望 ${formatWage(raisedWage)}）の引き上げを求めています。`;
    }

    session.statusMessage = `【条件不一致・保留（要求引き上げ）】${reasonMsg} 条件が見直されました（残り交渉機会1回）。`;
  }

  renderNegotiationModal();
  renderAll();
}

/**
 * 移籍ウィンドウ期間中（8月・1月）に他クラブ（国内他19クラブまたは海外メガクラブ）から
 * 自クラブ主力選手に対する買取オファーを抽選・発生させる
 */
function triggerIncomingTransferOffer(force = false) {
  const playerClub = getPlayerClub();
  if (!playerClub || playerClub.players.length <= 11) return false;
  if (gameState.incomingTransferOffer) return false;

  const currentDay = getCurrentCalendarDay();
  if (!force) {
    if (!currentDay || !currentDay.windowOpen) return false;
    // 移籍期間中、1日あたり約12%の確率でオファー発生
    if (Math.random() > 0.12) return false;
  }

  // オファー対象候補：主力選手、得点ランキング上位、高OVR選手
  const candidates = [...playerClub.players].filter(p => !p.isRetired);
  if (candidates.length === 0) return false;

  candidates.sort((a, b) => {
    const scoreA = getPlayerOverallRating(a) * 1.5 + (a.goals || 0) * 4 + (a.age <= 23 ? 10 : 0);
    const scoreB = getPlayerOverallRating(b) * 1.5 + (b.goals || 0) * 4 + (b.age <= 23 ? 10 : 0);
    return scoreB - scoreA;
  });

  // 上位からランダムに選定
  const pickPool = candidates.slice(0, Math.min(6, candidates.length));
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

  const baseValue = calculateTransferFee(target);
  // メガクラブなら 1.35〜1.9倍、国内クラブなら 1.15〜1.6倍
  const multiplier = isMegaClub ? (1.35 + Math.random() * 0.55) : (1.15 + Math.random() * 0.45);
  const offerFee = Math.round((baseValue * multiplier) / 100) * 100;
  const counterFee = Math.round((offerFee * 1.35) / 100) * 100;

  gameState.incomingTransferOffer = {
    id: 'offer-' + Date.now(),
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
    wage: target.wage || Math.round(target.salary / 52),
    baseFee: baseValue,
    offerFee,
    counterFee,
    ratioPercent: Math.round(((offerFee - baseValue) / Math.max(1, baseValue)) * 100),
    status: 'pending',
    dateStr: currentDay ? currentDay.formattedDate : ''
  };

  stopAdvancingCalendar();
  addDailyLog(`【買取オファー着信】${buyerClubName} から ${target.pos} #${target.squadNumber || '-'} ${target.name} に対し 移籍金${formatMoney(offerFee)} の正式打診！`);

  openIncomingOfferModal();
  return true;
}

/**
 * 買取オファー決断モーダルを開く
 */
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
      <span>買い手: <strong>${offer.buyerClubName}</strong> (${offer.buyerClubCountry})</span>
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

  if (acceptBtn) acceptBtn.addEventListener('click', acceptIncomingOffer);
  if (counterBtn) counterBtn.addEventListener('click', counterDemandIncomingOffer);
  if (rejectBtn) rejectBtn.addEventListener('click', rejectIncomingOffer);
}

/**
 * 買取オファーを承諾
 */
function acceptIncomingOffer() {
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
function rejectIncomingOffer() {
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
  if (!playerClub) return;

  if (playerClub.players.length >= MAX_SQUAD_SIZE) {
    showToast(`トップチーム枠（最大${MAX_SQUAD_SIZE}名）が満杯です。昇格させるには先に選手を放出またはU-21へ派遣してください。`, 'warning');
    return;
  }

  if (!playerClub.youthSquad) {
    playerClub.youthSquad = [];
  }

  const idx = playerClub.youthSquad.findIndex(y => y.id === youthId);
  if (idx === -1) return;

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
  addDailyLog(`【U-21アカデミー昇格】${youth.pos} #${youth.squadNumber} ${youth.name} がプロ契約締結（週給 ${formatWage(youth.wage)} / 3年契約）`);

  renderAll();
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
      const baseFee = Math.max(800, (ovr - 44) * 350 + (29 - candidate.age) * 180);
      candidate.transferFee = Math.max(500, Math.round((isExpiring ? baseFee * 0.55 : baseFee) / 100) * 100);
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
    const board = document.getElementById('tactical-board-container');
    if (board) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (actionKey === 'goto-roster-table') {
    switchTab('roster');
    const table = document.getElementById('roster-tbody');
    if (table) table.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const grid = document.getElementById('facilities-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (actionKey === 'goto-youth') {
    switchTab('facilities');
    const panel = document.getElementById('youth-squad-panel') || document.getElementById('youth-squad-tbody');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * クラブの戦術方針を変更する
 */
function setTeamTactic(tacticKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !TACTICS_DEFINITIONS[tacticKey]) return;

  playerClub.tactic = tacticKey;

  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === tacticKey);
  });

  document.getElementById('current-tactic-badge').textContent = TACTICS_DEFINITIONS[tacticKey].badge;
  document.getElementById('current-tactic-desc').textContent = TACTICS_DEFINITIONS[tacticKey].desc;

  renderRoster();
}

/**
 * クラブのフォーメーション（4-3-3 / 4-2-3-1 / 4-4-2 / 3-5-2）を切り替える
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
      currentStarter.slotIndex = null;
      currentStarter.assignedPos = null;
    }

    benchPlayer.isStarter = true;
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
  if (!target || !ALL_POSITIONS.includes(newSlotPos)) return;

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

  // 契約残り0年のまま更新されなかった選手、または交渉決裂で流出確定した選手はフリー移籍でチームを離脱
  const expiredPlayers = playerClub.players.filter(p => p.contractYears <= 0 || p.contractRefused);
  if (expiredPlayers.length > 0) {
    playerClub.players = playerClub.players.filter(p => p.contractYears > 0 && !p.contractRefused);
    ensureValidSquadAndStarters(playerClub);
  }

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
      p.appearances = 0;
      p.goals = 0;
      p.totalRating = 0;
      p.injuryWeeks = 0;
      p.injuryDays = 0;
      p.lastDiff = null;
    }
  }

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  gameState.calendar = generateSeasonCalendar(2025 + gameState.season, gameState.schedule);
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
function switchTab(tabName) {
  if (tabName === 'standings') tabName = 'team';
  gameState.activeTab = tabName;

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

  renderAll();
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

  const playerClub = getPlayerClub();
  const clickedPlayer = playerClub.players.find(p => p.id === playerId);
  if (!clickedPlayer) return;

  if (!gameState.selectedPlayerId) {
    gameState.selectedPlayerId = playerId;
    gameState.selectedSlotIndex = clickedPlayer.isStarter ? clickedPlayer.slotIndex : null;
    renderRoster();
    return;
  }

  if (gameState.selectedPlayerId === playerId) {
    gameState.selectedPlayerId = null;
    gameState.selectedSlotIndex = null;
    renderRoster();
    return;
  }

  const prevPlayer = playerClub.players.find(p => p.id === gameState.selectedPlayerId);
  if (!prevPlayer) {
    gameState.selectedPlayerId = null;
    gameState.selectedSlotIndex = null;
    renderRoster();
    return;
  }

  if (prevPlayer.isStarter && clickedPlayer.isStarter) {
    const tempSlot = prevPlayer.assignedPos || prevPlayer.pos;
    const tempSlotIdx = prevPlayer.slotIndex;
    prevPlayer.assignedPos = clickedPlayer.assignedPos || clickedPlayer.pos;
    prevPlayer.slotIndex = clickedPlayer.slotIndex;
    clickedPlayer.assignedPos = tempSlot;
    clickedPlayer.slotIndex = tempSlotIdx;
    gameState.selectedPlayerId = null;
    gameState.selectedSlotIndex = null;
  } else if (prevPlayer.isStarter !== clickedPlayer.isStarter) {
    const starter = prevPlayer.isStarter ? prevPlayer : clickedPlayer;
    const benchPlayer = prevPlayer.isStarter ? clickedPlayer : prevPlayer;
    const slot = starter.assignedPos || starter.pos;
    const slotIdx = starter.slotIndex;

    starter.isStarter = false;
    starter.assignedPos = null;
    starter.slotIndex = null;
    benchPlayer.isStarter = true;
    benchPlayer.assignedPos = slot;
    benchPlayer.slotIndex = slotIdx;
    gameState.selectedPlayerId = null;
    gameState.selectedSlotIndex = null;
  } else {
    gameState.selectedPlayerId = playerId;
    gameState.selectedSlotIndex = null;
  }

  ensureValidSquadAndStarters(playerClub);
  renderRoster();
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
  renderStandings();
  renderTopScorers();
  renderMatchLog();
  renderRoster();
  renderYouthSquad();
  renderMarket();
  renderFacilitiesAndYouth();
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

  document.getElementById('header-club-name').textContent = playerClub.name;
  document.getElementById('header-gm-name').textContent = gameState.gmName;
  document.getElementById('header-target-rank').textContent = `目標：${playerClub.targetLabel || '4位以内'}`;
  document.getElementById('header-season').textContent = `${gameState.season}年目`;

  // 日付・曜日表示
  const dateEl = document.getElementById('header-date');
  if (dateEl && currentDay) {
    dateEl.textContent = currentDay.displayDate;
  }

  if (gameState.isGameOver) {
    document.getElementById('header-matchweek').textContent = 'GM解任（GAME OVER）';
  } else if (gameState.isSeasonOver) {
    document.getElementById('header-matchweek').textContent = 'オフシーズン（移籍・契約）';
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
  document.getElementById('header-squad-size').textContent = `${squadCount} / ${MAX_SQUAD_SIZE}名`;
  document.getElementById('header-supporters').textContent = `${playerClub.supporters.toLocaleString()}人`;

  document.getElementById('tab-badge-roster').textContent = `${squadCount}/${MAX_SQUAD_SIZE}`;

  // 移籍市場バッジ：グローバル移籍市場（全20クラブの登録選手総数）を表示
  const totalMarketPlayers = (gameState.clubs || []).reduce((sum, c) => sum + (c.players ? c.players.length : 0), 0);
  const marketBadge = document.getElementById('tab-badge-market');
  if (marketBadge) {
    marketBadge.textContent = `${totalMarketPlayers}名`;
    if (gameState.isSeasonOver || (currentDay && currentDay.windowOpen)) {
      marketBadge.classList.add('badge-highlight');
    } else {
      marketBadge.classList.remove('badge-highlight');
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
      // 本日未消化の試合日
      if (btnPlayMatch) {
        btnPlayMatch.classList.remove('hidden');
        const matchWeekNum = currentDay ? currentDay.matchWeek : gameState.currentWeek + 1;
        btnPlayMatch.innerHTML = `<span class="btn-large-sub mono">MATCHDAY READY</span><span class="btn-large-title">キックオフ（第${matchWeekNum}節）</span>`;
      }
      if (btnAdvanceDay) btnAdvanceDay.classList.remove('hidden');
      if (btnAdvanceToMatch) btnAdvanceToMatch.classList.remove('hidden');
    } else {
      // 通常平日、または本日の試合消化済み
      if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
      if (btnAdvanceDay) btnAdvanceDay.classList.remove('hidden');
      if (btnAdvanceToMatch) btnAdvanceToMatch.classList.remove('hidden');
    }
  }
}

/**
 * 赤字経営・ゲームオーバー警告バナーの描画
 */
function renderFinancialAlert() {
  const banner = document.getElementById('financial-alert-banner');
  const playerClub = getPlayerClub();

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
  const sorted = getSortedStandings();
  const tbody = document.getElementById('standings-tbody');
  document.getElementById('standings-status-text').textContent = `MATCHWEEK ${gameState.currentWeek} / ${gameState.totalWeeks}`;

  tbody.innerHTML = sorted.map((club, idx) => {
    const rank = idx + 1;
    const rowClass = club.isPlayer ? 'row-player-club' : '';
    const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
    const gdSign = club.gd > 0 ? `+${club.gd}` : `${club.gd}`;

    return `
      <tr class="${rowClass}">
        <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span></td>
        <td class="col-team">${club.name}</td>
        <td class="col-num">${club.played}</td>
        <td class="col-num">${club.won}</td>
        <td class="col-num">${club.drawn}</td>
        <td class="col-num">${club.lost}</td>
        <td class="col-num">${club.gf}</td>
        <td class="col-num">${club.ga}</td>
        <td class="col-num">${gdSign}</td>
        <td class="col-pts">${club.pts}</td>
      </tr>
    `;
  }).join('');
}

/**
 * リーグ得点ランキング（TOP 5）の描画
 */
function renderTopScorers() {
  const tbody = document.getElementById('top-scorers-tbody');
  if (!tbody) return;

  const allPlayers = [];
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      if (p.appearances > 0 || p.goals > 0) {
        const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(1) : '-';
        allPlayers.push({
          player: p,
          clubName: club.name,
          isPlayerClub: club.isPlayer,
          avgRating
        });
      }
    }
  }

  allPlayers.sort((a, b) => {
    if (b.player.goals !== a.player.goals) {
      return b.player.goals - a.player.goals;
    }
    const rateA = parseFloat(a.avgRating) || 0;
    const rateB = parseFloat(b.avgRating) || 0;
    return rateB - rateA;
  });

  const top5 = allPlayers.slice(0, 5);

  if (top5.length === 0 || top5[0].player.goals === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-log-message">まだ得点記録がありません。試合が進行すると得点者ランキングが表示されます。</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = top5.map((item, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
    const rowClass = item.isPlayerClub ? 'row-player-club' : '';

    return `
      <tr class="${rowClass}">
        <td class="col-rank"><span class="${rankClass}">${rank}</span></td>
        <td class="col-pos">${formatPlayerPositionsHtml(item.player)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${item.player.id}" title="クリックで選手詳細プロフィールを表示">
            ${item.player.name}
          </button>
        </td>
        <td class="col-team">${item.clubName}</td>
        <td class="col-num">${item.player.appearances}</td>
        <td class="col-num accent-gold"><strong>${item.player.goals}</strong></td>
        <td class="col-num accent-green">${item.avgRating}</td>
      </tr>
    `;
  }).join('');
}

/**
 * 試合結果ログおよびテキスト速報の描画
 */
function renderMatchLog() {
  if (gameState.isSimulating) {
    return;
  }

  const container = document.getElementById('match-results-container');
  const panelTitle = document.getElementById('log-panel-title');
  const subtitle = document.getElementById('log-panel-subtitle');
  if (!container) return;

  const playerClub = getPlayerClub();
  const currentDay = getCurrentCalendarDay();
  const isMatchPending = isTodayMatchDayPending();

  // パターン1：本日が未消化の試合日（MATCHDAY）
  if (isMatchPending && currentDay && currentDay.matchFixture) {
    if (panelTitle) panelTitle.textContent = 'MATCHDAY - 本日の試合';
    if (subtitle) subtitle.textContent = `第${currentDay.matchWeek}節 KICKOFF READY`;

    const myMatch = currentDay.matchFixture.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    let myMatchHtml = '';
    if (myMatch) {
      const home = getClubById(myMatch.homeId);
      const away = getClubById(myMatch.awayId);
      const homeOvr = Math.round(home.players.slice(0, 11).reduce((s, p) => s + getPlayerOverallRating(p), 0) / 11);
      const awayOvr = Math.round(away.players.slice(0, 11).reduce((s, p) => s + getPlayerOverallRating(p), 0) / 11);

      myMatchHtml = `
        <div class="matchday-card-preview">
          <div class="matchday-preview-header">
            <span class="matchday-badge-big">第${currentDay.matchWeek}節 公式戦</span>
            <span class="mono accent-green">${currentDay.displayDate}</span>
          </div>
          <div class="matchday-vs-hero">
            <div class="matchday-club-side ${home.isPlayer ? 'is-player-side' : ''}">
              <span class="matchday-club-name">${home.name}</span>
              <span class="matchday-club-ovr">OVR ${homeOvr} ${home.isPlayer ? '(自チーム)' : ''}</span>
            </div>
            <div class="matchday-vs-badge">VS</div>
            <div class="matchday-club-side ${away.isPlayer ? 'is-player-side' : ''}">
              <span class="matchday-club-name">${away.name}</span>
              <span class="matchday-club-ovr">OVR ${awayOvr} ${away.isPlayer ? '(自チーム)' : ''}</span>
            </div>
          </div>
          <div class="matchday-action-row">
            <button type="button" class="btn btn-primary btn-kickoff-pulse" id="btn-panel-kickoff">
              キックオフ（第${currentDay.matchWeek}節を開始）
            </button>
          </div>
        </div>
      `;
    }

    const otherMatches = currentDay.matchFixture.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id));
    const otherMatchesHtml = `
      <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">同日開催カード（他9試合）</div>
      ${otherMatches.map(m => {
        const h = getClubById(m.homeId);
        const a = getClubById(m.awayId);
        return `
          <div class="match-card">
            <div class="match-team home">${h.name}</div>
            <div class="match-score-box">VS</div>
            <div class="match-team away">${a.name}</div>
          </div>
        `;
      }).join('')}
    `;

    container.innerHTML = myMatchHtml + otherMatchesHtml;

    // パネル内のキックオフボタンのイベントバインド
    const panelKickoffBtn = document.getElementById('btn-panel-kickoff');
    if (panelKickoffBtn) {
      panelKickoffBtn.addEventListener('click', () => playCurrentMatchday(false));
    }
    return;
  }

  // パターン2：試合直後または試合消化済み
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

  const formationLabelEl = document.getElementById('roster-formation-label');
  if (formationLabelEl) {
    formationLabelEl.textContent = formationDef.name;
  }

  const pitchLayer = document.getElementById('pitch-nodes-layer');
  if (pitchLayer) {
    pitchLayer.innerHTML = formationDef.slots.map(sl => {
      const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === sl.slotIndex);
      if (!starter) return '';

      const fitInfo = getPositionFitInfo(starter, sl.pos);
      const posDisplay = formatPlayerPositionsText(starter, 'slash');
      const isSelected = gameState.selectedSlotIndex === sl.slotIndex;
      const effOvr = getEffectivePlayerRating(starter);
      const roleGroup = POS_ROLE_GROUP[sl.pos] || 'MF';

      const nodeClasses = [
        'pitch-node',
        `pos-group-${roleGroup}`,
        fitInfo.type === 'sub' ? 'sub-pos' : '',
        fitInfo.type === 'out' ? 'out-of-pos' : '',
        isSelected ? 'selected' : ''
      ].filter(Boolean).join(' ');

      let fitBadgeHtml = '';
      if (fitInfo.type === 'sub') {
        fitBadgeHtml = `<span class="pitch-node-subpos" title="サブ適性配置（実効能力92%）">SUB-POS</span>`;
      } else if (fitInfo.type === 'out') {
        fitBadgeHtml = `<span class="pitch-node-warn" title="適性外配置（実効能力80%）">-20%</span>`;
      }

      const injuryBadgeHtml = starter.injuryWeeks > 0
        ? `<span class="pitch-node-injury" title="負傷中（残り${starter.injuryWeeks}節）">傷</span>`
        : '';

      return `
        <div class="${nodeClasses}" data-slot-index="${sl.slotIndex}" style="left: ${sl.x}%; top: ${sl.y}%;" title="枠クリックで交代対象選択 / 選手名クリックでプロフィール表示">
          <div class="pitch-node-top">
            <span class="pitch-node-pos">${sl.pos}</span>
            <span class="pitch-node-ovr">OVR ${effOvr}</span>
          </div>
          <button type="button" class="pitch-node-name-btn clickable-player-name" data-profile-id="${starter.id}" title="クリックで選手詳細プロフィールを表示">
            #${starter.squadNumber || '-'} ${starter.name}
          </button>
          <div class="pitch-node-meta">
            <span class="pitch-node-pref">${posDisplay}</span>
            ${fitBadgeHtml}
            ${injuryBadgeHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // 右側：控え（ベンチ）選手ワンクリック交代リスト描画
  const subTitleEl = document.getElementById('pitch-sub-title');
  const clearBtnEl = document.getElementById('btn-clear-slot-select');
  const subGuideEl = document.getElementById('pitch-sub-guide');
  const benchListEl = document.getElementById('pitch-bench-list');

  if (!benchListEl) return;

  const benchPlayers = playerClub.players.filter(p => !p.isStarter && !p.isRetired);
  const selectedSlot = gameState.selectedSlotIndex !== null ? formationDef.slots[gameState.selectedSlotIndex] : null;
  const selectedStarter = selectedSlot
    ? playerClub.players.find(p => p.isStarter && p.slotIndex === selectedSlot.slotIndex)
    : null;

  if (selectedSlot && selectedStarter) {
    const starterEff = getEffectivePlayerRating(selectedStarter);
    subTitleEl.textContent = `交代対象：[${selectedSlot.pos}] #${selectedStarter.squadNumber} ${selectedStarter.name} (実効OVR ${starterEff})`;
    clearBtnEl.classList.remove('hidden');
    subGuideEl.textContent = `下の控え選手の「交代投入」を押すと [${selectedSlot.pos}] 枠へ即座に投入します（サブ適性は水色 SUB-POS 92% として計算されます）。`;

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
        const baseOvr = getPlayerOverallRating(bp);

        let itemClass = 'fit-mismatch';
        let fitTag = `<span class="bench-fit-tag fit-warn">適性外 80% OVR ${simOvr} (${baseOvr})</span>`;
        if (fitInfo.type === 'main') {
          itemClass = 'fit-match';
          fitTag = `<span class="bench-fit-tag fit-ok">MAIN 100% OVR ${simOvr}</span>`;
        } else if (fitInfo.type === 'sub') {
          itemClass = 'fit-sub';
          fitTag = `<span class="bench-fit-tag fit-sub">SUB-POS 92% OVR ${simOvr} (${baseOvr})</span>`;
        }

        return `
          <div class="bench-sub-item ${itemClass}">
            <div class="bench-sub-info">
              ${formatPlayerPositionsHtml(bp)}
              <button type="button" class="player-name-link bench-sub-name clickable-player-name" data-profile-id="${bp.id}" title="クリックで選手詳細プロフィールを表示">
                #${bp.squadNumber || '-'} ${bp.name}
              </button>
            </div>
            <div class="bench-sub-stats">
              ${fitTag}
              <button type="button" class="btn btn-primary btn-sm btn-sub-bench" data-sub-bench-id="${bp.id}">交代投入</button>
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    subTitleEl.textContent = `控え（ベンチ）選手一覧（${benchPlayers.length}名）`;
    clearBtnEl.classList.add('hidden');
    subGuideEl.textContent = `ピッチ上の枠をクリックすると適性比較・交代ができます。選手名をクリックするとスカウティングシート（詳細プロフィール）が開きます。`;

    const sortedBench = [...benchPlayers].sort((a, b) => {
      const orderA = POS_DISPLAY_ORDER[a.pos] || 99;
      const orderB = POS_DISPLAY_ORDER[b.pos] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });

    if (sortedBench.length === 0) {
      benchListEl.innerHTML = `<div class="empty-log-message">控え選手がいません。</div>`;
    } else {
      benchListEl.innerHTML = sortedBench.map(bp => {
        const prefPos = bp.primaryPosition || bp.preferredPosition || bp.pos;
        const subs = Array.isArray(bp.secondaryPositions) ? bp.secondaryPositions : [];
        const baseOvr = getPlayerOverallRating(bp);
        const hasMainSlot = formationDef.slots.some(sl => sl.pos === prefPos);
        const hasSubSlot = formationDef.slots.some(sl => subs.includes(sl.pos));

        let fitTag = `<span class="bench-fit-tag fit-warn">${formationDef.name}枠外 (OVR ${baseOvr})</span>`;
        if (hasMainSlot) {
          fitTag = `<span class="bench-fit-tag fit-ok">MAIN適性あり (OVR ${baseOvr})</span>`;
        } else if (hasSubSlot) {
          fitTag = `<span class="bench-fit-tag fit-sub">SUB-POS対応 (OVR ${baseOvr})</span>`;
        }

        return `
          <div class="bench-sub-item">
            <div class="bench-sub-info">
              ${formatPlayerPositionsHtml(bp)}
              <button type="button" class="player-name-link bench-sub-name clickable-player-name" data-profile-id="${bp.id}" title="クリックで選手詳細プロフィールを表示">
                #${bp.squadNumber || '-'} ${bp.name}
              </button>
            </div>
            <div class="bench-sub-stats">
              ${fitTag}
              <button type="button" class="btn btn-secondary btn-sm btn-sub-bench" data-sub-bench-id="${bp.id}">最適枠へ投入</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

/**
 * 自チーム登録選手一覧の描画（9ポジション順ソート、メイン100%/サブ92%/適性外80%、契約延長ボタン含む）
 */
function renderRoster() {
  const playerClub = getPlayerClub();
  renderTacticalBoard();

  const stats = getTeamStarterStats(playerClub);
  const payroll = getClubTotalPayroll(playerClub);

  document.getElementById('team-total-atk').textContent = Math.round(stats.totalAtk);
  document.getElementById('team-total-def').textContent = Math.round(stats.totalDef);
  document.getElementById('team-avg-sta').textContent = stats.avgSta;
  document.getElementById('roster-total-payroll').textContent = formatMoney(payroll);

  const currentTactic = playerClub.tactic || 'possession';
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

    const growthLabel = getGrowthCurveLabel(p.growthCurve);
    const growthBadge = `<span class="growth-pill growth-${p.growthCurve}">${growthLabel}</span>`;

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

    const starterToggleBtn = p.isStarter
      ? `<button type="button" class="btn btn-starter-toggle btn-starter-active" data-starter-id="${p.id}" title="クリックでベンチと入替">スタメン</button>`
      : `<button type="button" class="btn btn-starter-toggle btn-bench-active" data-starter-id="${p.id}" title="クリックでスタメンへ昇格">ベンチ</button>`;

    let assignedPosHtml = '<span class="mono text-muted">-</span>';
    if (p.isStarter) {
      const selectFitClass = fitInfo.type === 'sub' ? 'slot-sub' : (fitInfo.type === 'out' ? 'slot-mismatch' : '');
      const optionsHtml = ALL_POSITIONS.map(posOpt => {
        const selected = posOpt === assignedSlot ? 'selected' : '';
        return `<option value="${posOpt}" ${selected}>${posOpt}</option>`;
      }).join('');
      assignedPosHtml = `
        <select class="slot-select ${selectFitClass}" data-slot-player-id="${p.id}" title="配置ポジション枠を変更（サブ適性92% / 適性外80%）">
          ${optionsHtml}
        </select>
      `;
    }

    let fitBadge = '';
    if (p.isStarter && fitInfo.type === 'sub') {
      fitBadge = '<span class="sub-badge badge-subpos">SUB-POS 92%</span>';
    } else if (p.isStarter && fitInfo.type === 'out') {
      fitBadge = '<span class="sub-badge badge-penalty">適性外-20%</span>';
    }

    const injuryBadge = p.injuryWeeks > 0 ? `<span class="sub-badge badge-injury">負傷:残${p.injuryWeeks}節</span>` : '';
    const refusedBadge = p.contractRefused ? `<span class="sub-badge badge-refused">流出確定</span>` : '';
    const moraleBadge = (!p.contractRefused && p.megaOfferRejected) ? `<span class="sub-badge badge-morale-down">昇給要求</span>` : '';

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
        <td class="col-status">${starterToggleBtn}</td>
        <td class="col-pos">${assignedPosHtml}</td>
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="クリックで選手詳細プロフィールを表示">
            <span class="mono text-muted">#${p.squadNumber || '-'}</span> ${p.name}
          </button>
          ${fitBadge}${injuryBadge}${refusedBadge}${moraleBadge}
        </td>
        <td class="col-num">${p.age}</td>
        <td class="col-num accent-green">${ovrDisplay}</td>
        <td class="col-growth">${growthBadge}</td>
        <td class="col-num">${p.appearances}</td>
        <td class="col-num accent-gold"><strong>${p.goals}</strong></td>
        <td class="col-num accent-green">${avgRating}</td>
        <td class="col-num">${p.atk}${atkDiff}</td>
        <td class="col-num">${p.def}${defDiff}</td>
        <td class="col-num">${p.sta}${staDiff}</td>
        <td class="col-num ${contractClass}">${contractText}</td>
        <td class="col-num mono" title="年間総給与: ${formatMoney(p.salary)}">
          <strong>${formatWage(p.wage || Math.round(p.salary / 52))}</strong><br>
          <span class="text-muted" style="font-size:10px;">(${formatMoney(p.salary)})</span>
        </td>
        <td class="col-action">
          <div class="action-btn-group">
            ${extendBtnHtml}
            ${demoteBtnHtml}
            <button type="button" class="btn btn-danger btn-sm btn-release-player" data-release-id="${p.id}" ${canRelease ? '' : 'disabled'}>
              ${releaseBtnLabel}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 全20クラブの全所属選手を網羅するグローバル移籍市場の描画
 */
function renderMarket() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const squadCount = playerClub.players.length;
  const isFull = squadCount >= MAX_SQUAD_SIZE;

  // クラブ選択プルダウンのオプション生成（初回またはクラブ数変更時）
  const clubSelect = document.getElementById('market-filter-club');
  if (clubSelect && clubSelect.options.length <= 1) {
    clubSelect.innerHTML = `
      <option value="ALL">全20クラブ (ALL CLUBS)</option>
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

    switch (mf.sortKey) {
      case 'ovr-desc':
        return ovrB - ovrA;
      case 'fee-desc':
        return feeB - feeA;
      case 'fee-asc':
        return feeA - feeB;
      case 'wage-desc':
        return (pB.wage || 0) - (pA.wage || 0);
      case 'age-asc':
        return pA.age - pB.age;
      case 'contract-asc':
        return pA.contractYears - pB.contractYears || feeA - feeB;
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
    const fee = calculateTransferFee(p);
    const isBargain = p.contractYears === 1;
    const bargainBadge = isBargain ? '<span class="sub-badge badge-bargain">残1年・約50%割安</span>' : '';
    const myClubBadge = entry.isMyClub ? '<span class="sub-badge" style="background: rgba(46,204,113,0.2); color: #2ecc71; border: 1px solid #2ecc71;">自クラブ所属</span>' : '';
    const failedBadge = p.negotiationFailed ? '<span class="sub-badge badge-refused">交渉決裂</span>' : '';

    let actionBtnHtml = '';
    if (entry.isMyClub) {
      actionBtnHtml = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="switchTab('roster');" title="自クラブの編成一覧へ移動">
          所属管理
        </button>
      `;
    } else {
      const canAfford = playerClub.funds >= fee;
      const isFailed = Boolean(p.negotiationFailed);
      const canOffer = !isFull && canAfford && !isFailed && !gameState.isGameOver && !gameState.isSimulating;

      let btnText = '獲得オファー';
      if (isFailed) btnText = '交渉決裂済';
      else if (isFull) btnText = '登録枠上限';
      else if (!canAfford) btnText = '予算不足';

      actionBtnHtml = `
        <button type="button" class="btn btn-primary btn-sm btn-offer-transfer" data-offer-id="${p.id}" data-offer-player-id="${p.id}" ${canOffer ? '' : 'disabled'}>
          ${btnText}
        </button>
      `;
    }

    return `
      <tr>
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="スカウティングレポートを表示">
            ${p.name}
          </button>
          ${bargainBadge}${myClubBadge}${failedBadge}
        </td>
        <td class="col-team"><strong>${c.name}</strong></td>
        <td class="col-num">${p.age}歳</td>
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
        <td colspan="10" class="empty-log-message" style="text-align: center; padding: 20px;">
          現在ユースチーム所属選手はいません。シーズン終了時に新星アカデミー生が加入します。
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = youthList.map(y => {
    const ovr = getPlayerOverallRating(y);
    const potClass = `badge-potential-${(y.potential || 'B').toLowerCase()}`;
    const potLabel = `★ ${y.potential || 'B'} ランク`;
    const growthLabel = getGrowthCurveLabel(y.growthCurve);

    return `
      <tr>
        <td class="col-pos"><span class="pos-tag pos-${y.pos}">${y.pos}</span></td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${y.id}" title="詳細プロフィールを表示">
            ${y.name}
          </button>
        </td>
        <td class="col-num">${y.age}歳</td>
        <td class="col-num accent-green"><strong>${ovr}</strong></td>
        <td class="col-growth"><span class="sub-badge ${potClass}">${potLabel}</span></td>
        <td class="col-growth"><span class="growth-pill growth-${y.growthCurve}">${growthLabel}</span></td>
        <td class="col-num">${y.atk}</td>
        <td class="col-num">${y.def}</td>
        <td class="col-num mono">${formatWage(y.wage || 2)}</td>
        <td class="col-action">
          <button type="button" class="btn btn-primary btn-sm btn-promote-youth-direct" data-youth-promote-id="${y.id}" ${canPromote ? '' : 'disabled'}>
            ${topCount >= MAX_SQUAD_SIZE ? 'トップ枠上限' : 'トップ昇格（プロ契約）'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
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
      badge: '必須 / CRITICAL',
      title: '財政危機対応（債務超過の解消）',
      desc: `現在のクラブ資金が ${formatMoney(playerClub.funds)} の赤字です。高年俸選手の自由契約（放出）で年俸総額を圧縮してください。`,
      btnText: '契約・編成へ移動',
      action: 'goto-roster-table'
    };
  } else if (gameState.isSeasonOver) {
    criticalDuty = {
      level: 'critical',
      badge: '必須 / CRITICAL',
      title: `第${gameState.season + 1}シーズン 開幕手続き`,
      desc: 'オフシーズンの補強・契約更新・ユース昇格審査を終えたら、新シーズンを開幕してください。',
      btnText: '次シーズン開幕',
      action: 'start-next-season'
    };
  } else {
    const nextWeek = Math.min(gameState.currentWeek + 1, gameState.totalWeeks);
    let opponentText = 'リーグ公式戦';
    const weekFixtures = gameState.schedule && gameState.schedule[gameState.currentWeek];
    if (weekFixtures) {
      const myFixture = weekFixtures.find(f => f.homeId === playerClub.id || f.awayId === playerClub.id);
      if (myFixture) {
        const oppId = myFixture.homeId === playerClub.id ? myFixture.awayId : myFixture.homeId;
        const oppClub = getClubById(oppId);
        const venue = myFixture.homeId === playerClub.id ? 'HOME' : 'AWAY';
        if (oppClub) opponentText = `vs ${oppClub.name} (${venue})`;
      }
    }
    criticalDuty = {
      level: 'critical',
      badge: '必須 / CRITICAL',
      title: `第${nextWeek}節 キックオフ（${opponentText}）`,
      desc: 'スタメン11名と戦術を確認し、今節の公式戦シミュレーションを実行してください。',
      btnText: '第' + nextWeek + '節を実行',
      action: 'play-match'
    };
  }
  duties.push(criticalDuty);

  // 2. 推奨タスク（RECOMMENDED / 黄）
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
      badge: '推奨 / RECOMMENDED',
      title: `負傷者の代役選定（スタメン負傷 ${injuredStarters.length}名）`,
      desc: `${injuredStarters[0].name} ほか計${injuredStarters.length}名が負傷中です。作戦ボードで控え選手との交代を推奨します。`,
      btnText: '作戦ボードへ移動',
      action: 'goto-pitch'
    };
  } else if (urgentExpiring.length > 0) {
    const topTarget = urgentExpiring[0];
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨 / RECOMMENDED',
      title: `契約延長交渉（残り1年以下・昇給要求：${urgentExpiring.length}名）`,
      desc: `#${topTarget.squadNumber || '-'} ${topTarget.name} ら${urgentExpiring.length}名が契約更新時期を迎えています。交渉画面または契約一覧から引き止め交渉を行ってください。`,
      btnText: '契約一覧へ移動',
      action: 'goto-roster-table'
    };
  } else if (outOfPosStarters.length > 0) {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨 / RECOMMENDED',
      title: `適性外配置の見直し（${outOfPosStarters.length}枠）`,
      desc: `${outOfPosStarters[0].name} が適性外スロット（能力80%）に配置されています。フォーメーションまたは配置の調整を推奨します。`,
      btnText: '作戦ボードへ移動',
      action: 'goto-pitch'
    };
  } else if (expiringPlayers.length > 0) {
    const topTarget = expiringPlayers[0];
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨 / RECOMMENDED',
      title: `契約延長交渉（残り2年以内：${expiringPlayers.length}名）`,
      desc: `#${topTarget.squadNumber || '-'} ${topTarget.name} ら${expiringPlayers.length}名と早期の契約延長交渉が可能です。`,
      btnText: '契約一覧へ移動',
      action: 'goto-roster-table'
    };
  } else {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨 / RECOMMENDED',
      title: '戦術・コンディション点検',
      desc: 'スタメン全員が適性枠かつ健康です。対戦相手に応じたフォーメーションや戦術方針の微調整を行えます。',
      btnText: '作戦ボードを確認',
      action: 'goto-pitch'
    };
  }
  duties.push(recommendedDuty);

  // 3. 任意タスク（OPTIONAL / 緑）
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
      badge: '任意 / OPTIONAL',
      title: `U-21ユース視察・昇格検討（在籍 ${youthSquad.length}名 / トップ枠空きあり）`,
      desc: `U-21アカデミーに16〜19歳の若手有望株${youthSquad.length}名が在籍しています。トップ登録枠（現在 ${topCount}/${MAX_SQUAD_SIZE}名）に昇格させプロ契約を締結することが可能です。`,
      btnText: 'ユース一覧へ移動',
      action: 'goto-youth'
    };
  } else if (playerClub.funds >= minUpgradeCost && minUpgradeCost !== Infinity) {
    optionalDuty = {
      level: 'optional',
      badge: '任意 / OPTIONAL',
      title: 'クラブ設備投資の検討',
      desc: `現在の予算（${formatMoney(playerClub.funds)}）でスタジアム・練習施設・スカウト網のレベルアップが可能です。`,
      btnText: '施設投資へ移動',
      action: 'goto-facilities'
    };
  } else {
    const totalMarketPlayers = (gameState.clubs || []).reduce((sum, c) => sum + (c.players ? c.players.length : 0), 0);
    optionalDuty = {
      level: 'optional',
      badge: '任意 / OPTIONAL',
      title: `移籍市場スカウティング（全20クラブ ${totalMarketPlayers}名）`,
      desc: 'グローバル移籍市場から掘り出し物（契約残り1年の格安選手や若手有望株）の獲得交渉を行えます。',
      btnText: '移籍市場へ移動',
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

      let btnLabel = isMax ? 'MAX LEVEL 達成済' : `Lv.${lv + 1} へ投資する（${formatMoney(nextCost)}）`;
      if (!isMax && playerClub.funds < nextCost) {
        btnLabel = `資金不足（必要: ${formatMoney(nextCost)}）`;
      }

      return `
        <div class="facility-card">
          <div class="facility-card-header">
            <div>
              <span class="facility-code">${def.iconLabel || def.code || 'FACILITY'}</span>
              <h3 class="facility-name">${def.name}</h3>
            </div>
            <span class="facility-level-badge">Lv.${lv} / ${def.maxLevel}</span>
          </div>

          <div class="facility-pips-row">
            ${pipsHtml}
          </div>

          <p class="facility-desc">${def.desc}</p>

          <div class="facility-effect-box">
            <div class="facility-effect-row">
              <span class="text-muted">現在の稼働効果</span>
              <span class="facility-effect-current">${typeof def.getEffectText === 'function' ? def.getEffectText(lv) : ''}</span>
            </div>
            <div class="facility-effect-row">
              <span class="text-muted">次段階の強化効果</span>
              <span class="facility-effect-next">${typeof def.getNextEffectText === 'function' ? def.getNextEffectText(lv) : (isMax ? '最大拡張レベル達成済' : '効果増大')}</span>
            </div>
          </div>

          <div class="facility-card-footer">
            <div>
              <span class="facility-cost-label">${isMax ? 'STATUS' : 'NEXT INVESTMENT'}</span>
              <span class="facility-cost-val">${isMax ? '最大拡張済' : formatMoney(nextCost)}</span>
            </div>
            <button type="button" class="btn btn-primary btn-sm" data-upgrade-facility="${key}" ${canAfford ? '' : 'disabled'}>
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
            <div class="youth-stat-cell">
              <span class="youth-stat-cell-label">成長曲線</span>
              <span class="growth-pill growth-${y.growthCurve}">${growthLabel}</span>
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
  }
}

/**
 * 全クラブ・移籍市場・ユース候補から指定IDの選手と所属情報を検索する
 */
function findPlayerWithContextById(playerId) {
  for (const club of gameState.clubs) {
    const found = club.players.find(p => p.id === playerId);
    if (found) {
      return { player: found, clubName: club.name, isMarket: false, isPlayerClub: club.isPlayer };
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
 * 選手詳細プロフィールモーダル（スカウティングシート風UI）を開いて描画する
 */
function openPlayerProfileModal(playerId) {
  const ctx = findPlayerWithContextById(playerId);
  if (!ctx) return;

  const { player: p, clubName, isMarket } = ctx;
  gameState.profileModalPlayerId = p.id;

  const primaryPos = p.primaryPosition || p.preferredPosition || p.pos;
  const subPosList = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];
  const baseOvr = getPlayerOverallRating(p);
  const effOvr = getEffectivePlayerRating(p);
  const growthLabel = getGrowthCurveLabel(p.growthCurve);
  const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';

  const footLabelMap = {
    Right: 'Right（右利き）',
    Left: 'Left（左利き）',
    Both: 'Both（両足）'
  };
  const footText = footLabelMap[p.preferredFoot] || p.preferredFoot || 'Right（右利き）';
  const heightText = typeof p.height === 'number' ? `${p.height}cm` : (p.height || '180cm');
  const rawNat = p.nationality || 'England';
  const flagEmoji = NATIONALITY_FLAG_MAP[rawNat] || '🌍';
  const nationalityDisplay = `${flagEmoji} ${rawNat}`;
  const squadNumText = `#${p.squadNumber || 10}`;
  const traits = Array.isArray(p.traits) && p.traits.length > 0 ? p.traits : ['ハードワーカー'];
  const careerApps = p.careerStats ? p.careerStats.appearances : p.appearances;
  const careerGoals = p.careerStats ? p.careerStats.goals : p.goals;

  const attrs = getPlayerFiveAttributes(p);

  const squadNumEl = document.getElementById('profile-squad-num');
  if (squadNumEl) squadNumEl.textContent = squadNumText;

  const clubLabelEl = document.getElementById('profile-club-label');
  if (clubLabelEl) clubLabelEl.textContent = `SCOUTING REPORT — ${clubName}`;

  const posPillEl = document.getElementById('profile-pos-pill');
  if (posPillEl) {
    const subBadgesHtml = subPosList.length > 0
      ? subPosList.map(sp => `<span class="profile-pos-badge-sub">SUB: ${sp}</span>`).join(' ')
      : '<span class="profile-pos-badge-sub" style="opacity: 0.7;">SUB: なし</span>';
    posPillEl.innerHTML = `
      <div class="profile-pos-badges-wrap">
        <span class="profile-pos-badge-main">MAIN: ${primaryPos}</span>
        ${subBadgesHtml}
      </div>
    `;
  }

  const nameEl = document.getElementById('profile-player-name');
  if (nameEl) {
    if (p.fullName && p.fullName !== p.name) {
      nameEl.innerHTML = `${p.name} <span class="profile-fullname-sub" style="font-size: 0.6em; font-weight: 500; color: var(--text-muted); margin-left: 8px;">(${p.fullName})</span>`;
    } else {
      nameEl.textContent = p.name;
    }
  }

  const bioRowEl = document.getElementById('profile-bio-row');
  if (bioRowEl) {
    bioRowEl.innerHTML = `
      <span class="profile-bio-item">国籍:<strong>${nationalityDisplay}</strong></span>
      <span>|</span>
      <span class="profile-bio-item">年齢:<strong>${p.age}歳</strong></span>
      <span>|</span>
      <span class="profile-bio-item">利き足:<strong>${footText}</strong></span>
      <span>|</span>
      <span class="profile-bio-item">身長:<strong>${heightText}</strong></span>
    `;
  }

  let currentSlotBanner = '';
  if (p.isStarter && p.assignedPos) {
    const fitInfo = getPositionFitInfo(p, p.assignedPos);
    const fitColorClass = fitInfo.type === 'main' ? 'accent-green' : (fitInfo.type === 'sub' ? 'text-cyan' : 'accent-gold');
    currentSlotBanner = `
      <div class="profile-fit-row" style="margin-top: 4px; border-color: rgba(46, 204, 113, 0.4);">
        <span class="text-muted">現在のスタメン配置枠: <strong class="mono">${p.assignedPos}</strong></span>
        <span class="mono ${fitColorClass}"><strong>${fitInfo.label} (実効OVR ${effOvr})</strong></span>
      </div>
    `;
  }

  // 5大能力パラメータ定義（決定力・パス・スピード・守備・スタミナ）
  const paramItems = [
    { label: '決定力（Finishing）', val: attrs.finishing },
    { label: 'パス（Passing）', val: attrs.passing },
    { label: 'スピード（Pace）', val: attrs.pace },
    { label: '守備（Defending）', val: attrs.defending },
    { label: 'スタミナ（Stamina）', val: attrs.stamina }
  ];

  const statRowsHtml = paramItems.map(item => {
    const tier = getStatTierClass(item.val);
    const clampedVal = clamp(item.val, 5, 100);
    return `
      <div class="profile-stat-row">
        <span class="profile-stat-label">${item.label}</span>
        <span class="profile-stat-val ${tier.valClass}">${item.val}</span>
        <div class="profile-stat-bar-bg">
          <div class="profile-stat-bar-fill ${tier.barClass}" style="width: ${clampedVal}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  const bodyEl = document.getElementById('profile-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="profile-section-grid">
        <!-- 左：5大パラメータバー（80以上:緑 / 70台:黄 / 60台:灰）＆ 成長タイプ・特徴タグ -->
        <div class="profile-box">
          <div class="profile-box-header">
            <span class="profile-box-title">ABILITY PARAMETERS（能力値）</span>
            <span class="profile-ovr-badge">OVR ${baseOvr}</span>
          </div>

          <div class="profile-stat-rows">
            ${statRowsHtml}
          </div>

          <div class="profile-box-header" style="margin-top: 6px;">
            <span class="profile-box-title">TRAITS & GROWTH（特徴・成長曲線）</span>
            <span class="growth-pill growth-${p.growthCurve}">成長：${growthLabel}</span>
          </div>
          <div class="profile-traits-wrap">
            ${traits.map(t => `<span class="profile-trait-tag">${t}</span>`).join('')}
          </div>
        </div>

        <!-- 右：複数ポジション適性マトリクス -->
        <div class="profile-box">
          <div class="profile-box-header">
            <span class="profile-box-title">POSITION SUITABILITY（適性・補正）</span>
          </div>
          <div class="profile-pos-fit-list">
            <div class="profile-fit-row">
              <span class="text-muted">メイン適性 (100%発揮)</span>
              <span class="pos-tag pos-${primaryPos}"><strong>${primaryPos}</strong> (OVR ${baseOvr})</span>
            </div>
            <div class="profile-fit-row">
              <span class="text-muted">サブ適性 (92% / SUB-POS)</span>
              <span class="mono text-cyan"><strong>${subPosList.length > 0 ? subPosList.join(' / ') : 'なし（専任）'}</strong></span>
            </div>
            <div class="profile-fit-row">
              <span class="text-muted">適性外配置時 (80%ペナルティ)</span>
              <span class="mono text-muted">OVR ${clamp(Math.round(baseOvr * 0.80), 1, 99)} 相当</span>
            </div>
            ${currentSlotBanner}
          </div>
        </div>
      </div>

      <!-- 下部：契約条件＆今季スタッツ・平均評価点・通算成績 -->
      <div class="profile-metrics-row">
        <div class="profile-metric-card">
          <span class="profile-metric-label">${isMarket ? 'DEMAND SALARY（要求年俸）' : 'CURRENT SALARY（現在年俸）'}</span>
          <span class="profile-metric-val accent-gold">${formatMoney(p.salary)}</span>
        </div>
        <div class="profile-metric-card">
          <span class="profile-metric-label">CONTRACT（契約残年数）</span>
          <span class="profile-metric-val">${p.contractYears}年${isMarket && p.transferFee ? ` (移籍金 ${formatMoney(p.transferFee)})` : ''}</span>
        </div>
        <div class="profile-metric-card">
          <span class="profile-metric-label">APPEARANCES（今季出場数）</span>
          <span class="profile-metric-val">${p.appearances} 試合</span>
        </div>
        <div class="profile-metric-card">
          <span class="profile-metric-label">GOALS（今季ゴール数）</span>
          <span class="profile-metric-val accent-green">${p.goals} 得点</span>
        </div>
        <div class="profile-metric-card">
          <span class="profile-metric-label">AVG RATING（平均評価点）</span>
          <span class="profile-metric-val accent-gold">${avgRating !== '-' ? `★ ${avgRating}` : '-'}</span>
        </div>
      </div>
    `;
  }

  const footerActionsEl = document.getElementById('profile-footer-actions');
  if (footerActionsEl) {
    const isYouth = (gameState.youthCandidates || []).some(y => y.id === p.id);
    let extraActionBtnHtml = '';
    if (ctx.isPlayerClub && !isYouth && p.contractYears <= 2) {
      extraActionBtnHtml = `<button type="button" class="btn btn-accent btn-sm" data-profile-negotiate-renewal="${p.id}" ${p.contractRefused ? 'disabled' : ''}>${p.contractRefused ? '交渉決裂（流出確定）' : '契約延長交渉を開く'}</button>`;
    } else if (isMarket) {
      extraActionBtnHtml = `<button type="button" class="btn btn-primary btn-sm" data-profile-negotiate-transfer="${p.id}" ${p.negotiationFailed ? 'disabled' : ''}>${p.negotiationFailed ? '移籍交渉決裂済' : '移籍獲得交渉を開く'}</button>`;
    }
    footerActionsEl.innerHTML = `
      ${extraActionBtnHtml}
      <button type="button" class="btn btn-secondary btn-sm" id="btn-close-profile-footer">閉じる</button>
    `;
  }

  const modalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (modalEl) {
    modalEl.classList.remove('hidden');
  }
}

/**
 * 選手詳細プロフィールモーダルを閉じる
 */
function closePlayerProfileModal() {
  const modalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (modalEl) {
    modalEl.classList.add('hidden');
  }
  gameState.profileModalPlayerId = null;
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
          <span class="detail-club-avatar mono">${getClubShortCode(club)}</span>
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
    summaryEl.innerHTML = `選択: <strong class="accent-green">${club.name}</strong> <span class="summary-sep">/</span> 目標: <strong>${club.targetLabel}</strong> <span class="summary-sep">/</span> 予算: <strong class="accent-gold">${formatMoney(club.initialFunds)}</strong>`;
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
    inputGm.value = gameState.gmName || 'A. ファーガソン';
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
  gameState.gmName = rawName.length > 0 ? rawName : 'A. ファーガソン';

  const overlay = document.getElementById('intro-modal-overlay');
  overlay.classList.add('hidden');
  setBodyModalLock(false);
  gameState.hasStartedOnce = true;

  setupNewGame(gameState.selectedClubId);
}

/**
 * 指定されたクラブIDをプレイヤー担当クラブとして新規ゲームをセットアップ
 */
function setupNewGame(playerClubId = gameState.selectedClubId) {
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
  gameState.lastWeekResults = [];
  gameState.lastMatchTicker = null;
  gameState.lastSettlement = null;
  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  gameState.facilities = { stadium: 1, training: 1, scouting: 1 };
  gameState.facilityFeedback = '';
  gameState.negotiationSession = null;
  gameState.pendingMegaOffer = null;

  gameState.clubs = CLUB_DEFINITIONS.map(def => {
    const isPlayer = def.id === gameState.selectedClubId;
    const club = {
      id: def.id,
      name: def.name,
      isPlayer,
      funds: def.initialFunds,
      supporters: def.supporters,
      targetRank: def.targetRank,
      targetLabel: def.targetLabel,
      tactic: def.defaultTactic,
      formation: '4-3-3',
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

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  gameState.calendar = generateSeasonCalendar(2025 + gameState.season, gameState.schedule);
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
function initGame() {
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
    btnPlayMatch.addEventListener('click', () => playCurrentMatchday(false));
  }
  const btnPauseAdvance = document.getElementById('btn-pause-advance');
  if (btnPauseAdvance) {
    btnPauseAdvance.addEventListener('click', stopAdvancingCalendar);
  }
  const btnPlayNext = document.getElementById('btn-play-next');
  if (btnPlayNext) {
    btnPlayNext.addEventListener('click', () => playCurrentMatchday(false));
  }
  document.getElementById('btn-skip-season').addEventListener('click', skipToSeasonEnd);
  document.getElementById('btn-next-season').addEventListener('click', startNextSeason);
  document.getElementById('btn-restart-game').addEventListener('click', () => openIntroModal(false));
  document.getElementById('btn-open-intro').addEventListener('click', () => openIntroModal(true));

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
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
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

  // 作戦ボード（ピッチ）上のスタメン枠ノードクリック（選手名クリック時はプロフィール表示）
  const pitchNodesLayer = document.getElementById('pitch-nodes-layer');
  if (pitchNodesLayer) {
    pitchNodesLayer.addEventListener('click', (e) => {
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
      const nodeEl = e.target.closest('.pitch-node');
      if (nodeEl && nodeEl.dataset.slotIndex !== undefined) {
        handlePitchNodeClick(parseInt(nodeEl.dataset.slotIndex, 10));
      }
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

  // 作戦ボード横の控え選手ワンクリック交代ボタン＆選手名クリック
  const pitchBenchList = document.getElementById('pitch-bench-list');
  if (pitchBenchList) {
    pitchBenchList.addEventListener('click', (e) => {
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
      const subBtn = e.target.closest('.btn-sub-bench');
      if (subBtn && subBtn.dataset.subBenchId) {
        substituteBenchPlayerToSlot(subBtn.dataset.subBenchId, gameState.selectedSlotIndex);
      }
    });
  }

  document.getElementById('tactics-btn-group').addEventListener('click', (e) => {
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

  document.getElementById('market-tbody').addEventListener('click', (e) => {
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

  // 常設ユースチーム（U-21 SQUAD）テーブルのイベント
  const youthSquadTbody = document.getElementById('youth-squad-tbody');
  if (youthSquadTbody) {
    youthSquadTbody.addEventListener('click', (e) => {
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
      const promoteBtn = e.target.closest('.btn-promote-youth-direct');
      if (promoteBtn && promoteBtn.dataset.promoteDirectId) {
        e.stopPropagation();
        promoteYouthPlayer(promoteBtn.dataset.promoteDirectId);
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
      gameState.marketFilter.club = e.target.value;
      renderMarket();
    });
  }
  if (marketFilterPos) {
    marketFilterPos.addEventListener('change', (e) => {
      gameState.marketFilter.pos = e.target.value;
      renderMarket();
    });
  }
  if (marketFilterSort) {
    marketFilterSort.addEventListener('change', (e) => {
      gameState.marketFilter.sort = e.target.value;
      renderMarket();
    });
  }
  if (marketFilterSearch) {
    marketFilterSearch.addEventListener('input', (e) => {
      gameState.marketFilter.search = e.target.value.trim().toLowerCase();
      renderMarket();
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

  // クラブ施設投資（アップグレードボタン）のイベント
  const facilitiesGrid = document.getElementById('facilities-grid');
  if (facilitiesGrid) {
    facilitiesGrid.addEventListener('click', (e) => {
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

  // 選手プロフィール詳細モーダルを閉じるイベント＆交渉起動イベント
  const closeProfileBtn = document.getElementById('btn-close-profile-modal');
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closePlayerProfileModal);
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
  const profileModalOverlay = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (profileModalOverlay) {
    profileModalOverlay.addEventListener('click', (e) => {
      if (e.target === profileModalOverlay) {
        closePlayerProfileModal();
      }
    });
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (gameState.incomingTransferOffer) {
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
  });

  // 背景のダッシュボードを初期描画した上で、初回起動時のGM就任モーダルを表示
  setupNewGame(gameState.selectedClubId);
  openIntroModal(false);
}

document.addEventListener('DOMContentLoaded', initGame);
