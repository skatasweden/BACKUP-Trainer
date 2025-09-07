import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Trash2, Copy } from "lucide-react";
import { useBlockVariants } from "@/hooks/useBlocks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VariantTabsProps {
  blockId: string;
  activeVariant: string;
  onVariantChange: (variant: string) => void;
}

export function VariantTabs({ blockId, activeVariant, onVariantChange }: VariantTabsProps) {
  const { variants, createVariant, deleteVariant } = useBlockVariants(blockId);

  const handleAddVariant = async () => {
    const existingLabels = variants.data?.map(v => v.variant_label) || [];
    const nextLabel = String.fromCharCode(65 + existingLabels.length); // A, B, C, etc.
    
    try {
      await createVariant.mutateAsync({
        block_id: blockId,
        variant_label: nextLabel,
        name: `Variant ${nextLabel}`,
        sort_order: existingLabels.length,
      });
      onVariantChange(nextLabel);
    } catch (error) {
      console.error("Failed to create variant:", error);
    }
  };

  const handleDeleteVariant = async (variantId: string, variantLabel: string) => {
    if (variants.data && variants.data.length <= 1) {
      return; // Don't delete the last variant
    }

    try {
      await deleteVariant.mutateAsync(variantId);
      
      // If we deleted the active variant, switch to the first available one
      if (activeVariant === variantLabel && variants.data) {
        const remainingVariants = variants.data.filter(v => v.variant_label !== variantLabel);
        if (remainingVariants.length > 0) {
          onVariantChange(remainingVariants[0].variant_label);
        }
      }
    } catch (error) {
      console.error("Failed to delete variant:", error);
    }
  };

  const canDeleteVariant = (variants.data?.length || 0) > 1;

  return (
    <div className="flex items-center justify-between">
      <Tabs value={activeVariant} onValueChange={onVariantChange}>
        <TabsList>
          {variants.data?.map((variant) => (
            <div key={variant.id} className="flex items-center">
              <TabsTrigger value={variant.variant_label} className="relative">
                {variant.variant_label}
                {variant.name && variant.name !== `Variant ${variant.variant_label}` && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {variant.name}
                  </Badge>
                )}
              </TabsTrigger>
              
              {canDeleteVariant && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      onClick={() => {
                        // TODO: Implement duplicate variant
                        console.log("Duplicate variant:", variant.id);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicera
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteVariant(variant.id, variant.variant_label)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </TabsList>
      </Tabs>

      <Button variant="outline" size="sm" onClick={handleAddVariant}>
        <Plus className="h-4 w-4 mr-2" />
        Lägg till variant
      </Button>
    </div>
  );
}