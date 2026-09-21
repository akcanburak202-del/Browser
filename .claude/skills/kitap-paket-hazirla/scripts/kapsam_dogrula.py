#!/usr/bin/env python3
"""Kitap envanterinin çıktı bağlantılarını denetler; içerik doğruluğunu kanıtlamaz."""
import argparse
import json
from pathlib import Path


def validate(record, parts):
    errors, excluded = [], 0
    targets = {kind: set() for kind in ('not', 'kart', 'soru', 'terim')}

    def fail(message):
        errors.append(message)

    def text(value):
        return isinstance(value, str) and bool(value.strip())

    def objects(value, where):
        if not isinstance(value, list) or any(not isinstance(x, dict) for x in value):
            fail(f'{where}: nesne dizisi gerekli')
            return []
        return value

    for number, part in enumerate(parts, 1):
        if not isinstance(part, dict):
            fail(f'Parça {number}: nesne gerekli')
            continue
        for key, kind, field in [('notlar', 'not', 'baslik'), ('terimler', 'terim', 'terim')]:
            for item in objects(part.get(key, []), key):
                if text(item.get(field)):
                    targets[kind].add(item[field])
        for key, child, kind, field in [('desteler', 'kartlar', 'kart', 'on'), ('testler', 'sorular', 'soru', 's')]:
            for group in objects(part.get(key, []), key):
                for item in objects(group.get(child, []), child):
                    if text(item.get(field)):
                        targets[kind].add(item[field])

    if not isinstance(record, dict):
        return ['Kapsam kökü nesne olmalı'], 0
    if type(record.get('surum')) is not int or record['surum'] != 1:
        fail('surum: 1 gerekli')
    notes = record.get('notlarIstendi')
    if type(notes) is not bool:
        fail('notlarIstendi: boolean gerekli')
    selection = record.get('secimTalimatı', '')
    if not isinstance(selection, str):
        fail('secimTalimatı: metin gerekli')
    if notes is False and not text(selection):
        fail('Notları dışlamak açık secimTalimatı gerektirir')
    expected = record.get('beklenenSayfalar')
    if not isinstance(expected, list) or not expected or any(not text(x) for x in expected):
        fail('beklenenSayfalar: boş olmayan kimlik dizisi gerekli')
        expected = []
    if len(set(expected)) != len(expected):
        fail('beklenenSayfalar: yinelenen kimlik')
    pages = objects(record.get('sayfalar'), 'sayfalar')
    page_map, unit_ids = {}, set()
    for page in pages:
        pid = page.get('id')
        if not text(pid):
            fail('Sayfa kimliği eksik')
            continue
        if pid in page_map:
            fail(f'{pid}: yinelenen sayfa kimliği')
        page_map[pid] = page
    if set(expected) != set(page_map):
        fail('Beklenen sayfalar ile kayıtlı sayfalar eşleşmiyor')

    for page in pages:
        pid = page.get('id', '?')
        for field in ('dosya', 'sayfa'):
            if not text(page.get(field)):
                fail(f'{pid}: {field} gerekli')
        state = page.get('durum')
        if state not in ('okundu', 'kismi', 'erisilemedi', 'tekrar', 'icerik-yok'):
            fail(f'{pid}: geçersiz sayfa durumu')
        if state in ('kismi', 'erisilemedi', 'icerik-yok') and not text(page.get('gerekce')):
            fail(f'{pid}: gerekce gerekli')
        if state in ('kismi', 'erisilemedi'):
            fail(f'{pid}: tamamlanmamış kaynak ({state})')
        if state == 'tekrar':
            duplicate = page.get('tekrari')
            original = page_map.get(duplicate) if text(duplicate) else None
            if duplicate == pid or not original or original.get('durum') != 'okundu':
                fail(f'{pid}: tekrar gerçek bir okunmuş sayfaya bağlanmalı')
        units = objects(page.get('birimler', []), f'{pid}/birimler')
        if state == 'okundu' and not units:
            fail(f'{pid}: okunmuş sayfada bilgi birimi yok')
        if state in ('erisilemedi', 'icerik-yok') and units:
            fail(f'{pid}: sayfa durumu bilgi birimleriyle çelişiyor')
        for unit in units:
            uid = unit.get('id')
            if not text(uid):
                fail(f'{pid}: birim kimliği gerekli')
            elif uid in unit_ids:
                fail(f'{uid}: yinelenen birim kimliği')
            else:
                unit_ids.add(uid)
            for field in ('konum', 'bilgi'):
                if not text(unit.get(field)):
                    fail(f'{uid}: {field} gerekli')
            status = unit.get('durum')
            if status == 'aktarildi':
                links = objects(unit.get('hedefler'), f'{uid}/hedefler')
                if not links:
                    fail(f'{uid}: aktarım hedefi yok')
                if notes is True and not any(x.get('tur') == 'not' for x in links):
                    fail(f'{uid}: not hedefi yok')
                for link in links:
                    kind, value = link.get('tur'), link.get('metin')
                    if not text(kind) or kind not in targets or not text(value) or value not in targets[kind]:
                        fail(f'{uid}: çıktı hedefi bulunamadı')
                    if not text(link.get('bolum')):
                        fail(f'{uid}: hedef bolum gerekli')
            elif status in ('okunamadi', 'kapsam-disi'):
                if not text(unit.get('gerekce')):
                    fail(f'{uid}: gerekce gerekli')
                if status == 'okunamadi':
                    fail(f'{uid}: okunamayan bilgi var')
                else:
                    excluded += 1
                    if not text(selection):
                        fail(f'{uid}: kapsam dışı bilgi açık secimTalimatı gerektirir')
            else:
                fail(f'{uid}: geçersiz birim durumu')
    return errors, excluded


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kapsam', type=Path)
    parser.add_argument('parcalar', type=Path, nargs='+')
    args = parser.parse_args()
    try:
        record = json.loads(args.kapsam.read_text(encoding='utf-8'))
        parts = [json.loads(path.read_text(encoding='utf-8')) for path in args.parcalar]
        errors, excluded = validate(record, parts)
    except (OSError, ValueError) as exc:
        print(f'OKUMA HATASI: {exc}')
        return 1
    for error in errors:
        print(f'HATA: {error}')
    print(f'Kapsam bağlantıları: {"BAŞARISIZ" if errors else "GEÇTİ"}; kullanıcı seçimiyle dışarıda: {excluded}')
    print('Bu kontrol kaynak görüntüsünü ve bilginin notta tam korunduğunu doğrulamaz; kaynak karşılaştırması ayrıca gerekir.')
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
