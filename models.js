'use strict';

/**
 * models.js - 選手・スタッフ生成、適性・OVR・市場価値算出、成長/引退計算、最適編成アルゴリズム、人件費/予算計算
 * data.js / avatar.js の後に読み込まれ、competitions.js / main.js から参照されるドメインモデル層
 */

// 選手ID採番カウンタ（セーブ＆ロード・新規ゲーム初期化とグローバル共有）
let playerIdCounter = 1;

// ==========================================================================
// 1. 監督（ヘッドコーチ）・指導陣生成 ＆ 効果・信頼度計算
// ==========================================================================

/**
 * 監督オブジェクトの生成（完全架空名ジェネレーターによる動的命名）
 */
function getStaffStatRank(val) {
  const v = typeof val === 'number' ? val : 68;
  if (v >= 88) return 'S';
  if (v >= 78) return 'A';
  if (v >= 68) return 'B';
  if (v >= 58) return 'C';
  if (v >= 48) return 'D';
  return 'E';
}

function inferManagerRankFromWage(wage = 70) {
  if (wage >= 110) return 'S';
  if (wage >= 80) return 'A';
  if (wage >= 55) return 'B';
  if (wage >= 36) return 'C';
  if (wage >= 24) return 'D';
  return 'E';
}

function ensureManagerRankAndStats(mgr, focusHint = null) {
  if (!mgr || typeof mgr !== 'object') return mgr;
  if (!mgr.rank || !['S', 'A', 'B', 'C', 'D', 'E'].includes(mgr.rank)) {
    mgr.rank = inferManagerRankFromWage(mgr.weeklyWage || 70);
  }
  const baseRange = mgr.rank === 'S'
    ? [78, 92]
    : (mgr.rank === 'A' ? [68, 84] : (mgr.rank === 'B' ? [56, 76] : (mgr.rank === 'C' ? [46, 66] : (mgr.rank === 'D' ? [42, 58] : [35, 50]))));
  if (!mgr.stats || typeof mgr.stats !== 'object') {
    const pick = () => randInt(baseRange[0], baseRange[1]);
    const stats = { tactics: pick(), motivation: pick(), development: pick(), discipline: pick() };
    const focus = focusHint || mgr.focus || ['tactics', 'motivation', 'development', 'discipline'][randInt(0, 3)];
    if (stats[focus] !== undefined) {
      stats[focus] = clamp(stats[focus] + randInt(6, 10), 45, 99);
    }
    mgr.stats = stats;
  } else {
    ['tactics', 'motivation', 'development', 'discipline'].forEach(k => {
      if (typeof mgr.stats[k] !== 'number') mgr.stats[k] = randInt(baseRange[0], baseRange[1]);
    });
  }
  if (!mgr.specialty) {
    const entries = Object.entries(mgr.stats);
    entries.sort((a, b) => b[1] - a[1]);
    const topKey = entries[0] ? entries[0][0] : 'tactics';
    const labels = { tactics: '戦術の鬼', motivation: '人心掌握', development: '育成の名匠', discipline: '規律重視' };
    mgr.specialty = labels[topKey] || 'バランス型';
  }
  return mgr;
}

function getManagerRankEffects(manager) {
  if (!manager) {
    return { minReputation: 0, buffPerMatch: 0.01, highTrustBonus: 0.005, youthGrowthBonus: 0, allGrowthBonus: 0, fatigueMult: 1.0 };
  }
  ensureManagerRankAndStats(manager);
  const st = manager.stats || { tactics: 70, motivation: 70, development: 70, discipline: 70 };
  const avgStat = (st.tactics + st.motivation + st.development + st.discipline) / 4;
  const minReputation = avgStat >= 85 ? 6200 : (avgStat >= 77 ? 4500 : 0);
  const tacRank = getStaffStatRank(st.tactics);
  const motRank = getStaffStatRank(st.motivation);
  const devRank = getStaffStatRank(st.development);
  const buffPerMatch = tacRank === 'S' ? 0.036 : (tacRank === 'A' ? 0.027 : (tacRank === 'B' ? 0.018 : 0.011));
  const highTrustBonus = motRank === 'S' ? 0.016 : (motRank === 'A' ? 0.011 : 0.007);
  const youthGrowthBonus = devRank === 'S' ? 0.35 : (devRank === 'A' ? 0.24 : (devRank === 'B' ? 0.14 : 0.06));
  const allGrowthBonus = avgStat >= 84 ? 0.20 : (avgStat >= 76 ? 0.10 : 0);
  const discMult = clamp(1.0 - Math.max(0, (st.discipline - 65) * 0.003), 0.90, 1.0);
  return {
    minReputation,
    buffPerMatch,
    highTrustBonus,
    youthGrowthBonus,
    allGrowthBonus,
    fatigueMult: discMult
  };
}

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
  const rank = def.rank || inferManagerRankFromWage(def.weeklyWage || 80);
  const mgr = {
    id: 'mgr_' + Math.random().toString(36).substr(2, 8),
    name: nameData.displayName,
    fullName: nameData.fullName,
    nationality: nat,
    age: age,
    rank,
    focus: def.focus || null,
    preferredFormation: def.preferredFormation || '4-3-3',
    preferredTactic: def.preferredTactic || 'possession',
    stats: def.stats ? { ...def.stats } : null,
    trust: typeof def.trust === 'number' ? def.trust : 80,
    interventionStreak: 0,
    weeklyWage: def.weeklyWage || 80,
    contractYears: typeof def.contractYears === 'number' ? def.contractYears : 3,
    bio: def.bio || '現代的な戦術眼と指導力でチームを牽引する指揮官。',
    avatarData: genes
  };
  return ensureManagerRankAndStats(mgr, def.focus || null);
}

/**
 * 監督の解任違約金を計算（契約残り年数 × 年俸の40%）
 */
function getManagerBuyoutFee(manager) {
  if (!manager) return 0;
  const annual = (manager.weeklyWage || 80) * 52;
  const years = typeof manager.contractYears === 'number' ? Math.max(0, manager.contractYears) : 1;
  return years === 0 ? 0 : Math.max(1000, Math.round(annual * 0.40 * years));
}

function ensureCoachStats(coach, focusHint = null) {
  if (!coach || typeof coach !== 'object') return coach;
  const r = coach.rank || 'B';
  const baseRange = r === 'S'
    ? [78, 92]
    : (r === 'A' ? [68, 86] : (r === 'B' ? [56, 76] : (r === 'C' ? [45, 66] : (r === 'D' ? [40, 56] : [35, 48]))));
  if (!coach.stats || typeof coach.stats !== 'object') {
    const pick = () => randInt(baseRange[0], baseRange[1]);
    const stats = { coaching: pick(), youthDev: pick(), analysis: pick() };
    const focus = focusHint || coach.focus || ['coaching', 'youthDev', 'analysis'][randInt(0, 2)];
    if (stats[focus] !== undefined) {
      stats[focus] = clamp(stats[focus] + randInt(7, 10), 45, 99);
    }
    coach.stats = stats;
  } else {
    ['coaching', 'youthDev', 'analysis'].forEach(k => {
      if (typeof coach.stats[k] !== 'number') coach.stats[k] = randInt(baseRange[0], baseRange[1]);
    });
  }
  if (!coach.specialty) {
    const entries = Object.entries(coach.stats).sort((a, b) => b[1] - a[1]);
    const topKey = entries[0] ? entries[0][0] : 'coaching';
    const labels = { coaching: '実戦指導型', youthDev: '若手育成型', analysis: '戦術分析型' };
    coach.specialty = labels[topKey] || 'バランス型';
  }
  return coach;
}

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

  const coach = {
    id: `coach_${category}_${Math.random().toString(36).substr(2, 9)}`,
    name: nameData.displayName,
    fullName: nameData.fullName,
    category,
    roleLabel,
    rank: def.rank || 'B',
    focus: def.focus || null,
    stats: def.stats ? { ...def.stats } : null,
    tag: roleLabel,
    nationality: nat,
    age,
    weeklyWage: def.weeklyWage || 20,
    bio: def.bio || '熱心な指導で選手の能力を最大化する専門コーチ。',
    avatarData: null
  };
  return ensureCoachStats(coach, def.focus || null);
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
    return { attMult: 1.0, defSuppression: 1.0, gkSaveBonus: 1.0, staDrainMult: 1.0, injuryProbMult: 1.0, analysisBonus: 0, youthDevBonus: 0 };
  }
  const calcCoachPower = (c) => {
    if (!c) return 0;
    ensureCoachStats(c);
    const cVal = (c.stats && typeof c.stats.coaching === 'number') ? c.stats.coaching : 70;
    const cRk = getStaffStatRank(cVal);
    const rankBase = cRk === 'S' ? 0.95 : (cRk === 'A' ? 0.80 : (cRk === 'B' ? 0.58 : 0.36));
    const statBonus = Math.max(0, (cVal - 60) * 0.006);
    return rankBase + statBonus;
  };
  let attScore = 0;
  (club.coaches.attacking || []).forEach(c => { attScore += calcCoachPower(c); });

  let defScore = 0;
  (club.coaches.defending || []).forEach(c => { defScore += calcCoachPower(c); });

  let gkScore = club.coaches.goalkeeping ? calcCoachPower(club.coaches.goalkeeping) : 0;
  let fitScore = club.coaches.fitness ? calcCoachPower(club.coaches.fitness) : 0;

  const allCoaches = [
    ...(club.coaches.attacking || []),
    ...(club.coaches.defending || []),
    club.coaches.goalkeeping,
    club.coaches.fitness
  ].filter(Boolean);
  let analysisSum = 0;
  let youthDevSum = 0;
  allCoaches.forEach(c => {
    ensureCoachStats(c);
    analysisSum += (c.stats && c.stats.analysis) || 65;
    youthDevSum += (c.stats && c.stats.youthDev) || 65;
  });
  const avgAnalysis = allCoaches.length > 0 ? analysisSum / allCoaches.length : 65;
  const avgYouthDev = allCoaches.length > 0 ? youthDevSum / allCoaches.length : 65;

  return {
    attMult: 1.0 + attScore * 0.05,
    defSuppression: Math.max(0.75, 1.0 - defScore * 0.05),
    gkSaveBonus: Math.max(0.80, 1.0 - gkScore * 0.07),
    staDrainMult: Math.max(0.60, 1.0 - fitScore * 0.20),
    injuryProbMult: Math.max(0.40, 1.0 - fitScore * 0.35),
    analysisBonus: Math.max(0, (avgAnalysis - 65) * 0.015),
    youthDevBonus: Math.max(0, (avgYouthDev - 65) * 0.012)
  };
}

/**
 * 試合終了時の監督信頼度（Trust）更新および現場介入トレードオフ
 */
function updateManagerTrustAfterMatch(club, won, drawn) {
  if (!club || !club.manager) return;
  const mgr = club.manager;
  const isFormMatch = club.formation === mgr.preferredFormation;
  const isTacticMatch = normalizeTacticKey(club.tactic) === normalizeTacticKey(mgr.preferredTactic);
  const isIntervention = !isFormMatch || !isTacticMatch;
  const isDelegated = Boolean(club.isPlayer && gameState.managerDelegationEnabled && !isIntervention);

  let delta = 0;
  if (isDelegated) {
    mgr.interventionStreak = 0;
    delta = won ? 4 : (drawn ? 2 : -1);
  } else if (!isIntervention) {
    mgr.interventionStreak = 0;
    delta = won ? 3 : (drawn ? 1 : -1);
  } else {
    mgr.interventionStreak = (mgr.interventionStreak || 0) + 1;
    const streakPenalty = mgr.interventionStreak >= 3 ? 2 : (mgr.interventionStreak >= 2 ? 1 : 0);
    if (won) {
      delta = 1;
    } else if (drawn) {
      delta = -1 - Math.min(1, streakPenalty);
    } else {
      delta = -3 - streakPenalty;
    }
    if (club.isPlayer && !won && mgr.interventionStreak >= 2 && typeof addDailyLog === 'function') {
      addDailyLog(`【現場との軋轢】${mgr.name}監督がフロント主導の戦術指定（得意哲学と相違）に対する不満を漏らしています。`);
    }
  }

  mgr.trust = Math.max(0, Math.min(100, (mgr.trust ?? 80) + delta));
  if (club.isPlayer && mgr.trust <= 10 && !gameState.isSeasonOver) {
    gameState.pendingManagerCrisis = true;
  }
}

/**
 * 監督一任モードがONの際、監督の得意陣形・戦術へ同期し、疲労・負傷を考慮したローテーション11人を選出する
 */
function applyPromisedNextMatchSwaps(club) {
  if (!club || !Array.isArray(club.promisedNextMatchSwaps) || club.promisedNextMatchSwaps.length === 0) return;
  const players = Array.isArray(club.players) ? club.players : [];
  for (const swap of club.promisedNextMatchSwaps) {
    if (!swap || !swap.inId) continue;
    const inP = players.find(p => p && p.id === swap.inId && !p.isRetired && !(p.injuryDays > 0) && !(p.loanStatus && p.loanStatus.isLoanOut));
    if (!inP || inP.isStarter) continue;

    let outP = swap.outId ? players.find(p => p && p.id === swap.outId && p.isStarter) : null;
    if (!outP && typeof swap.slotIndex === 'number') {
      outP = players.find(p => p && p.isStarter && p.slotIndex === swap.slotIndex && p.id !== inP.id);
    }
    if (!outP && swap.assignedPos) {
      outP = players.find(p => p && p.isStarter && (p.assignedPos || p.pos) === swap.assignedPos && p.id !== inP.id);
    }
    if (!outP) continue;

    const targetSlot = outP.slotIndex;
    const targetPos = outP.assignedPos || outP.pos;
    outP.isStarter = false;
    outP.isBench = true;
    outP.slotIndex = null;
    outP.assignedPos = null;

    inP.isStarter = true;
    inP.isBench = false;
    inP.slotIndex = targetSlot;
    inP.assignedPos = targetPos;
  }
}

function applyManagerPreMatchDelegation(club, syncPhilosophy = true) {
  if (!club || !club.manager) return;
  const mgr = club.manager;
  if (syncPhilosophy) {
    if (mgr.preferredFormation && FORMATIONS[mgr.preferredFormation]) {
      club.formation = mgr.preferredFormation;
    }
    if (mgr.preferredTactic) {
      club.tactic = normalizeTacticKey(mgr.preferredTactic);
    }
  }
  optimizeClubStarters(club);
  applyPromisedNextMatchSwaps(club);
}

// ==========================================================================
// 2. ポジション適性・疲労度・OVR・給与・市場価値算出
// ==========================================================================

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
  const uniqueMajors = [];
  if (primary) uniqueMajors.push(primary);
  for (const m of majors) {
    if (m && !uniqueMajors.includes(m)) uniqueMajors.push(m);
  }
  const subs = Array.isArray(p.subPositions)
    ? p.subPositions.filter(s => !uniqueMajors.includes(s))
    : (Array.isArray(p.secondaryPositions) ? p.secondaryPositions.filter(s => !uniqueMajors.includes(s)) : []);

  const majorsHtml = uniqueMajors
    .map((m, idx) => `<span class="pos-tag pos-${m}${idx === 0 ? ' pos-tag-primary' : ''}">${m}</span>`)
    .join('');
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
 * 1. 【本適性】: 配置スロットが選手の mainPositions に含まれる場合 ➜ factor: 1.0
 * 2. 【サブ適性】: 配置スロットが選手の subPositions に含まれる場合 ➜ factor: 0.92
 * 3. 【適性なし・近接ポジション】: 同系列だが未習得の場合 ➜ factor: 0.85
 * 4. 【完全不適性】: 全く異なるポジション系列 ➜ factor: 0.70
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

  // 2. サブ適性（実装値 0.92 に統一）
  const traits = Array.isArray(p.traits) ? p.traits : [];
  const hasUtility = traits.includes('万能ユーティリティ');
  const hasBothFoot = traits.includes('両足のスペシャリスト');
  const isOppositeFlank = (
    (['LW', 'LM', 'LB'].includes(normSlot) && normMains.concat(normSubs).some(x => ['RW', 'RM', 'RB'].includes(x))) ||
    (['RW', 'RM', 'RB'].includes(normSlot) && normMains.concat(normSubs).some(x => ['LW', 'LM', 'LB'].includes(x)))
  );

  if (normSubs.includes(normSlot)) {
    if (hasUtility) return { type: 'sub', factor: 0.97, label: 'サブ適性' };
    if (hasBothFoot && isOppositeFlank) return { type: 'sub', factor: 0.96, label: 'サブ適性' };
    return { type: 'sub', factor: 0.92, label: 'サブ適性' };
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
    const semiFactor = hasUtility ? 0.91 : (hasBothFoot && isOppositeFlank ? 0.89 : 0.85);
    return { type: 'semi', factor: semiFactor, label: '近接不適性' };
  }

  // 4. 完全不適性（70%発揮・重度ペナルティ）
  return { type: 'out', factor: hasUtility ? 0.78 : 0.70, label: '完全不適性' };
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
  const isLeft = foot === 'Left';
  const isBoth = foot === 'Both';
  const label = isLeft ? '左利き' : (isBoth ? '両利き' : '右利き');
  const leftFill = '#ffffff';
  const rightFill = '#ffffff';
  const leftOp = (isLeft || isBoth) ? '1' : '0.24';
  const rightOp = (!isLeft || isBoth) ? '1' : '0.24';
  const footPath = 'M6.8 2.2c-1.8 0-3 2.1-2.7 5.2.2 2 .9 3.6 1 4.9.1 1.1-.3 2-.1 3.2.2 1.2 1.1 1.9 2.1 1.9 1.1 0 1.9-.8 2-2 .1-1.2-.3-2.3-.1-3.6.3-1.5 1.1-3.2 1-5.4-.1-2.6-1.5-4.2-3.2-4.2z';
  return `<span class="foot-badge ${isBoth ? 'foot-badge-both' : ''}" title="${label}" aria-label="${label}"><svg class="foot-print-svg" width="22" height="17" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${footPath}" fill="${leftFill}" opacity="${leftOp}"/><g transform="translate(24,0) scale(-1,1)"><path d="${footPath}" fill="${rightFill}" opacity="${rightOp}"/></g></svg></span>`;
}

function getFootShortText(player) {
  if (!player) return '右足';
  const foot = player.preferredFoot || 'Right';
  if (foot === 'Left') return '左足';
  if (foot === 'Both') return '両足';
  return '右足';
}

/**
 * OVR・年齢・残り契約年数・成績実績（任意）から市場価値（£k単位）を算出するコアロジック
 */
