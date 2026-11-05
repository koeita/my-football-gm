'use strict';

/**
 * 僕のサッカークラブ（仮） - メインゲームロジック
 * 外部ライブラリ非依存 / 純粋なJavaScript実装
 */

// クラブ定義（プレイヤー1＋ライバル7＝計8クラブ）
const CLUB_DEFINITIONS = [
  { id: 'tokyo', name: 'FCトウキョウ', isPlayer: true, basePower: 64, supporters: 15000 },
  { id: 'yokohama', name: 'ヨコハマ・マリナーズ', isPlayer: false, basePower: 68, supporters: 18500 },
  { id: 'osaka', name: 'オオサカ・ブルーズ', isPlayer: false, basePower: 67, supporters: 17200 },
  { id: 'nagoya', name: 'ナゴヤ・グランパスエイト', isPlayer: false, basePower: 65, supporters: 16000 },
  { id: 'fukuoka', name: 'フクオカ・ホーネッツ', isPlayer: false, basePower: 61, supporters: 12400 },
  { id: 'sapporo', name: 'サッポロ・ノーザンズ', isPlayer: false, basePower: 62, supporters: 13100 },
  { id: 'sendai', name: 'センダイ・グリーンズ', isPlayer: false, basePower: 60, supporters: 11800 },
  { id: 'hiroshima', name: 'ヒロシマ・アローズ', isPlayer: false, basePower: 66, supporters: 14900 }
];

// 初期所持資金：3億5,000万円（35,000万円）
const INITIAL_CLUB_FUNDS = 35000;

// 1チームの初期ポジション構成（計16名：スタメン11名＋ベンチ5名）
const SQUAD_COMPOSITION = [
  { pos: 'GK', total: 2, starters: 1 },
  { pos: 'DF', total: 5, starters: 4 },
  { pos: 'MF', total: 6, starters: 4 },
  { pos: 'FW', total: 3, starters: 2 }
];

// ポジションごとの必須スタメン人数（計11名固定）
const REQUIRED_STARTERS = {
  GK: 1,
  DF: 4,
  MF: 4,
  FW: 2
};

// ポジションの表示順序
const POS_DISPLAY_ORDER = {
  GK: 1,
  DF: 2,
  MF: 3,
  FW: 4
};

// 所属選手の上限枠
const MAX_SQUAD_SIZE = 20;

// 順位賞金テーブル（単位：万円）
const PRIZE_MONEY_TABLE = [3000, 2000, 1500, 1200, 1000, 800, 600, 500];

// 成長タイプ定義
const GROWTH_TYPES = [
  { id: 'early', label: '早熟' },
  { id: 'normal', label: '普通' },
  { id: 'late', label: '晩成' }
];

// 架空選手名生成用リスト
const LAST_NAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川',
  '前田', '岡田', '長谷川', '藤田', '後藤', '近藤', '村上', '遠藤', '青木', '坂本',
  '斉藤', '福田', '太田', '西村', '藤井', '金子', '岡本', '藤原', '三浦', '中野',
  '原田', '小野', '田村', '竹内', '中山', '和田', '石田', '上田', '森田', '原',
  '柴田', '酒井', '工藤', '横山', '宮崎', '宮本', '内田', '高木', '安藤', '谷口',
  '大野', '丸山', '今井', '河野', '藤本', '村田', '武田', '上野', '杉山', '増田',
  '小山', '大塚', '平野', '菅原', '久保', '松井', '千葉', '岩崎', '桜井', '木下',
  '野口', '松尾', '菊池', '野村', '新井', '渡部', '佐野', '杉本', '古川', '南'
];

const FIRST_NAMES = [
  '翔太', '大輔', '健太', '拓海', '蓮', '陽翔', '湊', '樹', '悠真', '大和',
  '直樹', '和也', '達也', '裕太', '亮', '誠', '剛', '翼', '駿', '颯太',
  '海斗', '陸', '優斗', '健司', '智也', '浩二', '哲也', '龍之介', '慎吾', '康平',
  '将太', '隆', '涼太', '大樹', '洸平', '一樹', '慶太', '颯', '航平', '昂平',
  '圭介', '真司', '篤人', '佑都', '憲剛', '俊輔', '保仁', '慎三', '栄嗣', '麻也'
];

