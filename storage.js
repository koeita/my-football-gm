'use strict';

/**
 * storage.js - セーブ＆ロード、デバウンス遅延オートセーブ、環境設定、キャリア殿堂記録、メインメニュー＆誤リロード防止
 */

const SAVE_STORAGE_KEY = 'my_football_gm_save_v1';
const RECORDS_STORAGE_KEY = 'my_football_gm_records_v1';
const SETTINGS_STORAGE_KEY = 'my_football_gm_settings_v1';

const appSettings = {
  soundVolume: 70,
  autoSaveEnabled: true,
  matchSpeed: 2,
  autoHalftimeResume: false
};

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.soundVolume === 'number') appSettings.soundVolume = parsed.soundVolume;
      if (typeof parsed.autoSaveEnabled === 'boolean') appSettings.autoSaveEnabled = parsed.autoSaveEnabled;
      if (typeof parsed.matchSpeed === 'number') appSettings.matchSpeed = parsed.matchSpeed;
      if (typeof parsed.autoHalftimeResume === 'boolean') appSettings.autoHalftimeResume = parsed.autoHalftimeResume;
    }
  } catch (e) {}
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
  } catch (e) {}
}

let autoSaveDebounceTimer = null;
let autoSaveDirty = false;
let hasShownStorageQuotaWarning = false;

function scheduleAutoSave(delayMs = 400) {
  if (!appSettings.autoSaveEnabled) return;
  autoSaveDirty = true;
  if (autoSaveDebounceTimer) {
    clearTimeout(autoSaveDebounceTimer);
  }
  autoSaveDebounceTimer = setTimeout(() => {
    autoSaveDebounceTimer = null;
    saveGameToStorage(false);
  }, delayMs);
}

function flushPendingAutoSave() {
  if (autoSaveDebounceTimer || autoSaveDirty) {
    if (autoSaveDebounceTimer) {
      clearTimeout(autoSaveDebounceTimer);
      autoSaveDebounceTimer = null;
    }
    if (gameState.hasStartedOnce) {
      saveGameToStorage(false);
    }
  }
}

if (typeof window !== 'undefined' && !window.__autoSaveUnloadBound) {
  window.__autoSaveUnloadBound = true;
  window.addEventListener('pagehide', flushPendingAutoSave);
  window.addEventListener('beforeunload', flushPendingAutoSave);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingAutoSave();
      }
    });
  }
}

