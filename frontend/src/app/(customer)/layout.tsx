import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { BottomNav } from '@/components/layout/BottomNav';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
