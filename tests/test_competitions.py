# -*- coding: utf-8 -*-
import os
import unittest
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestCompetitionsPhase4(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.index_html = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.style_css = f.read()

    def test_championship_clubs_count(self):
        """2部リーグ架空24クラブが正しく定義されていること"""
        matches = re.findall(r"id:\s*'c\d{2}'", self.comp_js)
        self.assertEqual(len(matches), 24, "Championship clubs count must be 24")

    def test_european_cups_36_teams(self):
        """欧州3大カップ戦（ECT, EPC, ECS）が各36チーム参加、全8節リーグフェーズで構成されていること"""
        self.assertIn("function initEuropeanCups36()", self.comp_js)
        self.assertIn("participants.slice(0, 36)", self.comp_js)
        self.assertIn("'ECT'", self.comp_js)
        self.assertIn("'EPC'", self.comp_js)
        self.assertIn("'ECS'", self.comp_js)
        self.assertIn("round <= 8", self.comp_js)
        self.assertIn("renderEuroLeaguePhaseStandingsHtml", self.comp_js)

    def test_premier_league_standings_zones_and_legend(self):
        """1部リーグ順位表に左端カラーライン（zone-ucl, zone-uel, zone-rel）と下部凡例（ECT/EPC/降格）が表示されること"""
        self.assertIn("zone-ucl", self.main_js)
        self.assertIn("zone-uel", self.main_js)
        self.assertIn("zone-rel", self.main_js)
        self.assertIn("ユーロ・チャンピオンズ・トロフィー（ECT）出場権", self.main_js)
        self.assertIn("ユーロ・プレステージ・カップ（EPC）出場権", self.main_js)
        self.assertIn("セカンドディビジョン（ENG-D2）降格", self.main_js)

    def test_championship_standings_no_promo_releg_text(self):
        """2部リーグ順位表から昇格圏・降格圏の文字表示が撤廃され、1部リーグと同一テーブル構造であること"""
        self.assertIn("col-num col-played", self.main_js)
        self.assertNotIn("badge-promo", self.main_js)
        self.assertNotIn("badge-releg", self.main_js)

    def test_schedule_congestion_logic(self):
        """過密日程計算とスタミナ・怪我倍率補正が存在すること"""
        self.assertIn("checkScheduleCongestion", self.comp_js)
        self.assertIn("injuryChanceMultiplier", self.comp_js)
        self.assertIn("staminaMultiplier", self.comp_js)

    def test_style_css_rules(self):
        """style.css に順位表ゾーンおよび昇降格ハイライト用スタイルが含まれていること"""
        self.assertIn(".zone-tag-cl", self.style_css)
        self.assertIn(".zone-tag-el", self.style_css)
        self.assertIn(".zone-tag-rel", self.style_css)
        self.assertIn(".zone-promotion", self.style_css)

if __name__ == '__main__':
    unittest.main()
