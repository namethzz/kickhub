# Kickhub — football starts with people

แอพหาเพื่อนเตะบอลและค้นหาสนาม สำหรับผู้เล่น (`user`) และเจ้าของสนาม (`owner`)

## Step 1: Frontend discovery redesign

ปรับ `/`, `/home`, `/team`, `/field` และ navigation ใหม่ โทนเขียวเข้ม/ไลม์ รองรับมือถือและ desktop ใช้รูปจากโปรเจกต์เดิม ไม่มี dependency ใหม่

- ค้นหาชื่อแมตช์/สนาม/พื้นที่ และกรองจังหวัด ระดับการเล่น วันเตะ
- รายละเอียดแสดงราคา เวลา จำนวนผู้เล่น และตำแหน่งที่เปิดรับ
- Native HTML dialog รองรับ Escape และคืน focus เมื่อปิด
- แยกทางเข้าเจ้าของสนามจากงานหลักของผู้เล่น
- หน้าเก่าอยู่ที่ `/legacy/team`, `/legacy/field`; login/owner/สร้างปาร์ตี้เดิมยังอยู่

**รายการใหม่เป็นข้อมูลสาธิตทั้งหมด** (`frontend/src/data/discovery.js`) ไม่ได้ดึง MongoDB ไม่มีการจอง/เข้าร่วมจริง วันที่ใช้เพียงวันในสัปดาห์ ไม่อ้างว่าเป็นแมตช์วันนี้

## Run frontend

ใช้ Node.js 20.19+ หรือ 22.12+

```bash
cd frontend
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดง แล้วเข้าหน้า `/`

```bash
npm run build
```

## Backend เดิม

Express + MongoDB/Mongoose โค้ดเดิมใช้ `mongodb://localhost:27017/kickhub`, API port 3000 รัน frontend step นี้ได้โดยไม่เปิด backend

```bash
cd Backend
npm ci
npm start
```

ต้องเปิด MongoDB และตั้ง `SECRET_KEY` ใน `Backend/.env` ก่อนใช้ authentication ไม่รวม `.env` ใน zip ที่ปรับใหม่; นำค่าเดิมบนเครื่องของคุณกลับมาใช้ได้ ห้าม commit secret

Backend ยังไม่ได้ปรับใน step นี้: frontend เดิมเรียกหลาย IP, login token ไม่มี role และ ProtectedRoute ปิดการ redirect เมื่อไม่มี token จึงยังไม่ได้ตรวจสิทธิ์เจ้าของสนามครบ การมีทางเข้าหน้า owner ไม่ใช่การให้สิทธิ์

## Changed files

- `frontend/src/components/home.jsx`: discovery, filters, cards, details
- `frontend/src/components/Navbar.jsx`: desktop/mobile navigation
- `frontend/src/discovery.css`: visual system
- `frontend/src/data/discovery.js`: preview fixtures
- `frontend/src/App.jsx`: default/discovery/legacy routes
- `frontend/index.html`: Thai language/title
- `.gitignore`, `README.md`

## Next steps

2. รีโนเวท Login/Register ตรวจ role ฝั่ง server รวม API URL และตั้ง MongoDB ด้วย environment
3. เชื่อมแมตช์/สนามจาก MongoDB พร้อม loading/error/empty states และเข้าร่วมจริง
4. รีโนเวทสร้างแมตช์ การจอง ประวัตินัด และ dashboard เจ้าของสนาม
5. ตรวจ flow user/owner และ mobile ก่อน deploy

## Verification

`npm run build` ผ่าน; React server-rendering ของ `/`, `/home`, `/team`, `/field` ผ่าน (3 cards และ preview label ทุกหน้า) ยังไม่ได้ตรวจภาพ/interactions ใน browser เพราะไม่มี browser QA ที่รองรับ และยังไม่ได้ตรวจ MongoDB หรือการจองจริง

## Repository

เป้าหมายจากภาพคือ https://github.com/namethzz/kickhub โค้ด frontend ที่ปรับใหม่และ backend เดิมอยู่ใน repository นี้ ไม่รวม `.git` เก่า, node_modules, build output หรือ .env

## Hero integration: supplied TypeScript component

ใช้โครงสร้าง `parallax`, `parallax__header`, `data-parallax-layers`, ชั้น 1–4, `parallax__fade` และ `parallax__content` จาก component ที่ส่งมา คงค่า `yPercent` 70/55/40/10 และ `scrub: 0` ทุก breakpoint ยกเว้น reduced motion

- Component: `frontend/src/components/ui/parallax-scrolling.tsx`
- Styles: `frontend/src/components/ui/parallax-scrolling.css`
- Demo: `frontend/src/demos/default.tsx` (ใช้ภายใน Router เดิม)
- Hero ใช้รูปที่ส่งมา `/hero-kickhub.jpg` ไม่ต้องใช้ภาพ stock ที่ไม่เกี่ยวกับฟุตบอล ภาพเป็นภาพเดียวจึงใช้ CSS แสงและเส้นสนามเป็นชั้นเสริม ไม่ใช่ภาพ cutout ที่สร้างขึ้น
- ข้อความภาพ BORCELLE ถูกครอปด้วย CSS ไฟล์รูปต้นฉบับไม่เปลี่ยน
- Hooks: useEffect/useRef; ไม่มี store หรือ provider ใหม่ ใช้ Router ที่ App มีอยู่แล้ว
- props: imageSrc (optional, default รูปของคุณ), targetRef (optional, เลื่อนไป section หาแมตช์)
- Desktop ใช้ Lenis; iPhone/iPad คง touch scroll native พร้อม responsive portrait/landscape และ reduced motion
- Cleanup ถอด ticker, ทำลาย Lenis และ revert เฉพาะ GSAP context ของ Hero ไม่ kill trigger ของ component อื่น

