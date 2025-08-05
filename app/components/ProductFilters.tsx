'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  { value: 'Elektronik', label: 'Electronics' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Buku', label: 'Books' },
  { value: 'Aksesoris', label: 'Accessories' },
  { value: 'Lainnya', label: 'Others' },
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
];

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const debouncedUpdate = useDebouncedCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.replace(`/products?${params.toString()}`);
    });
  }, 500);

  useEffect(() => {
    debouncedUpdate();
    return () => debouncedUpdate.cancel();
  }, [filters, debouncedUpdate]);

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/80">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="search" className="text-sm font-medium text-muted-foreground">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="What are you looking for?"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
              {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="text-sm font-medium text-muted-foreground">Category</label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Condition Filter */}
          <div>
            <label htmlFor="condition" className="text-sm font-medium text-muted-foreground">Condition</label>
            <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition
', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Conditions</SelectItem>
                {conditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Button */}
          <div className="flex items-end h-full">
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}