import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseForm } from '@/components/exercises/ExerciseForm';
import { ExerciseList } from '@/components/exercises/ExerciseList';
import { useExercises, useCreateExercise } from '@/hooks/useExercises';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Search, Filter, CheckSquare } from 'lucide-react';

export default function CoachExercises() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: exercises = [], isLoading } = useExercises(
    selectedCategoryId || undefined,
    searchQuery || undefined
  );
  const { data: categories = [] } = useCategories();
  const createExerciseMutation = useCreateExercise();

  const handleCreateExercise = (data: any) => {
    createExerciseMutation.mutate(data);
    setShowCreateForm(false);
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategoryId(value === 'all' ? '' : value);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Övningar</h1>
            <p className="text-muted-foreground">
              Skapa och administrera träningsövningar för dina atleter
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="btn-hero flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Skapa övning
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {exercises.filter(e => !e.is_archived).length}
                </p>
                <p className="text-sm text-muted-foreground">Aktiva övningar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {exercises.filter(e => e.is_archived).length}
                </p>
                <p className="text-sm text-muted-foreground">Arkiverade övningar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {categories.filter(c => !c.is_archived).length}
                </p>
                <p className="text-sm text-muted-foreground">Kategorier</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Sök & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök övningar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategoryId || 'all'} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Alla kategorier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kategorier</SelectItem>
                  {categories
                    .filter(cat => !cat.is_archived)
                    .map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                {isSelectionMode ? 'Avsluta val' : 'Välj flera'}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Exercise List */}
        <ExerciseList 
          exercises={exercises} 
          isLoading={isLoading}
          isSelectionMode={isSelectionMode}
        />

        {/* Create Exercise Form */}
        <ExerciseForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          title="Skapa ny övning"
          description="Fyll i information för den nya övningen"
          onSubmit={handleCreateExercise}
          isLoading={createExerciseMutation.isPending}
        />
      </div>
    </div>
  );
}