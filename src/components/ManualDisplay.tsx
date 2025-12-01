import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Package, Wrench, ListOrdered } from "lucide-react";
import { ManualData, ProjectData } from "@/pages/Index";
// Importar el generador de PDF y utilidad de descarga
// Update the import path below to the correct location of your doc-generator-ts file.
// For example, if the file is in 'src/utils/doc-generator-ts.ts', use the following import:
import { generatePDF, downloadBlob } from "@/lib/doc-generator.ts";
import { Badge } from "@/components/ui/badge";

interface ManualDisplayProps {
  data: ManualData;
  projectData: ProjectData | null;
}

export const ManualDisplay = ({ data, projectData }: ManualDisplayProps) => {
  const handleDownload = async () => {
    if (!data || !projectData) return;

    // Adaptar ManualData y ProjectData a ProductionManual
    const productionManual = {
      proyecto: {
        // No hay nombre explícito, usamos specifications como nombre del proyecto
        nombre: (projectData.specifications || "Proyecto sin nombre"),
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
          largo: c.dimensions?.split("x")[0]?.trim() || "",
          ancho: c.dimensions?.split("x")[1]?.trim() || "",
          alto: c.dimensions?.split("x")[2]?.trim() || "",
          unidad: "cm",
        },
        material: {
          tipo: c.material,
          especificaciones: c.notes || "",
          cantidad: c.quantity,
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
        // Consumibles no tienen especificaciones, dejamos vacío
        especificaciones: "",
        tipo: "consumible",
      })),
    };

    // Generar y descargar el PDF
    const pdfBlob = await generatePDF(productionManual);
    downloadBlob(pdfBlob, `${productionManual.proyecto.nombre || "manual"}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/95">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Manual de Producción Generado</CardTitle>
              <CardDescription>
                {projectData && (
                  <span className="text-sm">
                    Dimensiones: {projectData.dimensions.frente} x {projectData.dimensions.fondo} x {projectData.dimensions.altura} cm
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={handleDownload} className="shadow-accent">
              <Download className="w-4 h-4 mr-2" />
              Descargar Manual
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Components Section */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Componentes de Fabricación
          </CardTitle>
          <CardDescription>
            Desglose detallado de cada elemento necesario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.components.map((component, index) => (
              <div key={component.id}>
                <div className="space-y-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{component.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-background/50">
                          {component.dimensions}
                        </Badge>
                        <Badge variant="secondary">{component.material}</Badge>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {component.quantity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{component.notes}</p>
                </div>
                {index < data.components.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consumables Section */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Consumibles y Materiales
          </CardTitle>
          <CardDescription>
            Materiales adicionales necesarios para el ensamblaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.consumables.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{item.name}</h4>
                  <Badge className="bg-accent/20 text-accent-foreground hover:bg-accent/30">
                    {item.quantity} {item.unit}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assembly Steps */}
      {data.assemblySteps && data.assemblySteps.length > 0 && (
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-primary" />
              Secuencia de Ensamblaje
            </CardTitle>
            <CardDescription>
              Pasos sugeridos para el armado del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {data.assemblySteps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-foreground pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
