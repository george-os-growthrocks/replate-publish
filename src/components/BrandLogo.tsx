import { Link } from "react-router-dom";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ size = "md", showText = true, className = "" }: BrandLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <Link to="/" className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}>
      {/* Logo Icon - PNG */}
      <img 
        src="/logo-icon.png" 
        alt="AnotherSEOGuru Logo" 
        className={`${sizeClasses[size]} flex-shrink-0 object-contain`}
      />
      
      {/* Brand Wordmark */}
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
          AnotherSEOGuru
        </span>
      )}
    </Link>
  );
}

// Alternative: Simple Icon-only version for use without Link
export function BrandIcon({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  return (
    <img 
      src="/logo-icon.png" 
      alt="AnotherSEOGuru" 
      className={`${sizeClasses[size]} flex-shrink-0 object-contain ${className}`}
    />
  );
}

