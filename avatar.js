'use strict';

/**
 * 選手ドット絵アバター（Pixel Avatar）ジェネレーター
 * - 32x32 の論理グリッドに Canvas 2D で1ピクセルずつ描画する16-bitレトロモダン・ピクセルポートレート
 * - 円形バストアップ（Base Circle）＋3段スキントーン（ハイライト・ベース・影）
 * - 選手ごとの「アバター遺伝子（avatarData）」から決定論的に描画
 * - 生成済み画像はマスターCanvasおよびDataURLとしてインメモリキャッシュし、再描画コストを最小化
 * - 外部画像や重いライブラリは一切使用しない
 */

// ---------------------------------------------------------------------------
// パレット定義（スキントーン・髪型・髪色・クラブカラー）
// ---------------------------------------------------------------------------

// スキントーン（肌色パレット）：ハイライト・中間色・影色の3段構成
const AVATAR_SKIN_TONES = [
  { key: 'fair',       label: '色白',       base: '#f0c5a3', shadow: '#d8a07c', highlight: '#fbe3cc', shade: '#d8a07c' },
  { key: 'tan',        label: '小麦色',     base: '#d29462', shadow: '#b07345', highlight: '#dfa87a', shade: '#b07345' },
  { key: 'olive',      label: '褐色',       base: '#bc7d4d', shadow: '#965a30', highlight: '#cc8f5f', shade: '#965a30' },
  { key: 'dark_brown', label: 'アフリカ系', base: '#7a4628', shadow: '#5a3018', highlight: '#8f5835', shade: '#5a3018' },
  { key: 'deep_black', label: '濃褐色',     base: '#4d2b1a', shadow: '#33190e', highlight: '#613923', shade: '#33190e' }
];

const AVATAR_HAIR_STYLES = ['short', 'spiky', 'perm', 'afro', 'dreads', 'buzz', 'centerpart', 'long'];
const AVATAR_HAIR_STYLE_LABELS = {
  short: '短髪フェード', spiky: 'ツンツン', perm: 'パーマ', afro: 'アフロ',
  dreads: 'ドレッド', buzz: '坊主', centerpart: 'センター分け', long: 'ウェーブ長髪'
};

// 髪色パレット：黒、濃茶、金髪、赤茶、アッシュ/白髪
const AVATAR_HAIR_COLORS = [
  { key: 'black',  label: '黒',           base: '#1a1a1a', shadow: '#0c0c0c', highlight: '#333333', shade: '#0c0c0c' },
  { key: 'brown',  label: '濃茶',         base: '#3d2817', shadow: '#24170d', highlight: '#5c3d25', shade: '#24170d' },
  { key: 'blond',  label: '金髪',         base: '#c99a4a', shadow: '#96702d', highlight: '#e2bb69', shade: '#96702d' },
  { key: 'auburn', label: '赤茶',         base: '#8d3d24', shadow: '#612513', highlight: '#ab5233', shade: '#612513' },
  { key: 'grey',   label: 'アッシュ/白髪', base: '#888888', shadow: '#5e5e5e', highlight: '#aaaaaa', shade: '#5e5e5e' }
];

const AVATAR_FACIAL_HAIR = ['none', 'mustache', 'goatee', 'beard'];
const AVATAR_ACCESSORIES = ['none', 'glasses', 'band'];

// 国籍ごとの肌色出現ウェイト [色白, 小麦色, 褐色, アフリカ系, 濃褐色]
const AVATAR_SKIN_WEIGHTS_BY_NATIONALITY = {
  England:     [34, 28, 12, 13, 13],
  Scotland:    [62, 26, 6, 3, 3],
  Wales:       [58, 28, 6, 4, 4],
  Ireland:     [64, 26, 5, 3, 2],
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
  Japan:       [42, 50, 8, 0, 0],
  Austria:     [52, 32, 10, 4, 2],
  Switzerland: [42, 34, 12, 7, 5],
  Denmark:     [66, 24, 6, 2, 2],
  Norway:      [68, 22, 6, 2, 2],
  Sweden:      [64, 24, 6, 3, 3],
  Turkey:      [20, 44, 30, 4, 2],
  Greece:      [22, 44, 28, 4, 2],
  Ukraine:     [56, 34, 8, 2, 0],
  Poland:      [60, 32, 6, 2, 0],
  Czechia:     [58, 34, 6, 2, 0],
  Serbia:      [48, 38, 12, 2, 0],
  Hungary:     [54, 36, 8, 2, 0],
  Romania:     [40, 42, 16, 2, 0],
  Bulgaria:    [42, 42, 14, 2, 0],
  Slovakia:    [56, 34, 8, 2, 0],
  Slovenia:    [54, 36, 8, 2, 0],
  Cyprus:      [20, 44, 30, 4, 2],
  Azerbaijan:  [20, 46, 30, 3, 1],
  Israel:      [24, 44, 26, 4, 2],
  Iceland:     [76, 20, 4, 0, 0],
  Finland:     [72, 22, 4, 1, 1],
  Uruguay:     [26, 42, 24, 5, 3],
  Colombia:    [10, 28, 32, 18, 12],
  Ecuador:     [8, 26, 36, 18, 12],
  Chile:       [18, 40, 34, 5, 3],
  Nigeria:     [0, 2, 8, 44, 46],
  Senegal:     [0, 1, 6, 42, 51],
  Morocco:     [12, 34, 40, 10, 4],
  IvoryCoast:  [0, 2, 7, 45, 46],
  Ghana:       [0, 1, 6, 43, 50],
  Egypt:       [8, 34, 42, 12, 4],
  Cameroon:    [0, 1, 7, 44, 48],
  SouthKorea:  [44, 48, 8, 0, 0],
  Australia:   [46, 34, 12, 4, 4],
  USA:         [30, 28, 18, 14, 10],
  Mexico:      [14, 38, 38, 6, 4],
  Canada:      [38, 28, 14, 11, 9]
};

