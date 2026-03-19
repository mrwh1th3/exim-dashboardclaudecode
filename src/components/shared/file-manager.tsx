'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { FileItem } from '@/types/files'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { toast } from 'sonner'
import {
  FolderIcon,
  FileIcon,
  Upload,
  FolderPlus,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  ImageIcon,
  Loader2,
} from 'lucide-react'

interface FileManagerProps {
  section: 'social' | 'web'
  clientId?: string
  isAdmin: boolean
}

interface ClientOption {
  id: string
  displayName: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function isImageMime(mimeType?: string): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

function mapFile(row: Record<string, unknown>, signedUrls: Map<string, string>): FileItem {
  const storagePath = row.storage_path as string | null
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as 'file' | 'folder',
    mimeType: row.mime_type as string | undefined,
    size: row.size as number | undefined,
    url: storagePath ? signedUrls.get(storagePath) : undefined,
    thumbnailUrl: storagePath && isImageMime(row.mime_type as string) ? signedUrls.get(storagePath) : undefined,
    parentFolderId: (row.parent_folder_id as string | null) ?? null,
    section: row.section as 'social' | 'web',
    clientId: row.client_id as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function FileManager({ section, clientId, isAdmin }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || 'all')

  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Load clients for admin dropdown
  useEffect(() => {
    if (!isAdmin) return
    async function loadClients() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .eq('role', 'client')
        .order('full_name')
      setClients(
        (data ?? []).map((c: any) => ({
          id: c.id,
          displayName: c.company_name ?? c.full_name ?? '',
        }))
      )
    }
    loadClients()
  }, [isAdmin, supabase])

  // Load files from Supabase
  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('section', section)
        .order('type', { ascending: false })
        .order('name', { ascending: true })

      // Filter by client
      if (!isAdmin && clientId) {
        query = query.eq('client_id', clientId)
      } else if (isAdmin && selectedClientId !== 'all') {
        query = query.eq('client_id', selectedClientId)
      }

      const { data, error } = await query
      if (error) throw error

      // Get signed URLs for files with storage paths
      const bucket = section === 'social' ? 'social-files' : 'web-files'
      const signedUrls = new Map<string, string>()

      const filesWithPaths = (data ?? []).filter((f: any) => f.storage_path)
      if (filesWithPaths.length > 0) {
        const paths = filesWithPaths.map((f: any) => f.storage_path)
        const { data: urls } = await supabase.storage
          .from(bucket)
          .createSignedUrls(paths, 3600) // 1 hour expiry

        urls?.forEach((item: any) => {
          if (item.signedUrl) {
            const path = paths[urls.indexOf(item)]
            signedUrls.set(path, item.signedUrl)
          }
        })
      }

