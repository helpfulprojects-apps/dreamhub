
# DreamHub authoring guide (simple)

## 1) Add a PDF (recommended)
Write in Word → Export as **PDF** → upload to GitHub.

### Education PDFs
- Pre-K: `assets/docs/education/prek/`
- Grade 1: `assets/docs/education/grade1/`

### Blog PDFs
- `assets/docs/blog/`

## 2) Add a new worksheet card (Pre-K)
1. Copy an existing worksheet page:
   - `grades/prek/worksheets/tracing-letters.html`
2. Rename it (example): `grades/prek/worksheets/my-new-worksheet.html`
3. Edit:
   - Title
   - The iframe `src` PDF path

4. Add a new card link in:
   - `grades/prek/index.html`

## 3) Add a new grade
1. Copy folder `grades/grade1/` → rename to `grades/grade2/`
2. Update internal links inside new grade files (replace `grade1` with `grade2`)
3. Add a new grade card in:
   - `education/grades/index.html`

## Important note about “no download”
Websites cannot fully prevent users from saving or copying PDFs. We can hide toolbars (`#toolbar=0`), but a determined user can still save screenshots or fetch the file.
