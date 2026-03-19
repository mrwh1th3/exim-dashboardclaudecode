'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { WebPage, WebPageStatus } from '@/types/web-pages'
import { Request, RequestStatus } from '@/types/requests'

// Extended type for this component
interface RequestWithStatus extends Request {
  status: RequestStatus
  title: string
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Globe,
  Shield,
  Rocket,
  ExternalLink,
  Plus,
  MessageSquare,
  Server,
  Activity,
  Clock,
  Upload,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const statusConfig: Record<WebPageStatus, { label: string; color: string; progress: number }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500', progress: 10 },
  in_development: { label: 'En desarrollo', color: 'bg-blue-500', progress: 40 },
  review: { label: 'En revisión', color: 'bg-yellow-500', progress: 70 },
  published: { label: 'Publicada', color: 'bg-green-500', progress: 100 },
  maintenance: { label: 'Mantenimiento', color: 'bg-orange-500', progress: 100 },
}

// Hosting status based on URL (same logic as admin)
const getHostingStatus = (url?: string) => {
  return !!url
}

const getServerStatus = (url?: string) => {
  return url ? 'online' : 'offline'
}

const getDnsStatus = (domain?: string) => {
  return domain ? 'active' : 'error'
}

export default function ClientWebPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [webPage, setWebPage] = useState<WebPage | null>(null)
  const [requests, setRequests] = useState<RequestWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
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

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('web_pages')
        .select('*')
        .eq('client_id', user.id)
        .maybeSingle()
      if (data) {
        setWebPage({
          id: data.id,
          clientId: data.client_id,
          clientName: '',
          url: data.url ?? undefined,
          domain: data.domain ?? undefined,
          status: data.status,
          lastDeployedAt: data.last_deployed_at ?? undefined,
          sslExpiry: data.ssl_expiry ?? undefined,
          planId: data.plan_id ?? undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        })
        
        // Load requests related to web pages
        const { data: requestData } = await supabase
          .from('requests')
          .select(`
            id, type, page_section, change_description, created_at, updated_at,
            request_statuses (name, color)
          `)
          .eq('client_id', user.id)
          .eq('type', 'page_change')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (requestData) {
          setRequests(requestData.map((r: any): RequestWithStatus => ({
            id: r.id,
            clientId: user.id,
            clientName: '',
            type: r.type,
            statusId: '',
            urgency: 'normal',
            pageSection: r.page_section,
            changeDescription: r.change_description,
            attachments: [],
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            status: {
              id: '',
              name: r.request_statuses?.name ?? 'Sin estado',
              color: r.request_statuses?.color ?? '#888',
              orderIndex: 0,
              isDefault: false,
              createdAt: '',
            },
            title: r.page_section || r.change_description || 'Solicitud de cambio',
          })))
        }
      }
      setLoading(false)
    })()
  }, [user?.id])

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
        return
      }
    } else {
      if (!pageSection || !changeDescription) {
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
      
      if (requestType === 'product') {
        const { error } = await supabase.from('requests').insert({
          client_id: user.id,
          type: 'product',
          status_id: statusId,
          urgency: 'normal',
          product_title: productTitle,
          product_price: parseFloat(productPrice),
          product_category: productCategory || null,
          product_description: productDescription,
          implementation_description: implementationDescription || null,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('requests').insert({
          client_id: user.id,
          type: 'page_change',
          status_id: statusId,
          urgency: 'normal',
          page_section: pageSection,
          change_description: changeDescription,
        })
        if (error) throw error
      }
      
      // Reset form and close dialog
      resetForm()
      setNewRequestOpen(false)
      
      // Reload requests
      const { data: requestData } = await supabase
        .from('requests')
        .select(`
          id, type, page_section, change_description, created_at, updated_at,
          request_statuses (name, color)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      
      setRequests((requestData ?? []).map((r: any) => ({
        id: r.id,
        type: r.type,
        statusId: r.request_statuses?.id,
        status: r.request_statuses,
        urgency: 'normal',
        pageSection: r.page_section,
        changeDescription: r.change_description,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        title: r.type === 'product' ? r.product_title || 'Producto' : r.page_section || 'Cambio web',
      })))
      
    } catch {
      // Handle error
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Página Web</h1>
          <p className="text-muted-foreground">Información y estado de tu página web</p>
        </div>
        <div className="text-muted-foreground text-sm">Cargando...</div>
      </div>
    )
  }

  if (!webPage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Página Web</h1>
          <p className="text-muted-foreground">Información y estado de tu página web</p>
        </div>
        <EmptyState
          icon={<Globe size={28} />}
          title="Sin página web"
          description="Aún no tienes una página web configurada. Contacta al equipo para comenzar."
          action={{
            label: 'Solicitar página web',
            onClick: () => router.push('/client/requests/new'),
          }}
        />
      </div>
    )
  }

  const status = statusConfig[webPage.status]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Página Web</h1>
        <p className="text-muted-foreground">Información y estado de tu página web</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado actual</p>
              <Badge className={status.color + ' text-white text-base px-4 py-1.5 hover:' + status.color}>
                {status.label}
              </Badge>
            </div>
            {webPage.url && (
              <a href={webPage.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visitar sitio
                </Button>
              </a>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del sitio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dominio</p>
                <p className="font-medium">{webPage.domain || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">URL</p>
                {webPage.url ? (
                  <a
                    href={webPage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {webPage.url}
                  </a>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Último despliegue</p>
                <p className="font-medium">
                  {webPage.lastDeployedAt
                    ? new Date(webPage.lastDeployedAt).toLocaleDateString('es-MX')
                    : 'Pendiente'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hosting Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Hosting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Estado del Hosting</p>
                <div className="flex items-center gap-2">
                  {getHostingStatus(webPage?.url) ? (
                    <>
                      <Activity className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-green-600">Activo</p>
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 text-gray-600" />
                      <p className="font-medium text-gray-600">Inactivo</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Estado del Servidor</p>
                <p className={`font-medium ${getServerStatus(webPage?.url) === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {getServerStatus(webPage?.url) === 'online' ? 'En línea' : 'Fuera de línea'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Estado DNS</p>
                <p className={`font-medium ${getDnsStatus(webPage?.domain) === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {getDnsStatus(webPage?.domain) === 'active' ? 'Activo' : 'Error'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historial de Solicitudes</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setNewRequestOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/client/requests')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay solicitudes registradas aún.
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request, idx) => (
                <div key={request.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div 
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: request.status.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{request.title}</p>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: request.status.color + '40',
                            color: request.status.color 
                          }}
                        >
                          {request.status.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Creada: {new Date(request.createdAt).toLocaleDateString('es-MX')}</span>
                        <span>Actualizada: {new Date(request.updatedAt).toLocaleDateString('es-MX')}</span>
                      </div>
                    </div>
                  </div>
                  {idx < requests.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
