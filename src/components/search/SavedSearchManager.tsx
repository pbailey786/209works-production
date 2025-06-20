'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Star, 
  Play, 
  Edit, 
  Trash2, 
  Bell, 
  BellOff,
  Plus,
  Clock,
  Filter,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any> | null;
  isActive: boolean;
  alertEnabled: boolean;
  lastRun: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SavedSearchManagerProps {
  onRunSearch?: (query: string, filters: Record<string, any>) => void;
  className?: string;
}

export default function SavedSearchManager({
  onRunSearch,
  className = '',
}: SavedSearchManagerProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const { toast } = useToast();

  // Load saved searches
  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches');
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.savedSearches);
      } else {
        throw new Error('Failed to load saved searches');
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved searches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runSavedSearch = async (savedSearch: SavedSearch) => {
    try {
      const response = await fetch(`/api/saved-searches/${savedSearch.id}/run`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the lastRun timestamp locally
        setSavedSearches(prev => 
          prev.map(search => 
            search.id === savedSearch.id 
              ? { ...search, lastRun: new Date().toISOString() }
              : search
          )
        );

        // Call the parent component's search handler if provided
        if (onRunSearch) {
          onRunSearch(savedSearch.query, savedSearch.filters || {});
        }

        toast({
          title: 'Search Executed',
          description: `Found ${data.totalCount} jobs matching "${savedSearch.name}"`,
        });
      } else {
        throw new Error('Failed to run search');
      }
    } catch (error) {
      console.error('Error running saved search:', error);
      toast({
        title: 'Error',
        description: 'Failed to run saved search',
        variant: 'destructive',
      });
    }
  };

  const toggleAlert = async (savedSearch: SavedSearch) => {
    try {
      const response = await fetch(`/api/saved-searches/${savedSearch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertEnabled: !savedSearch.alertEnabled,
        }),
      });

      if (response.ok) {
        setSavedSearches(prev => 
          prev.map(search => 
            search.id === savedSearch.id 
              ? { ...search, alertEnabled: !search.alertEnabled }
              : search
          )
        );

        toast({
          title: savedSearch.alertEnabled ? 'Alert Disabled' : 'Alert Enabled',
          description: savedSearch.alertEnabled 
            ? 'You will no longer receive alerts for this search'
            : 'You will receive alerts when new jobs match this search',
        });
      } else {
        throw new Error('Failed to update alert setting');
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert setting',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (savedSearch: SavedSearch) => {
    setEditingId(savedSearch.id);
    setEditName(savedSearch.name);
  };

  const saveEdit = async (savedSearch: SavedSearch) => {
    if (!editName.trim()) return;

    try {
      const response = await fetch(`/api/saved-searches/${savedSearch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
        }),
      });

      if (response.ok) {
        setSavedSearches(prev => 
          prev.map(search => 
            search.id === savedSearch.id 
              ? { ...search, name: editName.trim() }
              : search
          )
        );

        setEditingId(null);
        setEditName('');

        toast({
          title: 'Search Updated',
          description: 'Saved search name updated successfully',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update search');
      }
    } catch (error) {
      console.error('Error updating saved search:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update search',
        variant: 'destructive',
      });
    }
  };

  const deleteSavedSearch = async (savedSearch: SavedSearch) => {
    if (!confirm(`Are you sure you want to delete "${savedSearch.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-searches/${savedSearch.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedSearches(prev => prev.filter(search => search.id !== savedSearch.id));

        toast({
          title: 'Search Deleted',
          description: 'Saved search deleted successfully',
        });
      } else {
        throw new Error('Failed to delete search');
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete saved search',
        variant: 'destructive',
      });
    }
  };

  const formatLastRun = (lastRun: string | null) => {
    if (!lastRun) return 'Never run';
    
    const date = new Date(lastRun);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getFilterSummary = (filters: Record<string, any> | null) => {
    if (!filters) return [];
    
    const summary = [];
    if (filters.jobType) summary.push(filters.jobType);
    if (filters.location) summary.push(filters.location);
    if (filters.remote) summary.push('Remote');
    if (filters.salaryMin || filters.salaryMax) {
      const salaryRange = `$${filters.salaryMin || 0}k - $${filters.salaryMax || '∞'}k`;
      summary.push(salaryRange);
    }
    if (filters.skills?.length) summary.push(`${filters.skills.length} skills`);
    
    return summary;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading saved searches...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Saved Searches
        </CardTitle>
        <CardDescription>
          Quickly access your frequently used searches and set up alerts for new matches.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches</h3>
            <p className="text-gray-600 mb-4">
              Save your searches to quickly access them later and get alerts for new matches.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {savedSearches.map((savedSearch) => (
                <motion.div
                  key={savedSearch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingId === savedSearch.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit(savedSearch)}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => saveEdit(savedSearch)}
                            disabled={!editName.trim()}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <h4 className="font-medium text-gray-900 mb-1">{savedSearch.name}</h4>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-2">"{savedSearch.query}"</p>
                      
                      {getFilterSummary(savedSearch.filters).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getFilterSummary(savedSearch.filters).map((filter, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {filter}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastRun(savedSearch.lastRun)}
                        </span>
                        {savedSearch.alertEnabled && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Bell className="h-3 w-3" />
                            Alerts enabled
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSavedSearch(savedSearch)}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Run
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAlert(savedSearch)}
                        className={savedSearch.alertEnabled ? 'text-green-600' : 'text-gray-400'}
                      >
                        {savedSearch.alertEnabled ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(savedSearch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSavedSearch(savedSearch)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
