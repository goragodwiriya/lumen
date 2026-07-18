# Lumen — Browser Image Editor

โปรแกรมแต่งรูปที่ทำงานในเบราว์เซอร์ทั้งหมด ไม่มีการอัปโหลดรูปขึ้นเซิร์ฟเวอร์ใดๆ
(รูปทั้งหมดอยู่ใน memory/canvas ของเบราว์เซอร์ผู้ใช้เท่านั้น — ดูข้อยกเว้นเรื่อง plugin/AI ในหัวข้อด้านล่าง)

**ความสามารถหลัก:** เปิดรูปจากไฟล์/URL/กล้อง/คลิปบอร์ด, วางรูปจากคลิปบอร์ดเป็นรูปใหม่หรือเป็น
layer ซ้อนบนรูปเดิม (ลากย้าย/ปรับขนาดได้), คัดลอกรูปทั้งภาพหรือเฉพาะเลเยอร์/พื้นที่ครอปที่เลือก
ไปยัง clipboard, ปรับแสง-สี (Adjust), Enhance ระดับพิกเซล
(Sharpen/Clarity/Texture/Noise/Smooth/Dehaze), ฟิลเตอร์สำเร็จรูป, Effects จริง (Pixelate, Mosaic,
Motion Blur, Glow, Vignette, Shadow), Crop แบบลาก/ปรับขนาด/ล็อกสัดส่วน, วาดอิสระ, ใส่ข้อความ
(รองรับ Google Fonts), ใส่รูปทรง (มีโหมดกรอบอย่างเดียว), วอเตอร์มาร์ค (ข้อความ/รูป), พื้นหลัง
(โปร่งใส/สีพื้น/ไล่สี/เบลอ), grid/ruler, undo-redo, export หลายฟอร์แมต (PNG/JPG/WebP/AVIF/PDF),
slice รูปเป็น 2/4/6/8 ส่วนเท่าๆ กันเป็น .zip, batch export เป็น .zip, และระบบ plugin สำหรับต่อ AI จริง

## การรัน

เป็น static site ใช้ ES modules จึงต้องเปิดผ่าน HTTP (ไม่ใช่ `file://`) เช่น

```bash
# ผ่าน Apache/htdocs ที่มีอยู่แล้ว หรือ
python3 -m http.server 8000   # แล้วเปิด http://localhost:8000
```

ต้องมีอินเทอร์เน็ตตอนโหลดหน้าเว็บ เพราะดึงจาก CDN สองจุด:
Google Fonts (`index.html` + ฟอนต์ที่เลือกใน Text panel, โหลดแบบ lazy) และ JSZip (สำหรับ Batch Export)
หากต้องใช้งานแบบ offline ทั้งหมด ให้ดาวน์โหลดไฟล์เหล่านี้มาเก็บไว้ในโปรเจ็คแล้วแก้ path เอง

## โครงสร้างโปรเจ็ค

