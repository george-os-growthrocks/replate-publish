import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ExternalLink } from "lucide-react";

interface RelatedLink {
  title: string;
  href: string;
  description?: string;
  type: "tool" | "blog" | "help" | "external";
}

interface RelatedLinksSectionProps {
  links: RelatedLink[];
  title?: string;
  description?: string;
}

export function RelatedLinksSection({ 
  links, 
  title = "Related Resources",
  description = "Explore related content to dive deeper"
}: RelatedLinksSectionProps) {
  const getIcon = (type: RelatedLink["type"]) => {
    switch (type) {
      case "tool":
        return "🔧";
      case "blog":
        return "📝";
      case "help":
        return "❓";
      case "external":
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  return (
    <section className="py-12 border-t border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              target={link.type === "external" ? "_blank" : undefined}
              rel={link.type === "external" ? "noopener noreferrer" : undefined}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span>{typeof getIcon(link.type) === "string" ? getIcon(link.type) : ""}</span>
                    <span className="group-hover:text-primary transition-colors">
                      {link.title}
                    </span>
                    {link.type === "external" && (
                      <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
                    )}
                  </CardTitle>
                </CardHeader>
                {link.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                      {link.type === "external" ? "Visit" : "Read more"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

