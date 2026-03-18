'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import {
	LayoutDashboard,
	Settings,
	Users,
	ChevronDown,
	LogOut,
} from 'lucide-react';

export function RoleSwitcher() {
	const user = useAuthStore((s) => s.user);
	const { setRole, logout } = useAuthStore();
	const [isOpen, setIsOpen] = React.useState(false);
	const router = useRouter();

	const roles = [
		{ value: 'admin', label: 'Admin', icon: LayoutDashboard },
		{ value: 'editor', label: 'Editor', icon: Settings },
		{ value: 'client', label: 'Cliente', icon: Users },
	];

	const handleLogout = async () => {
		setIsOpen(false);
		await logout();
		router.replace('/login');
	};

	return (
		<div className="relative">
			<Button
				variant="outline"
				size="sm"
				className="hidden sm:flex gap-2"
				onClick={() => setIsOpen(!isOpen)}
			>
				{roles.find(r => r.value === user?.role)?.icon &&
					React.createElement(roles.find(r => r.value === user?.role)!.icon, { size: 14 })
				}
				{user?.fullName || 'Usuario'}
				<ChevronDown size={14} />
			</Button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-1 w-48 rounded-[15px] border bg-popover shadow-md z-50">
					<div className="p-2">
						<p className="text-sm font-medium">{user?.fullName}</p>
						<p className="text-xs text-muted-foreground">{user?.email}</p>
					</div>
					<div className="border-t p-1">
						{roles.map((role) => (
							<button
								key={role.value}
								className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent ${
									user?.role === role.value ? 'bg-accent' : ''
								}`}
								onClick={() => {
									setRole(role.value as any);
									setIsOpen(false);
								}}
							>
								<role.icon size={14} />
								{role.label}
							</button>
						))}
					</div>
					<div className="border-t p-1">
						<button
							className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-destructive"
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
