# -*- coding: utf-8 -*-
import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TestPriorityAUxMarketEconomy(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open(os.path.join(ROOT_DIR, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(ROOT_DIR, 'avatar.js'), 'r', encoding='utf-8') as f:
            self.avatar_js = f.read()
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_5_quick_match_result_and_auto_halftime_option(self):
        """項目5: オフィス＆作戦確認モーダルのクイック結果導線と環境設定ハーフタイム自動進行が実装されていること"""
        # HTML上に作戦確認のクイック結果ボタンおよび設定モーダルのハーフタイム自動進行トグルが存在すること
        self.assertIn('id="btn-precheck-quick-result"', self.html)
        self.assertIn('id="setting-auto-halftime"', self.html)
        # オフィス画面MATCHDAYカードにもクイック結果ボタンが描画されること
        self.assertIn('id="btn-panel-quick-result"', self.main_js)
        self.assertIn('function playQuickMatchResult()', self.main_js)
        # openMatchEventModal が quickSummary オプションを受け取り、直接 transitionToMatchSummary() へ遷移できること
        self.assertIn('function openMatchEventModal(matchData, homeScorers, awayScorers, onComplete, options = {})', self.main_js)
        self.assertIn('if (options && options.quickSummary)', self.main_js)
        # ハーフタイム自動進行設定が appSettings に保存・分岐されていること
        self.assertIn('autoHalftimeResume: false', self.main_js)
        self.assertIn('if (appSettings.autoHalftimeResume)', self.main_js)

    def test_6_direct_market_negotiation_and_multi_tier_player_pool(self):
        """項目6: 市場一覧からのダイレクト交渉ボタン、および1部・2部・欧州主要クラブ・無所属選手の統合流通"""
        # カテゴリーフィルターと市場テーブル10列整合性
        self.assertIn('id="market-filter-category"', self.html)
        market_thead = re.search(r'<table class="data-table market-table">[\s\S]*?<thead>[\s\S]*?<tr>([\s\S]*?)</tr>', self.html)
        self.assertIsNotNone(market_thead)
        th_count = len(re.findall(r'<th[\s>]', market_thead.group(1)))
        self.assertEqual(th_count, 10)

        # 市場一覧でのダイレクト交渉ボタンとイベント委譲
        self.assertIn('btn-market-direct-offer', self.main_js)
        self.assertIn('data-formal-offer-id="${p.id}"', self.main_js)
        self.assertIn('data-profile-direct-offer="${p.id}"', self.main_js)

        # 2部初期スカッド保証、欧州主要クラブリスト生成、共通検索ヘルパー
        self.assertIn('function getEuropeanMajorClubDefinitions()', self.comp_js)
        self.assertIn('function findEuropeanClubDefinitionById(clubId)', self.comp_js)
        self.assertIn('function generateEuropeanTransferList(', self.main_js)
        self.assertIn('function findTransferTargetWithSeller(playerId)', self.main_js)
        self.assertIn('euroTransferList: gameState.euroTransferList || []', self.main_js)
        # 欧州リストアップ選手のアバターユニフォーム色解決
        self.assertIn('player.euroClubId', self.avatar_js)

    def test_7_weekly_payroll_deduction_and_safe_transfer_budget(self):
        """項目7: 毎週日曜の週次人件費引き落とし・シーズン末残週精算・開幕一括引き落とし廃止・実質移籍予算の明示"""
        self.assertIn('function getClubWeeklyPayroll(club)', self.main_js)
        self.assertIn('function getSafeTransferBudget(club)', self.main_js)
        self.assertIn('paidPayrollWeeks: gameState.paidPayrollWeeks || 0', self.main_js)
        # 毎週日曜（dayOfWeek === 0）に週次引き落としが実行されること
        self.assertIn('if (nextDay.dayOfWeek === 0 && (gameState.paidPayrollWeeks || 0) < 52)', self.main_js)
        # シーズン終了時に残り週分（52 - paidPayrollWeeks）が精算完了し、startNextSeasonでの一括二重引き落としが廃止されていること
        self.assertIn('const remPayrollWeeks = Math.max(0, 52 - (gameState.paidPayrollWeeks || 0));', self.main_js)
        self.assertNotIn('club.funds = (club.funds || 0) - payroll;', self.main_js)
        # ヘッダー・ショートリスト・市場・交渉モーダルに実質移籍予算（安全枠）と破産予防アラートが存在すること
        self.assertIn('id="header-safe-budget"', self.html)
        self.assertIn('class="metric-value-inline-row"', self.html)
        self.assertIn('id="shortlist-summary-safe-budget"', self.html)
        self.assertIn('neg-cashflow-warning', self.main_js)
        self.assertNotIn('id="neg-cashflow-warning-mount"', self.main_js)
        self.assertIn('.market-filter-bar .filter-group.filter-search-wrap', self.css)
        self.assertIn('.matchday-action-row.matchday-action-dual > button', self.css)
        self.assertEqual(self.css.count('{'), self.css.count('}'))


if __name__ == '__main__':
    unittest.main()
