import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key, Check, Trash2 } from 'lucide-react';
import { getApiKey, setApiKey, removeApiKey, hasApiKey } from '@/lib/openai';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRtl: boolean;
}

export function SettingsModal({ open, onOpenChange, isRtl }: SettingsModalProps) {
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (open) {
      const existingKey = getApiKey();
      setApiKeyValue(existingKey || '');
      setHasKey(hasApiKey());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    if (apiKeyValue.trim()) {
      setApiKey(apiKeyValue.trim());
      setHasKey(true);
      setSaved(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    }
  };

  const handleRemove = () => {
    removeApiKey();
    setApiKeyValue('');
    setHasKey(false);
    setSaved(false);
  };

  const labels = isRtl
    ? {
        title: 'الإعدادات',
        description: 'أدخل مفتاح OpenAI API الخاص بك. يتم تخزينه بشكل آمن في متصفحك فقط.',
        apiKeyLabel: 'مفتاح API',
        placeholder: 'sk-...',
        save: 'حفظ',
        saved: 'تم الحفظ',
        remove: 'إزالة',
        securityNote: 'يتم تخزين مفتاحك محليًا في هذا المتصفح فقط ولا يتم إرساله إلى أي خادم آخر.',
      }
    : {
        title: 'Settings',
        description: 'Enter your OpenAI API key. It is stored securely in your browser only.',
        apiKeyLabel: 'API Key',
        placeholder: 'sk-...',
        save: 'Save',
        saved: 'Saved!',
        remove: 'Remove',
        securityNote: 'Your key is stored locally in this browser only and is never sent to any other server.',
      };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md" 
        dir={isRtl ? 'rtl' : 'ltr'}
        data-testid="settings-modal"
      >
        <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {labels.title}
          </DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {labels.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className={isRtl ? 'text-right block' : ''}>
              {labels.apiKeyLabel}
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder={labels.placeholder}
                className={`${isRtl ? 'text-right pe-10' : 'pe-10'}`}
                dir="ltr"
                data-testid="input-api-key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute top-0 ${isRtl ? 'start-0' : 'end-0'} h-full`}
                onClick={() => setShowKey(!showKey)}
                data-testid="button-toggle-key-visibility"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {labels.securityNote}
          </p>
          
          {hasKey && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>{isRtl ? 'تم تكوين مفتاح API' : 'API key configured'}</span>
            </div>
          )}
        </div>

        <DialogFooter className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
          {hasKey && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className="text-destructive"
              data-testid="button-remove-key"
            >
              <Trash2 className="h-4 w-4 me-2" />
              {labels.remove}
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!apiKeyValue.trim() || saved}
            className="flex-1 sm:flex-none"
            data-testid="button-save-api-key"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 me-2" />
                {labels.saved}
              </>
            ) : (
              labels.save
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
