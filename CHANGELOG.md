## [1.2.0] - 2025-11-02

### Changed
- Renamed `.stpm-imports.json` → `.stpm-packages.json` for clarity and consistency
- Improved STPM-native detection via mandatory `stpm.type` in `package.json`
- Added validation for native packages and fallback logic
- Warns if bundled packages contain STPM-like files but lack a declaration