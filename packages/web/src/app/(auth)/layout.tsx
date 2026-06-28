import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8"
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
