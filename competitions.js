/**
 * competitions.js - フェーズ4: 2部リーグ新設・昇降格・国内2大カップ戦・欧州3大カップ戦
 * 
 * 1. 2部リーグ（チャンピオンシップ：架空24クラブ、OVR 64〜74）
 * 2. 昇降格システム（1部18〜20位降格、2部1〜3位昇格、自クラブ降格時の理事会通告）
 * 3. 国内2大カップ戦（リーグカップ LGC、ナショナルカップ NAT）
 * 4. 欧州3大カップ戦（チャンピオンズカップ CL、ヨーロッパカップ EL、カンファレンスカップ ECL）
 * 5. 高速ダイジェスト試合エンジン（simQuickMatch）
 * 6. 過密日程（週2試合）のスタミナ消費・怪我リスク補正
 * 7. トーナメントブラケット描画 & 2部順位表描画
 */

// ==========================================
// 1. 2部リーグ（チャンピオンシップ）架空24クラブ定義
// ==========================================
const CHAMPIONSHIP_CLUBS_DEFINITIONS = [
  { id: 'c01', name: 'シェフィールド・S', shortName: 'SHS', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 74 },
  { id: 'c02', name: 'リーズ・U', shortName: 'LEU', primaryColor: '#FFCD00', secondaryColor: '#1D428A', pattern: 'split-vertical', shape: 'shield', basePower: 74 },
  { id: 'c03', name: 'バーンリー・C', shortName: 'BUR', primaryColor: '#6C1D45', secondaryColor: '#99D6EA', pattern: 'stripes-vertical', shape: 'circle', basePower: 73 },
  { id: 'c04', name: 'ノリッジ・C', shortName: 'NOR', primaryColor: '#FFF200', secondaryColor: '#00A651', pattern: 'sash-diagonal', shape: 'shield', basePower: 73 },
  { id: 'c05', name: 'ワトフォード・H', shortName: 'WAT', primaryColor: '#FBEE23', secondaryColor: '#ED2127', pattern: 'stripes-horizontal', shape: 'diamond', basePower: 72 },
  { id: 'c06', name: 'ミドルズブラ・B', shortName: 'MID', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 72 },
  { id: 'c07', name: 'ウェストブロム・A', shortName: 'WBA', primaryColor: '#122F67', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 72 },
  { id: 'c08', name: 'コヴェントリー・C', shortName: 'COV', primaryColor: '#00A3E0', secondaryColor: '#1D252C', pattern: 'halves-horizontal', shape: 'circle', basePower: 71 },
  { id: 'c09', name: 'ハルダーズフィールド', shortName: 'HUD', primaryColor: '#0E63AD', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 71 },
  { id: 'c10', name: 'プレストン・NE', shortName: 'PNE', primaryColor: '#FFFFFF', secondaryColor: '#002B49', pattern: 'quarters', shape: 'shield', basePower: 70 },
  { id: 'c11', name: 'ブリストル・C', shortName: 'BRC', primaryColor: '#C8102E', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 70 },
  { id: 'c12', name: 'ストーク・C', shortName: 'STK', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 },
  { id: 'c13', name: 'スウォンジー・C', shortName: 'SWA', primaryColor: '#121212', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 69 },
  { id: 'c14', name: 'カーディフ・C', shortName: 'CAR', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'circle', basePower: 69 },
  { id: 'c15', name: 'ミルウォール・L', shortName: 'MIL', primaryColor: '#002244', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 69 },
  { id: 'c16', name: 'ブラックバーン・R', shortName: 'BLA', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 68 },
  { id: 'c17', name: 'クイーンズパーク・R', shortName: 'QPR', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'diamond', basePower: 68 },
  { id: 'c18', name: 'ハル・C', shortName: 'HUL', primaryColor: '#F7941D', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 68 },
  { id: 'c19', name: 'サンダーランド・A', shortName: 'SUN', primaryColor: '#EB172B', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 67 },
  { id: 'c20', name: 'プリマス・A', shortName: 'PLY', primaryColor: '#0B3B24', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 66 },
  { id: 'c21', name: 'ロザラム・U', shortName: 'ROT', primaryColor: '#EE1C25', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 65 },
  { id: 'c22', name: 'バーミンガム・C', shortName: 'BIR', primaryColor: '#0000FF', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 66 },
  { id: 'c23', name: 'シェフィールド・W', shortName: 'SHW', primaryColor: '#002E6D', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'diamond', basePower: 65 },
  { id: 'c24', name: 'ルートン・T', shortName: 'LUT', primaryColor: '#F68B1F', secondaryColor: '#002B49', pattern: 'chevron-down', shape: 'shield', basePower: 67 }
];

