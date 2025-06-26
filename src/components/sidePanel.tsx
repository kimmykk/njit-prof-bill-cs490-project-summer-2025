"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidePanelProps {
    isSidePanelOpen: boolean;
}

const SECTIONS = [
    { key: "contact", label: "Contact" },
    { key: "objective", label: "Objective" },
    { key: "skills", label: "Skills" },
    { key: "jobs", label: "Jobs" },
    { key: "education", label: "Education" },
] as const;

export default function SidePanel({ isSidePanelOpen }: SidePanelProps) {
    const pathname = usePathname();
    const onProfilePage = pathname === "/home/profile";
    const [showSubsections, setShowSubsections] = useState(false);

    return (
        <aside
            className={`bg-stone-100 dark:bg-stone-900 p-4 shadow transform transition-transform duration-300 ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
                } w-64 flex-shrink-0`}
        >
            <nav>
                <ul>
                    <li className="mb-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                        <Link href="/home" className="block px-3 py-2 hover:underline">
                            Dashboard
                        </Link>
                    </li>

                    <li className="mb-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                        <Link href="/home/settings" className="block px-3 py-2 hover:underline">
                            Settings
                        </Link>
                    </li>

                    {/* Profile Toggle */}
                    <li className="mb-2">
                        <button
                            onClick={() => setShowSubsections(!showSubsections)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${showSubsections
                                ? "bg-black text-white"
                                : "hover:bg-stone-200 dark:hover:bg-stone-700"
                                }`}
                        >
                            <span className="text-left hover:underline">Profile</span>
                            <motion.div
                                animate={{ rotate: showSubsections ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </motion.div>
                        </button>
                    </li>

                    {/* Animated Subsection List */}
                    <AnimatePresence initial={false}>
                        {showSubsections && (
                            <motion.ul
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                {SECTIONS.map(({ key, label }) => (
                                    <li
                                        key={key}
                                        className="mb-2 pl-4 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                                    >
                                        {onProfilePage ? (
                                            <a href={`#${key}`} className="block px-3 py-2 hover:underline">
                                                {label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={`/home/profile#${key}`}
                                                className="block px-3 py-2 hover:underline"
                                            >
                                                {label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </motion.ul>
                        )}
                    </AnimatePresence>
                </ul>
            </nav>
        </aside>
    );
}
