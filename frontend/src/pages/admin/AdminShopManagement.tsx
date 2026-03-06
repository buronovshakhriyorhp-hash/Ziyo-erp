import { useState } from "react";
import {
    ShoppingBag,
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Image as ImageIcon,
    Gem
} from "lucide-react";
import { useUiStore } from "@/store/ui.store";
import { cn } from "@/lib/utils";

interface ShopItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string;
    description: string;
}

// Boshlang'ich mock data - (Keyinchalik backend ulanadi)
const INITIAL_ITEMS: ShopItem[] = [
    { id: "1", name: "Qalam va Daftar to'plami", price: 50, stock: 100, image: "https://images.unsplash.com/photo-1542856391-010fb8b5cfaa", description: "O'quv qurollari" },
    { id: "2", name: "Ziyo Chashmasi Kepkasi", price: 150, stock: 50, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b", description: "Brendlangan kiyim" },
    { id: "3", name: "Kitob: Atomic Habits", price: 300, stock: 20, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73", description: "Shaxsiy rivojlanish kitobi" },
    { id: "4", name: "Smart Soat", price: 1000, stock: 5, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12", description: "Elektronika" },
];

export default function AdminShopManagement() {
    const { addToast } = useUiStore();
    const [items, setItems] = useState<ShopItem[]>(INITIAL_ITEMS);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        stock: "",
        image: "",
        description: "",
    });

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (item?: ShopItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price.toString(),
                stock: item.stock.toString(),
                image: item.image,
                description: item.description,
            });
        } else {
            setEditingItem(null);
            setFormData({ name: "", price: "", stock: "", image: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.stock) {
            addToast({ title: "Xatolik!", description: "Iltimos barcha maydonlarni to'ldiring!", type: "error" });
            return;
        }

        const newItem: ShopItem = {
            id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
            name: formData.name,
            price: parseInt(formData.price),
            stock: parseInt(formData.stock),
            image: formData.image || "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634", // Default placeholder
            description: formData.description,
        };

        if (editingItem) {
            setItems(items.map(i => i.id === editingItem.id ? newItem : i));
            addToast({ title: "Muvaffaqiyatli", description: "Mahsulot muvaffaqiyatli yangilandi!", type: "success" });
        } else {
            setItems([...items, newItem]);
            addToast({ title: "Muvaffaqiyatli", description: "Yangi mahsulot do'konga qo'shildi!", type: "success" });
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        if (confirm("Haqiqatan ham ushbu mahsulotni do'kondan olib tashlamoqchimisiz?")) {
            setItems(items.filter(i => i.id !== id));
            addToast({ title: "O'chirildi", description: "Mahsulot bo'shatildi!", type: "success" });
        }
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">

            {/* ── HEADER & SEARCH ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-[#0a0f18] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                        <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Virtual Do'kon</h1>
                        <p className="text-slate-500 text-sm font-medium mt-0.5">O'quvchilar xarid qilishi mumkin bo'lgan tovarlar ro'yxati</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Mahsulot izlash..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 w-full md:w-[250px] transition-all"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Qo'shish</span>
                    </button>
                </div>
            </div>

            {/* ── GRID OF ITEMS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="group bg-white dark:bg-[#131b2f]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col">

                        {/* Thumbnail Output */}
                        <div className="relative h-48 w-full bg-slate-100 dark:bg-black/40 overflow-hidden">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />

                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0">
                                <button onClick={() => openModal(item)} className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-blue-500 transition-colors">
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div className="bg-emerald-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-400/50 flex items-center gap-1.5 shadow-lg">
                                    <Gem className="w-4 h-4 text-emerald-100" />
                                    <span className="font-black text-white">{item.price} Kumush</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Layout */}
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-2 line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-4 flex-1">
                                {item.description}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zaxirada:</span>
                                <span className={cn("text-sm font-black px-2 py-0.5 rounded-md", item.stock > 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400")}>
                                    {item.stock} dona
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="py-20 text-center">
                    <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Hech narsa topilmadi</h2>
                    <p className="text-slate-500 mt-2">Bu nomdagi mahsulot do'konda yo'q yoki barcha tovarlar tugagan.</p>
                </div>
            )}

            {/* ── ADD/EDIT MODAL ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />

                    <div className="relative bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden zoom-in-95">

                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {editingItem ? "Mahsulotni Tahrirlash" : "Yangi Mahsulot Qo'shish"}
                                </h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">
                                    Do'kon vitrinasida to'g'ri ko'rinishi uchun formani to'liq to'ldiring
                                </p>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <form id="shop-form" onSubmit={handleSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mahsulot Nomi <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Masalan: Ziyo Chashmasi Kepkasi"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Narxi (Kumush) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                required min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Zaxiradagi Soni <span className="text-rose-500">*</span></label>
                                        <input
                                            type="number"
                                            placeholder="Qancha mavjud?"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            required min="1"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rasm / URL <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ma'lumot / Ta'rifi</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Mahsulot haqida qisqacha ma'lumot qoldiring..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                            </form>
                        </div>

                        <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                form="shop-form"
                                className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                {editingItem ? "O'zgarishlarni Saqlash" : "Do'konga Joylash"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
