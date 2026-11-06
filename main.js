'use strict';

/**
 * 僕のサッカークラブ（仮） - English Premier GM Simulation
 * 外部ライブラリ非依存 / 純粋なJavaScript実装
 * 内部通貨単位：1 = £1K（1,000ポンド）。例：45000 = £45.0M、500 = £500K
 */

// イングランドリーグ（プレミア相当）全20クラブ定義（全クラブ選択可能・全38節2回戦総当たり）
// 初期資金：£16.0M〜£80.0M（16000〜80000 £K）、サポーター規模、目標順位に差を設定
const CLUB_DEFINITIONS = [
  {
    id: 'manchester_b',
    name: 'マンチェスター・B',
    tier: 'MEGA RICH',
    desc: '潤沢なオイルマネーと世界屈指の戦力を誇る現王者',
    basePower: 72,
    initialFunds: 80000, // £80.0M
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
    initialFunds: 72000, // £72.0M
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
    initialFunds: 66000, // £66.0M
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
    initialFunds: 60000, // £60.0M
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
    initialFunds: 55000, // £55.0M
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
    initialFunds: 50000, // £50.0M
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
    initialFunds: 48000, // £48.0M
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
    initialFunds: 40000, // £40.0M
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
    initialFunds: 34000, // £34.0M
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
    initialFunds: 35000, // £35.0M
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
    initialFunds: 30000, // £30.0M
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
    initialFunds: 28000, // £28.0M
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
    initialFunds: 25000, // £25.0M
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
    initialFunds: 26000, // £26.0M
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
    initialFunds: 24000, // £24.0M
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
    initialFunds: 23000, // £23.0M
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
    initialFunds: 22000, // £22.0M
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
    initialFunds: 20000, // £20.0M
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
    initialFunds: 18000, // £18.0M
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
    initialFunds: 16000, // £16.0M
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

// 所属選手の上限枠
const MAX_SQUAD_SIZE = 20;

// プレミア順位賞金テーブル（全20位、単位：£1K -> 1位 £25.0M 〜 20位 £2.0M）
const PRIZE_MONEY_TABLE = [
  25000, 21000, 18000, 16000, 14000,
  12500, 11000, 10000, 9000, 8200,
  7500, 6800, 6200, 5600, 5000,
  4500, 4000, 3200, 2600, 2000
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

// 欧州多国籍選手名リスト
const FIRST_INITIALS = [
  'L.', 'M.', 'J.', 'K.', 'A.', 'R.', 'D.', 'S.', 'F.', 'C.',
  'E.', 'G.', 'H.', 'P.', 'T.', 'V.', 'N.', 'B.', 'I.', 'O.'
];

const EUROPEAN_SURNAMES = [
  'マルティネス', 'シルヴァ', 'ロドリゲス', 'フェルナンデス', 'ガルシア', 'ロペス', 'ペレス', 'サンチェス', 'ゴメス', 'ディアス',
  'シュミット', 'ミュラー', 'シュナイダー', 'フィッシャー', 'ウェーバー', 'マイヤー', 'ワグナー', 'ベッカー', 'ホフマン', 'シェーファー',
  'ロッシ', 'ルッソ', 'フェラーリ', 'エスポジト', 'ビアンキ', 'ロマーノ', 'コロンボ', 'リッチ', 'マリノ', 'グレコ',
  'ベルナール', 'デュボワ', 'トーマ', 'ロベール', 'リシャール', 'プチ', 'デュラン', 'ルロワ', 'モロー', 'シモン',
  'スミス', 'ジョーンズ', 'テイラー', 'ブラウン', 'ウィリアムズ', 'ウィルソン', 'ジョンソン', 'デイヴィス', 'ロビンソン', 'ライト',
  'ウォーカー', 'トンプソン', 'ホワイト', 'ヒューズ', 'エドワーズ', 'グリーン', 'ホール', 'ルイス', 'ハリス', 'クラーク',
  'デ・ヨング', 'ファン・ダイク', 'ベルフワイン', 'コープマイネルス', 'ガクポ', 'シモンズ', 'ティンバー', 'アケ', 'マレン', 'デパイ',
  'ミトマ', 'クボ', 'カマダ', 'トミヤス', 'エンドウ', 'ナカムラ', 'イトウ', 'ミナミノ', 'ドウアン', 'フルハシ',
  'モドリッチ', 'コヴァチッチ', 'グヴァルディオル', 'ヴラホヴィッチ', 'ミリンコヴィッチ', 'シュクリニアル', 'ロボトカ', 'オブラク', 'ハキミ', 'サラー'
];

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
  activeTab: 'standings',
  clubs: [],
  europeanMegaClubs: [...EUROPEAN_MEGA_CLUBS],
  schedule: [],
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
  profileModalPlayerId: null
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
 * 選手の能力値と年齢に応じた年俸（単位：£1K、£800K〜£12.0M）を算出
 */
function calculatePlayerSalary(pos, atk, def, sta, age) {
  const ovr = getPlayerOverallRating({ pos, atk, def, sta });
  let baseSalary;
  if (ovr <= 58) {
    baseSalary = 800 + Math.max(0, ovr - 50) * 25;
  } else if (ovr <= 68) {
    baseSalary = 1000 + Math.pow(ovr - 58, 1.3) * 50;
  } else if (ovr <= 80) {
    baseSalary = 2000 + Math.pow(ovr - 68, 1.45) * 95;
  } else {
    baseSalary = 5500 + Math.pow(ovr - 80, 1.35) * 185;
  }

  let ageFactor = 1.0;
  if (age <= 20) ageFactor = 0.88;
  else if (age >= 26 && age <= 30) ageFactor = 1.05;
  else if (age >= 33) ageFactor = 0.90;

  const rounded = Math.round((baseSalary * ageFactor) / 50) * 50;
  return clamp(rounded, 800, 12000);
}

/**
 * 移籍市場での移籍金（単位：£1K）を算出
 * 契約残り1年の選手は格安（約50%OFF）で獲得可能
 */
function calculateTransferFee(player) {
  const ovr = getPlayerOverallRating(player);
  const ageBonus = player.age <= 23 ? 1.25 : (player.age >= 30 ? 0.65 : 1.0);
  let rawFee = player.salary * 1.15 * ageBonus + Math.max(0, ovr - 58) * 140;

  // 契約残り1年は格安（約50%OFF）、残り4〜5年はやや割増
  if (player.contractYears === 1) {
    rawFee *= 0.48;
  } else if (player.contractYears >= 4) {
    rawFee *= 1.15;
  }

  const rounded = Math.round(rawFee / 100) * 100;
  return clamp(rounded, 500, 28000);
}

/**
 * 重複しない欧州スタイル選手名を生成
 */
function generateUniqueName(usedNames) {
  let fullName = '';
  for (let i = 0; i < 120; i++) {
    const init = FIRST_INITIALS[randInt(0, FIRST_INITIALS.length - 1)];
    const surname = EUROPEAN_SURNAMES[randInt(0, EUROPEAN_SURNAMES.length - 1)];
    fullName = `${init} ${surname}`;
    if (!usedNames || !usedNames.has(fullName)) {
      if (usedNames) usedNames.add(fullName);
      return fullName;
    }
  }
  const fallback = `${fullName} ${randInt(2, 99)}`;
  if (usedNames) usedNames.add(fallback);
  return fallback;
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
function createPlayer(pos, basePower, isStarter, usedNames, customAgeRange = null, forcedCurve = null) {
  const fullName = generateUniqueName(usedNames);
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

  const salary = calculatePlayerSalary(pos, atk, def, sta, age);
  const contractYears = randInt(1, 5);

  const subPool = SECONDARY_POSITION_POOLS[pos] || [[]];
  const secondaryPositions = [...subPool[randInt(0, subPool.length - 1)]];
  const nationality = NATIONALITIES[randInt(0, NATIONALITIES.length - 1)];
  const preferredFoot = generatePreferredFoot(pos);
  const height = generatePlayerHeight(pos);
  const traits = generatePlayerTraits(pos, atk, def, sta, secondaryPositions, height, preferredFoot);
  const careerStats = generateInitialCareerStats(pos, age);
  const defaultSquadNum = (PREFERRED_SQUAD_NUMBERS[pos] || [14])[0];

  return {
    id: `p_${playerIdCounter++}`,
    name: fullName,
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
    salary,
    contractYears,
    growthCurve,
    growthType: growthCurve,
    injuryWeeks: 0,
    isRetired: false,
    isStarter,
    appearances: 0,
    goals: 0,
    totalRating: 0,
    lastDiff: null
  };
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
    }
  }
  if (Array.isArray(gameState.transferMarket)) {
    gameState.transferMarket.forEach(p => usedNames.add(p.name));
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

    // ホーム開催時（全19試合）：サポーター規模＋スタジアム拡張Lv補正（Lvごとに+15%）に応じたマッチデイ収入
    const rawIncome = homeClub.supporters * 0.092 + randInt(-40, 40);
    const effectiveIncome = homeClub.isPlayer ? rawIncome * stadiumMultiplier : rawIncome;
    const matchIncome = Math.round(effectiveIncome / 10) * 10;
    homeClub.funds += matchIncome;
    match.homeRevenue = matchIncome;

    // アウェイ戦（全19試合）：プレミア放映権料分配金 £250K（250 £K）
    const awayBroadcastingFee = 250;
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
  while (!gameState.isSeasonOver && gameState.currentWeek < gameState.totalWeeks) {
    playNextMatchweek(true);
  }
}

/**
 * 試合後のランダムGMイベントおよび欧州メガクラブ強奪オファー判定
 */
function checkPostMatchEvents() {
  // 第19節（前半戦終了・冬の移籍ウインドウ）は高確率で欧州メガクラブからの強奪オファーが発生
  if (gameState.currentWeek === Math.floor(gameState.totalWeeks / 2)) {
    if (Math.random() < 0.75) {
      triggerMegaOfferEvent();
      return;
    }
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
 * 欧州大陸メガクラブ（EUROPEAN_MEGA_CLUBS）からの強奪オファーイベント
 */
function triggerMegaOfferEvent() {
  const playerClub = getPlayerClub();
  if (playerClub.players.length <= 12) return;

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

  showGmModal({
    category: 'EUROPEAN MEGA TRANSFER OFFER',
    title: `${megaClubObj.country}の名門「${megaClubObj.name}」からの強奪オファー`,
    description: `${gameState.gmName} GM、緊急案件です。今季活躍を見せる当クラブの主力 ${target.pos} ${target.name}（${target.age}歳）に対し、${megaClubObj.country}のメガクラブ「${megaClubObj.name}」から破格の移籍金オファーが届きました。売却して莫大なクラブ資金（£）を得るか、拒否して戦力を維持するか決断してください。`,
    detailHtml: `対象選手：[${target.pos}] ${target.name}（総合力 ${ovr} / 今季 ${target.appearances}試合 ${target.goals}得点 / 評価 ${avgRating}）<br>提示移籍金：<strong class="accent-gold">${formatMoney(offerAmount)}</strong>（市場評価額の約2倍）`,
    actions: [
      {
        label: `売却を受諾する（+${formatMoney(offerAmount)}）`,
        className: 'btn btn-accent',
        onClick: () => {
          playerClub.funds += offerAmount;
          playerClub.players = playerClub.players.filter(p => p.id !== target.id);
          ensureValidSquadAndStarters(playerClub);
          renderAll();
        }
      },
      {
        label: 'オファーを拒否して戦力維持（サポーター +250人）',
        className: 'btn btn-secondary',
        onClick: () => {
          playerClub.supporters += 250;
          renderAll();
        }
      }
    ]
  });
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
          renderAll();
        }
      },
      {
        label: `通常リハビリ＆ベンチ休養（費用£0 / 全治${weeks}節）`,
        className: 'btn btn-secondary',
        onClick: () => {
          victim.injuryWeeks = weeks;
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

  if (!isSkipped && Math.random() < 0.65) {
    triggerMegaOfferEvent();
  }
}

/**
 * 選手の契約延長（年俸交渉・+3年契約更新）
 */
function extendPlayerContract(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  const assessedSalary = calculatePlayerSalary(target.pos, target.atk, target.def, target.sta, target.age);
  const newSalary = Math.max(800, Math.round(Math.max(assessedSalary, target.salary * 1.05) / 50) * 50);

  target.salary = newSalary;
  target.contractYears = Math.min(5, (target.contractYears || 0) + 3);

  renderAll();
}

/**
 * 移籍市場から選手を獲得する
 */
function signMarketPlayer(candidateId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (playerClub.players.length >= MAX_SQUAD_SIZE) {
    return;
  }

  const idx = gameState.transferMarket.findIndex(c => c.id === candidateId);
  if (idx === -1) return;

  const candidate = gameState.transferMarket[idx];
  if (playerClub.funds < candidate.transferFee) {
    return;
  }

  playerClub.funds -= candidate.transferFee;
  candidate.isStarter = false;
  candidate.assignedPos = null;
  candidate.slotIndex = null;
  candidate.squadNumber = null;
  candidate.appearances = 0;
  candidate.goals = 0;
  candidate.totalRating = 0;
  candidate.contractYears = Math.max(3, candidate.contractYears);
  playerClub.players.push(candidate);
  ensureClubSquadNumbers(playerClub);

  gameState.transferMarket.splice(idx, 1);
  renderAll();
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
      const candidate = createPlayer(pos, baseTarget, usedNames, age, false);
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

  if (actionKey === 'play-match') {
    switchTab('standings');
    playNextMatchweek(false);
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
    const panel = document.getElementById('youth-academy-panel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // 契約残り0年のまま更新されなかった選手はフリー移籍でチームを離脱
  const expiredPlayers = playerClub.players.filter(p => p.contractYears <= 0);
  if (expiredPlayers.length > 0) {
    playerClub.players = playerClub.players.filter(p => p.contractYears > 0);
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
      p.lastDiff = null;
    }
  }

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  switchTab('standings');
  renderAll();
}

/**
 * タブ切り替え
 */
function switchTab(tabName) {
  gameState.activeTab = tabName;

  const tabs = ['standings', 'roster', 'market', 'facilities'];
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
  renderFinancialAlert();
  renderGmDuties();
  renderSeasonSettlement();
  renderStandings();
  renderTopScorers();
  renderMatchLog();
  renderRoster();
  renderMarket();
  renderFacilitiesAndYouth();
}

/**
 * 上部ステータスの描画
 */
function renderHeader() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const payroll = getClubTotalPayroll(playerClub);
  const squadCount = playerClub.players.length;

  document.getElementById('header-club-name').textContent = playerClub.name;
  document.getElementById('header-gm-name').textContent = gameState.gmName;
  document.getElementById('header-target-rank').textContent = `目標：${playerClub.targetLabel || '4位以内'}`;
  document.getElementById('header-season').textContent = `${gameState.season}年目`;

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
  const marketBadge = document.getElementById('tab-badge-market');
  marketBadge.textContent = `${gameState.transferMarket.length}名`;
  if (gameState.isSeasonOver) {
    marketBadge.classList.add('badge-highlight');
  } else {
    marketBadge.classList.remove('badge-highlight');
  }

  const facilitiesBadge = document.getElementById('tab-badge-facilities');
  if (facilitiesBadge) {
    const f = gameState.facilities || { stadium: 1, training: 1, scouting: 1 };
    const youthCount = (gameState.youthCandidates || []).length;
    facilitiesBadge.textContent = youthCount > 0 ? `Lv.${f.stadium}/${f.training}/${f.scouting}・候補${youthCount}` : `Lv.${f.stadium}/${f.training}/${f.scouting}`;
    if (youthCount > 0 && gameState.isSeasonOver) {
      facilitiesBadge.classList.add('badge-highlight');
    } else {
      facilitiesBadge.classList.remove('badge-highlight');
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

  const btnPlayNext = document.getElementById('btn-play-next');
  const btnSkipSeason = document.getElementById('btn-skip-season');
  const btnNextSeason = document.getElementById('btn-next-season');
  const btnRestart = document.getElementById('btn-restart-game');

  btnPlayNext.disabled = gameState.isSimulating;
  btnSkipSeason.disabled = gameState.isSimulating;

  if (gameState.isGameOver) {
    btnPlayNext.classList.add('hidden');
    btnSkipSeason.classList.add('hidden');
    btnNextSeason.classList.add('hidden');
    btnRestart.classList.remove('hidden');
  } else if (gameState.isSeasonOver) {
    btnPlayNext.classList.add('hidden');
    btnSkipSeason.classList.add('hidden');
    btnNextSeason.classList.remove('hidden');
    btnRestart.classList.add('hidden');
  } else {
    btnPlayNext.classList.remove('hidden');
    btnSkipSeason.classList.remove('hidden');
    btnNextSeason.classList.add('hidden');
    btnRestart.classList.add('hidden');
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
  const subtitle = document.getElementById('log-panel-subtitle');

  if (gameState.lastWeekResults.length === 0) {
    subtitle.textContent = 'READY FOR KICKOFF';
    const nextMatches = gameState.schedule[0] || [];
    container.innerHTML = `
      <div class="empty-log-message">シーズン開幕前です。「次節をプレイ」で第1節を開始してください。</div>
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
  subtitle.textContent = `MATCHWEEK ${weekNum} RESULTS`;

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

  container.innerHTML = tickerHtml + cardsHtml;
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

    const canExtend = p.contractYears <= 1 && !gameState.isGameOver;
    const extendBtnHtml = canExtend
      ? `<button type="button" class="btn btn-accent btn-sm btn-extend-contract" data-extend-id="${p.id}" title="年俸を改定し契約期間を+3年延長">契約延長</button>`
      : '';

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

    let ovrDisplay = `<strong>${effOvr}</strong>`;
    if (p.injuryWeeks > 0 || fitInfo.type === 'out') {
      ovrDisplay = `<span class="text-danger">${effOvr}</span> <span class="text-muted">(${baseOvr})</span>`;
    } else if (fitInfo.type === 'sub') {
      ovrDisplay = `<span class="text-cyan">${effOvr}</span> <span class="text-muted">(${baseOvr})</span>`;
    }

    const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(1) : '-';

    let contractClass = '';
    let contractText = `${p.contractYears}年`;
    if (p.contractYears <= 0) {
      contractClass = 'contract-expired';
      contractText = '満了(0年)';
    } else if (p.contractYears === 1) {
      contractClass = 'contract-expiring';
      contractText = '残り1年';
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
          ${fitBadge}${injuryBadge}
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
        <td class="col-num">${formatMoney(p.salary)}</td>
        <td class="col-action">
          <div class="action-btn-group">
            ${extendBtnHtml}
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
 * 移籍市場の描画（複数適性表示・選手プロフィール起動・契約残年数付き）
 */
function renderMarket() {
  const playerClub = getPlayerClub();
  const squadCount = playerClub.players.length;
  const isFull = squadCount >= MAX_SQUAD_SIZE;

  const posCounts = {};
  ALL_POSITIONS.forEach(pos => { posCounts[pos] = 0; });
  for (const p of playerClub.players) {
    posCounts[p.pos] = (posCounts[p.pos] || 0) + 1;
  }

  document.getElementById('market-pos-summary').innerHTML = `
    ${ALL_POSITIONS.map(pos => `<span class="power-badge">${pos} <strong class="mono">${posCounts[pos]}</strong></span>`).join('')}
    <span class="power-badge">所属枠 <strong class="mono">${squadCount} / ${MAX_SQUAD_SIZE}名</strong></span>
    <span class="power-badge">獲得予算 <strong class="mono accent-gold">${formatMoney(playerClub.funds)}</strong></span>
  `;

  const noteEl = document.getElementById('market-status-note');
  if (gameState.isSeasonOver) {
    noteEl.textContent = '【オフシーズン補強期間】選手名をクリックするとスカウト詳細（サブ適性・利き足・特徴）を確認できます。残り1年の選手は格安です。';
  } else {
    noteEl.textContent = 'シーズン中も獲得候補のスカウティング（選手名クリックで詳細表示）および緊急補強が可能です（所属上限：最大20名）。';
  }

  const tbody = document.getElementById('market-tbody');
  if (gameState.transferMarket.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="empty-log-message">現在リストアップされている移籍候補選手はすべて獲得済みです。次シーズン終了時に新たな候補が登場します。</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = gameState.transferMarket.map(c => {
    const ovr = getPlayerOverallRating(c);
    const growthLabel = getGrowthCurveLabel(c.growthCurve);
    const growthBadge = `<span class="growth-pill growth-${c.growthCurve}">${growthLabel}</span>`;
    const canAfford = playerClub.funds >= c.transferFee;
    const canSign = !isFull && canAfford && !gameState.isGameOver && !gameState.isSimulating;

    let btnText = '獲得する';
    if (isFull) btnText = '枠上限(20名)';
    else if (!canAfford) btnText = '資金不足';

    const isBargain = c.contractYears === 1;
    const bargainBadge = isBargain ? '<span class="sub-badge badge-bargain">残1年・格安</span>' : '';
    const contractText = isBargain ? '<span class="contract-expiring">残り1年</span>' : `${c.contractYears}年`;

    return `
      <tr>
        <td class="col-pos">${formatPlayerPositionsHtml(c)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${c.id}" title="クリックで選手詳細プロフィールを表示">
            ${c.name}
          </button>
          ${bargainBadge}
        </td>
        <td class="col-num">${c.age}</td>
        <td class="col-growth">${growthBadge}</td>
        <td class="col-num">${c.atk}</td>
        <td class="col-num">${c.def}</td>
        <td class="col-num">${c.sta}</td>
        <td class="col-num accent-green"><strong>${ovr}</strong></td>
        <td class="col-num">${contractText}</td>
        <td class="col-num accent-gold">${formatMoney(c.transferFee)}</td>
        <td class="col-num">${formatMoney(c.salary)}</td>
        <td class="col-action">
          <button type="button" class="btn btn-primary btn-sm btn-sign-player" data-sign-id="${c.id}" ${canSign ? '' : 'disabled'}>
            ${btnText}
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

  // 2. 推奨タスク（RECOMMENDED / 黄）
  const starters = playerClub.players.filter(p => p.isStarter);
  const injuredStarters = starters.filter(p => p.injuryWeeks > 0);
  const expiringPlayers = playerClub.players.filter(p => p.contractYears <= 1);
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
  } else if (expiringPlayers.length > 0) {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨 / RECOMMENDED',
      title: `契約延長交渉（残り1年以下：${expiringPlayers.length}名）`,
      desc: `${expiringPlayers[0].name} ら${expiringPlayers.length}名が契約満了間近です。放置するとオフにフリー移籍で離脱します。`,
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

  // 3. 任意タスク（OPTIONAL / 緑）
  const youthCount = (gameState.youthCandidates || []).length;
  const f = gameState.facilities || { stadium: 1, training: 1, scouting: 1 };
  const minUpgradeCost = Math.min(
    f.stadium < 5 ? FACILITY_DEFINITIONS.stadium.costs[f.stadium] : Infinity,
    f.training < 5 ? FACILITY_DEFINITIONS.training.costs[f.training] : Infinity,
    f.scouting < 5 ? FACILITY_DEFINITIONS.scouting.costs[f.scouting] : Infinity
  );

  let optionalDuty = null;
  if (youthCount > 0 && playerClub.players.length < MAX_SQUAD_SIZE) {
    optionalDuty = {
      level: 'optional',
      badge: '任意 / OPTIONAL',
      title: `ユース視察・昇格審査（候補 ${youthCount}名）`,
      desc: `アカデミーから16〜18歳の有望株${youthCount}名が推薦されています。移籍金ゼロ・最低年俸 £800K でトップ昇格可能です。`,
      btnText: 'ユース視察へ移動',
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
    optionalDuty = {
      level: 'optional',
      badge: '任意 / OPTIONAL',
      title: `移籍市場スカウティング（候補 ${gameState.transferMarket.length}名）`,
      desc: '移籍市場リストから掘り出し物（契約残り1年の格安選手や若手有望株）のスカウトレポートを確認できます。',
      btnText: '移籍市場へ移動',
      action: 'goto-market'
    };
  }

  const duties = [criticalDuty, recommendedDuty, optionalDuty];
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
  if (nameEl) nameEl.textContent = p.name;

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
function renderIntroClubList() {
  const listEl = document.getElementById('intro-club-list');
  if (!listEl) return;

  const filteredClubs = CLUB_DEFINITIONS.filter(c => matchesClubFilter(c, introClubFilter));

  listEl.innerHTML = filteredClubs.map(def => {
    const isSelected = def.id === gameState.selectedClubId;
    return `
      <button type="button" class="intro-club-item ${isSelected ? 'selected' : ''}" data-club-id="${def.id}">
        <div class="club-item-main">
          <span class="club-item-name">${def.name}</span>
          <span class="club-item-tier">${def.tier}</span>
        </div>
        <div class="club-item-metrics mono">
          <span class="club-item-funds">${formatMoney(def.initialFunds)}</span>
          <span class="club-item-power">OVR ${def.basePower}</span>
        </div>
      </button>
    `;
  }).join('');
}

/**
 * GM就任モーダル：右ペインの選択中クラブ詳細プレビューを描画
 */
function renderIntroClubDetail() {
  const detailEl = document.getElementById('intro-club-detail-pane');
  const summaryEl = document.getElementById('intro-selected-summary');
  if (!detailEl) return;

  const club = CLUB_DEFINITIONS.find(c => c.id === gameState.selectedClubId) || CLUB_DEFINITIONS[0];
  const tacticDef = TACTICS_DEFINITIONS[club.defaultTactic] || TACTICS_DEFINITIONS.possession;

  detailEl.innerHTML = `
    <div class="detail-header-card">
      <div class="detail-title-row">
        <h3 class="detail-club-name">${club.name}</h3>
        <span class="detail-tier-badge">${club.tier}</span>
      </div>
      <p class="detail-club-desc">${club.desc}</p>
    </div>

    <div class="detail-metrics-grid">
      <div class="detail-metric-card highlight">
        <span class="detail-metric-label">CLUB FUNDS（初期資金）</span>
        <span class="detail-metric-val mono accent-gold">${formatMoney(club.initialFunds)}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">BOARD TARGET（理事会目標）</span>
        <span class="detail-metric-val mono">${club.targetLabel}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">SQUAD POWER（戦力値）</span>
        <span class="detail-metric-val mono accent-green">OVR ${club.basePower}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">SUPPORTERS（ファン数）</span>
        <span class="detail-metric-val mono">${club.supporters.toLocaleString()}人</span>
      </div>
    </div>

    <div class="detail-mission-box">
      <div class="detail-mission-title mono">BOARD MISSION / EXPECTATION</div>
      <p class="detail-mission-text">
        今季の理事会要求は「<strong>${club.targetLabel}</strong>」です。初期戦術方針は「${tacticDef.name}」が設定されています。目標を達成してシーズンを終えると、理事会から <strong>+£3.0M</strong> の特別ボーナスが支給されます。
      </p>
    </div>
  `;

  if (summaryEl) {
    summaryEl.innerHTML = `選択中：<strong>${club.name}</strong> <span class="summary-target mono">（目標：${club.targetLabel} / 予算 ${formatMoney(club.initialFunds)}）</span>`;
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
  gameState.activeTab = 'standings';
  gameState.lastWeekResults = [];
  gameState.lastMatchTicker = null;
  gameState.lastSettlement = null;
  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  gameState.facilities = { stadium: 1, training: 1, scouting: 1 };
  gameState.facilityFeedback = '';

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
      players: createSquad(def.basePower, usedNames)
    };
    ensureValidSquadAndStarters(club);
    if (!club.isPlayer) {
      autoSelectStarters(club);
    }
    return club;
  });

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  generateTransferMarket();
  generateYouthAcademyCandidates();
  switchTab('standings');
}

/**
 * ゲーム初期化処理（イベントリスナー登録）
 */
function initGame() {
  document.getElementById('btn-play-next').addEventListener('click', () => playNextMatchweek(false));
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

  document.getElementById('intro-club-list').addEventListener('click', (e) => {
    const item = e.target.closest('.intro-club-item');
    if (item && item.dataset.clubId) {
      gameState.selectedClubId = item.dataset.clubId;
      renderIntroClubList();
      renderIntroClubDetail();
    }
  });

  document.getElementById('btn-confirm-intro').addEventListener('click', confirmIntroAndStartGame);
  document.getElementById('btn-cancel-intro').addEventListener('click', () => {
    document.getElementById('intro-modal-overlay').classList.add('hidden');
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
    const signBtn = e.target.closest('.btn-sign-player');
    if (signBtn) {
      signMarketPlayer(signBtn.dataset.signId);
    }
  });

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

  // GM業務タスク一覧（実行 / 移動ボタン）のイベント
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
  const youthGrid = document.getElementById('youth-candidates-grid');
  if (youthGrid) {
    youthGrid.addEventListener('click', (e) => {
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
      const promoteBtn = e.target.closest('[data-promote-youth]');
      if (promoteBtn && promoteBtn.dataset.promoteYouth) {
        promoteYouthCandidate(promoteBtn.dataset.promoteYouth);
        return;
      }
      const dismissBtn = e.target.closest('[data-dismiss-youth]');
      if (dismissBtn && dismissBtn.dataset.dismissYouth) {
        dismissYouthCandidate(dismissBtn.dataset.dismissYouth);
      }
    });
  }

  // 選手プロフィール詳細モーダルを閉じるイベント（右上✕、下部ボタン、背景クリック、Escキー）
  const closeProfileBtn = document.getElementById('btn-close-profile-modal');
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closePlayerProfileModal);
  }
  const closeProfileFooterBtn = document.getElementById('btn-close-profile-footer');
  if (closeProfileFooterBtn) {
    closeProfileFooterBtn.addEventListener('click', closePlayerProfileModal);
  }
  const profileModalOverlay = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (profileModalOverlay) {
    profileModalOverlay.addEventListener('click', (e) => {
      if (e.target === profileModalOverlay) {
        closePlayerProfileModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameState.profileModalPlayerId) {
      closePlayerProfileModal();
    }
  });

  // 背景のダッシュボードを初期描画した上で、初回起動時のGM就任モーダルを表示
  setupNewGame(gameState.selectedClubId);
  openIntroModal(false);
}

document.addEventListener('DOMContentLoaded', initGame);