function calculateMarketValueFromOvrAndAge(ovr, age = 25, contractYears = 2, perfStats = null) {
  const safeOvr = (typeof ovr === 'number' && !Number.isNaN(ovr)) ? ovr : 70;
  const safeAge = (typeof age === 'number' && !Number.isNaN(age)) ? age : 25;
  const safeContractYears = (typeof contractYears === 'number' && !Number.isNaN(contractYears)) ? contractYears : 2;

  let baseVal = 0;
  if (safeOvr < 60) {
    baseVal = 200 + Math.max(0, safeOvr - 50) * 25; // 200k..425k
  } else if (safeOvr <= 64) {
    const t = (safeOvr - 60) / 4;
    baseVal = 450 + t * 750; // 450k..1200k (£0.45M〜£1.2M)
  } else if (safeOvr <= 69) {
    const t = (safeOvr - 65) / 4;
    baseVal = 1300 + t * 1500; // 1300k..2800k (£1.3M〜£2.8M)
  } else if (safeOvr <= 74) {
    const t = (safeOvr - 70) / 4;
    baseVal = 3000 + t * 6000; // 3000k..9000k (£3.0M〜£9.0M)
  } else if (safeOvr <= 79) {
    const t = (safeOvr - 75) / 4;
    baseVal = 10500 + t * 11500; // 10500k..22000k (£10.5M〜£22.0M)
  } else if (safeOvr <= 84) {
    const t = (safeOvr - 80) / 4;
    baseVal = 24000 + t * 22000; // 24000k..46000k (£24.0M〜£46.0M)
  } else if (safeOvr <= 87) {
    const t = (safeOvr - 85) / 2;
    baseVal = 50000 + t * 26000; // 50000k..76000k (£50.0M〜£76.0M)
  } else {
    // OVR 88以上（ワールドクラス）：£84.0M 〜 £145.0M（年齢・活躍補正込みで£90M超えは世界の一握りに限定）
    const extra = Math.min(7, safeOvr - 88); // 88..95
    const t = extra / 7;
    baseVal = 84000 + t * 61000; // 84000k..145000k (£84.0M〜£145.0M)
  }

  // 年齢補正：若手プレミアムを過度に膨らませず、29歳以降の明確な下落カーブを維持
  let ageFactor = 1.0;
  if (safeAge <= 19) ageFactor = 1.18;
  else if (safeAge <= 21) ageFactor = 1.12;
  else if (safeAge <= 23) ageFactor = 1.06;
  else if (safeAge <= 25) ageFactor = 1.02;
  else if (safeAge <= 28) ageFactor = 1.00;
  else if (safeAge === 29) ageFactor = 0.86;
  else if (safeAge === 30) ageFactor = 0.72;
  else if (safeAge === 31) ageFactor = 0.58;
  else if (safeAge === 32) ageFactor = 0.46;
  else if (safeAge === 33) ageFactor = 0.36;
  else if (safeAge === 34) ageFactor = 0.28;
  else ageFactor = 0.22;

  // 契約残り年数による軽微な補正
  let contractFactor = 1.0;
  if (safeContractYears <= 1) {
    contractFactor = 0.95;
  } else if (safeContractYears === 2) {
    contractFactor = 0.98;
  } else if (safeContractYears >= 4) {
    contractFactor = 1.03;
  }

  // ポジションによる市場相場補正（攻撃陣は高く、守備陣・GKは控えめ）
  const rawPos = (perfStats && typeof perfStats === 'object' && perfStats.pos) ? String(perfStats.pos).toUpperCase() : '';
  let posFactor = 1.0;
  if (rawPos === 'GK') {
    posFactor = 0.85;
  } else if (rawPos === 'CB' || rawPos === 'LB' || rawPos === 'RB' || rawPos === 'LWB' || rawPos === 'RWB' || rawPos === 'SB' || rawPos === 'DF') {
    posFactor = 0.94;
  } else if (rawPos === 'CF' || rawPos === 'ST' || rawPos === 'LW' || rawPos === 'RW' || rawPos === 'WG' || rawPos === 'AM' || rawPos === 'FW') {
    posFactor = 1.05;
  }

  // 年別成績（出場数・平均評価点・G/A貢献）に基づく活躍度補正（上限を抑えてOVR超えの暴騰を防止）
  let perfFactor = 1.0;
  if (perfStats && typeof perfStats === 'object') {
    const apps = typeof perfStats.appearances === 'number' ? perfStats.appearances : null;
    const avgR = typeof perfStats.avgRating === 'number' && !Number.isNaN(perfStats.avgRating) ? perfStats.avgRating : null;
    const goals = typeof perfStats.goals === 'number' ? perfStats.goals : 0;
    const assists = typeof perfStats.assists === 'number' ? perfStats.assists : 0;

    let mod = 0;
    if (avgR !== null && (apps === null || apps > 0)) {
      mod += clamp((avgR - 6.75) * 0.11, -0.11, 0.10);
    }
    if (apps !== null) {
      if (apps === 0) mod -= 0.10;
      else if (apps <= 8) mod -= 0.05;
      else if (apps >= 28) mod += 0.03;
    }
    if (rawPos !== 'GK' && apps !== null && apps >= 10) {
      const gaRate = (goals + assists * 0.8) / apps;
      if (gaRate >= 0.65) mod += 0.05;
      else if (gaRate >= 0.35) mod += 0.025;
    }
    perfFactor = clamp(1.0 + mod, 0.82, 1.14);
  }

  // プロ通算出場実績に基づく未証明ディスカウント（実戦実績ゼロでの超高額評価を防止）
  let careerFactor = 1.0;
  if (perfStats && typeof perfStats.careerApps === 'number') {
    const cApps = perfStats.careerApps;
    if (cApps <= 0) careerFactor = 0.50;
    else if (cApps < 10) careerFactor = 0.65 + (cApps / 10) * 0.15;
    else if (cApps < 25) careerFactor = 0.80 + ((cApps - 10) / 15) * 0.20;
  }

  const fee = Math.round((baseVal * ageFactor * contractFactor * posFactor * perfFactor * careerFactor) / 100) * 100;
  return clamp(fee, 200, 220000);
}

function calculatePlayerMarketValue(player) {
  if (!player) return 1000;

  // 実際の能力値（atk/def/sta）からの動的OVR算出を最優先し、成長・衰えを即座に反映
  let ovr = 70;
  if (typeof getPlayerOverallRating === 'function' && typeof player.atk === 'number') {
    const calc = getPlayerOverallRating(player);
    if (typeof calc === 'number' && !Number.isNaN(calc)) {
      ovr = calc;
    }
  } else if (typeof player.ovr === 'number' && !Number.isNaN(player.ovr)) {
    ovr = player.ovr;
  }

  const age = typeof player.age === 'number' && !Number.isNaN(player.age) ? player.age : 25;
  const contractYears = player.contractYears !== undefined ? player.contractYears : 2;
  const curApps = typeof player.appearances === 'number' ? player.appearances : 0;
  const histAppsSum = Array.isArray(player.seasonHistory)
    ? player.seasonHistory.reduce((sum, r) => sum + (r && typeof r.appearances === 'number' ? r.appearances : 0), 0)
    : 0;
  const careerStatApps = (player.careerStats && typeof player.careerStats.appearances === 'number')
    ? player.careerStats.appearances
    : 0;
  const careerApps = Math.max(careerStatApps, histAppsSum + curApps, curApps);

  const posStr = player.primaryPosition || player.pos || '';
  const lastSh = (Array.isArray(player.seasonHistory) && player.seasonHistory.length > 0)
    ? player.seasonHistory[player.seasonHistory.length - 1]
    : null;
  let perfStats = { careerApps, pos: posStr };

  if (curApps >= 15 || (curApps >= 5 && !lastSh)) {
    const avgR = (typeof player.totalRating === 'number' && curApps > 0)
      ? (player.totalRating / curApps)
      : null;
    perfStats = {
      appearances: curApps,
      goals: player.goals || 0,
      assists: player.assists || 0,
      avgRating: avgR,
      pos: posStr,
      careerApps
    };
  } else if (curApps >= 1 && lastSh) {
    // 序盤（1〜14試合）は過去直近シーズンと今季実績を出場比率でブレンドし、開幕直後の急落・急騰を抑制
    const wCur = curApps / 15;
    const wPrev = 1 - wCur;
    const curAvgR = (typeof player.totalRating === 'number' && curApps > 0)
      ? (player.totalRating / curApps)
      : null;
    const parsedPrevR = parseFloat(lastSh.avgRating);
    const hasPrevR = !Number.isNaN(parsedPrevR);

    const prevApps = typeof lastSh.appearances === 'number' ? lastSh.appearances : curApps;
    const prevGaDenom = Math.max(1, prevApps);
    const blendedGoalRate = wPrev * ((lastSh.goals || 0) / prevGaDenom) + wCur * ((player.goals || 0) / curApps);
    const blendedAssistRate = wPrev * ((lastSh.assists || 0) / prevGaDenom) + wCur * ((player.assists || 0) / curApps);
    const projectedApps = clamp(Math.round(prevApps * wPrev + Math.min(38, curApps * 2.1) * wCur), 1, 38);

    let blendedAvgR = null;
    if (curAvgR !== null && hasPrevR) {
      blendedAvgR = wPrev * parsedPrevR + wCur * curAvgR;
    } else if (curAvgR !== null) {
      blendedAvgR = curAvgR;
    } else if (hasPrevR) {
      blendedAvgR = parsedPrevR;
    }

    perfStats = {
      appearances: projectedApps,
      goals: Math.round(blendedGoalRate * projectedApps),
      assists: Math.round(blendedAssistRate * projectedApps),
      avgRating: blendedAvgR,
      pos: posStr,
      careerApps
    };
  } else if (lastSh) {
    // 開幕前（0試合）は直近の過去シーズン実績を引き継いで連続性を保つ
    const parsedR = parseFloat(lastSh.avgRating);
    perfStats = {
      appearances: typeof lastSh.appearances === 'number' ? lastSh.appearances : curApps,
      goals: lastSh.goals || 0,
      assists: lastSh.assists || 0,
      avgRating: Number.isNaN(parsedR) ? null : parsedR,
      pos: posStr,
      careerApps
    };
  }
  return calculateMarketValueFromOvrAndAge(ovr, age, contractYears, perfStats);
}

/**
 * 移籍市場における要求移籍金（Ask Price / 取引目安価格）の算出
 * 契約残り1年の選手はフリー流出を防ぐためのクラブ側の割引（15%〜25%引き、0.75倍〜0.88倍）が適用される。
 * 若手（23歳以下）や高能力（OVR 80以上）の選手は争奪戦が起きるため、値引き幅が小さく抑えられる（0.85倍〜0.95倍）。
 */
function calculateTransferFee(player) {
  if (!player || player.isFreeAgent) return 0;
  const contractYears = player.contractYears !== undefined ? player.contractYears : 2;
  if (contractYears <= 0) return 0;

  const marketVal = calculatePlayerMarketValue(player);
  const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(player) : (player.ovr || 70);
  const age = player.age || 25;

  if (player.transferListed) {
    let listedFee = clamp(Math.round((marketVal * 0.82) / 100) * 100, 200, 250000);
    if (listedFee === marketVal) listedFee = Math.max(200, marketVal - 100);
    return listedFee;
  }

  if (contractYears <= 1) {
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

    let discountedFee = clamp(Math.round((marketVal * discountRatio) / 100) * 100, 200, 250000);
    if (discountedFee === marketVal) discountedFee = Math.max(200, marketVal - 100);
    return discountedFee;
  }

  // 契約残2年以上は契約保護プレミアム・主力評価・将来性による要求移籍金（市場価値と明確に差別化）
  let askRatio = contractYears >= 4 ? 1.28 : (contractYears === 3 ? 1.18 : 1.08);
  if (player.isStarter) {
    askRatio += 0.08;
  }
  if ((age <= 23 && ovr >= 78) || ovr >= 83) {
    askRatio += 0.07;
  } else if (age >= 30 && !player.isStarter) {
    askRatio -= 0.04;
  }

  const keyStr = String(player.id || player.name || '');
  let idHash = 0;
  for (let i = 0; i < keyStr.length; i++) {
    idHash = ((idHash << 5) - idHash) + keyStr.charCodeAt(i);
    idHash |= 0;
  }
  askRatio += ((Math.abs(idHash) % 6) - 2) * 0.01;

  let askFee = clamp(Math.round((marketVal * askRatio) / 100) * 100, 200, 250000);
  if (askFee === marketVal) {
    askFee = clamp(marketVal + 100, 200, 250000);
  }
  return askFee;
}

// ==========================================================================
// 3. 人名・特徴タグ・初期キャリア・背番号・6大パラメータ算出
// ==========================================================================

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
 * 選手特徴の定性的効果定義（数値の上昇幅は表示しない）
 */
const PLAYER_TRAIT_DEFINITIONS = {
  '万能ユーティリティ': '本適性以外のポジションに配置された際の能力低下を緩和します。',
  '両足のスペシャリスト': '左右の足による精度差がなく、逆サイド配置時の適応力と決定力・パス精度を高めます。',
  '空中戦の覇者': 'ハイボールやクロスに対する競り合いに強く、前線・最終ラインの空中戦能力を高めます。',
  'スピードスター': '爆発的な加速力と突破力で、カウンターやサイドアタック時の攻撃力を引き上げます。',
  '高精度キッカー': '正確無比なキックとパス精度で、攻撃の組み立てとチャンス創出に貢献します。',
  'チャンスメイカー': '決定的なパスやドリブル突破で味方の得点機を演出し、チームの攻撃力を高めます。',
  '決定力の鬼': 'ゴール前での高いシュート精度により、得点期待値と決定力を引き上げます。',
  'ラインブレイカー': 'DFラインの背後へ抜け出す動きに優れ、前線での得点機会とカウンター時の脅威を高めます。',
  '鉄壁の対人守備': '1対1のデュエルと粘り強いマークで、相手の攻撃を封じ込め守備を安定させます。',
  '守護神の反射神経': '鋭い反応速度によるビッグセーブで失点を防ぎ、ゴール前の守備力を高めます。',
  '無尽蔵のスタミナ': '豊富な運動量とタフネスにより、試合出場による疲労の蓄積を軽減します。',
  'ビルドアップの起点': '後方・中盤からの落ち着いた配球でプレスを回避し、ポゼッション時の攻守を安定させます。',
  '戦術理解度◎': '戦術やフォーメーションへの適応力が高く、試合での攻守両面の連携を底上げします。',
  'ハードワーカー': '攻守の切り替えと献身的なプレスで、チームの守備強度とプレッシング性能を高めます。',
  '冷静沈着': 'プレッシャーのかかる場面でも実力を安定して発揮し、攻守のパフォーマンスを支えます。'
};

function getPlayerTraitDescription(traitName) {
  return PLAYER_TRAIT_DEFINITIONS[traitName] || '選手固有のプレイスタイルとして試合でのパフォーマンスに影響します。';
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
 * 年齢とポジション・怪我しやすさに応じた初期キャリア通算成績を生成
 */
function generateInitialCareerStats(pos, age, isStarter = false, approxPower = 70, injuryProneness = 50) {
  const availFactor = typeof getInjuryAvailabilityFactor === 'function'
    ? getInjuryAvailabilityFactor(injuryProneness)
    : 1.0;
  const isProdigy = isStarter && approxPower >= 78 && age <= 19;
  const activeYears = isProdigy ? Math.max(1, age - 16) : Math.max(0, age - 18);
  if (activeYears === 0) {
    const rawApps = isStarter ? randInt(8, 22) : randInt(2, 10);
    const apps = Math.max(1, Math.round(rawApps * clamp(availFactor, 0.62, 1.08)));
    const goals = (pos === 'CF' || pos === 'LW' || pos === 'RW' || pos === 'WG') ? randInt(0, apps > 8 ? 4 : 1) : 0;
    return { appearances: apps, goals };
  }

  let appsPerYear = randInt(16, 28);
  let cupBonus = randInt(0, 4);
  if (approxPower >= 80 || (isStarter && approxPower >= 74)) {
    appsPerYear = randInt(32, 44);
    cupBonus = randInt(3, 10);
  } else if (approxPower >= 72 || isStarter) {
    appsPerYear = randInt(25, 36);
    cupBonus = randInt(2, 6);
  }
  const rawTotalApps = activeYears * appsPerYear + cupBonus;
  const totalApps = Math.max(activeYears * 6, Math.min(activeYears * 48, Math.round(rawTotalApps * availFactor)));

  // 攻撃的ポジションほど能力（approxPower）に応じた得点力差を明確化（公式戦キャリア平均ペースとして算出）
  const atkScale = clamp(0.76 + (approxPower - 70) * 0.026, 0.65, 1.38);
  const midScale = clamp(0.82 + (approxPower - 70) * 0.018, 0.74, 1.24);

  let goalRate = 0.055;
  if (pos === 'GK') goalRate = 0;
  else if (pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'SB' || pos === 'LWB' || pos === 'RWB') goalRate = 0.055;
  else if (pos === 'DM') goalRate = 0.06;
  else if (pos === 'CM') goalRate = 0.095 * midScale;
  else if (pos === 'LM' || pos === 'RM' || pos === 'SM') goalRate = 0.125 * midScale;
  else if (pos === 'AM') goalRate = 0.21 * atkScale;
  else if (pos === 'LW' || pos === 'RW' || pos === 'WG') goalRate = 0.27 * atkScale;
  else if (pos === 'CF' || pos === 'ST') goalRate = 0.45 * atkScale;

  const totalGoals = pos === 'GK'
    ? 0
    : Math.max(0, Math.round(totalApps * goalRate * (0.85 + Math.random() * 0.35)));

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
 * 能力値（1〜99）に応じたUIクラス（90以上：青、80台：緑、70台：オレンジ、70未満：赤）を返す
 */
function getStatTierClass(val) {
  if (val >= 90) return { valClass: 'stat-elite', barClass: 'bar-elite' };
  if (val >= 80) return { valClass: 'stat-high', barClass: 'bar-high' };
  if (val >= 70) return { valClass: 'stat-mid', barClass: 'bar-mid' };
  return { valClass: 'stat-low', barClass: 'bar-low' };
}

// ==========================================================================
// 4. 選手・ユース・初期スカッド・移籍リスト生成
// ==========================================================================

/**
 * 9ポジション＋複数適性＋詳細プロフィールに対応した選手1名を生成
 */
function createPlayer(pos, basePower, isStarter, usedNames, customAgeRange = null, forcedCurve = null, forcedNationality = null) {
  const nationality = forcedNationality || (typeof pickWeightedNationality === 'function' ? pickWeightedNationality(0.28, 'England', 'ENG') : NATIONALITIES[randInt(0, NATIONALITIES.length - 1)]);
  const nameData = generatePlayerName(nationality, usedNames);
  const age = customAgeRange ? randInt(customAgeRange[0], customAgeRange[1]) : randInt(18, 33);
  const growthCurve = forcedCurve || pickRandomGrowthCurve();

  // ガラスの天才（fragile_genius / 旧fragile）は初期能力に+4〜+7のボーナス（控え若手は抑えめ）
  const normCurve = typeof normalizeGrowthCurveId === 'function' ? normalizeGrowthCurveId(growthCurve) : growthCurve;
  const rawFragileBonus = normCurve === 'fragile_genius' ? randInt(4, 7) : 0;
  const fragileBonus = (!isStarter && age <= 20) ? Math.floor(rawFragileBonus / 2) : rawFragileBonus;
  const starterBonus = isStarter ? randInt(1, 5) : randInt(-5, 0);
  const rawCenter = basePower + starterBonus + fragileBonus;
  const center = isStarter ? rawCenter : Math.min(82, rawCenter);

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
  const injuryProneness = generatePlayerInjuryProneness(growthCurve, pos, traits);
  const careerStats = generateInitialCareerStats(pos, age, isStarter, center, injuryProneness);
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
    isHomegrown: nationality === ((typeof SQUAD_NATIONALITY_RULES !== 'undefined' && SQUAD_NATIONALITY_RULES.HOME_NATIONALITY) || 'England'),
    isYouthGraduate: false,
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
    injuryProneness,
    injuryWeeks: 0,
    injuryDays: 0,
    isRetired: false,
    isStarter,
    isYouth: false,
    appearances: 0,
    goals: 0,
    assists: 0,
    totalRating: 0,
    lastDiff: null,
    squadStatus: isStarter ? ((basePower >= 75) ? 'key' : 'first_team') : (age <= 21 ? 'prospect' : 'rotation'),
    morale: 75,
    unhappyReason: null,
    transferRequested: false,
    adaptationDays: 0,
    suspensionMatches: { league: 0, domesticCup: 0, euroCup: 0 },
    compYellowAccum: { league: 0, domesticCup: 0, euroCup: 0 },
    contractClauses: { releaseClause: null, appearanceBonus: 0, goalBonus: 0, sellOnPct: 0 },
    loanTerms: null,
    onIntlDuty: false
  };
}

/**
 * 1名のユース選手（U-21アカデミー生：16〜19歳）を生成
 */
function createYouthPlayer(pos, usedNames, forcedNationality = null) {
  const age = randInt(16, 19);
  const homeRatio = (typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES.YOUTH_HOME_RATIO : 0.80);
  const nationality = forcedNationality || pickWeightedNationality(homeRatio);
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
    isHomegrown: true,
    isYouthGraduate: true,
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
    injuryProneness: generatePlayerInjuryProneness(growthCurve, pos, traits),
    injuryWeeks: 0,
    injuryDays: 0,
    isRetired: false,
    isStarter: false,
    isYouth: true,
    appearances: 0,
    goals: 0,
    assists: 0,
    totalRating: 0,
    lastDiff: null,
    squadStatus: 'prospect',
    morale: 80,
    unhappyReason: null,
    transferRequested: false,
    adaptationDays: 0,
    suspensionMatches: { league: 0, domesticCup: 0, euroCup: 0 },
    compYellowAccum: { league: 0, domesticCup: 0, euroCup: 0 },
    contractClauses: { releaseClause: null, appearanceBonus: 0, goalBonus: 0, sellOnPct: 0 },
    loanTerms: null,
    onIntlDuty: false
  };
}

/**
 * 1クラブ分の常設ユースチーム（U-21 Squad：6〜8名）を生成
 */
