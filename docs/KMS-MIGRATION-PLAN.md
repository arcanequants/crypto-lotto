# 🔐 KMS MIGRATION PLAN - Private Key Security

**Priority**: 🟠 HIGH
**Impact**: Complete loss of executor wallet funds if compromised
**Timeline**: 1-2 weeks
**Required Before**: Mainnet launch

---

## 📋 CURRENT PROBLEM

**File**: `/api/withdraw/gasless/route.ts`

```typescript
// ❌ INSECURE: Private key in plaintext environment variable
const EXECUTOR_PRIVATE_KEY = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY || '';
const executorWallet = new ethers.Wallet(EXECUTOR_PRIVATE_KEY, provider);
```

### Risks:
1. **Plaintext Storage**: Private key stored in `.env` file
2. **Log Exposure**: Can be captured in Vercel deployment logs
3. **Access Control**: Anyone with Vercel access can see the key
4. **No Rotation**: Can't rotate key without redeploying
5. **Audit Trail**: No logging of key usage

---

## 🎯 SOLUTION OPTIONS

### Option 1: Vercel KV with Encryption (RECOMMENDED)

**Best for**: Quick implementation, Vercel-hosted apps
**Cost**: ~$20/month
**Setup Time**: 1-2 hours

#### Pros:
- Native Vercel integration
- Automatic scaling
- Built-in encryption at rest
- Simple API
- No infrastructure management

#### Cons:
- Vendor lock-in
- Limited HSM features
- Not FIPS 140-2 compliant

#### Implementation:

```typescript
// Step 1: Install Vercel KV
// npm install @vercel/kv

// Step 2: Create encrypted key storage helper
import { kv } from '@vercel/kv';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_KEY = process.env.KV_ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

async function storeEncryptedKey(keyName: string, privateKey: string) {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  await kv.set(keyName, {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  });
}

async function getDecryptedKey(keyName: string): Promise<string> {
  const data = await kv.get(keyName);
  if (!data) throw new Error('Key not found');

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(data.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Step 3: Update gasless withdrawal route
export async function POST(request: NextRequest) {
  const privateKey = await getDecryptedKey('WITHDRAWAL_EXECUTOR_PRIVATE_KEY');
  const executorWallet = new ethers.Wallet(privateKey, provider);
  // ... rest of logic
}
```

---

### Option 2: AWS KMS (Enterprise Grade)

**Best for**: Production systems, regulatory compliance
**Cost**: ~$1/month + $0.03 per 10k requests
**Setup Time**: 4-8 hours

#### Pros:
- HSM-backed (FIPS 140-2 Level 3)
- Automatic key rotation
- Fine-grained IAM policies
- Audit logging via CloudTrail
- Industry standard

#### Cons:
- More complex setup
- AWS account required
- Higher latency (~50-100ms per call)
- Vendor lock-in

#### Implementation:

```typescript
// Step 1: Install AWS SDK
// npm install @aws-sdk/client-kms

import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

const kmsClient = new KMSClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Step 2: Create helper functions
async function decryptPrivateKey(): Promise<string> {
  const encryptedKey = process.env.ENCRYPTED_PRIVATE_KEY!; // Base64 encrypted blob

  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
    KeyId: process.env.KMS_KEY_ID!,
  });

  const response = await kmsClient.send(command);
  const decryptedKey = Buffer.from(response.Plaintext!).toString('utf8');

  return decryptedKey;
}

// Step 3: Cache decrypted key (avoid repeated KMS calls)
let cachedKey: { value: string; expires: number } | null = null;
const CACHE_TTL = 3600000; // 1 hour

async function getPrivateKey(): Promise<string> {
  const now = Date.now();

  if (cachedKey && now < cachedKey.expires) {
    return cachedKey.value;
  }

  const key = await decryptPrivateKey();
  cachedKey = { value: key, expires: now + CACHE_TTL };

  return key;
}

// Step 4: Update gasless withdrawal route
export async function POST(request: NextRequest) {
  const privateKey = await getPrivateKey();
  const executorWallet = new ethers.Wallet(privateKey, provider);
  // ... rest of logic
}
```

---

### Option 3: HashiCorp Vault (Self-Hosted)

**Best for**: Multi-cloud, full control
**Cost**: Free (self-hosted) or $0.03/hour (managed)
**Setup Time**: 8-16 hours

#### Pros:
- Open source
- No vendor lock-in
- Advanced features (dynamic secrets, lease management)
- Multi-cloud support
- Transit encryption

#### Cons:
- Complex setup and maintenance
- Requires infrastructure management
- High learning curve

---

## 📅 MIGRATION TIMELINE

