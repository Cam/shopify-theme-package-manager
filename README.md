# Shopify Theme Importer

Automatically imports supported files from installed NPM packages into your Shopify theme folders. Designed to streamline theme development by syncing assets and Liquid components from shared packages.

---

## Features

- Imports from all packages listed in `"dependencies"` (ignores `"devDependencies"`)
- Supports `.liquid`, `.js`, `.css`, `.svg`, `.png`, `.jpg`, `.json`
- Routes `.liquid` files based on doc tags (`@snippet`, `@section`, etc.)
- Copies all other files to `assets/`
- Skips unchanged files and packages using smart caching
- Excludes registry-specific files like `package.json`, `README.md`, etc.
- Supports cache clearing and usage help

---

## Folder Structure

Imported files are routed to:

theme/
├── assets/          ← js, css, images, json  
├── snippets/        ← liquid files with @snippet tag  
├── sections/        ← liquid files with @section tag  
├── templates/       ← liquid files with @template tag  
├── layout/          ← liquid files with @layout tag  

Cache is stored in:

.theme-import/
├── cache.json       ← file hashes  
└── packages.json    ← package timestamps  

---

## Setup

1. Clone the repository:

```
git clone https://github.com/cam/shopify-theme-builder.git
cd shopify-theme-builder
```

2. Install dependencies:

```
npm install
```

---

## Usage

Import updated files:
```
npm run import
```

Clear cache and re-import everything:
```
npm run import:clear
```

Show usage instructions:
```
npm run import:help
```

---

## Pacakage management

You can create and add your own packages to the registry.

### Liquid Tag Format

Liquid files use JSDoc-like formatting to specify additional details.

To route `.liquid` files correctly, include a Liquid doc block like:
```
{% doc %}
@snippet snippet-name
{% enddoc %}
```

In the above example this file would be routed to the /snippets folder of the theme.

---

## Cache Management

- File-level cache: skips unchanged files using SHA-1 hashes
- Package-level cache: skips packages that haven’t changed since last import

---

## Tip

Use `npm run import:clear` after updating packages to ensure all new files are synced.