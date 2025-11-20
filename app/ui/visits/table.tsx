import Image from 'next/image';
import { UpdateVisit, DeleteVisit } from '@/app/ui/visits/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
import { fetchFilteredVisits } from '@/app/lib/data';

export default async function VisitsTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const visits = await fetchFilteredVisits(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {visits?.map((visit) => (
              <div
                key={visit.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <Image
                        src={visit.image_url}
                        className="mr-2 rounded-full"
                        width={28}
                        height={28}
                        alt={`${visit.name}'s profile picture`}
                      />
                      <p>{visit.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">Patient ID: {visit.patient_id}</p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-lg font-medium">
                      Visit Date
                    </p>
                    <p>{formatDateToLocal(visit.created_at)}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateVisit id={visit.id} />
                    <DeleteVisit id={visit.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Patient
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Visit Date
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Created By
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {visits?.map((visit) => (
                <tr
                  key={visit.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={visit.image_url || '/patients/default-avatar.svg'}
                        className="rounded-full"
                        width={28}
                        height={28}
                        alt={`${visit.name}'s profile picture`}
                      />
                      <p>{visit.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(visit.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {visit.user_name || 'Unknown'}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateVisit id={visit.id} />
                      <DeleteVisit id={visit.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
