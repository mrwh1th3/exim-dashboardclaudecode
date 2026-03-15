'use client'

import { useState } from 'react'
import { mockRequestStatuses } from '@/data/mock-requests'
import { RequestStatus } from '@/types/requests'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react'

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<RequestStatus[]>(
    [...mockRequestStatuses].sort((a, b) => a.orderIndex - b.orderIndex)
  )

  const handleNameChange = (id: string, name: string) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
  }

  const handleColorChange = (id: string, color: string) => {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)))
  }

  const handleDefaultToggle = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => ({
        ...s,
        isDefault: s.id === id ? !s.isDefault : false,
      }))
    )
  }

  const handleDelete = (id: string) => {
    setStatuses((prev) => {
      const filtered = prev.filter((s) => s.id !== id)
      return filtered.map((s, i) => ({ ...s, orderIndex: i }))
    })
    toast.success('Estado eliminado')
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setStatuses((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((s, i) => ({ ...s, orderIndex: i }))
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === statuses.length - 1) return
    setStatuses((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((s, i) => ({ ...s, orderIndex: i }))
    })
  }

  const handleAdd = () => {
    const newStatus: RequestStatus = {
      id: `status-${Date.now()}`,
      name: 'Nuevo Estado',
      color: '#6B7280',
      orderIndex: statuses.length,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    setStatuses([...statuses, newStatus])
  }

  const handleSave = () => {
    toast.success('Estados guardados exitosamente')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estados Personalizados</h2>
        <p className="text-muted-foreground">Configura los estados disponibles para las solicitudes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estados de Solicitudes</CardTitle>
          <CardDescription>Usa las flechas para reordenar los estados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statuses.map((status, index) => (
            <div
              key={status.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === statuses.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>

              <span className="text-xs text-muted-foreground font-mono w-5 text-center">
                {status.orderIndex}
              </span>

              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: status.color }}
              />

              <Input
                value={status.name}
                onChange={(e) => handleNameChange(status.id, e.target.value)}
                className="flex-1 h-8"
              />

              <div className="flex items-center gap-1.5">
                <Label htmlFor={`color-${status.id}`} className="sr-only">
                  Color
                </Label>
                <Input
                  id={`color-${status.id}`}
                  type="color"
                  value={status.color}
                  onChange={(e) => handleColorChange(status.id, e.target.value)}
                  className="h-8 w-12 p-0.5 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Label htmlFor={`default-${status.id}`} className="text-xs whitespace-nowrap">
                  Default
                </Label>
                <Switch
                  id={`default-${status.id}`}
                  checked={status.isDefault}
                  onCheckedChange={() => handleDefaultToggle(status.id)}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(status.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Estado
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" />
        Guardar cambios
      </Button>
    </div>
  )
}
