'use client';

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useClientServices } from '@/hooks/use-client-services'
import { Button } from '@/components/ui/button';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import { UserMenu } from '@/components/layout/user-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
	LayoutDashboard,
	Users,
	GitBranch,
	MessageSquare,
	CreditCard,
	Calendar,
	Settings,
	Megaphone,
	ClipboardList,
	Home,
	Send,
	Eye,
	BarChart3,
	Globe,
	FolderOpen,
	Palette,
	Wifi,
	CheckSquare,
	LogOut,
} from 'lucide-react';

type LinkItem = {
	title: string;
	href: string;
	icon: React.ReactNode;
	description?: string;
};

export function HorizontalHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
	const pathname = usePathname();
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const { hasSocialMedia } = useClientServices();
	const isClient = user?.role === 'client';

	async function handleLogout() {
		await logout();
		router.push('/login');
	}

	React.useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [mobileMenuOpen]);

	const adminNav: LinkItem[] = [
		{ title: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={16} />, description: 'Panel principal' },
		{ title: 'Clientes', href: '/admin/clients', icon: <Users size={16} />, description: 'Gestionar clientes' },
		{ title: 'Flujos', href: '/admin/onboarding', icon: <GitBranch size={16} />, description: 'Procesos onboarding' },
		{ title: 'Solicitudes', href: '/admin/requests', icon: <MessageSquare size={16} />, description: 'Ver solicitudes' },
		{ title: 'Suscripciones', href: '/admin/subscriptions', icon: <CreditCard size={16} />, description: 'Gestionar suscripciones' },
	];

	const adminSocialNav: LinkItem[] = [
		{ title: 'Calendario', href: '/admin/social/calendar', icon: <Calendar size={16} />, description: 'Calendario de contenido' },
		{ title: 'Posts', href: '/admin/social/posts', icon: <Megaphone size={16} />, description: 'Gestionar posts y stories' },
		{ title: 'Estrategia', href: '/admin/social/strategy', icon: <BarChart3 size={16} />, description: 'Ciclo bimestral de estrategia' },
		{ title: 'Brand Guideline', href: '/admin/social/brand', icon: <Palette size={16} />, description: 'Identidad visual de cada marca' },
		{ title: 'Archivos', href: '/admin/social/files', icon: <FolderOpen size={16} />, description: 'Archivos multimedia' },
	];

	const adminWebNav: LinkItem[] = [
		{ title: 'Páginas', href: '/admin/web', icon: <Globe size={16} />, description: 'Gestionar páginas web' },
		{ title: 'Archivos', href: '/admin/web/files', icon: <FolderOpen size={16} />, description: 'Archivos web' },
	];

	const adminSettingsNav: LinkItem[] = [
		{ title: 'Configuración', href: '/admin/settings', icon: <Settings size={16} />, description: 'Configuración general' },
		{ title: 'Estados', href: '/admin/settings/statuses', icon: <ClipboardList size={16} />, description: 'Gestionar estados' },
		{ title: 'Cuentas Sociales', href: '/admin/settings/social-accounts', icon: <Wifi size={16} />, description: 'Conexiones OAuth por cliente' },
	];

	const clientNav: LinkItem[] = [
		{ title: 'Inicio', href: '/client', icon: <Home size={16} />, description: 'Panel principal' },
		{ title: 'Onboarding', href: '/client/onboarding', icon: <GitBranch size={16} />, description: 'Mi proceso' },
		{ title: 'Solicitudes', href: '/client/requests', icon: <Send size={16} />, description: 'Mis solicitudes' },
		{ title: 'Suscripción', href: '/client/subscription', icon: <CreditCard size={16} />, description: 'Mi suscripción' },
	];

	const clientSocialNav: LinkItem[] = [
		{ title: 'Publicaciones', href: '/client/social/posts', icon: <CheckSquare size={16} />, description: 'Aprobar o pedir cambios' },
		{ title: 'Calendario', href: '/client/social/calendar', icon: <Calendar size={16} />, description: 'Calendario de contenido' },
		{ title: 'Estrategia', href: '/client/social/strategy', icon: <Eye size={16} />, description: 'Ver estrategia' },
		{ title: 'Brand Guideline', href: '/client/social/brand', icon: <Palette size={16} />, description: 'Identidad visual de mi marca' },
		{ title: 'Archivos', href: '/client/social/files', icon: <FolderOpen size={16} />, description: 'Mis archivos' },
	];

	const clientWebNav: LinkItem[] = [
		{ title: 'Mi Página', href: '/client/web', icon: <Globe size={16} />, description: 'Mi página web' },
		{ title: 'Archivos', href: '/client/web/files', icon: <FolderOpen size={16} />, description: 'Archivos web' },
	];

	const mainNav = isClient ? clientNav : adminNav;
	const socialNav = isClient && hasSocialMedia ? clientSocialNav : adminSocialNav;
	const webNav = isClient ? clientWebNav : adminWebNav;
	const settingsNav = !isClient ? adminSettingsNav : [];

	const isActive = (href: string) => {
		return pathname === href || (href !== '/admin' && href !== '/client' && pathname.startsWith(href));
	};

	const navLinkClass = (href: string) =>
		cn(
			'block select-none space-y-1 rounded-[15px] p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
			isActive(href) && 'bg-accent text-accent-foreground'
		);

	return (
		<>
			<header className="sticky top-0 z-50 w-full bg-background">
				<nav className="flex h-14 w-full items-center justify-between px-6">
					{/* Logo — esquina izquierda */}
					<Link
						href={isClient ? '/client' : '/admin'}
						className="flex items-center gap-2 hover:bg-accent rounded-[15px] px-3 py-1.5"
					>
						<span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-wide">
							Exim
						</span>
					</Link>

					{/* Desktop Navigation — centro */}
					<NavigationMenu className="hidden lg:flex">
						<NavigationMenuList>
							<NavigationMenuItem>
								<NavigationMenuTrigger className="bg-transparent">Principal</NavigationMenuTrigger>
								<NavigationMenuContent>
									<div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
										{mainNav.map((item) => (
											<NavigationMenuLink key={item.href} asChild>
												<Link href={item.href} className={navLinkClass(item.href)}>
													<div className="flex items-center gap-2 text-sm font-medium leading-none">
														{item.icon}
														{item.title}
													</div>
													<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
														{item.description}
													</p>
												</Link>
											</NavigationMenuLink>
										))}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{(!isClient || hasSocialMedia) && (
								<NavigationMenuItem>
									<NavigationMenuTrigger className="bg-transparent">Redes Sociales</NavigationMenuTrigger>
									<NavigationMenuContent>
										<div className="grid w-[400px] gap-3 p-4 md:w-[500px]">
											{socialNav.map((item) => (
												<NavigationMenuLink key={item.href} asChild>
													<Link href={item.href} className={navLinkClass(item.href)}>
														<div className="flex items-center gap-2 text-sm font-medium leading-none">
															{item.icon}
															{item.title}
														</div>
														<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
															{item.description}
														</p>
													</Link>
												</NavigationMenuLink>
											))}
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}

							<NavigationMenuItem>
								<NavigationMenuTrigger className="bg-transparent">Página Web</NavigationMenuTrigger>
								<NavigationMenuContent>
									<div className="grid w-[300px] gap-3 p-4">
										{webNav.map((item) => (
											<NavigationMenuLink key={item.href} asChild>
												<Link href={item.href} className={navLinkClass(item.href)}>
													<div className="flex items-center gap-2 text-sm font-medium leading-none">
														{item.icon}
														{item.title}
													</div>
													<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
														{item.description}
													</p>
												</Link>
											</NavigationMenuLink>
										))}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{!isClient && settingsNav.length > 0 && (
								<NavigationMenuItem>
									<NavigationMenuTrigger className="bg-transparent">Sistema</NavigationMenuTrigger>
									<NavigationMenuContent>
										<div className="grid w-[250px] gap-3 p-4">
											{settingsNav.map((item) => (
												<NavigationMenuLink key={item.href} asChild>
													<Link href={item.href} className={navLinkClass(item.href)}>
														<div className="flex items-center gap-2 text-sm font-medium leading-none">
															{item.icon}
															{item.title}
														</div>
														<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
															{item.description}
														</p>
													</Link>
												</NavigationMenuLink>
											))}
										</div>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)}
						</NavigationMenuList>
					</NavigationMenu>

					{/* Acciones — esquina derecha */}
					<div className="flex items-center gap-3">
						<UserMenu />
						<ThemeToggle />
						<Button
							size="icon"
							variant="outline"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="lg:hidden"
							aria-expanded={mobileMenuOpen}
							aria-controls="mobile-menu"
							aria-label="Toggle menu"
						>
							<MenuToggleIcon open={mobileMenuOpen} className="size-5" duration={300} />
						</Button>
					</div>
				</nav>
			</header>

			{/* Mobile Menu */}
			{mobileMenuOpen && typeof window !== 'undefined' && createPortal(
				<div
					id="mobile-menu"
					className="fixed top-14 right-0 bottom-0 left-0 z-40 bg-background/95 backdrop-blur-lg lg:hidden"
				>
					<div className="flex h-full flex-col overflow-y-auto p-4">
						<div className="space-y-6">
							{/* Main Navigation */}
							<div>
								<h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
									Principal
								</h3>
								<div className="space-y-2">
									{mainNav.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setMobileMenuOpen(false)}
											className={cn(
												'flex items-center gap-3 rounded-[15px] px-3 py-2 text-sm font-medium transition-colors',
												isActive(item.href)
													? 'bg-primary text-primary-foreground'
													: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
											)}
										>
											{item.icon}
											<div>
												<div>{item.title}</div>
												{item.description && (
													<div className="text-xs text-muted-foreground">{item.description}</div>
												)}
											</div>
										</Link>
									))}
								</div>
							</div>

							{/* Social Navigation */}
							{(!isClient || hasSocialMedia) && (
								<div>
									<h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
										Redes Sociales
									</h3>
									<div className="space-y-2">
										{socialNav.map((item) => (
											<Link
												key={item.href}
												href={item.href}
												onClick={() => setMobileMenuOpen(false)}
												className={cn(
													'flex items-center gap-3 rounded-[15px] px-3 py-2 text-sm font-medium transition-colors',
													isActive(item.href)
														? 'bg-primary text-primary-foreground'
														: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
												)}
											>
												{item.icon}
												<div>
													<div>{item.title}</div>
													{item.description && (
														<div className="text-xs text-muted-foreground">{item.description}</div>
													)}
												</div>
											</Link>
										))}
									</div>
								</div>
							)}

							{/* Web Navigation */}
							<div>
								<h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
									Página Web
								</h3>
								<div className="space-y-2">
									{webNav.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setMobileMenuOpen(false)}
											className={cn(
												'flex items-center gap-3 rounded-[15px] px-3 py-2 text-sm font-medium transition-colors',
												isActive(item.href)
													? 'bg-primary text-primary-foreground'
													: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
											)}
										>
											{item.icon}
											<div>
												<div>{item.title}</div>
												{item.description && (
													<div className="text-xs text-muted-foreground">{item.description}</div>
												)}
											</div>
										</Link>
									))}
								</div>
							</div>

							{/* Settings Navigation */}
							{!isClient && settingsNav.length > 0 && (
								<div>
									<h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
										Sistema
									</h3>
									<div className="space-y-2">
										{settingsNav.map((item) => (
											<Link
												key={item.href}
												href={item.href}
												onClick={() => setMobileMenuOpen(false)}
												className={cn(
													'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
													isActive(item.href)
														? 'bg-primary text-primary-foreground'
														: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
												)}
											>
												{item.icon}
												<div>
													<div>{item.title}</div>
													{item.description && (
														<div className="text-xs text-muted-foreground">{item.description}</div>
													)}
												</div>
											</Link>
										))}
									</div>
								</div>
							)}

							{/* Logout — mobile */}
							<button
								onClick={handleLogout}
								className="flex w-full items-center gap-3 rounded-[15px] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								<LogOut size={16} />
								Cerrar sesión
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}
		</>
	);
}
