"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, ArrowLeft, Send, Plus, Users, CornerUpLeft, Search, Paperclip, Mic, Smile, Square, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { cn, initials, formatTime, formatDate } from "@/lib/utils";

const STICKERS = ["😀", "😂", "😍", "🥳", "👍", "🙏", "🔥", "🎉", "😢", "😡", "❤️", "💯"];

type Member = { id: string; fullName: string; avatarColor: string; avatarUrl?: string | null };
type Attachment = { attachmentType: string | null; attachmentUrl: string | null; attachmentName: string | null };
type ConvSummary = {
  id: string;
  isGroup: boolean;
  name: string | null;
  members: Member[];
  lastMessage: ({ body: string; createdAt: string; sender: { fullName: string } } & Attachment) | null;
  unread: number;
};
type ChatMsg = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; fullName: string };
  replyTo: { id: string; body: string; sender: { fullName: string } } | null;
} & Attachment;
type Thread = { id: string; isGroup: boolean; name: string | null; members: Member[]; messages: ChatMsg[] };

function lastMessagePreview(m: ({ body: string } & Attachment) | null) {
  if (!m) return "Belum ada pesan";
  if (m.body) return m.body;
  if (m.attachmentType === "IMAGE") return "📷 Gambar";
  if (m.attachmentType === "AUDIO") return "🎤 Voice note";
  if (m.attachmentType === "STICKER") return "Stiker";
  return "Lampiran";
}

function convTitle(c: { isGroup: boolean; name: string | null; members: Member[] }, myId: string) {
  if (c.isGroup) return c.name || "Grup";
  const other = c.members.find((m) => m.id !== myId);
  return other?.fullName || "Percakapan";
}

