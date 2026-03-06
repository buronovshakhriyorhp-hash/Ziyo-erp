import { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Edit2,
} from "lucide-react";
import { userService } from "@/services/user.service";
import type { AuthUser } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddStaffModal } from "./AddStaffModal";
import { EditStaffModal } from "./EditStaffModal";

const ROLES = [
  { id: 1, name: "admin", label: "Admin" },
  { id: 2, name: "manager", label: "Manager" },
  { id: 3, name: "teacher", label: "O'qituvchi" },
];

export default function UserManagement() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  const { addToast } = useUiStore();

  useEffect(() => {
    void fetchData();
  }, [search, roleId, page]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await userService.list({
        search,
        roleId,
        page,
        limit: 10,
      });
      setUsers(result.data);
      setTotal(result.pagination.total);
    } catch {
      addToast({
        title: "Xatolik",
        description: "Foydalanuvchilarni yuklashda xato yuz berdi",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: AuthUser) => {
    try {
      if (user.isActive) {
        await userService.deactivate(user.id);
        addToast({
          title: "Muvaffaqiyatli",
          description: "Foydalanuvchi bloklandi",
          type: "success",
        });
      } else {
        await userService.activate(user.id);
        addToast({
          title: "Muvaffaqiyatli",
          description: "Foydalanuvchi faollashtirildi",
          type: "success",
        });
      }
      void fetchData();
    } catch {
      addToast({
        title: "Xatolik",
        description: "Holatni o'zgartirishda xato yuz berdi",
        type: "error",
      });
    }
  };

  const stats = useMemo(
    () => ({
      total: total,
      active: users.filter((u) => u.isActive).length,
      blocked: users.filter((u) => !u.isActive).length,
    }),
    [users, total],
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xodimlarni boshqarish
          </h1>
          <p className="text-gray-500">
            Tizim foydalanuvchilari va ularning rollarini boshqarish
          </p>
        </div>
        <Button
          className="gap-2 bg-brand-600 hover:bg-brand-700"
          onClick={() => setIsAddModalOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Xodim qo'shish
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Jami xodimlar
                </p>
                <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Faol xodimlar
                </p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                  {stats.active}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Bloklanganlar
                </p>
                <h3 className="text-2xl font-bold mt-1 text-rose-600">
                  {stats.blocked}
                </h3>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white min-w-[150px]"
            value={roleId || ""}
            onChange={(e) => {
              setRoleId(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
          >
            <option value="">Barcha rollar</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Xodim
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Rol
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Aloqa
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Holat
                </th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase text-right">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Xodimlar topilmadi
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Shield className="w-3.5 h-3.5 text-brand-500" />
                        <span className="capitalize">{user.roleName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          {user.phone}
                        </div>
                        {user.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {user.isActive ? (
                        <Badge
                          className="bg-emerald-50 text-emerald-700 border-emerald-100"
                          variant="outline"
                        >
                          Faol
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-rose-50 text-rose-700 border-rose-100"
                          variant="outline"
                        >
                          Bloklangan
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${user.isActive ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />

      <EditStaffModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchData}
        user={selectedUser}
      />
    </div>
  );
}
