import SideNav from '@/app/ui/dashboard/sidenav';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const experimental_ppr = true;
 
export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}