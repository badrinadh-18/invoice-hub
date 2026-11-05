import PDFDocument from 'pdfkit';

/**
 * Generate a clean, professional A4 PDF for an invoice
 * @param {Object} invoice - The invoice document populated with snapshots
 * @returns {Promise<Buffer>} - Resolves with the PDF Buffer
 */
export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const seller = invoice.sellerSnapshot || {};
      const customer = invoice.customerSnapshot || {};
      const currency = invoice.currency || 'USD';

      const formatCurrency = (val) => {
        return `${currency} ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };

      // Header Bar / Brand
      doc.rect(40, 40, 515, 60).fill('#0F766E'); // Teal primary accent
      doc.fillColor('#FFFFFF');
      doc.fontSize(22).font('Helvetica-Bold').text('INVOICEHUB', 55, 52);
      doc.fontSize(10).font('Helvetica').text('Multi-User Bill Management System', 55, 78);

      // Invoice status badge top right
      const statusText = (invoice.paymentStatus || invoice.lifecycleState || '').toUpperCase();
      doc.fontSize(12).font('Helvetica-Bold').text(statusText, 420, 62, { width: 120, align: 'right' });

      // Spacing
      let y = 120;

      // Invoice Info (Right side) & Seller Info (Left side)
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(14).text(seller.businessName || 'Business Name', 40, y);
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      y += 18;
      if (seller.address) { doc.text(seller.address, 40, y); y += 13; }
      if (seller.city || seller.state || seller.postalCode) {
        doc.text(`${seller.city || ''} ${seller.state || ''} ${seller.postalCode || ''}`.trim(), 40, y);
        y += 13;
      }
      if (seller.email) { doc.text(`Email: ${seller.email}`, 40, y); y += 13; }
      if (seller.phone) { doc.text(`Phone: ${seller.phone}`, 40, y); y += 13; }
      if (seller.taxId) { doc.text(`Tax ID: ${seller.taxId}`, 40, y); y += 13; }

      // Invoice details block on the right
      const infoX = 350;
      let infoY = 120;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(12).text('INVOICE DETAILS', infoX, infoY);
      infoY += 18;
      doc.font('Helvetica').fontSize(9).fillColor('#475569');

      doc.text(`Invoice Number:`, infoX, infoY);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${invoice.invoiceNumber}`, infoX + 90, infoY);
      infoY += 14;

      doc.font('Helvetica').fillColor('#475569').text(`Issue Date:`, infoX, infoY);
      doc.text(formatDate(invoice.issueDate), infoX + 90, infoY);
      infoY += 14;

      doc.text(`Due Date:`, infoX, infoY);
      doc.text(formatDate(invoice.dueDate), infoX + 90, infoY);
      infoY += 14;

      doc.text(`Currency:`, infoX, infoY);
      doc.text(currency, infoX + 90, infoY);
      infoY += 14;

      // Bill To (Customer)
      y = Math.max(y, infoY) + 15;
      doc.rect(40, y, 515, 1).fill('#E2E8F0');
      y += 15;

      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text('BILL TO:', 40, y);
      y += 16;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text(customer.name || 'Customer Name', 40, y);
      y += 15;
      doc.font('Helvetica').fontSize(9).fillColor('#475569');
      if (customer.billingAddress) { doc.text(customer.billingAddress, 40, y); y += 13; }
      if (customer.city || customer.state || customer.postalCode) {
        doc.text(`${customer.city || ''} ${customer.state || ''} ${customer.postalCode || ''}`.trim(), 40, y);
        y += 13;
      }
      if (customer.email) { doc.text(`Email: ${customer.email}`, 40, y); y += 13; }
      if (customer.phone) { doc.text(`Phone: ${customer.phone}`, 40, y); y += 13; }
      if (customer.taxId) { doc.text(`Tax ID: ${customer.taxId}`, 40, y); y += 13; }

      y += 15;

      // Table Header
      doc.rect(40, y, 515, 24).fill('#F1F5F9');
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(9);
      doc.text('DESCRIPTION', 50, y + 7, { width: 230 });
      doc.text('QTY', 285, y + 7, { width: 50, align: 'right' });
      doc.text('UNIT PRICE', 345, y + 7, { width: 85, align: 'right' });
      doc.text('AMOUNT', 440, y + 7, { width: 105, align: 'right' });

      y += 26;

      // Line Items
      doc.font('Helvetica').fontSize(9);
      const items = invoice.items || [];

      items.forEach((item, index) => {
        // Page break safety
        if (y > 700) {
          doc.addPage();
          y = 40;
        }

        const bg = index % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
        doc.rect(40, y, 515, 20).fill(bg);
        doc.fillColor('#0F172A');

        doc.text(item.description || 'Item', 50, y + 5, { width: 230 });
        doc.text(String(item.quantity || 0), 285, y + 5, { width: 50, align: 'right' });
        doc.text(formatCurrency(item.unitPrice), 345, y + 5, { width: 85, align: 'right' });
        doc.text(formatCurrency(item.lineSubtotal), 440, y + 5, { width: 105, align: 'right' });

        y += 22;
      });

      doc.rect(40, y, 515, 1).fill('#E2E8F0');
      y += 15;

      // Summary Totals
      const totalsX = 330;
      const valuesX = 440;
      const totalWidth = 105;

      const addSummaryRow = (label, value, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.fillColor(bold ? '#0F172A' : '#475569').text(label, totalsX, y, { width: 100, align: 'right' });
        doc.fillColor('#0F172A').text(value, valuesX, y, { width: totalWidth, align: 'right' });
        y += 16;
      };

      addSummaryRow('Subtotal:', formatCurrency(invoice.subtotal));

      if (invoice.discountAmount > 0) {
        addSummaryRow(`Discount (${invoice.discountType === 'percentage' ? invoice.discountValue + '%' : 'Fixed'}):`, `-${formatCurrency(invoice.discountAmount)}`);
      }

      if (invoice.taxTotal > 0) {
        addSummaryRow('Tax Total:', formatCurrency(invoice.taxTotal));
      }

      if (invoice.additionalCharges > 0) {
        addSummaryRow('Other Charges:', formatCurrency(invoice.additionalCharges));
      }

      doc.rect(totalsX, y, 225, 1).fill('#0F766E');
      y += 6;

      addSummaryRow('Grand Total:', formatCurrency(invoice.grandTotal), true);
      addSummaryRow('Amount Paid:', formatCurrency(invoice.amountPaid));

      // Balance Due highlight box
      y += 4;
      doc.rect(totalsX, y, 225, 26).fill('#CCFBF1');
      doc.fillColor('#0F766E').font('Helvetica-Bold').fontSize(11);
      doc.text('Balance Due:', totalsX + 10, y + 7);
      doc.text(formatCurrency(invoice.balanceDue), valuesX, y + 7, { width: totalWidth, align: 'right' });
      y += 36;

      // Notes & Terms
      if (invoice.notes || invoice.terms) {
        if (y > 680) {
          doc.addPage();
          y = 40;
        }
        doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text('Notes & Instructions:', 40, y);
        y += 14;
        doc.font('Helvetica').fontSize(8).fillColor('#64748B');
        if (invoice.notes) {
          doc.text(invoice.notes, 40, y, { width: 515 });
          y += 20;
        }
        if (invoice.terms) {
          doc.font('Helvetica-Bold').text('Terms & Conditions:', 40, y);
          y += 12;
          doc.font('Helvetica').text(invoice.terms, 40, y, { width: 515 });
        }
      }

      // Footer
      doc.fontSize(8).fillColor('#94A3B8').text(
        'Generated via InvoiceHub — Secure Multi-User Billing Platform',
        40,
        790,
        { width: 515, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
