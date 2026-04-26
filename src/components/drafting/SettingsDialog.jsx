import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

export default function SettingsDialog({
  isOpen,
  onClose,
  settingsForm,
  onFormChange,
  onSave,
  onClear,
  error,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px] grid gap-4 p-5 bg-[rgba(20,26,33,0.97)]">
        {/* Header */}
        <DialogHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <p className="text-[var(--color-secondary)] font-[var(--font-label)] text-[0.72rem] tracking-[0.12em] uppercase">
              Provider settings
            </p>
            <h2 className="text-[1.35rem] font-semibold text-[var(--color-on-surface)]">
              Gemini
            </h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Close settings"
          >
            <span className="text-lg leading-none">×</span>
          </Button>
        </DialogHeader>

        {/* Form fields */}
        <div className="grid gap-4">
          <div className="grid gap-[7px]">
            <Label className="text-[var(--color-outline)] font-[var(--font-label)] text-[0.72rem] tracking-[0.08em] uppercase">
              Provider
            </Label>
            <Input
              className="min-h-[52px] px-3.5 text-base"
              value="Gemini"
              disabled
            />
          </div>

          <div className="grid gap-[7px]">
            <Label className="text-[var(--color-outline)] font-[var(--font-label)] text-[0.72rem] tracking-[0.08em] uppercase">
              API key
            </Label>
            <Input
              className="min-h-[52px] px-3.5 text-base"
              type="password"
              value={settingsForm.apiKey}
              onChange={(event) =>
                onFormChange({ ...settingsForm, apiKey: event.target.value })
              }
              placeholder="AIza..."
            />
          </div>

          <div className="grid gap-[7px]">
            <Label className="text-[var(--color-outline)] font-[var(--font-label)] text-[0.72rem] tracking-[0.08em] uppercase">
              Model
            </Label>
            <Input
              className="min-h-[52px] px-3.5 text-base"
              value={settingsForm.model}
              onChange={(event) =>
                onFormChange({ ...settingsForm, model: event.target.value })
              }
              placeholder="gemini-2.5-flash"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-[var(--color-error)] text-[0.92rem]">{error}</p>
        )}

        {/* Footer */}
        <DialogFooter className="flex-row justify-end gap-2 max-[560px]:grid max-[560px]:gap-2">
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
