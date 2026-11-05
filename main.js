'use strict';

/**
 * 僕のサッカークラブ（仮） - European Football GM Simulation
 * 外部ライブラリ非依存 / 純粋なJavaScript実装
 */

// 欧州リーグ8クラブ定義（プレイヤー初期：中堅「ロンドン・ユナイテッド」）
const CLUB_DEFINITIONS = [
  { id: 'london', name: 'ロンドン・ユナイテッド', isPlayer: true, basePower: 65, supporters: 15000, defaultTactic: 'possession' },
  { id: 'manchester', name: 'マンチェスター・ブルーズ', isPlayer: false, basePower: 71, supporters: 19200, defaultTactic: 'possession' },
  { id: 'madrid', name: 'マドリード・ブランコス', isPlayer: false, basePower: 72, supporters: 19800, defaultTactic: 'counter' },
  { id: 'barcelona', name: 'バルセロナ・カタルーニャ', isPlayer: false, basePower: 70, supporters: 18600, defaultTactic: 'possession' },
  { id: 'munich', name: 'ミュンヘン・バヴァリア', isPlayer: false, basePower: 70, supporters: 18200, defaultTactic: 'highpress' },
  { id: 'milano', name: 'ミラノ・ロッソネリ', isPlayer: false, basePower: 66, supporters: 16400, defaultTactic: 'counter' },
  { id: 'torino', name: 'トリノ・ビアンコネリ', isPlayer: false, basePower: 67, supporters: 16000, defaultTactic: 'counter' },
  { id: 'paris', name: 'パリ・メトロポリタン', isPlayer: false, basePower: 69, supporters: 17500, defaultTactic: 'highpress' }
];

// 海外メガクラブ名（強奪オファー元）
const MEGA_CLUB_NAMES = [
  'レアル・イスパニア',
  'マンチェスター・クラウン',
  'バイエルン・カイザー',
  'パリ・アンペリアル',
  'リヴァプール・レッズ',
  'インテル・ミラネーゼ'
];

// 初期所持資金：3億5,000万円（35,000万円）
const INITIAL_CLUB_FUNDS = 35000;

// 9ポジション定義とカテゴリ分類
const ALL_POSITIONS = ['GK', 'CB', 'SB', 'DM', 'CM', 'SM', 'AM', 'WG', 'CF'];

const POS_DISPLAY_ORDER = {
  GK: 1,
  CB: 2,
  SB: 3,
  DM: 4,
  CM: 5,
  SM: 6,
  AM: 7,
  WG: 8,
  CF: 9
};

const POS_ROLE_GROUP = {
  GK: 'GK',
  CB: 'DF',
  SB: 'DF',
  DM: 'MF',
  CM: 'MF',
  SM: 'MF',
  AM: 'MF',
  WG: 'FW',
  CF: 'FW'
};

// スタメン11枠の標準フォーメーション構成（計11名：GK1, CB2, SB2, DM1, CM1, SM1, AM1, WG1, CF1）
const REQUIRED_STARTERS = {
  GK: 1,
  CB: 2,
  SB: 2,
  DM: 1,
  CM: 1,
  SM: 1,
  AM: 1,
  WG: 1,
  CF: 1
};

// 1チームの初期16名構成（スタメン11名＋ベンチ5名）
const SQUAD_COMPOSITION = [
  { pos: 'GK', total: 2, starters: 1 },
  { pos: 'CB', total: 3, starters: 2 },
  { pos: 'SB', total: 2, starters: 2 },
  { pos: 'DM', total: 2, starters: 1 },
  { pos: 'CM', total: 2, starters: 1 },
  { pos: 'SM', total: 1, starters: 1 },
  { pos: 'AM', total: 1, starters: 1 },
  { pos: 'WG', total: 1, starters: 1 },
  { pos: 'CF', total: 2, starters: 1 }
];

// 所属選手の上限枠
const MAX_SQUAD_SIZE = 20;

