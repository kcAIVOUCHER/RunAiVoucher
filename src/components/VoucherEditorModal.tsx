import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Calculator,
  Check,
  Plane,
  Building2,
  Car,
  Shield,
  Ticket,
  Ship,
  Sparkles,
  Bus,
  MapPin,
  Clock,
  User
} from "lucide-react";
import {
  Voucher,
  Passenger,
  FlightSegment,
  CarRentalBooking,
  InsuranceBooking,
  TicketBooking,
  CruiseBooking,
  HotelBooking
} from "../types";

interface VoucherEditorModalProps {
  voucher: Voucher;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVoucher: Voucher) => void;
}

export const VoucherEditorModal: React.FC<VoucherEditorModalProps> = ({
  voucher,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<Voucher>({ ...voucher });
  const [activeTab, setActiveTab] = useState<string>("geral");

  const handlePriceChange = (field: keyof typeof formData.pricing, val: number) => {
    const updatedPricing = {
      ...formData.pricing,
      [field]: val
    };

    if (field !== "total") {
      // Auto calculate total
      const fare = field === "fare" ? val : updatedPricing.fare || 0;
      const taxes = field === "taxes" ? val : updatedPricing.taxes || 0;
      const serviceFee = field === "serviceFee" ? val : updatedPricing.serviceFee || 0;
      const otherFees = field === "otherFees" ? val : updatedPricing.otherFees || 0;
      updatedPricing.total = Number((fare + taxes + serviceFee + otherFees).toFixed(2));
    }

    setFormData({
      ...formData,
      pricing: updatedPricing
    });
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...formData.passengers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, passengers: updated });
  };

  const addPassenger = () => {
    const newPassenger: Passenger = {
      name: "NOVO PASSAGEIRO",
      ticketNumber: "",
      document: "",
      seat: ""
    };
    setFormData({ ...formData, passengers: [...formData.passengers, newPassenger] });
  };

  const removePassenger = (index: number) => {
    const updated = formData.passengers.filter((_, i) => i !== index);
    setFormData({ ...formData, passengers: updated });
  };

  const updateFlight = (index: number, field: keyof FlightSegment, value: any) => {
    const updated = [...formData.flights];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, flights: updated });
  };

  const addFlight = () => {
    const newFlight: FlightSegment = {
      id: `fl-${Date.now()}`,
      airline: "LATAM Airlines",
      airlineCode: "LA",
      flightNumber: "LA 0000",
      departureAirport: "Aeroporto",
      departureCode: "ORIG",
      departureDate: new Date().toLocaleDateString("pt-BR"),
      departureTime: "10:00",
      arrivalAirport: "Aeroporto",
      arrivalCode: "DEST",
      arrivalDate: new Date().toLocaleDateString("pt-BR"),
      arrivalTime: "12:00",
      bookingClass: "Y",
      fareFamily: "Plus",
      baggageHand: "1 Mochila + 1 Mala de bordo 10kg",
      baggageChecked: "1 Peça até 23kg inclusa"
    };
    setFormData({ ...formData, flights: [...formData.flights, newFlight] });
  };

  const removeFlight = (index: number) => {
    const updated = formData.flights.filter((_, i) => i !== index);
    setFormData({ ...formData, flights: updated });
  };

  const handleSave = () => {
    const isFlightOrPackage = formData.serviceType === "flight" || formData.serviceType === "package" || formData.serviceType === "combo";
    const cleanedVoucher: Voucher = {
      ...formData,
      flights: isFlightOrPackage ? formData.flights : [],
      hotel: (formData.serviceType === "hotel" || formData.serviceType === "package" || formData.serviceType === "combo") ? formData.hotel : null,
      carRental: (formData.serviceType === "car" || formData.serviceType === "package" || formData.serviceType === "combo") ? formData.carRental : null,
      insurance: (formData.serviceType === "insurance" || formData.serviceType === "package" || formData.serviceType === "combo") ? formData.insurance : null,
      ticket: (formData.serviceType === "ticket" || formData.serviceType === "package" || formData.serviceType === "combo") ? formData.ticket : null,
      cruise: (formData.serviceType === "cruise" || formData.serviceType === "package" || formData.serviceType === "combo") ? formData.cruise : null,
      transfer: (formData.serviceType === "transfer" || formData.serviceType === "package" || formData.serviceType === "combo") ? formData.transfer : null,
    };
    onSave(cleanedVoucher);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Editar Dados do Voucher
            </h2>
            <p className="text-xs text-slate-500">
              Ajuste passageiros, horários, bagagens e valores tarifários com total autonomia.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipo do Voucher / Produto:
              </label>
              <select
                value={formData.serviceType || "flight"}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  const isFlightOrPkg = newType === "flight" || newType === "package" || newType === "combo";
                  const updated: any = {
                    ...formData,
                    serviceType: newType,
                    // Clear previous mock flights if switching to a non-flight single service
                    flights: isFlightOrPkg ? formData.flights : []
                  };
                  if (newType === "hotel" && !updated.hotel) {
                    updated.hotel = { hotelName: "Hotel", checkInDate: "", checkOutDate: "", roomType: "", mealPlan: "" };
                  }
                  if (newType === "car" && !updated.carRental) {
                    updated.carRental = { rentalCompany: "Localiza", carModelOrCategory: "Grupo B - Compacto", pickupLocation: "Aeroporto", dropoffLocation: "Aeroporto" };
                  }
                  if (newType === "insurance" && !updated.insurance) {
                    updated.insurance = { provider: "Assist Card", planName: "Plano Internacional 60K", medicalCoverage: "USD 60.000" };
                  }
                  if (newType === "ticket" && !updated.ticket) {
                    updated.ticket = { attractionName: "Ingresso Atração", ticketType: "Acesso Geral", supplierOrPark: "Parque" };
                  }
                  if (newType === "cruise" && !updated.cruise) {
                    updated.cruise = { cruiseLine: "MSC Cruzeiros", shipName: "MSC Grandiosa", departurePort: "Santos, SP" };
                  }
                  if (newType === "package") {
                    if (!updated.hotel) updated.hotel = { hotelName: "Hotel Resort", checkInDate: "", checkOutDate: "" };
                    if (!updated.insurance) updated.insurance = { provider: "Seguradora", planName: "Plano Completo" };
                  }
                  setFormData(updated);
                }}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-semibold text-xs text-slate-800"
              >
                <option value="flight">✈️ Aéreo (Voo)</option>
                <option value="hotel">🏨 Hotel / Hospedagem</option>
                <option value="car">🚗 Carro / Locação</option>
                <option value="insurance">🛡️ Seguro Viagem</option>
                <option value="ticket">🎟️ Ingresso / Tour</option>
                <option value="cruise">🚢 Navio / Cruzeiro</option>
                <option value="package">🧳 Pacote Completo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Localizador (PNR):
              </label>
              <input
                type="text"
                value={formData.pnr}
                onChange={(e) => setFormData({ ...formData, pnr: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Número do Voucher:
              </label>
              <input
                type="text"
                value={formData.voucherNumber}
                onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Data de Emissão:
              </label>
              <input
                type="text"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800"
              />
            </div>
          </div>

          {/* Pricing autonomy section */}
          <div className="border border-sky-200 bg-sky-50/40 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-950 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-sky-600" />
                Valores e Tarifas (Edição Livre)
              </span>
              <span className="text-xs text-slate-500">
                Os valores abaixo respeitarão o modo escolhido (Sem valor, Total ou Discriminado).
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tarifa Base (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.fare}
                  onChange={(e) => handlePriceChange("fare", parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Taxas Embarque (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.taxes}
                  onChange={(e) => handlePriceChange("taxes", parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Taxa DU / RAV (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.serviceFee}
                  onChange={(e) => handlePriceChange("serviceFee", parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Outras Taxas (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.otherFees}
                  onChange={(e) => handlePriceChange("otherFees", parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-900 mb-1">
                  Total Final (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricing.total}
                  onChange={(e) => handlePriceChange("total", parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-sky-100 border border-sky-300 font-bold rounded text-sm font-mono text-sky-950"
                />
              </div>
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Passageiros & Viajantes</span>
                <p className="text-[11px] text-emerald-700 font-medium">
                  🔒 Conforme a LGPD brasileira, o CPF é protegido contra exibição pública. A data de nascimento pode constar no bilhete.
                </p>
              </div>
              <button
                type="button"
                onClick={addPassenger}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Passageiro
              </button>
            </div>

            {formData.passengers.map((p, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50/60 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nome do Passageiro:</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={p.name}
                      onChange={(e) => updatePassenger(idx, "name", e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-medium text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Data de Nascimento:</label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={p.birthDate || ""}
                      onChange={(e) => updatePassenger(idx, "birthDate", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nº Bilhete / E-ticket:</label>
                    <input
                      type="text"
                      placeholder="123-4567890"
                      value={p.ticketNumber || ""}
                      onChange={(e) => updatePassenger(idx, "ticketNumber", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end gap-1.5">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Assento:</label>
                      <input
                        type="text"
                        placeholder="Ex: 04A"
                        value={p.seat || ""}
                        onChange={(e) => updatePassenger(idx, "seat", e.target.value.toUpperCase())}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-center font-bold"
                      />
                    </div>
                    {formData.passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 mb-0.5 rounded hover:bg-red-50"
                        title="Remover passageiro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flights list */}
          {(formData.serviceType === "flight" || formData.serviceType === "package" || formData.serviceType === "combo") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Trechos de Voo</span>
              <button
                type="button"
                onClick={addFlight}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Trecho
              </button>
            </div>

            {formData.flights.map((f, idx) => (
              <div key={f.id || idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
                    Trecho #{idx + 1}
                  </span>
                  {formData.flights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFlight(idx)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Trecho
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500">Cia Aérea:</label>
                    <input
                      type="text"
                      value={f.airline}
                      onChange={(e) => updateFlight(idx, "airline", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Nº do Voo:</label>
                    <input
                      type="text"
                      value={f.flightNumber}
                      onChange={(e) => updateFlight(idx, "flightNumber", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Classe (Y, Q...):</label>
                    <input
                      type="text"
                      value={f.bookingClass || ""}
                      onChange={(e) => updateFlight(idx, "bookingClass", e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Família (Light/Plus...):</label>
                    <input
                      type="text"
                      value={f.fareFamily || ""}
                      onChange={(e) => updateFlight(idx, "fareFamily", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500">Origem (IATA / Nome):</label>
                    <input
                      type="text"
                      value={f.departureCode}
                      onChange={(e) => updateFlight(idx, "departureCode", e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Data / Hora Partida:</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={f.departureDate}
                        onChange={(e) => updateFlight(idx, "departureDate", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={f.departureTime}
                        onChange={(e) => updateFlight(idx, "departureTime", e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Destino (IATA / Nome):</label>
                    <input
                      type="text"
                      value={f.arrivalCode}
                      onChange={(e) => updateFlight(idx, "arrivalCode", e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Data / Hora Chegada:</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={f.arrivalDate}
                        onChange={(e) => updateFlight(idx, "arrivalDate", e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={f.arrivalTime}
                        onChange={(e) => updateFlight(idx, "arrivalTime", e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200 items-center">
                  <div>
                    <label className="block text-[11px] text-slate-500">Bagagem de Mão:</label>
                    <input
                      type="text"
                      value={f.baggageHand || ""}
                      onChange={(e) => updateFlight(idx, "baggageHand", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Bagagem Despachada:</label>
                    <input
                      type="text"
                      value={f.baggageChecked || ""}
                      onChange={(e) => updateFlight(idx, "baggageChecked", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-semibold">Regra de Embarque Aéreo:</label>
                    <select
                      value={f.isInternational ? "intl" : "dom"}
                      onChange={(e) => updateFlight(idx, "isInternational", e.target.value === "intl")}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800"
                    >
                      <option value="dom">🇧🇷 Nacional (Chegada 2h antes)</option>
                      <option value="intl">🌍 Internacional (Chegada 3h antes)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HOTEL SECTION */}
          {(formData.hotel || formData.serviceType === "hotel" || formData.serviceType === "package") && (
            <div className="border border-emerald-200 bg-emerald-50/40 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Dados da Hospedagem (Hotel)
                </span>
                {formData.hotel ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hotel: null })}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remover Hotel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        hotel: {
                          hotelName: "Hotel",
                          checkInDate: "",
                          checkOutDate: "",
                          roomType: "Standard",
                          mealPlan: "Café da manhã incluso"
                        }
                      })
                    }
                    className="text-xs text-emerald-700 font-semibold"
                  >
                    + Habilitar Hotel
                  </button>
                )}
              </div>

              {formData.hotel && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome do Hotel:</label>
                    <input
                      type="text"
                      value={formData.hotel.hotelName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, hotelName: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código de Confirmação:</label>
                    <input
                      type="text"
                      value={formData.hotel.confirmationCode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, confirmationCode: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={formData.hotel.address || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, address: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cidade / UF:</label>
                    <input
                      type="text"
                      value={formData.hotel.city || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, city: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Check-in:</label>
                    <input
                      type="text"
                      value={formData.hotel.checkInDate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, checkInDate: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Check-out:</label>
                    <input
                      type="text"
                      value={formData.hotel.checkOutDate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, checkOutDate: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Regime / Refeições:</label>
                    <input
                      type="text"
                      value={formData.hotel.mealPlan || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hotel: { ...formData.hotel!, mealPlan: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAR RENTAL SECTION */}
          {(formData.carRental || formData.serviceType === "car" || formData.serviceType === "package") && (
            <div className="border border-amber-200 bg-amber-50/40 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-amber-600" />
                  Locação de Veículo (Carro)
                </span>
                {formData.carRental ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, carRental: null })}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remover Carro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        carRental: {
                          rentalCompany: "Localiza",
                          carModelOrCategory: "Grupo B - Compacto c/ Ar",
                          pickupLocation: "Aeroporto",
                          dropoffLocation: "Aeroporto"
                        }
                      })
                    }
                    className="text-xs text-amber-700 font-semibold"
                  >
                    + Habilitar Carro
                  </button>
                )}
              </div>

              {formData.carRental && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Locadora:</label>
                    <input
                      type="text"
                      value={formData.carRental.rentalCompany || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRental: { ...formData.carRental!, rentalCompany: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Modelo / Categoria:</label>
                    <input
                      type="text"
                      value={formData.carRental.carModelOrCategory || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRental: { ...formData.carRental!, carModelOrCategory: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código de Reserva:</label>
                    <input
                      type="text"
                      value={formData.carRental.confirmationCode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRental: { ...formData.carRental!, confirmationCode: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Retirada (Local e Data):</label>
                    <input
                      type="text"
                      value={`${formData.carRental.pickupLocation || ""} - ${formData.carRental.pickupDate || ""}`}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRental: { ...formData.carRental!, pickupLocation: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Devolução (Local e Data):</label>
                    <input
                      type="text"
                      value={`${formData.carRental.dropoffLocation || ""} - ${formData.carRental.dropoffDate || ""}`}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRental: { ...formData.carRental!, dropoffLocation: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Coberturas / Seguros:</label>
                    <input
                      type="text"
                      value={formData.carRental.includedCoverage || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carRental: { ...formData.carRental!, includedCoverage: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INSURANCE SECTION */}
          {(formData.insurance || formData.serviceType === "insurance" || formData.serviceType === "package") && (
            <div className="border border-teal-200 bg-teal-50/40 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-teal-600" />
                  Seguro Viagem & Assistência Médica
                </span>
                {formData.insurance ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, insurance: null })}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remover Seguro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        insurance: {
                          provider: "Assist Card",
                          planName: "Internacional 60K",
                          medicalCoverage: "USD 60.000"
                        }
                      })
                    }
                    className="text-xs text-teal-700 font-semibold"
                  >
                    + Habilitar Seguro
                  </button>
                )}
              </div>

              {formData.insurance && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Seguradora / Provedor:</label>
                    <input
                      type="text"
                      value={formData.insurance.provider || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, provider: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome do Plano:</label>
                    <input
                      type="text"
                      value={formData.insurance.planName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, planName: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº Apólice / Bilhete:</label>
                    <input
                      type="text"
                      value={formData.insurance.policyNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, policyNumber: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cobertura Médica (DMH):</label>
                    <input
                      type="text"
                      value={formData.insurance.medicalCoverage || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, medicalCoverage: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vigência (Início a Fim):</label>
                    <input
                      type="text"
                      value={`${formData.insurance.startDate || ""} a ${formData.insurance.endDate || ""}`}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, startDate: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Central de Emergência 24h:</label>
                    <input
                      type="text"
                      value={formData.insurance.emergencyPhone24h || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insurance: { ...formData.insurance!, emergencyPhone24h: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TICKET / ATTRACTION SECTION */}
          {(formData.ticket || formData.serviceType === "ticket" || formData.serviceType === "package") && (
            <div className="border border-purple-200 bg-purple-50/40 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-purple-600" />
                  Ingressos, Passeios & Parques
                </span>
                {formData.ticket ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ticket: null })}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remover Ingresso
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        ticket: {
                          attractionName: "Ingresso Parque",
                          supplierOrPark: "Parque Temático",
                          ticketType: "Acesso Geral 1 Dia"
                        }
                      })
                    }
                    className="text-xs text-purple-700 font-semibold"
                  >
                    + Habilitar Ingresso
                  </button>
                )}
              </div>

              {formData.ticket && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Atração / Tour:</label>
                    <input
                      type="text"
                      value={formData.ticket.attractionName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ticket: { ...formData.ticket!, attractionName: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código / E-ticket:</label>
                    <input
                      type="text"
                      value={formData.ticket.ticketNumberOrCode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ticket: { ...formData.ticket!, ticketNumberOrCode: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Parque / Fornecedor:</label>
                    <input
                      type="text"
                      value={formData.ticket.supplierOrPark || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ticket: { ...formData.ticket!, supplierOrPark: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data / Validade:</label>
                    <input
                      type="text"
                      value={formData.ticket.date || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ticket: { ...formData.ticket!, date: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instruções / Acesso:</label>
                    <input
                      type="text"
                      value={formData.ticket.importantInstructions || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ticket: { ...formData.ticket!, importantInstructions: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CRUISE / SHIP SECTION */}
          {(formData.cruise || formData.serviceType === "cruise" || formData.serviceType === "package") && (
            <div className="border border-cyan-200 bg-cyan-50/40 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-cyan-600" />
                  Cruzeiro Marítimo (Navio)
                </span>
                {formData.cruise ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, cruise: null })}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remover Cruzeiro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        cruise: {
                          cruiseLine: "MSC Cruzeiros",
                          shipName: "MSC Grandiosa",
                          departurePort: "Porto de Santos, SP"
                        }
                      })
                    }
                    className="text-xs text-cyan-700 font-semibold"
                  >
                    + Habilitar Cruzeiro
                  </button>
                )}
              </div>

              {formData.cruise && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cia Marítima:</label>
                    <input
                      type="text"
                      value={formData.cruise.cruiseLine || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cruise: { ...formData.cruise!, cruiseLine: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome do Navio:</label>
                    <input
                      type="text"
                      value={formData.cruise.shipName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cruise: { ...formData.cruise!, shipName: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº Booking / Reserva:</label>
                    <input
                      type="text"
                      value={formData.cruise.bookingNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cruise: { ...formData.cruise!, bookingNumber: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Porto de Embarque:</label>
                    <input
                      type="text"
                      value={formData.cruise.departurePort || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cruise: { ...formData.cruise!, departurePort: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cabine:</label>
                    <input
                      type="text"
                      value={formData.cruise.cabinNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cruise: { ...formData.cruise!, cabinNumber: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Itinerário:</label>
                    <input
                      type="text"
                      value={formData.cruise.itinerarySummary || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cruise: { ...formData.cruise!, itinerarySummary: e.target.value }
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação Livre Opcional (Deixe em branco para voucher mais limpo em 1 página):
            </label>
            <textarea
              rows={2}
              value={formData.notes || ""}
              placeholder="Texto livre específico desta reserva (ex: Centro de Custo, autorização especial). Deixe em branco para manter o layout limpo."
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" /> Aplicar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
