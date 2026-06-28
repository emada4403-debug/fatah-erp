@echo off
:: Navigate to the folder where the bat script is located
cd /d "%~dp0"
:: Launch the PowerShell WPF dashboard in a hidden window mode
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "control_panel.ps1"
