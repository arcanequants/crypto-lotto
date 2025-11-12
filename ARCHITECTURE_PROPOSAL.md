# 🏗️ ARQUITECTURA MULTI-CONTRATO ESCALABLE

## 🎯 OBJETIVO
Crear una infraestructura que permita agregar nuevos contratos de lotería sin modificar código existente, con validación automática y a prueba de errores.

---

## 📋 PROBLEMAS ACTUALES

1. **ABI duplicado** - Cada archivo define su propia ABI
2. **Configuración hardcodeada** - Variables de entorno específicas por contrato
3. **Sin validación** - No detectamos errores de ABI hasta runtime
4. **CRON manual** - Cada contrato necesita CRONs configurados manualmente
5. **Sin versionado** - No sabemos qué versión de contrato está deployado

---

## ✅ SOLUCIÓN PROPUESTA: SISTEMA DE CONTRATOS REGISTRADOS

### 1️⃣ REGISTRO CENTRAL DE CONTRATOS

```typescript
// lib/contracts/registry.ts

export interface LotteryConfig {
  id: string;                    // "hourly-dual-crypto", "daily-simple", etc.
  name: string;                  // "Hourly Dual Crypto Lottery"
  version: string;               // "2.0.0" (semver)
  address: `0x${string}`;        // Contract address
  chain: 'base' | 'ethereum';    // Blockchain
  abi: any[];                    // Contract ABI

  // Draw configuration
  drawFrequency: 'hourly' | 'daily' | 'custom';
  customSchedule?: string;       // cron format if custom
  closeOffset: number;           // minutes before draw to close
  executeOffset: number;         // minutes after close to execute

  // Features
  features: {
    hasHourlyDraw: boolean;
    hasDailyDraw: boolean;
    supportsMultiToken: boolean;
    tokenTypes: ('BTC' | 'ETH' | 'USDC' | 'USDT')[];
    pricePerTicket: string;      // in USD
    numberRange: [number, number]; // e.g., [1, 100]
  };

  // UI Configuration
  ui: {
    theme: {
      primaryColor: string;
      accentColor: string;
      icon: string;
    };
    displayComponent: string;    // Component name to render
  };

  // Status
  status: 'active' | 'deprecated' | 'testing';
  deployedAt: number;           // Unix timestamp
  lastVerified: number;         // Last ABI verification
}

// SINGLE SOURCE OF TRUTH
export const LOTTERY_CONTRACTS: Record<string, LotteryConfig> = {
  'dual-crypto-v2': {
    id: 'dual-crypto-v2',
    name: 'Dual Crypto Lottery',
    version: '2.0.0',
    address: '0x2aB8570632D431843F40eb48dA8cE67695BAE3D9',
    chain: 'base',
    abi: require('../abi/lottery-dual-crypto').LOTTERY_DUAL_CRYPTO_ABI,

    drawFrequency: 'hourly',
    closeOffset: 0,    // Close at draw time
    executeOffset: 5,  // Execute 5 min after close

    features: {
      hasHourlyDraw: true,
      hasDailyDraw: true,
      supportsMultiToken: true,
      tokenTypes: ['BTC', 'ETH', 'USDC'],
      pricePerTicket: '0.10',
      numberRange: [1, 100]
    },

    ui: {
      theme: {
        primaryColor: '#00f0ff',
        accentColor: '#ffd700',
        icon: '💎'
      },
      displayComponent: 'DualCryptoPoolDisplay'
    },

    status: 'active',
    deployedAt: 1731369489,
    lastVerified: Date.now()
  }

  // FUTURE: Add new contracts here
  // 'simple-lottery-v1': { ... },
  // 'mega-jackpot-v1': { ... }
};

// Helper functions
export function getActiveContracts(): LotteryConfig[] {
  return Object.values(LOTTERY_CONTRACTS).filter(c => c.status === 'active');
}

export function getContractById(id: string): LotteryConfig | null {
  return LOTTERY_CONTRACTS[id] || null;
}

export function getContractByAddress(address: string): LotteryConfig | null {
  return Object.values(LOTTERY_CONTRACTS)
    .find(c => c.address.toLowerCase() === address.toLowerCase()) || null;
}
```

---

### 2️⃣ VALIDADOR AUTOMÁTICO DE ABI

