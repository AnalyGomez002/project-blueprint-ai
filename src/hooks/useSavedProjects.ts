import { useState, useEffect } from 'react';
import { ProjectData, ManualData } from '@/pages/Index';
import { designsAPI } from '@/lib/api/designs';
import { Design } from '@/lib/supabase';

export interface SavedProject {
    id: string;
    name: string;
    date: string;
    projectData: ProjectData;
    manualData: ManualData;
}

export const useSavedProjects = () => {
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setIsLoading(true);
            const designs = await designsAPI.getAll();

            // Convertir diseños de Supabase a SavedProject format
            const projects: SavedProject[] = designs.map(design => ({
                id: design.id,
                name: design.name,
                date: new Date(design.created_at).toLocaleDateString(),
                projectData: {
                    renderFiles: [], // No guardamos archivos originales
                    dimensions: design.dimensions,
                    specifications: design.specifications
                },
                manualData: {
                    projectName: design.name,
                    components: design.components.map(c => ({
                        id: c.id,
                        name: c.name,
                        dimensions: c.dimensions,
                        material: c.material,
                        quantity: c.quantity,
                        notes: c.notes
                    })),
                    consumables: []
                }
            }));

            setSavedProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveProject = async (projectData: ProjectData, manualData: ManualData): Promise<SavedProject | null> => {
        try {
            const design = {
                name: manualData.projectName || projectData.specifications.slice(0, 30) || 'Proyecto sin nombre',
                specifications: projectData.specifications,
                dimensions: projectData.dimensions
            };

            const components = manualData.components.map(comp => ({
                name: comp.name,
                dimensions: comp.dimensions,
                material: comp.material,
                quantity: comp.quantity,
                notes: comp.notes
            }));

            const result = await designsAPI.create(design, components);

            const newProject: SavedProject = {
                id: result.design.id,
                name: result.design.name,
                date: new Date(result.design.created_at).toLocaleDateString(),
                projectData,
                manualData
            };

            setSavedProjects([newProject, ...savedProjects]);
            return newProject;
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await designsAPI.delete(id);
            setSavedProjects(savedProjects.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    };

    return {
        savedProjects,
        saveProject,
        deleteProject,
        isLoading,
        refreshProjects: loadProjects
    };
};
