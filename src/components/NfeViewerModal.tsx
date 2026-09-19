import React from "react";
import { X, Printer, Download, CheckCircle, ShieldCheck, FileCheck, Building2, QrCode } from "lucide-react";
import { Invoice } from "../types";

interface NfeViewerModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const NfeViewerModal: React.FC<NfeViewerModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = Number(invoice.amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const formattedTax = Number(invoice.nfeTaxValue || (invoice.amount * 0.025)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top Action Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Espelho Oficial de Nota Fiscal Eletrônica (NFS-e)
              </h3>
              <p className="text-[11px] text-slate-400">
                Padrão Nacional ABRASF / Secretaria Municipal de Finanças
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NFS-e Document Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white" id="nfe-print-area">
          {/* Header standard */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-700 text-white flex items-center justify-center font-black text-xl">
                NF
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Prefeitura Municipal / Secretaria da Fazenda
                </p>
                <h4 className="text-base font-extrabold text-slate-900">
                  NOTA FISCAL ELETRÔNICA DE SERVIÇOS - NFS-e
                </h4>
                <p className="text-xs text-slate-600">
                  RPS Nº {invoice.invoiceNumber} | Série {invoice.nfeSeries || "E"}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6">
              <div className="text-xs font-bold text-slate-500">NÚMERO DA NOTA</div>
              <div className="text-lg font-black text-sky-800 font-mono">
                {invoice.nfeNumber || `NFS-2026-${Math.floor(10000 + Math.random() * 90000)}`}
              </div>
              <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                Cód. Verificação: <span className="font-bold text-slate-900">{invoice.nfeVerificationCode || "7A2F-9B4E-1192"}</span>
              </div>
            </div>
          </div>

          {/* Prestador & Tomador Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prestador (Você / O SaaS) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-sky-800 uppercase tracking-wider text-[10px]">
                  PRESTADOR DE SERVIÇOS (SaaS)
                </span>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-[10px] font-bold">
                  Emitente
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">AIVOUCHER TECNOLOGIA & SAAS - ROMAMIA VIAGENS</p>
                <p className="text-slate-600">CNPJ: 45.981.234/0001-99</p>
                <p className="text-slate-600">Inscrição Municipal: 8.921.442-1</p>
                <p className="text-slate-600">Av. Paulista, 2200 - Conj. 141 - São Paulo/SP</p>
                <p className="text-slate-600">contato@aivoucher.com.br</p>
              </div>
            </div>

            {/* Tomador (A Agência de Viagens) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  TOMADOR DE SERVIÇOS (AGÊNCIA)
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                  Cliente Assinante
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{invoice.agencyName}</p>
                <p className="text-slate-600">CNPJ: {invoice.agencyCnpj || "Não informado"}</p>
                <p className="text-slate-600">Referência da Assinatura: {invoice.billingPeriod}</p>
                <p className="text-slate-600">Quantidade de Usuários Ativos: {invoice.usersCount} assentos</p>
              </div>
            </div>
          </div>

          {/* Discriminação dos Serviços */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                DISCRIMINAÇÃO DOS SERVIÇOS PRESTADOS
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Item LC 116/03: 01.05 - Licenciamento de Software
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
              {invoice.nfeServiceDescription || `Licenciamento de uso contínuo de sistema e plataforma SaaS na nuvem para leitura inteligente por inteligência artificial e emissão padronizada de vouchers turísticos corporativos (AiVoucher - RomamiaViagens®).
Referente ao ciclo de assinatura do mês: ${invoice.billingPeriod}.
Total de licenças de operadores e usuários simultâneos inclusos: ${invoice.usersCount} usuários.`}
            </p>
            <div className="pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <p>• Natureza da Operação: Tributação no município (São Paulo - SP)</p>
              <p>• Regime Especial de Tributação: Sociedade de Software e Serviços em Nuvem</p>
            </div>
          </div>

          {/* Cálculo dos Impostos e Valores */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              TRIBUTOS & VALOR LÍQUIDO DA NOTA FISCAL
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Valor dos Serviços</span>
                <p className="text-sm font-bold text-slate-900">{formattedAmount}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Alíquota ISS</span>
                <p className="text-sm font-bold text-slate-900">{invoice.nfeTaxRate || 2.5}%</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Valor do ISS</span>
                <p className="text-sm font-bold text-emerald-700">{formattedTax}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Valor Líquido</span>
                <p className="text-base font-extrabold text-sky-800">{formattedAmount}</p>
              </div>
            </div>
          </div>

          {/* Autenticidade e Certificação Digital */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between text-xs text-slate-600 gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Documento Fiscal Emitido com Certificado Digital ICP-Brasil</p>
                <p className="text-[11px] text-slate-500">
                  Emitido em: {invoice.nfeEmittedAt ? new Date(invoice.nfeEmittedAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR")} | Chave de Validação: {invoice.nfeVerificationCode || "7A2F-9B4E-1192"}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-center border-l border-slate-200 pl-4">
              <QrCode className="w-10 h-10 text-slate-700 mx-auto" />
              <span className="text-[9px] text-slate-500 uppercase font-mono">Consulta QR</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            Fatura {invoice.invoiceNumber} • Status: <span className="font-bold text-emerald-700 uppercase">{invoice.status === 'paid' ? 'Paga com Sucesso' : 'Aguardando Pagamento'}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
