import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare, Check } from 'lucide-react';
import { submitSessionFeedback, getSessionFeedback } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface SessionFeedbackProps {
  isRtl: boolean;
}

export function SessionFeedback({ isRtl }: SessionFeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Load existing feedback on mount
  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const feedback = await getSessionFeedback();
        if (feedback) {
          setRating(feedback.rating);
          setComment(feedback.comment || '');
          setIsSubmitted(true);
        }
      } catch (error) {
        console.error('Failed to load session feedback:', error);
      }
    };
    loadFeedback();
  }, []);

  const labels = isRtl
    ? {
        title: 'كيف كانت تجربتك؟',
        subtitle: 'رأيك يساعدنا على التحسين',
        commentPlaceholder: 'أخبرنا برأيك... (اختياري)',
        submit: 'إرسال الملاحظات',
        thanks: 'شكراً لملاحظاتك!',
        thanksSubtitle: 'رأيك مهم لنا',
      }
    : {
        title: 'How was your experience?',
        subtitle: 'Your feedback helps us improve',
        commentPlaceholder: 'Tell us what you think... (optional)',
        submit: 'Submit Feedback',
        thanks: 'Thank you for your feedback!',
        thanksSubtitle: 'Your opinion matters to us',
      };

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await submitSessionFeedback(rating, comment || undefined);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: isRtl ? 'خطأ' : 'Error',
        description: isRtl ? 'فشل في إرسال الملاحظات' : 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-500/30 bg-green-500/5" data-testid="card-feedback-thanks">
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
            {labels.thanks}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {labels.thanksSubtitle}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-session-feedback">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          {labels.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              data-testid={`button-star-${star}`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={labels.commentPlaceholder}
          className={`resize-none ${isRtl ? 'text-right' : ''}`}
          rows={3}
          data-testid="input-feedback-comment"
        />

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
          data-testid="button-submit-feedback"
        >
          {labels.submit}
        </Button>
      </CardContent>
    </Card>
  );
}
