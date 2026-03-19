'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { WebPage } from '@/types/web-pages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NewRequestPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  // Function to get client's web pages using client Supabase
  const getClientWebPages = async (clientId: string): Promise<WebPage[]> => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('web_pages')
      .select('*, profiles!web_pages_client_id_fkey(full_name)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data ?? []).map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: '',
      domain: row.domain ?? undefined,
      url: row.url ?? undefined,
      status: row.status,
      lastDeployedAt: row.last_deployed_at ?? undefined,
      sslExpiry: row.ssl_expiry ?? undefined,
      planId: row.plan_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  // Page change form state
  const [pageSection, setPageSection] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [urgency, setUrgency] = useState<string>('normal')
  const [attachments, setAttachments] = useState<File[]>([])
  const pageFileRef = useRef<HTMLInputElement>(null)

  // Product form state
  const [productTitle, setProductTitle] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [implementationDescription, setImplementationDescription] = useState('')
  const [productPhoto, setProductPhoto] = useState<File[]>([])
  const productFileRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)

  const handlePageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductPhoto((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const removeProductPhoto = (index: number) => {
    setProductPhoto((prev) => prev.filter((_, i) => i !== index))
  }

  async function getDefaultStatusId(): Promise<string | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from('request_statuses')
      .select('id')
      .order('order_index', { ascending: true })
      .limit(1)
      .single()
    return data?.id ?? null
  }

  const handlePageChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageSection || !changeDescription) {
      toast.error('Por favor completa los campos requeridos')
      return
    }
    if (!user?.id) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const statusId = await getDefaultStatusId()
      
      // Create the request
      const { data: requestData, error: requestError } = await supabase.from('requests').insert({
        client_id: user.id,
        type: 'page_change',
        status_id: statusId,
        urgency,
        page_section: pageSection,
        change_description: changeDescription,
      }).select().single()
      
      if (requestError) throw requestError
      
      // Get client's web pages to create the change
      const clientWebPages = await getClientWebPages(user.id)
      
      // If client has web pages, create a change for the first one (or most recently updated)
      if (clientWebPages.length > 0) {
        const webPage = clientWebPages[0] // Use the first/most recent web page
        
        await supabase.from('web_page_changes').insert({
          web_page_id: webPage.id,
          title: `Cambio solicitado: ${pageSection}`,
          description: changeDescription,
          status: 'pending',
          request_id: requestData.id,
        })
        
        toast.success('Solicitud de cambio enviada exitosamente', {
          description: 'Se ha agregado un cambio a tu página web.',
        })
      } else {
        toast.success('Solicitud de cambio enviada exitosamente', {
          description: 'Te notificaremos cuando sea revisada.',
        })
      }
      
      router.push('/client/requests')
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productTitle || !productPrice || !productDescription) {
      toast.error('Por favor completa los campos requeridos')
      return
    }
    if (!user?.id) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const statusId = await getDefaultStatusId()
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
      toast.success('Solicitud de producto enviada exitosamente', {
        description: 'Te notificaremos cuando sea revisada.',
      })
      router.push('/client/requests')
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Solicitud</h1>
          <p className="text-muted-foreground">Envía una solicitud de cambio o nuevo producto</p>
        </div>
      </div>

      <Tabs defaultValue="page_change" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="page_change">Cambio de página</TabsTrigger>
          <TabsTrigger value="product">Producto</TabsTrigger>
        </TabsList>

        <TabsContent value="page_change" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitud de Cambio de Página</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePageChangeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageSection">Sección de la página *</Label>
                  <Input
                    id="pageSection"
                    placeholder="Ej: Hero / Banner Principal"
                    value={pageSection}
                    onChange={(e) => setPageSection(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="changeDescription">Descripción del cambio *</Label>
                  <Textarea
                    id="changeDescription"
                    placeholder="Describe los cambios que necesitas..."
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Urgencia</Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Archivos adjuntos</Label>
                  <div
                    className="flex items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => pageFileRef.current?.click()}
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Haz clic para seleccionar archivos
                      </p>
                    </div>
                  </div>
                  <input
                    ref={pageFileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handlePageFileChange}
                  />
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-2 px-3">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitud de Nuevo Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSubmit} className="space-y-4">
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
                  <Label>Foto del producto</Label>
                  <div
                    className="flex items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => productFileRef.current?.click()}
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Haz clic para seleccionar fotos
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
                  {productPhoto.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {productPhoto.map((file, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-2 px-3">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeProductPhoto(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
