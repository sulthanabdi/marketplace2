'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FilterState {
  search: string;
  category: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
}

interface ProductFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

const categories = [
  { value: 'Elektronik', label: 'Elektronik' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Buku', label: 'Buku' },
  { value: 'Aksesoris', label: 'Aksesoris' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
];

export default function ProductFilter({ onFilterChange }: ProductFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State untuk nilai yang ditampilkan di input
  const [inputValue, setInputValue] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  // State untuk nilai yang digunakan dalam filter
  const [activeFilters, setActiveFilters] = useState<FilterState>(inputValue);

  // Debounce function untuk update URL
  const debouncedUpdate = useRef(
    debounce((filters: FilterState) => {
      startTransition(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        router.push(`/products?${params.toString()}`);
        onFilterChange(filters);
        setActiveFilters(filters);
      });
    }, 1000) // Menambah delay menjadi 1 detik
  ).current;

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  // Handle input changes
  const handleInputChange = (key: keyof FilterState, value: string) => {
    setInputValue(prev => {
      const newValue = { ...prev, [key]: value };
      debouncedUpdate(newValue);
      return newValue;
    });
  };

  // Handle select changes
  const handleSelectChange = (key: keyof FilterState, value: string) => {
    setInputValue(prev => {
      const newValue = { ...prev, [key]: value };
      startTransition(() => {
        const params = new URLSearchParams();
        Object.entries(newValue).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        router.push(`/products?${params.toString()}`);
        onFilterChange(newValue);
        setActiveFilters(newValue);
      });
      return newValue;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
    };
    setInputValue(clearedFilters);
    startTransition(() => {
      router.push('/products');
      onFilterChange(clearedFilters);
      setActiveFilters(clearedFilters);
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(inputValue).some(value => value !== '');

  // Update input value when URL changes
  useEffect(() => {
    const newValue = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      condition: searchParams.get('condition') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };
    setInputValue(newValue);
    setActiveFilters(newValue);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products by name, description..."
          value={inputValue.search}
          onChange={(e) => handleInputChange('search', e.target.value)}
          className="pl-10 pr-10 py-3 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200"
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
          </div>
        )}
        {inputValue.search && (
          <button
            onClick={() => handleInputChange('search', '')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-red-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4 text-red-500" />
            Category
          </label>
          <Select
            value={inputValue.category}
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Condition</label>
          <Select
            value={inputValue.condition}
            onValueChange={(value) => handleSelectChange('condition', value)}
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

        {/* Min Price Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Min Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
            <Input
              type="number"
              placeholder="0"
              value={inputValue.minPrice}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200"
              min={0}
            />
          </div>
        </div>

        {/* Max Price Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Max Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
            <Input
              type="number"
              placeholder="∞"
              value={inputValue.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm transition-all duration-200"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Active Filters & Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(inputValue).map(([key, value]) => {
                if (!value) return null;
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-200"
                  >
                    {key === 'search' && 'Search'}
                    {key === 'category' && 'Category'}
                    {key === 'condition' && 'Condition'}
                    {key === 'minPrice' && 'Min Price'}
                    {key === 'maxPrice' && 'Max Price'}
                    : {value}
                    <button
                      onClick={() => handleInputChange(key as keyof FilterState, '')}
                      className="ml-1 hover:text-red-600 transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
} 