import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Ruler, FileText, Sparkles, X, ArrowRight, ArrowUp, ArrowDown, Box, Info } from "lucide-react";
import { ProjectData } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
        title: "Falta el diseño",
        description: "Por favor, sube al menos una imagen o render de tu proyecto.",
        variant: "destructive"
      });
      return;
    }

    if (!dimensions.frente || !dimensions.fondo || !dimensions.altura) {
      toast({
        title: "Dimensiones incompletas",
        description: "Necesitamos las medidas generales para calcular los materiales.",
        variant: "destructive"
      });
      return;
    }

    // Specifications are now optional as AI generates the project name

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
      title: "Iniciando análisis...",
      description: "Nuestra IA está descomponiendo tu diseño en componentes fabricables."
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Nuevo Proyecto de Fabricación
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sube tu diseño y deja que nuestra IA genere el manual de producción completo, incluyendo lista de cortes, materiales y pasos de ensamblaje.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* STEP 1: UPLOAD */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
              <div>
                <CardTitle className="text-lg">Carga de Diseño</CardTitle>
                <CardDescription>Sube renders, planos o bocetos de tu mueble</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative group text-center">
                <Input
                  id="render"
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isGenerating}
                />
                <div className="space-y-4 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Arrastra tus imágenes aquí</p>
                    <p className="text-sm text-muted-foreground mt-1">o haz clic para explorar tus archivos</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary" className="text-xs">JPG</Badge>
                    <Badge variant="secondary" className="text-xs">PNG</Badge>
                    <Badge variant="secondary" className="text-xs">WEBP</Badge>
                  </div>
                </div>
              </div>

              {renderPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6 animate-fade-in">
                  {renderPreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border shadow-sm">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors transform hover:scale-110"
                          disabled={isGenerating}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: DIMENSIONS */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">2</div>
              <div>
                <CardTitle className="text-lg">Dimensiones Generales</CardTitle>
                <CardDescription>Define el tamaño total del objeto terminado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="frente" className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Frente (Ancho)
                </Label>
                <div className="relative">
                  <Input
                    id="frente"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={dimensions.frente}
                    onChange={(e) => setDimensions({ ...dimensions, frente: e.target.value })}
                    disabled={isGenerating}
                    className="pr-12 text-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">cm</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fondo" className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-primary" />
                  Fondo (Profundidad)
                </Label>
                <div className="relative">
                  <Input
                    id="fondo"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={dimensions.fondo}
                    onChange={(e) => setDimensions({ ...dimensions, fondo: e.target.value })}
                    disabled={isGenerating}
                    className="pr-12 text-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">cm</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura" className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-primary" />
                  Altura Total
                </Label>
                <div className="relative">
                  <Input
                    id="altura"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={dimensions.altura}
                    onChange={(e) => setDimensions({ ...dimensions, altura: e.target.value })}
                    disabled={isGenerating}
                    className="pr-12 text-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">cm</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STEP 3: SPECS */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</div>
              <div>
                <CardTitle className="text-lg">Especificaciones Técnicas <span className="text-sm font-normal text-muted-foreground ml-2">(Opcional)</span></CardTitle>
                <CardDescription>Detalles sobre materiales, acabados y estructura</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Alert className="bg-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-medium">Tips para mejores resultados</AlertTitle>
              <AlertDescription className="text-muted-foreground text-sm mt-1">
                Si lo dejas vacío, la IA decidirá los mejores materiales. Puedes especificar detalles si lo prefieres.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="specifications" className="sr-only">Especificaciones</Label>
              <Textarea
                id="specifications"
                placeholder="Ejemplo: Quiero fabricar este mueble en MDF de 18mm... (Opcional)"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                rows={5}
                className="resize-none text-base p-4"
                disabled={isGenerating}
              />
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Analizando Proyecto...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generar Manual de Producción
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Al generar el manual, aceptas que los cálculos son estimaciones basadas en IA y deben ser verificados antes de cortar.
          </p>
        </div>
      </form>
    </div>
  );
};
