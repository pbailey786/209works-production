'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, TrendingUp, Eye, Heart, MessageCircle, Share2, ExternalLink, RefreshCw } from 'lucide-react';


interface InstagramPost {
  id: string;
  caption: string;
  hashtags: string[];
  status: 'scheduled' | 'published' | 'failed';
  scheduledFor: string;
  publishedAt?: string;
  imageUrl?: string;
  mediaId?: string;
  permalink?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  reach?: number;
  job?: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
  createdAt: string;
}

interface SocialMediaStats {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPosts: number;
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
}

export default function SocialMediaDashboard() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [stats, setStats] = useState<SocialMediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSocialMediaData();
  }, []);

  const fetchSocialMediaData = async () => {
    setLoading(true);
    try {
      // Fetch Instagram posts
      const postsResponse = await fetch('/api/instagram/posts');
      const postsData = await postsResponse.json();
      setPosts(postsData.posts || []);

      // Fetch analytics
      const analyticsResponse = await fetch('/api/instagram/analytics');
      const analyticsData = await analyticsResponse.json();
      
      // Calculate stats from analytics data
      if (analyticsData.analytics) {
        const analytics = analyticsData.analytics;
        const publishedCount = analytics.filter((p: any) => p.status === 'published').length;
        const scheduledCount = analytics.filter((p: any) => p.status === 'scheduled').length;
        const failedCount = analytics.filter((p: any) => p.status === 'failed').length;
        
        // Calculate mock metrics
        const totalReach = publishedCount * 150 + Math.floor(Math.random() * 500);
        const totalEngagement = Math.floor(totalReach * 0.05);
        const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
        
        setStats({
          totalPosts: analytics.length,
          scheduledPosts: scheduledCount,
          publishedPosts: publishedCount,
          failedPosts: failedCount,
          totalReach,
          totalEngagement,
          avgEngagementRate
        });
      }
    } catch (error) {
      console.error('Error fetching social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateEngagementRate = (post: InstagramPost) => {
    if (!post.reach || post.reach === 0) return 0;
    const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
    return ((engagement / post.reach) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading social media data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Social Media Dashboard</h1>
          <p className="text-gray-600">Monitor Instagram posts and engagement for job promotions</p>
        </div>
        <Button onClick={fetchSocialMediaData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.publishedPosts} published, {stats.scheduledPosts} scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReach.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all published posts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Likes, comments, and shares
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement Rate</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgEngagementRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Industry avg: 1.2%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Posts Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">All Posts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PostsList posts={posts} />
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <PostsList posts={posts.filter(post => post.status === 'scheduled')} />
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <PostsList posts={posts.filter(post => post.status === 'published')} />
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <PostsList posts={posts.filter(post => post.status === 'failed')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostsList({ posts }: { posts: InstagramPost[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateEngagementRate = (post: InstagramPost) => {
    if (!post.reach || post.reach === 0) return 0;
    const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
    return ((engagement / post.reach) * 100).toFixed(2);
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">No posts found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(post.status)}>
                    {post.status.toUpperCase()}
                  </Badge>
                  {post.status === 'scheduled' && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      Scheduled for {formatDate(post.scheduledFor)}
                    </div>
                  )}
                  {post.status === 'published' && post.publishedAt && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Published on {formatDate(post.publishedAt)}
                    </div>
                  )}
                </div>

                {post.job && (
                  <CardTitle className="text-lg">
                    {post.job.title} at {post.job.company}
                  </CardTitle>
                )}
                
                <CardDescription className="mt-1">
                  📍 {post.job?.location || 'Unknown location'}
                </CardDescription>
              </div>

              {post.permalink && (
                <Button variant="outline" size="sm" asChild>
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Post
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Caption Preview */}
              <div>
                <h4 className="font-medium mb-2">Caption:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                  {post.caption.length > 200 
                    ? `${post.caption.substring(0, 200)}...` 
                    : post.caption}
                </p>
              </div>

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Hashtags:</h4>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 10).map((hashtag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{hashtag}
                      </Badge>
                    ))}
                    {post.hashtags.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.hashtags.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement Metrics (for published posts) */}
              {post.status === 'published' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{(post.reach || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Reach</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{(post.likes || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{(post.comments || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{calculateEngagementRate(post)}%</div>
                    <div className="text-xs text-gray-500">Engagement Rate</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}