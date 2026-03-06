import { useState, useEffect } from "react";
import { Save, Send, ShieldCheck, Info, Loader2, Bot, CreditCard } from "lucide-react";
import { settingsService } from "@/services/settings.service";
import { useUiStore } from "@/store/ui.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { addToast } = useUiStore();

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();

      const form: Record<string, string> = {};
      data.forEach((s) => {
        form[s.key] = s.value;
      });
      setFormData(form);
    } catch {
      addToast({
        title: "Xatolik",
        description: "Sozlamalarni yuklashda xato yuz berdi",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(formData);
      addToast({
        title: "Muvaffaqiyatli",
        description: "Tizim sozlamalari saqlandi",
        type: "success",
      });
      fetchSettings();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Xatolik yuz berdi";
      addToast({ title: "Xatolik", description: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-500" />
        <p className="mt-4 text-gray-500 font-medium">
          Sozlamalar yuklanmoqda...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Tizim Sozlamalari
          </h1>
          <p className="text-gray-500 mt-1 italic">
            ERP tizimining global konfiguratsiyalari
          </p>
        </div>
        <div className="p-3 bg-brand-50 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-brand-600" />
        </div>
      </div>

      <div className="grid gap-6">
        {/* Telegram Integration Card */}
        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Telegram Integratsiyasi
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Lidlar va to'lovlar haqida bot orqali xabarnoma yuborish
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid gap-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="telegram_bot_token"
                    className="text-sm font-semibold uppercase tracking-wider text-gray-700"
                  >
                    Bot API Token
                  </Label>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                    rel="noreferrer"
                  >
                    <Bot className="w-3 h-3" /> @BotFather orqali olish
                  </a>
                </div>
                <Input
                  id="telegram_bot_token"
                  type="password"
                  placeholder="Masalan: 1234567890:ABCdefGHIjkl..."
                  className="font-mono text-sm border-gray-200 focus:ring-blue-500"
                  value={formData["telegram_bot_token"] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telegram_bot_token: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="telegram_chat_id"
                  className="text-sm font-semibold uppercase tracking-wider text-gray-700"
                >
                  Guruh Chat ID (Yoki Admin ID)
                </Label>
                <Input
                  id="telegram_chat_id"
                  placeholder="Masalan: -100123456789 (Yoki @idbot orqali oling)"
                  className="font-mono text-sm border-gray-200 focus:ring-blue-500"
                  value={formData["telegram_chat_id"] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telegram_chat_id: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 leading-relaxed">
                <p className="font-semibold mb-1">Qanday sozlash kerak?</p>
                <ol className="list-decimal ml-4 space-y-1 opacity-90">
                  <li>
                    BotFather orqali yangi bot yarating va tokenni kiriting.
                  </li>
                  <li>
                    Botni xabarnoma kelishi kerak bo'lgan guruhga qo'shing.
                  </li>
                  <li>
                    Guruhning <b>Chat ID</b> raqamini kiriting (manfiy son bilan
                    boshlanadi).
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Configuration Card */}
        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">To'lov Tizimlari (Payment Gateways)</CardTitle>
                <CardDescription className="text-emerald-100">
                  O'quvchilar onlayn to'lov qilishlari uchun Payme va Click sozlamalari
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid gap-5">
              <div className="space-y-4 border p-4 rounded-xl relative overflow-hidden group hover:border-emerald-200 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl"></div>
                <h4 className="font-bold text-gray-800 flex items-center gap-2">Payme Integratsiyasi</h4>
                <div className="space-y-2">
                  <Label htmlFor="payme_merchant_id" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payme Merchant ID</Label>
                  <Input
                    id="payme_merchant_id"
                    placeholder="Masalan: 5f4e..."
                    className="font-mono text-sm border-gray-200 focus:ring-emerald-500"
                    value={formData["payme_merchant_id"] || ""}
                    onChange={(e) => setFormData({ ...formData, payme_merchant_id: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-xl relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                <h4 className="font-bold text-gray-800 flex items-center gap-2">Click Integratsiyasi</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="click_service_id" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Click Service ID</Label>
                    <Input
                      id="click_service_id"
                      placeholder="Masalan: 21..."
                      className="font-mono text-sm border-gray-200 focus:ring-blue-500"
                      value={formData["click_service_id"] || ""}
                      onChange={(e) => setFormData({ ...formData, click_service_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="click_merchant_user_id" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Merchant User ID</Label>
                    <Input
                      id="click_merchant_user_id"
                      placeholder="Masalan: 32..."
                      className="font-mono text-sm border-gray-200 focus:ring-blue-500"
                      value={formData["click_merchant_user_id"] || ""}
                      onChange={(e) => setFormData({ ...formData, click_merchant_user_id: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-3 mt-4">
              <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 leading-relaxed">
                Maxfiy kalitlar (Secret Keys) xavfsizlik nuqtai-nazaridan faqat env fayli yoki server sozlamalarida kiritiladi. Bu yerga faqat ochiq identifikatorlar kiritiladi.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <div className="flex justify-end pt-4 pb-12">
          <Button
            size="lg"
            className="bg-brand-600 hover:bg-brand-700 px-10 gap-2 h-12 shadow-md hover:shadow-lg transition-all"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            O'zgarishlarni saqlash
          </Button>
        </div>
      </div>
    </div>
  );
}