function Avatar({ user }: { user: Member }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.fullName} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ background: user.avatarColor }}
    >
      {initials(user.fullName)}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "thread" | "new">("list");
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [myId, setMyId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMsg | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [newIsGroup, setNewIsGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => setMyId(me?.id || ""));
  }, []);

  async function loadConversations() {
    const res = await fetch("/api/chat/conversations");
    if (res.ok) setConversations(await res.json());
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadThread(id: string) {
    const res = await fetch(`/api/chat/conversations/${id}/messages`);
    if (res.ok) {
      setThread(await res.json());
      loadConversations();
    }
  }

  useEffect(() => {
    if (!activeId || view !== "thread") return;
    loadThread(activeId);
    const interval = setInterval(() => loadThread(activeId), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, view]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread?.messages.length]);

  function openConversation(id: string) {
    setActiveId(id);
    setThread(null);
    setReplyTo(null);
    setView("thread");
  }

  async function openNewChat() {
    if (allUsers.length === 0) {
      const res = await fetch("/api/users");
      if (res.ok) setAllUsers(await res.json());
    }
    setNewIsGroup(false);
    setNewGroupName("");
    setNewMemberIds([]);
    setUserQuery("");
    setView("new");
  }

  async function submitNewChat() {
    if (newMemberIds.length === 0) return;
    if (newIsGroup && !newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: newMemberIds, isGroup: newIsGroup, name: newGroupName }),
      });
      if (res.ok) {
        const d = await res.json();
        await loadConversations();
        openConversation(d.id);
      }
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText("");
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, replyToId: replyTo?.id }),
      });
      if (res.ok) {
        setReplyTo(null);
        loadThread(activeId);
      }
    } finally {
      setSending(false);
    }
  }

  async function sendAttachment(attachmentType: string, attachmentUrl: string, attachmentName?: string | null, bodyText = "") {
    if (!activeId) return;
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: bodyText, attachmentType, attachmentUrl, attachmentName, replyToId: replyTo?.id }),
      });
      if (res.ok) {
        setReplyTo(null);
        loadThread(activeId);
      }
    } catch {
      // diamkan; pengguna bisa coba lagi
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeId) return;
    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) await sendAttachment("IMAGE", data.url, data.name);
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function sendSticker(emoji: string) {
    setStickerOpen(false);
    if (!activeId) return;
    await sendAttachment("STICKER", "", null, emoji);
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size === 0 || !activeId) return;
        setUploadingAttachment(true);
        try {
          const fd = new FormData();
          fd.append("file", new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" }));
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok) await sendAttachment("AUDIO", data.url, data.name);
        } finally {
          setUploadingAttachment(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      // izin mikrofon ditolak / tidak tersedia; diamkan
    }
  }

  const unreadTotal = conversations.reduce((a, c) => a + c.unread, 0);
  const filteredUsers = allUsers.filter((u) => u.id !== myId && u.fullName.toLowerCase().includes(userQuery.toLowerCase()));
  const isGroupChat = thread?.isGroup ?? false;
  const threadMessages = thread?.messages ?? [];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <GlassCard
          strong
          className="flex h-[520px] w-[340px] flex-col overflow-hidden rounded-4xl shadow-glass ring-1 ring-white/10 [background:linear-gradient(135deg,rgba(20,22,32,0.97),rgba(10,12,20,0.96))] sm:w-[380px]"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            {view !== "list" && (
              <button
                onClick={() => {
                  setView("list");
                  setActiveId(null);
                }}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <p className="flex-1 truncate text-sm font-semibold text-white">
              {view === "list" && "Chat Tim"}
              {view === "new" && "Percakapan Baru"}
              {view === "thread" && thread && convTitle(thread, myId)}
              {view === "thread" && !thread && "Memuat..."}
            </p>
            {view === "list" && (
              <button onClick={openNewChat} className="text-white/60 hover:text-white">
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* LIST VIEW */}
          {view === "list" && (
            <div className="flex-1 overflow-y-auto glass-scroll">
              {conversations.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-white/40">
                  Belum ada percakapan. Klik + untuk mulai chat.
                </p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/5"
                >
                  {c.isGroup ? (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                      <Users className="h-4 w-4" />
                    </div>
                  ) : (
                    <Avatar user={c.members.find((m) => m.id !== myId) || c.members[0]} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-white">{convTitle(c, myId)}</span>
                      {c.lastMessage && (
                        <span className="shrink-0 text-[10px] text-white/30">{formatTime(c.lastMessage.createdAt)}</span>
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-white/40">
                        {lastMessagePreview(c.lastMessage)}
                      </span>
                      {c.unread > 0 && (
                        <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-accent-pink px-1 text-[9px] font-bold text-white">
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* NEW CHAT VIEW */}
          {view === "new" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="space-y-3 border-b border-white/10 p-3">
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={newIsGroup}
                    onChange={(e) => setNewIsGroup(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-accent"
                  />
                  Buat grup
                </label>
                {newIsGroup && (
                  <GlassInput
                    placeholder="Nama grup"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                )}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <GlassInput
                    className="pl-9 py-2 text-xs"
                    placeholder="Cari karyawan..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto glass-scroll">
                {filteredUsers.map((u) => {
                  const checked = newMemberIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() =>
                        setNewMemberIds((ids) => {
                          if (!newIsGroup) return checked ? [] : [u.id];
                          return checked ? ids.filter((x) => x !== u.id) : [...ids, u.id];
                        })
                      }
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5",
                        checked && "bg-accent/10"
                      )}
                    >
                      <Avatar user={u} />
                      <span className="flex-1 truncate text-xs text-white">{u.fullName}</span>
                      {checked && <span className="h-2 w-2 rounded-full bg-accent" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-white/10 p-3">
                <button
                  onClick={submitNewChat}
                  disabled={creating || newMemberIds.length === 0 || (newIsGroup && !newGroupName.trim())}
                  className="w-full rounded-2xl bg-gradient-to-b from-accent to-[#0066CC] py-2.5 text-xs font-medium text-white shadow-glow disabled:opacity-40"
                >
                  {creating ? "Memulai..." : "Mulai Chat"}
                </button>
              </div>
            </div>
          )}

          {/* THREAD VIEW */}
          {view === "thread" && (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto glass-scroll px-3 py-3">
                {thread && threadMessages.length === 0 && (
                  <p className="py-8 text-center text-xs text-white/30">Belum ada pesan. Mulai percakapan!</p>
                )}
                {threadMessages.map((m) => {
                  const mine = m.sender.id === myId;
                  return (
                    <div key={m.id} className={cn("group flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[78%]", mine ? "items-end" : "items-start", "flex flex-col")}>
                        {isGroupChat && !mine && (
                          <span className="mb-0.5 px-1 text-[10px] text-white/40">{m.sender.fullName}</span>
                        )}
                        <div className="flex items-center gap-1">
                          {mine && (
                            <button
                              onClick={() => setReplyTo(m)}
                              className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-white"
                            >
                              <CornerUpLeft className="h-3 w-3" />
                            </button>
                          )}
                          {m.attachmentType === "STICKER" ? (
                            <div className="text-4xl leading-none">{m.body}</div>
                          ) : (
                            <div
                              className={cn(
                                "rounded-2xl text-xs",
                                m.attachmentType === "IMAGE" ? "overflow-hidden p-1" : "px-3 py-2",
                                mine ? "bg-gradient-to-b from-accent to-[#0066CC] text-white" : "glass-pill text-white/90"
                              )}
                            >
                              {m.replyTo && (
                                <div className="mb-1 rounded-lg border-l-2 border-white/40 bg-black/10 px-2 py-1 text-[10px] opacity-80">
                                  <span className="block font-medium">{m.replyTo.sender.fullName}</span>
                                  <span className="line-clamp-1">{m.replyTo.body}</span>
                                </div>
                              )}
                              {m.attachmentType === "IMAGE" && m.attachmentUrl && (
                                <img src={m.attachmentUrl} alt="Lampiran" className="max-h-56 w-full rounded-xl object-cover" />
                              )}
                              {m.attachmentType === "AUDIO" && m.attachmentUrl && (
                                <audio controls src={m.attachmentUrl} className="h-9 max-w-[220px]" />
                              )}
                              {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                            </div>
                          )}
                          {!mine && (
                            <button
                              onClick={() => setReplyTo(m)}
                              className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-white"
                            >
                              <CornerUpLeft className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className="mt-0.5 px-1 text-[10px] text-white/30">{formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="relative border-t border-white/10 p-3">
                {replyTo && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl glass-pill px-3 py-1.5 text-[11px] text-white/60">
                    <CornerUpLeft className="h-3 w-3 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      Membalas <span className="font-medium">{replyTo.sender.fullName}</span>: {replyTo.body}
                    </span>
                    <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-white/40 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {stickerOpen && (
                  <div className="absolute bottom-full left-3 mb-2 grid grid-cols-6 gap-1 rounded-2xl glass-strong p-2 shadow-glass ring-1 ring-white/10">
                    {STICKERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendSticker(s)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-xl hover:bg-white/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                {uploadingAttachment ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-white/50">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah lampiran...
                  </div>
                ) : recording ? (
                  <div className="flex items-center gap-2">
                    <span className="flex flex-1 items-center gap-2 rounded-2xl glass-pill px-4 py-2.5 text-xs text-accent-pink">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-accent-pink" /> Merekam voice note...
                    </span>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-pink text-white shadow-glow"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                      title="Kirim gambar"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStickerOpen((v) => !v)}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10",
                        stickerOpen ? "text-accent" : "text-white/50 hover:text-white"
                      )}
                      title="Kirim stiker"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    <GlassInput
                      className="py-2.5 text-xs"
                      placeholder="Tulis pesan..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onFocus={() => setStickerOpen(false)}
                    />
                    {text.trim() ? (
                      <button
                        type="submit"
                        disabled={sending}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-accent to-[#0066CC] text-white shadow-glow disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-accent to-[#0066CC] text-white shadow-glow"
                        title="Rekam voice note"
                      >
                        <Mic className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </form>
            </>
          )}
        </GlassCard>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-accent to-[#0066CC] text-white shadow-glow transition hover:brightness-110"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-pink text-[10px] font-bold text-white">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>
    </div>
  );
}
