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

    def test_2_main_budget_enforcement_and_v2_ui(self):
        """main.js に予算配分・制約・売却還元・4タブ統合・財務内3ビュー＆適正プリセットが実装されていること"""
        self.assertIn('allocateSeasonBudgets(c)', self.main_js)
        self.assertIn('checkTransferBudgetAvailability(playerClub,', self.main_js)
        self.assertIn('checkWageBudgetAvailability(playerClub,', self.main_js)
        self.assertIn('applyPlayerSaleBudgetProceeds(playerClub, netFee)', self.main_js)
        self.assertIn('syncTransferBudgetWithFunds(', self.main_js)
        self.assertIn('function renderFinanceBudgetPanel()', self.main_js)
        self.assertIn('reallocateClubBudget(playerClub,', self.main_js)
        self.assertIn('snapToPoolRatio(0.75)', self.main_js)
        self.assertIn('snapToPoolRatio(0.55)', self.main_js)
        self.assertIn('snapToPoolRatio(0.30)', self.main_js)
        self.assertIn('calcSliderTrackPct', self.main_js)
        self.assertIn('--slider-pct', self.main_js)
        self.assertNotIn('id="finance-ratio-bar-transfer"', self.main_js)
        self.assertIn('function openCommercialSetupModal()', self.main_js)
        self.assertIn('function renderCommercialSummaryCard()', self.main_js)
        self.assertNotIn('commercial-section-banner-head', self.main_js)
        self.assertNotIn('commercial-setup-bar', self.main_js)
        self.assertIn("if (subtabKey === 'investment')", self.main_js)

    def test_3_html_and_storage_4tab_structure(self):
        """index.html が経営4タブ統合・興行モーダル構成であり、storage.js に互換移行と保存があること"""
        self.assertIn('id="header-wage-budget"', self.html)
        self.assertIn('id="facilities-subtab-btn-finance"', self.html)
        self.assertIn('id="facilities-subtab-btn-commercial"', self.html)
        self.assertIn('id="facilities-subtab-btn-staff"', self.html)
        self.assertIn('id="facilities-subtab-btn-youth"', self.html)
        self.assertNotIn('id="facilities-subtab-btn-investment"', self.html)
        self.assertIn('id="commercial-facilities-section"', self.html)
        self.assertIn('id="commercial-summary-root"', self.html)
        self.assertIn('id="commercial-setup-modal"', self.html)
        self.assertIn('id="commercial-modal-status"', self.html)
        self.assertIn('id="commercial-modal-footer"', self.html)
        self.assertIn('id="facilities-grid"', self.html)
        self.assertIn('id="finance-budget-dashboard-root"', self.html)
        self.assertIn('id="board-psr-sponsor-panel"', self.html)
        self.assertEqual(self.html.count('id="board-psr-sponsor-panel"'), 1)
        self.assertIn('ensureClubBudgetFields(c)', self.storage_js)
        self.assertIn("facilitiesSubtab: gameState.facilitiesSubtab || 'finance'", self.storage_js)
        self.assertIn("financeSubtab: gameState.financeSubtab || 'overview'", self.storage_js)
        self.assertIn("else if (gameState.facilitiesSubtab === 'investment')", self.storage_js)

    def test_4_css_braces_and_dashboard_rules(self):
        """style.css に4タブ・施設3列横並び・影除去・財務緑統一・1本スライダー・興行フッターがあり波括弧が一致すること"""
        self.assertIn('.finance-summary-strip', self.css)
        self.assertIn('.finance-inner-tabs', self.css)
        self.assertIn('.finance-ratio-bar', self.css)
        self.assertIn('.finance-ratio-meta', self.css)
        self.assertIn('.commercial-setup-modal-card', self.css)
        self.assertIn('.commercial-modal-footer', self.css)
        self.assertIn('.commercial-modal-sticky-top', self.css)
        self.assertIn('.tactical-side-column:not(.sheet-open)', self.css)
        self.assertIn('.finance-range-slider', self.css)
        self.assertIn('--slider-pct', self.css)
        self.assertIn('#facilities-subnav-bar', self.css)
        self.assertEqual(self.css.count('{'), self.css.count('}'))

    def test_5_no_emojis_in_render_finance_budget_panel(self):
        """財務ダッシュボードに絵文字が含まれていないこと"""
        start = self.main_js.find('function renderFinanceBudgetPanel()')
        self.assertNotEqual(start, -1)
        end = self.main_js.find('function renderFacilitiesAndYouth()', start)
        self.assertNotEqual(end, -1)
        snippet = self.main_js[start:end]
        emoji_re = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertEqual(emoji_re.findall(snippet), [])


if __name__ == '__main__':
    unittest.main()
