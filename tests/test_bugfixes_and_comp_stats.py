import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TestBugfixesAndCompStats(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            cls.html = f.read()
        with open(os.path.join(ROOT_DIR, 'match-engine.js'), 'r', encoding='utf-8') as f:
            match_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            raw_main = f.read()
        cls.main_js = match_js + '\n' + raw_main
        with open(os.path.join(ROOT_DIR, 'competitions.js'), 'r', encoding='utf-8') as f:
            cls.comp_js = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            cls.style_css = f.read()

    def test_1_shots_on_target_never_exceed_total_shots(self):
        """枠内シュート数が総シュート数を超えない共通関数・サマリー防御クランプが存在すること"""
        self.assertIn('function buildQuickMatchShotStats(', self.main_js)
        self.assertIn('Math.max(homeScore, Math.min(homeShots, rawHOnTarget))', self.main_js)
        self.assertIn('Math.max(homeScore, Math.min(safeHomeShots, rawHomeOnTarget))', self.main_js)
        # 旧バグ式が残っていないこと
        self.assertNotIn('Math.round((simRes.homeShots || 8) * 0.45)', self.main_js)

    def test_2_mom_matches_highest_rated_crowned_player(self):
        """リーグ戦のmatchObjにmomPlayerが保存され、サマリーフォールバックからslice(0, 11)が排除されていること"""
        self.assertIn('const { homeScorers, awayScorers, momPlayer, momClub, momRating } = processMatchScorersAndRatings(', self.main_js)
        self.assertIn('const flaggedMom = allPlayed.find(x => x.p && x.p.isMOM);', self.main_js)
        self.assertNotIn('homeClub.players.slice(0, 11).map(p => ({ p, club: homeClub }))', self.main_js)

    def test_3_tactics_board_defender_blue_color(self):
        """作戦ボードのDFポジション表記が青色（#38bdf8）に設定されていること"""
        self.assertIn('.pitch-node.pos-group-DF .pitch-node-pos {\n  color: #38bdf8;\n}', self.style_css)

    def test_4_reserves_list_opens_player_profile(self):
        """ベンチ外選手リスト(#pitch-reserves-list)にプロフィール表示クリックイベントがバインドされていること"""
        self.assertIn("bindBenchOrReservesProfileClick(document.getElementById('pitch-reserves-list'))", self.main_js)

    def test_5_preseason_toast_emitted_after_match_not_before(self):
        """プレシーズンマッチの結果トーストがopenMatchEventModal起動前ではなく完了コールバック内で呼ばれること"""
        pre_idx = self.main_js.index("currentDay.cupCompType === 'preseasonCup'")
        end_idx = self.main_js.index("// 1. 欧州リーグフェーズ", pre_idx)
        pre_block = self.main_js[pre_idx:end_idx]
        def_idx = pre_block.index('const emitPreseasonPostMatchLogAndToast = () => {')
        modal_idx = pre_block.index('openMatchEventModal(matchData, homeScorers, awayScorers, () => {')
        call_in_cb_idx = pre_block.index('emitPreseasonPostMatchLogAndToast();', modal_idx)
        self.assertLess(def_idx, modal_idx)
        self.assertGreater(call_in_cb_idx, modal_idx)

    def test_6_single_appearance_increment_and_per_competition_stats(self):
        """出場数の二重加算が排除され、大会別個人スタッツのUI・集計・保存が統合されていること"""
        self.assertIn('id="stats-comp-segment-nav"', self.html)
        self.assertIn('id="stats-comp-subnav-row"', self.html)
        for comp in ['league', 'domestic', 'europe', 'preseason']:
            self.assertIn(f'data-stats-comp="{comp}"', self.html)

        self.assertIn('function applyOfficialAppearancesAndTraining(', self.main_js)
        self.assertIn('function recordCompetitionPlayerMatchStats(', self.main_js)
        self.assertIn('function simulateAndRecordQuickMatchPlayerStats(', self.main_js)
        self.assertIn('function resolveStatsCompetitionAndRenderNav(', self.main_js)

        # applyPostMatchPlayerFatigue 内に p.appearances 加算が残っていないこと
        ftg_start = self.main_js.index('function applyPostMatchPlayerFatigue(')
        ftg_end = self.main_js.index('function playCurrentCupMatchday(', ftg_start)
        ftg_body = self.main_js[ftg_start:ftg_end]
        self.assertNotIn('p.appearances', ftg_body)

        # 2部・国内杯・欧州戦のCPU試合でも大会別スタッツが記録されること
        self.assertIn("simulateAndRecordQuickMatchPlayerStats('d2'", self.comp_js)
        self.assertIn("simulateAndRecordQuickMatchPlayerStats(ek,", self.comp_js)
        self.assertIn("simulateAndRecordQuickMatchPlayerStats(compType,", self.comp_js)


if __name__ == '__main__':
    unittest.main()