```
lumen/
├── index.html              โครง HTML อย่างเดียว (ไม่มี CSS/JS ฝังใน)
├── css/
│   ├── base.css             reset + ตัวแปรธีม dark/light
│   ├── layout.css           โครงหน้า: topbar, workspace, toolbar, canvas, ruler, statusbar, responsive
│   └── components.css       วิดเจ็ตที่ใช้ซ้ำ: ปุ่ม, slider, swatch, toast, modal, ai-card ฯลฯ
└── js/
    ├── main.js              จุดเริ่มต้น — เรียก init ของทุกโมดูล UI ตามลำดับ
    ├── lib/
    │   ├── dom.js            $ / $$ query helpers
    │   └── utils.js          clamp, debounce, uid, formatBytes
    ├── config/
    │   ├── icons.js          SVG icons ทั้งหมด
    │   ├── tools.js          รายการเครื่องมือใน toolbar (ผูกกับ panels/index.js ด้วย id เดียวกัน)
    │   ├── filters.js        ฟิลเตอร์ preset ทั้งหมด (CSS filter strings)
    │   └── google-fonts.js   รายชื่อฟอนต์ระบบ + Google Fonts ที่เลือกใช้ได้ใน Text panel
    ├── core/                 ลอจิกหลัก — ห้าม import อะไรจาก js/ui/** (ดู "ทิศทาง import" ด้านล่าง)
    │   ├── state.js           state กลางของแอปตัวเดียว + ฟังก์ชัน default*() สำหรับรีเซ็ตแต่ละกลุ่ม
    │   ├── bus.js             pub/sub event bus เชื่อม core → ui แบบไม่ผูกกัน
    │   ├── engine.js          CanvasEngine: วาดภาพ+พื้นหลัง, overlay, grid, navigator, zoom/pan,
    │   │                      enhance/effects pixel pass, ผูก render pipeline ทั้งหมดเข้าด้วยกัน
    │   ├── pixel-fx.js        unsharp mask / box blur ระดับพิกเซล ใช้จริงโดย Enhance panel
    │   ├── overlay-geometry.js  hit-test / bounding box / ย้าย overlay (text, shape, path)
    │   ├── overlays.js        เลือก overlay + sync ค่ากับพาเนล (text/shape), สร้าง watermark overlay
    │   ├── history.js         undo/redo แบบ snapshot (ดูว่า field ไหนถูก track ในหัวข้อสถาปัตยกรรม)
    │   ├── loader.js          เปิดรูปจากไฟล์ / URL / clipboard / recent, รีเซ็ต state ต่อรูปใหม่
    │   ├── exporter.js        export เป็น PNG/JPG/WebP/AVIF/PDF (รูปเดียว)
    │   ├── slicer.js          แบ่งภาพ (main+overlay) เป็นตาราง 2/4/6/8 ส่วนเท่าๆ กัน → .zip
    │   ├── batch.js           รัน adjustments/filter/watermark/background ปัจจุบันกับหลายรูป → .zip
    │   ├── plugins.js         Plugin API สาธารณะ (window.Lumen.plugin) — แค่ registry เก็บ plugin
    │   └── plugin-runner.js   ตัวเรียกใช้งาน plugin จริง: composite ภาพ → ส่งให้ plugin → รับผลลัพธ์
    │                          กลับมาแทนที่รูปทำงาน (ดูหัวข้อ "Plugin API" และ "AI จริง" ด้านล่าง)
    └── ui/                    ui/** import จาก core/** และ ui/** ด้วยกันได้อย่างอิสระ
        ├── toolbar.js          toolbar ซ้าย + การสลับเครื่องมือ (โชว์/ซ่อน crop box ด้วย)
        ├── topbar.js           แถบบน, ปุ่ม canvas ลอย (grid/ruler/navigator/compare), ธีม, fullscreen
        ├── canvas-interactions.js  เมาส์/ทัช: pan (ลากเปล่าก็แพนได้), zoom, วาด, ลาก shape,
        │                          วางข้อความ, เลือก/ลาก overlay
        ├── crop-box.js         กล่อง crop แบบลาก/ปรับขนาดได้ (DOM overlay ในสัดส่วนพิกัด canvas)
        ├── rulers.js           ไม้บรรทัดพิกเซลบน/ซ้าย วาดใหม่ทุกครั้งที่ pan/zoom เปลี่ยน
        ├── keyboard.js         คีย์ลัดทั้งหมด (รวม nudge/duplicate/delete overlay ที่เลือก)
        ├── dragdrop.js         drag & drop + paste event
        ├── paste.js            เลือกวิธีวางรูปจากคลิปบอร์ด: แทนรูปเดิม หรือเพิ่มเป็น image layer
        ├── camera.js           ถ่ายรูปจากกล้อง
        ├── watermark-upload.js input แยกสำหรับอัปโหลดรูปลายน้ำ (ไม่ทับรูปหลัก)
        ├── batch-modal.js      โมดัล batch export
        ├── toast.js            แจ้งเตือน
        ├── modal.js            กล่องโต้ตอบ
        ├── panel-controller.js เรนเดอร์พาเนลขวาตามเครื่องมือที่เลือก, subscribe bus events ทั้งหมด
        ├── panel-bindings.js   ผูก event ให้ควบคุมในพาเนล (data-* driven — ดูหัวข้อ "เพิ่มพาเนลใหม่")
        ├── panel-actions.js    handler ของปุ่ม data-action ทั้งหมด
        └── panels/             มุมมองพาเนลขวา 15 ตัว (1 ไฟล์ต่อ 1 เครื่องมือ) — คืนแค่ HTML string
            ├── index.js         registry: tool id → render function
            ├── shared.js        snippet ที่ใช้ร่วม (slider, swatches)
            └── select.js, crop.js, adjust.js, enhance.js, filters.js,
                effects.js, text.js, shapes.js, draw.js, watermark.js,
                background.js, export.js, history.js, info.js, ai.js
```

