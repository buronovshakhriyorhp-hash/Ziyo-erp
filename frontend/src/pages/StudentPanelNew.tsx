// Using automatic JSX runtime (no React import required)
import { Card } from "@/design-system/components/Card";
import { Button } from "@/design-system/components/Button";
import ProgressBar from "@/design-system/components/ProgressBar";
import demoStudent from "@/services/mock/student.mock";

function ScheduleItem({ item }: { item: any }) {
  const start = new Date(item.start).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(item.end).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="bg-emerald-50 rounded-xl p-4 shadow-sm">
      <div className="font-semibold">{item.title}</div>
      <div className="text-sm text-slate-600 mt-1">
        {start} - {end}
      </div>
    </div>
  );
}

export default function StudentPanelNew() {
  const s = demoStudent;
  const xpPct = (s.xp / s.xpToNext) * 100;

  return (
    <div className="min-h-[80vh] p-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="container max-w-6xl mx-auto grid grid-cols-12 gap-6">
        <aside className="col-span-3">
          <div className="sticky top-6 space-y-4">
            <Card className="p-6 text-center">
              <div className="text-sm text-slate-500">Kumushlar</div>
              <div className="text-3xl font-bold mt-2">{s.diamonds} 💎</div>
              <div className="mt-4 text-sm text-slate-600">Reyting: 7606</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-slate-500">Dars jadvali</div>
              <div className="mt-3 space-y-3">
                {s.schedule.map((it: any) => (
                  <ScheduleItem key={it.id} item={it} />
                ))}
              </div>
            </Card>
          </div>
        </aside>

        <main className="col-span-9">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                Assalomu alaykum, {s.name} 👋
              </h1>
              <p className="text-sm text-slate-600">O'quvchi panel</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost">Profil</Button>
              <Button>To'lovlar</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="col-span-2 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">XP</div>
                  <div className="text-2xl font-bold">{s.xp} XP</div>
                </div>
                <div className="w-1/2">
                  <ProgressBar value={xpPct} />
                  <div className="text-xs text-slate-500 mt-2">
                    {s.xp} / {s.xpToNext} XP
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-slate-500">Guruhlarim</div>
              <div className="text-2xl font-bold mt-2">0 ta</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-slate-500">Reyting</div>
              <div className="text-2xl font-bold mt-2">7606</div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-3">Kalendar va darslar</h2>
            <div className="grid grid-cols-2 gap-4">
              {s.schedule.map((it: any) => (
                <ScheduleItem key={it.id} item={it} />
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