// ゲーム全体の状態管理
const gameState = {
  season: 1,
  currentWeek: 0, // 0 = 開幕前、1〜14 = 各節終了時点
  totalWeeks: 14,
  isSeasonOver: false,
  isGameOver: false,
  isSimulating: false, // 速報演出中のフラグ
  consecutiveDeficitSeasons: 0,
  activeTab: 'standings', // 'standings' | 'roster' | 'market'
  clubs: [],
  schedule: [],
  lastWeekResults: [],
  lastMatchTicker: null, // テキスト速報ログデータ
  transferMarket: [], // 移籍市場候補リスト
  lastSettlement: null, // 直近の決算情報
  selectedPlayerId: null
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
 * 金額フォーマット（単位：万円 -> 「3億5,000万円」「1,500万円」「-450万円」等）
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
 * 成長タイプをランダムに決定
 */
function pickRandomGrowthType() {
  const r = Math.random();
  if (r < 0.28) return 'early';
  if (r < 0.72) return 'normal';
  return 'late';
}

function getGrowthTypeLabel(growthType) {
  const found = GROWTH_TYPES.find(g => g.id === growthType);
  return found ? found.label : '普通';
}

/**
 * ポジション適性に応じた選手の総合評価値（1〜99スケール）を算出
 */
function getPlayerOverallRating(p) {
  let raw;
  if (p.pos === 'GK') {
    raw = p.def * 0.78 + p.sta * 0.17 + p.atk * 0.05;
  } else if (p.pos === 'DF') {
    raw = p.def * 0.65 + p.sta * 0.23 + p.atk * 0.12;
  } else if (p.pos === 'MF') {
    raw = p.atk * 0.40 + p.def * 0.35 + p.sta * 0.25;
  } else {
    raw = p.atk * 0.68 + p.sta * 0.22 + p.def * 0.10;
  }
  return clamp(Math.round(raw), 1, 99);
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
 * 移籍市場での獲得金（移籍金：単位 万円）を算出
 */
function calculateTransferFee(player) {
  const ovr = getPlayerOverallRating(player);
  const ageBonus = player.age <= 23 ? 1.2 : (player.age >= 30 ? 0.65 : 1.0);
  const rawFee = player.salary * 0.75 * ageBonus + Math.max(0, ovr - 60) * 35;
  const rounded = Math.round(rawFee / 50) * 50;
  return clamp(rounded, 400, 12000);
}

/**
 * 重複しない選手名を生成
 */
function generateUniqueName(usedNames) {
  let fullName = '';
  for (let i = 0; i < 40; i++) {
    const ln = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
    const fn = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)];
    fullName = `${ln} ${fn}`;
    if (!usedNames || !usedNames.has(fullName)) {
      if (usedNames) usedNames.add(fullName);
      break;
    }
  }
  return fullName;
}

/**
 * ランダムな選手1名を生成
 */
function createPlayer(pos, basePower, isStarter, usedNames, customAgeRange = null) {
  const fullName = generateUniqueName(usedNames);
  const age = customAgeRange ? randInt(customAgeRange[0], customAgeRange[1]) : randInt(18, 34);
  const growthType = pickRandomGrowthType();

  const starterBonus = isStarter ? randInt(1, 5) : randInt(-4, 1);
  const center = basePower + starterBonus;

  let atk, def, sta;
  if (pos === 'GK') {
    atk = clamp(randInt(15, 35), 1, 99);
    def = clamp(center + randInt(-6, 10), 1, 99);
    sta = clamp(center + randInt(-10, 6), 1, 99);
  } else if (pos === 'DF') {
    atk = clamp(center - 15 + randInt(-8, 8), 1, 99);
    def = clamp(center + 4 + randInt(-7, 9), 1, 99);
    sta = clamp(center + randInt(-6, 8), 1, 99);
  } else if (pos === 'MF') {
    atk = clamp(center + randInt(-6, 8), 1, 99);
    def = clamp(center + randInt(-6, 8), 1, 99);
    sta = clamp(center + 3 + randInt(-6, 8), 1, 99);
  } else {
    atk = clamp(center + 6 + randInt(-6, 10), 1, 99);
    def = clamp(center - 18 + randInt(-8, 8), 1, 99);
    sta = clamp(center + randInt(-8, 6), 1, 99);
  }

  const salary = calculatePlayerSalary(pos, atk, def, sta, age);

  return {
    id: `p_${playerIdCounter++}`,
    name: fullName,
    age,
    pos,
    atk,
    def,
    sta,
    salary,
    growthType,
    isRetired: false,
    isStarter,
    lastDiff: null
  };
}

