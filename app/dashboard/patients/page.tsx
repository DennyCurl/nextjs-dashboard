import Pagination from '@/app/ui/visits/pagination';
import Search from '@/app/ui/search';
import PatientsTable from '@/app/ui/patients/table';
import { lusitana } from '@/app/ui/fonts';
import { VisitsTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchFilteredPatients, fetchPatientsPages } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patients',
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchPatientsPages(query);
  const patients = await fetchFilteredPatients(query, currentPage);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Пацієнти</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Пошук пацієнтів..." />
      </div>
      <Suspense key={query + currentPage} fallback={<VisitsTableSkeleton />}>
        <PatientsTable patients={patients} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}