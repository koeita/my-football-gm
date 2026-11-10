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
// 16-bit レトロモダン・ピクセルポートレート描画コア（32x32 グリッド）
// ---------------------------------------------------------------------------
/**
 * 32x32 グリッドへ円形バストアップのドット絵を描画
 * @param {CanvasRenderingContext2D} ctx 既に scale 済みのコンテキスト
 */
function drawPixelAvatarOnContext(ctx, genes, age, kit) {
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(x, y, w, h);
  const set = (c) => { ctx.fillStyle = c; };

  const skin = findSkinPalette(genes.skinColor);
  let hair = findHairPalette(genes.hairColor);
  if (age >= 34) hair = findHairPalette('grey');
  const isVeteranSaltPepper = age >= 31 && age < 34 && hair.key !== 'grey' && hair.key !== 'blond';

  const style = genes.hairStyle || 'short';
  const [kitMain, kitAccent] = kit || AVATAR_DEFAULT_KIT;

  ctx.clearRect(0, 0, 32, 32);

  // 1. 【背景円（Base Circle）】
  // 32x32 Canvas中央に、半径約14.8pxのダークグレー（#1c2026）の塗りつぶし円を描画
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
  set(hair.base);
  if (style === 'afro') {
    // 豊かなアフロの球状シルエット
    px(8, 2, 16, 2);
    px(6, 4, 20, 2);
    px(4, 6, 24, 8);
    px(5, 14, 22, 3);
    px(6, 17, 4, 2); px(22, 17, 4, 2);
    // アフロの陰影・ハイライトテクスチャ
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
    // 肩まで広がるウェーブ長髪（背面）
    px(7, 7, 18, 17);
    px(8, 24, 16, 2);
    set(hair.shadow);
    px(7, 14, 2, 11); px(23, 14, 2, 11);
    set(hair.highlight);
    px(9, 10, 1, 12); px(22, 10, 1, 12);
  } else if (style === 'dreads') {
    // 肩まで垂れ下がるドレッドの束（背面）
    for (const x of [6, 8, 23, 25]) {
      set(hair.base); px(x, 8, 2, 16);
      set(hair.shadow); for (let y = 9; y < 24; y += 3) px(x, y, 2, 1);
      set(hair.highlight); for (let y = 10; y < 24; y += 3) px(x, y, 1, 1);
    }
  }

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

  // 5. 【耳】
  // 左耳 (X=8〜9, Y=13〜16) / 右耳 (X=22〜23, Y=13〜16)
  set(skin.base);
  px(8, 13, 2, 4); px(22, 13, 2, 4);
  // 耳の内側の濃い影
  set(skin.shadow);
  px(9, 14, 1, 2); px(22, 14, 1, 2);

  // 6. 【顔の輪郭（角ばった顎ライン・立体シェーディング）】
  // 顔ベース（X=10〜21, Y=8〜21）
  set(skin.base);
  px(11, 8, 10, 2);   // 額
  px(10, 10, 12, 10); // 頬・顔中央
  px(11, 20, 10, 1);  // 顎上部
  px(12, 21, 8, 1);   // 角ばった顎ライン
  px(13, 22, 6, 1);   // 顎先端

  // 立体感シェーディング：右側・顎エッジ・顎下の影
  set(skin.shadow);
  px(21, 10, 1, 10);  // 右頬の縦シャドウ
  px(20, 20, 1, 1);   // 顎右角シャドウ
  px(11, 20, 1, 1);   // 顎左角シャドウ
  px(12, 21, 1, 1); px(19, 21, 1, 1); // 顎下角
  px(13, 22, 6, 1);   // 顎底辺の境界シャドウ

  // ハイライト（左上からの光源）：額と左頬
  set(skin.highlight);
  px(12, 9, 6, 1);    // 額ハイライト
  px(11, 11, 1, 4);   // 左頬ハイライト

  // 7. 【眉】
  // キリッとした横2〜3pxの引き締まったライン
  const browColor = hair.key === 'blond' ? '#8a6425' : hair.key === 'grey' ? '#4a4a4a' : hair.shadow;
  set(browColor);
  px(11, 12, 3, 1);
  px(18, 12, 3, 1);
  px(13, 13, 1, 1);
  px(18, 13, 1, 1);

  // 8. 【目（横3px：自信のある瞳）】
  const ev = genes.eyeVariant || 0;
  // まぶたの影
  set(skin.shadow);
  px(11, 13, 2, 1); px(19, 13, 2, 1);

  if (ev === 1) {
    // パターン1：鋭い眼光（横3px：白1px + 黒2px）
    set('#f8fafc'); px(11, 14, 1, 1); px(20, 14, 1, 1);
    set('#111827'); px(12, 14, 2, 1); px(18, 14, 2, 1);
  } else if (ev === 2) {
    // パターン2：青/琥珀系の澄んだ瞳（横3px：白 + 虹彩 + 白）
    set('#f8fafc');
    px(11, 14, 1, 1); px(13, 14, 1, 1);
    px(18, 14, 1, 1); px(20, 14, 1, 1);
    const irisColor = (genes.skinColor === 'fair' || genes.skinColor === 'tan') ? '#2563eb' : '#b45309';
    set(irisColor);
    px(12, 14, 1, 1); px(19, 14, 1, 1);
  } else {
    // パターン0：正面を見据える自信のある瞳（横3px：白 + 黒 + 白）
    set('#f8fafc');
    px(11, 14, 1, 1); px(13, 14, 1, 1);
    px(18, 14, 1, 1); px(20, 14, 1, 1);
    set('#111827');
    px(12, 14, 1, 1); px(19, 14, 1, 1);
  }

  // 9. 【鼻】
  // 鼻筋ハイライトと小鼻・鼻下の影
  set(skin.highlight);
  px(15, 14, 1, 3); // 鼻筋
  set(skin.shadow);
  px(15, 17, 2, 1); // 鼻下シャドウ
  px(14, 17, 1, 1); // 左小鼻
  px(17, 17, 1, 1); // 右小鼻

  // 10. 【口】
  // 顎から2px上（Y=19）に、引き締まった横2〜3pxの直線ライン
  set('#7a3328');
  px(14, 19, 4, 1); // 直線リップ
  // 下唇の立体シャドウ
  set(skin.shadow);
  px(15, 20, 2, 1);

  // 11. 【髭（Facial Hair）】
  const facial = genes.facialHair || 'none';
  const beardColor = hair.base;
  const beardShadow = hair.shadow;

  if (facial === 'mustache') {
    set(beardColor);
    px(13, 18, 6, 1);
    set(beardShadow);
    px(13, 19, 1, 1); px(18, 19, 1, 1);
  } else if (facial === 'goatee') {
    set(beardColor);
    px(13, 18, 6, 1); // 口髭
    px(15, 20, 2, 1);
    px(14, 21, 4, 1); // 顎髭
    set(beardShadow);
    px(14, 22, 4, 1);
  } else if (facial === 'beard') {
    // フルビアード・精悍な無精髭
    set(beardColor);
    px(10, 15, 1, 5); px(21, 15, 1, 5); // もみあげ
    px(11, 18, 2, 3); px(19, 18, 2, 3); // 頬髭
    px(13, 18, 6, 1); // 口髭
    px(12, 20, 8, 2); // 顎髭全体
    set(beardShadow);
    px(13, 22, 6, 1);
    set('#7a3328');
    px(14, 19, 4, 1); // 髭の間から覗く口
  } else if (age >= 28) {
    // 大人の選手：薄い無精髭のシャドウ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
    px(11, 18, 10, 3);
  }

  // 12. 【前髪・トップヘアレイヤー】
  set(hair.base);
  switch (style) {
    case 'short': // サイド刈り上げフェード・短髪ツーブロック
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      px(10, 9, 2, 3); px(20, 9, 2, 3);
      set(hair.highlight);
      px(12, 6, 7, 1);
      set(skin.shadow);
      px(9, 10, 1, 3); px(22, 10, 1, 3);
      break;

    case 'spiky': // スポーティなツンツンヘア
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

    case 'perm': // パーマ・カーリー
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

    case 'afro': // アフロ（前髪側）
      px(10, 7, 12, 2);
      set(hair.shadow);
      px(10, 8, 12, 1);
      break;

    case 'dreads': // ドレッドヘア（前髪側）
      px(10, 6, 12, 2);
      for (const x of [9, 12, 17, 20]) {
        set(hair.base); px(x, 7, 2, 8);
        set(hair.shadow); px(x, 10, 2, 1); px(x, 14, 2, 1);
        set(hair.highlight); px(x, 8, 1, 2);
      }
      break;

    case 'buzz': // スキンヘッド・坊主
      ctx.fillStyle = hair.base;
      ctx.globalAlpha = 0.5;
      px(11, 6, 10, 1);
      px(10, 7, 12, 2);
      px(10, 9, 1, 3); px(21, 9, 1, 3);
      ctx.globalAlpha = 1.0;
      break;

    case 'centerpart': // センター分け・カーテンヘア
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      px(9, 9, 3, 4); px(20, 9, 3, 4);
      set(skin.base);
      px(15, 7, 2, 3);
      set(hair.shadow);
      px(14, 9, 1, 2); px(17, 9, 1, 2);
      set(hair.highlight);
      px(12, 6, 3, 1); px(17, 6, 3, 1);
      break;

    case 'long': // ウェーブ長髪（前髪・サイド）
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      px(8, 9, 3, 12); px(21, 9, 3, 12);
      set(hair.highlight);
      px(12, 6, 7, 1);
      px(9, 11, 1, 8); px(22, 11, 1, 8);
      set(hair.shadow);
      px(11, 8, 10, 1);
      break;

    default:
      px(11, 5, 10, 1);
      px(10, 6, 12, 3);
      set(hair.highlight);
      px(12, 6, 8, 1);
  }

  // ベテラン選手（31〜33歳）のごま塩・白髪ハイライト
  if (isVeteranSaltPepper && style !== 'buzz') {
    set('rgba(220, 225, 230, 0.65)');
    px(11, 6); px(14, 7); px(18, 6); px(20, 8); px(10, 10); px(21, 11);
  }

  // 13. 【アクセサリー（メガネ・ヘアバンド）】
  if (genes.accessories === 'glasses') {
    // 細いフレームのインテリ風眼鏡
    set('#232830');
    // 左フレーム
    px(10, 13, 4, 1); px(10, 16, 4, 1);
    px(10, 14, 1, 2); px(13, 14, 1, 2);
    // 右フレーム
    px(17, 13, 4, 1); px(17, 16, 4, 1);
    px(17, 14, 1, 2); px(20, 14, 1, 2);
    // 中央ブリッジ & つる
    px(14, 14, 3, 1);
    px(9, 14, 1, 1); px(21, 14, 1, 1);
    // レンズ反射ハイライト
    ctx.fillStyle = 'rgba(210, 235, 255, 0.28)';
    px(11, 14, 2, 2); px(18, 14, 2, 2);
  } else if (genes.accessories === 'band') {
    // ヘアバンド
    const bandColor = kitAccent === '#ffffff' || kitAccent === '#f2f2f2' ? '#f8fafc' : kitAccent;
    set(bandColor);
    px(10, 9, 12, 1);
    set(shadeHex(bandColor, -35));
    px(10, 10, 12, 1);
  }

  ctx.restore();

  // 14. 【外周リング】
  ctx.beginPath();
  ctx.arc(16, 16, 15.2, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#252a32';
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
  return getPlayerAvatarHtml({ ...coach, id: coach.id || `coach_${coach.name || 'x'}` }, { kitColors: kit }, extraClass, canvasSize);
}
