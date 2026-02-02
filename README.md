# DreamHub (GitHub Pages)

## 1) Upload fresh
Delete everything in your repo, then upload the contents of this zip to the **repo root**.

## 2) Turn on GitHub Pages
GitHub repo → **Settings** → **Pages**
- Source: Deploy from a branch
- Branch: `main` and folder `/ (root)`

Your site will be:
`https://<yourUser>.github.io/dreamhub/`

## 3) Important: repo name
This project assumes your repo name is **dreamhub** (so links start with `/dreamhub/...`).

If your repo name is different:
- Edit `assets/js/config.js` → set `BASE_PATH` to `"/<repoName>"`

## Add Education content (Markdown + PDF)
Example (Pre-K):
1. Add files:
   - `education/categories/pre-k/content/my-worksheet.md`
   - `education/categories/pre-k/content/my-worksheet.pdf`
2. Add an entry in:
   - `education/categories/pre-k/items.json`

The `id` must match the filename (without extension).

## Add a new category (Grade 6 / Grade 7)
1. Copy a folder:
   - copy `education/categories/grade-5` → `education/categories/grade-6`
2. Update:
   - `education/categories/grade-6/meta.json`
   - `education/categories/grade-6/items.json`
3. Add one new card on:
   - `education/grades.html`

## Blog and Recipes
Same idea:
- Blog list: `blog/items.json`, content: `blog/content/<id>.md` (+ optional PDF)
- Recipes list: `recipes/items.json`, content: `recipes/content/<id>.md` (+ optional PDF)
