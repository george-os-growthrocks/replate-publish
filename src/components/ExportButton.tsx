import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadCSV, downloadJSON, copyToClipboard } from '@/lib/export-utils';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({ 
  data, 
  filename = 'export', 
  disabled = false,
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      downloadCSV(data, `${filename}.csv`);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('CSV export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      downloadJSON(data, `${filename}.json`);
      toast.success('JSON exported successfully!');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error('JSON export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyJSON = async () => {
    setIsExporting(true);
    try {
      const json = JSON.stringify(data, null, 2);
      const success = await copyToClipboard(json);
      if (success) {
        toast.success('JSON copied to clipboard!');
      } else {
        toast.error('Failed to copy to clipboard');
      }
    } catch (error) {
      toast.error('Failed to copy JSON');
      console.error('Copy JSON error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (disabled || !data || data.length === 0) {
    return (
      <Button variant={variant} size={size} disabled>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Copy JSON</span>
        </DropdownMenuItem>
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {data.length} {data.length === 1 ? 'item' : 'items'}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

