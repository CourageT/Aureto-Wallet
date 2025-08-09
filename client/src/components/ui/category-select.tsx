import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CreateCategoryModal from '@/components/modals/create-category-modal';
import { Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense';
}

interface CategorySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  filterType?: 'income' | 'expense' | 'all';
  disabled?: boolean;
}

export default function CategorySelect({
  value,
  onValueChange,
  placeholder = "Select a category",
  filterType = 'all',
  disabled = false,
}: CategorySelectProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const filteredCategories = categories.filter(category => {
    if (filterType === 'all') return true;
    return category.type === filterType;
  });

  const handleCategoryCreated = (newCategory: Category) => {
    setPendingCategoryId(newCategory.id);
    onValueChange?.(newCategory.id);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading categories..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                {category.icon && <span>{category.icon}</span>}
                <span style={{ color: category.color || undefined }}>
                  {category.name}
                </span>
                <span className="text-xs opacity-60 ml-auto">
                  {category.type}
                </span>
              </div>
            </SelectItem>
          ))}
          
          {filteredCategories.length > 0 && <Separator className="my-1" />}
          
          <div className="px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleOpenCreateModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Category
            </Button>
          </div>
        </SelectContent>
      </Select>

      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
        defaultType={filterType === 'all' ? 'expense' : filterType}
      />
    </>
  );
}