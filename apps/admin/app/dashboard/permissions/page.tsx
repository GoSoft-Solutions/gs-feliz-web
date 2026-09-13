'use client';
import { useEffect, useState } from 'react';
import { getUsers, permissionSections, saveUsers, type AdminUser } from '../../../lib/auth';

export default function PermissionsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedUsers = getUsers();
    setUsers(storedUsers);
    setSelectedEmail(storedUsers[1]?.email ?? storedUsers[0]?.email ?? '');
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
    saveUsers(users);
    setSaved(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Permisos</h1>
        <p className="text-sm text-gray-500 mt-1">Administra el acceso del usuario secundario por seccion.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Usuarios</p>
          <div className="space-y-2">
            {users.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => { setSelectedEmail(user.email); setSaved(false); }}
                className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${selectedEmail === user.email ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <span className="block text-sm font-medium text-gray-800">{user.name}</span>
                <span className="block text-xs text-gray-500 mt-1">{user.email}</span>
                <span className="block text-xs text-gray-400 mt-1 capitalize">{user.role === 'admin' ? 'Administrador' : 'Usuario secundario'}</span>
              </button>
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
                {selectedUser.role !== 'admin' && <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700">Editable</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionSections.map((section) => {
                  const checked = selectedUser.role === 'admin' || selectedUser.permissions.includes(section.href);
                  return (
                    <label key={section.href} className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${selectedUser.role === 'admin' ? 'bg-gray-50 text-gray-400' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={checked} disabled={selectedUser.role === 'admin'} onChange={(event) => updatePermission(section.href, event.target.checked)} className="h-4 w-4 accent-gray-900" />
                      <span className="text-sm text-gray-700">{section.label}</span>
                    </label>
                  );
                })}
              </div>

              {selectedUser.role !== 'admin' && (
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button type="button" onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">Guardar permisos</button>
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