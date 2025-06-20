import { useState } from '@/components/ui/card';
import { useRouter, useSearchParams } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Input } from '@/components/ui/card';
import { Label } from '@/components/ui/card';
import { Calendar } from '@/components/ui/card';
import { CalendarIcon, Search, X } from '@/components/ui/card';
import { format } from 'date-fns';

'use client';

  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function AdManagementFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    advertiser: searchParams.get('advertiser') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  });

  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Reset to page 1 when applying filters
    params.set('page', '1');

    router.push(`/admin/ads?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      advertiser: '',
      dateFrom: '',
      dateTo: '',
    });
    router.push('/admin/ads');
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={value => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type">Ad Type</Label>
          <Select
            value={filters.type}
            onValueChange={value => handleFilterChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="featured_job">Featured Job</SelectItem>
              <SelectItem value="sponsored_search">Sponsored Search</SelectItem>
              <SelectItem value="native">Native</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advertiser Filter */}
        <div className="space-y-2">
          <Label htmlFor="advertiser">Advertiser</Label>
          <Input
            id="advertiser"
            placeholder="Search by business name..."
            value={filters.advertiser}
            onChange={e => handleFilterChange('advertiser', e.target.value)}
          />
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select
            value={searchParams.get('sortBy') || 'createdAt'}
            onValueChange={value => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('sortBy', value);
              router.push(`/admin/ads?${params.toString()}`);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="startDate">Start Date</SelectItem>
              <SelectItem value="endDate">End Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="businessName">Business Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Date From */}
        <div className="space-y-2">
          <Label>Created From</Label>
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom
                  ? format(new Date(filters.dateFrom), 'PPP')
                  : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  filters.dateFrom ? new Date(filters.dateFrom) : undefined
                }
                onSelect={date => {
                  handleFilterChange(
                    'dateFrom',
                    date ? date.toISOString().split('T')[0] : ''
                  );
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>Created To</Label>
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo
                  ? format(new Date(filters.dateTo), 'PPP')
                  : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={date => {
                  handleFilterChange(
                    'dateTo',
                    date ? date.toISOString().split('T')[0] : ''
                  );
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button onClick={applyFilters} className="flex items-center">
          <Search className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>

        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="outline"
            className="flex items-center"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
