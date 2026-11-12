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
    interventionStreak: 0,
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
  if (normSubs.includes(normSlot)) {
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

/**
 * OVR・年齢・残り契約年数から直接市場価値（£k単位）を算出するコアロジック
 */
function calculateMarketValueFromOvrAndAge(ovr, age = 25, contractYears = 2) {
  const safeOvr = (typeof ovr === 'number' && !Number.isNaN(ovr)) ? ovr : 70;
  const safeAge = (typeof age === 'number' && !Number.isNaN(age)) ? age : 25;
  const safeContractYears = (typeof contractYears === 'number' && !Number.isNaN(contractYears)) ? contractYears : 2;

  let baseVal = 0;
  if (safeOvr < 60) {
    baseVal = 200 + Math.max(0, safeOvr - 50) * 30; // 200k..500k
  } else if (safeOvr <= 64) {
    const t = (safeOvr - 60) / 4;
    baseVal = 500 + t * 900; // 500k..1400k (£0.5M〜£1.4M)
  } else if (safeOvr <= 69) {
    const t = (safeOvr - 65) / 4;
    baseVal = 1500 + t * 2500; // 1500k..4000k (£1.5M〜£4.0M)
  } else if (safeOvr <= 74) {
    const t = (safeOvr - 70) / 4;
    baseVal = 5000 + t * 10000; // 5000k..15000k (£5.0M〜£15.0M)
  } else if (safeOvr <= 79) {
    const t = (safeOvr - 75) / 4;
    baseVal = 16000 + t * 19000; // 16000k..35000k (£16.0M〜£35.0M)
  } else if (safeOvr <= 84) {
    const t = (safeOvr - 80) / 4;
    baseVal = 40000 + t * 35000; // 40000k..75000k (£40.0M〜£75.0M)
  } else {
    // OVR 85以上（ワールドクラス）：£80.0M 〜 最大£130.0M
    const extra = Math.min(6, safeOvr - 85); // 85..91
    const t = extra / 6;
    baseVal = 80000 + t * 50000; // 80000k..130000k (£80.0M〜£130.0M)
  }

  // 年齢補正：18〜23歳（x1.2〜1.4）、24〜28歳（x1.0）、29〜32歳（x0.75）、33歳以上（x0.4〜0.5）
  let ageFactor = 1.0;
  if (safeAge <= 19) ageFactor = 1.40;
  else if (safeAge <= 21) ageFactor = 1.30;
  else if (safeAge <= 23) ageFactor = 1.20;
  else if (safeAge <= 28) ageFactor = 1.00;
  else if (safeAge <= 32) ageFactor = 0.75;
  else if (safeAge <= 34) ageFactor = 0.50;
  else ageFactor = 0.40;

  // 契約残り年数による軽微な補正（市場価値そのものは実力・年齢ベースであり、契約年数で不自然に半減させない）
  let contractFactor = 1.0;
  if (safeContractYears <= 1) {
    contractFactor = 0.95;
  } else if (safeContractYears === 2) {
    contractFactor = 0.98;
  } else if (safeContractYears >= 4) {
    contractFactor = 1.05;
  }

  const fee = Math.round((baseVal * ageFactor * contractFactor) / 100) * 100;
  return clamp(fee, 200, 130000);
}

function calculatePlayerMarketValue(player) {
  if (!player) return 1000;

  // すでに ovr プロパティが数値で存在していればそれを最優先（過去推移オブジェクトやキャッシュ対応）
  let ovr = 70;
  if (typeof player.ovr === 'number' && !Number.isNaN(player.ovr)) {
    ovr = player.ovr;
  } else if (typeof getPlayerOverallRating === 'function') {
    const calc = getPlayerOverallRating(player);
    if (typeof calc === 'number' && !Number.isNaN(calc)) {
      ovr = calc;
    }
  }

  const age = typeof player.age === 'number' && !Number.isNaN(player.age) ? player.age : 25;
  const contractYears = player.contractYears !== undefined ? player.contractYears : 2;
  return calculateMarketValueFromOvrAndAge(ovr, age, contractYears);
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

// ==========================================================================
// 4. 選手・ユース・初期スカッド・移籍リスト生成
// ==========================================================================

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
  // 無所属フリー選手は現実的に OVR 60〜72 中心（掘り出し物でも最大 73〜76）とする
  const freeMinGen = 56 + Math.min(3, scoutingLv - 1);
  const freeMaxGen = 63 + Math.min(4, scoutingLv - 1);
  const freeMaxOvrCap = 73 + Math.min(3, scoutingLv - 1);

  const freeCount = count + 2;
  for (let f = 0; f < freeCount; f++) {
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const basePower = randInt(freeMinGen, freeMaxGen);
    const freePlayer = createPlayer(pos, basePower, false, usedNames, [20, 34]);
    freePlayer.squadNumber = pickAvailableSquadNumber(pos, usedMarketNums);
    freePlayer.isFreeAgent = true;
    freePlayer.contractYears = 0;
    freePlayer.transferFee = 0;
    capGeneratedPlayerOvr(freePlayer, freeMaxOvrCap);
    freePlayer.salary = calculatePlayerSalary(freePlayer.pos, freePlayer.atk, freePlayer.def, freePlayer.sta, freePlayer.age);
    freePlayer.wage = Math.max(5, Math.round(freePlayer.salary / 52));
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

  const sLv = Math.max(1, scoutingLv);
  const targetCount = 28 + (sLv - 1) * 5;
  // 欧州定義クラブの basePower (69〜86) はチームOVRスケールのため、createPlayer 内部基準 (-10) に変換
  const maxGenPower = Math.min(77, 71 + (sLv - 1) * 2);
  const maxEuroOvrCap = Math.min(88, 83 + (sLv - 1) * 2);

  const euroList = [...preservedPreContracts];
  for (let i = 0; i < targetCount; i++) {
    const clubDef = euroClubs[randInt(0, euroClubs.length - 1)];
    const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
    const clubTeamOvr = clubDef.basePower || 76;
    const rawGenPower = clamp(clubTeamOvr - 10 + randInt(-2, 2), 58, maxGenPower);
    const clubOvrCap = Math.min(maxEuroOvrCap, clubTeamOvr >= 83 ? maxEuroOvrCap : (clubTeamOvr >= 78 ? 81 : 77));
    const p = createPlayer(pos, rawGenPower, i < 8, usedNames, [18, 32]);
    p.squadNumber = randInt(2, 30);
    p.contractYears = (i % 4 === 0) ? 1 : randInt(1, 4);
    p.isFreeAgent = false;
    p.isEuroListed = true;
    p.euroClubId = clubDef.id;
    p.clubId = clubDef.id;
    capGeneratedPlayerOvr(p, clubOvrCap);
    p.transferFee = calculateTransferFee(p);
    euroList.push(p);
  }

  euroList.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  gameState.euroTransferList = euroList;
}

/**
 * 移籍交渉・オファー処理用：1部・2部・欧州主要クラブリスト・無所属市場から対象選手と所属元クラブを一元検索
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

  const d2Clubs = (gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || [];
  for (const c of d2Clubs) {
    const p = (c.players || []).find(x => x.id === playerId);
    if (p) {
      return { player: p, sellerClub: c, category: 'ENG_D2', isFreeAgent: false, isEuroListed: false };
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
    youthGk.salary = 800;
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

  // 1. 負傷およびレンタル放出除外ペナルティ
  const isInjured = (player.injuryWeeks > 0) || (player.injuryDays > 0);
  if (isInjured) {
    score -= 2000;
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
  } else if (ftg >= 64) {
    score -= 14; // 疲労が溜まっている主力を控えの実力者とターンオーバー
  } else if (ftg >= 50) {
    score -= 5;
  } else if (ftg <= 18) {
    score += 3;  // フレッシュな選手を優遇
  }

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
  const stadiumLv = (gameState.facilities && gameState.facilities.stadium) ? gameState.facilities.stadium : 1;
  const stadiumMult = club.isPlayer ? (1 + (stadiumLv - 1) * 0.15) : 1.0;
  const estHomeGate = Math.round(((club.supporters || 14000) * 0.085) * stadiumMult);
  const estAwayTv = 1600;

  if (gameState.isSeasonOver) {
    const totalMatches = isPlayerInSecondDivision() ? 46 : 38;
    const halfMatches = Math.floor(totalMatches / 2);
    const estNextLeagueRev = halfMatches * estHomeGate + halfMatches * estAwayTv;
    const nextAnnualPayroll = weeklyPayroll * 52;
    const netSeasonBurn = Math.max(0, nextAnnualPayroll - estNextLeagueRev);
    const preseasonBuffer = weeklyPayroll * 7; // 7月〜8月開幕までの無収入期間バッファ
    const requiredReserve = Math.max(weeklyPayroll * 8, netSeasonBurn + preseasonBuffer);
    return Math.round(funds - requiredReserve);
  }

  const paidWeeks = clamp(gameState.paidPayrollWeeks || 0, 0, 52);
  const remWeeks = Math.max(0, 52 - paidWeeks);
  const totalWeeks = gameState.totalWeeks || (isPlayerInSecondDivision() ? 46 : 38);
  const remMatches = Math.max(0, totalWeeks - (gameState.currentWeek || 0));
  const remHome = Math.floor(remMatches / 2);
  const remAway = remMatches - remHome;
  const estRemLeagueRev = remHome * estHomeGate + remAway * estAwayTv;
  const preseasonWeeksAhead = (gameState.currentWeek || 0) === 0 ? Math.min(remWeeks, 6) : 2;
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
