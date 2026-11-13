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
  { id: 'c09', name: 'ハダースフィールド・T', shortName: 'HUD', city: 'ハダースフィールド', country: 'ENG', primaryColor: '#0E63AD', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 69 },
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
  { id: 'es17', name: 'アラベス・D', shortName: 'ALA', city: 'ビトリア', country: 'ESP', primaryColor: '#00539F', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 71 },
  { id: 'es18', name: 'エスパニョール・B', shortName: 'ESP', city: 'バルセロナ', country: 'ESP', primaryColor: '#0072CE', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 72 },
  { id: 'es19', name: 'バジャドリード・V', shortName: 'VLL', city: 'バリャドリード', country: 'ESP', primaryColor: '#53284F', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 },
  { id: 'es20', name: 'レガネス・CD', shortName: 'LEG', city: 'レガネス', country: 'ESP', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 69 }
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
  { id: 'it16', name: 'パルマ・FC', shortName: 'PAR', city: 'パルマ', country: 'ITA', primaryColor: '#FFFFFF', secondaryColor: '#002B49', pattern: 'halves-horizontal', shape: 'shield', basePower: 73 },
  { id: 'it17', name: 'コモ・C', shortName: 'COM', city: 'コモ', country: 'ITA', primaryColor: '#0038A8', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 72 },
  { id: 'it18', name: 'レッチェ・US', shortName: 'LEC', city: 'レッチェ', country: 'ITA', primaryColor: '#E20613', secondaryColor: '#FEE000', pattern: 'stripes-vertical', shape: 'shield', basePower: 71 },
  { id: 'it19', name: 'エンポリ・FC', shortName: 'EMP', city: 'エンポリ', country: 'ITA', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'circle', basePower: 70 },
  { id: 'it20', name: 'ヴェネツィア・FC', shortName: 'VEN', city: 'ヴェネツィア', country: 'ITA', primaryColor: '#000000', secondaryColor: '#FF6600', pattern: 'stripes-horizontal', shape: 'shield', basePower: 70 }
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
  { id: 'de12', name: 'ウニオン・B', shortName: 'UNI', city: 'ベルリン', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#FFD700', pattern: 'stripes-vertical', shape: 'shield', basePower: 75 },
  { id: 'de13', name: 'アウクスブルク・フッガー', shortName: 'AUG', city: 'アウクスブルク', country: 'GER', primaryColor: '#800000', secondaryColor: '#008000', pattern: 'halves-vertical', shape: 'circle', basePower: 74 },
  { id: 'de14', name: 'マインツ・カーニバル', shortName: 'MAI', city: 'マインツ', country: 'GER', primaryColor: '#DC052D', secondaryColor: '#FFFFFF', pattern: 'quarters', shape: 'shield', basePower: 74 },
  { id: 'de15', name: 'ハイデンハイム・FC', shortName: 'HDH', city: 'ハイデンハイム', country: 'GER', primaryColor: '#002B49', secondaryColor: '#DC052D', pattern: 'halves-horizontal', shape: 'shield', basePower: 73 },
  { id: 'de16', name: 'ザンクトパウリ・FC', shortName: 'STP', city: 'ハンブルク', country: 'GER', primaryColor: '#5C381E', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 72 },
  { id: 'de17', name: 'キール・H', shortName: 'KIE', city: 'キール', country: 'GER', primaryColor: '#0053A0', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 },
  { id: 'de18', name: 'ボーフム・V', shortName: 'BOC', city: 'ボーフム', country: 'GER', primaryColor: '#005CA9', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'circle', basePower: 70 }
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
  { id: 'fr15', name: 'オセール・AJ', shortName: 'AUX', city: 'オセール', country: 'FRA', primaryColor: '#FFFFFF', secondaryColor: '#0053A0', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'fr16', name: 'ル・アーヴル・AC', shortName: 'HAC', city: 'ル・アーヴル', country: 'FRA', primaryColor: '#87D8F7', secondaryColor: '#002B49', pattern: 'halves-vertical', shape: 'shield', basePower: 72 },
  { id: 'fr17', name: 'アンジェ・SCO', shortName: 'ANG', city: 'アンジェ', country: 'FRA', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'diamond', basePower: 71 },
  { id: 'fr18', name: 'サンテティエンヌ・AS', shortName: 'STE', city: 'サンテティエンヌ', country: 'FRA', primaryColor: '#007A3D', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 72 }
];

