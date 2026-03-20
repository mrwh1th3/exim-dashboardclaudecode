'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Eye, FileText, Download, Globe, ArrowLeft, Upload, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function ClientRequestsSection() {
  const user = useAuthStore((state) => state.user)
  const [requests, setRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // New request form state
  const [requestType, setRequestType] = useState<'product' | 'page_change'>('product')
  const [productTitle, setProductTitle] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [implementationDescription, setImplementationDescription] = useState('')
  const [pageSection, setPageSection] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [changeFiles, setChangeFiles] = useState<File[]>([])
  const productFileRef = useRef<HTMLInputElement>(null)
  const changeFileRef = useRef<HTMLInputElement>(null)

  const isRecentRequest = (createdAt: string) => {
    const requestDate = new Date(createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24
  }

  const handleRowClick = (request: any) => {
    setSelectedRequest(request)
    setPreviewOpen(true)
  }

  const getRequestTypeLabel = (type: string) => {
    return type === 'product' ? 'Producto' : type === 'page_change' ? 'Cambio Web' : type
  }

  const getRequestTypeIcon = (type: string) => {
    return type === 'product' ? '📦' : type === 'page_change' ? '🌐' : '📄'
  }

  const getRequestTitle = (request: any) => {
    if (request.type === 'product') {
      return request.product_title || 'Sin título'
    } else if (request.type === 'page_change') {
      return request.page_section || request.change_description?.substring(0, 50) + '...' || 'Sin título'
    }
    return 'Sin título'
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // New request form handlers
  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductFiles((prev: File[]) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeProductFile = (index: number) => {
    setProductFiles((prev: File[]) => prev.filter((_: any, i: any) => i !== index))
  }

  const handleChangeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setChangeFiles((prev: File[]) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeChangeFile = (index: number) => {
    setChangeFiles((prev: File[]) => prev.filter((_: any, i: any) => i !== index))
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) return
    
    // Validate based on request type
    if (requestType === 'product') {
      if (!productTitle || !productPrice || !productDescription) {
        // Show error - you might want to add toast here
        return
      }
    } else {
      if (!pageSection || !changeDescription) {
        // Show error - you might want to add toast here
        return
      }
    }
    
    setSubmitting(true)
    try {
      const supabase = createClient()
      
      // Get default status
      const { data: statusData } = await supabase
        .from('request_statuses')
        .select('id')
        .order('order_index', { ascending: true })
        .limit(1)
        .single()
      
      const statusId = statusData?.id
      
      let requestId: string

      if (requestType === 'product') {
        const { data: req, error } = await supabase.from('requests').insert({
          client_id: user.id,
          type: 'product',
          status_id: statusId,
          urgency: 'normal',
          product_title: productTitle,
          product_price: parseFloat(productPrice),
          product_category: productCategory || null,
          product_description: productDescription,
          implementation_description: implementationDescription || null,
        }).select('id').single()
        if (error) throw error
        requestId = req.id
      } else {
        const { data: req, error } = await supabase.from('requests').insert({
          client_id: user.id,
          type: 'page_change',
          status_id: statusId,
          urgency: 'normal',
          page_section: pageSection,
          change_description: changeDescription,
        }).select('id').single()
        if (error) throw error
        requestId = req.id
      }

      // Upload attachments to Storage
      const filesToUpload = requestType === 'product' ? productFiles : changeFiles
      for (const file of filesToUpload) {
        const path = `${user.id}/${requestId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('request-files')
          .upload(path, file)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('request-files').getPublicUrl(path)
          await supabase.from('request_attachments').insert({
            request_id: requestId,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type || null,
            file_size: file.size,
          })
        }
      }

      // Reset form and close dialog
      resetForm()
      setNewRequestOpen(false)
      toast.success('Solicitud enviada correctamente')
      
      // Reload requests
      const { data } = await supabase
        .from('requests')
        .select('*, request_statuses(id, name, color)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(data ?? [])
      
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setRequestType('product')
    setProductTitle('')
    setProductPrice('')
    setProductCategory('')
    setProductDescription('')
    setImplementationDescription('')
    setPageSection('')
    setChangeDescription('')
    setProductFiles([])
    setChangeFiles([])
  }

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    setLoading(true)
    void (async () => {
      const { data } = await supabase
        .from('requests')
        .select('*, request_statuses(id, name, color)')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      setRequests(data ?? [])
      setLoading(false)
    })()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="size-10" />
          <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Solicitudes</h1>
          <p className="text-muted-foreground">Historial de tus solicitudes y cambios</p>
        </div>
        <Button onClick={() => setNewRequestOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30">
                  <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                  <TableHead className="font-semibold text-foreground">Título / Sección</TableHead>
                  <TableHead className="font-semibold text-foreground">Estado</TableHead>
                  <TableHead className="font-semibold text-foreground">Urgencia</TableHead>
                  <TableHead className="font-semibold text-foreground">Fecha</TableHead>
                  <TableHead className="font-semibold text-foreground">Reciente</TableHead>
                  <TableHead className="font-semibold text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const status = req.request_statuses
                  return (
                    <TableRow 
                      key={req.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(req)}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getRequestTypeIcon(req.type)}</span>
                          <Badge variant="outline" className="font-medium">
                            {getRequestTypeLabel(req.type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 font-medium">
                        <div className="max-w-md">
                          <p className="truncate">{getRequestTitle(req)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge 
                          style={{ backgroundColor: status?.color, color: '#fff' }}
                          className="font-medium"
                        >
                          {status?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        {req.urgency === 'urgent' ? (
                          <Badge variant="destructive" className="font-medium">Urgente</Badge>
                        ) : (
                          <Badge variant="outline" className="font-medium">Normal</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {new Date(req.created_at).toLocaleDateString('es-MX')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(req.created_at).toLocaleTimeString('es-MX', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {isRecentRequest(req.created_at) && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
                            Nuevo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(req)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tienes solicitudes aún</p>
              <p className="text-sm">Crea tu primera solicitud para comenzar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="dialog-content max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedRequest ? getRequestTypeIcon(selectedRequest.type) : ''}</span>
              Detalles de la Solicitud
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[80vh]">
            {selectedRequest && (
              <div className="space-y-6">
                {/* Request Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Información General</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Tipo:</span> {getRequestTypeLabel(selectedRequest.type)}</p>
                      <p><span className="font-medium">Urgencia:</span> {selectedRequest.urgency === 'urgent' ? 'Urgente' : 'Normal'}</p>
                      <p><span className="font-medium">Fecha de creación:</span> {new Date(selectedRequest.created_at).toLocaleDateString('es-MX')}</p>
                      <p><span className="font-medium">Última actualización:</span> {new Date(selectedRequest.updated_at).toLocaleDateString('es-MX')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Estado Actual</h4>
                    <Badge 
                      style={{ backgroundColor: selectedRequest.request_statuses?.color, color: '#fff' }}
                      className="mb-2 font-medium"
                    >
                      {selectedRequest.request_statuses?.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tu solicitud está siendo procesada por el equipo.
                    </p>
                  </div>
                </div>

                {/* Request Details */}
                <div>
                  <h4 className="font-semibold mb-2">Detalles de la Solicitud</h4>
                  {selectedRequest.type === 'product' ? (
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium">Título del producto:</p>
                        <p className="text-muted-foreground bg-muted p-3 rounded mt-1">
                          {selectedRequest.product_title || 'No especificado'}
                        </p>
                      </div>
                      
                      {selectedRequest.product_category && (
                        <div>
                          <p className="font-medium">Categoría:</p>
                          <p className="text-muted-foreground bg-muted p-3 rounded mt-1">
                            {selectedRequest.product_category}
                          </p>
                        </div>
                      )}
                      
                      {selectedRequest.product_price && (
                        <div>
                          <p className="font-medium">Precio:</p>
                          <p className="text-muted-foreground bg-muted p-3 rounded mt-1">
                            ${selectedRequest.product_price}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium">Descripción del producto:</p>
                        <p className="text-muted-foreground bg-muted p-3 rounded mt-1 whitespace-pre-wrap">
                          {selectedRequest.product_description || 'No especificado'}
                        </p>
                      </div>
                      
                      {selectedRequest.implementation_description && (
                        <div>
                          <p className="font-medium">Instrucciones de implementación:</p>
                          <p className="text-muted-foreground bg-muted p-3 rounded mt-1 whitespace-pre-wrap">
                            {selectedRequest.implementation_description}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : selectedRequest.type === 'page_change' ? (
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium">Sección de la página:</p>
                        <p className="text-muted-foreground bg-muted p-3 rounded mt-1">
                          {selectedRequest.page_section || 'No especificado'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="font-medium">Descripción del cambio:</p>
                        <p className="text-muted-foreground bg-muted p-3 rounded mt-1 whitespace-pre-wrap">
                          {selectedRequest.change_description || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Attachments Section (simplified for client) */}
                <div>
                  <h4 className="font-semibold mb-2">Archivos Adjuntos</h4>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded border-2 border-dashed border-muted-foreground/30">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span>Los archivos adjuntos serán procesados por el equipo de soporte</span>
                    </div>
                  </div>
                </div>

                {/* Note for client */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Nota importante</p>
                      <p className="text-blue-700">
                        Esta es una vista de solo lectura. Para cualquier modificación o consulta adicional, 
                        por favor contacta al equipo de soporte o crea una nueva solicitud.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New Request Dialog */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="dialog-content max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nueva Solicitud
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[80vh] pr-4">
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Type Selection */}
              <div>
                <h4 className="font-semibold mb-3">Tipo de Solicitud</h4>
                <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      requestType === 'product' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setRequestType('product')}
                  >
                    📦 Producto
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      requestType === 'page_change' 
                        ? 'bg-background shadow-sm text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setRequestType('page_change')}
                  >
                    🌐 Cambio Web
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              {requestType === 'product' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">Detalles del Producto</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="productTitle">Nombre del producto *</Label>
                      <Input
                        id="productTitle"
                        placeholder="Ej: Vestido Floral Verano"
                        value={productTitle}
                        onChange={(e) => setProductTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productPrice">Precio *</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productCategory">Categoría</Label>
                    <Input
                      id="productCategory"
                      placeholder="Ej: Ropa, Electrónica, Alimentos..."
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Descripción del producto *</Label>
                    <Textarea
                      id="productDescription"
                      placeholder="Describe las características del producto..."
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="implementationDescription">Instrucciones de implementación</Label>
                    <Textarea
                      id="implementationDescription"
                      placeholder="Indica en qué categoría o sección debe aparecer..."
                      value={implementationDescription}
                      onChange={(e) => setImplementationDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Archivos adjuntos</Label>
                    <div
                      className="flex items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => productFileRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Haz clic para seleccionar archivos
                        </p>
                      </div>
                    </div>
                    <input
                      ref={productFileRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleProductFileChange}
                    />
                    {productFiles.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {productFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between rounded-lg border p-2 px-3">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeProductFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold">Detalles del Cambio</h4>
                  <div className="space-y-2">
                    <Label htmlFor="pageSection">Sección de la página *</Label>
                    <Input
                      id="pageSection"
                      placeholder="Ej: Página principal, Catálogo, Contacto..."
                      value={pageSection}
                      onChange={(e) => setPageSection(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="changeDescription">Descripción del cambio *</Label>
                    <Textarea
                      id="changeDescription"
                      placeholder="Describe detalladamente el cambio que necesitas..."
                      value={changeDescription}
                      onChange={(e) => setChangeDescription(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Archivos adjuntos</Label>
                    <div
                      className="flex items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => changeFileRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Haz clic para seleccionar archivos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Imágenes, documentos, etc.
                        </p>
                      </div>
                    </div>
                    <input
                      ref={changeFileRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleChangeFileChange}
                    />
                    {changeFiles.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {changeFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between rounded-lg border p-2 px-3">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeChangeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClientRequestsSection
