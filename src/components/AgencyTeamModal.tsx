import React, { useState, useEffect } from "react";
import { X, UserPlus, Users, Shield, Trash2, Mail, CheckCircle2, AlertTriangle, Sparkles, KeyRound } from "lucide-react";
import { AgencyUser, AgencyProfile, AgencyUserRole } from "../types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AgencyTeamModalProps {
  agency: AgencyProfile;
  isOpen: boolean;
  onClose: () => void;
  onRefreshAgency?: () => void;
}

export const AgencyTeamModal: React.FC<AgencyTeamModalProps> = ({
  agency,
  isOpen,
  onClose,
  onRefreshAgency
}) => {
  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for new user
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AgencyUserRole>("issuer");

  const maxUsers = agency.subscription?.maxUsers || 2;
  const activeCount = users.filter((u) => u.status === "active").length;
  const isLimitReached = activeCount >= maxUsers;
  const usagePercentage = Math.min(100, Math.round((activeCount / maxUsers) * 100));

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agencies/${agency.id}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error loading agency users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, agency.id]);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (isLimitReached) {
      setErrorMessage(
        `Limite de licenças atingido (${activeCount}/${maxUsers}). Faça upgrade de plano ou solicite assentos extras no Master.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/agencies/${agency.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, status: "active" })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Não foi possível adicionar o usuário.");
      } else {
        // Write profile to Firestore explicitly using Client SDK 
        // to inherit auth of current Master/Admin
        try {
          const systemRole = role === "admin" ? "agency_admin" : "agency_user";
          await setDoc(doc(db, "users", data.id), {
            email,
            role: systemRole,
            agencyId: agency.id,
            name,
            createdAt: new Date().toISOString()
          });
        } catch (fbErr) {
          console.error("Failed to write to firestore:", fbErr);
        }

        setSuccessMessage(`Usuário ${name} adicionado com sucesso e convite enviado!`);
        setName("");
        setEmail("");
        setRole("issuer");
        loadUsers();
        if (onRefreshAgency) onRefreshAgency();
      }
    } catch (err) {
      setErrorMessage("Erro de conexão ao salvar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário ${userName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/agencies/${agency.id}/users/${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (onRefreshAgency) onRefreshAgency();
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Equipe & Licenças de Usuários
              </h3>
              <p className="text-xs text-slate-400">
                {agency.name} • Assinatura {agency.subscription?.planName || "Ativa"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* License Usage Gauge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Capacidade de Logins da Assinatura
              </span>
              <span className="text-xs font-extrabold text-sky-700">
                {activeCount} de {maxUsers} usuários ({usagePercentage}%)
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isLimitReached ? "bg-amber-500" : "bg-sky-600"
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Plano: <strong className="text-slate-800">{agency.subscription?.planName || "Profissional"}</strong>
              </span>
              {isLimitReached ? (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Limite máximo atingido
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  {maxUsers - activeCount} {maxUsers - activeCount === 1 ? "vaga disponível" : "vagas disponíveis"}
                </span>
              )}
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Add User Form (Blocked if limit reached) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-sky-600" />
              Adicionar Novo Operador / Usuário
            </h4>

            {isLimitReached ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>
                  Sua agência atingiu o limite de {maxUsers} usuários contratados.
                </span>
                <span className="text-[11px] font-bold text-sky-700 uppercase">
                  Solicite assentos extras
                </span>
              </div>
            ) : (
              <form onSubmit={handleAddUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      E-mail de Login
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@agencia.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Função / Perfil
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as AgencyUserRole)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                    >
                      <option value="issuer">Emissor de Vouchers</option>
                      <option value="agency_admin">Administrador Agência</option>
                      <option value="financial">Financeiro / Faturas</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Criando..." : "Cadastrar Operador"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Current Users List */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Usuários Ativos ({users.length})
            </h4>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Carregando operadores...
              </div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Nenhum usuário cadastrado.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isMaster = u.email === agency.masterLoginEmail || u.name.includes("Master");
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{u.name}</span>
                            {isMaster && (
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-full">
                                Login Master
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-500 capitalize bg-slate-100 px-1.5 py-0.2 rounded">
                              {u.role === "agency_admin"
                                ? "Administrador"
                                : u.role === "issuer"
                                ? "Emissor"
                                : "Financeiro"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isMaster && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover acesso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Cada operador possui login próprio e acesso sincronizado ao banco de vouchers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