function saveGameToStorage(force = false) {
  if (autoSaveDebounceTimer) {
    clearTimeout(autoSaveDebounceTimer);
    autoSaveDebounceTimer = null;
  }
  if (!force && !appSettings.autoSaveEnabled) return false;
  if (!gameState.clubs || gameState.clubs.length === 0) return false;
  try {
    const payload = {
      version: '1.1.0',
      savedAt: Date.now(),
      playerIdCounter,
      state: {
        gmName: gameState.gmName,
        selectedClubId: gameState.selectedClubId,
        hasStartedOnce: true,
        season: gameState.season,
        playerDivision: gameState.playerDivision || (isPlayerInSecondDivision() ? 'd2' : 'd1'),
        currentWeek: gameState.currentWeek,
        totalWeeks: gameState.totalWeeks,
        isSeasonOver: gameState.isSeasonOver,
        isGameOver: gameState.isGameOver,
        consecutiveDeficitSeasons: gameState.consecutiveDeficitSeasons,
        paidPayrollWeeks: gameState.paidPayrollWeeks || 0,
        managerDelegationEnabled: Boolean(gameState.managerDelegationEnabled),
        d2PowerCalibratedV1: Boolean(gameState.d2PowerCalibratedV1),
        lastSeasonStandingsOrder: gameState.lastSeasonStandingsOrder || null,
        lastSeasonCupWinners: gameState.lastSeasonCupWinners || null,
        lastPromotionRelegation: gameState.lastPromotionRelegation || null,
        d1BackgroundSchedule: gameState.d1BackgroundSchedule || null,
        activeTab: gameState.activeTab || 'office',
        rosterSubtab: gameState.rosterSubtab || 'board',
        teamSubtab: gameState.teamSubtab || 'standings',
        selectedCompView: gameState.selectedCompView || 'league',
        selectedLeagueDivision: gameState.selectedLeagueDivision || null,
        selectedDomesticCup: gameState.selectedDomesticCup || 'leagueCup',
        selectedEuropeanCup: gameState.selectedEuropeanCup || 'championsCup',
        euroViewMode: gameState.euroViewMode || 'standings',
        competitionStats: gameState.competitionStats || {},
        statsCompView: gameState.statsCompView || 'league',
        statsLeagueDivision: gameState.statsLeagueDivision || null,
        statsDomesticCup: gameState.statsDomesticCup || 'leagueCup',
        statsEuroCup: gameState.statsEuroCup || null,
        clubs: gameState.clubs,
        schedule: gameState.schedule,
        calendar: gameState.calendar,
        competitions: gameState.competitions,
        currentDayIndex: gameState.currentDayIndex,
        dailyLogs: gameState.dailyLogs,
        lastWeekResults: gameState.lastWeekResults,
        lastMatchTicker: gameState.lastMatchTicker,
        matchHistory: gameState.matchHistory || [],
        transferMarket: gameState.transferMarket,
        euroTransferList: gameState.euroTransferList || [],
        youthCandidates: gameState.youthCandidates,
        activeYouthScouts: gameState.activeYouthScouts || [],
        youthScoutReports: gameState.youthScoutReports || [],
        freeManagers: gameState.freeManagers || [],
        freeCoaches: gameState.freeCoaches || null,
        facilities: gameState.facilities,
        lastSettlement: gameState.lastSettlement,
        incomingOffers: gameState.incomingOffers || [],
        outgoingOffers: gameState.outgoingOffers || [],
        offersSubtab: gameState.offersSubtab || 'incoming',
        targetShortlist: gameState.targetShortlist || [],
        preContractPlayers: gameState.preContractPlayers || [],
        hasPreContractDepartureThisSeason: Boolean(gameState.hasPreContractDepartureThisSeason),
        incomingTransferOffer: gameState.incomingTransferOffer || null,
        pendingMegaOffer: gameState.pendingMegaOffer || null,
        facilitiesSubtab: gameState.facilitiesSubtab || 'investment',
        marketSubtab: gameState.marketSubtab || 'market',
        marketFilter: gameState.marketFilter || { category: 'ALL', clubId: 'ALL', position: 'ALL', sortKey: 'ovr-desc', searchQuery: '' },
        scoutingIntel: gameState.scoutingIntel || {},
        activeScoutAssignments: gameState.activeScoutAssignments || [],
        installments: gameState.installments || [],
        sellOnRights: gameState.sellOnRights || [],
        intlBreakState: gameState.intlBreakState || null,
        pendingBoardCrisis: Boolean(gameState.pendingBoardCrisis),
        pendingDeadlineOffer: Boolean(gameState.pendingDeadlineOffer)
      }
    };
    if (typeof dehydrateCompetitionsForSave === 'function') {
      payload.state.competitions = dehydrateCompetitionsForSave(gameState.competitions);
    }
    const slimScorerEntry = (s) => {
      if (!s || typeof s !== 'object') return s;
      return {
        minute: s.minute,
        name: s.name || (s.scorer && s.scorer.name) || '',
        scorer: s.scorer ? { id: s.scorer.id, name: s.scorer.name } : null,
        assister: s.assister ? { id: s.assister.id, name: s.assister.name } : null
      };
    };
    const slimMatchList = (arr) => (arr || []).map(r => ({
      ...r,
      homeClub: r.homeClub ? { id: r.homeClub.id, name: r.homeClub.name, shortCode: r.homeClub.shortCode, isPlayer: r.homeClub.isPlayer, primaryColor: r.homeClub.primaryColor, secondaryColor: r.homeClub.secondaryColor, emblem: r.homeClub.emblem } : null,
      awayClub: r.awayClub ? { id: r.awayClub.id, name: r.awayClub.name, shortCode: r.awayClub.shortCode, isPlayer: r.awayClub.isPlayer, primaryColor: r.awayClub.primaryColor, secondaryColor: r.awayClub.secondaryColor, emblem: r.awayClub.emblem } : null,
      momPlayer: r.momPlayer ? { id: r.momPlayer.id, name: r.momPlayer.name, squadNumber: r.momPlayer.squadNumber, pos: r.momPlayer.pos, assignedPos: r.momPlayer.assignedPos } : null,
      momClub: r.momClub ? { id: r.momClub.id, name: r.momClub.name, shortCode: r.momClub.shortCode, isPlayer: r.momClub.isPlayer, primaryColor: r.momClub.primaryColor, secondaryColor: r.momClub.secondaryColor, emblem: r.momClub.emblem } : null,
      homeScorers: Array.isArray(r.homeScorers) ? r.homeScorers.map(slimScorerEntry) : [],
      awayScorers: Array.isArray(r.awayScorers) ? r.awayScorers.map(slimScorerEntry) : []
    }));
    payload.state.lastWeekResults = slimMatchList(gameState.lastWeekResults);
    payload.state.matchHistory = slimMatchList(gameState.matchHistory);
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    } catch (storageErr) {
      const isQuotaErr = storageErr && (
        storageErr.name === 'QuotaExceededError'
        || storageErr.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || storageErr.code === 22
        || storageErr.code === 1014
      );
      if (!isQuotaErr) throw storageErr;
      // 容量上限エラー時は履歴・ログを段階的に圧縮してリトライ
      payload.state.matchHistory = payload.state.matchHistory.slice(-15);
      payload.state.lastWeekResults = [];
      payload.state.dailyLogs = Array.isArray(payload.state.dailyLogs) ? payload.state.dailyLogs.slice(0, 30) : [];
      if (Array.isArray(payload.state.calendar)) {
        payload.state.calendar = payload.state.calendar.map(d => {
          if (!d || !d.matchResult) return d;
          return { ...d, matchResult: { ...d.matchResult, scorers: [] } };
        });
      }
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    }
    autoSaveDirty = false;
    updateCareerRecordsFromCurrentState();
    return true;
  } catch (e) {
    console.error('[saveGameToStorage] Failed to save game:', e);
    if (!hasShownStorageQuotaWarning && typeof addDailyLog === 'function') {
      hasShownStorageQuotaWarning = true;
      addDailyLog('【システム警告】ブラウザの保存容量上限によりオートセーブに失敗しました。不要なタブや履歴を整理してください。');
    }

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
    const d2Clubs = st.competitions && st.competitions.championship && st.competitions.championship.clubs;
    const playerClub = st.clubs.find(c => c && c.isPlayer)
      || (Array.isArray(d2Clubs) ? d2Clubs.find(c => c && c.isPlayer) : null)
      || st.clubs[0];
    const clubName = playerClub ? playerClub.name : 'チェルシー B';
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

const LEGACY_CLUB_NAME_MIGRATIONS = {
  'マンチェスター・B': 'マンチェスター B',
  'マンチェスター・R': 'マンチェスター R',
  'リバプール・B': 'リヴァプール R',
  'ノースロンドン・A': 'アーセナル A',
  'ロンドン・FC': 'チェルシー B',
  'ノースロンドン・W': 'トッテナム W',
  'ニューカッスル・U': 'ニューカッスル K',
  'アストン・V': 'アストンヴィラ V',
  'ブライトン・G': 'ブライトン G',
  'イーストロンドン・H': 'ウェストハム W',
  'サウスロンドン・P': 'クリスタルパレス P',
  'ウェストロンドン・C': 'フラム W',
  'ウェストロンドン・B': 'ブレントフォード B',
  'ミッドランズ・W': 'ウルヴァーハンプトン G',
  'マージーサイド・B': 'エヴァートン B',
  'サウスコースト・C': 'ボーンマス C',
  'ノッティンガム・R': 'ノッティンガム R',
  'レスター・F': 'レスター B',
  'サウサンプトン・S': 'サウサンプトン R',
  'イプスウィッチ・T': 'イプスウィッチ B',
  'マドリード・ブランコス': 'レアルマドリード W',
  'バルセロナ・カタルーニャ': 'バルセロナ G',
  'ミュンヘン・バヴァリア': 'バイエルン R',
  'ミラノ・ロッソネリ': 'ミラン R',
  'トリノ・ビアンコネリ': 'ユヴェントス W',
  'パリ・メトロポリタン': 'パリ B',
  'シェフィールド・S': 'シェフィールド B',
  'リーズ・U': 'リーズ W',
  'バーンリー・C': 'バーンリー C',
  'ノリッジ・C': 'ノリッジ Y',
  'ワトフォード・H': 'ワトフォード Y',
  'ミドルズブラ・B': 'ミドルズブラ R',
  'ウェストブロム・A': 'ウェストブロム B',
  'コヴェントリー・C': 'コヴェントリー S',
  'プレストン・NE': 'プレストン W',
  'ブリストル・C': 'ブリストル R',
  'ストーク・C': 'ストーク R',
  'スウォンジー・C': 'スウォンジー W',
  'カーディフ・C': 'カーディフ B',
  'ミルウォール・L': 'ミルウォール B',
  'ブラックバーン・R': 'ブラックバーン B',
  'クイーンズパーク・R': 'クイーンズパーク B',
  'ハル・C': 'ハル Y',
  'サンダーランド・A': 'サンダーランド R',
  'バーミンガム・C': 'バーミンガム B'
};

const LEGACY_ID_COMPAT_MAP = {
  eastlondon_h: { name: 'ウェストハム W', shortName: 'WHW' },
  midlands_w: { name: 'ウルヴァーハンプトン G', shortName: 'WLG' },
  leicester_f: { name: 'レスター B', shortName: 'LCB' },
  southampton_s: { name: 'サウサンプトン R', shortName: 'SHR' }
};

function migrateLegacyClubsData() {
  const defById = new Map();
  const registerDefs = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(d => {
      if (d && d.id) defById.set(d.id, d);
    });
  };
  if (typeof CLUB_DEFINITIONS !== 'undefined') registerDefs(CLUB_DEFINITIONS);
  if (typeof EUROPEAN_MEGA_CLUBS !== 'undefined') registerDefs(EUROPEAN_MEGA_CLUBS);
  if (typeof CHAMPIONSHIP_CLUBS_DEFINITIONS !== 'undefined') registerDefs(CHAMPIONSHIP_CLUBS_DEFINITIONS);
  if (typeof SPAIN_CLUBS_DEFINITIONS !== 'undefined') registerDefs(SPAIN_CLUBS_DEFINITIONS);
  if (typeof ITALY_CLUBS_DEFINITIONS !== 'undefined') registerDefs(ITALY_CLUBS_DEFINITIONS);
  if (typeof GERMANY_CLUBS_DEFINITIONS !== 'undefined') registerDefs(GERMANY_CLUBS_DEFINITIONS);
  if (typeof FRANCE_CLUBS_DEFINITIONS !== 'undefined') registerDefs(FRANCE_CLUBS_DEFINITIONS);
  if (typeof OTHER_EURO_CLUBS_DEFINITIONS !== 'undefined') registerDefs(OTHER_EURO_CLUBS_DEFINITIONS);

  const normalizeNameStr = (str) => {
    if (!str || typeof str !== 'string') return str;
    if (LEGACY_CLUB_NAME_MIGRATIONS[str]) return LEGACY_CLUB_NAME_MIGRATIONS[str];
    return str.includes('・') ? str.replace(/・/g, ' ') : str;
  };

  const syncClubObj = (club) => {
    if (!club || typeof club !== 'object') return;
    const def = club.id ? defById.get(club.id) : null;
    const compat = (!def && club.id) ? LEGACY_ID_COMPAT_MAP[club.id] : null;
    if (def) {
      club.name = def.name;
      const code = (typeof CLUB_SHORT_CODES !== 'undefined' && CLUB_SHORT_CODES[club.id]) || def.shortName;
      if (code) {
        club.shortName = code;
        club.shortCode = code;
      }
    } else if (compat) {
      club.name = compat.name;
      club.shortName = compat.shortName;
      club.shortCode = compat.shortName;
    } else if (club.name) {
      club.name = normalizeNameStr(club.name);
    }
    if (club.id && typeof CLUB_EMBLEM_MAP !== 'undefined' && CLUB_EMBLEM_MAP[club.id]) {
      club.emblem = Object.assign({}, CLUB_EMBLEM_MAP[club.id]);
    } else if (club.emblem && club.shortName) {
      club.emblem.code = club.shortName;
      club.emblem.symbol = club.shortName;
    }
    if (Array.isArray(club.players)) {
      club.players.forEach(p => {
        if (p && Array.isArray(p.pastClubs)) {
          p.pastClubs = p.pastClubs.map(normalizeNameStr);
        }
      });
    }
  };

  if (Array.isArray(gameState.clubs)) {
    gameState.clubs.forEach(syncClubObj);
  }
  if (Array.isArray(gameState.freeAgents)) {
    gameState.freeAgents.forEach(p => {
      if (p && Array.isArray(p.pastClubs)) p.pastClubs = p.pastClubs.map(normalizeNameStr);
    });
  }
  if (Array.isArray(gameState.euroTransferList)) {
    gameState.euroTransferList.forEach(p => {
      if (!p) return;
      if (p.clubName) p.clubName = normalizeNameStr(p.clubName);
      if (p.club && typeof p.club === 'object') syncClubObj(p.club);
      if (Array.isArray(p.pastClubs)) p.pastClubs = p.pastClubs.map(normalizeNameStr);
    });
  }
  if (gameState.competitions && typeof gameState.competitions === 'object') {
    for (const comp of Object.values(gameState.competitions)) {
      if (!comp || typeof comp !== 'object') continue;
      if (Array.isArray(comp.clubs)) comp.clubs.forEach(syncClubObj);
      if (Array.isArray(comp.standings)) {
        comp.standings.forEach(row => {
          if (!row) return;
          if (row.club) syncClubObj(row.club);
          if (row.name) row.name = normalizeNameStr(row.name);
          if (row.clubId && defById.has(row.clubId)) row.name = defById.get(row.clubId).name;
        });
      }
      if (Array.isArray(comp.matches)) {
        comp.matches.forEach(m => {
          if (!m) return;
          if (m.homeName) m.homeName = normalizeNameStr(m.homeName);
          if (m.awayName) m.awayName = normalizeNameStr(m.awayName);
        });
      }
    }
  }
  if (Array.isArray(gameState.matchHistory)) {
    gameState.matchHistory.forEach(m => {
      if (!m) return;
      if (m.homeName) m.homeName = normalizeNameStr(m.homeName);
      if (m.awayName) m.awayName = normalizeNameStr(m.awayName);
      if (m.oppName) m.oppName = normalizeNameStr(m.oppName);
      if (m.oppClub) syncClubObj(m.oppClub);
    });
  }
  if (Array.isArray(gameState.calendar)) {
    gameState.calendar.forEach(d => {
      if (d && d.matchResult && d.matchResult.oppClub) {
        syncClubObj(d.matchResult.oppClub);
      }
    });
  }
  ['incomingOffers', 'outgoingOffers'].forEach(key => {
    if (Array.isArray(gameState[key])) {
      gameState[key].forEach(o => {
        if (!o) return;
        if (o.fromClubName) o.fromClubName = normalizeNameStr(o.fromClubName);
        if (o.toClubName) o.toClubName = normalizeNameStr(o.toClubName);
        if (o.clubName) o.clubName = normalizeNameStr(o.clubName);
      });
    }
  });
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
    if (!Array.isArray(gameState.preContractPlayers)) gameState.preContractPlayers = [];
    if (!Array.isArray(gameState.matchHistory)) gameState.matchHistory = [];
    if (!gameState.competitionStats || typeof gameState.competitionStats !== 'object') gameState.competitionStats = {};
    if (!gameState.statsCompView) gameState.statsCompView = 'league';
    if (!Array.isArray(gameState.freeManagers)) gameState.freeManagers = [];
    if (!gameState.marketFilter) {
      gameState.marketFilter = { category: 'ALL', clubId: 'ALL', position: 'ALL', sortKey: 'ovr-desc', searchQuery: '' };
    } else if (!gameState.marketFilter.category) {
      gameState.marketFilter.category = 'ALL';
    }
    if (typeof state.paidPayrollWeeks !== 'number') {
      if (gameState.isSeasonOver) {
        gameState.paidPayrollWeeks = 52;
      } else if (Array.isArray(gameState.calendar)) {
        const elapsedSundays = gameState.calendar
          .slice(0, Math.max(0, (gameState.currentDayIndex || 0) + 1))
          .filter(d => d && d.dayOfWeek === 0).length;
        gameState.paidPayrollWeeks = clamp(elapsedSundays, 0, 52);
      } else {
        gameState.paidPayrollWeeks = 0;
      }
    }
    gameState.managerDelegationEnabled = state.managerDelegationEnabled === undefined ? true : Boolean(state.managerDelegationEnabled);
    gameState.pendingManagerCrisis = false;
    gameState.isSimulating = false;
    gameState.isAdvancingCalendar = false;
    gameState.hasStartedOnce = true;
    markAllViewsDirty();
    syncManagerDelegationButtonUI();

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

    // 大会データの整合性チェック＆クラブ参照の再水和（JSON.parse後のクローン分離を解消）
    if (!gameState.competitions || !gameState.competitions.championsCup) {
      if (typeof initSeasonCompetitions === 'function') {
        initSeasonCompetitions();
      }
    } else {
      if (typeof rehydrateCompetitionsClubRefs === 'function') {
        rehydrateCompetitionsClubRefs();
      }
      const hasAnyCupDay = Array.isArray(gameState.calendar) && gameState.calendar.some(d => d.isCupMatchDay);
      if (!hasAnyCupDay && typeof injectCupMatchesIntoCalendar === 'function') {
        injectCupMatchesIntoCalendar();
      }
      // 2部クラブに選手配列が未生成の旧セーブ互換補完
      const d2Clubs = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
      if (Array.isArray(d2Clubs) && typeof ensurePlayableClubStructure === 'function') {
        d2Clubs.forEach(c => ensurePlayableClubStructure(c));
      }
    }
    if (!Array.isArray(gameState.euroTransferList) || gameState.euroTransferList.length === 0) {
      const sLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
      generateEuropeanTransferList(null, sLv);
    }

    migrateLegacyClubsData();

    // 既存セーブデータの大会別スタッツ・消化済み試合記録に残存する旧カタカナ仮想選手名をアルファベット名へ自動変換
    if (gameState.competitionStats && typeof gameState.competitionStats === 'object') {
      for (const bucket of Object.values(gameState.competitionStats)) {
        if (!bucket || typeof bucket !== 'object') continue;
        for (const [pid, entry] of Object.entries(bucket)) {
          if (entry && /[\u30A0-\u30FF]/.test(entry.name || '')) {
            const cId = entry.clubId || String(pid).replace(/_p\d+$/, '');
            const slotMatch = String(pid).match(/_p(\d+)$/);
            const slotIdx = slotMatch ? Math.max(0, parseInt(slotMatch[1], 10) - 1) : 0;
            const seedBase = String(cId || 'club').split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 7);
            const homeNat = resolveClubCountryToNationality('', cId);
            const ident = generateDeterministicAlphabetPlayerIdentity(seedBase, slotIdx, homeNat, null);
            entry.name = ident.displayName;
            entry.fullName = ident.fullName;
            entry.nationality = entry.nationality || ident.nationality;
          }
        }
      }
    }
    if (Array.isArray(gameState.calendar)) {
      gameState.calendar.forEach(d => {
        if (d && d.matchResult && Array.isArray(d.matchResult.scorers)) {
          d.matchResult.scorers.forEach((sc, idx) => {
            ['scorer', 'assister'].forEach(roleKey => {
              const pObj = sc && sc[roleKey];
              if (pObj && /[\u30A0-\u30FF]/.test(pObj.name || '')) {
                const cId = String(pObj.id || '').replace(/_p\d+$/, '') || (d.matchResult.oppClub && d.matchResult.oppClub.id) || 'club';
                const slotMatch = String(pObj.id || '').match(/_p(\d+)$/);
                const slotIdx = slotMatch ? Math.max(0, parseInt(slotMatch[1], 10) - 1) : idx;
                const seedBase = String(cId).split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 7);
                const homeNat = resolveClubCountryToNationality(d.matchResult.oppClub && d.matchResult.oppClub.country, cId);
                const ident = generateDeterministicAlphabetPlayerIdentity(seedBase, slotIdx, homeNat, null);
                pObj.name = ident.displayName;
                pObj.fullName = ident.fullName;
                pObj.nationality = pObj.nationality || ident.nationality;
              }
            });
          });
        }
      });
    }

    // 旧スケール（basePower未変換）で生成された既存セーブデータの2部CPU選手・市場選手のOVR適正化マイグレーション
    if (!state.d2PowerCalibratedV1) {
      const d2ClubsForCal = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
      if (Array.isArray(d2ClubsForCal)) {
        d2ClubsForCal.forEach(c => {
          if (!c || c.isPlayer || c.tier === 'RELEGATED' || !Array.isArray(c.players)) return;
          const rawTeamOvr = typeof c.basePower === 'number' ? c.basePower : 68;
          const maxCap = rawTeamOvr >= 72 ? 76 : (rawTeamOvr >= 69 ? 74 : 72);
          c.players.forEach(p => {
            if (!p || p.isRetired) return;
            p.atk = clamp(p.atk - 14, 12, 99);
            p.def = clamp(p.def - 14, 12, 99);
            p.sta = clamp(p.sta - 12, 25, 99);
            capGeneratedPlayerOvr(p, maxCap);
          });
          if (typeof autoSelectStarters === 'function') {
            autoSelectStarters(c);
          }
        });
      }
      const sLv = (gameState.facilities && gameState.facilities.scouting) ? gameState.facilities.scouting : 1;
      if (Array.isArray(gameState.transferMarket)) {
        const fCap = 73 + Math.min(3, sLv - 1);
        gameState.transferMarket.forEach(fp => {
          if (fp) capGeneratedPlayerOvr(fp, fCap);
        });
      }
      if (Array.isArray(gameState.euroTransferList)) {
        const maxEuroCap = Math.min(88, 83 + (sLv - 1) * 2);
        gameState.euroTransferList.forEach(ep => {
          if (!ep) return;
          const eDef = (typeof findEuropeanClubDefinitionById === 'function') ? findEuropeanClubDefinitionById(ep.euroClubId || ep.clubId) : null;
          const cOvr = eDef && eDef.basePower ? eDef.basePower : 76;
          const eCap = Math.min(maxEuroCap, cOvr >= 83 ? maxEuroCap : (cOvr >= 78 ? 80 : 76));
          capGeneratedPlayerOvr(ep, eCap);
        });
      }
      gameState.d2PowerCalibratedV1 = true;
    }

    // 全所属選手およびユースの疲労度・評価点・リアリティデータ互換性補完（1部・2部両方）
    getAllManagedLeagueClubs().forEach(c => {
      if (typeof ensureClubRealismFields === 'function') {
        ensureClubRealismFields(c);
      }
      if (c.manager && typeof ensureManagerRankAndStats === 'function') {
        ensureManagerRankAndStats(c.manager);
      }
      if (c.coaches && typeof ensureCoachStats === 'function') {
        (c.coaches.attacking || []).forEach(co => ensureCoachStats(co));
        (c.coaches.defending || []).forEach(co => ensureCoachStats(co));
        if (c.coaches.goalkeeping) ensureCoachStats(c.coaches.goalkeeping);
        if (c.coaches.fitness) ensureCoachStats(c.coaches.fitness);
      }
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
    if (!gameState.scoutingIntel || typeof gameState.scoutingIntel !== 'object') gameState.scoutingIntel = {};
    if (!Array.isArray(gameState.activeScoutAssignments)) gameState.activeScoutAssignments = [];
    if (!Array.isArray(gameState.installments)) gameState.installments = [];
    if (!Array.isArray(gameState.sellOnRights)) gameState.sellOnRights = [];
    if (!Array.isArray(gameState.activeYouthScouts)) gameState.activeYouthScouts = [];
    if (!Array.isArray(gameState.youthScoutReports)) gameState.youthScoutReports = [];
    (gameState.freeManagers || []).forEach(m => { if (typeof ensureManagerRankAndStats === 'function') ensureManagerRankAndStats(m); });
    if (gameState.intlBreakState === undefined) gameState.intlBreakState = null;
    gameState.pendingBoardCrisis = Boolean(gameState.pendingBoardCrisis);
    gameState.pendingDeadlineOffer = Boolean(gameState.pendingDeadlineOffer);
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
      <h4 class="records-section-title">現在の担当クラブ成績（${activeClub ? activeClub.name : 'チェルシー B'}）</h4>
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
  const autoSaveLabel = document.getElementById('setting-autosave-label');
  const speedSelect = document.getElementById('setting-match-speed');
  const autoHtCheck = document.getElementById('setting-auto-halftime');
  const autoHtLabel = document.getElementById('setting-auto-halftime-label');
  if (volInput) volInput.value = appSettings.soundVolume;
  if (volVal) volVal.textContent = `${appSettings.soundVolume}%`;
  if (autoSaveCheck) autoSaveCheck.checked = appSettings.autoSaveEnabled;
  if (autoSaveLabel) autoSaveLabel.textContent = appSettings.autoSaveEnabled ? 'ENABLED' : 'OFF';
  if (speedSelect) speedSelect.value = String(appSettings.matchSpeed || 2);
  if (autoHtCheck) autoHtCheck.checked = Boolean(appSettings.autoHalftimeResume);
  if (autoHtLabel) autoHtLabel.textContent = appSettings.autoHalftimeResume ? 'ENABLED' : 'OFF';
  const mainMenuEl = document.getElementById('main-menu-screen');
  const titleReturnRow = overlay ? overlay.querySelector('.settings-title-return-row') : null;
  if (titleReturnRow) {
    const isOnMainMenu = Boolean(mainMenuEl && !mainMenuEl.classList.contains('hidden'));
    titleReturnRow.classList.toggle('hidden', isOnMainMenu);
  }
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
  const autoSaveLabel = document.getElementById('setting-autosave-label');
  if (autoSaveCheck) {
    autoSaveCheck.addEventListener('change', (e) => {
      appSettings.autoSaveEnabled = !!e.target.checked;
      if (autoSaveLabel) autoSaveLabel.textContent = appSettings.autoSaveEnabled ? 'ENABLED' : 'OFF';
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

  const autoHtCheck = document.getElementById('setting-auto-halftime');
  const autoHtLabel = document.getElementById('setting-auto-halftime-label');
  if (autoHtCheck) {
    autoHtCheck.addEventListener('change', (e) => {
      appSettings.autoHalftimeResume = !!e.target.checked;
      if (autoHtLabel) autoHtLabel.textContent = appSettings.autoHalftimeResume ? 'ENABLED' : 'OFF';
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
