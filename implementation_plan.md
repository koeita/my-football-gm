# Implementation Plan

## [Overview]
イングランドを中心とした現実的なチーム構成（国籍比率のリアル化）および、プレミアリーグをモデルとした「25人シニア登録ルール（22歳以上上限25名）＋ホームグロウン（HG）／外国籍枠（非HG上限17名）ルール」を導入する実装計画である。

本計画では以下の3点を統合する：
1. **選手・クラブ生成時の国籍比率のリアル化**:
   - イングランド1部（約48%、最低7名保証）、イングランド2部（約75%、最低12名保証）、自クラブユース（約80%）が `England` 国籍となるよう生成ロジックを更新。
   - 欧州移籍リスト（`generateEuropeanTransferList`）および自由移籍市場（`generateTransferMarket`）でも所属クラブの国コード（`country`）に相関した国籍を付与する。
2. **25人登録ルール ＆ ホームグロウン（HG）／非HG枠ルール**:
   - **シニア登録枠（22歳以上）**：トップチーム登録上限 **25名**（`MAX_SENIOR_SQUAD = 25`）
   - **非HG枠（22歳以上の外国籍）**：登録上限 **17名**（`MAX_NON_HG_SLOTS = 17`、推奨HG最低8名）
   - **U-21特例（21歳以下）**：25人枠・17人非HG枠の双方から免除（`U21_EXEMPT_MAX_AGE = 21`）
   - **HG資格**：`nationality === 'England'` または自クラブユース昇格選手（`isYouthGraduate === true`）は国籍を問わずHG扱い（`isHomegrown = true`）。
3. **違反時の警告表示 ＆ 公式戦ベンチ枠ペナルティ**:
   - シニア25名または非HG17名を超過した場合、選手一覧・移籍交渉モーダル・試合前確認に警告を表示。
   - 超過数（`Math.max(excessSenior, excessNonHg)`）に応じて、公式戦ベンチ入り上限（通常9名）が減少するペナルティを適用する。

---

## [Types]
### 1. Player（`models.js`）
- `isHomegrown`: `boolean` — HG資格の有無（`England` 国籍または `isYouthGraduate === true`）
- `isYouthGraduate`: `boolean` — 自クラブユースから昇格した選手フラグ

### 2. 定数（`data.js`）
- `SQUAD_NATIONALITY_RULES`:
  - `HOME_NATIONALITY: 'England'`
  - `MAX_SENIOR_SQUAD: 25`
  - `MIN_HOMEGROWN_TARGET: 8`
  - `MAX_NON_HG_SLOTS: 17`
  - `U21_EXEMPT_MAX_AGE: 21`
  - `D1_HOME_RATIO: 0.48`, `D1_MIN_HOME_COUNT: 7`
  - `D2_HOME_RATIO: 0.75`, `D2_MIN_HOME_COUNT: 12`
  - `YOUTH_HOME_RATIO: 0.80`
  - `MARKET_HOME_RATIO: 0.35`
- `COUNTRY_CODE_TO_NATIONALITY`: `'ESP' -> 'Spain'`, `'ITA' -> 'Italy'`, `'GER' -> 'Germany'`, `'FRA' -> 'France'`, `'POR' -> 'Portugal'`, `'NED' -> 'Netherlands'`, `'BEL' -> 'Belgium'`, `'CRO' -> 'Croatia'`, `'ENG' -> 'England'` 等。

---

## [Files]
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/data.js`: `SQUAD_NATIONALITY_RULES`, `COUNTRY_CODE_TO_NATIONALITY` 追加
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/models.js`: 国籍生成リアル化、`isPlayerHomegrown()`, `evaluateClubNationalityRules()`, `getEffectiveBenchLimit()` 実装
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/competitions.js`: 2部クラブ初期生成時の `D2_HOME_RATIO` 適用
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/main.js`: `promoteYouthCandidate`, `renderRoster`, `renderBoardLayout` / `renderBenchDrawer`, `openPreMatchCheckModal`, `renderNegotiationModal` への警告・ベンチ枠ペナルティ統合
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/index.html`: 選手一覧サマリーに国籍ルール枠表示・警告バナー追加
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/style.css`: HG/U-21バッジ・ルール警告バナー用スタイル追加
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/storage.js`: セーブ/ロード時の `isHomegrown` / `isYouthGraduate` 補完
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/tests/test_nationality_rules.py`: 新規単体テスト

