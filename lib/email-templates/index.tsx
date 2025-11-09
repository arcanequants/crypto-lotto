/**
 * Email Templates Index
 *
 * This module exports all email templates used in CryptoLotto.
 * Templates are built with React and inline CSS for maximum email client compatibility.
 */

// Deposit Confirmation Emails
export { DepositConfirmedEmail } from './deposit-confirmed';
export type { DepositConfirmedEmailProps } from './deposit-confirmed';

export { DepositBulkEmail } from './deposit-bulk';
export type { DepositBulkEmailProps } from './deposit-bulk';

// Prize Won Email
export { PrizeWonPremiumEmail } from './prize-won-premium';
export type { PrizeWonPremiumEmailProps, PrizeAsset } from './prize-won-premium';

// Draw Results Emails (Random Rotating Templates)
export {
  RandomDrawResultEmail,
  DrawResultEmail,
  getRandomDrawTemplate,
  UnstoppableDrawEmail,
  MatrixDrawEmail,
  FortuneDrawEmail,
  RocketDrawEmail,
  LightningDrawEmail,
} from './draw-results';

export type {
  DrawResultEmailProps,
  DrawResultTemplate,
} from './draw-results';
