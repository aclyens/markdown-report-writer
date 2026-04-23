# Agent Instructions — markdown-report

CLI application and scripts for converting Markdown documents to **PDF** and **Confluence/Jira wiki** format using [pandoc](https://pandoc.org/).

See [README.md](README.md) for end-user usage.

## Project structure

| Path | Purpose |
|---|---|
| `bin/cli.js` | CLI entry point (`markdown-report` command via `commander`) |
| `src/pdf.js` | `convertToPdf(inputPath)` — calls pandoc with xelatex + eisvogel |
| `src/confluence.js` | `convertToConfluence(inputPath)` — calls pandoc, then post-processes output |
| `src/utils.js` | Shared helpers: `validate`, `assertFilter`, `runPandoc`, `run` |
| `lua/pdf-filter.lua` | Pandoc Lua filter: proportional table column widths, wraps tables in `\footnotesize` |
| `lua/confluence-filter.lua` | Pandoc Lua filter: strips header anchors and LaTeX raw blocks |
| `markdown-to-pdf.bat` | Legacy bat wrapper (no Node.js required) |
| `markdown-to-confluence.bat` | Legacy bat wrapper (no Node.js required) |
| `test/` | Node.js built-in test runner tests; fixtures at `test/fixtures/` |
| `Dockerfile` | Container image — `pandoc/extra` base with Node.js added |

## Build & test commands

```sh
npm install          # install dependencies (commander, node-pandoc)
npm test             # run all tests via Node.js built-in runner (node --test)
```

Tests are integration tests that call pandoc directly — they require `pandoc`, `xelatex`, and the `eisvogel` template to be installed. Each test cleans up its own output file before running.

## CLI usage

```sh
markdown-report pdf report.md         # → report.pdf (same directory)
markdown-report confluence report.md  # → report.txt (same directory)
```

The package exposes `convertToPdf` and `convertToConfluence` from `index.js` for programmatic use.

## Docker

```sh
docker build -t markdown-report .
docker run --rm -v "$(pwd):/data" markdown-report pdf /data/report.md
```

To run tests inside Docker (useful when pandoc/xelatex/eisvogel are not installed locally):

```sh
docker run --rm -v "$(pwd):/app" --entrypoint node markdown-report --test
```

The image is based on `pandoc/extra` (includes pandoc, TeX Live, eisvogel); Node.js is added via `apk`.

## Dependencies (host / non-Docker)

- **pandoc** — must be on `PATH`
- **xelatex** — from MiKTeX or TeX Live (PDF only)
- **eisvogel** — pandoc LaTeX template in pandoc templates directory (PDF only)
- **Node.js** — for the CLI and tests

## Conventions

- Input format is always `markdown+raw_tex` — LaTeX raw commands (e.g. `\newpage`) are supported in Markdown source.
- Both converters call `validate()` (checks file exists and has `.md` extension) and `assertFilter()` before invoking pandoc.
- `runPandoc` in `src/utils.js` spawns pandoc asynchronously and rejects on non-zero exit, capturing stderr for error messages.
- Confluence post-processing (applied in JS and in the bat script): strips `{anchor:...}` macros, adds blank lines around Jira headings (`h1.`–`h6.`).
- `pdf-filter.lua` computes proportional column widths (target `0.97` of line width via `TOTAL_WIDTH`) based on the longest cell content per column.
- `confluence-filter.lua` clears header identifiers and removes all raw blocks so LaTeX commands don't leak into Jira output.
- Lua filter paths are resolved relative to the source file's location (`__dirname`) in JS, and relative to the bat script (`%~dp0lua\`) in bat files.
- The project uses ESM (`"type": "module"`) throughout; use `import`/`export`, not `require`.
