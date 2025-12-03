import { supabase, Design, Component } from '../supabase';

export const designsAPI = {
    /**
     * Crear un nuevo diseño con sus componentes
     */
    async create(
        design: Omit<Design, 'id' | 'created_at'>,
        components: Omit<Component, 'id' | 'design_id' | 'created_at'>[]
    ) {
        // Insertar diseño
        const { data: designData, error: designError } = await supabase
            .from('designs')
            .insert(design)
            .select()
            .single();

        if (designError) throw designError;

        // Insertar componentes asociados
        if (components.length > 0) {
            const componentsWithDesignId = components.map(c => ({
                ...c,
                design_id: designData.id
            }));

            const { data: componentsData, error: componentsError } = await supabase
                .from('components')
                .insert(componentsWithDesignId)
                .select();

            if (componentsError) throw componentsError;

            return { design: designData, components: componentsData };
        }

        return { design: designData, components: [] };
    },

    /**
     * Obtener todos los diseños
     */
    async getAll() {
        const { data, error } = await supabase
            .from('designs')
            .select('*, components(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as (Design & { components: Component[] })[];
    },

    /**
     * Obtener un diseño por ID con sus componentes
     */
    async getById(id: string) {
        const { data: design, error: designError } = await supabase
            .from('designs')
            .select('*')
            .eq('id', id)
            .single();

        if (designError) throw designError;

        const { data: components, error: componentsError } = await supabase
            .from('components')
            .select('*')
            .eq('design_id', id);

        if (componentsError) throw componentsError;

        return { design: design as Design, components: components as Component[] };
    },

    /**
     * Eliminar un diseño (cascada elimina componentes y manuales)
     */
    async delete(id: string) {
        // Primero obtener los archivos asociados para eliminarlos del storage
        const { data: manuals } = await supabase
            .from('manuals')
            .select('pdf_url, docx_url, svg_urls')
            .eq('design_id', id);

        // Eliminar archivos del storage
        if (manuals && manuals.length > 0) {
            const filesToDelete: string[] = [];

            manuals.forEach(manual => {
                if (manual.pdf_url) {
                    const path = manual.pdf_url.split('/design-files/')[1];
                    if (path) filesToDelete.push(path);
                }
                if (manual.docx_url) {
                    const path = manual.docx_url.split('/design-files/')[1];
                    if (path) filesToDelete.push(path);
                }
                if (manual.svg_urls && manual.svg_urls.length > 0) {
                    manual.svg_urls.forEach(url => {
                        const path = url.split('/design-files/')[1];
                        if (path) filesToDelete.push(path);
                    });
                }
            });

            if (filesToDelete.length > 0) {
                await supabase.storage.from('design-files').remove(filesToDelete);
            }
        }

        // Eliminar diseño (la cascada eliminará componentes y manuales automáticamente)
        const { error } = await supabase
            .from('designs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
