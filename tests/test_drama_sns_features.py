import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read_text(filename: str) -> str:
    return (ROOT / filename).read_text(encoding='utf-8')


class TestPhase1DramaAndSnsFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = read_text('index.html')
        cls.data_js = read_text('data.js')
        cls.models_js = read_text('models.js')
        cls.cinematic_js = read_text('cinematic.js')
        cls.dialogue_js = read_text('secretary-dialogue.js')
        cls.match_js = read_text('match-engine.js')
        cls.storage_js = read_text('storage.js')
        cls.main_js = read_text('main.js')
        cls.css = read_text('style.css')

    def test_1_derby_and_sns_data_definitions(self):
        """ダービーマッチ定義とSNSアカウント辞書が存在し規約違反がないこと"""
        for sym in ['DERBY_MATCHUPS', 'LONDON_DERBY_CLUB_IDS', 'SNS_ACCOUNT_POOLS']:
            self.assertIn(sym, self.data_js)
        for label in ['マンチェスター・ダービー', 'ノースロンドン・ダービー', 'マージーサイド・ダービー', 'ロンドン・ダービー']:
            self.assertIn(label, self.data_js)

        emoji_pattern = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        self.assertIsNone(emoji_pattern.search(self.data_js[self.data_js.index('DERBY_MATCHUPS'):]))

    def test_2_big_match_kickoff_cinematic_and_eve_dialogue(self):
        """ビッグマッチ演出・前夜秘書セリフ・特別試合判定が実装されていること"""
        self.assertIn("type === 'big_match_kickoff'", self.cinematic_js)
        self.assertIn('cinematic-matchup-stage', self.cinematic_js)
        self.assertIn("case 'special_match_eve':", self.dialogue_js)
        self.assertIn('specialTurnoutBonus', self.models_js)

        for sym in [
            'function evaluateSpecialFixtureContext(',
            'function maybeTriggerSpecialMatchEveBriefing(',
            'function computeHeadToHeadText(',
            'function getClubTopPlayer(',
        ]:
            self.assertIn(sym, self.main_js)

        self.assertIn("type: 'big_match_kickoff'", self.match_js)
        self.assertIn('matchday-special-banner', self.main_js)

    def test_3_gm_mobile_comm_panel_dom_and_3_tabs(self):
        """本部通信パネルがスマホ風3タブ（メッセージ・ニュース・SNS）構成であること"""
        for elem_id in [
            'office-comm-panel',
            'comm-phone-statusbar',
            'comm-phone-carrier',
            'comm-phone-date',
            'office-comm-tab-messages',
            'office-comm-tab-news',
            'office-comm-tab-sns',
            'office-sns-badge',
            'office-sns-controls',
            'sns-filter-bar',
            'office-sns-trends',
            'office-sns-list',
        ]:
            self.assertIn(f'id="{elem_id}"', self.html)

        for func in [
            'function addSnsPost(',
            'function toggleSnsPostLike(',
            'function generateEventSnsReactions(',
        ]:
            self.assertIn(func, self.main_js)

        for ev in ['career_start', 'match_result', 'player_signing', 'youth_promotion', 'player_departure', 'commercial_confirmed', 'manager_appointed']:
            self.assertIn(ev, self.main_js + '\n' + self.match_js)

    def test_4_sns_persistence_and_clean_styles(self):
        """storage.jsでSNSフィードが保存・復元され、CSSが規則準拠であること"""
        self.assertIn('snsFeed:', self.storage_js)
        self.assertIn('snsUnreadCount:', self.storage_js)
        self.assertIn('Array.isArray(gameState.snsFeed)', self.storage_js)

        for cls in [
            '.comm-phone-statusbar',
            '.office-sns-list',
            '.sns-post-row',
            '.sns-like-btn',
            '.matchday-special-banner',
            '.cinematic-matchup-stage',
        ]:
            self.assertIn(cls, self.css)

        emoji_pattern = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')
        sns_section = self.main_js[self.main_js.index('function addSnsPost('):]
        self.assertIsNone(emoji_pattern.search(sns_section))

    def test_5_phase2_milestones_retirement_ceremony_and_retired_numbers(self):
        """Phase 2: 節目演出・レジェンド引退セレモニー・永久欠番の除外と表示を検証"""
        for cin_type in ["type === 'player_milestone'", "type === 'legend_retirement'"]:
            self.assertIn(cin_type, self.cinematic_js)

        self.assertIn('retiredNumbers', self.models_js)
        self.assertIn('retiredNumbers', self.storage_js)
        self.assertIn('activeDramaPromises', self.storage_js)

        for sym in [
            'function isClubRetirementLegend(',
            'function buildRetiredLegendsList(',
            'function retireClubSquadNumber(',
            'function triggerLegendRetirementCeremony(',
        ]:
            self.assertIn(sym, self.main_js)

        self.assertIn('hof-retired-list', self.main_js)
        self.assertIn('.hof-retired-list', self.css)
        self.assertIn('cinematic-milestone-tag', self.css)
        self.assertIn('cinematic-retired-num', self.css)

    def test_6_phase2_drama_consultations_and_promise_tracking(self):
        """Phase 2: ドラマ系1on1面談(D1-D4)と約束履行フォローおよび既存相談保持を検証"""
        for sym in [
            'function buildManagerConsultation(',
            'function buildCoachConsultation(',
            'function buildPlayerConsultation(',
            'function buildConflictArbitrationEvent(',
            'function getPlayerRecentLossStreak(',
            'function buildDramaConsultationEvent(',
            'function resolveDramaConsultationDecision(',
            'function evaluateDramaPromisesAfterMatch(',
        ]:
            self.assertIn(sym, self.main_js)

        for scen in ['D1_SLUMP_MEETING', 'D2_CAPTAIN_LOCKER', 'D3_STAR_TRANSFER_TALK', 'D4_YOUTH_AMBITION']:
            self.assertIn(scen, self.main_js)


if __name__ == '__main__':
    unittest.main()