      setFiles((data ?? []).map((row: any) => mapFile(row, signedUrls)))
    } catch (err) {
      console.error('Error loading files:', err)
      toast.error('Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }, [supabase, section, isAdmin, clientId, selectedClientId])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [
      { id: null, name: 'Inicio' },
    ]
    let folderId = currentFolderId
    const visited = new Set<string>()
    while (folderId) {
      if (visited.has(folderId)) break
      visited.add(folderId)
      const folder = files.find((f) => f.id === folderId)
      if (folder) {
        crumbs.splice(1, 0, { id: folder.id, name: folder.name })
        folderId = folder.parentFolderId
      } else {
        break
      }
    }
    return crumbs
  }, [currentFolderId, files])

  const filteredFiles = useMemo(() => {
    return files.filter((f) => f.parentFolderId === currentFolderId)
  }, [files, currentFolderId])

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })
  }, [filteredFiles])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const effectiveClientId = isAdmin
      ? selectedClientId === 'all'
        ? clients[0]?.id
        : selectedClientId
      : clientId

    if (!effectiveClientId) {
      toast.error('Selecciona un cliente primero')
      return
    }

    try {
      const { data: user } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: newFolderName.trim(),
          type: 'folder',
          section,
          client_id: effectiveClientId,
          created_by: user.user?.id,
          parent_folder_id: currentFolderId,
        })
        .select()
        .single()

      if (error) throw error

      setFiles((prev) => [...prev, mapFile(data, new Map())])
      setNewFolderName('')
      setNewFolderOpen(false)
      toast.success('Carpeta creada exitosamente')
    } catch (err) {
      console.error('Error creating folder:', err)
      toast.error('Error al crear la carpeta')
    }
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    const effectiveClientId = isAdmin
      ? selectedClientId === 'all'
        ? clients[0]?.id
        : selectedClientId
      : clientId

    if (!effectiveClientId) {
      toast.error('Selecciona un cliente primero')
      return
    }

    setUploading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      const bucket = section === 'social' ? 'social-files' : 'web-files'
      const newItems: FileItem[] = []

      for (const file of Array.from(uploadedFiles)) {
        const storagePath = `${effectiveClientId}/${Date.now()}_${file.name}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file)

        if (uploadError) throw uploadError

        // Get signed URL
        const { data: urlData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, 3600)

        // Insert into database
        const { data: dbData, error: dbError } = await supabase
          .from('files')
          .insert({
            name: file.name,
            type: 'file',
            mime_type: file.type,
            size: file.size,
            storage_path: storagePath,
            section,
            client_id: effectiveClientId,
            created_by: user.user?.id,
            parent_folder_id: currentFolderId,
          })
          .select()
          .single()

        if (dbError) throw dbError

        const signedUrls = new Map<string, string>()
        if (urlData?.signedUrl) {
          signedUrls.set(storagePath, urlData.signedUrl)
        }
        newItems.push(mapFile(dbData, signedUrls))
      }

      setFiles((prev) => [...prev, ...newItems])
      toast.success(newItems.length + ' archivo(s) subido(s)')
    } catch (err) {
      console.error('Error uploading files:', err)
      toast.error('Error al subir archivos')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return
    try {
      const { error } = await supabase
        .from('files')
        .update({ name: renameName.trim() })
        .eq('id', renameTarget.id)

      if (error) throw error

      setFiles((prev) =>
        prev.map((f) =>
          f.id === renameTarget.id
            ? { ...f, name: renameName.trim(), updatedAt: new Date().toISOString() }
            : f
        )
      )
      setRenameOpen(false)
      setRenameTarget(null)
      setRenameName('')
      toast.success('Nombre actualizado')
    } catch (err) {
      console.error('Error renaming:', err)
      toast.error('Error al renombrar')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      // Collect all IDs to delete (folder and children)
      const idsToDelete = new Set<string>()
      const pathsToDelete: string[] = []

      const collectChildren = (parentId: string) => {
        idsToDelete.add(parentId)
        const item = files.find((f) => f.id === parentId)
        if (item?.type === 'file' && item.url) {
          // Extract storage path from the file
          const fileData = files.find((f) => f.id === parentId)
          if (fileData) {
            pathsToDelete.push(`${fileData.clientId}/${fileData.name}`)
          }
        }
        files
          .filter((f) => f.parentFolderId === parentId)
          .forEach((f) => collectChildren(f.id))
      }
      collectChildren(deleteTarget.id)

      // Delete from storage if it's a file
      if (deleteTarget.type === 'file') {
        const bucket = section === 'social' ? 'social-files' : 'web-files'
        // Get the storage path from the database
        const { data: fileData } = await supabase
          .from('files')
          .select('storage_path')
          .eq('id', deleteTarget.id)
          .single()

        if (fileData?.storage_path) {
          await supabase.storage.from(bucket).remove([fileData.storage_path])
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .in('id', Array.from(idsToDelete))

      if (error) throw error

      setFiles((prev) => prev.filter((f) => !idsToDelete.has(f.id)))
      setDeleteOpen(false)
      setDeleteTarget(null)
      toast.success('Eliminado exitosamente')
    } catch (err) {
      console.error('Error deleting:', err)
      toast.error('Error al eliminar')
    }
  }

  const openRename = (item: FileItem) => {
    setRenameTarget(item)
    setRenameName(item.name)
    setRenameOpen(true)
  }

  const openDelete = (item: FileItem) => {
    setDeleteTarget(item)
    setDeleteOpen(true)
  }

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id)
    } else {
      setPreviewItem(item)
      setPreviewOpen(true)
    }
  }

  const getFileTypeLabel = (item: FileItem): string => {
    if (item.type === 'folder') return 'Carpeta'
    if (!item.mimeType) return 'Archivo'
    if (item.mimeType.startsWith('image/')) return 'Imagen'
    if (item.mimeType.startsWith('video/')) return 'Video'
    if (item.mimeType.includes('pdf')) return 'PDF'
    if (item.mimeType.includes('word') || item.mimeType.includes('document')) return 'Documento'
    if (item.mimeType.includes('sheet') || item.mimeType.includes('excel')) return 'Hoja de cálculo'
    return 'Archivo'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, idx) => (
          <div key={crumb.id ?? 'root'} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className={'hover:underline ' + (
                idx === breadcrumbs.length - 1
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Nueva Carpeta
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Subir Archivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleUploadFile}
        />

        <div className="flex items-center gap-1 ml-auto">
          {isAdmin && (
            <Select value={selectedClientId} onValueChange={(val) => { if (val) setSelectedClientId(val) }}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="icon"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {sortedFiles.length === 0 ? (
        <EmptyState
          icon={<FolderIcon size={28} />}
          title="Carpeta vacía"
          description="No hay archivos ni carpetas aquí. Sube un archivo o crea una carpeta para comenzar."
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedFiles.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-16 w-16 flex items-center justify-center">
                    {item.type === 'folder' ? (
                      <FolderIcon className="h-12 w-12 text-amber-500 fill-amber-500/20" />
                    ) : isImageMime(item.mimeType) && item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="h-16 w-16 object-cover rounded"
                      />
                    ) : (
                      <FileIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs font-medium truncate w-full" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.type === 'folder'
                      ? new Date(item.createdAt).toLocaleDateString('es-MX')
                      : formatFileSize(item.size || 0)}
                  </p>
                </div>
                <div
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRename(item)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Renombrar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDelete(item)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[50px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFiles.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === 'folder' ? (
                        <FolderIcon className="h-5 w-5 text-amber-500 fill-amber-500/20 shrink-0" />
                      ) : isImageMime(item.mimeType) ? (
                        <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getFileTypeLabel(item)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.type === 'folder' ? '—' : formatFileSize(item.size || 0)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('es-MX')}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openRename(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDelete(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Carpeta</DialogTitle>
            <DialogDescription>Ingresa el nombre de la nueva carpeta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nombre</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Mi carpeta"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar</DialogTitle>
            <DialogDescription>Ingresa el nuevo nombre.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">Nombre</Label>
            <Input
              id="rename-input"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={!renameName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              {'¿Estás seguro de que deseas eliminar '}
              <span className="font-semibold">{deleteTarget?.name}</span>{'?'}
              {deleteTarget?.type === 'folder' &&
                ' Se eliminarán también todos los archivos dentro de la carpeta.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="truncate">{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              {isImageMime(previewItem.mimeType) && previewItem.url ? (
                <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                  <img
                    src={previewItem.url}
                    alt={previewItem.name}
                    className="max-h-[400px] object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-8">
                  <FileIcon className="h-16 w-16 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Vista previa no disponible
                  </p>
                  {previewItem.url && (
                    <a
                      href={previewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Descargar archivo
                    </a>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  {getFileTypeLabel(previewItem)}
                </div>
                <div>
                  <span className="text-muted-foreground">Tamaño:</span>{' '}
                  {formatFileSize(previewItem.size || 0)}
                </div>
                <div>
                  <span className="text-muted-foreground">Creado:</span>{' '}
                  {new Date(previewItem.createdAt).toLocaleDateString('es-MX')}
                </div>
                <div>
                  <span className="text-muted-foreground">Modificado:</span>{' '}
                  {new Date(previewItem.updatedAt).toLocaleDateString('es-MX')}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
