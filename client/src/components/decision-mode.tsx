import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Ban, Clock, AlertTriangle, TrendingUp, Undo2 } from 'lucide-react';
import type { DecisionData } from '@/lib/types';
import { APP_CONSTANTS } from '@/lib/constants';

interface DecisionModeProps {
    data: DecisionData;
    isRtl: boolean;
    language: 'ar' | 'en';
    onCommit: (commitment: string) => void;
    onReevaluate: () => void;
}

export function DecisionMode({ data, isRtl, language, onCommit, onReevaluate }: DecisionModeProps) {
    const [commitment, setCommitment] = useState('');
    const labels = isRtl ? APP_CONSTANTS.DECISION.AR : APP_CONSTANTS.DECISION.EN;

    const handleSubmit = () => {
        if (commitment.trim()) {
            onCommit(commitment);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-300">
            <Card className="w-full max-w-2xl shadow-2xl border-primary/20 max-h-[90vh] overflow-y-auto">
                <CardHeader className="bg-primary/5 border-b text-center pb-6">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-8 h-8" />
                        {labels.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 pt-6" dir={isRtl ? 'rtl' : 'ltr'}>
                    {/* Primary Direction */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            {labels.primary_direction}
                        </h3>
                        <div className="text-xl font-bold bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                            {data.primary_direction}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Reasons */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">{labels.reasons}</h3>
                            <ul className="space-y-2">
                                {data.reasons.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                                        <span>{reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Stop List */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Ban className="w-4 h-4 text-destructive" />
                                {labels.stop_list}
                            </h3>
                            <ul className="space-y-2">
                                {data.stop_list.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded">
                                        <span className="w-4 h-4 flex items-center justify-center font-bold text-destructive">×</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 90-Day Plan */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {labels.plan_90_days}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {data.plan_90_days.map((step, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary/50 transition-colors">
                                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-primary text-base font-bold shrink-0">
                                        {i + 1}
                                    </Badge>
                                    <span className="text-sm font-medium">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        {/* Opportunity Cost */}
                        <div className="bg-muted/30 p-3 rounded-lg border border-dashed">
                            <span className="font-semibold block mb-1">{labels.opportunity_cost}:</span>
                            <span className="text-muted-foreground">{data.opportunity_cost}</span>
                        </div>
                        {/* Abort Signal */}
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                            <span className="font-semibold block mb-1 text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                {labels.abort_signal}:
                            </span>
                            <span className="text-yellow-900 dark:text-yellow-100">{data.abort_signal}</span>
                        </div>
                    </div>

                    {/* Commitment Gate */}
                    <div className="pt-4 border-t space-y-4">
                        <div className="flex gap-3">
                            <Input
                                value={commitment}
                                onChange={(e) => setCommitment(e.target.value)}
                                placeholder={labels.commitment_placeholder}
                                className="h-12 text-lg"
                            />
                            <Button
                                onClick={handleSubmit}
                                className="h-12 px-8 font-bold"
                                disabled={!commitment.trim() || commitment.length < 5}
                            >
                                {labels.commit_button}
                                {isRtl ? <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="justify-start pb-6 pt-0">
                    <Button variant="ghost" size="sm" onClick={onReevaluate} className="text-muted-foreground hover:text-foreground">
                        <Undo2 className="w-4 h-4 mr-2" />
                        {labels.back_button}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
