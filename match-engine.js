'use strict';

/**
 * match-engine.js - 試合計算エンジン・採点・大会別スタッツ集計・2Dライブマッチ演出・試合前後モーダル
 */

/**
 * クイック試合・カップ戦用のシュート数＆枠内シュート数を整合性保証付きで算出（必ず スコア <= 枠内 <= 総シュート）
 */
function buildQuickMatchShotStats(homeScore, awayScore, simRes = null) {
  const rawHShots = (simRes && typeof simRes.homeShots === 'number')
    ? simRes.homeShots
    : (homeScore * 3 + Math.floor(Math.random() * 5 + 3));
  const rawAShots = (simRes && typeof simRes.awayShots === 'number')
    ? simRes.awayShots
    : (awayScore * 3 + Math.floor(Math.random() * 5 + 3));

  const homeShots = Math.max(homeScore, rawHShots);
  const awayShots = Math.max(awayScore, rawAShots);

  const rawHOnTarget = (simRes && typeof simRes.homeOnTarget === 'number')
    ? simRes.homeOnTarget
    : Math.round(homeShots * 0.45);
  const rawAOnTarget = (simRes && typeof simRes.awayOnTarget === 'number')
    ? simRes.awayOnTarget
    : Math.round(awayShots * 0.45);

  const homeOnTarget = Math.max(homeScore, Math.min(homeShots, rawHOnTarget));
  const awayOnTarget = Math.max(awayScore, Math.min(awayShots, rawAOnTarget));

  return { homeShots, awayShots, homeOnTarget, awayOnTarget };
}

/**
 * 大会別個人スタッツ（gameState.competitionStats[compKey]）を取得・初期化
 */
function ensureCompetitionStatsBucket(compKey) {
  if (!compKey) return null;
  if (!gameState.competitionStats || typeof gameState.competitionStats !== 'object') {
    gameState.competitionStats = {};
  }
  if (!gameState.competitionStats[compKey] || typeof gameState.competitionStats[compKey] !== 'object') {
    gameState.competitionStats[compKey] = {};
  }
  return gameState.competitionStats[compKey];
}

/**
 * 公式戦出場数（+1）および自クラブ選手のポジション特訓進捗（+15%・習得判定）を一括反映
 */
function applyOfficialAppearancesAndTraining(club, starters = [], playedSubs = [], options = {}) {
  const { recordOfficial = true, applyTraining = true } = options;
  if (!club) return;

  const advancePosTraining = (p) => {
    if (!applyTraining || !club.isPlayer || !p || !p.positionTraining || !p.positionTraining.active || !p.positionTraining.targetPos) return;
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
        addDailyLog(`【適性習得報告】実戦経験を経て、#${p.squadNumber || '-'} ${p.name} が [${tPos}] を本職水準で完全にモノにしました。`);
      } else {
        if (!p.secondaryPositions.includes(tPos)) p.secondaryPositions.push(tPos);
        addDailyLog(`【適性習得報告】#${p.squadNumber || '-'} ${p.name} が実戦を通じて [${tPos}] でのプレー感覚を掴み、サブポジションとして起用可能な水準に達しました。`);
      }
      p.positionTraining = null;
    }
  };

  const bumpApps = (p) => {
    if (!recordOfficial || !p) return;
    p.appearances = (p.appearances || 0) + 1;
    if (typeof p.assists !== 'number') p.assists = 0;
    if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
    if (typeof p.careerStats.assists !== 'number') p.careerStats.assists = 0;
    p.careerStats.appearances = (p.careerStats.appearances || 0) + 1;
  };

  (starters || []).forEach(p => {
    bumpApps(p);
    advancePosTraining(p);
  });
  (playedSubs || []).forEach(p => bumpApps(p));
}
/**
 * カップ戦・欧州戦・2部背景進行用のスコアラー＆アシスター自動選定
 */
function generateScorersForQuickMatch(homeClub, awayClub, homeScore, awayScore, options = {}) {
  const { recordOfficial = true } = options;
  const homeStarters = ensureClubStartersForMatch(homeClub);
  const awayStarters = ensureClubStartersForMatch(awayClub);

  const pickScorer = (starters) => {
    const fwMf = starters.filter(p => ['CF', 'LW', 'RW', 'ST', 'AM', 'CM', 'LM', 'RM'].includes(p.assignedPos || p.pos));
    const pool = fwMf.length > 0 ? fwMf : starters.slice(1);
    return pool[Math.floor(Math.random() * pool.length)] || starters[0];
  };

  const pickAssister = (starters, scorer) => {
    if (Math.random() > 0.72) return null;
    const cands = starters.filter(p => p && (!scorer || p.id !== scorer.id) && (p.assignedPos || p.pos) !== 'GK');
    if (cands.length === 0) return null;
    const mfWg = cands.filter(p => ['AM', 'CM', 'LM', 'RM', 'DM', 'LW', 'RW', 'LB', 'RB', 'LWB', 'RWB'].includes(p.assignedPos || p.pos));
    const pool = mfWg.length > 0 && Math.random() < 0.8 ? mfWg : cands;
    return pool[Math.floor(Math.random() * pool.length)] || null;
  };

  const applyGoalAndAssist = (p, assister) => {
    if (!recordOfficial) return;
    if (p) {
      p.goals = (p.goals || 0) + 1;
      if (!p.careerStats) p.careerStats = { appearances: p.appearances || 0, goals: 0, assists: p.assists || 0 };
      p.careerStats.goals = (p.careerStats.goals || 0) + 1;
    }
    if (assister) {
      assister.assists = (assister.assists || 0) + 1;
      if (!assister.careerStats) assister.careerStats = { appearances: assister.appearances || 0, goals: assister.goals || 0, assists: 0 };
      assister.careerStats.assists = (assister.careerStats.assists || 0) + 1;
    }
  };

  const homeScorers = [];
  for (let i = 0; i < homeScore; i++) {
    const p = pickScorer(homeStarters);
    const assister = pickAssister(homeStarters, p);
    const minute = Math.floor(Math.random() * 88) + 2;
    applyGoalAndAssist(p, assister);
    if (p) homeScorers.push({ minute, scorer: p, assister, name: p.name });
  }

  const awayScorers = [];
  for (let i = 0; i < awayScore; i++) {
    const p = pickScorer(awayStarters);
    const assister = pickAssister(awayStarters, p);
    const minute = Math.floor(Math.random() * 88) + 2;
    applyGoalAndAssist(p, assister);
    if (p) awayScorers.push({ minute, scorer: p, assister, name: p.name });
  }

  homeScorers.sort((a, b) => a.minute - b.minute);
  awayScorers.sort((a, b) => a.minute - b.minute);
  return { homeScorers, awayScorers };
}

/**
 * 1試合分の選手スタッツを指定大会（compKey）の個人スタッツ台帳へ記録する
 */
function recordCompetitionPlayerMatchStats(compKey, homeClub, awayClub, homeStarters, awayStarters, homeSubs, awaySubs, homeScore, awayScore, homeScorers, awayScorers, ratingRes, cardsMap = null) {
  const bucket = ensureCompetitionStatsBucket(compKey);
  if (!bucket) return;

  const DEFENDER_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'];
  const isDefOrGk = (p) => {
    const pos = p.assignedPos || p.primaryPosition || p.preferredPosition || p.pos;
    return DEFENDER_POSITIONS.includes(pos) || POS_ROLE_GROUP[pos] === 'GK' || POS_ROLE_GROUP[pos] === 'DF';
  };

  const getOrCreateEntry = (p, club) => {
    const pid = p.id;
    if (!bucket[pid]) {
      bucket[pid] = {
        id: pid,
        name: p.name,
        fullName: p.fullName || p.name,
        nationality: p.nationality || null,
        pos: p.primaryPosition || p.preferredPosition || p.pos || 'MF',
        squadNumber: p.squadNumber || null,
        clubId: club ? club.id : null,
        clubName: club ? club.name : '不明',
        isPlayerClub: Boolean(club && club.isPlayer),
        apps: 0,
        goals: 0,
        assists: 0,
        totalRating: 0,
        cleanSheets: 0,
        momCount: 0,
        yellowCards: 0,
        redCards: 0
      };
    } else if (club) {
      bucket[pid].clubId = club.id;
      bucket[pid].clubName = club.name;
      bucket[pid].isPlayerClub = Boolean(club.isPlayer);
      bucket[pid].name = p.name || bucket[pid].name;
      if (p.fullName) bucket[pid].fullName = p.fullName;
      if (p.nationality) bucket[pid].nationality = p.nationality;
    }
    return bucket[pid];
  };

  const recordSide = (club, starters, subs, conceded, scorers) => {
    const allPlayed = [...(starters || []).map(p => ({ p, isStarter: true })), ...(subs || []).map(p => ({ p, isStarter: false }))];
    allPlayed.forEach(({ p, isStarter }) => {
      if (!p || !p.id) return;
      const entry = getOrCreateEntry(p, club);
      entry.apps += 1;
      const rat = typeof p.lastMatchRating === 'number' ? p.lastMatchRating : (isStarter ? 6.7 : 6.6);
      entry.totalRating = Number((entry.totalRating + rat).toFixed(2));
      if (isStarter && conceded === 0 && isDefOrGk(p)) entry.cleanSheets += 1;
      if (ratingRes && ratingRes.momPlayer && ratingRes.momPlayer.id === p.id) entry.momCount += 1;
      if (cardsMap && cardsMap[p.id]) {
        entry.yellowCards += cardsMap[p.id].yellow || 0;
        entry.redCards += cardsMap[p.id].red || 0;
      }
    });
    (scorers || []).forEach(s => {
      if (s && s.scorer && s.scorer.id) getOrCreateEntry(s.scorer, club).goals += 1;
      if (s && s.assister && s.assister.id) getOrCreateEntry(s.assister, club).assists += 1;
    });
  };

  recordSide(homeClub, homeStarters, homeSubs, awayScore, homeScorers);
  recordSide(awayClub, awayStarters, awaySubs, homeScore, awayScorers);
}

/**
 * クイックシミュレーション試合の選手個人スタッツ一括算出＆大会記録
 */
