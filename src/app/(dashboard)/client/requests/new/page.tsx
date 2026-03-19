'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // Product form state
  const [productTitle, setProductTitle] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [implementationDescription, setImplementationDescription] = useState('')
  const [productPhoto, setProductPhoto] = useState<File[]>([])
  const productFileRef = useRef<HTMLInputElement>(null)

  // Page change form state
  const [pageSection, setPageSection] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [changeFiles, setChangeFiles] = useState<File[]>([])
  const changeFileRef = useRef<HTMLInputElement>(null)
  
  // Form type selection
  const [requestType, setRequestType] = useState<'product' | 'page_change'>('product')

  const [submitting, setSubmitting] = useState(false)

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductPhoto((prev: File[]) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeProductPhoto = (index: number) => {
    setProductPhoto((prev: File[]) => prev.filter((_: any, i: any) => i !== index))
  }

  const handleChangeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setChangeFiles((prev: File[]) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeChangeFile = (index: number) => {
    setChangeFiles((prev: File[]) => prev.filter((_: any, i: any) => i !== index))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) return
    
    // Validate based on request type
    if (requestType === 'product') {
      if (!productTitle || !productPrice || !productDescription) {
        toast.error('Por favor completa los campos requeridos del producto')
        return
      }
    } else {
      if (!pageSection || !changeDescription) {
        toast.error('Por favor completa los campos requeridos del cambio')
        return
      }
    }
    
    setSubmitting(true)
    try {
      const supabase = createClient()
      const statusId = await getDefaultStatusId()
      
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
        toast.success('Solicitud de producto enviada exitosamente', {
          description: 'Te notificaremos cuando sea revisada.',
        })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Solicitud</h1>
          <p className="text-muted-foreground">Selecciona el tipo de solicitud que deseas enviar</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Tipo de Solicitud</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {requestType === 'product' ? 'Detalles del Producto' : 'Detalles del Cambio'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {requestType === 'product' ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
