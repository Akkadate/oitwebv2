# NBU IT Website - Project Documentation

## Overview
เว็บไซต์สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ
Office of Information Technology, North Bangkok University

- **Stack:** Node.js + Express, jQuery, Bootstrap 5
- **Database:** PostgreSQL (Supabase)
- **File Storage:** Cloudinary (images/documents)
- **Deployment:** Koyeb (auto-deploy from GitHub)
- **Repo:** https://github.com/Akkadate/oitwebv2

---

## File Structure

```
nbu-it/
├── server.js                    # Express backend (PostgreSQL + Cloudinary)
├── package.json                 # Dependencies
├── migrate.js                   # One-time JSON → PostgreSQL migration script
├── .env                         # Environment variables (NOT in git)
├── Dockerfile                   # Multi-stage Node 22 build
├── fly.toml                     # Fly.io config (region: sin, port: 8080)
├── .github/workflows/fly.yml    # GitHub Actions auto-deploy (Fly.io)
├── .gitignore
├── .dockerignore
│
├── index.html                   # Homepage (12 sections)
├── news.html                    # News listing
├── news-detail.html             # News detail
├── services.html                # Services listing
├── service-detail.html          # Service detail
│
├── css/
│   └── style.css                # Main stylesheet (~1360 lines)
├── js/
│   └── main.js                  # Frontend JS (optimized, throttled)
│
├── admin/
│   ├── index.html               # Admin panel SPA
│   ├── css/admin.css            # Admin styles
│   └── js/admin.js              # Admin JS (CRUD operations)
│
├── data/                        # Original JSON data (backup/reference)
│   ├── news.json
│   ├── announcements.json
│   ├── documents.json
│   ├── faq.json
│   ├── services.json
│   └── users.json
│
└── uploads/                     # Legacy local uploads (now using Cloudinary)
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string (Supabase) | postgresql://user:pass@host:6543/postgres |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | doguheeyu |
| CLOUDINARY_API_KEY | Cloudinary API key | 177228746914556 |
| CLOUDINARY_API_SECRET | Cloudinary API secret | (secret) |
| PORT | Server port (optional, default 3000) | 3000 |

**Note:** ตั้งค่าทั้งหมดบน Koyeb Environment Variables สำหรับ production

---

## Architecture

### Database (Supabase PostgreSQL)
- **Connection:** Session pooler (IPv4) via `aws-1-ap-south-1.pooler.supabase.com:6543`
- **SSL:** `rejectUnauthorized: false`
- **Tables:** news, announcements, documents, faq, services, users
- **Migration:** ใช้ `node migrate.js` ครั้งเดียว (JSON → PostgreSQL)

### File Storage (Cloudinary)
- **Folder:** `nbu-it/`
- **Allowed formats:** jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, ppt, pptx
- **Max file size:** 10MB
- **Free tier:** 25GB storage + 25GB bandwidth/month

### CRUD Factory Pattern
```javascript
// server.js สร้าง REST API อัตโนมัติจากชื่อตาราง
function createCrudRoutes(tableName, orderBy = 'id') { ... }

app.use('/api/news', createCrudRoutes('news', 'id DESC'));          // ใหม่ก่อน
app.use('/api/announcements', createCrudRoutes('announcements', 'id DESC')); // ใหม่ก่อน
app.use('/api/documents', createCrudRoutes('documents'));
app.use('/api/faq', createCrudRoutes('faq'));
app.use('/api/services', createCrudRoutes('services'));
```

---

## API Endpoints

### Public (ไม่ต้อง login)

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/news | ข่าวทั้งหมด (เรียงใหม่ก่อน) |
| GET | /api/news/:id | ข่าวรายตัว |
| GET | /api/announcements | ประกาศทั้งหมด (เรียงใหม่ก่อน) |
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
| POST | /api/upload | อัปโหลดไฟล์ไป Cloudinary (max 10MB) |
| GET | /api/stats | สถิติ dashboard |

---

## Homepage Sections (index.html)

| # | Section | ID | Background |
|---|---------|-----|-----------|
| 1 | Navbar | mainNavbar | Fixed, blur, navy |
| 2 | Hero | #home | Gradient dark-blue + particles |
| 3 | Quick Access | #quick-access | White cards, floats over hero |
| 4 | Announcement Banner | - | Gradient dark-blue |
| 5 | Featured News Carousel | #featured-news | Light gray-blue |
| 6 | News Grid | #news | White |
| 7 | Vision / Parallax | #vision | Gradient dark-blue |
| 8 | Services | #services | White |
| 9 | Documents | #documents | Light gray-blue |
| 10 | FAQ | #faq | White |
| 11 | Calendar | #calendar | Light gray-blue (Google Calendar embed) |
| 12 | Contact | #contact | Light gray-blue |
| 13 | Footer | - | Navy gradient |

---

## Data Structures (PostgreSQL Tables)

### news
```sql
id SERIAL PRIMARY KEY,
title_th TEXT, title_en TEXT,
excerpt_th TEXT, excerpt_en TEXT,
content_th TEXT, content_en TEXT,
image TEXT,                        -- Cloudinary URL
date DATE,
category VARCHAR(50),              -- security|training|service|maintenance
featured BOOLEAN DEFAULT false,
status VARCHAR(20) DEFAULT 'draft' -- published|draft
```

### services
```sql
id SERIAL PRIMARY KEY,
title_th TEXT, title_en TEXT,
description_th TEXT, description_en TEXT,
content_th TEXT, content_en TEXT,
icon VARCHAR(100),                 -- Font Awesome class
image TEXT,
category VARCHAR(50),              -- account|email|software|network|facility
"order" INTEGER DEFAULT 0,
status VARCHAR(20) DEFAULT 'published'
```

### announcements
```sql
id SERIAL PRIMARY KEY,
title_th TEXT, title_en TEXT,
content_th TEXT, content_en TEXT,
priority VARCHAR(20) DEFAULT 'medium', -- high|medium|low
status VARCHAR(20) DEFAULT 'active',   -- active|inactive
date DATE
```

### documents
```sql
id SERIAL PRIMARY KEY,
title_th TEXT, title_en TEXT,
description_th TEXT, description_en TEXT,
icon VARCHAR(100),
file_url TEXT,                     -- Cloudinary URL
category VARCHAR(50),              -- cybersecurity|policy|report
status VARCHAR(20) DEFAULT 'published'
```

### faq
```sql
id SERIAL PRIMARY KEY,
question_th TEXT, question_en TEXT,
answer_th TEXT, answer_en TEXT,
"order" INTEGER DEFAULT 0,
status VARCHAR(20) DEFAULT 'published'
```

### users
```sql
id SERIAL PRIMARY KEY,
username VARCHAR(100) UNIQUE,
password VARCHAR(255),             -- SHA256 hash
name TEXT,
role VARCHAR(50) DEFAULT 'admin'
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
- **ข่าวสาร** — CRUD + image upload (Cloudinary) + featured flag + category
- **ประกาศ** — CRUD + priority (high/medium/low)
- **เอกสาร** — CRUD + file upload (Cloudinary) + icon picker
- **บริการสำนักฯ** — CRUD + icon + category + order + rich content
- **FAQ** — CRUD + order
- **เปลี่ยนรหัสผ่าน** — Current + New password