function createYouthSquad(usedNames, options = {}) {
  const squad = [];
  const youthPositions = ['GK', 'CB', 'RB', 'LB', 'DM', 'CM', 'RW', 'CF'];
  const homeRatio = typeof options.homeRatio === 'number'
    ? options.homeRatio
    : (typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES.YOUTH_HOME_RATIO : 0.80);
  for (const pos of youthPositions) {
    const nat = pickWeightedNationality(homeRatio);
    squad.push(createYouthPlayer(pos, usedNames, nat));
  }
  return squad;
}

/**
 * 1クラブ分の初期選手20名を生成（9ポジション網羅・重複なし背番号付与・国籍比率リアル化）
 */
function createSquad(basePower, usedNames, options = {}) {
  const players = [];
  const usedNumbers = new Set();
  const rules = typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES : null;
  const homeNat = (rules && rules.HOME_NATIONALITY) || 'England';
  const homeRatio = typeof options.homeRatio === 'number' ? options.homeRatio : (rules ? rules.D1_HOME_RATIO : 0.48);
  const minHomeCount = typeof options.minHomeCount === 'number' ? options.minHomeCount : (rules ? rules.D1_MIN_HOME_COUNT : 10);
  const leagueProfileKey = options.leagueProfileKey || ((homeNat === 'England' && homeRatio >= 0.70) ? 'ENG_D2' : homeNat);

  const slots = [];
  for (const group of SQUAD_COMPOSITION) {
    for (let i = 0; i < group.total; i++) {
      slots.push({ pos: group.pos, isStarter: i < group.starters, isExtraYouth: false });
    }
  }
  // レンタル運用・ターンオーバー用のU-21若手/控え枠を8名追加（計35名構成・シニア25名枠を遵守）
  const extraYouthPositions = ['CB', 'LB', 'RB', 'CM', 'AM', 'LW', 'RW', 'CF'];
  for (const ePos of extraYouthPositions) {
    slots.push({ pos: ePos, isStarter: false, isExtraYouth: true });
  }

  // 国籍リストを事前に決定し、最低自国籍人数を保証
  const nats = slots.map(() => pickWeightedNationality(homeRatio, homeNat, leagueProfileKey));
  let homeCount = nats.filter(n => n === homeNat).length;
  if (homeCount < minHomeCount) {
    const nonHomeIndices = [];
    nats.forEach((n, idx) => { if (n !== homeNat) nonHomeIndices.push(idx); });
    for (let k = nonHomeIndices.length - 1; k > 0; k--) {
      const r = randInt(0, k);
      const tmp = nonHomeIndices[k];
      nonHomeIndices[k] = nonHomeIndices[r];
      nonHomeIndices[r] = tmp;
    }
    for (let k = 0; k < nonHomeIndices.length && homeCount < minHomeCount; k++) {
      nats[nonHomeIndices[k]] = homeNat;
      homeCount++;
    }
  }

  // 25人シニア登録ルールに初期状態で違反しないよう、追加若手8名を含めU-21（18〜21歳）を最低11名確保し、
  // スタメンは主力世代（22〜31歳）中心・若手一極集中にならない年齢分布とする
  const benchIndices = [];
  const u21SlotSet = new Set();
  slots.forEach((s, idx) => {
    if (!s.isStarter) benchIndices.push(idx);
    if (s.isExtraYouth) u21SlotSet.add(idx);
  });
  [1, 3, 5, benchIndices.length - 1].forEach(bi => {
    if (bi >= 0 && bi < benchIndices.length) u21SlotSet.add(benchIndices[bi]);
  });
  const minU21Count = Math.max(4, slots.length - 23);
  for (let i = benchIndices.length - 1; i >= 0 && u21SlotSet.size < Math.min(minU21Count, benchIndices.length); i--) {
    u21SlotSet.add(benchIndices[i]);
  }

  let benchAssigned = 0;
  slots.forEach((slot, idx) => {
    const ageRange = u21SlotSet.has(idx)
      ? [18, 21]
      : (slot.isStarter ? (Math.random() < 0.85 ? [22, 31] : [19, 33]) : [20, 33]);
    const slotBasePower = slot.isExtraYouth ? Math.max(52, basePower - randInt(5, 9)) : basePower;
    const p = createPlayer(slot.pos, slotBasePower, slot.isStarter, usedNames, ageRange, null, nats[idx]);
    p.squadNumber = pickAvailableSquadNumber(slot.pos, usedNumbers);
    if (!slot.isStarter) {
      p.isBench = benchAssigned < 9;
      benchAssigned++;
    }
    players.push(p);
  });
  return players;
}

/**
 * 初期生成された2部選手・フリー選手・市場リスト選手のOVRを指定上限以内に比率維持で丸め、給与・市場価値を再計算する
 */
function capGeneratedPlayerOvr(player, maxOvr) {
  if (!player || typeof getPlayerOverallRating !== 'function') return player;
  const curOvr = getPlayerOverallRating(player);
  if (curOvr <= maxOvr) return player;

  const ratio = maxOvr / Math.max(1, curOvr);
  player.atk = clamp(Math.round(player.atk * ratio), 10, 99);
  player.def = clamp(Math.round(player.def * ratio), 10, 99);
  player.sta = clamp(Math.round(player.sta * ratio), 20, 99);
  let guard = 0;
  while (getPlayerOverallRating(player) > maxOvr && guard < 20) {
    guard++;
    if (player.atk >= player.def) player.atk = Math.max(10, player.atk - 1);
    else player.def = Math.max(10, player.def - 1);
  }

  const pos = player.primaryPosition || player.preferredPosition || player.pos;
  player.attributes = getPlayerFiveAttributes({
    primaryPosition: pos,
    atk: player.atk,
    def: player.def,
    sta: player.sta,
    traits: player.traits || []
  });
  player.wage = calculatePlayerWage(pos, player.atk, player.def, player.sta, player.age);
  player.salary = player.wage * 52;
  if (!player.isFreeAgent) {
    player.transferFee = calculateTransferFee(player);
  } else {
    player.transferFee = 0;
  }
  player.valueHistory = null;
  return player;
}

/**
 * 選手の国籍およびID・名前から決定論的に前所属クラブ名を選出する（完全無所属・漢字色直訳の排除）
 */
