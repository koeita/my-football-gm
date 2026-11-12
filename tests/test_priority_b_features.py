# -*- coding: utf-8 -*-
import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TestPriorityBDelegationPerfUnslop(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'data.js'), 'r', encoding='utf-8') as f:
            self.data_js = f.read()
        with open(os.path.join(ROOT_DIR, 'models.js'), 'r', encoding='utf-8') as f:
            self.models_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.raw_main_js = f.read()
        self.main_js = self.models_js + '\n' + self.raw_main_js
        self.all_js = self.data_js + '\n' + self.main_js
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_8_manager_delegation_and_trust_tradeoff(self):
        """項目8: 監督への采配一任（戦術同期＋疲労ローテ）とGM現場介入・信頼度トレードオフが実装されていること"""
        self.assertIn('id="btn-toggle-manager-delegation"', self.html)
        self.assertIn('id="btn-precheck-toggle-delegation"', self.main_js)
        self.assertIn('function toggleManagerDelegation(', self.main_js)
        self.assertIn('function applyManagerPreMatchDelegation(', self.main_js)
        self.assertIn('function notifyGmManualIntervention(', self.main_js)
        self.assertIn('function checkAndShowManagerTrustCrisis()', self.main_js)
        self.assertIn('managerDelegationEnabled: Boolean(gameState.managerDelegationEnabled)', self.main_js)
        # 蓄積疲労を考慮したローテーション減点が calculateSlotPlayerScore に組み込まれていること
        self.assertIn('if (ftg >= 80)', self.main_js)
        self.assertIn('score -= 28;', self.main_js)

    def test_9_dirty_flag_active_tab_rendering_and_debounced_autosave(self):
        """項目9: アクティブタブ限定レンダリング（Dirty Flag）とデバウンス遅延オートセーブ・履歴圧縮が実装されていること"""
        self.assertIn('const dirtyViews = {', self.main_js)
        self.assertIn('function markAllViewsDirty()', self.main_js)
        self.assertIn('function renderActiveTabView(', self.main_js)
        self.assertIn('function scheduleAutoSave(', self.main_js)
        self.assertIn('function flushPendingAutoSave()', self.main_js)
        self.assertIn("window.addEventListener('pagehide', flushPendingAutoSave);", self.main_js)
        # CPUクラブ選手の古い seasonHistory が直近3シーズン分にトリミングされていること
        self.assertIn('p.seasonHistory = p.seasonHistory.slice(-3);', self.main_js)
        self.assertIn('const slimScorerEntry =', self.main_js)

    def test_10_ui_meta_labels_replaced_with_worldbuilding_text(self):
        """項目10: UIメタ表記（組織力ボーナス: 実効OVR / スタミナ消費1.3倍 / 96%発揮）が世界観テキストに置換されていること"""
        self.assertNotIn('[組織力ボーナス: 実効OVR', self.all_js)
        self.assertNotIn('スタミナ消費1.3倍', self.html)
        self.assertNotIn('スタミナ消費が1.3倍', self.all_js)
        self.assertNotIn('薄適性（96%発揮）', self.all_js)
        self.assertNotIn('薄適性（92%発揮）', self.all_js)
        # 新しい世界観表現とサブ適性係数 0.92 の整合確認
        self.assertIn('戦術浸透度: 高', self.main_js)
        self.assertIn('終盤の消耗が激しい', self.html)
        self.assertIn('終盤の消耗が激し', self.data_js)
        self.assertIn("return { type: 'sub', factor: 0.92, label: 'サブ適性' };", self.main_js)
        self.assertEqual(self.css.count('{'), self.css.count('}'))


if __name__ == '__main__':
    unittest.main()
