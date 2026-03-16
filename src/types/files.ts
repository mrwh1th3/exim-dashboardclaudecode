export interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  size?: number
  url?: string
  thumbnailUrl?: string
  parentFolderId: string | null
  section: 'social' | 'web'
  clientId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
