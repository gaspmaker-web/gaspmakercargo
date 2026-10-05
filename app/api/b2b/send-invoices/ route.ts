import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'
import { jsPDF } from 'jspdf'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateInvoicePDF(account: {
  businessName: string
  businessAddress: string
  contactName: string
  businessPhone: string
  creditUsed: number
  creditLimit: number
  billingCycle: number
  nextBillingDate: Date
  user: { email: string | null; name: string | null }
  deliveries: Array<{
    id: string
    recipientName: string
    deliveryAddress: string
    price: number | null
    createdAt: Date
    status: string
  }>
  invoiceNumber: string
  periodStart: Date
  periodEnd: Date
}): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header - Company brand
  doc.setFillColor(26, 31, 46) // #1a1f2e dark
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('GASPMAKERCARGO', margin, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Servicio de Mensajería y Logística', margin, 28)
  doc.text('www.gaspmakercargo.com', margin, 35)

  // Invoice label
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURA B2B', pageWidth - margin, 20, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(account.invoiceNumber, pageWidth - margin, 28, { align: 'right' })

  const today = new Date()
  doc.text(
    `Fecha: ${today.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageWidth - margin,
    35,
    { align: 'right' }
  )

  // Reset text color
  doc.setTextColor(30, 30, 30)

  // Billing info box
  let y = 58
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 45, 3, 3, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 120)
  doc.text('FACTURAR A:', margin + 5, y + 8)

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(account.businessName, margin + 5, y + 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(account.contactName, margin + 5, y + 23)
  doc.text(account.businessAddress, margin + 5, y + 29)
  doc.text(account.businessPhone, margin + 5, y + 35)
  doc.text(account.user.email || '', margin + 5, y + 41)

  // Period info (right side)
  const rightCol = pageWidth / 2 + 10
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 120)
  doc.setFontSize(9)
  doc.text('PERÍODO DE FACTURACIÓN:', rightCol, y + 8)

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `${account.periodStart.toLocaleDateString('es-DO')} - ${account.periodEnd.toLocaleDateString('es-DO')}`,
    rightCol,
    y + 16
  )

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 120)
  doc.text('PRÓXIMA FACTURACIÓN:', rightCol, y + 25)
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'normal')
  doc.text(
    account.nextBillingDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' }),
    rightCol,
    y + 32
  )

  // Deliveries table
  y += 55
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(26, 31, 46)
  doc.text('DETALLE DE SERVICIOS', margin, y)
  y += 6

  // Table header
  doc.setFillColor(26, 31, 46)
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')

  const col1 = margin + 3
  const col2 = margin + 42
  const col3 = margin + 100
  const col4 = pageWidth - margin - 3

  doc.text('#', col1, y + 5.5)
  doc.text('FECHA', col1 + 6, y + 5.5)
  doc.text('DESTINATARIO / DIRECCIÓN', col2, y + 5.5)
  doc.text('ESTADO', col3, y + 5.5)
  doc.text('MONTO', col4, y + 5.5, { align: 'right' })

  y += 8
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  let rowTotal = 0
  account.deliveries.forEach((delivery, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 251, 253)
      doc.rect(margin, y, pageWidth - margin * 2, 10, 'F')
    }

    const price = Number(delivery.price) || 0
    rowTotal += price

    doc.text(String(index + 1), col1, y + 7)
    doc.text(
      delivery.createdAt.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit' }),
      col1 + 6,
      y + 4
    )

    // Recipient + address (2 lines)
    const recipientText = delivery.recipientName || 'N/A'
    const addressText = delivery.deliveryAddress
      ? delivery.deliveryAddress.substring(0, 45) + (delivery.deliveryAddress.length > 45 ? '...' : '')
      : ''

    doc.setFont('helvetica', 'bold')
    doc.text(recipientText.substring(0, 30), col2, y + 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 120)
    doc.text(addressText, col2, y + 8.5)
    doc.setTextColor(30, 30, 30)

    // Status badge color
    const statusColors: Record<string, [number, number, number]> = {
      ENTREGADO: [34, 197, 94],
      PAGADO: [59, 130, 246],
      EN_REPARTO: [234, 179, 8],
      ACEPTADO: [168, 85, 247]
    }
    const [r, g, b] = statusColors[delivery.status] || [150, 150, 150]
    doc.setTextColor(r, g, b)
    doc.setFont('helvetica', 'bold')
    doc.text(delivery.status, col3, y + 6)

    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${price.toFixed(2)}`, col4, y + 6, { align: 'right' })
    doc.setFont('helvetica', 'normal')

    y += 10

    // New page if needed
    if (y > 260) {
      doc.addPage()
      y = 20
    }
  })

  if (account.deliveries.length === 0) {
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'italic')
    doc.text('No hay entregas registradas en este período.', margin + 5, y + 7)
    y += 14
  }

  // Separator line
  doc.setDrawColor(220, 220, 230)
  doc.line(margin, y + 2, pageWidth - margin, y + 2)
  y += 10

  // Totals section
  const totalsX = pageWidth - margin - 70
  const totalsValueX = pageWidth - margin

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 120)
  doc.text('Subtotal entregas:', totalsX, y)
  doc.setTextColor(30, 30, 30)
  doc.text(`$${rowTotal.toFixed(2)}`, totalsValueX, y, { align: 'right' })

  y += 7
  doc.setTextColor(100, 100, 120)
  doc.text('Crédito disponible:', totalsX, y)
  doc.setTextColor(34, 197, 94)
  doc.text(`$${(Number(account.creditLimit) - Number(account.creditUsed)).toFixed(2)}`, totalsValueX, y, { align: 'right' })

  y += 3
  doc.setDrawColor(26, 31, 46)
  doc.line(totalsX, y, totalsValueX, y)
  y += 5

  // Grand total
  doc.setFillColor(26, 31, 46)
  doc.roundedRect(totalsX - 5, y - 1, totalsValueX - totalsX + 10, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL A PAGAR:', totalsX, y + 7)
  doc.setFontSize(12)
  doc.text(`$${Number(account.creditUsed).toFixed(2)}`, totalsValueX - 2, y + 7, { align: 'right' })

  y += 20

  // Credit usage bar
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('USO DE CRÉDITO', margin, y)
  y += 5

  const barWidth = 100
  const usedWidth = Math.min((Number(account.creditUsed) / Number(account.creditLimit)) * barWidth, barWidth)

  doc.setFillColor(230, 232, 240)
  doc.roundedRect(margin, y, barWidth, 5, 2, 2, 'F')

  const usedPct = Number(account.creditUsed) / Number(account.creditLimit)
  const barColor: [number, number, number] = usedPct > 0.9 ? [239, 68, 68] : usedPct > 0.7 ? [234, 179, 8] : [34, 197, 94]
  doc.setFillColor(...barColor)
  if (usedWidth > 0) {
    doc.roundedRect(margin, y, usedWidth, 5, 2, 2, 'F')
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 120)
  doc.text(
    `$${Number(account.creditUsed).toFixed(2)} de $${Number(account.creditLimit).toFixed(2)} (${(usedPct * 100).toFixed(0)}%)`,
    margin + barWidth + 5,
    y + 4
  )

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20
  doc.setDrawColor(220, 220, 230)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFontSize(7.5)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.text('Para consultas sobre esta factura, contáctenos en soporte@gaspmakercargo.com o WhatsApp +1(829)555-XXXX', pageWidth / 2, footerY, { align: 'center' })
  doc.text('Esta factura fue generada automáticamente por el sistema GaspmakerCargo', pageWidth / 2, footerY + 5, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

export async function POST(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

  if (!authHeader || authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  }

  try {
    // Get all active B2B accounts due for billing
    const accounts = await prisma.b2BAccount.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lte: now }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    for (const account of accounts) {
      try {
        if (!account.user.email) {
          results.skipped++
          results.errors.push(`${account.businessName}: no email`)
          continue
        }

        // Calculate billing period
        const periodEnd = new Date(now)
        const periodStart = new Date(now)
        periodStart.setDate(periodStart.getDate() - account.billingCycle)

        // Get deliveries for this period
        const deliveries = await prisma.pickupRequest.findMany({
          where: {
            userId: account.userId,
            createdAt: { gte: periodStart, lte: periodEnd },
            status: { in: ['PAGADO', 'ENTREGADO', 'ACEPTADO', 'EN_REPARTO'] }
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            recipientName: true,
            deliveryAddress: true,
            price: true,
            createdAt: true,
            status: true
          }
        })

        // Skip if no credit used and no deliveries
        if (Number(account.creditUsed) === 0 && deliveries.length === 0) {
          results.skipped++
          continue
        }

        const invoiceNumber = `GMC-B2B-${account.id.slice(-6).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

        // Calculate next billing date
        const nextBillingDate = new Date(now)
        nextBillingDate.setDate(nextBillingDate.getDate() + account.billingCycle)

        // Generate PDF
        const pdfBuffer = generateInvoicePDF({
          businessName: account.businessName,
          businessAddress: account.businessAddress,
          contactName: account.contactName,
          businessPhone: account.businessPhone,
          creditUsed: Number(account.creditUsed),
          creditLimit: Number(account.creditLimit),
          billingCycle: account.billingCycle,
          nextBillingDate,
          user: account.user,
          deliveries: deliveries.map(d => ({
            ...d,
            price: d.price ? Number(d.price) : 0
          })),
          invoiceNumber,
          periodStart,
          periodEnd
        })

        // Send email with PDF attachment
        await resend.emails.send({
          from: 'GaspmakerCargo Facturación <facturacion@gaspmakercargo.com>',
          to: account.user.email,
          subject: `Factura ${invoiceNumber} - ${account.businessName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f7fa; padding: 20px;">
              <div style="background: #1a1f2e; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">GaspmakerCargo</h1>
                <p style="color: #94a3b8; margin: 8px 0 0;">Estado de Cuenta B2B</p>
              </div>

              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #1a1f2e; margin-top: 0;">Estimado/a ${account.contactName},</h2>

                <p style="color: #475569; line-height: 1.6;">
                  Adjunto encontrará su factura correspondiente al período de facturación
                  <strong>${periodStart.toLocaleDateString('es-DO')} - ${periodEnd.toLocaleDateString('es-DO')}</strong>.
                </p>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #64748b;">Empresa:</span>
                    <strong style="color: #1a1f2e;">${account.businessName}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #64748b;">No. de Factura:</span>
                    <strong style="color: #1a1f2e;">${invoiceNumber}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #64748b;">Entregas realizadas:</span>
                    <strong style="color: #1a1f2e;">${deliveries.length}</strong>
                  </div>
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-size: 16px;">Total a pagar:</span>
                    <strong style="color: #1a1f2e; font-size: 20px;">$${Number(account.creditUsed).toFixed(2)}</strong>
                  </div>
                </div>

                <p style="color: #475569; line-height: 1.6;">
                  Su próxima fecha de facturación será el <strong>${nextBillingDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
                </p>

                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">
                    💡 El PDF adjunto contiene el detalle completo de sus servicios.
                    Para cualquier consulta, responda este correo o escríbanos por WhatsApp.
                  </p>
                </div>

                <p style="color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-bottom: 0;">
                  GaspmakerCargo · soporte@gaspmakercargo.com<br>
                  Este es un mensaje automático del sistema de facturación.
                </p>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `${invoiceNumber}.pdf`,
              content: pdfBuffer
            }
          ]
        })

        // Update account: reset creditUsed, set next billing date
        await prisma.b2BAccount.update({
          where: { id: account.id },
          data: {
            creditUsed: 0,
            nextBillingDate
          }
        })

        results.processed++
      } catch (err) {
        results.failed++
        results.errors.push(
          `${account.businessName}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
        console.error(`[B2B Invoice] Error processing ${account.businessName}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      summary: results,
      timestamp: now.toISOString()
    })
  } catch (err) {
    console.error('[B2B Invoice] Fatal error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}