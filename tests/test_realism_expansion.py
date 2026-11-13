#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT_DIR, rel_path), 'r', encoding='utf-8') as f:
        return f.read()


class TestRealismExpansion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_js = read_text('data.js')
        cls.models_js = read_text('models.js')
        cls.match_js = read_text('match-engine.js')
        cls.storage_js = read_text('storage.js')
        cls.main_js = read_text('main.js')
        cls.html = read_text('index.html')
        cls.css = read_text('style.css')

    def test_1_discipline_subs_and_roles(self):
        """規律（累積警告・出場停止）、試合中10人戦、自動5人交代、役割指定が実装されていること"""
        self.assertIn('function isPlayerSuspendedForComp(', self.models_js)
        self.assertIn('function applyPostMatchDiscipline(', self.match_js)
        self.assertIn('function executeAutoSubstitutions(', self.match_js)
        self.assertIn('function autoAssignClubRoles(', self.models_js)
        self.assertIn('homeRedCard', self.match_js)
        self.assertIn('id="tactical-roles-chem-bar"', self.html)
        self.assertIn('SUB_POLICY_DEFINITIONS', self.data_js)

    def test_2_scouting_fog_of_war_and_opponent_preview(self):
        """スカウティングの霧（Fog of War）と対戦スカウティングレポート拡張が実装されていること"""
        self.assertIn('function getPlayerScoutedView(', self.models_js)
        self.assertIn('function assignScoutToPlayer(', self.models_js)
        self.assertIn('function advanceScoutingProgressDaily(', self.models_js)
        self.assertIn('data-scout-player-id', self.main_js)
        self.assertIn('scout-analysis-panel', self.main_js)

    def test_3_transfer_window_clauses_sponsor_and_psr(self):
        """移籍ウィンドウ厳格化、契約条項・分割払い・セルオン・買取OP、スポンサー・PSR制裁が実装されていること"""
        self.assertIn('function isTransferWindowCurrentlyOpen(', self.main_js)
        self.assertIn('function evaluateClubPSR(', self.models_js)
        self.assertIn('function processSeasonEndFinanceAndPSR(', self.main_js)
        self.assertIn('SPONSOR_TEMPLATES', self.data_js)
        self.assertIn('PSR_MAX_3YR_DEFICIT', self.data_js)
        self.assertIn('neg-installment-select', self.main_js)
        self.assertIn('neg-sellon-select', self.main_js)
        self.assertIn('neg-buy-option-select', self.main_js)

    def test_4_morale_chemistry_reputation_and_board_crisis(self):
        """選手モラル・序列・ケミストリー・クラブ格・理事会解任再スタートが実装されていること"""
        self.assertIn('function calculateClubChemistryAndFamiliarity(', self.models_js)
        self.assertIn('function updatePlayerMoraleAndStatuses(', self.models_js)
        self.assertIn('function updateBoardConfidenceAfterMatch(', self.models_js)
        self.assertIn('function openBoardCrisisModal(', self.main_js)
        self.assertIn('function handleBoardRelegationRestart(', self.main_js)
        self.assertIn('id="board-crisis-modal"', self.html)
        self.assertIn('id="board-psr-sponsor-panel"', self.html)

    def test_5_international_break_and_save_compatibility(self):
        """代表ウィークイベントとセーブ/ロード後方互換補完が実装されていること"""
        self.assertIn('NATIONAL_TEAM_STRENGTHS', self.data_js)
        self.assertIn('function processInternationalBreakEvent(', self.main_js)
        self.assertIn('day-event-intl', self.main_js)
        self.assertIn('cal-event-intl', self.main_js)
        self.assertIn("appendLiveCommentary(`${min}'`, ev.text, 'ev-sub')", self.match_js)
        self.assertIn('lastMatchSubMinute', self.match_js)
        self.assertIn('ensureClubRealismFields(c)', self.storage_js)
        self.assertIn('scoutingIntel:', self.storage_js)
        self.assertIn('installments:', self.storage_js)
        self.assertIn('sellOnRights:', self.storage_js)


if __name__ == '__main__':
    unittest.main()
