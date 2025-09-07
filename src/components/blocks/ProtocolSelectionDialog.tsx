import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProtocols } from "@/hooks/useProtocols";

interface ProtocolSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProtocol: (protocolId: string) => void;
  exerciseTitle: string;
}

export function ProtocolSelectionDialog({
  open,
  onOpenChange,
  onSelectProtocol,
  exerciseTitle,
}: ProtocolSelectionDialogProps) {
  const [search, setSearch] = useState("");
  const { protocols } = useProtocols();

  const filteredProtocols = protocols.data?.filter((protocol) =>
    protocol.name.toLowerCase().includes(search.toLowerCase()) ||
    protocol.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelectProtocol = (protocolId: string) => {
    onSelectProtocol(protocolId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Välj protokoll för "{exerciseTitle}"</DialogTitle>
          <DialogDescription>
            Sök och välj ett protokoll att koppla till övningen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök protokoll..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {protocols.isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredProtocols.length > 0 ? (
              filteredProtocols.map((protocol) => (
                <Card
                  key={protocol.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectProtocol(protocol.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{protocol.name}</h3>
                          {protocol.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {protocol.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {protocol.sets && (
                          <Badge variant="secondary" className="text-xs">
                            {protocol.sets} sets
                          </Badge>
                        )}
                        {protocol.repetitions && (
                          <Badge variant="secondary" className="text-xs">
                            {protocol.repetitions} reps
                          </Badge>
                        )}
                        {protocol.intensity_value && (
                          <Badge variant="outline" className="text-xs">
                            {protocol.intensity_value}{protocol.intensity_type === 'percentage' ? '%' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {search ? "Inga protokoll matchade din sökning" : "Inget protokoll hittades"}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}