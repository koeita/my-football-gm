import os
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestPhase1(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'data.js'), 'r', encoding='utf-8') as f:
            data_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            main_js = f.read()
        self.js = data_js + '\n' + main_js
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.html = f.read()

    def test_squad_size_relaxed(self):
        # MAX_SQUAD_SIZE is 50
        self.assertIn("const MAX_SQUAD_SIZE = 50;", self.js)
        # SQUAD_COMPOSITION has 27 players total (starters 11, bench/reserves 16)
        self.assertIn("{ pos: 'CB', total: 5, starters: 2 }", self.js)
        self.assertIn("{ pos: 'CF', total: 3, starters: 1 }", self.js)
        self.assertIn("{ pos: 'DM', total: 2, starters: 1 }", self.js)
        self.assertIn("{ pos: 'CM', total: 4, starters: 2 }", self.js)

    def test_squad_header_display(self):
        # No slash like 18 / 25
        self.assertIn('document.getElementById(\'header-squad-size\').textContent = `SQUAD: ${squadCount}名`;', self.js)
        self.assertIn('id="header-squad-size">20名</span>', self.html)
        self.assertIn('id="tab-badge-roster">20名</span>', self.html)

    def test_preseason_calendar_july_1(self):
        # Starts on July 1 (month index 6)
        self.assertIn("new Date(seasonYear, 6, 1 + offset)", self.js)
        self.assertIn("const windowOpen = (m === 7) || (m === 8) || (m === 1);", self.js)
        self.assertIn("PRE-SEASON", self.js)

    def test_initial_staff_setup_modal(self):
        self.assertIn('id="initial-staff-setup-modal"', self.html)
        self.assertIn('function openInitialStaffSetupModal(', self.js)
        self.assertIn('btn-confirm-initial-staff', self.html)
        self.assertIn('btn-confirm-initial-staff', self.js)

if __name__ == '__main__':
    unittest.main()
