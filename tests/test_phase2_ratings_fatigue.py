import unittest
import re
import os

class TestPhase2RatingsAndFatigue(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.models_js_path = os.path.join(base_dir, 'models.js')
        cls.main_js_path = os.path.join(base_dir, 'main.js')
        cls.index_html_path = os.path.join(base_dir, 'index.html')
        cls.style_css_path = os.path.join(base_dir, 'style.css')

        with open(cls.models_js_path, 'r', encoding='utf-8') as f:
            models_js = f.read()
        with open(cls.main_js_path, 'r', encoding='utf-8') as f:
            main_js = f.read()
        cls.main_js = models_js + '\n' + main_js
        with open(cls.index_html_path, 'r', encoding='utf-8') as f:
            cls.index_html = f.read()
        with open(cls.style_css_path, 'r', encoding='utf-8') as f:
            cls.style_css = f.read()

    def test_fatigue_helper_functions_defined(self):
        """疲労度ヘルパー関数（getPlayerFatigue, getPlayerFatigueStatus, formatFatigueCellHtml）が定義されていること"""
        self.assertIn('function getPlayerFatigue(player)', self.main_js)
        self.assertIn('function getPlayerFatigueStatus(fatigueVal)', self.main_js)
        self.assertIn('function formatFatigueCellHtml(player)', self.main_js)

    def test_match_ratings_calculation_function(self):
        """評価点共通算出関数 calculateAndAssignMatchRatings が定義され、基準点6.7が使用されていること"""
        self.assertIn('function calculateAndAssignMatchRatings(', self.main_js)
        self.assertIn('let r = 6.7;', self.main_js)

    def test_post_match_fatigue_accumulation(self):
        """試合終了後の疲労蓄積（applyPostMatchPlayerFatigue）でスタミナ能力値破壊が排除され、fatigueが蓄積されること"""
        self.assertIn('function applyPostMatchPlayerFatigue(', self.main_js)
        # p.fatigue が加算されていること
        self.assertIn('p.fatigue = clamp((p.fatigue || 0) + fatigueDelta, 0, 100);', self.main_js)

    def test_calendar_daily_fatigue_recovery(self):
        """平日日程進行（advanceCalendarDay）で疲労度が1日あたり自然回復（-4）すること"""
        self.assertIn('p.fatigue = Math.max(0, p.fatigue - 4);', self.main_js)

    def test_match_summary_ratings_and_tabs(self):
        """マッチサマリー画面で全選手採点グリッドおよびサブナビタブが実装されていること"""
        self.assertIn('function buildSummaryPlayerRatingsHtml(', self.main_js)
        self.assertIn('summary-subnav-btn', self.main_js)
        self.assertIn('summary-ratings-grid', self.main_js)
        self.assertIn('summary-team-ratings-panel', self.main_js)

    def test_roster_table_fatigue_column(self):
        """ロスターテーブルに疲労度列が追加され、ヘッダーと各行が整合していること"""
        self.assertIn('<th class="col-num">疲労</th>', self.index_html)
        self.assertIn('${formatFatigueCellHtml(p)}', self.main_js)

    def test_style_css_fatigue_and_ratings(self):
        """style.cssに疲労度チップ（fatigue-chip）およびサマリー評価点（summary-ratings-grid）のスタイルが存在すること"""
        self.assertIn('.fatigue-chip', self.style_css)
        self.assertIn('.fatigue-good', self.style_css)
        self.assertIn('.fatigue-exhausted', self.style_css)
        self.assertIn('.summary-ratings-grid', self.style_css)
        self.assertIn('.summary-subnav-btn', self.style_css)
        self.assertIn('.summary-rat-mom', self.style_css)

if __name__ == '__main__':
    unittest.main()