function simulateAndRecordQuickMatchPlayerStats(compKey, homeClub, awayClub, homeScore, awayScore, options = {}) {
  const { recordOfficial = true, applyTraining = false } = options;
  if (!homeClub || !awayClub) {
    return { homeScorers: [], awayScorers: [], momPlayer: null, momClub: homeClub, momRating: '7.5' };
  }

  const compCat = typeof resolveDisciplineCategory === 'function' ? resolveDisciplineCategory(compKey || 'd1') : 'league';
  const preSuspendedIds = new Set();
  if (recordOfficial) {
    [homeClub, awayClub].forEach(c => {
      if (c && Array.isArray(c.players)) {
        c.players.forEach(p => {
          if (typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, compCat)) {
            preSuspendedIds.add(p.id);
          }
        });
      }
    });
  }

  const homeStarters = ensureClubStartersForMatch(homeClub);
  const awayStarters = ensureClubStartersForMatch(awayClub);
  const homeBench = (homeClub.players || []).filter(p => !p.isStarter && !p.isRetired && !(typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, compCat)));
  const awayBench = (awayClub.players || []).filter(p => !p.isStarter && !p.isRetired && !(typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, compCat)));
  const homeSubRes = typeof executeAutoSubstitutions === 'function' ? executeAutoSubstitutions(homeClub, homeStarters, homeBench, 62, homeScore - awayScore, homeClub.subPolicy, 0) : { subsIn: [] };
  const awaySubRes = typeof executeAutoSubstitutions === 'function' ? executeAutoSubstitutions(awayClub, awayStarters, awayBench, 62, awayScore - homeScore, awayClub.subPolicy, 0) : { subsIn: [] };
  const homeSubs = homeSubRes.subsIn || [];
  const awaySubs = awaySubRes.subsIn || [];

  applyOfficialAppearancesAndTraining(homeClub, homeStarters, homeSubs, { recordOfficial, applyTraining });
  applyOfficialAppearancesAndTraining(awayClub, awayStarters, awaySubs, { recordOfficial, applyTraining });

  const { homeScorers, awayScorers } = generateScorersForQuickMatch(homeClub, awayClub, homeScore, awayScore, { recordOfficial });
  const ratingRes = calculateAndAssignMatchRatings(
    homeClub, awayClub,
    homeStarters, awayStarters,
    homeSubs, awaySubs,
    homeScore, awayScore,
    homeScorers.concat(awayScorers),
    { recordOfficial }
  );

  const DEFENDER_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'];
  const isDefOrGk = (p) => {
    const pos = p.assignedPos || p.primaryPosition || p.preferredPosition || p.pos;
    return DEFENDER_POSITIONS.includes(pos) || POS_ROLE_GROUP[pos] === 'GK' || POS_ROLE_GROUP[pos] === 'DF';
  };
  if (recordOfficial) {
    if (awayScore === 0) {
      homeStarters.forEach(p => {
        if (isDefOrGk(p)) {
          p.cleanSheets = (p.cleanSheets || 0) + 1;
          if (!p.careerStats) p.careerStats = { appearances: p.appearances || 0, goals: p.goals || 0, assists: p.assists || 0, cleanSheets: 0 };
          p.careerStats.cleanSheets = (p.careerStats.cleanSheets || 0) + 1;
        }
      });
    }
    if (homeScore === 0) {
      awayStarters.forEach(p => {
        if (isDefOrGk(p)) {
          p.cleanSheets = (p.cleanSheets || 0) + 1;
          if (!p.careerStats) p.careerStats = { appearances: p.appearances || 0, goals: p.goals || 0, assists: p.assists || 0, cleanSheets: 0 };
          p.careerStats.cleanSheets = (p.careerStats.cleanSheets || 0) + 1;
        }
      });
    }
  }

  const cardsMap = {};
  const simQuickCards = (starters) => {
    const cardWeights = [48, 36, 13, 3];
    const numYellow = typeof avatarWeightedPick === 'function' ? avatarWeightedPick(cardWeights, Math.random) : randInt(0, 1);
    const nonGk = starters.filter(p => (p.assignedPos || p.pos) !== 'GK');
    const pool = nonGk.length > 0 ? nonGk : starters;
    for (let c = 0; c < numYellow; c++) {
      const target = pool[randInt(0, pool.length - 1)];
      if (target && target.id) {
        if (!cardsMap[target.id]) cardsMap[target.id] = { yellow: 0, red: 0 };
        cardsMap[target.id].yellow += 1;
        if (recordOfficial) {
          target.yellowCards = (target.yellowCards || 0) + 1;
          if (!target.careerStats) target.careerStats = { appearances: target.appearances || 0, goals: target.goals || 0, assists: target.assists || 0 };
          target.careerStats.yellowCards = (target.careerStats.yellowCards || 0) + 1;
        }
      }
    }
    if (Math.random() < 0.02) {
      const target = pool[randInt(0, pool.length - 1)];
      if (target && target.id) {
        if (!cardsMap[target.id]) cardsMap[target.id] = { yellow: 0, red: 0 };
        cardsMap[target.id].red += 1;
        if (recordOfficial) {
          target.redCards = (target.redCards || 0) + 1;
          if (!target.careerStats) target.careerStats = { appearances: target.appearances || 0, goals: target.goals || 0, assists: target.assists || 0 };
          target.careerStats.redCards = (target.careerStats.redCards || 0) + 1;
        }
      }
    }
  };
  simQuickCards(homeStarters);
  simQuickCards(awayStarters);

  if (recordOfficial && typeof applyPostMatchDiscipline === 'function') {
    applyPostMatchDiscipline(compCat, homeClub, awayClub, [...homeStarters, ...homeSubs], [...awayStarters, ...awaySubs], cardsMap, preSuspendedIds);
  }

  if (compKey) {
    recordCompetitionPlayerMatchStats(compKey, homeClub, awayClub, homeStarters, awayStarters, homeSubs, awaySubs, homeScore, awayScore, homeScorers, awayScorers, ratingRes, cardsMap);
  }

  return { homeScorers, awayScorers, momPlayer: ratingRes.momPlayer, momClub: ratingRes.momClub, momRating: ratingRes.momRating };
}
window.simulateAndRecordQuickMatchPlayerStats = simulateAndRecordQuickMatchPlayerStats;

/**
 * 試合出場選手の疲労蓄積および不出場控え選手の軽微回復（出場数加算は重複防止のため分離）
 */
