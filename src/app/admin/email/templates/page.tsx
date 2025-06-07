'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  ArrowLeft,
  Search,
  Eye,
  Edit,
  Copy,
  MoreHorizontal,
  Plus,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'job_seeker' | 'employer' | 'system' | 'marketing';
  status: 'active' | 'draft' | 'archived';
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real template data from the template manager API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/email/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        
        // Transform the API data to match our UI interface
        const transformedTemplates: EmailTemplate[] = data.templates.map((template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          status: 'active', // Default status for existing templates
          lastUsed: '2024-01-16', // Default for now
          usageCount: Math.floor(Math.random() * 1000), // Random for now - you can track this in your database
          createdAt: '2024-01-01', // Default for now
          updatedAt: '2024-01-15', // Default for now
        }));
        
        setTemplates(transformedTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Fallback to empty array on error
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_seeker': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'employer': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'system': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'marketing': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'draft': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'archived': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'job_seeker', label: 'Job Seeker', count: templates.filter(t => t.category === 'job_seeker').length },
    { value: 'employer', label: 'Employer', count: templates.filter(t => t.category === 'employer').length },
    { value: 'system', label: 'System', count: templates.filter(t => t.category === 'system').length },
    { value: 'marketing', label: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/email">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Email Management
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage and customize your email templates
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/email/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label} ({category.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No templates found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first email template to get started'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Badge variant="outline" className={getCategoryColor(template.category)}>
                    {template.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(template.status)}>
                    {template.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usage:</span>
                    <span className="font-medium">{template.usageCount.toLocaleString()} times</span>
                  </div>
                  {template.lastUsed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last used:</span>
                      <span className="font-medium">{new Date(template.lastUsed).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="font-medium">{new Date(template.updatedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/admin/email/templates/${template.id}/preview`}>
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/admin/email/templates/${template.id}/edit`}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
