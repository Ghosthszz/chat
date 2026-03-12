@echo off
title Configurador do Chat
color 0A

set SCRIPT_PATH=backend\src\public\js\script.js
set SERVER_PATH=backend\src\server.js

if not exist "%SCRIPT_PATH%" (
    echo ERRO: script.js nao encontrado
    pause
    exit
)

:menu
cls
echo ===============================
echo        CHAT ghosthszz_
echo ===============================
echo.
echo 1 - Conectar ao server principal
echo 2 - Mudar porta local
echo 3 - Iniciar app
echo 0 - Sair
echo.

set /p opcao=Escolha uma opcao: 

if "%opcao%"=="1" goto server
if "%opcao%"=="2" goto local
if "%opcao%"=="3" goto start
if "%opcao%"=="0" exit
goto menu


:server
echo.
echo Configurando para SERVER PRINCIPAL...

powershell -Command "(Get-Content '%SCRIPT_PATH%') -replace 'new WebSocket\(.*\)', 'new WebSocket(\"wss://chat-niha.onrender.com\")' | Set-Content '%SCRIPT_PATH%'"

echo.
echo Conectado ao server principal!
pause
goto menu


:local
echo.
set /p porta=Digite a porta local (ex: 8080): 

echo.
echo Configurando porta local %porta%...

powershell -Command "(Get-Content '%SCRIPT_PATH%') -replace 'new WebSocket\(.*\)', 'new WebSocket(\"http://localhost:%porta%\")' | Set-Content '%SCRIPT_PATH%'"

if exist "%SERVER_PATH%" (
powershell -Command "(Get-Content '%SERVER_PATH%') -replace 'const port = process.env.PORT \|\| [0-9]+;', 'const port = process.env.PORT || %porta%;' | Set-Content '%SERVER_PATH%'"
)

echo Porta configurada para %porta%
pause
goto menu


:start

echo.
echo Iniciando aplicacao...

REM Vai para pasta do bat
cd /d "%~dp0"

REM Extrai porta correta do server.js
for /f "tokens=6 delims= " %%a in ('findstr "process.env.PORT" "%SERVER_PATH%"') do set PORTA=%%a
set PORTA=%PORTA:;=%

echo Porta detectada: %PORTA%

REM Entra na pasta do servidor
cd backend/src

REM Inicia servidor minimizado
start "" /min cmd /k node server.js

REM Aguarda servidor subir
timeout /t 2 >nul

REM Abre no Chrome
start chrome http://localhost:%PORTA%

exit