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
  LogOut
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Agency Identifier */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <img src={logoUrl} alt="Platform Logo" className="h-10 w-auto object-contain" />
              
              {!isMasterMode && agency?.logoUrl && (
                <>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <img src={agency.logoUrl} alt={agency.name} className="h-8 w-auto object-contain max-w-[80px]" />
                </>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded">
                  {isMasterMode ? "SUPER ADMIN SAAS" : "AGÊNCIA"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">
                {isMasterMode ? "Painel de Controle Central" : agency?.name || "Ambiente da Agência"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {isMasterMode ? (
              <div className="flex items-center gap-2">
                {allAgencies && allAgencies.length > 0 && onEnterAgency && (
                  <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[11px] font-bold text-sky-900 hidden sm:inline">
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
                <span className="text-xs font-bold text-slate-600 px-3 py-1.5 bg-slate-100 rounded-xl hidden md:flex items-center gap-1.5">
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
                    <span className="hidden md:inline">Painel Master</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectTab("generator")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "generator"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span className="hidden sm:inline">Emitir Voucher</span>
                  <span className="sm:hidden">Emitir</span>
                </button>

                <button
                  onClick={() => onSelectTab("companies")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "companies"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Empresas</span>
                  <span className="sm:hidden">Empresas</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
                    {companiesCount}
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab("history")}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "history"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <History className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Histórico</span>
                  <span className="sm:hidden">Histórico</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
                    {vouchersCount}
                  </span>
                </button>

                {(!userRole || userRole === 'saas_admin' || userRole === 'master' || userRole === 'agency_admin' || isMasterMode) && (
                  <>
                    <button
                      onClick={() => onSelectTab("team")}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "team"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Operadores e licenças da agência"
                    >
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="hidden md:inline">Equipe</span>
                    </button>

                    <button
                      onClick={() => onSelectTab("subscription")}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "subscription"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Assinatura e Faturas / NFS-e"
                    >
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span className="hidden md:inline">Assinatura</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectTab("agency")}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "agency"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                      title="Dados e Configurações da Agência"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden md:inline">Configurações</span>
                    </button>
                  </>
                )}
              </>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

            <button
              onClick={() => logout()}
              className="p-2 sm:px-2.5 sm:py-2 min-h-[40px] sm:min-h-auto rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5"
              title="Sair do sistema e limpar sessão local"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">Sair</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
