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
import {
  Voucher,
  AgencyProfile,
  Company,
  HotelBooking,
  CarRentalBooking,
  InsuranceBooking,
  TicketBooking,
  CruiseBooking,
  TransferBooking
} from "../types";
import {
  formatPassengerDocumentLGPD,
  getProductBoardingRules
} from "../utils/boardingRules";
import { CodeRenderer } from "./CodeRenderer";
import { normalizeHotelsList } from "../utils/hotelSplitter";

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
  const hotelsList: HotelBooking[] = normalizeHotelsList(voucher.hotels, voucher.hotel);

  const carsList: CarRentalBooking[] = (voucher.carRentals && voucher.carRentals.length > 0)
    ? voucher.carRentals
    : (voucher.carRental ? [voucher.carRental] : []);

  const insurancesList: InsuranceBooking[] = (voucher.insurances && voucher.insurances.length > 0)
    ? voucher.insurances
    : (voucher.insurance ? [voucher.insurance] : []);

  const ticketsList: TicketBooking[] = (voucher.tickets && voucher.tickets.length > 0)
    ? voucher.tickets
    : (voucher.ticket ? [voucher.ticket] : (voucher.packageServices?.tickets || []));

  const cruisesList: CruiseBooking[] = (voucher.cruises && voucher.cruises.length > 0)
    ? voucher.cruises
    : (voucher.cruise ? [voucher.cruise] : []);

  const transfersList: TransferBooking[] = (voucher.transfers && voucher.transfers.length > 0)
    ? voucher.transfers
    : (voucher.transfer ? [voucher.transfer] : (voucher.packageServices?.transfers || []));

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
                {hotelsList.length > 0 && <span title="Hotel"><Building2 className="w-3 h-3" /></span>}
                {carsList.length > 0 && <span title="Carro"><Car className="w-3 h-3" /></span>}
                {insurancesList.length > 0 && <span title="Seguro"><Shield className="w-3 h-3" /></span>}
                {ticketsList.length > 0 && <span title="Ingressos"><Ticket className="w-3 h-3" /></span>}
                {cruisesList.length > 0 && <span title="Cruzeiro"><Ship className="w-3 h-3" /></span>}
                {transfersList.length > 0 && <span title="Transfer"><Bus className="w-3 h-3" /></span>}
              </div>
            </div>
          </div>
        )}

        {/* Global QR Code / Barcode (Replicated from uploaded voucher document) */}
        {(voucher.qrCodeData || voucher.barcodeData || voucher.codeImageBase64) && (
          <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs">
            <CodeRenderer
              qrCodeData={voucher.qrCodeData}
              barcodeData={voucher.barcodeData}
              barcodeType={voucher.barcodeType}
              codeImageBase64={voucher.codeImageBase64}
              title="Código de Autenticação / Leitura Digital do Voucher"
            />
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
        {voucher.flights && voucher.flights.length > 0 && (
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

        {/* Hotel Bookings Section (Multi-Block Support) */}
        {hotelsList.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: agency.primaryColor || "#0284c7" }} />
                {hotelsList.length > 1 ? `Hospedagens / Hotéis (${hotelsList.length} Reservas Distintas)` : "Hospedagem / Hotel"}
              </div>
            </div>

            <div className="space-y-3">
              {hotelsList.map((hotel, index) => (
                <div
                  key={hotel.id || index}
                  className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  {/* Linha 1: Hotel Name + Período + Código de Reserva na frente */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-extrabold text-white shrink-0"
                        style={{ backgroundColor: agency.primaryColor || "#0284c7" }}
                      >
                        {hotelsList.length > 1 ? `Hotel #${index + 1}` : "Hotel"}
                      </span>
                      <span className="text-slate-900 font-extrabold text-base">
                        {hotel.hotelName}
                      </span>
                      {(hotel.checkInDate || hotel.checkOutDate) && (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          Período: {hotel.checkInDate} a {hotel.checkOutDate} {hotel.nights ? `(${hotel.nights} diária${hotel.nights > 1 ? 's' : ''})` : ""}
                        </span>
                      )}
                    </div>
                    {hotel.confirmationCode && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-mono font-bold shrink-0">
                        Código de Reserva: {hotel.confirmationCode}
                      </span>
                    )}
                  </div>

                  {/* Linha 2: Endereço do Hotel logo abaixo */}
                  {(hotel.address || hotel.city) && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700">Endereço:</span>
                      <span>{hotel.address}{hotel.city ? ` • ${hotel.city}` : ""}</span>
                    </p>
                  )}

                  {/* Linha 3: Informações de Quarto, Regime e Horários */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Acomodação / Quarto</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {hotel.roomCategory || hotel.roomType || "Quarto Padrão"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Regime de Alimentação</span>
                      <span className="font-semibold text-emerald-700 text-xs">
                        {hotel.mealPlan || "Conforme contratado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Horários de Check-in / Out</span>
                      <span className="text-slate-700 font-medium text-xs">
                        In: {hotel.checkInTime || "14:00"} | Out: {hotel.checkOutTime || "12:00"}
                      </span>
                    </div>
                  </div>

                    {hotel.guestsNames && hotel.guestsNames.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                          Hóspedes Registrados neste Quarto:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {hotel.guestsNames.map((guest: string, i: number) => (
                            <span key={i} className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded font-medium text-xs">
                              👤 {guest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code / Barcode replication */}
                    {(hotel.qrCodeData || hotel.barcodeData || hotel.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100">
                        <CodeRenderer
                          qrCodeData={hotel.qrCodeData}
                          barcodeData={hotel.barcodeData}
                          barcodeType={hotel.barcodeType}
                          codeImageBase64={hotel.codeImageBase64}
                          title={`Validação Digital - ${hotel.hotelName}`}
                          compact={true}
                        />
                      </div>
                    )}

                    {hotel.notes && (
                      <p className="text-[11px] text-slate-500 bg-amber-50/70 p-2 rounded border border-amber-200/50 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {hotel.notes}
                      </p>
                    )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Car Rental Bookings Section (Multi-Block Support) */}
        {carsList.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" style={{ color: agency.primaryColor || "#0284c7" }} />
                {carsList.length > 1 ? `Locações de Veículos (${carsList.length} Contratos)` : "Locação de Veículo / Car Rental"}
              </div>
            </div>

            <div className="space-y-3">
              {carsList.map((car, index) => (
                <div
                  key={car.id || index}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-extrabold text-white"
                        style={{ backgroundColor: agency.primaryColor || "#0284c7" }}
                      >
                        {carsList.length > 1 ? `Carro #${index + 1}` : "Carro"}
                      </span>
                      <span className="text-slate-900 font-extrabold text-base">
                        {car.rentalCompany} • {car.carModel || car.carCategory || car.carModelOrCategory}
                      </span>
                    </div>
                    {car.confirmationCode && (
                      <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded font-mono font-bold">
                        Reserva: {car.confirmationCode}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                          <MapPin className="w-3.5 h-3.5" /> Retirada (Pick-up)
                        </div>
                        <p className="font-semibold text-slate-900">{car.pickupLocation}</p>
                        <p className="text-slate-600">
                          <strong>Data:</strong> {car.pickupDate} às <strong>{car.pickupTime}</strong>
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 uppercase tracking-wide">
                          <MapPin className="w-3.5 h-3.5" /> Devolução (Drop-off)
                        </div>
                        <p className="font-semibold text-slate-900">{car.dropoffLocation}</p>
                        <p className="text-slate-600">
                          <strong>Data:</strong> {car.dropoffDate} às <strong>{car.dropoffTime}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Condutor Principal Indicado:</span>
                        <span className="font-bold text-slate-800">{car.driverName}</span>
                        {car.driverDocument && (
                          <span className="text-slate-500 block text-[11px]">CNH / Doc: {car.driverDocument}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Proteções e Franquias Inclusas:</span>
                        <span className="font-semibold text-slate-700">
                          {car.includedCoverage || "Proteção Básica (LDW/CDW) inclusa com KM Livre"}
                        </span>
                      </div>
                    </div>

                    {/* QR Code / Barcode replication */}
                    {(car.qrCodeData || car.barcodeData || car.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100">
                        <CodeRenderer
                          qrCodeData={car.qrCodeData}
                          barcodeData={car.barcodeData}
                          barcodeType={car.barcodeType}
                          codeImageBase64={car.codeImageBase64}
                          title={`Validação da Locação - ${car.rentalCompany}`}
                          compact={true}
                        />
                      </div>
                    )}

                    {car.notes && (
                      <p className="text-[11px] text-slate-500 bg-amber-50/70 p-2 rounded border border-amber-200/50 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {car.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Travel Insurance Section (Multi-Block Support) */}
        {insurancesList.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                {insurancesList.length > 1 ? `Seguros Viagem & Assistências (${insurancesList.length} Apólices)` : "Seguro Viagem & Assistência Internacional 24h"}
              </div>
            </div>

            <div className="space-y-3">
              {insurancesList.map((insurance, index) => (
                <div
                  key={insurance.id || index}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-extrabold">
                        {insurancesList.length > 1 ? `Apólice #${index + 1}` : "Apólice"}
                      </span>
                      <span className="text-slate-900 font-extrabold text-base">
                        {insurance.provider} - {insurance.planName}
                      </span>
                    </div>
                    {insurance.policyNumber && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-mono font-bold">
                        Apólice: {insurance.policyNumber}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seguradora / Assistência</span>
                        <h3 className="font-extrabold text-base text-slate-900">
                          {insurance.provider} - <span className="font-medium text-slate-600">{insurance.planName}</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Período de Vigência</span>
                        <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                          {insurance.startDate} até {insurance.endDate}
                        </span>
                      </div>
                    </div>

                    {/* Coverages Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                        <span className="text-emerald-700 text-[10px] font-bold uppercase block">Despesas Médicas (DMH)</span>
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">{insurance.medicalCoverage}</span>
                      </div>

                      {insurance.covidCoverage && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-500 text-[10px] font-bold uppercase block">Cobertura COVID-19</span>
                          <span className="font-bold text-slate-800">{insurance.covidCoverage}</span>
                        </div>
                      )}

                      {insurance.baggageCoverage && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-slate-500 text-[10px] font-bold uppercase block">Bagagem Extraviada</span>
                          <span className="font-bold text-slate-800">{insurance.baggageCoverage}</span>
                        </div>
                      )}
                    </div>

                    {/* Emergency Hotline Banner */}
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold text-rose-900 block">Central de Emergência e Acionamento Médico 24h:</span>
                          <span className="font-mono font-bold text-rose-800 text-sm">{insurance.emergencyPhone24h}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-1 rounded">
                        Atendimento em Português 24h
                      </span>
                    </div>

                    {insurance.insuredNames && insurance.insuredNames.length > 0 && (
                      <div className="text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Segurados Cobertos:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {insurance.insuredNames.map((name, i) => (
                            <span key={i} className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded font-semibold text-xs">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code / Barcode replication */}
                    {(insurance.qrCodeData || insurance.barcodeData || insurance.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100">
                        <CodeRenderer
                          qrCodeData={insurance.qrCodeData}
                          barcodeData={insurance.barcodeData}
                          barcodeType={insurance.barcodeType}
                          codeImageBase64={insurance.codeImageBase64}
                          title={`Validação da Apólice - ${insurance.provider}`}
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tickets & Attractions Section (Multi-Block Support) */}
        {ticketsList.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                {ticketsList.length > 1 ? `Ingressos & Atrações (${ticketsList.length} Itens)` : "Ingresso / Passeio / Atração Turística"}
              </div>
            </div>

            <div className="space-y-3">
              {ticketsList.map((ticket, index) => (
                <div
                  key={ticket.id || index}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-extrabold">
                        {ticketsList.length > 1 ? `Ingresso #${index + 1}` : "Ingresso"}
                      </span>
                      <span className="text-slate-900 font-extrabold text-base">
                        {ticket.attractionName}
                      </span>
                    </div>
                    {ticket.ticketNumberOrCode && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded font-mono font-bold">
                        Código: {ticket.ticketNumberOrCode}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        {ticket.supplierOrPark && (
                          <span className="text-xs text-slate-500 font-medium">Fornecedor / Parque: {ticket.supplierOrPark}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Ingresso</span>
                        <span className="font-bold text-purple-800 text-xs sm:text-sm bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                          {ticket.ticketType}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Data & Horário Agendado:</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {ticket.date} {ticket.time && `às ${ticket.time}`}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Local de Entrada / Ponto de Encontro:</span>
                        <span className="font-medium text-slate-800">
                          {ticket.locationOrAddress}
                        </span>
                      </div>
                    </div>

                    {ticket.importantInstructions && (
                      <div className="bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">Instruções de Apresentação e Acesso:</strong>
                          <span>{ticket.importantInstructions}</span>
                        </div>
                      </div>
                    )}

                    {/* QR Code / Barcode replication */}
                    {(ticket.qrCodeData || ticket.barcodeData || ticket.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100">
                        <CodeRenderer
                          qrCodeData={ticket.qrCodeData}
                          barcodeData={ticket.barcodeData}
                          barcodeType={ticket.barcodeType}
                          codeImageBase64={ticket.codeImageBase64}
                          title={`Acesso / Catraca - ${ticket.attractionName}`}
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cruise / Ship Booking Section (Multi-Block Support) */}
        {cruisesList.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-600" />
                {cruisesList.length > 1 ? `Cruzeiros Marítimos (${cruisesList.length} Viagens)` : "Cruzeiro Marítimo"}
              </div>
            </div>

            <div className="space-y-3">
              {cruisesList.map((cruise, index) => (
                <div
                  key={cruise.id || index}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-cyan-600 text-white px-2.5 py-0.5 rounded-full font-extrabold">
                        {cruisesList.length > 1 ? `Cruzeiro #${index + 1}` : "Cruzeiro"}
                      </span>
                      <span className="text-slate-900 font-extrabold text-base">
                        {cruise.cruiseLine} • {cruise.shipName}
                      </span>
                    </div>
                    {cruise.bookingNumber && (
                      <span className="text-xs bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded font-mono font-bold">
                        Booking: {cruise.bookingNumber}
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cia Marítima & Navio</span>
                        <h3 className="font-extrabold text-base text-slate-900">
                          {cruise.cruiseLine} • <span className="text-cyan-800">{cruise.shipName}</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cabine & Categoria</span>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {cruise.cabinNumber} ({cruise.cabinCategory})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wide block">Porto de Embarque</span>
                        <p className="font-bold text-slate-900">{cruise.departurePort}</p>
                        <p className="text-slate-600">
                          <strong>Data:</strong> {cruise.departureDate} • <strong>Horário:</strong> {cruise.departureTime}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Porto de Desembarque</span>
                        <p className="font-bold text-slate-900">{cruise.arrivalPort}</p>
                        <p className="text-slate-600">
                          <strong>Data de Chegada:</strong> {cruise.arrivalDate}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Itinerário & Escalas:</span>
                      <p className="font-semibold text-slate-800">{cruise.itinerarySummary}</p>
                      {cruise.mealPlan && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          <strong>Pacote de Alimentação & Bebidas:</strong> {cruise.mealPlan}
                        </p>
                      )}
                    </div>

                    {/* QR Code / Barcode replication */}
                    {(cruise.qrCodeData || cruise.barcodeData || cruise.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100">
                        <CodeRenderer
                          qrCodeData={cruise.qrCodeData}
                          barcodeData={cruise.barcodeData}
                          barcodeType={cruise.barcodeType}
                          codeImageBase64={cruise.codeImageBase64}
                          title={`Cartão de Embarque - ${cruise.shipName}`}
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transfer Section (Multi-Block Support) */}
        {transfersList.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between text-slate-800 font-bold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-indigo-600" />
                {transfersList.length > 1 ? `Transfers & Traslados (${transfersList.length} Trechos)` : "Transfer / Transporte Receptivo"}
              </div>
            </div>

            <div className="space-y-3">
              {transfersList.map((transfer, index) => (
                <div
                  key={transfer.id || index}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-800 font-bold text-sm uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-extrabold">
                        {transfersList.length > 1 ? `Transfer #${index + 1}` : "Transfer"}
                      </span>
                      <span className="text-slate-900 font-extrabold text-base">
                        {transfer.serviceType || "Transporte Receptivo"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Origem / Ponto de Coleta:</span>
                        <p className="font-bold text-slate-800">{transfer.pickupLocation}</p>
                        <p className="text-slate-600">Data/Hora: <strong>{transfer.pickupDateTime}</strong></p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Destino:</span>
                        <p className="font-bold text-slate-800">{transfer.dropoffLocation}</p>
                        {transfer.vehicleType && (
                          <p className="text-slate-500">Veículo: {transfer.vehicleType}</p>
                        )}
                      </div>
                    </div>
                    {transfer.contactPhone && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" /> Contato Receptivo: <strong>{transfer.contactPhone}</strong>
                      </p>
                    )}

                    {/* QR Code / Barcode replication */}
                    {(transfer.qrCodeData || transfer.barcodeData || transfer.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100">
                        <CodeRenderer
                          qrCodeData={transfer.qrCodeData}
                          barcodeData={transfer.barcodeData}
                          barcodeType={transfer.barcodeType}
                          codeImageBase64={transfer.codeImageBase64}
                          title="Localizador Receptivo"
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