## สถาปัตยกรรม / แนวทางการออกแบบ

### 1. State เดียว, render แบบ explicit

`core/state.js` มี object `State` ตัวเดียวเก็บทุกอย่าง (รูปที่เปิด, ค่าปรับแต่งทั้งหมด, overlay,
zoom/pan, ตั้งค่าเครื่องมือแต่ละอัน ฯลฯ) ไม่มี reactive framework — ทุกโมดูล **แก้ `State` ตรงๆ
แล้วเรียก `Engine.render()` หรือ `Engine.requestRender()` เอง** ไม่มี auto-diffing ให้พึ่งพา
เหตุผลที่เลือกแบบนี้: โปรเจ็คนี้เป็น canvas-based editor ที่ render cost ไม่สม่ำเสมอ (บาง state
เปลี่ยนแล้วแค่ redraw overlay canvas เร็วๆ, บาง state เปลี่ยนแล้วต้องรัน pixel pass เต็มที่ช้ากว่า)
การควบคุม "เมื่อไหร่จะ render อะไร" เองอย่างชัดเจนจึงคุมประสิทธิภาพได้ตรงจุดกว่า reactive system

`Engine.requestRender()` ใช้ `requestAnimationFrame` รวบ event ที่ยิงถี่ (เช่นลาก slider) ให้เหลือ
render แค่ครั้งเดียวต่อเฟรม — ใช้กับ input ที่เป็น live preview (Adjust/Enhance/Effects/Background
sliders) ส่วน `Engine.render()` แบบ sync ใช้ตอน commit ค่า (event `change` หรือ action ที่ต้องเห็นผล
ทันที เช่นก่อน `History.push()`) เพื่อการันตีว่าเฟรมที่บันทึกลง history ตรงกับค่าล่าสุดจริงๆ

### 2. ทิศทาง import ทางเดียว: `ui → core → config/lib`

`core/**` **ห้าม import อะไรจาก `ui/**` เด็ดขาด** เพื่อให้ core ทดสอบ/ใช้ซ้ำได้โดยไม่ต้องมี DOM
panel ใดๆ เมื่อ core ต้องการ "บอก" ui ว่ามีอะไรเปลี่ยน (เช่น undo แล้วพาเนลต้อง refresh, โหลดรูปใหม่
แล้วพาเนลต้อง refresh, มีคนเลือก overlay บน canvas แล้ว Text panel ต้องโหลดค่าล่าสุดมาโชว์) จะทำผ่าน
`core/bus.js` เท่านั้น (`bus.emit('event:name', payload)` ฝั่ง core, `bus.on(...)` ฝั่ง ui) —
event ที่มีอยู่ตอนนี้: `image:loaded`, `history:changed`, `overlay:selected`, `plugin:registered`,
`state:restored`, `view:changed` ทั้งหมด subscribe รวมอยู่ที่ `panel-controller.js` (ยกเว้น
`view:changed` ที่ `rulers.js` subscribe เองเพราะเป็นเรื่องเฉพาะของ ruler)

