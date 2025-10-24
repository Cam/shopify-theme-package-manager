## Shopify Theme Tools TODO

---

#### Optional Enhancements
- [ ] Add a `--dry-run` flag to preview deletions
- [ ] Add a `--verbose` flag for detailed logs
- [ ] Add a `theme-tools status` command to show current imports

---

### Support CSS Concatenation on Filename Conflict

**Context:**  
Currently, when multiple packages include a file with the same name (e.g. `style.css`), the importer overwrites the existing file in `assets/`, causing loss of content. A warning has been added, but we should consider merging CSS files to preserve styles from all sources.

---

**Goal:**  
Concatenate `.css` files with the same name during import to avoid overwriting and preserve styles from all packages.

---

**Proposed Behavior:**

- If a `.css` file already exists at the destination path:
  - Read the existing file
  - Append the new content with a comment header:
    ```css
    /* --- Imported from @cam/menu --- */
    ```
  - Write the merged result back to the destination
  - Log a message like:
    ```
    ✅ Merged: @cam/menu/style.css → assets/
    ```

---

**Implementation Notes:**

- Modify `importFile()` in `fileOps.js`
- Add conditional logic for `.css` extension
- Use `fs.readFile()` and `fs.writeFile()` for merging
- Preserve formatting and add spacing between blocks
- Consider adding a config flag later (e.g. `--merge-css`) to toggle this behavior

---

**Future Considerations:**

- Extend support to `.js` or `.json` if needed
- Add conflict tracking to `.theme-tools-imports.json`
- Allow custom naming or namespacing to avoid collisions