/**
 * 1クラブ分の初期選手16名を生成
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
 * 移籍市場候補選手（5〜8名）を生成
 */
function generateTransferMarket() {
  const count = randInt(5, 8);
  const positions = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW', 'FW'];
  const usedNames = new Set();
  for (const club of gameState.clubs) {
    for (const p of club.players) {
      usedNames.add(p.name);
    }
  }

  const candidates = [];
  for (let i = 0; i < count; i++) {
    const pos = i < 4 ? ['GK', 'DF', 'MF', 'FW'][i] : positions[randInt(0, positions.length - 1)];
    const basePower = randInt(58, 78);
    const player = createPlayer(pos, basePower, false, usedNames, [18, 31]);
    player.transferFee = calculateTransferFee(player);
    candidates.push(player);
  }

  candidates.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  gameState.transferMarket = candidates;
}

/**
 * クラブのスタメン枠（GK1, DF4, MF4, FW2）を検証・補完
 */
function ensureValidSquadAndStarters(club, promotionLogs = null) {
  const usedNames = new Set(club.players.map(p => p.name));

  for (const [pos, reqCount] of Object.entries(REQUIRED_STARTERS)) {
    let posPlayers = club.players.filter(p => p.pos === pos && !p.isRetired);

    // 必須人数に足りない場合は18歳ユース選手を緊急昇格
    while (posPlayers.length < reqCount) {
      const youth = createPlayer(pos, 52, true, usedNames, [18, 18]);
      youth.salary = 800;
      club.players.push(youth);
      posPlayers.push(youth);
      if (promotionLogs && club.isPlayer) {
        promotionLogs.push(`[ユース昇格] ${pos} ${youth.name} (18歳 / 年俸800万円) がトップチームに昇格しました`);
      }
    }

    // スタメン人数が必須数と一致するように調整
    const currentStarters = posPlayers.filter(p => p.isStarter);
    if (currentStarters.length < reqCount) {
      const bench = posPlayers
        .filter(p => !p.isStarter)
        .sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
      const needed = reqCount - currentStarters.length;
      for (let i = 0; i < needed && i < bench.length; i++) {
        bench[i].isStarter = true;
      }
    } else if (currentStarters.length > reqCount) {
      currentStarters.forEach((p, idx) => {
        p.isStarter = idx < reqCount;
      });
    }
  }
}

/**
 * CPUクラブのスタメン11名を総合力順に自動編成
 */
