import React, { useState, useEffect } from "react";
import {
  CreditCard,
  FileCheck,
  QrCode,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  X,
  RefreshCw,
  MessageCircle,
  AlertCircle
} from "lucide-react";
import { AgencyProfile, Invoice, SaasPlan } from "../types";
import { NfeViewerModal } from "./NfeViewerModal";

interface AgencySubscriptionViewProps {
  agency: AgencyProfile;
  onOpenTeamModal: () => void;
}

export const AgencySubscriptionView: React.FC<AgencySubscriptionViewProps> = ({
  agency,
  onOpenTeamModal
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoiceForNfe, setSelectedInvoiceForNfe] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);
  const [copiedModalPix, setCopiedModalPix] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const sub = agency.subscription;

  const loadInvoices = async () => {
    try {
      const res = await fetch(`/api/saas/invoices?agencyId=${agency.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error("Error loading agency invoices:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadInvoices();

    setPlansLoading(true);
    fetch("/api/saas/plans")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlans(data.filter((p: any) => p.isActive !== false));
      })
      .catch((err) => console.error("Error loading plans:", err))
      .finally(() => setPlansLoading(false));
  }, [agency.id]);

  const handleCopyPix = (invoiceId: string, pixCode?: string) => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopiedPixId(invoiceId);
    setTimeout(() => setCopiedPixId(null), 2500);
  };

  const handleCopyModalPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedModalPix(true);
    setTimeout(() => setCopiedModalPix(false), 2500);
  };

  const formattedFee = Number(sub?.monthlyFee || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assinatura do Software
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  sub?.status === "blocked"
                    ? "bg-red-100 text-red-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {sub?.status === "blocked" ? "Suspensa" : "Ativa"}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Plano {sub?.planName || "Profissional Corp"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Licenciamento mensal com suporte e leituras ilimitadas de vouchers com inteligência artificial
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 font-medium">Valor da Mensalidade</span>
            <div className="text-2xl font-black text-sky-800">{formattedFee}<span className="text-xs font-normal text-slate-500">/mês</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Próximo vencimento: <strong className="text-slate-800">{sub?.nextDueDate ? new Date(sub.nextDueDate + 'T00:00:00').toLocaleDateString('pt-BR') : '10/10/2026'}</strong>
            </div>
          </div>
        </div>

        {/* Plan Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Usuários / Logins
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                {agency.activeUsersCount || 1} <span className="text-xs font-normal text-slate-500">de {sub?.maxUsers || 5} permitidos</span>
              </p>
            </div>
            <button
              onClick={onOpenTeamModal}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Gerenciar Equipe
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Forma de Pagamento
            </span>
            <p className="text-base font-bold text-slate-900 mt-0.5 capitalize flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-sky-600" />
              {sub?.paymentMethod === "pix" ? "PIX Automático" : sub?.paymentMethod === "boleto" ? "Boleto Bancário" : "Cartão de Crédito"}
            </p>
            <span className="text-[10px] text-slate-500">Baixa automática com emissão de NFS-e</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Ciclo de Faturamento
            </span>
            <p className="text-base font-bold text-slate-900 mt-0.5 capitalize">
              {sub?.billingCycle === "annual" ? "Anual (com desconto)" : "Mensal Recorrente"}
            </p>
            <span className="text-[10px] text-slate-500">Renovação contínua</span>
          </div>
        </div>
      </div>

      {/* Planos Oficiais Disponíveis */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-700" />
            Planos Oficiais Disponíveis
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Conheça os planos ativos no sistema para adequar a capacidade de emissões e logins da sua agência.
          </p>
        </div>

        {plansLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Carregando planos disponíveis...</div>
        ) : plans.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">Nenhum plano configurado no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isCurrent =
                sub?.planId === p.id ||
                (sub?.planName && sub.planName.toLowerCase().includes(p.name.toLowerCase()));

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? "border-[#00277A] bg-sky-50/40 ring-2 ring-[#00277A]/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-sm text-slate-900">{p.name}</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Plano Atual
                        </span>
                      ) : p.isPopular ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                          Mais Escolhido
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-2xl font-black text-slate-900">
                        {Number(p.basePrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      <span className="text-xs text-slate-500 font-normal">/mês</span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">{p.description}</p>

                    <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-700">
                      <div className="flex items-center gap-2 font-medium">
                        <Users className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                        <span>{p.baseUsers} usuários inclusos</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{p.maxVouchersPerMonth === -1 ? "Vouchers ilimitados" : `${p.maxVouchersPerMonth} vouchers/mês`}</span>
                      </div>
                      {p.features && p.features.map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    {isCurrent ? (
                      <div className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl text-center border border-emerald-200">
                        ✓ Plano Ativo na sua Conta
                      </div>
                    ) : (
                      <a
                        href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Gostaria de migrar minha agência ${agency.name} (CNPJ: ${agency.cnpj || "N/A"}) para o plano ${p.name}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Solicitar Troca de Plano</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices and Tax Notes (NFS-e) Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Faturas & Notas Fiscais Eletrônicas (NFS-e)
            </h3>
            <p className="text-xs text-slate-500">
              Acesse suas faturas mensais, realize pagamentos via PIX e baixe os espelhos oficiais de NFS-e.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Carregando histórico financeiro...
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Nenhuma fatura registrada no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50">
                  <th className="py-3 px-4">Fatura / Período</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Nota Fiscal (NFS-e)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "paid";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <div className="text-[11px] text-slate-500">{inv.billingPeriod} • {inv.usersCount} logins</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {new Date(inv.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {Number(inv.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paga
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Aguardando
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {inv.nfeStatus === "emitted" ? (
                          <button
                            onClick={() => setSelectedInvoiceForNfe(inv)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>{inv.nfeNumber || "NFS-e Emitida"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Emitida após quitação</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {!isPaid && inv.pixCode && (
                          <button
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            title="Abrir tela de pagamento PIX"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pagar PIX</span>
                          </button>
                        )}

                        {inv.nfeStatus === "emitted" && (
                          <button
                            onClick={() => setSelectedInvoiceForNfe(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>Ver Nota</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NFS-e Viewer Modal */}
      <NfeViewerModal
        invoice={selectedInvoiceForNfe}
        onClose={() => setSelectedInvoiceForNfe(null)}
      />

      {/* Payment Modal */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Pagamento Instantâneo PIX
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Fatura {selectedInvoiceForPayment.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs text-slate-500">Valor da Assinatura</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {Number(selectedInvoiceForPayment.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Vencimento</div>
                  <div className="text-xs font-bold text-slate-800">
                    {new Date(selectedInvoiceForPayment.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedInvoiceForPayment.pixCode || "")}`}
                    alt="QR Code PIX"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-500 text-center font-medium">
                  Abra o app do seu banco e aponte a câmera para o QR Code acima
                </p>
              </div>

              {/* PIX Copia e Cola */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ou copie a chave PIX Copia e Cola:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedInvoiceForPayment.pixCode || ""}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 select-all"
                  />
                  <button
                    onClick={() => handleCopyModalPix(selectedInvoiceForPayment.pixCode || "")}
                    className="shrink-0 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {copiedModalPix ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Itaú PJ Transferência Direta Fallback */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  Conta Jurídica Itaú Unibanco
                </div>
                <div className="text-[11px] text-amber-800 space-y-0.5">
                  <div><strong>Favorecido:</strong> AiVoucher do Brasil Tecnologia LTDA</div>
                  <div><strong>Chave PIX (CNPJ):</strong> 12.345.678/0001-90</div>
                  <div><strong>Banco:</strong> 341 - Itaú Unibanco • Agência: 0123 • C/C: 45678-9</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    await loadInvoices();
                    const updated = invoices.find(i => i.id === selectedInvoiceForPayment.id);
                    if (updated && updated.status === "paid") {
                      setSelectedInvoiceForPayment(null);
                      alert("Pagamento identificado com sucesso! Acesso renovado.");
                    }
                  }}
                  disabled={isRefreshing}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>{isRefreshing ? "Verificando compensação..." : "Já realizei o pagamento (Verificar)"}</span>
                </button>

                <a
                  href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Realizei o pagamento da fatura ${selectedInvoiceForPayment.invoiceNumber} da agência ${agency.name}. Segue comprovante para baixa.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 text-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enviar comprovante no WhatsApp do suporte</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
