'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { PublicUser } from '@/lib/api.types';

interface AdminUser extends PublicUser {
  displayName?: string | null;
}

interface AdminUserContextValue {
  user: AdminUser | null;
}

const AdminUserContext = createContext<AdminUserContextValue>({ user: null });

export function AdminUserProvider({
  user,
  children,
}: {
  user: AdminUser | null;
  children: ReactNode;
}) {
  return <AdminUserContext.Provider value={{ user }}>{children}</AdminUserContext.Provider>;
}

export function useAdminUser(): AdminUser | null {
  const { user } = useContext(AdminUserContext);
  return user;
}
