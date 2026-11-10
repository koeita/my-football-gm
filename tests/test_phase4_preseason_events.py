import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestPhase4PreseasonAndEvents(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.js = f.read()
        with open(os.path.join(ROOT_DIR, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(ROOT_DIR, 'events.js'), 'r', encoding='utf-8') as f:
            self.events_js = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_events_script_included_in_html(self):
        """index.html に events.js が読み込まれていること"""
        self.assertIn('<script src="events.js', self.html)

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

    def test_preseason_match_simulation_in_main_js(self):
        """playCurrentCupMatchday でプレシーズン親善杯の試合消化および賞金・疲労軽減が実装されていること"""
        self.assertIn("currentDay.cupCompType === 'preseasonCup'", self.js)
        self.assertIn("WCTトロフィー獲得", self.js)
        self.assertIn("isPreseasonMatch", self.js)

    def test_random_gm_events_definitions(self):
        """events.js に選択式GMイベントマスターが定義され、複数の選択肢とapplyを持つこと"""
        self.assertIn('const RANDOM_GM_EVENTS =', self.events_js)
        self.assertIn('EVENT_TRANSFER_REQUEST', self.events_js)
        self.assertIn('EVENT_LOCKER_ROOM_FEUD', self.events_js)
        self.assertIn('EVENT_GLOBAL_SPONSOR', self.events_js)
        self.assertIn('EVENT_YOUTH_WONDERKID', self.events_js)
        self.assertIn('EVENT_MEDICAL_OVERLOAD', self.events_js)
        self.assertIn('EVENT_FAN_FESTIVAL', self.events_js)
        self.assertIn('function checkAndTriggerGmEvent()', self.events_js)
        self.assertIn('function openGmEventModal(', self.events_js)
        self.assertIn('function resolveGmEventOption(', self.events_js)

    def test_gm_duties_event_integration(self):
        """main.js の GMタスク（renderGmDuties / handleGmDutyAction）に緊急決断イベントが統合されていること"""
        self.assertIn('gameState.pendingGmEvent', self.js)
        self.assertIn('action: \'open-gm-event\'', self.js)
        self.assertIn('actionKey === \'open-gm-event\'', self.js)

    def test_phase4_css_styles(self):
        """style.css にGMイベントモーダルおよび選択肢カードのスタイルが定義されていること"""
        self.assertIn('.gm-event-modal-card', self.css)
        self.assertIn('.gm-event-option-card', self.css)
        self.assertIn('.gm-event-option-badge', self.css)
        self.assertIn('.btn-select-gm-option', self.css)

if __name__ == '__main__':
    unittest.main()
