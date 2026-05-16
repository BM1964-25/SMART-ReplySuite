# App Icons

This folder contains the desktop icon assets used by Electron packaging.

- `icon.png`: cross-platform 1024 x 1024 master icon for Linux and Electron development.
- `icon.ico`: Windows icon for the `.exe`, installer, Start menu and taskbar.
- `icon.icns`: macOS icon for the `.app`, Dock and DMG/ZIP packages.
- `icon.iconset/`: macOS iconset source for generating `icon.icns`.

To regenerate the Windows icon after changing the master icon:

```sh
npm run icon:ico
```

To regenerate the macOS icon after changing the master icon:

```sh
npm run icon:icns
```
