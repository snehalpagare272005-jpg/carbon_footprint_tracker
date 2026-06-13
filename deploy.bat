@echo off
echo ===================================================
echo   EcoTrackAI+ Smart GitHub Deployer
echo ===================================================
echo.

:: Check if git is already initialized
if exist ".git" (
    echo [INFO] Git repository already initialized. Skipping git init.
) else (
    echo [1/4] Initializing Git repository...
    git init
    git branch -M main
)

echo [2/4] Staging all latest changes...
git add .

echo [3/4] Committing latest UI improvements...
git commit -m "feat: Premium sidebar navigation, theme switcher, lifestyle presets & recommendation filters"

echo [4/4] Linking remote and pushing to GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/snehalpagare272005-jpg/carbon_footprint_tracker.git
git push -u origin main --force

echo.
echo ===================================================
echo   SUCCESS! Your code is now on GitHub.
echo.
echo   GitHub Actions is now building and deploying...
echo   Live site will be at:
echo   https://snehalpagare272005-jpg.github.io/carbon_footprint_tracker/
echo ===================================================
pause
