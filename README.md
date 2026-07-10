# 🖊️ Diagram Editor

A powerful, free, browser-based diagram editor built with vanilla HTML, CSS, and JavaScript. No backend, no database, no framework — just open and draw.

> **Created by [Nawaraj Poudel](https://github.com/nawarajpoudel)** · © 2026

---

## ✨ Features

### 🎨 Diagram Types
| Category | Types |
|---|---|
| **Database / ER** | ER Diagram (Chen Notation), ERD Diagram, Online Order System, Internet Sales Model |
| **UML** | Class, Use Case, Sequence, Activity, State, Component, Deployment, Package, Composite, Communication, Interaction Overview |
| **General** | Flowchart, DFD (Data Flow Diagram), Wireframe, Circuit Diagram, Logic Circuit Diagram |
| **Templates** | Pre-built examples for all major diagram types |

### 🔧 Editor Capabilities
- **27 diagram types** with dedicated shape toolboxes
- **Smart connectors** — orthogonal (right-angle) and straight line routing
- **Grid snapping** — components snap to a 20px grid for clean alignment
- **Zoom & Pan** — scroll to zoom, spacebar+drag or middle-click to pan
- **Properties panel** — edit labels, positions, and fields for any selected component
- **Context menu** — right-click to rename, duplicate, or delete
- **Undo** — Ctrl+Z with full history stack
- **Keyboard shortcuts** — arrow key nudging (Shift for pixel-precise), tool switching, and more
- **Export** — PNG image export and JSON save/load
- **Dark/Light theme** — automatic system-preference detection
- **Template protection** — warns before overwriting your work when switching diagram types

### ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Select tool | `S` |
| Wire/Connector tool | `W` |
| Undo | `Ctrl+Z` |
| Delete | `Delete` / `Backspace` |
| Move selected (grid) | `Arrow Keys` |
| Move selected (1px) | `Shift+Arrow Keys` |
| Pan canvas | `Space+Drag` |
| Zoom | `Scroll Wheel` |
| Toggle help | `?` |
| Close modal/cancel | `Escape` |

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- That's it. No Node.js, no npm, no build step.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/nawarajpoudel/diagram-editor.git
cd diagram-editor

# Option 1: Open directly
open index.html

# Option 2: Use a local server (recommended)
npx serve .
# or
python3 -m http.server 8080
```

### Project Structure

```
diagram-editor/
├── index.html          # Main application HTML
├── style.css           # All styles (CSS variables, dark/light themes)
├── script.js           # Core application logic (~2100 lines)
├── manifest.json       # PWA manifest
├── robots.txt          # Search engine directives
├── sitemap.xml         # Sitemap for SEO
├── assets/
│   ├── favicon.svg     # SVG favicon
│   ├── icon-192.png    # PWA icon (192x192)
│   └── icon-512.png    # PWA icon (512x512)
├── vercel.json         # Vercel deployment config
├── netlify.toml        # Netlify deployment config
├── _headers            # Cloudflare Pages headers
├── .github/
│   ├── workflows/
│   │   └── deploy.yml  # GitHub Actions (GitHub Pages)
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── LICENSE             # MIT License
├── CHANGELOG.md        # Version history
├── CONTRIBUTING.md     # Contributor guidelines
└── README.md           # This file
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Framework Preset: **Other**
5. Click **Deploy**

The `vercel.json` config is already included with security headers and caching.

### Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Connect your GitHub repository
3. Publish directory: `.` (root)
4. Click **Deploy site**

The `netlify.toml` config is already included.

### Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Connect to your Git repository
3. Build command: *(leave empty)*
4. Build output directory: `.`
5. Click **Save and Deploy**

The `_headers` file is already included for security headers.

### GitHub Pages

1. Go to your repository **Settings** → **Pages**
2. Source: **GitHub Actions**
3. The workflow at `.github/workflows/deploy.yml` will auto-deploy on push to `main`

### Custom Domain Setup

1. Add a `CNAME` record pointing to your hosting provider:
   - Vercel: `cname.vercel-dns.com`
   - Netlify: `your-site.netlify.app`
   - Cloudflare: automatic if using CF DNS
2. Add the domain in your hosting dashboard
3. HTTPS is handled automatically by all platforms above

---

## 🔒 Security

This is a frontend-only application — no user data leaves the browser.

- **No backend** — all data stays in the browser
- **No cookies** — no tracking
- **No analytics** — zero telemetry
- **Right-click disabled** — prevents accidental browser context menu
- **F12 disabled** — basic DevTools protection
- **Security headers** configured via deployment configs:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 (semantic) |
| **Styling** | Vanilla CSS (CSS custom properties, `prefers-color-scheme`) |
| **Logic** | Vanilla JavaScript (ES6+) |
| **Icons** | [Remix Icon](https://remixicon.com/) via CDN |
| **Canvas** | HTML5 Canvas 2D API |

**Zero dependencies. Zero build tools. Zero frameworks.**

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<p align="center">
  Built with ❤️ by <strong>Nawaraj Poudel</strong>
</p>
