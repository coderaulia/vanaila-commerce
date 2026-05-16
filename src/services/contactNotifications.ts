import { env } from '@/services/env';

type ContactSubmissionPayload = {
  name: string;
  email: string;
  company: string;
  serviceCategory: string;
  projectOverview: string;
  createdAt: string;
};

export async function notifyContactSubmission(submission: ContactSubmissionPayload) {
  const webhookUrl = env.contactNotificationWebhookUrl;
  if (!webhookUrl) {
    return { delivered: false };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (env.contactNotificationWebhookToken) {
    headers.Authorization = `Bearer ${env.contactNotificationWebhookToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(webhookUrl, {
      method: env.contactNotificationWebhookMethod,
      headers,
      body: JSON.stringify({
        event: 'contact_submission_created',
        payload: submission,
        source: 'react-cms'
      }),
      signal: controller.signal
    });

    return {
      delivered: response.ok,
      status: response.status,
      statusText: response.statusText
    };
  } catch (err) {
    // Log only the error message — never log headers or the Authorization token
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('[contact-notification] Webhook delivery failed:', message);
    return { delivered: false };
  } finally {
    clearTimeout(timeout);
  }
}
