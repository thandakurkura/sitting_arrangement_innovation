@echo off
title Lumora Exam Platform Server
echo ==============================================================
echo  Lumora x Starfield Autonomous Exam-Management Platform
echo  Starting local server at http://localhost:3000 ...
echo ==============================================================
start http://localhost:3000
node server.js
pause
