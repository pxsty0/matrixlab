import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { UserAPI } from "../services";
import { User, UserRole } from "../types";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-toastify";
import { Modal } from "../components/common/Modal";

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff" as UserRole,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserAPI.getAll();
      setUsers(data);
    } catch (err: unknown) {
      toast.error(
        "Kullanıcı listesi alınamadı: " +
          (err instanceof Error ? err.message : "Hata"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = (u.email || "").toLowerCase().includes(q);
        const matchesUsername = u.username.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesUsername) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, search, roleFilter]);

  const handleOpenEdit = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email || "",
      role: (userToEdit.role as UserRole) || "user",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (userToDelete: User) => {
    setSelectedUser(userToDelete);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await UserAPI.update(selectedUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
      });
      toast.success("Kullanıcı bilgileri güncellendi.");
      setIsEditModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      toast.error(
        "Güncelleme hatası: " + (err instanceof Error ? err.message : ""),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await UserAPI.delete(selectedUser.id);
      toast.success(`${selectedUser.name} kullanıcısı silindi.`);
      setIsDeleteModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      toast.error("Silme hatası: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role?: UserRole | string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Yönetici (Admin)
          </span>
        );
      case "staff":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
            <Shield className="h-3 w-3" />
            Personel (Staff)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            <Clock className="h-3 w-3" />
            Yetkisiz / Onay Bekliyor
          </span>
        );
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900">
          Yetkisiz Erişim
        </h2>
        <p className="mt-1 max-w-sm text-xs text-zinc-500">
          Bu sayfaya yalnızca sistem yöneticileri (Admin) erişebilir. Lütfen
          yöneticinizle iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Kullanıcı & Personel Yönetimi
            </h1>
            <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
              {users.length} Kayıtlı Hesap
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sisteme erişebilecek personelleri yetkilendirin, rollerini yönetin
            ve denetim loglarını inceleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            title="Yenile"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-600 transition hover:bg-zinc-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, e-posta veya kullanıcı adı ile ara..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-3 pl-8 text-xs transition focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-400" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs transition focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            >
              <option value="all">Tüm Roller</option>
              <option value="admin">Yöneticiler (Admin)</option>
              <option value="staff">Personeller (Staff)</option>
              <option value="user">Onay Bekleyenler (Yetkisiz)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-xs text-zinc-500">
            <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
            <span>Kullanıcılar yükleniyor...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
            Kriterlere uygun kayıtlı kullanıcı bulunamadı.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50/80 font-medium text-zinc-500 select-none">
                  <tr>
                    <th className="px-3 py-2.5">Kullanıcı / Personel</th>
                    <th className="px-3 py-2.5">E-posta</th>
                    <th className="px-3 py-2.5">Rol</th>
                    <th className="px-3 py-2.5">Kayıt Tarihi</th>
                    <th className="px-3 py-2.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {filteredUsers.map((u) => {
                    const isMe =
                      currentUser?.id === u.id ||
                      currentUser?.email === u.email;
                    return (
                      <tr key={u.id} className="transition hover:bg-zinc-50/60">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-[11px] font-bold text-zinc-800">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="leading-tight font-semibold text-zinc-900">
                                {u.name}
                                {isMe && (
                                  <span className="py-0.2 ml-1.5 rounded bg-zinc-900 px-1 text-[9px] font-normal text-white">
                                    Sen
                                  </span>
                                )}
                              </p>
                              <span className="font-mono text-[10px] text-zinc-400">
                                @{u.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-zinc-600">
                          <span className="font-mono text-[11px]">
                            {u.email || "—"}
                          </span>
                        </td>

                        <td className="px-3 py-3">{getRoleBadge(u.role)}</td>

                        <td className="px-3 py-3 text-[11px] text-zinc-500">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString("tr-TR")
                            : "—"}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Rol & Bilgi Düzenle"
                              className="cursor-pointer rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {!isMe && (
                              <button
                                onClick={() => handleOpenDelete(u)}
                                title="Kullanıcıyı Sil"
                                className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Personel Yetkilerini Düzenle"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Ad Soyad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              E-posta Adresi <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs transition focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700">
              Sistem Rolü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex cursor-pointer flex-col rounded-lg border p-2.5 text-xs transition ${
                  formData.role === "staff"
                    ? "border-zinc-900 bg-zinc-50 font-medium"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value="staff"
                  checked={formData.role === "staff"}
                  onChange={() => setFormData({ ...formData, role: "staff" })}
                  className="sr-only"
                />
                <span className="font-semibold text-zinc-900">Personel</span>
                <span className="mt-0.5 text-[10px] text-zinc-500">
                  Envanter yönetimi yapabilir.
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-lg border p-2.5 text-xs transition ${
                  formData.role === "admin"
                    ? "border-zinc-900 bg-zinc-50 font-medium"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value="admin"
                  checked={formData.role === "admin"}
                  onChange={() => setFormData({ ...formData, role: "admin" })}
                  className="sr-only"
                />
                <span className="font-semibold text-emerald-700">Yönetici</span>
                <span className="mt-0.5 text-[10px] text-zinc-500">
                  Tam yetkili.
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-lg border p-2.5 text-xs transition ${
                  formData.role === "user"
                    ? "border-zinc-900 bg-zinc-50 font-medium"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value="user"
                  checked={formData.role === "user"}
                  onChange={() => setFormData({ ...formData, role: "user" })}
                  className="sr-only"
                />
                <span className="font-semibold text-amber-700">Yetkisiz</span>
                <span className="mt-0.5 text-[10px] text-zinc-500">
                  Tüm erişimi kapalıdır.
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Kullanıcıyı Sil"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">Bu işlem geri alınamaz!</p>
              <p className="mt-0.5">
                <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
                adlı kullanıcının yetki profili kalıcı olarak silinecek ve
                sisteme erişimi engellenecektir.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Siliniyor..." : "Evet, Kullanıcıyı Sil"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
