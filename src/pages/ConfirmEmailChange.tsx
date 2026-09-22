import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import CorteplanLogo from '@/components/CorteplanLogo'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    const confirm = async () => {
      try {
        await pb.collection('users').confirmEmailChange(token, '')
        pb.authStore.clear()
        setStatus('success')
      } catch {
        setStatus('error')
      }
    }

    confirm()
  }, [token])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#F7F7F5]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-[#DCDCDC] p-8 text-center">
        <CorteplanLogo className="mx-auto mb-6" />

        {status === 'loading' && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#F2612A] mx-auto" />
            <p className="text-sm text-[#6B6B6B]">Confirmando alteração de e-mail...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1F1F1F]">E-mail alterado</h2>
            <p className="text-sm text-[#6B6B6B]">
              E-mail alterado. Faça login novamente com o novo e-mail.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-[#F2612A] hover:bg-[#D9531F] text-white">
                  Fazer login
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1F1F1F]">Erro na confirmação</h2>
            <p className="text-sm text-[#6B6B6B]">
              O link para confirmação de e-mail expirou ou é inválido.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
