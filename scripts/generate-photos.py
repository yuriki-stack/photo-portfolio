from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]
IMG=ROOT/'images'
OUT=ROOT/'photos.json'
EXT={'.jpg','.jpeg','.png','.webp','.gif'}


def title_date(stem):
    m=re.match(r'^(\d{4})-(\d{2})-(\d{2})[-_](.+)$',stem)
    if not m:
        return stem.replace('-',' ').replace('_',' ').title(),''
    raw=m.group(4)
    raw=re.sub(r'(^|[-_])featured(?=[-_]|$)',' ',raw,flags=re.I)
    title=re.sub(r'\s+',' ',raw.replace('-',' ').replace('_',' ')).strip().title()
    return title,f'{m.group(1)}.{m.group(2)}.{m.group(3)}'


def tags_for(path):
    rel=path.relative_to(IMG)
    parts=list(rel.parts[:-1])
    stem=path.stem
    m=re.match(r'^\d{4}-\d{2}-\d{2}[-_](.+)$',stem)
    words=[]
    if m:
        words=re.split(r'[-_]+',m.group(1))
    tags=[]
    for value in parts+words:
        value=value.strip().lower()
        if not value or value=='featured' or value in tags:
            continue
        tags.append(value)
    return tags[:12]

photos=[]
for p in sorted(IMG.rglob('*')):
    if p.is_file() and p.suffix.lower() in EXT:
        rel=p.relative_to(ROOT).as_posix()
        parts=p.relative_to(IMG).parts
        cat=parts[0].title() if len(parts)>1 else 'Other'
        title,date=title_date(p.stem)
        featured=bool(re.search(r'(^|[-_])featured([-_]|$)',p.stem,re.I))
        photos.append({
            'image':rel,
            'title':title,
            'category':cat,
            'date':date,
            'location':'',
            'note':'',
            'tags':tags_for(p),
            'featured':featured,
            'alt':f'{title} — {cat} photograph'
        })

photos.sort(key=lambda x:x['date'],reverse=True)
OUT.write_text(json.dumps(photos,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(photos)} photos.')
