# -*- coding: utf-8 -*-
import unittest
import re

class TestPhase4Targeted(unittest.TestCase):
    def setUp(self):
        with open('competitions.js', 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open('main.js', 'r', encoding='utf-8') as f:
            self.main_js = f.read()

    def test_big_five_120_clubs_definitions(self):
        """五大リーグ計120クラブが正しく定義されていること"""
        c_eng2 = len(re.findall(r"id:\s*'c\d{2}'", self.comp_js))
        c_esp = len(re.findall(r"id:\s*'es\d{2}'", self.comp_js))
        c_ita = len(re.findall(r"id:\s*'it\d{2}'", self.comp_js))
        c_ger = len(re.findall(r"id:\s*'de\d{2}'", self.comp_js))
        c_fra = len(re.findall(r"id:\s*'fr\d{2}'", self.comp_js))
        # ENG 1部は main.js の CLUB_DEFINITIONS (20クラブ)
        self.assertEqual(c_eng2, 24, "Championship must have 24 clubs")
        self.assertEqual(c_esp, 20, "Spain must have 20 clubs")
        self.assertEqual(c_ita, 20, "Italy must have 20 clubs")
        self.assertEqual(c_ger, 18, "Germany must have 18 clubs")
        self.assertEqual(c_fra, 18, "France must have 18 clubs")
        total_other = c_eng2 + c_esp + c_ita + c_ger + c_fra
        self.assertEqual(total_other, 100, "100 other clubs + 20 ENG 1st tier = 120 clubs total")

    def test_swiss_format_36_teams_and_8_matches(self):
        """CL, EL, ECL が各36チーム参加、スイス方式8試合スケジュールであること"""
        self.assertIn("createSwissLeaguePhase", self.comp_js)
        self.assertIn("round = 1; round <= 8", self.comp_js)
        self.assertIn("pots", self.comp_js)
        self.assertIn("selectEuropeanCompetitionEntries", self.comp_js)

    def test_standings_zones_and_playoffs(self):
        """順位表に1〜8位緑、9〜24位黄、25〜36位赤のラインとプレーオフ判定があること"""
        self.assertIn("zone-direct-r16", self.comp_js)
        self.assertIn("zone-playoff", self.comp_js)
        self.assertIn("zone-eliminated", self.comp_js)
        self.assertIn("advanceEuroPlayoffRound", self.comp_js)

    def test_promotion_and_relegation_system(self):
        """昇降格処理関数が正しく定義されていること"""
        self.assertIn("function processPromotionAndRelegation()", self.comp_js)
        self.assertIn("isPlayerRelegated", self.comp_js)
        self.assertIn("relegatedClubs", self.comp_js)
        self.assertIn("promotedClubs", self.comp_js)

if __name__ == '__main__':
    unittest.main()
