import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import type { NotificationType } from '../types';

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Admin Supabase client to bypass RLS when fetching subscriptions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Notifications will not send.');
}

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  type?: NotificationType;
}

export async function POST(request: Request) {
  try {
    const { userId, title, body, icon, url, type }: NotificationPayload = await request.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Fetch all active subscriptions for the user
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'User has no active push subscriptions' });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192.png',
      url: url || '/',
      type: type || 'general',
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        return { success: true, endpoint: sub.endpoint };
      } catch (err: unknown) {
        console.error('Error sending push notification:', err);
        const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err ? (err as { statusCode?: number }).statusCode : undefined;
        const message = err instanceof Error ? err.message : 'Unknown notification error';

        // Remove invalid subscriptions (e.g. user revoked permission)
        if (statusCode === 404 || statusCode === 410) {
          console.log(`Removing invalid subscription: ${sub.endpoint}`);
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }

        return { success: false, endpoint: sub.endpoint, error: message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successful = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${successful}/${subscriptions.length} devices`,
      results
    });

  } catch (error: unknown) {
    console.error('Push notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

