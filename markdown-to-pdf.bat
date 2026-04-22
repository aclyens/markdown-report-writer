@echo off

REM Verify that an input file is provided
if "%~1"=="" (
    echo Usage: %~nx0 input-file.md
    exit /b 1
)

set inputFile=%~1
set inputFileName=%~n1

set luaFilterPath=%~dp0lua\pdf-filter.lua
if not exist "%luaFilterPath%" (
    echo Error: Lua filter "%luaFilterPath%" not found.
    exit /b 1
)

REM Verify input file exists and is a Markdown file
if not exist "%inputFile%" (
    echo Error: File "%inputFile%" not found.
    exit /b 1
)

if not "%~x1"==".md" (
    echo Error: File "%inputFile%" is not a Markdown file.
    exit /b 1
)

echo Converting "%inputFileName%" to PDF...

pandoc "%inputFileName%.md" -o "%inputFileName%.pdf" ^
    -f markdown+raw_tex -t pdf ^
    --pdf-engine=xelatex ^
    --template eisvogel ^
    --lua-filter=%luaFilterPath% ^
    --toc

echo Conversion complete. Output file: %inputFileName%.pdf
