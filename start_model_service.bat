@echo off
echo Starting TrashNet Model Service...
cd /d "%~dp0"
python model_service.py
pause