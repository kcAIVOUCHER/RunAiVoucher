import React, { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Check,
  Sparkles,
  CreditCard,
  X,
  Building2,
  Phone,
  Copy,
  ChevronRight
} from "lucide-react";
import { clearAllClientStorage } from "../contexts/AuthContext";
import { SaasPlan } from "../types";

export const Login: React.FC = () => {
  const [mode, setMode] = useState<"login" | "reset">("login");

  // Login & Reset State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Modals state: null | "test" | "subscriptions"
  const [activeModal, setActiveModal] = useState<"test" | "subscriptions" | null>(null);

  // Plans state
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SaasPlan | null>(null);

  // Registration Form State (Shared for Test and Subscription)
  const [regAgencyName, setRegAgencyName] = useState("");
  const [regCnpj, setRegCnpj] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [fetchingCnpj, setFetchingCnpj] = useState(false);

  // Post-Registration Invoice / PIX (for Subscription purchase)
  const [createdInvoice, setCreatedInvoice] = useState<any | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Diagnostic / Cache Cleaner
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem("saas_platform_logo") || "/logo.svg";
  });

  useEffect(() => {
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

  // Fetch available plans on mount or when opening modal
  useEffect(() => {
    setLoadingPlans(true);
    fetch("/api/saas/plans")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const activePlans = data.filter((p: any) => p.isActive !== false);
          setPlans(activePlans);
          if (activePlans.length > 0) {
            // Default to popular plan or first plan
            const popular = activePlans.find((p) => p.isPopular) || activePlans[0];
            setSelectedPlan(popular);
          }
        }
      })
      .catch((err) => console.error("Error fetching plans:", err))
      .finally(() => setLoadingPlans(false));
  }, []);

  // Format CNPJ
  const formatCnpj = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // CNPJ automatic query
  const handleCnpjBlur = async () => {
    const raw = regCnpj.replace(/\D/g, "");
    if (raw.length === 14 && !regAgencyName.trim()) {
      setFetchingCnpj(true);
      try {
        const res = await fetch(`/api/saas/cnpj/${raw}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nomeFantasia || data.razaoSocial) {
            setRegAgencyName(data.nomeFantasia || data.razaoSocial);
          }
          if (data.telefone && !regPhone) {
            setRegPhone(data.telefone);
          }
        }
      } catch (err) {
        console.warn("CNPJ lookup failed:", err);
      } finally {
        setFetchingCnpj(false);
      }
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("E-mail ou senha incorretos. Verifique seus dados ou use a recuperação de senha.");
      } else if (code === "auth/too-many-requests") {
        setError("Muitas tentativas sem sucesso. Aguarde alguns instantes ou redefina sua senha.");
      } else {
        setError(err.message || "Erro ao realizar login. Verifique sua conexão e credenciais.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset password handler
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe seu e-mail cadastrado.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar e-mail de recuperação. Verifique o endereço digitado.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Modal Form
  const closeModal = () => {
    setActiveModal(null);
    setRegError("");
    setRegLoading(false);
    setCreatedInvoice(null);
    setCopiedPix(false);
  };

  // Registration for Test or Subscription
  const handleRegister = async (e: React.FormEvent, registrationMode: "test" | "direct") => {
    e.preventDefault();
    if (!regAgencyName.trim()) {
      setRegError("Informe o nome da agência.");
      return;
    }
    if (!regEmail.trim() || !regPassword) {
      setRegError("Informe o e-mail corporativo e a senha.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setRegLoading(true);
    setRegError("");

    try {
      const payload = {
        name: regAgencyName.trim(),
        tradeName: regAgencyName.trim(),
        cnpj: regCnpj.trim(),
        email: regEmail.trim(),
        masterLoginEmail: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        planId: selectedPlan?.id || "plan-starter",
        mode: registrationMode
      };

      const res = await fetch("/api/saas/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao realizar cadastro.");
      }

      if (registrationMode === "test") {
        // Automatic login for Test mode
        try {
          await signInWithEmailAndPassword(auth, regEmail.trim(), regPassword);
          closeModal();
        } catch (loginErr: any) {
          // If auto login fails, fill the login form and prompt user
          setEmail(regEmail.trim());
          setPassword(regPassword);
          closeModal();
          setError("Cadastro de teste realizado com sucesso! Clique em 'Entrar no Sistema'.");
        }
      } else {
        // Direct subscription mode: Show invoice and PIX payment
        if (data.invoice) {
          setCreatedInvoice(data.invoice);
        } else {
          // Fallback if no invoice generated
          try {
            await signInWithEmailAndPassword(auth, regEmail.trim(), regPassword);
            closeModal();
          } catch {
            setEmail(regEmail.trim());
            setPassword(regPassword);
            closeModal();
          }
        }
      }
    } catch (err: any) {
      setRegError(err.message || "Não foi possível concluir o cadastro.");
    } finally {
      setRegLoading(false);
    }
  };

  // Clear Storage
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand / Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-xs mb-4">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 sm:h-12 w-auto object-contain max-w-[200px]"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === "login" ? "Acesso ao Sistema" : "Recuperar Senha"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {mode === "login"
              ? "Informe suas credenciais para acessar a plataforma."
              : "Digite o e-mail cadastrado para redefinir sua senha."}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {mode === "login" ? (
            /* Formulário de Login */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-email">
                  E-mail corporativo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@agencia.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700" htmlFor="login-password">
                    Senha de acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("reset");
                      setError("");
                      setResetSent(false);
                    }}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão Entrar no Sistema */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-[#00277A] hover:bg-[#001c59] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Dois Botões Embaixo: Esquerdo (Teste) e Direito (Assinaturas) */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                {/* Botão do Lado Esquerdo: Teste */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal("test");
                    setRegError("");
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Teste</span>
                </button>

                {/* Botão do Lado Direito: Assinaturas */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal("subscriptions");
                    setRegError("");
                    setCreatedInvoice(null);
                  }}
                  className="flex-1 py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-[#00277A] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-sky-200 shadow-2xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#00277A]" />
                  <span>Assinaturas</span>
                </button>
              </div>
            </form>
          ) : (
            /* Formulário de Recuperação de Senha */
            <div>
              {resetSent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-800 leading-relaxed">
                      <strong className="block font-bold mb-1">E-mail de redefinição enviado!</strong>
                      Verifique sua caixa de entrada e spam para criar uma nova senha de acesso.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setResetSent(false);
                      setError("");
                    }}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para o Login</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="reset-email">
                      E-mail cadastrado
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu.email@agencia.com.br"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 bg-[#00277A] hover:bg-[#001c59] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando link...</span>
                        </>
                      ) : (
                        <span>Enviar Link de Recuperação</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                      className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar para o Login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Discreet Troubleshooting Footer */}
        <div className="mt-6 text-center">
          {!showTroubleshooting ? (
            <button
              type="button"
              onClick={() => setShowTroubleshooting(true)}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Dificuldade para acessar?</span>
            </button>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-left text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Diagnóstico de Sessão</span>
                <button
                  type="button"
                  onClick={() => setShowTroubleshooting(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Se você atualizou sua senha recentemente ou está recebendo avisos em loop no navegador, limpe os dados temporários locais:
              </p>
              <button
                type="button"
                onClick={handleResetStorage}
                disabled={clearing}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {clearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Limpando cache...</span>
                  </>
                ) : clearedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cache limpo! Recarregando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Limpar cache da sessão</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TESTE (Cadastro para Testar o Sistema)           */}
      {/* ========================================================= */}
      {activeModal === "test" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastro para Teste</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Preencha seus dados para testar a plataforma.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => handleRegister(e, "test")} className="p-5 sm:p-6 space-y-4">
              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome da Agência / Razão Social *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Romamia Viagens & Turismo"
                    value={regAgencyName}
                    onChange={(e) => setRegAgencyName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">CNPJ (Opcional)</label>
                    {fetchingCnpj && <span className="text-[10px] text-sky-600 font-bold animate-pulse">Buscando...</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={regCnpj}
                    onChange={(e) => setRegCnpj(formatCnpj(e.target.value))}
                    onBlur={handleCnpjBlur}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail corporativo (login) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@agencia.com.br"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Criar Senha de acesso *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 bg-[#00277A] hover:bg-[#001c59] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Criando conta de teste...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Conta e Iniciar Teste</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ASSINATURAS (Ver Planos e Fazer Cadastro)        */}
      {/* ========================================================= */}
      {activeModal === "subscriptions" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-[#00277A] rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assinaturas e Planos Disponíveis</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Escolha o plano ideal e faça o cadastro para começar a emitir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: PIX screen OR Plan Selection / Checkout Form */}
            {createdInvoice ? (
              /* Tela de Conclusão / Pagamento PIX */
              <div className="p-6 sm:p-8 space-y-6 max-w-lg mx-auto text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Cadastro Realizado com Sucesso!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Sua fatura foi gerada. Efetue o pagamento via PIX para liberação instantânea.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Plano Selecionado:</span>
                    <span className="font-bold text-slate-900">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Valor Mensal:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {Number(createdInvoice.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  {createdInvoice.pixQrCodeBase64 && (
                    <div className="py-2 flex flex-col items-center">
                      <img
                        src={`data:image/png;base64,${createdInvoice.pixQrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-40 h-40 border border-slate-300 rounded-xl p-1 bg-white shadow-2xs"
                      />
                      <span className="text-[11px] text-slate-500 mt-2 font-medium">
                        Escaneie com o aplicativo do seu banco
                      </span>
                    </div>
                  )}

                  {createdInvoice.pixCode && (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-semibold text-slate-600">Código Copia e Cola:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={createdInvoice.pixCode}
                          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-mono text-slate-700 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(createdInvoice.pixCode);
                            setCopiedPix(true);
                            setTimeout(() => setCopiedPix(false), 2500);
                          }}
                          className="py-2 px-3 bg-[#00277A] text-white text-xs font-bold rounded-xl hover:bg-[#001c59] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPix ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await signInWithEmailAndPassword(auth, regEmail.trim(), regPassword);
                        closeModal();
                      } catch {
                        setEmail(regEmail.trim());
                        setPassword(regPassword);
                        closeModal();
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-[#00277A] hover:bg-[#001c59] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-6">
                {/* Etapa 1: Cards dos Planos Disponíveis */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. Selecione seu Plano
                    </span>
                    {selectedPlan && (
                      <span className="text-xs text-sky-700 font-semibold">
                        Selecionado: <strong>{selectedPlan.name}</strong> (R$ {selectedPlan.basePrice}/mês)
                      </span>
                    )}
                  </div>

                  {loadingPlans ? (
                    <div className="py-8 text-center text-xs text-slate-400">Carregando assinaturas...</div>
                  ) : plans.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">Nenhum plano configurado no momento.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plans.map((p) => {
                        const isSelected = selectedPlan?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlan(p)}
                            className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "border-[#00277A] bg-sky-50/50 ring-2 ring-[#00277A]/30 shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="font-bold text-sm text-slate-900">{p.name}</span>
                                {p.isPopular && (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                                    Popular
                                  </span>
                                )}
                              </div>

                              <div className="flex items-baseline gap-1 my-2">
                                <span className="text-xl font-black text-slate-900">
                                  {Number(p.basePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                                <span className="text-xs text-slate-500">/mês</span>
                              </div>

                              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{p.description}</p>

                              <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-2.5 text-slate-700">
                                <div className="font-medium text-slate-800">
                                  • {p.baseUsers} usuários inclusos
                                </div>
                                <div className="text-slate-600">
                                  • {p.maxVouchersPerMonth === -1 ? "Vouchers ilimitados" : `${p.maxVouchersPerMonth} vouchers/mês`}
                                </div>
                                {p.features && p.features.slice(0, 2).map((feat, idx) => (
                                  <div key={idx} className="text-slate-600">
                                    • {feat}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                                  isSelected
                                    ? "bg-[#00277A] text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Plano Escolhido</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Adquirir Este</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Etapa 2: Formulário de Cadastro para Aquisição */}
                <form
                  onSubmit={(e) => handleRegister(e, "direct")}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4"
                >
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Dados da Agência para Cadastro
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Plano: <strong className="text-slate-900">{selectedPlan?.name || "Selecione um plano"}</strong>
                    </span>
                  </div>

                  {regError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nome da Agência / Razão Social *
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: Romamia Viagens & Turismo"
                          value={regAgencyName}
                          onChange={(e) => setRegAgencyName(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">CNPJ (Opcional)</label>
                        {fetchingCnpj && <span className="text-[10px] text-sky-600 font-bold animate-pulse">Buscando...</span>}
                      </div>
                      <input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={regCnpj}
                        onChange={(e) => setRegCnpj(formatCnpj(e.target.value))}
                        onBlur={handleCnpjBlur}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail corporativo (login) *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="seu.email@agencia.com.br"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de acesso *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 6 caracteres"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="(11) 99999-9999"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00277A] focus:border-[#00277A] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={regLoading || !selectedPlan}
                      className="w-full py-2.5 px-4 bg-[#00277A] hover:bg-[#001c59] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {regLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Gerando assinatura e PIX...</span>
                        </>
                      ) : (
                        <>
                          <span>Concluir Cadastro e Gerar Pagamento PIX</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
