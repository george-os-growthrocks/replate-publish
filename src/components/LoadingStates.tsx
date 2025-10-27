import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Loading state for stats cards
 */
export function StatsCardsLoading({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${Math.min(count, 4)} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading state for table
 */
export function TableLoading({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {[...Array(columns)].map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(rows)].map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {[...Array(columns)].map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/**
 * Loading state for cards/content blocks
 */
export function CardsLoading({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading state for chart/graph
 */
export function ChartLoading({ height = '300px' }: { height?: string }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="w-full" style={{ height }} />
    </Card>
  );
}

/**
 * Loading state for page header
 */
export function PageHeaderLoading() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderLoading />
      <StatsCardsLoading count={4} />
      <TableLoading rows={10} columns={6} />
    </div>
  );
}

/**
 * Minimal loading spinner
 */
export function SpinnerLoading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

