@echo off
echo ========================================================
echo Installing MindBridge Dependencies...
echo ========================================================

echo.
echo Installing Backend Dependencies...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
if exist "requirements.txt" (
    pip install -r requirements.txt
) else (
    echo No requirements.txt found, skipping pip install.
)

echo.
echo Installing Frontend Dependencies...
call npm install

echo.
echo ========================================================
echo Installation Complete! 
echo You can now run start.bat to launch the application.
echo ========================================================
pause
