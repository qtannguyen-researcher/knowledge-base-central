import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import type { CategoryNode } from '@/lib/api.types';
import { listCategories } from '@/lib/api';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let categories: CategoryNode[] = [];
  try {
    categories = await listCategories();
  } catch {
    categories = [];
  }

  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="hidden w-64 shrink-0 lg:block">
          <CategorySidebar categories={categories} />
        </div>
        <main id="main-content" className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <CategorySidebar categories={categories} />
          </div>
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}
