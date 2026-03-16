import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { FileItem } from '@/types/files'

function mapFile(row: Record<string, unknown>): FileItem {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as 'file' | 'folder',
    mimeType: row.mime_type as string | undefined,
    size: row.size as number | undefined,
    url: row.storage_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/${row.section === 'social' ? 'social-files' : 'web-files'}/${row.storage_path}`
      : undefined,
    thumbnailUrl: row.thumbnail_path as string | undefined,
    parentFolderId: (row.parent_folder_id as string | null) ?? null,
    section: row.section as 'social' | 'web',
    clientId: row.client_id as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getFiles(
  clientId: string,
  section: 'social' | 'web',
  parentFolderId?: string | null
): Promise<FileItem[]> {
  const supabase = await createClient()
  let query = supabase
    .from('files')
    .select('*')
    .eq('client_id', clientId)
    .eq('section', section)
    .order('type', { ascending: false }) // folders first
    .order('name', { ascending: true })

  if (parentFolderId === null || parentFolderId === undefined) {
    query = query.is('parent_folder_id', null)
  } else {
    query = query.eq('parent_folder_id', parentFolderId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapFile)
}

export async function createFolder(data: {
  name: string
  section: 'social' | 'web'
  clientId: string
  createdBy: string
  parentFolderId?: string
}): Promise<FileItem> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('files')
    .insert({
      name: data.name,
      type: 'folder',
      section: data.section,
      client_id: data.clientId,
      created_by: data.createdBy,
      parent_folder_id: data.parentFolderId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapFile(result)
}

export async function deleteFile(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('files').delete().eq('id', id)
}

export async function renameFile(id: string, name: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('files').update({ name }).eq('id', id)
}

// Client-side upload (used in file-manager component)
export async function uploadToStorage(
  file: File,
  section: 'social' | 'web',
  clientId: string,
  createdBy: string,
  parentFolderId?: string
): Promise<FileItem> {
  const supabase = createBrowserClient()
  const bucket = section === 'social' ? 'social-files' : 'web-files'
  const storagePath = `${clientId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file)
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)

  const { data: result, error: dbError } = await supabase
    .from('files')
    .insert({
      name: file.name,
      type: 'file',
      mime_type: file.type,
      size: file.size,
      storage_path: storagePath,
      section,
      client_id: clientId,
      created_by: createdBy,
      parent_folder_id: parentFolderId ?? null,
    })
    .select()
    .single()
  if (dbError) throw dbError

  return { ...mapFile(result), url: urlData.publicUrl }
}