// 肌色ごとの髪色ウェイト [黒, 濃茶, 金髪, 赤茶, アッシュ/白髪]
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
const AVATAR_DEFAULT_KIT = ['#334155', '#e2e8f0'];

// ---------------------------------------------------------------------------
// ヘルパー＆乱数ユーティリティ
// ---------------------------------------------------------------------------
function findSkinPalette(key) {
  if (!key) return AVATAR_SKIN_TONES[1];
  if (key === 'fair') return AVATAR_SKIN_TONES[0];
  if (key === 'tan' || key === 'medium') return AVATAR_SKIN_TONES[1];
  if (key === 'olive') return AVATAR_SKIN_TONES[2];
  if (key === 'dark_brown' || key === 'brown') return AVATAR_SKIN_TONES[3];
  if (key === 'deep_black' || key === 'dark') return AVATAR_SKIN_TONES[4];
  return AVATAR_SKIN_TONES.find(s => s.key === key) || AVATAR_SKIN_TONES[1];
}

function findHairPalette(key) {
  if (!key) return AVATAR_HAIR_COLORS[0];
  if (key === 'black') return AVATAR_HAIR_COLORS[0];
  if (key === 'brown') return AVATAR_HAIR_COLORS[1];
  if (key === 'blond') return AVATAR_HAIR_COLORS[2];
  if (key === 'auburn' || key === 'red') return AVATAR_HAIR_COLORS[3];
  if (key === 'grey' || key === 'gray') return AVATAR_HAIR_COLORS[4];
  return AVATAR_HAIR_COLORS.find(h => h.key === key) || AVATAR_HAIR_COLORS[0];
}

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

function hexToRgb(hex) {
  const h = (hex || '#000000').replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0
  ];
}

function shadeHex(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amount)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
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
  const accessoryIdx = avatarWeightedPick([84, 6, 10], rng);

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
  if (!player || typeof gameState === 'undefined' || !gameState) return null;
  if (Array.isArray(gameState.clubs)) {
    for (const c of gameState.clubs) {
      if ((c.players || []).some(p => p.id === player.id)) return c;
      if ((c.youthSquad || []).some(p => p.id === player.id)) return c;
      if (player.clubId && c.id === player.clubId) return c;
    }
  }
  const comps = gameState.competitions;
  if (comps) {
    const pools = [
      comps.championship && comps.championship.clubs,
      comps.preseasonCup && comps.preseasonCup.participants,
      comps.championsCup && comps.championsCup.participants,
      comps.europaCup && comps.europaCup.participants,
      comps.conferenceCup && comps.conferenceCup.participants
    ];
    for (const pool of pools) {
      if (!Array.isArray(pool)) continue;
      for (const c of pool) {
        if (!c) continue;
        if ((c.players || []).some(p => p.id === player.id)) return c;
        if (player.clubId && c.id === player.clubId) return c;
      }
    }
  }
  if (player.sellerClub && typeof player.sellerClub === 'object') {
    return player.sellerClub;
  }
  if (player.euroClubId && typeof findEuropeanClubDefinitionById === 'function') {
    const euroDef = findEuropeanClubDefinitionById(player.euroClubId);
    if (euroDef) return euroDef;
  }
  if (player.clubId && typeof findEuropeanClubDefinitionById === 'function') {
    const euroDef = findEuropeanClubDefinitionById(player.clubId);
    if (euroDef) return euroDef;
  }
  return null;
}

function getAvatarKitColors(player, club) {
  if (Array.isArray(club) && club.length >= 2) {
    return [club[0], club[1]];
  }
  if (club && Array.isArray(club.kitColors) && club.kitColors.length >= 2) {
    return [club.kitColors[0], club.kitColors[1]];
  }
  if (player && player.isSecretary) {
    return Array.isArray(player.kitColors) && player.kitColors.length >= 2 ? player.kitColors : ['#1e293b', '#38bdf8'];
  }
  if (player && player.isManager) {
    return ['#222a35', '#ffffff'];
  }
  if (player && player.isCoach) {
    return getCoachKitColors(player.category);
  }

  const resolvedClub = club || findAvatarClubForPlayer(player);
  if (resolvedClub) {
    if (Array.isArray(resolvedClub.kitColors) && resolvedClub.kitColors.length >= 2) {
      return [resolvedClub.kitColors[0], resolvedClub.kitColors[1]];
    }
    if (resolvedClub.id && CLUB_KIT_COLORS[resolvedClub.id]) {
      return CLUB_KIT_COLORS[resolvedClub.id];
    }
    if (resolvedClub.primaryColor) {
      return [resolvedClub.primaryColor, resolvedClub.secondaryColor || '#ffffff'];
    }
    if (resolvedClub.emblem && resolvedClub.emblem.primaryColor) {
      return [resolvedClub.emblem.primaryColor, resolvedClub.emblem.secondaryColor || '#ffffff'];
    }
  }
  return AVATAR_DEFAULT_KIT;
}

// ---------------------------------------------------------------------------
// 16-bit レトロモダン・ピクセルポートレート描画コア（32x32 グリッド）
// ---------------------------------------------------------------------------
/**
 * 共通ヘルパー：後ろ髪レイヤー描画（円形32x32 ＆ バスト立ち絵48x54共用）
 */
