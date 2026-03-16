import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FileItem } from '@/types/files'
import { mockFiles } from '@/data/mock-files'

interface FilesState {
  files: FileItem[]

  getChildren: (parentId: string | null, section: 'social' | 'web', clientId: string) => FileItem[]
  createFolder: (name: string, parentId: string | null, section: 'social' | 'web', clientId: string) => void
  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  renameItem: (id: string, name: string) => void
  deleteItem: (id: string) => void
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set, get) => ({
      files: mockFiles,

      getChildren: (parentId, section, clientId) => {
        return get().files.filter(
          (f) =>
            f.parentFolderId === parentId &&
            f.section === section &&
            f.clientId === clientId
        )
      },

      createFolder: (name, parentId, section, clientId) =>
        set((state) => ({
          files: [
            ...state.files,
            {
              id: `folder-${Date.now()}`,
              name,
              type: 'folder' as const,
              parentFolderId: parentId,
              section,
              clientId,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      addFile: (file) =>
        set((state) => ({
          files: [
            ...state.files,
            {
              ...file,
              id: `file-${Date.now()}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      renameItem: (id, name) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f
          ),
        })),

      deleteItem: (id) =>
        set((state) => {
          // Recursively collect all children if it's a folder
          const idsToDelete = new Set<string>([id])
          const collectChildren = (parentId: string) => {
            state.files.forEach((f) => {
              if (f.parentFolderId === parentId) {
                idsToDelete.add(f.id)
                if (f.type === 'folder') collectChildren(f.id)
              }
            })
          }
          const item = state.files.find((f) => f.id === id)
          if (item?.type === 'folder') collectChildren(id)

          return { files: state.files.filter((f) => !idsToDelete.has(f.id)) }
        }),
    }),
    {
      name: 'exim-files',
    }
  )
)
