"use client";
import { useEffect, useState } from "react";
import { Plus, Paperclip, Calendar as CalendarIcon, Upload, Trash2, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput, GlassLabel, GlassSelect, GlassTextarea } from "@/components/ui/GlassInput";
import { GlassModal } from "@/components/ui/GlassModal";
import { Badge } from "@/components/ui/Badge";
import { StatusSelect } from "@/components/ui/StatusSelect";
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";

type Division = { id: string; name: string };
type Member = { id: string; fullName: string; divisionId: string | null; secondDivisionId?: string | null };
type Task = {
  id: string; title: string; description: string; status: string; priority: string;
  deadline: string; fileUrl: string | null; fileName: string | null;
  division: { name: string; color: string }; assignedTo: { fullName: string } | null;
  _count?: { attachments: number };
};
type TaskAttachment = {
  id: string; url: string; name: string; createdAt: string;
  uploadedBy: { id: string; fullName: string };
};
type TaskDetail = Task & {
  createdBy: { fullName: string };
  attachments: TaskAttachment[];
};

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export default function TasksPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", divisionId: "", assignedToId: "", deadline: "", priority: "MEDIUM",
  });

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);

  async function load() {
    const [t, d, m, me] = await Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/divisions").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]);
    setTasks(t);
    setDivisions(d);
    setMembers(m);
    setIsAdmin(me?.role === "SUPERADMIN");
    setMyId(me?.id ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setFile(data);
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fileUrl: file?.url, fileName: file?.name }),
    });
    if (res.ok) {
      toast("Tugas berhasil dikirim & notifikasi terkirim ke tim terkait");
      setModalOpen(false);
      setForm({ title: "", description: "", divisionId: "", assignedToId: "", deadline: "", priority: "MEDIUM" });
      setFile(null);
      load();
    } else {
      const d = await res.json();
      toast(d.error || "Gagal membuat tugas", "error");
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function removeTask(id: string) {
    const ok = await confirmDialog({
      title: "Hapus Tugas",
      message: "Tugas ini akan dihapus permanen dan tidak bisa dikembalikan.",
      confirmLabel: "Hapus",
    });
    if (!ok) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    toast("Tugas dihapus");
    load();
  }

  async function loadDetail(id: string) {
    setDetailLoading(true);
    const res = await fetch(`/api/tasks/${id}`);
    setDetailLoading(false);
    if (res.ok) setDetail(await res.json());
    else {
      toast("Gagal memuat detail tugas", "error");
      setDetailId(null);
    }
  }

  function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    loadDetail(id);
  }

  async function updateDetailStatus(status: string) {
    if (!detailId) return;
    const res = await fetch(`/api/tasks/${detailId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadDetail(detailId);
      load();
    }
  }

  async function uploadAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !detailId) return;
    setAttachUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || "Gagal mengunggah file");

      const res = await fetch(`/api/tasks/${detailId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: upData.url, name: upData.name }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menambah lampiran");
      }
      toast("Lampiran ditambahkan");
      loadDetail(detailId);
      load();
    } catch (err: any) {
      toast(err.message || "Gagal menambah lampiran", "error");
    } finally {
      setAttachUploading(false);
      e.target.value = "";
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!detailId) return;
    const ok = await confirmDialog({
      title: "Hapus Lampiran",
      message: "Lampiran ini akan dihapus permanen.",
      confirmLabel: "Hapus",
    });
    if (!ok) return;
    const res = await fetch(`/api/tasks/${detailId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId }),
    });
    if (res.ok) {
      toast("Lampiran dihapus");
      loadDetail(detailId);
      load();
    } else {
      const d = await res.json();
      toast(d.error || "Gagal menghapus lampiran", "error");
    }
  }

  const filteredMembers = members.filter((m) => m.divisionId === form.divisionId || m.secondDivisionId === form.divisionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tugas</h1>
          <p className="text-sm text-white/50">{isAdmin ? "Kelola & distribusikan tugas ke tiap divisi" : "Tugas untuk divisi Anda"}</p>
        </div>
        {isAdmin && (
          <GlassButton onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Berikan Tugas
          </GlassButton>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map((status) => (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Badge value={status} />
              <span className="text-xs text-white/30">{tasks.filter((t) => t.status === status).length}</span>
            </div>
            <div className="space-y-3">
              {tasks
                .filter((t) => t.status === status)
                .map((t) => {
                  const overdue = new Date(t.deadline) < new Date() && t.status !== "DONE";
                  const attachCount = (t._count?.attachments || 0) + (t.fileUrl ? 1 : 0);
                  return (
                    <GlassCard
                      key={t.id}
                      className="animate-fade-up cursor-pointer p-4 transition hover:ring-1 hover:ring-white/15"
                      onClick={() => openDetail(t.id)}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">{t.title}</p>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTask(t.id);
                            }}
                            className="text-white/30 hover:text-accent-pink"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mb-3 line-clamp-2 text-xs text-white/50">{t.description}</p>
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
                        <span className="rounded-full px-2 py-0.5" style={{ background: `${t.division.color}22`, color: t.division.color }}>
                          {t.division.name}
                        </span>
                        <Badge value={t.priority} />
                        {attachCount > 0 && (
                          <span className="flex items-center gap-1 rounded-full glass-pill px-2 py-0.5">
                            <Paperclip className="h-3 w-3" /> {attachCount}
                          </span>
                        )}
                      </div>
                      {t.assignedTo && <p className="mb-2 text-xs text-white/40">👤 {t.assignedTo.fullName}</p>}
                      <div className={`mb-3 flex items-center gap-1.5 text-xs ${overdue ? "text-accent-pink" : "text-white/40"}`}>
                        <CalendarIcon className="h-3 w-3" /> {formatDate(t.deadline)}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusSelect value={t.status} onChange={(v) => updateStatus(t.id, v)} options={STATUSES} />
                      </div>
                    </GlassCard>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <GlassModal open={modalOpen} onClose={() => setModalOpen(false)} title="Berikan Tugas Baru" maxWidth="max-w-xl">
        <form onSubmit={createTask} className="space-y-4">
          <div>
            <GlassLabel>Judul Tugas</GlassLabel>
            <GlassInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <GlassLabel>Deskripsi</GlassLabel>
            <GlassTextarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <GlassLabel>Divisi Tujuan</GlassLabel>
              <GlassSelect value={form.divisionId} onChange={(e) => setForm((f) => ({ ...f, divisionId: e.target.value, assignedToId: "" }))} required>
                <option value="" className="bg-ink-800">Pilih divisi</option>
                {divisions.map((d) => <option key={d.id} value={d.id} className="bg-ink-800">{d.name}</option>)}
              </GlassSelect>
            </div>
            <div>
              <GlassLabel>Jabatan / Karyawan (opsional)</GlassLabel>
              <GlassSelect value={form.assignedToId} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}>
                <option value="" className="bg-ink-800">Seluruh divisi</option>
                {filteredMembers.map((m) => <option key={m.id} value={m.id} className="bg-ink-800">{m.fullName}</option>)}
              </GlassSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <GlassLabel>Deadline</GlassLabel>
              <GlassInput type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} required />
            </div>
            <div>
              <GlassLabel>Prioritas</GlassLabel>
              <GlassSelect value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option value="LOW" className="bg-ink-800">Rendah</option>
                <option value="MEDIUM" className="bg-ink-800">Sedang</option>
                <option value="HIGH" className="bg-ink-800">Tinggi</option>
                <option value="URGENT" className="bg-ink-800">Mendesak</option>
              </GlassSelect>
            </div>
          </div>
          <div>
            <GlassLabel>Lampiran File (opsional)</GlassLabel>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl glass-pill px-4 py-3 text-sm text-white/60 hover:text-white">
              <Upload className="h-4 w-4" />
              {uploading ? "Mengunggah..." : file ? file.name : "Pilih file"}
              <input type="file" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <GlassButton type="submit" className="w-full" loading={uploading}>Kirim Tugas & Notifikasi</GlassButton>
        </form>
      </GlassModal>

      <GlassModal
        open={!!detailId}
        onClose={() => {
          setDetailId(null);
          setDetail(null);
        }}
        title={detail?.title || "Detail Tugas"}
        maxWidth="max-w-2xl"
      >
        {detailLoading || !detail ? (
          <p className="py-8 text-center text-sm text-white/40">Memuat detail...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
              <span className="rounded-full px-2 py-0.5" style={{ background: `${detail.division.color}22`, color: detail.division.color }}>
                {detail.division.name}
              </span>
              <Badge value={detail.priority} />
              <Badge value={detail.status} />
            </div>

            <p className="whitespace-pre-wrap text-sm text-white/80">{detail.description}</p>

            <div className="grid grid-cols-1 gap-3 text-xs text-white/50 sm:grid-cols-2">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" /> Deadline: {formatDate(detail.deadline)} {formatTime(detail.deadline)}
              </div>
              {detail.assignedTo && <div>👤 Ditugaskan ke: {detail.assignedTo.fullName}</div>}
              <div>Dibuat oleh: {detail.createdBy.fullName}</div>
            </div>

            <div>
              <GlassLabel>Status</GlassLabel>
              <StatusSelect value={detail.status} onChange={updateDetailStatus} options={STATUSES} />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
                Lampiran ({(detail.fileUrl ? 1 : 0) + detail.attachments.length})
              </p>

              <div className="space-y-2">
                {detail.fileUrl && (
                  <a
                    href={detail.fileUrl}
                    target="_blank"
                    className="flex items-center gap-2.5 rounded-2xl glass-pill px-3 py-2.5 text-xs text-white/70 hover:text-white"
                  >
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="min-w-0 flex-1 truncate">{detail.fileName}</span>
                    <span className="shrink-0 text-white/30">dari pemberi tugas</span>
                  </a>
                )}
                {detail.attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-2xl glass-pill px-3 py-2.5 text-xs text-white/70">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <a href={a.url} target="_blank" className="min-w-0 flex-1 truncate hover:text-white hover:underline">
                      {a.name}
                    </a>
                    <span className="shrink-0 text-white/30">
                      {a.uploadedBy.fullName} · {formatDate(a.createdAt)}
                    </span>
                    {(isAdmin || a.uploadedBy.id === myId) && (
                      <button onClick={() => deleteAttachment(a.id)} className="shrink-0 text-white/30 hover:text-accent-pink">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {!detail.fileUrl && detail.attachments.length === 0 && (
                  <p className="text-xs text-white/30">Belum ada lampiran.</p>
                )}
              </div>

              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl glass-pill px-4 py-2.5 text-xs text-white/60 hover:text-white">
                <Upload className="h-3.5 w-3.5" />
                {attachUploading ? "Mengunggah..." : "Tambah Lampiran"}
                <input type="file" className="hidden" onChange={uploadAttachment} disabled={attachUploading} />
              </label>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
