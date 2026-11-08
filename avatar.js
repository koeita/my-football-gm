'use strict';

/**
 * 選手ドット絵アバター（Pixel Avatar）ジェネレーター
 * - 32x32 の論理グリッドに Canvas 2D で1ピクセルずつ描画するレトロ風顔写真
 * - 選手ごとの「アバター遺伝子（avatarData）」から決定論的に描画
 * - 生成済み画像は dataURL としてインメモリキャッシュし、再描画コストを最小化
 * - 外部画像・絵文字は一切使用しない
 */

// ---------------------------------------------------------------------------
// パレット定義
// ---------------------------------------------------------------------------
const AVATAR_SKIN_TONES = [
  { key: 'fair',   label: '色白',   base: '#f3d5c1', shade: '#dcb39b' },
  { key: 'medium', label: '普通',   base: '#e6b590', shade: '#c9946f' },
  { key: 'tan',    label: '日焼け', base: '#c78d62', shade: '#a8714a' },
  { key: 'brown',  label: '褐色',   base: '#8f5b3a', shade: '#74462a' },
  { key: 'dark',   label: 'ダーク', base: '#5b3924', shade: '#452a19' }
];

const AVATAR_HAIR_STYLES = ['short', 'spiky', 'perm', 'afro', 'dreads', 'buzz', 'centerpart', 'long'];
const AVATAR_HAIR_STYLE_LABELS = {
  short: '短髪', spiky: 'ツンツン', perm: 'パーマ', afro: 'アフロ',
  dreads: 'ドレッド', buzz: '坊主', centerpart: 'センター分け', long: '長髪'
};

const AVATAR_HAIR_COLORS = [
  { key: 'black', label: '黒',     base: '#1d1b1b', shade: '#0e0d0d' },
  { key: 'brown', label: '茶',     base: '#5b3a22', shade: '#432a17' },
  { key: 'blond', label: '金',     base: '#d8b45c', shade: '#b48f3d' },
  { key: 'red',   label: '赤',     base: '#a5462a', shade: '#82341d' },
  { key: 'grey',  label: 'グレー', base: '#a9a9a9', shade: '#858585' }
];

const AVATAR_FACIAL_HAIR = ['none', 'mustache', 'goatee', 'beard'];
const AVATAR_ACCESSORIES = ['none', 'glasses', 'band'];

// 国籍ごとの肌色出現ウェイト [色白, 普通, 日焼け, 褐色, ダーク]
const AVATAR_SKIN_WEIGHTS_BY_NATIONALITY = {
  England:     [34, 28, 12, 13, 13],
  France:      [24, 24, 14, 18, 20],
  Spain:       [22, 40, 26, 7, 5],
  Germany:     [44, 30, 12, 8, 6],
  Italy:       [22, 42, 26, 6, 4],
  Netherlands: [36, 26, 12, 14, 12],
  Portugal:    [16, 36, 30, 10, 8],
  Brazil:      [10, 22, 26, 24, 18],
  Argentina:   [24, 44, 24, 6, 2],
  Belgium:     [32, 26, 12, 15, 15],
  Croatia:     [50, 36, 10, 3, 1],
  Japan:       [42, 50, 8, 0, 0]
};

// 肌色ごとの髪色ウェイト [黒, 茶, 金, 赤, グレー]
const AVATAR_HAIR_COLOR_WEIGHTS_BY_SKIN = [
  [26, 36, 26, 11, 1],
  [44, 40, 12, 3, 1],
  [62, 32, 5, 0, 1],
  [88, 11, 1, 0, 0],
  [95, 5, 0, 0, 0]
];

// 肌色ごとの髪型ウェイト [短髪, ツンツン, パーマ, アフロ, ドレッド, 坊主, センター分け, 長髪]
const AVATAR_HAIR_STYLE_WEIGHTS_BY_SKIN = [
  [26, 16, 10, 0, 0, 14, 20, 14],
  [24, 18, 12, 1, 1, 14, 18, 12],
  [22, 16, 14, 3, 4, 16, 14, 11],
  [16, 10, 10, 16, 18, 22, 4, 4],
  [14, 8, 8, 20, 22, 24, 2, 2]
];