// 5大リーグ以外の欧州各国主要クラブ（ポルトガル・オランダ・ベルギー・スコットランド・トルコ・北欧・東欧等）
const OTHER_EURO_CLUBS_DEFINITIONS = [
  // ポルトガル (POR)
  { id: 'pt01', name: 'リスボン・レオネス', shortName: 'LLE', city: 'リスボン', country: 'POR', primaryColor: '#006633', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 81 },
  { id: 'pt02', name: 'ポルト・ドラゴエス', shortName: 'PDR', city: 'ポルト', country: 'POR', primaryColor: '#003399', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 81 },
  { id: 'pt03', name: 'リスボン・アギアス', shortName: 'LAG', city: 'リスボン', country: 'POR', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'circle', basePower: 81 },
  { id: 'pt04', name: 'ブラガ・アルセナリスタ', shortName: 'BAR', city: 'ブラガ', country: 'POR', primaryColor: '#CC0000', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 77 },
  { id: 'pt05', name: 'ギマランイス・コンキスタ', shortName: 'GCO', city: 'ギマランイス', country: 'POR', primaryColor: '#FFFFFF', secondaryColor: '#111111', pattern: 'split-vertical', shape: 'shield', basePower: 74 },
  // オランダ (NED)
  { id: 'nl01', name: 'アイントホーフェン・フィリップス', shortName: 'APH', city: 'アイントホーフェン', country: 'NED', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 81 },
  { id: 'nl02', name: 'アムステルダム・ランツィール', shortName: 'ALA', city: 'アムステルダム', country: 'NED', primaryColor: '#FFFFFF', secondaryColor: '#D2122E', pattern: 'split-vertical', shape: 'circle', basePower: 80 },
  { id: 'nl03', name: 'ロッテルダム・マース', shortName: 'RMA', city: 'ロッテルダム', country: 'NED', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'circle', basePower: 80 },
  { id: 'nl04', name: 'アルクマール・ノールト', shortName: 'ANO', city: 'アルクマール', country: 'NED', primaryColor: '#DB0020', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 76 },
  { id: 'nl05', name: 'エンスヘデ・トゥウェンテ', shortName: 'ETW', city: 'エンスヘデ', country: 'NED', primaryColor: '#D9141C', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 75 },
  { id: 'nl06', name: 'ユトレヒト・ドム', shortName: 'UDO', city: 'ユトレヒト', country: 'NED', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 73 },
  // ベルギー (BEL)
  { id: 'be01', name: 'ブルージュ・ブラウズワルト', shortName: 'BBZ', city: 'ブルージュ', country: 'BEL', primaryColor: '#0057A6', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
  { id: 'be02', name: 'ブリュッセル・サンジル', shortName: 'BSG', city: 'ブリュッセル', country: 'BEL', primaryColor: '#FFD100', secondaryColor: '#003B79', pattern: 'halves-vertical', shape: 'circle', basePower: 77 },
  { id: 'be03', name: 'アンデルレヒト・モーヴ', shortName: 'AMO', city: 'ブリュッセル', country: 'BEL', primaryColor: '#5B2B82', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'shield', basePower: 77 },
  { id: 'be04', name: 'ゲント・バッファローズ', shortName: 'GBU', city: 'ゲント', country: 'BEL', primaryColor: '#004B93', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 75 },
  { id: 'be05', name: 'ヘンク・リンブルフ', shortName: 'HLI', city: 'ヘンク', country: 'BEL', primaryColor: '#0055A4', secondaryColor: '#FFFFFF', pattern: 'quarters', shape: 'shield', basePower: 74 }
,
  // スコットランド (SCO)
  { id: 'sc01', name: 'グラスゴー・フープス', shortName: 'GHO', city: 'グラスゴー', country: 'SCO', primaryColor: '#008A45', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'circle', basePower: 79 },
  { id: 'sc02', name: 'グラスゴー・ブルーベルズ', shortName: 'GBL', city: 'グラスゴー', country: 'SCO', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 78 },
  { id: 'sc03', name: 'エディンバラ・ハーツ', shortName: 'EHA', city: 'エディンバラ', country: 'SCO', primaryColor: '#7A1C32', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 72 },
  { id: 'sc04', name: 'アバディーン・ドンズ', shortName: 'ADO', city: 'アバディーン', country: 'SCO', primaryColor: '#D61E2A', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'shield', basePower: 71 },
  // トルコ (TUR)
  { id: 'tr01', name: 'イスタンブール・アスラン', shortName: 'IAS', city: 'イスタンブール', country: 'TUR', primaryColor: '#FDB912', secondaryColor: '#A90432', pattern: 'halves-vertical', shape: 'shield', basePower: 80 },
  { id: 'tr02', name: 'カドゥキョイ・カナリア', shortName: 'KKA', city: 'イスタンブール', country: 'TUR', primaryColor: '#FFED00', secondaryColor: '#002D72', pattern: 'stripes-vertical', shape: 'shield', basePower: 79 },
  { id: 'tr03', name: 'ベシクタシュ・カルタル', shortName: 'BKA', city: 'イスタンブール', country: 'TUR', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 77 },
  { id: 'tr04', name: 'トラブゾン・ボルドマヴィ', shortName: 'TBM', city: 'トラブゾン', country: 'TUR', primaryColor: '#7A0026', secondaryColor: '#6DCFF6', pattern: 'halves-vertical', shape: 'shield', basePower: 74 },
  { id: 'tr05', name: 'バシャクシェヒル・オウル', shortName: 'BOU', city: 'イスタンブール', country: 'TUR', primaryColor: '#F37021', secondaryColor: '#002B49', pattern: 'quarters', shape: 'circle', basePower: 72 },
  // オーストリア (AUT)
  { id: 'at01', name: 'ザルツブルク・ブルズ', shortName: 'ZBU', city: 'ザルツブルク', country: 'AUT', primaryColor: '#FFFFFF', secondaryColor: '#DB0A40', pattern: 'sash-diagonal', shape: 'shield', basePower: 78 },
  { id: 'at02', name: 'グラーツ・シュトゥルム', shortName: 'GST', city: 'グラーツ', country: 'AUT', primaryColor: '#111111', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 76 },
  { id: 'at03', name: 'ウィーン・ラピッド', shortName: 'WRA', city: 'ウィーン', country: 'AUT', primaryColor: '#008A45', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 74 },
  { id: 'at04', name: 'リンツ・LASK', shortName: 'LLA', city: 'リンツ', country: 'AUT', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'diamond', basePower: 72 },
  // スイス (SUI)
  { id: 'ch01', name: 'ベルン・ヤングスターズ', shortName: 'BYS', city: 'ベルン', country: 'SUI', primaryColor: '#FFD100', secondaryColor: '#000000', pattern: 'halves-vertical', shape: 'circle', basePower: 77 },
  { id: 'ch02', name: 'バーゼル・ロットブラウ', shortName: 'BRB', city: 'バーゼル', country: 'SUI', primaryColor: '#D61E2A', secondaryColor: '#004B93', pattern: 'halves-vertical', shape: 'shield', basePower: 75 },
  { id: 'ch03', name: 'ジュネーヴ・セルヴェット', shortName: 'GSE', city: 'ジュネーヴ', country: 'SUI', primaryColor: '#7A1C32', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 73 },
  { id: 'ch04', name: 'ルガーノ・ビアンコネーリ', shortName: 'LBN', city: 'ルガーノ', country: 'SUI', primaryColor: '#111111', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 72 },
  // ギリシャ (GRE)
  { id: 'gr01', name: 'ピレウス・エリスロレフコ', shortName: 'PER', city: 'ピレウス', country: 'GRE', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'circle', basePower: 77 },
  { id: 'gr02', name: 'テッサロニキ・ディケファロス', shortName: 'TDI', city: 'テッサロニキ', country: 'GRE', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 76 },
  { id: 'gr03', name: 'アテネ・キトリノマヴロ', shortName: 'AKM', city: 'アテネ', country: 'GRE', primaryColor: '#FDB913', secondaryColor: '#000000', pattern: 'halves-vertical', shape: 'shield', basePower: 75 },
  { id: 'gr04', name: 'アテネ・シャムロック', shortName: 'ASH', city: 'アテネ', country: 'GRE', primaryColor: '#007A3D', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 74 },
  // デンマーク (DEN)
  { id: 'dk01', name: 'コペンハーゲン・ライオンズ', shortName: 'CLI', city: 'コペンハーゲン', country: 'DEN', primaryColor: '#FFFFFF', secondaryColor: '#0033A0', pattern: 'circle-center', shape: 'circle', basePower: 77 },
  { id: 'dk02', name: 'ヘアニング・ウルヴズ', shortName: 'HUL', city: 'ヘアニング', country: 'DEN', primaryColor: '#111111', secondaryColor: '#E30613', pattern: 'sash-diagonal', shape: 'shield', basePower: 75 },
  { id: 'dk03', name: 'ブレンビー・イエロー', shortName: 'BYE', city: 'ブレンビー', country: 'DEN', primaryColor: '#FFE100', secondaryColor: '#003399', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'dk04', name: 'ノアシェラン・ワイルド', shortName: 'NWA', city: 'ファルム', country: 'DEN', primaryColor: '#D61E2A', secondaryColor: '#FFCC00', pattern: 'quarters', shape: 'shield', basePower: 72 },
  // チェコ (CZE)
  { id: 'cz01', name: 'プラハ・アイアン', shortName: 'PAI', city: 'プラハ', country: 'CZE', primaryColor: '#8B0000', secondaryColor: '#FFFFFF', pattern: 'split-vertical', shape: 'shield', basePower: 77 },
  { id: 'cz02', name: 'プラハ・スター', shortName: 'PST', city: 'プラハ', country: 'CZE', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 76 },
  { id: 'cz03', name: 'プルゼニ・ヴィクトリア', shortName: 'PVI', city: 'プルゼニ', country: 'CZE', primaryColor: '#E30613', secondaryColor: '#004B93', pattern: 'stripes-vertical', shape: 'shield', basePower: 74 },
  { id: 'cz04', name: 'ムラダー・ボレスラフ', shortName: 'MBO', city: 'ボレスラフ', country: 'CZE', primaryColor: '#0055A4', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 70 }
  ,
  // ノルウェー (NOR)
  { id: 'no01', name: 'ボードー・アークティック', shortName: 'BAR', city: 'ボードー', country: 'NOR', primaryColor: '#FFD100', secondaryColor: '#111111', pattern: 'halves-horizontal', shape: 'shield', basePower: 76 },
  { id: 'no02', name: 'モルデ・ブルー', shortName: 'MBL', city: 'モルデ', country: 'NOR', primaryColor: '#0055A4', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 73 },
  { id: 'no03', name: 'ベルゲン・ブラン', shortName: 'BBR', city: 'ベルゲン', country: 'NOR', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 71 },
  // スウェーデン (SWE)
  { id: 'se01', name: 'マルメ・スカイブルー', shortName: 'MSB', city: 'マルメ', country: 'SWE', primaryColor: '#56A0D3', secondaryColor: '#FFFFFF', pattern: 'sash-diagonal', shape: 'shield', basePower: 74 },
  { id: 'se02', name: 'ストックホルム・ユール', shortName: 'SYU', city: 'ストックホルム', country: 'SWE', primaryColor: '#004B93', secondaryColor: '#75B2DD', pattern: 'stripes-vertical', shape: 'shield', basePower: 72 },
  { id: 'se03', name: 'ボロース・エルフス', shortName: 'BEL', city: 'ボロース', country: 'SWE', primaryColor: '#FFD100', secondaryColor: '#111111', pattern: 'halves-vertical', shape: 'circle', basePower: 71 },
  // クロアチア (CRO)
  { id: 'hr01', name: 'ザグレブ・モドリ', shortName: 'ZMO', city: 'ザグレブ', country: 'CRO', primaryColor: '#004B93', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 77 },
  { id: 'hr02', name: 'スプリト・ビリ', shortName: 'SBI', city: 'スプリト', country: 'CRO', primaryColor: '#FFFFFF', secondaryColor: '#004B93', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'hr03', name: 'リエカ・アドリア', shortName: 'RAD', city: 'リエカ', country: 'CRO', primaryColor: '#FFFFFF', secondaryColor: '#00AEEF', pattern: 'sash-diagonal', shape: 'shield', basePower: 71 },
  // ウクライナ (UKR)
  { id: 'ua01', name: 'ドネツク・マイナーズ', shortName: 'DMA', city: 'ドネツク', country: 'UKR', primaryColor: '#F37021', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 78 },
  { id: 'ua02', name: 'キーウ・ブルーホワイト', shortName: 'KBW', city: 'キーウ', country: 'UKR', primaryColor: '#FFFFFF', secondaryColor: '#0055A4', pattern: 'sash-diagonal', shape: 'diamond', basePower: 75 },
  { id: 'ua03', name: 'ジトーミル・ポリシア', shortName: 'ZPO', city: 'ジトーミル', country: 'UKR', primaryColor: '#007A3D', secondaryColor: '#FFD100', pattern: 'halves-vertical', shape: 'shield', basePower: 70 },
  // セルビア (SRB)
  { id: 'rs01', name: 'ベオグラード・レッドスター', shortName: 'BRS', city: 'ベオグラード', country: 'SRB', primaryColor: '#E30613', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 77 },
  { id: 'rs02', name: 'ベオグラード・パルチザン', shortName: 'BPA', city: 'ベオグラード', country: 'SRB', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 73 },
  { id: 'rs03', name: 'バチュカ・トポラ', shortName: 'BTO', city: 'トポラ', country: 'SRB', primaryColor: '#0055A4', secondaryColor: '#FFFFFF', pattern: 'quarters', shape: 'shield', basePower: 69 },
  // ポーランド (POL)
  { id: 'pl01', name: 'ワルシャワ・レギオン', shortName: 'WLE', city: 'ワルシャワ', country: 'POL', primaryColor: '#FFFFFF', secondaryColor: '#006633', pattern: 'sash-diagonal', shape: 'shield', basePower: 74 },
  { id: 'pl02', name: 'ビャウィストク・ヤギェ', shortName: 'BYA', city: 'ビャウィストク', country: 'POL', primaryColor: '#FFD100', secondaryColor: '#E30613', pattern: 'stripes-vertical', shape: 'shield', basePower: 72 },
  { id: 'pl03', name: 'ポズナン・レフ', shortName: 'PLE', city: 'ポズナン', country: 'POL', primaryColor: '#004B93', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 72 }
  ,
  // その他欧州各国
  { id: 'hu01', name: 'ブダペスト・フラディ', shortName: 'BFR', city: 'ブダペスト', country: 'HUN', primaryColor: '#007A3D', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 74 },
  { id: 'ro01', name: 'ブカレスト・ステアウア', shortName: 'BST', city: 'ブカレスト', country: 'ROU', primaryColor: '#E30613', secondaryColor: '#0033A0', pattern: 'stripes-vertical', shape: 'shield', basePower: 73 },
  { id: 'bg01', name: 'ラズグラド・イーグルス', shortName: 'LEA', city: 'ラズグラド', country: 'BUL', primaryColor: '#008A45', secondaryColor: '#FFFFFF', pattern: 'chevron-down', shape: 'shield', basePower: 73 },
  { id: 'sk01', name: 'ブラチスラヴァ・スロヴァン', shortName: 'BSL', city: 'ブラチスラヴァ', country: 'SVK', primaryColor: '#56A0D3', secondaryColor: '#FFFFFF', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'si01', name: 'リュブリャナ・ドラゴンズ', shortName: 'LDR', city: 'リュブリャナ', country: 'SVN', primaryColor: '#008A45', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'shield', basePower: 71 },
  { id: 'si02', name: 'ツェリェ・カウンツ', shortName: 'CCO', city: 'ツェリェ', country: 'SVN', primaryColor: '#56A0D3', secondaryColor: '#FFD100', pattern: 'sash-diagonal', shape: 'shield', basePower: 70 },
  { id: 'cy01', name: 'ニコシア・アポエル', shortName: 'NAP', city: 'ニコシア', country: 'CYP', primaryColor: '#FFD100', secondaryColor: '#0033A0', pattern: 'halves-vertical', shape: 'shield', basePower: 72 },
  { id: 'cy02', name: 'パフォス・ブルー', shortName: 'PBL', city: 'パフォス', country: 'CYP', primaryColor: '#0055A4', secondaryColor: '#FFFFFF', pattern: 'circle-center', shape: 'circle', basePower: 70 },
  { id: 'az01', name: 'アグダム・カラバフ', shortName: 'AKA', city: 'アグダム', country: 'AZE', primaryColor: '#000000', secondaryColor: '#FFFFFF', pattern: 'quarters', shape: 'shield', basePower: 74 },
  { id: 'il01', name: 'テルアビブ・イエロー', shortName: 'TYE', city: 'テルアビブ', country: 'ISR', primaryColor: '#FFD100', secondaryColor: '#0033A0', pattern: 'halves-vertical', shape: 'shield', basePower: 73 },
  { id: 'ie01', name: 'ダブリン・シャムロックス', shortName: 'DSH', city: 'ダブリン', country: 'IRL', primaryColor: '#008A45', secondaryColor: '#FFFFFF', pattern: 'stripes-horizontal', shape: 'shield', basePower: 69 },
  { id: 'is01', name: 'レイキャヴィーク・ヴィキング', shortName: 'RVI', city: 'レイキャヴィーク', country: 'ISL', primaryColor: '#E30613', secondaryColor: '#000000', pattern: 'stripes-vertical', shape: 'shield', basePower: 69 },
  { id: 'fi01', name: 'ヘルシンキ・HJK', shortName: 'HJK', city: 'ヘルシンキ', country: 'FIN', primaryColor: '#004B93', secondaryColor: '#FFFFFF', pattern: 'stripes-vertical', shape: 'shield', basePower: 70 }



];

// 欧州主要・各国クラブまとめ
function getEuropeanMajorClubDefinitions() {
  return [
    ...SPAIN_CLUBS_DEFINITIONS,
    ...ITALY_CLUBS_DEFINITIONS,
    ...GERMANY_CLUBS_DEFINITIONS,
    ...FRANCE_CLUBS_DEFINITIONS,
    ...OTHER_EURO_CLUBS_DEFINITIONS
  ];
}

function findEuropeanClubDefinitionById(clubId) {
  if (!clubId) return null;
  const allEuro = getEuropeanMajorClubDefinitions();
  return allEuro.find(c => c.id === clubId) || null;
}

function getAllBigFiveClubs() {
  const p1Clubs = (typeof CLUB_DEFINITIONS !== 'undefined') ? CLUB_DEFINITIONS : (gameState.clubs || []);
  return [
    ...p1Clubs,
    ...CHAMPIONSHIP_CLUBS_DEFINITIONS,
    ...SPAIN_CLUBS_DEFINITIONS,
    ...ITALY_CLUBS_DEFINITIONS,
    ...GERMANY_CLUBS_DEFINITIONS,
    ...FRANCE_CLUBS_DEFINITIONS,
    ...OTHER_EURO_CLUBS_DEFINITIONS
  ];
}

// ==========================================
// 2. 高速ダイジェスト試合エンジン（simQuickMatch）
// ==========================================
function simQuickMatch(homeClub, awayClub) {
  const getPower = (c) => {
    if (c && Array.isArray(c.players) && c.players.length >= 11 && typeof getPlayerOverallRating === 'function') {
      const starters = c.players.filter(p => p.isStarter && !p.isRetired);
      const lineup = starters.length >= 11 ? starters.slice(0, 11) : c.players.slice(0, 11);
      const avgOvr = Math.round(lineup.reduce((sum, p) => sum + getPlayerOverallRating(p), 0) / lineup.length);
      if (avgOvr > 0) return avgOvr;
    }
    if (c && c.basePower) {
      const isD2Uninit = String(c.id || '').startsWith('c') || c.division === 'd2';
      return isD2Uninit ? Math.max(54, c.basePower - 10) : c.basePower;
    }
    if (typeof calcClubOvr === 'function') {
      const ovr = calcClubOvr(c);
      if (ovr > 0) return ovr;
    }
    if (c && c.targetRank) return 85 - (c.targetRank * 1.5);
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
    initPreseasonCup();
    initDomesticCups();
    initEuropeanCups36();
    injectCupMatchesIntoCalendar();
  } catch (err) {
    console.error('Error in initSeasonCompetitions:', err);
  }
}

/**
 * プレシーズン・フレンドリーコンペティション（ワールド・チャレンジ・トロフィー）
 * 7月中旬〜8月上旬に国内外の招待クラブ3チームと対戦する全3試合の親善大会
 */
function initPreseasonCup() {
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  if (!playerClub) return;

  // 招待候補クラブプール（正規定義の欧州メガクラブ4チーム ＋ 正規ロスターを持つ英2部上位2チーム）
  const euroTargetIds = ['es01', 'de01', 'it01', 'fr01'];
  const euroCandidates = euroTargetIds
    .map(id => findEuropeanClubDefinitionById(id))
    .filter(Boolean);

  const d2Pool = (gameState.competitions && gameState.competitions.championship && Array.isArray(gameState.competitions.championship.clubs))
    ? gameState.competitions.championship.clubs
    : CHAMPIONSHIP_CLUBS_DEFINITIONS;
  const domesticCandidates = d2Pool
    .filter(c => c && c.id !== playerClub.id && !c.isPlayer)
    .sort((a, b) => (b.basePower || 70) - (a.basePower || 70))
    .slice(0, 2);

  const candidates = [...euroCandidates, ...domesticCandidates];

  // シャッフルして3チームを選出
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const invitedRaw = shuffled.slice(0, 3);
  const invitedClubs = invitedRaw.map(c => (Array.isArray(c.players) && c.players.length >= 11) ? c : ({
    ...c,
    isPlayer: false,
    avgOvr: c.basePower || 78
  }));

  const participants = [
    {
      id: playerClub.id,
      name: playerClub.name,
      shortName: playerClub.shortCode || playerClub.shortName || 'LON',
      shortCode: playerClub.shortCode || playerClub.shortName || 'LON',
      country: 'ENG',
      primaryColor: playerClub.primaryColor,
      secondaryColor: playerClub.secondaryColor,
      pattern: playerClub.pattern,
      shape: playerClub.shape,
      emblem: playerClub.emblem,
      isPlayer: true,
      avgOvr: playerClub.avgOvr || 78
    },
    ...invitedClubs
  ];

  // プレイヤーの3試合対戦カード（Match 1, Match 2, Match 3）＋ 同節招待クラブ同士の裏カード
  const matches = [
    {
      round: 1,
      roundName: 'グループ第1戦',
      homeId: playerClub.id,
      awayId: invitedClubs[0].id,
      otherHomeId: invitedClubs[1].id,
      otherAwayId: invitedClubs[2].id,
      homeClub: participants[0],
      awayClub: invitedClubs[0],
      otherHomeClub: invitedClubs[1],
      otherAwayClub: invitedClubs[2],
      played: false,
      homeScore: null,
      awayScore: null
    },
    {
      round: 2,
      roundName: 'グループ第2戦',
      homeId: invitedClubs[1].id,
      awayId: playerClub.id,
      otherHomeId: invitedClubs[0].id,
      otherAwayId: invitedClubs[2].id,
      homeClub: invitedClubs[1],
      awayClub: participants[0],
      otherHomeClub: invitedClubs[0],
      otherAwayClub: invitedClubs[2],
      played: false,
      homeScore: null,
      awayScore: null
    },
    {
      round: 3,
      roundName: 'トロフィー決定戦',
      homeId: playerClub.id,
      awayId: invitedClubs[2].id,
      otherHomeId: invitedClubs[0].id,
      otherAwayId: invitedClubs[1].id,
      homeClub: participants[0],
      awayClub: invitedClubs[2],
      otherHomeClub: invitedClubs[0],
      otherAwayClub: invitedClubs[1],
      played: false,
      homeScore: null,
      awayScore: null
    }
  ];

  gameState.competitions.preseasonCup = {
    name: 'ワールド・チャレンジ・トロフィー',
    shortName: 'WCT',
    shortCode: 'WCT',
    type: 'preseasonCup',
    participants,
    matches,
    currentRound: 1,
    completed: false
  };
}

// 2部リーグ（イングランド・セカンドディビジョン）
function initChampionshipLeague() {
  if (!gameState.competitions.championship) {
    gameState.competitions.championship = {
      name: 'イングランド・セカンドディビジョン',
      shortName: 'ENG-D2',
      clubs: CHAMPIONSHIP_CLUBS_DEFINITIONS.map(c => {
        const clubObj = {
          ...c,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          pts: 0
        };
        return ensurePlayableClubStructure(clubObj);
      })
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
      ensurePlayableClubStructure(c);
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

    if (typeof simulateAndRecordQuickMatchPlayerStats === 'function') {
      simulateAndRecordQuickMatchPlayerStats('d2', h, a, res.homeScore, res.awayScore, { recordOfficial: true });
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

  // リーグ・トロフィー（L-CUP: 旧リーグ杯相当 44クラブ）: 優勝特典: 賞金 + ECS出場権
  const lgcParticipants = [...p1Clubs, ...p2Clubs.slice(0, 12)];
  gameState.competitions.leagueCup = {
    name: 'リーグ・トロフィー',
    enName: 'LEAGUE TROPHY',
    shortCode: 'L-CUP',
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

  // ナショナル・カップ（N-CUP: 旧FA杯相当 44クラブ）: 優勝特典: 高額賞金 + EPC出場権
  const natParticipants = [...p1Clubs, ...p2Clubs.slice(12, 24)];
  gameState.competitions.nationalCup = {
    name: 'ナショナル・カップ',
    enName: 'NATIONAL CUP',
    shortCode: 'N-CUP',
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
 * 欧州全120クラブから前季順位・カップ結果に基づきECT(36), EPC(36), ECS(36)の計108枠へ自動エントリー
 */
function selectEuropeanCompetitionEntries() {
  const savedOrder = Array.isArray(gameState.lastSeasonStandingsOrder) ? gameState.lastSeasonStandingsOrder : null;
  const rankMap = new Map();
  if (savedOrder && savedOrder.length > 0) {
    savedOrder.forEach((id, idx) => rankMap.set(id, idx));
  }

  const premClubs = [...(gameState.clubs || [])].sort((a, b) => {
    if (rankMap.size > 0) {
      const rA = rankMap.has(a.id) ? rankMap.get(a.id) : 99;
      const rB = rankMap.has(b.id) ? rankMap.get(b.id) : 99;
      if (rA !== rB) return rA - rB;
    }
    const ptsDiff = (b.pts || 0) - (a.pts || 0);
    if (ptsDiff !== 0) return ptsDiff;
    const gdDiff = (b.gd || 0) - (a.gd || 0);
    if (gdDiff !== 0) return gdDiff;
    return (a.targetRank || 10) - (b.targetRank || 10);
  });

  const p2Clubs = [...((gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS)]
    .sort((a, b) => (b.pts || 0) - (a.pts || 0) || (b.basePower || 70) - (a.basePower || 70));
  const espClubs = [...SPAIN_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);
  const itaClubs = [...ITALY_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);
  const gerClubs = [...GERMANY_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);
  const fraClubs = [...FRANCE_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);

  const otherClubs = [...OTHER_EURO_CLUBS_DEFINITIONS].sort((a, b) => b.basePower - a.basePower);

  const cupWinners = gameState.lastSeasonCupWinners || {};
  const allEngClubs = [...premClubs, ...p2Clubs];
  const findEngClub = (id) => id ? allEngClubs.find(c => c.id === id) : null;

  const usedIds = new Set();
  const takeUnique = (list, count) => {
    const out = [];
    for (const c of list) {
      if (out.length >= count) break;
      if (c && !usedIds.has(c.id)) {
        usedIds.add(c.id);
        out.push(c);
      }
    }
    return out;
  };

  // 1. ECT (36クラブ):
  //    - ENG: 1部1〜4位（4枠）＋ 前季ECT/EPC覇者が5位以下（未出場）なら追加枠を確保
  //    - 他4大リーグ: 各4枠（計16枠）
  //    - その他欧州（POR/NED/BEL/SCO/TUR等）: 残り枠（16枠、ENG追加枠があればその分調整）
  const engCl = takeUnique(premClubs, 4);
  const ectHolder = findEngClub(cupWinners.championsCupId);
  if (ectHolder && !usedIds.has(ectHolder.id)) {
    usedIds.add(ectHolder.id);
    engCl.push(ectHolder);
  }
  const epcHolder = findEngClub(cupWinners.europaCupId);
  if (epcHolder && !usedIds.has(epcHolder.id)) {
    usedIds.add(epcHolder.id);
    engCl.push(epcHolder);
  }
  const foreignCl = [
    ...takeUnique(espClubs, 4),
    ...takeUnique(itaClubs, 4),
    ...takeUnique(gerClubs, 4),
    ...takeUnique(fraClubs, 4)
  ];
  const otherClCount = Math.max(0, 36 - engCl.length - foreignCl.length);
  const clEntries = [
    ...engCl,
    ...foreignCl,
    ...takeUnique(otherClubs, otherClCount)
  ];

  // 2. EPC (36クラブ):
  //    - ENG: N-CUP覇者（1枠）＋ 1部5位（未出場最上位1枠）の通常2枠（重複時は次順位へ繰り下げ）＋ 前季ECS覇者が未出場なら追加枠
  //    - 他4大リーグ: 各2枠（計8枠）
  //    - その他欧州: 残り枠（26枠、ENG追加枠があればその分調整）
  const engEl = [];
  const natWinner = findEngClub(cupWinners.nationalCupId);
  if (natWinner && !usedIds.has(natWinner.id)) {
    usedIds.add(natWinner.id);
    engEl.push(natWinner);
  }
  const elRemainFromLeague = Math.max(0, 2 - engEl.length);
  if (elRemainFromLeague > 0) {
    engEl.push(...takeUnique(premClubs, elRemainFromLeague));
  }
  const ecsHolder = findEngClub(cupWinners.conferenceCupId);
  if (ecsHolder && !usedIds.has(ecsHolder.id)) {
    usedIds.add(ecsHolder.id);
    engEl.push(ecsHolder);
  }
  const foreignEl = [
    ...takeUnique(espClubs, 2),
    ...takeUnique(itaClubs, 2),
    ...takeUnique(gerClubs, 2),
    ...takeUnique(fraClubs, 2)
  ];
  const otherElCount = Math.max(0, 36 - engEl.length - foreignEl.length);
  const elEntries = [
    ...engEl,
    ...foreignEl,
    ...takeUnique(otherClubs, otherElCount)
  ];

  // 3. ECS (36クラブ):
  //    - ENG: L-CUP覇者（1枠、すでにECT/EPC出場枠がある場合は1部未出場最上位へ繰り下げ）
  //    - 他4大リーグ: 各1枠（計4枠）
  //    - その他欧州: 残り枠（31枠）
  const engEcl = [];
  const lgcWinner = findEngClub(cupWinners.leagueCupId);
  if (lgcWinner && !usedIds.has(lgcWinner.id)) {
    usedIds.add(lgcWinner.id);
    engEcl.push(lgcWinner);
  } else {
    engEcl.push(...takeUnique(premClubs, 1));
  }
  const foreignEcl = [
    ...takeUnique(espClubs, 1),
    ...takeUnique(itaClubs, 1),
    ...takeUnique(gerClubs, 1),
    ...takeUnique(fraClubs, 1)
  ];
  const otherEclCount = Math.max(0, 36 - engEcl.length - foreignEcl.length);
  const eclEntries = [
    ...engEcl,
    ...foreignEcl,
    ...takeUnique(otherClubs, otherEclCount)
  ];

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
  gameState.competitions.championsCup = createSwissLeaguePhase(entries.clEntries, 'ユーロ・チャンピオンズ・トロフィー', 'EURO CHAMPIONS TROPHY', 'ECT', 30000);
  gameState.competitions.europaCup = createSwissLeaguePhase(entries.elEntries, 'ユーロ・プレステージ・カップ', 'EURO PRESTIGE CUP', 'EPC', 18000);
  gameState.competitions.conferenceCup = createSwissLeaguePhase(entries.eclEntries, 'ユーロ・カンファレンス・シールド', 'EURO CONFERENCE SHIELD', 'ECS', 10000);
}

// カレンダーにカップ戦＆欧州戦（全8試合リーグフェーズ＋PO＋決勝T）日程をマッピング
function injectCupMatchesIntoCalendar() {
  if (!gameState.calendar || gameState.calendar.length === 0) return;

  // プレイヤーが参加している欧州大会コード（ECT, EPC, ECS）の特定
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  let playerEuroCode = 'ECT';
  let playerEuroCompKey = 'championsCup';
  if (gameState.competitions && playerClub) {
    for (const ek of ['championsCup', 'europaCup', 'conferenceCup']) {
      const comp = gameState.competitions[ek];
      if (comp && comp.participants && comp.participants.some(p => p.id === playerClub.id)) {
        playerEuroCode = comp.shortCode;
        playerEuroCompKey = ek;
        break;
      }
    }
  }

  // 既存のカップ戦設定を一旦クリア
  gameState.calendar.forEach(d => {
    delete d.isCupMatchDay;
    delete d.cupCompType;
    delete d.cupRoundKey;
    delete d.euroMd;
    delete d.cupLabel;
    delete d.cupCode;
    delete d.preseasonRound;
  });

  // 0. プレシーズン親善杯（WCT）：7月中旬〜8月上旬の土曜日（全3試合）
  const preseasonScheduleList = [
    { month: 7, minDay: 15, maxDay: 21, round: 1, label: 'WCT 第1戦', code: 'WCT' },
    { month: 7, minDay: 22, maxDay: 28, round: 2, label: 'WCT 第2戦', code: 'WCT' },
    { month: 8, minDay: 1, maxDay: 7, round: 3, label: 'WCT 決勝戦', code: 'WCT' }
  ];

  preseasonScheduleList.forEach(sc => {
    let targetDay = gameState.calendar.find(d =>
      d.month === sc.month &&
      d.day >= sc.minDay &&
      d.day <= sc.maxDay &&
      d.dayOfWeek === 6 &&
      !d.isMatchDay &&
      !d.isCupMatchDay
    );
    if (!targetDay) {
      targetDay = gameState.calendar.find(d =>
        d.month === sc.month &&
        d.day >= sc.minDay &&
        d.day <= sc.maxDay &&
        !d.isMatchDay &&
        !d.isCupMatchDay
      );
    }
    if (targetDay) {
      targetDay.isCupMatchDay = true;
      targetDay.cupCompType = 'preseasonCup';
      targetDay.preseasonRound = sc.round;
      targetDay.cupLabel = sc.label;
      targetDay.cupCode = sc.code;
      targetDay.eventType = 'match';
    }
  });

  // 1. 欧州コンペ：全8試合スイス方式リーグフェーズ (MD1〜MD8) ＆ PO ＆ 決勝T（R16 / QF / SF / FINAL）
  const euroScheduleList = [
    { month: 9, minDay: 15, maxDay: 22, preferredDays: [2], compType: 'euroLeaguePhase', md: 1, label: `${playerEuroCode} MD1`, code: playerEuroCode },
    { month: 10, minDay: 1, maxDay: 10, preferredDays: [2], compType: 'euroLeaguePhase', md: 2, label: `${playerEuroCode} MD2`, code: playerEuroCode },
    { month: 10, minDay: 18, maxDay: 25, preferredDays: [2, 4], compType: 'euroLeaguePhase', md: 3, label: `${playerEuroCode} MD3`, code: playerEuroCode },
    { month: 11, minDay: 3, maxDay: 12, preferredDays: [2], compType: 'euroLeaguePhase', md: 4, label: `${playerEuroCode} MD4`, code: playerEuroCode },
    { month: 11, minDay: 22, maxDay: 29, preferredDays: [2, 4], compType: 'euroLeaguePhase', md: 5, label: `${playerEuroCode} MD5`, code: playerEuroCode },
    { month: 12, minDay: 7, maxDay: 15, preferredDays: [2], compType: 'euroLeaguePhase', md: 6, label: `${playerEuroCode} MD6`, code: playerEuroCode },
    { month: 1, minDay: 18, maxDay: 24, preferredDays: [2], compType: 'euroLeaguePhase', md: 7, label: `${playerEuroCode} MD7`, code: playerEuroCode },
    { month: 1, minDay: 25, maxDay: 31, preferredDays: [2, 4], compType: 'euroLeaguePhase', md: 8, label: `${playerEuroCode} MD8`, code: playerEuroCode },
    { month: 2, minDay: 10, maxDay: 18, preferredDays: [2], compType: 'euroPlayoff', label: `${playerEuroCode} 決勝T進出PO`, code: playerEuroCode },
    { month: 3, minDay: 3, maxDay: 11, preferredDays: [2], compType: playerEuroCompKey, roundKey: 'R16', label: `${playerEuroCode} 決勝T 1回戦`, code: playerEuroCode },
    { month: 4, minDay: 7, maxDay: 14, preferredDays: [2], compType: playerEuroCompKey, roundKey: 'QF', label: `${playerEuroCode} 準々決勝`, code: playerEuroCode },
    { month: 5, minDay: 1, maxDay: 9, preferredDays: [2, 3], compType: playerEuroCompKey, roundKey: 'SF', label: `${playerEuroCode} 準決勝`, code: playerEuroCode },
    { month: 5, minDay: 24, maxDay: 31, preferredDays: [2, 3], compType: playerEuroCompKey, roundKey: 'FINAL', label: `${playerEuroCode} 決勝`, code: playerEuroCode }
  ];

  // 欧州コンペの日程を最優先固定で割り振り（時系列順序を保証）
  let lastEuroDayIdx = -1;
  euroScheduleList.forEach(sc => {
    let targetDay = gameState.calendar.find(d => 
      d.dayIndex > lastEuroDayIdx &&
      d.month === sc.month &&
      d.day >= sc.minDay &&
      d.day <= sc.maxDay &&
      sc.preferredDays.includes(d.dayOfWeek) &&
      !d.isMatchDay &&
      !d.isCupMatchDay
    );

    if (!targetDay) {
      targetDay = gameState.calendar.find(d =>
        d.dayIndex > lastEuroDayIdx &&
        d.month === sc.month &&
        sc.preferredDays.includes(d.dayOfWeek) &&
        !d.isMatchDay &&
        !d.isCupMatchDay
      );
    }

    if (!targetDay) {
      targetDay = gameState.calendar.find(d =>
        d.dayIndex > lastEuroDayIdx &&
        d.month === sc.month &&
        [2, 3, 4].includes(d.dayOfWeek) &&
        !d.isMatchDay &&
        !d.isCupMatchDay
      );
    }

    if (targetDay) {
      targetDay.isCupMatchDay = true;
      targetDay.cupCompType = sc.compType;
      targetDay.cupRoundKey = sc.roundKey || null;
      targetDay.euroMd = sc.md || null;
      targetDay.cupLabel = sc.label;
      targetDay.cupCode = sc.code;
      targetDay.eventType = 'match';
      lastEuroDayIdx = targetDay.dayIndex;
    }
  });

  // 2. 国内カップ戦（L-CUP / N-CUP）：試合間隔インターバル検査とスライド処理
  // 週の計算ヘルパー（月曜始まり: 7/1(水)は週の3日目、offset + 2 を 7 で割る）
  const getCalendarWeekIndex = (dayIndex) => Math.floor((dayIndex + 2) / 7);

  // 指定日が国内カップ戦のスロットとして有効（最低中2日・週上限スロット制限を満たす）か検査
  const isCupSlotValid = (d, minAfterDayIdx = -1) => {
    if (!d || d.isMatchDay || d.isCupMatchDay) return false;
    if (d.dayIndex <= minAfterDayIdx) return false;
    // プレシーズン（8/15以前）またはシーズン終了期（オフシーズン）除外
    if (d.dayIndex < 45 || d.dayIndex >= 340) return false;
    // 平日ミッドウィーク（火曜: 2 または 水曜: 3）であること
    if (d.dayOfWeek !== 2 && d.dayOfWeek !== 3) return false;

    // 【最低中2日ルール】：既存の全試合（リーグ戦・欧州戦・他カップ戦）と最低3日以上（中2日以上）離れていること
    for (const other of gameState.calendar) {
      if (other.isMatchDay || other.isCupMatchDay) {
        if (Math.abs(d.dayIndex - other.dayIndex) < 3) {
          return false;
        }
      }
    }

    // 【週上限スロット制限】：同一週（月曜〜日曜）にすでにミッドウィーク試合（火・水・木）が入っていないこと
    const targetWeek = getCalendarWeekIndex(d.dayIndex);
    for (const other of gameState.calendar) {
      if ((other.isMatchDay || other.isCupMatchDay) && [2, 3, 4].includes(other.dayOfWeek)) {
        if (getCalendarWeekIndex(other.dayIndex) === targetWeek) {
          return false;
        }
      }
    }

    return true;
  };

  const domesticCupScheduleList = [
    // リーグ・トロフィー (L-CUP: R32 -> R16 -> QF -> SF -> FINAL)
    { month: 9, minDay: 22, maxDay: 30, preferredDays: [3], compType: 'leagueCup', roundKey: 'R32', label: 'L-CUP 1回戦', code: 'L-CUP' },
    { month: 10, minDay: 25, maxDay: 31, preferredDays: [3], compType: 'leagueCup', roundKey: 'R16', label: 'L-CUP 2回戦', code: 'L-CUP' },
    { month: 12, minDay: 16, maxDay: 24, preferredDays: [3], compType: 'leagueCup', roundKey: 'QF', label: 'L-CUP 準々決勝', code: 'L-CUP' },
    { month: 1, minDay: 13, maxDay: 22, preferredDays: [2, 3], compType: 'leagueCup', roundKey: 'SF', label: 'L-CUP 準決勝', code: 'L-CUP' },
    { month: 2, minDay: 22, maxDay: 28, preferredDays: [2, 3], compType: 'leagueCup', roundKey: 'FINAL', label: 'L-CUP 決勝', code: 'L-CUP' },
    // ナショナル・カップ (N-CUP: R32 -> R16 -> QF -> SF -> FINAL)
    { month: 1, minDay: 5, maxDay: 12, preferredDays: [3], compType: 'nationalCup', roundKey: 'R32', label: 'N-CUP 1回戦', code: 'N-CUP' },
    { month: 2, minDay: 3, maxDay: 12, preferredDays: [3], compType: 'nationalCup', roundKey: 'R16', label: 'N-CUP 2回戦', code: 'N-CUP' },
    { month: 3, minDay: 12, maxDay: 22, preferredDays: [3], compType: 'nationalCup', roundKey: 'QF', label: 'N-CUP 準々決勝', code: 'N-CUP' },
    { month: 4, minDay: 14, maxDay: 23, preferredDays: [2, 3], compType: 'nationalCup', roundKey: 'SF', label: 'N-CUP 準決勝', code: 'N-CUP' },
    { month: 5, minDay: 12, maxDay: 20, preferredDays: [3], compType: 'nationalCup', roundKey: 'FINAL', label: 'N-CUP 決勝', code: 'N-CUP' }
  ];

  const lastDomesticDayByComp = { leagueCup: -1, nationalCup: -1 };
  domesticCupScheduleList.forEach(sc => {
    const minAfter = lastDomesticDayByComp[sc.compType] ?? -1;

    let targetDay = gameState.calendar.find(d => 
      d.month === sc.month &&
      d.day >= sc.minDay &&
      d.day <= sc.maxDay &&
      sc.preferredDays.includes(d.dayOfWeek) &&
      isCupSlotValid(d, minAfter)
    );

    if (!targetDay) {
      targetDay = gameState.calendar.find(d =>
        d.month === sc.month &&
        sc.preferredDays.includes(d.dayOfWeek) &&
        isCupSlotValid(d, minAfter)
      );
    }

    if (!targetDay) {
      const baseDay = gameState.calendar.find(d => d.month === sc.month && d.day >= sc.minDay && d.day <= sc.maxDay) || gameState.calendar[120];
      const baseIdx = baseDay ? baseDay.dayIndex : 120;

      const candidates = gameState.calendar
        .filter(d => isCupSlotValid(d, minAfter))
        .map(d => ({ day: d, dist: Math.abs(d.dayIndex - baseIdx) }))
        .sort((a, b) => a.dist - b.dist);

      if (candidates.length > 0) {
        targetDay = candidates[0].day;
      }
    }

    if (!targetDay) {
      targetDay = gameState.calendar.find(d =>
        d.dayIndex > minAfter &&
        d.dayIndex >= 45 &&
        d.dayIndex < 345 &&
        !d.isMatchDay &&
        !d.isCupMatchDay &&
        [2, 3, 4].includes(d.dayOfWeek)
      );
    }

    if (targetDay) {
      targetDay.isCupMatchDay = true;
      targetDay.cupCompType = sc.compType;
      targetDay.cupRoundKey = sc.roundKey || null;
      targetDay.euroMd = null;
      targetDay.cupLabel = sc.label;
      targetDay.cupCode = sc.code;
      targetDay.eventType = 'match';
      lastDomesticDayByComp[sc.compType] = targetDay.dayIndex;
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

        if (typeof simulateAndRecordQuickMatchPlayerStats === 'function') {
          simulateAndRecordQuickMatchPlayerStats(ek, m.homeClub, m.awayClub, res.homeScore, res.awayScore, { recordOfficial: true });
        }
      }
    });

    // 第8節の全試合消化完了時：1〜8位がR16進出、9〜24位がプレーオフ進出
    if (md === 8 && roundMatches.every(m => m.played)) {
      finalizeEuroLeaguePhaseToKnockout(comp);
    }
  });

  return { playerMatch, playerComp };
}

// 8節終了時：1〜8位ストレート進出、9〜24位プレーオフ（PO）生成
function finalizeEuroLeaguePhaseToKnockout(comp) {
  if (!comp || comp.phase !== 'LEAGUE') return;
  comp.phase = 'PLAYOFF';

  const sorted = [...comp.participants].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));
  const top8 = sorted.slice(0, 8);
  const playoffClubs = sorted.slice(8, 24); // 9〜24位（計16チーム）

  comp.top8Direct = top8;
  comp.playoffs = generateKnockoutRound(playoffClubs);
}

function finalizeEuroPlayoffToR16(comp) {
  if (!comp || !Array.isArray(comp.playoffs) || comp.playoffs.length === 0) return;
  if (comp.phase === 'KNOCKOUT' && comp.rounds && comp.rounds.R16 && comp.rounds.R16.length > 0) return;
  if (!comp.playoffs.every(m => m.played)) return;

  const poWinners = comp.playoffs.map(m => m.winnerClub || (m.winnerId === m.homeId ? m.homeClub : m.awayClub)).filter(Boolean);
  if (poWinners.length >= 8 && comp.top8Direct) {
    comp.phase = 'KNOCKOUT';
    comp.rounds.R16 = generateKnockoutRound([...comp.top8Direct, ...poWinners]);
  }
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
        if (typeof simulateAndRecordQuickMatchPlayerStats === 'function') {
          simulateAndRecordQuickMatchPlayerStats(ek, m.homeClub, m.awayClub, res.homeScore, res.awayScore, { recordOfficial: true });
        }
      }
    });

    finalizeEuroPlayoffToR16(comp);
  });

  return { playerMatch, playerComp };
}