function applyPostMatchPlayerFatigue(club, playedStarters = null, playedSubs = []) {
  if (!club || !club.players) return;
  const starters = playedStarters || club.players.filter(p => p.isStarter && !p.isRetired);
  const subIds = new Set((playedSubs || []).map(p => p.id));
  const starterIds = new Set(starters.map(p => p.id));

  const tKey = normalizeTacticKey(club.tactic);
  const tacticMult = tKey === 'gegenpress' ? 1.25 : (tKey === 'counter' ? 0.85 : 1.0);
  const coaching = typeof getClubCoachingEffects === 'function' ? getClubCoachingEffects(club) : { staDrainMult: 1.0 };

  const curDay = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
  const isPreseasonMatch = Boolean(curDay && (curDay.cupCompType === 'preseasonCup' || curDay.preseasonRound));
  const preseasonMult = isPreseasonMatch ? 0.5 : 1.0;
  const drainMult = tacticMult * (coaching.staDrainMult || 1.0) * preseasonMult;

  starters.forEach(p => {
    const fatigueDelta = Math.round(randInt(13, 17) * drainMult);
    p.fatigue = clamp((p.fatigue || 0) + fatigueDelta, 0, 100);
  });

  (playedSubs || []).forEach(p => {
    const fatigueDelta = Math.round(randInt(6, 10) * drainMult);
    p.fatigue = clamp((p.fatigue || 0) + fatigueDelta, 0, 100);
  });

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
function playCurrentCupMatchday(skipAnimation = false, quickSummary = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || !currentDay.isCupMatchDay || currentDay.played) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  if (gameState.managerDelegationEnabled) {
    applyManagerPreMatchDelegation(playerClub, true);
  }

  // 0. プレシーズン親善杯（ワールド・チャレンジ・トロフィー）の場合
  if (currentDay.cupCompType === 'preseasonCup') {
    const comp = gameState.competitions && gameState.competitions.preseasonCup;
    const roundNum = currentDay.preseasonRound || 1;
    const myMatch = comp && comp.matches && comp.matches.find(m => m.round === roundNum);

    if (!myMatch || !comp) {
      currentDay.played = true;
      startAdvancingToNextMatch();
      return;
    }

    const isHome = myMatch.homeId === playerClub.id;
    const oppClub = isHome ? myMatch.awayClub : myMatch.homeClub;
    const matchHomeClub = isHome ? playerClub : oppClub;
    const matchAwayClub = isHome ? oppClub : playerClub;
    ensureClubStartersForMatch(playerClub);
    ensureClubStartersForMatch(oppClub);

    const simRes = simQuickMatch(matchHomeClub, matchAwayClub);
    const homeScore = simRes.homeScore;
    const awayScore = simRes.awayScore;
    myMatch.homeScore = homeScore;
    myMatch.awayScore = awayScore;
    myMatch.played = true;

    // 同ラウンドの招待クラブ同士の裏カードもシミュレートし、WCT全4クラブの個人スタッツを公平に記録
    if (myMatch.otherHomeClub && myMatch.otherAwayClub) {
      const otherRes = simQuickMatch(myMatch.otherHomeClub, myMatch.otherAwayClub);
      simulateAndRecordQuickMatchPlayerStats(
        'preseasonCup',
        myMatch.otherHomeClub,
        myMatch.otherAwayClub,
        otherRes.homeScore,
        otherRes.awayScore,
        { recordOfficial: false, applyTraining: false }
      );
    }

    // プレシーズン親善試合：公式戦通算成績には加算せず、WCT大会スタッツ・特訓進捗・疲労半減のみ反映
    const cupRatings = simulateAndRecordQuickMatchPlayerStats(
      'preseasonCup',
      matchHomeClub,
      matchAwayClub,
      homeScore,
      awayScore,
      { recordOfficial: false, applyTraining: true }
    );
    const homeScorers = cupRatings.homeScorers;
    const awayScorers = cupRatings.awayScorers;
    applyPostMatchPlayerFatigue(playerClub);

    const myScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    const userWon = myScore > oppScore;
    const userDraw = myScore === oppScore;

    // 親善大会賞金とボーナス
    let prize = 300; // 参加賞 £300K
    let fanGain = 400;
    let moraleGain = 4;
    if (userWon) {
      prize += 500; // 勝利ボーナス +£500K
      fanGain += 800;
      moraleGain += 8;
      if (roundNum === 3) {
        prize += 1500; // 決勝制覇ボーナス +£1.5M
        fanGain += 1500;
        moraleGain += 15;
      }
    } else if (userDraw) {
      prize += 200; // 引き分け +£200K
      fanGain += 300;
      moraleGain += 3;
    }

    playerClub.funds = (playerClub.funds || 0) + prize;
    playerClub.supporters = Math.max(5000, (playerClub.supporters || 10000) + fanGain);
    playerClub.morale = Math.min(100, (playerClub.morale || 70) + moraleGain);

    const resText = userWon ? '勝利！' : (userDraw ? '引分' : '敗戦');
    const finalBonusText = (roundNum === 3 && userWon) ? ' 🏆 WCTトロフィー獲得！' : '';
    const emitPreseasonPostMatchLogAndToast = () => {
      addDailyLog(`【WCT ${myMatch.roundName}】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore} で${resText}${finalBonusText}（賞金+${formatMoney(prize)} / サポーター+${fanGain}人）`);
      if (typeof showToast === 'function') {
        showToast(`WCT ${myMatch.roundName}：${resText}！ 賞金+${formatMoney(prize)}獲得！`, userWon ? 'success' : 'info');
      }
    };

    currentDay.played = true;
    currentDay.matchResult = {
      isHome,
      homeScore,
      awayScore,
      oppClub,
      title: `WCT ${myMatch.roundName}`,
      scorers: homeScorers.concat(awayScorers)
    };

    const shotStats = buildQuickMatchShotStats(homeScore, awayScore, simRes);
    const matchData = {
      week: roundNum,
      compTitle: `WCT ${myMatch.roundName}`,
      compCode: 'WCT',
      isPreseason: true,
      userWon,
      homeClub: matchHomeClub,
      awayClub: matchAwayClub,
      homeScore,
      awayScore,
      momPlayer: cupRatings.momPlayer,
      momClub: cupRatings.momClub,
      momRating: cupRatings.momRating,
      homePossession: simRes.homePossession || (userWon ? 54 : 46),
      awayPossession: 100 - (simRes.homePossession || (userWon ? 54 : 46)),
      homeShots: shotStats.homeShots,
      awayShots: shotStats.awayShots,
      homeOnTarget: shotStats.homeOnTarget,
      awayOnTarget: shotStats.awayOnTarget,
      homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
      awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
      isPlayerHome: isHome,
      isPlayerMatch: true,
      matchIncome: prize,
      playerSupportersDelta: fanGain,
      homeScorers,
      awayScorers,
      prizeText: `+${formatMoney(prize)}`,
      fanGainText: `+${fanGain}人`
    };

    if (skipAnimation) {
      emitPreseasonPostMatchLogAndToast();
      renderAll();
      return;
    }

    // 2Dピッチ試合経過アニメーション＆マッチサマリーを表示（トースト通知は試合終了後に表示）
    openMatchEventModal(matchData, homeScorers, awayScorers, () => {
      emitPreseasonPostMatchLogAndToast();
      renderAll();
    }, { quickSummary });
    return;
  }

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
    if (euroMd === 8 && typeof finalizeEuroLeaguePhaseToKnockout === 'function') {
      finalizeEuroLeaguePhaseToKnockout(comp);
    }

    // 選手出場・疲労・大会別個人スタッツ反映
    const euroCompKey = ['championsCup', 'europaCup', 'conferenceCup'].find(
      k => gameState.competitions && gameState.competitions[k] === comp
    ) || 'championsCup';
    const cupRatings = simulateAndRecordQuickMatchPlayerStats(
      euroCompKey,
      isHome ? playerClub : oppClub,
      isHome ? oppClub : playerClub,
      homeScore,
      awayScore,
      { recordOfficial: true, applyTraining: true }
    );
    const homeScorers = cupRatings.homeScorers;
    const awayScorers = cupRatings.awayScorers;
    applyPostMatchPlayerFatigue(playerClub);

    const myScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    const userWon = myScore > oppScore;
    const userDraw = myScore === oppScore;
    const resText = userWon ? '勝利！' : (userDraw ? '引分' : '敗戦');
    const euroFin = applyCupMatchFinancialsAndSupporters(playerClub, isHome, userWon, userDraw, 'euroLeague');
    addDailyLog(`【${comp.name} 第${euroMd}節】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore} で${resText}`);

    const euroShotStats = buildQuickMatchShotStats(homeScore, awayScore, simRes);
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
      homeShots: euroShotStats.homeShots,
      awayShots: euroShotStats.awayShots,
      homeOnTarget: euroShotStats.homeOnTarget,
      awayOnTarget: euroShotStats.awayOnTarget,
      homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
      awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
      isPlayerHome: isHome,
      isPlayerMatch: true,
      matchIncome: euroFin.matchIncome,
      awayBroadcastingFee: euroFin.awayBroadcastingFee,
      playerSupportersDelta: euroFin.playerSupportersDelta,
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
    }, { quickSummary });
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
    myMatch.pkHome = simRes.pkHome;
    myMatch.pkAway = simRes.pkAway;
    myMatch.winnerId = simRes.winnerId;
    myMatch.winnerClub = userWon ? playerClub : oppClub;
    myMatch.played = true;

    if (typeof finalizeEuroPlayoffToR16 === 'function') {
      finalizeEuroPlayoffToR16(comp);
    }

    const poEuroCompKey = ['championsCup', 'europaCup', 'conferenceCup'].find(
      k => gameState.competitions && gameState.competitions[k] === comp
    ) || 'championsCup';
    const poRatings = simulateAndRecordQuickMatchPlayerStats(
      poEuroCompKey,
      isHome ? playerClub : oppClub,
      isHome ? oppClub : playerClub,
      homeScore,
      awayScore,
      { recordOfficial: true, applyTraining: true }
    );
    const homeScorers = poRatings.homeScorers;
    const awayScorers = poRatings.awayScorers;
    applyPostMatchPlayerFatigue(playerClub);

    const myScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    const pkText = simRes.pkHome != null ? ` (PK ${simRes.pkHome}-${simRes.pkAway})` : '';
    const resText = userWon ? '勝利・決勝T進出！' : '惜敗・欧州敗退';
    const poFin = applyCupMatchFinancialsAndSupporters(playerClub, isHome, userWon, false, 'euroPlayoff');
    addDailyLog(`【${comp.name} PO】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore}${pkText} で${resText}`);

    const poShotStats = buildQuickMatchShotStats(homeScore, awayScore, simRes);
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
      homeShots: poShotStats.homeShots,
      awayShots: poShotStats.awayShots,
      homeOnTarget: poShotStats.homeOnTarget,
      awayOnTarget: poShotStats.awayOnTarget,
      homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
      awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
      isPlayerHome: isHome,
      isPlayerMatch: true,
      matchIncome: poFin.matchIncome,
      awayBroadcastingFee: poFin.awayBroadcastingFee,
      playerSupportersDelta: poFin.playerSupportersDelta,
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
    }, { quickSummary });
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
  const cupFinalRatings = simulateAndRecordQuickMatchPlayerStats(
    compType,
    isHome ? playerClub : oppClub,
    isHome ? oppClub : playerClub,
    homeScore,
    awayScore,
    { recordOfficial: true, applyTraining: true }
  );
  const homeScorers = cupFinalRatings.homeScorers;
  const awayScorers = cupFinalRatings.awayScorers;
  applyPostMatchPlayerFatigue(playerClub);

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
  const isEuroKo = (compType === 'championsCup' || compType === 'europaCup' || compType === 'conferenceCup');
  const koFin = applyCupMatchFinancialsAndSupporters(playerClub, isHome, userWon, false, isEuroKo ? 'euroPlayoff' : 'domestic');
  addDailyLog(`【${comp.name} ${cupRoundTitle}】vs ${oppClub.name} (${isHome ? 'H' : 'A'}) ${myScore}-${oppScore}${pkText} で${resultText}`);

  const koShotStats = buildQuickMatchShotStats(homeScore, awayScore, simRes);
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
    homeShots: koShotStats.homeShots,
    awayShots: koShotStats.awayShots,
    homeOnTarget: koShotStats.homeOnTarget,
    awayOnTarget: koShotStats.awayOnTarget,
    homeXg: Number((homeScore * 0.75 + 0.35).toFixed(2)),
    awayXg: Number((awayScore * 0.75 + 0.35).toFixed(2)),
    isPlayerHome: isHome,
    isPlayerMatch: true,
    matchIncome: koFin.matchIncome,
    awayBroadcastingFee: koFin.awayBroadcastingFee,
    playerSupportersDelta: koFin.playerSupportersDelta,
    homeScorers,
    awayScorers
  };

  if (skipAnimation) {
    renderAll();
    return;
  }

  openMatchEventModal(matchData, homeScorers, awayScorers, () => {
    renderAll();
  }, { quickSummary });
}

