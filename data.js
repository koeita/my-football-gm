/**
 * data.js - マスターデータ・定数定義・エンブレム/国旗SVG・純粋ユーティリティ関数
 * グローバルスコープ共有（index.html で最初に読み込まれる最下層モジュール）
 */

const BENCH_DRAWER_POS_ORDER = {
  'CF': 1, 'ST': 1, 'LW': 2, 'RW': 2,
  'AM': 3, 'LM': 4, 'RM': 4, 'CM': 5, 'DM': 6,
  'LB': 7, 'RB': 7, 'CB': 8,
  'GK': 9
};


const TACTIC_JP_NAMES = {
  possession: 'ポゼッション',
  gegenpress: 'ゲーゲンプレス',
  counter: 'カウンター',
  wingplay: 'ワイドアタック',
  parkthebus: 'ウルトラディフェンス'
};

function getManagerTacticLabel(key) {
  const norm = normalizeTacticKey(key);
  return TACTIC_JP_NAMES[norm] || (TACTICS_DEFINITIONS[norm] && TACTICS_DEFINITIONS[norm].name) || key;
}


// ==========================================================================
// 監督（ヘッドコーチ）＆ 指導陣マスターデータベース
// ==========================================================================

const MANAGER_RANK_DEFINITIONS = {
  S: { label: 'S', title: '世界的名将', minReputation: 6200, buffPerMatch: 0.032, highTrustBonus: 0.015, youthGrowthBonus: 0.25, allGrowthBonus: 0.20, badgeColor: '#f59e0b' },
  A: { label: 'A', title: '一流指揮官', minReputation: 4500, buffPerMatch: 0.024, highTrustBonus: 0.010, youthGrowthBonus: 0.15, allGrowthBonus: 0.10, badgeColor: '#2ecc71' },
  B: { label: 'B', title: '実力派', minReputation: 0, buffPerMatch: 0.016, highTrustBonus: 0.008, youthGrowthBonus: 0.10, allGrowthBonus: 0.0, badgeColor: '#38bdf8' },
  C: { label: 'C', title: '育成・新鋭', minReputation: 0, buffPerMatch: 0.010, highTrustBonus: 0.005, youthGrowthBonus: 0.30, allGrowthBonus: 0.0, badgeColor: '#94a3b8' }
};

const MANAGERS_DATABASE = [
  // --- Sランク（8名：世界的名将） ---
  { rank: 'S', focus: 'tactics', nationality: 'Spain', age: 53, preferredFormation: '4-1-2-3', preferredTactic: 'possession', weeklyWage: 135, bio: '精密なポジショナルプレーと圧倒的ポゼッションを信奉する名将。' },
  { rank: 'S', focus: 'motivation', nationality: 'Germany', age: 57, preferredFormation: '4-3-3', preferredTactic: 'gegenpress', weeklyWage: 130, bio: '電光石火のハイプレスと情熱的なメンタリティで圧倒する闘将。' },
  { rank: 'S', focus: 'motivation', nationality: 'Italy', age: 65, preferredFormation: '4-3-1-2', preferredTactic: 'possession', weeklyWage: 125, bio: '選手の個性を引き出す柔軟性と数々の栄冠を誇る歴戦の長老。' },
  { rank: 'S', focus: 'tactics', nationality: 'France', age: 52, preferredFormation: '4-3-3', preferredTactic: 'wingplay', weeklyWage: 128, bio: '王者の風格と卓越した戦術眼でビッグマッチを制する歴戦の勝者。' },
  { rank: 'S', focus: 'discipline', nationality: 'Argentina', age: 54, preferredFormation: '4-4-2', preferredTactic: 'parkthebus', weeklyWage: 120, bio: '堅固な4-4ブロックと不屈の闘志で相手を封殺する守備の達人。' },
  { rank: 'S', focus: 'tactics', nationality: 'Spain', age: 54, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 118, bio: '妥協なきポゼッションと高強度トレーニングで支配を極める名将。' },
  { rank: 'S', focus: 'discipline', nationality: 'Italy', age: 55, preferredFormation: '3-5-2', preferredTactic: 'counter', weeklyWage: 115, bio: '徹底した戦術規律と強烈なインテンシティで勝点をもぎ取る仕事人。' },
  { rank: 'S', focus: 'tactics', nationality: 'Germany', age: 59, preferredFormation: '4-2-3-1', preferredTactic: 'gegenpress', weeklyWage: 112, bio: '縦への推進力と徹底したゲーゲンプレスを叩き込む強豪指揮官。' },

  // --- Aランク（14名：一流指揮官） ---
  { rank: 'A', focus: 'tactics', nationality: 'Spain', age: 42, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 96, bio: '緻密なビルドアップと可変戦術で若手を統率する若き理論派。' },
  { rank: 'A', focus: 'development', nationality: 'Portugal', age: 39, preferredFormation: '3-4-3', preferredTactic: 'counter', weeklyWage: 92, bio: '3バックからのダイナミックな攻守転換で旋風を巻き起こす気鋭。' },
  { rank: 'A', focus: 'tactics', nationality: 'Spain', age: 52, preferredFormation: '4-4-2', preferredTactic: 'counter', weeklyWage: 90, bio: '対戦相手の弱点を徹底分析し勝負所で強さを発揮するカップ戦マイスター。' },
  { rank: 'A', focus: 'tactics', nationality: 'Germany', age: 51, preferredFormation: '3-5-2', preferredTactic: 'possession', weeklyWage: 94, bio: '緻密な構造論と的確な戦術采配で勝利を導く理論派。' },
  { rank: 'A', focus: 'motivation', nationality: 'Portugal', age: 61, preferredFormation: '5-3-2', preferredTactic: 'parkthebus', weeklyWage: 98, bio: '冷徹な守備組織とリアリズムで数々のタイトルを獲得したカリスマ。' },
  { rank: 'A', focus: 'discipline', nationality: 'Italy', age: 57, preferredFormation: '5-3-2', preferredTactic: 'counter', weeklyWage: 88, bio: '勝負どころを見極める「鼻差の勝利」の哲学を持つ勝負師。' },
  { rank: 'A', focus: 'development', nationality: 'England', age: 59, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 84, bio: '超ハイラインと超攻撃的スタイルを貫く攻撃サッカーの信念者。' },
  { rank: 'A', focus: 'tactics', nationality: 'Italy', age: 44, preferredFormation: '4-2-3-1', preferredTactic: 'possession', weeklyWage: 84, bio: '後方からのパス回しとサイドのアイソレーションを重んじる新世代。' },
  { rank: 'A', focus: 'motivation', nationality: 'Italy', age: 66, preferredFormation: '3-4-3', preferredTactic: 'gegenpress', weeklyWage: 85, bio: 'ピッチ全域のマンツーマンと怒涛の波状攻撃を繰り出す超攻撃派。' },
  { rank: 'A', focus: 'development', nationality: 'Netherlands', age: 48, preferredFormation: '4-1-2-3', preferredTactic: 'gegenpress', weeklyWage: 88, bio: '高い位置での連動プレスと若手の抜擢で躍進を遂げるオランダ人指揮官。' },
  { rank: 'A', focus: 'tactics', nationality: 'France', age: 49, preferredFormation: '4-2-3-1', preferredTactic: 'wingplay', weeklyWage: 86, bio: '両翼の爆発的スピードを最大限に引き出すサイドアタックの達人。' },
  { rank: 'A', focus: 'discipline', nationality: 'Croatia', age: 53, preferredFormation: '4-3-1-2', preferredTactic: 'counter', weeklyWage: 82, bio: '中盤の密度と勝負強いリアクションサッカーを極めた知将。' },
  { rank: 'A', focus: 'motivation', nationality: 'Argentina', age: 47, preferredFormation: '3-4-3', preferredTactic: 'wingplay', weeklyWage: 85, bio: '情熱的なワイドアタックと選手との強い信頼関係でチームを牽引する。' },
  { rank: 'A', focus: 'development', nationality: 'Spain', age: 44, preferredFormation: '4-1-2-3', preferredTactic: 'possession', weeklyWage: 80, bio: '技術と戦術知性を重視し、下部組織出身者を主力へと育て上げる。' },

  // --- Bランク（18名：実力派） ---
  { rank: 'B', focus: 'motivation', nationality: 'England', age: 47, preferredFormation: '4-3-3', preferredTactic: 'gegenpress', weeklyWage: 72, bio: '運動量とアグレッシブなプレッシングでチームの一体感を高める。' },
  { rank: 'B', focus: 'tactics', nationality: 'Italy', age: 45, preferredFormation: '4-2-3-1', preferredTactic: 'possession', weeklyWage: 74, bio: '自陣深くで誘い出し一気にスペースを攻略するパスサッカーの信奉者。' },
  { rank: 'B', focus: 'discipline', nationality: 'Germany', age: 50, preferredFormation: '3-4-3', preferredTactic: 'gegenpress', weeklyWage: 70, bio: '統率された3バックと鋭利なショートカウンターを得意とする実力者。' },
  { rank: 'B', focus: 'tactics', nationality: 'Portugal', age: 47, preferredFormation: '4-2-3-1', preferredTactic: 'wingplay', weeklyWage: 65, bio: 'サイドアタックと中盤のバランスに優れた堅実な手腕。' },
  { rank: 'B', focus: 'development', nationality: 'England', age: 52, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 62, bio: 'ボール保持と洗練されたパスワークで主導権を握る正統派。' },
  { rank: 'B', focus: 'discipline', nationality: 'Portugal', age: 50, preferredFormation: '5-3-2', preferredTactic: 'counter', weeklyWage: 62, bio: '強固な守備ブロックと一撃必殺のカウンターに特化した守備の職人。' },
  { rank: 'B', focus: 'motivation', nationality: 'England', age: 53, preferredFormation: '4-4-2', preferredTactic: 'counter', weeklyWage: 58, bio: '肉弾戦と魂のディフェンス、直接的なロングボールで耐え抜く武闘派。' },
  { rank: 'B', focus: 'tactics', nationality: 'Denmark', age: 46, preferredFormation: '3-5-2', preferredTactic: 'wingplay', weeklyWage: 64, bio: 'ウイングバックの上下動を軸にデータ分析を駆使するモダン指揮官。' },
  { rank: 'B', focus: 'discipline', nationality: 'Italy', age: 52, preferredFormation: '5-3-2', preferredTactic: 'parkthebus', weeklyWage: 66, bio: 'ペナルティエリアを完全に封鎖する鉄壁の守備戦術を徹底する。' },
  { rank: 'B', focus: 'development', nationality: 'Belgium', age: 43, preferredFormation: '4-2-3-1', preferredTactic: 'possession', weeklyWage: 60, bio: '若手アタッカーの才能を開花させる柔軟な攻撃戦術が持ち味。' },
  { rank: 'B', focus: 'tactics', nationality: 'Netherlands', age: 51, preferredFormation: '4-3-3', preferredTactic: 'wingplay', weeklyWage: 68, bio: '伝統的なウイングプレーとハイプレスを融合させた攻撃的スタイル。' },
  { rank: 'B', focus: 'motivation', nationality: 'France', age: 48, preferredFormation: '4-4-2', preferredTactic: 'counter', weeklyWage: 63, bio: '2トップの連係と強固な4バックで堅実に勝点を積み上げる。' },
  { rank: 'B', focus: 'discipline', nationality: 'Spain', age: 49, preferredFormation: '4-3-1-2', preferredTactic: 'possession', weeklyWage: 67, bio: '中盤ダイヤモンドで中央を支配し、規律あるプレスバックを課す。' },
  { rank: 'B', focus: 'development', nationality: 'Germany', age: 41, preferredFormation: '3-4-3', preferredTactic: 'gegenpress', weeklyWage: 65, bio: '若手主体のスカッドに圧倒的な走力と連動性を植え付ける。' },
  { rank: 'B', focus: 'motivation', nationality: 'Brazil', age: 50, preferredFormation: '4-1-2-3', preferredTactic: 'wingplay', weeklyWage: 69, bio: '自由な発想とサイドからの個人技突破を奨励する攻撃的指揮官。' },
  { rank: 'B', focus: 'discipline', nationality: 'England', age: 56, preferredFormation: '4-4-2', preferredTactic: 'parkthebus', weeklyWage: 56, bio: '残留争いの経験豊富な堅守のスペシャリスト。セットプレーに強い。' },
  { rank: 'B', focus: 'tactics', nationality: 'Portugal', age: 44, preferredFormation: '3-5-2', preferredTactic: 'counter', weeklyWage: 61, bio: '緻密なブロック守備からの縦に速いカウンターで格上を食う。' },
  { rank: 'B', focus: 'development', nationality: 'Japan', age: 46, preferredFormation: '4-2-3-1', preferredTactic: 'gegenpress', weeklyWage: 58, bio: '組織的な連動プレスと勤勉なハードワークでチーム力を底上げする。' },

  // --- Cランク（12名：育成・新鋭・下位リーグ派） ---
  { rank: 'C', focus: 'development', nationality: 'England', age: 36, preferredFormation: '4-3-3', preferredTactic: 'possession', weeklyWage: 44, bio: 'アカデミー指導から昇格した気鋭の若手育成スペシャリスト。' },
  { rank: 'C', focus: 'motivation', nationality: 'England', age: 49, preferredFormation: '4-4-2', preferredTactic: 'counter', weeklyWage: 40, bio: '下部リーグで実績を積んだ熱血漢。一体感とハードワークが武器。' },
  { rank: 'C', focus: 'discipline', nationality: 'England', age: 54, preferredFormation: '5-3-2', preferredTactic: 'parkthebus', weeklyWage: 38, bio: '徹底した守備意識とリアリズムで格上相手から勝点1を奪い取る。' },
  { rank: 'C', focus: 'development', nationality: 'Spain', age: 37, preferredFormation: '4-1-2-3', preferredTactic: 'possession', weeklyWage: 46, bio: '若手のテクニックとパスワークを伸ばすことに長けた理論派。' },
  { rank: 'C', focus: 'tactics', nationality: 'Germany', age: 38, preferredFormation: '4-2-3-1', preferredTactic: 'gegenpress', weeklyWage: 45, bio: 'データ分析とハイテンポなプレッシングを志向する新世代監督。' },
  { rank: 'C', focus: 'motivation', nationality: 'Portugal', age: 40, preferredFormation: '3-4-3', preferredTactic: 'wingplay', weeklyWage: 42, bio: 'サイドからの積極的な仕掛けでサポーターを沸かせる若き野心家。' },
  { rank: 'C', focus: 'discipline', nationality: 'Italy', age: 48, preferredFormation: '4-3-1-2', preferredTactic: 'counter', weeklyWage: 41, bio: '堅実な守備組織と集中力を切らさない規律指導に定評がある。' },
  { rank: 'C', focus: 'development', nationality: 'Netherlands', age: 39, preferredFormation: '4-3-3', preferredTactic: 'wingplay', weeklyWage: 43, bio: '両翼の若手ウインガーを育成し攻撃的サッカーを展開する。' },
  { rank: 'C', focus: 'motivation', nationality: 'France', age: 43, preferredFormation: '4-2-3-1', preferredTactic: 'counter', weeklyWage: 39, bio: '選手のメンタルケアに優れ、苦境でもロッカールームをまとめる。' },
  { rank: 'C', focus: 'discipline', nationality: 'Argentina', age: 45, preferredFormation: '5-3-2', preferredTactic: 'parkthebus', weeklyWage: 36, bio: '球際の激しさと粘り強い守備ブロックで泥臭く勝利を目指す。' },
  { rank: 'C', focus: 'development', nationality: 'Belgium', age: 37, preferredFormation: '3-5-2', preferredTactic: 'possession', weeklyWage: 42, bio: 'ユーティリティ選手の育成と可変システムに挑む研究熱心な監督。' },
  { rank: 'C', focus: 'tactics', nationality: 'Denmark', age: 42, preferredFormation: '4-4-2', preferredTactic: 'wingplay', weeklyWage: 35, bio: 'シンプルなサイドアタックとクロス攻撃で手堅く戦う実務派。' }
];

