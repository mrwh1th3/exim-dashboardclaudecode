import { Profile } from '@/types/auth'

export const mockAdmins: Profile[] = [
  {
    id: 'admin-1',
    email: 'admin@exim.com',
    fullName: 'Victor Admin',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'editor-1',
    email: 'editor@exim.com',
    fullName: 'Maria Editor',
    role: 'editor',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

export const mockClients: Profile[] = [
  {
    id: 'client-1',
    email: 'carlos@empresa1.com',
    fullName: 'Carlos Méndez',
    role: 'client',
    companyName: 'Restaurante El Sabor',
    phone: '+52 55 1234 5678',
    isActive: true,
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 'client-2',
    email: 'ana@tiendamoda.com',
    fullName: 'Ana García',
    role: 'client',
    companyName: 'Tienda Moda Express',
    phone: '+52 55 9876 5432',
    isActive: true,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'client-3',
    email: 'roberto@fitness.com',
    fullName: 'Roberto López',
    role: 'client',
    companyName: 'FitLife Gym',
    phone: '+52 33 5555 1234',
    isActive: true,
    createdAt: '2024-05-10T00:00:00Z',
    updatedAt: '2024-05-10T00:00:00Z',
  },
  {
    id: 'client-4',
    email: 'laura@consultoria.com',
    fullName: 'Laura Hernández',
    role: 'client',
    companyName: 'Consultoría LH',
    phone: '+52 81 4444 5678',
    isActive: false,
    createdAt: '2024-06-20T00:00:00Z',
    updatedAt: '2024-08-15T00:00:00Z',
  },
  {
    id: 'client-5',
    email: 'pedro@techstart.com',
    fullName: 'Pedro Ramírez',
    role: 'client',
    companyName: 'TechStart MX',
    phone: '+52 55 7777 8888',
    isActive: true,
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z',
  },
]

export const allProfiles: Profile[] = [...mockAdmins, ...mockClients]