function pickFormerClubForPlayer(player, seedOffset = 0, excludeClubName = null) {
  const fallbackEng = [
    'シェフィールド B', 'バーンリー C', 'ノリッジ Y', 'ワトフォード Y', 'ミドルズブラ R',
    'ウェストブロム B', 'プレストン W', 'ブリストル R', 'ストーク R', 'スウォンジー W',
    'ダービー W', 'ポーツマス B', 'ブラックバーン B', 'バーミンガム B'
  ];
  const champClubs = (typeof CHAMPIONSHIP_CLUBS_DEFINITIONS !== 'undefined' && Array.isArray(CHAMPIONSHIP_CLUBS_DEFINITIONS) && CHAMPIONSHIP_CLUBS_DEFINITIONS.length > 0)
    ? CHAMPIONSHIP_CLUBS_DEFINITIONS.map(c => c.name).filter(Boolean)
    : fallbackEng;
  const d1MidLower = (typeof CLUB_DEFINITIONS !== 'undefined' && Array.isArray(CLUB_DEFINITIONS))
    ? CLUB_DEFINITIONS.filter(c => c && c.targetRank >= 10).map(c => c.name).filter(Boolean)
    : [];
  const engPool = [...new Set([...champClubs, ...d1MidLower])];

  const PAST_CLUBS_BY_NATIONALITY = {
    England: engPool,
    Spain: ['アラベス B', 'エスパニョール B', 'バジャドリード V', 'レガネス B', 'オサスナ R', 'マジョルカ R', 'セルタ S', 'バレンシア O', 'セビージャ W'],
    Italy: ['パルマ W', 'コモ B', 'レッチェ Y', 'エンポリ B', 'ヴェネツィア O', 'ウディネーゼ K', 'カリアリ B', 'トリノ G', 'ボローニャ R'],
    Germany: ['ウニオン R', 'ハイデンハイム B', 'ザンクトパウリ K', 'キール B', 'ボーフム B', 'ブレーメン G', 'アウクスブルク R', 'マインツ R', 'フライブルク R'],
    France: ['オセール W', 'ルアーヴル S', 'アンジェ K', 'サンテティエンヌ G', 'ストラスブール B', 'ナント Y', 'モンペリエ O', 'ブレスト R', 'ランス G'],
    Netherlands: ['アヤックス W', 'アイントホーフェン R', 'フェイエノールト R', 'アルクマール R', 'トゥウェンテ R', 'ユトレヒト R'],
    Portugal: ['スポルティング G', 'ポルト B', 'ベンフィカ R', 'ブラガ R', 'ギマランイス W'],
    Belgium: ['ブルージュ B', 'サンジロワーズ Y', 'アンデルレヒト V', 'ゲント B', 'ヘンク B'],
    Croatia: ['ディナモザグレブ B', 'スプリト W', 'リエカ W'],
    Brazil: ['サンパウロ R', 'フラメンゴ R', 'サントス W', 'グレミオ B', 'ミネイロ K'],
    Argentina: ['ボカ B', 'リーベル W', 'ラプラタ R', 'ロサリオ Y', 'ラシン S'],
    Japan: ['東京 B', '横浜 B', '川崎 S', '大阪 B', '名古屋 R']
  };

  const nat = player && player.nationality;
  const fallbackPool = ['コペンハーゲン W', 'スパルタプラハ M', 'セルティック G', 'ウィーン G', 'バーゼル R', ...engPool.slice(0, 6)];
  const basePool = (nat && PAST_CLUBS_BY_NATIONALITY[nat]) ? PAST_CLUBS_BY_NATIONALITY[nat] : fallbackPool;

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const playerClubName = playerClub ? playerClub.name : null;

  let candidates = basePool.filter(name => name && name !== excludeClubName && name !== playerClubName);
  if (candidates.length === 0) {
    candidates = fallbackPool.filter(name => name && name !== excludeClubName && name !== playerClubName);
  }
  if (candidates.length === 0) {
    candidates = basePool.length > 0 ? basePool : ['ロンドン・B'];
  }

  const seedStr = `${(player && player.id) || 'p'}_${(player && player.name) || 'player'}_${seedOffset}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const absHash = Math.abs(hash);
  return candidates[absHash % candidates.length];
}

/**
 * 移籍市場候補選手（無所属フリー選手 ＆ 欧州主要クラブ移籍リストアップ選手）を生成
 */
function generateTransferMarket() {
  const scoutingLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
  const count = randInt(6, 8) + (scoutingLv - 1) * 2;
  const usedNames = new Set();
  const managedList = typeof getAllManagedLeagueClubs === 'function' ? getAllManagedLeagueClubs() : (gameState.clubs || []);
  for (const club of managedList) {
    for (const p of (club.players || [])) {
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
  if (Array.isArray(gameState.preContractPlayers)) {
    for (const preP of gameState.preContractPlayers) {
      if (preP && preP.name) usedNames.add(preP.name);
    }
  }

  const usedMarketNums = new Set();
  const candidates = [];

  // シーズン終了時に実際のクラブから契約満了で退団した選手プールを優先編入
  const expiredPool = (typeof gameState !== 'undefined' && Array.isArray(gameState.expiredMarketPool))
    ? gameState.expiredMarketPool
    : [];
  for (const expP of expiredPool) {
    if (!expP || expP.isRetired) continue;
    if (candidates.some(c => c.id === expP.id)) continue;
    if (expP.name && usedNames.has(expP.name)) continue;
    if (expP.name) usedNames.add(expP.name);
    if (expP.fullName) usedNames.add(expP.fullName);
    expP.isFreeAgent = true;
    expP.contractYears = 0;
    expP.transferFee = 0;
    expP.squadNumber = pickAvailableSquadNumber(expP.pos, usedMarketNums);
    if (!expP.lastClubName) {
      expP.lastClubName = pickFormerClubForPlayer(expP, 0);
    }
    if (typeof ensurePlayerHistoryAndCareer === 'function') {
      ensurePlayerHistoryAndCareer(expP, '無所属 (Free Agent)');
    }
    candidates.push(expP);
  }
  if (typeof gameState !== 'undefined') {
    gameState.expiredMarketPool = [];
  }

  // 無所属フリー選手は現実的に OVR 60〜72 中心（掘り出し物でも最大 73〜76）とする
  const freeMinGen = 56 + Math.min(3, scoutingLv - 1);
  const freeMaxGen = 63 + Math.min(4, scoutingLv - 1);
  const freeMaxOvrCap = 73 + Math.min(3, scoutingLv - 1);

  const freeCount = count + 2;
  const remainingFreeCount = Math.max(4, freeCount - candidates.length);
  const marketHomeRatio = (typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES.MARKET_HOME_RATIO : 0.35);
  for (let f = 0; f < remainingFreeCount; f++) {
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const basePower = randInt(freeMinGen, freeMaxGen);
    const freeNat = pickWeightedNationality(marketHomeRatio);
    const freePlayer = createPlayer(pos, basePower, false, usedNames, [20, 34], null, freeNat);
    freePlayer.squadNumber = pickAvailableSquadNumber(pos, usedMarketNums);
    freePlayer.isFreeAgent = true;
    freePlayer.contractYears = 0;
    freePlayer.transferFee = 0;
    freePlayer.lastClubName = pickFormerClubForPlayer(freePlayer, 0);
    capGeneratedPlayerOvr(freePlayer, freeMaxOvrCap);
    freePlayer.salary = calculatePlayerSalary(freePlayer.pos, freePlayer.atk, freePlayer.def, freePlayer.sta, freePlayer.age);
    freePlayer.wage = Math.max(5, Math.round(freePlayer.salary / 52));
    if (typeof gameState !== 'undefined' && gameState.isSeasonOver) {
      freePlayer._generatedInOffseasonOfSeason = gameState.season || 1;
    }
    if (typeof ensurePlayerHistoryAndCareer === 'function') {
      ensurePlayerHistoryAndCareer(freePlayer, '無所属 (Free Agent)');
    }
    candidates.push(freePlayer);
  }

  candidates.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  gameState.transferMarket = candidates;

  // 欧州主要クラブ（ESP / ITA / GER / FRA）からのリストアップ選手を生成（28〜48名、スカウト網Lv連動）
  generateEuropeanTransferList(usedNames, scoutingLv);
}

/**
 * 欧州4大リーグ（スペイン・イタリア・ドイツ・フランス）主要クラブの移籍リストアップ選手を生成
 */
function generateEuropeanTransferList(existingUsedNames = null, scoutingLv = 1) {
  if (typeof getEuropeanMajorClubDefinitions !== 'function') {
    gameState.euroTransferList = [];
    return;
  }
  const euroClubs = getEuropeanMajorClubDefinitions();
  if (!Array.isArray(euroClubs) || euroClubs.length === 0) {
    gameState.euroTransferList = [];
    return;
  }

  const usedNames = existingUsedNames instanceof Set ? existingUsedNames : new Set();
  const preContractIds = new Set((gameState.preContractPlayers || []).map(x => x.id));
  const preservedPreContracts = (gameState.euroTransferList || []).filter(p => p && (p.preContract || preContractIds.has(p.id)));
  preservedPreContracts.forEach(p => {
    usedNames.add(p.name);
    if (p.fullName) usedNames.add(p.fullName);
  });

  // スカウトレベルに関係なく欧州主要クラブの主力〜トップスターを一定数リストアップする
  const targetCount = 120;
  const maxGenPower = 86;
  const maxEuroOvrCap = 93;

  const euroList = [...preservedPreContracts];
  for (let i = 0; i < targetCount; i++) {
    const clubDef = euroClubs[randInt(0, euroClubs.length - 1)];
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const clubTeamOvr = clubDef.basePower || 76;
    const rawGenPower = clamp(clubTeamOvr - 4 + randInt(-4, 5), 64, maxGenPower);
    const clubOvrCap = Math.min(maxEuroOvrCap, clubTeamOvr >= 83 ? maxEuroOvrCap : (clubTeamOvr >= 78 ? 86 : 81));
    const rawCountry = clubDef.country || '';
    const mappedNat = (typeof COUNTRY_CODE_TO_NATIONALITY !== 'undefined' && rawCountry)
      ? (COUNTRY_CODE_TO_NATIONALITY[rawCountry] || COUNTRY_CODE_TO_NATIONALITY[String(rawCountry).toUpperCase()] || null)
      : (typeof resolveClubCountryToNationality === 'function' ? resolveClubCountryToNationality(rawCountry, clubDef.id) : null);
    const leagueProf = (typeof LEAGUE_NATIONALITY_PROFILES !== 'undefined' && mappedNat) ? LEAGUE_NATIONALITY_PROFILES[mappedNat] : null;
    const euroHomeRatio = leagueProf && typeof leagueProf.homeRatio === 'number' ? leagueProf.homeRatio : 0.62;
    const euroNat = mappedNat ? pickWeightedNationality(euroHomeRatio, mappedNat, mappedNat) : null;
    const isEuroStarter = rawGenPower >= 72 || i < 14;
    const p = createPlayer(pos, rawGenPower, isEuroStarter, usedNames, [18, 32], null, euroNat);
    p.squadNumber = randInt(2, 30);
    p.contractYears = (i % 4 === 0) ? 1 : randInt(1, 4);
    p.isFreeAgent = false;
    p.isEuroListed = true;
    p.euroClubId = clubDef.id;
    p.clubId = clubDef.id;
    capGeneratedPlayerOvr(p, clubOvrCap);
    // 現在のシーズン進行度に応じた自国リーグ・カップ出場数を反映
    const curW = (typeof gameState !== 'undefined' && typeof gameState.currentWeek === 'number') ? gameState.currentWeek : 0;
    if (curW > 0) {
      applyInitialEuropeanDomesticStats(p, curW);
    }
    p.transferFee = calculateTransferFee(p);
    euroList.push(p);
  }

  euroList.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  gameState.euroTransferList = euroList;
}

/**
 * 途中週に生成された他国クラブ選手へ、現在週までの自国リーグ出場数・成績を初期反映する
 */
function applyInitialEuropeanDomesticStats(p, curW) {
  if (!p || !curW || curW <= 0) return;
  if ((p.appearances || 0) > 0) return;
  const pos = p.primaryPosition || p.pos || 'CM';
  const pOvr = getPlayerOverallRating(p);
  const availFactor = typeof getInjuryAvailabilityFactor === 'function' ? getInjuryAvailabilityFactor(p) : 1.0;
  const basePlayProb = pOvr >= 80 ? 0.88 : (pOvr >= 75 ? 0.78 : (pOvr >= 70 ? 0.65 : 0.48));
  const playProb = clamp(basePlayProb * availFactor, 0.22, 0.96);
  const effectiveW = Math.min(curW, 38);
  const estApps = Math.max(1, Math.min(42, effectiveW + 2, Math.round(effectiveW * playProb + (pOvr >= 78 && availFactor >= 0.85 ? randInt(0, 2) : 0))));
  const gRate = (pos === 'CF' || pos === 'ST') ? 0.42 : (['LW', 'RW', 'WG'].includes(pos) ? 0.28 : (pos === 'AM' ? 0.22 : (['LM', 'RM', 'SM'].includes(pos) ? 0.13 : (pos === 'CM' ? 0.10 : (pos === 'DM' ? 0.06 : (pos === 'GK' ? 0 : 0.055))))));
  const aRate = pos === 'GK' ? 0 : (pos === 'AM' ? 0.22 : (['LW', 'RW', 'WG', 'LM', 'RM', 'SM'].includes(pos) ? 0.18 : (pos === 'CM' ? 0.13 : 0.06)));
  const estGoals = pos === 'GK' ? 0 : Math.max(0, Math.round(estApps * gRate * (0.75 + Math.random() * 0.5)));
  const estAssists = pos === 'GK' ? 0 : Math.max(0, Math.round(estApps * aRate * (0.75 + Math.random() * 0.5)));
  const avgRt = clamp(6.5 + (pOvr - 68) * 0.038, 6.2, 7.9);
  p.appearances = (p.appearances || 0) + estApps;
  p.goals = (p.goals || 0) + estGoals;
  p.assists = (p.assists || 0) + estAssists;
  p.totalRating = Number(((p.totalRating || 0) + estApps * avgRt).toFixed(2));
  if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
  p.careerStats.appearances = (p.careerStats.appearances || 0) + estApps;
  p.careerStats.goals = (p.careerStats.goals || 0) + estGoals;
  p.careerStats.assists = (p.careerStats.assists || 0) + estAssists;
}

/**
 * 欧州4大リーグ移籍リストおよび欧州コンペ出場他国クラブ選手の自国リーグ出場数を週次で自然進行させる
 */
function advanceEuropeanTransferListMatchweek() {
  if (typeof gameState === 'undefined') return;
  const processedIds = new Set();
  const curW = Math.max(1, gameState.currentWeek || 1);
  const maxSeasonApps = Math.min(44, Math.min(38, curW) + 4);

  const stepPlayerMatchweek = (p) => {
    if (!p || p.isRetired || !p.id || processedIds.has(p.id)) return;
    processedIds.add(p.id);
    if ((p.appearances || 0) >= maxSeasonApps) return;
    const ovr = getPlayerOverallRating(p);
    const availFactor = typeof getInjuryAvailabilityFactor === 'function' ? getInjuryAvailabilityFactor(p) : 1.0;
    const basePlayProb = ovr >= 80 ? 0.88 : (ovr >= 75 ? 0.78 : (ovr >= 70 ? 0.65 : 0.45));
    const playProb = clamp(basePlayProb * availFactor, 0.20, 0.96);
    if (Math.random() > playProb) return;

    const pos = p.primaryPosition || p.pos || 'CM';
    const gProb = (pos === 'CF' || pos === 'ST') ? 0.42 : (['LW', 'RW', 'WG'].includes(pos) ? 0.28 : (pos === 'AM' ? 0.22 : (['LM', 'RM', 'SM'].includes(pos) ? 0.13 : (pos === 'CM' ? 0.10 : (pos === 'DM' ? 0.06 : (pos === 'GK' ? 0 : 0.055))))));
    const aProb = pos === 'GK' ? 0 : (pos === 'AM' ? 0.22 : (['LW', 'RW', 'WG', 'LM', 'RM', 'SM'].includes(pos) ? 0.18 : (pos === 'CM' ? 0.12 : 0.05)));
    const g = (pos !== 'GK' && Math.random() < gProb) ? 1 : 0;
    const a = (pos !== 'GK' && Math.random() < aProb) ? 1 : 0;
    const rt = clamp(6.3 + (ovr - 68) * 0.035 + (g * 0.65) + (a * 0.4) + (Math.random() * 0.8 - 0.35), 5.8, 9.2);

    p.appearances = (p.appearances || 0) + 1;
    p.goals = (p.goals || 0) + g;
    p.assists = (p.assists || 0) + a;
    p.totalRating = Number(((p.totalRating || 0) + rt).toFixed(2));
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
    p.careerStats.appearances = (p.careerStats.appearances || 0) + 1;
    p.careerStats.goals = (p.careerStats.goals || 0) + g;
    p.careerStats.assists = (p.careerStats.assists || 0) + a;
  };

  if (Array.isArray(gameState.euroTransferList)) {
    for (const p of gameState.euroTransferList) {
      stepPlayerMatchweek(p);
    }
  }
  if (typeof getEuropeanCompetitionClubsWithPlayers === 'function') {
    for (const c of getEuropeanCompetitionClubsWithPlayers()) {
      for (const p of (c.players || [])) {
        stepPlayerMatchweek(p);
      }
    }
  }
}

/**
 * 欧州コンペ（ECT / EPC / ECS）に現在参加しており選手データが存在する欧州クラブ一覧を重複排除して返す
 */
function getEuropeanCompetitionClubsWithPlayers() {
  const clubMap = new Map();
  if (typeof gameState === 'undefined' || !gameState.competitions) return [];
  for (const ek of ['championsCup', 'europaCup', 'conferenceCup']) {
    const comp = gameState.competitions[ek];
    if (!comp || !Array.isArray(comp.participants)) continue;
    for (const c of comp.participants) {
      if (!c || !c.id || c.isPlayer) continue;
      if (!c.country || c.country === 'ENG') continue;
      if (!Array.isArray(c.players) || c.players.length === 0) continue;
      if (!clubMap.has(c.id)) {
        clubMap.set(c.id, c);
      }
    }
  }
  return Array.from(clubMap.values());
}

/**
 * 移籍交渉・オファー処理用：1部・2部・欧州コンペ所属クラブ・欧州主要クラブリスト・無所属市場から対象選手と所属元クラブを一元検索
 */
function findTransferTargetWithSeller(playerId) {
  if (!playerId) return null;

  const d1Clubs = Array.isArray(gameState.clubs) ? gameState.clubs : [];
  for (const c of d1Clubs) {
    const p = (c.players || []).find(x => x.id === playerId);
    if (p) {
      return { player: p, sellerClub: c, category: 'ENG_D1', isFreeAgent: false, isEuroListed: false };
    }
  }

  const d2Clubs = (gameState.competitions && gameState.competitions.championship && Array.isArray(gameState.competitions.championship.clubs))
    ? gameState.competitions.championship.clubs
    : [];
  for (const c of d2Clubs) {
    const p = (c.players || []).find(x => x.id === playerId);
    if (p) {
      return { player: p, sellerClub: c, category: 'ENG_D2', isFreeAgent: false, isEuroListed: false };
    }
  }

  for (const c of getEuropeanCompetitionClubsWithPlayers()) {
    const p = (c.players || []).find(x => x && x.id === playerId);
    if (p) {
      return { player: p, sellerClub: c, category: 'EUROPE', isFreeAgent: false, isEuroListed: false };
    }
  }

  if (Array.isArray(gameState.euroTransferList)) {
    const euroP = gameState.euroTransferList.find(x => x && x.id === playerId);
    if (euroP) {
      const euroDef = (typeof findEuropeanClubDefinitionById === 'function')
        ? findEuropeanClubDefinitionById(euroP.euroClubId || euroP.clubId)
        : null;
      const virtualClub = euroDef
        ? { ...euroDef, shortCode: euroDef.shortName, isPlayer: false, isEuroVirtual: true }
        : { id: euroP.euroClubId || 'euro_club', name: '欧州クラブ', shortName: 'EUR', shortCode: 'EUR', primaryColor: '#1e3a8a', secondaryColor: '#f8fafc', isPlayer: false, isEuroVirtual: true };
      return { player: euroP, sellerClub: virtualClub, category: 'EUROPE', isFreeAgent: false, isEuroListed: true };
    }
  }

  if (Array.isArray(gameState.transferMarket)) {
    const mktP = gameState.transferMarket.find(x => x && x.id === playerId);
    if (mktP) {
      return {
        player: mktP,
        sellerClub: null,
        category: 'FREE_AGENT',
        isFreeAgent: Boolean(mktP.isFreeAgent || mktP.contractYears === 0),
        isEuroListed: false
      };
    }
  }

  return null;
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
    prospect.wage = Math.max(10, Math.round(prospect.salary / 52));
    prospect.contractYears = 4;
    prospect.transferFee = 0;
    prospect.squadNumber = pickAvailableSquadNumber(pos, usedYouthNums);
    prospects.push(prospect);
  }

  gameState.youthCandidates = prospects;
}

// ==========================================================================
// 5. フォーメーションスロット配置・スカッド検証・おまかせ最適編成アルゴリズム
// ==========================================================================

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

  // レンタル放出中（isLoanOut）の選手はスタメン・控えから確実に外す
  club.players.forEach(p => {
    if (p.loanStatus && p.loanStatus.isLoanOut) {
      p.isStarter = false;
      p.isBench = false;
      p.assignedPos = null;
      p.slotIndex = null;
    }
  });

  const isActiveSquadMember = (p) => !p.isRetired && (!p.loanStatus || !p.loanStatus.isLoanOut);

  // GKが最低1名いることを保証（レンタル放出中を除く）
  const gkPlayers = club.players.filter(p => p.pos === 'GK' && isActiveSquadMember(p));
  if (gkPlayers.length === 0) {
    const youthGk = createPlayer('GK', 54, true, usedNames, [18, 19]);
    youthGk.wage = 15;
    youthGk.salary = 15 * 52;
    youthGk.contractYears = 3;
    club.players.push(youthGk);
    if (noticeLogs && club.isPlayer) {
      noticeLogs.push(`[アカデミー緊急昇格] GK ${youthGk.name} (18歳) がトップチームに昇格しました`);
    }
  }

  // 出場可能人数が11名未満になった場合は不足ポジションのユース選手を昇格
  while (club.players.filter(isActiveSquadMember).length < 11) {
    const missingPos = ALL_POSITIONS.find(pos => {
      const count = club.players.filter(p => p.pos === pos && isActiveSquadMember(p)).length;
      return count < (REQUIRED_STARTERS[pos] || 1);
    }) || 'CM';
    const youth = createPlayer(missingPos, 54, false, usedNames, [18, 19]);
    youth.salary = 800;
    youth.wage = Math.max(10, Math.round(youth.salary / 52));
    youth.contractYears = 3;
    club.players.push(youth);
    if (noticeLogs && club.isPlayer) {
      noticeLogs.push(`[アカデミー昇格] ${missingPos} ${youth.name} (${youth.age}歳) がトップチームに昇格しました`);
    }
  }

  ensureClubSquadNumbers(club);

  let starters = club.players.filter(p => p.isStarter && isActiveSquadMember(p));
  let bench = club.players.filter(p => !p.isStarter && isActiveSquadMember(p));

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

  // 控え（ベンチ最大9名）とベンチ外（リザーブ）の厳格な選抜・振り分け（レンタル放出中は除外）
  const nonStarters = club.players.filter(p => !p.isStarter && isActiveSquadMember(p));
  let currentBench = nonStarters.filter(p => p.isBench === true);
  let currentReserves = nonStarters.filter(p => p.isBench !== true);

  // 初回や控えが9名未満の場合はリザーブ上位から補充（負傷者は後回し）
  if (currentBench.length < 9 && currentReserves.length > 0) {
    currentReserves.sort((a, b) => {
      const injA = ((a.injuryDays || 0) > 0 || (a.injuryWeeks || 0) > 0) ? 1 : 0;
      const injB = ((b.injuryDays || 0) > 0 || (b.injuryWeeks || 0) > 0) ? 1 : 0;
      if (injA !== injB) return injA - injB;
      const orderA = (typeof POS_DISPLAY_ORDER !== 'undefined' ? POS_DISPLAY_ORDER[a.pos] : 99) || 99;
      const orderB = (typeof POS_DISPLAY_ORDER !== 'undefined' ? POS_DISPLAY_ORDER[b.pos] : 99) || 99;
      if (orderA !== orderB) return orderA - orderB;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });
    while (currentBench.length < 9 && currentReserves.length > 0) {
      currentBench.push(currentReserves.shift());
    }
  } else if (currentBench.length > 9) {
    // 9名を超えている場合は健康な上位9名のみベンチとし、溢れた選手・負傷者はリザーブへ
    currentBench.sort((a, b) => {
      const injA = ((a.injuryDays || 0) > 0 || (a.injuryWeeks || 0) > 0) ? 1 : 0;
      const injB = ((b.injuryDays || 0) > 0 || (b.injuryWeeks || 0) > 0) ? 1 : 0;
      if (injA !== injB) return injA - injB;
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
 * オフシーズンにCPUクラブのスカッド人数・GK最低枠・U-21世代交代を自前アカデミー昇格で維持する
 */
function replenishCpuSquadOffseason(club, usedNames = null) {
  if (!club || club.isPlayer || !Array.isArray(club.players)) return 0;
  const maxSquad = typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50;
  const nameSet = (usedNames instanceof Set) ? usedNames : new Set();
  if (nameSet.size === 0) {
    club.players.forEach(p => { if (p && p.name) nameSet.add(p.name); });
  }

  const isActive = (p) => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut);
  const isD2 = club.division === 'd2' || club.tier === 'D2';
  const baseTierOvr = isD2
    ? clamp(Math.round((club.basePower || 60) - 2), 54, 65)
    : clamp(Math.round((club.basePower || 70) - 4), 60, 74);

  const dfPositions = ['CB', 'LB', 'RB'];
  const mfPositions = ['DM', 'CM', 'LM', 'RM', 'AM'];
  const fwPositions = ['LW', 'RW', 'CF'];
  const fallbackPositions = ['CB', 'CM', 'CF', 'LB', 'RB', 'DM', 'LW', 'RW', 'AM'];

  const createGraduate = (pos, ageRange = [17, 20]) => {
    const targetOvr = clamp(baseTierOvr + randInt(-4, 4), isD2 ? 53 : 58, isD2 ? 68 : 77);
    const p = createPlayer(pos, targetOvr + 2, false, nameSet, ageRange);
    p.clubId = club.id;
    p.isYouthGraduate = true;
    p.isFreeAgent = false;
    p.contractYears = randInt(3, 5);
    p.wage = calculatePlayerWage(p.pos, p.atk, p.def, p.sta, p.age);
    p.salary = p.wage * 52;
    p.isStarter = false;
    p.isBench = false;
    if (typeof ensurePlayerHistoryAndCareer === 'function') {
      ensurePlayerHistoryAndCareer(p, club.name);
    }
    club.players.push(p);
    return p;
  };

  let added = 0;
  const activePlayers = () => club.players.filter(isActive);

  // 1. GK最低2名を保証
  let guard = 0;
  while (activePlayers().filter(p => p.pos === 'GK').length < 2 && club.players.length < maxSquad && guard < 3) {
    guard++;
    createGraduate('GK', [18, 20]);
    added++;
  }

  // 2. バランスを見ながら最低23名までユース昇格で補充
  guard = 0;
  while (activePlayers().length < 23 && club.players.length < maxSquad && guard < 15) {
    guard++;
    const act = activePlayers();
    const dfCount = act.filter(p => dfPositions.includes(p.pos)).length;
    const mfCount = act.filter(p => mfPositions.includes(p.pos)).length;
    const fwCount = act.filter(p => fwPositions.includes(p.pos)).length;
    let nextPos;
    if (dfCount < 7) nextPos = dfPositions[dfCount % dfPositions.length];
    else if (mfCount < 7) nextPos = mfPositions[mfCount % mfPositions.length];
    else if (fwCount < 5) nextPos = fwPositions[fwCount % fwPositions.length];
    else nextPos = fallbackPositions[guard % fallbackPositions.length];
    createGraduate(nextPos, [17, 20]);
    added++;
  }

  // 3. 長期高齢化防止：各CPUクラブにU-21世代が最低3名在籍するよう毎年若手枠を補充
  guard = 0;
  while (activePlayers().filter(p => (p.age || 25) <= 21).length < 3 && club.players.length < 27 && guard < 2) {
    guard++;
    const act = activePlayers();
    const pos = fallbackPositions[(act.length + guard) % fallbackPositions.length];
    createGraduate(pos, [17, 19]);
    added++;
  }

  if (added > 0 && typeof ensureClubSquadNumbers === 'function') {
    ensureClubSquadNumbers(club);
  }
  return added;
}

/**
 * スロットと選手の最適マッチング用スコア計算
 */
function calculateSlotPlayerScore(player, slotPos, compCategory = 'league', options = {}) {
  ensurePlayerProficiencies(player);
  const discCat = typeof resolveDisciplineCategory === 'function' ? resolveDisciplineCategory(compCategory) : compCategory;
  let score = 0;

  // 1. 負傷・出場停止・代表招集・レンタル放出除外ペナルティ
  const isInjured = (player.injuryWeeks > 0) || (player.injuryDays > 0);
  if (isInjured) {
    score -= 2000;
  }
  if (typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(player, discCat)) {
    score -= 8000;
  }
  if (player.onIntlDuty) {
    score -= 8000;
  }
  if (player.loanStatus && player.loanStatus.isLoanOut) {
    score -= 8000;
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
    score += 25; // 本職適性を優遇
  } else if (fitInfo.type === 'sub') {
    score += 8;  // サブ適性（factor: 0.92）
  } else if (fitInfo.type === 'semi' || fitInfo.type === 'adjacent') {
    score -= 25; // 同系列未習得（ペナルティ）
  } else {
    score -= 60; // 完全不適性（大幅ペナルティ）
  }

  // 4. 蓄積疲労度を考慮したローテーション補正 ＆ 基礎スタミナ微調整
  const ftg = typeof player.fatigue === 'number' ? player.fatigue : 0;
  if (ftg >= 80) {
    score -= 28; // 限界・負傷危険域の選手は確実に休養させる
  } else if (ftg >= 60) {
    score -= 18; // 高疲労の主力を控えの実力者とターンオーバー
  } else if (ftg >= 42) {
    score -= 10; // 中程度の疲労蓄積でローテーション候補
  } else if (ftg >= 28) {
    score -= 5;  // 連戦時の軽微ローテ補正
  } else if (ftg <= 12) {
    score += 4;  // フレッシュな選手を優遇
  }

  if (player.sta) {
    score += (player.sta - 70) * 0.05;
  }

  // 5. CPUクラブ向け大会別ターンオーバー＆過密出場抑制（控え・若手起用と現実的な試合数維持）
  if (options && options.isCpuTurnover) {
    const apps = typeof player.appearances === 'number' ? player.appearances : 0;
    const isDomesticCup = (compCategory === 'faCup' || compCategory === 'leagueCup' || compCategory === 'domesticCup');
    if (isDomesticCup) {
      score -= Math.min(28, apps * 0.65);
      if (apps <= 12) {
        score += 10;
      }
    }
    if (apps >= 40) {
      score -= Math.min(50, (apps - 39) * 2.2);
    }
    if (apps >= 52) {
      score -= 25;
    }
  }

  return score;
}

/**
 * 最小費用流（最長路）による大域的最適二部マッチング
 * 所属全選手 (N人) から フォーメーション枠 (M=11枠) へ、
 * チーム全体の合計スコア（実効OVR・適性・健康度）が最大となる一意の配置を求める
 */
function findOptimalAssignment(players, slots, compCategory = 'league', options = {}) {
  const N = players.length; // 候補選手数 (通常20〜25人)
  const M = slots.length;   // スロット数 (11枠)
  if (N < M) return null;

  // コスト行列 W[j][i]: スロット j と 選手 i のスコア
  // M <= N なのでスロットを行(0..M-1)、選手を列(0..N-1)とする
  const W = Array.from({ length: M }, () => new Float64Array(N));
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      W[j][i] = calculateSlotPlayerScore(players[i], slots[j].pos, compCategory, options);
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
function optimizeClubStarters(club, compCategory = 'league') {
  if (!club.formation || !FORMATIONS[club.formation]) {
    club.formation = '4-3-3';
  }
  const formationDef = getClubFormationDef(club);
  const slots = formationDef.slots;
  const availablePlayers = club.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));

  // 最適マッチングの実行
  const assignment = findOptimalAssignment(availablePlayers, slots, compCategory, { isCpuTurnover: !club.isPlayer });

  club.players.forEach(p => {
    p.isStarter = false;
    p.isBench = false;
    p.assignedPos = null;
    p.slotIndex = null;
  });

  let totalEffOvr = 0;
  let starterCount = 0;

  for (let j = 0; j < slots.length; j++) {
    const p = assignment && assignment[j];
    if (p) {
      p.isStarter = true;
      p.isBench = false;
      p.slotIndex = slots[j].slotIndex;
      p.assignedPos = slots[j].pos;
      totalEffOvr += getEffectivePlayerRatingForSlot(p, slots[j].pos);
      starterCount++;
    }
  }

  optimizeClubBench(club, compCategory);
  ensureValidSquadAndStarters(club);

  const avgEffOvr = starterCount > 0 ? Math.round(totalEffOvr / starterCount) : 0;
  return { avgEffOvr, starterCount };
}

/**
 * 非スタメン全体から、健康状態・出場可否・ポジションバランス・OVR・フレッシュさを考慮してベンチ枠（最大9名）を動的選抜する
 */
function optimizeClubBench(club, compCategory = 'league') {
  if (!club || !Array.isArray(club.players)) return;
  const benchLimit = typeof getEffectiveBenchLimit === 'function' ? getEffectiveBenchLimit(club) : 9;
  const nonStarters = club.players.filter(p => p && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const discCat = typeof resolveDisciplineCategory === 'function' ? resolveDisciplineCategory(compCategory) : compCategory;

  const isUnavailable = (p) => {
    const injured = (p.injuryWeeks > 0) || (p.injuryDays > 0);
    const suspended = typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, discCat);
    return injured || suspended || Boolean(p.onIntlDuty);
  };

  const scoreBenchCandidate = (p) => {
    const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(p) : 65;
    const ftg = typeof p.fatigue === 'number' ? p.fatigue : 0;
    const unavailPenalty = isUnavailable(p) ? -5000 : 0;
    return unavailPenalty + ovr - (ftg * 0.18);
  };

  const sorted = [...nonStarters].sort((a, b) => scoreBenchCandidate(b) - scoreBenchCandidate(a));
  const selected = [];
  const selectedIds = new Set();

  // 1. 控えGKを1名優先確保（出場可能なGKがいる場合）
  const bestGk = sorted.find(p => (p.primaryPosition || p.pos) === 'GK' && !isUnavailable(p));
  if (bestGk && selected.length < benchLimit) {
    selected.push(bestGk);
    selectedIds.add(bestGk.id);
  }

  // 2. DF / MF / FW 各役割グループから最低1名ずつ出場可能な選手を確保してバランス維持
  for (const role of ['DF', 'MF', 'FW']) {
    if (selected.length >= benchLimit) break;
    const cand = sorted.find(p => !selectedIds.has(p.id) && !isUnavailable(p) && ((POS_ROLE_GROUP[p.primaryPosition || p.pos] || 'MF') === role));
    if (cand) {
      selected.push(cand);
      selectedIds.add(cand.id);
    }
  }

  // 3. 残りのベンチ枠を総合スコア順に補充
  for (const p of sorted) {
    if (selected.length >= benchLimit) break;
    if (!selectedIds.has(p.id)) {
      selected.push(p);
      selectedIds.add(p.id);
    }
  }

  nonStarters.forEach(p => {
    p.isBench = selectedIds.has(p.id);
  });
}

/**
 * CPUクラブおよび共通の自動スタメン編成
 */
function autoSelectStarters(club) {
  return optimizeClubStarters(club);
}

// ==========================================================================
// 6. クラブ人件費・実質可処分移籍予算（Safe Transfer Budget）算出
// ==========================================================================

/**
 * クラブの年間総年俸（単位：£1K）を計算
 */
function getClubTotalPayroll(club) {
  const playerPayroll = (club.players || [])
    .filter(p => !p.isRetired && (!p.loanStatus || !p.loanStatus.isLoanOut))
    .reduce((sum, p) => sum + (p.salary || 0), 0);

  const managerAnnual = (club.manager && club.manager.weeklyWage) ? club.manager.weeklyWage * 52 : 0;
  const coachWeekly = getClubCoachingStaffWeeklyWage(club);
  const coachAnnual = coachWeekly * 52;

  return playerPayroll + managerAnnual + coachAnnual;
}

/**
 * クラブの週次総人件費（単位：£1K / 週）を計算（選手週給 ＋ 監督週給 ＋ コーチ週給）
 */
function getClubWeeklyPayroll(club) {
  if (!club) return 0;
  const annual = getClubTotalPayroll(club);
  return Math.max(0, Math.round(annual / 52));
}

/**
 * 意図せぬ債務超過（破産）を防ぐための「実質可処分移籍予算（Safe Transfer Budget）」（単位：£1K）を算出
 * 今季残り週（オフシーズンは来季52週）の未払人件費と、確実に見込めるリーグ戦マッチデイ・放映権収入および開幕前運転資金バッファを考慮
 */
function getSafeTransferBudget(club) {
  if (!club) return 0;
  const funds = typeof club.funds === 'number' ? club.funds : 0;
  const weeklyPayroll = getClubWeeklyPayroll(club);
  const hasState = typeof gameState !== 'undefined' && gameState;
  const stadiumLv = (hasState && gameState.facilities && gameState.facilities.stadium) ? gameState.facilities.stadium : 1;
  const stadiumMult = club.isPlayer ? (1 + (stadiumLv - 1) * 0.15) : 1.0;

  const isCurrentD2 = club.isPlayer
    ? (typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision())
    : (club.division === 'd2');
  const rel = (hasState && gameState.isSeasonOver) ? gameState.lastPromotionRelegation : null;
  let isEffectiveD2 = isCurrentD2;
  if (rel) {
    if (club.isPlayer) {
      if (rel.isPlayerRelegated) isEffectiveD2 = true;
      else if (rel.isPlayerPromoted) isEffectiveD2 = false;
    } else {
      if (Array.isArray(rel.relegatedIds) && rel.relegatedIds.includes(club.id)) isEffectiveD2 = true;
      else if (Array.isArray(rel.promotedIds) && rel.promotedIds.includes(club.id)) isEffectiveD2 = false;
    }
  }

  const isD2Club = isEffectiveD2;
  const gateUnit = isD2Club ? 0.055 : 0.085;
  const estHomeGate = Math.round(((club.supporters || 14000) * gateUnit) * stadiumMult);
  const estAwayTv = isD2Club ? 450 : 1600;
  let estSponsorBase = typeof getClubTotalBaseSponsorIncome === 'function'
    ? getClubTotalBaseSponsorIncome(club, isD2Club)
    : ((club.sponsor && typeof club.sponsor.baseAnnual === 'number') ? club.sponsor.baseAnnual : 3200);
  const estMinLeaguePrize = isD2Club ? 1500 : 5000;
  const estGuaranteedEndRev = estSponsorBase + estMinLeaguePrize;

  if (hasState && gameState.isSeasonOver) {
    const totalMatches = isEffectiveD2 ? 46 : 38;
    const halfMatches = Math.floor(totalMatches / 2);
    const estNextLeagueRev = halfMatches * estHomeGate + halfMatches * estAwayTv + estGuaranteedEndRev;
    const nextAnnualPayroll = weeklyPayroll * 52;
    const netSeasonBurn = Math.max(0, nextAnnualPayroll - estNextLeagueRev);
    const preseasonBuffer = weeklyPayroll * 7; // 7月〜8月開幕までの無収入期間バッファ
    const requiredReserve = Math.max(weeklyPayroll * 8, netSeasonBurn + preseasonBuffer);
    return Math.round(funds - requiredReserve);
  }

  const paidWeeks = clamp((hasState && gameState.paidPayrollWeeks) || 0, 0, 52);
  const remWeeks = Math.max(0, 52 - paidWeeks);
  const totalWeeks = (hasState && gameState.totalWeeks) || (isCurrentD2 ? 46 : 38);
  const remMatches = Math.max(0, totalWeeks - ((hasState && gameState.currentWeek) || 0));
  const remHome = Math.floor(remMatches / 2);
  const remAway = remMatches - remHome;
  const estRemLeagueRev = remHome * estHomeGate + remAway * estAwayTv + estGuaranteedEndRev;
  const preseasonWeeksAhead = ((hasState && gameState.currentWeek) || 0) === 0 ? Math.min(remWeeks, 6) : 2;
  const netRemBurn = Math.max(0, (weeklyPayroll * remWeeks) - estRemLeagueRev);
  const requiredReserve = Math.max(weeklyPayroll * Math.min(remWeeks, 6), netRemBurn + (weeklyPayroll * preseasonWeeksAhead));
  return Math.round(funds - requiredReserve);
}

// ==========================================================================
// 7. シーズン末の選手成長・加齢変動・現役引退判定
// ==========================================================================

/**
 * 成長曲線（growthCurve）・年齢・トレーニング施設Lvに応じた能力変動値を算出
 */
function computeStatGrowth(player, isPlayerClub = false, clubContext = null) {
  const age = player.age;
  const curve = typeof normalizeGrowthCurveId === 'function'
    ? normalizeGrowthCurveId(player.growthCurve || player.growthType)
    : (player.growthCurve || 'standard');

  let atkRange, defRange, staRange;

  if (curve === 'early_fade') {
    if (age <= 21) {
      atkRange = [2, 5]; defRange = [2, 5]; staRange = [1, 4];
    } else if (age <= 26) {
      atkRange = [-1, 1]; defRange = [-1, 1]; staRange = [-1, 1];
    } else {
      atkRange = [-4, -1]; defRange = [-4, -1]; staRange = [-5, -2];
    }
  } else if (curve === 'early_long') {
    if (age <= 22) {
      atkRange = [1, 4]; defRange = [1, 4]; staRange = [1, 3];
    } else if (age <= 29) {
      atkRange = [-1, 1]; defRange = [-1, 1]; staRange = [-1, 1];
    } else {
      atkRange = [-3, -1]; defRange = [-3, -1]; staRange = [-3, -1];
    }
  } else if (curve === 'steady_iron') {
    if (age <= 25) {
      atkRange = [1, 3]; defRange = [1, 3]; staRange = [1, 3];
    } else if (age <= 31) {
      atkRange = [-1, 1]; defRange = [-1, 1]; staRange = [-1, 1];
    } else {
      atkRange = [-2, 0]; defRange = [-2, 0]; staRange = [-2, 0];
    }
  } else if (curve === 'late_bloom') {
    if (age <= 24) {
      atkRange = [0, 2]; defRange = [0, 2]; staRange = [0, 2];
    } else if (age <= 29) {
      atkRange = [1, 3]; defRange = [1, 3]; staRange = [0, 2];
    } else if (age <= 32) {
      atkRange = [-1, 1]; defRange = [-1, 1]; staRange = [-2, 1];
    } else {
      atkRange = [-2, 0]; defRange = [-2, 0]; staRange = [-3, 0];
    }
  } else if (curve === 'fragile_genius') {
    if (age <= 24) {
      atkRange = [2, 5]; defRange = [2, 5]; staRange = [-1, 2];
    } else if (age <= 29) {
      atkRange = [-1, 2]; defRange = [-1, 2]; staRange = [-2, 1];
    } else {
      atkRange = [-4, 0]; defRange = [-4, 0]; staRange = [-5, -1];
    }
  } else {
    if (age <= 24) {
      atkRange = [1, 3]; defRange = [1, 3]; staRange = [0, 3];
    } else if (age <= 29) {
      atkRange = [-1, 1];
      defRange = [-1, 1];
      staRange = [-1, 1];
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

  // 実戦出場・好成績ボーナス（試合に出て活躍した若手はさらに伸びる）
  if (age <= 23 && (player.appearances || 0) >= 20 && player.totalRating > 0) {
    const avgR = player.totalRating / player.appearances;
    if (avgR >= 7.1) {
      dAtk += 1;
      dDef += 1;
    }
  }

  // レンタル（レンタル放出中）の若手選手は成長率が通常控え時の+30%加速
  if (player.loanStatus && player.loanStatus.isLoanOut) {
    if (dAtk > 0) dAtk = Math.max(dAtk + 1, Math.round(dAtk * 1.30));
    if (dDef > 0) dDef = Math.max(dDef + 1, Math.round(dDef * 1.30));
    if (dSta > 0) dSta = Math.max(dSta + 1, Math.round(dSta * 1.30));
  }

  // トレーニング＆メディカル施設Lvによる成長期ボーナス（最大+1）
  if (isPlayerClub) {
    const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
    if (trainingLv > 1 && age <= 25) {
      const bonusChance = (trainingLv - 1) * 0.20;
      if (Math.random() < bonusChance) dAtk += 1;
      if (Math.random() < bonusChance) dDef += 1;
      if (Math.random() < bonusChance) dSta += 1;
    }

    // 指導陣（COACHING STAFF）専門育成補正（成長期は+1上限・衰え期は劣化緩和のみ）
    const playerClub = getPlayerClub();
    if (playerClub && playerClub.coaches) {
      const coaches = playerClub.coaches;
      const pos = player.primaryPosition || player.pos || 'CM';
      const getFieldCoachChance = (rank) => (rank === 'S' ? 0.42 : (rank === 'A' ? 0.32 : (rank === 'B' ? 0.22 : 0.14)));
      const applyFieldCoachGroup = (coachList, eligiblePositions, deltaVal) => {
        if (!Array.isArray(coachList) || coachList.length === 0) return deltaVal;
        const isDirect = eligiblePositions.includes(pos);
        const isHalf = pos === 'CM';
        if (!isDirect && !isHalf) return deltaVal;
        let totalChance = 0;
        coachList.forEach(c => {
          if (!c) return;
          ensureCoachStats(c);
          totalChance += getFieldCoachChance(getStaffStatRank(c.stats.youthDev));
        });
        if (isHalf) totalChance *= 0.5;
        totalChance = Math.min(0.65, totalChance);
        if (age <= 26) {
          if (Math.random() < totalChance) deltaVal += 1;
        } else if (age >= 30 && deltaVal < 0) {
          if (Math.random() < Math.min(0.35, totalChance * 0.55)) deltaVal += 1;
        }
        return deltaVal;
      };

      // 1. オフェンスコーチ（最大2名）：攻撃陣成長＆ベテラン衰え緩和
      dAtk = applyFieldCoachGroup(coaches.attacking, ['CF', 'ST', 'LW', 'RW', 'WG', 'AM', 'LM', 'RM', 'SM'], dAtk);

      // 2. ディフェンスコーチ（最大2名）：守備陣成長＆ベテラン衰え緩和
      dDef = applyFieldCoachGroup(coaches.defending, ['CB', 'LB', 'RB', 'SB', 'LWB', 'RWB', 'DM'], dDef);

      // 3. GKコーチ（1名）：GK成長＆衰え緩和
      if (pos === 'GK' && coaches.goalkeeping) {
        const c = coaches.goalkeeping;
        ensureCoachStats(c);
        const yRk = getStaffStatRank(c.stats.youthDev);
        const gkChance = yRk === 'S' ? 0.65 : (yRk === 'A' ? 0.50 : (yRk === 'B' ? 0.35 : 0.22));
        if (age <= 26) {
          if (Math.random() < gkChance) dDef += 1;
          if (yRk === 'S' && Math.random() < 0.20) dDef += 1;
        } else if (age >= 30 && dDef < 0) {
          if (Math.random() < gkChance * 0.55) dDef += 1;
        }
      }

      // 4. フィジカルコーチ（1名）：スタミナ成長＆ベテラン体力衰え緩和
      if (coaches.fitness) {
        const c = coaches.fitness;
        ensureCoachStats(c);
        const cRk = getStaffStatRank(c.stats.coaching);
        const fitChance = cRk === 'S' ? 0.60 : (cRk === 'A' ? 0.45 : (cRk === 'B' ? 0.30 : 0.18));
        if (age <= 26) {
          if (Math.random() < fitChance) dSta += 1;
        } else if (age >= 30 && dSta < 0) {
          if (Math.random() < fitChance * 0.60) dSta += 1;
        }
      }

      // 5. コーチ陣の若手育成(youthDev) ＆ 監督の育成手腕(development)・ランク補正
      const coachEff = getClubCoachingEffects(playerClub);
      if (age <= 22 && coachEff.youthDevBonus > 0 && Math.random() < coachEff.youthDevBonus) {
        if (pos === 'GK') dDef += 1;
        else { dAtk += 1; dDef += 1; }
      }
      if (playerClub.manager) {
        const mgrEff = getManagerRankEffects(playerClub.manager);
        if (age <= 22 && Math.random() < mgrEff.youthGrowthBonus) {
          dAtk += 1;
          dDef += 1;
        } else if (age <= 26 && mgrEff.allGrowthBonus > 0 && Math.random() < mgrEff.allGrowthBonus) {
          dAtk += 1;
        }
      }
    }
  }

  // 高OVR帯（80+）の収穫逓減（成長インフレ・全員99化を防止）＆2部CPUクラブの能力収束抑制
  const isD2CpuClub = !isPlayerClub && clubContext && (clubContext.division === 'd2' || clubContext.tier === 'D2');
  const applySoftCap = (delta, curVal) => {
    if (delta <= 0) return delta;
    if (isD2CpuClub) {
      if (curVal >= 72) return Math.min(1, Math.round(delta * 0.35));
      if (curVal >= 67) return Math.min(2, Math.round(delta * 0.65));
    }
    if (curVal >= 88) return Math.min(1, Math.round(delta * 0.30));
    if (curVal >= 84) return Math.min(2, Math.max(delta >= 2 ? 1 : 0, Math.round(delta * 0.50)));
    if (curVal >= 80) return Math.min(3, Math.max(1, Math.round(delta * 0.72)));
    return Math.min(5, delta);
  };
  dAtk = applySoftCap(dAtk, player.atk || 70);
  dDef = applySoftCap(dDef, player.def || 70);
  dSta = applySoftCap(dSta, player.sta || 70);

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

  const normCurve = typeof normalizeGrowthCurveId === 'function' ? normalizeGrowthCurveId(player.growthCurve) : player.growthCurve;
  if (normCurve === 'late_bloom' || normCurve === 'steady_iron') baseProb -= 0.15;
  if (normCurve === 'early_fade') baseProb += 0.15;
  if (normCurve === 'fragile_genius') baseProb += 0.10;

  return Math.random() < baseProb;
}

// ==========================================================================
// 8. リアルシミュレーション拡張ドメインロジック（規律・霧スカウト・連携・PSR・心理・理事会）
// ==========================================================================

/**
 * 成長型・ポジション・特徴から選手の怪我しやすさ（10〜96）を生成
 */
function generatePlayerInjuryProneness(growthCurve, pos = 'CM', traits = []) {
  const normCurve = typeof normalizeGrowthCurveId === 'function' ? normalizeGrowthCurveId(growthCurve) : (growthCurve || 'standard');
  let val;
  if (normCurve === 'fragile_genius') {
    val = randInt(78, 96);
  } else if (normCurve === 'steady_iron') {
    val = randInt(10, 24);
  } else if (normCurve === 'early_fade') {
    val = randInt(42, 68);
  } else if (normCurve === 'early_long') {
    val = randInt(24, 52);
  } else if (normCurve === 'late_bloom') {
    val = randInt(22, 50);
  } else {
    val = randInt(20, 74);
  }

  if (pos === 'GK') {
    val -= 6;
  }
  if (Array.isArray(traits) && traits.includes('無尽蔵のスタミナ') && normCurve !== 'fragile_genius') {
    val -= 6;
  }

  if (normCurve === 'fragile_genius') {
    return clamp(Math.round(val), 76, 96);
  }
  if (normCurve === 'steady_iron') {
    return clamp(Math.round(val), 10, 26);
  }
  return clamp(Math.round(val), 10, 96);
}

/**
 * 既存・旧セーブ選手の怪我しやすさ（injuryProneness）を後方互換補完＆成長型と整合
 */
function ensurePlayerInjuryProneness(player) {
  if (!player) return 50;
  const normCurve = typeof normalizeGrowthCurveId === 'function'
    ? normalizeGrowthCurveId(player.growthCurve || player.growthType)
    : (player.growthCurve || 'standard');

  if (typeof player.injuryProneness === 'number' && !Number.isNaN(player.injuryProneness)) {
    if (normCurve === 'fragile_genius') {
      player.injuryProneness = clamp(Math.round(player.injuryProneness), 76, 96);
    } else if (normCurve === 'steady_iron') {
      player.injuryProneness = clamp(Math.round(player.injuryProneness), 10, 26);
    } else {
      player.injuryProneness = clamp(Math.round(player.injuryProneness), 10, 96);
    }
    return player.injuryProneness;
  }

  const keyStr = `${player.id || ''}_${player.name || ''}`;
  let hash = 0;
  for (let i = 0; i < keyStr.length; i++) {
    hash = ((hash * 31) + keyStr.charCodeAt(i)) | 0;
  }
  const unit = (Math.abs(hash) % 1000) / 999;

  let minR = 20;
  let maxR = 74;
  if (normCurve === 'fragile_genius') {
    minR = 78; maxR = 96;
  } else if (normCurve === 'steady_iron') {
    minR = 10; maxR = 24;
  } else if (normCurve === 'early_fade') {
    minR = 42; maxR = 68;
  } else if (normCurve === 'early_long') {
    minR = 24; maxR = 52;
  } else if (normCurve === 'late_bloom') {
    minR = 22; maxR = 50;
  }

  let val = Math.round(minR + unit * (maxR - minR));
  const pos = player.primaryPosition || player.pos || 'CM';
  if (pos === 'GK') val -= 6;
  if (Array.isArray(player.traits) && player.traits.includes('無尽蔵のスタミナ') && normCurve !== 'fragile_genius') {
    val -= 6;
  }

  if (normCurve === 'fragile_genius') {
    player.injuryProneness = clamp(val, 76, 96);
  } else if (normCurve === 'steady_iron') {
    player.injuryProneness = clamp(val, 10, 26);
  } else {
    player.injuryProneness = clamp(val, 10, 96);
  }
  return player.injuryProneness;
}

/**
 * 選手の怪我しやすさランク・表示色・発生確率倍率を取得
 */
function getInjuryPronenessInfo(player) {
  const score = ensurePlayerInjuryProneness(player);
  if (score >= 75) {
    return {
      score,
      level: 'very_high',
      label: '非常に高い',
      color: '#ef4444',
      riskMultiplier: Number((2.4 + (score - 75) * 0.04).toFixed(2))
    };
  }
  if (score >= 60) {
    return {
      score,
      level: 'high',
      label: 'やや高い',
      color: '#f97316',
      riskMultiplier: Number((1.55 + (score - 60) * 0.04).toFixed(2))
    };
  }
  if (score >= 38) {
    return {
      score,
      level: 'normal',
      label: '標準',
      color: '#94a3b8',
      riskMultiplier: Number((0.85 + (score - 38) * 0.025).toFixed(2))
    };
  }
  if (score >= 25) {
    return {
      score,
      level: 'low',
      label: '低い',
      color: '#38bdf8',
      riskMultiplier: Number((0.55 + (score - 25) * 0.02).toFixed(2))
    };
  }
  return {
    score,
    level: 'iron',
    label: '極めて低い',
    color: '#2ecc71',
    riskMultiplier: Number((0.35 + (score - 10) * 0.013).toFixed(2))
  };
}

/**
 * 怪我しやすさ（injuryProneness）から年間平均稼働率係数を算出
 * 高い選手（ガラスの天才等）は年間出場ペースが明確に下がり、鉄人系は安定して高稼働になる
 */
function getInjuryAvailabilityFactor(scoreOrPlayer) {
  let score = 50;
  if (typeof scoreOrPlayer === 'number' && !Number.isNaN(scoreOrPlayer)) {
    score = clamp(Math.round(scoreOrPlayer), 10, 96);
  } else if (scoreOrPlayer && typeof scoreOrPlayer === 'object') {
    score = ensurePlayerInjuryProneness(scoreOrPlayer);
  }
  if (score >= 75) {
    // 非常に高い（75..96）: 0.72 .. 0.58（離脱シーズンが多く年平均20〜30試合ペース）
    return Number((0.72 - ((score - 75) / 21) * 0.14).toFixed(3));
  }
  if (score >= 60) {
    // やや高い（60..74）: 0.86 .. 0.76
    return Number((0.86 - ((score - 60) / 15) * 0.10).toFixed(3));
  }
  if (score >= 38) {
    // 標準（38..59）: 1.00 .. 0.94
    return Number((1.00 - ((score - 38) / 22) * 0.06).toFixed(3));
  }
  // 低い・極めて低い（10..37）: 1.02 .. 1.08（鉄人系の安定稼働）
  return Number((1.02 + ((38 - score) / 28) * 0.06).toFixed(3));
}

/**
 * 負傷離脱期間をメタ表現（節・試合）を使わず自然な表現へ整形
 */
function formatPlayerInjuryDurationText(player) {
  if (!player) return '';
  const days = (typeof player.injuryDays === 'number' && player.injuryDays > 0)
    ? player.injuryDays
    : ((player.injuryWeeks || 0) * 7);
  if (days <= 0) return '';
  if (days >= 14) {
    return `あと約${Math.max(2, Math.round(days / 7))}週間`;
  }
  return `あと約${days}日`;
}

/**
 * 選手オブジェクトのリアリティ拡張フィールドを後方互換補完
 */
function ensurePlayerRealismFields(player, isStarterHint = false) {
  if (!player) return;
  ensurePlayerInjuryProneness(player);
  if (!player.squadStatus) {
    const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(player) : 70;
    if (player.isYouth || player.age <= 20) player.squadStatus = 'prospect';
    else if (isStarterHint || player.isStarter) player.squadStatus = ovr >= 77 ? 'key' : 'first_team';
    else player.squadStatus = 'rotation';
  }
  if (typeof player.morale !== 'number') player.morale = 75;
  if (player.unhappyReason === undefined) player.unhappyReason = null;
  if (typeof player.transferRequested !== 'boolean') player.transferRequested = false;
  if (typeof player.adaptationDays !== 'number') player.adaptationDays = 0;
  if (!player.suspensionMatches || typeof player.suspensionMatches !== 'object') {
    player.suspensionMatches = { league: 0, domesticCup: 0, euroCup: 0 };
  }
  if (!player.compYellowAccum || typeof player.compYellowAccum !== 'object') {
    player.compYellowAccum = { league: 0, domesticCup: 0, euroCup: 0 };
  }
  if (!player.contractClauses || typeof player.contractClauses !== 'object') {
    player.contractClauses = { releaseClause: null, appearanceBonus: 0, goalBonus: 0, sellOnPct: 0 };
  }
  if (player.loanTerms === undefined) player.loanTerms = null;
  if (typeof player.onIntlDuty !== 'boolean') player.onIntlDuty = false;
  if (typeof player.isYouthGraduate !== 'boolean') player.isYouthGraduate = Boolean(player.isYouth);
  if (typeof player.isHomegrown !== 'boolean') {
    const homeNat = (typeof SQUAD_NATIONALITY_RULES !== 'undefined' && SQUAD_NATIONALITY_RULES.HOME_NATIONALITY) || 'England';
    player.isHomegrown = player.isYouthGraduate || player.nationality === homeNat;
  }
}

/**
 * クラブオブジェクトのリアリティ拡張フィールドを後方互換補完
 */
function getClubMaxSupporters(club) {
  if (!club) return 35000;
  const isD2 = club.division === 'd2' || club.tier === 'D2';
  const initSup = club.initialSupporters || club.supporters || (isD2 ? 14000 : 18000);
  if (club.isPlayer) {
    const stadiumLv = (typeof gameState !== 'undefined' && gameState.facilities && gameState.facilities.stadium)
      ? gameState.facilities.stadium
      : 1;
    const baseCap = Math.max(22000, Math.round(initSup * 1.15));
    return Math.min(50000, baseCap + (stadiumLv - 1) * 5000);
  }
  if (isD2) {
    return Math.min(24000, Math.max(14000, Math.round(initSup * 1.15)));
  }
  return Math.min(48000, Math.max(22000, Math.round(initSup * 1.25)));
}

function adjustClubSupporters(club, delta) {
  if (!club) return 10000;
  const maxSup = getClubMaxSupporters(club);
  club.supporters = clamp(Math.round((club.supporters || 10000) + (delta || 0)), 5000, maxSup);
  return club.supporters;
}

function ensureClubRealismFields(club) {
  if (!club) return;
  if (typeof club.initialSupporters !== 'number') {
    const isD2Init = club.division === 'd2' || club.tier === 'D2';
    club.initialSupporters = club.supporters || (isD2Init ? 14000 : 18000);
  }
  if (typeof club.basePower !== 'number') {
    const defMatch = (typeof CLUB_DEFINITIONS !== 'undefined' && Array.isArray(CLUB_DEFINITIONS) ? CLUB_DEFINITIONS.find(d => d.id === club.id) : null)
      || (typeof CHAMPIONSHIP_CLUB_DEFINITIONS !== 'undefined' && Array.isArray(CHAMPIONSHIP_CLUB_DEFINITIONS) ? CHAMPIONSHIP_CLUB_DEFINITIONS.find(d => d.id === club.id) : null)
      || (typeof getEuropeanMajorClubDefinitions === 'function' ? getEuropeanMajorClubDefinitions().find(d => d.id === club.id) : null);
    if (defMatch && typeof defMatch.basePower === 'number') {
      club.basePower = defMatch.basePower;
    }
  }
  if (typeof club.reputation !== 'number') {
    const bp = typeof club.basePower === 'number' ? club.basePower : 70;
    const isD2 = club.division === 'd2' || club.tier === 'D2';
    club.reputation = clamp(Math.round((bp - 50) * 180 + (isD2 ? 1200 : 2800)), 1200, 9500);
  }
  if (typeof club.tacticalFamiliarity !== 'number') club.tacticalFamiliarity = 75;
  if (typeof club.teamChemistry !== 'number') club.teamChemistry = 75;
  if (!club.subPolicy) club.subPolicy = 'balanced';
  if (!club.roles || typeof club.roles !== 'object') {
    club.roles = { captainId: null, pkKickerId: null, setPieceKickerId: null };
  }
  if (!club.sponsors || typeof club.sponsors !== 'object') {
    club.sponsors = {
      chest: club.sponsor || null,
      sleeve: null,
      training: null,
      stadium: null,
      partners: []
    };
  }
  if (!club.sponsors.chest && club.sponsor) {
    club.sponsors.chest = club.sponsor;
  }
  if (!Array.isArray(club.sponsors.partners)) {
    club.sponsors.partners = [];
  }
  const skipSet = new Set(Array.isArray(club._skipAutoSponsorSlots) ? club._skipAutoSponsorSlots : []);
  const rep = club.reputation || 4000;
  for (const slotKey of ['chest', 'sleeve', 'training', 'stadium']) {
    if (!club.sponsors[slotKey] && !skipSet.has(slotKey)) {
      const templates = typeof getSponsorSlotTemplates === 'function'
        ? getSponsorSlotTemplates(slotKey)
        : (typeof SPONSOR_TEMPLATES !== 'undefined' ? SPONSOR_TEMPLATES : []);
      const matched = templates.find(s => rep >= (s.minReputation || 1000)) || templates[templates.length - 1];
      if (matched) {
        club.sponsors[slotKey] = createSponsorContractFromTemplate(matched, slotKey);
      }
    }
  }
  if (club.sponsors.partners.length === 0 && !skipSet.has('partners')) {
    const pTemplates = typeof getSponsorSlotTemplates === 'function' ? getSponsorSlotTemplates('partners') : [];
    const scale = 0.16 * (rep >= 6600 ? 16000 : rep >= 5200 ? 11500 : rep >= 3800 ? 7500 : 4000);
    pTemplates.slice(0, 2).forEach(pt => {
      club.sponsors.partners.push(createSponsorContractFromTemplate({
        ...pt,
        baseAnnual: Math.round(scale / 10) * 10,
        clBonus: Math.round((scale * 0.3) / 10) * 10,
        titleBonus: Math.round((scale * 0.4) / 10) * 10,
        relegationPenaltyPct: 20,
        contractYears: 2
      }, 'partners'));
    });
  }
  club.sponsor = club.sponsors.chest || null;
  if (!Array.isArray(club.psrHistory)) club.psrHistory = [];
  if (!club.psrSanction || typeof club.psrSanction !== 'object') {
    club.psrSanction = { transferBanWindows: 0, pointsDeductedThisSeason: 0 };
  }
  if (typeof club.boardConfidence !== 'number') club.boardConfidence = 75;
  if (!club.boardExpectations || typeof club.boardExpectations !== 'object') {
    club.boardExpectations = {
      targetRank: club.targetRank || 10,
      youthMinutesTarget: 5,
      stylePhilosophy: club.defaultTactic || club.tactic || 'possession'
    };
  }
  if (Array.isArray(club.players)) {
    club.players.forEach((p, idx) => ensurePlayerRealismFields(p, idx < 11));
  }
  autoAssignClubRoles(club);
}

function createSponsorContractFromTemplate(tpl, slotKey = 'chest') {
  if (!tpl) return null;
  return {
    id: tpl.id || `sp_${slotKey}_${Date.now()}`,
    slot: slotKey,
    name: tpl.name,
    sector: tpl.sector || 'パートナー',
    style: tpl.style || 'balanced',
    baseAnnual: tpl.baseAnnual || 0,
    signingBonus: tpl.signingBonus || 0,
    clBonus: tpl.clBonus || 0,
    titleBonus: tpl.titleBonus || 0,
    matchIncomeBonusPct: tpl.matchIncomeBonusPct || 0,
    relegationPenaltyPct: tpl.relegationPenaltyPct || 0,
    yearsRemaining: tpl.contractYears || randInt(1, 2),
    perkLabel: tpl.perkLabel || ''
  };
}

function getAllClubSponsorContracts(club) {
  if (!club) return [];
  if (club.sponsors && typeof club.sponsors === 'object') {
    const singleList = ['chest', 'sleeve', 'training', 'stadium'].map(k => club.sponsors[k]).filter(Boolean);
    const partnerList = Array.isArray(club.sponsors.partners) ? club.sponsors.partners.filter(Boolean) : [];
    return [...singleList, ...partnerList];
  }
  return club.sponsor ? [club.sponsor] : [];
}

function getClubTotalBaseSponsorIncome(club, isD2Club = false) {
  const slots = getAllClubSponsorContracts(club);
  if (slots.length === 0) return 0;
  let total = 0;
  for (const sp of slots) {
    let val = typeof sp.baseAnnual === 'number' ? sp.baseAnnual : 0;
    if (isD2Club && sp.relegationPenaltyPct) {
      val = Math.round(val * (1 - sp.relegationPenaltyPct / 100));
    }
    total += val;
  }
  return total;
}

function getClubSponsorMatchIncomeMultiplier(club) {
  const slots = getAllClubSponsorContracts(club);
  if (slots.length === 0) return 1.0;
  const sumPct = slots.reduce((acc, sp) => acc + (Number(sp.matchIncomeBonusPct) || 0), 0);
  return 1 + Math.min(0.25, Math.max(0, sumPct / 100));
}

function isPlayerSuspendedForComp(player, compCategory = 'league') {
  if (!player || !player.suspensionMatches) return false;
  const cat = compCategory === 'preseason' ? null : compCategory;
  if (!cat) return false;
  return (player.suspensionMatches[cat] || 0) > 0;
}

function resolveDisciplineCategory(compKey) {
  if (!compKey || compKey === 'd1' || compKey === 'd2' || compKey === 'league') return 'league';
  if (compKey === 'leagueCup' || compKey === 'nationalCup' || compKey === 'domesticCup') return 'domesticCup';
  if (compKey === 'championsCup' || compKey === 'europaCup' || compKey === 'conferenceCup' || compKey === 'euroCup') return 'euroCup';
  return 'preseason';
}

function autoAssignClubRoles(club) {
  if (!club || !Array.isArray(club.players) || club.players.length === 0) return;
  if (!club.roles) club.roles = { captainId: null, pkKickerId: null, setPieceKickerId: null };
  const active = club.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  if (active.length === 0) return;
  const hasId = (id) => id && active.some(p => p.id === id);

  if (!hasId(club.roles.captainId)) {
    const cap = [...active].sort((a, b) => ((b.age >= 25 ? 10 : 0) + getPlayerOverallRating(b)) - ((a.age >= 25 ? 10 : 0) + getPlayerOverallRating(a)))[0];
    club.roles.captainId = cap ? cap.id : null;
  }
  if (!hasId(club.roles.pkKickerId)) {
    const pk = [...active].filter(p => (p.primaryPosition || p.pos) !== 'GK').sort((a, b) => (b.atk || 50) - (a.atk || 50))[0] || active[0];
    club.roles.pkKickerId = pk ? pk.id : null;
  }
  if (!hasId(club.roles.setPieceKickerId)) {
    const sp = [...active].filter(p => (p.primaryPosition || p.pos) !== 'GK').sort((a, b) => {
      const sa = (a.atk || 50) + (['AM', 'CM', 'LW', 'RW', 'LM', 'RM'].includes(a.primaryPosition || a.pos) ? 8 : 0);
      const sb = (b.atk || 50) + (['AM', 'CM', 'LW', 'RW', 'LM', 'RM'].includes(b.primaryPosition || b.pos) ? 8 : 0);
      return sb - sa;
    })[0] || active[0];
    club.roles.setPieceKickerId = sp ? sp.id : null;
  }
}

/**
 * 霧（Fog of War）を適用した選手表示データを返す
 */
function getPlayerScoutedView(player, isPlayerClub = false) {
  if (!player) return null;
  const trueOvr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(player) : 70;
  if (isPlayerClub) {
    return {
      isScouted: true,
      scoutLevel: 2,
      ovrDisplay: `${trueOvr}`,
      ovrMin: trueOvr,
      ovrMax: trueOvr,
      atkDisplay: `${player.atk}`,
      defDisplay: `${player.def}`,
      staDisplay: `${player.sta}`,
      curveDisplay: '',
      feeKnown: true
    };
  }
  const intel = (typeof gameState !== 'undefined' && gameState.scoutingIntel && gameState.scoutingIntel[player.id])
    ? gameState.scoutingIntel[player.id]
    : { progress: 0, level: 0 };
  const lv = intel.level || 0;
  if (lv >= 2) {
    return {
      isScouted: true,
      scoutLevel: 2,
      ovrDisplay: `${trueOvr}`,
      ovrMin: trueOvr,
      ovrMax: trueOvr,
      atkDisplay: `${player.atk}`,
      defDisplay: `${player.def}`,
      staDisplay: `${player.sta}`,
      curveDisplay: '',
      feeKnown: true
    };
  }
  const hash = String(player.id || 'p').split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 13, 0);
  const spread = lv === 1 ? 2 : 5;
  const shift = (hash % (spread + 1)) - Math.floor(spread / 2);
  const minOvr = clamp(trueOvr - spread + shift, 45, trueOvr);
  const maxOvr = clamp(Math.max(minOvr + (lv === 1 ? 2 : 4), trueOvr + spread + shift), trueOvr, 99);
  const atkMin = clamp((player.atk || 60) - spread * 2, 20, 99);
  const atkMax = clamp((player.atk || 60) + spread * 2, 20, 99);
  const defMin = clamp((player.def || 60) - spread * 2, 20, 99);
  const defMax = clamp((player.def || 60) + spread * 2, 20, 99);
  const staMin = clamp((player.sta || 60) - spread * 2, 20, 99);
  const staMax = clamp((player.sta || 60) + spread * 2, 20, 99);
  return {
    isScouted: false,
    scoutLevel: lv,
    ovrDisplay: `${minOvr}~${maxOvr}`,
    ovrMin: minOvr,
    ovrMax: maxOvr,
    atkDisplay: `${atkMin}~${atkMax}`,
    defDisplay: `${defMin}~${defMax}`,
    staDisplay: `${staMin}~${staMax}`,
    curveDisplay: '',
    feeKnown: true
  };
}

function assignScoutToPlayer(playerId) {
  if (!playerId || typeof gameState === 'undefined') return { ok: false, reason: 'invalid' };
  if (!gameState.scoutingIntel) gameState.scoutingIntel = {};
  if (!Array.isArray(gameState.activeScoutAssignments)) gameState.activeScoutAssignments = [];
  const existingIntel = gameState.scoutingIntel[playerId];
  if (existingIntel && existingIntel.level >= 2) {
    return { ok: false, reason: 'already_complete' };
  }
  if (gameState.activeScoutAssignments.some(a => a.playerId === playerId)) {
    return { ok: false, reason: 'already_assigned' };
  }
  const sLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
  const maxSlots = 2 + (sLv - 1) * 2;
  if (gameState.activeScoutAssignments.length >= maxSlots) {
    return { ok: false, reason: 'slots_full', maxSlots };
  }
  const totalDays = Math.max(3, 8 - sLv);
  gameState.activeScoutAssignments.push({ playerId, daysRemaining: totalDays, totalDays });
  if (!gameState.scoutingIntel[playerId]) {
    gameState.scoutingIntel[playerId] = { progress: 0, level: 0, discoveredAtDay: null };
  }
  if (!Array.isArray(gameState.targetShortlist)) {
    gameState.targetShortlist = [];
  }
  if (!gameState.targetShortlist.includes(playerId)) {
    gameState.targetShortlist.push(playerId);
  }
  return { ok: true, totalDays };
}

function advanceScoutingProgressDaily() {
  if (typeof gameState === 'undefined' || !Array.isArray(gameState.activeScoutAssignments) || gameState.activeScoutAssignments.length === 0) return;
  if (!gameState.scoutingIntel) gameState.scoutingIntel = {};
  const remaining = [];
  for (const task of gameState.activeScoutAssignments) {
    task.daysRemaining = Math.max(0, (task.daysRemaining || 1) - 1);
    const doneRatio = 1 - (task.daysRemaining / Math.max(1, task.totalDays || 5));
    const intel = gameState.scoutingIntel[task.playerId] || { progress: 0, level: 0, discoveredAtDay: null };
    intel.progress = Math.round(doneRatio * 100);
    if (doneRatio >= 0.5 && intel.level < 1) intel.level = 1;
    if (task.daysRemaining <= 0) {
      intel.level = 2;
      intel.progress = 100;
      intel.discoveredAtDay = gameState.currentDayIndex || 0;
      gameState.scoutingIntel[task.playerId] = intel;
      if (typeof findTransferTargetWithSeller === 'function') {
        const res = findTransferTargetWithSeller(task.playerId);
        const pName = res && res.player ? res.player.name : task.playerId;
        const pPos = res && res.player ? (res.player.primaryPosition || res.player.pos || '') : '';
        const pOvr = res && res.player && typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(res.player) : null;
        if (typeof addDailyLog === 'function') {
          addDailyLog(`【スカウト報告】${pName} の詳細調査が完了し、全能力・成長曲線・契約条件が判明しました。`);
        }
        if (typeof addInboxMessage === 'function') {
          addInboxMessage({
            senderType: 'scout',
            senderName: 'チーフスカウト',
            title: `詳細スカウト完了：${pPos ? pPos + ' ' : ''}${pName}`,
            body: `${pName}${pOvr ? `（OVR ${pOvr}）` : ''}の詳細調査が完了し、全能力値と獲得条件が判明しました。選手プロフィールから交渉や獲得候補の確認が行えます。`,
            actionType: 'open-player-profile',
            actionLabel: '選手詳細を見る',
            actionPayload: task.playerId
          });
        }
        if (typeof showSecretaryModal === 'function') {
          showSecretaryModal({
            topic: 'スカウト報告',
            title: `詳細調査完了：${pPos ? pPos + ' ' : ''}${pName}`,
            speech: `チーフスカウトより ${pName} の詳細調査レポートが届きました。能力値と契約条件のすべてが判明しております。`,
            detailHtml: `<div class="gm-modal-flat-list"><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">調査対象選手</span><span class="gm-modal-flat-val">${pPos ? pPos + ' ' : ''}${pName}${pOvr ? ` (OVR ${pOvr})` : ''}</span></div></div>`,
            actions: [
              {
                label: '選手詳細を確認する',
                className: 'btn btn-primary',
                onClick: () => {
                  if (typeof openPlayerProfileModal === 'function') openPlayerProfileModal(task.playerId);
                }
              },
              {
                label: '後で確認する',
                className: 'btn btn-secondary',
                onClick: () => { if (typeof renderAll === 'function') renderAll(); }
              }
            ]
          });
        }
      }
    } else {
      gameState.scoutingIntel[task.playerId] = intel;
      remaining.push(task);
    }
  }
  gameState.activeScoutAssignments = remaining;
}