### 3. โมเดล multi-canvas: ทำไมต้องมีหลาย canvas ซ้อนกัน

ใน `#canvasStage` มี canvas 3 ชั้นซ้อนกัน แต่ละชั้นมีหน้าที่ต่างกันชัดเจนและ **ห้ามปนกัน**:

| canvas | หน้าที่ | ติดไปกับ export ไหม |
|---|---|---|
| `mainCanvas` (`Engine.canvas`) | รูปหลัก + background + filter/adjustments/enhance/effects ที่ bake ลงพิกเซลจริง | ✅ ใช่ |
| `overlayCanvas` (`Engine.overlay`) | text/shape/path/watermark — โครงสร้างข้อมูลแยก แก้ไขทีหลังได้ | ✅ ใช่ |
| `gridCanvas` (`Engine.grid`) | เส้น grid ช่วยจัดวาง | ❌ ไม่ (`Exporter`/`batch.js` อ่านแค่ 2 อันแรก) |

ไม้บรรทัด (`#rulerH`/`#rulerV`) เป็น canvas แยกอีกชั้นนอก `canvasStage` ไปเลย ไม่ได้อยู่ในสัดส่วน
พิกัดภาพด้วยซ้ำ (เป็น screen-space, คำนวณตำแหน่ง tick จาก `getBoundingClientRect()` ใหม่ทุกครั้งที่
pan/zoom เปลี่ยน ผ่าน event `view:changed`)

**การจัดกึ่งกลาง/ซูม/แพน**: `canvas-stage` ใช้ `position:absolute; left:50%; top:50%;` แล้วให้ JS
เติม `transform: translate(-50%,-50%) translate(pan) scale(zoom)` เอง (ดู `Engine.applyZoom()`) —
**อย่าเปลี่ยนกลับไปใช้ CSS `place-items:center`** เด็ดขาด เพราะจะกลับไปเจอบั๊กเดิม (grid centering
คำนวณตำแหน่งกลางผิดเมื่อ item ที่ยังไม่ได้ scale ใหญ่กว่า container มากๆ เช่นรูปแนวตั้งสูงๆ ก่อน
fit-to-screen จะ scale ลง) เทคนิค `left/top:50% + translate(-50%,-50%)` แม่นยำเสมอไม่ว่าขนาดรูปจะเป็น
เท่าไหร่ เพราะอิงจาก "ครึ่งหนึ่งของ element เอง" ไม่ใช่การเทียบขนาดกับ container

### 4. "Bake แล้วรีเซ็ต" — pattern สำหรับ operation ที่ทำลายพิกเซลเดิม

Crop, Resize, และผลลัพธ์จาก AI plugin ล้วนเป็น **destructive operation**: อ่านพิกเซลจาก
`Engine.canvas` ที่ ตอนนั้น ถูก bake ด้วย adjustments/filter/enhance/effects ปัจจุบันอยู่แล้ว
(เพราะ `ctx.filter` ถูกใช้ตอน draw จริง และ enhance/effects เป็น pixel pass ที่เขียนทับ canvas เลย)
มาสร้างเป็นรูปใหม่ (`State.image` ตัวใหม่) จากนั้น **ต้องรีเซ็ต** `State.adjustments` /
`State.enhance` / `State.effects` / `State.filter` กลับเป็นค่า default ทันที ไม่งั้นค่าที่ bake
ไปแล้วในพิกเซลจะถูกทับซ้ำอีกรอบตอน render ถัดไป (เช่น brightness 120% ที่ bake ไปแล้ว จะโดนคูณ
บวกอีกรอบถ้าไม่รีเซ็ต) โค้ดอ้างอิงรูปแบบนี้ได้จาก `applyCropNow()`/`applyResize()` ใน
`js/ui/panel-actions.js` และ `runPlugin()` ใน `js/core/plugin-runner.js`

