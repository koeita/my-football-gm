#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT_DIR, rel_path), 'r', encoding='utf-8') as f:
        return f.read()


class TestSecretaryInboxNewsAndWishes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data_js = read_text('data.js')
        cls.avatar_js = read_text('avatar.js')
        cls.models_js = read_text('models.js')
        cls.match_js = read_text('match-engine.js')
        cls.storage_js = read_text('storage.js')
        cls.main_js = read_text('main.js')
        cls.html = read_text('index.html')
        cls.css = read_text('style.css')

    def test_1_secretary_database_and_pixel_avatar(self):
        """秘書3名定義と専用ドット絵アバター描画・UI配置が揃っていること"""
        self.assertIn('const SECRETARIES_DATABASE = [', self.data_js)
        for sec_id in ['sec_claire', 'sec_elena', 'sec_arthur']:
            self.assertIn(f"id: '{sec_id}'", self.data_js)
        self.assertIn("if (player && player.isSecretary) return 'secretary';", self.avatar_js)
        self.assertIn("roleType === 'secretary'", self.avatar_js)
        self.assertIn('function generateSecretaryAvatar(', self.avatar_js)
        self.assertIn('function getSecretaryAvatarHtml(', self.avatar_js)
        self.assertIn('function getActiveSecretary(', self.models_js)
        self.assertIn('function getSecretaryBriefingText(', self.models_js)
        self.assertIn('id="secretary-briefing-bar"', self.html)
        self.assertIn('id="secretary-select-modal"', self.html)
        self.assertIn('function renderSecretaryBriefing(', self.main_js)
        self.assertIn('function selectSecretary(', self.main_js)
        self.assertIn('data-init-sec-id', self.main_js)

    def test_2_manager_reinforcement_wishes_and_trust_reward(self):
        """監督からの補強希望算出、推薦選手提示、獲得時の信頼度(+10/+6)連動が実装されていること"""
        self.assertIn('function evaluateManagerReinforcementWishes(', self.models_js)
        self.assertIn('function generateAndSendManagerWishReport(', self.main_js)
        self.assertIn('function checkAndRewardManagerWishOnSigning(', self.main_js)
        self.assertIn('checkAndRewardManagerWishOnSigning(target, dealType)', self.main_js)
        self.assertIn('const trustBonus = isRecommended ? 10 : 6;', self.main_js)
        self.assertIn('data-msg-negotiate', self.main_js)
        self.assertIn('data-msg-shortlist', self.main_js)
        self.assertIn('data-msg-profile', self.main_js)

    def test_3_inbox_messages_and_news_feed_system(self):
        """メッセージ受信箱・ニュースタブUIおよびスカウト/理事会/試合/移籍ニュース連動が実装されていること"""
        for dom_id in [
            'office-comm-panel',
            'office-comm-tab-messages',
            'office-comm-tab-news',
            'office-unread-badge',
            'office-news-badge',
            'inbox-filter-bar',
            'btn-mark-all-read',
            'office-inbox-list',
            'office-news-list',
        ]:
            self.assertIn(f'id="{dom_id}"', self.html)
        for fn in [
            'function addInboxMessage(',
            'function markAllInboxMessagesRead(',
            'function addNewsItem(',
            'function sendMonthlyBoardReport(',
            'function generateMatchweekNews(',
            'function generateCupMatchNews(',
            'function simulateCpuTransferNewsDaily(',
            'function renderOfficeCommPanel(',
        ]:
            self.assertIn(fn, self.main_js)
        self.assertIn('addInboxMessage(', self.models_js)
        self.assertIn('generateMatchweekNews(', self.match_js)
        self.assertIn('generateCupMatchNews(', self.match_js)

    def test_4_save_load_persistence_and_css_compliance(self):
        """セーブ・ロード互換性とデザイン規約（絵文字・多重枠禁止・ピクセル鮮明化）が保たれていること"""
        for field in ['secretaryId:', 'inboxMessages:', 'newsFeed:', 'managerWishes:', 'officeCommTab:']:
            self.assertIn(field, self.storage_js)
        for css_sel in ['.secretary-briefing-bar', '.office-comm-panel', '.inbox-row', '.news-row', '.wish-candidate-row']:
            self.assertIn(css_sel, self.css)
        self.assertEqual(self.data_js.count('{'), self.data_js.count('}'))
        self.assertEqual(self.avatar_js.count('{'), self.avatar_js.count('}'))
        self.assertEqual(self.models_js.count('{'), self.models_js.count('}'))
        self.assertEqual(self.match_js.count('{'), self.match_js.count('}'))
        self.assertEqual(self.storage_js.count('{'), self.storage_js.count('}'))
        self.assertEqual(self.main_js.count('{'), self.main_js.count('}'))
        self.assertEqual(self.css.count('{'), self.css.count('}'))
        # 絵文字禁止チェック
        for txt in [self.html, self.data_js, self.models_js, self.main_js]:
            self.assertIsNone(re.search(r'[⚽💰✨🎮📋📰💬🏆]', txt))

    def test_5_secretary_modal_on_start_and_events(self):
        """秘書モーダル（開始時・各イベント連動・キュー制御・閉じるボタン）が実装されていること"""
        for dom_id in ['gm-modal-secretary-box', 'btn-close-gm-modal']:
            self.assertIn(f'id="{dom_id}"', self.html)
        self.assertIn('class="modal-card gm-secretary-modal-card"', self.html)
        for css_sel in ['.gm-secretary-modal-card', '.gm-modal-sec-avatar-wrap', '.gm-modal-flat-list', '.gm-modal-flat-row']:
            self.assertIn(css_sel, self.css)
        for js_sym in [
            'const gmModalQueue = [];',
            'function flushNextGmModalOrUnlock(',
            'function closeGmModal(',
            'function showSecretaryModal(',
            'function buildWishModalDetailHtml(',
            'function showSecretaryClubOpeningBriefing(',
        ]:
            self.assertIn(js_sym, self.main_js)
        self.assertIn('showSecretaryClubOpeningBriefing(playerClub, selectedMgr, true, initWish)', self.main_js)
        self.assertIn('showSecretaryClubOpeningBriefing(playerClub, playerClub.manager, false, seasonWish)', self.main_js)
        self.assertGreaterEqual(self.main_js.count('showSecretaryModal('), 6)
        self.assertGreaterEqual(self.models_js.count('showSecretaryModal('), 2)


if __name__ == '__main__':
    unittest.main()
