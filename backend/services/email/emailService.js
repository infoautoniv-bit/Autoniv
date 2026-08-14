import { Resend } from 'resend';
import { log } from '../logger.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

let fromEmail = process.env.RESEND_FROM;
if (fromEmail && !fromEmail.includes('@')) {
  fromEmail = `noreply@${fromEmail}`;
}
const fromName = process.env.MAILERSEND_FROM_NAME || 'Autoniv';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info.autoniv@gmail.com';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderEmailTemplate({ title, subtitle, contentHtml, footerNote }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #0b1329; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
                <tr>
                  <td style="background: linear-gradient(135deg, #1d4ed8, #059669); padding: 28px 32px; text-align: center;">
                    <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 12px auto;">
                      <tr>
                        <td align="center" valign="middle">
                          <img src="https://autoniv.com/apple-touch-icon.webp" alt="Autoniv Logo" width="48" height="48" style="width: 48px; height: 48px; border-radius: 12px; display: block; border: 0; outline: none; text-decoration: none;" />
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; tracking: -0.5px;">Autoniv</h1>
                    <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500; margin: 4px 0 0 0;">AI Voice & Chat Automation Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 28px; color: #f1f5f9;">
                    <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">${escapeHtml(title)}</h2>
                    ${subtitle ? `<p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px 0; text-align: center; line-height: 1.5;">${escapeHtml(subtitle)}</p>` : ''}
                    ${contentHtml}
                    ${footerNote ? `<p style="color: #64748b; font-size: 12px; margin: 24px 0 0 0; text-align: center; line-height: 1.5;">${escapeHtml(footerNote)}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #070d1e; padding: 20px 28px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                    <p style="color: #475569; font-size: 11px; margin: 0; line-height: 1.6;">
                      © ${new Date().getFullYear()} Autoniv AI Inc. All rights reserved.<br>
                      Automated notification sent via enterprise Resend engine.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendAppointmentEmail({ to, appointment }) {
  if (!to || !to.includes('@')) return null;

  const name = escapeHtml(String(appointment.name || 'Valued Customer').trim());
  const service = escapeHtml(String(appointment.service || 'Scheduled Service').trim());
  const date = escapeHtml(String(appointment.preferredDate || 'Upcoming Date').trim());
  const time = escapeHtml(String(appointment.preferredTime || 'Confirmed Time').trim());

  const contentHtml = `
    <div style="background-color: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.25); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #e2e8f0;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Customer</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #ffffff;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Service</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #3b82f6;">${service}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Date</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #ffffff;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Time Slot</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #10b981;">${time}</td>
        </tr>
      </table>
    </div>
  `;

  const html = renderEmailTemplate({
    title: 'Appointment Confirmed ✨',
    subtitle: `Hi ${name}, your booking request has been confirmed by our AI scheduling assistant.`,
    contentHtml,
    footerNote: 'Need to make changes? You can update your booking anytime through the Autoniv portal.',
  });

  const text = `Hi ${name},\n\nYour appointment for ${service} on ${date} at ${time} has been confirmed.\n\nThank you for choosing Autoniv!`;

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: 'Autoniv — Appointment Confirmed',
    html,
    text,
  });

  if (error) throw error;
  return data;
}

export async function sendOtpEmail({ to, otp, purpose }) {
  if (!to || !to.includes('@')) return null;

  const purposeText = purpose === 'register'
    ? 'verify your registration'
    : purpose === 'login'
      ? 'sign in to your dashboard'
      : 'reset your account password';

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n\x1b[36m╔══════════════════════════════════════════╗\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  \x1b[1mOTP Code\x1b[0m: \x1b[33m${otp}\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  \x1b[1mEmail\x1b[0m:   ${to}`);
    console.log(`\x1b[36m║\x1b[0m  \x1b[1mPurpose\x1b[0m: ${purpose}`);
    console.log(`\x1b[36m╚══════════════════════════════════════════╝\x1b[0m\n`);
  }

  const contentHtml = `
    <div style="background: rgba(37, 99, 235, 0.1); border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 20px;">
      <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #3b82f6; font-family: 'Courier New', monospace;">${otp}</span>
    </div>
  `;

  const html = renderEmailTemplate({
    title: 'Verification Code 🔑',
    subtitle: `Please use the code below to ${purposeText}. This security code expires in 10 minutes.`,
    contentHtml,
    footerNote: "If you didn't request this verification code, please ignore this email or contact support.",
  });

  const text = `Your Autoniv verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `Autoniv Verification Code: ${otp}`,
      html,
      text,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send OTP email via Resend:', error?.message || error);
  }
}

export async function sendContactNotification({ name, email, phone, company, message, utmSource, utmMedium, utmCampaign }) {
  const safeName = escapeHtml(name || 'Anonymous');
  const safeEmail = escapeHtml(email || 'N/A');
  const safePhone = escapeHtml(phone || 'N/A');
  const safeCompany = escapeHtml(company || 'N/A');
  const safeMessage = escapeHtml(message || '');
  const safeUtmSource = escapeHtml(utmSource || '');
  const safeUtmCampaign = escapeHtml(utmCampaign || '');

  const contentHtml = `
    <div style="background-color: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #cbd5e1;">
        <tr><td style="padding: 6px 0; color: #94a3b8;">Sender Name</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${safeName}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Email Address</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #3b82f6;">${safeEmail}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Phone Number</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${safePhone}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Company</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${safeCompany}</td></tr>
        ${safeUtmSource ? `<tr><td style="padding: 6px 0; color: #94a3b8;">Ad Source</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #10b981;">${safeUtmSource} (${safeUtmCampaign || 'Direct Ad'})</td></tr>` : ''}
      </table>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0 0 6px 0;">Message Payload:</p>
        <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin: 0;">${safeMessage}</p>
      </div>
    </div>
  `;

  const html = renderEmailTemplate({
    title: 'New Website Contact Form 📩',
    subtitle: `Inbound inquiry received from ${safeName}.`,
    contentHtml,
  });

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: ADMIN_EMAIL,
    subject: `New Contact: ${safeName} — Autoniv`,
    html,
  });

  if (error) throw error;
  return data;
}

export async function sendSupportNotification({ name, email, subject, message }) {
  const safeName = escapeHtml(name || 'Dashboard User');
  const safeEmail = escapeHtml(email || 'N/A');
  const safeSubject = escapeHtml(subject || 'Support Ticket');
  const safeMessage = escapeHtml(message || '');

  const contentHtml = `
    <div style="background-color: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #cbd5e1;">
        <tr><td style="padding: 6px 0; color: #94a3b8;">User Name</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${safeName}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Email</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #3b82f6;">${safeEmail}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Ticket Subject</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #10b981;">${safeSubject}</td></tr>
      </table>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0 0 6px 0;">Ticket Description:</p>
        <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin: 0;">${safeMessage}</p>
      </div>
    </div>
  `;

  const html = renderEmailTemplate({
    title: 'New Support Ticket 🎫',
    subtitle: `Support ticket #${Date.now().toString().slice(-6)} submitted by ${safeName}.`,
    contentHtml,
  });

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: ADMIN_EMAIL,
    subject: `Support Ticket: ${safeSubject} — Autoniv`,
    html,
  });

  if (error) throw error;
  return data;
}

