import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Activity, Loader2, AlertCircle, ArrowLeft, Save, Beaker, ThumbsUp, ThumbsDown, Star, BarChart3, Archive, Download, Eye, BookOpen, Plus, Trash2, Edit, Layers } from 'lucide-react';
import { APP_CONSTANTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

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

interface VerifiedResource {
  id: string;
  type: string;
  name: string;
  nameAr: string | null;
  platform: string;
  field: string;
  fieldAr: string | null;
  level: string | null;
  language: string | null;
  cost: string | null;
  hasCertificate: string | null;
  description: string | null;
  descriptionAr: string | null;
  isActive: string | null;
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
  const [resources, setResources] = useState<VerifiedResource[]>([]);
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<VerifiedResource | null>(null);
  const [resourceForm, setResourceForm] = useState({
    type: 'course',
    name: '',
    nameAr: '',
    platform: '',
    field: 'technology',
    fieldAr: '',
    level: 'beginner',
    language: 'en',
    cost: 'free',
    hasCertificate: 'no',
    description: '',
    descriptionAr: '',
    isActive: 'yes'
  });
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

      const [statsRes, promptsRes, feedbackRes, behaviorRes, sessionsRes, resourcesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/prompts'),
        fetch('/api/admin/feedback-stats'),
        fetch('/api/admin/behavior-stats'),
        fetch('/api/admin/sessions?limit=20'),
        fetch('/api/admin/resources')
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

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setResources(resourcesData.resources || []);
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

  const openResourceDialog = (resource?: VerifiedResource) => {
    if (resource) {
      setEditingResource(resource);
      setResourceForm({
        type: resource.type,
        name: resource.name,
        nameAr: resource.nameAr || '',
        platform: resource.platform,
        field: resource.field,
        fieldAr: resource.fieldAr || '',
        level: resource.level || 'beginner',
        language: resource.language || 'en',
        cost: resource.cost || 'free',
        hasCertificate: resource.hasCertificate || 'no',
        description: resource.description || '',
        descriptionAr: resource.descriptionAr || '',
        isActive: resource.isActive || 'yes'
      });
    } else {
      setEditingResource(null);
      setResourceForm({
        type: 'course',
        name: '',
        nameAr: '',
        platform: '',
        field: 'technology',
        fieldAr: '',
        level: 'beginner',
        language: 'en',
        cost: 'free',
        hasCertificate: 'no',
        description: '',
        descriptionAr: '',
        isActive: 'yes'
      });
    }
    setIsResourceDialogOpen(true);
  };

  const handleSaveResource = async () => {
    try {
      setIsSaving(true);
      const url = editingResource 
        ? `/api/admin/resources/${editingResource.id}` 
        : '/api/admin/resources';
      const method = editingResource ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceForm)
      });

      if (!response.ok) throw new Error('Failed to save resource');

      toast({
        title: isRtl ? 'تم الحفظ بنجاح' : 'Saved successfully',
      });
      
      setIsResourceDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({
        title: isRtl ? 'فشل في الحفظ' : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    
    try {
      const response = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      toast({ title: isRtl ? 'تم الحذف' : 'Deleted successfully' });
      fetchData();
    } catch (err) {
      toast({
        title: isRtl ? 'فشل في الحذف' : 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const handleSeedResources = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/seed-resources', { method: 'POST' });
      const data = await response.json();
      
      toast({ title: data.message });
      fetchData();
    } catch (err) {
      toast({
        title: isRtl ? 'فشل في إضافة البيانات' : 'Failed to seed resources',
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
            <TabsList className="grid w-full grid-cols-5 mb-8">
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
              <TabsTrigger value="resources">
                <BookOpen className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? 'المصادر' : 'Resources'}
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

            <TabsContent value="resources">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                  <CardTitle>{isRtl ? 'المصادر التعليمية والمجتمعات' : 'Educational Resources & Communities'}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeedResources} disabled={isSaving}>
                      <Layers className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                      {isRtl ? 'إضافة بيانات أولية' : 'Seed Data'}
                    </Button>
                    <Button onClick={() => openResourceDialog()}>
                      <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                      {isRtl ? 'إضافة مصدر' : 'Add Resource'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {resources.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {isRtl ? 'لا توجد مصادر بعد. اضغط على "إضافة بيانات أولية" للبدء.' : 'No resources yet. Click "Seed Data" to start.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{isRtl ? 'الدورات' : 'Courses'}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <span className="text-2xl font-bold">{resources.filter(r => r.type === 'course').length}</span>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{isRtl ? 'المجتمعات' : 'Communities'}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <span className="text-2xl font-bold">{resources.filter(r => r.type === 'community').length}</span>
                          </CardContent>
                        </Card>
                      </div>

                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {resources.map((resource, index) => (
                            <div
                              key={resource.id}
                              className="flex items-center justify-between p-3 border rounded-md"
                              data-testid={`row-resource-${index}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium" data-testid={`text-resource-name-${index}`}>
                                    {isRtl && resource.nameAr ? resource.nameAr : resource.name}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${resource.type === 'course' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                    {resource.type === 'course' ? (isRtl ? 'دورة' : 'Course') : (isRtl ? 'مجتمع' : 'Community')}
                                  </span>
                                  {resource.isActive !== 'yes' && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                      {isRtl ? 'غير نشط' : 'Inactive'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {resource.platform} | {isRtl && resource.fieldAr ? resource.fieldAr : resource.field}
                                  {resource.level && ` | ${resource.level}`}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openResourceDialog(resource)}
                                  data-testid={`button-edit-resource-${index}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteResource(resource.id)}
                                  data-testid={`button-delete-resource-${index}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
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

        <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingResource 
                  ? (isRtl ? 'تعديل مصدر' : 'Edit Resource') 
                  : (isRtl ? 'إضافة مصدر جديد' : 'Add New Resource')}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? 'النوع' : 'Type'}</Label>
                  <Select value={resourceForm.type} onValueChange={(v) => setResourceForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">{isRtl ? 'دورة' : 'Course'}</SelectItem>
                      <SelectItem value="community">{isRtl ? 'مجتمع' : 'Community'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'المجال' : 'Field'}</Label>
                  <Select value={resourceForm.field} onValueChange={(v) => setResourceForm(f => ({ ...f, field: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">{isRtl ? 'التقنية' : 'Technology'}</SelectItem>
                      <SelectItem value="data_analytics">{isRtl ? 'تحليل البيانات' : 'Data Analytics'}</SelectItem>
                      <SelectItem value="marketing">{isRtl ? 'التسويق' : 'Marketing'}</SelectItem>
                      <SelectItem value="management">{isRtl ? 'الإدارة' : 'Management'}</SelectItem>
                      <SelectItem value="finance">{isRtl ? 'المالية' : 'Finance'}</SelectItem>
                      <SelectItem value="health">{isRtl ? 'الصحة' : 'Health'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input 
                    value={resourceForm.name} 
                    onChange={(e) => setResourceForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Google Data Analytics Certificate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input 
                    dir="rtl"
                    value={resourceForm.nameAr} 
                    onChange={(e) => setResourceForm(f => ({ ...f, nameAr: e.target.value }))}
                    placeholder="مثال: شهادة تحليل البيانات من جوجل"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? 'المنصة' : 'Platform'}</Label>
                  <Input 
                    value={resourceForm.platform} 
                    onChange={(e) => setResourceForm(f => ({ ...f, platform: e.target.value }))}
                    placeholder="e.g., Coursera, LinkedIn, Telegram"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'المستوى' : 'Level'}</Label>
                  <Select value={resourceForm.level} onValueChange={(v) => setResourceForm(f => ({ ...f, level: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{isRtl ? 'مبتدئ' : 'Beginner'}</SelectItem>
                      <SelectItem value="intermediate">{isRtl ? 'متوسط' : 'Intermediate'}</SelectItem>
                      <SelectItem value="advanced">{isRtl ? 'متقدم' : 'Advanced'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? 'اللغة' : 'Language'}</Label>
                  <Select value={resourceForm.language} onValueChange={(v) => setResourceForm(f => ({ ...f, language: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{isRtl ? 'عربي' : 'Arabic'}</SelectItem>
                      <SelectItem value="en">{isRtl ? 'إنجليزي' : 'English'}</SelectItem>
                      <SelectItem value="both">{isRtl ? 'كلاهما' : 'Both'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'التكلفة' : 'Cost'}</Label>
                  <Select value={resourceForm.cost} onValueChange={(v) => setResourceForm(f => ({ ...f, cost: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">{isRtl ? 'مجاني' : 'Free'}</SelectItem>
                      <SelectItem value="paid">{isRtl ? 'مدفوع' : 'Paid'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'شهادة' : 'Certificate'}</Label>
                  <Select value={resourceForm.hasCertificate} onValueChange={(v) => setResourceForm(f => ({ ...f, hasCertificate: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">{isRtl ? 'نعم' : 'Yes'}</SelectItem>
                      <SelectItem value="no">{isRtl ? 'لا' : 'No'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRtl ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                <Textarea 
                  value={resourceForm.description} 
                  onChange={(e) => setResourceForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the resource"
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRtl ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Textarea 
                  dir="rtl"
                  value={resourceForm.descriptionAr} 
                  onChange={(e) => setResourceForm(f => ({ ...f, descriptionAr: e.target.value }))}
                  placeholder="وصف موجز للمصدر"
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRtl ? 'الحالة' : 'Status'}</Label>
                <Select value={resourceForm.isActive} onValueChange={(v) => setResourceForm(f => ({ ...f, isActive: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{isRtl ? 'نشط' : 'Active'}</SelectItem>
                    <SelectItem value="no">{isRtl ? 'غير نشط' : 'Inactive'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResourceDialogOpen(false)}>
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSaveResource} disabled={isSaving || !resourceForm.name || !resourceForm.platform}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
                {isRtl ? 'حفظ' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
