"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/audit",   label: "Audit Contract" },
  { href: "/escrow",  label: "Escrow Vault"   },
  { href: "/dispute", label: "Dispute"        },
  { href: "/about",   label: "About"          },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg">
          <Shield className="w-5 h-5 text-teal-400" />
          Gig<span className="text-teal-400">Shield</span>
        </Link>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-teal-500/20 text-teal-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
