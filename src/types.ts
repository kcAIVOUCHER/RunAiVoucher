export type PriceDisplayMode = 'sem_valor' | 'apenas_total' | 'discriminado';

// -------------------------------------------------------------
// SaaS Subscriptions, Plans & Multi-Tenancy Types
// -------------------------------------------------------------

export type SubscriptionStatus = 'active' | 'trial' | 'blocked' | 'cancelled';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type AgencyUserRole = 'agency_admin' | 'issuer' | 'financial';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export interface SaasPlan {
  id: string;
  name: string;
  code?: string;
  description: string;
  basePrice: number; // Valor base mensal
  baseUsers: number; // Quantidade de usuários inclusos
  pricePerExtraUser: number; // Valor por usuário extra mensal
  maxVouchersPerMonth: number; // Limite mensal ou -1 para ilimitado
  aiVoucherExtractionsIncluded?: number; // Leituras com IA inclusas
  isPopular?: boolean;
  isActive?: boolean;
  features: string[];
  createdAt?: string;
}

export interface AgencySubscription {
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  maxUsers: number; // Limite total de usuários/logins permitidos
  basePrice: number; // Preço base do plano
  extraUsersCount: number; // Quantidade de assentos adicionais
  extraUsersPrice: number; // Valor total dos assentos extras
  monthlyFee: number; // Valor total cobrado por mês da agência
  maxVouchersPerMonth?: number; // Limite de PDFs/vouchers por mês (-1 = ilimitado)
  vouchersIssuedThisMonth?: number; // Vouchers emitidos no mês atual
  nextDueDate: string; // Próximo vencimento YYYY-MM-DD
  trialEndsAt?: string;
  paymentMethod: 'pix' | 'boleto' | 'credit_card';
  notes?: string;
  blockedReason?: string;
  blockedAt?: string;
  businessDaysOverdue?: number;
}

export interface AgencyUser {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  role: AgencyUserRole;
  status: 'active' | 'inactive';
  lastLogin?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  agencyId: string;
  agencyName: string;
  agencyCnpj: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: InvoiceStatus;
  billingPeriod: string; // ex: "Setembro / 2026"
  usersCount: number; // Total de usuários faturados
  pixCode?: string;
  barcode?: string;
  // Mercado Pago Details
  mpPaymentId?: string;
  mpQrCode?: string;
  mpQrCodeBase64?: string;
  mpTicketUrl?: string;
  mpStatus?: string;
  paymentType?: 'mercadopago_pix' | 'itau_pix' | 'boleto';
  businessDaysOverdue?: number;
  // NFS-e (Nota Fiscal de Serviços Eletrônica)
  nfeNumber?: string;
  nfeSeries?: string;
  nfeVerificationCode?: string;
  nfeEmittedAt?: string;
  nfeTaxRate: number; // ex: 2.0 (%)
  nfeTaxValue: number; // R$
  nfeServiceDescription: string;
  nfeStatus: 'emitted' | 'not_emitted' | 'cancelled';
  downloadUrl?: string;
}

export interface PlatformSettings {
  platformName?: string;
  platformLogoUrl?: string;
  platformIconUrl?: string;
  primaryColor?: string;
  mercadopagoAccessToken?: string;
  mercadopagoPublicKey?: string;
  itauPixKey?: string;
  itauPixKeyType?: 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  itauBeneficiaryName?: string;
  itauBankInfo?: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  gracePeriodDays?: number;
}

export interface SaasMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  activeAgenciesCount: number;
  trialAgenciesCount: number;
  blockedAgenciesCount: number;
  totalAgencyUsersCount: number;
  vouchersEmittedThisMonth: number;
  pendingInvoicesAmount: number;
}

export interface SessionContext {
  mode: 'superadmin' | 'agency';
  agencyId: string;
  agencyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'superadmin' | AgencyUserRole;
}

