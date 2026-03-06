import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  User,
  Users,
  BookOpen,
  UserCheck,
  Phone,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/services/api"; // using the standard configured axios instance

interface SearchResult {
  type: "student" | "lead" | "teacher" | "group" | "course";
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    api
      .get("/search", { params: { q: debouncedQuery.trim() } })
      .then((res) => {
        if (isMounted && res.data?.success) {
          setResults(res.data.data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, open]);

  if (!open) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "student":
        return <User className="w-5 h-5 text-blue-500" />;
      case "lead":
        return <Phone className="w-5 h-5 text-orange-500" />;
      case "teacher":
        return <UserCheck className="w-5 h-5 text-emerald-500" />;
      case "group":
        return <Users className="w-5 h-5 text-purple-500" />;
      case "course":
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      default:
        return <Search className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-slide-up mx-4">
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-foreground text-lg placeholder:text-muted-foreground"
            placeholder="Nima qidiryapsiz? (Talaba, lid, guruh...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin ml-2" />
          )}
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length > 0 && query.length < 2 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Kamida 2 ta belgi kiriting...
            </p>
          )}
          {debouncedQuery.length >= 2 && !loading && results.length === 0 && (
            <p className="px-4 py-10 text-center text-muted-foreground">
              Xech narsa topilmadi. Boshqa so'z bilan urinib ko'ring.
            </p>
          )}
          {results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(res.url)}
                  className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <div className="p-2 bg-background rounded-full border border-border mr-4">
                    {getIcon(res.type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-semibold text-foreground text-sm truncate">
                      {res.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {res.subtitle}
                    </p>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 bg-secondary rounded border border-border">
                    {res.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="bg-secondary/50 px-4 py-2 text-xs flex items-center justify-between text-muted-foreground border-t border-border">
          <span>Barcha ma'lumotlar bo'ylab qidirish</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            Yopish uchun{" "}
            <kbd className="font-sans px-1.5 py-0.5 bg-background border border-border rounded text-[10px] shadow-sm">
              ESC
            </kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
