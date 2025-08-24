// utils/sendEmailBasic.js
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

/**
 * שליחת מייל מעוצב RTL בפונקציה אחת.
 * בחירת ספק לפי .env:
 *   MAIL_PROVIDER=sendgrid  → שליחה אמיתית (SendGrid)
 *   MAIL_PROVIDER=ethereal  → תצוגת תצוגה (Ethereal) לפיתוח
 *
 * בחירת טרנספורט ב-SendGrid:
 *   MAIL_TRANSPORT=sg_http  (ברירת מחדל)  → HTTP API
 *   MAIL_TRANSPORT=sg_smtp                → SMTP (עקיפת SSL inspection ברשתות מסוימות)
 *
 * ערכי .env הנדרשים ל-SendGrid:
 *   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
 *   MAIL_FROM=your_verified_sender@example.com
 *   MAIL_FROM_NAME=Optional Friendly Name   (לא חובה)
 */

// --- קריאת קונפיגורציה מהסביבה ---
const rawProvider  = (process.env.MAIL_PROVIDER  || "").toLowerCase();
const rawTransport = (process.env.MAIL_TRANSPORT || "sg_http").toLowerCase();

let provider = rawProvider === "sendgrid" ? "sendgrid" : "ethereal";

// נוודא שיש נתונים בסיסיים; אם חסר מפתח ב-SendGrid – ניפול ל-Ethereal כדי לא לחסום פיתוח
if (provider === "sendgrid") {
  if (!process.env.MAIL_FROM) {
    console.warn("[sendEmailBasic] MAIL_FROM חסר; הגדירי שולח מאומת ב-.env");
  }

  if (rawTransport === "sg_http") {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("[sendEmailBasic] SENDGRID_API_KEY חסר (sg_http) – נופלים ל-Ethereal");
      provider = "ethereal";
    } else {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  } else if (rawTransport === "sg_smtp") {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("[sendEmailBasic] SENDGRID_API_KEY חסר (sg_smtp) – נופלים ל-Ethereal");
      provider = "ethereal";
    }
  } else {
    console.warn(`[sendEmailBasic] MAIL_TRANSPORT לא מזוהה (${rawTransport}) – משתמשים sg_http`);
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("[sendEmailBasic] SENDGRID_API_KEY חסר (sg_http) – נופלים ל-Ethereal");
      provider = "ethereal";
    } else {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
}

// --- עזרי HTML ---
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

function wrapRtlTemplate(subject, innerHtml) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(subject || "")}</title>
</head>
<body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0"
             style="width:600px;max-width:100%;background:#fff;border-radius:12px;
                    box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;text-align:right;direction:rtl;">
        <tr>
          <td style="background:#0f172a;color:#fff;padding:16px 24px;font-size:18px;font-weight:700;">
            ${escapeHtml(subject || "")}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;color:#111;line-height:1.7;font-size:15px;">
            ${innerHtml || ""}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 24px;color:#64748b;font-size:12px;border-top:1px solid #e5e7eb;">
            הודעה נשלחה אוטומטית ממערכת הניהול.
          </td>
        </tr>
      </table>
      <div style="color:#94a3b8;font-size:12px;margin-top:10px;text-align:center;">
        © ${new Date().getFullYear()} – מערכת הניהול
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// --- פונקציית שליחה הראשית ---
/**
 * שולח מייל מעוצב RTL.
 * @param {string|string[]} to       - כתובת/ות נמען
 * @param {string}          subject  - נושא
 * @param {string}          bodyHtml - גוף HTML (ייעטף בתבנית RTL)
 * @param {object}          opts     - { text, cc, bcc, replyTo, attachments }
 * @returns {Promise<{ok:boolean, provider:string, statusCode?:number, messageId?:string, previewUrl?:string}>}
 */
export async function sendStyledEmail(to, subject, bodyHtml, opts = {}) {
  const html = wrapRtlTemplate(subject, bodyHtml);
  const { text, cc, bcc, replyTo, attachments } = opts;

  const fromEmail = process.env.MAIL_FROM;
  const fromName  = process.env.MAIL_FROM_NAME;
  const fromForSgHttp = fromName ? { email: fromEmail, name: fromName } : fromEmail;
  const fromForSmtp   = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  // --- SENDGRID ---
  if (provider === "sendgrid") {
    if (!fromEmail) throw new Error("MAIL_FROM is not set (Single Sender/Domain חובה).");

    // SMTP טרנספורט (עוקף בעיות TLS/Proxy ברשתות מסוימות)
    if (rawTransport === "sg_smtp") {
      const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
        // לפיתוח בלבד במידת הצורך (לא מומלץ בפרודקשן):
        // tls: { rejectUnauthorized: false },
      });

      const info = await transporter.sendMail({
        from: fromForSmtp,
        to, subject,
        text: text || stripHtml(bodyHtml).slice(0, 2000),
        html, cc, bcc, replyTo,
        // ב-Nodemailer אפשר גם Buffer/path ישירות
        attachments,
      });

      return { ok: true, provider: "sendgrid-smtp", messageId: info.messageId };
    }

    // HTTP API (ברירת מחדל)
    const msg = {
      to,
      from: fromForSgHttp,
      subject,
      text: text || stripHtml(bodyHtml).slice(0, 2000),
      html,
      cc, bcc, replyTo,
    };

    if (attachments?.length) {
      // SendGrid HTTP צריך base64
      msg.attachments = attachments.map((a) => {
        if (a.content && typeof a.content !== "string") {
          return {
            filename: a.filename,
            type: a.type,
            content: Buffer.isBuffer(a.content)
              ? a.content.toString("base64")
              : a.content,
            disposition: "attachment",
          };
        }
        return { ...a };
      });
    }

    const [resp] = await sgMail.send(msg);
    return {
      ok: resp.statusCode >= 200 && resp.statusCode < 300,
      provider: "sendgrid-http",
      statusCode: resp.statusCode,
    };
  }

  // --- ETHEREAL (פיתוח) ---
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
    // אם גם כאן יש SSL inspection בסביבת פיתוח מסוימת, אפשר זמנית:
    // tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: fromForSmtp || "no-reply@example.com",
    to, subject,
    text: text || stripHtml(bodyHtml).slice(0, 2000),
    html, cc, bcc, replyTo,
    attachments,
  });

  return {
    ok: true,
    provider: "ethereal",
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}
