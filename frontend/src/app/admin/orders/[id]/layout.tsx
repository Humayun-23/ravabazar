export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${apiUrl}/orders?limit=100`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.items && Array.isArray(data.items)) {
        return data.items.map((order: { id: number | string }) => ({
          id: order.id.toString(),
        }));
      }
    }
  } catch (error) {
    console.warn('Error fetching orders for generateStaticParams', error);
  }
  
  // Fallback
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function AdminOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
