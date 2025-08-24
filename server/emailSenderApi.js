// utils/sendEmailBasic.js
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

const provider = (process.env.MAIL_PROVIDER || "").toLowerCase() === "sendgrid"
  ? "sendgrid"
  : "ethereal";

if (provider === "sendgrid") {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("[sendEmailBasic] SENDGRID_API_KEY חסר; בדקי .env");
  } else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
}
if (!process.env.MAIL_FROM) {
  console.warn("[sendEmailBasic] MAIL_FROM חסר; שימי שולח מאומת ב-.env");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}

function wrapRtlTemplate(subject, innerHtml) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(subject||"")}</title></head>
<body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;text-align:right;direction:rtl;">
        <tr><td style="background:#0f172a;color:#fff;padding:16px 24px;font-size:18px;font-weight:700;">${escapeHtml(subject||"")}</td></tr>
        <tr><td style="padding:20px 24px;color:#111;line-height:1.7;font-size:15px;">${innerHtml||""}</td></tr>
        <tr><td style="padding:14px 24px;color:#64748b;font-size:12px;border-top:1px solid #e5e7eb;">הודעה נשלחה אוטומטית ממערכת הניהול.</td></tr>
      </table>
      <div style="color:#94a3b8;font-size:12px;margin-top:10px;text-align:center;">© ${new Date().getFullYear()} – מערכת הניהול</div>
    </td></tr>
  </table>
</body></html>`;
}

function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function sendStyledEmail(to, subject, bodyHtml, opts = {}) {
  const html = wrapRtlTemplate(subject, bodyHtml);
  const { text, cc, bcc, replyTo, attachments } = opts;

  if (provider === "sendgrid") {
    if (!process.env.MAIL_FROM) throw new Error("MAIL_FROM is not set.");
    const msg = {
      to,
      from: process.env.MAIL_FROM,
      subject,
      text: text || stripHtml(bodyHtml).slice(0, 2000),
      html,
      cc, bcc, replyTo
    };
    if (attachments?.length) {
      msg.attachments = attachments.map(a => {
        if (a.content && typeof a.content !== "string") {
          return {
            filename: a.filename,
            type: a.type,
            content: Buffer.isBuffer(a.content) ? a.content.toString("base64") : a.content,
            disposition: "attachment",
          };
        }
        return { ...a };
      });
    }
    const [resp] = await sgMail.send(msg);
    return { ok: resp.statusCode >= 200 && resp.statusCode < 300, provider, statusCode: resp.statusCode };
  }

  // Ethereal (dev)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email", port: 587, secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to, subject,
    text: text || stripHtml(bodyHtml).slice(0, 2000),
    html, cc, bcc, replyTo, attachments
  });
  return { ok: true, provider, previewUrl: nodemailer.getTestMessageUrl(info) };
}
