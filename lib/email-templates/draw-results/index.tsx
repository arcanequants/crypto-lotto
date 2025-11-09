import React from 'react';
import { UnstoppableDrawEmail } from './unstoppable';
import { MatrixDrawEmail } from './matrix';
import { FortuneDrawEmail } from './fortune';
import { RocketDrawEmail } from './rocket';
import { LightningDrawEmail } from './lightning';

export interface DrawResultEmailProps {
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  userNumber: number;
  ticketId: number;
}

// Template types for better type safety
export type DrawResultTemplate =
  | 'unstoppable'
  | 'matrix'
  | 'fortune'
  | 'rocket'
  | 'lightning';

// All available templates
const templates = {
  unstoppable: UnstoppableDrawEmail,
  matrix: MatrixDrawEmail,
  fortune: FortuneDrawEmail,
  rocket: RocketDrawEmail,
  lightning: LightningDrawEmail,
};

// Template names for random selection
const templateNames: DrawResultTemplate[] = [
  'unstoppable',
  'matrix',
  'fortune',
  'rocket',
  'lightning',
];

/**
 * Gets a random draw result template
 * This ensures each email sent has a fresh, unique design
 */
export function getRandomDrawTemplate(): DrawResultTemplate {
  const randomIndex = Math.floor(Math.random() * templateNames.length);
  return templateNames[randomIndex];
}

/**
 * Renders a random draw result email template
 * Use this when you want the system to automatically select a template
 */
export const RandomDrawResultEmail: React.FC<DrawResultEmailProps> = (props) => {
  const templateName = getRandomDrawTemplate();
  const TemplateComponent = templates[templateName];
  return <TemplateComponent {...props} />;
};

/**
 * Renders a specific draw result email template
 * Use this when you want to control which template is used
 */
export function DrawResultEmail({
  template,
  ...props
}: DrawResultEmailProps & { template: DrawResultTemplate }) {
  const TemplateComponent = templates[template];
  return <TemplateComponent {...props} />;
}

// Export all individual templates for direct use if needed
export {
  UnstoppableDrawEmail,
  MatrixDrawEmail,
  FortuneDrawEmail,
  RocketDrawEmail,
  LightningDrawEmail,
};

// Default export is the random selector
export default RandomDrawResultEmail;
