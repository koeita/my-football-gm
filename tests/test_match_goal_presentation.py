import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMOJI_PATTERN = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]')


class TestMatchGoalPresentation(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.index_html = f.read()
        with open(os.path.join(ROOT_DIR, 'match-engine.js'), 'r', encoding='utf-8') as f:
            self.match_js = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.style_css = f.read()

    def test_index_html_goal_overlay_elements_and_cache_busters(self):
        self.assertIn('id="match-pitch-goal-broadcast"', self.index_html)
        self.assertIn('id="match-goal-fullscreen"', self.index_html)
        pitch_pos = self.index_html.find('id="match-2d-pitch"')
        bc_pos = self.index_html.find('id="match-pitch-goal-broadcast"')
        modal_pos = self.index_html.find('id="match-event-modal"')
        fs_pos = self.index_html.find('id="match-goal-fullscreen"')
        self.assertGreater(bc_pos, pitch_pos)
        self.assertGreater(fs_pos, modal_pos)

        self.assertRegex(self.index_html, r'style\.css\?v=20261119_3810')
        for asset in ['match-engine.js', 'main.js']:
            self.assertRegex(self.index_html, rf'{re.escape(asset)}\?v=20261119_\d+')

        # 秘書モーダル主要選択肢は緑背景に黒文字、作戦確認クイック結果は本部同配色であること
        sec_block_match = re.search(
            r'\.gm-vn-sticky-footer\.is-card-attached\s+\.modal-actions\s+\.btn-primary,\s*\.gm-vn-sticky-footer\.is-card-attached\s+\.modal-actions\s+\.btn-accent\s*\{[^}]+\}',
            self.style_css,
        )
        self.assertIsNotNone(sec_block_match)
        self.assertIn('#2ecc71', sec_block_match.group(0))
        self.assertIn('#111417', sec_block_match.group(0))

        precheck_quick_match = re.search(r'\.btn-precheck-quick\s*\{[^}]+\}', self.style_css)
        self.assertIsNotNone(precheck_quick_match)
        self.assertIn('#f8fafc', precheck_quick_match.group(0))
        self.assertIn('#252c35', precheck_quick_match.group(0))

    def test_match_engine_goal_functions_and_competition_meta(self):
        for symbol in [
            'COMPETITION_SHORT_LABELS',
            'resolveCompetitionShortLabel',
            'resolveMatchCompetitionMeta',
            'computeGoalPresentationDurationMs',
            'finishMatchGoalPresentation',
            'presentMatchGoalSequence',
            'goalFreezeActive',
            'goalResumeTimeoutId',
            'goalKeyListener',
        ]:
            self.assertIn(symbol, self.match_js, f'{symbol} が match-engine.js に見つかりません')

        # 全試合経路に compKey / compLabel があること
        for expected_comp in [
            "compKey: 'preseasonCup'",
            "compKey: euroCompKey",
            "compKey: poEuroCompKey",
            "compKey: compType",
            "compKey: leagueCompKey",
        ]:
            self.assertIn(expected_comp, self.match_js, f'{expected_comp} が見つかりません')

        # ゴール時にタイマー停止＋演出呼び出し、速度切替ボタンに freeze ガードがあること
        self.assertIn('presentMatchGoalSequence(ev);', self.match_js)
        self.assertIn('!matchLiveState.goalFreezeActive', self.match_js)
        self.assertNotIn("if (ev.type === 'goal' || ev.type === 'save')", self.match_js)

    def test_style_css_goal_rules_and_zero_emojis(self):
        for selector in [
            '.match-goal-broadcast',
            '.goal-bc-card.is-away',
            '.match-goal-fullscreen',
            '.is-goal-flash-home',
            '.is-goal-flash-away',
            '.pitch-goal-net.is-net-hit',
            '.match-live-score .is-score-bump',
        ]:
            self.assertIn(selector, self.style_css, f'{selector} が style.css に見つかりません')

        # ゴール演出で追加されたセクションおよび全体へのカラー絵文字混入がないこと
        color_emoji_re = re.compile(r'[\U0001F300-\U0001FAFF]')
        for label, text in [
            ('match-engine.js', self.match_js),
            ('style.css', self.style_css),
        ]:
            hits = color_emoji_re.findall(text)
            self.assertEqual(hits, [], f'{label} にカラー絵文字が含まれています: {hits}')

        goal_js_slice = self.match_js[self.match_js.index('function computeGoalPresentationDurationMs'):self.match_js.index('function appendLiveCommentary')]
        goal_css_slice = self.style_css[self.style_css.index('/* ==========================================================================\n   ライブ試合 ゴール専用演出'):self.style_css.index('/* ハーフタイム一時停止オーバーレイ */')]
        for label, segment in [
            ('goal_js_slice', goal_js_slice),
            ('goal_css_slice', goal_css_slice),
        ]:
            hits = EMOJI_PATTERN.findall(segment)
            self.assertEqual(hits, [], f'{label} に禁止された記号・絵文字が含まれています: {hits}')


if __name__ == '__main__':
    unittest.main()
