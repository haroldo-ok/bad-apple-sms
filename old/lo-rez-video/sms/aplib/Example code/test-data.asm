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
.sdsctag 0.2,"aPLib unpacker test 1","","Maxim"

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

  ; Load font
  ld hl,0             ; tile index to load at
  ld ix,FontData      ; data
  ld bc,96            ; number of tiles
  ld d,1              ; bits per pixel
  call LoadTiles

  ; initialise data
  ld a,$00
  ld b,32
  ld hl,data
  ldir

  ;==============================================================
  ; Write text to name table
  ;==============================================================
  ld hl,Message
  ld iy,NameTableAddress
  call WriteASCII

  ;==============================================================
  ; Decompress text
  ;==============================================================
  ld hl,ComprData
  ld de,data
  call depack

  ;==============================================================
  ; Write decompressed text to name table
  ;==============================================================
  ld hl,data
  ld iy,NameTableAddress+32*2*4
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
  .db "Decompressed data:",0

  ComprData:
  .incbin "message.compr.bin"
.ends

