import os
import unittest
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestPhase3ChartsAndStats(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.js = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_stats_category_nav_bar_in_html(self):
        """個人スタッツ画面に7大カテゴリーナビゲーションバーが定義されていること"""
        self.assertIn('id="stats-category-nav-bar"', self.html)
        required_cats = ['goals', 'assists', 'ratings', 'cleansheets', 'moms', 'appearances', 'cards']
        for cat in required_cats:
            self.assertIn(f'data-stats-cat="{cat}"', self.html, f"Missing category tab: {cat}")

    def test_profile_market_value_tab_in_html(self):
        """選手プロフィールモーダルに「市場価値推移」タブボタンが存在すること"""
        self.assertIn('data-profile-tab="market-value"', self.html)

    def test_player_value_history_logic_in_js(self):
        """選手市場価値推移データ（valueHistory）管理関数が定義されていること"""
        self.assertIn('function ensurePlayerValueHistory(', self.js)
        self.assertIn('calculatePlayerMarketValue', self.js)
        # 月替わり時の更新ロジック
        self.assertIn('nextDay.day === 1', self.js)

    def test_market_value_svg_chart_in_js(self):
        """市場価値推移インラインSVG折れ線グラフ描画関数が定義されていること"""
        self.assertIn('function buildPlayerMarketValueChartSvg(', self.js)
        self.assertIn('function buildPlayerMarketValueTabHtml(', self.js)
        self.assertIn('<svg class="market-value-svg"', self.js)
        self.assertIn('<polyline points=', self.js)
        self.assertIn('PEAK', self.js)
        self.assertIn('開幕時', self.js)

    def test_profile_modal_tab_switching_market_value(self):
        """switchProfileModalTab で market-value タブがサポートされていること"""
        self.assertIn("'market-value'", self.js)
        self.assertIn('data-profile-panel="market-value"', self.js)

    def test_league_stats_multi_categories_in_js(self):
        """7大カテゴリーのスタッツ定義と renderLeagueStats 関数が実装されていること"""
        self.assertIn('function renderLeagueStats(', self.js)
        self.assertIn('const LEAGUE_STATS_CATEGORIES =', self.js)
        categories = ['goals', 'assists', 'ratings', 'cleansheets', 'moms', 'appearances', 'cards']
        for c in categories:
            self.assertIn(f"{c}:", self.js, f"Category {c} missing in LEAGUE_STATS_CATEGORIES")

    def test_mom_and_cards_simulation_in_js(self):
        """試合後にMOM獲得数（momCount）およびカード（yellowCards/redCards）が記録されること"""
        self.assertIn('entry.p.momCount = (entry.p.momCount || 0) + 1', self.js)
        self.assertIn('target.yellowCards = (target.yellowCards || 0) + 1', self.js)
        self.assertIn('target.redCards = (target.redCards || 0) + 1', self.js)

    def test_phase3_css_styles_exist(self):
        """個人スタッツバーと市場価値SVGグラフのCSSが定義されていること"""
        self.assertIn('.stats-category-nav-bar', self.css)
        self.assertIn('.stats-cat-btn', self.css)
        self.assertIn('.market-value-chart-wrapper', self.css)
        self.assertIn('.market-value-svg', self.css)
        self.assertIn('.profile-metrics-row-4col', self.css)

    def test_market_value_from_ovr_and_age_safety(self):
        """OVR直接計算関数とNaN対策が実装されていること"""
        self.assertIn('function calculateMarketValueFromOvrAndAge(', self.js)
        self.assertIn('hasInvalid = Array.isArray(p.valueHistory)', self.js)
        self.assertIn('safePeakVal = Number.isFinite(peakVal)', self.js)

if __name__ == '__main__':
    unittest.main()
