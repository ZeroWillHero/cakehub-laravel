import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import SellerLayout from '@/Layouts/SellerLayout';
import RatingStars from '@/components/shared/RatingStars';
import { api } from '@/lib/api';
import type { Review } from '@/types/order';

interface Props {
    reviews: Review[];
    averageRating: number;
}

function ReviewCard({ review, onResponded }: { review: Review; onResponded: (r: Review) => void }) {
    const [responding, setResponding] = useState(false);
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function submit() {
        setSubmitting(true);
        try {
            const updated = await api.post<Review>(`/seller/reviews/${review.id}/response`, { response });
            onResponded(updated);
            setResponding(false);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card>
            <CardContent className="space-y-2 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                            <AvatarImage src={review.customer?.avatar_url ?? undefined} alt={review.customer?.name} />
                            <AvatarFallback className="text-[10px]">
                                {review.customer?.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{review.customer?.name}</span>
                    </div>
                    <RatingStars value={review.rating} />
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}

                {review.seller_response ? (
                    <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                        <p className="text-xs font-medium text-muted-foreground">Your response</p>
                        <p>{review.seller_response}</p>
                    </div>
                ) : responding ? (
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Write a response…"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button type="button" size="sm" disabled={!response || submitting} onClick={submit}>
                                Post response
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setResponding(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setResponding(true)}>
                        Respond
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function SellerReviews({ reviews: initialReviews, averageRating }: Props) {
    const [reviews, setReviews] = useState(initialReviews);

    return (
        <SellerLayout breadcrumb={['Reviews']}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Reviews</h1>
                <div className="flex items-center gap-2">
                    <RatingStars value={Math.round(averageRating)} />
                    <span className="text-sm text-muted-foreground">{averageRating.toFixed(1)} average</span>
                </div>
            </div>

            {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
                <div className="space-y-3">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onResponded={(updated) =>
                                setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                            }
                        />
                    ))}
                </div>
            )}
        </SellerLayout>
    );
}
