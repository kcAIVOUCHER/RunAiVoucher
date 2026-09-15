import React, { useState } from "react";
import {
  FileText,
  Search,
  Printer,
  Download,
  Trash2,
  Calendar,
  Building2,
  Share2,
  ExternalLink,
  CheckCircle2,
  Eye,
  CreditCard
} from "lucide-react";
import { Voucher, Company } from "../types";

interface VoucherHistoryProps {
  vouchers: Voucher[];
  companies: Company[];
  onSelectVoucher: (voucher: Voucher) => void;
  onDeleteVoucher: (id: string) => Promise<void>;
}

export const VoucherHistory: React.FC<VoucherHistoryProps> = ({
  vouchers,
  companies,
  onSelectVoucher,
  onDeleteVoucher
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatCurrency = (val: number, currency = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "BRL"
    }).format(val || 0);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.passengers.some((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.companyName && v.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCompany =
      selectedCompanyFilter === "all" ||
      (selectedCompanyFilter === "none" && !v.companyId) ||
      v.companyId === selectedCompanyFilter;

    return matchesSearch && matchesCompany;
  });

  const handleCopyWhatsApp = (voucher: Voucher) => {
    const paxNames = voucher.passengers.map((p) => p.name).join(", ");
    const flightDetails = voucher.flights
      .map(
        (f) =>
          `✈️ *${f.airline} (${f.flightNumber})*: ${f.departureCode} (${f.departureTime}) ➔ ${f.arrivalCode} (${f.arrivalTime}) em ${f.departureDate}`
      )
      .join("\n");

    const text = `🎫 *VOUCHER DE VIAGEM CONFIRMADO*\n` +
      `*Localizador (PNR):* ${voucher.pnr}\n` +
      `*Passageiro(s):* ${paxNames}\n\n` +
      `*Itinerário:*\n${flightDetails}\n\n` +
      (voucher.priceDisplayMode !== "sem_valor" && voucher.pricing.total > 0
        ? `*Valor Total:* ${formatCurrency(voucher.pricing.total, voucher.pricing.currency)}\n\n`
        : "") +
      `Bom voo e conte sempre com nosso atendimento!`;

    navigator.clipboard.writeText(text);
    setCopiedId(voucher.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Histórico de Vouchers Emitidos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consulte, reemita, imprima em PDF ou compartilhe os vouchers emitidos para seus clientes.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          Total: <strong className="text-slate-900">{vouchers.length}</strong> vouchers registrados
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Localizador (PNR), nome de passageiro, voucher ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-slate-700 text-xs font-medium cursor-pointer"
          >
            <option value="all">Todas as Empresas</option>
            <option value="none">Sem empresa vinculada (Pessoa Física)</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.tradeName || comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vouchers Table / Cards */}
      {filteredVouchers.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">Nenhum voucher encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedCompanyFilter !== "all"
              ? "Tente ajustar os termos de busca ou filtros aplicados."
              : "Emita seu primeiro voucher na aba 'Emitir Voucher' através da leitura com IA."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-sm transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs"
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-sm bg-slate-900 text-sky-400 px-2.5 py-0.5 rounded tracking-wider">
                    {voucher.pnr}
                  </span>
                  <span className="font-bold text-slate-700 text-sm">
                    {voucher.voucherNumber}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {voucher.issueDate}
                  </span>

                  {voucher.companyName ? (
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                      <Building2 className="w-3 h-3" /> {voucher.companyName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Pessoa Física / Direto
                    </span>
                  )}

                  {/* Pricing badge */}
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${
                      voucher.priceDisplayMode === "sem_valor"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : voucher.priceDisplayMode === "apenas_total"
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {voucher.priceDisplayMode === "sem_valor" && "Sem Valor"}
                    {voucher.priceDisplayMode === "apenas_total" && `Total: ${formatCurrency(voucher.pricing.total, voucher.pricing.currency)}`}
                    {voucher.priceDisplayMode === "discriminado" && `Discriminado (${formatCurrency(voucher.pricing.total, voucher.pricing.currency)})`}
                  </span>
                </div>

                {/* Passenger names */}
                <div className="text-slate-800 font-semibold text-xs">
                  Passageiro(s):{" "}
                  <span className="font-normal text-slate-600">
                    {voucher.passengers.map((p) => p.name).join(" • ")}
                  </span>
                </div>

                {/* Flights summary */}
                <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                  {voucher.flights.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      ✈️ {f.airline} ({f.flightNumber}): {f.departureCode} ➔ {f.arrivalCode} ({f.departureDate})
                    </span>
                  ))}
                  {voucher.hotel && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      🏨 {voucher.hotel.hotelName} ({voucher.hotel.checkInDate} a {voucher.hotel.checkOutDate})
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0">
                <button
                  onClick={() => handleCopyWhatsApp(voucher)}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold flex items-center gap-1.5 transition-colors text-xs shrink-0"
                  title="Copiar texto pronto para envio no WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {copiedId === voucher.id ? "Copiado!" : "WhatsApp"}
                </button>

                <button
                  onClick={() => onSelectVoucher(voucher)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors text-xs shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Ver / Baixar PDF
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Deseja remover o voucher ${voucher.voucherNumber} (PNR: ${voucher.pnr}) do histórico?`)) {
                      onDeleteVoucher(voucher.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Excluir voucher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
