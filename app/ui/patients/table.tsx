import Image from 'next/image';
import { FormattedPatientsTable } from '@/app/lib/definitions';

export default async function PatientsTable({
  patients,
}: {
  patients: FormattedPatientsTable[];
}) {
  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              <div className="md:hidden">
                {patients?.map((patient) => (
                  <div
                    key={patient.id}
                    className="mb-2 w-full rounded-md bg-white p-4"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="mb-2 flex items-center">
                          <div className="flex items-center gap-3">
                            <Image
                              src={patient.image_url}
                              className="rounded-full"
                              alt={`${patient.name}'s profile picture`}
                              width={28}
                              height={28}
                            />
                            <p>{patient.name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 text-sm">
                      <p>{patient.total_visits} visits</p>
                    </div>
                  </div>
                ))}
              </div>
              <table className="hidden min-w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Total Visits
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="group">
                      <td className="whitespace-nowrap bg-white py-5 pl-4 pr-3 text-sm text-black group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Image
                            src={patient.image_url}
                            className="rounded-full"
                            alt={`${patient.name}'s profile picture`}
                            width={28}
                            height={28}
                          />
                          <p>{patient.name}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm group-first-of-type:rounded-md group-last-of-type:rounded-md">
                        {patient.total_visits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
