import React, { useState, useEffect } from "react";
import {
  FileText,
  Building2,
  History,
  Settings,
  Plane,
  Users,
  CreditCard,
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Upload,
  UserCheck,
  DollarSign,
  Palette,
  BarChart3,
  HelpCircle,
  FolderOpen,
  ChevronRight,
  Sparkles,
  Layers,
  FileCheck
} from "lucide-react";
import { AgencyProfile } from "../types";
import { useAuth } from "../contexts/AuthContext";

export type NavTab = "generator" | "companies" | "history" | "team" | "subscription" | "agency" | "saas_master";

interface HeaderProps {
  agency: AgencyProfile | null;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  companiesCount: number;
  vouchersCount: number;
  onBackToMaster?: () => void;
  isMasterMode?: boolean;
  allAgencies?: AgencyProfile[];
  onEnterAgency?: (agency: AgencyProfile) => void;
  userRole?: string;
  onOpenHelp?: () => void;
  onNewVoucher?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  agency,
  activeTab,
  onSelectTab,
  companiesCount,
  vouchersCount,
  onBackToMaster,
  isMasterMode,
  allAgencies,
  onEnterAgency,
  userRole,
  onOpenHelp,
  onNewVoucher
}) => {
  const isBlocked = agency?.subscription?.status === "blocked";
  const { logout, user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string>("/logo.jpeg");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/saas/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.platformLogoUrl) {
          setLogoUrl(data.platformLogoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMenuOpen(false);
  };

  const handleNewVoucherClick = () => {
    if (onNewVoucher) {
      onNewVoucher();
    } else {
      onSelectTab("generator");
    }
    setMenuOpen(false);
  };

  const hasAgencyLogo = !isMasterMode && Boolean(agency?.logoUrl && agency.logoUrl.trim());

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner if agency is blocked for payment */}
      {agency && isBlocked && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>
            Atenção: O acesso desta agência está temporariamente suspenso por pendência financeira. Regularize no menu de Assinatura para liberar a emissão de novos vouchers.
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Agency Identifier */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Platform Logo (AiVoucher) */}
            <div className="flex items-center justify-center shrink-0">
              <img
                src={logoUrl}
                alt="AiVoucher"
                className="h-9 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[140px]"
              />
            </div>

            {/* SE houver logo da agência configurado: Exibe ao lado com separador */}
            {hasAgencyLogo ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 shrink-0">
                <img
                  src={agency!.logoUrl}
                  alt={agency!.name}
                  className="h-8 sm:h-9 w-auto max-w-[100px] sm:max-w-[140px] object-contain block"
                  title={agency!.name}
                />
              </div>
            ) : isMasterMode ? (
              /* Se for modo Master SaaS: Exibe badge do Super Admin */
              <div className="pl-2 sm:pl-3 border-l border-slate-200">
                <span
                  className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider block border"
                  style={{
                    backgroundColor: "#D1EDFE",
                    color: "#00277A",
                    borderColor: "rgba(22, 181, 240, 0.4)",
                  }}
                >
                  SUPER ADMIN SAAS
                </span>
                <p className="text-[11px] text-slate-500 font-medium truncate hidden sm:block mt-0.5">
                  Painel de Controle Central
                </p>
              </div>
            ) : (
              /* Se NÃO houver logo configurado na agência: Exibe o texto com o nome */
              <div className="pl-2 sm:pl-3 border-l border-slate-200 min-w-0">
                <span className="text-[9px] font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded uppercase tracking-wider">
                  AGÊNCIA
                </span>
                <p className="text-[11px] text-slate-700 font-bold truncate max-w-[130px] sm:max-w-[200px] mt-0.5">
                  {agency?.tradeName || agency?.name || "Ambiente da Agência"}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Direct Navigation (Fast Access to primary workflows) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {isMasterMode ? (
              <div className="flex items-center gap-2">
                {allAgencies && allAgencies.length > 0 && onEnterAgency && (
                  <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[11px] font-bold text-sky-900">
                      Emular Agência:
                    </span>
                    <select
                      onChange={(e) => {
                        const selected = allAgencies.find((a) => a.id === e.target.value);
                        if (selected) onEnterAgency(selected);
                      }}
                      defaultValue=""
                      className="text-xs font-semibold bg-white border border-sky-300 text-sky-950 rounded-lg px-2 py-1 focus:outline-hidden cursor-pointer"
                    >
                      <option value="" disabled>
                        Selecione para testar...
                      </option>
                      {allAgencies.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.tradeName || ag.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="text-xs font-bold text-slate-600 px-3 py-1.5 bg-slate-100 rounded-xl flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-sky-600" />
                  Painel Central
                </span>
              </div>
            ) : (
              <>
                {onBackToMaster && (
                  <button
                    onClick={onBackToMaster}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
                    title="Voltar ao Painel Master do SaaS"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Painel Master</span>
                  </button>
                )}

                {/* Primary Workflow Button: Criar / Novo Voucher */}
                <button
                  onClick={() => handleTabClick("generator")}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "generator"
                      ? "bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Criar Voucher</span>
                </button>

                <button
                  onClick={() => handleTabClick("companies")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "companies"
                      ? "bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Empresas</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {companiesCount}
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick("history")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "history"
                      ? "bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Histórico</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {vouchersCount}
                  </span>
                </button>
              </>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* Structured Menu Button ☰ (Universal on Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                menuOpen
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300"
              }`}
              title="Abrir Menu Completo do AiVoucher"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => logout()}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Sair da conta"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Menu Button ☰ (Screens < md) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-3 py-2 rounded-lg text-slate-800 hover:bg-slate-100 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {menuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
              <span className="text-xs font-bold">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* BACKDROP FOR SIDEBAR / DRAWER MENU */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* STRUCTURED SLIDE-OVER MENU DRAWER (Responsive: Desktop & Mobile) */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-black">
              ☰
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Menu Principal</h3>
              <p className="text-[11px] text-slate-400">
                {agency?.tradeName || agency?.name || "AiVoucher Operacional"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emulate Agency (If Master Mode) */}
        {isMasterMode && allAgencies && allAgencies.length > 0 && onEnterAgency && (
          <div className="p-3 bg-sky-50 border-b border-sky-100">
            <label className="text-[11px] font-bold text-sky-950 block mb-1">
              Emular Agência (Master):
            </label>
            <select
              onChange={(e) => {
                const selected = allAgencies.find((a) => a.id === e.target.value);
                if (selected) {
                  onEnterAgency(selected);
                  setMenuOpen(false);
                }
              }}
              defaultValue=""
              className="w-full text-xs font-semibold bg-white border border-sky-300 text-sky-950 rounded-lg p-2"
            >
              <option value="" disabled>
                Selecione uma agência...
              </option>
              {allAgencies.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.tradeName || ag.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drawer Scrollable Body - Organizado por Áreas conforme Requisito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ÁREA 1: VOUCHERS */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              VOUCHERS
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={handleNewVoucherClick}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Novo voucher</span>
                </div>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                  Criar
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-emerald-600" />
                  <span>Meus vouchers</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {vouchersCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-slate-400" />
                  <span>Rascunhos</span>
                </div>
              </button>
            </div>
          </div>

          {/* ÁREA 2: DOCUMENTOS */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              DOCUMENTOS
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleTabClick("generator")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-sky-600" />
                  <span>Importar documentos</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Documentos processados</span>
                </div>
              </button>
            </div>
          </div>

          {/* ÁREA 3: CLIENTES */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              CLIENTES
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleTabClick("companies")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Empresas</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {companiesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Passageiros</span>
                </div>
              </button>
            </div>
          </div>

          {/* ÁREA 4: CONFIGURAÇÕES */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              CONFIGURAÇÕES
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleTabClick("generator")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Preferências do voucher</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("generator")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Valores</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("generator")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Plane className="w-4 h-4 text-purple-500" />
                  <span>Tarifas</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("agency")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <span>Identidade visual</span>
                </div>
              </button>
            </div>
          </div>

          {/* ÁREA 5: RELATÓRIOS */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              RELATÓRIOS
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Histórico</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span>Relatórios</span>
                </div>
              </button>
            </div>
          </div>

          {/* ÁREA 6: AJUDA */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
              AJUDA
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (onOpenHelp) onOpenHelp();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 flex items-center justify-between transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  <span>Central de ajuda</span>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>
            </div>
          </div>

          {/* ÁREA ADMINISTRATIVA (Se aplicável) */}
          {(!userRole || userRole === "saas_admin" || userRole === "master" || userRole === "agency_admin" || isMasterMode) && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 block">
                ADMINISTRAÇÃO DA AGÊNCIA
              </span>
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleTabClick("team")}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors min-h-[44px]"
                >
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Equipe e Operadores</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("subscription")}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors min-h-[44px]"
                >
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Assinatura e Cobrança</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 space-y-2">
          {user?.email && (
            <div className="text-[11px] text-slate-500 truncate font-medium">
              Conectado como: <strong className="text-slate-800">{user.email}</strong>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              setMenuOpen(false);
            }}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 border border-red-200 transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta (Logout)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
