import os
import re
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED_AUDIO_KEYS = [
    'bgm_title',
    'bgm_office',
    'amb_stadium',
    'sfx_whistle_short',
    'sfx_whistle_long',
    'sfx_kick',
    'sfx_goal_cheer',
    'sfx_crowd_groan',
    'sfx_crowd_boo',
    'sfx_applause',
    'ui_tap',
    'ui_confirm',
    'ui_cancel',
    'ui_page',
    'jingle_victory',
    'jingle_awaken',
    'sfx_deal',
    'sfx_notify',
    'sfx_alert',
]


class TestAudioSystem(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(ROOT_DIR, 'audio.js'), 'r', encoding='utf-8') as f:
            self.audio_js = f.read()
        with open(os.path.join(ROOT_DIR, 'index.html'), 'r', encoding='utf-8') as f:
            self.index_html = f.read()
        with open(os.path.join(ROOT_DIR, 'style.css'), 'r', encoding='utf-8') as f:
            self.style_css = f.read()
        with open(os.path.join(ROOT_DIR, 'storage.js'), 'r', encoding='utf-8') as f:
            self.storage_js = f.read()
        with open(os.path.join(ROOT_DIR, 'match-engine.js'), 'r', encoding='utf-8') as f:
            self.match_js = f.read()
        with open(os.path.join(ROOT_DIR, 'main.js'), 'r', encoding='utf-8') as f:
            self.main_js = f.read()

    def test_audio_assets_integrity(self):
        audio_dir = os.path.join(ROOT_DIR, 'assets', 'audio')
        self.assertTrue(os.path.isdir(audio_dir), 'assets/audio ディレクトリが存在しません')

        for key in EXPECTED_AUDIO_KEYS:
            file_path = os.path.join(audio_dir, f'{key}.mp3')
            self.assertTrue(os.path.isfile(file_path), f'{key}.mp3 が存在しません')
            size = os.path.getsize(file_path)
            self.assertGreater(size, 1024, f'{key}.mp3 のサイズが小さすぎます: {size}B')
            with open(file_path, 'rb') as af:
                header = af.read(4)
            self.assertGreaterEqual(len(header), 3)
            is_id3 = header[:3] == b'ID3'
            is_mpeg_frame = header[0] == 0xFF and (header[1] & 0xE0) == 0xE0
            self.assertTrue(
                is_id3 or is_mpeg_frame,
                f'{key}.mp3 の先頭バイトが有効なMP3ヘッダではありません: {header.hex()}'
            )

    def test_audio_js_structure(self):
        self.assertIn('const AUDIO_MANIFEST = {', self.audio_js)
        for key in EXPECTED_AUDIO_KEYS:
            self.assertIn(f'{key}:', self.audio_js)
            self.assertIn(f'assets/audio/{key}.mp3', self.audio_js)

        self.assertIn('const SoundEngine = (() => {', self.audio_js)
        for method in ['init', 'unlock', 'setScene', 'playSfx', 'syncFromSettings', 'getDebugState']:
            self.assertRegex(self.audio_js, rf'\b{method}\b')

        self.assertIn('visibilitychange', self.audio_js)
        self.assertIn('pagehide', self.audio_js)
        self.assertIn('isFastForwardingSeason', self.audio_js)

    def test_audio_low_latency_features(self):
        self.assertIn('decodeAudioData', self.audio_js)
        self.assertIn('createBufferSource', self.audio_js)
        self.assertIn("latencyHint: 'interactive'", self.audio_js)
        self.assertIn('trimStartSec', self.audio_js)
        self.assertIn("audio.preload = 'auto'", self.audio_js)
        self.assertNotIn("preload = def.loop ? 'auto' : 'metadata'", self.audio_js)
        self.assertRegex(
            self.audio_js,
            r"document\.addEventListener\('click',\s*\(e\)\s*=>\s*\{[\s\S]*?\},\s*true\);"
        )
        # 緊迫感・無遅延化に合わせたタイトなdelayMsと描画前再生の確認
        self.assertIn("SoundEngine.playSfx('sfx_whistle_short', { delayMs: 20 })", self.match_js)
        awaken_idx = self.main_js.find("SoundEngine.playSfx('jingle_awaken')")
        awaken_render_idx = self.main_js.find("renderAll();", awaken_idx - 120, awaken_idx + 120)
        self.assertGreater(awaken_render_idx, awaken_idx)

    def test_audio_mixer_and_cache_versioning(self):
        # Web Audio 共通ミキサー (Master / BGM / SE GainNode) と聴感カーブの確認
        for token in [
            'volumePercentToGain',
            'masterGainNode',
            'bgmChannelGainNode',
            'seChannelGainNode',
            'startWebAudioLoopNode',
        ]:
            self.assertIn(token, self.audio_js, f'audio.js に {token} が含まれていません')

        # storage.js が input/change 両イベントと SoundEngine.unlock() に連動すること
        self.assertIn("addEventListener('input', handleVolumeUpdate)", self.storage_js)
        self.assertIn("addEventListener('change', handleVolumeUpdate)", self.storage_js)
        self.assertIn('SoundEngine.unlock()', self.storage_js)

        # index.html の古いキャッシュバージョンが残っていないこと
        self.assertNotIn('storage.js?v=20261112_0400', self.index_html)
        self.assertNotIn('style.css?v=20261114_0100', self.index_html)
        for asset in ['style.css?v=20261119_0300', 'storage.js?v=20261119_0300', 'audio.js?v=20261119_0300', 'match-engine.js?v=20261119_0300', 'main.js?v=20261119_0300']:
            self.assertIn(asset, self.index_html)

    def test_index_html_and_css_settings_ui(self):
        storage_pos = self.index_html.find('src="storage.js')
        audio_pos = self.index_html.find('src="audio.js')
        main_pos = self.index_html.find('src="main.js')
        self.assertGreater(storage_pos, 0)
        self.assertGreater(audio_pos, storage_pos, 'audio.js は storage.js より後に読み込む必要があります')
        self.assertGreater(main_pos, audio_pos, 'main.js は audio.js より後に読み込む必要があります')

        for el_id in [
            'setting-sound-enabled',
            'setting-sound-enabled-label',
            'setting-sound-volume',
            'setting-sound-volume-val',
            'setting-bgm-volume',
            'setting-bgm-volume-val',
            'setting-se-volume',
            'setting-se-volume-val',
            'btn-test-sound-se',
        ]:
            self.assertIn(f'id="{el_id}"', self.index_html)

        header_match = re.search(r'<header class="status-header">.*?</header>', self.index_html, re.DOTALL)
        self.assertIsNotNone(header_match)
        header_html = header_match.group(0)
        self.assertNotIn('mute', header_html.lower())
        self.assertNotIn('sound', header_html.lower())

        settings_match = re.search(
            r'<div id="settings-modal-overlay".*?<div id="initial-staff-setup-modal"',
            self.index_html,
            re.DOTALL,
        )
        self.assertIsNotNone(settings_match)
        settings_html = settings_match.group(0)
        self.assertNotRegex(settings_html, r'[\U0001F300-\U0001FAFF\u2600-\u2714\u2716-\u27BF]')
        self.assertNotRegex(settings_html, r'\[(STEP|PRE-SEASON|AUDIO|SOUND|ON|OFF)\]')

        self.assertIn('.settings-volume-val', self.style_css)
        self.assertIn('.btn-settings-sound-test', self.style_css)

    def test_storage_js_persistence_and_scene_hooks(self):
        self.assertIn('soundEnabled: true', self.storage_js)
        self.assertIn('bgmVolume: 60', self.storage_js)
        self.assertIn('seVolume: 80', self.storage_js)
        self.assertIn('SoundEngine.syncFromSettings()', self.storage_js)
        self.assertIn("SoundEngine.setScene('title')", self.storage_js)
        self.assertIn("SoundEngine.setScene('office')", self.storage_js)

    def test_match_engine_and_main_hooks(self):
        for token in [
            "SoundEngine.setScene('prematch')",
            "SoundEngine.setScene('match')",
            "SoundEngine.setScene('office')",
            'sfx_goal_cheer',
            'sfx_crowd_groan',
            'sfx_whistle_short',
            'sfx_whistle_long',
            'jingle_victory',
            'isHighSpeed',
            'transitionToMatchSummary(true)',
        ]:
            self.assertIn(token, self.match_js, f'match-engine.js に {token} が含まれていません')

        for token in [
            'ui_page',
            'ui_confirm',
            'sfx_deal',
            'jingle_awaken',
            'sfx_alert',
            'sfx_notify',
            'jingle_victory',
        ]:
            self.assertIn(token, self.main_js, f'main.js に {token} が含まれていません')


if __name__ == '__main__':
    unittest.main()
