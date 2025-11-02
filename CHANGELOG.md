## [1.3.0] - 2025-11-02

### Added
- `stpm clean` command to remove duplicate STPM blocks from compiled assets
- Automatic formatting cleanup via `normalizeFileSpacing()` for CSS/JS outputs
- Duplicate block detection with warnings during clean
- Manifest-aware re-import logic for `updatePackage()` to skip prompts

### Changed
- `importBundledPackage()` now uses manifest data when available
- Rebuild logic now removes stale blocks before appending new ones
- All compiled outputs are normalized for spacing after updates and rebuilds

### Fixed
- Prevented duplicated STPM blocks in compiled files
- Resolved redundant line breaks in compiled assets

## [1.2.0] - 2025-11-02

### Changed
- Renamed `.stpm-imports.json` → `.stpm-packages.json` for clarity and consistency
- Improved STPM-native detection via mandatory `stpm.type` in `package.json`
- Added validation for native packages and fallback logic
- Warns if bundled packages contain STPM-like files but lack a declaration

## [1.1.1] - 2025-11-02

### Fixed
- Removed duplicate block bug when re-adding packages
- Hardened block removal logic for bundled CSS/JS
- Ensured consistent marker formatting across imports and removals