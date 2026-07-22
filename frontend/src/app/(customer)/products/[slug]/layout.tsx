export async function generateStaticParams() {
  try {
    // Attempt to fetch from the local API during build
    // We use the default API URL or localhost for build time
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const res = await fetch(`${apiUrl}/products?limit=100`);
    
    if (!res.ok) {
      console.warn('Failed to fetch products for static generation, using fallback list');
      return fallbackSlugs;
    }
    
    const data = await res.json();
    if (data && data.items && Array.isArray(data.items)) {
      return data.items.map((product: any) => ({
        slug: product.slug,
      }));
    }
  } catch (error) {
    console.warn('Error fetching products during build, using fallback list', error);
  }
  
  return fallbackSlugs;
}

const fallbackSlugs = [
  { slug: 'wireless-headphones' },
  { slug: 'smart-watch-pro' },
  { slug: 'mens-classic-cotton-t-shirt' },
  { slug: 'premium-denim-jacket' },
  { slug: 'organic-arabica-coffee-beans' },
];

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