function autoSelectStarters(club) {
  ensureValidSquadAndStarters(club);
  for (const [pos, reqCount] of Object.entries(REQUIRED_STARTERS)) {
    const posPlayers = club.players.filter(p => p.pos === pos && !p.isRetired);
    posPlayers.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
    posPlayers.forEach((p, idx) => {
      p.isStarter = idx < reqCount;
    });
  }
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
 * チームのスタメン11名の合計攻撃力・合計守備力・平均スタミナを計算
 */
function getTeamStarterStats(club) {
  const starters = club.players.filter(p => p.isStarter && !p.isRetired);
  let totalAtk = 0;
  let totalDef = 0;
  let totalSta = 0;
  for (const p of starters) {
    totalAtk += p.atk;
    totalDef += p.def;
    totalSta += p.sta;
  }
  const count = starters.length || 1;
  return {
    totalAtk,
    totalDef,
    avgSta: Math.round(totalSta / count)
  };
}

/**
 * 2チームのスタメン能力値からスコアを算出する数理モデル
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

  const rawHomeLambda = 1.38 * Math.pow(homeEffAtk / Math.max(awayEffDef, 200), 1.15);
  const rawAwayLambda = 1.22 * Math.pow(awayEffAtk / Math.max(homeEffDef, 200), 1.15);

  const homeLambda = clamp(rawHomeLambda, 0.3, 4.2);
  const awayLambda = clamp(rawAwayLambda, 0.3, 4.0);

  const homeScore = samplePoisson(homeLambda);
  const awayScore = samplePoisson(awayLambda);

  return { homeScore, awayScore };
}

/**
 * 自チームの試合におけるテキスト速報用イベントログを生成
 */
function generateMatchTickerEvents(playerMatch) {
  const { homeClub, awayClub, homeScore, awayScore, isPlayerHome, matchIncome } = playerMatch;
  const events = [];

  // 1. キックオフ
  events.push({
    time: "0'",
    type: 'normal',
    text: `試合開始！ ${homeClub.name} vs ${awayClub.name}`
  });

  // ゴールイベントの分数と得点者を割り振り
  const goalEvents = [];
  const homeAttackers = homeClub.players.filter(p => p.isStarter && (p.pos === 'FW' || p.pos === 'MF'));
  const awayAttackers = awayClub.players.filter(p => p.isStarter && (p.pos === 'FW' || p.pos === 'MF'));

  for (let i = 0; i < homeScore; i++) {
    const minute = randInt(8, 88);
    const scorer = homeAttackers.length > 0 ? homeAttackers[randInt(0, homeAttackers.length - 1)] : null;
    const scorerText = scorer ? ` (${scorer.pos} ${scorer.name})` : '';
    goalEvents.push({
      minute,
      text: `ゴール！ ${homeClub.name}${scorerText}`,
      type: 'goal'
    });
  }

  for (let i = 0; i < awayScore; i++) {
    const minute = randInt(8, 88);
    const scorer = awayAttackers.length > 0 ? awayAttackers[randInt(0, awayAttackers.length - 1)] : null;
    const scorerText = scorer ? ` (${scorer.pos} ${scorer.name})` : '';
    goalEvents.push({
      minute,
      text: `ゴール！ ${awayClub.name}${scorerText}`,
      type: 'goal'
    });
  }

  // 時間順にソート
  goalEvents.sort((a, b) => a.minute - b.minute);
  for (const g of goalEvents) {
    events.push({
      time: `${g.minute}'`,
      type: g.type,
      text: g.text
    });
  }

  // 2. 試合終了
  events.push({
    time: "90'",
    type: 'final',
    text: `試合終了！ 最終結果：${homeClub.name} ${homeScore} - ${awayScore} ${awayClub.name}`
  });

  // 3. ホーム開催時の入場料・グッズ収入通知
  if (isPlayerHome && matchIncome > 0) {
    events.push({
      time: 'INFO',
      type: 'revenue',
      text: `[ホーム開催] 入場料・グッズ売上 +${formatMoney(matchIncome)} がクラブ資金に加算されました`
    });
  }

  return events;
}

/**
 * 1節分（4試合）を進行する
 * @param {boolean} skipAnimation trueなら即座に完了（シーズン一括スキップ用）
 */
function playNextMatchweek(skipAnimation = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.currentWeek >= gameState.totalWeeks) {
    return;
  }
  if (gameState.isSimulating) {
    return; // 演出中の多重実行防止
  }

  const weekIndex = gameState.currentWeek;
  const weekMatches = gameState.schedule[weekIndex];
  const results = [];
  let playerMatchData = null;

  for (const match of weekMatches) {
    const homeClub = getClubById(match.homeId);
    const awayClub = getClubById(match.awayId);

    const { homeScore, awayScore } = simulateMatch(homeClub, awayClub);
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.played = true;

    // ホーム開催時のサポーター数に応じた入場料・グッズ収入（約1,500万〜2,500万円）
    const matchIncome = Math.round((homeClub.supporters * 1.25 + randInt(-80, 80)) / 10) * 10;
    homeClub.funds += matchIncome;
    match.homeRevenue = matchIncome;

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

    const matchObj = {
      week: weekIndex + 1,
      homeClub,
      awayClub,
      homeScore,
      awayScore,
      isPlayerHome: homeClub.isPlayer,
      isPlayerMatch: homeClub.isPlayer || awayClub.isPlayer,
      matchIncome
    };
    results.push(matchObj);

    if (matchObj.isPlayerMatch) {
      playerMatchData = matchObj;
    }
  }

  gameState.currentWeek += 1;
  gameState.lastWeekResults = results;

  const tickerEvents = playerMatchData ? generateMatchTickerEvents(playerMatchData) : [];
  gameState.lastMatchTicker = {
    week: weekIndex + 1,
    events: tickerEvents,
    completed: skipAnimation
  };

  // 全14節終了時の判定
  const isFinalWeek = gameState.currentWeek === gameState.totalWeeks;

  if (skipAnimation) {
    if (isFinalWeek) {
      processSeasonEnd();
    }
    renderAll();
    return;
  }

  // テキスト速報アニメーション演出（約1秒）
  runMatchTickerAnimation(tickerEvents, () => {
    if (isFinalWeek) {
      processSeasonEnd();
    }
    renderAll();
  });
}

