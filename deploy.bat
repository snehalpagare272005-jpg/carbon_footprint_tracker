@echo off
echo ===================================================
echo   EcoTrackAI+ Automated Git Deployer
echo ===================================================
echo.

echo [1/4] Initializing Git repository...
git init

echo [2/4] Staging files...
git add .

echo [3/4] Committing changes...
git commit -m "feat: Add Explainable AI & Federated Carbon Optimization Platform"
git branch -M main

echo [4/4] Linking and Pushing to https://github.com/snehalpagare272005-jpg/carbon_footprint_tracker...
:: Remove existing origin if any
git remote remove origin 2>nul
git remote add origin https://github.com/snehalpagare272005-jpg/carbon_footprint_tracker.git
git push -u origin main

echo.
echo ===================================================
echo   Finished! Please check the repository on GitHub.
echo ===================================================
pause
