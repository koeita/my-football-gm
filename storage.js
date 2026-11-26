'use strict';

/**
 * storage.js - セーブ＆ロード、デバウンス遅延オートセーブ、環境設定、キャリア殿堂記録、メインメニュー＆誤リロード防止
 */

const SAVE_STORAGE_KEY = 'my_football_gm_save_v1';
const RECORDS_STORAGE_KEY = 'my_football_gm_records_v1';
const SETTINGS_STORAGE_KEY = 'my_football_gm_settings_v1';
const IDB_DB_NAME = 'my_football_gm_idb_v1';
const IDB_STORE_NAME = 'saves';

let __idbCachedSave = null;
let __idbHydratePromise = null;

function openSaveIdb() {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error || new Error('IDB open error'));
    } catch (err) {
      reject(err);
    }
  });
}

function writeSaveToIndexedDB(payload) {
  try {
    const cloned = JSON.parse(JSON.stringify(payload));
    __idbCachedSave = cloned;
    return openSaveIdb().then(db => new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        store.put(cloned, SAVE_STORAGE_KEY);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); resolve(false); };
        tx.onabort = () => { db.close(); resolve(false); };
      } catch (e) {
        try { db.close(); } catch (_) {}
        resolve(false);
      }
    })).catch(() => false);
  } catch (e) {
    return Promise.resolve(false);
  }
}

function readSaveFromIndexedDB() {
  return openSaveIdb().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(SAVE_STORAGE_KEY);
      req.onsuccess = () => {
        const res = req.result || null;
        if (res && res.state && Array.isArray(res.state.clubs)) {
          __idbCachedSave = res;
        }
        db.close();
        resolve(res);
      };
      req.onerror = () => { db.close(); resolve(null); };
    } catch (e) {
      try { db.close(); } catch (_) {}
      resolve(null);
    }
  })).catch(() => null);
}

function deleteSaveFromIndexedDB() {
  __idbCachedSave = null;
  return openSaveIdb().then(db => new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).delete(SAVE_STORAGE_KEY);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); resolve(false); };
    } catch (e) {
      try { db.close(); } catch (_) {}
      resolve(false);
    }
  })).catch(() => false);
}

function hydrateSaveFromIndexedDBAsync() {
  if (__idbHydratePromise) return __idbHydratePromise;
  __idbHydratePromise = readSaveFromIndexedDB().then((idbData) => {
    __idbHydratePromise = null;
    if (idbData && typeof updateContinueButtonUI === 'function') {
      updateContinueButtonUI();
    }
    return idbData;
  }).catch(() => {
    __idbHydratePromise = null;
    return null;
  });
  return __idbHydratePromise;
}

const appSettings = {
  soundEnabled: true,
  soundVolume: 70,
  bgmVolume: 60,
  seVolume: 80,
  autoSaveEnabled: true,
  matchSpeed: 2,
  autoHalftimeResume: false,
  cinematicMode: 'all'
};

function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.soundEnabled === 'boolean') appSettings.soundEnabled = parsed.soundEnabled;
      if (typeof parsed.soundVolume === 'number') appSettings.soundVolume = parsed.soundVolume;
      if (typeof parsed.bgmVolume === 'number') appSettings.bgmVolume = parsed.bgmVolume;
      if (typeof parsed.seVolume === 'number') appSettings.seVolume = parsed.seVolume;
      if (typeof parsed.autoSaveEnabled === 'boolean') appSettings.autoSaveEnabled = parsed.autoSaveEnabled;
      if (typeof parsed.matchSpeed === 'number') appSettings.matchSpeed = parsed.matchSpeed;
      if (typeof parsed.autoHalftimeResume === 'boolean') appSettings.autoHalftimeResume = parsed.autoHalftimeResume;
      if (parsed.cinematicMode === 'all' || parsed.cinematicMode === 'major' || parsed.cinematicMode === 'off') appSettings.cinematicMode = parsed.cinematicMode;
    }
  } catch (e) {}
  if (typeof SoundEngine !== 'undefined' && SoundEngine && typeof SoundEngine.syncFromSettings === 'function') {
    SoundEngine.syncFromSettings();
  }
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
  } catch (e) {}
  if (typeof SoundEngine !== 'undefined' && SoundEngine && typeof SoundEngine.syncFromSettings === 'function') {
    SoundEngine.syncFromSettings();
  }
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

let hasRequestedPersistentStorage = false;
function requestPersistentStorageOnce() {
  if (hasRequestedPersistentStorage) return;
  hasRequestedPersistentStorage = true;
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
      navigator.storage.persist().catch(() => {});
    }
  } catch (e) {}
}

