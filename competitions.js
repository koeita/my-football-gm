/**
 * competitions.js - フェーズ4: 五大リーグ120クラブ・2部昇降格・国内2大カップ・欧州3大カップ（全36チーム新スイス方式リーグフェーズ）
 */

// ==========================================
// 1. 五大リーグ・合計120クラブのデータ定義
// ==========================================

// イングランド2部（チャンピオンシップ）：24クラブ
const CHAMPIONSHIP_CLUBS_DEFINITIONS = [
  { id: 'c01', name: 'シェフィールド・S', shortName: 'SHS', city: 'シェフィールド', country: 'ENG', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 73 },
  { id: 'c02', name: 'リーズ・U', shortName: 'LEU', city: 'リーズ', country: 'ENG', primaryColor: '#FFCD00', secondaryColor: '#1D428A', pattern: 'split-vertical', shape: 'shield', basePower: 74 },
  { id: 'c03', name: 'バーンリー・C', shortName: 'BUR', city: 'バーンリー', country: 'ENG', primaryColor: '#6C1D45', secondaryColor: '#99D6EA', pattern: 'stripes-vertical', shape: 'circle', basePower: 73 },
  { id: 'c04', name: 'ノリッジ・C', shortName: 'NOR', city: 'ノリッジ', country: 'ENG', primaryColor: '#FFF200', secondaryColor: '#00A651', pattern: 'sash-diagonal', shape: 'shield', basePower: 72 },
  { id: 'c05', name: 'ワトフォード・H', shortName: 'WAT', city: 'ワトフォード', country: 'ENG', primaryColor: '#FBEE23', secondaryColor: '#ED2127', pattern: 'stripes-horizontal', shape: 'diamond', basePower: 72 },
  { id: 'c06', name: 'ミドルズブラ・B', shortName: 'MID', city: 'ミドルズブラ', country: 'ENG', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 71 },
  { id: 'c07', name: 'ウェストブロム・A', shortName: 'WBA', city: 'ウェスト・ブロムウィッチ', country: 'ENG', primaryColor: '#122F67', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 72 },
  { id: 'c08', name: 'コヴェントリー・C', shortName: 'COV', city: 'コヴェントリー', country: 'ENG', primaryColor: '#00A3E0', secondaryColor: '#1D252C', pattern: 'halves-horizontal', shape: 'circle', basePower: 70 },
  { id: 'c09', name: 'ハルダーズフィールド', shortName: 'HUD', city: 'ハダースフィールド', country: 'ENG', primaryColor: '#0E63AD', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 69 },
  { id: 'c10', name: 'プレストン・NE', shortName: 'PNE', city: 'プレストン', country: 'ENG', primaryColor: '#FFFFFF', secondaryColor: '#002B49', pattern: 'quarters', shape: 'shield', basePower: 69 },
  { id: 'c11', name: 'ブリストル・C', shortName: 'BRC', city: 'ブリストル', country: 'ENG', primaryColor: '#C8102E', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 69 },
  { id: 'c12', name: 'ストーク・C', shortName: 'STK', city: 'ストーク・オン・トレント', country: 'ENG', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 69 },
  { id: 'c13', name: 'スウォンジー・C', shortName: 'SWA', city: 'スウォンジー', country: 'ENG', primaryColor: '#121212', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 68 },
  { id: 'c14', name: 'カーディフ・C', shortName: 'CAR', city: 'カーディフ', country: 'ENG', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'circle', basePower: 68 },
  { id: 'c15', name: 'ミルウォール・L', shortName: 'MIL', city: 'ロンドン', country: 'ENG', primaryColor: '#002244', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 68 },
  { id: 'c16', name: 'ブラックバーン・R', shortName: 'BLA', city: 'ブラックバーン', country: 'ENG', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 67 },
  { id: 'c17', name: 'クイーンズパーク・R', shortName: 'QPR', city: 'ロンドン', country: 'ENG', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'diamond', basePower: 67 },
  { id: 'c18', name: 'ハル・C', shortName: 'HUL', city: 'ハル', country: 'ENG', primaryColor: '#F7941D', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 67 },
  { id: 'c19', name: 'サンダーランド・A', shortName: 'SUN', city: 'サンダーランド', country: 'ENG', primaryColor: '#EB172B', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 68 },
  { id: 'c20', name: 'プリマス・A', shortName: 'PLY', city: 'プリマス', country: 'ENG', primaryColor: '#0B3B24', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'circle', basePower: 66 },
  { id: 'c21', name: 'ロザラム・U', shortName: 'ROT', city: 'ロザラム', country: 'ENG', primaryColor: '#EE1C25', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 65 },
  { id: 'c22', name: 'バーミンガム・C', shortName: 'BIR', city: 'バーミンガム', country: 'ENG', primaryColor: '#0000FF', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 66 },
  { id: 'c23', name: 'シェフィールド・W', shortName: 'SHW', city: 'シェフィールド', country: 'ENG', primaryColor: '#002E6D', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'diamond', basePower: 65 },
  { id: 'c24', name: 'ルートン・T', shortName: 'LUT', city: 'ルートン', country: 'ENG', primaryColor: '#F68B1F', secondaryColor: '#002B49', pattern: 'chevron-down', shape: 'shield', basePower: 68 }
];

