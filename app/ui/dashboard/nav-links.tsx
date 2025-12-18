'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  BuildingStorefrontIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useRBAC } from '@/app/ui/rbac/rbac-provider';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Головна', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Візити',
    href: '/dashboard/visits',
    icon: DocumentDuplicateIcon,
  },
  { name: 'Пацієнти', href: '/dashboard/patients', icon: UserGroupIcon },
  { name: 'Аптека', href: '/dashboard/pharmacy', icon: BuildingStorefrontIcon },
];

const adminLinks = [
  { name: 'Адмін', href: '/dashboard/admin', icon: CogIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  const { hasRole, isLoading } = useRBAC();

  const allLinks = [...links];
  
  // Add admin links if user has admin role
  if (!isLoading && hasRole('admin')) {
    allLinks.push(...adminLinks);
  }

  return (
    <>
      {allLinks.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