### 5. พาเนลขวา: HTML string + attribute-driven binding

แต่ละไฟล์ใน `panels/*.js` export ฟังก์ชัน `render*()` ที่ **คืนแค่ HTML string** ไม่ผูก event เอง
— การผูก event ทำรวมศูนย์ที่ `panel-bindings.js` โดยอ่านจาก attribute มาตรฐาน ทำให้เพิ่มพาเนลใหม่
หรือ control ใหม่ในพาเนลเดิมได้โดยแทบไม่ต้องแตะโค้ด binding เลย ถ้าใช้ attribute ที่มีอยู่แล้ว:

| attribute | ความหมาย |
|---|---|
| `data-prop="x" data-group="adjustments"` | slider ที่ผูกกับ `State.adjustments.x` (มีกลุ่ม `adjustments`/`transform`/`enhance`/`effects` ผูกไว้แล้วใน `bindSliders()`) |
| `data-prop="x"` (ไม่มี `data-group`) | slider ที่ผูกกับ `State.x` ตรงๆ (เช่น `filterIntensity`, `drawSize`) |
| `data-action="name"` | ปุ่มที่ยิง `handleAction('name', panel)` ใน `panel-actions.js` |
| `data-aspect`, `data-filter`, `data-shape`, `data-draw-tool` | ปุ่มแบบเลือกหนึ่งจากหลายตัวเลือก (toggle active class ให้อัตโนมัติ) |
| `data-wm-prop`, `data-bg-prop`, `data-export-prop` | slider เฉพาะกลุ่ม watermark/background/export |

ถ้า control ใหม่ไม่เข้ากับ pattern ไหนเลย ค่อยเพิ่ม binding เฉพาะใน `panel-bindings.js` (มีตัวอย่าง
เช่น `bindTextControls()`, `bindShapeControls()` สำหรับ input ที่ไม่ใช่ slider ธรรมดา)

### 6. History เก็บอะไรบ้าง

`History.snapshot()`/`restore()` (`core/history.js`) เก็บเฉพาะ field ที่เป็น "ผลลัพธ์การแก้ไข"
จริงๆ: `adjustments`, `enhance`, `effects`, `filter`, `filterIntensity`, `transform`, `overlays`,
`background`, `watermark` — **ไม่เก็บ** field ที่เป็น ephemeral UI state เช่น `selectedOverlayId`,
`crop` (กล่อง crop ที่กำลังลากอยู่), `isDrawing`, `isPanning`, `zoom`/`pan`, `tool` ที่เลือกอยู่
เพราะ undo/redo ควรย้อน "การแก้ไขภาพ" ไม่ใช่ย้อน "สถานะ UI ชั่วคราว" — ถ้าเพิ่ม field ใหม่ใน
`State` ที่เป็นผลการแก้ไขภาพจริงๆ (ไม่ใช่ UI state) ต้องเพิ่มเข้า `snapshot()`/`restore()` ด้วย
ไม่งั้น undo/redo จะข้ามมันไปเงียบๆ

## เพิ่มเครื่องมือ/พาเนลใหม่

1. เพิ่ม entry ใน `js/config/tools.js` (id, name, icon, label, desc) — id นี้จะใช้ผูกกับทุกที่
2. สร้าง `js/ui/panels/<id>.js` export ฟังก์ชัน `render<Id>()` คืน HTML string โดยใช้ helper จาก
   `panels/shared.js` (`slider()`, `swatches()`) ให้ได้ binding ฟรีถ้าใช้ attribute มาตรฐาน
3. เพิ่มเข้า registry ใน `js/ui/panels/index.js` (`PANELS[id] = render<Id>`)
4. ถ้าต้องเก็บค่าเฉพาะเครื่องมือใหม่ ให้เพิ่มใน `State` (`core/state.js`) — ถ้าเป็นผลการแก้ไขภาพ
   (ไม่ใช่ UI state ชั่วคราว) อย่าลืมเพิ่มเข้า `History.snapshot()`/`restore()` ตามข้อ 6 ด้านบน
   และเพิ่มการรีเซ็ตใน `Loader.applyImage()` (`core/loader.js`) ให้ค่าเริ่มต้นใหม่ทุกครั้งที่เปิดรูปใหม่
