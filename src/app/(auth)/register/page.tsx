'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Activity, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
        },
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }

    // Se deu sucesso, em ambientes DEV sem SMTP e 'Email Confirmation' ativado, ele desloga sozinho ou loga automático.
    // Vamos mostrar a notificação e levar pro login
    setSuccessMsg("Conta criada com sucesso! Redirecionando...")

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 2000)
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Column: Form */}
      <div className="flex flex-col flex-1 justify-center items-center px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo Area */}
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-[#1B1F3B] p-2 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-[#1B1F3B]">SaaS CRM</span>
          </div>

          <div>
            <h2 className="text-4xl font-extrabold text-[#1B1F3B] tracking-tight">
              Comece<br /> Gratuitamente
            </h2>
            <p className="mt-4 text-sm tracking-wide text-gray-500 font-medium">
              Crie sua conta e organize suas vendas hoje.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleRegister}>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-start gap-2 border border-green-200">
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900 rounded-xl"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900 rounded-xl"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-6 bg-[#5B63E6] hover:bg-[#4A51CD] text-white font-medium rounded-xl shadow-[0_4px_14px_0_rgba(91,99,230,0.39)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(91,99,230,0.23)] disabled:opacity-70 text-base"
            >
              {isLoading ? 'Criando Conta...' : 'Cadastrar'}
            </Button>
          </form>

          <div className="pt-8 text-sm absolute bottom-8 left-8 sm:static">
            <span className="text-gray-500 font-medium">Já tem uma conta? </span>
            <Link href="/login" className="font-semibold text-[#5B63E6] hover:text-[#4A51CD] transition-colors">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Graphic/Illustration */}
      <div className="hidden lg:flex w-1/2 p-4">
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1B1F3B] via-[#232847] to-[#111322] shadow-xl">

          {/* Abstract Clouds/Shapes matching reference but darker for register */}
          <div className="absolute top-[10%] left-[-10%] w-64 h-32 bg-indigo-500 rounded-full opacity-10 blur-xl mix-blend-screen"></div>
          <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-48 bg-purple-500 rounded-full opacity-[0.05] blur-2xl"></div>
          <div className="absolute top-[40%] right-[10%] w-32 h-32 bg-blue-500 rounded-full opacity-[0.08] blur-md"></div>

          {/* Modern Central Graphic Element instead of a full illustration */}
          <div className="relative z-10 p-12 w-full max-w-lg">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl space-y-6">
              <div className="h-2 w-16 bg-blue-500 rounded-full mb-8 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

              <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
                Assuma o controle total do seu comercial.
              </h3>

              <p className="text-gray-400 font-medium leading-relaxed">
                Junte-se a organizações que multiplicaram seu retorno unificando o WhatsApp no Kanban de CRM.
              </p>

              <div className="pt-8 border-t border-white/5 flex gap-4 mt-8 opacity-80">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <span className="text-blue-400 font-bold block translate-y-[-1px]">✓</span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Setup Rápido</div>
                  <div className="text-gray-400 text-xs mt-0.5">Sua organização pronta em segundos</div>
                </div>
              </div>
            </div>

            {/* Decorative floating elements */}
            <div className="absolute -top-12 -right-12 bg-[#5B63E6] w-24 h-24 rounded-2xl rotate-12 opacity-40 mix-blend-screen shadow-xl"></div>
            <div className="absolute -bottom-8 -left-8 bg-green-500 w-20 h-20 rounded-full opacity-20 mix-blend-screen blur-[2px]"></div>
            <div className="absolute top-[30%] -right-4 bg-teal-400 w-12 h-12 rounded-full opacity-30 shadow-lg"></div>
          </div>

          {/* Simple Bottom abstract styling */}
          <div className="absolute bottom-[-10%] left-[-10%] right-[-10%] h-[30%] bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
      </div>
    </div>
  )
}
