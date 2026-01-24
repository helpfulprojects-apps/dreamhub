# DreamHub (Education format: Markdown + PDF)

This project is a **static GitHub Pages** site.

## Where to add new worksheets (Markdown + PDF)

Pick a category folder, for example:

`education/categories/pre-k/`

Add 2 files:

1. Markdown:
`education/categories/pre-k/posts/<slug>.md`

2. PDF:
`education/categories/pre-k/pdf/<slug>.pdf`

Then update:
`education/categories/pre-k/posts/index.json`

(That file controls what shows as cards on the category page.)

## Add a new category (Grade 6 / Grade 7, etc.)

1. Create folder:
`education/categories/grade-6/`

Inside it create:
- `index.html` (copy from any other category folder)
- `posts/index.json`
- `posts/<slug>.md`
- `pdf/<slug>.pdf`

2. Add the category entry in:
`education/categories.json`