import React from "react";
import { Voucher, AgencyProfile, Company } from "../types";
import { formatPassengerDocumentLGPD, getProductBoardingRules } from "../utils/boardingRules";

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
      <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* HEADER SECTION */}
        <header
          style={{
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          {company ? (
            /* Corporate Voucher Header: Agency Logo (Left) | Service Badge (Center) | Company Logo (Right) */
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

              {/* Service Badge Middle */}
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#334155",
                  backgroundColor: "#f1f5f9",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  border: "1px solid #e2e8f0"
                }}
              >
                {voucher.serviceType === "flight" && "✈️ Bilhete Aéreo"}
                {voucher.serviceType === "hotel" && "🏨 Hospedagem"}
                {voucher.serviceType === "car" && "🚗 Locação Carro"}
                {voucher.serviceType === "insurance" && "🛡️ Seguro"}
                {voucher.serviceType === "ticket" && "🎟️ Ingresso"}
                {voucher.serviceType === "cruise" && "🚢 Cruzeiro"}
                {voucher.serviceType === "package" && "✨ Pacote Turístico"}
                {voucher.serviceType === "transfer" && "🚐 Transfer Receptivo"}
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
            /* Single Agency Voucher Header: Centered Logo and Badges */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{ maxHeight: "75px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {agencyLogo ? (
                  <img
                    src={agencyLogo}
                    alt={agency.name}
                    style={{ maxWidth: "240px", maxHeight: "70px", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      height: "48px",
                      padding: "0 22px",
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "18px"
                    }}
                  >
                    {agency.tradeName || agency.name}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#334155",
                    backgroundColor: "#f1f5f9",
                    padding: "3px 12px",
                    borderRadius: "9999px",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  {voucher.serviceType === "flight" && "✈️ Bilhete Aéreo"}
                  {voucher.serviceType === "hotel" && "🏨 Hospedagem"}
                  {voucher.serviceType === "car" && "🚗 Locação Carro"}
                  {voucher.serviceType === "insurance" && "🛡️ Seguro"}
                  {voucher.serviceType === "ticket" && "🎟️ Ingresso"}
                  {voucher.serviceType === "cruise" && "🚢 Cruzeiro"}
                  {voucher.serviceType === "package" && "✨ Pacote Turístico"}
                  {voucher.serviceType === "transfer" && "🚐 Transfer Receptivo"}
                </span>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "9999px",
                    border: `1px solid ${primaryColor}40`,
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Voucher Oficial
                </span>
              </div>
            </div>
          )}

          {/* Large PNR Title */}
          <div style={{ textAlign: "center", marginTop: "2px" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.5px"
              }}
            >
              PNR:{" "}
              <span
                style={{
                  fontFamily: "monospace",
                  color: primaryColor,
                  fontWeight: 900
                }}
              >
                {voucher.pnr || "PENDENTE"}
              </span>
            </span>
          </div>
        </header>

        {/* PACKAGE / COMBO BANNER (IF APPLICABLE) */}
        {(voucher.serviceType === "package" || voucher.serviceType === "combo") && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: primaryColor,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div>
              <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9, display: "block" }}>
                Combo de Viagem Integrado
              </span>
              <span style={{ fontSize: "13px", fontWeight: 800 }}>Pacote Turístico Completo Consolidado</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(0,0,0,0.2)", padding: "3px 8px", borderRadius: "12px" }}>
              Serviços Integrados
            </span>
          </div>
        )}

        {/* PASSENGERS LIST SECTION */}
        <section
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px 16px",
            backgroundColor: "#f8fafc"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Passageiro(s) / Hóspede(s)
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                fontWeight: 600,
                color: "#065f46",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "2px 8px",
                borderRadius: "9999px"
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Conformidade LGPD
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {voucher.passengers && voucher.passengers.length > 0 ? (
              voucher.passengers.map((p, idx) => {
                const docResult = formatPassengerDocumentLGPD(p.document);
                return (
                  <div
                    key={idx}
                    style={{
                      borderTop: idx > 0 ? "1px solid #e2e8f0" : "none",
                      paddingTop: idx > 0 ? "8px" : "0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                        {p.name}
                        {p.birthDate ? ` - Nasc: ${p.birthDate}` : ""}
                      </span>
                      {p.loyaltyNumber && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#475569",
                            backgroundColor: "#f1f5f9",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontFamily: "monospace"
                          }}
                        >
                          Milhas: {p.loyaltyNumber}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#475569", flexWrap: "wrap" }}>
                      {docResult.hasDocument && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "10px",
                            color: "#475569",
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontFamily: "monospace"
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          {docResult.displayLabel}
                        </span>
                      )}

                      {p.ticketNumber && (
                        <span>
                          Bilhete: <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{p.ticketNumber}</strong>
                        </span>
                      )}

                      {p.seat && (
                        <span
                          style={{
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            border: "1px solid #bae6fd"
                          }}
                        >
                          Assento {p.seat}
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
        </section>

        {/* FLIGHT ITINERARY SECTION */}
        {(voucher.serviceType === "flight" || voucher.serviceType === "package" || voucher.serviceType === "combo") &&
          voucher.flights &&
          voucher.flights.length > 0 && (
            <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5">
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  </svg>
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
                  return label ? <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{label}</span> : null;
                })()}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {voucher.flights.map((flight, idx) => {
                  const flightNum = getFlightNumberDisplay(flight.airlineCode, flight.flightNumber);
                  return (
                    <div
                      key={flight.id || idx}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    >
                      {/* Flight Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingBottom: "8px",
                          borderBottom: "1px solid #f1f5f9",
                          marginBottom: "10px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800, color: "#0c4a6e", fontSize: "15px" }}>{flight.airline}</span>
                          <span
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#334155",
                              fontFamily: "monospace",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "12px"
                            }}
                          >
                            {flightNum}
                          </span>
                          {flight.aircraft && <span style={{ fontSize: "11px", color: "#94a3b8" }}>({flight.aircraft})</span>}
                        </div>

                        {/* Class and Fare Family Badges */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                          {!voucher.hideBookingClass && flight.bookingClass && (
                            <span
                              style={{
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                color: "#475569",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: 700
                              }}
                            >
                              Classe: {flight.bookingClass}
                            </span>
                          )}
                          {flight.cabinClass && <span style={{ color: "#475569", fontWeight: 600 }}>{flight.cabinClass}</span>}
                          {!voucher.hideFareFamily && flight.fareFamily && (
                            <span
                              style={{
                                backgroundColor: "#eef2ff",
                                border: "1px solid #c7d2fe",
                                color: "#4338ca",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: 700
                              }}
                            >
                              Tarifa {flight.fareFamily}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flight Route and Timings */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                          {flight.departureAirport ? `${flight.departureAirport} (${flight.departureCode})` : flight.departureCity}{" "}
                          <span style={{ color: primaryColor, margin: "0 4px" }}>➔</span>{" "}
                          {flight.arrivalAirport ? `${flight.arrivalAirport} (${flight.arrivalCode})` : flight.arrivalCity} |{" "}
                          <span style={{ color: "#0f172a" }}>
                            {flight.departureTime} às {flight.arrivalTime}
                          </span>
                        </div>

                        <div style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span>
                            <strong>Data:</strong> {flight.departureDate}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Voo:</strong> {flightNum} ({flight.airline})
                          </span>
                          {flight.duration && (
                            <>
                              <span>•</span>
                              <span>
                                <strong>Duração:</strong> {flight.duration}
                              </span>
                            </>
                          )}
                          {flight.departureTerminal && (
                            <>
                              <span>•</span>
                              <span>
                                <strong>Terminal Embarque:</strong> {flight.departureTerminal}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Baggage Info Line */}
                        <div
                          style={{
                            marginTop: "4px",
                            paddingTop: "6px",
                            borderTop: "1px dashed #e2e8f0",
                            fontSize: "12px",
                            color: "#334155",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>Bagagem:</span>
                          <span>🎒 {flight.baggageHand || "1 Item pessoal + 1 Mala de bordo (10kg)"}</span>
                          {flight.baggageChecked && (
                            <>
                              <span>•</span>
                              <span style={{ fontWeight: 600, color: "#0369a1" }}>🧳 {flight.baggageChecked}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {/* HOTEL SECTION (IF PRESENT) */}
        {(voucher.serviceType === "hotel" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.hotel && (
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "14px 16px",
              backgroundColor: "#f8fafc"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "13px", textTransform: "uppercase" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5">
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                </svg>
                Hospedagem / Hotel
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0369a1", backgroundColor: "#e0f2fe", padding: "3px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                Confirmação: {voucher.hotel.confirmationCode}
              </span>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>{voucher.hotel.hotelName}</h3>
                  {voucher.hotel.address && <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>{voucher.hotel.address}</p>}
                </div>
                {voucher.hotel.mealPlan && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", backgroundColor: "#ecfdf5", padding: "2px 8px", borderRadius: "4px", border: "1px solid #a7f3d0" }}>
                    {voucher.hotel.mealPlan}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", fontSize: "12px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Check-in</span>
                  <strong style={{ color: "#0f172a", fontSize: "13px" }}>{voucher.hotel.checkInDate}</strong> {voucher.hotel.checkInTime ? `a partir das ${voucher.hotel.checkInTime}` : ""}
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Check-out</span>
                  <strong style={{ color: "#0f172a", fontSize: "13px" }}>{voucher.hotel.checkOutDate}</strong> {voucher.hotel.checkOutTime ? `até às ${voucher.hotel.checkOutTime}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#334155", paddingTop: "4px", borderTop: "1px solid #f1f5f9" }}>
                <span><strong>Quarto:</strong> {voucher.hotel.roomCategory || "Standard"}</span>
                <span><strong>Acomodação:</strong> {voucher.hotel.roomsCount || 1} Quarto(s) • {voucher.hotel.guestsCount || 1} Hóspede(s)</span>
              </div>
            </div>
          </section>
        )}

        {/* CAR RENTAL SECTION (IF PRESENT) */}
        {(voucher.serviceType === "car" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.carRental && (
          <section style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px", backgroundColor: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "13px", textTransform: "uppercase" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                Locação de Veículo
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309", backgroundColor: "#fef3c7", padding: "3px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                Reserva: {voucher.carRental.confirmationCode}
              </span>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {voucher.carRental.rentalCompany} • {voucher.carRental.carModel || voucher.carRental.carCategory}
                  </h3>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Categoria / Grupo: {voucher.carRental.carCategory}</p>
                </div>
                {voucher.carRental.insuranceIncluded && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", backgroundColor: "#ecfdf5", padding: "2px 8px", borderRadius: "4px" }}>
                    Seguro Incluso
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px", fontSize: "12px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Retirada</span>
                  <strong style={{ color: "#0f172a" }}>{voucher.carRental.pickupLocation}</strong>
                  <div style={{ color: "#475569" }}>{voucher.carRental.pickupDateTime}</div>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "8px 10px", borderRadius: "6px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>Devolução</span>
                  <strong style={{ color: "#0f172a" }}>{voucher.carRental.dropoffLocation}</strong>
                  <div style={{ color: "#475569" }}>{voucher.carRental.dropoffDateTime}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* INSURANCE SECTION (IF PRESENT) */}
        {(voucher.serviceType === "insurance" || voucher.serviceType === "package" || voucher.serviceType === "combo") && voucher.insurance && (
          <section style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 16px", backgroundColor: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "13px", textTransform: "uppercase" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Seguro Viagem & Assistência Médica
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", backgroundColor: "#ecfdf5", padding: "3px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                Apólice: {voucher.insurance.policyNumber}
              </span>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{voucher.insurance.insurerName}</strong> • {voucher.insurance.planName}
                <div style={{ color: "#64748b", marginTop: "2px" }}>
                  Vigência: <strong>{voucher.insurance.coverageStart}</strong> a <strong>{voucher.insurance.coverageEnd}</strong> ({voucher.insurance.destinationArea || "Mundial"})
                </div>
              </div>
              {voucher.insurance.emergencyPhone && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Emergência Seguradora</span>
                  <span style={{ color: "#059669", fontWeight: 800, fontFamily: "monospace", fontSize: "13px" }}>{voucher.insurance.emergencyPhone}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FINANCIAL & PRICING SUMMARY SECTION */}
        {voucher.priceDisplayMode !== "sem_valor" && (
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px 16px",
              backgroundColor: "#f8fafc"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0f172a", fontWeight: 800, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                Resumo Financeiro & Tarifário
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                {voucher.priceDisplayMode === "apenas_total" ? "Valor Totalizador" : "RESUMO DA EMISSÃO"}
              </span>
            </div>

            {voucher.priceDisplayMode === "discriminado" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <span>Tarifa Base:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                    {formatCurrency(voucher.pricing.fare, voucher.pricing.currency)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                  <span>Taxas de Embarque / Aeroportuárias:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                    {formatCurrency(voucher.pricing.taxes, voucher.pricing.currency)}
                  </span>
                </div>
                {voucher.pricing.serviceFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                    <span>Taxa de Serviço / Agenciamento (DU/RAV):</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                      {formatCurrency(voucher.pricing.serviceFee, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                {voucher.pricing.otherFees > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                    <span>Outros Encargos:</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                      {formatCurrency(voucher.pricing.otherFees, voucher.pricing.currency)}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "6px", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                  <span>Valor Total da Emissão:</span>
                  <span style={{ fontFamily: "monospace", fontSize: "17px", fontWeight: 900, color: primaryColor }}>
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
                  backgroundColor: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0"
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
        <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
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
        <footer style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>
            Voucher nº {voucher.voucherNumber} • Emissão: {voucher.issueDate} • Status:{" "}
            <span style={{ color: "#059669", fontWeight: 700 }}>Confirmado</span> • Conforme LGPD, dados sensíveis protegidos.
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
