import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProjectForm } from "@/components/ProjectForm";
import { ManualDisplay } from "@/components/ManualDisplay";
import { MaterialsDatabase } from "@/components/MaterialsDatabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AnalyzingSummary } from "@/components/AnalyzingSummary";
import { useSavedProjects, SavedProject } from "@/hooks/useSavedProjects";
import { SavedProjectsList } from "@/components/SavedProjectsList";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { materialsAPI } from "@/lib/api/materials";
import { Material } from "@/lib/supabase";

export interface ProjectData {
  renderFiles: File[];
  dimensions: {
    frente: number;
    fondo: number;
    altura: number;
  };
  specifications: string;
}

export interface ManualData {
  projectName?: string;
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
  const { toast } = useToast();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [manualData, setManualData] = useState<ManualData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { saveProject, deleteProject } = useSavedProjects();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);

  // Cargar materiales al montar el componente
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const materials = await materialsAPI.getAll();
      setAvailableMaterials(materials);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const handleSaveProject = async () => {
    if (projectData && manualData) {
      const result = await saveProject(projectData, manualData);
      if (result) {
        toast({
          title: "Proyecto Guardado",
          description: "El proyecto se ha guardado exitosamente en Supabase.",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el proyecto",
          variant: "destructive"
        });
      }
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    setProjectData(project.projectData);
    setManualData(project.manualData);
    setIsSheetOpen(false);
    toast({
      title: "Proyecto Cargado",
      description: `Se ha cargado el proyecto "${project.name}".`,
    });
  };

  const handleReset = () => {
    setProjectData(null);
    setManualData(null);
    setIsGenerating(false);
  };

  const handleGenerateManual = async (data: ProjectData) => {
    setProjectData(data);
    setIsGenerating(true);

    try {
      // ==========================================
      // PASO 1: CONVERTIR IMAGEN A BASE64
      // ==========================================

      const imageParts = await Promise.all(data.renderFiles.map(async (file) => {
        // Detectar el MIME type del archivo
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let mimeType = "image/png";

        if (fileExtension === "jpg" || fileExtension === "jpeg") {
          mimeType = "image/jpeg";
        } else if (fileExtension === "png") {
          mimeType = "image/png";
        } else if (fileExtension === "webp") {
          mimeType = "image/webp";
        } else if (fileExtension === "pdf") {
          mimeType = "application/pdf";
        }

        // Convertir el archivo a base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remover el prefijo "data:image/xxx;base64," para obtener solo el base64
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        };
      }));

      console.log(`[ANALYZE] ${imageParts.length} archivos convertidos a base64`);

      // ==========================================
      // PASO 2: PREPARAR PROMPT PARA GEMINI
      // ==========================================
      const dimsText = `Frente: ${data.dimensions.frente} cm, Fondo: ${data.dimensions.fondo} cm, Altura: ${data.dimensions.altura} cm`;

      // Preparar lista de materiales disponibles para la IA
      const materialsText = availableMaterials.length > 0
        ? `\n\nMateriales disponibles en inventario:\n${availableMaterials.map(m => `- ${m.name} (${m.category}, ${m.unit})`).join('\n')}`
        : '';

      const geminiPrompt = `
        Analiza este render arquitectónico/de mueble y devuelve un JSON con componentes fabricables.
        
        IMPORTANTE - Devuelve EXACTAMENTE esta estructura JSON:
        {
          "project_name": "Nombre creativo y descriptivo del proyecto basado en el diseño",
          "components": [
            {
              "name": "nombre descriptivo",
              "type": "rect|panel|led|light|cylinder|box|text|logo",
              "bbox_pct": {"x": 0-100, "y": 0-100, "w": 0-100, "h": 0-100},
              "approx_pct_width": 0-100,
              "approx_pct_height": 0-100,
              "depth_cm": número,
              "color": "color del componente",
              "suggested_material": "Usa preferiblemente los materiales disponibles en inventario",
              "quantity": número,
              "brand": "marca si aplica",
              "notes": "detalles de fabricación"
            }
          ]
        }
        
        Dimensiones reales: ${dimsText}
        Especificaciones adicionales: ${data.specifications}${materialsText}
        
        IMPORTANTE: Prioriza el uso de los materiales disponibles en inventario para las sugerencias.
        
        SOLO devuelve el objeto JSON, sin texto adicional ni markdown.
      `;

      // ==========================================
      // PASO 3: LLAMAR A LA API DE GEMINI A TRAVÉS DEL EDGE FUNCTION
      // ==========================================
      console.log('[ANALYZE] Llamando a Gemini API...');

      // Llamada directa a la API de Gemini
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('VITE_GEMINI_API_KEY no está configurada');
      }
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                ...imageParts,
                {
                  text: geminiPrompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[ANALYZE] Error response:', errorData);
        throw new Error(errorData.error?.message || 'Error al llamar a la API de Gemini');
      }

      const geminiResponse = await response.json();
      // Extraer el texto de la respuesta
      const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Extraer JSON del response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      console.log('[GEMINI] Parsed successfully:', parsed ? 'yes' : 'no');

      if (!parsed || !parsed.components || parsed.components.length === 0) {
        throw new Error('No se recibieron componentes de la IA');
      }

      const componentsFromAI = parsed.components;
      const generatedProjectName = parsed.project_name || "Proyecto Generado";

      // ==========================================
      // PASO 4: PROCESAR Y CALCULAR COMPONENTES
      // ==========================================
      const processedComponents: ManualData['components'] = [];
      const consumablesMap = new Map<string, { quantity: number; unit: string }>();

      componentsFromAI.forEach((comp: any, index: number) => {
        // Calcular dimensiones reales basadas en porcentajes
        const width_cm = (comp.approx_pct_width / 100) * data.dimensions.frente;
        const height_cm = (comp.approx_pct_height / 100) * data.dimensions.altura;
        const depth_cm = comp.depth_cm || data.dimensions.fondo * 0.1;

        // Calcular área en m²
        const area_m2 = (width_cm / 100) * (height_cm / 100);

        // Calcular consumibles según el tipo de componente
        // LED: perímetro del componente si es tipo LED o light
        if (comp.type?.toLowerCase().includes('led') || comp.type?.toLowerCase().includes('light')) {
          const led_meters = ((width_cm + height_cm) * 2) / 100;
          const currentLED = consumablesMap.get('Tira LED') || { quantity: 0, unit: 'metros' };
          consumablesMap.set('Tira LED', {
            quantity: currentLED.quantity + led_meters,
            unit: 'metros'
          });
        }

        // Pintura: basada en el área
        if (area_m2 > 0.1) { // Solo para componentes significativos
          const paint_liters = area_m2 / 8; // ~8m² por litro
          const currentPaint = consumablesMap.get('Pintura') || { quantity: 0, unit: 'litros' };
          consumablesMap.set('Pintura', {
            quantity: currentPaint.quantity + paint_liters,
            unit: 'litros'
          });
        }

        // Tornillos: basados en el perímetro
        const screws = Math.ceil((width_cm * 2 + height_cm * 2) / 25); // ~1 tornillo cada 25cm
        const currentScrews = consumablesMap.get('Tornillos') || { quantity: 0, unit: 'piezas' };
        consumablesMap.set('Tornillos', {
          quantity: currentScrews.quantity + screws,
          unit: 'piezas'
        });

        // Vinilo: para componentes de tipo logo o text
        if (comp.type?.toLowerCase().includes('logo') || comp.type?.toLowerCase().includes('text')) {
          const currentVinyl = consumablesMap.get('Vinilo de corte') || { quantity: 0, unit: 'm²' };
          consumablesMap.set('Vinilo de corte', {
            quantity: currentVinyl.quantity + area_m2,
            unit: 'm²'
          });
        }

        // Determinar la cantidad según el material
        let quantityDisplay = "";
        if (comp.suggested_material === "MDF" || comp.suggested_material === "Madera") {
          quantityDisplay = `${area_m2.toFixed(2)} m²`;
        } else if (comp.suggested_material === "PTR" || comp.suggested_material === "Aluminio") {
          const linear_meters = ((width_cm + height_cm) * 2) / 100;
          quantityDisplay = `${linear_meters.toFixed(2)} metros lineales`;
        } else if (comp.suggested_material === "LED") {
          const led_meters = ((width_cm + height_cm) * 2) / 100;
          quantityDisplay = `${led_meters.toFixed(2)} metros`;
        } else if (comp.suggested_material === "Vinilo") {
          quantityDisplay = `${area_m2.toFixed(2)} m²`;
        } else {
          quantityDisplay = `${comp.quantity || 1} unidad(es)`;
        }

        processedComponents.push({
          id: String(index + 1),
          name: comp.name,
          dimensions: `${width_cm.toFixed(1)} x ${height_cm.toFixed(1)} x ${depth_cm.toFixed(1)} cm`,
          material: `${comp.suggested_material}${comp.depth_cm ? ` ${comp.depth_cm}mm` : ''}`,
          quantity: quantityDisplay,
          notes: `${comp.notes}${comp.color ? ` - Color: ${comp.color}` : ''}${comp.brand ? ` - Marca: ${comp.brand}` : ''}`
        });
      });

      // ==========================================
      // PASO 5: PREPARAR CONSUMIBLES
      // ==========================================
      const consumables: ManualData['consumables'] = Array.from(consumablesMap.entries()).map(
        ([name, data], index) => ({
          id: String(index + 1),
          name,
          quantity: data.quantity.toFixed(2),
          unit: data.unit
        })
      );

      // ==========================================
      // PASO 6: GENERAR PASOS DE ENSAMBLAJE
      // ==========================================
      const assemblySteps = [
        "Preparar y cortar todos los materiales según especificaciones",
        "Construir la estructura base y reforzar uniones",
        "Ensamblar paneles principales sobre la estructura",
        "Instalar sistemas de iluminación y cableado",
        "Aplicar acabados finales (pintura, vinilo, etc.)",
        "Realizar pruebas de funcionalidad y ajustes finales"
      ];

      // ==========================================
      // PASO 7: ESTABLECER RESULTADO FINAL Y GUARDAR
      // ==========================================
      const finalManualData = {
        projectName: generatedProjectName,
        components: processedComponents,
        consumables,
        assemblySteps
      };

      setManualData(finalManualData);

      // Guardar automáticamente en Supabase
      try {
        const savedProject = await saveProject(data, finalManualData);
        if (savedProject) {
          console.log('[ANALYZE] Proyecto guardado en Supabase:', savedProject.id);
          toast({
            title: "Proyecto guardado automáticamente",
            description: "Tu manual ha sido guardado en la nube exitosamente.",
          });
        }
      } catch (saveError) {
        console.error('[ANALYZE] Error guardando en Supabase:', saveError);
        toast({
          title: "Error al guardar",
          description: saveError instanceof Error ? saveError.message : "No se pudo guardar el proyecto automáticamente.",
          variant: "destructive"
        });
      }

      console.log('[ANALYZE] Manual generado exitosamente');

    } catch (error) {
      console.error('[ANALYZE ERROR]', error);
      setManualData(null);

      toast({
        title: "Error al generar el manual",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="generator" className="w-full">
          <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="generator">Generador</TabsTrigger>
              <TabsTrigger value="materials">Base de Materiales</TabsTrigger>
            </TabsList>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Mis Proyectos
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-4">
                  <SheetTitle>Proyectos Guardados</SheetTitle>
                </SheetHeader>
                <SavedProjectsList onLoadProject={handleLoadProject} />
              </SheetContent>
            </Sheet>
          </div>

          <TabsContent value="generator" className="space-y-8">
            {/* Show form only if NOT generating AND NO manual data */}
            {!isGenerating && !manualData && (
              <div className="max-w-4xl mx-auto animate-fade-in">
                <ProjectForm
                  onSubmit={handleGenerateManual}
                  isGenerating={isGenerating}
                />
              </div>
            )}

            {/* Show summary while analyzing */}
            {isGenerating && !manualData && projectData && (
              <div className="max-w-4xl mx-auto animate-fade-in">
                <AnalyzingSummary projectData={projectData} />
              </div>
            )}

            {/* Show generated manual */}
            {manualData && (
              <div className="max-w-6xl mx-auto animate-fade-in">
                <ManualDisplay
                  data={manualData}
                  projectData={projectData}
                  onSave={handleSaveProject}
                  onReset={handleReset}
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