const ROUND_NEXT_KEYS = {
  R32: 'R16',
  R16: 'QF',
  QF: 'SF',
  SF: 'FINAL'
};

function advanceCupBracketIfRoundComplete(comp, roundKey) {
  if (!comp || !comp.rounds || !Array.isArray(comp.rounds[roundKey])) return;
  const matches = comp.rounds[roundKey];
  if (matches.length === 0 || !matches.every(m => m.played)) return;

  const winners = matches.map(m => m.winnerClub || (m.winnerId === m.homeId ? m.homeClub : m.awayClub)).filter(Boolean);
  const nextKey = ROUND_NEXT_KEYS[roundKey];
  if (nextKey) {
    if (!comp.rounds[nextKey] || comp.rounds[nextKey].length === 0) {
      comp.rounds[nextKey] = generateKnockoutRound(winners);
      comp.currentRoundKey = nextKey;
    }
  } else if (roundKey === 'FINAL' && winners[0]) {
    comp.winner = winners[0];
  }
}

// 国内カップ戦・欧州決勝Tの進行
function processCupMatchDay(compType, roundKey, skipSiblingEuro = false) {
  const euroKeys = ['championsCup', 'europaCup', 'conferenceCup'];
  if (!skipSiblingEuro && euroKeys.includes(compType)) {
    euroKeys.forEach(otherKey => {
      if (otherKey !== compType) {
        processCupMatchDay(otherKey, roundKey, true);
      }
    });
  }

  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp || !comp.rounds || !comp.rounds[roundKey]) return null;

  const matches = comp.rounds[roundKey];
  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  const pId = playerClub ? playerClub.id : null;

  let playerMatch = null;
  const winners = [];

  matches.forEach(m => {
    if (m.played) {
      if (m.winnerClub) winners.push(m.winnerClub);
      return;
    }

    const isHomePlayer = Boolean(pId && m.homeId === pId);
    const isAwayPlayer = Boolean(pId && m.awayId === pId);

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
      if (typeof simulateAndRecordQuickMatchPlayerStats === 'function') {
        simulateAndRecordQuickMatchPlayerStats(compType, m.homeClub, m.awayClub, res.homeScore, res.awayScore, { recordOfficial: true });
      }
    }
  });

  if (!playerMatch) {
    advanceCupBracketIfRoundComplete(comp, roundKey);
  }

  return { comp, matches, playerMatch, winners };
}

