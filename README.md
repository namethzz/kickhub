# KickHub

แอพหาเพื่อนเตะบอลสำหรับผู้เล่นและเจ้าของสนาม ใช้ React + Vite + Tailwind + TypeScript ฝั่ง frontend และ Express + MongoDB/Mongoose ฝั่ง backend

## ฟังก์ชันที่เชื่อม MongoDB แล้ว

- สมัคร/เข้าสู่ระบบด้วยบัญชี `user` หรือ `owner`
- ค้นหาปาร์ตี้บุฟเฟต์และล็อคตำแหน่ง ดูปาร์ตี้ที่ตนจัด เข้าร่วม และส่งคำขอรออนุมัติ
- เผยแพร่ปาร์ตี้จากสนามที่เปิดใช้งาน กำหนดเวลา จำนวนผู้เล่น ตำแหน่ง และราคาต่อคน
- บุฟเฟต์ไม่กำหนดตำแหน่ง; ล็อคตำแหน่งเลือก GK/DF/MF/FW
- เลือกเปิดรับทันทีหรือให้หัวตี้อนุมัติก่อน คำขอรออนุมัติยังไม่ถือเป็นสมาชิกและไม่กันที่ว่าง
- หัวตี้ดูโปรไฟล์ผู้ขอ อนุมัติ/ปฏิเสธได้ ระบบตรวจจำนวนรวมและตำแหน่งอีกครั้งตอนอนุมัติ
- ผู้เล่นยกเลิกคำขอหรือออกจากทีมได้ก่อนเวลาเริ่ม หัวตี้ออกจากปาร์ตี้ของตนเองไม่ได้
- โปรไฟล์สาธารณะแสดงชื่อ พื้นที่ แนะนำตัว ตำแหน่งและระดับฝีเท้า อีเมลแสดงเฉพาะหน้าเจ้าของบัญชี
- แก้ไขโปรไฟล์ตนเองได้ ไม่รับการแก้ role/email/password ผ่าน API โปรไฟล์
- API เพิ่ม/แก้ไข/ลบสนามเดิมตรวจ role เจ้าของสนามและความเป็นเจ้าของแล้ว

สมาชิก/คำขออยู่ในเอกสาร Post เดียวกัน ใช้ Mongoose optimistic concurrency และ retry จากข้อมูลล่าสุด เพื่อไม่ให้การเข้าร่วมหรืออนุมัติพร้อมกันรับคนเกินจำนวน API ปาร์ตี้เดิมใช้กฎเดียวกัน จึงไม่สามารถข้ามการอนุมัติผ่าน endpoint เก่าได้

**การเผยแพร่ปาร์ตี้ไม่ใช่การจองหรือชำระค่าสนาม** ยังต้องตกลงการจองกับเจ้าของสนาม ระบบชำระเงินจริงและการยืนยันจองยังไม่ได้ปรับในรอบนี้ การค้นหาดึงไม่เกิน 100 ปาร์ตี้ที่ยังไม่สิ้นสุดในแต่ละโหมด

## รันบนเครื่อง

ใช้ Node.js 20.19+ (แนะนำ Node 22) และ MongoDB Community หรือ MongoDB Atlas

1. คัดลอก `Backend/.env.example` เป็น `Backend/.env` แล้วตั้ง `MONGODB_URI` และ `SECRET_KEY` ที่เป็นค่าสุ่มของคุณ
2. เปิด MongoDB สำหรับเครื่อง local หากใช้ URI ค่าเริ่มต้น
3. รัน API:

```bash
cd Backend
npm ci
npm run dev
```

4. เปิดอีก terminal แล้วรัน frontend:

```bash
cd frontend
npm ci
npm run dev
```

Vite proxy ส่ง `/api` ไป `http://127.0.0.1:3000` หน้า login/register จึงเปิดตรงหรือ refresh ได้โดยไม่ชน endpoint ของ backend บนมือถือที่อยู่ Wi-Fi เดียวกัน เปิด URL Network ที่ Vite แสดง; `localhost` ของ API จะถูกเรียกจาก proxy บนคอม ไม่ใช่จากโทรศัพท์

