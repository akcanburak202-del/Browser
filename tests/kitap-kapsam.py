"""Kapsam kaybı, hatalı hedef ve eksik kaynak için regresyon kontrolleri."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / '.claude/skills/kitap-paket-hazirla/scripts/kapsam_dogrula.py'
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('kapsam', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.unit = {'id': 'p1-b1', 'konum': 'tablo ve dipnot', 'bilgi': 'A: 1 mm; yalnız 0–100 mm.',
                     'durum': 'aktarildi', 'hedefler': [{'tur': 'not', 'metin': 'Ölçüm', 'bolum': 'tablo'}]}
        self.page = {'id': 'p1', 'dosya': '1.jpg', 'sayfa': '10', 'durum': 'okundu', 'birimler': [self.unit]}
        self.record = {'surum': 1, 'notlarIstendi': True, 'secimTalimatı': '',
                       'beklenenSayfalar': ['p1'], 'sayfalar': [self.page]}
        self.parts = [{'notlar': [{'baslik': 'Ölçüm', 'icerik': 'A: 1 mm; yalnız 0–100 mm.'}],
                       'desteler': [{'kartlar': [{'on': 'A?', 'arka': '1 mm'}]}]}]

    def errors(self):
        return module.validate(self.record, self.parts)[0]

    def test_valid_links_and_cli(self):
        self.assertEqual(self.errors(), [])
        with tempfile.TemporaryDirectory() as tmp:
            paths = [Path(tmp)/'kapsam.json', Path(tmp)/'part.json']
            for path, data in zip(paths, [self.record, self.parts[0]]):
                path.write_text(json.dumps(data), encoding='utf-8')
            result = subprocess.run([sys.executable, str(SCRIPT), *map(str, paths)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn('kaynak görüntüsünü', result.stdout)
            paths[0].write_text('{', encoding='utf-8')
            result = subprocess.run([sys.executable, str(SCRIPT), *map(str, paths)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertNotIn('Traceback', result.stderr)

    def test_missing_source_page(self):
        self.record['beklenenSayfalar'].append('p2')
        self.assertTrue(self.errors())

    def test_duplicate_ids(self):
        for target in (self.record['beklenenSayfalar'], self.record['sayfalar'], self.page['birimler']):
            target.append(copy.deepcopy(target[0]))
            self.assertTrue(self.errors())
            target.pop()

    def test_deleted_note(self):
        self.parts[0]['notlar'] = []
        self.assertTrue(self.errors())

    def test_card_is_not_full_note_coverage(self):
        self.unit['hedefler'] = [{'tur': 'kart', 'metin': 'A?', 'bolum': 'cevap'}]
        self.assertTrue(self.errors())
        self.record['notlarIstendi'] = False
        self.assertTrue(self.errors())
        self.record['secimTalimatı'] = 'Yalnız kart istiyorum.'
        self.assertEqual(self.errors(), [])

    def test_unreadable_information_never_passes(self):
        self.unit.update(durum='okunamadi', gerekce='rakam silik')
        self.assertTrue(self.errors())
        self.unit['durum'] = 'aktarildi'
        for status in ('kismi', 'erisilemedi'):
            self.page.update(durum=status, gerekce='dosya eksik')
            self.assertTrue(self.errors())

    def test_exclusion_needs_explicit_selection_and_is_counted(self):
        self.unit.update(durum='kapsam-disi', gerekce='kullanıcı yalnız ilk tabloyu istedi')
        self.assertTrue(self.errors())
        self.record['secimTalimatı'] = 'Yalnız ilk tablo'
        self.assertEqual(module.validate(self.record, self.parts), ([], 1))

    def test_duplicate_page_points_to_read_original(self):
        duplicate = {'id': 'p2', 'dosya': '2.jpg', 'sayfa': '10', 'durum': 'tekrar', 'tekrari': 'p1'}
        self.record['sayfalar'].append(duplicate)
        self.record['beklenenSayfalar'].append('p2')
        self.assertEqual(self.errors(), [])
        for target in ('p2', 'missing', []):
            duplicate['tekrari'] = target
            self.assertTrue(self.errors())

    def test_empty_or_nonlearning_page_requires_explanation(self):
        self.page['birimler'] = []
        self.assertTrue(self.errors())
        self.page['durum'] = 'icerik-yok'
        self.assertTrue(self.errors())
        self.page['gerekce'] = 'Boş sayfa'
        self.assertEqual(self.errors(), [])

    def test_malformed_fields_fail_without_exception(self):
        for key, value in [('surum', True), ('notlarIstendi', 'yes'), ('beklenenSayfalar', [{}]), ('sayfalar', [None])]:
            altered = copy.deepcopy(self.record)
            altered[key] = value
            self.assertTrue(module.validate(altered, self.parts)[0])
        for key in ('tur', 'metin'):
            altered = copy.deepcopy(self.record)
            altered['sayfalar'][0]['birimler'][0]['hedefler'][0][key] = []
            self.assertTrue(module.validate(altered, self.parts)[0])
        self.assertTrue(module.validate(self.record, [{'notlar': {}}])[0])


if __name__ == '__main__':
    unittest.main()