if (typeof window !== 'undefined' && !window.__autoSaveUnloadBound) {
  window.__autoSaveUnloadBound = true;
  window.addEventListener('pagehide', flushPendingAutoSave);
  window.addEventListener('beforeunload', flushPendingAutoSave);
  window.addEventListener('freeze', flushPendingAutoSave);
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
        selectedEuroCup: gameState.selectedEuroCup || gameState.selectedEuropeanCup || 'championsCup',
        selectedEuroSubtab: gameState.selectedEuroSubtab || gameState.euroViewMode || 'standings',
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
        pendingSponsorSlots: Array.isArray(gameState.pendingSponsorSlots) ? [...gameState.pendingSponsorSlots] : [],
        sponsorDeadlineDayIndex: typeof gameState.sponsorDeadlineDayIndex === 'number' ? gameState.sponsorDeadlineDayIndex : null,
        sponsorWindowClosed: Boolean(gameState.sponsorWindowClosed),
        pendingInitialStaffSetup: Boolean(gameState.pendingInitialStaffSetup),
        pendingCommercialSetup: Boolean(gameState.pendingCommercialSetup),
        commercialSubtab: gameState.commercialSubtab || 'stadium',
        facilitiesSubtab: gameState.facilitiesSubtab || 'investment',
        marketSubtab: gameState.marketSubtab || 'market',
        marketFilter: gameState.marketFilter || { category: 'ALL', clubId: 'ALL', position: 'ALL', sortKey: 'ovr-desc', searchQuery: '' },
        scoutingIntel: gameState.scoutingIntel || {},
        activeScoutAssignments: gameState.activeScoutAssignments || [],
        installments: gameState.installments || [],
        sellOnRights: gameState.sellOnRights || [],
        intlBreakState: gameState.intlBreakState || null,
        pendingBoardCrisis: Boolean(gameState.pendingBoardCrisis),
        pendingDeadlineOffer: Boolean(gameState.pendingDeadlineOffer),
        deadlineDayState: gameState.deadlineDayState || null,
        secretaryId: gameState.secretaryId || 'sec_claire',
        inboxMessages: Array.isArray(gameState.inboxMessages) ? gameState.inboxMessages.slice(0, 40) : [],
        newsFeed: Array.isArray(gameState.newsFeed) ? gameState.newsFeed.slice(0, 40) : [],
        snsFeed: Array.isArray(gameState.snsFeed) ? gameState.snsFeed.slice(0, 40) : [],
        snsUnreadCount: Number(gameState.snsUnreadCount || 0),
        snsCategoryFilter: gameState.snsCategoryFilter || 'ALL',
        _notifiedSpecialMatchKey: gameState._notifiedSpecialMatchKey || null,
        managerWishes: gameState.managerWishes || null,
        officeCommTab: gameState.officeCommTab || 'messages',
        inboxCategoryFilter: gameState.inboxCategoryFilter || 'ALL',
        newsCategoryFilter: gameState.newsCategoryFilter || 'ALL',
        monthlyLedger: gameState.monthlyLedger || null,
        monthlyReports: Array.isArray(gameState.monthlyReports) ? gameState.monthlyReports.slice(0, 12) : [],
        pendingLineupConsultation: gameState.pendingLineupConsultation || null,
        totalPlayerMatchesPlayed: Number(gameState.totalPlayerMatchesPlayed || 0),
        lastConsultationMatchCount: Number(gameState.lastConsultationMatchCount || 0),
        consultationSeq: Number(gameState.consultationSeq || 0),
        seasonAwardsHistory: Array.isArray(gameState.seasonAwardsHistory) ? gameState.seasonAwardsHistory.slice(0, 20) : [],
        monthlyAwardsHistory: Array.isArray(gameState.monthlyAwardsHistory) ? gameState.monthlyAwardsHistory.slice(0, 24) : [],
        monthlyPlayerBaseline: (gameState.monthlyPlayerBaseline && typeof gameState.monthlyPlayerBaseline === 'object') ? gameState.monthlyPlayerBaseline : {},
        clubHallOfFame: (gameState.clubHallOfFame && typeof gameState.clubHallOfFame === 'object') ? gameState.clubHallOfFame : { players: {}, singleSeasonRecords: {}, milestonesIssued: {}, titleRaceNewsSeason: null }
      }
    };
    if (typeof dehydrateCompetitionsForSave === 'function') {
      payload.state.competitions = dehydrateCompetitionsForSave(gameState.competitions);
    }
    const slimClubRef = (c) => (c && typeof c === 'object')
      ? { id: c.id, name: c.name, shortName: c.shortName, shortCode: c.shortCode, isPlayer: Boolean(c.isPlayer), primaryColor: c.primaryColor, secondaryColor: c.secondaryColor, pattern: c.pattern, shape: c.shape, emblem: c.emblem }
      : null;
    const slimScorerEntry = (s) => {
      if (!s || typeof s !== 'object') return s;
      return {
        minute: s.minute,
        name: s.name || (s.scorer && s.scorer.name) || '',
        scorer: s.scorer ? { id: s.scorer.id, name: s.scorer.name } : null,
        assister: s.assister ? { id: s.assister.id, name: s.assister.name } : null
      };
    };
    const slimSubEvent = (ev) => {
      if (!ev || typeof ev !== 'object') return ev;
      return {
        minute: ev.minute,
        clubId: ev.clubId,
        outPlayer: ev.outPlayer ? { id: ev.outPlayer.id, name: ev.outPlayer.name, pos: ev.outPlayer.pos, squadNumber: ev.outPlayer.squadNumber } : null,
        inPlayer: ev.inPlayer ? { id: ev.inPlayer.id, name: ev.inPlayer.name, pos: ev.inPlayer.pos, squadNumber: ev.inPlayer.squadNumber } : null
      };
    };
    const slimRedCard = (ev) => {
      if (!ev || typeof ev !== 'object') return ev;
      return {
        minute: ev.minute,
        clubId: ev.clubId,
        player: ev.player ? { id: ev.player.id, name: ev.player.name, pos: ev.player.pos } : null
      };
    };
    const slimMatchRecord = (m, minimal = false) => {
      if (!m || typeof m !== 'object') return m;
      const out = { ...m };
      if ('homeClub' in out) delete out.homeClub;
      if ('awayClub' in out) delete out.awayClub;
      if (minimal && !out.isPlayerMatch) {
        delete out.momClub;
        delete out.momPlayer;
        delete out.homeScorers;
        delete out.awayScorers;
        delete out.homeSubEvents;
        delete out.awaySubEvents;
        delete out.redCardEvents;
        return out;
      }
      if (out.momClub) out.momClub = slimClubRef(out.momClub);
      if (out.momPlayer) {
        out.momPlayer = {
          id: out.momPlayer.id,
          name: out.momPlayer.name,
          squadNumber: out.momPlayer.squadNumber,
          pos: out.momPlayer.pos,
          assignedPos: out.momPlayer.assignedPos
        };
      }
      if (Array.isArray(out.homeScorers)) out.homeScorers = out.homeScorers.map(slimScorerEntry);
      if (Array.isArray(out.awayScorers)) out.awayScorers = out.awayScorers.map(slimScorerEntry);
      if (Array.isArray(out.homeSubEvents)) out.homeSubEvents = out.homeSubEvents.map(slimSubEvent);
      if (Array.isArray(out.awaySubEvents)) out.awaySubEvents = out.awaySubEvents.map(slimSubEvent);
      if (Array.isArray(out.redCardEvents)) out.redCardEvents = out.redCardEvents.map(slimRedCard);
      return out;
    };
    const slimScheduleWeeks = (sched, minimal = false) => {
      if (!Array.isArray(sched)) return sched;
      return sched.map(wk => Array.isArray(wk) ? wk.map(m => slimMatchRecord(m, minimal)) : wk);
    };
    const slimMatchList = (arr) => (arr || []).map(r => ({
      ...r,
      homeClub: slimClubRef(r.homeClub),
      awayClub: slimClubRef(r.awayClub),
      momPlayer: r.momPlayer ? { id: r.momPlayer.id, name: r.momPlayer.name, squadNumber: r.momPlayer.squadNumber, pos: r.momPlayer.pos, assignedPos: r.momPlayer.assignedPos } : null,
      momClub: slimClubRef(r.momClub),
      homeScorers: Array.isArray(r.homeScorers) ? r.homeScorers.map(slimScorerEntry) : [],
      awayScorers: Array.isArray(r.awayScorers) ? r.awayScorers.map(slimScorerEntry) : [],
      homeSubEvents: Array.isArray(r.homeSubEvents) ? r.homeSubEvents.map(slimSubEvent) : [],
      awaySubEvents: Array.isArray(r.awaySubEvents) ? r.awaySubEvents.map(slimSubEvent) : [],
      redCardEvents: Array.isArray(r.redCardEvents) ? r.redCardEvents.map(slimRedCard) : []
    }));
    payload.state.schedule = slimScheduleWeeks(gameState.schedule);
    payload.state.d1BackgroundSchedule = slimScheduleWeeks(gameState.d1BackgroundSchedule);
    payload.state.lastWeekResults = slimMatchList(gameState.lastWeekResults);
    payload.state.matchHistory = slimMatchList(gameState.matchHistory);

    // シリアライズ容量削減（元データ破壊なし）：
    // 1) calendar 内の matchFixture は schedule と完全重複するため除外（ロード時に再結合）し、matchResult 内の選手/クラブ全量も軽量化
    if (Array.isArray(payload.state.calendar)) {
      payload.state.calendar = payload.state.calendar.map(d => {
        if (!d || typeof d !== 'object') return d;
        const { matchFixture, ...rest } = d;
        if (rest.matchResult && typeof rest.matchResult === 'object') {
          const mr = { ...rest.matchResult };
          if (mr.oppClub) mr.oppClub = slimClubRef(mr.oppClub);
          if (mr.momClub) mr.momClub = slimClubRef(mr.momClub);
          if (mr.momPlayer) {
            mr.momPlayer = { id: mr.momPlayer.id, name: mr.momPlayer.name, squadNumber: mr.momPlayer.squadNumber, pos: mr.momPlayer.pos };
          }
          if (Array.isArray(mr.scorers)) mr.scorers = mr.scorers.map(slimScorerEntry);
          if (Array.isArray(mr.homeScorers)) mr.homeScorers = mr.homeScorers.map(slimScorerEntry);
          if (Array.isArray(mr.awayScorers)) mr.awayScorers = mr.awayScorers.map(slimScorerEntry);
          if (Array.isArray(mr.homeSubEvents)) mr.homeSubEvents = mr.homeSubEvents.map(slimSubEvent);
          if (Array.isArray(mr.awaySubEvents)) mr.awaySubEvents = mr.awaySubEvents.map(slimSubEvent);
          if (Array.isArray(mr.redCardEvents)) mr.redCardEvents = mr.redCardEvents.map(slimRedCard);
          rest.matchResult = mr;
        }
        return rest;
      });
    }
    // 2) 選手の attributes キャッシュは atk/def/sta/pos から再計算可能なため保存データから除外
    const stripPlayerListAttrs = (arr, compressHist = false) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map(p => {
        if (!p || typeof p !== 'object') return p;
        const { attributes, ...rest } = p;
        if (compressHist) {
          delete rest.valueHistory;
          delete rest.seasonHistory;
          delete rest.avatarData;
        }
        return rest;
      });
    };
    const stripClubPlayerAttrs = (clubsArr, compressCpuHist = false) => {
      if (!Array.isArray(clubsArr)) return clubsArr;
      return clubsArr.map(c => {
        if (!c || !Array.isArray(c.players)) return c;
        const copy = {
          ...c,
          players: stripPlayerListAttrs(c.players, compressCpuHist && !c.isPlayer)
        };
        if (Array.isArray(c.youthSquad)) {
          copy.youthSquad = stripPlayerListAttrs(c.youthSquad, compressCpuHist && !c.isPlayer);
        }
        return copy;
      });
    };
    payload.state.clubs = stripClubPlayerAttrs(gameState.clubs, false);
    payload.state.transferMarket = stripPlayerListAttrs(gameState.transferMarket, false);
    payload.state.euroTransferList = stripPlayerListAttrs(gameState.euroTransferList, false);
    payload.state.youthCandidates = stripPlayerListAttrs(gameState.youthCandidates, false);
    if (payload.state.competitions && payload.state.competitions.championship && Array.isArray(payload.state.competitions.championship.clubs)) {
      payload.state.competitions.championship = {
        ...payload.state.competitions.championship,
        clubs: stripClubPlayerAttrs(payload.state.competitions.championship.clubs, false)
      };
    }

    requestPersistentStorageOnce();
    // モバイルブラウザでの容量制限・消失対策としてIndexedDBにもデュアル保存
    writeSaveToIndexedDB(payload);

    const tryWritePayload = (obj) => {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(obj));
    };

    let localStorageSaved = false;
    try {
      tryWritePayload(payload);
      localStorageSaved = true;
    } catch (storageErr) {
      const isQuotaErr = storageErr && (
        storageErr.name === 'QuotaExceededError'
        || storageErr.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || storageErr.code === 22
        || storageErr.code === 1014
      );
      if (!isQuotaErr) throw storageErr;
      // Stage 1: 試合履歴・ログ・CPU非プレイヤー日程イベントを圧縮してリトライ
      payload.state.matchHistory = payload.state.matchHistory.slice(-12);
      payload.state.lastWeekResults = [];
      payload.state.schedule = slimScheduleWeeks(gameState.schedule, true);
      payload.state.d1BackgroundSchedule = slimScheduleWeeks(gameState.d1BackgroundSchedule, true);
      if (payload.state.competitions && payload.state.competitions.championship && Array.isArray(payload.state.competitions.championship.schedule)) {
        payload.state.competitions.championship = {
          ...payload.state.competitions.championship,
          schedule: slimScheduleWeeks(payload.state.competitions.championship.schedule, true)
        };
      }
      payload.state.dailyLogs = Array.isArray(payload.state.dailyLogs) ? payload.state.dailyLogs.slice(0, 20) : [];
      payload.state.inboxMessages = Array.isArray(payload.state.inboxMessages) ? payload.state.inboxMessages.slice(0, 20) : [];
      payload.state.newsFeed = Array.isArray(payload.state.newsFeed) ? payload.state.newsFeed.slice(0, 20) : [];
      payload.state.snsFeed = Array.isArray(payload.state.snsFeed) ? payload.state.snsFeed.slice(0, 20) : [];
      if (Array.isArray(payload.state.calendar)) {
        payload.state.calendar = payload.state.calendar.map(d => {
          if (!d || !d.matchResult) return d;
          return { ...d, matchResult: { ...d.matchResult, scorers: [], homeScorers: [], awayScorers: [] } };
        });
      }
      try {
        tryWritePayload(payload);
        localStorageSaved = true;
      } catch (err2) {
        // Stage 2: CPU選手の履歴・不要な大会個人統計を圧縮してリトライ
        payload.state.clubs = stripClubPlayerAttrs(gameState.clubs, true);
        if (payload.state.competitions && payload.state.competitions.championship && Array.isArray(payload.state.competitions.championship.clubs)) {
          payload.state.competitions.championship = {
            ...payload.state.competitions.championship,
            clubs: stripClubPlayerAttrs(payload.state.competitions.championship.clubs, true)
          };
        }
        if (payload.state.competitionStats && typeof payload.state.competitionStats === 'object') {
          const compactStats = {};
          for (const [ck, tbl] of Object.entries(payload.state.competitionStats)) {
            if (!tbl || typeof tbl !== 'object') continue;
            const filtered = {};
            for (const [pid, st] of Object.entries(tbl)) {
              if (st && ((st.goals || 0) > 0 || (st.assists || 0) > 0 || (st.cleanSheets || 0) > 0 || (st.appearances || 0) >= 15)) {
                filtered[pid] = st;
              }
            }
            compactStats[ck] = filtered;
          }
          payload.state.competitionStats = compactStats;
        }
        const protectedIds = new Set();
        if (Array.isArray(gameState.outgoingOffers)) {
          gameState.outgoingOffers.forEach(o => { if (o && o.playerId) protectedIds.add(o.playerId); });
        }
        if (Array.isArray(gameState.targetShortlist)) {
          gameState.targetShortlist.forEach(id => { if (id) protectedIds.add(id); });
        }
        if (Array.isArray(gameState.activeScoutAssignments)) {
          gameState.activeScoutAssignments.forEach(a => { if (a && a.playerId) protectedIds.add(a.playerId); });
        }
        if (Array.isArray(gameState.preContractPlayers)) {
          gameState.preContractPlayers.forEach(p => { if (p && p.id) protectedIds.add(p.id); });
        }
        if (gameState.scoutingIntel && typeof gameState.scoutingIntel === 'object') {
          Object.keys(gameState.scoutingIntel).forEach(id => { if (id) protectedIds.add(id); });
        }
        const slimPool = (arr, limit) => {
          if (!Array.isArray(arr)) return arr;
          const important = [];
          const others = [];
          for (const p of arr) {
            if (p && p.id && protectedIds.has(p.id)) {
              important.push(p);
            } else {
              others.push(p);
            }
          }
          const remainingSlots = Math.max(0, limit - important.length);
          const selected = important.concat(others.slice(0, remainingSlots));
          return selected.map(p => {
            if (!p || typeof p !== 'object') return p;
            const { attributes, valueHistory, seasonHistory, avatarData, ...rest } = p;
            return rest;
          });
        };
        payload.state.transferMarket = slimPool(payload.state.transferMarket, 60);
        payload.state.euroTransferList = slimPool(payload.state.euroTransferList, 40);
        try {
          tryWritePayload(payload);
          localStorageSaved = true;
        } catch (err3) {
          // Stage 3: 最終防衛ライン（履歴・ログ・外国選手キャッシュ圧縮、市場リスト最小化）
          payload.state.matchHistory = [];
          payload.state.dailyLogs = [];
          payload.state.inboxMessages = [];
          payload.state.newsFeed = [];
          payload.state.snsFeed = [];
          payload.state.monthlyPlayerBaseline = {};
          payload.state.competitionStats = {};
          if (payload.state.competitions && payload.state.competitions._foreignClubPlayers) {
            payload.state.competitions = { ...payload.state.competitions };
            delete payload.state.competitions._foreignClubPlayers;
          }
          payload.state.transferMarket = slimPool(payload.state.transferMarket, 35);
          payload.state.euroTransferList = slimPool(payload.state.euroTransferList, 25);
          payload.state.youthCandidates = slimPool(payload.state.youthCandidates, 15);
          try {
            tryWritePayload(payload);
            localStorageSaved = true;
          } catch (err4) {
            // localStorageが完全満杯でもIndexedDB側には保存を試みている
            localStorageSaved = false;
          }
        }
      }
    }
    if (localStorageSaved || __idbCachedSave) {
      autoSaveDirty = false;
      updateCareerRecordsFromCurrentState();
      return true;
    }
    return false;
  } catch (e) {
    console.error('[saveGameToStorage] Failed to save game:', e);
    if (!hasShownStorageQuotaWarning && typeof addDailyLog === 'function') {
      hasShownStorageQuotaWarning = true;
      addDailyLog('【保存容量上限】空き容量不足のため自動保存できませんでした。');
    }

    return false;
  }
}