---

## [Functions]
- `pickWeightedNationality(homeRatio, homeNat)` (`models.js`)
- `createSquad(basePower, usedNames, options)` (`models.js`)
- `createYouthSquad(usedNames, options)` (`models.js`)
- `generateEuropeanTransferList(existingUsedNames, scoutingLv)` (`models.js`)
- `isPlayerHomegrown(player)` (`models.js`)
- `evaluateClubNationalityRules(club)` (`models.js`)
- `getEffectiveBenchLimit(club)` (`models.js`)

---

## [Classes]
変更なし（プレーンオブジェクト＋ドメイン関数構成を維持）。

---

## [Dependencies]
外部パッケージ追加なし。

---

## [Testing]
- 既存全テスト（`python tests/run_tests.py --all`）のパス維持。
- `tests/test_nationality_rules.py` にて1部/2部/ユース/欧州市場の国籍生成比率、HG・U-21免除判定、25人・17人超過時のベンチ枠ペナルティ算出を検証。

---

## [Implementation Order]
1. `data.js` に定数・国コード変換マップを追加
2. `models.js`・`competitions.js` に国籍生成リアル化・HG/25人ルール判定を実装
3. `main.js`・`storage.js`・`index.html`・`style.css` にUI警告・ベンチ枠ペナルティ・交渉アラート・セーブ互換を統合
4. `tests/test_nationality_rules.py` を作成し全テストを実行検証


対象範囲は以下の4領域にわたる：
1. **試合エンジン・ルール・戦術のリアリティ**: 累積警告（イエローカード）および退場（レッドカード）による公式戦出場停止と試合中10人戦の数的不利シミュレーション、作戦ボードで事前設定可能な交代方針に基づく試合中の自動5人交代（ベンチからの最適投入＆疲労・評価点・スタッツ連動）、およびキャプテン・PKキッカー・FK/CKキッカーの役割指定とセットプレー得点ロジック。
2. **移籍市場・契約・財政のリアリティ**: 他クラブ全選手の能力値・成長曲線・要求条件をスカウト派遣で解明する「霧（Fog of War）」システム、移籍ウィンドウ（夏・冬）の厳格化とデッドラインデイ特需、契約解除金・買取オプション/義務付きレンタル・売却時歩合・出場/ゴールボーナス・分割払いの契約条項、および胸スポンサー契約と3年累積赤字に基づくPSR（収益性と持続可能性に関する規則：勝ち点剥奪・補強禁止）ペナルティ。
3. **ロッカールーム・選手心理・クラブ内力学**: 選手個人のモラル（士気）とチーム内序列（Squad Status）による出場時間不満・移籍志願とキャプテン仲裁、新加入適応期間を含むチームケミストリー（連携度）＆戦術習熟度、クラブの格（Reputation）による交渉・移籍先志向制限、および理事会（ボード）の信頼度評価と解任時の「下位/2部クラブへの移籍再スタート or ゲームオーバー選択」。
4. **カレンダー・世界観・データ分析の深み**: 既存の代表ウィーク休止枠（9/10/11/3月）を活用した代表招集・代表戦結果・疲労/負傷リスク（FIFAウイルス）イベント、および次節対戦相手の直近5試合フォーム・得意戦術/陣形・要注意選手・弱点分析を提示する詳細な対戦スカウティングレポート。

既存のグローバルスクリプト構成（`data.js` → `avatar.js` → `models.js` → `competitions.js` → `match-engine.js` → `storage.js` → `main.js`）および `localStorage` セーブ/ロード互換性（後方互換マイグレーション）を維持したまま段階的に統合する。

---

## [Types]
本プロジェクトは Vanilla JavaScript のグローバルオブジェクト構造を採用しているため、各ドメインオブジェクトに新規追加・拡張するプロパティ仕様を以下に定義する。