// ==========================================
// 2. 欧州強豪クラブ（五大リーグ架空クラブデータベース）
// ==========================================
const EUROPEAN_CLUBS_DATABASE = {
  SPAIN: [
    { id: 'es01', name: 'マドリード・ブランコ', shortName: 'MBL', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#41748D', pattern: 'sash-diagonal', shape: 'shield', basePower: 88 },
    { id: 'es02', name: 'バルセロナ・ブラウグラナ', shortName: 'BBL', country: 'ESP', primaryColor: '#A50044', secondaryColor: '#004D98', pattern: 'stripes-vertical', shape: 'shield', basePower: 87 },
    { id: 'es03', name: 'アトレティコ・ロホ', shortName: 'ARO', country: 'ESP', primaryColor: '#CB3524', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 84 },
    { id: 'es04', name: 'セビージャ・ブランコ', shortName: 'SBL', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#D4001F', pattern: 'split-vertical', shape: 'shield', basePower: 81 },
    { id: 'es05', name: 'バレンシア・チェ', shortName: 'VCH', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#EE7402', pattern: 'halves-vertical', shape: 'circle', basePower: 79 },
    { id: 'es06', name: 'ビジャレアル・アマリージョ', shortName: 'VAM', country: 'ESP', primaryColor: '#F3B200', secondaryColor: '#003366', pattern: 'circle-center', shape: 'shield', basePower: 80 },
    { id: 'es07', name: 'レアル・サン・セバスティアン', shortName: 'RSS', country: 'ESP', primaryColor: '#0047AB', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 81 },
    { id: 'es08', name: 'ビルバオ・レオン', shortName: 'BLE', country: 'ESP', primaryColor: '#ED1C24', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
    { id: 'es09', name: 'ベティス・ベルディ', shortName: 'BVE', country: 'ESP', primaryColor: '#0BB364', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
    { id: 'es10', name: 'ジローナ・ロジ', shortName: 'GRO', country: 'ESP', primaryColor: '#D31411', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 77 }
  ],
  GERMANY: [
    { id: 'de01', name: 'バイエルン・ロート', shortName: 'BRO', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#0066B2', pattern: 'quarters', shape: 'circle', basePower: 88 },
    { id: 'de02', name: 'ドルトムント・ゲルプ', shortName: 'DGE', country: 'GER', primaryColor: '#FDE100', secondaryColor: '#121212', pattern: 'stripes-vertical', shape: 'circle', basePower: 85 },
    { id: 'de03', name: 'レバークーゼン・ヴェルク', shortName: 'LWE', country: 'GER', primaryColor: '#E32221', secondaryColor: '#121212', pattern: 'sash-diagonal', shape: 'shield', basePower: 86 },
    { id: 'de04', name: 'ライプツィヒ・ブルズ', shortName: 'LBU', country: 'GER', primaryColor: '#ED1B24', secondaryColor: '#002B49', pattern: 'chevron-down', shape: 'shield', basePower: 83 },
    { id: 'de05', name: 'フランクフルト・アドラー', shortName: 'FAD', country: 'GER', primaryColor: '#E1000F', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'circle', basePower: 80 },
    { id: 'de06', name: 'シュトゥットガルト・クロイツ', shortName: 'SKR', country: 'GER', primaryColor: '#FFFFFF', secondaryColor: '#E32219', pattern: 'stripes-horizontal', shape: 'shield', basePower: 80 },
    { id: 'de07', name: 'ボルシア・メンヒェン', shortName: 'BMG', country: 'GER', primaryColor: '#000000', secondaryColor: '#009F4D', pattern: 'split-vertical', shape: 'diamond', basePower: 77 },
    { id: 'de08', name: 'ヴォルフスブルク・グリューン', shortName: 'WGR', country: 'GER', primaryColor: '#65B32E', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 77 },
    { id: 'de09', name: 'ブレーメン・ヴェルダー', shortName: 'BWE', country: 'GER', primaryColor: '#1C7C44', secondaryColor: '#FFFFFF', pattern: 'diamond', shape: 'diamond', basePower: 76 },
    { id: 'de10', name: 'フライブルク・フォルクス', shortName: 'FVO', country: 'GER', primaryColor: '#000000', secondaryColor: '#E2001A', pattern: 'halves-vertical', shape: 'shield', basePower: 76 }
  ],
  ITALY: [
    { id: 'it01', name: 'ミラノ・ネラッズーリ', shortName: 'MNE', country: 'ITA', primaryColor: '#0066B2', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'circle', basePower: 86 },
    { id: 'it02', name: 'ミラノ・ロッソネーリ', shortName: 'MRO', country: 'ITA', primaryColor: '#FB090B', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 85 },
    { id: 'it03', name: 'トリノ・ビアンコネーロ', shortName: 'TBI', country: 'ITA', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 84 },
    { id: 'it04', name: 'ナポリ・アズーロ', shortName: 'NAZ', country: 'ITA', primaryColor: '#008FD7', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 83 },
    { id: 'it05', name: 'ローマ・ジャッロロッソ', shortName: 'RGI', country: 'ITA', primaryColor: '#8E1F2F', secondaryColor: '#F0BC42', pattern: 'halves-vertical', shape: 'shield', basePower: 81 },
    { id: 'it06', name: 'ラツィオ・ビアンコチェレステ', shortName: 'LBC', country: 'ITA', primaryColor: '#87D8F7', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 80 },
    { id: 'it07', name: 'アタランタ・ベルガモ', shortName: 'ABE', country: 'ITA', primaryColor: '#1E71B8', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 82 },
    { id: 'it08', name: 'フィレンツェ・ヴィオラ', shortName: 'FVI', country: 'ITA', primaryColor: '#4F2382', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'diamond', basePower: 79 },
    { id: 'it09', name: 'ボローニャ・ロッソブルー', shortName: 'BRO', country: 'ITA', primaryColor: '#1B2C4B', secondaryColor: '#9C1B2C', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
    { id: 'it10', name: 'トリノ・グランタ', shortName: 'TGR', country: 'ITA', primaryColor: '#7A1C20', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 76 }
  ],
  FRANCE: [
    { id: 'fr01', name: 'パリ・ルージュエブルー', shortName: 'PRB', country: 'FRA', primaryColor: '#002B49', secondaryColor: '#DA291C', pattern: 'stripes-vertical', shape: 'circle', basePower: 87 },
    { id: 'fr02', name: 'マルセイユ・シエル', shortName: 'MCI', country: 'FRA', primaryColor: '#00A3E0', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 82 },
    { id: 'fr03', name: 'モナコ・プリンス', shortName: 'MPR', country: 'FRA', primaryColor: '#E2001A', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 82 },
    { id: 'fr04', name: 'リヨン・オランピック', shortName: 'LOL', country: 'FRA', primaryColor: '#FFFFFF', secondaryColor: '#17366E', pattern: 'split-vertical', shape: 'shield', basePower: 80 },
    { id: 'fr05', name: 'リール・ドグ', shortName: 'LDO', country: 'FRA', primaryColor: '#E01E2E', secondaryColor: '#1D253C', pattern: 'chevron-down', shape: 'shield', basePower: 80 },
    { id: 'fr06', name: 'レンヌ・ルージュ', shortName: 'RRU', country: 'FRA', primaryColor: '#E30613', secondaryColor: '#000000', pattern: 'halves-vertical', shape: 'circle', basePower: 79 },
    { id: 'fr07', name: 'ニース・アイグロン', shortName: 'NAI', country: 'FRA', primaryColor: '#DA291C', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
    { id: 'fr08', name: 'ランス・シャンパーニュ', shortName: 'RCH', country: 'FRA', primaryColor: '#D50032', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 77 },
    { id: 'fr09', name: 'トゥールーズ・ヴィオレ', shortName: 'TVI', country: 'FRA', primaryColor: '#53284F', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'diamond', basePower: 76 },
    { id: 'fr10', name: 'ストラスブール・アルザス', shortName: 'SAL', country: 'FRA', primaryColor: '#00539F', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 76 }
  ]
};

// ==========================================
// 3. 高速ダイジェスト試合エンジン（simQuickMatch）
// ==========================================
function simQuickMatch(homeClub, awayClub) {
  const getPower = (c) => {
    if (c.basePower) return c.basePower;
    if (typeof calcClubOvr === 'function') {
      const ovr = calcClubOvr(c);
      if (ovr > 0) return ovr;
    }
    if (c.targetRank) return 85 - (c.targetRank * 1.5);
    return 75;
  };

  const hp = getPower(homeClub) + 2.5; // ホームアドバンテージ
  const ap = getPower(awayClub);
  const diff = hp - ap;

  // 平均期待得点
  let homeExp = 1.45 + (diff * 0.08);
  let awayExp = 1.15 - (diff * 0.08);

  homeExp = Math.max(0.2, Math.min(4.5, homeExp));
  awayExp = Math.max(0.2, Math.min(4.0, awayExp));

  // ポアソン近似ゴール数生成
  const genGoals = (lambda) => {
    let k = 0;
    let p = Math.exp(-lambda);
    let s = p;
    const u = Math.random();
    while (u > s && k < 8) {
      k++;
      p *= lambda / k;
      s += p;
    }
    return k;
  };

  let homeScore = genGoals(homeExp);
  let awayScore = genGoals(awayExp);

  return { homeScore, awayScore };
}

// ノックアウト戦用（同点の場合はPK戦で決着）
function simKnockoutMatch(homeClub, awayClub) {
  const result = simQuickMatch(homeClub, awayClub);
  let { homeScore, awayScore } = result;
  let pkHome = null;
  let pkAway = null;
  let winner = null;

  if (homeScore > awayScore) {
    winner = homeClub;
  } else if (awayScore > homeScore) {
    winner = awayClub;
  } else {
    // PK戦で決着
    const hOvr = homeClub.basePower || (typeof calcClubOvr === 'function' ? calcClubOvr(homeClub) : 75);
    const aOvr = awayClub.basePower || (typeof calcClubOvr === 'function' ? calcClubOvr(awayClub) : 75);
    const hChance = 0.5 + (hOvr - aOvr) * 0.01;
    if (Math.random() < hChance) {
      winner = homeClub;
      pkHome = 5;
      pkAway = 4;
    } else {
      winner = awayClub;
      pkHome = 4;
      pkAway = 5;
    }
  }

  return {
    homeScore,
    awayScore,
    pkHome,
    pkAway,
    winnerId: winner.id,
    winnerClub: winner
  };
}

// ==========================================
// 4. コンペティション初期化
// ==========================================
function initSeasonCompetitions() {
  if (!gameState.competitions) {
    gameState.competitions = {};
  }
  initChampionshipLeague();
  initDomesticCups();
  initEuropeanCups();
  injectCupMatchesIntoCalendar();
}

function initChampionshipLeague() {
  if (!gameState.competitions.championship) {
    gameState.competitions.championship = {
      name: '2部リーグ（チャンピオンシップ）',
      shortName: 'チャンピオンシップ',
      clubs: CHAMPIONSHIP_CLUBS_DEFINITIONS.map(c => ({
        ...c,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      }))
    };
  } else {
    gameState.competitions.championship.clubs.forEach(c => {
      c.played = 0;
      c.won = 0;
      c.drawn = 0;
      c.lost = 0;
      c.gf = 0;
      c.ga = 0;
      c.gd = 0;
      c.pts = 0;
    });
  }
}

function advanceChampionshipWeek() {
  const comp = gameState.competitions && gameState.competitions.championship;
  if (!comp || !comp.clubs) return;

  const clubs = [...comp.clubs];
  for (let i = clubs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clubs[i], clubs[j]] = [clubs[j], clubs[i]];
  }

  for (let i = 0; i < clubs.length; i += 2) {
    const h = clubs[i];
    const a = clubs[i + 1];
    const res = simQuickMatch(h, a);
    h.played++;
    a.played++;
    h.gf += res.homeScore;
    h.ga += res.awayScore;
    a.gf += res.awayScore;
    a.ga += res.homeScore;
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;

    if (res.homeScore > res.awayScore) {
      h.won++;
      h.pts += 3;
      a.lost++;
    } else if (res.homeScore < res.awayScore) {
      a.won++;
      a.pts += 3;
      h.lost++;
    } else {
      h.drawn++;
      a.drawn++;
      h.pts += 1;
      a.pts += 1;
    }
  }
}

function generateKnockoutRound(clubs) {
  const pool = [...clubs];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const matches = [];
  for (let i = 0; i < pool.length; i += 2) {
    if (pool[i] && pool[i + 1]) {
      matches.push({
        homeId: pool[i].id,
        awayId: pool[i + 1].id,
        homeClub: pool[i],
        awayClub: pool[i + 1],
        homeScore: null,
        awayScore: null,
        pkHome: null,
        pkAway: null,
        winnerId: null,
        played: false
      });
    }
  }
  return matches;
}

function initDomesticCups() {
  const p1Clubs = gameState.clubs || [];
  const p2Clubs = (gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS;

  // 1. リーグカップ (LGC)
  // R32: 1部20クラブ + 2部上位12クラブ = 32クラブ
  const lgcParticipants = [...p1Clubs, ...p2Clubs.slice(0, 12)];
  gameState.competitions.leagueCup = {
    name: 'リーグカップ',
    enName: 'LEAGUE CUP',
    shortCode: 'LGC',
    currentRoundKey: 'R32',
    rounds: {
      R32: generateKnockoutRound(lgcParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 10000 // £10.0M
  };

  // 2. ナショナルカップ (NAT / FA杯相当)
  // R32: 1部20クラブ + 2部12クラブ = 32クラブ
  const natParticipants = [...p1Clubs, ...p2Clubs.slice(12, 24)];
  gameState.competitions.nationalCup = {
    name: 'ナショナルカップ',
    enName: 'NATIONAL CUP',
    shortCode: 'NAT',
    currentRoundKey: 'R32',
    rounds: {
      R32: generateKnockoutRound(natParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 15000 // £15.0M
  };
}

function initEuropeanCups() {
  const allEuroClubs = Object.values(EUROPEAN_CLUBS_DATABASE).flat();
  const premClubs = [...(gameState.clubs || [])].sort((a, b) => (b.pts || 0) - (a.pts || 0));

  // CL (チャンピオンズカップ): プレミア上位4クラブ + 欧州強豪28
  const clPrem = premClubs.slice(0, 4);
  const clForeign = allEuroClubs.filter(c => c.basePower >= 80).slice(0, 28);
  while (clForeign.length < 28) {
    clForeign.push(allEuroClubs[clForeign.length % allEuroClubs.length]);
  }
  const clParticipants = [...clPrem, ...clForeign];

  // EL (ヨーロッパカップ): プレミア5位・カップ枠 + 欧州強豪
  const elPrem = premClubs.slice(4, 6);
  const elForeign = allEuroClubs.filter(c => c.basePower >= 77 && c.basePower < 82).slice(0, 30);
  while (elForeign.length < 30) {
    elForeign.push(allEuroClubs[elForeign.length % allEuroClubs.length]);
  }
  const elParticipants = [...elPrem, ...elForeign];

  // ECL (カンファレンスカップ): プレミア6〜7位 + 欧州クラブ
  const eclPrem = premClubs.slice(6, 8);
  const eclForeign = allEuroClubs.filter(c => c.basePower < 78).slice(0, 30);
  while (eclForeign.length < 30) {
    eclForeign.push(allEuroClubs[eclForeign.length % allEuroClubs.length]);
  }
  const eclParticipants = [...eclPrem, ...eclForeign];

  gameState.competitions.championsCup = {
    name: 'チャンピオンズカップ',
    enName: 'CHAMPIONS CUP',
    shortCode: 'CL',
    participants: clParticipants,
    rounds: {
      R32: generateKnockoutRound(clParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 30000
  };

  gameState.competitions.europaCup = {
    name: 'ヨーロッパカップ',
    enName: 'EUROPA CUP',
    shortCode: 'EL',
    participants: elParticipants,
    rounds: {
      R32: generateKnockoutRound(elParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 18000
  };

  gameState.competitions.conferenceCup = {
    name: 'カンファレンスカップ',
    enName: 'CONFERENCE CUP',
    shortCode: 'ECL',
    participants: eclParticipants,
    rounds: {
      R32: generateKnockoutRound(eclParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 10000
  };
}

// カレンダーにカップ戦日程をマッピング
function injectCupMatchesIntoCalendar() {
  if (!gameState.calendar || gameState.calendar.length === 0) return;

  const scheduleMap = [
    { month: 9, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'R32', label: 'リーグ杯 2回戦' },
    { month: 10, dayOfWeek: 2, compType: 'championsCup', roundKey: 'R32', label: '欧州CL 1回戦' },
    { month: 10, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'R16', label: 'リーグ杯 3回戦' },
    { month: 11, dayOfWeek: 2, compType: 'europaCup', roundKey: 'R32', label: '欧州EL 1回戦' },
    { month: 12, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'QF', label: 'リーグ杯 準々決勝' },
    { month: 1, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'R32', label: 'ナショナル杯 2回戦' },
    { month: 2, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'FINAL', label: 'リーグ杯 決勝' },
    { month: 3, dayOfWeek: 2, compType: 'championsCup', roundKey: 'R16', label: '欧州CL 2回戦' },
    { month: 3, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'R16', label: 'ナショナル杯 3回戦' },
    { month: 4, dayOfWeek: 2, compType: 'championsCup', roundKey: 'QF', label: '欧州CL 準々決勝' },
    { month: 4, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'QF', label: 'ナショナル杯 準々決勝' },
    { month: 5, dayOfWeek: 2, compType: 'championsCup', roundKey: 'FINAL', label: '欧州CL 決勝' },
    { month: 5, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'FINAL', label: 'ナショナル杯 決勝' }
  ];

  scheduleMap.forEach(sc => {
    const day = gameState.calendar.find(d => d.month === sc.month && d.dayOfWeek === sc.dayOfWeek && !d.isMatchDay);
    if (day) {
      day.isCupMatchDay = true;
      day.cupCompType = sc.compType;
      day.cupRoundKey = sc.roundKey;
      day.cupLabel = sc.label;

      const comp = gameState.competitions && gameState.competitions[sc.compType];
      if (comp) {
        day.cupCode = comp.shortCode;
      }
    }
  });
}

// ==========================================
// 5. カップ戦のラウンド進行 & 自クラブ試合判定
// ==========================================
const ROUND_NEXT_KEYS = {
  R32: 'R16',
  R16: 'QF',
  QF: 'SF',
  SF: 'FINAL'
};

/**
 * あるカップ戦の特定ラウンドの全対戦を消化
 * 自クラブの試合が含まれる場合はその試合情報を返し、他は高速シミュレート
 */
function processCupMatchDay(compType, roundKey) {
  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp || !comp.rounds || !comp.rounds[roundKey]) return null;

  const matches = comp.rounds[roundKey];
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : gameState.clubs.find(c => c.isPlayer);
  const pId = playerClub ? playerClub.id : null;

  let playerMatch = null;
  const winners = [];

  matches.forEach(m => {
    if (m.played) {
      if (m.winnerClub) winners.push(m.winnerClub);
      return;
    }

    const isHomePlayer = (m.homeId === pId);
    const isAwayPlayer = (m.awayId === pId);

    if (isHomePlayer || isAwayPlayer) {
      playerMatch = m;
      // ユーザーの試合は後ほど通常シミュレーションまたは即時ダイジェスト
    } else {
      // 他クラブ同士は高速シミュレーション
      const res = simKnockoutMatch(m.homeClub, m.awayClub);
      m.homeScore = res.homeScore;
      m.awayScore = res.awayScore;
      m.pkHome = res.pkHome;
      m.pkAway = res.pkAway;
      m.winnerId = res.winnerId;
      m.winnerClub = res.winnerClub;
      m.played = true;
      winners.push(res.winnerClub);
    }
  });

  return { comp, matches, playerMatch, winners };
}

/**
 * 自クラブのカップ戦を完了させ、次ラウンドを自動生成
 */
function finalizeCupMatch(compType, roundKey, match, userWon, homeScore, awayScore, pkHome = null, pkAway = null) {
  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp) return;

  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.pkHome = pkHome;
  match.pkAway = pkAway;
  match.played = true;
  match.winnerId = userWon ? match.homeId : match.awayId;
  match.winnerClub = userWon ? match.homeClub : match.awayClub;

  // 全試合の勝者を収集
  const matches = comp.rounds[roundKey];
  const winners = matches.map(m => m.winnerClub).filter(Boolean);

  const nextKey = ROUND_NEXT_KEYS[roundKey];
  if (nextKey) {
    if (!comp.rounds[nextKey] || comp.rounds[nextKey].length === 0) {
      comp.rounds[nextKey] = generateKnockoutRound(winners);
    }
  } else if (roundKey === 'FINAL') {
    // 優勝決定！
    comp.winner = match.winnerClub;
    if (userWon) {
      // 自クラブ優勝ボーナス
      gameState.budget = (gameState.budget || 0) + comp.prizeMoney;
      if (typeof addDailyLog === 'function') {
        addDailyLog(`🏆【祝！${comp.name} 優勝】賞金 £${(comp.prizeMoney / 1000).toFixed(1)}M を獲得しました！`);
      }
    }
  }
}

// ==========================================
// 6. 過密日程（週2試合）のスタミナ消費・怪我リスク補正
// ==========================================
function checkScheduleCongestion() {
  if (!gameState.calendar || gameState.currentDayIndex == null) {
    return { isCongested: false, staminaMultiplier: 1.0, injuryChanceMultiplier: 1.0 };
  }

  const curIdx = gameState.currentDayIndex;
  // 過去4日以内に試合があったか、または今後3日以内に試合があるか
  let matchCountNear = 0;
  for (let i = Math.max(0, curIdx - 4); i <= Math.min(gameState.calendar.length - 1, curIdx + 3); i++) {
    const d = gameState.calendar[i];
    if (d && (d.isMatchDay || d.isCupMatchDay)) {
      matchCountNear++;
    }
  }

  const isCongested = (matchCountNear >= 2);
  return {
    isCongested,
    staminaMultiplier: isCongested ? 1.25 : 1.0,
    injuryChanceMultiplier: isCongested ? 1.20 : 1.0
  };
}

// ==========================================
// 7. 昇降格処理
// ==========================================
function processPromotionAndRelegation() {
  const p1Sorted = typeof getSortedStandings === 'function' ? getSortedStandings() : [...gameState.clubs].sort((a,b) => (b.pts||0) - (a.pts||0));
  const p2Sorted = [...((gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS)]
    .sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  // 1部降格（18, 19, 20位）
  const relegatedClubs = p1Sorted.slice(Math.max(0, p1Sorted.length - 3));
  // 2部昇格（1, 2, 3位）
  const promotedClubs = p2Sorted.slice(0, 3);

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : gameState.clubs.find(c => c.isPlayer);
  const isPlayerRelegated = relegatedClubs.some(c => c.id === playerClub.id);

  // 1部クラブ更新
  const relegatedIds = new Set(relegatedClubs.map(c => c.id));
  const newP1Clubs = p1Sorted.filter(c => !relegatedIds.has(c.id));

  promotedClubs.forEach(pc => {
    if (!pc.players || pc.players.length === 0) {
      if (typeof ALL_POSITIONS !== 'undefined' && typeof createPlayer === 'function') {
        const usedNames = new Set();
        pc.players = ALL_POSITIONS.map(pos => createPlayer(pos, pc.id, usedNames));
        if (typeof ensureValidSquadAndStarters === 'function') {
          ensureValidSquadAndStarters(pc);
        }
      }
    }
    pc.tier = 'PROMOTED';
    pc.targetRank = 17;
    pc.targetLabel = '17位以内（残留）';
    newP1Clubs.push(pc);
  });

  // 2部クラブ更新
  const promotedIds = new Set(promotedClubs.map(c => c.id));
  const newP2Clubs = p2Sorted.filter(c => !promotedIds.has(c.id));
  relegatedClubs.forEach(rc => {
    rc.tier = 'RELEGATED';
    rc.targetRank = 1;
    rc.targetLabel = '1年での1部復帰';
    newP2Clubs.push(rc);
  });

  gameState.clubs = newP1Clubs;
  if (!gameState.competitions) gameState.competitions = {};
  if (!gameState.competitions.championship) gameState.competitions.championship = {};
  gameState.competitions.championship.clubs = newP2Clubs;

  const result = {
    relegated: relegatedClubs.map(c => c.name),
    promoted: promotedClubs.map(c => c.name),
    isPlayerRelegated
  };

  gameState.lastPromotionRelegation = result;
  return result;
}

// ==========================================
// 8. 順位表・トーナメントUI描画ヘルパー
// ==========================================
function renderChampionshipStandingsHtml() {
  const comp = gameState.competitions && gameState.competitions.championship;
  if (!comp || !comp.clubs) return '<p class="empty-state">2部リーグデータがありません</p>';

  const sorted = [...comp.clubs].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  let html = `
    <table class="data-table standings-table championship-table">
      <thead>
        <tr>
          <th class="col-rank">順位</th>
          <th class="col-team">クラブ名</th>
          <th class="col-num">試合</th>
          <th class="col-num">勝</th>
          <th class="col-num">分</th>
          <th class="col-num">敗</th>
          <th class="col-num">得点</th>
          <th class="col-num">失点</th>
          <th class="col-num">得失点</th>
          <th class="col-pts">勝点</th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach((c, idx) => {
    const rank = idx + 1;
    let zoneClass = '';
    let zoneTag = '';
    if (rank <= 3) {
      zoneClass = 'zone-promotion';
      zoneTag = '<span class="zone-badge badge-promo">昇格圏</span>';
    } else if (rank >= 22) {
      zoneClass = 'zone-relegation-p2';
      zoneTag = '<span class="zone-badge badge-releg">降格圏</span>';
    }

    const emblemSvg = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(c, 20) : '';

    html += `
      <tr class="${zoneClass}">
        <td class="col-rank mono">${rank} ${zoneTag}</td>
        <td class="col-team">
          <div class="team-cell-content">
            ${emblemSvg}
            <span class="team-name">${c.name}</span>
          </div>
        </td>
        <td class="col-num mono">${c.played || 0}</td>
        <td class="col-num mono">${c.won || 0}</td>
        <td class="col-num mono">${c.drawn || 0}</td>
        <td class="col-num mono">${c.lost || 0}</td>
        <td class="col-num mono">${c.gf || 0}</td>
        <td class="col-num mono">${c.ga || 0}</td>
        <td class="col-num mono ${c.gd > 0 ? 'text-pos' : c.gd < 0 ? 'text-neg' : ''}">${c.gd > 0 ? '+' : ''}${c.gd || 0}</td>
        <td class="col-pts mono font-bold">${c.pts || 0}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

function renderCupBracketHtml(compKey) {
  const comp = gameState.competitions && gameState.competitions[compKey];
  if (!comp || !comp.rounds) return '<p class="empty-state">大会データがありません</p>';

  const roundNames = {
    R32: '1回戦 / ベスト32',
    R16: '2回戦 / ベスト16',
    QF: '準々決勝',
    SF: '準決勝',
    FINAL: '決勝'
  };

  let html = `<div class="cup-bracket-container">
    <div class="cup-header-banner">
      <h3 class="cup-title">${comp.name} (${comp.enName})</h3>
      <span class="cup-prize mono">優勝賞金: £${(comp.prizeMoney / 1000).toFixed(1)}M</span>
      ${comp.winner ? `<span class="cup-winner-badge">🏆 覇者: ${comp.winner.name}</span>` : ''}
    </div>
    <div class="bracket-rounds-wrapper">
  `;

  const keys = ['R32', 'R16', 'QF', 'SF', 'FINAL'];
  keys.forEach(rk => {
    const matches = comp.rounds[rk] || [];
    if (matches.length === 0 && rk !== 'R32' && (!comp.rounds[keys[keys.indexOf(rk) - 1]] || comp.rounds[keys[keys.indexOf(rk) - 1]].length === 0)) {
      return;
    }

    html += `
      <div class="bracket-round-column">
        <h4 class="bracket-round-title mono">${roundNames[rk] || rk}</h4>
        <div class="bracket-matches-list">
    `;

    if (matches.length === 0) {
      html += `<div class="bracket-match-placeholder mono">対戦決定前</div>`;
    } else {
      matches.forEach(m => {
        const homeEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(m.homeClub, 18) : '';
        const awayEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(m.awayClub, 18) : '';
        const homeScoreText = m.played ? `${m.homeScore}${m.pkHome != null ? `(${m.pkHome})` : ''}` : '-';
        const awayScoreText = m.played ? `${m.awayScore}${m.pkAway != null ? `(${m.pkAway})` : ''}` : '-';
        const homeWinner = m.played && m.winnerId === m.homeId ? 'match-winner' : '';
        const awayWinner = m.played && m.winnerId === m.awayId ? 'match-winner' : '';

        html += `
          <div class="bracket-match-card ${m.played ? 'played' : 'upcoming'}">
            <div class="bracket-team-row ${homeWinner}">
              <div class="bracket-team-info">
                ${homeEmblem}
                <span class="bracket-team-name">${m.homeClub ? m.homeClub.name : 'TBD'}</span>
              </div>
              <span class="bracket-team-score mono">${homeScoreText}</span>
            </div>
            <div class="bracket-team-row ${awayWinner}">
              <div class="bracket-team-info">
                ${awayEmblem}
                <span class="bracket-team-name">${m.awayClub ? m.awayClub.name : 'TBD'}</span>
              </div>
              <span class="bracket-team-score mono">${awayScoreText}</span>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}

// グローバル公開
window.CHAMPIONSHIP_CLUBS_DEFINITIONS = CHAMPIONSHIP_CLUBS_DEFINITIONS;
window.EUROPEAN_CLUBS_DATABASE = EUROPEAN_CLUBS_DATABASE;
window.simQuickMatch = simQuickMatch;
window.simKnockoutMatch = simKnockoutMatch;
window.initSeasonCompetitions = initSeasonCompetitions;
window.advanceChampionshipWeek = advanceChampionshipWeek;
window.processPromotionAndRelegation = processPromotionAndRelegation;
window.injectCupMatchesIntoCalendar = injectCupMatchesIntoCalendar;
window.processCupMatchDay = processCupMatchDay;
window.finalizeCupMatch = finalizeCupMatch;
window.checkScheduleCongestion = checkScheduleCongestion;
window.renderChampionshipStandingsHtml = renderChampionshipStandingsHtml;
window.renderCupBracketHtml = renderCupBracketHtml;
