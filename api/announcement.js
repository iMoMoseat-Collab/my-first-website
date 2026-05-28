// =============================================================
// api/announcement.js — Vercel Serverless Function
// Handles: announcement, articles, reviews, faq
// Environment Variables:
//   GITHUB_TOKEN, ADMIN_PASSWORD, GITHUB_REPO
//   GITHUB_FILE              (_data/announcement.json)
//   GITHUB_ARTICLES_FILE     (_data/articles.json)
//   GITHUB_REVIEWS_FILE      (_data/reviews.json)
//   GITHUB_FAQ_FILE          (_data/faq.json)
// =============================================================

const REPO     = process.env.GITHUB_REPO;
const TOKEN    = process.env.GITHUB_TOKEN;
const PASSWORD = process.env.ADMIN_PASSWORD;

const FILES = {
    announcement: process.env.GITHUB_FILE              || "_data/announcement.json",
    articles:     process.env.GITHUB_ARTICLES_FILE     || "_data/articles.json",
    reviews:      process.env.GITHUB_REVIEWS_FILE      || "_data/reviews.json",
    faq:          process.env.GITHUB_FAQ_FILE          || "_data/faq.json",
    pricing:      process.env.GITHUB_PRICING_FILE       || "_data/pricing.json",
    announcements: process.env.GITHUB_ANNOUNCEMENTS_FILE || "_data/announcements.json",
    doctor:        process.env.GITHUB_DOCTOR_FILE        || "_data/doctor.json",
    bookings:      process.env.GITHUB_BOOKINGS_FILE      || "_data/bookings.json",
    settings:      process.env.GITHUB_SETTINGS_FILE      || "_data/settings.json",
};

async function ghGet(path) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        headers: { Authorization: `token ${TOKEN}`, "User-Agent": "morkhwan-clinic-app" },
    });
    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
    return res.json();
}

async function ghPut(path, content, sha, message) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: "PUT",
        headers: { Authorization: `token ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "morkhwan-clinic-app" },
        body: JSON.stringify({ message, content, sha }),
    });
    if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status}`);
    return res.json();
}

function toB64(obj)  { return Buffer.from(JSON.stringify(obj), "utf-8").toString("base64"); }
function fromB64(s)  { return JSON.parse(Buffer.from(s, "base64").toString("utf-8")); }

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    const url  = new URL(req.url, `https://${req.headers.host}`);
    const type = url.searchParams.get("type") || "announcement";
    const file = FILES[type];
    if (!file) return res.status(400).json({ error: "ประเภทข้อมูลไม่ถูกต้อง" });

    // ── GET ──────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const data = await ghGet(file);
            const parsed = fromB64(data.content);
            if (type === "announcement") {
                return res.status(200).json({ text: parsed.text, sha: data.sha });
            }
            if (type === "doctor") {
                return res.status(200).json({ doctor: parsed, sha: data.sha });
            }
            if (type === "settings") {
                return res.status(200).json({ settings: parsed, sha: data.sha });
            }
            if (type === "announcements") {
                const arr = Array.isArray(parsed) ? parsed : [];
                return res.status(200).json({ announcements: arr, sha: data.sha });
            }
            return res.status(200).json({ [type]: Array.isArray(parsed) ? parsed : [], sha: data.sha });
        } catch (err) {
            // ถ้าไฟล์ยังไม่มี return ค่าว่าง
            if (err.message.includes("404") || err.message.includes("GET failed")) {
                if (type === "announcement") return res.status(200).json({ text: "ยินดีต้อนรับสู่คลินิกหมอขวัญ", sha: "" });
                return res.status(200).json({ [type]: [], sha: "" });
            }
            return res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ", detail: err.message });
        }
    }

    // ── POST ─────────────────────────────────────────────────
    if (req.method === "POST") {
        const body = req.body || {};
        // bookings POST จากลูกค้า ไม่ต้อง password
        // แต่ถ้าเป็น admin update (body.bookings) ต้อง password
        const needsAuth = type !== "bookings" || body.bookings;
        if (needsAuth && (!body.password || body.password !== PASSWORD)) {
            return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }
        try {
            let newContent;
            if (type === "announcement") {
                if (!body.text) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
                newContent = { text: body.text.trim() };
            } else if (type === "doctor") {
                if (!body.doctor || typeof body.doctor !== "object") return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
                newContent = body.doctor;
            } else if (type === "settings") {
                if (!body.settings || typeof body.settings !== "object") return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
                newContent = body.settings;
            } else if (type === "bookings" && body.booking) {
                // append booking ใหม่เข้า array
                let existing = [];
                try { const d = await ghGet(FILES.bookings); existing = fromB64(d.content); } catch {}
                if (!Array.isArray(existing)) existing = [];
                newContent = [...existing, body.booking];
            } else if (type === "bookings" && body.bookings) {
                // admin update bookings array
                if (!body.password || body.password !== PASSWORD) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
                newContent = body.bookings;
            } else if (type === "announcements") {
                if (!Array.isArray(body.announcements)) return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
                newContent = body.announcements;
            } else {
                const key = type; // articles / reviews / faq / pricing
                if (!Array.isArray(body[key])) return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
                newContent = body[key];
            }

            // ดึง sha ล่าสุดก่อน PUT เสมอ ป้องกัน 409
            let sha = "";
            try {
                const latest = await ghGet(file);
                sha = latest.sha;
            } catch {
                // ไฟล์ยังไม่มี — สร้างใหม่ได้เลย (sha ว่าง = create)
            }

            await ghPut(file, toB64(newContent), sha, `Update ${type} via admin panel`);
            return res.status(200).json({ ok: true });
        } catch (err) {
            return res.status(500).json({ error: "อัปเดตไม่สำเร็จ", detail: err.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
