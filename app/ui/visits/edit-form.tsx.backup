'use client';

import { Patient, VisitForm } from '@/app/lib/definitions';
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateVisit, State } from '@/app/lib/actions';
import { useActionState } from 'react';
 
export default function EditVisitForm({
  visit,
  patients = [],
}: {
  visit: VisitForm;
  patients?: Patient[];
}) {
  const initialState: State = { message: null, errors: {} };
  const updateVisitWithId = updateVisit.bind(null, visit.id);
  const [state, formAction] = useActionState(updateVisitWithId, initialState);
 
  return <form action={formAction}>
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Patient Name */}
        <div className="mb-4">
          <label htmlFor="patient" className="mb-2 block text-sm font-medium">
            Choose patient
          </label>
          <div className="relative">
            <select
              id="patient"
              name="patientId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={visit.patient_id}
              aria-describedby="patient-error"
            >
              <option value="" disabled>
                Select a patient
              </option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="patient-error" aria-live="polite" aria-atomic="true">
            {state.errors?.patientId &&
            state.errors.patientId.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
            ))}
          </div>
        </div>

        {/* Visit Amount */}
        <div className="mb-4">
          <label htmlFor="amount" className="mb-2 block text-sm font-medium">
            Choose an amount
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={visit.amount}
                placeholder="Enter USD amount"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="amount-error"
              />
              <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="amount-error" aria-live="polite" aria-atomic="true">
              {state.errors?.amount &&
              state.errors.amount.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
              </p>
              ))}
            </div>
          </div>
        </div>

        {/* Visit Status */}
        <fieldset>
          <legend className="mb-2 block text-sm font-medium">
            Set the visit status
          </legend>
          <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="pending"
                  name="status"
                  type="radio"
                  value="pending"
                  defaultChecked={visit.status === 'pending'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                  aria-describedby="status-error"
                />
                <label
                  htmlFor="pending"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  Pending <ClockIcon className="h-4 w-4" />
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="completed"
                  name="status"
                  type="radio"
                  value="completed"
                  defaultChecked={visit.status === 'completed'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                <label
                  htmlFor="completed"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Completed <CheckIcon className="h-4 w-4" />
                </label>
              </div>
            </div>
          </div>
        </fieldset>
        <div id="status-error" aria-live="polite" aria-atomic="true">
          {state.errors?.status &&
          state.errors.status.map((error: string) => (
          <p className="mt-2 text-sm text-red-500" key={error}>
          {error}
          </p>
          ))}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/visits"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Edit Visit</Button>
      </div>
    </form>;
}