function applyCupMatchFinancialsAndSupporters(playerClub, isHome, userWon, userDraw, mode = 'domestic') {
  if (!playerClub) {
    return { matchIncome: 0, awayBroadcastingFee: 0, playerSupportersDelta: 0 };
  }
  const stadiumLv = (gameState.facilities && gameState.facilities.stadium) ? gameState.facilities.stadium : 1;
  const stadiumMultiplier = 1 + (stadiumLv - 1) * 0.15;

  let matchIncome = 0;
  let awayBroadcastingFee = 0;
  let playerSupportersDelta = 0;

  if (mode === 'euroLeague') {
    matchIncome = isHome ? Math.round(((playerClub.supporters || 15000) * 0.095 * stadiumMultiplier) / 10) * 10 : 0;
    awayBroadcastingFee = !isHome ? 2200 : 0;
    playerSupportersDelta = userWon ? 180 : (userDraw ? 40 : -50);
  } else if (mode === 'euroPlayoff') {
    matchIncome = isHome ? Math.round(((playerClub.supporters || 15000) * 0.10 * stadiumMultiplier) / 10) * 10 : 0;
    awayBroadcastingFee = !isHome ? 2500 : 0;
    playerSupportersDelta = userWon ? 200 : -60;
  } else {
    matchIncome = isHome ? Math.round(((playerClub.supporters || 15000) * 0.08 * stadiumMultiplier) / 10) * 10 : 0;
    awayBroadcastingFee = !isHome ? 1500 : 0;
    playerSupportersDelta = userWon ? 160 : -40;
  }

  playerClub.funds = (playerClub.funds || 0) + matchIncome + awayBroadcastingFee;
  playerClub.supporters = Math.max(5000, (playerClub.supporters || 10000) + playerSupportersDelta);
  updateManagerTrustAfterMatch(playerClub, Boolean(userWon), Boolean(userDraw));

  return { matchIncome, awayBroadcastingFee, playerSupportersDelta };
}

