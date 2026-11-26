// ==========================================================================
// フルスクリーン演出エンジン（cinematic.js）
// 選手獲得・放出・昇格・契約更新・試合終了・優勝・昇降格・就任・落成・個人賞等
// ==========================================================================

const CinematicOverlay = (() => {
  const queue = [];
  let current = null;
  let autoTimerId = null;
  let fadeTimerId = null;
  let isClosing = false;
  let keyListener = null;
  let clickListener = null;
  let prevBodyLocked = false;

  function escapeHtml(text) {
    if (typeof escapeCommHtml === 'function') {
      return escapeCommHtml(text);
    }
    return String(text ?? '').replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  function hasAnyOpenModal() {
    if (typeof document === 'undefined') return false;
    const overlays = document.querySelectorAll('.modal-overlay, #match-event-modal, #comm-detail-sheet-overlay, #info-popup-modal');
    for (const el of overlays) {
      if (el && el.id !== 'cinematic-overlay' && !el.classList.contains('hidden')) {
        return true;
      }
    }
    return false;
  }

  function clearTimers() {
    if (autoTimerId) {
      clearTimeout(autoTimerId);
      autoTimerId = null;
    }
    if (fadeTimerId) {
      clearTimeout(fadeTimerId);
      fadeTimerId = null;
    }
  }

  function detachListeners(overlay) {
    if (typeof document !== 'undefined' && keyListener) {
      document.removeEventListener('keydown', keyListener, true);
      keyListener = null;
    }
    if (overlay && clickListener) {
      overlay.removeEventListener('click', clickListener);
      clickListener = null;
    }
  }

  function canPlay(tier = 'normal') {
    if (typeof document === 'undefined') return false;
    if (typeof isFastForwardingSeason !== 'undefined' && isFastForwardingSeason) {
      return false;
    }
    if (typeof gameState !== 'undefined' && gameState && gameState._suppressCinematics) {
      return false;
    }
    const mode = (typeof appSettings !== 'undefined' && appSettings && appSettings.cinematicMode)
      ? appSettings.cinematicMode
      : 'all';
    if (mode === 'off') return false;
    if (mode === 'major' && tier !== 'major') return false;
    return true;
  }

  function renderEmblem(club, size = 56) {
    if (!club || typeof getClubEmblemSvg !== 'function') return '';
    return getClubEmblemSvg(club, size, 'cinematic-emblem');
  }

  function buildTrophySvg(trophyType = 'league') {
    const isEuro = trophyType === 'euro';
    const isCup = trophyType === 'cup';
    const primary = isEuro ? '#e5c158' : (isCup ? '#d4af37' : '#f1c40f');
    const secondary = isEuro ? '#94a3b8' : '#b78916';
    return `
      <svg class="cinematic-trophy-svg" viewBox="0 0 120 120" width="96" height="96" aria-hidden="true">
        <defs>
          <linearGradient id="cinTrophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fff4b8"/>
            <stop offset="45%" stop-color="${primary}"/>
            <stop offset="100%" stop-color="${secondary}"/>
          </linearGradient>
        </defs>
        <path d="M32 22 H88 L82 58 C79 72 70 80 60 80 C50 80 41 72 38 58 Z" fill="url(#cinTrophyGrad)"/>
        <path d="M32 28 H19 C17 44 23 56 36 58" fill="none" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>
        <path d="M88 28 H101 C103 44 97 56 84 58" fill="none" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>
        <rect x="54" y="79" width="12" height="16" fill="${primary}"/>
        <rect x="38" y="95" width="44" height="7" rx="2" fill="${secondary}"/>
        <rect x="31" y="102" width="58" height="8" rx="2" fill="#2c333a" stroke="${primary}" stroke-width="1.5"/>
        <polygon points="60,34 63,43 72,43 65,49 67,58 60,52 53,58 55,49 48,43 57,43" fill="#fff8d6" opacity="0.85"/>
      </svg>
    `;
  }

  function buildMediaHtml(cfg) {
    const type = cfg.type || '';
    if (type === 'big_match_kickoff') {
      const hEmblem = renderEmblem(cfg.club, 56);
      const aEmblem = renderEmblem(cfg.awayClub, 56);
      const hName = cfg.club ? escapeHtml(cfg.club.name) : 'HOME';
      const aName = cfg.awayClub ? escapeHtml(cfg.awayClub.name) : 'AWAY';
      const buildStarHtml = (star, clubObj, sideCls) => {
        if (!star) return '';
        const starAv = typeof getPlayerAvatarHtml === 'function'
          ? getPlayerAvatarHtml(star, clubObj, 'cinematic-matchup-star-avatar', 44)
          : '';
        const starOvr = typeof getPlayerOverallRating === 'function' ? getPlayerOverallRating(star) : (star.ovr || '-');
        return `
          <div class="cinematic-matchup-star ${sideCls}">
            <div class="cinematic-matchup-star-av">${starAv}</div>
            <div class="cinematic-matchup-star-meta">
              <span class="cinematic-matchup-star-name">${escapeHtml(star.name || '')}</span>
              <span class="cinematic-matchup-star-ovr mono">OVR ${escapeHtml(String(starOvr))}</span>
            </div>
          </div>
        `;
      };
      const starsRow = (cfg.homeStar || cfg.awayStar)
        ? `<div class="cinematic-matchup-stars">${buildStarHtml(cfg.homeStar, cfg.club, 'is-home')}<span class="cinematic-matchup-key mono">KEY MATCHUP</span>${buildStarHtml(cfg.awayStar, cfg.awayClub, 'is-away')}</div>`
        : '';
      return `
        <div class="cinematic-matchup-stage">
          <div class="cinematic-scoreboard">
            <div class="cinematic-score-side ${cfg.club && cfg.club.isPlayer ? 'is-player' : ''}">
              <div class="cinematic-emblem-wrap">${hEmblem}</div>
              <div class="cinematic-score-team">${hName}</div>
            </div>
            <div class="cinematic-score-center">
              <div class="cinematic-matchup-vs mono">VS</div>
            </div>
            <div class="cinematic-score-side ${cfg.awayClub && cfg.awayClub.isPlayer ? 'is-player' : ''}">
              <div class="cinematic-emblem-wrap">${aEmblem}</div>
              <div class="cinematic-score-team">${aName}</div>
            </div>
          </div>
          ${starsRow}
        </div>
      `;
    }

    if (type === 'match_fulltime' && cfg.score) {
      const hEmblem = renderEmblem(cfg.club, 52);
      const aEmblem = renderEmblem(cfg.awayClub, 52);
      const hName = cfg.club ? escapeHtml(cfg.club.name) : 'HOME';
      const aName = cfg.awayClub ? escapeHtml(cfg.awayClub.name) : 'AWAY';
      const pkLine = (cfg.score.pkHome != null && cfg.score.pkAway != null)
        ? `<div class="cinematic-pk-note mono">PK ${cfg.score.pkHome} - ${cfg.score.pkAway}</div>`
        : '';
      return `
        <div class="cinematic-scoreboard">
          <div class="cinematic-score-side ${cfg.club && cfg.club.isPlayer ? 'is-player' : ''}">
            <div class="cinematic-emblem-wrap">${hEmblem}</div>
            <div class="cinematic-score-team">${hName}</div>
          </div>
          <div class="cinematic-score-center">
            <div class="cinematic-score-nums mono">${cfg.score.home}<span>-</span>${cfg.score.away}</div>
            ${pkLine}
          </div>
          <div class="cinematic-score-side ${cfg.awayClub && cfg.awayClub.isPlayer ? 'is-player' : ''}">
            <div class="cinematic-emblem-wrap">${aEmblem}</div>
            <div class="cinematic-score-team">${aName}</div>
          </div>
        </div>
      `;
    }

    if (type === 'stadium_inauguration' && cfg.stadiumId && typeof getStadiumIllustrationSvg === 'function') {
      const stSvg = getStadiumIllustrationSvg(cfg.stadiumId, cfg.club, cfg.stadiumLv || 1, false);
      return `<div class="cinematic-stadium-stage">${stSvg}</div>`;
    }

    if (type === 'trophy_championship') {
      return `
        <div class="cinematic-media-pair">
          <div class="cinematic-trophy-wrap">${buildTrophySvg(cfg.trophyType || 'league')}</div>
          ${cfg.club ? `<div class="cinematic-emblem-wrap">${renderEmblem(cfg.club, 56)}</div>` : ''}
        </div>
      `;
    }

    const avatarHtml = (cfg.player && typeof getPlayerAvatarHtml === 'function')
      ? `<div class="cinematic-avatar-frame">${getPlayerAvatarHtml(cfg.player, cfg.club, 'cinematic-avatar', 96)}</div>`
      : '';
    const emblemHtml = (cfg.club && type !== 'player_departure')
      ? `<div class="cinematic-emblem-wrap">${renderEmblem(cfg.club, avatarHtml ? 46 : 64)}</div>`
      : '';
    const awardIconHtml = (type === 'individual_award' && typeof buildAwardHonorIconSvg === 'function')
      ? `<div class="cinematic-award-icon-wrap">${buildAwardHonorIconSvg(cfg.awardCode || 'MVP', cfg.eyebrow || 'AWARD', 44)}</div>`
      : '';

    if (!avatarHtml && !emblemHtml && !awardIconHtml) return '';
    return `<div class="cinematic-media-pair">${awardIconHtml}${avatarHtml}${emblemHtml}</div>`;
  }

  function buildConfettiHtml(enabled) {
    if (!enabled) return '';
    const pieces = [];
    for (let i = 0; i < 20; i++) {
      const left = ((i * 19 + 7) % 94) + 3;
      const delay = ((i % 7) * 0.11).toFixed(2);
      const dur = (1.9 + (i % 5) * 0.25).toFixed(2);
      const toneClass = i % 3 === 0 ? 'is-gold' : (i % 3 === 1 ? 'is-green' : 'is-silver');
      pieces.push(`<span class="cinematic-confetti-piece ${toneClass}" style="left:${left}%; animation-delay:${delay}s; animation-duration:${dur}s;"></span>`);
    }
    return `<div class="cinematic-confetti-layer" aria-hidden="true">${pieces.join('')}</div>`;
  }

  function buildOverlayHtml(cfg) {
    const mediaHtml = buildMediaHtml(cfg);
    const metricsList = Array.isArray(cfg.metrics) ? cfg.metrics.slice(0, 3) : [];
    const metricsHtml = metricsList.length > 0
      ? `<div class="cinematic-metrics">${metricsList.map(m => {
        const toneCls = m.tone ? `tone-${escapeHtml(m.tone)}` : '';
        return `
          <div class="cinematic-metric-item">
            <span class="cinematic-metric-label">${escapeHtml(m.label)}</span>
            <span class="cinematic-metric-value mono ${toneCls}">${escapeHtml(m.value)}</span>
          </div>
        `;
      }).join('')}</div>`
      : '';

    const subHtml = cfg.subtitle
      ? `<div class="cinematic-subtitle">${escapeHtml(cfg.subtitle)}</div>`
      : '';

    return `
      ${buildConfettiHtml(Boolean(cfg.confetti))}
      <div class="cinematic-backdrop" aria-hidden="true"></div>
      <div class="cinematic-band" aria-hidden="true"></div>
      <div class="cinematic-stage">
        <div class="cinematic-eyebrow mono">${escapeHtml(cfg.eyebrow || '')}</div>
        ${mediaHtml}
        <h2 class="cinematic-title">${escapeHtml(cfg.title || '')}</h2>
        ${subHtml}
        ${metricsHtml}
        <div class="cinematic-skip-hint">タップまたはキーでスキップ</div>
      </div>
    `;
  }

  function finishCurrent() {
    const overlay = typeof document !== 'undefined' ? document.getElementById('cinematic-overlay') : null;
    clearTimers();
    detachListeners(overlay);

    const finished = current;
    current = null;
    isClosing = false;

    if (queue.length > 0) {
      if (finished && typeof finished.onComplete === 'function') {
        try { finished.onComplete(); } catch (e) {}
      }
      _playNext();
      return;
    }

    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('is-entering', 'is-leaving');
      overlay.removeAttribute('data-theme');
      overlay.innerHTML = '';
    }

    if (!prevBodyLocked && !hasAnyOpenModal() && typeof setBodyModalLock === 'function') {
      setBodyModalLock(false);
    }

    if (finished && typeof finished.onComplete === 'function') {
      try { finished.onComplete(); } catch (e) {}
    }
  }

  function skip() {
    if (!current || isClosing) return;
    isClosing = true;
    clearTimers();

    const overlay = typeof document !== 'undefined' ? document.getElementById('cinematic-overlay') : null;
    if (!overlay) {
      finishCurrent();
      return;
    }
    overlay.classList.remove('is-entering');
    overlay.classList.add('is-leaving');
    fadeTimerId = setTimeout(finishCurrent, 220);
  }

  function clear() {
    queue.length = 0;
    const overlay = typeof document !== 'undefined' ? document.getElementById('cinematic-overlay') : null;
    clearTimers();
    detachListeners(overlay);
    const active = current;
    current = null;
    isClosing = false;
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('is-entering', 'is-leaving');
      overlay.removeAttribute('data-theme');
      overlay.innerHTML = '';
    }
    if (!prevBodyLocked && !hasAnyOpenModal() && typeof setBodyModalLock === 'function') {
      setBodyModalLock(false);
    }
    if (active && typeof active.onComplete === 'function') {
      try { active.onComplete(); } catch (e) {}
    }
  }

  function _playNext() {
    if (current || queue.length === 0) return;
    const entry = queue.shift();
    const overlay = typeof document !== 'undefined' ? document.getElementById('cinematic-overlay') : null;
    if (!overlay) {
      if (typeof entry.onComplete === 'function') entry.onComplete();
      if (queue.length > 0) _playNext();
      return;
    }

    const wasOpenBefore = !overlay.classList.contains('hidden');
    if (!wasOpenBefore) {
      prevBodyLocked = Boolean(document.body && document.body.classList.contains('modal-open'));
    }

    current = entry;
    isClosing = false;
    clearTimers();
    detachListeners(overlay);

    const cfg = entry.config || {};
    overlay.setAttribute('data-theme', cfg.theme || 'green');
    overlay.innerHTML = buildOverlayHtml(cfg);
    overlay.classList.remove('hidden', 'is-leaving');
    void overlay.offsetWidth;
    overlay.classList.add('is-entering');

    if (typeof setBodyModalLock === 'function') {
      setBodyModalLock(true);
    }
    if (typeof renderAvatarCanvases === 'function') {
      renderAvatarCanvases(overlay);
    }

    if (cfg.sfx && typeof SoundEngine !== 'undefined' && SoundEngine && typeof SoundEngine.playSfx === 'function') {
      SoundEngine.playSfx(cfg.sfx);
    }

    clickListener = (e) => {
      e.preventDefault();
      e.stopPropagation();
      skip();
    };
    overlay.addEventListener('click', clickListener);

    keyListener = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        skip();
      }
    };
    document.addEventListener('keydown', keyListener, true);

    const dur = Math.max(800, Number(cfg.durationMs) || 2400);
    autoTimerId = setTimeout(skip, dur);
  }

  function enqueue(config, onComplete = null) {
    if (!config) {
      if (typeof onComplete === 'function') onComplete();
      return false;
    }
    if (!canPlay(config.tier || 'normal')) {
      if (typeof onComplete === 'function') onComplete();
      return false;
    }
    const overlay = typeof document !== 'undefined' ? document.getElementById('cinematic-overlay') : null;
    if (!overlay) {
      if (typeof onComplete === 'function') onComplete();
      return false;
    }
    queue.push({ config, onComplete });
    if (!current) {
      _playNext();
    }
    return true;
  }

  function isActive() {
    return Boolean(current);
  }

  return {
    enqueue,
    skip,
    clear,
    canPlay,
    isActive
  };
})();