### TypeScript / Tailwind / shadcn structure

เดิมเป็น JavaScript และ Tailwind v4; เพิ่ม TypeScript แบบรองรับ JSX เดิม (`allowJs: true`, ไม่ตรวจ legacy JS) มี strict type checking สำหรับ TS/TSX พร้อม build gate `npm run typecheck`

Default components: `frontend/src/components`; UI: `frontend/src/components/ui`; global styles: `frontend/src/index.css`; utility: `frontend/src/lib/utils.ts`

`components.json` กำหนด shadcn CLI, Tailwind v4 tokens และ alias `@/*` ใน Vite/tsconfig ไว้แล้ว โฟลเดอร์ ui ทำให้ CLI วาง reusable components ที่เดียวกัน และใช้ import ตามตัวอย่าง `@/components/ui/...` ได้

```bash
cd frontend
npm ci
npm run typecheck
npm run dev
# เพิ่ม shadcn component ในอนาคต (ไม่จำเป็นสำหรับ Hero):
npx shadcn@latest add button
```

ติดตั้ง `gsap`, `@studio-freight/lenis`, `lucide-react`, `typescript`, `@types/node`, `clsx`, `tailwind-merge`, `tw-animate-css` แล้ว แพ็กเกจ @studio-freight/lenis เป็นชื่อเก่าที่ deprecated แต่ใช้ตาม dependency ที่ระบุใน component รอบนี้

Build/typecheck ต้องผ่านก่อนขึ้น GitHub ยังไม่ได้ทดสอบภาพหรือ scroll บนอุปกรณ์จริง/browser ใน environment นี้

## Fullscreen stadium Hero update

Hero หน้า home เต็ม viewport ด้วย 100svh และเต็มความกว้าง ไม่มีกรอบ/ขอบมน/ช่องว่างด้านข้าง Header ซ้อนบน Hero ส่วนแมตช์ด้านล่างยังคุมความกว้างอ่านง่าย หน้าจอสั้นสามารถ scroll เพื่อไม่ตัดปุ่ม

ใช้ `frontend/public/hero-stadium-v2.png` เป็นภาพใหม่ที่แก้จากรูปของคุณด้วย imagegen built-in: ลบข้อความในภาพ คงหลังคา ไฟ อัฒจันทร์ หมอกและสนาม ลดลูกบอลและย้ายไปขวาล่าง ให้พื้นที่กลางภาพสำหรับข้อความ HTML ภาพเดิมยังอยู่

เลิกขยายภาพสูง 290–300%; desktop ใช้ cover 100%, portrait/mobile ใช้ contain สำหรับภาพหลักให้เห็นทั้งสนาม พร้อม backdrop รูปเดียวกันเพื่อเติมพื้นที่แนวตั้ง ไม่ทำให้บอลกินทั้งหน้าจอ

Asset prompt: edit the supplied stadium, remove all printed text and labels, preserve roof/floodlights/stands/green turf; wide 16:9, smaller football lower right, open center/left for HTML text, no UI or text.

Typecheck/build ใช้ตรวจ source; ยังไม่มี browser/device visual QA ใน environment นี้

## Mobile user party flow

งานหลักของ user: ค้นหาปาร์ตี้ `/team`, สร้างปาร์ตี้ `/create-party` พร้อม bottom navigation ให้สร้างได้โดยตรง ใช้ card แบบแอพ, segmented mode picker, bottom sheet, form input 16px ลดการ auto zoom บน iPhone และขั้นตอนสร้าง 3 ขั้น

- Buffet (`flexible`): ไม่เลือกตำแหน่ง รับคนหลายคน ค่าเฉลี่ยลดลงเมื่อค่าสนามรวมเท่าเดิมและคนหารเพิ่ม ไม่รับประกันว่าถูกกว่าเสมอ
- Locked positions (`fixed`): เลือกตำแหน่ง GK/DF/MF/FW ของตัวเอง พร้อมจำนวนรวมแต่ละตำแหน่งนับรวมเจ้าของ
- Private ในรอบนี้แปลเป็นตัวเลือก approval-required (ค่าตั้งต้นของ fixed); ยังไม่ใช่ invite-only/ซ่อนรายการค้นหา สามารถปรับตามข้อกำหนดรอบต่อไปได้
- ค้นหาด้วยชื่อ/ย่าน/พื้นที่ และตำแหน่งที่ยังว่างในโหมด fixed
- สร้างฉบับร่างเลือกเวลาในอนาคต ค่าสนาม/คนคำนวณจากราคาสนามตัวอย่าง × ระยะเวลา / จำนวนรวม ปัดขึ้นเป็นบาท; ไม่ใช่ราคาเรียกเก็บจริง
- ฉบับร่างเก็บใน localStorage ของ browser นี้และมีหน้าดู/ลบ ไม่เผยแพร่ใน MongoDB ไม่ส่งคำขอ join/approval และไม่มีการจองหรือชำระเงินจริง
- หน้าสร้างปาร์ตี้เดิมยังอยู่ `/legacy/create-party`

Backend เดิมมี mode fixed/flexible และ required_positions แต่ยังไม่มี approval workflow และตรวจสิทธิ์/capacity/ตำแหน่งครบ จึงยังไม่เปิดปุ่มเข้าร่วมจริงใน UI ใหม่ ขั้นต่อไปต้องเชื่อม authentication, MongoDB list/create endpoints, slot allocation แบบ atomic และอนุมัติคำขอฝั่ง server

Implementation: `frontend/src/features/parties/` (PartyHub, CreatePartyFlow, ModePicker, model, styles) พร้อม route/nav ใหม่
