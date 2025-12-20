import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Moon, Sun, Languages, Compass } from 'lucide-react';
import { SettingsModal } from './settings-modal';
import { useTheme } from './theme-provider';
import { hasApiKey } from '@/lib/ai-service';

interface HeaderProps {
  isRtl: boolean;
  onToggleLanguage: () => void;
}

export function Header({ isRtl, onToggleLanguage }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const hasKey = hasApiKey();

  const labels = isRtl
    ? { title: 'مسبار', subtitle: 'اكتشاف المهنة' }
    : { title: 'Misbar', subtitle: 'Career Discovery' };

  return (
    <>
      <header 
        className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm md:text-base leading-tight" data-testid="text-app-title">
                {labels.title}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {labels.subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLanguage}
              title={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
              data-testid="button-toggle-language"
            >
              <Languages className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              data-testid="button-toggle-theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="relative"
              title={isRtl ? 'الإعدادات' : 'Settings'}
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
              {hasKey && (
                <span className="absolute -top-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <SettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        isRtl={isRtl}
      />
    </>
  );
}
