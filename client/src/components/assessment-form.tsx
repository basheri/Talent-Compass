import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, User, GraduationCap, Briefcase, Star, Heart, Target, AlertTriangle } from 'lucide-react';
import type { AssessmentData } from '@/lib/types';
import { initialAssessmentData } from '@/lib/types';

interface AssessmentFormProps {
  isRtl: boolean;
  onComplete: (data: AssessmentData) => void;
  onBack: () => void;
}

type FieldKey = keyof AssessmentData;

interface FormStep {
  key: FieldKey;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  placeholder: string;
  multiline?: boolean;
}

export function AssessmentForm({ isRtl, onComplete, onBack }: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AssessmentData>(initialAssessmentData);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const ArrowNext = isRtl ? ArrowLeft : ArrowRight;
  const ArrowPrev = isRtl ? ArrowRight : ArrowLeft;

  const steps: FormStep[] = isRtl
    ? [
        { key: 'name', icon: User, title: 'ما اسمك؟', description: 'أخبرنا باسمك لنخاطبك به', placeholder: 'اكتب اسمك هنا' },
        { key: 'age', icon: User, title: 'كم عمرك؟', description: 'يساعدنا هذا في تقديم نصائح مناسبة لمرحلتك العمرية', placeholder: 'مثال: 25' },
        { key: 'education', icon: GraduationCap, title: 'ما مستواك التعليمي؟', description: 'أخبرنا عن مؤهلاتك الدراسية', placeholder: 'مثال: بكالوريوس في علوم الحاسب', multiline: true },
        { key: 'currentRole', icon: Briefcase, title: 'ما وظيفتك الحالية؟', description: 'أو ما آخر وظيفة شغلتها', placeholder: 'مثال: مطور برمجيات / طالب / باحث عن عمل', multiline: true },
        { key: 'skills', icon: Star, title: 'ما مهاراتك؟', description: 'اذكر المهارات التي تتقنها سواء تقنية أو شخصية', placeholder: 'مثال: البرمجة، التصميم، التواصل، إدارة المشاريع...', multiline: true },
        { key: 'interests', icon: Heart, title: 'ما اهتماماتك وشغفك؟', description: 'ما الأنشطة التي تستمتع بها؟', placeholder: 'مثال: القراءة، التكنولوجيا، الفن، الرياضة...', multiline: true },
        { key: 'goals', icon: Target, title: 'ما أهدافك المهنية؟', description: 'أين ترى نفسك في المستقبل؟', placeholder: 'مثال: أريد أن أصبح مديراً تقنياً خلال 5 سنوات...', multiline: true },
        { key: 'challenges', icon: AlertTriangle, title: 'ما التحديات التي تواجهك؟', description: 'ما العوائق التي تمنعك من تحقيق أهدافك؟', placeholder: 'مثال: قلة الخبرة، عدم اليقين بالمسار الصحيح...', multiline: true },
      ]
    : [
        { key: 'name', icon: User, title: 'What is your name?', description: 'Tell us your name so we can personalize your experience', placeholder: 'Enter your name' },
        { key: 'age', icon: User, title: 'How old are you?', description: 'This helps us provide age-appropriate advice', placeholder: 'e.g., 25' },
        { key: 'education', icon: GraduationCap, title: 'What is your education level?', description: 'Tell us about your academic background', placeholder: 'e.g., Bachelor\'s in Computer Science', multiline: true },
        { key: 'currentRole', icon: Briefcase, title: 'What is your current role?', description: 'Or your most recent position', placeholder: 'e.g., Software Developer / Student / Job Seeker', multiline: true },
        { key: 'skills', icon: Star, title: 'What are your skills?', description: 'List your technical and soft skills', placeholder: 'e.g., Programming, Design, Communication, Project Management...', multiline: true },
        { key: 'interests', icon: Heart, title: 'What are your interests and passions?', description: 'What activities do you enjoy?', placeholder: 'e.g., Reading, Technology, Art, Sports...', multiline: true },
        { key: 'goals', icon: Target, title: 'What are your career goals?', description: 'Where do you see yourself in the future?', placeholder: 'e.g., I want to become a Tech Lead within 5 years...', multiline: true },
        { key: 'challenges', icon: AlertTriangle, title: 'What challenges do you face?', description: 'What obstacles prevent you from achieving your goals?', placeholder: 'e.g., Lack of experience, uncertainty about the right path...', multiline: true },
      ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = (): boolean => {
    const value = formData[currentStepData.key];
    if (!value.trim()) {
      setErrors({ [currentStepData.key]: isRtl ? 'هذا الحقل مطلوب' : 'This field is required' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleChange = (value: string) => {
    setFormData({ ...formData, [currentStepData.key]: value });
    if (errors[currentStepData.key]) {
      setErrors({});
    }
  };

  const labels = isRtl
    ? { back: 'رجوع', next: 'التالي', finish: 'إنهاء', stepOf: 'من' }
    : { back: 'Back', next: 'Next', finish: 'Finish', stepOf: 'of' };

  return (
    <section className="py-12 px-4 md:px-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {isRtl ? `الخطوة ${currentStep + 1} ${labels.stepOf} ${steps.length}` : `Step ${currentStep + 1} ${labels.stepOf} ${steps.length}`}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="overflow-visible">
          <CardHeader className="space-y-4">
            <div className={`flex items-center gap-3 ${isRtl ? '' : ''}`}>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <currentStepData.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={currentStepData.key} className="sr-only">
                {currentStepData.title}
              </Label>
              {currentStepData.multiline ? (
                <Textarea
                  id={currentStepData.key}
                  value={formData[currentStepData.key]}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder={currentStepData.placeholder}
                  className={`min-h-[120px] ${isRtl ? 'text-right' : ''}`}
                  data-testid={`input-${currentStepData.key}`}
                />
              ) : (
                <Input
                  id={currentStepData.key}
                  value={formData[currentStepData.key]}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder={currentStepData.placeholder}
                  className={isRtl ? 'text-right' : ''}
                  data-testid={`input-${currentStepData.key}`}
                />
              )}
              {errors[currentStepData.key] && (
                <p className="text-sm text-destructive">{errors[currentStepData.key]}</p>
              )}
            </div>

            <div className={`flex items-center gap-3 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={handlePrev}
                data-testid="button-prev-step"
              >
                <ArrowPrev className="h-4 w-4 me-2" />
                {labels.back}
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1"
                data-testid="button-next-step"
              >
                {currentStep === steps.length - 1 ? labels.finish : labels.next}
                <ArrowNext className="h-4 w-4 ms-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                    ? 'w-2 bg-primary/50 cursor-pointer'
                    : 'w-2 bg-muted'
              }`}
              disabled={index > currentStep}
              data-testid={`step-indicator-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
