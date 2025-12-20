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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Key, Check, Trash2, Bot } from 'lucide-react';
import type { AIProvider } from '@/lib/types';
import {
  getProvider,
  setProvider,
  getOpenAIKey,
  setOpenAIKey,
  removeOpenAIKey,
  getGeminiKey,
  setGeminiKey,
  removeGeminiKey,
  hasProviderKey,
} from '@/lib/ai-service';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRtl: boolean;
}

export function SettingsModal({ open, onOpenChange, isRtl }: SettingsModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [openaiKeyValue, setOpenaiKeyValue] = useState('');
  const [geminiKeyValue, setGeminiKeyValue] = useState('');
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedProvider(getProvider());
      setOpenaiKeyValue(getOpenAIKey() || '');
      setGeminiKeyValue(getGeminiKey() || '');
      setHasOpenAIKey(hasProviderKey('openai'));
      setHasGeminiKey(hasProviderKey('gemini'));
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    setProvider(selectedProvider);
    
    if (openaiKeyValue.trim()) {
      setOpenAIKey(openaiKeyValue.trim());
      setHasOpenAIKey(true);
    }
    if (geminiKeyValue.trim()) {
      setGeminiKey(geminiKeyValue.trim());
      setHasGeminiKey(true);
    }
    
    setSaved(true);
    setTimeout(() => {
      onOpenChange(false);
    }, 1000);
  };

  const handleRemoveOpenAI = () => {
    removeOpenAIKey();
    setOpenaiKeyValue('');
    setHasOpenAIKey(false);
    setSaved(false);
  };

  const handleRemoveGemini = () => {
    removeGeminiKey();
    setGeminiKeyValue('');
    setHasGeminiKey(false);
    setSaved(false);
  };

  const labels = isRtl
    ? {
        title: 'الإعدادات',
        description: 'اختر مزود الذكاء الاصطناعي وأدخل مفتاح API الخاص بك.',
        providerLabel: 'مزود الذكاء الاصطناعي',
        openaiLabel: 'مفتاح OpenAI API',
        geminiLabel: 'مفتاح Google Gemini API',
        openaiPlaceholder: 'sk-...',
        geminiPlaceholder: 'AIza...',
        save: 'حفظ',
        saved: 'تم الحفظ',
        remove: 'إزالة',
        securityNote: 'يتم تخزين مفاتيحك محليًا في هذا المتصفح فقط ولا يتم إرسالها إلى أي خادم آخر.',
        configured: 'تم تكوين المفتاح',
        openai: 'OpenAI (GPT-4)',
        gemini: 'Google Gemini',
      }
    : {
        title: 'Settings',
        description: 'Choose your AI provider and enter your API key.',
        providerLabel: 'AI Provider',
        openaiLabel: 'OpenAI API Key',
        geminiLabel: 'Google Gemini API Key',
        openaiPlaceholder: 'sk-...',
        geminiPlaceholder: 'AIza...',
        save: 'Save',
        saved: 'Saved!',
        remove: 'Remove',
        securityNote: 'Your keys are stored locally in this browser only and are never sent to any other server.',
        configured: 'Key configured',
        openai: 'OpenAI (GPT-4)',
        gemini: 'Google Gemini',
      };

  const currentKeyConfigured = selectedProvider === 'openai' ? hasOpenAIKey : hasGeminiKey;
  const currentKeyValue = selectedProvider === 'openai' ? openaiKeyValue : geminiKeyValue;

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
            <Label htmlFor="provider" className={isRtl ? 'text-right block' : ''}>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {labels.providerLabel}
              </div>
            </Label>
            <Select
              value={selectedProvider}
              onValueChange={(value: AIProvider) => setSelectedProvider(value)}
            >
              <SelectTrigger data-testid="select-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai" data-testid="option-openai">
                  {labels.openai}
                </SelectItem>
                <SelectItem value="gemini" data-testid="option-gemini">
                  {labels.gemini}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedProvider === 'openai' && (
            <div className="space-y-2">
              <Label htmlFor="openai-key" className={isRtl ? 'text-right block' : ''}>
                {labels.openaiLabel}
              </Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenAIKey ? 'text' : 'password'}
                  value={openaiKeyValue}
                  onChange={(e) => setOpenaiKeyValue(e.target.value)}
                  placeholder={labels.openaiPlaceholder}
                  className={`${isRtl ? 'text-right pe-10' : 'pe-10'}`}
                  dir="ltr"
                  data-testid="input-openai-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute top-0 ${isRtl ? 'start-0' : 'end-0'} h-full`}
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                  data-testid="button-toggle-openai-visibility"
                >
                  {showOpenAIKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {hasOpenAIKey && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    <span>{labels.configured}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveOpenAI}
                    className="text-destructive h-auto py-1"
                    data-testid="button-remove-openai"
                  >
                    <Trash2 className="h-3 w-3 me-1" />
                    {labels.remove}
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedProvider === 'gemini' && (
            <div className="space-y-2">
              <Label htmlFor="gemini-key" className={isRtl ? 'text-right block' : ''}>
                {labels.geminiLabel}
              </Label>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKeyValue}
                  onChange={(e) => setGeminiKeyValue(e.target.value)}
                  placeholder={labels.geminiPlaceholder}
                  className={`${isRtl ? 'text-right pe-10' : 'pe-10'}`}
                  dir="ltr"
                  data-testid="input-gemini-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute top-0 ${isRtl ? 'start-0' : 'end-0'} h-full`}
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  data-testid="button-toggle-gemini-visibility"
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {hasGeminiKey && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    <span>{labels.configured}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveGemini}
                    className="text-destructive h-auto py-1"
                    data-testid="button-remove-gemini"
                  >
                    <Trash2 className="h-3 w-3 me-1" />
                    {labels.remove}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            {labels.securityNote}
          </p>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={!currentKeyValue.trim() || saved}
            className="w-full sm:w-auto"
            data-testid="button-save-settings"
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
