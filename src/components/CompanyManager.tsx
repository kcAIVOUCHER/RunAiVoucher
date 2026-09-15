import React, { useState, useRef } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Shield,
  EyeOff,
  Eye,
  CreditCard,
  Search,
  Upload,
  Sparkles,
  ArrowRight,
  X,
  Check
} from "lucide-react";
import { Company, PriceDisplayMode } from "../types";

interface CompanyManagerProps {
  companies: Company[];
  onAddCompany: (company: Omit<Company, "id" | "createdAt">) => Promise<void>;
  onUpdateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  onSelectForVoucher?: (company: Company) => void;
}

export const CompanyManager: React.FC<CompanyManagerProps> = ({
  companies,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onSelectForVoucher
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [defaultPriceDisplay, setDefaultPriceDisplay] = useState<PriceDisplayMode>("sem_valor");
  const [hideFareFamilyByDefault, setHideFareFamilyByDefault] = useState(true);
  const [hideClassByDefault, setHideClassByDefault] = useState(true);
  const [customNotes, setCustomNotes] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingCompany(null);
    setName("");
    setTradeName("");
    setCnpj("");
    setLogoUrl("https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80");
    setDefaultPriceDisplay("sem_valor");
    setHideFareFamilyByDefault(true);
    setHideClassByDefault(true);
    setCustomNotes("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setIsModalOpen(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setName(comp.name);
    setTradeName(comp.tradeName || "");
    setCnpj(comp.cnpj || "");
    setLogoUrl(comp.logoUrl || "");
    setDefaultPriceDisplay(comp.defaultPriceDisplay || "sem_valor");
    setHideFareFamilyByDefault(comp.hideFareFamilyByDefault ?? true);
    setHideClassByDefault(comp.hideClassByDefault ?? true);
    setCustomNotes(comp.customNotes || "");
    setContactPerson(comp.contactPerson || "");
    setEmail(comp.email || "");
    setPhone(comp.phone || "");
    setIsModalOpen(true);
  };

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
            setLogoUrl(dataUrl);
          } else {
            setLogoUrl(reader.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCompany) {
        await onUpdateCompany(editingCompany.id, {
          name,
          tradeName,
          cnpj,
          logoUrl,
          defaultPriceDisplay,
          hideFareFamilyByDefault,
          hideClassByDefault,
          customNotes,
          contactPerson,
          email,
          phone
        });
      } else {
        await onAddCompany({
          name,
          tradeName,
          cnpj,
          logoUrl,
          defaultPriceDisplay,
          hideFareFamilyByDefault,
          hideClassByDefault,
          customNotes,
          contactPerson,
          email,
          phone
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch delete companies state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const isTestCompany = (c: Company) => {
    const n = (c.name || "").toLowerCase();
    const t = (c.tradeName || "").toLowerCase();
    return n.includes("teste") || n.includes("test") || n.includes("demo") || n.includes("exemplo") || t.includes("teste") || t.includes("test");
  };

  const openBatchModal = () => {
    const suggested = companies.filter(isTestCompany).map(c => c.id);
    setSelectedCompanyIds(suggested.length > 0 ? suggested : companies.map(c => c.id));
    setIsBatchModalOpen(true);
  };

  const toggleSelectCompany = (id: string) => {
    setSelectedCompanyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllCompanies = () => {
    setSelectedCompanyIds(companies.map(c => c.id));
  };

  const handleDeselectAllCompanies = () => {
    setSelectedCompanyIds([]);
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedCompanyIds.length === 0) {
      alert("Nenhuma empresa selecionada para exclusão. Marque pelo menos uma na lista.");
      return;
    }
    const selectedComps = companies.filter(c => selectedCompanyIds.includes(c.id));
    const names = selectedComps.map(c => `• ${c.name}`).join("\n");
    if (!window.confirm(`TEM CERTEZA? Isso excluirá PERMANENTEMENTE ${selectedComps.length} empresa(s):\n\n${names}\n\nDeseja prosseguir com a exclusão?`)) {
      return;
    }
    setIsDeletingBatch(true);
    try {
      for (const id of selectedCompanyIds) {
        await onDeleteCompany(id);
      }
      setIsBatchModalOpen(false);
      setSelectedCompanyIds([]);
      alert(`Sucesso! ${selectedComps.length} empresa(s) removida(s) com sucesso.`);
    } catch (err) {
      console.error("Erro ao excluir empresas:", err);
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.cnpj && c.cnpj.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            Empresas Clientes da Agência
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Cadastre quantas empresas desejar. Cada empresa possui suas regras pré-definidas
            (logo corporativo, exibição de valores e ocultação de tarifas/classes) que são
            aplicadas automaticamente na emissão do voucher.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openBatchModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs rounded-lg border border-red-200 transition-colors shrink-0 cursor-pointer shadow-xs"
            title="Limpar ou excluir empresas em lote"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Excluir / Limpar Empresas</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar Nova Empresa
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-slate-200 text-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome da empresa, nome fantasia ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400 text-xs"
        />
        <span className="text-xs text-slate-400 shrink-0 font-medium">
          {filteredCompanies.length} {filteredCompanies.length === 1 ? "empresa" : "empresas"}
        </span>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-12 h-12 object-contain rounded-lg p-1 bg-slate-50 border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {company.tradeName || company.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {company.cnpj ? `CNPJ: ${company.cnpj}` : "Sem CNPJ cadastrado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(company)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md"
                    title="Editar configurações"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover a empresa "${company.name}"?`)) {
                        onDeleteCompany(company.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Excluir empresa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pre-configured Defaults Badges */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  Pré-definições Automáticas do Voucher:
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Exibição de Valores:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {company.defaultPriceDisplay === "sem_valor" && (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        Sem Valor (Omitir)
                      </span>
                    )}
                    {company.defaultPriceDisplay === "apenas_total" && (
                      <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                        Apenas Valor Total
                      </span>
                    )}
                    {company.defaultPriceDisplay === "discriminado" && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        Discriminado
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    Família Tarifária:
                  </span>
                  <span className="font-semibold">
                    {company.hideFareFamilyByDefault ? (
                      <span className="text-purple-700 text-[11px]">Ocultar (Padrão)</span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Mostrar</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Classes de Reserva (Y, Q...):
                  </span>
                  <span className="font-semibold">
                    {company.hideClassByDefault ? (
                      <span className="text-purple-700 text-[11px]">Ocultar (Padrão)</span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Mostrar</span>
                    )}
                  </span>
                </div>
              </div>

              {company.customNotes && (
                <p className="text-[11px] text-slate-500 italic line-clamp-2">
                  "{company.customNotes}"
                </p>
              )}
            </div>

            {/* Bottom: Emit voucher button */}
            {onSelectForVoucher && (
              <button
                onClick={() => onSelectForVoucher(company)}
                className="w-full py-2 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 hover:border-sky-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                Emitir Voucher para {company.tradeName || company.name.split(" ")[0]}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800">
                {editingCompany ? "Editar Empresa Cliente" : "Cadastrar Nova Empresa Cliente"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Razão Social da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PetroVale Indústria e Comércio S.A."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Fantasia (para exibição no Voucher)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PetroVale"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Logo setup */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Logotipo da Empresa (Co-branding no Voucher)
                  </label>
                  <span className="text-[10px] text-slate-400">Limite: 200x150px</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    {logoUrl ? (
                      <>
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="w-14 h-14 object-contain rounded bg-white p-1 border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm"
                          title="Remover logotipo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="w-14 h-14 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                        Logo
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="URL do logotipo (https://...)"
                      value={logoUrl?.startsWith("data:") ? "Imagem do Computador (Base64)" : logoUrl}
                      onChange={(e) => {
                        if (!logoUrl?.startsWith("data:")) {
                          setLogoUrl(e.target.value);
                        }
                      }}
                      disabled={logoUrl?.startsWith("data:")}
                      className={`w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs ${
                        logoUrl?.startsWith("data:") ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer text-[11px] font-medium"
                      >
                        <Upload className="w-3 h-3" /> Fazer upload de imagem
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=""
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer text-[11px] font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remover Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* PRE-DEFINED DEFAULTS (CORE USER REQUIREMENT) */}
              <div className="bg-sky-50/60 p-4 rounded-lg border border-sky-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Pré-definições Automáticas na Emissão de Vouchers
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  Ao selecionar esta empresa durante a emissão de qualquer voucher,
                  estas opções serão carregadas automaticamente como padrão.
                </p>

                {/* Pricing Mode Default */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    1. Como os valores devem aparecer por padrão para esta empresa?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDefaultPriceDisplay("sem_valor")}
                      className={`py-2 px-2.5 rounded border text-center font-medium transition-all ${
                        defaultPriceDisplay === "sem_valor"
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold">Sem Valor</span>
                      <span className="text-[10px] opacity-80">Ocultar todos os preços</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDefaultPriceDisplay("apenas_total")}
                      className={`py-2 px-2.5 rounded border text-center font-medium transition-all ${
                        defaultPriceDisplay === "apenas_total"
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold">Apenas Total</span>
                      <span className="text-[10px] opacity-80">Sem abrir custos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDefaultPriceDisplay("discriminado")}
                      className={`py-2 px-2.5 rounded border text-center font-medium transition-all ${
                        defaultPriceDisplay === "discriminado"
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold">Discriminado</span>
                      <span className="text-[10px] opacity-80">Tarifa, taxas e DU</span>
                    </button>
                  </div>
                </div>

                {/* Fare Family & Class Toggles */}
                <div className="space-y-2 pt-2 border-t border-sky-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideFareFamilyByDefault}
                      onChange={(e) => setHideFareFamilyByDefault(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">
                      Ocultar Famílias Tarifárias por padrão (ex: Light, Plus, Promo, Max)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideClassByDefault}
                      onChange={(e) => setHideClassByDefault(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                    />
                    <span className="text-slate-700 font-medium">
                      Ocultar Letras de Classes por padrão (ex: Y, Q, O, B)
                    </span>
                  </label>
                </div>
              </div>

              {/* Policy Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Política de Viagens / Observações Padrão da Empresa
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Faturamento 15 dias. Centro de custo obrigatório. Solicitações via portal corporativo."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-slate-600 mb-1">Gestor / Contato:</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">E-mail Corporativo:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Telefone:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Salvando..." : editingCompany ? "Salvar Alterações" : "Cadastrar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Delete Companies Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Gerenciador e Limpeza em Lote de Empresas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marque as empresas que deseja excluir ou remova empresas de teste da sua base.
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
                  onClick={handleSelectAllCompanies}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Selecionar Todas ({companies.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllCompanies}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Desmarcar Todas
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                <span className="text-red-600 font-bold">{selectedCompanyIds.length}</span> selecionada(s)
              </div>
            </div>

            {/* List of companies */}
            <div className="p-5 overflow-y-auto space-y-2 flex-1">
              {companies.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma empresa cadastrada no momento.
                </div>
              ) : (
                companies.map((comp) => {
                  const isSelected = selectedCompanyIds.includes(comp.id);
                  return (
                    <div
                      key={comp.id}
                      onClick={() => toggleSelectCompany(comp.id)}
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
                          src={comp.logoUrl || "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&auto=format&fit=crop&q=80"}
                          alt={comp.name}
                          className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {comp.tradeName || comp.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            CNPJ: {comp.cnpj || "Não informado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                A exclusão é definitiva e não afeta vouchers já emitidos.
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
                  disabled={selectedCompanyIds.length === 0 || isDeletingBatch}
                  onClick={handleConfirmBatchDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isDeletingBatch
                      ? "Excluindo..."
                      : `Excluir Selecionadas (${selectedCompanyIds.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