### Week 1: Setup

**Day 1-2: Choose Solution**
- Evaluate options based on budget and compliance needs
- Get team approval
- Set up cloud accounts (AWS/Vercel)

**Day 3-4: Implement Encryption**
- Create encryption/decryption helpers
- Set up KMS/KV
- Encrypt existing private key
- Store encrypted version in secure storage

**Day 5: Testing**
- Test key retrieval in development
- Test gasless withdrawals with encrypted key
- Measure performance impact
- Test fallback mechanisms

### Week 2: Deployment

**Day 1-2: Staging Deployment**
- Deploy to staging environment
- Run integration tests
- Monitor for errors
- Verify audit logs

**Day 3-4: Production Migration**
- Deploy to production
- Monitor for 24 hours
- Rotate old private key
- Update documentation

**Day 5: Cleanup**
- Remove plaintext keys from all environments
- Delete old keys from Git history (use `git filter-branch`)
- Update team documentation
- Review audit logs

---

## ✅ IMPLEMENTATION CHECKLIST

### Pre-Migration
- [ ] Choose KMS solution (Vercel KV, AWS KMS, or Vault)
- [ ] Set up cloud account and billing
- [ ] Create encryption keys
- [ ] Encrypt existing private key
- [ ] Test encryption/decryption locally
- [ ] Implement caching to reduce KMS calls
- [ ] Add error handling and fallbacks

### Migration
- [ ] Deploy to staging
- [ ] Run end-to-end tests
- [ ] Monitor performance (latency, errors)
- [ ] Deploy to production
- [ ] Monitor for 24-48 hours
- [ ] Rotate old private key
- [ ] Update Vercel environment variables

### Post-Migration
- [ ] Remove plaintext keys from `.env` files
- [ ] Remove keys from Git history
- [ ] Update documentation
- [ ] Train team on new key management process
- [ ] Set up key rotation schedule (quarterly)
- [ ] Configure monitoring alerts
- [ ] Document incident response procedures

---

## 🔒 SECURITY BEST PRACTICES

### 1. Key Rotation
Rotate private keys every 90 days:
```bash
# Generate new private key
openssl ecparam -genkey -name secp256k1 -out new_key.pem

# Convert to format
openssl ec -in new_key.pem -outform DER | tail -c +8 | head -c 32 | xxd -p -c 32

# Encrypt and store in KMS
# Update contract permissions to new address
# Rotate old key out
```

### 2. Access Control
- Limit KMS access to production environment only
- Use IAM roles with least privilege
- Enable MFA for KMS operations
- Audit access logs weekly

### 3. Monitoring
```typescript
// Log all key usage
logger.security('Private key accessed', {
  operation: 'gasless_withdrawal',
  user: walletAddress,
  amount: amount,
  timestamp: new Date().toISOString(),
});
```

### 4. Incident Response
If key is compromised:
1. Immediately revoke KMS access
2. Generate new private key
3. Transfer funds from old wallet to new wallet
4. Update contract permissions
5. Notify users if necessary
6. Conduct post-mortem

---

## 💰 COST COMPARISON

| Solution | Setup Cost | Monthly Cost | Per-Request Cost |
|----------|-----------|--------------|------------------|
| **Vercel KV** | $0 | $20 | Included |
| **AWS KMS** | $0 | $1 | $0.03 / 10k |
| **HashiCorp Vault** | $0 (self-hosted) | $0-$100 | $0 |

### Estimated Monthly Costs (10k withdrawals/month):
- Vercel KV: **$20**
- AWS KMS: **$1.30**
- Vault (self-hosted): **$50** (server costs)

**Recommendation**: Start with **AWS KMS** for best cost/security balance

---

## 🚨 ROLLBACK PLAN

If migration fails:

1. **Revert to plaintext** (temporary)
```typescript
const EXECUTOR_PRIVATE_KEY = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY_BACKUP || '';
```

2. **Investigate issue**
- Check KMS access permissions
- Verify encryption/decryption logic
- Review error logs
- Test in isolated environment

3. **Fix and retry**
- Apply fix
- Test in staging
- Re-deploy to production

---

## 📚 RESOURCES

- [AWS KMS Best Practices](https://docs.aws.amazon.com/kms/latest/developerguide/best-practices.html)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [HashiCorp Vault Tutorials](https://learn.hashicorp.com/vault)
- [FIPS 140-2 Compliance](https://csrc.nist.gov/publications/detail/fips/140/2/final)

---

**Next Steps**: Review this plan with team and choose KMS solution
**Owner**: DevOps / Security Team
**Timeline**: 1-2 weeks before mainnet launch
