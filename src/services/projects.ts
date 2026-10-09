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
  version?: number
  parent_id?: string
  version_notes?: string
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
  existing_render_imagem?: string
  existing_ambiente_imagem?: string
  existing_desenho_imagem?: string
  version_notes?: string
  // If true, forces in-place update of current record instead of branching a new version
  overwriteCurrentVersion?: boolean
}

/**
 * Helper to fetch a remote file URL and convert it to a File object
 * so PocketBase can duplicate/reattach it to a new version record.
 */
async function urlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new File([blob], filename, { type: blob.type || 'image/jpeg' })
  } catch (e) {
    console.warn(`Erro ao converter arquivo de imagem ${filename} para File:`, e)
    return null
  }
}

export const getProjects = async (): Promise<ProjectRecord[]> => {
  return await pb.collection('projects').getFullList<ProjectRecord>({
    sort: '-created',
  })
}

export const getProjectById = async (id: string): Promise<ProjectRecord> => {
  return await pb.collection('projects').getOne<ProjectRecord>(id)
}

/**
 * Fetches all versions belonging to a project lineage.
 * If record has parent_id, root is parent_id; otherwise record.id is root.
 */
export const getProjectVersions = async (project: ProjectRecord): Promise<ProjectRecord[]> => {
  const rootId = project.parent_id || project.id
  // Find the root project and all projects whose parent_id is rootId
  const filter = `id = "${rootId}" || parent_id = "${rootId}"`
  const versions = await pb.collection('projects').getFullList<ProjectRecord>({
    filter,
    sort: '-version,-created',
  })

  // Defensive filter: only include versions matching this project's client name (case-insensitive)
  // to avoid displaying records from another project if parent_id was previously corrupted
  const targetCliente = (project.cliente || '').trim().toLowerCase()
  const filtered = versions.filter((v) => (v.cliente || '').trim().toLowerCase() === targetCliente)
  return filtered.length > 0 ? filtered : versions
}

