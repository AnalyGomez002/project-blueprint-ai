import { supabase, Material } from '../supabase';

export const materialsAPI = {
    /**
     * Obtener todos los materiales
     */
    async getAll() {
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;
        return data as Material[];
    },

    /**
     * Crear un nuevo material
     */
    async create(material: Omit<Material, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('materials')
            .insert(material)
            .select()
            .single();

        if (error) throw error;
        return data as Material;
    },

    /**
     * Actualizar un material existente
     */
    async update(id: string, material: Partial<Omit<Material, 'id' | 'created_at'>>) {
        const { data, error } = await supabase
            .from('materials')
            .update(material)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Material;
    },

    /**
     * Eliminar un material
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
