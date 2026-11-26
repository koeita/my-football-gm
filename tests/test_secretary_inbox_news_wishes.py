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
        self.assertIn('id="btn-header-kickoff"', self.html)
        self.assertIn('function renderSecretaryBriefing(', self.main_js)
        self.assertIn('function selectSecretary(', self.main_js)
        self.assertIn('function getGmDutyIconSvg(', self.main_js)
        self.assertIn('data-init-sec-id', self.main_js)
        self.assertIn("担当秘書の選任", self.main_js)
        self.assertIn('業務一覧', self.main_js)
        for css_sym in ['.btn-office-primary-cta', '.duty-icon-stack', '.duty-icon-pill', '.gm-task-chevron']:
            self.assertIn(css_sym, self.css)

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
        for css_sel in ['.gm-secretary-modal-card', '.gm-modal-sec-avatar-wrap', '.gm-vn-dialogue-card', '.gm-modal-flat-list', '.gm-modal-flat-row']:
            self.assertIn(css_sel, self.css)
        self.assertIn('function drawSecretaryBustOnContext(', self.avatar_js)
        self.assertIn('function getSecretaryBustHtml(', self.avatar_js)
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

    def test_6_toast_offer_expiry_mega_fee_and_skip_season_fixes(self):
        """トースト重複抑止・合意オファー失効・メガオファー£0防止＆移籍タブ同期・シーズン終了スキップモーダル抑止"""
        # 1. トースト抑止（info/success禁止・モーダル開時の非表示）
        toast_start = self.main_js.index('function showToast(')
        toast_block = self.main_js[toast_start:toast_start + 500]
        self.assertIn("type !== 'error' && type !== 'warn' && type !== 'warning'", toast_block)
        self.assertIn("gm-modal-overlay", toast_block)
        # 2. 合意済み送信オファーの期限管理
        self.assertIn('agreedDaysLeft', self.main_js)
        self.assertIn("offer.status === 'agreed'", self.main_js)
        self.assertIn("offer.status = 'expired'", self.main_js)
        self.assertNotIn('(SIGN)', self.main_js)
        self.assertNotIn('(CANCEL)', self.main_js)
        # 3. メガオファー£0防止と移籍タブ同期
        self.assertIn('function syncPendingMegaOfferToIncomingOffers(', self.main_js)
        self.assertIn('isMegaOfferEvent: true', self.main_js)
        mega_start = self.main_js.index('function triggerMegaOfferEvent(')
        mega_block = self.main_js[mega_start:mega_start + 1800]
        self.assertIn('calculatePlayerMarketValue(target)', mega_block)
        self.assertIn('Math.max(1000,', mega_block)
        # 4. シーズン終了スキップ時の夏・冬市場秘書報告モーダル抑止
        self.assertIn('let isFastForwardingSeason = false;', self.main_js)
        self.assertIn('if (isFastForwardingSeason && !(opts && opts.allowDuringSkip)) return;', self.main_js)
        self.assertIn('allowDuringSkip: true', self.main_js)

    def test_7_post_match_secretary_report_consultations_and_monthly_meeting(self):
        """試合後秘書報告・監督/選手の起用相談要望・月末月次定例会・プレシーズントースト削除が実装されていること"""
        # 1. プレシーズンマッチ終了時のトースト抑止とクローズ時コンテナクリア
        self.assertIn("const toastContainer = document.getElementById('toast-container');", self.match_js)
        pre_start = self.match_js.index("currentDay.cupCompType === 'preseasonCup'")
        pre_end = self.match_js.index("// 1. 欧州リーグフェーズ", pre_start)
        self.assertNotIn('showToast(', self.match_js[pre_start:pre_end])

        # 2. 試合ごとの秘書収支・次戦報告
        for sym in [
            'function handlePlayerMatchCompleted(',
            'function findNextScheduledPlayerMatch(',
            'function ensureMonthlyLedger(',
        ]:
            self.assertIn(sym, self.main_js)

        # 3. 監督・選手からの起用法の相談・要望と受信箱フィルタ・業務一覧連動
        self.assertIn('data-inbox-filter="player"', self.html)
        self.assertIn('.comm-sender-player', self.css)
        for sym in [
            'function checkAndTriggerLineupConsultation(',
            'function buildManagerConsultation(',
            'function buildPlayerConsultation(',
            'function openLineupConsultationModal(',
            'function resolveLineupConsultationDecision(',
            'pendingLineupConsultation',
            "actionKey === 'open-lineup-consultation'",
        ]:
            self.assertIn(sym, self.main_js)

        # 4. 月次定例会（月次報告会）およびセーブ保存互換
        self.assertIn('function sendMonthlyBoardReport(', self.main_js)
        self.assertIn('月次定例報告会', self.main_js)
        for field in ['monthlyLedger:', 'monthlyReports:', 'pendingLineupConsultation:', 'consultationSeq:']:
            self.assertIn(field, self.storage_js)

    def test_8_player_team_news_roster_age_suffix_and_no_offwindow_offer_duty(self):
        """選手・チームニュース拡張（サムネイル/リード/本文展開）・選手一覧年齢「歳」・オフ期オファータスク抑止"""
        # 1. 選手・チームニュース拡張
        self.assertIn('function emitPostMatchTeamAndPlayerNews(', self.main_js)
        self.assertIn('.news-row-layout', self.css)
        self.assertIn('.news-thumb-circle', self.css)
        self.assertIn('data-news-profile', self.main_js)
        # 2. 選手一覧年齢表記に「歳」
        self.assertIn('<td class="col-num" style="white-space:nowrap;">${p.age}歳</td>', self.main_js)
        # 3. シーズン終了・ウィンドウ閉幕時は業務タスクにオファーを出さない
        mega_start = self.main_js.index('function triggerMegaOfferEvent(')
        self.assertIn('if (gameState.isSeasonOver) return;', self.main_js[mega_start:mega_start + 350])
        duties_start = self.main_js.index('function renderGmDuties(')
        duties_block = self.main_js[duties_start:duties_start + 3800]
        self.assertIn('const isMarketWindowOpen = !gameState.isSeasonOver', duties_block)
        self.assertIn('gameState.pendingMegaOffer && isMarketWindowOpen', duties_block)

    def test_9_manager_speaker_preseason_gate_and_executive_reports(self):
        """監督直接相談・プレシーズン入場料収入反映・試合後報告＆月次定例会UI刷新が揃っていること"""
        # 1. 監督専用バストアップと監督スピーカー制御
        for sym in [
            'function drawManagerBustOnContext(',
            'function generateManagerBust(',
            'function getManagerBustHtml(',
            "entry.bustRole === 'manager'",
        ]:
            self.assertIn(sym, self.avatar_js)
        self.assertIn('.gm-vn-pill-badge.is-manager-pill', self.css)

        consult_start = self.main_js.index('function openLineupConsultationModal(')
        consult_block = self.main_js[consult_start:consult_start + 5000]
        self.assertIn("kind: 'manager'", consult_block)
        self.assertIn("roleLabel: '監督'", consult_block)

        gm_modal_start = self.main_js.index('function showGmModal(')
        gm_modal_block = self.main_js[gm_modal_start:gm_modal_start + 4500]
        self.assertIn('isCustomSpeaker', gm_modal_block)
        self.assertIn('resolveModalSpeakerBustHtml', self.main_js)
        self.assertIn("variant === 'match-report' || variant === 'monthly-ceremony'", gm_modal_block)
        self.assertIn("variant === 'monthly-ceremony'", gm_modal_block)

        # 2. プレシーズンマッチ(WCT)の入場・グッズ収入の賞金合算・サマリー/秘書報告一致
        pre_start = self.match_js.index("currentDay.cupCompType === 'preseasonCup'")
        pre_end = self.match_js.index("// 1. 欧州リーグフェーズ", pre_start)
        pre_block = self.match_js[pre_start:pre_end]
        self.assertIn('gateIncome', pre_block)
        self.assertIn('totalPreseasonIncome = prize + gateIncome', pre_block)
        self.assertIn('matchIncome: totalPreseasonIncome', pre_block)
        self.assertIn('awayBroadcastingFee: isHome ? 0 : totalPreseasonIncome', pre_block)

        summary_start = self.match_js.index('function buildMatchSummaryHtml(')
        summary_block = self.match_js[summary_start:summary_start + 6500]
        self.assertIn('md.isPreseason', summary_block)

        # 3. 試合後報告ダッシュボード & 月次定例経営会議セレモニーUI
        self.assertIn("variant: 'match-report'", self.main_js)
        self.assertIn("variant: 'monthly-ceremony'", self.main_js)
        for cls_name in [
            'gm-report-scoreboard',
            'gm-report-kpi-grid',
            'gm-report-next-bar',
            'gm-ceremony-banner',
            'gm-ceremony-grade',
            'gm-report-ledger',
            'gm-ledger-total',
        ]:
            self.assertIn(cls_name, self.main_js)
            self.assertIn(f'.{cls_name}', self.css)
        self.assertIn('.gm-secretary-modal-card.is-report-modal', self.css)
        self.assertIn('.gm-secretary-modal-card.is-monthly-ceremony', self.css)

    def test_10_player_direct_speaker_and_conflict_arbitration(self):
        """選手直接相談演出（選手バスト）と監督・コーチ意見対立の仲裁イベントが実装されていること"""
        # 1. 選手・コーチ専用バストアップ描画とピルCSS
        for sym in [
            'function drawPlayerBustOnContext(',
            'function drawCoachBustOnContext(',
            'function generatePlayerBust(',
            'function generateCoachBust(',
            'function getPlayerBustHtml(',
            'function getCoachBustHtml(',
            "entry.bustRole === 'player'",
            "entry.bustRole === 'coach'",
        ]:
            self.assertIn(sym, self.avatar_js)
        for css_cls in [
            '.gm-vn-pill-badge.is-player-pill',
            '.gm-vn-pill-badge.is-coach-pill',
            '.gm-conflict-stage',
            '.gm-conflict-compare',
            '.gm-conflict-stance.is-mgr',
            '.gm-conflict-stance.is-coach',
            '.gm-secretary-modal-card.is-conflict-modal',
        ]:
            self.assertIn(css_cls, self.css)

        # 2. 選手相談が選手本人話者かつ一人称口調であること
        ply_start = self.main_js.index('function buildPlayerConsultation(')
        ply_block = self.main_js[ply_start:ply_start + 2600]
        self.assertNotIn('選手から「', ply_block)
        self.assertNotIn('）から「', ply_block)

        consult_start = self.main_js.index('function openLineupConsultationModal(')
        consult_block = self.main_js[consult_start:consult_start + 5000]
        self.assertIn("kind: 'player'", consult_block)
        self.assertIn("kind: 'conflict'", consult_block)

        # 3. 監督・コーチ意見対立仲裁イベントと裁定（監督支持/コーチ採用/折衷仲裁/保留・次節終了時自動消滅・メタ表記なし）
        for sym in [
            'function getClubCoachEntries(',
            'function buildConflictArbitrationEvent(',
            "variant: 'conflict-arbitration'",
            "consultation.kind === 'conflict'",
            "decision === 'mediate'",
        ]:
            self.assertIn(sym, self.main_js)
        conf_start = self.main_js.index('function buildConflictArbitrationEvent(')
        conf_block = self.main_js[conf_start:conf_start + 3500]
        self.assertNotIn('}%', conf_block)
        self.assertNotIn('OVR ', conf_block)
        comp_start = self.main_js.index('function handlePlayerMatchCompleted(')
        self.assertIn('gameState.pendingLineupConsultation = null;', self.main_js[comp_start:comp_start + 600])

    def test_11_duties_collapse_no_duplicate_borderless_schedule_and_news_expiry(self):
        """業務折りたたみ重要複製防止・週間/カレンダー二重枠撤廃・ニュース7日削除が実装されていること"""
        # 1. 業務折りたたみ時の .hidden 競合解消と片側DOMクリア
        mini_idx = self.css.index('.gm-tasks-mini-summary {')
        mini_block = self.css[mini_idx:mini_idx + 180]
        self.assertNotIn('display: block !important;', mini_block)
        self.assertIn('.gm-tasks-mini-summary.hidden', self.css)
        duties_idx = self.main_js.index('function renderGmDuties()')
        duties_tail = self.main_js[duties_idx + 4500:duties_idx + 14500]
        self.assertIn("miniSummaryEl.innerHTML = ''", duties_tail)
        self.assertIn("listEl.innerHTML = ''", duties_tail)

        # 2. 週間スケジュール・カレンダー カップ/欧州コンペの内側二重枠・inset影撤廃
        cup_badge_idx = self.css.index('.cal-cup-badge {')
        cup_badge_block = self.css[cup_badge_idx:cup_badge_idx + 1100]
        self.assertIn('border: none;', cup_badge_block)
        self.assertNotIn('border: 1px solid', cup_badge_block)

        # 3. ニュースの7日経過自動削除
        self.assertIn('function pruneExpiredNewsItems(maxAgeDays = 7)', self.main_js)
        self.assertIn('pruneExpiredNewsItems(7)', self.main_js)

    def test_12_multi_slot_preseason_sponsor_selection(self):
        """胸・袖・練習場・スタジアム・複数公式パートナー枠とトレードオフ選定フローが揃っていること"""
        for sym in [
            'SPONSOR_TEMPLATES',
            'SLEEVE_SPONSOR_TEMPLATES',
            'TRAINING_SPONSOR_TEMPLATES',
            'STADIUM_SPONSOR_TEMPLATES',
            'OFFICIAL_PARTNER_TEMPLATES',
            'SPONSOR_SLOT_META',
            'function getSponsorSlotTemplates(',
        ]:
            self.assertIn(sym, self.data_js)
        for sym in [
            'function createSponsorContractFromTemplate(',
            'function getAllClubSponsorContracts(',
            'function getClubTotalBaseSponsorIncome(',
            'function getClubSponsorMatchIncomeMultiplier(',
            '_skipAutoSponsorSlots',
        ]:
            self.assertIn(sym, self.models_js)
        self.assertIn('id="sponsor-selection-modal"', self.html)
        for sym in [
            'function getAvailableSponsorOffers(',
            'strategyProfiles',
            'signingBonus',
            'function openSponsorSelectionModal(',
            'pendingSponsorSlots',
            'btn-open-sponsor-select-panel',
            "actionKey === 'open-sponsor-selection'",
        ]:
            self.assertIn(sym, self.main_js)
        self.assertIn('pendingSponsorSlots:', self.storage_js)

    def test_13_consultation_fit_variety_manager_judgment_and_replies(self):
        for sym in [
            'recentConsultedPlayerIds',
            'lastConflictCoachCategory',
            'function hasUsablePositionFit(',
            'function findBestFitReplacementCandidate(',
            'function buildCoachConsultation(',
            'function showConsultationReplyModal(',
            'gm-report-next-btn',
            "scenario: 'M4'",
            "scenario: 'P3'",
            "scenario: 'CO1'",
            "scenario: 'CO2'",
            "scenario: 'CO3'",
        ]:
            self.assertIn(sym, self.main_js)
        self.assertNotIn("['相談者'", self.main_js)
        self.assertIn('class="gm-vn-sticky-footer"', self.html)
        self.assertIn('.gm-vn-sticky-footer', self.css)
        stage_pos = self.html.index('class="gm-vn-stage-body"')
        footer_pos = self.html.index('class="gm-vn-sticky-footer"')
        actions_pos = self.html.index('id="modal-actions"')
        self.assertLess(stage_pos, footer_pos)
        self.assertLess(footer_pos, actions_pos)

    def test_14_injury_proneness_auto_swap_clean_text_and_hq_button_order(self):
        for sym in [
            'function generatePlayerInjuryProneness(',
            'function ensurePlayerInjuryProneness(',
            'function getInjuryPronenessInfo(',
            'function formatPlayerInjuryDurationText(',
            'injuryProneness: generatePlayerInjuryProneness(growthCurve, pos, traits)',
        ]:
            self.assertIn(sym, self.models_js)
        self.assertIn('ensurePlayerInjuryProneness(', self.storage_js)

        for sym in [
            'function autoReplaceInjuredStarterByManager(',
            'getInjuryPronenessInfo(',
            'formatPlayerInjuryDurationText(',
            '.profile-meta-inline-row',
        ]:
            self.assertIn(sym, self.main_js if not sym.startswith('.') else self.css)

        inj_start = self.main_js.index('function triggerInjuryEvent()')
        inj_block = self.main_js[inj_start:inj_start + 4500]
        self.assertIn('autoReplaceInjuredStarterByManager(', inj_block)
        for forbidden in ['全治1節', '全治${weeks}節', '全治${weeks}試合', 'MEDICAL REPORT']:
            self.assertNotIn(forbidden, inj_block)
        self.assertNotIn('負傷:残${p.injuryWeeks}節', self.main_js)
        self.assertNotIn('残り${starter.injuryWeeks}節', self.main_js)

        intl_start = self.main_js.index('function processInternationalBreakEvent(')
        intl_block = self.main_js[intl_start:intl_start + 2200]
        self.assertIn('autoReplaceInjuredStarterByManager(', intl_block)

        dual_start = self.main_js.index('matchday-action-row matchday-action-dual')
        dual_block = self.main_js[dual_start:dual_start + 450]
        self.assertLess(dual_block.index('id="btn-panel-quick-result"'), dual_block.index('id="btn-panel-kickoff"'))

    def test_15_youth_awakening_replaces_promotion_event(self):
        self.assertNotIn('function triggerYouthPromotionEvent(', self.main_js)
        self.assertNotIn('triggerYouthPromotionEvent(', self.main_js)
        for sym in [
            'function pickYouthAwakeningTrait(',
            'function triggerYouthAwakeningEvent(',
            'hasAwakened',
            'youth-awakened-tag',
        ]:
            self.assertIn(sym, self.main_js)
        self.assertIn('.youth-awakened-tag', self.css)
        post_start = self.main_js.index('function checkPostMatchEvents(')
        post_block = self.main_js[post_start:post_start + 2200]
        self.assertIn('triggerYouthAwakeningEvent()', post_block)

    def test_16_trait_popover_and_comm_top_swipe_sheet(self):
        """特徴の非暗転吹き出しポップオーバーと、メッセージ/ニュースの上部スライドダウン＋上スワイプ収納シートを検証"""
        for sym in [
            'function closeProfileTraitPopover(',
            'function openProfileTraitPopover(',
            'function openCommDetailSheet(',
            'function closeCommDetailSheet(',
            'function openInboxMessageSheet(',
            'function openNewsDetailSheet('
        ]:
            self.assertIn(sym, self.main_js)

        self.assertIn('id="comm-detail-sheet-overlay"', self.html)
        self.assertIn('id="comm-detail-sheet-panel"', self.html)
        self.assertIn('.profile-trait-popover {', self.css)
        self.assertIn('z-index: 35000;', self.css)
        self.assertIn('.trait-popover-arrow {', self.css)
        self.assertIn('.comm-sheet-overlay {', self.css)
        self.assertIn('justify-content: flex-end;', self.css)
        self.assertIn('.comm-sheet-panel {', self.css)
        self.assertIn('transform: translateY(100%);', self.css)
        self.assertIn("sheetPanel.addEventListener('touchstart'", self.main_js)
        self.assertIn("sheetPanel.addEventListener('touchmove'", self.main_js)
        self.assertIn("sheetPanel.addEventListener('touchend'", self.main_js)

    def test_17_news_category_filter_and_deadline_day_hourly_advance(self):
        """ニュースカテゴリ絞り込みと移籍最終日（デッドラインデー）の1時間ごと進行を検証"""
        self.assertIn('id="office-news-controls"', self.html)
        self.assertIn('id="news-filter-bar"', self.html)
        for cat in ['ALL', '移籍', 'リーグ', 'カップ', 'チーム・選手', '監督']:
            self.assertIn(f'data-news-filter="{cat}"', self.html)
        self.assertIn("newsCategoryFilter: 'ALL'", self.main_js)
        self.assertIn("if (newsCatFilter === 'チーム・選手') return n.category === 'チーム' || n.category === '選手';", self.main_js)

        for sym in [
            'function isDeadlineDayHourlyActive(',
            'function renderDeadlineDayBanner(',
            'function triggerDeadlineTickFeedback(',
            'function advanceDeadlineHour(',
            'deadlineDayState:',
            '+1時間進める',
        ]:
            self.assertIn(sym, self.main_js)
        self.assertIn('id="office-deadline-section"', self.html)
        self.assertIn('id="btn-deadline-advance-hour"', self.html)
        self.assertIn('.btn-office-footer-util.is-deadline-hourly {', self.css)
        self.assertIn('.deadline-progress-fill {', self.css)
        self.assertIn('deadlineDayState: gameState.deadlineDayState || null,', self.storage_js)
        self.assertIn("if (gameState.deadlineDayState === undefined) gameState.deadlineDayState = null;", self.storage_js)
        # デッドラインデーの二重確率掛け算バグ修正（force=true呼び出し）
        self.assertIn('triggerIncomingTransferOffer(true)', self.main_js)
        self.assertIn('triggerLoanListingOffers(true)', self.main_js)
        # 監督相談承諾のスタメン入れ替えが監督一任モードでも次戦に反映されること
        self.assertIn('function applyPromisedNextMatchSwaps(', self.models_js)
        self.assertIn('applyPromisedNextMatchSwaps(club);', self.models_js)
        self.assertIn('club.promisedNextMatchSwaps', self.main_js)
        self.assertIn('playerClub.promisedNextMatchSwaps = [];', self.main_js)

    def test_18_sponsor_deadline_and_consultation_player_profile(self):
        """スポンサー契約の受付期限と、相談モーダルからの選手プロフィール起動導線を検証"""
        for sym in [
            'sponsorDeadlineDayIndex:',
            'sponsorWindowClosed:',
            'function resolveSponsorDeadlineDayIndex(',
            'function initSponsorContractWindow(',
            'function getSponsorContractWindowInfo(',
            'function processSponsorWindowExpiryDaily(',
            'function buildConsultationPlayerRowHtml(',
            'data-consult-player-id',
            'openPlayerProfileModal(pid)',
        ]:
            self.assertIn(sym, self.main_js)
        self.assertIn('sponsorDeadlineDayIndex:', self.storage_js)
        self.assertIn('sponsorWindowClosed:', self.storage_js)
        for css_sel in [
            '.sponsor-deadline-text',
            '.sponsor-expired-empty',
            '.gm-modal-flat-row.is-player-link',
            '.gm-consult-player-name-link',
            '.gm-modal-sec-avatar-wrap.is-player-clickable',
        ]:
            self.assertIn(css_sel, self.css)
        self.assertNotIn('経営・財務を確認', self.main_js)

    def test_19_onboarding_secretary_first_and_duty_tasks(self):
        """新規開始時は秘書先行選任→秘書案内→執務室業務タスクから監督・コーチとスポンサーを進める流れを検証"""
        for sym in [
            'pendingInitialStaffSetup:',
            'function blockIfPendingInitialStaffSetup(',
            'function showSecretaryOnboardingBriefing(',
            "action: 'open-initial-staff-setup'",
            "openInitialStaffSetupModal(playerClub, { mode: 'secretary' })",
            "openInitialStaffSetupModal(getPlayerClub(), { mode: 'staff' })",
            'btn-defer-initial-staff',
        ]:
            self.assertIn(sym, self.main_js)
        self.assertIn('pendingInitialStaffSetup:', self.storage_js)
        self.assertIn('id="btn-defer-initial-staff"', self.html)
        self.assertNotIn("スポンサー契約へ進む", self.main_js)

    def test_20_fw_positions_lw_rw_cf_are_red(self):
        """全画面で LW / RW / CF ポジション表示が赤色（var(--danger-red)）に統一されていること"""
        self.assertIn('.pos-LW, .pos-RW, .pos-WG, .pos-CF, .pos-ST { color: var(--danger-red); }', self.css)
        self.assertNotIn('.pos-LW, .pos-RW, .pos-WG, .pos-CF { color: var(--accent-gold); }', self.css)
        pitch_fw_pos = self.css.index('.pitch-node.pos-group-FW .pitch-node-pos')
        pitch_fw_block = self.css[pitch_fw_pos:pitch_fw_pos + 120]
        self.assertIn('color: var(--danger-red);', pitch_fw_block)
        self.assertNotIn('color: var(--accent-gold);', pitch_fw_block)
        for css_sel in [
            '.pos-badge.pos-fw',
            '.rating-pos-tag.pos-CF',
            '.wish-candidate-pos.pos-CF',
            '.awards-best11-pos.pos-CF',
            '.pos-inline.pos-CF',
        ]:
            self.assertIn(css_sel, self.css)
        self.assertIn('function formatColoredPosListHtml(', self.main_js)

    def test_21_stadium_ticket_merch_commercial_system(self):
        """スタジアム選定（グラフィック付）・席ランク別チケット価格・グッズ収支バランスと業務統合を検証"""
        data_js = self.data_js
        avatar_js = self.avatar_js
        match_js = self.match_js

        for st_id in ['heritage_ground', 'compact_fortress', 'modern_bowl', 'sky_arch_dome', 'grand_cathedral']:
            self.assertIn(st_id, data_js)
        for tier_id in ['goal', 'back', 'main', 'vip']:
            self.assertIn(f"id: '{tier_id}'", data_js)
        for merch_id in ['scarf', 'food_drink', 'replica_kit', 'kids_cap', 'collector_box', 'vip_gift']:
            self.assertIn(f"id: '{merch_id}'", data_js)

        self.assertIn('function getStadiumIllustrationSvg(', avatar_js)
        self.assertIn('function getStadiumSeatingMapSvg(', avatar_js)
        self.assertIn('function ensureClubCommercialState(', self.models_js)
        self.assertIn('function getClubStadiumInfo(', self.models_js)
        self.assertIn('function calculateProjectedMatchdayCommercial(', self.models_js)
        self.assertIn('function convertSupportersToGlobalFans(', self.models_js)
        self.assertIn('function getClubGlobalFans(', self.models_js)
        self.assertIn('function formatGlobalFans(', self.models_js)
        self.assertIn('ファン総数', self.html)

        self.assertGreaterEqual(match_js.count('calculateProjectedMatchdayCommercial('), 3)
        self.assertIn('commercialBreakdown:', match_js)

        self.assertIn('id="facilities-subtab-btn-commercial"', self.html)
        self.assertIn('id="facilities-subview-commercial"', self.html)
        self.assertIn('id="commercial-management-root"', self.html)

        for sym in [
            'pendingCommercialSetup:',
            "action: 'open-commercial-setup'",
            'function isCommercialPlanLocked(',
            'function buildCommercialStadiumHeroInnerHtml(',
            'function updateCommercialStadiumPreviewDom(',
            'function renderCommercialManagementPanel(',
            'function selectOrBuildCommercialStadium(',
            'function adjustTicketTierPrice(',
            'function toggleMerchandiseItem(',
            'function confirmCommercialSetupTask(',
            'data-commercial-stadium-hero',
        ]:
            self.assertIn(sym, self.main_js)

        self.assertIn('touch-action: manipulation;', self.css)

        self.assertIn('スタジアム周辺・商業設備', self.data_js)
        self.assertIn('buildCostK: 130000', self.data_js)
        self.assertIn('maintenancePerMatchK: 1950', self.data_js)
        self.assertIn('overrideStadiumId', self.models_js)
        self.assertIn('draftStadiumId', self.models_js)
        self.assertIn('setBodyModalLock(true);', self.main_js[self.main_js.index('function showInfoPopup('):self.main_js.index('function showInfoPopup(') + 750])
        self.assertIn('setBodyModalLock(false);', self.main_js[self.main_js.index('function closeInfoPopup('):self.main_js.index('function closeInfoPopup(') + 450])
        self.assertIn('pendingCommercialSetup:', self.storage_js)
        self.assertIn('commercialSubtab:', self.storage_js)
        self.assertIn('.commercial-stadium-svg', self.css)
        self.assertIn('.commercial-seatmap-svg', self.css)
        self.assertIn('.commercial-locked-bar', self.css)
        self.assertIn('.commercial-hero-nav', self.css)

    def test_22_ui_text_unification_and_flat_compliance(self):
        """表記統一・メタ表現/実在リーグ名称の排除・フラットCSS適用を検証"""
        forbidden_html = [
            'PREMIER DIVISION',
            '優勝・CL',
            'STYLE 01',
            'ATTACK DIRECTION',
            'CLUB BRIEFING',
            'DEADLINE DAY',
            'MATCHWEEK 0 / 38',
            'セーブデータなし',
        ]
        for term in forbidden_html:
            self.assertNotIn(term, self.html)

        forbidden_main = [
            '[監督空席]',
            '所属選手・戦術・契約',
            '選手市場 (MARKET)',
            '（ゲームオーバー）',
            'SPONSORSHIP / スポンサー契約',
            'BOARD / 理事会信頼度',
            'READY FOR KICKOFF',
        ]
        for term in forbidden_main:
            self.assertNotIn(term, self.main_js)

        self.assertNotIn('>POSSESSION<', self.html)
        self.assertNotIn('プレミア放映権分配金', self.match_js)
        self.assertNotIn('優勝・CL', self.data_js)
        self.assertNotIn('[アカデミー昇格]', self.models_js)
        self.assertNotIn('セーブデータなし', self.storage_js)
        self.assertIn('.tactic-tag,', self.css)
        self.assertIn('.chem-pill {', self.css)
        self.assertIn('.ui-stat-plate {', self.css)
        self.assertIn('.facility-metric-item {', self.css)
        self.assertIn('.facility-lv-badge,', self.css)
        self.assertIn('#market-subnav-bar .roster-subtab-btn', self.css)

    def test_23_roster_total_count_and_mobile_header_metrics(self):
        """選手一覧の合計人数表示およびモバイルヘッダーのファン総数等マルチ情報表示を検証"""
        self.assertIn('id="roster-total-count"', self.html)
        self.assertIn('class="status-metrics-row status-metrics-row-primary"', self.html)
        self.assertIn('class="status-metrics-row status-metrics-row-secondary"', self.html)
        self.assertIn('data-mobile-label="ファン"', self.html)
        self.assertIn('data-mobile-label="週給"', self.html)
        self.assertIn('data-mobile-label="登録"', self.html)

        render_roster_body = self.main_js[self.main_js.index('function renderRoster('):self.main_js.index('function renderRoster(') + 4800]
        self.assertIn("getElementById('roster-total-count')", render_roster_body)
        self.assertIn('合計 ${activeRosterCount}/${maxSquad}名', render_roster_body)

        self.assertNotIn('.metric-box:nth-child(7)  /* SUPPORTERS */', self.css)
        self.assertIn('.metric-box.metric-fans .metric-value', self.css)
        self.assertIn('.roster-total-count', self.css)


if __name__ == '__main__':
    unittest.main()
