const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[0-9+\-\s()]{7,20}$/
const disposableDomains = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com'
])

export async function validateInquiryPayload(payload) {
  const errors = {}
  const name = payload.name?.trim() || ''
  const email = payload.email?.trim().toLowerCase() || ''
  const phone = payload.phone?.trim() || ''
  const service = payload.service?.trim() || ''
  const message = payload.message?.trim() || ''

  if (!name) {
    errors.name = 'Name is required.'
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  if (!email) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  } else if (disposableDomains.has(email.split('@')[1])) {
    errors.email = 'Enter a valid email address that can receive mail.'
  }

  if (!phone) {
    errors.phone = 'Phone number is required.'
  } else if (!phonePattern.test(phone)) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!service) {
    errors.service = 'Service is required.'
  }

  if (!message) {
    errors.message = 'Message is required.'
  } else if (message.length < 10) {
    errors.message = 'Message must be at least 10 characters.'
  }

  return {
    errors,
    sanitized: {
      name,
      email,
      phone,
      service,
      message
    }
  }
}
