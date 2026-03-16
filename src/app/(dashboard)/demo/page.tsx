export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Demo: Horizontal Header</h1>
        <p className="text-muted-foreground">
          Esta página demuestra el nuevo encabezado horizontal que reemplaza la barra lateral.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Navegación Principal</h3>
          <p className="text-sm text-muted-foreground">
            Acceso a Dashboard, Clientes, Flujos, Solicitudes y Suscripciones
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Redes Sociales</h3>
          <p className="text-sm text-muted-foreground">
            Calendario, Posts, Estrategia y Archivos multimedia
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold mb-2">Página Web</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de páginas web y archivos
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Características del Nuevo Header</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Diseño horizontal moderno y responsivo
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Menús desplegables con navegación organizada
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Versión móvil con menú hamburguesa animado
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Integración completa con el sistema de autenticación
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Soporte para roles de admin y cliente
          </li>
        </ul>
      </div>
    </div>
  )
}
