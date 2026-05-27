# 🏥 หมอขวัญแพทย์แผนจีน — คู่มือ Config & Deploy

## 📁 โครงสร้างไฟล์ใน GitHub Repo

```
my-first-website/
│
├── index.html                  ← เว็บหลัก
├── sitemap.xml                 ← SEO: บอก Google ว่ามีหน้าอะไรบ้าง
├── robots.txt                  ← SEO: อนุญาต Google crawl
├── vercel.json                 ← Vercel config (ใส่แค่ {})
│
├── api/
│   └── announcement.js         ← Backend API (ประกาศ/บทความ/รีวิว/FAQ)
│
└── _data/                      ← ข้อมูลเว็บ (ห้ามลบ)
    ├── announcement.json
    ├── articles.json
    ├── reviews.json
    └── faq.json
```

---

## ⚙️ ขั้นตอนที่ 1 — ตั้งค่า Environment Variables บน Vercel

> Vercel Dashboard → Project → Settings → Environment Variables

| Key | Value |
|---|---|
| `GITHUB_TOKEN` | Personal Access Token (scope: `repo`) สร้างที่ github.com/settings/tokens |
| `ADMIN_PASSWORD` | รหัสผ่าน Admin ที่ต้องการ |
| `GITHUB_REPO` | `iMoMoseat-Collab/my-first-website` |
| `GITHUB_FILE` | `_data/announcement.json` |
| `GITHUB_ARTICLES_FILE` | `_data/articles.json` |
| `GITHUB_REVIEWS_FILE` | `_data/reviews.json` |
| `GITHUB_FAQ_FILE` | `_data/faq.json` |

> ⚠️ หลังเพิ่ม/แก้ไข Environment Variables ต้องกด **Redeploy** ทุกครั้ง

---

## 📂 ขั้นตอนที่ 2 — สร้างไฟล์ข้อมูลใน GitHub

สร้าง folder `_data` และไฟล์ดังนี้ (Add file → Create new file บน GitHub):

**`_data/announcement.json`**
```json
{"text": "ยินดีต้อนรับสู่คลินิกหมอขวัญแพทย์แผนจีน คลินิกเปิดทำการปกติค่ะ"}
```

**`_data/articles.json`** → copy เนื้อหาจาก `_data_articles_seed.json`

**`_data/reviews.json`** → copy เนื้อหาจาก `_data_reviews_seed.json`

**`_data/faq.json`** → copy เนื้อหาจาก `_data_faq_seed.json`

---

## 🚀 ขั้นตอนที่ 3 — Deploy

1. Push ไฟล์ทั้งหมดขึ้น GitHub (branch: `main`)
2. Vercel จะ deploy อัตโนมัติทุกครั้งที่ push
3. รอ ~1 นาที → เปิด https://morkwantcm.vercel.app ได้เลย

> ถ้า deploy ไม่ผ่าน → ไปดู Vercel Dashboard → Deployments → Build Logs

---

## 🔍 ขั้นตอนที่ 4 — ตั้งค่า SEO (ทำครั้งเดียว)

### Google Search Console
1. ไปที่ https://search.google.com/search-console
2. Add Property → URL prefix → `https://morkwantcm.vercel.app`
3. ยืนยันด้วย HTML tag → ✅ ใส่ใน `index.html` แล้ว
4. ไปที่ **Sitemaps** → Submit: `https://morkwantcm.vercel.app/sitemap.xml`

### Google Business Profile
1. ไปที่ https://business.google.com
2. ชื่อธุรกิจ: `หมอขวัญแพทย์แผนจีน`
3. ประเภท: `Traditional Chinese Medicine`
4. ที่อยู่: `148/6 ม.2 ต.สุรศักดิ์ อ.ศรีราชา จ.ชลบุรี 20110`
5. เบอร์: `064-668-9544`
6. เว็บไซต์: `https://morkwantcm.vercel.app`
7. ยืนยันตัวตนผ่าน SMS หรือโทรศัพท์

---

## 🖥️ วิธีใช้ Admin Panel

1. เปิดเว็บ → คลิกชื่อ **"หมอขวัญ"** มุมซ้ายบนของ navbar
2. กรอกรหัสผ่าน (`ADMIN_PASSWORD`)
3. เลือก Tab ที่ต้องการจัดการ:

| Tab | จัดการอะไร |
|---|---|
| 📢 ประกาศ | ข้อความแถบสีทองบนสุดของเว็บ |
| 📝 บทความ | เพิ่ม/แก้ไข/ลบ/ซ่อนบทความ พร้อมรูปภาพ |
| ⭐ รีวิว | เพิ่ม/แก้ไข/ลบรีวิวจากคนไข้ |
| ❓ FAQ | เพิ่ม/แก้ไข/ลบคำถามที่พบบ่อย |

---

## 🔒 Security

| ปัญหาเดิม | แก้ไขแล้ว |
|---|---|
| GitHub Token โชว์ใน HTML | ✅ เก็บใน Vercel Environment Variables |
| Admin Password โชว์ใน JS | ✅ ตรวจสอบฝั่ง Server เท่านั้น |
| 409 Conflict ตอน Save | ✅ ดึง sha ล่าสุดก่อน PUT ทุกครั้ง |

---

## 📞 ข้อมูลคลินิก

| | |
|---|---|
| **ที่อยู่** | 148/6 ม.2 ต.สุรศักดิ์ อ.ศรีราชา จ.ชลบุรี 20110 |
| **โทร** | 064-668-9544 |
| **Line OA** | @687dobfj |
| **Facebook** | sirikwantcm |
| **เวลาทำการ** | จันทร์ 10:00–17:00 / อังคาร–อาทิตย์ 16:30–20:00 |
| **เว็บไซต์** | https://morkwantcm.vercel.app |
