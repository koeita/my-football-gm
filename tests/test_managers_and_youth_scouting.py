#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT_DIR, rel_path), 'r', encoding='utf-8') as f:
        return f.read()


class TestManagersAndYouthScouting(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_js = read_text('data.js')
        cls.models_js = read_text('models.js')
        cls.match_js = read_text('match-engine.js')
        cls.storage_js = read_text('storage.js')
        cls.main_js = read_text('main.js')
        cls.html = read_text('index.html')
        cls.css = read_text('style.css')

    def test_1_managers_database_expanded_and_ranked(self):
        """監督データベースが50名以上に拡充され、S/A/B/Cランクと複数ステータス定義が存在すること"""
        self.assertIn('const MANAGER_RANK_DEFINITIONS =', self.data_js)
        mgr_start = self.data_js.index('const MANAGERS_DATABASE = [')
        mgr_end = self.data_js.index('];', mgr_start)
        mgr_block = self.data_js[mgr_start:mgr_end]
        entries = re.findall(r"rank:\s*'[SABC]'", mgr_block)
        self.assertTrue(len(entries) in range(50, 200))
        for rk in ['S', 'A', 'B', 'C']:
            self.assertIn(f"rank: '{rk}'", mgr_block)

    def test_2_manager_and_coach_multi_stats_and_effects(self):
        """監督・コーチの総合ランク表示が廃止され各ステータスがランク(S/A/B/C/D)表記され、初期コーチ選択ステップがあること"""
        self.assertIn('function getStaffStatRank(', self.models_js)
        self.assertIn('function ensureManagerRankAndStats(', self.models_js)
        self.assertIn('function getManagerRankEffects(', self.models_js)
        self.assertIn('function ensureCoachStats(', self.models_js)
        self.assertIn('analysisBonus', self.models_js)
        self.assertIn('youthDevBonus', self.models_js)
        self.assertIn('getManagerRankEffects(club.manager)', self.match_js)
        self.assertNotIn('RANK ${mgr.rank', self.main_js)
        self.assertNotIn('RANK ${c.rank', self.main_js)
        self.assertIn('btn-back-to-mgr-step', self.main_js)
        self.assertIn('initial-coach-choice', self.main_js)
        self.assertIn('mgrProfiles', self.main_js)
        self.assertIn('coachProfiles', self.main_js)
        self.assertIn('btn-coach-spec-filter', self.main_js)

    def test_3_youth_scouting_regions_dispatch_and_reports(self):
        """ユーススカウト地域定義・派遣・日次進行・入団/昇格/見送りUIとストレージ互換が実装されていること"""
        self.assertIn('const YOUTH_SCOUT_REGIONS =', self.data_js)
        self.assertIn('function getYouthScoutMaxSlots(', self.models_js)
        self.assertIn('function dispatchYouthScout(', self.models_js)
        self.assertIn('function advanceYouthScoutingDaily(', self.models_js)
        self.assertIn('function signYouthScoutReportToAcademy(', self.models_js)
        self.assertIn('function promoteYouthScoutReportDirectly(', self.models_js)
        self.assertIn('id="youth-scouting-panel"', self.html)
        self.assertIn('function renderYouthScoutingPanel(', self.main_js)
        self.assertIn('activeYouthScouts:', self.storage_js)
        self.assertIn('youthScoutReports:', self.storage_js)
        self.assertIn('ensureManagerRankAndStats(c.manager)', self.storage_js)
        self.assertIn('.staff-stat-chip.stat-rank-S', self.css)
        self.assertIn('col-youth-pot', self.html)
        self.assertIn('col-youth-growth', self.html)
        self.assertNotIn('col-youth-atk', self.html)
        self.assertNotIn('col-youth-def', self.html)


if __name__ == '__main__':
    unittest.main()
