"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    User,
    Settings,
    LayoutDashboard,
    Briefcase,
    BookOpen,
    Star,
    Target,
} from "lucide-react";

interface SidePanelProps {
    isSidePanelOpen: boolean;
}

const SECTIONS = [
    { key: "contact", label: "Contact", icon: User },
    { key: "objective", label: "Objective", icon: Target },
    { key: "skills", label: "Skills", icon: Star },
    { key: "jobs", label: "Jobs", icon: Briefcase },
    { key: "education", label: "Education", icon: BookOpen },
] as const;

export default function SidePanel({ isSidePanelOpen }: SidePanelProps) {
    const pathname = usePathname();
    const onProfilePage = pathname.startsWith("/home/profile");

    return (
        <aside
            className={`bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-4 shadow-md transform transition-transform duration-300 ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
                } w-64 flex-shrink-0 h-screen overflow-y-auto`}
        >
            <nav className="space-y-6">
                {/* Top Navigation */}
                <div className="space-y-1">
                    <NavItem
                        href="/home"
                        label="Dashboard"
                        icon={LayoutDashboard}
                        active={pathname === "/home"}
                    />
                    <NavItem
                        href="/home/settings"
                        label="Settings"
                        icon={Settings}
                        active={pathname === "/home/settings"}
                    />
                    <NavItem
                        href="/home/profile"
                        label="Profile"
                        icon={User}
                        active={pathname === "/home/profile"}
                    />
                </div>

                {/* Profile Sections */}
                <div className="border-t border-neutral-300 dark:border-neutral-700 pt-4">
                    <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide pl-2 mb-2">
                        Profile Sections
                    </h4>
                    <ul className="space-y-1">
                        {SECTIONS.map(({ key, label, icon: Icon }) => (
                            <li key={key}>
                                <a
                                    href={`/home/profile#${key}`}
                                    className="group flex items-center gap-3 rounded px-2 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                >
                                    <Icon
                                        size={16}
                                        className="text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                                    />
                                    <span>{label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Job Ads */}
                <div className="border-t border-neutral-300 dark:border-neutral-700 pt-4">
                    <NavItem
                        href="/home/job-ads"
                        label="Job Ads"
                        icon={Briefcase}
                        active={pathname === "/home/job-ads"}
                    />
                </div>
            </nav>
        </aside>
    );
}

interface NavItemProps {
    href: string;
    label: string;
    icon: React.ElementType;
    active?: boolean;
}

function NavItem({ href, label, icon: Icon, active }: NavItemProps) {
    return (
        <Link
            href={href}
            className={`group flex items-center gap-3 rounded px-2 py-2 text-sm font-medium relative transition focus:outline-none focus:ring-2 focus:ring-blue-500
        ${active
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }
      `}
        >
            {active && (
                <span
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-blue-500"
                    aria-hidden="true"
                />
            )}
            <Icon
                size={16}
                className={`${active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                    }`}
            />
            <span
                className={`${active
                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                    : "text-neutral-700 dark:text-neutral-300"
                    }`}
            >
                {label}
            </span>
        </Link>
    );
}