/**
 * 指導陣（COACHING STAFF）データベース（全4専門カテゴリ / 各6〜7名・複数ステータス傾向付き）
 */
const COACHES_DATABASE = {
  attacking: [
    { nationality: 'Netherlands', age: 54, rank: 'A', focus: 'coaching', weeklyWage: 35, bio: 'ファーストタッチとフィニッシュの極意を叩き込むストライカー指導の専門家。' },
    { nationality: 'France', age: 48, rank: 'A', focus: 'youthDev', weeklyWage: 33, bio: 'ボックス内での駆け引きと若手FWの得点感覚を開花させる育成派。' },
    { nationality: 'Spain', age: 46, rank: 'A', focus: 'analysis', weeklyWage: 32, bio: '相手の守備ブロックを解剖し攻撃パターンを仕込む戦術分析コーチ。' },
    { nationality: 'Italy', age: 58, rank: 'B', focus: 'analysis', weeklyWage: 24, bio: '狭いスペースでのテクニックとラストパスの精度を高める理論派。' },
    { nationality: 'England', age: 51, rank: 'B', focus: 'coaching', weeklyWage: 23, bio: '冷静な決定力と勝負所での強さを教え込むシュートコーチ。' },
    { nationality: 'Germany', age: 51, rank: 'C', focus: 'coaching', weeklyWage: 14, bio: '実戦的なポジショニングと献身的なプレスを指導する。' },
    { nationality: 'Belgium', age: 43, rank: 'C', focus: 'youthDev', weeklyWage: 13, bio: 'ドリブルでの局面打開と前線への展開を支援する若手育成型。' }
  ],
  defending: [
    { nationality: 'Netherlands', age: 52, rank: 'A', focus: 'coaching', weeklyWage: 34, bio: '圧倒的な対人強度と威圧感で最終ラインに鉄壁の統率力を注入。' },
    { nationality: 'Italy', age: 51, rank: 'A', focus: 'analysis', weeklyWage: 35, bio: '緻密なポジショニングとインターセプトの先読みを徹底指導。' },
    { nationality: 'England', age: 50, rank: 'B', focus: 'coaching', weeklyWage: 23, bio: '屈強な空中戦とフィジカルコンタクトで相手FWを封殺する。' },
    { nationality: 'France', age: 56, rank: 'B', focus: 'youthDev', weeklyWage: 25, bio: 'CBとDMの両対応、若手DFの基礎体格と対人技術を引き上げる。' },
    { nationality: 'Spain', age: 44, rank: 'B', focus: 'analysis', weeklyWage: 22, bio: '粘り強いマンマークと狡猾なラインコントロールを叩き込む。' },
    { nationality: 'Portugal', age: 45, rank: 'C', focus: 'youthDev', weeklyWage: 13, bio: 'サイドバックのポジショニングとカバーリングを基本から指導。' }
  ],
  goalkeeping: [
    { nationality: 'Denmark', age: 58, rank: 'A', focus: 'coaching', weeklyWage: 30, bio: '強烈なキャプテンシーと至近距離セーブでゴールマウスを死守。' },
    { nationality: 'Spain', age: 49, rank: 'A', focus: 'analysis', weeklyWage: 29, bio: 'PKキッカー分析とビルドアップ時の正確な配球を指導する現代派。' },
    { nationality: 'Germany', age: 55, rank: 'B', focus: 'coaching', weeklyWage: 21, bio: '広大な守備範囲と飛び出し、正確なフィードを磨き上げる。' },
    { nationality: 'England', age: 46, rank: 'B', focus: 'youthDev', weeklyWage: 20, bio: '若手GKのステップワークとハイボール処理を丁寧に育成する。' },
    { nationality: 'Italy', age: 51, rank: 'C', focus: 'coaching', weeklyWage: 12, bio: '確実なキャッチングと安定したセービング技術を実直に指導。' },
    { nationality: 'Netherlands', age: 42, rank: 'C', focus: 'youthDev', weeklyWage: 13, bio: 'アカデミー出身GKの足元技術と反射神経を伸ばす育成重視型。' }
  ],
  fitness: [
    { nationality: 'Italy', age: 58, rank: 'A', focus: 'coaching', weeklyWage: 28, bio: '欧州最先端の運動生理学に基づき、怪我予防と90分の運動量を実現。' },
    { nationality: 'Germany', age: 47, rank: 'A', focus: 'analysis', weeklyWage: 27, bio: 'GPSデータと心拍負荷を解析し、連戦時の疲労管理を最適化する。' },
    { nationality: 'France', age: 54, rank: 'B', focus: 'coaching', weeklyWage: 19, bio: '強度の高い持久走と筋力アップで強靭な肉体を作り上げる。' },
    { nationality: 'Spain', age: 43, rank: 'B', focus: 'youthDev', weeklyWage: 18, bio: '成長期選手の身体バランスを整え、怪我に強い体質へ導く。' },
    { nationality: 'England', age: 47, rank: 'C', focus: 'coaching', weeklyWage: 11, bio: '試合後の迅速な疲労回復と柔軟性維持を専門とするフィジカル派。' },
    { nationality: 'Brazil', age: 40, rank: 'C', focus: 'youthDev', weeklyWage: 12, bio: '敏捷性と爆発的なスプリント力を引き出す若手向けコンディショニング。' }
  ]
};

// イングランドリーグ（プレミア相当）全20クラブ定義（全クラブ選択可能・全38節2回戦総当たり）
// 初期資金：£32.0M〜£140.0M（32000〜140000 £K）、サポーター規模、目標順位に差を設定

const CLUB_SHORT_CODES = {
  manchester_b: 'MCB',
  manchester_r: 'MNR',
  liverpool_b: 'LVR',
  northlondon_a: 'ASA',
  london_fc: 'CHB',
  northlondon_w: 'TTW',
  newcastle_u: 'NCK',
  aston_v: 'AVV',
  brighton_g: 'BHG',
  southlondon_p: 'CPP',
  westlondon_c: 'FLW',
  westlondon_b: 'BFB',
  merseyside_b: 'EVB',
  southcoast_c: 'BMC',
  nottingham_r: 'NFR',
  ipswich_t: 'IPB',
  leeds_u: 'LDW',
  sunderland_a: 'SLR',
  coventry_c: 'CVS',
  hull_c: 'HLY',
  // 旧1部クラブ互換用
  eastlondon_h: 'WHW',
  midlands_w: 'WLG',
  leicester_f: 'LCB',
  southampton_s: 'SHR'
};

function getClubShortCode(clubOrId) {
  if (!clubOrId) return 'LFC';
  const id = typeof clubOrId === 'string' ? clubOrId : (clubOrId && clubOrId.id);
  if (id && CLUB_SHORT_CODES[id]) return CLUB_SHORT_CODES[id];
  if (typeof clubOrId === 'object' && clubOrId && clubOrId.shortName) return clubOrId.shortName;

  // 名前からCLUB_DEFINITIONSを逆引き
  const name = typeof clubOrId === 'string' ? clubOrId : (clubOrId && clubOrId.name);
  if (name) {
    const matched = CLUB_DEFINITIONS.find(c => c.name === name || name.includes(c.name));
    if (matched && CLUB_SHORT_CODES[matched.id]) return CLUB_SHORT_CODES[matched.id];
  }

  // フォールバック: 英数字から3文字抽出
  if (name) {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length >= 3) return cleaned.slice(0, 3);
  }
  return (id || 'LFC').slice(0, 3).toUpperCase();
}

/**
 * 欧州20クラブの固有エンブレム定義（形状・3色配色・伝統パターン・固有モチーフ・3文字コード）
 */
const CLUB_EMBLEM_MAP = {
  'manchester_b':  { shape: 'circle',       primaryColor: '#6ba4d9', secondaryColor: '#ffffff', accentColor: '#f5c542', pattern: 'stripes-vertical',  motif: 'ship',         code: 'MCB', symbol: 'MCB' },
  'manchester_r':  { shape: 'crest',        primaryColor: '#da020e', secondaryColor: '#7a0912', accentColor: '#ffe500', pattern: 'split-vertical',    motif: 'trident',      code: 'MNR', symbol: 'MNR' },
  'liverpool_b':   { shape: 'crown-shield', primaryColor: '#c8102e', secondaryColor: '#00b2a9', accentColor: '#f6eb61', pattern: 'solid',             motif: 'wings-flame',  code: 'LVR', symbol: 'LVR' },
  'northlondon_a': { shape: 'crest',        primaryColor: '#ef0107', secondaryColor: '#ffffff', accentColor: '#db9b32', pattern: 'sleeve-split',      motif: 'cannon',       code: 'ASA', symbol: 'ASA' },
  'london_fc':     { shape: 'circle',       primaryColor: '#034694', secondaryColor: '#ffffff', accentColor: '#dba111', pattern: 'ring',              motif: 'lion-stars',   code: 'CHB', symbol: 'CHB' },
  'northlondon_w': { shape: 'hexagon',      primaryColor: '#f4f6f9', secondaryColor: '#132257', accentColor: '#9fb0c7', pattern: 'solid',             motif: 'spurs-tower',  code: 'TTW', symbol: 'TTW' },
  'newcastle_u':   { shape: 'shield',       primaryColor: '#1a1d20', secondaryColor: '#ffffff', accentColor: '#d4af37', pattern: 'stripes-vertical',  motif: 'castle',       code: 'NCK', symbol: 'NCK' },
  'aston_v':       { shape: 'crest',        primaryColor: '#670e36', secondaryColor: '#95bfe5', accentColor: '#fee505', pattern: 'halves-horizontal', motif: 'crown-star',   code: 'AVV', symbol: 'AVV' },
  'brighton_g':    { shape: 'circle',       primaryColor: '#0057b8', secondaryColor: '#ffffff', accentColor: '#ffcc00', pattern: 'stripes-vertical',  motif: 'seagull',      code: 'BHG', symbol: 'BHG' },
  'southlondon_p': { shape: 'crest',        primaryColor: '#1b458f', secondaryColor: '#c4122e', accentColor: '#ffffff', pattern: 'stripes-vertical',  motif: 'eagle',        code: 'CPP', symbol: 'CPP' },
  'westlondon_c':  { shape: 'shield',       primaryColor: '#ffffff', secondaryColor: '#181b20', accentColor: '#cc0000', pattern: 'split-vertical',    motif: 'cross-swords', code: 'FLW', symbol: 'FLW' },
  'westlondon_b':  { shape: 'circle',       primaryColor: '#e30613', secondaryColor: '#ffffff', accentColor: '#181b20', pattern: 'quarters',          motif: 'honeycomb',    code: 'BFB', symbol: 'BFB' },
  'merseyside_b':  { shape: 'crest-tall',   primaryColor: '#003399', secondaryColor: '#ffffff', accentColor: '#f5c542', pattern: 'sash-diagonal',     motif: 'tower-laurel', code: 'EVB', symbol: 'EVB' },
  'southcoast_c':  { shape: 'shield',       primaryColor: '#da291c', secondaryColor: '#14171a', accentColor: '#f5c542', pattern: 'stripes-vertical',  motif: 'wave-star',    code: 'BMC', symbol: 'BMC' },
  'nottingham_r':  { shape: 'circle',       primaryColor: '#dd0000', secondaryColor: '#ffffff', accentColor: '#f5c542', pattern: 'solid',             motif: 'tree-stars',   code: 'NFR', symbol: 'NFR' },
  'ipswich_t':     { shape: 'shield',       primaryColor: '#004494', secondaryColor: '#ffffff', accentColor: '#de2c37', pattern: 'stripes-vertical',  motif: 'castle',       code: 'IPB', symbol: 'IPB' },
  'leeds_u':       { shape: 'crest',        primaryColor: '#ffffff', secondaryColor: '#1d428a', accentColor: '#ffcd00', pattern: 'split-vertical',    motif: 'crown-star',   code: 'LDW', symbol: 'LDW' },
  'sunderland_a':  { shape: 'shield',       primaryColor: '#eb172b', secondaryColor: '#ffffff', accentColor: '#d4af37', pattern: 'stripes-vertical',  motif: 'ship',         code: 'SLR', symbol: 'SLR' },
  'coventry_c':    { shape: 'circle',       primaryColor: '#00a3e0', secondaryColor: '#1d252c', accentColor: '#ffffff', pattern: 'halves-horizontal', motif: 'laurel',       code: 'CVS', symbol: 'CVS' },
  'hull_c':        { shape: 'shield',       primaryColor: '#f7941d', secondaryColor: '#111111', accentColor: '#ffffff', pattern: 'stripes-vertical',  motif: 'star-1',       code: 'HLY', symbol: 'HLY' },
  // 旧1部クラブ互換用
  'eastlondon_h':  { shape: 'shield',       primaryColor: '#7a263a', secondaryColor: '#1bb1e7', accentColor: '#f3d459', pattern: 'chevron',           motif: 'hammers',      code: 'WHW', symbol: 'WHW' },
  'midlands_w':    { shape: 'hexagon',      primaryColor: '#fdb913', secondaryColor: '#1e1b18', accentColor: '#ffffff', pattern: 'diagonal',          motif: 'wolf',         code: 'WLG', symbol: 'WLG' },
  'leicester_f':   { shape: 'circle',       primaryColor: '#003090', secondaryColor: '#fdbe11', accentColor: '#ffffff', pattern: 'ring',              motif: 'cinquefoil',   code: 'LCB', symbol: 'LCB' },
  'southampton_s': { shape: 'crown-shield', primaryColor: '#d71920', secondaryColor: '#ffffff', accentColor: '#f5c542', pattern: 'stripes-vertical',  motif: 'halo-wave',    code: 'SHR', symbol: 'SHR' }
};

/**
 * クラブのHome / Awayユニホームカラー定義
 */
