import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (category: any) => void;
  defaultType?: 'income' | 'expense';
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#059669', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f472b6', '#64748b'
];

const CATEGORY_ICONS = [
  '🍽️', '🚗', '🛍️', '🎬', '⚡', '🏥', '📚', '✈️', '🏠', '🛡️',
  '💅', '📱', '🎁', '💼', '🧾', '🐕', '💪', '🚙', '🏦', '📋',
  '💰', '💻', '🏆', '📈', '🎉', '↩️', '🚀', '💵', '🔧', '🎯'
];

export default function CreateCategoryModal({ 
  isOpen, 
  onClose, 
  onCategoryCreated, 
  defaultType = 'expense' 
}: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [icon, setIcon] = useState('📋');
  const [color, setColor] = useState('#64748b');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiRequest('POST', '/api/categories', categoryData);
      return response.json();
    },
    onSuccess: (newCategory) => {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      onCategoryCreated?.(newCategory);
      handleClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setName('');
    setDescription('');
    setType(defaultType);
    setIcon('📋');
    setColor('#64748b');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    createCategoryMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
      type,
      icon,
      color,
      isDefault: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Category Name *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Coffee Shops"
              required
            />
          </div>

          <div>
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this category"
              rows={2}
            />
          </div>

          <div>
            <Label>Category Type</Label>
            <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Icon</Label>
            <div className="grid grid-cols-10 gap-2 mt-2">
              {CATEGORY_ICONS.map((iconOption) => (
                <button
                  key={iconOption}
                  type="button"
                  onClick={() => setIcon(iconOption)}
                  className={`p-2 text-lg rounded border-2 hover:bg-gray-50 transition-colors ${
                    icon === iconOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {iconOption}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="grid grid-cols-9 gap-2 mt-2">
              {CATEGORY_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === colorOption ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-3 bg-gray-50">
            <Label className="text-sm text-gray-600">Preview:</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{icon}</span>
              <span className="font-medium" style={{ color }}>
                {name || 'Category Name'}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                {type}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategoryMutation.isPending || !name.trim()}>
              {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}