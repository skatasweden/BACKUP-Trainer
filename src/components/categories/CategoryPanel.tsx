import { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Archive, ArchiveRestore, GripVertical } from 'lucide-react';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useUpdateCategoriesOrder,
  Category 
} from '@/hooks/useCategories';
import { CategoryForm } from './CategoryForm';
import { cn } from '@/lib/utils';

interface CategoryPanelProps {
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string) => void;
}

interface SortableCategoryItemProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggleArchive: () => void;
}

function SortableCategoryItem({ 
  category, 
  isSelected, 
  onSelect, 
  onEdit, 
  onToggleArchive 
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
        category.is_archived && "opacity-60",
        isDragging && "shadow-lg"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          category.is_archived && "line-through text-muted-foreground"
        )}>
          {category.name}
        </p>
      </div>
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost" 
          size="icon"
          className="w-8 h-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleArchive();
          }}
        >
          {category.is_archived ? (
            <ArchiveRestore className="w-3 h-3" />
          ) : (
            <Archive className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function CategoryPanel({ selectedCategoryId, onSelectCategory }: CategoryPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const updateOrderMutation = useUpdateCategoriesOrder();

  // Filter active categories for display and sorting
  const activeCategories = categories.filter(cat => !cat.is_archived);
  const archivedCategories = categories.filter(cat => cat.is_archived);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = activeCategories.findIndex(cat => cat.id === active.id);
    const newIndex = activeCategories.findIndex(cat => cat.id === over.id);
    
    const newOrder = arrayMove(activeCategories, oldIndex, newIndex);
    const updates = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }));

    updateOrderMutation.mutate(updates);
  };

  const handleCreateCategory = (name: string) => {
    const maxOrder = Math.max(...categories.map(cat => cat.sort_order), -1);
    createCategoryMutation.mutate({
      name,
      sort_order: maxOrder + 1,
    });
  };

  const handleEditCategory = (name: string) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        name,
      });
      setEditingCategory(null);
    }
  };

  const handleToggleArchive = (category: Category) => {
    updateCategoryMutation.mutate({
      id: category.id,
      is_archived: !category.is_archived,
    });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Kategorier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Laddar kategorier...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kategorier</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny kategori
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {activeCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Inga kategorier skapade än</p>
              <Button onClick={() => setShowCreateForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Skapa din första kategori
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeCategories.map(cat => cat.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {activeCategories.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      isSelected={selectedCategoryId === category.id}
                      onSelect={() => onSelectCategory(category.id)}
                      onEdit={() => setEditingCategory(category)}
                      onToggleArchive={() => handleToggleArchive(category)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {archivedCategories.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Arkiverade kategorier
              </h4>
              <div className="space-y-2">
                {archivedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-3 border rounded-lg opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate line-through text-muted-foreground">
                        {category.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => handleToggleArchive(category)}
                    >
                      <ArchiveRestore className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        title="Skapa ny kategori"
        description="Skapa en ny kategori för att organisera dina praktikenheter."
        onSubmit={handleCreateCategory}
        isLoading={createCategoryMutation.isPending}
      />

      <CategoryForm
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        title="Redigera kategori"
        description="Ändra namnet på kategorin."
        initialName={editingCategory?.name}
        onSubmit={handleEditCategory}
        isLoading={updateCategoryMutation.isPending}
      />
    </>
  );
}