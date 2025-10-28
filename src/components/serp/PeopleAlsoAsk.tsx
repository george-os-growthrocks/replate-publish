import { Card } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { HelpCircle, ChevronDown } from "lucide-react";

interface PAAQuestion {
  question: string;
  answer: string;
  source?: string;
}

interface PeopleAlsoAskProps {
  questions: PAAQuestion[];
}

export function PeopleAlsoAsk({ questions }: PeopleAlsoAskProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">People also ask</h3>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {questions.map((paa, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border rounded-lg px-4 hover:bg-muted/50 transition-colors"
          >
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
              <div className="flex items-start gap-3 pr-2">
                <ChevronDown className="w-4 h-4 shrink-0 mt-0.5 transition-transform" />
                <span>{paa.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4 pl-7">
              <p className="leading-relaxed mb-2">{paa.answer}</p>
              {paa.source && (
                <a 
                  href={paa.source} 
                  className="text-xs text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more →
                </a>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
