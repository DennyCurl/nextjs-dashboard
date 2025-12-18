'use client';

import { useState, useEffect } from 'react';
import { Role, RolePermission, RoleAssignment, Component, RoleOperation, AppUser } from '@/app/lib/definitions';

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [operations, setOperations] = useState<RoleOperation[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignments'>('roles');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<RolePermission | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<RoleAssignment | null>(null);
  
  // Form states
  const [newRole, setNewRole] = useState('');
  const [newPermission, setNewPermission] = useState({
    role_id: '',
    component_id: '',
    operation_id: ''
  });
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    role_id: ''
  });

  // Load data
  useEffect(() => {
    loadRoles();
    loadRolePermissions();
    loadRoleAssignments();
    loadComponents();
    loadOperations();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch {
      console.error('Error loading roles');
    }
  };

  const loadRolePermissions = async () => {
    try {
      const response = await fetch('/api/role-permissions');
      if (response.ok) {
        const permissions = await response.json();
        setRolePermissions(permissions);
      }
    } catch {
      console.error('Error loading permissions');
    }
  };

  const loadRoleAssignments = async () => {
    try {
      const response = await fetch('/api/role-assignments');
      if (response.ok) {
        const assignments = await response.json();
        setRoleAssignments(assignments);
      }
    } catch {
      console.error('Error loading assignments');
    }
  };

  const loadComponents = async () => {
    try {
      const response = await fetch('/api/components');
      if (response.ok) {
        const data = await response.json();
        setComponents(data);
      }
    } catch {
      console.error('Error loading components');
    }
  };

  const loadOperations = async () => {
    try {
      const response = await fetch('/api/operations');
      if (response.ok) {
        const data = await response.json();
        setOperations(data);
      }
    } catch {
      console.error('Error loading operations');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch {
      console.error('Error loading users');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setNewRole('');
        await loadRoles();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create role');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/roles?id=${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editingRole.role }),
      });

      if (response.ok) {
        const updated = await response.json();
        setRoles(roles.map(r => r.id === updated.id ? updated : r));
        setEditingRole(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update role');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermission.role_id || !newPermission.component_id || !newPermission.operation_id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: Number(newPermission.role_id),
          component_id: Number(newPermission.component_id),
          operation_id: Number(newPermission.operation_id)
        }),
      });

      if (response.ok) {
        const permission = await response.json();
        setRolePermissions([...rolePermissions, permission]);
        setNewPermission({ role_id: '', component_id: '', operation_id: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create permission');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermission) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/role-permissions?id=${editingPermission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_id: editingPermission.role_id,
          component_id: editingPermission.component_id,
          operation_id: editingPermission.operation_id
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setRolePermissions(rolePermissions.map(p => p.id === updated.id ? updated : p));
        setEditingPermission(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update permission');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.user_id || !newAssignment.role_id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/role-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newAssignment.user_id,
          role_id: Number(newAssignment.role_id)
        }),
      });

      if (response.ok) {
        const assignment = await response.json();
        setRoleAssignments([...roleAssignments, assignment]);
        setNewAssignment({ user_id: '', role_id: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create assignment');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/role-assignments?id=${editingAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingAssignment.user_id,
          role_id: editingAssignment.role_id
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setRoleAssignments(roleAssignments.map(a => a.id === updated.id ? updated : a));
        setEditingAssignment(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update assignment');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цей дозвіл?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/role-permissions?id=${permissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRolePermissions(rolePermissions.filter(p => p.id !== permissionId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete permission');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити це призначення?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/role-assignments?id=${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRoleAssignments(roleAssignments.filter(a => a.id !== assignmentId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete assignment');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ 
    id, 
    label, 
    active 
  }: { 
    id: typeof activeTab, 
    label: string, 
    active: boolean 
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 font-medium rounded-lg ${
        active 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Розмежування доступу за ролями</h1>
        <p className="mt-2 text-sm text-gray-600">
          Керуйте ролями, дозволами та призначеннями користувачів
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <TabButton id="roles" label="Ролі" active={activeTab === 'roles'} />
          <TabButton id="permissions" label="Дозволи" active={activeTab === 'permissions'} />
          <TabButton id="assignments" label="Призначення" active={activeTab === 'assignments'} />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'roles' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Системні ролі</h3>
            
            {/* Create Role Form */}
            <form onSubmit={handleCreateRole} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Створити нову роль</h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Назва ролі"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Створення...' : 'Створити роль'}
                </button>
              </div>
            </form>

            {/* Roles Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {role.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRole?.id === role.id ? (
                          <input
                            type="text"
                            value={editingRole.role}
                            onChange={(e) => setEditingRole({...editingRole, role: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          role.role
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingRole?.id === role.id ? (
                          <>
                            <button
                              onClick={handleUpdateRole}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingRole(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingRole(role)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={loading}
                          >
                            Редагувати
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Дозволи ролей</h3>
            
            {/* Create Permission Form */}
            <form onSubmit={handleCreatePermission} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Додати новий дозвіл</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={newPermission.role_id}
                  onChange={(e) => setNewPermission({...newPermission, role_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть роль</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.role}</option>
                  ))}
                </select>
                <select
                  value={newPermission.component_id}
                  onChange={(e) => setNewPermission({...newPermission, component_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть компонент</option>
                  {components.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.component_name}</option>
                  ))}
                </select>
                <select
                  value={newPermission.operation_id}
                  onChange={(e) => setNewPermission({...newPermission, operation_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть операцію</option>
                  {operations.map(op => (
                    <option key={op.id} value={op.id}>{op.operations}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Додавання...' : 'Додати'}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Компонент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Операція
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rolePermissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPermission?.id === permission.id ? (
                          <select
                            value={editingPermission.role_id}
                            onChange={(e) => setEditingPermission({...editingPermission, role_id: Number(e.target.value)})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>{role.role}</option>
                            ))}
                          </select>
                        ) : (
                          permission.role?.role || permission.role_id
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPermission?.id === permission.id ? (
                          <select
                            value={editingPermission.component_id}
                            onChange={(e) => setEditingPermission({...editingPermission, component_id: Number(e.target.value)})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {components.map(comp => (
                              <option key={comp.id} value={comp.id}>{comp.component_name}</option>
                            ))}
                          </select>
                        ) : (
                          permission.component?.component_name || permission.component_id
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingPermission?.id === permission.id ? (
                          <select
                            value={editingPermission.operation_id}
                            onChange={(e) => setEditingPermission({...editingPermission, operation_id: Number(e.target.value)})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {operations.map(op => (
                              <option key={op.id} value={op.id}>{op.operations}</option>
                            ))}
                          </select>
                        ) : (
                          permission.operation?.operations || permission.operation_id
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingPermission?.id === permission.id ? (
                          <>
                            <button
                              onClick={handleUpdatePermission}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingPermission(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingPermission(permission)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={loading}
                            >
                              Редагувати
                            </button>
                            <button
                              onClick={() => handleDeletePermission(permission.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              Видалити
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Призначення ролей</h3>
            
            {/* Create Assignment Form */}
            <form onSubmit={handleCreateAssignment} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Призначити роль користувачу</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={newAssignment.user_id}
                  onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть користувача</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name || user.user_id}
                    </option>
                  ))}
                </select>
                <select
                  value={newAssignment.role_id}
                  onChange={(e) => setNewAssignment({...newAssignment, role_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть роль</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.role}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Призначення...' : 'Призначити'}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Користувач
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingAssignment?.id === assignment.id ? (
                          <select
                            value={editingAssignment.user_id}
                            onChange={(e) => setEditingAssignment({...editingAssignment, user_id: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded w-full"
                          >
                            <option value="">Оберіть користувача</option>
                            {users.map(user => (
                              <option key={user.user_id} value={user.user_id}>
                                {user.user_name || user.user_id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          assignment.user?.name || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.user?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingAssignment?.id === assignment.id ? (
                          <select
                            value={editingAssignment.role_id}
                            onChange={(e) => setEditingAssignment({...editingAssignment, role_id: Number(e.target.value)})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>{role.role}</option>
                            ))}
                          </select>
                        ) : (
                          assignment.role?.role || assignment.role_id
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingAssignment?.id === assignment.id ? (
                          <>
                            <button
                              onClick={handleUpdateAssignment}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingAssignment(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingAssignment(assignment)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={loading}
                            >
                              Редагувати
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              Видалити
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}