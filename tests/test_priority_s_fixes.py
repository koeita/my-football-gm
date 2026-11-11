# -*- coding: utf-8 -*-
import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class TestPrioritySCriticalBugFixes(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open(os.path.join(ROOT_DIR, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(ROOT_DIR, 'avatar.js'), 'r', encoding='utf-8') as f:
            self.avatar_js = f.read()

    def test_1_playable_second_division_and_player_club_lookup(self):
        """Bug 1: 2部（ENG-D2）降格時も自クラブを正しく参照でき、46節プレイアブル＆1年復帰判定が機能すること"""
        self.assertIn('function isPlayerInSecondDivision()', self.main_js)
        self.assertIn('function getActivePlayerLeagueClubs()', self.main_js)
        self.assertIn('function getAllManagedLeagueClubs()', self.main_js)
        self.assertIn('function ensurePlayableClubStructure(club)', self.comp_js)
        self.assertIn('PRIZE_MONEY_TABLE_D2', self.main_js)
        self.assertIn('gameState.totalWeeks = inD2 ? 46 : 38;', self.main_js)
        self.assertIn('mustPromoteImmediate', self.comp_js)
        self.assertIn('isPlayerPromoted', self.comp_js)
        # 旧バグ（createPlayerの第2引数basePowerにpc.id文字列を渡していた問題）が除去されていること
        self.assertNotIn('createPlayer(pos, pc.id,', self.comp_js)

    def test_2_cup_and_euro_semifinal_schedule_and_bracket_progression(self):
        """Bug 2: 全カップ戦（L-CUP, N-CUP, 欧州3大会）のカレンダーに準決勝(SF)が含まれ、決勝まで進行できること"""
        # 欧州・L-CUP・N-CUP それぞれに roundKey: 'SF' が定義されていること
        sf_matches = re.findall(r"roundKey:\s*'SF'", self.comp_js)
        self.assertGreaterEqual(len(sf_matches), 3, "Euro, L-CUP, and N-CUP must all define roundKey: 'SF'")
        self.assertIn("label: 'L-CUP 準決勝'", self.comp_js)
        self.assertIn("label: 'N-CUP 準決勝'", self.comp_js)
        self.assertIn('function advanceCupBracketIfRoundComplete(comp, roundKey)', self.comp_js)
        self.assertIn('function finalizeEuroPlayoffToR16(comp)', self.comp_js)
        # アウェイ勝利時の勝者反転バグが修正されていること
        self.assertIn('const homeWon = isPlayerHome ? Boolean(userWon) : !userWon;', self.comp_js)

    def test_3_bosman_precontract_no_cloning_and_loan_integrity(self):
        """Bug 3: ボスマン内定選手の二重所属（CPU勝手更新）が防止され、レンタル放出/加入の給与・返却が整合していること"""
        # CPUの自動契約更新で preContract 選手が除外されていること
        self.assertIn('!p.preContract && !preContractIds.has(p.id)', self.main_js)
        # 新シーズン合流時に他クラブ配列から事前合意選手を除去していること
        self.assertIn('otherClub.players = otherClub.players.filter(x => x.id !== p.id);', self.main_js)
        # レンタル放出中（isLoanOut）選手が自クラブ総年俸から除外されていること
        self.assertIn('!p.isRetired && (!p.loanStatus || !p.loanStatus.isLoanOut)', self.main_js)
        # レンタル加入選手の契約更新ガードと元クラブへの返却が存在すること
        self.assertIn('レンタル加入中の選手とは契約延長交渉を行えません', self.main_js)
        self.assertIn('originalWage: weeklyWage', self.main_js)
        self.assertIn('parentClub.players.push(p);', self.main_js)

    def test_4_european_qualification_uses_saved_standings_and_cup_winners(self):
        """Bug 4: 欧州コンペ出場枠が勝点リセット前の前季最終順位・カップ戦覇者に基づいて選出されること"""
        self.assertIn('gameState.lastSeasonStandingsOrder = sortedD1.map(c => c.id);', self.main_js)
        self.assertIn('gameState.lastSeasonCupWinners = {', self.main_js)
        self.assertIn('gameState.lastSeasonStandingsOrder', self.comp_js)
        self.assertIn('cupWinners.nationalCupId', self.comp_js)
        self.assertIn('cupWinners.leagueCupId', self.comp_js)

    def test_5_save_load_preserves_all_critical_fields_and_rehydrates_refs(self):
        """Bug 5: セーブ＆ロードで内定選手・監督候補・試合履歴が保持され、クラブ参照再水和と消化済みカップ日程保護が行われること"""
        self.assertIn('preContractPlayers: gameState.preContractPlayers || []', self.main_js)
        self.assertIn('freeManagers: gameState.freeManagers || []', self.main_js)
        self.assertIn('freeCoaches: gameState.freeCoaches || null', self.main_js)
        self.assertIn('matchHistory: gameState.matchHistory || []', self.main_js)
        self.assertIn('lastSeasonStandingsOrder: gameState.lastSeasonStandingsOrder || null', self.main_js)
        self.assertIn('function rehydrateCompetitionsClubRefs()', self.comp_js)
        self.assertIn('rehydrateCompetitionsClubRefs();', self.main_js)
        self.assertIn('const hasAnyCupDay =', self.main_js)

    def test_6_cup_prizes_gate_revenues_and_wct_supporters_credited(self):
        """Bug 6: カップ戦優勝賞金・入場料/放映権料・WCTサポーター増加が正しいクラブ資産プロパティに加算されること"""
        # 架空プロパティ gameState.budget や playerClub.fanCount が残っていないこと
        self.assertNotIn('gameState.budget', self.comp_js)
        self.assertNotIn('playerClub.fanCount', self.main_js)
        self.assertIn('pClub.funds = (pClub.funds || 0) + (comp.prizeMoney || 0);', self.comp_js)
        self.assertIn('function applyCupMatchFinancialsAndSupporters(', self.main_js)
        # アバター参照キャッシュにも上限ガードがあること
        self.assertIn('PLAYER_AVATAR_LOOKUP.size >= PLAYER_AVATAR_CACHE_LIMIT', self.avatar_js)


if __name__ == '__main__':
    unittest.main()
