@echo off
setlocal enabledelayedexpansion

REM Change this to your root folder path
cd /d "C:\Path\To\Your\VideoFolders"

for /r %%f in (*.mp4) do (
    echo Processing: %%~nxf
    ffmpeg -i "%%f" -c copy -an "%%~dpn_f_muted.mp4"
)
echo All videos processed.
pause
