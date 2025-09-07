import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProtocols } from "@/hooks/useProtocols";
import { useToast } from "@/hooks/use-toast";

const protocolSchema = z.object({
  name: z.string().min(1, "Namn är obligatoriskt"),
  description: z.string().optional(),
  youtube_url: z.string().url("Ogiltig YouTube URL").optional().or(z.literal("")),
  sets: z.number().min(1, "Minst 1 set"),
  repetitions: z.number().min(1, "Minst 1 repetition"),
  intensity_value: z.number().min(0).max(100, "Intensitet måste vara mellan 0-100"),
  intensity_type: z.enum(["scale", "percentage"])
});

type ProtocolFormData = z.infer<typeof protocolSchema>;

interface ProtocolFormProps {
  protocol?: any;
  onClose: () => void;
}

export function ProtocolForm({ protocol, onClose }: ProtocolFormProps) {
  const { createProtocol, updateProtocol } = useProtocols();
  const { toast } = useToast();

  const form = useForm<ProtocolFormData>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      name: protocol?.name || "",
      description: protocol?.description || "",
      youtube_url: protocol?.youtube_url || "",
      sets: protocol?.sets || 3,
      repetitions: protocol?.repetitions || 10,
      intensity_value: protocol?.intensity_value || 70,
      intensity_type: protocol?.intensity_type || "percentage"
    }
  });

  const onSubmit = async (data: ProtocolFormData) => {
    console.log("🔍 PROTOKOLL DEBUG: Försöker skapa protokoll med data:", data);
    try {
      if (protocol) {
        console.log("🔍 PROTOKOLL DEBUG: Uppdaterar befintligt protokoll");
        await updateProtocol.mutateAsync({ id: protocol.id, ...data });
        toast({ title: "Protokoll uppdaterat!" });
      } else {
        console.log("🔍 PROTOKOLL DEBUG: Skapar nytt protokoll");
        const result = await createProtocol.mutateAsync(data);
        console.log("🔍 PROTOKOLL DEBUG: Protokoll skapat framgångsrikt:", result);
        toast({ title: "Protokoll skapat!" });
      }
      onClose();
    } catch (error) {
      console.error("🚨 PROTOKOLL FEL: Något gick fel när protokoll skulle skapas:", error);
      console.error("🚨 PROTOKOLL FEL: Full error object:", error);
      console.error("🚨 PROTOKOLL FEL: Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        status: error?.status,
        statusText: error?.statusText
      });
      toast({ 
        title: "Fel", 
        description: `Något gick fel: ${error?.message || 'Okänt fel'}`,
        variant: "destructive" 
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Namn</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="T.ex. Knäböj 5x5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youtube_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube URL (valfritt)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://youtube.com/watch?v=..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivning (valfritt)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Beskriv protokollet..." rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="sets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antal Sets</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repetitions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repetitioner</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intensity_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intensitet</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intensity_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intensitetstyp</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Procent (%)</SelectItem>
                    <SelectItem value="scale">Skala (1-10)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" disabled={createProtocol.isPending || updateProtocol.isPending}>
            {(createProtocol.isPending || updateProtocol.isPending) 
              ? "Sparar..." 
              : protocol ? "Uppdatera" : "Skapa"} Protokoll
          </Button>
        </div>
      </form>
    </Form>
  );
}