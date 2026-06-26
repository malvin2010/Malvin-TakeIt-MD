const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const http = require('http')
const { handleCommand } = require('./commands/index')

// ─── Landing Page HTML (served at /) ──────────────────────────────────────
const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Malvin TakeIt MD — Pair Your Bot</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{--purple:#a000ff;--purple-dim:#6600cc;--purple-glow:rgba(160,0,255,0.35);--bg:#07000f;--surface:#0f0020;--border:rgba(160,0,255,0.2);--text:#e8e0f0;--muted:#6a5f7a}
  body{background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;min-height:100vh;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;z-index:0;background:radial-gradient(ellipse 60% 50% at 10% 20%,rgba(160,0,255,0.12) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 90% 80%,rgba(80,0,200,0.1) 0%,transparent 60%);pointer-events:none}
  body::after{content:'';position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(160,0,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(160,0,255,0.04) 1px,transparent 1px);background-size:50px 50px;pointer-events:none}
  .wrap{position:relative;z-index:1;max-width:480px;margin:0 auto;padding:24px 20px 60px}
  header{text-align:center;padding:40px 0 28px}
  .bot-icon{width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(160,0,255,0.2),rgba(7,0,15,0.8));border:2px solid var(--border);box-shadow:0 0 40px var(--purple-glow);display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 16px;animation:pulse 3s ease-in-out infinite}
  @keyframes pulse{0%,100%{box-shadow:0 0 30px var(--purple-glow)}50%{box-shadow:0 0 60px rgba(160,0,255,0.55)}}
  .brand{font-size:11px;letter-spacing:4px;color:var(--purple);text-transform:uppercase;margin-bottom:8px}
  h1{font-size:32px;font-weight:800;line-height:1.1;color:#fff}
  h1 span{color:var(--purple)}
  .sub{font-size:14px;color:var(--muted);margin-top:8px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:16px;position:relative;overflow:hidden}
  .card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--purple),transparent)}
  .card-title{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--purple);margin-bottom:16px}
  .step-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
  label{font-size:13px;color:var(--muted);display:block;margin-bottom:8px}
  input[type=text]{width:100%;background:rgba(160,0,255,0.05);border:1px solid var(--border);border-radius:10px;padding:14px 16px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:15px;outline:none;transition:border-color .2s,box-shadow .2s}
  input:focus{border-color:var(--purple);box-shadow:0 0 0 3px rgba(160,0,255,0.15)}
  input::placeholder{color:var(--muted);opacity:.6}
  .btn-primary{width:100%;background:linear-gradient(135deg,var(--purple),var(--purple-dim));color:#fff;border:none;border-radius:12px;padding:16px;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .2s,transform .1s,box-shadow .2s;box-shadow:0 4px 24px rgba(160,0,255,0.35);letter-spacing:.5px;margin-top:8px;display:block}
  .btn-primary:hover{opacity:.9;box-shadow:0 6px 32px rgba(160,0,255,0.5)}
  .btn-primary:active{transform:scale(.98)}
  .btn-primary:disabled{opacity:.4;cursor:not-allowed}
  .status{display:none;align-items:center;gap:10px;padding:14px 16px;border-radius:10px;font-size:13px;font-weight:600;margin-top:12px}
  .status.visible{display:flex}
  .status.loading{background:rgba(160,0,255,0.08);border:1px solid var(--border);color:var(--muted)}
  .status.success{background:rgba(0,200,80,0.08);border:1px solid rgba(0,200,80,0.3);color:#00c850}
  .status.error{background:rgba(255,50,50,0.08);border:1px solid rgba(255,50,50,0.3);color:#ff5050}
  .spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(160,0,255,0.3);border-top-color:var(--purple);animation:spin .8s linear infinite;flex-shrink:0}
  @keyframes spin{to{transform:rotate(360deg)}}
  .code-box{background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:10px;padding:20px;text-align:center;margin:16px 0;display:none}
  .code-box.visible{display:block}
  .pair-code{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;color:var(--purple);letter-spacing:10px;text-shadow:0 0 20px var(--purple-glow)}
  .code-hint{font-size:12px;color:var(--muted);margin-top:8px}
  .countdown{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);margin-top:6px}
  .stats-bar{display:flex;justify-content:space-around;padding:16px 0}
  .stat{text-align:center}
  .stat-n{font-size:24px;font-weight:800;color:var(--purple)}
  .stat-l{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
  .steps{display:flex;flex-direction:column;gap:12px}
  .step{display:flex;align-items:flex-start;gap:12px;font-size:13px;color:var(--muted);line-height:1.5}
  .step-num{min-width:24px;height:24px;border-radius:50%;background:rgba(160,0,255,0.15);border:1px solid var(--border);color:var(--purple);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
  .links{display:flex;gap:12px;margin-top:4px}
  .link-btn{flex:1;padding:14px 12px;background:rgba(160,0,255,0.06);border:1px solid var(--border);border-radius:12px;color:var(--text);text-decoration:none;text-align:center;font-size:13px;font-weight:600;transition:background .2s,border-color .2s}
  .link-btn:hover{background:rgba(160,0,255,0.12);border-color:var(--purple)}
  .link-icon{display:block;font-size:20px;margin-bottom:4px}
  footer{text-align:center;padding:28px 0 0}
  .footer-brand{font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="bot-icon">🤖</div>
    <div class="brand">Handsome Tech Zimbabwe</div>
    <h1>Malvin <span>TakeIt MD</span></h1>
    <p class="sub">WhatsApp Multi-Device Bot · 80+ Commands</p>
  </header>

  <div class="card" style="margin-bottom:20px">
    <div class="stats-bar">
      <div class="stat"><div class="stat-n">60+</div><div class="stat-l">Economy</div></div>
      <div class="stat"><div class="stat-n">20</div><div class="stat-l">VPN Cmds</div></div>
      <div class="stat"><div class="stat-n">80+</div><div class="stat-l">Total</div></div>
    </div>
  </div>

  <div class="step-label">⚡ Quick Pair</div>
  <div class="card">
    <div class="card-title">📱 Enter Your Number</div>
    <label>WhatsApp number with country code</label>
    <input type="text" id="phoneInput" placeholder="263771234567" maxlength="15">
    <button class="btn-primary" id="pairBtn" onclick="requestCode()">Get Pairing Code</button>

    <div class="status loading" id="statusLoading">
      <div class="spinner"></div><span>Requesting code from bot...</span>
    </div>
    <div class="status success" id="statusSuccess">✅ Code ready! Enter it in WhatsApp now.</div>
    <div class="status error" id="statusError">❌ <span id="errorMsg">Something went wrong.</span></div>

    <div class="code-box" id="codeBox">
      <div class="pair-code" id="pairCode">----</div>
      <div class="code-hint">WhatsApp → Linked Devices → Link with phone number</div>
      <div class="countdown" id="countdown">⏱ Expires in 60s</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📖 How to Pair</div>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><span>Enter your number above and tap <b>Get Pairing Code</b></span></div>
      <div class="step"><div class="step-num">2</div><span>Open WhatsApp → 3 dots → <b>Linked Devices</b></span></div>
      <div class="step"><div class="step-num">3</div><span>Tap <b>Link with phone number</b> and enter the code</span></div>
      <div class="step"><div class="step-num">4</div><span>Bot connects! Type <b>.menu</b> to start</span></div>
    </div>
  </div>

  <div class="links">
    <a href="https://whatsapp.com/channel/YOUR_CHANNEL" class="link-btn" target="_blank"><span class="link-icon">📢</span>WA Channel</a>
    <a href="https://t.me/handsometechzw" class="link-btn" target="_blank"><span class="link-icon">✈️</span>Telegram</a>
    <a href="https://github.com/malvinzw" class="link-btn" target="_blank"><span class="link-icon">💻</span>GitHub</a>
  </div>

  <footer><div class="footer-brand">© 2026 Handsome Tech Zimbabwe</div></footer>
</div>

<script>
  let countdownTimer = null

  function showStatus(type) {
    ['Loading','Success','Error'].forEach(t => document.getElementById('status'+t).classList.remove('visible'))
    if (type) document.getElementById('status'+type).classList.add('visible')
  }

  async function requestCode() {
    const phone = document.getElementById('phoneInput').value.trim().replace(/\\D/g,'')
    if (!phone || phone.length < 9) {
      document.getElementById('errorMsg').textContent = 'Enter a valid number with country code.'
      showStatus('Error'); return
    }
    const btn = document.getElementById('pairBtn')
    btn.disabled = true
    document.getElementById('codeBox').classList.remove('visible')
    showStatus('Loading')
    try {
      const res = await fetch('/pair?phone=' + phone)
      const data = await res.json()
      if (data.code) {
        document.getElementById('pairCode').textContent = data.code
        document.getElementById('codeBox').classList.add('visible')
        showStatus('Success')
        startCountdown(60)
      } else {
        throw new Error(data.error || 'No code returned')
      }
    } catch(err) {
      document.getElementById('errorMsg').textContent = err.message
      showStatus('Error')
    }
    btn.disabled = false
  }

  function startCountdown(s) {
    if (countdownTimer) clearInterval(countdownTimer)
    const el = document.getElementById('countdown')
    countdownTimer = setInterval(() => {
      s--
      el.textContent = '⏱ Expires in ' + s + 's'
      if (s <= 0) {
        clearInterval(countdownTimer)
        el.textContent = '⚠️ Expired. Request a new one.'
        document.getElementById('codeBox').classList.remove('visible')
        showStatus(null)
      }
    }, 1000)
  }

  document.getElementById('phoneInput').addEventListener('keydown', e => { if(e.key==='Enter') requestCode() })
</script>
</body>
</html>`

// ─── HTTP Server (Landing + /pair API) ────────────────────────────────────
let globalSock = null

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  // Serve landing page
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html')
    return res.end(LANDING_HTML)
  }

  // Pairing API
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (url.pathname === '/pair' && req.method === 'GET') {
    const phone = url.searchParams.get('phone')
    if (!phone) return res.end(JSON.stringify({ error: 'Phone number required' }))
    if (!globalSock) return res.end(JSON.stringify({ error: 'Bot not ready yet, wait a few seconds and retry' }))
    try {
      const code = await globalSock.requestPairingCode(phone.replace(/\D/g, ''))
      return res.end(JSON.stringify({ code }))
    } catch (e) {
      return res.end(JSON.stringify({ error: e.message }))
    }
  }

  // Health check
  if (url.pathname === '/status') {
    return res.end(JSON.stringify({
      bot: globalSock ? 'online' : 'connecting',
      name: 'Malvin TakeIt MD',
      by: 'Handsome Tech Zimbabwe'
    }))
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Server running on port ${process.env.PORT || 3000}`)
})

// ─── WhatsApp Bot ──────────────────────────────────────────────────────────
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Malvin TakeIt MD', 'Chrome', '1.0.0'],
    markOnlineOnConnect: true,
  })

  globalSock = sock
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode
      const reconnect = code !== DisconnectReason.loggedOut
      console.log('❌ Disconnected. Code:', code, '| Reconnect:', reconnect)
      if (reconnect) startBot()
      else console.log('🔴 Logged out. Delete auth_info and restart.')
    } else if (connection === 'open') {
      console.log('✅ Malvin TakeIt MD Connected!')
    } else if (connection === 'connecting') {
      console.log('🔄 Connecting...')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption || ''

    if (!body.startsWith('.')) return

    const args = body.trim().split(/ +/)
    const command = args.shift().toLowerCase().slice(1)

    try {
      await handleCommand(sock, msg, from, command, args, body)
    } catch (e) {
      console.error('Command error:', e.message)
    }
  })
}

startBot()
