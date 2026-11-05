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

// 1チームのポジション構成（計16名：スタメン11名＋ベンチ5名）
const SQUAD_COMPOSITION = [
  { pos: 'GK', total: 2, starters: 1 },
  { pos: 'DF', total: 5, starters: 4 },
  { pos: 'MF', total: 6, starters: 4 },
  { pos: 'FW', total: 3, starters: 2 }
];

// 順位賞金テーブル（単位：万円）
const PRIZE_MONEY_TABLE = [3000, 2000, 1500, 1200, 1000, 800, 600, 500];

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
  '圭介', '真司', '篤人', '長友', '本田', '香川', '遠藤', '岡崎', '川島', '吉田'
];

// ゲーム全体の状態管理
const gameState = {
  season: 1,
  currentWeek: 0, // 0 = 開幕前、1〜14 = 各節終了時点
  totalWeeks: 14,
  isSeasonOver: false,
  clubs: [],
  schedule: [], // 長さ14の配列、各要素は4試合のペア [{homeId, awayId, homeScore, awayScore, played}]
  lastWeekResults: [],
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
 * ポアソン分布に従う乱数を生成（Knuthのアルゴリズム）
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
 * ランダムな選手1名を生成
 */
function createPlayer(pos, basePower, isStarter, usedNames) {
  let fullName = '';
  for (let i = 0; i < 20; i++) {
    const ln = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
    const fn = FIRST_NAMES[randInt(0, FIRST_NAMES.length - 1)];
    fullName = `${ln} ${fn}`;
    if (!usedNames.has(fullName)) {
      usedNames.add(fullName);
      break;
    }
  }

  const age = randInt(18, 35);
  // スタメンはベンチより少し能力が高めになりやすい補正
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
    // FW
    atk = clamp(center + 6 + randInt(-6, 10), 1, 99);
    def = clamp(center - 18 + randInt(-8, 8), 1, 99);
    sta = clamp(center + randInt(-8, 6), 1, 99);
  }

  return {
    id: `p_${playerIdCounter++}`,
    name: fullName,
    age,
    pos,
    atk,
    def,
    sta,
    isStarter,
    lastDiff: null // シーズン終了時の能力変動記録 { atk: 0, def: 0, sta: 0 }
  };
}

/**
 * 1クラブ分の選手16名を生成
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
 * CPUクラブのスタメン11名を総合力順に自動編成
 */
function autoSelectStarters(club) {
  for (const group of SQUAD_COMPOSITION) {
    const posPlayers = club.players.filter(p => p.pos === group.pos);
    // ポジション適性に応じた評価値でソート
    posPlayers.sort((a, b) => {
      const scoreA = evaluatePlayerForPos(a);
      const scoreB = evaluatePlayerForPos(b);
      return scoreB - scoreA;
    });
    posPlayers.forEach((p, idx) => {
      p.isStarter = idx < group.starters;
    });
  }
}

function evaluatePlayerForPos(p) {
  if (p.pos === 'GK') return p.def * 1.8 + p.sta * 0.4;
  if (p.pos === 'DF') return p.def * 1.5 + p.sta * 0.5 + p.atk * 0.3;
  if (p.pos === 'MF') return p.atk * 1.0 + p.def * 1.0 + p.sta * 0.6;
  return p.atk * 1.6 + p.sta * 0.5 + p.def * 0.2;
}

/**
 * 8チームの2回戦総当たり（全14節・各節4試合）のスケジュールを生成（サークル法）
 */
