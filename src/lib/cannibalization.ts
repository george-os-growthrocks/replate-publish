import { GscRow, CannibalCluster, QueryToPages, PageToQueries } from "@/types/gsc";

/**
 * Find cannibalization clusters - queries ranking on multiple pages
 */
export function findCannibalClusters(
  rows: GscRow[],
  options = { minPages: 2, minImpressions: 50 }
): CannibalCluster[] {
  const map = new Map<string, Array<GscRow>>();
  
  rows.forEach((r) => {
    if (!r.query || !r.page) return;
    const key = r.query.toLowerCase().trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  const clusters: CannibalCluster[] = [];

  for (const [query, list] of map) {
    const pagesMap = new Map<
      string,
      { clicks: number; impressions: number; positions: number[]; count: number }
    >();

    list.forEach((r) => {
      const p = pagesMap.get(r.page!) ?? {
        clicks: 0,
        impressions: 0,
        positions: [],
        count: 0,
      };
      p.clicks += r.clicks;
      p.impressions += r.impressions;
      p.positions.push(r.position);
      p.count++;
      pagesMap.set(r.page!, p);
    });

    const pages = [...pagesMap.entries()].map(([page, m]) => ({
      page,
      clicks: m.clicks,
      impressions: m.impressions,
      position: m.positions.reduce((a, b) => a + b, 0) / m.positions.length,
      ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
      score: 0,
    }));

    // Filter out low-quality clusters
    const totalImpressions = pages.reduce((sum, p) => sum + p.impressions, 0);
    if (pages.length < options.minPages || totalImpressions < options.minImpressions) {
      continue;
    }

    // Normalize and score
    const maxI = Math.max(...pages.map((p) => p.impressions)) || 1;
    const maxC = Math.max(...pages.map((p) => p.clicks)) || 1;
    const minP = Math.min(...pages.map((p) => p.position)) || 1;

    const scored = pages.map((p) => ({
      ...p,
      score:
        0.5 * (p.impressions / maxI) +
        0.7 * (p.clicks / maxC) +
        0.6 * (minP / (p.position || 1)), // Lower position = better = higher score
    }));

    scored.sort((a, b) => b.score - a.score);

    const primaryCandidate = scored[0].page;
    const otherPages = scored.slice(1).map((p) => p.page);

    clusters.push({
      query,
      pages: scored,
      primaryCandidate,
      rationale: `${otherPages.length} page(s) competing. Primary has ${scored[0].clicks} clicks, pos ${scored[0].position.toFixed(1)}`,
      totalImpressions,
      pageCount: pages.length,
    });
  }

  // Sort by total impressions (most impactful first)
  return clusters.sort((a, b) => b.totalImpressions - a.totalImpressions);
}

/**
 * Group rows by query to show which pages rank for each query
 */
export function groupByQuery(rows: GscRow[]): QueryToPages[] {
  const map = new Map<string, GscRow[]>();

  rows.forEach((r) => {
    if (!r.query) return;
    const key = r.query.toLowerCase().trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  return [...map.entries()]
    .map(([query, list]) => {
      const pagesMap = new Map<
        string,
        { clicks: number; impressions: number; positions: number[] }
      >();

      // Get the first row's change data (all rows for same query should have same changes)
      const firstRow = list[0];
      const positionChange = firstRow.positionChange ?? null;
      const clicksChange = firstRow.clicksChange ?? null;
      const impressionsChange = firstRow.impressionsChange ?? null;
      const ctrChange = firstRow.ctrChange ?? null;
      const positionChangePercent = firstRow.positionChangePercent ?? null;
      const clicksChangePercent = firstRow.clicksChangePercent ?? null;
      const impressionsChangePercent = firstRow.impressionsChangePercent ?? null;
      const ctrChangePercent = firstRow.ctrChangePercent ?? null;

      list.forEach((r) => {
        if (!r.page) return;
        const p = pagesMap.get(r.page) ?? {
          clicks: 0,
          impressions: 0,
          positions: [],
        };
        p.clicks += r.clicks;
        p.impressions += r.impressions;
        p.positions.push(r.position);
        pagesMap.set(r.page, p);
      });

      const pages = [...pagesMap.entries()]
        .map(([page, m]) => ({
          page,
          clicks: m.clicks,
          impressions: m.impressions,
          ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
          position: m.positions.reduce((a, b) => a + b, 0) / m.positions.length,
        }))
        .sort((a, b) => b.clicks - a.clicks);

      const totalClicks = pages.reduce((sum, p) => sum + p.clicks, 0);
      const totalImpressions = pages.reduce((sum, p) => sum + p.impressions, 0);

      return {
        query,
        pages,
        totalClicks,
        totalImpressions,
        avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        avgPosition:
          pages.reduce((sum, p) => sum + p.position, 0) / pages.length,
        positionChange,
        clicksChange,
        impressionsChange,
        ctrChange,
        positionChangePercent,
        clicksChangePercent,
        impressionsChangePercent,
        ctrChangePercent,
      };
    })
    .sort((a, b) => b.totalClicks - a.totalClicks);
}

/**
 * Group rows by page to show which queries rank for each page
 */
export function groupByPage(rows: GscRow[]): PageToQueries[] {
  const map = new Map<string, GscRow[]>();

  rows.forEach((r) => {
    if (!r.page) return;
    if (!map.has(r.page)) map.set(r.page, []);
    map.get(r.page)!.push(r);
  });

  return [...map.entries()]
    .map(([page, list]) => {
      const queriesMap = new Map<
        string,
        { clicks: number; impressions: number; positions: number[] }
      >();

      list.forEach((r) => {
        if (!r.query) return;
        const q = queriesMap.get(r.query) ?? {
          clicks: 0,
          impressions: 0,
          positions: [],
        };
        q.clicks += r.clicks;
        q.impressions += r.impressions;
        q.positions.push(r.position);
        queriesMap.set(r.query, q);
      });

      const queries = [...queriesMap.entries()]
        .map(([query, m]) => ({
          query,
          clicks: m.clicks,
          impressions: m.impressions,
          ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
          position: m.positions.reduce((a, b) => a + b, 0) / m.positions.length,
        }))
        .sort((a, b) => b.clicks - a.clicks);

      const totalClicks = queries.reduce((sum, q) => sum + q.clicks, 0);
      const totalImpressions = queries.reduce((sum, q) => sum + q.impressions, 0);

      return {
        page,
        queries,
        totalClicks,
        totalImpressions,
        avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        avgPosition:
          queries.reduce((sum, q) => sum + q.position, 0) / queries.length,
      };
    })
    .sort((a, b) => b.totalClicks - a.totalClicks);
}

/**
 * Detect anomalies/alerts in the data
 */
export function detectAnomalies(
  current: GscRow[],
  previous: GscRow[],
  threshold = 0.3
): Array<{ type: string; item: string; change: number; severity: string }> {
  const alerts: Array<{ type: string; item: string; change: number; severity: string }> = [];

  // Group by page
  const currentPages = groupByPage(current);
  const previousPages = groupByPage(previous);

  const prevMap = new Map(previousPages.map((p) => [p.page, p]));

  currentPages.forEach((curr) => {
    const prev = prevMap.get(curr.page);
    if (!prev) return;

    const clicksChange = (curr.totalClicks - prev.totalClicks) / (prev.totalClicks || 1);
    const ctrChange = (curr.avgCtr - prev.avgCtr) / (prev.avgCtr || 1);
    const posChange = (curr.avgPosition - prev.avgPosition) / (prev.avgPosition || 1);

    if (clicksChange < -threshold) {
      alerts.push({
        type: "CLICKS_DROP",
        item: curr.page,
        change: clicksChange,
        severity: clicksChange < -0.5 ? "HIGH" : "MEDIUM",
      });
    }

    if (ctrChange < -threshold) {
      alerts.push({
        type: "CTR_DROP",
        item: curr.page,
        change: ctrChange,
        severity: ctrChange < -0.5 ? "HIGH" : "MEDIUM",
      });
    }

    if (posChange > threshold) {
      // Position increase = worse
      alerts.push({
        type: "POSITION_DROP",
        item: curr.page,
        change: posChange,
        severity: posChange > 0.5 ? "HIGH" : "MEDIUM",
      });
    }
  });

  return alerts;
}

