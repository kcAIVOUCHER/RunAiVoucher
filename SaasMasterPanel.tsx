import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/firebase";
import {
  TrendingUp,
  Building2,
  Users,
  CreditCard,
  FileCheck,
  PlusCircle,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ChevronRight,
  Printer,
  Sparkles,
  Settings,
  Mail,
  Phone,
  HelpCircle,
  ArrowUpRight,
  FileText,
  Trash2,
  RotateCcw,
  Key,
  X,
  CheckSquare,
  Square
} from "lucide-react";
import {
  AgencyProfile,
  SaasMetrics,
  Invoice,
  SaasPlan,
  SubscriptionStatus,
  BillingCycle
} from "../types";
import { NfeViewerModal } from "./NfeViewerModal";

interface SaasMasterPanelProps {
  onEnterAgency: (agency: AgencyProfile) => void;
}

export const SaasMasterPanel: React.FC<SaasMasterPanelProps> = ({ onEnterAgency }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SaasMetrics | null>(null);
  const [agencies, setAgencies] = useState<AgencyProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: 'agencies' | 'invoices' | 'plans' | 'insights'
  const [activeMasterTab, setActiveMasterTab] = useState<"agencies" | "invoices" | "plans" | "insights">("agencies");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [selectedInvoiceForNfe, setSelectedInvoiceForNfe] = useState<Invoice | null>(null);
  const [editingAgency, setEditingAgency] = useState<AgencyProfile | null>(null);

  // New Agency Form State
  const [formName, setFormName] = useState("");
  const [formTradeName, setFormTradeName] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formMasterEmail, setFormMasterEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPlanId, setFormPlanId] = useState("plan-pro");
  const [formMaxUsers, setFormMaxUsers] = useState(5);
  const [formMonthlyFee, setFormMonthlyFee] = useState<number>(389.00);
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>("active");
  const [formBillingCycle, setFormBillingCycle] = useState<BillingCycle>("monthly");
  const [formNextDueDate, setFormNextDueDate] = useState("2026-10-10");
  const [formNotes, setFormNotes] = useState("");
  const [isSavingAgency, setIsSavingAgency] = useState(false);

  const getAuthHeaders = () => {
    const email = user?.email || auth.currentUser?.email || "kcarrascosa.comercial@gmail.com";
    return {
      "Content-Type": "application/json",
      "x-user-email": email
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const [metricsRes, agenciesRes, invoicesRes, plansRes] = await Promise.all([
        fetch("/api/saas/metrics", { headers }),
        fetch("/api/saas/agencies", { headers }),
        fetch("/api/saas/invoices", { headers }),
        fetch("/api/saas/plans", { headers })
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (agenciesRes.ok) setAgencies(await agenciesRes.json());
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
    } catch (err) {
      console.error("Error loading SaaS Master data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPlans = () => plans.length > 0 ? plans : [
    { id: "plan-starter", name: "Starter Agência", basePrice: 199.00, baseUsers: 2, pricePerExtraUser: 49.00 },
    { id: "plan-pro", name: "Profissional Corp", basePrice: 389.00, baseUsers: 5, pricePerExtraUser: 39.00 },
    { id: "plan-enterprise", name: "Enterprise Corporate", basePrice: 890.00, baseUsers: 15, pricePerExtraUser: 29.00 }
  ];

  // Recalculate fee automatically when plan or users change in form
  const handlePlanChange = (planId: string) => {
    setFormPlanId(planId);
    const selectedPlan = getPlans().find((p) => p.id === planId);
    if (selectedPlan) {
      const users = Math.max(selectedPlan.baseUsers, formMaxUsers);
      setFormMaxUsers(users);
      const extra = Math.max(0, users - selectedPlan.baseUsers);
      const calcFee = selectedPlan.basePrice + extra * selectedPlan.pricePerExtraUser;
      setFormMonthlyFee(calcFee);
    }
  };

  const handleUsersCountChange = (newCount: number) => {
    const val = Math.max(1, newCount);
    setFormMaxUsers(val);
    const selectedPlan = getPlans().find((p) => p.id === formPlanId);
    if (selectedPlan) {
      const extra = Math.max(0, val - selectedPlan.baseUsers);
      const calcFee = selectedPlan.basePrice + extra * selectedPlan.pricePerExtraUser;
      setFormMonthlyFee(calcFee);
    }
  };

  // Open modal for editing existing agency
  const handleOpenEditAgency = (agency: AgencyProfile) => {
    setEditingAgency(agency);
    setFormName(agency.name);
    setFormTradeName(agency.tradeName || agency.name);
    setFormCnpj(agency.cnpj || "");
    setFormMasterEmail(agency.masterLoginEmail || agency.email || "");
    setFormPhone(agency.phone || "");
    setFormPlanId(agency.subscription?.planId || "plan-pro");
    setFormMaxUsers(agency.subscription?.maxUsers || 5);
    setFormMonthlyFee(Number(agency.subscription?.monthlyFee) || 389.00);
    setFormStatus(agency.subscription?.status || "active");
    setFormBillingCycle(agency.subscription?.billingCycle || "monthly");
    setFormNextDueDate(agency.subscription?.nextDueDate || "2026-10-10");
    setFormNotes(agency.subscription?.notes || "");
    setIsAgencyModalOpen(true);
  };

  const handleOpenCreateAgency = () => {
    setEditingAgency(null);
    setFormName("");
    setFormTradeName("");
    setFormCnpj("");
    setFormMasterEmail("");
    setFormPassword("");
    setFormPhone("");
    setFormPlanId("plan-pro");
    setFormMaxUsers(5);
    setFormMonthlyFee(389.00);
    setFormStatus("active");
    setFormBillingCycle("monthly");
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormNextDueDate(nextMonth.toISOString().split("T")[0]);
    setFormNotes("");
    setIsAgencyModalOpen(true);
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Por favor, preencha o Nome / Razão Social da Agência.");
      return;
    }
    if (!formMasterEmail.trim()) {
      alert("Por favor, informe o E-mail Master de Acesso da Agência.");
      return;
    }
    if (!editingAgency && (!formPassword || formPassword.trim().length < 6)) {
      alert("Por favor, defina a Senha de Acesso Master com no mínimo 6 caracteres.");
      return;
    }

    const payload = {
      name: formName.trim(),
      tradeName: formTradeName.trim() || formName.trim(),
      cnpj: formCnpj.trim(),
      email: formMasterEmail.trim(),
      password: formPassword.trim(),
      masterLoginEmail: formMasterEmail.trim(),
      phone: formPhone.trim(),
      subscription: {
        planId: formPlanId,
        planName: getPlans().find((p) => p.id === formPlanId)?.name || "Profissional Corp",
        status: formStatus,
        billingCycle: formBillingCycle,
        maxUsers: Number(formMaxUsers),
        monthlyFee: Number(formMonthlyFee),
        nextDueDate: formNextDueDate,
        notes: formNotes.trim()
      }
    };

    setIsSavingAgency(true);
    try {
      if (editingAgency) {
        const res = await fetch(`/api/saas/agencies/${editingAgency.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsAgencyModalOpen(false);
          await loadData();
          alert("Agência atualizada com sucesso!");
        } else {
          const errData = await res.json().catch(() => ({ error: "Erro no servidor ao atualizar agência." }));
          alert(`Erro ao atualizar agência: ${errData.error || res.statusText}`);
        }
      } else {
        const res = await fetch("/api/saas/agencies", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.generatedPassword) {
            alert(`Agência criada com sucesso!\n\nEmail: ${formMasterEmail}\nSenha Gerada: ${data.generatedPassword}\n\nUm email foi disparado com essas credenciais.`);
          } else {
            alert(`Agência criada com sucesso!\n\nEmail: ${formMasterEmail}\nSenha: ${formPassword || "(definida no formulário)"}\n\nO acesso da agência foi liberado com sucesso no sistema!`);
          }
          setIsAgencyModalOpen(false);
          await loadData();
        } else {
          const errData = await res.json().catch(() => ({ error: "Erro no servidor ao criar agência." }));
          alert(`Erro ao criar agência: ${errData.error || res.statusText}`);
        }
      }
    } catch (err) {
      console.error("Error saving agency:", err);
      alert("Erro de conexão ao salvar agência.");
    } finally {
      setIsSavingAgency(false);
    }
  };

  // Fast toggle status (e.g. Block / Unblock)
  const handleToggleBlock = async (agency: AgencyProfile) => {
    const isCurrentlyBlocked = agency.subscription?.status === "blocked";
    const nextStatus: SubscriptionStatus = isCurrentlyBlocked ? "active" : "blocked";
    const actionLabel = isCurrentlyBlocked ? "desbloquear" : "bloquear";

    if (!window.confirm(`Deseja realmente ${actionLabel} o acesso da agência ${agency.tradeName || agency.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/saas/agencies/${agency.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subscription: {
            ...agency.subscription,
            status: nextStatus
          }
        })
      });
      if (res.ok) {
        await loadData();
      } else {
        const errData = await res.json().catch(() => ({ error: "Erro ao alterar status" }));
        alert(`Erro: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("Erro de conexão ao alterar status da agência.");
    }
  };

  const handleDeleteAgency = async (agency: AgencyProfile) => {
    if (!window.confirm(`TEM CERTEZA? Isso excluirá PERMANENTEMENTE a agência "${agency.tradeName || agency.name}" e todos os seus dados operacionais.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/saas/agencies/${agency.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadData();
        alert(`Agência "${agency.tradeName || agency.name}" excluída com sucesso!`);
      } else {
        const errData = await res.json().catch(() => ({ error: "Erro ao excluir agência" }));
        alert(`Erro: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error deleting agency:", err);
      alert("Erro de conexão ao excluir agência.");
    }
  };

  const handleResetAgencyData = async (agency: AgencyProfile) => {
    if (!window.confirm(`Deseja zerar o histórico operacional de vouchers da agência ${agency.tradeName || agency.name}? Esta operação manterá a agência, usuários e empresas intactos.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/saas/agencies/${agency.id}/reset`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        alert("Histórico operacional de vouchers zerado com sucesso!");
        await loadData();
      } else {
        const errData = await res.json().catch(() => ({ error: "Erro ao zerar histórico" }));
        alert(`Erro: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error resetting agency data:", err);
      alert("Erro de conexão ao zerar histórico da agência.");
    }
  };

  const handleResetPassword = async (agency: AgencyProfile) => {
    if (!window.confirm(`Deseja enviar um e-mail de redefinição de senha para o Master da agência ${agency.name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/saas/agencies/${agency.id}/reset-password`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Sucesso: ${data.message}\n\nO link de redefinição de senha foi enviado para: ${data.email}`);
      } else {
        const err = await res.json().catch(() => ({ error: "Erro ao redefinir senha" }));
        alert(`Erro: ${err.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Erro ao redefinir a senha.");
    }
  };

  // Batch agency delete & clean
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const openBatchModal = () => {
    setSelectedAgencyIds([]);
    setIsBatchModalOpen(true);
  };

  const toggleSelectAgency = (id: string) => {
    setSelectedAgencyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllAgencies = () => {
    setSelectedAgencyIds(agencies.map(a => a.id));
  };

  const handleDeselectAllAgencies = () => {
    setSelectedAgencyIds([]);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedAgencyIds.length === 0) {
      alert("Nenhuma agência selecionada para exclusão. Marque pelo menos uma na lista.");
      return;
    }
    const selectedAgencies = agencies.filter(a => selectedAgencyIds.includes(a.id));
    const namesList = selectedAgencies.map(a => `• ${a.tradeName || a.name}`).join("\n");
    if (!window.confirm(`TEM CERTEZA? Isso excluirá PERMANENTEMENTE ${selectedAgencies.length} agência(s):\n\n${namesList}\n\nTodos os bilhetes, usuários e faturamentos dessas agências serão removidos.`)) {
      return;
    }

    setIsDeletingBatch(true);
    try {
      for (const id of selectedAgencyIds) {
        await fetch(`/api/saas/agencies/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });
      }
      setIsBatchModalOpen(false);
      setSelectedAgencyIds([]);
      await loadData();
      alert(`Sucesso! ${selectedAgencies.length} agência(s) excluída(s) com sucesso.`);
    } catch (err) {
      console.error("Erro ao excluir agências em lote:", err);
      alert("Erro ao excluir agências em lote.");
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Emit NFS-e for invoice
  const handleEmitNfe = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/saas/invoices/${invoiceId}/emit-nfe`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? data.invoice : inv)));
        setSelectedInvoiceForNfe(data.invoice);
      } else {
        const errData = await res.json().catch(() => ({ error: "Erro ao emitir NFS-e" }));
        alert(`Erro: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error emitting NFS-e:", err);
      alert("Erro de conexão ao emitir NFS-e.");
    }
  };

  // Mark invoice as paid
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/saas/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? data.invoice : inv)));
        await loadData();
      } else {
        const errData = await res.json().catch(() => ({ error: "Erro ao registrar pagamento" }));
        alert(`Erro: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Error marking invoice paid:", err);
      alert("Erro de conexão ao registrar pagamento.");
    }
  };

  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.tradeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.cnpj || "").includes(searchQuery) ||
      (a.masterLoginEmail || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && a.subscription?.status === statusFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SaaS Executive Summary Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-[11px] font-bold uppercase tracking-wider">
                  Super Admin SaaS • Gestão Master
                </span>
                <span className="text-xs text-slate-400 font-medium">Plataforma Multi-Tenant</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Painel Master de Agências & Assinaturas
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Controle centralizado de agências cadastradas, faturamento recorrente, licenças de usuários, logins simultâneos e emissão de notas fiscais de serviço (NFS-e).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreateAgency}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-sky-500/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Cadastrar Nova Agência</span>
              </button>
            </div>
          </div>

          {/* Key SaaS Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                MRR (Mensal)
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {Number(metrics?.mrr || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <span className="text-[10px] text-emerald-400 font-bold">
                ARR {Number(metrics?.arr || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                Agências Ativas
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {metrics?.activeAgenciesCount || agencies.length}
              </p>
              <span className="text-[10px] text-slate-400">
                {metrics?.trialAgenciesCount ? `${metrics.trialAgenciesCount} em homologação` : "100% ativas"}
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Logins & Operadores
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {metrics?.totalAgencyUsersCount || 0}
              </p>
              <span className="text-[10px] text-indigo-300">Emissores corporativos</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                A Receber
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {Number(metrics?.pendingInvoicesAmount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <span className="text-[10px] text-slate-400">Faturas em aberto</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 col-span-2 lg:col-span-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Vouchers no Mês
              </span>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {metrics?.vouchersEmittedThisMonth || 0}
              </p>
              <span className="text-[10px] text-purple-300">Com motor AiVoucher IA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Operational Access Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
              Acesso Operacional Direto
            </h3>
            <p className="text-[11px] text-slate-500">
              Alternar para o ambiente de trabalho e emissão de vouchers de uma agência cliente:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {agencies.slice(0, 4).map((ag) => (
            <button
              key={ag.id}
              onClick={() => onEnterAgency(ag)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={`Acessar ambiente operacional de ${ag.tradeName || ag.name}`}
            >
              <span className="truncate max-w-[140px]">{ag.tradeName || ag.name}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Master Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveMasterTab("agencies")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeMasterTab === "agencies"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>Agências & Assinaturas ({agencies.length})</span>
          </button>

          <button
            onClick={() => setActiveMasterTab("invoices")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeMasterTab === "invoices"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Faturamento & NFS-e ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveMasterTab("plans")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeMasterTab === "plans"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Planos do SaaS ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveMasterTab("insights")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeMasterTab === "insights"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Análise SaaS & Melhorias</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: AGENCIES & SUBSCRIPTIONS                               */}
      {/* ------------------------------------------------------------- */}
      {activeMasterTab === "agencies" && (
        <div className="space-y-4">
          {/* Filter and Search controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por agência, CNPJ ou login master..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer font-medium"
              >
                <option value="all">Todas as Agências</option>
                <option value="active">Apenas Ativas</option>
                <option value="trial">Em Homologação (Trial)</option>
                <option value="blocked">Bloqueadas (Inadimplentes)</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <button
                onClick={openBatchModal}
                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Gerenciar e excluir agências em lote"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Exclusão em Lote</span>
              </button>
            </div>
          </div>

          {/* Agencies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgencies.map((agency) => {
              const sub = agency.subscription;
              const activeUsers = agency.activeUsersCount || 1;
              const maxUsers = sub?.maxUsers || 5;
              const userPercentage = Math.min(100, Math.round((activeUsers / maxUsers) * 100));
              const isBlocked = sub?.status === "blocked";

              return (
                <div
                  key={agency.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between hover:shadow-md ${
                    isBlocked ? "border-red-300 bg-red-50/20" : "border-slate-200"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={agency.logoUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=80"}
                          alt={agency.name}
                          className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                            {agency.tradeName || agency.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            CNPJ: {agency.cnpj || "Não cadastrado"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          sub?.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : sub?.status === "trial"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sub?.status === "active"
                          ? "Ativa"
                          : sub?.status === "trial"
                          ? "Trial"
                          : "Bloqueada"}
                      </span>
                    </div>

                    {/* Master Credentials Info */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Mail className="w-3 h-3 text-slate-400" />
                          Login Master:
                        </span>
                        <strong className="text-slate-900 font-mono">
                          {agency.masterLoginEmail || agency.email}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Plano Contratado:</span>
                        <strong className="text-sky-800">{sub?.planName || "Profissional Corp"}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Mensalidade:</span>
                        <strong className="text-slate-900 text-xs font-black">
                          {Number(sub?.monthlyFee || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          <span className="text-[10px] font-normal text-slate-500">/mês</span>
                        </strong>
                      </div>
                    </div>

                    {/* User Slots Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Logins em Uso:
                        </span>
                        <span className="font-bold text-slate-800">
                          {activeUsers} / {maxUsers} usuários ({userPercentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            activeUsers >= maxUsers ? "bg-amber-500" : "bg-sky-600"
                          }`}
                          style={{ width: `${userPercentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Vencimento: {sub?.nextDueDate ? new Date(sub.nextDueDate + 'T00:00:00').toLocaleDateString('pt-BR') : '10/10/2026'}</span>
                        <span>Ciclo: {sub?.billingCycle === 'annual' ? 'Anual' : 'Mensal'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleBlock(agency)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isBlocked
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title={isBlocked ? "Desbloquear Acesso" : "Bloquear por Inadimplência"}
                    >
                      {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleResetPassword(agency)}
                      className="p-2 bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Gerar e Enviar Nova Senha (Master)"
                    >
                      <Key className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleResetAgencyData(agency)}
                      className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Zerar histórico operacional"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteAgency(agency)}
                      className="p-2 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Excluir agência permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditAgency(agency)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Editar Plano
                    </button>

                    <button
                      onClick={() => onEnterAgency(agency)}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Acessar</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: INVOICES & ELECTRONIC TAX SERVICE NOTES (NFS-e)        */}
      {/* ------------------------------------------------------------- */}
      {activeMasterTab === "invoices" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Faturamento Recorrente & Emissão de NFS-e de Software
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Geração de faturas mensais baseadas no plano contratado e número de usuários, com emissão de Nota Fiscal Eletrônica (LC 116 Item 1.05 - Licenciamento de Software).
                </p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50">
                    <th className="py-3 px-4">Fatura</th>
                    <th className="py-3 px-4">Agência Assinante</th>
                    <th className="py-3 px-4">Período / Logins</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">NFS-e (Nota Fiscal)</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === "paid";
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          {inv.invoiceNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{inv.agencyName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">CNPJ: {inv.agencyCnpj || "Não informado"}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-700">{inv.billingPeriod}</span>
                          <div className="text-[11px] text-slate-500">{inv.usersCount} usuários liberados</div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {Number(inv.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>

                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Quitada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.nfeStatus === "emitted" ? (
                            <div>
                              <button
                                onClick={() => setSelectedInvoiceForNfe(inv)}
                                className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
                              >
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>{inv.nfeNumber || "NFS-e Emitida"}</span>
                              </button>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ISS (2.5%): R$ {inv.nfeTaxValue?.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEmitNfe(inv.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              + Emitir NFS-e
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          {!isPaid && (
                            <button
                              onClick={() => handlePayInvoice(inv.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Dar Baixa
                            </button>
                          )}

                          {inv.nfeStatus === "emitted" && (
                            <button
                              onClick={() => setSelectedInvoiceForNfe(inv)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Ver Espelho
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SAAS PLANS CONFIGURATION                               */}
      {/* ------------------------------------------------------------- */}
      {activeMasterTab === "plans" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between ${
                  plan.isPopular ? "border-sky-500 ring-2 ring-sky-500/20" : "border-slate-200"
                }`}
              >
                <div className="space-y-4">
                  {plan.isPopular && (
                    <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                      Mais Contratado pelas Agências
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="border-t border-b border-slate-100 py-3">
                    <div className="text-2xl font-black text-slate-900">
                      {Number(plan.basePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      <span className="text-xs font-normal text-slate-500">/mês</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      Incluso: <strong>{plan.baseUsers} usuários</strong> • Extra: <strong>R$ {plan.pricePerExtraUser}/usuário</strong>
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                    {agencies.filter((a) => a.subscription?.planId === plan.id).length} agências assinantes deste plano
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SAAS ARCHITECTURE INSIGHTS & STRATEGIC RECOMMENDATIONS */}
      {/* ------------------------------------------------------------- */}
      {activeMasterTab === "insights" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-slate-800">
          <div>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Arquitetura & Estratégia B2B
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              Análise Especializada do Sistema como um SaaS de Sucesso
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Como proprietário do software, analisei a operação e listei as principais oportunidades para escalar sua receita e proteger seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                1. Modelo de Precificação Híbrido (Assentos + Volume IA)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cobrar apenas uma mensalidade fixa limita o crescimento da sua receita quando uma agência atende 500 empresas. O modelo mais lucrativo implementado aqui é: <strong>Taxa Base por Agência + Valor por Assento de Operador Adicional (R$ 39 a R$ 49/mês) + Franquia de Leituras de Vouchers com IA</strong>. Isso garante que agências maiores paguem proporcionalmente ao valor que extraem.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-600" />
                2. Isolamento Multi-Tenancy & Segurança de Dados
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Agências de turismo concorrem entre si e atendem empresas sob sigilo comercial. Todas as tabelas (`companies`, `vouchers`, `users`) agora possuem chave de inquilino (`agencyId`). Uma agência jamais visualiza os vouchers ou clientes corporativos da outra, atendendo plenamente à <strong>LGPD (Lei Geral de Proteção de Dados)</strong>.
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                3. Automação de Faturamento e NFS-e
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No Brasil, softwares SaaS recolhem <strong>ISS sob o código 1.05 da LC 116/03</strong> (geralmente alíquota entre 2% e 5%). O módulo de faturamento integrado gera automaticamente a discriminação oficial do serviço e o cálculo do imposto devido, permitindo integração direta com gateways de pagamento recorrente (como Asaas, Iugu ou Efí).
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                4. Régua de Inadimplência e Bloqueio Automático
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Com o botão de bloqueio com 1 clique, você pode suspender o acesso de agências que atrasarem a mensalidade por mais de 5 dias. O sistema exibe um banner financeiro amigável na tela do operador, direcionando para pagamento instantâneo via PIX com baixa em tempo real.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CADASTRO / EDIÇÃO DE AGÊNCIA & ASSINATURA              */}
      {/* ------------------------------------------------------------- */}
      {isAgencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingAgency ? "Editar Agência & Assinatura" : "Cadastrar Nova Agência Assinante (Login Master)"}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure os dados cadastrais, logins inclusos e valor mensal negociado.
                </p>
              </div>
              <button
                onClick={() => setIsAgencyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgency} className="p-6 space-y-5">
              {/* Basic Agency Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razão Social da Agência *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Viagens & Eventos Ltda."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: FlyEventos Turismo"
                    value={formTradeName}
                    onChange={(e) => setFormTradeName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={formCnpj}
                    onChange={(e) => setFormCnpj(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail Master de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="master@agencia.com.br"
                    value={formMasterEmail}
                    onChange={(e) => setFormMasterEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha de Acesso Master {editingAgency ? "(Deixe em branco para manter)" : "*"}
                  </label>
                  <input
                    type="password"
                    required={!editingAgency}
                    minLength={editingAgency ? undefined : 6}
                    placeholder={editingAgency ? "******** (inalterada)" : "Mínimo 6 caracteres"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:border-sky-500"
                  />
                  {!editingAgency && (
                    <span className="text-[10px] text-slate-400 mt-1 block">Mínimo de 6 caracteres para acesso seguro</span>
                  )}
                </div>
              </div>

              {/* Plan & Pricing Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Configuração do Plano & Mensalidade
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Plano Base
                    </label>
                    <select
                      value={formPlanId}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer font-medium"
                    >
                      {getPlans().map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Base R$ {p.basePrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Qtd. de Usuários / Logins
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formMaxUsers}
                      onChange={(e) => handleUsersCountChange(parseInt(e.target.value) || 1)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-sky-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Valor da Mensalidade (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={formMonthlyFee}
                      onChange={(e) => setFormMonthlyFee(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-sky-500 font-extrabold text-sky-800"
                    />
                    <span className="text-[10px] text-slate-400">Pode alterar livremente</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Status da Assinatura
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as SubscriptionStatus)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                    >
                      <option value="active">Ativa (Acesso Liberado)</option>
                      <option value="trial">Em Homologação (Trial)</option>
                      <option value="blocked">Bloqueada (Inadimplente)</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ciclo de Cobrança
                    </label>
                    <select
                      value={formBillingCycle}
                      onChange={(e) => setFormBillingCycle(e.target.value as BillingCycle)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Próximo Vencimento
                    </label>
                    <input
                      type="date"
                      value={formNextDueDate}
                      onChange={(e) => setFormNextDueDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAgencyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAgency}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                >
                  {isSavingAgency && <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  {editingAgency ? (isSavingAgency ? "Salvando..." : "Salvar Alterações") : (isSavingAgency ? "Criando Agência..." : "Criar Agência & Assinatura")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Delete Agencies Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Exclusão em Lote de Agências
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Selecione as agências que deseja remover permanentemente da base de dados.
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection quick actions */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllAgencies}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Selecionar Todas ({agencies.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllAgencies}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Desmarcar Todas
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                <span className="text-red-600 font-bold">{selectedAgencyIds.length}</span> selecionada(s)
              </div>
            </div>

            {/* List of agencies */}
            <div className="p-5 overflow-y-auto space-y-2 flex-1">
              {agencies.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma agência cadastrada no sistema.
                </div>
              ) : (
                agencies.map((agency) => {
                  const isSelected = selectedAgencyIds.includes(agency.id);
                  return (
                    <div
                      key={agency.id}
                      onClick={() => toggleSelectAgency(agency.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-red-50/50 border-red-300 ring-1 ring-red-200"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 pointer-events-none"
                        />
                        <img
                          src={agency.logoUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=80"}
                          alt={agency.name}
                          className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {agency.tradeName || agency.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            CNPJ: {agency.cnpj || "Não cadastrado"} • {agency.masterLoginEmail || agency.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            agency.subscription?.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : agency.subscription?.status === "trial"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {agency.subscription?.status === "active" ? "Ativa" : agency.subscription?.status === "trial" ? "Trial" : "Bloqueada"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                A exclusão apagará vouchers, equipes e dados associados permanentemente.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedAgencyIds.length === 0 || isDeletingBatch}
                  onClick={handleConfirmBatchDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isDeletingBatch
                      ? "Excluindo..."
                      : `Excluir Selecionadas (${selectedAgencyIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NFS-e Viewer Modal */}
      <NfeViewerModal
        invoice={selectedInvoiceForNfe}
        onClose={() => setSelectedInvoiceForNfe(null)}
      />
    </div>
  );
};