const CLUB_KIT_MAP = {
  'manchester_b':  { home: { primary: '#6cabdd', secondary: '#ffffff' }, away: { primary: '#1c2c5b', secondary: '#f5c542' } },
  'manchester_r':  { home: { primary: '#da020e', secondary: '#ffffff' }, away: { primary: '#1a1d20', secondary: '#f3f4f6' } },
  'liverpool_b':   { home: { primary: '#c8102e', secondary: '#f6eb61' }, away: { primary: '#f4f6f9', secondary: '#00b2a9' } },
  'northlondon_a': { home: { primary: '#ef0107', secondary: '#ffffff' }, away: { primary: '#111827', secondary: '#db9b32' } },
  'london_fc':     { home: { primary: '#034694', secondary: '#ffffff' }, away: { primary: '#f8fafc', secondary: '#034694' } },
  'northlondon_w': { home: { primary: '#f8fafc', secondary: '#132257' }, away: { primary: '#132257', secondary: '#9fb0c7' } },
  'newcastle_u':   { home: { primary: '#1a1d20', secondary: '#ffffff' }, away: { primary: '#047857', secondary: '#ffffff' } },
  'aston_v':       { home: { primary: '#670e36', secondary: '#95bfe5' }, away: { primary: '#f8fafc', secondary: '#670e36' } },
  'brighton_g':    { home: { primary: '#0057b8', secondary: '#ffffff' }, away: { primary: '#facc15', secondary: '#0057b8' } },
  'southlondon_p': { home: { primary: '#1b458f', secondary: '#c4122e' }, away: { primary: '#f8fafc', secondary: '#1b458f' } },
  'westlondon_c':  { home: { primary: '#f8fafc', secondary: '#181b20' }, away: { primary: '#181b20', secondary: '#cc0000' } },
  'westlondon_b':  { home: { primary: '#e30613', secondary: '#ffffff' }, away: { primary: '#38bdf8', secondary: '#1e293b' } },
  'merseyside_b':  { home: { primary: '#003399', secondary: '#ffffff' }, away: { primary: '#f59e0b', secondary: '#003399' } },
  'southcoast_c':  { home: { primary: '#da291c', secondary: '#14171a' }, away: { primary: '#f8fafc', secondary: '#14171a' } },
  'nottingham_r':  { home: { primary: '#dd0000', secondary: '#ffffff' }, away: { primary: '#1e3a8a', secondary: '#f5c542' } },
  'ipswich_t':     { home: { primary: '#004494', secondary: '#ffffff' }, away: { primary: '#f8fafc', secondary: '#de2c37' } },
  'leeds_u':       { home: { primary: '#f8fafc', secondary: '#1d428a' }, away: { primary: '#ffcd00', secondary: '#1d428a' } },
  'sunderland_a':  { home: { primary: '#eb172b', secondary: '#ffffff' }, away: { primary: '#1e293b', secondary: '#d4af37' } },
  'coventry_c':    { home: { primary: '#00a3e0', secondary: '#ffffff' }, away: { primary: '#1d252c', secondary: '#00a3e0' } },
  'hull_c':        { home: { primary: '#f7941d', secondary: '#111111' }, away: { primary: '#f8fafc', secondary: '#111111' } },
  // 旧1部クラブ互換用
  'eastlondon_h':  { home: { primary: '#7a263a', secondary: '#1bb1e7' }, away: { primary: '#f8fafc', secondary: '#7a263a' } },
  'midlands_w':    { home: { primary: '#fdb913', secondary: '#1e1b18' }, away: { primary: '#1e1b18', secondary: '#fdb913' } },
  'leicester_f':   { home: { primary: '#003090', secondary: '#fdbe11' }, away: { primary: '#f8fafc', secondary: '#003090' } },
  'southampton_s': { home: { primary: '#d71920', secondary: '#ffffff' }, away: { primary: '#1e293b', secondary: '#f5c542' } },
  // 欧州メガクラブ
  'madrid':        { home: { primary: '#f8fafc', secondary: '#d4af37' }, away: { primary: '#1e293b', secondary: '#f59e0b' } },
  'barcelona':     { home: { primary: '#a50044', secondary: '#004d98' }, away: { primary: '#facc15', secondary: '#a50044' } },
  'munich':        { home: { primary: '#dc052d', secondary: '#ffffff' }, away: { primary: '#111827', secondary: '#dc052d' } },
  'milano':        { home: { primary: '#fb090b', secondary: '#111827' }, away: { primary: '#f8fafc', secondary: '#fb090b' } },
  'torino':        { home: { primary: '#f8fafc', secondary: '#111827' }, away: { primary: '#1e3a8a', secondary: '#facc15' } },
  'paris':         { home: { primary: '#002b49', secondary: '#da291c' }, away: { primary: '#f8fafc', secondary: '#002b49' } }
};

