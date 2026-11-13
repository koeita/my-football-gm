# -*- coding: utf-8 -*-
import unittest
import re

class TestPhase4Targeted(unittest.TestCase):
    def setUp(self):
        with open('competitions.js', 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open('data.js', 'r', encoding='utf-8') as f:
            data_js = f.read()
        with open('models.js', 'r', encoding='utf-8') as f:
            models_js = f.read()
        with open('match-engine.js', 'r', encoding='utf-8') as f:
            match_js = f.read()
        with open('storage.js', 'r', encoding='utf-8') as f:
            storage_js = f.read()
        with open('main.js', 'r', encoding='utf-8') as f:
            raw_main = f.read()
        self.main_js = data_js + '\n' + models_js + '\n' + match_js + '\n' + storage_js + '\n' + raw_main
        with open('index.html', 'r', encoding='utf-8') as f:
            self.index_html = f.read()
        with open('style.css', 'r', encoding='utf-8') as f:
            self.style_css = f.read()

    def test_big_five_120_clubs_definitions(self):
        """五大リーグ計120クラブが正しく定義されていること"""
        c_eng2 = len(re.findall(r"id:\s*'c\d{2}'", self.comp_js))
        c_esp = len(re.findall(r"id:\s*'es\d{2}'", self.comp_js))
        c_ita = len(re.findall(r"id:\s*'it\d{2}'", self.comp_js))
        c_ger = len(re.findall(r"id:\s*'de\d{2}'", self.comp_js))
        c_fra = len(re.findall(r"id:\s*'fr\d{2}'", self.comp_js))
        self.assertEqual(c_eng2, 24)
        self.assertEqual(c_esp, 20)
        self.assertEqual(c_ita, 20)
        self.assertEqual(c_ger, 18)
        self.assertEqual(c_fra, 18)

    def test_standings_clean_lines_and_legend(self):
        """昇格圏などの文字表示が消え、左端ラインに統一され、下部に注釈（レジェンド）があること"""
        # main.js の renderStandings から文字タグが消えていること
        self.assertNotIn("zoneTagHtml", self.main_js)
        self.assertIn("standings-legend", self.main_js)
        self.assertIn("standings-legend", self.index_html)
        self.assertIn("standings-legend", self.comp_js)

    def test_euro_no_redundant_text(self):
        """欧州コンペの(全36チーム / 各8試合)などの冗長な表記が削除されていること"""
        self.assertNotIn("総合順位表 (全36チーム / 各8試合)", self.comp_js)
        self.assertNotIn("順位表 (全36チーム)", self.main_js)
        self.assertIn("総合順位表", self.comp_js)

    def test_euro_schedule_three_letter_codes(self):
        """欧州コンペの日程・結果で getClubShortCode が使用され、プレミアリーグのチームも3文字表記になること"""
        self.assertIn("getClubShortCode", self.comp_js)
        self.assertIn("euro-match-tile", self.comp_js)

    def test_calendar_and_matchday_cup_fixes(self):
        """カレンダーへの欧州日程注入とカップ戦試合消化ロジックの検証"""
        self.assertIn("getCalendarDayPlayerMatch", self.main_js)
        self.assertIn("isCupMatchDay", self.comp_js)
        self.assertIn("euroLeaguePhase", self.comp_js)
        # カレンダーマス描画で getClubShortCode を使用していること
        self.assertIn("getClubShortCode(oppClub)", self.main_js)
        # openMatchPrecheckModal がカップ戦にも対応していること
        self.assertIn("getCalendarDayPlayerMatch(currentDay)", self.main_js)

    def test_weekly_schedule_and_cup_match_viewing(self):
        """週間カレンダーへの表記とカップ戦・欧州戦の試合観戦（2Dピッチモーダル）連携を検証"""
        # 週間カレンダーで getCalendarDayPlayerMatch を使用して対戦表記すること
        self.assertIn("getCalendarDayPlayerMatch(day)", self.main_js)
        # playCurrentCupMatchday から openMatchEventModal を呼び出して観戦できること
        self.assertIn("openMatchEventModal(matchData", self.main_js)
        # 仮想スタメン保証関数が存在すること
        self.assertIn("ensureClubStartersForMatch", self.main_js)
        # スコアラー自動生成関数が存在すること
        self.assertIn("generateScorersForQuickMatch", self.main_js)

    def test_competition_fictional_names_and_unified_league_tab(self):
        """リーグタブの統合と架空大会名称・略称タグへの置換を検証"""
        # 1. リーグタブ統合
        self.assertIn('data-comp="league"', self.index_html)
        self.assertIn('data-league-div="d1"', self.main_js)
        self.assertIn('data-league-div="d2"', self.main_js)
        self.assertNotIn('id="comp-btn-prem"', self.index_html)
        self.assertNotIn('id="comp-btn-championship"', self.index_html)

        # 2. 架空大会名称
        self.assertIn('ユーロ・チャンピオンズ・トロフィー', self.comp_js)
        self.assertIn('ユーロ・プレステージ・カップ', self.comp_js)
        self.assertIn('ユーロ・カンファレンス・シールド', self.comp_js)
        self.assertIn('リーグ・トロフィー', self.comp_js)
        self.assertIn('ナショナル・カップ', self.comp_js)
        self.assertIn('イングランド・セカンドディビジョン', self.comp_js)

        # 3. 略称タグ
        self.assertIn("'ECT'", self.comp_js)
        self.assertIn("'EPC'", self.comp_js)
        self.assertIn("'ECS'", self.comp_js)
        self.assertIn("'L-CUP'", self.comp_js)
        self.assertIn("'N-CUP'", self.comp_js)

        # 4. 旧実在名称が表示テキストとして残っていないこと
        self.assertNotIn('カラバオ', self.index_html)
        self.assertNotIn('カラバオ', self.main_js)
        self.assertNotIn('FAカップ', self.index_html)

    def test_subnav_and_second_division_highlight_fix(self):
        """2部リーグの行背景ハイライトが消去され、サブナビの改行・潰れ防止スタイルが適用されていること"""
        # 2部昇格・降格圏の行背景ハイライトが transparent になっていること
        self.assertIn('.zone-promotion', self.style_css)
        self.assertIn('background: transparent !important;', self.style_css)
        self.assertNotIn('rgba(34, 197, 94, 0.08) !important', self.style_css)
        self.assertNotIn('rgba(239, 68, 68, 0.08) !important', self.style_css)

        # サブナビにグループ化と nowrap が適用されていること
        self.assertIn('comp-subnav-group', self.main_js)
        self.assertIn('comp-subnav-group', self.style_css)
        self.assertIn('white-space: nowrap;', self.style_css)

        # カップ・欧州コンペのサブタブ下の青いラベルが非表示または削除されていること
        self.assertNotIn('<div class="cup-header-banner">', self.comp_js)
        self.assertNotIn('<div class="euro-league-header">', self.comp_js)
        self.assertIn('.cup-header-banner', self.style_css)
        self.assertIn('.euro-league-header', self.style_css)

        # 欧州順位表が table-wrapper に包まれ、余白（padding: 16px）を排除してリーグ順位表と横幅が完全一致していること
        self.assertIn('.comp-bracket-wrapper.standings-view', self.style_css)
        self.assertIn('<div class="table-wrapper">', self.comp_js)

    def test_european_clubs_naming_standardization(self):
        """欧州他国クラブ名の漢字・俗称が撤廃され、英字識別コード/フットボール略称に統一されていること"""
        # 1. 新名称が存在すること
        self.assertIn("エスパニョール・B", self.comp_js)
        self.assertIn("バジャドリード・V", self.comp_js)
        self.assertIn("アラベス・D", self.comp_js)
        self.assertIn("レガネス・CD", self.comp_js)
        self.assertIn("ボーフム・V", self.comp_js)
        self.assertIn("キール・H", self.comp_js)
        self.assertIn("ウニオン・B", self.comp_js)
        self.assertIn("ハイデンハイム・FC", self.comp_js)
        self.assertIn("ザンクトパウリ・FC", self.comp_js)
        self.assertIn("サンテティエンヌ・AS", self.comp_js)
        self.assertIn("アンジェ・SCO", self.comp_js)
        self.assertIn("オセール・AJ", self.comp_js)
        self.assertIn("ル・アーヴル・AC", self.comp_js)
        self.assertIn("コモ・C", self.comp_js)
        self.assertIn("レッチェ・US", self.comp_js)
        self.assertIn("エンポリ・FC", self.comp_js)
        self.assertIn("ヴェネツィア・FC", self.comp_js)
        self.assertIn("パルマ・FC", self.comp_js)
        self.assertIn("ハダースフィールド・T", self.comp_js)

        # 2. 旧漢字・直訳カラー呼称が存在しないこと
        self.assertNotIn("青白", self.comp_js)
        self.assertNotIn("紫", self.comp_js)
        self.assertNotIn("キュウリ", self.comp_js)
        self.assertNotIn("十字軍", self.comp_js)
        self.assertNotIn("ラーゴ", self.comp_js)
        self.assertNotIn("サレント", self.comp_js)
        self.assertNotIn("トスカーナ", self.comp_js)
        self.assertNotIn("ラグーナ", self.comp_js)
        self.assertNotIn("鉄鋼", self.comp_js)
        self.assertNotIn("赤青", self.comp_js)
        self.assertNotIn("海賊", self.comp_js)
        self.assertNotIn("ホルシュタイン", self.comp_js)
        self.assertNotIn("白青", self.comp_js)
        self.assertNotIn("水色", self.comp_js)
        self.assertNotIn("黒白", self.comp_js)

        # 3. 全クラブ定義のnameに漢字が含まれていないこと
        club_names = re.findall(r"id:\s*'[^']+',\s*name:\s*'([^']+)'", self.comp_js)
        for name in club_names:
            self.assertFalse(bool(re.search(r'[\u4e00-\u9fff]', name)), f"Club name contains kanji: {name}")

    def test_euro_and_cup_calendar_and_matchday_execution(self):
        """欧州コンペおよびカップ戦がカレンダーに安全に注入され、試合日クラッシュが防止され、セーブ復元されること"""
        # 1. competitions がセーブ＆ロードで保持・復元されること
        self.assertIn("competitions: gameState.competitions", self.main_js)
        self.assertIn("!gameState.competitions || !gameState.competitions.championsCup", self.main_js)
        self.assertIn("injectCupMatchesIntoCalendar()", self.main_js)

        # 2. MATCHDAYパネルでカップ戦・欧州戦の同日他カードが安全に描画され、undefined filter でクラッシュしないこと
        self.assertIn("else if (currentDay.isCupMatchDay)", self.main_js)
        self.assertIn("playerMatchInfo.type === 'euroLeague'", self.main_js)

        # 3. カレンダーセルに data-cal-cup-day-index が付与され、クリックでキックオフ可能であること
        self.assertIn("data-cal-cup-day-index", self.main_js)

        # 4. 週間カレンダーでクリックキックオフ（openMatchPrecheckModal）がサポートされていること
        self.assertIn("onclick=\"openMatchPrecheckModal()\"", self.main_js)

    def test_scheduling_collision_resolution_and_interval_guarantee(self):
        """欧州戦と国内カップ戦のバッティング回避、最低中2日インターバル、週上限スロット制限の検証"""
        # 1. 欧州戦最優先固定
        self.assertIn("euroScheduleList", self.comp_js)
        self.assertIn("domesticCupScheduleList", self.comp_js)

        # 2. スロット検証ヘルパーと最低中2日ルール（差3日以上空けること）
        self.assertIn("isCupSlotValid", self.comp_js)
        self.assertIn("Math.abs(d.dayIndex - other.dayIndex) < 3", self.comp_js)

        # 3. 週上限スロット制限（月曜〜日曜でミッドウィーク1試合制限）
        self.assertIn("getCalendarWeekIndex", self.comp_js)

        # 4. 空きミッドウィークへの自動スライド探索
        self.assertIn("candidates", self.comp_js)
        self.assertIn("Math.abs(d.dayIndex - baseIdx)", self.comp_js)

    def test_unconfirmed_tournament_schedule_hidden(self):
        """トーナメントの未決定スケジュールがカレンダー（月間・週間）に表示されないこと"""
        # 月間カレンダーで対戦未定時の [CUP] バッジ描画（eventTagHtml += cal-cup-badge）が削除されていること
        self.assertNotIn("eventTagHtml += `<div class=\"cal-cup-badge", self.main_js)
        # 週間カレンダーで対戦未定時の [CUP] 開催日バッジが削除されていること
        self.assertNotIn("[${compCode}] 開催日", self.main_js)
        # matchInfo.oppClub がある場合のみ試合として描画・カウントされること
        self.assertIn("d.isCupMatchDay && mInfo && mInfo.oppClub", self.main_js)
        self.assertIn("Boolean(matchInfo && matchInfo.oppClub && !day.played)", self.main_js)

    def test_mobile_calendar_fixed_six_rows_and_zero_scroll(self):
        """モバイルカレンダーが常に6行（全42マス）分の枠を確保し、縦スクロールゼロで1画面に収まること"""
        # 1. main.js で常に42マス（7列×6行）分の枠を生成していること
        self.assertIn("while (cellsHtml.length < 42)", self.main_js)
        self.assertIn("cellsHtml.push('<div class=\"cal-day-cell is-empty\" aria-hidden=\"true\"></div>')", self.main_js)

        # 2. style.css モバイルカレンダーで 6行均等グリッドが設定されていること
        self.assertIn("grid-template-rows: repeat(6, 1fr) !important;", self.style_css)

        # 3. カレンダー表示時にスクロールをゼロにする overflow: hidden 設定
        self.assertIn("body[data-active-tab=\"team\"][data-team-subtab=\"schedule\"][data-schedule-mode=\"calendar\"]", self.style_css)
        self.assertIn("overflow: hidden !important;", self.style_css)

    def test_cup_round_labels_consistency(self):
        """国内カップ戦の1回戦（R32）が2回戦と誤表記されず、1回戦として正しく表示されること"""
        # competitions.js の domesticCupScheduleList で R32 が「1回戦」になっていること
        self.assertIn("roundKey: 'R32', label: 'L-CUP 1回戦'", self.comp_js)
        self.assertIn("roundKey: 'R32', label: 'N-CUP 1回戦'", self.comp_js)
        self.assertNotIn("roundKey: 'R32', label: 'L-CUP 2回戦'", self.comp_js)
        self.assertNotIn("roundKey: 'R32', label: 'N-CUP 2回戦'", self.comp_js)

        # main.js の getCalendarDayPlayerMatch で R32 が「1回戦」にマッピングされていること
        self.assertIn("day.cupRoundKey === 'R32'", self.main_js)
        self.assertIn("roundText = '1回戦'", self.main_js)

    def test_phase1_header_settings_and_match_team_distinction(self):
        """フェーズ1: ヘッダー設定マークボタンと試合中チーム識別・滑らかな速度制御が存在すること"""
        # 1. ヘッダー右上設定ボタン
        self.assertIn('id="btn-header-settings"', self.index_html)
        self.assertIn('.header-settings-icon', self.style_css)

        # 2. 設定モーダル内のタイトルへ戻るボタン & 試合スピード設定
        self.assertIn('id="btn-settings-return-title"', self.index_html)
        self.assertIn('id="setting-match-speed"', self.index_html)

        # 3. 試合中チーム識別（自チームハイライト・YOUタグ・トークン識別）
        self.assertIn('match-live-you-tag', self.main_js)
        self.assertIn('.match-live-team.is-player', self.style_css)
        self.assertIn('.pitch-2d-token.token-player', self.style_css)
        self.assertIn('popup-player', self.main_js)
        self.assertIn('.match-pitch-event-popup.popup-player', self.style_css)

        # 4. 試合スピードと連動したスムーズ移動
        self.assertIn('cubic-bezier(0.25, 1, 0.5, 1)', self.main_js)

if __name__ == '__main__':
    unittest.main()
