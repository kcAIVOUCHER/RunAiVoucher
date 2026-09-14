import React from "react";
import {
  Plane,
  Building2,
  Calendar,
  Clock,
  Luggage,
  User,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Car,
  Ticket,
  Ship,
  Bus,
  Shield,
  Sparkles,
  Key,
  ShieldAlert,
  Lock
} from "lucide-react";
import { Voucher, AgencyProfile, Company } from "../types";
import {
  formatPassengerDocumentLGPD,
  getProductBoardingRules
} from "../utils/boardingRules";

interface VoucherDocumentProps {
  voucher: Voucher;
  agency: AgencyProfile;
  company?: Company | null;
}

export const VoucherDocument: React.FC<VoucherDocumentProps> = ({
  voucher,
  agency,
  company
}) => {
  const formatCurrency = (val?: number, currency = "BRL") => {
    if (val === undefined || val === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : "BRL"
    }).format(val);
  };

  const getFlightNumberDisplay = (code?: string, num?: string) => {
    if (!num) return code || "";
    if (code && num.toUpperCase().startsWith(code.toUpperCase())) {
      return num;
    }
    return `${code || ""}${num}`;
  };

  return (
    <div
      id="voucher-print-area"
      className="print-voucher-container bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto"
    >
      {/* Top Status & Accent Bar */}
      <div
        className="h-2 w-full print:h-2"
        style={{ backgroundColor: agency.primaryColor || "#0284c7" }}
      />

      <div className="p-4 sm:p-5 md:p-6 space-y-3.5 print:p-2 print:space-y-2.5">
        {/* Header - Compact: Agency Logo, Service/Ref, Company/Status */}
        <header className="border-b border-slate-200 pb-3 print:pb-2">
          <div className="flex flex-col gap-3">
            {company ? (
              <div className="flex items-center justify-between gap-4">
                {/* Logo da Agência */}
                <div className="flex items-center">
                  {agency.logoUrl ? (
                    <div
                      className="voucher-logo-box max-w-[200px] max-h-[150px] flex items-center justify-start overflow-hidden"
                      style={{ maxWidth: "200px", maxHeight: "150px" }}
                    >
                      <img
                        src={agency.logoUrl}
                        alt={agency.name}
                        className="voucher-logo-img max-w-[200px] max-h-[150px] w-auto h-auto object-contain block"
                        style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "contain" }}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-11 px-4 text-white rounded-lg flex items-center justify-center font-black text-base tracking-wide shadow-xs"
                      style={{ backgroundColor: agency.primaryColor || "#0284c7" }}
                    >
                      {agency.name}
                    </div>
                  )}
                </div>

                {/* TIPO DE SERVIÇO NO MEIO (Compacto) */}
                <div className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs shrink-0">
                  {voucher.serviceType === "flight" && "✈️ Bilhete Aéreo"}
                  {voucher.serviceType === "hotel" && "🏨 Hospedagem"}
                  {voucher.serviceType === "car" && "🚗 Locação Carro"}
                  {voucher.serviceType === "insurance" && "🛡️ Seguro"}
                  {voucher.serviceType === "ticket" && "🎟️ Ingresso"}
                  {voucher.serviceType === "cruise" && "🚢 Cruzeiro"}
                  {voucher.serviceType === "package" && "✨ Pacote"}
                </div>

                {/* LADO DIREITO: Logo da Empresa */}
                <div className="flex items-center justify-end">
                  {company.logoUrl ? (
                    <div
                      className="voucher-logo-box max-w-[200px] max-h-[150px] flex items-center justify-end overflow-hidden"
                      style={{ maxWidth: "200px", maxHeight: "150px" }}
                    >
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="voucher-logo-img max-w-[200px] max-h-[150px] w-auto h-auto object-contain block rounded border border-slate-200/80 bg-white shadow-2xs"
                        style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "contain" }}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-10 px-3 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs">
                      {company.tradeName || company.name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {/* Logo da Agência Centralizado */}
                <div className="flex items-center justify-center">
                  {agency.logoUrl ? (
                    <div
                      className="voucher-logo-box max-w-[250px] max-h-[180px] flex items-center justify-center overflow-hidden"
                      style={{ maxWidth: "250px", maxHeight: "180px" }}
                    >
                      <img
                        src={agency.logoUrl}
                        alt={agency.name}
                        className="voucher-logo-img max-w-[250px] max-h-[180px] w-auto h-auto object-contain block"
                        style={{ maxWidth: "250px", maxHeight: "180px", objectFit: "contain" }}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className="h-14 px-6 text-white rounded-xl flex items-center justify-center font-black text-xl tracking-wide shadow-sm"
                      style={{ backgroundColor: agency.primaryColor || "#0284c7" }}
                    >
                      {agency.name}
                    </div>
                  )}
                </div>

                {/* Badges Centralizadas */}
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs shrink-0">
                    {voucher.serviceType === "flight" && "✈️ Bilhete Aéreo"}
                    {voucher.serviceType === "hotel" && "🏨 Hospedagem"}
                    {voucher.serviceType === "car" && "🚗 Locação Carro"}
                    {voucher.serviceType === "insurance" && "🛡️ Seguro"}
                    {voucher.serviceType === "ticket" && "🎟️ Ingresso"}
                    {voucher.serviceType === "cruise" && "🚢 Cruzeiro"}
                    {voucher.serviceType === "package" && "✨ Pacote"}
                  </div>
                  
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border shadow-2xs"
                    style={{
                      borderColor: `${agency.primaryColor || "#0284c7"}40`,
                      backgroundColor: `${agency.primaryColor || "#0284c7"}0d`,
                      color: agency.primaryColor || "#0284c7"
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Voucher Oficial
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* PNR Em destaque */}
          <div className="text-center pt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              PNR: <span className="font-mono" style={{ color: agency.primaryColor || "#0284c7" }}>{voucher.pnr || "PENDENTE"}</span>
            </span>
          </div>
        </header>

        {/* Package Banner if Multi-service / Combo */}
        {(voucher.serviceType === 'package' || voucher.serviceType === 'combo') && (
          <div
            className="p-2.5 rounded-lg text-white flex flex-wrap items-center justify-between gap-2 shadow-xs text-xs"
            style={{ backgroundColor: agency.primaryColor || "#0284c7" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider block opacity-90">
                  Combo de Viagem Integrado
                </span>
                <h2 className="font-extrabold text-xs sm:text-sm leading-tight">
                  Pacote Turístico Completo Consolidado
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              <span>Serviços:</span>
              <div className="flex items-center gap-1 opacity-95">
                {voucher.flights && voucher.flights.length > 0 && <span title="Aéreo"><Plane className="w-3 h-3" /></span>}
                {voucher.hotel && <span title="Hotel"><Building2 className="w-3 h-3" /></span>}
                {voucher.carRental && <span title="Carro"><Car className="w-3 h-3" /></span>}
                {voucher.insurance && <span title="Seguro"><Shield className="w-3 h-3" /></span>}
                {voucher.ticket && <span title="Ingressos"><Ticket className="w-3 h-3" /></span>}
                {voucher.cruise && <span title="Cruzeiro"><Ship className="w-3 h-3" /></span>}
                {voucher.transfer && <span title="Transfer"><Bus className="w-3 h-3" /></span>}
              </div>
            </div>
          </div>
        )}

        {/* Passengers List */}
        <section className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
              <User className="w-3.5 h-3.5" style={{ color: agency.primaryColor || "#0284c7" }} />
              Passageiro(s) / Hóspede(s)
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
              <Lock className="w-2.5 h-2.5 text-emerald-600" />
              Conformidade LGPD
            </span>
          </div>
          <div className="divide-y divide-slate-200/80">
            {voucher.passengers && voucher.passengers.length > 0 ? (
              voucher.passengers.map((p, idx) => {
                const docResult = formatPassengerDocumentLGPD(p.document);
                
                // Calculando idade aproximada para definir ícone
                let icon = "";
                if (p.birthDate) {
                    const [day, month, year] = p.birthDate.split('/').map(Number);
                    const birth = new Date(year, month - 1, day);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    
                    if (age < 2) icon = "👶 ";
                    else if (age < 12) icon = "🧒 ";
                }

                return (
                  <div key={idx} className="py-1.5 first:pt-0 last:pb-0 flex flex-col gap-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {icon}{p.name}{p.birthDate ? ` - Nasc: ${p.birthDate}` : ""}
                      </span>
                      {p.loyaltyNumber && (
                          <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                            Milhas: {p.loyaltyNumber}
                          </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                        {/* Documento sob LGPD: nunca exibe o número do CPF */}
                        {docResult.hasDocument && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium shadow-2xs">
                            <Lock className="w-2.5 h-2.5 text-emerald-600" />
                            {docResult.displayLabel}
                          </span>
                        )}

                        {p.ticketNumber && (
                          <span>
                            Bilhete: <strong className="text-slate-800 font-mono">{p.ticketNumber}</strong>
                          </span>
                        )}
                        {p.seat && (
                          <span className="bg-sky-100 text-sky-900 font-bold px-1.5 py-0.5 rounded text-[10px] border border-sky-200">
                            Assento {p.seat}
                          </span>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 italic">Nenhum passageiro listado.</p>
            )}
          </div>
        </section>

        {/* Flight Itinerary */}
        {(voucher.serviceType === "flight" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.flights && voucher.flights.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide">
                <Plane className="w-4 h-4" style={{ color: agency.primaryColor || "#0284c7" }} />
                Itinerário de Voos
              </div>
              {(() => {
                const n = voucher.flights.length;
                if (n === 0) return null;
                
                const first = voucher.flights[0];
                const last = voucher.flights[n - 1];
                
                let label = null;
                if (first.departureCode === last.arrivalCode && first.arrivalCode === last.departureCode) {
                  label = "Ida e volta";
                } else if (n === 1) {
                  label = "Ida";
                }
                
                return label ? (
                  <span className="text-xs text-slate-500 font-medium">
                    {label}
                  </span>
                ) : null;
              })()}
            </div>

            <div className="space-y-3">
              {voucher.flights.map((flight, idx) => (
                <div
                  key={flight.id || idx}
                  className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-colors shadow-xs"
                >
                  {/* Airline, Flight # and Class/Family Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-900 text-base">
                        {flight.airline}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded text-xs">
                        {getFlightNumberDisplay(flight.airlineCode, flight.flightNumber)}
                      </span>
                      {flight.aircraft && (
                        <span className="text-xs text-slate-400">({flight.aircraft})</span>
                      )}
                    </div>

                    {/* Autonomy: Fare Family and Booking Class visibility */}
                    <div className="flex items-center gap-2 text-xs">
                      {/* Booking Class letter - hidden if hideBookingClass is true */}
                      {!voucher.hideBookingClass && flight.bookingClass && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
                          Classe: {flight.bookingClass}
                        </span>
                      )}

                      {/* Cabin class e.g. Econômica */}
                      {flight.cabinClass && (
                        <span className="text-slate-600 font-medium">
                          {flight.cabinClass}
                        </span>
                      )}

                      {/* Fare Family e.g. Light, Plus, Max - hidden if hideFareFamily is true */}
                      {!voucher.hideFareFamily && flight.fareFamily && (
                        <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
                          Tarifa {flight.fareFamily}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flight Origin & Destination Row - Compact 3-line Format */}
                  <div className="flex flex-col gap-0.5 py-2 text-xs">
                    <div className="font-bold text-sm text-slate-900">
                      {(() => {
                        const clean = (name: string) => name.replace(/Aeroporto (Internacional |Regional |Municipal )?(de |do |da )?/gi, '').replace(/\//g, ' ');
                        return `${clean(flight.departureAirport)} (${flight.departureCode}) ➔ ${clean(flight.arrivalAirport)} (${flight.arrivalCode}) | ${flight.departureTime} às ${flight.arrivalTime}`;
                      })()}
                    </div>
                    <div className="text-slate-600">
                      {flight.departureDate} • Voo {getFlightNumberDisplay(flight.airlineCode, flight.flightNumber)} ({flight.airline}) • Duração: {flight.duration}
                    </div>
                    <div className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                      Bagagem: 🎒 {flight.baggageHand || "Item pessoal + 🧳 Mala de bordo (10kg)"} {typeof flight.baggageChecked === 'string' ? `+ 🧳 ${flight.baggageChecked}` : (flight.baggageChecked ? '+ 🧳 Mala despachada inclusa' : '')}
                    </div>

                    {/* Connection Info */}
                    {idx < voucher.flights.length - 1 &&
                      flight.arrivalCode === voucher.flights[idx + 1].departureCode &&
                      flight.departureDate === voucher.flights[idx + 1].departureDate && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 text-xs text-sky-700 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Conexão em {flight.arrivalAirport}: {(() => {
                            const [h1, m1] = flight.arrivalTime.split(':').map(Number);
                            const [h2, m2] = voucher.flights[idx + 1].departureTime.split(':').map(Number);
                            const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                            const h = Math.floor(diff / 60);
                            const m = diff % 60;
                            return `${h > 0 ? h + 'h ' : ''}${m}m`;
                          })()}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hotel Booking Section */}
        {(voucher.serviceType === "hotel" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.hotel && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: agency.primaryColor || "#0284c7" }} />
                Hospedagem / Hotel
              </div>
              {voucher.hotel.confirmationCode && (
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-mono font-bold">
                  Reserva: {voucher.hotel.confirmationCode}
                </span>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hotel / Pousada</span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {voucher.hotel.hotelName}
                  </h3>
                  {(voucher.hotel.address || voucher.hotel.city) && (
                    <p className="text-xs text-slate-600">
                      {voucher.hotel.address}{voucher.hotel.city ? ` • ${voucher.hotel.city}` : ""}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acomodação</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {voucher.hotel.roomType || "Quarto Padrão"}
                  </span>
                  {voucher.hotel.mealPlan && (
                    <span className="text-xs text-emerald-700 block font-medium">
                      {voucher.hotel.mealPlan}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" /> Check-in (Entrada)
                  </div>
                  <p className="text-slate-800 font-semibold text-sm">
                    {voucher.hotel.checkInDate} {voucher.hotel.checkInTime ? `a partir das ${voucher.hotel.checkInTime}` : "às 14:00"}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" /> Check-out (Saída)
                  </div>
                  <p className="text-slate-800 font-semibold text-sm">
                    {voucher.hotel.checkOutDate} {voucher.hotel.checkOutTime ? `até ${voucher.hotel.checkOutTime}` : "até 12:00"}
                  </p>
                  {voucher.hotel.nights && (
                    <p className="text-[11px] text-slate-500">
                      Duração: <strong>{voucher.hotel.nights} diária(s)</strong>
                    </p>
                  )}
                </div>
              </div>

              {voucher.hotel.notes && (
                <p className="text-[11px] text-slate-500 bg-amber-50/70 p-2 rounded border border-amber-200/50 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {voucher.hotel.notes}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Car Rental Booking Section */}
        {(voucher.serviceType === "car" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.carRental && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" style={{ color: agency.primaryColor || "#0284c7" }} />
                Locação de Veículo / Car Rental
              </div>
              {voucher.carRental.confirmationCode && (
                <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded font-mono font-bold">
                  Reserva: {voucher.carRental.confirmationCode}
                </span>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Locadora Parceira</span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {voucher.carRental.rentalCompany}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categoria Reservada</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {voucher.carRental.carModelOrCategory}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5" /> Retirada (Pick-up)
                  </div>
                  <p className="font-semibold text-slate-900">{voucher.carRental.pickupLocation}</p>
                  <p className="text-slate-600">
                    <strong>Data:</strong> {voucher.carRental.pickupDate} às <strong>{voucher.carRental.pickupTime}</strong>
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5" /> Devolução (Drop-off)
                  </div>
                  <p className="font-semibold text-slate-900">{voucher.carRental.dropoffLocation}</p>
                  <p className="text-slate-600">
                    <strong>Data:</strong> {voucher.carRental.dropoffDate} às <strong>{voucher.carRental.dropoffTime}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Condutor Principal Indicado:</span>
                  <span className="font-bold text-slate-800">{voucher.carRental.driverName}</span>
                  {voucher.carRental.driverDocument && (
                    <span className="text-slate-500 block text-[11px]">CNH / Doc: {voucher.carRental.driverDocument}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Proteções e Franquias Inclusas:</span>
                  <span className="font-semibold text-slate-700">
                    {voucher.carRental.includedCoverage || "Proteção Básica (LDW/CDW) inclusa com KM Livre"}
                  </span>
                </div>
              </div>

              {voucher.carRental.notes && (
                <p className="text-[11px] text-slate-500 bg-amber-50/70 p-2 rounded border border-amber-200/50 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {voucher.carRental.notes}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Travel Insurance Section */}
        {(voucher.serviceType === "insurance" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.insurance && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Seguro Viagem & Assistência Internacional 24h
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-mono font-bold">
                Apólice: {voucher.insurance.policyNumber}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seguradora / Assistência</span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {voucher.insurance.provider} - <span className="font-medium text-slate-600">{voucher.insurance.planName}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Período de Vigência</span>
                  <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                    {voucher.insurance.startDate} até {voucher.insurance.endDate}
                  </span>
                </div>
              </div>

              {/* Coverages Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-emerald-700 text-[10px] font-bold uppercase block">Despesas Médicas (DMH)</span>
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">{voucher.insurance.medicalCoverage}</span>
                </div>

                {voucher.insurance.covidCoverage && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Cobertura COVID-19</span>
                    <span className="font-bold text-slate-800">{voucher.insurance.covidCoverage}</span>
                  </div>
                )}

                {voucher.insurance.baggageCoverage && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 text-[10px] font-bold uppercase block">Bagagem Extraviada</span>
                    <span className="font-bold text-slate-800">{voucher.insurance.baggageCoverage}</span>
                  </div>
                )}
              </div>

              {/* Emergency Hotline Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-900 block">Central de Emergência e Acionamento Médico 24h:</span>
                    <span className="font-mono font-bold text-rose-800 text-sm">{voucher.insurance.emergencyPhone24h}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-1 rounded">
                  Atendimento em Português 24h
                </span>
              </div>

              {voucher.insurance.insuredNames && voucher.insurance.insuredNames.length > 0 && (
                <div className="text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Segurados Cobertos:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {voucher.insurance.insuredNames.map((name, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded font-semibold text-xs">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tickets & Attractions Section */}
        {(voucher.serviceType === "ticket" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.ticket && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                Ingresso / Passeio / Atração Turística
              </div>
              <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded font-mono font-bold">
                Código: {voucher.ticket.ticketNumberOrCode}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parque / Atração</span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {voucher.ticket.attractionName}
                  </h3>
                  {voucher.ticket.supplierOrPark && (
                    <span className="text-xs text-slate-500 font-medium">Fornecedor: {voucher.ticket.supplierOrPark}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Ingresso</span>
                  <span className="font-bold text-purple-800 text-xs sm:text-sm bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                    {voucher.ticket.ticketType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Data & Horário Agendado:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {voucher.ticket.date} {voucher.ticket.time && `às ${voucher.ticket.time}`}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Local de Entrada / Ponto de Encontro:</span>
                  <span className="font-medium text-slate-800">
                    {voucher.ticket.locationOrAddress}
                  </span>
                </div>
              </div>

              {voucher.ticket.importantInstructions && (
                <div className="bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Instruções de Apresentação e Acesso:</strong>
                    <span>{voucher.ticket.importantInstructions}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cruise / Ship Booking Section */}
        {(voucher.serviceType === "cruise" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.cruise && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-600" />
                Cruzeiro Marítimo
              </div>
              <span className="text-xs bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded font-mono font-bold">
                Booking: {voucher.cruise.bookingNumber}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cia Marítima & Navio</span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {voucher.cruise.cruiseLine} • <span className="text-cyan-800">{voucher.cruise.shipName}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cabine & Categoria</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {voucher.cruise.cabinNumber} ({voucher.cruise.cabinCategory})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide block">Porto de Embarque</span>
                  <p className="font-bold text-slate-900">{voucher.cruise.departurePort}</p>
                  <p className="text-slate-600">
                    <strong>Data:</strong> {voucher.cruise.departureDate} • <strong>Horário:</strong> {voucher.cruise.departureTime}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Porto de Desembarque</span>
                  <p className="font-bold text-slate-900">{voucher.cruise.arrivalPort}</p>
                  <p className="text-slate-600">
                    <strong>Data de Chegada:</strong> {voucher.cruise.arrivalDate}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Itinerário & Escalas:</span>
                <p className="font-semibold text-slate-800">{voucher.cruise.itinerarySummary}</p>
                {voucher.cruise.mealPlan && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    <strong>Pacote de Alimentação & Bebidas:</strong> {voucher.cruise.mealPlan}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Transfer Section */}
        {(voucher.serviceType === "transfer" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.transfer && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-indigo-600" />
                Transfer / Transporte Receptivo
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                {voucher.transfer.serviceType}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Origem / Ponto de Coleta:</span>
                  <p className="font-bold text-slate-800">{voucher.transfer.pickupLocation}</p>
                  <p className="text-slate-600">Data/Hora: <strong>{voucher.transfer.pickupDateTime}</strong></p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Destino:</span>
                  <p className="font-bold text-slate-800">{voucher.transfer.dropoffLocation}</p>
                  {voucher.transfer.vehicleType && (
                    <p className="text-slate-500">Veículo: {voucher.transfer.vehicleType}</p>
                  )}
                </div>
              </div>
              {voucher.transfer.contactPhone && (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" /> Contato Receptivo: <strong>{voucher.transfer.contactPhone}</strong>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Pricing / Financial Section (Strict Autonomy Control) */}
        {voucher.priceDisplayMode !== "sem_valor" && (
          <section className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: agency.primaryColor || "#0284c7" }} />
                Resumo Financeiro & Tarifário
              </div>
              <span className="text-xs text-slate-500 font-normal">
                {voucher.priceDisplayMode === "apenas_total" ? "Valor Totalizador" : "RESUMO DA EMISSÃO"}
              </span>
            </div>

            {/* Discriminado */}
            {voucher.priceDisplayMode === "discriminado" && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200/70 text-slate-600">
                  <span>Tarifa Base:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {formatCurrency(voucher.pricing.fare, voucher.pricing.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/70 text-slate-600">
                  <span>Taxas de Embarque / Aeroportuárias:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {formatCurrency(voucher.pricing.taxes, voucher.pricing.currency)}
                  </span>
                </div>
                {voucher.pricing.serviceFee > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/70 text-slate-600">
                    <span>Taxa de Serviço / Agenciamento (DU/RAV):</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(voucher.pricing.serviceFee, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                {voucher.pricing.otherFees > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/70 text-slate-600">
                    <span>Outros Encargos:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {formatCurrency(voucher.pricing.otherFees, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-base font-bold text-slate-900">
                  <span>Valor Total da Emissão:</span>
                  <span
                    className="font-mono text-lg font-extrabold"
                    style={{ color: agency.primaryColor || "#0369a1" }}
                  >
                    {formatCurrency(voucher.pricing.total, voucher.pricing.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Apenas Total */}
            {voucher.priceDisplayMode === "apenas_total" && (
              <div className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">
                  Valor Total Confirmado:
                </span>
                <span
                  className="text-xl font-extrabold font-mono"
                  style={{ color: agency.primaryColor || "#0f172a" }}
                >
                  {formatCurrency(voucher.pricing.total, voucher.pricing.currency)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Dynamic Boarding Rules & Product Instructions */}
        {(() => {
          const productRules = getProductBoardingRules(voucher);
          return (
            <section className="border-t border-slate-200 pt-3 space-y-2 print:pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>ORIENTAÇÕES DE EMBARQUE E UTILIZAÇÃO</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Condições Oficiais
                </span>
              </div>

              {productRules.length > 0 ? (
                <div className="space-y-2">
                  {productRules.map((cat) => (
                    <div key={cat.id} className="text-xs text-slate-700 space-y-1">
                      {productRules.length > 1 && (
                        <div className="font-bold text-[11px] text-slate-800 uppercase tracking-wider mb-0.5">
                          {cat.categoryTitle}
                        </div>
                      )}
                      {cat.rules.map((r, rIdx) => (
                        <p key={rIdx} className="leading-snug">
                          <strong>• {r.label}:</strong> {r.text}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-700 space-y-1">
                  <p><strong>• Documentos:</strong> Apresente documento oficial original com foto (RG/CNH/Passaporte).</p>
                  <p><strong>• Apresentação:</strong> Compareça com a devida antecedência indicada pela operadora do serviço.</p>
                </div>
              )}
            </section>
          );
        })()}

        {/* Footer: Emergency Only & Internal Data */}
        <footer className="border-t border-slate-200 pt-3 text-[11px] text-slate-600 print:pt-2 space-y-2">
          <div className="text-[10px] text-slate-400 text-center">
            Voucher nº {voucher.voucherNumber} • Emissão: {voucher.issueDate} • Status: <span className="text-emerald-700 font-bold">Confirmado</span> • Conforme LGPD, dados sensíveis protegidos.
          </div>
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-md px-3 py-2 text-xs">
            <span className="font-bold text-slate-900">{agency.name} - CNPJ: {agency.cnpj}</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 shrink-0">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Plantão 24h:</span>
              <span className="text-sky-700 font-mono font-bold">{agency.emergencyPhone}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
