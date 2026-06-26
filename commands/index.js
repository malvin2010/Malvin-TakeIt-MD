const fs = require('fs')
const path = require('path')

// ─── Economy Database (simple JSON file) ───────────────────────────────────
const DB_PATH = path.join(__dirname, '../lib/economy.json')

function loadDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}))
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function getUser(db, id) {
  if (!db[id]) {
    db[id] = {
      wallet: 500,
      bank: 0,
      xp: 0,
      level: 1,
      inventory: [],
      job: null,
      lastWork: 0,
      lastDaily: 0,
      lastRob: 0,
      lastFish: 0,
      lastMine: 0,
      lastHunt: 0,
      lastSlot: 0,
      lastCrime: 0,
      streak: 0,
      wins: 0,
      losses: 0,
      stock: {},
      land: 0,
      mined: 0,
      fished: 0,
      hunted: 0,
    }
  }
  return db[id]
}

// ─── VPN Files directory ────────────────────────────────────────────────────
const VPN_DIR = path.join(__dirname, '../vpnfiles')

function listVpnFiles() {
  if (!fs.existsSync(VPN_DIR)) return []
  return fs.readdirSync(VPN_DIR).filter(f =>
    ['.ovpn', '.conf', '.txt', '.json'].some(ext => f.endsWith(ext))
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const COOLDOWN = {
  work: 3600000,
  daily: 86400000,
  rob: 7200000,
  fish: 1800000,
  mine: 1800000,
  hunt: 1800000,
  slot: 30000,
  crime: 3600000,
}

function cooldownLeft(last, type) {
  const diff = Date.now() - last
  if (diff >= COOLDOWN[type]) return null
  const left = COOLDOWN[type] - diff
  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return `${m}m ${s}s`
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function addXP(user, amount) {
  user.xp += amount
  const needed = user.level * 100
  if (user.xp >= needed) {
    user.xp -= needed
    user.level += 1
    return true
  }
  return false
}

// ─── Main Handler ───────────────────────────────────────────────────────────
async function handleCommand(sock, msg, from, command, args, body) {
  const sender = msg.key.participant || msg.key.remoteJid
  const uid = sender.replace('@s.whatsapp.net', '')
  const db = loadDB()
  const user = getUser(db, uid)

  async function reply(text) {
    await sock.sendMessage(from, { text }, { quoted: msg })
  }

  // ─── BOT INFO ─────────────────────────────────────────────────────────────
  if (command === 'ping') {
    const start = Date.now()
    await reply(`🏓 *Malvin TakeIt MD*\n⚡ Ping: ${Date.now() - start}ms\n🤖 Status: Online`)
    return
  }

  if (command === 'menu' || command === 'help') {
    const menuText = `
╔══════════╗
║ 🤖 *MALVIN TAKEIT MD* ║
║ by Handsome Tech ZW ║
╚══════════╝

📌 *BOT INFO*
》.ping
》.botinfo
》.uptime

◇

💰 *ECONOMY — WALLET*
》.balance
》.deposit [amt]
》.withdraw [amt]
》.transfer @user [amt]
》.daily
》.streak

◇

🔨 *ECONOMY — EARN*
》.work
》.crime
》.fish
》.mine
》.hunt
》.beg
》.collect

◇

🎰 *ECONOMY — GAMBLE*
》.slots [amt]
》.flip [amt] [h/t]
》.dice [amt]
》.roulette [amt] [r/b]
》.blackjack [amt]
》.lottery
》.scratch

◇

🛒 *ECONOMY — SHOP*
》.shop
》.buy [item]
》.sell [item]
》.inventory
》.use [item]

◇

📈 *ECONOMY — INVEST*
》.stocks
》.buystock [sym] [amt]
》.sellstock [sym] [amt]
》.portfolio
》.land
》.buyland
》.sellland

◇

⚔️ *ECONOMY — RPG*
》.level
》.leaderboard
》.rob @user
》.bounty @user
》.quest
》.duel @user [amt]
》.profile

◇

🏦 *ECONOMY — BANK*
》.loan [amt]
》.payloan
》.interest
》.bankrob
》.invest [amt]
》.returns

◇

🔐 *VPN FILES*
》.vpnlist
》.vpnget [filename]
》.vpninfo [filename]
》.vpncount
》.vpnadd [filename]
》.vpndelete [filename]
》.vpnsearch [keyword]
》.vpnrandom
》.vpnpin [server]
》.vpncountry [country]
》.vpnlatest
》.vpnserver [name]
》.vpnstats
》.vpnclear
》.vpntype [type]
》.vpnbackup
》.vpnrestore
》.vpnall
》.vpncheck [filename]
》.vpnrename [old] [new]
`.trim()

    // Check if menu.jpg exists, send with image + buttons if it does
    const menuImagePath = path.join(__dirname, '../menu.jpg')
    const hasImage = fs.existsSync(menuImagePath)

    if (hasImage) {
      await sock.sendMessage(from, {
        image: fs.readFileSync(menuImagePath),
        caption: menuText,
        footer: '🤖 Malvin TakeIt MD | Handsome Tech ZW',
        buttons: [
          {
            buttonId: 'https;//malvin-takeit-md.vercel.app',
            buttonText: { displayText: '🌐 Visit Website' },
            type: 1
          },
          {
            buttonId: 'https://chat.whatsapp.com/JTZEmjveqeg8bf4px9Ho9D?s=cl&p=a&ilr=2',
            buttonText: { displayText: '📢 WA Group' },
            type: 1
          }
        ]
      }, { quoted: msg })
    } else {
      // Fallback: send text with buttons if no image
      await sock.sendMessage(from, {
        text: menuText,
        footer: '🤖 Malvin TakeIt MD | Handsome Tech ZW',
        buttons: [
          {
            buttonId: 'https;//malvin-takeit-md.vercel.app',
            buttonText: { displayText: '🌐 Visit Website' },
            type: 1
          },
          {
            buttonId: 'https://chat.whatsapp.com/JTZEmjveqeg8bf4px9Ho9D?s=cl&p=a&ilr=2',
            buttonText: { displayText: '📢 WA Group' },
            type: 1
          }
        ]
      }, { quoted: msg })
    }
    return
  }

  if (command === 'botinfo') {
    await reply(`🤖 *Malvin TakeIt MD*\n👨‍💻 Dev: Malvin\n🏢 Brand: Handsome Tech Zimbabwe\n📦 Version: 1.0.0\n💬 Commands: 80+\n⚡ Library: Baileys MD`)
    return
  }

  if (command === 'uptime') {
    const s = process.uptime()
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60)
    await reply(`⏱️ Uptime: ${h}h ${m}m ${sec}s`)
    return
  }

  // ─── ECONOMY: WALLET ──────────────────────────────────────────────────────
  if (command === 'balance' || command === 'bal') {
    await reply(`💰 *${uid}'s Balance*\n👛 Wallet: $${user.wallet}\n🏦 Bank: $${user.bank}\n💎 Net Worth: $${user.wallet + user.bank}`)
    saveDB(db); return
  }

  if (command === 'deposit' || command === 'dep') {
    const amt = args[0] === 'all' ? user.wallet : parseInt(args[0])
    if (!amt || amt <= 0) return reply('❌ Usage: .deposit [amount|all]')
    if (amt > user.wallet) return reply('❌ Not enough in wallet!')
    user.wallet -= amt; user.bank += amt
    await reply(`✅ Deposited $${amt} to bank.\n🏦 Bank: $${user.bank}`)
    saveDB(db); return
  }

  if (command === 'withdraw' || command === 'with') {
    const amt = args[0] === 'all' ? user.bank : parseInt(args[0])
    if (!amt || amt <= 0) return reply('❌ Usage: .withdraw [amount|all]')
    if (amt > user.bank) return reply('❌ Not enough in bank!')
    user.bank -= amt; user.wallet += amt
    await reply(`✅ Withdrew $${amt} from bank.\n👛 Wallet: $${user.wallet}`)
    saveDB(db); return
  }

  if (command === 'transfer') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    const amt = parseInt(args[1] || args[0])
    if (!mentioned || !amt || amt <= 0) return reply('❌ Usage: .transfer @user [amount]')
    if (amt > user.wallet) return reply('❌ Not enough money!')
    const receiver = getUser(db, mentioned.replace('@s.whatsapp.net', ''))
    user.wallet -= amt; receiver.wallet += amt
    await reply(`✅ Sent $${amt} to @${mentioned.split('@')[0]}`)
    saveDB(db); return
  }

  if (command === 'daily') {
    const cd = cooldownLeft(user.lastDaily, 'daily')
    if (cd) return reply(`⏳ Daily on cooldown! Come back in ${cd}`)
    user.streak = (Date.now() - user.lastDaily < 172800000) ? user.streak + 1 : 1
    const bonus = Math.min(user.streak * 50, 500)
    const earned = 500 + bonus
    user.wallet += earned; user.lastDaily = Date.now()
    addXP(user, 20)
    await reply(`🎁 Daily claimed!\n💰 +$${earned}\n🔥 Streak: ${user.streak} days\n⭐ Bonus: $${bonus}`)
    saveDB(db); return
  }

  if (command === 'streak') {
    await reply(`🔥 Streak: ${user.streak} days\n💰 Daily Bonus: $${Math.min(user.streak * 50, 500)}`)
    return
  }

  // ─── ECONOMY: EARN ────────────────────────────────────────────────────────
  if (command === 'work') {
    const cd = cooldownLeft(user.lastWork, 'work')
    if (cd) return reply(`⏳ Work cooldown! Wait ${cd}`)
    const jobs = ['Developer', 'Driver', 'Chef', 'Builder', 'Teacher', 'Doctor', 'Farmer']
    const job = jobs[rand(0, jobs.length - 1)]
    const earned = rand(200, 600)
    user.wallet += earned; user.lastWork = Date.now()
    addXP(user, 15)
    await reply(`💼 You worked as a *${job}*\n💰 Earned: $${earned}`)
    saveDB(db); return
  }

  if (command === 'crime') {
    const cd = cooldownLeft(user.lastCrime, 'crime')
    if (cd) return reply(`⏳ Crime cooldown! Wait ${cd}`)
    const success = Math.random() > 0.4
    if (success) {
      const earned = rand(300, 900)
      user.wallet += earned; user.lastCrime = Date.now()
      await reply(`🦹 Crime succeeded!\n💰 Stole: $${earned}`)
    } else {
      const fine = rand(100, 400)
      user.wallet = Math.max(0, user.wallet - fine); user.lastCrime = Date.now()
      await reply(`👮 Caught! Paid fine: $${fine}`)
    }
    saveDB(db); return
  }

  if (command === 'fish') {
    const cd = cooldownLeft(user.lastFish, 'fish')
    if (cd) return reply(`⏳ Fishing cooldown! Wait ${cd}`)
    const fish = ['🐟 Tilapia', '🦈 Shark', '🐡 Puffer', '🦑 Squid', '🎣 Nothing']
    const caught = fish[rand(0, fish.length - 1)]
    const earned = caught.includes('Nothing') ? 0 : rand(100, 500)
    user.wallet += earned; user.lastFish = Date.now(); user.fished += 1
    addXP(user, 10)
    await reply(`🎣 You caught: ${caught}\n💰 Worth: $${earned}`)
    saveDB(db); return
  }

  if (command === 'mine') {
    const cd = cooldownLeft(user.lastMine, 'mine')
    if (cd) return reply(`⏳ Mining cooldown! Wait ${cd}`)
    const items = ['💎 Diamond', '🥇 Gold', '⚙️ Iron', '🪨 Stone', '💀 Nothing']
    const found = items[rand(0, items.length - 1)]
    const earned = found.includes('Nothing') ? 0 : rand(150, 700)
    user.wallet += earned; user.lastMine = Date.now(); user.mined += 1
    addXP(user, 12)
    await reply(`⛏️ You mined: ${found}\n💰 Worth: $${earned}`)
    saveDB(db); return
  }

  if (command === 'hunt') {
    const cd = cooldownLeft(user.lastHunt, 'hunt')
    if (cd) return reply(`⏳ Hunt cooldown! Wait ${cd}`)
    const animals = ['🦁 Lion', '🐘 Elephant', '🦌 Deer', '🐇 Rabbit', '🌿 Nothing']
    const caught = animals[rand(0, animals.length - 1)]
    const earned = caught.includes('Nothing') ? 0 : rand(200, 800)
    user.wallet += earned; user.lastHunt = Date.now(); user.hunted += 1
    addXP(user, 12)
    await reply(`🏹 You hunted: ${caught}\n💰 Worth: $${earned}`)
    saveDB(db); return
  }

  if (command === 'beg') {
    const givers = ['a stranger', 'the government', 'a passing car', 'your neighbour']
    const success = Math.random() > 0.3
    if (success) {
      const earned = rand(10, 150)
      user.wallet += earned
      await reply(`🙏 ${givers[rand(0, givers.length - 1)]} gave you $${earned}`)
    } else {
      await reply(`😔 Nobody gave you anything. Try again later.`)
    }
    saveDB(db); return
  }

  if (command === 'collect') {
    const passive = user.land * 50
    if (passive <= 0) return reply('❌ You have no land generating income. Buy land with .buyland')
    user.wallet += passive
    await reply(`🏡 Collected $${passive} from ${user.land} piece(s) of land.`)
    saveDB(db); return
  }

  // ─── ECONOMY: GAMBLE ──────────────────────────────────────────────────────
  if (command === 'slots') {
    const cd = cooldownLeft(user.lastSlot, 'slot')
    if (cd) return reply(`⏳ Slot cooldown! Wait ${cd}`)
    const bet = parseInt(args[0])
    if (!bet || bet <= 0 || bet > user.wallet) return reply('❌ Usage: .slots [amount]')
    const icons = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎']
    const s = [icons[rand(0, 5)], icons[rand(0, 5)], icons[rand(0, 5)]]
    const win = s[0] === s[1] && s[1] === s[2]
    const mult = s[0] === '💎' ? 5 : 3
    if (win) {
      user.wallet += bet * mult; user.wins++
      await reply(`🎰 ${s.join(' ')} — JACKPOT! +$${bet * mult}`)
    } else {
      user.wallet -= bet; user.losses++
      await reply(`🎰 ${s.join(' ')} — No luck. -$${bet}`)
    }
    user.lastSlot = Date.now()
    saveDB(db); return
  }

  if (command === 'flip') {
    const bet = parseInt(args[0])
    const choice = args[1]?.toLowerCase()
    if (!bet || !['h', 't', 'heads', 'tails'].includes(choice)) return reply('❌ Usage: .flip [amount] [h/t]')
    if (bet > user.wallet) return reply('❌ Not enough money!')
    const result = Math.random() > 0.5 ? 'h' : 't'
    const win = choice[0] === result
    if (win) { user.wallet += bet; user.wins++ } else { user.wallet -= bet; user.losses++ }
    await reply(`🪙 ${result === 'h' ? 'Heads' : 'Tails'}! You ${win ? 'won' : 'lost'} $${bet}`)
    saveDB(db); return
  }

  if (command === 'dice') {
    const bet = parseInt(args[0])
    if (!bet || bet > user.wallet) return reply('❌ Usage: .dice [amount]')
    const yours = rand(1, 6), bot = rand(1, 6)
    const win = yours > bot
    if (win) { user.wallet += bet; user.wins++ } else { user.wallet -= bet; user.losses++ }
    await reply(`🎲 You: ${yours} | Bot: ${bot}\n${win ? `✅ Won $${bet}` : `❌ Lost $${bet}`}`)
    saveDB(db); return
  }

  if (command === 'roulette') {
    const bet = parseInt(args[0])
    const choice = args[1]?.toLowerCase()
    if (!bet || !['r', 'b', 'red', 'black'].includes(choice || '')) return reply('❌ Usage: .roulette [amount] [r/b]')
    if (bet > user.wallet) return reply('❌ Not enough money!')
    const result = Math.random() > 0.5 ? 'r' : 'b'
    const win = (choice || '')[0] === result
    if (win) { user.wallet += bet; user.wins++ } else { user.wallet -= bet; user.losses++ }
    await reply(`🎡 Result: ${result === 'r' ? '🔴 Red' : '⚫ Black'}\nYou ${win ? `won $${bet}` : `lost $${bet}`}`)
    saveDB(db); return
  }

  if (command === 'blackjack' || command === 'bj') {
    const bet = parseInt(args[0])
    if (!bet || bet > user.wallet) return reply('❌ Usage: .blackjack [amount]')
    const card = () => rand(1, 11)
    const player = card() + card(), dealer = card() + card()
    const bust = player > 21
    const win = !bust && (player > dealer || dealer > 21)
    if (win) { user.wallet += bet; user.wins++ } else { user.wallet -= bet; user.losses++ }
    await reply(`🃏 *Blackjack*\nYou: ${player} | Dealer: ${dealer}\n${bust ? '💥 Bust!' : win ? `✅ Win! +$${bet}` : `❌ Lose! -$${bet}`}`)
    saveDB(db); return
  }

  if (command === 'lottery') {
    if (user.wallet < 100) return reply('❌ Lottery ticket costs $100')
    user.wallet -= 100
    const win = Math.random() < 0.05
    if (win) {
      const prize = rand(2000, 10000)
      user.wallet += prize; user.wins++
      await reply(`🎟️ LOTTERY WINNER! You won $${prize}!`)
    } else {
      user.losses++
      await reply('🎟️ Better luck next time! No win.')
    }
    saveDB(db); return
  }

  if (command === 'scratch') {
    if (user.wallet < 50) return reply('❌ Scratch card costs $50')
    user.wallet -= 50
    const cards = Array.from({length: 3}, () => rand(1, 9))
    const win = cards[0] === cards[1] || cards[1] === cards[2]
    if (win) {
      const prize = rand(100, 1000)
      user.wallet += prize
      await reply(`🎫 [${cards.join('] [')}]\n✅ Match! Won $${prize}`)
    } else {
      await reply(`🎫 [${cards.join('] [')}]\n❌ No match. Lost $50`)
    }
    saveDB(db); return
  }

  // ─── ECONOMY: SHOP ────────────────────────────────────────────────────────
  if (command === 'shop') {
    await reply(`🛒 *TakeIt Shop*\n\n🗡️ Sword — $500\n🛡️ Shield — $400\n🎣 Fishing Rod — $300\n⛏️ Pickaxe — $350\n🏹 Bow — $450\n💊 Potion — $200\n🎒 Backpack — $600\n\nBuy with: .buy [item name]`)
    return
  }

  if (command === 'buy') {
    const item = args.join(' ').toLowerCase()
    const prices = { sword: 500, shield: 400, 'fishing rod': 300, pickaxe: 350, bow: 450, potion: 200, backpack: 600 }
    if (!prices[item]) return reply('❌ Item not found. Check .shop')
    if (user.wallet < prices[item]) return reply(`❌ Need $${prices[item]}`)
    user.wallet -= prices[item]
    user.inventory.push(item)
    await reply(`✅ Bought ${item} for $${prices[item]}`)
    saveDB(db); return
  }

  if (command === 'sell') {
    const item = args.join(' ').toLowerCase()
    const idx = user.inventory.indexOf(item)
    if (idx === -1) return reply('❌ You don\'t have that item')
    const prices = { sword: 250, shield: 200, 'fishing rod': 150, pickaxe: 175, bow: 225, potion: 100, backpack: 300 }
    const val = prices[item] || 100
    user.inventory.splice(idx, 1)
    user.wallet += val
    await reply(`💰 Sold ${item} for $${val}`)
    saveDB(db); return
  }

  if (command === 'inventory' || command === 'inv') {
    const items = user.inventory.length ? user.inventory.join(', ') : 'Empty'
    await reply(`🎒 *Your Inventory*\n${items}`)
    return
  }

  if (command === 'use') {
    const item = args.join(' ').toLowerCase()
    const idx = user.inventory.indexOf(item)
    if (idx === -1) return reply('❌ Item not in inventory')
    if (item === 'potion') {
      user.inventory.splice(idx, 1)
      await reply('💊 Used potion! Healed 50 HP (RPG effect)')
    } else {
      await reply(`✅ Using ${item}...`)
    }
    saveDB(db); return
  }

  // ─── ECONOMY: INVEST ──────────────────────────────────────────────────────
  const STOCKS = { ZSE: 120, BTC: 45000, ETH: 2500, MSFT: 380, AMZN: 185 }

  if (command === 'stocks') {
    const lines = Object.entries(STOCKS).map(([k, v]) => `${k}: $${v + rand(-20, 20)}`).join('\n')
    await reply(`📈 *Market Prices*\n${lines}`)
    return
  }

  if (command === 'buystock') {
    const sym = args[0]?.toUpperCase(), qty = parseInt(args[1])
    if (!sym || !qty || !STOCKS[sym]) return reply('❌ Usage: .buystock [SYM] [qty]')
    const cost = STOCKS[sym] * qty
    if (user.wallet < cost) return reply(`❌ Need $${cost}`)
    user.wallet -= cost
    user.stock[sym] = (user.stock[sym] || 0) + qty
    await reply(`📈 Bought ${qty}x ${sym} for $${cost}`)
    saveDB(db); return
  }

  if (command === 'sellstock') {
    const sym = args[0]?.toUpperCase(), qty = parseInt(args[1])
    if (!sym || !qty || !user.stock[sym] || user.stock[sym] < qty) return reply('❌ Not enough stock')
    const earn = STOCKS[sym] * qty + rand(-500, 1000)
    user.wallet += earn
    user.stock[sym] -= qty
    if (user.stock[sym] <= 0) delete user.stock[sym]
    await reply(`💰 Sold ${qty}x ${sym} for $${earn}`)
    saveDB(db); return
  }

  if (command === 'portfolio') {
    const stocks = Object.entries(user.stock).map(([k, v]) => `${k}: ${v} shares`).join('\n') || 'None'
    await reply(`📊 *Your Portfolio*\n${stocks}`)
    return
  }

  if (command === 'land') {
    await reply(`🏡 You own ${user.land} piece(s) of land.\nEach earns $50 passive income.\nBuy: .buyland ($2000 each)`)
    return
  }

  if (command === 'buyland') {
    if (user.wallet < 2000) return reply('❌ Land costs $2000')
    user.wallet -= 2000; user.land++
    await reply(`🏡 Bought land! You own ${user.land} piece(s).`)
    saveDB(db); return
  }

  if (command === 'sellland') {
    if (user.land <= 0) return reply('❌ No land to sell')
    user.land--; user.wallet += 1500
    await reply(`💰 Sold land for $1500. You own ${user.land} piece(s).`)
    saveDB(db); return
  }

  // ─── ECONOMY: RPG ────────────────────────────────────────────────────────
  if (command === 'level') {
    await reply(`⭐ *${uid}'s Level*\nLevel: ${user.level}\nXP: ${user.xp}/${user.level * 100}`)
    return
  }

  if (command === 'leaderboard' || command === 'lb') {
    const sorted = Object.entries(db)
      .map(([id, u]) => ({ id, net: u.wallet + u.bank }))
      .sort((a, b) => b.net - a.net).slice(0, 10)
    const lines = sorted.map((u, i) => `${i + 1}. ${u.id} — $${u.net}`).join('\n')
    await reply(`🏆 *Leaderboard*\n${lines}`)
    return
  }

  if (command === 'rob') {
    const cd = cooldownLeft(user.lastRob, 'rob')
    if (cd) return reply(`⏳ Rob cooldown! Wait ${cd}`)
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    if (!mentioned) return reply('❌ Mention a user: .rob @user')
    const tid = mentioned.replace('@s.whatsapp.net', '')
    const target = getUser(db, tid)
    if (target.wallet < 100) return reply('❌ Target is broke!')
    const success = Math.random() > 0.5
    if (success) {
      const stolen = rand(50, Math.min(target.wallet, 500))
      target.wallet -= stolen; user.wallet += stolen; user.lastRob = Date.now()
      await reply(`🦹 Robbed @${tid} for $${stolen}!`)
    } else {
      const fine = rand(100, 300)
      user.wallet = Math.max(0, user.wallet - fine); user.lastRob = Date.now()
      await reply(`👮 Rob failed! Fined $${fine}`)
    }
    saveDB(db); return
  }

  if (command === 'bounty') {
    await reply('🎯 Bounty system coming soon!')
    return
  }

  if (command === 'quest') {
    await reply(`📜 *Daily Quest*\n• Earn $1000 today\n• Win 3 slot games\n• Fish 5 times\n\nReward: $500 + 50 XP`)
    return
  }

  if (command === 'duel') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    const bet = parseInt(args[1] || args[0])
    if (!mentioned || !bet) return reply('❌ Usage: .duel @user [amount]')
    if (bet > user.wallet) return reply('❌ Not enough money')
    const win = Math.random() > 0.5
    if (win) { user.wallet += bet; user.wins++ } else { user.wallet -= bet; user.losses++ }
    await reply(`⚔️ Duel vs @${mentioned.split('@')[0]}!\n${win ? `✅ You won $${bet}!` : `❌ You lost $${bet}!`}`)
    saveDB(db); return
  }

  if (command === 'profile') {
    await reply(`👤 *Profile: ${uid}*\n💰 Wallet: $${user.wallet}\n🏦 Bank: $${user.bank}\n⭐ Level: ${user.level}\n🏆 Wins: ${user.wins} | Losses: ${user.losses}\n🏡 Land: ${user.land}\n🎣 Fished: ${user.fished}\n⛏️ Mined: ${user.mined}\n🏹 Hunted: ${user.hunted}`)
    return
  }

  // ─── ECONOMY: BANK EXTRA ──────────────────────────────────────────────────
  if (command === 'loan') {
    const amt = parseInt(args[0])
    if (!amt || amt < 100 || amt > 5000) return reply('❌ Loan: $100–$5000')
    user.wallet += amt
    await reply(`🏦 Loan of $${amt} added! Repay with .payloan [amount]`)
    saveDB(db); return
  }

  if (command === 'payloan') {
    const amt = parseInt(args[0])
    if (!amt || amt > user.wallet) return reply('❌ Usage: .payloan [amount]')
    user.wallet -= amt
    await reply(`✅ Paid back $${amt}`)
    saveDB(db); return
  }

  if (command === 'interest') {
    await reply('📊 Loan interest rate: 5% daily')
    return
  }

  if (command === 'bankrob') {
    if (user.wallet < 200) return reply('❌ Need $200 to attempt bank rob')
    const success = Math.random() < 0.2
    if (success) {
      const prize = rand(2000, 8000)
      user.wallet += prize
      await reply(`🏦💥 Bank robbed! Got $${prize}`)
    } else {
      user.wallet -= 200
      await reply('👮 Failed! Lost $200 in the attempt.')
    }
    saveDB(db); return
  }

  if (command === 'invest') {
    const amt = parseInt(args[0])
    if (!amt || amt > user.wallet) return reply('❌ Usage: .invest [amount]')
    user.wallet -= amt
    await reply(`📈 Invested $${amt}. Check .returns in 1hr`)
    saveDB(db); return
  }

  if (command === 'returns') {
    const gain = rand(50, 500)
    user.wallet += gain
    await reply(`📈 Investment returned $${gain}`)
    saveDB(db); return
  }

  // ─── VPN COMMANDS ─────────────────────────────────────────────────────────
  if (command === 'vpnlist') {
    const files = listVpnFiles()
    if (files.length === 0) return reply('📂 No VPN files found. Add .ovpn/.conf files to the vpnfiles/ folder.')
    await reply(`📋 *VPN Files (${files.length})*\n${files.map((f, i) => `${i + 1}. ${f}`).join('\n')}`)
    return
  }

  if (command === 'vpnget') {
    const name = args[0]
    if (!name) return reply('❌ Usage: .vpnget [filename]')
    const files = listVpnFiles()
    const match = files.find(f => f.toLowerCase() === name.toLowerCase() || f.toLowerCase().includes(name.toLowerCase()))
    if (!match) return reply(`❌ File not found: ${name}`)
    const filePath = path.join(VPN_DIR, match)
    await sock.sendMessage(from, {
      document: fs.readFileSync(filePath),
      fileName: match,
      mimetype: 'application/octet-stream',
      caption: `📁 *${match}*\nFrom: Malvin TakeIt MD`
    }, { quoted: msg })
    return
  }

  if (command === 'vpninfo') {
    const name = args[0]
    if (!name) return reply('❌ Usage: .vpninfo [filename]')
    const files = listVpnFiles()
    const match = files.find(f => f.toLowerCase().includes(name.toLowerCase()))
    if (!match) return reply(`❌ File not found: ${name}`)
    const filePath = path.join(VPN_DIR, match)
    const stats = fs.statSync(filePath)
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').slice(0, 5).join('\n')
    await reply(`📄 *${match}*\n📦 Size: ${(stats.size / 1024).toFixed(2)} KB\n📅 Modified: ${stats.mtime.toDateString()}\n\n*Preview:*\n${lines}`)
    return
  }

  if (command === 'vpncount') {
    const files = listVpnFiles()
    await reply(`📊 Total VPN files: ${files.length}`)
    return
  }

  if (command === 'vpnrandom') {
    const files = listVpnFiles()
    if (files.length === 0) return reply('❌ No VPN files available')
    const pick = files[rand(0, files.length - 1)]
    const filePath = path.join(VPN_DIR, pick)
    await sock.sendMessage(from, {
      document: fs.readFileSync(filePath),
      fileName: pick,
      mimetype: 'application/octet-stream',
      caption: `🎲 *Random VPN File*\n${pick}`
    }, { quoted: msg })
    return
  }

  if (command === 'vpnsearch') {
    const kw = args[0]?.toLowerCase()
    if (!kw) return reply('❌ Usage: .vpnsearch [keyword]')
    const files = listVpnFiles().filter(f => f.toLowerCase().includes(kw))
    if (files.length === 0) return reply(`❌ No files matching "${kw}"`)
    await reply(`🔍 *Results for "${kw}" (${files.length})*\n${files.join('\n')}`)
    return
  }

  if (command === 'vpnpin') {
    const kw = args[0]?.toLowerCase()
    if (!kw) return reply('❌ Usage: .vpnpin [server-name]')
    const files = listVpnFiles().filter(f => f.toLowerCase().includes(kw))
    if (files.length === 0) return reply(`❌ No files for server "${kw}"`)
    await reply(`📌 *Files for "${kw}"*\n${files.join('\n')}`)
    return
  }

  if (command === 'vpncountry') {
    const country = args[0]?.toLowerCase()
    if (!country) return reply('❌ Usage: .vpncountry [country]')
    const files = listVpnFiles().filter(f => f.toLowerCase().includes(country))
    if (files.length === 0) return reply(`❌ No files for country "${country}"`)
    await reply(`🌍 *VPN Files — ${country.toUpperCase()} (${files.length})*\n${files.join('\n')}`)
    return
  }

  if (command === 'vpnlatest') {
    const files = listVpnFiles()
    if (files.length === 0) return reply('❌ No VPN files found')
    const sorted = files
      .map(f => ({ name: f, mtime: fs.statSync(path.join(VPN_DIR, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 5)
    await reply(`🆕 *Latest VPN Files*\n${sorted.map(f => f.name).join('\n')}`)
    return
  }

  if (command === 'vpnserver') {
    const server = args[0]?.toLowerCase()
    if (!server) return reply('❌ Usage: .vpnserver [server-name]')
    const files = listVpnFiles().filter(f => f.toLowerCase().includes(server))
    await reply(`🖥️ Files for "${server}": ${files.length}\n${files.join('\n') || 'None'}`)
    return
  }

  if (command === 'vpnstats') {
    const files = listVpnFiles()
    const types = {}
    files.forEach(f => {
      const ext = path.extname(f) || 'unknown'
      types[ext] = (types[ext] || 0) + 1
    })
    const typeLines = Object.entries(types).map(([k, v]) => `${k}: ${v}`).join('\n')
    await reply(`📊 *VPN Stats*\nTotal: ${files.length}\n\n*By Type:*\n${typeLines}`)
    return
  }

  if (command === 'vpnclear') {
    await reply('⚠️ Admin only command. Add admin check to enable.')
    return
  }

  if (command === 'vpntype') {
    const ext = args[0]?.startsWith('.') ? args[0] : `.${args[0]}`
    if (!args[0]) return reply('❌ Usage: .vpntype [ovpn/conf/txt]')
    const files = listVpnFiles().filter(f => f.endsWith(ext))
    await reply(`📂 *${ext} Files (${files.length})*\n${files.join('\n') || 'None'}`)
    return
  }

  if (command === 'vpnbackup') {
    const files = listVpnFiles()
    const backup = JSON.stringify(files, null, 2)
    await reply(`💾 *VPN Backup*\n${files.length} files:\n${files.join('\n')}`)
    return
  }

  if (command === 'vpnrestore') {
    await reply('🔄 Restore from backup — feature requires admin setup.')
    return
  }

  if (command === 'vpnall') {
    await reply('⚠️ Admin only. Sends all VPN files — enable with admin check.')
    return
  }

  if (command === 'vpncheck') {
    const name = args[0]
    if (!name) return reply('❌ Usage: .vpncheck [filename]')
    const files = listVpnFiles()
    const exists = files.some(f => f.toLowerCase() === name.toLowerCase())
    await reply(exists ? `✅ "${name}" exists in VPN folder.` : `❌ "${name}" not found.`)
    return
  }

  if (command === 'vpnrename') {
    await reply('✏️ Rename command requires admin panel integration.')
    return
  }

  if (command === 'vpnadd') {
    await reply('➕ To add VPN files, upload them directly to the vpnfiles/ folder.')
    return
  }

  if (command === 'vpndelete') {
    await reply('🗑️ Delete command requires admin verification. Add to admin check.')
    return
  }
}

module.exports = { handleCommand }
