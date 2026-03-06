import { useState } from "react";
import {
    Search,
    BookOpen,
    Coffee,
    Shirt,
    ShoppingCart,
    Gem,
    SlidersHorizontal,
    CheckCircle2
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";

type Tab = "sotuvda" | "sotib_olganlarim";

interface Product {
    id: number;
    name: string;
    price: number;
    category: "Kiyimlar" | "Aksessuarlar" | "Kitoblar";
    image: string;
    icon: React.ReactNode;
}

export default function StudentShop() {
    const user = useAuthStore((s) => s.user);
    const { addToast } = useUiStore();
    const [activeTab, setActiveTab] = useState<Tab>("sotuvda");

    // Filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Barchasi");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [affordableOnly, setAffordableOnly] = useState(false);

    // User Balance
    const currentDiamonds = 636; // Mock

    // Mock Products according to user's request (including books)
    const products: Product[] = [
        {
            id: 1,
            name: "Ziyo Chashmasi ruchkasi",
            price: 800,
            category: "Aksessuarlar",
            image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=600&auto=format&fit=crop",
            icon: <Coffee className="w-5 h-5" />
        },
        {
            id: 2,
            name: "Ziyo Chashmasi termosi",
            price: 2200,
            category: "Aksessuarlar",
            image: "https://images.unsplash.com/photo-1596755403067-17eb48074d20?q=80&w=600&auto=format&fit=crop",
            icon: <Coffee className="w-5 h-5" />
        },
        {
            id: 3,
            name: "Ziyo Chashmasi futbolkasi",
            price: 4400,
            category: "Kiyimlar",
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop",
            icon: <Shirt className="w-5 h-5" />
        },
        {
            id: 4,
            name: "Clean Code - Robert C. Martin",
            price: 5500,
            category: "Kitoblar",
            image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600&auto=format&fit=crop",
            icon: <BookOpen className="w-5 h-5" />
        },
        {
            id: 5,
            name: "JavaScript The Good Parts",
            price: 3200,
            category: "Kitoblar",
            image: "https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=600&auto=format&fit=crop",
            icon: <BookOpen className="w-5 h-5" />
        }
    ];

    const filteredProducts = products.filter(p => {
        if (category !== "Barchasi" && p.category !== category) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (priceMin && p.price < parseInt(priceMin)) return false;
        if (priceMax && p.price > parseInt(priceMax)) return false;
        if (affordableOnly && p.price > currentDiamonds) return false;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full overflow-y-auto">

            {/* Header and Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            Ziyo Do'koni
                        </h1>
                    </div>

                    <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab("sotuvda")}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative
                  ${activeTab === "sotuvda" ? "text-brand-600 dark:text-brand-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}
                `}
                        >
                            Sotuvda
                            {activeTab === "sotuvda" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("sotib_olganlarim")}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative
                  ${activeTab === "sotib_olganlarim" ? "text-brand-600 dark:text-brand-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}
                `}
                        >
                            Sotib olganlarim
                            {activeTab === "sotib_olganlarim" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-cyan-100 dark:border-cyan-900/50 shadow-sm">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Balans:</span>
                    <div className="flex items-center gap-1.5 font-black text-xl text-slate-900 dark:text-white">
                        {currentDiamonds} <Gem className="w-5 h-5 text-cyan-500" />
                    </div>
                </div>
            </div>

            {activeTab === "sotuvda" ? (
                <div className="space-y-6">
                    {/* Filters Bar */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-wrap gap-4 items-end">

                        {/* Category */}
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Kategoriya</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="Barchasi">Barchasi</option>
                                <option value="Kitoblar">Kitoblar</option>
                                <option value="Kiyimlar">Kiyimlar</option>
                                <option value="Aksessuarlar">Aksessuarlar</option>
                            </select>
                        </div>

                        {/* Price Range */}
                        <div className="flex-1 min-w-[250px] space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tovarning qiymati</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="dan"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                />
                                <span className="text-slate-400 font-medium text-sm">gacha</span>
                                <input
                                    type="number"
                                    placeholder="gacha"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex-2 min-w-[250px] space-y-1.5 flex-grow">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tovar nomi</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Qidirish..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Affordable Toggle */}
                        <div className="shrink-0 flex items-center h-11 gap-3 px-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kumushlarim yetadi</span>
                            <button
                                onClick={() => setAffordableOnly(!affordableOnly)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${affordableOnly ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm flex items-center justify-center ${affordableOnly ? 'translate-x-5' : 'translate-x-0'}`}>
                                    {affordableOnly && <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />}
                                </div>
                            </button>
                        </div>

                        {/* Reset Button */}
                        <button className="h-11 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors shrink-0">
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>

                    </div>

                    {/* Grid of Products */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => {
                            const isAffordable = currentDiamonds >= product.price;

                            return (
                                <div key={product.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-900/50">

                                    {/* Product Image Box */}
                                    <div className="aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-slate-800/50 mb-5 relative overflow-hidden flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                                        {/* Category Badge overlay */}
                                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-sm">
                                            {product.icon} {product.category}
                                        </div>
                                    </div>

                                    {/* Product Details */}
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 line-clamp-2 min-h-[56px] leading-tight">
                                        {product.name}
                                    </h3>

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-xl font-black text-slate-900 dark:text-white">
                                            {product.price}
                                            <Gem className="w-5 h-5 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                                        </div>

                                        {isAffordable ? (
                                            <button
                                                onClick={() => {
                                                    addToast({
                                                        title: "Muvaffaqiyatli",
                                                        description: `${product.name} xarid qilindi! U tez orada sizga topshiriladi.`,
                                                        type: "success"
                                                    });
                                                }}
                                                className="bg-gradient-to-r from-brand-600 to-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all"
                                            >
                                                Xarid qilish
                                            </button>
                                        ) : (
                                            <button disabled className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-sm px-5 py-2.5 rounded-xl cursor-not-allowed">
                                                Mablag' yetarli emas
                                            </button>
                                        )}
                                    </div>

                                </div>
                            )
                        })}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Hech qanday tovar topilmadi</h3>
                            <p className="text-slate-500 mt-2">Qidiruv yoki filtrlarni o'zgartirib ko'ring.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart className="w-10 h-10 text-brand-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Xaridlar tarixi bo'sh</h2>
                    <p className="text-slate-500 max-w-md mx-auto">Siz hali do'kondan hech narsa xarid qilmadingiz. Kerakli tovarlarni "Sotuvda" bo'limidan harid qilishingiz mumkin.</p>
                </div>
            )}

        </div>
    );
}
