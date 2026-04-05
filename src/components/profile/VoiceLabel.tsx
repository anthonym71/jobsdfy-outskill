import { Label } from "@/components/ui/label";
import VoiceFieldInput from "./VoiceFieldInput";

interface VoiceLabelProps {
  children: React.ReactNode;
  onVoiceResult: (text: string) => void;
  options?: string[];
  htmlFor?: string;
  className?: string;
}

/** Label with a mic icon inline for voice dictation */
const VoiceLabel = ({ children, onVoiceResult, options, htmlFor, className }: VoiceLabelProps) => (
  <div className="flex items-center gap-1">
    <Label htmlFor={htmlFor} className={className}>{children}</Label>
    <VoiceFieldInput
      onResult={onVoiceResult}
      options={options}
      label={typeof children === "string" ? children : undefined}
    />
  </div>
);

export default VoiceLabel;
