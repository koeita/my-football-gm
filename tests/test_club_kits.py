import math
import os
import re
import unittest


def parse_hex_rgb(hex_str):
    clean = re.sub(r'[^0-9a-fA-F]', '', hex_str or '#1e3a8a')
    if len(clean) == 3:
        clean = ''.join(c * 2 for c in clean)
    else:
        clean = clean.ljust(6, '0')[:6]
    num = int(clean, 16)
    return (num >> 16) & 255, (num >> 8) & 255, num & 255


def color_luminance(hex_str):
    r, g, b = parse_hex_rgb(hex_str)
    return 0.299 * r + 0.587 * g + 0.114 * b


def color_distance(hex1, hex2):
    r1, g1, b1 = parse_hex_rgb(hex1)
    r2, g2, b2 = parse_hex_rgb(hex2)
    r_mean = (r1 + r2) / 2.0
    dr = r1 - r2
    dg = g1 - g2
    db = b1 - b2
    return math.sqrt((2 + r_mean / 256.0) * dr * dr + 4 * dg * dg + (2 + (255 - r_mean) / 256.0) * db * db)


class TestClubKits(unittest.TestCase):
    def setUp(self):
        self.root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(self.root, 'data.js'), 'r', encoding='utf-8') as f:
            self.data_js = f.read()
        with open(os.path.join(self.root, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(self.root, 'match-engine.js'), 'r', encoding='utf-8') as f:
            self.match_js = f.read()
        with open(os.path.join(self.root, 'style.css'), 'r', encoding='utf-8') as f:
            self.style_css = f.read()
        with open(os.path.join(self.root, 'storage.js'), 'r', encoding='utf-8') as f:
            self.storage_js = f.read()

    def test_club_kit_map_and_helpers_in_data_js(self):
        """data.js に CLUB_KIT_MAP と色解決ヘルパーが定義され、対象全クラブに有効なHome/Away色が設定されていること"""
        for symbol in [
            'const CLUB_KIT_MAP =',
            'function getColorDistance(',
            'function getContrastTextColor(',
            'function resolveClubKit(',
            'function resolveMatchKits('
        ]:
            self.assertIn(symbol, self.data_js)

        kit_block = re.search(r'const CLUB_KIT_MAP = \{([\s\S]*?)\n\};', self.data_js).group(1)
        kit_entries = re.findall(
            r"'(\w+)':\s*\{\s*home:\s*\{\s*primary:\s*'(#[0-9a-fA-F]{6})',\s*secondary:\s*'(#[0-9a-fA-F]{6})'\s*\},\s*away:\s*\{\s*primary:\s*'(#[0-9a-fA-F]{6})',\s*secondary:\s*'(#[0-9a-fA-F]{6})'\s*\}\s*\}",
            kit_block
        )
        kit_map = {
            cid: {'home': (hp, hs), 'away': (ap, a_s)}
            for cid, hp, hs, ap, a_s in kit_entries
        }

        d1_block = re.search(r'const CLUB_DEFINITIONS = \[([\s\S]*?)\n\];', self.data_js).group(1)
        d1_ids = re.findall(r"id:\s*'(\w+)'", d1_block)
        self.assertEqual(len(d1_ids), 20)
        for cid in d1_ids:
            self.assertIn(cid, kit_map, f"1部クラブ {cid} が CLUB_KIT_MAP にありません")

        for compat_id in ['eastlondon_h', 'midlands_w', 'leicester_f', 'southampton_s']:
            self.assertIn(compat_id, kit_map, f"旧1部互換クラブ {compat_id} が CLUB_KIT_MAP にありません")

        mega_block = re.search(r'const EUROPEAN_MEGA_CLUBS = \[([\s\S]*?)\n\];', self.data_js).group(1)
        mega_ids = re.findall(r"id:\s*'(\w+)'", mega_block)
        self.assertEqual(len(mega_ids), 6)
        for cid in mega_ids:
            self.assertIn(cid, kit_map, f"欧州メガクラブ {cid} が CLUB_KIT_MAP にありません")

        # HomeとAwayの1st/2nd自体が十分な色差を持つこと
        for cid, kits in kit_map.items():
            dist = color_distance(kits['home'][0], kits['away'][0])
            self.assertGreaterEqual(dist, 125, f"{cid} のHome/Away色差が不足: {dist:.1f}")

    def test_competitions_clubs_have_primary_and_secondary_colors(self):
        """competitions.js の全176クラブが有効な primaryColor と secondaryColor を保持していること"""
        expected_counts = {
            'CHAMPIONSHIP_CLUBS_DEFINITIONS': 24,
            'SPAIN_CLUBS_DEFINITIONS': 20,
            'ITALY_CLUBS_DEFINITIONS': 20,
            'GERMANY_CLUBS_DEFINITIONS': 18,
            'FRANCE_CLUBS_DEFINITIONS': 18,
            'OTHER_EURO_CLUBS_DEFINITIONS': 76,
        }
        total = 0
        for const_name, count in expected_counts.items():
            block = re.search(rf'const {const_name} = \[([\s\S]*?)\n\];', self.comp_js).group(1)
            entries = re.findall(
                r"id:\s*'([^']+)'[^\n]*primaryColor:\s*'(#[0-9a-fA-F]{6})',\s*secondaryColor:\s*'(#[0-9a-fA-F]{6})'",
                block
            )
            self.assertEqual(len(entries), count, f"{const_name} の配色定義数が不一致: {len(entries)}")
            total += len(entries)
        self.assertEqual(total, 176)

    def test_clash_resolution_and_gk_separation(self):
        """同色対決時にアウェイが2ndへ切り替わり、GK色もフィールド色と分離されること"""
        kit_block = re.search(r'const CLUB_KIT_MAP = \{([\s\S]*?)\n\};', self.data_js).group(1)
        kit_entries = re.findall(
            r"'(\w+)':\s*\{\s*home:\s*\{\s*primary:\s*'(#[0-9a-fA-F]{6})',\s*secondary:\s*'(#[0-9a-fA-F]{6})'\s*\},\s*away:\s*\{\s*primary:\s*'(#[0-9a-fA-F]{6})',\s*secondary:\s*'(#[0-9a-fA-F]{6})'\s*\}\s*\}",
            kit_block
        )
        kit_map = {
            cid: {'home': hp, 'away': ap}
            for cid, hp, _, ap, _ in kit_entries
        }
        # 赤 vs 赤 (アーセナル vs リヴァプール), 白 vs 白 (トッテナム vs リーズ), 青 vs 青 (チェルシー vs エヴァートン)
        for home_id, away_id in [
            ('northlondon_a', 'liverpool_b'),
            ('northlondon_w', 'leeds_u'),
            ('london_fc', 'merseyside_b')
        ]:
            h_col = kit_map[home_id]['home']
            a_home_col = kit_map[away_id]['home']
            a_away_col = kit_map[away_id]['away']
            self.assertLess(color_distance(h_col, a_home_col), 125, f"{home_id} vs {away_id} は本来クラッシュする組み合わせ")
            self.assertGreaterEqual(color_distance(h_col, a_away_col), 125, f"{home_id} vs {away_id} のAway切替後も色差不足")

    def test_match_engine_css_and_storage_integration(self):
        """match-engine.js・style.css・storage.js がユニホーム色CSS変数と同期に対応していること"""
        setup_fn = re.search(
            r'function setupMatch2DPitchTokens\(homeClub, awayClub\) \{([\s\S]*?)\n\}',
            self.match_js
        ).group(1)
        self.assertIn('resolveMatchKits(homeClub, awayClub)', setup_fn)
        self.assertIn("el.style.setProperty('--kit-bg'", setup_fn)
        self.assertIn("el.style.setProperty('--kit-border'", setup_fn)
        self.assertIn("el.style.setProperty('--kit-text'", setup_fn)

        css_block = re.search(
            r'\.pitch-2d-token\.home-token \{[\s\S]*?\.pitch-2d-token\.active-actor \{',
            self.style_css
        ).group(0)
        self.assertIn('var(--kit-bg', css_block)
        self.assertIn('var(--kit-border', css_block)
        self.assertIn('var(--kit-text', css_block)
        self.assertNotIn('border: 2px solid #ffffff !important', css_block)
        self.assertNotIn('border: 1.5px solid rgba(255, 255, 255, 0.7) !important', css_block)

        self.assertIn("boxEl.style.setProperty('--team-tint-bg'", setup_fn)
        self.assertIn("boxEl.style.setProperty('--team-tint-border'", setup_fn)
        self.assertIn('var(--team-tint-bg', self.style_css)
        self.assertIn('var(--team-tint-border', self.style_css)

        self.assertIn('club.kit = CLUB_KIT_MAP[club.id];', self.storage_js)

    def test_match_summary_stats_and_ratings_sync_with_kit_colors(self):
        """マッチサマリーのスコアボード・チームスタッツ・全選手評価点一覧がユニホーム色と同期していること"""
        self.assertIn('function buildKitUiTheme(', self.match_js)
        self.assertIn('function resolveSummaryKitThemes(', self.match_js)

        ratings_fn = re.search(
            r'function buildSummaryPlayerRatingsHtml\(homeClub, awayClub, md, resolvedKits = null\) \{([\s\S]*?)\n\}\n\n/\*\*\n \* 公式戦マッチサマリー',
            self.match_js
        ).group(1)
        self.assertIn('resolveSummaryKitThemes(homeClub, awayClub, resolvedKits)', ratings_fn)
        self.assertIn('class="summary-team-tab-btn ${defaultTeam === \'home\' ? \'active\' : \'\'}" data-ratings-team="home" style="${homeTheme.inlineVars}"', ratings_fn)
        self.assertIn('class="summary-team-tab-btn ${defaultTeam === \'away\' ? \'active\' : \'\'}" data-ratings-team="away" style="${awayTheme.inlineVars}"', ratings_fn)
        self.assertIn('data-ratings-panel="${sideKey}" style="${teamTheme ? teamTheme.inlineVars : \'\'}"', ratings_fn)

        summary_fn = re.search(
            r'function buildMatchSummaryHtml\(md\) \{([\s\S]*?)\n\}\n\nfunction transitionToMatchSummary',
            self.match_js
        ).group(1)
        self.assertIn('resolveSummaryKitThemes(homeClub, awayClub)', summary_fn)
        for css_var in [
            '--${prefix}-kit-bg:', '--${prefix}-kit-border:', '--${prefix}-kit-sub-border:', '--${prefix}-kit-glow:',
            '--${prefix}-kit-accent:', '--${prefix}-kit-bar:', '--${prefix}-kit-bar-border:'
        ]:
            self.assertIn(css_var, summary_fn)
        self.assertIn("toSideCssVars('home', homeTheme)", summary_fn)
        self.assertIn("toSideCssVars('away', awayTheme)", summary_fn)

        self.assertIn('<div class="summary-wrapper" style="${summaryWrapperVars}">', summary_fn)
        self.assertIn('summary-club-col home ${homeClub.isPlayer ? \'is-player\' : \'\'}" style="${homeTheme.inlineVars}"', summary_fn)
        self.assertIn('summary-club-col away ${awayClub.isPlayer ? \'is-player\' : \'\'}" style="${awayTheme.inlineVars}"', summary_fn)
        self.assertIn('class="stat-val-home" style="color:${homeTheme.accentColor};"', summary_fn)
        self.assertIn('class="stat-val-away" style="color:${awayTheme.accentColor};"', summary_fn)
        self.assertNotIn('style="color:#2ecc71;"', summary_fn)
        self.assertNotIn('style="color:#60a5fa;"', summary_fn)
        self.assertIn('mini-score-club home mono ${homeClub.isPlayer ? \'accent-green\' : \'\'}" style="color:${homeTheme.accentColor};"', summary_fn)
        self.assertIn('mini-score-club away mono ${awayClub.isPlayer ? \'accent-green\' : \'\'}" style="color:${awayTheme.accentColor};"', summary_fn)

        stats_css = re.search(r'\.summary-stats-card \{[\s\S]*?\.stat-bar-away \{[\s\S]*?\}', self.style_css).group(0)
        self.assertIn('var(--home-kit-bg', stats_css)
        self.assertIn('var(--away-kit-bg', stats_css)
        self.assertIn('var(--home-kit-border', stats_css)
        self.assertIn('var(--away-kit-border', stats_css)
        self.assertIn('var(--home-kit-bar', stats_css)
        self.assertIn('var(--away-kit-bar', stats_css)

        ratings_css = re.search(r'\.summary-mini-score-bar \{[\s\S]*?\.team-title-code \{[\s\S]*?\}', self.style_css).group(0)
        self.assertIn('var(--home-kit-border', ratings_css)
        self.assertIn('var(--away-kit-border', ratings_css)
        self.assertIn('var(--team-tint-bg', ratings_css)
        self.assertIn('var(--team-tint-border', ratings_css)
        self.assertIn('var(--team-tint-header-bg', ratings_css)
        self.assertIn('var(--team-tint-sub-border', ratings_css)
        self.assertIn('var(--team-accent-color', ratings_css)

        tabs_css = re.search(r'\.summary-team-tab-btn \{[\s\S]*?\.summary-team-tab-btn\.active \{[\s\S]*?\}', self.style_css).group(0)
        self.assertIn('var(--team-tint-sub-border', tabs_css)
        self.assertIn('var(--team-tint-header-bg', tabs_css)
        self.assertIn('var(--team-tint-border', tabs_css)
        self.assertIn('var(--team-accent-color', tabs_css)

    def test_pitch_popup_kit_color_speed_scaling_and_precheck_white_text(self):
        """試合中ポップアップの色・倍速連動と、作戦確認の自チーム名・戦術名の白文字化を検証"""
        popup_fn = re.search(
            r'function showMatchPitchPopup\(ev\) \{([\s\S]*?)\n\}',
            self.match_js
        ).group(1)
        self.assertIn('resolveSummaryKitThemes(homeClub, awayClub)', popup_fn)
        self.assertIn("popupEl.style.setProperty('--popup-border'", popup_fn)
        self.assertIn("popupEl.style.setProperty('--popup-glow'", popup_fn)
        self.assertIn("popupEl.style.setProperty('--popup-accent'", popup_fn)
        self.assertIn("popupEl.style.setProperty('--popup-bg'", popup_fn)
        self.assertIn('Math.max(350, Math.round(2000 / speed))', popup_fn)
        self.assertIn('}, popupDurationMs);', popup_fn)

        popup_css = re.search(
            r'\.match-pitch-event-popup \{[\s\S]*?\.event-popup-badge \{[\s\S]*?\}',
            self.style_css
        ).group(0)
        self.assertIn('var(--popup-border', popup_css)
        self.assertIn('var(--popup-glow', popup_css)
        self.assertIn('var(--popup-accent', popup_css)
        self.assertIn('var(--popup-anim-dur', popup_css)

        precheck_fn = re.search(
            r'function openMatchPrecheckModal\(\) \{([\s\S]*?)\n\}',
            self.match_js
        ).group(1)
        self.assertNotIn('<strong class="accent-green"', precheck_fn)
        self.assertIn('<strong style="color:#ffffff;', precheck_fn)

        precheck_css = re.search(
            r'\.precheck-club-box\.is-player \.precheck-club-name \{[\s\S]*?\}',
            self.style_css
        ).group(0)
        self.assertIn('color: #ffffff;', precheck_css)


if __name__ == '__main__':
    unittest.main()
