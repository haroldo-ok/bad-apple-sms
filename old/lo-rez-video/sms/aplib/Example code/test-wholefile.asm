;==============================================================
; WLA-DX banking setup
;==============================================================
.memorymap
defaultslot 0
slotsize $4000
slot 0 $0000
slot 1 $4000
slot 2 $8000
slotsize $2000
slot 3 $c000
.endme

.rombankmap
bankstotal 2
banksize $4000
banks 2
.endro

;==============================================================
; SDSC tag and SMS rom header
;==============================================================
.sdsctag 0.1,"aPLib unpacker test 2","","Maxim"

.bank 0 slot 0
.org $0000

.include "..\aplib-z80.asm"

;==============================================================
; RAM
;==============================================================
.ramsection "Memory" slot 3
  DecompressedCode dsb $1ff0 - _sizeof_aPLibMemoryStruct
  aPLibMemory instanceof aPLibMemoryStruct
.ends

; aPLib decompression variables are stored at the top of RAM
; and the stub's stack is below them
; The decompressed program will probably reset the stack pointer anyway

;==============================================================
; Boot section
;==============================================================
.org $0000
.section "Bootstrap loader" force
  di        ; disable interrupts
  im 1      ; Interrupt mode 1

  ld sp,aPLibMemory ; stack will grow below this point

  ; Decompress and run
  ld hl,CompressedCode
  ld de,DecompressedCode
  call depack
  jp DecompressedCode
.ends

;==============================================================
; Pause button handler
;==============================================================
.org $0066
.section "Pause button handler" force
  ; Do nothing
  retn
.ends

;==============================================================
; Data
;==============================================================
.section "Data" FREE
  CompressedCode:
  .incbin "test-wholefile-code.compr.bin"

.ends

