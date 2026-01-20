import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Trash2 } from "lucide-react";

interface Review {
    id: string;
    rating: number; // 1-5
    comment?: string;
    user: {
        id: string;
        name: string | null;
    };
    // createdAt? assumed default sort
}

interface CourseReviewsProps {
    courseId: string;
    isEnrolled: boolean;
}

export function CourseReviews({ courseId, isEnrolled }: CourseReviewsProps) {
    const { token, user } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Check if user already reviewed to hide form or show edit
    const [hasReviewed, setHasReviewed] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API_URL}/reviews/course/${courseId}`);
            setReviews(res.data.reviews);
            setAverage(res.data.average);
            setCount(res.data.count);

            if (user) {
                const myReview = res.data.reviews.find((r: Review) => r.user.id === user.id);
                if (myReview) {
                    setHasReviewed(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch reviews");
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [courseId, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (myRating === 0) return alert("Please select a rating");

        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/reviews`, {
                courseId,
                rating: myRating,
                comment: myComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyRating(0);
            setMyComment("");
            fetchReviews(); // Refresh
        } catch (error) {
            alert("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this review?")) return;
        try {
            await axios.delete(`${API_URL}/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReviews();
        } catch (error) {
            alert("Failed to delete review");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="text-center">
                    <div className="text-4xl font-bold">{average}</div>
                    <StarRating rating={average} size="lg" />
                    <div className="text-sm text-muted-foreground mt-1">{count} reviews</div>
                </div>

                <div className="flex-1 border-l pl-6 h-20 flex flex-col justify-center">
                    {/* Minimal Breakdown could go here */}
                    <p className="text-muted-foreground">Student feedback on this course.</p>
                </div>
            </div>

            {isEnrolled && !hasReviewed && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Write a Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Rating</label>
                                <StarRating rating={myRating} editable onChange={setMyRating} size="lg" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Comment (Optional)</label>
                                <Textarea
                                    placeholder="Tell us what you thought about this course..."
                                    value={myComment}
                                    onChange={e => setMyComment(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Review"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold">{review.user.name || "Student"}</div>
                                    <StarRating rating={review.rating} size="sm" className="mt-1" />
                                </div>
                                {(user?.role === 'ADMIN' || user?.id === review.user.id) && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(review.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            {review.comment && (
                                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                            )}
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No reviews yet.</p>
                )}
            </div>
        </div>
    );
}
