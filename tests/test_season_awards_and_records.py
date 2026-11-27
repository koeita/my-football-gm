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
        with open(os.path.join(self.root, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.competitions_js = f.read()
        with open(os.path.join(self.root, 'match-engine.js'), 'r', encoding='utf-8') as f:
            self.match_engine_js = f.read()

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
        self.assertIn('hof-record-row ${recCanOpen', records_block)
        self.assertIn('hof-rank-row ${canOpen', records_block)
        self.assertIn('monthly-award-row ${m.isPlayerClub', records_block)
        self.assertGreaterEqual(records_block.count('data-award-profile-id'), 4)
        self.assertIn('topGk.p.cleanSheets || 0', records_block)
        self.assertIn('記録待ち', records_block)

        find_start = self.main_js.index('function findPlayerWithContextById(')
        find_end = self.main_js.index('function getAttributeRankInfo(', find_start)
        find_block = self.main_js[find_start:find_end]
        self.assertIn('gameState.clubHallOfFame', find_block)
        self.assertIn('isArchiveProfile: true', find_block)

        for field in ['seasonAwardsHistory:', 'monthlyAwardsHistory:', 'monthlyPlayerBaseline:', 'clubHallOfFame:']:
            self.assertIn(field, self.storage_js)
        self.assertIn('function extractHallOfFameSnapshot(', self.storage_js)

        # 絵文字禁止と波括弧一致
        for txt in [self.html, self.main_js, self.storage_js]:
            self.assertIsNone(re.search(r'[⚽💰✨🎮📋📰💬🏆🥇🥈🥉]', txt))
        self.assertEqual(self.main_js.count('{'), self.main_js.count('}'))
        self.assertEqual(self.storage_js.count('{'), self.storage_js.count('}'))
        self.assertEqual(self.css.count('{'), self.css.count('}'))

    def test_5_audit_bugfixes_regression(self):
        """E2E・コード監査修正項目の回帰検証"""
        # 1. D2監督クローン防止
        eps_match = re.search(r'function ensurePlayableClubStructure\([\s\S]*?\n\}', self.competitions_js)
        self.assertIsNotNone(eps_match)
        self.assertNotIn('MANAGERS_DATABASE[0]', eps_match.group(0))
        self.assertIn('preferredRanks', eps_match.group(0))

        # 2. アシスト選出関数の統一
        self.assertIn('function selectWeightedMatchAssister(', self.match_engine_js)
        quick_match = re.search(r'function generateScorersForQuickMatch\([\s\S]*?\n\}', self.match_engine_js)
        league_match = re.search(r'function processMatchScorersAndRatings\([\s\S]*?\n\}', self.match_engine_js)
        self.assertIsNotNone(quick_match)
        self.assertIsNotNone(league_match)
        self.assertIn('selectWeightedMatchAssister(', quick_match.group(0))
        self.assertIn('selectWeightedMatchAssister(', league_match.group(0))

        # 3. 殿堂ベースライン初期化と加入箇所連携
        self.assertIn('function initPlayerClubHofBaseline(', self.main_js)
        self.assertGreaterEqual(self.main_js.count('initPlayerClubHofBaseline('), 4)

        # 4. 解任再就職モーダルの自クラブ除外・旧データリセット
        crisis_match = re.search(r'function openBoardCrisisModal\([\s\S]*?\n\}', self.main_js)
        restart_match = re.search(r'function handleBoardRelegationRestart\([\s\S]*?\n\}', self.main_js)
        self.assertIsNotNone(crisis_match)
        self.assertIsNotNone(restart_match)
        self.assertIn('.filter(c => c && !c.isPlayer)', crisis_match.group(0))
        self.assertIn('gameState.clubHallOfFame =', restart_match.group(0))
        self.assertIn('gameState.installments = []', restart_match.group(0))

        # 5. 交渉モーダルのフリー選手年数上限整合
        neg_match = re.search(r'function openTransferNegotiationModal\([\s\S]*?\n\}', self.main_js)
        self.assertIsNotNone(neg_match)
        self.assertIn('const maxAllowedYears = isFreeAgent ? 3 : 4;', neg_match.group(0))

        # 6. CSS :root の変数補完
        root_match = re.search(r':root\s*\{[^}]+\}', self.css)
        self.assertIsNotNone(root_match)
        self.assertIn('--bg-card:', root_match.group(0))
        self.assertIn('--radius-md:', root_match.group(0))
        self.assertIn('--radius-sm:', root_match.group(0))

    def test_6_cup_highlight_offseason_tab_and_best_gk_consistency(self):
        """カップ戦自チームハイライト・新シーズン本部タブ遷移・最優秀GKとベスト11GKの一致を検証"""
        # 1. カップ戦ブラケット・欧州順位表・欧州日程の自チームハイライト
        bracket_fn = re.search(r'function renderCupBracketHtml\([\s\S]*?\n\}', self.competitions_js)
        self.assertIsNotNone(bracket_fn)
        self.assertIn('is-player-match', bracket_fn.group(0))
        self.assertIn('is-player-team', bracket_fn.group(0))

        euro_standings_fn = re.search(r'function renderEuroLeaguePhaseStandingsHtml\([\s\S]*?\n\}', self.competitions_js)
        self.assertIsNotNone(euro_standings_fn)
        self.assertIn('row-player-club', euro_standings_fn.group(0))
        self.assertIn('c.isPlayer', euro_standings_fn.group(0))

        euro_sched_fn = re.search(r'function renderEuroScheduleListHtml\([\s\S]*?\n\}', self.competitions_js)
        self.assertIsNotNone(euro_sched_fn)
        self.assertIn('is-player-match', euro_sched_fn.group(0))
        self.assertIn('is-player-team', euro_sched_fn.group(0))

        for css_sel in [
            '.bracket-match-card.is-player-match',
            '.bracket-team-row.is-player-team',
            '.euro-tile-team.is-player-team',
        ]:
            self.assertIn(css_sel, self.css)

        # 2. シーズン終了・新シーズン移行時に移籍タブではなく本部タブへ遷移すること
        proc_start = self.main_js.index('function processSeasonEnd(')
        proc_end = self.main_js.index('function calculatePlayerDemandSalary(', proc_start)
        proc_block = self.main_js[proc_start:proc_end]
        self.assertIn("switchTab('office')", proc_block)
        self.assertNotIn("switchTab('market')", proc_block)

        next_start = self.main_js.index('function startNextSeason(')
        next_end = self.main_js.index('function switchTab(', next_start)
        next_block = self.main_js[next_start:next_end]
        self.assertIn("switchTab('office')", next_block)
        self.assertNotIn("switchTab('market')", next_block)

        # 3. 最優秀GKと年間ベストイレブンGKの選出基準一致
        awards_eval_start = self.main_js.index('function evaluateAndRecordSeasonAwards(')
        awards_eval_end = self.main_js.index('function buildBestElevenPitchHtml(', awards_eval_start)
        awards_eval_block = self.main_js[awards_eval_start:awards_eval_end]
        self.assertIn('gkPoolMin10', awards_eval_block)
        self.assertIn('b.mvpScore - a.mvpScore', awards_eval_block)
        self.assertIn("slot.slotPos === 'GK' && bestGkItem", awards_eval_block)


if __name__ == '__main__':
    unittest.main()