/**
 * テキスト速報ログを1行ずつテンポよく表示するアニメーション演出（約1秒）
 */
function runMatchTickerAnimation(events, onComplete) {
  gameState.isSimulating = true;
  renderHeader(); // ボタンをdisabledにするため更新

  const container = document.getElementById('match-results-container');
  const subtitle = document.getElementById('log-panel-subtitle');
  subtitle.textContent = `MATCHWEEK ${gameState.currentWeek} LIVE TICKER`;

  // 速報枠を表示
  container.innerHTML = `
    <div class="match-ticker-box">
      <div class="ticker-header">
        <span class="ticker-title">第${gameState.currentWeek}節 自チーム速報</span>
        <span class="ticker-live-badge">MATCH IN PROGRESS</span>
      </div>
      <div class="ticker-feed" id="ticker-feed">
        <!-- 順次行を追加 -->
      </div>
    </div>
  `;

  const feedEl = document.getElementById('ticker-feed');
  const stepDelay = Math.max(160, Math.floor(950 / Math.max(events.length, 1)));
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
 * シーズン終了まで残り全節を一気にスキップ（演出なし）
 */
function skipToSeasonEnd() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;
  while (!gameState.isSeasonOver && gameState.currentWeek < gameState.totalWeeks) {
    playNextMatchweek(true);
  }
}

/**
 * 年齢と成長タイプに応じた能力変動値を算出
 */
