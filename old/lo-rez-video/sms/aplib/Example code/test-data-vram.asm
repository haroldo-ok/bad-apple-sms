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
.sdsctag 0.1,"aPLib unpacker test 3","","Maxim"

.bank 0 slot 0
.org $0000
.include "Useful functions.inc"
.include "..\aplib-z80.asm"

;==============================================================
; RAM
;==============================================================
.ramsection "Memory" slot 3
  aPLibMemory instanceof aPLibMemoryStruct
  data: dsb 1024
.ends

;==============================================================
; Boot section
;==============================================================
.org $0000
.section "Boot section" force
  di        ; disable interrupts
  im 1      ; Interrupt mode 1
  jp main   ; jump to main program
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
; Main program
;==============================================================
.section "Main program" free
main:
  ld sp, $dff0

  call DefaultInitialiseVDP
  call ClearVRAM

  ; Load palette
  ld hl,PaletteData   ; data
  ld b,PaletteDataEnd-PaletteData ; size
  ld c,$00            ; index to load at
  call LoadPalette

  ;==============================================================
  ; Decompress font to VRAM
  ;==============================================================
  ld hl,FontData
  ld de,0
  call vram_depack

  ;==============================================================
  ; Write text to name table
  ;==============================================================
  ld hl,Message
  ld iy,NameTableAddress
  call WriteASCII

  ; Turn screen on
  ld a,%11000100
;       ||||| |`- Zoomed sprites -> 16x16 pixels
;       ||||| `-- Doubled sprites -> 2 tiles per sprite, 8x16
;       ||||`---- 30 row/240 line mode
;       |||`----- 28 row/224 line mode
;       ||`------ VBlank interrupts
;       |`------- Enable display
;       `-------- Must be set (VRAM size bit)
  out ($bf),a
  ld a,$81
  out ($bf),a

-:jp -

.ends

;==============================================================
; Data
;==============================================================
.bank 1 slot 1
.orga $7800
.section "Data" FORCE
  PaletteData:
  .db $00,$3f ; Black, White
  PaletteDataEnd:

  Message:
  .incbin "message3.txt"
  .db 0

  FontData:
  .incbin "BBC Micro font.compr.bin"
;  .incbin "test data.compr.bin"
.ends

