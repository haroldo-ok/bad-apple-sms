;==============================================================
; WLA-DX banking setup (for code running entirely in RAM)
;==============================================================
.memorymap
defaultslot 0
slotsize $1800
slot 0 $c000
.endme

.rombankmap
bankstotal 1
banksize $1800
banks 1
.endro

.bank 0 slot 0
.org $0000
.include "Useful functions.inc"

;==============================================================
; Main program
;==============================================================
.orga $c000
.section "Main program" force
main:
  ld sp, $dff0

  call DefaultInitialiseVDP
  call ClearVRAM

  ; Load palette
  ld hl,PaletteData   ; data
  ld b,PaletteDataEnd-PaletteData ; size
  ld c,$00            ; index to load at
  call LoadPalette

  ; Load font
  ld hl,0             ; tile index to load at
  ld ix,FontData      ; data
  ld bc,96            ; number of tiles
  ld d,1              ; bits per pixel
  call LoadTiles

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
.section "Data" FREE
  PaletteData:
  .db $00,$3f ; Black, White
  PaletteDataEnd:

  FontData:
  .include "BBC Micro font (1bpp).inc"

  Message:
  .incbin "message2.txt"
  .db 0

.ends

