import Pagination from '@/app/ui/visits/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/visits/table';
import { CreateVisit } from '@/app/ui/visits/buttons';
import { roboto } from '@/app/ui/fonts';
import { VisitsTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchVisitsPages } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visits',
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
  const totalPages = await fetchVisitsPages(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${roboto.className} text-2xl`}>Visits</h1>
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages} ({totalPages > 0 ? `~${totalPages * 50} visits` : '0 visits'})
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search visits..." />
        <CreateVisit />
      </div>
      <Suspense key={query + currentPage} fallback={<VisitsTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}