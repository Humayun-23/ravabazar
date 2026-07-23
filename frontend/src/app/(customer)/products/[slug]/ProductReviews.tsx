'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface ProductReviewsProps {
  productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => reviewsApi.getProductReviews(productId),
  });

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.addProductReview(productId, { rating, comment }),
    onSuccess: () => {
      setSuccessMsg('Review submitted successfully!');
      setErrorMsg('');
      setComment('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
    onError: (err: Error) => {
      setSuccessMsg('');
      setErrorMsg(err.message || 'Failed to submit review');
    }
  });

  const reviews: Review[] = data?.items || [];

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-xl font-bold mb-6">Customer Reviews</h3>
      
      {/* Add Review Form */}
      <div className="bg-muted/50 p-6 rounded-2xl mb-8">
        <h4 className="font-semibold mb-4">Write a Review</h4>
        {errorMsg && <p className="text-destructive text-sm mb-4">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm mb-4">{successMsg}</p>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star className={cn("w-6 h-6 transition-colors", rating >= star ? "fill-[#f59e0b] text-[#f59e0b]" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Comment (Optional)</label>
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike?"
          />
        </div>
        
        <Button 
          onClick={() => submitReview.mutate()} 
          disabled={submitReview.isPending}
        >
          {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={cn("w-4 h-4", review.rating >= star ? "fill-[#f59e0b] text-[#f59e0b]" : "text-muted-foreground/30")} 
                    />
                  ))}
                </div>
                <span className="font-semibold text-sm ml-2">
                  {review.user?.first_name} {review.user?.last_name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground/80 mt-2">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
