import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * Downloads invoice PDF with full JWT authentication headers
 * and seamless fallback for mobile WebViews / Capacitor.
 */
export const downloadInvoicePdf = async (invoiceId, invoiceNumber = 'invoice') => {
  const token = localStorage.getItem('invoicehub_token');
  const toastId = toast.loading('Generating invoice PDF...');

  try {
    const res = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf'
      }
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    toast.success('PDF downloaded successfully!', { id: toastId });
  } catch (err) {
    console.warn('Blob PDF download failed, trying direct link fallback:', err);
    if (token) {
      const directUrl = `${api.defaults.baseURL}/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`;
      window.open(directUrl, '_blank');
      toast.dismiss(toastId);
    } else {
      toast.error('Please sign in to download this invoice.', { id: toastId });
    }
  }
};
