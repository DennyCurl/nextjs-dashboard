'use client';

import { useState, useEffect } from 'react';
import { Organization, Department, Room, Local, LocalAssignment, AppUser } from '@/app/lib/definitions';

export default function LocalizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locals, setLocals] = useState<Local[]>([]);
  const [localAssignments, setLocalAssignments] = useState<LocalAssignment[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<'organizations' | 'departments' | 'rooms' | 'locals' | 'assignments'>('organizations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<LocalAssignment | null>(null);
  
  // Form states
  const [newOrganization, setNewOrganization] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newLocal, setNewLocal] = useState({
    organization_id: '',
    department_id: '',
    room_id: ''
  });
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    locals_id: ''
  });

  // Load data
  useEffect(() => {
    loadOrganizations();
    loadDepartments();
    loadRooms();
    loadLocals();
    loadLocalAssignments();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch {
      console.error('Error loading organizations');
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch {
      console.error('Error loading departments');
    }
  };

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch {
      console.error('Error loading rooms');
    }
  };

  const loadLocals = async () => {
    try {
      const response = await fetch('/api/locals');
      if (response.ok) {
        const data = await response.json();
        setLocals(data);
      }
    } catch {
      console.error('Error loading locals');
    }
  };

  const loadLocalAssignments = async () => {
    try {
      const response = await fetch('/api/local-assignments');
      if (response.ok) {
        const data = await response.json();
        setLocalAssignments(data);
      }
    } catch {
      console.error('Error loading local assignments');
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

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrganization.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_name: newOrganization }),
      });

      if (response.ok) {
        setNewOrganization('');
        await loadOrganizations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create organization');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_name: newDepartment }),
      });

      if (response.ok) {
        setNewDepartment('');
        await loadDepartments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create department');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: newRoom }),
      });

      if (response.ok) {
        setNewRoom('');
        await loadRooms();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create room');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocal.organization_id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/locals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: Number(newLocal.organization_id),
          department_id: newLocal.department_id ? Number(newLocal.department_id) : null,
          room_id: newLocal.room_id ? Number(newLocal.room_id) : null
        }),
      });

      if (response.ok) {
        const local = await response.json();
        setLocals([...locals, local]);
        setNewLocal({ organization_id: '', department_id: '', room_id: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create local');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.user_id || !newAssignment.locals_id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/local-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newAssignment.user_id,
          locals_id: Number(newAssignment.locals_id)
        }),
      });

      if (response.ok) {
        const assignment = await response.json();
        setLocalAssignments([...localAssignments, assignment]);
        setNewAssignment({ user_id: '', locals_id: '' });
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

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations?id=${editingOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_name: editingOrg.organization_name }),
      });

      if (response.ok) {
        const updated = await response.json();
        setOrganizations(organizations.map(o => o.id === updated.id ? updated : o));
        setEditingOrg(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update organization');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/departments?id=${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_name: editingDept.department_name }),
      });

      if (response.ok) {
        const updated = await response.json();
        setDepartments(departments.map(d => d.id === updated.id ? updated : d));
        setEditingDept(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update department');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms?id=${editingRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: editingRoom.room_name }),
      });

      if (response.ok) {
        const updated = await response.json();
        setRooms(rooms.map(r => r.id === updated.id ? updated : r));
        setEditingRoom(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update room');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocal) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/locals?id=${editingLocal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: editingLocal.organization_id,
          department_id: editingLocal.department_id || null,
          room_id: editingLocal.room_id || null
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLocals(locals.map(l => l.id === updated.id ? updated : l));
        setEditingLocal(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update local');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocal = async (localId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити цю локалізацію?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/locals?id=${localId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocals(locals.filter(l => l.id !== localId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete local');
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
      const response = await fetch(`/api/local-assignments?id=${editingAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingAssignment.user_id,
          locals_id: editingAssignment.locals_id
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setLocalAssignments(localAssignments.map(a => a.id === updated.id ? updated : a));
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

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Ви впевнені, що хочете видалити це призначення?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/local-assignments?id=${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLocalAssignments(localAssignments.filter(a => a.id !== assignmentId));
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
        <h1 className="text-2xl font-bold text-gray-900">Управління локалізацією</h1>
        <p className="mt-2 text-sm text-gray-600">
          Керуйте організаціями, відділами, кімнатами та призначеннями користувачів
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
          <TabButton id="organizations" label="Організації" active={activeTab === 'organizations'} />
          <TabButton id="departments" label="Відділи" active={activeTab === 'departments'} />
          <TabButton id="rooms" label="Кімнати" active={activeTab === 'rooms'} />
          <TabButton id="locals" label="Локалізації" active={activeTab === 'locals'} />
          <TabButton id="assignments" label="Призначення" active={activeTab === 'assignments'} />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'organizations' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Організації</h3>
            
            {/* Create Organization Form */}
            <form onSubmit={handleCreateOrganization} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Створити нову організацію</h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newOrganization}
                  onChange={(e) => setNewOrganization(e.target.value)}
                  placeholder="Назва організації"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>

            {/* Organizations Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Назва організації
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrg?.id === org.id ? (
                          <input
                            type="text"
                            value={editingOrg.organization_name}
                            onChange={(e) => setEditingOrg({...editingOrg, organization_name: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          org.organization_name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingOrg?.id === org.id ? (
                          <>
                            <button
                              onClick={handleUpdateOrganization}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingOrg(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingOrg(org)}
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

        {activeTab === 'departments' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Відділи</h3>
            
            {/* Create Department Form */}
            <form onSubmit={handleCreateDepartment} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Створити новий відділ</h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Назва відділу"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>

            {/* Departments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Назва відділу
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dept.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingDept?.id === dept.id ? (
                          <input
                            type="text"
                            value={editingDept.department_name || ''}
                            onChange={(e) => setEditingDept({...editingDept, department_name: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          dept.department_name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingDept?.id === dept.id ? (
                          <>
                            <button
                              onClick={handleUpdateDepartment}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingDept(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingDept(dept)}
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

        {activeTab === 'rooms' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Кімнати</h3>
            
            {/* Create Room Form */}
            <form onSubmit={handleCreateRoom} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Створити нову кімнату</h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="Назва кімнати"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>

            {/* Rooms Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Назва кімнати
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {room.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRoom?.id === room.id ? (
                          <input
                            type="text"
                            value={editingRoom.room_name}
                            onChange={(e) => setEditingRoom({...editingRoom, room_name: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          room.room_name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingRoom?.id === room.id ? (
                          <>
                            <button
                              onClick={handleUpdateRoom}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingRoom(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingRoom(room)}
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

        {activeTab === 'locals' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Локалізації</h3>
            
            {/* Create Local Form */}
            <form onSubmit={handleCreateLocal} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Створити нову локалізацію</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={newLocal.organization_id}
                  onChange={(e) => setNewLocal({...newLocal, organization_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть організацію</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.organization_name}</option>
                  ))}
                </select>
                <select
                  value={newLocal.department_id}
                  onChange={(e) => setNewLocal({...newLocal, department_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Оберіть відділ (необов&apos;язково)</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                  ))}
                </select>
                <select
                  value={newLocal.room_id}
                  onChange={(e) => setNewLocal({...newLocal, room_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Оберіть кімнату (необов&apos;язково)</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.room_name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Створення...' : 'Створити'}
                </button>
              </div>
            </form>

            {/* Locals Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Організація
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Відділ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кімната
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locals.map((local) => (
                    <tr key={local.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {local.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingLocal?.id === local.id ? (
                          <select
                            value={editingLocal.organization_id}
                            onChange={(e) => setEditingLocal({...editingLocal, organization_id: Number(e.target.value)})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {organizations.map(org => (
                              <option key={org.id} value={org.id}>{org.organization_name}</option>
                            ))}
                          </select>
                        ) : (
                          local.organization?.organization_name || local.organization_id
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingLocal?.id === local.id ? (
                          <select
                            value={editingLocal.department_id || ''}
                            onChange={(e) => setEditingLocal({...editingLocal, department_id: e.target.value ? Number(e.target.value) : null})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="">-</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                            ))}
                          </select>
                        ) : (
                          local.department?.department_name || local.department_id || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingLocal?.id === local.id ? (
                          <select
                            value={editingLocal.room_id || ''}
                            onChange={(e) => setEditingLocal({...editingLocal, room_id: e.target.value ? Number(e.target.value) : null})}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="">-</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id}>{room.room_name}</option>
                            ))}
                          </select>
                        ) : (
                          local.room?.room_name || local.room_id || '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {editingLocal?.id === local.id ? (
                          <>
                            <button
                              onClick={handleUpdateLocal}
                              className="text-green-600 hover:text-green-900"
                              disabled={loading}
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingLocal(null)}
                              className="text-gray-600 hover:text-gray-900"
                              disabled={loading}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingLocal(local)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={loading}
                            >
                              Редагувати
                            </button>
                            <button
                              onClick={() => handleDeleteLocal(local.id)}
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
            <h3 className="text-lg font-semibold mb-4">Призначення користувачів</h3>
            
            {/* Create Assignment Form */}
            <form onSubmit={handleCreateAssignment} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-md font-semibold mb-3">Призначити локалізацію користувачу</h4>
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
                  value={newAssignment.locals_id}
                  onChange={(e) => setNewAssignment({...newAssignment, locals_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Оберіть локалізацію</option>
                  {locals.map(local => (
                    <option key={local.id} value={local.id}>
                      {local.organization?.organization_name || `Org ID: ${local.organization_id}`}
                      {local.department && ` - ${local.department.department_name}`}
                      {local.room && ` - ${local.room.room_name}`}
                    </option>
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

            {/* Assignments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Користувач
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Організація
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Відділ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кімната
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.id}
                      </td>
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
                          assignment.user_name || assignment.user_id
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={3}>
                        {editingAssignment?.id === assignment.id ? (
                          <select
                            value={editingAssignment.locals_id}
                            onChange={(e) => setEditingAssignment({...editingAssignment, locals_id: Number(e.target.value)})}
                            className="px-2 py-1 border border-gray-300 rounded w-full"
                          >
                            <option value="">Оберіть локалізацію</option>
                            {locals.map(local => (
                              <option key={local.id} value={local.id}>
                                {local.organization?.organization_name || `Org ID: ${local.organization_id}`}
                                {local.department && ` - ${local.department.department_name}`}
                                {local.room && ` - ${local.room.room_name}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.local?.organization?.organization_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.local?.department?.department_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.local?.room?.room_name || '-'}
                            </td>
                          </>
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
