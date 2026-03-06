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
import { userService } from "@/services/user.service";
import { useUiStore } from "@/store/ui.store";
import { Loader2 } from "lucide-react";
import type { AuthUser } from "@/store/auth.store";

interface EditStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: AuthUser | null;
}

const ROLES = [
    { id: 1, name: "admin", label: "Admin" },
    { id: 2, name: "manager", label: "Manager" },
    { id: 3, name: "teacher", label: "O'qituvchi" },
    { id: 4, name: "student", label: "O'quvchi / Ota-ona" },
];

export function EditStaffModal({
    isOpen,
    onClose,
    onSuccess,
    user,
}: EditStaffModalProps) {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        password: "", // User can reset
        roleId: 2,
    });

    const { addToast } = useUiStore();

    useEffect(() => {
        if (user && isOpen) {
            setForm({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                password: "", // Blank initially
                roleId: user.roleId,
            });
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // Only send password if it's filled
            const updateData: any = {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                roleId: form.roleId,
            };

            if (form.password.trim() !== "") {
                updateData.password = form.password;
            }

            await userService.update(user.id, updateData);

            addToast({
                title: "Muvaffaqiyatli",
                description: "Xodim ma'lumotlari yangilandi",
                type: "success",
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Ma'lumotlarni yangilashda xato yuz berdi";
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
                        <DialogTitle>Xodimni Tahrirlash</DialogTitle>
                        <DialogDescription>
                            Foydalanuvchi ma'lumotlarini tahrirlash yoki yangi parol belgilash
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-firstName">Ism</Label>
                                <Input
                                    id="edit-firstName"
                                    required
                                    value={form.firstName}
                                    onChange={(e) =>
                                        setForm({ ...form, firstName: e.target.value })
                                    }
                                    placeholder="Ali"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-lastName">Familiya</Label>
                                <Input
                                    id="edit-lastName"
                                    required
                                    value={form.lastName}
                                    onChange={(e) =>
                                        setForm({ ...form, lastName: e.target.value })
                                    }
                                    placeholder="Valiyev"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Telefon raqami</Label>
                            <Input
                                id="edit-phone"
                                required
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="+998901234567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Rol (Huquq)</Label>
                            <select
                                id="edit-role"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
                                value={form.roleId}
                                onChange={(e) =>
                                    setForm({ ...form, roleId: Number(e.target.value) })
                                }
                            >
                                {ROLES.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 pt-2 border-t mt-2">
                            <Label htmlFor="edit-password" className="text-brand-600 font-semibold">Yangi parol (ixtiyoriy)</Label>
                            <Input
                                id="edit-password"
                                type="text"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Parolni o'zgartirish uchun kiriting..."
                            />
                            <p className="text-xs text-muted-foreground">Agar parolni o'zgartirishni xohlamasangiz, bo'sh qoldiring.</p>
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
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saqlanmoqda...
                                </>
                            ) : (
                                "O'zgarishlarni saqlash"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
