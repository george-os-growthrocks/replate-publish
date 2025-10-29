import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Copy, X } from "lucide-react";
import { toast } from "sonner";

export interface DebugLog {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
}

interface FeatureDebugPanelProps {
  logs: DebugLog[];
  onClear?: () => void;
  featureName?: string;
  className?: string;
}

export function FeatureDebugPanel({
  logs,
  onClear,
  featureName = "Feature",
  className = ""
}: FeatureDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLogs = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    toast.success('Debug logs copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={`fixed bottom-4 right-4 z-50 ${className}`}
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug {logs.length > 0 && `(${logs.length})`}
      </Button>
    );
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 text-red-400 border-l-4 border-red-500';
      case 'warn':
        return 'bg-yellow-500/10 text-yellow-400 border-l-4 border-yellow-500';
      case 'success':
        return 'bg-green-500/10 text-green-400 border-l-4 border-green-500';
      default:
        return 'bg-slate-900 text-slate-300 border-l-4 border-slate-700';
    }
  };

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-[600px] max-h-[80vh] overflow-hidden flex flex-col shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="w-5 h-5" />
            {featureName} Debug Panel
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={copyLogs} variant="ghost" size="sm" disabled={logs.length === 0}>
              <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : ''}`} />
            </Button>
            <Button onClick={() => {
              setIsOpen(false);
              onClear?.();
            }} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No debug logs yet.</p>
            <p className="text-xs mt-2">Logs will appear here as operations run.</p>
          </div>
        ) : (
          <div className="space-y-1 font-mono text-xs">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded ${getLogColor(log.level)}`}
              >
                <span className="text-muted-foreground">[{log.timestamp}]</span>{' '}
                <span className="font-semibold uppercase text-[10px]">[{log.level}]</span>{' '}
                {log.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
