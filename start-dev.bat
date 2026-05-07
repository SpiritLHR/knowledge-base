@echo off
chcp 65001 >nul
cd /d "C:\Users\ASUS\Desktop\刘鸿儒的米奇妙妙屋"
set PATH=C:\Program Files\nodejs;%PATH%
echo 正在启动米奇妙妙屋...
echo 打开 http://localhost:4321/knowledge-base
echo 按 Ctrl+C 关闭
echo.
call npm run dev
pause
