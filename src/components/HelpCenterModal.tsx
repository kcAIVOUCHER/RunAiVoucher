import React from "react";
import {
  X,
  HelpCircle,
  Sparkles,
  FileText,
  Building2,
  Phone,
  CheckCircle2,
  Info,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { AgencyProfile } from "../types";

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency?: AgencyProfile | null;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  agency
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Central de Ajuda AiVoucher</h3>
              <p className="text-[11px] text-sky-200">Guia rápido de uso e suporte ao operador</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-xs leading-relaxed">
          {/* 4-Step Flow */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Fluxo Principal em 4 Passos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px]">1</span>
                  Adicionar documentos
                </div>
                <p className="text-[11px] text-slate-500">
                  Arraste bilhetes em PDF ou imagens, ou cole o texto de e-mails de confirmação e GDS.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px]">2</span>
                  Ler e organizar
                </div>
                <p className="text-[11px] text-slate-500">
                  A IA analisa, extrai localizadores, voos, hotéis, passageiros e tarifas automaticamente.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px]">3</span>
                  Conferir os dados
                </div>
                <p className="text-[11px] text-slate-500">
                  Veja a pré-visualização em padrão A4, ajuste a empresa cliente e regras de tarifas conforme necessário.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px]">4</span>
                  Gerar e salvar PDF
                </div>
                <p className="text-[11px] text-slate-500">
                  Baixe o PDF oficial com paginação inteligente e salve diretamente no histórico da agência.
                </p>
              </div>
            </div>
          </div>

          {/* Formatos e Suporte */}
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 space-y-2">
            <h5 className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-600" />
              Formatos de Arquivos e Textos Suportados
            </h5>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>PDFs de companhias aéreas (LATAM, GOL, Azul, etc.)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Confirmações de hotéis e locadoras</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Prints e fotos legíveis de bilhetes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Formatos GDS (Sabre, Amadeus, Galileo)</span>
              </li>
            </ul>
          </div>

          {/* Suporte da Agência */}
          {agency && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {agency.tradeName || agency.name}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Plantão / Atendimento da agência: {agency.emergencyPhone || agency.phone || "Consulte seu gestor"}
                </span>
              </div>
              {agency.email && (
                <span className="text-[11px] text-slate-600 font-medium">
                  {agency.email}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
