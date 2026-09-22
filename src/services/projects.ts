import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface ProjectRecord extends RecordModel {
  user_id: string
  cliente: string
  modelo: string
  data: string
  vendedor: string
  projeto: string
  responsavel: string
  include_ambiente: boolean
  render_imagem?: string
  ambiente_imagem?: string
  desenho_imagem?: string
}

export interface SaveProjectPayload {
  id?: string
  cliente: string
  modelo: string
  data: string
  vendedor: string
  projeto: string
  responsavel: string
  include_ambiente: boolean
  render_file?: File | null
  ambiente_file?: File | null
  desenho_file?: File | null
}

export const getProjects = async (): Promise<ProjectRecord[]> => {
  return await pb.collection('projects').getFullList<ProjectRecord>({
    sort: '-created',
  })
}

export const getProjectById = async (id: string): Promise<ProjectRecord> => {
  return await pb.collection('projects').getOne<ProjectRecord>(id)
}

export const saveProject = async (
  payload: SaveProjectPayload,
  userId: string,
): Promise<ProjectRecord> => {
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('cliente', payload.cliente)
  formData.append('modelo', payload.modelo)
  formData.append('data', payload.data)
  formData.append('vendedor', payload.vendedor)
  formData.append('projeto', payload.projeto)
  formData.append('responsavel', payload.responsavel)
  formData.append('include_ambiente', payload.include_ambiente ? 'true' : 'false')

  if (payload.render_file) {
    formData.append('render_imagem', payload.render_file)
  }
  if (payload.ambiente_file) {
    formData.append('ambiente_imagem', payload.ambiente_file)
  }
  if (payload.desenho_file) {
    formData.append('desenho_imagem', payload.desenho_file)
  }

  if (payload.id) {
    return await pb.collection('projects').update<ProjectRecord>(payload.id, formData)
  } else {
    return await pb.collection('projects').create<ProjectRecord>(formData)
  }
}

export const deleteProject = async (id: string): Promise<boolean> => {
  return await pb.collection('projects').delete(id)
}

export const getProjectFileUrl = (
  record: ProjectRecord,
  filename?: string,
  thumb?: string,
): string => {
  if (!filename) return ''
  return pb.files.getURL(record, filename, { thumb })
}
