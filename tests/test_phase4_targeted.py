# -*- coding: utf-8 -*-
import unittest
import re

class TestPhase4Targeted(unittest.TestCase):
    def setUp(self):
        with open('competitions.js', 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open('main.js', 'r', encoding='utf-8') as f:
            self.main_js = f.read()
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

if __name__ == '__main__':
    unittest.main()