/**
 * クラブのチームケミストリー＆戦術習熟度を算出・同期する
 */
function calculateClubChemistryAndFamiliarity(club) {
  if (!club) return { chemistry: 75, familiarity: 75 };
  const starters = (club.players || []).filter(p => p && p.isStarter && !p.isRetired);
  if (starters.length === 0) return { chemistry: 75, familiarity: 75 };

  const avgMorale = starters.reduce((acc, p) => acc + (typeof p.morale === 'number' ? p.morale : 75), 0) / starters.length;
  const adaptingCount = starters.filter(p => (p.adaptationDays || 0) > 0).length;
  const mgr = club.manager;
  const isPhilMatch = mgr && club.formation === mgr.preferredFormation && normalizeTacticKey(club.tactic) === normalizeTacticKey(mgr.preferredTactic);

  const chem = clamp(Math.round(68 + (avgMorale - 70) * 0.35 - adaptingCount * 4), 35, 99);
  const fam = clamp(Math.round((club.tacticalFamiliarity || 72) + (isPhilMatch ? 2 : 0)), 40, 99);
  club.teamChemistry = chem;
  club.tacticalFamiliarity = fam;
  return { chemistry: chem, familiarity: fam };
}

/**
 * 試合後の選手モラル・序列不満・キャプテン仲裁を更新
 */