export interface Company {
  id: string;
  agencyId?: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  logoUrl?: string;
  defaultPriceDisplay: PriceDisplayMode;
  hideFareFamilyByDefault: boolean;
  hideClassByDefault: boolean;
  customNotes?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface AgencyProfile {
  id: string;
  name: string;
  tradeName?: string;
  cnpj: string;
  logoUrl: string;
  email: string;
  phone: string;
  whatsapp: string;
  website?: string;
  address: string;
  primaryColor: string;
  secondaryColor?: string;
  colorPreset?: string;
  footerNotes: string;
  emergencyPhone?: string;
  defaultPriceDisplay: PriceDisplayMode;
  hideFareFamilyByDefault: boolean;
  hideClassByDefault: boolean;
  // SaaS Link
  subscription?: AgencySubscription;
  masterLoginEmail?: string;
  activeUsersCount?: number;
  createdAt?: string;
}

export interface Passenger {
  id?: string;
  name: string;
  ticketNumber?: string;
  document?: string;
  birthDate?: string;
  loyaltyNumber?: string;
  seat?: string;
}

export interface FlightSegment {
  id: string;
  airline: string;
  airlineCode?: string;
  flightNumber: string;
  isInternational?: boolean;
  departureAirport: string;
  departureCode: string;
  departureCity?: string;
  departureDate: string;
  departureTime: string;
  departureTerminal?: string;
  arrivalAirport: string;
  arrivalCode: string;
  arrivalCity?: string;
  arrivalDate: string;
  arrivalTime: string;
  arrivalTerminal?: string;
  cabinClass?: string;
  bookingClass?: string;
  fareFamily?: string;
  baggageHand?: string;
  baggageChecked?: string;
  aircraft?: string;
  duration?: string;
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
}

export interface HotelBooking {
  id?: string;
  hotelName: string;
  address?: string;
  city?: string;
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  nights?: number;
  roomType?: string;
  roomCategory?: string;
  roomsCount?: number;
  guestsCount?: number;
  mealPlan?: string;
  confirmationCode?: string;
  guestsNames?: string[];
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
  notes?: string;
}

export interface CarRentalBooking {
  id?: string;
  rentalCompany: string; // Localiza, Movida, Avis, Hertz, Alamo
  confirmationCode?: string;
  carModelOrCategory?: string; // ex: Sedan Automático Grupo C (Onix Plus ou similar)
  carModel?: string;
  carCategory?: string;
  pickupLocation?: string; // ex: Balcão Aeroporto Guarulhos (GRU) - Terminal 2
  pickupDate?: string;
  pickupTime?: string;
  pickupDateTime?: string;
  dropoffLocation?: string;
  dropoffDate?: string;
  dropoffTime?: string;
  dropoffDateTime?: string;
  driverName?: string;
  driverDocument?: string;
  includedCoverage?: string; // ex: Proteção Completa LDW/CDW, Quilometragem Livre
  insuranceIncluded?: string;
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
  notes?: string;
}

export interface InsuranceBooking {
  id?: string;
  provider: string; // ex: Assist Card, GTA, Universal Assistance, Affinity
  insurerName?: string;
  policyNumber?: string; // Número da Apólice / Bilhete
  planName?: string; // ex: Internacional Europa Especial 60K
  startDate?: string;
  endDate?: string;
  coverageStart?: string;
  coverageEnd?: string;
  destinationArea?: string;
  medicalCoverage?: string; // ex: USD 60.000 ou R$ 150.000
  covidCoverage?: string;
  baggageCoverage?: string; // ex: USD 1.200 suplementar
  emergencyPhone24h?: string; // Telefone e WhatsApp 24h para emergências médicas no exterior
  emergencyPhone?: string;
  insuredNames?: string[];
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
  notes?: string;
}

export interface TicketBooking {
  id?: string;
  attractionName: string; // ex: Magic Kingdom Park - Walt Disney World, Tour Coliseu & Vaticano
  supplierOrPark?: string; // ex: Disney Destinations, Universal, Civitatis
  ticketType?: string; // ex: Ingresso Adulto 1 Dia, Hopper Plus, VIP FastPass
  ticketNumberOrCode?: string;
  date?: string;
  time?: string;
  locationOrAddress?: string;
  passengersOrHolders?: string[];
  importantInstructions?: string; // ex: Apresentar voucher na catraca
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
}

export interface CruiseBooking {
  id?: string;
  cruiseLine: string; // ex: MSC Cruzeiros, Costa Cruzeiros, Royal Caribbean
  shipName: string; // ex: MSC Grandiosa
  bookingNumber?: string;
  cabinNumber?: string; // ex: Cabine 11042
  cabinCategory?: string; // ex: Varanda Fantastica com Vista para o Mar
  departurePort?: string; // ex: Porto de Santos - SP
  departureDate?: string;
  departureTime?: string;
  arrivalPort?: string; // ex: Porto de Santos - SP
  arrivalDate?: string;
  itinerarySummary?: string; // ex: Santos > Búzios > Ilha Grande > Santos (4 noites)
  mealPlan?: string; // ex: Pacote Easy Bebidas & Refeições nos Restaurantes Principais
  passengers?: string[];
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
}

export interface TransferBooking {
  id?: string;
  serviceType: string; // ex: In/Out, Aeroporto -> Hotel, Privativo
  pickupLocation: string; // ex: Aeroporto de Salvador (SSA)
  pickupDateTime: string;
  dropoffLocation: string; // ex: Hotel Iberostar Praia do Forte
  vehicleType?: string; // ex: Van Executiva Climatizada
  flightReference?: string;
  contactPhone?: string;
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
}

export interface VoucherPricing {
  currency: string;
  fare: number;
  taxes: number;
  serviceFee: number;
  otherFees: number;
  total: number;
}

export type ServiceType = 'flight' | 'hotel' | 'car' | 'insurance' | 'ticket' | 'cruise' | 'transfer' | 'package' | 'combo';

export interface Voucher {
  id: string;
  voucherNumber: string;
  pnr: string; // Código Localizador
  issueDate: string;
  agencyId: string;
  companyId?: string | null;
  companyName?: string;
  companyLogoUrl?: string;
  serviceType: ServiceType;
  passengers: Passenger[];
  flights: FlightSegment[];
  // Single and Multi-block collections
  hotel?: HotelBooking | null;
  hotels?: HotelBooking[];
  carRental?: CarRentalBooking | null;
  carRentals?: CarRentalBooking[];
  insurance?: InsuranceBooking | null;
  insurances?: InsuranceBooking[];
  ticket?: TicketBooking | null;
  tickets?: TicketBooking[];
  cruise?: CruiseBooking | null;
  cruises?: CruiseBooking[];
  transfer?: TransferBooking | null;
  transfers?: TransferBooking[];
  // Multi-service list for package complete
  packageServices?: {
    transfers?: TransferBooking[];
    tickets?: TicketBooking[];
  };
  // Replicated QR Code & Barcode from attached documents
  qrCodeData?: string;
  barcodeData?: string;
  barcodeType?: string;
  codeImageBase64?: string;
  pricing: VoucherPricing;
  priceDisplayMode: PriceDisplayMode;
  hideFareFamily: boolean;
  hideBookingClass: boolean;
  status: 'emitted' | 'draft' | 'cancelled';
  notes?: string;
  emergencyContact?: string;
  createdAt: string;
}

export interface ParseVoucherResponse {
  success: boolean;
  data?: Partial<Voucher>;
  rawExtracted?: any;
  error?: string;
}
