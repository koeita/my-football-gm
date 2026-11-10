/**
 * competitions.js - フェーズ4: 2部リーグ・昇降格・国内2大カップ戦・欧州3大カップ戦（36チーム新リーグフェーズ）
 * 
 * 1. 2部リーグ（チャンピオンシップ：架空24クラブ、OVR 64〜74）
 * 2. 昇降格システム（1部18〜20位降格、2部1〜3位昇格、自クラブ降格時の理事会通告）
 * 3. 国内2大カップ戦（リーグカップ LGC、ナショナルカップ NAT）
 * 4. 欧州3大カップ戦（CL, EL, ECL）
 *    - 各大会「36チーム参加」
 *    - 現実準拠の「リーグフェーズ（各8試合）」＋「決勝トーナメント（R16 -> QF -> SF -> FINAL）」
 * 5. 高速ダイジェスト試合エンジン（simQuickMatch / simKnockoutMatch）
 * 6. 過密日程（週2試合）のスタミナ消費・怪我リスク補正
 * 7. 順位表・ブラケット描画ヘルパー
 */

// ==========================================
// 1. 2部リーグ（チャンピオンシップ）架空24クラブ定義
// ==========================================
const CHAMPIONSHIP_CLUBS_DEFINITIONS = [
  { id: 'c01', name: 'シェフィールド・S', shortName: 'SHS', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 74 },
  { id: 'c02', name: 'リーズ・U', shortName: 'LEU', primaryColor: '#FFCD00', secondaryColor: '#1D428A', pattern: 'split-vertical', shape: 'shield', basePower: 74 },
  { id: 'c03', name: 'バーンリー・C', shortName: 'BUR', primaryColor: '#6C1D45', secondaryColor: '#99D6EA', pattern: 'stripes-vertical', shape: 'circle', basePower: 73 },
  { id: 'c04', name: 'ノリッジ・C', shortName: 'NOR', primaryColor: '#FFF200', secondaryColor: '#00A651', pattern: 'sash-diagonal', shape: 'shield', basePower: 73 },
  { id: 'c05', name: 'ワトフォード・H', shortName: 'WAT', primaryColor: '#FBEE23', secondaryColor: '#ED2127', pattern: 'stripes-horizontal', shape: 'diamond', basePower: 72 },
  { id: 'c06', name: 'ミドルズブラ・B', shortName: 'MID', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 72 },
  { id: 'c07', name: 'ウェストブロム・A', shortName: 'WBA', primaryColor: '#122F67', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 72 },
  { id: 'c08', name: 'コヴェントリー・C', shortName: 'COV', primaryColor: '#00A3E0', secondaryColor: '#1D252C', pattern: 'halves-horizontal', shape: 'circle', basePower: 71 },
  { id: 'c09', name: 'ハルダーズフィールド', shortName: 'HUD', primaryColor: '#0E63AD', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 71 },
  { id: 'c10', name: 'プレストン・NE', shortName: 'PNE', primaryColor: '#FFFFFF', secondaryColor: '#002B49', pattern: 'quarters', shape: 'shield', basePower: 70 },
  { id: 'c11', name: 'ブリストル・C', shortName: 'BRC', primaryColor: '#C8102E', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 70 },
  { id: 'c12', name: 'ストーク・C', shortName: 'STK', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 },
  { id: 'c13', name: 'スウォンジー・C', shortName: 'SWA', primaryColor: '#121212', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 69 },
  { id: 'c14', name: 'カーディフ・C', shortName: 'CAR', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'circle', basePower: 69 },
  { id: 'c15', name: 'ミルウォール・L', shortName: 'MIL', primaryColor: '#002244', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 69 },
  { id: 'c16', name: 'ブラックバーン・R', shortName: 'BLA', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 68 },
  { id: 'c17', name: 'クイーンズパーク・R', shortName: 'QPR', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'diamond', basePower: 68 },
  { id: 'c18', name: 'ハル・C', shortName: 'HUL', primaryColor: '#F7941D', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 68 },
  { id: 'c19', name: 'サンダーランド・A', shortName: 'SUN', primaryColor: '#EB172B', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 67 },
  { id: 'c20', name: 'プリマス・A', shortName: 'PLY', primaryColor: '#0B3B24', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 66 },
  { id: 'c21', name: 'ロザラム・U', shortName: 'ROT', primaryColor: '#EE1C25', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 65 },
  { id: 'c22', name: 'バーミンガム・C', shortName: 'BIR', primaryColor: '#0000FF', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 66 },
  { id: 'c23', name: 'シェフィールド・W', shortName: 'SHW', primaryColor: '#002E6D', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'diamond', basePower: 65 },
  { id: 'c24', name: 'ルートン・T', shortName: 'LUT', primaryColor: '#F68B1F', secondaryColor: '#002B49', pattern: 'chevron-down', shape: 'shield', basePower: 67 }
];