function advanceFirstDivisionBackgroundWeek() {
  if (!Array.isArray(gameState.clubs) || gameState.clubs.length < 2) return;
  const playedSoFar = gameState.clubs[0] ? (gameState.clubs[0].played || 0) : 0;
  if (playedSoFar >= 38) return;

  if (!Array.isArray(gameState.d1BackgroundSchedule) || gameState.d1BackgroundSchedule.length === 0) {
    gameState.d1BackgroundSchedule = generateSeasonSchedule(gameState.clubs);
  }
  const weekMatches = gameState.d1BackgroundSchedule[playedSoFar];
  if (!Array.isArray(weekMatches)) return;

  for (const m of weekMatches) {
    if (m.played) continue;
    const h = gameState.clubs.find(c => c.id === m.homeId);
    const a = gameState.clubs.find(c => c.id === m.awayId);
    if (!h || !a) continue;
    const res = simulateMatch(h, a);
    m.homeScore = res.homeScore;
    m.awayScore = res.awayScore;
    m.played = true;

    h.funds = (h.funds || 0) + Math.round(((h.supporters || 15000) * 0.085) / 10) * 10;
    a.funds = (a.funds || 0) + 1600;
    h.played = (h.played || 0) + 1;
    a.played = (a.played || 0) + 1;
    h.gf = (h.gf || 0) + res.homeScore;
    h.ga = (h.ga || 0) + res.awayScore;
    h.gd = h.gf - h.ga;
    a.gf = (a.gf || 0) + res.awayScore;
    a.ga = (a.ga || 0) + res.homeScore;
    a.gd = a.gf - a.ga;

    if (res.homeScore > res.awayScore) { h.won++; h.pts += 3; a.lost++; }
    else if (res.homeScore < res.awayScore) { a.won++; a.pts += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.pts += 1; a.pts += 1; }
    processMatchScorersAndRatings(m, h, a, res.homeScore, res.awayScore, 'd1');
  }
}
function playCurrentMatchday(skipAnimation = false, quickSummary = false) {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay) {
    startAdvancingToNextMatch();
    return;
  }

  // カップ戦の消化
  if (currentDay.isCupMatchDay && !currentDay.played) {
    playCurrentCupMatchday(skipAnimation, quickSummary);
    return;
  }

  if (!currentDay.isMatchDay || currentDay.played) {
    startAdvancingToNextMatch();
    return;
  }

  const pClubForMatch = getPlayerClub();
  if (gameState.managerDelegationEnabled && pClubForMatch) {
    applyManagerPreMatchDelegation(pClubForMatch, true);
  }

  // 試合シミュレーションを実行
  playNextMatchweek(skipAnimation, quickSummary);

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

  // 監督（ヘッドコーチ）哲学一致・現場信頼度による戦術浸透度補正
  let managerBonusOvr = 0;
  if (club.manager) {
    const mgrTrust = club.manager.trust ?? 80;
    if (club.formation === club.manager.preferredFormation) {
      managerBonusOvr += 1;
    }
    if (normalizeTacticKey(club.tactic) === normalizeTacticKey(club.manager.preferredTactic)) {
      managerBonusOvr += 1;
    }
    if (mgrTrust < 40) {
      // 現場との軋轢（信頼度40%未満）時は戦術浸透効果が消失し、ロッカールーム動揺で攻守連携が低下
      managerBonusOvr = 0;
      totalAtk *= 0.97;
      totalDef *= 0.97;
    } else if (managerBonusOvr > 0) {
      const highTrustExtra = (mgrTrust >= 80 && managerBonusOvr === 2) ? 0.01 : 0;
      const buff = 1.0 + (managerBonusOvr * 0.02) + highTrustExtra;
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

  // --- チームケミストリー・戦術習熟度・役割（キャプテン・セットプレー）補正 ---
  const hChem = typeof homeClub.teamChemistry === 'number' ? homeClub.teamChemistry : 75;
  const aChem = typeof awayClub.teamChemistry === 'number' ? awayClub.teamChemistry : 75;
  const hFam = typeof homeClub.tacticalFamiliarity === 'number' ? homeClub.tacticalFamiliarity : 75;
  const aFam = typeof awayClub.tacticalFamiliarity === 'number' ? awayClub.tacticalFamiliarity : 75;
  rawHomeLambda *= clamp(0.92 + ((hChem + hFam) / 200) * 0.14, 0.90, 1.08);
  rawAwayLambda *= clamp(0.92 + ((aChem + aFam) / 200) * 0.14, 0.90, 1.08);

  if (homeClub.roles && homeClub.roles.setPieceKickerId) {
    const sp = (homeClub.players || []).find(p => p.id === homeClub.roles.setPieceKickerId);
    if (sp && sp.isStarter) rawHomeLambda *= (1 + clamp(((sp.atk || 70) - 65) / 400, 0, 0.08));
  }
  if (awayClub.roles && awayClub.roles.setPieceKickerId) {
    const sp = (awayClub.players || []).find(p => p.id === awayClub.roles.setPieceKickerId);
    if (sp && sp.isStarter) rawAwayLambda *= (1 + clamp(((sp.atk || 70) - 65) / 400, 0, 0.08));
  }

  // --- 試合中レッドカード（10人戦の数的不利シミュレーション） ---
  const homeRedCard = Math.random() < 0.025;
  const awayRedCard = Math.random() < 0.025;
  const homeRedMinute = homeRedCard ? randInt(18, 78) : null;
  const awayRedMinute = awayRedCard ? randInt(18, 78) : null;
  if (homeRedCard) {
    const remainRatio = Math.max(0.15, (90 - homeRedMinute) / 90);
    rawHomeLambda *= (1 - 0.35 * remainRatio);
    rawAwayLambda *= (1 + 0.28 * remainRatio);
  }
  if (awayRedCard) {
    const remainRatio = Math.max(0.15, (90 - awayRedMinute) / 90);
    rawAwayLambda *= (1 - 0.35 * remainRatio);
    rawHomeLambda *= (1 + 0.28 * remainRatio);
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
    awayFormation: aForm,
    homeRedCard,
    awayRedCard,
    homeRedMinute,
    awayRedMinute
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
function calculateAndAssignMatchRatings(homeClub, awayClub, homeStarters, awayStarters, homeSubs = [], awaySubs = [], homeScore = 0, awayScore = 0, allMatchGoals = [], options = {}) {
  const { recordOfficial = true } = options;
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
      if (recordOfficial) {
        p.totalRating = (p.totalRating || 0) + p.lastMatchRating;
      }
    });

    (subs || []).forEach(p => {
      const inMin = typeof p.lastMatchSubMinute === 'number' ? p.lastMatchSubMinute : 68;
      const playedMins = Math.max(1, 90 - inMin);
      let r = playedMins >= 30 ? 6.6 : (playedMins >= 15 ? 6.4 : 6.2);
      if (isWin) r += playedMins >= 25 ? 0.3 : 0.2;
      else if (!isDraw) r -= playedMins >= 25 ? 0.2 : 0.1;

      const goalsInMatch = (allMatchGoals || []).filter(s => s && s.scorer && s.scorer.id === p.id).length;
      r += goalsInMatch * 0.9;
      const assistsInMatch = (allMatchGoals || []).filter(s => s && s.assister && s.assister.id === p.id).length;
      r += assistsInMatch * 0.5;

      r += randInt(-1, 1) * 0.1;
      r = clamp(r, 5.4, 9.5);
      p.lastMatchRating = Number(r.toFixed(1));
      if (recordOfficial) {
        p.totalRating = (p.totalRating || 0) + p.lastMatchRating;
      }
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
    const goalsA = (allMatchGoals || []).filter(s => s && s.scorer && s.scorer.id === a.p.id).length;
    const goalsB = (allMatchGoals || []).filter(s => s && s.scorer && s.scorer.id === b.p.id).length;
    if (goalsB !== goalsA) return goalsB - goalsA;
    return (b.p.goals || 0) - (a.p.goals || 0);
  });

  const momEntry = allEntries[0];
  allEntries.forEach(entry => {
    const isMom = Boolean(momEntry && entry.p.id === momEntry.p.id);
    entry.p.isMOM = isMom;
    if (isMom && recordOfficial) {
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
 * 試合中の自動選手交代（最大5人枠・交代方針対応）を実行
 */
function executeAutoSubstitutions(club, starters, bench, matchMinute = 68, scoreDiff = 0, subPolicy = null, alreadySubbedCount = 0) {
  if (!club || !Array.isArray(starters) || !Array.isArray(bench)) return { subsIn: [], subEvents: [] };
  const maxSubs = 5;
  const remainSlots = Math.max(0, maxSubs - (alreadySubbedCount || 0));
  if (remainSlots <= 0 || bench.length === 0) return { subsIn: [], subEvents: [] };

  const policy = subPolicy || club.subPolicy || 'balanced';
  const availBench = bench.filter(p => p && !p.isRetired && !(p.injuryDays > 0 || p.injuryWeeks > 0) && !(p.loanStatus && p.loanStatus.isLoanOut) && !p.onIntlDuty && (p.primaryPosition || p.pos) !== 'GK');
  if (availBench.length === 0) return { subsIn: [], subEvents: [] };

  let desiredCount = 3;
  if (policy === 'fatigue') desiredCount = 4;
  else if (policy === 'defensive_lead' && scoreDiff > 0) desiredCount = 4;
  else if (policy === 'attack_chase' && scoreDiff <= 0) desiredCount = 4;
  if (Math.random() < 0.35) desiredCount = Math.min(5, desiredCount + 1);
  desiredCount = Math.min(remainSlots, desiredCount, availBench.length);

  const outCandidates = starters
    .filter(p => p && (p.assignedPos || p.pos) !== 'GK')
    .sort((a, b) => {
      const ftgDiff = (b.fatigue || 0) - (a.fatigue || 0);
      if (policy === 'fatigue') return ftgDiff;
      const roleA = POS_ROLE_GROUP[a.assignedPos || a.pos] || 'MF';
      const roleB = POS_ROLE_GROUP[b.assignedPos || b.pos] || 'MF';
      if (policy === 'defensive_lead' && scoreDiff > 0) {
        return (roleB === 'FW' ? 20 : 0) - (roleA === 'FW' ? 20 : 0) + ftgDiff * 0.5;
      }
      if (policy === 'attack_chase' && scoreDiff <= 0) {
        return (roleB === 'DF' ? 20 : 0) - (roleA === 'DF' ? 20 : 0) + ftgDiff * 0.5;
      }
      return ftgDiff + ((a.sta || 70) - (b.sta || 70)) * 0.3;
    });

  const subsIn = [];
  const subEvents = [];
  const usedBenchIds = new Set();

  for (let i = 0; i < desiredCount; i++) {
    const outP = outCandidates[i];
    if (!outP) break;
    const outRole = POS_ROLE_GROUP[outP.assignedPos || outP.pos] || 'MF';
    let targetRole = outRole;
    if (policy === 'defensive_lead' && scoreDiff > 0 && i === 0) targetRole = 'DF';
    if (policy === 'attack_chase' && scoreDiff <= 0 && i === 0) targetRole = 'FW';

    const pool = availBench.filter(b => !usedBenchIds.has(b.id));
    if (pool.length === 0) break;
    const roleMatches = pool.filter(b => (POS_ROLE_GROUP[b.primaryPosition || b.pos] || 'MF') === targetRole);
    const pickPool = roleMatches.length > 0 ? roleMatches : pool;
    pickPool.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
    const inP = pickPool[0];
    if (!inP) break;

    usedBenchIds.add(inP.id);
    const min = clamp((matchMinute || 65) + i * 5 + randInt(0, 4), 55, 89);
    inP.lastMatchSubMinute = min;
    subsIn.push(inP);
    subEvents.push({ minute: min, clubId: club.id, outPlayer: outP, inPlayer: inP });
  }
  return { subsIn, subEvents };
}

/**
 * 試合後の累積警告・退場ルール適用（出場停止の付与と消化）
 */
function applyPostMatchDiscipline(compCategory, homeClub, awayClub, homePlayed, awayPlayed, cardsMap, preSuspendedIds = null) {
  if (!compCategory || compCategory === 'preseason') return;
  const decrementClub = (club) => {
    if (!club || !Array.isArray(club.players)) return;
    for (const p of club.players) {
      if (preSuspendedIds && preSuspendedIds.has(p.id) && p.suspensionMatches && p.suspensionMatches[compCategory] > 0) {
        p.suspensionMatches[compCategory] = Math.max(0, p.suspensionMatches[compCategory] - 1);
      }
    }
  };
  decrementClub(homeClub);
  decrementClub(awayClub);

  const applyForClub = (club, playedList) => {
    if (!club || !Array.isArray(playedList)) return;
    for (const p of playedList) {
      if (!p || !p.id) continue;
      if (typeof ensurePlayerRealismFields === 'function') ensurePlayerRealismFields(p);
      const cardInfo = cardsMap && cardsMap[p.id];
      if (!cardInfo) continue;

      if (cardInfo.yellow > 0) {
        p.compYellowAccum[compCategory] = (p.compYellowAccum[compCategory] || 0) + cardInfo.yellow;
        const threshold = compCategory === 'league' ? 5 : 2;
        if (p.compYellowAccum[compCategory] % threshold === 0) {
          p.suspensionMatches[compCategory] = (p.suspensionMatches[compCategory] || 0) + 1;
          if (club.isPlayer && typeof addDailyLog === 'function') {
            addDailyLog(`【出場停止】#${p.squadNumber || '-'} ${p.name} が累積警告により次節の公式戦を出場停止となります。`);
          }
        }
      }
      if (cardInfo.red > 0) {
        p.suspensionMatches[compCategory] = (p.suspensionMatches[compCategory] || 0) + 1;
        if (club.isPlayer && typeof addDailyLog === 'function') {
          addDailyLog(`【退場処分】#${p.squadNumber || '-'} ${p.name} がレッドカードにより次節出場停止となりました。`);
        }
      }
    }
  };
  applyForClub(homeClub, homePlayed);
  applyForClub(awayClub, awayPlayed);
}

/**
 * 試合から得点者を抽出し、今季＆キャリア通算スタッツを更新する
 */
function processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore, compKey = null) {
  const compCat = typeof resolveDisciplineCategory === 'function' ? resolveDisciplineCategory(compKey || 'd1') : 'league';
  const preSuspendedIds = new Set();
  [homeClub, awayClub].forEach(c => {
    if (c && Array.isArray(c.players)) {
      c.players.forEach(p => {
        if (typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, compCat)) {
          preSuspendedIds.add(p.id);
        }
      });
    }
  });

  const homeStarters = homeClub.players.filter(p => p.isStarter && !p.isRetired);
  const awayStarters = awayClub.players.filter(p => p.isStarter && !p.isRetired);
  const homeBench = homeClub.players.filter(p => !p.isStarter && !p.isRetired && !(typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, compCat)));
  const awayBench = awayClub.players.filter(p => !p.isStarter && !p.isRetired && !(typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(p, compCat)));

  const homeSubRes = executeAutoSubstitutions(homeClub, homeStarters, homeBench, 62, homeScore - awayScore, homeClub.subPolicy, 0);
  const awaySubRes = executeAutoSubstitutions(awayClub, awayStarters, awayBench, 62, awayScore - homeScore, awayClub.subPolicy, 0);
  const homeSubs = homeSubRes.subsIn || [];
  const awaySubs = awaySubRes.subsIn || [];

  applyOfficialAppearancesAndTraining(homeClub, homeStarters, homeSubs, { recordOfficial: true, applyTraining: true });
  applyOfficialAppearancesAndTraining(awayClub, awayStarters, awaySubs, { recordOfficial: true, applyTraining: true });

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
    homeSubs, awaySubs,
    homeScore, awayScore,
    allMatchGoals,
    { recordOfficial: true }
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
  const cardsMap = {};
  const redCardEvents = [];
  const simulateCardsForSquad = (starters, club, forcedRed = false, forcedRedMinute = null) => {
    const cardWeights = [45, 38, 14, 3];
    const numYellow = typeof avatarWeightedPick === 'function' ? avatarWeightedPick(cardWeights, Math.random) : randInt(0, 1);
    const nonGk = starters.filter(p => (p.assignedPos || p.pos) !== 'GK');
    const pool = nonGk.length > 0 ? nonGk : starters;
    for (let c = 0; c < numYellow; c++) {
      const target = pool[randInt(0, pool.length - 1)];
      if (target) {
        if (target.id) {
          if (!cardsMap[target.id]) cardsMap[target.id] = { yellow: 0, red: 0 };
          cardsMap[target.id].yellow += 1;
        }
        target.yellowCards = (target.yellowCards || 0) + 1;
        if (!target.careerStats) target.careerStats = { appearances: target.appearances || 0, goals: target.goals || 0, assists: target.assists || 0 };
        target.careerStats.yellowCards = (target.careerStats.yellowCards || 0) + 1;
      }
    }
    if (forcedRed || (!match && Math.random() < 0.025)) {
      const target = pool[randInt(0, pool.length - 1)];
      if (target) {
        if (target.id) {
          if (!cardsMap[target.id]) cardsMap[target.id] = { yellow: 0, red: 0 };
          cardsMap[target.id].red += 1;
        }
        target.redCards = (target.redCards || 0) + 1;
        if (!target.careerStats) target.careerStats = { appearances: target.appearances || 0, goals: target.goals || 0, assists: target.assists || 0 };
        target.careerStats.redCards = (target.careerStats.redCards || 0) + 1;
        redCardEvents.push({
          minute: forcedRedMinute || randInt(22, 82),
          clubId: club.id,
          player: target
        });
      }
    }
  };
  simulateCardsForSquad(homeStarters, homeClub, Boolean(match && match.homeRedCard), match && match.homeRedMinute);
  simulateCardsForSquad(awayStarters, awayClub, Boolean(match && match.awayRedCard), match && match.awayRedMinute);
  if (match) {
    match.redCardEvents = redCardEvents;
    match.homeSubEvents = homeSubRes.subEvents || [];
    match.awaySubEvents = awaySubRes.subEvents || [];
  }

  if (typeof applyPostMatchDiscipline === 'function') {
    applyPostMatchDiscipline(compCat, homeClub, awayClub, [...homeStarters, ...homeSubs], [...awayStarters, ...awaySubs], cardsMap, preSuspendedIds);
  }

  const resolvedLeagueKey = compKey || (
    (gameState.competitions && gameState.competitions.championship && Array.isArray(gameState.competitions.championship.clubs)
      && gameState.competitions.championship.clubs.some(c => c && c.id === homeClub.id))
      ? 'd2'
      : 'd1'
  );
  recordCompetitionPlayerMatchStats(
    resolvedLeagueKey,
    homeClub, awayClub,
    homeStarters, awayStarters,
    homeSubs, awaySubs,
    homeScore, awayScore,
    homeScorers, awayScorers,
    ratingRes, cardsMap
  );

  const isHomeWin = homeScore > awayScore;
  const isDraw = homeScore === awayScore;
  const isAwayWin = homeScore < awayScore;

  // 監督現場信頼度の更新（GM現場介入ペナルティ＆勝敗連動）
  updateManagerTrustAfterMatch(homeClub, isHomeWin, isDraw);
  updateManagerTrustAfterMatch(awayClub, isAwayWin, isDraw);

  if (typeof updatePlayerMoraleAndStatuses === 'function') {
    updatePlayerMoraleAndStatuses(homeClub, homeStarters, homeSubs, isHomeWin, isDraw);
    updatePlayerMoraleAndStatuses(awayClub, awayStarters, awaySubs, isAwayWin, isDraw);
  }
  if (typeof updateBoardConfidenceAfterMatch === 'function') {
    updateBoardConfidenceAfterMatch(homeClub, compCat, isHomeWin, isDraw);
    updateBoardConfidenceAfterMatch(awayClub, compCat, isAwayWin, isDraw);
  }
  if (typeof calculateClubChemistryAndFamiliarity === 'function') {
    calculateClubChemistryAndFamiliarity(homeClub);
    calculateClubChemistryAndFamiliarity(awayClub);
  }

  // 試合出場に伴う疲労度（0〜100数値）蓄積（戦術・コーチング効果連動）
  applyPostMatchPlayerFatigue(homeClub, homeStarters, homeSubs);
  applyPostMatchPlayerFatigue(awayClub, awayStarters, awaySubs);

  return {
    homeScorers,
    awayScorers,
    momPlayer: ratingRes.momPlayer,
    momClub: ratingRes.momClub,
    momRating: ratingRes.momRating,
    homeSubEvents: homeSubRes.subEvents || [],
    awaySubEvents: awaySubRes.subEvents || [],
    redCardEvents
  };
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
  for (const club of getAllManagedLeagueClubs()) {
    for (const p of (club.players || [])) {
      if (p.injuryWeeks && p.injuryWeeks > 0) {
        p.injuryWeeks = Math.max(0, p.injuryWeeks - 1);
      }
    }
  }
}

/**
 * 1節分（10試合）を進行する
 */
function playQuickMatchResult() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;
  if (!isTodayMatchDayPending()) return;
  const playerClub = getPlayerClub();
  if (playerClub) {
    if (gameState.managerDelegationEnabled) {
      applyManagerPreMatchDelegation(playerClub, true);
    } else {
      ensureValidSquadAndStarters(playerClub);
    }
  }
  closeMatchPrecheckModal();
  playCurrentMatchday(false, true);
}

function playNextMatchweek(skipAnimation = false, quickSummary = false) {
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

    if (typeof optimizeClubStarters === 'function') {
      if (!homeClub.isPlayer) optimizeClubStarters(homeClub);
      if (!awayClub.isPlayer) optimizeClubStarters(awayClub);
    }

    const simResult = simulateMatch(homeClub, awayClub);
    const {
      homeScore, awayScore, homePossession, awayPossession, homeShots, awayShots,
      homeOnTarget, awayOnTarget, homeXg, awayXg, homePasses, awayPasses, homePassAccuracy, awayPassAccuracy
    } = simResult;
    match.homeRedCard = Boolean(simResult.homeRedCard);
    match.awayRedCard = Boolean(simResult.awayRedCard);
    match.homeRedMinute = simResult.homeRedMinute || null;
    match.awayRedMinute = simResult.awayRedMinute || null;
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

    const leagueCompKey = isPlayerInSecondDivision() ? 'd2' : 'd1';
    const { homeScorers, awayScorers, momPlayer, momClub, momRating } = processMatchScorersAndRatings(match, homeClub, awayClub, homeScore, awayScore, leagueCompKey);
    match.homeScorers = homeScorers;
    match.awayScorers = awayScorers;
    match.momPlayer = momPlayer;
    match.momClub = momClub;
    match.momRating = momRating;

    const matchObj = {
      week: weekIndex + 1,
      homeClub,
      awayClub,
      homeScore,
      awayScore,
      momPlayer,
      momClub,
      momRating,
      homeSubEvents: match.homeSubEvents || [],
      awaySubEvents: match.awaySubEvents || [],
      redCardEvents: match.redCardEvents || [],
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
    }, { quickSummary });
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
 * クラブの国コード等から NATIONALITY_NAME_DATABASE の国籍キーへ解決
 */
function resolveClubCountryToNationality(countryCode, clubId = '') {
  const code = String(countryCode || '').toUpperCase();
  const map = {
    ENG: 'England',
    ESP: 'Spain',
    GER: 'Germany',
    ITA: 'Italy',
    FRA: 'France',
    NED: 'Netherlands',
    POR: 'Portugal',
    BEL: 'Belgium',
    BRA: 'Brazil',
    ARG: 'Argentina',
    CRO: 'Croatia',
    JPN: 'Japan'
  };
  if (map[code]) return map[code];
  const cid = String(clubId || '').toLowerCase();
  if (cid.startsWith('es') || cid.includes('madrid')) return 'Spain';
  if (cid.startsWith('de') || cid.includes('bayern')) return 'Germany';
  if (cid.startsWith('it') || cid.includes('milan')) return 'Italy';
  if (cid.startsWith('fr') || cid.includes('paris')) return 'France';
  return 'England';
}

/**
 * シード値に基づき NATIONALITY_NAME_DATABASE から決定論的にアルファベット選手名を生成
 */
function generateDeterministicAlphabetPlayerIdentity(seedBase, slotIdx, homeNationality, usedNames = null) {
  const natList = (typeof NATIONALITIES !== 'undefined' && Array.isArray(NATIONALITIES) && NATIONALITIES.length > 0)
    ? NATIONALITIES
    : Object.keys(NATIONALITY_NAME_DATABASE);
  const isHomeNat = (slotIdx % 3 !== 2);
  const rawNat = isHomeNat
    ? homeNationality
    : natList[(seedBase + slotIdx * 11) % natList.length];
  const natKey = NATIONALITY_NAME_DATABASE[rawNat] ? rawNat : 'England';
  const natData = NATIONALITY_NAME_DATABASE[natKey] || NATIONALITY_NAME_DATABASE.England;
  const firstPool = natData.firstNames;
  const lastPool = natData.lastNames;

  for (let attempt = 0; attempt < lastPool.length; attempt++) {
    const fIdx = (seedBase + slotIdx * 7 + attempt * 3) % firstPool.length;
    const lIdx = (seedBase + slotIdx * 13 + attempt * 5) % lastPool.length;
    const firstName = firstPool[fIdx];
    const lastName = lastPool[lIdx];
    const displayName = `${firstName.charAt(0)}. ${lastName}`;
    const fullName = `${firstName} ${lastName}`;
    if (!usedNames || (!usedNames.has(displayName) && !usedNames.has(fullName))) {
      if (usedNames) {
        usedNames.add(displayName);
        usedNames.add(fullName);
      }
      return { displayName, fullName, nationality: natKey };
    }
  }

  const fallbackFirst = firstPool[(seedBase + slotIdx) % firstPool.length];
  const fallbackLast = lastPool[(seedBase + slotIdx * 3) % lastPool.length];
  return {
    displayName: `${fallbackFirst.charAt(0)}. ${fallbackLast}`,
    fullName: `${fallbackFirst} ${fallbackLast}`,
    nationality: natKey
  };
}

/**
 * 試合相手クラブ（他国クラブや2部クラブなど）のスタメン配列を保証
 */
function ensureClubStartersForMatch(club) {
  if (!club) return [];
  const legacyPreIdMap = { pre_leeds: 'c02', pre_sheff: 'c01' };
  const lookupId = legacyPreIdMap[club.id] || club.id;
  const managedRef = (lookupId && typeof getClubById === 'function') ? getClubById(lookupId) : null;
  const targetClub = (managedRef && Array.isArray(managedRef.players) && managedRef.players.length >= 11) ? managedRef : club;

  const seedBase = String(targetClub.id || targetClub.name || 'club').split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 7);
  const homeNat = resolveClubCountryToNationality(targetClub.country, targetClub.id);

  // 旧データのカタカナ仮想選手名が残っている場合はアルファベット名へ自動変換
  if (Array.isArray(targetClub.players) && targetClub.players.some(p => p && /[\u30A0-\u30FF]/.test(p.name || ''))) {
    const usedFixNames = new Set();
    targetClub.players.forEach((p, idx) => {
      if (p && !/[\u30A0-\u30FF]/.test(p.name || '')) {
        usedFixNames.add(p.name);
        if (p.fullName) usedFixNames.add(p.fullName);
      } else if (p) {
        const ident = generateDeterministicAlphabetPlayerIdentity(seedBase, idx, homeNat, usedFixNames);
        p.name = ident.displayName;
        p.fullName = ident.fullName;
        p.nationality = p.nationality || ident.nationality;
      }
    });
  }

  if (targetClub.players && targetClub.players.length >= 11) {
    if (typeof ensureValidSquadAndStarters === 'function' && targetClub.isPlayer) {
      ensureValidSquadAndStarters(targetClub);
    }
    // スタメン11名を厳格に抽出
    const starters = targetClub.players.filter(p => p.isStarter && !p.isRetired);
    if (starters.length === 11) return starters;
    if (starters.length > 0 && starters.length <= 11) {
      const remaining = targetClub.players.filter(p => !starters.some(s => s.id === p.id) && !p.isRetired);
      return starters.concat(remaining.slice(0, 11 - starters.length));
    }
    return targetClub.players.slice(0, 11);
  }
  if (!targetClub.players || targetClub.players.length === 0) {
    const baseP = targetClub.basePower || targetClub.ovr || 74;
    const positions = ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'AM', 'LW', 'CF', 'RW'];
    const defaultSquadNumbers = [1, 3, 4, 5, 2, 6, 8, 10, 11, 9, 7];
    const canonicalEuroIdMap = { pre_madrid: 'es01', pre_bayern: 'de01', pre_milan: 'it01', pre_paris: 'fr01' };
    const euroLookupId = canonicalEuroIdMap[targetClub.id] || targetClub.id;
    const affiliatedEuro = Array.isArray(gameState.euroTransferList)
      ? gameState.euroTransferList.filter(ep => ep && (ep.euroClubId === euroLookupId || ep.clubId === euroLookupId))
      : [];
    const usedEuroIds = new Set();
    const usedNames = new Set();
    affiliatedEuro.forEach(ep => {
      if (ep && ep.name) usedNames.add(ep.name);
      if (ep && ep.fullName) usedNames.add(ep.fullName);
    });

    targetClub.players = positions.map((pos, idx) => {
      const matchEp = affiliatedEuro.find(ep => !usedEuroIds.has(ep.id) && (ep.pos === pos || POS_ROLE_GROUP[ep.pos] === POS_ROLE_GROUP[pos]));
      if (matchEp) {
        usedEuroIds.add(matchEp.id);
        if (!matchEp.assignedPos) matchEp.assignedPos = pos;
        return matchEp;
      }
      const ident = generateDeterministicAlphabetPlayerIdentity(seedBase, idx, homeNat, usedNames);
      const offset = ((seedBase + idx * 7) % 7) - 3;
      const age = 21 + ((seedBase + idx * 5) % 11);
      const preferredFoot = (pos === 'LB' || pos === 'LW') ? 'Left' : (((seedBase + idx) % 5 === 0) ? 'Left' : 'Right');
      return {
        id: `${targetClub.id}_p${idx + 1}`,
        name: ident.displayName,
        fullName: ident.fullName,
        nationality: ident.nationality,
        age,
        preferredFoot,
        squadNumber: defaultSquadNumbers[idx] || (idx + 1),
        pos: pos,
        primaryPosition: pos,
        secondaryPositions: [],
        assignedPos: pos,
        atk: Math.round(baseP + offset),
        def: Math.round(baseP - offset),
        sta: 90,
        isStarter: true,
        slotIndex: idx,
        appearances: 0,
        goals: 0,
        assists: 0,
        lastMatchRating: 6.7
      };
    });
  }
  return targetClub.players.slice(0, 11);
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

  // 2.5 退場（レッドカード）および自動選手交代イベントをタイムラインへ配置
  const redEvs = Array.isArray(matchData.redCardEvents) ? matchData.redCardEvents : [];
  redEvs.forEach(rc => {
    if (!rc || !rc.player) return;
    const min = getFreeMinute(rc.minute || 55, (rc.minute || 55) <= 45);
    const isHome = rc.clubId === homeClub.id;
    const cName = isHome ? homeClub.name : awayClub.name;
    const ev = {
      minute: min,
      type: 'red',
      side: isHome ? 'home' : 'away',
      club: isHome ? homeClub : awayClub,
      actor: rc.player,
      text: `🟥 RED CARD!! ${cName} ${fmtNum(rc.player)}${rc.player.name} が一発退場！残りを10人で戦う厳しい展開！`
    };
    byMinute[min] = ev;
    highlights.push(ev);
  });

  const allSubs = [
    ...(Array.isArray(matchData.homeSubEvents) ? matchData.homeSubEvents.map(s => ({ ...s, side: 'home', club: homeClub })) : []),
    ...(Array.isArray(matchData.awaySubEvents) ? matchData.awaySubEvents.map(s => ({ ...s, side: 'away', club: awayClub })) : [])
  ];
  allSubs.forEach(sub => {
    if (!sub || !sub.inPlayer || !sub.outPlayer) return;
    const min = getFreeMinute(sub.minute || 68, false);
    const ev = {
      minute: min,
      type: 'sub',
      side: sub.side,
      club: sub.club,
      actor: sub.inPlayer,
      text: `🔄 選手交代 [${sub.club.name}] OUT ${fmtNum(sub.outPlayer)}${sub.outPlayer.name} ➔ IN ${fmtNum(sub.inPlayer)}${sub.inPlayer.name}`
    };
    byMinute[min] = ev;
  });

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
      } else if (ev.type === 'sub') {
        appendLiveCommentary(`${min}'`, ev.text, 'ev-sub');
      } else if (ev.type === 'red') {
        appendLiveCommentary(`${min}'`, ev.text, 'ev-red');
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

    // ★ 前半45分到達時：環境設定「ハーフタイム自動進行」がONなら自動で後半開始、OFFなら一時停止
    if (min === 45 && matchLiveState.status === 'FIRST_HALF') {
      clearInterval(matchLiveState.timerId);
      matchLiveState.timerId = null;
      matchLiveState.status = 'HALFTIME';

      if (appSettings.autoHalftimeResume) {
        appendLiveCommentary(`45'`, '前半終了！ハーフタイム自動進行によりそのまま後半へ入ります。', 'ev-period');
        resumeSecondHalfMatch();
        return;
      }

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
  const buildSubEntries = (club, evList, fallbackList) => {
    if (Array.isArray(evList) && evList.length > 0) {
      return evList.map(ev => {
        const fullP = (club && club.players && ev.inPlayer) ? (club.players.find(x => x.id === ev.inPlayer.id) || ev.inPlayer) : ev.inPlayer;
        return { p: fullP, inMinute: ev.minute || 68 };
      }).filter(x => x.p);
    }
    return (fallbackList || []).map(p => ({ p, inMinute: p.lastMatchSubMinute || 68 }));
  };
  const homeSubEntries = buildSubEntries(homeClub, md && md.homeSubEvents, (typeof matchLiveState !== 'undefined' && matchLiveState.homeSubs) ? matchLiveState.homeSubs : []);
  const awaySubEntries = buildSubEntries(awayClub, md && md.awaySubEvents, (typeof matchLiveState !== 'undefined' && matchLiveState.awaySubs) ? matchLiveState.awaySubs : []);
  const homeScorers = md.homeScorers || [];
  const awayScorers = md.awayScorers || [];

  const POS_ORDER = {
    GK: 1,
    CB: 2, LB: 3, RB: 4, LWB: 5, RWB: 6,
    DM: 7, CM: 8, LM: 9, RM: 10, AM: 11,
    LW: 12, RW: 13, CF: 14, ST: 15
  };

  const renderClubList = (club, starters, subEntries, scorers, isHome) => {
    // スタメン11名をポジション順に整列
    const sortedStarters = [...starters].sort((a, b) => {
      const posA = a.assignedPos || a.pos || 'MF';
      const posB = b.assignedPos || b.pos || 'MF';
      return (POS_ORDER[posA] || 99) - (POS_ORDER[posB] || 99);
    });

    const starterIds = new Set(sortedStarters.map(p => p.id));
    const filteredSubs = (subEntries || []).filter(se => se.p && !starterIds.has(se.p.id));

    const buildRowHtml = ({ p, isSub, inMinute }) => {
      const pos = p.assignedPos || p.pos || 'MF';
      const rat = typeof p.lastMatchRating === 'number' ? p.lastMatchRating.toFixed(1) : '6.7';
      const numRat = Number(rat);

      const explicitMomId = (md && md.momPlayer && md.momPlayer.id) ? md.momPlayer.id : null;
      const isMomPlayer = explicitMomId ? (p.id === explicitMomId) : Boolean(p.isMOM);

      let ratClass = 'summary-rat-mid';
      if (isMomPlayer || numRat >= 8.2) ratClass = 'summary-rat-mom';
      else if (numRat >= 7.0) ratClass = 'summary-rat-high';
      else if (numRat < 6.0) ratClass = 'summary-rat-low';

      const goalsCount = scorers.filter(s => s && s.scorer && s.scorer.id === p.id).length;
      const assistsCount = scorers.filter(s => s && s.assister && s.assister.id === p.id).length;

      let eventBadges = '';
      if (goalsCount > 0) eventBadges += `<span class="rating-event-badge goal" title="${goalsCount}得点">⚽${goalsCount > 1 ? goalsCount : ''}</span>`;
      if (assistsCount > 0) eventBadges += `<span class="rating-event-badge assist" title="${assistsCount}アシスト">🅰️${assistsCount > 1 ? assistsCount : ''}</span>`;

      const momBadge = isMomPlayer ? '<span class="rating-mom-crown" title="★ MAN OF THE MATCH">👑</span>' : '';
      const playedMins = isSub ? Math.max(1, 90 - (inMinute || 68)) : 90;
      const subBadge = isSub ? `<span class="rating-sub-tag" title="${inMinute || 68}分から途中出場">IN ${inMinute || 68}' (${playedMins}分)</span>` : '';

      return `
        <div class="summary-rating-row ${isMomPlayer ? 'is-mom-row' : ''}">
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
    };

    const starterRowsHtml = sortedStarters.map(p => buildRowHtml({ p, isSub: false, inMinute: 0 })).join('');
    const subRowsHtml = filteredSubs.length > 0
      ? filteredSubs.map(se => buildRowHtml({ p: se.p, isSub: true, inMinute: se.inMinute })).join('')
      : '<div class="summary-rating-empty text-muted mono">途中交代出場なし</div>';

    const all = sortedStarters.map(p => ({ p })).concat(filteredSubs.map(se => ({ p: se.p })));
    const avgRat = (all.reduce((s, x) => s + (x.p.lastMatchRating || 6.7), 0) / Math.max(1, all.length)).toFixed(1);
    const sideKey = isHome ? 'home' : 'away';
    const isHidden = sideKey !== defaultTeam;

    return `
      <div class="summary-team-ratings-panel ${club.isPlayer ? 'is-player' : ''} ${isHidden ? 'hidden' : ''}" data-ratings-panel="${sideKey}">
        <div class="summary-team-ratings-title">
          <div class="team-title-left">
            ${getClubEmblemSvg(club, 20, 'team-ratings-emblem')}
            <span class="team-title-code mono">${getClubShortCode(club)}</span>
            <span class="team-title-side mono">${isHome ? 'HOME' : 'AWAY'}${club.isPlayer ? ' (YOU)' : ''}</span>
          </div>
          <span class="team-title-avg mono">平均採点: <strong class="accent-green">${avgRat}</strong></span>
        </div>
        <div class="summary-ratings-group-label mono">▼ スターティングメンバー (${sortedStarters.length}名)</div>
        <div class="summary-team-ratings-list">
          ${starterRowsHtml}
        </div>
        <div class="summary-ratings-group-label mono" style="margin-top: 10px;">▼ 控え・途中交代出場 (${filteredSubs.length}名)</div>
        <div class="summary-team-ratings-list">
          ${subRowsHtml}
        </div>
      </div>
    `;
  };

  const defaultTeam = (awayClub && awayClub.isPlayer && !(homeClub && homeClub.isPlayer)) ? 'away' : 'home';

  return `
    <div class="summary-ratings-team-tabs">
      <button type="button" class="summary-team-tab-btn ${defaultTeam === 'home' ? 'active' : ''}" data-ratings-team="home">
        ${getClubEmblemSvg(homeClub, 16)}
        <span class="mono">${getClubShortCode(homeClub)} (HOME)${homeClub.isPlayer ? ' ★' : ''}</span>
      </button>
      <button type="button" class="summary-team-tab-btn ${defaultTeam === 'away' ? 'active' : ''}" data-ratings-team="away">
        ${getClubEmblemSvg(awayClub, 16)}
        <span class="mono">${getClubShortCode(awayClub)} (AWAY)${awayClub.isPlayer ? ' ★' : ''}</span>
      </button>
    </div>
    <div class="summary-ratings-grid" style="grid-template-columns: 1fr;">
      ${renderClubList(homeClub, homeStarters, homeSubEntries, homeScorers, true)}
      ${renderClubList(awayClub, awayStarters, awaySubEntries, awayScorers, false)}
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

  // 枠内シュート数・xG・パス数の取得または算出（必ず スコア <= 枠内シュート <= 総シュート数 を保証）
  const safeHomeShots = Math.max(homeScore, typeof homeShots === 'number' ? homeShots : homeScore);
  const safeAwayShots = Math.max(awayScore, typeof awayShots === 'number' ? awayShots : awayScore);
  const rawHomeOnTarget = typeof md.homeOnTarget === 'number' ? md.homeOnTarget : Math.round(safeHomeShots * 0.48);
  const rawAwayOnTarget = typeof md.awayOnTarget === 'number' ? md.awayOnTarget : Math.round(safeAwayShots * 0.48);
  const homeOnTarget = Math.max(homeScore, Math.min(safeHomeShots, rawHomeOnTarget));
  const awayOnTarget = Math.max(awayScore, Math.min(safeAwayShots, rawAwayOnTarget));
  const homeXg = typeof md.homeXg === 'number' ? md.homeXg : Number((homeScore * 0.72 + safeHomeShots * 0.08).toFixed(2));
  const awayXg = typeof md.awayXg === 'number' ? md.awayXg : Number((awayScore * 0.72 + safeAwayShots * 0.08).toFixed(2));
  const homePasses = typeof md.homePasses === 'number' ? md.homePasses : Math.round(840 * (homePossession / 100));
  const awayPasses = typeof md.awayPasses === 'number' ? md.awayPasses : Math.round(840 * (awayPossession / 100));
  const homePassAccuracy = typeof md.homePassAccuracy === 'number' ? md.homePassAccuracy : 82;
  const awayPassAccuracy = typeof md.awayPassAccuracy === 'number' ? md.awayPassAccuracy : 78;

  const totalShots = Math.max(1, safeHomeShots + safeAwayShots);
  const homeShotsPct = Math.round((safeHomeShots / totalShots) * 100);
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

  // MOM（最優秀選手）選出（全選手評価点一覧の王冠と完全同期）
  let momPlayer = md.momPlayer;
  let momClub = md.momClub || homeClub;
  let momRating = md.momRating || null;

  if (momPlayer && momPlayer.id) {
    const fullHome = (homeClub && Array.isArray(homeClub.players)) ? homeClub.players.find(p => p.id === momPlayer.id) : null;
    const fullAway = (awayClub && Array.isArray(awayClub.players)) ? awayClub.players.find(p => p.id === momPlayer.id) : null;
    if (fullHome) {
      momPlayer = fullHome;
      momClub = homeClub;
    } else if (fullAway) {
      momPlayer = fullAway;
      momClub = awayClub;
    }
  }

  if (!momPlayer && homeClub && awayClub) {
    const hStarters = ensureClubStartersForMatch(homeClub);
    const aStarters = ensureClubStartersForMatch(awayClub);
    const hSubs = (typeof matchLiveState !== 'undefined' && Array.isArray(matchLiveState.homeSubs)) ? matchLiveState.homeSubs : [];
    const aSubs = (typeof matchLiveState !== 'undefined' && Array.isArray(matchLiveState.awaySubs)) ? matchLiveState.awaySubs : [];
    const isHomeWin = homeScore > awayScore;
    const isAwayWin = awayScore > homeScore;
    const allGoals = homeScorers.concat(awayScorers);

    const allPlayed = [
      ...hStarters.map(p => ({ p, club: homeClub, isWinner: isHomeWin })),
      ...aStarters.map(p => ({ p, club: awayClub, isWinner: isAwayWin })),
      ...hSubs.map(p => ({ p, club: homeClub, isWinner: isHomeWin })),
      ...aSubs.map(p => ({ p, club: awayClub, isWinner: isAwayWin }))
    ];

    const flaggedMom = allPlayed.find(x => x.p && x.p.isMOM);
    if (flaggedMom) {
      momPlayer = flaggedMom.p;
      momClub = flaggedMom.club;
    } else if (allPlayed.length > 0) {
      allPlayed.sort((a, b) => {
        const ratDiff = (b.p.lastMatchRating || 6.7) - (a.p.lastMatchRating || 6.7);
        if (Math.abs(ratDiff) > 0.01) return ratDiff;
        if (a.isWinner !== b.isWinner) return b.isWinner ? 1 : -1;
        const gA = allGoals.filter(s => s && s.scorer && s.scorer.id === a.p.id).length;
        const gB = allGoals.filter(s => s && s.scorer && s.scorer.id === b.p.id).length;
        if (gB !== gA) return gB - gA;
        return (b.p.goals || 0) - (a.p.goals || 0);
      });
      momPlayer = allPlayed[0].p;
      momClub = allPlayed[0].club;
    }
    if (momPlayer) {
      md.momPlayer = momPlayer;
      md.momClub = momClub;
      momRating = (typeof momPlayer.lastMatchRating === 'number') ? momPlayer.lastMatchRating.toFixed(1) : '7.5';
      md.momRating = momRating;
    }
  }
  if (!momRating) {
    momRating = (momPlayer && typeof momPlayer.lastMatchRating === 'number')
      ? momPlayer.lastMatchRating.toFixed(1)
      : '7.5';
    md.momRating = momRating;
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
          試合結果・チームスタッツ
        </button>
        <button type="button" class="summary-subnav-btn" data-subnav="ratings">
          全選手評価点一覧
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
                  <span style="color:#2ecc71;">${safeHomeShots}本 (${homeOnTarget})</span>
                  <span style="color:var(--text-muted);font-size:9.5px;">シュート / 枠内 (SHOTS / ON TARGET)</span>
                  <span style="color:#60a5fa;">${safeAwayShots}本 (${awayOnTarget})</span>
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
  if (!md.highlights && Array.isArray(matchLiveState.allHighlights) && matchLiveState.allHighlights.length > 0) {
    md.highlights = matchLiveState.allHighlights.slice(0, 3);
  }

  summaryBody.innerHTML = buildMatchSummaryHtml(md);

  bindSummarySubnavEvents(summaryBody);

  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(summaryBody);
  }
}

function bindSummarySubnavEvents(container) {
  if (!container) return;
  const tabBtns = container.querySelectorAll('.summary-subnav-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.subnav;
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      const statsView = container.querySelector('#summary-tab-stats');
      const ratingsView = container.querySelector('#summary-tab-ratings');
      if (statsView) statsView.classList.toggle('hidden', target !== 'stats');
      if (ratingsView) ratingsView.classList.toggle('hidden', target !== 'ratings');
    });
  });

  const teamBtns = container.querySelectorAll('.summary-team-tab-btn');
  teamBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTeam = btn.dataset.ratingsTeam;
      teamBtns.forEach(b => b.classList.toggle('active', b === btn));
      container.querySelectorAll('.summary-team-ratings-panel[data-ratings-panel]').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.ratingsPanel !== targetTeam);
      });
    });
  });
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

  if (gameState.managerDelegationEnabled) {
    applyManagerPreMatchDelegation(playerClub, true);
  } else {
    ensureValidSquadAndStarters(playerClub);
  }

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
          <div class="precheck-delegation-row">
            <span class="precheck-delegation-status mono">${gameState.managerDelegationEnabled ? '指揮: 監督に采配一任中（疲労ローテ適用済）' : '指揮: GM手動設定モード'}</span>
            <button type="button" class="btn btn-manager-delegation mono ${gameState.managerDelegationEnabled ? 'is-active' : ''}" id="btn-precheck-toggle-delegation" style="padding: 3px 8px; font-size: 10.5px;">
              ${gameState.managerDelegationEnabled ? '監督一任: ON' : '監督一任: OFF'}
            </button>
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
  const btnPrecheckDelegation = document.getElementById('btn-precheck-toggle-delegation');
  if (btnPrecheckDelegation) {
    btnPrecheckDelegation.onclick = () => {
      toggleManagerDelegation();
      openMatchPrecheckModal();
    };
  }
  const btnGotoRoster = document.getElementById('btn-precheck-goto-roster');
  if (btnGotoRoster) {
    btnGotoRoster.onclick = () => {
      closeMatchPrecheckModal();
      switchTab('roster');
    };
  }
  const btnQuickResult = document.getElementById('btn-precheck-quick-result');
  if (btnQuickResult) {
    btnQuickResult.onclick = () => {
      playQuickMatchResult();
    };
  }
  const btnStartMatch = document.getElementById('btn-precheck-start-match');
  if (btnStartMatch) {
    btnStartMatch.onclick = () => {
      closeMatchPrecheckModal();
      playCurrentMatchday(false, false);
    };
  }

  document.documentElement.classList.add('modal-locked');
  document.body.classList.add('modal-locked');
  modal.classList.remove('hidden');
}

/**
 * 試合モーダル（Phase 1: サッカーコート試合経過 ➔ Phase 2: マッチサマリー）を開く
 */
function openMatchEventModal(matchData, homeScorers, awayScorers, onComplete, options = {}) {
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
  if (options && options.quickSummary) {
    transitionToMatchSummary();
  } else {
    startMatchLiveTimer();
  }
}

