'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { Activity, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
              Olá,
              <br /> Bem-vindo de volta
            </h2>
            <p className="mt-4 text-sm tracking-wide text-gray-500 font-medium">
              Ei, bem-vindo de volta ao seu lugar especial
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-4 items-center justify-between text-sm py-2">
              <div className="flex items-center">
                <Checkbox id="remember-me" className="border-gray-300 text-blue-600 rounded bg-white shadow-sm data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label htmlFor="remember-me" className="ml-2 block text-gray-600 font-medium">
                  Lembrar-me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-gray-500 hover:text-[#1B1F3B] transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-[120px] h-12 bg-[#5B63E6] hover:bg-[#4A51CD] text-white font-medium rounded-xl shadow-[0_4px_14px_0_rgba(91,99,230,0.39)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(91,99,230,0.23)] disabled:opacity-70 text-base"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="pt-8 text-sm absolute bottom-8 left-8 sm:static">
            <span className="text-gray-500 font-medium">Não tem uma conta? </span>
            <Link href="/register" className="font-semibold text-[#5B63E6] hover:text-[#4A51CD] transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Graphic/Illustration */}
      <div className="hidden lg:flex w-1/2 p-4">
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7C84FF] via-[#5B63E6] to-[#4A51CD] shadow-2xl">

          {/* Abstract Clouds/Shapes matching reference */}
          <div className="absolute top-[10%] left-[-10%] w-64 h-32 bg-white rounded-full opacity-10 blur-xl mix-blend-overlay"></div>
          <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-48 bg-white rounded-full opacity-[0.08] blur-2xl"></div>
          <div className="absolute top-[40%] right-[10%] w-32 h-32 bg-[#1B1F3B] rounded-full opacity-[0.05] blur-md"></div>

          {/* Modern Central Graphic Element instead of a full illustration */}
          <div className="relative z-10 p-12 w-full max-w-lg">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-[2rem] shadow-2xl space-y-6">
              <div className="h-2 w-16 bg-white/40 rounded-full mb-8"></div>

              <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
                O CRM perfeito para o<br />crescimento acelerado.
              </h3>

              <p className="text-indigo-100 font-medium leading-relaxed">
                Gerencie leads, atenda via WhatsApp e acompanhe seu funil de vendas em um só lugar. Totalmente integrado e multi-tenant.
              </p>

              <div className="pt-8 border-t border-white/10 flex gap-4 mt-8 opacity-80">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold block translate-y-[-1px]">M</span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Mais de 1.000+ Vendas</div>
                  <div className="text-indigo-200 text-xs mt-0.5">Gerenciadas este mês</div>
                </div>
              </div>
            </div>

            {/* Decorative floating elements */}
            <div className="absolute -top-12 -right-12 bg-teal-400 w-24 h-24 rounded-2xl rotate-12 opacity-80 mix-blend-screen shadow-xl"></div>
            <div className="absolute -bottom-8 -left-8 bg-[#EF4444] w-20 h-20 rounded-full opacity-60 mix-blend-multiply blur-[2px]"></div>
            <div className="absolute top-[30%] -right-4 bg-yellow-400 w-12 h-12 rounded-full opacity-90 shadow-lg"></div>
          </div>

          {/* Simple Bottom abstract styling */}
          <div className="absolute bottom-[-10%] left-[-10%] right-[-10%] h-[30%] bg-gradient-to-t from-[#1B1F3B]/40 to-transparent"></div>
        </div>
      </div>
    </div>
  )
}
