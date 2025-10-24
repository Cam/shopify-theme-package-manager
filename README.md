# 🛠️ Shopify Theme Tools (CLI)

A CLI utility for importing files from NPM packages directly into your Shopify theme folders. Designed for modular theme development using reusable snippets, sections, templates, and assets — with a streamlined, declarative workflow.

---

## 🚀 Features

- Installs and imports packages in one step with `theme-tools add`
- Imports `.liquid`, `.js`, `.css`, `.svg`, `.png`, `.jpg`, `.json` from installed packages
- Routes `.liquid` files based on `{% doc %}` tags (`@snippet`, `@section`, etc.)
- Copies other files to `assets/`
- Skips unchanged files using smart caching
- Tracks imports in `.theme-tools-imports.json`
- Warns on filename conflicts (e.g. duplicate `style.css`)
- CLI-first workflow with scoped resolution from your theme folder

---

## 📦 Installation

From your Shopify theme folder:

```bash
npm install @cam/shopify-theme-tools
```

Then run the CLI directly:

```bash
npx theme-tools add @cam/menu
```

---

## 🛠️ CLI Usage

Install and import one or more packages:

```bash
theme-tools add @cam/menu @cam/gallery @cam/footer
```

Re-import files from a package (without reinstalling):

```bash
theme-tools import @cam/menu
```

Force re-import (clears cache):

```bash
theme-tools import --force @cam/menu
```

Remove imported files from a package:

```bash
theme-tools clean @cam/menu
```

Remove all imported files:

```bash
theme-tools clean-all
```

Show help:

```bash
theme-tools --help
```

---

## 🏷️ Liquid Tag Format

To route `.liquid` files correctly, include a `{% doc %}` block at the top:

```liquid
{% doc %}
@snippet menu
{% enddoc %}
```

Supported tags:
- `@snippet name`
- `@section name`
- `@template name`
- `@layout name`

If no tag is found, the file will be skipped.

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

Import tracking is stored in:

```
.theme-tools-imports.json
```

---

## ⚠️ Filename Conflicts

If two packages include files with the same name (e.g. `style.css`), the second import will overwrite the first. The CLI will warn you when this happens.

> Future enhancement: support for automatic CSS merging or namespacing.

---

## 🧪 Compatible Packages

To create packages that work with this importer, follow the [Theme-Compatible Package Authoring Spec](https://github.com/your-org/shopify-theme-tools/blob/main/PACKAGE_AUTHORING.md).

---

## 🧠 Why This Tool?

This CLI makes it easy to:

- Reuse components across multiple themes
- Keep your base theme clean and modular
- Avoid manual copying and duplication
- Build a scalable ecosystem of theme packages
- Automate imports with precision and safety

---

## 🧹 License

MIT