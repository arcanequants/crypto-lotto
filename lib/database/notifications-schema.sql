-- CryptoLotto Notifications Table
-- Stores notification history for users (emails, toasts, etc.)

CREATE TABLE IF NOT EXISTS notifications (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User identification
  user_address TEXT NOT NULL, -- Ethereum address (lowercase)

  -- Notification metadata
  type TEXT NOT NULL, -- 'deposit_confirmed', 'draw_result', 'prize_won'
  channel TEXT NOT NULL, -- 'email', 'toast', 'both'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'

  -- Template information (for draw results)
  template_name TEXT, -- 'unstoppable', 'matrix', 'fortune', 'rocket', 'lightning', null for others

  -- Notification data (JSON)
  data JSONB NOT NULL, -- Flexible storage for template props

  -- Email specific fields
  email_address TEXT, -- User's email if available
  email_id TEXT, -- Resend email ID for tracking
  email_error TEXT, -- Error message if email failed

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for common queries
  CONSTRAINT notifications_type_check CHECK (type IN ('deposit_confirmed', 'draw_result', 'prize_won')),
  CONSTRAINT notifications_channel_check CHECK (channel IN ('email', 'toast', 'both')),
  CONSTRAINT notifications_status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_address ON notifications(user_address);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Composite index for user notification history
CREATE INDEX IF NOT EXISTS idx_notifications_user_history ON notifications(user_address, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Stores notification history for CryptoLotto users';
COMMENT ON COLUMN notifications.user_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN notifications.type IS 'Type of notification: deposit_confirmed, draw_result, prize_won';
COMMENT ON COLUMN notifications.channel IS 'Delivery channel: email, toast, or both';
COMMENT ON COLUMN notifications.status IS 'Notification status: pending, sent, or failed';
COMMENT ON COLUMN notifications.template_name IS 'Draw result template name (unstoppable, matrix, fortune, rocket, lightning)';
COMMENT ON COLUMN notifications.data IS 'JSON data for the notification template';
COMMENT ON COLUMN notifications.email_id IS 'Resend email ID for tracking delivery status';

-- Example queries:

-- Get all notifications for a user
-- SELECT * FROM notifications WHERE user_address = '0x...' ORDER BY created_at DESC;

-- Get failed notifications
-- SELECT * FROM notifications WHERE status = 'failed';

-- Get all draw result notifications with template breakdown
-- SELECT template_name, COUNT(*) FROM notifications WHERE type = 'draw_result' GROUP BY template_name;

-- Get notification history for the last 30 days
-- SELECT * FROM notifications WHERE created_at > NOW() - INTERVAL '30 days' ORDER BY created_at DESC;
