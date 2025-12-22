import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Activity, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { APP_CONSTANTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface AdminStats {
  uniqueUsers: number;
  totalMessages: number;
  activeUsers24h: number;
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRtl, setIsRtl] = useState(false);

  const labels = isRtl ? APP_CONSTANTS.ADMIN.AR : APP_CONSTANTS.ADMIN.EN;

  useEffect(() => {
    // Check language from localStorage
    const savedLang = localStorage.getItem('opa_language');
    setIsRtl(savedLang === 'ar');

    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
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
            <span className="ml-3 text-muted-foreground">{labels.loading}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">{labels.error}</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button variant="outline" onClick={fetchStats} className="mt-4">
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        )}

        {stats && !isLoading && !error && (
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
      </main>
    </div>
  );
}
