import { useState, useEffect } from "react";
import {
  CheckSquare,
  Search,
  Plus,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { crmService, type Task } from "@/services/crm.service";
import { userService } from "@/services/user.service";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/formatters";
import { TaskModal } from "./TaskModal";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [isCompleted, setIsCompleted] = useState<boolean | undefined>(false);
  const [assignedTo, setAssignedTo] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { addToast } = useUiStore();

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await userService.list({ roleId: 2 }); // Managers
        const ads = await userService.list({ roleId: 1 }); // Admins
        setManagers([...ads.data, ...res.data]);
      } catch (_err) {
        // Ignore error, handled globally
      }
    };
    void loadManagers();
  }, []);

  useEffect(() => {
    void fetchData();
  }, [search, isCompleted, assignedTo, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await crmService.getTasks({
        search,
        isCompleted,
        assignedTo,
        page,
        limit: 15,
      });
      setTasks(res.data);
      setTotal(res.pagination.total);
    } catch {
      addToast({
        title: "Xatolik",
        description: "Vazifalarni yuklashda xato yuz berdi",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await crmService.completeTask(id);
      addToast({
        title: "Muvaffaqiyatli",
        description: "Vazifa bajarildi",
        type: "success",
      });
      fetchData();
    } catch {
      addToast({
        title: "Xatolik",
        description: "Xatolik yuz berdi",
        type: "error",
      });
    }
  };

  const handleReopen = async (id: number) => {
    try {
      await crmService.reopenTask(id);
      addToast({
        title: "Muvaffaqiyatli",
        description: "Vazifa qayta ochildi",
        type: "success",
      });
      fetchData();
    } catch {
      addToast({
        title: "Xatolik",
        description: "Xatolik yuz berdi",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Vazifani o'chirmoqchimisiz?")) return;
    try {
      await crmService.deleteTask(id);
      addToast({
        title: "Muvaffaqiyatli",
        description: "Vazifa o'chirildi",
        type: "success",
      });
      fetchData();
    } catch {
      addToast({
        title: "Xatolik",
        description: "Xatolik yuz berdi",
        type: "error",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vazifalar va Eslatmalar
          </h1>
          <p className="text-gray-500">Menejerlar uchun kunlik ish rejalari</p>
        </div>
        <Button
          className="gap-2 bg-brand-600 hover:bg-brand-700"
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Vazifa qo'shish
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Vazifa nomi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[150px]"
          value={isCompleted === undefined ? "" : String(isCompleted)}
          onChange={(e) =>
            setIsCompleted(
              e.target.value === "" ? undefined : e.target.value === "true",
            )
          }
        >
          <option value="false">Faol vazifalar</option>
          <option value="true">Bajarilganlar</option>
          <option value="">Barchasi</option>
        </select>

        <select
          className="p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[180px]"
          value={assignedTo || ""}
          onChange={(e) =>
            setAssignedTo(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Barcha menejerlar</option>
          {managers.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            Yuklanmoqda...
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-dashed border-2 py-20 bg-gray-50/50">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 bg-white rounded-full shadow-sm">
                <CheckSquare className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Vazifalar topilmadi
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Hozircha hech qanday vazifa yoki eslatma mavjud emas.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          tasks.map((task: Task) => (
            <Card
              key={task.id}
              className={`group hover:shadow-md transition-all border-l-4 ${task.isCompleted ? "border-l-emerald-500 opacity-70" : task.isOverdue ? "border-l-rose-500" : "border-l-brand-500"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() =>
                      task.isCompleted
                        ? handleReopen(task.id)
                        : handleComplete(task.id)
                    }
                    className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-brand-500"}`}
                  >
                    {task.isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-semibold text-gray-900 truncate ${task.isCompleted ? "line-through text-gray-400" : ""}`}
                      >
                        {task.title}
                      </h3>
                      {task.isOverdue && !task.isCompleted && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 py-0 text-[10px] uppercase"
                        >
                          Muddati o'tgan
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p
                        className={`text-sm text-gray-500 line-clamp-2 mb-3 ${task.isCompleted ? "text-gray-400" : ""}`}
                      >
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span
                          className={
                            task.isOverdue && !task.isCompleted
                              ? "text-rose-600 font-medium"
                              : ""
                          }
                        >
                          {task.dueDate
                            ? formatDate(task.dueDate)
                            : "Muddatsiz"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{task.assigneeName}</span>
                      </div>
                      {task.leadName && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                          Lid: {task.leadName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-brand-600"
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-rose-600"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {total > 15 && (
        <div className="flex justify-center gap-2 mt-4 pb-10">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Oldingi
          </Button>
          <div className="flex items-center px-4 text-sm font-medium text-gray-500">
            {page}-sahifa
          </div>
          <Button
            variant="outline"
            disabled={page * 15 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        task={editingTask}
        managers={managers}
      />
    </div>
  );
}
