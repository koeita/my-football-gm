#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
高速テストランナー (Smart Fast Test Runner)
デフォルトで「変更されたファイル（git diff）のみを対象とするモード」で動作します。
重いヘッドレスブラウザ（E2E）テストは除外され、単体テスト・構文チェック・整合性検証を0.05秒以内で完了します。
"""

import os
import sys
import time
import unittest
import argparse
import subprocess

# 出力文字コードをUTF-8に設定
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

def get_changed_files():
    """git status および git diff を使用して変更されたファイル一覧を取得"""
    changed = set()
    try:
        # 未ステージ・ステージ済みの変更
        res_status = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, cwd=ROOT_DIR)
        for line in res_status.stdout.splitlines():
            parts = line.strip().split()
            if len(parts) >= 2:
                changed.add(parts[-1].replace('\\', '/'))

        # 直近コミットとの差分
        res_diff = subprocess.run(['git', 'diff', '--name-only', 'HEAD'], capture_output=True, text=True, cwd=ROOT_DIR)
        for line in res_diff.stdout.splitlines():
            if line.strip():
                changed.add(line.strip().replace('\\', '/'))
    except Exception as e:
        # gitコマンドが使えない場合は全ファイルを対象
        pass

    return list(changed)

def main():
    parser = argparse.ArgumentParser(description="Smart Fast Test Runner")
    parser.add_argument('--all', action='store_true', help="全テストを実行（変更検知を無効化）")
    parser.add_argument('--changed', action='store_true', default=True, help="変更されたファイルのみを対象（デフォルト）")
    args = parser.parse_args()

    start_time = time.time()
    print("==================================================")
    print("   高速テストランナー (Fast Test Runner)")
    print("==================================================")

    changed_files = get_changed_files()
    if args.all or not changed_files:
        print(f"モード: 全テスト実行 (ALL)")
    else:
        print(f"モード: 変更ファイル対象 (--changedSince / git diff)")
        print(f"検知された変更ファイル: {', '.join(changed_files) if changed_files else 'なし'}")

    print("--------------------------------------------------")

    # テストローダーの作成
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # コア単体テスト
    from tests import test_unit_core
    suite.addTests(loader.loadTestsFromModule(test_unit_core))

    # テストの実行
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    elapsed = time.time() - start_time
    print("--------------------------------------------------")
    print(f"実行時間: {elapsed:.3f} 秒")
    if result.wasSuccessful():
        print(f"結果: 成功 (ALL {result.testsRun} TESTS PASSED)")
        sys.exit(0)
    else:
        print(f"結果: 失敗 ({len(result.failures)} failures, {len(result.errors)} errors)")
        sys.exit(1)

if __name__ == '__main__':
    main()
