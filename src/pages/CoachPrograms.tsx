import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePrograms, type Program } from "@/hooks/usePrograms";
import { useProgramItems } from "@/hooks/usePrograms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProgramAccessManager } from "@/components/programs/ProgramAccessManager";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Search, Trash2, Copy, Edit, Video, Image as ImageIcon, Users, ShoppingCart, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function to format price with billing interval
function formatPrice(price: number, currency: string, billing_interval: string, billing_interval_count: number): string {
  const currencySymbol = currency === 'SEK' ? 'kr' : currency === 'USD' ? '$' : '€';
  
  if (billing_interval === 'one_time') {
    return `${price} ${currencySymbol}`;
  }
  
  const intervalText = billing_interval === 'monthly' ? 'mån' : 
                     billing_interval === 'weekly' ? 'vecka' : 
                     billing_interval === 'daily' ? 'dag' : billing_interval;
  
  const countText = billing_interval_count > 1 ? ` (var ${billing_interval_count}:e ${intervalText})` : '';
  
  return `${price} ${currencySymbol}/${intervalText}${countText}`;
}

interface ProgramCardProps {
  program: Program;
  onEdit: (program: Program) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateSettings: (program: Program) => void;
}

function ProgramCard({ program, onEdit, onDelete, onDuplicate, onUpdateSettings }: ProgramCardProps) {
  const { programItems } = useProgramItems(program.id);
  const workoutCount = programItems.data?.length || 0;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="p-4">
        <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
          {program.cover_image_url ? (
            <img 
              src={program.cover_image_url} 
              alt={program.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2">{program.name}</CardTitle>
        {program.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.short_description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="secondary">
            {workoutCount} träningspass
          </Badge>
          {program.video_url && (
            <Badge variant="outline" className="gap-1">
              <Video className="h-3 w-3" />
              Video
            </Badge>
          )}
          {program.is_purchasable && (
            <Badge variant="outline" className="gap-1 text-green-600">
              <ShoppingCart className="h-3 w-3" />
              {program.price ? formatPrice(program.price, program.currency, program.billing_interval, program.billing_interval_count) : 'Köpbar'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Skapad {formatDistanceToNow(new Date(program.created_at), { 
            addSuffix: true, 
            locale: sv 
          })}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(program)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-1" />
          Redigera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateSettings(program)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDuplicate(program.id)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Radera program</AlertDialogTitle>
              <AlertDialogDescription>
                Är du säker på att du vill radera "{program.name}"? Detta kan inte ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(program.id)}>
                Radera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export default function CoachPrograms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAccessManager, setShowAccessManager] = useState(false);
  const navigate = useNavigate();
  const { programs, createProgram, updateProgram, deleteProgram, duplicateProgram } = usePrograms();
  const { toast } = useToast();

  const handleCreateProgram = async () => {
    try {
      const newProgram = await createProgram.mutateAsync({
        name: "Nytt träningsprogram",
        short_description: "Beskrivning av programmet",
        currency: "SEK",
        billing_interval: "one_time",
        billing_interval_count: 1,
        is_purchasable: false,
      });
      
      navigate(`/coach/programs/builder/${newProgram.id}`);
      toast({
        title: "Program skapat",
        description: "Ditt nya träningsprogram har skapats.",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte skapa programmet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleEditProgram = (program: Program) => {
    navigate(`/coach/programs/builder/${program.id}`);
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await deleteProgram.mutateAsync(id);
      toast({
        title: "Program raderat",
        description: "Programmet har raderats.",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte radera programmet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateProgram = async (id: string) => {
    try {
      await duplicateProgram.mutateAsync(id);
      toast({
        title: "Program duplicerat",
        description: "En kopia av programmet har skapats.",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte duplicera programmet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSettings = (program: Program) => {
    setSelectedProgram(program);
    setShowSettingsDialog(true);
  };

  const handleShowAccessManager = (program: Program) => {
    setSelectedProgram(program);
    setShowAccessManager(true);
  };

  const handleSaveSettings = async (settings: { 
    price?: number; 
    currency: string;
    billing_interval: 'one_time' | 'monthly' | 'weekly' | 'daily';
    billing_interval_count: number;
    is_purchasable: boolean 
  }) => {
    if (!selectedProgram) return;
    
    try {
      await updateProgram.mutateAsync({
        id: selectedProgram.id,
        ...settings,
      });
      setShowSettingsDialog(false);
      setSelectedProgram(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const filteredPrograms = programs.data?.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (programs.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar träningsprogram...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Träningsprogram</h1>
          <p className="text-muted-foreground">
            Skapa och hantera dina träningsprogram
          </p>
        </div>
        <Button onClick={handleCreateProgram} disabled={createProgram.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt program
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredPrograms.length === 0 && !programs.isLoading && (
        <div className="text-center py-12">
          {searchQuery ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Inga program hittades</h3>
              <p className="text-muted-foreground mb-4">
                Inga program matchar din sökning "{searchQuery}"
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Inga program än</h3>
              <p className="text-muted-foreground mb-4">
                Skapa ditt första träningsprogram för att komma igång
              </p>
              <Button onClick={handleCreateProgram}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa ditt första program
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onEdit={handleEditProgram}
              onDelete={handleDeleteProgram}
              onDuplicate={handleDuplicateProgram}
              onUpdateSettings={handleUpdateSettings}
            />
        ))}
      </div>

      {/* Program Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Program Inställningar</DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <ProgramSettingsForm 
              program={selectedProgram}
              onSave={handleSaveSettings}
              onCancel={() => setShowSettingsDialog(false)}
              onShowAccessManager={() => {
                setShowSettingsDialog(false);
                handleShowAccessManager(selectedProgram);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Access Manager Dialog */}
      <Dialog open={showAccessManager} onOpenChange={setShowAccessManager}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hantera Åtkomst - {selectedProgram?.name}</DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <ProgramAccessManager 
              programId={selectedProgram.id}
              programName={selectedProgram.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for program settings form
function ProgramSettingsForm({ 
  program, 
  onSave, 
  onCancel, 
  onShowAccessManager 
}: {
  program: Program;
  onSave: (settings: { 
    price?: number; 
    currency: string;
    billing_interval: 'one_time' | 'monthly' | 'weekly' | 'daily';
    billing_interval_count: number;
    is_purchasable: boolean 
  }) => void;
  onCancel: () => void;
  onShowAccessManager: () => void;
}) {
  const [isPurchasable, setIsPurchasable] = useState(program.is_purchasable);
  const [price, setPrice] = useState(program.price?.toString() || "");
  const [currency, setCurrency] = useState(program.currency || "SEK");
  const [billingInterval, setBillingInterval] = useState(program.billing_interval || "one_time");
  const [billingIntervalCount, setBillingIntervalCount] = useState(program.billing_interval_count || 1);

  const handleSubmit = () => {
    onSave({
      is_purchasable: isPurchasable,
      price: isPurchasable && price ? parseFloat(price) : undefined,
      currency,
      billing_interval: billingInterval,
      billing_interval_count: billingIntervalCount,
    });
  };

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'SEK': return 'kr';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return curr;
    }
  };

  const getBillingText = () => {
    if (billingInterval === 'one_time') return 'Engångspris';
    const intervalText = billingInterval === 'monthly' ? 'månad' : 
                       billingInterval === 'weekly' ? 'vecka' : 
                       billingInterval === 'daily' ? 'dag' : billingInterval;
    return billingIntervalCount > 1 ? `Var ${billingIntervalCount}:e ${intervalText}` : `Per ${intervalText}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="purchasable"
          checked={isPurchasable}
          onCheckedChange={setIsPurchasable}
        />
        <Label htmlFor="purchasable">Gör program köpbart</Label>
      </div>

      {isPurchasable && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Pris</Label>
              <Input
                id="price"
                type="number"
                placeholder="29.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="3.00"
                step="0.01"
              />
              {parseFloat(price) > 0 && parseFloat(price) < 3.00 && (
                <p className="text-xs text-destructive mt-1">
                  Minimum pris är 3.00 SEK (Stripe krav)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="currency">Valuta</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj valuta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEK">SEK (kr)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="billing">Betalningsmodell</Label>
            <Select value={billingInterval} onValueChange={(value: 'one_time' | 'monthly' | 'weekly' | 'daily') => setBillingInterval(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj betalningsmodell" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">Engångspris</SelectItem>
                <SelectItem value="monthly">Månadsvis</SelectItem>
                <SelectItem value="weekly">Veckovis</SelectItem>
                <SelectItem value="daily">Dagligen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {billingInterval !== 'one_time' && (
            <div>
              <Label htmlFor="interval_count">Intervall (valfritt)</Label>
              <Input
                id="interval_count"
                type="number"
                placeholder="1"
                value={billingIntervalCount}
                onChange={(e) => setBillingIntervalCount(parseInt(e.target.value) || 1)}
                min="1"
                max="12"
              />
              <p className="text-xs text-muted-foreground mt-1">
                T.ex. "2" för "var 2:a vecka"
              </p>
            </div>
          )}

          {price && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Förhandsvisning:</Label>
              <p className="text-sm text-muted-foreground">
                {price} {getCurrencySymbol(currency)} {billingInterval !== 'one_time' && `- ${getBillingText()}`}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSubmit} className="flex-1">
          Spara
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Avbryt
        </Button>
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="outline"
          onClick={onShowAccessManager}
          className="w-full"
        >
          <Users className="h-4 w-4 mr-2" />
          Hantera Atlet Åtkomst
        </Button>
      </div>
    </div>
  );
}