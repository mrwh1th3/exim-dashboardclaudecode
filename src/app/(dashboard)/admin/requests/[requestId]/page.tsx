'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileIcon, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { mockRequests, mockRequestStatuses } from '@/data/mock-requests'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RequestDetailPageProps {
  params: Promise<{ requestId: string }>
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { requestId } = use(params)
  const request = mockRequests.find((r) => r.id === requestId)

  const [selectedStatus, setSelectedStatus] = useState(request?.statusId ?? '')
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes ?? '')

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold">Solicitud no encontrada</h1>
        <p className="text-muted-foreground mt-2">La solicitud solicitada no existe.</p>
        <Link href="/admin/requests">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a solicitudes
          </Button>
        </Link>
      </div>
    )
  }

  const currentStatus = mockRequestStatuses.find((s) => s.id === request.statusId)

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSaveNotes = () => {
    toast.success('Notas guardadas exitosamente')
  }

  const handleChangeStatus = () => {
    const newStatus = mockRequestStatuses.find((s) => s.id === selectedStatus)
    toast.success(`Estado cambiado a "${newStatus?.name}"`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {request.type === 'page_change' ? request.pageSection : request.productTitle}
            </h1>
            <Badge style={{ backgroundColor: currentStatus?.color, color: '#fff' }}>
              {currentStatus?.name}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {request.clientName} &middot;{' '}
            {new Date(request.createdAt).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant="outline">
                    {request.type === 'page_change' ? 'Cambio de página' : 'Producto'}
                  </Badge>
                </div>
                {request.urgency && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Urgencia</p>
                    {request.urgency === 'urgent' ? (
                      <Badge variant="destructive">Urgente</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </div>
                )}
              </div>

              {request.type === 'page_change' && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sección</p>
                    <p className="text-sm font-medium">{request.pageSection}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Descripción del cambio</p>
                    <p className="text-sm">{request.changeDescription}</p>
                  </div>
                </>
              )}

              {request.type === 'product' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Título del producto</p>
                      <p className="text-sm font-medium">{request.productTitle}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Precio</p>
                      <p className="text-sm font-medium">${request.productPrice?.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Categoría</p>
                      <p className="text-sm">{request.productCategory}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Descripción del producto</p>
                    <p className="text-sm">{request.productDescription}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Instrucciones de implementación</p>
                    <p className="text-sm">{request.implementationDescription}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {request.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Archivos Adjuntos ({request.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {request.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.fileType} {att.fileSize ? `- ${formatFileSize(att.fileSize)}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  {mockRequestStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={handleChangeStatus}>
                Cambiar Estado
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas del Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Agrega notas internas sobre esta solicitud..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
              />
              <Button className="w-full" variant="outline" onClick={handleSaveNotes}>
                Guardar Notas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
