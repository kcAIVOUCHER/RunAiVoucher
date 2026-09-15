import React from "react";
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
  X
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
  userRole
}) => {
  const isBlocked = agency?.subscription?.status === "blocked";
  const { logout } = useAuth();
  const [logoUrl, setLogoUrl] = React.useState<string>("/logo.jpeg");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch("/api/saas/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.platformLogoUrl) {
          setLogoUrl(data.platformLogoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
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
            {/* Platform Logo (iVoucher) */}
            <div className="flex items-center justify-center shrink-0">
              <img src={logoUrl} alt="iVoucher" className="h-9 sm:h-10 w-auto object-contain max-w-[120px] sm:max-w-[140px]" />
            </div>

            {/* SE houver logo da agência configurado: Ele substitui completamente o texto! */}
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
                <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full uppercase tracking-wider block">
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
                <p className="text-[11px] text-slate-700 font-bold truncate max-w-[140px] sm:max-w-[200px] mt-0.5">
                  {agency?.tradeName || agency?.name || "Ambiente da Agência"}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Navigation Tabs (Visible on md and up) */}
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

                <button
                  onClick={() => handleTabClick("generator")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "generator"
                      ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Emitir Voucher</span>
                </button>

                <button
                  onClick={() => handleTabClick("companies")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "companies"
                      ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
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
                      ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Histórico</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {vouchersCount}
                  </span>
                </button>

                {(!userRole || userRole === 'saas_admin' || userRole === 'master' || userRole === 'agency_admin' || isMasterMode) && (
                  <>
                    <button
                      onClick={() => handleTabClick("team")}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "team"
                          ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Operadores e licenças da agência"
                    >
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Equipe</span>
                    </button>

                    <button
                      onClick={() => handleTabClick("subscription")}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "subscription"
                          ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Assinatura e Faturas / NFS-e"
                    >
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>Assinatura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabClick("agency")}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "agency"
                          ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Dados e Configurações da Agência"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </button>
                  </>
                )}
              </>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            <button
              onClick={() => logout()}
              className="px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5"
              title="Sair do sistema e limpar sessão local"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[11px]">Sair</span>
            </button>
          </nav>

          {/* Mobile Navigation Toggle (Visible on screens < md) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {isMasterMode ? (
            <div className="space-y-3 pb-2 border-b border-slate-100">
              <div className="px-2 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-sky-600" />
                Painel Super Admin SaaS
              </div>
              {allAgencies && allAgencies.length > 0 && onEnterAgency && (
                <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl space-y-1">
                  <label className="text-[11px] font-bold text-sky-950 block">
                    Emular Agência:
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = allAgencies.find((a) => a.id === e.target.value);
                      if (selected) {
                        onEnterAgency(selected);
                        setMobileMenuOpen(false);
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
            </div>
          ) : (
            <div className="space-y-1">
              {onBackToMaster && (
                <button
                  type="button"
                  onClick={() => {
                    onBackToMaster();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 min-h-[44px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar ao Painel Master</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleTabClick("generator")}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between min-h-[44px] ${
                  activeTab === "generator"
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Emitir Voucher</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("companies")}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between min-h-[44px] ${
                  activeTab === "companies"
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Empresas Cadastradas</span>
                </div>
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {companiesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("history")}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between min-h-[44px] ${
                  activeTab === "history"
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Histórico de Vouchers</span>
                </div>
                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {vouchersCount}
                </span>
              </button>

              {(!userRole || userRole === 'saas_admin' || userRole === 'master' || userRole === 'agency_admin' || isMasterMode) && (
                <>
                  <button
                    type="button"
                    onClick={() => handleTabClick("team")}
                    className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 min-h-[44px] ${
                      activeTab === "team"
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Equipe e Operadores</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("subscription")}
                    className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 min-h-[44px] ${
                      activeTab === "subscription"
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Assinatura e Cobrança</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("agency")}
                    className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 min-h-[44px] ${
                      activeTab === "agency"
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span>Configurações da Agência</span>
                  </button>
                </>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 border border-red-200 min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

