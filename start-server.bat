@echo off
cd /d "%~dp0"
echo Starting RuleMCP Server...
node dist/index.js
pause 