# -*- coding: utf-8 -*-
import unittest
import re

class TestCompetitionsPhase4(unittest.TestCase):
    def setUp(self):
        with open('competitions.js', 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open('main.js', 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open('index.html', 'r', encoding='utf-8') as f:
            self.index_html = f.read()
        with open('style.css', 'r', encoding='utf-8') as f:
            self.style_css = f.read()

    def test_championship_clubs_count(self):
        """2部リーグ架空24クラブが正しく定義されていること"""
        matches = re.findall(r"id:\s*'c\d{2}'", self.comp_js)
        self.assertEqual(len(matches), 24, "Championship clubs count must be 24")

    def test_european_cups_36_teams(self):
        """欧州3大カップ戦（CL, EL, ECL）が各36チーム参加、全8節リーグフェーズで構成されていること"""
        self.assertIn("cl36", self.comp_js)
        self.assertIn("el36", self.comp_js)
        self.assertIn("ecl36", self.comp_js)
        self.assertIn("round <= 8", self.comp_js)
        self.assertIn("renderEuroLeaguePhaseStandingsHtml", self.comp_js)

    def test_premier_league_standings_zone_tags(self):
        """PCのプレミアリーグ順位表に CL圏、EL圏、降格圏 の文字バッジが表示されること"""
        self.assertIn("standings-zone-tag zone-tag-cl", self.main_js)
        self.assertIn("standings-zone-tag zone-tag-el", self.main_js)
        self.assertIn("standings-zone-tag zone-tag-rel", self.main_js)
        self.assertIn("CL圏", self.main_js)
        self.assertIn("EL圏", self.main_js)
        self.assertIn("降格圏", self.main_js)

    def test_championship_standings_no_promo_releg_text(self):
        """2部リーグ順位表から昇格圏・降格圏の文字表示が撤廃され、プレミアリーグと同一テーブル構造であること"""
        # main.js 内の 2部リーグ描画部で badge-promo, badge-releg が使われていないこと
        self.assertIn("col-num col-played", self.main_js)
        self.assertNotIn("badge-promo", self.main_js)
        self.assertNotIn("badge-releg", self.main_js)

    def test_schedule_congestion_logic(self):
        """過密日程計算とスタミナ・怪我倍率補正が存在すること"""
        self.assertIn("checkScheduleCongestion", self.comp_js)
        self.assertIn("injuryChanceMultiplier", self.comp_js)
        self.assertIn("staminaMultiplier", self.comp_js)

    def test_style_css_rules(self):
        """style.css に zone-tag-cl, euro-league-header 等のスタイルが含まれていること"""
        self.assertIn(".zone-tag-cl", self.style_css)
        self.assertIn(".zone-tag-el", self.style_css)
        self.assertIn(".zone-tag-rel", self.style_css)
        self.assertIn(".euro-league-header", self.style_css)

if __name__ == '__main__':
    unittest.main()
