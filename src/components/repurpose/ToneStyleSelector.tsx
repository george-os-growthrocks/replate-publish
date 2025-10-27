import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Smile, Briefcase, Heart, Zap, BookOpen } from "lucide-react";

const tones = [
  { id: 'professional', label: 'Professional', icon: Briefcase, description: 'Formal and authoritative' },
  { id: 'casual', label: 'Casual', icon: Smile, description: 'Friendly and approachable' },
  { id: 'enthusiastic', label: 'Enthusiastic', icon: Zap, description: 'Energetic and exciting' },
  { id: 'empathetic', label: 'Empathetic', icon: Heart, description: 'Understanding and supportive' },
  { id: 'informative', label: 'Informative', icon: BookOpen, description: 'Educational and clear' },
  { id: 'creative', label: 'Creative', icon: Sparkles, description: 'Imaginative and unique' },
];

const styles = [
  { id: 'narrative', label: 'Narrative', description: 'Story-driven approach' },
  { id: 'listicle', label: 'Listicle', description: 'Numbered or bulleted list' },
  { id: 'how-to', label: 'How-To', description: 'Step-by-step guide' },
  { id: 'question-answer', label: 'Q&A', description: 'Question and answer format' },
  { id: 'comparison', label: 'Comparison', description: 'Compare and contrast' },
  { id: 'case-study', label: 'Case Study', description: 'Real-world example' },
];

interface ToneStyleSelectorProps {
  tone: string;
  style: string;
  onToneChange: (tone: string) => void;
  onStyleChange: (style: string) => void;
}

export function ToneStyleSelector({ tone, style, onToneChange, onStyleChange }: ToneStyleSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Tone Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Content Tone</h3>
        <RadioGroup value={tone} onValueChange={onToneChange}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tones.map((toneOption) => {
              const Icon = toneOption.icon;
              const isSelected = tone === toneOption.id;
              
              return (
                <Card
                  key={toneOption.id}
                  className={`
                    relative p-4 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }
                  `}
                  onClick={() => onToneChange(toneOption.id)}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={toneOption.id} id={`tone-${toneOption.id}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <Label
                          htmlFor={`tone-${toneOption.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {toneOption.label}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {toneOption.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Content Style</h3>
        <RadioGroup value={style} onValueChange={onStyleChange}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {styles.map((styleOption) => {
              const isSelected = style === styleOption.id;
              
              return (
                <Card
                  key={styleOption.id}
                  className={`
                    relative p-4 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                    }
                  `}
                  onClick={() => onStyleChange(styleOption.id)}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={styleOption.id} id={`style-${styleOption.id}`} />
                    <div className="flex-1">
                      <Label
                        htmlFor={`style-${styleOption.id}`}
                        className="font-medium cursor-pointer block mb-1"
                      >
                        {styleOption.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {styleOption.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

