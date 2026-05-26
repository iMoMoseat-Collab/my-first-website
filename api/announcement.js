// =============================================================
// api/announcement.js  —  Vercel Serverless Function
// Deploy บน Vercel และตั้งค่า Environment Variables:
//   GITHUB_TOKEN   = ghp_xxxxxxxxxxxxxxxxxxxx
//   ADMIN_PASSWORD = รหัสผ่านที่ต้องการ
//   GITHUB_REPO    = owner/repo-name
//   GITHUB_FILE    = _data/announcement.json
// =============================================================

const REPO      = process.env.GITHUB_REPO;
const FILE_PATH = process.env.GITHUB_FILE;
const TOKEN     = process.env.GITHUB_TOKEN;
const PASSWORD  = process.env.ADMIN_PASSWORD;

// Helper: ดึงข้อมูลจาก GitHub
async function getFileFromGitHub() {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `token ${TOKEN}`,
            "User-Agent":  "morkhwan-clinic-app",
        },
    });
    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
    return res.json();
}

// Helper: อัปเดตข้อมูลบน GitHub
async function putFileToGitHub(content, sha) {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `token ${TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent":   "morkhwan-clinic-app",
        },
        body: JSON.stringify({
            message: "Update announcement via admin panel",
            content,
            sha,
        }),
    });
    if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status}`);
    return res.json();
}

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    // ─── GET: ดึงข้อความประกาศ ────────────────────────────────
    if (req.method === "GET") {
        try {
            const data        = await getFileFromGitHub();
            const decoded     = Buffer.from(data.content, "base64").toString("utf-8");
            const parsed      = JSON.parse(decoded);
            return res.status(200).json({ text: parsed.text, sha: data.sha });
        } catch (err) {
            return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลได้", detail: err.message });
        }
    }

    // ─── POST: อัปเดตข้อความประกาศ (ต้องผ่าน password) ──────
    if (req.method === "POST") {
        const { password, text, sha } = req.body || {};

        // ตรวจสอบ password ฝั่ง server
        if (!password || password !== PASSWORD) {
            return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
        }
        if (!text || !sha) {
            return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
        }

        try {
            const jsonStr    = JSON.stringify({ text: text.trim() });
            const b64Content = Buffer.from(jsonStr, "utf-8").toString("base64");
            await putFileToGitHub(b64Content, sha);
            return res.status(200).json({ ok: true, message: "อัปเดตสำเร็จ" });
        } catch (err) {
            return res.status(500).json({ error: "อัปเดตไม่สำเร็จ", detail: err.message });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
