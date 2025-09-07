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
  useChildCategories, 
  useCreateChildCategory, 
  useUpdateChildCategory, 
  useUpdateChildCategoriesOrder,
  ChildCategory 
} from '@/hooks/useCategories';
import { CategoryForm } from './CategoryForm';
import { cn } from '@/lib/utils';

interface ChildCategoryPanelProps {
  categoryId?: string;
  categoryName?: string;
}

interface SortableChildCategoryItemProps {
  childCategory: ChildCategory;
  onEdit: () => void;
  onToggleArchive: () => void;
}

function SortableChildCategoryItem({ 
  childCategory, 
  onEdit, 
  onToggleArchive 
}: SortableChildCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: childCategory.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 border rounded-lg transition-colors",
        "border-border hover:bg-muted/50",
        childCategory.is_archived && "opacity-60",
        isDragging && "shadow-lg"
      )}
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
          childCategory.is_archived && "line-through text-muted-foreground"
        )}>
          {childCategory.name}
        </p>
      </div>
      
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          onClick={onEdit}
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost" 
          size="icon"
          className="w-8 h-8"
          onClick={onToggleArchive}
        >
          {childCategory.is_archived ? (
            <ArchiveRestore className="w-3 h-3" />
          ) : (
            <Archive className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function ChildCategoryPanel({ categoryId, categoryName }: ChildCategoryPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChildCategory, setEditingChildCategory] = useState<ChildCategory | null>(null);
  
  const { data: childCategories = [], isLoading } = useChildCategories(categoryId);
  const createChildCategoryMutation = useCreateChildCategory();
  const updateChildCategoryMutation = useUpdateChildCategory();
  const updateOrderMutation = useUpdateChildCategoriesOrder();

  // Filter active and archived child categories
  const activeChildCategories = childCategories.filter(child => !child.is_archived);
  const archivedChildCategories = childCategories.filter(child => child.is_archived);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!categoryId) return;
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = activeChildCategories.findIndex(child => child.id === active.id);
    const newIndex = activeChildCategories.findIndex(child => child.id === over.id);
    
    const newOrder = arrayMove(activeChildCategories, oldIndex, newIndex);
    const updates = newOrder.map((child, index) => ({
      id: child.id,
      sort_order: index,
    }));

    updateOrderMutation.mutate({
      categoryId,
      childCategories: updates,
    });
  };

  const handleCreateChildCategory = (name: string) => {
    if (!categoryId) return;
    
    const maxOrder = Math.max(...childCategories.map(child => child.sort_order), -1);
    createChildCategoryMutation.mutate({
      category_id: categoryId,
      name,
      sort_order: maxOrder + 1,
    });
  };

  const handleEditChildCategory = (name: string) => {
    if (editingChildCategory && categoryId) {
      updateChildCategoryMutation.mutate({
        id: editingChildCategory.id,
        category_id: categoryId,
        name,
      });
      setEditingChildCategory(null);
    }
  };

  const handleToggleArchive = (childCategory: ChildCategory) => {
    if (!categoryId) return;
    
    updateChildCategoryMutation.mutate({
      id: childCategory.id,
      category_id: categoryId,
      is_archived: !childCategory.is_archived,
    });
  };

  if (!categoryId) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Praktikenheter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground text-center">
              Välj en kategori för att visa dess praktikenheter
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Praktikenheter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Laddar praktikenheter...</p>
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
            <div>
              <CardTitle>Praktikenheter</CardTitle>
              {categoryName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Kategori: {categoryName}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny praktikenhet
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {activeChildCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Inga praktikenheter skapade än</p>
              <Button onClick={() => setShowCreateForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Skapa din första praktikenhet
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeChildCategories.map(child => child.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {activeChildCategories.map((childCategory) => (
                    <SortableChildCategoryItem
                      key={childCategory.id}
                      childCategory={childCategory}
                      onEdit={() => setEditingChildCategory(childCategory)}
                      onToggleArchive={() => handleToggleArchive(childCategory)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {archivedChildCategories.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Arkiverade praktikenheter
              </h4>
              <div className="space-y-2">
                {archivedChildCategories.map((childCategory) => (
                  <div
                    key={childCategory.id}
                    className="flex items-center gap-2 p-3 border rounded-lg opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate line-through text-muted-foreground">
                        {childCategory.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => handleToggleArchive(childCategory)}
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
        title="Skapa ny praktikenhet"
        description="Skapa en ny praktikenhet inom denna kategori."
        onSubmit={handleCreateChildCategory}
        isLoading={createChildCategoryMutation.isPending}
      />

      <CategoryForm
        open={!!editingChildCategory}
        onOpenChange={(open) => !open && setEditingChildCategory(null)}
        title="Redigera praktikenhet"
        description="Ändra namnet på praktikenheten."
        initialName={editingChildCategory?.name}
        onSubmit={handleEditChildCategory}
        isLoading={updateChildCategoryMutation.isPending}
      />
    </>
  );
}