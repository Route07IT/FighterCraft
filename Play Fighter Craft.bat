@echo off
rem Opens Fighter Craft in its own window using Microsoft Edge (already installed on Windows).
rem If Edge is not found, it opens in your default browser instead.
set "GAME=%~dp0index.html"
start "" msedge "--app=file:///%GAME:\=/%" || start "" "%GAME%"
