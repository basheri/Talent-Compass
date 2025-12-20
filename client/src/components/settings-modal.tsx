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
import { Key, ExternalLink } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRtl: boolean;
  onApiKeySet: (key: string) => void;
}

export function SettingsModal({ isOpen, onClose, isRtl, onApiKeySet }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
      setApiKey(storedKey);
      setError('');
    }
  }, [isOpen]);

  const labels = isRtl
    ? {
        title: 'إعدادات مفتاح API',
        description: 'أدخل مفتاح Google Gemini API الخاص بك للبدء. المفتاح يُحفظ محلياً في متصفحك فقط.',
        keyLabel: 'مفتاح Gemini API',
        keyPlaceholder: 'AIza...',
        getKey: 'احصل على مفتاح API',
        save: 'حفظ',
        cancel: 'إلغاء',
        required: 'مفتاح API مطلوب',
      }
    : {
        title: 'API Key Settings',
        description: 'Enter your Google Gemini API key to start. The key is stored locally in your browser only.',
        keyLabel: 'Gemini API Key',
        keyPlaceholder: 'AIza...',
        getKey: 'Get API Key',
        save: 'Save',
        cancel: 'Cancel',
        required: 'API key is required',
      };

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError(labels.required);
      return;
    }
    
    localStorage.setItem(STORAGE_KEYS.API_KEY, trimmedKey);
    onApiKeySet(trimmedKey);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {labels.title}
          </DialogTitle>
          <DialogDescription>
            {labels.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">{labels.keyLabel}</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder={labels.keyPlaceholder}
              className={isRtl ? 'text-right' : ''}
              data-testid="input-api-key"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            data-testid="link-get-api-key"
          >
            <ExternalLink className="h-4 w-4" />
            {labels.getKey}
          </a>
        </div>

        <DialogFooter className={`gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            {labels.cancel}
          </Button>
          <Button onClick={handleSave} data-testid="button-save-api-key">
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
