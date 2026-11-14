import os
import re
import unittest


class TestClubNamingAndMigration(unittest.TestCase):
    def setUp(self):
        self.root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(self.root, 'data.js'), 'r', encoding='utf-8') as f:
            self.data_js = f.read()
        with open(os.path.join(self.root, 'competitions.js'), 'r', encoding='utf-8') as f:
            self.comp_js = f.read()
        with open(os.path.join(self.root, 'models.js'), 'r', encoding='utf-8') as f:
            self.models_js = f.read()
        with open(os.path.join(self.root, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()
        with open(os.path.join(self.root, 'storage.js'), 'r', encoding='utf-8') as f:
            self.storage_js = f.read()

    def test_d1_clubs_naming_codes_and_emblems(self):
        """イングランド1部20クラブと欧州メガクラブの命名・3文字コード・エンブレム整合性を検証"""
        sc_block = re.search(r'const CLUB_SHORT_CODES = \{([\s\S]*?)\};', self.data_js).group(1)
        short_codes = dict(re.findall(r"(\w+):\s*'([A-Z]{3})'", sc_block))

        emb_block = re.search(r'const CLUB_EMBLEM_MAP = \{([\s\S]*?)\n\};', self.data_js).group(1)
        emb_entries = re.findall(r"'(\w+)':\s*\{[^}]*code:\s*'([A-Z]{3})',\s*symbol:\s*'([A-Z]{3})'", emb_block)
        emb_map = {cid: (c, s) for cid, c, s in emb_entries}

        d1_block = re.search(r'const CLUB_DEFINITIONS = \[([\s\S]*?)\n\];', self.data_js).group(1)
        d1_clubs = re.findall(r"id:\s*'(\w+)'[\s\S]*?name:\s*'([^']+)'", d1_block)

        self.assertEqual(len(d1_clubs), 20, "イングランド1部は20クラブであること")
        seen_names = set()
        seen_codes = set()
        for cid, name in d1_clubs:
            self.assertNotIn('・', name, f"{cid} に中黒が含まれています: {name}")
            self.assertRegex(name, r'^.+ [A-Z]+$', f"{cid} が『名称 アルファベット』形式ではありません: {name}")
            self.assertNotIn(name, seen_names)
            seen_names.add(name)

            self.assertIn(cid, short_codes, f"{cid} が CLUB_SHORT_CODES にありません")
            code = short_codes[cid]
            self.assertNotIn(code, seen_codes, f"1部内で3文字コード重複: {code}")
            seen_codes.add(code)

            self.assertIn(cid, emb_map, f"{cid} が CLUB_EMBLEM_MAP にありません")
            self.assertEqual(emb_map[cid], (code, code), f"{cid} のエンブレム code/symbol が CLUB_SHORT_CODES と不一致")

        # 2026-27昇格4クラブが含まれていること
        d1_ids = {cid for cid, _ in d1_clubs}
        for promoted_id in ['leeds_u', 'sunderland_a', 'coventry_c', 'hull_c']:
            self.assertIn(promoted_id, d1_ids, f"2026-27昇格クラブ {promoted_id} が1部にありません")

        # EUROPEAN_MEGA_CLUBS 検証
        mega_block = re.search(r'const EUROPEAN_MEGA_CLUBS = \[([\s\S]*?)\n\];', self.data_js).group(1)
        mega_names = re.findall(r"name:\s*'([^']+)'", mega_block)
        self.assertEqual(len(mega_names), 6)
        for name in mega_names:
            self.assertNotIn('・', name)
            self.assertRegex(name, r'^.+ [A-Z]+$')

    def test_competitions_clubs_naming_and_short_codes(self):
        """イングランド2部24クラブと欧州全クラブの命名形式・3文字コード一意性を検証"""
        expected_counts = {
            'CHAMPIONSHIP_CLUBS_DEFINITIONS': 24,
            'SPAIN_CLUBS_DEFINITIONS': 20,
            'ITALY_CLUBS_DEFINITIONS': 20,
            'GERMANY_CLUBS_DEFINITIONS': 18,
            'FRANCE_CLUBS_DEFINITIONS': 18,
            'OTHER_EURO_CLUBS_DEFINITIONS': 76,
        }
        d1_block = re.search(r'const CLUB_DEFINITIONS = \[([\s\S]*?)\n\];', self.data_js).group(1)
        d1_names = set(re.findall(r"name:\s*'([^']+)'", d1_block))

        for const_name, count in expected_counts.items():
            m = re.search(rf'const {const_name} = \[([\s\S]*?)\n\];', self.comp_js)
            self.assertIsNotNone(m, f"{const_name} が見つかりません")
            entries = re.findall(r"id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*shortName:\s*'([A-Z0-9]{3})'", m.group(1))
            self.assertEqual(len(entries), count, f"{const_name} のクラブ数が不一致: {len(entries)}")

            seen_names = set()
            seen_shorts = set()
            for cid, name, short_name in entries:
                self.assertNotIn('・', name, f"{const_name} {cid} に中黒が含まれています: {name}")
                self.assertRegex(name, r'^.+ [A-Z]+$', f"{const_name} {cid} が形式違反: {name}")
                self.assertNotIn(name, seen_names, f"{const_name} 内で名称重複: {name}")
                seen_names.add(name)
                if const_name != 'OTHER_EURO_CLUBS_DEFINITIONS':
                    self.assertNotIn(short_name, seen_shorts, f"{const_name} 内で3文字コード重複: {short_name}")
                    seen_shorts.add(short_name)
                if const_name == 'CHAMPIONSHIP_CLUBS_DEFINITIONS':
                    self.assertNotIn(name, d1_names, f"1部と2部でクラブ重複: {name}")

    def test_hardcodes_and_migration_support(self):
        """過去クラブリスト・ボスマン移籍先・セーブデータマイグレーションの実装を検証"""
        past_block = re.search(r'const PAST_CLUBS_BY_NATIONALITY = \{([\s\S]*?)\n  \};', self.models_js).group(1)
        self.assertNotIn('・', past_block)

        fc_line = re.search(r'const foreignClubs = \[([^\]]+)\];', self.main_js).group(1)
        self.assertNotIn('・', fc_line)

        self.assertIn('const LEGACY_CLUB_NAME_MIGRATIONS =', self.storage_js)
        self.assertIn('const LEGACY_ID_COMPAT_MAP =', self.storage_js)
        self.assertIn('function migrateLegacyClubsData()', self.storage_js)
        self.assertIn('migrateLegacyClubsData();', self.storage_js)


if __name__ == '__main__':
    unittest.main()
