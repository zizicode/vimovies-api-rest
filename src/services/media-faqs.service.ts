import { supabase } from "@/config/supabase"

/**
 * Servicio para gestionar FAQs de películas.
 * Separado de media.service.ts para mejor organización.
 */
export const MediaFaqsService = {
  /**
   * Obtiene las FAQs de una película.
   */
  async getFaqs(mediaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('article_faqs')
      .select('id, question_es, question_en, answer_es, answer_en, display_order')
      .eq('media_id', mediaId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
