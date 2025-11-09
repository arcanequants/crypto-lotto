import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';
import {
  DepositConfirmedEmail,
  DepositBulkEmail,
  RandomDrawResultEmail,
  PrizeWonPremiumEmail,
} from '@/lib/email-templates';
import {
  sendDepositNotification,
  sendDrawResultNotification,
  sendPrizeWonNotification,
  type DepositNotificationData,
  type DrawResultNotificationData,
  type PrizeWonNotificationData,
} from '@/lib/notifications/notification-manager';
import { updateNotificationStatus } from '@/lib/database/notifications';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/notifications/send
 *
 * Send email notifications to users
 * Handles consolidation and batching automatically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      );
    }

    let result;
    let emailHtml;
    let emailSubject;
    let toEmail;

    // Process based on notification type
    switch (type) {
      case 'deposit_confirmed':
        result = await sendDepositNotification(data as DepositNotificationData);

        if (!result.shouldSendEmail || !data.emailAddress) {
          return NextResponse.json({
            success: true,
            emailSent: false,
            toastMessage: result.toastMessage,
          });
        }

        // Render email based on template
        if (result.template === 'deposit-confirmed') {
          emailHtml = render(React.createElement(DepositConfirmedEmail, result.props));
          emailSubject = '✅ Deposit Confirmed!';
        } else {
          emailHtml = render(React.createElement(DepositBulkEmail, result.props));
          emailSubject = `✅ ${result.props.ticketCount} Tickets Purchased!`;
        }

        toEmail = data.emailAddress;
        break;

      case 'draw_result':
        result = await sendDrawResultNotification(data as DrawResultNotificationData);

        if (!result.shouldSendEmail || !data.emailAddress) {
          return NextResponse.json({
            success: true,
            emailSent: false,
            toastMessage: result.toastMessage,
          });
        }

        emailHtml = render(React.createElement(RandomDrawResultEmail, result.props));
        emailSubject = `🎲 Draw #${result.props.drawId} Results`;
        toEmail = data.emailAddress;
        break;

      case 'prize_won':
        result = await sendPrizeWonNotification(data as PrizeWonNotificationData);

        if (!result.shouldSendEmail || !data.emailAddress) {
          return NextResponse.json({
            success: true,
            emailSent: false,
            toastMessage: result.toastMessage,
          });
        }

        emailHtml = render(React.createElement(PrizeWonPremiumEmail, result.props));
        emailSubject = '🎊 YOU WON!';
        toEmail = data.emailAddress;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    // Send email via Resend
    try {
      const emailResponse = await resend.emails.send({
        from: 'CryptoLotto <noreply@cryptolotto.app>',
        to: toEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      // Update notification status
      if (result.notificationId) {
        await updateNotificationStatus(
          result.notificationId,
          'sent',
          emailResponse.data?.id
        );
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        emailId: emailResponse.data?.id,
        toastMessage: result.toastMessage,
      });
    } catch (emailError: any) {
      console.error('Email send error:', emailError);

      // Update notification status as failed
      if (result.notificationId) {
        await updateNotificationStatus(
          result.notificationId,
          'failed',
          undefined,
          emailError.message
        );
      }

      // Still return success for toast, but indicate email failed
      return NextResponse.json({
        success: true,
        emailSent: false,
        emailError: emailError.message,
        toastMessage: result.toastMessage,
      });
    }
  } catch (error: any) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/send
 *
 * Test endpoint to verify API is working
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Notifications API is running',
    version: '1.0.0',
  });
}
