import { formatCurrency, formatDate } from './formatters';

/**
 * Generates a pre-filled WhatsApp share URL for an invoice
 * including business name, customer name, balance due, and due date.
 */
export const generateWhatsAppShareUrl = (invoice) => {
  if (!invoice) return '';
  const seller = invoice.sellerSnapshot || {};
  const customer = invoice.customerSnapshot || {};
  const businessName = seller.businessName || 'Our Business';
  const customerName = customer.name || 'Valued Customer';
  const invNumber = invoice.invoiceNumber || 'INV';
  const amount = formatCurrency(invoice.balanceDue ?? invoice.grandTotal, invoice.currency || 'INR');
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate) : 'On Receipt';
  const status = (invoice.paymentStatus || 'unpaid').toUpperCase();

  const message = [
    `📄 *INVOICE FROM ${businessName.toUpperCase()}*`,
    `--------------------------------`,
    `*Invoice #:* ${invNumber}`,
    `*Customer:* ${customerName}`,
    `*Total / Balance Due:* ${amount}`,
    `*Due Date:* ${dueDate}`,
    `*Status:* ${status}`,
    `--------------------------------`,
    `Thank you for your business!`
  ].join('\n');

  // Clean phone number (strip spaces/dashes; prepend 91 for 10-digit Indian numbers if no country code)
  let phone = (customer.phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) {
    phone = '91' + phone;
  }

  const encodedText = encodeURIComponent(message);
  return phone
    ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
};

/**
 * Opens WhatsApp directly in app or browser with the formatted invoice message.
 */
export const shareViaWhatsApp = (invoice) => {
  const url = generateWhatsAppShareUrl(invoice);
  if (!url) return;
  window.open(url, '_blank');
};