function drawPixelAvatarBackHair(ctx, ox, oy, genes, hair, extraLongBottom = false) {
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(ox + x, oy + y, w, h);
  const set = (c) => { ctx.fillStyle = c; };
  const style = genes.hairStyle || 'short';

  set(hair.base);
  if (style === 'afro') {
    px(8, 2, 16, 2);
    px(6, 4, 20, 2);
    px(4, 6, 24, 8);
    px(5, 14, 22, 3);
    px(6, 17, 4, 2); px(22, 17, 4, 2);
    set(hair.shadow);
    for (let y = 3; y < 18; y += 2) {
      for (let x = 5 + (y % 4 === 1 ? 1 : 0); x < 27; x += 3) {
        if ((x - 16) * (x - 16) + (y - 10) * (y - 10) <= 120) px(x, y);
      }
    }
    set(hair.highlight);
    for (let y = 3; y < 10; y += 2) {
      for (let x = 9 + (y % 3); x < 23; x += 4) px(x, y);
    }
  } else if (style === 'long') {
    const extH = extraLongBottom ? 21 : 17;
    px(7, 7, 18, extH);
    if (!extraLongBottom) px(8, 24, 16, 2);
    set(hair.shadow);
    px(7, 14, 2, extH - 6); px(23, 14, 2, extH - 6);
    set(hair.highlight);
    px(9, 10, 1, 13); px(22, 10, 1, 13);
  } else if (style === 'dreads') {
    const len = extraLongBottom ? 20 : 16;
    for (const x of [6, 8, 23, 25]) {
      set(hair.base); px(x, 8, 2, len);
      set(hair.shadow); for (let y = 9; y < 8 + len; y += 3) px(x, y, 2, 1);
      set(hair.highlight); for (let y = 10; y < 8 + len; y += 3) px(x, y, 1, 1);
    }
  }
}

/**
 * 32x32 グリッドへ円形バストアップのドット絵を描画
 * @param {CanvasRenderingContext2D} ctx 既に scale 済みのコンテキスト
 */
