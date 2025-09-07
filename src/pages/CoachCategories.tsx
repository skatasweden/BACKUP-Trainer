import { useState } from 'react';
import { CategoryPanel } from '@/components/categories/CategoryPanel';
import { ChildCategoryPanel } from '@/components/categories/ChildCategoryPanel';
import { useCategories } from '@/hooks/useCategories';

export default function CoachCategories() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const { data: categories = [] } = useCategories();
  
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Kategorier & Praktikenheter</h1>
        <p className="text-muted-foreground">
          Organisera ditt träningsinnehåll i kategorier och praktikenheter
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        <CategoryPanel
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        
        <ChildCategoryPanel
          categoryId={selectedCategoryId}
          categoryName={selectedCategory?.name}
        />
      </div>
    </div>
  );
}