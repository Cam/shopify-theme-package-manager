# 🛠️ Shopify Theme Package Manager (stpm)

A CLI utility for importing files from NPM packages directly into your Shopify theme folders. Designed for modular theme development using reusable snippets, sections, templates, and assets — with a streamlined, declarative workflow.

---

## 🚀 Features

- Installs and imports packages in one step with `stpm add`
- Imports `.liquid`, `.js`, `.css`, `.svg`, `.png`, `.jpg`, `.json` from installed packages
- Routes `.liquid` files based on `{% doc %}` tags (`@snippet`, `@section`, etc.)
- Copies other files to `assets/`
- Skips unchanged files using smart caching
- Tracks imports in `.stpm-imports.json`
- Warns on filename conflicts (e.g. duplicate `style.css`)
- CLI-first workflow with scoped resolution from your theme folder

---

## 📦 Installation

From your Shopify theme folder:

```bash
npm install @cam/stpm
```

Then run the CLI directly:

```bash
npx stpm add @cam/menu
```

---

## 🛠️ CLI Usage

Install and import one or more packages:

```bash
stpm add @cam/menu @cam/gallery @cam/footer
```

Re-import files from a package (without reinstalling):

```bash
stpm import @cam/menu
```

Force re-import (clears cache):

```bash
stpm import --force @cam/menu
```

Remove imported files from a package:

```bash
stpm clean @cam/menu
```

Remove all imported files:

```bash
stpm clean-all
```

Show help:

```bash
stpm --help
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
.stpm-imports.json
```

---

## ⚠️ Filename Conflicts

If two packages include files with the same name (e.g. `style.css`), the second import will overwrite the first. The CLI will warn you when this happens.

> Future enhancement: support for automatic CSS merging or namespacing.

---

## 🧪 Compatible Packages

To create packages that work with this importer, follow the [Theme-Compatible Package Authoring Spec](https://github.com/cam/stpm/blob/main/PACKAGE_AUTHORING.md) or see the [Starter Package](https://github.com/Cam/starter-package).

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