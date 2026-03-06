import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Filter,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { uz } from "date-fns/locale";
import { academicService } from "@/services/academic.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Lesson {
  id: number;
  groupName: string;
  courseName: string;
  teacherName: string;
  roomName: string | null;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 5),
  });

  useEffect(() => {
    void fetchInitialData();
  }, []);

  useEffect(() => {
    void fetchLessons();
  }, [currentDate, selectedRoom]);

  const fetchInitialData = async () => {
    try {
      const roomData = await academicService.getRooms();
      setRooms(roomData);
    } catch (_error) {
      // Handled globally
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const response: any = await academicService.getSchedule({
        from: format(startDate, "yyyy-MM-dd"),
        to: format(endDate, "yyyy-MM-dd"),
        roomId: selectedRoom || undefined,
      });
      const data = Array.isArray(response) ? response : response?.data || [];
      setLessons(data);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dars Jadvali</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guruhlar va xonalar bandligi (Visual Matrix)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevWeek}
              className="h-9 w-9 border-r"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 text-sm font-medium min-w-[180px] text-center">
              {format(startDate, "d-MMM", { locale: uz })} -{" "}
              {format(addDays(startDate, 5), "d-MMM, yyyy", { locale: uz })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextWeek}
              className="h-9 w-9 border-l"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <select
            className="p-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-brand-500"
            value={selectedRoom || ""}
            onChange={(e) =>
              setSelectedRoom(e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Barcha xonalar</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {weekDays.map((day) => {
          const dayLessons = lessons
            .filter((l) => isSameDay(new Date(l.lessonDate), day))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="flex flex-col gap-3 h-full">
              <div
                className={cn(
                  "py-3 px-4 rounded-xl border text-center transition-all",
                  isToday
                    ? "bg-brand-600 border-brand-700 shadow-md scale-[1.02]"
                    : "bg-card border-border",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-widest mb-0.5",
                    isToday ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {format(day, "EEEE", { locale: uz })}
                </p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    isToday ? "text-white" : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>

              <div className="flex-1 space-y-3 min-h-[400px]">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-24 bg-muted rounded-xl border border-dashed"
                      />
                    ))}
                  </div>
                ) : dayLessons.length === 0 ? (
                  <div className="h-full border border-dashed rounded-xl flex items-center justify-center p-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Darslar yo'q
                    </p>
                  </div>
                ) : (
                  dayLessons.map((lesson) => (
                    <Card
                      key={lesson.id}
                      className="group hover:shadow-lg transition-all border-l-4 border-l-brand-500 hover:border-l-brand-600"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase">
                            {lesson.startTime.substring(0, 5)}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {lesson.endTime.substring(0, 5)}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground leading-tight group-hover:text-brand-600 transition-colors">
                            {lesson.groupName}
                          </h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {lesson.courseName}
                          </p>
                        </div>

                        <div className="pt-2 border-t space-y-1.5">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">
                              {lesson.teacherName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{lesson.roomName || "Xona yo'q"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 p-4 bg-muted/30 border border-dashed rounded-xl text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          Barcha guruhlar
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <Filter className="w-3 h-3" />
          Xonalar bo'yicha filtr
        </div>
      </div>
    </div>
  );
}
