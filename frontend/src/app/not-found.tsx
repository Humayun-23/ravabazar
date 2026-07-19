import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">404</h1>
      <h2 className="text-xl font-semibold mb-2 text-foreground">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Oops! The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>
      <Button 
        size="lg" 
        className="rounded-full px-8 font-bold"
        render={<Link href="/" />}
        nativeButton={false}
      >
        Return to Home
      </Button>
    </div>
  );
}
