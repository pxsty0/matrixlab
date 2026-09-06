import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { UserAPI } from '../services';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Modal } from '../components/common/Modal';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as UserRole,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await UserAPI.getAll();
      setUsers(data);
    } catch (err: unknown) {
      toast.error('Kullanıcı listesi alınamadı: ' + (err instanceof Error ? err.message : 'Hata'));
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
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesUsername = u.username.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesUsername) return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      return true;
    });
  }, [users, search, roleFilter]);

  const handleOpenEdit = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email || '',
      role: (userToEdit.role as UserRole) || 'user',
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
      toast.success('Kullanıcı bilgileri güncellendi.');
      setIsEditModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      toast.error('Güncelleme hatası: ' + (err instanceof Error ? err.message : ''));
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
      toast.error('Silme hatası: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role?: UserRole | string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            Yönetici (Admin)
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <Shield className="w-3 h-3" />
            Personel (Staff)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Yetkisiz / Onay Bekliyor
          </span>
        );
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900">Yetkisiz Erişim</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Bu sayfaya yalnızca sistem yöneticileri (Admin) erişebilir. Lütfen yöneticinizle iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
              Kullanıcı & Personel Yönetimi
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
              {users.length} Kayıtlı Hesap
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sisteme erişebilecek personelleri yetkilendirin, rollerini yönetin ve denetim loglarını inceleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            title="Yenile"
            className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsim, e-posta veya kullanıcı adı ile ara..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
              >
                <option value="all">Tüm Roller</option>
                <option value="admin">Yöneticiler (Admin)</option>
                <option value="staff">Personeller (Staff)</option>
                <option value="user">Onay Bekleyenler (Yetkisiz)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-xs text-zinc-500 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-zinc-600" />
              <span>Kullanıcılar yükleniyor...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 text-xs text-zinc-500">
              Kriterlere uygun kayıtlı kullanıcı bulunamadı.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-medium select-none">
                    <tr>
                      <th className="py-2.5 px-3">Kullanıcı / Personel</th>
                      <th className="py-2.5 px-3">E-posta</th>
                      <th className="py-2.5 px-3">Rol</th>
                      <th className="py-2.5 px-3">Kayıt Tarihi</th>
                      <th className="py-2.5 px-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70">
                    {filteredUsers.map((u) => {
                      const isMe =
                        currentUser?.id === u.id || currentUser?.email === u.email;
                      return (
                        <tr key={u.id} className="hover:bg-zinc-50/60 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-[11px] text-zinc-800 shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900 leading-tight">
                                  {u.name}
                                  {isMe && (
                                    <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-zinc-900 text-white rounded font-normal">
                                      Sen
                                    </span>
                                  )}
                                </p>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-zinc-600">
                            <span className="font-mono text-[11px]">{u.email || '—'}</span>
                          </td>

                          <td className="py-3 px-3">{getRoleBadge(u.role)}</td>

                          <td className="py-3 px-3 text-[11px] text-zinc-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '—'}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(u)}
                                title="Rol & Bilgi Düzenle"
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!isMe && (
                                <button
                                  onClick={() => handleOpenDelete(u)}
                                  title="Kullanıcıyı Sil"
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Ad Soyad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              E-posta Adresi <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-zinc-50 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Sistem Rolü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex flex-col p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  formData.role === 'staff'
                    ? 'border-zinc-900 bg-zinc-50 font-medium'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value="staff"
                  checked={formData.role === 'staff'}
                  onChange={() => setFormData({ ...formData, role: 'staff' })}
                  className="sr-only"
                />
                <span className="font-semibold text-zinc-900">Personel</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Envanter yönetimi yapabilir.</span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  formData.role === 'admin'
                    ? 'border-zinc-900 bg-zinc-50 font-medium'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={() => setFormData({ ...formData, role: 'admin' })}
                  className="sr-only"
                />
                <span className="font-semibold text-emerald-700">Yönetici</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Tam yetkili.</span>
              </label>

              <label
                className={`flex flex-col p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  formData.role === 'user'
                    ? 'border-zinc-900 bg-zinc-50 font-medium'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  name="editRole"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={() => setFormData({ ...formData, role: 'user' })}
                  className="sr-only"
                />
                <span className="font-semibold text-amber-700">Yetkisiz</span>
                <span className="text-[10px] text-zinc-500 mt-0.5">Tüm erişimi kapalıdır.</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
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
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Bu işlem geri alınamaz!</p>
              <p className="mt-0.5">
                <strong>{selectedUser?.name}</strong> ({selectedUser?.email}) adlı kullanıcının yetki profili kalıcı olarak silinecek ve sisteme erişimi engellenecektir.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {submitting ? 'Siliniyor...' : 'Evet, Kullanıcıyı Sil'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
