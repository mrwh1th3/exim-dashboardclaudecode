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
import { cn } from '@/lib/utils';

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
				<div className="absolute right-0 top-full mt-2 w-52 rounded-[15px] border bg-popover shadow-lg z-50 overflow-hidden">
					{/* User info */}
					<div className="px-3 py-3 border-b">
						<p className="text-sm font-medium leading-snug">{user?.fullName}</p>
						<p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
					</div>

					{/* Role items */}
					<div className="p-1.5 space-y-0.5">
						{roles.map((role) => (
							<button
								key={role.value}
								className={cn(
									'w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-[10px] transition-colors hover:bg-accent',
									user?.role === role.value && 'bg-accent'
								)}
								onClick={() => {
									setRole(role.value as any);
									setIsOpen(false);
								}}
							>
								<role.icon size={14} className="text-muted-foreground" />
								{role.label}
							</button>
						))}
					</div>

					{/* Logout */}
					<div className="p-1.5 border-t">
						<button
							className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-[10px] transition-colors hover:bg-accent text-destructive"
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
