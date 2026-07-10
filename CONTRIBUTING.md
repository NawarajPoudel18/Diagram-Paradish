# Contributing to Diagram Editor

Thank you for considering contributing! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Open `index.html` in a browser (or use a local server)
4. Make your changes

## Development Setup

No build tools required! This is a vanilla HTML/CSS/JS project.

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/diagram-editor.git
cd diagram-editor

# Serve locally (any of these work)
npx serve .
python3 -m http.server 8080
```

## Guidelines

### Code Style
- Use `const` / `let` (never `var`)
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions focused and small

### Adding New Diagram Types
1. Add entry to `DIAGRAM_TYPES` array in `script.js`
2. Add SVG icon to `SHAPE_SVGS`
3. Add readable name to `SHAPE_NAMES`
4. Implement drawing in `drawComp()`
5. Register connection points in `getPins()`
6. Define hit boundaries in `hitTest()`

### Adding New Components
Follow the same pattern as existing components. Each component needs:
- A unique type key (e.g., `my_shape`)
- SVG preview icon
- Canvas draw instructions
- Pin connection points
- Hit-test boundaries

### Commit Messages
Use clear, descriptive commit messages:
```
feat: add NAND gate to logic circuit diagram
fix: correct pin alignment on XOR gate
docs: update keyboard shortcuts in help modal
```

## Reporting Bugs

Open an issue with:
- Browser and OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Test in Chrome, Firefox, Safari, and Edge
4. Submit a PR with a clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
