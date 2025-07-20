'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Upload, Camera, Package, DollarSign, Tag, FileText, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const imageFile = formData.get('image') as File;

    if (!imageFile || imageFile.size === 0) {
      setError('Please select an image');
      setLoading(false);
      return;
    }

    try {
      // First, upload the image
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: imageFormData,
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json();
        throw new Error(uploadError.error || 'Failed to upload image');
      }

      const { imageUrl } = await uploadRes.json();

      // Then, create the product
      const productRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          price: Number(formData.get('price')),
          condition: formData.get('condition'),
          image_url: imageUrl,
          category: formData.get('category'),
        }),
      });

      if (!productRes.ok) {
        const productError = await productRes.json();
        throw new Error(productError.error || 'Failed to create product');
      }

      const product = await productRes.json();
      alert('Produk berhasil di-upload!');
      router.push(`/product/${product.id}`);
      return;

      router.push('/my-products');
      router.refresh();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Update the file input
        const input = document.getElementById('image') as HTMLInputElement;
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/products">
                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 to-rose-700 bg-clip-text text-transparent">
                  Upload Product
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Share your amazing products with our community
                </p>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="h-6 w-6 text-red-600" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          {error}
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        Product Title
                      </label>
                      <Input
                        type="text"
                        name="title"
                        id="title"
                        required
                        placeholder="Enter product title..."
                        className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl transition-all duration-200"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-semibold text-gray-700">
                        Description
                      </label>
                      <Textarea
                        name="description"
                        id="description"
                        rows={4}
                        required
                        placeholder="Describe your product in detail..."
                        className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Price and Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="price" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-red-500" />
                          Price (Rp)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                          <Input
                            type="number"
                            name="price"
                            id="price"
                            required
                            min="0"
                            placeholder="0"
                            className="pl-10 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="condition" className="text-sm font-semibold text-gray-700">
                          Condition
                        </label>
                        <Select name="condition" required>
                          <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl transition-all duration-200">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="like_new">Like New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-red-500" />
                        Category
                      </label>
                      <Select name="category" required>
                        <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-xl transition-all duration-200">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Elektronik">Elektronik</SelectItem>
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Buku">Buku</SelectItem>
                          <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                          <SelectItem value="Lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 py-3 rounded-xl font-semibold text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Upload Product
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Image Upload Section */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-red-600" />
                    Product Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 ${
                      dragActive 
                        ? 'border-red-400 bg-red-50' 
                        : imagePreview 
                          ? 'border-gray-300 bg-gray-50' 
                          : 'border-gray-300 bg-gray-50 hover:border-red-300 hover:bg-red-50/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4 text-center">
                      {imagePreview ? (
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                            <Badge className="bg-white/90 text-gray-700 border-0 opacity-0 hover:opacity-100 transition-opacity duration-200">
                              Click to change
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center">
                            <Upload className="h-8 w-8 text-red-500" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900 mb-2">
                              Upload your product image
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              Drag and drop your image here, or click to browse
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="image"
                          className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <span>{imagePreview ? 'Change Image' : 'Choose File'}</span>
                          <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            required
                            className="sr-only"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tips Section */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Tips for better sales
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use high-quality, well-lit photos</li>
                      <li>• Show your product from multiple angles</li>
                      <li>• Write clear, detailed descriptions</li>
                      <li>• Set competitive prices</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 