5. ถ้าเครื่องมือใหม่ต้องวาดอะไรลง canvas จริง ให้เพิ่ม logic ใน `Engine.render()`
   (`core/engine.js`) — ถ้าเป็น pixel-level effect (ไม่ใช่แค่ CSS filter) ให้ทำเป็น method แยก
   เช่น `applyEffects()`/`applyEnhancePixels()` แล้วเรียกจาก `render()` ตามลำดับที่เหมาะสม

## Plugin API

`window.Lumen.plugin` เป็น registry สาธารณะ ใครก็ต่อ script เข้ามา register ได้โดยไม่ต้องแก้โค้ด
Lumen เลย (`js/core/plugins.js`):

```js
Lumen.plugin.register({
  name: 'remove-bg',                        // ต้องตรงกับ id การ์ดใน AI panel ถึงจะโชว์ "Connected"
  run: async (imageBlob, meta) => {
    // imageBlob: Blob (PNG) ของภาพที่กำลังแก้ไขอยู่ ณ ตอนนั้น (รวม adjustments/filter/
    //            enhance/effects/overlays ที่ bake ไว้แล้ว — คือสิ่งที่ผู้ใช้เห็นบนจอจริงๆ)
    // meta: { width, height, imageName }

    const resultBlob = await myAIModel(imageBlob);  // ทำอะไรก็ได้ตรงนี้ (ดูหัวขัดถัดไป)

    return resultBlob;   // คืน Blob → เอาไปแทนที่รูปทำงานทันที (bake + reset + push history)
    // return null/undefined ก็ได้ ถ้า plugin ไม่ได้แก้ pixel (เช่นแค่วิเคราะห์/แสดงข้อมูล)
  }
});
```

id การ์ดที่มีอยู่แล้วใน AI panel (`js/ui/panels/ai.js`): `enhance`, `upscale`, `remove-bg`,
`object`, `face`, `colorize`, `deblur`, `sky` — register ด้วย `name` ตรงกับตัวไหน การ์ดนั้นจะขึ้น
ป้าย **LIVE/Connected** ทันที (ไม่ต้อง reload หน้า — พาเนลฟัง event `plugin:registered` ผ่าน bus
แล้ว refresh ให้เอง) และคลิกแล้วจะเรียก `run()` จริง ไม่ใช่แค่โชว์ modal "Not Connected" อีกต่อไป

**สัญญา (contract) ของ `run()`:**
- รับ `(blob, meta)` ตามด้านบน ต้อง `async` หรือคืน `Promise`
- คืน `Blob` (หรือ `{ blob }`) → เอนจิ้นจะ decode เป็นรูปใหม่, เซ็ตเป็น `State.image`,
  รีเซ็ต adjustments/enhance/effects/filter (ตาม pattern "bake แล้วรีเซ็ต" ข้อ 4), fit-to-screen,
  แล้ว push เข้า History (undo ได้ปกติ)
- คืน `null`/`undefined` → เอนจิ้นจะไม่แตะรูปทำงาน (เผื่อ plugin แค่วิเคราะห์/แสดงผลข้างเคียง)
- โยน error (`throw`) → ปุ่มจะ toast ข้อความ error ออกมา ไม่ทำให้แอปพัง
- ระหว่างรัน การ์ดจะถูก disable + แสดง toast "Running…" ให้อัตโนมัติ (ดู `runAICard()` ใน
  `js/ui/panel-bindings.js`) — ไม่ต้องจัดการ loading state เองใน plugin

