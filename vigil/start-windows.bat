@echo off
setlocal
title Space Vigil
cd /d "%~dp0"

echo Space Vigil
echo ===========
echo.

where node >nul 2>nul
if errorlevel 1 goto no_node

for /f "delims=" %%v in ('node -v') do set NODE_VERSION=%%v

rem Vite needs Node 20.19 or newer on 20, or 22.12 or newer.
call node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)||(a===20&&b>=19)?0:1)"
if errorlevel 1 goto old_node

if exist "node_modules\vite\package.json" goto run

echo First run: installing the app's packages. This needs internet and takes a minute or two.
echo.
call npm install
if not "%errorlevel%"=="0" goto failed

:run
echo.
echo Starting Space Vigil. Your browser will open in a moment.
echo If it does not, open the address shown below (usually http://localhost:5173).
echo Keep this window open while you use the app. Close it, or press Ctrl+C, to stop.
echo.
call npm start
if not "%errorlevel%"=="0" goto failed
exit /b 0

:no_node
echo Node.js is not installed, and Space Vigil needs it to run on your computer.
echo.
echo 1. Go to https://nodejs.org and download the LTS version.
echo 2. Install it with the default options.
echo 3. Close this window and double-click start-windows.bat again.
echo.
echo Tip: you can also use the live version with nothing to install:
echo https://victor-andiazabal.github.io/victor-andiazabal/
goto end

:old_node
echo Your Node.js is too old (%NODE_VERSION%). Space Vigil needs version 20.19 or newer, or 22.12 or newer.
echo.
echo Go to https://nodejs.org, download the LTS version, install it,
echo then double-click start-windows.bat again.
goto end

:failed
echo.
echo Something went wrong. The messages above say what.
echo Common fixes: check your internet connection and run this file again.
echo If it keeps failing, delete the node_modules folder and try once more.

:end
echo.
pause
exit /b 1
