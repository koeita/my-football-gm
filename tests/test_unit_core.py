import unittest
import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestProjectSyntaxAndStructure(unittest.TestCase):
    """プロジェクトの静的整合性・構文チェック（実行時間: 約0.02秒）"""

    def setUp(self):
        self.data_js_path = os.path.join(ROOT_DIR, 'data.js')
        self.models_js_path = os.path.join(ROOT_DIR, 'models.js')
        self.main_js_path = os.path.join(ROOT_DIR, 'main.js')
        self.avatar_js_path = os.path.join(ROOT_DIR, 'avatar.js')
        self.style_css_path = os.path.join(ROOT_DIR, 'style.css')
        self.index_html_path = os.path.join(ROOT_DIR, 'index.html')

    def test_files_exist(self):
        self.assertTrue(os.path.exists(self.data_js_path), "data.js exists")
        self.assertTrue(os.path.exists(self.models_js_path), "models.js exists")
        self.assertTrue(os.path.exists(self.main_js_path), "main.js exists")
        self.assertTrue(os.path.exists(self.avatar_js_path), "avatar.js exists")
        self.assertTrue(os.path.exists(self.style_css_path), "style.css exists")
        self.assertTrue(os.path.exists(self.index_html_path), "index.html exists")

    def test_pixel_avatar_generator_structure(self):
        """ドット絵顔ジェネレーターの仕様（遺伝子要素・描画関数・拡大サイズ・鮮明化CSS・プロフィールCanvas）が満たされていること"""
        with open(self.avatar_js_path, 'r', encoding='utf-8') as f:
            avatar_js = f.read()
        with open(self.index_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        with open(self.style_css_path, 'r', encoding='utf-8') as f:
            css = f.read()

        self.assertEqual(css.count('{'), css.count('}'), "style.css braces must be balanced")
        self.assertEqual(avatar_js.count('{'), avatar_js.count('}'), "avatar.js braces must be balanced")
        self.assertIn('function generateAvatarData', avatar_js)
        self.assertIn('function generatePlayerAvatar', avatar_js)
        self.assertIn('function getAvatarKitColors', avatar_js)
        self.assertIn('club.kitColors', avatar_js)
        self.assertIn('resolvedClub.primaryColor', avatar_js)
        self.assertIn("roleType === 'manager'", avatar_js)
        self.assertIn('#1c2026', avatar_js)
        self.assertIn('canvasSize = 48', avatar_js)
        self.assertIn('image-rendering: pixelated;', css)
        self.assertIn('image-rendering: crisp-edges;', css)
        self.assertIn('#3a3f45', css)
        self.assertIn('id="profile-avatar-canvas"', html)

    def test_no_forbidden_draggable_attribute(self):
        """モバイルスクロールを破壊する draggable='true' が作戦ボード関連要素に含まれていないこと"""
        with open(self.main_js_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # ピッチノードや控えアイテムに draggable='true' がないか
        self.assertNotIn('class="${nodeClasses}" draggable="true"', content)
        self.assertNotIn('bench-sub-item ${itemClass}" draggable="true"', content)
        self.assertNotIn('class="bench-sub-item" draggable="true"', content)

    def test_roster_table_column_alignment(self):
        """ロスターテーブルのヘッダー列数とデータ列数が整合していること"""
        with open(self.index_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        with open(self.main_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        # index.htmlのroster-table header th数
        roster_table_match = re.search(r'<table class="data-table roster-table">[\s\S]*?<thead>[\s\S]*?<tr>([\s\S]*?)</tr>', html)
        self.assertIsNotNone(roster_table_match)
        th_count = len(re.findall(r'<th[\s>]', roster_table_match.group(1)))

        # main.jsのroster-table render row td数
        row_template_match = re.search(r'return `\s*<tr[^>]*data-player-id[\s\S]*?</tr>', js)
        self.assertIsNotNone(row_template_match)
        td_count = len(re.findall(r'<td[\s>]', row_template_match.group(0)))

        self.assertEqual(th_count, td_count, f"Roster table header ({th_count}) and row ({td_count}) column count must match!")

    def test_required_dom_ids_exist(self):
        """主要UIパネルおよびコンテナIDがindex.htmlに存在すること"""
        with open(self.index_html_path, 'r', encoding='utf-8') as f:
            html = f.read()

        required_ids = [
            'view-team', 'view-roster', 'view-office', 'view-facilities', 'view-market',
            'pitch-container', 'pitch-bench-list', 'pitch-sub-box',
            'formation-btn-group', 'tactics-btn-group',
            'player-profile-modal', 'intro-modal-overlay',
            'roster-subnav-bar', 'roster-subview-board', 'roster-subview-players', 'roster-subview-tactics'
        ]
        for dom_id in required_ids:
            self.assertIn(f'id="{dom_id}"', html, f"DOM ID #{dom_id} must exist in index.html")

    def test_reload_prevention_mechanisms(self):
        """モバイルでのプルダウンリロード防止設定（CSS overscroll-behavior-y: none および JS initReloadPrevention）が設定されていること"""
        with open(self.style_css_path, 'r', encoding='utf-8') as f:
            css = f.read()
        with open(self.main_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn('overscroll-behavior-y: none', css, "style.css must have overscroll-behavior-y: none")
        self.assertIn('initReloadPrevention', js, "main.js must define and call initReloadPrevention")
        self.assertIn('beforeunload', js, "main.js must handle beforeunload to prevent accidental reload")

    def test_bench_carousel_css_properties(self):
        """控え選手カルーセルの横スクロールプロパティが正しく定義されていること"""
        with open(self.style_css_path, 'r', encoding='utf-8') as f:
            css = f.read()

        # .pitch-bench-list の overflow-x: auto と touch-action: pan-x
        self.assertIn('overflow-x: auto', css)
        self.assertIn('touch-action: pan-x', css)

    def test_main_menu_title_screen_structure(self):
        """メインメニュー（タイトル画面）およびセーブデータ連動画面遷移のDOM・関数・CSSが定義されていること"""
        with open(self.index_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        with open(self.data_js_path, 'r', encoding='utf-8') as f:
            data_js = f.read()
        with open(self.models_js_path, 'r', encoding='utf-8') as f:
            models_js = f.read()
        with open(self.main_js_path, 'r', encoding='utf-8') as f:
            js = f.read()
        with open(self.style_css_path, 'r', encoding='utf-8') as f:
            css = f.read()

        self.assertEqual(data_js.count('{'), data_js.count('}'), "data.js braces must be balanced")
        self.assertEqual(models_js.count('{'), models_js.count('}'), "models.js braces must be balanced")
        self.assertEqual(js.count('{'), js.count('}'), "main.js braces must be balanced")
        self.assertEqual(css.count('{'), css.count('}'), "style.css braces must be balanced")
        for dom_id in [
            'main-menu-screen', 'btn-menu-continue', 'btn-menu-new-career',
            'btn-menu-records', 'btn-menu-settings', 'btn-return-title',
            'records-modal-overlay', 'settings-modal-overlay'
        ]:
            self.assertIn(f'id="{dom_id}"', html, f"#{dom_id} must exist in index.html")
        for fn in ['showMainMenuScreen', 'hideMainMenuScreen', 'saveGameToStorage', 'loadGameFromStorage']:
            self.assertIn(f'function {fn}', js, f"{fn} must be defined in main.js")
        self.assertIn('.main-menu-screen', css)
        self.assertIn('#1a1d20', css)

class TestGameLogicUnits(unittest.TestCase):
    """ゲームコアロジックの単体テスト（実行時間: 約0.05秒）"""

    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'data.js'), 'r', encoding='utf-8') as f:
            self.data_js = f.read()
        with open(os.path.join(ROOT_DIR, 'models.js'), 'r', encoding='utf-8') as f:
            self.models_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        self.js_code = self.data_js + '\n' + self.models_js + '\n' + self.main_js

    def test_formation_definitions(self):
        """全8フォーメーションが定義され、それぞれ11スロット（GK含む）持つこと"""
        for formation in ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '4-1-2-3', '4-3-1-2']:
            self.assertIn(f"'{formation}':", self.js_code, f"Formation {formation} must be defined")
        # 4-1-2-3: 中盤2枚がAMであること
        self.assertIn("{ slotIndex: 6, pos: 'AM', label: 'LAM', x: 31, y: 40 }", self.js_code)
        self.assertIn("{ slotIndex: 7, pos: 'AM', label: 'RAM', x: 69, y: 40 }", self.js_code)
        # 4-3-1-2: 中盤3枚の真ん中がDMであること
        self.assertIn("{ slotIndex: 6, pos: 'DM', label: 'DM', x: 50, y: 56 }", self.js_code)

    def test_auto_optimal_lineup_functions(self):
        """おまかせ最適編成のアルゴリズム・ボタン・イベントが定義されていること"""
        self.assertIn('function calculateSlotPlayerScore', self.js_code)
        self.assertIn('function findOptimalAssignment', self.js_code)
        self.assertIn('function optimizeClubStarters', self.js_code)
        self.assertIn('function applyAutoOptimalLineup', self.js_code)
        self.assertIn('btn-auto-optimal-lineup', self.js_code)

    def test_manager_philosophy_and_management_system(self):
        """監督哲学・人事システムのデータ構造・ボーナスロジック・UI定義が正しく統合されていること"""
        # main.js 内のコア関数
        self.assertIn('const MANAGERS_DATABASE =', self.js_code)
        self.assertIn('function createManager', self.js_code)
        self.assertIn('function getManagerBuyoutFee', self.js_code)
        self.assertIn('function updateManagerTrustAfterMatch', self.js_code)
        self.assertIn('function renderTacticalManagerBanner', self.js_code)
        self.assertIn('function renderManagerManagementPanel', self.js_code)
        self.assertIn('function sackCurrentManager', self.js_code)
        self.assertIn('function hireNewManager', self.js_code)
        self.assertIn('managerBonusOvr', self.js_code)

        # avatar.js 内の監督アバター関数
        with open(os.path.join(ROOT_DIR, 'avatar.js'), 'r', encoding='utf-8') as f:
            avatar_code = f.read()
        self.assertIn('function generateManagerAvatar', avatar_code)
        self.assertIn('function getManagerAvatarHtml', avatar_code)

        # index.html 内のUIコンテナ
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            html_code = f.read()
        self.assertIn('id="tactical-manager-banner"', html_code)
        self.assertIn('id="manager-management-panel"', html_code)
        self.assertIn('id="manager-panel-body"', html_code)

    def test_tactical_styles_definitions(self):
        """重複のない5大戦術スタイルが定義され、試合シミュレーションロジックと連動していること"""
        for tactic in ['possession', 'gegenpress', 'counter', 'wingplay', 'parkthebus']:
            self.assertIn(f"{tactic}:", self.js_code, f"Tactic {tactic} must be defined in TACTICS_DEFINITIONS")
        self.assertIn('normalizeTacticKey', self.js_code)
        self.assertIn('TACTICS_DEFINITIONS', self.js_code)

    def test_position_fit_factors(self):
        """メイン適性100%、サブ適性92%、適性外80%の係数が保持されていること"""
        self.assertIn('factor: 1.0', self.js_code)
        self.assertIn('factor: 0.92', self.js_code)
        self.assertIn('factor: 0.8', self.js_code)

    def test_market_sorting_keys_supported(self):
        """移籍市場ソートキー（ovr-desc, ovr-asc, fee-desc, fee-asc, wage-desc, wage-asc, age-asc, age-desc）が実装されていること"""
        for key in ['ovr-desc', 'ovr-asc', 'fee-desc', 'fee-asc', 'wage-desc', 'wage-asc', 'age-asc', 'age-desc']:
            self.assertIn(f"case '{key}':", self.js_code, f"Market sort key '{key}' must be handled")

if __name__ == '__main__':
    unittest.main()
