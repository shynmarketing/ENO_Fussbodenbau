// Vercel Serverless Function: nimmt das Anfrageformular entgegen und versendet es über Resend.
// Benötigte Umgebungsvariablen in Vercel:
//   RESEND_API_KEY  – API-Key aus Resend (nur "Sending access")
//   MAIL_TO         – Empfänger, z. B. info@eno-fussbodenbau.de
//   MAIL_FROM       – Absender auf der verifizierten Domain, z. B. "ENO Website <website@eno-fussbodenbau.de>"

const MAX = { name: 100, telefon: 40, email: 160, ort: 80, leistung: 80, flaeche: 20, nachricht: 4000 };

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\r/g, '').trim().slice(0, max);
}
function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Methode nicht erlaubt.' });
  }

  // Nur Anfragen von der eigenen Seite annehmen
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  if (origin && host && !origin.endsWith('://' + host)) {
    return res.status(403).json({ ok: false, error: 'Ungültige Herkunft.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Spam-Schutz: verstecktes Feld muss leer sein, Formular muss mind. 3 Sekunden offen gewesen sein
  if (clean(body.website, 200) !== '') return res.status(200).json({ ok: true });
  const started = Number(body.t || 0);
  if (!started || Date.now() - started < 3000) return res.status(200).json({ ok: true });

  const data = {};
  for (const key of Object.keys(MAX)) data[key] = clean(body[key], MAX[key]);

  const errors = [];
  if (!data.name) errors.push('Name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('gültige E-Mail-Adresse');
  if (!data.nachricht) errors.push('Nachricht');
  if (body.consent !== true) errors.push('Zustimmung zur Datenschutzerklärung');
  if (errors.length) return res.status(400).json({ ok: false, error: 'Bitte ergänzen Sie: ' + errors.join(', ') + '.' });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MAIL_TO || 'info@eno-fussbodenbau.de';
  const from = process.env.MAIL_FROM || 'ENO Website <website@eno-fussbodenbau.de>';
  if (!apiKey) return res.status(500).json({ ok: false, error: 'Der E-Mail-Versand ist noch nicht eingerichtet.' });

  const rows = [
    ['Name', data.name],
    ['Telefon', data.telefon || '–'],
    ['E-Mail', data.email],
    ['Ort / PLZ', data.ort || '–'],
    ['Gewünschte Leistung', data.leistung || '–'],
    ['Fläche ca.', data.flaeche ? data.flaeche + ' m²' : '–'],
  ];
  const text = rows.map(([k, v]) => k + ': ' + v).join('\n') + '\n\nNachricht:\n' + data.nachricht;
  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#141517;line-height:1.5">' +
    '<h2 style="margin:0 0 16px;font-size:18px">Neue Anfrage über eno-fussbodenbau.de</h2>' +
    '<table cellpadding="6" style="border-collapse:collapse">' +
    rows.map(([k, v]) => '<tr><td style="color:#5B5D61;padding-right:16px">' + esc(k) + '</td><td><strong>' + esc(v) + '</strong></td></tr>').join('') +
    '</table><p style="margin:20px 0 6px;color:#5B5D61">Nachricht:</p>' +
    '<p style="margin:0;white-space:pre-wrap">' + esc(data.nachricht) + '</p>' +
    '<p style="margin-top:24px;font-size:12px;color:#8a8a8a">Einfach auf diese E-Mail antworten, um dem Kunden zu schreiben.</p></div>';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject: 'Neue Anfrage: ' + data.name + (data.leistung ? ' – ' + data.leistung : ''),
        text,
        html,
      }),
    });
    if (!r.ok) {
      console.error('Resend-Fehler', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Die Anfrage konnte gerade nicht gesendet werden.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Versandfehler', e);
    return res.status(502).json({ ok: false, error: 'Die Anfrage konnte gerade nicht gesendet werden.' });
  }
};
