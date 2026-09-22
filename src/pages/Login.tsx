import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import CorteplanLogo from '@/components/CorteplanLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('gustavo@corteplan.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F7F7F5]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#DCDCDC] p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <CorteplanLogo className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">Acessar Sistema</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Geração de pranchas técnicas e apresentações
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-[#1F1F1F]">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@corteplan.com.br"
              className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-[#1F1F1F]">
                Senha
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#F2612A] hover:underline font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F2612A] hover:bg-[#D9531F] text-white font-semibold h-11 mt-2 shadow-xs transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#DCDCDC] text-center text-xs text-[#6B6B6B]">
          <p>Credenciais de teste pré-preenchidas:</p>
          <p className="font-mono mt-1 text-[#1F1F1F] font-medium">
            gustavo@corteplan.com.br / Skip@Pass
          </p>
        </div>
      </div>
    </div>
  )
}
