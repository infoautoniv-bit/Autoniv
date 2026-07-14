import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

let fromEmail = process.env.RESEND_FROM;
if (fromEmail && !fromEmail.includes('@')) {
  fromEmail = `noreply@${fromEmail}`;
}
const fromName = process.env.MAILERSEND_FROM_NAME || 'Autoniv';

export async function sendAppointmentEmail({ to, appointment }) {
  const name = String(appointment.name || 'there').trim();
  const service = String(appointment.service || 'your appointment').trim();
  const date = String(appointment.preferredDate || 'the scheduled date').trim();
  const time = String(appointment.preferredTime || 'the scheduled time').trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #080d17; border-radius: 12px; border: 1px solid rgba(0,119,255,0.15);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0077ff, #00c8b4); line-height: 48px; color: white; font-size: 20px; font-weight: bold;">A</div>
      </div>
      <h2 style="color: #ffffff; text-align: center; margin-bottom: 8px;">Appointment Confirmed</h2>
      <p style="color: #94a3b8; text-align: center; font-size: 14px; margin-bottom: 24px;">
        Hi ${name}, your appointment has been confirmed!
      </p>
      <div style="background: rgba(0,119,255,0.1); border: 1px solid rgba(0,119,255,0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; color: #e2e8f0; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #94a3b8;">Service</td><td style="padding: 6px 0; text-align: right;">${service}</td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Date</td><td style="padding: 6px 0; text-align: right;">${date}</td></tr>
          <tr><td style="padding: 6px 0; color: #94a3b8;">Time</td><td style="padding: 6px 0; text-align: right;">${time}</td></tr>
        </table>
      </div>
      <p style="color: #64748b; text-align: center; font-size: 12px;">If you need to reschedule, please contact us.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: 'Autoniv — Appointment Confirmed',
    html,
  });

  if (error) throw error;
  return data;
}

export async function sendOtpEmail({ to, otp, purpose }) {
  const purposeText = purpose === 'register'
    ? 'verify your registration'
    : purpose === 'login'
      ? 'sign in'
      : 'reset your password';

  console.log(`\n\x1b[36m╔══════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[36m║\x1b[0m  \x1b[1mOTP Code\x1b[0m: \x1b[33m${otp}\x1b[0m`);
  console.log(`\x1b[36m║\x1b[0m  \x1b[1mEmail\x1b[0m:   ${to}`);
  console.log(`\x1b[36m║\x1b[0m  \x1b[1mPurpose\x1b[0m: ${purpose}`);
  console.log(`\x1b[36m╚══════════════════════════════════════════╝\x1b[0m\n`);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #080d17; border-radius: 12px; border: 1px solid rgba(0,119,255,0.15); color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0077ff, #00c8b4); line-height: 48px; color: white; font-size: 20px; font-weight: bold; text-align: center;">A</div>
      </div>
      <h2 style="color: #ffffff; text-align: center; margin-bottom: 8px; font-size: 20px;">Verification Code</h2>
      <p style="color: #94a3b8; text-align: center; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">
        Please use the verification code below to ${purposeText}. This code will expire in 10 minutes.
      </p>
      <div style="background: rgba(0,119,255,0.08); border: 1px solid rgba(0,119,255,0.25); border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0077ff; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; text-align: center; font-size: 12px; line-height: 1.5;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Autoniv — Verification Code',
      html,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send OTP email via Resend:', error?.message || error);
    console.log(`\n========================================\n[DEV ONLY] OTP verification code: ${otp} for email: ${to} (purpose: ${purpose})\n========================================\n`);
  }
}