### 1. Player（選手オブジェクト：`models.js`）
- `squadStatus`: `key | first_team | rotation | prospect` — 契約時に合意したチーム内序列
- `morale`: `number` (`0〜100`, 初期値 `75`) — 選手個人の士気。出場機会満足度・勝敗・契約・キャプテン仲裁で変動
- `unhappyReason`: `playing_time | contract | ambition | null` — 不満理由
- `transferRequested`: `boolean` (初期値 `false`) — 不満爆発による移籍志願フラグ
- `adaptationDays`: `number` (初期値 `0`, 新加入時 `30〜60`) — 新加入選手のチーム適応残日数
- `suspensionMatches`: `{ league: number, domesticCup: number, euroCup: number }` — 大会カテゴリ別の出場停止残試合数
- `compYellowAccum`: `{ league: number, domesticCup: number, euroCup: number }` — 累積イエローカード枚数（リーグ5枚で1試合停止・10枚で2試合停止、カップ2枚で1試合停止）
- `contractClauses`: `{ releaseClause: number | null, appearanceBonus: number, goalBonus: number, sellOnPct: number }` — 契約条項（解除金£K、出場給£K、ゴール給£K、売却時歩合0〜30%）
- `loanTerms`: `{ parentClubId: string, buyOptionFee: number | null, buyObligation: boolean, originalWage: number, originalContractYears: number } | null` — 買取OP/義務付きレンタル条件
- `onIntlDuty`: `boolean` (初期値 `false`) — 代表ウィーク中の代表招集フラグ

### 2. Club（クラブオブジェクト：`models.js` / `data.js`）
- `reputation`: `number` (`1000〜10000`) — クラブの格（初期値は `basePower` と所属ディビジョンから算出、タイトル・昇降格・欧州戦で変動）
- `tacticalFamiliarity`: `number` (`30〜100`, 初期値 `70`) — 現在の陣形・戦術へのチーム習熟度
- `teamChemistry`: `number` (`30〜100`, 初期値 `75`) — チーム連携度（継続起用で上昇、大量補強・低モラルで低下）
- `roles`: `{ captainId: string | null, pkKickerId: string | null, setPieceKickerId: string | null }` — チーム内役割指定
- `subPolicy`: `balanced | fatigue | defensive_lead | attack_chase` (初期値 `balanced`) — 試合中の自動交代方針
- `sponsor`: `{ name: string, baseAnnual: number, clBonus: number, titleBonus: number, relegationPenaltyPct: number, yearsRemaining: number } | null` — 胸スポンサー契約
- `psrHistory`: `Array<{ season: number, revenue: number, expenses: number, netProfit: number }>` — 直近3シーズンの収支履歴
- `psrSanction`: `{ transferBanWindows: number, pointsDeductedThisSeason: number }` — 補強禁止残ウィンドウ数および今季勝ち点剥奪済み数
- `boardConfidence`: `number` (`0〜100`, 初期値 `75`) — 理事会からの信頼度
- `boardExpectations`: `{ targetRank: number, youthMinutesTarget: number, stylePhilosophy: string }` — 理事会からの目標・方針

### 3. GameState 拡張（`main.js` / `storage.js`）
- `scoutingIntel`: `Record<string, { progress: number, level: 0 | 1 | 2, discoveredAtDay: number | null }>` — 選手IDごとのスカウト調査状態（`0`: 未調査・推定幅、`1`: 一次調査済、`2`: 完了・全能力/成長/要求額判明）
- `activeScoutAssignments`: `Array<{ playerId: string, clubId: string | null, daysRemaining: number, totalDays: number }>` — スカウト派遣中タスク（枠数: `2 + (scoutingLv - 1) * 2`）
- `installments`: `Array<{ id: string, direction: in | out, counterClubId: string, playerName: string, amountPerSeason: number, remainingSeasons: number }>` — 分割払い未決済台帳
- `sellOnRights`: `Array<{ playerId: string, playerName: string, beneficiaryClubId: string, pct: number }>` — 売却時歩合権益台帳
- `intlBreakState`: `object | null` — 代表ウィーク中の招集サマリー・試合結果ログ
- `pendingBoardCrisis`: `boolean` (初期値 `false`) — 理事会信頼度崩壊による解任・再就職選択モーダル起動フラグ
- `pendingDeadlineOffer`: `boolean` — デッドラインデイ特別イベントフラグ

---

