# snake-in-a-box README

A VS Code extension for Python that draws a colored box around each code block (`if`, `for`, `while`, `try`, `with`, etc.). Nested blocks get their own box, and each nesting level has its own color.

## Features

- Box and light background around every block, including its header line
- Colors are per nesting level, not per block type
- Optional boxes for `def` and `class`
- Configurable color palette

## Settings

| Setting | Default | Description |
|---|---|---|
| `blockBoxes.colors` | `["#4fc1ff", "#f14c4c", "#dcdcaa", "#4ec9b0", "#c586c0"]` | Border color per level (6-digit hex). Cycles when nesting is deeper than the list. |
| `blockBoxes.boxDefsAndClasses` | `false` | Also box `def`/`class` and count them as a level. |

## Usage

1. Open a `.py` file. Boxes appear automatically.
2. Customize colors in Settings (search "Block Boxes").

## Development

```bash
npm install
npm run compile
```

Press **F5** to launch the Extension Development Host.

## Known limitations

- Blocks are detected by indentation, so multi-line headers aren't supported.
- Works best with word wrap off.
