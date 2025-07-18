'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    condition: searchParams.get('condition') || '',
  });

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  }, [filters, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Products</h2>
            </div>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Search className="h-4 w-4 text-red-500" />
              Search Products
            </label>
            <div className="relative">
              <Input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleChange}
                placeholder="Search by product name, description..."
                className="pl-10 pr-10 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {filters.search && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-red-600 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="minPrice" className="text-sm font-semibold text-gray-700">
                Minimum Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <Input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleChange}
                  placeholder="0"
                  className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="maxPrice" className="text-sm font-semibold text-gray-700">
                Maximum Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <Input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  placeholder="∞"
                  className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Condition Filter */}
          <div className="space-y-2">
            <label htmlFor="condition" className="text-sm font-semibold text-gray-700">
              Product Condition
            </label>
            <Select
              value={filters.condition}
              onValueChange={(value) => setFilters(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200"
                    >
                      {key === 'search' && 'Search'}
                      {key === 'minPrice' && 'Min Price'}
                      {key === 'maxPrice' && 'Max Price'}
                      {key === 'condition' && 'Condition'}
                      : {value}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                        className="ml-1 hover:text-red-600 transition-colors duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 