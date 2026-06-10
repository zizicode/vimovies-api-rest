import { supabase } from "@/config/supabase"
import { SupportedLocale, VideoSite, VideoType } from "@/enums"



/**
 * Servicio para gestionar videos individuales de películas.
 * Separado de media.service.ts para mejor organización.
 */
export const MediaVideosService = {
  /**
   * Obtiene los videos de una película.
   */
  async getVideos(mediaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('media_videos')
      .select('*')
      .eq('media_id', mediaId)
      .order('is_official', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /**
   * Agrega un video a una película.
   */
  async addVideo(mediaId: string, video: {
    locale: SupportedLocale
    video_type: VideoType
    video_site: VideoSite
    external_key: string
    title?: string | null
    published_at?: string | null
    is_official: boolean
  }): Promise<void> {
    const { error } = await supabase
      .from('media_videos')
      .insert({ ...video, media_id: mediaId })

    if (error) throw error
  },

  /**
   * Elimina un video de una película.
   */
  async removeVideo(videoId: string): Promise<void> {
    const { error } = await supabase
      .from('media_videos')
      .delete()
      .eq('id', videoId)

    if (error) throw error
  },

  /**
   * Actualiza un video.
   */
  async updateVideo(videoId: string, updates: {
    title?: string | null
    published_at?: string | null
    is_official?: boolean
  }): Promise<void> {
    const { error } = await supabase
      .from('media_videos')
      .update(updates)
      .eq('id', videoId)

    if (error) throw error
  },
}
