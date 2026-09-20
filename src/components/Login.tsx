import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { clearAllClientStorage } from "../contexts/AuthContext";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem("saas_platform_logo") || "/logo.svg";
  });

  React.useEffect(() => {
    fetch("/api/saas/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.platformLogoUrl) {
          setLogoUrl(data.platformLogoUrl);
          try {
            localStorage.setItem("saas_platform_logo", data.platformLogoUrl);
          } catch (e) {}
        } else if (data && data.platformLogoUrl === null) {
          localStorage.removeItem("saas_platform_logo");
          setLogoUrl("/logo.svg");
        }
      })
      .catch(() => {});
  }, []);

  const handleResetStorage = async () => {
    setClearing(true);
    try {
      await clearAllClientStorage();
      setClearedSuccess(true);
      setTimeout(() => {
        setClearedSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error(e);
      window.location.reload();
    } finally {
      setClearing(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-[#D1EDFE]/30 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100/80 overflow-hidden transition-all">
        {/* Linha de destaque e Cabeçalho do Logo configurado no SAAS (sem a palavra AiVoucher e sem ícones) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00277A] via-[#152A9D] to-[#16B5F0]" />
        <div className="pt-7 pb-5 px-6 sm:pt-8 sm:pb-6 sm:px-8 text-center flex flex-col items-center justify-center border-b border-slate-100 bg-white">
          <div className="flex items-center justify-center min-h-[56px] max-h-[84px] w-full px-2">
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-16 sm:max-h-20 max-w-[260px] w-auto object-contain transition-all"
              onError={(e) => {
                if (e.currentTarget.src !== window.location.origin + "/logo.svg") {
                  e.currentTarget.src = "/logo.svg";
                }
              }}
            />
          </div>
          <p className="mt-3 text-xs sm:text-[13px] font-medium text-slate-500 text-center">
            Emissão e gestão inteligente de vouchers
          </p>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs sm:text-sm font-medium text-center">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Campo E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#16B5F0] focus:border-[#16B5F0] outline-none transition-all shadow-2xs bg-white"
                    placeholder="Digite seu e-mail"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("reset");
                    }}
                    className="text-xs font-medium text-[#152A9D] hover:text-[#16B5F0] transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#16B5F0] focus:border-[#16B5F0] outline-none transition-all shadow-2xs bg-white"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    title={showPassword ? "Ocultar senha" : "Ver senha"}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Ação Principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-70 cursor-pointer min-h-[44px]"
                style={{
                  background:
                    "linear-gradient(135deg, #00277A 0%, #152A9D 45%, #16B5F0 100%)"
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {resetSent ? (
                <div className="text-center py-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">
                    E-mail enviado
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                    Verifique sua caixa de entrada para redefinir sua senha.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setMode("login");
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Voltar para o login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4 sm:space-y-5">
                  <div className="text-center mb-1">
                    <h2 className="text-sm font-bold text-slate-900">
                      Recuperar senha
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Informe seu e-mail para receber o link de redefinição.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#16B5F0] focus:border-[#16B5F0] outline-none transition-all shadow-2xs bg-white"
                        placeholder="Digite seu e-mail"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-70 cursor-pointer min-h-[44px]"
                    style={{
                      background:
                        "linear-gradient(135deg, #00277A 0%, #152A9D 45%, #16B5F0 100%)"
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Enviar link de recuperação"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMode("login");
                    }}
                    className="w-full py-2 text-slate-500 hover:text-slate-900 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  >
                    Voltar para o login
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Opção secundária e discreta de suporte / limpeza de dados */}
          <div className="mt-6 sm:mt-7 pt-4 sm:pt-5 border-t border-slate-100 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors py-1 px-2 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Problemas para entrar?</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  showTroubleshooting ? "rotate-180" : ""
                }`}
              />
            </button>

            {showTroubleshooting && (
              <div className="mt-3 w-full p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-2 text-xs text-slate-600 transition-all">
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Caso encontre dificuldades de conexão ou sessão no navegador do celular ou tablet:
                </p>
                <button
                  type="button"
                  onClick={handleResetStorage}
                  disabled={clearing}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:text-red-700 hover:bg-red-50/80 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 bg-white shadow-2xs"
                  title="Limpar cookies, cache e tokens locais do navegador"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      <span>Limpando dados do navegador...</span>
                    </>
                  ) : clearedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Dados limpos! Recarregando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Limpar cookies e cache do navegador</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
