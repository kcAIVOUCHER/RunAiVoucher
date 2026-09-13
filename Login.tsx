import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Building2, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar email de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center flex flex-col items-center">
          <div className="w-full flex justify-center mb-4">
            <img src="/logo.jpeg" alt="AiVoucher" className="h-16 w-auto object-contain bg-white/5 rounded-xl p-2" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AiVoucher</h1>
          <p className="text-slate-400 mt-2 text-sm">Plataforma de emissão inteligente</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Senha</label>
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar na Plataforma"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Email enviado</h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Verifique sua caixa de entrada para redefinir sua senha.
                  </p>
                  <button
                    onClick={() => setMode("login")}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-bold transition-colors"
                  >
                    Voltar para o login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email da Conta</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link de recuperação"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full py-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
