# 🏥 หมอขวัญแพทย์แผนจีน — คู่มือ Deploy

## โครงสร้างไฟล์

```
morkhwan/
├── index.html          ← ไฟล์เว็บหลัก (ปลอดภัย 100%)
├── api/
│   └── announcement.js ← Vercel Serverless Function (backend)
├── vercel.json         ← Vercel config
└── README.md
```

---

## 🔐 ขั้นตอน Deploy บน Vercel (ทำครั้งเดียว)

### 1. Revoke GitHub Token เก่าทันที!
ไปที่ https://github.com/settings/tokens → ลบ token เก่าที่หลุดออกมา

### 2. สร้าง GitHub Token ใหม่
- ไปที่ https://github.com/settings/tokens → "Generate new token (classic)"
- ติ๊ก scope: `repo` (หรือแค่ `public_repo` ถ้า repo เป็น public)
- Copy token ที่ได้

### 3. Push โปรเจกต์นี้ขึ้น GitHub Repo เดิม
```bash
git add .
git commit -m "Security fix: move secrets to backend"
git push
```

### 4. ตั้งค่า Environment Variables บน Vercel
ไปที่ Vercel Dashboard → Project → Settings → Environment Variables

| Key              | Value (ตัวอย่าง)                      |
|------------------|---------------------------------------|
| GITHUB_TOKEN     | ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx      |
| ADMIN_PASSWORD   | รหัสผ่านใหม่ที่ต้องการ               |
| GITHUB_REPO      | iMoMoseat-Collab/my-first-website     |
| GITHUB_FILE      | _data/announcement.json              |

### 5. อัปเดต API_BASE ใน index.html
เปิดไฟล์ `index.html` บรรทัด:
```javascript
const API_BASE = "";   // ← ใส่ URL Vercel ของคุณ
```
เปลี่ยนเป็น:
```javascript
const API_BASE = "https://ชื่อโปรเจกต์ของคุณ.vercel.app";
```

### 6. Deploy!
Vercel จะ deploy อัตโนมัติเมื่อ push ขึ้น GitHub

---

## ✅ สิ่งที่แก้ไขในเวอร์ชันนี้

| ปัญหาเดิม | วิธีแก้ |
|---|---|
| GitHub Token โชว์ใน HTML | ย้ายไปเก็บใน Vercel Environment Variables |
| Admin Password โชว์ใน JS | ตรวจสอบผ่าน Server เท่านั้น |
| ไม่มี meta description / OG tags | เพิ่มครบแล้ว |
| `rel="noopener"` ขาด | เพิ่มแล้ว |
| Modal hidden ไม่ทำงานบางกรณี | แก้ CSS ให้ถูกต้อง |
| ไม่มี loading state บน buttons | เพิ่ม disabled + loading text |
| Quiz result ไม่ whitespace-pre | เพิ่ม `whitespace-pre-line` |

---

## 🔄 วิธีใช้งาน Admin Panel

1. คลิกที่ชื่อ "หมอขวัญ" มุมซ้ายบนของ navbar
2. กรอกรหัสผ่าน (ที่ตั้งใน `ADMIN_PASSWORD` บน Vercel)
3. แก้ไขข้อความประกาศ → กด "บันทึก"
4. ทุกเครื่องทั่วโลกจะเห็นข้อความใหม่ทันที
