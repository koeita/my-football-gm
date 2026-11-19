// ==========================================================================
// サウンド管理エンジン（audio.js）
// CC0実録音・本格制作MP3音源 + Web Audio共通ミキサー + シーン別クロスフェード
// ==========================================================================

const AUDIO_MANIFEST = {
  // BGM・環境音トラック（ループ再生）
  bgm_title: {
    src: 'assets/audio/bgm_title.mp3',
    channel: 'bgm',
    gain: 0.42,
    loop: true
  },
  bgm_office: {
    src: 'assets/audio/bgm_office.mp3',
    channel: 'bgm',
    gain: 0.38,
    loop: true
  },
  amb_stadium: {
    src: 'assets/audio/amb_stadium.mp3',
    channel: 'ambience',
    gain: 0.44,
    loop: true
  },

  // 試合場面SE（先頭無音トリム済みオフセット指定）
  sfx_whistle_short: {
    src: 'assets/audio/sfx_whistle_short.mp3',
    channel: 'se',
    gain: 0.56,
    trimStartSec: 0.024,
    cooldownMs: 160
  },
  sfx_whistle_long: {
    src: 'assets/audio/sfx_whistle_long.mp3',
    channel: 'se',
    gain: 0.58,
    trimStartSec: 0.095,
    maxDurationMs: 2500,
    cooldownMs: 250
  },
  sfx_kick: {
    src: 'assets/audio/sfx_kick.mp3',
    channel: 'se',
    gain: 0.52,
    trimStartSec: 0.024,
    cooldownMs: 180
  },
  sfx_goal_cheer: {
    src: 'assets/audio/sfx_goal_cheer.mp3',
    channel: 'se',
    gain: 0.85,
    trimStartSec: 0.14,
    cooldownMs: 400
  },
  sfx_crowd_groan: {
    src: 'assets/audio/sfx_crowd_groan.mp3',
    channel: 'se',
    gain: 3.2,
    maxDurationMs: 3200,
    cooldownMs: 300
  },
  sfx_crowd_boo: {
    src: 'assets/audio/sfx_crowd_boo.mp3',
    channel: 'se',
    gain: 0.55,
    trimStartSec: 0.11,
    cooldownMs: 300
  },
  sfx_applause: {
    src: 'assets/audio/sfx_applause.mp3',
    channel: 'se',
    gain: 0.52,
    trimStartSec: 0.36,
    maxDurationMs: 2800,
    cooldownMs: 250
  },

  // UI操作音（控えめ・高品位・即時発音）
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
    trimStartSec: 0.055,
    cooldownMs: 80
  },
  ui_page: {
    src: 'assets/audio/ui_page.mp3',
    channel: 'se',
    gain: 0.30,
    trimStartSec: 0.25,
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

const SE_PRIORITY_KEYS = [
  'ui_tap',
  'ui_confirm',
  'ui_cancel',
  'ui_page',
  'sfx_notify',
  'sfx_alert'
];

const SoundEngine = (() => {
  const state = {
    initialized: false,
    unlocked: false,
    pausedByBackground: false,
    currentScene: 'title',
    currentTrackKey: null,
    activeLoopAudio: null,
    activeLoopFadeFactor: 1.0,
    activeLoopNode: null,
    fadingOutLoopNodes: [],
    loopTransitionSeq: 0,
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
    masterGainTarget: 0.6176,
    bgmGainTarget: 0.5018,
    seGainTarget: 0.74,
    effectiveBgmFactor: 0.3099,
    effectiveSeFactor: 0.457,
    audioCtx: null,
    fallbackCtx: null,
    masterGainNode: null,
    bgmChannelGainNode: null,
    bgmDuckGainNode: null,
    seChannelGainNode: null,
    rawBuffers: {},
    decodedBuffers: {},
    inflightLoads: {},
    bufferLoadStarted: false,
    activeBufferNodes: new Set(),
    lastSfxBackend: null,
    lastLoopBackend: null
  };

  function clampNum(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  /**
   * 人間の聴感に合わせたボリュームカーブ変換（0〜100% -> 0.0〜1.0）
   */
  function volumePercentToGain(pct) {
    const clamped = clampNum(typeof pct === 'number' ? pct : 0, 0, 100);
    if (clamped <= 0) return 0;
    return Math.pow(clamped / 100, 1.35);
  }

  function isHttpEnvironment() {
    if (typeof window === 'undefined' || !window.location) return false;
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  }

  function isFastForwardSuppressed(opts) {
    if (opts && opts.allowDuringSkip) return false;
    return typeof isFastForwardingSeason !== 'undefined' && Boolean(isFastForwardingSeason);
  }

  function ensureAudioContext() {
    if (state.audioCtx) return state.audioCtx;
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      state.audioCtx = new Ctx({ latencyHint: 'interactive' });
    } catch (e) {
      try {
        state.audioCtx = new Ctx();
      } catch (err) {
        return null;
      }
    }
    state.fallbackCtx = state.audioCtx;
    ensureMixerNodes(state.audioCtx);
    return state.audioCtx;
  }

  /**
   * Master / BGM(+Duck) / SE の共通 Web Audio ミキサーノードを構築
   */
  function ensureMixerNodes(ctx) {
    if (!ctx) return false;
    if (state.masterGainNode && state.bgmChannelGainNode && state.bgmDuckGainNode && state.seChannelGainNode) {
      return true;
    }
    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      const bgmChan = ctx.createGain();
      const bgmDuck = ctx.createGain();
      const seChan = ctx.createGain();

      master.gain.setValueAtTime(state.masterGainTarget, now);
      bgmChan.gain.setValueAtTime(state.bgmGainTarget, now);
      bgmDuck.gain.setValueAtTime(state.duckMultiplier, now);
      seChan.gain.setValueAtTime(state.seGainTarget, now);

      bgmDuck.connect(bgmChan);
      bgmChan.connect(master);
      seChan.connect(master);
      master.connect(ctx.destination);

      state.masterGainNode = master;
      state.bgmChannelGainNode = bgmChan;
      state.bgmDuckGainNode = bgmDuck;
      state.seChannelGainNode = seChan;
      return true;
    } catch (e) {
      return false;
    }
  }

  function smoothSetGainParam(param, val, ctx, smoothWhenActive = true) {
    if (!param || !ctx) return;
    const safeVal = val <= 0.0005 ? 0 : val;
    if (typeof param._lastTargetVal === 'number' && Math.abs(param._lastTargetVal - safeVal) < 0.0001) {
      return;
    }
    param._lastTargetVal = safeVal;
    const now = ctx.currentTime;
    try {
      const cur = Number.isFinite(param.value) ? clampNum(param.value, 0, 4.0) : safeVal;
      param.cancelScheduledValues(0);
      param.value = safeVal;
      if (smoothWhenActive && safeVal > 0 && Math.abs(cur - safeVal) > 0.001) {
        param.setValueAtTime(cur, now);
        param.linearRampToValueAtTime(safeVal, now + 0.02);
      }
    } catch (e) {
      param.value = safeVal;
    }
  }

  function decodeBufferIfPossible(key) {
    const raw = state.rawBuffers[key];
    if (!raw || state.decodedBuffers[key]) return Promise.resolve(state.decodedBuffers[key] || null);
    const ctx = ensureAudioContext();
    if (!ctx || typeof ctx.decodeAudioData !== 'function') return Promise.resolve(null);
    try {
      const copy = raw.slice(0);
      return ctx.decodeAudioData(copy).then(audioBuf => {
        if (audioBuf) {
          state.decodedBuffers[key] = audioBuf;
          delete state.rawBuffers[key];
        }
        return audioBuf || null;
      }).catch(() => null);
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function fetchAndDecodeTrack(key) {
    const def = AUDIO_MANIFEST[key];
    if (!def || typeof fetch !== 'function') return Promise.resolve(null);
    if (state.decodedBuffers[key]) return Promise.resolve(state.decodedBuffers[key]);
    if (state.inflightLoads[key]) return state.inflightLoads[key];

    const p = fetch(def.src).then(resp => {
      if (!resp || !resp.ok) return null;
      return resp.arrayBuffer();
    }).then(arrBuf => {
      if (!arrBuf) return null;
      state.rawBuffers[key] = arrBuf;
      return decodeBufferIfPossible(key);
    }).catch(() => null).finally(() => {
      delete state.inflightLoads[key];
    });

    state.inflightLoads[key] = p;
    return p;
  }

  function preloadSeBuffers() {
    if (state.bufferLoadStarted || !isHttpEnvironment()) return;
    state.bufferLoadStarted = true;
    const prioritySet = new Set(SE_PRIORITY_KEYS);
    const restSeKeys = Object.keys(AUDIO_MANIFEST).filter(k => !AUDIO_MANIFEST[k].loop && !prioritySet.has(k));
    const loopKeys = Object.keys(AUDIO_MANIFEST).filter(k => AUDIO_MANIFEST[k].loop);
    const currentLoopKey = SCENE_TO_TRACK[state.currentScene];
    const batch1 = currentLoopKey
      ? [...SE_PRIORITY_KEYS, currentLoopKey]
      : [...SE_PRIORITY_KEYS];
    const remainingLoops = loopKeys.filter(k => k !== currentLoopKey);

    Promise.all(batch1.map(fetchAndDecodeTrack)).then(() => {
      return Promise.all(restSeKeys.map(fetchAndDecodeTrack));
    }).then(() => {
      return Promise.all(remainingLoops.map(fetchAndDecodeTrack));
    }).catch(() => {});
  }

  function preloadSeFallbackElements() {
    if (typeof Audio === 'undefined' || isHttpEnvironment()) return;
    const allSeKeys = Object.keys(AUDIO_MANIFEST).filter(k => !AUDIO_MANIFEST[k].loop);
    allSeKeys.forEach(key => {
      if (!state.sePools[key]) state.sePools[key] = [];
      if (state.sePools[key].length === 0) {
        const audio = createAudioElement(key);
        if (audio) {
          audio.addEventListener('error', () => playSoftFallbackTone(AUDIO_MANIFEST[key]), { once: true });
          state.sePools[key].push(audio);
        }
      }
    });
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

    const masterFactor = state.settings.soundEnabled ? volumePercentToGain(state.settings.masterVolume) : 0;
    const bgmFactor = volumePercentToGain(state.settings.bgmVolume);
    const seFactor = volumePercentToGain(state.settings.seVolume);

    state.masterGainTarget = Number(masterFactor.toFixed(4));
    state.bgmGainTarget = Number(bgmFactor.toFixed(4));
    state.seGainTarget = Number(seFactor.toFixed(4));
    state.effectiveBgmFactor = Number((masterFactor * bgmFactor).toFixed(4));
    state.effectiveSeFactor = Number((masterFactor * seFactor).toFixed(4));
    applyTrackVolumes();
  }

  function getChannelScale(channel) {
    if (channel === 'bgm') {
      return state.effectiveBgmFactor * state.duckMultiplier;
    }
    return state.effectiveSeFactor;
  }

  function computeEffectiveGain(key, extraScale = 1.0, maxGain = 1.0) {
    const def = AUDIO_MANIFEST[key];
    if (!def) return 0;
    return clampNum(def.gain * getChannelScale(def.channel) * extraScale, 0, maxGain);
  }

  function computeEffectiveVolume(key, extraScale = 1.0) {
    return computeEffectiveGain(key, extraScale, 1.0);
  }

  function stopAllActiveBufferNodes() {
    state.activeBufferNodes.forEach(entry => {
      try { entry.source.stop(); } catch (e) {}
      try { entry.source.disconnect(); } catch (e) {}
      try { entry.gainNode.disconnect(); } catch (e) {}
    });
    state.activeBufferNodes.clear();
  }

  /**
   * 共通ミキサー GainNode と HTMLAudio フォールバック双方へ現在の音量を即時反映
   */
  function applyTrackVolumes() {
    if (state.audioCtx && ensureMixerNodes(state.audioCtx)) {
      const ctx = state.audioCtx;
      const loopDef = state.activeLoopNode ? AUDIO_MANIFEST[state.activeLoopNode.key] : null;
      const bgmActive = Boolean(loopDef && loopDef.channel === 'bgm');
      const seActive = Boolean(state.activeBufferNodes.size > 0 || (loopDef && loopDef.channel === 'ambience'));
      const anyActive = Boolean(bgmActive || seActive);

      smoothSetGainParam(state.masterGainNode.gain, state.masterGainTarget, ctx, anyActive);
      smoothSetGainParam(state.bgmChannelGainNode.gain, state.bgmGainTarget, ctx, bgmActive);
      smoothSetGainParam(state.bgmDuckGainNode.gain, state.duckMultiplier, ctx, bgmActive);
      smoothSetGainParam(state.seChannelGainNode.gain, state.seGainTarget, ctx, seActive);
    }

    if (!state.settings.soundEnabled || state.effectiveSeFactor <= 0.0005) {
      stopAllActiveBufferNodes();
    }

    if (state.activeLoopAudio && state.currentTrackKey) {
      const targetVol = computeEffectiveVolume(state.currentTrackKey, state.activeLoopFadeFactor);
      state.activeLoopAudio.muted = targetVol <= 0.001;
      state.activeLoopAudio.volume = targetVol;
      if (targetVol <= 0.001 && !state.activeLoopAudio.paused) {
        state.activeLoopAudio.pause();
      } else if (
        targetVol > 0.001
        && state.unlocked
        && !state.pausedByBackground
        && state.activeLoopAudio.paused
        && !state.activeLoopNode
      ) {
        safePlayElement(state.activeLoopAudio, state.currentTrackKey, false);
      }
    }

    state.fadingOutEntries.forEach(entry => {
      if (entry && entry.audio && entry.key) {
        const vol = computeEffectiveVolume(entry.key, entry.fadeFactor);
        entry.audio.muted = vol <= 0.001;
        entry.audio.volume = vol;
      }
    });
  }

  function createAudioElement(key) {
    const def = AUDIO_MANIFEST[key];
    if (!def || typeof Audio === 'undefined') return null;
    const audio = new Audio(def.src);
    audio.preload = 'auto';
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
      const ctx = ensureAudioContext();
      if (!ctx) return;
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

  function fadeOutWebAudioLoopNode(entry, fadeSec = 0.65) {
    if (!entry || !entry.source || !entry.gainNode) return;
    const ctx = state.audioCtx;
    state.fadingOutLoopNodes.push(entry);
    if (!ctx) {
      try { entry.source.stop(); } catch (e) {}
      return;
    }
    try {
      const now = ctx.currentTime;
      const g = entry.gainNode.gain;
      const curVal = Math.max(0.0001, g.value || entry.baseGain || 0.3);
      g.cancelScheduledValues(now);
      g.setValueAtTime(curVal, now);
      g.linearRampToValueAtTime(0.0001, now + fadeSec);
      entry.source.stop(now + fadeSec + 0.02);
    } catch (e) {
      try { entry.source.stop(); } catch (err) {}
    }
  }

  function startWebAudioLoopNode(key, buf, fadeSec = 0.65) {
    const def = AUDIO_MANIFEST[key];
    const ctx = ensureAudioContext();
    if (!def || !buf || !ctx || !ensureMixerNodes(ctx)) return false;
    try {
      if (ctx.state === 'suspended' && state.unlocked && !state.pausedByBackground) {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;

      const gainNode = ctx.createGain();
      const baseGain = clampNum(def.gain, 0, 2.0);
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(baseGain, now + fadeSec);

      const dest = def.channel === 'bgm' ? state.bgmDuckGainNode : state.seChannelGainNode;
      source.connect(gainNode);
      gainNode.connect(dest);
      source.start(now, 0);

      const nodeEntry = {
        key,
        baseGain,
        source,
        gainNode
      };
      source.onended = () => {
        if (state.activeLoopNode === nodeEntry) {
          state.activeLoopNode = null;
        }
        const idx = state.fadingOutLoopNodes.indexOf(nodeEntry);
        if (idx >= 0) state.fadingOutLoopNodes.splice(idx, 1);
        try { source.disconnect(); } catch (e) {}
        try { gainNode.disconnect(); } catch (e) {}
      };

      state.activeLoopNode = nodeEntry;
      state.lastLoopBackend = 'webaudio';
      applyTrackVolumes();
      return true;
    } catch (e) {
      return false;
    }
  }

  function startHtmlLoopFallback(trackKey) {
    if (!trackKey) return;
    const nextAudio = createAudioElement(trackKey);
    state.activeLoopAudio = nextAudio;
    state.activeLoopFadeFactor = 0.02;
    if (nextAudio) {
      const vol = computeEffectiveVolume(trackKey, state.activeLoopFadeFactor);
      nextAudio.muted = vol <= 0.001;
      nextAudio.volume = vol;
      if (state.unlocked && !state.pausedByBackground && vol > 0.001) {
        safePlayElement(nextAudio, trackKey, false);
      }
      state.lastLoopBackend = 'htmlaudio';
    }
    ensureHtmlLoopFadeTimer();
  }

  function ensureHtmlLoopFadeTimer() {
    clearLoopFadeTimer();
    const needsFade = Boolean(state.activeLoopAudio || state.fadingOutEntries.length > 0);
    if (!needsFade) return;

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

  function startTrackCrossfade(nextTrackKey) {
    clearLoopFadeTimer();
    const seq = ++state.loopTransitionSeq;

    if (state.activeLoopNode) {
      const prevNode = state.activeLoopNode;
      state.activeLoopNode = null;
      fadeOutWebAudioLoopNode(prevNode, 0.65);
    }
    if (state.activeLoopAudio && state.currentTrackKey) {
      state.fadingOutEntries.push({
        key: state.currentTrackKey,
        audio: state.activeLoopAudio,
        fadeFactor: state.activeLoopFadeFactor
      });
      state.activeLoopAudio = null;
    }

    state.currentTrackKey = nextTrackKey;
    if (!nextTrackKey) {
      state.activeLoopFadeFactor = 0;
      ensureHtmlLoopFadeTimer();
      return;
    }

    if (isHttpEnvironment()) {
      const cachedBuf = state.decodedBuffers[nextTrackKey];
      if (!state.unlocked) {
        // 初回操作前の待機中もバックグラウンドで事前デコード
        if (!cachedBuf) fetchAndDecodeTrack(nextTrackKey);
        ensureHtmlLoopFadeTimer();
        return;
      }
      if (cachedBuf) {
        if (!startWebAudioLoopNode(nextTrackKey, cachedBuf, 0.65)) {
          startHtmlLoopFallback(nextTrackKey);
        }
      } else {
        fetchAndDecodeTrack(nextTrackKey).then(buf => {
          if (seq !== state.loopTransitionSeq || state.currentTrackKey !== nextTrackKey) return;
          if (!state.unlocked) return;
          if (buf && startWebAudioLoopNode(nextTrackKey, buf, 0.65)) return;
          startHtmlLoopFallback(nextTrackKey);
        });
      }
      ensureHtmlLoopFadeTimer();
      return;
    }

    startHtmlLoopFallback(nextTrackKey);
  }

  /**
   * シーンを切り替え、対応するBGM／スタジアム環境音へクロスフェード
   */
  function setScene(sceneKey) {
    if (!Object.prototype.hasOwnProperty.call(SCENE_TO_TRACK, sceneKey)) return;
    state.currentScene = sceneKey;
    const nextTrackKey = SCENE_TO_TRACK[sceneKey];

    if (nextTrackKey === state.currentTrackKey) {
      if (!state.unlocked || !nextTrackKey) return;
      if (state.activeLoopNode) {
        applyTrackVolumes();
        return;
      }
      if (state.activeLoopAudio) {
        if (
          !state.pausedByBackground
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
      if (!state.inflightLoads[nextTrackKey]) {
        startTrackCrossfade(nextTrackKey);
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

  function scheduleDuckWithDelay(def, delayMs) {
    if (!def || !def.duckBgmMs) return;
    if (delayMs > 20) {
      const duckT = setTimeout(() => {
        state.activeSeTimers.delete(duckT);
        if (!state.pausedByBackground) applyBgmDuck(def.duckBgmMs);
      }, delayMs);
      state.activeSeTimers.add(duckT);
    } else {
      applyBgmDuck(def.duckBgmMs);
    }
  }

  function playBufferSfx(key, def, extraScale, delayMs, maxDurationMs) {
    const buf = state.decodedBuffers[key];
    const ctx = ensureAudioContext();
    if (!buf || !ctx || !ensureMixerNodes(ctx) || state.pausedByBackground) return false;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const offsetSec = clampNum(def.trimStartSec || 0, 0, Math.max(0, buf.duration - 0.03));
      const playableSec = Math.max(0.03, buf.duration - offsetSec);
      const startTime = ctx.currentTime + Math.max(0, delayMs || 0) / 1000;
      // チャンネル音量(Master * SE)はseChannelGainNode/masterGainNodeが適用するため二重掛けしない
      const nodeGain = clampNum(def.gain * extraScale, 0, 4.0);
      if (nodeGain <= 0.001) return true;

      const source = ctx.createBufferSource();
      source.buffer = buf;
      const gainNode = ctx.createGain();
      if (offsetSec > 0) {
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(nodeGain, startTime + 0.004);
      } else {
        gainNode.gain.setValueAtTime(nodeGain, startTime);
      }

      const entry = { source, gainNode };
      state.activeBufferNodes.add(entry);
      source.onended = () => {
        state.activeBufferNodes.delete(entry);
        try { source.disconnect(); } catch (e) {}
        try { gainNode.disconnect(); } catch (e) {}
      };

      source.connect(gainNode);
      gainNode.connect(state.seChannelGainNode);
      scheduleDuckWithDelay(def, delayMs || 0);

      if (maxDurationMs && maxDurationMs > 200) {
        const limitSec = Math.min(playableSec, maxDurationMs / 1000);
        const fadeWindow = Math.min(0.45, limitSec * 0.35);
        const fadeStart = startTime + Math.max(0.04, limitSec - fadeWindow);
        const stopTime = startTime + limitSec;
        gainNode.gain.setValueAtTime(nodeGain, Math.max(startTime + 0.005, fadeStart));
        gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
        source.start(startTime, offsetSec);
        source.stop(stopTime + 0.02);
      } else {
        source.start(startTime, offsetSec);
      }

      state.lastSfxBackend = 'webaudio';
      return true;
    } catch (e) {
      return false;
    }
  }

  function playHtmlFallbackSfx(key, def, extraScale, delayMs, maxDurationMs) {
    const playNow = () => {
      if (state.pausedByBackground) return;
      const audio = acquireSeAudio(key);
      if (!audio) return;
      const offsetSec = clampNum(def.trimStartSec || 0, 0, 10);
      const dur = Number.isFinite(audio.duration) ? audio.duration : 0;
      const safeOffset = dur > 0.05 ? Math.min(offsetSec, Math.max(0, dur - 0.03)) : offsetSec;
      try {
        audio.currentTime = safeOffset;
      } catch (e) {}
      const vol = computeEffectiveVolume(key, extraScale);
      audio.muted = vol <= 0.001;
      audio.volume = vol;
      if (def.duckBgmMs) {
        applyBgmDuck(def.duckBgmMs);
      }
      safePlayElement(audio, key, true);
      state.lastSfxBackend = 'htmlaudio';
      if (maxDurationMs && maxDurationMs > 200) {
        scheduleSeMaxDurationFade(audio, key, maxDurationMs, extraScale);
      }
    };

    if (delayMs && delayMs > 0) {
      const delayTimer = setTimeout(() => {
        state.activeSeTimers.delete(delayTimer);
        playNow();
      }, delayMs);
      state.activeSeTimers.add(delayTimer);
    } else {
      playNow();
    }
  }

  /**
   * 効果音・イベント演出音・ジングルを再生（Web Audio共通ミキサー経由でゼロ遅延再生）
   */
  function playSfx(key, opts = {}) {
    const def = AUDIO_MANIFEST[key];
    if (!def) return false;
    if (isFastForwardSuppressed(opts)) return false;

    const extraScale = typeof opts.volumeScale === 'number' ? clampNum(opts.volumeScale, 0, 1.5) : 1.0;
    const targetGain = computeEffectiveGain(key, extraScale, 4.0);
    if (!state.settings.soundEnabled || targetGain <= 0.0005) return false;

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

    const delayMs = typeof opts.delayMs === 'number' ? Math.max(0, opts.delayMs) : 0;
    const maxDurationMs = opts.maxDurationMs || def.maxDurationMs || 0;
    if (playBufferSfx(key, def, extraScale, delayMs, maxDurationMs)) {
      return true;
    }
    playHtmlFallbackSfx(key, def, extraScale, delayMs, maxDurationMs);
    return true;
  }

  function unlock() {
    const wasUnlocked = state.unlocked;
    state.unlocked = true;
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {});
    }
    if (!wasUnlocked) {
      if (ctx) {
        try {
          const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
          const src = ctx.createBufferSource();
          src.buffer = silentBuf;
          src.connect(ctx.destination);
          src.start(0);
        } catch (e) {}
      }
      Object.keys(state.rawBuffers).forEach(k => decodeBufferIfPossible(k));
      syncFromSettings();
      const trackKey = SCENE_TO_TRACK[state.currentScene] || null;
      if (trackKey && (!state.currentTrackKey || (!state.activeLoopNode && !state.activeLoopAudio))) {
        startTrackCrossfade(trackKey);
      } else if (state.activeLoopAudio && !state.pausedByBackground && state.settings.soundEnabled && state.activeLoopAudio.paused) {
        state.activeLoopFadeFactor = 1.0;
        applyTrackVolumes();
        safePlayElement(state.activeLoopAudio, state.currentTrackKey, false);
      }
    } else if (Object.keys(state.rawBuffers).length > 0) {
      Object.keys(state.rawBuffers).forEach(k => decodeBufferIfPossible(k));
    }
  }

  function handleBackgroundPause() {
    state.pausedByBackground = true;
    stopAllActiveBufferNodes();
    if (state.audioCtx && state.audioCtx.state === 'running' && typeof state.audioCtx.suspend === 'function') {
      state.audioCtx.suspend().catch(() => {});
    }
    if (state.activeLoopAudio && !state.activeLoopAudio.paused) {
      state.activeLoopAudio.pause();
    }
    state.fadingOutEntries.forEach(entry => stopFadingEntry(entry));
    state.fadingOutEntries = [];
  }

  function handleForegroundResume() {
    state.pausedByBackground = false;
    if (state.unlocked && state.settings.soundEnabled && state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(() => {});
    }
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
    if (btn.hasAttribute('data-no-auto-ui-sfx') || btn.hasAttribute('data-offer-accept')) return true;
    const id = btn.id || '';
    const skipIds = new Set([
      'btn-panel-quick-result',
      'btn-precheck-quick-result',
      'btn-panel-kickoff',
      'btn-precheck-start-match',
      'btn-advance-day',
      'btn-office-primary-cta',
      'btn-test-sound-se',
      'btn-confirm-sponsor-modal',
      'btn-submit-neg-offer',
      'btn-incoming-accept',
      'btn-match-resume-second-half'
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
    document.addEventListener('pointerdown', handleFirstGesture, { capture: true, passive: true });
    document.addEventListener('keydown', handleFirstGesture, { capture: true, passive: true });

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
    }, true);
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    syncFromSettings();
    preloadSeBuffers();
    preloadSeFallbackElements();
    bindGlobalUiSoundDelegation();
  }

  function getDebugState() {
    let decodedSeCount = 0;
    let decodedLoopCount = 0;
    Object.keys(state.decodedBuffers).forEach(k => {
      if (AUDIO_MANIFEST[k] && AUDIO_MANIFEST[k].loop) decodedLoopCount += 1;
      else decodedSeCount += 1;
    });

    let activeLoopVolume = 0;
    if (state.activeLoopNode && state.currentTrackKey) {
      const def = AUDIO_MANIFEST[state.currentTrackKey];
      const base = def ? def.gain : 0;
      const duck = (def && def.channel === 'bgm') ? state.duckMultiplier : 1;
      activeLoopVolume = Number((base * getChannelScale(def ? def.channel : 'bgm') * duck).toFixed(4));
    } else if (state.activeLoopAudio) {
      activeLoopVolume = Number((state.activeLoopAudio.muted ? 0 : state.activeLoopAudio.volume).toFixed(4));
    }

    return {
      initialized: state.initialized,
      unlocked: state.unlocked,
      pausedByBackground: state.pausedByBackground,
      currentScene: state.currentScene,
      currentTrackKey: state.currentTrackKey,
      settings: { ...state.settings },
      effectiveBgmFactor: state.effectiveBgmFactor,
      effectiveSeFactor: state.effectiveSeFactor,
      masterGainTarget: state.masterGainTarget,
      bgmGainTarget: state.bgmGainTarget,
      seGainTarget: state.seGainTarget,
      masterGainValue: state.masterGainNode ? Number(state.masterGainNode.gain.value.toFixed(4)) : state.masterGainTarget,
      bgmGainValue: state.bgmChannelGainNode ? Number(state.bgmChannelGainNode.gain.value.toFixed(4)) : state.bgmGainTarget,
      seGainValue: state.seChannelGainNode ? Number(state.seChannelGainNode.gain.value.toFixed(4)) : state.seGainTarget,
      decodedBufferCount: decodedSeCount + decodedLoopCount,
      decodedSeCount,
      decodedLoopCount,
      preloadedFallbackCount: Object.keys(state.sePools).length,
      audioContextState: state.audioCtx ? state.audioCtx.state : 'none',
      lastSfxBackend: state.lastSfxBackend,
      lastLoopBackend: state.lastLoopBackend,
      activeLoopVolume,
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