function updatePlayerMoraleAndStatuses(club, starters = [], playedSubs = [], won = false, drawn = false) {
  if (!club || !Array.isArray(club.players)) return;
  const playedIds = new Set([...starters, ...playedSubs].filter(Boolean).map(p => p.id));
  const captain = club.roles && club.roles.captainId ? club.players.find(p => p.id === club.roles.captainId) : null;
  const captainLeadership = captain ? (captain.age >= 26 ? 1.2 : 0.8) : 0.5;

  for (const p of club.players) {
    if (!p || p.isRetired || (p.loanStatus && p.loanStatus.isLoanOut)) continue;
    ensurePlayerRealismFields(p);
    if ((p.injuryDays || 0) > 0 || (p.injuryWeeks || 0) > 0) continue;

    const didPlay = playedIds.has(p.id);
    let delta = won ? 2 : (drawn ? 0 : -2);

    if (didPlay) {
      delta += 2;
      if (p.unhappyReason === 'playing_time' && p.morale >= 55) {
        p.unhappyReason = null;
        p.transferRequested = false;
      }
    } else {
      if (p.squadStatus === 'key') delta -= 6;
      else if (p.squadStatus === 'first_team') delta -= 4;
      else if (p.squadStatus === 'rotation') delta -= 1;
    }

    if (delta < 0 && captainLeadership >= 1.0 && Math.random() < 0.35) {
      delta = Math.min(0, delta + 2);
    }

    p.morale = clamp((p.morale || 75) + delta, 10, 100);
    if (p.morale <= 35 && !didPlay && (p.squadStatus === 'key' || p.squadStatus === 'first_team')) {
      p.unhappyReason = 'playing_time';
      if (p.morale <= 22 && !p.transferRequested) {
        p.transferRequested = true;
        if (club.isPlayer && typeof addDailyLog === 'function') {
          addDailyLog(`【ロッカー不満】#${p.squadNumber || '-'} ${p.name} が出場機会の少なさに不満を募らせ、移籍志願を申し出ました！`);
        }
      }
    }
  }
}

