# NBU IT Website — สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ

เว็บไซต์สำนักเทคโนโลยีสารสนเทศ (OIT) มหาวิทยาลัยนอร์ทกรุงเทพ
พัฒนาด้วย Node.js + Express, jQuery, Bootstrap 5 และ PostgreSQL (Supabase)

🔗 **Repository:** https://github.com/Akkadate/oitwebv2

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Frontend | jQuery 3.7.1, Bootstrap 5.3.2 |
| Database | PostgreSQL via Supabase |
| File Storage | Cloudinary (images/documents) |
| Hosting | Koyeb (auto-deploy, Singapore region) |
| CI/CD | GitHub Actions + Fly.io (alternative) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase)
- Cloudinary account

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/Akkadate/oitwebv2.git
cd oitwebv2/nbu-it

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# แก้ไข .env ใส่ค่าต่อไปนี้

# 4. Run server
node server.js
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`
Admin Panel: `http://localhost:3000/admin`

### Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
DATABASE_URL=postgresql://user:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
```

### Database Migration (ครั้งแรก)

```bash
node migrate.js
```

สคริปต์นี้ migrate ข้อมูลจาก JSON files ใน `data/` ไปยัง PostgreSQL (ทำครั้งเดียว)

---

## Admin Panel

URL: `/admin`

### ฟีเจอร์ Admin

- **Dashboard** — สถิติรวมทุกหมวด
- **ข่าวสาร** — เพิ่ม/แก้ไข/ลบ + อัปโหลดรูป + featured + category
- **ประกาศ** — เพิ่ม/แก้ไข/ลบ + ระดับความสำคัญ (high/medium/low)
- **เอกสาร** — เพิ่ม/แก้ไข/ลบ + อัปโหลดไฟล์ + icon picker
- **บริการ** — เพิ่ม/แก้ไข/ลบ + icon + category + ลำดับ
- **FAQ** — เพิ่ม/แก้ไข/ลบ + ลำดับ
- **เปลี่ยนรหัสผ่าน**

---

## File Structure

```
nbu-it/
├── server.js               # Express backend — REST API + middleware
├── migrate.js              # One-time JSON → PostgreSQL migration
├── package.json
├── Dockerfile              # Multi-stage Node 22 build (port 8080)
├── fly.toml                # Fly.io config (region: sin)
├── .github/
│   └── workflows/fly.yml   # GitHub Actions auto-deploy
│
├── index.html              # Homepage (13 sections)
├── news.html               # รายการข่าว
├── news-detail.html        # รายละเอียดข่าว
├── services.html           # รายการบริการ
├── service-detail.html     # รายละเอียดบริการ
│
├── css/style.css           # Main stylesheet (~1360 lines)
├── js/main.js              # Frontend JS (optimized)
│
├── admin/
│   ├── index.html          # Admin SPA
│   ├── css/admin.css
│   └── js/admin.js         # CRUD operations
│
└── data/                   # JSON backup (ก่อน migrate)
    ├── news.json
    ├── announcements.json
    ├── documents.json
    ├── faq.json
    ├── services.json
    └── users.json
```

---

## API Reference

### Public Endpoints (ไม่ต้อง authentication)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/news` | ข่าวทั้งหมด (เรียงใหม่ก่อน) |
| GET | `/api/news/:id` | ข่าวรายตัว |
| GET | `/api/announcements` | ประกาศทั้งหมด (เรียงใหม่ก่อน) |
| GET | `/api/documents` | เอกสารทั้งหมด |
| GET | `/api/faq` | FAQ ทั้งหมด |
| GET | `/api/services` | บริการทั้งหมด |
| GET | `/api/services/:id` | บริการรายตัว |

### Protected Endpoints (ต้องส่ง `X-Auth-Token` header)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/login` | Login (`username`, `password`) |
| POST | `/api/change-password` | เปลี่ยนรหัสผ่าน |
| POST | `/api/{resource}` | สร้างรายการใหม่ |
| PUT | `/api/{resource}/:id` | แก้ไขรายการ |
| DELETE | `/api/{resource}/:id` | ลบรายการ |
| POST | `/api/upload` | อัปโหลดไฟล์ไป Cloudinary (max 10MB) |
| GET | `/api/stats` | สถิติ dashboard |

`{resource}` = `news` / `announcements` / `documents` / `faq` / `services`

---

## Database Schema

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

## Services (12 รายการ)

| # | บริการ | หมวด |
|---|--------|------|
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

## Deployment

### Koyeb (Production — แนะนำ)

1. เชื่อมต่อ GitHub repo `Akkadate/oitwebv2`
2. Region: **Singapore**, Runtime: **Node**
3. Build command: `npm install`
4. Start command: `npm start`
5. ตั้ง Environment Variables ทั้ง 4 ตัว
6. Auto-deploy ทุกครั้งที่ push to `main`

### Fly.io (Alternative)

1. เพิ่ม `FLY_API_TOKEN` ใน GitHub Secrets
2. Push to `main` → GitHub Actions deploy อัตโนมัติ
3. Docker multi-stage build → port 8080

---

## External Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com) | PostgreSQL database | 500MB, 2 projects |
| [Cloudinary](https://cloudinary.com) | Image/file storage | 25GB storage + 25GB bandwidth/mo |
| [Koyeb](https://koyeb.com) | Hosting (no sleep) | 1 app, Singapore |
| Google Calendar | ปฏิทินกิจกรรม (embed) | Free |

---

## Contact

| ช่องทาง | ข้อมูล |
|---------|--------|
| ที่อยู่ | 6/999 ซอยพหลโยธิน 52 แขวงคลองถนน เขตสายไหม กรุงเทพฯ 10220 |
| โทร | 02-972-7200 ต่อ 220 |
| Email | oit.nbu@northbkk.ac.th |
| LINE | [@misnbu](https://lin.ee/DuKzeOE) |
| เวลาทำการ | ทุกวัน 08.30 – 17.30 น. |