function parseHexToRgb(hex) {
  const clean = String(hex || '#1e3a8a').replace(/[^0-9a-fA-F]/g, '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : (clean.padEnd(6, '0').slice(0, 6));
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function getColorLuminance(hex) {
  const { r, g, b } = parseHexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getContrastTextColor(bgHex) {
  return getColorLuminance(bgHex) >= 155 ? '#111827' : '#ffffff';
}

function getColorDistance(hex1, hex2) {
  const c1 = parseHexToRgb(hex1);
  const c2 = parseHexToRgb(hex2);
  const rMean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

function resolveClubKit(clubOrId) {
  let clubObj = null;
  let clubId = '';
  let clubName = '';
  if (typeof clubOrId === 'object' && clubOrId) {
    clubObj = clubOrId;
    clubId = clubOrId.id || '';
    clubName = clubOrId.name || '';
  } else if (typeof clubOrId === 'string') {
    clubId = clubOrId;
    clubName = clubOrId;
  }

  if (clubId && CLUB_KIT_MAP[clubId]) {
    return CLUB_KIT_MAP[clubId];
  }
  if (clubObj && clubObj.kit && clubObj.kit.home && clubObj.kit.away) {
    return clubObj.kit;
  }

  // 名前やIDから既知のクラブを検索
  if (!clubObj || !clubObj.primaryColor) {
    const allBigFive = typeof getAllBigFiveClubs === 'function' ? getAllBigFiveClubs() : [];
    const matched = (typeof CLUB_DEFINITIONS !== 'undefined' && CLUB_DEFINITIONS.find(c => c.id === clubId || c.name === clubName))
      || allBigFive.find(c => c.id === clubId || c.name === clubName);
    if (matched) {
      if (matched.id && CLUB_KIT_MAP[matched.id]) return CLUB_KIT_MAP[matched.id];
      clubObj = matched;
    }
  }

  const emb = (clubId && CLUB_EMBLEM_MAP[clubId]) ? CLUB_EMBLEM_MAP[clubId] : null;
  const pColor = (clubObj && clubObj.primaryColor) || (emb && emb.primaryColor) || '#1e3a8a';
  const sColor = (clubObj && clubObj.secondaryColor) || (emb && emb.secondaryColor) || '#ffffff';

  const pLum = getColorLuminance(pColor);
  const sDist = getColorDistance(pColor, sColor);
  let awayPrimary = sDist >= 130 ? sColor : (pLum >= 145 ? '#162032' : '#f8fafc');
  if (getColorDistance(pColor, awayPrimary) < 130) {
    awayPrimary = pLum >= 145 ? '#111827' : '#f8fafc';
  }
  const awaySecondary = pColor;

  return {
    home: { primary: pColor, secondary: sColor },
    away: { primary: awayPrimary, secondary: awaySecondary }
  };
}

function resolveMatchKits(homeClub, awayClub) {
  const hKitSpec = resolveClubKit(homeClub);
  const aKitSpec = resolveClubKit(awayClub);

  const homeActive = {
    primary: hKitSpec.home.primary,
    secondary: hKitSpec.home.secondary,
    text: getContrastTextColor(hKitSpec.home.primary)
  };

  let awayCand = aKitSpec.home;
  if (getColorDistance(homeActive.primary, awayCand.primary) < 125) {
    awayCand = aKitSpec.away;
  }
  if (getColorDistance(homeActive.primary, awayCand.primary) < 120) {
    const hLum = getColorLuminance(homeActive.primary);
    awayCand = hLum >= 140
      ? { primary: '#111827', secondary: '#f5c542' }
      : { primary: '#f8fafc', secondary: '#1e293b' };
  }

  const awayActive = {
    primary: awayCand.primary,
    secondary: awayCand.secondary,
    text: getContrastTextColor(awayCand.primary)
  };

  const gkCandidates = [
    { primary: '#f1c40f', secondary: '#111827' },
    { primary: '#00d2d3', secondary: '#111827' },
    { primary: '#ff6b35', secondary: '#ffffff' },
    { primary: '#a855f7', secondary: '#ffffff' },
    { primary: '#10b981', secondary: '#ffffff' }
  ];

  const pickGkKit = (avoidHexList) => {
    for (const cand of gkCandidates) {
      if (avoidHexList.every(hex => getColorDistance(cand.primary, hex) >= 100)) {
        return { primary: cand.primary, secondary: cand.secondary, text: getContrastTextColor(cand.primary) };
      }
    }
    return { primary: '#f1c40f', secondary: '#111827', text: '#111827' };
  };

  const homeGk = pickGkKit([homeActive.primary, awayActive.primary]);
  const awayGk = pickGkKit([homeActive.primary, awayActive.primary, homeGk.primary]);

  return {
    home: homeActive,
    away: awayActive,
    homeGk,
    awayGk
  };
}

if (typeof window !== 'undefined') {
  window.CLUB_KIT_MAP = CLUB_KIT_MAP;
  window.getColorDistance = getColorDistance;
  window.getContrastTextColor = getContrastTextColor;
  window.resolveClubKit = resolveClubKit;
  window.resolveMatchKits = resolveMatchKits;
}

let emblemSvgUidCounter = 0;

/**
 * 7種のクレスト形状（外枠・クリップパス・内枠ディテール）を構築
 */
function buildEmblemShapeSpec(shape, accentColor) {
  const rimAccent = accentColor || 'rgba(255,255,255,0.45)';
  switch (shape) {
    case 'circle':
      return {
        clip: '<circle cx="50" cy="50" r="44"/>',
        border: `
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-opacity="0.95"/>
          <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(0,0,0,0.48)" stroke-width="1.5"/>
          <circle cx="50" cy="50" r="39.2" fill="none" stroke="${rimAccent}" stroke-width="0.9" stroke-opacity="0.65"/>
        `
      };
    case 'crest':
      return {
        clip: '<path d="M 15 15 Q 50 6 85 15 L 87 50 C 87 76, 50 95, 50 95 C 50 95, 13 76, 13 50 Z"/>',
        border: `
          <path d="M 15 15 Q 50 6 85 15 L 87 50 C 87 76, 50 95, 50 95 C 50 95, 13 76, 13 50 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.95" stroke-linejoin="round"/>
          <path d="M 19 19 Q 50 11 81 19 L 83 50 C 83 72, 50 89, 50 89 C 50 89, 17 72, 17 50 Z" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.4" stroke-linejoin="round"/>
        `
      };
    case 'crown-shield':
      return {
        clip: '<path d="M 14 19 L 31 10 L 50 18 L 69 10 L 86 19 L 86 52 C 86 77, 50 94, 50 94 C 50 94, 14 77, 14 52 Z"/>',
        border: `
          <path d="M 14 19 L 31 10 L 50 18 L 69 10 L 86 19 L 86 52 C 86 77, 50 94, 50 94 C 50 94, 14 77, 14 52 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.95" stroke-linejoin="round"/>
          <path d="M 18 22 L 32 15 L 50 22 L 68 15 L 82 22 L 82 51 C 82 72, 50 88, 50 88 C 50 88, 18 72, 18 51 Z" fill="none" stroke="rgba(0,0,0,0.42)" stroke-width="1.4" stroke-linejoin="round"/>
        `
      };
    case 'hexagon':
      return {
        clip: '<path d="M 50 6 L 88 26 L 88 74 L 50 94 L 12 74 L 12 26 Z"/>',
        border: `
          <path d="M 50 6 L 88 26 L 88 74 L 50 94 L 12 74 L 12 26 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.95" stroke-linejoin="round"/>
          <path d="M 50 11 L 83 28.5 L 83 71.5 L 50 89 L 17 71.5 L 17 28.5 Z" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.4" stroke-linejoin="round"/>
        `
      };
    case 'crest-tall':
      return {
        clip: '<path d="M 29 8 L 71 8 L 87 26 L 87 67 L 50 94 L 13 67 L 13 26 Z"/>',
        border: `
          <path d="M 29 8 L 71 8 L 87 26 L 87 67 L 50 94 L 13 67 L 13 26 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.95" stroke-linejoin="round"/>
          <path d="M 31 12.5 L 69 12.5 L 82.5 28 L 82.5 64.5 L 50 88.5 L 17.5 64.5 L 17.5 28 Z" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.4" stroke-linejoin="round"/>
        `
      };
    case 'diamond':
      return {
        clip: '<path d="M 50 6 L 92 50 L 50 94 L 8 50 Z"/>',
        border: `
          <path d="M 50 6 L 92 50 L 50 94 L 8 50 Z" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-opacity="0.95" stroke-linejoin="round"/>
          <path d="M 50 13 L 85 50 L 50 87 L 15 50 Z" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.5" stroke-linejoin="round"/>
        `
      };
    default:
      return {
        clip: '<path d="M 14 12 L 86 12 L 86 52 C 86 77, 50 94, 50 94 C 50 94, 14 77, 14 52 Z"/>',
        border: `
          <path d="M 14 12 L 86 12 L 86 52 C 86 77, 50 94, 50 94 C 50 94, 14 77, 14 52 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.95" stroke-linejoin="round"/>
          <path d="M 18 16 L 82 16 L 82 51 C 82 72, 50 88, 50 88 C 50 88, 18 72, 18 51 Z" fill="none" stroke="rgba(0,0,0,0.42)" stroke-width="1.4" stroke-linejoin="round"/>
        `
      };
  }
}

/**
 * 9種の伝統フィールド模様を構築
 */
function buildEmblemPatternSvg(pattern, primaryColor, secondaryColor, accentColor) {
  switch (pattern) {
    case 'stripes':
    case 'stripes-vertical':
      return `
        <rect x="19" y="0" width="13" height="100" fill="${secondaryColor}" opacity="0.92"/>
        <rect x="43.5" y="0" width="13" height="100" fill="${secondaryColor}" opacity="0.92"/>
        <rect x="68" y="0" width="13" height="100" fill="${secondaryColor}" opacity="0.92"/>
      `;
    case 'stripes-horizontal':
      return `
        <rect x="0" y="18" width="100" height="12" fill="${secondaryColor}" opacity="0.92"/>
        <rect x="0" y="44" width="100" height="12" fill="${secondaryColor}" opacity="0.92"/>
        <rect x="0" y="70" width="100" height="12" fill="${secondaryColor}" opacity="0.92"/>
      `;
    case 'split':
    case 'split-vertical':
      return `<rect x="50" y="0" width="50" height="100" fill="${secondaryColor}" opacity="0.95"/>`;
    case 'halves-horizontal':
      return `<rect x="0" y="50" width="100" height="50" fill="${secondaryColor}" opacity="0.95"/>`;
    case 'quarters':
      return `
        <rect x="50" y="0" width="50" height="50" fill="${secondaryColor}" opacity="0.95"/>
        <rect x="0" y="50" width="50" height="50" fill="${secondaryColor}" opacity="0.95"/>
      `;
    case 'diagonal':
    case 'sash-diagonal':
      return `
        <polygon points="0,10 14,0 100,86 86,100" fill="${secondaryColor}" opacity="0.92"/>
        <line x1="8" y1="0" x2="100" y2="92" stroke="${accentColor}" stroke-width="2" opacity="0.65"/>
      `;
    case 'chevron':
    case 'chevron-down':
      return `<path d="M 0 24 L 50 56 L 100 24 L 100 41 L 50 73 L 0 41 Z" fill="${secondaryColor}" opacity="0.95"/>`;
    case 'sleeve-split':
      return `
        <rect x="0" y="0" width="23" height="100" fill="${secondaryColor}" opacity="0.95"/>
        <rect x="77" y="0" width="23" height="100" fill="${secondaryColor}" opacity="0.95"/>
        <line x1="23" y1="0" x2="23" y2="100" stroke="${accentColor}" stroke-width="2" opacity="0.85"/>
        <line x1="77" y1="0" x2="77" y2="100" stroke="${accentColor}" stroke-width="2" opacity="0.85"/>
      `;
    case 'ring':
      return `
        <circle cx="50" cy="50" r="37" fill="none" stroke="${secondaryColor}" stroke-width="5.5" opacity="0.9"/>
        <circle cx="50" cy="50" r="30" fill="${primaryColor}" stroke="${accentColor}" stroke-width="1.6" opacity="0.95"/>
      `;
    case 'circle-center':
      return `
        <circle cx="50" cy="50" r="24" fill="${secondaryColor}" opacity="0.24"/>
        <circle cx="50" cy="50" r="33" fill="none" stroke="${secondaryColor}" stroke-width="2" opacity="0.5"/>
      `;
    default:
      // solid: ピンストライプ＋同心装飾
      return `
        <line x1="25" y1="0" x2="25" y2="100" stroke="${secondaryColor}" stroke-width="1.4" opacity="0.22"/>
        <line x1="50" y1="0" x2="50" y2="100" stroke="${secondaryColor}" stroke-width="1.4" opacity="0.22"/>
        <line x1="75" y1="0" x2="75" y2="100" stroke="${secondaryColor}" stroke-width="1.4" opacity="0.22"/>
        <circle cx="50" cy="50" r="33" fill="none" stroke="${secondaryColor}" stroke-width="1.8" opacity="0.3"/>
      `;
  }
}

/**
 * クラブ固有モチーフSVG（上部 y:14〜34、下部 y:67〜85 に配置してバナーと重ならない構成）
 */
function buildEmblemMotifSvg(motif, accentColor, secondaryColor) {
  const c1 = accentColor || '#f5c542';
  const c2 = secondaryColor || '#ffffff';
  const starPath = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = (i * 36 - 90) * Math.PI / 180;
      const rad = i % 2 === 0 ? r : r * 0.44;
      pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${c1}" stroke="rgba(0,0,0,0.45)" stroke-width="0.7"/>`;
  };
  const crownTop = `<path d="M 39 32 L 36 21 L 44 26 L 50 18 L 56 26 L 64 21 L 61 32 Z" fill="${c1}" stroke="rgba(0,0,0,0.55)" stroke-width="1.1" stroke-linejoin="round"/>`;
  const threeStarsBottom = `${starPath(37, 74, 4.4)}${starPath(50, 76, 5)}${starPath(63, 74, 4.4)}`;

  switch (motif) {
    case 'ship':
      return `
        <path d="M 41 25 L 49 17 L 49 27 Z M 51 27 L 51 19 L 58 26 Z" fill="${c2}" stroke="rgba(0,0,0,0.45)" stroke-width="0.8"/>
        <path d="M 38 29 L 62 29 L 57 34 L 43 34 Z" fill="${c1}" stroke="rgba(0,0,0,0.55)" stroke-width="1"/>
        ${threeStarsBottom}
      `;
    case 'trident':
      return `
        ${crownTop}
        <path d="M 50 67 L 50 83 M 43 69 L 43 74 C 43 77 57 77 57 74 L 57 69" fill="none" stroke="${c1}" stroke-width="2.4" stroke-linecap="round"/>
        <polygon points="43,66 40.5,71 45.5,71" fill="${c1}"/>
        <polygon points="50,64 47.5,70 52.5,70" fill="${c1}"/>
        <polygon points="57,66 54.5,71 59.5,71" fill="${c1}"/>
      `;
    case 'wings-flame':
      return `
        <path d="M 50 20 C 46 25 46 31 50 34 C 54 31 54 25 50 20 Z" fill="${c1}" stroke="rgba(0,0,0,0.45)" stroke-width="0.9"/>
        <path d="M 42 29 C 34 27 29 22 27 18 C 33 21 38 24 44 27 Z" fill="${c2}" opacity="0.92"/>
        <path d="M 58 29 C 66 27 71 22 73 18 C 67 21 62 24 56 27 Z" fill="${c2}" opacity="0.92"/>
        ${starPath(42, 74, 4.3)}${starPath(58, 74, 4.3)}
      `;
    case 'cannon':
      return `
        <rect x="36" y="23" width="23" height="5.5" rx="2.5" fill="${c1}" stroke="rgba(0,0,0,0.55)" stroke-width="1"/>
        <circle cx="44" cy="30" r="4.5" fill="${c1}" stroke="rgba(0,0,0,0.6)" stroke-width="1.2"/>
        <circle cx="44" cy="30" r="1.6" fill="#181b20"/>
        <path d="M 58 24 L 64 24.8 L 64 26.8 L 58 27.5 Z" fill="${c1}"/>
        ${starPath(50, 75, 5.2)}
      `;
    case 'lion-stars':
      return `
        ${crownTop}
        ${starPath(37, 74, 4.4)}${starPath(50, 76, 5.2)}${starPath(63, 74, 4.4)}
      `;
    case 'spurs-tower':
      return `
        <path d="M 50 15 L 54 27 L 59 33 L 41 33 L 46 27 Z" fill="${c2}" stroke="rgba(0,0,0,0.45)" stroke-width="1"/>
        <circle cx="50" cy="75" r="6" fill="${c2}" stroke="rgba(0,0,0,0.5)" stroke-width="1.2"/>
        <path d="M 46 73 L 54 73 M 47 77 L 53 77" stroke="#132257" stroke-width="1.2"/>
      `;
    case 'castle':
      return `
        <path d="M 36 33 L 36 22 L 41 22 L 41 25 L 46 25 L 46 21 L 54 21 L 54 25 L 59 25 L 59 22 L 64 22 L 64 33 Z" fill="${c1}" stroke="rgba(0,0,0,0.55)" stroke-width="1.1" stroke-linejoin="round"/>
        ${threeStarsBottom}
      `;
    case 'crown-star':
      return `
        ${crownTop}
        ${starPath(50, 75, 6.2)}
      `;
    case 'seagull':
      return `
        <path d="M 28 29 C 35 21 43 22 50 28 C 57 22 65 21 72 29 C 64 26 56 27 50 32 C 44 27 36 26 28 29 Z" fill="${c2}" stroke="rgba(0,0,0,0.55)" stroke-width="1.1"/>
        <path d="M 35 73 Q 42.5 69 50 73 T 65 73" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linecap="round"/>
      `;
    case 'hammers':
      return `
        <g stroke="rgba(0,0,0,0.55)" stroke-width="1">
          <line x1="39" y1="33" x2="61" y2="20" stroke="${c1}" stroke-width="2.8" stroke-linecap="round"/>
          <line x1="61" y1="33" x2="39" y2="20" stroke="${c1}" stroke-width="2.8" stroke-linecap="round"/>
          <rect x="56" y="17" width="8" height="4.5" rx="1" transform="rotate(-31 60 19)" fill="${c2}"/>
          <rect x="36" y="17" width="8" height="4.5" rx="1" transform="rotate(31 40 19)" fill="${c2}"/>
        </g>
        ${starPath(50, 75, 4.8)}
      `;
    case 'eagle':
      return `
        <path d="M 31 21 L 44 26 L 50 18 L 56 26 L 69 21 L 60 32 L 50 30 L 40 32 Z" fill="${c2}" stroke="rgba(0,0,0,0.55)" stroke-width="1" stroke-linejoin="round"/>
        ${starPath(42, 74, 4.3)}${starPath(58, 74, 4.3)}
      `;
    case 'cross-swords':
      return `
        <line x1="40" y1="32" x2="60" y2="19" stroke="${c1}" stroke-width="2.6" stroke-linecap="round"/>
        <line x1="60" y1="32" x2="40" y2="19" stroke="${c1}" stroke-width="2.6" stroke-linecap="round"/>
        <polygon points="50,67 56,74 50,81 44,74" fill="${c1}" stroke="rgba(0,0,0,0.45)" stroke-width="0.9"/>
      `;
    case 'honeycomb':
      return `
        <polygon points="50,17 57,21 57,29 50,33 43,29 43,21" fill="${c1}" stroke="#ffffff" stroke-width="1.3"/>
        <polygon points="39,23 44,26 44,32 39,35 34,32 34,26" fill="${c1}" opacity="0.85"/>
        <polygon points="61,23 66,26 66,32 61,35 56,32 56,26" fill="${c1}" opacity="0.85"/>
        ${starPath(50, 75, 4.8)}
      `;
    case 'wolf':
      return `
        <polygon points="35,20 43,24 50,21 57,24 65,20 60,33 50,35 40,33" fill="${c2}" stroke="rgba(0,0,0,0.6)" stroke-width="1" stroke-linejoin="round"/>
        <polygon points="41,26 46,28 43,30" fill="#fdb913"/>
        <polygon points="59,26 54,28 57,30" fill="#fdb913"/>
        <path d="M 41 72 L 50 80 L 59 72" fill="none" stroke="${c2}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    case 'tower-laurel':
      return `
        <path d="M 44 33 L 45 21 L 50 16 L 55 21 L 56 33 Z" fill="${c2}" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
        <path d="M 35 70 C 37 78 44 82 50 82 C 56 82 63 78 65 70" fill="none" stroke="${c1}" stroke-width="2.4" stroke-linecap="round"/>
      `;
    case 'wave-star':
      return `
        ${starPath(50, 26, 5.8)}
        <path d="M 34 73 Q 42 68 50 73 T 66 73" fill="none" stroke="${c1}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M 38 79 Q 44 75 50 79 T 62 79" fill="none" stroke="${c2}" stroke-width="1.8" stroke-linecap="round"/>
      `;
    case 'tree-stars':
      return `
        <circle cx="50" cy="23" r="6.5" fill="${c2}" stroke="rgba(0,0,0,0.45)" stroke-width="1"/>
        <rect x="48.5" y="27" width="3" height="7" fill="${c2}"/>
        ${starPath(42, 74, 4.8)}${starPath(58, 74, 4.8)}
      `;
    case 'cinquefoil':
      return `
        <circle cx="50" cy="21" r="3.4" fill="${c1}"/>
        <circle cx="45" cy="25" r="3.4" fill="${c1}"/>
        <circle cx="55" cy="25" r="3.4" fill="${c1}"/>
        <circle cx="47" cy="30" r="3.4" fill="${c1}"/>
        <circle cx="53" cy="30" r="3.4" fill="${c1}"/>
        <circle cx="50" cy="25.5" r="2.2" fill="#003090"/>
        ${threeStarsBottom}
      `;
    case 'halo-wave':
      return `
        <ellipse cx="50" cy="24" rx="11" ry="3.8" fill="none" stroke="${c1}" stroke-width="2.4"/>
        <path d="M 35 74 Q 42.5 69 50 74 T 65 74" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linecap="round"/>
      `;
    case 'crown':
      return `${crownTop}${starPath(50, 75, 4.8)}`;
    case 'stars-3':
      return `${starPath(50, 26, 5.2)}${threeStarsBottom}`;
    case 'laurel':
      return `
        ${starPath(50, 26, 5)}
        <path d="M 36 70 C 39 78 45 81 50 81 C 55 81 61 78 64 70" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linecap="round"/>
      `;
    default:
      return `${starPath(50, 26, 5.2)}${starPath(50, 75, 4.6)}`;
  }
}

/**
 * クラブオブジェクト・ID・名称から統一エンブレム設定（3文字コード・形状・配色・模様・モチーフ）を解決する
 */
function resolveClubEmblemConfig(clubOrNameOrId) {
  let clubId = '';
  let clubName = '';
  let clubObj = null;
  let emblemConf = null;

  if (typeof clubOrNameOrId === 'object') {
    clubObj = clubOrNameOrId;
    clubId = clubOrNameOrId.id || '';
    clubName = clubOrNameOrId.name || '';
    emblemConf = clubOrNameOrId.emblem || (clubId ? CLUB_EMBLEM_MAP[clubId] : null);
  } else if (typeof clubOrNameOrId === 'string') {
    if (CLUB_EMBLEM_MAP[clubOrNameOrId]) {
      clubId = clubOrNameOrId;
      emblemConf = CLUB_EMBLEM_MAP[clubOrNameOrId];
    } else {
      clubName = clubOrNameOrId;
      const allBigFive = typeof getAllBigFiveClubs === 'function' ? getAllBigFiveClubs() : [];
      const matchedClub = (typeof gameState !== 'undefined' && Array.isArray(gameState.clubs) && gameState.clubs.find(c => c.name === clubName || c.id === clubName || clubName.includes(c.name)))
        || (typeof CLUB_DEFINITIONS !== 'undefined' && CLUB_DEFINITIONS.find(c => c.name === clubName || c.id === clubName || clubName.includes(c.name)))
        || allBigFive.find(c => c.name === clubName || c.id === clubName);
      if (matchedClub) {
        clubObj = matchedClub;
        clubId = matchedClub.id || '';
        clubName = matchedClub.name || clubName;
        emblemConf = matchedClub.emblem || (clubId ? CLUB_EMBLEM_MAP[clubId] : null);
      }
    }
  }

  const code = getClubShortCode(clubObj || clubId || clubName);
  if (emblemConf) {
    return {
      shape: emblemConf.shape || 'shield',
      primaryColor: emblemConf.primaryColor || '#1e3a8a',
      secondaryColor: emblemConf.secondaryColor || '#ffffff',
      accentColor: emblemConf.accentColor || '#f5c542',
      pattern: emblemConf.pattern || 'solid',
      motif: emblemConf.motif || 'star-1',
      code: emblemConf.code || code
    };
  }

  // competitions.js 等で定義されたクラブ（primaryColor / pattern / shortName あり）
  const src = clubObj;
  const seedStr = clubName || clubId || code;
  const seed = seedStr.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  if (src && src.primaryColor) {
    const shapes = ['shield', 'crest', 'crown-shield', 'circle', 'hexagon', 'crest-tall', 'diamond'];
    const baseShape = src.shape || shapes[seed % shapes.length];
    const resolvedShape = (baseShape === 'shield' && seed % 3 === 1) ? 'crest'
      : (baseShape === 'shield' && seed % 5 === 0) ? 'crown-shield'
      : baseShape;
    const pow = Number(src.basePower) || 72;
    const autoMotif = pow >= 82 ? 'crown' : (pow >= 78 ? 'stars-3' : (seed % 2 === 0 ? 'laurel' : 'star-1'));
    return {
      shape: resolvedShape,
      primaryColor: src.primaryColor,
      secondaryColor: src.secondaryColor || '#ffffff',
      accentColor: src.accentColor || '#f5c542',
      pattern: src.pattern || 'stripes-vertical',
      motif: src.motif || autoMotif,
      code
    };
  }

  // フォールバック生成（未定義クラブ名等）
  const shapes = ['shield', 'crest', 'circle', 'hexagon', 'crest-tall', 'diamond'];
  const patterns = ['stripes-vertical', 'sash-diagonal', 'chevron', 'quarters', 'split-vertical', 'halves-horizontal'];
  const motifs = ['crown', 'stars-3', 'laurel', 'star-1'];
  const palettes = [
    { p: '#1e3a8a', s: '#ffffff', a: '#f5c542' },
    { p: '#b91c1c', s: '#ffffff', a: '#f5c542' },
    { p: '#047857', s: '#ffffff', a: '#f5c542' },
    { p: '#4c1d95', s: '#f3e8ff', a: '#f5c542' },
    { p: '#0f172a', s: '#38bdf8', a: '#ffffff' },
    { p: '#c2410c', s: '#ffffff', a: '#f5c542' },
    { p: '#0284c7', s: '#ffffff', a: '#f5c542' },
    { p: '#831843', s: '#fbcfe8', a: '#f5c542' }
  ];
  const pal = palettes[seed % palettes.length];
  return {
    shape: shapes[seed % shapes.length],
    primaryColor: pal.p,
    secondaryColor: pal.s,
    accentColor: pal.a,
    pattern: patterns[seed % patterns.length],
    motif: motifs[seed % motifs.length],
    code
  };
}

/**
 * クラブエンブレム（バッジ）を動的インラインSVGとして生成する
 * 外部画像不要・高精細ベクター多層クレスト・全クラブ3文字コード統一
 * @param {Object|string} clubOrNameOrId クラブオブジェクト、ID、またはクラブ名
 * @param {number} size 表示ピクセルサイズ（width/height）
 * @param {string} extraClass 追加CSSクラス名
 * @returns {string} インラインSVGタグ文字列
 */
function getClubEmblemSvg(clubOrNameOrId, size = 24, extraClass = '') {
  if (!clubOrNameOrId) return '';

  const { shape, primaryColor, secondaryColor, accentColor, pattern, motif, code } = resolveClubEmblemConfig(clubOrNameOrId);
  const uid = 'emb-' + (++emblemSvgUidCounter);
  const shapeSpec = buildEmblemShapeSpec(shape, accentColor);
  const patternElements = buildEmblemPatternSvg(pattern, primaryColor, secondaryColor, accentColor);
  const motifElements = buildEmblemMotifSvg(motif, accentColor, secondaryColor);
  const bannerBorderColor = accentColor || secondaryColor || '#ffffff';

  // 中央横断バナー帯：背景模様と文字が干渉せず、18pxでも3文字コードがくっきり読める
  const bannerSvg = shape === 'circle'
    ? `
      <rect x="4" y="38" width="92" height="24" fill="rgba(12, 16, 22, 0.90)"/>
      <line x1="4" y1="38.8" x2="96" y2="38.8" stroke="${bannerBorderColor}" stroke-width="1.8"/>
      <line x1="4" y1="61.2" x2="96" y2="61.2" stroke="${bannerBorderColor}" stroke-width="1.8"/>
    `
    : `
      <rect x="6" y="38" width="88" height="24" fill="rgba(12, 16, 22, 0.90)"/>
      <line x1="6" y1="38.8" x2="94" y2="38.8" stroke="${bannerBorderColor}" stroke-width="1.8"/>
      <line x1="6" y1="61.2" x2="94" y2="61.2" stroke="${bannerBorderColor}" stroke-width="1.8"/>
    `;

  return `
    <svg class="club-emblem ${extraClass}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:inline-block; vertical-align:middle; flex-shrink:0;">
      <defs>
        <clipPath id="${uid}">
          ${shapeSpec.clip}
        </clipPath>
      </defs>
      <g clip-path="url(#${uid})">
        <rect x="0" y="0" width="100" height="100" fill="${primaryColor}"/>
        ${patternElements}
        ${motifElements}
        ${bannerSvg}
      </g>
      ${shapeSpec.border}
      <text x="50" y="51" font-family="'Barlow Condensed', 'Roboto Mono', 'Arial Black', sans-serif" font-weight="800" font-size="24" letter-spacing="1.2" text-anchor="middle" dominant-baseline="central" fill="#ffffff">${code}</text>
    </svg>
  `.trim();
}

// チーム選択モーダル用：目標・実力別の排他的4区分定義
const CLUB_SELECT_CATEGORIES = {
  title_ucl: {
    key: 'title_ucl',
    label: '優勝・CL圏',
    mobileLabel: '優勝・CL',
    targetHint: '目標 1〜5位',
    badgeClass: 'cat-title-ucl'
  },
  euro_race: {
    key: 'euro_race',
    label: '欧州カップ狙い',
    mobileLabel: '欧州狙い',
    targetHint: '目標 6〜9位',
    badgeClass: 'cat-euro-race'
  },
  mid_table: {
    key: 'mid_table',
    label: '中位定着',
    mobileLabel: '中位定着',
    targetHint: '目標 10〜15位',
    badgeClass: 'cat-mid-table'
  },
  relegation: {
    key: 'relegation',
    label: '残留争い',
    mobileLabel: '残留争い',
    targetHint: '目標 16〜17位',
    badgeClass: 'cat-relegation'
  }
};

function getClubSelectCategory(clubDef) {
  if (!clubDef) return 'mid_table';
  if (clubDef.category && CLUB_SELECT_CATEGORIES[clubDef.category]) {
    return clubDef.category;
  }
  const rank = typeof clubDef.targetRank === 'number' ? clubDef.targetRank : 12;
  if (rank <= 5) return 'title_ucl';
  if (rank <= 9) return 'euro_race';
  if (rank <= 15) return 'mid_table';
  return 'relegation';
}

const CLUB_DEFINITIONS = [
  {
    id: 'manchester_b',
    emblem: CLUB_EMBLEM_MAP['manchester_b'],
    kit: CLUB_KIT_MAP['manchester_b'],
    name: 'マンチェスター B',
    category: 'title_ucl',
    tier: 'MEGA RICH',
    desc: '潤沢な資金と世界屈指の戦力を誇る強豪クラブ',
    basePower: 76,
    initialFunds: 298000, // £298.0M
    supporters: 21500,
    targetRank: 1,
    targetLabel: '1位（優勝）',
    defaultTactic: 'possession',
    defaultFormation: '4-1-2-3'
  },
  {
    id: 'manchester_r',
    emblem: CLUB_EMBLEM_MAP['manchester_r'],
    kit: CLUB_KIT_MAP['manchester_r'],
    name: 'マンチェスター R',
    category: 'title_ucl',
    tier: 'TRADITIONAL',
    desc: '世界的な人気と莫大な商業収入を持つ伝統の赤い名門',
    basePower: 74,
    initialFunds: 284000, // £284.0M
    supporters: 22000,
    targetRank: 3,
    targetLabel: '3位以内',
    defaultTactic: 'counter',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'liverpool_b',
    emblem: CLUB_EMBLEM_MAP['liverpool_b'],
    kit: CLUB_KIT_MAP['liverpool_b'],
    name: 'リヴァプール R',
    category: 'title_ucl',
    tier: 'CONTENDER',
    desc: '熱狂的なサポーターと激しいゲーゲンプレスを武器とする強豪',
    basePower: 75,
    initialFunds: 264000, // £264.0M
    supporters: 21000,
    targetRank: 2,
    targetLabel: '2位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-3-3'
  },
  {
    id: 'northlondon_a',
    emblem: CLUB_EMBLEM_MAP['northlondon_a'],
    kit: CLUB_KIT_MAP['northlondon_a'],
    name: 'アーセナル A',
    category: 'title_ucl',
    tier: 'CONTENDER',
    desc: '華麗なパスサッカーと若手育成に定評がある北ロンドンの雄',
    basePower: 75,
    initialFunds: 282000, // £282.0M
    supporters: 20500,
    targetRank: 1,
    targetLabel: '1位（優勝）',
    defaultTactic: 'possession',
    defaultFormation: '4-3-3'
  },
  {
    id: 'london_fc',
    emblem: CLUB_EMBLEM_MAP['london_fc'],
    kit: CLUB_KIT_MAP['london_fc'],
    name: 'チェルシー B',
    category: 'title_ucl',
    tier: 'AMBITIOUS',
    desc: '積極的な大型補強で欧州王座奪還を狙う西ロンドンの強豪',
    basePower: 72,
    initialFunds: 239000, // £239.0M
    supporters: 19000,
    targetRank: 4,
    targetLabel: '4位以内',
    defaultTactic: 'possession',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'northlondon_w',
    emblem: CLUB_EMBLEM_MAP['northlondon_w'],
    kit: CLUB_KIT_MAP['northlondon_w'],
    name: 'トッテナム W',
    category: 'title_ucl',
    tier: 'BIG CLUB',
    desc: '最新鋭スタジアムと前線からの速攻を備える北ロンドンの白百合',
    basePower: 71,
    initialFunds: 204000, // £204.0M
    supporters: 18500,
    targetRank: 5,
    targetLabel: '5位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'newcastle_u',
    emblem: CLUB_EMBLEM_MAP['newcastle_u'],
    kit: CLUB_KIT_MAP['newcastle_u'],
    name: 'ニューカッスル K',
    category: 'euro_race',
    tier: 'RISING FORCE',
    desc: '新オーナー参入で急成長を遂げる北部の熱狂的クラブ',
    basePower: 70,
    initialFunds: 191000, // £191.0M
    supporters: 18000,
    targetRank: 6,
    targetLabel: '6位以内',
    defaultTactic: 'wingplay',
    defaultFormation: '4-3-3'
  },
  {
    id: 'aston_v',
    emblem: CLUB_EMBLEM_MAP['aston_v'],
    kit: CLUB_KIT_MAP['aston_v'],
    name: 'アストンヴィラ V',
    category: 'euro_race',
    tier: 'CHALLENGER',
    desc: '智将のもとで欧州カップ戦出場を狙うバーミンガムの古豪',
    basePower: 69,
    initialFunds: 166000, // £166.0M
    supporters: 16800,
    targetRank: 6,
    targetLabel: '6位以内',
    defaultTactic: 'counter',
    defaultFormation: '4-4-2'
  },
  {
    id: 'brighton_g',
    emblem: CLUB_EMBLEM_MAP['brighton_g'],
    kit: CLUB_KIT_MAP['brighton_g'],
    name: 'ブライトン G',
    category: 'euro_race',
    tier: 'SMART SCOUT',
    desc: 'データ分析と独自スカウティングでビッグクラブに挑む新興勢力',
    basePower: 67,
    initialFunds: 148000, // £148.0M
    supporters: 15000,
    targetRank: 8,
    targetLabel: '8位以内',
    defaultTactic: 'possession',
    defaultFormation: '3-4-3'
  },
  {
    id: 'southlondon_p',
    emblem: CLUB_EMBLEM_MAP['southlondon_p'],
    kit: CLUB_KIT_MAP['southlondon_p'],
    name: 'クリスタルパレス P',
    category: 'euro_race',
    tier: 'MID TABLE',
    desc: '抜群の身体能力を持つウイングと育成組織が光る南ロンドンの雄',
    basePower: 66,
    initialFunds: 142000, // £142.0M
    supporters: 14800,
    targetRank: 9,
    targetLabel: '9位以内',
    defaultTactic: 'wingplay',
    defaultFormation: '3-4-3'
  },
  {
    id: 'westlondon_c',
    emblem: CLUB_EMBLEM_MAP['westlondon_c'],
    kit: CLUB_KIT_MAP['westlondon_c'],
    name: 'フラム W',
    category: 'mid_table',
    tier: 'MID TABLE',
    desc: 'テムズ川沿いの伝統スタジアムを本拠とする西ロンドンの古豪',
    basePower: 65,
    initialFunds: 131000, // £131.0M
    supporters: 14000,
    targetRank: 11,
    targetLabel: '11位以内',
    defaultTactic: 'wingplay',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'westlondon_b',
    emblem: CLUB_EMBLEM_MAP['westlondon_b'],
    kit: CLUB_KIT_MAP['westlondon_b'],
    name: 'ブレントフォード B',
    category: 'mid_table',
    tier: 'MONEYBALL',
    desc: '徹底した統計モデルとセットプレー戦術で1部に定着した知性派',
    basePower: 64,
    initialFunds: 127000, // £127.0M
    supporters: 13200,
    targetRank: 12,
    targetLabel: '12位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '3-5-2'
  },
  {
    id: 'merseyside_b',
    emblem: CLUB_EMBLEM_MAP['merseyside_b'],
    kit: CLUB_KIT_MAP['merseyside_b'],
    name: 'エヴァートン B',
    category: 'mid_table',
    tier: 'TRADITIONAL',
    desc: '長年1部リーグを守り続けるマージーサイドの誇り高き青き伝統',
    basePower: 64,
    initialFunds: 128000, // £128.0M
    supporters: 15500,
    targetRank: 13,
    targetLabel: '13位以内',
    defaultTactic: 'parkthebus',
    defaultFormation: '4-4-2'
  },
  {
    id: 'southcoast_c',
    emblem: CLUB_EMBLEM_MAP['southcoast_c'],
    kit: CLUB_KIT_MAP['southcoast_c'],
    name: 'ボーンマス C',
    category: 'mid_table',
    tier: 'CHALLENGER',
    desc: '南部のリゾート都市を拠点にアグレッシブなサッカーを展開',
    basePower: 63,
    initialFunds: 122000, // £122.0M
    supporters: 12500,
    targetRank: 14,
    targetLabel: '14位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-3-1-2'
  },
  {
    id: 'nottingham_r',
    emblem: CLUB_EMBLEM_MAP['nottingham_r'],
    kit: CLUB_KIT_MAP['nottingham_r'],
    name: 'ノッティンガム R',
    category: 'mid_table',
    tier: 'HISTORIC',
    desc: 'かつて欧州連覇を成し遂げた歴史を持つ伝統のフォレスト',
    basePower: 63,
    initialFunds: 121000, // £121.0M
    supporters: 13800,
    targetRank: 15,
    targetLabel: '15位以内',
    defaultTactic: 'counter',
    defaultFormation: '5-3-2'
  },
  {
    id: 'leeds_u',
    emblem: CLUB_EMBLEM_MAP['leeds_u'],
    kit: CLUB_KIT_MAP['leeds_u'],
    name: 'リーズ W',
    category: 'mid_table',
    tier: 'TRADITIONAL',
    desc: '熱狂的なサポーターと運動量豊富なサッカーで1部へ定着した北部の名門',
    basePower: 62,
    initialFunds: 118000, // £118.0M
    supporters: 15000,
    targetRank: 15,
    targetLabel: '15位以内',
    defaultTactic: 'gegenpress',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'sunderland_a',
    emblem: CLUB_EMBLEM_MAP['sunderland_a'],
    kit: CLUB_KIT_MAP['sunderland_a'],
    name: 'サンダーランド R',
    category: 'relegation',
    tier: 'HISTORIC',
    desc: '巨大なスタジアムと熱い地元の声援を背に1部で戦う北東部の古豪',
    basePower: 61,
    initialFunds: 108000, // £108.0M
    supporters: 14200,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'counter',
    defaultFormation: '4-4-2'
  },
  {
    id: 'ipswich_t',
    emblem: CLUB_EMBLEM_MAP['ipswich_t'],
    kit: CLUB_KIT_MAP['ipswich_t'],
    name: 'イプスウィッチ B',
    category: 'relegation',
    tier: 'PROMOTED',
    desc: '組織力と攻撃的なスタイルで1部残留に挑む東部の昇格組',
    basePower: 60,
    initialFunds: 99000, // £99.0M
    supporters: 11800,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'possession',
    defaultFormation: '4-2-3-1'
  },
  {
    id: 'coventry_c',
    emblem: CLUB_EMBLEM_MAP['coventry_c'],
    kit: CLUB_KIT_MAP['coventry_c'],
    name: 'コヴェントリー S',
    category: 'relegation',
    tier: 'PROMOTED',
    desc: '粘り強い戦いで2部から這い上がり1部の舞台へ戻ってきた中部の古豪',
    basePower: 59,
    initialFunds: 95000, // £95.0M
    supporters: 11400,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'counter',
    defaultFormation: '3-5-2'
  },
  {
    id: 'hull_c',
    emblem: CLUB_EMBLEM_MAP['hull_c'],
    kit: CLUB_KIT_MAP['hull_c'],
    name: 'ハル Y',
    category: 'relegation',
    tier: 'PROMOTED',
    desc: '堅実な守備とカウンターを武器に大舞台での生き残りを懸ける挑戦者',
    basePower: 59,
    initialFunds: 94000, // £94.0M
    supporters: 11000,
    targetRank: 17,
    targetLabel: '17位以内（残留）',
    defaultTactic: 'parkthebus',
    defaultFormation: '5-3-2'
  }
];

// 他国（スペイン、ドイツ、イタリア、フランス）の主要メガクラブ（欧州強豪データとして内部保持）
const EUROPEAN_MEGA_CLUBS = [
  { id: 'madrid',
    emblem: CLUB_EMBLEM_MAP['madrid'], kit: CLUB_KIT_MAP['madrid'], name: 'レアルマドリード W', country: 'スペイン', basePower: 75, budget: 120000 },
  { id: 'barcelona',
    emblem: CLUB_EMBLEM_MAP['barcelona'], kit: CLUB_KIT_MAP['barcelona'], name: 'バルセロナ G', country: 'スペイン', basePower: 73, budget: 95000 },
  { id: 'munich',
    emblem: CLUB_EMBLEM_MAP['munich'], kit: CLUB_KIT_MAP['munich'], name: 'バイエルン R', country: 'ドイツ', basePower: 74, budget: 105000 },
  { id: 'milano',
    emblem: CLUB_EMBLEM_MAP['milano'], kit: CLUB_KIT_MAP['milano'], name: 'ミラン R', country: 'イタリア', basePower: 71, budget: 82000 },
  { id: 'torino',
    emblem: CLUB_EMBLEM_MAP['torino'], kit: CLUB_KIT_MAP['torino'], name: 'ユヴェントス W', country: 'イタリア', basePower: 71, budget: 85000 },
  { id: 'paris',
    emblem: CLUB_EMBLEM_MAP['paris'], kit: CLUB_KIT_MAP['paris'], name: 'パリ B', country: 'フランス', basePower: 73, budget: 115000 }
];

// 12ポジション定義とカテゴリ分類
const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'CF'];

const POS_DISPLAY_ORDER = {
  GK: 1,
  CB: 2,
  LB: 3,
  LWB: 3,
  RB: 4,
  RWB: 4,
  DM: 5,
  CM: 6,
  LM: 7,
  RM: 8,
  AM: 9,
  LW: 10,
  RW: 11,
  CF: 12
};

const POS_ROLE_GROUP = {
  GK: 'GK',
  CB: 'DF',
  LB: 'DF',
  RB: 'DF',
  LWB: 'DF',
  RWB: 'DF',
  DM: 'MF',
  CM: 'MF',
  LM: 'MF',
  RM: 'MF',
  AM: 'MF',
  LW: 'FW',
  RW: 'FW',
  CF: 'FW'
};

// 全8種類のフォーメーション定義（ピッチ座標 x: 0〜100%, y: 0〜100% ※上が相手ゴール方向）
const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 69 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 75 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 75 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 69 },
      { slotIndex: 5, pos: 'DM', label: 'DM', x: 50, y: 57 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 26, y: 42 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 74, y: 42 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 18, y: 22 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 15 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 82, y: 22 }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 76 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 70 },
      { slotIndex: 5, pos: 'DM', label: 'LDM', x: 33, y: 56 },
      { slotIndex: 6, pos: 'DM', label: 'RDM', x: 67, y: 56 },
      { slotIndex: 7, pos: 'LM', label: 'LM', x: 16, y: 36 },
      { slotIndex: 8, pos: 'AM', label: 'AM', x: 50, y: 35 },
      { slotIndex: 9, pos: 'RM', label: 'RM', x: 84, y: 36 },
      { slotIndex: 10, pos: 'CF', label: 'CF', x: 50, y: 15 }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 69 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 75 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 75 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 69 },
      { slotIndex: 5, pos: 'LM', label: 'LM', x: 14, y: 46 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 37, y: 49 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 63, y: 49 },
      { slotIndex: 8, pos: 'RM', label: 'RM', x: 86, y: 46 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 18 }
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'CB', label: 'LCB', x: 22, y: 73 },
      { slotIndex: 2, pos: 'CB', label: 'CB', x: 50, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 78, y: 73 },
      { slotIndex: 4, pos: 'DM', label: 'DM', x: 50, y: 57 },
      { slotIndex: 5, pos: 'LM', label: 'LM', x: 13, y: 43 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 34, y: 41 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 66, y: 41 },
      { slotIndex: 8, pos: 'RM', label: 'RM', x: 87, y: 43 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 18 }
    ]
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'CB', label: 'LCB', x: 22, y: 73 },
      { slotIndex: 2, pos: 'CB', label: 'CB', x: 50, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 78, y: 73 },
      { slotIndex: 4, pos: 'LM', label: 'LM', x: 14, y: 47 },
      { slotIndex: 5, pos: 'CM', label: 'LCM', x: 37, y: 50 },
      { slotIndex: 6, pos: 'CM', label: 'RCM', x: 63, y: 50 },
      { slotIndex: 7, pos: 'RM', label: 'RM', x: 86, y: 47 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 18, y: 21 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 15 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 82, y: 21 }
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LWB', label: 'LWB', x: 12, y: 62 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 29, y: 74 },
      { slotIndex: 3, pos: 'CB', label: 'CB', x: 50, y: 77 },
      { slotIndex: 4, pos: 'CB', label: 'RCB', x: 71, y: 74 },
      { slotIndex: 5, pos: 'RWB', label: 'RWB', x: 88, y: 62 },
      { slotIndex: 6, pos: 'CM', label: 'LCM', x: 24, y: 44 },
      { slotIndex: 7, pos: 'CM', label: 'CM', x: 50, y: 48 },
      { slotIndex: 8, pos: 'CM', label: 'RCM', x: 76, y: 44 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 18 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 18 }
    ]
  },
  '4-1-2-3': {
    name: '4-1-2-3',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 76 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 70 },
      { slotIndex: 5, pos: 'DM', label: 'DM', x: 50, y: 58 },
      { slotIndex: 6, pos: 'AM', label: 'LAM', x: 31, y: 40 },
      { slotIndex: 7, pos: 'AM', label: 'RAM', x: 69, y: 40 },
      { slotIndex: 8, pos: 'LW', label: 'LW', x: 17, y: 20 },
      { slotIndex: 9, pos: 'CF', label: 'CF', x: 50, y: 14 },
      { slotIndex: 10, pos: 'RW', label: 'RW', x: 83, y: 20 }
    ]
  },
  '4-3-1-2': {
    name: '4-3-1-2',
    slots: [
      { slotIndex: 0, pos: 'GK', label: 'GK', x: 50, y: 88 },
      { slotIndex: 1, pos: 'LB', label: 'LB', x: 14, y: 70 },
      { slotIndex: 2, pos: 'CB', label: 'LCB', x: 37, y: 76 },
      { slotIndex: 3, pos: 'CB', label: 'RCB', x: 63, y: 76 },
      { slotIndex: 4, pos: 'RB', label: 'RB', x: 86, y: 70 },
      { slotIndex: 5, pos: 'CM', label: 'LCM', x: 24, y: 50 },
      { slotIndex: 6, pos: 'DM', label: 'DM', x: 50, y: 56 },
      { slotIndex: 7, pos: 'CM', label: 'RCM', x: 76, y: 50 },
      { slotIndex: 8, pos: 'AM', label: 'AM', x: 50, y: 34 },
      { slotIndex: 9, pos: 'CF', label: 'LCF', x: 34, y: 16 },
      { slotIndex: 10, pos: 'CF', label: 'RCF', x: 66, y: 16 }
    ]
  }
};

// スタメン11枠の基準ポジション数（4-3-3ベース）
const REQUIRED_STARTERS = {
  GK: 1,
  CB: 2,
  LB: 1,
  RB: 1,
  DM: 1,
  CM: 2,
  LM: 0,
  RM: 0,
  AM: 0,
  LW: 1,
  RW: 1,
  CF: 1
};

// 1チームの初期27名構成（スタメン11名＋控え・ベンチ外16名の現実的トップチーム編成）
const SQUAD_COMPOSITION = [
  { pos: 'GK', total: 3, starters: 1 },  // GK 3名 (スタメン1, 控え2)
  { pos: 'CB', total: 5, starters: 2 },  // CB 5名 (スタメン2, 控え3)
  { pos: 'LB', total: 2, starters: 1 },  // LB 2名 (スタメン1, 控え1)
  { pos: 'RB', total: 2, starters: 1 },  // RB 2名 (スタメン1, 控え1)
  { pos: 'DM', total: 2, starters: 1 },  // DM 2名 (スタメン1, 控え1)
  { pos: 'CM', total: 4, starters: 2 },  // CM 4名 (スタメン2, 控え2)
  { pos: 'LM', total: 1, starters: 0 },  // LM 1名 (控え1)
  { pos: 'RM', total: 1, starters: 0 },  // RM 1名 (控え1)
  { pos: 'AM', total: 2, starters: 0 },  // AM 2名 (控え2)
  { pos: 'LW', total: 1, starters: 1 },  // LW 1名 (スタメン1)
  { pos: 'RW', total: 1, starters: 1 },  // RW 1名 (スタメン1)
  { pos: 'CF', total: 3, starters: 1 }   // CF 3名 (スタメン1, 控え2)
];

// 所属選手の上限枠（実質無制限の最大50名、常設ユースチーム最大10名）
const MAX_SQUAD_SIZE = 50;
const MAX_YOUTH_SQUAD_SIZE = 10;

// プレミア順位賞金テーブル（全20位、単位：£1K -> 1位 £42.0M 〜 20位 £5.0M）
const PRIZE_MONEY_TABLE = [
  42000, 38000, 34000, 30000, 27000,
  24000, 21500, 19000, 17000, 15000,
  13500, 12000, 10500, 9200, 8000,
  7000, 6200, 5800, 5400, 5000
];

// セカンドディビジョン（ENG-D2）順位賞金テーブル（全24位、単位：£1K -> 1位 £14.0M 〜 24位 £1.5M）
const PRIZE_MONEY_TABLE_D2 = [
  14000, 12000, 10500, 8500, 7500, 6800,
  6200, 5600, 5100, 4700, 4300, 4000,
  3700, 3400, 3100, 2900, 2700, 2500,
  2300, 2100, 1900, 1800, 1650, 1500
];

// 6つの成長曲線（growthCurve）再定義マスタ
const GROWTH_CURVES = [
  { id: 'early_fade',     label: '早熟・急落型', peakAge: 23, riseSlope: 2.3, fallSlope: 1.9 },
  { id: 'early_long',     label: '早熟・持続型', peakAge: 24, riseSlope: 2.0, fallSlope: 0.9 },
  { id: 'standard',       label: '標準型',       peakAge: 27, riseSlope: 1.5, fallSlope: 1.1 },
  { id: 'steady_iron',    label: '持続・鉄人型', peakAge: 28, riseSlope: 1.3, fallSlope: 0.65 },
  { id: 'late_bloom',     label: '晩成型',       peakAge: 29, riseSlope: 1.1, fallSlope: 0.75 },
  { id: 'fragile_genius', label: 'ガラスの天才', peakAge: 25, riseSlope: 2.1, fallSlope: 1.5 }
];

const LEGACY_GROWTH_CURVE_MAP = {
  early: 'early_fade',
  normal: 'standard',
  standard: 'standard',
  late: 'late_bloom',
  fragile: 'fragile_genius'
};

// 5大チーム戦術スタイル定義
const TACTICS_DEFINITIONS = {
  possession: {
    name: 'ポゼッション（ショートパス主導）',
    badge: 'POSSESSION',
    aim: 'ボール支配率を高めてじっくり相手を崩す。',
    effect: '中盤の配球力と技術が高いほど主導権を握りやすく、安定した試合運びで格下相手の取りこぼしを防ぐ。',
    desc: '【ポゼッション（Possession / ショートパス主導）】狙い：ボール支配率を高めてじっくり相手を崩す。 ／ 特徴：中盤の配球力と技術が高いほど主導権を握りやすく、安定した試合運びで格下相手の取りこぼしを防ぐ。'
  },
  gegenpress: {
    name: 'ゲーゲンプレス（前線奪取速攻）',
    badge: 'GEGENPRESS',
    aim: '敵陣深くから激しく奪い、敵ゴール前で一気に仕留める。',
    effect: '前線からの連動プレスで多くの決定機を創出するが、終盤の消耗が激しく、試合終盤の失点や負傷リスクが高まる。',
    desc: '【ゲーゲンプレス（Gegenpress / 前線奪取速攻）】狙い：敵陣深くから激しく奪い、敵ゴール前で一気に仕留める。 ／ 特徴：前線からの連動プレスで多くの決定機を創出するが、終盤の消耗が激しく、試合終盤の失点や負傷リスクが高まる。'
  },
  counter: {
    name: 'ダイレクトカウンター（堅守ロング速攻）',
    badge: 'DIRECT COUNTER',
    aim: '自陣に引き込んで守り、奪ったら前線の快足FWへ一撃ロングボール。',
    effect: '俊足を誇るアタッカーが輝く堅守速攻。強豪相手にも一撃で勝機を見出せ、90分を通じた体力消耗も抑えられる。',
    desc: '【ダイレクトカウンター（Direct Counter / 堅守ロング速攻）】狙い：自陣に引き込んで守り、奪ったら前線の快足FWへ一撃ロングボール。 ／ 特徴：俊足を誇るアタッカーが輝く堅守速攻。強豪相手にも一撃で勝機を見出せ、90分を通じた体力消耗も抑えられる。'
  },
  wingplay: {
    name: 'ワイドアタック（サイドアタック）',
    badge: 'WING PLAY',
    aim: '両翼（WG/SB/WB）の突破とクロスで中央密集を外から崩す。',
    effect: 'ウイングとサイドバックの突破力・クロス精度が鍵を握り、中央を固める相手の守備ブロックを外からこじ開ける。',
    desc: '【ワイドアタック（Wing Play / サイドアタック）】狙い：両翼（WG/SB/WB）の突破とクロスで中央密集を外から崩す。 ／ 特徴：ウイングとサイドバックの突破力・クロス精度が鍵を握り、中央を固める相手の守備ブロックを外からこじ開ける。'
  },
  parkthebus: {
    name: 'ウルトラディフェンス（徹底堅守）',
    badge: 'PARK THE BUS',
    aim: '11人全員が自陣バイタルエリアを埋めてゴール前に鍵をかける。',
    effect: 'ゴール前に強固な守備ブロックを築いて失点を極限まで抑えるが、攻撃の手数は大きく制限される。リード死守や強豪相手の勝点1狙いに有効。',
    desc: '【ウルトラディフェンス（Park the Bus / 徹底堅守）】狙い：11人全員が自陣バイタルエリアを埋めてゴール前に鍵をかける。 ／ 特徴：ゴール前に強固な守備ブロックを築いて失点を極限まで抑えるが、攻撃の手数は大きく制限される。リード死守や強豪相手の勝点1狙いに有効。'
  }
};

/**
 * 旧セーブデータ等の戦術キー（highpress 等）を5大戦術キーへ正規化するヘルパー
 */
function normalizeTacticKey(tacticKey) {
  if (tacticKey === 'highpress') return 'gegenpress';
  if (tacticKey && TACTICS_DEFINITIONS[tacticKey]) return tacticKey;
  return 'possession';
}

// 国籍別・架空欧州選手名データ辞書（各First Name 25種以上、Last Name 35種以上）
const NATIONALITY_NAME_DATABASE = {
  England: {
    firstNames: [
      'Jack', 'Oliver', 'Harry', 'George', 'Noah', 'Charlie', 'Jacob', 'Alfie', 'Freddie', 'Oscar',
      'Leo', 'Arthur', 'Thomas', 'Henry', 'William', 'Edward', 'Archie', 'Joshua', 'Mason', 'Lucas',
      'Liam', 'Callum', 'James', 'Ethan', 'Dylan', 'Samuel', 'Daniel', 'Luke'
    ],
    lastNames: [
      'Bennett', 'Cooper', 'Harrison', 'Turner', 'Palmer', 'Morgan', 'Hughes', 'Edwards', 'Foster', 'Fletcher',
      'Carter', 'Hayes', 'Brooks', 'Jenkins', 'Collins', 'Reynolds', 'Butler', 'Shaw', 'Marshall', 'Barnes',
      'Russell', 'Powell', 'Bryant', 'Crawford', 'Griffin', 'Wallace', 'Dixon', 'Cole', 'Barrett', 'Henderson',
      'Pearson', 'Spencer', 'Hopkins', 'Chapman', 'Mason', 'Ellis', 'Richards'
    ]
  },
  France: {
    firstNames: [
      'Mathis', 'Lucas', 'Theo', 'Hugo', 'Maxime', 'Arthur', 'Louis', 'Gabriel', 'Jules', 'Raphael',
      'Antoine', 'Leo', 'Alexandre', 'Thomas', 'Paul', 'Enzo', 'Clement', 'Nathan', 'Valentin', 'Simon',
      'Bastien', 'Julien', 'Adrien', 'Florian', 'Romain', 'Alexis', 'Pierre'
    ],
    lastNames: [
      'Dubois', 'Leroy', 'Moreau', 'Laurent', 'Lefebvre', 'Roux', 'Fournier', 'Girard', 'Bonnet', 'Mercier',
      'Blanc', 'Guerin', 'Boyer', 'Garnier', 'Chevalier', 'Francois', 'Legrand', 'Gauthier', 'Perrin', 'Robin',
      'Clement', 'Morin', 'Nicolas', 'Roussel', 'Mathieu', 'Marchand', 'Duval', 'Denis', 'Fabre', 'Masson',
      'Charpentier', 'Colin', 'Renard', 'Brunet', 'Picard', 'Vidal', 'Gaillard'
    ]
  },
  Spain: {
    firstNames: [
      'Alejandro', 'Mateo', 'Lucas', 'Daniel', 'Pablo', 'Alvaro', 'Adrian', 'David', 'Diego', 'Javier',
      'Mario', 'Marcos', 'Manuel', 'Sergio', 'Carlos', 'Hugo', 'Gonzalo', 'Martin', 'Jorge', 'Nicolas',
      'Ivan', 'Ruben', 'Miguel', 'Raul', 'Hector', 'Fernando', 'Rodrigo'
    ],
    lastNames: [
      'Vega', 'Navarro', 'Serrano', 'Romero', 'Torres', 'Ramirez', 'Flores', 'Benitez', 'Aguilar', 'Medina',
      'Castro', 'Vargas', 'Herrera', 'Guzman', 'Mendez', 'Ortiz', 'Morales', 'Delgado', 'Pena', 'Cabrera',
      'Rios', 'Santana', 'Cordero', 'Rivas', 'Gallego', 'Pacheco', 'Valenzuela', 'Miranda', 'Carrillo', 'Soler',
      'Marquez', 'Duran', 'Cano', 'Garrido', 'Blanco', 'Cortez', 'Campos'
    ]
  },
  Germany: {
    firstNames: [
      'Lukas', 'Leon', 'Luca', 'Finn', 'Jonas', 'Felix', 'Noah', 'Elias', 'Paul', 'Maximilian',
      'Ben', 'Niklas', 'Tim', 'Julian', 'Jan', 'David', 'Philipp', 'Moritz', 'Simon', 'Florian',
      'Erik', 'Alexander', 'Fabian', 'Sebastian', 'Tobias', 'Nico', 'Marcel'
    ],
    lastNames: [
      'Richter', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Klein', 'Wolf', 'Schröder', 'Neumann',
      'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz',
      'Krause', 'Meier', 'Lehmann', 'Schmid', 'Köhler', 'Herrmann', 'Walter', 'König', 'Mayer', 'Huber',
      'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz', 'Vogel', 'Frank'
    ]
  },
  Italy: {
    firstNames: [
      'Alessandro', 'Lorenzo', 'Mattia', 'Leonardo', 'Gabriele', 'Riccardo', 'Matteo', 'Tommaso', 'Edoardo', 'Federico',
      'Marco', 'Andrea', 'Simone', 'Luca', 'Christian', 'Davide', 'Pietro', 'Filippo', 'Samuele', 'Alessio',
      'Giovanni', 'Nicolo', 'Jacopo', 'Manuel', 'Daniele', 'Michele', 'Gianluca'
    ],
    lastNames: [
      'Ferri', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'De Luca', 'Moretti',
      'Conti', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Barbieri', 'Fontana', 'Santoro', 'Mariani',
      'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale',
      'Serra', 'Coppola', 'De Angelis', 'Palumbo', 'Marchetti', 'Fabbri', 'Riva'
    ]
  },
  Netherlands: {
    firstNames: [
      'Daan', 'Sem', 'Milan', 'Levi', 'Lucas', 'Luuk', 'Finn', 'Jesse', 'Bram', 'Lars',
      'Liam', 'Thomas', 'Ruben', 'Julian', 'Thijs', 'Tim', 'Stijn', 'Mees', 'Mats', 'Sam',
      'Max', 'Sven', 'Jasper', 'Niels', 'Jelle', 'Koen', 'Floris'
    ],
    lastNames: [
      'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos',
      'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'Hoekstra',
      'Maas', 'Verhoeven', 'Willems', 'van Beek', 'Hermans', 'Martens', 'Schouten', 'Huisman', 'Sanders', 'Blom',
      'Prins', 'van Loon', 'Post', 'Koster', 'van Vliet', 'Kramer', 'Evers'
    ]
  },

  Portugal: {
    firstNames: [
      'Rodrigo', 'Martim', 'Afonso', 'Tomas', 'Tiago', 'Diogo', 'Lourenco', 'Miguel', 'Gabriel', 'Lucas',
      'Duarte', 'Goncalo', 'Guilherme', 'Santiago', 'Pedro', 'Salvador', 'Joao', 'Rafael', 'Francisco', 'Vicente',
      'Andre', 'Bruno', 'Dinis', 'Gustavo', 'Mateus', 'Ruben', 'Fabio'
    ],
    lastNames: [
      'Ferreira', 'Silva', 'Santos', 'Oliveira', 'Pereira', 'Costa', 'Martins', 'Sousa', 'Rodrigues', 'Fernandes',
      'Goncalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira',
      'Correia', 'Mendes', 'Nunes', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha', 'Neves', 'Coelho', 'Cunha',
      'Pires', 'Ramos', 'Reis', 'Simoes', 'Faria', 'Borges', 'Tavares'
    ]
  },
  Brazil: {
    firstNames: [
      'Gabriel', 'Lucas', 'Matheus', 'Guilherme', 'Gustavo', 'Felipe', 'Rafael', 'Leonardo', 'Vinicius', 'Rodrigo',
      'Pedro', 'Thiago', 'Bruno', 'Caio', 'Eduardo', 'Diego', 'Henrique', 'Vitor', 'Daniel', 'Samuel',
      'Arthur', 'Igor', 'Renan', 'Davi', 'Murilo', 'Otavio', 'Brenner'
    ],
    lastNames: [
      'Barbosa', 'Ribeiro', 'Nascimento', 'Carvalho', 'Araujo', 'Souza', 'Lima', 'Rocha', 'Dias', 'Ramos',
      'Moreira', 'Alves', 'Castro', 'Monteiro', 'Mendes', 'Barros', 'Freitas', 'Cardozo', 'Correia', 'Cunha',
      'Farias', 'Nogueira', 'Guimaraes', 'Borges', 'Pacheco', 'Miranda', 'Rezende', 'Fonseca', 'Antunes', 'Silveira',
      'Prado', 'Peixoto', 'Medeiros', 'Moura', 'Viana', 'Pinheiro', 'Macedo'
    ]
  },
  Argentina: {
    firstNames: [
      'Joaquin', 'Bautista', 'Santino', 'Valentin', 'Tomas', 'Facundo', 'Benjamin', 'Lautaro', 'Thiago', 'Agustin',
      'Nicolas', 'Franco', 'Julian', 'Martin', 'Nahuel', 'Lucas', 'Matias', 'Santiago', 'Ignacio', 'Rodrigo',
      'Ramiro', 'Emiliano', 'Gonzalo', 'Luciano', 'Manuel', 'Maxi', 'Enzo'
    ],
    lastNames: [
      'Rossi', 'Benitez', 'Medina', 'Herrera', 'Castro', 'Guzman', 'Rios', 'Peralta', 'Ibanez', 'Romero',
      'Cardozo', 'Maidana', 'Carrizo', 'Acuna', 'Coronel', 'Quiroga', 'Farias', 'Vera', 'Godoy', 'Lucero',
      'Paez', 'Villalba', 'Luna', 'Dominguez', 'Ferreyra', 'Toledo', 'Ponce', 'Roldan', 'Juarez', 'Bustos',
      'Figueroa', 'Arias', 'Cabrera', 'Leiva', 'Sosa', 'Montenegro', 'Escobar'
    ]
  },
  Belgium: {
    firstNames: [
      'Lucas', 'Louis', 'Nathan', 'Arthur', 'Noah', 'Maxime', 'Jules', 'Thomas', 'Milan', 'Hugo',
      'Liam', 'Gabriel', 'Victor', 'Mathis', 'Adam', 'Alexander', 'Elias', 'Robin', 'Simon', 'Emile',
      'Vincent', 'Ruben', 'Kevin', 'Cedric', 'Axel', 'Arno', 'Gilles'
    ],
    lastNames: [
      'Peeters', 'Janssens', 'Maes', 'Jacobs', 'Willems', 'Mertens', 'Claes', 'Goossens', 'Wouters', 'De Smet',
      'Vermeulen', 'Pauwels', 'Hermans', 'Aerts', 'Michiels', 'Martens', 'Thijs', 'Smets', 'Devos', 'Hendrickx',
      'Coppens', 'Van Damme', 'De Ridder', 'Dubois', 'Lambert', 'Dupont', 'Fontaine', 'Leroy', 'Bertrand', 'Renard',
      'Collet', 'Denis', 'Dumont', 'Gerard', 'Martin', 'Vandamme', 'Carlier'
    ]
  },
  Croatia: {
    firstNames: [
      'Luka', 'Ivan', 'Marko', 'David', 'Filip', 'Petar', 'Josip', 'Jakov', 'Mateo', 'Fran',
      'Leon', 'Borna', 'Roko', 'Ante', 'Mihael', 'Lovro', 'Karlo', 'Marin', 'Toni', 'Domagoj',
      'Nikola', 'Bruno', 'Gabriel', 'Tin', 'Dario', 'Kristijan', 'Stipe'
    ],
    lastNames: [
      'Horvat', 'Kovacevic', 'Babic', 'Maric', 'Juric', 'Novak', 'Kovacic', 'Vukovic', 'Knezevic', 'Markovic',
      'Petrovic', 'Tomic', 'Bosnjak', 'Radic', 'Grgic', 'Pavlic', 'Kolar', 'Vidovic', 'Simic', 'Blazevic',
      'Lovric', 'Grubisic', 'Bozic', 'Peric', 'Varga', 'Loncar', 'Filipovic', 'Katic', 'Saric', 'Pavic',
      'Matos', 'Bradaric', 'Jurcevic', 'Vranjes', 'Basic', 'Bilic', 'Olic'
    ]
  },
  Japan: {
    firstNames: [
      'Ren', 'Haruto', 'Sota', 'Yuto', 'Riku', 'Kaito', 'Minato', 'Sora', 'Takumi', 'Daiki',
      'Ryota', 'Kensuke', 'Shota', 'Kota', 'Naoki', 'Kazuki', 'Tomoya', 'Hayato', 'Yuma', 'Ryusei',
      'Taichi', 'Yuya', 'Keisuke', 'Tsubasa', 'Shinji', 'Kohei', 'Aoi'
    ],
    lastNames: [
      'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
      'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Saito', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu',
      'Yamazaki', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Yamashita', 'Ishikawa', 'Nakajima', 'Maeda', 'Fujiwara',
      'Ogawa', 'Goto', 'Okada', 'Hasegawa', 'Murakami', 'Endo', 'Aoki'
    ]
  }
};

// 国籍リスト（欧州主要国・南米・アジア）
const NATIONALITIES = [
  'England', 'France', 'Spain', 'Germany', 'Italy',
  'Netherlands', 'Portugal', 'Brazil', 'Argentina', 'Belgium',
  'Croatia', 'Japan'
];

/**
 * Windows等のPC環境でも確実に美しい国旗を描画するためのインラインSVG国旗マップ（比率3:2）
 */
const NATIONALITY_FLAG_SVG = {
  England: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#ffffff"/><rect x="7" width="4" height="12" fill="#cf142b"/><rect y="4" width="18" height="4" fill="#cf142b"/></svg>',
  France: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#002395"/><rect x="6" width="6" height="12" fill="#ffffff"/><rect x="12" width="6" height="12" fill="#ed2939"/></svg>',
  Spain: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="3" fill="#aa151b"/><rect y="3" width="18" height="6" fill="#f1bf00"/><rect y="9" width="18" height="3" fill="#aa151b"/><rect x="3.5" y="4.5" width="2" height="3" fill="#aa151b" rx="0.5"/></svg>',
  Germany: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#000000"/><rect y="4" width="18" height="4" fill="#dd0000"/><rect y="8" width="18" height="4" fill="#ffce00"/></svg>',
  Italy: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#009246"/><rect x="6" width="6" height="12" fill="#ffffff"/><rect x="12" width="6" height="12" fill="#ce2b37"/></svg>',
  Netherlands: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#ae1c28"/><rect y="4" width="18" height="4" fill="#ffffff"/><rect y="8" width="18" height="4" fill="#21468b"/></svg>',
  Portugal: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="7" height="12" fill="#006600"/><rect x="7" width="11" height="12" fill="#ff0000"/><circle cx="7" cy="6" r="2.2" fill="#ffcc00"/><circle cx="7" cy="6" r="1.3" fill="#ffffff"/><rect x="6.5" y="5.2" width="1" height="1.6" fill="#002277"/></svg>',
  Brazil: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#009b3a"/><polygon points="9,1.5 16,6 9,10.5 2,6" fill="#fedf00"/><circle cx="9" cy="6" r="2.2" fill="#002776"/><path d="M 7.2 6.5 Q 9 5.2 10.8 5.6" stroke="#ffffff" stroke-width="0.5" fill="none"/></svg>',
  Argentina: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#74acdf"/><rect y="4" width="18" height="4" fill="#ffffff"/><rect y="8" width="18" height="4" fill="#74acdf"/><circle cx="9" cy="6" r="1.3" fill="#f6b40e"/><circle cx="9" cy="6" r="0.6" fill="#85340a"/></svg>',
  Belgium: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="6" height="12" fill="#000000"/><rect x="6" width="6" height="12" fill="#ffd90c"/><rect x="12" width="6" height="12" fill="#ed2939"/></svg>',
  Croatia: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="4" fill="#ff0000"/><rect y="4" width="18" height="4" fill="#ffffff"/><rect y="8" width="18" height="4" fill="#171796"/><rect x="7.5" y="4.2" width="3" height="3.6" fill="#ff0000" stroke="#ffffff" stroke-width="0.3"/><rect x="8.3" y="4.2" width="0.7" height="1.8" fill="#ffffff"/><rect x="9.8" y="4.2" width="0.7" height="1.8" fill="#ffffff"/><rect x="7.5" y="6" width="0.8" height="1.8" fill="#ffffff"/><rect x="9" y="6" width="0.8" height="1.8" fill="#ffffff"/></svg>',
  Japan: '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#ffffff"/><circle cx="9" cy="6" r="3.2" fill="#bc002d"/></svg>'
};

const NATIONALITY_FLAG_FALLBACK_SVG = '<svg class="profile-flag-icon" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true"><rect width="18" height="12" fill="#2b3137"/><circle cx="9" cy="6" r="4.2" fill="none" stroke="#8b949e" stroke-width="0.9"/><ellipse cx="9" cy="6" rx="2" ry="4.2" fill="none" stroke="#8b949e" stroke-width="0.7"/><line x1="4.8" y1="6" x2="13.2" y2="6" stroke="#8b949e" stroke-width="0.7"/></svg>';

function getNationalityFlagHtml(nat) {
  return NATIONALITY_FLAG_SVG[nat] || NATIONALITY_FLAG_FALLBACK_SVG;
}

// メイン適性に応じたサブ適性（secondaryPositions）候補プール
const SECONDARY_POSITION_POOLS = {
  GK: [[]],
  CB: [['LB'], ['RB'], ['DM'], ['LB', 'DM'], ['RB', 'DM'], []],
  LB: [['LM'], ['CB'], ['LW'], ['RB'], ['LM', 'LW']],
  RB: [['RM'], ['CB'], ['RW'], ['LB'], ['RM', 'RW']],
  SB: [['LM'], ['RM'], ['CB'], ['LW'], ['RW']],
  DM: [['CM'], ['CB'], ['CM', 'CB']],
  CM: [['DM'], ['AM'], ['LM'], ['RM'], ['DM', 'AM']],
  LM: [['LW'], ['LB'], ['RM'], ['AM'], ['LW', 'LB']],
  RM: [['RW'], ['RB'], ['LM'], ['AM'], ['RW', 'RB']],
  SM: [['LM'], ['RM'], ['LW'], ['RW'], ['AM']],
  AM: [['CM'], ['LW'], ['RW'], ['CF'], ['CM', 'CF']],
  LW: [['CF'], ['LM'], ['RW'], ['AM'], ['CF', 'LM']],
  RW: [['CF'], ['RM'], ['LW'], ['AM'], ['CF', 'RM']],
  WG: [['CF'], ['LW'], ['RW'], ['LM'], ['RM']],
  CF: [['LW'], ['RW'], ['AM'], ['LW', 'RW'], []]
};

// ポジション系統ごとの推奨背番号プール
const PREFERRED_SQUAD_NUMBERS = {
  GK: [1, 13, 23, 31, 40],
  CB: [4, 5, 6, 15, 24, 25, 26],
  LB: [3, 12, 21, 22, 23, 33],
  RB: [2, 12, 21, 24, 27, 32],
  SB: [2, 3, 12, 21, 22, 27, 33],
  DM: [6, 14, 16, 18, 28, 30],
  CM: [8, 16, 18, 20, 22, 29, 32],
  LM: [11, 7, 14, 17, 20, 25],
  RM: [7, 11, 14, 17, 20, 22],
  SM: [7, 11, 14, 17, 20, 21],
  AM: [10, 8, 19, 20, 21, 34],
  LW: [11, 7, 17, 19, 20, 29],
  RW: [7, 11, 17, 19, 20, 24],
  WG: [7, 11, 17, 19, 20, 29],
  CF: [9, 10, 11, 18, 19, 27]
};

// クラブ設備投資（3施設：Lv.1〜Lv.5）定義（単位：£1K）
const FACILITY_DEFINITIONS = {
  stadium: {
    id: 'stadium',
    emblem: CLUB_EMBLEM_MAP['stadium'],
    code: 'STADIUM EXPANSION',
    iconLabel: 'STADIUM',
    name: 'スタジアム拡張',
    maxLevel: 5,
    // Lv.1->2: £10M, Lv.2->3: £15M, Lv.3->4: £22M, Lv.4->5: £30M
    costs: [0, 10000, 15000, 22000, 30000],
    desc: '観客席の増設とVIPホスピタリティ設備の拡充を行い、ホーム開催時の興行収入・グッズ収益と地域のサポーター基盤を持続的に拡大します。',
    getEffectText: (lv) => {
      const tiers = ['クラブ標準スタンド', '中規模拡張アリーナ', '近代型スタジアム', '国際A級ビッグスタジアム', '世界最高峰メガスタジアム'];
      return tiers[Math.min(4, Math.max(0, (lv || 1) - 1))];
    },
    getNextEffectText: (lv) => lv >= 5 ? '最高水準のスタジアム設備に到達済' : '収容規模拡大・ホーム興行増収 ＆ 新規ファン獲得'
  },
  training: {
    id: 'training',
    emblem: CLUB_EMBLEM_MAP['training'],
    code: 'TRAINING & MEDICAL',
    iconLabel: 'TRAINING',
    name: 'トレーニング＆メディカル施設',
    maxLevel: 5,
    // Lv.1->2: £8M, Lv.2->3: £13M, Lv.3->4: £19M, Lv.4->5: £25M
    costs: [0, 8000, 13000, 19000, 25000],
    desc: '最新鋭のコンディショニング機器とスポーツ医科学ラボを導入し、若手選手の年間成長スピード向上と連戦時のコンディション維持・負傷予防を実現します。',
    getEffectText: (lv) => {
      const tiers = ['基本練習グラウンド', '強化フィジカル設備', '先進スポーツ医科学棟', 'エリート育成コンプレックス', '世界最高峰パフォーマンスラボ'];
      return tiers[Math.min(4, Math.max(0, (lv || 1) - 1))];
    },
    getNextEffectText: (lv) => lv >= 5 ? '最高水準の育成・医療体制に到達済' : '若手育成効率の向上 ＆ 蓄積疲労・負傷リスク軽減'
  },
  scouting: {
    id: 'scouting',
    emblem: CLUB_EMBLEM_MAP['scouting'],
    code: 'GLOBAL SCOUTING NET',
    iconLabel: 'SCOUTING',
    name: 'グローバルスカウト網',
    maxLevel: 5,
    // Lv.1->2: £5M, Lv.2->3: £10M, Lv.3->4: £15M, Lv.4->5: £20M
    costs: [0, 5000, 10000, 15000, 20000],
    desc: '欧州主要国・南米・アジア各地に専属スカウト網を張り巡らせ、移籍リストに上がる実力派ターゲットの幅とアカデミー発掘精度を引き上げます。',
    getEffectText: (lv) => {
      const tiers = ['国内中心ネットワーク', '近隣諸国スカウト派遣', '欧州主要リーグ常駐網', '大陸横断エリート情報網', '全世界リアルタイム発掘網'];
      return tiers[Math.min(4, Math.max(0, (lv || 1) - 1))];
    },
    getNextEffectText: (lv) => lv >= 5 ? '最高水準のスカウト網に到達済' : '欧州・各国リストアップ枠の拡大 ＆ 一流銘柄の発掘解禁'
  }
};

// ==========================================================================
// 純粋汎用ユーティリティ関数
// ==========================================================================

/**
 * ユーティリティ：整数の乱数 [min, max]
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ユーティリティ：数値を [min, max] に収める
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * 通貨フォーマット（内部単位：£1K = 1,000ポンド -> 「£45.0M」「£500K」等の欧州標準スタイル）
 */
function formatMoney(kPounds) {
  if (typeof kPounds !== 'number' || Number.isNaN(kPounds)) return '£0';
  const rounded = Math.round(kPounds);
  if (rounded === 0) return '£0';
  const sign = rounded < 0 ? '-' : '';
  const absVal = Math.abs(rounded);

  if (absVal >= 1000) {
    const millions = absVal / 1000;
    return `${sign}£${millions.toFixed(1)}M`;
  }
  return `${sign}£${absVal.toLocaleString()}K`;
}

/**
 * 欧州基準の週給フォーマット（例: 25 -> 「£25K/w」、120 -> 「£120K/w」）
 */
function formatWage(kWage) {
  const rounded = Math.round(kWage || 0);
  if (rounded === 0) return '£0/w';
  return `£${rounded.toLocaleString()}K/w`;
}

/**
 * ポアソン分布に従う乱数を生成
 */
function samplePoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function normalizeGrowthCurveId(curve) {
  if (!curve) return 'standard';
  if (LEGACY_GROWTH_CURVE_MAP[curve]) return LEGACY_GROWTH_CURVE_MAP[curve];
  if (GROWTH_CURVES.some(g => g.id === curve)) return curve;
  return 'standard';
}

function getGrowthCurveMeta(curve) {
  const norm = normalizeGrowthCurveId(curve);
  return GROWTH_CURVES.find(g => g.id === norm) || GROWTH_CURVES[2];
}

/**
 * 成長曲線（growthCurve）をランダムに決定
 */
function pickRandomGrowthCurve() {
  const r = Math.random();
  if (r < 0.14) return 'early_fade';
  if (r < 0.28) return 'early_long';
  if (r < 0.62) return 'standard';
  if (r < 0.76) return 'steady_iron';
  if (r < 0.90) return 'late_bloom';
  return 'fragile_genius';
}

function getGrowthCurveLabel(curve) {
  return getGrowthCurveMeta(curve).label;
}

// ==========================================================================
// リアルシミュレーション拡張マスタ定義
// ==========================================================================

// 試合中の自動交代方針定義
const SUB_POLICY_DEFINITIONS = {
  balanced: {
    id: 'balanced',
    label: 'バランス（標準）',
    desc: '後半60〜80分に疲労した選手と低評価選手をバランス良く交代します。'
  },
  fatigue: {
    id: 'fatigue',
    label: '疲労温存重視',
    desc: '後半55分から蓄積疲労の高い主力選手を積極的に下げて怪我と消耗を防ぎます。'
  },
  defensive_lead: {
    id: 'defensive_lead',
    label: 'リード時守備固め',
    desc: 'リードしている展開では後半65分以降にDF/DMを優先投入して逃げ切りを図ります。'
  },
  attack_chase: {
    id: 'attack_chase',
    label: 'ビハインド時攻勢',
    desc: '引き分け・ビハインド時に攻撃的MF/WG/CFを早期投入して同点・逆転を狙います。'
  }
};

// チーム内序列（Squad Status）ラベル
const SQUAD_STATUS_LABELS = {
  key: '絶対的主力',
  first_team: 'レギュラー',
  rotation: 'ローテーション',
  prospect: '若手有望株'
};

// 胸スポンサー企業テンプレート（単位：£1K）
const SPONSOR_TEMPLATES = [
  { id: 'sp_global_fin', name: 'Apex Global Bank', tier: 'top', baseAnnual: 18000, clBonus: 5000, titleBonus: 7000, relegationPenaltyPct: 45, minReputation: 6800 },
  { id: 'sp_airways', name: 'Britannia Airways', tier: 'top', baseAnnual: 15000, clBonus: 4500, titleBonus: 6000, relegationPenaltyPct: 40, minReputation: 6000 },
  { id: 'sp_tech_core', name: 'Nexa Cloud Systems', tier: 'upper', baseAnnual: 10500, clBonus: 3500, titleBonus: 4500, relegationPenaltyPct: 35, minReputation: 4800 },
  { id: 'sp_motors', name: 'Veloce Motors UK', tier: 'mid', baseAnnual: 7500, clBonus: 2500, titleBonus: 3500, relegationPenaltyPct: 30, minReputation: 3800 },
  { id: 'sp_energy', name: 'NorthSea Energy', tier: 'mid', baseAnnual: 5500, clBonus: 2000, titleBonus: 2500, relegationPenaltyPct: 25, minReputation: 2800 },
  { id: 'sp_local_bet', name: 'Albion Heritage Co.', tier: 'lower', baseAnnual: 3200, clBonus: 1200, titleBonus: 1800, relegationPenaltyPct: 15, minReputation: 1000 }
];

// 代表チーム戦力・招集基準マスタ（代表ウィーク用）
const NATIONAL_TEAM_STRENGTHS = {
  England: 84, France: 86, Spain: 85, Germany: 83, Brazil: 85,
  Argentina: 86, Portugal: 84, Italy: 82, Netherlands: 82, Belgium: 80,
  Japan: 78, Croatia: 80, Uruguay: 80, Colombia: 79, Denmark: 77
};

// PSR（収益性と持続可能性に関する規則）許容赤字上限（3シーズン累積：£35.0M = 35000 £K）
const PSR_MAX_3YR_DEFICIT = -35000;

// プレミアリーグ準拠：25人シニア登録ルール＆ホームグロウン（HG）／外国籍枠ルール
const SQUAD_NATIONALITY_RULES = {
  HOME_NATIONALITY: 'England',
  MAX_SENIOR_SQUAD: 25,       // 22歳以上シニア選手の登録上限
  MIN_HOMEGROWN_TARGET: 8,    // 推奨HG最低人数
  MAX_NON_HG_SLOTS: 17,       // 22歳以上の非HG（外国籍）登録上限
  U21_EXEMPT_MAX_AGE: 21,     // 21歳以下は25人枠・非HG枠から免除
  BASE_BENCH_LIMIT: 9,        // 通常公式戦ベンチ入り上限
  MIN_BENCH_LIMIT: 3,         // ペナルティ時最低保証ベンチ枠
  D1_HOME_RATIO: 0.48,        // 1部初期スカッドの自国籍比率
  D1_MIN_HOME_COUNT: 10,      // 1部初期27名中の最低自国籍数
  D2_HOME_RATIO: 0.75,        // 2部初期スカッドの自国籍比率
  D2_MIN_HOME_COUNT: 16,      // 2部初期27名中の最低自国籍数
  YOUTH_HOME_RATIO: 0.80,     // ユース生成時の自国籍比率
  MARKET_HOME_RATIO: 0.35     // フリー市場の自国籍比率
};

// 欧州クラブ国コード → 選手国籍マッピング
const COUNTRY_CODE_TO_NATIONALITY = {
  ENG: 'England',
  ESP: 'Spain',
  ITA: 'Italy',
  GER: 'Germany',
  FRA: 'France',
  POR: 'Portugal',
  NED: 'Netherlands',
  BEL: 'Belgium',
  CRO: 'Croatia',
  JPN: 'Japan',
  BRA: 'Brazil',
  ARG: 'Argentina'
};

// ユーススカウト派遣先地域定義
const YOUTH_SCOUT_REGIONS = {
  england: {
    id: 'england',
    name: 'イングランド国内',
    cost: 400,
    days: 14,
    nationalities: ['England'],
    homeProb: 0.90,
    potentialBonus: 0,
    desc: 'HG枠の確保に最適。コストが安く短期間で堅実な国内有望株を発掘。'
  },
  uk_ireland: {
    id: 'uk_ireland',
    name: '英国・アイルランド',
    cost: 500,
    days: 16,
    nationalities: ['England', 'Croatia'],
    homeProb: 0.72,
    potentialBonus: 1,
    desc: '闘志とフィジカルに優れた英国圏の原石をバランス良く発掘。'
  },
  iberia: {
    id: 'iberia',
    name: 'イベリア半島 (ESP/POR)',
    cost: 850,
    days: 21,
    nationalities: ['Spain', 'Portugal'],
    homeProb: 0.15,
    potentialBonus: 2,
    desc: '技術と戦術眼に優れた技巧派MF/WGの発掘率が高い。'
  },
  central_europe: {
    id: 'central_europe',
    name: '中欧 (GER/FRA/NED)',
    cost: 900,
    days: 21,
    nationalities: ['Germany', 'France', 'Netherlands', 'Belgium'],
    homeProb: 0.10,
    potentialBonus: 2,
    desc: '欧州主要育成国から完成度の高い万能タレントを発掘。'
  },
  south_america: {
    id: 'south_america',
    name: '南米 (BRA/ARG)',
    cost: 1200,
    days: 28,
    nationalities: ['Brazil', 'Argentina', 'Uruguay', 'Colombia'],
    homeProb: 0.05,
    potentialBonus: 4,
    desc: '費用と日数は掛かるが、最高ランク（S/A）の天才アタッカー発掘率が最も高い。'
  }
};


