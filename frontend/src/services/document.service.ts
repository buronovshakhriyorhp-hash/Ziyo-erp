import api from "./api";

export const documentService = {
  /** To'lov kvitansiyasini yuklab olish */
  downloadPaymentReceipt: async (paymentId: number) => {
    const response = await api.get(`/documents/payment-receipt/${paymentId}`, {
      responseType: "blob",
    });

    // Faylni saqlash
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kvitansiya_${paymentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  /** Oylik slipini yuklab olish */
  downloadSalarySlip: async (payoutId: number) => {
    const response = await api.get(`/documents/salary-slip/${payoutId}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `oylik_hisoboti_${payoutId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
