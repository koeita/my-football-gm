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
        self.assertIn('setPointerCapture', self.main_js)
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
        self.assertNotIn('id="btn-close-commercial-modal"', self.html)
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
        self.assertIn('touch-action: none !important;', self.css)
        self.assertIn('--slider-pct', self.css)
        self.assertNotIn('btn-glossary-inline', self.css)
        self.assertIn('[data-glossary-key]', self.css)
        self.assertIn('#facilities-subnav-bar', self.css)
        self.assertEqual(self.css.count('{'), self.css.count('}'))

    def test_5_no_emojis_in_render_finance_budget_panel(self):
        """財務ダッシュボードおよび用語ガイドに絵文字が含まれていないこと"""
        start = self.main_js.find('function renderFinanceBudgetPanel()')
        self.assertNotEqual(start, -1)
        end = self.main_js.find('function renderFacilitiesAndYouth()', start)
        self.assertNotEqual(end, -1)
        snippet = self.main_js[start:end]
        emoji_re = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertEqual(emoji_re.findall(snippet), [])

    def test_6_glossary_system_implemented(self):
        """信頼度・戦術浸透度・チーム連携・理事会評価など6用語のタップ解説と役割統合を検証"""
        self.assertIn('const GM_GLOSSARY_DEFINITIONS', self.main_js)
        self.assertIn('function showGlossaryInfoPopup(key)', self.main_js)
        self.assertIn('function showGlossaryListPopup()', self.main_js)
        self.assertIn('id="btn-open-glossary-modal"', self.html)
        self.assertNotIn('btn-glossary-inline', self.html)
        self.assertNotIn('btn-glossary-inline', self.main_js)
        for key in ['manager_trust', 'tactical_penetration', 'team_chemistry', 'board_confidence', 'club_reputation', 'psr']:
            self.assertIn(f"'{key}'", self.main_js)
            self.assertIn(f'data-glossary-key="{key}"', self.main_js)
        self.assertNotIn("'tactical_familiarity'", self.main_js)
        self.assertNotIn('戦術習熟', self.main_js)
        g_start = self.main_js.find('const GM_GLOSSARY_DEFINITIONS')
        g_end = self.main_js.find('function processSeasonEnd(', g_start)
        g_block = self.main_js[g_start:g_end]
        emoji_re = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertEqual(emoji_re.findall(g_block), [])
        for meta in ['システムガイド', 'ゲーム内への効果', 'バフ', 'ペナルティ', 'ゴール生成倍率', 'キャリア終了', 'S級']:
            self.assertNotIn(meta, g_block)

    def test_7_tactical_penetration_and_chemistry_roles_distinct(self):
        """戦術浸透度（試合後のみ更新・監督戦術連動）とチーム連携（主将・モラル・適応）の役割分離を検証"""
        match_js = read_text('match-engine.js')
        self.assertIn('options.isPostMatch', self.models_js)
        self.assertIn('captainInXI', self.models_js)
        self.assertIn('famScale', match_js)
        self.assertIn('calculateClubChemistryAndFamiliarity(homeClub, { isPostMatch: true })', match_js)

    def test_8_board_metrics_tactic_select_and_settings_toggles(self):
        """作戦ボードから哲学一致表記を廃し浸透度/連携%＋戦術切替を追加し設定トグルを統一したことを検証"""
        self.assertIn('id="tactic-select-board"', self.html)
        self.assertIn('settings-switch-label', self.html)
        self.assertEqual(self.html.count('settings-switch-label'), 3)
        self.assertNotIn('布陣: 哲学合致', self.main_js)
        self.assertNotIn('戦術: 哲学合致', self.main_js)
        self.assertIn('戦術浸透度: ${fam}%', self.main_js)
        self.assertIn('チーム連携: ${chem}%', self.main_js)
        self.assertIn("getElementById('tactic-select-board')", self.main_js)
        self.assertIn('.board-tactic-select', self.css)
        self.assertIn('.settings-switch-input:checked ~ .delegation-toggle-track', self.css)


if __name__ == '__main__':
    unittest.main()
