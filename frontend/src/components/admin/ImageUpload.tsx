'use client';

import { useCallback, useState } from 'react';
import { adminApi } from '@/services/api';

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ onUploadSuccess, folder = 'ravabazar/products' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc).');
      return;
    }
    
    // Create temporary preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError('');
    setIsUploading(true);
    
    try {
      const response = await adminApi.uploadImage(file, folder);
      onUploadSuccess(response.image_url);
      setPreview(response.image_url); // Update preview to actual URL
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
      setPreview('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-muted/20 hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={preview} 
              alt="Preview" 
              className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : 'opacity-100'}`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-full text-sm">
                  Uploading...
                </span>
              </div>
            )}
            {!isUploading && (
              <button 
                type="button"
                onClick={() => setPreview('')}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-4xl mb-4">🖼️</span>
            <p className="text-base font-medium">
              Drag and drop an image here
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              or click to browse from your computer
            </p>
            <label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Browse Files
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
