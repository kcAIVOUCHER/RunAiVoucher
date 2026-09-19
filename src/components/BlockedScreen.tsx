import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  ExternalLink, 
  Building2, 
  CreditCard,
  MessageCircle,
  Clock,
  Sparkles,
  Lock
} from "lucide-react";
import { AgencyProfile, Invoice, PlatformSettings } from "../types";

interface BlockedScreenProps {
  agency: AgencyProfile;
  onRefreshStatus: () => Promise<void>;
  onNavigateToMaster?: () => void;
  isMasterUser?: boolean;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({
  agency,
  onRefreshStatus,
  onNavigateToMaster,
  isMasterUser = false,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState<"mercadopago" | "itau" | "boleto">("mercadopago");
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedItau, setCopiedItau] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [generatingMp, setGeneratingMp] = useState(false);

  // Load unpaid invoices for this agency and platform settings
  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      const [invRes, setRes] = useState();
      const resInvoices = await fetch(`/api/saas/invoices?agencyId=${agency.id}`);
      const resSettings = await fetch("/api/saas/settings");

      if (resInvoices.ok) {
        const data: Invoice[] = await resInvoices.json();
        // filter unpaid
        const unpaid = data.filter(
          (inv) => inv.status === "pending" || inv.status === "overdue"
        );
        setInvoices(unpaid.length > 0 ? unpaid : data);
      }

      if (resSettings.ok) {
        const setJson = await resSettings.json();
        setSettings(setJson);
      }
    } catch (err) {
      console.error("Error loading invoice data for blocked screen:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, [agency.id]);

  const activeInvoice = invoices[0];

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyItauKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedItau(true);
    setTimeout(() => setCopiedItau(false), 3000);
  };

  const handleCopyBarcode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 3000);
  };

  const handleGenerateMpPix = async () => {
    if (!activeInvoice) return;
    try {
      setGeneratingMp(true);
      const res = await fetch(`/api/saas/invoices/${activeInvoice.id}/create-mp-payment`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.invoice) {
          setInvoices((prev) => [data.invoice, ...prev.slice(1)]);
        }
      }
    } catch (e) {
      console.error("Error generating MP PIX:", e);
    } finally {
      setGeneratingMp(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshStatus();
    await loadInvoiceData();
    setIsRefreshing(false);
  };

  const itauKey = settings.itauPixKey || "54.892.120/0001-44";
  const itauBeneficiary = settings.itauBeneficiaryName || "Romamia Viagens e Turismo Ltda (AiVoucher)";
  const itauBankInfo = settings.itauBankInfo || "Banco Itaú Unibanco S.A. (341) - Agência 0365 - CC 98234-1";
  const whatsappNumber = (settings.supportWhatsapp || "5511999999999").replace(/\D/g, "");

  const pixCode = activeInvoice?.mpQrCode || activeInvoice?.pixCode || `00020126580014BR.GOV.BCB.PIX0136pix-mp-${activeInvoice?.id || 'demo'}520400005303986540${(activeInvoice?.amount || 199).toFixed(2)}5802BR5925AIVOUCHER SAAS BRASIL6009SAO PAULO62070503***6304E3A1`;

  const whatsappMessage = encodeURIComponent(
    `Olá! Sou da agência ${agency.name}. Realizei o pagamento da mensalidade (Fatura ${activeInvoice?.invoiceNumber || ""}) no valor de R$ ${(activeInvoice?.amount || 0).toFixed(2)} via PIX Itaú PJ. Gostaria de solicitar a liberação do nosso acesso.`
  );

  return (
    <div id="blocked-screen-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-red-500 selection:text-white">
      {/* Top Banner */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              AiVoucher <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 font-mono">ACESSO SUSPENSO</span>
            </h1>
            <p className="text-xs text-slate-400">
              Agência: <span className="text-slate-200 font-semibold">{agency.name}</span>
            </p>
          </div>
        </div>

        {isMasterUser && onNavigateToMaster && (
          <button
            id="btn-master-bypass"
            onClick={onNavigateToMaster}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer font-medium"
          >
            Acessar Painel Master SaaS →
          </button>
        )}
      </header>

      {/* Main Content Box */}
      <main className="max-w-4xl w-full mx-auto my-8 bg-slate-850 rounded-2xl border border-red-900/40 shadow-2xl p-6 sm:p-8">
        {/* Urgent Alert Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-900/30 text-red-400 border border-red-700/50 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Assinatura Suspensa por Inadimplência
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Identificamos que o prazo de tolerância de <strong className="text-red-400 font-semibold">3 dias úteis</strong> após o vencimento da sua fatura expirou. Para restabelecer o acesso à emissão de vouchers, realize a quitação abaixo.
              </p>
            </div>
          </div>

          <button
            id="btn-refresh-status"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shrink-0 cursor-pointer"
            title="Verificar se o pagamento já foi compensado"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Verificando..." : "Já Paguei / Atualizar"}</span>
          </button>
        </div>

        {/* Invoice Summary Box */}
        {activeInvoice ? (
          <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Fatura</span>
              <span className="text-sm font-bold text-white font-mono">{activeInvoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Valor em Aberto</span>
              <span className="text-sm font-bold text-emerald-400">R$ {Number(activeInvoice.amount).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Vencimento Original</span>
              <span className="text-sm font-bold text-slate-200">
                {new Date(activeInvoice.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Dias Úteis em Atraso</span>
              <span className="text-sm font-bold text-red-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activeInvoice.businessDaysOverdue ?? 3} dias úteis
              </span>
            </div>
          </div>
        ) : null}

        {/* Payment Methods Tabs */}
        <div className="mt-8">
          <div className="flex border-b border-slate-800 gap-2 sm:gap-4 mb-6 overflow-x-auto">
            <button
              id="tab-btn-mercadopago"
              onClick={() => setActivePaymentTab("mercadopago")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activePaymentTab === "mercadopago"
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>PIX Mercado Pago (Liberação Imediata em 5s)</span>
            </button>

            <button
              id="tab-btn-itau"
              onClick={() => setActivePaymentTab("itau")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activePaymentTab === "itau"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>PIX Itaú PJ (Transferência Direta)</span>
            </button>

            <button
              id="tab-btn-boleto"
              onClick={() => setActivePaymentTab("boleto")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activePaymentTab === "boleto"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Boleto Bancário</span>
            </button>
          </div>

          {/* TAB 1: MERCADO PAGO PIX */}
          {activePaymentTab === "mercadopago" && (
            <div className="bg-slate-900/90 rounded-xl p-5 sm:p-6 border border-sky-950">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Visual QR Code Display */}
                <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0 flex flex-col items-center">
                  {activeInvoice?.mpQrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${activeInvoice.mpQrCodeBase64}`}
                      alt="QR Code PIX Mercado Pago"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 flex flex-col items-center justify-center text-slate-800 p-2 text-center rounded-lg border border-slate-200">
                      <QrCode className="w-14 h-14 text-sky-700 mb-2" />
                      <span className="text-[11px] font-bold">Pague com o App do seu Banco</span>
                      <span className="text-[10px] text-slate-500">Qualquer instituição financeira</span>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-700 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-600" /> PIX Dinâmico Mercado Pago
                  </span>
                </div>

                {/* Copia e Cola & Instructions */}
                <div className="flex-1 w-full space-y-4">
                  <div className="bg-sky-950/40 border border-sky-800/50 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-sky-300 text-xs font-bold mb-1">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Baixa e Desbloqueio 100% Automático</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ao pagar este PIX em qualquer banco, o Mercado Pago reconhece em segundos e nosso sistema desbloqueia sua agência imediatamente.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Código PIX Copia e Cola:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={pixCode}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 w-full focus:outline-none focus:border-sky-500 select-all"
                      />
                      <button
                        id="btn-copy-pix-mp"
                        onClick={() => handleCopyPix(pixCode)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                          copiedPix
                            ? "bg-emerald-600 text-white"
                            : "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-900/30"
                        }`}
                      >
                        {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedPix ? "Copiado!" : "Copiar Código"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                      <span>Verificar Pagamento Agora</span>
                    </button>

                    <button
                      onClick={handleGenerateMpPix}
                      disabled={generatingMp}
                      className="text-xs text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
                    >
                      {generatingMp ? "Gerando novo código..." : "Gerar novo QR Code PIX"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ITAÚ PJ PIX */}
          {activePaymentTab === "itau" && (
            <div className="bg-slate-900/90 rounded-xl p-5 sm:p-6 border border-amber-950">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Building2 className="w-8 h-8" />
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Transferência PIX Direta - Itaú Unibanco PJ
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Você pode realizar uma transferência direta para a nossa conta jurídica oficial no Banco Itaú.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Favorecido:</span>
                      <strong className="text-slate-200">{itauBeneficiary}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Banco / Agência / Conta:</span>
                      <strong className="text-slate-200">{itauBankInfo}</strong>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block text-[11px] mb-1">Chave PIX Oficial (CNPJ):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold text-sm bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 select-all">
                          {itauKey}
                        </span>
                        <button
                          id="btn-copy-itau-key"
                          onClick={() => handleCopyItauKey(itauKey)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            copiedItau
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-600 hover:bg-amber-500 text-white"
                          }`}
                        >
                          {copiedItau ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedItau ? "Chave Copiada!" : "Copiar Chave"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp confirmation button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Já paguei via Itaú PJ, enviar comprovante via WhatsApp</span>
                    </a>
                    <span className="text-[11px] text-slate-400">
                      * O suporte confere e desbloqueia em horário comercial.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOLETO */}
          {activePaymentTab === "boleto" && (
            <div className="bg-slate-900/90 rounded-xl p-5 sm:p-6 border border-emerald-950">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Boleto Bancário Registrado
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    O boleto pode ser pago em qualquer banco ou casa lotérica até a data do vencimento. A compensação leva de 1 a 2 dias úteis.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Linha Digitável do Boleto:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={activeInvoice?.barcode || "34191.79001 01043.510047 91020.150008 8 98350000019900"}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 w-full focus:outline-none focus:border-emerald-500 select-all"
                    />
                    <button
                      id="btn-copy-barcode"
                      onClick={() => handleCopyBarcode(activeInvoice?.barcode || "34191.79001 01043.510047 91020.150008 8 98350000019900")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                        copiedBarcode
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {copiedBarcode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedBarcode ? "Linha Copiada!" : "Copiar Linha"}</span>
                    </button>
                  </div>
                </div>

                {activeInvoice?.mpTicketUrl && (
                  <div className="pt-2">
                    <a
                      href={activeInvoice.mpTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Visualizar / Imprimir PDF Oficial do Boleto</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Support */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>
          AiVoucher SaaS Platform • Suporte ao Cliente:{" "}
          <a
            href={`https://wa.me/${whatsappNumber}?text=Preciso%20de%20ajuda%20com%20meu%20acesso`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white underline"
          >
            Falar no WhatsApp
          </a>
        </span>
        <span className="text-[11px] text-slate-600">
          Identificador da Agência: <code className="font-mono">{agency.id}</code>
        </span>
      </footer>
    </div>
  );
};