// ==========================================
// 2. 欧州強豪クラブデータベース（五大リーグ＋欧州強豪 80クラブ）
// ==========================================
const EUROPEAN_CLUBS_DATABASE = {
  SPAIN: [
    { id: 'es01', name: 'マドリード・ブランコ', shortName: 'MBL', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#41748D', pattern: 'sash-diagonal', shape: 'shield', basePower: 88 },
    { id: 'es02', name: 'バルセロナ・ブラウグラナ', shortName: 'BBL', country: 'ESP', primaryColor: '#A50044', secondaryColor: '#004D98', pattern: 'stripes-vertical', shape: 'shield', basePower: 87 },
    { id: 'es03', name: 'アトレティコ・ロホ', shortName: 'ARO', country: 'ESP', primaryColor: '#CB3524', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 84 },
    { id: 'es04', name: 'セビージャ・ブランコ', shortName: 'SBL', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#D4001F', pattern: 'split-vertical', shape: 'shield', basePower: 81 },
    { id: 'es05', name: 'バレンシア・チェ', shortName: 'VCH', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#EE7402', pattern: 'halves-vertical', shape: 'circle', basePower: 79 },
    { id: 'es06', name: 'ビジャレアル・アマリージョ', shortName: 'VAM', country: 'ESP', primaryColor: '#F3B200', secondaryColor: '#003366', pattern: 'circle-center', shape: 'shield', basePower: 80 },
    { id: 'es07', name: 'レアル・サン・セバスティアン', shortName: 'RSS', country: 'ESP', primaryColor: '#0047AB', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 81 },
    { id: 'es08', name: 'ビルバオ・レオン', shortName: 'BLE', country: 'ESP', primaryColor: '#ED1C24', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
    { id: 'es09', name: 'ベティス・ベルディ', shortName: 'BVE', country: 'ESP', primaryColor: '#0BB364', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
    { id: 'es10', name: 'ジローナ・ロジ', shortName: 'GRO', country: 'ESP', primaryColor: '#D31411', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 77 }
  ],
  GERMANY: [
    { id: 'de01', name: 'バイエルン・ロート', shortName: 'BRO', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#0066B2', pattern: 'quarters', shape: 'circle', basePower: 88 },
    { id: 'de02', name: 'ドルトムント・ゲルプ', shortName: 'DGE', country: 'GER', primaryColor: '#FDE100', secondaryColor: '#121212', pattern: 'stripes-vertical', shape: 'circle', basePower: 85 },
    { id: 'de03', name: 'レバークーゼン・ヴェルク', shortName: 'LWE', country: 'GER', primaryColor: '#E32221', secondaryColor: '#121212', pattern: 'sash-diagonal', shape: 'shield', basePower: 86 },
    { id: 'de04', name: 'ライプツィヒ・ブルズ', shortName: 'LBU', country: 'GER', primaryColor: '#ED1B24', secondaryColor: '#002B49', pattern: 'chevron-down', shape: 'shield', basePower: 83 },
    { id: 'de05', name: 'フランクフルト・アドラー', shortName: 'FAD', country: 'GER', primaryColor: '#E1000F', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'circle', basePower: 80 },
    { id: 'de06', name: 'シュトゥットガルト・クロイツ', shortName: 'SKR', country: 'GER', primaryColor: '#FFFFFF', secondaryColor: '#E32219', pattern: 'stripes-horizontal', shape: 'shield', basePower: 80 },
    { id: 'de07', name: 'ボルシア・メンヒェン', shortName: 'BMG', country: 'GER', primaryColor: '#000000', secondaryColor: '#009F4D', pattern: 'split-vertical', shape: 'diamond', basePower: 77 },
    { id: 'de08', name: 'ヴォルフスブルク・グリューン', shortName: 'WGR', country: 'GER', primaryColor: '#65B32E', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 77 },
    { id: 'de09', name: 'ブレーメン・ヴェルダー', shortName: 'BWE', country: 'GER', primaryColor: '#1C7C44', secondaryColor: '#FFFFFF', pattern: 'diamond', shape: 'diamond', basePower: 76 },
    { id: 'de10', name: 'フライブルク・フォルクス', shortName: 'FVO', country: 'GER', primaryColor: '#000000', secondaryColor: '#E2001A', pattern: 'halves-vertical', shape: 'shield', basePower: 76 }
  ],
  ITALY: [
    { id: 'it01', name: 'ミラノ・ネラッズーリ', shortName: 'MNE', country: 'ITA', primaryColor: '#0066B2', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'circle', basePower: 86 },
    { id: 'it02', name: 'ミラノ・ロッソネーリ', shortName: 'MRO', country: 'ITA', primaryColor: '#FB090B', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 85 },
    { id: 'it03', name: 'トリノ・ビアンコネーロ', shortName: 'TBI', country: 'ITA', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 84 },
    { id: 'it04', name: 'ナポリ・アズーロ', shortName: 'NAZ', country: 'ITA', primaryColor: '#008FD7', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 83 },
    { id: 'it05', name: 'ローマ・ジャッロロッソ', shortName: 'RGI', country: 'ITA', primaryColor: '#8E1F2F', secondaryColor: '#F0BC42', pattern: 'halves-vertical', shape: 'shield', basePower: 81 },
    { id: 'it06', name: 'ラツィオ・ビアンコチェレステ', shortName: 'LBC', country: 'ITA', primaryColor: '#87D8F7', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 80 },
    { id: 'it07', name: 'アタランタ・ベルガモ', shortName: 'ABE', country: 'ITA', primaryColor: '#1E71B8', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 82 },
    { id: 'it08', name: 'フィレンツェ・ヴィオラ', shortName: 'FVI', country: 'ITA', primaryColor: '#4F2382', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'diamond', basePower: 79 },
    { id: 'it09', name: 'ボローニャ・ロッソブルー', shortName: 'BRO', country: 'ITA', primaryColor: '#1B2C4B', secondaryColor: '#9C1B2C', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
    { id: 'it10', name: 'トリノ・グランタ', shortName: 'TGR', country: 'ITA', primaryColor: '#7A1C20', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 76 }
  ],
  FRANCE: [
    { id: 'fr01', name: 'パリ・ルージュエブルー', shortName: 'PRB', country: 'FRA', primaryColor: '#002B49', secondaryColor: '#DA291C', pattern: 'stripes-vertical', shape: 'circle', basePower: 87 },
    { id: 'fr02', name: 'マルセイユ・シエル', shortName: 'MCI', country: 'FRA', primaryColor: '#00A3E0', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 82 },
    { id: 'fr03', name: 'モナコ・プリンス', shortName: 'MPR', country: 'FRA', primaryColor: '#E2001A', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 82 },
    { id: 'fr04', name: 'リヨン・オランピック', shortName: 'LOL', country: 'FRA', primaryColor: '#FFFFFF', secondaryColor: '#17366E', pattern: 'split-vertical', shape: 'shield', basePower: 80 },
    { id: 'fr05', name: 'リール・ドグ', shortName: 'LDO', country: 'FRA', primaryColor: '#E01E2E', secondaryColor: '#1D253C', pattern: 'chevron-down', shape: 'shield', basePower: 80 },
    { id: 'fr06', name: 'レンヌ・ルージュ', shortName: 'RRU', country: 'FRA', primaryColor: '#E30613', secondaryColor: '#000000', pattern: 'halves-vertical', shape: 'circle', basePower: 79 },
    { id: 'fr07', name: 'ニース・アイグロン', shortName: 'NAI', country: 'FRA', primaryColor: '#DA291C', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
    { id: 'fr08', name: 'ランス・シャンパーニュ', shortName: 'RCH', country: 'FRA', primaryColor: '#D50032', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 77 },
    { id: 'fr09', name: 'トゥールーズ・ヴィオレ', shortName: 'TVI', country: 'FRA', primaryColor: '#53284F', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'diamond', basePower: 76 },
    { id: 'fr10', name: 'ストラスブール・アルザス', shortName: 'SAL', country: 'FRA', primaryColor: '#00539F', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 76 }
  ],
  OTHER_EUROPE: [
    { id: 'oe01', name: 'アムステルダム・赤白', shortName: 'AMS', country: 'NED', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'circle', basePower: 83 },
    { id: 'oe02', name: 'アイントホーフェン・電球', shortName: 'EIN', country: 'NED', primaryColor: '#ED1B24', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 82 },
    { id: 'oe03', name: 'フェイエノールト・港湾', shortName: 'FEY', country: 'NED', primaryColor: '#ED1B24', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 80 },
    { id: 'oe04', name: 'リスボン・ライオン', shortName: 'LIS', country: 'POR', primaryColor: '#006633', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 84 },
    { id: 'oe05', name: 'リスボン・イーグルス', shortName: 'BEN', country: 'POR', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 83 },
    { id: 'oe06', name: 'ポルト・ドラゴンズ', shortName: 'POR', country: 'POR', primaryColor: '#003399', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 82 },
    { id: 'oe07', name: 'ブラガ・大司教', shortName: 'BRA', country: 'POR', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 78 },
    { id: 'oe08', name: 'セルティック・グリーン', shortName: 'CEL', country: 'SCO', primaryColor: '#018749', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'circle', basePower: 80 },
    { id: 'oe09', name: 'グラスゴー・ロイヤル', shortName: 'RAN', country: 'SCO', primaryColor: '#003399', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 79 },
    { id: 'oe10', name: 'ブルッヘ・青黒', shortName: 'BRU', country: 'BEL', primaryColor: '#003399', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
    { id: 'oe11', name: 'アンデルレヒト・紫', shortName: 'AND', country: 'BEL', primaryColor: '#4F2382', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'shield', basePower: 77 },
    { id: 'oe12', name: 'ザルツブルク・雄牛', shortName: 'SAL', country: 'AUT', primaryColor: '#ED1B24', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'circle', basePower: 79 },
    { id: 'oe13', name: 'シュトゥルム・グラーツ', shortName: 'STU', country: 'AUT', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 76 },
    { id: 'oe14', name: 'シャフタール・鉱夫', shortName: 'SHA', country: 'UKR', primaryColor: '#F36F21', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
    { id: 'oe15', name: 'キエフ・ディナモ', shortName: 'DKI', country: 'UKR', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'diamond', shape: 'diamond', basePower: 77 },
    { id: 'oe16', name: 'ガラタサライ・獅子', shortName: 'GAL', country: 'TUR', primaryColor: '#A32638', secondaryColor: '#FDB913', pattern: 'split-vertical', shape: 'shield', basePower: 81 },
    { id: 'oe17', name: 'フェネルバフチェ・カナリア', shortName: 'FEN', country: 'TUR', primaryColor: '#002B49', secondaryColor: '#FFF200', pattern: 'stripes-vertical', shape: 'circle', basePower: 80 },
    { id: 'oe18', name: 'ベシクタシュ・黒鷲', shortName: 'BES', country: 'TUR', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 78 },
    { id: 'oe19', name: 'オリンピアコス・赤白', shortName: 'OLY', country: 'GRE', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 78 },
    { id: 'oe20', name: 'パナシナイコス・緑', shortName: 'PAN', country: 'GRE', primaryColor: '#007A3D', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 77 },
    { id: 'oe21', name: 'プラハ・鉄の誇り', shortName: 'SPA', country: 'CZE', primaryColor: '#800000', secondaryColor: '#FDB913', pattern: 'sash-diagonal', shape: 'shield', basePower: 78 },
    { id: 'oe22', name: 'スラヴィア・星', shortName: 'SLA', country: 'CZE', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 77 },
    { id: 'oe23', name: 'ヤングボーイズ・黄黒', shortName: 'YBO', country: 'SUI', primaryColor: '#FFCC00', secondaryColor: '#000000', pattern: 'stripes-horizontal', shape: 'circle', basePower: 77 },
    { id: 'oe24', name: 'バーゼル・ロートブラウ', shortName: 'BAS', country: 'SUI', primaryColor: '#D2122E', secondaryColor: '#003399', pattern: 'split-vertical', shape: 'shield', basePower: 76 },
    { id: 'oe25', name: 'コペンハーゲン・獅子', shortName: 'COP', country: 'DEN', primaryColor: '#FFFFFF', secondaryColor: '#003399', pattern: 'circle-center', shape: 'circle', basePower: 77 },
    { id: 'oe26', name: 'ボデ・グリプト', shortName: 'BOD', country: 'NOR', primaryColor: '#FFD700', secondaryColor: '#000000', pattern: 'halves-horizontal', shape: 'shield', basePower: 76 },
    { id: 'oe27', name: 'ディナモ・ザグレブ', shortName: 'ZAG', country: 'CRO', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'quarters', shape: 'shield', basePower: 78 },
    { id: 'oe28', name: 'ツルヴェナ・ズヴェズダ', shortName: 'CRV', country: 'SRB', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 77 }
  ]
};

// ==========================================
// 3. 高速ダイジェスト試合エンジン（simQuickMatch）
// ==========================================
function simQuickMatch(homeClub, awayClub) {
  const getPower = (c) => {
    if (c.basePower) return c.basePower;
    if (typeof calcClubOvr === 'function') {
      const ovr = calcClubOvr(c);
      if (ovr > 0) return ovr;
    }
    if (c.targetRank) return 85 - (c.targetRank * 1.5);
    return 75;
  };

  const hp = getPower(homeClub) + 2.5;
  const ap = getPower(awayClub);
  const diff = hp - ap;

  let homeExp = 1.45 + (diff * 0.08);
  let awayExp = 1.15 - (diff * 0.08);
  homeExp = Math.max(0.2, Math.min(4.5, homeExp));
  awayExp = Math.max(0.2, Math.min(4.0, awayExp));

  const genGoals = (lambda) => {
    let k = 0;
    let p = Math.exp(-lambda);
    let s = p;
    const u = Math.random();
    while (u > s && k < 8) {
      k++;
      p *= lambda / k;
      s += p;
    }
    return k;
  };

  let homeScore = genGoals(homeExp);
  let awayScore = genGoals(awayExp);
  return { homeScore, awayScore };
}

function simKnockoutMatch(homeClub, awayClub) {
  const result = simQuickMatch(homeClub, awayClub);
  let { homeScore, awayScore } = result;
  let pkHome = null;
  let pkAway = null;
  let winner = null;

  if (homeScore > awayScore) {
    winner = homeClub;
  } else if (awayScore > homeScore) {
    winner = awayClub;
  } else {
    const hOvr = homeClub.basePower || 75;
    const aOvr = awayClub.basePower || 75;
    const hChance = 0.5 + (hOvr - aOvr) * 0.01;
    if (Math.random() < hChance) {
      winner = homeClub;
      pkHome = 5;
      pkAway = 4;
    } else {
      winner = awayClub;
      pkHome = 4;
      pkAway = 5;
    }
  }

  return {
    homeScore,
    awayScore,
    pkHome,
    pkAway,
    winnerId: winner.id,
    winnerClub: winner
  };
}

// ==========================================
// 4. コンペティション初期化
// ==========================================
function initSeasonCompetitions() {
  if (!gameState.competitions) {
    gameState.competitions = {};
  }
  initChampionshipLeague();
  initDomesticCups();
  initEuropeanCups();
  injectCupMatchesIntoCalendar();
}

function initChampionshipLeague() {
  if (!gameState.competitions.championship) {
    gameState.competitions.championship = {
      name: '2部リーグ（チャンピオンシップ）',
      shortName: 'チャンピオンシップ',
      clubs: CHAMPIONSHIP_CLUBS_DEFINITIONS.map(c => ({
        ...c,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      }))
    };
  } else {
    gameState.competitions.championship.clubs.forEach(c => {
      c.played = 0;
      c.won = 0;
      c.drawn = 0;
      c.lost = 0;
      c.gf = 0;
      c.ga = 0;
      c.gd = 0;
      c.pts = 0;
    });
  }
}

function advanceChampionshipWeek() {
  const comp = gameState.competitions && gameState.competitions.championship;
  if (!comp || !comp.clubs) return;

  const clubs = [...comp.clubs];
  for (let i = clubs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clubs[i], clubs[j]] = [clubs[j], clubs[i]];
  }

  for (let i = 0; i < clubs.length; i += 2) {
    const h = clubs[i];
    const a = clubs[i + 1];
    const res = simQuickMatch(h, a);
    h.played++;
    a.played++;
    h.gf += res.homeScore;
    h.ga += res.awayScore;
    a.gf += res.awayScore;
    a.ga += res.homeScore;
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;

    if (res.homeScore > res.awayScore) {
      h.won++;
      h.pts += 3;
      a.lost++;
    } else if (res.homeScore < res.awayScore) {
      a.won++;
      a.pts += 3;
      h.lost++;
    } else {
      h.drawn++;
      a.drawn++;
      h.pts += 1;
      a.pts += 1;
    }
  }
}

function generateKnockoutRound(clubs) {
  const pool = [...clubs];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const matches = [];
  for (let i = 0; i < pool.length; i += 2) {
    if (pool[i] && pool[i + 1]) {
      matches.push({
        homeId: pool[i].id,
        awayId: pool[i + 1].id,
        homeClub: pool[i],
        awayClub: pool[i + 1],
        homeScore: null,
        awayScore: null,
        pkHome: null,
        pkAway: null,
        winnerId: null,
        played: false
      });
    }
  }
  return matches;
}

function initDomesticCups() {
  const p1Clubs = gameState.clubs || [];
  const p2Clubs = (gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS;

  const lgcParticipants = [...p1Clubs, ...p2Clubs.slice(0, 12)];
  gameState.competitions.leagueCup = {
    name: 'リーグカップ',
    enName: 'LEAGUE CUP',
    shortCode: 'LGC',
    currentRoundKey: 'R32',
    rounds: {
      R32: generateKnockoutRound(lgcParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 10000
  };

  const natParticipants = [...p1Clubs, ...p2Clubs.slice(12, 24)];
  gameState.competitions.nationalCup = {
    name: 'ナショナルカップ',
    enName: 'NATIONAL CUP',
    shortCode: 'NAT',
    currentRoundKey: 'R32',
    rounds: {
      R32: generateKnockoutRound(natParticipants),
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney: 15000
  };
}

// 欧州各大会（CL, EL, ECL）の36チーム ＆ 8試合リーグフェーズ初期化
function createEuroCompObject(name, enName, shortCode, participants, prizeMoney) {
  // 36チームを各クラブ初期化
  const clubs = participants.slice(0, 36).map(c => ({
    ...c,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0
  }));

  // 全8節（Matchday 1〜8）の対戦スケジュールをスイスドロー風に事前生成
  // 各節18試合 × 8節 ＝ 144試合
  const leagueSchedule = [];
  for (let round = 1; round <= 8; round++) {
    const shuffled = [...clubs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push({
        homeId: shuffled[i].id,
        awayId: shuffled[i + 1].id,
        homeClub: shuffled[i],
        awayClub: shuffled[i + 1],
        homeScore: null,
        awayScore: null,
        played: false
      });
    }
    leagueSchedule.push(matches);
  }

  return {
    name,
    enName,
    shortCode,
    phase: 'LEAGUE', // 'LEAGUE' -> 'KNOCKOUT'
    currentMatchweek: 0, // 0 〜 8
    participants: clubs,
    leagueSchedule,
    rounds: {
      R16: [],
      QF: [],
      SF: [],
      FINAL: []
    },
    winner: null,
    prizeMoney
  };
}

function initEuropeanCups() {
  const allEuroClubs = Object.values(EUROPEAN_CLUBS_DATABASE).flat();
  const premClubs = [...(gameState.clubs || [])].sort((a, b) => (b.pts || 0) - (a.pts || 0));

  // CL (36チーム): プレミア上位4 + 欧州最高峰32
  const clPrem = premClubs.slice(0, 4);
  const clEuroPool = allEuroClubs.filter(c => c.basePower >= 81);
  const clForeign = [...clEuroPool];
  while (clForeign.length < 32) {
    clForeign.push(allEuroClubs[clForeign.length % allEuroClubs.length]);
  }
  const cl36 = [...clPrem, ...clForeign.slice(0, 32)];

  // EL (36チーム): プレミア5位・カップ枠 + 欧州強豪
  const elPrem = premClubs.slice(4, 6);
  const elEuroPool = allEuroClubs.filter(c => c.basePower >= 78 && c.basePower < 82);
  const elForeign = [...elEuroPool];
  while (elForeign.length < 34) {
    elForeign.push(allEuroClubs[(elForeign.length + 15) % allEuroClubs.length]);
  }
  const el36 = [...elPrem, ...elForeign.slice(0, 34)];

  // ECL (36チーム): プレミア6〜7位 + 欧州中堅・実力派
  const eclPrem = premClubs.slice(6, 8);
  const eclEuroPool = allEuroClubs.filter(c => c.basePower < 79);
  const eclForeign = [...eclEuroPool];
  while (eclForeign.length < 34) {
    eclForeign.push(allEuroClubs[(eclForeign.length + 30) % allEuroClubs.length]);
  }
  const ecl36 = [...eclPrem, ...eclForeign.slice(0, 34)];

  gameState.competitions.championsCup = createEuroCompObject('チャンピオンズリーグ', 'CHAMPIONS LEAGUE', 'CL', cl36, 30000);
  gameState.competitions.europaCup = createEuroCompObject('ヨーロッパリーグ', 'EUROPA LEAGUE', 'EL', el36, 18000);
  gameState.competitions.conferenceCup = createEuroCompObject('カンファレンスリーグ', 'CONFERENCE LEAGUE', 'ECL', ecl36, 10000);
}

// カレンダーにカップ戦＆欧州戦（全8試合リーグフェーズ＋決勝T）日程をマッピング
function injectCupMatchesIntoCalendar() {
  if (!gameState.calendar || gameState.calendar.length === 0) return;

  // 現実準拠の全8試合リーグフェーズ日程（9月〜1月下旬）
  // 9月(火/水): 欧州MD1 & リーグ杯R32
  // 10月(火/水): 欧州MD2 & 欧州MD3 & リーグ杯R16
  // 11月(火/水): 欧州MD4 & 欧州MD5
  // 12月(火/水): 欧州MD6 & リーグ杯QF
  // 1月(火/水): 欧州MD7 & 欧州MD8 & ナショナル杯R32
  // 2月(火/水): リーグ杯FINAL
  // 3月(火/水): 欧州R16 & ナショナル杯R16
  // 4月(火/水): 欧州QF & ナショナル杯QF
  // 5月(火/水): 欧州SF/FINAL & ナショナル杯FINAL

  const scheduleMap = [
    // リーグ杯 / ナショナル杯
    { month: 9, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'R32', label: 'リーグ杯 2回戦' },
    { month: 10, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'R16', label: 'リーグ杯 3回戦' },
    { month: 12, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'QF', label: 'リーグ杯 準々決勝' },
    { month: 1, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'R32', label: 'ナショナル杯 2回戦' },
    { month: 2, dayOfWeek: 3, compType: 'leagueCup', roundKey: 'FINAL', label: 'リーグ杯 決勝' },
    { month: 3, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'R16', label: 'ナショナル杯 3回戦' },
    { month: 4, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'QF', label: 'ナショナル杯 準々決勝' },
    { month: 5, dayOfWeek: 3, compType: 'nationalCup', roundKey: 'FINAL', label: 'ナショナル杯 決勝' },

    // 欧州コンペ：全8試合リーグフェーズ (MD1〜MD8)
    { month: 9, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 1, label: '欧州リーグ MD1' },
    { month: 10, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 2, label: '欧州リーグ MD2' },
    { month: 10, dayOfWeek: 4, compType: 'euroLeaguePhase', md: 3, label: '欧州リーグ MD3' },
    { month: 11, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 4, label: '欧州リーグ MD4' },
    { month: 11, dayOfWeek: 4, compType: 'euroLeaguePhase', md: 5, label: '欧州リーグ MD5' },
    { month: 12, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 6, label: '欧州リーグ MD6' },
    { month: 1, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 7, label: '欧州リーグ MD7' },
    { month: 1, dayOfWeek: 4, compType: 'euroLeaguePhase', md: 8, label: '欧州リーグ MD8' },

    // 欧州コンペ：決勝トーナメント
    { month: 3, dayOfWeek: 2, compType: 'championsCup', roundKey: 'R16', label: '欧州CL 決勝T 1回戦' },
    { month: 4, dayOfWeek: 2, compType: 'championsCup', roundKey: 'QF', label: '欧州CL 準々決勝' },
    { month: 5, dayOfWeek: 2, compType: 'championsCup', roundKey: 'FINAL', label: '欧州CL 決勝' }
  ];

  scheduleMap.forEach(sc => {
    const day = gameState.calendar.find(d => d.month === sc.month && d.dayOfWeek === sc.dayOfWeek && !d.isMatchDay);
    if (day) {
      day.isCupMatchDay = true;
      day.cupCompType = sc.compType;
      day.cupRoundKey = sc.roundKey || null;
      day.euroMd = sc.md || null;
      day.cupLabel = sc.label;

      if (sc.compType === 'euroLeaguePhase') {
        day.cupCode = 'EURO';
      } else {
        const comp = gameState.competitions && gameState.competitions[sc.compType];
        if (comp) day.cupCode = comp.shortCode;
      }
    }
  });
}

// ==========================================
// 5. 欧州リーグフェーズ（MD1〜MD8）の進行処理
// ==========================================
function advanceEuroLeaguePhase(md) {
  const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  let playerMatch = null;
  let playerComp = null;

  euroKeys.forEach(ek => {
    const comp = gameState.competitions && gameState.competitions[ek];
    if (!comp || !comp.leagueSchedule) return;

    const roundMatches = comp.leagueSchedule[md - 1];
    if (!roundMatches) return;

    comp.currentMatchweek = md;

    roundMatches.forEach(m => {
      if (m.played) return;

      const isHomePlayer = (playerClub && m.homeId === playerClub.id);
      const isAwayPlayer = (playerClub && m.awayId === playerClub.id);

      if (isHomePlayer || isAwayPlayer) {
        playerMatch = m;
        playerComp = comp;
      } else {
        // 他クラブ対戦は高速ダイジェスト計算
        const res = simQuickMatch(m.homeClub, m.awayClub);
        m.homeScore = res.homeScore;
        m.awayScore = res.awayScore;
        m.played = true;

        const h = comp.participants.find(c => c.id === m.homeId);
        const a = comp.participants.find(c => c.id === m.awayId);
        if (h && a) {
          h.played++;
          a.played++;
          h.gf += res.homeScore;
          h.ga += res.awayScore;
          a.gf += res.awayScore;
          a.ga += res.homeScore;
          h.gd = h.gf - h.ga;
          a.gd = a.gf - a.ga;

          if (res.homeScore > res.awayScore) {
            h.won++;
            h.pts += 3;
            a.lost++;
          } else if (res.homeScore < res.awayScore) {
            a.won++;
            a.pts += 3;
            h.lost++;
          } else {
            h.drawn++;
            a.drawn++;
            h.pts += 1;
            a.pts += 1;
          }
        }
      }
    });

    // 8節終了時に決勝トーナメント（上位16チーム）を生成
    if (md === 8) {
      finalizeEuroLeaguePhaseToKnockout(comp);
    }
  });

  return { playerMatch, playerComp };
}

// リーグフェーズ8節終了後、上位16チームで決勝トーナメント生成
function finalizeEuroLeaguePhaseToKnockout(comp) {
  if (comp.phase === 'KNOCKOUT') return;
  comp.phase = 'KNOCKOUT';

  const sorted = [...comp.participants].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const top16 = sorted.slice(0, 16);
  comp.rounds.R16 = generateKnockoutRound(top16);
}

// 国内カップ戦の進行
function processCupMatchDay(compType, roundKey) {
  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp || !comp.rounds || !comp.rounds[roundKey]) return null;

  const matches = comp.rounds[roundKey];
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : gameState.clubs.find(c => c.isPlayer);
  const pId = playerClub ? playerClub.id : null;

  let playerMatch = null;
  const winners = [];

  matches.forEach(m => {
    if (m.played) {
      if (m.winnerClub) winners.push(m.winnerClub);
      return;
    }

    const isHomePlayer = (m.homeId === pId);
    const isAwayPlayer = (m.awayId === pId);

    if (isHomePlayer || isAwayPlayer) {
      playerMatch = m;
    } else {
      const res = simKnockoutMatch(m.homeClub, m.awayClub);
      m.homeScore = res.homeScore;
      m.awayScore = res.awayScore;
      m.pkHome = res.pkHome;
      m.pkAway = res.pkAway;
      m.winnerId = res.winnerId;
      m.winnerClub = res.winnerClub;
      m.played = true;
      winners.push(res.winnerClub);
    }
  });

  return { comp, matches, playerMatch, winners };
}

const ROUND_NEXT_KEYS = {
  R32: 'R16',
  R16: 'QF',
  QF: 'SF',
  SF: 'FINAL'
};

function finalizeCupMatch(compType, roundKey, match, userWon, homeScore, awayScore, pkHome = null, pkAway = null) {
  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp) return;

  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.pkHome = pkHome;
  match.pkAway = pkAway;
  match.played = true;
  match.winnerId = userWon ? match.homeId : match.awayId;
  match.winnerClub = userWon ? match.homeClub : match.awayClub;

  const matches = comp.rounds[roundKey];
  const winners = matches.map(m => m.winnerClub).filter(Boolean);

  const nextKey = ROUND_NEXT_KEYS[roundKey];
  if (nextKey) {
    if (!comp.rounds[nextKey] || comp.rounds[nextKey].length === 0) {
      comp.rounds[nextKey] = generateKnockoutRound(winners);
    }
  } else if (roundKey === 'FINAL') {
    comp.winner = match.winnerClub;
    if (userWon) {
      gameState.budget = (gameState.budget || 0) + comp.prizeMoney;
      if (typeof addDailyLog === 'function') {
        addDailyLog(`🏆【祝！${comp.name} 優勝】賞金 £${(comp.prizeMoney / 1000).toFixed(1)}M を獲得しました！`);
      }
    }
  }
}

// 過密日程判定
function checkScheduleCongestion() {
  if (!gameState.calendar || gameState.currentDayIndex == null) {
    return { isCongested: false, staminaMultiplier: 1.0, injuryChanceMultiplier: 1.0 };
  }

  const curIdx = gameState.currentDayIndex;
  let matchCountNear = 0;
  for (let i = Math.max(0, curIdx - 4); i <= Math.min(gameState.calendar.length - 1, curIdx + 3); i++) {
    const d = gameState.calendar[i];
    if (d && (d.isMatchDay || d.isCupMatchDay)) {
      matchCountNear++;
    }
  }

  const isCongested = (matchCountNear >= 2);
  return {
    isCongested,
    staminaMultiplier: isCongested ? 1.25 : 1.0,
    injuryChanceMultiplier: isCongested ? 1.20 : 1.0
  };
}

// 昇降格処理
function processPromotionAndRelegation() {
  const p1Sorted = typeof getSortedStandings === 'function' ? getSortedStandings() : [...gameState.clubs].sort((a,b) => (b.pts||0) - (a.pts||0));
  const p2Sorted = [...((gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS)]
    .sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  const relegatedClubs = p1Sorted.slice(Math.max(0, p1Sorted.length - 3));
  const promotedClubs = p2Sorted.slice(0, 3);

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : gameState.clubs.find(c => c.isPlayer);
  const isPlayerRelegated = relegatedClubs.some(c => c.id === playerClub.id);

  const relegatedIds = new Set(relegatedClubs.map(c => c.id));
  const newP1Clubs = p1Sorted.filter(c => !relegatedIds.has(c.id));

  promotedClubs.forEach(pc => {
    if (!pc.players || pc.players.length === 0) {
      if (typeof ALL_POSITIONS !== 'undefined' && typeof createPlayer === 'function') {
        const usedNames = new Set();
        pc.players = ALL_POSITIONS.map(pos => createPlayer(pos, pc.id, usedNames));
        if (typeof ensureValidSquadAndStarters === 'function') {
          ensureValidSquadAndStarters(pc);
        }
      }
    }
    pc.tier = 'PROMOTED';
    pc.targetRank = 17;
    pc.targetLabel = '17位以内（残留）';
    newP1Clubs.push(pc);
  });

  const promotedIds = new Set(promotedClubs.map(c => c.id));
  const newP2Clubs = p2Sorted.filter(c => !promotedIds.has(c.id));
  relegatedClubs.forEach(rc => {
    rc.tier = 'RELEGATED';
    rc.targetRank = 1;
    rc.targetLabel = '1年での1部復帰';
    newP2Clubs.push(rc);
  });

  gameState.clubs = newP1Clubs;
  if (!gameState.competitions) gameState.competitions = {};
  if (!gameState.competitions.championship) gameState.competitions.championship = {};
  gameState.competitions.championship.clubs = newP2Clubs;

  const result = {
    relegated: relegatedClubs.map(c => c.name),
    promoted: promotedClubs.map(c => c.name),
    isPlayerRelegated
  };

  gameState.lastPromotionRelegation = result;
  return result;
}

// ==========================================
// 6. UI描画ヘルパー
// ==========================================

// 2部リーグ順位表（プレミアリーグと全く同じ構造・表示、昇格圏/降格圏の文字表示は撤廃）
function renderChampionshipStandingsHtml() {
  const comp = gameState.competitions && gameState.competitions.championship;
  if (!comp || !comp.clubs) return '<p class="empty-state">2部リーグデータがありません</p>';

  const sorted = [...comp.clubs].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  let html = `
    <table class="data-table standings-table">
      <thead>
        <tr>
          <th class="col-rank"><span class="th-pc">順位</span><span class="th-mob">#</span></th>
          <th class="col-team"><span class="th-pc">クラブ名</span><span class="th-mob">チーム</span></th>
          <th class="col-num col-played">試合</th>
          <th class="col-num col-won">勝</th>
          <th class="col-num col-drawn">分</th>
          <th class="col-num col-lost"><span class="th-pc">敗</span><span class="th-mob">負</span></th>
          <th class="col-num col-gf"><span class="th-pc">得点</span><span class="th-mob">+/-</span></th>
          <th class="col-num col-ga">失点</th>
          <th class="col-num col-gd"><span class="th-pc">得失点</span><span class="th-mob">差</span></th>
          <th class="col-pts"><span class="th-pc">勝点</span><span class="th-mob">点</span></th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach((c, idx) => {
    const rank = idx + 1;
    const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
    const gdSign = c.gd > 0 ? `+${c.gd}` : `${c.gd || 0}`;
    const emblemSvg = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(c, 20, 'standings-emblem') : '';

    html += `
      <tr>
        <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span></td>
        <td class="col-team"><span class="team-cell-wrap">${emblemSvg}<span class="team-name-text">${c.name}</span></span></td>
        <td class="col-num col-played">${c.played || 0}</td>
        <td class="col-num col-won">${c.won || 0}</td>
        <td class="col-num col-drawn">${c.drawn || 0}</td>
        <td class="col-num col-lost">${c.lost || 0}</td>
        <td class="col-num col-gf"><span class="td-pc">${c.gf || 0}</span><span class="td-mob">${c.gf || 0}-${c.ga || 0}</span></td>
        <td class="col-num col-ga">${c.ga || 0}</td>
        <td class="col-num col-gd">${gdSign}</td>
        <td class="col-pts">${c.pts || 0}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

// 欧州コンペ：全36チーム リーグフェーズ順位表描画
function renderEuroLeaguePhaseStandingsHtml(compKey) {
  const comp = gameState.competitions && gameState.competitions[compKey];
  if (!comp || !comp.participants) return '<p class="empty-state">欧州コンペデータがありません</p>';

  const sorted = [...comp.participants].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  let html = `
    <div class="euro-league-header">
      <div class="euro-league-badge-title">
        <span class="euro-badge-code mono">${comp.shortCode}</span>
        <span class="euro-badge-name">${comp.name} リーグフェーズ (全36チーム / 各8試合)</span>
      </div>
      <span class="euro-md-status mono">MATCHWEEK ${comp.currentMatchweek || 0} / 8</span>
    </div>
    <table class="data-table standings-table euro-standings-table">
      <thead>
        <tr>
          <th class="col-rank"><span class="th-pc">順位</span><span class="th-mob">#</span></th>
          <th class="col-team"><span class="th-pc">クラブ名</span><span class="th-mob">チーム</span></th>
          <th class="col-num col-played">試合</th>
          <th class="col-num col-won">勝</th>
          <th class="col-num col-drawn">分</th>
          <th class="col-num col-lost"><span class="th-pc">敗</span><span class="th-mob">負</span></th>
          <th class="col-num col-gf"><span class="th-pc">得点</span><span class="th-mob">+/-</span></th>
          <th class="col-num col-ga">失点</th>
          <th class="col-num col-gd"><span class="th-pc">得失点</span><span class="th-mob">差</span></th>
          <th class="col-pts"><span class="th-pc">勝点</span><span class="th-mob">点</span></th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach((c, idx) => {
    const rank = idx + 1;
    const rankBadgeClass = rank === 1 ? 'rank-badge rank-1' : 'rank-badge';
    const gdSign = c.gd > 0 ? `+${c.gd}` : `${c.gd || 0}`;
    const emblemSvg = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(c, 20, 'standings-emblem') : '';

    let zoneClass = '';
    let zoneTag = '';
    if (rank <= 8) {
      zoneClass = 'zone-ucl';
      zoneTag = '<span class="standings-zone-tag zone-tag-cl">ベスト16直行</span>';
    } else if (rank <= 16) {
      zoneClass = 'zone-uel';
      zoneTag = '<span class="standings-zone-tag zone-tag-el">プレーオフ圏</span>';
    }

    html += `
      <tr class="${zoneClass}">
        <td class="col-rank"><span class="${rankBadgeClass}">${rank}</span>${zoneTag}</td>
        <td class="col-team"><span class="team-cell-wrap">${emblemSvg}<span class="team-name-text">${c.name}</span></span></td>
        <td class="col-num col-played">${c.played || 0}</td>
        <td class="col-num col-won">${c.won || 0}</td>
        <td class="col-num col-drawn">${c.drawn || 0}</td>
        <td class="col-num col-lost">${c.lost || 0}</td>
        <td class="col-num col-gf"><span class="td-pc">${c.gf || 0}</span><span class="td-mob">${c.gf || 0}-${c.ga || 0}</span></td>
        <td class="col-num col-ga">${c.ga || 0}</td>
        <td class="col-num col-gd">${gdSign}</td>
        <td class="col-pts">${c.pts || 0}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

// トーナメントブラケット描画（国内カップ or 欧州決勝トーナメント）
function renderCupBracketHtml(compKey) {
  const comp = gameState.competitions && gameState.competitions[compKey];
  if (!comp || !comp.rounds) return '<p class="empty-state">大会データがありません</p>';

  const roundNames = {
    R32: '1回戦 / ベスト32',
    R16: '2回戦 / ベスト16',
    QF: '準々決勝',
    SF: '準決勝',
    FINAL: '決勝'
  };

  let html = `<div class="cup-bracket-container">
    <div class="cup-header-banner">
      <h3 class="cup-title">${comp.name} (${comp.enName})</h3>
      <span class="cup-prize mono">優勝賞金: £${(comp.prizeMoney / 1000).toFixed(1)}M</span>
      ${comp.winner ? `<span class="cup-winner-badge">🏆 覇者: ${comp.winner.name}</span>` : ''}
    </div>
    <div class="bracket-rounds-wrapper">
  `;

  const keys = ['R32', 'R16', 'QF', 'SF', 'FINAL'];
  keys.forEach(rk => {
    const matches = comp.rounds[rk] || [];
    if (matches.length === 0 && rk !== 'R32' && rk !== 'R16' && (!comp.rounds[keys[keys.indexOf(rk) - 1]] || comp.rounds[keys[keys.indexOf(rk) - 1]].length === 0)) {
      return;
    }

    html += `
      <div class="bracket-round-column">
        <h4 class="bracket-round-title mono">${roundNames[rk] || rk}</h4>
        <div class="bracket-matches-list">
    `;

    if (matches.length === 0) {
      html += `<div class="bracket-match-placeholder mono">対戦決定前</div>`;
    } else {
      matches.forEach(m => {
        const homeEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(m.homeClub, 18) : '';
        const awayEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(m.awayClub, 18) : '';
        const homeScoreText = m.played ? `${m.homeScore}${m.pkHome != null ? `(${m.pkHome})` : ''}` : '-';
        const awayScoreText = m.played ? `${m.awayScore}${m.pkAway != null ? `(${m.pkAway})` : ''}` : '-';
        const homeWinner = m.played && m.winnerId === m.homeId ? 'match-winner' : '';
        const awayWinner = m.played && m.winnerId === m.awayId ? 'match-winner' : '';

        html += `
          <div class="bracket-match-card ${m.played ? 'played' : 'upcoming'}">
            <div class="bracket-team-row ${homeWinner}">
              <div class="bracket-team-info">
                ${homeEmblem}
                <span class="bracket-team-name">${m.homeClub ? m.homeClub.name : 'TBD'}</span>
              </div>
              <span class="bracket-team-score mono">${homeScoreText}</span>
            </div>
            <div class="bracket-team-row ${awayWinner}">
              <div class="bracket-team-info">
                ${awayEmblem}
                <span class="bracket-team-name">${m.awayClub ? m.awayClub.name : 'TBD'}</span>
              </div>
              <span class="bracket-team-score mono">${awayScoreText}</span>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
  return html;
}

// グローバル公開
window.CHAMPIONSHIP_CLUBS_DEFINITIONS = CHAMPIONSHIP_CLUBS_DEFINITIONS;
window.EUROPEAN_CLUBS_DATABASE = EUROPEAN_CLUBS_DATABASE;
window.simQuickMatch = simQuickMatch;
window.simKnockoutMatch = simKnockoutMatch;
window.initSeasonCompetitions = initSeasonCompetitions;
window.advanceChampionshipWeek = advanceChampionshipWeek;
window.advanceEuroLeaguePhase = advanceEuroLeaguePhase;
window.processPromotionAndRelegation = processPromotionAndRelegation;
window.injectCupMatchesIntoCalendar = injectCupMatchesIntoCalendar;
window.processCupMatchDay = processCupMatchDay;
window.finalizeCupMatch = finalizeCupMatch;
window.checkScheduleCongestion = checkScheduleCongestion;
window.renderChampionshipStandingsHtml = renderChampionshipStandingsHtml;
window.renderEuroLeaguePhaseStandingsHtml = renderEuroLeaguePhaseStandingsHtml;
window.renderCupBracketHtml = renderCupBracketHtml;
