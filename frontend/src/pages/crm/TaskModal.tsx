import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crmService, type Task } from "@/services/crm.service";
import { useUiStore } from "@/store/ui.store";
import { Loader2 } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
  managers: any[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSuccess,
  task,
  managers,
}: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: 0,
    leadId: 0,
  });
  const { addToast } = useUiStore();

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        assignedTo: task.assignedTo,
        leadId: task.leadId || 0,
      });
    } else {
      setForm({
        title: "",
        description: "",
        dueDate: "",
        assignedTo: 0,
        leadId: 0,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dto = {
        ...form,
        leadId: form.leadId || undefined,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
      };

      if (task) {
        await crmService.updateTask(task.id, dto);
        addToast({
          title: "Muvaffaqiyatli",
          description: "Vazifa yangilandi",
          type: "success",
        });
      } else {
        await crmService.createTask(dto);
        addToast({
          title: "Muvaffaqiyatli",
          description: "Vazifa yaratildi",
          type: "success",
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Vazifani saqlashda xato yuz berdi";
      addToast({ title: "Xatolik", description: message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {task ? "Vazifani tahrirlash" : "Yangi vazifa"}
            </DialogTitle>
            <DialogDescription>
              Vazifa tafsilotlarini kiriting va mas'ul shaxsni belgilang.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Vazifa nomi</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Masalan: Lidga qo'ng'iroq qilish"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 outline-none"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Vazifa haqida batafsil..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Muddati</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Mas'ul</Label>
                <select
                  id="assignedTo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: Number(e.target.value) })
                  }
                >
                  <option value={0}>Menga biriktirilsin</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {task ? "Yangilash" : "Yaratish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
