# YU PHOTOGRAPHY — Version 5.1

## いちばん簡単な写真追加方法

この版では、**写真を `images` フォルダに追加するだけ**でGalleryを更新できます。
`photos.json` はGitHub Actionsが自動生成します。手で編集する必要はありません。

### 1. 写真を入れる
おすすめはカテゴリーごとのフォルダです。

```text
images/
├── cat/
│   ├── 2026-09-06-sleepy-cat.jpg
│   └── 2026-09-07-window.jpg
├── nature/
│   └── 2026-09-08-sunset.jpg
└── travel/
    └── 2026-09-09-city.jpg
```

フォルダ名がカテゴリーになります。

- `cat` → Cat
- `nature` → Nature
- `travel` → Travel

### 2. ファイル名
日付を先頭に付けると、日付とタイトルを自動で作れます。

```text
2026-09-06-sleepy-cat.jpg
```

→ 日付: 2026.09.06
→ タイトル: Sleepy Cat

日付なしでも追加できます。その場合、日付は空欄になります。

### 3. GitHubへアップロード
新しい写真を `images` の中へアップロードしてCommitするだけです。

その後GitHub Actionsが自動で `photos.json` を更新します。
サイトはそのデータを読み込んでGalleryへ追加します。

## 重要

- `index.html` / `style.css` / `script.js` は普段触らなくてOKです。
- `photos.json` も普段は編集不要です。
- 写真を削除するとGalleryからも自動的に消えます。
- 対応形式: JPG / JPEG / PNG / WebP / GIF
- GitHub Pagesのサイト更新には数十秒〜数分かかることがあります。

## 現在の5枚
`images/cat/` に既存の5枚を入れています。

## Contact
`index.html` 内の `your-email@example.com` は自分のメールアドレスに変更してください。