function drawPixelAvatarOnContext(ctx, genes, age, kit, roleType = 'player') {
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(x, y, w, h);
  const set = (c) => { ctx.fillStyle = c; };

  const skin = findSkinPalette(genes.skinColor);
  let hair = findHairPalette(genes.hairColor);
  if (age >= 34) hair = findHairPalette('grey');
  const isVeteranSaltPepper = age >= 31 && age < 34 && hair.key !== 'grey' && hair.key !== 'blond';

  const [kitMain, kitAccent] = kit || AVATAR_DEFAULT_KIT;

  ctx.clearRect(0, 0, 32, 32);

  // 1. 【背景円（Base Circle）】
  ctx.save();
  ctx.beginPath();
  ctx.arc(16, 16, 14.8, 0, Math.PI * 2);
  ctx.closePath();
  set('#1c2026');
  ctx.fill();
  ctx.clip(); // 円形クリッピング

  // アンビエントライト（クラブカラーの微かな光 ＋ 上部ソフトハイライト）
  const [kr, kg, kb] = hexToRgb(kitMain);
  ctx.fillStyle = `rgba(${kr}, ${kg}, ${kb}, 0.16)`;
  ctx.fillRect(0, 0, 32, 32);
  set('rgba(255, 255, 255, 0.04)');
  px(0, 0, 32, 11);

  // 2. 【後ろ髪レイヤー（頭部・首の背面）】
  drawPixelAvatarBackHair(ctx, 0, 0, genes, hair, false);

  // 3. 【首と顎下の深い影】
  // 首のベース幅 6px (X=13〜18, Y=22〜26)
  set(skin.base);
  px(13, 22, 6, 4);
  // 首元・耳の内側・顎下の濃い影ピクセル（立体感のコア）
  set(skin.shadow);
  px(13, 22, 6, 2); // 顎の直下の濃い影
  px(13, 24, 1, 2); px(18, 24, 1, 2); // 首の両脇の影

  // 4. 【ユニフォーム襟元（Kit Collar）】
  // 円の下部（Y座標25〜31付近）に所属クラブカラー（メイン・サブ）を描画
  set(kitMain);
  px(11, 25, 10, 1);
  px(8, 26, 16, 1);
  px(5, 27, 22, 1);
  px(3, 28, 26, 4);

  // ユニフォーム裾・影側の立体陰影
  set(shadeHex(kitMain, -32));
  px(3, 30, 26, 2);
  px(22, 27, 7, 4); // 右半身の陰影

  if (roleType === 'manager') {
    // 監督専用：ダークスーツのラペル・白ワイシャツ・ネクタイ
    set('#f8fafc');
    px(13, 25, 6, 3);
    px(14, 28, 4, 4);
    // ラペル（襟の折り返し陰影）
    set(shadeHex(kitMain, 18));
    px(11, 25, 2, 2); px(19, 25, 2, 2);
    px(12, 27, 2, 2); px(18, 27, 2, 2);
    px(13, 29, 1, 3); px(18, 29, 1, 3);
    // ネクタイ（深紅）
    set('#991b1b');
    px(15, 26, 2, 1);
    set('#b91c1c');
    px(15, 27, 2, 5);
  } else if (roleType === 'secretary') {
    // 秘書専用：オフィスジャケット＋白インナー＋スカーフ/ネクタイアクセント
    set('#f8fafc');
    px(13, 25, 6, 3);
    px(14, 28, 4, 4);
    set(shadeHex(kitMain, 16));
    px(11, 25, 2, 2); px(19, 25, 2, 2);
    px(12, 27, 2, 2); px(18, 27, 2, 2);
    px(13, 29, 1, 3); px(18, 29, 1, 3);
    if (genes.isFemale) {
      // 襟元リボン・スカーフアクセント
      set(kitAccent);
      px(14, 26, 4, 1);
      px(15, 27, 2, 2);
      set(shadeHex(kitAccent, -24));
      px(14, 27, 1, 1); px(17, 27, 1, 1);
    } else {
      // シックなアクセントネクタイ
      set(shadeHex(kitAccent, -20));
      px(15, 26, 2, 1);
      set(kitAccent);
      px(15, 27, 2, 5);
    }
  } else {
    // 襟元（Collar）ストライプ
    set(kitAccent);
    // 首元のVネックまたはリブカラー
    px(11, 25, 2, 1); px(19, 25, 2, 1);
    px(12, 26, 2, 1); px(18, 26, 2, 1);
    px(13, 27, 2, 1); px(17, 27, 2, 1);
    px(15, 28, 2, 1); // Vの先端

    // 襟元中央の隙間（首元の影肌）
    set(skin.shadow);
    px(14, 25, 4, 1);
    px(14, 26, 4, 1);
    px(15, 27, 2, 1);

    // 肩・袖のアクセントストライプ（4〜5px）
    set(kitAccent);
    px(5, 28, 2, 4);
    px(25, 28, 2, 4);
  }

  // 5〜13: 顔（耳・輪郭・眉・目・鼻・口・髭・前髪・アクセサリー）共通レイヤーを描画
  drawPixelAvatarFaceAndHairLayers(ctx, 0, 0, genes, hair, age, kitAccent, false);

  ctx.restore();

  // 14. 【外周リング】
  ctx.beginPath();
  ctx.arc(16, 16, 15.2, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#252a32';
  ctx.stroke();
}

/**
 * 共通ヘルパー：顔の輪郭〜表情〜前髪〜アクセサリーを描画（32x32円形・バスト立ち絵共用）
 */
function drawPixelAvatarFaceAndHairLayers(ctx, ox, oy, genes, hair, age, kitAccent, isBust = false) {
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(ox + x, oy + y, w, h);
  const set = (c) => { ctx.fillStyle = c; };
  const skin = findSkinPalette(genes.skinColor);
  const isVeteranSaltPepper = age >= 31 && age < 34 && hair.key !== 'grey' && hair.key !== 'blond';
  const style = genes.hairStyle || 'short';

  // 5. 【耳】
  set(skin.base);
  px(8, 13, 2, 4); px(22, 13, 2, 4);
  set(skin.shadow);
  px(9, 14, 1, 2); px(22, 14, 1, 2);

  // 6. 【顔の輪郭】
  set(skin.base);
  px(11, 8, 10, 2);
  px(10, 10, 12, 10);
  px(11, 20, 10, 1);
  px(12, 21, 8, 1);
  px(13, 22, 6, 1);

  set(skin.shadow);
  px(21, 10, 1, 10);
  if (!genes.isFemale) {
    px(20, 20, 1, 1);
    px(11, 20, 1, 1);
  }
  px(12, 21, 1, 1); px(19, 21, 1, 1);
  px(13, 22, 6, 1);

  set(skin.highlight);
  px(12, 9, 6, 1);
  px(11, 11, 1, 4);

  if (isBust && genes.isFemale) {
    ctx.fillStyle = 'rgba(244, 114, 182, 0.24)';
    px(11, 17, 2, 1);
    px(19, 17, 2, 1);
  }

  // 7. 【眉】
  const browColor = hair.key === 'blond' ? '#8a6425' : hair.key === 'grey' ? '#4a4a4a' : hair.shadow;
  set(browColor);
  px(11, 12, 3, 1);
  px(18, 12, 3, 1);
  px(13, 13, 1, 1);
  px(18, 13, 1, 1);

  // 8. 【目】
  const ev = genes.eyeVariant || 0;
  set(skin.shadow);
  px(11, 13, 2, 1); px(19, 13, 2, 1);

  if (ev === 1) {
    set('#f8fafc'); px(11, 14, 1, 1); px(20, 14, 1, 1);
    set('#111827'); px(12, 14, 2, 1); px(18, 14, 2, 1);
  } else if (ev === 2) {
    set('#f8fafc');
    px(11, 14, 1, 1); px(13, 14, 1, 1);
    px(18, 14, 1, 1); px(20, 14, 1, 1);
    const irisColor = (genes.skinColor === 'fair' || genes.skinColor === 'tan') ? '#2563eb' : '#b45309';
    set(irisColor);
    px(12, 14, 1, 1); px(19, 14, 1, 1);
  } else {
    set('#f8fafc');
    px(11, 14, 1, 1); px(13, 14, 1, 1);
    px(18, 14, 1, 1); px(20, 14, 1, 1);
    set('#111827');
    px(12, 14, 1, 1); px(19, 14, 1, 1);
  }

  // 9. 【鼻】
  set(skin.highlight);
  px(15, 14, 1, 3);
  set(skin.shadow);
  px(15, 17, 2, 1);
  px(14, 17, 1, 1);
  px(17, 17, 1, 1);

  // 10. 【口】
  if (genes.isFemale) {
    set('#1e293b');
    px(10, 13, 1, 1); px(21, 13, 1, 1);
    set('#b84a5a');
    px(14, 19, 4, 1);
    if (isBust) {
      px(13, 18, 1, 1);
      px(18, 18, 1, 1);
    }
  } else {
    set('#7a3328');
    px(14, 19, 4, 1);
  }
  set(skin.shadow);
  px(15, 20, 2, 1);

  // 11. 【髭】
  const facial = genes.isFemale ? 'none' : (genes.facialHair || 'none');
  const beardColor = hair.base;
  const beardShadow = hair.shadow;

  if (facial === 'mustache') {
    set(beardColor);
    px(13, 18, 6, 1);
    set(beardShadow);
    px(13, 19, 1, 1); px(18, 19, 1, 1);
  } else if (facial === 'goatee') {
    set(beardColor);
    px(13, 18, 6, 1);
    px(15, 20, 2, 1);
    px(14, 21, 4, 1);
    set(beardShadow);
    px(14, 22, 4, 1);
  } else if (facial === 'beard') {
    set(beardColor);
    px(10, 15, 1, 5); px(21, 15, 1, 5);
    px(11, 18, 2, 3); px(19, 18, 2, 3);
    px(13, 18, 6, 1);
    px(12, 20, 8, 2);
    set(beardShadow);
    px(13, 22, 6, 1);
    set('#7a3328');
    px(14, 19, 4, 1);
  } else if (age >= 28 && !genes.isFemale) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
    px(11, 18, 10, 3);
  }

  // 12. 【前髪・トップヘアレイヤー】
  set(hair.base);
  switch (style) {
    case 'short':
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      px(10, 9, 2, 3); px(20, 9, 2, 3);
      set(hair.highlight);
      px(12, 6, 7, 1);
      set(skin.shadow);
      px(9, 10, 1, 3); px(22, 10, 1, 3);
      break;
    case 'spiky':
      px(10, 7, 12, 2);
      px(10, 9, 1, 2); px(21, 9, 1, 2);
      px(11, 4, 2, 3);
      px(14, 3, 2, 4);
      px(17, 3, 2, 4);
      px(19, 5, 2, 2);
      set(hair.highlight);
      px(14, 4, 1, 2); px(17, 4, 1, 2);
      set(hair.shadow);
      px(10, 8, 12, 1);
      break;
    case 'perm':
      px(10, 5, 12, 1);
      px(9, 6, 14, 4);
      px(8, 10, 3, 4); px(21, 10, 3, 4);
      set(hair.highlight);
      for (let y = 6; y < 12; y += 2) {
        for (let x = 10 + (y % 4 === 0 ? 0 : 2); x < 22; x += 3) px(x, y);
      }
      set(hair.shadow);
      for (let y = 7; y < 13; y += 2) {
        for (let x = 11 + (y % 4 === 0 ? 0 : 2); x < 21; x += 3) px(x, y);
      }
      break;
    case 'afro':
      px(10, 7, 12, 2);
      set(hair.shadow);
      px(10, 8, 12, 1);
      break;
    case 'dreads':
      px(10, 6, 12, 2);
      for (const x of [9, 12, 17, 20]) {
        set(hair.base); px(x, 7, 2, 8);
        set(hair.shadow); px(x, 10, 2, 1); px(x, 14, 2, 1);
        set(hair.highlight); px(x, 8, 1, 2);
      }
      break;
    case 'buzz':
      ctx.fillStyle = hair.base;
      ctx.globalAlpha = 0.5;
      px(11, 6, 10, 1);
      px(10, 7, 12, 2);
      px(10, 9, 1, 3); px(21, 9, 1, 3);
      ctx.globalAlpha = 1.0;
      break;
    case 'centerpart':
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      px(9, 9, 3, isBust ? 9 : 4); px(20, 9, 3, isBust ? 9 : 4);
      if (isBust) {
        px(8, 14, 3, 7); px(21, 14, 3, 7);
      }
      set(skin.base);
      px(15, 7, 2, 3);
      set(hair.shadow);
      px(14, 9, 1, 2); px(17, 9, 1, 2);
      set(hair.highlight);
      px(12, 6, 3, 1); px(17, 6, 3, 1);
      if (isBust) {
        px(9, 11, 1, 6); px(22, 11, 1, 6);
      }
      break;
    case 'long':
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      px(8, 9, 3, isBust ? 16 : 12); px(21, 9, 3, isBust ? 16 : 12);
      set(hair.highlight);
      px(12, 6, 7, 1);
      px(9, 11, 1, isBust ? 11 : 8); px(22, 11, 1, isBust ? 11 : 8);
      set(hair.shadow);
      px(11, 8, 10, 1);
      break;
    default:
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      set(hair.highlight);
      px(12, 6, 8, 1);
  }

  if (isVeteranSaltPepper && style !== 'buzz') {
    set('rgba(220, 225, 230, 0.65)');
    px(11, 6); px(14, 7); px(18, 6); px(20, 8); px(10, 10); px(21, 11);
  }

  // 13. 【アクセサリー】
  if (genes.accessories === 'glasses') {
    set('#232830');
    px(10, 13, 4, 1); px(10, 16, 4, 1);
    px(10, 14, 1, 2); px(13, 14, 1, 2);
    px(17, 13, 4, 1); px(17, 16, 4, 1);
    px(17, 14, 1, 2); px(20, 14, 1, 2);
    px(14, 14, 3, 1);
    px(9, 14, 1, 1); px(21, 14, 1, 1);
    ctx.fillStyle = 'rgba(210, 235, 255, 0.28)';
    px(11, 14, 2, 2); px(18, 14, 2, 2);
  } else if (genes.accessories === 'band') {
    const bandColor = kitAccent === '#ffffff' || kitAccent === '#f2f2f2' ? '#f8fafc' : kitAccent;
    set(bandColor);
    px(10, 9, 12, 1);
    set(shadeHex(bandColor, -35));
    px(10, 10, 12, 1);
  }
}

