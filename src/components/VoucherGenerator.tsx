import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  Printer,
  Download,
  Loader2,
  Save,
  Share2,
  Edit3,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  CreditCard,
  DollarSign,
  ChevronDown,
  Info,
  ShieldAlert
} from "lucide-react";
import {
  Voucher,
  AgencyProfile,
  Company,
  PriceDisplayMode,
  FlightSegment,
  Passenger,
  ServiceType
} from "../types";
import { VoucherDocument } from "./VoucherDocument";
import { VoucherEditorModal } from "./VoucherEditorModal";
import { downloadVoucherPdf } from "../utils/pdfGenerator";

interface VoucherGeneratorProps {
  agency: AgencyProfile;
  companies: Company[];
  initialVoucher?: Voucher | null;
  onSaveVoucher: (voucher: Voucher) => Promise<void>;
  onNavigateToCompanies?: () => void;
}

export const VoucherGenerator: React.FC<VoucherGeneratorProps> = ({
  agency,
  companies,
  initialVoucher,
  onSaveVoucher,
  onNavigateToCompanies
}) => {
  // Input states
  const [inputText, setInputText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{
    name: string;
    base64: string;
    mimeType: string;
  }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [processStatus, setProcessStatus] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [geminiSuccessMsg, setGeminiSuccessMsg] = useState<string | null>(null);
  const [geminiWarningMsg, setGeminiWarningMsg] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMsg, setPdfSuccessMsg] = useState(false);

  // Progressive simulated stages for AiVoucher extraction
  const CAPTURE_STAGES = [
    { step: 1, title: "Análise Estrutural", detail: "Lendo documento e reconhecendo layout do bilhete..." },
    { step: 2, title: "Localizador & Itinerário", detail: "Capturando PNR, companhia aérea, voos e datas..." },
    { step: 3, title: "Passageiros & Documentos", detail: "Identificando nomes, e-tickets, documentos e assentos..." },
    { step: 4, title: "Tarifas & Franquias", detail: "Calculando valores, taxas de embarque e regras de bagagem..." },
    { step: 5, title: "AiVoucher Engine", detail: "Preenchendo e formatando campos com precisão..." }
  ];

  // Helper to create an empty clean voucher
  const createEmptyVoucher = (): Voucher => ({
    id: `vouch-${Date.now()}`,
    voucherNumber: `VOU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    pnr: "",
    issueDate: new Date().toLocaleDateString("pt-BR"),
    agencyId: agency.id,
    companyId: companies[0]?.id || null,
    companyName: companies[0]?.name || undefined,
    companyLogoUrl: companies[0]?.logoUrl || undefined,
    serviceType: "flight",
    passengers: [],
    flights: [],
    hotel: null,
    carRental: null,
    insurance: null,
    ticket: null,
    cruise: null,
    transfer: null,
    pricing: {
      currency: "BRL",
      fare: 0,
      taxes: 0,
      serviceFee: 0,
      otherFees: 0,
      total: 0
    },
    priceDisplayMode: companies[0]?.defaultPriceDisplay || "sem_valor",
    hideFareFamily: companies[0]?.hideFareFamilyByDefault ?? true,
    hideBookingClass: companies[0]?.hideClassByDefault ?? true,
    status: "emitted",
    notes: agency.footerNotes || "",
    emergencyContact: agency.emergencyPhone || agency.phone,
    createdAt: new Date().toISOString()
  });

  // Track if a voucher has been generated, uploaded, or loaded from history
  const [isVoucherReady, setIsVoucherReady] = useState<boolean>(() => !!initialVoucher);

  // Active Voucher state
  const [currentVoucher, setCurrentVoucher] = useState<Voucher>(() => {
    if (initialVoucher) return initialVoucher;
    return createEmptyVoucher();
  });

  // Sync with initialVoucher if updated from props (e.g. clicking a voucher in History)
  useEffect(() => {
    if (initialVoucher) {
      setCurrentVoucher(initialVoucher);
      setIsVoucherReady(true);
    }
  }, [initialVoucher]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [appliedDefaultsFeedback, setAppliedDefaultsFeedback] = useState<string | null>(null);

  // Selected company object
  const selectedCompany = companies.find((c) => c.id === currentVoucher.companyId) || null;

  // Handle company change - THE CORE USER REQUIREMENT
  const handleCompanyChange = (companyId: string) => {
    if (companyId === "none") {
      // Direct / No corporate client
      setCurrentVoucher((prev) => ({
        ...prev,
        companyId: null,
        companyName: undefined,
        companyLogoUrl: undefined,
        priceDisplayMode: agency.defaultPriceDisplay || "apenas_total",
        hideFareFamily: agency.hideFareFamilyByDefault ?? false,
        hideBookingClass: agency.hideClassByDefault ?? true
      }));
      setAppliedDefaultsFeedback("Voucher sem empresa vinculada (Padrão da Agência)");
      setTimeout(() => setAppliedDefaultsFeedback(null), 4000);
      return;
    }

    const company = companies.find((c) => c.id === companyId);
    if (!company) return;

    // Automatically pulls pre-defined rules:
    setCurrentVoucher((prev) => ({
      ...prev,
      companyId: company.id,
      companyName: company.tradeName || company.name,
      companyLogoUrl: company.logoUrl,
      // Pull pre-configured defaults:
      priceDisplayMode: company.defaultPriceDisplay,
      hideFareFamily: company.hideFareFamilyByDefault,
      hideBookingClass: company.hideClassByDefault,
      notes: company.customNotes
        ? `${agency.footerNotes} • Regra Corporativa: ${company.customNotes}`
        : prev.notes
    }));

    const priceLabel =
      company.defaultPriceDisplay === "sem_valor"
        ? "Sem Valor"
        : company.defaultPriceDisplay === "apenas_total"
        ? "Apenas Total"
        : "Valores Discriminados";

    setAppliedDefaultsFeedback(
      `Pré-definições de ${company.tradeName || company.name} aplicadas: ${priceLabel} • ${
        company.hideFareFamilyByDefault ? "Ocultar Famílias" : "Mostrar Famílias"
      } • ${company.hideClassByDefault ? "Ocultar Classes" : "Mostrar Classes"}`
    );
    setTimeout(() => setAppliedDefaultsFeedback(null), 5000);
  };

  // Handle File Upload (PDF or Image)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    Promise.all(
      newFiles.map((file) => {
        return new Promise<{name: string; base64: string; mimeType: string;}>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve({
              name: file.name,
              base64: base64Data,
              mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg")
            });
          };
          reader.readAsDataURL(file);
        });
      })
    ).then((processedFiles) => {
      setSelectedFiles((prev) => [...prev, ...processedFiles]);
      setParseError(null);
    });
    
    // Reset input so the same files can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  // Call Gemini API to parse
  const handleProcessWithGemini = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) {
      setParseError("Por favor, cole um texto ou selecione pelo menos um arquivo (PDF ou Imagem) primeiro.");
      return;
    }

    setIsProcessing(true);
    setParseError(null);
    setCurrentStageIndex(0);
    setProcessStatus(CAPTURE_STAGES[0].detail);

    // Progressive simulated stages for real-time capture feedback
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        const next = prev < CAPTURE_STAGES.length - 1 ? prev + 1 : prev;
        setProcessStatus(CAPTURE_STAGES[next].detail);
        return next;
      });
    }, 700);

    try {
      const payload: any = {};
      if (inputText.trim()) {
        payload.text = inputText.trim();
      }
      if (selectedFiles.length > 0) {
        payload.files = selectedFiles.map(f => ({
          base64: f.base64,
          mimeType: f.mimeType
        }));
      }

      const response = await fetch("/api/parse-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Não foi possível extrair os dados do documento através do AiVoucher Intelligence.");
      }

      const extracted = result.data;

      // Update current voucher with extracted data, keeping active company defaults
      setCurrentVoucher((prev) => {
        const flights: FlightSegment[] = (extracted.flights || []).map((f: any, idx: number) => ({
          id: `fl-${Date.now()}-${idx}`,
          airline: f.airline || "Cia Aérea",
          airlineCode: f.airlineCode || "",
          flightNumber: f.flightNumber || "",
          isInternational: Boolean(f.isInternational),
          departureAirport: f.departureAirport || "",
          departureCode: f.departureCode || "ORIG",
          departureCity: f.departureCity || "",
          departureDate: f.departureDate || new Date().toLocaleDateString("pt-BR"),
          departureTime: f.departureTime || "08:00",
          departureTerminal: f.departureTerminal || "",
          arrivalAirport: f.arrivalAirport || "",
          arrivalCode: f.arrivalCode || "DEST",
          arrivalCity: f.arrivalCity || "",
          arrivalDate: f.arrivalDate || new Date().toLocaleDateString("pt-BR"),
          arrivalTime: f.arrivalTime || "10:00",
          arrivalTerminal: f.arrivalTerminal || "",
          cabinClass: f.cabinClass || "Econômica",
          bookingClass: f.bookingClass || "Y",
          fareFamily: f.fareFamily || "",
          baggageHand: f.baggageHand || "1 Mochila/Bolsa + 1 Mala de bordo até 10kg",
          baggageChecked: f.baggageChecked || "Consulte franquia da cia",
          aircraft: f.aircraft || "",
          duration: f.duration || ""
        }));

        const passengers: Passenger[] = (extracted.passengers || []).map((p: any, idx: number) => ({
          id: `pax-${Date.now()}-${idx}`,
          name: p.name || "PASSAGEIRO",
          ticketNumber: p.ticketNumber || "",
          document: p.document || "",
          birthDate: p.birthDate || "",
          loyaltyNumber: p.loyaltyNumber || "",
          seat: p.seat || ""
        }));

        const pricing = {
          currency: extracted.pricing?.currency || "BRL",
          fare: Number(extracted.pricing?.fare) || 0,
          taxes: Number(extracted.pricing?.taxes) || 0,
          serviceFee: Number(extracted.pricing?.serviceFee) || 0,
          otherFees: Number(extracted.pricing?.otherFees) || 0,
          total: Number(extracted.pricing?.total) || 0
        };

        // Recalculate total if extracted fare exists but total was 0
        if (pricing.total === 0 && (pricing.fare > 0 || pricing.taxes > 0)) {
          pricing.total = pricing.fare + pricing.taxes + pricing.serviceFee + pricing.otherFees;
        }

        // Determine accurate service type based on extracted data
        const detectedServiceType: ServiceType =
          extracted.serviceType ||
          (extracted.carRental ? "car" :
           extracted.hotel ? "hotel" :
           extracted.insurance ? "insurance" :
           extracted.ticket ? "ticket" :
           extracted.cruise ? "cruise" :
           extracted.transfer ? "transfer" :
           flights.length > 0 ? "flight" :
           "flight");

        // Determine passenger list, prioritizing driver or guests if passengers array is empty
        let finalPassengers: Passenger[] = passengers;
        if (finalPassengers.length === 0) {
          if (extracted.carRental?.driverName) {
            finalPassengers = [
              {
                id: `pax-${Date.now()}-0`,
                name: extracted.carRental.driverName,
                ticketNumber: extracted.carRental.confirmationCode || "",
                document: extracted.carRental.driverDocument || "Condutor",
                birthDate: "",
                loyaltyNumber: "",
                seat: ""
              }
            ];
          } else if (extracted.hotel?.guestsNames && extracted.hotel.guestsNames.length > 0) {
            finalPassengers = extracted.hotel.guestsNames.map((g: string, idx: number) => ({
              id: `pax-${Date.now()}-${idx}`,
              name: g,
              ticketNumber: extracted.hotel.confirmationCode || "",
              document: "",
              birthDate: "",
              loyaltyNumber: "",
              seat: ""
            }));
          } else if (extracted.insurance?.insuredNames && extracted.insurance.insuredNames.length > 0) {
            finalPassengers = extracted.insurance.insuredNames.map((n: string, idx: number) => ({
              id: `pax-${Date.now()}-${idx}`,
              name: n,
              ticketNumber: extracted.insurance.policyNumber || "",
              document: "",
              birthDate: "",
              loyaltyNumber: "",
              seat: ""
            }));
          } else {
            finalPassengers = prev.passengers;
          }
        }

        const finalPnr =
          extracted.pnr ||
          extracted.carRental?.confirmationCode ||
          extracted.hotel?.confirmationCode ||
          extracted.insurance?.policyNumber ||
          extracted.ticket?.ticketNumberOrCode ||
          prev.pnr;

        // Clean out irrelevant test/mock data from other services when importing a specific service
        const isPackage = detectedServiceType === "package" || detectedServiceType === "combo";

        return {
          ...prev,
          pnr: finalPnr,
          serviceType: detectedServiceType,
          passengers: finalPassengers,
          // CRITICAL: If importing a car rental, hotel, etc., NEVER retain previous mock flight segments!
          flights: (isPackage || detectedServiceType === "flight") ? flights : [],
          hotel: (isPackage || detectedServiceType === "hotel") ? (extracted.hotel || null) : null,
          carRental: (isPackage || detectedServiceType === "car") ? (extracted.carRental || null) : null,
          insurance: (isPackage || detectedServiceType === "insurance") ? (extracted.insurance || null) : null,
          ticket: (isPackage || detectedServiceType === "ticket") ? (extracted.ticket || null) : null,
          cruise: (isPackage || detectedServiceType === "cruise") ? (extracted.cruise || null) : null,
          transfer: (isPackage || detectedServiceType === "transfer") ? (extracted.transfer || null) : null,
          pricing: pricing.total > 0 ? pricing : prev.pricing,
          notes: extracted.notes || ""
        };
      });

      setIsVoucherReady(true);
      setCurrentStageIndex(CAPTURE_STAGES.length - 1);
      setGeminiSuccessMsg("Dados extraídos e preenchidos com sucesso pelo AiVoucher Engine!");

      if (result.warning) {
        setGeminiWarningMsg(result.warning);
      } else {
        setGeminiWarningMsg(null);
      }

      setProcessStatus("Campos preenchidos e estruturados com sucesso!");
      setTimeout(() => {
        setProcessStatus("");
        setGeminiSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "Erro ao conectar com o serviço AiVoucher Intelligence.");
    } finally {
      clearInterval(stageInterval);
      setIsProcessing(false);
    }
  };

  // Print via browser
  const handlePrint = () => {
    window.print();
  };

  // Download real PDF file (.pdf) directly & Auto-Save
  const handleDownloadRealPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      // Auto-save to history and database when generating PDF
      try {
        await onSaveVoucher(currentVoucher);
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 3000);
      } catch (saveErr) {
        console.warn("Auto-save alongside PDF download error:", saveErr);
      }

      const targetCompany = companies.find((c) => c.id === currentVoucher.companyId);
      const clientName = targetCompany?.tradeName || targetCompany?.name || agency.tradeName || agency.name;
      const cleanClient = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const cleanPnr = (currentVoucher.pnr || "VOUCHER").replace(/[^a-zA-Z0-9_-]/g, "");
      const filename = `Voucher_${cleanPnr}_${cleanClient}.pdf`;

      await downloadVoucherPdf({
        filename,
        elementId: "voucher-print-area",
        voucher: currentVoucher,
        agency,
        company: targetCompany
      });

      setPdfSuccessMsg(true);
      setTimeout(() => setPdfSuccessMsg(false), 4000);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      // If canvas generation fails or is restricted, fallback smoothly to browser print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Reset voucher / clear test data
  const handleResetVoucher = () => {
    if (window.confirm("Deseja limpar todos os dados e iniciar um novo voucher em branco?")) {
      setInputText("");
      setSelectedFiles([]);
      setParseError(null);
      setGeminiSuccessMsg(null);
      setGeminiWarningMsg(null);
      setCurrentVoucher(createEmptyVoucher());
      setIsVoucherReady(false);
    }
  };

  // Save to DB
  const handleSave = async () => {
    try {
      await onSaveVoucher(currentVoucher);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy WhatsApp
  const handleCopyWhatsApp = () => {
    const paxNames = currentVoucher.passengers.map((p) => p.name).filter(Boolean).join(", ");
    let details = "";

    if (currentVoucher.serviceType === "car" && currentVoucher.carRental) {
      details =
        `🚗 *Locadora:* ${currentVoucher.carRental.rentalCompany}\n` +
        `*Categoria:* ${currentVoucher.carRental.carModelOrCategory}\n` +
        `*Retirada:* ${currentVoucher.carRental.pickupLocation} em ${currentVoucher.carRental.pickupDate} às ${currentVoucher.carRental.pickupTime}\n` +
        `*Devolução:* ${currentVoucher.carRental.dropoffLocation} em ${currentVoucher.carRental.dropoffDate} às ${currentVoucher.carRental.dropoffTime}\n` +
        `*Condutor:* ${currentVoucher.carRental.driverName}`;
    } else if (currentVoucher.serviceType === "hotel" && currentVoucher.hotel) {
      details =
        `🏨 *Hotel:* ${currentVoucher.hotel.hotelName}\n` +
        (currentVoucher.hotel.address ? `*Endereço:* ${currentVoucher.hotel.address}\n` : "") +
        `*Check-in:* ${currentVoucher.hotel.checkInDate} | *Check-out:* ${currentVoucher.hotel.checkOutDate}\n` +
        `*Acomodação:* ${currentVoucher.hotel.roomType || "Padrão"}`;
    } else if (currentVoucher.flights && currentVoucher.flights.length > 0) {
      details =
        `*Itinerário:*\n` +
        currentVoucher.flights
          .map(
            (f) =>
              `✈️ *${f.airline} (${f.flightNumber})*: ${f.departureCode} (${f.departureTime}) ➔ ${f.arrivalCode} (${f.arrivalTime}) em ${f.departureDate}`
          )
          .join("\n");
    }

    const text =
      `🎫 *VOUCHER DE VIAGEM CONFIRMADO*\n` +
      `*Localizador / Confirmação:* ${currentVoucher.pnr}\n` +
      (paxNames ? `*Passageiro(s) / Titular:* ${paxNames}\n\n` : "\n") +
      (details ? `${details}\n\n` : "") +
      (currentVoucher.priceDisplayMode !== "sem_valor" && currentVoucher.pricing.total > 0
        ? `*Valor Total:* ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            currentVoucher.pricing.total
          )}\n\n`
        : "") +
      `Emitido por: ${agency.name}\n` +
      `Atendimento / Plantão: ${agency.emergencyPhone || agency.phone}\n` +
      `Tenha uma excelente viagem!`;

    navigator.clipboard.writeText(text);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* 1. DOCUMENT INPUT & AIVOUCHER INTELLIGENCE PANEL (Omitted in Print) */}
      <section className="no-print bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-600" />
            Upload Inteligente de Vouchers & Bilhetes (AiVoucher Intelligence)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Anexe o bilhete (PDF/Imagem) ou cole a confirmação da consolidadora/GDS. O AiVoucher Intelligence extrai e preenche localizador, voos, passageiros, franquias e tarifas em tempo real.
          </p>
        </div>

        {/* Input Grid: File Upload Dropzone + Text Paste */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* File Upload (PDF or Image) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              1. Anexar Arquivo (PDF ou Imagem do Bilhete)
            </label>
            <label className="relative border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/40 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors h-40 text-center">
              <UploadCloud className="w-8 h-8 text-sky-600" />
              {selectedFiles.length > 0 ? (
                <div>
                  <span className="text-xs font-bold text-sky-800 block">
                    ✓ {selectedFiles.length} arquivo(s) selecionado(s)
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 max-h-12 overflow-y-auto">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="truncate">{f.name}</div>
                    ))}
                  </div>
                  <span className="text-[11px] text-sky-600 block mt-2 font-medium">
                    Clique para adicionar mais arquivos
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Clique para selecionar ou arraste PDFs / Imagens aqui
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Você pode selecionar vários arquivos de uma vez
                  </span>
                </div>
              )}
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-[11px] text-red-600 hover:underline block"
              >
                Remover todos os anexos
              </button>
            )}
          </div>

          {/* Paste Raw Text / E-mail */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              2. Ou Cole o Texto do E-mail / Confirmação GDS
            </label>
            <textarea
              rows={5}
              placeholder="Cole aqui o texto copiado do e-mail da consolidadora, do bilhete eletrônico ou do GDS Sabre/Amadeus..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-40 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono text-slate-700"
            />
          </div>
        </div>

        {/* Process button & feedback */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex-1">
            {isProcessing && (
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
                    <span className="text-xs font-bold text-sky-900">
                      AiVoucher Engine: Capturando e Preenchendo Dados
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-900 tracking-wider">
                    Etapa {currentStageIndex + 1} de {CAPTURE_STAGES.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-sky-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((currentStageIndex + 1) / CAPTURE_STAGES.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse shrink-0" />
                  <strong className="text-sky-950 font-semibold">{CAPTURE_STAGES[currentStageIndex]?.title}:</strong>
                  <span className="text-slate-600">{CAPTURE_STAGES[currentStageIndex]?.detail}</span>
                </div>
              </div>
            )}
            {parseError && !isProcessing && (
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
            {geminiSuccessMsg && !parseError && !isProcessing && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{geminiSuccessMsg}</span>
              </div>
            )}
            {geminiWarningMsg && !isProcessing && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{geminiWarningMsg}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleProcessWithGemini}
            disabled={isProcessing || (!inputText.trim() && selectedFiles.length === 0)}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {isProcessing ? "AiVoucher Capturando..." : "Leitura Inteligente AiVoucher"}
          </button>
        </div>
      </section>

      {!isVoucherReady ? (
        /* Clean empty state when no voucher has been uploaded/generated yet */
        <section className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center shadow-xs">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mb-4 border border-sky-100 shadow-xs">
              <FileText className="w-8 h-8 text-sky-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Pré-visualização do Voucher Limpa
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Anexe um ou mais comprovantes (PDF ou imagem) no campo acima ou cole o texto dos bilhetes e clique em 
              <strong className="text-sky-700"> "Leitura Inteligente AiVoucher"</strong>. 
              A pré-visualização completa em padrão A4 aparecerá aqui com todos os serviços unificados, pronta para salvar e baixar.
            </p>
            
            <button
              type="button"
              onClick={() => {
                setIsVoucherReady(true);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              Ou Preencher Voucher Manualmente em Branco
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* 2. CORPORATE LINKING & AUTONOMY CONTROLS BAR (Omitted in Print) */}
          <section className="no-print bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            {/* Company Selector Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                    Empresa Cliente & Regras Automáticas
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Vincule uma empresa para aplicar automaticamente seu logo corporativo e preferências de
                  valores e famílias tarifárias pré-definidas.
                </p>
              </div>

              {/* Company Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative min-w-[280px]">
                  <select
                    value={currentVoucher.companyId || "none"}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none"
                  >
                    <option value="none">
                      Sem Empresa Vinculada (Apenas Logo da Agência)
                    </option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        🏢 {c.tradeName || c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {onNavigateToCompanies && (
                  <button
                    type="button"
                    onClick={onNavigateToCompanies}
                    className="px-2.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-200 shrink-0"
                    title="Gerenciar lista de empresas"
                  >
                    + Gerenciar
                  </button>
                )}
              </div>
            </div>

            {/* Feedback alert when rules were auto-applied */}
            {appliedDefaultsFeedback && (
              <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{appliedDefaultsFeedback}</span>
              </div>
            )}

            {/* CONTROLS TOOLBAR: Pricing Mode + Fare Family + Classes Toggles + Manual Edit */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              {/* 1. Price Mode Selector */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Exibição dos Valores no Voucher
                  </label>
                  {selectedCompany && (
                    <span className="text-[10px] text-sky-700 font-medium bg-sky-50 px-1.5 py-0.2 rounded">
                      Padrão da Empresa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentVoucher({ ...currentVoucher, priceDisplayMode: "sem_valor" })
                    }
                    className={`py-2 px-2 text-xs rounded-lg font-bold border transition-all text-center ${
                      currentVoucher.priceDisplayMode === "sem_valor"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Sem Valor
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentVoucher({ ...currentVoucher, priceDisplayMode: "apenas_total" })
                    }
                    className={`py-2 px-2 text-xs rounded-lg font-bold border transition-all text-center ${
                      currentVoucher.priceDisplayMode === "apenas_total"
                        ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Apenas Total
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentVoucher({ ...currentVoucher, priceDisplayMode: "discriminado" })
                    }
                    className={`py-2 px-2 text-xs rounded-lg font-bold border transition-all text-center ${
                      currentVoucher.priceDisplayMode === "discriminado"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Discriminado
                  </button>
                </div>
              </div>

              {/* 2. Fare Family Toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  Famílias Tarifárias
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentVoucher({
                      ...currentVoucher,
                      hideFareFamily: !currentVoucher.hideFareFamily
                    })
                  }
                  className={`w-full py-2 px-3 text-xs rounded-lg font-bold border flex items-center justify-center gap-2 transition-all ${
                    currentVoucher.hideFareFamily
                      ? "bg-purple-50 text-purple-800 border-purple-300"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {currentVoucher.hideFareFamily ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-purple-600" /> Ocultas no Voucher
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> Visíveis (Light/Plus)
                    </>
                  )}
                </button>
              </div>

              {/* 3. Booking Class Toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  Classes de Reserva
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentVoucher({
                      ...currentVoucher,
                      hideBookingClass: !currentVoucher.hideBookingClass
                    })
                  }
                  className={`w-full py-2 px-3 text-xs rounded-lg font-bold border flex items-center justify-center gap-2 transition-all ${
                    currentVoucher.hideBookingClass
                      ? "bg-purple-50 text-purple-800 border-purple-300"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {currentVoucher.hideBookingClass ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-purple-600" /> Ocultas (Y, Q...)
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> Visíveis no Voucher
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                  Editar Manualmente
                </button>

                <button
                  type="button"
                  onClick={handleResetVoucher}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Limpar dados residuais ou de teste e iniciar novo voucher limpo"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  Limpar / Novo Voucher
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 animate-fade-in flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Salvo no Histórico!
                  </span>
                )}
                {pdfSuccessMsg && (
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200 animate-fade-in flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> PDF Baixado com Sucesso!
                  </span>
                )}
                {copiedMsg && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-fade-in">
                    ✓ Resumo Copiado para WhatsApp!
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar mensagem resumida para enviar via WhatsApp ao passageiro"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Salvar no histórico sem baixar o PDF agora"
                >
                  <Save className="w-4 h-4" /> Salvar no Histórico
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Abrir diálogo de impressão do navegador (Ctrl+P)"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={handleDownloadRealPdf}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-sky-600/25 cursor-pointer disabled:opacity-60"
                  title="Salva automaticamente no histórico e baixa o arquivo PDF oficial"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Salvando & Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-white" />
                      Salvar & Gerar PDF (.pdf)
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 3. LIVE WYSIWYG VOUCHER DOCUMENT PREVIEW */}
          <section className="space-y-3">
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-100/80 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  Pré-visualização do Voucher (Padrão A4)
                </span>
                <span className="hidden md:inline text-slate-500">
                  • O PDF gerado conterá exatamente o layout abaixo
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Salvar no histórico sem baixar agora"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRealPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  title="Salva automaticamente no histórico e gera o PDF oficial"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Salvar & Gerar PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Imprimir
                </button>
              </div>
            </div>

            {/* The Voucher Document itself */}
            <VoucherDocument
              voucher={currentVoucher}
              agency={agency}
              company={selectedCompany}
            />
          </section>
        </>
      )}

      {/* Manual Full Editor Modal */}
      <VoucherEditorModal
        voucher={currentVoucher}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={(updated) => setCurrentVoucher(updated)}
      />
    </div>
  );
};