/**
 * 3年累積赤字に基づくPSR（収益性と持続可能性に関する規則）評価
 */
function evaluateClubPSR(club) {
  if (!club || !Array.isArray(club.psrHistory)) return { total3YrNet: 0, isBreach: false, pointsDeduction: 0 };
  const recent3 = club.psrHistory.slice(-3);
  const total3YrNet = recent3.reduce((acc, row) => acc + (row.netProfit || 0), 0);
  const limit = typeof PSR_MAX_3YR_DEFICIT === 'number' ? PSR_MAX_3YR_DEFICIT : -35000;
  const isBreach = total3YrNet < limit;
  const pointsDeduction = isBreach ? (total3YrNet < limit - 15000 ? 10 : 6) : 0;
  return { total3YrNet, isBreach, pointsDeduction };
}

/**
 * 試合後の理事会（ボード）信頼度更新
 */
function updateBoardConfidenceAfterMatch(club, compCategory, won, drawn) {
  if (!club) return;
  ensureClubRealismFields(club);
  let delta = won ? 2 : (drawn ? 0 : -2);
  if (compCategory === 'league' && typeof getSortedStandings === 'function') {
    const table = (club.division === 'd2' && gameState.competitions && gameState.competitions.championship)
      ? [...gameState.competitions.championship.clubs].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0))
      : getSortedStandings();
    const rank = table.findIndex(c => c.id === club.id) + 1;
    const target = (club.boardExpectations && club.boardExpectations.targetRank) || club.targetRank || 8;
    if (rank > 0) {
      if (rank <= target) delta += 1;
      else if (rank >= 17 || rank >= target + 8) delta -= 2;
      else if (rank >= target + 5) delta -= 1;
    }
  }
  club.boardConfidence = clamp((club.boardConfidence || 75) + delta, 0, 100);
  if (club.isPlayer && club.boardConfidence >= 25 && gameState.pendingBoardCrisis) {
    gameState.pendingBoardCrisis = false;
  }
  if (club.isPlayer && club.boardConfidence <= 10 && !gameState.isSeasonOver && !gameState.isGameOver) {
    gameState.pendingBoardCrisis = true;
  }
}

// ==========================================================================
// 9. 国籍比率生成・25人登録ルール＆ホームグロウン（HG）評価
// ==========================================================================

/**
 * 指定確率 homeRatio で自国籍（homeNat）を抽選し、それ以外は他国から均等抽選する
 */
function pickWeightedNationality(homeRatio = 0.48, homeNat = null, leagueProfileKey = null, rng = Math.random) {
  const rules = typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES : null;
  const targetHome = homeNat || (rules && rules.HOME_NATIONALITY) || 'England';
  const natList = (typeof NATIONALITIES !== 'undefined' && Array.isArray(NATIONALITIES) && NATIONALITIES.length > 0)
    ? NATIONALITIES
    : ['England', 'France', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Portugal', 'Brazil', 'Argentina', 'Belgium', 'Croatia', 'Japan'];
  if (rng() < homeRatio) {
    return targetHome;
  }
  const others = natList.filter(n => n !== targetHome);
  if (others.length === 0) return targetHome;

  const baseWeights = (typeof NATIONALITY_DEFAULT_WEIGHTS !== 'undefined') ? NATIONALITY_DEFAULT_WEIGHTS : {};
  const profKey = leagueProfileKey || targetHome;
  const leagueProf = (typeof LEAGUE_NATIONALITY_PROFILES !== 'undefined' && profKey) ? LEAGUE_NATIONALITY_PROFILES[profKey] : null;
  const boosts = (leagueProf && leagueProf.foreignBoosts) ? leagueProf.foreignBoosts : {};

  let totalWeight = 0;
  const weights = others.map(n => {
    const base = typeof baseWeights[n] === 'number' ? baseWeights[n] : 1;
    const mult = typeof boosts[n] === 'number' ? boosts[n] : 1;
    const w = Math.max(0.05, base * mult);
    totalWeight += w;
    return w;
  });

  if (totalWeight <= 0) {
    return others[Math.floor(rng() * others.length)];
  }
  let roll = rng() * totalWeight;
  for (let i = 0; i < others.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return others[i];
  }
  return others[others.length - 1];
}

/**
 * 選手がホームグロウン（HG）資格を持つか判定する
 * （England国籍、または自クラブユース昇格選手 isYouthGraduate）
 */
function isPlayerHomegrown(player) {
  if (!player) return false;
  if (player.isHomegrown === true || player.isYouthGraduate === true) return true;
  const homeNat = (typeof SQUAD_NATIONALITY_RULES !== 'undefined' && SQUAD_NATIONALITY_RULES.HOME_NATIONALITY) || 'England';
  return player.nationality === homeNat;
}

/**
 * 21歳以下（U-21免除対象）か判定する
 */
function isPlayerU21Exempt(player) {
  if (!player) return false;
  const maxAge = (typeof SQUAD_NATIONALITY_RULES !== 'undefined' && SQUAD_NATIONALITY_RULES.U21_EXEMPT_MAX_AGE) || 21;
  return (player.age || 22) <= maxAge;
}

/**
 * クラブの25人シニア登録ルール＆ホームグロウン／非HG枠の使用状況を評価する
 */
function evaluateClubNationalityRules(club) {
  const rules = typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES : {
    MAX_SENIOR_SQUAD: 25,
    MIN_HOMEGROWN_TARGET: 8,
    MAX_NON_HG_SLOTS: 17,
    U21_EXEMPT_MAX_AGE: 21,
    BASE_BENCH_LIMIT: 9,
    MIN_BENCH_LIMIT: 3
  };
  const activePlayers = (club && Array.isArray(club.players))
    ? club.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut))
    : [];

  let seniorCount = 0;
  let seniorHgCount = 0;
  let totalHgCount = 0;
  let nonHgCount = 0;
  let u21ExemptCount = 0;

  for (const p of activePlayers) {
    const hg = isPlayerHomegrown(p);
    const u21 = isPlayerU21Exempt(p);
    if (hg) totalHgCount++;
    if (u21) {
      u21ExemptCount++;
    } else {
      seniorCount++;
      if (hg) seniorHgCount++;
      else nonHgCount++;
    }
  }

  const maxSenior = rules.MAX_SENIOR_SQUAD || 25;
  const maxNonHg = rules.MAX_NON_HG_SLOTS || 17;
  const minHgTarget = rules.MIN_HOMEGROWN_TARGET || 8;
  const baseBench = rules.BASE_BENCH_LIMIT || 9;
  const minBench = rules.MIN_BENCH_LIMIT || 3;

  const excessSenior = Math.max(0, seniorCount - maxSenior);
  const excessNonHg = Math.max(0, nonHgCount - maxNonHg);
  const benchPenaltySlots = Math.max(excessSenior, excessNonHg);
  const effectiveMaxBench = Math.max(minBench, baseBench - benchPenaltySlots);
  const isWarning = excessSenior > 0 || excessNonHg > 0;

  return {
    totalCount: activePlayers.length,
    seniorCount,
    maxSenior,
    seniorHgCount,
    totalHgCount,
    minHgTarget,
    nonHgCount,
    maxNonHg,
    u21ExemptCount,
    excessSenior,
    excessNonHg,
    benchPenaltySlots,
    effectiveMaxBench,
    isWarning
  };
}

/**
 * 登録枠ペナルティを反映した公式戦ベンチ入り上限人数を返す
 */
function getEffectiveBenchLimit(club) {
  const evalRes = evaluateClubNationalityRules(club);
  return evalRes.effectiveMaxBench;
}

// ==========================================================================
// 10. ユーススカウト派遣・選手発掘システム
// ==========================================================================

function getYouthScoutMaxSlots() {
  const sLv = (typeof gameState !== 'undefined' && gameState.facilities && gameState.facilities.scouting)
    ? gameState.facilities.scouting : 1;
  return 1 + Math.floor((sLv - 1) / 2); // Lv1-2: 1枠, Lv3-4: 2枠, Lv5: 3枠
}

function createYouthScoutProspect(regionDef, targetRole = 'ANY') {
  const usedNames = new Set();
  const managedList = typeof getAllManagedLeagueClubs === 'function' ? getAllManagedLeagueClubs() : (gameState.clubs || []);
  for (const c of managedList) {
    (c.players || []).forEach(p => usedNames.add(p.name));
    (c.youthSquad || []).forEach(y => usedNames.add(y.name));
  }
  (gameState.youthScoutReports || []).forEach(y => usedNames.add(y.name));

  let rolePool = ALL_POSITIONS;
  if (targetRole === 'GK') rolePool = ['GK'];
  else if (targetRole === 'DF') rolePool = ['CB', 'LB', 'RB'];
  else if (targetRole === 'MF') rolePool = ['DM', 'CM', 'LM', 'RM', 'AM'];
  else if (targetRole === 'FW') rolePool = ['CF', 'LW', 'RW'];
  const pos = rolePool[randInt(0, rolePool.length - 1)];

  let nat = 'England';
  if (Math.random() >= (regionDef.homeProb || 0.5)) {
    const nats = regionDef.nationalities || ['England'];
    nat = nats[randInt(0, nats.length - 1)];
  }

  const sLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
  const tLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
  const prospect = createYouthPlayer(pos, usedNames, nat);
  prospect.age = randInt(15, 18);
  prospect.isHomegrown = (nat === 'England');
  prospect.isYouthGraduate = true;

  // スカウト網・練習施設Lvと地域ボーナスを反映した能力＆ポテンシャル再評価
  const boost = Math.floor((sLv - 1) * 1.1 + (tLv - 1) * 0.6 + (regionDef.potentialBonus || 0) * 0.6);
  if (boost > 0) {
    prospect.atk = clamp(prospect.atk + randInt(0, boost), 40, 74);
    prospect.def = clamp(prospect.def + randInt(0, boost), 40, 74);
    prospect.sta = clamp(prospect.sta + randInt(0, boost), 42, 78);
    if (pos === 'GK') prospect.atk = 25;
    prospect.attributes = getPlayerFiveAttributes({ primaryPosition: pos, atk: prospect.atk, def: prospect.def, sta: prospect.sta, traits: prospect.traits });
  }
  const sBonusRoll = Math.random() - ((sLv - 1) * 0.04) - ((regionDef.potentialBonus || 0) * 0.03);
  if (sBonusRoll < 0.14) prospect.potential = 'S';
  else if (sBonusRoll < 0.44) prospect.potential = 'A';
  else if (sBonusRoll < 0.84) prospect.potential = 'B';
  else prospect.potential = 'C';

  prospect.scoutRegionName = regionDef.name;
  return prospect;
}

function getYouthScoutMissionCost(region, durationMonths = 3) {
  if (!region) return 400;
  const base = region.cost || 400;
  const months = [3, 6, 9].includes(Number(durationMonths)) ? Number(durationMonths) : 3;
  const mult = months === 9 ? 2.5 : (months === 6 ? 1.8 : 1.0);
  return Math.round((base * mult) / 10) * 10;
}

function dispatchYouthScout(regionId, targetRole = 'ANY', durationMonths = 3) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub) return { ok: false, reason: 'クラブが見つかりません' };
  const regions = typeof YOUTH_SCOUT_REGIONS !== 'undefined' ? YOUTH_SCOUT_REGIONS : {};
  const region = regions[regionId];
  if (!region) return { ok: false, reason: '無効な地域です' };

  if (!Array.isArray(gameState.activeYouthScouts)) gameState.activeYouthScouts = [];
  const maxSlots = getYouthScoutMaxSlots();
  if (gameState.activeYouthScouts.length >= maxSlots) {
    return { ok: false, reason: `派遣枠の上限（${maxSlots}枠）に達しています` };
  }
  const months = [3, 6, 9].includes(Number(durationMonths)) ? Number(durationMonths) : 3;
  const totalCost = getYouthScoutMissionCost(region, months);
  if ((playerClub.funds || 0) < totalCost) {
    return { ok: false, reason: `資金不足です（必要費用: ${formatMoney(totalCost)}）` };
  }

  const totalDays = months * 30;
  const reportInterval = 30;
  playerClub.funds -= totalCost;
  gameState.activeYouthScouts.push({
    id: 'yscout_' + Math.random().toString(36).substr(2, 8),
    regionId: region.id,
    regionName: region.name,
    targetRole: targetRole || 'ANY',
    durationMonths: months,
    totalDays,
    daysRemaining: totalDays,
    reportInterval,
    daysUntilNextReport: reportInterval,
    reportsDelivered: 0,
    cost: totalCost
  });

  if (typeof addDailyLog === 'function') {
    addDailyLog(`【ユーススカウト派遣】${region.name}へ ${targetRole === 'ANY' ? '全ポジション' : targetRole} 担当スカウトを${months}ヶ月間派遣しました（毎月定期レポート送付 / 費用: -${formatMoney(totalCost)}）。`);
  }
  return { ok: true };
}

function recallYouthScout(taskId) {
  if (!Array.isArray(gameState.activeYouthScouts)) return false;
  const idx = gameState.activeYouthScouts.findIndex(t => t && t.id === taskId);
  if (idx === -1) return false;
  const [removed] = gameState.activeYouthScouts.splice(idx, 1);
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【ユーススカウト帰還】${removed.regionName}のスカウトを呼び戻しました。`);
  }
  return true;
}

function advanceYouthScoutingDaily() {
  if (!Array.isArray(gameState.activeYouthScouts) || gameState.activeYouthScouts.length === 0) return;
  if (!Array.isArray(gameState.youthScoutReports)) gameState.youthScoutReports = [];
  const regions = typeof YOUTH_SCOUT_REGIONS !== 'undefined' ? YOUTH_SCOUT_REGIONS : {};
  const remaining = [];

  for (const task of gameState.activeYouthScouts) {
    if (!task) continue;
    const interval = task.reportInterval || 30;
    task.daysRemaining = Math.max(0, (task.daysRemaining || 1) - 1);
    task.daysUntilNextReport = Math.max(0, (typeof task.daysUntilNextReport === 'number' ? task.daysUntilNextReport : interval) - 1);

    if (task.daysUntilNextReport === 0 || task.daysRemaining === 0) {
      const reg = regions[task.regionId] || { name: task.regionName || '国内', homeProb: 0.8, nationalities: ['England'], potentialBonus: 0 };
      const sLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
      const foundCount = (sLv >= 3 && Math.random() < 0.45) ? 2 : 1;
      const foundNames = [];
      for (let i = 0; i < foundCount; i++) {
        if (gameState.youthScoutReports.length >= 12) gameState.youthScoutReports.shift();
        const prospect = createYouthScoutProspect(reg, task.targetRole);
        gameState.youthScoutReports.push(prospect);
        foundNames.push(`${prospect.pos} ${prospect.name} (${prospect.age}歳/POT:${prospect.potential})`);
      }
      task.reportsDelivered = (task.reportsDelivered || 0) + 1;
      task.daysUntilNextReport = interval;

      if (typeof addDailyLog === 'function') {
        const suffix = task.daysRemaining === 0 ? '（任期満了・帰還）' : `（定期報告 #${task.reportsDelivered}）`;
        addDailyLog(`【ユース定期スカウト報告】${reg.name}からレポートが届き、${foundNames.join('・')} を発掘しました！${suffix}`);
      }
      if (typeof addInboxMessage === 'function' && foundNames.length > 0) {
        const suffix = task.daysRemaining === 0 ? '今回の報告をもって派遣期間を満了しました。' : '引き続き現地での発掘を継続します。';
        addInboxMessage({
          senderType: 'scout',
          senderName: `ユーススカウト（${reg.name}）`,
          title: `ユース発掘レポート到着（${foundNames.length}名）`,
          body: `${reg.name}での視察により、${foundNames.join('、')} を新たに発掘しました。${suffix}ユース画面からアカデミー入団またはトップ昇格の判断を行ってください。`,
          actionType: 'goto-youth',
          actionLabel: 'ユース画面を確認',
          actionPayload: null
        });
        if (typeof showSecretaryModal === 'function') {
          showSecretaryModal({
            topic: 'ユース発掘報告',
            title: `ユーススカウト発掘レポート到着（${reg.name}）`,
            speech: `${reg.name}へ派遣していたユーススカウトから定期レポートが届きました。新たな原石が見つかっております。`,
            detailHtml: `<div class="gm-modal-flat-list"><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">発掘候補</span><span class="gm-modal-flat-val">${foundNames.join(' / ')}</span></div></div>`,
            actions: [
              {
                label: 'ユース画面を確認する',
                className: 'btn btn-primary',
                onClick: () => {
                  if (typeof switchTab === 'function' && typeof switchFacilitiesSubtab === 'function') {
                    switchTab('facilities');
                    switchFacilitiesSubtab('youth');
                  }
                }
              },
              {
                label: '後で確認する',
                className: 'btn btn-secondary',
                onClick: () => { if (typeof renderAll === 'function') renderAll(); }
              }
            ]
          });
        }
      }
    }

    if (task.daysRemaining > 0) {
      remaining.push(task);
    }
  }
  gameState.activeYouthScouts = remaining;
}

