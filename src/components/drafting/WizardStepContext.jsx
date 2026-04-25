import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../ui/select';

const matterTypes = ['Civil', 'Criminal', 'Constitutional', 'Commercial', 'Advisory'];
const urgencyLevels = ['Standard', 'Due this week', 'Urgent filing', 'Review only'];

export default function WizardStepContext({
  setupTitle,
  onTitleChange,
  matterType,
  onMatterTypeChange,
  urgency,
  onUrgencyChange,
  templateName,
}) {
  return (
    <div className="drafting-wizard-panel">
      {/* Step header */}
      <div className="drafting-wizard-panel__head">
        <p>
          Step 2 of 3
        </p>
        <h2>
          Save the matter context
        </h2>
        <span>
          Name the work and tag the matter so it is easy to reopen later.
        </span>
      </div>

      {/* Form */}
      <div className="drafting-context-form">
        {/* Draft name */}
        <div className="drafting-field">
          <Label>
            Draft name
          </Label>
          <Input
            value={setupTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={templateName}
            className="drafting-control"
          />
        </div>

        {/* Matter type */}
        <div className="drafting-field">
          <Label>
            Matter type
          </Label>
          <Select value={matterType} onValueChange={onMatterTypeChange}>
            <SelectTrigger className="drafting-control">
              <SelectValue placeholder="Select matter type" />
              <SelectContent>
                {matterTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectTrigger>
          </Select>
        </div>

        {/* Priority */}
        <div className="drafting-field">
          <Label>
            Priority
          </Label>
          <Select value={urgency} onValueChange={onUrgencyChange}>
            <SelectTrigger className="drafting-control">
              <SelectValue placeholder="Select priority" />
              <SelectContent>
                {urgencyLevels.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectTrigger>
          </Select>
        </div>
      </div>
    </div>
  );
}
