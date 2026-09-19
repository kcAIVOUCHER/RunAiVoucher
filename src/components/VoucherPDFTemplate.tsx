import React from "react";
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
import { formatPassengerDocumentLGPD, getProductBoardingRules } from "../utils/boardingRules";
import { CodeRenderer } from "./CodeRenderer";
import { normalizeHotelsList } from "../utils/hotelSplitter";
import { formatDateBR } from "../utils/dateFormatter";

export interface VoucherPDFTemplateProps {
  voucher: Voucher;
  agency: AgencyProfile;
  company?: Company | null;
  agencyLogoBase64?: string | null;
  companyLogoBase64?: string | null;
}

/**
 * Dedicated, deterministic PDF Template for Travel Vouchers.
 * Built with fixed A4 dimensions (794px width) and 100% self-contained standard CSS.
 * Zero dependency on external Tailwind v4 stylesheets, viewports, or runtime CSS variables.
 */
export const VoucherPDFTemplate: React.FC<VoucherPDFTemplateProps> = ({
  voucher,
  agency,
  company,
  agencyLogoBase64,
  companyLogoBase64
}) => {
  const primaryColor = agency.primaryColor || "#0284c7";
  const agencyLogo = agencyLogoBase64 || agency.logoUrl;
  const companyLogo = companyLogoBase64 || company?.logoUrl;

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

  const productRules = getProductBoardingRules(voucher);

  // Helper for flight number display without duplicate airline code
  const getFlightNumberDisplay = (code?: string, num?: string) => {
    if (!num) return code || "";
    if (code && num.toUpperCase().startsWith(code.toUpperCase())) {
      return num;
    }
    return `${code || ""}${num}`;
  };

  return (
    <div
      id="pdf-render-root"
      style={{
        width: "794px",
        minHeight: "1123px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Plus Jakarta Sans', Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        padding: "0",
        margin: "0 auto",
        position: "relative",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale"
      }}
    >
      {/* Embedded Bulletproof CSS for exact deterministic rendering */}
      <style>{`
        #pdf-render-root *, #pdf-render-root *::before, #pdf-render-root *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .pdf-box {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f8fafc;
          padding: 12px 16px;
        }
        .pdf-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #ffffff;
          padding: 14px 16px;
        }
        .pdf-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          background-color: #f1f5f9;
          color: #334155;
          white-space: nowrap;
        }
        .pdf-flex-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pdf-flex-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* Top Accent Color Bar */}
      <div
        style={{
          height: "8px",
          width: "100%",
          backgroundColor: primaryColor
        }}
      />

      {/* Main Content Area with Fixed Margins */}
      <div className="voucher-pdf-content" style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* HEADER SECTION */}
        <header
          className="pdf-block-avoid"
          data-pdf-block="true"
          style={{
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          {company ? (
            /* Corporate Voucher Header: Agency Logo (Left) | Service Title (Center) | Company Logo (Right) */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              {/* Agency Logo */}
              <div style={{ maxWidth: "200px", maxHeight: "65px", display: "flex", alignItems: "center" }}>
                {agencyLogo ? (
                  <img
                    src={agencyLogo}
                    alt={agency.name}
                    style={{ maxWidth: "190px", maxHeight: "60px", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      height: "44px",
                      padding: "0 16px",
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "15px"
                    }}
                  >
                    {agency.tradeName || agency.name}
                  </div>
                )}
              </div>

              {/* Service Title Middle */}
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "#64748b"
                  }}
                >
                  {voucher.serviceType === "flight" && "Bilhete Aéreo"}
                  {voucher.serviceType === "hotel" && "Hospedagem & Hotel"}
                  {voucher.serviceType === "car" && "Locação de Veículo"}
                  {voucher.serviceType === "insurance" && "Seguro Viagem"}
                  {voucher.serviceType === "ticket" && "Ingresso & Passeio"}
                  {voucher.serviceType === "cruise" && "Cruzeiro Marítimo"}
                  {voucher.serviceType === "package" && "Pacote Turístico"}
                  {voucher.serviceType === "transfer" && "Transfer & Receptivo"}
                </span>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                  Comprovante de Reserva
                </div>
              </div>

              {/* Company Logo Right */}
              <div style={{ maxWidth: "200px", maxHeight: "65px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={company.name}
                    style={{ maxWidth: "180px", maxHeight: "55px", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      height: "38px",
                      padding: "0 12px",
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "12px"
                    }}
                  >
                    {company.tradeName || company.name}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Single Agency Voucher Header: Clean Left Logo & Right PNR / Status */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ maxHeight: "70px", display: "flex", alignItems: "center" }}>
                {agencyLogo ? (
                  <img
                    src={agencyLogo}
                    alt={agency.name}
                    style={{ maxWidth: "240px", maxHeight: "65px", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      height: "44px",
                      padding: "0 20px",
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "16px"
                    }}
                  >
                    {agency.tradeName || agency.name}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>
                  PNR:{" "}
                  <span style={{ fontFamily: "monospace", color: primaryColor, fontWeight: 900 }}>
                    {voucher.pnr || "PENDENTE"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  Voucher nº {voucher.voucherNumber} • Emissão: {formatDateBR(voucher.issueDate) || new Date().toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          )}

          {/* If Corporate Voucher, show PNR bar below */}
          {company && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                fontSize: "12px"
              }}
            >
              <span style={{ color: "#64748b", fontWeight: 600 }}>
                Comprovante nº {voucher.voucherNumber} • Emissão: {formatDateBR(voucher.issueDate)}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                PNR:{" "}
                <span style={{ fontFamily: "monospace", color: primaryColor, fontWeight: 900 }}>
                  {voucher.pnr || "PENDENTE"}
                </span>
              </span>
            </div>
          )}
        </header>

        {/* PASSENGERS SECTION - INSTITUTIONAL DMZ STANDARD */}
        <section
          className="pdf-section"
          data-pdf-section="passenger"
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {/* Section Header (Separated from the Card) */}
          <div
            className="pdf-section-header"
            data-pdf-section-header="true"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {(voucher.passengers?.length || 0) <= 1 ? "PASSAGEIRO / HÓSPEDE" : "PASSAGEIROS / HÓSPEDES"}
            </div>
          </div>

          {/* Independent Card Containing the Names */}
          <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              className="pdf-block-avoid pdf-card"
              data-pdf-block="true"
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "14px 18px",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              {voucher.passengers && voucher.passengers.length > 0 ? (
                voucher.passengers.map((p, idx) => {
                  const docResult = formatPassengerDocumentLGPD(p.document);
                  return (
                    <div
                      key={idx}
                      style={{
                        borderTop: idx > 0 ? "1px solid #f1f5f9" : "none",
                        paddingTop: idx > 0 ? "10px" : "0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "8px"
                      }}
                    >
                      {/* Passenger Main Name (Priority 1) */}
                      <div>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "15px", letterSpacing: "-0.2px" }}>
                          {p.name}
                        </div>
                        {p.birthDate && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Nascimento: {formatDateBR(p.birthDate)}
                          </div>
                        )}
                      </div>

                      {/* Operational Details (Discreet) */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11.5px", color: "#475569", flexWrap: "wrap" }}>
                        {p.seat && (
                          <span style={{ fontWeight: 700, color: "#0369a1" }}>
                            Assento: <strong>{p.seat}</strong>
                          </span>
                        )}

                        {p.ticketNumber && (
                          <span>
                            Bilhete: <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>{p.ticketNumber}</strong>
                          </span>
                        )}

                        {p.loyaltyNumber && (
                          <span style={{ color: "#64748b", fontFamily: "monospace" }}>
                            Fidelidade: {p.loyaltyNumber}
                          </span>
                        )}

                        {docResult.hasDocument && (
                          <span style={{ color: "#64748b", fontFamily: "monospace" }}>
                            {docResult.displayLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <span style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>Nenhum passageiro listado.</span>
              )}
            </div>
          </div>
        </section>

        {/* FLIGHT ITINERARY SECTION - CLEAR HIERARCHY */}
        {voucher.flights &&
          voucher.flights.length > 0 && (
            <section
              className="pdf-section"
              data-pdf-section="flight"
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div
                className="pdf-section-header"
                data-pdf-section-header="true"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <span style={{ fontSize: "14px" }}>✈️</span>
                  TRANSPORTE AÉREO
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
                  return label ? <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{label}</span> : null;
                })()}
              </div>

              <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {voucher.flights.map((flight, idx) => {
                  const flightNum = getFlightNumberDisplay(flight.airlineCode, flight.flightNumber);
                  return (
                    <div
                      key={flight.id || idx}
                      className="pdf-block-avoid pdf-card"
                      data-pdf-block="true"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "16px 18px",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}
                    >
                      {/* Priority 1: Airline & Flight Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingBottom: "10px",
                          borderBottom: "1px solid #f1f5f9"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "16px" }}>{flight.airline}</span>
                          <span style={{ fontFamily: "monospace", fontWeight: 800, color: primaryColor, fontSize: "14px" }}>
                            {flightNum}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                            {formatDateBR(flight.departureDate)}
                          </span>
                        </div>

                        {/* Localizador if specific */}
                        {(flight as any).locator && (
                          <div style={{ fontSize: "12px", color: "#475569" }}>
                            Localizador: <strong style={{ fontFamily: "monospace", color: "#0f172a", fontSize: "13px" }}>{(flight as any).locator}</strong>
                          </div>
                        )}
                      </div>

                      {/* Priority 2: Origin, Destination and Times */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "#f8fafc",
                          padding: "12px 16px",
                          borderRadius: "6px"
                        }}
                      >
                        {/* Origin */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                            Origem
                          </span>
                          <span style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
                            {flight.departureCode || "---"}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                            {flight.departureTime || "--:--"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", maxWidth: "160px" }}>
                            {flight.departureAirport || flight.departureCity}
                            {flight.departureTerminal ? ` • T${flight.departureTerminal}` : ""}
                          </span>
                        </div>

                        {/* Flight Path Indicator */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                            {flight.duration ? flight.duration : "Voo Direto"}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "36px", height: "1px", backgroundColor: "#cbd5e1" }} />
                            <span style={{ color: primaryColor, fontSize: "13px" }}>✈</span>
                            <div style={{ width: "36px", height: "1px", backgroundColor: "#cbd5e1" }} />
                          </div>
                        </div>

                        {/* Destination */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "right" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                            Destino
                          </span>
                          <span style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
                            {flight.arrivalCode || "---"}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                            {flight.arrivalTime || "--:--"}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", maxWidth: "160px" }}>
                            {flight.arrivalAirport || flight.arrivalCity}
                            {flight.arrivalTerminal ? ` • T${flight.arrivalTerminal}` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Priority 3: Passenger Baggage & Fare Details */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          color: "#334155",
                          flexWrap: "wrap",
                          gap: "8px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>Bagagem:</span>
                          <span>{flight.baggageHand || "Mão 10kg"}</span>
                          {flight.baggageChecked && (
                            <>
                              <span style={{ color: "#cbd5e1" }}>•</span>
                              <span style={{ fontWeight: 700, color: "#0369a1" }}>{flight.baggageChecked}</span>
                            </>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#64748b" }}>
                          {flight.cabinClass && <span>Cabine: {flight.cabinClass}</span>}
                          {!voucher.hideBookingClass && <span>Classe: {flight.bookingClass || "Y"}</span>}
                          {!voucher.hideFareFamily && <span>Tarifa: {flight.fareFamily || "Plus"}</span>}
                        </div>
                      </div>

                      {/* QR Code / Barcode (If available) */}
                      {(flight.qrCodeData || flight.barcodeData || flight.codeImageBase64) && (
                        <div style={{ marginTop: "4px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                          <CodeRenderer
                            qrCodeData={flight.qrCodeData}
                            barcodeData={flight.barcodeData}
                            barcodeType={flight.barcodeType}
                            codeImageBase64={flight.codeImageBase64}
                            title={`Cartão de Embarque - Voo ${flightNum}`}
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

        {/* HOTELS SECTION (CLEAN EXECUTIVE DESIGN) */}
        {hotelsList.length > 0 && (
          <section
            className="pdf-section"
            data-pdf-section="hotel"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              className="pdf-section-header"
              data-pdf-section-header="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ fontSize: "14px" }}>🏨</span>
                HOSPEDAGEM
              </div>
            </div>

            <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {hotelsList.map((hotel, index) => (
                <div
                  key={hotel.id || index}
                  className="pdf-block-avoid pdf-card"
                  data-pdf-block="true"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {/* Priority 1: Hotel Name and Booking Code */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {hotel.hotelName}
                      </div>
                      {(hotel.checkInDate || hotel.checkOutDate) && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontWeight: 600 }}>
                          {formatDateBR(hotel.checkInDate)} → {formatDateBR(hotel.checkOutDate)} {hotel.nights ? `(${hotel.nights} diárias)` : ""}
                        </div>
                      )}
                    </div>

                    {hotel.confirmationCode && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                          Reserva / Localizador
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: primaryColor }}>
                          {hotel.confirmationCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority 2: Check-in & Check-out Highlight Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      backgroundColor: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "6px"
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                        Check-in
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>{formatDateBR(hotel.checkInDate) || "---"}</strong>
                      <div style={{ fontSize: "11px", color: "#475569", marginTop: "1px" }}>
                        {hotel.checkInTime ? `Horário: a partir das ${hotel.checkInTime}` : "Horário padrão"}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                        Check-out
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: "14px" }}>{formatDateBR(hotel.checkOutDate) || "---"}</strong>
                      <div style={{ fontSize: "11px", color: "#475569", marginTop: "1px" }}>
                        {hotel.checkOutTime ? `Horário: até às ${hotel.checkOutTime}` : "Horário padrão"}
                      </div>
                    </div>
                  </div>

                  {/* Priority 3: Room, Meal Plan & Guests */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#334155",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <span><strong>Quarto:</strong> {hotel.roomCategory || hotel.roomType || "Standard"}</span>
                      {hotel.mealPlan && <span><strong>Regime:</strong> {hotel.mealPlan}</span>}
                    </div>

                    {hotel.guestsNames && hotel.guestsNames.length > 0 && (
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        <strong>Hóspede(s):</strong> {hotel.guestsNames.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Operational & Address Footer (Discreet, Clean) */}
                  {(hotel.address || hotel.city) && (
                    <div
                      style={{
                        paddingTop: "8px",
                        borderTop: "1px solid #f1f5f9",
                        fontSize: "11px",
                        color: "#64748b",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "6px"
                      }}
                    >
                      <div>
                        📍 Endereço: {hotel.address}{hotel.city ? ` • ${hotel.city}` : ""}
                      </div>
                      {(hotel as any).phone && <div>Tel: {(hotel as any).phone}</div>}
                    </div>
                  )}

                  {/* QR Code / Barcode replication */}
                  {(hotel.qrCodeData || hotel.barcodeData || hotel.codeImageBase64) && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
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
                    <div style={{ fontSize: "11px", color: "#92400e", backgroundColor: "#fef3c7", padding: "6px 10px", borderRadius: "4px" }}>
                      ⚠️ {hotel.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CAR RENTAL SECTION (CLEAN EXECUTIVE DESIGN) */}
        {carsList.length > 0 && (
          <section
            className="pdf-section"
            data-pdf-section="car"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              className="pdf-section-header"
              data-pdf-section-header="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ fontSize: "14px" }}>🚗</span>
                LOCAÇÃO DE VEÍCULOS
              </div>
            </div>

            <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {carsList.map((car, index) => (
                <div
                  key={car.id || index}
                  className="pdf-block-avoid pdf-card"
                  data-pdf-block="true"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {/* Priority 1: Rental Company & Vehicle Name */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {car.rentalCompany} • {car.carModel || car.carCategory || car.carModelOrCategory}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Categoria: <strong>{car.carCategory || car.carModelOrCategory || "Padrão"}</strong>
                      </div>
                    </div>

                    {car.confirmationCode && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                          Reserva / Contrato
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: primaryColor }}>
                          {car.confirmationCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority 2: Pick-up and Drop-off Timings */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      backgroundColor: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "6px"
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                        Retirada (Pick-up)
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: "13px" }}>{car.pickupLocation}</strong>
                      <div style={{ color: "#475569", marginTop: "2px", fontSize: "11px" }}>
                        {formatDateBR(car.pickupDateTime) || `${formatDateBR(car.pickupDate) || ""} às ${car.pickupTime || ""}`}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                        Devolução (Drop-off)
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: "13px" }}>{car.dropoffLocation}</strong>
                      <div style={{ color: "#475569", marginTop: "2px", fontSize: "11px" }}>
                        {formatDateBR(car.dropoffDateTime) || `${formatDateBR(car.dropoffDate) || ""} às ${car.dropoffTime || ""}`}
                      </div>
                    </div>
                  </div>

                  {/* Priority 3: Driver and Protection */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#334155",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    {(car.driverName || car.driverDocument) && (
                      <div>
                        <strong>Condutor:</strong> {car.driverName || "Titular"}
                        {car.driverDocument && ` (Doc: ${car.driverDocument})`}
                      </div>
                    )}

                    {(car.insuranceIncluded || car.includedCoverage) && (
                      <span style={{ fontSize: "11px", color: "#065f46", fontWeight: 700 }}>
                        ✓ {car.includedCoverage || "Proteção / Seguro Incluso"}
                      </span>
                    )}
                  </div>

                  {/* QR Code / Barcode replication */}
                  {(car.qrCodeData || car.barcodeData || car.codeImageBase64) && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                      <CodeRenderer
                        qrCodeData={car.qrCodeData}
                        barcodeData={car.barcodeData}
                        barcodeType={car.barcodeType}
                        codeImageBase64={car.codeImageBase64}
                        title={`Validação Locadora - ${car.rentalCompany}`}
                        compact={true}
                      />
                    </div>
                  )}

                  {car.notes && (
                    <div style={{ fontSize: "11px", color: "#92400e", backgroundColor: "#fef3c7", padding: "6px 10px", borderRadius: "4px" }}>
                      ⚠️ {car.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* INSURANCE SECTION (CLEAN EXECUTIVE DESIGN) */}
        {insurancesList.length > 0 && (
          <section
            className="pdf-section"
            data-pdf-section="insurance"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              className="pdf-section-header"
              data-pdf-section-header="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ fontSize: "14px" }}>🛡️</span>
                SEGURO VIAGEM
              </div>
            </div>

            <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {insurancesList.map((ins, index) => (
                <div
                  key={ins.id || index}
                  className="pdf-block-avoid pdf-card"
                  data-pdf-block="true"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {/* Priority 1: Insurer Name & Policy */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {ins.insurerName || ins.provider} • {ins.planName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Vigência: <strong>{formatDateBR(ins.coverageStart || ins.startDate)}</strong> a <strong>{formatDateBR(ins.coverageEnd || ins.endDate)}</strong>
                        {ins.destinationArea ? ` (${ins.destinationArea})` : ""}
                      </div>
                    </div>

                    {ins.policyNumber && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                          Apólice / Certificado
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: primaryColor }}>
                          {ins.policyNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Priority 2: Emergency Phone & Coverage Highlights */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "#334155" }}>
                      {ins.medicalCoverage && <span><strong>DMH:</strong> {ins.medicalCoverage}</span>}
                      {ins.covidCoverage && <span><strong>COVID:</strong> {ins.covidCoverage}</span>}
                      {ins.baggageCoverage && <span><strong>Bagagem:</strong> {ins.baggageCoverage}</span>}
                    </div>

                    {(ins.emergencyPhone || ins.emergencyPhone24h) && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                          Emergência 24h
                        </span>
                        <span style={{ color: "#059669", fontWeight: 800, fontFamily: "monospace", fontSize: "13px" }}>
                          {ins.emergencyPhone || ins.emergencyPhone24h}
                        </span>
                      </div>
                    )}
                  </div>

                  {ins.insuredNames && ins.insuredNames.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      <strong>Segurado(s):</strong> {ins.insuredNames.join(", ")}
                    </div>
                  )}

                  {/* QR Code / Barcode replication */}
                  {(ins.qrCodeData || ins.barcodeData || ins.codeImageBase64) && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                      <CodeRenderer
                        qrCodeData={ins.qrCodeData}
                        barcodeData={ins.barcodeData}
                        barcodeType={ins.barcodeType}
                        codeImageBase64={ins.codeImageBase64}
                        title={`Validação Apólice - ${ins.insurerName || ins.provider}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TICKETS & ATTRACTIONS SECTION (CLEAN EXECUTIVE DESIGN) */}
        {ticketsList.length > 0 && (
          <section
            className="pdf-section"
            data-pdf-section="ticket"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              className="pdf-section-header"
              data-pdf-section-header="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ fontSize: "14px" }}>🎟️</span>
                INGRESSOS & ATRAÇÕES
              </div>
            </div>

            <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {ticketsList.map((ticket, index) => (
                <div
                  key={ticket.id || index}
                  className="pdf-block-avoid pdf-card"
                  data-pdf-block="true"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {ticket.attractionName} {ticket.supplierOrPark ? `(${ticket.supplierOrPark})` : ""}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Tipo: <strong>{ticket.ticketType || "Ingresso Padrão"}</strong> • Data: <strong>{formatDateBR(ticket.date)} {ticket.time ? `às ${ticket.time}` : ""}</strong>
                      </div>
                    </div>

                    {ticket.ticketNumberOrCode && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                          Código / Ingresso
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: primaryColor }}>
                          {ticket.ticketNumberOrCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {ticket.locationOrAddress && (
                    <div style={{ color: "#64748b", fontSize: "11.5px" }}>
                      📍 Endereço: {ticket.locationOrAddress}
                    </div>
                  )}

                  {ticket.passengersOrHolders && ticket.passengersOrHolders.length > 0 && (
                    <div style={{ fontSize: "11px", color: "#475569" }}>
                      <strong>Titular(es):</strong> {ticket.passengersOrHolders.join(", ")}
                    </div>
                  )}

                  {ticket.importantInstructions && (
                    <div style={{ fontSize: "11px", color: "#475569", backgroundColor: "#f8fafc", padding: "8px 10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                      ℹ️ {ticket.importantInstructions}
                    </div>
                  )}

                  {/* QR Code / Barcode replication */}
                  {(ticket.qrCodeData || ticket.barcodeData || ticket.codeImageBase64) && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                      <CodeRenderer
                        qrCodeData={ticket.qrCodeData}
                        barcodeData={ticket.barcodeData}
                        barcodeType={ticket.barcodeType}
                        codeImageBase64={ticket.codeImageBase64}
                        title={`Validação de Acesso - ${ticket.attractionName}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CRUISE SECTION (CLEAN EXECUTIVE DESIGN) */}
        {cruisesList.length > 0 && (
          <section
            className="pdf-section"
            data-pdf-section="cruise"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              className="pdf-section-header"
              data-pdf-section-header="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ fontSize: "14px" }}>🚢</span>
                CRUZEIRO MARÍTIMO
              </div>
            </div>

            <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {cruisesList.map((cruise, index) => (
                <div
                  key={cruise.id || index}
                  className="pdf-block-avoid pdf-card"
                  data-pdf-block="true"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {cruise.cruiseLine} • {cruise.shipName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        Cabine: <strong>{cruise.cabinNumber} ({cruise.cabinCategory || "Standard"})</strong>
                        {cruise.mealPlan ? ` • ${cruise.mealPlan}` : ""}
                      </div>
                    </div>

                    {cruise.bookingNumber && (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block", fontWeight: 700 }}>
                          Booking
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: primaryColor }}>
                          {cruise.bookingNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      backgroundColor: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      fontSize: "12px"
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Embarque</span>
                      <strong>{cruise.departurePort}</strong>
                      <div style={{ color: "#64748b", marginTop: "1px" }}>{formatDateBR(cruise.departureDate)}{cruise.departureTime ? ` às ${cruise.departureTime}` : ""}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Desembarque</span>
                      <strong>{cruise.arrivalPort}</strong>
                      <div style={{ color: "#64748b", marginTop: "1px" }}>{formatDateBR(cruise.arrivalDate)}</div>
                    </div>
                  </div>

                  {cruise.itinerarySummary && (
                    <div style={{ fontSize: "11.5px", color: "#475569" }}>
                      <strong>Roteiro:</strong> {cruise.itinerarySummary}
                    </div>
                  )}

                  {/* QR Code / Barcode replication */}
                  {(cruise.qrCodeData || cruise.barcodeData || cruise.codeImageBase64) && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                      <CodeRenderer
                        qrCodeData={cruise.qrCodeData}
                        barcodeData={cruise.barcodeData}
                        barcodeType={cruise.barcodeType}
                        codeImageBase64={cruise.codeImageBase64}
                        title={`Validação Marítima - ${cruise.cruiseLine}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TRANSFERS SECTION (CLEAN EXECUTIVE DESIGN) */}
        {transfersList.length > 0 && (
          <section
            className="pdf-section"
            data-pdf-section="transfer"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              className="pdf-section-header"
              data-pdf-section-header="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span style={{ fontSize: "14px" }}>🚐</span>
                TRANSFERS & TRASLADOS
              </div>
            </div>

            <div className="pdf-cards-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {transfersList.map((transfer, index) => (
                <div
                  key={transfer.id || index}
                  className="pdf-block-avoid pdf-card"
                  data-pdf-block="true"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: "8px"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {transfer.serviceType || "Traslado Receptivo"} {transfer.vehicleType ? `(${transfer.vehicleType})` : ""}
                      </div>
                      {transfer.flightReference && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          Voo de Referência: <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>{transfer.flightReference}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      backgroundColor: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      fontSize: "12px"
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Embarque / Origem</span>
                      <strong style={{ color: "#0f172a" }}>{transfer.pickupLocation}</strong>
                      <div style={{ color: "#64748b", marginTop: "2px" }}>{formatDateBR(transfer.pickupDateTime)}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Desembarque / Destino</span>
                      <strong style={{ color: "#0f172a" }}>{transfer.dropoffLocation}</strong>
                    </div>
                  </div>

                  {transfer.contactPhone && (
                    <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: 600 }}>
                      📞 Plantão / Contato Receptivo: <strong style={{ color: primaryColor, fontFamily: "monospace" }}>{transfer.contactPhone}</strong>
                    </div>
                  )}

                  {/* QR Code / Barcode replication */}
                  {(transfer.qrCodeData || transfer.barcodeData || transfer.codeImageBase64) && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
                      <CodeRenderer
                        qrCodeData={transfer.qrCodeData}
                        barcodeData={transfer.barcodeData}
                        barcodeType={transfer.barcodeType}
                        codeImageBase64={transfer.codeImageBase64}
                        title={`Validação Transfer - ${transfer.serviceType || "Receptivo"}`}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FINANCIAL & PRICING SUMMARY SECTION (CLEAN & SUBTLE) */}
        {voucher.priceDisplayMode !== "sem_valor" && (
          <section
            className="pdf-block-avoid"
            data-pdf-block="true"
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "14px 18px",
              backgroundColor: "#ffffff"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                Resumo Financeiro & Tarifário
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {voucher.priceDisplayMode === "apenas_total" ? "Valor Total" : "Resumo da Emissão"}
              </span>
            </div>

            {voucher.priceDisplayMode === "discriminado" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                  <span>Tarifa Base:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                    {formatCurrency(voucher.pricing.fare, voucher.pricing.currency)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                  <span>Taxas de Embarque / Aeroportuárias:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                    {formatCurrency(voucher.pricing.taxes, voucher.pricing.currency)}
                  </span>
                </div>
                {voucher.pricing.serviceFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                    <span>Taxa de Serviço / Agenciamento (DU/RAV):</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                      {formatCurrency(voucher.pricing.serviceFee, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                {voucher.pricing.otherFees > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                    <span>Outros Encargos:</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                      {formatCurrency(voucher.pricing.otherFees, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  <span>Valor Total Confirmado:</span>
                  <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 900, color: primaryColor }}>
                    {formatCurrency(voucher.pricing.total, voucher.pricing.currency)}
                  </span>
                </div>
              </div>
            )}

            {voucher.priceDisplayMode === "apenas_total" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#f8fafc",
                  padding: "10px 14px",
                  borderRadius: "6px"
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Valor Total Confirmado:</span>
                <span style={{ fontSize: "18px", fontWeight: 900, fontFamily: "monospace", color: primaryColor }}>
                  {formatCurrency(voucher.pricing.total, voucher.pricing.currency)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* BOARDING INSTRUCTIONS SECTION */}
        <section
          className="pdf-block-avoid"
          data-pdf-block="true"
          style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              ORIENTAÇÕES DE EMBARQUE E UTILIZAÇÃO
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#64748b",
                backgroundColor: "#f1f5f9",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #e2e8f0"
              }}
            >
              Condições Oficiais
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px", color: "#334155", lineHeight: 1.45 }}>
            {productRules.length > 0 ? (
              productRules.map((cat) => (
                <div key={cat.id} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {productRules.length > 1 && (
                    <span style={{ fontWeight: 800, fontSize: "11px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {cat.categoryTitle}
                    </span>
                  )}
                  {cat.rules.map((r, rIdx) => (
                    <div key={rIdx}>
                      <strong style={{ color: "#0f172a" }}>• {r.label}:</strong> {r.text}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <>
                <div>
                  <strong style={{ color: "#0f172a" }}>• Documentos:</strong> Apresente documento oficial original com foto (RG/CNH/Passaporte).
                </div>
                <div>
                  <strong style={{ color: "#0f172a" }}>• Apresentação:</strong> Compareça com a devida antecedência indicada pela operadora do serviço.
                </div>
              </>
            )}
          </div>
        </section>

        {/* FOOTER SECTION */}
        <footer
          className="pdf-block-avoid"
          data-pdf-block="true"
          style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}
        >
          <div style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>
            Voucher nº {voucher.voucherNumber} • Emissão: {formatDateBR(voucher.issueDate)}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "11px"
            }}
          >
            <span style={{ fontWeight: 700, color: "#0f172a" }}>
              {agency.name} {agency.cnpj ? `- CNPJ: ${agency.cnpj}` : ""}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                Plantão 24h:
              </span>
              <span style={{ color: primaryColor, fontFamily: "monospace", fontWeight: 800, fontSize: "12px" }}>
                {agency.emergencyPhone || agency.phone || "Consulte seu agente"}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