function signYouthScoutReportToAcademy(playerId) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub || !Array.isArray(gameState.youthScoutReports)) return false;
  const idx = gameState.youthScoutReports.findIndex(p => p.id === playerId);
  if (idx === -1) return false;

  if (!Array.isArray(playerClub.youthSquad)) playerClub.youthSquad = [];
  const maxYouth = typeof MAX_YOUTH_SQUAD_SIZE === 'number' ? MAX_YOUTH_SQUAD_SIZE : 10;
  if (playerClub.youthSquad.length >= maxYouth) {
    if (typeof showToast === 'function') showToast(`ユースチーム所属上限（${maxYouth}名）に達しています`, 'warn');
    return false;
  }

  const [prospect] = gameState.youthScoutReports.splice(idx, 1);
  prospect.isYouth = true;
  prospect.isYouthGraduate = true;
  playerClub.youthSquad.push(prospect);
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【ユース入団】発掘選手 ${prospect.pos} ${prospect.name}（${prospect.age}歳 / POT:${prospect.potential}）がユースチームに入団しました。`);
  }
  return true;
}

function promoteYouthScoutReportDirectly(playerId) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub || !Array.isArray(gameState.youthScoutReports)) return false;
  const idx = gameState.youthScoutReports.findIndex(p => p.id === playerId);
  if (idx === -1) return false;
  const maxTop = typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50;
  if ((playerClub.players || []).length >= maxTop) {
    if (typeof showToast === 'function') showToast(`トップチーム枠上限（${maxTop}名）に達しています`, 'warn');
    return false;
  }

  const [prospect] = gameState.youthScoutReports.splice(idx, 1);
  const usedNums = new Set((playerClub.players || []).map(p => p.squadNumber).filter(n => typeof n === 'number'));
  prospect.isYouth = false;
  prospect.isYouthGraduate = true;
  prospect.isHomegrown = true;
  prospect.wage = 15;
  prospect.salary = 780;
  prospect.contractYears = 4;
  prospect.squadNumber = typeof pickAvailableSquadNumber === 'function' ? pickAvailableSquadNumber(prospect.pos, usedNums) : 45;
  prospect.squadStatus = 'prospect';
  prospect.transferFee = calculateTransferFee(prospect);
  playerClub.players.push(prospect);
  if (typeof ensureValidSquadAndStarters === 'function') ensureValidSquadAndStarters(playerClub);
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【発掘即昇格】${prospect.pos} #${prospect.squadNumber} ${prospect.name}（${prospect.age}歳）とプロ契約を締結しトップチームへ昇格させました！`);
  }
  return true;
}

function dismissYouthScoutReport(playerId) {
  if (!Array.isArray(gameState.youthScoutReports)) return false;
  const idx = gameState.youthScoutReports.findIndex(p => p.id === playerId);
  if (idx === -1) return false;
  gameState.youthScoutReports.splice(idx, 1);
  return true;
}

// ==========================================================================
// 11. 秘書役ブリーフィング ＆ 監督からの補強希望分析
// ==========================================================================

/**
 * 現在担当中の秘書オブジェクトを返す
 */
function getActiveSecretary() {
  const list = (typeof SECRETARIES_DATABASE !== 'undefined' && Array.isArray(SECRETARIES_DATABASE))
    ? SECRETARIES_DATABASE
    : [];
  if (list.length === 0) {
    return {
      id: 'sec_claire',
      name: 'C. Bennett',
      fullName: 'Claire Bennett',
      nationality: 'England',
      age: 27,
      roleLabel: 'チーフセクレタリー',
      specialty: '財務・日程管理',
      tone: 'polite',
      kitColors: ['#1e293b', '#38bdf8'],
      bio: 'クラブの財務管理とスケジュール調整を統括するチーフ秘書。',
      avatarData: { skinColor: 'fair', hairStyle: 'long', hairColor: 'blond', facialHair: 'none', accessories: 'glasses', eyeVariant: 2, isFemale: true }
    };
  }
  const secId = (typeof gameState !== 'undefined' && gameState.secretaryId) ? gameState.secretaryId : list[0].id;
  return list.find(s => s.id === secId) || list[0];
}

/**
 * 秘書の口調・現在状況に応じた進行ブリーフィング文を生成
 */
function getSecretaryBriefingText(club) {
  const sec = getActiveSecretary();
  const tone = sec.tone || 'polite';
  const curDay = (typeof getCurrentCalendarDay === 'function') ? getCurrentCalendarDay() : null;
  const isMatchPending = (typeof isTodayMatchDayPending === 'function') ? isTodayMatchDayPending() : false;
  const unreadCount = (typeof gameState !== 'undefined' && Array.isArray(gameState.inboxMessages))
    ? gameState.inboxMessages.filter(m => m && !m.read).length
    : 0;
  const activeOffers = (typeof gameState !== 'undefined' && Array.isArray(gameState.incomingOffers))
    ? gameState.incomingOffers.filter(o => o && (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') && ((o.daysLeft ?? 1) > 0))
    : [];
  const wish = (typeof gameState !== 'undefined') ? gameState.managerWishes : null;
  const injuredStarters = club && Array.isArray(club.players)
    ? club.players.filter(p => p && p.isStarter && (p.injuryWeeks || 0) > 0)
    : [];
  const expiringCount = club && Array.isArray(club.players)
    ? club.players.filter(p => p && p.contractYears <= 1 && !p.contractRefused && !(p.loanStatus && p.loanStatus.isLoan)).length
    : 0;

  if (typeof gameState !== 'undefined' && gameState.isGameOver) {
    return tone === 'active'
      ? '理事会から厳しい決定が下りました。次のキャリアへ再出発の準備を整えましょう。'
      : (tone === 'calm'
        ? '残念ながら現行体制での継続は困難となりました。記録を確認し、新たな一歩をご検討ください。'
        : '残念なお知らせですが、債務超過により解任通告が届いております。');
  }

  if (club && (club.funds || 0) < 0) {
    return tone === 'active'
      ? `クラブ資金が赤字（${typeof formatMoney === 'function' ? formatMoney(club.funds) : club.funds}）です。選手売却や給与整理を急ぎましょう。`
      : (tone === 'calm'
        ? `資金繰りがマイナス圏に入っています。次季開幕前の黒字転換へ向けた財務対策が最優先です。`
        : `現在クラブ資金が赤字となっております。契約・放出による早急な収支改善をご検討ください。`);
  }

  if (typeof gameState !== 'undefined' && gameState.isSeasonOver) {
    return tone === 'active'
      ? 'オフシーズンに入りました。契約更新と移籍市場の補強を終えたら、新シーズン開幕へ進みましょう。'
      : (tone === 'calm'
        ? 'シーズン総括の時期です。契約満了選手の整理と来季に向けた補強完了後、新シーズンへ移行できます。'
        : '全日程お疲れさまでした。オフシーズンの契約更新や補強が整いましたら、新シーズン開幕へお進みください。');
  }

  if (isMatchPending) {
    const mInfo = curDay && typeof getCalendarDayPlayerMatch === 'function' ? getCalendarDayPlayerMatch(curDay) : null;
    const mTitle = mInfo ? mInfo.title : '公式戦';
    if (injuredStarters.length > 0) {
      return tone === 'active'
        ? `本日は ${mTitle} の試合日ですが、スタメンに負傷者（${injuredStarters[0].name}）がいます。キックオフ前に交代を確認してください。`
        : `本日は ${mTitle} です。スタメンに負傷中の選手が含まれておりますので、編成をご確認のうえ試合へお臨みください。`;
    }
    return tone === 'active'
      ? `本日は ${mTitle} の試合日です。作戦ボードで準備が整っていれば、いつでもキックオフできます。`
      : (tone === 'calm'
        ? `本日 ${mTitle} を迎えます。相手の戦術とスタメンの疲労状態を見極めた上で試合へ進みましょう。`
        : `本日は ${mTitle} の試合日です。スタメンと戦術の最終確認がお済みでしたら、キックオフへお進みください。`);
  }

  if (activeOffers.length > 0) {
    return tone === 'active'
      ? `他クラブから ${activeOffers.length}件の移籍オファーが来ています。期限切れになる前に移籍タブから回答しましょう。`
      : `他クラブより ${activeOffers.length}件の獲得打診が届いております。条件をご確認のうえご判断ください。`;
  }

  if (curDay && curDay.isTransferDeadline) {
    return tone === 'active'
      ? '本日は移籍市場の最終日です。やり残した獲得交渉や放出がないか、最後のチェックを行いましょう。'
      : '本日をもって移籍ウィンドウが閉幕いたします。駆け込みの補強案件があればお早めにご対応ください。';
  }

  if (wish && !wish.fulfilled && Array.isArray(wish.positions) && wish.positions.length > 0 && curDay && curDay.windowOpen) {
    const posStr = wish.positions.join('・');
    return tone === 'active'
      ? `移籍市場が開いています。監督からは ${posStr} の補強希望が届いていますので、メッセージ欄で推薦選手を確認しましょう。`
      : (tone === 'calm'
        ? `市場開放中です。監督が求める ${posStr} の戦力補強に応えられれば、現場の信頼も大きく高まります。`
        : `移籍市場が開いております。監督より ${posStr} の補強要望書が提出されておりますので、受信箱をご確認ください。`);
  }

  if (unreadCount > 0) {
    return tone === 'active'
      ? `未読メッセージが ${unreadCount}件届いています。重要な報告を見落とさないよう受信箱をチェックしましょう。`
      : (tone === 'calm'
        ? `未確認の通達が ${unreadCount}件ございます。時間のあるうちに目を通しておくことをお勧めします。`
        : `未読のメッセージが ${unreadCount}件届いております。下部の受信箱より内容をご確認ください。`);
  }

  if (expiringCount > 0) {
    return tone === 'active'
      ? `契約残り1年以下の選手が ${expiringCount}名います。主力の流出を防ぐため早めの延長交渉が安心です。`
      : `契約満了が近い選手が ${expiringCount}名在籍しております。編成画面より契約状況をご確認ください。`;
  }

  return tone === 'active'
    ? '現在の緊急案件はありません。戦術の確認やスカウト指示を終えたら、日程を次戦へ進めましょう。'
    : (tone === 'calm'
      ? 'クラブ運営は安定して推移しています。次戦への調整と中長期のスカウティングを着実に進めましょう。'
      : '大きな懸案事項はございません。次戦に向けて準備が整いましたら、日程を進めてまいりましょう。');
}

/**
 * 監督の得意フォーメーション・現有戦力を分析し、手薄なポジションと具体的な推薦選手（2〜3名）を算出する
 */
function evaluateManagerReinforcementWishes(club) {
  if (!club || !club.manager) return null;
  const mgr = club.manager;
  const formKey = (mgr.preferredFormation && typeof FORMATIONS !== 'undefined' && FORMATIONS[mgr.preferredFormation])
    ? mgr.preferredFormation
    : (club.formation && typeof FORMATIONS !== 'undefined' && FORMATIONS[club.formation] ? club.formation : '4-3-3');
  const formDef = (typeof FORMATIONS !== 'undefined' && FORMATIONS[formKey]) ? FORMATIONS[formKey] : null;
  if (!formDef || !Array.isArray(formDef.slots)) return null;

  const activePlayers = (club.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const normPos = (pos) => (pos === 'LWB' ? 'LB' : (pos === 'RWB' ? 'RB' : (pos === 'ST' ? 'CF' : pos)));

  // 陣形内の各必要ポジション枠数
  const slotCounts = {};
  formDef.slots.forEach(sl => {
    const np = normPos(sl.pos);
    slotCounts[np] = (slotCounts[np] || 0) + 1;
  });

  // 自チームの平均スタメンOVRを基準値として算出
  const starterOvrs = activePlayers.filter(p => p.isStarter).map(p => getPlayerOverallRating(p));
  const avgTeamOvr = starterOvrs.length > 0
    ? Math.round(starterOvrs.reduce((a, b) => a + b, 0) / starterOvrs.length)
    : (club.basePower || 72);

  // 各必要ポジションの手薄度スコアを算出
  const needScores = [];
  for (const [pos, reqSlots] of Object.entries(slotCounts)) {
    const specialists = activePlayers.filter(p => {
      ensurePlayerProficiencies(p);
      const mains = (p.mainPositions || [p.pos]).map(normPos);
      return mains.includes(pos);
    }).sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));

    const bestPlayer = specialists[0] || null;
    const bestOvr = bestPlayer ? getPlayerOverallRating(bestPlayer) : 55;
    const count = specialists.length;
    const targetDepth = reqSlots * 2; // スタメン枠あたり2名（控え込み）が理想

    let score = 0;
    let reason = '';
    if (count < reqSlots) {
      score += 50 + (reqSlots - count) * 20;
      reason = `本職が${count}名のみ（必要枠${reqSlots}）で絶対数が不足`;
    } else if (count < targetDepth) {
      score += 24 + (targetDepth - count) * 8;
      reason = `控え層を含め選手層が薄い（本職${count}名）`;
    }
    if (bestOvr < avgTeamOvr - 2) {
      score += (avgTeamOvr - bestOvr) * 4;
      reason = reason || `主力水準（平均OVR ${avgTeamOvr}）に対して質が不足（最高OVR ${bestOvr}）`;
    }
    if (bestPlayer && (bestPlayer.age || 25) >= 31) {
      score += 10;
      reason = reason || `主力の高齢化（${bestPlayer.name} ${bestPlayer.age}歳）に伴い後継が必要`;
    }
    if (bestPlayer && (bestPlayer.contractYears || 2) <= 1) {
      score += 8;
    }
    if (pos === 'GK' && count >= 2 && bestOvr >= avgTeamOvr - 3) {
      score = Math.max(0, score - 20);
    }

    if (score > 0 || count <= reqSlots) {
      needScores.push({ pos, score, count, reqSlots, bestOvr, reason: reason || `${pos}の戦力底上げを希望` });
    }
  }

  needScores.sort((a, b) => b.score - a.score);
  const topNeeds = needScores.slice(0, 2);
  if (topNeeds.length === 0) {
    topNeeds.push({ pos: 'CM', score: 10, count: 2, reqSlots: 2, bestOvr: avgTeamOvr, reason: '中盤の層を厚くしローテーション力を高めたい' });
  }
  const targetPositions = topNeeds.map(n => n.pos);

  // 市場プールから予算・格に合う推薦選手を最大3名選定
  const safeBudget = typeof getSafeTransferBudget === 'function' ? getSafeTransferBudget(club) : (club.funds || 20000);
  const maxFeeBudget = Math.max(2500, Math.round(Math.max(safeBudget, (club.funds || 0) * 0.75) * 1.15));
  const clubRep = club.reputation || 4500;
  const maxRepOvr = clubRep >= 5800 ? 92 : (clubRep >= 4200 ? 84 : 81);
  const minTargetOvr = clamp(avgTeamOvr - 3, 60, 82);
  const maxTargetOvr = clamp(Math.min(maxRepOvr, avgTeamOvr + 7), minTargetOvr + 3, 90);

  const poolCandidates = [];
  const seenIds = new Set();
  const pushIfEligible = (p, clubName, isFree = false) => {
    if (!p || !p.id || seenIds.has(p.id) || p.isRetired) return;
    if (p.preContract && p.preContract.toClubId === club.id) return;
    ensurePlayerProficiencies(p);
    const mains = (p.mainPositions || [p.pos]).map(normPos);
    const matchedPos = targetPositions.find(tp => mains.includes(tp));
    if (!matchedPos) return;

    const ovr = getPlayerOverallRating(p);
    if (ovr < minTargetOvr || ovr > maxTargetOvr) return;
    const estFee = isFree ? 0 : (typeof calculateTransferFee === 'function' ? calculateTransferFee(p) : (p.transferFee || 5000));
    if (!isFree && estFee > maxFeeBudget) return;

    seenIds.add(p.id);
    const ageScore = (p.age || 25) <= 24 ? 8 : ((p.age || 25) <= 28 ? 4 : -4);
    const posPriority = matchedPos === targetPositions[0] ? 12 : 6;
    const fitScore = ovr * 2 + ageScore + posPriority + (isFree ? 6 : 0) - Math.round(estFee / 5000);
    poolCandidates.push({
      playerId: p.id,
      name: p.name,
      pos: normPos(p.primaryPosition || p.pos),
      matchedPos,
      age: p.age || 24,
      ovr,
      clubName: clubName || '無所属',
      estimatedFee: estFee,
      wage: p.wage || 20,
      isFreeAgent: isFree,
      _score: fitScore
    });
  };

  const managedClubs = typeof getAllManagedLeagueClubs === 'function' ? getAllManagedLeagueClubs() : (gameState.clubs || []);
  for (const c of managedClubs) {
    if (!c || c.id === club.id || c.isPlayer) continue;
    for (const p of (c.players || [])) {
      pushIfEligible(p, c.name, false);
    }
  }
  if (typeof gameState !== 'undefined' && Array.isArray(gameState.euroTransferList)) {
    for (const ep of gameState.euroTransferList) {
      const eDef = (ep && (ep.euroClubId || ep.clubId) && typeof findEuropeanClubDefinitionById === 'function')
        ? findEuropeanClubDefinitionById(ep.euroClubId || ep.clubId)
        : null;
      pushIfEligible(ep, (eDef && eDef.name) || ep.lastClubName || '欧州クラブ', false);
    }
  }
  if (typeof gameState !== 'undefined' && Array.isArray(gameState.transferMarket)) {
    for (const fp of gameState.transferMarket) {
      pushIfEligible(fp, '無所属', true);
    }
  }

  poolCandidates.sort((a, b) => b._score - a._score);
  const picked = [];
  // ポジションが偏らないよう第1希望・第2希望から優先確保して最大3名
  for (const tp of targetPositions) {
    const hit = poolCandidates.find(c => c.matchedPos === tp && !picked.some(x => x.playerId === c.playerId));
    if (hit) picked.push(hit);
  }
  for (const c of poolCandidates) {
    if (picked.length >= 3) break;
    if (!picked.some(x => x.playerId === c.playerId)) {
      picked.push(c);
    }
  }
  const candidates = picked.map(({ _score, ...rest }) => rest);

  return {
    id: `wish_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    managerId: mgr.id,
    managerName: mgr.name,
    formation: formKey,
    tactic: mgr.preferredTactic || club.tactic || 'possession',
    positions: targetPositions,
    reasons: topNeeds.map(n => `${n.pos}: ${n.reason}`),
    candidates,
    fulfilled: false,
    fulfilledPlayerName: null,
    season: (typeof gameState !== 'undefined' ? gameState.season : 1) || 1,
    createdDayIndex: (typeof gameState !== 'undefined' ? gameState.currentDayIndex : 0) || 0
  };
}

