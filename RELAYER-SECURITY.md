# Relayer Security - RELAYER_PRIVATE_KEY Management

## ⚠️ CRITICAL SECURITY REQUIREMENT

The `RELAYER_PRIVATE_KEY` environment variable contains the private key that controls the relayer wallet. This wallet:
- Executes all gasless transactions on-chain
- Pays gas fees upfront (reimbursed by smart contract)
- Has access to funds sent to it as gas reimbursement

**IF THIS KEY IS COMPROMISED, AN ATTACKER CAN:**
- Drain all funds from the relayer wallet
- Execute unauthorized gasless transactions
- DoS the gasless system by draining the wallet

---

## 🔐 Production Security Requirements

### ❌ NEVER DO THIS (Development Only)

```bash
# .env.local (LOCAL DEVELOPMENT ONLY - NEVER IN PRODUCTION)
RELAYER_PRIVATE_KEY=0x1234567890abcdef...
```

**Problems with storing private keys as plain text environment variables:**
1. ❌ Key exposed in deployment logs
2. ❌ Key visible to all developers with access to deployment platform
3. ❌ Key stored in version control if `.env` is committed
4. ❌ Key visible in process memory dumps
5. ❌ No rotation/audit capabilities

---

## ✅ PRODUCTION SOLUTION: Use AWS KMS (Key Management System)

### Option 1: AWS KMS (Recommended for Vercel)

**Setup:**

1. **Create KMS Key in AWS:**
```bash
aws kms create-key \
  --description "CryptoLotto Relayer Private Key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS
```

2. **Encrypt the private key:**
```bash
aws kms encrypt \
  --key-id alias/crypto-lotto-relayer \
  --plaintext fileb://<(echo -n "0x1234...") \
  --output text \
  --query CiphertextBlob \
  > encrypted-relayer-key.txt
```

3. **Store encrypted key in Vercel environment:**
```bash
# Vercel dashboard → Settings → Environment Variables
RELAYER_PRIVATE_KEY_ENCRYPTED=AQICAHg6y...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

4. **Decrypt at runtime:**
```typescript
// lib/security/kms.ts
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getRelayerPrivateKey(): Promise<string> {
  const encryptedKey = process.env.RELAYER_PRIVATE_KEY_ENCRYPTED!;

  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
  });

  const response = await kmsClient.send(command);
  const decrypted = Buffer.from(response.Plaintext!).toString('utf-8');

  return decrypted;
}
```

5. **Use in relayer API:**
```typescript
// app/api/tickets/buy-gasless/route.ts
import { getRelayerPrivateKey } from '@/lib/security/kms';

export async function POST(request: NextRequest) {
  const RELAYER_PRIVATE_KEY = await getRelayerPrivateKey(); // ✅ Decrypt from KMS
  const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
  // ... rest of code
}
```

**Benefits:**
- ✅ Private key never stored in plain text
- ✅ Audit logs (who accessed the key and when)
- ✅ Key rotation without code changes
- ✅ IAM policies control access
- ✅ Automatic key backup and replication

---

### Option 2: Vercel Encrypted Environment Variables

Vercel provides encrypted environment variables with limited access:

1. **Enable sensitive environment variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Check "Sensitive" when adding `RELAYER_PRIVATE_KEY`
   - This prevents the value from being logged or displayed in UI

2. **Restrict access:**
   - Only make available to Production environment
   - Limit team member access via Vercel roles

**Benefits:**
- ✅ Easier setup than KMS
- ✅ Encrypted at rest
- ✅ Not visible in deployment logs

**Limitations:**
- ⚠️ Less granular access control than KMS
- ⚠️ No audit logs
- ⚠️ Rotation requires manual update

---

### Option 3: Hardware Security Module (HSM)

For enterprise deployments, use a hardware security module:

**Options:**
- AWS CloudHSM
- Azure Dedicated HSM
- Ledger Enterprise

**Benefits:**
- ✅ Highest security level (FIPS 140-2 Level 3)
- ✅ Private key never leaves hardware
- ✅ Tamper-resistant

**Drawbacks:**
- ⚠️ Expensive ($1000+/month)
- ⚠️ Complex setup

---

## 🚨 Monitoring & Alerts

### Setup Alerts for:

1. **Low Relayer Balance:**
```typescript
// app/api/cron/check-relayer-balance/route.ts
export async function GET() {
  const balance = await provider.getBalance(relayerWallet.address);
  const balanceETH = parseFloat(ethers.formatEther(balance));

  if (balanceETH < 0.01) {
    // Send alert (Slack, email, PagerDuty, etc.)
    await sendAlert('⚠️ Relayer balance low: ' + balanceETH + ' ETH');
  }
}
```

2. **Unauthorized Access Attempts:**
```typescript
// Monitor failed TX attempts from relayer address
```

3. **Unusual Transaction Volume:**
```typescript
// Alert if > 1000 TXs/hour (potential attack)
```

---

## 🔄 Key Rotation Procedure

**Frequency:** Rotate relayer private key every 90 days

**Steps:**

1. Create new relayer wallet
2. Update smart contract: `updateTrustedRelayer(newAddress)`
3. Transfer remaining ETH from old wallet to new wallet
4. Update `RELAYER_PRIVATE_KEY` (via KMS or Vercel)
5. Deploy new version
6. Monitor for issues
7. After 24 hours, archive old key

---

## 📊 Security Checklist

Before deploying to production, ensure:

- [ ] `RELAYER_PRIVATE_KEY` is encrypted (KMS or Vercel sensitive)
- [ ] Private key is NOT in git repository
- [ ] Only production environment has access to key
- [ ] Monitoring alerts are configured
- [ ] Key rotation schedule is documented
- [ ] Team knows emergency procedures if key is compromised
- [ ] Backup wallet is created and funded (for failover)
- [ ] IAM policies restrict KMS access to production servers only

---

## 🆘 Emergency Procedures

**If relayer private key is compromised:**

1. **Immediate Actions (< 5 minutes):**
   - Pause smart contract: `lottery.pause()`
   - Transfer all ETH from relayer wallet to safe address
   - Revoke compromised key from KMS

2. **Short-term (< 1 hour):**
   - Create new relayer wallet
   - Update smart contract: `updateTrustedRelayer(newAddress)`
   - Fund new relayer wallet
   - Update encrypted key in KMS
   - Deploy new version

3. **Post-incident (< 24 hours):**
   - Audit all transactions from compromised wallet
   - Notify users if funds were affected
   - Review access logs to determine how key was compromised
   - Update security procedures
   - Consider reporting to relevant authorities

---

## 📚 References

- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [Vercel Secure Environment Variables](https://vercel.com/docs/projects/environment-variables/sensitive-environment-variables)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [EIP-2771 Security Considerations](https://eips.ethereum.org/EIPS/eip-2771#security-considerations)

---

**Last Updated:** 2025-10-29
**Next Review:** 2026-01-29 (90 days)