function computeStatGrowth(player) {
  const age = player.age;
  const gt = player.growthType;

  let atkRange, defRange, staRange;

  if (age <= 23) {
    if (gt === 'early') {
      atkRange = [1, 5];
      defRange = [1, 5];
      staRange = [1, 5];
    } else if (gt === 'normal') {
      atkRange = [0, 4];
      defRange = [0, 4];
      staRange = [0, 4];
    } else {
      atkRange = [0, 3];
      defRange = [0, 3];
      staRange = [0, 3];
    }
  } else if (age <= 29) {
    if (gt === 'early') {
      atkRange = age >= 27 ? [-2, 1] : [-1, 2];
      defRange = age >= 27 ? [-2, 1] : [-1, 2];
      staRange = age >= 27 ? [-3, 0] : [-1, 1];
    } else if (gt === 'normal') {
      atkRange = [-1, 2];
      defRange = [-1, 2];
      staRange = [-1, 2];
    } else {
      atkRange = [1, 4];
      defRange = [1, 4];
      staRange = [0, 3];
    }
  } else {
    if (gt === 'late') {
      atkRange = [-2, 1];
      defRange = [-2, 1];
      staRange = [-3, 0];
    } else if (gt === 'normal') {
      atkRange = [-3, 0];
      defRange = [-3, 0];
      staRange = [-5, -1];
    } else {
      atkRange = [-4, -1];
      defRange = [-4, -1];
      staRange = [-6, -2];
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

  if (player.growthType === 'late') baseProb -= 0.12;
  if (player.growthType === 'early') baseProb += 0.10;

  return Math.random() < baseProb;
}

/**
 * シーズン終了時の処理（収入加算・加齢・成長・引退・移籍市場オープン）
 */
function processSeasonEnd() {
  gameState.isSeasonOver = true;
  gameState.selectedPlayerId = null;

  const sortedClubs = getSortedStandings();
  const playerRankIndex = sortedClubs.findIndex(c => c.isPlayer);
  const playerRank = playerRankIndex + 1;

  let playerPrize = 0;
  let playerSponsorIncome = 0;

  sortedClubs.forEach((club, idx) => {
    const prize = PRIZE_MONEY_TABLE[idx] || 500;
    const sponsorIncome = Math.round((club.supporters * 1.35) / 50) * 50;
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

      if (shouldPlayerRetire(p)) {
        p.isRetired = true;
        p.isStarter = false;
        if (club.isPlayer) {
          playerRetirementLogs.push(
            `[現役引退] ${p.pos} ${p.name} (${p.age}歳 / ${getGrowthTypeLabel(p.growthType)}) が今シーズン限りで現役を引退しました`
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

      p.salary = calculatePlayerSalary(p.pos, p.atk, p.def, p.sta, p.age);

      if (club.isPlayer) {
        const totalDiff = p.lastDiff.atk + p.lastDiff.def + p.lastDiff.sta;
        const sign = totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;
        playerAgingLogs.push({
          name: p.name,
          pos: p.pos,
          age: p.age,
          growthLabel: getGrowthTypeLabel(p.growthType),
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
  playerClub.players.push(candidate);

  gameState.transferMarket.splice(idx, 1);
  renderAll();
}

/**
 * 自チームの選手を契約解除（放出）する
 */
function releaseRosterPlayer(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  const samePosCount = playerClub.players.filter(p => p.pos === target.pos).length;
  const minRequired = REQUIRED_STARTERS[target.pos] || 1;
  if (samePosCount <= minRequired) {
    return; // 必須スタメン数を下回る放出を防止
  }

  playerClub.players = playerClub.players.filter(p => p.id !== playerId);
  if (gameState.selectedPlayerId === playerId) {
    gameState.selectedPlayerId = null;
  }

  ensureValidSquadAndStarters(playerClub);
  renderAll();
}

/**
 * スタメン / ベンチ切り替えボタンのクリック処理
 * スタメン数は GK1名, DF4名, MF4名, FW2名の計11名固定を維持
 */
function togglePlayerStarter(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  const samePosStarters = playerClub.players.filter(p => p.pos === target.pos && p.isStarter);
  const samePosBench = playerClub.players.filter(p => p.pos === target.pos && !p.isStarter);
  const requiredCount = REQUIRED_STARTERS[target.pos] || 1;

  if (target.isStarter) {
    // スタメンからベンチへ降格：同ポジションにベンチ選手がいれば、最高総合力のベンチ選手を自動昇格
    if (samePosBench.length > 0) {
      samePosBench.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
      target.isStarter = false;
      samePosBench[0].isStarter = true;
    }
  } else {
    // ベンチからスタメンへ昇格：同ポジションのスタメンで最低総合力の選手をベンチへ降格
    if (samePosStarters.length >= requiredCount) {
      samePosStarters.sort((a, b) => getPlayerOverallRating(a) - getPlayerOverallRating(b));
      samePosStarters[0].isStarter = false;
      target.isStarter = true;
    } else {
      target.isStarter = true;
    }
  }

  gameState.selectedPlayerId = null;
  renderRoster();
}

/**
 * 年俸を支払い、新シーズンを開幕する
 */
function startNextSeason() {
  if (!gameState.isSeasonOver || gameState.isGameOver || gameState.isSimulating) return;

  for (const club of gameState.clubs) {
    const payroll = getClubTotalPayroll(club);
    club.funds -= payroll;
  }

  const playerClub = getPlayerClub();

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
 * 順位表のソート（勝点 → 得失点差 → 総得点 → クラブID）
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
 * 自チームの選手行クリックによるスタメン・ベンチ入れ替え処理（直接スワップ）
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

  if (prevPlayer.pos === clickedPlayer.pos && prevPlayer.isStarter !== clickedPlayer.isStarter) {
    const temp = prevPlayer.isStarter;
    prevPlayer.isStarter = clickedPlayer.isStarter;
    clickedPlayer.isStarter = temp;
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

  // 財務状況バッジ：「健全」「警告」「債務超過」
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

  // アクションボタン切り替え
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
    banner.textContent = `【警告：債務超過】クラブ資金がマイナス（${formatMoney(playerClub.funds)}）です。次シーズン開幕時も債務超過が続くとGM解任（ゲームオーバー）となります。高年俸選手の契約解除や上位入賞で収支を改善してください。`;
    banner.classList.remove('hidden');
    return;
  }

  banner.classList.add('hidden');
}

/**
 * オフシーズン決算・世代交代サマリーの描画
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
    `${s.season}年目シーズン終了・決算報告（最終順位：第${s.rank}位） — オフシーズン編成フェーズ`;

  document.getElementById('summary-reward-text').textContent =
    `収入加算：順位賞金 +${formatMoney(s.prize)} ／ 年間入場料・スポンサー料 +${formatMoney(s.sponsorIncome)}（計 +${formatMoney(s.totalIncome)}）`;

  const projEl = document.getElementById('summary-payroll-projection');
  const deficitWarning = projectedBalance < 0 ? ' 【警告：このまま開幕すると債務超過になります。不要な選手を放出して年俸を削減してください】' : '';
  projEl.textContent =
    `現在資金：${formatMoney(playerClub.funds)} ／ 翌シーズン年俸合計（開幕時支払）：-${formatMoney(currentPayroll)} ➜ 開幕時予想残高：${formatMoney(projectedBalance)}${deficitWarning}`;
  projEl.className = projectedBalance < 0 ? 'mono text-danger' : 'mono accent-green';

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
 * 試合結果ログおよびテキスト速報の描画
 */
function renderMatchLog() {
  if (gameState.isSimulating) {
    return; // 速報アニメーション実行中はDOMを上書きしない
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

  // 速報ログがある場合は上に配置
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
 * 自チーム登録選手一覧の描画（ポジション順ソート：GK ➔ DF ➔ MF ➔ FW）
 */
function renderRoster() {
  const playerClub = getPlayerClub();
  const stats = getTeamStarterStats(playerClub);
  const payroll = getClubTotalPayroll(playerClub);

  document.getElementById('team-total-atk').textContent = stats.totalAtk;
  document.getElementById('team-total-def').textContent = stats.totalDef;
  document.getElementById('team-avg-sta').textContent = stats.avgSta;
  document.getElementById('roster-total-payroll').textContent = formatMoney(payroll);

  const posCounts = { GK: 0, DF: 0, MF: 0, FW: 0 };
  for (const p of playerClub.players) {
    posCounts[p.pos] = (posCounts[p.pos] || 0) + 1;
  }

  // ポジション順（GK ➔ DF ➔ MF ➔ FW）でソートし、ポジション内ではスタメン優先・総合力順
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

    const ovr = getPlayerOverallRating(p);
    const growthLabel = getGrowthTypeLabel(p.growthType);
    const growthBadge = `<span class="growth-pill growth-${p.growthType}">${growthLabel}</span>`;

    const atkDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.atk) : '';
    const defDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.def) : '';
    const staDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.sta) : '';

    const canRelease = posCounts[p.pos] > REQUIRED_STARTERS[p.pos] && !gameState.isGameOver;
    const releaseBtnLabel = canRelease ? '契約解除' : '必須枠';

    const starterToggleBtn = p.isStarter
      ? `<button type="button" class="btn btn-starter-toggle btn-starter-active" data-starter-id="${p.id}" title="クリックでベンチと入替">スタメン</button>`
      : `<button type="button" class="btn btn-starter-toggle btn-bench-active" data-starter-id="${p.id}" title="クリックでスタメンへ昇格">ベンチ</button>`;

    return `
      <tr class="${rowClasses.join(' ')}" data-player-id="${p.id}">
        <td class="col-status">${starterToggleBtn}</td>
        <td class="col-pos"><span class="pos-tag pos-${p.pos}">${p.pos}</span></td>
        <td class="col-name">${p.name}</td>
        <td class="col-num">${p.age}</td>
        <td class="col-num accent-green"><strong>${ovr}</strong></td>
        <td class="col-growth">${growthBadge}</td>
        <td class="col-num">${p.atk}${atkDiff}</td>
        <td class="col-num">${p.def}${defDiff}</td>
        <td class="col-num">${p.sta}${staDiff}</td>
        <td class="col-num">${formatMoney(p.salary)}</td>
        <td class="col-action">
          <button type="button" class="btn btn-danger btn-sm btn-release-player" data-release-id="${p.id}" ${canRelease ? '' : 'disabled'}>
            ${releaseBtnLabel}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 移籍市場の描画
 */
function renderMarket() {
  const playerClub = getPlayerClub();
  const squadCount = playerClub.players.length;
  const isFull = squadCount >= MAX_SQUAD_SIZE;

  const posCounts = { GK: 0, DF: 0, MF: 0, FW: 0 };
  for (const p of playerClub.players) {
    posCounts[p.pos] = (posCounts[p.pos] || 0) + 1;
  }

  document.getElementById('market-pos-summary').innerHTML = `
    <span class="power-badge">GK <strong class="mono">${posCounts.GK}</strong></span>
    <span class="power-badge">DF <strong class="mono">${posCounts.DF}</strong></span>
    <span class="power-badge">MF <strong class="mono">${posCounts.MF}</strong></span>
    <span class="power-badge">FW <strong class="mono">${posCounts.FW}</strong></span>
    <span class="power-badge">所属枠 <strong class="mono">${squadCount} / ${MAX_SQUAD_SIZE}名</strong></span>
    <span class="power-badge">獲得予算（所持資金） <strong class="mono accent-gold">${formatMoney(playerClub.funds)}</strong></span>
  `;

  const noteEl = document.getElementById('market-status-note');
  if (gameState.isSeasonOver) {
    noteEl.textContent = '【オフシーズン補強期間】獲得金を支払って即戦力や若手を補強できます。新シーズン開幕時に所属全選手の年俸合計が差し引かれます。';
  } else {
    noteEl.textContent = 'シーズン中もFA・移籍候補リストの閲覧および緊急補強が可能です（所属上限：最大20名）。シーズン終了後に候補リストが更新されます。';
  }

  const tbody = document.getElementById('market-tbody');
  if (gameState.transferMarket.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-log-message">現在リストアップされている移籍候補選手はすべて獲得済みです。次シーズン終了時に新たな候補が登場します。</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = gameState.transferMarket.map(c => {
    const ovr = getPlayerOverallRating(c);
    const growthLabel = getGrowthTypeLabel(c.growthType);
    const growthBadge = `<span class="growth-pill growth-${c.growthType}">${growthLabel}</span>`;
    const canAfford = playerClub.funds >= c.transferFee;
    const canSign = !isFull && canAfford && !gameState.isGameOver && !gameState.isSimulating;

    let btnText = '獲得する';
    if (isFull) btnText = '枠上限(20名)';
    else if (!canAfford) btnText = '資金不足';

    return `
      <tr>
        <td class="col-pos"><span class="pos-tag pos-${c.pos}">${c.pos}</span></td>
        <td class="col-name">${c.name}</td>
        <td class="col-num">${c.age}</td>
        <td class="col-growth">${growthBadge}</td>
        <td class="col-num">${c.atk}</td>
        <td class="col-num">${c.def}</td>
        <td class="col-num">${c.sta}</td>
        <td class="col-num accent-green"><strong>${ovr}</strong></td>
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
 * 新規ゲームのセットアップ（初回およびゲームオーバー時のリセット共通）
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
      funds: INITIAL_CLUB_FUNDS, // 初期資金 3億5,000万円
      supporters: def.supporters,
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

  // 所属選手一覧のイベント（スタメン切替・放出・行選択）
  document.getElementById('roster-tbody').addEventListener('click', (e) => {
    const starterBtn = e.target.closest('.btn-starter-toggle');
    if (starterBtn) {
      e.stopPropagation();
      togglePlayerStarter(starterBtn.dataset.starterId);
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

  document.getElementById('market-tbody').addEventListener('click', (e) => {
    const signBtn = e.target.closest('.btn-sign-player');
    if (signBtn) {
      signMarketPlayer(signBtn.dataset.signId);
    }
  });

  setupNewGame();
}

document.addEventListener('DOMContentLoaded', initGame);