function generateSeasonSchedule(clubs) {
  const ids = clubs.map(c => c.id);
  const n = ids.length; // 8
  const half = n / 2;   // 4
  const firstHalfWeeks = [];

  const rotating = ids.slice(1); // 7チーム回転、ids[0]固定

  for (let round = 0; round < n - 1; round++) {
    const currentList = [ids[0], ...rotating];
    const matches = [];
    for (let i = 0; i < half; i++) {
      const teamA = currentList[i];
      const teamB = currentList[n - 1 - i];
      // 節ごとにホーム＆アウェイを交互に割り振る
      if ((round + i) % 2 === 0) {
        matches.push({ homeId: teamA, awayId: teamB, homeScore: null, awayScore: null, played: false });
      } else {
        matches.push({ homeId: teamB, awayId: teamA, homeScore: null, awayScore: null, played: false });
      }
    }
    firstHalfWeeks.push(matches);

    // 末尾を先頭へローテーション
    rotating.unshift(rotating.pop());
  }

  // 後半7節は前半7節のホーム＆アウェイを反転
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
  const starters = club.players.filter(p => p.isStarter);
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

  // スタミナ補正係数 (0.85 〜 1.15程度)
  const homeStaFactor = 0.85 + (homeStats.avgSta / 100) * 0.3;
  const awayStaFactor = 0.85 + (awayStats.avgSta / 100) * 0.3;

  // 実効攻撃力・実効守備力（ホームアドバンテージ +4%）
  const homeEffAtk = homeStats.totalAtk * homeStaFactor * 1.04;
  const homeEffDef = homeStats.totalDef * homeStaFactor * 1.04;
  const awayEffAtk = awayStats.totalAtk * awayStaFactor;
  const awayEffDef = awayStats.totalDef * awayStaFactor;

  // 期待得点（lambda）の算出：基準1.35点 × (攻撃力 / 相手守備力)
  const rawHomeLambda = 1.38 * Math.pow(homeEffAtk / Math.max(awayEffDef, 200), 1.15);
  const rawAwayLambda = 1.22 * Math.pow(awayEffAtk / Math.max(homeEffDef, 200), 1.15);

  const homeLambda = clamp(rawHomeLambda, 0.3, 4.2);
  const awayLambda = clamp(rawAwayLambda, 0.3, 4.0);

  const homeScore = samplePoisson(homeLambda);
  const awayScore = samplePoisson(awayLambda);

  return { homeScore, awayScore };
}

/**
 * 1節分（4試合）を進行する
 */
function playNextMatchweek() {
  if (gameState.isSeasonOver || gameState.currentWeek >= gameState.totalWeeks) {
    return;
  }

  const weekIndex = gameState.currentWeek;
  const weekMatches = gameState.schedule[weekIndex];
  const results = [];

  for (const match of weekMatches) {
    const homeClub = getClubById(match.homeId);
    const awayClub = getClubById(match.awayId);

    const { homeScore, awayScore } = simulateMatch(homeClub, awayClub);
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.played = true;

    // 成績反映
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
      homeClub.supporters = Math.max(5000, homeClub.supporters + randInt(80, 220));
      awayClub.supporters = Math.max(5000, awayClub.supporters - randInt(20, 90));
    } else if (homeScore < awayScore) {
      awayClub.won += 1;
      awayClub.pts += 3;
      homeClub.lost += 1;
      awayClub.supporters = Math.max(5000, awayClub.supporters + randInt(80, 220));
      homeClub.supporters = Math.max(5000, homeClub.supporters - randInt(20, 90));
    } else {
      homeClub.drawn += 1;
      awayClub.drawn += 1;
      homeClub.pts += 1;
      awayClub.pts += 1;
      homeClub.supporters = Math.max(5000, homeClub.supporters + randInt(-20, 60));
      awayClub.supporters = Math.max(5000, awayClub.supporters + randInt(-20, 60));
    }

    results.push({
      week: weekIndex + 1,
      homeClub,
      awayClub,
      homeScore,
      awayScore
    });
  }

  gameState.currentWeek += 1;
  gameState.lastWeekResults = results;

  // 最終節（第14節）終了時は自動的にシーズン終了・決算処理を実行
  if (gameState.currentWeek === gameState.totalWeeks) {
    processSeasonEnd();
  }

  renderAll();
}

/**
 * シーズン終了まで残り全節を一気にスキップ
 */
function skipToSeasonEnd() {
  while (!gameState.isSeasonOver && gameState.currentWeek < gameState.totalWeeks) {
    playNextMatchweek();
  }
}

/**
 * シーズン終了と決算処理（賞金支給、加齢、能力成長・衰退）
 */
