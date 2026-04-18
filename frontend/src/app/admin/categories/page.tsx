'use client';

import { useState, useEffect, useRef } from 'react';
import { API, Category } from '@/lib/api';
import { ImagePlus, Loader2, Save } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editImgUrl, setEditImgUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = () => {
    API.getCategories()
      .then((data) => setCategories(data.categories || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await API.adminUploadImage(file);
      setEditImgUrl(res.relativeUrl); // Save locally routed path
    } catch (err) {
      alert('Upload failed. Server error.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (id: string, slug: string) => {
    try {
      // We perform a PATCH (if the route exists) or rely on existing categories PATCH mechanism
      await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: editImgUrl }),
      });
      setEditingCatId(null);
      loadCategories(); // reload data
    } catch (err) {
      alert('Failed to save category');
    }
  };

  if (loading) return <div>Loading interface...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Manage Categories</h1>
        <p className="text-muted-foreground mt-1">
          Upload custom category background assets or drop an external image URL.
        </p>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm">Category</th>
              <th className="px-6 py-4 font-semibold text-sm">Posts</th>
              <th className="px-6 py-4 font-semibold text-sm">Image Thumbnail</th>
              <th className="px-6 py-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-bold">{cat.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">/{cat.slug}</div>
                </td>
                <td className="px-6 py-4 font-mono text-sm">{cat.post_count}</td>
                <td className="px-6 py-4">
                  {editingCatId === cat.id ? (
                    <div className="flex flex-col gap-2 max-w-xs">
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={editImgUrl}
                        onChange={(e) => setEditImgUrl(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-sm hover:bg-muted/80 transition-colors"
                        >
                          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                          {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    cat.image_url ? (
                      <img src={cat.image_url} alt="Cover" className="w-20 h-10 object-cover rounded shadow-sm border border-border" />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No image configured</span>
                    )
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleSave(cat.id, cat.slug)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button 
                        onClick={() => setEditingCatId(null)}
                        className="px-3 py-1.5 text-sm font-semibold hover:bg-muted rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditImgUrl(cat.image_url || '');
                      }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Edit Image
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
