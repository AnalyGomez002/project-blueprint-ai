import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Database, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { materialsAPI } from "@/lib/api/materials";
import { Material } from "@/lib/supabase";

export const MaterialsDatabase = () => {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newMaterial, setNewMaterial] = useState({
    name: "",
    category: "",
    unit: "",
    price_per_unit: ""
  });

  // Cargar materiales al montar el componente
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await materialsAPI.getAll();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.category || !newMaterial.unit) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const materialData = {
        name: newMaterial.name,
        category: newMaterial.category,
        unit: newMaterial.unit,
        price_per_unit: newMaterial.price_per_unit ? parseFloat(newMaterial.price_per_unit) : undefined
      };

      const createdMaterial = await materialsAPI.create(materialData);
      setMaterials([...materials, createdMaterial]);
      setNewMaterial({ name: "", category: "", unit: "", price_per_unit: "" });

      toast({
        title: "Material agregado",
        description: `${createdMaterial.name} ha sido añadido a la base de datos`
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el material",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await materialsAPI.delete(id);
      setMaterials(materials.filter(m => m.id !== id));
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado de la base de datos"
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el material",
        variant: "destructive"
      });
    }
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
                value={newMaterial.price_per_unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, price_per_unit: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddMaterial} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </>
                )}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay materiales en la base de datos. Agrega el primero arriba.
            </div>
          ) : (
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
                    {material.price_per_unit && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">
                          ${material.price_per_unit.toFixed(2)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
