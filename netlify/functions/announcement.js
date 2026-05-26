/**
 * Netlify Serverless Function: announcement.js
 * -----------------------------------------------
 * ทำหน้าที่เป็น Backend ที่ปลอดภัย
 * - GITHUB_TOKEN และ ADMIN_PASSWORD เก็บไว้ใน Environment Variables (ไม่โผล่ใน Client)
 * - Client เรียกมาที่ /.netlify/functions/announcement แทนการเรียก GitHub โดยตรง
 *
 * วิธีตั้งค่า Environment Variables ใน Netlify:
 *   Site settings → Environment variables → Add:
 *     GITHUB_TOKEN  = ghp_xxxxxxxxxxxxx   (Token ใหม่ที่ให้สิทธิ์แค่ repo:contents)
 *     ADMIN_PASSWORD = รหัสผ่านของคุณ
 *     REPO           = iMoMoseat-Collab/my-first-website
 *     FILE_PATH      = _data/announcement.json
 */

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const REPO          = process.env.REPO;
const FILE_PATH     = process.env.FILE_PATH;

const GITHUB_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

// ─── CORS Headers ────────────────────────────────────────────────────────────
const CORS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
};

// ─── Helper: ดึงข้อมูลจาก GitHub ─────────────────────────────────────────────
async function fetchFromGitHub() {
    const res = await fetch(`${GITHUB_API}?nocache=${Date.now()}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
    return res.json(); // { sha, content (base64), ... }
}

// ─── Helper: บันทึกข้อมูลไปยัง GitHub ───────────────────────────────────────
async function saveToGitHub(newText, sha) {
    const jsonString   = JSON.stringify({ text: newText });
    const base64Content = Buffer.from(jsonString, "utf-8").toString("base64");

    const res = await fetch(GITHUB_API, {
        method: "PUT",
        headers: {
            Authorization:  `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: "Update announcement via admin panel",
            content: base64Content,
            sha,
        }),
    });
    if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status}`);
    return res.json();
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {

    // Preflight CORS
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers: CORS, body: "" };
    }

    // ── GET: ดึงข้อความประกาศปัจจุบัน ──────────────────────────────────────
    if (event.httpMethod === "GET") {
        try {
            const data        = await fetchFromGitHub();
            const decoded     = Buffer.from(data.content, "base64").toString("utf-8");
            const { text }    = JSON.parse(decoded);
            return {
                statusCode: 200,
                headers: CORS,
                body: JSON.stringify({ text, sha: data.sha }),
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS,
                body: JSON.stringify({ error: "ดึงข้อมูลไม่สำเร็จ: " + err.message }),
            };
        }
    }

    // ── POST: อัปเดตข้อความประกาศ (ตรวจสอบรหัสผ่านฝั่ง Server) ────────────
    if (event.httpMethod === "POST") {
        let body;
        try {
            body = JSON.parse(event.body || "{}");
        } catch {
            return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON" }) };
        }

        const { password, newText } = body;

        // ✅ ตรวจสอบรหัสผ่านบน Server — Client ไม่มีทางรู้รหัสผ่านเลย
        if (!password || password !== ADMIN_PASSWORD) {
            return {
                statusCode: 401,
                headers: CORS,
                body: JSON.stringify({ error: "รหัสผ่านไม่ถูกต้อง" }),
            };
        }

        if (!newText || typeof newText !== "string" || newText.trim().length === 0) {
            return {
                statusCode: 400,
                headers: CORS,
                body: JSON.stringify({ error: "ข้อความประกาศต้องไม่ว่างเปล่า" }),
            };
        }

        try {
            // ดึง sha ล่าสุดก่อน แล้วค่อย save
            const current = await fetchFromGitHub();
            await saveToGitHub(newText.trim(), current.sha);
            return {
                statusCode: 200,
                headers: CORS,
                body: JSON.stringify({ success: true, text: newText.trim() }),
            };
        } catch (err) {
            return {
                statusCode: 500,
                headers: CORS,
                body: JSON.stringify({ error: "บันทึกไม่สำเร็จ: " + err.message }),
            };
        }
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method Not Allowed" }) };
};