/**
 * 秘書立ち絵バストアップ（48x54px透過グリッド）を描画
 */
function drawSecretaryBustOnContext(ctx, secretary) {
  const genes = ensurePlayerAvatarData(secretary);
  const skin = findSkinPalette(genes.skinColor);
  const age = secretary.age || 27;
  let hair = findHairPalette(genes.hairColor);
  if (age >= 34) hair = findHairPalette('grey');
  const kit = Array.isArray(secretary.kitColors) && secretary.kitColors.length >= 2
    ? secretary.kitColors
    : ['#1e293b', '#38bdf8'];
  const [kitMain, kitAccent] = kit;

  const px = (x, y, w = 1, h = 1) => ctx.fillRect(x, y, w, h);
  const set = (c) => { ctx.fillStyle = c; };

  ctx.clearRect(0, 0, 48, 54);

  const ox = 8;
  const oy = 1;

  // 1. 後ろ髪（肩にかかるボブ・ロング表現）
  drawPixelAvatarBackHair(ctx, ox, oy, genes, hair, true);
  if (genes.hairStyle === 'centerpart') {
    set(hair.base);
    px(ox + 8, oy + 9, 16, 17);
    set(hair.shadow);
    px(ox + 8, oy + 18, 2, 8);
    px(ox + 22, oy + 18, 2, 8);
  }

  // 2. 首と鎖骨周辺の陰影
  set(skin.base);
  px(ox + 13, oy + 22, 6, 6);
  set(skin.shadow);
  px(ox + 13, oy + 22, 6, 2);
  px(ox + 13, oy + 24, 1, 3);
  px(ox + 18, oy + 24, 1, 3);

  // 3. ジャケット胴体・テーラードシルエット
  set(kitMain);
  px(17, 27, 14, 1);
  px(15, 28, 18, 1);
  px(13, 29, 22, 2);
  px(12, 31, 24, 4);
  px(13, 35, 22, 19);

  // 左右輪郭の陰影とハイライト
  set(shadeHex(kitMain, -28));
  px(30, 30, 5, 24);
  px(12, 31, 2, 23);
  set(shadeHex(kitMain, 18));
  px(15, 28, 3, 1);
  px(30, 28, 3, 1);

  // 4. 白ブラウス／シャツＶゾーンと襟ラペル
  set('#f8fafc');
  px(20, 27, 8, 2);
  px(21, 29, 6, 3);
  px(22, 32, 4, 3);
  px(23, 35, 2, 3);
  set('#cbd5e1');
  px(21, 29, 1, 2);
  px(26, 29, 1, 2);

  // ラペルライン
  set(shadeHex(kitMain, 24));
  px(18, 27, 2, 3); px(28, 27, 2, 3);
  px(19, 30, 2, 3); px(27, 30, 2, 3);
  px(20, 33, 2, 3); px(26, 33, 2, 3);
  px(21, 36, 2, 2); px(25, 36, 2, 2);

  // 金パイピング＆ボタン装飾
  set('#fbbf24');
  px(23, 41, 2, 2);
  px(23, 47, 2, 2);

  // 5. リボンタイ（女性秘書）またはネクタイ（男性秘書）
  if (genes.isFemale) {
    const bowMain = '#fbbf24';
    const bowShadow = '#d97706';
    set(bowMain);
    px(20, 28, 3, 2);
    px(25, 28, 3, 2);
    px(21, 30, 2, 2);
    px(25, 30, 2, 2);
    set(bowShadow);
    px(23, 28, 2, 2);
    px(21, 31, 1, 1);
    px(26, 31, 1, 1);
  } else {
    set(shadeHex(kitAccent, -20));
    px(23, 27, 2, 2);
    set(kitAccent);
    px(23, 29, 2, 8);
  }

  // 6. 左腕と小物アイテム（コーヒーカップ / 戦術タブレット / 書類ファイル）
  set(kitMain);
  px(10, 31, 4, 10);
  px(11, 40, 8, 4);
  set(shadeHex(kitMain, 14));
  px(11, 31, 1, 8);
  set('#f8fafc');
  px(16, 40, 1, 4); // シャツ袖口

  // 左手
  set(skin.base);
  px(16, 39, 3, 3);
  set(skin.shadow);
  px(17, 41, 2, 1);

  if (secretary.id === 'sec_elena') {
    // ピッチグリーン発光ライン入り戦術タブレット
    set('#334155');
    px(11, 33, 7, 8);
    set('#0f172a');
    px(12, 34, 5, 6);
    set('#2ecc71');
    px(13, 35, 3, 1);
    px(13, 37, 2, 1);
    px(13, 39, 3, 1);
  } else if (secretary.id === 'sec_arthur') {
    // 理事会用レザーバインダー
    set('#78350f');
    px(11, 34, 7, 8);
    set('#f59e0b');
    px(14, 34, 2, 1);
    set('#f8fafc');
    px(12, 35, 5, 1);
  } else {
    // ブリーフィングの湯気立つカップ
    set('#f8fafc');
    px(12, 33, 5, 7);
    set('#cbd5e1');
    px(11, 31, 7, 1);
    px(12, 32, 5, 1);
    set('#92400e');
    px(12, 35, 5, 3);
    set('#38bdf8');
    px(14, 36, 1, 1);
    // 湯気
    ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
    px(13, 29, 1, 1);
    px(15, 27, 1, 2);
    px(14, 25, 1, 1);
  }

  // 7. 頭部・表情・前髪・眼鏡
  drawPixelAvatarFaceAndHairLayers(ctx, ox, oy, genes, hair, age, kitAccent, true);
}

