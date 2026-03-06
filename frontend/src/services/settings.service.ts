import api from "./api";

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
}

export const settingsService = {
  getSettings: () =>
    api.get<SystemSetting[]>("/settings").then((res) => res.data),

  updateSettings: (settings: Record<string, string>) =>
    api.patch("/settings", { settings }).then((res) => res.data),

  getPaymentConfig: () =>
    api.get<{
      data: {
        payme_merchant_id: string;
        click_service_id: string;
        click_merchant_user_id: string;
      }
    }>("/settings/payment-config").then((res) => res.data.data),
};
