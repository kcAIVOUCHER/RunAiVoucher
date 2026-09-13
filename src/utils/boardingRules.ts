import { Voucher, FlightSegment } from "../types";

/**
 * Utilitários de conformidade com a LGPD (Lei nº 13.709/2018)
 * Resguarda dados pessoais sensíveis e números de CPF contra exibição pública.
 */
export interface LGPDDocumentResult {
  isCpf: boolean;
  displayLabel: string;
  hasDocument: boolean;
}

export function formatPassengerDocumentLGPD(rawDoc?: string): LGPDDocumentResult {
  if (!rawDoc || rawDoc.trim() === "") {
    return {
      isCpf: false,
      displayLabel: "",
      hasDocument: false
    };
  }

  const clean = rawDoc.replace(/\D/g, "");
  const upper = rawDoc.toUpperCase();

  // Verifica se é CPF (11 dígitos ou contém a sigla CPF)
  if (clean.length === 11 || upper.includes("CPF")) {
    return {
      isCpf: true,
      displayLabel: "CPF Protegido (LGPD)",
      hasDocument: true
    };
  }

  // Se for Passaporte
  if (upper.includes("PASS") || upper.includes("PASSPORT") || /^[A-Z]{2}[0-9]{6,7}$/i.test(rawDoc.trim())) {
    const trimmed = rawDoc.trim();
    if (trimmed.length > 4) {
      const masked = `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
      return {
        isCpf: false,
        displayLabel: `Passaporte: ${masked}`,
        hasDocument: true
      };
    }
    return {
      isCpf: false,
      displayLabel: "Passaporte Protegido (LGPD)",
      hasDocument: true
    };
  }

  // Se for RG ou outro documento
  if (upper.includes("RG") || clean.length >= 7) {
    return {
      isCpf: false,
      displayLabel: "Doc. Identificação (LGPD)",
      hasDocument: true
    };
  }

  return {
    isCpf: false,
    displayLabel: "Identificação Protegida (LGPD)",
    hasDocument: true
  };
}

/**
 * Detecta se algum trecho aéreo é voo internacional
 */
export function isInternationalFlight(flights?: FlightSegment[]): boolean {
  if (!flights || flights.length === 0) return false;

  const brazilianDomesticAirports = new Set([
    "CGH", "GRU", "VCP", "SDU", "GIG", "BSB", "CNF", "SSA", "REC", "FOR",
    "POA", "CWB", "FLN", "VIX", "GYN", "BEL", "MAO", "CGB", "NAT", "MCZ",
    "IGU", "SLZ", "JPA", "AJU", "THE", "PVH", "RBR", "BVB", "MCP", "PMW",
    "UDI", "RAO", "SJP", "NVT", "XAP", "JOI", "IOS", "BPS", "CXJ", "PET",
    "JDO", "CPV", "MAB", "STM", "IMP", "MOC", "PPB", "BYO", "MGF", "LDB"
  ]);

  for (const f of flights) {
    if (f.isInternational) return true;

    const dep = f.departureCode?.trim().toUpperCase();
    const arr = f.arrivalCode?.trim().toUpperCase();

    if (dep && dep.length === 3 && !brazilianDomesticAirports.has(dep)) return true;
    if (arr && arr.length === 3 && !brazilianDomesticAirports.has(arr)) return true;

    const text = `${f.departureAirport || ""} ${f.arrivalAirport || ""} ${f.departureCity || ""} ${f.arrivalCity || ""} ${f.airline || ""}`.toLowerCase();
    const foreignKeywords = [
      "eua", "usa", "miami", "orlando", "nova york", "new york", "jfk", "lisboa", "portugal",
      "madrid", "espanha", "paris", "frança", "argentina", "buenos aires", "chile", "santiago",
      "montevideo", "uruguai", "bogota", "colombia", "lima", "peru", "panama", "cancun",
      "mexico", "londres", "london", "heathrow", "roma", "italia", "frankfurt", "alemanha",
      "dubai", "doha", "zurich", "amsterdam", "american airlines", "delta", "united", "tap",
      "air france", "klm", "iberia", "copa airlines", "avianca", "lufthansa", "emirates", "qatar"
    ];

    if (foreignKeywords.some((k) => text.includes(k))) {
      return true;
    }
  }

  return false;
}

export interface BoardingRuleItem {
  id: string;
  categoryTitle: string;
  iconType: "flight-intl" | "flight-dom" | "hotel" | "car" | "insurance" | "ticket" | "cruise";
  badge: string;
  badgeColor: string;
  rules: {
    label: string;
    text: string;
  }[];
}

/**
 * Retorna as regras de embarque e utilização específicas para cada produto do voucher
 */
export function getProductBoardingRules(voucher: Voucher): BoardingRuleItem[] {
  const items: BoardingRuleItem[] = [];

  const isPackage = voucher.serviceType === "package" || voucher.serviceType === "combo";

  const hasFlight = (isPackage || voucher.serviceType === "flight") && voucher.flights && voucher.flights.length > 0;
  const isIntl = isInternationalFlight(voucher.flights);

  // 1. REGRAS DE AÉREO (Internacional vs Nacional)
  if (hasFlight) {
    if (isIntl) {
      items.push({
        id: "air-intl",
        categoryTitle: "Voo Internacional • Regras de Embarque",
        iconType: "flight-intl",
        badge: "Aéreo Internacional",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        rules: [
          {
            label: "Antecedência",
            text: "Apresente-se com no mínimo 3 HORAS DE ANTECEDÊNCIA no terminal internacional. O check-in encerra 60min e os portões fecham 25min antes da decolagem."
          },
          {
            label: "Documentação",
            text: "Passaporte original com validade mínima de 6 meses a contar do retorno, vistos consulares e vacinas exigidas pelo país de destino/conexão."
          },
          {
            label: "Bagagem & Líquidos",
            text: "1 mala de mão de até 10kg. Em voos internacionais, líquidos e géis devem estar em frascos de até 100ml em saco plástico transparente vedado."
          }
        ]
      });
    } else {
      items.push({
        id: "air-dom",
        categoryTitle: "Voo Nacional • Regras de Embarque",
        iconType: "flight-dom",
        badge: "Aéreo Nacional",
        badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
        rules: [
          {
            label: "Antecedência",
            text: "Apresente-se no aeroporto com no mínimo 2 HORAS DE ANTECEDÊNCIA. Os portões de embarque encerram pontualmente 15 a 20 minutos antes do voo."
          },
          {
            label: "Documentação",
            text: "Documento oficial original com foto em bom estado (RG, CNH física ou CNH Digital oficial via app Gov.br, ou Passaporte brasileiro válido)."
          },
          {
            label: "Bagagem de Mão",
            text: "1 mala de mão até 10kg inclusa + 1 item pessoal (bolsa/mochila) sob o assento. Bagagem despachada inclusa apenas se contratada na tarifa."
          }
        ]
      });
    }
  }

  // 2. REGRAS DE HOTEL / HOSPEDAGEM
  if ((isPackage || voucher.serviceType === "hotel") && (voucher.hotel || voucher.serviceType === "hotel")) {
    items.push({
      id: "hotel-rules",
      categoryTitle: "Hospedagem • Check-in e Horários",
      iconType: "hotel",
      badge: "Hotelaria",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rules: [
        {
          label: "Horários",
          text: "Check-in a partir das 14:00h e Check-out até as 11:00h/12:00h. Antecipação ou prorrogação sujeitas à disponibilidade do hotel."
        },
        {
          label: "Identificação & Caução",
          text: "Obrigatório documento original com foto de todos os hóspedes. A recepção poderá solicitar cartão de crédito físico do titular para caução de extras."
        }
      ]
    });
  }

  // 3. REGRAS DE LOCAÇÃO DE VEÍCULO
  if ((isPackage || voucher.serviceType === "car") && (voucher.carRental || voucher.serviceType === "car")) {
    items.push({
      id: "car-rules",
      categoryTitle: "Locação de Veículo • Retirada",
      iconType: "car",
      badge: "Locadora",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      rules: [
        {
          label: "Requisitos",
          text: "CNH definitiva original em vigor (física ou digital oficial), idade mínima de 21 anos e documento oficial com foto."
        },
        {
          label: "Garantia & Combustível",
          text: "Cartão de crédito físico no nome do condutor titular com limite para pré-autorização (caução de segurança). Devolver com o mesmo nível de combustível da retirada."
        }
      ]
    });
  }

  // 4. REGRAS DE SEGURO VIAGEM
  if ((isPackage || voucher.serviceType === "insurance") && (voucher.insurance || voucher.serviceType === "insurance")) {
    items.push({
      id: "insurance-rules",
      categoryTitle: "Seguro Viagem • Assistência 24h",
      iconType: "insurance",
      badge: "Seguro 24h",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      rules: [
        {
          label: "Acionamento Obrigatório",
          text: "Em caso de urgência médica ou extravio de bagagem, contate IMEDIATAMENTE a central 24h da seguradora antes do atendimento particular."
        },
        {
          label: "Reembolsos",
          text: "Caso autorizado atendimento por reembolso, guarde todos os laudos com CID, receitas e notas fiscais para abertura de sinistro em até 30 dias."
        }
      ]
    });
  }

  // 5. REGRAS DE INGRESSOS / PASSEIOS
  if ((isPackage || voucher.serviceType === "ticket") && (voucher.ticket || voucher.serviceType === "ticket")) {
    items.push({
      id: "ticket-rules",
      categoryTitle: "Ingressos & Atrações • Acesso",
      iconType: "ticket",
      badge: "Ingressos",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      rules: [
        {
          label: "Acesso na Catraca",
          text: "Apresente este voucher com QR code / código legível impresso ou no celular com documento com foto do titular."
        },
        {
          label: "Agendamento",
          text: "Verifique se a atração exige pré-agendamento de dia/horário no aplicativo oficial do parque. Ingressos nominais e intransferíveis."
        }
      ]
    });
  }

  // 6. REGRAS DE CRUZEIRO MARÍTIMO
  if ((isPackage || voucher.serviceType === "cruise") && (voucher.cruise || voucher.serviceType === "cruise")) {
    items.push({
      id: "cruise-rules",
      categoryTitle: "Cruzeiro Marítimo • Embarque",
      iconType: "cruise",
      badge: "Cruzeiro",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      rules: [
        {
          label: "Horário no Porto",
          text: "Comparecer ao terminal portuário de 3 a 4 horas antes da partida. O embarque encerra pontualmente 1h30 antes da suspensão da prancha."
        },
        {
          label: "Bagagem & Documentos",
          text: "Afixar etiquetas oficiais nas malas antes da entrega aos estivadores. Portar documento com foto ou passaporte válido conforme rota."
        }
      ]
    });
  }

  return items;
}
