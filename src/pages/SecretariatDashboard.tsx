import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  LogOut, Loader2, MessageSquare, CheckSquare, Bell, Send,
  Plus, Trash2, FileUp, AlertTriangle, Users
} from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import ScheduleManager from "@/components/ScheduleManager";
import AIAssistant from "@/components/AIAssistant";
import LiveConferenceClock from "@/components/LiveConferenceClock";
import { useMemo } from "react";

type Tab = "chat" | "tasks" | "updates" | "schedule" | "ai";

const SecretariatDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conference, setConference] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("chat");

  // Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  // Updates
  const [updates, setUpdates] = useState<any[]>([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel("sec-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conference_id=eq.${id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth?redirect=secretariat/" + id); return; }

    const [confRes, comRes, roleRes] = await Promise.all([
      supabase.from("conferences").select("*").eq("id", id).single(),
      supabase.from("committees").select("*").eq("conference_id", id),
      supabase.from("user_roles").select("*").eq("conference_id", id).eq("user_id", user.id).eq("role", "secretariat" as any).maybeSingle(),
    ]);

    setConference(confRes.data);
    setCommittees((comRes.data as any) || []);

    if (!roleRes.data) {
      // Auto-join as secretariat
      const { data: newRole } = await supabase.from("user_roles").insert({
        conference_id: id,
        user_id: user.id,
        role: "secretariat" as any,
        display_name: user.email?.split("@")[0] || "Member",
      }).select().single();
      setRole(newRole);
    } else {
      setRole(roleRes.data);
    }

    await Promise.all([loadMessages(), loadTasks(), loadUpdates()]);
    setLoading(false);
  };

  const loadMessages = async () => {
    const { data } = await supabase.from("chat_messages").select("*").eq("conference_id", id!).order("created_at") as any;
    setMessages(data || []);
  };

  const loadTasks = async () => {
    const { data } = await supabase.from("secretariat_tasks").select("*").eq("conference_id", id!).order("created_at") as any;
    setTasks(data || []);
  };

  const loadUpdates = async () => {
    const { data } = await supabase.from("conference_updates").select("*").eq("conference_id", id!).order("created_at", { ascending: false }) as any;
    setUpdates(data || []);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !id) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("chat_messages").insert({
      conference_id: id,
      sender_name: (role as any)?.display_name || user?.email || "Member",
      sender_user_id: user?.id,
      content: chatInput.trim(),
    } as any);
    setChatInput("");
  };

  const addTask = async () => {
    if (!newTask.trim() || !id) return;
    await supabase.from("secretariat_tasks").insert({
      conference_id: id,
      title: newTask.trim(),
      created_by: (role as any)?.display_name || "Member",
    } as any);
    setNewTask("");
    loadTasks();
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from("secretariat_tasks").update({ completed: !completed } as any).eq("id", taskId);
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from("secretariat_tasks").delete().eq("id", taskId);
    loadTasks();
  };

  const pushUpdate = async () => {
    if (!updateBody.trim() || !id) return;
    await supabase.from("conference_updates").insert({
      conference_id: id,
      author_name: (role as any)?.display_name || "Secretariat",
      author_role: "secretariat",
      title: updateTitle.trim() || null,
      body: updateBody.trim(),
    } as any);
    setUpdateTitle("");
    setUpdateBody("");
    loadUpdates();
    toast.success("Update published!");
  };

  const toggleCrisis = async (committeeId: string, current: boolean) => {
    await supabase.from("committees").update({ crisis_enabled: !current } as any).eq("id", committeeId);
    setCommittees((prev) => prev.map((c) => c.id === committeeId ? { ...c, crisis_enabled: !current } : c));
    toast.success(!current ? "Crisis mode enabled" : "Crisis mode disabled");
  };

  const conferenceDays = useMemo(() => {
    if (!conference?.start_date || !conference?.end_date) return [];
    const days: string[] = [];
    const start = new Date(conference.start_date + "T00:00");
    const end = new Date(conference.end_date + "T00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, [conference]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (role && !(role as any).approved) {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <img src={munLogo} alt="MUN AI" className="h-12 mx-auto mb-4" />
          <h2 className="font-display font-bold text-foreground text-lg mb-2">Pending Approval</h2>
          <p className="text-sm text-muted-foreground">Your request to join as secretariat is pending SecGen approval.</p>
          <Button variant="ghost" onClick={handleSignOut} className="mt-4 rounded-xl"><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "chat", label: "Chat", icon: MessageSquare },
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "updates", label: "Updates", icon: Bell },
    { key: "schedule", label: "Schedule", icon: CheckSquare },
    { key: "ai", label: "AI", icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-[#efeeea] flex flex-col">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{conference?.name}</h1>
              <p className="text-xs text-muted-foreground">Secretariat · {(role as any)?.display_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-xl"><LogOut className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Live Clock */}
      <div className="max-w-3xl mx-auto w-full px-4 mt-3">
        {id && <LiveConferenceClock conferenceId={id} />}
      </div>

      {/* Tab bar */}
      <div className="max-w-3xl mx-auto w-full px-4 mt-3">
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 animate-fade-in">
        {tab === "chat" && (
          <div className="glass-card rounded-2xl p-4 flex flex-col" style={{ height: "60vh" }}>
            <h2 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" /> Internal Chat
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {messages.map((m: any) => (
                <div key={m.id} className="bg-secondary/50 rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-accent">{m.sender_name}</span>
                  <p className="text-sm text-foreground">{m.content}</p>
                  {m.file_name && <p className="text-xs text-muted-foreground mt-1">📎 {m.file_name}</p>}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="rounded-xl flex-1"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage} size="icon" className="rounded-xl gradient-primary border-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-accent" /> Task Checklist
            </h2>
            {tasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-2.5">
                <button onClick={() => toggleTask(t.id, t.completed)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${t.completed ? "bg-accent border-accent text-accent-foreground" : "border-muted-foreground"}`}>
                  {t.completed && <span className="text-xs">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</span>
                <span className="text-xs text-muted-foreground">{t.created_by}</span>
                <button onClick={() => deleteTask(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task..." className="rounded-xl flex-1" onKeyDown={(e) => e.key === "Enter" && addTask()} />
              <Button onClick={addTask} className="rounded-xl gradient-primary border-0"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {tab === "updates" && (
          <div className="space-y-4">
            {/* Crisis controls */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-accent" /> Committee Crisis Controls
              </h2>
              {committees.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-2.5 mb-2">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <Button
                    size="sm"
                    variant={c.crisis_enabled ? "destructive" : "outline"}
                    onClick={() => toggleCrisis(c.id, c.crisis_enabled)}
                    className="rounded-lg text-xs"
                  >
                    {c.crisis_enabled ? "Disable Crisis" : "Enable Crisis"}
                  </Button>
                </div>
              ))}
            </div>

            {/* Push update */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" /> Push Update
              </h2>
              <Input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="Title (optional)" className="rounded-xl" />
              <Textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} placeholder="Write your announcement..." className="rounded-xl min-h-[80px]" />
              <Button onClick={pushUpdate} className="w-full rounded-xl gradient-primary border-0 font-semibold">Publish Update</Button>
            </div>

            {/* Updates list */}
            <div className="space-y-2">
              {updates.map((u: any) => (
                <div key={u.id} className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-accent font-medium mb-1">Update from: {u.author_name}</p>
                  {u.title && <h3 className="font-display font-semibold text-foreground text-sm">{u.title}</h3>}
                  <p className="text-sm text-foreground mt-1">{u.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(u.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "schedule" && conferenceDays.length > 0 && (
          <ScheduleManager conferenceId={id!} conferenceDays={conferenceDays} />
        )}

        {tab === "ai" && <AIAssistant />}
      </div>
    </div>
  );
};

export default SecretariatDashboard;
