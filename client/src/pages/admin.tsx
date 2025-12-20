import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, MessageSquare, Clock, Save, LogOut } from 'lucide-react';

interface Stats {
  uniqueUsers: number;
  totalMessages: number;
  activeUsers24h: number;
}

interface Prompts {
  ar: string;
  en: string;
}

export default function Admin() {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [arPrompt, setArPrompt] = useState('');
  const [enPrompt, setEnPrompt] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated,
  });

  const { data: prompts, isLoading: promptsLoading } = useQuery<Prompts>({
    queryKey: ['/api/admin/prompts'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (prompts) {
      setArPrompt(prompts.ar);
      setEnPrompt(prompts.en);
    }
  }, [prompts]);

  const updatePromptMutation = useMutation({
    mutationFn: async ({ language, content }: { language: string; content: string }) => {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ language, content }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update prompt');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompts'] });
      toast({ title: 'Success', description: 'Prompt updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: 'Unauthorized', description: 'Please log in to access admin panel', variant: 'destructive' });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="admin-loading">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
            <span className="text-sm text-muted-foreground" data-testid="text-admin-subtitle">Sanad Control Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground" data-testid="text-user-email">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-unique-users">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-unique-users-count">
                {statsLoading ? '...' : stats?.uniqueUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total unique sessions</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-messages">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-messages-count">
                {statsLoading ? '...' : stats?.totalMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground">All messages exchanged</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-users">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Active (24h)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-users-count">
                {statsLoading ? '...' : stats?.activeUsers24h || 0}
              </div>
              <p className="text-xs text-muted-foreground">Users in last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-prompt-editor">
          <CardHeader>
            <CardTitle>Sanad's Brain (System Prompt Editor)</CardTitle>
            <CardDescription>
              Edit the AI's behavior and personality. Changes take effect immediately for all new conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ar">
              <TabsList className="mb-4">
                <TabsTrigger value="ar" data-testid="tab-arabic">Arabic (العربية)</TabsTrigger>
                <TabsTrigger value="en" data-testid="tab-english">English</TabsTrigger>
              </TabsList>

              <TabsContent value="ar">
                <div className="space-y-4" dir="rtl">
                  <Textarea
                    value={arPrompt}
                    onChange={(e) => setArPrompt(e.target.value)}
                    placeholder="System prompt in Arabic..."
                    className="min-h-[400px] font-mono text-sm"
                    disabled={promptsLoading}
                    data-testid="textarea-arabic-prompt"
                  />
                  <Button
                    onClick={() => updatePromptMutation.mutate({ language: 'ar', content: arPrompt })}
                    disabled={updatePromptMutation.isPending}
                    data-testid="button-save-arabic"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updatePromptMutation.isPending ? 'Saving...' : 'Save Arabic Prompt'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="en">
                <div className="space-y-4">
                  <Textarea
                    value={enPrompt}
                    onChange={(e) => setEnPrompt(e.target.value)}
                    placeholder="System prompt in English..."
                    className="min-h-[400px] font-mono text-sm"
                    disabled={promptsLoading}
                    data-testid="textarea-english-prompt"
                  />
                  <Button
                    onClick={() => updatePromptMutation.mutate({ language: 'en', content: enPrompt })}
                    disabled={updatePromptMutation.isPending}
                    data-testid="button-save-english"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updatePromptMutation.isPending ? 'Saving...' : 'Save English Prompt'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