// 全20クラブのユニフォーム（ファースト）カラー [メイン, 襟・アクセント]
const CLUB_KIT_COLORS = {
  manchester_b:  ['#6cabdd', '#ffffff'],
  manchester_r:  ['#da291c', '#ffffff'],
  liverpool_b:   ['#c8102e', '#f6eb61'],
  northlondon_a: ['#ef0107', '#ffffff'],
  london_fc:     ['#034694', '#ffffff'],
  northlondon_w: ['#f2f2f2', '#132257'],
  newcastle_u:   ['#241f20', '#ffffff'],
  aston_v:       ['#670e36', '#95bfe5'],
  brighton_g:    ['#0057b8', '#ffffff'],
  eastlondon_h:  ['#7a263a', '#1bb1e7'],
  southlondon_p: ['#1b458f', '#c4122e'],
  westlondon_c:  ['#f5f5f5', '#000000'],
  westlondon_b:  ['#e30613', '#ffffff'],
  midlands_w:    ['#fdb913', '#231f20'],
  merseyside_b:  ['#003399', '#ffffff'],
  southcoast_c:  ['#da291c', '#111111'],
  nottingham_r:  ['#dd0000', '#ffffff'],
  leicester_f:   ['#003090', '#fdbe11'],
  southampton_s: ['#d71920', '#ffffff'],
  ipswich_t:     ['#3a64a3', '#ffffff']
};
const AVATAR_DEFAULT_KIT = ['#4a525a', '#c9d1d9'];