/**
 * 監督立ち絵バストアップ（48x54px透過グリッド）を描画
 */
function drawManagerBustOnContext(ctx, manager, club = null) {
  const genes = ensurePlayerAvatarData(manager);
  const skin = findSkinPalette(genes.skinColor);
  const age = manager.age || 50;
  let hair = findHairPalette(genes.hairColor);
  if (age >= 48 && hair.key !== 'blond') hair = findHairPalette('grey');
  const clubColors = club ? [club.primaryColor || '#2ecc71', club.secondaryColor || '#38bdf8'] : ['#2ecc71', '#38bdf8'];
  const suitMain = '#1e293b';
  const tieColor = clubColors[0] === '#1e293b' ? '#2ecc71' : clubColors[0];

  const px = (x, y, w = 1, h = 1) => ctx.fillRect(x, y, w, h);
  const set = (c) => { ctx.fillStyle = c; };

  ctx.clearRect(0, 0, 48, 54);
  const ox = 8;
  const oy = 1;

  // 1. 後ろ髪
  drawPixelAvatarBackHair(ctx, ox, oy, genes, hair, true);

  // 2. 首
  set(skin.base);
  px(ox + 13, oy + 22, 6, 6);
  set(skin.shadow);
  px(ox + 13, oy + 22, 6, 2);

  // 3. スーツ胴体（肩幅広めの監督ジャケット）
  set(suitMain);
  px(16, 27, 16, 1);
  px(14, 28, 20, 1);
  px(12, 29, 24, 3);
  px(11, 32, 26, 22);
  set('#0f172a');
  px(31, 30, 5, 24);
  px(11, 32, 2, 22);
  set('#334155');
  px(14, 28, 4, 1);
  px(30, 28, 4, 1);

  // 4. 白ワイシャツ＆ネクタイ（クラブカラー）
  set('#f8fafc');
  px(20, 27, 8, 2);
  px(21, 29, 6, 3);
  px(22, 32, 4, 5);
  set(tieColor);
  px(23, 28, 2, 10);
  set(shadeHex(tieColor, -25));
  px(23, 37, 2, 2);

  // 5. ラペルライン
  set('#334155');
  px(18, 27, 2, 3); px(28, 27, 2, 3);
  px(19, 30, 2, 3); px(27, 30, 2, 3);
  px(20, 33, 2, 3); px(26, 33, 2, 3);

  // 6. 左腕と戦術ボードバインダー
  set(suitMain);
  px(9, 31, 4, 10);
  px(10, 40, 8, 4);
  set('#f8fafc');
  px(16, 40, 1, 4);
  set(skin.base);
  px(16, 39, 3, 3);
  set('#0f172a');
  px(11, 33, 8, 9);
  set('#14532d');
  px(12, 34, 6, 7);
  set('#4ade80');
  px(13, 36, 4, 1);
  px(14, 38, 1, 2);
  px(16, 35, 1, 2);

  // 7. 頭部・表情
  drawPixelAvatarFaceAndHairLayers(ctx, ox, oy, genes, hair, age, tieColor, true);
}

