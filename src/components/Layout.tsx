import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import CorteplanLogo from './CorteplanLogo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, FolderKanban, PlusCircle } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'CP'
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] text-[#1F1F1F]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#DCDCDC] shadow-xs backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center hover:opacity-95 transition-opacity">
              <CorteplanLogo />
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/'
                      ? 'bg-[#FFF3EC] text-[#F2612A] font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-black/5'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Gerador de Pranchas
                </Link>
                <Link
                  to="/projetos"
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/projetos'
                      ? 'bg-[#FFF3EC] text-[#F2612A] font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-black/5'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  Meus Projetos
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/projetos" className="hidden sm:inline-flex md:hidden">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <FolderKanban className="w-4 h-4 mr-1" />
                    Projetos
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F2612A]/40">
                      <Avatar className="h-9 w-9 border border-[#DCDCDC] bg-[#FFF3EC] text-[#F2612A] font-bold text-xs">
                        <AvatarFallback className="bg-[#FFF3EC] text-[#F2612A]">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col text-left">
                        <span className="text-xs font-semibold text-[#1F1F1F] leading-tight">
                          {user.name || 'Usuário'}
                        </span>
                        <span className="text-[10px] text-[#6B6B6B] leading-none truncate max-w-[140px]">
                          {user.email}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 p-1.5 shadow-lg border border-[#DCDCDC]"
                  >
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-xs font-semibold text-[#1F1F1F]">
                          {user.name || 'Usuário Corteplan'}
                        </p>
                        <p className="text-[11px] text-[#6B6B6B] truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/" className="cursor-pointer text-xs flex items-center py-2 px-2.5">
                        <PlusCircle className="mr-2 h-4 w-4 text-[#F2612A]" />
                        <span>Nova Prancha</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/projetos"
                        className="cursor-pointer text-xs flex items-center py-2 px-2.5"
                      >
                        <FolderKanban className="mr-2 h-4 w-4 text-[#6B6B6B]" />
                        <span>Meus Projetos</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center py-2 px-2.5"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/login">
                <Button className="bg-[#F2612A] hover:bg-[#D9531F] text-white font-medium text-xs sm:text-sm px-4 h-9 shadow-xs">
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  )
}
