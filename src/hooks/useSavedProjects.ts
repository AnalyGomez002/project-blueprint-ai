import { useState, useEffect } from 'react';
import { ProjectData, ManualData } from '@/pages/Index';

export interface SavedProject {
    id: string;
    name: string;
    date: string;
    projectData: ProjectData;
    manualData: ManualData;
}

export const useSavedProjects = () => {
    const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('saved_projects');
        if (stored) {
            try {
                setSavedProjects(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing saved projects', e);
            }
        }
    }, []);

    const saveProject = (projectData: ProjectData, manualData: ManualData) => {
        const newProject: SavedProject = {
            id: Date.now().toString(),
            name: projectData.specifications.slice(0, 30) || 'Proyecto sin nombre',
            date: new Date().toLocaleDateString(),
            projectData,
            manualData
        };

        const updated = [newProject, ...savedProjects];
        setSavedProjects(updated);
        localStorage.setItem('saved_projects', JSON.stringify(updated));
        return newProject;
    };

    const deleteProject = (id: string) => {
        const updated = savedProjects.filter(p => p.id !== id);
        setSavedProjects(updated);
        localStorage.setItem('saved_projects', JSON.stringify(updated));
    };

    return {
        savedProjects,
        saveProject,
        deleteProject
    };
};
