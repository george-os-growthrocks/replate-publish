import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  BarChart3,
  TrendingUp,
  Target,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  MousePointerClick,
  Hash,
  Globe,
  Calendar,
  Zap,
  Brain,
  Layers,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Save,
  X
} from "lucide-react";

interface KeywordData {
  id?: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: 'Low' | 'Medium' | 'High';
  intent: 'Informational' | 'Navigational' | 'Transactional' | 'Commercial';
  trend: 'Rising' | 'Stable' | 'Declining';
  position?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cluster?: string;
  opportunity_score?: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface KeywordMatrixProps {
  projectId: string;
}

export default function KeywordResearchMatrix({ projectId }: KeywordMatrixProps) {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    competition: 'all',
    intent: 'all',
    trend: 'all',
    priority: 'all',
    minVolume: '',
    maxVolume: '',
    minCpc: '',
    maxCpc: ''
  });
  const [sortBy, setSortBy] = useState('opportunity_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KeywordData>>({});
  const { toast } = useToast();

  // Load keywords from database and GSC data
  useEffect(() => {
    loadKeywords();
    loadGSCData();
  }, [projectId]);

  const loadGSCData = async () => {
    try {
      // Fetch recent GSC data which has keyword, position, clicks, impressions
      const { data, error } = await supabase
        .from('gsc_analytics')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform GSC data into keyword data
        const gscKeywords = data.map(item => ({
          keyword: item.keyword,
          searchVolume: 0, // GSC doesn't provide this
          difficulty: 50, // Default
          cpc: 0,
          competition: 'Medium' as const,
          intent: 'Informational' as const,
          trend: 'Stable' as const,
          position: item.position || 0,
          impressions: item.impressions || 0,
          clicks: item.clicks || 0,
          ctr: item.ctr || 0,
          cluster: undefined,
          opportunity_score: calculateGSCOpportunityScore(item.position, item.impressions, item.ctr),
          priority: getPriorityLevel(calculateGSCOpportunityScore(item.position, item.impressions, item.ctr)),
        }));

        // Merge with existing keywords (avoid duplicates)
        setKeywords(prev => {
          const existingKeywords = new Set(prev.map(k => k.keyword.toLowerCase()));
          const newKeywords = gscKeywords.filter(k => !existingKeywords.has(k.keyword.toLowerCase()));
          return [...prev, ...newKeywords];
        });
      }
    } catch (error: any) {
      console.error('Error loading GSC data:', error);
    }
  };

  const calculateGSCOpportunityScore = (position: number, impressions: number, ctr: number): number => {
    // Calculate opportunity score based on position and CTR
    if (!position || position === 0) return 0;
    
    const positionScore = position <= 3 ? 0.9 : position <= 10 ? 0.7 : position <= 20 ? 0.5 : 0.3;
    const impressionScore = impressions > 1000 ? 0.9 : impressions > 100 ? 0.6 : 0.3;
    const ctrScore = ctr > 0.05 ? 0.9 : ctr > 0.02 ? 0.6 : 0.3;
    
    return (positionScore + impressionScore + ctrScore) / 3;
  };

  const loadKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from('keyword_analysis')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to KeywordData format
      const transformedData = data?.map(item => ({
        id: item.id,
        keyword: item.keyword,
        searchVolume: item.search_volume || 0,
        difficulty: item.difficulty_score || 0,
        cpc: 0, // CPC not stored in current schema
        competition: getCompetitionLevel(item.difficulty_score),
        intent: getIntentType(item.opportunity_type),
        trend: 'Stable' as const, // Default trend
        position: item.position,
        impressions: item.impressions || 0,
        clicks: item.clicks || 0,
        ctr: item.ctr || 0,
        cluster: item.cluster_name,
        opportunity_score: item.potential_score || 0,
        priority: getPriorityLevel(item.potential_score),
        notes: item.ai_recommendations ? JSON.stringify(item.ai_recommendations) : '',
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      setKeywords(transformedData);
    } catch (error: any) {
      console.error('Error loading keywords:', error);
      toast({
        title: "Error loading keywords",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCompetitionLevel = (difficulty: number): 'Low' | 'Medium' | 'High' => {
    if (difficulty < 30) return 'Low';
    if (difficulty < 70) return 'Medium';
    return 'High';
  };

  const getIntentType = (type: string): 'Informational' | 'Navigational' | 'Transactional' | 'Commercial' => {
    if (type?.includes('informational')) return 'Informational';
    if (type?.includes('navigational')) return 'Navigational';
    if (type?.includes('transactional')) return 'Transactional';
    return 'Commercial';
  };

  const getPriorityLevel = (score: number): 'High' | 'Medium' | 'Low' => {
    if (score > 0.7) return 'High';
    if (score > 0.4) return 'Medium';
    return 'Low';
  };

  // Research new keywords
  const researchKeywords = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter a keyword or phrase to research",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use dataforseo-advanced function with correct operation
      const { data, error } = await supabase.functions.invoke('dataforseo-advanced', {
        body: {
          projectId,
          operation: 'keyword_research',
          params: {
            keywords: [searchTerm],
            location: 'United States',
            language: 'English'
          }
        }
      });

      if (error) throw error;

      // Process the response data - it's an array of keyword results
      const keywords = Array.isArray(data) ? data : [data];
      const result = keywords[0] || {};
      
      const difficulty = result.keyword_difficulty || result.difficulty || 50;
      const opportunityScore = result.opportunity_score || calculateOpportunityScore(result, difficulty);

      const newKeyword: KeywordData = {
        keyword: result.keyword || searchTerm,
        searchVolume: result.search_volume || 0,
        difficulty: difficulty,
        cpc: result.cpc || 0,
        competition: getCompetitionLevel(difficulty),
        intent: result.search_intent || analyzeIntent(searchTerm),
        trend: result.trend_score > 0.7 ? 'Rising' : result.trend_score < 0.3 ? 'Declining' : 'Stable',
        opportunity_score: opportunityScore,
        priority: getPriorityLevel(opportunityScore),
        notes: `Researched on ${new Date().toLocaleDateString()}`
      };

      // Save to database
      const { error: dbError } = await supabase
        .from('keyword_analysis')
        .insert({
          project_id: projectId,
          keyword: newKeyword.keyword,
          page_url: '', // Required field
          search_volume: newKeyword.searchVolume,
          difficulty_score: newKeyword.difficulty,
          potential_score: newKeyword.opportunity_score,
          opportunity_type: newKeyword.intent.toLowerCase(),
          cluster_name: newKeyword.cluster,
          ai_recommendations: { notes: newKeyword.notes }
        });

      if (dbError) throw dbError;

      setKeywords(prev => [newKeyword, ...prev]);
      setSearchTerm('');

      toast({
        title: "Keyword researched successfully! ✅",
        description: `Added "${searchTerm}" to your keyword matrix`,
      });

    } catch (error: any) {
      console.error('Error researching keyword:', error);
      toast({
        title: "Research failed ❌",
        description: error.message || "Failed to research keyword. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDifficulty = (serpResults: any[]): number => {
    // Analyze top 10 results for difficulty calculation
    const topResults = serpResults.slice(0, 10);
    let difficultyScore = 0;

    topResults.forEach((result, index) => {
      // Higher difficulty for results with high domain authority
      if (result.domain_authority > 80) difficultyScore += 10;
      if (result.domain_authority > 60) difficultyScore += 5;
      
      // Higher difficulty for exact match domains
      if (result.url.includes(result.keyword?.toLowerCase())) difficultyScore += 15;
      
      // Higher difficulty for results with many backlinks
      if (result.backlinks > 1000) difficultyScore += 8;
      if (result.backlinks > 500) difficultyScore += 4;
    });

    return Math.min(difficultyScore, 100);
  };

  const calculateOpportunityScore = (result: any, difficulty: number): number => {
    const volume = result.search_volume || result.volume || 0;
    const cpc = result.cpc || 0;
    
    // Higher volume = higher opportunity
    let score = Math.min(volume / 10000, 1) * 0.4;
    
    // Lower difficulty = higher opportunity
    score += (1 - difficulty / 100) * 0.3;
    
    // Higher CPC = higher opportunity (commercial intent)
    score += Math.min(cpc / 5, 1) * 0.3;
    
    return Math.min(score, 1);
  };

  const analyzeIntent = (keyword: string): 'Informational' | 'Navigational' | 'Transactional' | 'Commercial' => {
    const lowerKeyword = keyword.toLowerCase();
    
    // Transactional intent keywords
    if (lowerKeyword.includes('buy') || lowerKeyword.includes('purchase') || 
        lowerKeyword.includes('price') || lowerKeyword.includes('cost') ||
        lowerKeyword.includes('deal') || lowerKeyword.includes('discount')) {
      return 'Transactional';
    }
    
    // Commercial intent keywords
    if (lowerKeyword.includes('best') || lowerKeyword.includes('top') || 
        lowerKeyword.includes('review') || lowerKeyword.includes('compare') ||
        lowerKeyword.includes('vs') || lowerKeyword.includes('alternative')) {
      return 'Commercial';
    }
    
    // Navigational intent keywords
    if (lowerKeyword.includes('login') || lowerKeyword.includes('sign in') ||
        lowerKeyword.includes('website') || lowerKeyword.includes('official')) {
      return 'Navigational';
    }
    
    // Default to informational
    return 'Informational';
  };

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywords.filter(keyword => {
      // Text search
      if (searchTerm && !keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'all') {
        const difficultyLevel = getCompetitionLevel(keyword.difficulty);
        if (difficultyLevel !== filters.difficulty) return false;
      }

      // Competition filter
      if (filters.competition !== 'all' && keyword.competition !== filters.competition) {
        return false;
      }

      // Intent filter
      if (filters.intent !== 'all' && keyword.intent !== filters.intent) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && keyword.priority !== filters.priority) {
        return false;
      }

      // Volume filters
      if (filters.minVolume && keyword.searchVolume < parseInt(filters.minVolume)) {
        return false;
      }
      if (filters.maxVolume && keyword.searchVolume > parseInt(filters.maxVolume)) {
        return false;
      }

      // CPC filters
      if (filters.minCpc && keyword.cpc < parseFloat(filters.minCpc)) {
        return false;
      }
      if (filters.maxCpc && keyword.cpc > parseFloat(filters.maxCpc)) {
        return false;
      }

      return true;
    });

    // Sort keywords
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'searchVolume':
          aValue = a.searchVolume;
          bValue = b.searchVolume;
          break;
        case 'difficulty':
          aValue = a.difficulty;
          bValue = b.difficulty;
          break;
        case 'cpc':
          aValue = a.cpc;
          bValue = b.cpc;
          break;
        case 'opportunity_score':
        default:
          aValue = a.opportunity_score || 0;
          bValue = b.opportunity_score || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [keywords, searchTerm, filters, sortBy, sortOrder]);

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedKeywords.length === 0) {
      toast({
        title: "No keywords selected",
        description: "Please select keywords to perform bulk actions",
        variant: "destructive",
      });
      return;
    }

    try {
      switch (action) {
        case 'delete':
          const { error } = await supabase
            .from('keyword_analysis')
            .delete()
            .in('keyword', selectedKeywords);

          if (error) throw error;

          setKeywords(prev => prev.filter(k => !selectedKeywords.includes(k.keyword)));
          setSelectedKeywords([]);

          toast({
            title: "Keywords deleted",
            description: `Deleted ${selectedKeywords.length} keywords`,
          });
          break;

        case 'export':
          const csvData = selectedKeywords.map(keyword => {
            const kw = keywords.find(k => k.keyword === keyword);
            return `${kw?.keyword},${kw?.searchVolume},${kw?.difficulty},${kw?.cpc},${kw?.competition},${kw?.intent},${kw?.priority}`;
          }).join('\n');

          const csvContent = 'Keyword,Search Volume,Difficulty,CPC,Competition,Intent,Priority\n' + csvData;
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'keywords.csv';
          a.click();
          URL.revokeObjectURL(url);

          toast({
            title: "Keywords exported",
            description: `Exported ${selectedKeywords.length} keywords to CSV`,
          });
          break;
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Edit keyword
  const startEdit = (keyword: KeywordData) => {
    setEditingKeyword(keyword.keyword);
    setEditForm(keyword);
  };

  const saveEdit = async () => {
    if (!editingKeyword) return;

    try {
      const { error } = await supabase
        .from('keyword_analysis')
        .update({
          search_volume: editForm.searchVolume,
          difficulty_score: editForm.difficulty,
          potential_score: editForm.opportunity_score,
          opportunity_type: editForm.intent?.toLowerCase(),
          cluster_name: editForm.cluster,
          ai_recommendations: { notes: editForm.notes }
        })
        .eq('keyword', editingKeyword)
        .eq('project_id', projectId);

      if (error) throw error;

      setKeywords(prev => prev.map(k => 
        k.keyword === editingKeyword ? { ...k, ...editForm } : k
      ));

      setEditingKeyword(null);
      setEditForm({});

      toast({
        title: "Keyword updated",
        description: "Keyword data has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'Informational': return 'bg-blue-100 text-blue-800';
      case 'Navigational': return 'bg-purple-100 text-purple-800';
      case 'Transactional': return 'bg-green-100 text-green-800';
      case 'Commercial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Keyword Research Matrix
          </h1>
          <p className="text-muted-foreground text-lg">Comprehensive keyword analysis and competitive intelligence</p>
        </div>
      </div>

      {/* Enhanced Search Card */}
      <Card className="rounded-2xl border-border shadow-xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-card to-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">AI-Powered Keyword Research</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Enter keywords to analyze search volume, difficulty, and opportunities
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter keyword or phrase (e.g., 'best seo tools', 'content optimization')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && researchKeywords()}
                className="h-14 text-lg rounded-xl border-2 focus:border-primary transition-all"
              />
            </div>
            <Button
              onClick={researchKeywords}
              disabled={loading}
              className="h-14 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Research Keywords
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stunning Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Hash className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Keywords</p>
              <p className="text-3xl font-bold">{keywords.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 hover:border-red-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">High Priority</p>
              <p className="text-3xl font-bold text-red-600">
                {keywords.filter(k => k.priority === 'High').length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Avg. Volume</p>
              <p className="text-3xl font-bold">
                {Math.round(keywords.reduce((sum, k) => sum + k.searchVolume, 0) / keywords.length) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Avg. Difficulty</p>
              <p className="text-3xl font-bold">
                {Math.round(keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length) || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="flex gap-3">
            <Select value={filters.difficulty} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.competition} onValueChange={(value) => setFilters(prev => ({ ...prev, competition: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Competition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.intent} onValueChange={(value) => setFilters(prev => ({ ...prev, intent: value }))}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Informational">Informational</SelectItem>
                <SelectItem value="Navigational">Navigational</SelectItem>
                <SelectItem value="Transactional">Transactional</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opportunity_score">Opportunity Score</SelectItem>
                <SelectItem value="searchVolume">Search Volume</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="cpc">CPC</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {selectedKeywords.length > 0 && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({selectedKeywords.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedKeywords.length})
            </Button>
          </div>
        )}
      </div>

      {/* Minimal Keywords Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Keywords ({filteredKeywords.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">
                  <Checkbox
                    checked={selectedKeywords.length === filteredKeywords.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedKeywords(filteredKeywords.map(k => k.keyword));
                      } else {
                        setSelectedKeywords([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Keyword</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Volume</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Difficulty</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Competition</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Intent</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Priority</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Opportunity</th>
                <th className="text-left p-3 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((keyword) => (
                <tr key={keyword.keyword} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedKeywords.includes(keyword.keyword)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKeywords(prev => [...prev, keyword.keyword]);
                        } else {
                          setSelectedKeywords(prev => prev.filter(k => k !== keyword.keyword));
                        }
                      }}
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-900">{keyword.keyword}</td>
                  <td className="p-3 text-gray-600">{keyword.searchVolume.toLocaleString()}</td>
                  <td className="p-3 text-gray-600">{keyword.difficulty}%</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(keyword.competition)}`}>
                      {keyword.competition}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntentColor(keyword.intent)}`}>
                      {keyword.intent}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(keyword.priority)}`}>
                      {keyword.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(keyword.opportunity_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((keyword.opportunity_score || 0) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(keyword)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Minimal Edit Modal */}
      {editingKeyword && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Keyword: {editingKeyword}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingKeyword(null);
                    setEditForm({});
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search Volume</label>
                  <Input
                    type="number"
                    value={editForm.searchVolume || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, searchVolume: parseInt(e.target.value) || 0 }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
                  <Input
                    type="number"
                    value={editForm.difficulty || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 0 }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">CPC</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.cpc || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cpc: parseFloat(e.target.value) || 0 }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                  <Select value={editForm.priority || ''} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as any }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                  <Input
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this keyword..."
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={saveEdit} className="px-6">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingKeyword(null);
                    setEditForm({});
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
