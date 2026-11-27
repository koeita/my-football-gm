import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT_DIR, rel_path), 'r', encoding='utf-8') as f:
        return f.read()


class TestBudgetFinanceSystem(unittest.TestCase):
    def setUp(self):
        self.models_js = read_text('models.js')
        self.main_js = read_text('main.js')
        self.storage_js = read_text('storage.js')
        self.html = read_text('index.html')
        self.css = read_text('style.css')

    def test_1_models_budget_functions_defined(self):
        """models.js に分割予算・配分・検証・売却還元ヘルパーが実装されていること"""
        required_fns = [
            'function getTransferRetentionInfo(club)',
            'function getTransferRetentionRate(club)',
            'function allocateSeasonBudgets(club,',
            'function ensureClubBudgetFields(club)',
            'function syncTransferBudgetWithFunds(club)',
            'function getClubBudgetSummary(club)',
            'function reallocateClubBudget(club, targetTransferBudget)',
            'function checkTransferBudgetAvailability(club, upfrontFee)',
            'function checkWageBudgetAvailability(club, deltaWeeklyWage)',
            'function applyPlayerSaleBudgetProceeds(club, netFee)',
        ]
        for fn in required_fns:
            self.assertIn(fn, self.models_js)

    def test_2_main_budget_enforcement_and_lifecycle(self):
        """main.js に予算配分・移籍/延長/スタッフ/ユース制限・売却還元が組み込まれていること"""
        self.assertIn('allocateSeasonBudgets(c)', self.main_js)
        self.assertIn('checkTransferBudgetAvailability(playerClub,', self.main_js)
        self.assertIn('checkWageBudgetAvailability(playerClub,', self.main_js)
        self.assertIn('applyPlayerSaleBudgetProceeds(playerClub, netFee)', self.main_js)
        self.assertIn('syncTransferBudgetWithFunds(', self.main_js)
        self.assertIn('function renderFinanceBudgetPanel()', self.main_js)
        self.assertIn('reallocateClubBudget(playerClub,', self.main_js)

    def test_3_html_and_storage_finance_ui(self):
        """index.html と storage.js に財務・予算タブ、ヘッダー給与枠、後方互換補完があること"""
        self.assertIn('id="header-wage-budget"', self.html)
        self.assertIn('id="facilities-subtab-btn-finance"', self.html)
        self.assertIn('id="facilities-subview-finance"', self.html)
        self.assertIn('id="finance-budget-dashboard-root"', self.html)
        self.assertIn('id="board-psr-sponsor-panel"', self.html)
        self.assertEqual(self.html.count('id="board-psr-sponsor-panel"'), 1)
        self.assertIn('ensureClubBudgetFields(c)', self.storage_js)
        self.assertIn("facilitiesSubtab: gameState.facilitiesSubtab || 'finance'", self.storage_js)

    def test_4_css_braces_and_dashboard_rules(self):
        """style.css に財務ダッシュボードのフラット・モバイル対応ルールがあり波括弧が一致すること"""
        self.assertIn('.finance-summary-strip', self.css)
        self.assertIn('.finance-rebalance-grid', self.css)
        self.assertIn('.finance-range-slider', self.css)
        self.assertIn('#facilities-subnav-bar', self.css)
        self.assertEqual(self.css.count('{'), self.css.count('}'))

    def test_5_no_emojis_in_render_finance_budget_panel(self):
        """新規実装した財務ダッシュボードに絵文字が含まれていないこと"""
        start = self.main_js.find('function renderFinanceBudgetPanel()')
        self.assertNotEqual(start, -1)
        end = self.main_js.find('function renderFacilitiesAndYouth()', start)
        self.assertNotEqual(end, -1)
        snippet = self.main_js[start:end]
        emoji_re = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertEqual(emoji_re.findall(snippet), [])


if __name__ == '__main__':
    unittest.main()
