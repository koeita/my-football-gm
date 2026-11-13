#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT_DIR, rel_path), 'r', encoding='utf-8') as f:
        return f.read()


class TestNationalityAndSquadRules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_js = read_text('data.js')
        cls.models_js = read_text('models.js')
        cls.comp_js = read_text('competitions.js')
        cls.match_js = read_text('match-engine.js')
        cls.main_js = read_text('main.js')
        cls.html = read_text('index.html')
        cls.css = read_text('style.css')

    def test_1_nationality_rule_constants_and_mapping(self):
        """国籍ルール定数（25人枠・非HG17枠・U-21免除・比率）および国コード変換マップが定義されていること"""
        self.assertIn('const SQUAD_NATIONALITY_RULES =', self.data_js)
        self.assertIn('MAX_SENIOR_SQUAD: 25', self.data_js)
        self.assertIn('MAX_NON_HG_SLOTS: 17', self.data_js)
        self.assertIn('U21_EXEMPT_MAX_AGE: 21', self.data_js)
        self.assertIn('D1_MIN_HOME_COUNT: 10', self.data_js)
        self.assertIn('D2_MIN_HOME_COUNT: 16', self.data_js)
        self.assertIn('const COUNTRY_CODE_TO_NATIONALITY =', self.data_js)

    def test_2_realistic_nationality_generation(self):
        """1部/2部スカッド・ユース・欧州市場・フリー市場で現実的な国籍比率生成が実装されていること"""
        self.assertIn('function pickWeightedNationality(', self.models_js)
        self.assertIn('D1_HOME_RATIO', self.models_js)
        self.assertIn('D2_HOME_RATIO', self.comp_js)
        self.assertIn('YOUTH_HOME_RATIO', self.models_js)
        self.assertIn('MARKET_HOME_RATIO', self.models_js)
        self.assertIn('COUNTRY_CODE_TO_NATIONALITY', self.models_js)

    def test_3_homegrown_and_25_man_rule_evaluation(self):
        """HG判定・U-21免除・25人枠/非HG17枠の評価およびベンチ枠ペナルティ算出関数が実装されていること"""
        self.assertIn('function isPlayerHomegrown(', self.models_js)
        self.assertIn('function isPlayerU21Exempt(', self.models_js)
        self.assertIn('function evaluateClubNationalityRules(', self.models_js)
        self.assertIn('function getEffectiveBenchLimit(', self.models_js)
        self.assertIn('youth.isYouthGraduate = true;', self.main_js)
        self.assertIn('prospect.isYouthGraduate = true;', self.main_js)

    def test_4_ui_warnings_and_bench_penalty_integration(self):
        """選手一覧・交渉モーダル・作戦ボード・試合前確認に警告表示とベンチ枠制限が統合されていること"""
        self.assertIn('id="roster-senior-count"', self.html)
        self.assertIn('id="roster-nonhg-count"', self.html)
        self.assertIn('id="roster-hg-count"', self.html)
        self.assertIn('id="roster-nat-warning-banner"', self.html)
        self.assertIn('getEffectiveBenchLimit(', self.main_js)
        self.assertIn('getEffectiveBenchLimit(', self.match_js)
        self.assertIn('nationality-rule-warning', self.main_js)
        self.assertIn('nationality-rule-warning', self.match_js)
        self.assertIn('.badge-hg', self.css)
        self.assertIn('.badge-u21', self.css)
        self.assertEqual(self.css.count('{'), self.css.count('}'))


if __name__ == '__main__':
    unittest.main()
