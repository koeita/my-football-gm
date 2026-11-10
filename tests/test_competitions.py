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

    def test_european_clubs_database(self):
        """欧州主要国（西・独・伊・仏）のクラブが各10クラブ以上定義されていること"""
        for country in ['SPAIN', 'GERMANY', 'ITALY', 'FRANCE']:
            self.assertIn(country, self.comp_js)
            country_block = re.search(rf"{country}:\s*\[(.*?)\]", self.comp_js, re.DOTALL)
            self.assertIsNotNone(country_block)
            clubs = re.findall(r"id:\s*'[a-z]{2}\d{2}'", country_block.group(1))
            self.assertGreaterEqual(len(clubs), 10, f"{country} must have at least 10 clubs")

    def test_domestic_cups_definitions(self):
        """リーグカップとナショナルカップが定義されていること"""
        self.assertIn("leagueCup", self.comp_js)
        self.assertIn("nationalCup", self.comp_js)
        self.assertIn("LGC", self.comp_js)
        self.assertIn("NAT", self.comp_js)

    def test_european_cups_definitions(self):
        """欧州3大カップ（CL, EL, ECL）が定義されていること"""
        self.assertIn("championsCup", self.comp_js)
        self.assertIn("europaCup", self.comp_js)
        self.assertIn("conferenceCup", self.comp_js)
        self.assertIn("'CL'", self.comp_js)
        self.assertIn("'EL'", self.comp_js)
        self.assertIn("'ECL'", self.comp_js)

    def test_promotion_and_relegation_system(self):
        """昇降格処理関数が定義され、自クラブ降格判定があること"""
        self.assertIn("function processPromotionAndRelegation()", self.comp_js)
        self.assertIn("isPlayerRelegated", self.comp_js)
        self.assertIn("relegatedClubs", self.comp_js)
        self.assertIn("promotedClubs", self.comp_js)

    def test_schedule_congestion_logic(self):
        """過密日程計算とスタミナ・怪我倍率補正が存在すること"""
        self.assertIn("checkScheduleCongestion", self.comp_js)
        self.assertIn("injuryChanceMultiplier", self.comp_js)
        self.assertIn("staminaMultiplier", self.comp_js)

    def test_index_html_integration(self):
        """index.html に competitions.js と UI コントロールが含まれていること"""
        self.assertIn("competitions.js", self.index_html)
        self.assertIn("comp-segment-nav", self.index_html)
        self.assertIn("comp-btn-prem", self.index_html)
        self.assertIn("comp-btn-championship", self.index_html)
        self.assertIn("comp-btn-domestic", self.index_html)
        self.assertIn("comp-btn-europe", self.index_html)
        self.assertIn("comp-bracket-wrapper", self.index_html)

    def test_main_js_integration(self):
        """main.js に新コンペティション連携ロジックが組み込まれていること"""
        self.assertIn("initSeasonCompetitions", self.main_js)
        self.assertIn("advanceChampionshipWeek", self.main_js)
        self.assertIn("playCurrentCupMatchday", self.main_js)
        self.assertIn("setupCompetitionNavListeners", self.main_js)
        self.assertIn("renderChampionshipStandingsHtml", self.main_js)
        self.assertIn("renderCupBracketHtml", self.main_js)

    def test_style_css_rules(self):
        """style.css に大会タブ・ブラケット・バッジのスタイルが含まれていること"""
        self.assertIn(".comp-segment-nav", self.style_css)
        self.assertIn(".comp-tab-btn", self.style_css)
        self.assertIn(".cal-cup-badge", self.style_css)
        self.assertIn(".bracket-match-card", self.style_css)
        self.assertIn(".zone-promotion", self.style_css)

if __name__ == '__main__':
    unittest.main()
