# Agent Instructions — markdown-report

Scripts for converting Markdown documents to **PDF** and **Confluence/Jira wiki** format using [pandoc](https://pandoc.org/).

## Project structure

| Path | Purpose |
|---|---|
| `markdown-to-pdf.bat` | Convert `.md` → `.pdf` via pandoc + xelatex + eisvogel |
| `markdown-to-confluence.bat` | Convert `.md` → `.txt` (Jira wiki markup) via pandoc |
| `lua/pdf-filter.lua` | Pandoc Lua filter: proportional table column widths, wraps tables in `\footnotesize` |
| `lua/confluence-filter.lua` | Pandoc Lua filter: strips header anchors and LaTeX raw blocks |

## Usage

Both scripts accept a single `.md` file as an argument and output to the same directory with the same base name:

```bat
markdown-to-pdf.bat report.md          REM → report.pdf
markdown-to-confluence.bat report.md   REM → report.txt (Jira wiki format)
```

## Dependencies

- **pandoc** — must be on `PATH`
- **xelatex** — required by `markdown-to-pdf.bat` (e.g. from MiKTeX or TeX Live)
- **eisvogel** — pandoc LaTeX template; must be installed in pandoc templates directory
- **PowerShell** — used for post-processing in `markdown-to-confluence.bat`

## Conventions

- Input format is always `markdown+raw_tex`, meaning LaTeX raw commands (e.g. `\newpage`) are supported in source Markdown.
- Raw LaTeX blocks are stripped by `confluence-filter.lua` so they don't appear as escaped text in Jira output.
- `pdf-filter.lua` computes proportional column widths based on the longest cell content per column, targeting `0.97` of line width (`TOTAL_WIDTH`).
- Both scripts validate that the input file exists and has a `.md` extension before invoking pandoc.
- Lua filter paths are resolved relative to the batch script location (`%~dp0lua\`), so scripts work regardless of the working directory.
- The Confluence post-processing step (PowerShell) removes `{anchor:...}` macros and adds blank lines around headings for clean Jira rendering.