สำหรับ production ตั้ง `VITE_API_URL` ตาม `frontend/.env.example` เป็น HTTPS origin ของ API และตั้ง `CLIENT_ORIGIN` ใน backend ให้ตรง origin ของ frontend (หลาย origin คั่นด้วย comma) ต้องมี SPA fallback สำหรับ routes ฝั่ง frontend

หากฐานข้อมูลใหม่ยังไม่มีสนาม สมัครบัญชีเจ้าของสนาม แล้วเข้าหน้า `/Owner` เพื่อเพิ่มสนามก่อนสร้างปาร์ตี้ ไม่มีการ seed ข้อมูลสาธิตลงฐานข้อมูลจริง

## Routes

| Route | การใช้งาน |
| --- | --- |
| `/home` | Hero และ discovery ตัวอย่าง |
| `/login`, `/signup` | สมัคร/เข้าสู่ระบบจริง |
| `/team` | ค้นหาและจัดการปาร์ตี้จริง |
| `/create-party` | สร้างและเผยแพร่ปาร์ตี้จริง |
| `/parties/:partyId` | รายละเอียด สมาชิก เข้าร่วม/ยกเลิก |
| `/party-requests/:partyId` | เฉพาะหัวตี้: อนุมัติคำขอ |
| `/players/:playerId` | โปรไฟล์สาธารณะ |
| `/profile` | ดูและแก้ไขบัญชีตนเอง |
| `/demo/team`, `/demo/players/:playerId`, `/demo/party-requests` | ข้อมูลสาธิตแยกจากระบบจริง |

ฉบับร่างยังเก็บเฉพาะในเบราว์เซอร์ที่ใช้ (localStorage) และไม่เผยแพร่ให้ผู้อื่นค้นหา หน้า `/home` ยังเป็น discovery ตัวอย่าง ส่วนการจอง/ประวัติเก่ายังต้องรีโนเวทต่อ ไม่มีระบบอัปโหลดรูปโปรไฟล์หรือปาร์ตี้ใหม่ในรอบนี้

## โครงสร้าง UI

- `frontend/src/features/live`: หน้าปาร์ตี้ โปรไฟล์ คำขอ และ authentication ที่เชื่อม API
- `frontend/src/features/parties`: ฟอร์มสร้าง โหมด ฉบับร่าง และ preview
- `frontend/src/features/profiles`: visual styles และ demo profiles
- `frontend/src/lib/api.ts`: API origin, token, errors และ types
- reusable UI: `frontend/src/components/ui`; global styles: `frontend/src/index.css`
- `components.json` และ alias `@/*` รองรับ shadcn structure; Tailwind v4 และ TypeScript strict สำหรับ TS/TSX ใหม่ ส่วน JSX เก่ายังเป็น allowJs

ออกแบบเน้นมือถือ touch target 44–48px, input 16px, safe-area สำหรับเมนูล่าง; iPad/desktop ใช้ความกว้างและสองคอลัมน์ตามพื้นที่ Hero ใช้ GSAP/ScrollTrigger และ component parallax ที่ผู้ใช้ให้มา รูปสนาม `/hero-stadium-v2.png` มาจากรูปอ้างอิงของผู้ใช้ Desktop ใช้ Lenis; touch ใช้ native scroll และรองรับ reduced motion

## ตรวจสอบ

```bash
cd frontend
npm run build

cd ../Backend
npm test
npm run test:integration
```

`npm test` ตรวจตรรกะความจุ ตำแหน่ง สิทธิ์หัวตี้ การซ่อนคำขอ และ retry หลัง version conflict โดยไม่ต้องเปิด MongoDB

`test:integration` เปิด MongoDB ชั่วคราวเพื่อทดสอบ HTTP API, JWT, privacy, การสมัคร, การส่งคำขอ, การยกเลิก และการอนุมัติ/เข้าร่วมพร้อมกัน ชุดนี้ต้องดาวน์โหลดและรัน MongoDB binary ได้ หรือกำหนด `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/kickhub_test` เพื่อใช้ฐานข้อมูล local **สำหรับทดสอบเท่านั้น** ซึ่งจะถูกล้างก่อนและหลังทดสอบ ไม่รองรับ URI ของฐานข้อมูลจริง