## [Files]
### 既存ファイルの修正
1. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/data.js` — スポンサー定義(`SPONSOR_TEMPLATES`)、代表戦力(`NATIONAL_TEAM_STRENGTHS`)、交代方針(`SUB_POLICY_DEFINITIONS`)、クラブ初期格・ボード方針定義を追加。
2. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/models.js` — 選手/クラブのリアリティ拡張フィールド補完、スカウト霧・進捗、ケミストリー＆習熟度、役割選定、PSR判定、理事会信頼度、出場停止除外ロジックを実装。
3. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/competitions.js` — 2部・国内カップ・欧州戦での出場停止反映、自動交代呼び出し、累積カード記録、PSR勝ち点剥奪の順位表反映。
4. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/match-engine.js` — `simulateMatch`へのケミストリー/役割/10人戦/自動5人交代統合、`buildLiveMatchTimeline`への退場・交代・セットプレー演出追加、`applyPostMatchDiscipline`実装。
5. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/storage.js` — 新規`gameState`・選手・クラブプロパティのセーブ/ロードおよび旧セーブ互換マイグレーション。
6. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/main.js` — 作戦ボード(役割・交代方針・連携・停止)、移籍市場(霧・スカウト派遣・ウィンドウ厳格化・契約条項・分割払い・セルオン)、経営(スポンサー・PSR・理事会)、モラル・代表ウィーク・相手分析・解任再スタート実装。
7. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/index.html` — 作戦ボード・経営タブ・交渉モーダル・解任/代表モーダルDOM追加。
8. `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/style.css` — 停止バッジ・スカウトレンジ/進捗・モラル/ケミストリー・スポンサー/PSR・相手分析スタイル追加。

### 新規作成ファイル
- `c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/tests/test_realism_expansion.py` — 追加機能の単体・統合テストスイート。

---

## [Functions]
### models.js
- `ensureClubRealismFields(club)` — クラブの `reputation`, `roles`, `subPolicy`, `sponsor`, `psrHistory`, `psrSanction`, `boardConfidence` を補完。
- `ensurePlayerRealismFields(player, isStarter)` — 選手の `morale`, `squadStatus`, `suspensionMatches`, `compYellowAccum`, `contractClauses`, `adaptationDays` を補完。
- `getPlayerScoutedView(player, isPlayerClub)` — 霧(Fog of War)適用後の表示データ（確定値または推定レンジ）を返す。
- `assignScoutToPlayer(playerId)` — スカウト派遣枠を確認し `activeScoutAssignments` に登録。
- `advanceScoutingProgressDaily()` — 平日1日ごとにスカウト進捗を進め完了時に日報通知。
- `calculateClubChemistryAndFamiliarity(club)` — 在籍適応期間・平均モラル・同陣形/戦術継続から `teamChemistry` と `tacticalFamiliarity` を算出。
- `autoAssignClubRoles(club)` — キャプテン・PKキッカー・FK/CKキッカーの最適選手を自動選出。
- `isPlayerSuspendedForComp(player, compCategory)` — 指定大会カテゴリで出場停止中か判定。
- `evaluateClubPSR(club)` — 直近3季の累積赤字を検証し、警告・勝ち点剥奪・補強禁止処分を判定。
- `updateBoardConfidenceAfterMatch(club, compCategory, won, drawn)` — 試合結果・目標順位乖離・スタイル合致から `boardConfidence` を更新。
- `updatePlayerMoraleAndStatuses(club, starters, subs)` — 試合後に序列と出場有無・勝敗に応じて `morale` を増減させ不満・仲裁を判定。

### match-engine.js
- `simulateMatch(homeClub, awayClub, options = {})` (修正) — ケミストリー/習熟度補正、役割補正、退場時10人戦ペナルティ、自動5人交代を統合。
- `executeAutoSubstitutions(club, starters, bench, matchMinute, scoreDiff, subPolicy, alreadySubbedCount)` — 交代方針と経過分数・点差・残スタミナから最大5人交代。
- `applyPostMatchDiscipline(compCategory, homeClub, awayClub, homePlayed, awayPlayed, cardsMap)` — カード累積加算および出場停止付与。
- `buildLiveMatchTimeline(matchData, homeScorers, awayScorers)` (修正) — 交代・退場・セットプレーイベントをタイムラインへ組み込む。

### main.js
- `isTransferWindowCurrentlyOpen()` — カレンダーの `windowOpen` を参照し、ウィンドウ外の獲得交渉・フリー獲得を制限。
- `processInternationalBreakEvent(day)` — 代表ブレイク期間中の代表招集、代表戦結果、疲労加算・低確率負傷を処理。
- `processSeasonEndFinanceAndPSR()` — スポンサー収入・分割払い年次決済・3年PSR収支記録と制裁判定。
- `openBoardCrisisModal()` / `handleBoardRelegationRestart(newClubId)` — 理事会解任時に下位/2部クラブへの移籍再スタートかゲームオーバーを選択。
- `openPendingMatchPreview(weekNum)` (修正) — 相手の直近5試合フォーム・平均得失点・戦術傾向・要注意選手・相性アドバイスを追加描画。
- `renderNegotiationModal()` / `submitNegotiationOffer()` (修正) — 解除金・各種ボーナス・売却時歩合・分割払い・買取OP/義務付きレンタルを統合。

---

## [Classes]
本プロジェクトはクラス構文を使用せず、プレーンな JavaScript オブジェクトとファクトリ関数・ドメイン関数群で構成されているため、新規クラスの追加・既存クラスの変更はない。データ構造の拡張は [Types] セクションのオブジェクトスキーマに従う。

---

## [Dependencies]
外部パッケージ・新規ライブラリの追加は不要。既存のブラウザ標準 API（Vanilla JS / HTML5 / CSS3 / Canvas / `localStorage`）および既存の Python `unittest` テストランナー（`tests/run_tests.py`）をそのまま利用する。

---

## [Testing]
### 既存テストの維持・確認
- `python tests/run_tests.py --all` による全86件の既存テストがすべてパスすることを各フェーズ完了時に検証する。
- 特に `tests/test_priority_s_fixes.py` および `tests/test_bugfixes_and_comp_stats.py` との互換性を維持する。

### 新規単体・統合テストの追加
`c:/Users/xcang/Desktop/Antigravity/my-footballl-gm/tests/test_realism_expansion.py` を新規作成し、以下を検証する：
1. **規律・出場停止・10人戦・自動交代テスト**: 累積5枚/一発レッドで `suspensionMatches` が付与され自動編成から除外されること。`executeAutoSubstitutions` が最大5人まで重複なく交代すること。
2. **霧(Fog of War)＆スカウト進行テスト**: 未調査選手は推定幅が返り、`assignScoutToPlayer` → `advanceScoutingProgressDaily` 完了後に確定値が開示されること。
3. **移籍ウィンドウ＆契約条項・分割・PSRテスト**: ウィンドウ外制限、買取OP付きレンタル処理、3年連続基準超過赤字でPSR勝ち点剥奪・補強禁止が発動すること。
4. **モラル・ケミストリー・格・理事会テスト**: 序列不満によるモラル低下、適応日数による連携度変動、クラブ格による交渉拒否、理事会解任後の他クラブ再スタートが動作すること。
5. **代表ウィーク＆相手スカウティング・セーブ互換性テスト**: 代表招集・疲労反映、相手直近5戦フォーム算出、旧形式セーブデータのマイグレーション補完。

---

## [Implementation Order]
競合と手戻りを最小化するため、底層から試合エンジン、経営・人間力学、UIの順に以下の6ステップで実装する。

1. **Step 1: データ定義・モデル基盤・セーブ互換層の拡張** (`data.js`, `models.js`, `storage.js`)
2. **Step 2: 試合エンジンの深化（出場停止・10人戦・自動5人交代・役割指定）** (`match-engine.js`, `competitions.js`, `models.js`, `index.html`, `main.js`, `style.css`)
3. **Step 3: スカウティングの霧(Fog of War)＆対戦相手スカウティングレポート** (`models.js`, `main.js`, `index.html`, `style.css`)
4. **Step 4: 移籍ウィンドウ厳格化・契約条項・スポンサー・PSR（財政規律）** (`main.js`, `models.js`, `competitions.js`, `index.html`, `style.css`)
5. **Step 5: ロッカールーム力学・ケミストリー・クラブ格・理事会＆解任再スタート** (`models.js`, `main.js`, `index.html`, `style.css`)
6. **Step 6: 代表ウィーク（インターナショナルブレイク）＆総合テスト検証** (`main.js`, `data.js`, `tests/test_realism_expansion.py`)
