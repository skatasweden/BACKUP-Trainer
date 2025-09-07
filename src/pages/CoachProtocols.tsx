import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ProtocolForm } from "@/components/protocols/ProtocolForm";
import { ProtocolList } from "@/components/protocols/ProtocolList";

export default function CoachProtocols() {
  const [showForm, setShowForm] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState(null);

  const handleEdit = (protocol: any) => {
    setEditingProtocol(protocol);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProtocol(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Protokoll</h1>
          <p className="text-muted-foreground">
            Skapa och hantera träningsprotokoll med sets, reps och intensitet
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nytt Protokoll
        </Button>
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProtocol ? "Redigera Protokoll" : "Skapa Nytt Protokoll"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolForm 
              protocol={editingProtocol} 
              onClose={handleCloseForm}
            />
          </CardContent>
        </Card>
      ) : (
        <ProtocolList onEdit={handleEdit} />
      )}
    </div>
  );
}