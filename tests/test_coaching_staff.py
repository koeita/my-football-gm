import unittest
import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class TestCoachingStaffSlots(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'data.js'), 'r', encoding='utf-8') as f:
            data_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            main_js = f.read()
        self.js = data_js + '\n' + main_js

    def test_coaches_database_structure(self):
        self.assertIn("const COACHES_DATABASE = {", self.js)
        self.assertIn("attacking:", self.js)
        self.assertIn("defending:", self.js)
        self.assertIn("goalkeeping:", self.js)
        self.assertIn("fitness:", self.js)

    def test_create_initial_coaches(self):
        self.assertIn("function createInitialCoaches(", self.js)
        self.assertIn("function ensureClubCoaches(", self.js)
        self.assertIn("function getClubCoachingStaffWeeklyWage(", self.js)
        self.assertIn("function getClubCoachingEffects(", self.js)

    def test_payroll_includes_coaches(self):
        self.assertIn("getClubCoachingStaffWeeklyWage(club)", self.js)
        self.assertIn("coachAnnual = coachWeekly * 52", self.js)

    def test_growth_effects(self):
        self.assertIn("coaches.attacking", self.js)
        self.assertIn("coaches.defending", self.js)
        self.assertIn("coaches.goalkeeping", self.js)
        self.assertIn("coaches.fitness", self.js)

    def test_match_simulation_effects(self):
        self.assertIn("getClubCoachingEffects(homeClub)", self.js)
        self.assertIn("hCoaching.attMult", self.js)
        self.assertIn("hCoaching.defSuppression", self.js)
        self.assertIn("hCoaching.gkSaveBonus", self.js)
        self.assertIn("coaching.staDrainMult", self.js)

    def test_panel_rendering(self):
        self.assertIn("function renderCoachingStaffPanel()", self.js)
        self.assertIn("openCoachHireModal(", self.js)
        self.assertIn("closeCoachHireModal(", self.js)
        self.assertIn("hireCoach(", self.js)
        self.assertIn("sackCoach(", self.js)

    def test_fictional_staff_names(self):
        # 監督・コーチ名に実在もじり名（ガルディス、クロップ、ファーガソン等）が残っていないこと
        parody_names = ['ガルディス', 'クロップ', 'ファーガソン', 'アンチェス', 'シメオーニ', 'モウリーニ', 'フリック風', 'ベルク', 'シュマイケル', 'カンナバ']
        for p in parody_names:
            self.assertNotIn(f"'{p}'", self.js)
            self.assertNotIn(f'"{p}"', self.js)
        # 動的生成関数の存在確認
        self.assertIn("function generateRandomStaffName(", self.js)

if __name__ == '__main__':
    unittest.main()
