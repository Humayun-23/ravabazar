'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/errors';
import { Trash2, Star } from 'lucide-react';

interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface ReviewsResponse {
  items: Review[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export default function AdminReviewsPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReviews({ page, page_size: 10 });
      setData(res);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch reviews'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      setDeletingId(id);
      await adminApi.deleteReview(id);
      fetchReviews();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete review'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage customer reviews for products.</p>
        </div>
        <Button variant="secondary" onClick={() => fetchReviews()}>Refresh</Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Product ID</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Comment</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && !data ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading reviews...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                data?.items.map((review) => (
                  <tr key={review.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {review.user?.first_name || review.user?.last_name 
                          ? `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim() 
                          : `User #${review.user_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">#{review.product_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{review.rating}</span>
                        <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="truncate" title={review.comment}>
                        {review.comment || <span className="text-muted-foreground italic">No comment</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(review.created_at))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{((data.page - 1) * data.page_size) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(data.page * data.page_size, data.total)}</span> of{' '}
              <span className="font-medium">{data.total}</span> reviews
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.total_pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
