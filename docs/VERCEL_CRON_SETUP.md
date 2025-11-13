# 🕐 Vercel Cron Jobs Setup Guide

## ✅ What We Accomplished

The `vercel.json` file is already configured with all necessary cron jobs. However, **Vercel crons need to be activated manually** in the dashboard or require a Pro plan.

---

## 📋 Configured Cron Jobs

### Hourly Draws (Every Hour)

**1. Close Hourly Draw**
- **Path:** `/api/cron/close-hourly-draw`
- **Schedule:** `0 * * * *` (Every hour at :00)
- **Purpose:** Close sales and commit to future blocks

**2. Execute Hourly Draw**
- **Path:** `/api/cron/execute-hourly-draw`
- **Schedule:** `5 * * * *` (Every hour at :05)
- **Purpose:** Reveal and execute draw with blockhash randomness

### Daily Draws (Every Day at 2 AM UTC)

**3. Close Daily Draw**
- **Path:** `/api/cron/close-daily-draw`
- **Schedule:** `0 2 * * *` (Daily at 2:00 AM UTC)
- **Purpose:** Close sales and commit to future blocks

**4. Execute Daily Draw**
- **Path:** `/api/cron/execute-daily-draw`
- **Schedule:** `5 2 * * *` (Daily at 2:05 AM UTC)
- **Purpose:** Reveal and execute draw with blockhash randomness

---

## 🚀 How to Activate Crons (3 Options)

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/arcanequants-projects/crypto-lotto/settings/crons
   ```

2. **Enable Crons**
   - Click "Enable Crons" button
   - Vercel will automatically read `vercel.json`
   - All 4 cron jobs should appear

3. **Verify**
   - You should see 4 cron jobs listed
   - Each with a "Last Run" and "Next Run" time

### Option 2: Upgrade to Pro Plan

Vercel crons are **free on Pro plan** ($20/month):
- Unlimited cron executions
- Automatic activation from `vercel.json`
- Better monitoring and logs

**Upgrade here:**
```
https://vercel.com/arcanequants-projects/crypto-lotto/settings/billing
```

### Option 3: Use External Cron Service (Free Alternative)

If you don't want to upgrade, use **cron-job.org** (free):

**Setup:**

1. **Create account:** https://cron-job.org/en/

2. **Add 4 cron jobs:**

   **Hourly Draw - Close**
   - URL: `https://crypto-lotto-six.vercel.app/api/cron/close-hourly-draw`
   - Schedule: Every hour at minute 0
   - HTTP Method: GET
   - Header: `Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d`

   **Hourly Draw - Execute**
   - URL: `https://crypto-lotto-six.vercel.app/api/cron/execute-hourly-draw`
   - Schedule: Every hour at minute 5
   - HTTP Method: GET
   - Header: `Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d`

   **Daily Draw - Close**
   - URL: `https://crypto-lotto-six.vercel.app/api/cron/close-daily-draw`
   - Schedule: Daily at 02:00 UTC
   - HTTP Method: GET
   - Header: `Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d`

   **Daily Draw - Execute**
   - URL: `https://crypto-lotto-six.vercel.app/api/cron/execute-daily-draw`
   - Schedule: Daily at 02:05 UTC
   - HTTP Method: GET
   - Header: `Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d`

3. **Save and Enable**
   - Mark all as "Enabled"
   - Test each one manually with "Execute now"

---

## 🧪 Testing Crons

### Test Hourly Draws

```bash
# Close hourly draw
curl -X GET https://crypto-lotto-six.vercel.app/api/cron/close-hourly-draw \
  -H "Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d"

# Wait 10 seconds (for blocks to pass)
sleep 10

# Execute hourly draw
curl -X GET https://crypto-lotto-six.vercel.app/api/cron/execute-hourly-draw \
  -H "Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d"
```

### Test Daily Draws

```bash
# Close daily draw
curl -X GET https://crypto-lotto-six.vercel.app/api/cron/close-daily-draw \
  -H "Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d"

# Wait 10 seconds
sleep 10

# Execute daily draw
curl -X GET https://crypto-lotto-six.vercel.app/api/cron/execute-daily-draw \
  -H "Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d"
```

---

## 📊 Monitoring Cron Executions

### Check Vercel Logs

```bash
# View recent deployment logs
vercel logs crypto-lotto --since 1h

# Filter for cron logs
vercel logs crypto-lotto --since 1h | grep "CRON JOB"
```

### Check Contract State

```bash
# Current hourly draw ID
cast call 0xF3f6f3452513C6101D2EeA45BB8d4f552131B2C7 \
  "currentHourlyDrawId()(uint256)" \
  --rpc-url https://mainnet.base.org

# Current daily draw ID
cast call 0xF3f6f3452513C6101D2EeA45BB8d4f552131B2C7 \
  "currentDailyDrawId()(uint256)" \
  --rpc-url https://mainnet.base.org
```

### Check Results Page

Visit: https://crypto-lotto-six.vercel.app/results

You should see:
- Recent hourly draws every hour
- Recent daily draws every day
- All with executed status and winning numbers

---

## ⚠️ Troubleshooting

### Crons Not Running

**Check:**
1. Vercel plan (Pro required for native crons)
2. `vercel.json` syntax is correct
3. Latest deployment includes `vercel.json`
4. Crons are enabled in dashboard

**Solution:**
- Use external cron service (cron-job.org)
- Or upgrade to Vercel Pro

### Crons Failing

**Check logs:**
```bash
vercel logs crypto-lotto --since 1h | grep -i error
```

**Common issues:**
1. `CRON_SECRET` not set → Add to Vercel env vars
2. `WITHDRAWAL_EXECUTOR_PRIVATE_KEY` not set → Add to Vercel env vars
3. Executor wallet out of funds → Fund it with ETH for gas

### Auto-Skip Not Working

If draws get stuck (too late to execute):

**Manual recovery:**
```bash
# This will trigger auto-skip and advance to next draw
curl -X GET https://crypto-lotto-six.vercel.app/api/cron/execute-hourly-draw \
  -H "Authorization: Bearer 3e3b611ec6bf8a5ddaf559e4a8fd8465b44c36d5c0781f5ca22023101165f81d"
```

The contract v2.1.0 auto-skip will:
1. Detect draw is too late (>250 blocks)
2. Skip it (set winningNumber = 0)
3. Advance to next draw ID
4. System recovers automatically

---

## 🔐 Security Notes

- **CRON_SECRET** is required to prevent unauthorized executions
- Never commit secrets to git
- Use Vercel environment variables
- Rotate secrets periodically
- Monitor cron execution logs

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 4 crons appear in Vercel dashboard or cron-job.org
- [ ] Test each cron manually (see Testing section)
- [ ] Check `/results` page shows recent draws
- [ ] Monitor logs for 24 hours
- [ ] Verify hourly draws execute automatically
- [ ] Verify daily draw executes at 2 AM UTC
- [ ] Check executor wallet has sufficient ETH for gas

---

## 📞 Support

If crons still don't work:

1. Check Vercel deployment logs
2. Test endpoints manually with curl
3. Verify contract on BaseScan
4. Check executor wallet balance
5. Review this guide's troubleshooting section

---

**Status:** ✅ Cron configuration complete in `vercel.json`

**Next Step:** Enable crons in Vercel dashboard or set up cron-job.org

---

Generated: Nov 13, 2025