```typescript
// lib/contracts/validator.ts

import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { LOTTERY_CONTRACTS } from './registry';

export interface ValidationResult {
  contractId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  testedFunctions: string[];
}

/**
 * Valida que el ABI en el registry coincida con el contrato deployado
 */
export async function validateContract(
  contractId: string
): Promise<ValidationResult> {
  const config = LOTTERY_CONTRACTS[contractId];
  if (!config) {
    return {
      contractId,
      valid: false,
      errors: ['Contract not found in registry'],
      warnings: [],
      testedFunctions: []
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const testedFunctions: string[] = [];

  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
    });

    // Test cada función read en el ABI
    const readFunctions = config.abi.filter(
      (fn: any) => fn.type === 'function' &&
      (fn.stateMutability === 'view' || fn.stateMutability === 'pure')
    );

    for (const fn of readFunctions) {
      try {
        // Try to call function with dummy args
        const args = fn.inputs?.map((input: any) => {
          if (input.type === 'uint256') return BigInt(0);
          if (input.type === 'uint8') return 0;
          if (input.type === 'address') return '0x0000000000000000000000000000000000000000';
          if (input.type === 'bool') return false;
          return null;
        }).filter(Boolean);

        const result = await publicClient.readContract({
          address: config.address,
          abi: [fn],
          functionName: fn.name,
          args: args?.length ? args : undefined
        });

        // Validate output structure
        if (fn.outputs && Array.isArray(fn.outputs)) {
          const outputCount = fn.outputs.length;

          if (Array.isArray(result)) {
            if (result.length !== outputCount) {
              errors.push(
                `${fn.name}: Expected ${outputCount} outputs, got ${result.length}`
              );
            }
          } else if (outputCount > 1) {
            errors.push(
              `${fn.name}: Expected tuple with ${outputCount} fields, got single value`
            );
          }
        }

        testedFunctions.push(`✅ ${fn.name}`);
      } catch (err: any) {
        if (err.message.includes('execution reverted')) {
          // Expected for some functions (e.g., draw not found)
          testedFunctions.push(`⚠️ ${fn.name} (reverted - may be normal)`);
        } else {
          errors.push(`${fn.name}: ${err.message}`);
          testedFunctions.push(`❌ ${fn.name}`);
        }
      }
    }

    // Additional validations
    if (config.features.hasHourlyDraw) {
      const hasCurrentHourlyDrawId = config.abi.some(
        (fn: any) => fn.name === 'currentHourlyDrawId'
      );
      if (!hasCurrentHourlyDrawId) {
        warnings.push('Contract claims to have hourly draw but missing currentHourlyDrawId()');
      }
    }

    if (config.features.hasDailyDraw) {
      const hasCurrentDailyDrawId = config.abi.some(
        (fn: any) => fn.name === 'currentDailyDrawId'
      );
      if (!hasCurrentDailyDrawId) {
        warnings.push('Contract claims to have daily draw but missing currentDailyDrawId()');
      }
    }

  } catch (error: any) {
    errors.push(`Fatal error: ${error.message}`);
  }

  return {
    contractId,
    valid: errors.length === 0,
    errors,
    warnings,
    testedFunctions
  };
}

/**
 * Valida TODOS los contratos activos
 */
export async function validateAllContracts(): Promise<ValidationResult[]> {
  const activeContracts = Object.values(LOTTERY_CONTRACTS)
    .filter(c => c.status === 'active');

  const results = await Promise.all(
    activeContracts.map(c => validateContract(c.id))
  );

  return results;
}
```

---

### 3️⃣ GENERADOR AUTOMÁTICO DE CRONs

