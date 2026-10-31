# Kairos44 Companion

A floating desktop window that shows the Kairos44 keyboard's layers, key types,
gestures and combos. Built with Tauri 2, SolidJS and Vite.

The full user manual is in [docs/index.md](docs/index.md). It is also inside the
app (Manual button or `F1`) and builds as a MkDocs site.

```sh
npm install
npm run dev:app       # native window with hot reload
npm run build:bin     # release binary: src-tauri/target/release/kairos44-companion
npm run check         # typecheck, frontend and Rust tests, cargo check
npm run docs:serve    # preview the manual as a website (needs requirements-docs.txt)
```

The project plan and a dated implementation log are in
[../docs/kairos44-companion-app.md](../docs/kairos44-companion-app.md).
