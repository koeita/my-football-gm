#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT_DIR, rel_path), 'r', encoding='utf-8') as f:
        return f.read()


class TestBalanceAndTactics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models_js = read_text('models.js')
        cls.match_js = read_text('match-engine.js')
        cls.comp_js = read_text('competitions.js')
        cls.main_js = read_text('main.js')
        cls.data_js = read_text('data.js')
        cls.style_css = read_text('style.css')

    def test_1_tactics_balanced_without_extreme_double_penalty(self):
        """5戦術バランス: 極端な二重乗算（parkthebus 0.26/0.38等）が撤廃され、相性マトリックスが存在すること"""
        self.assertIn('applyTacticAndMatchup', self.match_js)
        self.assertNotIn('rawHomeLambda *= 0.26', self.match_js)
        self.assertNotIn('rawAwayLambda *= 0.26', self.match_js)
        self.assertNotIn('pAtk *= 0.52', self.match_js)
        self.assertIn('let rawHomeLambda = 1.46', self.match_js)
        self.assertIn('let rawAwayLambda = 1.24', self.match_js)

    def test_2_no_duplicate_sponsor_income_in_season_end(self):
        """財政整合性: シーズン終了時の旧式スポンサー収入二重加算が廃止され、processSeasonEndFinanceAndPSRに一本化されていること"""
        self.assertNotIn('const sponsorIncome = Math.round(((club.supporters || 15000) * 0.55) / 10) * 10;', self.main_js)
        self.assertNotIn('const sponsorIncome = Math.round(((club.supporters || 12000) * 0.35) / 10) * 10;', self.main_js)
        self.assertIn('return { playerSponsorIncome };', self.main_js)
        self.assertIn('finRes.playerSponsorIncome', self.main_js)

    def test_3_psr_includes_league_prize_and_division_rates(self):
        """PSR収益算出: リーグ順位賞金およびD1/D2別のホーム・アウェイ試合数/単価が正しく算入されていること"""
        psr_idx = self.main_js.index('function processSeasonEndFinanceAndPSR(')
        psr_body = self.main_js[psr_idx:psr_idx + 4500]
        self.assertIn('PRIZE_MONEY_TABLE', psr_body)
        self.assertIn('PRIZE_MONEY_TABLE_D2', psr_body)
        self.assertIn('leaguePrize', psr_body)
        self.assertIn('const gateUnit = isD2Club ? 0.055 : 0.085;', psr_body)
        self.assertIn('const awayTvUnit = isD2Club ? 450 : 1600;', psr_body)

    def test_4_d2_match_revenue_and_quick_match_scale(self):
        """2部財政＆実力整合性: 2部リーグ戦の入場料・放映権単価が適正化され、安全移籍予算およびsimQuickMatchと整合していること"""
        self.assertIn('const gateUnit = isD2League ? 0.055 : 0.085;', self.match_js)
        self.assertIn('const awayBroadcastingFee = isD2League ? 450 : 1600;', self.match_js)
        self.assertIn('const gateUnit = isD2Club ? 0.055 : 0.085;', self.models_js)
        self.assertIn('const estAwayTv = isD2Club ? 450 : 1600;', self.models_js)
        self.assertIn('const isD2Uninit =', self.comp_js)

    def test_5_mobile_header_no_wrap_and_3b_transfer_budget(self):
        """モバイルヘッダー1行固定と30億ポンド規模の移籍予算・安全枠算出が実装されていること"""
        self.assertIn('flex-wrap: nowrap !important;', self.style_css)
        self.assertIn('max-width: 112px !important;', self.style_css)
        self.assertIn('estGuaranteedEndRev', self.models_js)
        self.assertIn('initialFunds: 298000', self.data_js)
        self.assertIn('initialFunds: 94000', self.data_js)
        self.assertIn('club.funds = 28000;', self.comp_js)

    def test_6_manager_delegation_default_on_fatigue_and_bench_selection(self):
        """監督一任デフォルトON・疲労蓄積適正化・ベンチ枠動的選抜が実装されていること"""
        self.assertIn('managerDelegationEnabled: true', self.main_js)
        self.assertIn('gameState.managerDelegationEnabled = true;', self.main_js)
        self.assertIn('state.managerDelegationEnabled === undefined ? true : Boolean(state.managerDelegationEnabled)', read_text('storage.js'))
        self.assertIn('randInt(22, 27)', self.match_js)
        self.assertIn('function optimizeClubBench(', self.models_js)
        self.assertIn('optimizeClubBench(club);', self.models_js)


if __name__ == '__main__':
    unittest.main()