```typescript
// lib/contracts/cron-generator.ts

import { LOTTERY_CONTRACTS, LotteryConfig } from './registry';

export interface CronJob {
  path: string;
  schedule: string;
  description: string;
}

/**
 * Genera configuración de vercel.json para TODOS los contratos
 */
export function generateVercelCronConfig(): { crons: CronJob[] } {
  const crons: CronJob[] = [];

  for (const config of Object.values(LOTTERY_CONTRACTS)) {
    if (config.status !== 'active') continue;

    if (config.features.hasHourlyDraw) {
      // Close hourly draw
      crons.push({
        path: `/api/cron/${config.id}/close-hourly`,
        schedule: '0 * * * *', // Every hour at :00
        description: `Close hourly draw for ${config.name}`
      });

      // Execute hourly draw
      crons.push({
        path: `/api/cron/${config.id}/execute-hourly`,
        schedule: `${config.executeOffset} * * * *`, // Every hour at :05 (or configured offset)
        description: `Execute hourly draw for ${config.name}`
      });
    }

    if (config.features.hasDailyDraw) {
      // Close daily draw (8 PM Central = 2 AM UTC next day)
      crons.push({
        path: `/api/cron/${config.id}/close-daily`,
        schedule: '0 2 * * *', // Daily at 2 AM UTC
        description: `Close daily draw for ${config.name}`
      });

      // Execute daily draw
      crons.push({
        path: `/api/cron/${config.id}/execute-daily`,
        schedule: '5 2 * * *', // Daily at 2:05 AM UTC
        description: `Execute daily draw for ${config.name}`
      });
    }
  }

  return { crons };
}

/**
 * Script para actualizar vercel.json automáticamente
 */
export function updateVercelConfig() {
  const fs = require('fs');
  const path = require('path');

  const vercelPath = path.join(process.cwd(), 'vercel.json');
  let vercelConfig: any = {};

  // Read existing vercel.json
  if (fs.existsSync(vercelPath)) {
    vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  }

  // Generate crons
  const cronConfig = generateVercelCronConfig();

  // Update config
  vercelConfig.crons = cronConfig.crons;

  // Write back
  fs.writeFileSync(
    vercelPath,
    JSON.stringify(vercelConfig, null, 2),
    'utf8'
  );

  console.log(`✅ Updated vercel.json with ${cronConfig.crons.length} CRON jobs`);
  console.log('📋 CRON Jobs:');
  cronConfig.crons.forEach(cron => {
    console.log(`  - ${cron.schedule} → ${cron.path}`);
  });
}
```

---

### 4️⃣ API UNIFICADA (Auto-routing por contrato)

```typescript
// app/api/contracts/[contractId]/[action]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getContractById } from '@/lib/contracts/registry';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';

/**
 * UNIFIED API ENDPOINT
 * Handles ALL contracts automatically based on registry
 *
 * Examples:
 * GET /api/contracts/dual-crypto-v2/status
 * GET /api/contracts/dual-crypto-v2/current-draw
 * POST /api/contracts/dual-crypto-v2/close-hourly (CRON only)
 * POST /api/contracts/dual-crypto-v2/execute-hourly (CRON only)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string; action: string } }
) {
  const { contractId, action } = params;

  // Get contract config
  const config = getContractById(contractId);
  if (!config) {
    return NextResponse.json(
      { error: `Contract '${contractId}' not found` },
      { status: 404 }
    );
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
  });

  try {
    switch (action) {
      case 'status': {
        // Get all draw IDs and status
        const data: any = {};

        if (config.features.hasHourlyDraw) {
          const hourlyDrawId = await publicClient.readContract({
            address: config.address,
            abi: config.abi,
            functionName: 'currentHourlyDrawId'
          });

          const hourlyDraw = await publicClient.readContract({
            address: config.address,
            abi: config.abi,
            functionName: 'getHourlyDraw',
            args: [hourlyDrawId]
          });

          data.hourly = {
            drawId: Number(hourlyDrawId),
            draw: hourlyDraw
          };
        }

        if (config.features.hasDailyDraw) {
          const dailyDrawId = await publicClient.readContract({
            address: config.address,
            abi: config.abi,
            functionName: 'currentDailyDrawId'
          });

          const dailyDraw = await publicClient.readContract({
            address: config.address,
            abi: config.abi,
            functionName: 'getDailyDraw',
            args: [dailyDrawId]
          });

          data.daily = {
            drawId: Number(dailyDrawId),
            draw: dailyDraw
          };
        }

        return NextResponse.json({
          success: true,
          contract: {
            id: config.id,
            name: config.name,
            version: config.version,
            address: config.address
          },
          data
        });
      }

      case 'current-draw': {
        // Get current draw for UI display
        // ... similar to above
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 5️⃣ SCRIPT DE DEPLOYMENT

```bash
#!/bin/bash
# scripts/deploy-new-lottery.sh

echo "🚀 CRYPTO LOTTO - NEW CONTRACT DEPLOYMENT"
echo "=========================================="
echo ""

# 1. Validate inputs
if [ -z "$1" ]; then
  echo "❌ Error: Contract ID required"
  echo "Usage: ./deploy-new-lottery.sh <contract-id>"
  exit 1
fi

CONTRACT_ID=$1

echo "📋 Contract ID: $CONTRACT_ID"
echo ""

# 2. Validate contract exists in registry
echo "1️⃣ Validating contract registry..."
node -e "
const { getContractById } = require('./lib/contracts/registry');
const config = getContractById('$CONTRACT_ID');
if (!config) {
  console.error('❌ Contract not found in registry');
  process.exit(1);
}
console.log('✅ Contract found:', config.name);
console.log('   Address:', config.address);
console.log('   Chain:', config.chain);
"

