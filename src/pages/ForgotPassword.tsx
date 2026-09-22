import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import CorteplanLogo from '@/components/CorteplanLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch {
      // For security, always show success regardless of whether the email exists
    } finally {
      setIsLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F7F7F5]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#DCDCDC] p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <CorteplanLogo className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">Recuperar senha</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Informe seu e-mail cadastrado para redefinir o acesso
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-[#1F1F1F] font-medium leading-relaxed">
              Se existir uma conta com este e-mail, você receberá um link para redefinir a senha.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Voltar para o login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#1F1F1F]">
                E-mail cadastrado
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F2612A] hover:bg-[#D9531F] text-white font-semibold h-11 shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-[#6B6B6B] hover:text-[#1F1F1F] inline-flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
