import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read_text(rel_path: str) -> str:
    return (ROOT / rel_path).read_text(encoding='utf-8')


class TestSecretaryDialogue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = read_text('index.html')
        cls.dialogue_js = read_text('secretary-dialogue.js')
        cls.main_js = read_text('main.js')
        cls.css = read_text('style.css')

    def test_1_secretary_dialogue_loaded_before_main_and_after_cinematic(self):
        """secretary-dialogue.js の読み込み順序と本部アドバイス要素を検証"""
        self.assertIn('id="secretary-office-advice"', self.html)
        cin_pos = self.html.find('src="cinematic.js')
        dlg_pos = self.html.find('src="secretary-dialogue.js')
        main_pos = self.html.find('src="main.js')
        self.assertGreater(cin_pos, 0)
        self.assertGreater(dlg_pos, cin_pos)
        self.assertGreater(main_pos, dlg_pos)

    def test_2_all_events_and_3_tones_defined(self):
        """全16イベントおよび状況別アドバイスが3秘書口調で定義されていること"""
        expected_keys = [
            'onboarding',
            'club_opening',
            'winter_market_open',
            'deadline_day',
            'incoming_offer',
            'sponsor_deadline_soon',
            'commercial_setup_reminder',
            'contract_expiry_warning',
            'psr_or_board_crisis',
            'offseason_guide',
            'staff_required',
            'outgoing_offer_reply',
            'manager_hired',
            'signing_manager_thanks',
            'monthly_meeting',
            'match_report',
        ]
        for key in expected_keys:
            self.assertIn(f"case '{key}':", self.dialogue_js, f"Missing event dialogue key: {key}")

        for tone in ['active:', 'calm:', 'polite:']:
            self.assertGreaterEqual(self.dialogue_js.count(tone), 15, f"Insufficient tone coverage for {tone}")

        self.assertIn('function getOfficeBriefingAdvice(', self.dialogue_js)

    def test_3_novel_multipage_modal_and_compliance(self):
        """showGmModal の複数ページ送り（speechPages）・スキップ廃止・拡大次へボタン・GEMINI.md 規約準拠を検証"""
        for sym in ['speechPages', 'dataset.vnPageNext', 'gm-vn-page-counter']:
            self.assertIn(sym, self.main_js, f"Missing VN multipage symbol: {sym}")
        self.assertNotIn('dataset.vnPageSkip', self.main_js)
        self.assertNotIn('.gm-vn-skip-pages-btn', self.css)

        for css_cls in ['.gm-vn-page-nav', '.gm-vn-page-counter', '.gm-vn-next-prompt-btn', '.secretary-office-advice']:
            self.assertIn(css_cls, self.css)

        # 絵文字・実在リーグ名・角括弧メタラベル禁止
        emoji_pattern = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertIsNone(emoji_pattern.search(self.dialogue_js), 'secretary-dialogue.js must not contain emojis')
        for forbidden in ['プレミアリーグ', 'チャンピオンズリーグ', 'ヨーロッパリーグ', '[STEP']:
            self.assertNotIn(forbidden, self.dialogue_js)

    def test_4_main_js_wired_to_secretary_dialogue(self):
        """main.js から SecretaryDialogue のイベント・新規5大アラート・本部アドバイスが呼ばれていること"""
        for needle in [
            "getEventDialogue('onboarding'",
            "getEventDialogue('club_opening'",
            "getEventDialogue('winter_market_open'",
            "getEventDialogue('deadline_day'",
            "getEventDialogue('incoming_offer'",
            "getEventDialogue('sponsor_deadline_soon'",
            "getEventDialogue('commercial_setup_reminder'",
            "getEventDialogue('contract_expiry_warning'",
            "getEventDialogue('psr_or_board_crisis'",
            "getEventDialogue('offseason_guide'",
            "getEventDialogue('manager_hired'",
            "getEventDialogue('monthly_meeting'",
            "getEventDialogue('match_report'",
            'SecretaryDialogue.getOfficeBriefingAdvice(',
        ]:
            self.assertIn(needle, self.main_js, f"Missing SecretaryDialogue hook in main.js: {needle}")


if __name__ == '__main__':
    unittest.main()
