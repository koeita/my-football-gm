import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestPhase4Preseason(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.js = f.read()
        with open(os.path.join(ROOT_DIR, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_events_script_removed_from_html(self):
        """ランダムイベント撤廃に伴い、index.html に events.js が読み込まれていないこと"""
        self.assertNotIn('<script src="events.js', self.html)

    def test_preseason_cup_init_in_competitions(self):
        """competitions.js にプレシーズン親善杯（initPreseasonCup）が定義されていること"""
        self.assertIn('function initPreseasonCup()', self.comp_js)
        self.assertIn('ワールド・チャレンジ・トロフィー', self.comp_js)
        self.assertIn('preseasonCup', self.comp_js)
        self.assertIn('WCT', self.comp_js)

    def test_preseason_calendar_injection(self):
        """injectCupMatchesIntoCalendar でプレシーズン親善杯の日程が割り振られること"""
        self.assertIn("preseasonScheduleList", self.comp_js)
        self.assertIn("targetDay.cupCompType = 'preseasonCup'", self.comp_js)
        self.assertIn("WCT 第1戦", self.comp_js)

    def test_player_match_handles_preseason_in_main_js(self):
        """main.js の getCalendarDayPlayerMatch で preseasonCup が認識されること"""
        self.assertIn("day.cupCompType === 'preseasonCup'", self.js)
        self.assertIn("compKey: 'preseasonCup'", self.js)
        self.assertIn("isPreseason: true", self.js)

    def test_preseason_match_simulation_and_event_modal_in_main_js(self):
        """playCurrentCupMatchday でプレシーズン親善杯でも2D試合経過演出（openMatchEventModal）が呼ばれ、賞金・疲労軽減が実装されていること"""
        self.assertIn("currentDay.cupCompType === 'preseasonCup'", self.js)
        self.assertIn("WCTトロフィー獲得", self.js)
        self.assertIn("isPreseasonMatch", self.js)
        # プレシーズンでも openMatchEventModal で試合経過演出が見れること
        self.assertIn("openMatchEventModal(matchData, homeScorers, awayScorers", self.js)

    def test_preseason_and_virtual_opponent_players_use_alphabet_names(self):
        """プレシーズンおよび他国クラブの仮想相手選手がカタカナではなくアルファベット名（NATIONALITY_NAME_DATABASE）で生成されること"""
        # 旧カタカナ姓配列（euroLasts）が撤去されていること
        self.assertNotIn("const euroLasts =", self.js)
        for katakana_surname in ['モレノ', 'ロッシ', 'シュミット', 'デュボワ', 'フェラーリ']:
            self.assertNotIn(f"'{katakana_surname}'", self.js)

        # アルファベット名生成ヘルパーと国籍解決ヘルパーが使用されていること
        self.assertIn("function resolveClubCountryToNationality(", self.js)
        self.assertIn("function generateDeterministicAlphabetPlayerIdentity(", self.js)

        # プレシーズン招待クラブが独自 pre_* ID ではなく正規クラブ定義を参照し、2部初期化の後に実行されること
        for legacy_pre_id in ['pre_madrid', 'pre_bayern', 'pre_milan', 'pre_paris', 'pre_leeds', 'pre_sheff']:
            self.assertNotIn(f"id: '{legacy_pre_id}'", self.comp_js)
        init_idx = self.comp_js.index("function initSeasonCompetitions()")
        init_end = self.comp_js.index("function initPreseasonCup()", init_idx)
        init_block = self.comp_js[init_idx:init_end]
        self.assertLess(init_block.index("initChampionshipLeague();"), init_block.index("initPreseasonCup();"))

if __name__ == '__main__':
    unittest.main()