GitHub Actions (`.github/workflows/ci.yml`) เปิด MongoDB service แยกและรันทั้ง unit, integration และ frontend build บนทุก push/PR ยังไม่ได้ทดสอบภาพและ interaction ด้วย browser บน iPhone/iPad จริงใน environment นี้

Repository: https://github.com/namethzz/kickhub

### Owner dashboard

`/Owner` is the mobile-first live owner dashboard: create/edit owned fields, search and filter, and pause/reopen availability. Owners can also enter from their profile. Active fields appear in party creation; pausing a field does not cancel existing parties. Field photos currently use publicly accessible HTTP(S) image URLs; file uploads and reservation/payment management are not included in this step. The backend validates field data and ignores client-supplied owner identity.

### Live field discovery

`/field` lists active MongoDB fields with name/area search, field-type filtering, and price sorting. `/fields/:fieldId` shows details, amenities, contact/map links, and the owner profile. Creating a party from a field preselects that field; paused or missing selections are rejected rather than silently substituted. `/team?field=<id>` filters parties by field. These live routes currently require login. This step does not create a booking or process payments.

### Reset local data

Stop the API first. From `Backend`, run `npm run db:reset -- --confirm=kickhub`. The script only accepts a localhost MongoDB URI with database name `kickhub`; remote servers and other databases are refused. It asks for your management account name/email locally, validates the seed before deletion, saves every non-system collection and its indexes to a private `.backups/*.ejson` file, then drops/recreates the local database. The generated password is displayed in your own terminal only. Keep the backup private: it contains account data. Backups and credentials are never committed.

The new database contains one management account and one Sidekick Soccer field, based on the user-supplied existing record. The venue's official historical page identifies its artificial turf: https://sidekicksoccer.wordpress.com/2010/12/13/รู้จักกับสนามฟุตบอล-sidekicksoccer/ . Price, contact, amenities and hours have not been verified as current. The description discloses this; no fake public players, parties, or reservations are seeded. This account does not claim to verify the actual venue owner. Review `Backend/data/initial-fields.json` before running if you have newer facts. Do not run the reset twice unless you intend to erase the new data too.

After reset, clear site data for `localhost:5173` (including localStorage drafts and saved login), sign in with the generated account, and register real player accounts normally. MongoDB data and browser storage are separate. The home discovery examples remain labelled examples; they are not MongoDB records.

### Login, registration and Facebook Login

The live `/login`, `/signup` (also `/register`) pages use `src/components/ui/login.tsx`, adapted from the supplied split-screen component with React Hook Form, Zod, shadcn controls and reduced-motion support. The user-supplied image is `frontend/public/auth-sports.webp`. Desktop/tablet show a split screen; phones show the image above the form. Names, account types, password visibility and Thai validation are supported. Remember login extends the JWT from 24 hours to 7 days; tokens expire normally and logout clears browser storage. Password recovery is not implemented, so the form does not include a placeholder recovery link.

From the project root, update dependencies with `npm ci --prefix frontend` and restart both servers after pulling. Configure only `Backend/.env`:

```dotenv
FACEBOOK_APP_ID=your-numeric-meta-app-id
FACEBOOK_APP_SECRET=your-meta-app-secret
FACEBOOK_GRAPH_VERSION=v25.0
```

Create/configure Facebook Login in your Meta app and add your website's origin in its web/app domain settings. Use the API version supported by your Meta app. Use HTTPS for a deployed site. Development testing must use accounts permitted by your Meta app's current development access; complete Meta's requirements before enabling public users. Keep the App Secret server-side: never use a `VITE_` variable for it and never commit it. Setup references: https://developers.facebook.com/docs/facebook-login/web/ and https://developers.facebook.com/docs/facebook-login/guides/access-tokens/debugging-and-error-handling/ .

