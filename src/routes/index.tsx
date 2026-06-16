import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syntroxi Task Tracker" },
      { name: "description", content: "Daily task tracker for Pratyush, Vipul & Shraddha — To Revive SYNTROXI." },
      { property: "og:title", content: "Syntroxi Task Tracker" },
      { property: "og:description", content: "Daily task tracker for Pratyush, Vipul & Shraddha." },
    ],
  }),
  component: Index,
});

type Member = "Pratyush" | "Vipul" | "Shraddha";
const MEMBERS: Member[] = ["Pratyush", "Vipul", "Shraddha"];

type Entry = {
  id: string | number;
  date: string;
  member: Member;
  hours: string;
  work: string;
  pending: string;
};

type Sheet1GetResponse = {
  sheet1S: Entry[];
};

type Sheet1CreateResponse = {
  sheet1: Entry;
};

const SHEETY_API_URL = "https://api.sheety.co/74238cce7a5193d8bc00a1e1997c9d46/informationSpreadsheet/sheet1";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center animate-in fade-in duration-700">
      <div className="text-xs tracking-[0.4em] text-primary mb-6 uppercase">— To Revive SYNTROXI —</div>
      <img src="/syntroxi-logo.jpeg" alt="SYNTROXI" className="w-72 md:w-96 rounded-2xl shadow-[0_0_80px_rgba(80,140,255,0.35)]" />
      <p className="mt-8 max-w-xl text-base md:text-lg text-foreground/90 italic">
        "Do OR Die this time — Initiative to save the dream we all have seen and to see it successfully completed."
      </p>
      <div className="text-xs tracking-[0.4em] text-primary mt-6 uppercase">— To Revive SYNTROXI —</div>
      <button
        onClick={onDone}
        className="mt-10 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
      >
        Enter Dashboard
      </button>
    </div>
  );
}

function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState(todayStr());
  const [drafts, setDrafts] = useState<Record<Member, { hours: string; work: string; pending: string }>>({
    Pratyush: { hours: "", work: "", pending: "" },
    Vipul: { hours: "", work: "", pending: "" },
    Shraddha: { hours: "", work: "", pending: "" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ id: string; member: Member } | null>(null);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const response = await fetch(SHEETY_API_URL);
        if (!response.ok) throw new Error(`Failed to load entries (${response.status})`);
        const data = (await response.json()) as Sheet1GetResponse;
        setEntries(data.sheet1S ?? []);
      } catch (error) {
        console.error(error);
        setError("Could not load entries. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchEntries();
  }, []);

  const submit = async (m: Member) => {
    const d = drafts[m];
    if (d.hours === "" && d.work === "" && d.pending === "") return;

    const payload = {
      sheet1: {
        date,
        member: m,
        hours: d.hours,
        work: d.work,
        pending: d.pending,
      },
    };

    try {
      if (editingEntry?.member === m) {
        const rowId = String(editingEntry.id);
        const response = await fetch(`${SHEETY_API_URL}/${rowId}`, {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Failed to update entry (${response.status})`);
        const data = (await response.json()) as Sheet1CreateResponse;
        setEntries((prev) => prev.map((entry) => (entry.id === editingEntry.id ? data.sheet1 : entry)));
        setEditingEntry(null);
      } else {
        const response = await fetch(SHEETY_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Failed to save entry (${response.status})`);
        const data = (await response.json()) as Sheet1CreateResponse;
        setEntries((prev) => [data.sheet1, ...prev]);
      }

      setDrafts((prev) => ({ ...prev, [m]: { hours: "", work: "", pending: "" } }));
      setDate(todayStr());
    } catch (error) {
      console.error(error);
      setError("Could not save entry. Please try again.");
    }
  };

  const removeEntry = async (id: string) => {
    try {
      const response = await fetch(`${SHEETY_API_URL}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete entry (${response.status})`);
      setEntries((p) => p.filter((e) => e.id !== id));
      if (editingEntry?.id === id) setEditingEntry(null);
    } catch (error) {
      console.error(error);
      setError("Could not delete entry. Please try again.");
    }
  };

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src="/syntroxi-logo.jpeg" alt="Syntroxi" className="h-10 w-10 rounded object-cover" />
            <div>
              <h1 className="text-lg font-semibold tracking-wide">SYNTROXI · Daily Tracker</h1>
              <p className="text-xs text-muted-foreground tracking-[0.25em] uppercase">To Revive Syntroxi</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {MEMBERS.map((m) => {
            const memberEntries = entries.filter((e) => e.member === m);
            const d = drafts[m];
            return (
              <section key={m} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/20 to-transparent">
                  <h2 className="text-xl font-bold tracking-wide">{m}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{memberEntries.length} entries</p>
                </div>

                <div className="p-5 space-y-3 border-b border-border">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours Worked</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 6"
                      value={d.hours}
                      onChange={(e) => setDrafts((p) => ({ ...p, [m]: { ...p[m], hours: e.target.value } }))}
                      className="mt-1 w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Productive Work Completed</label>
                    <textarea
                      rows={3}
                      placeholder="What did you work on / complete?"
                      value={d.work}
                      onChange={(e) => setDrafts((p) => ({ ...p, [m]: { ...p[m], work: e.target.value } }))}
                      className="mt-1 w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">% Work Pending</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0 - 100"
                      value={d.pending}
                      onChange={(e) => setDrafts((p) => ({ ...p, [m]: { ...p[m], pending: e.target.value } }))}
                      className="mt-1 w-full bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                              <button
                    onClick={() => void submit(m)}
                    className="w-full mt-2 bg-primary text-primary-foreground rounded py-2 text-sm font-medium hover:opacity-90 transition"
                  >
                    {editingEntry?.member === m ? "Update Entry" : "Save Entry"}
                  </button>
                  {editingEntry?.member === m && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(null);
                        setDrafts((prev) => ({ ...prev, [m]: { hours: "", work: "", pending: "" } }));
                        setDate(todayStr());
                      }}
                      className="w-full mt-2 border border-border rounded py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Loading entries...</p>
                  ) : memberEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No entries yet.</p>
                  ) : (
                    memberEntries.map((e) => {
                      const pct = Number(e.pending) || 0;
                      return (
                        <div key={e.id} className="rounded-lg border border-border bg-background/50 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{e.date}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setEditingEntry({ id: e.id, member: m });
                                  setDate(e.date);
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [m]: { hours: e.hours, work: e.work, pending: e.pending },
                                  }));
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                Edit
                              </button>
                              <button onClick={() => void removeEntry(String(e.id))} className="text-xs text-destructive hover:underline">
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center mb-2">
                            <div className="rounded bg-secondary px-2 py-1.5">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hours</div>
                              <div className="text-sm font-semibold">{e.hours || "—"}</div>
                            </div>
                            <div className="rounded bg-secondary px-2 py-1.5">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</div>
                              <div className="text-sm font-semibold">{e.pending ? `${e.pending}%` : "—"}</div>
                            </div>
                            <div className="rounded bg-secondary px-2 py-1.5">
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Done</div>
                              <div className="text-sm font-semibold">{e.pending !== "" ? `${Math.max(0, 100 - pct)}%` : "—"}</div>
                            </div>
                          </div>
                          {e.work && <p className="text-sm text-foreground/90 whitespace-pre-wrap">{e.work}</p>}
                          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, 100 - pct)}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground tracking-[0.3em] uppercase">
        — To Revive Syntroxi —
      </footer>
    </div>
  );
}