export const saveProject = async (
  payload: SaveProjectPayload,
  userId: string,
): Promise<{ record: ProjectRecord; isNewVersion: boolean }> => {
  // If no existing ID, this is a brand new project (v1)
  if (!payload.id) {
    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('cliente', payload.cliente)
    formData.append('modelo', payload.modelo)
    formData.append('data', payload.data)
    formData.append('vendedor', payload.vendedor)
    formData.append('projeto', payload.projeto)
    formData.append('responsavel', payload.responsavel)
    formData.append('include_ambiente', payload.include_ambiente ? 'true' : 'false')
    formData.append('version', '1')
    if (payload.version_notes) {
      formData.append('version_notes', payload.version_notes)
    }

    if (payload.render_file) {
      formData.append('render_imagem', payload.render_file)
    }
    if (payload.ambiente_file) {
      formData.append('ambiente_imagem', payload.ambiente_file)
    }
    if (payload.desenho_file) {
      formData.append('desenho_imagem', payload.desenho_file)
    }

    const record = await pb.collection('projects').create<ProjectRecord>(formData)
    return { record, isNewVersion: false }
  }

  // If payload.id exists and overwriteCurrentVersion is true, perform simple update
  if (payload.overwriteCurrentVersion) {
    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('cliente', payload.cliente)
    formData.append('modelo', payload.modelo)
    formData.append('data', payload.data)
    formData.append('vendedor', payload.vendedor)
    formData.append('projeto', payload.projeto)
    formData.append('responsavel', payload.responsavel)
    formData.append('include_ambiente', payload.include_ambiente ? 'true' : 'false')
    if (payload.version_notes) {
      formData.append('version_notes', payload.version_notes)
    }

    if (payload.render_file) {
      formData.append('render_imagem', payload.render_file)
    }
    if (payload.ambiente_file) {
      formData.append('ambiente_imagem', payload.ambiente_file)
    }
    if (payload.desenho_file) {
      formData.append('desenho_imagem', payload.desenho_file)
    }

    const record = await pb.collection('projects').update<ProjectRecord>(payload.id, formData)
    return { record, isNewVersion: false }
  }

  // Otherwise: CREATE A NEW VERSION (v2, v3, ...) keeping previous versions intact
  // 1. Fetch current record to find rootId and calculate highest version number
  const currentRecord = await getProjectById(payload.id)

  // CRITICAL SAFETY CHECK:
  // If the user modified the 'cliente' name completely (or it doesn't match the current record's
  // lineage), they are designing a different project and should NOT branch off an unrelated project's lineage!
  const isDifferentProject =
    payload.cliente.trim().toLowerCase() !== (currentRecord.cliente || '').trim().toLowerCase()

  if (isDifferentProject) {
    // Treat as brand new independent project (v1)
    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('cliente', payload.cliente)
    formData.append('modelo', payload.modelo)
    formData.append('data', payload.data)
    formData.append('vendedor', payload.vendedor)
    formData.append('projeto', payload.projeto)
    formData.append('responsavel', payload.responsavel)
    formData.append('include_ambiente', payload.include_ambiente ? 'true' : 'false')
    formData.append('version', '1')
    if (payload.version_notes) {
      formData.append('version_notes', payload.version_notes)
    }

    if (payload.render_file) {
      formData.append('render_imagem', payload.render_file)
    } else if (payload.existing_render_imagem) {
      const fileUrl = getProjectFileUrl(currentRecord, payload.existing_render_imagem)
      const fileObj = await urlToFile(fileUrl, payload.existing_render_imagem)
      if (fileObj) formData.append('render_imagem', fileObj)
    }

    if (payload.ambiente_file) {
      formData.append('ambiente_imagem', payload.ambiente_file)
    } else if (payload.existing_ambiente_imagem) {
      const fileUrl = getProjectFileUrl(currentRecord, payload.existing_ambiente_imagem)
      const fileObj = await urlToFile(fileUrl, payload.existing_ambiente_imagem)
      if (fileObj) formData.append('ambiente_imagem', fileObj)
    }

    if (payload.desenho_file) {
      formData.append('desenho_imagem', payload.desenho_file)
    } else if (payload.existing_desenho_imagem) {
      const fileUrl = getProjectFileUrl(currentRecord, payload.existing_desenho_imagem)
      const fileObj = await urlToFile(fileUrl, payload.existing_desenho_imagem)
      if (fileObj) formData.append('desenho_imagem', fileObj)
    }

    const record = await pb.collection('projects').create<ProjectRecord>(formData)
    return { record, isNewVersion: false }
  }

  const rootId = currentRecord.parent_id || currentRecord.id

  // 2. Query all existing versions in this lineage to compute next version number
  const existingLineage = await pb.collection('projects').getFullList<ProjectRecord>({
    filter: `id = "${rootId}" || parent_id = "${rootId}"`,
  })

  let maxVersion = 1
  for (const item of existingLineage) {
    const v = Number(item.version) || 1
    if (v > maxVersion) {
      maxVersion = v
    }
  }
  const nextVersion = maxVersion + 1

  // 3. Assemble FormData for the new version record
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('parent_id', rootId)
  formData.append('version', String(nextVersion))
  formData.append('cliente', payload.cliente)
  formData.append('modelo', payload.modelo)
  formData.append('data', payload.data)
  formData.append('vendedor', payload.vendedor)
  formData.append('projeto', payload.projeto)
  formData.append('responsavel', payload.responsavel)
  formData.append('include_ambiente', payload.include_ambiente ? 'true' : 'false')
  if (payload.version_notes) {
    formData.append('version_notes', payload.version_notes)
  }

  // Handle files: if new File uploaded, append it.
  // If no new File uploaded but an existing file exists in previous record, re-fetch and copy it!
  if (payload.render_file) {
    formData.append('render_imagem', payload.render_file)
  } else if (payload.existing_render_imagem) {
    const fileUrl = getProjectFileUrl(currentRecord, payload.existing_render_imagem)
    const fileObj = await urlToFile(fileUrl, payload.existing_render_imagem)
    if (fileObj) {
      formData.append('render_imagem', fileObj)
    }
  }

  if (payload.ambiente_file) {
    formData.append('ambiente_imagem', payload.ambiente_file)
  } else if (payload.existing_ambiente_imagem) {
    const fileUrl = getProjectFileUrl(currentRecord, payload.existing_ambiente_imagem)
    const fileObj = await urlToFile(fileUrl, payload.existing_ambiente_imagem)
    if (fileObj) {
      formData.append('ambiente_imagem', fileObj)
    }
  }

  if (payload.desenho_file) {
    formData.append('desenho_imagem', payload.desenho_file)
  } else if (payload.existing_desenho_imagem) {
    const fileUrl = getProjectFileUrl(currentRecord, payload.existing_desenho_imagem)
    const fileObj = await urlToFile(fileUrl, payload.existing_desenho_imagem)
    if (fileObj) {
      formData.append('desenho_imagem', fileObj)
    }
  }

  const record = await pb.collection('projects').create<ProjectRecord>(formData)
  return { record, isNewVersion: true }
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
