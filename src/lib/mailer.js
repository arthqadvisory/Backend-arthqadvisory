import nodemailer from 'nodemailer'

const inquiryRecipient = process.env.INQUIRY_NOTIFICATION_EMAIL || 'arthqadvisory@gmail.com'
const acknowledgementEnabled = process.env.SEND_INQUIRY_ACKNOWLEDGEMENT !== 'false'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildTransport() {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpSecure = process.env.SMTP_SECURE === 'true'

  if (!smtpUser || !smtpPass) {
    return null
  }

  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })
}

function resolveFromAddress() {
  // Gmail SMTP is strict about the From header matching the authenticated mailbox.
  if (!process.env.SMTP_HOST) {
    return process.env.SMTP_USER
  }

  return process.env.MAIL_FROM || process.env.SMTP_USER
}

export async function sendInquiryNotification({ name, email, phone, service, message }) {
  const transport = buildTransport()

  if (!transport) {
    return {
      sent: false,
      reason: 'Mail transport is not configured.'
    }
  }

  const safePhone = phone?.trim() ? phone : 'Not provided'
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safePhoneHtml = escapeHtml(safePhone)
  const safeService = escapeHtml(service)
  const safeMessage = escapeHtml(message)
  const fromAddress = resolveFromAddress()

  await transport.sendMail({
    from: fromAddress,
    sender: process.env.SMTP_USER,
    to: inquiryRecipient,
    replyTo: email,
    subject: `New Inquiry: ${service}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${safePhone}`,
      `Service: ${service}`,
      '',
      message
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #10212b;">
        <h2 style="margin-bottom: 16px;">New Inquiry Received</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhoneHtml}</p>
        <p><strong>Service:</strong> ${safeService}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `
  })

  if (acknowledgementEnabled) {
    await transport.sendMail({
      from: fromAddress,
      sender: process.env.SMTP_USER,
      to: email,
      replyTo: inquiryRecipient,
      subject: 'We received your inquiry',
      text: [
        `Hello ${name},`,
        '',
        'Thank you for contacting ArthQ Advisory.',
        `We have received your inquiry about "${service}" and our team will get back to you shortly.`,
        '',
        'Submitted details:',
        `Phone: ${safePhone}`,
        `Service: ${service}`,
        '',
        'Message:',
        message,
        '',
        'Regards,',
        'ArthQ Advisory'
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #10212b;">
          <h2 style="margin-bottom: 16px;">Thank you for contacting ArthQ Advisory</h2>
          <p>Hello ${safeName},</p>
          <p>We have received your inquiry about <strong>${safeService}</strong> and our team will get back to you shortly.</p>
          <p><strong>Phone:</strong> ${safePhoneHtml}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${safeMessage}</p>
          <p style="margin-top: 24px;">Regards,<br />ArthQ Advisory</p>
        </div>
      `
    })
  }

  return {
    sent: true
  }
}
