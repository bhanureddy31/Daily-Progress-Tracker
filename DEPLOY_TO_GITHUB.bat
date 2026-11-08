@echo off
title Push Daily-Progress-Tracker to GitHub
echo ====================================================================
echo  Pushing Daily Progress Tracker to https://github.com/bhanureddy31
echo ====================================================================
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ====================================================================
    echo  SUCCESS! Your files are uploaded to GitHub!
    echo.
    echo  Now go to:
    echo  https://github.com/bhanureddy31/Daily-Progress-Tracker/settings/pages
    echo  Select branch "main" -> /(root) -> Save.
    echo.
    echo  Your site will be live at:
    echo  https://bhanureddy31.github.io/Daily-Progress-Tracker/
    echo ====================================================================
) else (
    echo ====================================================================
    echo  Push failed.
    echo  Please ensure you created the repository first at:
    echo  https://github.com/new (Name: Daily-Progress-Tracker)
    echo ====================================================================
)
echo.
pause
