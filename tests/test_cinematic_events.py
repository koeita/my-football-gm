import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read_text(rel_path: str) -> str:
    return (ROOT / rel_path).read_text(encoding='utf-8')


class TestCinematicEvents(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = read_text('index.html')
        cls.cinematic_js = read_text('cinematic.js')
        cls.storage_js = read_text('storage.js')
        cls.main_js = read_text('main.js')
        cls.match_js = read_text('match-engine.js')
        cls.css = read_text('style.css')

    def test_1_cinematic_script_order_and_dom_present(self):
        """cinematic.js の読み込み順（audio.js の後、main.js の前）と DOM/設定要素を検証"""
        self.assertIn('id="cinematic-overlay"', self.html)
        self.assertIn('id="setting-cinematic-mode"', self.html)
        audio_pos = self.html.find('src="audio.js')
        cin_pos = self.html.find('src="cinematic.js')
        main_pos = self.html.find('src="main.js')
        self.assertGreater(audio_pos, 0)
        self.assertGreater(cin_pos, audio_pos)
        self.assertGreater(main_pos, cin_pos)

    def test_2_cinematic_engine_api_and_css_compliance(self):
        """CinematicOverlay の必須APIと GEMINI.md デザイン規約（絵文字・実在名禁止）を検証"""
        for sym in ['const CinematicOverlay =', 'function canPlay(', 'function enqueue(', 'function skip(', 'function clear(']:
            self.assertIn(sym, self.cinematic_js)

        for css_cls in ['.cinematic-overlay', '.cinematic-band', '.cinematic-stage', '.cinematic-scoreboard', '.cinematic-confetti-piece']:
            self.assertIn(css_cls, self.css)

        # 実在大会名・絵文字禁止
        for forbidden in ['プレミアリーグ', 'チャンピオンズリーグ', 'ヨーロッパリーグ', '⚽', '🏆', '✨', '💰']:
            self.assertNotIn(forbidden, self.cinematic_js)

        emoji_pattern = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertIsNone(emoji_pattern.search(self.cinematic_js), 'cinematic.js must not contain emojis')

    def test_3_settings_persistence_for_cinematic_mode(self):
        """storage.js で cinematicMode 設定が保存・復元・同期されること"""
        self.assertIn("cinematicMode: 'all'", self.storage_js)
        self.assertIn("setting-cinematic-mode", self.storage_js)
        self.assertIn("appSettings.cinematicMode =", self.storage_js)

    def test_4_all_12_event_hooks_wired(self):
        """全12種のフルスクリーン演出イベントが main.js / match-engine.js に接続されていること"""
        main_and_match = self.main_js + '\n' + self.match_js
        event_types = [
            'player_signing',
            'player_departure',
            'youth_promotion',
            'contract_renewal',
            'match_fulltime',
            'trophy_championship',
            'division_change',
            'manager_appointed',
            'stadium_inauguration',
            'individual_award',
            'sponsor_deal',
            'player_breakthrough',
        ]
        for ev in event_types:
            self.assertIn(f"type: '{ev}'", main_and_match, f"Missing cinematic hook for {ev}")

        # クイック試合時は通常試合終了カットインをスキップし、決勝や観戦時は再生する判定があること
        self.assertIn('if (!isQuickResult || isFinalMatch)', self.match_js)


if __name__ == '__main__':
    unittest.main()
