import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit?: number;
}

export const MaterialsDatabase = () => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([
    { id: "1", name: "MDF 18mm", category: "Tableros", unit: "m²", pricePerUnit: 450 },
    { id: "2", name: "PTR 1\" x 1\"", category: "Estructuras", unit: "metro", pricePerUnit: 85 },
    { id: "3", name: "Tira LED", category: "Iluminación", unit: "metro", pricePerUnit: 120 },
    { id: "4", name: "Vinilo de corte", category: "Acabados", unit: "m²", pricePerUnit: 280 },
  ]);

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "",
    unit: "",
    pricePerUnit: ""
  });

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.category || !newMaterial.unit) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const material: Material = {
      id: Date.now().toString(),
      name: newMaterial.name,
      category: newMaterial.category,
      unit: newMaterial.unit,
      pricePerUnit: newMaterial.pricePerUnit ? parseFloat(newMaterial.pricePerUnit) : undefined
    };

    setMaterials([...materials, material]);
    setNewMaterial({ name: "", category: "", unit: "", pricePerUnit: "" });
    
    toast({
      title: "Material agregado",
      description: `${material.name} ha sido añadido a la base de datos`
    });
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
    toast({
      title: "Material eliminado",
      description: "El material ha sido eliminado de la base de datos"
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Add Material Form */}
      <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Agregar Nuevo Material
          </CardTitle>
          <CardDescription>
            Añade materiales personalizados a tu base de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="MDF 18mm"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Input
                id="category"
                placeholder="Tableros"
                value={newMaterial.category}
                onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad *</Label>
              <Input
                id="unit"
                placeholder="m²"
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio/Unidad</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="450.00"
                value={newMaterial.pricePerUnit}
                onChange={(e) => setNewMaterial({ ...newMaterial, pricePerUnit: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddMaterial} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Materiales Disponibles
          </CardTitle>
          <CardDescription>
            {materials.length} materiales en la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <h4 className="font-semibold">{material.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {material.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {material.unit}
                      </Badge>
                    </div>
                  </div>
                  {material.pricePerUnit && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        ${material.pricePerUnit.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        por {material.unit}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMaterial(material.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
