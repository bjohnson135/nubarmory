import nodemailer from 'nodemailer'

interface OrderItem {
  productName: string
  quantity: number
  price: number
  customization?: string
}

interface OrderDetails {
  id: string
  customerName: string
  customerEmail: string
  total: number
  items: OrderItem[]
  shippingAddress: any
  createdAt: Date
}

// Create transporter - using Gmail SMTP as an example
// In production, you'd want to use a service like SendGrid, AWS SES, or Mailgun
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export async function sendOrderConfirmationEmail(orderDetails: OrderDetails) {
  try {
    const emailHtml = generateOrderConfirmationHTML(orderDetails)

    const mailOptions = {
      from: `"NubArmory" <${process.env.EMAIL_USER}>`,
      to: orderDetails.customerEmail,
      subject: `Order Confirmation #${orderDetails.id.slice(-8)}`,
      html: emailHtml,
      text: generateOrderConfirmationText(orderDetails)
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Order confirmation email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    return { success: false, error: error }
  }
}

function generateOrderConfirmationHTML(order: OrderDetails): string {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.productName}</strong>
        ${item.customization ? `<br><small style="color: #666;">Customization: ${
          typeof item.customization === 'string'
            ? item.customization
            : typeof item.customization === 'object'
              ? Object.entries(item.customization)
                  .filter(([key, value]) => value)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')
              : JSON.stringify(item.customization)
        }</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; padding: 20px 0; border-bottom: 3px solid #EAB308;">
      <h1 style="margin: 0; color: #1F2937; font-size: 28px;">⚔️ NubArmory</h1>
      <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">Veteran-Owned Cigar Accessories</p>
    </div>

    <!-- Success Message -->
    <div style="background: #F0F9F0; border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
      <h2 style="margin: 0 0 10px 0; color: #065F46; font-size: 24px;">✅ Order Confirmed!</h2>
      <p style="margin: 0; color: #047857; font-size: 16px;">Thank you for your order, ${order.customerName}!</p>
    </div>

    <!-- Order Details -->
    <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #1F2937; font-size: 18px;">Order Details</h3>
      <p style="margin: 5px 0; color: #6B7280;"><strong>Order Number:</strong> #${order.id.slice(-8)}</p>
      <p style="margin: 5px 0; color: #6B7280;"><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      <p style="margin: 5px 0; color: #6B7280;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
    </div>

    <!-- Items Ordered -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #1F2937; font-size: 18px;">Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #F3F4F6;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Shipping Address -->
    <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #1F2937; font-size: 18px;">Shipping Address</h3>
      <div style="color: #6B7280;">
        <p style="margin: 3px 0;">${order.customerName}</p>
        <p style="margin: 3px 0;">${order.shippingAddress.line1}</p>
        ${order.shippingAddress.line2 ? `<p style="margin: 3px 0;">${order.shippingAddress.line2}</p>` : ''}
        <p style="margin: 3px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
        <p style="margin: 3px 0;">${order.shippingAddress.country}</p>
      </div>
    </div>

    <!-- What's Next -->
    <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #92400E; font-size: 18px;">📦 What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #A16207;">
        <li>We'll begin crafting your custom sword hilt(s) immediately</li>
        <li>Typical production time is 2-3 business days</li>
        <li>You'll receive tracking information once your order ships</li>
        <li>Feel free to contact us with any questions</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 10px 0;"><strong>NubArmory</strong> - Premium Cigar Accessories</p>
      <p style="margin: 0 0 5px 0;">Veteran-Owned | Hand-Crafted | Made in USA</p>
      <p style="margin: 0;">Questions? Reply to this email or visit our website</p>
    </div>
  </div>
</body>
</html>
  `
}

function generateOrderConfirmationText(order: OrderDetails): string {
  const itemsText = order.items.map(item =>
    `- ${item.productName} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}${item.customization ? ` - Customization: ${
      typeof item.customization === 'string'
        ? item.customization
        : typeof item.customization === 'object'
          ? Object.entries(item.customization)
              .filter(([key, value]) => value)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          : JSON.stringify(item.customization)
    }` : ''}`
  ).join('\n')

  return `
NUBARMORY - ORDER CONFIRMATION

Thank you for your order, ${order.customerName}!

ORDER DETAILS:
Order Number: #${order.id.slice(-8)}
Order Date: ${order.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}
Total: $${order.total.toFixed(2)}

ITEMS ORDERED:
${itemsText}

SHIPPING ADDRESS:
${order.customerName}
${order.shippingAddress.line1}
${order.shippingAddress.line2 ? order.shippingAddress.line2 + '\n' : ''}${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
${order.shippingAddress.country}

WHAT'S NEXT:
- We'll begin crafting your custom sword hilt(s) immediately
- Typical production time is 2-3 business days
- You'll receive tracking information once your order ships
- Feel free to contact us with any questions

Thank you for choosing NubArmory!
Veteran-Owned | Hand-Crafted | Made in USA
  `
}