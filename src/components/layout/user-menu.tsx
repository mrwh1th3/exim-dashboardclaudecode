'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { LogOut, ChevronDown, User } from 'lucide-react';

export function UserMenu() {
	const user = useAuthStore((s) => s.user);
	const { logout } = useAuthStore();
	const [isOpen, setIsOpen] = React.useState(false);

	const handleLogout = async () => {
		await logout();
		setIsOpen(false);
	};

	return (
		<div className="relative">
			<Button
				variant="outline"
				size="sm"
				className="hidden sm:flex gap-2"
				onClick={() => setIsOpen(!isOpen)}
			>
				<User size={14} />
				{user?.fullName || 'Usuario'}
				<ChevronDown size={14} />
			</Button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-1 w-48 rounded-[15px] border bg-popover shadow-md z-50">
					<div className="p-3 border-b">
						<p className="text-sm font-medium">{user?.fullName}</p>
						<p className="text-xs text-muted-foreground">{user?.email}</p>
						<p className="text-xs text-muted-foreground/70 mt-1 capitalize">
							{user?.role === 'admin' ? 'Administrador' : user?.role === 'client' ? 'Cliente' : user?.role}
						</p>
					</div>
					<div className="p-1">
						<button
							className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent text-destructive"
							onClick={handleLogout}
						>
							<LogOut size={14} />
							Cerrar Sesión
						</button>
					</div>
				</div>
			)}

			{isOpen && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setIsOpen(false)}
				/>
			)}
		</div>
	);
}
