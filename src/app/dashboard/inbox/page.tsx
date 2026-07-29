"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Bell, Send, Plus, CornerUpLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Msg = {
  id: string; subject: string; body: string; read: boolean; createdAt: string;
  sender: { id: string; fullName: string }; recipient: { id: string; fullName: string };
};
type Notif = { id: string; title: string; body: string; link: string | null; read: boolean; createdAt: string; status: string };
type Member = { id: string; fullName: string };

export default function InboxPage() {
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<"messages" | "notifications">("messages");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ recipientId: "", subject: "", body: "" });
  const [meId, setMeId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Msg | null>(null);

  async function load() {
    const [m, n, u, me] = await Promise.all([
      fetch("/api/inbox").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]);
    setMessages(m);
    setNotifs(n);
    setMembers(u);
    setMeId(me?.id);
  }
  useEffect(() => { load(); }, []);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Pesan terkirim");
      setComposeOpen(false);
      setForm({ recipientId: "", subject: "", body: "" });
      load();
    } else toast("Gagal mengirim pesan", "error");
  }

  async function openMessage(m: Msg) {
    setSelectedMessage(m);
    if (!m.read && m.recipient.id === meId) {
      await fetch("/api/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id }),
      });
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    }
  }

  function replyToMessage(m: Msg) {
    const other = m.sender.id === meId ? m.recipient : m.sender;
    setSelectedMessage(null);
    setForm({ recipientId: other.id, subject: m.subject.startsWith("Re: ") ? m.subject : `Re: ${m.subject}`, body: "" });
    setComposeOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inbox</h1>
          <p className="text-sm text-white/50">Pesan internal & notifikasi sistem</p>
        </div>
        <GlassButton onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4" /> Tulis Pesan
        </GlassButton>
      </div>

      <div className="glass-pill inline-flex rounded-full p-1">
        <button
          onClick={() => setTab("messages")}
          className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm", tab === "messages" ? "glass-strong text-white" : "text-white/50")}
        >
          <Mail className="h-4 w-4" /> Pesan
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm", tab === "notifications" ? "glass-strong text-white" : "text-white/50")}
        >
          <Bell className="h-4 w-4" /> Notifikasi
        </button>
      </div>

      {tab === "messages" ? (
        <div className="space-y-3">
          {messages.map((m) => (
            <GlassCard
              key={m.id}
              onClick={() => openMessage(m)}
              className={cn(
                "cursor-pointer p-4 transition hover:bg-white/5",
                !m.read && m.recipient.id === meId && "border border-accent/30"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-white">{m.subject}</p>
                <span className="text-xs text-white/30">{formatDate(m.createdAt)} · {formatTime(m.createdAt)}</span>
              </div>
              <p className="mb-2 text-xs text-white/40">
                {m.sender.fullName} → {m.recipient.fullName}
              </p>
              <p className="line-clamp-2 text-sm text-white/60">{m.body}</p>
            </GlassCard>
          ))}
          {messages.length === 0 && <p className="text-sm text-white/30">Belum ada pesan.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <GlassCard
              key={n.id}
              onClick={async () => {
                if (!n.read) {
                  await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: n.id }),
                  });
                  setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                }
                if (n.link) router.push(n.link);
              }}
              className={cn("cursor-pointer p-4 transition hover:bg-white/5", !n.read && "border border-accent/30")}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-white">{n.title}</p>
                <span className="text-xs text-white/30">{formatDate(n.createdAt)} · {formatTime(n.createdAt)}</span>
              </div>
              <p className="whitespace-pre-line text-sm text-white/60">{n.body}</p>
            </GlassCard>
          ))}
          {notifs.length === 0 && <p className="text-sm text-white/30">Belum ada notifikasi.</p>}
        </div>
      )}

      <GlassModal open={composeOpen} onClose={() => setComposeOpen(false)} title="Tulis Pesan Baru">
        <form onSubmit={sendMessage} className="space-y-4">
          <div>
            <GlassLabel>Kepada</GlassLabel>
            <GlassSelect value={form.recipientId} onChange={(e) => setForm((f) => ({ ...f, recipientId: e.target.value }))} required>
              <option value="" className="bg-ink-800">Pilih penerima</option>
              {members.filter((m) => m.id !== meId).map((m) => (
                <option key={m.id} value={m.id} className="bg-ink-800">{m.fullName}</option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassLabel>Subjek</GlassLabel>
            <GlassInput value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
          </div>
          <div>
            <GlassLabel>Pesan</GlassLabel>
            <GlassTextarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required />
          </div>
          <GlassButton type="submit" className="w-full"><Send className="h-4 w-4" /> Kirim</GlassButton>
        </form>
      </GlassModal>

      <GlassModal open={!!selectedMessage} onClose={() => setSelectedMessage(null)} title={selectedMessage?.subject || "Pesan"}>
        {selectedMessage && (
          <div className="space-y-4">
            <p className="text-xs text-white/40">
              {selectedMessage.sender.fullName} → {selectedMessage.recipient.fullName} ·{" "}
              {formatDate(selectedMessage.createdAt)} {formatTime(selectedMessage.createdAt)}
            </p>
            <p className="whitespace-pre-line rounded-2xl glass-pill p-4 text-sm text-white/80">{selectedMessage.body}</p>
            <GlassButton variant="secondary" className="w-full" onClick={() => replyToMessage(selectedMessage)}>
              <CornerUpLeft className="h-4 w-4" /> Balas
            </GlassButton>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
