import { APP_CONSTANTS } from '@/lib/constants';
import type { JourneyStage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface JourneyStepperProps {
    currentStage: JourneyStage;
    isRtl: boolean;
    language: 'ar' | 'en';
}

const STAGE_ORDER: JourneyStage[] = [
    'outcome',
    'purpose',
    'reality',
    'options',
    'decision',
    'commitment'
];

export function JourneyStepper({ currentStage, isRtl, language }: JourneyStepperProps) {
    const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

    return (
        <div className="w-full py-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="relative flex items-center justify-between">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute top-1/2 h-1 bg-primary transition-all duration-500 -translate-y-1/2 z-0"
                        style={{
                            width: `${(currentStageIndex / (STAGE_ORDER.length - 1)) * 100}%`,
                            left: isRtl ? 'auto' : 0,
                            right: isRtl ? 0 : 'auto'
                        }}
                    />

                    {STAGE_ORDER.map((stage, index) => {
                        const isCompleted = index < currentStageIndex;
                        const isActive = index === currentStageIndex;
                        const label = APP_CONSTANTS.STAGES[language === 'ar' ? 'AR' : 'EN'][stage];

                        return (
                            <div key={stage} className="relative z-10 flex flex-col items-center group">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background",
                                        isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                            isActive ? "border-primary ring-2 ring-primary/20 ring-offset-2" :
                                                "border-muted-foreground/30 text-muted-foreground"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <span className="text-xs font-medium">{index + 1}</span>
                                    )}
                                </div>

                                {/* Stage Label */}
                                <div className={cn(
                                    "absolute top-10 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-300",
                                    isActive ? "text-primary font-bold" :
                                        isCompleted ? "text-primary/80" :
                                            "text-muted-foreground"
                                )}>
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
