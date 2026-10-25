@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd frontend
call npm install
call npm run build
