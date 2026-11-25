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
        self.assertIn('optimizeClubBench(club', self.models_js)

    def test_7_non_league_matches_apply_sub_events_and_sub_fatigue(self):
        """リーグ以外の試合（WCT・欧州戦・国内カップ）でも交代イベントと途中出場疲労が反映されること"""
        self.assertIn('homeSubEvents: homeSubRes.subEvents || [],', self.match_js)
        self.assertIn('homeSubEvents: cupRatings.homeSubEvents || [],', self.match_js)
        self.assertIn('homeSubEvents: poRatings.homeSubEvents || [],', self.match_js)
        self.assertIn('homeSubEvents: cupFinalRatings.homeSubEvents || [],', self.match_js)
        self.assertIn('isHome ? cupFinalRatings.homeSubs : cupFinalRatings.awaySubs', self.match_js)

    def test_8_multi_year_sustainability_and_save_compression(self):
        """長期プレイ均衡・CPUスカッド世代交代・2部収益・セーブ軽量化が組み込まれていること"""
        self.assertIn('function replenishCpuSquadOffseason(', self.models_js)
        self.assertIn('function getClubMaxSupporters(', self.models_js)
        self.assertIn('function adjustClubSupporters(', self.models_js)
        self.assertIn('replenishCpuSquadOffseason(club, usedCpuNames)', self.main_js)
        self.assertIn('const d2HomeGate = Math.round(((h.supporters || 14000) * 0.055) / 10) * 10;', self.comp_js)
        self.assertIn('const leagueCentralTvShare = isD2Club ? 2000 : 18000;', self.main_js)
        self.assertIn('playCurrentMatchday(true)', self.main_js)
        self.assertIn('const slimScheduleWeeks =', read_text('storage.js'))
        self.assertIn('const slimSubEvent =', read_text('storage.js'))

    def test_9_euro_calibration_confidence_and_clean_ui(self):
        """欧州クラブ実力正規化・中位理事会信頼度緩和・キックオフ安定化とメタ表記除去が適用されていること"""
        self.assertIn('function isForeignEuroClub(', self.comp_js)
        self.assertIn('function getCalibratedForeignClubPower(', self.comp_js)
        self.assertIn('const isEuroComp =', self.models_js)
        self.assertIn('const isInToleranceZone =', self.models_js)
        self.assertNotIn('animation: pulse-kickoff', self.style_css)
        self.assertNotIn('animation: matchSummaryBtnPulse', self.style_css)

    def test_10_sponsor_tabs_reserve_swipe_and_weekly_schedule_stability(self):
        """スポンサー枠タブ固定、ベンチ外カード上スワイプ透過、週間スケジュール寸法固定が実装されていること"""
        self.assertIn('<div class="sponsor-modal-list-scroll">', self.main_js)
        self.assertIn('.sponsor-select-card {', self.style_css)
        self.assertIn('.sponsor-modal-list-scroll {', self.style_css)
        self.assertIn('.pitch-node:not(.bench-sub-item) {', self.style_css)
        self.assertIn('touch-action: pan-y !important;', self.style_css)
        self.assertIn('grid-template-columns: repeat(7, minmax(0, 1fr));', self.style_css)
        self.assertIn('height: 54px;', self.style_css)


if __name__ == '__main__':
    unittest.main()
