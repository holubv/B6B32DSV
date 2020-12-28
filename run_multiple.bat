@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

set NODE_IP_ADDRESS=127.0.0.1
set /A NUMBER_OF_INSTANCES=2
set /A START_PORT=8100

set /A max_instance_id=%NUMBER_OF_INSTANCES% - 1

for /l %%x in (0, 1, %max_instance_id%) do (
    set /A port=%START_PORT% + %%x
    echo %%x
    ::start cmd.exe /k "node ./app.js"
    echo "node ./app.js %NODE_IP_ADDRESS%:!port! %NODE_IP_ADDRESS%:%START_PORT%"
    timeout /t 1 /nobreak > NUL
)

ENDLOCAL