The frontend loads the official JavaScript SDK using the public `/api/auth/facebook/config` response and opens login directly from a user click. Backend `/api/auth/facebook` independently checks the supplied access token's application, user identity and expiry, then fetches the profile with an app-secret proof. New users must share an email. Existing Facebook identities retain their account role; inactive users are rejected. An existing password account is never silently linked by matching email: those users must use their original email/password. Facebook account linking is not part of this step. Facebook token responses and App Secret are not stored or sent back to the browser; the app issues its own JWT. Without Meta configuration, email login/signup remain available and the Facebook button explains its unavailable state. Live Meta login requires your own configuration; automated tests use isolated mocks, not real Facebook accounts.

### Google Login

Login and register also offer Google's official Identity Services button. New Google users select player/owner on registration; returning accounts retain their role. Backend verifies Google signatures, audience, issuer, expiry and verified email using `google-auth-library`; the stable Google `sub` is saved as a unique sparse `google_id`. The browser receives only KickHub's own JWT. A matching email on an existing password/Facebook account is rejected with guidance to use the original sign-in method; linking existing accounts is not implemented.

From the project root after pulling:

```bash
npm ci --prefix Backend
npm ci --prefix frontend
```

Create a Google Cloud project, configure Google Auth Platform branding/audience, then create a **Web application** OAuth client. Add the frontend origin (including its port), for example both `http://localhost` and `http://localhost:5173`, to **Authorized JavaScript origins**. If using `http://127.0.0.1:5173` too, register that separately. For production register the actual HTTPS frontend origin. This implementation uses the JavaScript popup credential callback, so no backend redirect route or client secret is needed. If the project is in Testing and restricts access, add your testing accounts in Audience.

Set only this additional value in `Backend/.env`, preserving the MongoDB, JWT and Facebook settings:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Restart the API and refresh `/login` or `/register`. Missing configuration or blocked SDK loading displays a Thai explanation and email authentication remains available. The official Google button resizes to fit phones/tablets (up to its supported 400px width). Client IDs are public configuration, not secrets. Tokens are posted in JSON from the GIS callback; this API does not accept Google's direct cookie/form redirect login flow. Tests use locally signed tokens with isolated keys and mocked profile/database operations, not live Google accounts. Real account and device testing requires your configured client ID.

Official setup: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
Server verification: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

### My parties and history

`/my-parties` is an authenticated mobile-first overview, reachable from the profile and party search. It combines buffet and fixed-position games with three categories: hosted, joined (excluding games you host), and your own requests in all states. Switch between upcoming/in-progress games and history; a game moves into history when its end time passes. Pending requests do not reserve a place and are labelled expired after the start time. Hosts can open request review before kickoff; everyone can open party details. Cards show the user's assigned position when applicable, headcount, date and price. Categories, period and page are preserved in the URL. Refresh is manual or triggered when returning to the browser tab.

`GET /api/v2/my-parties?scope=host|joined|requested&period=upcoming|history&page=1` always scopes data and counts to the authenticated user, returns 12 records per page and uses the existing request privacy serializer. It never takes user identity from query parameters. Existing ended party documents supply history; there are no seeded historical records or new booking/payment features.

### In-app notifications

`/notifications` now shows real activity instead of the legacy hardcoded LAN feed. The header bell and profile provide access. Players receive request-submitted and approved/declined updates; hosts receive new requests, immediate joins and cancellations. Notifications begin with new activity after this update; historical activity is not invented or backfilled. Events are embedded in the party and saved in the same optimistic-concurrency mutation as the request/approval, avoiding a separate write that could fail after a successful join. Rejected mutations generate no events. Each party retains its latest 250 events to bound document size; this is an activity inbox, not a permanent audit log. Cancelling a party preserves its inbox activity and history.

Authenticated `GET /api/v2/notifications?filter=all|unread&page=1` scopes events to the recipient before and after unwinding, paginates 12 items and returns the unread count plus a server snapshot timestamp. Party/profile responses never expose the event array. `PATCH /api/v2/notifications/read` with `{through: asOf}` marks all activity up to that snapshot read for the authenticated account using a monotonic `$max` timestamp; later activity remains unread. The read state is stored in MongoDB and shared across devices. The inbox and bell refresh every 60 seconds while visible, on returning to the browser tab, or manually. Links open party details or host request review. This step implements in-app notifications only, not browser push, email or SMS.