**ข้อจำกัดที่ควรรู้:**
- Plugin รันได้เฉพาะตอนแก้รูปเดียว (interactive) เท่านั้น **Batch Export ไม่เรียก plugin ให้**
  (ตั้งใจออกแบบแบบนี้ — batch ใช้ adjustments/filter/watermark/background ที่เป็น pure-function
  อยู่แล้วเท่านั้น เพื่อไม่ให้ผู้ใช้เผลอยิง API เรียกเก็บเงินซ้ำๆ กับรูปจำนวนมากโดยไม่รู้ตัว
  ถ้าต้องการ batch + AI จริงๆ ให้เรียก `runPlugin()` เองเป็น loop จากภายนอก ดูซอร์ส
  `js/core/plugin-runner.js` เป็นตัวอย่าง)
- `run()` ได้ภาพที่ *bake ทุกอย่างแล้ว* เท่านั้น ไม่มีทางเข้าถึง overlay object ดิบๆ
  (text/shape ที่ยังแก้ไขได้) — ถ้า AI ต้องรู้ตำแหน่ง overlay จริงๆ ต้อง import `State` เองจาก
  `core/state.js` ในสคริปต์ที่ register plugin (มันคือ ES module เดียวกับที่แอปใช้ ถ้าโหลดผ่าน
  `<script type="module">` ก็ `import { State } from './js/core/state.js'` ได้ตรงๆ)

## เชื่อมต่อ AI จริง (ไม่ใช่แค่ mock)

ตัวอย่างเต็มๆ สำหรับต่อ API ภายนอกจริง (เช่น background-removal API) วางเป็นไฟล์แยก แล้วใส่
`<script type="module" src="my-ai-plugins.js"></script>` ต่อท้าย `js/main.js` ใน `index.html`:

```js
// my-ai-plugins.js
Lumen.plugin.register({
  name: 'remove-bg',
  run: async (imageBlob, meta) => {
    const form = new FormData();
    form.append('image_file', imageBlob, meta.imageName + '.png');

    const res = await fetch('https://api.example.com/v1/remove-background', {
      method: 'POST',
      headers: { 'X-Api-Key': 'YOUR_API_KEY' },   // ดูคำเตือนเรื่อง API key ด้านล่าง!
      body: form
    });

    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return await res.blob();   // API ต้องตอบกลับเป็นรูปภาพตรงๆ (image/png ฯลฯ)
  }
});
```

**ข้อควรระวังเรื่องความปลอดภัย (สำคัญ):** โค้ดฝั่งหน้าเว็บ (client-side) ใครก็เปิด DevTools อ่านได้
ถ้าใส่ API key ตรงๆ แบบตัวอย่างข้างบน **คนอื่นขโมยคีย์ไปใช้ได้ทันที** ใช้ได้เฉพาะตอนพัฒนา/ทดสอบ
ส่วนตัวเท่านั้น สำหรับ production ควรทำ **thin backend proxy** แทน (เซิร์ฟเวอร์เล็กๆ ที่ถือ API key
ไว้ฝั่งเซิร์ฟเวอร์ รับ request จาก plugin แล้ว forward ไปเรียก AI API จริงแทน) แล้วให้ `fetch()`
ในตัวอย่างข้างบนยิงไปที่ backend ของตัวเองแทนที่จะยิงตรงไป API ผู้ให้บริการ

**ทดสอบโดยไม่มี API จริง (mock plugin สำหรับ dev):**

```js
// mock ที่ไม่พึ่ง network เลย — invert สี เพื่อพิสูจน์ว่า pipeline ทำงานถูกต้องก่อนต่อ API จริง
Lumen.plugin.register({
  name: 'colorize',
  run: async (blob) => {
    const img = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = reject;
      im.src = url;
    });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.filter = 'sepia(1) saturate(2)';   // แค่ตัวอย่าง ไม่ใช่ AI จริง
    ctx.drawImage(img, 0, 0);
    return new Promise(resolve => c.toBlob(resolve, 'image/png'));
  }
});
```

