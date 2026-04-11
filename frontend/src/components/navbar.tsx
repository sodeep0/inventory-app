"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PhosphorIcon } from "@/components/icons"

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="border-b border-border/60 bg-background sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}>
          <PhosphorIcon name="PackageIcon" size={20} />
          <span className="text-lg tracking-tight">Stock Keeper</span>
        </Link>
        
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {user && (
            <>
              <Link
                href="/inventory"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Inventory
              </Link>
              <Link
                href="/movements"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Movements
              </Link>
              <Link
                href="/reports"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Reports
              </Link>
              <Link
                href="/profile"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Profile
              </Link>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {user ? (
            <Button variant="outline" onClick={handleLogout} size="sm">
              Logout
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
          >
            <PhosphorIcon name={isMobileMenuOpen ? "X" : "List"} size={20} />
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-border/60 md:hidden">
          <div className="mx-auto px-4 py-4 space-y-3 max-w-6xl">
            {user && (
              <nav className="space-y-1">
                <Link
                  href="/inventory"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Inventory
                </Link>
                <Link
                  href="/movements"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Movements
                </Link>
                <Link
                  href="/reports"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Reports
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </nav>
            )}
            <div className="pt-3 border-t border-border/60">
              {user ? (
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
