const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { to, imageData, pageUrl, resolution, iteration } = payload;

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Adresse courriel invalide' }) };
  }
  if (!imageData || !imageData.startsWith('data:image/png;base64,')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Image manquante' }) };
  }

  const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
  if (base64Data.length > 8 * 1024 * 1024) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: 'Image trop grande (max 6 Mo)' }) };
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration SMTP manquante' }) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
  });

  const res = resolution || '?';
  const iter = iteration ?? '?';
  const safeUrl = String(pageUrl || '').replace(/[<>"]/g, '');

  const subject = `Fractale IFS — ${res}×${res} px, itération ${iter}`;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;color:#222;">
  <h2 style="color:#1a7a8a;margin-bottom:6px;">Fractale IFS</h2>
  <p>Bonjour,</p>
  <p>Vous trouverez en pièce jointe une fractale IFS générée en
     <strong>${res}×${res}&nbsp;px</strong> à l'itération&nbsp;<strong>${iter}</strong>.</p>
  <p>Vous pouvez aussi la recréer interactivement à l'adresse suivante :</p>
  <p><a href="${safeUrl}" style="color:#1a7a8a;">${safeUrl}</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
  <p style="font-size:0.85em;color:#666;">
    Pierre-Olivier Parise<br>
    Université du Québec à Trois-Rivières
  </p>
</body></html>`;

  try {
    await transporter.sendMail({
      from: `"Pierre-Olivier Parise" <${smtpUser}>`,
      to,
      subject,
      html,
      attachments: [{
        filename: `ifs-fractal-iter${iter}.png`,
        content: base64Data,
        encoding: 'base64',
        contentType: 'image/png',
      }],
    });
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('SMTP error:', err.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Échec de l\'envoi SMTP' }) };
  }
};
