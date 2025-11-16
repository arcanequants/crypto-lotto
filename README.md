# 🎰 CryptoLotto - Blockchain Lottery on BASE

The world's most transparent lottery powered by blockchain technology.

## 🚀 Features

- **Dual Lottery System**: Every $0.25 ticket enters BOTH daily and weekly draws
- **100% On-Chain**: Verifiable by anyone, impossible to manipulate
- **Crypto Prizes**: Win in cbBTC, wETH, and monthly voted token
- **Infinite System**: Draws created and executed automatically via CRONs
- **Token Governance**: Community votes for the monthly bonus token
- **Admin Panel**: Configure draw times without touching code

## 🏗️ Tech Stack

- **Frontend**: Next.js 15.5, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Privy (wallet connect + email)
- **Blockchain**: BASE L2 (Ethereum)
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone repo
git clone https://github.com/your-repo/crypto-lotto.git
cd crypto-lotto/web

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXT_PUBLIC_PRIVY_APP_ID
# - CRON_SECRET

# Run development server
npm run dev
```

## 🌐 Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy app ID
- `CRON_SECRET` - Secret for CRON authentication

### Optional
- `NEXT_PUBLIC_APP_URL` - Your app URL (default: http://localhost:3000)

## 🗄️ Database Setup

1. Create a Supabase project
2. Run migrations in order:
   ```sql
   -- Execute in Supabase SQL Editor
   1. supabase-schema.sql
   2. supabase-migration-dual-lottery-opcion-a.sql
   3. supabase-migration-draw-config.sql
   ```

## ⚙️ CRON Jobs (Vercel)

The system has 4 automated CRONs:

1. **Create Next Draws** - Every hour
   - Ensures always 7 daily + 4 weekly draws pending

2. **Execute Daily Draw** - Daily at 2:00 AM UTC
   - Generates winning numbers (MOCK)
   - Processes tickets
   - Calculates winners
   - Transfers rollover to next draw

3. **Execute Weekly Draw** - Weekly Sunday 12:00 AM UTC
   - Generates winning numbers (MOCK)
   - Processes tickets
   - Handles jackpot + rollover

4. **Finalize Vote** - Monthly on 25th at 23:59 UTC
   - Counts votes for token of the month
   - Announces winner
   - Creates next month's proposal

## 🎮 How to Use

### As a User
1. Connect wallet (or email via Privy)
2. Pick 5 numbers (1-50) + 1 power number (1-20)
3. Buy ticket ($0.25 USDC)
4. Your ticket enters BOTH daily and weekly draws!
5. Check "My Tickets" to see results
6. Claim prizes when you win

### As an Admin
1. Go to `/admin/draw-config`
2. Change draw times (Daily/Weekly)
3. Preview in multiple timezones
4. Save changes
5. Future draws will use new schedule

### Token Voting
1. Go to `/vote`
2. Vote for your favorite token (each ticket = 1 vote)
3. Voting opens on 1st of month
4. Winner announced on 25th
5. Winning token gets 5% of prize pool next month

## 📁 Project Structure

```
/app
  /api
    /cron          # CRON jobs
    /tickets       # Ticket purchase
    /prizes        # Prize claiming
    /tokens        # Token voting
  /my-tickets      # User tickets page
  /prizes          # Prizes page
  /results         # Winning numbers
  /vote            # Token voting page
  /admin           # Admin panel
/components
  DualPoolDisplay  # Homepage pools
  TokenVoting      # Voting interface
  ErrorBoundary    # Error handling
  LoginButton      # Privy auth
/lib
  supabase/        # Supabase clients
  lottery.ts       # Lottery logic
  analytics.ts     # Analytics
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy
5. Vercel will auto-configure CRONs from `vercel.json`

## 📊 System Architecture

```
User → Frontend (Next.js)
  ↓
API Routes (Next.js)
  ↓
Supabase (PostgreSQL)
  ↓
CRONs (Vercel) → Execute Draws
  ↓
Future: Smart Contracts (BASE)
```

## 🔮 Roadmap

- [x] Dual Lottery MVP
- [x] CRON automation
- [x] Admin panel
- [x] Token governance voting
- [ ] Real crypto integration (currently MOCK)
- [ ] Smart contracts on BASE
- [ ] Chainlink VRF for random numbers
- [ ] Prize claiming via wallet signatures

## 📄 License

MIT

## 🤝 Contributing

PRs welcome! Please read CONTRIBUTING.md first.

## 📧 Contact

For support: support@cryptolotto.xyz
# Force deployment Sat Nov 15 21:25:31 CST 2025
