@echo off
title Habilitar Red (Desarrollo)
echo Pidiendo permisos de administrador para abrir puertos 3000 y 5173...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Permisos de administrador concedidos.
) else (
    echo [ERROR] Clic derecho en este archivo -^> "Ejecutar como administrador".
    pause
    exit
)

echo Abriendo puerto 3000 (Backend)...
netsh advfirewall firewall add rule name="Sistema POS (Backend)" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="Sistema POS (Backend)" dir=out action=allow protocol=TCP localport=3000 >nul 2>&1

echo Abriendo puerto 5173 (Frontend Vite)...
netsh advfirewall firewall add rule name="Sistema POS (Frontend)" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1
netsh advfirewall firewall add rule name="Sistema POS (Frontend)" dir=out action=allow protocol=TCP localport=5173 >nul 2>&1

echo ====================================================
echo  [EXITO] Puertos 3000 y 5173 abiertos correctamente.
echo  Puedes entrar desde el celular a: http://TU_IP:5173
echo ====================================================
pause
