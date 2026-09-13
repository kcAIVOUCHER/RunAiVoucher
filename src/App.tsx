/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header, NavTab } from "./components/Header";
import { VoucherGenerator } from "./components/VoucherGenerator";
import { CompanyManager } from "./components/CompanyManager";
import { VoucherHistory } from "./components/VoucherHistory";
import { AgencySettings } from "./components/AgencySettings";
import { SaasMasterPanel } from "./components/SaasMasterPanel";
import { AgencySubscriptionView } from "./components/AgencySubscriptionView";
import { AgencyTeamModal } from "./components/AgencyTeamModal";
import { AgencyProfile, Company, Voucher } from "./types";
import { ArrowLeft, Building2, Users, CreditCard, ChevronDown, Check, Loader2 } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  const { user, loading } = useAuth();

  const isMasterUser = (u: any): boolean => {
    if (!u) return false;
    const email = (u.email || "").toLowerCase().trim();
    if (email === "kcarrascosa.comercial@gmail.com") return true;
    return u.role === "master" || u.role === "saas_admin";
  };
  
  // Navigation: "saas_master" | "generator" | "companies" | "history" | "team" | "subscription" | "agency"
  const [activeTab, setActiveTab] = useState<NavTab>("generator");
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Agency data state
  const [currentAgency, setCurrentAgency] = useState<AgencyProfile | null>(null);
  const [allAgencies, setAllAgencies] = useState<AgencyProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeVoucherForEdit, setActiveVoucherForEdit] = useState<Voucher | null>(null);

  // Team Modal state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Load all agencies for switcher & set initial agency
  const loadAgenciesList = async () => {
    try {
      const email = user?.email || "kcarrascosa.comercial@gmail.com";
      const res = await fetch("/api/saas/agencies", {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email
        }
      });
      if (res.ok) {
        const list: AgencyProfile[] = await res.json();
        setAllAgencies(list);
        if (list.length > 0 && !currentAgency) {
          setCurrentAgency(list[0]);
        }
      }
    } catch (err) {
      console.error("Error loading agencies list:", err);
    }
  };

  // Load agency-specific data (companies, vouchers, settings)
  const loadAgencyData = async (agencyId: string) => {
    setIsLoading(true);
    console.log("Iniciando carregamento da agência:", agencyId);
    try {
      const [agencyRes, companiesRes, vouchersRes] = await Promise.all([
        fetch(`/api/agency?agencyId=${agencyId}`),
        fetch(`/api/companies?agencyId=${agencyId}`),
        fetch(`/api/vouchers?agencyId=${agencyId}`)
      ]);

      if (agencyRes.ok) {
        const agencyData = await agencyRes.json();
        setCurrentAgency(agencyData);
      } else {
        console.error("Erro ao carregar dados da agência:", await agencyRes.text());
      }
      
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }
      if (vouchersRes.ok) {
        const vouchersData = await vouchersRes.json();
        setVouchers(vouchersData);
      }
    } catch (err) {
      console.error("Erro fatal ao carregar dados da agência:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (isMasterUser(user)) {
        setIsMasterMode(true);
        setActiveTab("saas_master");
        loadAgenciesList();
      } else {
        setIsMasterMode(false);
        setActiveTab("generator");
        if (user.agencyId) {
          loadAgencyData(user.agencyId);
        } else {
          // Fallback to fetch agencyId if not in profile yet
          fetch(`/api/users/check-role?email=${encodeURIComponent(user.email || "")}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.agencyId) {
                loadAgencyData(data.agencyId);
              } else {
                // Try fetching list of agencies as fallback
                fetch("/api/saas/agencies", {
                  headers: {
                    "Content-Type": "application/json",
                    "x-user-email": user.email || ""
                  }
                })
                  .then((r) => r.json())
                  .then((agencies) => {
                    if (Array.isArray(agencies) && agencies.length > 0) {
                      loadAgencyData(agencies[0].id);
                    } else {
                      setIsLoading(false);
                    }
                  })
                  .catch(() => setIsLoading(false));
              }
            })
            .catch((err) => {
              console.error(err);
              setIsLoading(false);
            });
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (currentAgency?.id && isMasterMode) {
      loadAgencyData(currentAgency.id);
    }
  }, [currentAgency?.id, isMasterMode]);

  // Handler to enter an agency from Master Panel (Impersonate / Access)
  const handleEnterAgency = (agency: AgencyProfile) => {
    setCurrentAgency(agency);
    setIsMasterMode(false);
    setActiveTab("generator");
    loadAgencyData(agency.id);
  };

  // Handler to go back to SaaS Master Panel
  const handleBackToMaster = () => {
    if (!isMasterUser(user)) return;
    setIsMasterMode(true);
    setActiveTab("saas_master");
    loadAgenciesList(); // Refresh metrics and lists
  };

  // Switch agency while in agency mode
  const handleSwitchAgency = (agencyId: string) => {
    if (!isMasterUser(user)) return;
    const target = allAgencies.find((a) => a.id === agencyId);
    if (target) {
      setCurrentAgency(target);
      loadAgencyData(target.id);
    }
  };

  // CRUD for Companies
  const handleAddCompany = async (newCompanyData: Omit<Company, "id" | "createdAt">) => {
    if (!currentAgency) return;
    try {
      const res = await fetch(`/api/companies?agencyId=${currentAgency.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCompanyData, agencyId: currentAgency.id })
      });
      if (res.ok) {
        const created = await res.json();
        setCompanies((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("Error adding company:", err);
    }
  };

  const handleUpdateCompany = async (id: string, updatedData: Partial<Company>) => {
    if (!currentAgency) return;
    try {
      const res = await fetch(`/api/companies/${id}?agencyId=${currentAgency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const updated = await res.json();
        setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch (err) {
      console.error("Error updating company:", err);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!currentAgency) return;
    try {
      const res = await fetch(`/api/companies/${id}?agencyId=${currentAgency.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Error deleting company:", err);
    }
  };

  // CRUD for Vouchers
  const handleSaveVoucher = async (voucher: Voucher) => {
    if (!currentAgency) return;
    try {
      const existing = vouchers.find((v) => v.id === voucher.id);
      let res;
      if (existing) {
        res = await fetch(`/api/vouchers/${voucher.id}?agencyId=${currentAgency.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...voucher, agencyId: currentAgency.id })
        });
      } else {
        res = await fetch(`/api/vouchers?agencyId=${currentAgency.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...voucher, agencyId: currentAgency.id })
        });
      }

      if (res.ok) {
        const saved = await res.json();
        setVouchers((prev) => {
          const index = prev.findIndex((v) => v.id === saved.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = saved;
            return updated;
          }
          return [saved, ...prev];
        });
      }
    } catch (err) {
      console.error("Error saving voucher:", err);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!currentAgency) return;
    try {
      const res = await fetch(`/api/vouchers/${id}?agencyId=${currentAgency.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setVouchers((prev) => prev.filter((v) => v.id !== id));
      }
    } catch (err) {
      console.error("Error deleting voucher:", err);
    }
  };

  // Update Agency Profile
  const handleUpdateAgency = async (updatedData: Partial<AgencyProfile>) => {
    if (!currentAgency) return;
    try {
      const res = await fetch(`/api/agency?agencyId=${currentAgency.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const saved = await res.json();
        setCurrentAgency(saved);
        setAllAgencies((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      }
    } catch (err) {
      console.error("Error updating agency:", err);
    }
  };

  // Select voucher from history to view / print in generator
  const handleSelectVoucherFromHistory = (voucher: Voucher) => {
    setActiveVoucherForEdit(voucher);
    setActiveTab("generator");
  };

  // Select company to issue voucher for
  const handleSelectCompanyForVoucher = (company: Company) => {
    setActiveVoucherForEdit((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        companyId: company.id,
        companyName: company.tradeName || company.name,
        companyLogoUrl: company.logoUrl,
        priceDisplayMode: company.defaultPriceDisplay,
        hideFareFamily: company.hideFareFamilyByDefault,
        hideBookingClass: company.hideClassByDefault
      };
    });
    setActiveTab("generator");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="font-medium text-sm animate-pulse">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Tenant Navigation Banner when in Agency View */}
      {!isMasterMode && currentAgency && (
        <div className="bg-slate-900 text-slate-200 px-4 py-2 border-b border-slate-800 text-xs no-print flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {isMasterUser(user) && (
              <>
                <button
                  onClick={handleBackToMaster}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Painel Master SaaS</span>
                </button>
                <span className="text-slate-400">|</span>
              </>
            )}
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">Ambiente da Agência:</span>
              <strong className="text-white">{currentAgency.tradeName || currentAgency.name}</strong>
              <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px] text-sky-400 font-mono">
                {currentAgency.subscription?.planName || "Profissional"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Agency Switcher for Master only */}
            {isMasterUser(user) && allAgencies.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Alternar Agência:</span>
                <select
                  value={currentAgency.id}
                  onChange={(e) => handleSwitchAgency(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  {allAgencies.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.tradeName || ag.name} ({ag.subscription?.status === 'blocked' ? 'BLOQUEADA' : 'Ativa'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(isMasterUser(user) || user?.role === 'agency_admin') && (
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {currentAgency.activeUsersCount || 1}/{currentAgency.subscription?.maxUsers || 5} Logins
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <Header
        agency={currentAgency}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === "saas_master" && !isMasterUser(user)) {
            return;
          }
          if (tab === "team") {
            setIsTeamModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        companiesCount={companies.length}
        vouchersCount={vouchers.length}
        onBackToMaster={isMasterUser(user) ? handleBackToMaster : undefined}
        isMasterMode={isMasterUser(user) && isMasterMode}
        allAgencies={isMasterUser(user) ? allAgencies : []}
        onEnterAgency={handleEnterAgency}
        userRole={user?.role}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <ErrorBoundary fallbackTitle="Falha ao renderizar módulo">
          {isMasterUser(user) && isMasterMode ? (
            /* SaaS Master Admin Dashboard */
            <SaasMasterPanel onEnterAgency={handleEnterAgency} />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Carregando dados da agência...</span>
              </div>
            </div>
          ) : !currentAgency ? (
            <div className="flex items-center justify-center py-24">
              <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Nenhuma agência vinculada</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Sua conta ({user?.email}) ainda não possui uma agência associada no sistema.
                </p>
                {isMasterUser(user) && (
                  <button
                    onClick={handleBackToMaster}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Acessar Painel Master SaaS
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {activeTab === "generator" && (
                <VoucherGenerator
                  agency={currentAgency}
                  companies={companies}
                  initialVoucher={activeVoucherForEdit}
                  onSaveVoucher={handleSaveVoucher}
                  onNavigateToCompanies={() => setActiveTab("companies")}
                />
              )}

              {activeTab === "companies" && (
                <CompanyManager
                  companies={companies}
                  onAddCompany={handleAddCompany}
                  onUpdateCompany={handleUpdateCompany}
                  onDeleteCompany={handleDeleteCompany}
                  onSelectForVoucher={handleSelectCompanyForVoucher}
                />
              )}

              {activeTab === "history" && (
                <VoucherHistory
                  vouchers={vouchers}
                  companies={companies}
                  onSelectVoucher={handleSelectVoucherFromHistory}
                  onDeleteVoucher={handleDeleteVoucher}
                />
              )}

              {activeTab === "subscription" && (
                <AgencySubscriptionView
                  agency={currentAgency}
                  onOpenTeamModal={() => setIsTeamModalOpen(true)}
                />
              )}

              {activeTab === "agency" && (
                <AgencySettings
                  agency={currentAgency}
                  onUpdateAgency={handleUpdateAgency}
                  onAgencyReset={() => loadAgencyData(currentAgency.id)}
                />
              )}
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Site Footer - Property of RomamiaViagens (No-print, not shown on vouchers) */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-extrabold text-slate-800 tracking-tight">
              Ai<span className="text-sky-600">voucher</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-600">
              Uma propriedade de <strong className="text-slate-900 font-bold">RomamiaViagens®</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Todos os direitos reservados</span>
            <span>•</span>
            <span>Plataforma de Gestão e Emissão de Vouchers Turísticos</span>
          </div>
        </div>
      </footer>

      {/* Agency Team & Operator Licenses Modal */}
      {currentAgency && (
        <AgencyTeamModal
          agency={currentAgency}
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          onRefreshAgency={() => {
            if (currentAgency?.id) loadAgencyData(currentAgency.id);
          }}
        />
      )}
    </div>
  );
}
