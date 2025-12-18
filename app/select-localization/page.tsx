'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LocalAssignment {
  id: number;
  locals_id: number;
  organization_name: string | null;
  department_name: string | null;
  room_name: string | null;
}

export default function SelectLocalizationPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<LocalAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/current-localization');
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 404) {
          setError('У вас немає призначених локалізацій. Зверніться до адміністратора.');
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to load localizations');
      }

      const data = await response.json();
      
      // Якщо є поточна локалізація, перенаправляємо на dashboard
      if (data.current) {
        router.push('/dashboard');
        return;
      }

      // Якщо одна локалізація - автоматично вибираємо її
      if (data.assignments.length === 1) {
        await selectLocalization(data.assignments[0].locals_id);
        return;
      }

      setAssignments(data.assignments);
      setLoading(false);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Помилка завантаження локалізацій');
      setLoading(false);
    }
  };

  const selectLocalization = async (localsId: number) => {
    setSelecting(true);
    setError(null);

    try {
      const response = await fetch('/api/current-localization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locals_id: localsId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set localization');
      }

      // Перенаправляємо на dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error selecting localization:', err);
      setError('Помилка вибору локалізації');
      setSelecting(false);
    }
  };

  const getLocalizationName = (assignment: LocalAssignment) => {
    const parts = [];
    if (assignment.organization_name) parts.push(assignment.organization_name);
    if (assignment.department_name) parts.push(assignment.department_name);
    if (assignment.room_name) parts.push(assignment.room_name);
    return parts.join(' - ') || `Локалізація #${assignment.locals_id}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Помилка</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Повернутися на головну
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Оберіть локалізацію
          </h1>
          <p className="text-gray-600">
            Виберіть місце роботи для початку роботи з системою
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Немає доступних локалізацій</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => selectLocalization(assignment.locals_id)}
                disabled={selecting}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">📍</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {getLocalizationName(assignment)}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      {assignment.organization_name && (
                        <p>🏥 {assignment.organization_name}</p>
                      )}
                      {assignment.department_name && (
                        <p>🏢 {assignment.department_name}</p>
                      )}
                      {assignment.room_name && (
                        <p>🚪 {assignment.room_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selecting && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Встановлення локалізації...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
