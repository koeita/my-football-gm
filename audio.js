// ==========================================================================
// サウンド管理エンジン（audio.js）
// CC0実録音・本格制作MP3音源 + シーン別クロスフェード + 個別チャンネル音量管理
// ==========================================================================

const AUDIO_MANIFEST = {
  // BGM・環境音トラック（ループ再生）
  bgm_title: {
    src: 'assets/audio/bgm_title.mp3',
    channel: 'bgm',
    gain: 0.34,
    loop: true
  },
  bgm_office: {
    src: 'assets/audio/bgm_office.mp3',
    channel: 'bgm',
    gain: 0.30,
    loop: true
  },
  amb_stadium: {
    src: 'assets/audio/amb_stadium.mp3',
    channel: 'ambience',
    gain: 0.44,
    loop: true
  },

  // 試合場面SE
  sfx_whistle_short: {
    src: 'assets/audio/sfx_whistle_short.mp3',
    channel: 'se',
    gain: 0.56,
    cooldownMs: 160
  },
  sfx_whistle_long: {
    src: 'assets/audio/sfx_whistle_long.mp3',
    channel: 'se',
    gain: 0.58,
    maxDurationMs: 2500,
    cooldownMs: 250
  },
  sfx_kick: {
    src: 'assets/audio/sfx_kick.mp3',
    channel: 'se',
    gain: 0.52,
    cooldownMs: 180
  },
  sfx_goal_cheer: {
    src: 'assets/audio/sfx_goal_cheer.mp3',
    channel: 'se',
    gain: 0.85,
    cooldownMs: 400
  },
  sfx_crowd_groan: {
    src: 'assets/audio/sfx_crowd_groan.mp3',
    channel: 'se',
    gain: 0.62,
    maxDurationMs: 3200,
    cooldownMs: 300
  },
  sfx_crowd_boo: {
    src: 'assets/audio/sfx_crowd_boo.mp3',
    channel: 'se',
    gain: 0.55,
    cooldownMs: 300
  },
  sfx_applause: {
    src: 'assets/audio/sfx_applause.mp3',
    channel: 'se',
    gain: 0.52,
    maxDurationMs: 2800,
    cooldownMs: 250
  },

  // UI操作音（控えめ・高品位）
  ui_tap: {
    src: 'assets/audio/ui_tap.mp3',
    channel: 'se',
    gain: 0.22,
    cooldownMs: 70
  },
  ui_confirm: {
    src: 'assets/audio/ui_confirm.mp3',
    channel: 'se',
    gain: 0.26,
    cooldownMs: 90
  },
  ui_cancel: {
    src: 'assets/audio/ui_cancel.mp3',
    channel: 'se',
    gain: 0.22,
    cooldownMs: 80
  },
  ui_page: {
    src: 'assets/audio/ui_page.mp3',
    channel: 'se',
    gain: 0.28,
    cooldownMs: 140
  },

  // イベント演出音・ジングル
  jingle_victory: {
    src: 'assets/audio/jingle_victory.mp3',
    channel: 'se',
    gain: 0.68,
    maxDurationMs: 5600,
    duckBgmMs: 5200,
    cooldownMs: 400
  },
  jingle_awaken: {
    src: 'assets/audio/jingle_awaken.mp3',
    channel: 'se',
    gain: 0.68,
    maxDurationMs: 4400,
    duckBgmMs: 4000,
    cooldownMs: 400
  },
  sfx_deal: {
    src: 'assets/audio/sfx_deal.mp3',
    channel: 'se',
    gain: 0.52,
    maxDurationMs: 2600,
    cooldownMs: 200
  },
  sfx_notify: {
    src: 'assets/audio/sfx_notify.mp3',
    channel: 'se',
    gain: 0.38,
    cooldownMs: 140
  },
  sfx_alert: {
    src: 'assets/audio/sfx_alert.mp3',
    channel: 'se',
    gain: 0.45,
    cooldownMs: 200
  }
};

