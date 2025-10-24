## Shopify Theme Tools TODO

### 🧹 Cleanup Tools Plan

**Goal:**  
Enable `shopify-theme-tools` to automatically remove files imported from other npm packages when those packages are removed.

---

#### 1. Track Imports with a Manifest
- [ ] Create a manifest file in the theme root: `.theme-tools-imports.json`
- [ ] During each import, record:
  - Package name (e.g. `@cam/menu`)
  - List of imported file paths (e.g. `snippets/menu.liquid`, `assets/menu.css`)
- [ ] Ensure manifest updates are atomic and safe

---

#### 2. Add a Cleanup Command
- [ ] Add CLI command: `theme-tools clean @cam/menu`
- [ ] Read `.theme-tools-imports.json`
- [ ] Delete listed files for that package
- [ ] Remove package entry from manifest
- [ ] Log results clearly

---

#### 3. Add a Bulk Cleanup Option
- [ ] Add CLI command: `theme-tools clean-all`
- [ ] Compare manifest entries to current `package.json`
- [ ] Remove files from packages no longer installed
- [ ] Update manifest accordingly

---

#### 4. Test the Workflow
- [ ] Simulate importing files from a package
- [ ] Uninstall the package
- [ ] Run `theme-tools clean @cam/menu`
- [ ] Confirm files are removed and manifest is updated

---

#### Optional Enhancements
- [ ] Add a `--dry-run` flag to preview deletions
- [ ] Add a `--verbose` flag for detailed logs
- [ ] Add a `theme-tools status` command to show current imports