### Host party management

Party detail pages offer host-only editing of the name, description, start/end time and per-player price before the game starts. `PATCH /api/v2/parties/:id` validates the whole patch; the field, mode, capacity and player positions cannot be changed through this action. Current participants and pending applicants receive an in-app `updated` notification when details actually change. Hosts should confirm the new booking time directly with the field.

`POST /api/v2/parties/:id/cancel` accepts an optional `{reason}` (up to 300 characters), sets `status: cancelled`, and retains participants and the party record. Pending applications become cancelled and participants/pending applicants receive a `party_cancelled` notification. Repeating cancellation does not duplicate alerts or overwrite the original reason. Cancelled games are excluded from discovery and upcoming lists, appear in My Parties history immediately, and cannot accept joins, reviews, withdrawals or further edits. Legacy delete/update endpoints use the same service rules; deletion now cancels rather than removing the record. Existing records without a status remain active. Cancellation does not cancel an external field booking or issue a refund.

### Party sharing and calendar export

Active party detail pages offer native device sharing (where supported), copy-link, and a selectable manual-copy fallback when sharing/clipboard access is unavailable. Shared links preserve the deployment base path and omit credentials, query strings and fragments. Recipients still authenticate through the existing login-return flow; sharing a link does not bypass host approval or capacity rules.

Joined players and hosts can download an `.ics` snapshot for a party that has not ended. The event contains title, field/address, start/end, price/mode, and a link to the latest party detail; it contains no member identities or private requests. Times are emitted in UTC, so overnight games retain the correct dates, and Thai/emoji content uses UTF-8-aware folding and escaped TEXT per [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html). Cancelled/finished parties do not offer these actions. Calendar downloads are not a live subscription: users must update their own calendar when the host changes or cancels the game. This feature does not write directly to a Google or Apple account.

### ค้นหาปาร์ตี้

หน้า `/team` ใช้ `GET /api/v2/party-search` สำหรับผู้เข้าสู่ระบบ ค้นหาชื่อปาร์ตี้ สนาม หรือที่อยู่แบบข้อความธรรมดา พร้อมกรองโหมด วันเล่นตามเวลาไทย งบสูงสุดต่อคน วิธีเข้าร่วม และตำแหน่งที่ยังว่าง เลือกเรียงตามเวลาเริ่มหรือราคาต่ำก่อน โดยแบ่งหน้าละ 12 รายการจากฐานข้อมูล แสดงเฉพาะตี้ที่ยังไม่เริ่มและไม่ถูกยกเลิก

ค่าเริ่มต้นแสดงเฉพาะตี้ที่มีที่ว่าง ตำแหน่งว่างนับจากสมาชิกที่เข้าร่วมสำเร็จ ไม่รวมคำขอรออนุมัติ การเข้าร่วมจริงยังตรวจจำนวนว่างอีกครั้ง ตัวกรองและเลขหน้าเก็บใน URL เพื่อกลับจากหน้ารายละเอียดแล้วใช้ตัวเลือกเดิม ส่วนตี้ที่จัดเอง เข้าร่วม และประวัติรวมอยู่ที่ `/my-parties` ต้องรีสตาร์ต Backend หลังอัปเดตครั้งนี้ ไม่มีการแก้ไขข้อมูลเดิม

### แชตทีมในปาร์ตี้

หัวตี้และสมาชิกที่เข้าร่วมสำเร็จมีแท็บ “แชตทีม” ในหน้ารายละเอียด คนรออนุมัติ คนนอก และคนที่ออกจากตี้ไม่สามารถอ่านหรือส่งข้อความผ่าน API ได้ ตรวจสิทธิ์ทุกครั้งที่ `GET/POST /api/v2/parties/:id/messages` ข้อความไม่รวมอยู่ใน API รายละเอียด ค้นหา หรือข้อมูลสาธารณะ

