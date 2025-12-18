'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface LocalAssignment {
  id: number;
  locals_id: number;
  organization_name: string | null;
  department_name: string | null;
  room_name: string | null;
}

interface TreeNode {
  organizations: {
    [orgName: string]: {
      departments: {
        [deptName: string]: {
          rooms: LocalAssignment[];
        };
      };
      directAssignment?: LocalAssignment; // Для локалізацій тільки з організацією
    };
  };
}

export default function LocalizationSelector() {
  const router = useRouter();
  const [currentLocalization, setCurrentLocalization] = useState<LocalAssignment | null>(null);
  const [allLocalizations, setAllLocalizations] = useState<LocalAssignment[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Стан розгортання для дерева
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCurrentLocalization();
  }, []);

  const loadCurrentLocalization = async () => {
    try {
      const response = await fetch('/api/current-localization');
      if (response.ok) {
        const data = await response.json();
        setCurrentLocalization(data.current);
        setAllLocalizations(data.assignments || []);
      }
    } catch (error) {
      console.error('Error loading current localization:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLocalization = async (localsId: number) => {
    try {
      const response = await fetch('/api/current-localization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locals_id: localsId }),
      });

      if (response.ok) {
        setIsOpen(false);
        
        // Відразу відправляємо подію про зміну локалізації
        window.dispatchEvent(new CustomEvent('localizationChanged', { 
          detail: { localsId } 
        }));
        
        // Оновлюємо локальний стан
        await loadCurrentLocalization();
        
        // Перезавантажуємо сторінку щоб оновити всі дані
        router.refresh();
      }
    } catch (error) {
      console.error('Error changing localization:', error);
    }
  };

  const getLocalizationName = (assignment: LocalAssignment | null) => {
    if (!assignment) return 'Локалізація';
    const parts = [];
    if (assignment.organization_name) parts.push(assignment.organization_name);
    if (assignment.department_name) parts.push(assignment.department_name);
    if (assignment.room_name) parts.push(assignment.room_name);
    return parts.join(' - ') || `Локалізація #${assignment.locals_id}`;
  };

  // Групуємо локалізації у деревоподібну структуру
  const buildTree = (): TreeNode => {
    const tree: TreeNode = { organizations: {} };
    
    allLocalizations.forEach((assignment) => {
      const orgName = assignment.organization_name || 'Без організації';
      const deptName = assignment.department_name || 'Без відділення';
      
      if (!tree.organizations[orgName]) {
        tree.organizations[orgName] = { departments: {} };
      }
      
      // Якщо немає відділення і кімнати - це пряме призначення на організацію
      if (!assignment.department_name && !assignment.room_name) {
        tree.organizations[orgName].directAssignment = assignment;
      } else if (!assignment.room_name) {
        // Тільки організація + відділення (призначення на відділення)
        if (!tree.organizations[orgName].departments[deptName]) {
          tree.organizations[orgName].departments[deptName] = { rooms: [] };
        }
        // Додаємо як "прямий" запис відділення
        tree.organizations[orgName].departments[deptName].rooms.push(assignment);
      } else {
        // Повна ієрархія: організація + відділення + кімната
        if (!tree.organizations[orgName].departments[deptName]) {
          tree.organizations[orgName].departments[deptName] = { rooms: [] };
        }
        tree.organizations[orgName].departments[deptName].rooms.push(assignment);
      }
    });
    
    return tree;
  };

  // Перевірка чи доступний вибір рівня
  const isOrgSelectable = (orgData: TreeNode['organizations'][string]) => {
    return !!orgData.directAssignment;
  };

  const isDeptSelectable = (deptData: { rooms: LocalAssignment[] }) => {
    // Відділення доступне, якщо є assignment без room_name
    return deptData.rooms.some(r => !r.room_name);
  };

  const getDeptAssignment = (deptData: { rooms: LocalAssignment[] }) => {
    return deptData.rooms.find(r => !r.room_name);
  };

  const toggleOrg = (orgName: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgName)) {
      newExpanded.delete(orgName);
    } else {
      newExpanded.add(orgName);
    }
    setExpandedOrgs(newExpanded);
  };

  const toggleDept = (key: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedDepts(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium md:justify-start md:p-2 md:px-3">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    );
  }

  // Якщо одна локалізація - просто показуємо її без dropdown
  if (allLocalizations.length <= 1) {
    return (
      <div className="flex min-h-[48px] items-center justify-start gap-2 rounded-md bg-gray-50 py-3 px-3 text-sm font-medium md:py-2 md:px-3">
        <p className="text-blue-600 break-words leading-tight">
          {getLocalizationName(currentLocalization)}
        </p>
      </div>
    );
  }

  const tree = buildTree();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex min-h-[48px] w-full items-center justify-between gap-2 rounded-md bg-gray-50 py-3 px-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:py-2 md:px-3',
          {
            'bg-sky-100 text-blue-600': isOpen,
          }
        )}
      >
        <p className="break-words leading-tight flex-1 text-left">
          {getLocalizationName(currentLocalization)}
        </p>
        <svg
          className={clsx('w-4 h-4 flex-shrink-0 transition-transform', {
            'rotate-180': isOpen,
          })}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop для закриття при кліку поза меню */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown меню - відкривається ВВЕРХ */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-[600px] overflow-y-auto">
            <div className="py-2">
              {Object.entries(tree.organizations).map(([orgName, orgData]) => (
                <div key={orgName}>
                  {/* Організація */}
                  <div>
                    <button
                      onClick={() => {
                        if (isOrgSelectable(orgData)) {
                          changeLocalization(orgData.directAssignment!.locals_id);
                        } else {
                          toggleOrg(orgName);
                        }
                      }}
                      className={clsx(
                        'w-full px-3 py-2 text-left text-sm hover:bg-sky-50 transition-colors flex items-center gap-1',
                        {
                          'bg-sky-100 text-blue-600 font-semibold': 
                            orgData.directAssignment && currentLocalization?.locals_id === orgData.directAssignment.locals_id,
                          'font-semibold': isOrgSelectable(orgData),
                          'font-semibold text-gray-500': !isOrgSelectable(orgData),
                          'text-blue-700': isOrgSelectable(orgData) && !(orgData.directAssignment && currentLocalization?.locals_id === orgData.directAssignment.locals_id),
                        }
                      )}
                    >
                      {Object.keys(orgData.departments).length > 0 && (
                        expandedOrgs.has(orgName) ? 
                          <ChevronDownIcon className="w-4 h-4 flex-shrink-0" /> : 
                          <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="flex-1">{orgName}</span>
                      {orgData.directAssignment && currentLocalization?.locals_id === orgData.directAssignment.locals_id && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  </div>

                  {/* Відділення (показуємо тільки якщо організація розгорнута) */}
                  {expandedOrgs.has(orgName) && Object.entries(orgData.departments).map(([deptName, deptData]) => {
                    const deptAssignment = getDeptAssignment(deptData);
                    const isSelectable = isDeptSelectable(deptData);
                    const isCurrentDept = deptAssignment && currentLocalization?.locals_id === deptAssignment.locals_id;
                    const hasRooms = deptData.rooms.some(r => r.room_name);
                    
                    return (
                      <div key={`${orgName}-${deptName}`}>
                        <div className="flex items-center">
                          {/* Chevron для розгортання (якщо є кімнати) */}
                          {hasRooms && (
                            <button
                              onClick={() => toggleDept(`${orgName}-${deptName}`)}
                              className="px-2 py-2 hover:bg-sky-50"
                            >
                              {expandedDepts.has(`${orgName}-${deptName}`) ? 
                                <ChevronDownIcon className="w-3 h-3 flex-shrink-0" /> : 
                                <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
                              }
                            </button>
                          )}
                          
                          {/* Назва відділення - клік обирає (якщо доступно) */}
                          <button
                            onClick={() => {
                              if (isSelectable && deptAssignment) {
                                changeLocalization(deptAssignment.locals_id);
                              } else if (!hasRooms) {
                                // Якщо немає кімнат і не selectable - нічого не робимо
                              }
                            }}
                            className={clsx(
                              'flex-1 px-3 py-2 text-left text-xs hover:bg-sky-50 transition-colors flex items-center gap-1',
                              {
                                'bg-sky-50 text-blue-600 font-medium': isCurrentDept,
                                'text-blue-600': isSelectable && !isCurrentDept,
                                'text-gray-500': !isSelectable,
                              },
                              !hasRooms && 'pl-8'
                            )}
                            disabled={!isSelectable}
                          >
                            <span className="flex-1">{deptName}</span>
                            {isCurrentDept && (
                              <span className="text-xs">✓</span>
                            )}
                          </button>
                        </div>

                        {/* Кімнати */}
                        {expandedDepts.has(`${orgName}-${deptName}`) && deptData.rooms
                          .filter(room => room.room_name)
                          .map((room) => (
                            <button
                              key={room.id}
                              onClick={() => changeLocalization(room.locals_id)}
                              className={clsx(
                                'w-full px-3 py-1.5 pl-14 text-left text-xs hover:bg-sky-50 transition-colors flex items-center justify-between',
                                {
                                  'bg-sky-50 text-blue-600 font-medium': currentLocalization?.locals_id === room.locals_id,
                                  'text-blue-600': currentLocalization?.locals_id !== room.locals_id,
                                }
                              )}
                            >
                              <span>{room.room_name}</span>
                              {currentLocalization?.locals_id === room.locals_id && (
                                <span className="text-xs">✓</span>
                              )}
                            </button>
                          ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
