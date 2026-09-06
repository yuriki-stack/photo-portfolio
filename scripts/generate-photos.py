from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = ROOT / 'images'
OUTPUT = ROOT / 'photos.json'
EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
DATE_RE = re.compile(r'^(\d{4})-(\d{2})-(\d{2})[-_](.+)$')


def clean_title(stem: str) -> tuple[str, str]:
    m = DATE_RE.match(stem)
    date = f'{m.group(1)}.{m.group(2)}.{m.group(3)}' if m else ''
    title = m.group(4) if m else stem
    title = re.sub(r'[_-]+', ' ', title).strip()
    title = re.sub(r'\s+', ' ', title)
    if title.isascii():
        title = title.title()
    return title or 'Untitled', date


def category_for(path: Path) -> str:
    rel_parent = path.parent.relative_to(IMAGE_ROOT)
    if str(rel_parent) in ('.', ''):
        return 'Photo'
    name = rel_parent.parts[0].replace('-', ' ').replace('_', ' ').strip()
    return name.title() if name.isascii() else name


def make_alt(title: str, category: str) -> str:
    return f'{title} — {category} photograph'

photos = []
for path in sorted(IMAGE_ROOT.rglob('*')):
    if not path.is_file() or path.suffix.lower() not in EXTS:
        continue
    title, date = clean_title(path.stem)
    category = category_for(path)
    rel = path.relative_to(ROOT).as_posix()
    photos.append({
        'image': rel,
        'title': title,
        'category': category,
        'date': date,
        'location': '',
        'note': '',
        'alt': make_alt(title, category),
    })

# Newest-dated work first; undated files remain after dated ones, alphabetically.
photos.sort(key=lambda p: (p['date'] == '', p['date'], p['title'].lower()), reverse=False)
# For dated photos, reverse chronological; keep undated alphabetically.
dated = [p for p in photos if p['date']]
undated = [p for p in photos if not p['date']]
dated.sort(key=lambda p: p['date'], reverse=True)
undated.sort(key=lambda p: p['title'].lower())
photos = dated + undated

OUTPUT.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Generated {OUTPUT} with {len(photos)} photos.')
