'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { debounce } from 'lodash';

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
    <div className="mb-6 flex flex-wrap gap-4 items-end">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={inputValue.search}
          onChange={(e) => handleInputChange('search', e.target.value)}
          className="border rounded px-3 py-2 w-48"
        />
        {isPending && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          </div>
        )}
      </div>
      <select
        value={inputValue.category}
        onChange={(e) => handleSelectChange('category', e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">All Categories</option>
        <option value="Elektronik">Elektronik</option>
        <option value="Fashion">Fashion</option>
        <option value="Buku">Buku</option>
        <option value="Aksesoris">Aksesoris</option>
        <option value="Lainnya">Lainnya</option>
      </select>
      <select
        value={inputValue.condition}
        onChange={(e) => handleSelectChange('condition', e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="">All Conditions</option>
        <option value="new">New</option>
        <option value="used">Used</option>
      </select>
      <input
        type="number"
        placeholder="Min Price"
        value={inputValue.minPrice}
        onChange={(e) => handleInputChange('minPrice', e.target.value)}
        className="border rounded px-3 py-2 w-28"
        min={0}
      />
      <input
        type="number"
        placeholder="Max Price"
        value={inputValue.maxPrice}
        onChange={(e) => handleInputChange('maxPrice', e.target.value)}
        className="border rounded px-3 py-2 w-28"
        min={0}
      />
    </div>
  );
} 