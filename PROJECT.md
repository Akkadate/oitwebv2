# NBU IT Website - Project Documentation

## Overview
เว็บไซต์สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ
Office of Information Technology, North Bangkok University

- **Stack:** Node.js + Express, jQuery, Bootstrap 5
- **CMS:** JSON file-based with Admin Panel
- **Deployment:** Koyeb / Fly.io (Docker) + GitHub Actions
- **Repo:** https://github.com/Akkadate/oitwebv2

---

## File Structure

```
nbu-it/
├── server.js                    # Express backend (async, compression, cache)
├── package.json                 # Dependencies: express, compression, multer
├── Dockerfile                   # Multi-stage Node 22 build
├── fly.toml                     # Fly.io config (region: sin, port: 8080)
├── .github/workflows/fly.yml    # GitHub Actions auto-deploy
├── .gitignore
├── .dockerignore
│
├── index.html                   # Homepage
├── news.html                    # News listing
├── news-detail.html             # News detail
├── services.html                # Services listing
├── service-detail.html          # Service detail
│
├── css/
│   └── style.css                # Main stylesheet (~1300 lines)
├── js/
│   └── main.js                  # Frontend JS (optimized, throttled)
│
├── admin/
│   ├── index.html               # Admin panel SPA
│   ├── css/admin.css            # Admin styles
│   └── js/admin.js              # Admin JS (CRUD operations)
│
├── data/
│   ├── news.json                # 5 news articles
│   ├── announcements.json       # 2 announcements
│   ├── documents.json           # 4 documents
│   ├── faq.json                 # 5 FAQ items
│   ├── services.json            # 12 IT services
│   └── users.json               # Admin users (default: admin/password)
│
└── uploads/                     # User-uploaded files
```

---

## API Endpoints

### Public (ไม่ต้อง login)

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/news | ข่าวทั้งหมด |
| GET | /api/news/:id | ข่าวรายตัว |
| GET | /api/announcements | ประกาศทั้งหมด |
| GET | /api/documents | เอกสารทั้งหมด |
| GET | /api/faq | FAQ ทั้งหมด |
| GET | /api/services | บริการทั้งหมด |
| GET | /api/services/:id | บริการรายตัว |

### Protected (ต้องส่ง X-Auth-Token header)

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/login | Login (body: username, password) |
| POST | /api/change-password | เปลี่ยนรหัสผ่าน |
| POST | /api/{resource} | สร้างรายการใหม่ |
| PUT | /api/{resource}/:id | แก้ไขรายการ |
| DELETE | /api/{resource}/:id | ลบรายการ |
| POST | /api/upload | อัปโหลดไฟล์ (max 10MB) |
| GET | /api/stats | สถิติ dashboard |

### CRUD Factory Pattern
```javascript
// server.js สร้าง REST API อัตโนมัติ
app.use('/api/news', createCrudRoutes('news', 'news.json'));
app.use('/api/services', createCrudRoutes('services', 'services.json'));
// ... เหมือนกันทุก resource
```

---

## Data Structures

### news.json
```json
{
  "id": 1,
  "title_th": "...", "title_en": "...",
  "excerpt_th": "...", "excerpt_en": "...",
  "content_th": "<HTML>", "content_en": "<HTML>",
  "image": "/uploads/xxx.jpg",
  "date": "2025-01-15",
  "category": "security|training|service|maintenance",
  "featured": true/false,
  "status": "published|draft"
}
```

### services.json
```json
{
  "id": 1,
  "title_th": "...", "title_en": "...",
  "description_th": "...", "description_en": "...",
  "content_th": "<HTML>", "content_en": "<HTML>",
  "icon": "fas fa-user-shield",
  "image": "/uploads/xxx.jpg",
  "category": "account|email|software|network|facility",
  "order": 1,
  "status": "published|draft"
}
```

### announcements.json
```json
{
  "id": 1,
  "title_th": "...", "title_en": "...",
  "content_th": "...", "content_en": "...",
  "priority": "high|medium|low",
  "status": "active|inactive",
  "date": "2025-01-01"
}
```

### documents.json
```json
{
  "id": 1,
  "title_th": "...", "title_en": "...",
  "description_th": "...", "description_en": "...",
  "icon": "fas fa-shield-halved",
  "file_url": "/uploads/xxx.pdf",
  "category": "cybersecurity|policy|report",
  "status": "published|draft"
}
```

### faq.json
```json
{
  "id": 1,
  "question_th": "...", "question_en": "...",
  "answer_th": "...", "answer_en": "...",
  "order": 1,
  "status": "published|draft"
}
```

### users.json
```json
{
  "id": 1,
  "username": "admin",
  "password": "SHA256 hash",
  "name": "ผู้ดูแลระบบ",
  "role": "admin"
}
```

---

## Color Theme (CSS Variables)

```css
/* Primary */
--nbu-primary: #003087;        /* Navy Blue */
--nbu-primary-dark: #001f5c;
--nbu-primary-light: #0050b3;
--nbu-secondary: #1a6fc4;      /* Medium Blue */
--nbu-accent: #4da3ff;         /* Light Blue */
--nbu-gold: #c8a84e;           /* Gold */

/* Neutral */
--nbu-white: #ffffff;
--nbu-light-bg: #f4f7fb;
--nbu-dark: #1a1a2e;
--nbu-text: #333333;
--nbu-text-light: #666666;

/* Effects */
--nbu-shadow: 0 2px 15px rgba(0, 48, 135, 0.1);
--nbu-shadow-hover: 0 8px 30px rgba(0, 48, 135, 0.2);
--nbu-transition: all 0.3s ease;
--nbu-radius: 8px;
```