function processSeasonEnd() {
  gameState.isSeasonOver = true;

  const sortedClubs = getSortedStandings();
  const playerRankIndex = sortedClubs.findIndex(c => c.isPlayer);
  const playerRank = playerRankIndex + 1;
  const playerClub = sortedClubs[playerRankIndex];

  // 全クラブに順位に応じた賞金を支給
  sortedClubs.forEach((club, idx) => {
    const prize = PRIZE_MONEY_TABLE[idx] || 500;
    club.funds += prize;
  });

  const playerPrize = PRIZE_MONEY_TABLE[playerRankIndex] || 500;

  // 全クラブの全選手の年齢+1 ＆ 年齢帯に応じた能力変動
  const playerAgingLogs = [];

  for (const club of gameState.clubs) {
    for (const p of club.players) {
      p.age += 1;

      let minDelta, maxDelta;
      if (p.age <= 23) {
        // 若手：大きく成長
        minDelta = 0;
        maxDelta = 4;
      } else if (p.age <= 27) {
        // 中堅：緩やかに成長・維持
        minDelta = -1;
        maxDelta = 2;
      } else if (p.age <= 30) {
        // ベテラン入り口：維持〜微減
        minDelta = -2;
        maxDelta = 1;
      } else {
        // ベテラン：衰退
        minDelta = -4;
        maxDelta = 0;
      }

      const dAtk = randInt(minDelta, maxDelta);
      const dDef = randInt(minDelta, maxDelta);
      const dSta = randInt(minDelta, maxDelta);

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

      if (club.isPlayer) {
        const totalDiff = p.lastDiff.atk + p.lastDiff.def + p.lastDiff.sta;
        const sign = totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;
        playerAgingLogs.push({
          name: p.name,
          pos: p.pos,
          age: p.age,
          totalDiff,
          sign
        });
      }
    }

    // CPUクラブは新能力に合わせてスタメンを再編成
    if (!club.isPlayer) {
      autoSelectStarters(club);
    }
  }

  // 決算サマリー表示を更新
  const summaryBox = document.getElementById('season-summary-box');
  const headlineEl = document.getElementById('summary-headline');
  const rewardEl = document.getElementById('summary-reward-text');
  const agingLogEl = document.getElementById('summary-aging-log');

  headlineEl.textContent = `${gameState.season}年目シーズン終了 — 最終順位：第${playerRank}位`;
  rewardEl.textContent = `順位賞金 +${playerPrize.toLocaleString()}万円 を獲得しました（現在の所持資金：${playerClub.funds.toLocaleString()}万円）`;

  agingLogEl.innerHTML = playerAgingLogs.map(item => {
    const diffClass = item.totalDiff > 0 ? 'diff-up' : (item.totalDiff < 0 ? 'diff-down' : '');
    return `<div><span class="mono">[${item.pos}]</span> ${item.name} (<span class="mono">${item.age}歳</span>) <span class="mono ${diffClass}">総合 ${item.sign}</span></div>`;
  }).join('');

  summaryBox.classList.remove('hidden');
}

/**
 * 次のシーズンへ移行する
 */