function getSavedGameSummary() {
  try {
    let lsParsed = null;
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.state && Array.isArray(p.state.clubs)) {
          lsParsed = p;
        }
      }
    } catch (e) {}

    const idbParsed = (__idbCachedSave && __idbCachedSave.state && Array.isArray(__idbCachedSave.state.clubs))
      ? __idbCachedSave
      : null;

    let parsed = null;
    if (lsParsed && idbParsed) {
      parsed = ((idbParsed.savedAt || 0) > (lsParsed.savedAt || 0)) ? idbParsed : lsParsed;
    } else {
      parsed = lsParsed || idbParsed;
    }
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
    if (club.id && typeof CLUB_KIT_MAP !== 'undefined' && CLUB_KIT_MAP[club.id]) {
      club.kit = CLUB_KIT_MAP[club.id];
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
      if (p && typeof ensurePlayerInjuryProneness === 'function') ensurePlayerInjuryProneness(p);
    });
  }
  if (Array.isArray(gameState.euroTransferList)) {
    gameState.euroTransferList.forEach(p => {
      if (!p) return;
      if (p.clubName) p.clubName = normalizeNameStr(p.clubName);
      if (p.club && typeof p.club === 'object') syncClubObj(p.club);
      if (Array.isArray(p.pastClubs)) p.pastClubs = p.pastClubs.map(normalizeNameStr);
      if (typeof ensurePlayerInjuryProneness === 'function') ensurePlayerInjuryProneness(p);
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
    if (!gameState.activeTab) gameState.activeTab = 'office';
    if (!gameState.teamSubtab) gameState.teamSubtab = 'standings';
    if (!gameState.rosterSubtab) gameState.rosterSubtab = 'board';
    if (!gameState.marketSubtab) gameState.marketSubtab = 'market';
    if (!gameState.facilitiesSubtab) gameState.facilitiesSubtab = 'investment';
    if (!Array.isArray(gameState.incomingOffers)) gameState.incomingOffers = [];
    if (!Array.isArray(gameState.outgoingOffers)) gameState.outgoingOffers = [];
    if (!gameState.offersSubtab) gameState.offersSubtab = 'incoming';
    if (!gameState.selectedEuroCup && state.selectedEuropeanCup) gameState.selectedEuroCup = state.selectedEuropeanCup;
    if (!gameState.selectedEuroSubtab && state.euroViewMode) gameState.selectedEuroSubtab = state.euroViewMode;
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
    // セーブ時に省略した calendar[].matchFixture を schedule から再結合
    if (Array.isArray(gameState.calendar) && Array.isArray(gameState.schedule)) {
      gameState.calendar.forEach(d => {
        if (d && d.isMatchDay && d.matchWeek && !d.matchFixture) {
          d.matchFixture = gameState.schedule[d.matchWeek - 1] || null;
        }
      });
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

    // 過去のシーズン跨ぎで欧州選手（euroTransferList 等）の今季出場数が累積した異常値を現在週ベースへ補正
    const curLoadWeek = Math.max(0, gameState.currentWeek || 0);
    const maxAllowedEuroApps = curLoadWeek === 0 ? 0 : Math.min(44, Math.min(38, curLoadWeek) + 4);
    const clampEuroPlayerSeasonApps = (ep) => {
      if (!ep || typeof ep.appearances !== 'number' || ep.appearances <= maxAllowedEuroApps) return;
      const oldApps = ep.appearances;
      const ratio = maxAllowedEuroApps > 0 ? (maxAllowedEuroApps / oldApps) : 0;
      ep.appearances = maxAllowedEuroApps;
      if (typeof ep.goals === 'number') ep.goals = Math.round(ep.goals * ratio);
      if (typeof ep.assists === 'number') ep.assists = Math.round(ep.assists * ratio);
      if (typeof ep.totalRating === 'number') ep.totalRating = Number((ep.totalRating * ratio).toFixed(2));
    };
    if (Array.isArray(gameState.euroTransferList)) {
      gameState.euroTransferList.forEach(clampEuroPlayerSeasonApps);
    }
    if (typeof getEuropeanCompetitionClubsWithPlayers === 'function') {
      getEuropeanCompetitionClubsWithPlayers().forEach(ec => {
        (ec.players || []).forEach(clampEuroPlayerSeasonApps);
      });
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
          if (typeof ensurePlayerInjuryProneness === 'function') ensurePlayerInjuryProneness(p);
        });
      }
      if (Array.isArray(c.youthSquad)) {
        c.youthSquad.forEach(yp => {
          if (typeof yp.fatigue !== 'number') yp.fatigue = 0;
          if (typeof ensurePlayerInjuryProneness === 'function') ensurePlayerInjuryProneness(yp);
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
    if (gameState.deadlineDayState === undefined) gameState.deadlineDayState = null;
    if (!gameState.secretaryId) gameState.secretaryId = 'sec_claire';
    if (!Array.isArray(gameState.inboxMessages)) gameState.inboxMessages = [];
    if (!Array.isArray(gameState.newsFeed)) gameState.newsFeed = [];
    if (!Array.isArray(gameState.snsFeed)) gameState.snsFeed = [];
    if (typeof gameState.snsUnreadCount !== 'number') gameState.snsUnreadCount = 0;
    if (!gameState.snsCategoryFilter) gameState.snsCategoryFilter = 'ALL';
    if (gameState._notifiedSpecialMatchKey === undefined) gameState._notifiedSpecialMatchKey = null;
    if (gameState.managerWishes === undefined) gameState.managerWishes = null;
    if (!gameState.officeCommTab) gameState.officeCommTab = 'messages';
    if (!gameState.inboxCategoryFilter) gameState.inboxCategoryFilter = 'ALL';
    if (!gameState.newsCategoryFilter) gameState.newsCategoryFilter = 'ALL';
    if (gameState.monthlyLedger === undefined) gameState.monthlyLedger = null;
    if (!Array.isArray(gameState.monthlyReports)) gameState.monthlyReports = [];
    if (gameState.pendingLineupConsultation === undefined) gameState.pendingLineupConsultation = null;
    if (!Array.isArray(gameState.pendingSponsorSlots)) gameState.pendingSponsorSlots = [];
    if (typeof gameState.sponsorDeadlineDayIndex !== 'number') gameState.sponsorDeadlineDayIndex = null;
    if (typeof gameState.sponsorWindowClosed !== 'boolean') gameState.sponsorWindowClosed = false;
    if (typeof gameState.pendingInitialStaffSetup !== 'boolean') gameState.pendingInitialStaffSetup = false;
    if (typeof gameState.pendingCommercialSetup !== 'boolean') gameState.pendingCommercialSetup = false;
    if (!gameState.commercialSubtab) gameState.commercialSubtab = 'stadium';
    if (!Array.isArray(gameState.seasonAwardsHistory)) gameState.seasonAwardsHistory = [];
    if (!Array.isArray(gameState.monthlyAwardsHistory)) gameState.monthlyAwardsHistory = [];
    if (!gameState.monthlyPlayerBaseline || typeof gameState.monthlyPlayerBaseline !== 'object') gameState.monthlyPlayerBaseline = {};
    if (!gameState.clubHallOfFame || typeof gameState.clubHallOfFame !== 'object') {
      gameState.clubHallOfFame = { players: {}, singleSeasonRecords: {}, milestonesIssued: {}, titleRaceNewsSeason: null };
    } else {
      if (!gameState.clubHallOfFame.players || typeof gameState.clubHallOfFame.players !== 'object') gameState.clubHallOfFame.players = {};
      if (!gameState.clubHallOfFame.singleSeasonRecords || typeof gameState.clubHallOfFame.singleSeasonRecords !== 'object') gameState.clubHallOfFame.singleSeasonRecords = {};
      if (!gameState.clubHallOfFame.milestonesIssued || typeof gameState.clubHallOfFame.milestonesIssued !== 'object') gameState.clubHallOfFame.milestonesIssued = {};
    }
    if (typeof gameState.totalPlayerMatchesPlayed !== 'number') gameState.totalPlayerMatchesPlayed = 0;
    if (typeof gameState.lastConsultationMatchCount !== 'number') gameState.lastConsultationMatchCount = 0;
    if (typeof gameState.consultationSeq !== 'number') gameState.consultationSeq = 0;
    if (typeof syncAllSubtabsDOM === 'function') {
      syncAllSubtabsDOM();
    }
    const pClubLoaded = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
    if (pClubLoaded && !gameState.managerWishes && typeof evaluateManagerReinforcementWishes === 'function') {
      gameState.managerWishes = evaluateManagerReinforcementWishes(pClubLoaded);
    }
    if ((gameState.inboxMessages.length === 0 || gameState.snsFeed.length === 0) && typeof ensureInitialOfficeMessagesAndNews === 'function') {
      ensureInitialOfficeMessagesAndNews();
    }
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
    metaEl.textContent = '記録データなし';
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
  hydrateSaveFromIndexedDBAsync();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  if (typeof SoundEngine !== 'undefined' && SoundEngine && typeof SoundEngine.setScene === 'function') {
    SoundEngine.setScene('title');
  }
}

function hideMainMenuScreen() {
  const menuEl = document.getElementById('main-menu-screen');
  const appEl = document.getElementById('app-container');
  if (menuEl) menuEl.classList.add('hidden');
  if (appEl) appEl.classList.remove('app-hidden');
  document.body.classList.remove('main-menu-active');
  if (typeof SoundEngine !== 'undefined' && SoundEngine && typeof SoundEngine.setScene === 'function') {
    SoundEngine.setScene('office');
  }
}

function extractHallOfFameSnapshot(hofState, clubName) {
  if (!hofState || !hofState.players || Object.keys(hofState.players).length === 0) return null;
  const hofList = Object.values(hofState.players).filter(Boolean);
  const topApps = [...hofList].sort((a, b) => (b.apps || 0) - (a.apps || 0))[0] || null;
  const topGoals = [...hofList].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0] || null;
  const topAssists = [...hofList].sort((a, b) => (b.assists || 0) - (a.assists || 0))[0] || null;
  const ssr = hofState.singleSeasonRecords || {};
  return {
    clubName: clubName || '',
    topApps: topApps ? { name: topApps.name, pos: topApps.pos, val: topApps.apps || 0 } : null,
    topGoals: topGoals ? { name: topGoals.name, pos: topGoals.pos, val: topGoals.goals || 0 } : null,
    topAssists: topAssists ? { name: topAssists.name, pos: topAssists.pos, val: topAssists.assists || 0 } : null,
    singleSeasonGoals: ssr.mostGoals ? { name: ssr.mostGoals.name, val: ssr.mostGoals.val, seasonYear: ssr.mostGoals.seasonYear } : null
  };
}

function updateCareerRecordsFromCurrentState() {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    const rec = {
      titlesWon: 0,
      seasonsCompleted: 0,
      bestRank: null,
      maxFunds: 0,
      topScorersHistory: [],
      awardsHistory: [],
      clubRecordsSnapshot: null,
      ...(raw ? JSON.parse(raw) : {})
    };
    const playerClub = getPlayerClub();
    if (playerClub) {
      if (playerClub.funds > (rec.maxFunds || 0)) {
        rec.maxFunds = playerClub.funds;
      }
      if (Array.isArray(gameState.seasonAwardsHistory) && gameState.seasonAwardsHistory.length > 0) {
        rec.awardsHistory = gameState.seasonAwardsHistory.slice(0, 10).map(a => ({
          season: a.season,
          seasonYear: a.seasonYear,
          divisionLabel: a.divisionLabel || 'ENG-D1',
          mvp: a.mvp ? `${a.mvp.name} (${a.mvp.clubName})` : '-',
          topScorer: a.topScorer ? `${a.topScorer.name} (${a.topScorer.goals}G)` : '-',
          clubMvp: a.clubMvp ? `${a.clubMvp.name}` : '-'
        }));
      }
      const snap = extractHallOfFameSnapshot(gameState.clubHallOfFame, playerClub.name);
      if (snap) rec.clubRecordsSnapshot = snap;
      if (gameState.isSeasonOver) {
        const isD2 = typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision();
        const activeClubs = typeof getActivePlayerLeagueClubs === 'function'
          ? getActivePlayerLeagueClubs()
          : (gameState.clubs || []);
        const sorted = isD2
          ? [...activeClubs].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0) || (b.gf || 0) - (a.gf || 0))
          : getSortedStandings();
        const rank = sorted.findIndex(c => c.id === playerClub.id) + 1;
        if (!isD2 && rank > 0 && (!rec.bestRank || rank < rec.bestRank)) {
          rec.bestRank = rank;
        }
        const seasonKey = `${gameState.gmName}_S${gameState.season}_${playerClub.id}`;
        if (rec.lastRecordedSeasonKey !== seasonKey) {
          rec.lastRecordedSeasonKey = seasonKey;
          rec.seasonsCompleted = (rec.seasonsCompleted || 0) + 1;
          if (!isD2 && rank === 1) {
            rec.titlesWon = (rec.titlesWon || 0) + 1;
          }
          // シーズン得点王を記録
          let bestPlayer = null;
          let bestClubName = '';
          for (const c of activeClubs) {
            for (const p of (c.players || [])) {
              if (!bestPlayer || (p.goals || 0) > (bestPlayer.goals || 0)) {
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
  const st = summary && summary.parsed && summary.parsed.state ? summary.parsed.state : null;
  const stD1 = st && Array.isArray(st.clubs) ? st.clubs : [];
  const stD2 = st && st.competitions && st.competitions.championship && Array.isArray(st.competitions.championship.clubs)
    ? st.competitions.championship.clubs
    : [];
  const activeClub = [...stD1, ...stD2].find(c => c && c.isPlayer) || getPlayerClub();

  const currentStats = activeClub
    ? `${activeClub.played}試合 ${activeClub.won}勝 ${activeClub.drawn}分 ${activeClub.lost}敗（勝点 ${activeClub.pts}）`
    : '記録なし';

  // 現在進行中または保存データの得点ランキング上位3名
  const isSavedD2 = st ? stD2.some(c => c && c.isPlayer) : (typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision());
  const clubsSource = isSavedD2
    ? (stD2.length > 0 ? stD2 : (typeof getActivePlayerLeagueClubs === 'function' ? getActivePlayerLeagueClubs() : []))
    : (stD1.length > 0 ? stD1 : (gameState.clubs || []));
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

  const hofState = (st && st.clubHallOfFame && st.clubHallOfFame.players)
    ? st.clubHallOfFame
    : ((typeof gameState !== 'undefined' && gameState.clubHallOfFame && gameState.clubHallOfFame.players) ? gameState.clubHallOfFame : null);
  const snap = extractHallOfFameSnapshot(hofState, activeClub ? activeClub.name : '') || rec.clubRecordsSnapshot;
  const hofRowsHtml = snap && (snap.topApps || snap.topGoals || snap.topAssists)
    ? [
        snap.topGoals ? `<div class="records-scorer-item mono"><span>通算最多得点: ${snap.topGoals.pos} ${snap.topGoals.name}</span><strong class="accent-green">${snap.topGoals.val} G</strong></div>` : '',
        snap.topAssists ? `<div class="records-scorer-item mono"><span>通算最多アシスト: ${snap.topAssists.pos} ${snap.topAssists.name}</span><strong class="text-cyan">${snap.topAssists.val} A</strong></div>` : '',
        snap.topApps ? `<div class="records-scorer-item mono"><span>通算最多出場: ${snap.topApps.pos} ${snap.topApps.name}</span><strong>${snap.topApps.val} 試合</strong></div>` : '',
        snap.singleSeasonGoals ? `<div class="records-scorer-item mono"><span>単年最多得点 (${snap.singleSeasonGoals.seasonYear}): ${snap.singleSeasonGoals.name}</span><strong class="accent-gold">${snap.singleSeasonGoals.val} G</strong></div>` : ''
      ].filter(Boolean).join('')
    : '<div class="records-empty mono">試合やシーズンを重ねるとクラブ殿堂記録が刻まれます</div>';

  const savedAwards = (st && Array.isArray(st.seasonAwardsHistory) && st.seasonAwardsHistory.length > 0)
    ? st.seasonAwardsHistory.slice(0, 5).map(a => ({
        season: a.season,
        seasonYear: a.seasonYear,
        mvp: a.mvp ? `${a.mvp.name} (${a.mvp.clubName})` : '-',
        topScorer: a.topScorer ? `${a.topScorer.name} (${a.topScorer.goals}G)` : '-',
        clubMvp: a.clubMvp ? `${a.clubMvp.name}` : '-'
      }))
    : (Array.isArray(rec.awardsHistory) ? rec.awardsHistory.slice(0, 5) : []);
  const awardsRowsHtml = savedAwards.length > 0
    ? savedAwards.map(a => `<div class="records-scorer-item mono"><span>S${a.season} (${a.seasonYear}) MVP: ${a.mvp}</span><strong class="accent-gold">クラブMVP: ${a.clubMvp}</strong></div>`).join('')
    : '<div class="records-empty mono">シーズン終了後に歴代年間アワードが刻まれます</div>';

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
      <h4 class="records-section-title">クラブ歴代通算・単年記録</h4>
      <div class="records-scorers-list">${hofRowsHtml}</div>
    </div>
    <div class="records-section">
      <h4 class="records-section-title">歴代年間アワード受賞記録</h4>
      <div class="records-scorers-list">${awardsRowsHtml}</div>
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
  const soundCheck = document.getElementById('setting-sound-enabled');
  const soundLabel = document.getElementById('setting-sound-enabled-label');
  const volInput = document.getElementById('setting-sound-volume');
  const volVal = document.getElementById('setting-sound-volume-val');
  const bgmInput = document.getElementById('setting-bgm-volume');
  const bgmVal = document.getElementById('setting-bgm-volume-val');
  const seInput = document.getElementById('setting-se-volume');
  const seVal = document.getElementById('setting-se-volume-val');
  const autoSaveCheck = document.getElementById('setting-autosave-enabled');
  const autoSaveLabel = document.getElementById('setting-autosave-label');
  const speedSelect = document.getElementById('setting-match-speed');
  const autoHtCheck = document.getElementById('setting-auto-halftime');
  const autoHtLabel = document.getElementById('setting-auto-halftime-label');
  const soundEnabled = appSettings.soundEnabled !== false;
  if (soundCheck) soundCheck.checked = soundEnabled;
  if (soundLabel) soundLabel.textContent = soundEnabled ? 'ON' : 'OFF';
  if (volInput) volInput.value = appSettings.soundVolume;
  if (volVal) volVal.textContent = `${appSettings.soundVolume}%`;
  const bgmVolVal = typeof appSettings.bgmVolume === 'number' ? appSettings.bgmVolume : 60;
  const seVolVal = typeof appSettings.seVolume === 'number' ? appSettings.seVolume : 80;
  if (bgmInput) bgmInput.value = bgmVolVal;
  if (bgmVal) bgmVal.textContent = `${bgmVolVal}%`;
  if (seInput) seInput.value = seVolVal;
  if (seVal) seVal.textContent = `${seVolVal}%`;
  if (autoSaveCheck) autoSaveCheck.checked = appSettings.autoSaveEnabled;
  if (autoSaveLabel) autoSaveLabel.textContent = appSettings.autoSaveEnabled ? 'ENABLED' : 'OFF';
  if (speedSelect) speedSelect.value = String(appSettings.matchSpeed || 2);
  if (autoHtCheck) autoHtCheck.checked = Boolean(appSettings.autoHalftimeResume);
  if (autoHtLabel) autoHtLabel.textContent = appSettings.autoHalftimeResume ? 'ENABLED' : 'OFF';
  const cinematicSelect = document.getElementById('setting-cinematic-mode');
  if (cinematicSelect) cinematicSelect.value = appSettings.cinematicMode || 'all';
  const mainMenuEl = document.getElementById('main-menu-screen');
  const isOnMainMenu = Boolean(mainMenuEl && !mainMenuEl.classList.contains('hidden'));
  const titleReturnRow = overlay ? overlay.querySelector('.settings-title-return-row') : null;
  if (titleReturnRow) {
    titleReturnRow.classList.toggle('hidden', isOnMainMenu);
  }
  const summaryEl = document.getElementById('settings-mobile-header-summary');
  if (summaryEl) {
    if (isOnMainMenu) {
      summaryEl.classList.add('hidden');
      summaryEl.innerHTML = '';
    } else {
      const esc = (s) => (typeof escapeCommHtml === 'function')
        ? escapeCommHtml(s)
        : String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
      const clubEl = document.getElementById('header-club-name');
      const clubHtml = clubEl ? clubEl.innerHTML : '';
      const gmName = document.getElementById('header-gm-name')?.textContent || '';
      const leagueLabel = document.querySelector('.status-header .game-label')?.textContent || '';
      const finBadgeEl = document.getElementById('header-finance-badge');
      const finText = finBadgeEl?.textContent || '';
      const finStatusCls = finBadgeEl
        ? Array.from(finBadgeEl.classList).find(c => c.startsWith('status-')) || 'status-healthy'
        : 'status-healthy';
      const targetRank = document.getElementById('header-target-rank')?.textContent || '';
      const season = document.getElementById('header-season')?.textContent || '';
      const curDate = document.getElementById('header-date')?.textContent || '';
      const matchweek = document.getElementById('header-matchweek')?.textContent || '';
      const fundsEl = document.getElementById('header-funds');
      const fundsText = fundsEl?.textContent || '';
      const fundsCls = fundsEl && fundsEl.classList.contains('text-danger') ? 'text-danger' : 'accent-gold';
      const safeBudget = document.getElementById('header-safe-budget')?.textContent || '';
      const safeEl = document.getElementById('header-safe-budget');
      const safeCls = safeEl && safeEl.classList.contains('is-danger')
        ? 'text-danger'
        : (safeEl && safeEl.classList.contains('is-tight') ? 'accent-gold' : 'text-muted');
      const payroll = document.getElementById('header-payroll')?.textContent || '';
      const squad = document.getElementById('header-squad-size')?.textContent || '';
      const supporters = document.getElementById('header-supporters')?.textContent || '';
      const finColorCls = finStatusCls === 'status-healthy'
        ? 'accent-green'
        : (finStatusCls === 'status-danger' || finStatusCls === 'status-critical' ? 'text-danger' : 'accent-gold');

      summaryEl.innerHTML = `
        <div class="settings-mh-brand">
          <div class="settings-mh-title-row">
            <div class="settings-mh-club">${clubHtml}</div>
            <span class="settings-mh-gm mono">GM: <strong>${esc(gmName)}</strong></span>
          </div>
          <div class="settings-mh-meta-row mono">
            <span class="settings-mh-league">${esc(leagueLabel)}</span>
            <span class="settings-mh-meta-sep">·</span>
            <span class="settings-mh-fin ${finColorCls}">${esc(finText)}</span>
            <span class="settings-mh-meta-sep">·</span>
            <span class="settings-mh-target">${esc(targetRank)}</span>
          </div>
        </div>
        <div class="settings-mh-grid">
          <div class="settings-mh-item">
            <span class="settings-mh-label mono">シーズン</span>
            <span class="settings-mh-val mono">${esc(season)}</span>
          </div>
          <div class="settings-mh-item">
            <span class="settings-mh-label mono">日付</span>
            <span class="settings-mh-val mono accent-green">${esc(curDate)}</span>
          </div>
          <div class="settings-mh-item">
            <span class="settings-mh-label mono">日程</span>
            <span class="settings-mh-val mono">${esc(matchweek)}</span>
          </div>
          <div class="settings-mh-item">
            <span class="settings-mh-label mono">週給総額</span>
            <span class="settings-mh-val mono">${esc(payroll)}</span>
          </div>
          <div class="settings-mh-item">
            <span class="settings-mh-label mono">登録選手</span>
            <span class="settings-mh-val mono">${esc(squad)}</span>
          </div>
          <div class="settings-mh-item">
            <span class="settings-mh-label mono">ファン総数</span>
            <span class="settings-mh-val mono">${esc(supporters)}</span>
          </div>
          <div class="settings-mh-item settings-mh-item-wide">
            <span class="settings-mh-label mono">資金</span>
            <span class="settings-mh-val mono">
              <strong class="${fundsCls}">${esc(fundsText)}</strong>
              <span class="settings-mh-sub ${safeCls}">(${esc(safeBudget)})</span>
            </span>
          </div>
        </div>
      `;
      summaryEl.classList.remove('hidden');
    }
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
    const bodyEl = overlay.querySelector('.settings-modal-body');
    overlay.classList.remove('hidden');
    if (bodyEl) bodyEl.scrollTop = 0;
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
  hydrateSaveFromIndexedDBAsync();

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
  const soundCheck = document.getElementById('setting-sound-enabled');
  const soundLabel = document.getElementById('setting-sound-enabled-label');
  if (soundCheck) {
    soundCheck.addEventListener('change', (e) => {
      appSettings.soundEnabled = !!e.target.checked;
      if (soundLabel) soundLabel.textContent = appSettings.soundEnabled ? 'ON' : 'OFF';
      if (appSettings.soundEnabled && typeof SoundEngine !== 'undefined' && SoundEngine) {
        SoundEngine.unlock();
      }
      saveSettingsToStorage();
    });
  }

  const volumeBindings = [
    { inputId: 'setting-sound-volume', settingKey: 'soundVolume', labelId: 'setting-sound-volume-val' },
    { inputId: 'setting-bgm-volume', settingKey: 'bgmVolume', labelId: 'setting-bgm-volume-val' },
    { inputId: 'setting-se-volume', settingKey: 'seVolume', labelId: 'setting-se-volume-val' }
  ];
  volumeBindings.forEach(({ inputId, settingKey, labelId }) => {
    const inputEl = document.getElementById(inputId);
    const labelEl = document.getElementById(labelId);
    if (!inputEl) return;
    const handleVolumeUpdate = (e) => {
      const val = parseInt(e.target.value, 10);
      appSettings[settingKey] = Number.isNaN(val) ? 0 : Math.max(0, Math.min(100, val));
      if (labelEl) labelEl.textContent = `${appSettings[settingKey]}%`;
      if (typeof SoundEngine !== 'undefined' && SoundEngine) {
        SoundEngine.unlock();
      }
      saveSettingsToStorage();
    };
    inputEl.addEventListener('input', handleVolumeUpdate);
    inputEl.addEventListener('change', handleVolumeUpdate);
  });

  const btnTestSound = document.getElementById('btn-test-sound-se');
  if (btnTestSound) {
    btnTestSound.addEventListener('click', () => {
      if (typeof SoundEngine !== 'undefined' && SoundEngine) {
        SoundEngine.unlock();
        SoundEngine.playSfx('sfx_notify', { allowDuringSkip: true, cooldownMs: 0 });
      }
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

  const cinematicSelect = document.getElementById('setting-cinematic-mode');
  if (cinematicSelect) {
    cinematicSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      appSettings.cinematicMode = (val === 'major' || val === 'off') ? val : 'all';
      saveSettingsToStorage();
    });
  }

  const btnResetAll = document.getElementById('btn-reset-all-data');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', () => {
      const ok = window.confirm('保存されている進行データと殿堂記録をすべて消去しますか？');
      if (!ok) return;
      try {
        localStorage.removeItem(SAVE_STORAGE_KEY);
        localStorage.removeItem(RECORDS_STORAGE_KEY);
      } catch (e) {}
      deleteSaveFromIndexedDB();
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

    // モバイル作戦ボード（画面幅768px以下）表示時：
    // ベンチ外エリア内部の縦スクロールと横トレイ操作のみ許可し、ドロワー外や控え固定部のスクロール・プルリロードを遮断する
    const isMobileRosterBoard = (window.innerWidth <= 768) && gameState.activeTab === 'roster' && (!gameState.rosterSubtab || gameState.rosterSubtab === 'board');
    if (isMobileRosterBoard) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const isBenchOrReserveList = e.target && e.target.closest && e.target.closest('.pitch-bench-list, .pitch-reserves-list');
      const reservesList = e.target && e.target.closest && e.target.closest('.pitch-reserves-list');
      if (isHorizontal && isBenchOrReserveList) {
        return;
      }
      if (!isHorizontal && reservesList) {
        const canScrollUp = deltaY > 0 && reservesList.scrollTop > 0;
        const canScrollDown = deltaY < 0 && (reservesList.scrollTop + reservesList.clientHeight < reservesList.scrollHeight - 1);
        if (canScrollUp || canScrollDown) {
          return;
        }
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
