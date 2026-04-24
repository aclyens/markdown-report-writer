@echo off
:: install.bat — Install the markdown-report CLI locally on Windows (no Docker required)
::
:: Prerequisites:
::   - Node.js >= 18       https://nodejs.org/
::   - pandoc              https://pandoc.org/installing.html
::   - MiKTeX or TeX Live  https://miktex.org/ or https://tug.org/texlive/
::   - eisvogel pandoc template (PDF conversion only)
::     https://github.com/Wandmalfarbe/pandoc-latex-template

setlocal EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "REPO_DIR=%SCRIPT_DIR%.."

echo =^> Checking prerequisites...

:: ---------------------------------------------------------------------------
:: Node.js
:: ---------------------------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: node is not installed. Install Node.js ^>= 18 from https://nodejs.org/ and re-run. >&2
    exit /b 1
)

for /f "tokens=1 delims=." %%V in ('node -e "process.stdout.write(process.versions.node)"') do set "NODE_MAJOR=%%V"
if !NODE_MAJOR! lss 18 (
    for /f %%V in ('node --version') do set "NODE_VER=%%V"
    echo ERROR: Node.js ^>= 18 is required ^(found !NODE_VER!^). >&2
    exit /b 1
)
echo    Node.js !NODE_MAJOR! found.

:: ---------------------------------------------------------------------------
:: pandoc
:: ---------------------------------------------------------------------------
where pandoc >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo WARNING: pandoc is not installed. PDF and Confluence conversion will fail. >&2
    echo          Install it from https://pandoc.org/installing.html >&2
    echo          Or run: winget install --id JohnMacFarlane.Pandoc >&2
) else (
    for /f %%V in ('pandoc --version ^| findstr /r "^pandoc"') do echo    %%V found.
)

:: ---------------------------------------------------------------------------
:: xelatex
:: ---------------------------------------------------------------------------
where xelatex >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo WARNING: xelatex is not installed. PDF conversion will fail. >&2
    echo          Install MiKTeX from https://miktex.org/ >&2
    echo          Or TeX Live from https://tug.org/texlive/ >&2
) else (
    echo    xelatex found.
)

:: ---------------------------------------------------------------------------
:: eisvogel template
:: Pandoc looks for user templates in %APPDATA%\pandoc\templates\
:: ---------------------------------------------------------------------------
set "TEMPLATE_DIR=%APPDATA%\pandoc\templates"
set "TEMPLATE_FILE=%TEMPLATE_DIR%\eisvogel.latex"

if not exist "%TEMPLATE_FILE%" (
    echo WARNING: eisvogel pandoc template not found at "%TEMPLATE_FILE%". >&2
    echo          PDF conversion will fail without it. >&2
    echo          Attempting to download eisvogel v3.4.0... >&2

    where curl >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo ERROR: curl is not available. Download eisvogel manually: >&2
        echo        https://github.com/Wandmalfarbe/pandoc-latex-template/releases >&2
        echo        and place eisvogel.latex in "%TEMPLATE_DIR%" >&2
        goto :after_eisvogel
    )

    if not exist "%TEMPLATE_DIR%" mkdir "%TEMPLATE_DIR%"

    set "EISVOGEL_URL=https://github.com/Wandmalfarbe/pandoc-latex-template/releases/download/v3.4.0/Eisvogel-3.4.0.tar.gz"
    set "TEMP_ARCHIVE=%TEMP%\eisvogel.tar.gz"

    curl -L "!EISVOGEL_URL!" -o "!TEMP_ARCHIVE!"
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to download eisvogel template. >&2
        goto :after_eisvogel
    )

    :: tar is available in Windows 10 build 17063+
    where tar >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo ERROR: tar is not available. Extract "!TEMP_ARCHIVE!" manually >&2
        echo        and copy eisvogel.latex to "%TEMPLATE_DIR%" >&2
        goto :after_eisvogel
    )

    tar -xzf "!TEMP_ARCHIVE!" -C "%TEMP%"
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to extract eisvogel archive. >&2
        goto :after_eisvogel
    )

    copy /y "%TEMP%\Eisvogel-3.4.0\eisvogel.latex" "%TEMPLATE_FILE%" >nul
    if %ERRORLEVEL% equ 0 (
        echo    Installed eisvogel template to "%TEMPLATE_DIR%"
    ) else (
        echo ERROR: Failed to copy eisvogel.latex to "%TEMPLATE_DIR%". >&2
    )

    :: Clean up
    del /q "!TEMP_ARCHIVE!" >nul 2>&1
    rd /s /q "%TEMP%\Eisvogel-3.4.0" >nul 2>&1
) else (
    echo    eisvogel template found.
)
:after_eisvogel

:: ---------------------------------------------------------------------------
:: npm install + link
:: ---------------------------------------------------------------------------
echo =^> Installing npm dependencies...
pushd "%REPO_DIR%"
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed. >&2
    popd
    exit /b 1
)

echo =^> Linking CLI globally via npm...
call npm link
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm link failed. >&2
    popd
    exit /b 1
)
popd

echo.
echo Installation complete.
echo Run 'markdown-report --help' to get started.

endlocal