function startNextSeason() {
  if (!gameState.isSeasonOver) return;

  gameState.season += 1;
  gameState.currentWeek = 0;
  gameState.isSeasonOver = false;
  gameState.lastWeekResults = [];
  gameState.selectedPlayerId = null;

  // 各クラブのリーグ成績をリセットし、選手の差分表示をクリア
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

  // 新シーズンの日程を再生成
  gameState.schedule = generateSeasonSchedule(gameState.clubs);

  document.getElementById('season-summary-box').classList.add('hidden');
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
 * 自チームの選手行クリックによるスタメン・ベンチ入れ替え処理
 */
function handleRosterClick(playerId) {
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

  // 同じポジションかつスタメン/ベンチが異なる場合は入れ替え
  if (prevPlayer.pos === clickedPlayer.pos && prevPlayer.isStarter !== clickedPlayer.isStarter) {
    const temp = prevPlayer.isStarter;
    prevPlayer.isStarter = clickedPlayer.isStarter;
    clickedPlayer.isStarter = temp;
    gameState.selectedPlayerId = null;
  } else {
    // それ以外は選択対象を切り替え
    gameState.selectedPlayerId = playerId;
  }

  renderRoster();
}

/**
 * 画面全体の描画更新
 */
function renderAll() {
  renderHeader();
  renderStandings();
  renderMatchLog();
  renderRoster();
}

/**
 * 上部ステータスの描画
 */
function renderHeader() {
  const playerClub = getPlayerClub();
  document.getElementById('header-club-name').textContent = playerClub.name;
  document.getElementById('header-season').textContent = `${gameState.season}年目`;

  if (gameState.isSeasonOver) {
    document.getElementById('header-matchweek').textContent = `全${gameState.totalWeeks}節終了`;
  } else {
    const nextWeek = Math.min(gameState.currentWeek + 1, gameState.totalWeeks);
    document.getElementById('header-matchweek').textContent = `第${nextWeek}節 / 全${gameState.totalWeeks}節`;
  }

  document.getElementById('header-funds').textContent = `${playerClub.funds.toLocaleString()}万円`;
  document.getElementById('header-supporters').textContent = `${playerClub.supporters.toLocaleString()}人`;

  const btnPlayNext = document.getElementById('btn-play-next');
  const btnSkipSeason = document.getElementById('btn-skip-season');
  const btnNextSeason = document.getElementById('btn-next-season');

  if (gameState.isSeasonOver) {
    btnPlayNext.classList.add('hidden');
    btnSkipSeason.classList.add('hidden');
    btnNextSeason.classList.remove('hidden');
  } else {
    btnPlayNext.classList.remove('hidden');
    btnSkipSeason.classList.remove('hidden');
    btnNextSeason.classList.add('hidden');
  }
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
 * 試合結果ログの描画
 */
function renderMatchLog() {
  const container = document.getElementById('match-results-container');
  const subtitle = document.getElementById('log-panel-subtitle');

  if (gameState.lastWeekResults.length === 0) {
    subtitle.textContent = 'READY FOR KICKOFF';
    // 次節の対戦カードプレビューを表示
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

  container.innerHTML = gameState.lastWeekResults.map(r => {
    const isPlayerMatch = r.homeClub.isPlayer || r.awayClub.isPlayer;
    return `
      <div class="match-card ${isPlayerMatch ? 'player-match' : ''}">
        <div class="match-team home ${r.homeClub.isPlayer ? 'is-player' : ''}">${r.homeClub.name}</div>
        <div class="match-score-box">${r.homeScore} - ${r.awayScore}</div>
        <div class="match-team away ${r.awayClub.isPlayer ? 'is-player' : ''}">${r.awayClub.name}</div>
      </div>
    `;
  }).join('');
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
 * 自チーム登録選手一覧の描画
 */
function renderRoster() {
  const playerClub = getPlayerClub();
  const stats = getTeamStarterStats(playerClub);

  document.getElementById('team-total-atk').textContent = stats.totalAtk;
  document.getElementById('team-total-def').textContent = stats.totalDef;
  document.getElementById('team-avg-sta').textContent = stats.avgSta;

  const posOrder = { GK: 1, DF: 2, MF: 3, FW: 4 };
  const sortedPlayers = [...playerClub.players].sort((a, b) => {
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    if (posOrder[a.pos] !== posOrder[b.pos]) return posOrder[a.pos] - posOrder[b.pos];
    return b.atk + b.def - (a.atk + a.def);
  });

  const tbody = document.getElementById('roster-tbody');
  tbody.innerHTML = sortedPlayers.map(p => {
    const rowClasses = [];
    if (!p.isStarter) rowClasses.push('row-bench');
    if (gameState.selectedPlayerId === p.id) rowClasses.push('row-selected');

    const statusBadge = p.isStarter
      ? '<span class="status-pill status-starter">STARTER</span>'
      : '<span class="status-pill status-bench">BENCH</span>';

    const atkDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.atk) : '';
    const defDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.def) : '';
    const staDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.sta) : '';

    return `
      <tr class="${rowClasses.join(' ')}" data-player-id="${p.id}">
        <td class="col-status">${statusBadge}</td>
        <td class="col-pos"><span class="pos-tag pos-${p.pos}">${p.pos}</span></td>
        <td class="col-name">${p.name}</td>
        <td class="col-num">${p.age}</td>
        <td class="col-num">${p.atk}${atkDiff}</td>
        <td class="col-num">${p.def}${defDiff}</td>
        <td class="col-num">${p.sta}${staDiff}</td>
      </tr>
    `;
  }).join('');
}

/**
 * ゲーム初期化処理
 */
function initGame() {
  const usedNames = new Set();

  gameState.clubs = CLUB_DEFINITIONS.map(def => {
    const club = {
      id: def.id,
      name: def.name,
      isPlayer: def.isPlayer,
      funds: 5000, // 初期資金 5,000万円
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

  // イベントリスナー登録
  document.getElementById('btn-play-next').addEventListener('click', playNextMatchweek);
  document.getElementById('btn-skip-season').addEventListener('click', skipToSeasonEnd);
  document.getElementById('btn-next-season').addEventListener('click', startNextSeason);

  document.getElementById('roster-tbody').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-player-id]');
    if (tr) {
      handleRosterClick(tr.dataset.playerId);
    }
  });

  renderAll();
}

document.addEventListener('DOMContentLoaded', initGame);
