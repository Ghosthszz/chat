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
echo 1 - Iniciar app
echo 2 - Mudar porta local
echo 3 - Conectar ao server principal
echo 4 - Instalar Node.js e dependencias
echo 0 - Sair
echo.

set /p opcao=Escolha uma opcao: 

if "%opcao%"=="3" goto server
if "%opcao%"=="2" goto local
if "%opcao%"=="1" goto start
if "%opcao%"=="4" goto installall
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


:installall
cls
echo ==========================================
echo  INSTALACAO AUTOMATICA
echo ==========================================
echo Este processo ira:
echo - Instalar o Node.js (caso nao exista)
echo - Instalar as dependencias do projeto
echo.
echo O instalador do Node sera aberto.
echo.
pause

REM Verifica se Node.js existe
node -v >nul 2>&1
if errorlevel 1 (
    echo Node.js nao encontrado.
    echo Baixando instalador oficial...

    powershell -Command "Invoke-WebRequest https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi -OutFile node_installer.msi"

    echo.
    echo Abrindo instalador do Node.js...
    start node_installer.msi

    echo.
    echo Finalize a instalacao do Node.js.
    echo Depois DISSO, feche e abra este arquivo novamente.
    pause
    goto menu
)

echo Node.js encontrado!
echo.

cd /d "%~dp0"

echo Instalando dependencias...
npm install

echo.
echo Instalacao concluida com sucesso!
pause
goto menu


:start
echo.

REM Verifica se Node.js esta instalado
node -v >nul 2>&1
if errorlevel 1 (
    echo =====================================
    echo ERRO: Node.js nao esta instalado.
    echo.
    echo Use a opcao 4 para instalar automaticamente.
    echo =====================================
    pause
    goto menu
)

echo Node.js encontrado!
echo.
echo Iniciando aplicacao...

cd /d "%~dp0"

REM Extrai porta correta do server.js
for /f "tokens=6 delims= " %%a in ('findstr "process.env.PORT" "%SERVER_PATH%"') do set PORTA=%%a
set PORTA=%PORTA:;=%

echo Porta detectada: %PORTA%

cd backend/src

start "" /min cmd /k node server.js

timeout /t 2 >nul

start chrome http://localhost:%PORTA%

exit
