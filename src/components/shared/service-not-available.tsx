'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

interface ServiceNotAvailableProps {
  serviceName: string
  description?: string
}

export function ServiceNotAvailable({ 
  serviceName, 
  description = `No tienes el servicio de ${serviceName} activo en tu plan actual.` 
}: ServiceNotAvailableProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Servicio No Disponible</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {description}
          </p>
          <p className="text-sm text-muted-foreground">
            Si deseas agregar este servicio a tu plan, por favor contáctanos para actualizar tu suscripción.
          </p>
          
          <div className="space-y-3 pt-4">
            <Link href="/client/subscription" passHref>
              <Button className="w-full">
                Ver Mi Plan Actual
              </Button>
            </Link>
            
            <div className="grid grid-cols-1 gap-2">
              <a href="mailto:soporte@exim.com">
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Correo
                </Button>
              </a>
              
              <a href="tel:+1234567890">
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar Ahora
                </Button>
              </a>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Link href="/client" passHref>
              <Button variant="ghost">
                ← Volver al Inicio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
