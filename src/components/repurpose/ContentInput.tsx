import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContentInput({ value, onChange }: ContentInputProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Your Content</label>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {wordCount} words
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {charCount} characters
          </Badge>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type your content here... (minimum 100 characters)"
        className="min-h-[300px] resize-y font-mono text-sm"
      />
      {charCount > 0 && charCount < 100 && (
        <p className="text-xs text-destructive">
          Please enter at least 100 characters (currently {charCount})
        </p>
      )}
    </div>
  );
}

