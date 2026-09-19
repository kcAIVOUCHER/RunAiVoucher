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
  Check
} from "lucide-react";
import { AgencyProfile, Invoice } from "../types";
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
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  const sub = agency.subscription;

  useEffect(() => {
    async function loadInvoices() {
      setIsLoading(true);
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
      }
    }

    loadInvoices();
  }, [agency.id]);

  const handleCopyPix = (invoiceId: string, pixCode?: string) => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopiedPixId(invoiceId);
    setTimeout(() => setCopiedPixId(null), 2500);
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
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
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
                  ? "Período de Teste"
                  : "Suspensa"}
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
                            onClick={() => handleCopyPix(inv.id, inv.pixCode)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Copiar Código PIX Copia-e-Cola"
                          >
                            {copiedPixId === inv.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <QrCode className="w-3 h-3" />
                                <span>Pagar PIX</span>
                              </>
                            )}
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
    </div>
  );
};
