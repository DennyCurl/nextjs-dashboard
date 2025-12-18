'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { LocalAssignment } from '@/app/lib/definitions'

interface UserInfoClientProps {
  userEmail: string
  userName?: string
  initialAssignments: LocalAssignment[]
}

export default function UserInfoClient({ 
  userEmail, 
  userName, 
  initialAssignments 
}: UserInfoClientProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLocalId, setSelectedLocalId] = useState<number | null>(null)

  // Load selected local from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedLocalId')
    if (saved) {
      setSelectedLocalId(Number(saved))
    } else if (initialAssignments.length > 0) {
      // Auto-select first assignment if none selected
      const firstLocalId = initialAssignments[0].locals_id
      setSelectedLocalId(firstLocalId)
      localStorage.setItem('selectedLocalId', String(firstLocalId))
    }
  }, [initialAssignments])

  const handleSelectLocal = (localId: number) => {
    setSelectedLocalId(localId)
    localStorage.setItem('selectedLocalId', String(localId))
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('localChanged', { detail: { localId } }))
  }

  // Get currently selected assignment
  const selectedAssignment = initialAssignments.find(
    (a) => a.locals_id === selectedLocalId
  )

  // Format location string for display
  const getLocationString = (assignment: LocalAssignment) => {
    const parts = []
    if (assignment.local?.organization?.organization_name) {
      parts.push(assignment.local.organization.organization_name)
    }
    if (assignment.local?.department?.department_name) {
      parts.push(assignment.local.department.department_name)
    }
    if (assignment.local?.room?.room_name) {
      parts.push(assignment.local.room.room_name)
    }
    return parts.length > 0 ? parts.join(' / ') : 'Локалізація'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <div className="flex flex-col items-start truncate min-w-0 flex-1">
          <span className="text-gray-500 text-[10px] mb-0.5">
            {userName || userEmail}
          </span>
          {selectedAssignment ? (
            <span className="font-medium text-blue-600 truncate w-full text-left">
              {getLocationString(selectedAssignment)}
            </span>
          ) : (
            <span className="text-gray-400 text-[10px]">
              Оберіть локалізацію
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 ml-2 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="mb-3 pb-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900">
                {userName || 'Користувач'}
              </p>
              <p className="text-xs text-gray-500 break-all">{userEmail}</p>
            </div>

            {initialAssignments.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">
                  Оберіть локалізацію:
                </h4>
                <div className="space-y-2">
                  {initialAssignments.map((assignment) => {
                    const isSelected = assignment.locals_id === selectedLocalId
                    return (
                      <button
                        key={assignment.id}
                        onClick={() => handleSelectLocal(assignment.locals_id)}
                        className={`w-full p-3 rounded-md text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div className="space-y-1">
                          {assignment.local?.organization && (
                            <div>
                              <span className="font-medium text-gray-700">Організація:</span>
                              <span className="ml-1 text-gray-900">
                                {assignment.local.organization.organization_name}
                              </span>
                            </div>
                          )}
                          {assignment.local?.department && (
                            <div>
                              <span className="font-medium text-gray-700">Відділ:</span>
                              <span className="ml-1 text-gray-900">
                                {assignment.local.department.department_name}
                              </span>
                            </div>
                          )}
                          {assignment.local?.room && (
                            <div>
                              <span className="font-medium text-gray-700">Кімната:</span>
                              <span className="ml-1 text-gray-900">
                                {assignment.local.room.room_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Немає призначень
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
