import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Eye,
  Calendar,
  Globe,
  Plus,
  Trash2,
  Edit
} from "lucide-react";

interface SERPTrackerProps {
  projectId: string;
}

interface KeywordRanking {
  id: string;
  keyword: string;
  position: number;
  url: string;
  date: string;
  project_id: string;
  clicks?: number;
  impressions?: number;
}

export default function SERPTracker({ projectId }: SERPTrackerProps) {
  const [rankings, setRankings] = useState<KeywordRanking[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ keyword: "", position: 0, url: "" });
  const { toast } = useToast();

  useEffect(() => {
    loadRankings();
  }, [projectId]);

  const loadRankings = async () => {
    try {
      const { data, error } = await supabase
        .from('keyword_analysis')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform keyword_analysis data to KeywordRanking format
      const transformedData = (data || []).map(item => ({
        id: item.id,
        keyword: item.keyword,
        position: 0, // Default position since current_position doesn't exist
        url: item.page_url || '',
        date: item.created_at,
        project_id: item.project_id,
        clicks: item.clicks || 0,
        impressions: item.impressions || 0
      }));
      
      setRankings(transformedData);
    } catch (error: any) {
      console.error('Error loading rankings:', error);
      toast({
        title: "Error loading rankings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('keyword_analysis')
        .insert({
          project_id: projectId,
          keyword: newKeyword.trim(),
          page_url: '',
          search_volume: 0,
          difficulty_score: 0,
          potential_score: 0,
          opportunity_type: 'informational',
          cluster_name: '',
          ai_recommendations: {}
        });

      if (error) throw error;

      setNewKeyword('');
      loadRankings();
      toast({
        title: "Keyword added successfully! ✅",
        description: `Added "${newKeyword}" to tracking`,
      });
    } catch (error: any) {
      console.error('Error adding keyword:', error);
      toast({
        title: "Error adding keyword",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRanking = async (id: string, updates: Partial<KeywordRanking>) => {
    try {
      const { error } = await supabase
        .from('keyword_analysis')
        .update({
          page_url: updates.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadRankings();
    } catch (error: any) {
      console.error('Error updating ranking:', error);
      toast({
        title: "Error updating ranking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRanking = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keyword_analysis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRankings();
      toast({
        title: "Ranking deleted",
        description: "Keyword ranking has been removed",
      });
    } catch (error: any) {
      console.error('Error deleting ranking:', error);
      toast({
        title: "Error deleting ranking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPositionChange = (keyword: string) => {
    const keywordRankings = rankings.filter(r => r.keyword === keyword).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (keywordRankings.length < 2) return null;
    
    const latest = keywordRankings[0];
    const previous = keywordRankings[1];
    
    if (!latest.position || !previous.position) return null;
    
    return previous.position - latest.position;
  };

  const getChangeIcon = (change: number | null) => {
    if (change === null) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change: number | null) => {
    if (change === null) return "text-gray-400";
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-400";
  };

  const uniqueKeywords = Array.from(new Set(rankings.map(r => r.keyword)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            SERP Rank Tracker
          </h1>
          <p className="text-muted-foreground text-lg">Monitor keyword rankings and track SERP performance</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Enter keyword to track..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            className="w-64 rounded-xl"
          />
          <Button
            onClick={addKeyword}
            disabled={loading || !newKeyword.trim()}
            className="px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Add Keyword
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stunning Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Keywords</p>
              <p className="text-3xl font-bold">{uniqueKeywords.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Avg. Position</p>
              <p className="text-3xl font-bold">
                {rankings.length > 0 ? Math.round(rankings.reduce((sum, r) => sum + (r.position || 0), 0) / rankings.length) : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Improvements</p>
              <p className="text-3xl font-bold text-green-600">
                {rankings.filter(r => getPositionChange(r.keyword) && getPositionChange(r.keyword)! > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Declines</p>
              <p className="text-3xl font-bold text-red-600">
                {rankings.filter(r => getPositionChange(r.keyword) && getPositionChange(r.keyword)! < 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Rankings Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
        <div className="p-6 border-b border-border bg-gradient-to-r from-card to-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Keyword Rankings</h3>
              <p className="text-sm text-muted-foreground">{uniqueKeywords.length} keywords tracked</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Keyword</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Position</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Change</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">URL</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Updated</th>
                <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {uniqueKeywords.map((keyword) => {
                const latestRanking = rankings.filter(r => r.keyword === keyword).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const change = getPositionChange(keyword);

                return (
                  <tr key={keyword} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{keyword}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{latestRanking?.position || 0}</span>
                        {latestRanking?.position && latestRanking.position <= 10 && (
                          <Badge className="bg-green-100 text-green-800">Top 10</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getChangeIcon(change)}
                        <span className={`text-sm font-medium ${getChangeColor(change)}`}>
                          {change !== null ? Math.abs(change) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs truncate text-gray-600">
                        {latestRanking?.url || '-'}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      {latestRanking?.date ? new Date(latestRanking.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingKeyword(keyword);
                            setEditForm({
                              keyword: keyword,
                              position: latestRanking?.position || 0,
                              url: latestRanking?.url || ''
                            });
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRanking(latestRanking?.id || '')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Minimal Edit Modal */}
      {editingKeyword && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Ranking</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingKeyword(null);
                    setEditForm({ keyword: "", position: 0, url: "" });
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Position</label>
                <Input
                  type="number"
                  value={editForm.position}
                  onChange={(e) => setEditForm(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">URL</label>
                <Input
                  value={editForm.url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Enter ranking URL..."
                  className="w-full"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => {
                    const latestRanking = rankings.filter(r => r.keyword === editingKeyword).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    if (latestRanking) {
                      updateRanking(latestRanking.id, {
                        position: editForm.position,
                        url: editForm.url
                      });
                    }
                    setEditingKeyword(null);
                    setEditForm({ keyword: "", position: 0, url: "" });
                  }}
                  className="px-6"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingKeyword(null);
                    setEditForm({ keyword: "", position: 0, url: "" });
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