**เอนจิ้น/บริการที่เข้ากับ pattern นี้ได้เลย** (แค่ตัวอย่าง ไม่ใช่การรับรอง/สปอนเซอร์): บริการ
ลบพื้นหลังแบบ REST API ทั่วไป, บริการ upscale ผ่าน HTTP, หรือโมเดลที่รันในเบราว์เซอร์เอง (เช่น
ONNX Runtime Web / TensorFlow.js — กรณีนี้ `run()` ไม่ต้อง `fetch()` เลย รันโมเดลใน `run()` ตรงๆ
ได้ แต่ควรระวังเรื่อง bundle size และเวลาโหลดโมเดลครั้งแรก แนะนำให้โหลดโมเดลแบบ lazy ตอน
plugin ถูกเรียกใช้ครั้งแรก ไม่ใช่ตอน register)

## คีย์ลัด

| คีย์ | การทำงาน |
|---|---|
| `Ctrl+O` | เปิดรูป |
| `Ctrl+S` | ไปหน้า Export |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Ctrl+D` | ทำซ้ำ overlay ที่เลือก |
| `Ctrl+C` | คัดลอกไปยัง clipboard: พื้นที่ crop ที่กำลังเลือกอยู่ (ถ้าเปิด Crop tool) หรือเลเยอร์ที่เลือกอยู่ (ตัดพื้นหลังออก) หรือทั้งภาพ (main+overlay รวมกัน) — เลือกให้อัตโนมัติตามสิ่งที่กำลังเลือกอยู่ |
| `Ctrl+V` | วางรูปจาก clipboard (ถ้ามีรูปเปิดอยู่ จะถามว่าวางเป็นรูปใหม่หรือเป็น layer ใหม่) |
| ลูกศร / `Shift`+ลูกศร | ขยับ overlay ที่เลือก 1px / 10px |
| `+` / `-` / `0` / `1` | ซูมเข้า / ออก / พอดีจอ / 100% |
| `F` | เต็มจอ |
| `Delete` | ลบ overlay ที่เลือกอยู่ (ต้องเลือกก่อนด้วยเครื่องมือ Select) |
| ลากเปล่าด้วยเครื่องมือ Select | แพนภาพ (ไม่ต้องกดปุ่มเสริม) |
| `Shift/Alt` + ลาก, ลูกกลิ้งเมาส์ | แพน / ซูมภาพ (ใช้ได้ทุกเครื่องมือ) |

## ข้อจำกัดที่รู้อยู่แล้ว (ยังไม่ทำ)

- **Effects panel**: Motion Blur/Pixelate/Mosaic/Glow/Vignette/Shadow เป็น approximation ที่ทำงาน
  จริงบน canvas 2D (ไม่ใช่ WebGL) ไม่ใช่อัลกอริทึมระดับมืออาชีพ — Gaussian Blur ใช้ค่าเดียวกับ
  Adjust panel (`State.adjustments.blur`, ผ่าน CSS filter) เพื่อไม่ให้มี state ซ้ำซ้อนสองที่
- **Batch Export** ไม่รวม text/shape/draw overlay ที่วาดไว้เฉพาะรูปเดียว (ตั้งใจ — ดูหัวข้อ Plugin
  API ด้านบน) และไม่เรียก AI plugin ให้อัตโนมัติ
- **EXIF**: ยังไม่มีการอ่าน EXIF จริง (ปุ่ม "View EXIF Data" เป็น placeholder)
- Enhance/Effects เป็น pixel pass เต็มความละเอียดภาพ (ไม่มี downsampling) รูปที่ใหญ่มากๆ
  (หลายสิบ MP) อาจหน่วงเวลาสไลด์ — คลี่คลายบางส่วนด้วย `requestAnimationFrame` coalescing แล้ว
  (`Engine.requestRender()`) แต่ไม่ได้แก้ปัญหาที่ต้นตอ (ไม่มี Web Worker/WASM)
