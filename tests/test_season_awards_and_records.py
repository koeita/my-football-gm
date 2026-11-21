import os
import re
import unittest


class TestSeasonAwardsAndRecords(unittest.TestCase):
    def setUp(self):
        self.root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(self.root, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()
        with open(os.path.join(self.root, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open(os.path.join(self.root, 'storage.js'), 'r', encoding='utf-8') as f:
            self.storage_js = f.read()
        with open(os.path.join(self.root, 'style.css'), 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_1_season_awards_best11_and_settlement_modal(self):
        """年間アワード・ベスト11選出とprocessSeasonEnd順序、決算モーダルタブを検証"""
        for sym in [
            'function evaluateAndRecordSeasonAwards(',
            'function buildBestElevenPitchHtml(',
            'function buildSeasonAwardsHtml(',
            'seasonAwardsHistory:',
        ]:
            self.assertIn(sym, self.main_js)

        proc_start = self.main_js.index('function processSeasonEnd(')
        proc_end = self.main_js.index('function calculatePlayerDemandSalary(', proc_start)
        proc_block = self.main_js[proc_start:proc_end]
        self.assertIn('evaluateAndRecordSeasonAwards(', proc_block)
        # 加齢・引退・放出ループの前にアワード選出が走ること
        self.assertLess(
            proc_block.index('evaluateAndRecordSeasonAwards('),
            proc_block.index('const expiredDepartures = new Set();')
        )
        self.assertIn('syncPlayerClubStatsToHallOfFame(club, { retiredIds: retiredPlayerClubIds })', proc_block)

        self.assertIn('id="settlement-tab-bar"', self.html)
        self.assertIn('id="summary-awards-pane"', self.html)
        self.assertIn('id="summary-finance-pane"', self.html)
        self.assertIn('.awards-best11-pitch', self.css)
        self.assertIn('.settlement-tab-bar', self.css)

    def test_2_monthly_mvp_milestones_and_late_title_race(self):
        """月間MVP・別モーダル表彰・試合後マイルストーン/連続ゴール・終盤タイトル争い速報を検証"""
        for sym in [
            'function captureMonthlyPlayerBaseline(',
            'function evaluateMonthlyMvpAward(',
            'function showMonthlyMvpAwardModal(',
            'function checkPlayerMatchMilestonesAndStreaks(',
            'function checkLateSeasonTitleRaceNews(',
            'monthlyAwardsHistory:',
            'monthlyPlayerBaseline:',
        ]:
            self.assertIn(sym, self.main_js)

        monthly_start = self.main_js.index('function sendMonthlyBoardReport(')
        monthly_end = self.main_js.index('function generateMatchweekNews(', monthly_start)
        monthly_block = self.main_js[monthly_start:monthly_end]
        self.assertIn('evaluateMonthlyMvpAward(reportYear, reportMonth, dayObj)', monthly_block)
        self.assertIn('showMonthlyMvpAwardModal(monthlyMvp)', monthly_block)

        # handlePlayerMatchCompleted 先頭600文字制約を壊さず後方からフックしていること
        comp_start = self.main_js.index('function handlePlayerMatchCompleted(')
        self.assertIn('gameState.pendingLineupConsultation = null;', self.main_js[comp_start:comp_start + 600])
        comp_block = self.main_js[comp_start:comp_start + 12000]
        self.assertIn('checkPlayerMatchMilestonesAndStreaks(playerClub, matchData)', comp_block)
        self.assertIn('checkLateSeasonTitleRaceNews()', comp_block)

    def test_3_yearly_profile_awards_and_career_milestones(self):
        """選手プロフィールの年別MOM列・上部年度別受賞歴ショーケース・経歴マイルストーン統合を検証"""
        self.assertIn('profile-awards-showcase', self.main_js)
        self.assertIn('function buildAwardHonorIconSvg(', self.main_js)
        self.assertNotIn('yearly-award-inline', self.main_js)
        self.assertIn('<th class="col-num">MOM</th>', self.main_js)
        self.assertIn('totalMomSum', self.main_js)

        career_match = re.search(
            r'function ensurePlayerHistoryAndCareer\([\s\S]*?\n\}',
            self.main_js
        )
        self.assertIsNotNone(career_match)
        self.assertIn('Array.isArray(p.milestones)', career_match.group(0))

    def test_4_team_records_subtab_storage_and_rules_compliance(self):
        """チームタブ「記録・表彰」サブタブ・顔アバター表示・セーブ互換・絵文字禁止・波括弧バランスを検証"""
        self.assertIn('data-team-subtab="records"', self.html)
        self.assertIn('id="team-subview-records"', self.html)
        self.assertIn('id="club-records-panel"', self.html)
        self.assertIn('function renderClubRecordsView(', self.main_js)
        self.assertIn('function renderAwardPlayerAvatarHtml(', self.main_js)
        self.assertIn("subtabKey === 'records'", self.main_js)

        awards_start = self.main_js.index('function buildSeasonAwardsHtml(')
        awards_end = self.main_js.index('function bindAwardProfileClicks(', awards_start)
        awards_block = self.main_js[awards_start:awards_end]
        self.assertIn('renderAwardPlayerAvatarHtml(', awards_block)
        self.assertIn('getManagerAvatarHtml(', awards_block)

        records_start = self.main_js.index('function renderClubRecordsView(')
        records_block = self.main_js[records_start:]
        self.assertGreaterEqual(records_block.count('renderAwardPlayerAvatarHtml('), 4)

        for field in ['seasonAwardsHistory:', 'monthlyAwardsHistory:', 'monthlyPlayerBaseline:', 'clubHallOfFame:']:
            self.assertIn(field, self.storage_js)
        self.assertIn('function extractHallOfFameSnapshot(', self.storage_js)

        # 絵文字禁止と波括弧一致
        for txt in [self.html, self.main_js, self.storage_js]:
            self.assertIsNone(re.search(r'[⚽💰✨🎮📋📰💬🏆🥇🥈🥉]', txt))
        self.assertEqual(self.main_js.count('{'), self.main_js.count('}'))
        self.assertEqual(self.storage_js.count('{'), self.storage_js.count('}'))
        self.assertEqual(self.css.count('{'), self.css.count('}'))


if __name__ == '__main__':
    unittest.main()
