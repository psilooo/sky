import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const { resendApiKey } = useRuntimeConfig()

  if (!resendApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Email service not configured' })
  }

  const body = await readBody(event)
  const { name, email, message } = body || {}

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Message is required' })
  }

  const resend = new Resend(resendApiKey)

  const { error } = await resend.emails.send({
    from: 'SKY Events Asia <onboarding@resend.dev>',
    to: 'skyeventsasia@gmail.com',
    replyTo: email,
    subject: `Contact Form: ${name.trim()}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name.trim()}</p>
      <p><strong>Email:</strong> ${email.trim()}</p>
      <hr />
      <p>${message.trim().replace(/\n/g, '<br />')}</p>
    `,
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to send email' })
  }

  return { success: true }
})