**Typography:** Sarabun (Thai) + Montserrat (English), 16px base, line-height 1.8

---

## Frontend Libraries (CDN)

| Library | Version | Usage |
|---------|---------|-------|
| Bootstrap | 5.3.2 | Grid, components, responsive |
| jQuery | 3.7.1 | DOM, AJAX |
| Font Awesome | 6.5.1 | Icons |
| Owl Carousel | 2.3.4 | Featured news carousel |
| Google Fonts | - | Sarabun + Montserrat |

---

## Admin Panel Features

- **Dashboard** — สถิติรวม (ข่าว, ประกาศ, เอกสาร, FAQ, บริการ)
- **ข่าวสาร** — CRUD + image upload + featured flag + category
- **ประกาศ** — CRUD + priority (high/medium/low)
- **เอกสาร** — CRUD + file upload + icon picker
- **บริการสำนักฯ** — CRUD + icon + category + order + rich content
- **FAQ** — CRUD + order
- **เปลี่ยนรหัสผ่าน** — Current + New password

Login: `admin` / `password`

---

## Performance Optimizations

### Server-side
- **Gzip compression** — ลด bandwidth 60-70%
- **In-memory cache** — TTL 1 นาที ไม่ต้องอ่านไฟล์ซ้ำ
- **Async file I/O** — ไม่ block event loop
- **HTTP cache headers** — static: 1h, uploads: 7d, API: 60s
- **Promise.all** — อ่านหลายไฟล์พร้อมกัน (stats endpoint)

### Client-side
- **รวม API call** — news เรียกครั้งเดียวใช้ทั้ง carousel + grid
- **Throttled scroll** — ทำงานทุก 100ms แทนทุก pixel
- **Scroll handler รวม** — จาก 3 ตัวเหลือ 1 ตัว
- **FAQ event delegation** — bind ครั้งเดียว ไม่ leak
- **Build HTML string** — `.html()` ทีเดียว ลด DOM reflow
- **GPU accelerated particles** — translate3d + will-change
- **Carousel auto-adjust** — loop/items ตาม featured count

---

## Deployment

### Local Development
```bash
npm install
node server.js
# http://localhost:3000
# http://localhost:3000/admin
```

### Production (Koyeb - recommended)
1. เชื่อมต่อ GitHub repo `Akkadate/oitwebv2`
2. Region: Singapore, Runtime: Node
3. Build: `npm install`, Start: `npm start`
4. Auto deploy ทุกครั้งที่ push

### Production (Fly.io - alternative)
1. ต้องมี `FLY_API_TOKEN` ใน GitHub Secrets
2. Push to main → GitHub Actions deploy อัตโนมัติ
3. Docker multi-stage build → port 8080

---

## Contact Information (ในเว็บ)

- **ที่อยู่:** 6/999 ซอยพหลโยธิน 52 แขวงคลองถนน เขตสายไหม กรุงเทพฯ 10220
- **โทร:** 02-972-7200 ต่อ 220
- **Email:** oit.nbu@northbkk.ac.th
- **LINE:** @misnbu → https://lin.ee/DuKzeOE
- **เวลาทำการ:** ทุกวัน 08.30 - 17.30 น.

---

## Services (12 รายการ)

| # | ชื่อบริการ | Category |
|---|-----------|----------|
| 1 | ระบบบัญชีผู้ใช้งาน | account |
| 2 | อีเมลบุคลากร | email |
| 3 | อีเมลนักศึกษา | email |
| 4 | Microsoft 365 Education | software |
| 5 | เครือข่าย Wi-Fi | network |
| 6 | VPN | network |
| 7 | บริการพิมพ์เอกสาร | facility |
| 8 | Foxit PDF Editor | software |
| 9 | E-Learning Moodle | software |
| 10 | ห้องปฏิบัติการคอมพิวเตอร์ | facility |
| 11 | ระบบสารสนเทศ MIS | software |
| 12 | ซ่อมบำรุงอุปกรณ์ IT | facility |

---

## Known Limitations & Future Work

### Limitations
- **JSON file storage** — ข้อมูลหายเมื่อ deploy ใหม่ (container reset)
- **ไม่มี persistent storage** บน free hosting
- **Single admin user** — ยังไม่มีระบบจัดการ users หลายคน
- **ภาษาอังกฤษ** — มี field `_en` แต่ยังไม่มี language switcher

### Recommended Next Steps
1. **เปลี่ยนเป็น PostgreSQL** — ข้อมูลคงอยู่ถาวร (Supabase/Neon ฟรี)
2. **เพิ่ม Language Switcher** — TH/EN toggle
3. **เพิ่มระบบ Users** — หลาย admin, role-based
4. **Image optimization** — resize/compress ก่อน upload
5. **SEO** — meta tags, sitemap, structured data
6. **PWA** — Service Worker, offline support
