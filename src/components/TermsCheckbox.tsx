import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function TermsCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-start gap-3">
    <Checkbox id="terms-acceptance" checked={checked} onCheckedChange={value => onChange(value === true)} />
    <Label htmlFor="terms-acceptance" className="text-sm leading-5">I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms &amp; Conditions</Link></Label>
  </div>;
}