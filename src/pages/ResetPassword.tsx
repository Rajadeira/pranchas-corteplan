import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import CorteplanLogo from '@/components/CorteplanLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }

    if (!token) {
      setError('Token de recuperação inválido ou ausente.')
      return
    }

    setIsLoading(true)

    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      toast({
        title: 'Senha redefinida',
        description: 'Sua senha foi alterada com sucesso. Faça login agora.',
      })
      navigate('/login')
    } catch {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F7F7F5]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#DCDCDC] p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <CorteplanLogo className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">Definir nova senha</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Escolha uma senha forte com pelo menos 8 caracteres
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
            <Label htmlFor="password" className="text-xs font-semibold text-[#1F1F1F]">
              Nova senha
            </Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-[#1F1F1F]">
              Confirmar nova senha
            </Label>
            <Input
              id="passwordConfirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="h-10 text-sm focus-visible:ring-[#F2612A]/40"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F2612A] hover:bg-[#D9531F] text-white font-semibold h-11 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar nova senha'
            )}
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-[#6B6B6B] hover:text-[#1F1F1F] font-medium">
              Voltar ao login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
