import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Ruler, FileText, Sparkles, X } from "lucide-react";
import { ProjectData } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface ProjectFormProps {
  onSubmit: (data: ProjectData) => void;
  isGenerating: boolean;
}

export const ProjectForm = ({ onSubmit, isGenerating }: ProjectFormProps) => {
  const { toast } = useToast();
  const [renderFiles, setRenderFiles] = useState<File[]>([]);
  const [renderPreviews, setRenderPreviews] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({
    frente: "",
    fondo: "",
    altura: ""
  });
  const [specifications, setSpecifications] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setRenderFiles(prev => [...prev, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setRenderPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setRenderFiles(prev => prev.filter((_, i) => i !== index));
    setRenderPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (renderFiles.length === 0) {
      toast({
        title: "Error",
        description: "Por favor, sube al menos un archivo de render",
        variant: "destructive"
      });
      return;
    }

    if (!dimensions.frente || !dimensions.fondo || !dimensions.altura) {
      toast({
        title: "Error",
        description: "Por favor, completa todas las dimensiones",
        variant: "destructive"
      });
      return;
    }

    if (!specifications.trim()) {
      toast({
        title: "Error",
        description: "Por favor, proporciona las especificaciones del proyecto",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      renderFiles,
      dimensions: {
        frente: parseFloat(dimensions.frente),
        fondo: parseFloat(dimensions.fondo),
        altura: parseFloat(dimensions.altura)
      },
      specifications
    });

    toast({
      title: "Generando manual...",
      description: "La IA está analizando tu proyecto"
    });
  };

  return (
    <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <FileText className="w-6 h-6 text-primary" />
          Información del Proyecto
        </CardTitle>
        <CardDescription>
          Proporciona los detalles de tu diseño para generar el manual de producción
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="render" className="flex items-center gap-2 text-base font-medium">
              <Upload className="w-4 h-4 text-primary" />
              Renders del Diseño (puedes seleccionar varios)
            </Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <Input
                id="render"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isGenerating}
              />
              {renderPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {renderPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        disabled={isGenerating}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dimensions Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Ruler className="w-4 h-4 text-primary" />
              Dimensiones Generales (cm)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frente">Frente</Label>
                <Input
                  id="frente"
                  type="number"
                  step="0.1"
                  placeholder="200"
                  value={dimensions.frente}
                  onChange={(e) => setDimensions({ ...dimensions, frente: e.target.value })}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fondo">Fondo</Label>
                <Input
                  id="fondo"
                  type="number"
                  step="0.1"
                  placeholder="100"
                  value={dimensions.fondo}
                  onChange={(e) => setDimensions({ ...dimensions, fondo: e.target.value })}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura">Altura</Label>
                <Input
                  id="altura"
                  type="number"
                  step="0.1"
                  placeholder="250"
                  value={dimensions.altura}
                  onChange={(e) => setDimensions({ ...dimensions, altura: e.target.value })}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="space-y-2">
            <Label htmlFor="specifications" className="text-base font-medium">
              Especificaciones del Proyecto
            </Label>
            <Textarea
              id="specifications"
              placeholder="Describe materiales preferidos, acabados, tipo de iluminación, colores, etc.&#10;&#10;Ejemplo: Estructura de PTR pintada en negro, paneles en MDF blanco con acabado mate, iluminación LED blanco cálido en repisa superior, logo en vinilo de corte dorado..."
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-accent"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Generando Manual...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generar Manual de Producción
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
