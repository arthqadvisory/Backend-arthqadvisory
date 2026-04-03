import nodemailer from 'nodemailer'

const inquiryRecipient = process.env.INQUIRY_NOTIFICATION_EMAIL || 'arthqadvisory@gmail.com'

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

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    sender: process.env.SMTP_USER,
    to: inquiryRecipient,
    replyTo: email,
    subject: service,
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

  return {
    sent: true
  }
}
