import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { crmService, type CallLog } from "@/services/crm.service";
import { Phone, Clock, FileText } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import { useUiStore } from "@/store/ui.store";

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number | null;
  leadName: string | null;
}

export function LeadDetailsModal({
  isOpen,
  onClose,
  leadId,
  leadName,
}: LeadDetailsModalProps) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useUiStore();

  useEffect(() => {
    if (isOpen && leadId) {
      void fetchLogs(leadId);
    } else {
      setLogs([]);
    }
  }, [isOpen, leadId]);

  const fetchLogs = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      const data = await crmService.getLeadCalls(id);
      setLogs(data);
    } catch (_error) {
      console.error("Qo'ng'iroqlar tarixini yuklashda xato:", _error);
      addToast({
        title: "Xatolik",
        description: "Qoʻngʻiroqlar tarixini yuklashda xato yuz berdi",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leadName ? `${leadName} — Tarix` : "Lid Tafsilotlari"}
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <h3 className="font-medium text-foreground border-b pb-2">
          Qo'ng'iroqlar tarixi
        </h3>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
            <Phone className="w-8 h-8 opacity-20 mx-auto mb-2" />
            Tarix mavjud emas
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 border rounded-lg bg-card text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-medium text-xs">
                      {log.callerName.charAt(0)}
                    </div>
                    <span className="font-medium">{log.callerName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(log.callDatetime)}
                  </span>
                </div>

                <div className="bg-muted/50 p-2.5 rounded-md mt-2 flex items-start gap-2 text-muted-foreground break-words">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5 text-foreground/40" />
                  <span>{log.notes || "Izoh yozilmagan..."}</span>
                </div>

                {log.nextCallAt && (
                  <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded">
                    Keyingi aloqa: {formatDate(log.nextCallAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