// スペイン（ラ・リーガ相当）：20クラブ
const SPAIN_CLUBS_DEFINITIONS = [
  { id: 'es01', name: 'マドリード・ブランコ', shortName: 'MBL', city: 'マドリード', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#41748D', pattern: 'sash-diagonal', shape: 'shield', basePower: 86 },
  { id: 'es02', name: 'バルセロナ・ブラウグラナ', shortName: 'BBL', city: 'バルセロナ', country: 'ESP', primaryColor: '#A50044', secondaryColor: '#004D98', pattern: 'stripes-vertical', shape: 'shield', basePower: 85 },
  { id: 'es03', name: 'アトレティコ・ロホ', shortName: 'ARO', city: 'マドリード', country: 'ESP', primaryColor: '#CB3524', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 84 },
  { id: 'es04', name: 'レアル・サン・セバスティアン', shortName: 'RSS', city: 'サン・セバスティアン', country: 'ESP', primaryColor: '#0047AB', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 81 },
  { id: 'es05', name: 'セビージャ・ブランコ', shortName: 'SBL', city: 'セビージャ', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#D4001F', pattern: 'split-vertical', shape: 'shield', basePower: 80 },
  { id: 'es06', name: 'ビジャレアル・アマリージョ', shortName: 'VAM', city: 'ビジャレアル', country: 'ESP', primaryColor: '#F3B200', secondaryColor: '#003366', pattern: 'circle-center', shape: 'shield', basePower: 80 },
  { id: 'es07', name: 'ビルバオ・レオン', shortName: 'BLE', city: 'ビルバオ', country: 'ESP', primaryColor: '#ED1C24', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
  { id: 'es08', name: 'ベティス・ベルディ', shortName: 'BVE', city: 'セビージャ', country: 'ESP', primaryColor: '#0BB364', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
  { id: 'es09', name: 'バレンシア・チェ', shortName: 'VCH', city: 'バレンシア', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#EE7402', pattern: 'halves-vertical', shape: 'circle', basePower: 78 },
  { id: 'es10', name: 'ジローナ・ロジ', shortName: 'GRO', city: 'ジローナ', country: 'ESP', primaryColor: '#D31411', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 77 },
  { id: 'es11', name: 'セルタ・ガリシア', shortName: 'CEL', city: 'ビーゴ', country: 'ESP', primaryColor: '#8AC3EE', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 75 },
  { id: 'es12', name: 'マジョルカ・イスラ', shortName: 'MLL', city: 'パルマ', country: 'ESP', primaryColor: '#E20613', secondaryColor: '#000000', pattern: 'split-vertical', shape: 'shield', basePower: 74 },
  { id: 'es13', name: 'オサスナ・ナバラ', shortName: 'OSA', city: 'パンプローナ', country: 'ESP', primaryColor: '#0A1C2A', secondaryColor: '#C4122D', pattern: 'halves-vertical', shape: 'shield', basePower: 74 },
  { id: 'es14', name: 'ヘタフェ・アズール', shortName: 'GET', city: 'ヘタフェ', country: 'ESP', primaryColor: '#00539F', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 73 },
  { id: 'es15', name: 'ラス・パルマス・カナリア', shortName: 'LPA', city: 'ラス・パルマス', country: 'ESP', primaryColor: '#FEE000', secondaryColor: '#004B9B', pattern: 'halves-horizontal', shape: 'circle', basePower: 73 },
  { id: 'es16', name: 'ラージョ・バジェカス', shortName: 'RAY', city: 'マドリード', country: 'ESP', primaryColor: '#FFFFFF', secondaryColor: '#E20613', pattern: 'sash-diagonal', shape: 'shield', basePower: 72 },
  { id: 'es17', name: 'アラベス・バスク', shortName: 'ALA', city: 'ビトリア', country: 'ESP', primaryColor: '#00539F', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 71 },
  { id: 'es18', name: 'エスパニョール・青白', shortName: 'ESP', city: 'バルセロナ', country: 'ESP', primaryColor: '#0072CE', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 72 },
  { id: 'es19', name: 'バジャドリード・紫', shortName: 'VLL', city: 'バリャドリード', country: 'ESP', primaryColor: '#53284F', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 },
  { id: 'es20', name: 'レガネス・キュウリ', shortName: 'LEG', city: 'レガネス', country: 'ESP', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 69 }
];

// イタリア（セリエA相当）：20クラブ
const ITALY_CLUBS_DEFINITIONS = [
  { id: 'it01', name: 'ミラノ・ネラッズーリ', shortName: 'MNE', city: 'ミラノ', country: 'ITA', primaryColor: '#0066B2', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'circle', basePower: 86 },
  { id: 'it02', name: 'ミラノ・ロッソネーリ', shortName: 'MRO', city: 'ミラノ', country: 'ITA', primaryColor: '#FB090B', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 85 },
  { id: 'it03', name: 'トリノ・ビアンコネーロ', shortName: 'TBI', city: 'トリノ', country: 'ITA', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 84 },
  { id: 'it04', name: 'ナポリ・アズーロ', shortName: 'NAZ', city: 'ナポリ', country: 'ITA', primaryColor: '#008FD7', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 84 },
  { id: 'it05', name: 'アタランタ・ベルガモ', shortName: 'ABE', city: 'ベルガモ', country: 'ITA', primaryColor: '#1E71B8', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 82 },
  { id: 'it06', name: 'ローマ・ジャッロロッソ', shortName: 'RGI', city: 'ローマ', country: 'ITA', primaryColor: '#8E1F2F', secondaryColor: '#F0BC42', pattern: 'halves-vertical', shape: 'shield', basePower: 81 },
  { id: 'it07', name: 'ラツィオ・ビアンコチェレステ', shortName: 'LBC', city: 'ローマ', country: 'ITA', primaryColor: '#87D8F7', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 80 },
  { id: 'it08', name: 'フィレンツェ・ヴィオラ', shortName: 'FVI', city: 'フィレンツェ', country: 'ITA', primaryColor: '#4F2382', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'diamond', basePower: 79 },
  { id: 'it09', name: 'ボローニャ・ロッソブルー', shortName: 'BRO', city: 'ボローニャ', country: 'ITA', primaryColor: '#1B2C4B', secondaryColor: '#9C1B2C', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
  { id: 'it10', name: 'トリノ・グランタ', shortName: 'TGR', city: 'トリノ', country: 'ITA', primaryColor: '#7A1C20', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 76 },
  { id: 'it11', name: 'ジェノア・グリフォーネ', shortName: 'GEN', city: 'ジェノヴァ', country: 'ITA', primaryColor: '#8A1538', secondaryColor: '#002B49', pattern: 'halves-vertical', shape: 'shield', basePower: 75 },
  { id: 'it12', name: 'モンツァ・ブリアンツァ', shortName: 'MON', city: 'モンツァ', country: 'ITA', primaryColor: '#E20613', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'circle', basePower: 74 },
  { id: 'it13', name: 'ウディネ・ゼブラ', shortName: 'UDI', city: 'ウーディネ', country: 'ITA', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 74 },
  { id: 'it14', name: 'カリアリ・サルデーニャ', shortName: 'CAG', city: 'カリャリ', country: 'ITA', primaryColor: '#002B49', secondaryColor: '#C4122D', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'it15', name: 'ヴェローナ・マスティーニ', shortName: 'VER', city: 'ヴェローナ', country: 'ITA', primaryColor: '#002B49', secondaryColor: '#FFD700', pattern: 'split-vertical', shape: 'shield', basePower: 73 },
  { id: 'it16', name: 'パルマ・十字軍', shortName: 'PAR', city: 'パルマ', country: 'ITA', primaryColor: '#FFFFFF', secondaryColor: '#002B49', pattern: 'halves-horizontal', shape: 'shield', basePower: 73 },
  { id: 'it17', name: 'コモ・ラーゴ', shortName: 'COM', city: 'コモ', country: 'ITA', primaryColor: '#0038A8', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 72 },
  { id: 'it18', name: 'レッチェ・サレント', shortName: 'LEC', city: 'レッチェ', country: 'ITA', primaryColor: '#E20613', secondaryColor: '#FEE000', pattern: 'stripes-vertical', shape: 'shield', basePower: 71 },
  { id: 'it19', name: 'エンポリ・トスカーナ', shortName: 'EMP', city: 'エンポリ', country: 'ITA', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'circle', basePower: 70 },
  { id: 'it20', name: 'ヴェネツィア・ラグーナ', shortName: 'VEN', city: 'ヴェネツィア', country: 'ITA', primaryColor: '#000000', secondaryColor: '#FF6600', pattern: 'stripes-horizontal', shape: 'shield', basePower: 70 }
];

// ドイツ（ブンデスリーガ相当）：18クラブ
const GERMANY_CLUBS_DEFINITIONS = [
  { id: 'de01', name: 'バイエルン・ロート', shortName: 'BRO', city: 'ミュンヘン', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#0066B2', pattern: 'quarters', shape: 'circle', basePower: 86 },
  { id: 'de02', name: 'レバークーゼン・ヴェルク', shortName: 'LWE', city: 'レバークーゼン', country: 'GER', primaryColor: '#E32221', secondaryColor: '#121212', pattern: 'sash-diagonal', shape: 'shield', basePower: 85 },
  { id: 'de03', name: 'ドルトムント・ゲルプ', shortName: 'DGE', city: 'ドルトムント', country: 'GER', primaryColor: '#FDE100', secondaryColor: '#121212', pattern: 'stripes-vertical', shape: 'circle', basePower: 84 },
  { id: 'de04', name: 'ライプツィヒ・ブルズ', shortName: 'LBU', city: 'ライプツィヒ', country: 'GER', primaryColor: '#ED1B24', secondaryColor: '#002B49', pattern: 'chevron-down', shape: 'shield', basePower: 83 },
  { id: 'de05', name: 'シュトゥットガルト・クロイツ', shortName: 'SKR', city: 'シュトゥットガルト', country: 'GER', primaryColor: '#FFFFFF', secondaryColor: '#E32219', pattern: 'stripes-horizontal', shape: 'shield', basePower: 81 },
  { id: 'de06', name: 'フランクフルト・アドラー', shortName: 'FAD', city: 'フランクフルト', country: 'GER', primaryColor: '#E1000F', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'circle', basePower: 80 },
  { id: 'de07', name: 'ヴォルフスブルク・グリューン', shortName: 'WGR', city: 'ヴォルフスブルク', country: 'GER', primaryColor: '#65B32E', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 78 },
  { id: 'de08', name: 'フライブルク・フォルクス', shortName: 'FVO', city: 'フライブルク', country: 'GER', primaryColor: '#000000', secondaryColor: '#E2001A', pattern: 'halves-vertical', shape: 'shield', basePower: 78 },
  { id: 'de09', name: 'ホッフェンハイム・ブラウ', shortName: 'HOF', city: 'ジンスハイム', country: 'GER', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'shield', basePower: 77 },
  { id: 'de10', name: 'ブレーメン・ヴェルダー', shortName: 'BWE', city: 'ブレーメン', country: 'GER', primaryColor: '#1C7C44', secondaryColor: '#FFFFFF', pattern: 'diamond', shape: 'diamond', basePower: 76 },
  { id: 'de11', name: 'ボルシア・メンヒェン', shortName: 'BMG', city: 'メンヒェングラートバッハ', country: 'GER', primaryColor: '#000000', secondaryColor: '#009F4D', pattern: 'split-vertical', shape: 'diamond', basePower: 76 },
  { id: 'de12', name: 'ウニオン・鉄鋼', shortName: 'UNI', city: 'ベルリン', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#FFD700', pattern: 'stripes-vertical', shape: 'shield', basePower: 75 },
  { id: 'de13', name: 'アウクスブルク・フッガー', shortName: 'AUG', city: 'アウクスブルク', country: 'GER', primaryColor: '#800000', secondaryColor: '#008000', pattern: 'halves-vertical', shape: 'circle', basePower: 74 },
  { id: 'de14', name: 'マインツ・カーニバル', shortName: 'MAI', city: 'マインツ', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#FFFFFF', pattern: 'quarters', shape: 'shield', basePower: 74 },
  { id: 'de15', name: 'ハイデンハイム・赤青', shortName: 'HDH', city: 'ハイデンハイム', country: 'GER', primaryColor: '#002B49', secondaryColor: '#DC052D', pattern: 'halves-horizontal', shape: 'shield', basePower: 73 },
  { id: 'de16', name: 'ザンクトパウリ・海賊', shortName: 'STP', city: 'ハンブルク', country: 'GER', primaryColor: '#5C381E', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 72 },
  { id: 'de17', name: 'キール・ホルシュタイン', shortName: 'KIE', city: 'キール', country: 'GER', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 },
  { id: 'de18', name: 'ボーフム・青白', shortName: 'BOC', city: 'ボーフム', country: 'GER', primaryColor: '#005CA9', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'circle', basePower: 70 }
];

// フランス（リーグ・アン相当）：18クラブ
const FRANCE_CLUBS_DEFINITIONS = [
  { id: 'fr01', name: 'パリ・ルージュエブルー', shortName: 'PRB', city: 'パリ', country: 'FRA', primaryColor: '#002B49', secondaryColor: '#DA291C', pattern: 'stripes-vertical', shape: 'circle', basePower: 86 },
  { id: 'fr02', name: 'モナコ・プリンス', shortName: 'MPR', city: 'モナコ', country: 'FRA', primaryColor: '#E2001A', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 82 },
  { id: 'fr03', name: 'マルセイユ・シエル', shortName: 'MCI', city: 'マルセイユ', country: 'FRA', primaryColor: '#00A3E0', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 82 },
  { id: 'fr04', name: 'リール・ドグ', shortName: 'LDO', city: 'リール', country: 'FRA', primaryColor: '#E01E2E', secondaryColor: '#1D253C', pattern: 'chevron-down', shape: 'shield', basePower: 80 },
  { id: 'fr05', name: 'リヨン・オランピック', shortName: 'LOL', city: 'リヨン', country: 'FRA', primaryColor: '#FFFFFF', secondaryColor: '#17366E', pattern: 'split-vertical', shape: 'shield', basePower: 80 },
  { id: 'fr06', name: 'レンヌ・ルージュ', shortName: 'RRU', city: 'レンヌ', country: 'FRA', primaryColor: '#E30613', secondaryColor: '#000000', pattern: 'halves-vertical', shape: 'circle', basePower: 79 },
  { id: 'fr07', name: 'ランス・サングエトール', shortName: 'RCL', city: 'ランス', country: 'FRA', primaryColor: '#E20613', secondaryColor: '#FFCC00', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
  { id: 'fr08', name: 'ニース・アイグロン', shortName: 'NAI', city: 'ニース', country: 'FRA', primaryColor: '#DA291C', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
  { id: 'fr09', name: 'ブレスト・チロワ', shortName: 'BRE', city: 'ブレスト', country: 'FRA', primaryColor: '#E20613', secondaryColor: '#FFFFFF', pattern: 'halves-horizontal', shape: 'circle', basePower: 78 },
  { id: 'fr10', name: 'ランス・シャンパーニュ', shortName: 'RCH', city: 'ランス', country: 'FRA', primaryColor: '#D50032', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 77 },
  { id: 'fr11', name: 'ストラスブール・アルザス', shortName: 'SAL', city: 'ストラスブール', country: 'FRA', primaryColor: '#00539F', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 76 },
  { id: 'fr12', name: 'トゥールーズ・ヴィオレ', shortName: 'TVI', city: 'トゥールーズ', country: 'FRA', primaryColor: '#53284F', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'diamond', basePower: 76 },
  { id: 'fr13', name: 'モンペリエ・オレンジ', shortName: 'MON', city: 'モンペリエ', country: 'FRA', primaryColor: '#F37021', secondaryColor: '#002B49', pattern: 'quarters', shape: 'shield', basePower: 75 },
  { id: 'fr14', name: 'ナント・カナリア', shortName: 'NAN', city: 'ナント', country: 'FRA', primaryColor: '#FFF200', secondaryColor: '#00A651', pattern: 'stripes-vertical', shape: 'shield', basePower: 74 },
  { id: 'fr15', name: 'オセール・白青', shortName: 'AUX', city: 'オセール', country: 'FRA', primaryColor: '#FFFFFF', secondaryColor: '#0053A0', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'fr16', name: 'ル・アーヴル・水色', shortName: 'HAC', city: 'ル・アーヴル', country: 'FRA', primaryColor: '#87D8F7', secondaryColor: '#002B49', pattern: 'halves-vertical', shape: 'shield', basePower: 72 },
  { id: 'fr17', name: 'アンジェ・黒白', shortName: 'ANG', city: 'アンジェ', country: 'FRA', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'diamond', basePower: 71 },
  { id: 'fr18', name: 'サンテティエンヌ・緑', shortName: 'STE', city: 'サンテティエンヌ', country: 'FRA', primaryColor: '#007A3D', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 72 }
];

// 五大リーグ全120クラブまとめ
// ENG 1部(20) + ENG 2部(24) + ESP(20) + ITA(20) + GER(18) + FRA(18) = 120クラブ
function getAllBigFiveClubs() {
  const p1Clubs = (typeof CLUB_DEFINITIONS !== 'undefined') ? CLUB_DEFINITIONS : (gameState.clubs || []);
  return [
    ...p1Clubs,
    ...CHAMPIONSHIP_CLUBS_DEFINITIONS,
    ...SPAIN_CLUBS_DEFINITIONS,
    ...ITALY_CLUBS_DEFINITIONS,
    ...GERMANY_CLUBS_DEFINITIONS,
    ...FRANCE_CLUBS_DEFINITIONS
  ];
}

// ==========================================
// 2. 高速ダイジェスト試合エンジン（simQuickMatch）
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

  const hp = getPower(homeClub) + 2.5; // ホームアドバンテージ
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

  const homeScore = genGoals(homeExp);
  const awayScore = genGoals(awayExp);
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
// 3. コンペティション初期化
// ==========================================
function initSeasonCompetitions() {
  try {
    if (!gameState.competitions) {
      gameState.competitions = {};
    }
    initChampionshipLeague();
    initDomesticCups();
    initEuropeanCups36();
    injectCupMatchesIntoCalendar();
  } catch (err) {
    console.error('Error in initSeasonCompetitions:', err);
  }
}

// 2部リーグ（チャンピオンシップ）
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

// 国内2大カップ（一発勝負トーナメント）
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

  // リーグカップ（LGC: カラバオ相当 44クラブ）: 優勝特典: 賞金 + ECL出場権
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
    prizeMoney: 10000 // £10.0M
  };

  // ナショナルカップ（NAT: FA杯相当 44クラブ）: 優勝特典: 高額賞金 + EL出場権
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
    prizeMoney: 15000 // £15.0M
  };
}

// ==========================================
// 4. 欧州3大カップ戦（CL / EL / ECL 各36チーム・新スイス方式）
// ==========================================

/**
 * 欧州全120クラブから上位成績・カップ結果に基づきCL(36), EL(36), ECL(36)の計108枠へ自動エントリー
 */
function selectEuropeanCompetitionEntries() {
  const premClubs = [...(gameState.clubs || [])].sort((a, b) => (b.pts || 0) - (a.pts || 0));
  const p2Clubs = [...((gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS)].sort((a, b) => (b.pts || 0) - (a.pts || 0));
  const espClubs = [...SPAIN_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);
  const itaClubs = [...ITALY_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);
  const gerClubs = [...GERMANY_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);
  const fraClubs = [...FRANCE_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);

  // 1. CL (36クラブ): 欧州最高峰
  // ENG 1〜4位 (4) + ESP 1〜8位 (8) + ITA 1〜8位 (8) + GER 1〜8位 (8) + FRA 1〜8位 (8) = 36クラブ
  const clEntries = [
    ...premClubs.slice(0, 4),
    ...espClubs.slice(0, 8),
    ...itaClubs.slice(0, 8),
    ...gerClubs.slice(0, 8),
    ...fraClubs.slice(0, 8)
  ];

  // 2. EL (36クラブ): 欧州強豪
  // ENG 5〜8位 (4: FA杯枠含む) + ESP 9〜16位 (8) + ITA 9〜16位 (8) + GER 9〜16位 (8) + FRA 9〜16位 (8) = 36クラブ
  const elEntries = [
    ...premClubs.slice(4, 8),
    ...espClubs.slice(8, 16),
    ...itaClubs.slice(8, 16),
    ...gerClubs.slice(8, 16),
    ...fraClubs.slice(8, 16)
  ];

  // 3. ECL (36クラブ): 欧州実力派
  // ENG 9〜16位 (8: リーグ杯枠含む) + ESP 17〜20位 (4) + ITA 17〜20位 (4) + GER 17〜18位 (2) + FRA 17〜18位 (2) + ENG 17〜18位 (2) + ENG 2部上位14 (14) = 36クラブ
  const eclEntries = [
    ...premClubs.slice(8, 16),
    ...espClubs.slice(16, 20),
    ...itaClubs.slice(16, 20),
    ...gerClubs.slice(16, 18),
    ...fraClubs.slice(16, 18),
    ...premClubs.slice(16, 18),
    ...p2Clubs.slice(0, 14)
  ];

  // 残り12クラブ（ENG 1部19〜20位の2クラブ ＋ ENG 2部15〜24位の10クラブ）は国内専念

  return { clEntries, elEntries, eclEntries };
}

/**
 * 36チームのスイス方式リーグフェーズ（各チーム8試合：ホーム4、アウェイ4）の対戦スケジュールをポット抽選生成
 */
function createSwissLeaguePhase(participants, compName, enName, shortCode, prizeMoney) {
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

  // ポット分け（4ポット × 各9チーム）
  const sortedByPower = [...clubs].sort((a, b) => (b.basePower || 75) - (a.basePower || 75));
  const pots = [
    sortedByPower.slice(0, 9),   // Pot 1
    sortedByPower.slice(9, 18),  // Pot 2
    sortedByPower.slice(18, 27), // Pot 3
    sortedByPower.slice(27, 36)  // Pot 4
  ];

  // 全8節（Matchday 1〜8）の対戦カードを事前生成
  // 各節18試合 × 8節 ＝ 計144試合
  const leagueSchedule = [];
  for (let round = 1; round <= 8; round++) {
    const shuffled = [...clubs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (!shuffled[i] || !shuffled[i + 1]) continue;
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
    name: compName,
    enName,
    shortCode,
    phase: 'LEAGUE', // 'LEAGUE' -> 'PLAYOFF' -> 'KNOCKOUT'
    currentMatchweek: 0, // 0 〜 8
    participants: clubs,
    pots,
    leagueSchedule,
    playoffs: [], // 9〜24位の進出プレーオフ
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

function initEuropeanCups36() {
  const entries = selectEuropeanCompetitionEntries();
  gameState.competitions.championsCup = createSwissLeaguePhase(entries.clEntries, 'チャンピオンズリーグ', 'CHAMPIONS LEAGUE', 'CL', 30000);
  gameState.competitions.europaCup = createSwissLeaguePhase(entries.elEntries, 'ヨーロッパリーグ', 'EUROPA LEAGUE', 'EL', 18000);
  gameState.competitions.conferenceCup = createSwissLeaguePhase(entries.eclEntries, 'カンファレンスリーグ', 'CONFERENCE LEAGUE', 'ECL', 10000);
}

// カレンダーにカップ戦＆欧州戦（全8試合リーグフェーズ＋PO＋決勝T）日程をマッピング
function injectCupMatchesIntoCalendar() {
  if (!gameState.calendar || gameState.calendar.length === 0) return;

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

    // 欧州コンペ：全8試合スイス方式リーグフェーズ (MD1〜MD8)
    { month: 9, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 1, label: '欧州リーグ MD1' },
    { month: 10, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 2, label: '欧州リーグ MD2' },
    { month: 10, dayOfWeek: 4, compType: 'euroLeaguePhase', md: 3, label: '欧州リーグ MD3' },
    { month: 11, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 4, label: '欧州リーグ MD4' },
    { month: 11, dayOfWeek: 4, compType: 'euroLeaguePhase', md: 5, label: '欧州リーグ MD5' },
    { month: 12, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 6, label: '欧州リーグ MD6' },
    { month: 1, dayOfWeek: 2, compType: 'euroLeaguePhase', md: 7, label: '欧州リーグ MD7' },
    { month: 1, dayOfWeek: 4, compType: 'euroLeaguePhase', md: 8, label: '欧州リーグ MD8' },

    // 欧州コンペ：決勝トーナメント進出プレーオフ（9〜24位）
    { month: 2, dayOfWeek: 2, compType: 'euroPlayoff', label: '欧州PO 決勝T進出決定戦' },

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

      if (sc.compType === 'euroLeaguePhase' || sc.compType === 'euroPlayoff') {
        day.cupCode = 'EURO';
      } else {
        const comp = gameState.competitions && gameState.competitions[sc.compType];
        if (comp) day.cupCode = comp.shortCode;
      }
    }
  });
}

// ==========================================
// 5. 欧州リーグフェーズ＆プレーオフの進行
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

    // 第8節終了時：1〜8位がR16進出、9〜24位がプレーオフ進出
    if (md === 8) {
      finalizeEuroLeaguePhaseToKnockout(comp);
    }
  });

  return { playerMatch, playerComp };
}

// 8節終了時：1〜8位ストレート進出、9〜24位プレーオフ（PO）生成
function finalizeEuroLeaguePhaseToKnockout(comp) {
  if (comp.phase !== 'LEAGUE') return;
  comp.phase = 'PLAYOFF';

  const sorted = [...comp.participants].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));
  const top8 = sorted.slice(0, 8);
  const playoffClubs = sorted.slice(8, 24); // 9〜24位（計16チーム）

  comp.top8Direct = top8;
  comp.playoffs = generateKnockoutRound(playoffClubs);
}

// プレーオフ（9〜24位）の進行
function advanceEuroPlayoffRound() {
  const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  let playerMatch = null;
  let playerComp = null;

  euroKeys.forEach(ek => {
    const comp = gameState.competitions && gameState.competitions[ek];
    if (!comp || !comp.playoffs) return;

    comp.playoffs.forEach(m => {
      if (m.played) return;
      const isHomePlayer = (playerClub && m.homeId === playerClub.id);
      const isAwayPlayer = (playerClub && m.awayId === playerClub.id);

      if (isHomePlayer || isAwayPlayer) {
        playerMatch = m;
        playerComp = comp;
      } else {
        const res = simKnockoutMatch(m.homeClub, m.awayClub);
        m.homeScore = res.homeScore;
        m.awayScore = res.awayScore;
        m.pkHome = res.pkHome;
        m.pkAway = res.pkAway;
        m.winnerId = res.winnerId;
        m.winnerClub = res.winnerClub;
        m.played = true;
      }
    });

    // プレーオフ勝者8チーム + トップ8 = 16チームでR16構築
    const poWinners = comp.playoffs.map(m => m.winnerClub).filter(Boolean);
    if (poWinners.length >= 8 && comp.top8Direct) {
      comp.phase = 'KNOCKOUT';
      comp.rounds.R16 = generateKnockoutRound([...comp.top8Direct, ...poWinners]);
    }
  });

  return { playerMatch, playerComp };
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

// 2部リーグ順位表
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
    const zoneClass = rank <= 3 ? 'zone-ucl' : (rank >= 22 ? 'zone-rel' : '');

    html += `
      <tr class="${zoneClass}">
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

  html += `
      </tbody>
    </table>
    <div class="standings-legend">
      <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-3位: プレミアリーグ自動昇格</span></div>
      <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">22-24位: 降格圏</span></div>
    </div>
  `;
  return html;
}

// 欧州コンペ：全36チーム スイス方式総合順位表描画（1〜8位緑、9〜24位黄、25〜36位赤の左端ライン統一、文字表示削除、下部注釈付き）
function renderEuroLeaguePhaseStandingsHtml(compKey) {
  const comp = gameState.competitions && gameState.competitions[compKey];
  if (!comp || !comp.participants) return '<p class="empty-state">欧州コンペデータがありません</p>';

  const sorted = [...comp.participants].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  let html = `
    <div class="euro-league-header">
      <div class="euro-league-badge-title">
        <span class="euro-badge-code mono">${comp.shortCode}</span>
        <span class="euro-badge-name">${comp.name} 総合順位表</span>
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
    if (rank <= 8) {
      zoneClass = 'zone-ucl zone-direct-r16';
    } else if (rank <= 24) {
      zoneClass = 'zone-uel zone-playoff';
    } else {
      zoneClass = 'zone-rel zone-eliminated';
    }

    html += `
      <tr class="${zoneClass}">
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

  html += `
      </tbody>
    </table>
    <div class="standings-legend">
      <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-8位: ラウンド16直行</span></div>
      <div class="legend-item"><span class="legend-color-box zone-uel-bg"></span><span class="legend-text">9-24位: 決勝トーナメント進出プレーオフ</span></div>
      <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">25-36位: 敗退</span></div>
    </div>
  `;
  return html;
}

// 欧州コンペ：対戦日程・結果リストの描画
function renderEuroScheduleListHtml(compKey) {
  const comp = gameState.competitions && gameState.competitions[compKey];
  if (!comp || !comp.leagueSchedule) return '<p class="empty-state">対戦日程データがありません</p>';

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));

  let html = `<div class="euro-schedule-list-wrapper">`;
  comp.leagueSchedule.forEach((roundMatches, idx) => {
    const md = idx + 1;
    html += `
      <div class="euro-schedule-md-block">
        <h4 class="euro-schedule-md-title mono">MATCHDAY ${md}</h4>
        <div class="euro-schedule-matches-grid">
    `;

    roundMatches.forEach(m => {
      const isMyMatch = playerClub && (m.homeId === playerClub.id || m.awayId === playerClub.id);
      const homeEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(m.homeClub, 16) : '';
      const awayEmblem = typeof getClubEmblemSvg === 'function' ? getClubEmblemSvg(m.awayClub, 16) : '';
      const scoreText = m.played ? `${m.homeScore} - ${m.awayScore}` : 'VS';

      // プレミアリーグのクラブも確実に3文字コードを取得
      const homeCode = typeof getClubShortCode === 'function' ? getClubShortCode(m.homeClub) : ((m.homeClub && m.homeClub.shortName) || 'HOM');
      const awayCode = typeof getClubShortCode === 'function' ? getClubShortCode(m.awayClub) : ((m.awayClub && m.awayClub.shortName) || 'AWY');

      html += `
        <div class="euro-match-tile ${isMyMatch ? 'my-match' : ''} ${m.played ? 'played' : ''}">
          <div class="euro-tile-team home">
            ${homeEmblem}
            <span class="mono">${homeCode}</span>
          </div>
          <span class="euro-tile-score mono ${m.played ? 'score-played' : ''}">${scoreText}</span>
          <div class="euro-tile-team away">
            ${awayEmblem}
            <span class="mono">${awayCode}</span>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  });
  html += `</div>`;
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
window.SPAIN_CLUBS_DEFINITIONS = SPAIN_CLUBS_DEFINITIONS;
window.ITALY_CLUBS_DEFINITIONS = ITALY_CLUBS_DEFINITIONS;
window.GERMANY_CLUBS_DEFINITIONS = GERMANY_CLUBS_DEFINITIONS;
window.FRANCE_CLUBS_DEFINITIONS = FRANCE_CLUBS_DEFINITIONS;
window.getAllBigFiveClubs = getAllBigFiveClubs;
window.simQuickMatch = simQuickMatch;
window.simKnockoutMatch = simKnockoutMatch;
window.initSeasonCompetitions = initSeasonCompetitions;
window.advanceChampionshipWeek = advanceChampionshipWeek;
window.advanceEuroLeaguePhase = advanceEuroLeaguePhase;
window.advanceEuroPlayoffRound = advanceEuroPlayoffRound;
window.processPromotionAndRelegation = processPromotionAndRelegation;
window.injectCupMatchesIntoCalendar = injectCupMatchesIntoCalendar;
window.processCupMatchDay = processCupMatchDay;
window.finalizeCupMatch = finalizeCupMatch;
window.checkScheduleCongestion = checkScheduleCongestion;
window.renderChampionshipStandingsHtml = renderChampionshipStandingsHtml;
window.renderEuroLeaguePhaseStandingsHtml = renderEuroLeaguePhaseStandingsHtml;
window.renderEuroScheduleListHtml = renderEuroScheduleListHtml;
window.renderCupBracketHtml = renderCupBracketHtml;
