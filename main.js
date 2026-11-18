
// ==========================================================================
// 監督（ヘッドコーチ）采配一任UI ＆ 現場介入イベント制御
// ==========================================================================


/**
 * 監督への「采配一任（戦術同期＋毎試合疲労ローテーション）」ON/OFF切り替え
 */
function toggleManagerDelegation(forceValue = null) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  if (!playerClub.manager) {
    gameState.managerDelegationEnabled = false;
    if (typeof showToast === 'function') {
      showToast('現在監督が空席のため、采配一任は利用できません', 'warn');
    }
    syncManagerDelegationButtonUI();
    return;
  }

  const nextState = typeof forceValue === 'boolean' ? forceValue : !gameState.managerDelegationEnabled;
  gameState.managerDelegationEnabled = nextState;

  if (nextState) {
    applyManagerPreMatchDelegation(playerClub, true);
  }

  syncManagerDelegationButtonUI();
  renderAll();
}

function syncManagerDelegationButtonUI() {
  const isOn = Boolean(gameState.managerDelegationEnabled);
  const btn = document.getElementById('btn-toggle-manager-delegation');
  if (btn) {
    btn.textContent = isOn ? '監督一任: ON' : '監督一任: OFF';
    btn.classList.toggle('is-active', isOn);
  }
}


/**
 * GMが手動で陣形・戦術・選手交代を行った際、一任モードからGM介入モードへ自動移行する
 */
function notifyGmManualIntervention(reasonLabel = '') {
  if (!gameState.managerDelegationEnabled) return;
  gameState.managerDelegationEnabled = false;
  syncManagerDelegationButtonUI();
  addDailyLog(`手動変更${reasonLabel ? `（${reasonLabel}）` : ''}により「監督一任」を解除し、GM介入モードへ移行しました。`);
}

/**
 * 信頼崩壊（trust <= 10）時の監督進退伺い・緊急会談イベント
 */
function checkAndShowManagerTrustCrisis() {
  if (!gameState.pendingManagerCrisis || gameState.isGameOver || gameState.isSeasonOver) return false;
  gameState.pendingManagerCrisis = false;
  const club = getPlayerClub();
  if (!club || !club.manager || (club.manager.trust ?? 80) > 15) return false;

  const mgr = club.manager;
  const tacName = getManagerTacticLabel(mgr.preferredTactic);
  showGmModal({
    category: 'TECHNICAL STAFF / EMERGENCY MEETING',
    title: `【緊急会談】${mgr.name}監督からの進退伺い`,
    description: `フロントによる継続的な戦術・起用への現場介入と成績不振を受け、${mgr.name}監督との信頼関係が限界に達しています。「自身の哲学（${mgr.preferredFormation} / ${tacName}）で現場を任せてもらえないなら、双方合意のもと退任したい」と申し出ています。`,
    detailHtml: `現在の監督信頼度: <strong class="text-danger">${mgr.trust}%</strong> ／ 得意哲学: <strong>${mgr.preferredFormation}・${tacName}</strong>`,
    actions: [
      {
        label: '現場の裁量を尊重し、采配一任で和解する',
        className: 'btn btn-primary',
        onClick: () => {
          mgr.trust = 45;
          mgr.interventionStreak = 0;
          gameState.managerDelegationEnabled = true;
          applyManagerPreMatchDelegation(club, true);
          addDailyLog(`【緊急会談・和解】${mgr.name}監督に現場采配を一任することで合意し、信頼関係が修復に向かいました。`);
          renderAll();
        }
      },
      {
        label: '双方合意で契約解除（違約金£0で退任）',
        className: 'btn btn-danger',
        onClick: () => {
          const oldName = mgr.name;
          if (Array.isArray(gameState.freeManagers)) {
            mgr.trust = 75;
            mgr.interventionStreak = 0;
            gameState.freeManagers.push(mgr);
          }
          club.manager = null;
          gameState.managerDelegationEnabled = false;
          addDailyLog(`【双方合意退任】戦術方針の相違により、${oldName}監督が違約金なしで退任しました。「監督・指導陣」タブから後任を招聘してください。`);
          renderAll();
        }
      }
    ]
  });
  return true;
}


'use strict';

/**
 * 僕のサッカークラブ（仮） - English Premier GM Simulation
 * 外部ライブラリ非依存 / 純粋なJavaScript実装
 * 内部通貨単位：1 = £1K（1,000ポンド）。例：45000 = £45.0M、500 = £500K
 */

let modalLockSavedScrollY = 0;
let modalLockContainerScrolls = [];

function setBodyModalLock(locked) {
  if (locked) {
    if (!document.body.classList.contains('modal-open')) {
      modalLockSavedScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      modalLockContainerScrolls = [];
      const scrollableCandidates = document.querySelectorAll(
        '.tab-view, .table-container, .main-scroll-container, #view-roster, #view-market, #view-team, #view-office'
      );
      scrollableCandidates.forEach(el => {
        if (el && el.scrollTop > 0) {
          modalLockContainerScrolls.push({ el, top: el.scrollTop });
        }
      });
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }
  } else {
    const openModals = document.querySelectorAll('.modal-overlay:not(.hidden), #gm-modal-overlay:not(.hidden)');
    if (openModals.length === 0) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      const restore = () => {
        if (typeof modalLockSavedScrollY === 'number') {
          window.scrollTo(0, modalLockSavedScrollY);
          if (document.documentElement) document.documentElement.scrollTop = modalLockSavedScrollY;
          if (document.body) document.body.scrollTop = modalLockSavedScrollY;
        }
        modalLockContainerScrolls.forEach(({ el, top }) => {
          if (el && el.scrollTop !== top) {
            el.scrollTop = top;
          }
        });
      };
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore, 20);
      setTimeout(restore, 60);
    }
  }
}

// ゲーム全体の状態管理
const gameState = {
  gmName: 'L. Vance',
  selectedClubId: 'london_fc',
  hasStartedOnce: false,
  season: 1,
  playerDivision: 'd1',
  currentWeek: 0,
  totalWeeks: 38,
  isSeasonOver: false,
  isGameOver: false,
  isSimulating: false,
  consecutiveDeficitSeasons: 0,
  paidPayrollWeeks: 0,          // 今季支払い済みの週次給与回数（0〜52週）
  managerDelegationEnabled: true, // 監督への采配一任（戦術同期＋疲労ローテーション）
  pendingManagerCrisis: false,
  lastSeasonStandingsOrder: null,
  lastSeasonCupWinners: null,
  activeTab: 'office',
  clubs: [],
  europeanMegaClubs: [...EUROPEAN_MEGA_CLUBS],
  schedule: [],
  calendar: [],                 // 365日分の年間カレンダー配列
  currentDayIndex: 0,           // 現在の日付インデックス（0〜364）
  isAdvancingCalendar: false,   // 「次の試合まで進める」高速連続進行中フラグ
  calendarAdvanceTimer: null,   // 高速進行用タイマー
  dailyLogs: [],                // 日々の進行ミニログ（直近数件）
  lastWeekResults: [],
  lastMatchTicker: null,
  transferMarket: [],
  euroTransferList: [],         // 欧州主要クラブ（ESP/ITA/GER/FRA）の移籍リストアップ選手
  youthCandidates: [],
  activeYouthScouts: [],
  youthScoutReports: [],
  facilities: {
    stadium: 1,
    training: 1,
    scouting: 1
  },
  facilityFeedback: '',
  lastSettlement: null,
  selectedPlayerId: null,
  selectedSlotIndex: null,
  profileModalPlayerId: null,
  negotiationSession: null,
  pendingMegaOffer: null,
  incomingTransferOffer: null,   // 他クラブからの買取オファー
  incomingOffers: [],            // 受信オファーリスト（プール制）
  outgoingOffers: [],            // 送信オファーリスト（プール＆履歴）
  offersSubtab: 'incoming',      // オファータブ内の表示 ('incoming' | 'outgoing')
  targetShortlist: [],
  preContractPlayers: [],        // 来季事前合意（内定）選手リスト           // 獲得ターゲットリスト（SHORTLIST）
  facilitiesSubtab: 'investment', // 経営タブ内サブタブ ('investment' | 'staff' | 'youth')
  teamSubtab: 'standings',       // チームタブ内サブタブ ('standings' | 'schedule' | 'stats')
  competitionStats: {},          // 大会別個人スタッツ集計マップ (d1, d2, leagueCup, nationalCup, championsCup, europaCup, conferenceCup, preseasonCup)
  statsCompView: 'league',       // 個人スタッツ大会グループ ('league' | 'domestic' | 'europe' | 'preseason')
  statsLeagueDivision: null,     // 個人スタッツ選択ディビジョン ('d1' | 'd2')
  statsDomesticCup: 'leagueCup', // 個人スタッツ選択国内カップ ('leagueCup' | 'nationalCup')
  statsEuroCup: null,            // 個人スタッツ選択欧州カップ ('championsCup' | 'europaCup' | 'conferenceCup')
  scheduleViewMode: 'calendar',  // 日程・結果表示モード ('calendar' | 'list')
  calendarViewYear: 2026,        // 月間カレンダー表示年
  calendarViewMonth: 8,          // 月間カレンダー表示月
  matchHistory: [],              // 自クラブのシーズン全公式戦サマリー履歴
  marketSubtab: 'market',        // 移籍タブ内サブタブ ('market' | 'shortlist' | 'offers')
  marketFilter: {                // グローバル移籍市場の絞り込み状態
    category: 'ALL',
    clubId: 'ALL',
    position: 'ALL',
    ageRange: 'ALL',
    statusFilter: 'ALL',
    sortKey: 'ovr-desc',
    searchQuery: ''
  },
  scoutingIntel: {},
  activeScoutAssignments: [],
  installments: [],
  sellOnRights: [],
  intlBreakState: null,
  pendingBoardCrisis: false,
  pendingDeadlineOffer: false,
  secretaryId: 'sec_claire',
  inboxMessages: [],
  newsFeed: [],
  managerWishes: null,
  officeCommTab: 'messages',
  inboxCategoryFilter: 'ALL',
  expandedMessageId: null,
  expandedNewsId: null,
  monthlyLedger: null,
  monthlyReports: [],
  pendingLineupConsultation: null,
  totalPlayerMatchesPlayed: 0,
  lastConsultationMatchCount: 0,
  consultationSeq: 0
};



const MAX_POSITION_TRAINING_PER_PLAYER = 2;

const POSITION_TRAINING_ADJACENT_MAP = {
  CB: ['LB', 'RB', 'DM'],
  LB: ['CB', 'RB', 'DM', 'LM', 'LW'],
  RB: ['CB', 'LB', 'DM', 'RM', 'RW'],
  SB: ['CB', 'LB', 'RB', 'DM', 'LM', 'RM'],
  DM: ['CB', 'LB', 'RB', 'CM', 'AM'],
  CM: ['DM', 'AM', 'LM', 'RM'],
  LM: ['LB', 'CM', 'AM', 'RM', 'LW'],
  RM: ['RB', 'CM', 'AM', 'LM', 'RW'],
  SM: ['LB', 'RB', 'CM', 'AM', 'LM', 'RM', 'LW', 'RW'],
  AM: ['CM', 'LM', 'RM', 'LW', 'RW', 'CF'],
  LW: ['LM', 'AM', 'RW', 'CF'],
  RW: ['RM', 'AM', 'LW', 'CF'],
  WG: ['LM', 'RM', 'AM', 'LW', 'RW', 'CF'],
  CF: ['AM', 'LW', 'RW'],
  ST: ['AM', 'LW', 'RW']
};

function getMaxConcurrentPositionTrainingSlots() {
  const trLv = (typeof gameState !== 'undefined' && gameState.facilities && typeof gameState.facilities.training === 'number')
    ? gameState.facilities.training
    : 1;
  if (trLv >= 5) return 4;
  if (trLv >= 3) return 3;
  return 2;
}

function getActivePositionTrainingCount(club) {
  if (!club || !Array.isArray(club.players)) return 0;
  return club.players.filter(pl => pl && !(pl.loanStatus && pl.loanStatus.isLoanOut) && pl.positionTraining && pl.positionTraining.active && pl.positionTraining.targetPos).length;
}

function getEligiblePositionTrainingTargets(player) {
  ensurePlayerProficiencies(player);
  const normPos = (pos) => (pos === 'LWB') ? 'LB' : ((pos === 'RWB') ? 'RB' : (pos === 'ST' ? 'CF' : pos));
  const primary = normPos(player.primaryPosition || player.preferredPosition || player.pos);
  const mains = (Array.isArray(player.mainPositions) ? player.mainPositions : [primary]).map(normPos);
  if (!mains.includes(primary)) mains.push(primary);
  const subs = (Array.isArray(player.subPositions) ? player.subPositions : []).map(normPos);

  const upgradeCandidates = [...new Set(subs.filter(pos => !mains.includes(pos) && pos !== 'GK'))];

  const allFieldPositions = ['CB', 'LB', 'RB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'CF'];
  const allowedNewSet = new Set();
  for (const knownPos of [...mains, ...subs]) {
    const adj = POSITION_TRAINING_ADJACENT_MAP[knownPos];
    if (Array.isArray(adj)) {
      adj.forEach(p => allowedNewSet.add(p));
    }
  }
  const newSubCandidates = allFieldPositions.filter(
    pos => allowedNewSet.has(pos) && !mains.includes(pos) && !subs.includes(pos)
  );
  return { upgradeCandidates, newSubCandidates };
}

/**
 * 選手のポジション特訓（適性習得・本適性昇格）を開始する
 */
function startPlayerPositionTraining(playerId, targetPos) {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;
  const player = playerClub.players.find(p => p.id === playerId);
  if (!player) return false;
  const primary = player.primaryPosition || player.preferredPosition || player.pos;
  if (primary === 'GK') return false;

  const completedCount = player.positionTrainingCount || 0;
  if (completedCount >= MAX_POSITION_TRAINING_PER_PLAYER) {
    if (typeof showToast === 'function') {
      showToast(`${player.name} のポジション特訓は生涯上限（${MAX_POSITION_TRAINING_PER_PLAYER}回）に達しています`, 'warning');
    }
    return false;
  }

  const isAlreadyTrainingThisPlayer = Boolean(player.positionTraining && player.positionTraining.active);
  const activeCount = getActivePositionTrainingCount(playerClub);
  const maxSlots = getMaxConcurrentPositionTrainingSlots();
  if (!isAlreadyTrainingThisPlayer && activeCount >= maxSlots) {
    if (typeof showToast === 'function') {
      showToast(`同時特訓枠の上限（${activeCount}/${maxSlots}名）に達しています。練習場Lvを上げるか他の特訓を完了・中止してください`, 'warning');
    }
    return false;
  }

  const normTarget = (targetPos === 'LWB') ? 'LB' : ((targetPos === 'RWB') ? 'RB' : targetPos);
  const { upgradeCandidates, newSubCandidates } = getEligiblePositionTrainingTargets(player);
  let mode = null;
  if (upgradeCandidates.includes(normTarget)) {
    mode = 'major';
  } else if (newSubCandidates.includes(normTarget)) {
    mode = 'sub';
  } else {
    if (typeof showToast === 'function') {
      showToast('現在の適性からこのポジションは習得できません', 'warning');
    }
    return false;
  }

  player.positionTraining = {
    targetPos: normTarget,
    mode: mode,
    progress: 0,
    active: true
  };

  const modeLabel = mode === 'major' ? '本適性への昇格' : '薄適性の新規習得';
  addDailyLog(`【特訓開始】#${player.squadNumber || '-'} ${player.name} が [${normTarget}] の${modeLabel}トレーニングを開始しました！`);
  renderRoster();
  openPlayerProfileModal(playerId);
  return true;
}

/**
 * 選手のポジション特訓を中止する
 */
function cancelPlayerPositionTraining(playerId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;
  const player = playerClub.players.find(p => p.id === playerId);
  if (!player) return false;

  if (player.positionTraining) {
    const cancelledPos = player.positionTraining.targetPos;
    player.positionTraining = null;
    addDailyLog(`【特訓中止】#${player.squadNumber || '-'} ${player.name} の [${cancelledPos}] 特訓を中止しました。`);
    renderRoster();
    openPlayerProfileModal(playerId);
  }
  return true;
}

/**
 * ユーザーが作戦ボードの「おまかせ最適編成」を押した際の処理
 */
function applyAutoOptimalLineup() {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  optimizeClubStarters(playerClub);
  renderRoster();
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
 * 年間カレンダーエンジン（365日分の日程・試合日・移籍ウィンドウ）の生成
 * @param {number} seasonYear 開幕年（例: 2026）
 * @param {Array} seasonSchedule 全38節の対戦カード配列
 */
function generateSeasonCalendar(seasonYear, seasonSchedule, totalRounds = null) {
  const days = [];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const targetRounds = totalRounds || (Array.isArray(seasonSchedule) && seasonSchedule.length > 0 ? seasonSchedule.length : 38);

  const matchdayOffsets = [];
  let roundCount = 0;

  for (let offset = 0; offset < 340 && roundCount < targetRounds; offset++) {
    const curD = new Date(seasonYear, 6, 1 + offset); // 7月1日ベース
    const dayOfWeek = curD.getDay(); // 0:日, 1:月, ..., 6:土
    const month = curD.getMonth() + 1; // 1-12
    const dateNum = curD.getDate();

    // プレシーズン期間（7月中および8月14日まで）は公式戦なし
    const isPreSeason = (month === 7) || (month === 8 && dateNum < 15);
    if (isPreSeason) {
      continue;
    }

    // 代表ウィーク等の休止期間
    const isIntlBreak = (
      (month === 9 && dateNum >= 4 && dateNum <= 8) ||
      (month === 10 && dateNum >= 9 && dateNum <= 13) ||
      (month === 11 && dateNum >= 13 && dateNum <= 17) ||
      (month === 3 && dateNum >= 19 && dateNum <= 24)
    );
    if (isIntlBreak) {
      continue;
    }

    // ミッドウィーク（水曜開催）スロット（2部46節モード時は追加水曜開催枠も解禁）
    let isMidweek = false;
    if (dayOfWeek === 3) {
      if ((month === 12 && (dateNum === 2 || dateNum === 16 || dateNum === 30)) ||
          (month === 1 && dateNum === 13) ||
          (month === 2 && dateNum === 24) ||
          (month === 4 && (dateNum === 7 || dateNum === 21))) {
        isMidweek = true;
      } else if (targetRounds > 38 && (
          (month === 8 && dateNum >= 18 && dateNum <= 26) ||
          (month === 9 && dateNum >= 9 && dateNum <= 16) ||
          (month === 10 && dateNum >= 14 && dateNum <= 21) ||
          (month === 11 && dateNum >= 18 && dateNum <= 25) ||
          (month === 1 && dateNum >= 20 && dateNum <= 28) ||
          (month === 2 && dateNum >= 10 && dateNum <= 18) ||
          (month === 3 && dateNum >= 3 && dateNum <= 11) ||
          (month === 4 && dateNum >= 25 && dateNum <= 30)
      )) {
        isMidweek = true;
      }
    }

    if (dayOfWeek === 6 || isMidweek) {
      matchdayOffsets.push(offset);
      roundCount++;
    }
  }

  // もし目標節数に満たない場合のフォールバック（以降の土曜・水曜を順次追加）
  let fallbackOffset = matchdayOffsets.length > 0 ? matchdayOffsets[matchdayOffsets.length - 1] + 1 : 45;
  while (matchdayOffsets.length < targetRounds && fallbackOffset < 365) {
    const d = new Date(seasonYear, 6, 1 + fallbackOffset);
    if (d.getDay() === 6 || (targetRounds > 38 && d.getDay() === 3)) {
      matchdayOffsets.push(fallbackOffset);
    }
    fallbackOffset++;
  }

  // 365日分のカレンダー配列を構築（7月1日スタート）
  for (let offset = 0; offset < 365; offset++) {
    const curDate = new Date(seasonYear, 6, 1 + offset);
    const y = curDate.getFullYear();
    const m = curDate.getMonth() + 1;
    const d = curDate.getDate();
    const dayOfWeek = curDate.getDay();
    const dayOfWeekName = dayNames[dayOfWeek];
    const displayDate = `${y}年 ${m}月${d}日 (${dayOfWeekName})`;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 移籍ウィンドウ判定（夏: 7/1〜8/31, 冬: 1/1〜1/31）
    const windowOpen = (m === 7) || (m === 8) || (m === 1);
    const isTransferDeadline = (m === 8 && d === 31) || (m === 1 && d === 31);
    const isIntlBreakDay = (
      (m === 9 && d >= 4 && d <= 8) ||
      (m === 10 && d >= 9 && d <= 13) ||
      (m === 11 && d >= 13 && d <= 17) ||
      (m === 3 && d >= 19 && d <= 24)
    );

    const matchIdx = matchdayOffsets.indexOf(offset);
    const isMatchDay = matchIdx !== -1 && matchIdx < targetRounds;
    const matchWeek = isMatchDay ? matchIdx + 1 : null;
    const matchFixture = isMatchDay ? (seasonSchedule[matchIdx] || null) : null;

    let eventType = 'training';
    if (isMatchDay) {
      eventType = 'match';
    } else if (isTransferDeadline) {
      eventType = 'deadline';
    } else if (isIntlBreakDay) {
      eventType = 'intl';
    } else if (matchdayOffsets.indexOf(offset - 1) !== -1) {
      eventType = 'recovery';
    }

    days.push({
      dayIndex: offset,
      date: curDate,
      dateStr,
      year: y,
      month: m,
      day: d,
      dayOfWeek,
      dayOfWeekName,
      displayDate,
      isMatchDay,
      matchWeek,
      matchFixture,
      played: false,
      windowOpen,
      isTransferDeadline,
      isIntlBreak: isIntlBreakDay,
      eventType
    });
  }

  return days;
}

/**
 * 現在のゲーム内カレンダー日オブジェクトを取得
 */
function getCurrentCalendarDay() {
  if (!gameState.calendar || gameState.calendar.length === 0) return null;
  const idx = Math.min(gameState.currentDayIndex, gameState.calendar.length - 1);
  return gameState.calendar[idx] || null;
}

/**
 * 指定日の自クラブ対戦情報（リーグ/カップ/欧州）を取得
 */
function getCalendarDayPlayerMatch(day) {
  if (!day) return null;
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  if (!playerClub) return null;

  // 1. 通常リーグ戦（ENG-D1 または ENG-D2）
  if (day.isMatchDay && day.matchFixture) {
    const m = day.matchFixture.find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
    if (m) {
      const isHome = m.homeId === playerClub.id;
      const oppClub = getClubById(isHome ? m.awayId : m.homeId);
      const isPlayed = Boolean(m.played || day.played);
      const divCode = isPlayerInSecondDivision() ? 'ENG-D2' : 'ENG-D1';
      return {
        type: 'league',
        title: `${divCode} 第${day.matchWeek}節`,
        compCode: divCode,
        match: m,
        isHome,
        oppClub,
        played: isPlayed
      };
    }
  }

  const resolveMatchOpponent = (m, isHome) => {
    const rawOpp = isHome ? m.awayClub : m.homeClub;
    const oppId = isHome ? m.awayId : m.homeId;
    const canonical = (oppId && typeof getClubById === 'function') ? getClubById(oppId) : null;
    return (canonical && Array.isArray(canonical.players) && canonical.players.length > 0) ? canonical : rawOpp;
  };

  // 2. カップ戦 / 欧州戦 / プレシーズン親善杯
  if (day.isCupMatchDay) {
    // プレシーズン親善杯（ワールド・チャレンジ・トロフィー）
    if (day.cupCompType === 'preseasonCup') {
      const comp = gameState.competitions && gameState.competitions.preseasonCup;
      const roundNum = day.preseasonRound || 1;
      if (comp && comp.matches) {
        const m = comp.matches.find(x => x.round === roundNum);
        if (m) {
          const isHome = m.homeId === playerClub.id;
          const oppClub = resolveMatchOpponent(m, isHome);
          return {
            type: 'preseasonCup',
            compKey: 'preseasonCup',
            comp,
            title: `WCT ${m.roundName || `第${roundNum}戦`}`,
            compCode: 'WCT',
            match: m,
            isHome,
            oppClub,
            played: Boolean(m.played || day.played),
            isPreseason: true
          };
        }
      }
    }

    // 欧州リーグフェーズ（MD1〜8）
    if (day.cupCompType === 'euroLeaguePhase' || day.euroMd) {
      const md = day.euroMd || 1;
      const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
      for (const ek of euroKeys) {
        const comp = gameState.competitions && gameState.competitions[ek];
        if (comp && comp.leagueSchedule && comp.leagueSchedule[md - 1]) {
          const m = comp.leagueSchedule[md - 1].find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
          if (m) {
            const isHome = m.homeId === playerClub.id;
            const oppClub = resolveMatchOpponent(m, isHome);
            return {
              type: 'euroLeague',
              compKey: ek,
              comp,
              title: `${comp.name} 第${md}節`,
              compCode: comp.shortCode || 'ECT',
              match: m,
              isHome,
              oppClub,
              played: Boolean(m.played || day.played)
            };
          }
        }
      }
    }

    // 欧州プレーオフ
    if (day.cupCompType === 'euroPlayoff') {
      const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
      for (const ek of euroKeys) {
        const comp = gameState.competitions && gameState.competitions[ek];
        if (comp && comp.playoffs) {
          const m = comp.playoffs.find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
          if (m) {
            const isHome = m.homeId === playerClub.id;
            const oppClub = resolveMatchOpponent(m, isHome);
            return {
              type: 'euroPlayoff',
              compKey: ek,
              comp,
              title: `${comp.name} 決勝T進出プレーオフ`,
              compCode: comp.shortCode || 'ECT',
              match: m,
              isHome,
              oppClub,
              played: Boolean(m.played || day.played)
            };
          }
        }
      }
    }

    // 国内カップ戦 or 欧州決勝トーナメント
    const compKey = day.cupCompType;
    const comp = gameState.competitions && gameState.competitions[compKey];
    if (comp && comp.rounds && day.cupRoundKey) {
      const roundMatches = comp.rounds[day.cupRoundKey] || [];
      const m = roundMatches.find(x => x.homeId === playerClub.id || x.awayId === playerClub.id);
      if (m) {
        const isHome = m.homeId === playerClub.id;
        const oppClub = resolveMatchOpponent(m, isHome);
        
        // ラウンド名称の正規化マッピング（R32は1回戦、R16は国内カップ戦なら2回戦、欧州なら決勝T 1回戦）
        let roundText = '';
        if (day.cupRoundKey === 'R32') {
          roundText = '1回戦';
        } else if (day.cupRoundKey === 'R16') {
          roundText = (compKey === 'championsCup' || compKey === 'europaCup' || compKey === 'conferenceCup') ? '決勝T 1回戦' : '2回戦';
        } else if (day.cupRoundKey === 'QF') {
          roundText = '準々決勝';
        } else if (day.cupRoundKey === 'SF') {
          roundText = '準決勝';
        } else if (day.cupRoundKey === 'FINAL') {
          roundText = '決勝';
        } else {
          roundText = day.cupLabel || day.cupRoundKey;
        }

        return {
          type: 'cup',
          compKey,
          comp,
          title: `${comp.name} ${roundText}`,
          compCode: comp.shortCode || (compKey === 'leagueCup' ? 'L-CUP' : 'N-CUP'),
          match: m,
          isHome,
          oppClub,
          played: Boolean(m.played || day.played)
        };
      }
    }
  }

  return null;
}

/**
 * 今日が未消化の試合日（Matchday）かどうかを判定
 */
function isTodayMatchDayPending() {
  const day = getCurrentCalendarDay();
  if (!day || gameState.isSeasonOver || day.played) return false;
  if (day.isMatchDay) {
    const matchInfo = getCalendarDayPlayerMatch(day);
    return Boolean(matchInfo && !matchInfo.played);
  }
  if (day.isCupMatchDay) {
    const matchInfo = getCalendarDayPlayerMatch(day);
    if (matchInfo && !matchInfo.played) return true;
  }
  return false;
}

/**
 * 現在のカレンダー日以降（当日含む）に未消化のカップ戦・欧州コンペが残っているか判定
 */
function hasRemainingCupMatches() {
  if (!Array.isArray(gameState.calendar)) return false;
  const curIdx = Math.max(0, gameState.currentDayIndex || 0);
  return gameState.calendar.some((d, idx) => idx >= curIdx && d && d.isCupMatchDay && !d.played);
}

/**
 * 日々の進行ミニログを追加（直近5件を保持）
 */
function addDailyLog(message) {
  const day = getCurrentCalendarDay();
  const datePrefix = day ? `${day.month}/${day.day} (${day.dayOfWeekName})` : '';
  gameState.dailyLogs.unshift({ date: datePrefix, message });
  if (gameState.dailyLogs.length > 5) {
    gameState.dailyLogs.pop();
  }
}

/**
 * 画面右上にトースト通知をポップアップ表示
 */
function showToast(message, type = 'info') {
  if (type !== 'error' && type !== 'warn' && type !== 'warning') return;
  const gmOverlay = document.getElementById('gm-modal-overlay');
  if (gmOverlay && !gmOverlay.classList.contains('hidden')) return;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

/**
 * 指定のカレンダー日がプレイヤー自身の未消化カップ/欧州戦に該当するか判定する（他会場の先行消化は行わない）
 */
function hasPlayerCupMatchOnDay(day) {
  if (!day || !day.isCupMatchDay || day.played || !gameState.competitions) return false;
  const playerClub = getPlayerClub();
  if (!playerClub) return false;
  const pId = playerClub.id;
  const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];

  if (day.cupCompType === 'preseasonCup') {
    const pre = gameState.competitions.preseasonCup;
    if (!pre || !Array.isArray(pre.matches)) return false;
    const roundNum = Number(day.preseasonRound) || Number(String(day.cupRoundKey || '').replace(/\D+/g, '')) || 1;
    const m = pre.matches.find(x => Number(x.round) === roundNum);
    return Boolean(m && !m.played);
  }
  if (day.cupCompType === 'euroLeaguePhase' || day.euroMd) {
    const mdIdx = (day.euroMd || 1) - 1;
    return euroKeys.some(ek => {
      const comp = gameState.competitions[ek];
      const roundMatches = comp && comp.leagueSchedule && comp.leagueSchedule[mdIdx];
      return Array.isArray(roundMatches) && roundMatches.some(m => !m.played && (m.homeId === pId || m.awayId === pId));
    });
  }
  if (day.cupCompType === 'euroPlayoff') {
    return euroKeys.some(ek => {
      const comp = gameState.competitions[ek];
      return comp && Array.isArray(comp.playoffs) && comp.playoffs.some(m => !m.played && (m.homeId === pId || m.awayId === pId));
    });
  }
  const comp = gameState.competitions[day.cupCompType];
  const roundMatches = comp && comp.rounds && comp.rounds[day.cupRoundKey];
  return Array.isArray(roundMatches) && roundMatches.some(m => !m.played && (m.homeId === pId || m.awayId === pId));
}

/**
 * カレンダーを1日進める処理（平日ルーティン / 負傷回復 / 移籍オファー判定）
 * @param {boolean} skipRender 高速連続進行時の個別render省略フラグ
 * @returns {boolean} 停止トリガーが発生したか（試合日・重要イベント・シーズン終了など）
 */
function advanceCalendarDay(skipRender = false) {
  if (gameState.isGameOver || gameState.isSeasonOver) {
    stopAdvancingCalendar();
    return true;
  }

  // もし今日が未消化の試合日なら、先に試合を消化する必要があるため進めない
  if (isTodayMatchDayPending()) {
    stopAdvancingCalendar();
    return true;
  }

  // 日付インデックスを進める
  const prevDay = getCurrentCalendarDay();
  gameState.currentDayIndex++;
  const nextDay = getCurrentCalendarDay();
  if (typeof pruneExpiredNewsItems === 'function') pruneExpiredNewsItems(7);

  // シーズンカレンダーの終了判定（リーグ戦全節完了 かつ 残りのカップ戦・欧州コンペ完了時のみ終了）
  if (!nextDay || gameState.currentDayIndex >= gameState.calendar.length || (gameState.currentWeek >= gameState.totalWeeks && !hasRemainingCupMatches())) {
    stopAdvancingCalendar();
    if (!gameState.isSeasonOver) {
      processSeasonEnd(Boolean(skipRender));
    }
    if (!skipRender) {
      renderAll();
      if (gameState.hasStartedOnce && typeof saveGameToStorage === 'function') saveGameToStorage(false);
    }
    return true;
  }

  // 1. 平日の選手状態更新（全治日数のカウントダウン ＆ 疲労度自然回復 ＆ 適応日数減 ＆ ポジション特訓進行）
  for (const club of getAllManagedLeagueClubs()) {
    for (const p of (club.players || [])) {
      if (typeof p.adaptationDays === 'number' && p.adaptationDays > 0) {
        p.adaptationDays = Math.max(0, p.adaptationDays - 1);
      }
      // 疲労度の自然回復（1日あたり -4、0まで回復）
      if (typeof p.fatigue === 'number' && p.fatigue > 0) {
        p.fatigue = Math.max(0, p.fatigue - 4);
      } else if (p.fatigue == null) {
        p.fatigue = 0;
      }

      if (p.injuryDays && p.injuryDays > 0) {
        p.injuryDays -= 1;
        p.injuryWeeks = Math.ceil(p.injuryDays / 7);
        if (p.injuryDays === 0) {
          p.injuryWeeks = 0;
          if (club.isPlayer) {
            addDailyLog(`【復帰】#${p.squadNumber || '-'} ${p.name} が怪我から全体練習に復帰しました！`);
          }
        }
      }
      // ポジション特訓の平日練習進行（平日1日あたり基本 +2%、若手ほど速くベテランは緩やか）
      if (club.isPlayer && p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
        const cEff = typeof getClubCoachingEffects === 'function' ? getClubCoachingEffects(club) : { analysisBonus: 0 };
        const baseTrainStep = 2 + Math.round((cEff.analysisBonus || 0) * 3);
        const ageMod = (p.age <= 23) ? 1 : ((p.age >= 30) ? -1 : 0);
        const dailyTrainStep = Math.max(1, baseTrainStep + ageMod);
        p.positionTraining.progress = Math.min(100, (p.positionTraining.progress || 0) + dailyTrainStep);
        if (p.positionTraining.progress >= 100) {
          const tPos = p.positionTraining.targetPos;
          const mode = p.positionTraining.mode || 'sub';
          if (!Array.isArray(p.secondaryPositions)) p.secondaryPositions = [];
          if (!Array.isArray(p.majorPositions)) {
            const pri = p.primaryPosition || p.preferredPosition || p.pos;
            p.majorPositions = [pri];
          }

          if (!Array.isArray(p.mainPositions)) p.mainPositions = [...(p.majorPositions || [p.pos])];
          if (!Array.isArray(p.subPositions)) p.subPositions = [...(p.secondaryPositions || [])];

          if (mode === 'major') {
            if (!p.mainPositions.includes(tPos)) p.mainPositions.push(tPos);
            p.subPositions = p.subPositions.filter(pos => pos !== tPos);
            addDailyLog(`【適性習得報告】コーチ陣より、#${p.squadNumber || '-'} ${p.name} が [${tPos}] を本職水準で完全にモノにしたとの報告が上がりました。`);
          } else {
            if (!p.subPositions.includes(tPos)) p.subPositions.push(tPos);
            addDailyLog(`【適性習得報告】#${p.squadNumber || '-'} ${p.name} がトレーニングを通じて [${tPos}] でのプレー感覚を掴み、サブポジションとして実戦起用可能な水準に達しました。`);
          }
          p.majorPositions = p.mainPositions;
          p.secondaryPositions = p.subPositions;
          p.positionTrainingCount = (p.positionTrainingCount || 0) + 1;
          p.positionTraining = null;
        }
      }
    }
  }

  // 毎週日曜（dayOfWeek === 0）に週次人件費（選手・監督・コーチ週給合計、年間最大52回）を自動引き落とし
  if (nextDay.dayOfWeek === 0 && (gameState.paidPayrollWeeks || 0) < 52) {
    gameState.paidPayrollWeeks = (gameState.paidPayrollWeeks || 0) + 1;
    const pClub = getPlayerClub();
    let playerPaidWeekly = 0;
    for (const club of getAllManagedLeagueClubs()) {
      const weeklyCost = getClubWeeklyPayroll(club);
      club.funds = (club.funds || 0) - weeklyCost;
      if (pClub && club.id === pClub.id) {
        playerPaidWeekly = weeklyCost;
      }
    }
    if (pClub && playerPaidWeekly > 0) {
      if (typeof ensureMonthlyLedger === 'function') {
        ensureMonthlyLedger(false, nextDay).payrollPaid += playerPaidWeekly;
      }
      addDailyLog(`【週次給与決済 (${gameState.paidPayrollWeeks}/52週)】選手・指導陣の週給合計 -${formatMoney(playerPaidWeekly)} を支払いました（現在資金: ${formatMoney(pClub.funds)}）`);
    }
  }

  // 月初（月替わり時）に全選手の市場価値推移（valueHistory）を最新状況で更新
  if (typeof advanceScoutingProgressDaily === 'function') {
    advanceScoutingProgressDaily();
  }
  if (typeof advanceYouthScoutingDaily === 'function') {
    advanceYouthScoutingDaily();
  }
  let winterMarketEvent = false;
  if (nextDay.day === 1) {
    for (const club of getAllManagedLeagueClubs()) {
      for (const p of (club.players || [])) {
        if (p.isRetired) continue;
        if (Array.isArray(p.valueHistory) && p.valueHistory.length > 0) {
          if (p._mvSchema !== 2 && typeof ensurePlayerValueHistory === 'function') {
            ensurePlayerValueHistory(p, club.name);
          } else {
            const curVal = calculatePlayerMarketValue(p);
            const curOvr = getPlayerOverallRating(p);
            const lastPt = p.valueHistory[p.valueHistory.length - 1];
            if (lastPt) {
              lastPt.value = curVal;
              lastPt.ovr = curOvr;
              lastPt.age = p.age || lastPt.age;
            }
          }
        }
      }
    }
    if (typeof sendMonthlyBoardReport === 'function') {
      const monthlyPopupShown = sendMonthlyBoardReport(nextDay, prevDay);
      if (monthlyPopupShown) winterMarketEvent = true;
    }
    if (nextDay.month === 1 && typeof generateAndSendManagerWishReport === 'function') {
      const winterWish = generateAndSendManagerWishReport('冬の移籍市場開幕');
      const pClubWinter = getPlayerClub();
      stopAdvancingCalendar();
      if (typeof showSecretaryModal === 'function' && pClubWinter) {
        const posLabel = winterWish && Array.isArray(winterWish.positions) ? winterWish.positions.join('・') : '補強ポイント';
        showSecretaryModal({
          topic: '冬期移籍市場開幕',
          title: '冬の移籍市場オープンと後半戦補強要望',
          speech: `1月1日より冬の移籍ウィンドウが開幕いたしました。監督から後半戦へ向けた ${posLabel} の補強要望書と推薦選手リストが届いております。`,
          detailHtml: typeof buildWishModalDetailHtml === 'function' ? buildWishModalDetailHtml(pClubWinter, winterWish) : '',
          actions: [
            {
              label: '移籍市場で確認する',
              className: 'btn btn-primary',
              onClick: () => {
                switchTab('market');
              }
            },
            {
              label: '執務室で閉じる',
              className: 'btn btn-secondary',
              onClick: () => { renderAll(); }
            }
          ]
        });
      }
      winterMarketEvent = true;
    }
  }

  // 2. 移籍ウィンドウ期間中のイベント判定＆受信オファー期限更新
  const incomingResponded = updateIncomingOffersExpiry();
  const outgoingResponded = updateOutgoingOffersExpiry();
  let eventTriggered = winterMarketEvent;
  if (incomingResponded || outgoingResponded) {
    eventTriggered = true;
  }
  if (nextDay.windowOpen && !gameState.pendingMegaOffer) {
    const offerFired = triggerIncomingTransferOffer(false);
    const loanFired = triggerLoanListingOffers();
    const preContractFired = triggerPreContractDepartures();
    if (offerFired || loanFired || preContractFired) {
      eventTriggered = true;
    }
    if (typeof simulateCpuTransferNewsDaily === 'function') {
      simulateCpuTransferNewsDaily(nextDay);
    }
  }

  // 2.5 カップ戦・欧州大会の判定（自クラブの試合日ならキックオフまで他会場の消化を遅延）
  let isNextDayCupPlayerMatch = false;
  if (nextDay.isCupMatchDay && !nextDay.played) {
    if (hasPlayerCupMatchOnDay(nextDay)) {
      isNextDayCupPlayerMatch = true;
    } else if (nextDay.cupCompType === 'euroLeaguePhase') {
      if (typeof advanceEuroLeaguePhase === 'function') {
        advanceEuroLeaguePhase(nextDay.euroMd);
      }
      nextDay.played = true;
    } else if (nextDay.cupCompType === 'euroPlayoff') {
      if (typeof advanceEuroPlayoffRound === 'function') {
        advanceEuroPlayoffRound();
      }
      nextDay.played = true;
    } else if (nextDay.cupCompType === 'preseasonCup') {
      nextDay.played = true;
    } else if (typeof processCupMatchDay === 'function') {
      processCupMatchDay(nextDay.cupCompType, nextDay.cupRoundKey);
      nextDay.played = true;
    }
  }

  // プレイヤーのリーグ試合がない日程（空振りガード）に限り他ディビジョンを消化
  if (nextDay.isMatchDay && !nextDay.played && !getCalendarDayPlayerMatch(nextDay)) {
    if (isPlayerInSecondDivision()) {
      advanceFirstDivisionBackgroundWeek();
    } else if (typeof advanceChampionshipWeek === 'function') {
      advanceChampionshipWeek();
      const d2Comp = gameState.competitions && gameState.competitions.championship;
      const d2Played = d2Comp ? (d2Comp.currentWeek || 0) : 0;
      if (nextDay.dayOfWeek !== 6 && d2Played < 46) {
        advanceChampionshipWeek();
      }
    }
    nextDay.played = true;
  }

  // 3. 次の日の試合判定および重要オファー返答イベント判定
  const isNextDayMatch = Boolean((nextDay.isMatchDay || isNextDayCupPlayerMatch) && !nextDay.played);

  if (outgoingResponded) {
    // 送信オファーの回答が返ってきた場合は確実にカレンダー進行を停止
    stopAdvancingCalendar();
    eventTriggered = true;
  }

  // 代表ウィークイベント＆デッドラインデイ通知＆理事会解任判定
  if (typeof processInternationalBreakEvent === 'function') {
    if (processInternationalBreakEvent(nextDay)) {
      eventTriggered = true;
    }
  }
  if (nextDay.isTransferDeadline && !gameState.pendingDeadlineOffer) {
    gameState.pendingDeadlineOffer = true;
    addDailyLog('【デッドラインデイ】本日は移籍市場最終日！駆け込みオファーや交渉が活発化しています。');
    if (typeof addInboxMessage === 'function') {
      const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: '秘書' };
      addInboxMessage({
        senderType: 'secretary',
        senderName: sec.name,
        title: '移籍市場最終日（デッドラインデイ）のお知らせ',
        body: '本日をもって移籍ウィンドウが閉幕いたします。進行中の獲得オファーの締結漏れや、他クラブからの買取打診に対する最終判断がないかご確認ください。',
        actionType: 'goto-market-offers',
        actionLabel: 'オファーを確認',
        actionPayload: null
      });
    }
    stopAdvancingCalendar();
    if (typeof showSecretaryModal === 'function') {
      showSecretaryModal({
        topic: 'デッドラインデイ',
        title: '移籍市場最終日のご案内',
        speech: '本日をもって今ウィンドウの移籍市場が閉幕いたします。合意済みの獲得契約や未回答の売却オファーが残っていないか、最終確認をお願いいたします。',
        detailHtml: `<div class="gm-modal-flat-list"><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">本日付</span><span class="gm-modal-flat-val mono">${nextDay.displayDate}</span></div></div>`,
        actions: [
          {
            label: 'オファー・移籍市場を確認',
            className: 'btn btn-primary',
            onClick: () => {
              switchTab('market');
              switchMarketSubtab('offers');
            }
          },
          {
            label: 'このまま進める',
            className: 'btn btn-secondary',
            onClick: () => { renderAll(); }
          }
        ]
      });
    }
    eventTriggered = true;
  } else if (!nextDay.isTransferDeadline) {
    gameState.pendingDeadlineOffer = false;
  }
  if (gameState.pendingBoardCrisis && !gameState.isGameOver && !isFastForwardingSeason) {
    stopAdvancingCalendar();
    if (typeof openBoardCrisisModal === 'function') openBoardCrisisModal();
    return true;
  }

  if (isNextDayMatch || eventTriggered) {
    if (gameState.hasStartedOnce) autoSaveDirty = true;
    if (!skipRender) {
      renderAll();
      if (gameState.hasStartedOnce && typeof saveGameToStorage === 'function') saveGameToStorage(false);
    }
    return true;
  }

  // リーグ全節終了後に残っていた最後のカップ戦日（自クラブ不出場）を消化完了した場合
  if (gameState.currentWeek >= gameState.totalWeeks && !hasRemainingCupMatches() && !gameState.isSeasonOver) {
    stopAdvancingCalendar();
    processSeasonEnd(Boolean(skipRender));
    if (!skipRender) {
      renderAll();
      if (gameState.hasStartedOnce && typeof saveGameToStorage === 'function') saveGameToStorage(false);
    }
    return true;
  }

  if (gameState.hasStartedOnce) autoSaveDirty = true;
  if (!skipRender) {
    renderAll();
  }
  return false;
}

/**
 * 次の試合日（または重要イベント発生日）まで日程を連続して進める
 */
function startAdvancingToNextMatch() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) {
    return;
  }
  // 既に本日の試合が未消化なら、キックオフを実行
  if (isTodayMatchDayPending()) {
    playCurrentMatchday();
    return;
  }

  gameState.isAdvancingCalendar = true;
  renderHeader();

  if (gameState.calendarAdvanceTimer) {
    clearInterval(gameState.calendarAdvanceTimer);
  }

  // 120ms間隔で1日ずつカタカタ進める演出
  gameState.calendarAdvanceTimer = setInterval(() => {
    const shouldStop = advanceCalendarDay(true);

    // カタカタ動くヘッダー日付と週間スケジュールのみ部分更新して高速演出
    renderHeader();
    renderWeeklySchedule();

    if (shouldStop || !gameState.isAdvancingCalendar) {
      stopAdvancingCalendar();
    }
  }, 120);
}

/**
 * 日程の自動進行を停止する
 */
function stopAdvancingCalendar() {
  if (gameState.calendarAdvanceTimer) {
    clearInterval(gameState.calendarAdvanceTimer);
    gameState.calendarAdvanceTimer = null;
  }
  gameState.isAdvancingCalendar = false;
  renderAll();
}

/**
 * 直近1週間のスケジュール（週間カレンダーウィジェット）の描画
 */
function renderWeeklySchedule() {
  const trackEl = document.getElementById('weekly-schedule-track');
  const marketBadgeEl = document.getElementById('weekly-market-badge');
  const hintEl = document.getElementById('weekly-schedule-hint');
  if (!trackEl || !gameState.calendar || gameState.calendar.length === 0) return;

  const playerClub = getPlayerClub();
  const currentIdx = Math.min(gameState.currentDayIndex, gameState.calendar.length - 1);
  const currentDay = gameState.calendar[currentIdx];

  // 移籍市場バッジの更新
  if (marketBadgeEl && currentDay) {
    if (currentDay.windowOpen) {
      const windowName = (currentDay.month === 7 || currentDay.month === 8) ? '夏期' : '冬期';
      marketBadgeEl.textContent = `${windowName} 移籍市場 OPEN`;
      marketBadgeEl.className = 'market-status-pill badge-market-open';
    } else {
      marketBadgeEl.textContent = '移籍市場 CLOSED';
      marketBadgeEl.className = 'market-status-pill badge-market-closed';
    }
  }

  // 次の試合日までの日数を算出
  let daysUntilMatch = null;
  let nextMatchDay = null;
  let nextMatchTitle = '';
  for (let i = currentIdx; i < gameState.calendar.length; i++) {
    const d = gameState.calendar[i];
    const mInfo = getCalendarDayPlayerMatch(d);
    if ((d.isMatchDay || (d.isCupMatchDay && mInfo && mInfo.oppClub)) && !d.played) {
      daysUntilMatch = i - currentIdx;
      nextMatchDay = d;
      nextMatchTitle = mInfo ? mInfo.title : `第${d.matchWeek}節`;
      break;
    }
  }

  if (hintEl) {
    const congestion = typeof checkScheduleCongestion === 'function' ? checkScheduleCongestion() : { isCongested: false };
    const congestionPrefix = congestion.isCongested ? '<span class="congested-alert-tag mono">過密日程注意</span> ' : '';

    if (gameState.isSeasonOver) {
      hintEl.innerHTML = 'シーズン終了（オフ期間）';
    } else if (daysUntilMatch === 0) {
      hintEl.innerHTML = `${congestionPrefix}本日 Matchday（${nextMatchTitle}）`;
    } else if (daysUntilMatch !== null) {
      hintEl.innerHTML = `${congestionPrefix}次戦（${nextMatchTitle}）まで ${daysUntilMatch}日`;
    } else {
      hintEl.innerHTML = `${congestionPrefix}全日程消化完了`;
    }
  }

  // 直近7日分のカレンダーカードを生成
  const daysToShow = [];
  for (let offset = 0; offset < 7; offset++) {
    const targetIdx = currentIdx + offset;
    if (targetIdx < gameState.calendar.length) {
      daysToShow.push(gameState.calendar[targetIdx]);
    }
  }

  trackEl.innerHTML = daysToShow.map((day, idx) => {
    const isToday = idx === 0;
    const matchInfo = getCalendarDayPlayerMatch(day);
    const isMatch = Boolean(matchInfo && matchInfo.oppClub && !day.played);
    const matchCompCode = (matchInfo && matchInfo.oppClub && matchInfo.compCode) ? matchInfo.compCode.toLowerCase() : '';
    const matchCompClass = matchCompCode ? `match-comp-${matchCompCode}` : '';

    let eventHtml = '';
    if (matchInfo && matchInfo.oppClub) {
      const isHome = matchInfo.isHome;
      const oppClub = matchInfo.oppClub;
      const oppCode = getClubShortCode(oppClub);
      const compBadge = matchInfo.compCode ? `[${matchInfo.compCode}] ` : '';
      const badgeCls = matchInfo.compCode ? `badge-comp-${matchInfo.compCode.toLowerCase()}` : '';
      eventHtml = `<span class="day-event-badge day-event-match ${badgeCls}">${compBadge}vs ${oppCode} (${isHome ? 'H' : 'A'})</span>`;
    } else if (day.isTransferDeadline) {
      eventHtml = `<span class="day-event-badge day-event-market">市場最終日</span>`;
    } else if (day.isIntlBreak || (day.month === 9 && day.day >= 4 && day.day <= 8) || (day.month === 10 && day.day >= 9 && day.day <= 13) || (day.month === 11 && day.day >= 13 && day.day <= 17) || (day.month === 3 && day.day >= 19 && day.day <= 24)) {
      eventHtml = `<span class="day-event-badge day-event-intl">代表ウィーク</span>`;
    } else if (day.windowOpen) {
      eventHtml = `<span class="day-event-market">移籍交渉期間</span>`;
    } else if (day.eventType === 'recovery') {
      eventHtml = `<span class="day-event-recovery">クールダウン</span>`;
    } else {
      eventHtml = `<span class="day-event-training">戦術練習</span>`;
    }

    const isClickable = isToday && isMatch;
    return `
      <div class="day-card ${isToday ? 'is-today' : ''} ${isMatch ? 'is-matchday' : ''} ${matchCompClass} ${isClickable ? 'is-clickable' : ''}" ${isClickable ? 'role="button" tabindex="0" onclick="openMatchPrecheckModal()"' : ''} title="${isClickable ? 'タップで作戦確認・キックオフ' : ''}">
        <div class="day-card-header">
          <span class="day-card-date">${day.month}/${day.day} (${day.dayOfWeekName})</span>
          ${isToday ? '<span class="day-card-today-badge">TODAY</span>' : ''}
        </div>
        <div class="day-card-content">
          ${eventHtml}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * シーズン終了まで一気にスキップ
 */
function skipToSeasonEnd() {
  if (gameState.isGameOver || gameState.isSeasonOver || gameState.isSimulating) return;
  stopAdvancingCalendar();
  gmModalQueue.length = 0;
  const existingGmOverlay = document.getElementById('gm-modal-overlay');
  if (existingGmOverlay) existingGmOverlay.classList.add('hidden');
  isFastForwardingSeason = true;

  try {
    let safetyGuard = 0;
    while (!gameState.isSeasonOver && safetyGuard < 500) {
    safetyGuard++;
    const curDay = getCurrentCalendarDay();
    if (!curDay) {
      processSeasonEnd(true);
      break;
    }
    if (!curDay.played) {
      if (curDay.isCupMatchDay) {
        const mInfo = getCalendarDayPlayerMatch(curDay);
        if (mInfo && !mInfo.played) {
          playCurrentCupMatchday(true);
        } else {
          curDay.played = true;
        }
      } else if (curDay.isMatchDay) {
        playNextMatchweek(true);
        curDay.played = true;
      }
    }
    if (gameState.isSeasonOver) break;
      advanceCalendarDay(true);
    }
  } finally {
    isFastForwardingSeason = false;
  }
  renderAll();
}

/**
 * 試合後のランダムGMイベントおよび欧州メガクラブ強奪オファー判定
 */
function checkPostMatchEvents() {
  if (typeof checkAndShowManagerTrustCrisis === 'function' && checkAndShowManagerTrustCrisis()) {
    return;
  }
  // 第19節（前半戦終了・冬の移籍ウインドウ）は欧州メガクラブからの強奪オファーがGMタスク（CRITICAL）に届く
  if (gameState.currentWeek === Math.floor(gameState.totalWeeks / 2)) {
    triggerMegaOfferEvent(!isFastForwardingSeason);
    return;
  }

  // 全38節の長丁場に合わせ、通常節は18%の確率でランダムGMイベントが発生（トレーニング＆メディカル施設Lvで負傷率軽減、ゲーゲンプレス時は負傷率微増）
  const playerClub = getPlayerClub();
  const isGegenpress = playerClub && normalizeTacticKey(playerClub.tactic) === 'gegenpress';
  const eventTriggerProb = isGegenpress ? 0.21 : 0.18;
  if (Math.random() < eventTriggerProb) {
    const trainingLv = (gameState.facilities && gameState.facilities.training) ? gameState.facilities.training : 1;
    const baseInjuryThreshold = Math.max(0.10, 0.36 * (1 - (trainingLv - 1) * 0.18));
    const congestion = typeof checkScheduleCongestion === 'function' ? checkScheduleCongestion() : { injuryChanceMultiplier: 1.0 };
    let injuryThreshold = isGegenpress ? Math.min(0.52, baseInjuryThreshold * 1.22) : baseInjuryThreshold;
    injuryThreshold = Math.min(0.60, injuryThreshold * (congestion.injuryChanceMultiplier || 1.0));
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

function syncPendingMegaOfferToIncomingOffers() {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!gameState || !playerClub) return;
  if (!Array.isArray(gameState.incomingOffers)) gameState.incomingOffers = [];

  const offer = gameState.pendingMegaOffer;
  if (!offer) {
    for (const inc of gameState.incomingOffers) {
      if (inc && inc.isMegaOfferEvent && (inc.status === 'pending' || inc.status === 'negotiating' || inc.status === 'counter_agreed')) {
        inc.status = 'cancelled';
      }
    }
    return;
  }

  const target = (playerClub.players || []).find(p => p.id === offer.playerId);
  if (!target) {
    for (const inc of gameState.incomingOffers) {
      if (inc && inc.isMegaOfferEvent && (inc.status === 'pending' || inc.status === 'negotiating' || inc.status === 'counter_agreed')) {
        inc.status = 'cancelled';
      }
    }
    gameState.pendingMegaOffer = null;
    return;
  }

  if (!offer.offerAmount || offer.offerAmount <= 0) {
    const feeFromContract = typeof calculateTransferFee === 'function' ? calculateTransferFee(target) : 0;
    const marketVal = typeof calculatePlayerMarketValue === 'function' ? calculatePlayerMarketValue(target) : 0;
    const baseValue = Math.max(feeFromContract || 0, Math.round((marketVal || 0) * 0.85), 600);
    offer.offerAmount = Math.max(1000, Math.round((baseValue * 2.0) / 100) * 100);
  }

  const linkedId = offer.linkedOfferId || `mega_${target.id}_${String(offer.megaClubName || 'club').replace(/\s+/g, '')}`;
  offer.linkedOfferId = linkedId;

  let linked = gameState.incomingOffers.find(o =>
    o && (o.id === linkedId || (o.isMegaOfferEvent && o.playerId === target.id && o.status !== 'accepted' && o.status !== 'rejected' && o.status !== 'cancelled'))
  );
  const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(target) : (offer.ovr || 75);
  const counterFee = Math.max(1200, Math.round((offer.offerAmount * 1.2) / 100) * 100);
  if (!linked) {
    const curDay = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
    linked = {
      id: linkedId,
      isMegaClub: true,
      isMegaOfferEvent: true,
      buyerClubId: null,
      buyerClubName: offer.megaClubName,
      buyerClubCountry: offer.megaClubCountry || '欧州',
      playerId: target.id,
      playerName: target.name,
      playerPos: target.pos,
      squadNumber: target.squadNumber || offer.squadNumber || 9,
      playerAge: target.age,
      ovr,
      wage: target.wage || Math.round((target.salary || 1000) / 52),
      preferredFoot: target.preferredFoot || 'Right',
      baseFee: offer.offerAmount,
      offerFee: offer.offerAmount,
      counterFee,
      daysLeft: 14,
      dateStr: curDay ? curDay.formattedDate : '',
      status: 'pending'
    };
    gameState.incomingOffers.unshift(linked);
  } else {
    linked.id = linkedId;
    linked.isMegaClub = true;
    linked.isMegaOfferEvent = true;
    if (!linked.offerFee || linked.offerFee <= 0 || linked.status === 'pending') {
      linked.offerFee = offer.offerAmount;
    }
    if (linked.status === 'counter_agreed' && linked.offerFee > 0) {
      offer.offerAmount = linked.offerFee;
    }
  }
}

/**
 * 欧州大陸メガクラブ（EUROPEAN_MEGA_CLUBS）からの強奪オファーを生成し、GMタスク（CRITICAL）へ登録
 */
function triggerMegaOfferEvent(autoOpenModal = false) {
  if (gameState.isSeasonOver) return;
  if (typeof isTransferWindowCurrentlyOpen === 'function' && !isTransferWindowCurrentlyOpen()) return;
  const playerClub = getPlayerClub();
  if (!playerClub || playerClub.players.length <= 12) return;

  const eligiblePlayers = playerClub.players.filter(p =>
    p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoan) && !(p.loanStatus && p.loanStatus.isLoanOut) && !p.preContractDeparture
  );
  if (eligiblePlayers.length === 0) return;

  const contractedPool = eligiblePlayers.filter(p => (p.contractYears || 0) > 0);
  const candidatePool = contractedPool.length > 0 ? contractedPool : eligiblePlayers;

  const candidates = [...candidatePool].sort((a, b) => {
    const scoreA = getPlayerOverallRating(a) + a.goals * 4 + (a.appearances > 0 ? (a.totalRating / a.appearances) * 3 : 0);
    const scoreB = getPlayerOverallRating(b) + b.goals * 4 + (b.appearances > 0 ? (b.totalRating / b.appearances) * 3 : 0);
    return scoreB - scoreA;
  });

  const target = candidates[0];
  if (!target) return;

  const megaClubObj = gameState.europeanMegaClubs[randInt(0, gameState.europeanMegaClubs.length - 1)];
  const feeFromContract = typeof calculateTransferFee === 'function' ? calculateTransferFee(target) : 0;
  const marketVal = typeof calculatePlayerMarketValue === 'function' ? calculatePlayerMarketValue(target) : 0;
  const baseValue = Math.max(feeFromContract || 0, Math.round((marketVal || 0) * 0.85), 600);
  // 通常の1.8倍〜2.4倍の破格オファー（ポンド建て、£0防止のため下限£1,000K保証）
  const offerAmount = Math.max(1000, Math.round((baseValue * (1.8 + Math.random() * 0.6)) / 100) * 100);
  const ovr = getPlayerOverallRating(target);
  const avgRating = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : 'N/A';
  const linkedOfferId = `mega_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  gameState.pendingMegaOffer = {
    linkedOfferId,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.pos,
    squadNumber: target.squadNumber || 9,
    playerAge: target.age,
    ovr,
    appearances: target.appearances,
    goals: target.goals,
    avgRating,
    megaClubName: megaClubObj.name,
    megaClubCountry: megaClubObj.country,
    offerAmount
  };

  syncPendingMegaOfferToIncomingOffers();
  renderAll();

  if (autoOpenModal) {
    openMegaOfferModal();
  }
}

/**
 * GMタスク（CRITICAL）に届いているメガクラブ強奪オファーの決断モーダルを開く
 */
function openMegaOfferModal() {
  const offer = gameState.pendingMegaOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
  if (!target) {
    gameState.pendingMegaOffer = null;
    renderAll();
    return;
  }

  const ovr = getPlayerOverallRating(target);
  const avgRating = target.appearances > 0 ? (target.totalRating / target.appearances).toFixed(1) : 'N/A';

  showGmModal({
    category: '大型買取オファー',
    title: `${offer.megaClubName}から #${target.squadNumber || offer.squadNumber} ${target.fullName || target.name} への正式オファー`,
    description: `${gameState.gmName} GM、当クラブの主力 ${target.pos} #${target.squadNumber || offer.squadNumber} ${target.name}（${target.age}歳）に対し、${offer.megaClubCountry}の強豪「${offer.megaClubName}」から移籍金 ${formatMoney(offer.offerAmount)} の買取オファーが届いています。`,
    detailHtml: `<div class="gm-modal-flat-list"><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">対象選手</span><span class="gm-modal-flat-val">${target.pos} #${target.squadNumber || offer.squadNumber} ${target.fullName || target.name} (OVR ${ovr})</span></div><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">買収提示額 (即時入金)</span><span class="gm-modal-flat-val accent-gold mono">${formatMoney(offer.offerAmount)}</span></div><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">拒否時の影響</span><span class="gm-modal-flat-val">支持 +250人 · 次回契約要求週給 +12%</span></div></div>`,
    actions: [
      {
        label: `承諾して売却 (+${formatMoney(offer.offerAmount)})`,
        className: 'btn btn-accent',
        onClick: () => {
          acceptPendingMegaOffer();
        }
      },
      {
        label: '拒否して残留させる',
        className: 'btn btn-primary',
        onClick: () => {
          rejectPendingMegaOffer();
        }
      },
      {
        label: '保留して閉じる',
        className: 'btn btn-secondary',
        onClick: () => {
          renderAll();
        }
      }
    ]
  });
}

/**
 * メガクラブからの強奪オファーを受諾（選手離脱＋移籍金即時加算）
 */
function acceptPendingMegaOffer() {
  const offer = gameState.pendingMegaOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (target) {
    const { netFee } = applySellOnRightsOnSale(playerClub, target, offer.offerAmount);
    playerClub.funds += netFee;
    if (typeof ensureMonthlyLedger === 'function') {
      ensureMonthlyLedger().transferInFee += netFee;
    }
    playerClub.players = playerClub.players.filter(p => p.id !== target.id);
    const linkedInc = Array.isArray(gameState.incomingOffers)
      ? gameState.incomingOffers.find(o => o && (o.id === offer.linkedOfferId || (o.isMegaOfferEvent && o.playerId === target.id && o.status !== 'rejected' && o.status !== 'cancelled')))
      : null;
    if (linkedInc) {
      linkedInc.status = 'accepted';
      linkedInc.offerFee = offer.offerAmount;
    }
    if (typeof cancelOtherIncomingOffersForPlayer === 'function') {
      cancelOtherIncomingOffersForPlayer(target.id, linkedInc ? linkedInc.id : null, { clearModalOffers: false });
    }
    ensureValidSquadAndStarters(playerClub);
    gameState.facilityFeedback = `【メガオファー受諾】#${offer.squadNumber} ${offer.playerName} の「${offer.megaClubName}」への完全移籍が成立し、クラブ資金に +${formatMoney(netFee)} が即時加算されました。`;
  }

  gameState.pendingMegaOffer = null;
  updateMarketBadges();
  renderAll();
}

/**
 * メガクラブからの強奪オファーを拒否（戦力維持・モチベーションおよび契約状況に影響）
 */
function rejectPendingMegaOffer() {
  const offer = gameState.pendingMegaOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (target) {
    playerClub.supporters += 250;
    target.megaOfferRejected = true;
    target.contractYears = Math.min(target.contractYears || 2, 2);
    const baseDemand = calculatePlayerDemandSalary(target);
    target.demandedSalary = Math.round((baseDemand * 1.12) / 50) * 50;
    const reqWage = Math.max(5, Math.round(target.demandedSalary / 52));
    gameState.facilityFeedback = `【メガオファー拒否】「${offer.megaClubName}」からの ${formatMoney(offer.offerAmount)} オファーを拒否し #${target.squadNumber} ${target.name} を引き止めました（要求週給が £${reqWage}k/週 に上昇・契約延長交渉が可能）。`;
  }

  if (Array.isArray(gameState.incomingOffers)) {
    for (const inc of gameState.incomingOffers) {
      if (inc && (inc.id === offer.linkedOfferId || (inc.isMegaOfferEvent && inc.playerId === offer.playerId))) {
        inc.status = 'rejected';
      }
    }
  }
  gameState.pendingMegaOffer = null;
  updateMarketBadges();
  renderAll();
}

/**
 * ランダムイベント1「選手の怪我（全治〇試合）」
 */
function triggerInjuryEvent() {
  const playerClub = getPlayerClub();
  const starters = playerClub.players.filter(p => p && p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut) && (p.injuryWeeks || 0) === 0);
  if (starters.length === 0) return;

  const weighted = [];
  for (const p of starters) {
    const normCurve = typeof normalizeGrowthCurveId === 'function' ? normalizeGrowthCurveId(p.growthCurve) : p.growthCurve;
    const weight = normCurve === 'fragile_genius' ? 6 : (normCurve === 'steady_iron' ? 1 : 2);
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
    description: `トレーニング中に ${victim.pos} ${victim.name}（${victim.age}歳）が筋肉系のトラブルを訴え、全治${weeks}試合の診断を受けました。治療方針を選択してください。`,
    detailHtml: `負傷選手：[${victim.pos}] ${victim.name}（総合力 ${getPlayerOverallRating(victim)}）<br>特別治療費：${formatMoney(medicalCost)}（全治期間を1試合に短縮し能力低下を防止）`,
    actions: [
      {
        label: `欧州専門医の特別治療（-${formatMoney(medicalCost)} / 全治1節に短縮）`,
        className: 'btn btn-primary',
        disabled: playerClub.funds < medicalCost,
        onClick: () => {
          playerClub.funds -= medicalCost;
          victim.injuryWeeks = 1;
          victim.injuryDays = 7;
          if (typeof addNewsItem === 'function') {
            addNewsItem({
              category: '選手',
              clubId: playerClub.id,
              playerId: victim.id,
              headline: `${playerClub.name}・${victim.name}負傷　専門治療で早期復帰へ`,
              lead: `休む間なく戦った末の離脱（全治1節見込み）`,
              body: `トレーニング中にトラブルを起こした${victim.pos} ${victim.name}（${victim.age}歳）は欧州専門医の特別治療を受け、全治1節での戦線復帰を目指す。`,
              highlight: true
            });
          }
          renderAll();
        }
      },
      {
        label: `通常リハビリ＆ベンチ休養（費用£0 / 全治${weeks}節）`,
        className: 'btn btn-secondary',
        onClick: () => {
          victim.injuryWeeks = weeks;
          victim.injuryDays = weeks * 7;
          if (typeof addNewsItem === 'function') {
            addNewsItem({
              category: '選手',
              clubId: playerClub.id,
              playerId: victim.id,
              headline: `${playerClub.name}・${victim.name}負傷　次節へ痛手の戦線離脱`,
              lead: `休みなく戦った末の離脱である（全治${weeks}節）`,
              body: `${playerClub.name}の主力 ${victim.pos} ${victim.name}（${victim.age}歳）が筋肉系トラブルにより全治${weeks}試合の診断を受けた。当面は控えメンバーによる総力戦となる。`,
              highlight: true
            });
          }
          const healthyBench = playerClub.players
            .filter(p => p && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut) && (p.injuryWeeks || 0) === 0)
            .sort((a, b) => {
              const aBench = a.isBench !== false ? 1 : 0;
              const bBench = b.isBench !== false ? 1 : 0;
              if (aBench !== bBench) return bBench - aBench;
              const aMatch = a.pos === victim.assignedPos ? 1 : 0;
              const bMatch = b.pos === victim.assignedPos ? 1 : 0;
              if (aMatch !== bMatch) return bMatch - aMatch;
              return getPlayerOverallRating(b) - getPlayerOverallRating(a);
            });
          if (healthyBench.length > 0) {
            const sub = healthyBench[0];
            sub.isStarter = true;
            sub.isBench = false;
            sub.slotIndex = victim.slotIndex;
            sub.assignedPos = victim.assignedPos || victim.pos;
            victim.isStarter = false;
            victim.isBench = true;
            victim.slotIndex = null;
            victim.assignedPos = null;
            ensureValidSquadAndStarters(playerClub);
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
  getAllManagedLeagueClubs().forEach(c => (c.players || []).forEach(p => usedNames.add(p.name)));

  const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
  const curve = Math.random() < 0.45 ? 'early' : (Math.random() < 0.35 ? 'fragile' : 'standard');
  const prospect = createPlayer(pos, randInt(60, 68), false, usedNames, [17, 18], curve);
  prospect.salary = 800; // £800K
  prospect.wage = Math.max(10, Math.round(prospect.salary / 52));
  prospect.contractYears = 4;
  prospect.isYouth = false;
  prospect.isYouthGraduate = true;
  prospect.isHomegrown = true;
  prospect.isStarter = false;
  prospect.isBench = false;
  prospect.assignedPos = null;
  prospect.slotIndex = null;
  prospect.squadNumber = null;
  const ovr = getPlayerOverallRating(prospect);
  const maxSquad = typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50;
  const isFull = playerClub.players.length >= maxSquad;

  showGmModal({
    category: 'アカデミー昇格推薦',
    title: '若手ユース選手のトップチーム昇格案内',
    description: `下部組織の ${prospect.pos} ${prospect.fullName || prospect.name}（${prospect.age}歳）が著しく成長しています。移籍金 £0・週給 £${prospect.wage}k/週 でトップチームへ昇格可能です。`,
    detailHtml: `<div class="gm-modal-flat-list"><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">候補選手</span><span class="gm-modal-flat-val">${prospect.pos} ${prospect.fullName || prospect.name} (${prospect.age}歳)</span></div><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">総合力 (OVR)</span><span class="gm-modal-flat-val accent-green">OVR ${ovr}</span></div><div class="gm-modal-flat-row"><span class="gm-modal-flat-label">昇格条件</span><span class="gm-modal-flat-val accent-gold mono">4年契約 · £${prospect.wage}k/週</span></div></div>`,
    actions: [
      {
        label: isFull ? `所属枠上限（${maxSquad}名）のため昇格不可` : 'トップチームへ無料昇格させる（移籍金 £0）',
        className: 'btn btn-primary',
        disabled: isFull,
        onClick: () => {
          playerClub.players.push(prospect);
          ensureClubSquadNumbers(playerClub);
          ensureValidSquadAndStarters(playerClub);
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
 * イベント・秘書ブリーフィング用モーダルダイアログの表示制御（キュー対応）
 */
const gmModalQueue = [];
let isFastForwardingSeason = false;

function flushNextGmModalOrUnlock() {
  if (gmModalQueue.length > 0) {
    const nextOpts = gmModalQueue.shift();
    showGmModal(nextOpts, true);
    return;
  }
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
}

function closeGmModal(clearQueue = false) {
  if (clearQueue) {
    gmModalQueue.length = 0;
  }
  const overlay = document.getElementById('gm-modal-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
  flushNextGmModalOrUnlock();
}

function resolveModalSpeakerBustHtml(kind, person, club) {
  if (!person) return '';
  if (kind === 'manager') {
    if (typeof getManagerBustHtml === 'function') return getManagerBustHtml(person, club, 'secretary-bust-canvas');
    if (typeof getManagerAvatarHtml === 'function') return getManagerAvatarHtml(person, 'avatar-md', 52);
  } else if (kind === 'player') {
    if (typeof getPlayerBustHtml === 'function') return getPlayerBustHtml(person, club, 'secretary-bust-canvas');
    if (typeof getPlayerAvatarHtml === 'function') return getPlayerAvatarHtml(person, club, 'avatar-md', 52);
  } else if (kind === 'coach') {
    if (typeof getCoachBustHtml === 'function') return getCoachBustHtml(person, club, 'secretary-bust-canvas');
    if (typeof getCoachAvatarHtml === 'function') return getCoachAvatarHtml(person, 'avatar-md', 52);
  } else {
    if (typeof getSecretaryBustHtml === 'function') return getSecretaryBustHtml(person, 'secretary-bust-canvas');
    if (typeof getSecretaryAvatarHtml === 'function') return getSecretaryAvatarHtml(person, 'avatar-md', 52);
  }
  return '';
}

function getModalSpeakerPillClass(kind) {
  if (kind === 'manager') return ' is-manager-pill';
  if (kind === 'player') return ' is-player-pill';
  if (kind === 'coach') return ' is-coach-pill';
  return '';
}

function buildModalSpeakerPillHtml(speakerObj) {
  if (!speakerObj) return '';
  const extraCls = getModalSpeakerPillClass(speakerObj.kind);
  return `<span class="gm-vn-pill-badge${extraCls}"><span class="gm-modal-sec-name">${escapeCommHtml(speakerObj.name)}</span><span class="gm-modal-sec-role">${escapeCommHtml(speakerObj.roleLabel)}</span></span>`;
}

function showGmModal(opts, fromQueue = false) {
  if (!opts || typeof opts !== 'object') return;
  if (isFastForwardingSeason && !(opts && opts.allowDuringSkip)) return;
  const overlay = document.getElementById('gm-modal-overlay');
  if (!overlay) return;
  const toastContainer = document.getElementById('toast-container');
  if (toastContainer) toastContainer.innerHTML = '';

  if (!fromQueue && !overlay.classList.contains('hidden')) {
    if (gmModalQueue.length < 8) {
      gmModalQueue.push(opts);
    }
    return;
  }

  const { category, title, description, detailHtml, actions, hideSecretary, speaker, variant } = opts;
  const modalCard = overlay.querySelector('.gm-secretary-modal-card');
  if (modalCard) {
    const isReportLike = variant === 'match-report' || variant === 'monthly-ceremony' || variant === 'conflict-arbitration';
    modalCard.classList.toggle('is-report-modal', isReportLike);
    modalCard.classList.toggle('is-monthly-ceremony', variant === 'monthly-ceremony');
    modalCard.classList.toggle('is-conflict-modal', variant === 'conflict-arbitration');
  }

  const secBox = document.getElementById('gm-modal-secretary-box');
  const catEl = document.getElementById('modal-category');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const detailEl = document.getElementById('modal-detail-box');
  const dialogueCard = document.getElementById('gm-vn-dialogue-card');

  const isConflictSpeaker = Boolean(speaker && speaker.kind === 'conflict' && speaker.left && speaker.right);
  const isCustomSpeaker = Boolean(speaker && speaker.kind && speaker.kind !== 'secretary' && speaker.person && (speaker.kind === 'manager' || speaker.kind === 'player' || speaker.kind === 'coach'));
  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : null;
  const clubCtx = (speaker && speaker.club) || (typeof getPlayerClub === 'function' ? getPlayerClub() : null);

  const activeSpeaker = isConflictSpeaker
    ? { kind: 'conflict', left: speaker.left, right: speaker.right, club: clubCtx }
    : isCustomSpeaker
      ? {
          kind: speaker.kind,
          name: speaker.name || speaker.person.fullName || speaker.person.name,
          roleLabel: speaker.roleLabel || (speaker.kind === 'manager' ? '監督' : (speaker.kind === 'player' ? '選手' : 'コーチ')),
          person: speaker.person,
          club: clubCtx
        }
      : (sec ? { kind: 'secretary', name: sec.name, roleLabel: sec.roleLabel, person: sec, club: null } : null);

  if (secBox) {
    if (hideSecretary || !activeSpeaker) {
      secBox.innerHTML = '';
      secBox.classList.add('hidden');
    } else if (activeSpeaker.kind === 'conflict') {
      const leftHtml = resolveModalSpeakerBustHtml(activeSpeaker.left.kind, activeSpeaker.left.person, activeSpeaker.club);
      const rightHtml = resolveModalSpeakerBustHtml(activeSpeaker.right.kind, activeSpeaker.right.person, activeSpeaker.club);
      secBox.innerHTML = `
        <div class="gm-conflict-stage">
          <div class="gm-modal-sec-avatar-wrap is-duo">${leftHtml}</div>
          <span class="gm-conflict-vs mono">VS</span>
          <div class="gm-modal-sec-avatar-wrap is-duo">${rightHtml}</div>
        </div>
      `;
      secBox.classList.remove('hidden');
    } else {
      const bustHtml = resolveModalSpeakerBustHtml(activeSpeaker.kind, activeSpeaker.person, activeSpeaker.club);
      secBox.innerHTML = `<div class="gm-modal-sec-avatar-wrap">${bustHtml}</div>`;
      secBox.classList.remove('hidden');
    }
  }

  if (catEl) {
    if (!hideSecretary && activeSpeaker) {
      if (activeSpeaker.kind === 'conflict') {
        const leftPill = buildModalSpeakerPillHtml(activeSpeaker.left);
        const rightPill = buildModalSpeakerPillHtml(activeSpeaker.right);
        catEl.innerHTML = `${leftPill}<span class="gm-conflict-pill-sep">×</span>${rightPill}${category ? `<span class="gm-modal-sec-topic">${escapeCommHtml(category)}</span>` : ''}`;
      } else {
        catEl.innerHTML = `${buildModalSpeakerPillHtml(activeSpeaker)}${category ? `<span class="gm-modal-sec-topic">${escapeCommHtml(category)}</span>` : ''}`;
      }
    } else {
      catEl.innerHTML = category ? `<span class="gm-vn-pill-badge">${escapeCommHtml(category)}</span>` : '';
    }
  }
  if (titleEl) titleEl.textContent = title || '';
  if (descEl) {
    descEl.textContent = description || '';
    descEl.classList.remove('gm-vn-speech-anim');
    void descEl.offsetWidth;
    descEl.classList.add('gm-vn-speech-anim');
  }
  if (detailEl) detailEl.innerHTML = detailHtml || '';

  const actionsContainer = document.getElementById('modal-actions');
  const choicePromptEl = document.getElementById('gm-vn-choice-prompt');
  let singleTapNextBtn = null;
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    const actList = actions || [];
    const isSingleNextPrompt = actList.length === 1 && actList[0].isNextPrompt;
    actionsContainer.classList.toggle('is-single-prompt', isSingleNextPrompt);
    if (choicePromptEl) {
      if (actList.length >= 2 && !isSingleNextPrompt) {
        choicePromptEl.textContent = opts.choicePrompt || 'GM としてご判断ください';
        choicePromptEl.classList.remove('hidden');
      } else {
        choicePromptEl.classList.add('hidden');
      }
    }

    actList.forEach(act => {
      const btn = document.createElement('button');
      btn.type = 'button';
      if (isSingleNextPrompt) {
        btn.className = 'gm-vn-next-prompt-btn';
        btn.innerHTML = `<span>${escapeCommHtml(act.label || 'タップで次へ')}</span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        singleTapNextBtn = btn;
      } else {
        btn.className = act.className || 'btn btn-primary';
        btn.textContent = act.label;
      }
      if (act.disabled) btn.disabled = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.classList.add('hidden');
        if (act.onClick) act.onClick();
        flushNextGmModalOrUnlock();
      });
      actionsContainer.appendChild(btn);
    });
  }

  if (dialogueCard) {
    dialogueCard.classList.toggle('is-tap-advance', Boolean(singleTapNextBtn));
    dialogueCard.onclick = singleTapNextBtn
      ? (e) => {
          if (e.target.closest('button, a, #modal-detail-box')) return;
          singleTapNextBtn.click();
        }
      : null;
  }

  overlay.classList.remove('hidden');
  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(overlay);
  }
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 秘書が直接報告・進行案内を行う専用モーダル表示ヘルパー
 */
function showSecretaryModal({ topic = '進行ブリーフィング', title = '', speech = '', detailHtml = '', actions = null, speaker = null, variant = null }) {
  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: 'C. Bennett', tone: 'polite' };
  const resolvedActions = Array.isArray(actions) && actions.length > 0
    ? actions
    : [{ label: 'タップで次へ', isNextPrompt: true, onClick: () => { if (typeof renderAll === 'function') renderAll(); } }];
  showGmModal({
    category: topic,
    title,
    description: speech,
    detailHtml,
    actions: resolvedActions,
    speaker,
    variant
  });
}

function buildWishModalDetailHtml(playerClub, wish) {
  const rows = [];
  if (playerClub) {
    const safeBudget = typeof getSafeTransferBudget === 'function' ? getSafeTransferBudget(playerClub) : (playerClub.funds || 0);
    rows.push(`<div class="gm-modal-flat-row"><span class="gm-modal-flat-label">目標順位</span><span class="gm-modal-flat-val accent-green">${escapeCommHtml(playerClub.targetLabel || '上位進出')}</span></div>`);
    rows.push(`<div class="gm-modal-flat-row"><span class="gm-modal-flat-label">保有資金 / 安全移籍予算</span><span class="gm-modal-flat-val accent-gold mono">${formatMoney(playerClub.funds)} / ${formatMoney(safeBudget)}</span></div>`);
  }
  if (wish && Array.isArray(wish.positions) && wish.positions.length > 0) {
    rows.push(`<div class="gm-modal-flat-row"><span class="gm-modal-flat-label">監督補強希望 (${escapeCommHtml(wish.managerName || '監督')})</span><span class="gm-modal-flat-val" style="color:#38bdf8;">${escapeCommHtml(wish.positions.join('・'))}（布陣 ${escapeCommHtml(wish.formation || '4-3-3')}）</span></div>`);
    (wish.candidates || []).slice(0, 3).forEach(c => {
      const feeTxt = c.isFreeAgent ? '£0' : formatMoney(c.estimatedFee);
      rows.push(`<div class="gm-modal-flat-row"><span class="gm-modal-flat-label"><strong style="color:#38bdf8;">${escapeCommHtml(c.pos)}</strong> ${escapeCommHtml(c.name)} (${escapeCommHtml(c.clubName)})</span><span class="gm-modal-flat-val mono">OVR ${c.ovr} · 推定 ${feeTxt}</span></div>`);
    });
  }
  return rows.length > 0 ? `<div class="gm-modal-flat-list">${rows.join('')}</div>` : '';
}

/**
 * クラブ着任時および新シーズン開幕時の秘書ブリーフィングモーダル
 */
function showSecretaryClubOpeningBriefing(playerClub, mgr, isFirstCareer = false, wish = null) {
  if (!playerClub) return;
  const activeWish = wish || (Array.isArray(gameState.managerWishes) ? gameState.managerWishes[0] : (gameState.managerWishes || null));
  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: 'C. Bennett', tone: 'polite' };
  const mgrName = (mgr && mgr.name) || (playerClub.manager && playerClub.manager.name) || '新監督';
  const wishPosText = (activeWish && Array.isArray(activeWish.positions) && activeWish.positions.length > 0)
    ? activeWish.positions.join('・')
    : '戦力全体のバランス';
  const topic = isFirstCareer ? '就任初日ブリーフィング' : `Season ${gameState.season} 開幕報告`;
  const title = isFirstCareer
    ? `${playerClub.name} プレシーズン開始`
    : `Season ${gameState.season} 新体制始動`;

  let speech = '';
  if (sec.tone === 'active') {
    speech = isFirstCareer
      ? `GM、${playerClub.name}へのご着任おめでとうございます！7月1日より移籍市場が解禁されました。${mgrName}監督からは「${wishPosText}」の補強希望が届いています。`
      : `GM、Season ${gameState.season}の開幕です！移籍市場もオープンしています。${mgrName}監督の補強希望「${wishPosText}」を確認して動き出しましょう。`;
  } else if (sec.tone === 'calm') {
    speech = isFirstCareer
      ? `GM、着任初日の確認です。本日7月1日より夏の移籍市場が開いています。${mgrName}監督との初期査定では「${wishPosText}」の補強優先度が高い結果となりました。`
      : `GM、Season ${gameState.season}の基準日が開始しました。安全移籍予算と目標順位を確認の上、${mgrName}監督が求める「${wishPosText}」の精査を推奨します。`;
  } else {
    speech = isFirstCareer
      ? `GM、${playerClub.name}へのご着任にあたりご挨拶申し上げます。本日よりプレシーズンおよび移籍市場が開幕いたしました。${mgrName}監督からは「${wishPosText}」の補強要望が届いております。`
      : `GM、Season ${gameState.season}が開幕いたしました。移籍市場も同時に開いておりますので、目標達成に向け${mgrName}監督の補強希望「${wishPosText}」をご確認のうえご指示ください。`;
  }

  showSecretaryModal({
    topic,
    title,
    speech,
    detailHtml: buildWishModalDetailHtml(playerClub, activeWish),
    actions: [
      {
        label: '移籍市場を見る',
        className: 'btn btn-secondary',
        onClick: () => {
          if (typeof switchTab === 'function') switchTab('market');
        }
      },
      {
        label: '業務を開始する',
        className: 'btn btn-primary',
        onClick: () => {
          if (typeof renderAll === 'function') renderAll();
        }
      }
    ]
  });
}

/**
 * 共通インフォポップアップ（施設・戦術などの詳細情報）の表示
 */
function showInfoPopup({ title, tag, bodyHtml }) {
  const overlay = document.getElementById('info-popup-modal');
  if (!overlay) return;

  const tagEl = document.getElementById('info-popup-tag');
  if (tagEl) tagEl.textContent = tag || 'INFO';

  const titleEl = document.getElementById('info-popup-title');
  if (titleEl) titleEl.textContent = title || '詳細情報';

  const bodyEl = document.getElementById('info-popup-body');
  if (bodyEl) bodyEl.innerHTML = bodyHtml || '';

  overlay.classList.remove('hidden');
}

/**
 * 共通インフォポップアップの非表示
 */
function closeInfoPopup() {
  const overlay = document.getElementById('info-popup-modal');
  if (overlay) overlay.classList.add('hidden');
}

/**
 * 施設投資の詳細ポップアップ表示
 */
function showFacilityInfoPopup(facilityKey) {
  const def = FACILITY_DEFINITIONS[facilityKey];
  if (!def) return;
  const lv = (gameState.facilities && gameState.facilities[facilityKey]) || 1;
  const isMax = lv >= def.maxLevel;
  const nextCost = isMax ? 0 : def.costs[lv];
  const curEffect = typeof def.getEffectText === 'function' ? def.getEffectText(lv) : '';
  const nextEffect = typeof def.getNextEffectText === 'function' ? def.getNextEffectText(lv) : (isMax ? '最大レベル達成済' : '効果増大');

  const bodyHtml = `
    <div class="info-popup-section">
      <div class="info-popup-meta-row">
        <span class="info-popup-label">現在の効果 (Lv.${lv})</span>
        <strong class="info-popup-value accent-green">${curEffect}</strong>
      </div>
      ${isMax ? '' : `
      <div class="info-popup-meta-row" style="margin-top: 8px;">
        <span class="info-popup-label">次回改修時 (Lv.${lv + 1})</span>
        <strong class="info-popup-value text-cyan">${nextEffect}</strong>
      </div>
      <div class="info-popup-meta-row" style="margin-top: 8px;">
        <span class="info-popup-label">次回改修費用</span>
        <strong class="info-popup-value mono accent-gold">${formatMoney(nextCost)}</strong>
      </div>
      `}
    </div>
    <div class="info-popup-desc-box">
      <h4 class="info-popup-desc-heading">施設概要</h4>
      <p class="info-popup-desc-text">${def.desc}</p>
    </div>
  `;

  showInfoPopup({
    title: def.name,
    tag: `Lv.${lv} / ${def.maxLevel}`,
    bodyHtml
  });
}

/**
 * 戦術スタイルの詳細ポップアップ表示
 */
function showTacticInfoPopup(tacticKey) {
  const normKey = normalizeTacticKey(tacticKey);
  const def = TACTICS_DEFINITIONS[normKey];
  if (!def) return;

  const tacticTags = {
    possession: ['支配率重視', '失点減', 'パス主体'],
    gegenpress: ['前線奪取', '決定機UP', 'スタミナ1.3倍'],
    counter: ['快足速攻', '強豪キラー', '省エネ'],
    wingplay: ['両翼クロス', '中央崩し', 'クロス重視'],
    parkthebus: ['徹底堅守', '失点激減', '引き分け狙い']
  }[normKey] || [];

  const bodyHtml = `
    <div class="info-popup-section">
      <div class="info-popup-meta-row">
        <span class="info-popup-label">狙い</span>
        <p class="info-popup-desc-text" style="margin: 4px 0 0; color: var(--text-main); font-weight: 500;">${def.aim}</p>
      </div>
      <div class="info-popup-meta-row" style="margin-top: 12px;">
        <span class="info-popup-label">効果</span>
        <p class="info-popup-desc-text" style="margin: 4px 0 0; color: var(--accent-green); font-weight: 500;">${def.effect}</p>
      </div>
    </div>
    <div class="info-popup-tags-row">
      ${tacticTags.map(tag => `<span class="tactic-mini-tag tag-${normKey === 'possession' ? 'pos' : (normKey === 'gegenpress' ? 'red' : (normKey === 'counter' ? 'gold' : (normKey === 'wingplay' ? 'cyan' : 'purple')))}">${tag}</span>`).join('')}
    </div>
  `;

  showInfoPopup({
    title: def.name.replace(/（.*）/, ''),
    tag: '戦術スタイル',
    bodyHtml
  });
}


/**
 * シーズン終了時の処理（賞金・スポンサー収入加算・目標順位評価・加齢・成長・契約年数-1・引退・移籍市場）
 */
function processSeasonEnd(isSkipped = false) {
  gameState.isSeasonOver = true;
  gameState.selectedPlayerId = null;

  const wasInD2 = isPlayerInSecondDivision();
  const sortedD1 = getSortedStandings();
  const d2Comp = gameState.competitions && gameState.competitions.championship;
  const sortedD2 = d2Comp && Array.isArray(d2Comp.clubs)
    ? [...d2Comp.clubs].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0) || (b.gf || 0) - (a.gf || 0))
    : [];

  // 勝点リセット・昇降格の前に今季最終順位と各カップ覇者を保存（翌季の欧州出場権判定用）
  gameState.lastSeasonStandingsOrder = sortedD1.map(c => c.id);
  const comps = gameState.competitions || {};
  gameState.lastSeasonCupWinners = {
    leagueCupId: comps.leagueCup && comps.leagueCup.winner ? comps.leagueCup.winner.id : null,
    nationalCupId: comps.nationalCup && comps.nationalCup.winner ? comps.nationalCup.winner.id : null,
    championsCupId: comps.championsCup && comps.championsCup.winner ? comps.championsCup.winner.id : null,
    europaCupId: comps.europaCup && comps.europaCup.winner ? comps.europaCup.winner.id : null,
    conferenceCupId: comps.conferenceCup && comps.conferenceCup.winner ? comps.conferenceCup.winner.id : null
  };

  const activeStandings = wasInD2 ? sortedD2 : sortedD1;
  const playerRankIndex = activeStandings.findIndex(c => c.isPlayer);
  const playerRank = playerRankIndex !== -1 ? playerRankIndex + 1 : 1;
  const playerClub = getPlayerClub();

  let playerPrize = 0;
  let playerSponsorIncome = 0;
  let targetBonus = 0;

  sortedD1.forEach((club, idx) => {
    const prize = PRIZE_MONEY_TABLE[idx] || 4000;
    club.funds = (club.funds || 0) + prize;

    if (club.isPlayer) {
      playerPrize = prize;
      if (playerRank <= (club.targetRank || 4)) {
        targetBonus = 3000;
        club.funds += targetBonus;
      }
    }
  });

  if (sortedD2.length > 0) {
    sortedD2.forEach((club, idx) => {
      const prize = PRIZE_MONEY_TABLE_D2[idx] || 1500;
      if (typeof club.funds === 'number' || club.isPlayer) {
        club.funds = (club.funds || 15000) + prize;
      }
      if (club.isPlayer) {
        playerPrize = prize;
        if (playerRank <= (club.targetRank || 3)) {
          targetBonus = 3000;
          club.funds += targetBonus;
        }
      }
    });
  }

  // 今季残りのオフシーズン週分（52週 - 支払済週数）の週次人件費をシーズン末決算と同時に精算完了する
  const remPayrollWeeks = Math.max(0, 52 - (gameState.paidPayrollWeeks || 0));
  let playerResidualPayroll = 0;
  if (remPayrollWeeks > 0) {
    for (const club of getAllManagedLeagueClubs()) {
      const residualCost = getClubWeeklyPayroll(club) * remPayrollWeeks;
      club.funds = (club.funds || 0) - residualCost;
      if (club.isPlayer) {
        playerResidualPayroll = residualCost;
      }
    }
  }
  gameState.paidPayrollWeeks = 52;

  if (typeof processSeasonEndFinanceAndPSR === 'function') {
    const finRes = processSeasonEndFinanceAndPSR(sortedD1, sortedD2);
    if (finRes && typeof finRes.playerSponsorIncome === 'number') {
      playerSponsorIncome = finRes.playerSponsorIncome;
    }
  }

  const playerAgingLogs = [];
  const playerRetirementLogs = [];
  const preContractIds = new Set((gameState.preContractPlayers || []).map(x => x.id));
  const processedAgedIds = new Set();
  gameState.expiredMarketPool = [];
  const finishedSeasonNum = gameState.season || 1;
  const finishedBaseYear = 2025 + finishedSeasonNum;
  const finishedYearStr = `${finishedBaseYear}-${String((finishedBaseYear + 1) % 100).padStart(2, '0')}`;

  for (const club of getAllManagedLeagueClubs()) {
    const expiredDepartures = new Set();
    let remainingPoolCount = (club.players || []).filter(pl => pl && !pl.isRetired).length;

    for (const p of (club.players || [])) {
      processedAgedIds.add(p.id);
      const seasonAge = p.age || 18;
      p.age += 1;
      p.injuryWeeks = 0;
      p.contractYears = Math.max(0, (p.contractYears || 1) - 1);

      if (!p.preContract && !preContractIds.has(p.id) && shouldPlayerRetire(p)) {
        p.isRetired = true;
        p.isStarter = false;
        remainingPoolCount = Math.max(0, remainingPoolCount - 1);
        if (club.isPlayer) {
          playerRetirementLogs.push(
            `[現役引退] ${p.pos} ${p.name} (${p.age}歳) が現役を引退しました`
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

      // ボスマン事前合意（preContract）締結済みの選手はCPUクラブが勝手に再契約しない
      if (!club.isPlayer && p.contractYears === 0 && !p.preContract && !preContractIds.has(p.id)) {
        const isLoanedPlayer = Boolean(p.loanStatus && (p.loanStatus.isLoan || p.loanStatus.isLoanOut));
        const canReleaseToFreeAgent = (
          !isLoanedPlayer &&
          !p.isStarter &&
          remainingPoolCount >= 16 &&
          gameState.expiredMarketPool.length < 4 &&
          Math.random() < 0.35
        );
        if (canReleaseToFreeAgent) {
          if (!Array.isArray(p.seasonHistory)) {
            const savedAge = p.age;
            p.age = seasonAge;
            ensurePlayerHistoryAndCareer(p, club.name);
            p.age = savedAge;
          }
          if (!p.seasonHistory.some(r => r && r.seasonYear === finishedYearStr)) {
            const prevAvg = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
            p.seasonHistory.push({
              seasonYear: finishedYearStr,
              clubName: club.name,
              age: seasonAge,
              appearances: p.appearances || 0,
              goals: p.goals || 0,
              assists: p.assists || 0,
              avgRating: prevAvg,
              ovr: getPlayerOverallRating(p)
            });
          }
          p.lastClubName = club.name;
          p.lastClubId = club.id;
          p.isFreeAgent = true;
          p.contractYears = 0;
          p.transferFee = 0;
          p.isStarter = false;
          p.isBench = false;
          p.assignedPos = null;
          p.slotIndex = null;
          p.appearances = 0;
          p.goals = 0;
          p.assists = 0;
          p.totalRating = 0;
          p.cleanSheets = 0;
          p.momCount = 0;
          p.yellowCards = 0;
          p.redCards = 0;
          p._generatedInOffseasonOfSeason = finishedSeasonNum;
          expiredDepartures.add(p.id);
          remainingPoolCount = Math.max(0, remainingPoolCount - 1);
          gameState.expiredMarketPool.push(p);
          continue;
        }
        p.contractYears = randInt(2, 4);
        p.salary = calculatePlayerSalary(p.pos, p.atk, p.def, p.sta, p.age);
        p.wage = Math.max(1, Math.round(p.salary / 52));
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

    club.players = club.players.filter(p => !p.isRetired && !expiredDepartures.has(p.id));
    ensureValidSquadAndStarters(club, playerRetirementLogs);

    // 常設ユースチーム（U-21 Squad）の加齢およびポテンシャル急成長
    if (club.youthSquad && Array.isArray(club.youthSquad)) {
      for (const yp of club.youthSquad) {
        yp.age += 1;
        let boost = 2;
        const ypPot = yp.potential || yp.potentialGrade || 'B';
        if (ypPot === 'S') boost = randInt(4, 7);
        else if (ypPot === 'A') boost = randInt(3, 5);
        else if (ypPot === 'B') boost = randInt(2, 4);
        else boost = randInt(1, 2);

        yp.atk = clamp(yp.atk + boost, 1, 99);
        yp.def = clamp(yp.def + boost, 1, 99);
        yp.sta = clamp(yp.sta + boost, 1, 99);
        yp.attributes = null;
        getPlayerFiveAttributes(yp);
      }
      // 21歳を超えてユースに残っている選手（22歳以上）は整理
      club.youthSquad = club.youthSquad.filter(yp => yp.age <= 21);
      // 人数が減った場合は新規有望株を自動スカウト
      while (club.youthSquad.length < 5) {
        const usedNames = new Set(club.players.map(p => p.name).concat(club.youthSquad.map(y => y.name)));
        const pos = ALL_POSITIONS[randInt(0, ALL_POSITIONS.length - 1)];
        club.youthSquad.push(createYouthPlayer(pos, usedNames));
      }
    }

    if (!club.isPlayer) {
      autoSelectStarters(club);
    }
  }

  // 海外クラブ・欧州リスト経由で事前合意（preContract）締結済みの内定選手もシーズン末に加齢・成長を反映する
  if (Array.isArray(gameState.preContractPlayers)) {
    for (const pp of gameState.preContractPlayers) {
      if (!pp || processedAgedIds.has(pp.id)) continue;
      processedAgedIds.add(pp.id);
      pp.age = (pp.age || 18) + 1;
      pp.injuryWeeks = 0;
      const { dAtk, dDef, dSta } = computeStatGrowth(pp, false);
      const oldAtk = pp.atk;
      const oldDef = pp.def;
      const oldSta = pp.sta;
      pp.atk = clamp(pp.atk + dAtk, 1, 99);
      pp.def = clamp(pp.def + dDef, 1, 99);
      pp.sta = clamp(pp.sta + dSta, 1, 99);
      pp.attributes = null;
      getPlayerFiveAttributes(pp);
      pp.lastDiff = {
        atk: pp.atk - oldAtk,
        def: pp.def - oldDef,
        sta: pp.sta - oldSta
      };
    }
  }

  generateTransferMarket();
  gameState.youthCandidates = [];

  if (typeof ageAndRenewCoachingStaffAtSeasonEnd === 'function') {
    ageAndRenewCoachingStaffAtSeasonEnd(playerRetirementLogs);
  }

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
    offseasonPayrollSettled: playerResidualPayroll,
    remPayrollWeeks,
    retirementLogs: playerRetirementLogs,
    agingLogs: playerAgingLogs
  };

  switchTab('market');

  // 昇降格判定の実行（実際の1部・2部クラブ入れ替えは新シーズン開幕時に実施し、オフシーズン中は今季の最終順位表を保持する）
  const mustPromoteThisSeason = Boolean(wasInD2 && playerClub && playerClub.mustPromoteImmediate);
  const promoRelResult = (typeof evaluatePromotionAndRelegation === 'function')
    ? evaluatePromotionAndRelegation()
    : ((typeof processPromotionAndRelegation === 'function') ? processPromotionAndRelegation() : null);
  if (promoRelResult && promoRelResult.isPlayerRelegated) {
    showGmModal({
      allowDuringSkip: true,
      category: 'BOARD OF DIRECTORS / CRITICAL WARNING',
      title: '【緊急通告】セカンドディビジョン（ENG-D2）への降格処分と最後通告',
      description: `今シーズンの成績不振により、当クラブはイングランド・セカンドディビジョン（ENG-D2）への降格が決定いたしました。理事会は極めて遺憾の意を表明するとともに、来季1年での「ファーストディビジョン（ENG-D1）復帰（3位以内自動昇格）」を絶対厳命といたします。達成できなかった場合は即時解任となります。`,
      detailHtml: `降格クラブ: ${promoRelResult.relegated.join('、')}<br>昇格クラブ: ${promoRelResult.promoted.join('、')}`,
      actions: [
        {
          label: '厳命を受託し、1年でのD1復帰を誓う',
          className: 'btn btn-primary',
          onClick: () => {
            renderAll();
          }
        }
      ]
    });
  } else if (promoRelResult && promoRelResult.isPlayerPromoted) {
    showGmModal({
      allowDuringSkip: true,
      category: 'BOARD OF DIRECTORS / PROMOTION ACHIEVED',
      title: '【祝・1部昇格達成】ファーストディビジョン（ENG-D1）への復帰決定！',
      description: `見事セカンドディビジョン（ENG-D2）を ${playerRank}位 で勝ち抜き、来季からのイングランド・ファーストディビジョン（ENG-D1）昇格が決定しました！理事会およびサポーターはあなたの手腕を高く称賛しています。`,
      detailHtml: `昇格クラブ: ${promoRelResult.promoted.join('、')}<br>降格クラブ: ${promoRelResult.relegated.join('、')}`,
      actions: [
        {
          label: '新シーズンの1部挑戦へ備える',
          className: 'btn btn-primary',
          onClick: () => {
            renderAll();
          }
        }
      ]
    });
  } else if (mustPromoteThisSeason && (!promoRelResult || !promoRelResult.isPlayerPromoted)) {
    gameState.isGameOver = true;
    showGmModal({
      allowDuringSkip: true,
      category: 'BOARD OF DIRECTORS / DISMISSAL NOTICE',
      title: '【GM解任通告】1年でのファーストディビジョン復帰失敗',
      description: `セカンドディビジョン ${playerRank}位 に終わり、理事会より厳命されていた「1年でのファーストディビジョン（ENG-D1）復帰」を達成できませんでした。本日付でGM契約解除（ゲームオーバー）となります。`,
      detailHtml: `最終順位: ENG-D2 ${playerRank}位（昇格ライン: 3位以内）`,
      actions: [
        {
          label: '結果を受け入れる',
          className: 'btn btn-secondary',
          onClick: () => {
            renderAll();
          }
        }
      ]
    });
    return;
  }

  // シーズン内の未締結オファーを期限切れとして整理
  if (Array.isArray(gameState.outgoingOffers)) {
    for (const o of gameState.outgoingOffers) {
      if (!o) continue;
      if ((o.dealType === 'buy' || o.dealType === 'loan' || !o.dealType) && (o.status === 'pending' || o.status === 'cpu_counter' || o.status === 'agreed')) {
        o.status = 'expired';
      }
    }
  }
  if (Array.isArray(gameState.incomingOffers)) {
    for (const o of gameState.incomingOffers) {
      if (!o) continue;
      if (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') {
        o.status = 'expired';
      }
    }
  }

  // シーズン終了時は移籍市場閉幕中のため未締結オファー・メガオファーを整理し、不要なオファータスクを残さない
  gameState.pendingMegaOffer = null;
}

/**
 * 選手の活躍度（今季得点・平均評価点・OVR）に応じた要求年俸（単位：£1K）を算出
 */
function calculatePlayerDemandSalary(player) {
  if (player.demandedSalary && player.demandedSalary > 0) {
    return player.demandedSalary;
  }
  const assessed = calculatePlayerSalary(player.pos, player.atk, player.def, player.sta, player.age);
  const goalBonus = (player.goals || 0) * 90;
  const avgRat = player.appearances > 0 ? player.totalRating / player.appearances : 6.4;
  const ratingBonus = player.appearances >= 3 ? Math.max(0, Math.round((avgRat - 6.4) * 400)) : 0;
  const baseDemand = Math.max(assessed, Math.round(player.salary * 1.05)) + goalBonus + ratingBonus;
  const prideFactor = player.megaOfferRejected ? 1.12 : 1.0;
  const demanded = Math.max(800, Math.round((baseDemand * prideFactor) / 50) * 50);
  player.demandedSalary = demanded;
  return demanded;
}

/**
 * 選手の年齢・OVRに応じた希望契約年数（1〜4年）を算出
 */
function calculatePlayerDemandYears(player) {
  if (player.demandedYears && player.demandedYears >= 1 && player.demandedYears <= 4) {
    return player.demandedYears;
  }
  const ovr = getPlayerOverallRating(player);
  let years = 3;
  if (player.age <= 24) {
    years = ovr >= 70 ? 4 : 3;
  } else if (player.age <= 29) {
    years = 3;
  } else if (player.age <= 32) {
    years = 2;
  } else {
    years = 1;
  }
  player.demandedYears = years;
  return years;
}

/**
 * 契約更新交渉モーダルを開く（契約残り1〜2年の自クラブ選手対象）
 */
function openContractNegotiationModal(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub ? playerClub.players.find(p => p.id === playerId) : null;
  if (!target) return;
  if (target.loanStatus && target.loanStatus.isLoan) {
    if (typeof showToast === 'function') {
      showToast('レンタル加入中の選手とは契約延長交渉を行えません', 'warn');
    }
    return;
  }

  closePlayerProfileModal();

  const demandedSalary = calculatePlayerDemandSalary(target);
  const demandedYears = calculatePlayerDemandYears(target);
  const failCount = target.renewalFailCount || 0;
  const isRefused = Boolean(target.contractRefused);

  let statusType = 'info';
  let statusMessage = '';

  if (isRefused) {
    statusType = 'error';
    statusMessage = `【交渉打ち切り済】2回連続の条件不一致により、#${target.squadNumber || '-'} ${target.name} の代理人は契約延長交渉を打ち切りました。オフシーズンにフリー移籍での退団が確定しています。`;
  } else if (failCount === 1) {
    statusType = 'warn';
    statusMessage = `【再交渉（残りチャンス1回）】前回の提示額に不満を示し、要求週給が ${formatWage(Math.max(5, Math.round(demandedSalary / 52)))} に引き上げられています。今回合意できない場合は交渉決裂（フリー流出確定）となります。`;
  }

  gameState.negotiationSession = {
    mode: 'renewal',
    playerId: target.id,
    offeredSalary: demandedSalary,
    offeredYears: demandedYears,
    offeredFee: 0,
    demandedSalary,
    demandedYears,
    demandedFee: 0,
    failCount,
    completed: isRefused,
    statusType,
    statusMessage
  };

  renderNegotiationModal();
  const modalEl = document.getElementById('negotiation-modal');
  if (modalEl) modalEl.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 契約残り半年（1月冬ウィンドウ以降 かつ 残り契約1年以下）の事前合意適格判定
 */
function isPreContractEligible(player) {
  if (!player) return false;
  const playerClub = getPlayerClub();
  if (playerClub && playerClub.players.some(p => p.id === player.id)) return false;
  if (player.isFreeAgent) return false;
  if (player.contractYears > 1) return false;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay) return false;
  // 1月以降（month === 1 または 1〜5月）かつ 契約残り1年以下なら事前合意（ボスマン）対象
  const isPostJanuary = currentDay.month === 1 || (currentDay.month >= 1 && currentDay.month <= 5);
  return isPostJanuary;
}

/**
 * 22歳以下の若手選手のレンタル（レンタル放出）リスト登録トグル
 */
function toggleLoanListing(playerId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return;
  const p = playerClub.players.find(x => x.id === playerId);
  if (!p || p.age > 22) return;

  p.isLoanListed = !p.isLoanListed;
  if (p.isLoanListed) {
    addDailyLog(`【レンタル放出登録】#${p.squadNumber || '-'} ${p.name} (22歳以下) をレンタル放出（レンタル）リストに設定しました。他クラブから打診が届くようになります。`);
  } else {
    addDailyLog(`【レンタル放出解除】#${p.squadNumber || '-'} ${p.name} のレンタル放出設定を解除しました。`);
  }
  renderAll();
}

/**
 * 移籍ウィンドウ期間中のレンタル打診オファー発生処理
 */
function triggerLoanListingOffers() {
  const playerClub = getPlayerClub();
  if (!playerClub || !Array.isArray(gameState.incomingOffers)) return false;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || !currentDay.windowOpen) return false;
  if (gameState.incomingOffers.length >= 6) return false;

  const listedPlayers = playerClub.players.filter(p => p.isLoanListed && !p.isStarter && !p.isRetired && (!p.loanStatus || !p.loanStatus.isLoanOut));
  if (listedPlayers.length === 0) return false;

  // 約15%の確率で打診オファー発生
  if (Math.random() > 0.18) return false;

  const target = listedPlayers[randInt(0, listedPlayers.length - 1)];
  if (gameState.incomingOffers.some(o => o.playerId === target.id)) return false;

  const cpuClubs = gameState.clubs.filter(c => !c.isPlayer);
  const loanBuyerClub = cpuClubs[randInt(0, cpuClubs.length - 1)];
  const buyerName = loanBuyerClub ? loanBuyerClub.name : '海外クラブ';

  const buyerCountry = loanBuyerClub ? (loanBuyerClub.country || '国内リーグ') : '国内リーグ';
  const ovrVal = getPlayerOverallRating(target);

  const loanOffer = {
    id: `loan_in_${Date.now()}_${target.id}`,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.primaryPosition || target.preferredPosition || target.pos,
    squadNumber: target.squadNumber || 10,
    playerAge: target.age,
    ovr: ovrVal,
    buyerClubId: loanBuyerClub ? loanBuyerClub.id : null,
    buyerClubName: buyerName,
    buyerClubCountry: buyerCountry,
    offerFee: 0,
    offeredFee: 0,
    counterFee: 0,
    wage: target.wage || 20,
    offeredSalary: target.salary || ((target.wage || 20) * 52),
    daysLeft: 5,
    status: 'pending',
    isLoanOffer: true,
    loanCoveragePercent: 100, // 相手クラブが給与100%負担
    createdDayIndex: gameState.currentDayIndex
  };

  gameState.incomingOffers.unshift(loanOffer);
  addDailyLog(`【レンタル打診】${buyerName} からレンタル放出リストの ${target.pos} #${target.squadNumber || '-'} ${target.name} に対し、1年間の期限付き移籍（給与100%相手負担）の打診が届きました！`);
  return true;
}

/**
 * 1月冬ウィンドウ中の自クラブ主力選手の他クラブ事前合意（ボスマン流出）イベント
 */
function triggerPreContractDepartures() {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;

  const currentDay = getCurrentCalendarDay();
  if (!currentDay || currentDay.month !== 1 || !currentDay.windowOpen) return false;

  // 既に今シーズン事前合意流出が発生済みならスキップ（シーズン最大1名）
  if (gameState.hasPreContractDepartureThisSeason) return false;

  // 対象：契約残り1年以下、未更新、未決裂、主力級
  const eligible = playerClub.players.filter(p => 
    p.contractYears <= 1 && 
    !p.contractRefused && 
    !p.preContractDeparture && 
    !p.isRetired &&
    getPlayerOverallRating(p) >= 70
  );
  if (eligible.length === 0) return false;

  // 1日あたり約3%の低確率
  if (Math.random() > 0.03) return false;

  const target = eligible[randInt(0, eligible.length - 1)];
  let pickedDest = null;
  if (typeof getEuropeanMajorClubDefinitions === 'function') {
    const eliteEuro = getEuropeanMajorClubDefinitions().filter(c => (c.basePower || 75) >= 80);
    if (eliteEuro.length > 0) pickedDest = eliteEuro[randInt(0, eliteEuro.length - 1)];
  }
  if (!pickedDest && Array.isArray(gameState.europeanMegaClubs) && gameState.europeanMegaClubs.length > 0) {
    pickedDest = gameState.europeanMegaClubs[randInt(0, gameState.europeanMegaClubs.length - 1)];
  }
  const foreignClubName = pickedDest ? pickedDest.name : 'マドリード W';
  const foreignClubId = pickedDest ? pickedDest.id : 'es01';

  target.preContractDeparture = {
    toClubId: foreignClubId,
    toClubName: foreignClubName,
    effectiveSeason: (gameState.season || 1) + 1
  };
  target.contractRefused = true; // 今季中のこれ以上の更新は不可に
  gameState.hasPreContractDepartureThisSeason = true;

  addDailyLog(`【事前合意流出】契約最終年の主力 #${target.squadNumber || '-'} ${target.name} が ${foreignClubName} と来季の事前合意（ボスマン移籍）に署名しました。今シーズン終了後に移籍金£0で退団します！`);
  return true;
}

function isTransferWindowCurrentlyOpen() {
  const day = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
  if (!day) return true;
  return Boolean(day.windowOpen);
}

function openTransferNegotiationModal(candidateId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;
  if (typeof ensureClubRealismFields === 'function') ensureClubRealismFields(playerClub);

  if (playerClub.psrSanction && playerClub.psrSanction.transferBanWindows > 0) {
    showToast('PSR（財政規律）違反による補強禁止処分中のため、新規選手の獲得交渉は行えません。', 'error');
    return;
  }

  const resolved = findTransferTargetWithSeller(candidateId);
  const target = resolved ? resolved.player : null;
  const sellerClub = resolved ? resolved.sellerClub : null;

  if (!target || (sellerClub && sellerClub.isPlayer)) return;

  const isFreeAgent = Boolean(target.isFreeAgent || (!sellerClub && target.contractYears === 0));
  const isPreContract = !isFreeAgent && isPreContractEligible(target);
  const windowOpen = isTransferWindowCurrentlyOpen();

  if (!windowOpen && !isPreContract && !isFreeAgent) {
    showToast('現在は移籍ウィンドウ期間外（夏:7〜8月 / 冬:1月）のため、獲得交渉を行えません。', 'warning');
    return;
  }

  closePlayerProfileModal();

  // 取引種別（dealType）の初期決定
  let dealType = 'buy';
  if (isFreeAgent) {
    dealType = 'free_agent';
  } else if (!windowOpen && isPreContract) {
    dealType = 'pre_contract';
  }

  const baseOvr = getPlayerOverallRating(target);
  const rep = playerClub.reputation || 4000;
  const repBlocked = (baseOvr >= 85 && rep < 5800) || (baseOvr >= 82 && rep < 4200);
  const demandedFee = isFreeAgent ? 0 : calculateTransferFee(target);
  const demandedWage = Math.max(5, Math.round((target.wage || 20) * (isFreeAgent ? 1.05 : 1.15)));
  const demandedSalary = demandedWage * 52;
  const demandedYears = clamp(target.contractYears >= 3 ? 3 : 4, 1, 5);
  const failCount = target.transferFailCount || 0;
  const isRefused = Boolean(target.negotiationFailed) || repBlocked;

  const clubName = isFreeAgent ? '無所属 (Free Agent)' : (sellerClub ? sellerClub.name : '相手クラブ');
  let statusType = 'info';
  let statusMessage = '';

  if (repBlocked) {
    const svRep = typeof getPlayerScoutedView === 'function' ? getPlayerScoutedView(target, false) : { isScouted: true, ovrMin: baseOvr, ovrMax: baseOvr };
    const repOvrTxt = svRep.isScouted ? `${baseOvr}` : `${svRep.ovrMin}~${svRep.ovrMax}`;
    statusType = 'error';
    statusMessage = `【クラブの格・実績不足】${target.name}（OVR ${repOvrTxt}）は「欧州トップレベルの舞台や格上のクラブでのプレーを望んでいる」として、交渉のテーブルに着くことを拒否しました。`;
  } else if (isRefused) {
    statusType = 'error';
    statusMessage = `【移籍交渉決裂済】2回連続で合意に至らなかったため、${clubName}および代理人は今ウィンドウでの交渉を打ち切りました。`;
  } else if (failCount === 1) {
    statusType = 'warn';
    statusMessage = `【再オファー（残り1回）】前回の提示条件が不足していたため、相手側の要求条件が引き上げられています。`;
  }

  gameState.negotiationSession = {
    mode: 'transfer',
    dealType: dealType, // 'buy' | 'loan' | 'pre_contract' | 'free_agent'
    isFreeAgent: isFreeAgent,
    isPreContractEligible: isPreContract,
    playerId: target.id,
    sellerClubId: sellerClub ? sellerClub.id : null,
    sellerClubName: clubName,
    offeredWage: demandedWage,
    offeredSalary: demandedSalary,
    offeredYears: demandedYears,
    offeredFee: demandedFee,
    demandedWage,
    demandedSalary,
    demandedYears,
    demandedFee,
    // 契約条項・分割払い・レンタル買取OP
    squadStatus: baseOvr >= 78 ? 'key' : 'first_team',
    releaseClause: null,
    installmentYears: 1,
    sellOnPct: 0,
    buyOptionFee: null,
    // レンタル用設定
    loanCoveragePercent: 100, // 提示週給負担率 (50%〜100%)
    demandedLoanCoverage: target.age <= 22 ? 70 : 90, // 要求週給負担率
    failCount,
    completed: isRefused,
    statusType,
    statusMessage
  };

  renderNegotiationModal();
  const modalEl = document.getElementById('negotiation-modal');
  if (modalEl) modalEl.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 交渉モーダル内の資金・キャッシュフロー警告状態を計算する
 */
function computeNegotiationCashflowWarning(session, playerClubOverride = null, targetOverride = null) {
  if (!session) return { visible: false, isCritical: false, text: '' };
  const playerClub = playerClubOverride || (typeof getPlayerClub === 'function' ? getPlayerClub() : null);
  if (!playerClub) return { visible: false, isCritical: false, text: '' };

  const isRenewal = session.mode === 'renewal';
  let target = targetOverride;
  if (!target) {
    if (isRenewal) {
      target = (playerClub.players || []).find(p => p.id === session.playerId) || null;
    } else if (typeof findTransferTargetWithSeller === 'function') {
      const resolved = findTransferTargetWithSeller(session.playerId);
      target = resolved ? resolved.player : null;
    }
  }
  if (!target) return { visible: false, isCritical: false, text: '' };

  const safeBgt = getSafeTransferBudget(playerClub);
  if (isRenewal) {
    const curAnnual = target.salary || ((target.wage || 15) * 52);
    const addWeekly = Math.max(0, Math.round(((session.offeredSalary || curAnnual) - curAnnual) / 52));
    const estReserveImpact = addWeekly * 20;
    if (estReserveImpact > 0 && (safeBgt - estReserveImpact) < 0) {
      return {
        visible: true,
        isCritical: false,
        text: `キャッシュフロー注意：昇給分（+${formatWage(addWeekly)}/週）により実質安全予算（${formatMoney(safeBgt)}）を超過し、週次引き落としで資金繰りが悪化する恐れがあります。`
      };
    }
    return { visible: false, isCritical: false, text: '' };
  }

  const dType = session.dealType || 'buy';
  const instYears = session.installmentYears || 1;
  const feeCost = dType === 'buy'
    ? (typeof getTransferUpfrontAmount === 'function' ? getTransferUpfrontAmount(session.offeredFee || 0, instYears) : (session.offeredFee || 0))
    : 0;
  let weeklyAdd = 0;
  if (dType === 'loan') {
    weeklyAdd = Math.round((target.wage || 20) * ((session.loanCoveragePercent || 100) / 100));
  } else if (dType === 'pre_contract') {
    weeklyAdd = 0;
  } else {
    weeklyAdd = session.offeredWage || Math.round((session.offeredSalary || 0) / 52) || 20;
  }
  const totalImpact = feeCost + (weeklyAdd * 12);
  if (dType === 'buy' && feeCost > playerClub.funds) {
    const feeLabel = instYears > 1
      ? `必要頭金（${formatMoney(feeCost)} / ${instYears}年分割）`
      : `提示移籍金（${formatMoney(feeCost)}）`;
    return {
      visible: true,
      isCritical: true,
      text: `資金不足：${feeLabel} が現在資金（${formatMoney(playerClub.funds)}）を超えています。`
    };
  }
  if (dType !== 'pre_contract' && totalImpact > safeBgt) {
    return {
      visible: true,
      isCritical: false,
      text: `破産予防アラート：移籍金頭金＋週給負担（+${formatWage(weeklyAdd)}/週）が実質移籍予算（安全枠 ${formatMoney(safeBgt)}）を上回っています。シーズン中の週次給与決済で赤字転落するリスクがあります。`
    };
  }
  return { visible: false, isCritical: false, text: '' };
}

function refreshNegCashflowWarning(bodyEl = null) {
  const root = bodyEl || document.getElementById('neg-modal-body');
  if (!root || !gameState.negotiationSession) return;
  const warnBox = root.querySelector('#neg-cashflow-warning-box');
  if (!warnBox) return;
  const st = computeNegotiationCashflowWarning(gameState.negotiationSession);
  warnBox.textContent = st.text;
  warnBox.classList.toggle('hidden', !st.visible);
  warnBox.classList.toggle('is-critical', Boolean(st.isCritical));
}

/**
 * プロフィール・交渉・オファー各モーダル共通の選手ヘッダー表示データを生成する
 */
function buildUnifiedPlayerModalHeaderData(p, clubObj, clubLabelText, opts = {}) {
  if (!p) return null;
  const primaryPos = p.primaryPosition || p.preferredPosition || p.pos || 'CM';
  if (typeof ensurePlayerProficiencies === 'function') ensurePlayerProficiencies(p);
  const mains = Array.isArray(p.mainPositions) && p.mainPositions.length > 0
    ? p.mainPositions
    : (Array.isArray(p.majorPositions) && p.majorPositions.length > 0 ? p.majorPositions : [primaryPos]);
  const subsRaw = Array.isArray(p.subPositions) ? p.subPositions : (Array.isArray(p.secondaryPositions) ? p.secondaryPositions : []);
  const subsFiltered = subsRaw.filter(sp => !mains.includes(sp));

  const heightText = typeof p.height === 'number' ? `${p.height}cm` : (p.height || '180cm');
  const rawNat = p.nationality || 'England';
  const flagHtml = typeof getNationalityFlagHtml === 'function' ? getNationalityFlagHtml(rawNat) : '';
  const footHtml = typeof formatFootBadge === 'function' ? formatFootBadge(p) : '';
  const nationalityDisplay = `<span style="display:inline-flex;align-items:center;gap:5px;"><span class="profile-flag-wrapper">${flagHtml}</span><span>${rawNat}</span></span>`;
  const subPosTextHtml = subsFiltered.length > 0
    ? `<span class="profile-meta-subpos">/${subsFiltered.join('·')}</span>`
    : '';
  const emblemHtml = (clubObj && typeof getClubEmblemSvg === 'function')
    ? getClubEmblemSvg(clubObj, 17, 'profile-club-emblem')
    : '';
  const weeklyWageVal = p.wage || Math.max(1, Math.round((p.salary || 520) / 52));
  const estMarketValue = typeof calculatePlayerMarketValue === 'function'
    ? calculatePlayerMarketValue(p)
    : (typeof calculateTransferFee === 'function' ? calculateTransferFee(p) : 0);

  return {
    clubHtml: `${emblemHtml}<span>${clubLabelText}</span>`,
    clubAccent: (clubObj && clubObj.primaryColor) || (opts.isFreeAgent ? '#475569' : '#2ecc71'),
    squadNumText: (!opts.isFreeAgent && p.squadNumber) ? `#${p.squadNumber}` : '',
    nameHtml: `<span class="profile-name-main">${p.fullName || p.name}</span><span class="profile-age-inline">(${p.age})</span>`,
    posMetaHtml: `
      <span class="profile-meta-mainpos">${mains.join('·')}</span>${subPosTextHtml}
      <span class="profile-meta-sep">|</span>
      <span class="profile-meta-foot">${footHtml}</span>
      <span class="profile-meta-text">${heightText}</span>
      <span class="profile-meta-sep">|</span>
      <span class="profile-meta-nat">${nationalityDisplay}</span>
    `,
    weeklyWageVal,
    estMarketValue,
    contractText: opts.isFreeAgent ? '無所属' : `契約 ${p.contractYears || 0}年`
  };
}

/**
 * 交渉モーダル（契約更新 / 移籍獲得）の内容を描画・同期する
 */
function renderNegotiationModal() {
  const session = gameState.negotiationSession;
  if (!session) return;

  const playerClub = getPlayerClub();
  const isRenewal = session.mode === 'renewal';
  let target = null;
  let sellerClub = null;

  if (isRenewal) {
    target = playerClub.players.find(p => p.id === session.playerId) || null;
  } else {
    const resolved = findTransferTargetWithSeller(session.playerId);
    if (resolved) {
      target = resolved.player;
      sellerClub = resolved.sellerClub;
    }
  }

  if (!target) return;

  const ovr = getPlayerOverallRating(target);
  const negScoutView = (isRenewal || typeof getPlayerScoutedView !== 'function')
    ? { isScouted: true, ovrMin: ovr, ovrMax: ovr }
    : getPlayerScoutedView(target, false);
  const negOvrHtml = negScoutView.isScouted
    ? `${ovr}`
    : buildOvrRangeHtml(negScoutView.ovrMin, negScoutView.ovrMax);
  const negOvrSeed = negScoutView.isScouted ? ovr : Math.round((negScoutView.ovrMin + negScoutView.ovrMax) / 2);

  const avatarCanvasEl = document.getElementById('neg-avatar-canvas');
  if (avatarCanvasEl && typeof generatePlayerAvatar === 'function') {
    const avatarClub = isRenewal ? playerClub : (sellerClub || (typeof findAvatarClubForPlayer === 'function' ? findAvatarClubForPlayer(target) : null));
    generatePlayerAvatar(target, avatarCanvasEl, avatarClub);
  }

  const headerOvrEl = document.getElementById('neg-header-ovr');
  if (headerOvrEl) {
    const valEl = headerOvrEl.querySelector('.profile-header-ovr-val');
    if (valEl) {
      if (negScoutView.isScouted) {
        valEl.textContent = ovr;
        valEl.className = `profile-header-ovr-val ${typeof getOvrTierClass === 'function' ? getOvrTierClass(negOvrSeed) : ''}`;
      } else {
        valEl.innerHTML = negOvrHtml;
        valEl.className = 'profile-header-ovr-val';
      }
      valEl.style.background = 'none';
      valEl.style.fontSize = negScoutView.isScouted ? '' : '16px';
    }
  }

  const clubDisplayObj = isRenewal ? playerClub : (session.isFreeAgent ? null : sellerClub);
  const clubLabelText = isRenewal
    ? (playerClub ? playerClub.name : '自クラブ')
    : (session.isFreeAgent ? '無所属 (Free Agent)' : (sellerClub ? sellerClub.name : '相手クラブ'));
  const hdrData = buildUnifiedPlayerModalHeaderData(target, clubDisplayObj, clubLabelText, {
    isFreeAgent: Boolean(!isRenewal && session.isFreeAgent)
  });

  const negTopBarEl = document.getElementById('neg-top-club-bar');
  if (negTopBarEl && hdrData) {
    negTopBarEl.style.setProperty('--profile-club-accent', hdrData.clubAccent);
  }

  const catEl = document.getElementById('neg-modal-category');
  if (catEl && hdrData) {
    catEl.innerHTML = hdrData.clubHtml;
  }

  const squadNumEl = document.getElementById('neg-squad-num');
  if (squadNumEl && hdrData) {
    squadNumEl.textContent = hdrData.squadNumText;
    squadNumEl.classList.toggle('hidden', !hdrData.squadNumText);
  }

  const posPillEl = document.getElementById('neg-pos-pill');
  if (posPillEl && hdrData) {
    posPillEl.innerHTML = hdrData.posMetaHtml;
  }

  const titleEl = document.getElementById('neg-modal-title');
  if (titleEl && hdrData) {
    titleEl.innerHTML = hdrData.nameHtml;
  }

  const metaEl = document.getElementById('neg-player-meta');
  if (metaEl && hdrData) {
    const wageLabel = isRenewal ? '現在週給' : '現週給';
    metaEl.innerHTML = `
      <span class="profile-bio-chip">${wageLabel} <strong class="accent-gold">£${hdrData.weeklyWageVal.toLocaleString()}k/週</strong></span>
      <span class="profile-bio-sep">·</span>
      <span class="profile-bio-chip">市場価値 <strong class="accent-green">${formatMoney(hdrData.estMarketValue)}</strong></span>
      <span class="profile-bio-sep">·</span>
      <span class="profile-bio-chip">${hdrData.contractText}</span>
    `;
  }

  const maxFails = 2;
  const remainingTries = Math.max(0, maxFails - (session.failCount || 0));
  let patienceClass = '';
  let patienceLabel = `残り ${remainingTries} 回`;
  if (session.completed && session.statusType === 'success') {
    patienceLabel = '合意成立';
  } else if (remainingTries === 1) {
    patienceClass = 'patience-warn';
    patienceLabel = '最終交渉';
  } else if (remainingTries === 0) {
    patienceClass = 'patience-danger';
    patienceLabel = '交渉決裂';
  }

  // 取引種別トグルバー（移籍モードのみ）
  let dealTypeTabsHtml = '';
  if (!isRenewal) {
    if (session.isFreeAgent) {
      dealTypeTabsHtml = `
        <div class="neg-dealtype-tabs">
          <div class="neg-dealtype-pill active">完全フリー獲得 (移籍金 £0)</div>
        </div>
      `;
    } else {
      const isPreContractOk = session.isPreContractEligible;
      dealTypeTabsHtml = `
        <div class="neg-dealtype-tabs" id="neg-dealtype-group">
          <button type="button" class="btn-dealtype ${session.dealType === 'buy' ? 'active' : ''}" data-deal-type="buy" ${session.completed ? 'disabled' : ''}>
            完全移籍
          </button>
          <button type="button" class="btn-dealtype ${session.dealType === 'loan' ? 'active' : ''}" data-deal-type="loan" ${session.completed ? 'disabled' : ''}>
            レンタル
          </button>
          ${isPreContractOk ? `
            <button type="button" class="btn-dealtype ${session.dealType === 'pre_contract' ? 'active' : ''}" data-deal-type="pre_contract" ${session.completed ? 'disabled' : ''} title="残り契約半年・来季7/1加入内定">
              事前合意
            </button>
          ` : ''}
        </div>
      `;
    }
  }

  // スライダー範囲の算出（UIは週給 £1K単位で操作し、内部年俸と整合）
  const minSalary = Math.max(500, Math.round((session.demandedSalary * 0.65) / 50) * 50);
  const maxSalary = Math.max(minSalary + 1000, Math.round((session.demandedSalary * 1.55) / 50) * 50);
  const curDemandedWage = Math.max(5, Math.round((session.demandedSalary || 500) / 52));
  const curOfferedWage = session.offeredWage || Math.max(5, Math.round((session.offeredSalary || 500) / 52));
  const minWage = Math.max(10, Math.round(minSalary / 52));
  const maxWage = Math.max(minWage + 20, Math.round(maxSalary / 52));

  const minFee = isRenewal ? 0 : Math.max(300, Math.round((session.demandedFee * 0.65) / 100) * 100);
  const maxFee = isRenewal ? 0 : Math.max(minFee + 2000, Math.round((session.demandedFee * 1.45) / 100) * 100);

  // 取引種別に応じた提示コントロール
  let dealControlsHtml = '';

  if (isRenewal) {
    // 契約延長
    const curContractY = target.contractYears || 0;
    const yearsButtonsHtml = [1, 2, 3, 4].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年延長
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示週給</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatWage(curOfferedWage)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''} title="単位：£1K/週">
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">延長契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年延長 (計${curContractY + session.offeredYears}年)</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  } else if (session.dealType === 'loan') {
    // レンタル（LOAN）
    const weeklyWage = target.wage || 20;
    const coverageAmt = Math.round(weeklyWage * (session.loanCoveragePercent / 100));
    dealControlsHtml = `
      ${(() => {
        const ovr = getPlayerOverallRating(target);
        const isStar = ovr >= 78;
        const isStarter = Boolean(target.isStarter && target.age >= 23 && target.age <= 30);
        const isLastY = Boolean(target.contractYears <= 1);
        if (isStar || isStarter || isLastY) {
          const reason = isStar ? '主力スター（OVR 78以上）' : (isStarter ? 'レギュラー先発陣' : '契約最終年');
          return `
            <div class="neg-feedback-box status-warn" style="margin-bottom: 12px; font-size: 11px;">
              <strong>レンタル獲得困難：</strong>主力選手のためレンタル不可となる可能性が高く、完全移籍での交渉を推奨します。
            </div>
          `;
        }
        return '';
      })()}
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">移籍金</span>
          <span class="neg-control-val accent-green">£0 (レンタル加入)</span>
        </div>

      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">週給負担率</span>
          <span class="neg-control-val accent-gold" id="neg-loan-coverage-display">${session.loanCoveragePercent}% (${formatWage(coverageAmt)})</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-loan-slider" class="neg-slider" min="50" max="100" step="5" value="${session.loanCoveragePercent}" ${session.completed ? 'disabled' : ''}>
          <span class="mono text-muted" style="font-size: 12px; width: 60px; text-align: right;">${session.loanCoveragePercent}%</span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">レンタル期間 & 買取オプション</span>
          <span class="mono accent-green"><strong>1シーズン</strong></span>
        </div>
        <div class="neg-clauses-grid" style="margin-top:6px;">
          <label class="neg-clause-item">
            <span>買取OP額</span>
            <select id="neg-buy-option-select" class="role-select" ${session.completed ? 'disabled' : ''}>
              <option value="0" ${!session.buyOptionFee ? 'selected' : ''}>設定なし</option>
              <option value="${Math.round(calculateTransferFee(target) * 0.9)}" ${session.buyOptionFee ? 'selected' : ''}>あり (${formatMoney(Math.round(calculateTransferFee(target) * 0.9))})</option>
            </select>
          </label>
        </div>
      </div>
    `;
  } else if (session.dealType === 'pre_contract') {
    // 事前合意（PRE-CONTRACT / ボスマン移籍）
    const yearsButtonsHtml = [2, 3, 4].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年契約
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">移籍金</span>
          <span class="neg-control-val accent-green">£0 (事前合意・移籍金なし)</span>
        </div>
        <div class="text-muted" style="font-size: 11px;">
          契約満了に伴うボスマンルールに基づき、クラブ間移籍金は不要です。
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">来季提示週給</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatWage(curOfferedWage)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''} title="単位：£1K/週">
        </div>
        <div class="text-muted" style="font-size: 11px; display: flex; justify-content: flex-end;">
          <span>合流時期: <strong class="accent-green">来季7月1日付で合流</strong></span>
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">来季契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  } else if (session.dealType === 'free_agent') {
    // 完全フリー（無所属選手）
    const yearsButtonsHtml = [1, 2, 3].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年契約
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">移籍金</span>
          <span class="neg-control-val accent-green">£0 (無所属・即時加入)</span>
        </div>
        <div class="text-muted" style="font-size: 11px;">
          所属クラブがないため移籍金£0で即時サイン可能です。
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示週給</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatWage(curOfferedWage)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''} title="単位：£1K/週">
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>
    `;
  } else {
    // 完全移籍 (BUY)
    const yearsButtonsHtml = [1, 2, 3, 4].map(yr => `
      <button type="button" class="btn-neg-year ${session.offeredYears === yr ? 'active' : ''}" data-neg-year="${yr}" ${session.completed ? 'disabled' : ''}>
        ${yr}年契約
      </button>
    `).join('');

    dealControlsHtml = `
      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示移籍金</span>
          <span class="neg-control-val" id="neg-offered-fee-display">${formatMoney(session.offeredFee)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-fee-slider" class="neg-slider" min="${minFee}" max="${maxFee}" step="100" value="${session.offeredFee}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-fee-input" class="neg-num-input" min="${minFee}" max="${maxFee}" step="100" value="${session.offeredFee}" ${session.completed ? 'disabled' : ''} title="単位：£1K (1000 = £1.0M)">
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示週給</span>
          <span class="neg-control-val" id="neg-offered-salary-display">${formatWage(curOfferedWage)}</span>
        </div>
        <div class="neg-slider-row">
          <input type="range" id="neg-salary-slider" class="neg-slider" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''}>
          <input type="number" id="neg-salary-input" class="neg-num-input" min="${minWage}" max="${maxWage}" step="1" value="${curOfferedWage}" ${session.completed ? 'disabled' : ''} title="単位：£1K/週">
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">提示契約年数</span>
          <span class="mono accent-green" id="neg-offered-years-display"><strong>${session.offeredYears}年契約</strong></span>
        </div>
        <div class="neg-years-group" id="neg-years-group">
          ${yearsButtonsHtml}
        </div>
      </div>

      <div class="neg-control-group">
        <div class="neg-control-header">
          <span class="neg-control-label">支払方法・契約条項</span>
        </div>
        <div class="neg-clauses-grid">
          <label class="neg-clause-item">
            <span>移籍金支払</span>
            <select id="neg-installment-select" class="role-select" ${session.completed ? 'disabled' : ''}>
              <option value="1" ${(session.installmentYears || 1) === 1 ? 'selected' : ''}>一括払い</option>
              <option value="2" ${session.installmentYears === 2 ? 'selected' : ''}>2年分割</option>
              <option value="3" ${session.installmentYears === 3 ? 'selected' : ''}>3年分割</option>
            </select>
          </label>
          <label class="neg-clause-item">
            <span>売却歩合</span>
            <select id="neg-sellon-select" class="role-select" ${session.completed ? 'disabled' : ''}>
              <option value="0" ${(session.sellOnPct || 0) === 0 ? 'selected' : ''}>なし (0%)</option>
              <option value="10" ${session.sellOnPct === 10 ? 'selected' : ''}>10%付与</option>
              <option value="20" ${session.sellOnPct === 20 ? 'selected' : ''}>20%付与</option>
            </select>
          </label>
          <label class="neg-clause-item">
            <span>約束序列</span>
            <select id="neg-status-select" class="role-select" ${session.completed ? 'disabled' : ''}>
              <option value="key" ${session.squadStatus === 'key' ? 'selected' : ''}>絶対的主力</option>
              <option value="first_team" ${(session.squadStatus || 'first_team') === 'first_team' ? 'selected' : ''}>レギュラー</option>
              <option value="rotation" ${session.squadStatus === 'rotation' ? 'selected' : ''}>ローテーション</option>
            </select>
          </label>
          <label class="neg-clause-item">
            <span>契約解除金</span>
            <select id="neg-clause-select" class="role-select" ${session.completed ? 'disabled' : ''}>
              <option value="0" ${!session.releaseClause ? 'selected' : ''}>設定なし</option>
              <option value="${Math.round(session.demandedFee * 1.5)}" ${session.releaseClause ? 'selected' : ''}>${formatMoney(Math.round(session.demandedFee * 1.5))}</option>
            </select>
          </label>
        </div>
      </div>
    `;
  }

  const safeBudgetVal = getSafeTransferBudget(playerClub);
  const budgetKvRowsHtml = `
    <div class="ui-kv-row">
      <div class="ui-kv-label" style="color:#ffffff;">クラブ資金</div>
      <div class="ui-kv-content mono" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; font-size:12px;">
        <strong style="color:#ffffff;">${formatMoney(playerClub.funds)}</strong>
        <span style="color:#cbd5e1;">登録 ${playerClub.players.length}/${MAX_SQUAD_SIZE}名</span>
      </div>
    </div>
    <div class="ui-kv-row">
      <div class="ui-kv-label accent-cyan-bar">安全予算枠</div>
      <div class="ui-kv-content mono" style="font-size:13px;">
        <strong class="${safeBudgetVal < 0 ? 'text-danger' : 'accent-green'}">${formatMoney(safeBudgetVal)}</strong>
      </div>
    </div>
  `;

  // 要求パネルの表示（上段：主要要求の2連数値プレート ＋ 下段：左見出し2カラム）
  let demandRowsHtml = '';
  if (isRenewal) {
    demandRowsHtml = `
      <div class="ui-plate-grid cols-2" style="margin-bottom:8px;">
        <div class="ui-stat-plate is-gold">
          <span class="ui-plate-label">要求週給</span>
          <span class="ui-plate-val accent-gold">${formatWage(curDemandedWage)}</span>
        </div>
        <div class="ui-stat-plate is-highlight">
          <span class="ui-plate-label">要求期間</span>
          <span class="ui-plate-val accent-green">${session.demandedYears}年</span>
        </div>
      </div>
      <div class="ui-kv-list">
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">現在契約</div>
          <div class="ui-kv-content mono" style="font-size:12px;">${formatWage(target.wage || Math.round((target.salary || 500) / 52))} · 残${target.contractYears || 0}年</div>
        </div>
        <div class="ui-kv-row">
          <div class="ui-kv-label">今季成績</div>
          <div class="ui-kv-content mono accent-green" style="font-size:12px;">${target.appearances}試合 · ${target.goals}G · OVR ${ovr}</div>
        </div>
        ${budgetKvRowsHtml}
      </div>
    `;
  } else if (session.dealType === 'loan') {
    demandRowsHtml = `
      <div class="ui-plate-grid cols-2" style="margin-bottom:8px;">
        <div class="ui-stat-plate is-gold">
          <span class="ui-plate-label">要求週給負担</span>
          <span class="ui-plate-val accent-gold">${session.demandedLoanCoverage}%+</span>
        </div>
        <div class="ui-stat-plate">
          <span class="ui-plate-label">選手現週給</span>
          <span class="ui-plate-val">${formatWage(target.wage)}</span>
        </div>
      </div>
      <div class="ui-kv-list">
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">取引種別</div>
          <div class="ui-kv-content mono accent-green" style="font-size:12px;">1シーズン レンタル · ${sellerClub ? sellerClub.name : '相手クラブ'}</div>
        </div>
        ${budgetKvRowsHtml}
      </div>
    `;
  } else if (session.dealType === 'pre_contract') {
    demandRowsHtml = `
      <div class="ui-plate-grid cols-2" style="margin-bottom:8px;">
        <div class="ui-stat-plate is-gold">
          <span class="ui-plate-label">要求週給</span>
          <span class="ui-plate-val accent-gold">${formatWage(curDemandedWage)}</span>
        </div>
        <div class="ui-stat-plate is-highlight">
          <span class="ui-plate-label">移籍金負担</span>
          <span class="ui-plate-val accent-green">£0</span>
        </div>
      </div>
      <div class="ui-kv-list">
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">契約状況</div>
          <div class="ui-kv-content mono" style="font-size:12px;">来季事前合意 · <span class="text-danger">今季満了</span></div>
        </div>
        ${budgetKvRowsHtml}
      </div>
    `;
  } else if (session.dealType === 'free_agent') {
    demandRowsHtml = `
      <div class="ui-plate-grid cols-2" style="margin-bottom:8px;">
        <div class="ui-stat-plate is-gold">
          <span class="ui-plate-label">希望週給</span>
          <span class="ui-plate-val accent-gold">${formatWage(curDemandedWage)}</span>
        </div>
        <div class="ui-stat-plate is-highlight">
          <span class="ui-plate-label">移籍金負担</span>
          <span class="ui-plate-val accent-green">£0</span>
        </div>
      </div>
      <div class="ui-kv-list">
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">所属状況</div>
          <div class="ui-kv-content mono accent-green" style="font-size:12px;">無所属 (即時加入可)</div>
        </div>
        ${budgetKvRowsHtml}
      </div>
    `;
  } else {
    demandRowsHtml = `
      <div class="ui-plate-grid cols-2" style="margin-bottom:8px;">
        <div class="ui-stat-plate is-gold">
          <span class="ui-plate-label">要求移籍金</span>
          <span class="ui-plate-val accent-gold">${formatMoney(session.demandedFee)}</span>
        </div>
        <div class="ui-stat-plate is-highlight">
          <span class="ui-plate-label">要求週給</span>
          <span class="ui-plate-val accent-green">${formatWage(curDemandedWage)}</span>
        </div>
      </div>
      <div class="ui-kv-list">
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">希望条件</div>
          <div class="ui-kv-content mono" style="font-size:12px;">${session.demandedYears}年契約${target.contractYears === 1 ? ' · <span class="accent-gold">現契約最終年</span>' : ''}</div>
        </div>
        ${budgetKvRowsHtml}
      </div>
    `;
  }

  const initWarn = computeNegotiationCashflowWarning(session, playerClub, target);
  let natRuleWarnHtml = '';
  if (!isRenewal && typeof evaluateClubNationalityRules === 'function') {
    const natEval = evaluateClubNationalityRules(playerClub);
    const isTargetU21 = typeof isPlayerU21Exempt === 'function' ? isPlayerU21Exempt(target) : ((target.age || 22) <= 21);
    const isTargetHg = typeof isPlayerHomegrown === 'function' ? isPlayerHomegrown(target) : (target.nationality === 'England');
    if (!isTargetU21) {
      const nextSenior = natEval.seniorCount + 1;
      const nextNonHg = natEval.nonHgCount + (isTargetHg ? 0 : 1);
      const warns = [];
      if (nextSenior > natEval.maxSenior) {
        warns.push(`25人シニア枠を超過します（加入後 ${nextSenior}/${natEval.maxSenior}名）`);
      }
      if (!isTargetHg && nextNonHg > natEval.maxNonHg) {
        warns.push(`外国籍（非HG）上限を超過します（加入後 ${nextNonHg}/${natEval.maxNonHg}名）`);
      }
      if (warns.length > 0) {
        natRuleWarnHtml = `<div class="nationality-rule-warning">登録枠超過注意：${warns.join(' / ')}。超過時は公式戦ベンチ枠が削減されます。</div>`;
      }
    }
  }
  const bodyEl = document.getElementById('neg-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      ${dealTypeTabsHtml}

      ${session.statusMessage ? `
        <div class="neg-feedback-box status-${session.statusType}" id="neg-feedback-box">
          ${session.statusMessage}
        </div>
      ` : ''}
      <div class="neg-cashflow-warning ${initWarn.isCritical ? 'is-critical' : ''} ${initWarn.visible ? '' : 'hidden'}" id="neg-cashflow-warning-box">${initWarn.text}</div>
      ${natRuleWarnHtml}

      <div class="neg-grid">
        <!-- 左：相手側（代理人・所属クラブ）の要求条件 -->
        <div class="neg-panel-box">
          <div class="neg-box-header">
            <span class="neg-box-title">${isRenewal ? '要求条件' : '相手側要求'}</span>
            <span class="neg-patience-badge ${patienceClass}">${patienceLabel}</span>
          </div>
          <div class="neg-demand-list">
            ${demandRowsHtml}
          </div>
        </div>

        <!-- 右：GM提示条件コントロール -->
        <div class="neg-panel-box">
          <div class="neg-box-header">
            <span class="neg-box-title">提示条件</span>
            <span class="mono text-muted" style="font-size: 10px;">GBP (£)</span>
          </div>

          ${dealControlsHtml}
        </div>
      </div>
    `;

    // 取引種別タブのイベント登録
    bodyEl.querySelectorAll('.btn-dealtype').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dType = e.currentTarget.dataset.dealType;
        session.dealType = dType;
        if (dType === 'loan') {
          session.offeredFee = 0;
        } else if (dType === 'pre_contract' || dType === 'free_agent') {
          session.offeredFee = 0;
        } else {
          session.offeredFee = session.demandedFee;
        }
        renderNegotiationModal();
      });
    });

    // レンタルスライダーのイベント登録
    const loanSlider = bodyEl.querySelector('#neg-loan-slider');
    if (loanSlider) {
      loanSlider.addEventListener('input', (e) => {
        session.loanCoveragePercent = parseInt(e.target.value, 10);
        const weeklyWage = target.wage || 20;
        const coverageAmt = Math.round(weeklyWage * (session.loanCoveragePercent / 100));
        const disp = document.getElementById('neg-loan-coverage-display');
        if (disp) disp.textContent = `${session.loanCoveragePercent}% (${formatWage(coverageAmt)})`;
      });
    }
  }

  const submitBtn = document.getElementById('btn-submit-neg-offer');
  const negFooterEl = document.getElementById('neg-modal-footer');
  if (submitBtn) {
    if (session.completed) {
      submitBtn.classList.add('hidden');
      if (negFooterEl) negFooterEl.classList.add('hidden');
    } else {
      submitBtn.classList.remove('hidden');
      if (negFooterEl) negFooterEl.classList.remove('hidden');
      if (isRenewal) {
        submitBtn.textContent = 'この条件で契約延長オファーを提示';
      } else if (session.dealType === 'loan') {
        submitBtn.textContent = 'この条件でレンタルオファーを提示';
      } else if (session.dealType === 'pre_contract') {
        submitBtn.textContent = 'この条件で来季事前合意オファーを提示';
      } else if (session.dealType === 'free_agent') {
        submitBtn.textContent = 'この条件で無所属獲得オファーを提示';
      } else {
        submitBtn.textContent = 'この条件で獲得オファーを提示';
      }
    }
  }
}

/**
 * 交渉モーダルで「オファー提示」をクリックした際の合意/保留/決裂判定ロジック
 */
function getTransferUpfrontAmount(fee, installmentYears = 1) {
  const numericFee = Math.max(0, Number(fee) || 0);
  const inst = Math.max(1, parseInt(installmentYears, 10) || 1);
  return inst > 1 ? Math.round(numericFee / inst) : numericFee;
}

function validateCpuSellerDeparture(sellerClub, target) {
  if (!sellerClub || sellerClub.isPlayer || sellerClub.isEuroVirtual || !Array.isArray(sellerClub.players)) {
    return { ok: true, reason: '' };
  }
  const activePlayers = sellerClub.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const remainingActive = activePlayers.filter(p => p.id !== target.id);
  if (remainingActive.length < 11) {
    return { ok: false, reason: `${sellerClub.name} は実働選手が11名未満になるため、この選手の放出を認められません。` };
  }
  if (target.pos === 'GK' && remainingActive.filter(p => p.pos === 'GK').length === 0) {
    return { ok: false, reason: `${sellerClub.name} は代替GKがいなくなるため、このGKの放出を認められません。` };
  }
  return { ok: true, reason: '' };
}

function applySellOnRightsOnSale(playerClub, target, grossFee) {
  const numericFee = Math.max(0, Number(grossFee) || 0);
  if (!Array.isArray(gameState.sellOnRights) || !target || numericFee <= 0) {
    return { netFee: numericFee, sellOnFee: 0, beneficiaryName: null };
  }
  const idx = gameState.sellOnRights.findIndex(r => r && r.playerId === target.id && (r.pct || 0) > 0);
  if (idx === -1) {
    return { netFee: numericFee, sellOnFee: 0, beneficiaryName: null };
  }
  const right = gameState.sellOnRights[idx];
  const pct = clamp(Number(right.pct) || 0, 0, 50);
  const sellOnFee = Math.round(numericFee * (pct / 100));
  const netFee = Math.max(0, numericFee - sellOnFee);
  gameState.sellOnRights.splice(idx, 1);
  if (target.contractClauses) {
    target.contractClauses.sellOnPct = 0;
  }

  let beneficiaryName = null;
  if (sellOnFee > 0 && right.beneficiaryClubId) {
    const benClub = typeof getClubById === 'function' ? getClubById(right.beneficiaryClubId) : null;
    if (benClub && !benClub.isPlayer) {
      benClub.funds = (benClub.funds || 0) + sellOnFee;
      beneficiaryName = benClub.name;
    } else if (typeof findEuropeanClubDefinitionById === 'function') {
      const euroBen = findEuropeanClubDefinitionById(right.beneficiaryClubId);
      if (euroBen) beneficiaryName = euroBen.name;
    }
  }
  if (sellOnFee > 0 && typeof addDailyLog === 'function') {
    addDailyLog(`【セルオン条項精算】${target.name} の移籍金 ${formatMoney(numericFee)} のうち ${pct}%（${formatMoney(sellOnFee)}）が ${beneficiaryName || '前所属クラブ'} へ分配されました（純手取り: ${formatMoney(netFee)}）。`);
  }
  return { netFee, sellOnFee, beneficiaryName };
}

function submitNegotiationOffer() {
  const session = gameState.negotiationSession;
  if (!session || session.completed) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  if (session.mode === 'renewal') {
    const target = playerClub.players.find(p => p.id === session.playerId);
    if (!target) return;

    const yearDiff = session.offeredYears - session.demandedYears;
    const yearAdjustment = yearDiff >= 0 ? 0.97 : (1 + Math.abs(yearDiff) * 0.04);
    const requiredSalary = Math.round(session.demandedSalary * yearAdjustment);

    if (session.offeredSalary >= requiredSalary) {
      const prevYears = target.contractYears || 0;
      const newContractYears = Math.min(5, prevYears + session.offeredYears);
      target.salary = session.offeredSalary;
      target.wage = Math.max(5, Math.round(session.offeredSalary / 52));
      target.contractYears = newContractYears;
      target.renewalFailCount = 0;
      target.demandedSalary = null;
      target.demandedYears = null;
      target.megaOfferRejected = false;
      target.contractRefused = false;

      session.completed = true;
      session.statusType = 'success';
      session.statusMessage = `【合意・契約更新完了】#${target.squadNumber || '-'} ${target.name} は提示条件（週給 ${formatWage(Math.max(5, Math.round(session.offeredSalary / 52)))} ／ ${session.offeredYears}年契約）に快く合意し、契約更新サインを完了しました！（残契約：${newContractYears}年）`;
      gameState.facilityFeedback = `【契約更新合意】#${target.squadNumber || '-'} ${target.name} と週給 ${formatWage(Math.max(5, Math.round(session.offeredSalary / 52)))}（${session.offeredYears}年契約締結 / 残り${newContractYears}年）で契約を更新しました。`;
      if (typeof addNewsItem === 'function') {
        addNewsItem({
          category: '選手',
          clubId: playerClub.id,
          playerId: target.id,
          headline: `${playerClub.name}、${target.name}と早期更新　契約をつないで次へ`,
          lead: `シーズン中に${newContractYears}年体制の契約で合意`,
          body: `${playerClub.name}は${target.pos} ${target.name}（${target.age}歳 / OVR ${getPlayerOverallRating(target)}）と週給 ${formatWage(target.wage)} で契約更新に合意。中核戦力の流出阻止に成功した。`,
          highlight: true
        });
      }
      renderNegotiationModal();
      renderAll();
      return;
    }

    target.renewalFailCount = (target.renewalFailCount || 0) + 1;
    session.failCount = target.renewalFailCount;

    if (target.renewalFailCount >= 2) {
      target.contractRefused = true;
      target.contractYears = Math.min(target.contractYears, 1);
      session.completed = true;
      session.statusType = 'error';
      session.statusMessage = `【交渉決裂・打ち切り】2度目の低額オファー（提示 ${formatWage(Math.max(5, Math.round(session.offeredSalary / 52)))}）に対し、#${target.squadNumber || '-'} ${target.name} 陣営が態度を硬化させ交渉打ち切りを通告しました。オフシーズンにフリー移籍での退団が確定しました。`;
      gameState.facilityFeedback = `【契約交渉決裂】#${target.squadNumber || '-'} ${target.name} との契約延長交渉が決裂しました（オフにフリー流出確定）。`;
    } else {
      const raisedSalary = Math.round((session.demandedSalary * 1.08) / 50) * 50;
      const raisedWage = Math.max(5, Math.round(raisedSalary / 52));
      target.demandedSalary = raisedSalary;
      session.demandedSalary = raisedSalary;
      session.offeredSalary = raisedSalary;
      session.offeredWage = raisedWage;
      session.statusType = 'warn';
      session.statusMessage = `【不満・保留（要求引き上げ ／ 残り交渉機会1回）】代理人：「提示額（${formatWage(Math.max(5, Math.round(session.offeredSalary / 52)))}）は当方の評価と乖離しています。」態度が硬化し、要求週給が ${formatWage(raisedWage)} へ引き上げられました。次回の提示で合意できない場合、交渉は決裂します。`;
    }

    renderNegotiationModal();
    renderAll();
    return;
  }

  // 移籍市場獲得交渉モード（mode === 'transfer'）
  const resolved = findTransferTargetWithSeller(session.playerId);
  const target = resolved ? resolved.player : null;
  const sellerClub = resolved ? resolved.sellerClub : null;
  if (!target) return;

  if (session.dealType !== 'pre_contract' && playerClub.players.length >= MAX_SQUAD_SIZE) {
    session.statusType = 'error';
    session.statusMessage = `【獲得不可】チームの登録上限（${MAX_SQUAD_SIZE}名）に達しているため獲得できません。先に選手を放出して枠を空けてください。`;
    renderNegotiationModal();
    return;
  }

  const dealType = session.dealType || 'buy';

  if (dealType === 'buy' || dealType === 'loan') {
    const sellerCheck = validateCpuSellerDeparture(sellerClub, target);
    if (!sellerCheck.ok) {
      session.statusType = 'error';
      session.statusMessage = `【交渉不可】${sellerCheck.reason}`;
      renderNegotiationModal();
      return;
    }
  }

  const instYearsReq = session.installmentYears || 1;
  const upfrontRequired = getTransferUpfrontAmount(session.offeredFee, instYearsReq);
  if (dealType === 'buy' && playerClub.funds < upfrontRequired) {
    session.statusType = 'error';
    const feeLabel = instYearsReq > 1
      ? `必要頭金（${formatMoney(upfrontRequired)} / ${instYearsReq}年分割）`
      : `提示移籍金（${formatMoney(session.offeredFee)}）`;
    session.statusMessage = `【資金不足】${feeLabel} が現在のクラブ資金（${formatMoney(playerClub.funds)}）を超えています。移籍金または支払方法を調整してください。`;
    renderNegotiationModal();
    return;
  }

  let willAgree = false;
  let rejectionReason = null;
  let demandedFee = session.demandedFee;
  let offeredFee = session.offeredFee;
  let offeredWage = session.offeredWage || Math.round(session.offeredSalary / 52) || 20;
  let demandedWage = session.demandedWage || Math.round(session.demandedSalary / 52) || 20;

  if (dealType === 'loan') {
    // レンタル交渉判定
    offeredFee = 0;
    demandedFee = 0;
    const ovr = getPlayerOverallRating(target);
    const isStarPlayer = ovr >= 78;
    const isKeyRegular = Boolean(target.isStarter && target.age >= 23 && target.age <= 30);
    const isExpiring = Boolean(target.contractYears <= 1);

    if (isStarPlayer || isKeyRegular || isExpiring) {
      // 主力・スター・契約最終年の選手は所属元クラブがレンタル放出を拒否
      willAgree = false;
      rejectionReason = isStarPlayer
        ? 'チームの絶対的主力選手（OVR78以上）のため、レンタル放出は一切認められません。'
        : (isKeyRegular
          ? '現在レギュラー先発陣として不可欠な戦力のため、レンタル放出は認められません。'
          : '契約最終年（残り1年以下）の選手のため、フリー流出防止の観点からレンタルは不可（完全移籍のみ）です。');
    } else {
      const requiredCoverage = session.demandedLoanCoverage || 85;
      willAgree = session.loanCoveragePercent >= requiredCoverage;
    }
  } else if (dealType === 'pre_contract') {
    // 事前合意判定
    offeredFee = 0;
    demandedFee = 0;
    const salaryYearFactor = session.offeredYears >= session.demandedYears ? 0.95 : 1.02;
    const requiredWage = Math.round(demandedWage * salaryYearFactor);
    willAgree = offeredWage >= requiredWage;
  } else if (dealType === 'free_agent') {
    // 無所属獲得判定
    offeredFee = 0;
    demandedFee = 0;
    const requiredWage = Math.round(demandedWage * 0.95);
    willAgree = offeredWage >= requiredWage;
  } else {
    // 完全移籍 (BUY)
    const feeThresholdFactor = target.contractYears === 1 ? 0.90 : 0.96;
    const requiredFee = Math.round(demandedFee * feeThresholdFactor);
    const salaryYearFactor = session.offeredYears >= session.demandedYears ? 0.95 : 1.02;
    const requiredWage = Math.round(demandedWage * salaryYearFactor);
    const clubAgreed = offeredFee >= requiredFee;
    const playerAgreed = offeredWage >= requiredWage;
    willAgree = clubAgreed && playerAgreed;
  }

  if (!Array.isArray(gameState.outgoingOffers)) gameState.outgoingOffers = [];
  
  const existingIdx = gameState.outgoingOffers.findIndex(o => o.playerId === target.id && (o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter'));
  const offerObj = {
    id: existingIdx !== -1 ? gameState.outgoingOffers[existingIdx].id : `out_${Date.now()}_${target.id}`,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.primaryPosition || target.preferredPosition || target.pos,
    playerAge: target.age,
    ovr: getPlayerOverallRating(target),
    squadNumber: target.squadNumber || 10,
    sellerClubId: sellerClub ? sellerClub.id : null,
    sellerClubName: sellerClub ? sellerClub.name : (target.isFreeAgent ? '無所属' : 'フリー'),
    dealType: dealType,
    loanCoveragePercent: session.loanCoveragePercent || 100,
    offeredFee: offeredFee,
    offeredWage: offeredWage,
    offeredYears: session.offeredYears,
    demandedFee: demandedFee,
    demandedWage: demandedWage,
    installmentYears: session.installmentYears || 1,
    sellOnPct: session.sellOnPct || 0,
    squadStatus: session.squadStatus || 'first_team',
    releaseClause: session.releaseClause || null,
    buyOptionFee: session.buyOptionFee || null,
    willAgree: willAgree,
    rejectionReason: rejectionReason,
    status: 'pending',
    pendingDays: 5,
    createdDayIndex: gameState.currentDayIndex,
    resolvedDayIndex: null
  };

  if (existingIdx !== -1) {
    gameState.outgoingOffers[existingIdx] = offerObj;
  } else {
    gameState.outgoingOffers.unshift(offerObj);
  }

  session.completed = true;
  session.statusType = 'info';

  let typeName = '獲得オファー';
  if (dealType === 'loan') typeName = 'レンタルオファー';
  else if (dealType === 'pre_contract') typeName = '事前合意オファー';
  else if (dealType === 'free_agent') typeName = '無所属獲得オファー';

  session.statusMessage = `【オファー送信完了】${offerObj.sellerClubName}へ ${target.name}の${typeName}を正式提示しました。約5日後に回答が届きます。`;
  addDailyLog(`【オファー提示】${offerObj.sellerClubName}の ${target.pos} ${target.name} へ${typeName}を送信しました（回答待ち）。`);

  closeNegotiationModal();
  updateMarketBadges();
  renderAll();
}

function updateOutgoingOffersExpiry() {
  if (!Array.isArray(gameState.outgoingOffers) || gameState.outgoingOffers.length === 0) return false;

  let hadResponseToday = false;
  const respondedItems = [];
  const curDay = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
  const isWindowOpenNow = curDay ? Boolean(curDay.windowOpen) : isTransferWindowCurrentlyOpen();

  for (const offer of gameState.outgoingOffers) {
    const dealType = offer.dealType || 'buy';
    const windowClosedForDeal = (dealType === 'buy' || dealType === 'loan') && !isWindowOpenNow;

    if (offer.status === 'agreed') {
      if (typeof offer.agreedDaysLeft !== 'number') offer.agreedDaysLeft = 5;
      offer.agreedDaysLeft -= 1;
      if (offer.agreedDaysLeft <= 0 || windowClosedForDeal) {
        offer.status = 'expired';
        offer.resolvedDayIndex = gameState.currentDayIndex;
        addDailyLog(`【オファー失効】${offer.sellerClubName} との ${offer.playerName} 獲得合意は契約確定期限${windowClosedForDeal ? '（移籍市場閉幕）' : ''}により失効しました。`);
      }
      continue;
    }

    if (offer.status === 'cpu_counter') {
      offer.pendingDays = (offer.pendingDays ?? 1) - 1;
      if (offer.pendingDays <= 0 || windowClosedForDeal) {
        offer.status = 'expired';
        offer.resolvedDayIndex = gameState.currentDayIndex;
        addDailyLog(`【逆提示失効】${offer.sellerClubName} からの ${offer.playerName} 増額提示は回答期限経過${windowClosedForDeal ? '（移籍市場閉幕）' : ''}により失効しました。`);
      }
      continue;
    }

    if (offer.status !== 'pending') continue;

    if (windowClosedForDeal) {
      offer.status = 'expired';
      offer.resolvedDayIndex = gameState.currentDayIndex;
      addDailyLog(`【オファー失効】移籍市場閉幕に伴い、${offer.sellerClubName} への ${offer.playerName} 獲得オファーは失効しました。`);
      continue;
    }

    offer.pendingDays = (offer.pendingDays || 1) - 1;
    if (offer.pendingDays <= 0) {
      offer.resolvedDayIndex = gameState.currentDayIndex;
      if (offer.willAgree) {
        offer.status = 'agreed';
        offer.agreedDaysLeft = 5;
        hadResponseToday = true;
        respondedItems.push({ offer, outcome: '合意', color: '#2ecc71', fee: offer.offeredFee });
        addDailyLog(`【オファー合意！】${offer.sellerClubName} および ${offer.playerName} が移籍条件（移籍金 ${formatMoney(offer.offeredFee)}）に合意しました！「オファー」タブより5日以内に契約を確定してください。`);
        if (typeof addInboxMessage === 'function') {
          addInboxMessage({
            senderType: 'board',
            senderName: '強化・移籍部門',
            title: `オファー合意：${offer.playerName}（${offer.sellerClubName}）`,
            body: `${offer.sellerClubName}および${offer.playerName}との条件交渉（移籍金 ${formatMoney(offer.offeredFee)}）が合意に達しました。5日以内にオファー一覧から正式契約を確定してください。`,
            actionType: 'goto-market-offers',
            actionLabel: 'オファー画面へ',
            actionPayload: 'outgoing'
          });
        }
      } else {
        // 相手クラブからの上乗せ逆オファー（条件吊り上げ）の判定
        // 相手が要求する移籍金が提示額以上の場合、50%の確率で「上乗せ提示（逆オファー）」を返してくる
        const canCounter = offer.demandedFee > offer.offeredFee && !offer.hasCountered;
        if (canCounter && Math.random() < 0.50) {
          offer.status = 'cpu_counter';
          offer.hasCountered = true;
          offer.counterFee = Math.round(Math.max(offer.demandedFee, offer.offeredFee * 1.2) / 100) * 100;
          offer.pendingDays = 3; // 逆オファーへの回答期限
          hadResponseToday = true;
          respondedItems.push({ offer, outcome: '増額要求', color: '#f59e0b', fee: offer.counterFee });
          addDailyLog(`【相手からの増額要求】${offer.sellerClubName} から ${offer.playerName} の移籍金引き上げ要求（${formatMoney(offer.counterFee)}）が届きました。「オファー」タブより承認または拒否を選択してください。`);
          if (typeof addInboxMessage === 'function') {
            addInboxMessage({
              senderType: 'board',
              senderName: '強化・移籍部門',
              title: `移籍金増額の逆提示：${offer.playerName}`,
              body: `${offer.sellerClubName}から${offer.playerName}の移籍金として ${formatMoney(offer.counterFee)} の逆提示が届きました。期限内に承認または拒否をご選択ください。`,
              actionType: 'goto-market-offers',
              actionLabel: 'オファー画面へ',
              actionPayload: 'outgoing'
            });
          }
        } else {
          offer.status = 'rejected';
          hadResponseToday = true;
          respondedItems.push({ offer, outcome: '決裂', color: '#ef4444', fee: offer.offeredFee });
          const reasonMsg = offer.rejectionReason ? `（理由: ${offer.rejectionReason}）` : '';
          addDailyLog(`【オファー決裂】${offer.sellerClubName} は ${offer.playerName} への${offer.dealType === 'loan' ? 'レンタルオファー' : 'オファー'}を拒絶しました。${reasonMsg}`);
          if (typeof addInboxMessage === 'function') {
            addInboxMessage({
              senderType: 'board',
              senderName: '強化・移籍部門',
              title: `交渉決裂：${offer.playerName}`,
              body: `${offer.sellerClubName}は${offer.playerName}へのオファーを拒絶しました。${reasonMsg}`,
              actionType: 'goto-market',
              actionLabel: '移籍市場へ',
              actionPayload: null
            });
          }
        }
      }
    }
  }

  if (hadResponseToday && respondedItems.length > 0 && typeof showSecretaryModal === 'function') {
    const rowsHtml = respondedItems.map(({ offer, outcome, color, fee }) => `
      <div class="gm-modal-flat-row">
        <span class="gm-modal-flat-label">${escapeCommHtml(offer.playerName)} (${escapeCommHtml(offer.sellerClubName)})</span>
        <span class="gm-modal-flat-val mono" style="color:${color};">${outcome} · ${formatMoney(fee)}</span>
      </div>
    `).join('');
    showSecretaryModal({
      topic: '移籍交渉回答',
      title: `獲得オファーの回答が届きました（${respondedItems.length}件）`,
      speech: '送信していた獲得オファーに対する相手クラブからの回答が届いております。オファー一覧より契約確定または再判断を行ってください。',
      detailHtml: `<div class="gm-modal-flat-list">${rowsHtml}</div>`,
      actions: [
        {
          label: 'オファー一覧を開く',
          className: 'btn btn-primary',
          onClick: () => {
            switchTab('market');
            switchMarketSubtab('offers');
            gameState.offersSubtab = 'outgoing';
            renderIncomingOffers();
          }
        },
        {
          label: '後で確認する',
          className: 'btn btn-secondary',
          onClick: () => { renderAll(); }
        }
      ]
    });
  }

  updateMarketBadges();
  return hadResponseToday;
}

/**
 * 相手クラブからの増額逆提示を承認して合意状態にする
 */
function acceptCpuCounterOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!Array.isArray(gameState.outgoingOffers)) return;

  const offer = gameState.outgoingOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'cpu_counter') return;

  const dealType = offer.dealType || 'buy';
  if ((dealType === 'buy' || dealType === 'loan') && !isTransferWindowCurrentlyOpen()) {
    offer.status = 'expired';
    alert('移籍ウィンドウ期間外のため、この交渉は失効しました。');
    updateMarketBadges();
    renderAll();
    return;
  }

  const playerClub = getPlayerClub();
  const upfrontCounter = getTransferUpfrontAmount(offer.counterFee, offer.installmentYears || 1);
  if (playerClub && playerClub.funds < upfrontCounter) {
    alert(`資金が不足しています（必要頭金: ${formatMoney(upfrontCounter)} / クラブ資金: ${formatMoney(playerClub.funds)}）`);
    return;
  }

  offer.offeredFee = offer.counterFee;
  offer.status = 'agreed';
  offer.agreedDaysLeft = 5;
  addDailyLog(`【増額要求受諾】${offer.sellerClubName} の提示条件（移籍金 ${formatMoney(offer.offeredFee)}）を受け入れ、獲得合意に達しました！5日以内に「契約を確定して加入」より正式契約を行ってください。`);
  updateMarketBadges();
  renderAll();
}

function completeOutgoingTransferSigning(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub || !Array.isArray(gameState.outgoingOffers)) return;

  const offer = gameState.outgoingOffers.find(o => o.id === offerId);
  if (!offer || offer.status !== 'agreed') return;

  const dealType = offer.dealType || 'buy';
  if ((dealType === 'buy' || dealType === 'loan') && !isTransferWindowCurrentlyOpen()) {
    offer.status = 'expired';
    alert('移籍ウィンドウ期間外のため、この合意は失効しました。');
    updateMarketBadges();
    renderAll();
    return;
  }

  if (dealType !== 'pre_contract' && playerClub.players.length >= MAX_SQUAD_SIZE) {
    alert(`チーム上限枠（${MAX_SQUAD_SIZE}名）に達しているため契約締結できません。選手を放出して枠を空けてください。`);
    return;
  }
  if (dealType === 'pre_contract') {
    const retainedCount = playerClub.players.filter(pl => pl && (pl.contractYears || 0) > 1 && !pl.preContractDeparture && !(pl.loanStatus && pl.loanStatus.isLoan)).length;
    const incomingPreCount = (gameState.preContractPlayers || []).length;
    if ((retainedCount + incomingPreCount) >= MAX_SQUAD_SIZE) {
      alert(`来季残留見込み選手と事前合意内定選手の合計が上限枠（${MAX_SQUAD_SIZE}名）に達しているため締結できません。`);
      return;
    }
  }

  const upfrontFeeRequired = getTransferUpfrontAmount(offer.offeredFee, offer.installmentYears || 1);
  if (dealType === 'buy' && playerClub.funds < upfrontFeeRequired) {
    alert(`頭金（${formatMoney(upfrontFeeRequired)}）に対して資金が不足しています（現在資金: ${formatMoney(playerClub.funds)}）。`);
    return;
  }

  // 対象選手を相手クラブ・欧州リスト・無所属市場から一元取得
  const resolved = findTransferTargetWithSeller(offer.playerId);
  let target = resolved ? resolved.player : null;
  let sellerClub = resolved ? resolved.sellerClub : null;
  if (!sellerClub && offer.sellerClubId) {
    sellerClub = getClubById(offer.sellerClubId) || (typeof findEuropeanClubDefinitionById === 'function' ? findEuropeanClubDefinitionById(offer.sellerClubId) : null);
  }

  if (!target) {
    alert('対象選手が見つかりませんでした。');
    offer.status = 'cancelled';
    renderAll();
    return;
  }

  if (dealType === 'buy' || dealType === 'loan') {
    const sellerCheck = validateCpuSellerDeparture(sellerClub, target);
    if (!sellerCheck.ok) {
      alert(sellerCheck.reason);
      offer.status = 'cancelled';
      updateMarketBadges();
      renderAll();
      return;
    }
  }

  if (dealType === 'pre_contract') {
    // 事前合意（来季加入内定）
    if (!Array.isArray(gameState.preContractPlayers)) gameState.preContractPlayers = [];
    
    target.preContract = {
      toClubId: playerClub.id,
      toClubName: playerClub.name,
      effectiveSeason: (gameState.season || 1) + 1,
      wage: offer.offeredWage,
      salary: offer.offeredWage * 52,
      contractYears: offer.offeredYears
    };

    if (!gameState.preContractPlayers.some(p => p.id === target.id)) {
      gameState.preContractPlayers.push(target);
    }

    if (gameState.targetShortlist) {
      gameState.targetShortlist = gameState.targetShortlist.filter(id => id !== target.id);
    }

    offer.status = 'signed';
    addDailyLog(`【事前合意締結完了】${target.pos} ${target.name} と来シーズンの事前合意（ボスマン移籍）を締結しました！来季7月1日付で正式合流（[内定済]）となります。`);
    updateMarketBadges();
    renderAll();
    return;
  }

  // レンタル・完全移籍・無所属獲得の処理
  const originSellerName = (sellerClub && sellerClub.name && !sellerClub.name.includes('無所属'))
    ? sellerClub.name
    : (target.lastClubName || null);
  const cleanupMarketPools = (pid) => {
    if (Array.isArray(gameState.transferMarket)) {
      gameState.transferMarket = gameState.transferMarket.filter(p => p.id !== pid);
    }
    if (Array.isArray(gameState.euroTransferList)) {
      gameState.euroTransferList = gameState.euroTransferList.filter(p => p.id !== pid);
    }
  };

  if (dealType === 'buy') {
    if (originSellerName && !Array.isArray(target.seasonHistory)) {
      ensurePlayerHistoryAndCareer(target, originSellerName);
    }
    const instYears = offer.installmentYears || 1;
    const upfrontFee = instYears > 1 ? Math.round(offer.offeredFee / instYears) : offer.offeredFee;
    playerClub.funds -= upfrontFee;
    if (typeof ensureMonthlyLedger === 'function') {
      ensureMonthlyLedger().transferOutFee += upfrontFee;
    }
    if (instYears > 1) {
      if (!Array.isArray(gameState.installments)) gameState.installments = [];
      gameState.installments.push({
        id: `inst_${Date.now()}_${target.id}`,
        direction: 'out',
        counterClubId: sellerClub ? sellerClub.id : 'EXT',
        playerName: target.name,
        amountPerSeason: Math.round((offer.offeredFee - upfrontFee) / (instYears - 1)),
        remainingSeasons: instYears - 1
      });
    }
    if ((offer.sellOnPct || 0) > 0 && sellerClub) {
      if (!Array.isArray(gameState.sellOnRights)) gameState.sellOnRights = [];
      gameState.sellOnRights.push({
        playerId: target.id,
        playerName: target.name,
        beneficiaryClubId: sellerClub.id,
        pct: offer.sellOnPct
      });
    }
    if (sellerClub && !sellerClub.isEuroVirtual && Array.isArray(sellerClub.players)) {
      sellerClub.funds = (sellerClub.funds || 0) + offer.offeredFee;
      sellerClub.players = sellerClub.players.filter(p => p.id !== target.id);
      ensureValidSquadAndStarters(sellerClub);
      if (typeof autoSelectStarters === 'function') {
        autoSelectStarters(sellerClub);
      }
    }
    cleanupMarketPools(target.id);
    target.isEuroListed = false;
    target.euroClubId = null;
    target.clubId = playerClub.id;
    target.wage = offer.offeredWage;
    target.salary = offer.offeredWage * 52;
    target.contractYears = offer.offeredYears;
    target.loanStatus = null;
    target.squadStatus = offer.squadStatus || 'first_team';
    target.adaptationDays = 35;
    target.morale = 82;
    target.contractClauses = {
      releaseClause: offer.releaseClause || null,
      appearanceBonus: Math.max(1, Math.round(target.wage * 0.1)),
      goalBonus: Math.max(1, Math.round(target.wage * 0.15)),
      sellOnPct: offer.sellOnPct || 0
    };
  } else if (dealType === 'loan') {
    // レンタル加入
    if (originSellerName && !Array.isArray(target.seasonHistory)) {
      ensurePlayerHistoryAndCareer(target, originSellerName);
    }
    if (sellerClub && !sellerClub.isEuroVirtual && Array.isArray(sellerClub.players)) {
      sellerClub.players = sellerClub.players.filter(p => p.id !== target.id);
      ensureValidSquadAndStarters(sellerClub);
      if (typeof autoSelectStarters === 'function') {
        autoSelectStarters(sellerClub);
      }
    }
    cleanupMarketPools(target.id);
    target.isEuroListed = false;
    const weeklyWage = target.wage || 20;
    const origYears = Math.max(1, target.contractYears || 2);
    const coveragePercent = offer.loanCoveragePercent || 100;
    target.wage = Math.max(5, Math.round(weeklyWage * (coveragePercent / 100)));
    target.adaptationDays = 25;
    target.loanTerms = {
      parentClubId: sellerClub ? sellerClub.id : 'EXT',
      buyOptionFee: offer.buyOptionFee || null,
      buyObligation: false,
      originalWage: weeklyWage,
      originalContractYears: origYears
    };
    target.salary = target.wage * 52;
    target.contractYears = 1;
    target.loanStatus = {
      isLoan: true,
      fromClubId: sellerClub ? sellerClub.id : null,
      fromClubName: sellerClub ? sellerClub.name : '相手クラブ',
      isFromEuroClub: Boolean(sellerClub && sellerClub.isEuroVirtual),
      returnYear: (gameState.season || 1) + 1,
      wageCoverage: coveragePercent,
      originalWage: weeklyWage,
      originalContractYears: origYears
    };
  } else if (dealType === 'free_agent') {
    // 無所属獲得
    ensurePlayerHistoryAndCareer(target, '無所属 (Free Agent)');
    cleanupMarketPools(target.id);
    target.isEuroListed = false;
    target.euroClubId = null;
    target.clubId = playerClub.id;
    target.wage = offer.offeredWage;
    target.salary = offer.offeredWage * 52;
    target.contractYears = offer.offeredYears;
    target.loanStatus = null;
    target.isFreeAgent = false;
    target.signedFromFreeAgent = true;
    target.signedFreeAgentYear = 2025 + (gameState.season || 1) + (gameState.isSeasonOver ? 1 : 0);
  }

  if (gameState.isSeasonOver) {
    const curS = gameState.season || 1;
    const curBaseYr = 2025 + curS;
    const curYearStr = `${curBaseYr}-${String((curBaseYr + 1) % 100).padStart(2, '0')}`;
    target._joinedInOffseasonOfSeason = curS;
    if (originSellerName && !originSellerName.includes('無所属')) {
      target.lastClubName = originSellerName;
    }
    const prevClubForHist = target.lastClubName || (typeof pickFormerClubForPlayer === 'function' ? pickFormerClubForPlayer(target, 0) : 'リーズ・U');
    if (!Array.isArray(target.seasonHistory)) {
      ensurePlayerHistoryAndCareer(target, originSellerName || '無所属 (Free Agent)');
    }
    if (!target.seasonHistory.some(r => r && r.seasonYear === curYearStr)) {
      const ovr = getPlayerOverallRating(target);
      const pos = target.primaryPosition || target.pos || 'CM';
      const hadApps = (target.appearances || 0) > 0;
      const estApps = hadApps ? target.appearances : randInt(16, 30);
      const gRate = pos === 'CF' ? 0.35 : (['LW', 'RW', 'AM'].includes(pos) ? 0.22 : (pos === 'GK' ? 0 : 0.08));
      const aRate = pos === 'GK' ? 0 : (['AM', 'LW', 'RW', 'LM', 'RM'].includes(pos) ? 0.18 : 0.08);
      const estGoals = hadApps ? (target.goals || 0) : (pos === 'GK' ? 0 : Math.round(estApps * gRate));
      const estAssists = hadApps ? (target.assists || 0) : (pos === 'GK' ? 0 : Math.round(estApps * aRate));
      const estRating = (hadApps && target.totalRating > 0)
        ? (target.totalRating / target.appearances).toFixed(2)
        : clamp(6.5 + (ovr - 68) * 0.04, 6.2, 8.2).toFixed(2);
      target.seasonHistory.push({
        seasonYear: curYearStr,
        clubName: prevClubForHist,
        age: target.age || 24,
        appearances: estApps,
        goals: estGoals,
        assists: estAssists,
        avgRating: estRating,
        ovr
      });
    }
  }

  target.isStarter = false;
  target.assignedPos = null;
  target.slotIndex = null;
  target.transferFailCount = 0;
  target.negotiationFailed = false;

  const usedNumbers = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
  target.squadNumber = pickAvailableSquadNumber(target.pos, usedNumbers);

  playerClub.players.push(target);
  ensureValidSquadAndStarters(playerClub);

  if (gameState.targetShortlist) {
    gameState.targetShortlist = gameState.targetShortlist.filter(id => id !== target.id);
  }

  offer.status = 'signed';

  if (dealType === 'loan') {
    addDailyLog(`【レンタル加入】${target.pos} #${target.squadNumber} ${target.name} が1年間の期限付き移籍（レンタル）で加入！週給負担率: ${offer.loanCoveragePercent}%。`);
    if (typeof addNewsItem === 'function') {
      addNewsItem({
        category: '移籍',
        clubId: playerClub.id,
        playerId: target.id,
        headline: `${playerClub.name}、${target.name}を期限付き獲得　選手層の拡充へ`,
        lead: `${offer.sellerClubName || '他クラブ'}から1年レンタルで加入`,
        body: `${playerClub.name}は${offer.sellerClubName || '相手クラブ'}から${target.name}（${target.age}歳）の1年間レンタル加入を正式発表した。`,
        highlight: true
      });
    }
  } else if (dealType === 'free_agent') {
    addDailyLog(`【無所属獲得】${target.pos} #${target.squadNumber} ${target.name} が移籍金£0で正式加入！背番号は #${target.squadNumber} です。`);
    if (typeof addNewsItem === 'function') {
      addNewsItem({
        category: '移籍',
        clubId: playerClub.id,
        playerId: target.id,
        headline: `${playerClub.name}が${target.name}を完全移籍で獲得　移籍金ゼロの補強`,
        lead: `フリーエージェント市場から実力者を確保`,
        body: `${playerClub.name}は無所属だった${target.name}（OVR ${getPlayerOverallRating(target)}）を移籍金なしで獲得した。`,
        highlight: true
      });
    }
  } else {
    addDailyLog(`【新戦力加入】${target.pos} #${target.squadNumber} ${target.name} と正式契約を締結！背番号は #${target.squadNumber} です。`);
    if (typeof addNewsItem === 'function') {
      addNewsItem({
        category: '移籍',
        clubId: playerClub.id,
        playerId: target.id,
        headline: `${playerClub.name}が${target.name}を電撃獲得　${formatMoney(offer.offeredFee)}の投資`,
        lead: `${offer.sellerClubName || '相手クラブ'}との交渉が正式合意`,
        body: `${playerClub.name}は${offer.sellerClubName || '相手クラブ'}から${target.name}（${target.age}歳 / OVR ${getPlayerOverallRating(target)}）の完全移籍加入を完了した。`,
        highlight: true
      });
    }
  }

  if (typeof checkAndRewardManagerWishOnSigning === 'function') {
    checkAndRewardManagerWishOnSigning(target, dealType);
  }

  updateMarketBadges();
  renderAll();
}

/**
 * 送信オファーの撤回・キャンセル
 */
function cancelOutgoingOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!Array.isArray(gameState.outgoingOffers)) return;

  const offer = gameState.outgoingOffers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'cancelled';
  addDailyLog(`【オファー撤回】${offer.sellerClubName}の ${offer.playerName} に対するオファーを撤回しました。`);
  updateMarketBadges();
  renderAll();
}


function triggerIncomingTransferOffer(force = false) {
  const playerClub = getPlayerClub();
  if (!playerClub || playerClub.players.length <= 11) return false;
  if (!Array.isArray(gameState.incomingOffers)) gameState.incomingOffers = [];
  if (!Array.isArray(gameState.outgoingOffers)) gameState.outgoingOffers = [];
  if (!gameState.offersSubtab) gameState.offersSubtab = 'incoming';
  if (gameState.incomingOffers.length >= 6) return false;

  const currentDay = getCurrentCalendarDay();
  if (!force) {
    if (!currentDay || !currentDay.windowOpen) return false;
    // 移籍期間中、1日あたり約14%の確率でオファー発生
    if (Math.random() > 0.14) return false;
  }

  // オファー対象候補：自クラブ所有の現役選手（レンタル加入・レンタル放出中は除外）
  const candidates = [...playerClub.players].filter(p => p && !p.isRetired && !(p.loanStatus && (p.loanStatus.isLoan || p.loanStatus.isLoanOut)));
  if (candidates.length === 0) return false;

  // 既にオファー受信中の選手は除外
  const existingPlayerIds = new Set(gameState.incomingOffers.map(o => o.playerId));
  const availableCandidates = candidates.filter(p => !existingPlayerIds.has(p.id));
  if (availableCandidates.length === 0) return false;

  availableCandidates.sort((a, b) => {
    const scoreA = getPlayerOverallRating(a) * 1.5 + (a.goals || 0) * 4 + (a.age <= 23 ? 10 : 0);
    const scoreB = getPlayerOverallRating(b) * 1.5 + (b.goals || 0) * 4 + (b.age <= 23 ? 10 : 0);
    return scoreB - scoreA;
  });

  const pickPool = availableCandidates.slice(0, Math.min(6, availableCandidates.length));
  const target = pickPool[randInt(0, pickPool.length - 1)];
  if (!target) return false;

  // 買い手クラブ（35%で海外メガクラブ、65%で国内他19クラブ）
  let buyerClubName = '';
  let buyerClubCountry = 'イングランド';
  let buyerClubId = null;
  let isMegaClub = false;

  const otherClubs = gameState.clubs.filter(c => !c.isPlayer);
  if (Math.random() < 0.35 && gameState.europeanMegaClubs && gameState.europeanMegaClubs.length > 0) {
    isMegaClub = true;
    const mega = gameState.europeanMegaClubs[randInt(0, gameState.europeanMegaClubs.length - 1)];
    buyerClubName = mega.name;
    buyerClubCountry = mega.country;
  } else if (otherClubs.length > 0) {
    const cpuClub = otherClubs[randInt(0, otherClubs.length - 1)];
    buyerClubName = cpuClub.name;
    buyerClubCountry = 'イングランド';
    buyerClubId = cpuClub.id;
  } else {
    buyerClubName = 'レアル・マドリード';
    buyerClubCountry = 'スペイン';
    isMegaClub = true;
  }

  const marketVal = calculatePlayerMarketValue(target);
  const isExpiring = (target.contractYears !== undefined ? target.contractYears : 2) <= 1;
  // オファー額算出：通常は市場価値の 0.90倍〜1.35倍。契約残り1年の場合は手堅く0.78倍〜0.92倍（タダ同然の半額は防止）
  const multiplier = isExpiring
    ? (0.78 + Math.random() * 0.14) // 0.78..0.92（市場価値ベースで手堅いオファー）
    : (0.90 + Math.random() * 0.45); // 0.90..1.35
  const baseValue = calculateTransferFee(target);
  let offerFee = Math.round((marketVal * multiplier) / 100) * 100;
  offerFee = clamp(offerFee, 300, 120000); // 最小300k、最大120M
  const counterFee = clamp(Math.round((offerFee * 1.18) / 100) * 100, offerFee + 200, 125000);

  const newOffer = {
    id: 'offer-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    buyerClubName,
    buyerClubCountry,
    buyerClubId,
    isMegaClub,
    playerId: target.id,
    playerName: target.name,
    playerPos: target.pos,
    squadNumber: target.squadNumber || '-',
    playerAge: target.age,
    ovr: getPlayerOverallRating(target),
    wage: target.wage || Math.round((target.salary || 1000) / 52),
    preferredFoot: target.preferredFoot || 'Right',
    baseFee: baseValue,
    offerFee,
    counterFee,
    daysLeft: 5, // 回答期限: 残り5日
    dateStr: currentDay ? currentDay.formattedDate : '',
    status: 'pending'
  };

  gameState.incomingOffers.push(newOffer);
  stopAdvancingCalendar();
  addDailyLog(`【オファー着信】${buyerClubName} から ${target.pos} #${target.squadNumber || '-'} ${target.name} に対し 移籍金${formatMoney(offerFee)} の獲得打診（回答期限: 5日）`);
  if (typeof addInboxMessage === 'function') {
    addInboxMessage({
      senderType: 'board',
      senderName: '強化・移籍部門',
      title: `買取オファー着信：${target.name}（${buyerClubName}）`,
      body: `${buyerClubName}から${target.pos} ${target.name}（OVR ${newOffer.ovr}）に対し、移籍金 ${formatMoney(offerFee)} の正式オファーが届きました。回答期限は5日間です。`,
      actionType: 'goto-market-offers',
      actionLabel: 'オファーを確認',
      actionPayload: 'incoming'
    });
  }
  if (typeof showSecretaryModal === 'function') {
    showSecretaryModal({
      topic: '買取オファー着信',
      title: `${buyerClubName}から ${target.name} への獲得オファー`,
      speech: `${buyerClubName}より当クラブ所属の ${target.pos} ${target.name}（OVR ${newOffer.ovr}）に対して正式な買取打診が届いております。回答期限は5日間です。`,
      detailHtml: `
        <div class="gm-modal-flat-list">
          <div class="gm-modal-flat-row"><span class="gm-modal-flat-label">対象選手</span><span class="gm-modal-flat-val">${escapeCommHtml(target.pos)} #${target.squadNumber || '-'} ${escapeCommHtml(target.name)} (OVR ${newOffer.ovr})</span></div>
          <div class="gm-modal-flat-row"><span class="gm-modal-flat-label">提示移籍金</span><span class="gm-modal-flat-val accent-gold mono">${formatMoney(offerFee)}</span></div>
        </div>
      `,
      actions: [
        {
          label: 'オファー画面で確認する',
          className: 'btn btn-primary',
          onClick: () => {
            switchTab('market');
            switchMarketSubtab('offers');
            gameState.offersSubtab = 'incoming';
            renderIncomingOffers();
          }
        },
        {
          label: '後で検討する',
          className: 'btn btn-secondary',
          onClick: () => { renderAll(); }
        }
      ]
    });
  }
  updateMarketBadges();
  renderAll();
  return true;
}

/**
 * 日付進行時に受信オファーの回答期限を更新
 */
function updateIncomingOffersExpiry() {
  if (!gameState.incomingOffers || gameState.incomingOffers.length === 0) return false;
  const expired = [];
  const active = [];
  let hadResponseToday = false;

  for (const offer of gameState.incomingOffers) {
    // 上乗せ交渉中のオファーに対する相手クラブの回答判定
    if (offer.status === 'negotiating') {
      offer.pendingDays = (offer.pendingDays || 1) - 1;
      if (offer.pendingDays <= 0) {
        hadResponseToday = true;
        // 成否: 要求額の比率に応じた合意確率 (1.3倍以下なら65%、以上なら35%)
        const ratio = (offer.demandedFee || offer.counterFee) / offer.offerFee;
        const successRate = ratio <= 1.3 ? 0.65 : 0.35;
        const isAgreed = Math.random() < successRate;

        if (isAgreed) {
          offer.status = 'counter_agreed';
          offer.offerFee = offer.demandedFee || offer.counterFee;
          offer.daysLeft = offer.isMegaOfferEvent ? Math.max(offer.daysLeft || 7, 7) : 3; // 合意後、回答期限3日
          if (offer.isMegaOfferEvent && gameState.pendingMegaOffer && gameState.pendingMegaOffer.linkedOfferId === offer.id) {
            gameState.pendingMegaOffer.offerAmount = offer.offerFee;
          }
          addDailyLog(`【上乗せ合意！】${offer.buyerClubName} が ${offer.playerName} の要求移籍金 ${formatMoney(offer.offerFee)} を受け入れました！`);
          active.push(offer);
        } else {
          // 決裂・相手撤退（履歴として残す）
          offer.status = 'counter_rejected';
          if (offer.isMegaOfferEvent && gameState.pendingMegaOffer && gameState.pendingMegaOffer.linkedOfferId === offer.id) {
            gameState.pendingMegaOffer = null;
          }
          addDailyLog(`【交渉決裂】${offer.buyerClubName} は ${offer.playerName} の増額要求に応じずオファーを撤回しました。`);
          active.push(offer);
        }
        continue;
      } else {
        active.push(offer);
        continue;
      }
    }

    if (offer.status === 'pending' || offer.status === 'counter_agreed') {
      if (offer.isMegaOfferEvent && gameState.pendingMegaOffer && gameState.pendingMegaOffer.linkedOfferId === offer.id) {
        offer.daysLeft = Math.max(offer.daysLeft || 7, 7);
        active.push(offer);
        continue;
      }
      offer.daysLeft -= 1;
      if (offer.daysLeft <= 0) {
        offer.status = 'expired';
        expired.push(offer);
        active.push(offer); // 履歴として残す
      } else {
        active.push(offer);
      }
    } else {
      active.push(offer); // 既に完了・破棄された履歴
    }
  }
  gameState.incomingOffers = active;
  for (const exp of expired) {
    addDailyLog(`【オファー期限切れ】${exp.buyerClubName} からの ${exp.playerName} への移籍打診は回答期限切れとなりました。`);
  }
  updateMarketBadges();
  return hadResponseToday;
}


/**
 * 受信オファー受諾・逆提示合意時の退団可否（レンタル放出中除外・最低11名＆GK必須）を検証する
 */
function validatePlayerDeparture(playerClub, target, { isLoanTransfer = false } = {}) {
  if (!playerClub || !target || target.isRetired) {
    return { ok: false, reason: '対象選手が在籍していません。' };
  }
  if (target.loanStatus && target.loanStatus.isLoan) {
    return { ok: false, reason: '他クラブから期限付き移籍（レンタル加入）中の選手は売却・再レンタルできません。' };
  }
  const isCurrentlyLoanedOut = Boolean(target.loanStatus && target.loanStatus.isLoanOut);
  if (isLoanTransfer && isCurrentlyLoanedOut) {
    return { ok: false, reason: 'この選手はすでに他クラブへレンタル放出中です。' };
  }
  if (!isCurrentlyLoanedOut) {
    const activePlayers = (playerClub.players || []).filter(
      p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut)
    );
    const remainingActive = activePlayers.filter(p => p.id !== target.id);
    if (remainingActive.length < 11) {
      return { ok: false, reason: '実働選手（レンタル放出中を除く）が11名未満になるため、これ以上選手を放出できません。' };
    }
    if (target.pos === 'GK' && remainingActive.filter(p => p.pos === 'GK').length === 0) {
      return { ok: false, reason: '実働GKがいなくなるため、このGKを放出できません。' };
    }
  }
  return { ok: true, reason: '' };
}

/**
 * 同一選手に対する他の未処理オファーを取り消す
 */
function cancelOtherIncomingOffersForPlayer(playerId, exceptOfferId = null, { clearModalOffers = true } = {}) {
  if (Array.isArray(gameState.incomingOffers)) {
    gameState.incomingOffers.forEach(o => {
      if (o && o.id !== exceptOfferId && o.playerId === playerId && (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed')) {
        o.status = 'cancelled';
      }
    });
  }
  if (clearModalOffers) {
    if (gameState.pendingMegaOffer && gameState.pendingMegaOffer.playerId === playerId) {
      gameState.pendingMegaOffer = null;
    }
    if (gameState.incomingTransferOffer && gameState.incomingTransferOffer.playerId === playerId) {
      gameState.incomingTransferOffer = null;
    }
  }
}

/**
 * 完全移籍売却の資金・所属更新を共通実行する
 */
function completeIncomingSaleToBuyer(playerClub, target, buyerClubId, fee, wageMultiplier = 1.3) {
  const numericFee = Math.max(0, Number(fee) || 0);
  const { netFee } = applySellOnRightsOnSale(playerClub, target, numericFee);
  playerClub.funds += netFee;
  if (typeof ensureMonthlyLedger === 'function') {
    ensureMonthlyLedger().transferInFee += netFee;
  }
  playerClub.players = playerClub.players.filter(p => p.id !== target.id);

  if (buyerClubId) {
    const buyer = typeof getClubById === 'function'
      ? getClubById(buyerClubId)
      : (Array.isArray(gameState.clubs) ? gameState.clubs.find(c => c.id === buyerClubId) : null);
    if (buyer && !buyer.isPlayer) {
      buyer.funds = Math.max(0, (buyer.funds || 0) - numericFee);
      target.isStarter = false;
      target.isBench = false;
      target.assignedPos = null;
      target.slotIndex = null;
      target.loanStatus = null;
      target.isLoanListed = false;
      target.transferListed = false;
      target.contractYears = 4;
      target.wage = Math.max(10, Math.round((target.wage || 20) * wageMultiplier));
      target.salary = target.wage * 52;
      const buyerLimit = typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50;
      if (Array.isArray(buyer.players) && buyer.players.length < buyerLimit && !buyer.players.some(p => p.id === target.id)) {
        buyer.players.push(target);
      }
      ensureValidSquadAndStarters(buyer);
      if (typeof autoSelectStarters === 'function') {
        autoSelectStarters(buyer);
      }
    }
  }
  ensureValidSquadAndStarters(playerClub);
}

function acceptIncomingOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.incomingOffers) return;

  const idx = gameState.incomingOffers.findIndex(o => o.id === offerId);
  if (idx === -1) return;
  const offer = gameState.incomingOffers[idx];
  if (offer.status !== 'pending' && offer.status !== 'counter_agreed') return;

  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (!target) {
    offer.status = 'cancelled';
    updateMarketBadges();
    renderAll();
    return;
  }

  const check = validatePlayerDeparture(playerClub, target, { isLoanTransfer: Boolean(offer.isLoanOffer) });
  if (!check.ok) {
    if (target.loanStatus && (target.loanStatus.isLoan || (offer.isLoanOffer && target.loanStatus.isLoanOut))) {
      offer.status = 'cancelled';
      updateMarketBadges();
      renderAll();
    }
    alert(check.reason);
    return;
  }

  // レンタル打診（レンタル）の場合
  if (offer.isLoanOffer) {
    target.loanStatus = {
      isLoanOut: true,
      toClubId: offer.buyerClubId || null,
      toClubName: offer.buyerClubName,
      returnYear: (gameState.season || 1) + 1
    };
    target.isStarter = false;
    target.isBench = false;
    target.assignedPos = null;
    target.slotIndex = null;
    target.isLoanListed = false;
    target.positionTraining = null;
    offer.status = 'accepted';
    cancelOtherIncomingOffersForPlayer(target.id, offer.id, { clearModalOffers: false });
    ensureValidSquadAndStarters(playerClub);

    addDailyLog(`【レンタル放出】#${target.squadNumber || '-'} ${target.name} が ${offer.buyerClubName} への1年間期限付き移籍（レンタル放出）へ旅立ちました！給与は全額相手負担で、シーズン終了後に急成長して復帰します。`);
    updateMarketBadges();
    renderAll();
    return;
  }

  // 通常売却確定処理
  const saleFee = offer.offerFee || offer.counterFee || 0;
  completeIncomingSaleToBuyer(playerClub, target, offer.buyerClubId, saleFee, 1.3);

  // 履歴としてステータス更新・他オファー取り消し
  offer.status = 'accepted';
  if (offer.isMegaOfferEvent && gameState.pendingMegaOffer && (gameState.pendingMegaOffer.linkedOfferId === offer.id || gameState.pendingMegaOffer.playerId === target.id)) {
    gameState.pendingMegaOffer = null;
  }
  cancelOtherIncomingOffersForPlayer(target.id, offer.id);

  addDailyLog(`【移籍成立】${target.name} を ${offer.buyerClubName} へ売却しました（移籍金: ${formatMoney(saleFee)}）。`);
  if (typeof addNewsItem === 'function') {
    addNewsItem({
      category: '移籍',
      clubId: playerClub.id,
      playerId: target.id,
      headline: `${playerClub.name}、${target.name}を${offer.buyerClubName}へ放出　資金を確保`,
      lead: `移籍金 ${formatMoney(saleFee)} で両クラブが合意`,
      body: `${offer.buyerClubName}は${playerClub.name}から${target.name}を移籍金 ${formatMoney(saleFee)} で獲得することで合意した。`,
      highlight: true
    });
  }

  updateMarketBadges();
  renderAll();
}

/**
 * 受信オファー拒否（REJECT）
 */
function rejectIncomingOffer(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!gameState.incomingOffers) return;
  const offer = gameState.incomingOffers.find(o => o.id === offerId);
  if (!offer) return;

  offer.status = 'rejected';
  if (offer.isMegaOfferEvent && gameState.pendingMegaOffer && (gameState.pendingMegaOffer.linkedOfferId === offer.id || gameState.pendingMegaOffer.playerId === offer.playerId)) {
    const playerClub = getPlayerClub();
    const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
    if (target) {
      playerClub.supporters += 250;
      target.megaOfferRejected = true;
      target.contractYears = Math.min(target.contractYears || 2, 2);
      const baseDemand = calculatePlayerDemandSalary(target);
      target.demandedSalary = Math.round((baseDemand * 1.12) / 50) * 50;
    }
    gameState.pendingMegaOffer = null;
  }

  addDailyLog(`【オファー拒絶】${offer.buyerClubName} からの ${offer.playerName} への獲得打診を拒絶しました。`);
  updateMarketBadges();
  renderAll();
}


let activeCounterOfferId = null;

/**
 * 移籍オファー上乗せ要求モーダルを開く
 */
function openCounterOfferModal(offerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  if (!gameState.incomingOffers) return;
  const offer = gameState.incomingOffers.find(o => o.id === offerId);
  if (!offer || offer.status === 'negotiating') return;

  activeCounterOfferId = offerId;
  const modalEl = document.getElementById('counter-offer-modal');
  if (!modalEl) return;

  const playerClub = getPlayerClub();
  const player = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
  const topBarEl = document.getElementById('counter-top-club-bar');
  if (topBarEl) {
    topBarEl.style.setProperty('--profile-club-accent', (playerClub && playerClub.primaryColor) || '#2ecc71');
  }

  const infoEl = document.getElementById('counter-offer-modal-player-info');
  if (infoEl) {
    const dispName = (player && (player.fullName || player.name)) || offer.playerName;
    const footHtml = player && typeof formatFootBadge === 'function' ? formatFootBadge(player) : '';
    const weeklyWage = (player && player.wage) || offer.wage || 20;
    const ovrCls = typeof getOvrTierClass === 'function' ? getOvrTierClass(offer.ovr) : '';
    infoEl.innerHTML = `
      <div class="counter-player-unified-card">
        <div class="profile-avatar-col">
          <canvas class="profile-avatar-canvas" id="counter-player-avatar" width="48" height="48" aria-label="選手アバター"></canvas>
          <div class="profile-header-ovr-box mono">
            <strong class="profile-header-ovr-val ${ovrCls}">${offer.ovr}</strong>
          </div>
        </div>
        <div class="counter-player-unified-meta">
          <div class="counter-player-title-row">
            <span class="profile-meta-mainpos mono">${offer.playerPos}</span>
            <span class="counter-player-fullname">${dispName} <span class="profile-age-inline">(${offer.playerAge})</span></span>
            <span class="profile-top-squad-num mono">#${offer.squadNumber}</span>
          </div>
          <div class="counter-player-sub-row mono">
            ${footHtml ? `<span class="profile-meta-foot">${footHtml}</span>` : ''}
            <span>週給 <strong class="accent-gold">£${weeklyWage.toLocaleString()}k/週</strong></span>
            <span class="profile-meta-sep">·</span>
            <span>相手: <strong style="color:#f1f5f9;">${offer.buyerClubName}</strong></span>
          </div>
        </div>
      </div>
    `;
    const cv = document.getElementById('counter-player-avatar');
    if (cv && player && typeof generatePlayerAvatar === 'function') {
      generatePlayerAvatar(player, cv, playerClub);
    }
  }

  const currentFeeEl = document.getElementById('counter-current-fee');
  if (currentFeeEl) currentFeeEl.textContent = formatMoney(offer.offerFee);

  const slider = document.getElementById('counter-fee-slider');
  if (slider) slider.value = 120;

  // プリセットボタンのリセット
  document.querySelectorAll('.btn-counter-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ratio === '1.20');
  });

  updateCounterOfferModalCalculation(offer.offerFee, 1.20);
  modalEl.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 上乗せモーダル内の計算＆表示更新
 */
function updateCounterOfferModalCalculation(baseFee, ratio) {
  const targetFee = Math.round(baseFee * ratio);
  const targetEl = document.getElementById('counter-target-fee');
  if (targetEl) targetEl.textContent = formatMoney(targetFee);

  const chanceEl = document.getElementById('counter-agree-chance');
  if (chanceEl) {
    if (ratio <= 1.15) {
      chanceEl.textContent = '合意期待度: 極めて高 (~85%)';
      chanceEl.className = 'accent-green font-bold';
    } else if (ratio <= 1.25) {
      chanceEl.textContent = '合意期待度: 高 (~70%)';
      chanceEl.className = 'accent-green font-bold';
    } else if (ratio <= 1.40) {
      chanceEl.textContent = '合意期待度: 中 (~45%)';
      chanceEl.className = 'accent-gold font-bold';
    } else {
      chanceEl.textContent = '合意期待度: 低 (~20%)';
      chanceEl.className = 'accent-red font-bold';
    }
  }
}

/**
 * 移籍オファー上乗せ要求モーダルを閉じる
 */
function closeCounterOfferModal() {
  const modalEl = document.getElementById('counter-offer-modal');
  if (modalEl) modalEl.classList.add('hidden');
  activeCounterOfferId = null;
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
}

/**
 * 上乗せ提示を実行
 */
function submitCounterOffer() {
  if (!activeCounterOfferId || !gameState.incomingOffers) return;
  const offer = gameState.incomingOffers.find(o => o.id === activeCounterOfferId);
  if (!offer) {
    closeCounterOfferModal();
    return;
  }

  const slider = document.getElementById('counter-fee-slider');
  const ratio = slider ? (parseInt(slider.value, 10) / 100) : 1.20;
  const demandedFee = Math.round(offer.offerFee * ratio);

  offer.status = 'negotiating';
  offer.demandedFee = demandedFee;
  offer.pendingDays = 2; // 2日後に相手から合意または決裂の回答

  addDailyLog(`【上乗せ提示】${offer.buyerClubName}へ ${offer.playerName}の移籍金 ${formatMoney(demandedFee)}（+${Math.round((ratio - 1) * 100)}%）を提示しました。回答待ちとなります。`);

  closeCounterOfferModal();
  updateMarketBadges();
  renderAll();
}

/**
 * 移籍オファー上乗せ（旧関数名ラッパー）
 */
function counterIncomingOffer(offerId) {
  openCounterOfferModal(offerId);
}


function openIncomingOfferModal() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const modalEl = document.getElementById('incoming-offer-modal');
  if (!modalEl) return;

  const playerClub = getPlayerClub();
  const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
  if (!target && offer.status === 'pending') {
    gameState.incomingTransferOffer = null;
    return;
  }

  const topBarEl = document.getElementById('incoming-top-club-bar');
  if (topBarEl) {
    topBarEl.style.setProperty('--profile-club-accent', (playerClub && playerClub.primaryColor) || '#eab308');
  }

  const avatarEl = document.getElementById('incoming-offer-avatar');
  if (avatarEl && target && typeof generatePlayerAvatar === 'function') {
    generatePlayerAvatar(target, avatarEl, playerClub);
  }

  const ovrBoxEl = document.getElementById('incoming-offer-ovr');
  if (ovrBoxEl) {
    const valEl = ovrBoxEl.querySelector('.profile-header-ovr-val');
    if (valEl) {
      valEl.textContent = offer.ovr;
      valEl.className = `profile-header-ovr-val ${typeof getOvrTierClass === 'function' ? getOvrTierClass(offer.ovr) : ''}`;
      valEl.style.background = 'none';
    }
  }

  // ヘッダー情報（プロフィールモーダル統一フォーマット）
  const squadNumEl = document.getElementById('incoming-offer-squad-num');
  const catEl = document.getElementById('incoming-offer-category');
  const posPill = document.getElementById('incoming-offer-pos-pill');
  const titleEl = document.getElementById('incoming-offer-title');
  const metaEl = document.getElementById('incoming-offer-meta');

  const hdrPlayer = target || {
    name: offer.playerName,
    fullName: offer.playerName,
    pos: offer.playerPos,
    age: offer.playerAge,
    squadNumber: offer.squadNumber,
    wage: offer.wage || 20,
    contractYears: 2,
    preferredFoot: 'Right',
    height: 180,
    nationality: 'England'
  };
  const hdrData = typeof buildUnifiedPlayerModalHeaderData === 'function'
    ? buildUnifiedPlayerModalHeaderData(hdrPlayer, playerClub, (playerClub && playerClub.name) || '自クラブ')
    : null;

  if (squadNumEl) squadNumEl.textContent = `#${offer.squadNumber}`;
  if (catEl && hdrData) catEl.innerHTML = hdrData.clubHtml;
  if (posPill && hdrData) posPill.innerHTML = hdrData.posMetaHtml;
  if (titleEl && hdrData) titleEl.innerHTML = hdrData.nameHtml;
  if (metaEl && hdrData) {
    metaEl.innerHTML = `
      <span class="profile-bio-chip">週給 <strong class="accent-gold">£${hdrData.weeklyWageVal.toLocaleString()}k/週</strong></span>
      <span class="profile-bio-sep">·</span>
      <span class="profile-bio-chip">市場価値 <strong class="accent-green">${formatMoney(hdrData.estMarketValue)}</strong></span>
      <span class="profile-bio-sep">·</span>
      <span class="profile-bio-chip">${hdrData.contractText}</span>
    `;
  }

  renderIncomingOfferBody(offer);
  modalEl.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 買取オファー本文および3択アクションの描画
 */
function renderIncomingOfferBody(offer, resultData = null) {
  const bodyEl = document.getElementById('incoming-offer-body');
  if (!bodyEl) return;

  if (resultData) {
    // 増額要求の結果画面
    const isSuccess = resultData.success;
    bodyEl.innerHTML = `
      <div class="incoming-offer-result ${isSuccess ? 'result-success' : 'result-failed'}">
        <div class="result-header mono">
          <span class="result-status-tag ${isSuccess ? 'tag-success' : 'tag-fail'}">${isSuccess ? '交渉成立' : '交渉決裂'}</span>
          <h3 class="result-title">${isSuccess ? '増額オファー合意 · 移籍成立' : '相手クラブが交渉から撤退'}</h3>
        </div>
        <div class="result-body-text" style="padding: 12px 2px; border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); line-height: 1.6; font-size: 13px; margin: 10px 0;">
          ${resultData.message}
        </div>
        <div class="incoming-offer-actions mt-3">
          <button type="button" class="btn btn-accent btn-lg" id="btn-close-incoming-result">完了して閉じる</button>
        </div>
      </div>
    `;
    const closeBtn = document.getElementById('btn-close-incoming-result');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeIncomingOfferModal);
    }
    return;
  }

  const diffSign = offer.ratioPercent >= 0 ? `+${offer.ratioPercent}%` : `${offer.ratioPercent}%`;
  const buyerFlag = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(offer.buyerClubName, 16, 'profile-club-emblem') : '';

  bodyEl.innerHTML = `
    <div class="ui-plate-grid cols-2">
      <div class="ui-stat-plate is-gold">
        <span class="ui-plate-label">提示移籍金 (${offer.buyerClubName})</span>
        <span class="ui-plate-val accent-gold">${formatMoney(offer.offerFee)}</span>
      </div>
      <div class="ui-stat-plate is-highlight">
        <span class="ui-plate-label">市場推定価格との差</span>
        <span class="ui-plate-val accent-green">${formatMoney(offer.baseFee)} (${diffSign})</span>
      </div>
    </div>

    <div class="ui-kv-list">
      <div class="ui-kv-row">
        <div class="ui-kv-label accent-gold-bar">オファー元</div>
        <div class="ui-kv-content mono" style="display:flex;align-items:center;gap:6px;font-size:12.5px;">
          ${buyerFlag}<strong>${offer.buyerClubName}</strong><span class="text-muted">(${offer.buyerClubCountry || '海外'})</span>
        </div>
      </div>
      <div class="ui-kv-row">
        <div class="ui-kv-label">打診内容</div>
        <div class="ui-kv-content" style="font-size:12.5px;line-height:1.5;color:#d1d5db;">
          完全移籍での即時獲得を希望しています。提示額を受諾して売却するか、増額要求・売却拒否を選択してください。
        </div>
      </div>
    </div>

    <div class="incoming-offer-actions">
      <button type="button" class="btn btn-accent" id="btn-incoming-accept" title="提示額で売却し、資金を獲得します">
        承諾して売却 (+${formatMoney(offer.offerFee)})
      </button>
      <button type="button" class="btn btn-primary" id="btn-incoming-counter" title="提示額の1.35倍を要求。50%で合意、50%で破談">
        増額を逆提案 (${formatMoney(offer.counterFee)} / 勝率50%)
      </button>
      <button type="button" class="btn btn-secondary" id="btn-incoming-reject" title="売却を拒否して選手を残留させます">
        売却を拒否して残留
      </button>
    </div>
  `;

  // ボタンイベント紐付け
  const acceptBtn = document.getElementById('btn-incoming-accept');
  const counterBtn = document.getElementById('btn-incoming-counter');
  const rejectBtn = document.getElementById('btn-incoming-reject');

  if (acceptBtn) acceptBtn.addEventListener('click', acceptIncomingOfferModal);
  if (counterBtn) counterBtn.addEventListener('click', counterDemandIncomingOffer);
  if (rejectBtn) rejectBtn.addEventListener('click', rejectIncomingOfferModal);
}

/**
 * 買取オファーを承諾
 */
function acceptIncomingOfferModal() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (!target) {
    closeIncomingOfferModal();
    return;
  }

  const check = validatePlayerDeparture(playerClub, target);
  if (!check.ok) {
    alert(check.reason);
    return;
  }

  completeIncomingSaleToBuyer(playerClub, target, offer.buyerClubId, offer.offerFee, 1.3);
  cancelOtherIncomingOffersForPlayer(target.id, null);

  addDailyLog(`【移籍成立】${target.pos} #${offer.squadNumber} ${target.name} が ${offer.buyerClubName} へ完全移籍（売却益: ${formatMoney(offer.offerFee)}）`);
  if (typeof addNewsItem === 'function') {
    addNewsItem({
      category: '移籍',
      headline: `${playerClub.name}の${target.pos} ${target.name}が${offer.buyerClubName}へ完全移籍`,
      body: `${offer.buyerClubName}は${playerClub.name}から${target.name}を移籍金 ${formatMoney(offer.offerFee)} で獲得した。`,
      highlight: true
    });
  }

  closeIncomingOfferModal();
  updateMarketBadges();
  renderAll();
}

/**
 * 買取オファーを拒否（残留）
 */
function rejectIncomingOfferModal() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  if (playerClub) {
    const target = playerClub.players.find(p => p.id === offer.playerId);
    if (target) {
      target.megaOfferRejected = true;
      target.contractRefused = false;
    }
  }

  addDailyLog(`【オファー拒否】${offer.buyerClubName} からの打診を拒絶。${offer.playerName} の残留を決定`);

  closeIncomingOfferModal();
  renderAll();
}

/**
 * 提示額の約1.35倍を増額要求（50%で超高額合意、50%で相手撤退・破談）
 */
function counterDemandIncomingOffer() {
  const offer = gameState.incomingTransferOffer;
  if (!offer) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const target = playerClub.players.find(p => p.id === offer.playerId);
  if (!target) {
    closeIncomingOfferModal();
    return;
  }

  const check = validatePlayerDeparture(playerClub, target);
  if (!check.ok) {
    alert(check.reason);
    return;
  }

  const isSuccess = Math.random() < 0.5;

  if (isSuccess) {
    // 合意・売却
    completeIncomingSaleToBuyer(playerClub, target, offer.buyerClubId, offer.counterFee, 1.4);
    cancelOtherIncomingOffersForPlayer(target.id, null);

    addDailyLog(`【移籍成立・増額逆提案】${offer.buyerClubName} が当クラブの増額要求を快諾！ ${target.name} を ${formatMoney(offer.counterFee)} で超高額売却しました！`);

    renderIncomingOfferBody(offer, {
      success: true,
      message: `当クラブGMの強気な増額カウンターに対し、<strong>${offer.buyerClubName}</strong> 会長は即座に条件を呑み、要求通りの移籍金 <strong>${formatMoney(offer.counterFee)}</strong> での獲得を正式受託しました！<br>クラブ資金に <strong>+${formatMoney(offer.counterFee)}</strong> が入金され、${target.name} の移籍手続きが完了しました。`
    });
    updateMarketBadges();
    renderAll();
  } else {
    // 相手クラブ撤退・破談
    target.megaOfferRejected = true;
    addDailyLog(`【交渉決裂】${offer.buyerClubName} は当クラブの増額要求（${formatMoney(offer.counterFee)}）を法外として交渉から即座に撤退しました。`);

    renderIncomingOfferBody(offer, {
      success: false,
      message: `<strong>${offer.buyerClubName}</strong> は提示された増額要求（<strong>${formatMoney(offer.counterFee)}</strong>）に対し、「過大評価であり妥協の余地はない」として交渉の打ち切りを通告してきました。<br>これにより買取オファーは破談となり、${target.name} は引き続き自クラブへ残留します。`
    });
    renderAll();
  }
}

/**
 * 買取オファーモーダルを閉じる
 */
function closeIncomingOfferModal() {
  const modalEl = document.getElementById('incoming-offer-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
  }
  gameState.incomingTransferOffer = null;
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
  renderAll();
}

/**
 * 常設U-21ユースチームの選手をトップチームへプロ契約昇格させる
 */
function releaseYouthPlayer(youthId) {
  const playerClub = getPlayerClub();
  if (!playerClub || !Array.isArray(playerClub.youthSquad)) return false;
  const idx = playerClub.youthSquad.findIndex(y => y.id === youthId);
  if (idx === -1) return false;
  const target = playerClub.youthSquad[idx];
  if (!window.confirm(`${target.pos} ${target.name}（${target.age}歳 / POT:${target.potential || target.potentialGrade || 'B'}）をユースチームから放出（退団）させますか？`)) {
    return false;
  }
  playerClub.youthSquad.splice(idx, 1);
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【ユース放出】${target.pos} ${target.name}（${target.age}歳）をユースチームから放出しました。`);
  }
  renderAll();
  if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
  return true;
}

function promoteYouthPlayer(youthId) {
  const playerClub = getPlayerClub();
  if (!playerClub) return false;

  if (playerClub.players.length >= MAX_SQUAD_SIZE) {
    showToast(`トップチーム枠（最大${MAX_SQUAD_SIZE}名）が満杯です。昇格させるには先に選手を放出またはU-21へ派遣してください。`, 'warning');
    alert(`トップチーム枠（最大${MAX_SQUAD_SIZE}名）が満杯です。`);
    return false;
  }

  const SIGN_FEE = 40; // 初回契約金 £40k
  if (playerClub.funds < SIGN_FEE) {
    alert(`資金不足です。初回プロ契約金 £${SIGN_FEE}k を支払えません。`);
    return false;
  }

  if (!playerClub.youthSquad) {
    playerClub.youthSquad = [];
  }

  const idx = playerClub.youthSquad.findIndex(y => y.id === youthId);
  if (idx === -1) return false;

  playerClub.funds -= SIGN_FEE;
  const youth = playerClub.youthSquad.splice(idx, 1)[0];
  youth.isYouth = false;
  youth.isYouthGraduate = true;
  youth.isHomegrown = true;
  youth.isStarter = false;
  youth.assignedPos = null;
  youth.slotIndex = null;
  youth.contractYears = 3;
  // 週給 £3K〜£6K
  const potBaseMap = { S: 86, A: 80, B: 74, C: 68 };
  const potRatingVal = youth.potentialRating || potBaseMap[youth.potential || youth.potentialGrade] || 70;
  youth.wage = Math.max(3, Math.min(6, Math.round(potRatingVal / 15)));
  youth.salary = youth.wage * 52;
  youth.contractRefused = false;

  ensureClubSquadNumbers(playerClub);
  const usedNumbers = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
  let num = 18;
  while (usedNumbers.has(num) && num < 99) {
    num++;
  }
  youth.squadNumber = num;

  playerClub.players.push(youth);
  ensureValidSquadAndStarters(playerClub);

  addDailyLog(`【U-21アカデミー昇格】${youth.pos} #${youth.squadNumber} ${youth.name} がプロ契約締結（初回契約金 £40k / 週給 ${formatWage(youth.wage)} / 3年契約）`);

  renderAll();
  return true;
}

/**
 * トップチームの21歳以下選手を常設U-21ユースチームへ一時派遣（降格）
 */
function demotePlayerToYouth(playerId) {
  return;
}

/**
 * 交渉モーダルを閉じる
 */
function closeNegotiationModal() {
  const modalEl = document.getElementById('negotiation-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
  }
  gameState.negotiationSession = null;

  const profModal = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (profModal && !profModal.classList.contains('hidden') && gameState.profileModalPlayerId) {
    if (typeof openPlayerProfileModal === 'function') {
      openPlayerProfileModal(gameState.profileModalPlayerId);
    }
  }
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
}

/**
 * 選手の契約延長ボタン処理（契約更新交渉モーダルを起動）
 */
function extendPlayerContract(playerId) {
  openContractNegotiationModal(playerId);
}

/**
 * 移籍市場から選手を獲得するボタン処理（移籍交渉モーダルを起動）
 */
function signMarketPlayer(candidateId) {
  openTransferNegotiationModal(candidateId);
}

/**
 * 自チームの選手を自由契約（解雇）する
 */
function releaseRosterPlayer(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target) return;

  if (target.loanStatus && (target.loanStatus.isLoan || target.loanStatus.isLoanOut)) {
    alert('レンタル契約中の選手は自由契約（解雇）にできません。');
    return;
  }

  const activePlayers = playerClub.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const remainingActive = activePlayers.filter(p => p.id !== playerId);
  if (remainingActive.length < 11) {
    alert('実働選手が11名未満になるため、これ以上自由契約にできません。');
    return;
  }
  if (target.pos === 'GK' && remainingActive.filter(p => p.pos === 'GK').length === 0) {
    alert('実働GKがいなくなるため、このGKを自由契約にできません。');
    return;
  }

  const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(target) : '-';
  if (!window.confirm(`#${target.squadNumber || '-'} ${target.name}（${target.pos} / ${target.age}歳 / OVR ${ovr}）を自由契約（退団）にしますか？\n※この操作は取り消せません。`)) {
    return;
  }

  playerClub.players = playerClub.players.filter(p => p.id !== playerId);
  if (gameState.selectedPlayerId === playerId) {
    gameState.selectedPlayerId = null;
  }

  if (typeof cancelOtherIncomingOffersForPlayer === 'function') {
    cancelOtherIncomingOffersForPlayer(target.id, null);
  }
  target.lastClubName = playerClub.name;
  target.lastClubId = playerClub.id;
  target.clubId = null;
  target.isFreeAgent = true;
  target.contractYears = 0;
  target.transferFee = 0;
  target.isStarter = false;
  target.isBench = false;
  target.assignedPos = null;
  target.slotIndex = null;
  target.isLoanListed = false;
  target.transferListed = false;
  target.preContractDeparture = null;
  target.contractRefused = false;
  if (typeof gameState.isSeasonOver === 'boolean' && gameState.isSeasonOver) {
    target._generatedInOffseasonOfSeason = gameState.season || 1;
  }
  if (!Array.isArray(gameState.transferMarket)) gameState.transferMarket = [];
  if (!gameState.transferMarket.some(p => p && p.id === target.id)) {
    gameState.transferMarket.push(target);
  }
  if (typeof addDailyLog === 'function') {
    addDailyLog(`【自由契約・退団】#${target.squadNumber || '-'} ${target.name} が自由契約となり、フリー市場へ移籍可能選手として登録されました。`);
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
      const candidate = createPlayer(pos, baseTarget, false, usedNames, [age, age]);
      candidate.isFreeAgent = true;
      candidate.contractYears = 0;
      candidate.transferFee = 0;
      candidate.lastClubName = typeof pickFormerClubForPlayer === 'function' ? pickFormerClubForPlayer(candidate, 0) : 'リーズ・U';
      if (typeof gameState !== 'undefined' && gameState.isSeasonOver) {
        candidate._generatedInOffseasonOfSeason = gameState.season || 1;
      }
      if (typeof ensurePlayerHistoryAndCareer === 'function') {
        ensurePlayerHistoryAndCareer(candidate, '無所属 (Free Agent)');
      }
      gameState.transferMarket.push(candidate);
    }
    gameState.transferMarket.sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  }

  renderAll();
}

/**
 * ユースアカデミー候補選手をトップチームへ昇格させる（移籍金 £0・最低年俸 £800K）
 */
function promoteYouthCandidate(candidateId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const maxSquad = typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50;
  if (!playerClub || playerClub.players.length >= maxSquad) return;

  const idx = (gameState.youthCandidates || []).findIndex(y => y.id === candidateId);
  if (idx === -1) return;

  const prospect = gameState.youthCandidates[idx];
  prospect.isYouth = false;
  prospect.isYouthGraduate = true;
  prospect.isHomegrown = true;
  prospect.isStarter = false;
  prospect.isBench = false;
  prospect.assignedPos = null;
  prospect.slotIndex = null;
  prospect.squadNumber = null;
  prospect.salary = 800; // 最低年俸 £800K
  prospect.wage = Math.max(10, Math.round(prospect.salary / 52));
  prospect.contractYears = 4;

  playerClub.players.push(prospect);
  ensureClubSquadNumbers(playerClub);
  ensureValidSquadAndStarters(playerClub);
  gameState.youthCandidates.splice(idx, 1);

  const msg = `【ユース昇格完了】${prospect.pos} ${prospect.name}（${prospect.age}歳 / OVR ${getPlayerOverallRating(prospect)}）とプロ契約（移籍金 £0・年俸 £800K）を締結しトップチームへ登録しました。`;
  gameState.facilityFeedback = msg;
  addDailyLog(msg);
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

  const msg = `【ユース昇格見送り】${prospect.pos} ${prospect.name}（${prospect.age}歳）のトップ昇格を見送り、他クラブ移籍に伴う育成補償金 +£300K を受領しました。`;
  gameState.facilityFeedback = msg;
  addDailyLog(msg);
  renderAll();
}

/**
 * GM業務タスク（GM Dashboard）の「実行 / 移動」ボタン処理
 */
function handleGmDutyAction(actionKey) {
  if (actionKey === 'restart-game') {
    if (typeof showMainMenuScreen === 'function') showMainMenuScreen();
    return;
  }
  if (gameState.isGameOver || gameState.isSimulating) return;

  if (actionKey === 'goto-market-offers') {
    switchTab('market');
    switchMarketSubtab('offers');
    return;
  }

  if (actionKey === 'open-mega-offer') {
    openMegaOfferModal();
    return;
  }

  if (actionKey === 'open-lineup-consultation') {
    if (gameState.pendingLineupConsultation && typeof openLineupConsultationModal === 'function') {
      openLineupConsultationModal(gameState.pendingLineupConsultation);
    }
    return;
  }

  if (actionKey && actionKey.startsWith('negotiate-player:')) {
    const pid = actionKey.split(':')[1];
    switchTab('roster');
    const table = document.getElementById('roster-tbody');
    if (table) table.scrollIntoView({ behavior: 'smooth', block: 'center' });
    openContractNegotiationModal(pid);
    return;
  }

  if (actionKey === 'play-match') {
    switchTab('office');
    if (isTodayMatchDayPending()) {
      playCurrentMatchday(false);
    } else {
      startAdvancingToNextMatch();
    }
    return;
  }

  if (actionKey === 'start-next-season') {
    startNextSeason();
    return;
  }

  if (actionKey === 'goto-pitch') {
    switchTab('roster');
    switchRosterSubtab('board');
    return;
  }

  if (actionKey === 'goto-roster-table') {
    switchTab('roster');
    switchRosterSubtab('players');
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
    switchFacilitiesSubtab('investment');
    return;
  }

  if (actionKey === 'goto-staff') {
    switchTab('facilities');
    switchFacilitiesSubtab('staff');
    return;
  }

  if (actionKey === 'goto-youth') {
    switchTab('facilities');
    switchFacilitiesSubtab('youth');
    return;
  }
}

/**
 * クラブの戦術方針を変更する
 */
function setTeamTactic(tacticKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const normalizedKey = normalizeTacticKey(tacticKey);
  const playerClub = getPlayerClub();
  if (!playerClub || !TACTICS_DEFINITIONS[normalizedKey]) return;

  if (playerClub.tactic !== normalizedKey) {
    notifyGmManualIntervention('戦術指定');
  }
  playerClub.tactic = normalizedKey;

  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === normalizedKey);
  });

  document.querySelectorAll('.tactics-guide-item[data-tactic-card]').forEach(card => {
    card.classList.toggle('active-guide', card.dataset.tacticCard === normalizedKey);
  });

  const badgeEl = document.getElementById('current-tactic-badge');
  if (badgeEl) badgeEl.textContent = TACTICS_DEFINITIONS[normalizedKey].badge;
  const descEl = document.getElementById('current-tactic-desc');
  if (descEl) descEl.textContent = TACTICS_DEFINITIONS[normalizedKey].desc;

  renderRoster();
}

/**
 * クラブのフォーメーション（全8種）を切り替える
 */
function setClubFormation(formationKey) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !FORMATIONS[formationKey]) return;

  if (playerClub.formation !== formationKey) {
    notifyGmManualIntervention('陣形変更');
  }
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
/**
 * 2つのスタメン枠の選手同士をスワップする
 */
function swapStarterSlots(slotIndexA, slotIndexB) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const formationDef = getClubFormationDef(playerClub);
  const slotDefA = formationDef.slots[slotIndexA];
  const slotDefB = formationDef.slots[slotIndexB];
  if (!slotDefA || !slotDefB) return;

  const starterA = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndexA);
  const starterB = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndexB);

  if (starterA && starterB) {
    notifyGmManualIntervention('配置変更');
    starterA.slotIndex = slotIndexB;
    starterA.assignedPos = slotDefB.pos;
    starterB.slotIndex = slotIndexA;
    starterB.assignedPos = slotDefA.pos;
  }
  gameState.selectedSlotIndex = null;
  gameState.selectedPlayerId = null;
  renderRoster();
}

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
    notifyGmManualIntervention('配置変更');
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
/**
 * 控え選手とベンチ外選手、または控え同士の枠を入れ替える
 */
function swapBenchOrReservePlayers(playerAId, playerBId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const pA = playerClub.players.find(p => p && p.id === playerAId && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const pB = playerClub.players.find(p => p && p.id === playerBId && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  if (!pA || !pB) return;

  const tempBench = pA.isBench;
  pA.isBench = pB.isBench;
  pB.isBench = tempBench;

  ensureValidSquadAndStarters(playerClub);
  renderRoster();
}

/**
 * ベンチ選手を指定スロット（または最適枠）のスタメンとワンクリックで交代する
 */
function substituteBenchPlayerToSlot(benchPlayerId, targetSlotIndex = null) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const benchPlayer = playerClub.players.find(p => p && p.id === benchPlayerId && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  if (!benchPlayer) return;

  const formationDef = getClubFormationDef(playerClub);
  const resolvedSlotIdx = targetSlotIndex !== null ? targetSlotIndex : gameState.selectedSlotIndex;

  if (resolvedSlotIdx !== null && formationDef.slots[resolvedSlotIdx]) {
    const slotDef = formationDef.slots[resolvedSlotIdx];
    const currentStarter = playerClub.players.find(p => p.isStarter && p.slotIndex === resolvedSlotIdx);
    const incomingWasOnBench = benchPlayer.isBench !== false;

    if (currentStarter) {
      currentStarter.isStarter = false;
      currentStarter.isBench = incomingWasOnBench;
      currentStarter.slotIndex = null;
      currentStarter.assignedPos = null;
    }

    benchPlayer.isStarter = true;
    benchPlayer.isBench = false;
    benchPlayer.slotIndex = resolvedSlotIdx;
    benchPlayer.assignedPos = slotDef.pos;
    notifyGmManualIntervention('選手起用');

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
  if (!playerClub) return;
  const target = playerClub.players.find(p => p.id === playerId && p.isStarter);
  if (!target || !POS_ROLE_GROUP[newSlotPos]) return;

  const formationDef = typeof getClubFormationDef === 'function' ? getClubFormationDef(playerClub) : null;
  const slots = (formationDef && Array.isArray(formationDef.slots)) ? formationDef.slots : [];
  if (slots.length > 0 && !slots.some(sl => sl && sl.pos === newSlotPos)) {
    return;
  }

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
  } else if (slots.length > 0) {
    const occupiedIndices = new Set(
      playerClub.players.filter(p => p.isStarter && p.id !== target.id && Number.isInteger(p.slotIndex)).map(p => p.slotIndex)
    );
    const openSlotIdx = slots.findIndex((sl, idx) => sl && sl.pos === newSlotPos && !occupiedIndices.has(idx));
    if (openSlotIdx === -1) return;
    target.slotIndex = openSlotIdx;
  } else {
    return;
  }
  target.assignedPos = newSlotPos;
  notifyGmManualIntervention('配置変更');

  renderRoster();
}

/**
 * スタメン / ベンチ切り替えボタンのクリック処理
 */
function togglePlayerStarter(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;

  const playerClub = getPlayerClub();
  const target = playerClub.players.find(p => p.id === playerId);
  if (!target || target.isRetired || (target.loanStatus && target.loanStatus.isLoanOut)) return;

  const starters = playerClub.players.filter(p => p && p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const bench = playerClub.players.filter(p => p && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  notifyGmManualIntervention('選手起用');

  if (target.isStarter) {
    if (bench.length === 0) return;
    const slotToFill = target.assignedPos || target.pos;
    const slotIdxToFill = target.slotIndex;
    bench.sort((a, b) => {
      const aBench = a.isBench !== false ? 1 : 0;
      const bBench = b.isBench !== false ? 1 : 0;
      if (aBench !== bBench) return bBench - aBench;
      const aMatch = (a.preferredPosition || a.pos) === slotToFill ? 1 : 0;
      const bMatch = (b.preferredPosition || b.pos) === slotToFill ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });
    const promoted = bench[0];
    const promotedWasOnBench = promoted.isBench !== false;
    promoted.isStarter = true;
    promoted.isBench = false;
    promoted.slotIndex = slotIdxToFill;
    promoted.assignedPos = slotToFill;
    target.isStarter = false;
    target.isBench = promotedWasOnBench;
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
      const targetWasOnBench = target.isBench !== false;
      demoted.isStarter = false;
      demoted.isBench = targetWasOnBench;
      demoted.slotIndex = null;
      demoted.assignedPos = null;
      target.isStarter = true;
      target.isBench = false;
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

  const finishedSeasonNumForOut = gameState.season || 1;
  const finishedBaseYearForOut = 2025 + finishedSeasonNumForOut;
  const finishedYearStrForOut = `${finishedBaseYearForOut}-${String((finishedBaseYearForOut + 1) % 100).padStart(2, '0')}`;

  // 1. レンタル加入選手の所属元クラブへの返却（元の週給・契約年数を復元して元クラブへ戻す）
  const loanInPlayers = playerClub.players.filter(p => p.loanStatus && p.loanStatus.isLoan);
  if (loanInPlayers.length > 0) {
    playerClub.players = playerClub.players.filter(p => !p.loanStatus || !p.loanStatus.isLoan);
    loanInPlayers.forEach(p => {
      const fromId = p.loanStatus ? p.loanStatus.fromClubId : null;
      const fromName = (p.loanStatus && p.loanStatus.fromClubName) ? p.loanStatus.fromClubName : '所属元';
      const restoredWage = (p.loanStatus && p.loanStatus.originalWage) ? p.loanStatus.originalWage : (p.wage || 20);
      const restoredYears = Math.max(1, (p.loanStatus && p.loanStatus.originalContractYears) ? p.loanStatus.originalContractYears - 1 : 2);

      const seasonAge = Math.max(15, (p.age || 18) - 1);
      if (!Array.isArray(p.seasonHistory)) {
        const savedAge = p.age;
        p.age = seasonAge;
        ensurePlayerHistoryAndCareer(p, playerClub.name);
        p.age = savedAge;
      }
      if (!p.seasonHistory.some(r => r && r.seasonYear === finishedYearStrForOut)) {
        const prevAvg = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
        p.seasonHistory.push({
          seasonYear: finishedYearStrForOut,
          clubName: playerClub.name,
          age: seasonAge,
          appearances: p.appearances || 0,
          goals: p.goals || 0,
          assists: p.assists || 0,
          avgRating: prevAvg,
          ovr: getPlayerOverallRating(p)
        });
      }

      p.wage = restoredWage;
      p.salary = restoredWage * 52;
      p.contractYears = restoredYears;
      p.loanStatus = null;
      p.loanTerms = null;
      p.isFreeAgent = false;
      p.isStarter = false;
      p.isBench = false;
      p.assignedPos = null;
      p.slotIndex = null;
      p.appearances = 0;
      p.goals = 0;
      p.assists = 0;
      p.totalRating = 0;
      p.cleanSheets = 0;
      p.momCount = 0;
      p.yellowCards = 0;
      p.redCards = 0;

      const parentClub = fromId ? getClubById(fromId) : null;
      if (parentClub && !parentClub.isPlayer && Array.isArray(parentClub.players) && parentClub.players.length < MAX_SQUAD_SIZE) {
        if (!parentClub.players.some(x => x.id === p.id)) {
          p.clubId = parentClub.id;
          parentClub.players.push(p);
          ensureClubSquadNumbers(parentClub);
          ensureValidSquadAndStarters(parentClub);
        }
      } else {
        const euroCompClub = (fromId && typeof getEuropeanCompetitionClubsWithPlayers === 'function')
          ? getEuropeanCompetitionClubsWithPlayers().find(c => c && c.id === fromId)
          : null;
        const euroDef = (fromId && typeof findEuropeanClubDefinitionById === 'function')
          ? findEuropeanClubDefinitionById(fromId)
          : null;
        if (euroCompClub || euroDef) {
          const euroClub = euroCompClub || euroDef;
          p.clubId = euroClub.id;
          p.euroClubId = euroClub.id;
          p.isEuroListed = true;
          p.isFreeAgent = false;
          if (euroCompClub && Array.isArray(euroCompClub.players) && euroCompClub.players.length < MAX_SQUAD_SIZE && !euroCompClub.players.some(x => x && x.id === p.id)) {
            euroCompClub.players.push(p);
          }
          if (!Array.isArray(gameState.euroTransferList)) gameState.euroTransferList = [];
          if (!gameState.euroTransferList.some(x => x && x.id === p.id)) {
            gameState.euroTransferList.unshift(p);
          }
        } else if (Array.isArray(gameState.transferMarket) && !gameState.transferMarket.some(x => x && x.id === p.id)) {
          p.clubId = null;
          p.isFreeAgent = true;
          gameState.transferMarket.push(p);
        }
      }
      addDailyLog(`【レンタル満了・復帰】#${p.squadNumber || '-'} ${p.name} の1年間期限付き移籍が満了し、${fromName}へ復帰しました。`);
    });
  }

  // 2. レンタル放出（レンタル）選手の成長復帰・実績反映
  playerClub.players.forEach(p => {
    if (p.loanStatus && p.loanStatus.isLoanOut) {
      const destClubName = p.loanStatus.toClubName || 'レンタル先';
      const seasonAge = Math.max(15, (p.age || 18) - 1);
      if (!Array.isArray(p.seasonHistory)) {
        const savedAge = p.age;
        p.age = seasonAge;
        ensurePlayerHistoryAndCareer(p, playerClub.name);
        p.age = savedAge;
      }
      if (!p.seasonHistory.some(r => r && r.seasonYear === finishedYearStrForOut)) {
        const ovr = getPlayerOverallRating(p);
        const pos = p.primaryPosition || p.pos || 'CM';
        const loanApps = randInt(20, 34);
        const gRate = (pos === 'CF' || pos === 'ST') ? 0.36 : (['LW', 'RW', 'WG'].includes(pos) ? 0.24 : (pos === 'AM' ? 0.20 : (['LM', 'RM', 'SM'].includes(pos) ? 0.12 : (pos === 'CM' ? 0.09 : (pos === 'GK' ? 0 : 0.05)))));
        const aRate = pos === 'GK' ? 0 : (['AM', 'LW', 'RW', 'LM', 'RM'].includes(pos) ? 0.16 : 0.08);
        const loanGoals = pos === 'GK' ? 0 : Math.round(loanApps * gRate);
        const loanAssists = pos === 'GK' ? 0 : Math.round(loanApps * aRate);
        const loanRating = clamp(6.45 + (ovr - 65) * 0.035, 6.2, 7.9).toFixed(2);
        if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
        p.careerStats.appearances = (p.careerStats.appearances || 0) + loanApps;
        p.careerStats.goals = (p.careerStats.goals || 0) + loanGoals;
        p.careerStats.assists = (p.careerStats.assists || 0) + loanAssists;
        p.seasonHistory.push({
          seasonYear: finishedYearStrForOut,
          clubName: `${destClubName} (レンタル)`,
          age: seasonAge,
          appearances: loanApps,
          goals: loanGoals,
          assists: loanAssists,
          avgRating: loanRating,
          ovr
        });
      }
      if ((p.contractYears || 0) <= 0) {
        p.contractYears = 1;
      }
      addDailyLog(`【レンタルから頼もしく復帰】#${p.squadNumber || '-'} ${p.name} が ${destClubName} での1年間のレンタル期間を終え、実力を高めてチームへ合流しました！`);
      p.loanStatus = null;
      p.isLoanListed = false;
    }
  });

  // 3. 事前合意（ボスマン）流出選手の退団
  const departingPlayers = playerClub.players.filter(p => p.preContractDeparture);
  if (departingPlayers.length > 0) {
    departingPlayers.forEach(p => {
      const destId = p.preContractDeparture.toClubId || null;
      const destName = p.preContractDeparture.toClubName || '海外クラブ';
      const seasonAge = Math.max(15, (p.age || 18) - 1);
      if (!Array.isArray(p.seasonHistory)) {
        const savedAge = p.age;
        p.age = seasonAge;
        ensurePlayerHistoryAndCareer(p, playerClub.name);
        p.age = savedAge;
      }
      if (!p.seasonHistory.some(r => r && r.seasonYear === finishedYearStrForOut)) {
        const prevAvg = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
        p.seasonHistory.push({
          seasonYear: finishedYearStrForOut,
          clubName: playerClub.name,
          age: seasonAge,
          appearances: p.appearances || 0,
          goals: p.goals || 0,
          assists: p.assists || 0,
          avgRating: prevAvg,
          ovr: getPlayerOverallRating(p)
        });
      }
      p.lastClubName = playerClub.name;
      p.lastClubId = playerClub.id;
      p.preContractDeparture = null;
      p.contractRefused = false;
      p.isStarter = false;
      p.isBench = false;
      p.assignedPos = null;
      p.slotIndex = null;
      p.isFreeAgent = false;
      p.contractYears = randInt(2, 4);
      p.appearances = 0;
      p.goals = 0;
      p.assists = 0;
      p.totalRating = 0;
      p.cleanSheets = 0;
      p.momCount = 0;
      p.yellowCards = 0;
      p.redCards = 0;

      const destClub = destId ? getClubById(destId) : null;
      if (destClub && !destClub.isPlayer && Array.isArray(destClub.players) && destClub.players.length < MAX_SQUAD_SIZE) {
        const destUsedNums = new Set(destClub.players.map(x => x.squadNumber).filter(Boolean));
        p.clubId = destClub.id;
        p.squadNumber = pickAvailableSquadNumber(p.pos, destUsedNums);
        destClub.players.push(p);
        ensureValidSquadAndStarters(destClub);
      } else {
        p.isEuroListed = true;
        p.euroClubId = destId || 'es01';
        p.clubId = p.euroClubId;
        if (!Array.isArray(gameState.euroTransferList)) gameState.euroTransferList = [];
        if (!gameState.euroTransferList.some(x => x && x.id === p.id)) {
          gameState.euroTransferList.unshift(p);
        }
      }
      addDailyLog(`【フリー退団】#${p.squadNumber || '-'} ${p.name} が事前合意に基づき ${destName} へ移籍金£0で移籍しました。`);
    });
    playerClub.players = playerClub.players.filter(p => !departingPlayers.includes(p));
  }

  // 4. 契約残り0年のまま更新されなかった選手はフリー移籍でチームを離脱（※残契約年数がある選手は交渉決裂でも強制放出しない）
  const expiredPlayers = playerClub.players.filter(p => p.contractYears <= 0 && !(p.loanStatus && p.loanStatus.isLoan));
  if (expiredPlayers.length > 0) {
    expiredPlayers.forEach(p => {
      const seasonAge = Math.max(15, (p.age || 18) - 1);
      if (!Array.isArray(p.seasonHistory)) {
        const savedAge = p.age;
        p.age = seasonAge;
        ensurePlayerHistoryAndCareer(p, playerClub.name);
        p.age = savedAge;
      }
      if (!p.seasonHistory.some(r => r && r.seasonYear === finishedYearStrForOut)) {
        const prevAvg = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
        p.seasonHistory.push({
          seasonYear: finishedYearStrForOut,
          clubName: playerClub.name,
          age: seasonAge,
          appearances: p.appearances || 0,
          goals: p.goals || 0,
          assists: p.assists || 0,
          avgRating: prevAvg,
          ovr: getPlayerOverallRating(p)
        });
      }
      p.lastClubName = playerClub.name;
      p.lastClubId = playerClub.id;
      p.isFreeAgent = true;
      p.contractYears = 0;
      p.transferFee = 0;
      p.contractRefused = false;
      p.isStarter = false;
      p.isBench = false;
      p.assignedPos = null;
      p.slotIndex = null;
      p.appearances = 0;
      p.goals = 0;
      p.assists = 0;
      p.totalRating = 0;
      p.cleanSheets = 0;
      p.momCount = 0;
      p.yellowCards = 0;
      p.redCards = 0;
      if (Array.isArray(gameState.transferMarket) && !gameState.transferMarket.some(x => x.id === p.id)) {
        gameState.transferMarket.push(p);
      }
      addDailyLog(`【契約満了・退団】#${p.squadNumber || '-'} ${p.name} が契約満了により退団し、無所属（フリーエージェント）となりました。`);
    });
    playerClub.players = playerClub.players.filter(p => p.contractYears > 0);
  }
  playerClub.players.forEach(p => { if (p) p.contractRefused = false; });

  // 5. 事前合意内定選手（preContractPlayers）の正式合流（元クラブ・市場から確実に除去して二重所属を防止）
  if (Array.isArray(gameState.preContractPlayers) && gameState.preContractPlayers.length > 0) {
    const usedNums = new Set(playerClub.players.map(p => p.squadNumber).filter(Boolean));
    gameState.preContractPlayers.forEach(p => {
      if (!p || p.isRetired) return;
      for (const otherClub of getAllManagedLeagueClubs()) {
        if (otherClub.id === playerClub.id || !Array.isArray(otherClub.players)) continue;
        if (otherClub.players.some(x => x.id === p.id)) {
          otherClub.players = otherClub.players.filter(x => x.id !== p.id);
          ensureValidSquadAndStarters(otherClub);
          if (typeof autoSelectStarters === 'function') {
            autoSelectStarters(otherClub);
          }
        }
      }
      if (typeof getEuropeanCompetitionClubsWithPlayers === 'function') {
        for (const euroClub of getEuropeanCompetitionClubsWithPlayers()) {
          if (Array.isArray(euroClub.players) && euroClub.players.some(x => x && x.id === p.id)) {
            euroClub.players = euroClub.players.filter(x => x && x.id !== p.id);
          }
        }
      }
      if (Array.isArray(gameState.transferMarket)) {
        gameState.transferMarket = gameState.transferMarket.filter(x => x.id !== p.id);
      }
      if (Array.isArray(gameState.euroTransferList)) {
        gameState.euroTransferList = gameState.euroTransferList.filter(x => x.id !== p.id);
      }

      p.isEuroListed = false;
      p.euroClubId = null;
      p.clubId = playerClub.id;
      p.squadNumber = pickAvailableSquadNumber(p.pos, usedNums);
      usedNums.add(p.squadNumber);
      if (p.preContract) {
        p.wage = p.preContract.wage || p.wage;
        p.salary = p.preContract.salary || (p.wage * 52);
        p.contractYears = p.preContract.contractYears || 3;
      }
      p.preContract = null;
      p.isFreeAgent = false;
      p.isStarter = false;
      p.isBench = false;
      p.assignedPos = null;
      p.slotIndex = null;
      if (playerClub.players.some(existing => existing.id === p.id)) return;
      if (playerClub.players.length < MAX_SQUAD_SIZE) {
        playerClub.players.push(p);
        addDailyLog(`【事前合意新戦力合流】内定していた ${p.pos} #${p.squadNumber} ${p.name} が来季契約に基づき正式合流しました！（契約${p.contractYears}年 / 週給${formatWage(p.wage)}）`);
      } else {
        p.isFreeAgent = true;
        p.contractYears = 0;
        p.clubId = null;
        if (Array.isArray(gameState.transferMarket) && !gameState.transferMarket.some(x => x.id === p.id)) {
          gameState.transferMarket.push(p);
        }
        addDailyLog(`【編成枠超過による合流見送り】${p.name} の加入時点で登録枠（${MAX_SQUAD_SIZE}名）に空きがなかったため、フリー移籍扱いとなりました。`);
      }
    });
    gameState.preContractPlayers = [];
  }

  gameState.hasPreContractDepartureThisSeason = false;
  ensureValidSquadAndStarters(playerClub);

  // 人件費は毎週日曜の週次引き落とし＋シーズン末残週精算で支払い済みのため、新シーズン開幕時の一括引き落としは行わない
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

  gameState.paidPayrollWeeks = 0;
  gameState.season += 1;
  gameState.currentWeek = 0;
  gameState.isSeasonOver = false;
  gameState.lastWeekResults = [];
  gameState.matchHistory = [];
  gameState.competitionStats = {};
  const initialDay = getCurrentCalendarDay();
  if (initialDay) {
    gameState.calendarViewYear = initialDay.year;
    gameState.calendarViewMonth = initialDay.month;
  } else {
    gameState.calendarViewYear = 2025 + gameState.season;
    gameState.calendarViewMonth = 8;
  }
  gameState.scheduleViewMode = 'calendar';
  gameState.lastMatchTicker = null;
  gameState.lastSettlement = null;
  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  gameState.pendingMegaOffer = null;
  gameState.pendingLineupConsultation = null;
  gameState.monthlyReports = [];
  if (typeof ensureMonthlyLedger === 'function') {
    ensureMonthlyLedger(true, initialDay || null);
  } else {
    gameState.monthlyLedger = null;
  }
  if (Array.isArray(gameState.incomingOffers)) {
    for (const o of gameState.incomingOffers) {
      if (o && (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed')) {
        o.status = 'expired';
      }
    }
  }
  if (Array.isArray(gameState.outgoingOffers)) {
    for (const o of gameState.outgoingOffers) {
      if (o && (o.status === 'pending' || o.status === 'cpu_counter' || o.status === 'agreed')) {
        o.status = 'expired';
      }
    }
  }
  gameState.d1BackgroundSchedule = null;

  // 新シーズン開始時に1部・2部の昇降格入れ替えを適用
  if (typeof processPromotionAndRelegation === 'function') {
    processPromotionAndRelegation();
  }

  // 契約満了のまま新シーズンを迎えた自クラブ監督の単年自動更新／高齢勇退処理
  if (playerClub && playerClub.manager) {
    const pMgr = playerClub.manager;
    if ((pMgr.age || 45) >= 72) {
      addDailyLog(`監督人事：${pMgr.name}監督（${pMgr.age}歳）が勇退し、監督が退任しました。経営タブから後任監督を招聘してください。`);
      playerClub.manager = null;
    } else if ((pMgr.contractYears || 0) <= 0) {
      pMgr.contractYears = 1;
      addDailyLog(`監督契約更新：${pMgr.name}監督との契約を1年自動延長しました（残契約：1年）`);
    }
  }

  for (const club of getAllManagedLeagueClubs()) {
    club.played = 0;
    club.won = 0;
    club.drawn = 0;
    club.lost = 0;
    club.gf = 0;
    club.ga = 0;
    club.gd = 0;
    club.pts = (club.psrSanction && club.psrSanction.pointsDeductedThisSeason > 0)
      ? -club.psrSanction.pointsDeductedThisSeason
      : 0;
    const prevSeasonNum = Math.max(1, (gameState.season || 2) - 1);
    const prevBaseYear = 2025 + prevSeasonNum;
    const prevYearStr = `${prevBaseYear}-${String((prevBaseYear + 1) % 100).padStart(2, '0')}`;
    for (const p of (club.players || [])) {
      const seasonAge = Math.max(15, (p.age || 18) - 1);
      if (!Array.isArray(p.seasonHistory)) {
        const savedSeason = gameState.season;
        const savedAge = p.age;
        gameState.season = prevSeasonNum;
        p.age = seasonAge;
        ensurePlayerHistoryAndCareer(p, club.name);
        gameState.season = savedSeason;
        p.age = savedAge;
      }
      if (!p.seasonHistory.some(r => r && r.seasonYear === prevYearStr)) {
        const joinedOffseason = p._joinedInOffseasonOfSeason === prevSeasonNum;
        const histClubName = joinedOffseason ? (p.lastClubName || club.name) : club.name;
        const prevAvg = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : '-';
        let histApps = p.appearances || 0;
        let histGoals = p.goals || 0;
        let histAssists = p.assists || 0;
        let histRating = prevAvg;
        if (joinedOffseason && histApps === 0) {
          const ovr = getPlayerOverallRating(p);
          const pos = p.primaryPosition || p.pos || 'CM';
          histApps = randInt(16, 30);
          const gRate = (pos === 'CF' || pos === 'ST') ? 0.42 : (pos === 'FW' ? 0.34 : (['LW', 'RW', 'WG'].includes(pos) ? 0.28 : (pos === 'AM' ? 0.22 : (['LM', 'RM', 'SM', 'MF'].includes(pos) ? 0.13 : (pos === 'CM' ? 0.10 : (pos === 'DM' ? 0.06 : (pos === 'GK' ? 0 : 0.055)))))));
          const aRate = pos === 'GK' ? 0 : (['AM', 'LW', 'RW', 'LM', 'RM'].includes(pos) ? 0.18 : 0.08);
          histGoals = pos === 'GK' ? 0 : Math.round(histApps * gRate);
          histAssists = pos === 'GK' ? 0 : Math.round(histApps * aRate);
          histRating = clamp(6.5 + (ovr - 68) * 0.04, 6.2, 8.2).toFixed(2);
          if (!p.careerStats) p.careerStats = { appearances: 0, goals: 0, assists: 0 };
          p.careerStats.appearances = (p.careerStats.appearances || 0) + histApps;
          p.careerStats.goals = (p.careerStats.goals || 0) + histGoals;
          p.careerStats.assists = (p.careerStats.assists || 0) + histAssists;
        }
        p.seasonHistory.push({
          seasonYear: prevYearStr,
          clubName: histClubName,
          age: seasonAge,
          appearances: histApps,
          goals: histGoals,
          assists: histAssists,
          avgRating: histRating,
          ovr: getPlayerOverallRating(p)
        });
      }
      p._joinedInOffseasonOfSeason = null;
      // CPUクラブ所属選手の古い年度履歴は直近3シーズン分に圧縮し長期プレイ時のセーブ肥大化を防止（通算成績 careerStats は完全保持）
      if (!club.isPlayer && p.seasonHistory.length > 3) {
        p.seasonHistory = p.seasonHistory.slice(-3);
      }
      p.appearances = 0;
      p.goals = 0;
      p.assists = 0;
      p.totalRating = 0;
      p.cleanSheets = 0;
      p.momCount = 0;
      p.yellowCards = 0;
      p.redCards = 0;
      p.compYellowAccum = { league: 0, domesticCup: 0, euroCup: 0 };
      p.injuryWeeks = 0;
      p.injuryDays = 0;
      p.lastDiff = null;
    }
  }

  if (Array.isArray(gameState.transferMarket)) {
    const prevSeasonNum = Math.max(1, (gameState.season || 2) - 1);
    const prevBaseYear = 2025 + prevSeasonNum;
    const prevYearStr = `${prevBaseYear}-${String((prevBaseYear + 1) % 100).padStart(2, '0')}`;
    for (const fp of gameState.transferMarket) {
      if (!fp) continue;
      if (!Array.isArray(fp.seasonHistory)) {
        const savedSeason = gameState.season;
        gameState.season = prevSeasonNum;
        ensurePlayerHistoryAndCareer(fp, '無所属 (Free Agent)');
        gameState.season = savedSeason;
      }
      if (!fp.seasonHistory.some(r => r && r.seasonYear === prevYearStr)) {
        const formerName = fp.lastClubName || (typeof pickFormerClubForPlayer === 'function' ? pickFormerClubForPlayer(fp, 0) : 'リーズ・U');
        fp.lastClubName = formerName;
        const ovr = getPlayerOverallRating(fp);
        const pos = fp.primaryPosition || fp.pos || 'CM';
        const estApps = randInt(14, 28);
        const gRate = (pos === 'CF' || pos === 'ST') ? 0.42 : (pos === 'FW' ? 0.34 : (['LW', 'RW', 'WG'].includes(pos) ? 0.28 : (pos === 'AM' ? 0.22 : (['LM', 'RM', 'SM', 'MF'].includes(pos) ? 0.13 : (pos === 'CM' ? 0.10 : (pos === 'DM' ? 0.06 : (pos === 'GK' ? 0 : 0.055)))))));
        const aRate = pos === 'GK' ? 0 : (['AM', 'LW', 'RW', 'LM', 'RM'].includes(pos) ? 0.18 : 0.08);
        const estGoals = pos === 'GK' ? 0 : Math.round(estApps * gRate);
        const estAssists = pos === 'GK' ? 0 : Math.round(estApps * aRate);
        const estRating = clamp(6.5 + (ovr - 68) * 0.04, 6.2, 8.2).toFixed(2);
        fp.seasonHistory.push({
          seasonYear: prevYearStr,
          clubName: formerName,
          age: fp.age || 25,
          appearances: estApps,
          goals: estGoals,
          assists: estAssists,
          avgRating: estRating,
          ovr
        });
        fp.age = (fp.age || 25) + 1;
        if (!fp.careerStats) fp.careerStats = { appearances: 0, goals: 0, assists: 0 };
        fp.careerStats.appearances = (fp.careerStats.appearances || 0) + estApps;
        fp.careerStats.goals = (fp.careerStats.goals || 0) + estGoals;
        fp.careerStats.assists = (fp.careerStats.assists || 0) + estAssists;
      }
      fp._generatedInOffseasonOfSeason = null;
    }
  }

  // 欧州主要クラブ（euroTransferList）の選手もシーズン終了記録を保存し、今季出場数・成績をリセットする
  if (Array.isArray(gameState.euroTransferList)) {
    const prevSeasonNum = Math.max(1, (gameState.season || 2) - 1);
    const prevBaseYear = 2025 + prevSeasonNum;
    const prevYearStr = `${prevBaseYear}-${String((prevBaseYear + 1) % 100).padStart(2, '0')}`;
    for (const ep of gameState.euroTransferList) {
      if (!ep) continue;
      const eDef = (typeof findEuropeanClubDefinitionById === 'function') ? findEuropeanClubDefinitionById(ep.euroClubId || ep.clubId) : null;
      const eClubName = (eDef && eDef.name) ? eDef.name : '欧州主要クラブ';
      if (!Array.isArray(ep.seasonHistory)) {
        const savedSeason = gameState.season;
        gameState.season = prevSeasonNum;
        ensurePlayerHistoryAndCareer(ep, eClubName);
        gameState.season = savedSeason;
      }
      if (!ep.seasonHistory.some(r => r && r.seasonYear === prevYearStr)) {
        const histApps = Math.min(44, ep.appearances || 0);
        const prevAvg = histApps > 0 && ep.totalRating > 0 ? (ep.totalRating / (ep.appearances || histApps)).toFixed(2) : '-';
        ep.seasonHistory.push({
          seasonYear: prevYearStr,
          clubName: eClubName,
          age: ep.age || 25,
          appearances: histApps,
          goals: ep.goals || 0,
          assists: ep.assists || 0,
          avgRating: prevAvg,
          ovr: getPlayerOverallRating(ep)
        });
      }
      if (ep.seasonHistory.length > 3) {
        ep.seasonHistory = ep.seasonHistory.slice(-3);
      }
      ep.age = (ep.age || 25) + 1;
      ep.appearances = 0;
      ep.goals = 0;
      ep.assists = 0;
      ep.totalRating = 0;
      ep.cleanSheets = 0;
      ep.momCount = 0;
      ep.yellowCards = 0;
      ep.redCards = 0;
    }
  }

  const prevCalendarLen = Array.isArray(gameState.calendar) && gameState.calendar.length > 0 ? gameState.calendar.length : 330;
  if (Array.isArray(gameState.newsFeed)) {
    gameState.newsFeed.forEach(n => {
      if (n) n.dayIndex = Number(n.dayIndex || 0) - prevCalendarLen;
    });
  }
  const inD2 = isPlayerInSecondDivision();
  const activeClubs = getActivePlayerLeagueClubs();
  gameState.totalWeeks = inD2 ? 46 : 38;
  gameState.schedule = generateSeasonSchedule(activeClubs);
  gameState.calendar = generateSeasonCalendar(2025 + gameState.season, gameState.schedule, gameState.totalWeeks);
  if (typeof initSeasonCompetitions === 'function') {
    initSeasonCompetitions();
  }
  gameState.currentDayIndex = 0;
  if (typeof pruneExpiredNewsItems === 'function') pruneExpiredNewsItems(7);
  gameState.isAdvancingCalendar = false;
  if (typeof gmModalQueue !== 'undefined') gmModalQueue.length = 0;
  gameState.dailyLogs = [
    { date: '8/1 (土)', message: `Season ${gameState.season} (${inD2 ? 'ENG-D2' : 'ENG-D1'}) が開幕しました！目標順位達成に向けてチームを指揮しましょう。` }
  ];
  const seasonWish = typeof generateAndSendManagerWishReport === 'function'
    ? generateAndSendManagerWishReport(`Season ${gameState.season} 開幕`)
    : null;
  if (typeof addNewsItem === 'function') {
    addNewsItem({
      category: 'リーグ',
      headline: `Season ${gameState.season} ${inD2 ? 'ENG-D2' : 'ENG-D1'} が開幕、移籍市場もオープン`,
      body: `${playerClub.name}は目標「${playerClub.targetLabel || '上位進出'}」を掲げ新シーズンへ臨む。`,
      highlight: true
    });
  }
  switchTab('office');
  renderAll();
  showSecretaryClubOpeningBriefing(playerClub, playerClub.manager, false, seasonWish);
}

/**
 * タブ切り替え
 */
// 各タブのスクロール位置を記憶するキャッシュマップ
const tabScrollPositions = {
  office: 0,
  team: 0,
  roster: 0,
  facilities: 0,
  market: 0
};

function resetTabScrollPositions() {
  for (const k of Object.keys(tabScrollPositions)) {
    tabScrollPositions[k] = 0;
  }
}

/**
 * タブ切り替え（各タブごとのスクロール位置保持・個別復元に対応）
 */
function switchTab(tabName) {
  if (tabName === 'standings') tabName = 'team';
  if (!tabName) return;

  // 1. 直前のタブのスクロール位置を保存
  const previousTab = gameState.activeTab;
  if (previousTab) {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    tabScrollPositions[previousTab] = currentScrollY;
  }

  gameState.activeTab = tabName;

  // タブ属性を body と html の両方にセット
  document.body.dataset.activeTab = tabName;
  document.body.setAttribute('data-active-tab', tabName);
  document.documentElement.setAttribute('data-active-tab', tabName);

  // 各タブ要素の表示・非表示切り替え
  const tabs = ['team', 'roster', 'office', 'facilities', 'market'];
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

  // 編成タブ・移籍タブに切り替えた場合はサブタブの属性と表示状態を適用（dirtyなタブのみオンデマンド描画）
  renderHeader();
  if (tabName === 'roster') {
    switchRosterSubtab(gameState.rosterSubtab || 'board', dirtyViews.roster);
    dirtyViews.roster = false;
  } else if (tabName === 'market') {
    switchMarketSubtab(gameState.marketSubtab || 'market', dirtyViews.market);
    dirtyViews.market = false;
  } else if (tabName === 'facilities') {
    switchFacilitiesSubtab(gameState.facilitiesSubtab || 'investment', dirtyViews.facilities);
    dirtyViews.facilities = false;
  } else if (tabName === 'team') {
    switchTeamSubtab(gameState.teamSubtab || 'standings', dirtyViews.team);
    dirtyViews.team = false;
  } else {
    renderActiveTabView(false);
  }

  // 2. 切り替え先タブの前回スクロール位置を復元（未スクロール時は 0: 最上部）
  const targetScrollY = tabScrollPositions[tabName] || 0;
  window.scrollTo({
    top: targetScrollY,
    left: 0,
    behavior: 'instant'
  });

  // レンダリング完了後の高さ確定時にも念のため位置を適用
  requestAnimationFrame(() => {
    window.scrollTo({
      top: targetScrollY,
      left: 0,
      behavior: 'instant'
    });
  });
}

/**
 * 編成画面内のサブタブ切り替え（作戦ボード / 選手一覧 / 戦術）
 */
function switchRosterSubtab(subtabKey, shouldRender = true) {
  if (!subtabKey) subtabKey = 'board';
  gameState.rosterSubtab = subtabKey;

  // DOM 属性をセット（CSSでモバイル作戦ボードのスクロール禁止等を連動）
  document.documentElement.setAttribute('data-roster-subtab', subtabKey);
  document.body.setAttribute('data-roster-subtab', subtabKey);
  const rosterView = document.getElementById('view-roster');
  if (rosterView) {
    rosterView.setAttribute('data-roster-subtab', subtabKey);
  }

  const subtabs = ['board', 'players', 'tactics'];
  subtabs.forEach(key => {
    const btn = document.getElementById(`subtab-btn-${key}`);
    const subview = document.getElementById(`roster-subview-${key}`);
    const isActive = (key === subtabKey);

    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    if (subview) {
      if (isActive) {
        subview.classList.remove('hidden');
      } else {
        subview.classList.add('hidden');
      }
    }
  });

  // 作戦ボードタブの場合はスクロールを最上部に固定（スクロールなし完全フィット）
  if (subtabKey === 'board') {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    if (typeof applyPitchNodeNameMarquee === 'function') {
      requestAnimationFrame(() => applyPitchNodeNameMarquee());
    }
    if (shouldRender) {
      if (typeof syncManagerDelegationButtonUI === 'function') syncManagerDelegationButtonUI();
      renderTacticalManagerBanner();
      renderTacticalBoard();
    }
  } else if (shouldRender && subtabKey === 'players') {
    renderRoster();
  } else if (shouldRender && subtabKey === 'tactics') {
    renderTacticsOverview();
  }
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

function isPlayerInSecondDivision() {
  if (Array.isArray(gameState.clubs) && gameState.clubs.some(c => c && c.isPlayer)) {
    return false;
  }
  const d2Clubs = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
  if (Array.isArray(d2Clubs) && d2Clubs.some(c => c && c.isPlayer)) {
    return true;
  }
  return gameState.playerDivision === 'd2';
}

function getActivePlayerLeagueClubs() {
  if (isPlayerInSecondDivision()) {
    const d2Clubs = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
    if (Array.isArray(d2Clubs) && d2Clubs.length > 0) return d2Clubs;
  }
  return gameState.clubs || [];
}

function getAllManagedLeagueClubs() {
  const result = [];
  if (Array.isArray(gameState.clubs)) {
    for (const c of gameState.clubs) {
      if (c && Array.isArray(c.players)) result.push(c);
    }
  }
  const d2Clubs = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
  if (Array.isArray(d2Clubs)) {
    for (const c of d2Clubs) {
      if (c && Array.isArray(c.players)) result.push(c);
    }
  }
  return result;
}

function getClubById(id) {
  if (!id) return null;
  const d1 = Array.isArray(gameState.clubs) ? gameState.clubs.find(c => c.id === id) : null;
  if (d1) return d1;
  const d2Clubs = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
  if (Array.isArray(d2Clubs)) {
    const d2 = d2Clubs.find(c => c.id === id);
    if (d2) return d2;
  }
  return null;
}

function getPlayerClub() {
  const d1Player = Array.isArray(gameState.clubs) ? gameState.clubs.find(c => c && c.isPlayer) : null;
  if (d1Player) return d1Player;
  const d2Clubs = gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs;
  const d2Player = Array.isArray(d2Clubs) ? d2Clubs.find(c => c && c.isPlayer) : null;
  if (d2Player) return d2Player;
  return Array.isArray(gameState.clubs) ? gameState.clubs[0] : null;
}

/**
 * 自チームの選手行クリックによる任意2選手の入れ替え
 */
function handleRosterClick(playerId) {
  if (gameState.isGameOver || gameState.isSimulating) return;
  // 下部選手一覧からの交代操作は廃止（作戦ボード・控え選手エリアのドラッグ＆ドロップに一本化）
  // 行クリック時は詳細プロフィールを表示
  if (playerId) {
    openPlayerProfileModal(playerId);
  }
}

/**
 * Dirty Flag 方式によるアクティブタブ限定レンダリング管理
 */
const dirtyViews = {
  office: true,
  team: true,
  roster: true,
  market: true,
  facilities: true
};

function markAllViewsDirty() {
  dirtyViews.office = true;
  dirtyViews.team = true;
  dirtyViews.roster = true;
  dirtyViews.market = true;
  dirtyViews.facilities = true;
}

function renderActiveTabView(force = false) {
  const active = gameState.activeTab || 'office';
  if (!force && !dirtyViews[active]) return;
  dirtyViews[active] = false;

  if (active === 'office') {
    if (typeof renderSecretaryBriefing === 'function') renderSecretaryBriefing();
    renderWeeklySchedule();
    renderGmDuties();
    if (typeof renderOfficeCommPanel === 'function') renderOfficeCommPanel();
    renderMatchLog();
  } else if (active === 'team') {
    if (gameState.teamSubtab === 'schedule') {
      renderScheduleView();
    } else if (gameState.teamSubtab === 'stats') {
      renderTopScorers();
    } else {
      renderStandings();
    }
  } else if (active === 'roster') {
    if (typeof syncManagerDelegationButtonUI === 'function') syncManagerDelegationButtonUI();
    const rSub = gameState.rosterSubtab || 'board';
    if (rSub === 'board') {
      renderTacticalManagerBanner();
      renderTacticalBoard();
    } else if (rSub === 'tactics') {
      renderTacticalManagerBanner();
      renderTacticsOverview();
    } else {
      renderRoster();
    }
  } else if (active === 'market') {
    if (gameState.marketSubtab === 'shortlist') {
      renderShortlist();
    } else if (gameState.marketSubtab === 'offers') {
      renderIncomingOffers();
    } else {
      renderMarket();
    }
  } else if (active === 'facilities') {
    const fSub = gameState.facilitiesSubtab || 'investment';
    if (fSub === 'staff') {
      renderManagerManagementPanel();
      renderCoachingStaffPanel();
    } else if (fSub === 'youth') {
      renderYouthSquad();
      renderFacilitiesAndYouth();
    } else {
      renderFacilitiesAndYouth();
    }
  }
}

/**
 * 画面全体の描画更新（Dirty Flag方式：常時表示ヘッダー＋現在アクティブなタブのみDOM更新し、デバウンス遅延保存）
 */
function renderAll() {
  if (!gameState.clubs || gameState.clubs.length === 0) return;
  renderHeader();
  renderFinancialAlert();
  renderSeasonSettlement();
  updateMarketBadges();
  if (typeof syncManagerDelegationButtonUI === 'function') {
    syncManagerDelegationButtonUI();
  }
  markAllViewsDirty();
  renderActiveTabView(true);
  if (gameState.hasStartedOnce && typeof scheduleAutoSave === 'function') {
    scheduleAutoSave(120);
  }
}

/**
 * 上部ステータスの描画
 */
function renderHeader() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const currentDay = getCurrentCalendarDay();
  const payroll = getClubTotalPayroll(playerClub);
  const squadCount = (playerClub.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut)).length;

  const setHeaderText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  const headerClubEl = document.getElementById('header-club-name');
  if (headerClubEl) {
    headerClubEl.innerHTML = `${getClubEmblemSvg(playerClub, 24, 'header-club-emblem')}<span>${playerClub.name}</span>`;
  }
  setHeaderText('header-gm-name', gameState.gmName);
  setHeaderText('header-target-rank', `目標：${playerClub.targetLabel || '4位以内'}`);
  setHeaderText('header-season', `${gameState.season}年目`);

  // 日付・曜日表示
  const dateEl = document.getElementById('header-date');
  if (dateEl && currentDay) {
    dateEl.textContent = currentDay.displayDate;
  }

  if (gameState.isGameOver) {
    setHeaderText('header-matchweek', 'GM解任 (GAME OVER)');
  } else if (gameState.isSeasonOver) {
    setHeaderText('header-matchweek', 'オフシーズン (移籍・契約)');
  } else if (gameState.currentWeek === 0 && (!currentDay || !currentDay.isMatchDay)) {
    setHeaderText('header-matchweek', 'PRE-SEASON');
  } else {
    const nextWeek = Math.min(gameState.currentWeek + 1, gameState.totalWeeks);
    setHeaderText('header-matchweek', `第${nextWeek}節 / 全${gameState.totalWeeks}節`);
  }

  const fundsEl = document.getElementById('header-funds');
  if (fundsEl) {
    fundsEl.textContent = formatMoney(playerClub.funds);
    if (playerClub.funds < 0) {
      fundsEl.classList.remove('accent-gold');
      fundsEl.classList.add('text-danger');
    } else {
      fundsEl.classList.remove('text-danger');
      fundsEl.classList.add('accent-gold');
    }
  }

  const weeklyPayroll = getClubWeeklyPayroll(playerClub);
  const safeBudget = getSafeTransferBudget(playerClub);
  const safeBudgetEl = document.getElementById('header-safe-budget');
  if (safeBudgetEl) {
    safeBudgetEl.textContent = `安全 ${formatMoney(safeBudget)}`;
    safeBudgetEl.classList.remove('is-tight', 'is-danger');
    if (safeBudget < 0) {
      safeBudgetEl.classList.add('is-danger');
    } else if (safeBudget < 5000) {
      safeBudgetEl.classList.add('is-tight');
    }
  }

  const payrollEl = document.getElementById('header-payroll');
  if (payrollEl) {
    payrollEl.textContent = `${formatWage(weeklyPayroll)}`;
    payrollEl.title = `週次決済: ${formatWage(weeklyPayroll)} ／ 年間換算: ${formatMoney(payroll)}`;
  }
  setHeaderText('header-squad-size', `SQUAD: ${squadCount}名`);
  setHeaderText('header-supporters', `${playerClub.supporters.toLocaleString()}人`);

  setHeaderText('tab-badge-roster', `${squadCount}名`);

  // 移籍市場バッジ：受信オファーがある場合は赤色強調「〇件打診」、通常時は全流通選手数
  const marketBadge = document.getElementById('tab-badge-market');
  if (marketBadge) {
    const offersCount = (gameState.incomingOffers || []).filter(o => (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') && ((o.daysLeft ?? 1) > 0)).length;
    if (offersCount > 0) {
      marketBadge.textContent = `${offersCount}件打診`;
      marketBadge.classList.add('badge-offer-incoming');
      marketBadge.classList.remove('badge-highlight');
    } else {
      const managedCount = getAllManagedLeagueClubs().reduce((sum, c) => sum + (c.players ? c.players.length : 0), 0);
      const euroCount = Array.isArray(gameState.euroTransferList) ? gameState.euroTransferList.length : 0;
      const freeCount = Array.isArray(gameState.transferMarket) ? gameState.transferMarket.length : 0;
      const totalMarketPlayers = managedCount + euroCount + freeCount;
      marketBadge.textContent = `${totalMarketPlayers}名`;
      marketBadge.classList.remove('badge-offer-incoming');
      if (gameState.isSeasonOver || (currentDay && currentDay.windowOpen)) {
        marketBadge.classList.add('badge-highlight');
      } else {
        marketBadge.classList.remove('badge-highlight');
      }
    }
  }



  const financeBadge = document.getElementById('header-finance-badge');
  if (financeBadge) {
    financeBadge.className = 'finance-status-badge';

    if (gameState.isGameOver) {
      financeBadge.textContent = '債務超過（解任）';
      financeBadge.classList.add('status-danger');
    } else if (playerClub.funds < 0) {
      financeBadge.textContent = '債務超過';
      financeBadge.classList.add('status-danger');
    } else if (safeBudget < 0) {
      financeBadge.textContent = '予算超過注意';
      financeBadge.classList.add('status-warning');
    } else {
      financeBadge.textContent = '健全';
      financeBadge.classList.add('status-healthy');
    }
  }

  // アクションボタン群の制御
  const btnAdvanceDay = document.getElementById('btn-advance-day');
  const btnAdvanceToMatch = document.getElementById('btn-advance-to-match');
  const btnHeaderKickoff = document.getElementById('btn-header-kickoff');
  const btnPlayMatch = document.getElementById('btn-play-match');
  const btnPauseAdvance = document.getElementById('btn-pause-advance');
  const btnPlayNext = document.getElementById('btn-play-next');
  const btnSkipSeason = document.getElementById('btn-skip-season');
  const btnNextSeason = document.getElementById('btn-next-season');
  const btnRestart = document.getElementById('btn-restart-game');

  const isMatchPending = isTodayMatchDayPending();
  const isAdvancing = gameState.isAdvancingCalendar;
  const isBusy = gameState.isSimulating;

  if (btnAdvanceDay) btnAdvanceDay.disabled = isBusy || isMatchPending || isAdvancing;
  if (btnAdvanceToMatch) btnAdvanceToMatch.disabled = isBusy || isMatchPending || isAdvancing;
  if (btnHeaderKickoff) btnHeaderKickoff.disabled = isBusy || isAdvancing;
  if (btnPlayMatch) btnPlayMatch.disabled = isBusy || isAdvancing;
  if (btnSkipSeason) btnSkipSeason.disabled = isBusy || isAdvancing;

  if (gameState.isGameOver) {
    if (btnAdvanceDay) btnAdvanceDay.classList.add('hidden');
    if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
    if (btnHeaderKickoff) btnHeaderKickoff.classList.add('hidden');
    if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
    if (btnPauseAdvance) btnPauseAdvance.classList.add('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.add('hidden');
    if (btnRestart) btnRestart.classList.remove('hidden');
  } else if (gameState.isSeasonOver) {
    if (btnAdvanceDay) btnAdvanceDay.classList.add('hidden');
    if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
    if (btnHeaderKickoff) btnHeaderKickoff.classList.add('hidden');
    if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
    if (btnPauseAdvance) btnPauseAdvance.classList.add('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.remove('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
  } else if (isAdvancing) {
    if (btnAdvanceDay) btnAdvanceDay.classList.add('hidden');
    if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
    if (btnHeaderKickoff) btnHeaderKickoff.classList.add('hidden');
    if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
    if (btnPauseAdvance) btnPauseAdvance.classList.remove('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.add('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
  } else {
    if (btnPauseAdvance) btnPauseAdvance.classList.add('hidden');
    if (btnNextSeason) btnNextSeason.classList.add('hidden');
    if (btnRestart) btnRestart.classList.add('hidden');
    if (btnPlayNext) btnPlayNext.classList.add('hidden');
    if (btnSkipSeason) btnSkipSeason.classList.remove('hidden');

    if (isMatchPending) {
      if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
      if (btnAdvanceToMatch) btnAdvanceToMatch.classList.add('hidden');
      if (btnHeaderKickoff) btnHeaderKickoff.classList.remove('hidden');
      if (btnAdvanceDay) btnAdvanceDay.classList.remove('hidden');
    } else {
      if (btnPlayMatch) btnPlayMatch.classList.add('hidden');
      if (btnHeaderKickoff) btnHeaderKickoff.classList.add('hidden');
      if (btnAdvanceToMatch) btnAdvanceToMatch.classList.remove('hidden');
      if (btnAdvanceDay) btnAdvanceDay.classList.remove('hidden');
    }
  }
}

/**
 * 赤字経営・ゲームオーバー警告バナーの描画（本部以外のUI崩れ防止のため、表示は業務タスク側へ統合）
 */
function renderFinancialAlert() {
  const banner = document.getElementById('financial-alert-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

function openSeasonSettlementModal() {
  const modal = document.getElementById('season-summary-box');
  if (modal) modal.classList.remove('hidden');
}

function closeSeasonSettlementModal() {
  const modal = document.getElementById('season-summary-box');
  if (modal) modal.classList.add('hidden');
}

/**
 * オフシーズン決算・世代交代・契約満了警告サマリーモーダルの描画
 */
function renderSeasonSettlement() {
  const summaryBox = document.getElementById('season-summary-box');
  if (!summaryBox) return;
  if (!gameState.isSeasonOver || !gameState.lastSettlement) {
    closeSeasonSettlementModal();
    return;
  }

  const s = gameState.lastSettlement;
  const playerClub = getPlayerClub();
  const currentPayroll = getClubTotalPayroll(playerClub);
  const weeklyPayroll = getClubWeeklyPayroll(playerClub);
  const safeBudget = getSafeTransferBudget(playerClub);

  const targetStatusText = s.targetAchieved
    ? `目標（${s.targetLabel}）達成！理事会ボーナス +${formatMoney(s.targetBonus)}`
    : `目標（${s.targetLabel}）未達`;

  const headlineEl = document.getElementById('summary-headline');
  if (headlineEl) {
    headlineEl.textContent =
      `${s.season}年目シーズン終了・決算報告（最終順位：第${s.rank}位 ／ ${targetStatusText}）`;
  }

  const settledNote = s.offseasonPayrollSettled > 0
    ? ` ／ オフ残週給与精算(${s.remPayrollWeeks || 0}週分) -${formatMoney(s.offseasonPayrollSettled)}`
    : '';
  const rewardTextEl = document.getElementById('summary-reward-text');
  if (rewardTextEl) {
    rewardTextEl.textContent =
      `収入加算：順位賞金 +${formatMoney(s.prize)} ／ 年間スポンサー・放映権 +${formatMoney(s.sponsorIncome)}${s.targetBonus > 0 ? ` ／ 目標達成ボーナス +${formatMoney(s.targetBonus)}` : ''}（計 +${formatMoney(s.totalIncome)}）${settledNote}`;
  }

  const projEl = document.getElementById('summary-payroll-projection');
  const deficitWarning = playerClub.funds < 0
    ? ' 【警告：現在債務超過です。選手売却・放出で黒字化してから開幕してください】'
    : (safeBudget < 0 ? ' 【注意：週給規模が試合収入見込みを上回っています。過剰補強に注意】' : '');
  if (projEl) {
    projEl.textContent =
      `現在資金：${formatMoney(playerClub.funds)} ／ 来季週給支払い（毎週日曜決済）：${formatWage(weeklyPayroll)}（年間換算 ${formatMoney(currentPayroll)}） ➜ 実質補強可能予算（安全枠）：${formatMoney(safeBudget)}${deficitWarning}`;
    projEl.className = (playerClub.funds < 0 || safeBudget < 0) ? 'mono text-danger' : 'mono accent-green';
  }

  const expiringPlayers = playerClub.players.filter(p => p && p.contractYears <= 0 && !(p.loanStatus && p.loanStatus.isLoan) && !p.preContractDeparture);
  const contractWarnEl = document.getElementById('summary-contract-warning');
  if (contractWarnEl) {
    if (expiringPlayers.length > 0) {
      const names = expiringPlayers.map(p => `${p.pos} ${p.name}`).join('、');
      contractWarnEl.textContent = `【要確認】契約満了選手（${expiringPlayers.length}名）：${names} — 残留させる場合は「所属選手・戦術・契約」タブで「契約延長」を行ってください（未更新のまま開幕するとフリー移籍で退団します）。`;
      contractWarnEl.classList.remove('hidden');
    } else {
      contractWarnEl.textContent = '';
      contractWarnEl.classList.add('hidden');
    }
  }

  const retireEl = document.getElementById('summary-retirement-log');
  if (retireEl) {
    if (s.retirementLogs.length === 0) {
      retireEl.innerHTML = '<div class="text-muted">今シーズンの現役引退選手はいません。</div>';
    } else {
      retireEl.innerHTML = s.retirementLogs.map(line => `<div>${line}</div>`).join('');
    }
  }

  const agingEl = document.getElementById('summary-aging-log');
  if (agingEl) {
    agingEl.innerHTML = s.agingLogs.map(item => {
      const diffClass = item.totalDiff > 0 ? 'diff-up' : (item.totalDiff < 0 ? 'diff-down' : '');
      return `<div><span class="mono">[${item.pos}]</span> ${item.name} (<span class="mono">${item.age}歳</span>) <span class="mono ${diffClass}">総合 ${item.sign}</span></div>`;
    }).join('');
  }

  if (!s._modalShown && !gameState.isGameOver && !gameState.pendingManagerCrisis) {
    s._modalShown = true;
    openSeasonSettlementModal();
  }
}

/**
 * 順位表の描画
 */
function renderStandings() {
  const compView = gameState.selectedCompView || 'league';
  const tableWrapper = document.querySelector('#team-subview-standings .table-wrapper');
  const bracketWrapper = document.getElementById('comp-bracket-wrapper');
  const subnavRow = document.getElementById('comp-subnav-row');
  const statusText = document.getElementById('standings-status-text');
  const legendEl = document.getElementById('standings-legend');

  if (compView === 'league' || compView === 'prem' || compView === 'championship') {
    // リーグ（ENG-D1 / ENG-D2）の切り替え表示
    if (tableWrapper) tableWrapper.classList.remove('hidden');
    if (bracketWrapper) bracketWrapper.classList.add('hidden');
    const defaultDiv = isPlayerInSecondDivision() ? 'd2' : 'd1';
    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      const curDiv = gameState.selectedLeagueDivision || (compView === 'championship' ? 'd2' : defaultDiv);
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">ディビジョン:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curDiv === 'd1' ? 'active' : ''}" data-league-div="d1">ファースト (ENG-D1)</button>
            <button type="button" class="comp-sub-btn mono ${curDiv === 'd2' ? 'active' : ''}" data-league-div="d2">セカンド (ENG-D2)</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('.comp-sub-btn').forEach(b => {
        b.onclick = () => {
          gameState.selectedLeagueDivision = b.dataset.leagueDiv;
          renderStandings();
        };
      });
    }

    const curDiv = gameState.selectedLeagueDivision || (compView === 'championship' ? 'd2' : defaultDiv);

    if (curDiv === 'd1') {
      // イングランド・ファーストディビジョン（ENG-D1）順位表
      const d1Played = gameState.clubs && gameState.clubs[0] ? (gameState.clubs[0].played || 0) : gameState.currentWeek;
      const d1Week = isPlayerInSecondDivision() ? d1Played : gameState.currentWeek;
      if (statusText) statusText.textContent = `ENG-D1 MATCHWEEK ${d1Week} / 38`;
      if (legendEl) {
        legendEl.classList.remove('hidden');
        legendEl.innerHTML = `
          <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-4位: ユーロ・チャンピオンズ・トロフィー（ECT）出場権</span></div>
          <div class="legend-item"><span class="legend-color-box zone-uel-bg"></span><span class="legend-text">5位: ユーロ・プレステージ・カップ（EPC）出場権</span></div>
          <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">18-20位: セカンドディビジョン（ENG-D2）降格</span></div>
        `;
      }

      const sorted = getSortedStandings();
      const tbody = document.getElementById('standings-tbody');
      if (tbody) {
        tbody.innerHTML = sorted.map((club, idx) => {
          const rank = idx + 1;
          const zoneClass = rank <= 4 ? 'zone-ucl' : (rank === 5 ? 'zone-uel' : (rank >= 18 ? 'zone-rel' : ''));
          const rowClass = [club.isPlayer ? 'row-player-club' : '', zoneClass].filter(Boolean).join(' ');
          const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
          const gdSign = club.gd > 0 ? `+${club.gd}` : `${club.gd}`;

          return `
            <tr class="${rowClass}">
              <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span></td>
              <td class="col-team"><span class="team-cell-wrap">${getClubEmblemSvg(club, 20, 'standings-emblem')}<span class="team-name-text">${club.name}</span></span></td>
              <td class="col-num col-played">${club.played}</td>
              <td class="col-num col-won">${club.won}</td>
              <td class="col-num col-drawn">${club.drawn}</td>
              <td class="col-num col-lost">${club.lost}</td>
              <td class="col-num col-gf"><span class="td-pc">${club.gf}</span><span class="td-mob">${club.gf}-${club.ga}</span></td>
              <td class="col-num col-ga">${club.ga}</td>
              <td class="col-num col-gd">${gdSign}</td>
              <td class="col-pts">${club.pts}</td>
            </tr>
          `;
        }).join('');
      }
    } else {
      // イングランド・セカンドディビジョン（ENG-D2）順位表
      if (legendEl) {
        legendEl.classList.remove('hidden');
        legendEl.innerHTML = `
          <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-3位: ファーストディビジョン（ENG-D1）自動昇格</span></div>
          <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">22-24位: 降格圏</span></div>
        `;
      }

      const comp = gameState.competitions && gameState.competitions.championship;
      const sorted = comp && comp.clubs ? [...comp.clubs].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0)) : [];
      const playedCount = sorted[0] ? sorted[0].played || 0 : 0;
      if (statusText) statusText.textContent = `ENG-D2 MATCHWEEK ${playedCount} / 46`;

      const tbody = document.getElementById('standings-tbody');
      if (tbody) {
        tbody.innerHTML = sorted.map((club, idx) => {
          const rank = idx + 1;
          const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
          const gdSign = club.gd > 0 ? `+${club.gd}` : `${club.gd || 0}`;
          const zoneClass = rank <= 3 ? 'zone-promotion' : (rank >= 22 ? 'zone-relegation-p2' : '');
          const rowClass = [club.isPlayer ? 'row-player-club' : '', zoneClass].filter(Boolean).join(' ');

          return `
            <tr class="${rowClass}">
              <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span></td>
              <td class="col-team"><span class="team-cell-wrap">${getClubEmblemSvg(club, 20, 'standings-emblem')}<span class="team-name-text">${club.name}</span></span></td>
              <td class="col-num col-played">${club.played || 0}</td>
              <td class="col-num col-won">${club.won || 0}</td>
              <td class="col-num col-drawn">${club.drawn || 0}</td>
              <td class="col-num col-lost">${club.lost || 0}</td>
              <td class="col-num col-gf"><span class="td-pc">${club.gf || 0}</span><span class="td-mob">${club.gf || 0}-${club.ga || 0}</span></td>
              <td class="col-num col-ga">${club.ga || 0}</td>
              <td class="col-num col-gd">${gdSign}</td>
              <td class="col-pts">${club.pts || 0}</td>
            </tr>
          `;
        }).join('');
      }
    }
  } else if (compView === 'domestic') {
    // 国内カップ戦（トーナメントブラケット表示）
    if (tableWrapper) tableWrapper.classList.add('hidden');
    if (bracketWrapper) bracketWrapper.classList.remove('hidden');
    if (legendEl) legendEl.classList.add('hidden');

    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      const curDom = gameState.selectedDomesticCup || 'leagueCup';
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curDom === 'leagueCup' ? 'active' : ''}" data-sub-cup="leagueCup">リーグ・トロフィー (L-CUP)</button>
            <button type="button" class="comp-sub-btn mono ${curDom === 'nationalCup' ? 'active' : ''}" data-sub-cup="nationalCup">ナショナル・カップ (N-CUP)</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('.comp-sub-btn').forEach(b => {
        b.onclick = () => {
          gameState.selectedDomesticCup = b.dataset.subCup;
          renderStandings();
        };
      });
    }
    const curDom = gameState.selectedDomesticCup || 'leagueCup';
    if (bracketWrapper) {
      bracketWrapper.classList.remove('standings-view');
      bracketWrapper.innerHTML = renderCupBracketHtml(curDom);
    }
    if (statusText) statusText.textContent = curDom === 'leagueCup' ? 'LEAGUE TROPHY (L-CUP)' : 'NATIONAL CUP (N-CUP)';
  } else if (compView === 'europe') {
    // 欧州コンペ：全36チーム スイス方式リーグフェーズ（各8試合） ＆ 日程 ＆ 決勝トーナメント
    if (tableWrapper) tableWrapper.classList.add('hidden');
    if (bracketWrapper) bracketWrapper.classList.remove('hidden');
    if (legendEl) legendEl.classList.add('hidden');

    const playerClub = getPlayerClub();
    if (!gameState.selectedEuroCup && playerClub && gameState.competitions) {
      if (gameState.competitions.championsCup && gameState.competitions.championsCup.participants.some(c => c.id === playerClub.id)) {
        gameState.selectedEuroCup = 'championsCup';
      } else if (gameState.competitions.europaCup && gameState.competitions.europaCup.participants.some(c => c.id === playerClub.id)) {
        gameState.selectedEuroCup = 'europaCup';
      } else if (gameState.competitions.conferenceCup && gameState.competitions.conferenceCup.participants.some(c => c.id === playerClub.id)) {
        gameState.selectedEuroCup = 'conferenceCup';
      }
    }

    const curEuro = gameState.selectedEuroCup || 'championsCup';
    const curTab = gameState.selectedEuroSubtab || 'standings';

    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">欧州大会:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curEuro === 'championsCup' ? 'active' : ''}" data-sub-cup="championsCup">ECT</button>
            <button type="button" class="comp-sub-btn mono ${curEuro === 'europaCup' ? 'active' : ''}" data-sub-cup="europaCup">EPC</button>
            <button type="button" class="comp-sub-btn mono ${curEuro === 'conferenceCup' ? 'active' : ''}" data-sub-cup="conferenceCup">ECS</button>
          </div>
        </div>
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">表示切替:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="euro-phase-btn mono ${curTab === 'standings' ? 'active' : ''}" data-euro-tab="standings">順位表</button>
            <button type="button" class="euro-phase-btn mono ${curTab === 'schedule' ? 'active' : ''}" data-euro-tab="schedule">日程・結果</button>
            <button type="button" class="euro-phase-btn mono ${curTab === 'bracket' ? 'active' : ''}" data-euro-tab="bracket">トーナメント表</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('[data-sub-cup]').forEach(b => {
        b.onclick = () => {
          gameState.selectedEuroCup = b.dataset.subCup;
          renderStandings();
        };
      });
      subnavRow.querySelectorAll('[data-euro-tab]').forEach(b => {
        b.onclick = () => {
          gameState.selectedEuroSubtab = b.dataset.euroTab;
          renderStandings();
        };
      });
    }

    const compName = curEuro === 'championsCup' ? 'EURO CHAMPIONS TROPHY (ECT)' : (curEuro === 'europaCup' ? 'EURO PRESTIGE CUP (EPC)' : 'EURO CONFERENCE SHIELD (ECS)');

    if (curTab === 'standings') {
      if (bracketWrapper) {
        bracketWrapper.classList.add('standings-view');
        bracketWrapper.innerHTML = renderEuroLeaguePhaseStandingsHtml(curEuro);
      }
      if (statusText) statusText.textContent = compName;
    } else if (curTab === 'schedule') {
      if (bracketWrapper) {
        bracketWrapper.classList.remove('standings-view');
        bracketWrapper.innerHTML = renderEuroScheduleListHtml(curEuro);
      }
      if (statusText) statusText.textContent = compName;
    } else {
      if (bracketWrapper) {
        bracketWrapper.classList.remove('standings-view');
        bracketWrapper.innerHTML = renderCupBracketHtml(curEuro);
      }
      if (statusText) statusText.textContent = compName;
    }
  }
}

/**
 * 大会セグメント切り替えナビゲーションの初期化
 */
function setupCompetitionNavListeners() {
  const nav = document.getElementById('comp-segment-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.comp-tab-btn');
    if (!btn || !btn.dataset.comp) return;

    nav.querySelectorAll('.comp-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    gameState.selectedCompView = btn.dataset.comp;
    renderStandings();
  });
}

/**
 * リーグ個人スタッツ（7大カテゴリー：得点・アシスト・評価点・完封・MOM・出場・警告退場）の定義
 */
let currentLeagueStatsCategory = 'goals';

const formatStatsAvgRatingHtml = (avgR) => {
  const info = typeof getRatingTierInfo === 'function' ? getRatingTierInfo(avgR) : { textClass: 'rat-text-none', text: 'N/A' };
  const disp = (avgR === '-' || !avgR) ? 'N/A' : avgR;
  return `<strong class="${info.textClass}">${disp}</strong>`;
};

const LEAGUE_STATS_CATEGORIES = {
  goals: {
    id: 'goals',
    icon: '',
    title: 'リーグ得点ランキング',
    desc: 'イングランド・ディビジョン1 ゴール数ランキング',
    mainColHeader: 'ゴール',
    getScore: p => p.goals || 0,
    formatScore: (val) => `<strong class="accent-gold">${val}</strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => formatStatsAvgRatingHtml(avgR)
  },
  assists: {
    id: 'assists',
    icon: '',
    title: 'リーグアシストランキング',
    desc: '決定的なラストパスを供給したアシスト王争い',
    mainColHeader: 'アシスト',
    getScore: p => p.assists || 0,
    formatScore: (val) => `<strong class="text-cyan">${val}</strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => formatStatsAvgRatingHtml(avgR)
  },
  ratings: {
    id: 'ratings',
    icon: '',
    title: 'リーグ平均評価点ランキング',
    desc: '公式戦2試合以上出場のハイパフォーマンス選手（平均7.0以上が高水準）',
    mainColHeader: '平均評価',
    getScore: (p, apps) => (apps >= 2 ? (p.totalRating / apps) : 0),
    formatScore: (val) => {
      const info = typeof getRatingTierInfo === 'function' ? getRatingTierInfo(val) : { textClass: 'rat-text-mid', text: val.toFixed(2) };
      return `<strong class="${info.textClass}">${val.toFixed(2)}</strong>`;
    },
    secondaryColHeader: 'G / A',
    formatSecondary: (p) => `<strong>${p.goals || 0}G / ${p.assists || 0}A</strong>`
  },
  cleansheets: {
    id: 'cleansheets',
    icon: '',
    title: 'クリーンシートランキング',
    desc: '相手攻撃をシャットアウトした守護神（GK）＆DF陣の完封記録',
    filter: p => ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.assignedPos || p.pos) || POS_ROLE_GROUP[p.pos] === 'GK' || POS_ROLE_GROUP[p.pos] === 'DF',
    mainColHeader: 'クリーンシート',
    getScore: p => p.cleanSheets || 0,
    formatScore: (val) => `<strong class="accent-gold">${val} <small style="font-size:10px; color:var(--text-muted);">試合</small></strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => formatStatsAvgRatingHtml(avgR)
  },
  moms: {
    id: 'moms',
    icon: '',
    title: 'MOMランキング',
    desc: '試合で最も輝いたMVP選出回数トップのスタープレイヤー',
    mainColHeader: 'MOM獲得数',
    getScore: p => p.momCount || 0,
    formatScore: (val) => `<strong class="accent-gold">${val} <small style="font-size:10px; color:var(--text-muted);">回</small></strong>`,
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => formatStatsAvgRatingHtml(avgR)
  },
  appearances: {
    id: 'appearances',
    icon: '',
    title: 'リーグ最多出場ランキング',
    desc: 'チームを支え続けるタフな最多出場記録（疲労度併記）',
    mainColHeader: '出場数',
    getScore: p => p.appearances || 0,
    formatScore: (val, p) => {
      const ftg = typeof getPlayerFatigue === 'function' ? getPlayerFatigue(p) : 0;
      const ftgSt = typeof getPlayerFatigueStatus === 'function' ? getPlayerFatigueStatus(ftg) : { color: '#2ecc71', label: '万全' };
      return `<strong>${val}試合</strong> <span class="mono" style="font-size:9.5px; color:${ftgSt.color}; margin-left:4px;">(疲労:${ftg})</span>`;
    },
    secondaryColHeader: '平均評価',
    formatSecondary: (p, avgR) => formatStatsAvgRatingHtml(avgR)
  },
  cards: {
    id: 'cards',
    icon: '',
    title: '警告・退場ランキング',
    desc: '激しいファウル・警告カードを受けたカード枚数ランキング',
    mainColHeader: '警告数 (黄)',
    getScore: p => ((p.redCards || 0) * 3 + (p.yellowCards || 0)),
    formatScore: (val, p) => `<strong style="color:#fbbf24;">${p.yellowCards || 0}枚</strong>`,
    secondaryColHeader: '退場数 (赤)',
    formatSecondary: (p) => `<strong style="color:#f87171;">${p.redCards || 0}枚</strong>`
  }
};

/**
 * 個人スタッツの選択中大会キーと表示ラベルを解決し、大会サブナビUIを描画する
 */
function resolveStatsCompetitionAndRenderNav() {
  let compGroup = gameState.statsCompView || 'league';
  if (!['league', 'domestic', 'europe'].includes(compGroup)) {
    compGroup = 'league';
    gameState.statsCompView = 'league';
  }
  const segNav = document.getElementById('stats-comp-segment-nav');
  if (segNav) {
    segNav.querySelectorAll('.comp-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.statsComp === compGroup);
    });
  }

  const subnavRow = document.getElementById('stats-comp-subnav-row');
  const playerClub = getPlayerClub();
  let compKey = 'd1';
  let compShortLabel = 'ENG-D1';
  let compFullLabel = 'イングランド・ディビジョン1';

  if (compGroup === 'league') {
    const defaultDiv = isPlayerInSecondDivision() ? 'd2' : 'd1';
    const curDiv = gameState.statsLeagueDivision || defaultDiv;
    compKey = curDiv;
    compShortLabel = curDiv === 'd2' ? 'ENG-D2' : 'ENG-D1';
    compFullLabel = curDiv === 'd2' ? 'イングランド・セカンドディビジョン' : 'イングランド・ディビジョン1';
    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">ディビジョン:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curDiv === 'd1' ? 'active' : ''}" data-stats-div="d1">ファースト (ENG-D1)</button>
            <button type="button" class="comp-sub-btn mono ${curDiv === 'd2' ? 'active' : ''}" data-stats-div="d2">セカンド (ENG-D2)</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('[data-stats-div]').forEach(b => {
        b.onclick = () => {
          gameState.statsLeagueDivision = b.dataset.statsDiv;
          renderLeagueStats(currentLeagueStatsCategory);
        };
      });
    }
  } else if (compGroup === 'domestic') {
    const curDom = gameState.statsDomesticCup || 'leagueCup';
    compKey = curDom;
    compShortLabel = curDom === 'nationalCup' ? 'N-CUP' : 'L-CUP';
    compFullLabel = curDom === 'nationalCup' ? 'ナショナル・カップ (N-CUP)' : 'リーグ・トロフィー (L-CUP)';
    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curDom === 'leagueCup' ? 'active' : ''}" data-stats-dom="leagueCup">リーグ・トロフィー (L-CUP)</button>
            <button type="button" class="comp-sub-btn mono ${curDom === 'nationalCup' ? 'active' : ''}" data-stats-dom="nationalCup">ナショナル・カップ (N-CUP)</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('[data-stats-dom]').forEach(b => {
        b.onclick = () => {
          gameState.statsDomesticCup = b.dataset.statsDom;
          renderLeagueStats(currentLeagueStatsCategory);
        };
      });
    }
  } else if (compGroup === 'europe') {
    if (!gameState.statsEuroCup && playerClub && gameState.competitions) {
      for (const ek of ['championsCup', 'europaCup', 'conferenceCup']) {
        const ec = gameState.competitions[ek];
        if (ec && Array.isArray(ec.participants) && ec.participants.some(c => c.id === playerClub.id)) {
          gameState.statsEuroCup = ek;
          break;
        }
      }
    }
    const curEuro = gameState.statsEuroCup || 'championsCup';
    compKey = curEuro;
    compShortLabel = curEuro === 'europaCup' ? 'EPC' : (curEuro === 'conferenceCup' ? 'ECS' : 'ECT');
    compFullLabel = curEuro === 'europaCup'
      ? 'ユーロ・プレステージ・カップ (EPC)'
      : (curEuro === 'conferenceCup' ? 'ユーロ・カンファレンス・シールド (ECS)' : 'ユーロ・チャンピオンズ・トロフィー (ECT)');
    if (subnavRow) {
      subnavRow.classList.remove('hidden');
      subnavRow.innerHTML = `
        <div class="comp-subnav-group">
          <span class="comp-subnav-label mono">欧州大会:</span>
          <div class="comp-subnav-btns">
            <button type="button" class="comp-sub-btn mono ${curEuro === 'championsCup' ? 'active' : ''}" data-stats-euro="championsCup">ECT</button>
            <button type="button" class="comp-sub-btn mono ${curEuro === 'europaCup' ? 'active' : ''}" data-stats-euro="europaCup">EPC</button>
            <button type="button" class="comp-sub-btn mono ${curEuro === 'conferenceCup' ? 'active' : ''}" data-stats-euro="conferenceCup">ECS</button>
          </div>
        </div>
      `;
      subnavRow.querySelectorAll('[data-stats-euro]').forEach(b => {
        b.onclick = () => {
          gameState.statsEuroCup = b.dataset.statsEuro;
          renderLeagueStats(currentLeagueStatsCategory);
        };
      });
    }
  }

  return { compKey, compGroup, compShortLabel, compFullLabel };
}
function renderLeagueStats(catKey = 'goals') {
  currentLeagueStatsCategory = catKey;
  const config = LEAGUE_STATS_CATEGORIES[catKey] || LEAGUE_STATS_CATEGORIES.goals;
  const { compKey, compShortLabel, compFullLabel } = resolveStatsCompetitionAndRenderNav();

  const titleEl = document.getElementById('stats-panel-title');
  const subtitleEl = document.getElementById('stats-panel-subtitle');
  const theadEl = document.getElementById('stats-ranking-thead');
  const tbody = document.getElementById('top-scorers-tbody');

  const baseTitleSuffix = config.title.replace(/^リーグ/, '');
  if (titleEl) titleEl.textContent = `${compShortLabel} ${baseTitleSuffix}`;
  if (subtitleEl) subtitleEl.textContent = `${compShortLabel} TOP 10`;

  const navBar = document.getElementById('stats-category-nav-bar');
  if (navBar) {
    navBar.querySelectorAll('.stats-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.statsCat === catKey);
    });
  }

  if (theadEl) {
    theadEl.innerHTML = `
      <tr>
        <th class="col-rank">順位</th>
        <th class="col-pos">POS</th>
        <th class="col-name">選手名</th>
        <th class="col-team">所属クラブ</th>
        <th class="col-num">出場</th>
        <th class="col-num">${config.mainColHeader}</th>
        <th class="col-num">${config.secondaryColHeader}</th>
      </tr>
    `;
  }

  if (!tbody) return;

  const bucket = (gameState.competitionStats && gameState.competitionStats[compKey]) ? gameState.competitionStats[compKey] : {};
  const bucketEntries = Object.values(bucket);
  const allPlayers = [];

  if (bucketEntries.length > 0) {
    const maxAppsInComp = bucketEntries.reduce((mx, e) => Math.max(mx, e.apps || 0), 0);
    const minAppsForRating = maxAppsInComp >= 2 ? 2 : 1;

    for (const entry of bucketEntries) {
      if (!entry || !entry.id) continue;
      const ctx = findPlayerWithContextById(entry.id);
      const baseP = ctx ? ctx.player : null;
      if (baseP && baseP.isRetired) continue;

      const compViewPlayer = {
        ...(baseP || {}),
        id: entry.id,
        name: (baseP && baseP.name) || entry.name || '選手',
        pos: (baseP && baseP.pos) || entry.pos || 'MF',
        primaryPosition: (baseP && baseP.primaryPosition) || entry.pos || 'MF',
        squadNumber: (baseP && baseP.squadNumber) || entry.squadNumber || 10,
        appearances: entry.apps || 0,
        goals: entry.goals || 0,
        assists: entry.assists || 0,
        totalRating: entry.totalRating || 0,
        cleanSheets: entry.cleanSheets || 0,
        momCount: entry.momCount || 0,
        yellowCards: entry.yellowCards || 0,
        redCards: entry.redCards || 0,
        fatigue: baseP ? baseP.fatigue : 0
      };

      if (config.filter && !config.filter(compViewPlayer)) continue;
      const apps = compViewPlayer.appearances;
      const avgRating = apps > 0 ? (compViewPlayer.totalRating / apps).toFixed(1) : 'N/A';
      const score = catKey === 'ratings'
        ? (apps >= minAppsForRating ? (compViewPlayer.totalRating / apps) : 0)
        : config.getScore(compViewPlayer, apps);

      allPlayers.push({
        player: compViewPlayer,
        clubName: (ctx && !ctx.isMarket && ctx.clubName) ? ctx.clubName : (entry.clubName || '所属クラブ'),
        isPlayerClub: Boolean((ctx && ctx.isPlayerClub) || entry.isPlayerClub),
        apps,
        avgRating,
        score
      });
    }
  } else if (compKey === 'd1' || compKey === 'd2') {
    const targetClubs = compKey === 'd2'
      ? ((gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || [])
      : (gameState.clubs || []);
    if (targetClubs.some(c => c && (c.played || 0) > 0)) {
      for (const club of targetClubs) {
        for (const p of (club.players || [])) {
          if (p.isRetired || (config.filter && !config.filter(p))) continue;
          const apps = p.appearances || 0;
          const avgRating = apps > 0 ? (p.totalRating / apps).toFixed(1) : 'N/A';
          allPlayers.push({ player: p, clubName: club.name, isPlayerClub: club.isPlayer, apps, avgRating, score: config.getScore(p, apps) });
        }
      }
    }
  }

  allPlayers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const rateA = parseFloat(a.avgRating) || 0;
    const rateB = parseFloat(b.avgRating) || 0;
    if (rateB !== rateA) return rateB - rateA;
    return b.apps - a.apps;
  });

  const top10 = allPlayers.slice(0, 10);
  const hasData = top10.length > 0 && top10[0].score > 0;

  if (!hasData) {
    const matchKind = compKey === 'preseasonCup' ? 'プレシーズン親善杯 (WCT)' : `${compFullLabel}の試合`;
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-log-message">まだ${compShortLabel}における${config.mainColHeader}の記録がありません。${matchKind}が進行するとリアルタイム集計されます。</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = top10.map((item, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-badge rank-1' : (rank <= 3 ? 'rank-badge rank-2' : 'rank-badge');
    const rowClass = item.isPlayerClub ? 'row-player-club' : '';

    return `
      <tr class="${rowClass}">
        <td class="col-rank"><span class="${rankClass}">${rank}</span></td>
        <td class="col-pos">${formatPlayerPositionsHtml(item.player)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${item.player.id}" title="クリックで選手詳細プロフィールを表示">
            ${getPlayerAvatarHtml(item.player, null, 'avatar-sm table-avatar')}${item.player.name}
          </button>
        </td>
        <td class="col-team"><span class="team-cell-wrap">${getClubEmblemSvg(item.clubName, 18, 'scorers-emblem')}<span class="team-name-text">${item.clubName}</span></span></td>
        <td class="col-num">${item.apps}</td>
        <td class="col-num">${config.formatScore(item.score, item.player)}</td>
        <td class="col-num">${config.formatSecondary(item.player, item.avgRating)}</td>
      </tr>
    `;
  }).join('');

  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * リーグ得点ランキング（下位互換ラッパー）
 */
function renderTopScorers() {
  renderLeagueStats(currentLeagueStatsCategory);
}

/**
 * 試合結果ログおよびMATCHDAY対戦カードの描画
 */
function renderMatchLog() {
  if (gameState.isSimulating) {
    return;
  }

  const matchdaySection = document.getElementById('office-matchday-section');
  const matchdayHero = document.getElementById('matchday-hero-container');
  const container = document.getElementById('match-results-container');
  const panelTitle = document.getElementById('log-panel-title');
  const subtitle = document.getElementById('log-panel-subtitle');

  const playerClub = getPlayerClub();
  const currentDay = getCurrentCalendarDay();
  const isMatchPending = isTodayMatchDayPending();

  // パターン1：本日が未消化の試合日（MATCHDAY / カップ戦 / 欧州戦）
  const playerMatchInfo = isMatchPending && currentDay ? getCalendarDayPlayerMatch(currentDay) : null;
  if (isMatchPending && currentDay && playerMatchInfo) {
    const isHome = playerMatchInfo.isHome;
    const oppClub = playerMatchInfo.oppClub;
    const home = isHome ? playerClub : oppClub;
    const away = isHome ? oppClub : playerClub;

    const calcClubOvr = (c) => {
      if (!c) return 70;
      if (c.players && c.players.length > 0) {
        return Math.round(c.players.slice(0, 11).reduce((s, p) => s + getPlayerOverallRating(p), 0) / Math.min(11, c.players.length));
      }
      return c.ovr || 72;
    };

    const homeOvr = calcClubOvr(home);
    const awayOvr = calcClubOvr(away);

    const myMatchHtml = `
      <div class="matchday-card-preview">
        <div class="matchday-preview-header">
          <span class="matchday-badge-big">${playerMatchInfo.title}</span>
          <span class="mono accent-green">${currentDay.displayDate}</span>
        </div>
        <div class="matchday-vs-hero">
          <div class="matchday-club-side ${home.isPlayer ? 'is-player-side' : ''}">
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:3px;">
              ${getClubEmblemSvg(home, 26, 'matchday-club-emblem')}
              <span class="matchday-club-name mono" style="font-weight:800; font-size:15px; letter-spacing:0.05em;">${getClubShortCode(home)}</span>
            </div>
            <span class="matchday-club-ovr">OVR <strong class="${getOvrTierClass(homeOvr)}">${homeOvr}</strong> ${home.isPlayer ? '(自チーム)' : ''}</span>
          </div>
          <div class="matchday-vs-badge">VS</div>
          <div class="matchday-club-side ${away.isPlayer ? 'is-player-side' : ''}">
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:3px;">
              <span class="matchday-club-name mono" style="font-weight:800; font-size:15px; letter-spacing:0.05em;">${getClubShortCode(away)}</span>
              ${getClubEmblemSvg(away, 26, 'matchday-club-emblem')}
            </div>
            <span class="matchday-club-ovr">OVR <strong class="${getOvrTierClass(awayOvr)}">${awayOvr}</strong> ${away.isPlayer ? '(自チーム)' : ''}</span>
          </div>
        </div>
        <div class="matchday-action-row matchday-action-dual">
          <button type="button" class="btn btn-primary btn-kickoff-pulse" id="btn-panel-kickoff" title="${playerMatchInfo.title}の作戦確認・観戦を開始">
            観戦キックオフ ▶
          </button>
          <button type="button" class="btn btn-secondary mono" id="btn-panel-quick-result" title="作戦確認・2D試合経過を省略して即座に結果サマリーを表示">
            クイック結果 ▶|
          </button>
        </div>
      </div>
    `;

    // 業務タスク直下のMATCHDAYヒーローコンテナに本日の自チーム対戦カードを描画
    if (matchdaySection && matchdayHero) {
      matchdaySection.classList.remove('hidden');
      matchdayHero.innerHTML = myMatchHtml;

      // MATCHDAY内のキックオフ＆クイック結果ボタンのイベントバインド
      const panelKickoffBtn = document.getElementById('btn-panel-kickoff');
      if (panelKickoffBtn) {
        panelKickoffBtn.addEventListener('click', () => openMatchPrecheckModal());
      }
      const panelQuickBtn = document.getElementById('btn-panel-quick-result');
      if (panelQuickBtn) {
        panelQuickBtn.addEventListener('click', () => playQuickMatchResult());
      }
    }

    if (container) {
      if (panelTitle) panelTitle.textContent = '本日の同日開催カード';

      let otherMatches = [];
      if (currentDay.isMatchDay && Array.isArray(currentDay.matchFixture)) {
        if (subtitle) subtitle.textContent = `第${currentDay.matchWeek}節 他9試合`;
        otherMatches = currentDay.matchFixture.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id));
      } else if (currentDay.isCupMatchDay) {
        if (playerMatchInfo && playerMatchInfo.type === 'euroLeague') {
          const comp = playerMatchInfo.comp;
          const md = currentDay.euroMd || (comp && comp.currentMatchweek) || 1;
          const euroSchedule = comp && comp.leagueSchedule && comp.leagueSchedule[md - 1];
          if (Array.isArray(euroSchedule)) {
            otherMatches = euroSchedule.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id)).slice(0, 8);
          }
          if (subtitle) subtitle.textContent = `${playerMatchInfo.title} 同日他カード`;
        } else if (playerMatchInfo && playerMatchInfo.type === 'euroPlayoff') {
          const comp = playerMatchInfo.comp;
          if (comp && Array.isArray(comp.playoffs)) {
            otherMatches = comp.playoffs.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id)).slice(0, 8);
          }
          if (subtitle) subtitle.textContent = `${playerMatchInfo.title} 同日他カード`;
        } else if (playerMatchInfo && playerMatchInfo.type === 'cup') {
          const comp = playerMatchInfo.comp;
          const rKey = currentDay.cupRoundKey;
          const roundMatches = comp && comp.rounds && comp.rounds[rKey];
          if (Array.isArray(roundMatches)) {
            otherMatches = roundMatches.filter(m => !(m.homeId === playerClub.id || m.awayId === playerClub.id)).slice(0, 8);
          }
          if (subtitle) subtitle.textContent = `${playerMatchInfo.title} 同日他カード`;
        } else {
          if (subtitle) subtitle.textContent = 'カップ戦・欧州コンペ開催日';
        }
      }

      if (otherMatches.length > 0) {
        const otherMatchesHtml = `
          ${otherMatches.map(m => {
            const h = m.homeClub || getClubById(m.homeId) || { name: m.homeId };
            const a = m.awayClub || getClubById(m.awayId) || { name: m.awayId };
            const hName = typeof getClubShortCode === 'function' ? getClubShortCode(h) : (h.shortName || h.name);
            const aName = typeof getClubShortCode === 'function' ? getClubShortCode(a) : (a.shortName || a.name);
            const hEmb = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(h, 20, 'mini-emblem') : '';
            const aEmb = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(a, 20, 'mini-emblem') : '';
            return `
              <div class="match-card">
                <div class="match-team home" style="display:flex;align-items:center;gap:4px;justify-content:flex-end;">
                  <span>${hName}</span>${hEmb}
                </div>
                <div class="match-score-box">VS</div>
                <div class="match-team away" style="display:flex;align-items:center;gap:4px;justify-content:flex-start;">
                  ${aEmb}<span>${aName}</span>
                </div>
              </div>
            `;
          }).join('')}
        `;
        container.innerHTML = otherMatchesHtml;
      } else {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:12px;">同日開催の他試合はありません。</div>';
      }
    }
    return;
  }

  // 試合日以外（平日・試合消化済み）：業務タスク下のMATCHDAYは非表示
  if (matchdaySection) {
    matchdaySection.classList.add('hidden');
    if (matchdayHero) matchdayHero.innerHTML = '';
  }

  // 画面下に試合ログコンテナが存在しない場合はここで終了
  if (!container) return;

  // パターン2：試合直後または試合消化済み（コンテナが存在する場合の後方互換）
  if (panelTitle) panelTitle.textContent = '試合結果・進行ログ';

  if (gameState.lastWeekResults.length === 0) {
    if (subtitle) subtitle.textContent = 'READY FOR KICKOFF';
    const nextMatches = gameState.schedule[0] || [];
    container.innerHTML = `
      <div class="empty-log-message">シーズン開幕前です。「次の試合まで進める」または「日程を進める」でシーズンを開始してください。</div>
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
  if (subtitle) subtitle.textContent = `MATCHWEEK ${weekNum} RESULTS`;

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

  // 直近の日報ミニログ
  let dailyLogHtml = '';
  if (gameState.dailyLogs && gameState.dailyLogs.length > 0) {
    dailyLogHtml = `
      <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px 10px; margin-bottom: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--accent-green); margin-bottom: 4px;">RECENT CLUB LOGS / 直近のクラブ動向</div>
        ${gameState.dailyLogs.slice(0, 3).map(log => `
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 2px;">
            <span class="mono" style="color: var(--text-main); font-weight: 700;">[${log.date}]</span> ${log.message}
          </div>
        `).join('')}
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

  container.innerHTML = dailyLogHtml + tickerHtml + cardsHtml;
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
  const formationSelectMobile = document.getElementById('formation-select-mobile');
  if (formationSelectMobile) {
    formationSelectMobile.value = formationKey;
  }

  const formationLabelEl = document.getElementById('roster-formation-label');
  if (formationLabelEl) {
    formationLabelEl.textContent = formationDef.name;
  }

  const pitchLayer = document.getElementById('pitch-nodes-layer');
  if (pitchLayer) {
    const existingNodes = pitchLayer.querySelectorAll('.pitch-node[data-slot-index]');
    const canUpdateInPlace = existingNodes.length === formationDef.slots.length;

    if (canUpdateInPlace) {
      formationDef.slots.forEach(sl => {
        const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === sl.slotIndex);
        const nodeEl = pitchLayer.querySelector(`.pitch-node[data-slot-index="${sl.slotIndex}"]`);
        if (!starter || !nodeEl) return;

        const fitInfo = getPositionFitInfo(starter, sl.pos);
        const posDisplay = formatPlayerPositionsText(starter, 'slash');
        const isSelected = gameState.selectedSlotIndex === sl.slotIndex;
        const effOvr = getEffectivePlayerRating(starter);
        const roleGroup = POS_ROLE_GROUP[sl.pos] || 'MF';

        const fitClass = fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out';

        const nodeClasses = [
          'pitch-node',
          `pos-group-${roleGroup}`,
          fitClass,
          isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');

        const fitBadgeHtml = starter.loanStatus?.isLoan ? '<span class="pitch-node-loan" title="レンタル加入選手">LOAN</span>' : '';
        const capBadgeHtml = (playerClub.roles && playerClub.roles.captainId === starter.id) ? '<span class="pitch-node-cap" title="チームキャプテン">©</span>' : '';
        const isSusp = typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(starter, 'league');
        const suspBadgeHtml = isSusp ? '<span class="pitch-node-susp" title="累積警告/退場により出場停止">停</span>' : '';

        const injuryBadgeHtml = starter.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${starter.injuryWeeks}節）">傷</span>`
          : '';

        nodeEl.className = nodeClasses;
        nodeEl.dataset.playerId = starter.id;
        nodeEl.style.left = `${sl.x}%`;
        nodeEl.style.top = `${sl.y}%`;
        nodeEl.innerHTML = `
          <div class="pitch-node-avatar-wrap">
            ${getPlayerAvatarHtml(starter, playerClub, 'pitch-node-avatar', 48)}
            <span class="pitch-node-ovr ${getOvrTierClass(effOvr)}">${effOvr}</span>
          </div>
          <div class="pitch-node-body">
            <div class="pitch-node-top">
              <span class="pitch-node-pos">${sl.pos}</span>
              <span class="pitch-node-num mono">#${starter.squadNumber || '-'}</span>
              ${capBadgeHtml}
              ${fitBadgeHtml}
              ${suspBadgeHtml}
              ${injuryBadgeHtml}
            </div>
            <div class="pitch-node-name-btn clickable-player-name" data-profile-id="${starter.id}" title="タップで選手詳細プロフィールを表示">
              <span class="pitch-node-name-viewport"><span class="pitch-node-name-text">${starter.name}</span></span>
            </div>
            <div class="pitch-node-meta">
              <span class="pitch-node-pref">${posDisplay}</span>
            </div>
          </div>
        `;
      });
    } else {
      pitchLayer.innerHTML = formationDef.slots.map(sl => {
        const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === sl.slotIndex);
        if (!starter) return '';

        const fitInfo = getPositionFitInfo(starter, sl.pos);
        const posDisplay = formatPlayerPositionsText(starter, 'slash');
        const isSelected = gameState.selectedSlotIndex === sl.slotIndex;
        const effOvr = getEffectivePlayerRating(starter);
        const roleGroup = POS_ROLE_GROUP[sl.pos] || 'MF';

        const fitClass = fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out';

        const nodeClasses = [
          'pitch-node',
          `pos-group-${roleGroup}`,
          fitClass,
          isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');

        const fitBadgeHtml = starter.loanStatus?.isLoan ? '<span class="pitch-node-loan" title="レンタル加入選手">LOAN</span>' : '';
        const capBadgeHtml = (playerClub.roles && playerClub.roles.captainId === starter.id) ? '<span class="pitch-node-cap" title="チームキャプテン">©</span>' : '';
        const isSusp = typeof isPlayerSuspendedForComp === 'function' && isPlayerSuspendedForComp(starter, 'league');
        const suspBadgeHtml = isSusp ? '<span class="pitch-node-susp" title="累積警告/退場により出場停止">停</span>' : '';

        const injuryBadgeHtml = starter.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${starter.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="${nodeClasses}" data-slot-index="${sl.slotIndex}" data-player-id="${starter.id}" style="left: ${sl.x}%; top: ${sl.y}%;" title="ドラッグで選手交代 / タップで詳細プロフィール表示">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(starter, playerClub, 'pitch-node-avatar', 48)}
              <span class="pitch-node-ovr ${getOvrTierClass(effOvr)}">${effOvr}</span>
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${sl.pos}</span>
                <span class="pitch-node-num mono">#${starter.squadNumber || '-'}</span>
                ${capBadgeHtml}
                ${fitBadgeHtml}
                ${suspBadgeHtml}
                ${injuryBadgeHtml}
              </div>
              <div class="pitch-node-name-btn clickable-player-name" data-profile-id="${starter.id}" title="タップで選手詳細プロフィールを表示">
                <span class="pitch-node-name-viewport"><span class="pitch-node-name-text">${starter.name}</span></span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(pitchLayer);
  }

  // 右側：控え（ベンチ最大9名）およびベンチ外（リザーブ）リスト描画
  const subTitleEl = document.getElementById('pitch-sub-title');
  const clearBtnEl = document.getElementById('btn-clear-slot-select');
  const subGuideEl = document.getElementById('pitch-sub-guide');
  const benchListEl = document.getElementById('pitch-bench-list');
  const reservesBoxEl = document.getElementById('pitch-reserves-box');
  const reservesTitleEl = document.getElementById('pitch-reserves-title');
  const reservesListEl = document.getElementById('pitch-reserves-list');

  if (!benchListEl) return;

  const allNonStarters = playerClub.players.filter(p => p && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const effectiveBenchLimit = typeof getEffectiveBenchLimit === 'function' ? getEffectiveBenchLimit(playerClub) : 9;
  const benchPlayers = allNonStarters.filter(p => p.isBench !== false).slice(0, effectiveBenchLimit);
  const reservePlayers = allNonStarters.filter(p => !benchPlayers.some(bp => bp.id === p.id));

  const selectedSlot = gameState.selectedSlotIndex !== null ? formationDef.slots[gameState.selectedSlotIndex] : null;
  const selectedStarter = selectedSlot
    ? playerClub.players.find(p => p.isStarter && p.slotIndex === selectedSlot.slotIndex)
    : null;

  if (selectedSlot && selectedStarter) {
    const starterEff = getEffectivePlayerRating(selectedStarter);
    if (subTitleEl) subTitleEl.textContent = `交代枠: [${selectedSlot.pos}] #${selectedStarter.squadNumber} ${selectedStarter.name}`;
    if (clearBtnEl) clearBtnEl.classList.remove('hidden');
    if (subGuideEl) subGuideEl.textContent = '';

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
        const posDisplay = formatPlayerPositionsText(bp, 'slash');
        const roleGroup = POS_ROLE_GROUP[bp.pos] || 'MF';

        const fitClass = fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out';
        const itemClass = fitClass;
        const fitBadgeHtml = '';

        const injuryBadgeHtml = bp.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${bp.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="pitch-node pos-group-${roleGroup} bench-sub-item ${itemClass}" data-player-id="${bp.id}" title="ドラッグまたはクリックで選手交代">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(bp, playerClub, 'pitch-node-avatar', 48)}
              <span class="pitch-node-ovr ${getOvrTierClass(simOvr)}">${simOvr}</span>
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${bp.pos}</span>
                <span class="pitch-node-num mono">#${bp.squadNumber || '-'}</span>
              </div>
              <div class="pitch-node-name-btn">
                <span class="pitch-node-name-viewport"><span class="pitch-node-name-text">${bp.name}</span></span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${fitBadgeHtml}
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } else {
    const benchSuffix = effectiveBenchLimit < 9 ? ` [制限:${effectiveBenchLimit}名]` : '';
    if (subTitleEl) subTitleEl.textContent = `控え選手 (${benchPlayers.length}名${benchSuffix})`;
    const sideBenchBadge = document.getElementById('side-bench-badge');
    if (sideBenchBadge) sideBenchBadge.textContent = `${benchPlayers.length}/${effectiveBenchLimit}`;
    if (clearBtnEl) clearBtnEl.classList.add('hidden');
    if (subGuideEl) subGuideEl.textContent = '';

    const sortedBench = [...benchPlayers].sort((a, b) => {
      const orderA = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[a.pos] : 99) || 99;
      const orderB = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[b.pos] : 99) || 99;
      if (orderA !== orderB) return orderA - orderB;
      return getPlayerOverallRating(b) - getPlayerOverallRating(a);
    });

    if (sortedBench.length === 0) {
      benchListEl.innerHTML = `<div class="empty-log-message">控え選手がいません。</div>`;
    } else {
      benchListEl.innerHTML = sortedBench.map(bp => {
        const baseOvr = getPlayerOverallRating(bp);
        const posDisplay = formatPlayerPositionsText(bp, 'slash');
        const roleGroup = POS_ROLE_GROUP[bp.pos] || 'MF';

        const fitBadgeHtml = '';

        const injuryBadgeHtml = bp.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${bp.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="pitch-node pos-group-${roleGroup} bench-sub-item" data-player-id="${bp.id}" title="ドラッグまたはクリックで選手交代">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(bp, playerClub, 'pitch-node-avatar', 48)}
              <span class="pitch-node-ovr ${getOvrTierClass(baseOvr)}">${baseOvr}</span>
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${bp.pos}</span>
                <span class="pitch-node-num mono">#${bp.squadNumber || '-'}</span>
              </div>
              <div class="pitch-node-name-btn">
                <span class="pitch-node-name-viewport"><span class="pitch-node-name-text">${bp.name}</span></span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${fitBadgeHtml}
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(benchListEl);

  // ベンチ外（リザーブ）リストの描画（21人目以降の選手：PCおよびモバイル両方で常時表示）
  if (reservesBoxEl && reservesListEl) {
    reservesBoxEl.classList.remove('hidden');
    if (reservesTitleEl) {
      reservesTitleEl.textContent = `ベンチ外 (${reservePlayers.length}名)`;
    }

    if (reservePlayers.length === 0) {
      reservesListEl.innerHTML = `
        <div class="empty-reserve-slot">
          <span class="empty-reserve-text">ベンチ外選手なし</span>
        </div>
      `;
    } else {

      const sortedReserves = [...reservePlayers].sort((a, b) => {
        if (selectedSlot) {
          const aFit = getPositionFitInfo(a, selectedSlot.pos).factor;
          const bFit = getPositionFitInfo(b, selectedSlot.pos).factor;
          if (aFit !== bFit) return bFit - aFit;
          return getEffectivePlayerRatingForSlot(b, selectedSlot.pos) - getEffectivePlayerRatingForSlot(a, selectedSlot.pos);
        } else {
          const orderA = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[a.pos] : 99) || 99;
          const orderB = (typeof BENCH_DRAWER_POS_ORDER !== 'undefined' ? BENCH_DRAWER_POS_ORDER[b.pos] : 99) || 99;
          if (orderA !== orderB) return orderA - orderB;
          return getPlayerOverallRating(b) - getPlayerOverallRating(a);
        }
      });

      reservesListEl.innerHTML = sortedReserves.map(rp => {
        const fitInfo = selectedSlot ? getPositionFitInfo(rp, selectedSlot.pos) : null;
        const ovrVal = selectedSlot ? getEffectivePlayerRatingForSlot(rp, selectedSlot.pos) : getPlayerOverallRating(rp);
        const posDisplay = formatPlayerPositionsText(rp, 'slash');
        const roleGroup = POS_ROLE_GROUP[rp.pos] || 'MF';

        const fitClass = fitInfo ? (
          fitInfo.type === 'main' ? 'fit-main'
          : fitInfo.type === 'sub' ? 'fit-sub'
          : fitInfo.type === 'semi' ? 'fit-semi'
          : 'fit-out'
        ) : '';

        const injuryBadgeHtml = rp.injuryWeeks > 0
          ? `<span class="pitch-node-injury" title="負傷中（残り${rp.injuryWeeks}節）">傷</span>`
          : '';

        return `
          <div class="pitch-node pos-group-${roleGroup} bench-sub-item reserve-node ${fitClass}" data-player-id="${rp.id}" title="ドラッグまたはクリックで選手交代">
            <div class="pitch-node-avatar-wrap">
              ${getPlayerAvatarHtml(rp, playerClub, 'pitch-node-avatar', 48)}
              <span class="pitch-node-ovr ${getOvrTierClass(ovrVal)}">${ovrVal}</span>
            </div>
            <div class="pitch-node-body">
              <div class="pitch-node-top">
                <span class="pitch-node-pos">${rp.pos}</span>
                <span class="pitch-node-num mono">#${rp.squadNumber || '-'}</span>
              </div>
              <div class="pitch-node-name-btn clickable-player-name" data-profile-id="${rp.id}" title="タップで選手詳細プロフィールを表示">
                <span class="pitch-node-name-viewport"><span class="pitch-node-name-text">${rp.name}</span></span>
              </div>
              <div class="pitch-node-meta">
                <span class="pitch-node-pref">${posDisplay}</span>
                ${injuryBadgeHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(reservesListEl);
    }
  }

  if (typeof applyPitchNodeNameMarquee === 'function') {
    requestAnimationFrame(() => applyPitchNodeNameMarquee());
  }
}

/**
 * 作戦ボード上で名前が見切れている選手カードのみ、左方向へ往復スクロールさせる
 */
function applyPitchNodeNameMarquee() {
  const btns = document.querySelectorAll('#pitch-nodes-layer .pitch-node-name-btn, #pitch-bench-list .pitch-node-name-btn, #pitch-reserves-list .pitch-node-name-btn');
  const range = (typeof document !== 'undefined' && document.createRange) ? document.createRange() : null;
  btns.forEach(btn => {
    const viewportEl = btn.querySelector('.pitch-node-name-viewport') || btn;
    const textEl = btn.querySelector('.pitch-node-name-text');
    if (!textEl) return;
    btn.classList.remove('is-marquee');
    btn.style.removeProperty('--marquee-exit');
    btn.style.removeProperty('--marquee-enter');
    btn.style.removeProperty('--marquee-dur');
    const boxRectW = viewportEl.getBoundingClientRect ? viewportEl.getBoundingClientRect().width : viewportEl.clientWidth;
    const boxW = boxRectW > 0 ? boxRectW : viewportEl.clientWidth;
    if (boxW <= 0) return;
    let textW = textEl.scrollWidth;
    if (range) {
      try {
        range.selectNodeContents(textEl);
        const rangeW = range.getBoundingClientRect().width;
        if (rangeW > textW) textW = rangeW;
      } catch (_) {}
    }
    if (textW - boxW > 0.5) {
      const exitDist = Math.ceil(textW + 4);
      const enterDist = Math.ceil(boxW + 4);
      const dur = Math.max(5.0, Math.min(9.5, 2.2 + (exitDist + enterDist) * 0.04)).toFixed(2);
      btn.style.setProperty('--marquee-exit', `-${exitDist}px`);
      btn.style.setProperty('--marquee-enter', `${enterDist}px`);
      btn.style.setProperty('--marquee-dur', `${dur}s`);
      btn.classList.add('is-marquee');
    }
  });
}

if (typeof window !== 'undefined' && !window.__pitchMarqueeResizeBound) {
  window.__pitchMarqueeResizeBound = true;
  window.addEventListener('resize', () => {
    if (typeof applyPitchNodeNameMarquee === 'function') {
      applyPitchNodeNameMarquee();
    }
  });
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (typeof applyPitchNodeNameMarquee === 'function') {
        applyPitchNodeNameMarquee();
      }
    }).catch(() => {});
  }
}

/**
 * クラブ戦術方針の描画
 */
function renderTacticsOverview() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;
  const currentTactic = normalizeTacticKey(playerClub.tactic);
  playerClub.tactic = currentTactic;
  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === currentTactic);
  });
  document.querySelectorAll('.tactics-guide-item[data-tactic-card]').forEach(card => {
    card.classList.toggle('active-guide', card.dataset.tacticCard === currentTactic);
  });
  const tacticDef = TACTICS_DEFINITIONS[currentTactic];
  if (tacticDef) {
    const badge = document.getElementById('current-tactic-badge');
    if (badge) badge.textContent = tacticDef.badge;
    const desc = document.getElementById('current-tactic-desc');
    if (desc) desc.textContent = tacticDef.desc;
  }
  if (typeof renderTacticalRolesAndChemBar === 'function') {
    renderTacticalRolesAndChemBar(playerClub);
  }
}

/**
 * 自チーム登録選手一覧の描画（9ポジション順ソート、メイン100%/サブ92%/適性外80%、契約延長ボタン含む）
 */
function getOvrTierClass(ovr) {
  const v = typeof ovr === 'number' ? ovr : 65;
  if (v >= 90) return 'ovr-tier-elite';
  if (v >= 80) return 'ovr-tier-high';
  if (v >= 70) return 'ovr-tier-mid';
  return 'ovr-tier-low';
}

function getOvrTextClass(ovr) {
  const v = typeof ovr === 'number' ? ovr : 65;
  if (v >= 90) return 'tier-text-elite';
  if (v >= 80) return 'tier-text-high';
  if (v >= 70) return 'tier-text-mid';
  return 'tier-text-low';
}

function buildOvrRangeHtml(minVal, maxVal, isExact = false, exactVal = null) {
  if (isExact) {
    const v = exactVal !== null && exactVal !== undefined ? exactVal : minVal;
    return `<span class="${getOvrTextClass(v)}">${v}</span>`;
  }
  return `<span style="white-space:nowrap;"><span class="${getOvrTextClass(minVal)}">${minVal}</span><span style="color:#ffffff;font-weight:600;margin:0 1px;">~</span><span class="${getOvrTextClass(maxVal)}">${maxVal}</span></span>`;
}

function getRatingTierInfo(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (Number.isNaN(num)) {
    return { pillClass: 'rat-none', textClass: 'rat-text-none', text: 'N/A' };
  }
  if (num >= 8.0) return { pillClass: 'rat-elite', textClass: 'rat-text-elite', text: num.toFixed(2) };
  if (num >= 7.0) return { pillClass: 'rat-high', textClass: 'rat-text-high', text: num.toFixed(2) };
  if (num >= 6.0) return { pillClass: 'rat-mid', textClass: 'rat-text-mid', text: num.toFixed(2) };
  return { pillClass: 'rat-low', textClass: 'rat-text-low', text: num.toFixed(2) };
}

function renderRoster() {
  const playerClub = getPlayerClub();
  renderTacticalManagerBanner();
  renderTacticalBoard();
  renderTacticsOverview();

  const stats = getTeamStarterStats(playerClub);
  const payroll = getClubTotalPayroll(playerClub);

  const totalAtkEl = document.getElementById('team-total-atk');
  const totalDefEl = document.getElementById('team-total-def');
  const avgStaEl = document.getElementById('team-avg-sta');
  const totalPayEl = document.getElementById('roster-total-payroll');
  if (totalAtkEl) totalAtkEl.textContent = Math.round(stats.totalAtk);
  if (totalDefEl) totalDefEl.textContent = Math.round(stats.totalDef);
  if (avgStaEl) avgStaEl.textContent = stats.avgSta;
  if (totalPayEl) totalPayEl.textContent = formatMoney(payroll);

  if (typeof evaluateClubNationalityRules === 'function') {
    const natEval = evaluateClubNationalityRules(playerClub);
    const seniorCountEl = document.getElementById('roster-senior-count');
    const nonHgCountEl = document.getElementById('roster-nonhg-count');
    const hgCountEl = document.getElementById('roster-hg-count');
    const seniorBadgeEl = document.getElementById('roster-senior-badge');
    const nonHgBadgeEl = document.getElementById('roster-nonhg-badge');
    const warnBannerEl = document.getElementById('roster-nat-warning-banner');

    if (seniorCountEl) {
      seniorCountEl.textContent = `${natEval.seniorCount}/${natEval.maxSenior}`;
      seniorCountEl.className = `mono ${natEval.excessSenior > 0 ? 'text-danger' : ''}`;
    }
    if (nonHgCountEl) {
      nonHgCountEl.textContent = `${natEval.nonHgCount}/${natEval.maxNonHg}`;
      nonHgCountEl.className = `mono ${natEval.excessNonHg > 0 ? 'text-danger' : ''}`;
    }
    if (hgCountEl) {
      hgCountEl.textContent = `${natEval.totalHgCount}名`;
    }
    if (seniorBadgeEl) seniorBadgeEl.classList.toggle('is-rule-warning', natEval.excessSenior > 0);
    if (nonHgBadgeEl) nonHgBadgeEl.classList.toggle('is-rule-warning', natEval.excessNonHg > 0);
    if (warnBannerEl) {
      if (natEval.isWarning) {
        const msgs = [];
        if (natEval.excessSenior > 0) msgs.push(`22歳以上シニア登録上限（${natEval.maxSenior}名）を ${natEval.excessSenior}名 超過`);
        if (natEval.excessNonHg > 0) msgs.push(`非HG（外国籍）上限（${natEval.maxNonHg}名）を ${natEval.excessNonHg}名 超過`);
        warnBannerEl.innerHTML = `<strong>登録ルール警告</strong>：${msgs.join(' ／ ')}。ペナルティにより公式戦ベンチ入り上限が <strong>${natEval.effectiveMaxBench}名</strong>（通常9名）に制限されています（21歳以下は免除）。`;
        warnBannerEl.classList.remove('hidden');
      } else {
        warnBannerEl.innerHTML = '';
        warnBannerEl.classList.add('hidden');
      }
    }
  }

  const currentTactic = normalizeTacticKey(playerClub.tactic);
  playerClub.tactic = currentTactic;
  document.querySelectorAll('#tactics-btn-group .btn-tactic').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === currentTactic);
  });
  const tacticDef = TACTICS_DEFINITIONS[currentTactic];
  if (tacticDef) {
    const badge = document.getElementById('current-tactic-badge');
    const desc = document.getElementById('current-tactic-desc');
    if (badge) badge.textContent = tacticDef.badge;
    if (desc) desc.textContent = tacticDef.desc;
  }

  const activeRosterPlayers = playerClub.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  const activeRosterCount = activeRosterPlayers.length;
  const gkCount = activeRosterPlayers.filter(p => p.pos === 'GK').length;

  const sortedPlayers = [...activeRosterPlayers].sort((a, b) => {
    const orderA = POS_DISPLAY_ORDER[a.pos] || 99;
    const orderB = POS_DISPLAY_ORDER[b.pos] || 99;
    if (orderA !== orderB) return orderA - orderB;
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
    return getPlayerOverallRating(b) - getPlayerOverallRating(a);
  });

  const tbody = document.getElementById('roster-tbody');
  if (!tbody) return;
  tbody.innerHTML = sortedPlayers.map(p => {
    const rowClasses = [];
    if (!p.isStarter) rowClasses.push('row-bench');
    if (gameState.selectedPlayerId === p.id) rowClasses.push('row-selected');

    const baseOvr = getPlayerOverallRating(p);
    const effOvr = getEffectivePlayerRating(p);
    const assignedSlot = p.isStarter ? (p.assignedPos || p.pos) : null;
    const fitInfo = p.isStarter ? getPositionFitInfo(p, assignedSlot) : { type: 'main', factor: 1.0 };

    const playerClub = getPlayerClub();
  const isYouth = (playerClub && playerClub.youthSquad || []).some(y => y.id === p.id);
  const isCandidate = (gameState.youthCandidates || []).some(y => y.id === p.id);

    const atkDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.atk) : '';
    const defDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.def) : '';
    const staDiff = p.lastDiff ? formatDiffHtml(p.lastDiff.sta) : '';

    const isLoanIn = Boolean(p.loanStatus && p.loanStatus.isLoan);
    const isLoanOut = Boolean(p.loanStatus && p.loanStatus.isLoanOut);
    const canRelease = !isLoanIn && !isLoanOut && activeRosterCount > 11 && !(p.pos === 'GK' && gkCount <= 1) && !gameState.isGameOver;
    const releaseBtnLabel = (isLoanIn || isLoanOut) ? 'レンタル中' : (canRelease ? '自由契約' : '必須枠');

    const canExtend = p.contractYears <= 2 && !isLoanIn && !p.preContractDeparture && !gameState.isGameOver;
    let extendBtnHtml = '';
    if (isLoanIn) {
      extendBtnHtml = '';
    } else if (p.contractRefused) {
      extendBtnHtml = `<button type="button" class="btn btn-secondary btn-sm" disabled title="交渉決裂のためオフシーズンにフリー流出確定">交渉決裂</button>`;
    } else if (canExtend) {
      extendBtnHtml = `<button type="button" class="btn btn-accent btn-sm btn-extend-contract" data-extend-id="${p.id}" title="契約延長・週給交渉モーダルを開く">契約交渉</button>`;
    }

    // 22歳以下の若手に対する「レンタル（レンタル放出）」ボタン
    let loanListingBtnHtml = '';
    if (p.age <= 22 && !p.isStarter && (!p.loanStatus || !p.loanStatus.isLoanOut) && !p.loanStatus?.isLoan) {
      if (p.isLoanListed) {
        loanListingBtnHtml = `<button type="button" class="btn btn-outline btn-sm btn-loan-listing" data-loan-list-id="${p.id}" title="レンタルリストから解除" style="color:#f39c12;border-color:#f39c12;">レンタル解除</button>`;
      } else {
        loanListingBtnHtml = `<button type="button" class="btn btn-secondary btn-sm btn-loan-listing" data-loan-list-id="${p.id}" title="他クラブへの1年間レンタル（レンタル放出）リストに設定（成長加速ボーナス+30%）">レンタル</button>`;
      }
    }



    let fitBadge = '';
    if (p.isStarter) {
      if (fitInfo.type === 'sub') {
        fitBadge = '<span class="sub-badge badge-subpos" style="color:#38bdf8;border-color:rgba(56,189,248,0.4);">◯ 薄適性</span>';
      } else if (fitInfo.type === 'semi') {
        fitBadge = '<span class="sub-badge badge-warn" style="color:#f1c40f;border-color:rgba(241,196,15,0.4);background:rgba(241,196,15,0.15);">△ 近接</span>';
      } else if (fitInfo.type === 'out') {
        fitBadge = '<span class="sub-badge badge-penalty">✕ 不適</span>';
      }
    }
    const trainingBadge = p.positionTraining
      ? `<span class="sub-badge badge-training" title="新ポジション特訓進行中">特訓:${p.positionTraining.targetPos} (${Math.round(p.positionTraining.progress)}%)</span>`
      : '';

    const injuryBadge = p.injuryWeeks > 0 ? `<span class="sub-badge badge-injury">負傷:残${p.injuryWeeks}節</span>` : '';
    const refusedBadge = p.contractRefused ? `<span class="sub-badge badge-refused">流出確定</span>` : '';
    const moraleBadge = (!p.contractRefused && p.megaOfferRejected) ? `<span class="sub-badge badge-morale-down">昇給要求</span>` : '';
    const loanInBadge = p.loanStatus?.isLoan ? '<span class="sub-badge badge-loan">LOAN</span>' : '';
    const loanOutBadge = p.loanStatus?.isLoanOut ? `<span class="sub-badge badge-loanout">レンタル中(${p.loanStatus.toClubName})</span>` : '';
    const loanListedBadge = (p.isLoanListed && !p.loanStatus?.isLoanOut) ? '<span class="sub-badge badge-loanlisted">レンタル募集中</span>' : '';
    const preDepartBadge = p.preContractDeparture ? `<span class="sub-badge badge-refused">来季流出(${p.preContractDeparture.toClubName})</span>` : '';

    const ovrTierCls = getOvrTierClass(effOvr);
    let ovrDisplay = `<span class="ovr-cell-badge ${ovrTierCls}">${effOvr}</span>`;
    if (p.injuryWeeks > 0 || fitInfo.type === 'out') {
      ovrDisplay = `<span class="ovr-cell-badge tier-text-low">${effOvr}</span> <span class="text-muted" style="font-size:10px;">(${baseOvr})</span>`;
    } else if (fitInfo.type === 'sub' || fitInfo.type === 'semi') {
      ovrDisplay = `<span class="ovr-cell-badge ${ovrTierCls}">${effOvr}</span> <span class="text-muted" style="font-size:10px;">(${baseOvr})</span>`;
    }

    const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(1) : 'N/A';
    const avgRatInfo = getRatingTierInfo(avgRating);

    let contractClass = '';
    let contractText = `${p.contractYears}年`;
    if (isLoanIn) {
      contractClass = '';
      contractText = 'レンタル中';
    } else if (p.contractRefused) {
      contractClass = 'contract-expired';
      contractText = '決裂(流出)';
    } else if (p.preContractDeparture) {
      contractClass = 'contract-expired';
      contractText = '流出確定';
    } else if (p.contractYears <= 0) {
      contractClass = 'contract-expired';
      contractText = '満了(0年)';
    } else if (p.contractYears === 1) {
      contractClass = 'contract-expiring';
      contractText = '1年';
    } else if (p.contractYears === 2) {
      contractText = '2年';
    }

    const hgTag = (typeof isPlayerHomegrown === 'function' && isPlayerHomegrown(p))
      ? `<span class="badge-hg" title="ホームグロウン（自国籍または自クラブユース昇格）">HG</span>`
      : '';
    const u21Tag = (typeof isPlayerU21Exempt === 'function' && isPlayerU21Exempt(p))
      ? `<span class="badge-u21" title="21歳以下：25人シニア枠・非HG枠免除">U21</span>`
      : '';

    return `
      <tr class="${rowClasses.join(' ')}" data-player-id="${p.id}">
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="クリックで選手詳細プロフィールを表示">
            ${getPlayerAvatarHtml(p, playerClub, 'avatar-sm table-avatar')}<span class="mono text-muted roster-squad-num">#${p.squadNumber || '-'}</span> <span class="player-name-text">${p.name}</span>
          </button>
          ${hgTag}${u21Tag}${fitBadge}${trainingBadge}${injuryBadge}${refusedBadge}${moraleBadge}${loanInBadge}${loanOutBadge}${loanListedBadge}${preDepartBadge}
        </td>
        <td class="col-num" style="white-space:nowrap;">${p.age}歳</td>
        <td class="col-num">${ovrDisplay}</td>
        <td class="col-num">${p.appearances}</td>
        <td class="col-num accent-gold"><strong>${p.goals}</strong></td>
        <td class="col-num ${avgRatInfo.textClass} font-bold">${avgRating}</td>
        <td class="col-num ${p.atk >= 90 ? 'tier-text-elite' : (p.atk >= 80 ? 'tier-text-high' : (p.atk >= 70 ? 'tier-text-mid' : 'tier-text-low'))}">${p.atk}${atkDiff}</td>
        <td class="col-num ${p.def >= 90 ? 'tier-text-elite' : (p.def >= 80 ? 'tier-text-high' : (p.def >= 70 ? 'tier-text-mid' : 'tier-text-low'))}">${p.def}${defDiff}</td>
        <td class="col-num ${p.sta >= 90 ? 'tier-text-elite' : (p.sta >= 80 ? 'tier-text-high' : (p.sta >= 70 ? 'tier-text-mid' : 'tier-text-low'))}">${p.sta}${staDiff}</td>
        <td class="col-num">${formatFatigueCellHtml(p)}</td>
        <td class="col-num ${contractClass}">${contractText}</td>
        <td class="col-num mono" title="年間総給与: ${formatMoney(p.salary)}">
          <strong>${formatWage(p.wage || Math.round(p.salary / 52))}</strong><br>
          <span class="text-muted" style="font-size:10px;">(${formatMoney(p.salary)})</span>
        </td>
        <td class="col-action">
          <div class="action-btn-group action-btn-grid">
            <div class="action-slot slot-extend">${extendBtnHtml}</div>
            <div class="action-slot slot-loan">${loanListingBtnHtml}</div>
            <div class="action-slot slot-release">
              <button type="button" class="btn btn-danger btn-sm btn-release-player" data-release-id="${p.id}" ${canRelease ? '' : 'disabled'}>
                ${releaseBtnLabel}
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * 全20クラブの全所属選手を網羅するグローバル移籍市場の描画
 */

/**
 * 獲得ターゲットリスト（SHORTLIST）への追加／解除トグル
 */
function toggleShortlist(playerId) {
  if (!gameState.targetShortlist) gameState.targetShortlist = [];
  const idx = gameState.targetShortlist.indexOf(playerId);
  const ctx = findPlayerWithContextById(playerId);
  const pName = ctx ? ctx.player.name : '選手';

  if (idx !== -1) {
    gameState.targetShortlist.splice(idx, 1);
    addDailyLog(`【ターゲット解除】${pName} を獲得ターゲットリストから除外しました。`);
  } else {
    gameState.targetShortlist.push(playerId);
    addDailyLog(`【ターゲット登録】${pName} を獲得ターゲットリストに追加しました。`);
  }
  updateMarketBadges();
  renderMarket();
  renderShortlist();
}

function isInShortlist(playerId) {
  return Boolean(gameState.targetShortlist && gameState.targetShortlist.includes(playerId));
}

/**
 * 移籍タブ内のサブタブ切り替え ('market' | 'shortlist' | 'offers')
 */
function switchMarketSubtab(subtabKey, shouldRender = true) {
  gameState.marketSubtab = subtabKey;
  const viewMarket = document.getElementById('view-market');
  if (viewMarket) {
    viewMarket.setAttribute('data-market-subtab', subtabKey);
  }

  // ボタンのアクティブ状態更新
  const btns = document.querySelectorAll('#market-subnav-bar .roster-subtab-btn');
  btns.forEach(btn => {
    const isAct = btn.dataset.marketSubtab === subtabKey;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // サブビューの表示切り替え
  const subviews = {
    market: document.getElementById('market-subview-market'),
    shortlist: document.getElementById('market-subview-shortlist'),
    offers: document.getElementById('market-subview-offers')
  };

  Object.keys(subviews).forEach(key => {
    const el = subviews[key];
    if (el) {
      el.classList.toggle('hidden', key !== subtabKey);
    }
  });

  if (!shouldRender) return;
  if (subtabKey === 'market') renderMarket();
  else if (subtabKey === 'shortlist') renderShortlist();
  else if (subtabKey === 'offers') renderIncomingOffers();
}

/**
 * 経営画面内のサブタブ切り替え（施設投資 / 監督・指導陣 / ユースチーム）
 */
function switchFacilitiesSubtab(subtabKey, shouldRender = true) {
  if (!subtabKey) subtabKey = 'investment';
  gameState.facilitiesSubtab = subtabKey;
  const viewFacilities = document.getElementById('view-facilities');
  if (viewFacilities) {
    viewFacilities.setAttribute('data-facilities-subtab', subtabKey);
  }

  // ボタンのアクティブ状態更新
  const btns = document.querySelectorAll('#facilities-subnav-bar .roster-subtab-btn');
  btns.forEach(btn => {
    const isAct = btn.dataset.facilitiesSubtab === subtabKey;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // サブビューの表示切り替え
  const subviews = {
    investment: document.getElementById('facilities-subview-investment'),
    staff: document.getElementById('facilities-subview-staff'),
    youth: document.getElementById('facilities-subview-youth')
  };

  Object.keys(subviews).forEach(key => {
    const el = subviews[key];
    if (el) {
      el.classList.toggle('hidden', key !== subtabKey);
    }
  });

  if (!shouldRender) return;
  if (subtabKey === 'investment') {
    renderFacilitiesAndYouth();
  } else if (subtabKey === 'staff') {
    renderManagerManagementPanel();
    renderCoachingStaffPanel();
  } else if (subtabKey === 'youth') {
    renderYouthSquad();
    renderFacilitiesAndYouth();
  }
}

/**
 * 移籍サブタブのバッジ件数表示を更新
 */
function updateMarketBadges() {
  if (typeof syncPendingMegaOfferToIncomingOffers === 'function') syncPendingMegaOfferToIncomingOffers();
  const shortlistCount = (gameState.targetShortlist || []).length;
  const isMarketWindowOpen = !gameState.isSeasonOver && (typeof isTransferWindowCurrentlyOpen === 'function' ? isTransferWindowCurrentlyOpen() : false);

  // アクティブなオファー件数（移籍市場オープン中の未完了・期限内のみカウント）
  const incomingActiveCount = isMarketWindowOpen
    ? (gameState.incomingOffers || []).filter(o => (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') && ((o.daysLeft ?? 1) > 0)).length
    : 0;
  const outgoingActiveCount = !gameState.isSeasonOver
    ? (gameState.outgoingOffers || []).filter(o => o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter').length
    : 0;
  const totalActiveOffers = incomingActiveCount + outgoingActiveCount;

  const bShortlist = document.getElementById('badge-shortlist-count');
  if (bShortlist) {
    bShortlist.textContent = `(${shortlistCount})`;
    bShortlist.classList.toggle('has-items', shortlistCount > 0);
  }

  const bOffers = document.getElementById('badge-offers-count');
  if (bOffers) {
    bOffers.textContent = `(${totalActiveOffers})`;
    bOffers.classList.toggle('has-items', totalActiveOffers > 0);
  }

  const bInOffers = document.getElementById('badge-incoming-offers-count');
  if (bInOffers) {
    bInOffers.textContent = `(${incomingActiveCount})`;
    bInOffers.classList.toggle('has-items', incomingActiveCount > 0);
  }

  const bOutOffers = document.getElementById('badge-outgoing-offers-count');
  if (bOutOffers) {
    bOutOffers.textContent = `(${outgoingActiveCount})`;
    bOutOffers.classList.toggle('has-items', outgoingActiveCount > 0);
  }

  const summaryCount = document.getElementById('shortlist-summary-count');
  if (summaryCount) summaryCount.textContent = `${shortlistCount}名`;

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const summaryFunds = document.getElementById('shortlist-summary-funds');
  if (summaryFunds && playerClub) summaryFunds.textContent = formatMoney(playerClub.funds);
  const summarySafeBudget = document.getElementById('shortlist-summary-safe-budget');
  if (summarySafeBudget && playerClub) {
    const safeVal = getSafeTransferBudget(playerClub);
    summarySafeBudget.textContent = formatMoney(safeVal);
    summarySafeBudget.classList.toggle('text-danger', safeVal < 0);
    summarySafeBudget.classList.toggle('accent-green', safeVal >= 0);
  }

  const offersSummaryCount = document.getElementById('offers-summary-count');
  if (offersSummaryCount) offersSummaryCount.textContent = `${totalActiveOffers}件`;
}


function renderShortlist() {
  const tbody = document.getElementById('shortlist-tbody');
  if (!tbody) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const ids = gameState.targetShortlist || [];
  if (ids.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-log-message" style="text-align: center; padding: 28px;">
          現在獲得ターゲットに登録されている選手はいません。「選手市場 (MARKET)」タブから気になる選手を「＋ SHORTLIST」で追加してください。
        </td>
      </tr>
    `;
    return;
  }

  const activeScouts = gameState.activeScoutAssignments || [];
  const rows = [];
  for (const id of ids) {
    const ctx = findPlayerWithContextById(id);
    if (!ctx) continue;
    const { player: p, clubName } = ctx;
    if (typeof ensurePlayerHistoryAndCareer === 'function' && (!Array.isArray(p.seasonHistory) || p.seasonHistory.length === 0)) {
      ensurePlayerHistoryAndCareer(p, clubName);
    }
    const ovr = getPlayerOverallRating(p);
    const isMyClub = Boolean(ctx.isPlayerClub || (playerClub && playerClub.players && playerClub.players.some(x => x.id === p.id)));
    const scoutView = typeof getPlayerScoutedView === 'function' ? getPlayerScoutedView(p, isMyClub) : { isScouted: true, ovrDisplay: `${ovr}`, ovrMin: ovr, ovrMax: ovr };
    const fee = typeof calculatePlayerMarketValue === 'function' ? calculatePlayerMarketValue(p) : calculateTransferFee(p);
    const isBargain = p.contractYears === 1;
    const isPreContracted = Array.isArray(gameState.preContractPlayers) && gameState.preContractPlayers.some(x => x.id === p.id);
    const preContractBadge = isPreContracted ? '<span class="sub-badge badge-precontract">[内定済]</span>' : '';
    const freeBadge = p.isFreeAgent ? '<span class="sub-badge badge-free">[無所属]</span>' : '';
    const bargainBadge = isBargain ? '<span class="sub-badge badge-bargain">[契約最終年]</span>' : '';
    const failedBadge = p.negotiationFailed ? '<span class="sub-badge badge-refused">交渉決裂済</span>' : '';

    const activeOutOffer = (gameState.outgoingOffers || []).find(o => o.playerId === p.id && (o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter'));
    let offerStatusBadge = '';
    let offerBtnHtml = '';

    if (activeOutOffer) {
      if (activeOutOffer.status === 'agreed') {
        offerStatusBadge = '<span class="sub-badge badge-bargain" style="background: rgba(46, 204, 113, 0.2); color: #2ecc71; border-color: #2ecc71;">オファー合意</span>';
        offerBtnHtml = `<button type="button" class="btn btn-sm btn-offer-accept market-offer-slot-btn" data-goto-offers="outgoing">契約確定へ</button>`;
      } else if (activeOutOffer.status === 'cpu_counter') {
        offerStatusBadge = '<span class="sub-badge" style="background: rgba(243, 156, 18, 0.2); color: #f39c12; border-color: #f39c12;">増額逆提示あり</span>';
        offerBtnHtml = `<button type="button" class="btn btn-sm market-offer-slot-btn" data-goto-offers="outgoing" style="background: #f39c12; color: #0d1117;">回答確認</button>`;
      } else {
        offerStatusBadge = `<span class="sub-badge" style="background: rgba(243, 156, 18, 0.15); color: #f39c12;">回答待ち(${activeOutOffer.pendingDays || 1}日)</span>`;
        offerBtnHtml = `<button type="button" class="btn btn-sm btn-disabled market-offer-slot-btn" disabled style="opacity: 0.65;">送信中</button>`;
      }
    } else {
      offerBtnHtml = `<button type="button" class="btn btn-primary btn-sm btn-formal-offer market-offer-slot-btn" data-formal-offer-id="${p.id}" ${p.negotiationFailed ? 'disabled' : ''}>交渉</button>`;
    }
    let scoutBtnHtml = '';
    if (!isMyClub && !scoutView.isScouted) {
      const isScoutingNow = activeScouts.find(a => a.playerId === p.id);
      if (isScoutingNow) {
        scoutBtnHtml = `<button type="button" class="btn btn-sm btn-disabled mono market-scout-slot-btn" disabled style="opacity:0.75;">調査中(${isScoutingNow.daysRemaining}日)</button>`;
      } else {
        scoutBtnHtml = `<button type="button" class="btn btn-secondary btn-sm btn-scout-dispatch mono market-scout-slot-btn" data-scout-player-id="${p.id}" title="スカウトを派遣して能力・契約条件を解明">調査</button>`;
      }
    }
    const footBadge = formatFootBadge(p);

    rows.push(`
      <tr>
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="スカウティングレポートを表示">
            ${getPlayerAvatarHtml(p, ctx.club, 'avatar-sm table-avatar')}${p.name}
          </button>
          ${preContractBadge}${freeBadge}${bargainBadge}${failedBadge}${offerStatusBadge}
        </td>
        <td class="col-team" title="${clubName}"><span class="team-cell-wrap">${getClubEmblemSvg(ctx.club || clubName, 18, 'market-club-emblem')}<span class="team-name-text">${clubName}</span></span></td>
        <td class="col-num">${p.age}歳</td>
        <td class="col-num">${footBadge}</td>
        <td class="col-num">${scoutView.isScouted
          ? `<span class="ovr-cell-badge ${getOvrTierClass(ovr)}">${ovr}</span>`
          : `<span class="ovr-cell-badge" style="white-space:nowrap;"><span class="${getOvrTextClass(scoutView.ovrMin)}">${scoutView.ovrMin}</span><span style="color:#ffffff;font-weight:600;margin:0 1px;">~</span><span class="${getOvrTextClass(scoutView.ovrMax)}">${scoutView.ovrMax}</span></span>`}</td>
        <td class="col-num accent-gold mono"><strong>${formatMoney(fee)}</strong></td>
        <td class="col-num mono">${formatWage(p.wage || 20)}</td>
        <td class="col-num ${isBargain ? 'contract-expiring' : ''}">${p.contractYears}年</td>
        <td class="col-action" style="white-space: nowrap;">
          <div class="market-action-group">
            ${scoutBtnHtml}${offerBtnHtml}
            <button type="button" class="btn btn-outline btn-sm btn-shortlist-remove" data-shortlist-remove="${p.id}" title="ターゲットリストから除外">解除</button>
          </div>
        </td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * 受信オファーリスト（INCOMING OFFERS）を描画
 */
/**
 * オファー切り替えタブ処理 ('incoming' | 'outgoing')
 */
function switchOffersTab(tabKey, shouldRender = true) {
  if (!tabKey) tabKey = 'incoming';
  gameState.offersSubtab = tabKey;

  const btnIncoming = document.getElementById('offers-tab-btn-incoming');
  const btnOutgoing = document.getElementById('offers-tab-btn-outgoing');
  if (btnIncoming) btnIncoming.classList.toggle('active', tabKey === 'incoming');
  if (btnOutgoing) btnOutgoing.classList.toggle('active', tabKey === 'outgoing');

  if (shouldRender) renderIncomingOffers();
}

/**
 * セーブデータ読込時・新規開始時に全タブのサブタブDOM状態を gameState に同期する
 */
function syncAllSubtabsDOM() {
  if (typeof switchTeamSubtab === 'function') switchTeamSubtab(gameState.teamSubtab || 'standings', false);
  if (typeof switchRosterSubtab === 'function') switchRosterSubtab(gameState.rosterSubtab || 'board', false);
  if (typeof switchMarketSubtab === 'function') switchMarketSubtab(gameState.marketSubtab || 'market', false);
  if (typeof switchFacilitiesSubtab === 'function') switchFacilitiesSubtab(gameState.facilitiesSubtab || 'investment', false);
  if (typeof switchOffersTab === 'function') switchOffersTab(gameState.offersSubtab || 'incoming', false);
}

/**
 * オファーリスト（受信オファー / 送信オファー）描画
 */
function renderIncomingOffers() {
  if (typeof syncPendingMegaOfferToIncomingOffers === 'function') syncPendingMegaOfferToIncomingOffers();
  const container = document.getElementById('incoming-offers-container');
  if (!container) return;

  const subtab = gameState.offersSubtab || 'incoming';

  // タブボタンのアクティブ状態更新
  const btnIncoming = document.getElementById('offers-tab-btn-incoming');
  const btnOutgoing = document.getElementById('offers-tab-btn-outgoing');
  if (btnIncoming) btnIncoming.classList.toggle('active', subtab === 'incoming');
  if (btnOutgoing) btnOutgoing.classList.toggle('active', subtab === 'outgoing');

  const playerClub = getPlayerClub();

  if (subtab === 'outgoing') {
    // 送信オファー一覧の描画
    const offers = gameState.outgoingOffers || [];
    if (offers.length === 0) {
      container.innerHTML = `
        <div class="empty-log-message" style="text-align: center; padding: 32px; background: #161b22; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.15);">
          現在、送信中のオファーはありません。<br>「選手市場」や「獲得ターゲット」から選手を選び、獲得交渉を行うとここにオファーが表示されます。
        </div>
      `;
      return;
    }

    container.innerHTML = offers.map(offer => {
      let target = null;
      let sellerClub = null;
      if (offer.sellerClubId) {
        sellerClub = gameState.clubs.find(c => c.id === offer.sellerClubId);
        if (sellerClub) target = sellerClub.players.find(p => p.id === offer.playerId);
      }
      if (!target) {
        for (const c of gameState.clubs) {
          const p = c.players.find(x => x.id === offer.playerId);
          if (p) { target = p; sellerClub = c; break; }
        }
      }
      if (!target && typeof findTransferTargetWithSeller === 'function') {
        const found = findTransferTargetWithSeller(offer.playerId);
        if (found) {
          target = found.player;
          sellerClub = found.sellerClub;
        }
      }
      if (!target && Array.isArray(gameState.transferMarket)) {
        target = gameState.transferMarket.find(c => c.id === offer.playerId);
      }

      // ステータスバッジ
      let statusBadge = '';
      let actionButtons = '';

      if (offer.status === 'pending') {
        statusBadge = `<span class="offer-deadline-badge mono accent-gold" style="border: 1px solid rgba(243, 156, 18, 0.4); background: rgba(243, 156, 18, 0.1);">相手回答待ち（残り約${offer.pendingDays || 1}日）</span>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-reject" data-outgoing-cancel="${offer.id}">オファー撤回</button>
        `;
      } else if (offer.status === 'cpu_counter') {
        statusBadge = `<span class="offer-deadline-badge mono accent-gold" style="border: 1px solid rgba(243, 156, 18, 0.4); background: rgba(243, 156, 18, 0.15); font-weight: 700;">相手より増額逆提示あり（回答期限: 残り${offer.pendingDays || 1}日）</span>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-outgoing-accept-counter="${offer.id}" style="font-weight: 700;">増額を受け入れて合意 (<span class="mono">${formatMoney(offer.counterFee)}</span>)</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-outgoing-cancel="${offer.id}">拒否・交渉終了</button>
        `;
      } else if (offer.status === 'agreed') {
        const remAgreeDays = Math.max(1, offer.agreedDaysLeft ?? 5);
        statusBadge = `<span class="offer-deadline-badge mono accent-green" style="border: 1px solid rgba(46, 204, 113, 0.4); background: rgba(46, 204, 113, 0.15); font-weight: 700;">合意済 · 確定まで残り${remAgreeDays}日</span>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-outgoing-sign="${offer.id}" style="font-weight: 700;">契約を確定して加入</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-outgoing-cancel="${offer.id}">見送り</button>
        `;
      } else if (offer.status === 'signed') {
        statusBadge = `<span class="offer-deadline-badge mono accent-green" style="opacity: 0.9;">加入完了</span>`;
        actionButtons = `
          <span class="mono accent-green" style="font-size: 11.5px; padding: 4px;">契約成立・チーム加入済み</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      } else if (offer.status === 'rejected') {
        statusBadge = `<span class="offer-deadline-badge mono text-danger" style="border: 1px solid rgba(231, 76, 60, 0.4); background: rgba(231, 76, 60, 0.1);">交渉決裂（相手拒絶）</span>`;
        actionButtons = `
          <span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">オファーは拒絶されました</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      } else if (offer.status === 'expired') {
        statusBadge = `<span class="offer-deadline-badge mono text-muted">期限切れ</span>`;
        actionButtons = `
          <span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">確定期限切れにより交渉失効</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      } else {
        statusBadge = `<span class="offer-deadline-badge mono text-muted">撤回済み</span>`;
        actionButtons = `
          <span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">撤回済み</span>
          <button type="button" class="btn btn-outline btn-sm btn-outgoing-remove" data-outgoing-remove="${offer.id}" style="font-size: 11px; padding: 2px 8px; opacity: 0.7;" title="この履歴を一覧から消去">履歴削除</button>
        `;
      }

      return `
        <div class="incoming-offer-card-item">
          <div class="offer-card-header">
            <div class="offer-club-badge">
              <span style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">相手クラブ: ${getClubEmblemSvg(offer.sellerClubId || offer.sellerClubName, 18, 'offer-club-emblem')}<strong>${offer.sellerClubName}</strong></span>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div class="offer-card-player-row">
            <button type="button" class="offer-player-avatar-wrap clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="background: none; border: none; padding: 0; cursor: pointer;">
              ${target ? getPlayerAvatarHtml(target, sellerClub, 'avatar-md') : ''}
            </button>
            <div class="offer-player-meta">
              <div class="offer-player-name">
                <span class="accent-green mono" style="font-weight:800;">${offer.playerPos}</span>
                <button type="button" class="player-name-link clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="font-weight: 700; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; background: none; border: none; padding: 0; color: #fff;">
                  #${offer.squadNumber} ${(target && (target.fullName || target.name)) || offer.playerName}
                </button>
              </div>
              <div class="offer-player-tags">
                <span>${offer.playerAge}歳</span>
                ${target ? `<span class="profile-meta-foot">${formatFootBadge(target)}</span>` : ''}
                ${(() => {
                  const isMyNow = Boolean(playerClub && playerClub.players && playerClub.players.some(x => x.id === offer.playerId));
                  const sv = (target && typeof getPlayerScoutedView === 'function')
                    ? getPlayerScoutedView(target, isMyNow || offer.status === 'signed')
                    : { isScouted: isMyNow || offer.status === 'signed', ovrMin: Math.max(45, (offer.ovr || 70) - 5), ovrMax: Math.min(99, (offer.ovr || 70) + 5) };
                  const ovrHtml = sv.isScouted
                    ? `${offer.ovr}`
                    : buildOvrRangeHtml(sv.ovrMin, sv.ovrMax);
                  const ovrBadgeClass = sv.isScouted ? getOvrTierClass(offer.ovr) : '';
                  return `<span class="ovr-cell-badge ${ovrBadgeClass}">OVR ${ovrHtml}</span>`;
                })()}
              </div>
            </div>
          </div>

          <div class="offer-card-finances">
            <div class="offer-finance-block">
              <span class="offer-finance-label">提示移籍金</span>
              <span class="offer-finance-val accent-gold mono">${formatMoney(offer.offeredFee)}</span>
            </div>
            <div class="offer-finance-block">
              <span class="offer-finance-label">提示週給 / 契約</span>
              <span class="offer-finance-val mono">£${(offer.offeredWage || 0).toLocaleString()}k/週 (${offer.offeredYears}年)</span>
            </div>
          </div>

          <div class="offer-card-actions">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');

    return;
  }

  // 受信オファー一覧の描画（incoming）
  const offers = gameState.incomingOffers || [];
  if (offers.length === 0) {
    container.innerHTML = `
      <div class="empty-log-message" style="text-align: center; padding: 32px; background: #161b22; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.15);">
        現在他クラブからの受信オファーはありません。移籍ウィンドウが開いている期間中、主力選手の活躍に応じて海外のクラブ等から打診が届きます。
      </div>
    `;
    return;
  }

  container.innerHTML = offers.map(offer => {
    const target = playerClub ? playerClub.players.find(p => p.id === offer.playerId) : null;
    const avatarHtml = target ? getPlayerAvatarHtml(target, playerClub, 'avatar-md') : '';
    const footBadge = target ? formatFootBadge(target) : '';

    let deadlineBadge = '';
    let actionButtons = '';

    if (offer.status === 'negotiating') {
      deadlineBadge = `<span class="offer-deadline-badge mono accent-gold" style="border: 1px solid rgba(243, 156, 18, 0.4); background: rgba(243, 156, 18, 0.1);">上乗せ回答待ち (残り${offer.pendingDays || 1}日)</span>`;
      actionButtons = `
        <div style="flex: 1; text-align: center; padding: 6px 10px; background: rgba(243, 156, 18, 0.15); border: 1px solid rgba(243, 156, 18, 0.4); border-radius: 4px; color: #f39c12; font-size: 11.5px; font-weight: 700;" class="mono">
          相手クラブ回答待ち中 (要求額: ${formatMoney(offer.demandedFee || offer.counterFee)})
        </div>
      `;
    } else if (offer.status === 'counter_agreed') {
      deadlineBadge = `<span class="offer-deadline-badge mono accent-green" style="border: 1px solid rgba(46, 204, 113, 0.4); background: rgba(46, 204, 113, 0.15); font-weight: 700;">上乗せ合意 · 残り${offer.daysLeft}日</span>`;
      actionButtons = `
        <button type="button" class="btn btn-sm btn-offer-accept" data-offer-accept="${offer.id}">新金額で承諾 (<span class="mono">${formatMoney(offer.offerFee)}</span>)</button>
        <button type="button" class="btn btn-sm btn-offer-reject" data-offer-reject="${offer.id}">拒否する</button>
      `;
    } else if (offer.status === 'accepted') {
      if (offer.isLoanOffer) {
        deadlineBadge = `<span class="offer-deadline-badge mono accent-green" style="opacity: 0.8;">レンタル成立済み</span>`;
        actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">1年期限付き移籍完了（${offer.buyerClubName}）</span>`;
      } else {
        deadlineBadge = `<span class="offer-deadline-badge mono accent-green" style="opacity: 0.8;">売却成立済み</span>`;
        actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">移籍完了（売却額: ${formatMoney(offer.offerFee)}）</span>`;
      }
    } else if (offer.status === 'rejected') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-danger" style="opacity: 0.8;">拒否済み</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">オファー拒否</span>`;
    } else if (offer.status === 'counter_rejected') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-danger" style="opacity: 0.8;">交渉決裂（相手撤退）</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">上乗せ不合意・相手クラブ撤退</span>`;
    } else if (offer.status === 'cancelled') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-muted" style="opacity: 0.8;">取消済み</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">他クラブとの成立等により無効化</span>`;
    } else if (offer.status === 'expired') {
      deadlineBadge = `<span class="offer-deadline-badge mono text-muted" style="opacity: 0.8;">期限切れ</span>`;
      actionButtons = `<span class="mono text-muted" style="font-size: 11.5px; padding: 4px;">回答期限切れ</span>`;
    } else {
      // 通常の pending
      if (offer.isLoanOffer) {
        deadlineBadge = `<div class="offer-deadline-badge mono accent-green">レンタル打診（残り${offer.daysLeft}日）</div>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-offer-accept="${offer.id}" style="font-weight: 700;">レンタルへ送り出す</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-offer-reject="${offer.id}">残留させる</button>
        `;
      } else {
        deadlineBadge = `<div class="offer-deadline-badge mono">回答期限: 残り${offer.daysLeft}日</div>`;
        actionButtons = `
          <button type="button" class="btn btn-sm btn-offer-accept" data-offer-accept="${offer.id}">承諾して売却</button>
          <button type="button" class="btn btn-sm btn-offer-reject" data-offer-reject="${offer.id}">拒否する</button>
          <button type="button" class="btn btn-sm btn-offer-counter" data-offer-counter="${offer.id}" title="希望の移籍金を相手に提示して交渉します">上乗せ要求</button>
        `;
      }
    }

    return `
      <div class="incoming-offer-card-item ${offer.isMegaClub ? 'is-mega' : ''}">
        <div class="offer-card-header">
          <div class="offer-club-badge">
            <span style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:5px;vertical-align:middle;">${offer.isMegaClub ? '<span class="accent-gold" style="font-weight:700;white-space:nowrap;flex-shrink:0;">欧州名門</span>' : ''}${getClubEmblemSvg(offer.buyerClubName, 18, 'offer-club-emblem')}<strong style="white-space:nowrap;">${offer.buyerClubName}</strong><span style="white-space:nowrap;">(${offer.buyerClubCountry})</span></span>
          </div>
          <div>
            ${deadlineBadge}
          </div>
        </div>

        <div class="offer-card-player-row">
          <button type="button" class="offer-player-avatar-wrap clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="background: none; border: none; padding: 0; cursor: pointer;">
            ${avatarHtml}
          </button>
          <div class="offer-player-meta">
            <div class="offer-player-name">
              <span class="accent-green mono" style="font-weight:800;">${offer.playerPos}</span>
              <button type="button" class="player-name-link clickable-player-name" data-profile-id="${offer.playerId}" title="選手詳細プロフィール表示" style="font-weight: 700; font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; background: none; border: none; padding: 0; color: #fff;">
                #${offer.squadNumber} ${(target && (target.fullName || target.name)) || offer.playerName}
              </button>
            </div>
            <div class="offer-player-tags">
              <span>${offer.playerAge}歳</span>
              <span class="ovr-cell-badge ${getOvrTierClass(offer.ovr)}">OVR ${offer.ovr}</span>
              <span class="profile-meta-foot">${footBadge}</span>
            </div>
          </div>
        </div>

        <div class="offer-card-finances">
          <div class="offer-finance-block">
            <span class="offer-finance-label">${offer.isLoanOffer ? '取引種別' : '提示移籍金'}</span>
            <span class="offer-finance-val ${offer.isLoanOffer ? 'accent-green' : 'accent-gold'} mono">${offer.isLoanOffer ? '1年レンタル' : formatMoney(offer.offerFee)}</span>
          </div>
          <div class="offer-finance-block">
            <span class="offer-finance-label">${offer.isLoanOffer ? '給与負担' : '選手週給'}</span>
            <span class="offer-finance-val mono ${offer.isLoanOffer ? 'accent-green' : ''}">${offer.isLoanOffer ? '相手100%全額負担' : `£${(offer.wage || 0).toLocaleString()}k/週`}</span>
          </div>
        </div>

        <div class="offer-card-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');

  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(container);
}


function resolveEuroClubMarketBucket(club) {
  const raw = club && club.country ? String(club.country).trim() : '';
  const up = raw.toUpperCase();
  if (up === 'ESP' || raw === 'スペイン') return 'EUR_ESP';
  if (up === 'ITA' || raw === 'イタリア') return 'EUR_ITA';
  if (up === 'GER' || raw === 'ドイツ') return 'EUR_GER';
  if (up === 'FRA' || raw === 'フランス') return 'EUR_FRA';
  if (up === 'POR' || raw === 'ポルトガル') return 'EUR_POR';
  if (up === 'NED' || raw === 'オランダ') return 'EUR_NED';
  if (up === 'BEL' || raw === 'ベルギー') return 'EUR_BEL';
  if (up === 'SCO' || raw === 'スコットランド') return 'EUR_SCO';
  if (up === 'TUR' || raw === 'トルコ') return 'EUR_TUR';
  return 'EUR_OTHER';
}

function getMarketSortableAttrValue(player, attrKey, isMyClub) {
  const attrs = typeof getPlayerFiveAttributes === 'function'
    ? getPlayerFiveAttributes(player)
    : { finishing: player.atk || 50, dribbling: player.atk || 50, passing: 60, defending: player.def || 50, pace: player.sta || 50, stamina: player.sta || 50 };
  const realVal = attrs[attrKey] || 50;
  if (isMyClub || typeof getPlayerScoutedView !== 'function') return realVal;
  const sv = getPlayerScoutedView(player, false);
  if (sv && sv.isScouted) return realVal;
  const attrSpread = (sv && sv.scoutLevel === 1) ? 3 : 7;
  const attrIndexMap = { finishing: 0, dribbling: 1, passing: 2, defending: 3, pace: 4, stamina: 5 };
  const idx = attrIndexMap[attrKey] || 0;
  const baseSeed = String(player.id || 'p').split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 0);
  const shift = ((baseSeed + idx * 13) % (attrSpread + 1)) - Math.floor(attrSpread / 2);
  const minV = clamp(realVal - attrSpread + shift, 20, realVal);
  const maxV = clamp(Math.max(minV + ((sv && sv.scoutLevel === 1) ? 3 : 6), realVal + attrSpread + shift), realVal, 99);
  return (minV + maxV) / 2;
}

function updateMarketSortHeaderIndicators(sortKey) {
  const headerLabels = { age: '年齢', ovr: 'OVR', fee: '市場価値', wage: '週給', contract: '契約残' };
  const keyMap = {
    'age-asc': ['age', '▲'], 'age-desc': ['age', '▼'],
    'ovr-desc': ['ovr', '▼'], 'ovr-asc': ['ovr', '▲'],
    'fee-desc': ['fee', '▼'], 'fee-asc': ['fee', '▲'],
    'wage-desc': ['wage', '▼'], 'wage-asc': ['wage', '▲'],
    'contract-asc': ['contract', '▲'], 'contract-desc': ['contract', '▼']
  };
  const active = keyMap[sortKey] || null;
  document.querySelectorAll('.market-table thead th[data-sort-col]').forEach(th => {
    const col = th.dataset.sortCol;
    const baseLabel = headerLabels[col] || th.textContent.replace(/[▲▼\s]+$/g, '');
    if (active && active[0] === col) {
      th.classList.add('is-sorted');
      th.textContent = `${baseLabel} ${active[1]}`;
    } else {
      th.classList.remove('is-sorted');
      th.textContent = baseLabel;
    }
  });
}

function renderMarket() {
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const squadCount = (playerClub.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut)).length;
  const mf = gameState.marketFilter;
  if (!mf.category) mf.category = 'ALL';
  if (!mf.ageRange) mf.ageRange = 'ALL';
  if (!mf.statusFilter) mf.statusFilter = 'ALL';
  if (!mf.sortKey) mf.sortKey = mf.sort || 'ovr-desc';

  const d1Clubs = Array.isArray(gameState.clubs) ? gameState.clubs : [];
  const d2Clubs = (gameState.competitions && gameState.competitions.championship && Array.isArray(gameState.competitions.championship.clubs))
    ? gameState.competitions.championship.clubs
    : [];

  const catSelect = document.getElementById('market-filter-category');
  if (catSelect && catSelect.value !== mf.category) {
    catSelect.value = mf.category;
  }
  const ageSelect = document.getElementById('market-filter-age');
  if (ageSelect && ageSelect.value !== mf.ageRange) {
    ageSelect.value = mf.ageRange;
  }
  const statusSelect = document.getElementById('market-filter-status');
  if (statusSelect && statusSelect.value !== mf.statusFilter) {
    statusSelect.value = mf.statusFilter;
  }
  const sortSelect = document.getElementById('market-filter-sort');
  if (sortSelect && sortSelect.value !== mf.sortKey) {
    sortSelect.value = mf.sortKey;
  }

  const euroClubMap = new Map();
  const euroCompClubs = typeof getEuropeanCompetitionClubsWithPlayers === 'function'
    ? getEuropeanCompetitionClubsWithPlayers()
    : [];
  for (const ec of euroCompClubs) {
    if (ec && ec.id && !euroClubMap.has(ec.id)) {
      euroClubMap.set(ec.id, ec);
    }
  }
  if (Array.isArray(gameState.euroTransferList)) {
    for (const p of gameState.euroTransferList) {
      if (!p) continue;
      const cid = p.euroClubId || p.clubId;
      if (cid && !euroClubMap.has(cid)) {
        const euroDef = (typeof findEuropeanClubDefinitionById === 'function') ? findEuropeanClubDefinitionById(cid) : null;
        if (euroDef) {
          euroClubMap.set(cid, { ...euroDef, shortCode: euroDef.shortName, isPlayer: false, isEuroVirtual: true });
        }
      }
    }
  }
  const activeEuroClubs = Array.from(euroClubMap.values());

  const clubSelect = document.getElementById('market-filter-club');
  if (clubSelect) {
    let clubOptionsHtml = `<option value="ALL">全クラブ・無所属</option>`;
    if (mf.category === 'ALL' || mf.category === 'FREE_AGENT') {
      clubOptionsHtml += `<option value="FREE_AGENT">無所属 (Free Agent)</option>`;
    }
    if (mf.category === 'ALL' || mf.category === 'ENG_D1') {
      clubOptionsHtml += `<optgroup label="イングランド1部 (ENG-D1)">` +
        d1Clubs.map(c => `<option value="${c.id}">${c.name}${c.isPlayer ? ' (自チーム)' : ''}</option>`).join('') +
        `</optgroup>`;
    }
    if ((mf.category === 'ALL' || mf.category === 'ENG_D2') && d2Clubs.length > 0) {
      clubOptionsHtml += `<optgroup label="イングランド2部 (ENG-D2)">` +
        d2Clubs.map(c => `<option value="${c.id}">${c.name}${c.isPlayer ? ' (自チーム)' : ''}</option>`).join('') +
        `</optgroup>`;
    }
    const isEuroCat = mf.category === 'EUROPE' || String(mf.category).startsWith('EUR_');
    const filteredEuroClubs = isEuroCat && mf.category !== 'EUROPE'
      ? activeEuroClubs.filter(c => resolveEuroClubMarketBucket(c) === mf.category)
      : activeEuroClubs;
    if ((mf.category === 'ALL' || isEuroCat) && filteredEuroClubs.length > 0) {
      clubOptionsHtml += `<optgroup label="欧州主要クラブ">` +
        filteredEuroClubs.map(c => `<option value="${c.id}">[${c.country}] ${c.name}</option>`).join('') +
        `</optgroup>`;
    }
    const cacheKey = `${mf.category}_${d1Clubs.length}_${d2Clubs.length}_${activeEuroClubs.length}`;
    if (clubSelect.dataset.optionsCacheKey !== cacheKey) {
      clubSelect.innerHTML = clubOptionsHtml;
      clubSelect.dataset.optionsCacheKey = cacheKey;
    }
    const hasSelectedOption = Array.from(clubSelect.options).some(opt => opt.value === mf.clubId);
    if (!hasSelectedOption) mf.clubId = 'ALL';
    clubSelect.value = mf.clubId || 'ALL';
  }

  // 1部 ＋ 2部 ＋ 欧州主要クラブリスト ＋ 無所属フリー選手を一元集約
  const allEntries = [];
  const seenIds = new Set();
  for (const c of d1Clubs) {
    for (const p of (c.players || [])) {
      if (!p || p.isRetired || (p.loanStatus && p.loanStatus.isLoanOut) || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      allEntries.push({ player: p, club: c, category: 'ENG_D1', isMyClub: Boolean(c.isPlayer) });
    }
  }
  for (const c of d2Clubs) {
    for (const p of (c.players || [])) {
      if (!p || p.isRetired || (p.loanStatus && p.loanStatus.isLoanOut) || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      allEntries.push({ player: p, club: c, category: 'ENG_D2', isMyClub: Boolean(c.isPlayer) });
    }
  }
  for (const c of euroCompClubs) {
    const eBucket = resolveEuroClubMarketBucket(c);
    for (const p of (c.players || [])) {
      if (!p || p.isRetired || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      allEntries.push({ player: p, club: c, category: 'EUROPE', euroBucket: eBucket, isMyClub: false });
    }
  }
  if (Array.isArray(gameState.euroTransferList)) {
    const fallbackEuroStub = { id: 'euro_club', name: '欧州クラブ', shortName: 'EUR', shortCode: 'EUR', primaryColor: '#1e3a8a', secondaryColor: '#f8fafc', isEuroVirtual: true };
    for (const p of gameState.euroTransferList) {
      if (!p || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      const eClub = euroClubMap.get(p.euroClubId || p.clubId) || fallbackEuroStub;
      allEntries.push({ player: p, club: eClub, category: 'EUROPE', euroBucket: resolveEuroClubMarketBucket(eClub), isMyClub: false });
    }
  }
  if (Array.isArray(gameState.transferMarket)) {
    const freeClubStub = { id: 'FREE_AGENT', name: '無所属 (Free Agent)', shortName: 'FA', shortCode: 'FA', primaryColor: '#475569', secondaryColor: '#e2e8f0' };
    for (const p of gameState.transferMarket) {
      if (!p || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      allEntries.push({ player: p, club: freeClubStub, category: 'FREE_AGENT', isMyClub: false });
    }
  }

  const safeBudget = getSafeTransferBudget(playerClub);
  let filtered = allEntries.filter(entry => {
    const p = entry.player;
    const c = entry.club;
    if (mf.category && mf.category !== 'ALL') {
      if (String(mf.category).startsWith('EUR_')) {
        if (entry.category !== 'EUROPE' || entry.euroBucket !== mf.category) return false;
      } else if (entry.category !== mf.category) {
        return false;
      }
    }
    if (mf.clubId && mf.clubId !== 'ALL' && c.id !== mf.clubId) return false;
    if (mf.position !== 'ALL') {
      const matchPrimary = p.pos === mf.position || p.primaryPosition === mf.position || (Array.isArray(p.majorPositions) && p.majorPositions.includes(mf.position));
      const matchSecondary = Array.isArray(p.secondaryPositions) && p.secondaryPositions.includes(mf.position);
      if (!matchPrimary && !matchSecondary) return false;
    }
    if (mf.ageRange && mf.ageRange !== 'ALL') {
      const age = p.age || 25;
      if (mf.ageRange === 'U21' && age > 21) return false;
      if (mf.ageRange === 'U23' && age > 23) return false;
      if (mf.ageRange === 'PRIME' && (age < 24 || age > 29)) return false;
      if (mf.ageRange === 'VET' && age < 30) return false;
    }
    if (mf.statusFilter && mf.statusFilter !== 'ALL') {
      if (mf.statusFilter === 'EXPIRING' && (p.isFreeAgent || p.contractYears !== 1)) return false;
      if (mf.statusFilter === 'FREE' && !p.isFreeAgent) return false;
      if (mf.statusFilter === 'SCOUTED') {
        const sv = typeof getPlayerScoutedView === 'function' ? getPlayerScoutedView(p, entry.isMyClub) : { isScouted: true };
        if (!sv || !sv.isScouted) return false;
      }
      if (mf.statusFilter === 'HG') {
        const isHg = typeof isPlayerHomegrown === 'function' ? isPlayerHomegrown(p) : (p.nationality === 'England');
        if (!isHg) return false;
      }
      if (mf.statusFilter === 'AFFORDABLE') {
        const askFee = p.isFreeAgent ? 0 : (typeof calculateTransferFee === 'function' ? calculateTransferFee(p) : 0);
        if (askFee > safeBudget) return false;
      }
    }
    if (mf.searchQuery && mf.searchQuery.trim().length > 0) {
      const query = mf.searchQuery.trim().toLowerCase();
      if (!p.name.toLowerCase().includes(query) && !c.name.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  // 並び替え（ソート）
  const sortKey = mf.sortKey || mf.sort || 'ovr-desc';
  const getSortOvr = (entry) => {
    const p = entry.player;
    if (entry.isMyClub || typeof getPlayerScoutedView !== 'function') return getPlayerOverallRating(p);
    const sv = getPlayerScoutedView(p, false);
    return sv.isScouted ? getPlayerOverallRating(p) : (sv.ovrMin + sv.ovrMax) / 2;
  };
  const getSortValue = (entry) => {
    const p = entry.player;
    return typeof calculatePlayerMarketValue === 'function' ? calculatePlayerMarketValue(p) : calculateTransferFee(p);
  };
  const getScoutTier = (entry) => {
    if (entry.isMyClub) return 3;
    const intel = gameState.scoutingIntel && gameState.scoutingIntel[entry.player.id];
    return intel && typeof intel.level === 'number' ? intel.level : 0;
  };
  const getAvgRatingNum = (p) => ((p.appearances || 0) > 0 && p.totalRating > 0) ? (p.totalRating / p.appearances) : 0;

  filtered.sort((a, b) => {
    const pA = a.player;
    const pB = b.player;
    switch (sortKey) {
      case 'ovr-desc':
        return getSortOvr(b) - getSortOvr(a);
      case 'ovr-asc':
        return getSortOvr(a) - getSortOvr(b);
      case 'fee-desc':
        return getSortValue(b) - getSortValue(a);
      case 'fee-asc':
        return getSortValue(a) - getSortValue(b);
      case 'wage-desc':
        return (pB.wage || 0) - (pA.wage || 0);
      case 'wage-asc':
        return (pA.wage || 0) - (pB.wage || 0);
      case 'age-asc':
        return pA.age - pB.age;
      case 'age-desc':
        return pB.age - pA.age;
      case 'contract-asc':
        return (pA.isFreeAgent ? 0 : (pA.contractYears || 0)) - (pB.isFreeAgent ? 0 : (pB.contractYears || 0)) || getSortValue(a) - getSortValue(b);
      case 'contract-desc':
        return (pB.isFreeAgent ? 0 : (pB.contractYears || 0)) - (pA.isFreeAgent ? 0 : (pA.contractYears || 0)) || getSortValue(b) - getSortValue(a);
      case 'attr-finishing-desc':
      case 'attr-dribbling-desc':
      case 'attr-passing-desc':
      case 'attr-defending-desc':
      case 'attr-pace-desc':
      case 'attr-stamina-desc': {
        const attrKey = sortKey.replace('attr-', '').replace('-desc', '');
        return getMarketSortableAttrValue(pB, attrKey, b.isMyClub) - getMarketSortableAttrValue(pA, attrKey, a.isMyClub) || getSortOvr(b) - getSortOvr(a);
      }
      case 'goals-desc':
        return (pB.goals || 0) - (pA.goals || 0) || getSortOvr(b) - getSortOvr(a);
      case 'assists-desc':
        return (pB.assists || 0) - (pA.assists || 0) || getSortOvr(b) - getSortOvr(a);
      case 'rating-desc':
        return getAvgRatingNum(pB) - getAvgRatingNum(pA) || (pB.appearances || 0) - (pA.appearances || 0);
      case 'apps-desc':
        return (pB.appearances || 0) - (pA.appearances || 0) || getSortOvr(b) - getSortOvr(a);
      case 'scouted-desc':
        return getScoutTier(b) - getScoutTier(a) || getSortOvr(b) - getSortOvr(a);
      case 'shortlist-desc': {
        const sA = isInShortlist(pA.id) ? 1 : 0;
        const sB = isInShortlist(pB.id) ? 1 : 0;
        return sB - sA || getSortOvr(b) - getSortOvr(a);
      }
      default:
        return getSortOvr(b) - getSortOvr(a);
    }
  });
  updateMarketSortHeaderIndicators(sortKey);

  // サマリーバーの更新（現在資金 ＋ 実質移籍予算を併記）
  const safeColorCls = safeBudget < 0 ? 'text-danger' : 'accent-green';
  const summaryEl = document.getElementById('market-pos-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <span class="power-badge">対象選手 <strong class="mono">${filtered.length}名</strong></span>
      <span class="power-badge">登録枠 <strong class="mono">${squadCount}/${MAX_SQUAD_SIZE}名</strong></span>
      <span class="power-badge">現在資金 <strong class="mono accent-gold">${formatMoney(playerClub.funds)}</strong></span>
      <span class="power-badge" title="今後の週給運転資金を確保した上で安全に使える実質移籍予算">実質移籍予算 <strong class="mono ${safeColorCls}">${formatMoney(safeBudget)}</strong></span>
    `;
  }

  const tbody = document.getElementById('market-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-log-message" style="text-align: center; padding: 24px;">
          条件に合致する選手が見つかりませんでした。フィルターを変更してください。
        </td>
      </tr>
    `;
    return;
  }

  const outgoingList = gameState.outgoingOffers || [];
  const activeScouts = gameState.activeScoutAssignments || [];
  const displayLimit = Math.max(120, mf.displayLimit || 120);
  const displayedEntries = filtered.slice(0, displayLimit);
  let rowsHtml = displayedEntries.map(entry => {
    const p = entry.player;
    const c = entry.club;
    if (typeof ensurePlayerHistoryAndCareer === 'function' && (!Array.isArray(p.seasonHistory) || p.seasonHistory.length === 0)) {
      ensurePlayerHistoryAndCareer(p, c.name);
    }
    const scoutView = typeof getPlayerScoutedView === 'function' ? getPlayerScoutedView(p, entry.isMyClub) : { isScouted: true, ovrDisplay: `${getPlayerOverallRating(p)}`, feeKnown: true };
    const isScoutingNow = activeScouts.find(a => a.playerId === p.id);
    const isPreContracted = Array.isArray(gameState.preContractPlayers) && gameState.preContractPlayers.some(x => x.id === p.id);
    const preContractBadge = isPreContracted ? '<span class="sub-badge badge-precontract">[内定済]</span>' : '';
    const freeBadge = p.isFreeAgent ? '<span class="sub-badge badge-free">[無所属]</span>' : '';
    const euroBadge = entry.category === 'EUROPE' ? `<span class="sub-badge badge-cat-tier" style="background:rgba(56,189,248,0.15);color:#38bdf8;border-color:rgba(56,189,248,0.35);">[${c.country || 'EUR'}]</span>` : '';
    const d2Badge = entry.category === 'ENG_D2' ? `<span class="sub-badge badge-cat-tier" style="background:rgba(148,163,184,0.14);color:#cbd5e1;border-color:rgba(148,163,184,0.3);">[2部]</span>` : '';
    const fee = typeof calculatePlayerMarketValue === 'function' ? calculatePlayerMarketValue(p) : calculateTransferFee(p);
    const feeDisplay = formatMoney(fee);
    const isBargain = p.contractYears === 1 && !p.isFreeAgent;
    const bargainBadge = isBargain ? '<span class="sub-badge badge-bargain">[契約最終年]</span>' : '';
    const myClubBadge = entry.isMyClub ? '<span class="sub-badge" style="background:rgba(46,204,113,0.2);color:#2ecc71;border:1px solid #2ecc71;">自クラブ所属</span>' : '';
    const failedBadge = p.negotiationFailed ? '<span class="sub-badge badge-refused">交渉決裂</span>' : '';
    const footBadge = formatFootBadge(p);

    let actionBtnHtml = '';
    if (entry.isMyClub) {
      actionBtnHtml = `<button type="button" class="btn btn-secondary btn-sm" onclick="switchTab('roster');" title="自クラブの編成一覧へ移動">所属管理</button>`;
    } else {
      const inShortlist = isInShortlist(p.id);
      const activeOutOffer = outgoingList.find(o => o.playerId === p.id && (o.status === 'pending' || o.status === 'agreed' || o.status === 'cpu_counter'));
      let directOfferBtn = '';
      if (isPreContracted) {
        directOfferBtn = `<button type="button" class="btn btn-sm btn-disabled market-offer-slot-btn" disabled style="opacity:0.65;">来季内定</button>`;
      } else if (activeOutOffer) {
        if (activeOutOffer.status === 'agreed') {
          directOfferBtn = `<button type="button" class="btn btn-sm btn-offer-accept market-offer-slot-btn" data-goto-offers="outgoing">契約確定へ</button>`;
        } else if (activeOutOffer.status === 'cpu_counter') {
          directOfferBtn = `<button type="button" class="btn btn-sm market-offer-slot-btn" data-goto-offers="outgoing" style="background:#f39c12;color:#0d1117;">回答確認</button>`;
        } else {
          directOfferBtn = `<button type="button" class="btn btn-sm btn-disabled market-offer-slot-btn" disabled style="opacity:0.65;">回答待(${activeOutOffer.pendingDays || 1}日)</button>`;
        }
      } else {
        directOfferBtn = `<button type="button" class="btn btn-primary btn-sm btn-market-direct-offer market-offer-slot-btn" data-formal-offer-id="${p.id}" ${p.negotiationFailed ? 'disabled' : ''} title="直接オファー・交渉を開く">交渉</button>`;
      }
      let scoutBtn = '';
      if (!scoutView.isScouted) {
        if (isScoutingNow) {
          scoutBtn = `<button type="button" class="btn btn-sm btn-disabled mono market-scout-slot-btn" disabled style="opacity:0.75;">調査中(${isScoutingNow.daysRemaining}日)</button>`;
        } else {
          scoutBtn = `<button type="button" class="btn btn-secondary btn-sm btn-scout-dispatch mono market-scout-slot-btn" data-scout-player-id="${p.id}" title="スカウトを派遣して能力・契約条件を解明">調査</button>`;
        }
      }
      const shortlistBtn = `<button type="button" class="btn btn-sm btn-shortlist-toggle btn-shortlist-icon ${inShortlist ? 'is-active' : 'btn-outline'}" data-shortlist-toggle="${p.id}" title="${inShortlist ? '獲得ターゲット解除' : '獲得ターゲットに追加'}">${inShortlist ? '★' : '☆'}</button>`;
      actionBtnHtml = `<div class="market-action-group">${scoutBtn}${directOfferBtn}${shortlistBtn}</div>`;
    }

    return `
      <tr>
        <td class="col-pos">${formatPlayerPositionsHtml(p)}</td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${p.id}" title="スカウティングレポートを表示">
            ${getPlayerAvatarHtml(p, c, 'avatar-sm table-avatar')}${p.name}
          </button>
          ${preContractBadge}${freeBadge}${euroBadge}${d2Badge}${bargainBadge}${myClubBadge}${failedBadge}
        </td>
        <td class="col-team" title="${c.name}"><span class="team-cell-wrap">${getClubEmblemSvg(c, 18, 'market-club-emblem')}<span class="team-name-text">${c.name}</span></span></td>
        <td class="col-num">${p.age}歳</td>
        <td class="col-num">${footBadge}</td>
        <td class="col-num">${scoutView.isScouted
          ? `<span class="ovr-cell-badge ${getOvrTierClass(getPlayerOverallRating(p))}">${scoutView.ovrDisplay}</span>`
          : `<span class="ovr-cell-badge" style="white-space:nowrap;"><span class="${getOvrTextClass(scoutView.ovrMin)}">${scoutView.ovrMin}</span><span style="color:#ffffff;font-weight:600;margin:0 1px;">~</span><span class="${getOvrTextClass(scoutView.ovrMax)}">${scoutView.ovrMax}</span></span>`}</td>
        <td class="col-num accent-gold mono"><strong>${feeDisplay}</strong></td>
        <td class="col-num mono">${formatWage(p.wage)}</td>
        <td class="col-num ${isBargain ? 'contract-expiring' : ''}">${p.isFreeAgent ? '無所属' : `${p.contractYears}年`}</td>
        <td class="col-action">
          ${actionBtnHtml}
        </td>
      </tr>
    `;
  }).join('');
  if (filtered.length > displayLimit) {
    rowsHtml += `
      <tr class="market-load-more-row">
        <td colspan="10" style="text-align: center; padding: 12px 0;">
          <button type="button" class="btn btn-secondary btn-sm mono" id="btn-market-load-more">さらに表示 (+120名 / 残り ${filtered.length - displayLimit}名)</button>
        </td>
      </tr>
    `;
  }
  tbody.innerHTML = rowsHtml;
  const loadMoreBtn = document.getElementById('btn-market-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      mf.displayLimit = displayLimit + 120;
      renderMarket();
    });
  }
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
}

/**
 * 常設ユースチーム（U-21 Squad）一覧の描画
 */
function renderYouthSquad() {
  const tbody = document.getElementById('youth-squad-tbody');
  const countEl = document.getElementById('youth-squad-count');
  const capEl = document.getElementById('youth-top-capacity');
  const playerClub = getPlayerClub();
  if (!tbody || !playerClub) return;

  const youthList = playerClub.youthSquad || [];
  const topCount = playerClub.players.length;
  const canPromote = topCount < MAX_SQUAD_SIZE && !gameState.isGameOver && !gameState.isSimulating;

  if (countEl) countEl.textContent = `${youthList.length} / ${MAX_YOUTH_SQUAD_SIZE}名`;
  if (capEl) capEl.textContent = `${topCount} / ${MAX_SQUAD_SIZE}名`;

  if (youthList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-log-message" style="text-align: center; padding: 20px;">
          現在ユースチーム選手はいません。シーズン終了時に新アカデミー生が入団します。
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = youthList.map(y => {
    const ovr = getPlayerOverallRating(y);
    const pot = y.potential || y.potentialGrade || 'B';
    const potClass = `stat-rank-${['S', 'A', 'B', 'C', 'D', 'E'].includes(pot) ? pot : 'C'}`;
    const canPromoteBtn = canPromote ? `
      <button type="button" class="btn btn-primary btn-sm btn-promote-youth" data-promote-id="${y.id}" title="トップチームへプロ契約昇格">
        昇格
      </button>
    ` : `<button type="button" class="btn btn-secondary btn-sm" disabled>枠上限</button>`;

    return `
      <tr class="clickable-youth-row" data-profile-id="${y.id}" style="cursor: pointer;">
        <td class="col-pos"><span class="pos-tag pos-${y.pos}">${y.pos}</span></td>
        <td class="col-name">
          <button type="button" class="player-name-link clickable-player-name" data-profile-id="${y.id}" title="詳細プロフィールを表示">
            ${getPlayerAvatarHtml(y, playerClub, 'avatar-sm table-avatar')}${y.name}
          </button>
        </td>
        <td class="col-num col-youth-age">${y.age}歳</td>
        <td class="col-num col-youth-ovr"><span class="ovr-cell-badge ${getOvrTierClass(ovr)}">${ovr}</span></td>
        <td class="col-num col-youth-pot"><span class="youth-pot-val ${potClass}">${pot}</span></td>
        <td class="col-num col-youth-wage mono">${formatWage(y.wage || 2)}</td>
        <td class="col-action">
          <div class="youth-action-group" style="display:flex; gap:4px; justify-content:center;">
            ${canPromoteBtn}
            <button type="button" class="btn btn-secondary btn-sm btn-release-youth" data-release-id="${y.id}" title="ユースチームから放出" ${!gameState.isGameOver && !gameState.isSimulating ? '' : 'disabled'}>
              放出
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(tbody);
  if (typeof renderYouthScoutingPanel === 'function') renderYouthScoutingPanel();
}

function renderYouthScoutingPanel() {
  const container = document.getElementById('youth-scouting-panel');
  const club = getPlayerClub();
  if (!container || !club) return;

  const regions = typeof YOUTH_SCOUT_REGIONS !== 'undefined' ? Object.values(YOUTH_SCOUT_REGIONS) : [];
  const maxSlots = typeof getYouthScoutMaxSlots === 'function' ? getYouthScoutMaxSlots() : 1;
  const activeTasks = Array.isArray(gameState.activeYouthScouts) ? gameState.activeYouthScouts : [];
  const reports = Array.isArray(gameState.youthScoutReports) ? gameState.youthScoutReports : [];
  const canDispatch = activeTasks.length < maxSlots && !gameState.isGameOver && !gameState.isSimulating;

  const regionOptionsHtml = regions.map(r =>
    `<option value="${r.id}">${r.name} (基本 ${formatMoney(r.cost)}〜)</option>`
  ).join('');

  const tasksHtml = activeTasks.length === 0
    ? `<div class="mono text-muted" style="font-size: 11px; padding: 6px 0;">現在派遣中のユーススカウトはありません。数ヶ月単位で派遣すると毎月レポートが届きます。</div>`
    : activeTasks.map(t => {
        const pct = Math.max(5, Math.min(100, Math.round(((t.totalDays - t.daysRemaining) / Math.max(1, t.totalDays)) * 100)));
        const nextRep = typeof t.daysUntilNextReport === 'number' ? t.daysUntilNextReport : 30;
        const repCnt = t.reportsDelivered || 0;
        return `
          <div class="youth-scout-task-row">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:11px; flex-wrap:wrap;" class="mono">
              <span><strong>${t.regionName}</strong> [${t.targetRole === 'ANY' ? '全POS' : t.targetRole} / ${t.durationMonths || 3}ヶ月]</span>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="accent-green">次回報告: ${nextRep}日後 (報告済:${repCnt}回)</span>
                <span class="accent-gold">残${t.daysRemaining}日</span>
                <button type="button" class="btn btn-secondary btn-sm mono btn-recall-youth-scout" data-task-id="${t.id}" style="padding:1px 6px; font-size:10px;">帰還</button>
              </div>
            </div>
            <div class="youth-scout-progress-track"><div class="youth-scout-progress-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('');

  const maxYouth = typeof MAX_YOUTH_SQUAD_SIZE === 'number' ? MAX_YOUTH_SQUAD_SIZE : 10;
  const youthFull = (club.youthSquad || []).length >= maxYouth;
  const topFull = (club.players || []).length >= (typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50);

  const reportsHtml = reports.length === 0
    ? `<div class="mono text-muted" style="font-size: 11px; padding: 8px 0;">発掘済みレポートはまだありません。スカウトを派遣すると有望株が報告されます。</div>`
    : `<div class="youth-reports-grid">${reports.map(y => {
        const ovr = getPlayerOverallRating(y);
        const nat = y.nationality || 'England';
        const flag = typeof getNationalityFlagHtml === 'function' ? getNationalityFlagHtml(nat) : '';
        const footHtml = typeof formatFootBadge === 'function' ? formatFootBadge(y) : '';
        const traits = Array.isArray(y.traits) ? y.traits.slice(0, 2) : [];
        const yPot = y.potential || 'B';
        const yPotCls = `stat-rank-${['S', 'A', 'B', 'C', 'D', 'E'].includes(yPot) ? yPot : 'B'}`;
        const rAtk = getAttributeRankInfo(y.atk);
        const rDef = getAttributeRankInfo(y.def);
        const rSta = getAttributeRankInfo(y.sta);
        return `
          <div class="youth-report-card">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                <span class="pos-tag pos-${y.pos}">${y.pos}</span>
                <strong style="font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${y.fullName || y.name}</strong>
              </div>
              <span class="mono font-bold wage-nowrap" style="display:inline-flex; align-items:center; gap:6px;"><span class="ovr-cell-badge ${getOvrTierClass(ovr)}" style="font-size:12.5px;">OVR ${ovr}</span><span class="${yPotCls}" style="font-size:14px; font-weight:900;">POT ${yPot}</span></span>
            </div>
            <div class="mono text-muted" style="font-size:10.5px; display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
              <span>${flag} ${nat}</span> · <span>${y.age}歳</span>${footHtml ? ` · <span class="profile-meta-foot">${footHtml}</span>` : ''} · <span>${y.scoutRegionName || '発掘'}</span>
            </div>
            <div class="staff-stats-chips" style="margin-top:0;">
              <span class="staff-stat-chip stat-rank-${rAtk.rank}">ATK <strong>${rAtk.rank}</strong> <span style="font-size:10px;opacity:0.75;">${y.atk}</span></span>
              <span class="staff-stat-chip stat-rank-${rDef.rank}">DEF <strong>${rDef.rank}</strong> <span style="font-size:10px;opacity:0.75;">${y.def}</span></span>
              <span class="staff-stat-chip stat-rank-${rSta.rank}">STA <strong>${rSta.rank}</strong> <span style="font-size:10px;opacity:0.75;">${y.sta}</span></span>
              ${traits.map(tr => `<span class="staff-specialty-tag">${tr}</span>`).join('')}
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:2px;">
              <button type="button" class="btn btn-primary btn-sm mono btn-sign-youth-report" data-report-id="${y.id}" ${youthFull ? 'disabled' : ''}>
                ${youthFull ? 'ユース満員' : 'ユース入団'}
              </button>
              <button type="button" class="btn btn-secondary btn-sm mono btn-promote-youth-report" data-report-id="${y.id}" ${topFull ? 'disabled' : ''}>
                トップ昇格
              </button>
              <button type="button" class="btn btn-secondary btn-sm mono btn-dismiss-youth-report" data-report-id="${y.id}">
                見送り
              </button>
            </div>
          </div>
        `;
      }).join('')}</div>`;

  container.innerHTML = `
    <div class="panel-header">
      <div>
        <h2 class="panel-title">ユーススカウト ＆ 選手発掘</h2>
      </div>
      <div class="team-power-badges">
        <span class="power-badge">派遣枠 <strong class="mono accent-green">${activeTasks.length} / ${maxSlots}</strong></span>
        <span class="power-badge">発掘報告 <strong class="mono accent-gold">${reports.length}名</strong></span>
      </div>
    </div>
    <div class="panel-body">
      <div class="youth-scout-controls">
        <div>
          <label class="mono text-muted" style="font-size:10.5px; display:block; margin-bottom:4px;">派遣地域（発掘傾向）</label>
          <select id="youth-scout-region-select" class="settings-select" style="width:100%;">${regionOptionsHtml}</select>
        </div>
        <div>
          <label class="mono text-muted" style="font-size:10.5px; display:block; margin-bottom:4px;">狙うポジション</label>
          <select id="youth-scout-role-select" class="settings-select" style="width:100%;">
            <option value="ANY">全ポジション (ANY)</option>
            <option value="FW">FW (CF / WG)</option>
            <option value="MF">MF (AM / CM / DM)</option>
            <option value="DF">DF (CB / SB)</option>
            <option value="GK">GK</option>
          </select>
        </div>
        <div>
          <label class="mono text-muted" style="font-size:10.5px; display:block; margin-bottom:4px;">派遣期間（毎月報告）</label>
          <select id="youth-scout-duration-select" class="settings-select" style="width:100%;">
            <option value="3">3ヶ月 (90日 / 計3回)</option>
            <option value="6">6ヶ月 (180日 / 計6回)</option>
            <option value="9">9ヶ月 (270日 / 計9回)</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary mono" id="btn-dispatch-youth-scout" ${canDispatch ? '' : 'disabled'}>
          スカウト派遣
        </button>
      </div>
      <div class="mono text-muted" id="youth-scout-cost-preview" style="font-size:10.5px; margin-top:6px;"></div>
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
        ${tasksHtml}
      </div>
      <div style="margin-top:12px;">
        <div class="mono text-muted" style="font-size:11px; font-weight:700;">発掘済み定期レポート（最大12名）</div>
        ${reportsHtml}
      </div>
    </div>
  `;

  const regSelEl = document.getElementById('youth-scout-region-select');
  const durSelEl = document.getElementById('youth-scout-duration-select');
  const previewEl = document.getElementById('youth-scout-cost-preview');
  const updateCostPreview = () => {
    if (!previewEl || !regSelEl || !durSelEl) return;
    const regObj = (typeof YOUTH_SCOUT_REGIONS !== 'undefined' && YOUTH_SCOUT_REGIONS[regSelEl.value]) || null;
    const months = parseInt(durSelEl.value, 10) || 3;
    const cost = typeof getYouthScoutMissionCost === 'function' ? getYouthScoutMissionCost(regObj, months) : 400;
    previewEl.textContent = `派遣費用: ${formatMoney(cost)} ／ 30日ごとに定期レポートが届きます（${regObj ? regObj.desc : ''}）`;
  };
  if (regSelEl) regSelEl.addEventListener('change', updateCostPreview);
  if (durSelEl) durSelEl.addEventListener('change', updateCostPreview);
  updateCostPreview();

  const dispatchBtn = document.getElementById('btn-dispatch-youth-scout');
  if (dispatchBtn) {
    dispatchBtn.addEventListener('click', () => {
      const regSel = document.getElementById('youth-scout-region-select');
      const roleSel = document.getElementById('youth-scout-role-select');
      const durSel = document.getElementById('youth-scout-duration-select');
      const months = durSel ? parseInt(durSel.value, 10) : 3;
      const res = dispatchYouthScout(regSel ? regSel.value : 'england', roleSel ? roleSel.value : 'ANY', months);
      if (!res.ok && typeof showToast === 'function') {
        showToast(res.reason || 'スカウトを派遣できませんでした', 'warn');
      }
      renderAll();
    });
  }

  container.querySelectorAll('.btn-recall-youth-scout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (typeof recallYouthScout === 'function') {
        recallYouthScout(e.currentTarget.dataset.taskId);
        renderAll();
      }
    });
  });

  container.querySelectorAll('.btn-sign-youth-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      signYouthScoutReportToAcademy(e.currentTarget.dataset.reportId);
      renderAll();
    });
  });
  container.querySelectorAll('.btn-promote-youth-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      promoteYouthScoutReportDirectly(e.currentTarget.dataset.reportId);
      renderAll();
    });
  });
  container.querySelectorAll('.btn-dismiss-youth-report').forEach(btn => {
    btn.addEventListener('click', (e) => {
      dismissYouthScoutReport(e.currentTarget.dataset.reportId);
      renderYouthScoutingPanel();
    });
  });
}

/**
 * 業務タスク種別に応じたSVGアイコンを返す（絵文字禁止対応）
 */
function getGmDutyIconSvg(actionKey, level) {
  if (actionKey === 'open-mega-offer' || actionKey === 'goto-market-offers') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>';
  }
  if (actionKey === 'restart-game' || level === 'critical' && actionKey === 'goto-roster-table') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  }
  if (actionKey === 'start-next-season') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
  }
  if (actionKey === 'goto-pitch' || actionKey === 'play-match' || actionKey === 'open-lineup-consultation') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line><circle cx="12" cy="12" r="2.5"></circle></svg>';
  }
  if (actionKey === 'goto-roster-table') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="13" y2="17"></line></svg>';
  }
  if (actionKey === 'goto-youth') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
  }
  if (actionKey === 'goto-facilities') {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path><path d="M9 9v.01"></path><path d="M9 12v.01"></path><path d="M9 15v.01"></path></svg>';
  }
  return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
}

function buildGmDutyBarsHtml(levels) {
  const arr = Array.isArray(levels) && levels.length > 0 ? levels : ['critical', 'recommended', 'optional'];
  return arr.slice(0, 5).map(lv => `<span class="duty-bar-pip bar-${lv}" aria-hidden="true"></span>`).join('');
}

const DUTY_CHEVRON_SVG = '<svg class="gm-task-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';

/**
 * GM業務タスク一覧（必須 CRITICAL / 推奨 RECOMMENDED / 任意 OPTIONAL）を描画する
 */
function renderGmDuties() {
  const listEl = document.getElementById('gm-tasks-list');
  const subtitleEl = document.getElementById('gm-tasks-subtitle');
  if (!listEl) return;

  const playerClub = getPlayerClub();
  if (!playerClub) return;

  let nextMatchInfo = null;
  if (!gameState.isSeasonOver && Array.isArray(gameState.calendar)) {
    const startIdx = Math.max(0, gameState.currentDayIndex || 0);
    for (let i = startIdx; i < gameState.calendar.length; i++) {
      const d = gameState.calendar[i];
      if (!d || d.played) continue;
      const mInfo = typeof getCalendarDayPlayerMatch === 'function' ? getCalendarDayPlayerMatch(d) : null;
      if (mInfo && !mInfo.played) {
        nextMatchInfo = mInfo;
        break;
      }
    }
  }

  if (subtitleEl) {
    if (gameState.isSeasonOver) {
      subtitleEl.textContent = `Season ${gameState.season} オフシーズン経営・編成タスク`;
    } else if (nextMatchInfo && nextMatchInfo.type !== 'league') {
      subtitleEl.textContent = `Season ${gameState.season} / ${nextMatchInfo.title} 優先業務`;
    } else {
      subtitleEl.textContent = `Season ${gameState.season} / 第${Math.min(gameState.currentWeek + 1, gameState.totalWeeks)}節 優先業務`;
    }
  }

  const duties = [];
  const isMarketWindowOpen = !gameState.isSeasonOver && (typeof isTransferWindowCurrentlyOpen === 'function' ? isTransferWindowCurrentlyOpen() : false);
  if (!isMarketWindowOpen && gameState.isSeasonOver && gameState.pendingMegaOffer) {
    gameState.pendingMegaOffer = null;
  }
  if (typeof syncPendingMegaOfferToIncomingOffers === 'function') syncPendingMegaOfferToIncomingOffers();

  // 0. 海外メガクラブからの強奪オファー（移籍市場オープン中・シーズン中のみ最優先CRITICALタスクとして表示）
  if (gameState.pendingMegaOffer && isMarketWindowOpen) {
    const offer = gameState.pendingMegaOffer;
    const targetExists = playerClub.players.some(p => p.id === offer.playerId);
    if (targetExists) {
      duties.push({
        level: 'critical',
        badge: '緊急',
        title: `${offer.megaClubName}から公式オファー`,
        desc: `#${offer.squadNumber} ${offer.playerName}（OVR ${offer.ovr}）に対し移籍金 ${formatMoney(offer.offerAmount)} の提示`,
        warningText: '対応するまで日程を進行できません',
        action: 'open-mega-offer'
      });
    } else {
      gameState.pendingMegaOffer = null;
    }
  }

  // 0.5 債務超過・ゲームオーバー警告
  if (gameState.isGameOver) {
    duties.push({
      level: 'critical',
      badge: '解任',
      title: '債務超過によるGM解任',
      desc: `資金 ${formatMoney(playerClub.funds)} の債務超過によりキャリア終了となりました`,
      action: 'restart-game'
    });
  } else if (playerClub.funds < 0) {
    duties.push({
      level: 'critical',
      badge: '重要',
      title: '赤字解消・人件費削減',
      desc: `資金 ${formatMoney(playerClub.funds)} の赤字です`,
      warningText: '次季開幕までに黒字化しないと解任となります',
      action: 'goto-roster-table'
    });
  }

  // 1. 必須タスク（CRITICAL）
  let criticalDuty = null;
  if (gameState.isSeasonOver) {
    criticalDuty = {
      level: 'critical',
      badge: '重要',
      title: '新シーズン開幕手続き',
      desc: '補強や契約更新、ユース昇格を終えて新シーズンへ進みます',
      action: 'start-next-season'
    };
  } else if (nextMatchInfo && nextMatchInfo.type !== 'league') {
    const venue = nextMatchInfo.isHome ? 'H' : 'A';
    const oppName = nextMatchInfo.oppClub ? nextMatchInfo.oppClub.name : '対戦相手未定';
    criticalDuty = {
      level: 'critical',
      badge: '重要',
      title: `${nextMatchInfo.title} vs ${oppName} (${venue})`,
      desc: 'スタメンと戦術陣形を確認します',
      action: 'goto-pitch'
    };
  } else {
    const nextWeek = Math.min(gameState.currentWeek + 1, gameState.totalWeeks);
    let opponentText = '公式戦';
    const weekFixtures = gameState.schedule && gameState.schedule[gameState.currentWeek];
    if (weekFixtures) {
      const myFixture = weekFixtures.find(f => f.homeId === playerClub.id || f.awayId === playerClub.id);
      if (myFixture) {
        const oppId = myFixture.homeId === playerClub.id ? myFixture.awayId : myFixture.homeId;
        const oppClub = getClubById(oppId);
        const venue = myFixture.homeId === playerClub.id ? 'H' : 'A';
        if (oppClub) opponentText = `vs ${oppClub.name} (${venue})`;
      }
    }
    criticalDuty = {
      level: 'critical',
      badge: '重要',
      title: `第${nextWeek}節 ${opponentText}`,
      desc: 'スタメンと戦術陣形を確認します',
      action: 'goto-pitch'
    };
  }
  duties.push(criticalDuty);

  // 2. 推奨タスク（RECOMMENDED）
  const activeIncomingOffers = isMarketWindowOpen
    ? (gameState.incomingOffers || []).filter(o =>
      (o.status === 'pending' || o.status === 'negotiating' || o.status === 'counter_agreed') && ((o.daysLeft ?? 1) > 0)
    )
    : [];
  if (activeIncomingOffers.length > 0) {
    duties.push({
      level: 'recommended',
      badge: '推奨',
      title: `移籍オファー着信（${activeIncomingOffers.length}件）`,
      desc: '他クラブからの獲得打診。受諾・上乗せ要求・拒否を選択できます',
      action: 'goto-market-offers'
    });
  }
  if (gameState.pendingLineupConsultation) {
    const lc = gameState.pendingLineupConsultation;
    duties.push({
      level: 'recommended',
      badge: lc.kind === 'conflict' ? '仲裁' : '相談',
      title: lc.dutyTitle || '起用法の相談・要望',
      desc: lc.dutyDesc || '監督または選手から起用法に関する相談が届いています',
      action: 'open-lineup-consultation'
    });
  }
  const starters = playerClub.players.filter(p => p.isStarter);
  const injuredStarters = starters.filter(p => p.injuryWeeks > 0);
  const expiringPlayers = playerClub.players
    .filter(p => p && p.contractYears <= 2 && !p.contractRefused && !(p.loanStatus && p.loanStatus.isLoan) && !p.preContractDeparture)
    .sort((a, b) => a.contractYears - b.contractYears || getPlayerOverallRating(b) - getPlayerOverallRating(a));
  const urgentExpiring = expiringPlayers.filter(p => p.contractYears <= 1 || p.megaOfferRejected);
  const outOfPosStarters = starters.filter(p => getPositionFitInfo(p, p.assignedPos || p.pos).type === 'out');

  const lowTrustManager = playerClub.manager && (playerClub.manager.trust ?? 80) < 40 ? playerClub.manager : null;

  let recommendedDuty = null;
  if (injuredStarters.length > 0) {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `負傷者交代（${injuredStarters.length}名）`,
      desc: `${injuredStarters[0].fullName || injuredStarters[0].name} らが負傷離脱中`,
      warningText: '控え選手と交代してください',
      action: 'goto-pitch'
    };
  } else if (lowTrustManager) {
    recommendedDuty = {
      level: 'recommended',
      badge: '要注意',
      title: `監督信頼低下（信頼度 ${lowTrustManager.trust}%）`,
      desc: `${lowTrustManager.name}監督との連携が低下中`,
      warningText: '采配一任や監督人事の見直しが必要です',
      action: 'goto-pitch'
    };
  } else if (urgentExpiring.length > 0) {
    const topTarget = urgentExpiring[0];
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `契約更新（${urgentExpiring.length}名）`,
      desc: `${topTarget.fullName || topTarget.name} らの契約満了が迫っています`,
      action: 'goto-roster-table'
    };
  } else if (outOfPosStarters.length > 0) {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `適性外配置の調整（${outOfPosStarters.length}枠）`,
      desc: `${outOfPosStarters[0].fullName || outOfPosStarters[0].name} が不適性配置です`,
      action: 'goto-pitch'
    };
  } else if (expiringPlayers.length > 0) {
    const topTarget = expiringPlayers[0];
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: `早期契約更新（${expiringPlayers.length}名）`,
      desc: `${topTarget.fullName || topTarget.name} らと契約延長を行えます`,
      action: 'goto-roster-table'
    };
  } else {
    recommendedDuty = {
      level: 'recommended',
      badge: '推奨',
      title: '戦術・状態確認',
      desc: '次戦に向けて選手起用や戦術を微調整します',
      action: 'goto-pitch'
    };
  }
  duties.push(recommendedDuty);

  // 3. 任意タスク（OPTIONAL）
  const youthSquad = playerClub.youthSquad || [];
  const topCount = playerClub.players.length;
  const canPromote = topCount < MAX_SQUAD_SIZE;
  const f = gameState.facilities || { stadium: 1, training: 1, scouting: 1 };
  const minUpgradeCost = Math.min(
    f.stadium < 5 ? FACILITY_DEFINITIONS.stadium.costs[f.stadium] : Infinity,
    f.training < 5 ? FACILITY_DEFINITIONS.training.costs[f.training] : Infinity,
    f.scouting < 5 ? FACILITY_DEFINITIONS.scouting.costs[f.scouting] : Infinity
  );

  let optionalDuty = null;
  if (canPromote && youthSquad.length > 0) {
    optionalDuty = {
      level: 'optional',
      badge: '任意',
      title: `ユース昇格（${youthSquad.length}名在籍）`,
      desc: 'アカデミー有望株をトップチームへ昇格登録できます',
      action: 'goto-youth'
    };
  } else if (playerClub.funds >= minUpgradeCost && minUpgradeCost !== Infinity) {
    optionalDuty = {
      level: 'optional',
      badge: '任意',
      title: '施設投資の検討',
      desc: 'クラブ資金でスタジアムや育成施設を改修できます',
      action: 'goto-facilities'
    };
  } else {
    optionalDuty = {
      level: 'optional',
      badge: '任意',
      title: '移籍市場スカウト',
      desc: '即戦力や若手有望株を移籍市場から調査・獲得できます',
      action: 'goto-market'
    };
  }
  duties.push(optionalDuty);

  const levels = duties.map(d => d.level);
  window._lastGmDutySummary = { count: duties.length, levels };

  const countBadgeEl = document.getElementById('gm-tasks-count-badge');
  if (countBadgeEl) {
    countBadgeEl.textContent = `残り ${duties.length}`;
  }
  const barsEl = document.getElementById('gm-tasks-bars');
  if (barsEl) {
    barsEl.innerHTML = buildGmDutyBarsHtml(levels);
  }

  const isCollapsed = Boolean(gameState.gmTasksCollapsed);
  const toggleBtn = document.getElementById('btn-toggle-gm-tasks');
  const toggleBtnText = document.getElementById('gm-tasks-toggle-text');
  const toggleBtnIcon = document.getElementById('gm-tasks-toggle-icon');
  const miniSummaryEl = document.getElementById('gm-tasks-mini-summary');

  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
  if (toggleBtnText) toggleBtnText.textContent = isCollapsed ? 'すべて表示' : '折りたたむ';
  if (toggleBtnIcon) toggleBtnIcon.textContent = isCollapsed ? '▼' : '▲';

  const isLocked = gameState.isGameOver || gameState.isSimulating;

  // 折りたたみ時の1行サマリー表示（展開時は完全に空＆非表示にして重複を防ぐ）
  if (miniSummaryEl) {
    if (isCollapsed && duties.length > 0) {
      const topDuty = duties[0];
      miniSummaryEl.classList.remove('hidden');
      miniSummaryEl.innerHTML = `
        <div class="gm-task-card duty-${topDuty.level} is-mini ${isLocked && topDuty.action !== 'restart-game' ? 'is-disabled' : ''}" role="button" tabindex="0" data-duty-action="${topDuty.action}" aria-disabled="${isLocked && topDuty.action !== 'restart-game' ? 'true' : 'false'}">
          <div class="duty-icon-stack">
            <span class="duty-icon-circle">${getGmDutyIconSvg(topDuty.action, topDuty.level)}</span>
            <span class="duty-icon-pill">${topDuty.badge}</span>
          </div>
          <div class="gm-task-main">
            <div class="gm-task-title">${topDuty.title}</div>
          </div>
          ${DUTY_CHEVRON_SVG}
        </div>
      `;
    } else {
      miniSummaryEl.classList.add('hidden');
      miniSummaryEl.innerHTML = '';
    }
  }

  if (isCollapsed) {
    listEl.classList.add('hidden');
    listEl.innerHTML = '';
  } else {
    listEl.classList.remove('hidden');
    listEl.innerHTML = duties.map(d => {
      const disabledRow = isLocked && d.action !== 'restart-game';
      return `
        <div class="gm-task-card duty-${d.level} ${disabledRow ? 'is-disabled' : ''}" role="button" tabindex="0" data-duty-action="${d.action}" aria-disabled="${disabledRow ? 'true' : 'false'}">
          <div class="duty-icon-stack">
            <span class="duty-icon-circle">${getGmDutyIconSvg(d.action, d.level)}</span>
            <span class="duty-icon-pill">${d.badge}</span>
          </div>
          <div class="gm-task-main">
            <div class="gm-task-title">${d.title}</div>
            <p class="gm-task-desc">${d.desc}</p>
            ${d.warningText ? `<p class="gm-task-warning-line">${d.warningText}</p>` : ''}
          </div>
          ${DUTY_CHEVRON_SVG}
        </div>
      `;
    }).join('');
  }
}

/**
 * クラブ経営・施設投資（スタジアム / 練習施設 / スカウト網）およびユースアカデミー画面を描画する
 */
function renderFacilitiesAndYouth() {
  renderManagerManagementPanel();
  renderCoachingStaffPanel();
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const f = gameState.facilities || { stadium: 1, training: 1, scouting: 1 };
  const fundsEl = document.getElementById('facilities-current-funds');
  if (fundsEl) fundsEl.textContent = formatMoney(playerClub.funds);

  const stadiumBonusEl = document.getElementById('facilities-stadium-bonus');
  if (stadiumBonusEl) {
    const sLv = f.stadium || 1;
    stadiumBonusEl.textContent = `Lv.${sLv}（${FACILITY_DEFINITIONS.stadium.getEffectText(sLv)}）`;
  }

  const feedbackBanner = document.getElementById('facility-feedback-banner');
  if (feedbackBanner) {
    feedbackBanner.textContent = '';
    feedbackBanner.classList.add('hidden');
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
        pipsHtml += `<span class="facility-pip ${i <= lv ? 'pip-active active' : ''}"></span>`;
      }

      let btnLabel = isMax ? 'MAX達成' : `Lv.${lv + 1} 改修（${formatMoney(nextCost)}）`;
      if (!isMax && playerClub.funds < nextCost) {
        btnLabel = `資金不足（${formatMoney(nextCost)}）`;
      }

      const curEffect = typeof def.getEffectText === 'function' ? def.getEffectText(lv) : '';
      const nextEffect = typeof def.getNextEffectText === 'function' ? def.getNextEffectText(lv) : (isMax ? '最大レベル' : '効果増大');

      return `
        <div class="facility-card ${isMax ? 'facility-maxed' : ''}">
          <div class="facility-card-header">
            <div class="facility-header-left">
              <h3 class="facility-name">${def.name}</h3>
              <button type="button" class="btn-facility-info" data-facility-info="${key}" title="詳細を表示" aria-label="詳細解説">ⓘ</button>
            </div>
            <span class="facility-lv-badge facility-level-badge">Lv.${lv}/${def.maxLevel}</span>
          </div>

          <div class="facility-pips-row">
            ${pipsHtml}
          </div>

          <!-- デフォルト表示：最小限の効果・数値・費用 -->
          <div class="facility-metric-row">
            <div class="facility-metric-item">
              <span class="metric-caption">現在の効果</span>
              <strong class="facility-effect-badge accent-green">${curEffect}</strong>
            </div>
            <div class="facility-metric-item">
              <span class="metric-caption">改修費</span>
              <strong class="facility-cost-badge mono accent-gold">${isMax ? 'MAX' : formatMoney(nextCost)}</strong>
            </div>
          </div>

          <div class="facility-card-footer">
            <button type="button" class="btn btn-primary btn-sm btn-upgrade-facility" data-upgrade-facility="${key}" ${canAfford ? '' : 'disabled'}>
              ${btnLabel}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (typeof renderBoardPsrSponsorPanel === 'function') {
    renderBoardPsrSponsorPanel(playerClub);
  }
}

/**
 * 全クラブ・移籍市場・ユース候補から指定IDの選手と所属情報を検索する
 */
function findPlayerWithContextById(playerId) {
  for (const club of getAllManagedLeagueClubs()) {
    const found = (club.players || []).find(p => p.id === playerId);
    if (found) {
      return { player: found, club, clubName: club.name, isMarket: false, isPlayerClub: club.isPlayer, isYouth: false };
    }
    if (club.youthSquad) {
      const youthFound = club.youthSquad.find(p => p.id === playerId);
      if (youthFound) {
        return {
          player: youthFound,
          club,
          clubName: `${club.name} U-21ユース`,
          isMarket: false,
          isPlayerClub: club.isPlayer,
          isYouth: true
        };
      }
    }
  }
  if (typeof getEuropeanCompetitionClubsWithPlayers === 'function') {
    for (const euroClub of getEuropeanCompetitionClubsWithPlayers()) {
      const found = (euroClub.players || []).find(p => p && p.id === playerId);
      if (found) {
        return {
          player: found,
          club: euroClub,
          clubName: euroClub.name,
          isMarket: true,
          isPlayerClub: false,
          isYouth: false
        };
      }
    }
  }
  if (Array.isArray(gameState.euroTransferList)) {
    const euroFound = gameState.euroTransferList.find(p => p && p.id === playerId);
    if (euroFound) {
      const euroDef = (typeof findEuropeanClubDefinitionById === 'function')
        ? findEuropeanClubDefinitionById(euroFound.euroClubId || euroFound.clubId)
        : null;
      const virtualClub = euroDef
        ? { ...euroDef, shortCode: euroDef.shortName, isPlayer: false, isEuroVirtual: true }
        : { id: 'euro_club', name: '欧州主要クラブ', shortName: 'EUR', shortCode: 'EUR', primaryColor: '#1e3a8a', secondaryColor: '#f8fafc', isEuroVirtual: true };
      return {
        player: euroFound,
        club: virtualClub,
        clubName: virtualClub.name,
        isMarket: true,
        isPlayerClub: false,
        isYouth: false
      };
    }
  }
  const marketFound = gameState.transferMarket.find(p => p.id === playerId);
  if (marketFound) {
    const freeClubStub = { id: 'FREE_AGENT', name: '無所属 (Free Agent)', shortName: 'FA', shortCode: 'FA', primaryColor: '#475569', secondaryColor: '#e2e8f0' };
    return { player: marketFound, club: freeClubStub, clubName: '無所属 (Free Agent)', isMarket: true, isPlayerClub: false, isYouth: false };
  }
  const youthFound = (gameState.youthCandidates || []).find(p => p.id === playerId);
  if (youthFound) {
    const playerClub = getPlayerClub();
    return {
      player: youthFound,
      club: playerClub || null,
      clubName: `${playerClub ? playerClub.name : 'クラブ'} ユースアカデミー（昇格候補）`,
      isMarket: false,
      isPlayerClub: true
    };
  }
  if (gameState.competitionStats && typeof gameState.competitionStats === 'object') {
    for (const bucket of Object.values(gameState.competitionStats)) {
      if (bucket && bucket[playerId]) {
        const entry = bucket[playerId];
        const euroDef = (typeof findEuropeanClubDefinitionById === 'function' && entry.clubId)
          ? findEuropeanClubDefinitionById(entry.clubId)
          : null;
        const preClub = (gameState.competitions && gameState.competitions.preseasonCup && Array.isArray(gameState.competitions.preseasonCup.participants))
          ? gameState.competitions.preseasonCup.participants.find(c => c && c.id === entry.clubId)
          : null;
        const refDef = euroDef || preClub;
        const basePow = (refDef && refDef.basePower) || 78;
        const vClub = refDef
          ? { ...refDef, shortCode: refDef.shortName || refDef.shortCode || 'EUR', isPlayer: false, isEuroVirtual: true }
          : { id: entry.clubId || 'ext_club', name: entry.clubName || '海外クラブ', shortName: 'EXT', shortCode: 'EXT', primaryColor: '#1e3a8a', secondaryColor: '#f8fafc', isPlayer: false, isEuroVirtual: true };
        const curW = typeof gameState.currentWeek === 'number' ? gameState.currentWeek : 0;
        const domApps = curW > 0 ? Math.max(0, Math.round(curW * (basePow >= 80 ? 0.86 : 0.76))) : 0;
        const domPos = entry.pos || 'MF';
        const domGRate = (domPos === 'CF' || domPos === 'ST') ? 0.42 : (domPos === 'FW' ? 0.34 : (['LW', 'RW', 'WG'].includes(domPos) ? 0.28 : (domPos === 'AM' ? 0.22 : (['LM', 'RM', 'SM'].includes(domPos) ? 0.13 : (domPos === 'CM' || domPos === 'MF' ? 0.10 : (domPos === 'DM' ? 0.06 : (domPos === 'GK' ? 0 : 0.055)))))));
        const domARate = domPos === 'GK' ? 0 : (domPos === 'AM' ? 0.20 : (['LW', 'RW', 'WG', 'LM', 'RM', 'SM'].includes(domPos) ? 0.16 : 0.10));
        const domGoals = domPos === 'GK' ? 0 : Math.round(domApps * domGRate);
        const domAssists = domPos === 'GK' ? 0 : Math.round(domApps * domARate);
        const totalApps = (entry.apps || 0) + domApps;
        const avgRt = clamp(6.6 + (basePow - 72) * 0.035, 6.4, 7.8);
        const vPlayer = {
          id: entry.id,
          name: entry.name,
          fullName: entry.fullName || entry.name,
          nationality: entry.nationality || resolveClubCountryToNationality(vClub.country, vClub.id),
          pos: entry.pos || 'MF',
          primaryPosition: entry.pos || 'MF',
          secondaryPositions: [],
          squadNumber: entry.squadNumber || 10,
          age: 25,
          atk: basePow,
          def: basePow - 4,
          sta: 85,
          salary: 3500,
          wage: 68,
          contractYears: 3,
          appearances: totalApps,
          goals: (entry.goals || 0) + domGoals,
          assists: (entry.assists || 0) + domAssists,
          totalRating: (entry.totalRating || 0) + Number((domApps * avgRt).toFixed(2)),
          cleanSheets: (entry.cleanSheets || 0) + (domPos === 'GK' ? Math.round(domApps * 0.36) : 0),
          momCount: entry.momCount || 0,
          yellowCards: entry.yellowCards || 0,
          redCards: entry.redCards || 0,
          fatigue: 0
        };
        return {
          player: vPlayer,
          club: vClub,
          clubName: vClub.name,
          isMarket: false,
          isPlayerClub: false,
          isYouth: false
        };
      }
    }
  }
  return null;
}

/**
 * 能力値(0-99)からアルファベットランク(S〜E)と表示色を返す
 */
function getAttributeRankInfo(val) {
  const v = typeof val === 'number' && !Number.isNaN(val) ? val : 50;
  if (v >= 90) return { rank: 'S', color: '#7dd3fc', cls: 'hex-rank-s' };
  if (v >= 80) return { rank: 'A', color: '#2ecc71', cls: 'hex-rank-a' };
  if (v >= 70) return { rank: 'B', color: '#a3e635', cls: 'hex-rank-b' };
  if (v >= 60) return { rank: 'C', color: '#fbbf24', cls: 'hex-rank-c' };
  if (v >= 50) return { rank: 'D', color: '#fb923c', cls: 'hex-rank-d' };
  return { rank: 'E', color: '#f87171', cls: 'hex-rank-e' };
}

/**
 * 選手カード用の六角形レーダーチャートSVGを生成する
 * 頂点順（時計回り・上から）：決定力、ドリブル、パス、守備、スピード、スタミナ
 */
function buildPlayerHexagonChartSvg(attrs, scoutRanges = null) {
  const axes = [
    { key: 'finishing', label: '決定力', val: attrs.finishing || 50, angleDeg: -90 },
    { key: 'dribbling', label: 'ドリブル', val: attrs.dribbling || 50, angleDeg: -30 },
    { key: 'passing',   label: 'パス',     val: attrs.passing   || 50, angleDeg: 30 },
    { key: 'defending', label: '守備',     val: attrs.defending || 50, angleDeg: 90 },
    { key: 'pace',      label: 'スピード', val: attrs.pace      || 50, angleDeg: 150 },
    { key: 'stamina',   label: 'スタミナ', val: attrs.stamina   || 50, angleDeg: -150 }
  ].map(a => {
    const r = scoutRanges && scoutRanges[a.key] ? scoutRanges[a.key] : null;
    if (r) {
      const midVal = Math.round((r.min + r.max) / 2);
      return { ...a, val: midVal, min: r.min, max: r.max, isRange: true, displayVal: `${r.min}~${r.max}` };
    }
    return { ...a, isRange: false, displayVal: `${a.val}` };
  });

  const cx = 125;
  const cy = 112;
  const maxR = 52;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getPoint = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: +(cx + r * Math.cos(rad)).toFixed(1),
      y: +(cy + r * Math.sin(rad)).toFixed(1)
    };
  };

  // 同心正六角形グリッド
  const gridPolygons = levels.map(lv => {
    const pts = axes.map(a => {
      const pt = getPoint(a.angleDeg, maxR * lv);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    const isOuter = lv === 1.0;
    return `<polygon points="${pts}" class="${isOuter ? 'hex-grid-outer' : 'hex-grid-inner'}" />`;
  }).join('');

  // 中心から各頂点への軸線
  const axisLines = axes.map(a => {
    const pt = getPoint(a.angleDeg, maxR);
    return `<line x1="${cx}" y1="${cy}" x2="${pt.x}" y2="${pt.y}" class="hex-axis-line" />`;
  }).join('');

  // 未調査時の上限推定ポリゴン（幅の可視化）
  const hasAnyRange = axes.some(a => a.isRange);
  let rangeMaxPolyHtml = '';
  if (hasAnyRange) {
    const maxPts = axes.map(a => {
      const ratio = clamp((a.max || a.val) / 100, 0.12, 1.0);
      const pt = getPoint(a.angleDeg, maxR * ratio);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    rangeMaxPolyHtml = `<polygon points="${maxPts}" fill="rgba(46, 204, 113, 0.10)" stroke="rgba(46, 204, 113, 0.42)" stroke-width="1" stroke-dasharray="3 2" />`;
  }

  // 選手の能力値ポリゴンと頂点ドット
  const valPoints = axes.map(a => {
    const ratio = clamp(a.val / 100, 0.12, 1.0);
    return { ...a, pt: getPoint(a.angleDeg, maxR * ratio) };
  });

  const dataPolyPts = valPoints.map(v => `${v.pt.x},${v.pt.y}`).join(' ');
  const dataDots = valPoints.map(v => {
    const rankInfo = getAttributeRankInfo(v.val);
    return `<circle cx="${v.pt.x}" cy="${v.pt.y}" r="3.2" class="hex-data-dot" style="fill:${rankInfo.color};" />`;
  }).join('');

  // ラベル・ランク（S〜E）・数値の3段配置
  const labelsSvg = axes.map(a => {
    const rankInfo = getAttributeRankInfo(a.val);
    let lx = cx;
    let lyName = cy;
    let lyRank = cy;
    let lyVal = cy;
    const anchor = 'middle';

    if (a.angleDeg === -90) {
      lx = cx;
      lyName = 16;
      lyRank = 35;
      lyVal = 49;
    } else if (a.angleDeg === 90) {
      lx = cx;
      lyName = 180;
      lyRank = 199;
      lyVal = 213;
    } else if (a.angleDeg === -30) {
      lx = 210;
      lyName = 68;
      lyRank = 87;
      lyVal = 101;
    } else if (a.angleDeg === 30) {
      lx = 210;
      lyName = 132;
      lyRank = 151;
      lyVal = 165;
    } else if (a.angleDeg === 150) {
      lx = 40;
      lyName = 132;
      lyRank = 151;
      lyVal = 165;
    } else if (a.angleDeg === -150) {
      lx = 40;
      lyName = 68;
      lyRank = 87;
      lyVal = 101;
    }

    const rankText = a.isRange ? `${rankInfo.rank}?` : rankInfo.rank;
    const valSvgHtml = a.isRange
      ? `<text x="${lx}" y="${lyVal}" text-anchor="${anchor}" class="hex-label-val-sub"><tspan class="${getOvrTierClass(a.min)}">${a.min}</tspan><tspan fill="#8b949e">~</tspan><tspan class="${getOvrTierClass(a.max)}">${a.max}</tspan></text>`
      : `<text x="${lx}" y="${lyVal}" text-anchor="${anchor}" class="hex-label-val-sub">${a.displayVal}</text>`;

    return `
      <g class="hex-label-group">
        <text x="${lx}" y="${lyName}" text-anchor="${anchor}" class="hex-label-name">${a.label}</text>
        <text x="${lx}" y="${lyRank}" text-anchor="${anchor}" class="hex-label-rank" fill="${rankInfo.color}">${rankText}</text>
        ${valSvgHtml}
      </g>
    `;
  }).join('');

  return `
    <div class="profile-hexagon-wrap">
      <svg viewBox="0 0 250 224" class="profile-hexagon-svg" role="img" aria-label="選手能力六角形チャート">
        ${gridPolygons}
        ${axisLines}
        ${rangeMaxPolyHtml}
        <polygon points="${dataPolyPts}" class="hex-data-polygon" />
        ${dataDots}
        ${labelsSvg}
      </svg>
    </div>
  `;
}

/**
 * 選手プロフィールモーダル内のタブ切り替え（能力 / 今季成績 / 年別成績 / 市場価値推移 / 経歴）
 */
function switchProfileModalTab(tabKey) {
  const validTabs = ['ability', 'season', 'yearly', 'market-value', 'career'];
  const activeKey = validTabs.includes(tabKey) ? tabKey : 'ability';
  gameState.profileActiveTab = activeKey;

  const subnavEl = document.getElementById('profile-subnav-bar');
  if (subnavEl) {
    subnavEl.querySelectorAll('.profile-tab-btn').forEach(btn => {
      const isMatch = btn.dataset.profileTab === activeKey;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  const bodyEl = document.getElementById('profile-modal-body');
  if (bodyEl) {
    bodyEl.querySelectorAll('.profile-tab-panel').forEach(panel => {
      const isMatch = panel.dataset.profilePanel === activeKey;
      panel.classList.toggle('hidden', !isMatch);
    });
    bodyEl.scrollTop = 0;
  }

  const cardEl = document.getElementById('player-profile-modal-card');
  if (cardEl) cardEl.scrollTop = 0;
}

/**
 * 選手の年別成績（seasonHistory）および経歴タイムライン（careerEvents）を一貫生成・補完する
 */
function ensurePlayerHistoryAndCareer(p, currentClubName) {
  if (!p) return { seasonHistory: [], careerEvents: [], birthYear: 2002 };

  const isFreeAgentClubStr = (str) => !str || str.includes('無所属') || str.includes('Free Agent') || str === '現所属クラブ' || str === 'クラブ';
  const isCurrentlyFreeAgent = Boolean(p.isFreeAgent || isFreeAgentClubStr(currentClubName));

  // 選手IDおよび名前から決定論的ハッシュ値を算出
  const seedStr = `${p.id || 'p'}_${p.name || 'player'}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const absHash = Math.abs(hash);

  const curSeasonNum = gameState.season || 1;
  const curBaseYear = 2025 + curSeasonNum; // Season 1 => 2026-27
  const isOffseasonNewFreeAgent = Boolean(typeof gameState !== 'undefined' && gameState.isSeasonOver && p._generatedInOffseasonOfSeason === curSeasonNum);
  const effectiveBaseYear = isOffseasonNewFreeAgent ? (curBaseYear + 1) : curBaseYear;
  const birthYear = effectiveBaseYear - (p.age || 22);
  const baseOvr = getPlayerOverallRating(p);
  const primaryPos = p.primaryPosition || p.preferredPosition || p.pos || 'CM';

  // 無所属または前所属情報が欠損・不正な場合は実在風の架空前所属クラブを決定論的に割り当てる
  if (isFreeAgentClubStr(p.lastClubName)) {
    p.lastClubName = typeof pickFormerClubForPlayer === 'function'
      ? pickFormerClubForPlayer(p, 0, isCurrentlyFreeAgent ? null : currentClubName)
      : 'ノース・ロンドンFC';
  }

  const pastMainClubName = (isCurrentlyFreeAgent || p.signedFromFreeAgent)
    ? p.lastClubName
    : currentClubName;

  // 過去シーズン数の算出（原則18歳デビューだが、18-19歳の高OVR早熟スターは16-17歳デビュー扱い）
  const curPWeightAge = p.age || 18;
  const debutBaseAge = (curPWeightAge <= 19 && baseOvr >= 80) ? (baseOvr >= 84 ? 16 : 17) : 18;
  const pastSeasonsCount = Math.max(0, curPWeightAge - debutBaseAge);

  const needsHistoryRebuild = !Array.isArray(p.seasonHistory) || p.seasonHistory.some(r => !r || isFreeAgentClubStr(r.clubName));
  if (needsHistoryRebuild) {
    // 無所属表記などで壊れていた既存の市場価値履歴も再生成させるためリセット
    if (Array.isArray(p.seasonHistory)) {
      p.valueHistory = null;
    }

    const history = [];
    const hadCareerStats = Boolean(p.careerStats && typeof p.careerStats.goals === 'number');
    const careerApps = p.careerStats ? Math.max(p.appearances || 0, p.careerStats.appearances || 0) : (p.appearances || 0);
    const rawCareerGoals = p.careerStats ? Math.max(p.goals || 0, p.careerStats.goals || 0) : (p.goals || 0);

    if (!p.careerStats) p.careerStats = { appearances: careerApps, goals: rawCareerGoals, assists: 0 };

    let totalPastApps = Math.max(0, careerApps - (p.appearances || 0));
    const minAppsPerYear = baseOvr >= 82 ? 35 : (baseOvr >= 75 ? 29 : (baseOvr >= 68 ? 22 : 15));
    if (pastSeasonsCount > 0 && totalPastApps < pastSeasonsCount * Math.max(12, minAppsPerYear - 5)) {
      const minExpectedPastApps = pastSeasonsCount * (minAppsPerYear + (absHash % 9));
      totalPastApps = minExpectedPastApps;
      p.careerStats.appearances = totalPastApps + (p.appearances || 0);
    }

    let totalPastGoals = Math.max(0, rawCareerGoals - (p.goals || 0));
    if (pastSeasonsCount > 0 && primaryPos !== 'GK' && (!hadCareerStats || (totalPastGoals === 0 && (pastSeasonsCount >= 2 || totalPastApps >= 18)))) {
      const atkScale = clamp(0.76 + (baseOvr - 70) * 0.026, 0.65, 1.38);
      const midScale = clamp(0.82 + (baseOvr - 70) * 0.018, 0.74, 1.24);
      let gRate = 0.055;
      if (primaryPos === 'CB' || primaryPos === 'LB' || primaryPos === 'RB' || primaryPos === 'SB' || primaryPos === 'LWB' || primaryPos === 'RWB' || primaryPos === 'DF') gRate = 0.055;
      else if (primaryPos === 'DM') gRate = 0.06;
      else if (primaryPos === 'CM') gRate = 0.095 * midScale;
      else if (primaryPos === 'LM' || primaryPos === 'RM' || primaryPos === 'SM' || primaryPos === 'MF') gRate = 0.125 * midScale;
      else if (primaryPos === 'AM') gRate = 0.21 * atkScale;
      else if (primaryPos === 'LW' || primaryPos === 'RW' || primaryPos === 'WG') gRate = 0.27 * atkScale;
      else if (primaryPos === 'CF' || primaryPos === 'ST') gRate = 0.45 * atkScale;
      else if (primaryPos === 'FW') gRate = 0.34 * atkScale;
      const jitterG = 0.82 + ((absHash % 10) / 25); // 0.82 .. 1.18
      totalPastGoals = Math.max(0, Math.round(totalPastApps * gRate * jitterG));
      p.careerStats.goals = totalPastGoals + (p.goals || 0);
    }

    // キャリア通算アシスト数の取得・決定論的補完（未設定または0補完が必要な場合）
    if (typeof p.careerStats.assists !== 'number' || (pastSeasonsCount > 0 && p.careerStats.assists === 0 && primaryPos !== 'GK')) {
      let aRate = 0.02;
      if (primaryPos === 'GK') aRate = 0;
      else if (primaryPos === 'CB' || primaryPos === 'DF') aRate = 0.02;
      else if (primaryPos === 'LB' || primaryPos === 'RB' || primaryPos === 'SB' || primaryPos === 'LWB' || primaryPos === 'RWB') aRate = 0.08;
      else if (primaryPos === 'DM') aRate = 0.06;
      else if (primaryPos === 'CM' || primaryPos === 'MF') aRate = 0.12;
      else if (primaryPos === 'LM' || primaryPos === 'RM' || primaryPos === 'SM') aRate = 0.16;
      else if (primaryPos === 'AM') aRate = 0.20;
      else if (primaryPos === 'LW' || primaryPos === 'RW' || primaryPos === 'WG') aRate = 0.18;
      else if (primaryPos === 'CF' || primaryPos === 'ST' || primaryPos === 'FW') aRate = 0.10;
      const jitterA = 0.8 + ((absHash % 17) / 40);
      p.careerStats.assists = primaryPos === 'GK' ? 0 : Math.max(0, Math.round((totalPastApps + (p.appearances || 0)) * aRate * jitterA));
    }
    const careerAssists = Math.max(p.assists || 0, p.careerStats.assists || 0);
    const totalPastAssists = Math.max(0, careerAssists - (p.assists || 0));

    // 過去所属クラブの決定（プロ年数に応じて最大3〜4クラブへの移籍履歴を生成）
    let clubCount = 1;
    if (pastSeasonsCount >= 8) {
      const rMod = absHash % 10;
      if (rMod < 3) clubCount = 4;
      else if (rMod < 8) clubCount = 3;
      else if (rMod < 9) clubCount = 2;
      else clubCount = 1;
    } else if (pastSeasonsCount >= 4) {
      const rMod = absHash % 10;
      if (rMod < 3) clubCount = 3;
      else if (rMod < 8) clubCount = 2;
      else clubCount = 1;
    } else if (pastSeasonsCount >= 2) {
      clubCount = (absHash % 3 === 0) ? 1 : 2;
    }

    const clubTimeline = [];
    let nextExclude = pastMainClubName;
    for (let cIdx = clubCount - 1; cIdx >= 0; cIdx--) {
      if (cIdx === clubCount - 1) {
        clubTimeline.unshift(pastMainClubName);
      } else {
        const picked = typeof pickFormerClubForPlayer === 'function'
          ? pickFormerClubForPlayer(p, cIdx + 1, nextExclude)
          : pastMainClubName;
        const resolved = (picked && picked !== nextExclude) ? picked : pastMainClubName;
        clubTimeline.unshift(resolved);
        nextExclude = resolved;
      }
    }

    const resolveClubForSeasonIdx = (sIdx) => {
      if (clubTimeline.length <= 1 || pastSeasonsCount <= 1) return pastMainClubName;
      const ratio = sIdx / Math.max(1, pastSeasonsCount);
      const bucket = Math.min(clubTimeline.length - 1, Math.floor(ratio * clubTimeline.length));
      return clubTimeline[bucket] || pastMainClubName;
    };

    if (pastSeasonsCount > 0) {
      const curveMeta = (typeof getGrowthCurveMeta === 'function')
        ? getGrowthCurveMeta(p.growthCurve)
        : { peakAge: 27, riseSlope: 1.4, fallSlope: 1.2 };
      const calcCurveOffset = (a) => (a <= curveMeta.peakAge)
        ? -Math.max(0, curveMeta.peakAge - a) * curveMeta.riseSlope
        : -Math.max(0, a - curveMeta.peakAge) * curveMeta.fallSlope;
      const curAge = typeof p.age === 'number' && !Number.isNaN(p.age) ? p.age : 22;
      const currentOffset = calcCurveOffset(curAge);

      // 成熟期（21歳以上、または過去3シーズン以上）から決定論的にキャリアハイ年・準好調年を選出
      const isAttackRole = (
        primaryPos === 'CF' || primaryPos === 'ST' || primaryPos === 'LW' ||
        primaryPos === 'RW' || primaryPos === 'WG' || primaryPos === 'AM' || primaryPos === 'FW'
      );
      const primeCandidates = [];
      for (let i = 0; i < pastSeasonsCount; i++) {
        if (debutBaseAge + i >= 21) primeCandidates.push(i);
      }
      let peakSeasonIdx = -1;
      let subPeakSeasonIdx = -1;
      if (primeCandidates.length >= 1) {
        // 複数年ある場合はキャリア後半〜ピーク年齢近辺をやや優先して選出
        const weightedCand = primeCandidates.filter(idx => {
          const ageAt = debutBaseAge + idx;
          return ageAt >= Math.min(curAge - 1, Math.max(22, curveMeta.peakAge - 4)) && ageAt <= curveMeta.peakAge + 3;
        });
        const pool = weightedCand.length > 0 ? weightedCand : primeCandidates;
        peakSeasonIdx = pool[absHash % pool.length];
        if (primeCandidates.length >= 3) {
          const remaining = primeCandidates.filter(idx => idx !== peakSeasonIdx);
          subPeakSeasonIdx = remaining[((absHash >>> 4) + 1) % remaining.length];
        }
      } else if (pastSeasonsCount >= 3) {
        peakSeasonIdx = pastSeasonsCount - 1;
      }

      // 各年度の重みを計算して出場数・ゴール数・アシスト数を整数配分
      const appWeights = [];
      const goalWeights = [];
      const assistWeights = [];
      let sumAppW = 0;
      let sumGoalW = 0;
      let sumAssistW = 0;

      for (let i = 0; i < pastSeasonsCount; i++) {
        const ageAtSeason = debutBaseAge + i;
        const maturity = ageAtSeason <= 19 ? 0.50 : (ageAtSeason <= 21 ? 0.78 : 1.0);
        const jitter = 0.85 + (((absHash >> (i % 8)) & 7) / 25);
        const seasonSeed = (absHash ^ Math.imul(i + 1, 2654435761)) >>> 0;

        let awMul = 1.0;
        let gwMul = 0.64 + ((seasonSeed % 9) / 25); // 通常年は 0.64 .. 0.96
        let astwMul = 0.82 + (((absHash >> ((i + 5) % 8)) & 7) / 20);

        if (i === peakSeasonIdx) {
          awMul = 1.18;
          const peakBase = (isAttackRole && baseOvr >= 75) ? 1.56 : 1.35;
          gwMul = peakBase + ((seasonSeed % 4) * 0.05); // 攻撃主力なら 1.56 .. 1.71 倍の明確なキャリアハイ年
          astwMul *= 1.18;
        } else if (i === subPeakSeasonIdx) {
          awMul = 1.07;
          gwMul = (isAttackRole && baseOvr >= 75) ? 1.24 : 1.14;
          astwMul *= 1.08;
        }

        const aw = maturity * jitter * awMul;
        const gw = maturity * gwMul;
        const astw = maturity * astwMul;
        appWeights.push(aw);
        goalWeights.push(gw);
        assistWeights.push(astw);
        sumAppW += aw;
        sumGoalW += gw;
        sumAssistW += astw;
      }

      let remApps = totalPastApps;
      let remGoals = totalPastGoals;
      let remAssists = totalPastAssists;

      for (let i = 0; i < pastSeasonsCount; i++) {
        const seasonStartYr = effectiveBaseYear - (pastSeasonsCount - i);
        const seasonYearStr = `${seasonStartYr}-${String((seasonStartYr + 1) % 100).padStart(2, '0')}`;
        const ageAtSeason = debutBaseAge + i;
        const isLast = (i === pastSeasonsCount - 1);

        let apps = isLast ? remApps : Math.round((totalPastApps * appWeights[i]) / Math.max(0.01, sumAppW));
        apps = clamp(apps, 1, Math.min(50, Math.max(1, remApps - (pastSeasonsCount - 1 - i))));
        remApps = Math.max(0, remApps - apps);

        let goals = isLast ? remGoals : Math.round((totalPastGoals * goalWeights[i]) / Math.max(0.01, sumGoalW));
        goals = clamp(goals, 0, remGoals);
        if (apps === 0) goals = 0;
        remGoals = Math.max(0, remGoals - goals);

        let assists = isLast ? remAssists : Math.round((totalPastAssists * assistWeights[i]) / Math.max(0.01, sumAssistW));
        assists = clamp(assists, 0, remAssists);
        if (apps === 0) assists = 0;
        remAssists = Math.max(0, remAssists - assists);

        const pastOffset = calcCurveOffset(ageAtSeason);
        const ovrSeasonJitter = isLast ? 0 : (((absHash >> (i % 10)) % 5) - 2) * 0.4;
        const estOvr = clamp(Math.round(baseOvr + (pastOffset - currentOffset) + ovrSeasonJitter), 50, 95);
        const ovrBonus = (estOvr - 65) * 0.042;
        const goalContrib = (goals / Math.max(8, apps || 1)) * 0.75;
        const assistContrib = (assists / Math.max(8, apps || 1)) * 0.45;
        const defPosBonus = (primaryPos === 'GK' || primaryPos === 'CB' || primaryPos === 'DM') ? Math.max(0, (estOvr - 72) * 0.015) : 0;
        const seasonJitter = (((absHash >> (i % 12)) % 9) - 4) * 0.04;
        const baseR = 6.52 + ovrBonus + goalContrib + assistContrib + defPosBonus + seasonJitter;
        const avgR = apps > 0 ? clamp(baseR, 6.20, 8.55).toFixed(2) : 'N/A';
        const clubAtSeason = resolveClubForSeasonIdx(i);

        history.push({
          seasonYear: seasonYearStr,
          clubName: clubAtSeason,
          age: ageAtSeason,
          appearances: apps,
          goals: goals,
          assists: assists,
          avgRating: avgR,
          ovr: estOvr
        });
      }

      // 端数が残った場合は最終過去シーズンに加算してキャリア通算と完全一致させる
      if (remApps > 0 && history.length > 0) {
        history[history.length - 1].appearances += remApps;
      }
      if (remGoals > 0 && history.length > 0) {
        history[history.length - 1].goals += remGoals;
      }
      if (remAssists > 0 && history.length > 0) {
        history[history.length - 1].assists += remAssists;
      }
    }

    p.seasonHistory = history;
    const hasTransferred = clubTimeline.length > 1;
    p._formerClubName = hasTransferred ? clubTimeline[0] : null;
    p._transferYear = hasTransferred
      ? (effectiveBaseYear - Math.max(1, Math.floor(pastSeasonsCount / clubTimeline.length)))
      : null;
  }

  // 経歴タイムラインイベントの生成（p.seasonHistory の所属クラブ変遷と完全一致させる）
  const histArr = Array.isArray(p.seasonHistory) ? p.seasonHistory : [];
  const firstHist = histArr.length > 0 ? histArr[0] : null;
  const firstHistYear = (firstHist && firstHist.seasonYear) ? parseInt(String(firstHist.seasonYear).slice(0, 4), 10) : null;
  const firstHistAge = (firstHist && typeof firstHist.age === 'number') ? firstHist.age : 18;
  const debutAgeForEvent = Math.min(18, firstHistAge);
  const debutYear = !Number.isNaN(firstHistYear) && firstHistYear ? firstHistYear : (birthYear + debutAgeForEvent);
  const youthYear = Math.min(birthYear + 15, debutYear - 1);

  const validFirstHistClub = (firstHist && !isFreeAgentClubStr(firstHist.clubName)) ? firstHist.clubName : null;
  const validFormerClub = !isFreeAgentClubStr(p._formerClubName) ? p._formerClubName : null;
  const originClub = validFirstHistClub || validFormerClub || pastMainClubName;

  const careerEvents = [
    {
      year: `${youthYear}年`,
      badge: 'YOUTH',
      title: `${originClub} ユースアカデミー入団`,
      desc: `下部組織に入団し、${primaryPos}を主戦場に頭角を現す。`
    }
  ];

  if ((p.age || 18) >= debutAgeForEvent) {
    careerEvents.push({
      year: `${debutYear}年`,
      badge: 'DEBUT',
      title: `${originClub} トップチーム昇格・プロデビュー`,
      desc: `${debutAgeForEvent}歳でプロ契約を締結し公式戦デビュー。持ち前の${(Array.isArray(p.traits) && p.traits[0]) || 'プレイスタイル'}で評価を高める。`
    });
  }

  // seasonHistory 上のクラブ変更を時系列で抽出
  const transferSteps = [];
  let prevClubTrack = originClub;
  for (let i = 0; i < histArr.length; i++) {
    const sh = histArr[i];
    if (!sh || isFreeAgentClubStr(sh.clubName)) continue;
    if (sh.clubName !== prevClubTrack) {
      const yrNum = parseInt(String(sh.seasonYear || '').slice(0, 4), 10);
      transferSteps.push({
        year: !Number.isNaN(yrNum) && yrNum > 0 ? yrNum : (debutYear + i),
        fromClub: prevClubTrack,
        toClub: sh.clubName
      });
      prevClubTrack = sh.clubName;
    }
  }
  if (!isCurrentlyFreeAgent && !p.signedFromFreeAgent && !isFreeAgentClubStr(currentClubName) && prevClubTrack !== currentClubName) {
    transferSteps.push({
      year: curBaseYear,
      fromClub: prevClubTrack,
      toClub: currentClubName
    });
  }

  if (transferSteps.length > 0) {
    transferSteps.forEach((tr, idx) => {
      const descText = idx === 0
        ? `${tr.fromClub}での活躍が認められ、戦力補強の目玉として${tr.toClub}へ加入。`
        : `${tr.fromClub}でのプレーを経てさらなるステップアップを求め、${tr.toClub}へ完全移籍。`;
      careerEvents.push({
        year: `${tr.year}年`,
        badge: 'TRANSFER',
        title: `${tr.toClub} へ完全移籍`,
        desc: descText
      });
    });
  } else if ((p.age || 18) >= 21) {
    careerEvents.push({
      year: `${debutYear + 2}年`,
      badge: 'SQUAD',
      title: `${pastMainClubName} 主力メンバー定着`,
      desc: `コンスタントな出場機会を確保し、中核選手としてシーズンを戦う。`
    });
  }

  if (!isCurrentlyFreeAgent && p.signedFromFreeAgent) {
    const freeJoinYr = p.signedFreeAgentYear || curBaseYear;
    careerEvents.push({
      year: `${freeJoinYr}年`,
      badge: 'TRANSFER',
      title: `${currentClubName} へフリー加入`,
      desc: `${pastMainClubName}との契約満了後、フリーエージェントを経て${currentClubName}へ加入。`
    });
  }

  // 現在のステータス
  const curSeasonStr = `${curBaseYear}-${String((curBaseYear + 1) % 100).padStart(2, '0')}`;
  const curAssists = typeof p.assists === 'number' ? p.assists : 0;
  if (isCurrentlyFreeAgent) {
    careerEvents.push({
      year: `${curSeasonStr} (現在)`,
      badge: 'CURRENT',
      title: `${pastMainClubName} 契約満了・無所属（OVR ${baseOvr}）`,
      desc: `${pastMainClubName}との契約が満了し、現在はフリーエージェントとして新天地を探している。`
    });
  } else {
    careerEvents.push({
      year: `${curSeasonStr} (現在)`,
      badge: 'CURRENT',
      title: `${currentClubName} 在籍（契約残り${p.contractYears}年 / OVR ${baseOvr}）`,
      desc: `今季ここまで ${p.appearances || 0}試合出場・${p.goals || 0}得点・${curAssists}アシスト。${p.isStarter ? `スタメン（${p.assignedPos || primaryPos}）として稼働中。` : 'スカッドの一員としてシーズンを戦う。'}`
    });
  }

  return {
    seasonHistory: p.seasonHistory,
    careerEvents,
    birthYear,
    curSeasonStr
  };
}

/**
 * 選手の市場価値推移履歴（valueHistory）を初期化・補完する
 * プレイ開始前の数年前（デビュー時〜過去各シーズン）からの成長・市場価値曲線を一貫して保持
 */
function ensurePlayerValueHistory(p, currentClubName) {
  if (!p) return [];

  // 既存の履歴に NaN や無効値が含まれている場合は強制的に再生成
  const hasInvalid = Array.isArray(p.valueHistory) && p.valueHistory.some(pt => !pt || typeof pt.value !== 'number' || Number.isNaN(pt.value) || typeof pt.ovr !== 'number' || Number.isNaN(pt.ovr));
  if (hasInvalid) {
    p.valueHistory = null;
  }

  const currentVal = calculatePlayerMarketValue(p);
  const currentOvr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(p) : (p.ovr || 70);
  const currentAge = typeof p.age === 'number' && !Number.isNaN(p.age) ? p.age : 24;
  const posVal = p.primaryPosition || p.pos || '';

  const historyData = ensurePlayerHistoryAndCareer(p, currentClubName);
  const { seasonHistory } = historyData;

  const vHistory = [];

  // 1. プレイしていない数年前からの過去各シーズンの市場価値推移
  if (seasonHistory && seasonHistory.length > 0) {
    // 累積通算出場数を計算しながら直近6シーズン分を抽出
    const startIdx = Math.max(0, seasonHistory.length - 6);
    let cumApps = 0;
    for (let idx = 0; idx < startIdx; idx++) {
      cumApps += (seasonHistory[idx] && seasonHistory[idx].appearances) ? seasonHistory[idx].appearances : 0;
    }
    const pastSubset = seasonHistory.slice(-6);
    pastSubset.forEach((sh) => {
      const shOvr = (typeof sh.ovr === 'number' && !Number.isNaN(sh.ovr)) ? sh.ovr : 65;
      const shAge = (typeof sh.age === 'number' && !Number.isNaN(sh.age)) ? sh.age : 22;
      cumApps += (sh.appearances || 0);
      const parsedAvg = parseFloat(sh.avgRating);
      const perfStats = {
        appearances: sh.appearances || 0,
        goals: sh.goals || 0,
        assists: sh.assists || 0,
        avgRating: Number.isNaN(parsedAvg) ? null : parsedAvg,
        pos: posVal,
        careerApps: cumApps
      };
      const approxVal = calculateMarketValueFromOvrAndAge(shOvr, shAge, 2, perfStats);
      vHistory.push({
        label: `${sh.seasonYear.slice(2, 7)} (${shAge}歳)`,
        shortLabel: `${sh.seasonYear.slice(2, 7)}`,
        fullLabel: `${sh.seasonYear} (${shAge}歳 / OVR ${shOvr})`,
        season: sh.seasonYear,
        age: shAge,
        ovr: shOvr,
        value: approxVal,
        isPast: true
      });
    });
  }

  // 2. 若手選手（過去シーズンが少ない場合）でも現在年齢より若い範囲で推移を自然に補完
  if (vHistory.length === 0) {
    if (currentAge >= 18) {
      const debutAge = currentAge - 2;
      const debutOvr = Math.max(50, currentOvr - 4);
      const debutVal = calculateMarketValueFromOvrAndAge(debutOvr, debutAge, 3, { careerApps: 8, pos: posVal });
      vHistory.push({
        label: `2年前 (${debutAge}歳)`,
        shortLabel: `2年前`,
        fullLabel: `プロデビュー初期 (${debutAge}歳 / OVR ${debutOvr})`,
        season: 'Debut',
        age: debutAge,
        ovr: debutOvr,
        value: debutVal,
        isPast: true
      });
      const midAge = currentAge - 1;
      const midOvr = Math.max(52, currentOvr - 2);
      const midVal = calculateMarketValueFromOvrAndAge(midOvr, midAge, 2, { careerApps: 18, pos: posVal });
      vHistory.push({
        label: `前年 (${midAge}歳)`,
        shortLabel: `前年`,
        fullLabel: `前シーズン (${midAge}歳 / OVR ${midOvr})`,
        season: 'LastSeason',
        age: midAge,
        ovr: midOvr,
        value: midVal,
        isPast: true
      });
    } else if (currentAge >= 16) {
      const prevAge = currentAge - 1;
      const prevOvr = Math.max(48, currentOvr - 2);
      const prevVal = calculateMarketValueFromOvrAndAge(prevOvr, prevAge, 3, { careerApps: 0, pos: posVal });
      vHistory.push({
        label: `前年 (${prevAge}歳)`,
        shortLabel: `前年`,
        fullLabel: `アカデミー時代 (${prevAge}歳 / OVR ${prevOvr})`,
        season: 'Academy',
        age: prevAge,
        ovr: prevOvr,
        value: prevVal,
        isPast: true
      });
    }
  } else if (vHistory.length === 1) {
    // 過去1年のみの場合、15歳以上であればデビュー時の基点を先頭に補足
    const firstH = vHistory[0];
    if (firstH.age > 15) {
      const debutAge = firstH.age - 1;
      const debutOvr = Math.max(48, firstH.ovr - 3);
      const debutVal = calculateMarketValueFromOvrAndAge(debutOvr, debutAge, 3, { careerApps: 0, pos: posVal });
      vHistory.unshift({
        label: `デビュー (${debutAge}歳)`,
        shortLabel: `デビュー`,
        fullLabel: `プロデビュー時 (${debutAge}歳 / OVR ${debutOvr})`,
        season: 'Debut',
        age: debutAge,
        ovr: debutOvr,
        value: debutVal,
        isPast: true
      });
    }
  }

  // 3. 最新（現在）の市場価値ポイント
  vHistory.push({
    label: `現在 (${currentAge}歳)`,
    shortLabel: `現在`,
    fullLabel: `現在 (${currentAge}歳 / OVR ${currentOvr})`,
    season: 'Current',
    age: currentAge,
    ovr: currentOvr,
    value: currentVal,
    isCurrent: true
  });

  p.valueHistory = vHistory;
  p._mvSchema = 2;
  return vHistory;
}

/**
 * SVG折れ線グラフの内部コンテンツを生成するヘルパー関数（PC・モバイル両対応）
 */
function renderMarketValueSvgContent(p, history, W, H, isMobile = false) {
  const values = history.map(h => (Number.isFinite(h.value) ? h.value : 0));
  const peakVal = values.length > 0 ? Math.max(...values) : 1000;
  const safePeakVal = Number.isFinite(peakVal) && peakVal > 0 ? peakVal : 1000;

  const padL = isMobile ? 58 : 72;
  const padR = isMobile ? 32 : 44;
  const padT = isMobile ? 36 : 38;
  const padB = isMobile ? 44 : 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Y軸のスケール（最小値0〜最大値+25%でキリの良い数値に丸め）
  const yMin = 0;
  const rawMax = Math.max(safePeakVal * 1.25, 2000);
  const yMax = Number.isFinite(rawMax) && rawMax > 0 ? (rawMax > 50000 ? Math.ceil(rawMax / 10000) * 10000 : Math.ceil(rawMax / 5000) * 5000) : 5000;

  const getX = (idx) => {
    if (history.length === 1) return padL + plotW / 2;
    return padL + (idx / (history.length - 1)) * plotW;
  };
  const getY = (val) => {
    const ratio = (val - yMin) / (yMax - yMin);
    return padT + plotH - ratio * plotH;
  };

  // グリッド線（モバイルは縦長のため5段階、PCは4段階）
  const gridSteps = isMobile ? [0.20, 0.40, 0.60, 0.80, 1.0] : [0.25, 0.50, 0.75, 1.0];
  let gridLinesSvg = '';
  gridSteps.forEach(step => {
    const valAtStep = yMin + (yMax - yMin) * step;
    const yPos = getY(valAtStep);
    const label = formatMoney(valAtStep);
    gridLinesSvg += `
      <line x1="${padL}" y1="${yPos.toFixed(1)}" x2="${W - padR}" y2="${yPos.toFixed(1)}" stroke="#22272e" stroke-dasharray="3,3" stroke-width="1" />
      <text x="${padL - (isMobile ? 8 : 10)}" y="${(yPos + 4).toFixed(1)}" fill="#6c757d" font-size="${isMobile ? '10' : '10.5'}" font-family="var(--font-mono)" text-anchor="end">${label}</text>
    `;
  });
  // ベースライン（y = 0）
  const baseLineY = getY(0);
  gridLinesSvg += `<line x1="${padL}" y1="${baseLineY.toFixed(1)}" x2="${W - padR}" y2="${baseLineY.toFixed(1)}" stroke="#343a40" stroke-width="1.5" />`;

  // 各データポイントの座標算出
  const points = history.map((h, i) => ({
    x: getX(i),
    y: getY(h.value),
    h
  }));

  // 折れ線用 points 文字列
  const polylinePoints = points.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  // エリア（塗りつぶし）用 path 文字列
  const areaPathD = `
    M ${points[0].x.toFixed(1)} ${baseLineY.toFixed(1)}
    L ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}
    ${points.slice(1).map(pt => `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')}
    L ${points[points.length - 1].x.toFixed(1)} ${baseLineY.toFixed(1)}
    Z
  `;

  // X軸ラベルと各データポイント（サークル・値ラベル）
  let pointsSvg = '';
  let xLabelsSvg = '';
  const gradId = `mvGrad_${isMobile ? 'm_' : 'd_'}${p.id || Math.random().toString(36).slice(2, 7)}`;

  // PEAK と 現在値のラベル衝突判定
  const hasPeakNearLast = points.length >= 2 && (() => {
    const last = points[points.length - 1];
    const peakIdx = points.findIndex(pt => pt.h.value === peakVal);
    if (peakIdx === -1 || peakIdx === points.length - 1) return false;
    const peak = points[peakIdx];
    const dx = Math.abs(last.x - peak.x);
    const dy = Math.abs(last.y - peak.y);
    return dx < 75 && dy < 36;
  })();

  points.forEach((pt, i) => {
    const isPeak = (pt.h.value === peakVal && peakVal > 0);
    const isLast = (i === points.length - 1);
    const formattedVal = formatMoney(pt.h.value);

    // 簡潔な年度ラベル（例: "2020-21" -> "'20", "Debut" -> "初期", "Current" -> "現在"）
    let seasonShort = '';
    const rawSeason = pt.h.season || '';
    if (isLast || rawSeason === 'Current') {
      seasonShort = '現在';
    } else if (rawSeason === 'Debut') {
      seasonShort = '初期';
    } else if (rawSeason.length >= 4 && rawSeason.includes('-')) {
      const startYr = rawSeason.split('-')[0];
      seasonShort = `'${startYr.slice(-2)}`;
    } else {
      seasonShort = pt.h.shortLabel || rawSeason;
    }

    // X軸ラベル（2段組：上段に年度、下段に年齢で横幅重なりを100%防止）
    xLabelsSvg += `
      <text x="${pt.x.toFixed(1)}" y="${(baseLineY + (isMobile ? 13 : 15)).toFixed(1)}" text-anchor="middle" font-family="var(--font-mono)">
        <tspan x="${pt.x.toFixed(1)}" fill="${isLast ? 'var(--accent-green)' : (isPeak ? 'var(--accent-gold)' : '#9ba3af')}" font-size="${isMobile ? '10' : '11'}" font-weight="${isLast || isPeak ? '700' : '500'}">${seasonShort}</tspan>
        <tspan x="${pt.x.toFixed(1)}" dy="${isMobile ? '10' : '11.5'}" fill="#64748b" font-size="${isMobile ? '8.5' : '9.5'}">${pt.h.age}歳</tspan>
      </text>
    `;

    // サークルと値ラベル（青文字は廃止し、PEAK/現在以外は通常色に統一）
    if (isPeak) {
      pointsSvg += `
        <!-- PEAKハイライト -->
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isMobile ? 8 : 9}" fill="rgba(241, 196, 15, 0.25)" />
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isMobile ? 5 : 5.5}" fill="#f1c40f" stroke="#14171b" stroke-width="2.5" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - (isMobile ? 11 : 13)).toFixed(1)}" fill="#f1c40f" font-size="${isMobile ? '10.5' : '11.5'}" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">PEAK ${formattedVal}</text>
      `;
    } else if (isLast) {
      // PEAKがすぐ横にある場合はラベルを下側に逃がして文字重なりを回避
      const lastLabelY = hasPeakNearLast ? (pt.y + (isMobile ? 15 : 18)) : (pt.y - (isMobile ? 10 : 12));
      pointsSvg += `
        <!-- 現在値ハイライト -->
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isMobile ? 7.5 : 8}" fill="rgba(46, 204, 113, 0.25)" />
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isMobile ? 4.5 : 5}" fill="#2ecc71" stroke="#14171b" stroke-width="2.5" />
        <text x="${pt.x.toFixed(1)}" y="${lastLabelY.toFixed(1)}" fill="#2ecc71" font-size="${isMobile ? '10.5' : '11.5'}" font-family="var(--font-mono)" font-weight="800" text-anchor="middle">現在 ${formattedVal}</text>
      `;
    } else {
      // 通常点（左端を含むすべての過去年を通常色で表示）
      pointsSvg += `
        <circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${isMobile ? 3 : 3.5}" fill="#14171b" stroke="#94a3b8" stroke-width="2" />
        <text x="${pt.x.toFixed(1)}" y="${(pt.y - 8).toFixed(1)}" fill="#cbd5e1" font-size="${isMobile ? '9' : '10'}" font-family="var(--font-mono)" text-anchor="middle">${formattedVal}</text>
      `;
    }
  });

  return `
    <svg class="market-value-svg" data-device="${isMobile ? 'mobile' : 'desktop'}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2ecc71" stop-opacity="0.35" />
          <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.10" />
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      ${gridLinesSvg}
      <path d="${areaPathD}" fill="url(#${gradId})" />
      <polyline points="${polylinePoints}" fill="none" stroke="#2ecc71" stroke-width="${isMobile ? '2.5' : '3'}" stroke-linecap="round" stroke-linejoin="round" />
      ${pointsSvg}
      ${xLabelsSvg}
    </svg>
  `;
}

/**
 * 選手の市場価値推移をインラインSVG折れ線グラフ（Area Chart）として描画（数年前〜現在）
 * モバイルでは縦幅余白を限界まで活かした縦長SVG（360x480）、PCではワイドSVG（640x340）を両立描画
 */
function buildPlayerMarketValueChartSvg(p, currentClubName) {
  const history = ensurePlayerValueHistory(p, currentClubName);
  if (!history || history.length === 0) {
    return `<div class="empty-chart-msg" style="padding: 40px 0; text-align: center; color: #8b949e;">市場価値データがありません</div>`;
  }

  const desktopSvg = renderMarketValueSvgContent(p, history, 640, 340, false);
  const mobileSvg = renderMarketValueSvgContent(p, history, 360, 480, true);

  return `
    <div class="market-value-chart-wrapper">
      ${desktopSvg}
      ${mobileSvg}
    </div>
  `;
}

/**
 * 選手プロフィールモーダル用：市場価値推移タブのHTML構築（グラフ単体・大型表示）
 */
function buildPlayerMarketValueTabHtml(p, currentClubName) {
  const chartSvgHtml = buildPlayerMarketValueChartSvg(p, currentClubName);

  return `
    <div class="profile-tab-panel hidden" data-profile-panel="market-value">
      <div class="profile-box profile-box-market-value" style="padding: 0; background: transparent; border: none; height: 100%; display: flex; flex-direction: column;">
        <div class="profile-chart-section" style="margin-top: 0; height: 100%; display: flex; flex-direction: column; flex: 1;">
          ${chartSvgHtml}
        </div>
      </div>
    </div>
  `;
}

let lastProfileOpenScrollY = 0;
let lastProfileOpenContainerScrolls = [];

function openPlayerProfileModal(playerId) {
  const existingModalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  const isAlreadyOpen = existingModalEl && !existingModalEl.classList.contains('hidden');
  if (!isAlreadyOpen) {
    // プロフィールを開く直前のスクロール位置（画面全体＆主要ビュー）を保存
    lastProfileOpenScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    lastProfileOpenContainerScrolls = [];
    document.querySelectorAll('.tab-view, .table-container, .main-scroll-container, #view-roster, #view-market, #view-team, #view-office').forEach(el => {
      if (el && el.scrollTop > 0) {
        lastProfileOpenContainerScrolls.push({ el, top: el.scrollTop });
      }
    });
  }

  const ctx = findPlayerWithContextById(playerId);
  if (!ctx) return;

  const { player: p, clubName, isMarket } = ctx;
  const historyData = ensurePlayerHistoryAndCareer(p, clubName);
  const { seasonHistory, careerEvents, birthYear, curSeasonStr } = historyData;
  const isFreeAgentPlayer = Boolean(p.isFreeAgent || (clubName && clubName.includes('無所属')));
  const clubDisplayLabel = isFreeAgentPlayer ? `無所属 (前所属: ${p.lastClubName} / 契約満了)` : clubName;
  gameState.profileModalPlayerId = p.id;
  const isCandidate = (gameState.youthCandidates || []).some(y => y.id === p.id);

  const primaryPos = p.primaryPosition || p.preferredPosition || p.pos;
  const subPosList = Array.isArray(p.secondaryPositions) ? p.secondaryPositions : [];
  const baseOvr = getPlayerOverallRating(p);
  const effOvr = getEffectivePlayerRating(p);
  const playerClub = getPlayerClub();
  const isYouth = ctx.isYouth || (playerClub && playerClub.youthSquad || []).some(y => y.id === p.id);
  const isMyClubPlayer = Boolean(ctx.isPlayerClub || (playerClub && playerClub.players && playerClub.players.some(x => x.id === p.id)));
  const scoutView = (isMyClubPlayer || isYouth || isCandidate)
    ? { isScouted: true, scoutLevel: 2, ovrDisplay: `${baseOvr}`, ovrMin: baseOvr, ovrMax: baseOvr }
    : (typeof getPlayerScoutedView === 'function'
      ? getPlayerScoutedView(p, false)
      : { isScouted: true, scoutLevel: 2, ovrDisplay: `${baseOvr}`, ovrMin: baseOvr, ovrMax: baseOvr });
  const ovrDisplayText = scoutView.isScouted ? `${baseOvr}` : `${scoutView.ovrMin}~${scoutView.ovrMax}`;
  const ovrDisplayHtml = scoutView.isScouted ? `${baseOvr}` : buildOvrRangeHtml(scoutView.ovrMin, scoutView.ovrMax);
  const ovrColorSeed = scoutView.isScouted ? baseOvr : Math.round((scoutView.ovrMin + scoutView.ovrMax) / 2);

  const headerFootEl = document.getElementById('profile-header-foot');
  if (headerFootEl) {
    headerFootEl.innerHTML = '';
  }
  const headerOvrEl = document.getElementById('profile-header-ovr');
  if (headerOvrEl) {
    const valEl = headerOvrEl.querySelector('.profile-header-ovr-val');
    if (valEl) {
      if (scoutView.isScouted) {
        valEl.textContent = baseOvr;
        valEl.className = `profile-header-ovr-val ${getOvrTierClass(baseOvr)}`;
      } else {
        valEl.innerHTML = ovrDisplayHtml;
        valEl.className = 'profile-header-ovr-val';
      }
      valEl.style.background = 'none';
      valEl.style.fontSize = scoutView.isScouted ? '' : '16px';
    }
  }
  const avgRating = p.appearances > 0 ? (p.totalRating / p.appearances).toFixed(2) : 'N/A';
  const pFtgVal = getPlayerFatigue(p);
  const pFtgStatus = getPlayerFatigueStatus(pFtgVal);
  const isInjured = Boolean((p.injuryDays && p.injuryDays > 0) || (p.injuryWeeks && p.injuryWeeks > 0));
  const clubPlayedMatches = Math.max(1, (playerClub && playerClub.played) || gameState.currentWeek || 0);
  const appRate = (p.appearances || 0) > 0
    ? Math.min(100, Math.round(((p.appearances || 0) / clubPlayedMatches) * 100))
    : 0;
  const estMarketValue = typeof calculatePlayerMarketValue === 'function' ? calculatePlayerMarketValue(p) : calculateTransferFee(p);
  const weeklyWageVal = p.wage || Math.max(1, Math.round((p.salary || 520) / 52));
  const roleStatusText = isMarket
    ? '移籍リスト登録中'
    : (isYouth ? 'ユースアカデミー在籍' : (p.isStarter ? `スタメン起用 (${p.assignedPos || primaryPos})` : 'ベンチ・控え登録'));
  const conditionText = isInjured
    ? `負傷離脱中 (残り${p.injuryDays || (p.injuryWeeks * 7)}日)`
    : '良好 (出場可能)';
  const conditionClass = isInjured ? 'text-danger' : 'accent-green';

  const footLabelMap = {
    Right: 'Right',
    Left: 'Left',
    Both: 'Both'
  };
  const footShortMap = {
    Right: '右利き',
    Left: '左利き',
    Both: '両利き'
  };
  const footText = footLabelMap[p.preferredFoot] || p.preferredFoot || 'Right';
  const footShortText = footShortMap[p.preferredFoot] || '右利き';
  const heightText = typeof p.height === 'number' ? `${p.height}cm` : (p.height || '180cm');
  const rawNat = p.nationality || 'England';
  const flagHtml = getNationalityFlagHtml(rawNat);
  const nationalityDisplay = `<span style="display:inline-flex;align-items:center;gap:5px;"><span class="profile-flag-wrapper">${flagHtml}</span><span>${rawNat}</span></span>`;
  const squadNumText = `#${p.squadNumber || 10}`;
  const traits = Array.isArray(p.traits) && p.traits.length > 0 ? p.traits : ['ハードワーカー'];
  const careerApps = p.careerStats ? p.careerStats.appearances : p.appearances;
  const careerGoals = p.careerStats ? p.careerStats.goals : p.goals;

  const attrs = getPlayerFiveAttributes(p);

  const topBarEl = document.getElementById('profile-top-club-bar');
  if (topBarEl) {
    const clubColor = (ctx.club && ctx.club.primaryColor) || (isFreeAgentPlayer ? '#475569' : '#2ecc71');
    topBarEl.style.setProperty('--profile-club-accent', clubColor);
  }
  const squadNumEl = document.getElementById('profile-squad-num');
  if (squadNumEl) squadNumEl.textContent = squadNumText;

  const topStatusEl = document.getElementById('profile-top-status');
  if (topStatusEl) {
    topStatusEl.textContent = '';
    topStatusEl.className = 'profile-top-status-badge mono hidden';
  }

  // スカウティングレポート用 大型ドット絵アバター（64x64 / 2倍スケール描画）
  const avatarCanvasEl = document.getElementById('profile-avatar-canvas');
  if (avatarCanvasEl && typeof generatePlayerAvatar === 'function') {
    const isCandidate = (gameState.youthCandidates || []).some(y => y.id === p.id);
    const avatarClub = findAvatarClubForPlayer(p) || (isCandidate ? playerClub : null);
    generatePlayerAvatar(p, avatarCanvasEl, avatarClub);
  }

  const clubLabelEl = document.getElementById('profile-club-label');
  if (clubLabelEl) clubLabelEl.innerHTML = `${getClubEmblemSvg(ctx.club || clubName, 17, 'profile-club-emblem')}<span>${clubDisplayLabel}</span>`;

  ensurePlayerProficiencies(p);
  const mains = Array.isArray(p.mainPositions) && p.mainPositions.length > 0
    ? p.mainPositions
    : (Array.isArray(p.majorPositions) && p.majorPositions.length > 0 ? p.majorPositions : [primaryPos]);
  const subsRaw = Array.isArray(p.subPositions) ? p.subPositions : (Array.isArray(p.secondaryPositions) ? p.secondaryPositions : []);
  const subsFiltered = subsRaw.filter(sp => !mains.includes(sp));

  const posPillEl = document.getElementById('profile-pos-pill');
  if (posPillEl) {
    const subPosTextHtml = subsFiltered.length > 0
      ? `<span class="profile-meta-subpos">/${subsFiltered.join('·')}</span>`
      : '';
    posPillEl.innerHTML = `
      <span class="profile-meta-mainpos">${mains.join('·')}</span>${subPosTextHtml}
      <span class="profile-meta-sep">|</span>
      <span class="profile-meta-foot">${formatFootBadge(p)}</span>
      <span class="profile-meta-text">${heightText}</span>
      <span class="profile-meta-sep">|</span>
      <span class="profile-meta-nat">${nationalityDisplay}</span>
    `;
  }

  const nameEl = document.getElementById('profile-player-name');
  if (nameEl) {
    const displayFullName = p.fullName || p.name;
    nameEl.innerHTML = `<span class="profile-name-main">${displayFullName}</span><span class="profile-age-inline">(${p.age})</span>`;
  }

  const bioRowEl = document.getElementById('profile-bio-row');
  if (bioRowEl) {
    let youthMetaHtml = '';
    if (isYouth) {
      const potRank = p.potential || p.potentialGrade || 'B';
      const potRankClass = potRank === 'S' ? 'stat-rank-S' : (potRank === 'A' ? 'stat-rank-A' : (potRank === 'B' ? 'stat-rank-B' : (potRank === 'C' ? 'stat-rank-C' : (potRank === 'D' ? 'stat-rank-D' : 'stat-rank-E'))));
      youthMetaHtml = `
        <span class="profile-bio-chip">想定週給 <strong class="accent-green">£${(p.wage || 2.5).toLocaleString()}k/週</strong></span>
        <span class="profile-bio-sep">·</span>
        <span class="profile-bio-chip ${potRankClass}" style="font-weight:800;">POT: ${potRank}</span>
      `;
    } else {
      youthMetaHtml = `
        <span class="profile-bio-chip">${isMarket ? '要求週給' : '週給'} <strong class="accent-gold">£${weeklyWageVal.toLocaleString()}k/週</strong></span>
        <span class="profile-bio-sep">·</span>
        <button type="button" class="profile-inline-mv-link profile-metric-clickable" data-switch-profile-tab="market-value" title="市場価値推移グラフを表示">市場価値 <strong class="accent-green">${formatMoney(estMarketValue)}</strong></button>
        <span class="profile-bio-sep">·</span>
        <span class="profile-bio-chip">契約 ${p.contractYears}年</span>
      `;
    }

    bioRowEl.innerHTML = youthMetaHtml;
  }

  // 6大能力パラメータの六角形レーダーチャート（決定力・ドリブル・パス・守備・スピード・スタミナ）
  let scoutAttrRanges = null;
  if (!scoutView.isScouted) {
    const attrSpread = scoutView.scoutLevel === 1 ? 3 : 7;
    const baseSeed = String(p.id || 'p').split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 0);
    scoutAttrRanges = {};
    ['finishing', 'dribbling', 'passing', 'defending', 'pace', 'stamina'].forEach((k, idx) => {
      const realVal = attrs[k] || 50;
      const shift = ((baseSeed + idx * 13) % (attrSpread + 1)) - Math.floor(attrSpread / 2);
      const minV = clamp(realVal - attrSpread + shift, 20, realVal);
      const maxV = clamp(Math.max(minV + (scoutView.scoutLevel === 1 ? 3 : 6), realVal + attrSpread + shift), realVal, 99);
      scoutAttrRanges[k] = { min: minV, max: maxV };
    });
  }
  const hexagonChartHtml = buildPlayerHexagonChartSvg(attrs, scoutAttrRanges);

  // ポジション特訓・適性強化セクション（自クラブ選手のみに表示）
  let trainingSectionHtml = '';
  if (isMyClubPlayer && !isCandidate && primaryPos !== 'GK') {
    const { upgradeCandidates, newSubCandidates } = getEligiblePositionTrainingTargets(p);
    const completedTrainCount = p.positionTrainingCount || 0;
    const maxTrainSlots = getMaxConcurrentPositionTrainingSlots();
    const activeTrainCount = getActivePositionTrainingCount(playerClub);
    const limitReached = completedTrainCount >= MAX_POSITION_TRAINING_PER_PLAYER;
    const slotFull = activeTrainCount >= maxTrainSlots;
    const speedHint = p.age <= 23 ? '若手補正: 習得速め' : (p.age >= 30 ? 'ベテラン補正: 習得緩やか' : '標準ペース');

    if (p.positionTraining && p.positionTraining.active && p.positionTraining.targetPos) {
      const tPos = p.positionTraining.targetPos;
      const mode = p.positionTraining.mode || 'sub';
      const modeText = mode === 'major' ? '本適性へ昇格' : '薄適性を習得';
      const prog = Math.min(100, Math.round(p.positionTraining.progress || 0));
      trainingSectionHtml = `
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">適性特訓</div>
          <div class="ui-kv-content">
            <div class="profile-training-box" style="margin-top: 0;">
              <div class="training-info-row">
                <span>目標: <span class="pos-tag pos-${tPos}"><strong>${tPos === 'LB' ? 'LB/LWB' : (tPos === 'RB' ? 'RB/RWB' : tPos)}</strong></span> <span class="mono text-cyan" style="font-size:10px;">(${modeText})</span></span>
                <span class="mono accent-green" style="font-size: 12px; font-weight: 800;">${prog}%</span>
              </div>
              <div class="training-prog-track">
                <div class="training-prog-fill" style="width: ${prog}%;"></div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:6px;">
                <span class="text-muted mono" style="font-size: 10px;">同時枠 ${activeTrainCount}/${maxTrainSlots} · 完了 ${completedTrainCount}/${MAX_POSITION_TRAINING_PER_PLAYER} · ${speedHint}</span>
                <button type="button" class="btn btn-secondary btn-sm btn-cancel-training" data-player-id="${p.id}" style="padding: 4px 10px; font-size: 11px; white-space: nowrap;">特訓中止</button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (limitReached) {
      trainingSectionHtml = `
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">適性特訓</div>
          <div class="ui-kv-content">
            <div class="text-muted mono" style="font-size: 11px; line-height: 1.4;">
              生涯習得上限に到達済み（完了 ${completedTrainCount}/${MAX_POSITION_TRAINING_PER_PLAYER}）
            </div>
          </div>
        </div>
      `;
    } else if (upgradeCandidates.length > 0 || newSubCandidates.length > 0) {
      let optionsHtml = '';
      const getPosDisplay = (pos) => (pos === 'LB' ? 'LB / LWB' : (pos === 'RB' ? 'RB / RWB' : pos));
      if (upgradeCandidates.length > 0) {
        optionsHtml += `<optgroup label="本適性へ昇格（能力低下なし）">` +
          upgradeCandidates.map(pos => `<option value="${pos}">本適性昇格: ${getPosDisplay(pos)}</option>`).join('') +
          `</optgroup>`;
      }
      if (newSubCandidates.length > 0) {
        optionsHtml += `<optgroup label="近接ポジションを新規習得">` +
          newSubCandidates.map(pos => `<option value="${pos}">薄適性習得: ${getPosDisplay(pos)}</option>`).join('') +
          `</optgroup>`;
      }

      trainingSectionHtml = `
        <div class="ui-kv-row">
          <div class="ui-kv-label accent-gold-bar">適性特訓</div>
          <div class="ui-kv-content">
            <div class="profile-training-box" style="margin-top: 0;">
              <div class="training-select-row">
                <select class="form-select form-select-sm training-pos-select" id="training-target-select-${p.id}" ${slotFull ? 'disabled' : ''} style="padding: 5px 8px; font-size: 11.5px; flex: 1; min-width: 0; background: #1a222d; color: #fff; border: 1px solid var(--border-color); border-radius: 4px;">
                  ${optionsHtml}
                </select>
                <button type="button" class="btn btn-accent btn-sm btn-start-training" data-player-id="${p.id}" ${slotFull ? 'disabled' : ''} style="padding: 5px 12px; font-size: 11.5px; white-space: nowrap; flex-shrink: 0;">${slotFull ? '枠満杯' : '特訓開始'}</button>
              </div>
              <div class="text-muted mono" style="font-size: 10px; margin-top: 5px; line-height: 1.35;">
                同時枠 <span style="color:${slotFull ? '#f87171' : '#2ecc71'}; font-weight:700;">${activeTrainCount}/${maxTrainSlots}</span> · 生涯特訓 ${completedTrainCount}/${MAX_POSITION_TRAINING_PER_PLAYER} · ${speedHint}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }


  // 今季成績・コンディション補助指標
  const goalsPerMatch = (p.appearances || 0) > 0
    ? ((p.goals || 0) / p.appearances).toFixed(2)
    : '0.00';
  const condPct = isInjured ? 20 : clamp(100 - pFtgVal, 0, 100);
  const condColor = isInjured ? '#f87171' : (condPct >= 70 ? '#2ecc71' : (condPct >= 40 ? '#38bdf8' : '#fbbf24'));

  // 年別成績テーブル行の組み立て（過去シーズン ＋ 今季行 ＋ 通算行）
  const lastHistoryRow = seasonHistory.length > 0 ? seasonHistory[seasonHistory.length - 1] : null;
  const hasCurrentSeasonInHistory = Boolean(lastHistoryRow && lastHistoryRow.seasonYear === curSeasonStr);
  const allRowsData = [
    ...seasonHistory.map(row => ({ ...row, isCurrent: false }))
  ];
  if (!hasCurrentSeasonInHistory) {
    allRowsData.push({
      seasonYear: `${curSeasonStr}`,
      clubName: isFreeAgentPlayer ? '無所属 (契約満了)' : clubName,
      age: p.age,
      appearances: p.appearances || 0,
      goals: p.goals || 0,
      assists: typeof p.assists === 'number' ? p.assists : 0,
      avgRating: avgRating,
      ovr: baseOvr,
      isCurrent: true
    });
  }
  // 過去行の年齢が現在年齢や直後行より大きくなる逆転を防止
  for (let rIdx = allRowsData.length - 2; rIdx >= 0; rIdx--) {
    const nextAge = allRowsData[rIdx + 1].age;
    if (typeof nextAge === 'number' && typeof allRowsData[rIdx].age === 'number' && allRowsData[rIdx].age >= nextAge) {
      allRowsData[rIdx].age = Math.max(15, nextAge - 1);
    }
  }

  const totalAppsSum = allRowsData.reduce((acc, r) => acc + (r.appearances || 0), 0);
  const totalGoalsSum = allRowsData.reduce((acc, r) => acc + (r.goals || 0), 0);
  const totalAssistsSum = allRowsData.reduce((acc, r) => acc + (r.assists || 0), 0);
  let weightedRatingSum = 0;
  let ratedAppsSum = 0;
  for (const r of allRowsData) {
    const numR = parseFloat(r.avgRating);
    if (!Number.isNaN(numR) && r.appearances > 0) {
      weightedRatingSum += numR * r.appearances;
      ratedAppsSum += r.appearances;
    }
  }
  const careerAvgRating = ratedAppsSum > 0 ? (weightedRatingSum / ratedAppsSum).toFixed(2) : 'N/A';

  const getYearlyRowOvrInfo = (r, rIdx) => {
    const isCurRow = r.isCurrent || r.seasonYear === curSeasonStr;
    if (scoutView.isScouted) {
      return { html: `${r.ovr}`, cls: getOvrTierClass(r.ovr) };
    }
    if (isCurRow) {
      return { html: ovrDisplayHtml, cls: '' };
    }
    const trueRowOvr = typeof r.ovr === 'number' ? r.ovr : baseOvr;
    const spread = scoutView.scoutLevel === 1 ? 2 : 5;
    const hash = String(p.id || 'p').split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 13, 0);
    const shift = ((hash + rIdx * 7) % (spread + 1)) - Math.floor(spread / 2);
    const rMin = clamp(trueRowOvr - spread + shift, 45, trueRowOvr);
    const rMax = clamp(Math.max(rMin + (scoutView.scoutLevel === 1 ? 2 : 4), trueRowOvr + spread + shift), trueRowOvr, 99);
    return { html: buildOvrRangeHtml(rMin, rMax), cls: '' };
  };

  const yearlyRowsHtml = allRowsData.map((r, rIdx) => {
    const ratInfo = getRatingTierInfo(r.avgRating);
    const ratDisp = (r.avgRating === '-' || !r.avgRating) ? 'N/A' : r.avgRating;
    const ovrInfo = getYearlyRowOvrInfo(r, rIdx);
    return `
    <tr class="${r.isCurrent ? 'profile-yearly-current-row' : ''}">
      <td class="mono">${r.seasonYear}</td>
      <td class="col-yearly-club">${r.clubName}</td>
      <td class="mono col-num">${r.age}</td>
      <td class="mono col-num">${r.appearances}</td>
      <td class="mono col-num ${r.goals > 0 ? 'accent-green' : ''}">${r.goals}</td>
      <td class="mono col-num ${r.assists > 0 ? 'text-cyan' : ''}">${r.assists || 0}</td>
      <td class="col-num yearly-table-rat ${ratInfo.textClass} font-bold">${ratDisp}</td>
      <td class="col-num yearly-table-ovr ${ovrInfo.cls}">${ovrInfo.html}</td>
    </tr>
  `;
  }).join('');

  const yearlyFotmobRows = allRowsData.map((r, rIdx) => {
    const ratInfo = getRatingTierInfo(r.avgRating);
    const ratDisp = (r.avgRating === '-' || !r.avgRating) ? 'N/A' : r.avgRating;
    const clubEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(r.clubName, 22, 'fotmob-yearly-emblem') : '';
    const ovrInfo = getYearlyRowOvrInfo(r, rIdx);
    return `
      <div class="fotmob-yearly-row ${r.isCurrent ? 'is-current' : ''}">
        <div class="fotmob-yearly-left">
          ${clubEmblem}
          <div class="fotmob-yearly-team-stack">
            <span class="fotmob-yearly-club">${r.clubName}</span>
            <span class="fotmob-yearly-season mono">${r.seasonYear} · ${r.age}歳</span>
          </div>
        </div>
        <div class="fotmob-yearly-cols mono">
          <span class="fotmob-col-stat">${r.appearances}</span>
          <span class="fotmob-col-stat ${r.goals > 0 ? 'accent-green' : ''}">${r.goals}</span>
          <span class="fotmob-col-stat ${(r.assists || 0) > 0 ? 'text-cyan' : ''}">${r.assists || 0}</span>
          <span class="fotmob-col-ovr ${ovrInfo.cls}" style="background:none;">${ovrInfo.html}</span>
          <span class="fotmob-col-rat"><span class="fotmob-rating-pill ${ratInfo.pillClass}">${ratDisp}</span></span>
        </div>
      </div>
    `;
  }).join('');
  const yearlyFotmobHtml = `
    <div class="fotmob-yearly-head mono">
      <span>チーム / 年度</span>
      <div class="fotmob-yearly-cols">
        <span class="fotmob-col-stat" style="font-size:10px;color:#8b949e;">試</span>
        <span class="fotmob-col-stat" style="font-size:10px;color:#8b949e;">G</span>
        <span class="fotmob-col-stat" style="font-size:10px;color:#8b949e;">A</span>
        <span class="fotmob-col-ovr" style="font-size:10px;color:#8b949e;">OVR</span>
        <span class="fotmob-col-rat" style="font-size:10px;color:#8b949e;">評価</span>
      </div>
    </div>
    ${yearlyFotmobRows}
  `;

  const timelineHtml = careerEvents.map(ev => `
    <div class="profile-timeline-item ${ev.badge === 'CURRENT' ? 'is-current' : ''}">
      <div class="profile-timeline-dot"></div>
      <div class="profile-timeline-content">
        <div class="profile-timeline-head">
          <span class="profile-timeline-year mono">${ev.year}</span>
          <span class="profile-timeline-badge mono badge-${ev.badge.toLowerCase()}">${ev.badge}</span>
        </div>
        <div class="profile-timeline-title">${ev.title}</div>
        <div class="profile-timeline-desc">${ev.desc}</div>
      </div>
    </div>
  `).join('');

  const abilityActionsHtml = isYouth ? `
    <div class="profile-ability-actions">
      <button type="button" class="btn btn-primary mono btn-modal-promote-youth" data-youth-id="${p.id}" style="flex: 1; font-weight: 700; padding: 9px 12px;">
        トップチームへ昇格 (契約金 £40k · 週給 £${p.wage || 2.5}k · 3年)
      </button>
      <button type="button" class="btn btn-danger-outline mono btn-modal-release-youth" data-youth-id="${p.id}" style="font-weight: 700; padding: 9px 14px;">
        放出
      </button>
    </div>
  ` : (!isMyClubPlayer && !isCandidate ? (() => {
    const activeScout = (gameState.activeScoutAssignments || []).find(a => a.playerId === p.id);
    const scoutActionBtn = !scoutView.isScouted
      ? (activeScout
        ? `<button type="button" class="btn btn-sm btn-disabled mono" disabled style="padding: 8px 12px; opacity: 0.75;">調査中(${activeScout.daysRemaining}日)</button>`
        : `<button type="button" class="btn btn-secondary btn-sm mono" data-profile-scout-dispatch="${p.id}" style="padding: 8px 12px; font-weight: 700;">調査派遣</button>`)
      : '';
    return `
    <div class="profile-ability-actions">
      ${scoutActionBtn}
      <button type="button" class="btn btn-primary btn-sm mono" data-profile-direct-offer="${p.id}" ${p.negotiationFailed ? 'disabled' : ''} style="flex: 1; font-weight: 700; padding: 8px 12px;">
        ${p.negotiationFailed ? '今ウィンドウ交渉決裂済' : '獲得交渉を開く'}
      </button>
      <button type="button" class="btn btn-secondary btn-sm mono" data-profile-shortlist-toggle="${p.id}" style="padding: 8px 14px; font-weight: 700;">
        ${isInShortlist(p.id) ? '★ 候補済' : '☆ 候補追加'}
      </button>
    </div>`;
  })() : (isMyClubPlayer && !isCandidate && !(p.loanStatus && p.loanStatus.isLoan) ? `
    <div class="profile-ability-actions">
      <button type="button" class="btn btn-secondary btn-sm mono" data-profile-direct-renewal="${p.id}" ${p.contractRefused ? 'disabled' : ''} style="width: 100%; font-weight: 700; padding: 8px 12px;">
        ${p.contractRefused ? '契約延長交渉打ち切り済' : '契約延長交渉を開く'}
      </button>
    </div>
  ` : ''));

  const bodyEl = document.getElementById('profile-modal-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <!-- タブ1：能力（左レーダーチャート＋右適性ピッチ2カラム ＋ 特徴インライン ＋ コンディションゲージ） -->
      <div class="profile-tab-panel" data-profile-panel="ability">
        <div class="profile-ability-board">
          <div class="profile-ability-board-grid">
            <div class="profile-ability-col-chart">
              <div class="profile-col-heading">
                <span class="profile-col-title is-accent">能力</span>
                <span class="profile-col-sub mono">OVR <strong class="${scoutView.isScouted ? getOvrTierClass(baseOvr) : ''}">${ovrDisplayHtml}</strong></span>
              </div>
              ${hexagonChartHtml}
            </div>
            <div class="profile-ability-col-pitch">
              <div class="profile-col-heading">
                <span class="profile-col-title">適性配置</span>
              </div>
              ${buildPlayerPitchProficiencyHtml(p)}
            </div>
          </div>

          <div class="profile-traits-inline-row">
            <span class="profile-inline-label">特徴</span>
            <div class="profile-traits-content">
              <div class="profile-traits-wrap">
                ${traits.map(t => `<button type="button" class="profile-trait-tag is-active-trait" data-trait-name="${t}" aria-expanded="false">・ ${t}</button>`).join('')}
              </div>
              <div class="profile-trait-detail hidden" id="profile-trait-detail"></div>
            </div>
          </div>
        </div>

        <div class="profile-condition-gauges-bar">
          <div class="profile-cond-item">
            <div class="profile-cond-top">
              <span class="profile-cond-label">コンディション</span>
              <span class="profile-cond-val mono" style="color:${condColor};">${condPct}%</span>
            </div>
            <div class="ui-slim-gauge"><div class="ui-slim-gauge-fill" style="width:${condPct}%; background:${condColor};"></div></div>
          </div>
          <div class="profile-cond-item">
            <div class="profile-cond-top">
              <span class="profile-cond-label">疲労</span>
              <span class="profile-cond-val mono" style="color:${pFtgStatus.color};">${pFtgVal} (${pFtgStatus.label})</span>
            </div>
            <div class="ui-slim-gauge"><div class="ui-slim-gauge-fill" style="width:${Math.max(4, pFtgVal)}%; background:${pFtgStatus.color};"></div></div>
          </div>
          <div class="profile-cond-item">
            <div class="profile-cond-top">
              <span class="profile-cond-label">出場率</span>
              <span class="profile-cond-val mono accent-green">${appRate}%</span>
            </div>
            <div class="ui-slim-gauge"><div class="ui-slim-gauge-fill ovr-tier-high" style="width:${appRate}%"></div></div>
          </div>
        </div>

        ${trainingSectionHtml ? `<div class="profile-training-compact-wrap ui-kv-list">${trainingSectionHtml}</div>` : ''}
        ${abilityActionsHtml}
      </div>

      <!-- タブ2：今季成績（数値プレート＋左見出し2カラム＋ゲージ） -->
      <div class="profile-tab-panel hidden" data-profile-panel="season">
        <div class="ui-kv-list">
          <div class="ui-kv-row">
            <div class="ui-kv-label accent-gold-bar">主要成績</div>
            <div class="ui-kv-content">
              <div class="ui-plate-grid cols-4">
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">出場数</span>
                  <span class="ui-plate-val">${p.appearances}</span>
                </div>
                <div class="ui-stat-plate is-highlight">
                  <span class="ui-plate-label">ゴール</span>
                  <span class="ui-plate-val accent-green">${p.goals}</span>
                </div>
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">アシスト</span>
                  <span class="ui-plate-val text-cyan">${typeof p.assists === 'number' ? p.assists : 0}</span>
                </div>
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">平均評価</span>
                  <span class="ui-plate-val ${getRatingTierInfo(avgRating).textClass}">${avgRating !== '-' ? avgRating : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ui-kv-row">
            <div class="ui-kv-label accent-cyan-bar">貢献指標</div>
            <div class="ui-kv-content">
              <div class="ui-plate-grid">
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">クリーンシート (CS)</span>
                  <span class="ui-plate-val">${(['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(primaryPos) || POS_ROLE_GROUP[primaryPos] === 'GK' || POS_ROLE_GROUP[primaryPos] === 'DF') ? (p.cleanSheets || 0) : '-'}</span>
                </div>
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">1試合得点</span>
                  <span class="ui-plate-val">${goalsPerMatch}</span>
                </div>
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">実効OVR</span>
                  <span class="ui-plate-val ${scoutView.isScouted ? getOvrTierClass(effOvr) : ''}" style="background:none;">${scoutView.isScouted ? effOvr : ovrDisplayHtml}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ui-kv-row">
            <div class="ui-kv-label">稼働状態</div>
            <div class="ui-kv-content">
              <div class="ui-attr-bars-grid">
                <div class="ui-attr-bar-item">
                  <div class="ui-attr-bar-top">
                    <span class="ui-attr-bar-name">出場率</span>
                    <span class="ui-attr-bar-num accent-green">${appRate}%</span>
                  </div>
                  <div class="ui-slim-gauge"><div class="ui-slim-gauge-fill ovr-tier-high" style="width:${appRate}%"></div></div>
                </div>
                <div class="ui-attr-bar-item">
                  <div class="ui-attr-bar-top">
                    <span class="ui-attr-bar-name">蓄積疲労</span>
                    <span class="ui-attr-bar-num" style="color:${pFtgStatus.color};">${pFtgVal} (${pFtgStatus.label})</span>
                  </div>
                  <div class="ui-slim-gauge"><div class="ui-slim-gauge-fill" style="width:${pFtgVal}%; background:${pFtgStatus.color};"></div></div>
                </div>
              </div>
              <div class="mono" style="margin-top:8px; display:flex; justify-content:space-between; gap:8px; font-size:11.5px;">
                <span class="text-muted">${roleStatusText}</span>
                <span class="${conditionClass} font-bold wage-nowrap">${conditionText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- タブ3：年別成績 -->
      <div class="profile-tab-panel hidden" data-profile-panel="yearly">
        <div class="profile-box">
          <div class="profile-box-header">
            <span class="profile-box-title">年度別成績</span>
          </div>
          <div class="profile-yearly-fotmob-list">
            ${yearlyFotmobHtml}
            <div class="fotmob-yearly-total mono">
              <span>通算 (${totalAppsSum}試合)</span>
              <span><strong>${totalGoalsSum}G</strong> / <strong>${totalAssistsSum}A</strong> / 平均 <span class="fotmob-rating-pill ${getRatingTierInfo(careerAvgRating).pillClass}" style="padding:0;">${careerAvgRating}</span></span>
            </div>
          </div>
          <div class="profile-yearly-table-wrap">
            <table class="data-table profile-yearly-table">
              <thead><tr><th>年度</th><th>所属クラブ</th><th class="col-num">年齢</th><th class="col-num">出場</th><th class="col-num">得点</th><th class="col-num">アシ</th><th class="col-num">評価点</th><th class="col-num">OVR</th></tr></thead>
              <tbody>${yearlyRowsHtml}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- タブ4：市場価値推移 -->
      ${buildPlayerMarketValueTabHtml(p, clubName)}

      <!-- タブ5：経歴（左見出し・右詳細 2カラム階層） -->
      <div class="profile-tab-panel hidden" data-profile-panel="career">
        <div class="ui-kv-list">
          <div class="ui-kv-row">
            <div class="ui-kv-label">基本情報</div>
            <div class="ui-kv-content">
              <div class="profile-pos-fit-list">
                <div class="profile-fit-row"><span class="text-muted">選手名</span><span class="mono"><strong>${p.fullName || p.name}</strong></span></div>
                <div class="profile-fit-row"><span class="text-muted">国籍</span><span class="mono" style="display:inline-flex;align-items:center;gap:6px;"><strong>${nationalityDisplay}</strong></span></div>
                <div class="profile-fit-row"><span class="text-muted">生年・年齢</span><span class="mono"><strong>${birthYear}年 (${p.age}歳)</strong></span></div>
                <div class="profile-fit-row"><span class="text-muted">身長・利き足</span><span class="mono" style="display:inline-flex;align-items:center;gap:6px;"><strong>${heightText}</strong> / ${formatFootBadge(p)}</span></div>
                <div class="profile-fit-row"><span class="text-muted">所属・背番号</span><span class="mono"><strong>${clubDisplayLabel} (${squadNumText})</strong></span></div>
              </div>
            </div>
          </div>
          <div class="ui-kv-row">
            <div class="ui-kv-label accent-cyan-bar">キャリア</div>
            <div class="ui-kv-content">
              <div class="profile-career-timeline">${timelineHtml}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ポジション特訓ボタンのイベント登録
    const btnStartTrain = bodyEl.querySelector(`.btn-start-training[data-player-id="${p.id}"]`);
    if (btnStartTrain) {
      btnStartTrain.addEventListener('click', () => {
        const sel = document.getElementById(`training-target-select-${p.id}`);
        if (sel && sel.value) {
          startPlayerPositionTraining(p.id, sel.value);
        }
      });
    }
    const btnCancelTrain = bodyEl.querySelector(`.btn-cancel-training[data-player-id="${p.id}"]`);
    if (btnCancelTrain) {
      btnCancelTrain.addEventListener('click', () => {
        cancelPlayerPositionTraining(p.id);
      });
    }

    // ユース選手のトップ昇格・放出ボタンイベント
    const btnPromoteModal = bodyEl.querySelector(`.btn-modal-promote-youth[data-youth-id="${p.id}"]`);
    if (btnPromoteModal) {
      btnPromoteModal.addEventListener('click', () => {
        const ok = window.confirm(`${p.name}選手とプロ契約を締結し、トップチームへ昇格させますか？\n（初回契約金: £40k / 週給: £${p.wage || 2.5}k / 契約年数: 3年）`);
        if (!ok) return;
        const success = promoteYouthPlayer(p.id);
        if (success) {
          closePlayerProfileModal();
        }
      });
    }
    const btnReleaseModal = bodyEl.querySelector(`.btn-modal-release-youth[data-youth-id="${p.id}"]`);
    if (btnReleaseModal) {
      btnReleaseModal.addEventListener('click', () => {
        if (releaseYouthPlayer(p.id)) {
          closePlayerProfileModal();
        }
      });
    }

    // カード全体（ヘッダーの市場価値リンク・タブ内カード等）からの別タブジャンプ
    const profileCardScopeEl = document.getElementById('player-profile-modal-card') || bodyEl;
    profileCardScopeEl.querySelectorAll('[data-switch-profile-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.switchProfileTab) {
          switchProfileModalTab(btn.dataset.switchProfileTab);
        }
      });
    });

    // プロフィール画面からのダイレクト移籍交渉・契約延長・候補トグル
    const btnDirectOffer = bodyEl.querySelector('[data-profile-direct-offer]');
    if (btnDirectOffer) {
      btnDirectOffer.addEventListener('click', (e) => {
        e.stopPropagation();
        openTransferNegotiationModal(btnDirectOffer.dataset.profileDirectOffer);
      });
    }
    const btnDirectRenewal = bodyEl.querySelector('[data-profile-direct-renewal]');
    if (btnDirectRenewal) {
      btnDirectRenewal.addEventListener('click', (e) => {
        e.stopPropagation();
        openContractNegotiationModal(btnDirectRenewal.dataset.profileDirectRenewal);
      });
    }
    const btnProfileScout = bodyEl.querySelector('[data-profile-scout-dispatch]');
    if (btnProfileScout) {
      btnProfileScout.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btnProfileScout.dataset.profileScoutDispatch;
        if (typeof assignScoutToPlayer === 'function') {
          const res = assignScoutToPlayer(pid);
          if (res && res.ok) {
            if (typeof showToast === 'function') showToast(`${p.name} のスカウト調査を開始しました`, 'success');
            if (typeof updateMarketBadges === 'function') updateMarketBadges();
            if (typeof renderMarket === 'function') renderMarket();
            if (typeof renderShortlist === 'function') renderShortlist();
            openPlayerProfileModal(pid);
          } else if (res && (res.reason === 'slots_full' || res.reason === 'limit')) {
            if (typeof showToast === 'function') showToast(`同時調査枠（最大${res.maxSlots || res.max || 2}名）がいっぱいです`, 'warning');
          }
        }
      });
    }
    const btnProfileSl = bodyEl.querySelector('[data-profile-shortlist-toggle]');
    if (btnProfileSl) {
      btnProfileSl.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btnProfileSl.dataset.profileShortlistToggle;
        toggleShortlist(pid);
        btnProfileSl.textContent = isInShortlist(pid) ? '★ 候補登録済' : '☆ 候補に追加';
      });
    }
  }

  // デフォルトで「能力」タブを選択状態にする
  switchProfileModalTab('ability');

  const modalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  const cardEl = document.getElementById('player-profile-modal-card');
  const bodyScrollEl = document.getElementById('profile-modal-body');

  // スクロール位置を最上部に確実にリセット（モバイルで前回のスクロール状態が残るのを防止）
  const resetProfileScroll = () => {
    if (modalEl) modalEl.scrollTop = 0;
    if (cardEl) cardEl.scrollTop = 0;
    if (bodyScrollEl) bodyScrollEl.scrollTop = 0;
  };
  resetProfileScroll();

  if (modalEl) {
    modalEl.classList.remove('hidden');
    if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
    requestAnimationFrame(resetProfileScroll);
  }
}

/**
 * 選手詳細プロフィールモーダルを閉じる
 */
function closePlayerProfileModal() {
  const modalEl = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  const cardEl = document.getElementById('player-profile-modal-card');
  const bodyScrollEl = document.getElementById('profile-modal-body');

  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.scrollTop = 0;
  }
  if (cardEl) cardEl.scrollTop = 0;
  if (bodyScrollEl) bodyScrollEl.scrollTop = 0;

  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
  gameState.profileModalPlayerId = null;

  // モーダルを閉じた後、直前のスクロール位置（選手一覧や市場の閲覧位置）を確実に復元
  const savedY = lastProfileOpenScrollY;
  const savedContainers = [...lastProfileOpenContainerScrolls];
  const restoreScrollPos = () => {
    if (typeof savedY === 'number') {
      window.scrollTo(0, savedY);
      if (document.documentElement) document.documentElement.scrollTop = savedY;
      if (document.body) document.body.scrollTop = savedY;
    }
    savedContainers.forEach(({ el, top }) => {
      if (el && el.scrollTop !== top) {
        el.scrollTop = top;
      }
    });
  };
  restoreScrollPos();
  requestAnimationFrame(restoreScrollPos);
  setTimeout(restoreScrollPos, 20);
  setTimeout(restoreScrollPos, 60);
}

let introClubFilter = 'all';

/**
 * クラブを目標・実力別の排他的4区分でフィルター判定
 */
function matchesClubFilter(clubDef, filter) {
  if (!filter || filter === 'all') return true;
  if (typeof getClubSelectCategory === 'function') {
    return getClubSelectCategory(clubDef) === filter;
  }
  return true;
}

/**
 * チーム選択モーダルのフィルタータグに最新クラブ件数を同期
 */
function syncIntroFilterTagCounts() {
  const container = document.getElementById('club-filter-tags');
  if (!container) return;
  const counts = {
    all: CLUB_DEFINITIONS.length,
    title_ucl: 0,
    euro_race: 0,
    mid_table: 0,
    relegation: 0
  };
  CLUB_DEFINITIONS.forEach(c => {
    const cat = typeof getClubSelectCategory === 'function' ? getClubSelectCategory(c) : 'mid_table';
    if (typeof counts[cat] === 'number') counts[cat] += 1;
  });
  container.querySelectorAll('.btn-filter-tag[data-filter]').forEach(btn => {
    const f = btn.dataset.filter;
    const pcSpan = btn.querySelector('.filter-label-pc');
    const spSpan = btn.querySelector('.filter-label-sp');
    if (f === 'all') {
      const pcText = `すべて (${counts.all})`;
      const spText = 'すべて';
      if (pcSpan && spSpan) {
        pcSpan.textContent = pcText;
        spSpan.textContent = spText;
      } else {
        btn.textContent = pcText;
      }
    } else if (typeof CLUB_SELECT_CATEGORIES !== 'undefined' && CLUB_SELECT_CATEGORIES[f]) {
      const cat = CLUB_SELECT_CATEGORIES[f];
      const pcText = `${cat.label} (${counts[f] || 0})`;
      const spText = cat.mobileLabel || cat.label;
      if (pcSpan && spSpan) {
        pcSpan.textContent = pcText;
        spSpan.textContent = spText;
      } else {
        btn.textContent = pcText;
      }
    }
  });
}

/**
 * GM就任モーダル：左ペインの20クラブ選択リストを描画
 */
function getFilteredIntroClubs() {
  return CLUB_DEFINITIONS.filter(c => matchesClubFilter(c, introClubFilter));
}

function showPrevIntroClub() {
  const filtered = getFilteredIntroClubs();
  if (filtered.length === 0) return;
  const currentIndex = filtered.findIndex(c => c.id === gameState.selectedClubId);
  const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
  gameState.selectedClubId = filtered[prevIndex].id;
  renderIntroClubDetail();
}

function showNextIntroClub() {
  const filtered = getFilteredIntroClubs();
  if (filtered.length === 0) return;
  const currentIndex = filtered.findIndex(c => c.id === gameState.selectedClubId);
  const nextIndex = (currentIndex + 1) % filtered.length;
  gameState.selectedClubId = filtered[nextIndex].id;
  renderIntroClubDetail();
}

/**
 * GM就任モーダル：スライダーセレクト＆1クラブカード描画
 */
function renderIntroClubList() {
  const filtered = getFilteredIntroClubs();
  if (filtered.length === 0) return;

  // 選択クラブがフィルター内にない場合は先頭を選択
  if (!filtered.some(c => c.id === gameState.selectedClubId)) {
    gameState.selectedClubId = filtered[0].id;
  }

  // セレクトボックスの選択肢を更新
  const selectEl = document.getElementById('slider-club-select');
  if (selectEl) {
    selectEl.innerHTML = filtered.map(c => `
      <option value="${c.id}" ${c.id === gameState.selectedClubId ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');
  }

  renderIntroClubDetail();
}

/**
 * GM就任モーダル：1クラブ専用リッチカード描画（スライド式）
 */
function renderIntroClubDetail() {
  const detailEl = document.getElementById('intro-club-detail-pane');
  const summaryEl = document.getElementById('intro-selected-summary');
  const pagerText = document.getElementById('slider-pager-text');
  const selectEl = document.getElementById('slider-club-select');
  if (!detailEl) return;

  const filtered = getFilteredIntroClubs();
  const currentIndex = Math.max(0, filtered.findIndex(c => c.id === gameState.selectedClubId));
  const club = filtered[currentIndex] || CLUB_DEFINITIONS.find(c => c.id === gameState.selectedClubId) || CLUB_DEFINITIONS[0];
  const tacticDef = TACTICS_DEFINITIONS[club.defaultTactic] || TACTICS_DEFINITIONS.possession;

  if (pagerText) {
    pagerText.textContent = `${currentIndex + 1} / ${filtered.length}`;
  }

  if (selectEl && selectEl.value !== club.id) {
    selectEl.value = club.id;
  }

  const catKey = typeof getClubSelectCategory === 'function' ? getClubSelectCategory(club) : 'mid_table';
  const catMeta = (typeof CLUB_SELECT_CATEGORIES !== 'undefined' && CLUB_SELECT_CATEGORIES[catKey])
    ? CLUB_SELECT_CATEGORIES[catKey]
    : { label: '中位定着', badgeClass: 'cat-mid-table' };

  detailEl.innerHTML = `
    <div class="detail-header-card">
      <div class="detail-title-row">
        <div class="detail-club-title-group">
          ${getClubEmblemSvg(club, 48, 'intro-club-emblem')}
          <div class="detail-club-header-text">
            <h3 class="detail-club-name">${club.name}</h3>
            <div class="detail-club-badges">
              <span class="detail-category-pill ${catMeta.badgeClass}">${catMeta.label}</span>
              <span class="detail-tier-badge">${club.tier}</span>
            </div>
          </div>
        </div>
      </div>
      <p class="detail-club-desc">${club.desc}</p>
    </div>

    <div class="detail-metrics-grid">
      <div class="detail-metric-card highlight">
        <span class="detail-metric-label">初期クラブ資金</span>
        <span class="detail-metric-val mono accent-gold">${formatMoney(club.initialFunds)}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">理事会目標</span>
        <span class="detail-metric-val mono accent-green">${club.targetLabel}</span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">チーム戦力値</span>
        <span class="detail-metric-val">OVR <span class="${getOvrTierClass(club.basePower)}">${club.basePower}</span></span>
      </div>
      <div class="detail-metric-card">
        <span class="detail-metric-label">サポーター規模</span>
        <span class="detail-metric-val mono">${club.supporters.toLocaleString()}人</span>
      </div>
    </div>

    <div class="detail-tactic-box">
      <span class="detail-tactic-label">初期戦術方針:</span>
      <strong class="detail-tactic-name mono">${tacticDef.name}</strong>
    </div>
  `;

  if (summaryEl) {
    summaryEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;vertical-align:middle;">${getClubEmblemSvg(club, 20, 'intro-summary-emblem')}選択: <strong class="accent-green">${club.name}</strong></span> <span class="summary-sep">/</span> 目標: <strong>${club.targetLabel}</strong> <span class="summary-sep">/</span> 予算: <strong class="accent-gold">${formatMoney(club.initialFunds)}</strong>`;
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
    inputGm.value = gameState.gmName || 'L. Vance';
  }
  if (cancelBtn) {
    cancelBtn.classList.toggle('hidden', !allowCancel);
  }

  introClubFilter = 'all';
  syncIntroFilterTagCounts();
  document.querySelectorAll('#club-filter-tags .btn-filter-tag').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });

  renderIntroClubList();
  renderIntroClubDetail();
  overlay.classList.remove('hidden');
  setBodyModalLock(true);
}

/**
 * GM就任モーダルで選択したGM名とクラブで新規ゲームを開始する
 */
function confirmIntroAndStartGame() {
  const inputGm = document.getElementById('input-gm-name');
  const rawName = inputGm ? inputGm.value.trim() : '';
  gameState.gmName = rawName.length > 0 ? rawName : 'L. Vance';

  const overlay = document.getElementById('intro-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  setBodyModalLock(false);
  gameState.hasStartedOnce = true;

  if (typeof hideMainMenuScreen === 'function') {
    hideMainMenuScreen();
  }
  setupNewGame(gameState.selectedClubId);
  const playerClub = getPlayerClub();
  if (typeof saveGameToStorage === 'function') {
    saveGameToStorage(true);
  }
  if (typeof openInitialStaffSetupModal === 'function' && playerClub) {
    openInitialStaffSetupModal(playerClub);
  }
}

/**
 * 指定されたクラブIDをプレイヤー担当クラブとして新規ゲームをセットアップ
 */
function setupNewGame(playerClubId = gameState.selectedClubId) {
  if (typeof stopAdvancingCalendar === 'function') {
    stopAdvancingCalendar();
  }
  resetTabScrollPositions();
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
  gameState.paidPayrollWeeks = 0;
  gameState.competitions = null;
  gameState.d1BackgroundSchedule = null;
  gameState.lastSeasonStandingsOrder = null;
  gameState.lastSeasonCupWinners = null;
  gameState.lastPromotionRelegation = null;
  gameState.d2PowerCalibratedV1 = true;
  gameState.managerDelegationEnabled = true;
  gameState.pendingManagerCrisis = false;
  markAllViewsDirty();
  syncManagerDelegationButtonUI();
  gameState.activeTab = 'office';
  document.body.dataset.activeTab = 'office';
  gameState.teamSubtab = 'standings';
  gameState.rosterSubtab = 'board';
  gameState.facilitiesSubtab = 'investment';
  gameState.marketSubtab = 'market';
  gameState.offersSubtab = 'incoming';
  gameState.lastWeekResults = [];
  gameState.matchHistory = [];
  gameState.competitionStats = {};
  gameState.statsCompView = 'league';
  gameState.statsLeagueDivision = null;
  gameState.statsDomesticCup = 'leagueCup';
  gameState.statsEuroCup = null;
  const initialDay = getCurrentCalendarDay();
  if (initialDay) {
    gameState.calendarViewYear = initialDay.year;
    gameState.calendarViewMonth = initialDay.month;
  } else {
    gameState.calendarViewYear = 2025 + gameState.season;
    gameState.calendarViewMonth = 8;
  }
  gameState.scheduleViewMode = 'calendar';
  gameState.lastMatchTicker = null;
  gameState.lastSettlement = null;
  gameState.selectedPlayerId = null;
  gameState.selectedSlotIndex = null;
  gameState.profileModalPlayerId = null;
  gameState.facilities = { stadium: 1, training: 1, scouting: 1 };
  gameState.facilityFeedback = '';
  gameState.negotiationSession = null;
  gameState.pendingMegaOffer = null;
  gameState.incomingTransferOffer = null;
  gameState.incomingOffers = [];
  gameState.outgoingOffers = [];
  gameState.targetShortlist = [];
  gameState.preContractPlayers = [];
  gameState.transferMarket = [];
  gameState.euroTransferList = [];
  gameState.youthCandidates = [];
  gameState.marketFilter = {
    category: 'ALL',
    clubId: 'ALL',
    position: 'ALL',
    ageRange: 'ALL',
    statusFilter: 'ALL',
    sortKey: 'ovr-desc',
    searchQuery: ''
  };
  gameState.scoutingIntel = {};
  gameState.activeScoutAssignments = [];
  gameState.installments = [];
  gameState.sellOnRights = [];
  gameState.intlBreakState = null;
  gameState.pendingBoardCrisis = false;
  gameState.pendingDeadlineOffer = false;
  if (typeof gmModalQueue !== 'undefined') gmModalQueue.length = 0;

  // 監督カタログから各クラブへの初期監督配属とフリー監督プール構築
  const assignedManagers = [];
  const usedManagerIndexes = new Set();

  gameState.clubs = CLUB_DEFINITIONS.map((def, cIdx) => {
    const isPlayer = def.id === gameState.selectedClubId;
    const normTactic = normalizeTacticKey(def.defaultTactic);
    const formKey = def.defaultFormation && FORMATIONS[def.defaultFormation] ? def.defaultFormation : '4-3-3';

    // クラブの得意陣形・戦術に最も合致する監督をカタログから選抜
    let mgrIdx = MANAGERS_DATABASE.findIndex((m, idx) => !usedManagerIndexes.has(idx) && m.preferredFormation === formKey && m.preferredTactic === normTactic);
    if (mgrIdx === -1) {
      mgrIdx = MANAGERS_DATABASE.findIndex((m, idx) => !usedManagerIndexes.has(idx) && (m.preferredFormation === formKey || m.preferredTactic === normTactic));
    }
    if (mgrIdx === -1) {
      mgrIdx = MANAGERS_DATABASE.findIndex((m, idx) => !usedManagerIndexes.has(idx));
    }
    if (mgrIdx === -1) mgrIdx = cIdx % MANAGERS_DATABASE.length;
    usedManagerIndexes.add(mgrIdx);

    const mgrDef = MANAGERS_DATABASE[mgrIdx];
    const managerObj = createManager(mgrDef, def.id, usedNames);

    const club = {
      id: def.id,
      name: def.name,
      division: 'd1',
      basePower: def.basePower,
      isPlayer,
      funds: def.initialFunds,
      supporters: def.supporters,
      targetRank: def.targetRank,
      targetLabel: def.targetLabel,
      tactic: isPlayer ? managerObj.preferredTactic : normTactic,
      formation: isPlayer ? managerObj.preferredFormation : formKey,
      manager: managerObj,
      coaches: createInitialCoaches(isPlayer),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      players: createSquad(def.basePower, usedNames),
      youthSquad: createYouthSquad(usedNames)
    };
    ensureValidSquadAndStarters(club);
    if (!club.isPlayer) {
      autoSelectStarters(club);
    }
    return club;
  });

  // 未契約のコーチをフリーコーチ候補プールとして初期化（架空名動的付与）
  gameState.freeCoaches = {
    attacking: (COACHES_DATABASE.attacking || []).slice(1).map(d => createCoach(d, 'attacking', usedNames)),
    defending: (COACHES_DATABASE.defending || []).slice(1).map(d => createCoach(d, 'defending', usedNames)),
    goalkeeping: (COACHES_DATABASE.goalkeeping || []).slice(1).map(d => createCoach(d, 'goalkeeping', usedNames)),
    fitness: (COACHES_DATABASE.fitness || []).slice(1).map(d => createCoach(d, 'fitness', usedNames))
  };

  // 未就任の監督をフリー監督候補プールとして初期化（架空名動的付与）
  gameState.freeManagers = MANAGERS_DATABASE.filter((m, idx) => !usedManagerIndexes.has(idx)).map(m => createManager(m, null, usedNames));
  if (gameState.freeManagers.length < 3) {
    const backupDefs = [
      { nationality: 'Germany', age: 59, preferredFormation: '4-2-3-1', preferredTactic: 'gegenpress', weeklyWage: 95, bio: '縦への推進力と徹底したゲーゲンプレスを叩き込む強豪指揮官。' },
      { nationality: 'Spain', age: 54, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 100, bio: '妥協なきポゼッションと高強度トレーニングで支配を極める名将。' },
      { nationality: 'Italy', age: 57, preferredFormation: '5-3-2', preferredTactic: 'counter', weeklyWage: 85, bio: '勝負どころを見極める「鼻差の勝利」の哲学を持つ勝負師。' }
    ];
    backupDefs.forEach(b => {
      gameState.freeManagers.push(createManager(b, null, usedNames));
    });
  }

  gameState.schedule = generateSeasonSchedule(gameState.clubs);
  gameState.calendar = generateSeasonCalendar(2025 + gameState.season, gameState.schedule);
  if (typeof initSeasonCompetitions === 'function') {
    initSeasonCompetitions();
  }
  if (typeof ensureClubRealismFields === 'function') {
    getAllManagedLeagueClubs().forEach(c => ensureClubRealismFields(c));
  }
  gameState.currentDayIndex = 0;
  gameState.isAdvancingCalendar = false;
  gameState.dailyLogs = [
    { date: '8/1 (土)', message: '新シーズン開幕！GMに就任し、初戦に向けてスカッドが始動しました。' }
  ];
  gameState.inboxMessages = [];
  gameState.newsFeed = [];
  gameState.managerWishes = null;
  gameState.officeCommTab = 'messages';
  gameState.inboxCategoryFilter = 'ALL';
  gameState.expandedMessageId = null;
  gameState.monthlyReports = [];
  gameState.pendingLineupConsultation = null;
  gameState.totalPlayerMatchesPlayed = 0;
  gameState.lastConsultationMatchCount = 0;
  gameState.consultationSeq = 0;
  if (typeof ensureMonthlyLedger === 'function') {
    ensureMonthlyLedger(true);
  } else {
    gameState.monthlyLedger = null;
  }
  generateTransferMarket();
  if (typeof ensureInitialOfficeMessagesAndNews === 'function') {
    ensureInitialOfficeMessagesAndNews();
  }
  syncAllSubtabsDOM();
  switchTab('office');
}

/**
 * ゲーム初期化処理（イベントリスナー登録）
 */

/**
 * 作戦ボードおよび控え選手カードのドラッグ＆ドロップ（DnD）とタップ詳細表示の初期化
 */
function initTacticalDragAndDrop() {
  let dragSource = null;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let isTouchReady = false;
  let longPressTimer = null;
  let ghostEl = null;
  let lastHoverDropTarget = null;

  // 控えリストのタッチ横スクロール制御
  let isBenchScrolling = false;
  let benchScrollStartX = 0;
  let benchScrollStartLeft = 0;
  let benchListEl = null;
  let lastMoveX = 0;
  let lastMoveTime = 0;
  let scrollVelocity = 0;

  function cleanupDrag() {
    document.body.classList.remove('is-tactical-dragging');
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (ghostEl && ghostEl.parentNode) {
      ghostEl.parentNode.removeChild(ghostEl);
    }
    ghostEl = null;
    document.querySelectorAll('.pitch-node.dragging, .bench-sub-item.dragging, .touch-drag-ready').forEach(el => {
      el.classList.remove('dragging', 'touch-drag-ready');
    });
    document.querySelectorAll('.drag-drop-target-active').forEach(el => {
      el.classList.remove('drag-drop-target-active');
    });
    const tacticalSideCol = document.getElementById('tactical-side-column');
    if (tacticalSideCol) {
      tacticalSideCol.classList.remove('is-dragging-card');
    }
    dragSource = null;
    isDragging = false;
    isTouchReady = false;
    isBenchScrolling = false;
    benchListEl = null;
  }

  // ネイティブ DnD ゴーストの干渉を抑止
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.pitch-node, .bench-sub-item')) {
      e.preventDefault();
    }
  });

  // ドロップ先の最適ターゲット検出（ポインタ直下 ＋ ポインタ近接判定）
  function findBestDropTarget(clientX, clientY, ghostRect, source) {
    const tacticalSideCol = document.getElementById('tactical-side-column');
    const isDrawerOpen = tacticalSideCol && tacticalSideCol.classList.contains('sheet-open');
    const winWidth = window.innerWidth;
    const isMobile = winWidth <= 900;
    const isPointerInsideDrawer = isDrawerOpen && clientX > (winWidth - 295);

    const elAtPoint = document.elementFromPoint(clientX, clientY);
    if (elAtPoint) {
      // ドロワーが開いていて指がドロワー内にある時は、背後のスタメン枠を絶対に拾わない（誤交代防止）
      if (!isPointerInsideDrawer) {
        const starterNode = elAtPoint.closest('.pitch-node[data-slot-index]');
        if (starterNode && starterNode !== source.element) {
          return { type: 'starter', element: starterNode };
        }
      }
      const benchNode = elAtPoint.closest('.bench-sub-item[data-player-id]');
      if (benchNode && benchNode !== source.element) {
        return { type: 'bench-item', element: benchNode };
      }
    }

    const hitMargin = isMobile ? 6 : 10;
    const calcRectEdgeDist = (px, py, r) => {
      const dx = Math.max(r.left - px, 0, px - r.right);
      const dy = Math.max(r.top - py, 0, py - r.bottom);
      return Math.hypot(dx, dy);
    };

    // ピッチ上のスタメン枠との当たり判定（ポインタ位置ベースで誤吸着を防止）
    if (!isPointerInsideDrawer) {
      const starterNodes = document.querySelectorAll('#pitch-nodes-layer .pitch-node[data-slot-index]');
      let bestStarter = null;
      let bestDist = Infinity;

      starterNodes.forEach(node => {
        if (node === source.element) return;
        const r = node.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;

        const edgeDist = calcRectEdgeDist(clientX, clientY, r);
        if (edgeDist > hitMargin) return;

        const nCenterX = r.left + r.width / 2;
        const nCenterY = r.top + r.height / 2;
        const centerDist = Math.hypot(clientX - nCenterX, clientY - nCenterY);

        if (centerDist < bestDist) {
          bestDist = centerDist;
          bestStarter = node;
        }
      });

      if (bestStarter) {
        return { type: 'starter', element: bestStarter };
      }
    }

    // 控え・ベンチ外選手カードとの当たり判定（モバイルでドロワーが閉じている時は除外）
    if (!isMobile || isDrawerOpen) {
      const benchNodes = document.querySelectorAll('#pitch-bench-list .bench-sub-item[data-player-id], #pitch-reserves-list .bench-sub-item[data-player-id]');
      let bestBench = null;
      let bestBenchDist = Infinity;

      benchNodes.forEach(node => {
        if (node === source.element) return;
        const r = node.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;

        const edgeDist = calcRectEdgeDist(clientX, clientY, r);
        if (edgeDist > hitMargin) return;

        const nCenterX = r.left + r.width / 2;
        const nCenterY = r.top + r.height / 2;
        const centerDist = Math.hypot(clientX - nCenterX, clientY - nCenterY);

        if (centerDist < bestBenchDist) {
          bestBenchDist = centerDist;
          bestBench = node;
        }
      });

      if (bestBench) {
        return { type: 'bench-item', element: bestBench };
      }
    }

    if (source.type === 'starter' && elAtPoint) {
      const benchList = elAtPoint.closest('#pitch-bench-list, .pitch-sub-box');
      if (benchList) {
        return { type: 'bench-list', element: document.getElementById('pitch-bench-list') || benchList };
      }
    }

    return null;
  }

  // Pointer Down
  document.addEventListener('pointerdown', (e) => {
    const rosterView = document.getElementById('view-roster');
    if (!rosterView || rosterView.classList.contains('hidden')) return;

    // ボタンや入力要素は通常のクリック操作を優先
    if (e.target.closest('button, select, input, a')) return;

    const starterNode = e.target.closest('.pitch-node[data-slot-index]');
    const benchItem = e.target.closest('.bench-sub-item[data-player-id]');
    if (!starterNode && !benchItem) return;

    const playerClub = getPlayerClub();
    if (!playerClub) return;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    startX = e.clientX;
    startY = e.clientY;
    isDragging = false;
    isTouchReady = false;
    lastHoverDropTarget = null;

    if (starterNode && starterNode.dataset.slotIndex !== undefined) {
      const slotIndex = parseInt(starterNode.dataset.slotIndex, 10);
      const starter = playerClub.players.find(p => p.isStarter && p.slotIndex === slotIndex);
      if (starter) {
        const rect = starterNode.getBoundingClientRect();
        dragSource = {
          type: 'starter',
          playerId: starter.id,
          slotIndex: slotIndex,
          squadNumber: starter.squadNumber || '-',
          name: starter.name,
          pos: starter.assignedPos || starter.pos,
          ovr: getEffectivePlayerRating(starter),
          element: starterNode,
          cardWidth: rect.width,
          cardHeight: rect.height,
          grabOffsetX: e.clientX - rect.left,
          grabOffsetY: e.clientY - rect.top
        };
      }
    } else if (benchItem && benchItem.dataset.playerId) {
      const benchPlayer = playerClub.players.find(p => p.id === benchItem.dataset.playerId && !p.isStarter);
      if (benchPlayer) {
        const rect = benchItem.getBoundingClientRect();
        dragSource = {
          type: 'bench',
          playerId: benchPlayer.id,
          slotIndex: null,
          squadNumber: benchPlayer.squadNumber || '-',
          name: benchPlayer.name,
          pos: benchPlayer.primaryPosition || benchPlayer.pos,
          ovr: getPlayerOverallRating(benchPlayer),
          element: benchItem,
          cardWidth: rect.width,
          cardHeight: rect.height,
          grabOffsetX: e.clientX - rect.left,
          grabOffsetY: e.clientY - rect.top
        };
      }
    }

    if (!dragSource) return;

    benchListEl = (benchItem && benchItem.closest('.pitch-bench-list, .pitch-reserves-list, .tactical-side-column')) || document.getElementById('pitch-bench-list');
    if (dragSource.type === 'bench' && benchListEl) {
      isBenchScrolling = false;
      benchScrollStartX = e.clientX;
      benchScrollStartLeft = benchListEl.scrollLeft;
      lastMoveX = e.clientX;
      lastMoveTime = performance.now();
      scrollVelocity = 0;
    }

    const isTouch = e.pointerType === 'touch';
    if (isTouch) {
      const targetEl = dragSource.element;
      const delayMs = dragSource.type === 'bench' ? 260 : 100;
      longPressTimer = setTimeout(() => {
        if (!dragSource) return;
        isTouchReady = true;
        if (targetEl) {
          targetEl.classList.add('touch-drag-ready');
          if (navigator.vibrate) {
            try { navigator.vibrate(15); } catch(err) {}
          }
        }
      }, delayMs);
    } else {
      isTouchReady = true;
    }
  });

  // Pointer Move
  document.addEventListener('pointermove', (e) => {
    if (!dragSource) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const dist = Math.hypot(deltaX, deltaY);

    // 控えリストの横スクロール中
    if (isBenchScrolling && benchListEl) {
      if (e.cancelable) e.preventDefault();
      benchListEl.scrollLeft = benchScrollStartLeft - (e.clientX - benchScrollStartX);
      const now = performance.now();
      const dt = now - lastMoveTime;
      if (dt > 0) {
        scrollVelocity = (e.clientX - lastMoveX) / dt;
      }
      lastMoveX = e.clientX;
      lastMoveTime = now;
      return;
    }

    if (!isDragging) {
      const isTouch = e.pointerType === 'touch';

      // モバイルで控え・ベンチ外選手カードに対するタッチ操作の分岐：
      // 長押し完了前は縦スクロールを優先し、縦スワイプ検知時は即座にネイティブスクロールへ解放する
      if (isTouch && dragSource.type === 'bench') {
        const isVerticalScroll = !isTouchReady && Math.abs(deltaY) > 6 && Math.abs(deltaY) >= Math.abs(deltaX) * 0.9;
        if (isVerticalScroll) {
          cleanupDrag();
          return;
        }
        const isLeftward = deltaX < -16 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
        const isHorizTray = benchListEl && getComputedStyle(benchListEl).overflowX === 'auto' && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY);

        if (isTouchReady || isLeftward) {
          isDragging = true;
          isBenchScrolling = false;
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          if (dragSource.element) {
            dragSource.element.classList.remove('touch-drag-ready');
            dragSource.element.classList.add('dragging');
          }

          if (window.innerWidth <= 900) document.body.classList.add('is-tactical-dragging');
          ghostEl = dragSource.element.cloneNode(true);
          ghostEl.removeAttribute('id');
          ghostEl.classList.remove('bench-sub-item', 'dragging', 'touch-drag-ready', 'drag-drop-target-active', 'selected');
          ghostEl.classList.add('tactical-drag-ghost-card');

          const initLeft = e.clientX - dragSource.grabOffsetX;
          const initTop = e.clientY - dragSource.grabOffsetY;
          ghostEl.style.setProperty('position', 'fixed', 'important');
          ghostEl.style.setProperty('width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('min-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('max-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('height', `${dragSource.cardHeight}px`, 'important');
          ghostEl.style.setProperty('left', `${initLeft}px`, 'important');
          ghostEl.style.setProperty('top', `${initTop}px`, 'important');
          ghostEl.style.setProperty('transform', 'scale(1.06)', 'important');
          ghostEl.style.setProperty('pointer-events', 'none', 'important');
          ghostEl.style.setProperty('z-index', '999999', 'important');

          const srcCanvases = dragSource.element.querySelectorAll('canvas');
          const dstCanvases = ghostEl.querySelectorAll('canvas');
          srcCanvases.forEach((srcC, idx) => {
            const dstC = dstCanvases[idx];
            if (dstC && srcC.width && srcC.height) {
              dstC.width = srcC.width;
              dstC.height = srcC.height;
              const ctx = dstC.getContext('2d');
              if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(srcC, 0, 0);
              }
            }
          });

          document.body.appendChild(ghostEl);
        } else if (isHorizTray) {
          // B. 水平スクロールトレイ表示時のみ水平スワイプで横スクロール
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          isBenchScrolling = true;
          if (benchListEl) {
            benchListEl.scrollLeft = benchScrollStartLeft - (e.clientX - benchScrollStartX);
          }
          lastMoveX = e.clientX;
          lastMoveTime = performance.now();
          if (e.cancelable) e.preventDefault();
          return;
        }
      } else {
        // PCマウス操作 または スタメン選手のドラッグ
        const dragThreshold = isTouch ? 4 : 2;
        if (dist > dragThreshold) {
          isDragging = true;
          if (window.innerWidth <= 900) document.body.classList.add('is-tactical-dragging');
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          if (dragSource.element) {
            dragSource.element.classList.remove('touch-drag-ready');
            dragSource.element.classList.add('dragging');
          }

          ghostEl = dragSource.element.cloneNode(true);
          ghostEl.removeAttribute('id');
          ghostEl.classList.remove('bench-sub-item', 'dragging', 'touch-drag-ready', 'drag-drop-target-active', 'selected');
          ghostEl.classList.add('tactical-drag-ghost-card');

          const initLeft = e.clientX - dragSource.grabOffsetX;
          const initTop = e.clientY - dragSource.grabOffsetY;
          ghostEl.style.setProperty('position', 'fixed', 'important');
          ghostEl.style.setProperty('width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('min-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('max-width', `${dragSource.cardWidth}px`, 'important');
          ghostEl.style.setProperty('height', `${dragSource.cardHeight}px`, 'important');
          ghostEl.style.setProperty('left', `${initLeft}px`, 'important');
          ghostEl.style.setProperty('top', `${initTop}px`, 'important');
          ghostEl.style.setProperty('transform', 'scale(1.06)', 'important');
          ghostEl.style.setProperty('pointer-events', 'none', 'important');
          ghostEl.style.setProperty('z-index', '999999', 'important');

          const srcCanvases = dragSource.element.querySelectorAll('canvas');
          const dstCanvases = ghostEl.querySelectorAll('canvas');
          srcCanvases.forEach((srcC, idx) => {
            const dstC = dstCanvases[idx];
            if (dstC && srcC.width && srcC.height) {
              dstC.width = srcC.width;
              dstC.height = srcC.height;
              const ctx = dstC.getContext('2d');
              if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(srcC, 0, 0);
              }
            }
          });

          document.body.appendChild(ghostEl);
        }
      }
    }

    if (isDragging && ghostEl) {
      if (e.cancelable) e.preventDefault();

      const cardLeft = e.clientX - dragSource.grabOffsetX;
      const cardTop = e.clientY - dragSource.grabOffsetY;
      ghostEl.style.setProperty('left', `${cardLeft}px`, 'important');
      ghostEl.style.setProperty('top', `${cardTop}px`, 'important');

      // eFootball方式：明確なピッチ／ドロワー境界による自然な開閉感知
      const winWidth = window.innerWidth;
      const tacticalSideCol = document.getElementById('tactical-side-column');
      const isDrawerOpen = tacticalSideCol && tacticalSideCol.classList.contains('sheet-open');

      // ピッチ領域（ドロワー左端をしっかり越えた画面右から295pxより左）に指がある時にスッと収納！
      if (isDrawerOpen && e.clientX < (winWidth - 295)) {
        if (typeof toggleBenchSheet === 'function') {
          toggleBenchSheet(false);
        }
      }
      // 控えタブのボタン領域（+8px余白）に指を持ってきた時のみドロワーを開く
      else if (!isDrawerOpen) {
        const benchTabBtn = document.getElementById('btn-open-bench-sheet');
        if (benchTabBtn) {
          const tabRect = benchTabBtn.getBoundingClientRect();
          if (
            tabRect.width > 0 &&
            tabRect.height > 0 &&
            e.clientX >= tabRect.left - 8 &&
            e.clientX <= tabRect.right + 8 &&
            e.clientY >= tabRect.top - 8 &&
            e.clientY <= tabRect.bottom + 8
          ) {
            if (typeof toggleBenchSheet === 'function') {
              toggleBenchSheet(true);
            }
          }
        }
      }

      const ghostRect = {
        left: cardLeft,
        top: cardTop,
        right: cardLeft + dragSource.cardWidth,
        bottom: cardTop + dragSource.cardHeight,
        width: dragSource.cardWidth,
        height: dragSource.cardHeight
      };

      document.querySelectorAll('.drag-drop-target-active').forEach(el => el.classList.remove('drag-drop-target-active'));

      const match = findBestDropTarget(e.clientX, e.clientY, ghostRect, dragSource);
      if (match && match.element) {
        match.element.classList.add('drag-drop-target-active');
        lastHoverDropTarget = match;
      } else {
        lastHoverDropTarget = null;
      }
    }
  }, { passive: false });

  // Pointer Up
  document.addEventListener('pointerup', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (isBenchScrolling) {
      if (benchListEl && Math.abs(scrollVelocity) > 0.2) {
        let v = scrollVelocity * 14;
        const targetList = benchListEl;
        const stepInertia = () => {
          if (Math.abs(v) < 0.5 || !targetList) return;
          targetList.scrollLeft -= v;
          v *= 0.88;
          requestAnimationFrame(stepInertia);
        };
        requestAnimationFrame(stepInertia);
      }
      isBenchScrolling = false;
      cleanupDrag();
      lastHoverDropTarget = null;
      return;
    }

    if (!dragSource) return;

    const source = dragSource;

    if (!isDragging) {
      cleanupDrag();
      lastHoverDropTarget = null;
      return;
    }

    if (window.__setJustFinishedDragging) {
      window.__setJustFinishedDragging(true);
      setTimeout(() => window.__setJustFinishedDragging(false), 200);
    }

    const cardLeft = e.clientX - (source.grabOffsetX || 0);
    const cardTop = e.clientY - (source.grabOffsetY || 0);
    const ghostRect = {
      left: cardLeft,
      top: cardTop,
      right: cardLeft + (source.cardWidth || 120),
      bottom: cardTop + (source.cardHeight || 50),
      width: source.cardWidth || 120,
      height: source.cardHeight || 50
    };

    cleanupDrag();

    const finalMatch = findBestDropTarget(e.clientX, e.clientY, ghostRect, source) || lastHoverDropTarget;
    lastHoverDropTarget = null;

    if (!finalMatch || !finalMatch.element) return;

    if (finalMatch.type === 'starter' && finalMatch.element.dataset.slotIndex !== undefined) {
      const targetSlotIndex = parseInt(finalMatch.element.dataset.slotIndex, 10);
      if (source.type === 'starter') {
        if (source.slotIndex !== targetSlotIndex) {
          swapStarterSlots(source.slotIndex, targetSlotIndex);
        }
      } else if (source.type === 'bench') {
        substituteBenchPlayerToSlot(source.playerId, targetSlotIndex);
        if (typeof toggleBenchSheet === 'function') toggleBenchSheet(false);
      }
    } else if (finalMatch.type === 'bench-item' && finalMatch.element.dataset.playerId) {
      const targetPlayerId = finalMatch.element.dataset.playerId;
      if (source.type === 'starter') {
        substituteBenchPlayerToSlot(targetPlayerId, source.slotIndex);
      } else if (source.type === 'bench' && source.playerId !== targetPlayerId) {
        swapBenchOrReservePlayers(source.playerId, targetPlayerId);
      }
    } else if (finalMatch.type === 'bench-list' && source.type === 'starter') {
      const playerClub = getPlayerClub();
      const benchPlayers = playerClub.players.filter(p => p && !p.isStarter && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
      if (benchPlayers.length > 0) {
        const formationDef = getClubFormationDef(playerClub);
        const slotDef = formationDef.slots[source.slotIndex];
        const sorted = [...benchPlayers].sort((a, b) => {
          const aBench = a.isBench !== false ? 1 : 0;
          const bBench = b.isBench !== false ? 1 : 0;
          if (aBench !== bBench) return bBench - aBench;
          const aFit = getPositionFitInfo(a, slotDef.pos).factor;
          const bFit = getPositionFitInfo(b, slotDef.pos).factor;
          if (aFit !== bFit) return bFit - aFit;
          return getEffectivePlayerRatingForSlot(b, slotDef.pos) - getEffectivePlayerRatingForSlot(a, slotDef.pos);
        });
        substituteBenchPlayerToSlot(sorted[0].id, source.slotIndex);
      }
    }
  });

  // Pointer Cancel
  document.addEventListener('pointercancel', (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    cleanupDrag();
    lastHoverDropTarget = null;
  });
}

function initGame() {
  initTacticalDragAndDrop();
  setupCompetitionNavListeners();
  const btnAdvanceDay = document.getElementById('btn-advance-day');
  if (btnAdvanceDay) {
    btnAdvanceDay.addEventListener('click', () => advanceCalendarDay(false));
  }
  const btnAdvanceToMatch = document.getElementById('btn-advance-to-match');
  if (btnAdvanceToMatch) {
    btnAdvanceToMatch.addEventListener('click', startAdvancingToNextMatch);
  }
  const btnHeaderKickoff = document.getElementById('btn-header-kickoff');
  if (btnHeaderKickoff) {
    btnHeaderKickoff.addEventListener('click', () => openMatchPrecheckModal());
  }
  const btnPlayMatch = document.getElementById('btn-play-match');
  if (btnPlayMatch) {
    btnPlayMatch.addEventListener('click', () => openMatchPrecheckModal());
  }
  const btnPauseAdvance = document.getElementById('btn-pause-advance');
  if (btnPauseAdvance) {
    btnPauseAdvance.addEventListener('click', stopAdvancingCalendar);
  }
  const btnPlayNext = document.getElementById('btn-play-next');
  if (btnPlayNext) {
    btnPlayNext.addEventListener('click', () => openMatchPrecheckModal());
  }
  const btnSkipSeason = document.getElementById('btn-skip-season');
  if (btnSkipSeason) btnSkipSeason.addEventListener('click', skipToSeasonEnd);
  const btnNextSeason = document.getElementById('btn-next-season');
  if (btnNextSeason) btnNextSeason.addEventListener('click', startNextSeason);
  const btnRestart = document.getElementById('btn-restart-game');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      showMainMenuScreen();
    });
  }
  const btnOpenIntro = document.getElementById('btn-open-intro');
  if (btnOpenIntro) {
    btnOpenIntro.addEventListener('click', () => openIntroModal(true));
  }

  // GM就任モーダル内のイベント（フィルタータグ・クラブ選択・詳細同期）
  const clubFilterTags = document.getElementById('club-filter-tags');
  if (clubFilterTags) {
    clubFilterTags.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-filter-tag');
      if (btn && btn.dataset.filter) {
        introClubFilter = btn.dataset.filter;
        document.querySelectorAll('#club-filter-tags .btn-filter-tag').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        renderIntroClubList();
      }
    });
  }

  // スライダー切り替えボタン（前へ・次へ）
  const btnPrevClub = document.getElementById('btn-prev-club');
  if (btnPrevClub) {
    btnPrevClub.addEventListener('click', showPrevIntroClub);
  }

  const btnNextClub = document.getElementById('btn-next-club');
  if (btnNextClub) {
    btnNextClub.addEventListener('click', showNextIntroClub);
  }

  // クラブ直接選択セレクトボックス
  const sliderClubSelect = document.getElementById('slider-club-select');
  if (sliderClubSelect) {
    sliderClubSelect.addEventListener('change', (e) => {
      gameState.selectedClubId = e.target.value;
      renderIntroClubDetail();
    });
  }

  // タッチスワイプ（左右フリック）対応
  const cardContainer = document.getElementById('intro-single-card-container');
  if (cardContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    cardContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    cardContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        // 横方向へのスワイプ判定（縦スクロールの誤判定防止）
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          if (deltaX < 0) {
            showNextIntroClub(); // 左スワイプで次へ
          } else {
            showPrevIntroClub(); // 右スワイプで前へ
          }
        }
      }
    }, { passive: true });
  }

  // キーボード左右矢印キー対応（モーダル表示中）
  window.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('intro-modal-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') {
        showPrevIntroClub();
      } else if (e.key === 'ArrowRight') {
        showNextIntroClub();
      }
    }
  });

  const btnConfirmIntro = document.getElementById('btn-confirm-intro');
  if (btnConfirmIntro) btnConfirmIntro.addEventListener('click', confirmIntroAndStartGame);
  const btnCancelIntro = document.getElementById('btn-cancel-intro');
  if (btnCancelIntro) {
    btnCancelIntro.addEventListener('click', () => {
      const overlayEl = document.getElementById('intro-modal-overlay');
      if (overlayEl) overlayEl.classList.add('hidden');
      setBodyModalLock(false);
    });
  }

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) {
        switchTab(tab);
      }
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

  // モバイル用フォーメーション変更セレクト
  const formationSelectMobile = document.getElementById('formation-select-mobile');
  if (formationSelectMobile) {
    formationSelectMobile.addEventListener('change', (e) => {
      if (e.target.value) {
        setClubFormation(e.target.value);
      }
    });
  }

  // おまかせ最適編成ボタン ＆ 監督采配一任トグル
  const btnAutoOptimal = document.getElementById('btn-auto-optimal-lineup');
  if (btnAutoOptimal) {
    btnAutoOptimal.addEventListener('click', () => {
      applyAutoOptimalLineup();
    });
  }
  const btnToggleDelegation = document.getElementById('btn-toggle-manager-delegation');
  if (btnToggleDelegation) {
    btnToggleDelegation.addEventListener('click', () => {
      toggleManagerDelegation();
    });
  }

  // 作戦ボード（ピッチ）および控え選手のカード全体タップで詳細プロフィール表示
  let justFinishedDragging = false;
  window.__setJustFinishedDragging = function(val) { justFinishedDragging = val; };
  window.__getJustFinishedDragging = function() { return justFinishedDragging; };

  // 作戦ボード（ピッチ）のスタメン枠クリック：詳細プロフィール表示（クリック交代は完全撤廃しドラッグ＆ドロップのみで交代）
  const pitchNodesLayer = document.getElementById('pitch-nodes-layer');
  if (pitchNodesLayer) {
    pitchNodesLayer.addEventListener('click', (e) => {
      if (justFinishedDragging) {
        e.stopPropagation();
        return;
      }
      const nodeEl = e.target.closest('.pitch-node');
      if (nodeEl && nodeEl.dataset.playerId) {
        e.stopPropagation();
        openPlayerProfileModal(nodeEl.dataset.playerId);
      }
    });
  }

  // 控え・ベンチ外右スライドサイドドロワーの開閉制御
  const btnOpenBenchSheet = document.getElementById('btn-open-bench-sheet');
  const benchSheetHandle = document.getElementById('bench-sheet-handle');
  const tacticalSideColumn = document.getElementById('tactical-side-column');
  const benchSheetBackdrop = document.getElementById('bench-sheet-backdrop');

  function toggleBenchSheet(forceOpen) {
    if (!tacticalSideColumn) return;
    // PC環境（幅900px超）ではドロワー開閉を行わず常に通常2カラム表示を維持
    if (window.innerWidth > 900) return;
    const isOpen = tacticalSideColumn.classList.contains('sheet-open');
    const targetState = forceOpen !== undefined ? forceOpen : !isOpen;
    tacticalSideColumn.classList.toggle('sheet-open', targetState);
    if (benchSheetBackdrop) {
      benchSheetBackdrop.classList.toggle('active', targetState);
    }
    if (targetState && typeof applyPitchNodeNameMarquee === 'function') {
      requestAnimationFrame(() => applyPitchNodeNameMarquee());
    }
  }
  window.toggleBenchSheet = toggleBenchSheet;

  // 右スライドサイドドロワーのスワイプ開閉制御（右端から左スワイプで展開、右スワイプで収納）
  let touchStartX = 0;
  let touchStartY = 0;
  let isEdgeSwipePotential = false;
  let isDrawerSwipePotential = false;

  document.addEventListener('touchstart', (e) => {
    if (!tacticalSideColumn) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    const winWidth = window.innerWidth;
    const isOpen = tacticalSideColumn.classList.contains('sheet-open');

    if (!isOpen) {
      // 閉じてる時：画面右端付近（右から70px以内）またはタブ上でのタッチでエッジスワイプスタンバイ
      if (touchStartX > winWidth - 70 || e.target.closest('#btn-open-bench-sheet')) {
        isEdgeSwipePotential = true;
      } else {
        isEdgeSwipePotential = false;
      }
      isDrawerSwipePotential = false;
    } else {
      // 開いている時：ドロワー上または背景でのタッチで右スワイプ収納スタンバイ
      if (e.target.closest('#tactical-side-column, #bench-sheet-backdrop')) {
        isDrawerSwipePotential = true;
      } else {
        isDrawerSwipePotential = false;
      }
      isEdgeSwipePotential = false;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!tacticalSideColumn) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // 縦スクロールが支配的な場合はキャンセル
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) return;

    // 1. 閉じている時：右から左へスワイプ（deltaX < -25px）でドロワー展開！
    if (isEdgeSwipePotential && deltaX < -25) {
      isEdgeSwipePotential = false;
      toggleBenchSheet(true);
    }

    // 2. 開いている時：左から右へスワイプ（deltaX > 30px）でドロワー収納！
    if (isDrawerSwipePotential && deltaX > 30) {
      isDrawerSwipePotential = false;
      toggleBenchSheet(false);
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    isEdgeSwipePotential = false;
    isDrawerSwipePotential = false;
  }, { passive: true });


  if (btnOpenBenchSheet) {
    btnOpenBenchSheet.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBenchSheet(true);
    });
  }
  if (benchSheetHandle) {
    benchSheetHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBenchSheet(false);
    });
  }
  if (benchSheetBackdrop) {
    benchSheetBackdrop.addEventListener('click', () => {
      toggleBenchSheet(false);
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

  // 控え / ベンチ外のモバイルトグルピル
  const pillBenchBtn = document.getElementById('pill-show-bench');
  if (pillBenchBtn) {
    pillBenchBtn.addEventListener('click', () => {
      gameState.tacticalBottomSubView = 'bench';
      renderTacticalBoard();
    });
  }
  const pillReservesBtn = document.getElementById('pill-show-reserves');
  if (pillReservesBtn) {
    pillReservesBtn.addEventListener('click', () => {
      gameState.tacticalBottomSubView = 'reserves';
      renderTacticalBoard();
    });
  }

  // 控え選手リスト ＆ ベンチ外選手リスト：クリック時は詳細プロフィール表示（交代はドラッグ＆ドロップのみ）
  const bindBenchOrReservesProfileClick = (listEl) => {
    if (!listEl) return;
    listEl.addEventListener('click', (e) => {
      if (justFinishedDragging) {
        e.stopPropagation();
        return;
      }
      const itemEl = e.target.closest('.bench-sub-item');
      if (itemEl && itemEl.dataset.playerId) {
        e.stopPropagation();
        openPlayerProfileModal(itemEl.dataset.playerId);
      }
    });
  };
  bindBenchOrReservesProfileClick(document.getElementById('pitch-bench-list'));
  bindBenchOrReservesProfileClick(document.getElementById('pitch-reserves-list'));

  const tacticsBtnGroup = document.getElementById('tactics-btn-group');
  if (tacticsBtnGroup) {
    tacticsBtnGroup.addEventListener('click', (e) => {
      const infoBtn = e.target.closest('[data-tactic-info]');
      if (infoBtn && infoBtn.dataset.tacticInfo) {
        e.stopPropagation();
        e.preventDefault();
        showTacticInfoPopup(infoBtn.dataset.tacticInfo);
        return;
      }

      const tacticBtn = e.target.closest('.btn-tactic');
      if (tacticBtn && tacticBtn.dataset.tactic) {
        setTeamTactic(tacticBtn.dataset.tactic);
      }
    });
  }

  const rosterTbodyEl = document.getElementById('roster-tbody');
  if (rosterTbodyEl) {
    rosterTbodyEl.addEventListener('click', (e) => {
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

      const loanListBtn = e.target.closest('.btn-loan-listing');
      if (loanListBtn) {
        e.stopPropagation();
        toggleLoanListing(loanListBtn.dataset.loanListId);
        return;
      }

      const extendBtn = e.target.closest('.btn-extend-contract');
      if (extendBtn) {
        e.stopPropagation();
        extendPlayerContract(extendBtn.dataset.extendId);
        return;
      }

      const demoteBtn = e.target.closest('.btn-demote-youth');
      if (demoteBtn) {
        e.stopPropagation();
        demotePlayerToYouth(demoteBtn.dataset.demoteId);
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

    rosterTbodyEl.addEventListener('change', (e) => {
      const selectEl = e.target.closest('.slot-select');
      if (selectEl) {
        changeStarterAssignedPos(selectEl.dataset.slotPlayerId, selectEl.value);
      }
    });
  }

  // 移籍サブタブバー切り替えイベント
  const marketSubnav = document.getElementById('market-subnav-bar');
  if (marketSubnav) {
    marketSubnav.addEventListener('click', (e) => {
      const btn = e.target.closest('.roster-subtab-btn');
      if (btn && btn.dataset.marketSubtab) {
        switchMarketSubtab(btn.dataset.marketSubtab);
      }
    });
  }

  // 経営サブタブバー切り替えイベント
  const facilitiesSubnav = document.getElementById('facilities-subnav-bar');
  if (facilitiesSubnav) {
    facilitiesSubnav.addEventListener('click', (e) => {
      const btn = e.target.closest('.roster-subtab-btn');
      if (btn && btn.dataset.facilitiesSubtab) {
        switchFacilitiesSubtab(btn.dataset.facilitiesSubtab);
      }
    });
  }

  // 移籍市場テーブル内 クリックイベント（ダイレクト交渉・送信オファー遷移・詳細・ショートリストトグル）
  const marketTbodyEl = document.getElementById('market-tbody');
  if (marketTbodyEl) {
    marketTbodyEl.addEventListener('click', (e) => {
    const gotoOffersBtn = e.target.closest('[data-goto-offers]');
    if (gotoOffersBtn) {
      e.stopPropagation();
      switchMarketSubtab('offers');
      switchOffersTab(gotoOffersBtn.dataset.gotoOffers || 'outgoing');
      return;
    }
    const scoutBtn = e.target.closest('[data-scout-player-id]');
    if (scoutBtn) {
      e.stopPropagation();
      const pid = scoutBtn.dataset.scoutPlayerId;
      const res = typeof assignScoutToPlayer === 'function' ? assignScoutToPlayer(pid) : { ok: false };
      if (res.ok) {
        showToast(`スカウトを派遣しました（調査完了まで約${res.totalDays}日）`, 'info');
        updateMarketBadges();
        renderMarket();
        renderShortlist();
        scheduleAutoSave();
      } else if (res.reason === 'slots_full') {
        showToast(`スカウト派遣枠が上限（${res.maxSlots}名）に達しています。スカウト網Lvを上げると枠が増えます。`, 'warning');
      }
      return;
    }
    const formalBtn = e.target.closest('[data-formal-offer-id]');
    if (formalBtn) {
      e.stopPropagation();
      openTransferNegotiationModal(formalBtn.dataset.formalOfferId);
      return;
    }
    const slBtn = e.target.closest('[data-shortlist-toggle]');
    if (slBtn) {
      e.stopPropagation();
      toggleShortlist(slBtn.dataset.shortlistToggle);
      return;
    }
    const profileBtn = e.target.closest('[data-profile-id]');
    if (profileBtn) {
      e.stopPropagation();
      openPlayerProfileModal(profileBtn.dataset.profileId);
      return;
    }
      const offerBtn = e.target.closest('.btn-offer-transfer');
      if (offerBtn) {
        e.stopPropagation();
        const playerId = offerBtn.dataset.offerId || offerBtn.dataset.offerPlayerId;
        openTransferNegotiationModal(playerId);
        return;
      }
      const signBtn = e.target.closest('.btn-sign-player');
      if (signBtn) {
        signMarketPlayer(signBtn.dataset.signId);
      }
    });
  }

  // 獲得ターゲットリスト（SHORTLIST）テーブル内 クリックイベント
  const shortlistTbody = document.getElementById('shortlist-tbody');
  if (shortlistTbody) {
    shortlistTbody.addEventListener('click', (e) => {
      const gotoOffersBtn = e.target.closest('[data-goto-offers]');
      if (gotoOffersBtn) {
        e.stopPropagation();
        switchMarketSubtab('offers');
        switchOffersTab(gotoOffersBtn.dataset.gotoOffers || 'outgoing');
        return;
      }

      const scoutBtn = e.target.closest('[data-scout-player-id]');
      if (scoutBtn) {
        e.stopPropagation();
        const pid = scoutBtn.dataset.scoutPlayerId;
        const res = typeof assignScoutToPlayer === 'function' ? assignScoutToPlayer(pid) : { ok: false };
        if (res.ok) {
          showToast(`スカウトを派遣しました（調査完了まで約${res.totalDays}日）`, 'info');
          updateMarketBadges();
          renderMarket();
          renderShortlist();
          scheduleAutoSave();
        } else if (res.reason === 'slots_full') {
          showToast(`スカウト派遣枠が上限（${res.maxSlots}名）に達しています。スカウト網Lvを上げると枠が増えます。`, 'warning');
        }
        return;
      }

      const profileEl = e.target.closest('[data-profile-id]');
      if (profileEl) {
        e.stopPropagation();
        openPlayerProfileModal(profileEl.dataset.profileId);
        return;
      }
      const formalBtn = e.target.closest('[data-formal-offer-id]');
      if (formalBtn) {
        e.stopPropagation();
        openTransferNegotiationModal(formalBtn.dataset.formalOfferId);
        return;
      }
      const removeBtn = e.target.closest('[data-shortlist-remove]');
      if (removeBtn) {
        e.stopPropagation();
        toggleShortlist(removeBtn.dataset.shortlistRemove);
        return;
      }
    });
  }

  // 受信オファーリスト（INCOMING OFFERS）内 クリックイベント
    // オファー一覧（受信オファー / 送信オファー）コンテナのクリックイベント
    // オファー一覧（受信オファー / 送信オファー）コンテナおよびドキュメント全体の委譲クリック
  function handleOfferActions(e) {
    // 選手プロフィールリンク
    const profileBtn = e.target.closest('[data-profile-id]');
    if (profileBtn && !e.target.closest('button:not(.player-name-link):not(.offer-player-avatar-wrap):not([data-profile-id])')) {
      e.stopPropagation();
      openPlayerProfileModal(profileBtn.dataset.profileId);
      return;
    }

    // 受信オファー：承諾 (ACCEPT)
    const acceptBtn = e.target.closest('[data-offer-accept]');
    if (acceptBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = acceptBtn.getAttribute('data-offer-accept') || acceptBtn.dataset.offerAccept;
      acceptIncomingOffer(offerId);
      return;
    }

    // 受信オファー：拒否 (REJECT)
    const rejectBtn = e.target.closest('[data-offer-reject]');
    if (rejectBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = rejectBtn.getAttribute('data-offer-reject') || rejectBtn.dataset.offerReject;
      rejectIncomingOffer(offerId);
      return;
    }

    // 受信オファー：上乗せ要求モーダルを開く
    const counterBtn = e.target.closest('[data-offer-counter]');
    if (counterBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = counterBtn.getAttribute('data-offer-counter') || counterBtn.dataset.offerCounter;
      counterIncomingOffer(offerId);
      return;
    }

    // 送信オファー：相手からの増額提示を承認
    const acceptCpuCounterBtn = e.target.closest('[data-outgoing-accept-counter]');
    if (acceptCpuCounterBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = acceptCpuCounterBtn.getAttribute('data-outgoing-accept-counter') || acceptCpuCounterBtn.dataset.outgoingAcceptCounter;
      acceptCpuCounterOffer(offerId);
      return;
    }

    // 送信オファー：契約確定（SIGN）
    const signBtn = e.target.closest('[data-outgoing-sign]');
    if (signBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = signBtn.getAttribute('data-outgoing-sign') || signBtn.dataset.outgoingSign;
      completeOutgoingTransferSigning(offerId);
      return;
    }

    // 送信オファー：履歴削除
    const removeBtn = e.target.closest('[data-outgoing-remove]');
    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = removeBtn.getAttribute('data-outgoing-remove') || removeBtn.dataset.outgoingRemove;
      if (Array.isArray(gameState.outgoingOffers)) {
        gameState.outgoingOffers = gameState.outgoingOffers.filter(o => o.id !== offerId);
        updateMarketBadges();
        renderAll();
      }
      return;
    }

    // 送信オファー：オファー撤回・キャンセル
    const cancelBtn = e.target.closest('[data-outgoing-cancel]');
    if (cancelBtn) {
      e.preventDefault();
      e.stopPropagation();
      const offerId = cancelBtn.getAttribute('data-outgoing-cancel') || cancelBtn.dataset.outgoingCancel;
      cancelOutgoingOffer(offerId);
      return;
    }
  }

  const incomingOffersContainer = document.getElementById('incoming-offers-container');
  if (incomingOffersContainer) {
    incomingOffersContainer.addEventListener('click', handleOfferActions);
  }
  // 万一コンテナ外や再描画タイミングで外れても確実に動作するグローバル委譲
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-offer-accept], [data-offer-reject], [data-offer-counter], [data-outgoing-sign], [data-outgoing-cancel], [data-outgoing-accept-counter], [data-outgoing-remove]')) {
      handleOfferActions(e);
    }
  });

  const offersFilterTabs = document.getElementById('offers-filter-tabs');
  if (offersFilterTabs) {
    offersFilterTabs.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-offers-tab]');
      if (tabBtn) {
        switchOffersTab(tabBtn.dataset.offersTab);
      }
    });
  }

  const youthSquadTbody = document.getElementById('youth-squad-tbody');
  if (youthSquadTbody) {
    youthSquadTbody.addEventListener('click', (e) => {
      const promoteBtn = e.target.closest('.btn-promote-youth, .btn-promote-youth-direct');
      if (promoteBtn) {
        const youthId = promoteBtn.dataset.promoteId || promoteBtn.dataset.promoteDirectId;
        if (youthId) {
          e.stopPropagation();
          promoteYouthPlayer(youthId);
          return;
        }
      }
      const releaseBtn = e.target.closest('.btn-release-youth');
      if (releaseBtn && releaseBtn.dataset.releaseId) {
        e.stopPropagation();
        releaseYouthPlayer(releaseBtn.dataset.releaseId);
        return;
      }
      const profileBtn = e.target.closest('[data-profile-id]');
      if (profileBtn) {
        e.stopPropagation();
        openPlayerProfileModal(profileBtn.dataset.profileId);
        return;
      }
    });
  }

  // グローバル移籍市場のフィルター＆ソートイベント
  const marketFilterCategory = document.getElementById('market-filter-category');
  const marketFilterClub = document.getElementById('market-filter-club');
  const marketFilterPos = document.getElementById('market-filter-pos');
  const marketFilterAge = document.getElementById('market-filter-age');
  const marketFilterStatus = document.getElementById('market-filter-status');
  const marketFilterSort = document.getElementById('market-filter-sort');
  const marketFilterSearch = document.getElementById('market-filter-search');
  const btnMarketFilterReset = document.getElementById('btn-market-filter-reset');

  const resetMarketAndRender = () => {
    gameState.marketFilter.displayLimit = 120;
    renderMarket();
  };

  if (marketFilterCategory) {
    marketFilterCategory.addEventListener('change', (e) => {
      gameState.marketFilter.category = e.target.value;
      gameState.marketFilter.clubId = 'ALL';
      gameState.marketFilter.club = 'ALL';
      resetMarketAndRender();
    });
  }

  if (marketFilterClub) {
    marketFilterClub.addEventListener('change', (e) => {
      gameState.marketFilter.clubId = e.target.value;
      gameState.marketFilter.club = e.target.value;
      resetMarketAndRender();
    });
  }
  if (marketFilterPos) {
    marketFilterPos.addEventListener('change', (e) => {
      gameState.marketFilter.position = e.target.value;
      gameState.marketFilter.pos = e.target.value;
      resetMarketAndRender();
    });
  }
  if (marketFilterAge) {
    marketFilterAge.addEventListener('change', (e) => {
      gameState.marketFilter.ageRange = e.target.value;
      resetMarketAndRender();
    });
  }
  if (marketFilterStatus) {
    marketFilterStatus.addEventListener('change', (e) => {
      gameState.marketFilter.statusFilter = e.target.value;
      resetMarketAndRender();
    });
  }
  if (marketFilterSort) {
    marketFilterSort.addEventListener('change', (e) => {
      gameState.marketFilter.sortKey = e.target.value;
      gameState.marketFilter.sort = e.target.value;
      resetMarketAndRender();
    });
  }
  if (marketFilterSearch) {
    marketFilterSearch.addEventListener('input', (e) => {
      gameState.marketFilter.searchQuery = e.target.value.trim().toLowerCase();
      gameState.marketFilter.search = e.target.value.trim().toLowerCase();
      resetMarketAndRender();
    });
  }
  if (btnMarketFilterReset) {
    btnMarketFilterReset.addEventListener('click', () => {
      gameState.marketFilter = {
        category: 'ALL',
        clubId: 'ALL',
        position: 'ALL',
        ageRange: 'ALL',
        statusFilter: 'ALL',
        sortKey: 'ovr-desc',
        searchQuery: '',
        displayLimit: 120
      };
      if (marketFilterSearch) marketFilterSearch.value = '';
      renderMarket();
    });
  }

  // 移籍市場テーブルのヘッダークリックによる直感的ソート対応
  const marketTableHead = document.querySelector('.market-table thead');
  if (marketTableHead) {
    marketTableHead.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort-col]');
      if (!th) return;
      const col = th.dataset.sortCol;
      let nextSort = null;
      if (col === 'ovr') {
        nextSort = gameState.marketFilter.sortKey === 'ovr-desc' ? 'ovr-asc' : 'ovr-desc';
      } else if (col === 'fee') {
        nextSort = gameState.marketFilter.sortKey === 'fee-desc' ? 'fee-asc' : 'fee-desc';
      } else if (col === 'wage') {
        nextSort = gameState.marketFilter.sortKey === 'wage-desc' ? 'wage-asc' : 'wage-desc';
      } else if (col === 'age') {
        nextSort = gameState.marketFilter.sortKey === 'age-asc' ? 'age-desc' : 'age-asc';
      } else if (col === 'contract') {
        nextSort = gameState.marketFilter.sortKey === 'contract-asc' ? 'contract-desc' : 'contract-asc';
      }
      if (nextSort) {
        gameState.marketFilter.sortKey = nextSort;
        gameState.marketFilter.sort = nextSort;
        if (marketFilterSort) marketFilterSort.value = nextSort;
        resetMarketAndRender();
      }
    });
  }

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

  // 個人スタッツ（大会切り替え：リーグ / 国内カップ / 欧州コンペ / プレシーズン）
  const statsCompNav = document.getElementById('stats-comp-segment-nav');
  if (statsCompNav) {
    statsCompNav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-stats-comp]');
      if (!btn || !btn.dataset.statsComp) return;
      gameState.statsCompView = btn.dataset.statsComp;
      renderLeagueStats(currentLeagueStatsCategory);
    });
  }

  // 個人スタッツ（7大カテゴリー：得点・アシスト・評価点・完封・MOM・出場・警告退場）の切り替え
  const statsCatNavBar = document.getElementById('stats-category-nav-bar');
  if (statsCatNavBar) {
    statsCatNavBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.stats-cat-btn');
      if (btn && btn.dataset.statsCat) {
        renderLeagueStats(btn.dataset.statsCat);
      }
    });
  }

  // GM業務タスク一覧（折りたたみトグル＆実行ボタン）のイベント
  const btnToggleGmTasks = document.getElementById('btn-toggle-gm-tasks');
  if (btnToggleGmTasks) {
    btnToggleGmTasks.addEventListener('click', () => {
      gameState.gmTasksCollapsed = !gameState.gmTasksCollapsed;
      renderGmDuties();
    });
  }

  const bindDutyActivate = (container) => {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-duty-action]');
      if (actionBtn && actionBtn.dataset.dutyAction) {
        handleGmDutyAction(actionBtn.dataset.dutyAction);
      }
    });
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const actionBtn = e.target.closest('[data-duty-action]');
        if (actionBtn && actionBtn.dataset.dutyAction) {
          e.preventDefault();
          handleGmDutyAction(actionBtn.dataset.dutyAction);
        }
      }
    });
  };
  bindDutyActivate(document.getElementById('gm-tasks-mini-summary'));
  bindDutyActivate(document.getElementById('gm-tasks-list'));

  if (typeof initOfficeCommAndSecretaryEvents === 'function') {
    initOfficeCommAndSecretaryEvents();
  }

  // クラブ施設投資（アップグレードボタン＆インフォポップアップ表示）のイベント
  const facilitiesGrid = document.getElementById('facilities-grid');
  if (facilitiesGrid) {
    facilitiesGrid.addEventListener('click', (e) => {
      const infoBtn = e.target.closest('[data-facility-info]');
      if (infoBtn && infoBtn.dataset.facilityInfo) {
        e.stopPropagation();
        e.preventDefault();
        showFacilityInfoPopup(infoBtn.dataset.facilityInfo);
        return;
      }

      const upgradeBtn = e.target.closest('[data-upgrade-facility]');
      if (upgradeBtn && upgradeBtn.dataset.upgradeFacility) {
        upgradeFacility(upgradeBtn.dataset.upgradeFacility);
      }
    });
  }

  // ユースアカデミー（選手名プロフィール・トップ昇格・見送りボタン）のイベント
  const btnGotoYouthSquad = document.getElementById('btn-goto-youth-squad');
  if (btnGotoYouthSquad) {
    btnGotoYouthSquad.addEventListener('click', () => {
      switchTab('roster');
      const panel = document.getElementById('youth-squad-panel') || document.getElementById('youth-squad-tbody');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // 選手プロフィール詳細モーダルを閉じるイベント＆タブ切り替えイベント
  const closeProfileBtn = document.getElementById('btn-close-profile-modal');
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener('click', closePlayerProfileModal);
  }
  const profileSubnavBar = document.getElementById('profile-subnav-bar');
  if (profileSubnavBar) {
    const onSelectProfileTab = (e) => {
      const btn = e.target.closest('.profile-tab-btn');
      if (!btn || !btn.dataset.profileTab) return;
      switchProfileModalTab(btn.dataset.profileTab);
    };
    profileSubnavBar.addEventListener('click', onSelectProfileTab);
  }
  const profileFooterActions = document.getElementById('profile-footer-actions');
  if (profileFooterActions) {
    profileFooterActions.addEventListener('click', (e) => {
      if (e.target.closest('#btn-close-profile-footer')) {
        closePlayerProfileModal();
        return;
      }
      const renewalBtn = e.target.closest('[data-profile-negotiate-renewal]');
      if (renewalBtn && renewalBtn.dataset.profileNegotiateRenewal) {
        openContractNegotiationModal(renewalBtn.dataset.profileNegotiateRenewal);
        return;
      }
      const transferBtn = e.target.closest('[data-profile-negotiate-transfer]');
      if (transferBtn && transferBtn.dataset.profileNegotiateTransfer) {
        openTransferNegotiationModal(transferBtn.dataset.profileNegotiateTransfer);
      }
    });
  }
  // モーダルは右上の「×」ボタン（#btn-close-profile-modal）または Esc キーのみで閉じる仕様を徹底（オーバーレイ背景クリックでの誤クローズを抑止）
  const profileModalOverlay = document.getElementById('player-profile-modal') || document.getElementById('player-profile-modal-overlay');
  if (profileModalOverlay) {
    profileModalOverlay.addEventListener('click', (e) => {
      const traitBtn = e.target.closest('.profile-trait-tag[data-trait-name]');
      if (!traitBtn) return;
      const traitName = traitBtn.dataset.traitName;
      const bodyEl = profileModalOverlay.querySelector('.profile-traits-wrap')?.parentElement;
      const detailEl = bodyEl ? bodyEl.querySelector('#profile-trait-detail') : document.getElementById('profile-trait-detail');
      if (!detailEl) return;

      const isAlreadySelected = traitBtn.classList.contains('is-selected') && !detailEl.classList.contains('hidden');
      profileModalOverlay.querySelectorAll('.profile-trait-tag[data-trait-name]').forEach(btn => {
        btn.classList.remove('is-selected');
        btn.setAttribute('aria-expanded', 'false');
      });

      if (isAlreadySelected) {
        detailEl.classList.add('hidden');
        detailEl.innerHTML = '';
        return;
      }

      traitBtn.classList.add('is-selected');
      traitBtn.setAttribute('aria-expanded', 'true');
      const desc = typeof getPlayerTraitDescription === 'function'
        ? getPlayerTraitDescription(traitName)
        : '試合でのパフォーマンスに影響します。';
      detailEl.innerHTML = `<strong class="profile-trait-detail-title">${traitName}</strong><span class="profile-trait-detail-desc">${desc}</span>`;
      detailEl.classList.remove('hidden');
    });
  }

  // 契約更新・移籍獲得交渉モーダルのイベント
  const negModalOverlay = document.getElementById('negotiation-modal');
  const closeNegBtn = document.getElementById('btn-close-neg-modal');
  const cancelNegBtn = document.getElementById('btn-cancel-neg-modal');
  const submitNegBtn = document.getElementById('btn-submit-neg-offer');
  const negModalBody = document.getElementById('neg-modal-body');

  if (closeNegBtn) closeNegBtn.addEventListener('click', closeNegotiationModal);
  if (cancelNegBtn) cancelNegBtn.addEventListener('click', closeNegotiationModal);
  if (submitNegBtn) submitNegBtn.addEventListener('click', submitNegotiationOffer);
  if (negModalOverlay) {
    negModalOverlay.addEventListener('click', (e) => {
      if (e.target === negModalOverlay) {
        closeNegotiationModal();
      }
    });
  }

  if (negModalBody) {
    negModalBody.addEventListener('input', (e) => {
      const session = gameState.negotiationSession;
      if (!session || session.completed) return;

      if (e.target.id === 'neg-salary-slider' || e.target.id === 'neg-salary-input') {
        const demandedWage = Math.max(5, Math.round((session.demandedSalary || 500) / 52));
        const wageVal = Math.max(5, parseInt(e.target.value, 10) || demandedWage);
        session.offeredWage = wageVal;
        session.offeredSalary = wageVal === demandedWage ? session.demandedSalary : wageVal * 52;
        const slider = document.getElementById('neg-salary-slider');
        const numInput = document.getElementById('neg-salary-input');
        const disp = document.getElementById('neg-offered-salary-display');
        const ratioEl = document.getElementById('neg-salary-ratio-text');
        if (slider && e.target !== slider) slider.value = wageVal;
        if (numInput && e.target !== numInput) numInput.value = wageVal;
        if (disp) disp.textContent = formatWage(wageVal);
        if (ratioEl) ratioEl.textContent = `${Math.round((session.offeredSalary / Math.max(1, session.demandedSalary)) * 100)}%`;
      }

      if (e.target.id === 'neg-fee-slider' || e.target.id === 'neg-fee-input') {
        const val = Math.max(100, parseInt(e.target.value, 10) || session.demandedFee);
        session.offeredFee = val;
        const slider = document.getElementById('neg-fee-slider');
        const numInput = document.getElementById('neg-fee-input');
        const disp = document.getElementById('neg-offered-fee-display');
        if (slider && e.target !== slider) slider.value = val;
        if (numInput && e.target !== numInput) numInput.value = val;
        if (disp) disp.textContent = formatMoney(val);
      }

      if (e.target.id === 'neg-installment-select') session.installmentYears = parseInt(e.target.value, 10) || 1;
      if (e.target.id === 'neg-sellon-select') session.sellOnPct = parseInt(e.target.value, 10) || 0;
      if (e.target.id === 'neg-status-select') session.squadStatus = e.target.value || 'first_team';
      if (e.target.id === 'neg-clause-select') {
        const cv = parseInt(e.target.value, 10) || 0;
        session.releaseClause = cv > 0 ? cv : null;
      }
      if (e.target.id === 'neg-buy-option-select') {
        const bv = parseInt(e.target.value, 10) || 0;
        session.buyOptionFee = bv > 0 ? bv : null;
      }
      if (e.target.id === 'neg-loan-slider') {
        session.loanCoveragePercent = parseInt(e.target.value, 10) || 100;
      }
      if (typeof refreshNegCashflowWarning === 'function') {
        refreshNegCashflowWarning(negModalBody);
      }
    });

    negModalBody.addEventListener('click', (e) => {
      const yrBtn = e.target.closest('.btn-neg-year');
      if (yrBtn && yrBtn.dataset.negYear) {
        const session = gameState.negotiationSession;
        if (!session || session.completed) return;
        session.offeredYears = parseInt(yrBtn.dataset.negYear, 10) || 3;
        document.querySelectorAll('#neg-years-group .btn-neg-year').forEach(b => {
          b.classList.toggle('active', b === yrBtn);
        });
        const yrDisp = document.getElementById('neg-offered-years-display');
        if (yrDisp) {
          yrDisp.innerHTML = `<strong>${session.offeredYears}年契約</strong>`;
        }
      }
    });
  }

  // 買取オファーモーダルの閉じるボタン＆オーバーレイクリック
    // 移籍オファー上乗せ要求モーダルのイベント登録
  const counterModal = document.getElementById('counter-offer-modal');
  const btnCloseCounter = document.getElementById('btn-close-counter-modal');
  const btnCancelCounter = document.getElementById('btn-cancel-counter-modal');
  const btnSubmitCounter = document.getElementById('btn-submit-counter-offer');
  const counterSlider = document.getElementById('counter-fee-slider');

  if (btnCloseCounter) btnCloseCounter.addEventListener('click', closeCounterOfferModal);
  if (btnCancelCounter) btnCancelCounter.addEventListener('click', closeCounterOfferModal);
  if (btnSubmitCounter) btnSubmitCounter.addEventListener('click', submitCounterOffer);

  if (counterModal) {
    counterModal.addEventListener('click', (e) => {
      if (e.target === counterModal) {
        closeCounterOfferModal();
      }
    });
  }

  if (counterSlider) {
    counterSlider.addEventListener('input', (e) => {
      if (!activeCounterOfferId || !gameState.incomingOffers) return;
      const offer = gameState.incomingOffers.find(o => o.id === activeCounterOfferId);
      if (!offer) return;
      const ratio = parseInt(e.target.value, 10) / 100;
      // プリセットボタンスタイル更新
      document.querySelectorAll('.btn-counter-preset').forEach(btn => {
        btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.ratio) - ratio) < 0.01);
      });
      updateCounterOfferModalCalculation(offer.offerFee, ratio);
    });
  }

  document.addEventListener('click', (e) => {
    const presetBtn = e.target.closest('.btn-counter-preset');
    if (presetBtn && activeCounterOfferId && gameState.incomingOffers) {
      const offer = gameState.incomingOffers.find(o => o.id === activeCounterOfferId);
      if (!offer) return;
      const ratio = parseFloat(presetBtn.dataset.ratio);
      const slider = document.getElementById('counter-fee-slider');
      if (slider) slider.value = Math.round(ratio * 100);
      document.querySelectorAll('.btn-counter-preset').forEach(b => b.classList.remove('active'));
      presetBtn.classList.add('active');
      updateCounterOfferModalCalculation(offer.offerFee, ratio);
    }
  });

  const incomingOfferModal = document.getElementById('incoming-offer-modal');
  const btnCloseIncoming = document.getElementById('btn-close-incoming-modal');
  if (btnCloseIncoming) {
    btnCloseIncoming.addEventListener('click', closeIncomingOfferModal);
  }
  if (incomingOfferModal) {
    incomingOfferModal.addEventListener('click', (e) => {
      if (e.target === incomingOfferModal) {
        closeIncomingOfferModal();
      }
    });
  }

  // 共通インフォポップアップ（施設・戦術）の閉じるイベント
  const btnCloseInfoPopup = document.getElementById('btn-close-info-popup');
  if (btnCloseInfoPopup) btnCloseInfoPopup.addEventListener('click', closeInfoPopup);
  const infoPopupModal = document.getElementById('info-popup-modal');
  if (infoPopupModal) {
    infoPopupModal.addEventListener('click', (e) => {
      if (e.target === infoPopupModal) closeInfoPopup();
    });
  }

  // 監督交代モーダル 閉じるイベント
  const btnCloseManagerModal = document.getElementById('btn-close-manager-modal');
  if (btnCloseManagerModal) btnCloseManagerModal.addEventListener('click', closeManagerHireModal);
  const managerHireModal = document.getElementById('manager-hire-modal');
  if (managerHireModal) {
    managerHireModal.addEventListener('click', (e) => {
      if (e.target === managerHireModal) closeManagerHireModal();
    });
  }

  // コーチ招聘モーダル 閉じるイベント
  const btnCloseCoachModal = document.getElementById('btn-close-coach-modal');
  if (btnCloseCoachModal) btnCloseCoachModal.addEventListener('click', closeCoachHireModal);
  const coachHireModal = document.getElementById('coach-hire-modal');
  if (coachHireModal) {
    coachHireModal.addEventListener('click', (e) => {
      if (e.target === coachHireModal) closeCoachHireModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const seasonSummaryModal = document.getElementById('season-summary-box');
      if (seasonSummaryModal && !seasonSummaryModal.classList.contains('hidden')) {
        closeSeasonSettlementModal();
        return;
      }
      const scoutModal = document.getElementById('fixture-preview-modal');
      if (scoutModal && !scoutModal.classList.contains('hidden')) {
        closePendingMatchPreviewModal();
        return;
      }
      const pastSummaryModal = document.getElementById('past-match-modal');
      if (pastSummaryModal && !pastSummaryModal.classList.contains('hidden')) {
        closePastMatchSummaryModal();
        return;
      }
      const managerModal = document.getElementById('manager-hire-modal');
      if (managerModal && !managerModal.classList.contains('hidden')) {
        closeManagerHireModal();
        return;
      }
      const coachModal = document.getElementById('coach-hire-modal');
      if (coachModal && !coachModal.classList.contains('hidden')) {
        closeCoachHireModal();
        return;
      }
      const secModal = document.getElementById('secretary-select-modal');
      if (secModal && !secModal.classList.contains('hidden')) {
        closeSecretarySelectModal();
        return;
      }
      const infoPopup = document.getElementById('info-popup-modal');
      if (infoPopup && !infoPopup.classList.contains('hidden')) {
        closeInfoPopup();
        return;
      }
      const recordsOverlay = document.getElementById('records-modal-overlay');
      const settingsOverlay = document.getElementById('settings-modal-overlay');
      if (recordsOverlay && !recordsOverlay.classList.contains('hidden')) {
        closeRecordsModal();
      } else if (settingsOverlay && !settingsOverlay.classList.contains('hidden')) {
        saveSettingsToStorage();
        closeSettingsModal();
      } else if (gameState.incomingTransferOffer) {
        closeIncomingOfferModal();
      } else if (gameState.negotiationSession) {
        closeNegotiationModal();
      } else if (gameState.profileModalPlayerId) {
        closePlayerProfileModal();
      } else {
        const gmOverlay = document.getElementById('gm-modal-overlay');
        if (gmOverlay && !gmOverlay.classList.contains('hidden')) {
          if (typeof closeGmModal === 'function') {
            closeGmModal(false);
          } else {
            gmOverlay.classList.add('hidden');
          }
        }
      }
    }
  });

  // 編成サブタブ（作戦ボード / 選手一覧 / 戦術）の切り替え
  const rosterSubnav = document.getElementById('roster-subnav-bar');
  if (rosterSubnav) {
    rosterSubnav.addEventListener('click', (e) => {
      const btn = e.target.closest('.roster-subtab-btn');
      if (!btn) return;
      const subtabKey = btn.dataset.subtab;
      if (subtabKey) {
        switchRosterSubtab(subtabKey);
      }
    });
  }

  // モバイルでのプルダウンリロード（Pull-to-refresh）防止および誤リロード防止の初期化


  // 対戦スカウティングプレビューモーダルのイベント
  const btnCloseScout = document.getElementById('btn-close-fixture-preview-modal');
  if (btnCloseScout) btnCloseScout.addEventListener('click', closePendingMatchPreviewModal);

  const btnFooterCloseScout = document.getElementById('btn-footer-close-fixture-preview');
  if (btnFooterCloseScout) btnFooterCloseScout.addEventListener('click', closePendingMatchPreviewModal);

  const btnGoTactics = document.getElementById('btn-go-to-tactics-board');
  if (btnGoTactics) {
    btnGoTactics.addEventListener('click', () => {
      closePendingMatchPreviewModal();
      switchTab('roster');
      switchRosterSubtab('board');
    });
  }

  // リストビュー内の未消化試合カードクリックでもプレビューを開く
  const schedListContainer = document.getElementById('season-schedule-list');
  if (schedListContainer) {
    schedListContainer.addEventListener('click', (e) => {
      const pendingCard = e.target.closest('[data-pending-match-week]');
      if (pendingCard) {
        const weekNum = parseInt(pendingCard.dataset.pendingMatchWeek, 10);
        if (weekNum) openPendingMatchPreview(weekNum);
      }
    });
  }

  // カレンダー月送りナビゲーション（前月・翌月・今月）
  const btnCalPrev = document.getElementById('btn-cal-prev-month');
  if (btnCalPrev) btnCalPrev.addEventListener('click', () => changeCalendarMonth(-1));

  const btnCalNext = document.getElementById('btn-cal-next-month');
  if (btnCalNext) btnCalNext.addEventListener('click', () => changeCalendarMonth(1));

  const btnCalToday = document.getElementById('btn-cal-go-today');
  if (btnCalToday) btnCalToday.addEventListener('click', resetCalendarToCurrentMonth);

  // 表示形式トグル（カレンダー / リスト）
  const btnToggleCal = document.getElementById('btn-view-toggle-calendar');
  if (btnToggleCal) btnToggleCal.addEventListener('click', () => switchScheduleViewMode('calendar'));

  const btnToggleList = document.getElementById('btn-view-toggle-list');
  if (btnToggleList) btnToggleList.addEventListener('click', () => switchScheduleViewMode('list'));

  // カレンダーグリッド内のマス目タップ（消化済み：サマリー / 未消化：プレビュー）
  const calGridEl = document.getElementById('calendar-days-grid');
  if (calGridEl) {
    calGridEl.addEventListener('click', (e) => {
      const cupCell = e.target.closest('[data-cal-cup-day-index]');
      if (cupCell) {
        const dayIdx = parseInt(cupCell.dataset.calCupDayIndex, 10);
        if (!Number.isNaN(dayIdx)) {
          openCupMatchPreview(dayIdx);
        }
        return;
      }
      const playedCell = e.target.closest('[data-cal-match-week]');
      if (playedCell) {
        const weekNum = parseInt(playedCell.dataset.calMatchWeek, 10);
        if (weekNum) openPastMatchSummaryModal(weekNum);
        return;
      }
      const pendingCell = e.target.closest('[data-cal-pending-week]');
      if (pendingCell) {
        const weekNum = parseInt(pendingCell.dataset.calPendingWeek, 10);
        if (weekNum) openPendingMatchPreview(weekNum);
      }
    });
  }

  // チームサブタブ（順位表 / 日程・結果 / 個人スタッツ）の切り替えイベント
  const teamSubnavBar = document.getElementById('team-subnav-bar');
  if (teamSubnavBar) {
    teamSubnavBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-team-subtab]');
      if (!btn) return;
      const subtabKey = btn.dataset.teamSubtab;
      switchTeamSubtab(subtabKey);
    });
  }

  // 週間スケジュールから「全日程 ➔」を押したときのイベント
  const btnViewFullSchedule = document.getElementById('btn-view-full-schedule');
  if (btnViewFullSchedule) {
    btnViewFullSchedule.addEventListener('click', () => {
      switchTab('team');
      switchTeamSubtab('schedule');
    });
  }

  // シーズン日程リスト内の消化済み試合タップでサマリーモーダルを開く
  const seasonScheduleList = document.getElementById('season-schedule-list');
  if (seasonScheduleList) {
    seasonScheduleList.addEventListener('click', (e) => {
      const card = e.target.closest('[data-past-match-week]');
      if (!card) return;
      const weekNum = parseInt(card.dataset.pastMatchWeek, 10);
      if (weekNum) {
        openPastMatchSummaryModal(weekNum);
      }
    });
  }

  // 消化済みマッチサマリー振り返りモーダルの閉じるボタンおよび背景クリック
  const btnClosePastMatch = document.getElementById('btn-close-past-match-modal');
  if (btnClosePastMatch) {
    btnClosePastMatch.addEventListener('click', closePastMatchSummaryModal);
  }
  const modalPastSummary = document.getElementById('past-match-modal');
  if (modalPastSummary) {
    modalPastSummary.addEventListener('click', (e) => {
      if (e.target === modalPastSummary) closePastMatchSummaryModal();
    });
  }
  const modalFixturePreview = document.getElementById('fixture-preview-modal');
  if (modalFixturePreview) {
    modalFixturePreview.addEventListener('click', (e) => {
      if (e.target === modalFixturePreview) closePendingMatchPreviewModal();
    });
  }

  // シーズン終了・決算サマリーモーダルの閉じる・確認・背景クリック
  const btnCloseSeasonSummary = document.getElementById('btn-close-season-summary');
  if (btnCloseSeasonSummary) {
    btnCloseSeasonSummary.addEventListener('click', closeSeasonSettlementModal);
  }
  const btnConfirmSeasonSummary = document.getElementById('btn-confirm-season-summary');
  if (btnConfirmSeasonSummary) {
    btnConfirmSeasonSummary.addEventListener('click', closeSeasonSettlementModal);
  }
  const modalSeasonSummary = document.getElementById('season-summary-box');
  if (modalSeasonSummary) {
    modalSeasonSummary.addEventListener('click', (e) => {
      if (e.target === modalSeasonSummary) closeSeasonSettlementModal();
    });
  }

  initReloadPrevention();

  // メインメニュー（タイトル画面）のイベントリスナーを最優先で初期化
  initMainMenuAndModals();

  try {
    setupNewGame(gameState.selectedClubId);
  } catch (err) {
    console.error('setupNewGame error:', err);
  }

  showMainMenuScreen();
}

document.addEventListener('DOMContentLoaded', initGame);

/**
 * 作戦ボード（ピッチ）上部の監督哲学・ステータスバナーを描画
 */
function renderTacticalManagerBanner() {
  const container = document.getElementById('tactical-manager-banner');
  if (!container) return;
  const club = getPlayerClub();
  if (!club) return;

  if (!club.manager) {
    container.innerHTML = `
      <div class="manager-banner-inner" style="justify-content: center;">
        <span class="text-danger mono font-bold">[監督空席] 経営タブの「監督人事」から後任監督を招聘してください</span>
      </div>
    `;
    return;
  }

  const mgr = club.manager;
  const isFormMatch = club.formation === mgr.preferredFormation;
  const isTacticMatch = normalizeTacticKey(club.tactic) === normalizeTacticKey(mgr.preferredTactic);
  const tacticLabel = getManagerTacticLabel(mgr.preferredTactic);

  const formTag = isFormMatch
    ? `<span class="mgr-tag match">布陣: 哲学合致</span>`
    : `<span class="mgr-tag unmatch">布陣: GM指定</span>`;
  const tacticTag = isTacticMatch
    ? `<span class="mgr-tag match">戦術: 哲学合致</span>`
    : `<span class="mgr-tag unmatch">戦術: GM指定</span>`;

  let totalBonus = 0;
  if (isFormMatch) totalBonus += 1;
  if (isTacticMatch) totalBonus += 1;
  const mgrTrust = mgr.trust ?? 80;
  let bonusTag = '';
  if (mgrTrust < 40) {
    bonusTag = `<span class="mgr-tag unmatch">戦術浸透度: 停滞</span>`;
  } else if (totalBonus === 2) {
    bonusTag = `<span class="mgr-tag bonus">戦術浸透度: 高</span>`;
  } else if (totalBonus === 1) {
    bonusTag = `<span class="mgr-tag warn">戦術浸透度: 中</span>`;
  } else {
    bonusTag = `<span class="mgr-tag none">戦術浸透度: 低</span>`;
  }

  const avatarHtml = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(mgr, 'avatar-sm', 32) : '';

  container.innerHTML = `
    <div class="manager-banner-inner">
      <div class="manager-banner-left">
        <div class="manager-avatar-wrap">
          ${avatarHtml}
        </div>
        <div class="manager-banner-info">
          <div class="manager-banner-title">
            <span class="text-muted">監督:</span>
            <strong class="manager-name">${mgr.name}</strong>
            <span class="staff-specialty-tag">${mgr.specialty || 'バランス型'}</span>
            <span class="manager-trust-label mono">信頼度 ${mgr.trust}%</span>
          </div>
          <div class="manager-banner-style mono">
            得意: ${mgr.preferredFormation} / ${tacticLabel}
          </div>
        </div>
      </div>
      <div class="manager-banner-tags mono">
        ${formTag}
        ${tacticTag}
        ${bonusTag}
      </div>
    </div>
  `;
}

/**
 * 作戦ボードの役割指定・自動交代方針・ケミストリー＆戦術習熟度バーを描画
 */
function renderTacticalRolesAndChemBar(club) {
  const bar = document.getElementById('tactical-roles-chem-bar');
  if (!bar || !club) return;
  if (typeof ensureClubRealismFields === 'function') ensureClubRealismFields(club);
  if (typeof calculateClubChemistryAndFamiliarity === 'function') calculateClubChemistryAndFamiliarity(club);

  const activePlayers = (club.players || [])
    .filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut))
    .sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));

  const roles = club.roles || {};
  const buildPlayerOpts = (selectedId) => activePlayers.map(p =>
    `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>#${p.squadNumber || '-'} ${p.name} (${p.primaryPosition || p.pos})</option>`
  ).join('');

  const subPolicyDefs = typeof SUB_POLICY_DEFINITIONS !== 'undefined' ? SUB_POLICY_DEFINITIONS : {};
  const subOpts = Object.values(subPolicyDefs).map(sp =>
    `<option value="${sp.id}" ${(club.subPolicy || 'balanced') === sp.id ? 'selected' : ''}>${sp.label}</option>`
  ).join('');

  const chem = club.teamChemistry ?? 75;
  const fam = club.tacticalFamiliarity ?? 75;

  bar.innerHTML = `
    <div class="roles-chem-metrics mono">
      <div class="chem-pill" title="選手モラルと新加入適応度から算出されるチーム連携度">
        <span>チーム連携:</span>
        <strong class="${chem >= 80 ? 'accent-green' : (chem >= 60 ? 'accent-gold' : 'text-danger')}">${chem}%</strong>
      </div>
      <div class="chem-pill" title="現在の陣形・戦術への習熟度">
        <span>戦術習熟:</span>
        <strong class="${fam >= 80 ? 'accent-green' : (fam >= 60 ? 'accent-gold' : 'text-danger')}">${fam}%</strong>
      </div>
    </div>
    <div class="roles-chem-selectors">
      <label class="role-select-item">
        <span class="mono">主将(C)</span>
        <select id="select-role-captain" class="role-select">${buildPlayerOpts(roles.captainId)}</select>
      </label>
      <label class="role-select-item">
        <span class="mono">PK</span>
        <select id="select-role-pk" class="role-select">${buildPlayerOpts(roles.pkKickerId)}</select>
      </label>
      <label class="role-select-item">
        <span class="mono">FK/CK</span>
        <select id="select-role-setpiece" class="role-select">${buildPlayerOpts(roles.setPieceKickerId)}</select>
      </label>
      <label class="role-select-item">
        <span class="mono">交代方針</span>
        <select id="select-sub-policy" class="role-select">${subOpts}</select>
      </label>
    </div>
  `;

  const bindSel = (id, onChange) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', (e) => onChange(e.target.value));
  };
  bindSel('select-role-captain', (v) => { club.roles.captainId = v; renderTacticalBoard(); scheduleAutoSave(); });
  bindSel('select-role-pk', (v) => { club.roles.pkKickerId = v; scheduleAutoSave(); });
  bindSel('select-role-setpiece', (v) => { club.roles.setPieceKickerId = v; scheduleAutoSave(); });
  bindSel('select-sub-policy', (v) => { club.subPolicy = v; scheduleAutoSave(); });
}

/**
 * 経営タブの「監督人事」パネルを描画
 */
function renderManagerManagementPanel() {
  const container = document.getElementById('manager-panel-body');
  if (!container) return;
  const club = getPlayerClub();
  if (!club) return;

  const trustEl = document.getElementById('manager-panel-trust');
  const wageEl = document.getElementById('manager-panel-wage');

  const mgr = club.manager;
  if (trustEl) trustEl.textContent = mgr ? `${mgr.trust}%` : '---';
  if (wageEl) wageEl.textContent = mgr ? `£${mgr.weeklyWage}k/週` : '£0';

  let currentCardHtml = '';
  if (mgr) {
    if (typeof ensureManagerRankAndStats === 'function') ensureManagerRankAndStats(mgr);
    const buyoutFee = getManagerBuyoutFee(mgr);
    const tacticLabel = getManagerTacticLabel(mgr.preferredTactic);
    const avatarHtml = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(mgr, 'avatar-lg', 48) : '';
    const mStats = mgr.stats || { tactics: 70, motivation: 70, development: 70, discipline: 70 };
    const rTac = getStaffStatRank(mStats.tactics);
    const rMot = getStaffStatRank(mStats.motivation);
    const rDev = getStaffStatRank(mStats.development);
    const rDis = getStaffStatRank(mStats.discipline);

    currentCardHtml = `
      <div class="manager-current-card" style="flex-direction:column; align-items:stretch; border:none; background:transparent; padding:4px 0;">
        <div style="display:flex; align-items:center; gap:12px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div class="manager-current-avatar">${avatarHtml}</div>
          <div style="flex:1; min-width:0;">
            <div class="flat-row-header">
              <div class="flat-row-title-wrap">
                <span class="flat-row-title" style="font-size:16px;">${mgr.name}</span>
                <span class="staff-specialty-tag">${mgr.specialty || 'バランス型'}</span>
              </div>
              <span class="mono text-muted wage-nowrap" style="font-size:11.5px;">${mgr.nationality} · ${mgr.age}歳</span>
            </div>
            <div class="flat-row-meta">${mgr.bio}</div>
          </div>
        </div>
        <div class="ui-kv-list">
          <div class="ui-kv-row">
            <div class="ui-kv-label accent-cyan-bar">戦術方針</div>
            <div class="ui-kv-content mono" style="display:flex; gap:16px; flex-wrap:wrap; font-size:12.5px;">
              <span class="text-muted">得意陣形 <strong style="color:#38bdf8; font-size:14px;">${mgr.preferredFormation}</strong></span>
              <span class="text-muted">得意戦術 <strong class="accent-green" style="font-size:14px;">${tacticLabel}</strong></span>
            </div>
          </div>
          <div class="ui-kv-row">
            <div class="ui-kv-label">指導能力</div>
            <div class="ui-kv-content">
              <div class="staff-stats-chips" style="margin-top:0 !important;">
                <span class="staff-stat-chip stat-rank-${rTac}">戦術眼 <strong>${rTac}</strong></span>
                <span class="staff-stat-chip stat-rank-${rMot}">人心掌握 <strong>${rMot}</strong></span>
                <span class="staff-stat-chip stat-rank-${rDev}">育成手腕 <strong>${rDev}</strong></span>
                <span class="staff-stat-chip stat-rank-${rDis}">規律管理 <strong>${rDis}</strong></span>
              </div>
            </div>
          </div>
          <div class="ui-kv-row">
            <div class="ui-kv-label accent-gold-bar">契約・信頼</div>
            <div class="ui-kv-content">
              <div class="ui-plate-grid">
                <div class="ui-stat-plate is-highlight">
                  <span class="ui-plate-label">現場信頼度</span>
                  <span class="ui-plate-val accent-green">${mgr.trust}%</span>
                </div>
                <div class="ui-stat-plate is-gold">
                  <span class="ui-plate-label">週給</span>
                  <span class="ui-plate-val accent-gold">£${mgr.weeklyWage}k/週</span>
                </div>
                <div class="ui-stat-plate">
                  <span class="ui-plate-label">契約残年数</span>
                  <span class="ui-plate-val">${mgr.contractYears}年</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="manager-current-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${(mgr.contractYears || 0) <= 1 ? `
            <button type="button" class="btn btn-secondary mono" id="btn-extend-manager-contract" style="font-weight: 700; padding: 10px 16px;">
              契約延長 (+2年)
            </button>
          ` : ''}
          <button type="button" class="btn btn-primary mono" id="btn-open-change-manager" style="font-weight: 700; padding: 10px 18px;">
            監督交代 (違約金 £${buyoutFee.toLocaleString()}k)
          </button>
        </div>
      </div>
    `;
  } else {
    currentCardHtml = `
      <div class="manager-current-card" style="border-color: rgba(231, 76, 60, 0.4); justify-content: center; padding: 24px; text-align: center;">
        <div class="mono text-danger font-bold" style="font-size: 14px; margin-bottom: 12px;">
          現在、監督が不在（空席）です。後任監督をスカウトして新監督を招聘してください。
        </div>
        <div>
          <button type="button" class="btn btn-primary mono" id="btn-open-change-manager" style="font-weight: 700; padding: 10px 24px; font-size: 14px;">
            新監督を招聘する
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = currentCardHtml;

  const extendBtn = document.getElementById('btn-extend-manager-contract');
  if (extendBtn) {
    extendBtn.addEventListener('click', () => {
      extendPlayerManagerContract();
    });
  }

  // イベント登録：「監督を交代する」ボタンで後任選択モーダルを開く
  const changeBtn = document.getElementById('btn-open-change-manager');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      openManagerHireModal();
    });
  }
}

/**
 * 現監督との契約を延長する
 */
function extendPlayerManagerContract() {
  const club = getPlayerClub();
  if (!club || !club.manager) return false;
  const mgr = club.manager;
  const curYears = typeof mgr.contractYears === 'number' ? Math.max(0, mgr.contractYears) : 1;
  const newYears = Math.min(5, curYears + 2);
  if (newYears <= curYears) return false;

  const ok = window.confirm(`${mgr.name}監督との契約を延長しますか？\n（延長後契約: ${newYears}年 / 週給: £${mgr.weeklyWage}k）`);
  if (!ok) return false;

  mgr.contractYears = newYears;
  mgr.trust = clamp((mgr.trust || 75) + 5, 0, 100);
  addDailyLog(`監督契約更新：${mgr.name}監督と契約を延長しました（残契約：${newYears}年）`);
  renderAll();
  if (gameState.hasStartedOnce && typeof saveGameToStorage === 'function') saveGameToStorage(false);
  return true;
}

/**
 * シーズン終了時の監督・コーチ陣の加齢および監督契約満了更新
 */
function ageAndRenewCoachingStaffAtSeasonEnd(playerRetirementLogs = []) {
  const agedStaffIds = new Set();
  const managedClubs = typeof getAllManagedLeagueClubs === 'function' ? getAllManagedLeagueClubs() : (gameState.clubs || []);
  if (!Array.isArray(gameState.freeManagers)) gameState.freeManagers = [];

  const usedStaffNames = new Set();
  for (const c of managedClubs) {
    if (!c) continue;
    if (c.manager && c.manager.name) usedStaffNames.add(c.manager.name);
    if (c.coaches) {
      (c.coaches.attacking || []).forEach(x => { if (x && x.name) usedStaffNames.add(x.name); });
      (c.coaches.defending || []).forEach(x => { if (x && x.name) usedStaffNames.add(x.name); });
      if (c.coaches.goalkeeping && c.coaches.goalkeeping.name) usedStaffNames.add(c.coaches.goalkeeping.name);
      if (c.coaches.fitness && c.coaches.fitness.name) usedStaffNames.add(c.coaches.fitness.name);
    }
  }
  gameState.freeManagers.forEach(m => { if (m && m.name) usedStaffNames.add(m.name); });
  if (gameState.freeCoaches && typeof gameState.freeCoaches === 'object') {
    ['attacking', 'defending', 'goalkeeping', 'fitness'].forEach(cat => {
      (gameState.freeCoaches[cat] || []).forEach(co => { if (co && co.name) usedStaffNames.add(co.name); });
    });
  }

  const createReplacementFreeManager = () => {
    const db = (typeof MANAGERS_DATABASE !== 'undefined' && Array.isArray(MANAGERS_DATABASE) && MANAGERS_DATABASE.length > 0)
      ? MANAGERS_DATABASE
      : [{ nationality: 'England', age: 44, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 80, bio: '現代的な戦術眼と指導力でチームを牽引する指揮官。' }];
    const tpl = db[randInt(0, db.length - 1)];
    return createManager({ ...tpl, age: randInt(39, 53), contractYears: 3 }, null, usedStaffNames);
  };

  const createReplacementFreeCoach = (cat) => {
    const db = (typeof COACHES_DATABASE !== 'undefined' && COACHES_DATABASE[cat] && COACHES_DATABASE[cat].length > 0)
      ? COACHES_DATABASE[cat]
      : [{ rank: 'B', nationality: 'England', age: 42, weeklyWage: 20 }];
    const tpl = db[randInt(0, db.length - 1)];
    return createCoach({ ...tpl, age: randInt(36, 51) }, cat, usedStaffNames);
  };

  for (const club of managedClubs) {
    if (!club) continue;
    const mgr = club.manager;
    if (mgr && !agedStaffIds.has(mgr.id)) {
      agedStaffIds.add(mgr.id);
      mgr.age = (mgr.age || 45) + 1;
      if (typeof mgr.contractYears !== 'number' || Number.isNaN(mgr.contractYears)) {
        mgr.contractYears = 2;
      }
      mgr.contractYears = Math.max(0, mgr.contractYears - 1);

      if (club.isPlayer) {
        if (mgr.age >= 72) {
          mgr.contractYears = 0;
          playerRetirementLogs.push(
            `勇退：${mgr.name}監督（${mgr.age}歳）が高齢のため新シーズン開幕前に勇退予定です（経営タブより後任監督を招聘できます）`
          );
        } else if (mgr.contractYears === 0) {
          playerRetirementLogs.push(
            `契約満了：${mgr.name}監督（${mgr.age}歳）の契約が満了しました（経営タブから契約延長、または違約金 £0 で監督交代が可能です）`
          );
        }
      } else {
        const mustReplace = mgr.age >= 70;
        const expired = mgr.contractYears <= 0;
        if (mustReplace || expired) {
          const keepCurrent = !mustReplace && (mgr.trust || 70) >= 65 && Math.random() < 0.72;
          if (keepCurrent) {
            mgr.contractYears = randInt(2, 3);
            mgr.trust = clamp((mgr.trust || 75) + 3, 40, 100);
          } else {
            let candidateIdx = gameState.freeManagers.findIndex(m => m && (m.age || 45) < 67);
            if (candidateIdx === -1) {
              gameState.freeManagers.push(createReplacementFreeManager());
              candidateIdx = gameState.freeManagers.length - 1;
            }
            const nextMgr = gameState.freeManagers.splice(candidateIdx, 1)[0];
            if (nextMgr) {
              if (!agedStaffIds.has(nextMgr.id)) {
                agedStaffIds.add(nextMgr.id);
                nextMgr.age = (nextMgr.age || 45) + 1;
              }
              nextMgr.contractYears = randInt(2, 4);
              nextMgr.trust = 80;
              club.manager = nextMgr;
              club.formation = nextMgr.preferredFormation || club.formation || '4-3-3';
              club.tactic = typeof normalizeTacticKey === 'function'
                ? normalizeTacticKey(nextMgr.preferredTactic || club.tactic)
                : (nextMgr.preferredTactic || club.tactic);
              if (!mustReplace && mgr.age < 70) {
                mgr.contractYears = 2;
                mgr.trust = 70;
                gameState.freeManagers.push(mgr);
              }
            } else {
              mgr.contractYears = randInt(2, 3);
            }
          }
        }
      }
    }

    if (club.coaches && typeof club.coaches === 'object') {
      const coachEntries = [
        ...(Array.isArray(club.coaches.attacking) ? club.coaches.attacking : []),
        ...(Array.isArray(club.coaches.defending) ? club.coaches.defending : []),
        club.coaches.goalkeeping,
        club.coaches.fitness
      ].filter(Boolean);
      for (const co of coachEntries) {
        if (!agedStaffIds.has(co.id)) {
          agedStaffIds.add(co.id);
          co.age = (co.age || 42) + 1;
        }
      }
    }
  }

  gameState.freeManagers = gameState.freeManagers.filter(m => {
    if (!m) return false;
    if (!agedStaffIds.has(m.id)) {
      agedStaffIds.add(m.id);
      m.age = (m.age || 45) + 1;
    }
    return m.age < 70;
  });
  while (gameState.freeManagers.length < 6) {
    const rep = createReplacementFreeManager();
    agedStaffIds.add(rep.id);
    gameState.freeManagers.push(rep);
  }

  if (gameState.freeCoaches && typeof gameState.freeCoaches === 'object') {
    for (const cat of ['attacking', 'defending', 'goalkeeping', 'fitness']) {
      const arr = Array.isArray(gameState.freeCoaches[cat]) ? gameState.freeCoaches[cat] : [];
      gameState.freeCoaches[cat] = arr.filter(co => {
        if (!co) return false;
        if (!agedStaffIds.has(co.id)) {
          agedStaffIds.add(co.id);
          co.age = (co.age || 42) + 1;
        }
        return co.age < 68;
      });
      while (gameState.freeCoaches[cat].length < 2) {
        const repCo = createReplacementFreeCoach(cat);
        agedStaffIds.add(repCo.id);
        gameState.freeCoaches[cat].push(repCo);
      }
    }
  }
}

/**
 * 監督交代・後任スカウトモーダルを開く
 */
function openManagerHireModal() {
  const modal = document.getElementById('manager-hire-modal');
  const body = document.getElementById('manager-modal-body');
  const titleEl = document.getElementById('manager-modal-title');
  if (!modal || !body) return;

  const club = getPlayerClub();
  const currentMgr = club ? club.manager : null;
  const buyoutFee = currentMgr ? getManagerBuyoutFee(currentMgr) : 0;

  if (titleEl) {
    titleEl.textContent = currentMgr ? '監督交代・後任スカウト' : '新監督招聘・スカウト';
  }

  const freeList = (gameState.freeManagers || []).map(m => typeof ensureManagerRankAndStats === 'function' ? ensureManagerRankAndStats(m) : m);
  if (freeList.length === 0) {
    body.innerHTML = `
      <div class="mono text-muted" style="padding: 30px 20px; text-align: center;">
        現在スカウト可能なフリー監督候補がいません。
      </div>
    `;
  } else {
    const clubRep = club ? (club.reputation || 4000) : 4000;
    let specFilter = 'ALL';

    const renderList = () => {
      const avgOf = (m) => {
        const s = m.stats || { tactics: 70, motivation: 70, development: 70, discipline: 70 };
        return s.tactics + s.motivation + s.development + s.discipline;
      };
      const filtered = freeList
        .filter(c => specFilter === 'ALL' || (c.specialty || '') === specFilter)
        .sort((a, b) => avgOf(b) - avgOf(a) || (b.weeklyWage || 0) - (a.weeklyWage || 0));

      const noteHtml = `
        <div class="ui-plate-grid cols-2" style="margin-bottom: 10px;">
          <div class="ui-stat-plate is-highlight">
            <span class="ui-plate-label">現クラブ格 (Rep)</span>
            <span class="ui-plate-val accent-green">${clubRep}</span>
          </div>
          <div class="ui-stat-plate ${currentMgr ? 'is-gold' : ''}">
            <span class="ui-plate-label">${currentMgr ? `前任解任違約金 (${currentMgr.name})` : '提示契約年数'}</span>
            <span class="ui-plate-val ${currentMgr ? 'accent-gold' : ''}">${currentMgr ? `£${buyoutFee.toLocaleString()}k` : '3年'}</span>
          </div>
        </div>
      `;

      const specList = ['ALL', '戦術の鬼', '人心掌握', '育成の名匠', '規律重視'];
      const filterHtml = `
        <div class="mgr-filter-bar">
          ${specList.map(sp => `
            <button type="button" class="btn btn-sm mono ${specFilter === sp ? 'btn-primary' : 'btn-secondary'} btn-mgr-rank-filter" data-spec="${sp}">
              ${sp === 'ALL' ? `すべて (${freeList.length})` : `${sp} (${freeList.filter(x => x.specialty === sp).length})`}
            </button>
          `).join('')}
        </div>
      `;

      const cardsHtml = `
        <div style="display: flex; flex-direction: column; margin-top: 2px;">
          ${filtered.map(cand => {
            const tacticLabel = getManagerTacticLabel(cand.preferredTactic);
            const cAvatar = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(cand, 'avatar-md', 42) : '';
            const eff = typeof getManagerRankEffects === 'function' ? getManagerRankEffects(cand) : { minReputation: 0 };
            const repBlocked = clubRep < (eff.minReputation || 0);
            const st = cand.stats || { tactics: 70, motivation: 70, development: 70, discipline: 70 };
            const rTac = getStaffStatRank(st.tactics);
            const rMot = getStaffStatRank(st.motivation);
            const rDev = getStaffStatRank(st.development);
            const rDis = getStaffStatRank(st.discipline);
            return `
              <div class="manager-candidate-card" style="display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                  <div class="candidate-avatar">${cAvatar}</div>
                  <div style="flex:1; min-width:0;">
                    <div class="flat-row-title" style="font-size:14.5px; line-height:1.25;">${cand.name}</div>
                    <div class="flat-row-meta mono" style="margin-top:2px;">
                      ${cand.nationality} · ${cand.age}歳
                    </div>
                  </div>
                  <button type="button" class="btn btn-hire-manager mono" data-manager-id="${cand.id}" ${repBlocked ? 'disabled' : ''} style="font-weight: 700; padding: 6px 12px; font-size: 11.5px; white-space: nowrap; flex-shrink: 0;">
                    ${repBlocked ? `要Rep ${eff.minReputation}` : (currentMgr ? '交代' : '招聘')}
                  </button>
                </div>
                <div class="flat-row-meta mono" style="display:flex; align-items:center; flex-wrap:wrap; gap:6px 10px;">
                  <span class="staff-specialty-tag">${cand.specialty || 'バランス型'}</span>
                  <strong class="accent-gold wage-nowrap">£${cand.weeklyWage}k/週</strong>
                  ${eff.minReputation > 0 ? `<span class="wage-nowrap" style="color:#cbd5e1;">Rep ${eff.minReputation}</span>` : ''}
                  <span class="wage-nowrap"><strong style="color:#38bdf8;">${cand.preferredFormation}</strong> · <strong class="accent-green">${tacticLabel}</strong></span>
                </div>
                <div class="staff-stats-chips" style="margin-top:0;">
                  <span class="staff-stat-chip stat-rank-${rTac}">戦術眼 <strong>${rTac}</strong></span>
                  <span class="staff-stat-chip stat-rank-${rMot}">人心掌握 <strong>${rMot}</strong></span>
                  <span class="staff-stat-chip stat-rank-${rDev}">育成手腕 <strong>${rDev}</strong></span>
                  <span class="staff-stat-chip stat-rank-${rDis}">規律管理 <strong>${rDis}</strong></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.innerHTML = noteHtml + filterHtml + cardsHtml;

      body.querySelectorAll('.btn-mgr-rank-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          specFilter = e.currentTarget.dataset.spec || 'ALL';
          renderList();
        });
      });

      body.querySelectorAll('.btn-hire-manager').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mid = e.currentTarget.dataset.managerId;
          if (mid) {
            const success = hireNewManager(mid);
            if (success) closeManagerHireModal();
          }
        });
      });
    };

    renderList();
  }

  modal.classList.remove('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
}

/**
 * 監督交代・後任スカウトモーダルを閉じる
 */
function closeManagerHireModal() {
  const modal = document.getElementById('manager-hire-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
}

/**
 * 監督を解任する
 */
function sackCurrentManager() {
  const club = getPlayerClub();
  if (!club || !club.manager) return false;
  const fee = getManagerBuyoutFee(club.manager);
  if (club.funds < fee) {
    alert(`資金不足です。解任違約金 £${fee.toLocaleString()}k を支払えません。`);
    return false;
  }
  if (!confirm(`${club.manager.name}監督を解任しますか？\n解任違約金 £${fee.toLocaleString()}k がクラブ資金から引き落とされます。`)) {
    return false;
  }
  club.funds -= fee;
  const sacked = club.manager;
  club.manager = null;
  sacked.trust = 70;
  if (!gameState.freeManagers) gameState.freeManagers = [];
  gameState.freeManagers.push(sacked);

  addDailyLog(`[監督人事] ${sacked.name}監督を解任しました（違約金: £${fee.toLocaleString()}k）`);
  renderAll();
  return true;
}

/**
 * 後任監督を招聘する
 */
function hireNewManager(managerId) {
  const club = getPlayerClub();
  if (!club) return false;
  const idx = (gameState.freeManagers || []).findIndex(m => m.id === managerId);
  if (idx === -1) return false;

  const newMgr = gameState.freeManagers[idx];
  const oldMgr = club.manager;
  let buyoutMsg = '';

  if (oldMgr) {
    const fee = getManagerBuyoutFee(oldMgr);
    if (club.funds < fee) {
      alert(`資金不足です。現任監督の解任違約金 £${fee.toLocaleString()}k を支払えません。`);
      return false;
    }
    const ok = window.confirm(`${oldMgr.name}監督を解任し、${newMgr.name}氏を新監督として招聘しますか？\n（前任違約金: £${fee.toLocaleString()}k / 新監督週給: £${newMgr.weeklyWage}k）`);
    if (!ok) return false;

    gameState.freeManagers.splice(idx, 1);
    club.funds -= fee;
    oldMgr.trust = 70;
    gameState.freeManagers.push(oldMgr);
    buyoutMsg = `（前任違約金 £${fee.toLocaleString()}k 支払）`;
  } else {
    const ok = window.confirm(`${newMgr.name}氏を新監督として招聘しますか？\n（契約期間: 3年 / 週給: £${newMgr.weeklyWage}k）`);
    if (!ok) return false;
    gameState.freeManagers.splice(idx, 1);
  }

  newMgr.trust = 80;
  newMgr.contractYears = 3;
  club.manager = newMgr;

  // 新監督の得意陣形・戦術に初期同期
  club.formation = newMgr.preferredFormation;
  club.tactic = normalizeTacticKey(newMgr.preferredTactic);
  if (typeof assignStartersToFormationSlots === 'function') {
    assignStartersToFormationSlots(club, true);
  }

  const tacticLabel = getManagerTacticLabel(newMgr.preferredTactic);
  addDailyLog(`${newMgr.name}監督が新監督として就任しました ${buyoutMsg}（得意: ${newMgr.preferredFormation} / ${tacticLabel}）`);
  const newMgrWish = typeof generateAndSendManagerWishReport === 'function'
    ? generateAndSendManagerWishReport(`${newMgr.name}監督 就任時`)
    : null;
  if (typeof addNewsItem === 'function') {
    addNewsItem({
      category: '監督',
      headline: `${club.name}の新監督に${newMgr.name}氏が就任`,
      body: `${club.name}は${newMgr.name}氏（得意: ${newMgr.preferredFormation} / ${tacticLabel}）を新指揮官として迎え入れた。`,
      highlight: true
    });
  }
  renderAll();
  if (typeof showSecretaryModal === 'function') {
    const wishPos = newMgrWish && Array.isArray(newMgrWish.positions) && newMgrWish.positions.length > 0
      ? newMgrWish.positions.join('・')
      : 'スカッド全体の調整';
    showSecretaryModal({
      topic: '新監督就任報告',
      title: `${newMgr.name} 監督が就任`,
      speech: `GM、${newMgr.name}監督（得意: ${newMgr.preferredFormation} / ${tacticLabel}）との契約が完了しました。新体制の初動として「${wishPos}」の補強要望を受け取っています。`,
      detailHtml: buildWishModalDetailHtml(club, newMgrWish),
      actions: [
        {
          label: '移籍市場を見る',
          className: 'btn btn-secondary',
          onClick: () => { if (typeof switchTab === 'function') switchTab('market'); }
        },
        {
          label: '承知した',
          className: 'btn btn-primary',
          onClick: () => { if (typeof renderAll === 'function') renderAll(); }
        }
      ]
    });
  }
  return true;
}


/**
 * 経営タブの「指導陣（COACHING STAFF / 全6枠）」パネルを描画
 */
function renderCoachingStaffPanel() {
  const container = document.getElementById('coach-panel-body');
  if (!container) return;
  const club = getPlayerClub();
  if (!club) return;
  ensureClubCoaches(club);

  const coaches = club.coaches;
  const countEl = document.getElementById('coach-panel-count');
  const wageEl = document.getElementById('coach-panel-wage');

  // 体制数カウント（最大6）
  let totalHired = 0;
  if (Array.isArray(coaches.attacking)) totalHired += coaches.attacking.length;
  if (Array.isArray(coaches.defending)) totalHired += coaches.defending.length;
  if (coaches.goalkeeping) totalHired += 1;
  if (coaches.fitness) totalHired += 1;

  const totalWage = getClubCoachingStaffWeeklyWage(club);

  if (countEl) countEl.textContent = `${totalHired} / 6枠`;
  if (wageEl) wageEl.textContent = `£${totalWage}k/週`;

  // 全6スロットの定義（オフェンス2、ディフェンス2、GK1、フィジカル1）
  const slotsConfig = [
    { category: 'attacking', roleLabel: 'オフェンス', index: 0, coach: (coaches.attacking || [])[0] || null, effectDesc: '前線崩し・決定力の向上と攻撃陣育成' },
    { category: 'attacking', roleLabel: 'オフェンス', index: 1, coach: (coaches.attacking || [])[1] || null, effectDesc: '前線崩し・決定力の向上と攻撃陣育成' },
    { category: 'defending', roleLabel: 'ディフェンス', index: 0, coach: (coaches.defending || [])[0] || null, effectDesc: '最終ライン統率・守備ブロック強化' },
    { category: 'defending', roleLabel: 'ディフェンス', index: 1, coach: (coaches.defending || [])[1] || null, effectDesc: '最終ライン統率・守備ブロック強化' },
    { category: 'goalkeeping', roleLabel: 'GK', index: 0, coach: coaches.goalkeeping || null, effectDesc: '至近距離反応・セービング安定化' },
    { category: 'fitness', roleLabel: 'フィジカル', index: 0, coach: coaches.fitness || null, effectDesc: 'コンディション維持・負傷予防と回復促進' }
  ];

  let slotsHtml = slotsConfig.map((slot) => {
    const c = slot.coach;
    const catClass = `tag-${slot.category}`;
    if (c) {
      if (typeof ensureCoachStats === 'function') ensureCoachStats(c);
      const avatarHtml = typeof getCoachAvatarHtml === 'function' ? getCoachAvatarHtml(c, 'avatar-md', 38) : '';
      const cst = c.stats || { coaching: 70, youthDev: 70, analysis: 70 };
      const rC = getStaffStatRank(cst.coaching);
      const rY = getStaffStatRank(cst.youthDev);
      const rA = getStaffStatRank(cst.analysis);
      return `
        <div class="coach-slot-card occupied">
          <div class="coach-slot-head">
            <span class="coach-role-tag ${catClass} mono">[${slot.roleLabel}]</span>
            <span class="staff-specialty-tag">${c.specialty || '実戦指導型'}</span>
          </div>
          <div class="coach-slot-main">
            <div class="coach-avatar-wrap">
              ${avatarHtml}
            </div>
            <div class="coach-info">
              <div class="coach-name font-bold">${c.name}</div>
              <div class="coach-wage-meta mono">
                <span class="accent-gold font-bold">£${c.weeklyWage}k/週</span>
                <span class="text-muted">(${c.nationality}/${c.age}歳)</span>
              </div>
              <div class="staff-stats-chips">
                <span class="staff-stat-chip stat-rank-${rC}">指導 <strong>${rC}</strong></span>
                <span class="staff-stat-chip stat-rank-${rY}">育成 <strong>${rY}</strong></span>
                <span class="staff-stat-chip stat-rank-${rA}">分析 <strong>${rA}</strong></span>
              </div>
              <div class="coach-effect-note mono">${slot.effectDesc}</div>
            </div>
          </div>
          <div class="coach-slot-actions">
            <button type="button" class="btn btn-secondary btn-sm mono btn-replace-coach" data-category="${slot.category}" data-index="${slot.index}">交代</button>
            <button type="button" class="btn btn-danger-outline btn-sm mono btn-sack-coach" data-category="${slot.category}" data-index="${slot.index}">解任</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="coach-slot-card vacant">
          <div class="coach-slot-head" style="width: 100%;">
            <span class="coach-role-tag ${catClass} mono text-muted">[${slot.roleLabel} (空席)]</span>
          </div>
          <div style="margin: 8px 0; font-size: 11px;" class="text-muted mono">${slot.effectDesc}</div>
          <button type="button" class="btn btn-hire-coach-slot mono" data-category="${slot.category}" data-index="${slot.index}">
            ＋ コーチを招聘
          </button>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `<div class="coaching-slots-grid">${slotsHtml}</div>`;

  // イベント登録
  container.querySelectorAll('.btn-hire-coach-slot, .btn-replace-coach').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      openCoachHireModal(cat, idx);
    });
  });

  container.querySelectorAll('.btn-sack-coach').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      sackCoach(cat, idx);
    });
  });
}

function openCoachHireModal(category, slotIndex) {
  const modal = document.getElementById('coach-hire-modal');
  const body = document.getElementById('coach-modal-body');
  const title = document.getElementById('coach-modal-title');
  const tag = document.getElementById('coach-modal-tag');
  if (!modal || !body) return;

  const roleLabels = { attacking: 'オフェンス', defending: 'ディフェンス', goalkeeping: 'GK', fitness: 'フィジカル' };
  const label = roleLabels[category] || category;

  if (title) title.textContent = `[${label}コーチ] 招聘・交代`;
  if (tag) tag.textContent = `[${label.toUpperCase()} COACH]`;

  if (!gameState.freeCoaches) gameState.freeCoaches = {};
  if (!Array.isArray(gameState.freeCoaches[category])) {
    gameState.freeCoaches[category] = (COACHES_DATABASE[category] || []).slice(1).map(d => createCoach(d, category));
  }

  const club = getPlayerClub();
  const clubRep = club ? (club.reputation || 4000) : 4000;
  const list = (gameState.freeCoaches[category] || []).map(c => typeof ensureCoachStats === 'function' ? ensureCoachStats(c) : c);
  if (list.length === 0) {
    body.innerHTML = `
      <div class="mono text-muted text-center" style="padding: 24px;">
        現在、招聘可能なフリーの${label}コーチ候補がいません。
      </div>
    `;
    modal.classList.remove('hidden');
    if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
  } else {
    let coachSpecFilter = 'ALL';
    const renderCoachList = () => {
      const filtered = list
        .filter(c => coachSpecFilter === 'ALL' || (c.specialty || '') === coachSpecFilter)
        .sort((a, b) => {
          const sa = a.stats || { coaching: 70, youthDev: 70, analysis: 70 };
          const sb = b.stats || { coaching: 70, youthDev: 70, analysis: 70 };
          return (sb.coaching + sb.youthDev + sb.analysis) - (sa.coaching + sa.youthDev + sa.analysis);
        });
      const specs = ['ALL', '実戦指導型', '若手育成型', '戦術分析型'];
      const filterBar = `
        <div class="mgr-filter-bar" style="margin-top:0;">
          ${specs.map(sp => `
            <button type="button" class="btn btn-sm mono ${coachSpecFilter === sp ? 'btn-primary' : 'btn-secondary'} btn-coach-spec-filter" data-spec="${sp}">
              ${sp === 'ALL' ? `すべて (${list.length})` : `${sp} (${list.filter(x => x.specialty === sp).length})`}
            </button>
          `).join('')}
        </div>
      `;
      const cards = filtered.map(c => {
        const avatarHtml = typeof getCoachAvatarHtml === 'function' ? getCoachAvatarHtml(c, 'avatar-md', 38) : '';
        const cst = c.stats || { coaching: 70, youthDev: 70, analysis: 70 };
        const avgStat = (cst.coaching + cst.youthDev + cst.analysis) / 3;
        const reqRep = avgStat >= 80 ? 5200 : (avgStat >= 72 ? 3800 : 0);
        const repBlocked = clubRep < reqRep;
        const rC = getStaffStatRank(cst.coaching);
        const rY = getStaffStatRank(cst.youthDev);
        const rA = getStaffStatRank(cst.analysis);
        return `
          <div class="coach-candidate-card">
            <div class="coach-cand-left">
              <div class="coach-avatar-wrap">${avatarHtml}</div>
              <div class="coach-cand-info">
                <div class="coach-cand-name-row">
                  <strong class="coach-name">${c.name}</strong>
                  <span class="staff-specialty-tag">${c.specialty || '実戦指導型'}</span>
                  <span class="accent-gold mono" style="font-size: 11px;">£${c.weeklyWage}k/週 ${reqRep > 0 ? `(要Rep ${reqRep})` : ''}</span>
                </div>
                <div class="coach-cand-meta mono text-muted" style="font-size: 10px;">${c.nationality} / ${c.age}歳</div>
                <div class="staff-stats-chips">
                  <span class="staff-stat-chip stat-rank-${rC}">指導 <strong>${rC}</strong></span>
                  <span class="staff-stat-chip stat-rank-${rY}">育成 <strong>${rY}</strong></span>
                  <span class="staff-stat-chip stat-rank-${rA}">分析 <strong>${rA}</strong></span>
                </div>
                <div class="coach-cand-bio">${c.bio}</div>
              </div>
            </div>
            <div>
              <button type="button" class="btn btn-sign-coach mono" data-coach-id="${c.id}" data-category="${category}" data-index="${slotIndex}" ${repBlocked ? 'disabled' : ''}>
                ${repBlocked ? `格不足(Rep ${reqRep})` : '契約する'}
              </button>
            </div>
          </div>
        `;
      }).join('');
      body.innerHTML = filterBar + cards;
      body.querySelectorAll('.btn-coach-spec-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          coachSpecFilter = e.currentTarget.dataset.spec || 'ALL';
          renderCoachList();
        });
      });
      body.querySelectorAll('.btn-sign-coach').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cid = e.currentTarget.dataset.coachId;
          const cat = e.currentTarget.dataset.category;
          const sIdx = parseInt(e.currentTarget.dataset.index, 10);
          hireCoach(cat, sIdx, cid);
          closeCoachHireModal();
        });
      });
    };
    renderCoachList();
    modal.classList.remove('hidden');
    if (typeof setBodyModalLock === 'function') setBodyModalLock(true);
  }
}

function closeCoachHireModal() {
  const modal = document.getElementById('coach-hire-modal');
  if (modal) modal.classList.add('hidden');
  if (typeof setBodyModalLock === 'function') setBodyModalLock(false);
}

function hireCoach(category, slotIndex, coachId) {
  const club = getPlayerClub();
  if (!club) return;
  ensureClubCoaches(club);

  if (!gameState.freeCoaches || !Array.isArray(gameState.freeCoaches[category])) return;
  const cIdx = gameState.freeCoaches[category].findIndex(c => c.id === coachId);
  if (cIdx === -1) return;

  const newCoach = gameState.freeCoaches[category].splice(cIdx, 1)[0];

  let oldCoach = null;
  if (category === 'attacking' || category === 'defending') {
    if (club.coaches[category][slotIndex]) {
      oldCoach = club.coaches[category][slotIndex];
      club.coaches[category][slotIndex] = newCoach;
    } else {
      club.coaches[category].push(newCoach);
    }
  } else {
    oldCoach = club.coaches[category];
    club.coaches[category] = newCoach;
  }

  if (oldCoach) {
    gameState.freeCoaches[category].push(oldCoach);
    addDailyLog(`[指導陣交代] ${oldCoach.name}コーチとの契約を終了し、${newCoach.name}コーチ（${newCoach.specialty || '専門'}）と新規契約しました（週給: £${newCoach.weeklyWage}k）`);
  } else {
    addDailyLog(`[指導陣招聘] ${newCoach.name}コーチ（${newCoach.roleLabel} / ${newCoach.specialty || '専門'}）と新規契約しました（週給: £${newCoach.weeklyWage}k）`);
  }

  renderAll();
}

function sackCoach(category, slotIndex) {
  const club = getPlayerClub();
  if (!club) return;
  ensureClubCoaches(club);

  let targetCoach = null;
  if (category === 'attacking' || category === 'defending') {
    targetCoach = club.coaches[category][slotIndex];
    if (!targetCoach) return;
    if (!confirm(`${targetCoach.name}コーチ（${targetCoach.roleLabel}）を解任しますか？`)) return;
    club.coaches[category].splice(slotIndex, 1);
  } else {
    targetCoach = club.coaches[category];
    if (!targetCoach) return;
    if (!confirm(`${targetCoach.name}コーチ（${targetCoach.roleLabel}）を解任しますか？`)) return;
    club.coaches[category] = null;
  }

  if (!gameState.freeCoaches) gameState.freeCoaches = {};
  if (!Array.isArray(gameState.freeCoaches[category])) gameState.freeCoaches[category] = [];
  gameState.freeCoaches[category].push(targetCoach);

  addDailyLog(`[指導陣解任] ${targetCoach.name}コーチ（${targetCoach.roleLabel}）を解任しました。`);
  renderAll();
}

/**
 * プレシーズン開幕前：指導陣編成モーダル（監督・初期コーチ選定）を開く
 */
function openInitialStaffSetupModal(club) {
  const modal = document.getElementById('initial-staff-setup-modal');
  const body = document.getElementById('staff-setup-body');
  const confirmBtn = document.getElementById('btn-confirm-initial-staff');
  if (!modal || !body) return;

  const usedNames = new Set();
  (club.players || []).forEach(p => { usedNames.add(p.name); });

  // 選択クラブの格(reputation)・戦力(basePower)・ディビジョンに応じた候補の強さスケーリング
  const isD2Club = Boolean(club && (club.division === 'd2' || String(club.id || '').startsWith('c')));
  const clubRep = club ? (club.reputation || (club.basePower ? club.basePower * 80 : 4500)) : 4500;
  const clubPower = club ? (club.basePower || 65) : 65;

  // 全体水準は同等で「尖っている能力が異なる」トレードオフ型プロファイル（S/A/B, S/S/C, A/S/B 等）
  let mgrProfiles = [];
  let coachProfiles = [];
  let baseMgrWage = 62;
  let baseCoachWage = 20;

  if (!isD2Club && (clubRep >= 6600 || clubPower >= 73)) {
    baseMgrWage = 115;
    baseCoachWage = 32;
    mgrProfiles = [
      { focus: 'tactics', rank: 'S', stats: { tactics: 92, motivation: 81, development: 72, discipline: 79 } },     // S/A/B/A
      { focus: 'motivation', rank: 'S', stats: { tactics: 80, motivation: 93, development: 89, discipline: 62 } },  // A/S/S/C
      { focus: 'development', rank: 'S', stats: { tactics: 73, motivation: 80, development: 92, discipline: 81 } }, // B/A/S/A
      { focus: 'discipline', rank: 'S', stats: { tactics: 89, motivation: 63, development: 79, discipline: 91 } }   // S/C/A/S
    ];
    coachProfiles = [
      { focus: 'coaching', rank: 'A', stats: { coaching: 90, youthDev: 72, analysis: 81 } }, // S/B/A
      { focus: 'youthDev', rank: 'A', stats: { coaching: 71, youthDev: 91, analysis: 82 } }, // B/S/A
      { focus: 'analysis', rank: 'A', stats: { coaching: 89, youthDev: 61, analysis: 90 } }  // S/C/S
    ];
  } else if (!isD2Club && (clubRep >= 5200 || clubPower >= 68)) {
    baseMgrWage = 86;
    baseCoachWage = 25;
    mgrProfiles = [
      { focus: 'tactics', rank: 'A', stats: { tactics: 89, motivation: 72, development: 56, discipline: 79 } },     // S/B/D/A
      { focus: 'motivation', rank: 'A', stats: { tactics: 73, motivation: 90, development: 79, discipline: 55 } },  // B/S/A/D
      { focus: 'development', rank: 'A', stats: { tactics: 63, motivation: 78, development: 89, discipline: 72 } }, // C/A/S/B
      { focus: 'discipline', rank: 'A', stats: { tactics: 80, motivation: 54, development: 71, discipline: 89 } }   // A/D/B/S
    ];
    coachProfiles = [
      { focus: 'coaching', rank: 'A', stats: { coaching: 89, youthDev: 55, analysis: 73 } }, // S/D/B
      { focus: 'youthDev', rank: 'A', stats: { coaching: 73, youthDev: 89, analysis: 61 } }, // B/S/C
      { focus: 'analysis', rank: 'A', stats: { coaching: 80, youthDev: 71, analysis: 81 } }  // A/B/A
    ];
  } else if (!isD2Club && (clubRep >= 3800 || clubPower >= 59)) {
    baseMgrWage = 62;
    baseCoachWage = 18;
    mgrProfiles = [
      { focus: 'tactics', rank: 'B', stats: { tactics: 82, motivation: 69, development: 54, discipline: 71 } },     // A/B/D/B
      { focus: 'motivation', rank: 'B', stats: { tactics: 56, motivation: 83, development: 71, discipline: 68 } },  // D/A/B/B
      { focus: 'development', rank: 'B', stats: { tactics: 70, motivation: 55, development: 84, discipline: 69 } }, // B/D/A/B
      { focus: 'discipline', rank: 'B', stats: { tactics: 72, motivation: 70, development: 52, discipline: 83 } }   // B/B/D/A
    ];
    coachProfiles = [
      { focus: 'coaching', rank: 'B', stats: { coaching: 82, youthDev: 53, analysis: 69 } }, // A/D/B
      { focus: 'youthDev', rank: 'B', stats: { coaching: 69, youthDev: 83, analysis: 54 } }, // B/A/D
      { focus: 'analysis', rank: 'B', stats: { coaching: 59, youthDev: 70, analysis: 82 } }  // C/B/A
    ];
  } else {
    baseMgrWage = 40;
    baseCoachWage = 12;
    mgrProfiles = [
      { focus: 'tactics', rank: 'C', stats: { tactics: 74, motivation: 59, development: 46, discipline: 64 } },     // B/C/E/C
      { focus: 'motivation', rank: 'C', stats: { tactics: 51, motivation: 75, development: 68, discipline: 45 } },  // D/B/B/E
      { focus: 'development', rank: 'C', stats: { tactics: 65, motivation: 47, development: 75, discipline: 59 } }, // C/E/B/C
      { focus: 'discipline', rank: 'C', stats: { tactics: 56, motivation: 68, development: 45, discipline: 74 } }   // D/B/E/B
    ];
    coachProfiles = [
      { focus: 'coaching', rank: 'C', stats: { coaching: 74, youthDev: 46, analysis: 61 } }, // B/E/C
      { focus: 'youthDev', rank: 'C', stats: { coaching: 53, youthDev: 75, analysis: 47 } }, // D/B/E
      { focus: 'analysis', rank: 'C', stats: { coaching: 61, youthDev: 52, analysis: 74 } }  // C/D/B
    ];
  }

  const tacticPool = [
    { formation: '4-3-3', tactic: 'gegenpress', label: 'ゲーゲンプレス' },
    { formation: '4-2-3-1', tactic: 'possession', label: 'ポゼッション' },
    { formation: '3-5-2', tactic: 'counter', label: 'カウンター' },
    { formation: '4-4-2', tactic: 'wingplay', label: 'ワイドアタック' },
    { formation: '5-3-2', tactic: 'parkthebus', label: 'ウルトラディフェンス' }
  ];
  const shuffledTactics = [...tacticPool].sort(() => Math.random() - 0.5).slice(0, 4);
  const shuffledMgrProfiles = [...mgrProfiles].sort(() => Math.random() - 0.5);

  const managerCandidates = shuffledMgrProfiles.map((prof, i) => {
    const cfg = shuffledTactics[i];
    const nat = ['Spain', 'Germany', 'England', 'Portugal', 'Italy'][i % 5];
    const mgrObj = typeof createManager === 'function'
      ? createManager({
          nationality: nat,
          age: 39 + randInt(0, 18),
          rank: prof.rank,
          focus: prof.focus,
          stats: prof.stats,
          preferredFormation: cfg.formation,
          preferredTactic: cfg.tactic,
          weeklyWage: baseMgrWage + randInt(-4, 5),
          trust: 85,
          contractYears: 3
        }, club.id, usedNames)
      : { id: `mgr_init_${i}`, name: 'M. Keller', nationality: nat, age: 44, rank: prof.rank, stats: prof.stats, preferredFormation: cfg.formation, preferredTactic: cfg.tactic, weeklyWage: baseMgrWage, trust: 85, contractYears: 3 };
    mgrObj.tacticLabel = cfg.label;
    return mgrObj;
  });

  // 4部門それぞれの初期コーチ候補（同水準・異なる尖り方を持つ3名を選択可能にする）
  const buildCoachCandidates = (cat) => {
    const db = (typeof COACHES_DATABASE !== 'undefined' && Array.isArray(COACHES_DATABASE[cat])) ? COACHES_DATABASE[cat] : [];
    const shuffledProfs = [...coachProfiles].sort(() => Math.random() - 0.5);
    return shuffledProfs.map((prof, idx) => {
      const exactMatch = db.find(d => d.focus === prof.focus) || db[idx % Math.max(1, db.length)] || { nationality: 'England', age: 46 };
      return createCoach({
        ...exactMatch,
        rank: prof.rank,
        focus: prof.focus,
        stats: prof.stats,
        weeklyWage: baseCoachWage + randInt(-2, 3)
      }, cat, usedNames);
    });
  };
  const coachCandidates = {
    attacking: buildCoachCandidates('attacking'),
    defending: buildCoachCandidates('defending'),
    goalkeeping: buildCoachCandidates('goalkeeping'),
    fitness: buildCoachCandidates('fitness')
  };

  window._preseasonStaffSetup = {
    step: 1,
    selectedManagerIdx: 0,
    selectedSecretaryId: gameState.secretaryId || 'sec_claire',
    selectedCoachIdx: { attacking: 0, defending: 0, goalkeeping: 0, fitness: 0 },
    candidates: managerCandidates,
    coachCandidates,
    club: club
  };

  const renderModalContent = () => {
    const state = window._preseasonStaffSetup;
    const titleEl = document.getElementById('staff-setup-title');
    if (state.step === 1) {
      if (titleEl) titleEl.textContent = '担当秘書の選任 (1 / 3)';
      const secretaries = typeof SECRETARIES_DATABASE !== 'undefined' && Array.isArray(SECRETARIES_DATABASE)
        ? SECRETARIES_DATABASE
        : [];
      const secretariesHtml = secretaries.map(sec => buildSecretarySelectRowHtml(
        sec,
        sec.id === state.selectedSecretaryId,
        'data-init-sec-id',
        52
      )).join('');

      body.innerHTML = `
        <div class="flat-section-label mono">サポート秘書</div>
        <div style="display: flex; flex-direction: column;">${secretariesHtml}</div>
      `;
      if (confirmBtn) confirmBtn.textContent = '次へ：監督を選ぶ ▶';
      if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(body);

      body.querySelectorAll('[data-init-sec-id]').forEach(row => {
        row.addEventListener('click', (e) => {
          state.selectedSecretaryId = e.currentTarget.dataset.initSecId;
          renderModalContent();
        });
      });
    } else if (state.step === 2) {
      if (titleEl) titleEl.textContent = '監督の選任 (2 / 3)';
      const managersHtml = state.candidates.map((m, idx) => {
        const isSelected = idx === state.selectedManagerIdx;
        const avatarHtml = typeof getManagerAvatarHtml === 'function' ? getManagerAvatarHtml(m, 'avatar-md', 44) : '';
        const mst = m.stats || { tactics: 70, motivation: 70, development: 70, discipline: 70 };
        const rTac = getStaffStatRank(mst.tactics);
        const rMot = getStaffStatRank(mst.motivation);
        const rDev = getStaffStatRank(mst.development);
        const rDis = getStaffStatRank(mst.discipline);
        return `
          <div class="staff-candidate-card ${isSelected ? 'selected' : ''}" data-mgr-index="${idx}" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div class="staff-avatar-wrap" style="flex-shrink: 0;">${avatarHtml}</div>
            <div style="flex: 1; min-width: 0;">
              <div class="flat-row-header">
                <div class="flat-row-title-wrap">
                  <span class="flat-row-title" style="color: ${isSelected ? 'var(--accent-green)' : '#ffffff'};">${m.name}</span>
                  <span class="staff-specialty-tag">${m.specialty || 'バランス型'}</span>
                </div>
                <span class="mono accent-gold font-bold flat-row-wage" style="font-size: 12px;">£${m.weeklyWage}k/週</span>
              </div>
              <div class="flat-row-meta mono">
                ${m.nationality} · ${m.age}歳 · <span style="color:#38bdf8;">${m.preferredFormation}</span> · <span style="color:#2ecc71;">${m.tacticLabel}</span>
              </div>
              <div class="staff-stats-chips">
                <span class="staff-stat-chip stat-rank-${rTac}">戦術眼 <strong>${rTac}</strong></span>
                <span class="staff-stat-chip stat-rank-${rMot}">人心掌握 <strong>${rMot}</strong></span>
                <span class="staff-stat-chip stat-rank-${rDev}">育成手腕 <strong>${rDev}</strong></span>
                <span class="staff-stat-chip stat-rank-${rDis}">規律管理 <strong>${rDis}</strong></span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span class="flat-section-label mono" style="margin:0;">ヘッドコーチ（監督）</span>
          <button type="button" class="btn btn-secondary btn-sm mono" id="btn-back-to-sec-step">◀ 秘書選択へ戻る</button>
        </div>
        <div style="display: flex; flex-direction: column;">${managersHtml}</div>
      `;
      if (confirmBtn) confirmBtn.textContent = '次へ：コーチを選ぶ ▶';
      if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(body);

      const backToSecBtn = document.getElementById('btn-back-to-sec-step');
      if (backToSecBtn) {
        backToSecBtn.addEventListener('click', () => {
          state.step = 1;
          renderModalContent();
        });
      }
      body.querySelectorAll('.staff-candidate-card').forEach(card => {
        card.addEventListener('click', (e) => {
          state.selectedManagerIdx = parseInt(e.currentTarget.dataset.mgrIndex, 10);
          renderModalContent();
        });
      });
    } else {
      if (titleEl) titleEl.textContent = 'コーチの選任 (3 / 3)';
      const catMeta = [
        { cat: 'attacking', role: 'オフェンスコーチ' },
        { cat: 'defending', role: 'ディフェンスコーチ' },
        { cat: 'goalkeeping', role: 'GKコーチ' },
        { cat: 'fitness', role: 'フィジカルコーチ' }
      ];
      const sectionsHtml = catMeta.map(({ cat, role }) => {
        const list = state.coachCandidates[cat] || [];
        const selIdx = state.selectedCoachIdx[cat] || 0;
        const cards = list.map((c, idx) => {
          const isSel = idx === selIdx;
          const cst = c.stats || { coaching: 70, youthDev: 70, analysis: 70 };
          const rC = getStaffStatRank(cst.coaching);
          const rY = getStaffStatRank(cst.youthDev);
          const rA = getStaffStatRank(cst.analysis);
          return `
            <div class="initial-coach-choice ${isSel ? 'selected' : ''}" data-coach-cat="${cat}" data-coach-idx="${idx}" style="cursor:pointer;">
              <div class="flat-row-header">
                <div class="flat-row-title-wrap">
                  <strong class="flat-row-title" style="font-size:13px; color:${isSel ? 'var(--accent-green)' : '#fff'};">${c.name}</strong>
                  <span class="staff-specialty-tag">${c.specialty}</span>
                </div>
                <span class="mono accent-gold font-bold flat-row-wage" style="font-size:11.5px;">£${c.weeklyWage}k/週</span>
              </div>
              <div class="flat-row-meta mono" style="font-size:10.5px;">${c.nationality} · ${c.age}歳</div>
              <div class="staff-stats-chips" style="margin-top:4px;">
                <span class="staff-stat-chip stat-rank-${rC}">指導 <strong>${rC}</strong></span>
                <span class="staff-stat-chip stat-rank-${rY}">育成 <strong>${rY}</strong></span>
                <span class="staff-stat-chip stat-rank-${rA}">分析 <strong>${rA}</strong></span>
              </div>
            </div>
          `;
        }).join('');
        return `
          <div style="margin-bottom: 10px;">
            <div class="flat-section-label mono">${role}</div>
            <div style="display:flex; flex-direction:column;">${cards}</div>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:4px;">
          <button type="button" class="btn btn-secondary btn-sm mono" id="btn-back-to-mgr-step">◀ 監督選択へ戻る</button>
        </div>
        ${sectionsHtml}
      `;
      if (confirmBtn) confirmBtn.textContent = '指導体制を確定して開幕へ';

      const backBtn = document.getElementById('btn-back-to-mgr-step');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          state.step = 2;
          renderModalContent();
        });
      }
      body.querySelectorAll('.initial-coach-choice').forEach(el => {
        el.addEventListener('click', (e) => {
          const cat = e.currentTarget.dataset.coachCat;
          const idx = parseInt(e.currentTarget.dataset.coachIdx, 10);
          state.selectedCoachIdx[cat] = idx;
          renderModalContent();
        });
      });
    }
  };

  renderModalContent();

  modal.classList.remove('hidden');
  setBodyModalLock(true);

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      const state = window._preseasonStaffSetup;
      if (state.step === 1) {
        state.step = 2;
        renderModalContent();
        return;
      }
      if (state.step === 2) {
        state.step = 3;
        renderModalContent();
        return;
      }
      const selectedMgr = state.candidates[state.selectedManagerIdx];
      const selCoaches = {
        attacking: [ state.coachCandidates.attacking[state.selectedCoachIdx.attacking || 0] ].filter(Boolean),
        defending: [ state.coachCandidates.defending[state.selectedCoachIdx.defending || 0] ].filter(Boolean),
        goalkeeping: state.coachCandidates.goalkeeping[state.selectedCoachIdx.goalkeeping || 0] || null,
        fitness: state.coachCandidates.fitness[state.selectedCoachIdx.fitness || 0] || null
      };
      const playerClub = club || getPlayerClub();
      if (state.selectedSecretaryId) {
        gameState.secretaryId = state.selectedSecretaryId;
      }
      let initWish = null;
      if (playerClub && selectedMgr) {
        playerClub.manager = selectedMgr;
        playerClub.formation = selectedMgr.preferredFormation;
        playerClub.tactic = selectedMgr.preferredTactic;
        playerClub.coaches = selCoaches;
        if (gameState.managerDelegationEnabled && typeof applyManagerPreMatchDelegation === 'function') {
          applyManagerPreMatchDelegation(playerClub, true);
        } else {
          optimizeClubStarters(playerClub);
        }
        syncManagerDelegationButtonUI();
        addDailyLog(`[PRE-SEASON] ${selectedMgr.name} 監督および選任コーチ陣が就任し、新シーズン指導体制が発足しました（得意: ${selectedMgr.preferredFormation} / ${selectedMgr.tacticLabel}）。`);
        addDailyLog(`[PRE-SEASON] 7月1日よりプレシーズンおよび夏の移籍市場が開幕しました。`);
        gameState.inboxMessages = [];
        gameState.newsFeed = [];
        if (typeof ensureInitialOfficeMessagesAndNews === 'function') {
          ensureInitialOfficeMessagesAndNews();
        }
        if (typeof generateAndSendManagerWishReport === 'function') {
          initWish = generateAndSendManagerWishReport('プレシーズン指導体制発足');
        }
      }
      modal.classList.add('hidden');
      setBodyModalLock(false);
      renderAll();
      if (typeof saveGameToStorage === 'function') {
        saveGameToStorage(true);
      }
      if (playerClub && selectedMgr && typeof showSecretaryClubOpeningBriefing === 'function') {
        showSecretaryClubOpeningBriefing(playerClub, selectedMgr, true, initWish);
      }
    };
  }
}

/**
 * チームタブ内のサブタブ切り替え（順位表 / 日程・結果 / 個人スタッツ）
 * @param {string} subtabKey 'standings' | 'schedule' | 'stats'
 */
function switchTeamSubtab(subtabKey, shouldRender = true) {
  if (!subtabKey) subtabKey = 'standings';
  gameState.teamSubtab = subtabKey;
  const viewTeam = document.getElementById('view-team');
  if (viewTeam) {
    viewTeam.setAttribute('data-team-subtab', subtabKey);
  }
  document.body.setAttribute('data-team-subtab', subtabKey);
  document.documentElement.setAttribute('data-team-subtab', subtabKey);

  // サブタブボタンのアクティブ状態更新
  const btns = document.querySelectorAll('#team-subnav-bar .roster-subtab-btn');
  btns.forEach(btn => {
    const isAct = btn.dataset.teamSubtab === subtabKey;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // サブビューの表示切り替え
  const subviews = {
    standings: document.getElementById('team-subview-standings'),
    schedule: document.getElementById('team-subview-schedule'),
    stats: document.getElementById('team-subview-stats')
  };

  Object.keys(subviews).forEach(key => {
    const el = subviews[key];
    if (el) {
      el.classList.toggle('hidden', key !== subtabKey);
    }
  });

  if (!shouldRender) return;
  if (subtabKey === 'standings') {
    renderStandings();
  } else if (subtabKey === 'schedule') {
    renderScheduleView();
  } else if (subtabKey === 'stats') {
    renderTopScorers();
  }
}

/**
 * シーズン全38節の日程・試合結果一覧の描画
 */
function renderSeasonSchedule() {
  const container = document.getElementById('season-schedule-list');
  if (!container) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.schedule || gameState.schedule.length === 0) {
    container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">日程データがありません。</div>';
    return;
  }

  // カレンダーの日程マッピング（第1節〜最終節）
  const matchDays = (gameState.calendar || []).filter(d => d.isMatchDay);
  const totalWeeks = gameState.totalWeeks || gameState.schedule.length || (typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision() ? 46 : 38);

  let playedCount = 0;
  let wonCount = 0;
  let drawnCount = 0;
  let lostCount = 0;

  let lastMonth = null;
  const cardsHtml = [];

  for (let weekIdx = 0; weekIdx < gameState.schedule.length; weekIdx++) {
    const weekNum = weekIdx + 1;
    const weekMatches = gameState.schedule[weekIdx];
    const match = weekMatches.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    if (!match) continue;

    const isHome = match.homeId === playerClub.id;
    const oppId = isHome ? match.awayId : match.homeId;
    const oppClub = getClubById(oppId) || { name: oppId, shortName: oppId };

    // 対応するカレンダー日付情報
    const dayInfo = matchDays[weekIdx] || null;
    let dateStr = `${weekNum}節`;
    let monthNum = null;
    if (dayInfo) {
      dateStr = `${dayInfo.month}月${dayInfo.day}日 (${dayInfo.dayOfWeekName})`;
      monthNum = dayInfo.month;
    }

    // 月の区切りヘッダーの挿入
    if (monthNum && monthNum !== lastMonth) {
      lastMonth = monthNum;
      const finalWeekDay = matchDays[gameState.schedule.length - 1] || null;
      const isFinalWeekMonth = finalWeekDay
        ? (finalWeekDay.month === monthNum && finalWeekDay.year === (dayInfo ? dayInfo.year : finalWeekDay.year))
        : (monthNum === 5);
      let monthComment = '';
      if (monthNum === 8) monthComment = '開幕節 / 夏の移籍市場中';
      else if (monthNum === 9) monthComment = '夏の移籍市場閉幕 (9/1)';
      else if (monthNum === 1) monthComment = '冬の移籍市場OPEN (1/1〜1/31)';
      else if (isFinalWeekMonth) monthComment = `シーズン最終節 (MATCHWEEK ${totalWeeks})`;

      cardsHtml.push(`
        <div class="schedule-month-divider">
          <span>${dayInfo ? `${dayInfo.year}年 ` : ''}${monthNum}月</span>
          ${monthComment ? `<span class="schedule-month-badge mono">${monthComment}</span>` : ''}
        </div>
      `);
    }

    const isPlayed = match.played || (weekNum <= gameState.currentWeek && match.homeScore !== null);
    const isNext = !isPlayed && (weekNum === gameState.currentWeek + 1);

    let statusColHtml = '';
    let cardClass = 'schedule-fixture-card';

    if (isPlayed) {
      playedCount++;
      cardClass += ' fixture-played';
      const myScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;

      let resClass = 'result-draw';
      let resLabel = 'DRAW';
      if (myScore > oppScore) {
        resClass = 'result-win';
        resLabel = 'WIN';
        wonCount++;
      } else if (myScore < oppScore) {
        resClass = 'result-lose';
        resLabel = 'LOSE';
        lostCount++;
      } else {
        drawnCount++;
      }

      statusColHtml = `
        <div class="fixture-right-col">
          <span class="fixture-result-badge ${resClass}">${resLabel}</span>
          <span class="fixture-score-text">${match.homeScore} - ${match.awayScore}</span>
          <span class="fixture-replay-hint mono">サマリー ➔</span>
        </div>
      `;
    } else if (isNext) {
      cardClass += ' fixture-next';
      statusColHtml = `
        <div class="fixture-right-col">
          <span class="fixture-next-badge">NEXT</span>
        </div>
      `;
    } else {
      statusColHtml = `
        <div class="fixture-right-col">
          <span class="fixture-unplayed-badge mono">未消化</span>
        </div>
      `;
    }

    cardsHtml.push(`
      <div class="${cardClass}" ${isPlayed ? `data-past-match-week="${weekNum}"` : `data-pending-match-week="${weekNum}"`} role="button" tabindex="0" title="${isPlayed ? `第${weekNum}節のサマリー詳細を見る` : `第${weekNum}節の対戦スカウティングを見る`}">
        <div class="fixture-left-col">
          <span class="fixture-round-badge">第${weekNum}節</span>
          <span class="fixture-date-badge">${dateStr}</span>
          <span class="fixture-venue-badge ${isHome ? 'fixture-venue-home' : 'fixture-venue-away'}">${isHome ? 'HOME' : 'AWAY'}</span>
          <span class="fixture-opponent-name" style="display:inline-flex;align-items:center;gap:6px;">vs ${getClubEmblemSvg(oppClub, 18, 'fixture-opp-emblem')}<span class="mono" style="font-weight:700;">${getClubShortCode(oppClub)}</span></span>
        </div>
        ${statusColHtml}
      </div>
    `);
  }

  container.innerHTML = cardsHtml.join('');

  // 上部バッジ更新
  const playedCountEl = document.getElementById('schedule-played-count');
  if (playedCountEl) playedCountEl.textContent = `${playedCount} / ${totalWeeks}節`;
  const recordEl = document.getElementById('schedule-record-badge');
  if (recordEl) recordEl.textContent = `${wonCount}勝 ${drawnCount}分 ${lostCount}敗`;
}

/**
 * 消化済み試合のマッチサマリー振り返りモーダルを開く
 * @param {number} weekNum 第何節か（1〜38）
 */
function openPastMatchSummaryModal(weekNum) {
  const modal = document.getElementById('past-match-modal');
  const body = document.getElementById('past-match-modal-body');
  const title = document.getElementById('past-match-modal-title');
  if (!modal || !body) return;

  const playerClub = getPlayerClub();
  let matchData = null;
  if (gameState.matchHistory) {
    matchData = gameState.matchHistory.find(m => m.week === weekNum);
  }
  if (!matchData && gameState.schedule && gameState.schedule[weekNum - 1]) {
    const rawMatch = gameState.schedule[weekNum - 1].find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    if (rawMatch && (rawMatch.played || rawMatch.homeScore !== null)) {
      const homeClub = getClubById(rawMatch.homeId);
      const awayClub = getClubById(rawMatch.awayId);
      const fallbackHShots = Math.max(rawMatch.homeScore || 0, rawMatch.homeShots || 10);
      const fallbackAShots = Math.max(rawMatch.awayScore || 0, rawMatch.awayShots || 10);
      matchData = {
        week: weekNum,
        homeClub,
        awayClub,
        homeScore: rawMatch.homeScore,
        awayScore: rawMatch.awayScore,
        momPlayer: rawMatch.momPlayer || null,
        momClub: rawMatch.momClub || homeClub,
        momRating: rawMatch.momRating || null,
        homePossession: rawMatch.homePossession || 50,
        awayPossession: rawMatch.awayPossession || 50,
        homeShots: fallbackHShots,
        awayShots: fallbackAShots,
        homeOnTarget: Math.max(rawMatch.homeScore || 0, Math.min(fallbackHShots, rawMatch.homeOnTarget != null ? rawMatch.homeOnTarget : Math.round(fallbackHShots * 0.45))),
        awayOnTarget: Math.max(rawMatch.awayScore || 0, Math.min(fallbackAShots, rawMatch.awayOnTarget != null ? rawMatch.awayOnTarget : Math.round(fallbackAShots * 0.45))),
        homeXg: rawMatch.homeXg || Number((rawMatch.homeScore * 0.72 + 0.4).toFixed(2)),
        awayXg: rawMatch.awayXg || Number((rawMatch.awayScore * 0.72 + 0.4).toFixed(2)),
        homePasses: rawMatch.homePasses || 480,
        awayPasses: rawMatch.awayPasses || 420,
        homePassAccuracy: rawMatch.homePassAccuracy || 80,
        awayPassAccuracy: rawMatch.awayPassAccuracy || 78,
        isPlayerHome: rawMatch.homeId === playerClub.id,
        homeScorers: rawMatch.homeScorers || [],
        awayScorers: rawMatch.awayScorers || [],
        matchIncome: rawMatch.homeRevenue || 1800,
        awayBroadcastingFee: rawMatch.awayRevenue || 1600,
        playerSupportersDelta: rawMatch.homeId === playerClub.id ? 120 : 60
      };
    }
  }

  if (!matchData) {
    alert(`第${weekNum}節の試合詳細データが見つかりません。`);
    return;
  }

  if (title) {
    const matchDays = (gameState.calendar || []).filter(d => d.isMatchDay);
    const dayInfo = matchDays[weekNum - 1];
    const dateStr = dayInfo ? ` / ${dayInfo.month}月${dayInfo.day}日 (${dayInfo.dayOfWeekName})` : '';
    title.textContent = `第${weekNum}節 公式戦サマリー${dateStr}`;
  }

  const hydrateClubPlayersForSummary = (clubObj) => {
    if (!clubObj || (Array.isArray(clubObj.players) && clubObj.players.length > 0)) return clubObj;
    let realClub = typeof getClubById === 'function' ? getClubById(clubObj.id) : null;
    if (!realClub && typeof getEuropeanCompetitionClubsWithPlayers === 'function') {
      realClub = getEuropeanCompetitionClubsWithPlayers().find(c => c && c.id === clubObj.id) || null;
    }
    if (realClub && Array.isArray(realClub.players)) {
      return { ...clubObj, players: realClub.players, formation: clubObj.formation || realClub.formation };
    }
    return clubObj;
  };
  const renderMatchData = {
    ...matchData,
    homeClub: hydrateClubPlayersForSummary(matchData.homeClub),
    awayClub: hydrateClubPlayersForSummary(matchData.awayClub)
  };

  // 試合直後のサマリーと完全に同一のHTMLを出力
  body.innerHTML = buildMatchSummaryHtml(renderMatchData);

  if (typeof bindSummarySubnavEvents === 'function') {
    bindSummarySubnavEvents(body);
  }

  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(body);
  }

  modal.classList.remove('hidden');
  setBodyModalLock(true);
}
function closePastMatchSummaryModal() {
  const modal = document.getElementById('past-match-modal');
  if (modal) {
    modal.classList.add('hidden');
    setBodyModalLock(false);
  }
}

/**
 * 日程・結果タブの総合描画（カレンダー形式 または リスト形式）
 */
function renderScheduleView() {
  const mode = gameState.scheduleViewMode || 'calendar';
  switchScheduleViewMode(mode, false);
}

/**
 * 表示形式切り替え（'calendar' | 'list'）
 * @param {string} mode 'calendar' または 'list'
 * @param {boolean} updateState 状態を更新するかどうか
 */
function switchScheduleViewMode(mode, updateState = true) {
  if (updateState) {
    gameState.scheduleViewMode = mode;
  }
  const currentMode = gameState.scheduleViewMode || 'calendar';

  const viewTeam = document.getElementById('view-team');
  if (viewTeam) {
    viewTeam.setAttribute('data-schedule-mode', currentMode);
  }
  document.body.setAttribute('data-schedule-mode', currentMode);
  document.documentElement.setAttribute('data-schedule-mode', currentMode);

  const btnCal = document.getElementById('btn-view-toggle-calendar');
  const btnList = document.getElementById('btn-view-toggle-list');
  const calView = document.getElementById('season-calendar-view');
  const listView = document.getElementById('season-schedule-list');
  const monthNav = document.getElementById('calendar-month-nav');

  if (btnCal) {
    btnCal.classList.toggle('active', currentMode === 'calendar');
    btnCal.setAttribute('aria-pressed', currentMode === 'calendar' ? 'true' : 'false');
  }
  if (btnList) {
    btnList.classList.toggle('active', currentMode === 'list');
    btnList.setAttribute('aria-pressed', currentMode === 'list' ? 'true' : 'false');
  }
  if (calView) calView.classList.toggle('hidden', currentMode !== 'calendar');
  if (listView) listView.classList.toggle('hidden', currentMode !== 'list');
  if (monthNav) monthNav.style.visibility = currentMode === 'calendar' ? 'visible' : 'hidden';

  // 常に消化数・戦績バッジを更新
  updateScheduleSummaryBadges();

  if (currentMode === 'calendar') {
    renderMonthCalendar();
  } else {
    renderSeasonSchedule();
  }
}

/**
 * 日程・結果パネル上部の消化数 ＆ 戦績バッジの更新
 */
function updateScheduleSummaryBadges() {
  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.schedule) return;

  let playedCount = 0;
  let wonCount = 0;
  let drawnCount = 0;
  let lostCount = 0;

  for (let weekIdx = 0; weekIdx < gameState.schedule.length; weekIdx++) {
    const weekMatches = gameState.schedule[weekIdx];
    const match = weekMatches.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
    if (!match) continue;

    const isPlayed = match.played || (weekIdx + 1 <= gameState.currentWeek && match.homeScore !== null);
    if (isPlayed) {
      playedCount++;
      const isHome = match.homeId === playerClub.id;
      const myScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;
      if (myScore > oppScore) wonCount++;
      else if (myScore < oppScore) lostCount++;
      else drawnCount++;
    }
  }

  const totalWeeks = gameState.totalWeeks || (Array.isArray(gameState.schedule) && gameState.schedule.length > 0 ? gameState.schedule.length : (typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision() ? 46 : 38));
  const playedCountEl = document.getElementById('schedule-played-count');
  if (playedCountEl) playedCountEl.textContent = `${playedCount} / ${totalWeeks}節`;
  const recordEl = document.getElementById('schedule-record-badge');
  if (recordEl) recordEl.textContent = `${wonCount}勝 ${drawnCount}分 ${lostCount}敗`;
}

/**
 * 月送りナビゲーション（delta: -1 前月, +1 翌月）
 */
function changeCalendarMonth(delta) {
  if (!gameState.calendarViewYear) {
    const curDay = getCurrentCalendarDay();
    gameState.calendarViewYear = curDay ? curDay.year : 2026;
    gameState.calendarViewMonth = curDay ? curDay.month : 8;
  }

  let y = gameState.calendarViewYear;
  let m = gameState.calendarViewMonth + delta;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }

  // シーズン期間（7月〜翌年6月）のガード
  const startDay = gameState.calendar && gameState.calendar[0];
  const endDay = gameState.calendar && gameState.calendar[gameState.calendar.length - 1];
  if (startDay && endDay) {
    const minKey = startDay.year * 100 + startDay.month;
    const maxKey = endDay.year * 100 + endDay.month;
    const curKey = y * 100 + m;
    if (curKey < minKey || curKey > maxKey) {
      return;
    }
  }

  gameState.calendarViewYear = y;
  gameState.calendarViewMonth = m;
  renderMonthCalendar();
}

/**
 * ゲーム内現在日の月へジャンプ
 */
function resetCalendarToCurrentMonth() {
  const curDay = getCurrentCalendarDay();
  if (curDay) {
    gameState.calendarViewYear = curDay.year;
    gameState.calendarViewMonth = curDay.month;
  } else {
    gameState.calendarViewYear = 2025 + gameState.season;
    gameState.calendarViewMonth = 8;
  }
  renderMonthCalendar();
}

/**
 * 月間カレンダーグリッド（7列マス目）の描画
 */
function renderMonthCalendar() {
  const gridEl = document.getElementById('calendar-days-grid');
  const labelEl = document.getElementById('calendar-current-month-label');
  if (!gridEl) return;

  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.calendar || gameState.calendar.length === 0) {
    gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">カレンダーデータがありません。</div>';
    return;
  }

  // 表示年月のフォールバック
  if (!gameState.calendarViewYear) {
    const curDay = getCurrentCalendarDay();
    gameState.calendarViewYear = curDay ? curDay.year : (2025 + gameState.season);
    gameState.calendarViewMonth = curDay ? curDay.month : 8;
  }

  const curYear = gameState.calendarViewYear;
  const curMonth = gameState.calendarViewMonth;

  if (labelEl) {
    labelEl.textContent = `${curYear}年 ${curMonth}月`;
  }

  // 当月のカレンダー日配列を取得
  const monthDays = gameState.calendar.filter(d => d.year === curYear && d.month === curMonth);
  if (monthDays.length === 0) {
    gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted);">該当月の日程データがありません。</div>';
    return;
  }

  const cellsHtml = [];

  // 初日の曜日に応じた空セルの挿入（0:日〜6:土）
  const firstDayOfWeek = monthDays[0].dayOfWeek;
  for (let i = 0; i < firstDayOfWeek; i++) {
    cellsHtml.push('<div class="cal-day-cell is-empty" aria-hidden="true"></div>');
  }

  // 当月の各日マス目の描画
  monthDays.forEach(d => {
    const isCurrentDay = (d.dayIndex === gameState.currentDayIndex);
    const dayColClass = d.dayOfWeek === 0 ? 'col-sun' : (d.dayOfWeek === 6 ? 'col-sat' : '');

    let matchInfoHtml = '';
    let matchClass = '';
    let cellAttr = '';

    // 特別イベント期日の判定
    let eventTagHtml = '';
    const isIntlDay = Boolean(d.isIntlBreak) || (d.month === 9 && d.day >= 4 && d.day <= 8) || (d.month === 10 && d.day >= 9 && d.day <= 13) || (d.month === 11 && d.day >= 13 && d.day <= 17) || (d.month === 3 && d.day >= 19 && d.day <= 24);
    if (d.isTransferDeadline) {
      eventTagHtml = '<div class="cal-event-tag" title="移籍市場閉幕 (デッドラインデー)">移籍閉幕</div>';
    } else if (d.month === 7 && d.day === 1) {
      eventTagHtml = '<div class="cal-event-tag" title="夏の移籍市場解禁">市場解禁</div>';
    } else if (d.month === 1 && d.day === 1) {
      eventTagHtml = '<div class="cal-event-tag" title="冬の移籍市場解禁">冬市場解禁</div>';
    } else if (isIntlDay) {
      eventTagHtml = '<div class="cal-event-tag cal-event-intl" title="代表ウィーク（代表招集期間・公式戦休止）">代表戦</div>';
    }

    if (d.isCupMatchDay) {
      const matchInfo = getCalendarDayPlayerMatch(d);
      const compCode = (matchInfo ? matchInfo.compCode : d.cupCode) || 'CUP';
      const badgeClass = `badge-comp-${compCode.toLowerCase()}`;

      if (matchInfo && matchInfo.oppClub) {
        const isHome = matchInfo.isHome;
        const oppClub = matchInfo.oppClub;
        const myMatch = matchInfo.match;
        const isPlayed = Boolean(d.played || (myMatch && myMatch.played));
        matchClass = `has-match ${isPlayed ? 'match-played' : 'match-pending'} match-comp-${compCode.toLowerCase()}`;
        cellAttr = `data-cal-cup-day-index="${d.dayIndex}" role="button" tabindex="0" title="${matchInfo.title} ${oppClub.name}戦の対戦スカウティングレポート"`;

        let scoreBadge = '';
        if (isPlayed && myMatch && myMatch.homeScore !== null && myMatch.homeScore !== undefined) {
          const myScore = isHome ? myMatch.homeScore : myMatch.awayScore;
          const oppScore = isHome ? myMatch.awayScore : myMatch.homeScore;
          let resClass = 'badge-draw';
          let resLabel = 'DRAW';
          if (myScore > oppScore || (myScore === oppScore && myMatch.winnerId === playerClub.id)) {
            resClass = 'badge-win';
            resLabel = 'WIN';
          } else if (myScore < oppScore || (myScore === oppScore && myMatch.winnerId && myMatch.winnerId !== playerClub.id)) {
            resClass = 'badge-lose';
            resLabel = 'LOSE';
          }
          scoreBadge = `<div class="cal-score-badge ${resClass}">${resLabel} ${myMatch.homeScore}-${myMatch.awayScore}</div>`;
        } else {
          scoreBadge = `<div class="cal-score-badge mono" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 8.5px;">VS</div>`;
        }

        const oppEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(oppClub, 13, 'cal-opp-emblem') : '';
        const oppCode = getClubShortCode(oppClub);

        matchInfoHtml = `
          <div class="cal-match-body">
            <div class="cal-match-header-row">
              <span class="cal-cup-badge ${badgeClass}">[${compCode}]</span>
              <span class="cal-venue-tag ${isHome ? 'venue-home' : 'venue-away'}">${isHome ? 'H' : 'A'}</span>
            </div>
            <div class="cal-opponent-name" title="${oppClub.name}" style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">
              ${oppEmblem}
              <span class="mono" style="font-weight:700;font-size:9.5px;">${oppCode}</span>
            </div>
            ${scoreBadge}
          </div>
        `;
      }
    } else if (d.isMatchDay && d.matchWeek) {
      const weekIdx = d.matchWeek - 1;
      const weekMatches = gameState.schedule[weekIdx] || [];
      const match = weekMatches.find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);

      if (match) {
        const isHome = match.homeId === playerClub.id;
        const oppId = isHome ? match.awayId : match.homeId;
        const oppClub = getClubById(oppId) || { name: oppId, shortName: oppId };
        const oppName = oppClub.shortName || (typeof getClubShortCode === 'function' ? getClubShortCode(oppClub) : oppClub.name.replace(/\s+[A-Z]+$/g, '').trim());

        const isPlayed = match.played || (d.matchWeek <= gameState.currentWeek && match.homeScore !== null);
        const isNext = !isPlayed && (d.matchWeek === gameState.currentWeek + 1);
        const leagueCompClass = `match-comp-${isPlayerInSecondDivision() ? 'eng-d2' : 'eng-d1'}`;

        if (isPlayed) {
          matchClass = `has-match match-played ${leagueCompClass}`;
          cellAttr = `data-cal-match-week="${d.matchWeek}" role="button" tabindex="0" title="第${d.matchWeek}節 ${oppClub.name}戦のサマリーを見る"`;

          const myScore = isHome ? match.homeScore : match.awayScore;
          const oppScore = isHome ? match.awayScore : match.homeScore;
          let badgeClass = 'badge-draw';
          let resLabel = 'DRAW';
          if (myScore > oppScore) {
            badgeClass = 'badge-win';
            resLabel = 'WIN';
          } else if (myScore < oppScore) {
            badgeClass = 'badge-lose';
            resLabel = 'LOSE';
          }

          matchInfoHtml = `
            <div class="cal-match-body">
              <div class="cal-match-header-row">
                <span class="cal-venue-tag ${isHome ? 'venue-home' : 'venue-away'}">${isHome ? 'H' : 'A'}</span>
                <span class="mono" style="font-size: 8.5px; color: var(--text-muted);">#${d.matchWeek}</span>
              </div>
              <div class="cal-opponent-name" title="${oppClub.name}" style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">${getClubEmblemSvg(oppClub, 13, 'cal-opp-emblem')}<span class="mono" style="font-weight:700;font-size:9.5px;">${getClubShortCode(oppClub)}</span></div>
              <div class="cal-score-badge ${badgeClass}">${resLabel} ${match.homeScore}-${match.awayScore}</div>
            </div>
          `;
        } else {
          matchClass = `has-match match-pending ${isNext ? 'match-next' : ''} ${leagueCompClass}`;
          cellAttr = `data-cal-pending-week="${d.matchWeek}" role="button" tabindex="0" title="第${d.matchWeek}節 ${oppClub.name}戦の対戦プレビュー"`;

          matchInfoHtml = `
            <div class="cal-match-body">
              <div class="cal-match-header-row">
                <span class="cal-venue-tag ${isHome ? 'venue-home' : 'venue-away'}">${isHome ? 'H' : 'A'}</span>
                ${isNext ? '<span class="cal-next-tag">NEXT</span>' : `<span class="mono" style="font-size: 8.5px; color: var(--text-muted);">#${d.matchWeek}</span>`}
              </div>
              <div class="cal-opponent-name" title="${oppClub.name}" style="display:inline-flex;align-items:center;gap:3px;justify-content:center;">${getClubEmblemSvg(oppClub, 13, 'cal-opp-emblem')}<span class="mono" style="font-weight:700;font-size:9.5px;">${getClubShortCode(oppClub)}</span></div>
              <div class="cal-score-badge mono" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 8.5px;">VS</div>
            </div>
          `;
        }
      }
    }

    const currentDayClass = isCurrentDay ? 'is-current-day' : '';

    cellsHtml.push(`
      <div class="cal-day-cell ${dayColClass} ${currentDayClass} ${matchClass}" ${cellAttr}>
        <div class="cal-cell-header">
          <span class="cal-day-num">${d.day}</span>
          ${isCurrentDay ? '<span class="cal-today-badge mono">TODAY</span>' : ''}
        </div>
        ${eventTagHtml}
        ${matchInfoHtml}
      </div>
    `);
  });

  // 常に6行分（全42マス：7列 × 6行）のスペースを確保するため、末尾を空セルで埋める
  while (cellsHtml.length < 42) {
    cellsHtml.push('<div class="cal-day-cell is-empty" aria-hidden="true"></div>');
  }

  gridEl.innerHTML = cellsHtml.join('');
}

/**
 * 未消化試合マス目をタップした際の対戦プレビュー・確認（リーグ戦）
 * @param {number} weekNum 第何節か（1〜38）
 */
function openPendingMatchPreview(weekNum) {
  const playerClub = getPlayerClub();
  if (!playerClub || !gameState.schedule || !gameState.schedule[weekNum - 1]) return;

  const match = gameState.schedule[weekNum - 1].find(m => m.homeId === playerClub.id || m.awayId === playerClub.id);
  if (!match) return;

  const isHome = match.homeId === playerClub.id;
  const oppId = isHome ? match.awayId : match.homeId;
  const oppClub = getClubById(oppId);
  if (!oppClub) return;

  const matchDays = (gameState.calendar || []).filter(d => d.isMatchDay);
  const dayInfo = matchDays[weekNum - 1];
  const dateStr = dayInfo ? `${dayInfo.month}月${dayInfo.day}日 (${dayInfo.dayOfWeekName})` : `第${weekNum}節`;

  renderFixtureScoutingModal({
    titleText: `第${weekNum}節 対戦スカウティングレポート`,
    match,
    playerClub,
    oppClub,
    isHome,
    dateStr
  });
}

/**
 * リーグ以外の試合（カップ戦・欧州戦・プレシーズン杯）のスカウティングレポートを表示
 * @param {number} dayIndex カレンダー配列上のインデックス
 */
function openCupMatchPreview(dayIndex) {
  const dayObj = gameState.calendar && gameState.calendar[dayIndex];
  if (!dayObj) return;
  const playerClub = getPlayerClub();
  if (!playerClub) return;

  const matchInfo = typeof getCalendarDayPlayerMatch === 'function' ? getCalendarDayPlayerMatch(dayObj) : null;
  if (!matchInfo || !matchInfo.oppClub) return;

  const oppClub = matchInfo.oppClub;
  const isHome = Boolean(matchInfo.isHome);
  const match = matchInfo.match || {
    homeId: isHome ? playerClub.id : oppClub.id,
    awayId: isHome ? oppClub.id : playerClub.id
  };
  const dateStr = `${dayObj.month}月${dayObj.day}日 (${dayObj.dayOfWeekName || ''})`;
  const scoreSuffix = (matchInfo.played && match && match.homeScore != null && match.awayScore != null)
    ? ` (${match.homeScore}-${match.awayScore})`
    : '';

  renderFixtureScoutingModal({
    titleText: `${matchInfo.title} 対戦スカウティングレポート${scoreSuffix}`,
    match,
    playerClub,
    oppClub,
    isHome,
    dateStr
  });
}

/**
 * 対戦スカウティングレポートモーダル（#fixture-preview-modal）共通描画
 */
function renderFixtureScoutingModal({ titleText, match, playerClub, oppClub, isHome, dateStr }) {
  const modal = document.getElementById('fixture-preview-modal');
  const body = document.getElementById('fixture-preview-modal-body');
  const title = document.getElementById('fixture-preview-title');
  if (!modal || !body || !playerClub || !oppClub) return;

  if (title) title.textContent = titleText;

  // 順位算出（国内1部・2部リーグ所属クラブの順位表示）
  const d1Sorted = [...(gameState.clubs || [])].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0) || (b.gf || 0) - (a.gf || 0));
  const d2Clubs = (gameState.competitions && gameState.competitions.championship && Array.isArray(gameState.competitions.championship.clubs))
    ? gameState.competitions.championship.clubs
    : [];
  const d2Sorted = [...d2Clubs].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0) || (b.gf || 0) - (a.gf || 0));

  const findLeagueRankInfo = (clubObj) => {
    if (!clubObj) return { rank: 0, divLabel: '' };
    const idx1 = d1Sorted.findIndex(c => c && c.id === clubObj.id);
    if (idx1 !== -1) return { rank: idx1 + 1, divLabel: 'ENG-D1' };
    const idx2 = d2Sorted.findIndex(c => c && c.id === clubObj.id);
    if (idx2 !== -1) return { rank: idx2 + 1, divLabel: 'ENG-D2' };
    return { rank: 0, divLabel: '' };
  };
  const myRankInfo = findLeagueRankInfo(playerClub);
  const oppRankInfo = findLeagueRankInfo(oppClub);

  // 戦術情報
  const tacticKey = oppClub.defaultTactic || oppClub.tactic || 'possession';
  const tacticLabel = getManagerTacticLabel(tacticKey);
  const formation = oppClub.defaultFormation || oppClub.formation || '4-3-3';

  // 相手チームの選手OVR算出とスタメン選出（GK1名 + フィールド10名）
  const oppPlayers = (oppClub.players || []).map(p => {
    const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(p) : (p.ovr || Math.round(((p.atk || 70) + (p.def || 70) + (p.sta || 70)) / 3));
    return { ...p, calculatedOvr: ovr };
  });

  const gks = oppPlayers.filter(p => (p.primaryPosition || p.pos) === 'GK').sort((a, b) => b.calculatedOvr - a.calculatedOvr);
  const outfield = oppPlayers.filter(p => (p.primaryPosition || p.pos) !== 'GK').sort((a, b) => b.calculatedOvr - a.calculatedOvr);

  const starters = [];
  if (gks.length > 0) {
    starters.push(gks[0]);
  } else if (oppPlayers.length > 0) {
    starters.push(oppPlayers[0]);
  }
  starters.push(...outfield.slice(0, 10));
  if (starters.length < 11) {
    const remaining = oppPlayers.filter(p => !starters.some(s => s.id === p.id));
    starters.push(...remaining.slice(0, 11 - starters.length));
  }

  // ポジション順に並べ替え（GK -> DF -> MF -> FW）
  const posOrder = { 'GK': 1, 'CB': 2, 'LB': 3, 'RB': 4, 'LWB': 5, 'RWB': 6, 'DM': 7, 'CM': 8, 'AM': 9, 'LM': 10, 'RM': 11, 'LW': 12, 'RW': 13, 'CF': 14, 'ST': 15 };
  starters.sort((a, b) => {
    const pA = a.primaryPosition || a.pos || 'MF';
    const pB = b.primaryPosition || b.pos || 'MF';
    const orderA = posOrder[pA] || 50;
    const orderB = posOrder[pB] || 50;
    return orderA - orderB || b.calculatedOvr - a.calculatedOvr;
  });

  const maxOvr = starters.length > 0 ? Math.max(...starters.map(p => p.calculatedOvr || 0)) : 0;
  const avgOvr = starters.length > 0 ? Math.round(starters.reduce((acc, p) => acc + p.calculatedOvr, 0) / starters.length) : (oppClub.avgOvr || 75);

  // 直近5試合のフォームと平均得失点集計
  const recentForm = [];
  let recentGf = 0;
  let recentGa = 0;
  if (Array.isArray(gameState.schedule)) {
    for (let w = gameState.schedule.length - 1; w >= 0 && recentForm.length < 5; w--) {
      const m = (gameState.schedule[w] || []).find(x => x && x.played && (x.homeId === oppClub.id || x.awayId === oppClub.id));
      if (!m) continue;
      const isOppH = m.homeId === oppClub.id;
      const gf = isOppH ? (m.homeScore || 0) : (m.awayScore || 0);
      const ga = isOppH ? (m.awayScore || 0) : (m.homeScore || 0);
      recentGf += gf;
      recentGa += ga;
      recentForm.unshift(gf > ga ? 'W' : (gf === ga ? 'D' : 'L'));
    }
  }
  const formBadgesHtml = recentForm.length > 0
    ? recentForm.map(r => `<span class="form-badge form-${r.toLowerCase()}">${r}</span>`).join('')
    : '<span class="text-muted mono" style="font-size:11px;">直近データなし</span>';
  const avgGfText = recentForm.length > 0 ? (recentGf / recentForm.length).toFixed(1) : '-';
  const avgGaText = recentForm.length > 0 ? (recentGa / recentForm.length).toFixed(1) : '-';

  // 戦術相性アドバイス
  const myTac = normalizeTacticKey(playerClub.tactic);
  const oppTac = normalizeTacticKey(tacticKey);
  let adviceText = 'バランスの取れた布陣です。コンディションと連携度を重視して臨みましょう。';
  if (oppTac === 'gegenpress') adviceText = '相手はハイプレスで消耗が激しい戦術です。カウンターや終盤の交代カードが有効です。';
  else if (oppTac === 'possession') adviceText = '相手は中盤の支配に長けています。ゲーゲンプレスやダイレクトカウンターで隙を突くのが効果的です。';
  else if (oppTac === 'parkthebus') adviceText = '相手は中央を固める徹底堅守です。ワイドアタックやセットプレーからの打開を狙いましょう。';
  else if (oppTac === 'counter') adviceText = '相手の鋭いカウンターに警戒が必要です。ポゼッションで主導権を握り被カウンター機会を減らしましょう。';
  else if (oppTac === 'wingplay') adviceText = '両翼からのクロス攻撃が主軸です。SBの守備力とCBの空中戦が鍵になります。';

  const squadRowsHtml = starters.map((p) => {
    const isKey = p.calculatedOvr === maxOvr;
    const pos = p.primaryPosition || p.assignedPos || p.pos || 'MF';
    const roleGroup = (typeof POS_ROLE_GROUP !== 'undefined' && POS_ROLE_GROUP[pos]) ? POS_ROLE_GROUP[pos] : 'MF';
    const sv = typeof getPlayerScoutedView === 'function'
      ? getPlayerScoutedView(p, false)
      : { isScouted: true, ovrMin: p.calculatedOvr, ovrMax: p.calculatedOvr };
    const oppOvrHtml = sv.isScouted
      ? `${p.calculatedOvr}`
      : buildOvrRangeHtml(sv.ovrMin, sv.ovrMax);
    const oppOvrCls = sv.isScouted ? getOvrTierClass(p.calculatedOvr) : '';
    return `
      <tr style="${isKey ? 'background:rgba(245,158,11,0.08);' : ''}">
        <td class="mono" style="font-weight:700; width:44px;"><span class="pos-badge pos-${roleGroup.toLowerCase()}">${pos}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:${isKey ? '800' : '500'}; color:${isKey ? '#ffffff' : '#cbd5e1'};">${p.name}</span>
            ${isKey ? '<span class="scout-key-badge">★ KEY</span>' : ''}
          </div>
        </td>
        <td class="mono" style="color:var(--text-muted); width:44px;">${p.age}歳</td>
        <td class="mono" style="width:66px; text-align:right; white-space:nowrap;"><span class="ovr-cell-badge ${oppOvrCls}" style="font-size:12px;">${oppOvrHtml}</span></td>
      </tr>
    `;
  }).join('');

  const myMetaText = myRankInfo.rank > 0
    ? `${myRankInfo.divLabel !== oppRankInfo.divLabel && myRankInfo.divLabel ? `${myRankInfo.divLabel} ` : ''}現在 ${myRankInfo.rank}位 (${playerClub.pts || 0}pt)`
    : `OVR ${playerClub.avgOvr || '-'}`;
  const oppMetaText = oppRankInfo.rank > 0
    ? `${myRankInfo.divLabel !== oppRankInfo.divLabel && oppRankInfo.divLabel ? `${oppRankInfo.divLabel} ` : ''}現在 ${oppRankInfo.rank}位 (${oppClub.pts || 0}pt)`
    : `${oppClub.leagueName || oppClub.country || '海外クラブ'} (OVR ${oppClub.avgOvr || avgOvr})`;
  const homeTeamIsPlayer = (match && match.homeId) ? (match.homeId === playerClub.id) : isHome;
  const awayTeamIsPlayer = !homeTeamIsPlayer;
  const homeClubObj = homeTeamIsPlayer ? playerClub : oppClub;
  const awayClubObj = awayTeamIsPlayer ? playerClub : oppClub;

  body.innerHTML = `
    <!-- クラブ対決カード -->
    <div class="scout-matchup-card">
      <div class="scout-team-col home">
        <div class="scout-team-title-wrap">
          ${getClubEmblemSvg(homeClubObj, 28, 'scout-emblem')}
          <span class="scout-team-name mono ${homeTeamIsPlayer ? 'accent-green' : ''}" style="font-weight:800; font-size:16px; letter-spacing:0.05em;">
            ${getClubShortCode(homeClubObj)}
          </span>
        </div>
        <span class="scout-team-meta mono">
          ${homeTeamIsPlayer ? myMetaText : oppMetaText}
        </span>
      </div>
      <div class="scout-vs-center">
        <span class="scout-vs-badge">VS</span>
        <span class="scout-venue-pill mono ${isHome ? 'fixture-venue-home' : 'fixture-venue-away'}">
          ${isHome ? 'HOME 開催' : 'AWAY 遠征'}
        </span>
        <span class="mono" style="font-size:10.5px; color:#8a94a0;">${dateStr}</span>
      </div>
      <div class="scout-team-col away">
        <div class="scout-team-title-wrap">
          <span class="scout-team-name mono ${awayTeamIsPlayer ? 'accent-green' : ''}" style="font-weight:800; font-size:16px; letter-spacing:0.05em;">
            ${getClubShortCode(awayClubObj)}
          </span>
          ${getClubEmblemSvg(awayClubObj, 28, 'scout-emblem')}
        </div>
        <span class="scout-team-meta mono">
          ${awayTeamIsPlayer ? myMetaText : oppMetaText}
        </span>
      </div>
    </div>

    <!-- 相手チーム戦術 ＆ 戦力 数値プレート -->
    <div class="ui-plate-grid" style="margin: 10px 0 6px;">
      <div class="ui-stat-plate is-highlight">
        <span class="ui-plate-label">相手戦術</span>
        <span class="ui-plate-val accent-green" style="font-size:13.5px;">${tacticLabel}</span>
      </div>
      <div class="ui-stat-plate">
        <span class="ui-plate-label">基本陣形</span>
        <span class="ui-plate-val">${formation}</span>
      </div>
      <div class="ui-stat-plate is-gold">
        <span class="ui-plate-label">平均戦力</span>
        <span class="ui-plate-val accent-gold">OVR ${avgOvr}</span>
      </div>
    </div>

    <!-- 直近フォーム＆戦術所見（左見出し・右詳細） -->
    <div class="scout-analysis-panel ui-kv-list">
      <div class="ui-kv-row">
        <div class="ui-kv-label accent-cyan-bar">直近5戦</div>
        <div class="ui-kv-content" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
          <div class="scout-form-badges">${formBadgesHtml}</div>
          <span class="mono wage-nowrap" style="font-size:11.5px; color:#cbd5e1;">得点 <strong class="accent-green">${avgGfText}</strong> / 失点 <strong class="text-danger">${avgGaText}</strong></span>
        </div>
      </div>
      <div class="ui-kv-row">
        <div class="ui-kv-label">攻略要点</div>
        <div class="ui-kv-content scout-advice-box" style="background:none; border:none; padding:0; margin:0; font-size:12px; line-height:1.45;">
          ${adviceText}
        </div>
      </div>
    </div>

    <!-- 相手チーム想定スタメン（スカッド一覧11名） -->
    <div class="scout-squad-panel">
      <div class="scout-panel-header">
        <span class="scout-panel-title">想定スタメン (11名)</span>
        <span class="mono" style="font-size:11px; color:var(--text-muted);">登録選手数: ${oppPlayers.length}名</span>
      </div>
      <div class="table-wrapper" style="max-height: 280px; overflow-y: auto;">
        <table class="scout-squad-table">
          <thead>
            <tr>
              <th>POS</th>
              <th>選手名</th>
              <th>年齢</th>
              <th>能力</th>
            </tr>
          </thead>
          <tbody>
            ${squadRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  setBodyModalLock(true);
}

function closePendingMatchPreviewModal() {
  const modal = document.getElementById('fixture-preview-modal');
  if (modal) {
    modal.classList.add('hidden');
    setBodyModalLock(false);
  }
}

// ==========================================================================
// 経営・スポンサー・PSR・理事会解任再スタート・代表ウィーク
// ==========================================================================

function renderBoardPsrSponsorPanel(club) {
  const panel = document.getElementById('board-psr-sponsor-panel');
  if (!panel || !club) return;
  if (typeof ensureClubRealismFields === 'function') ensureClubRealismFields(club);

  const sp = club.sponsor || { name: '未契約', baseAnnual: 0, clBonus: 0, titleBonus: 0, yearsRemaining: 0 };
  const psr = typeof evaluateClubPSR === 'function' ? evaluateClubPSR(club) : { total3YrNet: 0, isBreach: false, pointsDeduction: 0 };
  const conf = club.boardConfidence ?? 75;
  const targetRank = (club.boardExpectations && club.boardExpectations.targetRank) || club.targetRank || 8;
  const sanctionText = (club.psrSanction && club.psrSanction.transferBanWindows > 0)
    ? `<span class="text-danger mono" style="font-weight:700;">補強禁止処分中 (残${club.psrSanction.transferBanWindows}窓)</span>`
    : `<span class="accent-green mono">健全</span>`;

  panel.innerHTML = `
    <div class="board-psr-grid">
      <div class="board-psr-card">
        <div class="board-psr-title mono">SPONSORSHIP / 胸スポンサー</div>
        <div class="board-psr-main">${sp.name}</div>
        <div class="board-psr-sub mono">年額: <strong class="accent-gold">${formatMoney(sp.baseAnnual)}</strong> (残${sp.yearsRemaining}年)</div>
        <div class="board-psr-sub mono">ECTボーナス: +${formatMoney(sp.clBonus)} / 優勝: +${formatMoney(sp.titleBonus)}</div>
      </div>
      <div class="board-psr-card">
        <div class="board-psr-title mono">PSR / 3年累積財務規律</div>
        <div class="board-psr-main mono ${psr.isBreach ? 'text-danger' : 'accent-green'}">${formatMoney(psr.total3YrNet)}</div>
        <div class="board-psr-sub mono">許容赤字上限: ${formatMoney(typeof PSR_MAX_3YR_DEFICIT !== 'undefined' ? PSR_MAX_3YR_DEFICIT : -35000)}</div>
        <div class="board-psr-sub">状態: ${sanctionText}</div>
      </div>
      <div class="board-psr-card">
        <div class="board-psr-title mono">BOARD / 理事会信頼度 & クラブ格</div>
        <div class="board-psr-main mono ${conf >= 60 ? 'accent-green' : (conf >= 35 ? 'accent-gold' : 'text-danger')}">${conf}%</div>
        <div class="board-psr-sub mono">今季目標順位: ${targetRank}位以内</div>
        <div class="board-psr-sub mono">クラブ格(Rep): ${club.reputation || 4000}</div>
      </div>
    </div>
  `;
}

function processSeasonEndFinanceAndPSR(sortedD1, sortedD2) {
  if (Array.isArray(gameState.installments) && gameState.installments.length > 0) {
    const playerClub = getPlayerClub();
    const remainInst = [];
    for (const inst of gameState.installments) {
      if (!inst || inst.remainingSeasons <= 0) continue;
      if (playerClub) {
        if (inst.direction === 'out') playerClub.funds -= inst.amountPerSeason;
        else playerClub.funds += inst.amountPerSeason;
      }
      inst.remainingSeasons -= 1;
      if (inst.remainingSeasons > 0) remainInst.push(inst);
    }
    gameState.installments = remainInst;
  }

  const ectQualifiedIds = new Set();
  if (typeof selectEuropeanCompetitionEntries === 'function') {
    const entries = selectEuropeanCompetitionEntries();
    if (entries && Array.isArray(entries.clEntries)) {
      for (const ec of entries.clEntries) {
        if (ec && ec.id) ectQualifiedIds.add(ec.id);
      }
    }
  } else {
    const cupWinners = gameState.lastSeasonCupWinners || {};
    if (cupWinners.championsCupId) ectQualifiedIds.add(cupWinners.championsCupId);
    if (cupWinners.europaCupId) ectQualifiedIds.add(cupWinners.europaCupId);
    for (const c of (sortedD1 || [])) {
      if (ectQualifiedIds.size >= 4) break;
      if (c && c.id) ectQualifiedIds.add(c.id);
    }
  }

  let playerSponsorIncome = 0;
  const d1RankMap = new Map();
  (sortedD1 || []).forEach((c, i) => { if (c && c.id) d1RankMap.set(c.id, i); });
  const d2RankMap = new Map();
  (sortedD2 || []).forEach((c, i) => { if (c && c.id) d2RankMap.set(c.id, i); });

  const allClubs = getAllManagedLeagueClubs();
  for (const club of allClubs) {
    if (!club) continue;
    if (typeof ensureClubRealismFields === 'function') ensureClubRealismFields(club);
    const isD2Club = d2RankMap.has(club.id) || club.division === 'd2';
    const sp = club.sponsor;
    let spRev = 0;
    if (sp) {
      spRev = sp.baseAnnual || 3000;
      const d1Idx = d1RankMap.has(club.id) ? d1RankMap.get(club.id) : -1;
      if (d1Idx === 0) spRev += (sp.titleBonus || 0);
      if (ectQualifiedIds.has(club.id)) spRev += (sp.clBonus || 0);
      if (isD2Club && sp.relegationPenaltyPct) {
        spRev = Math.round(spRev * (1 - sp.relegationPenaltyPct / 100));
      }
      club.funds = (club.funds || 0) + spRev;
      if (club.isPlayer) playerSponsorIncome = spRev;
      sp.yearsRemaining = Math.max(0, (sp.yearsRemaining || 1) - 1);
      if (sp.yearsRemaining === 0) {
        club.sponsor = null;
        ensureClubRealismFields(club);
      }
    }

    const annualPayroll = typeof getClubTotalPayroll === 'function' ? getClubTotalPayroll(club) : 10000;
    const homeMatches = isD2Club ? 23 : 19;
    const awayMatches = isD2Club ? 23 : 19;
    const gateUnit = isD2Club ? 0.055 : 0.085;
    const awayTvUnit = isD2Club ? 450 : 1600;
    const leaguePrize = isD2Club
      ? (d2RankMap.has(club.id) ? (PRIZE_MONEY_TABLE_D2[d2RankMap.get(club.id)] || 1500) : 2500)
      : (d1RankMap.has(club.id) ? (PRIZE_MONEY_TABLE[d1RankMap.get(club.id)] || 5000) : 12000);
    const estMatchRev = Math.round((club.supporters || 14000) * gateUnit * homeMatches + awayTvUnit * awayMatches + leaguePrize + spRev);
    const netProfit = estMatchRev - annualPayroll;
    if (!Array.isArray(club.psrHistory)) club.psrHistory = [];
    club.psrHistory.push({
      season: gameState.season || 1,
      revenue: estMatchRev,
      expenses: annualPayroll,
      netProfit
    });
    if (club.psrHistory.length > 3) club.psrHistory = club.psrHistory.slice(-3);

    const psrEval = typeof evaluateClubPSR === 'function' ? evaluateClubPSR(club) : { isBreach: false, pointsDeduction: 0 };
    if (psrEval.isBreach) {
      club.psrSanction = {
        transferBanWindows: 1,
        pointsDeductedThisSeason: psrEval.pointsDeduction
      };
      if (club.isPlayer && typeof addDailyLog === 'function') {
        addDailyLog(`【PSR違反処分】過去3季の累積赤字が上限を超過したため、来季開幕時勝点-${psrEval.pointsDeduction}pt ＆ 次ウィンドウ補強禁止が科されました！`);
      }
    } else if (club.psrSanction && club.psrSanction.transferBanWindows > 0) {
      club.psrSanction.transferBanWindows = Math.max(0, club.psrSanction.transferBanWindows - 1);
      club.psrSanction.pointsDeductedThisSeason = 0;
    }
  }
  return { playerSponsorIncome };
}

function processInternationalBreakEvent(day) {
  if (!day) return false;
  const m = day.month;
  const d = day.day;
  const isBreakStart = (m === 9 && d === 4) || (m === 10 && d === 9) || (m === 11 && d === 13) || (m === 3 && d === 19);
  const isBreakEnd = (m === 9 && d === 8) || (m === 10 && d === 13) || (m === 11 && d === 17) || (m === 3 && d === 24);
  const playerClub = getPlayerClub();
  if (!playerClub) return false;

  if (isBreakStart) {
    const called = [];
    for (const club of getAllManagedLeagueClubs()) {
      for (const p of (club.players || [])) {
        if (!p || p.isRetired || (p.injuryDays || 0) > 0) continue;
        const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(p) : 70;
        const natBase = (typeof NATIONAL_TEAM_STRENGTHS !== 'undefined' && NATIONAL_TEAM_STRENGTHS[p.nationality]) || 79;
        if (ovr >= natBase - 4) {
          p.onIntlDuty = true;
          if (club.isPlayer) called.push(p.name);
        }
      }
    }
    if (called.length > 0 && typeof addDailyLog === 'function') {
      addDailyLog(`【代表ウィーク突入】自クラブから ${called.slice(0, 5).join(', ')}${called.length > 5 ? ` 他${called.length - 5}名` : ''} が各国代表に招集されました。`);
    }
    return called.length > 0;
  }

  if (isBreakEnd) {
    const returned = [];
    const injuredNames = [];
    for (const club of getAllManagedLeagueClubs()) {
      for (const p of (club.players || [])) {
        if (p && p.onIntlDuty) {
          p.onIntlDuty = false;
          p.fatigue = clamp((p.fatigue || 0) + randInt(12, 22), 0, 100);
          if (Math.random() < 0.04) {
            p.injuryDays = randInt(5, 14);
            p.injuryWeeks = Math.ceil(p.injuryDays / 7);
            if (club.isPlayer) injuredNames.push(`${p.name}(全治${p.injuryDays}日)`);
          }
          if (club.isPlayer) returned.push(p.name);
        }
      }
    }
    if (returned.length > 0 && typeof addDailyLog === 'function') {
      addDailyLog(`【代表ウィーク終了】代表組 ${returned.length}名がクラブへ帰還しました。${injuredNames.length > 0 ? `負傷帰還: ${injuredNames.join(', ')}` : '全員無事に合流しています。'}`);
    }
    return returned.length > 0;
  }
  return false;
}

function openBoardCrisisModal() {
  const modal = document.getElementById('board-crisis-modal');
  const body = document.getElementById('board-crisis-body');
  if (!modal || !body) return;
  const playerClub = getPlayerClub();
  const d2Clubs = (gameState.competitions && gameState.competitions.championship && Array.isArray(gameState.competitions.championship.clubs))
    ? gameState.competitions.championship.clubs.slice(0, 3)
    : [];

  const offerBtns = d2Clubs.map(c => `
    <button type="button" class="btn btn-primary btn-sm mono" data-restart-club-id="${c.id}" style="width:100%; margin-bottom:8px; justify-content:space-between; display:flex;">
      <span>${c.name} (ENG-D2)</span>
      <span>GM就任へ ➔</span>
    </button>
  `).join('');

  body.innerHTML = `
    <p style="margin-bottom: 14px; line-height: 1.6;">
      理事会からの信頼度が限界値を下回り（<strong>${playerClub ? playerClub.boardConfidence : 0}%</strong>）、${playerClub ? playerClub.name : '現クラブ'} のGM解任が決定しました。<br />
      新天地（2部クラブ）から届いている再建オファーを受けてキャリアを続行するか、ここで引退するかを選択してください。
    </p>
    <div style="margin-bottom: 14px;">
      ${offerBtns}
    </div>
    <button type="button" class="btn btn-danger btn-sm mono" id="btn-board-crisis-retire" style="width:100%;">
      キャリア終了（ゲームオーバー）
    </button>
  `;

  body.querySelectorAll('[data-restart-club-id]').forEach(btn => {
    btn.addEventListener('click', () => handleBoardRelegationRestart(btn.dataset.restartClubId));
  });
  const retireBtn = document.getElementById('btn-board-crisis-retire');
  if (retireBtn) {
    retireBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      setBodyModalLock(false);
      gameState.isGameOver = true;
      gameState.pendingBoardCrisis = false;
      renderAll();
    });
  }

  modal.classList.remove('hidden');
  setBodyModalLock(true);
}

function handleBoardRelegationRestart(newClubId) {
  const modal = document.getElementById('board-crisis-modal');
  if (modal) {
    modal.classList.add('hidden');
    setBodyModalLock(false);
  }
  const allClubs = getAllManagedLeagueClubs();
  const nextClub = allClubs.find(c => c && c.id === newClubId);
  if (!nextClub) return;

  const wasD2 = isPlayerInSecondDivision();
  allClubs.forEach(c => { if (c) c.isPlayer = (c.id === nextClub.id); });
  gameState.selectedClubId = nextClub.id;

  const d2Comp = gameState.competitions && gameState.competitions.championship;
  const d2Clubs = (d2Comp && Array.isArray(d2Comp.clubs)) ? d2Comp.clubs : [];
  const isNextD2 = d2Clubs.some(c => c && c.id === nextClub.id);
  nextClub.division = isNextD2 ? 'd2' : 'd1';
  gameState.playerDivision = nextClub.division;
  gameState.selectedLeagueDivision = nextClub.division;
  nextClub.boardConfidence = 75;
  gameState.pendingBoardCrisis = false;

  if (wasD2 !== isNextD2 && Array.isArray(gameState.calendar)) {
    if (isNextD2 && d2Comp) {
      d2Clubs.forEach(c => {
        if (typeof ensurePlayableClubStructure === 'function') ensurePlayableClubStructure(c);
      });
      if (!Array.isArray(d2Comp.schedule) || d2Comp.schedule.length === 0) {
        d2Comp.schedule = generateSeasonSchedule(d2Clubs);
      }
      gameState.schedule = d2Comp.schedule;
    } else if (!isNextD2 && Array.isArray(gameState.clubs)) {
      gameState.schedule = generateSeasonSchedule(gameState.clubs);
    }

    const totalWeeks = Array.isArray(gameState.schedule) ? gameState.schedule.length : (isNextD2 ? 46 : 38);
    const completedWeeks = Math.min(totalWeeks, Math.max(0, nextClub.played || 0));
    for (let wIdx = 0; wIdx < completedWeeks && wIdx < gameState.schedule.length; wIdx++) {
      (gameState.schedule[wIdx] || []).forEach(m => { if (m) m.played = true; });
    }
    gameState.totalWeeks = totalWeeks;
    gameState.currentWeek = completedWeeks;

    // 現在日以降の未消化リーグ日程をクリアし、残り節をシーズン末までに均等再配置する
    const startIdx = Math.max(0, (gameState.currentDayIndex || 0) + 1);
    for (let i = startIdx; i < gameState.calendar.length; i++) {
      const d = gameState.calendar[i];
      if (d && d.isMatchDay && !d.played) {
        d.isMatchDay = false;
        d.matchWeek = null;
        d.matchFixture = null;
      }
    }
    const remWeeks = [];
    for (let w = completedWeeks + 1; w <= totalWeeks; w++) remWeeks.push(w);
    if (remWeeks.length > 0) {
      const endIdx = Math.max(startIdx, gameState.calendar.length - 7);
      let candidateDays = [];
      for (let i = startIdx; i <= endIdx; i++) {
        const d = gameState.calendar[i];
        if (d && !d.isCupMatchDay && !d.isMatchDay && (d.dayOfWeek === 6 || d.dayOfWeek === 0 || d.dayOfWeek === 3)) {
          candidateDays.push(i);
        }
      }
      if (candidateDays.length < remWeeks.length) {
        candidateDays = [];
        for (let i = startIdx; i < gameState.calendar.length; i++) {
          const d = gameState.calendar[i];
          if (d && !d.isCupMatchDay && !d.isMatchDay) candidateDays.push(i);
        }
      }
      const step = candidateDays.length / remWeeks.length;
      remWeeks.forEach((wNum, idx) => {
        const dayPos = candidateDays[Math.min(candidateDays.length - 1, Math.floor(idx * step))];
        const d = gameState.calendar[dayPos];
        if (d) {
          d.isMatchDay = true;
          d.matchWeek = wNum;
          d.matchFixture = gameState.schedule[wNum - 1] || null;
          d.played = false;
        }
      });
    }
  }

  addDailyLog(`【新天地就任】${nextClub.name} の新GMに就任し、クラブ再建の指揮を執ることになりました！`);
  markAllViewsDirty();
  renderAll();
  scheduleAutoSave();
}

// ==========================================================================
// 秘書役ブリーフィング・メッセージ受信箱・ニュース・監督補強希望システム
// ==========================================================================

function escapeCommHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCurrentCommDateLabel() {
  const day = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
  if (day) {
    return `${day.month}/${day.day} (${day.dayOfWeekName})`;
  }
  return `S${gameState.season || 1}`;
}

/**
 * 受信箱にメッセージを追加する（最大40件保持）
 */
function addInboxMessage({
  senderType = 'secretary',
  senderName = null,
  title = '',
  body = '',
  actionType = null,
  actionLabel = '',
  actionPayload = null,
  candidatePlayers = null
}) {
  if (!Array.isArray(gameState.inboxMessages)) {
    gameState.inboxMessages = [];
  }
  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: 'C. Bennett' };
  const resolvedSenderName = senderName || (senderType === 'secretary' ? sec.name : 'クラブ事務局');
  const msg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: getCurrentCommDateLabel(),
    dayIndex: gameState.currentDayIndex || 0,
    season: gameState.season || 1,
    senderType,
    senderName: resolvedSenderName,
    title,
    body,
    read: false,
    actionType,
    actionLabel,
    actionPayload,
    candidatePlayers: Array.isArray(candidatePlayers) ? candidatePlayers : null
  };
  gameState.inboxMessages.unshift(msg);
  if (gameState.inboxMessages.length > 40) {
    gameState.inboxMessages = gameState.inboxMessages.slice(0, 40);
  }
  return msg;
}

function markInboxMessageRead(msgId) {
  if (!Array.isArray(gameState.inboxMessages)) return;
  const target = gameState.inboxMessages.find(m => m && m.id === msgId);
  if (target && !target.read) {
    target.read = true;
  }
}

function markAllInboxMessagesRead() {
  if (!Array.isArray(gameState.inboxMessages)) return;
  gameState.inboxMessages.forEach(m => {
    if (m) m.read = true;
  });
  renderOfficeCommPanel();
  if (typeof renderSecretaryBriefing === 'function') renderSecretaryBriefing();
  if (gameState.hasStartedOnce && typeof scheduleAutoSave === 'function') scheduleAutoSave(120);
}

/**
 * 公開から指定日数（デフォルト7日＝1週間）経過したニュースを自動削除する
 */
function pruneExpiredNewsItems(maxAgeDays = 7) {
  if (!Array.isArray(gameState.newsFeed)) {
    gameState.newsFeed = [];
    return;
  }
  const curDay = gameState.currentDayIndex || 0;
  const curSeason = gameState.season || 1;
  const beforeLen = gameState.newsFeed.length;
  gameState.newsFeed = gameState.newsFeed.filter(item => {
    if (!item) return false;
    const itemSeason = item.season || curSeason;
    const itemDay = Number(item.dayIndex || 0);
    if (itemSeason < curSeason - 1) return false;
    if (itemSeason === curSeason || itemDay < 0) {
      const age = curDay - itemDay;
      return age >= 0 && age < maxAgeDays;
    }
    const approxAge = curDay + 330 - itemDay;
    return approxAge >= 0 && approxAge < maxAgeDays;
  });
  if (gameState.newsFeed.length !== beforeLen && gameState.expandedNewsId) {
    if (!gameState.newsFeed.some(n => n && n.id === gameState.expandedNewsId)) {
      gameState.expandedNewsId = null;
    }
  }
}

/**
 * ニュースフィードに記事を追加する（最大40件・7日間保持）
 */
function addNewsItem({ category = 'リーグ', headline = '', lead = '', body = '', highlight = false, clubId = null, playerId = null, actionLabel = '' }) {
  pruneExpiredNewsItems(7);
  const dayObj = typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null;
  const fullDateLabel = dayObj ? `${dayObj.year}年${dayObj.month}月${dayObj.day}日` : getCurrentCommDateLabel();
  const item = {
    id: `news_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: getCurrentCommDateLabel(),
    fullDate: fullDateLabel,
    dayIndex: gameState.currentDayIndex || 0,
    season: gameState.season || 1,
    category,
    headline,
    lead: lead || '',
    body,
    clubId: clubId || null,
    playerId: playerId || null,
    actionLabel: actionLabel || (body ? '本文を読む' : ''),
    highlight: Boolean(highlight)
  };
  gameState.newsFeed.unshift(item);
  if (gameState.newsFeed.length > 40) {
    gameState.newsFeed = gameState.newsFeed.slice(0, 40);
  }
  return item;
}

/**
 * 試合終了後のクラブ・注目選手スポーツニュース生成（試合詳報・選手特集）
 */
function emitPostMatchTeamAndPlayerNews(playerClub, matchData, oppClub, myScore, oppScore, userWon, userDraw) {
  if (!playerClub || !matchData || typeof addNewsItem !== 'function') return;
  const oppName = oppClub ? oppClub.name : '対戦相手';
  const compLabel = matchData.compTitle || (matchData.week ? `第${matchData.week}節` : '公式戦');

  let matchHeadline = `${playerClub.name}、${oppName}と痛み分け　次戦での巻き返し期す`;
  let matchLead = `${compLabel} · 試合詳報`;
  if (userWon) {
    if (myScore - oppScore === 1) {
      matchHeadline = `${playerClub.name}、僅差をものに　1点上回って${oppName}撃破`;
    } else if (oppScore === 0) {
      matchHeadline = `${playerClub.name}がリード守る完封白星　${oppName}を退ける`;
    } else {
      matchHeadline = `${playerClub.name}、攻守かみ合い快勝　${oppName}を下す`;
    }
  } else if (!userDraw) {
    matchHeadline = `${playerClub.name}、${oppName}に${myScore}-${oppScore}で惜敗　課題修正へ`;
  }
  addNewsItem({
    category: 'チーム',
    clubId: playerClub.id,
    headline: matchHeadline,
    lead: matchLead,
    body: `${compLabel}の${oppName}戦（${matchData.isPlayerHome ? 'ホーム' : 'アウェイ'}）は${myScore}-${oppScore}で決着。${matchData.momPlayer ? `MOMには ${matchData.momPlayer.name} が選出された。` : '選手たちは次の公式戦へ向けコンディション調整に入る。'}`,
    actionLabel: '試合詳報',
    highlight: userWon
  });

  // 2. 注目選手のピックアップ記事（MOM、得点者、または出場を重ねる選手）
  const activePlayers = (playerClub.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));
  let spotlight = null;
  if (matchData.momPlayer && matchData.momClub && matchData.momClub.id === playerClub.id) {
    spotlight = activePlayers.find(p => p.id === matchData.momPlayer.id) || null;
  }
  if (!spotlight && activePlayers.length > 0) {
    const scorersOrStarters = activePlayers.filter(p => p.isStarter || (p.goals || 0) > 0 || (p.appearances || 0) >= 2);
    const pool = scorersOrStarters.length > 0 ? scorersOrStarters : activePlayers;
    spotlight = [...pool].sort((a, b) => (b.goals || 0) * 5 + getPlayerOverallRating(b) - ((a.goals || 0) * 5 + getPlayerOverallRating(a)))[0];
  }

  if (spotlight && ((gameState.totalPlayerMatchesPlayed || 0) % 2 === 1 || userWon || (matchData.momPlayer && matchData.momPlayer.id === spotlight.id))) {
    const ovr = getPlayerOverallRating(spotlight);
    const avgRat = (spotlight.appearances || 0) > 0 && spotlight.totalRating
      ? (spotlight.totalRating / spotlight.appearances).toFixed(2)
      : null;
    if ((spotlight.age || 25) <= 21) {
      addNewsItem({
        category: '選手',
        clubId: playerClub.id,
        playerId: spotlight.id,
        headline: `${playerClub.name}・${spotlight.name}、大舞台で意地見せる　単独取材に応じる`,
        lead: `${playerClub.name} · ${spotlight.age}歳 · ${spotlight.pos}`,
        body: `期待の若手 ${spotlight.fullName || spotlight.name}（${spotlight.age}歳 / OVR ${ovr}）が${compLabel}でも高い存在感を示した。「1試合ごとに手応えが増している」とさらなる活躍を誓った。`,
        highlight: true
      });
    } else if ((spotlight.appearances || 0) >= 3) {
      addNewsItem({
        category: '選手',
        clubId: playerClub.id,
        playerId: spotlight.id,
        headline: `${playerClub.name}・${spotlight.name}が先発を重ねる　直近${spotlight.appearances}試合の足跡`,
        lead: `先発出場を重ね、今季 ${spotlight.appearances}試合${spotlight.goals || 0}得点${avgRat ? ` (平均評価 ${avgRat})` : ''}`,
        body: `攻撃とゲームメイクの要を担う ${spotlight.fullName || spotlight.name}（${spotlight.pos} / OVR ${ovr}）が安定したパフォーマンスを継続。${playerClub.name}の上位躍進を支えている。`,
        highlight: true
      });
    } else {
      addNewsItem({
        category: '選手',
        clubId: playerClub.id,
        playerId: spotlight.id,
        headline: `${playerClub.name}・${spotlight.name}がピッチで存在感　仕上がりの良さ示す`,
        lead: `${spotlight.pos} · ${spotlight.age}歳 · OVR ${ovr}`,
        body: `${compLabel}の${oppName}戦に出場した ${spotlight.fullName || spotlight.name} が攻守にわたり精力的な動きを披露。今後の主力起用に向けて好アピールとなった。`,
        highlight: false
      });
    }
  }
}

/**
 * 初回起動・新規キャリア・旧セーブ補完時の初期メッセージ＆ニュースを生成
 */
function ensureInitialOfficeMessagesAndNews() {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub) return;
  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: 'C. Bennett', roleLabel: 'チーフセクレタリー' };

  if (!Array.isArray(gameState.inboxMessages)) gameState.inboxMessages = [];
  if (!Array.isArray(gameState.newsFeed)) gameState.newsFeed = [];

  if (gameState.inboxMessages.length === 0) {
    const divLabel = (typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision()) ? 'ENG-D2' : 'ENG-D1';
    addInboxMessage({
      senderType: 'secretary',
      senderName: sec.name,
      title: `GM就任のご挨拶と業務開始のご案内`,
      body: `${gameState.gmName || 'GM'}様、${playerClub.name}へのご就任おめでとうございます。${sec.roleLabel}を務めます${sec.name}です。今シーズンのクラブ目標は「${playerClub.targetLabel || '上位進出'}」（${divLabel}）となっております。日々の進行や重要な報告はすべて私から共有いたします。`,
      actionType: 'goto-pitch',
      actionLabel: '作戦ボードを確認'
    });
  }

  if (gameState.newsFeed.length === 0) {
    const divLabel = (typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision()) ? 'ENG-D2' : 'ENG-D1';
    const ace = [...(playerClub.players || [])].sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a))[0];
    if (ace) {
      addNewsItem({
        category: '選手',
        clubId: playerClub.id,
        playerId: ace.id,
        headline: `${playerClub.name}の主軸 ${ace.name}、新体制での飛躍誓う　開幕へ順調`,
        lead: `${playerClub.name} · ${ace.age}歳 · ${ace.pos} (OVR ${getPlayerOverallRating(ace)})`,
        body: `新シーズン始動を迎えた${playerClub.name}でエース格の${ace.fullName || ace.name}が充実の動きを見せた。「目標である${playerClub.targetLabel || '上位進出'}へ向けて準備は整っている」と意気込みを語った。`,
        highlight: true
      });
    }
    addNewsItem({
      category: 'チーム',
      clubId: playerClub.id,
      headline: `${playerClub.name}が新GMに${gameState.gmName || 'L. Vance'}氏を迎えて始動`,
      lead: `${divLabel}開幕見通し · 目標 ${playerClub.targetLabel || '上位進出'}`,
      body: `${divLabel}所属の${playerClub.name}は新体制でプレシーズンおよび夏の移籍市場に突入した。目標「${playerClub.targetLabel || '上位進出'}」へ向けた補強と戦術整備に注目が集まる。`,
      highlight: true
    });
  }
}

/**
 * 監督からの補強希望（手薄なポジション＋推薦選手2〜3名）を算出し受信箱へ送付
 */
function generateAndSendManagerWishReport(contextLabel = '補強方針ミーティング') {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub || !playerClub.manager || typeof evaluateManagerReinforcementWishes !== 'function') return null;

  const wish = evaluateManagerReinforcementWishes(playerClub);
  if (!wish) return null;
  gameState.managerWishes = wish;

  const mgr = playerClub.manager;
  const posListText = wish.positions.join('・');
  const reasonText = (wish.reasons || []).join(' ／ ');
  const candSummary = (wish.candidates && wish.candidates.length > 0)
    ? `スカウトデータも踏まえ、予算内で獲得を狙える具体的な推薦選手を${wish.candidates.length}名ピックアップしました。`
    : '現有予算に合う対象選手が見つかり次第、移籍市場タブからご検討ください。';

  addInboxMessage({
    senderType: 'manager',
    senderName: `${mgr.name} 監督`,
    title: `補強要望：${posListText}の戦力強化（${contextLabel}）`,
    body: `私の得意布陣（${wish.formation}）を最大限に機能させるため、${posListText}の補強を希望します。理由：${reasonText}。${candSummary}`,
    actionType: 'goto-market',
    actionLabel: '移籍市場を開く',
    candidatePlayers: wish.candidates || []
  });

  return wish;
}

/**
 * 選手獲得成立時に、監督の補強希望（推薦選手または希望ポジション本適性）を達成したか判定し信頼度を上昇させる
 */
function checkAndRewardManagerWishOnSigning(signedPlayer, dealType = 'buy') {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const wish = gameState.managerWishes;
  if (!playerClub || !playerClub.manager || !signedPlayer || !wish || wish.fulfilled) return false;

  const mgr = playerClub.manager;
  const normPos = (pos) => (pos === 'LWB' ? 'LB' : (pos === 'RWB' ? 'RB' : (pos === 'ST' ? 'CF' : pos)));
  if (typeof ensurePlayerProficiencies === 'function') ensurePlayerProficiencies(signedPlayer);
  const mains = (Array.isArray(signedPlayer.mainPositions) && signedPlayer.mainPositions.length > 0
    ? signedPlayer.mainPositions
    : [signedPlayer.primaryPosition || signedPlayer.pos]).map(normPos);

  const isRecommended = Array.isArray(wish.candidates) && wish.candidates.some(c => c && c.playerId === signedPlayer.id);
  const matchedPos = (wish.positions || []).find(tp => mains.includes(tp));
  if (!isRecommended && !matchedPos) return false;

  const ovr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(signedPlayer) : 70;
  if (!isRecommended && ovr < 64) return false;

  const trustBonus = isRecommended ? 10 : 6;
  const prevTrust = typeof mgr.trust === 'number' ? mgr.trust : 80;
  mgr.trust = clamp(prevTrust + trustBonus, 0, 100);
  wish.fulfilled = true;
  wish.fulfilledPlayerName = signedPlayer.name;
  wish.fulfilledByRecommendation = isRecommended;

  const bonusLabel = isRecommended ? '推薦選手のピンポイント獲得' : `希望ポジション(${matchedPos})の補強`;
  addDailyLog(`【監督信頼度+${trustBonus}】${mgr.name}監督が ${signedPlayer.name} の獲得（${bonusLabel}）を歓迎しています（信頼度 ${mgr.trust}%）。`);
  addInboxMessage({
    senderType: 'manager',
    senderName: `${mgr.name} 監督`,
    title: `補強への謝意：${signedPlayer.name} の加入を歓迎`,
    body: isRecommended
      ? `私が推薦した ${signedPlayer.name}（${signedPlayer.pos} / OVR ${ovr}）の獲得に尽力いただきありがとうございます。構想に完璧に合致する戦力です。（監督信頼度 +${trustBonus} ➔ ${mgr.trust}%）`
      : `要望していた ${matchedPos} への ${signedPlayer.name}（OVR ${ovr}）獲得ありがとうございます。チーム競争力と層の厚みが大きく改善しました。（監督信頼度 +${trustBonus} ➔ ${mgr.trust}%）`,
    actionType: 'goto-pitch',
    actionLabel: '作戦ボードで起用'
  });

  if (typeof showSecretaryModal === 'function') {
    const wishDetailRows = [
      `<div class="gm-modal-flat-row"><span class="gm-modal-flat-label">加入選手</span><span class="gm-modal-flat-val accent-green">${escapeCommHtml(signedPlayer.name)} (${escapeCommHtml(signedPlayer.pos)} / OVR ${ovr})</span></div>`,
      `<div class="gm-modal-flat-row"><span class="gm-modal-flat-label">達成項目</span><span class="gm-modal-flat-val">${escapeCommHtml(bonusLabel)}</span></div>`,
      `<div class="gm-modal-flat-row"><span class="gm-modal-flat-label">監督信頼度 (${escapeCommHtml(mgr.name)})</span><span class="gm-modal-flat-val accent-green">+${trustBonus} ➔ ${mgr.trust}%</span></div>`
    ];
    showSecretaryModal({
      topic: '監督補強要望の達成',
      title: `${signedPlayer.name} の加入を監督が歓迎`,
      speech: `GM、${signedPlayer.name}選手の獲得お疲れさまです。${mgr.name}監督から「${isRecommended ? '推薦した狙い通りの戦力だ' : `${matchedPos}の厚みが大きく改善した`}」と感謝のメッセージが届いています。`,
      detailHtml: `<div class="gm-modal-flat-list">${wishDetailRows.join('')}</div>`,
      actions: [
        {
          label: '作戦ボードで起用する',
          className: 'btn btn-secondary',
          onClick: () => {
            if (typeof switchTab === 'function') switchTab('roster');
            if (typeof switchRosterSubtab === 'function') switchRosterSubtab('board');
          }
        },
        {
          label: '確認して閉じる',
          className: 'btn btn-primary',
          onClick: () => { if (typeof renderAll === 'function') renderAll(); }
        }
      ]
    });
  }
  return true;
}

function ensureMonthlyLedger(forceReset = false, customDay = null) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const day = customDay || (typeof getCurrentCalendarDay === 'function' ? getCurrentCalendarDay() : null);
  const year = day ? day.year : (2025 + (gameState.season || 1));
  const month = day ? day.month : 7;
  if (!gameState.monthlyLedger || forceReset) {
    gameState.monthlyLedger = {
      year,
      month,
      startFunds: playerClub ? (playerClub.funds || 0) : 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      matchIncome: 0,
      payrollPaid: 0,
      transferInFee: 0,
      transferOutFee: 0,
      supportersDelta: 0,
      matches: []
    };
  }
  return gameState.monthlyLedger;
}

function findNextScheduledPlayerMatch() {
  if (gameState.isSeasonOver || !Array.isArray(gameState.calendar)) return null;
  const startIdx = Math.max(0, (gameState.currentDayIndex || 0) + 1);
  for (let i = startIdx; i < gameState.calendar.length; i++) {
    const d = gameState.calendar[i];
    if (!d || d.played) continue;
    const mInfo = typeof getCalendarDayPlayerMatch === 'function' ? getCalendarDayPlayerMatch(d) : null;
    if (mInfo && mInfo.oppClub && !mInfo.played) {
      return {
        day: d,
        daysAhead: Math.max(1, i - (gameState.currentDayIndex || 0)),
        matchInfo: mInfo
      };
    }
  }
  return null;
}

function swapStarterWithCandidate(club, outStarter, inCandidate) {
  if (!club || !outStarter || !inCandidate || outStarter.id === inCandidate.id) return false;
  const targetSlot = outStarter.slotIndex;
  const targetAssignedPos = outStarter.assignedPos || outStarter.pos;
  outStarter.isStarter = false;
  outStarter.isBench = true;
  outStarter.slotIndex = null;
  outStarter.assignedPos = null;

  inCandidate.isStarter = true;
  inCandidate.isBench = false;
  inCandidate.slotIndex = targetSlot;
  inCandidate.assignedPos = targetAssignedPos;
  if (typeof ensureValidSquadAndStarters === 'function') {
    ensureValidSquadAndStarters(club);
  }
  return true;
}

function optimizeStarterPositionSlot(club, player) {
  if (!club || !player || !player.isStarter || (player.slotIndex || 0) === 0) return false;
  const curSlotPos = player.assignedPos || player.pos;
  if (curSlotPos === player.pos) return false;
  const starters = (club.players || []).filter(p => p && p.isStarter && (p.slotIndex || 0) > 0 && p.id !== player.id);
  const partner = starters.find(s => (s.assignedPos || s.pos) === player.pos && getPositionFitInfo(s, curSlotPos).type !== 'out');
  if (partner) {
    const pSlot = partner.slotIndex;
    const pPos = partner.assignedPos || partner.pos;
    partner.slotIndex = player.slotIndex;
    partner.assignedPos = curSlotPos;
    player.slotIndex = pSlot;
    player.assignedPos = pPos;
    if (typeof ensureValidSquadAndStarters === 'function') ensureValidSquadAndStarters(club);
    return true;
  }
  return false;
}

function buildManagerConsultation(club) {
  if (!club || !club.manager) return null;
  const mgr = club.manager;
  const active = (club.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut) && (p.injuryWeeks || 0) === 0);
  const starters = active.filter(p => p.isStarter && (p.slotIndex || 0) > 0);
  const nonStarters = active.filter(p => !p.isStarter && p.pos !== 'GK');

  // 1. 疲労または適性外スタメンの入れ替え相談
  const troubledStarter = [...starters]
    .filter(s => (s.fatigue || 0) >= 45 || getPositionFitInfo(s, s.assignedPos || s.pos).type === 'out')
    .sort((a, b) => (b.fatigue || 0) - (a.fatigue || 0))[0] || null;
  if (troubledStarter && nonStarters.length > 0) {
    const slotPos = troubledStarter.assignedPos || troubledStarter.pos;
    const candidate = [...nonStarters].sort((a, b) => {
      const fitA = getPositionFitInfo(a, slotPos).type === 'main' ? 12 : (getPositionFitInfo(a, slotPos).type === 'sub' ? 5 : 0);
      const fitB = getPositionFitInfo(b, slotPos).type === 'main' ? 12 : (getPositionFitInfo(b, slotPos).type === 'sub' ? 5 : 0);
      return (getPlayerOverallRating(b) + fitB - (b.fatigue || 0) * 0.25) - (getPlayerOverallRating(a) + fitA - (a.fatigue || 0) * 0.25);
    })[0];
    if (candidate) {
      const cOvr = getPlayerOverallRating(candidate);
      const tOvr = getPlayerOverallRating(troubledStarter);
      const reasonTxt = (troubledStarter.fatigue || 0) >= 45
        ? `疲労が ${Math.round(troubledStarter.fatigue)}% まで蓄積`
        : `[${slotPos}] の適性外起用で負荷が発生`;
      return {
        id: `consult_mgr_${Date.now()}`,
        kind: 'manager',
        scenario: 'M1',
        senderName: `${mgr.name} 監督`,
        topic: '起用法相談',
        title: `${mgr.name}監督：スタメン起用の見直し提案`,
        speech: `GM、次戦に向けて相談がある。${troubledStarter.fullName || troubledStarter.name} に${reasonTxt}しているため、フレッシュな ${candidate.fullName || candidate.name}（${candidate.pos} / OVR ${cOvr}）を先発に抜擢させてくれないか。`,
        dutyTitle: `${mgr.name}監督の起用法相談`,
        dutyDesc: `${candidate.name} の先発抜擢について回答待ち`,
        outPlayerId: troubledStarter.id,
        inPlayerId: candidate.id,
        detailRows: [
          ['相談者', `${mgr.name} 監督（信頼度 ${mgr.trust ?? 75}%）`],
          ['交代推奨 (OUT)', `${troubledStarter.pos} ${troubledStarter.fullName || troubledStarter.name}（OVR ${tOvr} / 疲労 ${Math.round(troubledStarter.fatigue || 0)}%）`],
          ['起用推奨 (IN)', `${candidate.pos} ${candidate.fullName || candidate.name}（OVR ${cOvr} / 疲労 ${Math.round(candidate.fatigue || 0)}%）`]
        ],
        acceptLabel: `監督案を採用（${candidate.name} を先発起用）`
      };
    }
  }

  // 2. 得意布陣・戦術スタイル同期相談
  const curForm = club.formation || '4-3-3';
  const curTac = typeof normalizeTacticKey === 'function' ? normalizeTacticKey(club.tactic) : club.tactic;
  const prefTac = typeof normalizeTacticKey === 'function' ? normalizeTacticKey(mgr.preferredTactic) : mgr.preferredTactic;
  if ((curForm !== mgr.preferredFormation || curTac !== prefTac) && mgr.preferredFormation) {
    const tacLabel = typeof getManagerTacticLabel === 'function' ? getManagerTacticLabel(prefTac) : prefTac;
    return {
      id: `consult_mgr_${Date.now()}`,
      kind: 'manager',
      scenario: 'M3',
      senderName: `${mgr.name} 監督`,
      topic: '監督からの戦術・起用相談',
      title: `${mgr.name}監督：得意フォーメーションへの移行相談`,
      speech: `GM、選手たちの持ち味を最大限に引き出すため、私の得意布陣「${mgr.preferredFormation} / ${tacLabel}」へ切り替えて戦いたい。フロントとして承認してもらえるだろうか。`,
      dutyTitle: `${mgr.name}監督の戦術・起用相談`,
      dutyDesc: `${mgr.preferredFormation} / ${tacLabel} への調整相談`,
      preferredFormation: mgr.preferredFormation,
      preferredTactic: prefTac,
      detailRows: [
        ['相談者', `${mgr.name} 監督（信頼度 ${mgr.trust ?? 75}%）`],
        ['現行体制', `${curForm} / ${typeof getManagerTacticLabel === 'function' ? getManagerTacticLabel(curTac) : curTac}`],
        ['監督提案', `${mgr.preferredFormation} / ${tacLabel}`]
      ],
      acceptLabel: `提案を採用（${mgr.preferredFormation} / ${tacLabel} へ変更）`
    };
  }

  // 3. 若手・好調控えの先発テスト起用相談
  if (starters.length > 0 && nonStarters.length > 0) {
    const candidate = [...nonStarters].sort((a, b) => {
      const yA = (a.age || 25) <= 22 ? 6 : 0;
      const yB = (b.age || 25) <= 22 ? 6 : 0;
      return (getPlayerOverallRating(b) + yB) - (getPlayerOverallRating(a) + yA);
    })[0];
    const replaceStarter = [...starters].sort((a, b) => {
      const mA = getPositionFitInfo(candidate, a.assignedPos || a.pos).type === 'main' ? -8 : 0;
      const mB = getPositionFitInfo(candidate, b.assignedPos || b.pos).type === 'main' ? -8 : 0;
      return (getPlayerOverallRating(a) + mA) - (getPlayerOverallRating(b) + mB);
    })[0];
    if (candidate && replaceStarter) {
      const cOvr = getPlayerOverallRating(candidate);
      const tOvr = getPlayerOverallRating(replaceStarter);
      return {
        id: `consult_mgr_${Date.now()}`,
        kind: 'manager',
        scenario: 'M2',
        senderName: `${mgr.name} 監督`,
        topic: '起用法相談',
        title: `${mgr.name}監督：${candidate.name}の先発テスト起用提案`,
        speech: `GM、直近の練習で抜群の動きを見せている ${candidate.fullName || candidate.name}（${candidate.age}歳 / OVR ${cOvr}）を次戦の先発で試してみたい。抜擢を認めてもらえるか。`,
        dutyTitle: `${mgr.name}監督の起用法相談`,
        dutyDesc: `${candidate.name} の先発抜擢提案`,
        outPlayerId: replaceStarter.id,
        inPlayerId: candidate.id,
        detailRows: [
          ['相談者', `${mgr.name} 監督（信頼度 ${mgr.trust ?? 75}%）`],
          ['抜擢候補 (IN)', `${candidate.pos} ${candidate.fullName || candidate.name}（${candidate.age}歳 / OVR ${cOvr}）`],
          ['入替枠 (OUT)', `${replaceStarter.pos} ${replaceStarter.fullName || replaceStarter.name}（OVR ${tOvr}）`]
        ],
        acceptLabel: `監督案を採用（${candidate.name} を先発抜擢）`
      };
    }
  }
  return null;
}

function buildPlayerConsultation(club) {
  if (!club) return null;
  const active = (club.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut) && (p.injuryWeeks || 0) === 0);
  const starters = active.filter(p => p.isStarter && (p.slotIndex || 0) > 0);

  // 1. 本職外で起用中の主力からの希望ポジション相談
  const outPosStarter = starters.find(s => {
    const slotPos = s.assignedPos || s.pos;
    if (slotPos === s.pos) return false;
    return starters.some(other => other.id !== s.id && (other.assignedPos || other.pos) === s.pos && getPositionFitInfo(other, slotPos).type !== 'out');
  });
  if (outPosStarter) {
    const curPos = outPosStarter.assignedPos || outPosStarter.pos;
    return {
      id: `consult_ply_${Date.now()}`,
      kind: 'player',
      scenario: 'P2',
      senderName: `${outPosStarter.name} (${outPosStarter.pos})`,
      topic: '起用法の相談',
      title: `${outPosStarter.fullName || outPosStarter.name}：本職ポジションでの起用要望`,
      speech: `GM、今お時間よろしいでしょうか。現在は ${curPos} を任されていますが、自分の持ち味を最も発揮できるのは本職の ${outPosStarter.pos} です。次戦から本職ポジションでプレーさせてもらえませんか。`,
      dutyTitle: `${outPosStarter.name} の起用法要望`,
      dutyDesc: `本職 ${outPosStarter.pos} 起用の調整要望`,
      playerId: outPosStarter.id,
      detailRows: [
        ['要望選手', `#${outPosStarter.squadNumber || '-'} ${outPosStarter.fullName || outPosStarter.name}（OVR ${getPlayerOverallRating(outPosStarter)}）`],
        ['現在の配置', `${curPos}（本職 ${outPosStarter.pos}）`],
        ['士気 (Morale)', `${Math.round(outPosStarter.morale ?? 75)}`]
      ],
      acceptLabel: `本職 ${outPosStarter.pos} へ配置を調整する`
    };
  }

  // 2. 控え・ベンチ外実力者からの先発起用直訴
  const benchHopefuls = active.filter(p => !p.isStarter && p.pos !== 'GK')
    .sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  if (benchHopefuls.length > 0 && starters.length > 0) {
    const requester = benchHopefuls[0];
    const rOvr = getPlayerOverallRating(requester);
    const outStarter = [...starters].sort((a, b) => {
      const mA = getPositionFitInfo(requester, a.assignedPos || a.pos).type === 'main' ? -8 : 0;
      const mB = getPositionFitInfo(requester, b.assignedPos || b.pos).type === 'main' ? -8 : 0;
      return (getPlayerOverallRating(a) + mA) - (getPlayerOverallRating(b) + mB);
    })[0];
    if (outStarter) {
      return {
        id: `consult_ply_${Date.now()}`,
        kind: 'player',
        scenario: 'P1',
        senderName: `${requester.name} (${requester.pos})`,
        topic: '起用法の相談',
        title: `${requester.fullName || requester.name}：先発メンバー入り直訴`,
        speech: `GM、直接お話ししたいことがあります。今は控えに回っていますが、身体のキレも集中力も万全です。チームを勝利へ導く準備はできているので、次の試合でスタメンを任せてください。`,
        dutyTitle: `${requester.name} の先発起用要望`,
        dutyDesc: `スタメン出場機会についての面談`,
        playerId: requester.id,
        inPlayerId: requester.id,
        outPlayerId: outStarter.id,
        detailRows: [
          ['要望選手 (IN)', `#${requester.squadNumber || '-'} ${requester.fullName || requester.name}（${requester.pos} / OVR ${rOvr}）`],
          ['競合スタメン', `#${outStarter.squadNumber || '-'} ${outStarter.fullName || outStarter.name}（OVR ${getPlayerOverallRating(outStarter)}）`],
          ['士気 / 状態', `Morale ${Math.round(requester.morale ?? 75)} · 疲労 ${Math.round(requester.fatigue || 0)}%`]
        ],
        acceptLabel: `次戦スタメン抜擢（${requester.name}）`
      };
    }
  }
  return null;
}

function getClubCoachEntries(club) {
  if (!club || !club.coaches || typeof club.coaches !== 'object') return [];
  const entries = [];
  (Array.isArray(club.coaches.attacking) ? club.coaches.attacking : []).forEach(c => {
    if (c) entries.push({ coach: c, category: 'attacking', roleLabel: '攻撃コーチ' });
  });
  (Array.isArray(club.coaches.defending) ? club.coaches.defending : []).forEach(c => {
    if (c) entries.push({ coach: c, category: 'defending', roleLabel: '守備コーチ' });
  });
  if (club.coaches.fitness) {
    entries.push({ coach: club.coaches.fitness, category: 'fitness', roleLabel: 'フィジカルコーチ' });
  }
  if (club.coaches.goalkeeping) {
    entries.push({ coach: club.coaches.goalkeeping, category: 'goalkeeping', roleLabel: 'GKコーチ' });
  }
  return entries;
}

function buildConflictArbitrationEvent(club) {
  if (!club || !club.manager) return null;
  const mgr = club.manager;
  const coaches = getClubCoachEntries(club);
  if (coaches.length === 0) return null;

  const active = (club.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut) && (p.injuryWeeks || 0) === 0);
  const starters = active.filter(p => p.isStarter && (p.slotIndex || 0) > 0);
  const nonStarters = active.filter(p => !p.isStarter && p.pos !== 'GK');
  const avgStarterFatigue = starters.length > 0
    ? Math.round(starters.reduce((sum, p) => sum + (p.fatigue || 0), 0) / starters.length)
    : 0;

  const youngHopeful = [...nonStarters].filter(p => (p.age || 25) <= 22)
    .sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a))[0];
  const vetStarter = [...starters].filter(p => (p.age || 25) >= 28)
    .sort((a, b) => getPlayerOverallRating(a) - getPlayerOverallRating(b))[0];

  const fitnessEntry = coaches.find(e => e.category === 'fitness') || coaches[0];
  const tacEntries = coaches.filter(e => e.category === 'attacking' || e.category === 'defending');
  const tacEntry = tacEntries[(gameState.consultationSeq || 0) % Math.max(1, tacEntries.length)] || coaches[0];

  const preferScenario = (avgStarterFatigue >= 28 || ((gameState.consultationSeq || 0) % 3 === 0))
    ? 'C1'
    : (youngHopeful && vetStarter && ((gameState.consultationSeq || 0) % 2 === 1))
      ? 'C3'
      : 'C2';

  if (preferScenario === 'C3' && youngHopeful && vetStarter) {
    const cEntry = tacEntry;
    const yOvr = getPlayerOverallRating(youngHopeful);
    const vOvr = getPlayerOverallRating(vetStarter);
    return {
      id: `consult_conf_${Date.now()}`,
      kind: 'conflict',
      scenario: 'C3',
      senderName: `${mgr.name} 監督 × ${cEntry.coach.name} ${cEntry.roleLabel}`,
      topic: '意見対立の仲裁',
      title: '起用路線の対立：ベテラン主軸 vs 若手抜擢',
      speech: `GM、次戦の選手起用で ${cEntry.coach.fullName || cEntry.coach.name} ${cEntry.roleLabel} と意見が割れています。経験豊富な ${vetStarter.name} で手堅くいくか、勢いのある若手 ${youngHopeful.name} を抜擢すべきか、最終判断をお願いします。`,
      dutyTitle: '監督・コーチの意見対立仲裁',
      dutyDesc: `${mgr.name}監督と${cEntry.coach.name}の起用方針を裁定`,
      coachId: cEntry.coach.id,
      coachCategory: cEntry.category,
      coachName: cEntry.coach.name,
      coachRoleLabel: cEntry.roleLabel,
      inPlayerId: youngHopeful.id,
      outPlayerId: vetStarter.id,
      mgrStanceTitle: `${mgr.name} 監督の主張`,
      mgrStanceBody: `大一番では経験値と計算できる試合運びが不可欠。${vetStarter.fullName || vetStarter.name}（${vetStarter.age}歳 / OVR ${vOvr}）を軸に据え続けるべき。`,
      coachStanceTitle: `${cEntry.coach.fullName || cEntry.coach.name}（${cEntry.roleLabel}）の主張`,
      coachStanceBody: `練習での伸びと推進力は ${youngHopeful.fullName || youngHopeful.name}（${youngHopeful.age}歳 / OVR ${yOvr}）が上。今こそ先発抜擢で活性化すべき。`,
      impactSummary: '監督支持：信頼度+5・先発士気UP ／ コーチ採用：若手抜擢＆士気+10 ／ 仲裁：双方安定',
      acceptLabel: `${mgr.name}監督を支持（ベテラン軸を維持）`,
      coachAcceptLabel: `${cEntry.coach.name}コーチ案を採用（${youngHopeful.name} を抜擢）`,
      mediateLabel: '段階的起用の折衷案で仲裁する'
    };
  }

  if (preferScenario === 'C2') {
    const isAtk = tacEntry.category === 'attacking';
    const secLabel = isAtk ? '攻撃ユニット' : '守備ユニット';
    return {
      id: `consult_conf_${Date.now()}`,
      kind: 'conflict',
      scenario: 'C2',
      senderName: `${mgr.name} 監督 × ${tacEntry.coach.name} ${tacEntry.roleLabel}`,
      topic: '意見対立の仲裁',
      title: `戦術調整の衝突：全体バランス vs ${secLabel}強化`,
      speech: `GM、今週のトレーニングと戦術重点を巡って私と ${tacEntry.coach.fullName || tacEntry.coach.name} ${tacEntry.roleLabel} の主張が平行線をたどっています。チーム全体としてどちらを優先すべきか裁定してください。`,
      dutyTitle: '監督・コーチの戦術対立仲裁',
      dutyDesc: `${mgr.name}監督と${tacEntry.coach.name}の調整方針を裁定`,
      coachId: tacEntry.coach.id,
      coachCategory: tacEntry.category,
      coachName: tacEntry.coach.name,
      coachRoleLabel: tacEntry.roleLabel,
      mgrStanceTitle: `${mgr.name} 監督の主張`,
      mgrStanceBody: '特定の局面に偏らず、既存のチーム規律と攻守全体の連動性を最優先で仕上げたい。',
      coachStanceTitle: `${tacEntry.coach.fullName || tacEntry.coach.name}（${tacEntry.roleLabel}）の主張`,
      coachStanceBody: isAtk
        ? '決定力と前線の連係が勝敗を分ける。攻撃陣に特化した崩しのメニューへ比重を移すべきだ。'
        : '失点を減らさなければ上位は望めない。守備ブロックと球際の徹底に時間を割くべきだ。',
      impactSummary: `監督支持：信頼度+5・先発士気UP ／ コーチ採用：${secLabel}士気+7 ／ 仲裁：全体士気UP`,
      acceptLabel: `${mgr.name}監督を支持（全体規律を優先）`,
      coachAcceptLabel: `${tacEntry.coach.name}コーチ案を採用（${secLabel}を集中強化）`,
      mediateLabel: '全体戦術と個別パートを併設して仲裁'
    };
  }

  // Scenario C1: トレーニング強度・過密疲労対立
  return {
    id: `consult_conf_${Date.now()}`,
    kind: 'conflict',
    scenario: 'C1',
    senderName: `${mgr.name} 監督 × ${fitnessEntry.coach.name} ${fitnessEntry.roleLabel}`,
    topic: '意見対立の仲裁',
    title: '調整方針の対立：練習強度維持 vs 疲労回復優先',
    speech: `GM、次節に向けた調整メニューについて ${fitnessEntry.coach.fullName || fitnessEntry.coach.name} ${fitnessEntry.roleLabel} と対立しています。強度の高い戦術練習を貫くべきか、回復優先へ切り替えるべきか判断を仰ぎたい。`,
    dutyTitle: '監督・コーチの調整方針仲裁',
    dutyDesc: `強度維持か疲労軽減か、GMによる仲裁待ち`,
    coachId: fitnessEntry.coach.id,
    coachCategory: fitnessEntry.category,
    coachName: fitnessEntry.coach.name,
    coachRoleLabel: fitnessEntry.roleLabel,
    mgrStanceTitle: `${mgr.name} 監督の主張`,
    mgrStanceBody: `主力平均疲労は ${avgStarterFatigue}% だが勝負どころ。実戦形式の強度を落とさず勝点を取り切る準備を続けたい。`,
    coachStanceTitle: `${fitnessEntry.coach.fullName || fitnessEntry.coach.name}（${fitnessEntry.roleLabel}）の主張`,
    coachStanceBody: 'このまま高負荷を続ければ筋肉系トラブルのリスクが急増する。強度を下げて疲労を抜くのが先決だ。',
    impactSummary: '監督支持：信頼度+5・先発士気+3（疲労増） ／ コーチ採用：全選手疲労-10回復 ／ 仲裁：バランス回復',
    acceptLabel: `${mgr.name}監督を支持（高強度調整を継続）`,
    coachAcceptLabel: `${fitnessEntry.coach.name}コーチ案を採用（疲労回復を優先）`,
    mediateLabel: '主力は軽め・控えは強めの負荷分散で仲裁'
  };
}

function buildLineupConsultationCandidate(club, forceType = null) {
  if (!club) return null;
  if (forceType === 'player') {
    return buildPlayerConsultation(club);
  }
  if (forceType === 'manager') {
    return buildManagerConsultation(club);
  }
  if (forceType === 'conflict') {
    return buildConflictArbitrationEvent(club);
  }
  const seqMod = (gameState.consultationSeq || 0) % 3;
  if (seqMod === 1) {
    return buildPlayerConsultation(club) || buildConflictArbitrationEvent(club) || buildManagerConsultation(club);
  }
  if (seqMod === 2) {
    return buildConflictArbitrationEvent(club) || buildManagerConsultation(club) || buildPlayerConsultation(club);
  }
  return buildManagerConsultation(club) || buildPlayerConsultation(club) || buildConflictArbitrationEvent(club);
}

function resolveLineupConsultationDecision(consultation, decision) {
  const club = getPlayerClub();
  if (!consultation || !club) return;

  if (decision === 'defer') {
    gameState.pendingLineupConsultation = consultation;
    if (consultation.kind !== 'conflict') {
      if (typeof switchTab === 'function') switchTab('roster');
      if (typeof switchRosterSubtab === 'function') switchRosterSubtab('board');
    }
    renderAll();
    return;
  }

  gameState.pendingLineupConsultation = null;
  const mgr = club.manager;
  const activePlayers = (club.players || []).filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut));

  if (consultation.kind === 'conflict') {
    if (decision === 'accept') {
      if (mgr) mgr.trust = Math.min(100, (mgr.trust ?? 75) + 5);
      activePlayers.filter(p => p.isStarter).forEach(p => {
        p.morale = Math.min(100, (p.morale || 75) + (consultation.scenario === 'C1' ? 3 : 4));
        if (consultation.scenario === 'C1') p.fatigue = Math.min(100, (p.fatigue || 0) + 3);
      });
      addDailyLog(`【スタッフ仲裁】${mgr ? mgr.name : '監督'}の方針を支持し、チームの統一感を優先しました（${consultation.coachName || 'コーチ'}には理解を求めました）。`);
    } else if (decision === 'coach' || decision === 'decline') {
      if (mgr) mgr.trust = Math.max(15, (mgr.trust ?? 75) - 3);
      if (consultation.scenario === 'C1') {
        activePlayers.forEach(p => {
          p.fatigue = Math.max(0, (p.fatigue || 0) - 10);
          if (p.isStarter) p.morale = Math.min(100, (p.morale || 75) + 2);
        });
        addDailyLog(`【スタッフ仲裁】${consultation.coachName || 'フィジカルコーチ'}の進言を採用し、負荷軽減によって主力のコンディションを回復しました。`);
      } else if (consultation.scenario === 'C3' && consultation.inPlayerId && consultation.outPlayerId) {
        const outP = club.players.find(p => p.id === consultation.outPlayerId);
        const inP = club.players.find(p => p.id === consultation.inPlayerId);
        if (outP && inP) {
          swapStarterWithCandidate(club, outP, inP);
          inP.morale = Math.min(100, (inP.morale || 75) + 10);
          outP.morale = Math.max(30, (outP.morale || 75) - 2);
          addDailyLog(`【スタッフ仲裁】${consultation.coachName || 'コーチ'}の推挙を採用し、若手 #${inP.squadNumber || '-'} ${inP.name} をスタメン抜擢しました。`);
        }
      } else {
        const isAtk = consultation.coachCategory === 'attacking';
        const targetPosSet = isAtk
          ? new Set(['ST', 'CF', 'LW', 'RW', 'LM', 'RM', 'CAM', 'AM'])
          : new Set(['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'DM', 'CM']);
        activePlayers.forEach(p => {
          if (targetPosSet.has(p.pos)) p.morale = Math.min(100, (p.morale || 75) + 7);
        });
        addDailyLog(`【スタッフ仲裁】${consultation.coachName || 'コーチ'}の提言を採用し、${isAtk ? '攻撃陣' : '守備陣'}の連携強化を重点実施しました。`);
      }
    } else if (decision === 'mediate') {
      if (mgr) mgr.trust = Math.min(100, (mgr.trust ?? 75) + 2);
      if (consultation.scenario === 'C1') {
        activePlayers.forEach(p => {
          if (p.isStarter) p.fatigue = Math.max(0, (p.fatigue || 0) - 5);
          else p.morale = Math.min(100, (p.morale || 75) + 4);
        });
        addDailyLog(`【スタッフ仲裁】GMの折衷案により主力は負荷を分散し、控え組の底上げも両立させました。`);
      } else {
        activePlayers.forEach(p => {
          p.morale = Math.min(100, (p.morale || 75) + 3);
        });
        addDailyLog(`【スタッフ仲裁】${mgr ? mgr.name : '監督'}と${consultation.coachName || 'コーチ'}の双方の意見を取り入れ、円満に妥協点を見出しました。`);
      }
    }
    renderAll();
    if (gameState.hasStartedOnce && typeof scheduleAutoSave === 'function') scheduleAutoSave(120);
    return;
  }

  if (decision === 'accept') {
    if (consultation.kind === 'manager') {
      if (consultation.scenario === 'M3') {
        club.formation = consultation.preferredFormation || club.formation;
        club.tactic = consultation.preferredTactic || club.tactic;
        if (typeof autoSelectStarters === 'function') autoSelectStarters(club);
        if (typeof ensureValidSquadAndStarters === 'function') ensureValidSquadAndStarters(club);
        addDailyLog(`【起用相談承認】${mgr ? mgr.name : '監督'}の提案を採用し、布陣を ${club.formation} へ調整しました。`);
      } else {
        const outP = club.players.find(p => p.id === consultation.outPlayerId);
        const inP = club.players.find(p => p.id === consultation.inPlayerId);
        if (outP && inP) {
          swapStarterWithCandidate(club, outP, inP);
          inP.morale = Math.min(100, (inP.morale || 75) + 8);
          addDailyLog(`【起用相談承認】${mgr ? mgr.name : '監督'}の推薦により #${inP.squadNumber || '-'} ${inP.name} をスタメンへ抜擢しました。`);
        }
      }
      if (mgr) mgr.trust = Math.min(100, (mgr.trust ?? 75) + 5);
    } else if (consultation.kind === 'player') {
      if (consultation.scenario === 'P2') {
        const p = club.players.find(x => x.id === consultation.playerId);
        if (p) {
          optimizeStarterPositionSlot(club, p);
          p.morale = Math.min(100, (p.morale || 75) + 9);
          addDailyLog(`【選手要望承認】#${p.squadNumber || '-'} ${p.name} を本職 [${p.pos}] へ再配置しました。`);
        }
      } else {
        const outP = club.players.find(p => p.id === consultation.outPlayerId);
        const inP = club.players.find(p => p.id === consultation.inPlayerId);
        if (outP && inP) {
          swapStarterWithCandidate(club, outP, inP);
          inP.morale = Math.min(100, (inP.morale || 75) + 12);
          addDailyLog(`【選手要望承認】#${inP.squadNumber || '-'} ${inP.name} の直訴を受け、次戦スタメンへ抜擢しました。`);
        }
      }
    }
  } else if (decision === 'decline') {
    if (consultation.kind === 'manager' && mgr) {
      mgr.trust = Math.max(0, (mgr.trust ?? 75) - 2);
      addDailyLog(`【起用相談見送り】${mgr.name}監督の起用変更案を見送り、現行布陣を維持しました。`);
    } else if (consultation.kind === 'player') {
      const p = club.players.find(x => x.id === (consultation.inPlayerId || consultation.playerId));
      if (p) {
        p.morale = Math.max(20, (p.morale || 75) - 5);
        addDailyLog(`【選手要望回答】${p.name} に対し、チーム方針と激しい競争下での努力を求める旨を伝えました。`);
      }
    }
  }

  renderAll();
  if (gameState.hasStartedOnce && typeof scheduleAutoSave === 'function') scheduleAutoSave(120);
}

function findClubCoachById(club, coachId) {
  if (!club || !coachId) return null;
  const entry = getClubCoachEntries(club).find(e => e.coach && e.coach.id === coachId);
  return entry ? entry.coach : null;
}

function openLineupConsultationModal(consultation) {
  if (!consultation || typeof showSecretaryModal !== 'function') return;
  const club = typeof getPlayerClub === 'function' ? getPlayerClub() : null;

  if (consultation.kind === 'conflict' && club && club.manager) {
    const coachObj = findClubCoachById(club, consultation.coachId) || (getClubCoachEntries(club)[0] || {}).coach || null;
    if (coachObj) {
      const conflictSpeaker = {
        kind: 'conflict',
        left: { kind: 'manager', person: club.manager, name: club.manager.name, roleLabel: '監督' },
        right: { kind: 'coach', person: coachObj, name: coachObj.name, roleLabel: consultation.coachRoleLabel || 'コーチ' },
        club
      };
      const detailHtml = `
        <div class="gm-conflict-compare">
          <div class="gm-conflict-stance is-mgr">
            <div class="gm-conflict-stance-head">${escapeCommHtml(consultation.mgrStanceTitle || `${club.manager.name} 監督の主張`)}</div>
            <div class="gm-conflict-stance-body">${escapeCommHtml(consultation.mgrStanceBody || '')}</div>
          </div>
          <div class="gm-conflict-stance is-coach">
            <div class="gm-conflict-stance-head">${escapeCommHtml(consultation.coachStanceTitle || `${coachObj.name} コーチの主張`)}</div>
            <div class="gm-conflict-stance-body">${escapeCommHtml(consultation.coachStanceBody || '')}</div>
          </div>
          ${consultation.impactSummary ? `<div class="gm-conflict-impact">${escapeCommHtml(consultation.impactSummary)}</div>` : ''}
        </div>
      `;
      showSecretaryModal({
        variant: 'conflict-arbitration',
        speaker: conflictSpeaker,
        topic: consultation.topic || '意見対立の仲裁',
        title: consultation.title,
        speech: consultation.speech,
        detailHtml,
        actions: [
          {
            label: consultation.acceptLabel || `${club.manager.name}監督を支持`,
            className: 'btn btn-primary',
            onClick: () => resolveLineupConsultationDecision(consultation, 'accept')
          },
          {
            label: consultation.coachAcceptLabel || `${coachObj.name}コーチ案を採用`,
            className: 'btn btn-secondary',
            onClick: () => resolveLineupConsultationDecision(consultation, 'coach')
          },
          {
            label: consultation.mediateLabel || '折衷案で仲裁する',
            className: 'btn btn-accent',
            onClick: () => resolveLineupConsultationDecision(consultation, 'mediate')
          },
          {
            label: 'あとで判断（業務一覧へ保留）',
            className: 'btn btn-secondary',
            onClick: () => resolveLineupConsultationDecision(consultation, 'defer')
          }
        ]
      });
      return;
    }
  }

  let modalSpeaker = null;
  if (consultation.kind === 'manager' && club && club.manager) {
    modalSpeaker = { kind: 'manager', person: club.manager, name: club.manager.name, roleLabel: '監督', club };
  } else if (consultation.kind === 'player' && club) {
    const targetPlayerId = consultation.playerId || consultation.inPlayerId;
    const playerObj = (club.players || []).find(p => p && p.id === targetPlayerId);
    if (playerObj) {
      modalSpeaker = {
        kind: 'player',
        person: playerObj,
        name: playerObj.fullName || playerObj.name,
        roleLabel: `${playerObj.pos} #${playerObj.squadNumber || '-'}`,
        club
      };
    }
  }

  const rowsHtml = (consultation.detailRows || []).map(([k, v]) => `
    <div class="gm-modal-flat-row">
      <span class="gm-modal-flat-label">${escapeCommHtml(k)}</span>
      <span class="gm-modal-flat-val">${escapeCommHtml(v)}</span>
    </div>
  `).join('');
  showSecretaryModal({
    speaker: modalSpeaker,
    topic: consultation.topic,
    title: consultation.title,
    speech: consultation.speech,
    detailHtml: rowsHtml ? `<div class="gm-modal-flat-list">${rowsHtml}</div>` : '',
    actions: [
      {
        label: consultation.acceptLabel || '要望・提案を受け入れる',
        className: 'btn btn-primary',
        onClick: () => resolveLineupConsultationDecision(consultation, 'accept')
      },
      {
        label: consultation.kind === 'manager' ? '現行布陣を維持する' : '競争を勝ち取るよう伝える',
        className: 'btn btn-secondary',
        onClick: () => resolveLineupConsultationDecision(consultation, 'decline')
      },
      {
        label: '作戦ボードで確認（保留）',
        className: 'btn btn-secondary',
        onClick: () => resolveLineupConsultationDecision(consultation, 'defer')
      }
    ]
  });
}

function checkAndTriggerLineupConsultation(matchData = null, forceType = null) {
  const club = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!club || gameState.isGameOver || gameState.isSeasonOver || isFastForwardingSeason) return null;
  if (!forceType && gameState.pendingLineupConsultation) return null;

  const totalMatches = gameState.totalPlayerMatchesPlayed || 0;
  const lastAt = gameState.lastConsultationMatchCount || 0;
  if (!forceType && (totalMatches < 2 || (totalMatches - lastAt) < 3)) {
    return null;
  }

  const consultation = buildLineupConsultationCandidate(club, forceType);
  if (!consultation) return null;

  gameState.lastConsultationMatchCount = totalMatches;
  gameState.consultationSeq = (gameState.consultationSeq || 0) + 1;
  gameState.pendingLineupConsultation = consultation;

  if (typeof addInboxMessage === 'function') {
    addInboxMessage({
      senderType: consultation.kind === 'player' ? 'player' : 'manager',
      senderName: consultation.senderName,
      title: consultation.title,
      body: consultation.speech,
      actionType: 'open-lineup-consultation',
      actionLabel: consultation.kind === 'conflict' ? '対立を仲裁・裁定する' : '相談を確認・回答する'
    });
  }

  openLineupConsultationModal(consultation);
  return consultation;
}

/**
 * 試合終了ごとの集計・秘書による収支＆次戦報告モーダル表示
 */
function handlePlayerMatchCompleted(matchData, { suppressModal = false, isSeasonClosing = false } = {}) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub || !matchData) return;

  const isHome = Boolean(matchData.isPlayerHome);
  const myScore = isHome ? (matchData.homeScore || 0) : (matchData.awayScore || 0);
  const oppScore = isHome ? (matchData.awayScore || 0) : (matchData.homeScore || 0);
  const hasPk = matchData.pkHome != null && matchData.pkAway != null;
  const userWon = hasPk ? Boolean(matchData.userWon) : (myScore > oppScore);
  const userDraw = !hasPk && (myScore === oppScore);

  const prizeIncome = Number(matchData.prizeIncome) || 0;
  const gateIncome = Number(matchData.gateIncome) || 0;
  const earnedIncome = matchData.isPreseason
    ? ((Number(matchData.matchIncome) || 0) || (prizeIncome + gateIncome))
    : (isHome ? (Number(matchData.matchIncome) || 0) : (Number(matchData.awayBroadcastingFee) || 0));
  const supportersDelta = Number(matchData.playerSupportersDelta || 0);

  const ledger = ensureMonthlyLedger(false);
  ledger.played += 1;
  if (userWon) ledger.won += 1;
  else if (userDraw) ledger.drawn += 1;
  else ledger.lost += 1;
  ledger.gf += myScore;
  ledger.ga += oppScore;
  ledger.matchIncome += earnedIncome;
  ledger.supportersDelta += supportersDelta;
  if (Array.isArray(ledger.matches)) {
    ledger.matches.push({
      comp: matchData.compTitle || (matchData.week ? `第${matchData.week}節` : '公式戦'),
      score: `${myScore}-${oppScore}`,
      outcome: userWon ? 'W' : (userDraw ? 'D' : 'L')
    });
    if (ledger.matches.length > 15) ledger.matches.shift();
  }

  gameState.totalPlayerMatchesPlayed = (gameState.totalPlayerMatchesPlayed || 0) + 1;

  const oppClub = isHome ? matchData.awayClub : matchData.homeClub;
  if (!isFastForwardingSeason && typeof emitPostMatchTeamAndPlayerNews === 'function') {
    emitPostMatchTeamAndPlayerNews(playerClub, matchData, oppClub, myScore, oppScore, userWon, userDraw);
  }

  if (suppressModal || isFastForwardingSeason || isSeasonClosing || typeof showSecretaryModal !== 'function') {
    return;
  }

  const oppName = oppClub ? oppClub.name : '対戦相手';
  const venueLabel = isHome ? 'HOME' : 'AWAY';
  const resultLabel = userWon ? '勝利' : (userDraw ? '引分' : '敗戦');
  const resultColorCls = userWon ? 'accent-green' : (userDraw ? 'accent-gold' : 'text-danger');
  const pkSuffix = hasPk
    ? ` (PK ${isHome ? matchData.pkHome : matchData.pkAway}-${isHome ? matchData.pkAway : matchData.pkHome})`
    : '';
  const compLabel = matchData.compTitle || (matchData.week ? `リーグ第${matchData.week}節` : '公式戦');

  const weeklyPayroll = typeof getClubWeeklyPayroll === 'function' ? getClubWeeklyPayroll(playerClub) : 0;
  const safeBudget = typeof getSafeTransferBudget === 'function' ? getSafeTransferBudget(playerClub) : (playerClub.funds || 0);
  const nextFixture = findNextScheduledPlayerMatch();

  let nextMatchText = '今季残試合なし（シーズン終盤調整）';
  if (nextFixture && nextFixture.matchInfo && nextFixture.matchInfo.oppClub) {
    const nf = nextFixture;
    const nVenue = nf.matchInfo.isHome ? 'H' : 'A';
    nextMatchText = `${nf.daysAhead}日後 (${nf.day.month}/${nf.day.day}) · ${nf.matchInfo.title} vs ${nf.matchInfo.oppClub.name} (${nVenue})`;
  }

  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: 'C. Bennett', tone: 'polite' };
  let speech = '';
  if (sec.tone === 'active') {
    speech = `GM、${compLabel}（vs ${oppName}）お疲れ様でした！${myScore}-${oppScore}の${resultLabel}です。試合収入 ${formatMoney(earnedIncome)} と次回予定をまとめましたのでご確認ください。`;
  } else if (sec.tone === 'calm') {
    speech = `GM、${compLabel}の結果（${myScore}-${oppScore} / ${resultLabel}）および今試合の収支と次戦スケジュールを報告いたします。`;
  } else {
    speech = `GM、${compLabel}、${oppName}戦（${myScore}-${oppScore}・${resultLabel}）お疲れ様でございました。今回の収支および次回試合の予定をご報告申し上げます。`;
  }

  const fanStr = `${supportersDelta >= 0 ? '+' : ''}${supportersDelta.toLocaleString()}人`;
  const incomeSubNote = matchData.isPreseason
    ? (gateIncome > 0 && prizeIncome > 0
      ? `賞金+${formatMoney(prizeIncome)} · 入場+${formatMoney(gateIncome)}`
      : (gateIncome > 0 ? '入場・グッズ収入' : 'WCT大会賞金'))
    : (isHome ? '入場料・グッズ・放映' : 'アウェイ放映権料');
  const fanDeltaCls = supportersDelta >= 0 ? 'accent-green' : 'text-danger';

  showSecretaryModal({
    variant: 'match-report',
    topic: matchData.isPreseason ? '試合後報告（WCT）' : '試合後報告',
    title: `${compLabel} 試合結果・収支報告`,
    speech,
    detailHtml: `
      <div class="gm-report-wrap">
        <div class="gm-report-scoreboard">
          <div class="gm-report-sb-meta">
            <span class="gm-report-sb-comp">${escapeCommHtml(compLabel)} · ${venueLabel}</span>
            <span class="gm-report-sb-outcome ${resultColorCls}">${resultLabel}</span>
          </div>
          <div class="gm-report-sb-main">
            <span class="gm-report-sb-team">${escapeCommHtml(playerClub.name)}</span>
            <span class="gm-report-sb-score mono ${resultColorCls}">${myScore} - ${oppScore}${pkSuffix ? `<small>${escapeCommHtml(pkSuffix)}</small>` : ''}</span>
            <span class="gm-report-sb-team is-opp">${escapeCommHtml(oppName)}</span>
          </div>
          ${matchData.momPlayer ? `<div class="gm-report-sb-mom"><span>MOM</span><strong>${escapeCommHtml(matchData.momPlayer.name)}</strong></div>` : ''}
        </div>
        <div class="gm-report-kpi-grid">
          <div class="gm-report-kpi-cell">
            <span class="gm-report-kpi-label">試合収入</span>
            <span class="gm-report-kpi-val mono accent-green">+${formatMoney(earnedIncome)}</span>
            <span class="gm-report-kpi-sub">${escapeCommHtml(incomeSubNote)}</span>
          </div>
          <div class="gm-report-kpi-cell">
            <span class="gm-report-kpi-label">週間給与目安</span>
            <span class="gm-report-kpi-val mono text-danger">-${formatMoney(weeklyPayroll)}</span>
            <span class="gm-report-kpi-sub">週次人件費</span>
          </div>
          <div class="gm-report-kpi-cell">
            <span class="gm-report-kpi-label">現在資金</span>
            <span class="gm-report-kpi-val mono accent-gold">${formatMoney(playerClub.funds)}</span>
            <span class="gm-report-kpi-sub">安全枠 ${formatMoney(safeBudget)}</span>
          </div>
          <div class="gm-report-kpi-cell">
            <span class="gm-report-kpi-label">サポーター</span>
            <span class="gm-report-kpi-val mono ${fanDeltaCls}">${fanStr}</span>
            <span class="gm-report-kpi-sub">${((playerClub.supporters || 0)).toLocaleString()}人</span>
          </div>
        </div>
        <div class="gm-report-next-bar">
          <span class="gm-report-next-label">次回試合予定</span>
          <span class="gm-report-next-val">${escapeCommHtml(nextMatchText)}</span>
        </div>
      </div>
    `,
    actions: [
      {
        label: 'タップで次へ',
        isNextPrompt: true,
        onClick: () => { if (typeof renderAll === 'function') renderAll(); }
      }
    ]
  });

  checkAndTriggerLineupConsultation(matchData);
}

/**
 * 月末（月替わり1日遷移時）の月次定例会・戦績＆収支報告および理事会レポート
 */
function sendMonthlyBoardReport(dayObj, closingDayObj = null) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub || !dayObj) return false;
  if (typeof ensureClubRealismFields === 'function') ensureClubRealismFields(playerClub);

  const ledger = ensureMonthlyLedger(false, closingDayObj || dayObj);
  const reportYear = closingDayObj ? closingDayObj.year : ledger.year;
  const reportMonth = closingDayObj ? closingDayObj.month : (dayObj.month === 1 ? 12 : dayObj.month - 1);

  const curFunds = playerClub.funds || 0;
  const netBalance = curFunds - (ledger.startFunds || 0);
  const matchIncome = ledger.matchIncome || 0;
  const transferIn = ledger.transferInFee || 0;
  const payrollPaid = ledger.payrollPaid || 0;
  const transferOut = ledger.transferOutFee || 0;
  const otherNet = netBalance - (matchIncome + transferIn - payrollPaid - transferOut);

  const inD2 = typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision();
  const table = inD2 && gameState.competitions && gameState.competitions.championship
    ? [...gameState.competitions.championship.clubs].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0))
    : (typeof getSortedStandings === 'function' ? getSortedStandings() : []);
  const rankIdx = table.findIndex(c => c && c.id === playerClub.id);
  const hasLeaguePlayed = (playerClub.played || 0) > 0 || (gameState.currentWeek || 0) > 0;
  const rankText = (hasLeaguePlayed && rankIdx >= 0) ? `現在${rankIdx + 1}位` : '開幕準備中';
  const targetText = playerClub.targetLabel || '上位進出';
  const boardConf = typeof playerClub.boardConfidence === 'number' ? playerClub.boardConfidence : 75;
  const safeBudget = typeof getSafeTransferBudget === 'function' ? getSafeTransferBudget(playerClub) : curFunds;
  const psr = typeof evaluateClubPSR === 'function' ? evaluateClubPSR(playerClub) : { total3YrNet: 0, isBreach: false };

  let statusComment = '現行の方針は安定しており、理事会は引き続きGMの手腕を信頼しています。';
  if (boardConf < 40) {
    statusComment = '直近の成績および目標順位との乖離に対し、理事会内に強い危機感が広がっています。早急な立て直しを求めます。';
  } else if (psr.isBreach || curFunds < 0) {
    statusComment = '財務収支およびPSR基準に警戒水準が灯っています。人件費圧縮や選手売却による収支改善をご検討ください。';
  } else if (rankIdx >= 0 && rankIdx + 1 <= (playerClub.targetRank || 8)) {
    statusComment = '目標圏内を維持する順調な推移です。この調子でシーズンを戦い抜くことを期待しています。';
  }

  const recordSummary = ledger.played > 0
    ? `${ledger.played}試合（${ledger.won}勝 ${ledger.drawn}分 ${ledger.lost}敗 · 得失点 ${ledger.gf}-${ledger.ga}）`
    : '公式戦・親善試合なし（補強・調整期間）';
  const netSign = netBalance >= 0 ? '+' : '';

  if (!Array.isArray(gameState.monthlyReports)) gameState.monthlyReports = [];
  gameState.monthlyReports.unshift({
    year: reportYear,
    month: reportMonth,
    played: ledger.played,
    won: ledger.won,
    drawn: ledger.drawn,
    lost: ledger.lost,
    gf: ledger.gf,
    ga: ledger.ga,
    matchIncome,
    transferIn,
    payrollPaid,
    transferOut,
    otherNet,
    netBalance,
    endFunds: curFunds,
    rankText
  });
  if (gameState.monthlyReports.length > 12) gameState.monthlyReports = gameState.monthlyReports.slice(0, 12);

  addInboxMessage({
    senderType: 'board',
    senderName: 'クラブ理事会・財務',
    title: `${reportMonth}月度 月次定例会（戦績・収支報告）`,
    body: `【月間戦績】${recordSummary} ／ ${rankText}（目標: ${targetText}）\n【月間収支】試合収入 +${formatMoney(matchIncome)} / 売却 +${formatMoney(transferIn)} / 給与 -${formatMoney(payrollPaid)} / 補強 -${formatMoney(transferOut)} ／ 月間純収支 ${netSign}${formatMoney(netBalance)}（現在資金 ${formatMoney(curFunds)} · 安全移籍予算 ${formatMoney(safeBudget)} · 理事会信頼度 ${boardConf}%）。${statusComment}`,
    actionType: 'goto-facilities',
    actionLabel: '経営・財務を確認'
  });
  addDailyLog(`【月次定例会 (${reportMonth}月度)】${recordSummary} / 月間純収支 ${netSign}${formatMoney(netBalance)}（資金 ${formatMoney(curFunds)}）`);

  // 新月用の台帳へリセット
  ensureMonthlyLedger(true, dayObj);

  if (!isFastForwardingSeason && typeof showSecretaryModal === 'function') {
    if (typeof stopAdvancingCalendar === 'function') stopAdvancingCalendar();
    const netColorCls = netBalance >= 0 ? 'accent-green' : 'text-danger';
    const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : { name: 'C. Bennett', tone: 'polite' };
    let meetingSpeech = '';
    if (sec.tone === 'active') {
      meetingSpeech = `GM、${reportMonth}月度の月次定例経営会議を開催します！今月の戦績と収支決算をまとめました。理事会評価も踏まえて次月の指針を固めましょう。`;
    } else if (sec.tone === 'calm') {
      meetingSpeech = `GM、${reportYear}年${reportMonth}月度の定例経営会議を開始します。今月の戦績実績、収支決算、ならびに理事会評価をご確認ください。`;
    } else {
      meetingSpeech = `GM、${reportYear}年${reportMonth}月度の月次定例経営会議のお時間でございます。今月の戦績ならびに財務決算の詳細をご報告申し上げます。`;
    }

    let evalScore = Number(boardConf) || 50;
    if (netBalance > 0) evalScore += 10;
    else if (netBalance < 0) evalScore -= 6;
    if (psr && psr.isBreach) evalScore -= 15;
    if (ledger && ledger.played > 0) {
      evalScore += ((Number(ledger.won) || 0) - (Number(ledger.lost) || 0)) * 4;
    }
    const evalGrade = evalScore >= 90 ? 'S' : evalScore >= 75 ? 'A' : evalScore >= 60 ? 'B' : evalScore >= 45 ? 'C' : evalScore >= 30 ? 'D' : 'E';
    const evalRankCls = `stat-rank-${evalGrade.toLowerCase()}`;
    const emblemHtml = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(playerClub, 36, 'gm-ceremony-emblem') : '';
    const otherRowHtml = otherNet !== 0
      ? `<div class="gm-ledger-row">
          <span class="gm-ledger-label">その他運営・雑収支</span>
          <span class="gm-ledger-val mono ${otherNet >= 0 ? 'accent-green' : 'text-danger'}">${otherNet >= 0 ? '+' : '-'}${formatMoney(Math.abs(otherNet))}</span>
        </div>`
      : '';
    const confBarColor = boardConf >= 70 ? '#2ecc71' : (boardConf >= 45 ? '#f59e0b' : '#ef4444');

    showSecretaryModal({
      variant: 'monthly-ceremony',
      topic: '月次定例会',
      title: `${reportYear}年${reportMonth}月度 月次定例報告会`,
      speech: meetingSpeech,
      detailHtml: `
        <div class="gm-ceremony-wrap">
          <div class="gm-ceremony-banner">
            <div class="gm-ceremony-banner-left">
              ${emblemHtml}
              <div class="gm-ceremony-club-meta">
                <div class="gm-ceremony-club-name">${escapeCommHtml(playerClub.name)}</div>
                <div class="gm-ceremony-period">${reportYear}年${reportMonth}月度 決算・戦績報告</div>
              </div>
            </div>
            <div class="gm-ceremony-grade-box">
              <span class="gm-ceremony-grade-label">月次評価</span>
              <span class="gm-ceremony-grade mono ${evalRankCls}">${evalGrade}</span>
            </div>
          </div>

          <div class="gm-report-section-head">戦績・理事会評価</div>
          <div class="gm-ceremony-rows">
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">今月戦績</span>
              <span class="gm-ledger-val">${escapeCommHtml(recordSummary)}</span>
            </div>
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">順位 / シーズン目標</span>
              <span class="gm-ledger-val">${escapeCommHtml(rankText)} / ${escapeCommHtml(targetText)}</span>
            </div>
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">理事会信頼度</span>
              <span class="gm-ledger-val gm-conf-val">
                <span class="gm-conf-meter"><span class="gm-conf-fill" style="width:${Math.max(0, Math.min(100, boardConf))}%;background:${confBarColor};"></span></span>
                <span class="mono">${boardConf}%</span>
              </span>
            </div>
          </div>

          <div class="gm-report-section-head">月間収支決算</div>
          <div class="gm-report-ledger">
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">試合・賞金・グッズ収入</span>
              <span class="gm-ledger-val mono accent-green">+${formatMoney(matchIncome)}</span>
            </div>
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">選手売却収入</span>
              <span class="gm-ledger-val mono accent-green">+${formatMoney(transferIn)}</span>
            </div>
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">給与・スタッフ人件費</span>
              <span class="gm-ledger-val mono text-danger">-${formatMoney(payrollPaid)}</span>
            </div>
            <div class="gm-ledger-row">
              <span class="gm-ledger-label">移籍補強支出</span>
              <span class="gm-ledger-val mono text-danger">-${formatMoney(transferOut)}</span>
            </div>
            ${otherRowHtml}
            <div class="gm-ledger-row gm-ledger-total">
              <span class="gm-ledger-label">月間純収支</span>
              <span class="gm-ledger-val mono ${netColorCls}">${netSign}${formatMoney(netBalance)}</span>
            </div>
            <div class="gm-ledger-row gm-ledger-balance">
              <span class="gm-ledger-label">月末資金残高 (安全枠 ${formatMoney(safeBudget)})</span>
              <span class="gm-ledger-val mono accent-gold">${formatMoney(curFunds)}</span>
            </div>
          </div>

          <div class="gm-ceremony-verdict">
            <span class="gm-ceremony-verdict-label">理事会総評</span>
            <span class="gm-ceremony-verdict-text">${escapeCommHtml(statusComment)}</span>
          </div>
        </div>
      `,
      actions: [
        {
          label: '経営・財務を確認',
          className: 'btn btn-secondary',
          onClick: () => { if (typeof switchTab === 'function') switchTab('facilities'); }
        },
        {
          label: '定例会を完了する',
          className: 'btn btn-primary',
          onClick: () => { if (typeof renderAll === 'function') renderAll(); }
        }
      ]
    });
    return true;
  }
  return false;
}

/**
 * リーグ節終了時の自動ニュース生成（首位動向・番狂わせ・連勝・得点ランキング）
 */
function generateMatchweekNews(weekNum) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub) return;

  const results = Array.isArray(gameState.lastWeekResults) ? gameState.lastWeekResults : [];
  const inD2 = typeof isPlayerInSecondDivision === 'function' && isPlayerInSecondDivision();
  const divCode = inD2 ? 'ENG-D2' : 'ENG-D1';
  const table = inD2 && gameState.competitions && gameState.competitions.championship
    ? [...gameState.competitions.championship.clubs].sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.gd || 0) - (a.gd || 0) || (b.gf || 0) - (a.gf || 0))
    : (typeof getSortedStandings === 'function' ? getSortedStandings() : []);

  // 1. 自クラブの試合結果ハイライト
  const pm = results.find(r => r && r.isPlayerMatch);
  if (pm) {
    const opp = pm.isPlayerHome ? pm.awayClub : pm.homeClub;
    const myScore = pm.isPlayerHome ? pm.homeScore : pm.awayScore;
    const oppScore = pm.isPlayerHome ? pm.awayScore : pm.homeScore;
    const myRank = table.findIndex(c => c && c.id === playerClub.id) + 1;
    const rankSuffix = myRank > 0 ? `順位は${myRank}位となった。` : '';
    if (myScore - oppScore >= 3) {
      addNewsItem({
        category: 'リーグ',
        clubId: playerClub.id,
        headline: `${playerClub.name}が${opp.name}に${myScore}-${oppScore}の快勝`,
        lead: `${divCode} 第${weekNum}節 · 試合詳報`,
        body: `${divCode}第${weekNum}節で${playerClub.name}が攻撃陣爆発の${myScore}得点で圧勝。${rankSuffix}`,
        actionLabel: '試合詳報',
        highlight: true
      });
    } else if (oppScore - myScore >= 3) {
      addNewsItem({
        category: 'リーグ',
        clubId: playerClub.id,
        headline: `${playerClub.name}、${opp.name}に${myScore}-${oppScore}と痛恨の大敗`,
        lead: `${divCode} 第${weekNum}節 · 試合詳報`,
        body: `${divCode}第${weekNum}節は守備陣が崩れ手痛い敗戦となった。${rankSuffix}`,
        actionLabel: '試合詳報',
        highlight: true
      });
    }
  }

  // 2. 首位交代・首位快走ニュース
  if (table.length >= 2 && weekNum >= 2) {
    const leader = table[0];
    const second = table[1];
    const prevLeaderId = gameState._lastNewsLeaderId || null;
    if (prevLeaderId && prevLeaderId !== leader.id) {
      addNewsItem({
        category: 'リーグ',
        clubId: leader.id,
        headline: `${divCode}首位交代：${leader.name}が勝点${leader.pts}でトップ浮上`,
        lead: `第${weekNum}節終了時 · 順位表変動`,
        body: `第${weekNum}節の結果、${leader.name}が2位${second.name}（勝点${second.pts}）を抑えて首位に立った。`,
        highlight: leader.isPlayer
      });
    } else if (weekNum % 4 === 0) {
      const gap = (leader.pts || 0) - (second.pts || 0);
      addNewsItem({
        category: 'リーグ',
        clubId: leader.id,
        headline: `${divCode}第${weekNum}節終了：${leader.name}が勝点${leader.pts}で首位維持`,
        lead: `2位との勝点差 ${gap} · 優勝争い`,
        body: `2位${second.name}との勝点差は${gap}。中盤戦から終盤へ向けて激しい上位争いが続いている。`,
        highlight: leader.isPlayer
      });
    }
    gameState._lastNewsLeaderId = leader.id;
  }

  // 3. 他会場の大勝・番狂わせニュース（1試合ピックアップ）
  const otherMatches = results.filter(r => r && !r.isPlayerMatch && r.homeClub && r.awayClub);
  let upsetMatch = null;
  let blowoutMatch = null;
  for (const r of otherMatches) {
    const hPow = r.homeClub.basePower || 70;
    const aPow = r.awayClub.basePower || 70;
    if (r.homeScore > r.awayScore && aPow - hPow >= 6) {
      upsetMatch = { winner: r.homeClub, loser: r.awayClub, wScore: r.homeScore, lScore: r.awayScore };
      break;
    }
    if (r.awayScore > r.homeScore && hPow - aPow >= 6) {
      upsetMatch = { winner: r.awayClub, loser: r.homeClub, wScore: r.awayScore, lScore: r.homeScore };
      break;
    }
    if (!blowoutMatch && Math.abs(r.homeScore - r.awayScore) >= 3) {
      const wHome = r.homeScore > r.awayScore;
      blowoutMatch = {
        winner: wHome ? r.homeClub : r.awayClub,
        loser: wHome ? r.awayClub : r.homeClub,
        wScore: wHome ? r.homeScore : r.awayScore,
        lScore: wHome ? r.awayScore : r.homeScore
      };
    }
  }
  if (upsetMatch) {
    addNewsItem({
      category: 'リーグ',
      clubId: upsetMatch.winner.id,
      headline: `番狂わせ：${upsetMatch.winner.name}が格上${upsetMatch.loser.name}を${upsetMatch.wScore}-${upsetMatch.lScore}で撃破`,
      lead: `${divCode} 第${weekNum}節 · 試合詳報`,
      body: `${divCode}第${weekNum}節で${upsetMatch.winner.name}が金星を挙げ、リーグ順位表に波乱を呼んだ。`
    });
  } else if (blowoutMatch) {
    addNewsItem({
      category: 'リーグ',
      clubId: blowoutMatch.winner.id,
      headline: `${blowoutMatch.winner.name}が${blowoutMatch.loser.name}に${blowoutMatch.wScore}-${blowoutMatch.lScore}で大勝`,
      lead: `${divCode} 第${weekNum}節 · 試合詳報`,
      body: `${divCode}第${weekNum}節、${blowoutMatch.winner.name}が圧巻の攻撃力を披露した。`
    });
  }

  // 4. 5節ごとの得点ランキング速報
  if (weekNum >= 5 && weekNum % 5 === 0) {
    const allClubs = inD2 && gameState.competitions && gameState.competitions.championship
      ? gameState.competitions.championship.clubs
      : (gameState.clubs || []);
    let topScorer = null;
    let topClub = null;
    for (const c of allClubs) {
      for (const p of (c.players || [])) {
        if (p && (p.goals || 0) > (topScorer ? (topScorer.goals || 0) : 0)) {
          topScorer = p;
          topClub = c;
        }
      }
    }
    if (topScorer && topClub && (topScorer.goals || 0) >= 3) {
      addNewsItem({
        category: '選手',
        clubId: topClub.id,
        playerId: topScorer.id,
        headline: `得点王争い：${topClub.name}・${topScorer.name}が今季${topScorer.goals}得点で首位`,
        lead: `${topClub.name} · ${topScorer.age}歳 · ${topScorer.appearances || weekNum}試合${topScorer.goals}得点`,
        body: `第${weekNum}節終了時点で${topScorer.name}が${divCode}の得点ランキングトップを走っている。`,
        highlight: topClub.isPlayer
      });
    }
  }
}

/**
 * カップ戦・欧州コンペ（WCT/ECT/EPC/ECS/国内カップ）のニュース生成
 */
function generateCupMatchNews(compName, oppClub, isHome, myScore, oppScore, userWon, roundTitle) {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  if (!playerClub || !oppClub) return;
  const venue = isHome ? 'ホーム' : 'アウェイ';
  const resultLabel = userWon ? '勝利' : (myScore === oppScore ? '引き分け' : '敗戦');
  addNewsItem({
    category: 'カップ',
    clubId: playerClub.id,
    headline: `${compName} ${roundTitle}：${playerClub.name}、${oppClub.name}に${myScore}-${oppScore}で${resultLabel}`,
    lead: `${compName} ${roundTitle} · 試合詳報`,
    body: `${venue}で迎えた${compName} ${roundTitle}の一戦は${myScore}-${oppScore}で決着した。`,
    actionLabel: '試合詳報',
    highlight: userWon
  });
}

/**
 * 移籍市場期間中の他クラブ間・欧州クラブ移籍ニュースを自動生成
 */
function simulateCpuTransferNewsDaily(dayObj) {
  if (!dayObj || !dayObj.windowOpen) return;
  if (Math.random() > 0.16) return;

  const managedClubs = (typeof getAllManagedLeagueClubs === 'function' ? getAllManagedLeagueClubs() : (gameState.clubs || []))
    .filter(c => c && !c.isPlayer && Array.isArray(c.players) && c.players.length > 20);
  if (managedClubs.length < 2) return;

  const buyer = managedClubs[randInt(0, managedClubs.length - 1)];
  const sellers = managedClubs.filter(c => c.id !== buyer.id);
  const seller = sellers[randInt(0, sellers.length - 1)];
  if (!buyer || !seller) return;

  const candidates = seller.players.filter(p => p && !p.isRetired && !(p.loanStatus && p.loanStatus.isLoanOut) && (p.age || 25) <= 32);
  if (candidates.length === 0) return;

  // バイヤーの予算とチーム水準に合う注目選手を選択
  const sorted = [...candidates].sort((a, b) => getPlayerOverallRating(b) - getPlayerOverallRating(a));
  const pool = sorted.slice(0, Math.min(6, sorted.length));
  const target = pool[randInt(0, pool.length - 1)];
  if (!target) return;

  const fee = typeof calculateTransferFee === 'function' ? calculateTransferFee(target) : (target.transferFee || 5000);
  const ovr = getPlayerOverallRating(target);
  const pos = target.primaryPosition || target.pos || 'CM';

  // 半数は欧州クラブへの流出・獲得ニュース、半数は国内クラブ間の実際の選手移動
  const euroPool = Array.isArray(gameState.europeanMegaClubs) ? gameState.europeanMegaClubs : [];
  if (euroPool.length > 0 && Math.random() < 0.45 && Array.isArray(gameState.euroTransferList) && gameState.euroTransferList.length > 0) {
    const ep = gameState.euroTransferList[randInt(0, Math.min(12, gameState.euroTransferList.length - 1))];
    const mega = euroPool[randInt(0, euroPool.length - 1)];
    if (ep && mega && (buyer.funds || 0) >= fee && buyer.players.length < (typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50)) {
      const epFee = typeof calculateTransferFee === 'function' ? calculateTransferFee(ep) : 12000;
      const epOvr = getPlayerOverallRating(ep);
      if ((buyer.funds || 0) >= epFee) {
        gameState.euroTransferList = gameState.euroTransferList.filter(x => x && x.id !== ep.id);
        buyer.funds -= epFee;
        ep.isEuroListed = false;
        ep.euroClubId = null;
        ep.clubId = buyer.id;
        ep.isStarter = false;
        ep.contractYears = 4;
        buyer.players.push(ep);
        ensureValidSquadAndStarters(buyer);
        addNewsItem({
          category: '移籍',
          clubId: buyer.id,
          playerId: ep.id,
          headline: `大型補強：${buyer.name}が${ep.pos || 'MF'} ${ep.name}を${formatMoney(epFee)}で獲得`,
          lead: `${buyer.name} · ${ep.age}歳 · 移籍成立`,
          body: `${buyer.name}は欧州市場から${ep.name}（${ep.age}歳 / OVR ${epOvr}）の獲得を完了。ライバルクラブの戦力増強に市場が沸いている。`,
          highlight: epOvr >= 80
        });
        return;
      }
    }
  }

  if ((buyer.funds || 0) >= fee && buyer.players.length < (typeof MAX_SQUAD_SIZE === 'number' ? MAX_SQUAD_SIZE : 50) && seller.players.length > 18) {
    seller.players = seller.players.filter(p => p && p.id !== target.id);
    seller.funds = (seller.funds || 0) + fee;
    buyer.funds -= fee;
    target.clubId = buyer.id;
    target.isStarter = false;
    target.isBench = false;
    target.assignedPos = null;
    target.slotIndex = null;
    target.contractYears = 4;
    buyer.players.push(target);
    ensureValidSquadAndStarters(seller);
    ensureValidSquadAndStarters(buyer);
    if (typeof autoSelectStarters === 'function') {
      autoSelectStarters(seller);
      autoSelectStarters(buyer);
    }
    addNewsItem({
      category: '移籍',
      clubId: buyer.id,
      playerId: target.id,
      headline: `移籍成立：${buyer.name}が${seller.name}から${pos} ${target.name}を獲得`,
      lead: `${buyer.name} · ${target.age}歳 · 移籍金 ${formatMoney(fee)}`,
      body: `移籍金は${formatMoney(fee)}。${target.name}（${target.age}歳 / OVR ${ovr}）は4年契約で新天地へ合流する。`,
      highlight: ovr >= 79
    });
  }
}

/**
 * 本部画面上部の秘書アバター ＆ 業務一覧ヘッダーを描画
 */
function renderSecretaryBriefing() {
  const container = document.getElementById('secretary-briefing-bar');
  if (!container) return;
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const sec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : null;
  if (!sec) return;

  const avatarHtml = typeof getSecretaryAvatarHtml === 'function' ? getSecretaryAvatarHtml(sec, 'avatar-md', 46) : '';
  const summary = window._lastGmDutySummary || { count: 3, levels: ['critical', 'recommended', 'optional'] };
  const barsHtml = typeof buildGmDutyBarsHtml === 'function' ? buildGmDutyBarsHtml(summary.levels) : '';

  container.innerHTML = `
    <button type="button" class="secretary-avatar-trigger" id="btn-open-secretary-modal" title="${escapeCommHtml(`${sec.fullName || sec.name}（${sec.roleLabel}）：秘書ブリーフィング確認・交代`)}">
      <span class="secretary-avatar-box">${avatarHtml}</span>
      <span class="secretary-swap-dot" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
      </span>
    </button>
    <div class="duty-header-stack">
      <div class="duty-header-title-line">
        <h2 class="gm-tasks-title">業務一覧</h2>
        <span class="secretary-inline-name">${escapeCommHtml(sec.name)}</span>
      </div>
      <div class="duty-header-status-line">
        <span class="duty-bars-indicator" id="gm-tasks-bars">${barsHtml}</span>
        <span class="gm-tasks-count-badge" id="gm-tasks-count-badge">残り ${summary.count}</span>
      </div>
    </div>
  `;

  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(container);
  }
  const changeBtn = document.getElementById('btn-open-secretary-modal');
  if (changeBtn) {
    changeBtn.addEventListener('click', openSecretarySelectModal);
  }
}

/**
 * 秘書選択候補行の共通HTMLを生成（ゲーム開始時選任＆交代モーダル共用）
 */
function buildSecretarySelectRowHtml(sec, isSelected, dataAttrName, avatarSize = 48) {
  const avatarHtml = typeof getSecretaryAvatarHtml === 'function' ? getSecretaryAvatarHtml(sec, 'avatar-md', avatarSize) : '';
  return `
    <div class="secretary-select-row ${isSelected ? 'selected' : ''}" ${dataAttrName}="${sec.id}">
      <div class="secretary-avatar-box" style="width:${avatarSize}px;height:${avatarSize}px;">${avatarHtml}</div>
      <div style="flex:1; min-width:0;">
        <div class="flat-row-header">
          <span class="flat-row-title" style="font-size:14.5px; color:${isSelected ? 'var(--accent-green)' : '#ffffff'};">${escapeCommHtml(sec.fullName || sec.name)}</span>
          ${isSelected ? '<span class="secretary-selected-mark">選択中</span>' : ''}
        </div>
        <div class="secretary-select-meta-line">
          <span class="secretary-role-text">${escapeCommHtml(sec.roleLabel)}</span>
          <span class="secretary-spec-text mono">· ${escapeCommHtml(sec.specialty)}</span>
        </div>
        <div class="flat-row-meta" style="margin-top:3px;">${escapeCommHtml(sec.bio)}</div>
      </div>
    </div>
  `;
}

function openSecretarySelectModal() {
  const modal = document.getElementById('secretary-select-modal');
  const body = document.getElementById('secretary-modal-body');
  if (!modal || !body) return;

  const list = typeof SECRETARIES_DATABASE !== 'undefined' && Array.isArray(SECRETARIES_DATABASE)
    ? SECRETARIES_DATABASE
    : [];
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : null;
  const activeSec = typeof getActiveSecretary === 'function' ? getActiveSecretary() : null;
  const activeId = activeSec ? activeSec.id : '';
  const liveBrief = typeof getSecretaryBriefingText === 'function' ? getSecretaryBriefingText(playerClub) : '';

  body.innerHTML = `
    ${activeSec && liveBrief ? `
      <div class="secretary-modal-live-brief">
        <div class="secretary-live-brief-label">${escapeCommHtml(activeSec.name)} からの状況報告</div>
        <p class="secretary-briefing-speech">${escapeCommHtml(liveBrief)}</p>
      </div>
    ` : ''}
    <div class="flat-section-label mono" style="margin-bottom:4px;">担当秘書の交代</div>
    <div style="display:flex; flex-direction:column;">
      ${list.map(sec => buildSecretarySelectRowHtml(sec, sec.id === activeId, 'data-select-secretary-id', 48)).join('')}
    </div>
  `;

  if (typeof renderAvatarCanvases === 'function') {
    renderAvatarCanvases(body);
  }

  body.querySelectorAll('[data-select-secretary-id]').forEach(row => {
    row.addEventListener('click', (e) => {
      const secId = e.currentTarget.dataset.selectSecretaryId;
      selectSecretary(secId);
    });
  });

  modal.classList.remove('hidden');
  setBodyModalLock(true);
}

function closeSecretarySelectModal() {
  const modal = document.getElementById('secretary-select-modal');
  if (modal) modal.classList.add('hidden');
  setBodyModalLock(false);
}

function selectSecretary(secId) {
  const list = typeof SECRETARIES_DATABASE !== 'undefined' && Array.isArray(SECRETARIES_DATABASE)
    ? SECRETARIES_DATABASE
    : [];
  const found = list.find(s => s.id === secId);
  if (!found) return;
  gameState.secretaryId = found.id;
  closeSecretarySelectModal();
  addDailyLog(`担当秘書を ${found.name}（${found.roleLabel}）へ変更しました。`);
  renderSecretaryBriefing();
  if (gameState.hasStartedOnce && typeof scheduleAutoSave === 'function') scheduleAutoSave(120);
}

/**
 * メッセージ受信箱とニュースの統合パネル描画
 */
function renderOfficeCommPanel() {
  const inboxListEl = document.getElementById('office-inbox-list');
  const newsListEl = document.getElementById('office-news-list');
  const controlsEl = document.getElementById('office-inbox-controls');
  const unreadBadgeEl = document.getElementById('office-unread-badge');
  const newsBadgeEl = document.getElementById('office-news-badge');
  const tabMessagesBtn = document.getElementById('office-comm-tab-messages');
  const tabNewsBtn = document.getElementById('office-comm-tab-news');
  if (!inboxListEl || !newsListEl) return;

  if (typeof pruneExpiredNewsItems === 'function') pruneExpiredNewsItems(7);
  const msgs = Array.isArray(gameState.inboxMessages) ? gameState.inboxMessages : [];
  const news = Array.isArray(gameState.newsFeed) ? gameState.newsFeed : [];
  const activeTab = gameState.officeCommTab === 'news' ? 'news' : 'messages';
  const unreadCount = msgs.filter(m => m && !m.read).length;

  if (unreadBadgeEl) {
    unreadBadgeEl.textContent = `${unreadCount}`;
    unreadBadgeEl.classList.toggle('has-unread', unreadCount > 0);
  }
  if (newsBadgeEl) {
    newsBadgeEl.textContent = `${news.length}`;
  }
  if (tabMessagesBtn) {
    tabMessagesBtn.classList.toggle('active', activeTab === 'messages');
    tabMessagesBtn.setAttribute('aria-selected', activeTab === 'messages' ? 'true' : 'false');
  }
  if (tabNewsBtn) {
    tabNewsBtn.classList.toggle('active', activeTab === 'news');
    tabNewsBtn.setAttribute('aria-selected', activeTab === 'news' ? 'true' : 'false');
  }
  if (controlsEl) {
    controlsEl.classList.toggle('hidden', activeTab !== 'messages');
  }

  document.querySelectorAll('#inbox-filter-bar .btn-inbox-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.inboxFilter === (gameState.inboxCategoryFilter || 'ALL'));
  });

  if (activeTab === 'messages') {
    inboxListEl.classList.remove('hidden');
    newsListEl.classList.add('hidden');

    const catFilter = gameState.inboxCategoryFilter || 'ALL';
    const filtered = msgs.filter(m => m && (catFilter === 'ALL' || m.senderType === catFilter));

    if (filtered.length === 0) {
      inboxListEl.innerHTML = '<div class="comm-empty-msg">該当するメッセージはありません。</div>';
      return;
    }

    const senderClassMap = {
      manager: 'comm-sender-manager',
      player: 'comm-sender-player',
      scout: 'comm-sender-scout',
      board: 'comm-sender-board',
      secretary: 'comm-sender-secretary'
    };

    inboxListEl.innerHTML = filtered.slice(0, 25).map(m => {
      const isExpanded = gameState.expandedMessageId === m.id;
      const senderClass = senderClassMap[m.senderType] || 'comm-sender-secretary';

      let candHtml = '';
      if (isExpanded && Array.isArray(m.candidatePlayers) && m.candidatePlayers.length > 0) {
        const rows = m.candidatePlayers.map(c => {
          const inList = typeof isInShortlist === 'function' && isInShortlist(c.playerId);
          const feeLabel = c.isFreeAgent ? '移籍金 £0' : `推定 ${formatMoney(c.estimatedFee)}`;
          return `
            <div class="wish-candidate-row">
              <div class="wish-candidate-info">
                <span class="wish-candidate-pos mono">${escapeCommHtml(c.pos)}</span>
                <span class="wish-candidate-name">${escapeCommHtml(c.name)}</span>
                <span class="wish-candidate-meta mono">OVR ${c.ovr} · ${c.age}歳 · ${escapeCommHtml(c.clubName)}</span>
                <span class="wish-candidate-fee mono">${feeLabel}</span>
              </div>
              <div class="wish-candidate-actions">
                <button type="button" class="btn btn-secondary btn-sm mono" data-msg-profile="${escapeCommHtml(c.playerId)}" style="white-space:nowrap;flex-shrink:0;">詳細</button>
                <button type="button" class="btn btn-primary btn-sm mono" data-msg-negotiate="${escapeCommHtml(c.playerId)}" style="white-space:nowrap;flex-shrink:0;">交渉</button>
                <button type="button" class="btn btn-secondary btn-sm mono" data-msg-shortlist="${escapeCommHtml(c.playerId)}" style="white-space:nowrap;flex-shrink:0;">${inList ? '候補解除' : '候補追加'}</button>
              </div>
            </div>
          `;
        }).join('');
        candHtml = `<div class="wish-candidates-list">${rows}</div>`;
      }

      const actionBtnHtml = (isExpanded && m.actionType && m.actionLabel)
        ? `<div class="inbox-row-actions"><button type="button" class="btn btn-secondary btn-sm mono" data-msg-action="${escapeCommHtml(m.actionType)}" data-msg-payload="${escapeCommHtml(m.actionPayload || '')}" style="white-space:nowrap;flex-shrink:0;">${escapeCommHtml(m.actionLabel)}</button></div>`
        : '';

      return `
        <div class="inbox-row ${m.read ? 'is-read' : 'is-unread'} ${isExpanded ? 'is-expanded' : ''}" data-inbox-msg-id="${escapeCommHtml(m.id)}">
          <div class="inbox-row-head">
            <div class="inbox-row-left">
              <span class="${m.read ? 'inbox-read-spacer' : 'inbox-unread-dot'}" aria-hidden="true"></span>
              <span class="comm-sender-label ${senderClass}">${escapeCommHtml(m.senderName)}</span>
              <span class="inbox-row-title">${escapeCommHtml(m.title)}</span>
            </div>
            <span class="comm-date-text mono">${escapeCommHtml(m.date)}</span>
          </div>
          ${isExpanded ? `
            <div class="inbox-row-detail">
              <p class="inbox-row-body">${escapeCommHtml(m.body)}</p>
              ${candHtml}
              ${actionBtnHtml}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } else {
    inboxListEl.classList.add('hidden');
    newsListEl.classList.remove('hidden');

    if (news.length === 0) {
      newsListEl.innerHTML = '<div class="comm-empty-msg">現在表示できるニュースはありません。</div>';
      return;
    }

    const catClassMap = {
      '移籍': 'comm-cat-transfer',
      'リーグ': 'comm-cat-league',
      'カップ': 'comm-cat-cup',
      '監督': 'comm-cat-manager',
      'チーム': 'comm-cat-cup',
      '選手': 'comm-cat-league'
    };

    const resolveNewsVisual = (n) => {
      let foundPlayer = null;
      let foundClub = n.clubId && typeof getClubById === 'function' ? getClubById(n.clubId) : null;
      if (n.playerId) {
        for (const c of (typeof getAllManagedLeagueClubs === 'function' ? getAllManagedLeagueClubs() : (gameState.clubs || []))) {
          const p = (c.players || []).find(x => x && x.id === n.playerId);
          if (p) { foundPlayer = p; foundClub = c; break; }
        }
        if (!foundPlayer && Array.isArray(gameState.transferMarket)) {
          foundPlayer = gameState.transferMarket.find(x => x && x.id === n.playerId) || null;
        }
      }
      if (foundPlayer && typeof getPlayerAvatarHtml === 'function') {
        return {
          hasPlayer: true,
          player: foundPlayer,
          html: `<div class="news-thumb-circle is-player">${getPlayerAvatarHtml(foundPlayer, foundClub || getPlayerClub(), 'avatar-sm news-thumb-avatar')}</div>`
        };
      }
      const fallbackClub = foundClub || getPlayerClub();
      return {
        hasPlayer: false,
        player: null,
        html: `<div class="news-thumb-circle is-club">${typeof getClubEmblemSvg === 'function' && fallbackClub ? getClubEmblemSvg(fallbackClub, 26, 'news-thumb-emblem') : ''}</div>`
      };
    };

    newsListEl.innerHTML = news.slice(0, 25).map(n => {
      const catClass = catClassMap[n.category] || 'comm-cat-league';
      const isExpanded = gameState.expandedNewsId === n.id;
      const thumb = resolveNewsVisual(n);
      const leadText = n.lead || (n.body ? String(n.body).slice(0, 44) : '');
      const readLabel = n.actionLabel || (n.body ? '本文を読む' : '');
      const displayDate = n.fullDate || n.date || '';

      return `
        <div class="news-row ${n.highlight ? 'is-highlight' : ''} ${isExpanded ? 'is-expanded' : ''}" data-news-id="${escapeCommHtml(n.id)}">
          <div class="news-row-layout">
            ${thumb.html}
            <div class="news-main-col">
              <div class="news-row-headline">${escapeCommHtml(n.headline)}</div>
              ${leadText ? `<div class="news-row-lead">${escapeCommHtml(leadText)}</div>` : ''}
              <div class="news-row-meta">
                <div class="news-row-meta-left">
                  <span class="comm-sender-label ${catClass}">${escapeCommHtml(n.category)}</span>
                  ${readLabel ? `<span class="news-read-trigger">${isExpanded ? '記事を閉じる' : escapeCommHtml(readLabel)}</span>` : ''}
                </div>
                <span class="comm-date-text mono">${escapeCommHtml(displayDate)}</span>
              </div>
              ${isExpanded && n.body ? `
                <div class="news-row-detail">
                  <p class="news-row-body">${escapeCommHtml(n.body)}</p>
                  ${thumb.hasPlayer ? `<div class="news-detail-actions"><button type="button" class="btn btn-secondary btn-sm mono" data-news-profile="${escapeCommHtml(thumb.player.id)}" style="white-space:nowrap;">選手詳細を見る</button></div>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    if (typeof renderAvatarCanvases === 'function') renderAvatarCanvases(newsListEl);
  }
}

function handleInboxMessageAction(actionType, payload) {
  if (!actionType) return;
  if (actionType === 'open-player-profile' && payload) {
    if (typeof openPlayerProfileModal === 'function') {
      openPlayerProfileModal(payload);
    }
    return;
  }
  if (actionType === 'goto-market-offers') {
    switchTab('market');
    switchMarketSubtab('offers');
    if (payload === 'outgoing' || payload === 'incoming') {
      gameState.offersSubtab = payload;
      renderIncomingOffers();
    }
    return;
  }
  if (typeof handleGmDutyAction === 'function') {
    handleGmDutyAction(actionType);
  }
}

function initOfficeCommAndSecretaryEvents() {
  const tabMessages = document.getElementById('office-comm-tab-messages');
  const tabNews = document.getElementById('office-comm-tab-news');
  if (tabMessages) {
    tabMessages.addEventListener('click', () => {
      gameState.officeCommTab = 'messages';
      renderOfficeCommPanel();
    });
  }
  if (tabNews) {
    tabNews.addEventListener('click', () => {
      gameState.officeCommTab = 'news';
      renderOfficeCommPanel();
    });
  }

  const filterBar = document.getElementById('inbox-filter-bar');
  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-inbox-filter]');
      if (!btn || !btn.dataset.inboxFilter) return;
      gameState.inboxCategoryFilter = btn.dataset.inboxFilter;
      renderOfficeCommPanel();
    });
  }

  const markAllBtn = document.getElementById('btn-mark-all-read');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', markAllInboxMessagesRead);
  }

  const inboxListEl = document.getElementById('office-inbox-list');
  const newsListEl = document.getElementById('office-news-list');
  if (newsListEl) {
    newsListEl.addEventListener('click', (e) => {
      const profBtn = e.target.closest('[data-news-profile]');
      if (profBtn) {
        e.stopPropagation();
        if (typeof openPlayerProfileModal === 'function') {
          openPlayerProfileModal(profBtn.dataset.newsProfile);
        }
        return;
      }
      const row = e.target.closest('[data-news-id]');
      if (row && row.dataset.newsId) {
        gameState.expandedNewsId = (gameState.expandedNewsId === row.dataset.newsId) ? null : row.dataset.newsId;
        renderOfficeCommPanel();
      }
    });
  }
  if (inboxListEl) {
    inboxListEl.addEventListener('click', (e) => {
      const profBtn = e.target.closest('[data-msg-profile]');
      if (profBtn) {
        e.stopPropagation();
        if (typeof openPlayerProfileModal === 'function') {
          openPlayerProfileModal(profBtn.dataset.msgProfile);
        }
        return;
      }
      const negBtn = e.target.closest('[data-msg-negotiate]');
      if (negBtn) {
        e.stopPropagation();
        if (typeof openTransferNegotiationModal === 'function') {
          openTransferNegotiationModal(negBtn.dataset.msgNegotiate);
        }
        return;
      }
      const slBtn = e.target.closest('[data-msg-shortlist]');
      if (slBtn) {
        e.stopPropagation();
        if (typeof toggleShortlist === 'function') {
          toggleShortlist(slBtn.dataset.msgShortlist);
          renderOfficeCommPanel();
        }
        return;
      }
      const actBtn = e.target.closest('[data-msg-action]');
      if (actBtn) {
        e.stopPropagation();
        handleInboxMessageAction(actBtn.dataset.msgAction, actBtn.dataset.msgPayload || '');
        return;
      }
      const row = e.target.closest('[data-inbox-msg-id]');
      if (row && row.dataset.inboxMsgId) {
        const msgId = row.dataset.inboxMsgId;
        markInboxMessageRead(msgId);
        gameState.expandedMessageId = (gameState.expandedMessageId === msgId) ? null : msgId;
        renderOfficeCommPanel();
        renderSecretaryBriefing();
      }
    });
  }

  const closeSecBtn = document.getElementById('btn-close-secretary-modal');
  if (closeSecBtn) {
    closeSecBtn.addEventListener('click', closeSecretarySelectModal);
  }
  const secModal = document.getElementById('secretary-select-modal');
  if (secModal) {
    secModal.addEventListener('click', (e) => {
      if (e.target === secModal) closeSecretarySelectModal();
    });
  }
  const closeGmBtn = document.getElementById('btn-close-gm-modal');
  if (closeGmBtn) {
    closeGmBtn.addEventListener('click', () => closeGmModal(false));
  }
}