function finalizeCupMatch(compType, roundKey, match, userWon, homeScore, awayScore, pkHome = null, pkAway = null) {
  const comp = gameState.competitions && gameState.competitions[compType];
  if (!comp || !match) return;

  const pClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  const isPlayerHome = pClub ? (match.homeId === pClub.id) : true;
  const homeWon = isPlayerHome ? Boolean(userWon) : !userWon;

  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.pkHome = pkHome;
  match.pkAway = pkAway;
  match.played = true;
  match.winnerId = homeWon ? match.homeId : match.awayId;
  match.winnerClub = homeWon
    ? (pClub && isPlayerHome ? pClub : match.homeClub)
    : (pClub && !isPlayerHome ? pClub : match.awayClub);

  advanceCupBracketIfRoundComplete(comp, roundKey);

  if (roundKey === 'FINAL') {
    comp.winner = match.winnerClub;
    if (userWon && pClub) {
      pClub.funds = (pClub.funds || 0) + (comp.prizeMoney || 0);
      if (typeof addDailyLog === 'function') {
        addDailyLog(`🏆【祝！${comp.name} 優勝】賞金 £${((comp.prizeMoney || 0) / 1000).toFixed(1)}M をクラブ資金に獲得しました！`);
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

// 2部・昇格クラブにフル機能（20名スカッド・監督・コーチ・資金・サポーター）を保証するヘルパー
function ensurePlayableClubStructure(club) {
  if (!club) return club;
  const usedNames = new Set((club.players || []).map(p => p.name));
  // CHAMPIONSHIP_CLUBS_DEFINITIONS の basePower (65〜74) はチームOVRスケールのため、
  // createSquad 用の内部生成基準値 (51〜60) に変換して1部下位より明確に下の現実的2部水準にする
  const rawTeamOvr = typeof club.basePower === 'number' ? club.basePower : 68;
  const isD2DefinitionScale = String(club.id || '').startsWith('c') || rawTeamOvr >= 64;
  const squadGenPower = isD2DefinitionScale
    ? Math.max(50, Math.min(60, rawTeamOvr - 14))
    : Math.max(50, Math.min(60, rawTeamOvr));
  const maxAllowedD2Ovr = rawTeamOvr >= 72 ? 76 : (rawTeamOvr >= 69 ? 74 : 72);

  if (!Array.isArray(club.players) || club.players.length < 11) {
    if (typeof createSquad === 'function') {
      const rules = typeof SQUAD_NATIONALITY_RULES !== 'undefined' ? SQUAD_NATIONALITY_RULES : null;
      club.players = createSquad(squadGenPower, usedNames, {
        homeRatio: rules ? rules.D2_HOME_RATIO : 0.75,
        minHomeCount: rules ? rules.D2_MIN_HOME_COUNT : 12
      });
    } else if (typeof ALL_POSITIONS !== 'undefined' && typeof createPlayer === 'function') {
      club.players = ALL_POSITIONS.map(pos => createPlayer(pos, squadGenPower, false, usedNames));
    }
    if (Array.isArray(club.players) && typeof capGeneratedPlayerOvr === 'function') {
      club.players.forEach(p => capGeneratedPlayerOvr(p, maxAllowedD2Ovr));
    }
  }
  if (!Array.isArray(club.youthSquad) && typeof createYouthSquad === 'function') {
    club.youthSquad = createYouthSquad(usedNames);
  }
  if (typeof club.funds !== 'number') club.funds = 18000;
  if (typeof club.supporters !== 'number') club.supporters = 14000;
  if (!club.formation) club.formation = '4-3-3';
  if (!club.tactic) club.tactic = 'counter';
  if (!club.manager && typeof MANAGERS_DATABASE !== 'undefined' && typeof createManager === 'function') {
    club.manager = createManager(MANAGERS_DATABASE[0], club.id, usedNames);
  }
  if (!club.coaches && typeof createInitialCoaches === 'function') {
    club.coaches = createInitialCoaches(Boolean(club.isPlayer));
  }
  if (typeof ensureValidSquadAndStarters === 'function') {
    ensureValidSquadAndStarters(club);
  }
  if (!club.isPlayer && typeof autoSelectStarters === 'function') {
    autoSelectStarters(club);
  }
  return club;
}

// セーブ容量圧縮：competitions 内の重複クラブ参照から巨大な players / youthSquad 等を除外して軽量クローンを返す
function dehydrateCompetitionsForSave(comps) {
  if (!comps || typeof comps !== 'object') return comps;

  const slimClub = (c) => {
    if (!c || typeof c !== 'object') return c;
    return {
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      shortCode: c.shortCode,
      city: c.city,
      country: c.country,
      primaryColor: c.primaryColor,
      secondaryColor: c.secondaryColor,
      pattern: c.pattern,
      shape: c.shape,
      emblem: c.emblem,
      basePower: c.basePower,
      isPlayer: Boolean(c.isPlayer),
      avgOvr: c.avgOvr,
      played: c.played || 0,
      won: c.won || 0,
      drawn: c.drawn || 0,
      lost: c.lost || 0,
      gf: c.gf || 0,
      ga: c.ga || 0,
      gd: c.gd || 0,
      pts: c.pts || 0
    };
  };

  const slimMatch = (m) => {
    if (!m || typeof m !== 'object') return m;
    const out = {
      ...m,
      homeClub: slimClub(m.homeClub),
      awayClub: slimClub(m.awayClub),
      winnerClub: slimClub(m.winnerClub)
    };
    if (m.otherHomeClub) out.otherHomeClub = slimClub(m.otherHomeClub);
    if (m.otherAwayClub) out.otherAwayClub = slimClub(m.otherAwayClub);
    return out;
  };

  const result = {};
  for (const [key, comp] of Object.entries(comps)) {
    if (!comp || typeof comp !== 'object') {
      result[key] = comp;
      continue;
    }
    // 2部リーグ正本（championship.clubs）は選手データをそのまま保持する
    if (key === 'championship') {
      result[key] = comp;
      continue;
    }
    const copy = { ...comp };
    // pots は初期シード振り分け用の一時配列であり、保存データ容量（約1MB）を圧迫するため除外する
    if ('pots' in copy) {
      delete copy.pots;
    }
    if (Array.isArray(comp.participants)) {
      copy.participants = comp.participants.map(slimClub);
    }
    if (Array.isArray(comp.matches)) {
      copy.matches = comp.matches.map(slimMatch);
    }
    if (Array.isArray(comp.leagueSchedule)) {
      copy.leagueSchedule = comp.leagueSchedule.map(md => Array.isArray(md) ? md.map(slimMatch) : md);
    }
    if (Array.isArray(comp.playoffs)) {
      copy.playoffs = comp.playoffs.map(slimMatch);
    }
    if (comp.rounds && typeof comp.rounds === 'object') {
      const newRounds = {};
      for (const [rKey, arr] of Object.entries(comp.rounds)) {
        newRounds[rKey] = Array.isArray(arr) ? arr.map(slimMatch) : arr;
      }
      copy.rounds = newRounds;
    }
    if (comp.winner) {
      copy.winner = slimClub(comp.winner);
    }
    result[key] = copy;
  }
  return result;
}

// セーブデータ読み込み後に competitions 内のクラブ参照を正本へ再結合する
function rehydrateCompetitionsClubRefs() {
  if (!gameState || !gameState.competitions) return;
  const clubMap = new Map();
  if (Array.isArray(gameState.clubs)) {
    gameState.clubs.forEach(c => { if (c && c.id) clubMap.set(c.id, c); });
  }
  const d2Clubs = gameState.competitions.championship && gameState.competitions.championship.clubs;
  if (Array.isArray(d2Clubs)) {
    d2Clubs.forEach(c => { if (c && c.id) clubMap.set(c.id, c); });
  }

  const relinkMatch = (m) => {
    if (!m) return;
    if (m.homeId && clubMap.has(m.homeId)) m.homeClub = clubMap.get(m.homeId);
    if (m.awayId && clubMap.has(m.awayId)) m.awayClub = clubMap.get(m.awayId);
    if (m.winnerId && clubMap.has(m.winnerId)) m.winnerClub = clubMap.get(m.winnerId);
    const oHomeId = m.otherHomeId || (m.otherHomeClub && m.otherHomeClub.id);
    const oAwayId = m.otherAwayId || (m.otherAwayClub && m.otherAwayClub.id);
    if (oHomeId && clubMap.has(oHomeId)) m.otherHomeClub = clubMap.get(oHomeId);
    if (oAwayId && clubMap.has(oAwayId)) m.otherAwayClub = clubMap.get(oAwayId);
  };

  ['leagueCup', 'nationalCup', 'championsCup', 'europaCup', 'conferenceCup'].forEach(k => {
    const comp = gameState.competitions[k];
    if (!comp) return;
    if (Array.isArray(comp.leagueSchedule)) {
      comp.leagueSchedule.forEach(md => {
        if (Array.isArray(md)) md.forEach(relinkMatch);
      });
    }
    if (Array.isArray(comp.playoffs)) comp.playoffs.forEach(relinkMatch);
    if (comp.rounds && typeof comp.rounds === 'object') {
      Object.values(comp.rounds).forEach(arr => {
        if (Array.isArray(arr)) arr.forEach(relinkMatch);
      });
    }
    if (comp.winner && comp.winner.id && clubMap.has(comp.winner.id)) {
      comp.winner = clubMap.get(comp.winner.id);
    }
  });

  const pre = gameState.competitions.preseasonCup;
  if (pre && Array.isArray(pre.matches)) {
    pre.matches.forEach(relinkMatch);
  }
}

// 昇降格処理
function processPromotionAndRelegation() {
  const p1Sorted = typeof getSortedStandings === 'function' ? getSortedStandings() : [...gameState.clubs].sort((a,b) => (b.pts||0) - (a.pts||0));
  const p2Sorted = [...((gameState.competitions && gameState.competitions.championship && gameState.competitions.championship.clubs) || CHAMPIONSHIP_CLUBS_DEFINITIONS)]
    .sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  const relegatedClubs = p1Sorted.slice(Math.max(0, p1Sorted.length - 3));
  const promotedClubs = p2Sorted.slice(0, 3);

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : gameState.clubs.find(c => c.isPlayer);
  const isPlayerRelegated = Boolean(playerClub && relegatedClubs.some(c => c.id === playerClub.id));
  const isPlayerPromoted = Boolean(playerClub && promotedClubs.some(c => c.id === playerClub.id));

  const relegatedIds = new Set(relegatedClubs.map(c => c.id));
  const newP1Clubs = p1Sorted.filter(c => !relegatedIds.has(c.id));

  promotedClubs.forEach(pc => {
    ensurePlayableClubStructure(pc);
    pc.tier = 'PROMOTED';
    pc.targetRank = 17;
    pc.targetLabel = '17位以内（残留）';
    if (pc.isPlayer) {
      pc.mustPromoteImmediate = false;
    }
    newP1Clubs.push(pc);
  });

  const promotedIds = new Set(promotedClubs.map(c => c.id));
  const newP2Clubs = p2Sorted.filter(c => !promotedIds.has(c.id));
  relegatedClubs.forEach(rc => {
    rc.tier = 'RELEGATED';
    rc.targetRank = 3;
    rc.targetLabel = '3位以内（1年でのD1昇格）';
    if (rc.isPlayer) {
      rc.mustPromoteImmediate = true;
    }
    newP2Clubs.push(rc);
  });

  const playerNowInD2 = newP2Clubs.some(c => c.isPlayer);
  gameState.playerDivision = playerNowInD2 ? 'd2' : 'd1';
  gameState.selectedLeagueDivision = gameState.playerDivision;

  if (playerNowInD2) {
    newP2Clubs.forEach(c => ensurePlayableClubStructure(c));
  }

  gameState.clubs = newP1Clubs;
  if (!gameState.competitions) gameState.competitions = {};
  if (!gameState.competitions.championship) {
    gameState.competitions.championship = {
      name: 'イングランド・セカンドディビジョン',
      shortName: 'ENG-D2',
      clubs: newP2Clubs
    };
  } else {
    gameState.competitions.championship.clubs = newP2Clubs;
  }

  const result = {
    relegated: relegatedClubs.map(c => c.name),
    promoted: promotedClubs.map(c => c.name),
    isPlayerRelegated,
    isPlayerPromoted
  };

  gameState.lastPromotionRelegation = result;
  return result;
}

// ==========================================
// 6. UI描画ヘルパー
// ==========================================

// セカンドディビジョン（ENG-D2）順位表
function renderChampionshipStandingsHtml() {
  const comp = gameState.competitions && gameState.competitions.championship;
  if (!comp || !comp.clubs) return '<p class="empty-state">セカンドディビジョン（ENG-D2）データがありません</p>';

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
    const zoneClass = [c.isPlayer ? 'row-player-club' : '', rank <= 3 ? 'zone-ucl' : (rank >= 22 ? 'zone-rel' : '')].filter(Boolean).join(' ');

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
      <div class="legend-item"><span class="legend-color-box zone-ucl-bg"></span><span class="legend-text">1-3位: ファーストディビジョン（ENG-D1）自動昇格</span></div>
      <div class="legend-item"><span class="legend-color-box zone-rel-bg"></span><span class="legend-text">22-24位: 降格圏</span></div>
    </div>
  `;
  return html;
}

// 欧州コンペ：全36チーム スイス方式総合順位表描画（1〜8位緑、9〜24位黄、25〜36位赤の左端ライン統一、文字表示削除、下部注釈付き）
function renderEuroLeaguePhaseStandingsHtml(compKey) {
  const comp = gameState.competitions && gameState.competitions[compKey];
  if (!comp || !comp.participants) return '<p class="empty-state">欧州コンペデータがありません</p>';

  const playerClub = typeof getPlayerClub === 'function' ? getPlayerClub() : (gameState.clubs && gameState.clubs.find(c => c.isPlayer));
  const sorted = [...comp.participants].sort((a, b) => (b.pts||0) - (a.pts||0) || (b.gd||0) - (a.gd||0) || (b.gf||0) - (a.gf||0));

  let html = `
    <div class="table-wrapper">
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

    const isPlayer = playerClub && c.id === playerClub.id;
    const rowClass = [isPlayer ? 'row-player-club' : '', zoneClass].filter(Boolean).join(' ');

    html += `
      <tr class="${rowClass}">
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
    </div>
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
window.OTHER_EURO_CLUBS_DEFINITIONS = OTHER_EURO_CLUBS_DEFINITIONS;
window.getAllBigFiveClubs = getAllBigFiveClubs;
window.simQuickMatch = simQuickMatch;
window.simKnockoutMatch = simKnockoutMatch;
window.initSeasonCompetitions = initSeasonCompetitions;
window.advanceChampionshipWeek = advanceChampionshipWeek;
window.advanceEuroLeaguePhase = advanceEuroLeaguePhase;
window.finalizeEuroLeaguePhaseToKnockout = finalizeEuroLeaguePhaseToKnockout;
window.advanceEuroPlayoffRound = advanceEuroPlayoffRound;
window.finalizeEuroPlayoffToR16 = finalizeEuroPlayoffToR16;
window.processPromotionAndRelegation = processPromotionAndRelegation;
window.ensurePlayableClubStructure = ensurePlayableClubStructure;
window.rehydrateCompetitionsClubRefs = rehydrateCompetitionsClubRefs;
window.injectCupMatchesIntoCalendar = injectCupMatchesIntoCalendar;
window.processCupMatchDay = processCupMatchDay;
window.finalizeCupMatch = finalizeCupMatch;
window.checkScheduleCongestion = checkScheduleCongestion;
window.renderChampionshipStandingsHtml = renderChampionshipStandingsHtml;
window.renderEuroLeaguePhaseStandingsHtml = renderEuroLeaguePhaseStandingsHtml;
window.renderEuroScheduleListHtml = renderEuroScheduleListHtml;
window.renderCupBracketHtml = renderCupBracketHtml;
