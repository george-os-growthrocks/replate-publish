/**
 * SEO Intelligence Tables Type Definitions
 * Auto-generated types for new SEO intelligence features
 */

export interface KeywordRanking {
  id: string;
  user_id: string;
  property: string;
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string | null;
  checked_at: string;
  created_at: string;
}

export interface TrackedKeyword {
  id: string;
  user_id: string;
  property: string;
  keyword: string;
  target_position: number | null;
  active: boolean;
  created_at: string;
}

export interface GoogleAlgorithmUpdate {
  id: string;
  name: string;
  update_date: string;
  severity: 'low' | 'moderate' | 'high' | 'severe';
  category: string;
  description: string;
  impact_areas: string[];
  created_at: string;
}

export interface AlgorithmImpact {
  id: string;
  user_id: string;
  property: string;
  algorithm_update_id: string;
  detected_at: string;
  avg_position_drop: number;
  affected_keywords: string[];
  estimated_traffic_loss: number;
  severity: 'low' | 'moderate' | 'high' | 'severe';
  diagnosis: string;
  recovery_actions: RecoveryAction[];
  status: 'pending' | 'acknowledged' | 'recovered';
  created_at: string;
}

export interface RecoveryAction {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'success' | 'warning' | 'info' | 'ranking_up' | 'ranking_down' | 'algorithm_impact';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export interface SEOInsight {
  id: string;
  user_id: string;
  property: string;
  insight_type: 'quick_win' | 'opportunity' | 'recommendation' | 'warning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimated_impact: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  data: any;
  expires_at: string | null;
  created_at: string;
}

export interface DailyRankingsSnapshot {
  id: string;
  user_id: string;
  property: string;
  snapshot_date: string;
  total_clicks: number;
  total_impressions: number;
  avg_position: number;
  avg_ctr: number;
  top_keywords: any[];
  created_at: string;
}

