import React, { useState, useRef } from "react";
import { Settings, Building2, Upload, Check, ShieldCheck, Palette, RotateCcw, AlertTriangle, Trash2 } from "lucide-react";
import { AgencyProfile, PriceDisplayMode } from "../types";

interface AgencySettingsProps {
  agency: AgencyProfile;
  onUpdateAgency: (updated: Partial<AgencyProfile>) => Promise<void>;
  onAgencyReset?: () => void;
}

export const AgencySettings: React.FC<AgencySettingsProps> = ({
  agency,
  onUpdateAgency,
  onAgencyReset
}) => {
  const [formData, setFormData] = useState<AgencyProfile>({ ...agency });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setFormData({ ...formData, logoUrl: dataUrl });
          } else {
            setFormData({ ...formData, logoUrl: reader.result as string });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateAgency(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            Dados da Agência Emissora
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure a identidade da sua agência. Seu logotipo e dados de contato aparecerão
            no cabeçalho oficial de todos os vouchers gerados.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold animate-fade-in">
            <Check className="w-4 h-4" /> Alterações salvas com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
        {/* Basic Data */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Identificação da Agência
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Razão Social da Agência *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={formData.tradeName || ""}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CNPJ da Agência
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Website da Agência
              </label>
              <input
                type="text"
                value={formData.website || ""}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          </div>
        </div>

        {/* Logo and Branding Color */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-600" />
              Personalização Visual do Layout dos Vouchers
            </h3>
            <span className="text-[11px] text-slate-500">
              Escolha as cores da sua agência para aplicar automaticamente aos vouchers emitidos
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
            {/* Logo Preview & Upload */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 text-center space-y-3">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Logotipo Oficial</span>
                <span className="text-[10px] text-slate-400">Limitado a 200x150px no voucher</span>
              </div>
              <div className="h-24 w-full flex items-center justify-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                {formData.logoUrl ? (
                  <div className="relative group flex items-center justify-center w-full h-full">
                    <img
                      src={formData.logoUrl}
                      alt="Logo da agência"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: "" })}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm"
                      title="Remover logotipo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-4 font-medium">Sem logotipo cadastrado</div>
                )}
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer text-xs font-bold transition-colors shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> {formData.logoUrl ? "Trocar Logotipo" : "Enviar Logotipo"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=""
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: "" })}
                      className="inline-flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors border border-red-100 shadow-xs"
                      title="Remover logotipo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ou cole a URL da imagem aqui"
                  value={formData.logoUrl?.startsWith("data:") ? "Imagem do Computador (Base64)" : (formData.logoUrl || "")}
                  onChange={(e) => {
                    if (!formData.logoUrl?.startsWith("data:")) {
                      setFormData({ ...formData, logoUrl: e.target.value });
                    }
                  }}
                  disabled={formData.logoUrl?.startsWith("data:")}
                  className={`w-full px-2.5 py-1.5 border border-slate-300 rounded text-[11px] ${
                    formData.logoUrl?.startsWith("data:") ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Color Palette Selection */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Paletas Corporativas Rápidas (Mais Utilizadas em Turismo):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: "Azul Céu / Aéreo", hex: "#0284c7" },
                    { name: "Azul Marinho Real", hex: "#1e3a8a" },
                    { name: "Verde Esmeralda", hex: "#059669" },
                    { name: "Bordô / Vinho Luxo", hex: "#881337" },
                    { name: "Violeta Boutique", hex: "#6d28d9" },
                    { name: "Dourado / Âmbar", hex: "#b45309" },
                    { name: "Coral / Sol & Praia", hex: "#ea580c" },
                    { name: "Vermelho Clássico", hex: "#dc2626" },
                    { name: "Grafite Executivo", hex: "#334155" },
                  ].map((palette) => (
                    <button
                      key={palette.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: palette.hex })}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        formData.primaryColor === palette.hex
                          ? "border-slate-900 bg-white shadow-xs ring-2 ring-slate-900/10"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white"
                        style={{ backgroundColor: palette.hex }}
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">
                        {palette.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div className="flex flex-wrap items-center gap-4 pt-1 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <label className="font-bold text-slate-700 text-xs">Cor Exata da Marca:</label>
                  <input
                    type="color"
                    value={formData.primaryColor || "#0284c7"}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-8 w-12 rounded cursor-pointer border border-slate-300 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || "#0284c7"}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-24 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-slate-800 uppercase font-bold"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Esta cor definirá a faixa superior, os selos, botões e os destaques de todos os seus vouchers.
                </span>
              </div>

              {/* Live Miniature Voucher Preview */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Prévia em Tempo Real no Voucher:
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                  {/* Top Bar with Chosen Color */}
                  <div
                    className="h-2 w-full transition-colors duration-300"
                    style={{ backgroundColor: formData.primaryColor || "#0284c7" }}
                  />
                  <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs shrink-0"
                        style={{ backgroundColor: formData.primaryColor || "#0284c7" }}
                      >
                        {formData.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: formData.primaryColor || "#0284c7" }}
                        >
                          Agência Emissora
                        </div>
                        <div className="font-bold text-xs text-slate-900 leading-tight">
                          {formData.tradeName || formData.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: formData.primaryColor || "#0284c7" }}
                      >
                        PNR: ZX7R8K
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact and Emergency 24h */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Contatos e Suporte ao Passageiro
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Telefone Comercial:
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                WhatsApp Oficial:
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Plantão 24h / Emergência:
              </label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={formData.emergencyPhone || ""}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-sky-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Endereço Físico Completo:
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                E-mail de Atendimento:
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
              />
            </div>
          </div>
        </div>

        {/* Default agency notes */}
        <div className="space-y-2 pt-2">
          <label className="block font-semibold text-slate-700">
            Regras e Orientações Padrão de Rodapé dos Vouchers:
          </label>
          <textarea
            rows={3}
            value={formData.footerNotes}
            onChange={(e) => setFormData({ ...formData, footerNotes: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? "Salvando..." : "Salvar Configurações da Agência"}
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset Agency Operational Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Zerar Histórico Operacional de Vouchers
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Caso deseje zerar os vouchers emitidos acumulados para reiniciar o ciclo operacional desta agência, utilize a opção ao lado. As preferências, contatos e logotipo da agência permanecem preservados.
            </p>
          </div>

          <button
            type="button"
            disabled={isResetting}
            onClick={async () => {
              if (window.confirm(`Deseja realmente zerar o histórico de vouchers da agência ${agency.name}? Esta operação apagará os vouchers acumulados desta agência.`)) {
                setIsResetting(true);
                try {
                  const res = await fetch(`/api/agencies/${agency.id}/reset-tests`, { method: "POST" });
                  if (res.ok) {
                    setResetSuccess(true);
                    if (onAgencyReset) onAgencyReset();
                    setTimeout(() => setResetSuccess(false), 4000);
                  }
                } catch (err) {
                  console.error("Erro ao resetar agência:", err);
                } finally {
                  setIsResetting(false);
                }
              }
            }}
            className="px-4 py-2.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            {isResetting ? "Processando..." : "Zerar Histórico de Vouchers"}
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            Histórico operacional de vouchers da agência zerado com sucesso!
          </div>
        )}

        <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
          💡 <strong>Gestão SaaS Master:</strong> Para gerenciar planos, faturas ou excluir agências cadastradas, utilize o painel <strong>SaaS Master</strong> no menu superior.
        </div>
      </div>
    </div>
  );
};
