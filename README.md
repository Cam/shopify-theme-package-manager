# 🛠️ Shopify Theme Package Manager (stpm)

A CLI tool for importing, bundling, and managing modular packages in Shopify themes.

---

## 🚀 Features

- Detects and imports STPM-native packages (`sections/`, `snippets/`, etc.)
- Bundles standard NPM packages (CSS/JS) into `assets/` using PostCSS + esbuild
- Prompts for output filenames with smart defaults (`theme.css`, `theme.js`)
- Prevents duplicate imports with overwrite/reset options
- Tracks imports in `.stpm-packages.json` for clean removal

---

## 📦 Installation

From your Shopify theme folder:

```bash
npm install @cam/stpm --save-dev
```

---

## 🛠️ CLI Usage

Install a package:

```bash
stpm add @cam/css-reset
```

Remove a package:

```bash
stpm remove @cam/css-reset
```

Show help:

```bash
stpm --help
```

---

### 📁 Output

- Native files → `sections/`, `snippets/`, etc.
- Bundled assets → `assets/theme.css`, `assets/theme.js` (or custom)

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