Login: `admin` / `password`

---

## Performance Optimizations

### Server-side
- **Gzip compression** — ลด bandwidth 60-70%
- **HTTP cache headers** — static: 1h, API: 60s
- **Promise.all** — query หลายตารางพร้อมกัน (stats endpoint)
- **PostgreSQL connection pool** — reuse connections

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
# สร้างไฟล์ .env ใส่ DATABASE_URL + CLOUDINARY credentials
node server.js
# http://localhost:3000
# http://localhost:3000/admin
```

### Production (Koyeb - recommended)
1. เชื่อมต่อ GitHub repo `Akkadate/oitwebv2`
2. Region: Singapore, Runtime: Node
3. Build: `npm install`, Start: `npm start`
4. ตั้ง Environment Variables: DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
5. Auto deploy ทุกครั้งที่ push

### Production (Fly.io - alternative)
1. ต้องมี `FLY_API_TOKEN` ใน GitHub Secrets
2. Push to main → GitHub Actions deploy อัตโนมัติ
3. Docker multi-stage build → port 8080

---

## External Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Supabase | PostgreSQL database | 500MB, 2 projects |
| Cloudinary | Image/file storage | 25GB storage, 25GB bandwidth/mo |
| Koyeb | Hosting (no sleep) | 1 app, Singapore region |
| Google Calendar | ปฏิทินกิจกรรม (embed) | Free |

---

## Google Calendar Integration

- **Calendar ID:** `c_86ea7d3bc1354f81a74820fc3ad64f01bf4b58a7e57ed904d8f61bed4f8a9736@group.calendar.google.com`
- **Display:** Embedded iframe in Calendar section
- **Settings:** Thai language, Bangkok timezone, no title/print/calendars/tz
- **Features:** Navigation, date display, tabs (month/week/agenda)
- **Responsive:** 600px (desktop) / 450px (tablet) / 380px (mobile)

---

## Contact Information

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

## Development History

| Date | Change |
|------|--------|
| 2026-02-17 | Initial website with JSON-based CMS |
| 2026-02-17 | Performance optimization (compression, throttle, GPU particles) |
| 2026-02-17 | Featured news carousel fixes + separate from news grid |
| 2026-02-18 | Migrate database from JSON to Supabase PostgreSQL |
| 2026-02-18 | Switch file uploads from local disk to Cloudinary |
| 2026-02-18 | Sort news/announcements newest first (ORDER BY id DESC) |
| 2026-02-18 | Add Google Calendar section (ปฏิทินกิจกรรม) |

---

## Known Limitations & Future Work

### Current Limitations
- **Single admin user** — ยังไม่มีระบบจัดการ users หลายคน
- **ภาษาอังกฤษ** — มี field `_en` แต่ยังไม่มี language switcher
- **No image optimization** — ยังไม่ resize/compress ก่อน upload

### Recommended Next Steps
1. **เพิ่ม Language Switcher** — TH/EN toggle
2. **เพิ่มระบบ Users** — หลาย admin, role-based
3. **Image optimization** — resize/compress ก่อน upload (Cloudinary transforms)
4. **SEO** — meta tags, sitemap, structured data
5. **PWA** — Service Worker, offline support