export async function sendLeadNotification({ name, email, phone, purpose, notes }) {
  const safeName = escapeHtml(name || 'Captured Lead');
  const safeEmail = escapeHtml(email || 'N/A');
  const safePhone = escapeHtml(phone || 'N/A');
  const safePurpose = escapeHtml(purpose || 'N/A');
  const safeNotes = escapeHtml(notes || '');

  const contentHtml = `
    <div style="background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #cbd5e1;">
        <tr><td style="padding: 6px 0; color: #94a3b8;">Lead Name</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${safeName}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Email</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #3b82f6;">${safeEmail}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Phone</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #10b981;">${safePhone}</td></tr>
        <tr><td style="padding: 6px 0; color: #94a3b8;">Goal / Purpose</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${safePurpose}</td></tr>
      </table>
      ${safeNotes ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0 0 6px 0;">AI Conversation Notes:</p>
        <p style="color: #f1f5f9; font-size: 14px; line-height: 1.6; margin: 0;">${safeNotes}</p>
      </div>` : ''}
    </div>
  `;

  const html = renderEmailTemplate({
    title: 'New AI Lead Captured 🎯',
    subtitle: `An inbound lead was qualified by your Autoniv AI Assistant.`,
    contentHtml,
  });

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: ADMIN_EMAIL,
    subject: `New Lead: ${safeName} — Autoniv`,
    html,
  });

  if (error) throw error;
  return data;
}

export async function sendCustomerLeadConfirmationEmail({ to, name }) {
  if (!to || !to.includes('@')) return null;
  const safeName = escapeHtml(name || 'there');

  const contentHtml = `
    <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Thank you for reaching out to <strong>Autoniv</strong>! We have received your request for a 24/7 AI Voice Agent & Chat Automation consultation.
    </p>
    <div style="background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 20px; margin: 20px 0;">
      <p style="color: #34d399; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;">What happens next?</p>
      <ul style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
        <li>Our AI Solutions Specialist will review your business requirements.</li>
        <li>We will reach out to you within 24 hours to schedule your live voice agent demo.</li>
      </ul>
    </div>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">Need immediate assistance? Feel free to reply directly to this email or call our team at <strong>+91-7065990307</strong>.</p>
  `;

  const html = renderEmailTemplate({
    title: `We Received Your Request, ${safeName}! 🚀`,
    subtitle: 'Your 24/7 AI Voice & Chat Solution inquiry has been registered.',
    contentHtml,
    footerNote: 'Autoniv — Empowering businesses with 24/7 AI calling and conversational automation.',
  });

  try {
    if (!resend || !resend.emails) return null;
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Thank You for Reaching Out to Autoniv AI',
      html,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send customer confirmation email:', error?.message || error);
    return null;
  }
}

export async function sendWelcomeEmail({ to, name }) {
  if (!to || !to.includes('@')) return null;
  const safeName = escapeHtml(name || 'Creator');

  const contentHtml = `
    <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Welcome to Autoniv! Your account is active and ready for AI vocal agent deployment and live chatbot automation.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://autoniv.ai/dashboard" style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #059669); color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 10px 20px rgba(29, 78, 216, 0.3);">
        Launch Your AI Dashboard 🚀
      </a>
    </div>
  `;

  const html = renderEmailTemplate({
    title: `Welcome to Autoniv, ${safeName}! 👋`,
    subtitle: 'Automate incoming phone calls and live website lead capture 24/7.',
    contentHtml,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: 'Welcome to Autoniv — AI Vocal & Chat Automation',
      html,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error?.message || error);
  }
}

export async function sendTeamInviteEmail({ to, inviterName, role }) {
  if (!to || !to.includes('@')) return null;
  const safeInviter = escapeHtml(inviterName || 'Your team admin');
  const roleLabel = escapeHtml(role || 'member');

  const contentHtml = `
    <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      <strong>${safeInviter}</strong> has invited you to join their organization's Autoniv AI workspace as a <strong>${roleLabel}</strong>.
    </p>
    <div style="background-color: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.25); border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #e2e8f0;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Workspace Inviter</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #ffffff;">${safeInviter}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; font-weight: 500;">Assigned Role</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #10b981; text-transform: capitalize;">${roleLabel}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://autoniv.ai/login" style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #059669); color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 10px 20px rgba(29, 78, 216, 0.3);">
        Accept Invitation & Join Team 🚀
      </a>
    </div>
  `;

  const html = renderEmailTemplate({
    title: `Team Invitation — Autoniv`,
    subtitle: `You've been invited to collaborate on AI vocal agents and chatbot automation.`,
    contentHtml,
    footerNote: 'If you were not expecting this invitation, you can safely ignore this email.',
  });

  try {
    if (!resend || !resend.emails) {
      log.warn('resend_not_configured_skipping_email', { to });
      return null;
    }
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: `Invitation: Join ${safeInviter}'s Team on Autoniv`,
      html,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    log.error('team_invite_email_error', { error: error.message, to });
    return null;
  }
}
