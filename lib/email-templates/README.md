# CryptoLotto Email Templates

This directory contains all email templates used in the CryptoLotto application.

## Template Types

### 1. Deposit Confirmed (`deposit-confirmed.tsx`)
Sent when a user's USDC deposit is confirmed on-chain.

**Props:**
- `amount`: The amount deposited (e.g., "10.00")
- `transactionHash`: The blockchain transaction hash
- `timestamp`: Human-readable timestamp

**Usage:**
```tsx
import { DepositConfirmedEmail } from '@/lib/email-templates';

<DepositConfirmedEmail
  amount="10.00"
  transactionHash="0x..."
  timestamp="Nov 8, 2025 5:43 PM"
/>
```

### 2. Prize Won (`prize-won-premium.tsx`)
Sent when a user wins a prize.

**Props:**
- `drawId`: The draw number
- `drawDate`: Human-readable date
- `ticketId`: The winning ticket ID
- `winningNumber`: The winning lottery number
- `totalValueUSD`: Total prize value in USD
- `assets`: Array of prize assets with symbol, emoji, amount, USD value, and color

**Usage:**
```tsx
import { PrizeWonPremiumEmail } from '@/lib/email-templates';

<PrizeWonPremiumEmail
  drawId={1}
  drawDate="Nov 8, 2025"
  ticketId={0}
  winningNumber={42}
  totalValueUSD="50.25"
  assets={[
    { symbol: 'BITCOIN', emoji: '₿', amount: '0.00042 BTC', usdValue: '38.50', color: '#ffa500' },
    { symbol: 'ETHEREUM', emoji: 'Ξ', amount: '0.0056 ETH', usdValue: '9.25', color: '#00f0ff' },
    { symbol: 'USDC', emoji: '💵', amount: '$2.50', usdValue: '2.50', color: '#ffffff' },
  ]}
/>
```

### 3. Draw Results (`draw-results/`)
Sent after each draw to inform users of the results. **Features 5 rotating templates** to keep emails fresh and exciting!

**Available Templates:**
1. **Unstoppable** (⚡) - High energy, bold VS display
2. **Matrix** (🎰) - Hacker terminal style with green Matrix vibes
3. **Fortune** (🔮) - Mystical fortune teller theme
4. **Rocket** (🚀) - Space/moon theme "to the moon"
5. **Lightning** (⚡) - Electric golden lightning energy

**Props (same for all templates):**
- `drawId`: The draw number
- `drawDate`: Human-readable date
- `drawTime`: Human-readable time
- `winningNumber`: The winning lottery number
- `userNumber`: The user's lottery number
- `ticketId`: The user's ticket ID

**Usage (Random Template):**
```tsx
import { RandomDrawResultEmail } from '@/lib/email-templates';

// This will automatically select a random template each time
<RandomDrawResultEmail
  drawId={1}
  drawDate="November 8, 2025"
  drawTime="5:43 PM"
  winningNumber={42}
  userNumber={56}
  ticketId={0}
/>
```

**Usage (Specific Template):**
```tsx
import { DrawResultEmail } from '@/lib/email-templates';

// Specify which template to use
<DrawResultEmail
  template="rocket"
  drawId={1}
  drawDate="November 8, 2025"
  drawTime="5:43 PM"
  winningNumber={42}
  userNumber={56}
  ticketId={0}
/>
```

**Direct Template Import:**
```tsx
import { RocketDrawEmail } from '@/lib/email-templates';

<RocketDrawEmail
  drawId={1}
  drawDate="November 8, 2025"
  drawTime="5:43 PM"
  winningNumber={42}
  userNumber={56}
  ticketId={0}
/>
```

## Template Features

### Rotating Draw Templates
The draw result emails use a random rotation system to keep each email unique and engaging:

- Each email sent selects a random template from the 5 available options
- Users never know which theme they'll receive next
- Increases email open rates and user engagement
- Each template has unique motivational quotes that rotate:
  - **Unstoppable**: "Fortune favors the bold."
  - **Matrix**: "The best hackers never quit."
  - **Fortune**: "Luck is what happens when preparation meets opportunity."
  - **Rocket**: "The moon is just the beginning."
  - **Lightning**: "Lightning never strikes in the same place... until it does."

### Email Client Compatibility
All templates are built with:
- Inline CSS (no external stylesheets)
- Table-based layouts for maximum compatibility
- Google Fonts (Orbitron, Inter, Source Code Pro, Cinzel)
- Tested for Gmail, Outlook, Apple Mail, and web clients
- Responsive design for mobile and desktop

### Design System
All templates follow the CryptoLotto design system:
- **Primary**: #00f0ff (cyan)
- **Secondary**: #ff00ff (magenta)
- **Accent**: #ffd700 (gold)
- **Dark**: #0a0e27
- **Darker**: #050811
- **Fonts**: Orbitron (headers), Inter (body text)

## Development

### Adding a New Template
1. Create a new `.tsx` file in the appropriate directory
2. Use React with inline styles
3. Export the component and its props interface
4. Add to `index.tsx` exports
5. Test with multiple email clients

### Testing Templates
Use the Resend API or a local email testing tool to preview templates across different email clients.

## Future Enhancements
- Add more rotating templates for draw results
- Create templates for other notification types
- A/B testing framework for template performance
- Analytics tracking for email opens and clicks
