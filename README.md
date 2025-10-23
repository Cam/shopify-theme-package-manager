# 🛠️ Shopify Theme Tools

A CLI utility and importer for syncing files from NPM packages into your Shopify theme folders. Designed to support modular theme development using reusable snippets, sections, templates, and assets.

---

## 🚀 Features

- Imports `.liquid`, `.js`, `.css`, `.svg`, `.png`, `.jpg`, `.json` from installed packages
- Routes `.liquid` files based on `{% doc %}` tags (`@snippet`, `@section`, etc.)
- Copies other files to `assets/`
- Skips unchanged files using smart caching
- CLI wrapper for easy setup in any theme project

---

## 📦 Installation

From your Shopify theme folder:

```bash
npm install --save-dev @cam/shopify-theme-tools
npx theme-tools
```

This will:
- Copy `import.mjs` to your project root
- Add import scripts to your `package.json`
- Create `.theme-import/` cache folder (if needed)

---

## 🛠 Usage

Import updated files:
```bash
npm run import
```

Clear cache and re-import everything:
```bash
npm run import:clear
```

Show usage instructions:
```bash
npm run import:help
```

---

## 🏷️ Liquid Tag Format

To route `.liquid` files correctly, include a `{% doc %}` block at the top:

```
{% doc %}
@snippet menu
{% enddoc %}
```

Supported tags:
- `@snippet name`
- `@section name`
- `@template name`
- `@layout name`

---

## 📁 Folder Structure

Imported files are routed to:

```
theme/
├── assets/          ← js, css, images, json
├── snippets/        ← liquid files with @snippet tag
├── sections/        ← liquid files with @section tag
├── templates/       ← liquid files with @template tag
├── layout/          ← liquid files with @layout tag
```

Cache is stored in:

```
.theme-import/
├── cache.json       ← file hashes
└── packages.json    ← package timestamps
```

---

## 🧪 Compatible Packages

To create packages that work with this importer, follow the [Theme-Compatible Package Authoring Spec](https://github.com/your-org/shopify-theme-tools/blob/main/PACKAGE_AUTHORING.md).

---

## 🧠 Why This Tool?

This utility makes it easy to:
- Reuse components across multiple themes
- Keep your base theme clean and modular
- Avoid manual copying and duplication
- Build a scalable ecosystem of theme packages

---

## 🧹 License

MIT