const SCENE_TO_TRACK = {
  title: 'bgm_title',
  prematch: 'bgm_title',
  office: 'bgm_office',
  match: 'amb_stadium',
  silent: null
};

const SoundEngine = (() => {
  const state = {
    initialized: false,
    unlocked: false,
    pausedByBackground: false,
    currentScene: 'title',
    currentTrackKey: null,
    activeLoopAudio: null,
    activeLoopFadeFactor: 1.0,
    duckMultiplier: 1.0,
    duckTimerId: null,
    fadeIntervalId: null,
    fadingOutEntries: [],
    sePools: {},
    lastPlayedAt: {},
    lastNonUiSfxAt: 0,
    activeSeTimers: new Set(),
    settings: {
      soundEnabled: true,
      masterVolume: 70,
      bgmVolume: 60,
      seVolume: 80
    },
    effectiveBgmFactor: 0.42,
    effectiveSeFactor: 0.56,
    fallbackCtx: null,
    loadedAssetsCount: 0
  };

  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function isFastForwardSuppressed(opts) {
    if (opts && opts.allowDuringSkip) return false;
    return typeof isFastForwardingSeason !== 'undefined' && Boolean(isFastForwardingSeason);
  }

  /**
   * appSettings から音量・ミュート状態を同期
   */
  function syncFromSettings() {
    if (typeof appSettings === 'object' && appSettings) {
      state.settings.soundEnabled = appSettings.soundEnabled !== false;
      state.settings.masterVolume = typeof appSettings.soundVolume === 'number'
        ? clampNum(appSettings.soundVolume, 0, 100)
        : 70;
      state.settings.bgmVolume = typeof appSettings.bgmVolume === 'number'
        ? clampNum(appSettings.bgmVolume, 0, 100)
        : 60;
      state.settings.seVolume = typeof appSettings.seVolume === 'number'
        ? clampNum(appSettings.seVolume, 0, 100)
        : 80;
    }

    const master = state.settings.soundEnabled ? (state.settings.masterVolume / 100) : 0;
    state.effectiveBgmFactor = Number((master * (state.settings.bgmVolume / 100)).toFixed(4));
    state.effectiveSeFactor = Number((master * (state.settings.seVolume / 100)).toFixed(4));
    applyTrackVolumes();
  }

  function getChannelScale(channel) {
    if (channel === 'bgm') {
      return state.effectiveBgmFactor * state.duckMultiplier;
    }
    return state.effectiveSeFactor;
  }

  function computeEffectiveVolume(key, extraScale = 1.0) {
    const def = AUDIO_MANIFEST[key];
    if (!def) return 0;
    return clampNum(def.gain * getChannelScale(def.channel) * extraScale, 0, 1);
  }

  /**
   * 再生中のループトラック音量を現在の設定・フェード・ダッキング状態へ反映
   */
  function applyTrackVolumes() {
    if (state.activeLoopAudio && state.currentTrackKey) {
      const targetVol = computeEffectiveVolume(state.currentTrackKey, state.activeLoopFadeFactor);
      state.activeLoopAudio.volume = targetVol;
      if (targetVol <= 0.001 && !state.activeLoopAudio.paused && !state.settings.soundEnabled) {
        state.activeLoopAudio.pause();
      } else if (
        targetVol > 0.001
        && state.unlocked
        && !state.pausedByBackground
        && state.activeLoopAudio.paused
      ) {
        safePlayElement(state.activeLoopAudio, state.currentTrackKey, false);
      }
    }
    state.fadingOutEntries.forEach(entry => {
      if (entry && entry.audio && entry.key) {
        entry.audio.volume = computeEffectiveVolume(entry.key, entry.fadeFactor);
      }
    });
  }

  function createAudioElement(key) {
    const def = AUDIO_MANIFEST[key];
    if (!def || typeof Audio === 'undefined') return null;
    const audio = new Audio(def.src);
    audio.preload = def.loop ? 'auto' : 'metadata';
    audio.loop = Boolean(def.loop);
    return audio;
  }

  function safePlayElement(audio, key, allowFallbackOnError = true) {
    if (!audio) return;
    try {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          if (err && err.name === 'NotAllowedError') {
            return;
          }
          if (allowFallbackOnError) {
            playSoftFallbackTone(AUDIO_MANIFEST[key]);
          }
        });
      }
    } catch (e) {
      if (allowFallbackOnError) {
        playSoftFallbackTone(AUDIO_MANIFEST[key]);
      }
    }
  }

  /**
   * 万一の音源読込失敗時のみ鳴らす控えめなWeb Audioフォールバック
   */
  function playSoftFallbackTone(def) {
    if (!def || !state.unlocked || !state.settings.soundEnabled || state.effectiveSeFactor <= 0) return;
    if (def.channel === 'bgm' || def.channel === 'ambience') return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!state.fallbackCtx) state.fallbackCtx = new Ctx();
      const ctx = state.fallbackCtx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.08);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      const peak = clampNum(def.gain * state.effectiveSeFactor * 0.14, 0.005, 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  function applyBgmDuck(durationMs) {
    if (!durationMs || durationMs <= 0) return;
    if (state.duckTimerId) {
      clearTimeout(state.duckTimerId);
      state.duckTimerId = null;
    }
    state.duckMultiplier = 0.42;
    applyTrackVolumes();
    state.duckTimerId = setTimeout(() => {
      state.duckTimerId = null;
      state.duckMultiplier = 1.0;
      applyTrackVolumes();
    }, durationMs);
  }

  function clearLoopFadeTimer() {
    if (state.fadeIntervalId) {
      clearInterval(state.fadeIntervalId);
      state.fadeIntervalId = null;
    }
  }

  function stopFadingEntry(entry) {
    if (!entry || !entry.audio) return;
    try {
      entry.audio.pause();
      entry.audio.currentTime = 0;
    } catch (e) {}
  }

  function startTrackCrossfade(nextTrackKey) {
    clearLoopFadeTimer();

    if (state.activeLoopAudio && state.currentTrackKey) {
      state.fadingOutEntries.push({
        key: state.currentTrackKey,
        audio: state.activeLoopAudio,
        fadeFactor: state.activeLoopFadeFactor
      });
    }

    state.currentTrackKey = nextTrackKey;
    if (nextTrackKey) {
      const nextAudio = createAudioElement(nextTrackKey);
      state.activeLoopAudio = nextAudio;
      state.activeLoopFadeFactor = 0.02;
      if (nextAudio) {
        nextAudio.volume = computeEffectiveVolume(nextTrackKey, state.activeLoopFadeFactor);
        if (state.unlocked && !state.pausedByBackground && nextAudio.volume >= 0 && state.settings.soundEnabled) {
          safePlayElement(nextAudio, nextTrackKey, false);
        }
      }
    } else {
      state.activeLoopAudio = null;
      state.activeLoopFadeFactor = 0;
    }

    const totalMs = 650;
    const stepMs = 30;
    const stepDelta = stepMs / totalMs;
    state.fadeIntervalId = setInterval(() => {
      let allDone = true;

      if (state.activeLoopAudio && state.activeLoopFadeFactor < 1) {
        state.activeLoopFadeFactor = Math.min(1, state.activeLoopFadeFactor + stepDelta);
        if (state.activeLoopFadeFactor < 1) allDone = false;
      }

      const remaining = [];
      state.fadingOutEntries.forEach(entry => {
        entry.fadeFactor = Math.max(0, entry.fadeFactor - stepDelta * 1.15);
        if (entry.fadeFactor > 0.01) {
          remaining.push(entry);
          allDone = false;
        } else {
          stopFadingEntry(entry);
        }
      });
      state.fadingOutEntries = remaining;
      applyTrackVolumes();

      if (allDone) {
        clearLoopFadeTimer();
      }
    }, stepMs);
  }

  /**
   * シーンを切り替え、対応するBGM／スタジアム環境音へクロスフェード
   */
  function setScene(sceneKey) {
    if (!Object.prototype.hasOwnProperty.call(SCENE_TO_TRACK, sceneKey)) return;
    state.currentScene = sceneKey;
    const nextTrackKey = SCENE_TO_TRACK[sceneKey];

    if (nextTrackKey === state.currentTrackKey) {
      if (
        state.activeLoopAudio
        && state.unlocked
        && !state.pausedByBackground
        && state.settings.soundEnabled
        && state.activeLoopAudio.paused
        && computeEffectiveVolume(nextTrackKey, 1) > 0.001
      ) {
        state.activeLoopFadeFactor = 1.0;
        applyTrackVolumes();
        safePlayElement(state.activeLoopAudio, nextTrackKey, false);
      }
      return;
    }

    startTrackCrossfade(nextTrackKey);
  }

  function acquireSeAudio(key) {
    const def = AUDIO_MANIFEST[key];
    if (!def) return null;
    if (!state.sePools[key]) {
      state.sePools[key] = [];
    }
    const pool = state.sePools[key];
    let audio = pool.find(el => el.paused || el.ended);
    if (!audio && pool.length < 3) {
      audio = createAudioElement(key);
      if (audio) {
        audio.addEventListener('error', () => playSoftFallbackTone(def), { once: true });
        pool.push(audio);
      }
    }
    if (!audio && pool.length > 0) {
      audio = pool[0];
    }
    return audio;
  }

  function scheduleSeMaxDurationFade(audio, key, maxDurationMs, initialScale) {
    const fadeWindow = Math.min(450, Math.floor(maxDurationMs * 0.35));
    const startFadeAt = Math.max(80, maxDurationMs - fadeWindow);
    const t1 = setTimeout(() => {
      state.activeSeTimers.delete(t1);
      if (!audio || audio.paused) return;
      const steps = 8;
      const stepWait = Math.max(20, Math.floor(fadeWindow / steps));
      let idx = 0;
      const fadeIv = setInterval(() => {
        idx += 1;
        const frac = Math.max(0, 1 - (idx / steps));
        audio.volume = computeEffectiveVolume(key, initialScale * frac);
        if (idx >= steps || audio.paused) {
          clearInterval(fadeIv);
          state.activeSeTimers.delete(fadeIv);
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (e) {}
        }
      }, stepWait);
      state.activeSeTimers.add(fadeIv);
    }, startFadeAt);
    state.activeSeTimers.add(t1);
  }

  /**
   * 効果音・イベント演出音・ジングルを再生
   */
  function playSfx(key, opts = {}) {
    const def = AUDIO_MANIFEST[key];
    if (!def) return false;
    if (isFastForwardSuppressed(opts)) return false;

    const extraScale = typeof opts.volumeScale === 'number' ? clampNum(opts.volumeScale, 0, 1.5) : 1.0;
    const targetVol = computeEffectiveVolume(key, extraScale);
    if (!state.settings.soundEnabled || targetVol <= 0.001) return false;

    const now = Date.now();
    const cooldown = typeof opts.cooldownMs === 'number' ? opts.cooldownMs : (def.cooldownMs || 50);
    if (now - (state.lastPlayedAt[key] || 0) < cooldown) {
      return false;
    }
    state.lastPlayedAt[key] = now;
    if (!key.startsWith('ui_') || key === 'ui_confirm' || key === 'ui_page') {
      state.lastNonUiSfxAt = now;
    }

    if (!state.unlocked) return false;

    const playNow = () => {
      if (state.pausedByBackground) return;
      const audio = acquireSeAudio(key);
      if (!audio) return;
      try {
        audio.currentTime = 0;
      } catch (e) {}
      audio.volume = computeEffectiveVolume(key, extraScale);
      if (def.duckBgmMs) {
        applyBgmDuck(def.duckBgmMs);
      }
      safePlayElement(audio, key, true);
      const maxDur = opts.maxDurationMs || def.maxDurationMs;
      if (maxDur && maxDur > 200) {
        scheduleSeMaxDurationFade(audio, key, maxDur, extraScale);
      }
    };

    if (opts.delayMs && opts.delayMs > 0) {
      const delayTimer = setTimeout(() => {
        state.activeSeTimers.delete(delayTimer);
        playNow();
      }, opts.delayMs);
      state.activeSeTimers.add(delayTimer);
    } else {
      playNow();
    }
    return true;
  }

  function unlock() {
    if (state.unlocked) return;
    state.unlocked = true;
    syncFromSettings();
    const trackKey = SCENE_TO_TRACK[state.currentScene] || null;
    if (trackKey && !state.currentTrackKey) {
      startTrackCrossfade(trackKey);
    } else if (state.activeLoopAudio && !state.pausedByBackground && state.settings.soundEnabled && state.activeLoopAudio.paused) {
      state.activeLoopFadeFactor = 1.0;
      applyTrackVolumes();
      safePlayElement(state.activeLoopAudio, state.currentTrackKey, false);
    }
  }

  function handleBackgroundPause() {
    state.pausedByBackground = true;
    if (state.activeLoopAudio && !state.activeLoopAudio.paused) {
      state.activeLoopAudio.pause();
    }
    state.fadingOutEntries.forEach(entry => stopFadingEntry(entry));
    state.fadingOutEntries = [];
  }

  function handleForegroundResume() {
    state.pausedByBackground = false;
    applyTrackVolumes();
  }

  function isCancelControl(btn) {
    if (!btn) return false;
    if (btn.classList.contains('btn-modal-close')) return true;
    const id = btn.id || '';
    if (id.startsWith('btn-close-') || id.startsWith('btn-cancel-')) return true;
    const label = (btn.textContent || '').trim();
    return label === '閉じる' || label === 'キャンセル' || label === '✕';
  }

  function shouldSkipAutoUiSfx(btn) {
    if (!btn || btn.disabled) return true;
    if (btn.hasAttribute('data-no-auto-ui-sfx')) return true;
    const id = btn.id || '';
    const skipIds = new Set([
      'btn-panel-quick-result',
      'btn-precheck-quick-result',
      'btn-panel-kickoff',
      'btn-precheck-start-match',
      'btn-advance-day',
      'btn-office-primary-cta',
      'btn-test-sound-se'
    ]);
    if (skipIds.has(id)) return true;
    return (Date.now() - state.lastNonUiSfxAt) < 95;
  }

  function bindGlobalUiSoundDelegation() {
    if (typeof document === 'undefined' || document._hasAudioUiDelegation) return;
    document._hasAudioUiDelegation = true;

    const handleFirstGesture = () => {
      unlock();
    };
    document.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    document.addEventListener('keydown', handleFirstGesture, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) handleBackgroundPause();
      else handleForegroundResume();
    });
    window.addEventListener('pagehide', handleBackgroundPause);

    document.addEventListener('click', (e) => {
      if (!state.unlocked) unlock();
      const target = e.target && e.target.closest
        ? e.target.closest('button, [role="button"], .clickable-player-name, .gm-duty-row')
        : null;
      if (!target || shouldSkipAutoUiSfx(target)) return;
      if (isCancelControl(target)) {
        playSfx('ui_cancel');
      } else {
        playSfx('ui_tap');
      }
    }, false);
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    syncFromSettings();
    bindGlobalUiSoundDelegation();
  }

  function getDebugState() {
    return {
      initialized: state.initialized,
      unlocked: state.unlocked,
      pausedByBackground: state.pausedByBackground,
      currentScene: state.currentScene,
      currentTrackKey: state.currentTrackKey,
      settings: { ...state.settings },
      effectiveBgmFactor: state.effectiveBgmFactor,
      effectiveSeFactor: state.effectiveSeFactor,
      lastPlayedAt: { ...state.lastPlayedAt }
    };
  }

  return {
    init,
    unlock,
    setScene,
    playSfx,
    syncFromSettings,
    getDebugState,
    manifest: AUDIO_MANIFEST
  };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SoundEngine.init());
  } else {
    SoundEngine.init();
  }
}
