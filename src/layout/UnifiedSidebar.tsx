"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
    BoxCubeIcon,
    CalenderIcon,
    ChevronDownIcon,
    GridIcon,
    HorizontaLDots,
    ListIcon,
    PageIcon,
    PieChartIcon,
    PlugInIcon,
    TableIcon,
    UserCircleIcon,
} from "../icons/index";

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/admin",
    },
    {
        icon: <CalenderIcon />,
        name: "Product List",
        path: "/admin/products",
    },
    {
        icon: <UserCircleIcon />,
        name: "Customer List",
        path: "/admin/customer-list",
    },
    {
        icon: <CalenderIcon />,
        name: "Import/Export",
        path: "/admin/import-export",
    },
    {
        icon: <UserCircleIcon />,
        name: "Profile",
        path: "/profile",
    },
];

const CUSTOMER_NAV_ITEMS: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/",
    },
    {
        icon: <ListIcon />,
        name: "Search Products",
        path: "/search",
    },
    {
        icon: <BoxCubeIcon />,
        name: "Watchlist",
        path: "/watchlist",
    },
    {
        icon: <TableIcon />,
        name: "Product Listing",
        path: "/products",
    },
    {
        icon: <UserCircleIcon />,
        name: "Profile",
        path: "/profile",
    },
];

const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

const getUserRoleFromCookie = (): string | null => {
    try {
        const userInfoCookie = getCookie('userInfo');
        if (!userInfoCookie) return null;
        const decodedUserInfo = decodeURIComponent(userInfoCookie);
        const userInfo = JSON.parse(decodedUserInfo);
        if (userInfo && userInfo.role) {
            return userInfo.role.toUpperCase();
        }
        return null;
    } catch (error) {
        return null;
    }
};

const UnifiedSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserRole = () => {
            setIsLoading(true);
            try {
                let role = getUserRoleFromCookie();
                if (!role) {
                    const storedRole = localStorage.getItem('userRole');
                    if (storedRole === 'ADMIN' || storedRole === 'CUSTOMER') {
                        role = storedRole;
                    }
                }
                if (role === 'ADMIN') {
                    setUserRole('ADMIN');
                    setNavItems([...ADMIN_NAV_ITEMS]);
                    localStorage.setItem('userRole', 'ADMIN');
                }
                else if (role === 'CUSTOMER') {
                    setUserRole('CUSTOMER');
                    setNavItems([...CUSTOMER_NAV_ITEMS]);
                    localStorage.setItem('userRole', 'CUSTOMER');
                }
                else {
                    setUserRole(null);
                    setNavItems([]);
                    localStorage.removeItem('userRole');
                }
            } catch (error) {
                setUserRole(null);
                setNavItems([]);
            } finally {
                setMounted(true);
                setIsLoading(false);
            }
        };
        fetchUserRole();
    }, [pathname]);

    useEffect(() => {
        if (userRole === 'CUSTOMER' && navItems.length === 0) {
            setNavItems([...CUSTOMER_NAV_ITEMS]);
        } else if (userRole === 'ADMIN' && navItems.length === 0) {
            setNavItems([...ADMIN_NAV_ITEMS]);
        }
    }, [userRole, navItems.length]);

    const [openSubmenu, setOpenSubmenu] = useState<{
        type: "main" | "others";
        index: number;
    } | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
    const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const isActive = useCallback((path: string) => {
        if (!pathname) return false;
        if (path === '/') return pathname === path;
        return pathname.startsWith(path);
    }, [pathname]);

    const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
        setOpenSubmenu((prevOpenSubmenu) => {
            if (
                prevOpenSubmenu &&
                prevOpenSubmenu.type === menuType &&
                prevOpenSubmenu.index === index
            ) {
                return null;
            }
            return { type: menuType, index };
        });
    };

    const renderMenuItems = (navItems: NavItem[], menuType: "main" | "others") => {
        if (!navItems || navItems.length === 0) {
            return (
                <div className="text-gray-500 px-4 py-2 text-sm">
                    {userRole === null ? "Please log in to see menu" : `No menu items available for role: ${userRole}`}
                </div>
            );
        }

        return (
            <ul className="flex flex-col gap-4">
                {navItems.map((nav, index) => (
                    <li key={nav.name}>
                        {nav.subItems ? (
                            <button
                                onClick={() => handleSubmenuToggle(index, menuType)}
                                className={`menu-item group w-full ${openSubmenu?.type === menuType && openSubmenu?.index === index
                                    ? "menu-item-active"
                                    : "menu-item-inactive"
                                    } cursor-pointer ${!isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "lg:justify-start"
                                    }`}
                            >
                                <span
                                    className={`${openSubmenu?.type === menuType && openSubmenu?.index === index
                                        ? "menu-item-icon-active"
                                        : "menu-item-icon-inactive"
                                        }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text" suppressHydrationWarning>
                                        {nav.name}
                                    </span>
                                )}
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <ChevronDownIcon
                                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                                            openSubmenu?.index === index
                                            ? "rotate-180 text-brand-500"
                                            : ""
                                            }`}
                                    />
                                )}
                            </button>
                        ) : (
                            nav.path && (
                                <Link
                                    href={nav.path}
                                    className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                                        }`}
                                >
                                    <span
                                        className={`${isActive(nav.path)
                                            ? "menu-item-icon-active"
                                            : "menu-item-icon-inactive"
                                            }`}
                                    >
                                        {nav.icon}
                                    </span>
                                    {(isExpanded || isHovered || isMobileOpen) && (
                                        <span className="menu-item-text" suppressHydrationWarning>
                                            {nav.name}
                                        </span>
                                    )}
                                </Link>
                            )
                        )}
                        {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                            <div
                                ref={(el) => {
                                    subMenuRefs.current[`${menuType}-${index}`] = el;
                                }}
                                className="overflow-hidden transition-all duration-300"
                                style={{
                                    height:
                                        openSubmenu?.type === menuType && openSubmenu?.index === index
                                            ? `${subMenuHeight[`${menuType}-${index}`]}px`
                                            : "0px",
                                }}
                            >
                                <ul className="mt-2 space-y-1 ml-9">
                                    {nav.subItems.map((subItem) => (
                                        <li key={subItem.name}>
                                            <Link
                                                href={subItem.path}
                                                className={`menu-dropdown-item ${isActive(subItem.path)
                                                    ? "menu-dropdown-item-active"
                                                    : "menu-dropdown-item-inactive"
                                                    }`}
                                            >
                                                {subItem.name}
                                                <span className="flex items-center gap-1 ml-auto">
                                                    {subItem.new && (
                                                        <span
                                                            className={`ml-auto ${isActive(subItem.path)
                                                                ? "menu-dropdown-badge-active"
                                                                : "menu-dropdown-badge-inactive"
                                                                } menu-dropdown-badge `}
                                                        >
                                                            new
                                                        </span>
                                                    )}
                                                    {subItem.pro && (
                                                        <span
                                                            className={`ml-auto ${isActive(subItem.path)
                                                                ? "menu-dropdown-badge-active"
                                                                : "menu-dropdown-badge-inactive"
                                                                } menu-dropdown-badge `}
                                                        >
                                                            pro
                                                        </span>
                                                    )}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    useEffect(() => {
        if (!mounted || navItems.length === 0) return;
        let submenuMatched = false;
        ["main", "others"].forEach((menuType) => {
            navItems.forEach((nav, index) => {
                if (nav.subItems) {
                    nav.subItems.forEach((subItem) => {
                        if (isActive(subItem.path)) {
                            setOpenSubmenu({
                                type: menuType as "main" | "others",
                                index,
                            });
                            submenuMatched = true;
                        }
                    });
                }
            });
        });
        if (!submenuMatched) {
            setOpenSubmenu(null);
        }
    }, [pathname, isActive, navItems, mounted]);

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `${openSubmenu.type}-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prevHeights) => ({
                    ...prevHeights,
                    [key]: subMenuRefs.current[key]?.scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    if (isLoading || !mounted) {
        return (
            <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 w-[290px]">
                <div className="py-8 flex justify-start">
                    <div className="w-[150px] h-[40px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                </div>
                <div className="flex flex-col gap-4 px-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
                    ? "w-[290px]"
                    : isHovered
                        ? "w-[290px]"
                        : "w-[90px]"
                }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                    }`}
            >
                <Link href={userRole === "ADMIN" ? "/admin" : "/dashboard"}>
                    {isExpanded || isHovered || isMobileOpen ? (
                        <>
                            <Image
                                className="dark:hidden"
                                src="/images/logo/ai_product_finder.png"
                                alt="Logo"
                                width={150}
                                height={40}
                                style={{ height: "auto", width: "auto" }}
                                loading="eager"
                                priority
                            />
                            <Image
                                className="hidden dark:block"
                                src="/images/logo/ai_product_finder.png"
                                alt="Logo"
                                width={150}
                                height={40}
                                style={{ height: "auto", width: "auto" }}
                                loading="eager"
                                priority
                            />
                        </>
                    ) : (
                        <Image
                            src="/images/logo/logo-icon.svg"
                            alt="Logo"
                            width={32}
                            height={32}
                            style={{ width: "auto", height: "auto" }}
                        />
                    )}
                </Link>
            </div>
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                                    ? "lg:justify-center"
                                    : "justify-start"
                                    }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    "Menu"
                                ) : (
                                    <HorizontaLDots />
                                )}
                            </h2>
                            {navItems.length > 0 ? (
                                renderMenuItems(navItems, "main")
                            ) : (
                                <div className="text-gray-500 px-4 py-2 text-sm">
                                    {userRole === null ? "Please log in to see menu" : `No menu items available for role: ${userRole}`}
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default UnifiedSidebar;