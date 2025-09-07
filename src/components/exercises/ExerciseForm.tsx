import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCategories, useChildCategories, useCreateCategory, useCreateChildCategory } from '@/hooks/useCategories';
import { useUploadExerciseImage, Exercise } from '@/hooks/useExercises';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { Upload, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const exerciseSchema = z.object({
  title: z.string().min(1, 'Titel är obligatorisk'),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  youtube_url: z.string().url('Ogiltig URL').optional().or(z.literal('')),
  category_id: z.string().optional(),
  child_category_id: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface ExerciseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialData?: Exercise;
  onSubmit: (data: ExerciseFormData & { cover_image_url?: string }) => void;
  isLoading?: boolean;
}

export function ExerciseForm({
  open,
  onOpenChange,
  title,
  description,
  initialData,
  onSubmit,
  isLoading = false,
}: ExerciseFormProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showChildCategoryForm, setShowChildCategoryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: '',
      short_description: '',
      long_description: '',
      youtube_url: '',
      category_id: '',
      child_category_id: '',
    },
  });

  const { data: categories = [] } = useCategories();
  const { data: childCategories = [] } = useChildCategories(selectedCategoryId);
  const uploadImageMutation = useUploadExerciseImage();
  const createCategoryMutation = useCreateCategory();
  const createChildCategoryMutation = useCreateChildCategory();

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        short_description: initialData.short_description || '',
        long_description: initialData.long_description || '',
        youtube_url: initialData.youtube_url || '',
        category_id: initialData.category_id || '',
        child_category_id: initialData.child_category_id || '',
      });
      setSelectedCategoryId(initialData.category_id || '');
      setImagePreview(initialData.cover_image_url || '');
    }
  }, [initialData, form]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (data: ExerciseFormData) => {
    if (isSubmitting || isLoading) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    try {
      let coverImageUrl = initialData?.cover_image_url;

      if (imageFile) {
        coverImageUrl = await uploadImageMutation.mutateAsync(imageFile);
      }

      onSubmit({
        ...data,
        cover_image_url: coverImageUrl,
      });
      
      // Close form immediately after submitting
      handleOpenChange(false);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Det gick inte att ladda upp bilden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'create-new') {
      setShowCategoryForm(true);
    } else {
      setSelectedCategoryId(value);
      form.setValue('category_id', value);
      form.setValue('child_category_id', '');
    }
  };

  const handleChildCategoryChange = (value: string) => {
    if (value === 'create-new') {
      setShowChildCategoryForm(true);
    } else {
      form.setValue('child_category_id', value);
    }
  };

  const handleCreateCategory = (name: string) => {
    createCategoryMutation.mutate({ name, sort_order: 0 });
  };

  const handleCreateChildCategory = (name: string) => {
    if (!selectedCategoryId) {
      toast({
        title: "Fel",
        description: "Välj en huvudkategori först",
        variant: "destructive",
      });
      return;
    }
    createChildCategoryMutation.mutate({
      name,
      category_id: selectedCategoryId,
      sort_order: 0,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setImageFile(null);
      setImagePreview('');
      setSelectedCategoryId('');
      setIsSubmitting(false);
    }
    onOpenChange(newOpen);
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ange övningens titel" disabled={isFormLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="short_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kort beskrivning</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="1-3 meningar som beskriver övningen"
                        rows={2}
                        disabled={isFormLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="long_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detaljerad instruktion</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Detaljerad instruktion för övningen"
                        rows={4}
                        disabled={isFormLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Omslagsbild</Label>
                <div className="mt-2 space-y-2">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isFormLoading}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground border border-border rounded-md hover:bg-secondary/80 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Välj bild
                    </Label>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="youtube_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube-länk</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://youtube.com/watch?v=..." disabled={isFormLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Huvudkategori</FormLabel>
                    <Select value={field.value} onValueChange={handleCategoryChange} disabled={isFormLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj huvudkategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter(cat => !cat.is_archived)
                          .map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        <SelectItem value="create-new">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Skapa ny kategori
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCategoryId && (
                <FormField
                  control={form.control}
                  name="child_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Praktikenhet</FormLabel>
                      <Select value={field.value} onValueChange={handleChildCategoryChange} disabled={isFormLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj praktikenhet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {childCategories
                            .filter(cat => !cat.is_archived)
                            .map(childCategory => (
                              <SelectItem key={childCategory.id} value={childCategory.id}>
                                {childCategory.name}
                              </SelectItem>
                            ))}
                          <SelectItem value="create-new">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Skapa ny praktikenhet
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isFormLoading}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={isFormLoading}>
                  {isFormLoading ? 'Sparar...' : 'Spara'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CategoryForm
        open={showCategoryForm}
        onOpenChange={setShowCategoryForm}
        title="Skapa ny kategori"
        description="Ange namn för den nya kategorin"
        onSubmit={handleCreateCategory}
        isLoading={createCategoryMutation.isPending}
      />

      <CategoryForm
        open={showChildCategoryForm}
        onOpenChange={setShowChildCategoryForm}
        title="Skapa ny praktikenhet"
        description="Ange namn för den nya praktikenheten"
        onSubmit={handleCreateChildCategory}
        isLoading={createChildCategoryMutation.isPending}
      />
    </>
  );
}