// 順位賞金テーブル（単位：万円）
const PRIZE_MONEY_TABLE = [3000, 2000, 1500, 1200, 1000, 800, 600, 500];

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
    desc: '【ポゼッション（支配）】：中盤（DM/CM/SM/AM）の能力が攻守に強く反映される。得点・失点ともにロースコア傾向。'
  },
  counter: {
    name: 'カウンター（速攻）',
    badge: 'COUNTER ATTACK',
    desc: '【カウンター（速攻）】：前線（WG/CF）の攻撃力と最終ライン（CB/SB）の守備力が重視される。引き分けが減り波乱が起きやすい。'
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

// ゲーム全体の状態管理
const gameState = {
  season: 1,
  currentWeek: 0,
  totalWeeks: 14,
  isSeasonOver: false,
  isGameOver: false,
  isSimulating: false,
  consecutiveDeficitSeasons: 0,
  activeTab: 'standings',
  clubs: [],
  schedule: [],
  lastWeekResults: [],
  lastMatchTicker: null,
  transferMarket: [],
  lastSettlement: null,
  selectedPlayerId: null,
  pendingModalQueue: [] // モーダルイベントキュー
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
 * 金額フォーマット（単位：万円 -> 「3億5,000万円」「1,500万円」等）
 */
function formatMoney(manYen) {
  const sign = manYen < 0 ? '-' : '';
  const absVal = Math.abs(Math.round(manYen));
  if (absVal >= 10000) {
    const oku = Math.floor(absVal / 10000);
    const man = absVal % 10000;
    if (man === 0) {
      return `${sign}${oku}億円`;
    }
    return `${sign}${oku}億${man.toLocaleString()}万円`;
  }
  return `${sign}${absVal.toLocaleString()}万円`;
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
 * 選手の本来の能力に基づく総合評価値（1〜99スケール）を算出
 */
function getPlayerOverallRating(p) {
  let raw;
  switch (p.pos) {
    case 'GK':
      raw = p.def * 0.78 + p.sta * 0.17 + p.atk * 0.05;
      break;
    case 'CB':
      raw = p.def * 0.72 + p.sta * 0.20 + p.atk * 0.08;
      break;
    case 'SB':
      raw = p.def * 0.52 + p.sta * 0.30 + p.atk * 0.18;
      break;
    case 'DM':
      raw = p.def * 0.56 + p.sta * 0.26 + p.atk * 0.18;
      break;
    case 'CM':
      raw = p.atk * 0.38 + p.def * 0.36 + p.sta * 0.26;
      break;
    case 'SM':
      raw = p.atk * 0.46 + p.sta * 0.32 + p.def * 0.22;
      break;
    case 'AM':
      raw = p.atk * 0.60 + p.sta * 0.24 + p.def * 0.16;
      break;
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
 * 適性外ポジション配置時（20%低下）や負傷時を考慮した「実効総合力」を算出
 */
function getEffectivePlayerRating(p) {
  const baseOvr = getPlayerOverallRating(p);
  let factor = 1.0;

  // スタメン時、適性ポジションと配置枠が異なる場合は総合値20%低下
  if (p.isStarter && p.assignedPos && p.assignedPos !== p.pos) {
    factor *= 0.80;
  }

  // 負傷中にもかかわらず強行出場している場合はさらに低下
  if (p.injuryWeeks && p.injuryWeeks > 0) {
    factor *= 0.75;
  }

  return clamp(Math.round(baseOvr * factor), 1, 99);
}

/**
 * 選手の能力値と年齢に応じた年俸（単位：万円、800万〜12,000万円）を算出
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
 * 移籍市場での移籍金（単位：万円）を算出
 * 契約残り1年の選手は格安（約50%OFF）で獲得可能
 */
function calculateTransferFee(player) {
  const ovr = getPlayerOverallRating(player);
  const ageBonus = player.age <= 23 ? 1.2 : (player.age >= 30 ? 0.65 : 1.0);
  let rawFee = player.salary * 0.78 * ageBonus + Math.max(0, ovr - 60) * 38;

  // 契約残り1年は格安（50%OFF）、残り4〜5年はやや割増
  if (player.contractYears === 1) {
    rawFee *= 0.48;
  } else if (player.contractYears >= 4) {
    rawFee *= 1.15;
  }

  const rounded = Math.round(rawFee / 50) * 50;
  return clamp(rounded, 300, 14000);
}

/**
 * 重複しない欧州スタイル選手名を生成
 */
function generateUniqueName(usedNames) {
  let fullName = '';
  for (let i = 0; i < 50; i++) {
    const init = FIRST_INITIALS[randInt(0, FIRST_INITIALS.length - 1)];
    const surname = EUROPEAN_SURNAMES[randInt(0, EUROPEAN_SURNAMES.length - 1)];
    fullName = `${init} ${surname}`;
    if (!usedNames || !usedNames.has(fullName)) {
      if (usedNames) usedNames.add(fullName);
      break;
    }
  }
  return fullName;
}

/**
 * 9ポジションに対応した選手1名を生成
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

  return {
    id: `p_${playerIdCounter++}`,
    name: fullName,
    age,
    pos,
    assignedPos: isStarter ? pos : null,
    atk,
    def,
    sta,
    salary,
    contractYears,
    growthCurve,
    growthType: growthCurve, // 後方互換
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
 * 1クラブ分の初期選手16名を生成（9ポジション網羅）
 */
function createSquad(basePower, usedNames) {
  const players = [];
  for (const group of SQUAD_COMPOSITION) {
    for (let i = 0; i < group.total; i++) {
      const isStarter = i < group.starters;
      players.push(createPlayer(group.pos, basePower, isStarter, usedNames));
    }
  }
  return players;
}

/**
 * 移籍市場候補選手（6〜8名）を生成
 */
function generateTransferMarket() {
  const count = randInt(6, 8);
  const usedNames = new Set();
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      usedNames.add(p.name);
    }
  }

  const candidates = [];
  for (let i = 0; i < count; i++) {
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const basePower = randInt(60, 79);
    const player = createPlayer(pos, basePower, false, usedNames, [18, 31]);
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
 * クラブの総人数（最低11名）とスタメン11枠（REQUIRED_STARTERS）を検証・補完する
 */
function ensureValidSquadAndStarters(club, noticeLogs = null) {
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

  // スタメン11枠の割り当て整理
  const requiredSlots = [];
  for (const [pos, count] of Object.entries(REQUIRED_STARTERS)) {
    for (let i = 0; i < count; i++) {
      requiredSlots.push(pos);
    }
  }

  let starters = club.players.filter(p => p.isStarter);
  let bench = club.players.filter(p => !p.isStarter);

  // スタメンが11名より少ない場合はベンチから補充
  while (starters.length < 11 && bench.length > 0) {
    // まだ埋まっていないスロットを探す
    const filledCounts = {};
    starters.forEach(s => {
      const slot = s.assignedPos || s.pos;
      filledCounts[slot] = (filledCounts[slot] || 0) + 1;
    });
    const neededPos = ALL_POSITIONS.find(pos => (filledCounts[pos] || 0) < REQUIRED_STARTERS[pos]) || 'CM';

    // 適性一致のベンチ選手を優先、いなければ総合力最高を選出
    bench.sort((a, b) => {
      const aMatch = a.pos === neededPos ? 1 : 0;
      const bMatch = b.pos === neededPos ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
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
    });
    starters = starters.slice(0, 11);
  }

  // スタメン全員に必ず11スロット（GK1, CB2, SB2, DM1, CM1, SM1, AM1, WG1, CF1）が重複・漏れなく割り当てられるよう整える
  const slotPool = [...requiredSlots];
  const unassignedStarters = [];

  for (const s of starters) {
    const desired = s.assignedPos || s.pos;
    const idx = slotPool.indexOf(desired);
    if (idx !== -1) {
      s.assignedPos = desired;
      slotPool.splice(idx, 1);
    } else {
      unassignedStarters.push(s);
    }
  }

  // 残りのスロットに未割り当てスタメンを配置（適性一致があれば優先）
  for (const s of unassignedStarters) {
    const naturalIdx = slotPool.indexOf(s.pos);
    if (naturalIdx !== -1) {
      s.assignedPos = s.pos;
      slotPool.splice(naturalIdx, 1);
    } else {
      s.assignedPos = slotPool.shift() || s.pos;
    }
  }

  // ベンチ選手のassignedPosはクリア
  club.players.forEach(p => {
    if (!p.isStarter) p.assignedPos = null;
  });
}

/**
 * CPUクラブのスタメン11名を最適配置で自動編成
 */
function autoSelectStarters(club) {
  club.players.forEach(p => {
    p.isStarter = false;
    p.assignedPos = null;
  });

  const available = [...club.players].filter(p => !p.isRetired);

  // 各ポジションの必須枠ごとに適性一致＆健康な選手を優先して選出
  for (const [pos, reqCount] of Object.entries(REQUIRED_STARTERS)) {
    for (let i = 0; i < reqCount; i++) {
      const candidates = available.filter(p => !p.isStarter);
      if (candidates.length === 0) break;

      candidates.sort((a, b) => {
        const aHealthy = (a.injuryWeeks || 0) === 0 ? 1 : 0;
        const bHealthy = (b.injuryWeeks || 0) === 0 ? 1 : 0;
        if (aHealthy !== bHealthy) return bHealthy - aHealthy;

        const aMatch = a.pos === pos ? 1 : 0;
        const bMatch = b.pos === pos ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;

        return getPlayerOverallRating(b) - getPlayerOverallRating(a);
      });

      const chosen = candidates[0];
      chosen.isStarter = true;
      chosen.assignedPos = pos;
    }
  }

  ensureValidSquadAndStarters(club);
}

/**
 * クラブの年間総年俸（単位：万円）を計算
 */
function getClubTotalPayroll(club) {
  return club.players
    .filter(p => !p.isRetired)
    .reduce((sum, p) => sum + p.salary, 0);
}

/**
 * 8チームの2回戦総当たり（全14節・各節4試合）のスケジュールを生成
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
 * チームのスタメン11名の戦術・適性外ペナルティ(-20%)・怪我状態を考慮した実効能力を計算
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

    // 適性外ポジションに配置された場合は総合能力が20%低下
    const posPenaltyFactor = slot !== p.pos ? 0.80 : 1.0;
    // 怪我人を強行出場させている場合は25%低下
    const injuryFactor = p.injuryWeeks > 0 ? 0.75 : 1.0;

    let pAtk = p.atk * posPenaltyFactor * injuryFactor;
    let pDef = p.def * posPenaltyFactor * injuryFactor;

    if (tactic === 'possession') {
      // ポゼッション：中盤（DM/CM/SM/AM）の能力が攻守に強く反映される（1.3倍）
      if (roleGroup === 'MF') {
        pAtk *= 1.30;
        pDef *= 1.30;
      }
    } else if (tactic === 'counter') {
      // カウンター：前線（WG/CF）の攻撃力と守備陣（CB/SB）の守備力が重視される（1.35倍）
      if (roleGroup === 'FW') pAtk *= 1.35;
      if (roleGroup === 'DF') pDef *= 1.35;
    } else if (tactic === 'highpress') {
      // ハイプレス：全体能力に+8%ボーナス
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
 * 試合から得点者を抽出し、個人スタッツを更新する
 */
function processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore) {
  const homeStarters = homeClub.players.filter(p => p.isStarter && !p.isRetired);
  const awayStarters = awayClub.players.filter(p => p.isStarter && !p.isRetired);

  homeStarters.forEach(p => { p.appearances += 1; });
  awayStarters.forEach(p => { p.appearances += 1; });

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
      homeScorers.push({ scorer, minute: randInt(5, 89) });
    }
  }

  const awayScorers = [];
  for (let i = 0; i < awayScore; i++) {
    const scorer = getScorer(awayStarters, awayClub.tactic);
    if (scorer) {
      scorer.goals += 1;
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

      // 適性外起用の場合は評価点も少し下がりやすい
      if (p.assignedPos && p.assignedPos !== p.pos) {
        r -= 0.4;
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

  // ハイプレス選択時はスタメンのスタミナが1ずつ微減（疲労蓄積）
  if (homeClub.tactic === 'highpress' && Math.random() < 0.45) {
    homeStarters.forEach(p => { p.sta = Math.max(30, p.sta - 1); });
  }
  if (awayClub.tactic === 'highpress' && Math.random() < 0.45) {
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
    events.push({
      time: 'FINANCE',
      type: 'revenue',
      text: `[ホーム開催] チケット・グッズ売上 +${formatMoney(matchIncome)} を計上`
    });
  } else if (!isPlayerHome) {
    events.push({
      time: 'FINANCE',
      type: 'revenue',
      text: `[アウェイ開催] 放映権料分配金 +${formatMoney(awayBroadcastingFee || 500)} を計上`
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
 * 1節分（4試合）を進行する
 */
function playNextMatchweek(skipAnimation = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.currentWeek >= gameState.totalWeeks) {
    return;
  }
  if (gameState.isSimulating) {
    return;
  }

  // 既存の負傷者の回復進行
  advanceInjuryRecovery();

  const weekIndex = gameState.currentWeek;
  const weekMatches = gameState.schedule[weekIndex];
  const results = [];
  let playerMatchData = null;
  let playerHomeScorers = [];
  let playerAwayScorers = [];

  for (const match of weekMatches) {
    const homeClub = getClubById(match.homeId);
    const awayClub = getClubById(match.awayId);

    const { homeScore, awayScore } = simulateMatch(homeClub, awayClub);
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.played = true;

    // ホーム開催時：約2,500万〜4,500万円のチケット・グッズ売上
    const matchIncome = Math.round((homeClub.supporters * 0.21 + randInt(-80, 80)) / 10) * 10;
    homeClub.funds += matchIncome;
    match.homeRevenue = matchIncome;

    // アウェイ戦：放映権料分配金500万円のみ計上
    const awayBroadcastingFee = 500;
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
      // ステップ4・5：冬の移籍市場節目（第7節）のメガオファー、または各節間のランダムGMイベント判定
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
 * ステップ4・5：試合後のランダムGMイベントおよびメガクラブ強奪オファー判定
 */
function checkPostMatchEvents() {
  // 第7節（シーズン折り返し・冬の移籍ウインドウ）は高確率でメガオファーが発生
  if (gameState.currentWeek === 7) {
    if (Math.random() < 0.75) {
      triggerMegaOfferEvent();
      return;
    }
  }

  // 通常節は38%の確率でランダムGMイベントが発生
  if (Math.random() < 0.38) {
    const roll = Math.random();
    if (roll < 0.36) {
      triggerInjuryEvent();
    } else if (roll < 0.68) {
      triggerYouthPromotionEvent();
    } else {
      triggerSupporterPetitionEvent();
    }
  }
}

/**
 * ステップ4-2：海外メガクラブからの強奪オファーイベント
 */
function triggerMegaOfferEvent() {
  const playerClub = getPlayerClub();
  if (playerClub.players.length <= 12) return; // 最低人数ギリギリの時は発生しない

  // 活躍選手（ゴール数・評価点・総合力の高い選手）を抽出
  const candidates = [...playerClub.players].sort((a, b) => {
    const scoreA = getPlayerOverallRating(a) + a.goals * 4 + (a.appearances > 0 ? (a.totalRating / a.appearances) * 3 : 0);
    const scoreB = getPlayerOverallRating(b) + b.goals * 4 + (b.appearances > 0 ? (b.totalRating / b.appearances) * 3 : 0);
    return scoreB - scoreA;
  });

  const target = candidates[0];
  if (!target) return;

  const megaClub = MEGA_CLUB_NAMES[randInt(0, MEGA_CLUB_NAMES.length - 1)];
  const baseValue = calculateTransferFee(target);
  // 通常の1.8倍〜2.4倍の破格オファー
  const offerAmount = Math.round((baseValue * (1.8 + Math.random() * 0.6)) / 100) * 100;
  const ovr = getPlayerOverallRating(target);
  const avgRating = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : '-';

  showGmModal({
    category: 'MEGA TRANSFER OFFER',
    title: `海外メガクラブ「${megaClub}」からの強奪オファー`,
    description: `今季活躍を見せる当クラブの主力 ${target.pos} ${target.name}（${target.age}歳）に対し、欧州屈指のメガクラブ「${megaClub}」から破格の移籍金オファーが届きました。売却して莫大なクラブ資金を得るか、拒否して戦力を維持するか決断してください。`,
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
        label: 'オファーを拒否して戦力維持',
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
 * ステップ5：ランダムイベント1「選手の怪我（全治〇試合）」
 */
function triggerInjuryEvent() {
  const playerClub = getPlayerClub();
  const starters = playerClub.players.filter(p => p.isStarter && (p.injuryWeeks || 0) === 0);
  if (starters.length === 0) return;

  // fragile（天才）の選手は怪我確率2.5倍で抽選
  const weighted = [];
  for (const p of starters) {
    const weight = p.growthCurve === 'fragile' ? 3 : 1;
    for (let i = 0; i < weight; i++) {
      weighted.push(p);
    }
  }
  const victim = weighted[randInt(0, weighted.length - 1)];
  const weeks = randInt(2, 4);
  const medicalCost = 600;

  showGmModal({
    category: 'MEDICAL REPORT / INJURY',
    title: `選手の負傷アクシデント（全治${weeks}試合）`,
    description: `トレーニング中に ${victim.pos} ${victim.name}（${victim.age}歳 / ${getGrowthCurveLabel(victim.growthCurve)}）が筋肉系のトラブルを訴え、全治${weeks}試合の診断を受けました。治療方針を選択してください。`,
    detailHtml: `負傷選手：[${victim.pos}] ${victim.name}（総合力 ${getPlayerOverallRating(victim)}）<br>特別治療費：${formatMoney(medicalCost)}（全治期間を1試合に短縮し能力低下を防止）`,
    actions: [
      {
        label: `専門医の特別治療（-${formatMoney(medicalCost)} / 全治1節に短縮）`,
        className: 'btn btn-primary',
        disabled: playerClub.funds < medicalCost,
        onClick: () => {
          playerClub.funds -= medicalCost;
          victim.injuryWeeks = 1;
          renderAll();
        }
      },
      {
        label: `通常リハビリ＆ベンチ休養（費用0円 / 全治${weeks}節）`,
        className: 'btn btn-secondary',
        onClick: () => {
          victim.injuryWeeks = weeks;
          // 同ポジションの健康なベンチ選手がいれば自動交代
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
 * ステップ5：ランダムイベント2「若手ユース選手の台頭（無料昇格オファー）」
 */
function triggerYouthPromotionEvent() {
  const playerClub = getPlayerClub();
  const usedNames = new Set();
  gameState.clubs.forEach(c => c.players.forEach(p => usedNames.add(p.name)));

  const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
  const curve = Math.random() < 0.45 ? 'early' : (Math.random() < 0.35 ? 'fragile' : 'standard');
  const prospect = createPlayer(pos, randInt(60, 68), false, usedNames, [17, 18], curve);
  prospect.salary = 800;
  prospect.contractYears = 4;
  const ovr = getPlayerOverallRating(prospect);
  const isFull = playerClub.players.length >= MAX_SQUAD_SIZE;

  showGmModal({
    category: 'ACADEMY SCOUT REPORT',
    title: '若手ユース選手の台頭（トップチーム無料昇格オファー）',
    description: `クラブの下部組織（アカデミー）にて、10代の有望株 ${prospect.pos} ${prospect.name}（${prospect.age}歳）が眩い才能を発揮しています。移籍金0円・最低年俸800万円でトップチームへ昇格させることができます。`,
    detailHtml: `候補選手：[${prospect.pos}] ${prospect.name}（${prospect.age}歳 / 成長曲線：${getGrowthCurveLabel(prospect.growthCurve)}）<br>能力値：総合 ${ovr}（攻撃 ${prospect.atk} / 守備 ${prospect.def} / スタミナ ${prospect.sta}） / 4年契約・年俸800万円`,
    actions: [
      {
        label: isFull ? '所属枠上限（20名）のため昇格不可' : 'トップチームへ無料昇格させる（契約金0円）',
        className: 'btn btn-primary',
        disabled: isFull,
        onClick: () => {
          playerClub.players.push(prospect);
          renderAll();
        }
      },
      {
        label: '昇格を見送り育成提携クラブへ貸出（育成奨励金 +400万円）',
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
 * ステップ5：ランダムイベント3「サポーターによるスタジアム拡張・ファンイベント嘆願」
 */
function triggerSupporterPetitionEvent() {
  const playerClub = getPlayerClub();
  const investCost = 1200;

  showGmModal({
    category: 'SUPPORTERS UNION PETITION',
    title: 'サポーター連合によるスタジアム設備拡張嘆願',
    description: `熱狂的なサポーター連合から、ホームスタジアムの観客席改修およびファンゾーン拡充を求める要望書が提出されました。投資を行えばサポーター数が大幅に増加し、今後のホーム戦チケット収入が向上します。`,
    detailHtml: `投資費用：${formatMoney(investCost)}<br>期待効果：サポーター数 +1,300人増加（ホーム開催時のチケット収入が毎試合約270万円増加）`,
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
 * モーダルダイアログの表示制御
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
 * ステップ3-1：成長曲線（growthCurve）と年齢に応じた能力変動値を算出
 * - 'early'（早熟：17〜23歳急成長、28歳衰退）
 * - 'standard'（標準：18〜25歳成長、26〜29歳ピーク、31歳衰退）
 * - 'late'（晩成：26〜31歳成長、息が長い）
 * - 'fragile'（天才：能力・成長は高いが怪我確率高め）
 */
function computeStatGrowth(player) {
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
    // standard（18〜25歳成長、26〜29歳ピーク、31歳衰退）
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

  return {
    dAtk: randInt(atkRange[0], atkRange[1]),
    dDef: randInt(defRange[0], defRange[1]),
    dSta: randInt(staRange[0], staRange[1])
  };
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
 * シーズン終了時の処理（収入加算・加齢・成長・契約年数-1・引退・移籍市場・メガオファー）
 */
function processSeasonEnd(isSkipped = false) {
  gameState.isSeasonOver = true;
  gameState.selectedPlayerId = null;

  const sortedClubs = getSortedStandings();
  const playerRankIndex = sortedClubs.findIndex(c => c.isPlayer);
  const playerRank = playerRankIndex + 1;

  let playerPrize = 0;
  let playerSponsorIncome = 0;

  sortedClubs.forEach((club, idx) => {
    const prize = PRIZE_MONEY_TABLE[idx] || 500;
    const sponsorIncome = Math.round((club.supporters * 0.55) / 10) * 10;
    club.funds += prize + sponsorIncome;

    if (club.isPlayer) {
      playerPrize = prize;
      playerSponsorIncome = sponsorIncome;
    }
  });

  const playerAgingLogs = [];
  const playerRetirementLogs = [];

  for (const club of gameState.clubs) {
    for (const p of club.players) {
      p.age += 1;
      p.injuryWeeks = 0;

      // ステップ3-2：シーズン終了時に契約残り年数を -1
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

      const { dAtk, dDef, dSta } = computeStatGrowth(p);
      const oldAtk = p.atk;
      const oldDef = p.def;
      const oldSta = p.sta;

      p.atk = clamp(p.atk + dAtk, 1, 99);
      p.def = clamp(p.def + dDef, 1, 99);
      p.sta = clamp(p.sta + dSta, 1, 99);

      p.lastDiff = {
        atk: p.atk - oldAtk,
        def: p.def - oldDef,
        sta: p.sta - oldSta
      };

      // CPUクラブは契約0年になった主力選手を自動延長
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

  gameState.lastSettlement = {
    season: gameState.season,
    rank: playerRank,
    prize: playerPrize,
    sponsorIncome: playerSponsorIncome,
    totalIncome: playerPrize + playerSponsorIncome,
    retirementLogs: playerRetirementLogs,
    agingLogs: playerAgingLogs
  };

  switchTab('market');

  // シーズン終了時に主力選手へのメガクラブ強奪オファーが発生（65%）
  if (!isSkipped && Math.random() < 0.65) {
    triggerMegaOfferEvent();
  }
}

/**
 * ステップ3-2：選手の契約延長（年俸交渉・+3年契約更新）
 */
function extendPlayerContract(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  // 現在の能力に見合った新要求年俸を算出（最低でも現年俸の95%〜108%）
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
  candidate.appearances = 0;
  candidate.goals = 0;
  candidate.totalRating = 0;
  // 獲得時に新たな複数年契約（3〜4年）を締結
  candidate.contractYears = Math.max(3, candidate.contractYears);
  playerClub.players.push(candidate);

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

  // チーム全体の人数が最低11名を下回る場合は解雇不可
  if (playerClub.players.length <= 11) {
    return;
  }
  // GKが残り1名の場合は解雇不可
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
 * スタメン選手の配置枠（assignedPos）をプルダウンで変更した際、該当枠のスタメンと入れ替える
 */
function changeStarterAssignedPos(playerId, newSlotPos) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId && p.isStarter);
  if (!target || !ALL_POSITIONS.includes(newSlotPos)) return;

  const oldSlot = target.assignedPos || target.pos;
  if (oldSlot === newSlotPos) return;

  // 変更先スロットにいるスタメン選手を探してスロットを交換
  const swapPartner = playerClub.players.find(
    p => p.isStarter && p.id !== target.id && (p.assignedPos || p.pos) === newSlotPos
  );

  if (swapPartner) {
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
    // ベンチから同適性を優先して昇格
    bench.sort((a, b) => {
      const aMatch = a.pos === slotToFill ? 1 : 0;
      const bMatch = b.pos === slotToFill ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });
    const promoted = bench[0];
    promoted.isStarter = true;
    promoted.assignedPos = slotToFill;
    target.isStarter = false;
    target.assignedPos = null;
  } else {
    // ベンチ選手をスタメンへ：まず適性一致のスタメン枠で最も評価の低い選手を探す
    let sameSlotStarters = starters.filter(s => (s.assignedPos || s.pos) === target.pos);
    if (sameSlotStarters.length === 0) {
      // 同ポジション枠がない場合はGK以外の全スタメンで実効評価が最低の選手と入れ替え（適性外配置）
      sameSlotStarters = starters.filter(s => (s.assignedPos || s.pos) !== 'GK');
    }
    if (sameSlotStarters.length > 0) {
      sameSlotStarters.sort((a, b) => getEffectivePlayerRating(a) - getEffectivePlayerRating(b));
      const demoted = sameSlotStarters[0];
      const inheritedSlot = demoted.assignedPos || demoted.pos;
      demoted.isStarter = false;
      demoted.assignedPos = null;
      target.isStarter = true;
      target.assignedPos = inheritedSlot;
    }
  }

  gameState.selectedPlayerId = null;
  renderRoster();
}

/**
 * ステップ3-2：契約0年の選手離脱処理 ＋ 年俸支払い ＋ 新シーズン開幕
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

  const tabs = ['standings', 'roster', 'market'];
  for (const t of tabs) {
    const btn = document.getElementById(`tab-btn-${t}`);
    const view = document.getElementById(`view-${t}`);
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
  return gameState.clubs.find(c => c.isPlayer);
}

/**
 * 自チームの選手行クリックによる任意2選手の入れ替え（異ポジション同士のコンバート配置にも対応）
 */
function handleRosterClick(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const clickedPlayer = playerClub.players.find(p => p.id === playerId);
  if (!clickedPlayer) return;

  if (!gameState.selectedPlayerId) {
    gameState.selectedPlayerId = playerId;
    renderRoster();
    return;
  }

  if (gameState.selectedPlayerId === playerId) {
    gameState.selectedPlayerId = null;
    renderRoster();
    return;
  }

  const prevPlayer = playerClub.players.find(p => p.id === gameState.selectedPlayerId);
  if (!prevPlayer) {
    gameState.selectedPlayerId = null;
    renderRoster();
    return;
  }

  // スタメン同士の配置枠スワップ、またはスタメンとベンチの入れ替え（異ポジション間でも配置枠を引き継ぐ）
  if (prevPlayer.isStarter && clickedPlayer.isStarter) {
    const tempSlot = prevPlayer.assignedPos || prevPlayer.pos;
    prevPlayer.assignedPos = clickedPlayer.assignedPos || clickedPlayer.pos;
    clickedPlayer.assignedPos = tempSlot;
    gameState.selectedPlayerId = null;
  } else if (prevPlayer.isStarter !== clickedPlayer.isStarter) {
    const starter = prevPlayer.isStarter ? prevPlayer : clickedPlayer;
    const benchPlayer = prevPlayer.isStarter ? clickedPlayer : prevPlayer;
    const slot = starter.assignedPos || starter.pos;

    starter.isStarter = false;
    starter.assignedPos = null;
    benchPlayer.isStarter = true;
    benchPlayer.assignedPos = slot;
    gameState.selectedPlayerId = null;
  } else {
    gameState.selectedPlayerId = playerId;
  }

  renderRoster();
}

/**
 * 画面全体の描画更新
 */
function renderAll() {
  renderHeader();
  renderFinancialAlert();
  renderSeasonSettlement();
  renderStandings();
  renderTopScorers();
  renderMatchLog();
  renderRoster();
  renderMarket();
}

/**
 * 上部ステータスの描画
 */
function renderHeader() {
  const playerClub = getPlayerClub();
  const payroll = getClubTotalPayroll(playerClub);
  const squadCount = playerClub.players.length;

  document.getElementById('header-club-name').textContent = playerClub.name;
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
    banner.textContent = `【ゲームオーバー】債務超過（資金：${formatMoney(playerClub.funds)}）が改善されず、GM解任が通告されました。「最初からやり直す」でクラブ運営を再開できます。`;
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

  document.getElementById('summary-headline').textContent =
    `${s.season}年目シーズン終了・決算報告（最終順位：第${s.rank}位） — オフシーズン契約・補強フェーズ`;

  document.getElementById('summary-reward-text').textContent =
    `収入加算：順位賞金 +${formatMoney(s.prize)} ／ 年間スポンサー料 +${formatMoney(s.sponsorIncome)}（計 +${formatMoney(s.totalIncome)}）`;

  const projEl = document.getElementById('summary-payroll-projection');
  const deficitWarning = projectedBalance < 0 ? ' 【警告：このまま開幕すると債務超過になります】' : '';
  projEl.textContent =
    `現在資金：${formatMoney(playerClub.funds)} ／ 翌シーズン年俸合計（開幕時支払）：-${formatMoney(currentPayroll)} ➜ 開幕時予想残高：${formatMoney(projectedBalance)}${deficitWarning}`;
  projEl.className = projectedBalance < 0 ? 'mono text-danger' : 'mono accent-green';

  // 契約残り0年（未更新だとフリー退団する選手）の警告表示
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
        <td class="col-pos"><span class="pos-tag pos-${item.player.pos}">${item.player.pos}</span></td>
        <td class="col-name">${item.player.name}</td>
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
 * 自チーム登録選手一覧の描画（9ポジション順ソート、適性外20%低下、契約延長ボタン含む）
 */
function renderRoster() {
  const playerClub = getPlayerClub();
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

  // 9ポジション順（GK ➔ CB ➔ SB ➔ DM ➔ CM ➔ SM ➔ AM ➔ WG ➔ CF）でソート
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
    const isOutOfPos = p.isStarter && assignedSlot !== p.pos;

    const growthLabel = getGrowthCurveLabel(p.growthCurve);
    const growthBadge = `<span class="growth-pill growth-${p.growthCurve}">${growthLabel}</span>`;

    const atkDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.atk) : '';
    const defDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.def) : '';
    const staDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.sta) : '';

    const canRelease = playerClub.players.length > 11 && !(p.pos === 'GK' && gkCount <= 1) && !gameState.isGameOver;
    const releaseBtnLabel = canRelease ? '自由契約' : '必須枠';

    // 契約残り1年以下なら「契約延長」ボタンを表示
    const canExtend = p.contractYears <= 1 && !gameState.isGameOver;
    const extendBtnHtml = canExtend
      ? `<button type="button" class="btn btn-accent btn-sm btn-extend-contract" data-extend-id="${p.id}" title="年俸を改定し契約期間を+3年延長">契約延長</button>`
      : '';

    const starterToggleBtn = p.isStarter
      ? `<button type="button" class="btn btn-starter-toggle btn-starter-active" data-starter-id="${p.id}" title="クリックでベンチと入替">スタメン</button>`
      : `<button type="button" class="btn btn-starter-toggle btn-bench-active" data-starter-id="${p.id}" title="クリックでスタメンへ昇格">ベンチ</button>`;

    // 配置枠セレクト（スタメン時のみ変更可能）
    let assignedPosHtml = '<span class="mono text-muted">-</span>';
    if (p.isStarter) {
      const optionsHtml = ALL_POSITIONS.map(posOpt => {
        const selected = posOpt === assignedSlot ? 'selected' : '';
        return `<option value="${posOpt}" ${selected}>${posOpt}</option>`;
      }).join('');
      assignedPosHtml = `
        <select class="slot-select ${isOutOfPos ? 'slot-mismatch' : ''}" data-slot-player-id="${p.id}" title="配置ポジション枠を変更（適性外は-20%）">
          ${optionsHtml}
        </select>
      `;
    }

    const penaltyBadge = isOutOfPos ? '<span class="sub-badge badge-penalty">適性外-20%</span>' : '';
    const injuryBadge = p.injuryWeeks > 0 ? `<span class="sub-badge badge-injury">負傷:残${p.injuryWeeks}節</span>` : '';
    const ovrDisplay = isOutOfPos || p.injuryWeeks > 0
      ? `<span class="text-danger">${effOvr}</span> <span class="text-muted">(${baseOvr})</span>`
      : `<strong>${effOvr}</strong>`;

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
        <td class="col-pos"><span class="pos-tag pos-${p.pos}">${p.pos}</span></td>
        <td class="col-name">${p.name}${penaltyBadge}${injuryBadge}</td>
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
 * 移籍市場の描画（契約残年数・残り1年格安表示付き）
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
    noteEl.textContent = '【オフシーズン補強期間】契約残り1年の選手は格安の移籍金で獲得可能です。新シーズン開幕時に所属全選手の年俸合計が差し引かれます。';
  } else {
    noteEl.textContent = 'シーズン中も獲得可能選手リストの閲覧および緊急補強が可能です（所属上限：最大20名）。残り1年の選手は格安で獲得できます。';
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
        <td class="col-pos"><span class="pos-tag pos-${c.pos}">${c.pos}</span></td>
        <td class="col-name">${c.name}${bargainBadge}</td>
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
 * 新規ゲームのセットアップ
 */
function setupNewGame() {
  const usedNames = new Set();
  playerIdCounter = 1;

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

  gameState.clubs = CLUB_DEFINITIONS.map(def => {
    const club = {
      id: def.id,
      name: def.name,
      isPlayer: def.isPlayer,
      funds: INITIAL_CLUB_FUNDS,
      supporters: def.supporters,
      tactic: def.defaultTactic,
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
  switchTab('standings');
}

/**
 * ゲーム初期化処理（イベントリスナー登録）
 */
function initGame() {
  document.getElementById('btn-play-next').addEventListener('click', () => playNextMatchweek(false));
  document.getElementById('btn-skip-season').addEventListener('click', skipToSeasonEnd);
  document.getElementById('btn-next-season').addEventListener('click', startNextSeason);
  document.getElementById('btn-restart-game').addEventListener('click', setupNewGame);

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  document.getElementById('tactics-btn-group').addEventListener('click', (e) => {
    const tacticBtn = e.target.closest('.btn-tactic');
    if (tacticBtn && tacticBtn.dataset.tactic) {
      setTeamTactic(tacticBtn.dataset.tactic);
    }
  });

  // 所属選手一覧のクリックイベント（スタメン切替・契約延長・自由契約・行スワップ）
  document.getElementById('roster-tbody').addEventListener('click', (e) => {
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

  // 配置枠セレクトボックスの変更イベント
  document.getElementById('roster-tbody').addEventListener('change', (e) => {
    const selectEl = e.target.closest('.slot-select');
    if (selectEl) {
      changeStarterAssignedPos(selectEl.dataset.slotPlayerId, selectEl.value);
    }
  });

  document.getElementById('market-tbody').addEventListener('click', (e) => {
    const signBtn = e.target.closest('.btn-sign-player');
    if (signBtn) {
      signMarketPlayer(signBtn.dataset.signId);
    }
  });

  setupNewGame();
}

document.addEventListener('DOMContentLoaded', initGame);
