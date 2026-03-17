'use client'

import { useState, useRef, useMemo } from 'react'
import { FileItem } from '@/types/files'
import { mockFiles } from '@/data/mock-files'
import { mockClients } from '@/data/mock-clients'
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
} from 'lucide-react'

interface FileManagerProps {
  section: 'social' | 'web'
  clientId?: string
  isAdmin: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function isImageMime(mimeType?: string): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

export function FileManager({ section, clientId, isAdmin }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>(mockFiles)
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

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    return files.filter((f) => {
      if (f.section !== section) return false
      if (f.parentFolderId !== currentFolderId) return false
      if (isAdmin && selectedClientId !== 'all') {
        if (f.clientId !== selectedClientId) return false
      }
      if (!isAdmin && clientId) {
        if (f.clientId !== clientId) return false
      }
      return true
    })
  }, [files, section, currentFolderId, isAdmin, selectedClientId, clientId])

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })
  }, [filteredFiles])

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    const effectiveClientId = isAdmin
      ? selectedClientId === 'all'
        ? 'client-1'
        : selectedClientId
      : clientId || 'client-1'
    const newFolder: FileItem = {
      id: 'folder-' + Date.now(),
      name: newFolderName.trim(),
      type: 'folder',
      parentFolderId: currentFolderId,
      section,
      clientId: effectiveClientId,
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setFiles((prev) => [...prev, newFolder])
    setNewFolderName('')
    setNewFolderOpen(false)
    toast.success('Carpeta creada exitosamente')
  }

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles) return
    const effectiveClientId = isAdmin
      ? selectedClientId === 'all'
        ? 'client-1'
        : selectedClientId
      : clientId || 'client-1'
    const newItems: FileItem[] = Array.from(uploadedFiles).map((file) => ({
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: file.name,
      type: 'file' as const,
      mimeType: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      parentFolderId: currentFolderId,
      section,
      clientId: effectiveClientId,
      createdBy: 'admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    setFiles((prev) => [...prev, ...newItems])
    toast.success(newItems.length + ' archivo(s) subido(s)')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRename = () => {
    if (!renameTarget || !renameName.trim()) return
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
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const idsToDelete = new Set<string>()
    const collectChildren = (parentId: string) => {
      idsToDelete.add(parentId)
      files
        .filter((f) => f.parentFolderId === parentId)
        .forEach((f) => collectChildren(f.id))
    }
    collectChildren(deleteTarget.id)
    setFiles((prev) => prev.filter((f) => !idsToDelete.has(f.id)))
    setDeleteOpen(false)
    setDeleteTarget(null)
    toast.success('Eliminado exitosamente')
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
    if (item.mimeType.includes('sheet') || item.mimeType.includes('excel')) return 'Hoja de c\u00e1lculo'
    return 'Archivo'
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
        >
          <Upload className="mr-2 h-4 w-4" />
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
                {mockClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.companyName || c.fullName}
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
          title="Carpeta vac\u00eda"
          description="No hay archivos ni carpetas aqu\u00ed. Sube un archivo o crea una carpeta para comenzar."
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
                <TableHead>Tama\u00f1o</TableHead>
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
                    {item.type === 'folder' ? '\u2014' : formatFileSize(item.size || 0)}
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
            <DialogTitle>Confirmar eliminaci\u00f3n</DialogTitle>
            <DialogDescription>
              {'\u00bfEst\u00e1s seguro de que deseas eliminar '}
              <span className="font-semibold">{deleteTarget?.name}</span>{'?'}
              {deleteTarget?.type === 'folder' &&
                ' Se eliminar\u00e1n tambi\u00e9n todos los archivos dentro de la carpeta.'}
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
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  {getFileTypeLabel(previewItem)}
                </div>
                <div>
                  <span className="text-muted-foreground">Tama\u00f1o:</span>{' '}
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
