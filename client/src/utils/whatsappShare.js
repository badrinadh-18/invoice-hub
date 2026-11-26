import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from './formatters';

/**
 * Formats a clean invoice summary message for WhatsApp
 */
export const generateWhatsAppShareMessage = (invoice) => {
  if (!invoice) return '';
  const seller = invoice.sellerSnapshot || {};
  const customer = invoice.customerSnapshot || {};
  const businessName = seller.businessName || 'Our Business';
  const isPurchase = invoice.invoiceType === 'purchase';
  const docType = isPurchase ? 'PURCHASE BILL' : 'INVOICE';
  const partyLabel = isPurchase ? 'Company / Vendor' : 'Customer';
  const recipientName = customer.name || (isPurchase ? 'Company Name' : 'Valued Customer');
  const invNumber = invoice.invoiceNumber || (isPurchase ? 'PUR' : 'INV');
  const amount = formatCurrency(invoice.balanceDue ?? invoice.grandTotal, invoice.currency || 'INR');
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate) : 'On Receipt';
  const status = (invoice.paymentStatus || 'unpaid').toUpperCase();

  return [
    `📄 *${docType} FROM ${businessName.toUpperCase()}*`,
    `--------------------------------`,
    `*${isPurchase ? 'Bill #' : 'Invoice #'}:* ${invNumber}`,
    `*${partyLabel}:* ${recipientName}`,
    `*Total / Balance Due:* ${amount}`,
    `*Due Date:* ${dueDate}`,
    `*Status:* ${status}`,
    `--------------------------------`,
    isPurchase ? `Purchase bill registered in InvoiceHub.` : `Thank you for your business!`
  ].join('\n');
};

/**
 * Generates a pre-filled WhatsApp share URL for an invoice
 */
export const generateWhatsAppShareUrl = (invoice) => {
  if (!invoice) return '';
  const customer = invoice.customerSnapshot || {};
  const message = generateWhatsAppShareMessage(invoice);

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
 * Shares the actual Invoice PDF directly to WhatsApp:
 * 1. Android App: Uses native FileProvider + ACTION_SEND to directly attach PDF inside WhatsApp
 * 2. Mobile Browser: Uses Web Share API (navigator.share) with PDF file binary
 * 3. Desktop Browser: Downloads PDF file and opens WhatsApp Web
 */
export const shareViaWhatsApp = async (invoice) => {
  if (!invoice) return;

  const invoiceId = invoice._id;
  const customer = invoice.customerSnapshot || {};
  let phone = (customer.phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) {
    phone = '91' + phone;
  }
  const messageText = generateWhatsAppShareMessage(invoice);
  const rawCustomerName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const invNumber = invoice.invoiceNumber || 'INV';
  const fileName = `${rawCustomerName}-${invNumber}.pdf`;

  // If no ID or draft without backend record, fallback to text link immediately
  if (!invoiceId) {
    const fallbackUrl = generateWhatsAppShareUrl(invoice);
    window.open(fallbackUrl, '_blank');
    return;
  }

  const toastId = toast.loading('Preparing invoice PDF for WhatsApp...');

  try {
    // 1. Fetch PDF binary from backend
    const res = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' }
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });

    // 2. Android Native Bridge (Capacitor / Android App)
    if (window.AndroidDownloader && typeof window.AndroidDownloader.sharePdfViaWhatsApp === 'function') {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const resultStr = reader.result || '';
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
          window.AndroidDownloader.sharePdfViaWhatsApp(fileName, base64Data, phone, messageText);
          toast.success('Opening WhatsApp with PDF...', { id: toastId });
        } catch (bridgeErr) {
          console.error('Android share bridge error:', bridgeErr);
          toast.error('Failed to attach PDF. Opening WhatsApp chat...', { id: toastId });
          window.open(generateWhatsAppShareUrl(invoice), '_blank');
        }
      };
      reader.onerror = () => {
        toast.error('Failed to read PDF. Opening WhatsApp chat...', { id: toastId });
        window.open(generateWhatsAppShareUrl(invoice), '_blank');
      };
      reader.readAsDataURL(blob);
      return;
    }

    // 3. Web Share API with File (Mobile Chrome, Safari, etc.)
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      toast.dismiss(toastId);
      try {
        await navigator.share({
          title: `Invoice ${invNumber}`,
          text: messageText,
          files: [file]
        });
        return;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          // User cancelled the share dialog
          return;
        }
        console.warn('Web share failed, falling back:', shareErr);
      }
    }

    // 4. Desktop Web Fallback: download PDF and open WhatsApp Web with pre-filled message
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 2000);

    toast.success('PDF downloaded! Opening WhatsApp to send...', { id: toastId });
    const waUrl = generateWhatsAppShareUrl(invoice);
    window.open(waUrl, '_blank');

  } catch (err) {
    console.warn('Could not retrieve PDF blob, falling back to text WhatsApp share:', err);
    toast.dismiss(toastId);
    const fallbackUrl = generateWhatsAppShareUrl(invoice);
    window.open(fallbackUrl, '_blank');
  }
};
