// WhatsApp notifier stub — will be connected later
export function generateStatusMessage(reference: string, status: string, _estimatedHours: number): string {
  const messages: Record<string, string> = {
    pending: `طلبك ${reference} في انتظار الطباعة ⏳`,
    printing: `جارٍ تنفيذ طلبك ${reference} 🖨️`,
    ready: `طلبك ${reference} جاهز للاستلام ✅`,
    delivered: `تم تسليم طلبك ${reference} 📦`,
    cancelled: `تم إلغاء طلبك ${reference} ❌`,
  };
  return messages[status] || `تحديث طلب ${reference}: ${status}`;
}

export async function sendWhatsAppNotification(_phone: string, _message: string): Promise<boolean> {
  // TODO: connect real WhatsApp API
  return false;
}
