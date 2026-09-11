

'use strict';

const nodemailer = require('nodemailer');

const PROVIDER = (process.env.SMTP_PROVIDER || 'gmail').toLowerCase();

function createTransporter() {
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const config = PROVIDER === 'outlook'
        ? { host: 'smtp.office365.com', port: 587, secure: false, tls: { ciphers: 'SSLv3' },
            auth: { user, pass } }
        : { host: 'smtp.gmail.com', port: 587, secure: false,
            auth: { user, pass } };
    return nodemailer.createTransport(config);
}

/**
 * Kirim laporan kemajuan belajar ke email orang tua
 * @param {Object} opts
 * @param {string} opts.toEmail        - Email tujuan (orang tua)
 * @param {string} opts.childName      - Nama anak
 * @param {Object} opts.latestSession  - Sesi terakhir { grade, topicTitle, gameTitle, correct, total, score, stars }
 * @param {Object} opts.stats          - Statistik total { totalSessions, avgScore, totalStars }
 * @param {Array}  opts.recentReports  - 5 sesi terakhir
 */
async function sendProgressReport({ toEmail, childName, latestSession, stats, recentReports }) {
    const { grade, topicTitle, gameTitle, correct, total, score, stars } = latestSession;
    const starStr    = '⭐'.repeat(stars) || '—';
    const scoreColor = score >= 80 ? '#0f9b58' : score >= 50 ? '#e67e22' : '#c0392b';

    const recentRows = (recentReports || []).map(r => {
        const d      = new Date(r.date).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
        const rScore = r.score ?? 0;
        const rColor = rScore >= 80 ? '#0f9b58' : rScore >= 50 ? '#e67e22' : '#c0392b';
        const rStars = '⭐'.repeat(rScore >= 80 ? 3 : rScore >= 50 ? 2 : rScore >= 30 ? 1 : 0) || '—';
        return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#555">${d}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px">${r.grade || grade}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px">${r.topicTitle || r.topicId || ''}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px">${r.gameTitle || ''}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;color:${rColor};text-align:center">${rScore}%</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">${rStars}</td>
        </tr>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1fa;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1fa;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#783dc2,#a555f7);padding:32px;text-align:center">
            <p style="margin:0;font-size:2rem;font-weight:800;color:#fff;letter-spacing:-0.5px">🚀 Digi+wo</p>
            <p style="margin:8px 0 0;font-size:1rem;color:rgba(255,255,255,.85)">Laporan Kemajuan Belajar</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 32px 0">
            <p style="margin:0;font-size:1rem;color:#333">Halo Orang Tua/Wali dari <strong>${childName}</strong>,</p>
            <p style="margin:12px 0 0;font-size:.95rem;color:#555;line-height:1.6">
              Berikut laporan sesi belajar terbaru ${childName} di Digi+wo Math Hub.
            </p>
          </td>
        </tr>

        <!-- Sesi Terbaru -->
        <tr>
          <td style="padding:24px 32px">
            <p style="margin:0 0 14px;font-size:1rem;font-weight:700;color:#783dc2">📋 Sesi Terakhir</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6ff;border-radius:14px;padding:20px;border:2px solid #eddcff">
              <tr>
                <td style="padding:6px 0;color:#555;font-size:.9rem">Kelas</td>
                <td style="padding:6px 0;font-weight:700;color:#1b1c15;text-align:right">${grade}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:.9rem">Topik</td>
                <td style="padding:6px 0;font-weight:700;color:#1b1c15;text-align:right">${topicTitle}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:.9rem">Mode Game</td>
                <td style="padding:6px 0;font-weight:700;color:#1b1c15;text-align:right">${gameTitle}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:.9rem">Jawaban Benar</td>
                <td style="padding:6px 0;font-weight:700;color:#1b1c15;text-align:right">${correct} / ${total}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:.9rem">Skor</td>
                <td style="padding:6px 0;font-weight:800;color:${scoreColor};text-align:right;font-size:1.2rem">${score}%</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#555;font-size:.9rem">Bintang</td>
                <td style="padding:6px 0;text-align:right;font-size:1.1rem">${starStr}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Statistik Total -->
        <tr>
          <td style="padding:0 32px 24px">
            <p style="margin:0 0 14px;font-size:1rem;font-weight:700;color:#783dc2">📊 Statistik Total</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="text-align:center;background:#eddcff;border-radius:14px;padding:16px;margin:4px">
                  <div style="font-size:1.8rem;font-weight:800;color:#420080">${stats.totalSessions}</div>
                  <div style="font-size:.8rem;color:#783dc2;font-weight:600">Total Sesi</div>
                </td>
                <td width="4%"></td>
                <td width="33%" style="text-align:center;background:#ebe871;border-radius:14px;padding:16px">
                  <div style="font-size:1.8rem;font-weight:800;color:#636100">${stats.avgScore}%</div>
                  <div style="font-size:.8rem;color:#636100;font-weight:600">Rata-rata Skor</div>
                </td>
                <td width="4%"></td>
                <td width="33%" style="text-align:center;background:#ffdad9;border-radius:14px;padding:16px">
                  <div style="font-size:1.8rem;font-weight:800;color:#825152">${stats.totalStars}</div>
                  <div style="font-size:.8rem;color:#825152;font-weight:600">Total Bintang</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Riwayat Sesi -->
        ${recentRows ? `
        <tr>
          <td style="padding:0 32px 24px">
            <p style="margin:0 0 14px;font-size:1rem;font-weight:700;color:#783dc2">🗓️ 5 Sesi Terakhir</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:12px;overflow:hidden">
              <tr style="background:#f9f6ff">
                <th style="padding:10px;font-size:12px;color:#783dc2;text-align:left">Tanggal</th>
                <th style="padding:10px;font-size:12px;color:#783dc2;text-align:left">Kelas</th>
                <th style="padding:10px;font-size:12px;color:#783dc2;text-align:left">Topik</th>
                <th style="padding:10px;font-size:12px;color:#783dc2;text-align:left">Mode</th>
                <th style="padding:10px;font-size:12px;color:#783dc2;text-align:center">Skor</th>
                <th style="padding:10px;font-size:12px;color:#783dc2;text-align:center">Bintang</th>
              </tr>
              ${recentRows}
            </table>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="background:#f9f6ff;padding:24px 32px;text-align:center;border-top:2px solid #eddcff">
            <p style="margin:0;font-size:.85rem;color:#783dc2;font-weight:700">🚀 Digi+wo Math Hub</p>
            <p style="margin:6px 0 0;font-size:.8rem;color:#888">
              Email ini dikirim otomatis. Jangan balas email ini.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const transporter = createTransporter();
    await transporter.sendMail({
        from:    `"Digi+wo Math Hub" <${process.env.SMTP_USER}>`,
        to:      toEmail,
        subject: `📊 Laporan Belajar ${childName} — ${grade} · ${topicTitle}`,
        html
    });
}

module.exports = { sendProgressReport };
