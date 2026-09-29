@echo off
title Valeon CM Engine Launcher
echo ============================================================
echo        Valeon CM Engine — Phase 1 Prototype Launcher
echo ============================================================
echo.

echo [1/3] Starting Mock MadeMarket CRM on port 3001...
start "Valeon - Mock CRM (3001)" cmd /k "cd /d %~dp0mock-crm && npm start"

timeout /t 2 >nul

echo [2/3] Starting AI Agents Service on port 3002...
start "Valeon - Agents Service (3002)" cmd /k "cd /d %~dp0agents && npm start"

timeout /t 2 >nul

echo [3/3] Starting Demo Dashboard on port 5173...
start "Valeon - Dashboard (5173)" cmd /k "cd /d %~dp0dashboard && npm run dev"

echo.
echo All services launched!
echo Open your browser at: http://localhost:5173
echo.
pause
