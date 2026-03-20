'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Request, RequestStatus, RequestAttachment } from '@/types/requests'

// Extended type for admin requests page
interface RequestWithStatus extends Request {
  status: RequestStatus
}
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Download, Eye, Edit, Save, X, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<RequestWithStatus[]>([])
  const [statuses, setStatuses] = useState<RequestStatus[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithStatus | null>(null)
  const [attachments, setAttachments] = useState<RequestAttachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [newStatusId, setNewStatusId] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const [{ data: reqs }, { data: sts }] = await Promise.all([
        supabase
          .from('requests')
          .select('*, profiles!requests_client_id_fkey(full_name), request_statuses(id, name, color)')
          .order('created_at', { ascending: false }),
        supabase.from('request_statuses').select('*').order('order_index'),
      ])
      setStatuses(
        (sts ?? []).map((s: any) => ({
          id: s.id, name: s.name, color: s.color,
          orderIndex: s.order_index, isDefault: s.is_default, createdAt: s.created_at,
        }))
      )
      setRequests(
        (reqs ?? []).map((r: any): RequestWithStatus => ({
          id: r.id,
          clientId: r.client_id,
          clientName: (r.profiles as { full_name: string } | null)?.full_name ?? '',
          type: r.type,
          statusId: r.status_id,
          status: r.request_statuses as RequestStatus,
          urgency: r.urgency ?? 'normal',
          pageSection: r.page_section ?? undefined,
          changeDescription: r.change_description ?? undefined,
          productTitle: r.product_title ?? undefined,
          productPrice: r.product_price ?? undefined,
          productCategory: r.product_category ?? undefined,
          productDescription: r.product_description ?? undefined,
          implementationDescription: r.implementation_description ?? undefined,
          adminNotes: r.admin_notes ?? undefined,
          assignedTo: r.assigned_to ?? undefined,
          attachments: [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!previewOpen) {
      setSelectedRequest(null)
      setAttachments([])
      setEditingStatus(false)
      setPopoverOpen(false)
      setNewStatusId('')
    }
  }, [previewOpen])

  const loadAttachments = async (requestId: string) => {
    setLoadingAttachments(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('request_attachments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
    
    setAttachments((data ?? []).map((a: any) => ({
      id: a.id,
      requestId: a.request_id,
      fileUrl: a.file_url,
      fileName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size,
      createdAt: a.created_at,
    })))
    setLoadingAttachments(false)
  }

  const handleRowClick = async (request: RequestWithStatus) => {
    setSelectedRequest(request)
    setNewStatusId(request.statusId)
    setPreviewOpen(true)
    await loadAttachments(request.id)
  }

  const updateRequestStatus = async () => {
    if (!selectedRequest || !newStatusId) return
    
    setUpdatingStatus(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('requests')
      .update({ status_id: newStatusId })
      .eq('id', selectedRequest.id)
    
    if (error) {
      toast.error('Error al actualizar el estado')
    } else {
      const updatedStatus = statuses.find(s => s.id === newStatusId)!
      // Update local state so both table and dialog reflect the change immediately
      setRequests(prev => prev.map(req =>
        req.id === selectedRequest.id
          ? { ...req, statusId: newStatusId, status: updatedStatus }
          : req
      ))
      setSelectedRequest(prev => prev ? { ...prev, statusId: newStatusId, status: updatedStatus } : null)
      setEditingStatus(false)
      setPopoverOpen(false)
      toast.success('Estado actualizado')
    }

    setUpdatingStatus(false)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-4 w-4" />
    if (fileType.startsWith('image/')) return <Eye className="h-4 w-4" />
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredRequests = requests.filter((req) => {
    if (typeFilter !== 'all' && req.type !== typeFilter) return false
    if (statusFilter !== 'all' && req.statusId !== statusFilter) return false
    return true
  })

  const getStatusInfo = (statusId: string) => statuses.find((s) => s.id === statusId)

  const isRecentRequest = (createdAt: string) => {
    const requestDate = new Date(createdAt)
    const now = new Date()
    const diffInHours = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24
  }

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
        <p className="text-muted-foreground">Gestiona todas las solicitudes de los clientes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="page_change">Cambio Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título / Sección</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Reciente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const status = getStatusInfo(req.statusId)
                return (
                  <TableRow 
                    key={req.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => handleRowClick(req)}
                  >
                    <TableCell>
                      <Link href={`/admin/requests/${req.id}`} className="font-medium hover:underline">
                        {req.clientName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {req.type === 'product' ? 'Producto' : 'Cambio Web'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="hover:underline">
                        {req.type === 'product' ? req.productTitle : (req.pageSection || req.changeDescription?.substring(0, 50))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {req.urgency === 'urgent' ? (
                        <Badge variant="destructive">Urgente</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: status?.color, color: '#fff' }}>
                        {status?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      {isRecentRequest(req.createdAt) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Nuevo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No se encontraron solicitudes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[80vh]">
            {selectedRequest && (
              <div className="space-y-6">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Información General</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Cliente:</span> {selectedRequest.clientName}</p>
                      <p><span className="font-medium">Tipo:</span> {selectedRequest.type === 'product' ? 'Producto' : 'Cambio Web'}</p>
                      <p><span className="font-medium">Urgencia:</span> {selectedRequest.urgency === 'urgent' ? 'Urgente' : 'Normal'}</p>
                      <p><span className="font-medium">Fecha:</span> {new Date(selectedRequest.createdAt).toLocaleDateString('es-MX')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Estado</h4>
                      {!editingStatus ? (
                        <Button variant="outline" size="sm" onClick={() => { setEditingStatus(true); setPopoverOpen(true) }}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger>
                              <Button variant="outline" size="sm" className="w-[150px] justify-between">
                                {statuses.find(s => s.id === newStatusId)?.name || 'Seleccionar...'}
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[150px] p-0">
                              <div className="max-h-60 overflow-auto">
                                {statuses.map((status) => (
                                  <button
                                    key={status.id}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                                    onClick={() => {
                                      setNewStatusId(status.id)
                                      setPopoverOpen(false)
                                    }}
                                  >
                                    <span>{status.name}</span>
                                    {status.id === newStatusId && (
                                      <div className="w-2 h-2 bg-primary rounded-full" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            size="sm"
                            onClick={updateRequestStatus}
                            disabled={updatingStatus || newStatusId === selectedRequest?.statusId}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {updatingStatus ? 'Guardando...' : 'Guardar'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingStatus(false)
                            setPopoverOpen(false)
                            setNewStatusId(selectedRequest?.statusId || '')
                          }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Badge 
                      style={{ backgroundColor: selectedRequest.status?.color, color: '#fff' }}
                      className="mb-2"
                    >
                      {selectedRequest.status?.name}
                    </Badge>
                    {selectedRequest.adminNotes && (
                      <div className="mt-4">
                        <p className="font-medium text-sm mb-1">Notas de Admin:</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Details */}
                <div>
                  <h4 className="font-semibold mb-2">Detalles de la Solicitud</h4>
                  {selectedRequest.type === 'product' ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Título del producto:</span> {selectedRequest.productTitle}</p>
                      <p><span className="font-medium">Categoría:</span> {selectedRequest.productCategory}</p>
                      <p><span className="font-medium">Precio:</span> ${selectedRequest.productPrice}</p>
                      <p><span className="font-medium">Descripción:</span></p>
                      <p className="text-muted-foreground bg-muted p-3 rounded">
                        {selectedRequest.productDescription}
                      </p>
                      {selectedRequest.implementationDescription && (
                        <>
                          <p><span className="font-medium">Descripción de implementación:</span></p>
                          <p className="text-muted-foreground bg-muted p-3 rounded">
                            {selectedRequest.implementationDescription}
                          </p>
                        </>
                      )}
                    </div>
                  ) : selectedRequest.type === 'page_change' ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Sección de la página:</span> {selectedRequest.pageSection}</p>
                      <p><span className="font-medium">Descripción del cambio:</span></p>
                      <p className="text-muted-foreground bg-muted p-3 rounded whitespace-pre-wrap">
                        {selectedRequest.changeDescription}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Attachments */}
                <div>
                  <h4 className="font-semibold mb-2">Archivos Adjuntos</h4>
                  {loadingAttachments ? (
                    <div className="flex items-center justify-center py-4">
                      <Spinner size="size-6" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando archivos...</span>
                    </div>
                  ) : attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getFileIcon(attachment.fileType)}
                            <div>
                              <p className="text-sm font-medium">{attachment.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.fileSize)} • 
                                {new Date(attachment.createdAt).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {attachment.fileType?.startsWith('image/') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(attachment.fileUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadFile(attachment.fileUrl, attachment.fileName)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay archivos adjuntos</p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
