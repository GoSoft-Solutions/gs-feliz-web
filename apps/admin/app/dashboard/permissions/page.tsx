'use client';
import { useEffect, useState } from 'react';
import { getSession, permissionSections, type AdminRole, type AdminUser } from '../../../lib/auth';
import { authApi, type ApiAdminUser } from '../../../lib/api';
import { PageHeader } from '../../../components/page-header';
import { PasswordInput } from '../../../components/password-input';
import { IconPermissions, IconPlus, IconSave, IconTrash } from '../../../components/icons';

function ChangeMyPassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = () => {
    setError('');
    setSuccess(false);
    if (!currentPassword || !newPassword) {
      setError('Completa tu contraseña actual y la nueva.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setBusy(true);
    void authApi
      .changePassword(currentPassword, newPassword)
      .then(() => {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña'))
      .finally(() => setBusy(false));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-gray-800">Tu contraseña</h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">Cambia la contraseña de la cuenta con la que tienes sesión iniciada ahora.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="text-sm text-gray-600">
          Contraseña actual
          <div className="mt-1"><PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="********" className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm" /></div>
        </label>
        <label className="text-sm text-gray-600">
          Nueva contraseña
          <div className="mt-1"><PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm" /></div>
        </label>
        <label className="text-sm text-gray-600">
          Confirmar nueva contraseña
          <div className="mt-1"><PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Repite la nueva contraseña" className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm" /></div>
        </label>
      </div>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-3">Contraseña actualizada.</p>}
      <div className="flex justify-end mt-4">
        <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft disabled:opacity-50">
          <IconSave size={17} /> {busy ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  );
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', name: '', password: '', role: 'editor' as AdminRole, permissions: [] as AdminUser['permissions'] });
  const [error, setError] = useState('');

  useEffect(() => {
    void authApi.users().then((storedUsers) => {
      const mapped = storedUsers.map(mapUser);
      setUsers(mapped);
      setSelectedEmail(mapped[1]?.email ?? mapped[0]?.email ?? '');
    }).catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios'));
  }, []);

  const selectedUser = users.find((user) => user.email === selectedEmail);

  const updatePermission = (href: AdminUser['permissions'][number], enabled: boolean) => {
    setUsers((current) => current.map((user) => {
      if (user.email !== selectedEmail || user.role === 'admin') return user;
      const permissions = enabled
        ? [...new Set([...user.permissions, href])]
        : user.permissions.filter((permission) => permission !== href);
      return { ...user, permissions };
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const user = users.find((candidate) => candidate.email === selectedEmail);
    if (!user?.id) return;
    void authApi.updateUser(user.id, { permissions: user.permissions, role: user.role === 'admin' ? 'ADMIN' : 'EDITOR' }).then(() => setSaved(true)).catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron guardar los permisos'));
  };

  const createUser = () => {
    const username = form.username.trim().toLowerCase();
    if (!username || !form.name.trim() || !form.password) {
      setError('Completa nombre, usuario y contraseña.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (users.some((user) => user.username === username)) {
      setError('Ese usuario ya existe.');
      return;
    }
    const newUser: AdminUser = {
      username,
      name: form.name.trim(),
      email: `${username}@feliz.mx`,
      password: form.password,
      role: form.role,
      permissions: form.role === 'admin' ? permissionSections.map((section) => section.href) : form.permissions,
    };
    void authApi.createUser({ username: newUser.username, email: newUser.email, name: newUser.name, password: newUser.password, role: newUser.role === 'admin' ? 'ADMIN' : 'EDITOR', permissions: newUser.permissions }).then((created) => {
      const mapped = mapUser(created);
      setUsers((current) => [...current, mapped]); setSelectedEmail(mapped.email); setShowCreate(false); setForm({ username: '', name: '', password: '', role: 'editor', permissions: [] }); setError('');
    }).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo crear el usuario'));
  };

  const deleteUser = (user: AdminUser) => {
    const session = getSession();
    if (session?.email === user.email) {
      setError('No puedes borrar el usuario con el que tienes la sesión activa.');
      return;
    }
    if (!confirm(`¿Borrar al usuario ${user.name}?`)) return;
    if (!user.id) return;
    void authApi.removeUser(user.id).then(() => { const nextUsers = users.filter((candidate) => candidate.email !== user.email); setUsers(nextUsers); setSelectedEmail(nextUsers[0]?.email ?? ''); }).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo borrar el usuario'));
  };

  const toggleNewPermission = (href: AdminUser['permissions'][number], enabled: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: enabled ? [...new Set([...current.permissions, href])] : current.permissions.filter((permission) => permission !== href),
    }));
  };

  return (
    <div>
      <PageHeader
        icon={<IconPermissions size={20} />}
        title="Permisos"
        description="Administra usuarios y acceso por sección."
        actions={
          <button type="button" onClick={() => { setShowCreate(true); setError(''); }} title="Crear nuevo usuario" aria-label="Crear nuevo usuario" className="inline-flex items-center gap-2 px-3 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft">
            <IconPlus size={17} /> <span>Nuevo usuario</span>
          </button>
        }
      />

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <ChangeMyPassword />

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div><h2 className="font-semibold text-gray-800">Crear nuevo usuario</h2><p className="text-sm text-gray-500 mt-1">Define sus datos y las secciones que podrá utilizar.</p></div>
            <button type="button" onClick={() => setShowCreate(false)} title="Cerrar" aria-label="Cerrar" className="text-gray-400 hover:text-gray-800 text-xl">×</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm text-gray-600">Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nombre completo" /></label>
            <label className="text-sm text-gray-600">Usuario<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.replace(/\s/g, '').toLowerCase() })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="usuario" /></label>
            <label className="text-sm text-gray-600">Contraseña<div className="mt-1"><PasswordInput value={form.password} onChange={(value) => setForm({ ...form, password: value })} placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm" /></div></label>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Tipo de usuario</p>
            <div className="flex gap-3">
              {(['admin', 'editor'] as AdminRole[]).map((role) => <button key={role} type="button" onClick={() => setForm({ ...form, role })} className={`px-3 py-2 rounded-lg border text-sm ${form.role === role ? 'border-ink bg-ink text-white' : 'border-gray-200 text-gray-600'}`}>{role === 'admin' ? 'Administrador' : 'Editable'}</button>)}
            </div>
          </div>
          {form.role === 'editor' && <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{permissionSections.map((section) => <label key={section.href} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"><input type="checkbox" checked={form.permissions.includes(section.href)} onChange={(event) => toggleNewPermission(section.href, event.target.checked)} className="h-4 w-4 accent-ink" />{section.label}</label>)}</div>}
          <div className="flex justify-end mt-5"><button type="button" onClick={createUser} title="Guardar usuario" aria-label="Guardar usuario" className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft"><IconSave size={17} /> Crear usuario</button></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Usuarios</p>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.email} className={`flex items-center gap-2 rounded-lg border transition-colors ${selectedEmail === user.email ? 'border-ink bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
              <button
                type="button"
                onClick={() => { setSelectedEmail(user.email); setSaved(false); }}
                className="flex-1 min-w-0 text-left px-3 py-3"
              >
                <span className="block text-sm font-medium text-gray-800">{user.name}</span>
                <span className="block text-xs text-gray-500 mt-1">@{user.username}</span>
                <span className="block text-xs text-gray-400 mt-1">{user.role === 'admin' ? 'Administrador' : 'Editable'}</span>
              </button>
              <button type="button" onClick={() => deleteUser(user)} disabled={user.role === 'admin'} title={user.role === 'admin' ? 'El administrador no se puede borrar' : 'Borrar usuario'} aria-label={user.role === 'admin' ? 'El administrador no se puede borrar' : 'Borrar usuario'} className="p-2 mr-2 text-gray-400 hover:text-red-600 disabled:opacity-30"><IconTrash size={17} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {selectedUser && (
            <>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-semibold text-gray-800">Acceso de {selectedUser.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedUser.role === 'admin' ? 'El administrador conserva acceso total.' : 'Selecciona las secciones disponibles para este usuario.'}</p>
                </div>
                {selectedUser.role !== 'admin' && <span className="text-xs px-2 py-1 rounded bg-orange/10 text-orange">Editable</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionSections.map((section) => {
                  const checked = selectedUser.role === 'admin' || selectedUser.permissions.includes(section.href);
                  return (
                    <label key={section.href} className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${selectedUser.role === 'admin' ? 'bg-gray-50 text-gray-400' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={checked} disabled={selectedUser.role === 'admin'} onChange={(event) => updatePermission(section.href, event.target.checked)} className="h-4 w-4 accent-ink" />
                      <span className="text-sm text-gray-700">{section.label}</span>
                    </label>
                  );
                })}
              </div>

              {selectedUser.role !== 'admin' && (
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button type="button" onClick={handleSave} className="px-4 py-2 bg-ink text-white text-sm rounded-lg hover:bg-ink-soft">Guardar permisos</button>
                  {saved && <span className="text-sm text-green-600">Permisos guardados.</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function mapUser(user: ApiAdminUser): AdminUser {
  return { id: user.id, username: user.username, email: user.email, name: user.name, password: '', role: user.role === 'ADMIN' ? 'admin' : 'editor', permissions: user.permissions as AdminUser['permissions'] };
}