import { FlowTemplate, FlowStage, FormTemplate, ClientFlow, ClientStageProgress } from '@/types/onboarding'

export const mockFormTemplates: FormTemplate[] = [
  {
    id: 'form-brand',
    name: 'Información de Marca',
    description: 'Recopila la identidad visual y de marca del cliente',
    schema: {
      fields: [
        { id: 'f1', type: 'text', label: 'Nombre de la marca', placeholder: 'Ej: Mi Empresa', required: true, order: 0 },
        { id: 'f2', type: 'text', label: 'Slogan', placeholder: 'Ej: Innovando para ti', required: false, order: 1 },
        { id: 'f3', type: 'textarea', label: 'Descripción de la marca', placeholder: 'Describe tu marca en pocas palabras...', required: true, order: 2 },
        { id: 'f4', type: 'file_upload', label: 'Logo de la empresa', helpText: 'Sube tu logo en formato PNG o SVG', required: true, order: 3 },
        { id: 'f5', type: 'color_picker', label: 'Color primario', helpText: 'El color principal de tu marca', required: true, order: 4 },
        { id: 'f6', type: 'color_picker', label: 'Color secundario', required: false, order: 5 },
        { id: 'f7', type: 'select', label: 'Estilo visual preferido', options: ['Moderno', 'Clásico', 'Minimalista', 'Corporativo', 'Creativo'], required: true, order: 6 },
      ],
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'form-content',
    name: 'Contenido de la Página',
    description: 'Textos e imágenes para cada sección de la página',
    schema: {
      fields: [
        { id: 'c1', type: 'text', label: 'Título principal (Hero)', placeholder: 'Ej: Bienvenido a nuestra empresa', required: true, order: 0 },
        { id: 'c2', type: 'textarea', label: 'Subtítulo del hero', required: false, order: 1 },
        { id: 'c3', type: 'file_upload', label: 'Imagen del hero', required: true, order: 2 },
        { id: 'c4', type: 'rich_text', label: 'Sección "Sobre nosotros"', required: true, order: 3 },
        { id: 'c5', type: 'textarea', label: 'Servicios o productos principales', helpText: 'Lista los principales servicios o productos que ofreces', required: true, order: 4 },
        { id: 'c6', type: 'text', label: 'Llamada a la acción (CTA)', placeholder: 'Ej: Contáctanos ahora', required: true, order: 5 },
      ],
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'form-contact',
    name: 'Información de Contacto',
    description: 'Datos de contacto para la página',
    schema: {
      fields: [
        { id: 'ct1', type: 'email', label: 'Email de contacto', required: true, order: 0 },
        { id: 'ct2', type: 'phone', label: 'Teléfono', required: true, order: 1 },
        { id: 'ct3', type: 'text', label: 'Dirección', required: false, order: 2 },
        { id: 'ct4', type: 'url', label: 'Google Maps URL', required: false, order: 3 },
        { id: 'ct5', type: 'text', label: 'Horario de atención', placeholder: 'Ej: Lun-Vie 9:00-18:00', required: false, order: 4 },
        { id: 'ct6', type: 'url', label: 'Instagram', required: false, order: 5 },
        { id: 'ct7', type: 'url', label: 'Facebook', required: false, order: 6 },
      ],
    },
    createdBy: 'admin-1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'form-social-brand',
    name: 'Marca para Redes Sociales',
    description: 'Identidad de marca adaptada para redes',
    schema: {
      fields: [
        { id: 'sb1', type: 'text', label: 'Nombre de usuario preferido', placeholder: '@tuempresa', required: true, order: 0 },
        { id: 'sb2', type: 'textarea', label: 'Bio / Descripción', helpText: 'Máximo 150 caracteres para Instagram', required: true, order: 1, validation: { maxLength: 150 } },
        { id: 'sb3', type: 'file_upload', label: 'Foto de perfil', required: true, order: 2 },
        { id: 'sb4', type: 'select', label: 'Tono de comunicación', options: ['Formal', 'Casual', 'Divertido', 'Inspiracional', 'Educativo'], required: true, order: 3 },
        { id: 'sb5', type: 'checkbox', label: 'Plataformas activas', options: ['Instagram', 'Facebook', 'Twitter', 'TikTok', 'LinkedIn'], required: true, order: 4 },
        { id: 'sb6', type: 'textarea', label: 'Temas que quieres cubrir', required: true, order: 5 },
      ],
    },
    createdBy: 'admin-1',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

export const mockFlowTemplates: FlowTemplate[] = [
  {
    id: 'flow-web-standard',
    name: 'Onboarding Web Estándar',
    description: 'Flujo completo para el proceso de creación de página web',
    type: 'web',
    isActive: true,
    createdBy: 'admin-1',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'flow-web-ecommerce',
    name: 'Onboarding E-commerce',
    description: 'Flujo para tiendas en línea con catálogo de productos',
    type: 'web',
    isActive: true,
    createdBy: 'admin-1',
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    id: 'flow-social-standard',
    name: 'Onboarding Redes Sociales',
    description: 'Flujo para el servicio de gestión de redes sociales',
    type: 'social',
    isActive: true,
    createdBy: 'admin-1',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
]

export const mockFlowStages: FlowStage[] = [
  // Web Standard Flow
  {
    id: 'stage-web-1',
    flowTemplateId: 'flow-web-standard',
    name: 'Marca e Identidad',
    description: 'Define la identidad visual de tu marca',
    orderIndex: 0,
    popupContent: {
      title: '¡Bienvenido al proceso de creación de tu página!',
      body: 'En esta primera etapa vamos a definir la identidad visual de tu marca. Necesitamos tu logo, colores y estilo preferido para crear un diseño que te represente.',
    },
    formIds: ['form-brand'],
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'stage-web-2',
    flowTemplateId: 'flow-web-standard',
    name: 'Contenido',
    description: 'Proporciona los textos e imágenes de tu página',
    orderIndex: 1,
    dependsOnStageId: 'stage-web-1',
    popupContent: {
      title: 'Hora de agregar tu contenido',
      body: 'Con tu identidad de marca definida, ahora necesitamos los textos e imágenes que aparecerán en tu página web. Incluye títulos, descripciones y fotos de calidad.',
    },
    formIds: ['form-content'],
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'stage-web-3',
    flowTemplateId: 'flow-web-standard',
    name: 'Contacto',
    description: 'Agrega tu información de contacto',
    orderIndex: 2,
    dependsOnStageId: 'stage-web-2',
    popupContent: {
      title: 'Información de contacto',
      body: 'Para que tus clientes puedan encontrarte, necesitamos tu información de contacto, redes sociales y horarios.',
    },
    formIds: ['form-contact'],
    createdAt: '2024-01-20T00:00:00Z',
  },
  // Social Media Flow
  {
    id: 'stage-social-1',
    flowTemplateId: 'flow-social-standard',
    name: 'Perfil de Marca',
    description: 'Define tu presencia en redes sociales',
    orderIndex: 0,
    popupContent: {
      title: '¡Comencemos con tu estrategia de redes!',
      body: 'Vamos a definir cómo se verá y comunicará tu marca en redes sociales. Necesitamos tu foto de perfil, bio y tono de comunicación.',
    },
    formIds: ['form-social-brand'],
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'stage-social-2',
    flowTemplateId: 'flow-social-standard',
    name: 'Estrategia de Contenido',
    description: 'Define los temas y frecuencia de publicación',
    orderIndex: 1,
    dependsOnStageId: 'stage-social-1',
    formIds: [],
    createdAt: '2024-03-01T00:00:00Z',
  },
]

// Client flow instances
export const mockClientFlows: ClientFlow[] = [
  {
    id: 'cf-1',
    clientId: 'client-1',
    flowTemplateId: 'flow-web-standard',
    status: 'in_progress',
    assignedBy: 'admin-1',
    startedAt: '2024-03-16T00:00:00Z',
    createdAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'cf-2',
    clientId: 'client-2',
    flowTemplateId: 'flow-web-ecommerce',
    status: 'in_progress',
    assignedBy: 'admin-1',
    startedAt: '2024-04-02T00:00:00Z',
    createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'cf-3',
    clientId: 'client-3',
    flowTemplateId: 'flow-social-standard',
    status: 'not_started',
    assignedBy: 'admin-1',
    createdAt: '2024-05-10T00:00:00Z',
  },
  {
    id: 'cf-4',
    clientId: 'client-5',
    flowTemplateId: 'flow-web-standard',
    status: 'completed',
    assignedBy: 'admin-1',
    startedAt: '2024-07-02T00:00:00Z',
    completedAt: '2024-08-01T00:00:00Z',
    createdAt: '2024-07-01T00:00:00Z',
  },
]

export const mockClientStageProgress: ClientStageProgress[] = [
  // Client 1 - completed first stage, on second
  { id: 'csp-1', clientFlowId: 'cf-1', stageId: 'stage-web-1', status: 'completed', completedAt: '2024-03-20T00:00:00Z' },
  { id: 'csp-2', clientFlowId: 'cf-1', stageId: 'stage-web-2', status: 'in_progress' },
  { id: 'csp-3', clientFlowId: 'cf-1', stageId: 'stage-web-3', status: 'locked' },
  // Client 5 - all completed
  { id: 'csp-4', clientFlowId: 'cf-4', stageId: 'stage-web-1', status: 'completed', completedAt: '2024-07-10T00:00:00Z' },
  { id: 'csp-5', clientFlowId: 'cf-4', stageId: 'stage-web-2', status: 'completed', completedAt: '2024-07-20T00:00:00Z' },
  { id: 'csp-6', clientFlowId: 'cf-4', stageId: 'stage-web-3', status: 'completed', completedAt: '2024-08-01T00:00:00Z' },
]
