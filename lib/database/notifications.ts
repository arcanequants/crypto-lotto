import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Notification types
export type NotificationType = 'deposit_confirmed' | 'draw_result' | 'prize_won';
export type NotificationChannel = 'email' | 'toast' | 'both';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type DrawTemplate = 'unstoppable' | 'matrix' | 'fortune' | 'rocket' | 'lightning';

// Notification record interface
export interface NotificationRecord {
  id: string;
  user_address: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  template_name?: DrawTemplate | null;
  data: Record<string, any>;
  email_address?: string | null;
  email_id?: string | null;
  email_error?: string | null;
  created_at: string;
  sent_at?: string | null;
}

// Create notification record
export interface CreateNotificationParams {
  userAddress: string;
  type: NotificationType;
  channel: NotificationChannel;
  data: Record<string, any>;
  emailAddress?: string;
  templateName?: DrawTemplate;
}

/**
 * Create a new notification record
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationRecord | null> {
  const { userAddress, type, channel, data, emailAddress, templateName } = params;

  const { data: record, error } = await supabase
    .from('notifications')
    .insert({
      user_address: userAddress.toLowerCase(),
      type,
      channel,
      status: 'pending',
      data,
      email_address: emailAddress,
      template_name: templateName,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return record;
}

/**
 * Update notification status
 */
export async function updateNotificationStatus(
  id: string,
  status: NotificationStatus,
  emailId?: string,
  emailError?: string
): Promise<boolean> {
  const updateData: any = {
    status,
    sent_at: status === 'sent' ? new Date().toISOString() : undefined,
  };

  if (emailId) updateData.email_id = emailId;
  if (emailError) updateData.email_error = emailError;

  const { error } = await supabase
    .from('notifications')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating notification status:', error);
    return false;
  }

  return true;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userAddress: string,
  limit: number = 50
): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get failed notifications
 */
export async function getFailedNotifications(limit: number = 100): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching failed notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get template usage statistics
 */
export async function getTemplateStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('template_name')
    .eq('type', 'draw_result')
    .not('template_name', 'is', null);

  if (error) {
    console.error('Error fetching template stats:', error);
    return {};
  }

  const stats: Record<string, number> = {};
  data?.forEach((record) => {
    const template = record.template_name;
    if (template) {
      stats[template] = (stats[template] || 0) + 1;
    }
  });

  return stats;
}

/**
 * Delete old notifications (cleanup)
 */
export async function deleteOldNotifications(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select();

  if (error) {
    console.error('Error deleting old notifications:', error);
    return 0;
  }

  return data?.length || 0;
}
