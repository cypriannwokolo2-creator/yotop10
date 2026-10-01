import { AppError } from './errors';
import { SecretsManager } from './secrets';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = 'YoTop10';
const SENDER_EMAIL = 'noreply@yotop10.com';

export type OtpEmailPurpose = 'register' | 'login' | 'reset';

const SUBJECTS: Record<OtpEmailPurpose, string> = {
  register: 'Your YoTop10 verification code',
  login: 'Your YoTop10 login code',
  reset: 'Your YoTop10 password reset code',
};

function buildHtmlContent(purpose: OtpEmailPurpose, code: string): string {
  const intro =
    purpose === 'register'
      ? 'Verify your email address to create your YoTop10 account.'
      : purpose === 'login'
        ? 'Sign in to your YoTop10 account with this code.'
        : 'Reset your YoTop10 password with this code.';
  return (
    `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">` +
    `<h2 style="margin-bottom: 16px;">YoTop10</h2>` +
    `<p>${intro}</p>` +
    `<p style="font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 24px 0;">${code}</p>` +
    `<p style="color: #666;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>` +
    `</div>`
  );
}

/**
 * Send a 6-digit OTP email via Brevo.
 *
 * When BREVO_API_KEY is not configured the sender runs in log-only
 * mode: the code is logged server-side and the function returns true
 * (never throws), so auth flows stay testable in development.
 *
 * When the key IS configured, any Brevo API failure throws an
 * EMAIL_UNAVAILABLE (503) AppError for the route to surface.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: OtpEmailPurpose,
): Promise<boolean> {
  const apiKey = await SecretsManager.getSecretWithFallback('BREVO_API_KEY', '');

  if (!apiKey) {
    // Log-only mode (development): never break the auth flow.
    console.log(`[Brevo] Log-only mode (BREVO_API_KEY unset) — ${purpose} OTP for ${email}: ${code}`);
    return true;
  }

  let response: Response;
  try {
    response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email }],
        subject: SUBJECTS[purpose],
        htmlContent: buildHtmlContent(purpose, code),
      }),
    });
  } catch (err) {
    console.error('[Brevo] Request failed:', (err as Error).message);
    throw new AppError('Email service temporarily unavailable. Try again shortly.', 'EMAIL_UNAVAILABLE', 503);
  }

  if (!response.ok) {
    console.error(`[Brevo] API responded ${response.status} for ${purpose} OTP to ${email}`);
    throw new AppError('Email service temporarily unavailable. Try again shortly.', 'EMAIL_UNAVAILABLE', 503);
  }

  return true;
}
