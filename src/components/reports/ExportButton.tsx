import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File, Loader2 } from "lucide-react";
import { generatePDFReport, exportElementAsPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface ExportButtonProps {
  data: unknown[];
  filename: string;
  reportTitle?: string;
  elementId?: string;
}

export function ExportButton({ data, filename, reportTitle, elementId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = () => {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("No data to export");
        return;
      }

      const headers = Object.keys(data[0] as object);
      const rows = data.map(item => 
        headers.map(header => {
          const value = (item as Record<string, unknown>)[header];
          return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
        })
      );

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      
      toast.success("CSV exported successfully!");
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error("Failed to export CSV");
    }
  };

  const exportJSON = () => {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      
      toast.success("JSON exported successfully!");
    } catch (error) {
      console.error('JSON export error:', error);
      toast.error("Failed to export JSON");
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      if (elementId) {
        // Export specific element
        await exportElementAsPDF(elementId, `${filename}.pdf`);
      } else if (reportTitle) {
        // Generate PDF report from data
        await generatePDFReport({
          title: reportTitle,
          date: new Date().toLocaleDateString(),
          sections: [
            {
              title: 'Data Overview',
              content: `Total records: ${data.length}`,
              data: data.slice(0, 50) as Record<string, unknown>[], // First 50 rows
            },
          ],
        });
      }
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF. Install: npm install jspdf html2canvas");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> Export</>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <File className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          <FileText className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
