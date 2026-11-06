import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 高速なインメモリDOM環境
    environment: 'happy-dom',
    // 単体テストのみを対象（重いE2Eテストは除外）
    include: ['tests/**/*.test.{js,ts}', 'tests/**/test_*.{js,ts}'],
    exclude: ['tests/e2e/**', 'tests/run_e2e_tests.py', '**/node_modules/**'],
    // 変更されたファイルのみを対象とするモードをサポート
    passWithNoTests: true,
  },
});