// ---------------------------------------------------------------------------
// 乱数ユーティリティ
// ---------------------------------------------------------------------------
function avatarHashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createSeededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function avatarWeightedPick(weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

// ---------------------------------------------------------------------------
// アバター遺伝子の生成
// ---------------------------------------------------------------------------
/**
 * 国籍・年齢に相関したアバター遺伝子をランダム決定
 * @param {string} nationality
 * @param {number} age
 * @param {function} [rng] 乱数関数（省略時 Math.random）
 */
function generateAvatarData(nationality, age, rng = Math.random) {
  const skinWeights = AVATAR_SKIN_WEIGHTS_BY_NATIONALITY[nationality] || [28, 30, 16, 14, 12];
  const skinIdx = avatarWeightedPick(skinWeights, rng);

  let hairColorIdx = avatarWeightedPick(AVATAR_HAIR_COLOR_WEIGHTS_BY_SKIN[skinIdx], rng);
  const hairStyleIdx = avatarWeightedPick(AVATAR_HAIR_STYLE_WEIGHTS_BY_SKIN[skinIdx], rng);

  // 年齢が高いほどヒゲ率が上昇
  const a = typeof age === 'number' ? age : 25;
  const beardBoost = a >= 34 ? 22 : a >= 30 ? 12 : a <= 19 ? -14 : 0;
  const facialWeights = [
    Math.max(10, 56 - beardBoost),
    10 + Math.round(beardBoost * 0.2),
    16 + Math.round(beardBoost * 0.3),
    18 + Math.round(beardBoost * 0.5)
  ];
  const facialIdx = avatarWeightedPick(facialWeights, rng);
  const accessoryIdx = avatarWeightedPick([80, 7, 13], rng);

  // 若手選手がグレーになるのは不自然なので黒に寄せる
  if (hairColorIdx === 4 && a < 30) hairColorIdx = 0;

  return {
    skinColor: AVATAR_SKIN_TONES[skinIdx].key,
    hairStyle: AVATAR_HAIR_STYLES[hairStyleIdx],
    hairColor: AVATAR_HAIR_COLORS[hairColorIdx].key,
    facialHair: AVATAR_FACIAL_HAIR[facialIdx],
    accessories: AVATAR_ACCESSORIES[accessoryIdx],
    eyeVariant: Math.floor(rng() * 3),
    jerseyColor: null
  };
}

/**
 * 旧セーブデータ等で avatarData を持たない選手へ、選手IDをシードとした決定論的遺伝子を付与
 */
function ensurePlayerAvatarData(player) {
  if (!player) return null;
  if (!player.avatarData || !player.avatarData.skinColor) {
    const seed = avatarHashString(String(player.id || player.name || 'player'));
    player.avatarData = generateAvatarData(player.nationality, player.age, createSeededRandom(seed));
  }
  return player.avatarData;
}

// ---------------------------------------------------------------------------
// 所属クラブ・ユニフォームカラー解決
// ---------------------------------------------------------------------------
function findAvatarClubForPlayer(player) {
  if (typeof gameState === 'undefined' || !gameState || !Array.isArray(gameState.clubs)) return null;
  for (const c of gameState.clubs) {
    if ((c.players || []).some(p => p.id === player.id)) return c;
    if ((c.youthSquad || []).some(p => p.id === player.id)) return c;
  }
  return null;
}

function getAvatarKitColors(player, club) {
  const resolvedClub = club || findAvatarClubForPlayer(player);
  if (resolvedClub && CLUB_KIT_COLORS[resolvedClub.id]) return CLUB_KIT_COLORS[resolvedClub.id];
  return AVATAR_DEFAULT_KIT;
}

// ---------------------------------------------------------------------------
// ピクセル描画コア（32x32 論理グリッド）
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function shadeHex(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

/**
 * 32x32 グリッドへ顔を描画
 * @param {CanvasRenderingContext2D} ctx 既に scale 済みのコンテキスト
 */
function drawPixelAvatarOnContext(ctx, genes, age, kit) {
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(x, y, w, h);
  const set = (c) => { ctx.fillStyle = c; };

  const skin = AVATAR_SKIN_TONES.find(s => s.key === genes.skinColor) || AVATAR_SKIN_TONES[1];
  let hair = AVATAR_HAIR_COLORS.find(h => h.key === genes.hairColor) || AVATAR_HAIR_COLORS[0];
  // 加齢表現：34歳以上はグレー化
  if (age >= 34) hair = AVATAR_HAIR_COLORS[4];
  const isVeteranSaltPepper = age >= 31 && age < 34 && hair.key !== 'grey' && hair.key !== 'blond';

  const style = genes.hairStyle;
  const [kitMain, kitAccent] = kit;

  // --- 背景：暗めの丸枠＋クラブカラーのうっすら背景 ---
  ctx.clearRect(0, 0, 32, 32);
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.closePath();
  set('#1a1d20');
  ctx.fill();
  ctx.save();
  ctx.clip();
  const [kr, kg, kb] = hexToRgb(kitMain);
  ctx.fillStyle = `rgba(${kr}, ${kg}, ${kb}, 0.22)`;
  ctx.fillRect(0, 0, 32, 32);
  set('rgba(255, 255, 255, 0.04)');
  px(0, 0, 32, 10);

  // --- 後ろ髪レイヤー（顔の背面） ---
  set(hair.base);
  if (style === 'afro') {
    px(8, 2, 16, 1); px(6, 3, 20, 1); px(5, 4, 22, 8); px(6, 12, 20, 3); px(7, 15, 4, 2); px(21, 15, 4, 2);
    set(hair.shade);
    for (let y = 4; y < 15; y += 2) for (let x = 6 + (y % 4 === 0 ? 0 : 1); x < 26; x += 3) px(x, y);
  } else if (style === 'long') {
    px(8, 7, 16, 16); px(9, 23, 14, 2);
    set(hair.shade); px(8, 18, 2, 6); px(22, 18, 2, 6);
  } else if (style === 'dreads') {
    for (const x of [8, 10, 21, 23]) {
      set(hair.base); px(x, 9, 1, 14);
      set(hair.shade); for (let y = 10; y < 23; y += 3) px(x, y);
    }
  }

  // --- 首 ---
  set(skin.shade);
  px(13, 20, 6, 6);

  // --- ユニフォーム（肩・襟元） ---
  set(kitMain);
  px(8, 25, 16, 1); px(6, 26, 20, 1); px(4, 27, 24, 5);
  set(shadeHex(kitMain, -28));
  px(4, 30, 24, 2);
  // V襟
  set(kitAccent);
  px(11, 25, 2, 1); px(19, 25, 2, 1); px(12, 26, 2, 1); px(18, 26, 2, 1); px(13, 27, 2, 1); px(17, 27, 2, 1); px(15, 28, 2, 1);
  set(skin.shade);
  px(13, 25, 6, 1); px(14, 26, 4, 1); px(15, 27, 2, 1);
  // 肩のアクセントライン
  set(kitAccent);
  px(5, 27, 1, 1); px(26, 27, 1, 1);

  // --- 耳 ---
  set(skin.base); px(9, 13, 1, 4); px(22, 13, 1, 4);
  set(skin.shade); px(9, 14, 1, 2); px(22, 14, 1, 2);

  // --- 顔の輪郭 ---
  set(skin.base);
  px(11, 8, 10, 1); px(10, 9, 12, 11); px(11, 20, 10, 1); px(12, 21, 8, 1);
  // 陰影（右側・顎下）
  set(skin.shade);
  px(21, 10, 1, 10); px(20, 20, 1, 1); px(12, 21, 8, 1);

  // --- 眉 ---
  set(hair.shade);
  px(12, 12, 3, 1); px(17, 12, 3, 1);

  // --- 目 ---
  const ev = genes.eyeVariant || 0;
  if (ev === 0) {
    set('#f2f2f2'); px(12, 14, 1, 1); px(17, 14, 1, 1);
    set('#1a1a1a'); px(13, 14, 1, 2); px(18, 14, 1, 2);
  } else if (ev === 1) {
    set('#1a1a1a'); px(12, 14, 2, 1); px(17, 14, 2, 1); // 細め（鋭い目）
  } else {
    set('#f2f2f2'); px(12, 14, 2, 1); px(17, 14, 2, 1);
    set('#2b4a6b'); px(13, 14, 1, 2); px(18, 14, 1, 2); // 青系の瞳
  }

  // --- 鼻 ---
  set(skin.shade);
  px(15, 16, 1, 2); px(16, 17, 1, 1);

  // --- 口 ---
  set('#7d3f33');
  px(14, 19, 4, 1);

  // --- ヒゲ ---
  const facial = genes.facialHair;
  const beardColor = hair.base;
  if (facial === 'mustache' || facial === 'beard') {
    set(beardColor); px(13, 18, 6, 1);
  }
  if (facial === 'goatee') {
    set(beardColor); px(13, 18, 6, 1); px(15, 20, 2, 1); px(14, 21, 4, 1);
  }
  if (facial === 'beard') {
    set(beardColor);
    px(10, 15, 1, 5); px(21, 15, 1, 5); px(11, 18, 2, 3); px(19, 18, 2, 3); px(13, 20, 6, 1); px(12, 21, 8, 1);
    set(hair.shade); px(14, 21, 4, 1);
    set('#7d3f33'); px(14, 19, 4, 1);
  }
  if (facial === 'none' && age >= 28) {
    // 無精ヒゲのうっすら表現
    ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
    px(11, 18, 10, 3);
  }

  // --- 前髪レイヤー ---
  set(hair.base);
  switch (style) {
    case 'short':
      px(11, 6, 10, 1); px(10, 7, 12, 3); px(10, 10, 1, 3); px(21, 10, 1, 3);
      set(hair.shade); px(10, 9, 12, 1);
      break;
    case 'spiky':
      px(10, 7, 12, 3); px(10, 10, 1, 2); px(21, 10, 1, 2);
      px(11, 5, 1, 2); px(13, 4, 1, 3); px(15, 5, 1, 2); px(17, 4, 1, 3); px(19, 5, 1, 2); px(20, 6, 1, 1);
      set(hair.shade); px(12, 6, 1, 1); px(16, 6, 1, 1); px(18, 6, 1, 1);
      break;
    case 'perm':
      px(10, 5, 12, 1); px(9, 6, 14, 5); px(9, 11, 2, 4); px(21, 11, 2, 4);
      set(hair.shade);
      for (let y = 6; y < 15; y += 2) for (let x = 9 + (y % 4 === 2 ? 1 : 0); x < 23; x += 2) {
        if (y >= 11 && x > 10 && x < 21) continue;
        px(x, y);
      }
      break;
    case 'afro':
      px(10, 8, 12, 2);
      break;
    case 'dreads':
      px(11, 6, 10, 1); px(10, 7, 12, 3); px(10, 10, 1, 2); px(21, 10, 1, 2);
      set(hair.shade); for (let x = 10; x < 22; x += 2) px(x, 8);
      break;
    case 'buzz':
      ctx.fillStyle = hair.base;
      ctx.globalAlpha = 0.55;
      px(11, 7, 10, 1); px(10, 8, 12, 2);
      ctx.globalAlpha = 1;
      break;
    case 'centerpart':
      px(11, 6, 10, 1); px(10, 7, 12, 3); px(10, 10, 2, 4); px(20, 10, 2, 4);
      set(skin.base); px(15, 7, 2, 2);
      set(hair.shade); px(14, 9, 1, 1); px(17, 9, 1, 1);
      break;
    case 'long':
      px(11, 6, 10, 1); px(10, 7, 12, 3); px(9, 10, 2, 9); px(21, 10, 2, 9);
      set(hair.shade); px(12, 9, 8, 1);
      break;
    default:
      px(11, 6, 10, 1); px(10, 7, 12, 3);
  }

  // 31〜33歳：白髪交じり（ごま塩）
  if (isVeteranSaltPepper && style !== 'buzz') {
    set('rgba(200, 200, 200, 0.55)');
    px(11, 7); px(14, 8); px(18, 7); px(20, 9); px(10, 10);
  }

  // --- アクセサリー ---
  if (genes.accessories === 'glasses') {
    set('#202326');
    px(11, 13, 4, 1); px(11, 16, 4, 1); px(11, 13, 1, 4); px(14, 13, 1, 4);
    px(17, 13, 4, 1); px(17, 16, 4, 1); px(17, 13, 1, 4); px(20, 13, 1, 4);
    px(15, 14, 2, 1); px(10, 14, 1, 1); px(21, 14, 1, 1);
    ctx.fillStyle = 'rgba(180, 220, 255, 0.18)';
    px(12, 14, 2, 2); px(18, 14, 2, 2);
  } else if (genes.accessories === 'band') {
    set(kitAccent === '#ffffff' || kitAccent === '#f2f2f2' ? '#f0f2f5' : kitAccent);
    px(10, 10, 12, 1);
    set(shadeHex(kitAccent, -40));
    px(10, 11, 12, 1);
  }

  ctx.restore();

  // --- 外周リング ---
  ctx.beginPath();
  ctx.arc(16, 16, 15.5, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(${kr}, ${kg}, ${kb}, 0.65)`;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// インメモリ 32x32 マスターCanvas & DataURL キャッシュ
// ---------------------------------------------------------------------------
const PLAYER_AVATAR_CANVAS_CACHE = new Map();
const PLAYER_AVATAR_CACHE = new Map();
const PLAYER_AVATAR_CACHE_LIMIT = 1500;
const PLAYER_AVATAR_LOOKUP = new Map();
let sharedAvatarCanvas = null;

function getAvatarCacheKey(genes, kit, age) {
  const ageBand = age >= 34 ? 'g' : age >= 31 ? 's' : age >= 28 ? 'm' : 'y';
  return [
    genes.skinColor, genes.hairStyle, genes.hairColor, genes.facialHair,
    genes.accessories, genes.eyeVariant, kit[0], kit[1], ageBand
  ].join('|');
}

function getOrCreateMasterAvatarCanvas(genes, age, kit) {
  const key = getAvatarCacheKey(genes, kit, age);
  const cached = PLAYER_AVATAR_CANVAS_CACHE.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') return null;
  const master = document.createElement('canvas');
  master.width = 32;
  master.height = 32;
  const mctx = master.getContext('2d');
  mctx.imageSmoothingEnabled = false;
  drawPixelAvatarOnContext(mctx, genes, age, kit);

  if (PLAYER_AVATAR_CANVAS_CACHE.size >= PLAYER_AVATAR_CACHE_LIMIT) {
    PLAYER_AVATAR_CANVAS_CACHE.delete(PLAYER_AVATAR_CANVAS_CACHE.keys().next().value);
  }
  PLAYER_AVATAR_CANVAS_CACHE.set(key, master);
  return master;
}

/**
 * 選手のアバターを指定Canvas（32x32 / 48x48 / 64x64 等）に鮮明描画
 * @param {object} player
 * @param {HTMLCanvasElement} canvas
 * @param {object} [club] 所属クラブ（省略時は自動検索）
 */
function generatePlayerAvatar(player, canvas, club = null) {
  if (!player || !canvas || !canvas.getContext) return;
  const genes = ensurePlayerAvatarData(player);
  const kit = getAvatarKitColors(player, club);
  genes.jerseyColor = kit[0];
  const age = player.age || 25;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const master = getOrCreateMasterAvatarCanvas(genes, age, kit);
  if (master) {
    ctx.drawImage(master, 0, 0, canvas.width, canvas.height);
  } else {
    const scale = canvas.width / 32;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawPixelAvatarOnContext(ctx, genes, age, kit);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

function getPlayerAvatarDataUrl(player, club = null, pixelSize = 48) {
  const genes = ensurePlayerAvatarData(player);
  const kit = getAvatarKitColors(player, club);
  const age = player.age || 25;
  const key = `${getAvatarCacheKey(genes, kit, age)}|${pixelSize}`;

  const cached = PLAYER_AVATAR_CACHE.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') return '';
  if (!sharedAvatarCanvas) sharedAvatarCanvas = document.createElement('canvas');
  sharedAvatarCanvas.width = pixelSize;
  sharedAvatarCanvas.height = pixelSize;
  generatePlayerAvatar(player, sharedAvatarCanvas, club);
  const url = sharedAvatarCanvas.toDataURL('image/png');

  if (PLAYER_AVATAR_CACHE.size >= PLAYER_AVATAR_CACHE_LIMIT) {
    PLAYER_AVATAR_CACHE.delete(PLAYER_AVATAR_CACHE.keys().next().value);
  }
  PLAYER_AVATAR_CACHE.set(key, url);
  return url;
}

/**
 * innerHTML 用のアバター <canvas> タグを生成（内部解像度 48x48px でクッキリ描画）
 * @param {object} player
 * @param {object} [club]
 * @param {string} [extraClass] 'pitch-node-avatar' | 'bench-sub-avatar' | 'table-avatar' など
 * @param {number} [canvasSize=48]
 */
function getPlayerAvatarHtml(player, club = null, extraClass = 'avatar-sm', canvasSize = 48) {
  if (!player) return '';
  try {
    if (player.id !== undefined && player.id !== null) {
      PLAYER_AVATAR_LOOKUP.set(String(player.id), { player, club });
    }
    const url = getPlayerAvatarDataUrl(player, club, canvasSize);
    const bgStyle = url ? ` style="background-image:url('${url}');background-size:100% 100%;"` : '';
    const pidAttr = player.id !== undefined && player.id !== null ? ` data-avatar-pid="${player.id}"` : '';
    return `<canvas class="player-avatar ${extraClass}" width="${canvasSize}" height="${canvasSize}"${pidAttr}${bgStyle} aria-hidden="true"></canvas>`;
  } catch (e) {
    return '';
  }
}

/**
 * DOM内の <canvas class="player-avatar"> に2Dコンテキスト描画を反映
 */
function renderAvatarCanvases(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  const canvases = root.querySelectorAll('canvas.player-avatar[data-avatar-pid]');
  canvases.forEach(cv => {
    const pid = cv.getAttribute('data-avatar-pid');
    const entry = PLAYER_AVATAR_LOOKUP.get(String(pid));
    if (entry && entry.player) {
      generatePlayerAvatar(entry.player, cv, entry.club);
    }
  });
}

/**
 * 監督アバターの生成（シックなスーツ姿のドット絵）
 */
function generateManagerAvatar(manager, targetCanvas = null, canvasSize = 48) {
  if (!manager) return null;
  const age = manager.age || 50;
  const nat = manager.nationality || 'England';
  if (!manager.avatarData && typeof generateAvatarData === 'function') {
    manager.avatarData = generateAvatarData(nat, age);
    // 監督風アバター補正（ヒゲやメガネ率UP）
    if (manager.avatarData) {
      if (Math.random() < 0.6) manager.avatarData.facialHair = 'beard';
      if (Math.random() < 0.4) manager.avatarData.accessories = 'glasses';
    }
  }
  const suitKit = ['#222a35', '#ffffff']; // シックなダークスーツ＆ホワイトシャツ
  return generatePlayerAvatar({ ...manager, isManager: true }, targetCanvas, { kitColors: suitKit }, canvasSize);
}

function getManagerAvatarHtml(manager, extraClass = 'avatar-sm', canvasSize = 48) {
  if (!manager) return '';
  const suitKit = ['#222a35', '#ffffff'];
  return getPlayerAvatarHtml({ ...manager, id: `mgr_${manager.name || 'x'}` }, { kitColors: suitKit }, extraClass, canvasSize);
}
