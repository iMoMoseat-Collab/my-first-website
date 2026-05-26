// =============================================================
// api/announcement.js — handles both announcement + articles
// Environment Variables needed on Vercel:
//   GITHUB_TOKEN, ADMIN_PASSWORD, GITHUB_REPO, GITHUB_FILE
//   GITHUB_ARTICLES_FILE  (e.g. _data/articles.json)
// =============================================================

const REPO           = process.env.GITHUB_REPO;
const FILE_PATH      = process.env.GITHUB_FILE;
const ARTICLES_PATH  = process.env.GITHUB_ARTICLES_FILE || "_data/articles.json";
const TOKEN          = process.env.GITHUB_TOKEN;
const PASSWORD       = process.env.ADMIN_PASSWORD;

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

function toB64(obj) {
    return Buffer.from(JSON.stringify(obj), "utf-8").toString("base64");
}
function fromB64(str) {
    return JSON.parse(Buffer.from(str, "base64").toString("utf-8"));
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    const url  = new URL(req.url, `https://${req.headers.host}`);
    const type = url.searchParams.get("type") || "announcement";

    // ── GET ──────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            if (type === "articles") {
                const data = await ghGet(ARTICLES_PATH);
                return res.status(200).json({ articles: fromB64(data.content), sha: data.sha });
            } else {
                const data = await ghGet(FILE_PATH);
                const parsed = fromB64(data.content);
                return res.status(200).json({ text: parsed.text, sha: data.sha });
            }
        } catch (err) {
            return res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ", detail: err.message });
        }
    }

    // ── POST ─────────────────────────────────────────────────
    if (req.method === "POST") {
        const body = req.body || {};
        if (!body.password || body.password !== PASSWORD) {
            return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }

        try {
            if (type === "articles") {
                // body.articles = full articles array
                if (!Array.isArray(body.articles)) return res.status(400).json({ error: "ข้อมูล articles ไม่ถูกต้อง" });
                const latest = await ghGet(ARTICLES_PATH);
                await ghPut(ARTICLES_PATH, toB64(body.articles), latest.sha, "Update articles via admin panel");
                return res.status(200).json({ ok: true });
            } else {
                if (!body.text) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
                const latest = await ghGet(FILE_PATH);
                await ghPut(FILE_PATH, toB64({ text: body.text.trim() }), latest.sha, "Update announcement via admin panel");
                return res.status(200).json({ ok: true });
            }
        } catch (err) {
            return res.status(500).json({ error: "อัปเดตไม่สำเร็จ", detail: err.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
