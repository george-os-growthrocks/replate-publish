/**
 * Export Utilities
 * Functions to export data to CSV, JSON, and other formats
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: any[], filename?: string): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string = 'export.csv'): void {
  const csv = arrayToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Download JSON file
 */
export function downloadJSON(data: any, filename: string = 'export.json'): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Format date for filename
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Export GSC data (queries or pages) to CSV
 */
export function exportGSCData(
  data: any[],
  type: 'queries' | 'pages',
  dateRange?: { from: Date; to: Date }
): void {
  if (!data || data.length === 0) {
    return;
  }

  const dateStr = dateRange 
    ? `${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}`
    : formatDateForFilename();

  const filename = `gsc-${type}-${dateStr}.csv`;

  // Format data for CSV export
  const formattedData = data.map(item => ({
    [type === 'queries' ? 'Query' : 'Page']: type === 'queries' ? item.query : item.page,
    'Clicks': item.totalClicks || item.clicks || 0,
    'Impressions': item.totalImpressions || item.impressions || 0,
    'CTR': ((item.avgCtr || item.ctr || 0) * 100).toFixed(2) + '%',
    'Position': (item.avgPosition || item.position || 0).toFixed(1),
    ...(type === 'queries' ? { 'Keywords': item.queries?.length || 0 } : {}),
    ...(type === 'pages' ? { 'Pages': item.pages?.length || 0 } : {})
  }));

  downloadCSV(formattedData, filename);
}

/**
 * Export keyword data to CSV
 */
export function exportKeywordData(
  keywords: any[],
  filename: string = `keywords-${formatDateForFilename()}.csv`
): void {
  if (!keywords || keywords.length === 0) {
    return;
  }

  const formattedData = keywords.map(kw => ({
    'Keyword': kw.keyword || kw.query || '-',
    'Search Volume': kw.searchVolume || kw.search_volume || kw.keyword_info?.search_volume || 0,
    'CPC': kw.cpc || kw.keyword_info?.cpc || 0,
    'Competition': kw.competition || kw.keyword_info?.competition || 0,
    'Difficulty': kw.difficulty || kw.keyword_difficulty || kw.keyword_properties?.keyword_difficulty || 0,
    'Priority Score': kw.priorityScore || '-',
    'Potential Clicks': kw.potentialClicks || '-',
    'Time to Rank (months)': kw.estimatedTimeToRank || '-'
  }));

  downloadCSV(formattedData, filename);
}

/**
 * Export backlinks data to CSV
 */
export function exportBacklinksData(
  backlinks: any[],
  filename: string = `backlinks-${formatDateForFilename()}.csv`
): void {
  if (!backlinks || backlinks.length === 0) {
    return;
  }

  const formattedData = backlinks.map(bl => ({
    'Source Domain': bl.domain_from || '-',
    'Source URL': bl.url_from || '-',
    'Target URL': bl.url_to || '-',
    'Anchor Text': bl.anchor || '-',
    'Type': bl.dofollow ? 'Dofollow' : 'Nofollow',
    'Quality Score': bl.qualityScore || '-',
    'First Seen': bl.first_seen ? new Date(bl.first_seen).toLocaleDateString() : '-',
    'Last Seen': bl.last_seen ? new Date(bl.last_seen).toLocaleDateString() : '-'
  }));

  downloadCSV(formattedData, filename);
}

