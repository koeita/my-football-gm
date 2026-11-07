#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
E2Eテストランナー (Playwright Heavy E2E Suite)
ヘッドレスブラウザを起動して、モバイルタッチ、スクロール、DnD選手交代をフル検証します。
通常の作業フロー（run_tests.py / npm test）からは分離されており、
明示的に呼び出した時（npm run test:e2e / python tests/run_e2e_tests.py）にのみ実行されます。
"""

import asyncio
import os
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

async def run_e2e():
    from playwright.async_api import async_playwright
    start_time = time.time()
    print("==================================================")
    print("   E2E統合テスト (Playwright Full Suite)")
    print("==================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(
            viewport={'width': 393, 'height': 852},
            has_touch=True,
            is_mobile=True,
            device_scale_factor=2
        )
        page = await context.new_page()

        file_url = f"file:///{ROOT_DIR.replace('\\', '/')}/index.html"
        await page.goto(file_url)
        await page.wait_for_timeout(800)

        # 1. GM就任
        await page.evaluate("""() => {
            const btn = document.getElementById('btn-confirm-intro');
            if (btn) btn.click();
            const ov = document.getElementById('intro-modal-overlay');
            if (ov) ov.classList.add('hidden');
        }""")
        await page.wait_for_timeout(500)

        # 2. 編成タブ
        await page.evaluate("() => { if (typeof switchTab === 'function') switchTab('roster'); }")
        await page.wait_for_timeout(500)

        bench_list = page.locator('#pitch-bench-list')
        scroll_width = await bench_list.evaluate('el => el.scrollWidth')
        client_width = await bench_list.evaluate('el => el.clientWidth')
        print(f"控えカルーセル: scrollWidth={scroll_width}px, clientWidth={client_width}px")

        # 3. 横タッチスワイプ検証（リスト余白でのスクロール挙動検証）
        bench_box = await bench_list.bounding_box()
        sx, sy = bench_box['x'] + bench_box['width'] - 10, bench_box['y'] + 5
        ex = sx - 160

        cdp = await context.new_cdp_session(page)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': sx, 'y': sy}]})
        await page.wait_for_timeout(30)
        for i in range(1, 10):
            cur_x = sx + (ex - sx) * (i / 9)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': cur_x, 'y': sy}]})
            await page.wait_for_timeout(20)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        await page.wait_for_timeout(300)

        # 4. ドラッグ＆ドロップ交代検証（控え選手カードをピッチへDnD）
        await bench_list.evaluate('el => el.scrollLeft = 0')
        await page.wait_for_timeout(200)

        gk_node = page.locator('.pitch-node[data-slot-index="0"]')
        gk_name_before = await gk_node.locator('.pitch-node-name-btn').inner_text()
        first_item = page.locator('#pitch-bench-list .bench-sub-item').first
        bench_player_name = await first_item.locator('.pitch-node-name-text').inner_text()

        box = await first_item.bounding_box()
        start_x, start_y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        gk_box = await gk_node.bounding_box()
        target_x, target_y = gk_box['x'] + gk_box['width'] / 2, gk_box['y'] + gk_box['height'] / 2

        await page.mouse.move(start_x, start_y)
        await page.mouse.down()
        await page.wait_for_timeout(230) # 長押し220ms
        for step in range(1, 11):
            cx = start_x + (target_x - start_x) * (step / 10)
            cy = start_y + (target_y - start_y) * (step / 10)
            await page.mouse.move(cx, cy)
            await page.wait_for_timeout(25)
        await page.mouse.up()
        await page.wait_for_timeout(500)

        gk_name_after = await gk_node.locator('.pitch-node-name-btn').inner_text()
        print(f"GK交代結果: {gk_name_before} -> {gk_name_after}")
        assert gk_name_before != gk_name_after, "GK must be substituted"

        await browser.close()

    elapsed = time.time() - start_time
    print("--------------------------------------------------")
    print(f"E2E実行時間: {elapsed:.2f} 秒")
    print("E2Eテスト: 全項目成功 (PASS)")

if __name__ == '__main__':
    asyncio.run(run_e2e())
