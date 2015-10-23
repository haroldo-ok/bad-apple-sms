call "m:\My Documents\SMS\WLA DX\Compile.bat" test-wholefile-code.asm
@echo Trim output.sms now if you want
pause
..\apack.exe output.sms test-wholefile-code.compr.bin
call "m:\My Documents\SMS\WLA DX\Compile.bat" test-wholefile.asm
"m:\My Documents\SMS\Meka\mekaw.exe" "m:\My Documents\Code\SMS\aplib\Example code\output.sms"
