"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { FileText, Terminal, Code, BarChart, Menu, Server, Database } from "lucide-react"

const sidebarItems = [
  { name: "File Explorer", href: "/file-explorer", icon: FileText },
  { name: "Terminal", href: "/terminal", icon: Terminal },
  { name: "Remote Execution", href: "/remote-execution", icon: Code },
  { name: "Docker Management", href: "/docker", icon: Database },
  { name: "Logs", href: "/logs", icon: BarChart },
  { name: "Connections", href: "/connections", icon: Server },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="md:hidden fixed left-4 top-4 z-40">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col space-y-2">
            {sidebarItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="hidden md:flex flex-col space-y-2 w-[300px] p-4 border-r">
        <nav className="flex flex-col space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <main className="flex-1 overflow-y-auto p-4">
        <ScrollArea className="h-full">{children}</ScrollArea>
      </main>
    </div>
  )
}