// ---------------------------------------------------------------------------
// インメモリ 32x32 マスターCanvas & DataURL キャッシュ
// ---------------------------------------------------------------------------
const PLAYER_AVATAR_CANVAS_CACHE = new Map();
const PLAYER_AVATAR_CACHE = new Map();
const PLAYER_AVATAR_CACHE_LIMIT = 1500;
const PLAYER_AVATAR_LOOKUP = new Map();
let sharedAvatarCanvas = null;

function resolveAvatarRoleType(player) {
  if (player && player.isSecretary) return 'secretary';
  if (player && player.isManager) return 'manager';
  if (player && player.isCoach) return 'coach';
  return 'player';
}

function getAvatarCacheKey(genes, kit, age, roleType = 'player') {
  const ageBand = age >= 34 ? 'g' : age >= 31 ? 's' : age >= 28 ? 'm' : 'y';
  return [
    genes.skinColor, genes.hairStyle, genes.hairColor, genes.facialHair,
    genes.accessories, genes.eyeVariant, kit[0], kit[1], ageBand, roleType, genes.isFemale ? 'f' : 'm'
  ].join('|');
}

function getOrCreateMasterAvatarCanvas(genes, age, kit, roleType = 'player') {
  const key = getAvatarCacheKey(genes, kit, age, roleType);
  const cached = PLAYER_AVATAR_CANVAS_CACHE.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') return null;
  const master = document.createElement('canvas');
  master.width = 32;
  master.height = 32;
  const mctx = master.getContext('2d');
  mctx.imageSmoothingEnabled = false;
  drawPixelAvatarOnContext(mctx, genes, age, kit, roleType);

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
  const roleType = resolveAvatarRoleType(player);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const master = getOrCreateMasterAvatarCanvas(genes, age, kit, roleType);
  if (master) {
    ctx.drawImage(master, 0, 0, canvas.width, canvas.height);
  } else {
    const scale = canvas.width / 32;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawPixelAvatarOnContext(ctx, genes, age, kit, roleType);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

function getPlayerAvatarDataUrl(player, club = null, pixelSize = 48) {
  const genes = ensurePlayerAvatarData(player);
  const kit = getAvatarKitColors(player, club);
  const age = player.age || 25;
  const roleType = resolveAvatarRoleType(player);
  const key = `${getAvatarCacheKey(genes, kit, age, roleType)}|${pixelSize}`;

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
      const pidKey = String(player.id);
      if (!PLAYER_AVATAR_LOOKUP.has(pidKey) && PLAYER_AVATAR_LOOKUP.size >= PLAYER_AVATAR_CACHE_LIMIT) {
        PLAYER_AVATAR_LOOKUP.delete(PLAYER_AVATAR_LOOKUP.keys().next().value);
      }
      PLAYER_AVATAR_LOOKUP.set(pidKey, { player, club });
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
      if (entry.isBust) {
        if (entry.bustRole === 'manager') {
          generateManagerBust(entry.player, cv, entry.club);
        } else {
          generateSecretaryBust(entry.player, cv);
        }
      } else {
        generatePlayerAvatar(entry.player, cv, entry.club);
      }
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
  return getPlayerAvatarHtml({ ...manager, id: manager.id || `mgr_${manager.name || 'x'}`, isManager: true }, { kitColors: suitKit }, extraClass, canvasSize);
}

/**
 * コーチ陣アバターの生成（専門カテゴリ別トラックスーツのドット絵）
 */
function getCoachKitColors(category) {
  switch (category) {
    case 'attacking': return ['#8b2626', '#ffffff'];
    case 'defending': return ['#1b3b6f', '#ffffff'];
    case 'goalkeeping': return ['#1e5f38', '#ffffff'];
    case 'fitness': return ['#5a4220', '#f5a623'];
    default: return ['#2c3e50', '#ffffff'];
  }
}

function generateCoachAvatar(coach, targetCanvas = null, canvasSize = 48) {
  if (!coach) return null;
  const age = coach.age || 48;
  const nat = coach.nationality || 'England';
  if (!coach.avatarData && typeof generateAvatarData === 'function') {
    coach.avatarData = generateAvatarData(nat, age);
    if (coach.avatarData) {
      if (Math.random() < 0.5) coach.avatarData.facialHair = 'beard';
      if (Math.random() < 0.3) coach.avatarData.accessories = 'glasses';
    }
  }
  const kit = getCoachKitColors(coach.category);
  return generatePlayerAvatar({ ...coach, isCoach: true }, targetCanvas, { kitColors: kit }, canvasSize);
}

function getCoachAvatarHtml(coach, extraClass = 'avatar-sm', canvasSize = 48) {
  if (!coach) return '';
  const kit = getCoachKitColors(coach.category);
  return getPlayerAvatarHtml({ ...coach, id: coach.id || `coach_${coach.name || 'x'}`, isCoach: true }, { kitColors: kit }, extraClass, canvasSize);
}

/**
 * 秘書役アバターの生成（オフィスジャケットのドット絵）
 */
function generateSecretaryAvatar(secretary, targetCanvas = null, canvasSize = 48) {
  if (!secretary) return null;
  const kit = Array.isArray(secretary.kitColors) && secretary.kitColors.length >= 2
    ? secretary.kitColors
    : ['#1e293b', '#38bdf8'];
  return generatePlayerAvatar({ ...secretary, isSecretary: true }, targetCanvas, { kitColors: kit }, canvasSize);
}

function getSecretaryAvatarHtml(secretary, extraClass = 'avatar-md', canvasSize = 48) {
  if (!secretary) return '';
  const kit = Array.isArray(secretary.kitColors) && secretary.kitColors.length >= 2
    ? secretary.kitColors
    : ['#1e293b', '#38bdf8'];
  return getPlayerAvatarHtml(
    { ...secretary, id: secretary.id || `sec_${secretary.name || 'x'}`, isSecretary: true },
    { kitColors: kit },
    extraClass,
    canvasSize
  );
}

function generateSecretaryBust(secretary, canvas) {
  if (!secretary || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const sx = canvas.width / 48;
  const sy = canvas.height / 54;
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  drawSecretaryBustOnContext(ctx, secretary);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function generateManagerBust(manager, canvas, club = null) {
  if (!manager || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const sx = canvas.width / 48;
  const sy = canvas.height / 54;
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  drawManagerBustOnContext(ctx, manager, club);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function getManagerBustHtml(manager, club = null, extraClass = 'secretary-bust-canvas') {
  if (!manager) return '';
  try {
    const pid = String(manager.id || `mgr_bust_${manager.name || 'x'}`);
    PLAYER_AVATAR_LOOKUP.set(pid, { player: manager, club, isBust: true, bustRole: 'manager' });
    let url = '';
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 108;
      generateManagerBust(manager, c, club);
      url = c.toDataURL('image/png');
    }
    const bgStyle = url ? ` style="background-image:url('${url}');background-size:100% 100%;"` : '';
    return `<canvas class="player-avatar ${extraClass}" width="96" height="108" data-avatar-pid="${pid}"${bgStyle} aria-hidden="true"></canvas>`;
  } catch (e) {
    return getManagerAvatarHtml(manager, 'avatar-md', 64);
  }
}

function getSecretaryBustDataUrl(secretary, width = 144, height = 162) {
  if (!secretary) return '';
  const key = `bust|${secretary.id || secretary.name}|${width}x${height}`;
  const cached = PLAYER_AVATAR_CACHE.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  generateSecretaryBust(secretary, c);
  const url = c.toDataURL('image/png');
  PLAYER_AVATAR_CACHE.set(key, url);
  return url;
}

function getSecretaryBustHtml(secretary, extraClass = 'secretary-bust-canvas') {
  if (!secretary) return '';
  try {
    const bustKey = `sec_bust_${secretary.id || secretary.name || 'x'}`;
    PLAYER_AVATAR_LOOKUP.set(bustKey, { player: secretary, club: null, isBust: true });
    const w = 144;
    const h = 162;
    const url = getSecretaryBustDataUrl(secretary, w, h);
    const bgStyle = url ? ` style="background-image:url('${url}');background-size:100% 100%;"` : '';
    return `<canvas class="player-avatar ${extraClass}" width="${w}" height="${h}" data-avatar-pid="${bustKey}"${bgStyle} aria-hidden="true"></canvas>`;
  } catch (e) {
    return '';
  }
}

