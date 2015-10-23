SMS aPLib example programs
==========================

Some code testing and demonstrating stuff.

BBC Micro font (1bpp).inc
Useful functions.inc

  Some standard data - font and some base code.

test-data.asm

  Demonstration of unpacking data into RAM.

  message.txt       = uncompressed data
  message.compr.bin = compressed data
  test-data.sms     = assembled code, ready to run.

test-wholefile.asm

  Demonstration of compressing the entire program, similar to the concept of
  compressed executables and often used on systems where code always runs from
  RAM.

  test-wholefile-code.asm       = code. Notice the WLA DX setup for executing
                                  code in RAM. Also note that the compiled
                                  output won't run!
  message2.txt                  = message output by test-wholefile-code.asm,
                                  separated for ease of editing.
  test-wholefile-code.compr.bin = compressed compiled output from
                                  test-wholefile-code.asm. Note that I
                                  truncated the source file by removing all
                                  trailing zero bytes.
  make-wholefile.bat            = a batch file for making it, full of
                                  hard-coded paths :P
  test-wholefile.sms            = compiled output, ready to run

test-data-vram.asm

  Demonstration of unpacking data into VRAM. This is the most likely use for
  compression on Sega 8-bit systems.

  message3.txt              = message output, separated for ease of editing
                              (not compressed in this demo).
  BBC Micro font (4bpp).bin = VRAM data before compression. The 1bpp font has
                              been saved in binary format and padded to 4bpp so
                              it is in the VDP's tile format.
  BBC Micro font.compr.bin  = compressed version of "BBC Micro font (4bpp).bin".
  test-data-vram.sms        = compiled output, ready to run