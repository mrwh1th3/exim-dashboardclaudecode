'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SocialAccount, Platform } from '@/types/social'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Wifi, WifiOff, Plus, Instagram, Globe } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

interface ClientOption { id: string; fullName: string }

const NETWORK_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: '📸' },
  facebook: { label: 'Facebook', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🌐' },
  tiktok: { label: 'TikTok', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '🎵' },
  twitter: { label: 'Twitter / X', color: 'bg-sky-100 text-sky-800 border-sky-200', icon: '🐦' },
  linkedin: { label: 'LinkedIn', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '💼' },
}

export default function SocialAccountsPage() {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [filterClient, setFilterClient] = useState<string>('all')
  const [addDialog, setAddDialog] = useState(false)
  const [disconnectDialog, setDisconnectDialog] = useState(false)
  const [targetAccount, setTargetAccount] = useState<SocialAccount | null>(null)
  const [newAccount, setNewAccount] = useState({
    clientId: '', network: '' as Platform | '', accountId: '', accountName: '', accessToken: '', refreshToken: '', expiresAt: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: cl }, { data: acc }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'client').order('full_name'),
        supabase.from('social_accounts').select('*').order('created_at', { ascending: false }),
      ])
      setClients((cl ?? []).map((c: any) => ({ id: c.id, fullName: c.full_name ?? '' })))
      setAccounts((acc ?? []).map(mapRow))
    }
    void load()
  }, [])

  function mapRow(row: any): SocialAccount {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      network: row.network as Platform,
      accountId: row.account_id,
      accountName: row.account_name ?? undefined,
      accessToken: row.access_token,
      refreshToken: row.refresh_token ?? undefined,
      expiresAt: row.expires_at ?? undefined,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  const filteredAccounts = filterClient === 'all' ? accounts : accounts.filter((a) => a.tenantId === filterClient)

  function getClientName(tenantId: string) {
    return clients.find((c) => c.id === tenantId)?.fullName ?? tenantId.slice(0, 8)
  }

  async function handleAdd() {
    if (!newAccount.clientId || !newAccount.network || !newAccount.accountId || !newAccount.accessToken) {
      toast.error('Cliente, red, ID de cuenta y access token son requeridos')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('social_accounts').upsert(
      {
        tenant_id: newAccount.clientId,
        network: newAccount.network,
        account_id: newAccount.accountId,
        account_name: newAccount.accountName || null,
        access_token: newAccount.accessToken,
        refresh_token: newAccount.refreshToken || null,
        expires_at: newAccount.expiresAt || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,network' }
    )
    if (error) { toast.error('Error al guardar'); setSaving(false); return }
    // Reload
    const { data } = await supabase.from('social_accounts').select('*').order('created_at', { ascending: false })
    setAccounts((data ?? []).map(mapRow))
    setNewAccount({ clientId: '', network: '', accountId: '', accountName: '', accessToken: '', refreshToken: '', expiresAt: '' })
    setAddDialog(false)
    toast.success('Cuenta social conectada')
    setSaving(false)
  }

  async function handleDisconnect() {
    if (!targetAccount) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('social_accounts')
      .update({ is_active: false, access_token: '', refresh_token: null, updated_at: new Date().toISOString() })
      .eq('id', targetAccount.id)
    setAccounts((prev) => prev.map((a) => a.id === targetAccount.id ? { ...a, isActive: false } : a))
    toast.success('Cuenta desconectada')
    setDisconnectDialog(false)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cuentas Sociales</h2>
          <p className="text-muted-foreground">Conexiones OAuth por cliente para publicación automática</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />Conectar cuenta
        </Button>
      </div>

      <div className="w-64">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger><SelectValue placeholder="Filtrar por cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredAccounts.length === 0 ? (
        <EmptyState icon={<Wifi className="h-10 w-10" />} title="Sin cuentas conectadas" description="Conecta las cuentas sociales de tus clientes para habilitar la publicación automática." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => {
            const cfg = NETWORK_CONFIG[account.network]
            const isExpired = account.expiresAt && new Date(account.expiresAt) < new Date()
            return (
              <Card key={account.id} className={account.isActive ? '' : 'opacity-60'}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cfg.icon}</span>
                      <div>
                        <CardTitle className="text-sm">{cfg.label}</CardTitle>
                        <CardDescription className="text-xs">{getClientName(account.tenantId)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {account.isActive && !isExpired ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
                          <Wifi className="h-3 w-3 mr-1" />Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                          <WifiOff className="h-3 w-3 mr-1" />{isExpired ? 'Token vencido' : 'Desconectado'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">@{account.accountName || account.accountId}</p>
                  {account.expiresAt && (
                    <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-500' : 'text-muted-foreground'}`}>
                      Token {isExpired ? 'venció' : 'vence'}: {new Date(account.expiresAt).toLocaleDateString('es-MX')}
                    </p>
                  )}
                  {account.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full text-xs h-7"
                      onClick={() => { setTargetAccount(account); setDisconnectDialog(true) }}
                    >
                      <WifiOff className="h-3 w-3 mr-1" />Desconectar
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add account dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar cuenta social</DialogTitle>
            <DialogDescription>Ingresa las credenciales OAuth del cliente para habilitar la publicación automática.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Select value={newAccount.clientId} onValueChange={(v) => setNewAccount({ ...newAccount, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Red social</Label>
              <Select value={newAccount.network} onValueChange={(v) => setNewAccount({ ...newAccount, network: v as Platform })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar red" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NETWORK_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Account ID</Label>
                <Input value={newAccount.accountId} onChange={(e) => setNewAccount({ ...newAccount, accountId: e.target.value })} placeholder="ID de la cuenta" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nombre (@)</Label>
                <Input value={newAccount.accountName} onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })} placeholder="@usuario" className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Access Token</Label>
              <Input value={newAccount.accessToken} onChange={(e) => setNewAccount({ ...newAccount, accessToken: e.target.value })} placeholder="Bearer token..." className="h-8 text-sm font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Refresh Token (opcional)</Label>
              <Input value={newAccount.refreshToken} onChange={(e) => setNewAccount({ ...newAccount, refreshToken: e.target.value })} placeholder="Refresh token..." className="h-8 text-sm font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Token vence el (opcional)</Label>
              <Input type="datetime-local" value={newAccount.expiresAt} onChange={(e) => setNewAccount({ ...newAccount, expiresAt: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Guardando...' : 'Conectar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirm */}
      <Dialog open={disconnectDialog} onOpenChange={setDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar cuenta</DialogTitle>
            <DialogDescription>
              {targetAccount && `¿Desconectar ${NETWORK_CONFIG[targetAccount.network]?.label} de ${getClientName(targetAccount.tenantId)}? El token será invalidado.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={saving}>{saving ? 'Desconectando...' : 'Desconectar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
