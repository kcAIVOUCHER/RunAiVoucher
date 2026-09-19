import React from "react";
import {
  Plane,
  Building2,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Phone,
  MapPin,
  CreditCard,
  Car,
  Ticket,
  Ship,
  Bus,
  Shield
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
import { formatDateBR } from "../utils/dateFormatter";

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

  const carsList: CarRentalBooking[] =
    voucher.carRentals && voucher.carRentals.length > 0
      ? voucher.carRentals
      : voucher.carRental
      ? [voucher.carRental]
      : [];

  const insurancesList: InsuranceBooking[] =
    voucher.insurances && voucher.insurances.length > 0
      ? voucher.insurances
      : voucher.insurance
      ? [voucher.insurance]
      : [];

  const ticketsList: TicketBooking[] =
    voucher.tickets && voucher.tickets.length > 0
      ? voucher.tickets
      : voucher.ticket
      ? [voucher.ticket]
      : voucher.packageServices?.tickets || [];

  const cruisesList: CruiseBooking[] =
    voucher.cruises && voucher.cruises.length > 0
      ? voucher.cruises
      : voucher.cruise
      ? [voucher.cruise]
      : [];

  const transfersList: TransferBooking[] =
    voucher.transfers && voucher.transfers.length > 0
      ? voucher.transfers
      : voucher.transfer
      ? [voucher.transfer]
      : voucher.packageServices?.transfers || [];

  const primaryColor = agency.primaryColor || "#0284c7";

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

  const productRules = getProductBoardingRules(voucher);

  return (
    <div
      id="voucher-print-area"
      className="print-voucher-container bg-white text-slate-900 border border-slate-200 shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto"
    >
      {/* Barra superior de destaque com cor primária */}
      <div
        className="h-2 w-full print:h-2"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="p-6 md:p-8 space-y-5 print:p-4 print:space-y-4">
        {/* CABEÇALHO EXECUTIVO DESPOLUÍDO */}
        <header className="border-b border-slate-200 pb-4 print:pb-3">
          {company ? (
            /* Cabeçalho Corporativo: Logo Agência | Título Central | Logo Empresa */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                {/* Logo Agência */}
                <div className="max-w-[200px] max-h-[65px] flex items-center">
                  {agency.logoUrl ? (
                    <img
                      src={agency.logoUrl}
                      alt={agency.name}
                      className="max-w-[190px] max-h-[60px] w-auto h-auto object-contain block"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="h-10 px-4 text-white rounded-lg flex items-center justify-center font-extrabold text-sm tracking-wide"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {agency.tradeName || agency.name}
                    </div>
                  )}
                </div>

                {/* Título de Serviço Central */}
                <div className="text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {voucher.serviceType === "flight" && "Bilhete Aéreo"}
                    {voucher.serviceType === "hotel" && "Hospedagem & Hotel"}
                    {voucher.serviceType === "car" && "Locação de Veículo"}
                    {voucher.serviceType === "insurance" && "Seguro Viagem"}
                    {voucher.serviceType === "ticket" && "Ingresso & Passeio"}
                    {voucher.serviceType === "cruise" && "Cruzeiro Marítimo"}
                    {voucher.serviceType === "package" && "Pacote Turístico"}
                    {voucher.serviceType === "transfer" && "Transfer & Receptivo"}
                  </span>
                  <h1 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Comprovante de Reserva
                  </h1>
                </div>

                {/* Logo Empresa Cliente */}
                <div className="max-w-[200px] max-h-[65px] flex items-center justify-end">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="max-w-[180px] max-h-[55px] w-auto h-auto object-contain block"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-9 px-3 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-xs">
                      {company.tradeName || company.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Faixa PNR Corporativa */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                <span className="text-slate-500 font-medium">
                  Comprovante nº {voucher.voucherNumber} • Emissão: {formatDateBR(voucher.issueDate)}
                </span>
                <span className="font-extrabold text-slate-900">
                  PNR:{" "}
                  <span className="font-mono text-sm font-black" style={{ color: primaryColor }}>
                    {voucher.pnr || "PENDENTE"}
                  </span>
                </span>
              </div>
            </div>
          ) : (
            /* Cabeçalho Agência Individual: Logo à Esquerda | PNR e Emissão à Direita */
            <div className="flex items-center justify-between gap-4">
              <div className="max-h-[65px] flex items-center">
                {agency.logoUrl ? (
                  <img
                    src={agency.logoUrl}
                    alt={agency.name}
                    className="max-w-[220px] max-h-[60px] w-auto h-auto object-contain block"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="h-11 px-5 text-white rounded-lg flex items-center justify-center font-extrabold text-base tracking-wide"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {agency.tradeName || agency.name}
                  </div>
                )}
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  PNR:{" "}
                  <span className="font-mono font-black" style={{ color: primaryColor }}>
                    {voucher.pnr || "PENDENTE"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Voucher nº {voucher.voucherNumber} • Emissão: {formatDateBR(voucher.issueDate) || new Date().toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* SEÇÃO PASSAGEIROS / HÓSPEDES - PADRÃO INSTITUCIONAL DMZ */}
        <section className="pdf-section space-y-2" data-pdf-section="passenger">
          {/* Cabeçalho da Seção Separado */}
          <div className="pdf-section-header flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider" data-pdf-section-header="true">
            <User className="w-4 h-4" style={{ color: primaryColor }} />
            <span>{(voucher.passengers?.length || 0) <= 1 ? "PASSAGEIRO / HÓSPEDE" : "PASSAGEIROS / HÓSPEDES"}</span>
          </div>

          {/* Card Independente com os Nomes */}
          <div className="pdf-cards-container space-y-3">
            <div className="pdf-block-avoid pdf-card border border-slate-200 rounded-lg p-4 bg-white divide-y divide-slate-100 shadow-2xs" data-pdf-block="true">
              {voucher.passengers && voucher.passengers.length > 0 ? (
                voucher.passengers.map((p, idx) => {
                  const docResult = formatPassengerDocumentLGPD(p.document);
                  return (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      {/* Nome do Viajante em Destaque Alto */}
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm md:text-base">
                          {p.name}
                        </span>
                        {p.birthDate && (
                          <span className="text-xs text-slate-500 ml-2">
                            (Nasc: {formatDateBR(p.birthDate)})
                          </span>
                        )}
                      </div>

                      {/* Metadados do Passageiro de Forma Discreta */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {p.seat && (
                          <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            Assento {p.seat}
                          </span>
                        )}
                        {p.ticketNumber && (
                          <span>
                            Bilhete: <strong className="font-mono text-slate-900">{p.ticketNumber}</strong>
                          </span>
                        )}
                        {p.loyaltyNumber && (
                          <span className="font-mono text-slate-500">
                            Fidelidade: {p.loyaltyNumber}
                          </span>
                        )}
                        {docResult.hasDocument && (
                          <span className="font-mono text-slate-500">
                            {docResult.displayLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 italic py-1">Nenhum passageiro listado.</p>
              )}
            </div>
          </div>
        </section>

        {/* SEÇÃO TRANSPORTE AÉREO */}
        {voucher.flights && voucher.flights.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Plane className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Transporte Aéreo</span>
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
                  label = "Trecho único";
                }
                return label ? <span className="text-xs text-slate-500 font-semibold">{label}</span> : null;
              })()}
            </div>

            <div className="space-y-3">
              {voucher.flights.map((flight, idx) => {
                const flightNum = getFlightNumberDisplay(flight.airlineCode, flight.flightNumber);
                return (
                  <div
                    key={flight.id || idx}
                    className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-white space-y-3 hover:border-slate-300 transition-colors shadow-2xs"
                    data-pdf-block="true"
                  >
                    {/* Linha 1: Cia Aérea, Voo e Data */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-sm">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-extrabold text-slate-900 text-base">{flight.airline}</span>
                        <span className="font-mono font-black text-sm" style={{ color: primaryColor }}>
                          {flightNum}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {formatDateBR(flight.departureDate)}
                        </span>
                      </div>

                      {(flight as any).locator && (
                        <div className="text-xs text-slate-600">
                          Localizador: <strong className="font-mono text-slate-900 text-sm">{(flight as any).locator}</strong>
                        </div>
                      )}
                    </div>

                    {/* Linha 2: Rota Executiva (Origem -> Duração -> Destino) */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-xs">
                      {/* Origem */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Origem
                        </span>
                        <span className="text-lg font-black text-slate-900 block leading-tight">
                          {flight.departureCode || "---"}
                        </span>
                        <span className="text-xs font-bold text-slate-900 block">
                          {flight.departureTime || "--:--"}
                        </span>
                        <span className="text-[11px] text-slate-600 block max-w-[180px] truncate">
                          {flight.departureAirport || flight.departureCity}
                          {flight.departureTerminal ? ` • T${flight.departureTerminal}` : ""}
                        </span>
                      </div>

                      {/* Indicador de Rota Central */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {flight.duration || "Voo Direto"}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-8 sm:w-12 h-px bg-slate-300" />
                          <Plane className="w-3.5 h-3.5 rotate-90" style={{ color: primaryColor }} />
                          <div className="w-8 sm:w-12 h-px bg-slate-300" />
                        </div>
                      </div>

                      {/* Destino */}
                      <div className="space-y-0.5 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Destino
                        </span>
                        <span className="text-lg font-black text-slate-900 block leading-tight">
                          {flight.arrivalCode || "---"}
                        </span>
                        <span className="text-xs font-bold text-slate-900 block">
                          {flight.arrivalTime || "--:--"}
                        </span>
                        <span className="text-[11px] text-slate-600 block max-w-[180px] truncate">
                          {flight.arrivalAirport || flight.arrivalCity}
                          {flight.arrivalTerminal ? ` • T${flight.arrivalTerminal}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Linha 3: Bagagens e Classes (Respeito Estrito às Regras do Cliente) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Bagagem:</span>
                        <span>{flight.baggageHand || "Mão 10kg inclusa"}</span>
                        {flight.baggageChecked && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-sky-800">{flight.baggageChecked}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] text-slate-500">
                        {flight.cabinClass && <span>Cabine: {flight.cabinClass}</span>}
                        {!voucher.hideBookingClass && (
                          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded font-mono font-bold text-[11px]">
                            Classe: {flight.bookingClass || "Y"}
                          </span>
                        )}
                        {!voucher.hideFareFamily && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold text-[11px]">
                            Tarifa {flight.fareFamily || "Plus"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* QR Code / Código de barras se disponível no comprovante */}
                    {(flight.qrCodeData || flight.barcodeData || flight.codeImageBase64) && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <CodeRenderer
                          qrCodeData={flight.qrCodeData}
                          barcodeData={flight.barcodeData}
                          barcodeType={flight.barcodeType}
                          codeImageBase64={flight.codeImageBase64}
                          title={`Cartão de Embarque - ${flightNum}`}
                          compact={true}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SEÇÃO HOSPEDAGEM / HOTEL */}
        {hotelsList.length > 0 && (
          <section className="pdf-section space-y-3" data-pdf-section="hotel">
            <div className="pdf-section-header flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider" data-pdf-section-header="true">
              <span className="text-base">🏨</span>
              <span>HOSPEDAGEM</span>
            </div>

            <div className="pdf-cards-container space-y-3">
              {hotelsList.map((hotel, index) => (
                <div
                  key={hotel.id || index}
                  className="pdf-block-avoid pdf-card border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs"
                  data-pdf-block="true"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {hotel.hotelName}
                      </h3>
                      {(hotel.checkInDate || hotel.checkOutDate) && (
                        <span className="text-xs font-medium text-slate-600">
                          {formatDateBR(hotel.checkInDate)} até {formatDateBR(hotel.checkOutDate)} {hotel.nights ? `(${hotel.nights} diária${hotel.nights > 1 ? 's' : ''})` : ""}
                        </span>
                      )}
                    </div>
                    {hotel.confirmationCode && (
                      <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded font-mono">
                        Reserva: <strong className="text-slate-900">{hotel.confirmationCode}</strong>
                      </div>
                    )}
                  </div>

                  {(hotel.address || hotel.city) && (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hotel.address}{hotel.city ? ` • ${hotel.city}` : ""}</span>
                      {(hotel as any).phone && <span>• Tel: {(hotel as any).phone}</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Acomodação</span>
                      <span className="font-bold text-slate-900">
                        {hotel.roomCategory || hotel.roomType || "Quarto Standard"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Regime</span>
                      <span className="font-semibold text-slate-800">
                        {hotel.mealPlan || "Conforme contratado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-in / Out</span>
                      <span className="text-slate-700">
                        In: {hotel.checkInTime || "14:00"} • Out: {hotel.checkOutTime || "12:00"}
                      </span>
                    </div>
                  </div>

                  {hotel.guestsNames && hotel.guestsNames.length > 0 && (
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-700 mr-2">Hóspedes:</span>
                      {hotel.guestsNames.join(", ")}
                    </div>
                  )}

                  {(hotel.qrCodeData || hotel.barcodeData || hotel.codeImageBase64) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <CodeRenderer
                        qrCodeData={hotel.qrCodeData}
                        barcodeData={hotel.barcodeData}
                        barcodeType={hotel.barcodeType}
                        codeImageBase64={hotel.codeImageBase64}
                        title={`Confirmação Hotel - ${hotel.hotelName}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO LOCAÇÃO DE VEÍCULOS */}
        {carsList.length > 0 && (
          <section className="pdf-section space-y-3" data-pdf-section="car">
            <div className="pdf-section-header flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider" data-pdf-section-header="true">
              <span className="text-base">🚗</span>
              <span>LOCAÇÃO DE VEÍCULOS</span>
            </div>

            <div className="pdf-cards-container space-y-3">
              {carsList.map((car, index) => (
                <div
                  key={car.id || index}
                  className="pdf-block-avoid pdf-card border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs"
                  data-pdf-block="true"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {car.rentalCompany} • {car.carModel || car.carCategory || car.carModelOrCategory}
                    </h3>
                    {car.confirmationCode && (
                      <span className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                        Reserva: {car.confirmationCode}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Retirada</span>
                      <p className="font-bold text-slate-900">{car.pickupLocation}</p>
                      <p className="text-slate-600">{formatDateBR(car.pickupDate)} às {car.pickupTime}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Devolução</span>
                      <p className="font-bold text-slate-900">{car.dropoffLocation}</p>
                      <p className="text-slate-600">{formatDateBR(car.dropoffDate)} às {car.dropoffTime}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between text-xs text-slate-700">
                    <div>Condutor Principal: <strong className="text-slate-900">{car.driverName}</strong></div>
                    <div>Proteção: <span className="font-medium">{car.includedCoverage || "Proteção básica inclusa"}</span></div>
                  </div>

                  {(car.qrCodeData || car.barcodeData || car.codeImageBase64) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <CodeRenderer
                        qrCodeData={car.qrCodeData}
                        barcodeData={car.barcodeData}
                        barcodeType={car.barcodeType}
                        codeImageBase64={car.codeImageBase64}
                        title={`Locação - ${car.rentalCompany}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO SEGURO VIAGEM */}
        {insurancesList.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Seguro Viagem & Assistência 24h</span>
            </div>

            <div className="space-y-3">
              {insurancesList.map((ins, index) => (
                <div
                  key={ins.id || index}
                  className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs"
                  data-pdf-block="true"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {ins.provider} - <span className="font-medium text-slate-600">{ins.planName}</span>
                      </h3>
                      <span className="text-xs text-slate-500">Vigência: {formatDateBR(ins.coverageStart || ins.startDate)} até {formatDateBR(ins.coverageEnd || ins.endDate)}</span>
                    </div>
                    {ins.policyNumber && (
                      <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                        Apólice: {ins.policyNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cobertura Médica (DMH)</span>
                      <span className="font-extrabold text-slate-900 text-sm">{ins.medicalCoverage}</span>
                    </div>
                    {ins.emergencyPhone24h && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Central 24h</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{ins.emergencyPhone24h}</span>
                      </div>
                    )}
                  </div>

                  {ins.insuredNames && ins.insuredNames.length > 0 && (
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-700 mr-2">Segurados:</span>
                      {ins.insuredNames.join(", ")}
                    </div>
                  )}

                  {(ins.qrCodeData || ins.barcodeData || ins.codeImageBase64) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <CodeRenderer
                        qrCodeData={ins.qrCodeData}
                        barcodeData={ins.barcodeData}
                        barcodeType={ins.barcodeType}
                        codeImageBase64={ins.codeImageBase64}
                        title={`Seguro - ${ins.provider}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO INGRESSOS / ATRAÇÕES */}
        {ticketsList.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-purple-600" />
              <span>Ingressos & Atrações</span>
            </div>

            <div className="space-y-3">
              {ticketsList.map((ticket, index) => (
                <div
                  key={ticket.id || index}
                  className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-white space-y-2.5 shadow-2xs"
                  data-pdf-block="true"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{ticket.attractionName}</h3>
                      {ticket.supplierOrPark && <span className="text-xs text-slate-500">{ticket.supplierOrPark}</span>}
                    </div>
                    {ticket.ticketNumberOrCode && (
                      <span className="text-xs bg-purple-50 border border-purple-200 text-purple-800 px-2 py-0.5 rounded font-mono font-bold">
                        {ticket.ticketNumberOrCode}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Data & Horário</span>
                      <span className="font-bold text-slate-900">{formatDateBR(ticket.date)} {ticket.time ? `às ${ticket.time}` : ""}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo</span>
                      <span className="font-medium text-slate-800">{ticket.ticketType || "Ingresso Padrão"}</span>
                    </div>
                  </div>

                  {ticket.importantInstructions && (
                    <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200/80 p-2 rounded">
                      <strong>Instruções:</strong> {ticket.importantInstructions}
                    </div>
                  )}

                  {(ticket.qrCodeData || ticket.barcodeData || ticket.codeImageBase64) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <CodeRenderer
                        qrCodeData={ticket.qrCodeData}
                        barcodeData={ticket.barcodeData}
                        barcodeType={ticket.barcodeType}
                        codeImageBase64={ticket.codeImageBase64}
                        title={`Ingresso - ${ticket.attractionName}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO CRUZEIROS */}
        {cruisesList.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Ship className="w-4 h-4 text-cyan-600" />
              <span>Cruzeiro Marítimo</span>
            </div>

            <div className="space-y-3">
              {cruisesList.map((cruise, index) => (
                <div
                  key={cruise.id || index}
                  className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs"
                  data-pdf-block="true"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {cruise.cruiseLine} • {cruise.shipName}
                    </h3>
                    {cruise.bookingNumber && (
                      <span className="text-xs bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 rounded font-mono font-bold">
                        Booking: {cruise.bookingNumber}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Embarque</span>
                      <p className="font-bold text-slate-900">{cruise.departurePort}</p>
                      <p className="text-slate-600">{formatDateBR(cruise.departureDate)} às {cruise.departureTime}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Desembarque</span>
                      <p className="font-bold text-slate-900">{cruise.arrivalPort}</p>
                      <p className="text-slate-600">{formatDateBR(cruise.arrivalDate)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-700">
                    <div>Cabine: <strong className="text-slate-900">{cruise.cabinNumber} ({cruise.cabinCategory})</strong></div>
                    {cruise.mealPlan && <div>Regime: <span className="font-medium text-slate-900">{cruise.mealPlan}</span></div>}
                  </div>

                  {(cruise.qrCodeData || cruise.barcodeData || cruise.codeImageBase64) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <CodeRenderer
                        qrCodeData={cruise.qrCodeData}
                        barcodeData={cruise.barcodeData}
                        barcodeType={cruise.barcodeType}
                        codeImageBase64={cruise.codeImageBase64}
                        title={`Cruzeiro - ${cruise.shipName}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO TRANSFERS */}
        {transfersList.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Bus className="w-4 h-4 text-indigo-600" />
              <span>Transfers & Traslados</span>
            </div>

            <div className="space-y-3">
              {transfersList.map((transfer, index) => (
                <div
                  key={transfer.id || index}
                  className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-white space-y-2.5 shadow-2xs"
                  data-pdf-block="true"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {transfer.serviceType || "Transporte Receptivo"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Origem</span>
                      <p className="font-bold text-slate-900">{transfer.pickupLocation}</p>
                      <p className="text-slate-600">{formatDateBR(transfer.pickupDateTime)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Destino</span>
                      <p className="font-bold text-slate-900">{transfer.dropoffLocation}</p>
                      {transfer.vehicleType && <p className="text-slate-600">Veículo: {transfer.vehicleType}</p>}
                    </div>
                  </div>

                  {transfer.contactPhone && (
                    <div className="text-xs text-slate-600">
                      Contato Receptivo: <strong className="text-slate-900">{transfer.contactPhone}</strong>
                    </div>
                  )}

                  {(transfer.qrCodeData || transfer.barcodeData || transfer.codeImageBase64) && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <CodeRenderer
                        qrCodeData={transfer.qrCodeData}
                        barcodeData={transfer.barcodeData}
                        barcodeType={transfer.barcodeType}
                        codeImageBase64={transfer.codeImageBase64}
                        title="Transfer"
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RESUMO FINANCEIRO (Respeito Estrito à Regra do Cliente / Autonomia) */}
        {voucher.priceDisplayMode !== "sem_valor" && (
          <section className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-slate-50/70" data-pdf-block="true">
            <div className="flex items-center justify-between mb-3 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Resumo Tarifário</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {voucher.priceDisplayMode === "apenas_total" ? "Valor Total" : "Resumo da Emissão"}
              </span>
            </div>

            {voucher.priceDisplayMode === "discriminado" && (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Tarifa Base:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(voucher.pricing.fare, voucher.pricing.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Taxas de Embarque:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(voucher.pricing.taxes, voucher.pricing.currency)}
                  </span>
                </div>
                {voucher.pricing.serviceFee > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>Taxa de Serviço:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {formatCurrency(voucher.pricing.serviceFee, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                {voucher.pricing.otherFees > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                    <span>Outros Encargos:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {formatCurrency(voucher.pricing.otherFees, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm font-bold text-slate-900">
                  <span>Valor Total Confirmado:</span>
                  <span className="font-mono text-base font-black" style={{ color: primaryColor }}>
                    {formatCurrency(voucher.pricing.total, voucher.pricing.currency)}
                  </span>
                </div>
              </div>
            )}

            {voucher.priceDisplayMode === "apenas_total" && (
              <div className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Valor Total Confirmado:</span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {formatCurrency(voucher.pricing.total, voucher.pricing.currency)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* ORIENTAÇÕES DE EMBARQUE E UTILIZAÇÃO (Regras Automáticas) */}
        <section className="pdf-block-avoid border border-slate-200 rounded-lg p-4 bg-white" data-pdf-block="true">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider mb-2.5 pb-2 border-b border-slate-100">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Orientações de Embarque e Utilização</span>
          </div>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            {productRules.length > 0 ? (
              productRules.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  {productRules.length > 1 && (
                    <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider block">
                      {cat.categoryTitle}
                    </span>
                  )}
                  {cat.rules.map((r, rIdx) => (
                    <div key={rIdx}>
                      <strong className="text-slate-900">• {r.label}:</strong> {r.text}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="space-y-1">
                <div><strong className="text-slate-900">• Documentos:</strong> Apresente documento oficial original com foto (RG/CNH/Passaporte).</div>
                <div><strong className="text-slate-900">• Apresentação:</strong> Compareça com a devida antecedência indicada pela operadora do serviço.</div>
              </div>
            )}
          </div>
        </section>

        {/* RODAPÉ EXECUTIVO DIRETO */}
        <footer className="pdf-block-avoid border-t border-slate-200 pt-3 flex flex-col gap-2 text-xs text-slate-600 print:pt-2" data-pdf-block="true">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
            <span className="font-bold text-slate-900">
              {agency.name} {agency.cnpj ? `- CNPJ: ${agency.cnpj}` : ""}
            </span>

            <div className="flex items-center gap-2 font-semibold">
              <span className="text-[10px] uppercase text-slate-500 font-bold">Plantão 24h:</span>
              <span className="font-mono font-bold text-sm" style={{ color: primaryColor }}>
                {agency.emergencyPhone || agency.phone || "Consulte seu agente"}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