# 3. Validate ABI
echo ""
echo "2️⃣ Validating contract ABI..."
node -e "
const { validateContract } = require('./lib/contracts/validator');
(async () => {
  const result = await validateContract('$CONTRACT_ID');

  console.log('Tested functions:');
  result.testedFunctions.forEach(fn => console.log('  ', fn));

  if (result.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    result.warnings.forEach(w => console.log('  ', w));
  }

  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(e => console.log('  ', e));
    process.exit(1);
  }

  console.log('✅ ABI validation passed');
})();
"

# 4. Update vercel.json with CRONs
echo ""
echo "3️⃣ Updating vercel.json with CRON jobs..."
node -e "
const { updateVercelConfig } = require('./lib/contracts/cron-generator');
updateVercelConfig();
"

# 5. Run tests
echo ""
echo "4️⃣ Running tests..."
npm run test:contract -- $CONTRACT_ID

# 6. Deploy to Vercel
echo ""
echo "5️⃣ Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "Next steps:"
echo "  1. Verify deployment at https://crypto-lotto-six.vercel.app"
echo "  2. Test ticket purchase"
echo "  3. Monitor first draw execution"
echo "  4. Update documentation"
```

---

### 6️⃣ DYNAMIC FRONTEND (Auto-detects contracts)

```typescript
// app/page.tsx

import { getActiveContracts } from '@/lib/contracts/registry';
import { DualCryptoPoolDisplay } from '@/components/DualCryptoPoolDisplay';
import { SimplePoolDisplay } from '@/components/SimplePoolDisplay';
// ... import all pool display components

const COMPONENT_MAP: Record<string, any> = {
  'DualCryptoPoolDisplay': DualCryptoPoolDisplay,
  'SimplePoolDisplay': SimplePoolDisplay,
  // Add new components here
};

export default function HomePage() {
  // Get ALL active lottery contracts
  const activeContracts = getActiveContracts();

  return (
    <main>
      <Hero />

      {/* Render pool displays for ALL active contracts */}
      <section className="pools">
        {activeContracts.map(contract => {
          const Component = COMPONENT_MAP[contract.ui.displayComponent];

          if (!Component) {
            console.error(`Component ${contract.ui.displayComponent} not found`);
            return null;
          }

          return (
            <Component
              key={contract.id}
              contractId={contract.id}
              config={contract}
            />
          );
        })}
      </section>

      {/* Ticket purchase form adapts to selected contract */}
      <TicketPurchaseForm contracts={activeContracts} />
    </main>
  );
}
```

---

## 🎯 BENEFITS

### ✅ Para Agregar Nuevo Contrato:

1. **Deploy contrato en blockchain**
2. **Agregar entrada en `lib/contracts/registry.ts`**:
   ```typescript
   'my-new-lottery-v1': {
     id: 'my-new-lottery-v1',
     name: 'My New Lottery',
     address: '0x...',
     abi: require('../abi/my-new-lottery').ABI,
     // ... config
   }
   ```
3. **Run script**:
   ```bash
   ./scripts/deploy-new-lottery.sh my-new-lottery-v1
   ```
4. **DONE!** ✅

### ✅ Validación Automática:
- ABI se valida contra contrato real
- Detecta field count mismatches
- Verifica funciones existen
- Warns sobre missing features

### ✅ CRONs Automáticos:
- `vercel.json` se genera automáticamente
- Schedules calculados desde config
- No más configuración manual

### ✅ API Unificada:
- Un solo endpoint para todos los contratos
- Auto-routing basado en registry
- Consistent response format

### ✅ Frontend Dinámico:
- Detecta contratos activos automáticamente
- Renderiza componentes correctos
- Adapta UI según features

---

## 📝 PRÓXIMOS PASOS

1. ✅ Implementar `lib/contracts/registry.ts`
2. ✅ Implementar `lib/contracts/validator.ts`
3. ✅ Crear API unificada `/api/contracts/[contractId]/[action]`
4. ✅ Migrar contratos existentes al nuevo sistema
5. ✅ Crear script de deployment
6. ✅ Documentar proceso para agregar nuevos contratos

---

## 🔐 SEGURIDAD

- ✅ Validación de ABI en CI/CD
- ✅ CRON auth mediante `requireCronAuth()`
- ✅ Contract address validation
- ✅ Version tracking
- ✅ Status flags (active/deprecated/testing)

---

**¿Te parece bien esta arquitectura? Mientras pruebas el boleto, puedo empezar a implementarla.**
