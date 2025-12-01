import { useState } from "react";
import { Header } from "@/components/Header";
import { ProjectForm } from "@/components/ProjectForm";
import { ManualDisplay } from "@/components/ManualDisplay";
import { MaterialsDatabase } from "@/components/MaterialsDatabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ProjectData {
  renderFile: File | null;
  dimensions: {
    frente: number;
    fondo: number;
    altura: number;
  };
  specifications: string;
}

export interface ManualData {
  components: Array<{
    id: string;
    name: string;
    dimensions: string;
    material: string;
    quantity: string;
    notes: string;
  }>;
  consumables: Array<{
    id: string;
    name: string;
    quantity: string;
    unit: string;
  }>;
  assemblySteps?: string[];
}

const Index = () => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [manualData, setManualData] = useState<ManualData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateManual = async (data: ProjectData) => {
    setProjectData(data);
    setIsGenerating(true);
    
    // TODO: Implementar llamada a la IA
    // Por ahora, datos de ejemplo
    setTimeout(() => {
      setManualData({
        components: [
          {
            id: "1",
            name: "Panel Frontal",
            dimensions: "200 x 250 x 1.8 cm",
            material: "MDF 18mm",
            quantity: "1.25 m²",
            notes: "Corte recto, acabado con vinilo blanco mate"
          },
          {
            id: "2",
            name: "Estructura Base",
            dimensions: "200 x 100 cm",
            material: "PTR 1\" x 1\"",
            quantity: "6 metros lineales",
            notes: "Soldadura en esquinas, pintura anticorrosiva negra"
          }
        ],
        consumables: [
          {
            id: "1",
            name: "Tira LED",
            quantity: "8",
            unit: "metros"
          },
          {
            id: "2",
            name: "Vinilo de corte",
            quantity: "2.5",
            unit: "m²"
          },
          {
            id: "3",
            name: "Tornillos",
            quantity: "50",
            unit: "piezas"
          }
        ],
        assemblySteps: [
          "Cortar paneles de MDF según especificaciones",
          "Construir estructura base con PTR",
          "Soldar y reforzar esquinas",
          "Montar paneles sobre estructura",
          "Instalar sistema de iluminación LED",
          "Aplicar vinilo y acabados finales"
        ]
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="generator">Generador</TabsTrigger>
            <TabsTrigger value="materials">Base de Materiales</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-8">
            <div className="max-w-4xl mx-auto">
              <ProjectForm 
                onSubmit={handleGenerateManual}
                isGenerating={isGenerating}
              />
            </div>
            
            {manualData && (
              <div className="max-w-6xl mx-auto animate-fade-in">
                <ManualDisplay 
                  data={manualData}
                  projectData={projectData}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="materials">
            <MaterialsDatabase />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
