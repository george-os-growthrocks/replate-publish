import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { CheckCircle2, Lightbulb, BookOpen, ArrowRight } from "lucide-react";

interface ToolSEOSectionProps {
  toolName: string;
  category: string;
  description: string;
  useCases?: string[];
  benefits?: string[];
  relatedTools?: Array<{
    name: string;
    href: string;
    description: string;
  }>;
}

export function ToolSEOSection({
  toolName,
  category,
  description,
  useCases = [],
  benefits = [],
  relatedTools = [],
}: ToolSEOSectionProps) {
  return (
    <section className="py-12 space-y-8">
      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            How to Use {toolName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
            <li>Enter your data or content in the input fields above</li>
            <li>Click the generate or analyze button to process your request</li>
            <li>Review the results and export or copy as needed</li>
            <li>Use the output to improve your SEO performance</li>
          </ol>
          {useCases.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Common Use Cases
              </h4>
              <ul className="space-y-2">
                {useCases.map((useCase, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success mt-1 flex-shrink-0" />
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits */}
      {benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Why Use {toolName}?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Related Free SEO Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedTools.map((tool, idx) => (
                <Link
                  key={idx}
                  to={tool.href}
                  className="group flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {tool.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Ready to Supercharge Your SEO?
            </h3>
            <p className="text-muted-foreground mb-4">
              Unlock unlimited usage, advanced features, and AI-powered content generation
            </p>
            <Link to="/auth">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm cursor-pointer">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

