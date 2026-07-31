import { Resend } from "resend";

// Production mailer: Resend. Without RESEND_API_KEY the reset link is logged to
// the server console instead (dev fallback), keeping the flow fully testable.
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Alumni Network <onboarding@resend.dev>",
    to,
    subject: "Reset your Alumni Network password",
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1A1A1A; margin: 0 0 8px;">Reset your password</h2>
        <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset the password for your Alumni Network account.
          This link is valid for <strong>1 hour</strong> and can only be used once.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #E31E24; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
          Reset password
        </a>
        <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `,
  });
}

// Same dev-fallback pattern as password reset: without RESEND_API_KEY the
// verification link is logged to the server console so the flow stays testable.
export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Email verification link for ${to}: ${verifyUrl}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Alumni Network <onboarding@resend.dev>",
    to,
    subject: "Verify your Alumni Network email",
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1A1A1A; margin: 0 0 8px;">Confirm your email</h2>
        <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Thanks for joining the Alumni Network. Confirm your email address to activate your
          account. This link is valid for <strong>24 hours</strong> and can only be used once.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #E31E24; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
          Verify email
        </a>
        <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
