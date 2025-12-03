import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Package, Wrench, ListOrdered, FileImage, Loader2, FileText, Save, Calendar, Ruler, Box } from "lucide-react";
import { ManualData, ProjectData } from "@/pages/Index";
import { generatePDF, generateDOCX, downloadBlob } from "@/lib/doc-generator";
import { Badge } from "@/components/ui/badge";
import { SVGPreview } from "@/components/SVGPreview";
import { generateAllSVGs, downloadAllSVGsAsZip } from "@/lib/svg-utils";
import { Component } from "@/lib/types";
import { useMemo, useState, useRef, useEffect } from "react";

interface ManualDisplayProps {
  data: ManualData;
  projectData: ProjectData | null;
  onSave: () => void;
  onReset: () => void;
}

export const ManualDisplay = ({ data, projectData, onSave, onReset }: ManualDisplayProps) => {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const manualRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to manual when it's generated
  useEffect(() => {
    if (manualRef.current) {
      manualRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  // Convert ManualData components to Component type for SVG generation
  const components: Component[] = useMemo(() => {
    return data.components.map((c) => ({
      id: c.id,
      nombre: c.name,
      descripcion: c.notes || "",
      dimensiones: {
        largo: parseFloat(c.dimensions?.split("x")[0]?.trim() || "10"),
        ancho: parseFloat(c.dimensions?.split("x")[1]?.trim() || "2"),
        alto: parseFloat(c.dimensions?.split("x")[2]?.trim() || "10"),
        unidad: "cm",
        forma: "rectangulo", // Default, AI should provide this
      },
      material: {
        tipo: c.material,
        especificaciones: c.notes || "",
        cantidad: typeof c.quantity === 'number' ? c.quantity : parseInt(c.quantity) || 1,
        unidadCantidad: "pz",
      },
      proceso: [],
      notas: c.notes || "",
    }));
  }, [data.components]);

  // Generate all SVGs
  const svgFiles = useMemo(() => generateAllSVGs(components), [components]);

  const handleDownloadPDF = async () => {
    if (!data || !projectData || isDownloadingPDF) return;

    setIsDownloadingPDF(true);
    try {
      // Adaptar ManualData y ProjectData a ProductionManual
      const productionManual = {
        proyecto: {
          nombre: (data.projectName || projectData.specifications || "Proyecto sin nombre"),
          descripcion: projectData.specifications || "Sin descripción",
          dimensionesGenerales: {
            frente: projectData.dimensions.frente,
            fondo: projectData.dimensions.fondo,
            altura: projectData.dimensions.altura,
          },
        },
        fechaGeneracion: new Date().toLocaleDateString(),
        componentes: data.components.map((c, i) => ({
          id: c.id,
          nombre: c.name,
          descripcion: c.notes || "",
          dimensiones: {
            largo: parseFloat(c.dimensions?.split("x")[0]?.trim() || "10"),
            ancho: parseFloat(c.dimensions?.split("x")[1]?.trim() || "2"),
            alto: parseFloat(c.dimensions?.split("x")[2]?.trim() || "10"),
            unidad: "cm",
          },
          material: {
            tipo: c.material,
            especificaciones: c.notes || "",
            cantidad: typeof c.quantity === 'number' ? c.quantity : parseInt(c.quantity) || 1,
            unidadCantidad: "pz",
          },
          proceso: [],
          notas: c.notes || "",
        })),
        consumibles: data.consumables.map((c, i) => ({
          id: c.id,
          nombre: c.name,
          cantidad: c.quantity,
          unidad: c.unit,
          especificaciones: "",
          tipo: "consumible",
        })),
      };

      const projectName = (data.projectName || projectData.specifications || "proyecto")
        .toLowerCase()
        .slice(0, 20)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const filename = `manual_${projectName}.pdf`;

      const pdfBlob = await generatePDF(productionManual, svgFiles);
      downloadBlob(pdfBlob, filename);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!data || !projectData || isDownloadingDOCX) return;

    setIsDownloadingDOCX(true);
    try {
      const productionManual = {
        proyecto: {
          nombre: (data.projectName || projectData.specifications || "Proyecto sin nombre"),
          descripcion: projectData.specifications || "Sin descripción",
          dimensionesGenerales: {
            frente: projectData.dimensions.frente,
            fondo: projectData.dimensions.fondo,
            altura: projectData.dimensions.altura,
          },
        },
        fechaGeneracion: new Date().toLocaleDateString(),
        componentes: data.components.map((c) => ({
          id: c.id,
          nombre: c.name,
          descripcion: c.notes || "",
          dimensiones: {
            largo: parseFloat(c.dimensions?.split("x")[0]?.trim() || "10"),
            ancho: parseFloat(c.dimensions?.split("x")[1]?.trim() || "2"),
            alto: parseFloat(c.dimensions?.split("x")[2]?.trim() || "10"),
            unidad: "cm",
          },
          material: {
            tipo: c.material,
            especificaciones: c.notes || "",
            cantidad: typeof c.quantity === 'number' ? c.quantity : parseInt(c.quantity) || 1,
            unidadCantidad: "pz",
          },
          proceso: [],
          notas: c.notes || "",
        })),
        consumibles: data.consumables.map((c) => ({
          id: c.id,
          nombre: c.name,
          cantidad: c.quantity,
          unidad: c.unit,
          especificaciones: "",
          tipo: "consumible",
        })),
      };

      const projectName = (data.projectName || projectData.specifications || "proyecto")
        .toLowerCase()
        .slice(0, 20)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const filename = `manual_${projectName}.docx`;

      const docxBlob = await generateDOCX(productionManual, svgFiles);
      downloadBlob(docxBlob, filename);
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  const handleDownloadAllSVGs = async () => {
    if (!projectData) return;
    const projectName = data.projectName || projectData.specifications || "proyecto";
    await downloadAllSVGsAsZip(svgFiles, components, projectName);
  };

  // Calculate stats
  const totalComponents = data.components.length;
  const totalConsumables = data.consumables.length;
  const estimatedMaterial = data.components
    .filter(c => c.material.toLowerCase().includes('mdf') || c.material.toLowerCase().includes('madera'))
    .reduce((acc, curr) => {
      const qty = parseFloat(curr.quantity) || 0;
      return acc + qty;
    }, 0);

  return (
    <div ref={manualRef} className="space-y-8 animate-fade-in">

      {/* COVER PAGE & ACTIONS */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground p-8 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="mb-2 bg-white/20 text-white hover:bg-white/30 border-none">
              Manual de Producción Generado
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              {data.projectName || projectData?.specifications.slice(0, 40) || "Proyecto Sin Nombre"}
            </h1>
            <div className="flex items-center gap-4 text-primary-foreground/80 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Box className="w-4 h-4" />
                {projectData?.dimensions.frente} x {projectData?.dimensions.fondo} x {projectData?.dimensions.altura} cm
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onReset} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Generar otro manual
            </Button>
            <Button onClick={onSave} variant="secondary" className="shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button
              onClick={handleDownloadDOCX}
              variant="secondary"
              disabled={isDownloadingDOCX}
            >
              {isDownloadingDOCX ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Word
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="default"
              className="bg-white text-primary hover:bg-white/90 shadow-md"
              disabled={isDownloadingPDF}
            >
              {isDownloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              PDF
            </Button>
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Componentes</p>
              <h3 className="text-2xl font-bold">{totalComponents}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
              <Ruler className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Material Estimado (m²)</p>
              <h3 className="text-2xl font-bold">{estimatedMaterial.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Consumibles</p>
              <h3 className="text-2xl font-bold">{totalConsumables}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SVG CUTTING FILES */}
      <Card className="shadow-md border-border/50 overflow-hidden">
        <CardHeader className="bg-secondary/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-primary" />
                Planos de Corte
              </CardTitle>
              <CardDescription>
                Vectores optimizados para CNC y corte láser
              </CardDescription>
            </div>
            <Button onClick={handleDownloadAllSVGs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Descargar Todo (ZIP)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {components.map((component) => (
              <SVGPreview
                key={component.id}
                component={component}
                svgContent={svgFiles[component.id]}
                showDownload={true}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COMPONENTS LIST */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-border/50 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Desglose de Materiales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.components.map((component, index) => (
                <div key={component.id} className="group relative bg-card hover:bg-accent/5 border border-border/50 rounded-xl p-4 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{component.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {component.dimensions}
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {component.material}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">{component.quantity}</span>
                      <p className="text-xs text-muted-foreground">cantidad</p>
                    </div>
                  </div>
                  {component.notes && (
                    <div className="mt-3 pl-12">
                      <p className="text-sm text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-border/50">
                        {component.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR: CONSUMABLES & STEPS */}
        <div className="space-y-6">
          {/* Consumables */}
          <Card className="shadow-md border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="w-4 h-4 text-primary" />
                Consumibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.consumables.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/50">
                  <span className="font-medium text-sm">{item.name}</span>
                  <Badge variant="outline" className="bg-background">
                    {item.quantity} {item.unit}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assembly Steps */}
          {data.assemblySteps && data.assemblySteps.length > 0 && (
            <Card className="shadow-md border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListOrdered className="w-4 h-4 text-primary" />
                  Pasos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 pb-2">
                  {data.assemblySteps.map((step, index) => (
                    <div key={index} className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground block mb-1">Paso {index + 1}</span>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