เก็บข้อความตัวอักษรล่าสุด 200 ข้อความต่อปาร์ตี้ใน MongoDB โหลดครั้งละ 50 ข้อความและกดดูข้อความก่อนหน้าได้ ชื่อผู้ส่งและเวลาใช้ข้อมูลฝั่งเซิร์ฟเวอร์ จำกัด 1,000 ตัวอักษรและเว้น 3 วินาทีระหว่างข้อความ ใช้ `client_id` UUID เพื่อป้องกันการส่งซ้ำเมื่อ retry ข้อความที่ยังอยู่ในประวัติ พร้อมตรวจสิทธิ์และสถานะซ้ำเมื่อเกิด concurrent save conflict

หน้าจออัปเดตทุก 10 วินาทีเมื่อเปิดแท็บแชตและเบราว์เซอร์อยู่ด้านหน้า มีปุ่มโหลดใหม่ เก็บข้อความที่พิมพ์ไว้เมื่อส่งไม่สำเร็จ แสดงข้อความใหม่โดยไม่ดึงหน้าจอลงเมื่อกำลังอ่านด้านบน หลังตี้จบหรือถูกยกเลิกอ่านประวัติได้เท่านั้น รุ่นนี้ไม่มีไฟล์แนบ Push notification หรือ WebSocket ต้องรีสตาร์ต Backend หลังอัปเดต

แจ้งเตือนรองรับสถานะอ่านรายรายการ: เปิดรายการแล้วเรียก `PATCH /api/v2/notifications/:id/read` โดยอัปเดตเฉพาะผู้รับที่เข้าสู่ระบบ เปิดหน้ารายละเอียดตี้จะรับเวลา snapshot จากเซิร์ฟเวอร์แล้วอ่านกิจกรรมของตี้นั้นผ่าน `PATCH /api/v2/parties/:id/notifications/read` เฉพาะรายการก่อน snapshot ไม่ล้างตี้อื่นหรือคำขอเข้าร่วมที่หัวตี้ยังไม่ได้เปิดอ่าน กระดิ่งและกล่องแจ้งเตือนโหลดจำนวนใหม่หลังบันทึกสำเร็จ รวมถึงกรณีมีคำขอโหลดค้างอยู่ สถานะรายรายการทำงานร่วมกับปุ่มอ่านทั้งหมดเดิมได้

ข้อความใหม่สร้างแจ้งเตือน `chat` เฉพาะหัวตี้และสมาชิกปัจจุบันคนอื่น ไม่ส่งถึงผู้ส่งหรือคนรออนุมัติ รวมเป็นรายการเดียวต่อตี้ต่อผู้รับและเก็บรหัสข้อความล่าสุด ไม่มีเนื้อหาแชตในกล่องแจ้งเตือน การส่งซ้ำด้วย client_id เดิมไม่เพิ่มแจ้งเตือนหรือย้อนสถานะอ่าน กดรายการแล้วเปิด `/parties/:id?tab=chat` โดยตรง กระดิ่งและกล่องแจ้งเตือนตรวจข้อมูลทุก 15 วินาทีเมื่อหน้าเว็บอยู่ด้านหน้า

แจ้งเตือนแชตไม่ถูกอ่านอัตโนมัติจากการเปิดรายละเอียดตี้หรือคลิกรายการเฉย ๆ หน้าแชตส่ง `PATCH /api/v2/parties/:id/messages/read` เมื่อแสดงข้อความล่าสุดและเลื่อนถึงท้ายรายการ โดยระบุรหัสข้อความที่โหลดมาแล้ว ตรวจสมาชิกและจับคู่รหัสข้อความเพื่อไม่ล้างแจ้งเตือนข้อความที่เข้ามาทีหลัง แม้เวลาอยู่ในมิลลิวินาทีเดียวกัน คนที่ออกจากตี้จะล้างแจ้งเตือนแชตของตัวเอง รุ่นนี้เป็นแจ้งเตือนภายในเว็บ ไม่ใช่ Push notification ขณะปิดเว็บ ไม่มีการสร้างแจ้งเตือนย้อนหลังสำหรับข้อความเก่า ต้องรีสตาร์ต Backend หลังอัปเดต
