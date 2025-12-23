import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Activity, Loader2, AlertCircle, ArrowLeft, Save, Beaker, ThumbsUp, ThumbsDown, Star, BarChart3, Archive, Download, Eye } from 'lucide-react';
import { APP_CONSTANTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminStats {
  uniqueUsers: number;
  totalMessages: number;
  activeUsers24h: number;
}

interface FeedbackStats {
  thumbsUp: number;
  thumbsDown: number;
  avgRating: number;
  totalSessionFeedback: number;
}

interface BehaviorStats {
  avgMessagesPerSession: number;
  completionRate: number;
  stageDropoffs: Record<string, number>;
  messagesByDay: { date: string; count: number }[];
}

interface ChatSession {
  id: string;
  createdAt: string | null;
  lastActiveAt: string | null;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string | null;
  stage: string | null;
  createdAt: string | null;
}

interface PromptData {
  ar: string;
  en: string;
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [behaviorStats, setBehaviorStats] = useState<BehaviorStats | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isViewingMessages, setIsViewingMessages] = useState(false);
  const [prompts, setPrompts] = useState<PromptData>({ ar: '', en: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRtl, setIsRtl] = useState(false);
  const { toast } = useToast();

  const labels = isRtl ? APP_CONSTANTS.ADMIN.AR : APP_CONSTANTS.ADMIN.EN;

  useEffect(() => {
    const savedLang = localStorage.getItem('opa_language');
    setIsRtl(savedLang === 'ar');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, promptsRes, feedbackRes, behaviorRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/prompts'),
        fetch('/api/admin/feedback-stats'),
        fetch('/api/admin/behavior-stats'),
        fetch('/api/admin/sessions?limit=20')
      ]);

      if (!statsRes.ok || !promptsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [statsData, promptsData] = await Promise.all([
        statsRes.json(),
        promptsRes.json()
      ]);

      setStats(statsData);
      setPrompts(promptsData);

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedbackStats(feedbackData);
      }

      if (behaviorRes.ok) {
        const behaviorData = await behaviorRes.json();
        setBehaviorStats(behaviorData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const viewSessionMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setSessionMessages(data.messages || []);
      setSelectedSession(sessionId);
      setIsViewingMessages(true);
    } catch (err) {
      toast({
        title: isRtl ? 'فشل في تحميل المحادثة' : 'Failed to load conversation',
        variant: 'destructive',
      });
    }
  };

  const downloadConversation = (sessionId: string) => {
    window.open(`/api/admin/sessions/${sessionId}/export`, '_blank');
  };

  const handleSavePrompt = async (language: 'ar' | 'en') => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          content: prompts[language]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save prompt');
      }

      toast({
        title: labels.saveSuccess,
        variant: 'default',
      });
    } catch (err) {
      console.error(`Failed to save ${language} prompt:`, err);
      toast({
        title: labels.saveError,
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="border-b py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">{labels.title}</h1>
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {isRtl ? 'العودة' : 'Back'}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className={`text-muted-foreground ${isRtl ? 'mr-3' : 'ml-3'}`}>{labels.loading}</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">{labels.error}</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-4">
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="analytics">
                <Activity className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {labels.analytics}
              </TabsTrigger>
              <TabsTrigger value="behavior">
                <BarChart3 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? 'السلوك' : 'Behavior'}
              </TabsTrigger>
              <TabsTrigger value="conversations">
                <Archive className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? 'المحادثات' : 'Conversations'}
              </TabsTrigger>
              <TabsTrigger value="prompt-lab">
                <Beaker className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {labels.promptLab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Unique Users */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {labels.uniqueUsers}
                      </CardTitle>
                      <Users className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">{stats.uniqueUsers}</div>
                    </CardContent>
                  </Card>

                  {/* Total Messages */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {labels.totalMessages}
                      </CardTitle>
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">{stats.totalMessages}</div>
                    </CardContent>
                  </Card>

                  {/* Active Users 24h */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {labels.activeUsers24h}
                      </CardTitle>
                      <Activity className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600">{stats.activeUsers24h}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Feedback Stats Section */}
              {feedbackStats && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    {isRtl ? 'إحصائيات الملاحظات' : 'Feedback Statistics'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Thumbs Up */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'إعجابات' : 'Thumbs Up'}
                        </CardTitle>
                        <ThumbsUp className="h-5 w-5 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-green-600">{feedbackStats.thumbsUp}</div>
                      </CardContent>
                    </Card>

                    {/* Thumbs Down */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'عدم إعجاب' : 'Thumbs Down'}
                        </CardTitle>
                        <ThumbsDown className="h-5 w-5 text-red-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-red-600">{feedbackStats.thumbsDown}</div>
                      </CardContent>
                    </Card>

                    {/* Average Rating */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'متوسط التقييم' : 'Avg Rating'}
                        </CardTitle>
                        <Star className="h-5 w-5 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-yellow-600">
                          {feedbackStats.avgRating.toFixed(1)}
                          <span className="text-lg text-muted-foreground">/5</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Session Feedback */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'إجمالي التقييمات' : 'Total Ratings'}
                        </CardTitle>
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{feedbackStats.totalSessionFeedback}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="behavior">
              {behaviorStats && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'متوسط الرسائل/جلسة' : 'Avg Messages/Session'}
                        </CardTitle>
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{behaviorStats.avgMessagesPerSession.toFixed(1)}</div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'معدل الإتمام' : 'Completion Rate'}
                        </CardTitle>
                        <Activity className="h-5 w-5 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-green-600">
                          {behaviorStats.completionRate.toFixed(0)}%
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {isRtl ? 'إجمالي الجلسات' : 'Total Sessions'}
                        </CardTitle>
                        <Users className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{sessions.length}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {Object.keys(behaviorStats.stageDropoffs).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{isRtl ? 'نقاط التوقف' : 'Stage Dropoffs'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(behaviorStats.stageDropoffs).map(([stage, count]) => (
                            <div key={stage} className="flex items-center justify-between">
                              <span className="font-medium capitalize">{stage}</span>
                              <span className="text-muted-foreground">{count} {isRtl ? 'مستخدم' : 'users'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              {!behaviorStats && (
                <div className="text-center text-muted-foreground py-8">
                  {isRtl ? 'لا توجد بيانات سلوكية بعد' : 'No behavior data yet'}
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversations">
              <Card>
                <CardHeader>
                  <CardTitle>{isRtl ? 'أرشيف المحادثات' : 'Conversation Archive'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {isRtl ? 'لا توجد محادثات بعد' : 'No conversations yet'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session, index) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                          data-testid={`row-session-${index}`}
                        >
                          <div>
                            <div className="font-mono text-sm" data-testid={`text-session-id-${index}`}>
                              {session.id.slice(0, 8)}...
                            </div>
                            <div className="text-xs text-muted-foreground" data-testid={`text-session-date-${index}`}>
                              {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => viewSessionMessages(session.id)}
                              data-testid={`button-view-session-${index}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => downloadConversation(session.id)}
                              data-testid={`button-download-session-${index}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt-lab" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Arabic Prompt */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{labels.arPrompt}</span>
                      <Button
                        size="sm"
                        onClick={() => handleSavePrompt('ar')}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        )}
                        {isSaving ? labels.saving : labels.save}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      dir="rtl"
                      className="min-h-[500px] font-mono text-xs leading-relaxed"
                      value={prompts.ar}
                      onChange={(e) => setPrompts(prev => ({ ...prev, ar: e.target.value }))}
                      placeholder="..."
                    />
                  </CardContent>
                </Card>

                {/* English Prompt */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{labels.enPrompt}</span>
                      <Button
                        size="sm"
                        onClick={() => handleSavePrompt('en')}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                        )}
                        {isSaving ? labels.saving : labels.save}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      dir="ltr"
                      className="min-h-[500px] font-mono text-xs leading-relaxed"
                      value={prompts.en}
                      onChange={(e) => setPrompts(prev => ({ ...prev, en: e.target.value }))}
                      placeholder="..."
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={isViewingMessages} onOpenChange={setIsViewingMessages}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {isRtl ? 'المحادثة' : 'Conversation'}: {selectedSession?.slice(0, 8)}...
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 p-4">
                {sessionMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-md ${
                      msg.role === 'user'
                        ? 'bg-muted'
                        : 'bg-primary/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {msg.role === 'user' ? (isRtl ? 'المستخدم' : 'User') : 'Sanad'}
                      </span>
                      {msg.stage && (
                        <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">
                          {msg.stage}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content || (isRtl ? '(فارغ)' : '(empty)')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
