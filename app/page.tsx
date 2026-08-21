"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/purity */

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://pexamdyctxcxelshixfz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBleGFtZHljdHhjeGVsc2hpeGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMTc1MTcsImV4cCI6MjEwMTg5MzUxN30.7MnfNlfiof6KyGRGKzd0JzbK3X_jMqQ--b0Micm3uxY",
);

type View = "home" | "login" | "register" | "invite" | "recover";
type LegalDocument = "terms" | "privacy" | "advertising";
type CompanyMode = "buyer" | "provider";
type OperationalStatus = "activa" | "pausada" | "bloqueada" | "archivada";
type CompanyCapabilities = {
  tipo: "compradora" | "proveedora";
  puede_comprar?: boolean | null;
  puede_vender?: boolean | null;
};

function companyCanBuy(company: CompanyCapabilities | null | undefined) {
  return company?.puede_comprar ?? company?.tipo === "compradora";
}

function companyCanSell(company: CompanyCapabilities | null | undefined) {
  return company?.puede_vender ?? company?.tipo === "proveedora";
}

function companyCapabilityLabel(company: CompanyCapabilities) {
  const canBuy = companyCanBuy(company);
  const canSell = companyCanSell(company);
  if (canBuy && canSell) return "Compradora y proveedora";
  return canBuy ? "Empresa compradora" : "Empresa proveedora";
}

function companyCapabilityAbbreviation(company: CompanyCapabilities) {
  if (companyCanBuy(company) && companyCanSell(company)) return "C+V";
  return companyCanBuy(company) ? "C" : "V";
}

function operationalStatusLabel(status: OperationalStatus | null | undefined) {
  if (status === "pausada") return "Pausada";
  if (status === "bloqueada") return "Bloqueada";
  if (status === "archivada") return "Archivada";
  return "Activa";
}

type Account = {
  id: string;
  nombre: string;
  apellido: string;
  rol: "miembro" | "administrador_empresa" | "administrador_plataforma";
  empresas: null | {
    id: string;
    tipo: "compradora" | "proveedora";
    puede_comprar: boolean;
    puede_vender: boolean;
    razon_social: string;
    nombre_comercial: string | null;
    estado: string;
    estado_operativo: OperationalStatus;
  };
};

function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

type Row = { id: string; title: string; meta: string; state: string };
type AdminRequestItem = {
  renglon: number;
  articulo: string;
  cantidad: number;
  unidad: string;
  especificacion: string | null;
};
type AdminRequestRecipient = { empresa_id: string; empresa: string };
type AdminRequestAttachment = { id: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number | null; cargado_en: string };
type AdminSupervisionRequest = {
  id: string;
  codigo: number;
  titulo: string;
  descripcion: string | null;
  proyecto: string | null;
  estado: string;
  fecha_limite: string;
  creada_en: string;
  empresa_compradora_id: string;
  empresa_compradora: string;
  email_compradora: string;
  articulos: AdminRequestItem[];
  cantidad_articulos: number;
  destinatarios: AdminRequestRecipient[];
  cantidad_destinatarios: number;
  cantidad_cotizaciones: number;
  cantidad_adjudicaciones: number;
  adjuntos: AdminRequestAttachment[];
};
type AdminQuoteItem = {
  id: string; item_solicitud_id: string; articulo: string;
  cantidad_solicitada: number; unidad: string; cantidad_ofertada: number;
  precio_unitario: number; alicuota_iva: number; marca: string | null;
  especificacion_ofertada: string | null; plazo_entrega_item: string | null;
  observaciones: string | null; adjudicada: boolean;
};
type AdminQuote = {
  id: string; proveedor_id: string; proveedor: string; email_proveedor: string;
  estado: string; moneda: "ARS" | "USD"; impuestos_incluidos: boolean;
  condiciones_pago: string; plazo_entrega: string; observaciones: string | null;
  pdf_path: string | null; presentada_en: string | null; items: AdminQuoteItem[];
};
type CompanyReview = {
  id: string;
  razon_social: string;
  nombre_comercial: string | null;
  tipo: "compradora" | "proveedora";
  puede_comprar: boolean;
  puede_vender: boolean;
  cuit: string;
  localidad: string;
  domicilio: string | null;
  email_empresa: string;
  telefono: string | null;
  estado: string;
  estado_operativo: OperationalStatus;
  motivo_observacion: string | null;
  creada_en: string;
};
type AdminCompanyUser = {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  email: string;
  email_confirmado: boolean;
  bloqueado_hasta: string | null;
};
type AdminCompanyActivity = {
  solicitudes: number;
  cotizaciones: number;
  adjudicaciones: number;
};
type CompanyDocument = {
  id: string;
  tipo_documento: string;
  archivo_path: string;
  estado: string;
  cargado_en: string;
};
type Category = { id: number; nombre: string };
const DEFAULT_CATEGORIES: Category[] = [
  "Aceros y productos metalúrgicos",
  "Áridos, cemento y hormigón",
  "Combustibles y lubricantes",
  "Elementos de protección personal",
  "Electricidad e iluminación",
  "Ferretería industrial",
  "Herramientas y equipos",
  "Instrumentación y control",
  "Maquinaria y repuestos",
  "Mangueras, válvulas y conexiones",
  "Materiales de construcción",
  "Neumáticos",
  "Productos químicos",
  "Rodamientos y transmisión",
  "Seguridad e higiene",
  "Soldadura y abrasivos",
  "Transporte y logística",
  "Uniformes e indumentaria",
  "Otros productos",
].map((nombre, index) => ({ id: index + 1, nombre }));
type RequestItem = {
  articulo: string;
  cantidad: string;
  unidad: string;
  especificacion: string;
};
type RequestAttachment = {
  id: string;
  nombre_archivo: string;
  archivo_path: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  cargado_en: string;
};
type RequestLine = {
  id: string;
  renglon: number;
  articulo: string;
  cantidad: number;
  unidad: string;
  especificacion: string | null;
  permite_cantidad_menor: boolean | null;
};
type RequestDetail = {
  id: string;
  codigo: number;
  estado: string;
  titulo: string;
  descripcion: string | null;
  proyecto: string | null;
  fecha_limite: string;
  permite_cotizacion_parcial: boolean;
  permite_cantidad_menor: boolean;
  apertura_al_vencimiento: boolean;
  empresa_compradora_id: string;
  comprador: string;
  compradorEmail: string | null;
  compradorTelefono: string | null;
  items: RequestLine[];
};
type QuoteLine = {
  item_solicitud_id: string;
  included: boolean;
  cantidad_ofertada: string;
  precio_unitario: string;
  alicuota_iva: string;
  marca: string;
  especificacion_ofertada: string;
  plazo_entrega_item: string;
  observaciones: string;
};
type BuyerQuote = {
  id: string;
  solicitud_id: string;
  empresa_proveedora_id: string;
  requestCode: number;
  requestTitle: string;
  requestState: string;
  requestDeadline: string;
  providerName: string;
  providerEmail: string | null;
  providerTelefono: string | null;
  moneda: "ARS" | "USD";
  estado: string;
  condiciones_pago: string;
  plazo_entrega: string;
  impuestos_incluidos: boolean;
  observaciones: string | null;
  pdfPath: string | null;
  presentada_en: string | null;
  total: number;
};
type BuyerQuoteItem = {
  id: string;
  item_solicitud_id: string;
  articulo: string;
  unidad: string;
  cantidad_solicitada: number;
  cantidad_ofertada: number;
  precio_unitario: number;
  alicuota_iva: number;
  marca: string | null;
  especificacion_ofertada: string | null;
  plazo_entrega_item: string | null;
  observaciones: string | null;
};
type AwardRecord = {
  id: string;
  requestId: string;
  requestItemId: string;
  quotationId: string;
  requestCode: number;
  requestTitle: string;
  article: string;
  unit: string;
  providerName: string;
  buyerName: string;
  providerCompanyId: string;
  buyerCompanyId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: "ARS" | "USD";
  paymentTerms: string;
  deliveryTime: string;
  awardedAt: string;
};
type ProviderQuote = {
  id: string;
  requestId: string;
  requestCode: number;
  requestTitle: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerTelefono: string | null;
  currency: "ARS" | "USD";
  state: string;
  displayState: string;
  paymentTerms: string;
  deliveryTime: string;
  taxesIncluded: boolean;
  observations: string | null;
  pdfPath: string | null;
  presentedAt: string | null;
  deadline: string;
  total: number;
};
type Notification = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  entidad: string | null;
  entidad_id: string | null;
  leida_en: string | null;
  creada_en: string;
};
type TeamMember = {
  id: string;
  nombre: string;
  apellido: string;
  rol: "miembro" | "administrador_empresa" | "administrador_plataforma";
};
type CompanyInvitation = {
  id: string;
  email: string;
  rol: "miembro" | "administrador_empresa";
  token: string;
  creada_en: string;
  vence_en: string;
  usada_en: string | null;
};
type Advertiser = {
  id: string;
  nombre: string;
  razon_social: string | null;
  email: string | null;
  sitio_web: string | null;
  activo: boolean;
};
type AdPlacement = {
  id: string;
  codigo: string;
  nombre: string;
  ancho_recomendado: number | null;
  alto_recomendado: number | null;
};
type AdCampaign = {
  id: string;
  anunciante_id: string;
  nombre: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  prioridad: number;
  anunciantes: { nombre: string } | null;
};
type AdCreative = {
  id: string;
  campana_id: string;
  ubicacion_id: string;
  titulo: string;
  texto: string | null;
  texto_boton: string;
  imagen_path: string;
  enlace_destino: string;
  activo: boolean;
  ubicaciones_publicidad: { nombre: string } | null;
};
type AdMetric = { anuncio_id: string; tipo: "impresion" | "clic" };
type PublicAd = {
  id: string;
  titulo: string;
  texto: string | null;
  etiqueta: string;
  imagen_path: string;
  enlace_destino: string;
  texto_boton: string;
};

function friendlyAuthError(error: { message?: string; status?: number } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  if (message.includes("invalid login credentials"))
    return "El correo o la contraseña no son correctos.";
  if (message.includes("email not confirmed"))
    return "Primero confirmá tu cuenta desde el correo que te enviamos.";
  if (message.includes("email rate limit exceeded") || error?.status === 429)
    return "Se enviaron demasiados correos en poco tiempo. Esperá unos minutos antes de volver a intentarlo.";
  if (message.includes("user already registered"))
    return "Ya existe una cuenta con este correo. Ingresá o restablecé la contraseña.";
  if (message.includes("password should be"))
    return "La contraseña debe tener al menos ocho caracteres.";
  if (message.includes("signup is disabled"))
    return "El registro está temporalmente deshabilitado. Intentá nuevamente más tarde.";
  if (message.includes("otp_expired") || message.includes("link is invalid") || message.includes("has expired"))
    return "El enlace venció o ya fue utilizado. Solicitá uno nuevo.";
  if (message.includes("network") || message.includes("fetch"))
    return "No pudimos conectar con el servicio. Revisá tu conexión e intentá nuevamente.";
  return "No pudimos completar la operación. Revisá los datos e intentá nuevamente.";
}

function registrationErrorMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";
  const normalized = message.toLowerCase();
  if (
    normalized.includes("empresas_al_menos_una_capacidad") ||
    normalized.includes("debe poder comprar, vender")
  ) {
    return "Elegí al menos una actividad para la empresa: comprar, vender o ambas.";
  }
  if (
    message.startsWith("El ") ||
    message.startsWith("La ") ||
    message.startsWith("Ya ")
  ) {
    return message;
  }
  return fallback;
}

function PasswordInput({
  name,
  autoComplete,
  minLength = 8,
  required = true,
}: {
  name: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [adminView, setAdminView] = useState<
    "summary" | "supervision" | "reviews" | "companies" | "categories" | "advertising"
  >("summary");
  const [supervisionRequests, setSupervisionRequests] = useState<AdminSupervisionRequest[]>([]);
  const [selectedSupervisionRequest, setSelectedSupervisionRequest] = useState<AdminSupervisionRequest | null>(null);
  const [supervisionSearch, setSupervisionSearch] = useState("");
  const [supervisionStatus, setSupervisionStatus] = useState("todos");
  const [supervisionCompany, setSupervisionCompany] = useState("todas");
  const [supervisionQuotes, setSupervisionQuotes] = useState("todas");
  const [supervisionFrom, setSupervisionFrom] = useState("");
  const [supervisionTo, setSupervisionTo] = useState("");
  const [supervisionSort, setSupervisionSort] = useState("recientes");
  const [supervisionPage, setSupervisionPage] = useState(1);
  const [adminQuotes, setAdminQuotes] = useState<AdminQuote[]>([]);
  const [adminQuotesOpen, setAdminQuotesOpen] = useState(false);
  const [adminQuotesError, setAdminQuotesError] = useState("");
  const [loadingAdminQuotes, setLoadingAdminQuotes] = useState(false);
  const [openingAdminFile, setOpeningAdminFile] = useState("");
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyReview | null>(
    null,
  );
  const [companySearch, setCompanySearch] = useState("");
  const [companyOperationalFilter, setCompanyOperationalFilter] =
    useState("todas");
  const [companyUsers, setCompanyUsers] = useState<AdminCompanyUser[]>([]);
  const [companyActivity, setCompanyActivity] = useState<AdminCompanyActivity>({
    solicitudes: 0,
    cotizaciones: 0,
    adjudicaciones: 0,
  });
  const [companyCanDelete, setCompanyCanDelete] = useState(false);
  const [adminCompanyReason, setAdminCompanyReason] = useState("");
  const [adminCompanyAction, setAdminCompanyAction] = useState("");
  const [adminCompanyCreateOpen, setAdminCompanyCreateOpen] = useState(false);
  const [adminCreateCanBuy, setAdminCreateCanBuy] = useState(true);
  const [adminCreateCanSell, setAdminCreateCanSell] = useState(false);
  const [adminCreateCategories, setAdminCreateCategories] = useState<number[]>([]);
  const [reviewNote, setReviewNote] = useState("");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>(
    [],
  );
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [adMetrics, setAdMetrics] = useState<AdMetric[]>([]);
  const [adImage, setAdImage] = useState<File | null>(null);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [editingAd, setEditingAd] = useState<AdCreative | null>(null);
  const [replacementAdImage, setReplacementAdImage] = useState<File | null>(null);
  const [buyerAd, setBuyerAd] = useState<PublicAd | null>(null);
  const [providerAd, setProviderAd] = useState<PublicAd | null>(null);
  const [requestListAd, setRequestListAd] = useState<PublicAd | null>(null);
  const [publicAd, setPublicAd] = useState<PublicAd | null>(null);
  const [providerView, setProviderView] = useState<
    | "summary"
    | "categories"
    | "requests"
    | "detail"
    | "awards"
    | "quotes"
    | "quoteDetail"
    | "team"
    | "profile"
  >("summary");
  const [providerQuotes, setProviderQuotes] = useState<ProviderQuote[]>([]);
  const [selectedProviderQuote, setSelectedProviderQuote] =
    useState<ProviderQuote | null>(null);
  const [providerQuoteItems, setProviderQuoteItems] = useState<
    BuyerQuoteItem[]
  >([]);
  const [providerQuoteEditOpen, setProviderQuoteEditOpen] = useState(false);
  const [quotePdfFile, setQuotePdfFile] = useState<File | null>(null);
  const [providerEditLines, setProviderEditLines] = useState<QuoteLine[]>([]);
  const [providerEditHeader, setProviderEditHeader] = useState({
    currency: "ARS" as "ARS" | "USD",
    taxesIncluded: false,
    paymentTerms: "",
    deliveryTime: "",
    observations: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [requestSelectedCategories, setRequestSelectedCategories] = useState<
    number[]
  >([]);
  const [providerSelectedCategories, setProviderSelectedCategories] = useState<
    number[]
  >([]);
  const [companyMode, setCompanyMode] = useState<CompanyMode>("buyer");
  const [registrationCanBuy, setRegistrationCanBuy] = useState(true);
  const [registrationCanSell, setRegistrationCanSell] = useState(false);
  const [registrationCategories, setRegistrationCategories] = useState<
    Category[]
  >([]);
  const [registrationSelectedCategories, setRegistrationSelectedCategories] =
    useState<number[]>([]);
  const [registrationCuitStatus, setRegistrationCuitStatus] = useState<
    | "idle"
    | "checking"
    | "available"
    | "unavailable"
    | "invalid"
    | "service-error"
  >("idle");
  const [registrationCheckedCuit, setRegistrationCheckedCuit] = useState("");
  const [reviewSelectedCategories, setReviewSelectedCategories] = useState<
    number[]
  >([]);
  const [reviewCanBuy, setReviewCanBuy] = useState(false);
  const [reviewCanSell, setReviewCanSell] = useState(false);
  const [buyerView, setBuyerView] = useState<
    | "summary"
    | "new"
    | "requests"
    | "requestDetail"
    | "quotes"
    | "quoteDetail"
    | "awards"
    | "team"
    | "profile"
  >("summary");
  const [awards, setAwards] = useState<AwardRecord[]>([]);
  const [buyerQuotes, setBuyerQuotes] = useState<BuyerQuote[]>([]);
  const [selectedBuyerQuote, setSelectedBuyerQuote] =
    useState<BuyerQuote | null>(null);
  const [buyerQuoteOriginRequestId, setBuyerQuoteOriginRequestId] = useState<
    string | null
  >(null);
  const [buyerQuoteItems, setBuyerQuoteItems] = useState<BuyerQuoteItem[]>([]);
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardSelections, setAwardSelections] = useState<
    Record<string, { selected: boolean; quantity: string }>
  >({});
  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    { articulo: "", cantidad: "", unidad: "unidad", especificacion: "" },
  ]);
  const [requestFiles, setRequestFiles] = useState<File[]>([]);
  const [requestAttachments, setRequestAttachments] = useState<
    RequestAttachment[]
  >([]);
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(
    null,
  );
  const [requestAction, setRequestAction] = useState<
    "cerrar" | "cancelar" | "reabrir" | null
  >(null);
  const [requestActionReason, setRequestActionReason] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteLines, setQuoteLines] = useState<QuoteLine[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [liveNotification, setLiveNotification] =
    useState<Notification | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<CompanyInvitation[]>(
    [],
  );
  const [invitationLink, setInvitationLink] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [authenticatedEmail, setAuthenticatedEmail] = useState("");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [rememberLoginEmail, setRememberLoginEmail] = useState(false);
  const [orphanUser, setOrphanUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [profileForm, setProfileForm] = useState({
    nombre: "",
    apellido: "",
    cargo: "",
    email: "",
  });
  const [companyForm, setCompanyForm] = useState({
    razonSocial: "",
    nombreComercial: "",
    domicilio: "",
    email: "",
    telefono: "",
    whatsapp: "",
    sitioWeb: "",
  });
  const loadingUserRef = useRef<string | null>(null);
  const activeUserRef = useRef<string | null>(null);
  const quoteFormRef = useRef<HTMLFormElement | null>(null);
  const knownNotificationIdsRef = useRef<{
    companyId: string;
    ids: Set<string>;
  } | null>(null);
  const notificationRefreshInFlightRef = useRef(false);

  function getWhatsAppUrl(phone: string) {
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length === 10) digits = `549${digits}`;
    else if (digits.startsWith("54") && !digits.startsWith("549")) {
      digits = `549${digits.slice(2)}`;
    }
    return `https://wa.me/${digits}`;
  }

  function formatUnit(unit: string, quantity: number) {
    if (quantity === 1) return unit;
    if (unit.toLowerCase() === "unidad") return "unidades";
    if (unit.toLowerCase().endsWith("s")) return unit;
    return `${unit}s`;
  }

  function scrollToQuoteForm() {
    window.requestAnimationFrame(() => {
      quoteFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function openQuoteForm() {
    if (quoteOpen) scrollToQuoteForm();
    else setQuoteOpen(true);
  }

  function advertisingVisitorId() {
    const key = "miconect-ad-visitor";
    let value = localStorage.getItem(key);
    if (!value) {
      value = createUuid();
      localStorage.setItem(key, value);
    }
    return value;
  }

  async function registerAdEvent(adId: string, type: "impresion" | "clic") {
    await supabase.rpc("registrar_evento_publicidad", {
      p_anuncio_id: adId,
      p_tipo: type,
      p_visitante_id: advertisingVisitorId(),
    });
  }

  async function loadBuyerAdvertisement() {
    const { data, error } = await supabase.rpc("obtener_anuncios_publicos", {
      p_ubicacion: "panel_comprador",
    });
    if (error || !data?.length) {
      setBuyerAd(null);
      return;
    }
    const selected = data[0] as PublicAd;
    setBuyerAd(selected);
    await registerAdEvent(selected.id, "impresion");
  }

  async function loadProviderAdvertisement() {
    const { data, error } = await supabase.rpc("obtener_anuncios_publicos", {
      p_ubicacion: "panel_proveedor",
    });
    if (error || !data?.length) {
      setProviderAd(null);
      return;
    }
    const selected = data[0] as PublicAd;
    setProviderAd(selected);
    await registerAdEvent(selected.id, "impresion");
  }

  async function loadRequestListAdvertisement() {
    const { data, error } = await supabase.rpc("obtener_anuncios_publicos", {
      p_ubicacion: "lista_solicitudes",
    });
    if (error || !data?.length) {
      setRequestListAd(null);
      return;
    }
    const selected = data[0] as PublicAd;
    setRequestListAd(selected);
    await registerAdEvent(selected.id, "impresion");
  }

  async function loadPublicAdvertisement() {
    const { data, error } = await supabase.rpc("obtener_anuncios_publicos", {
      p_ubicacion: "inicio_publico",
    });
    if (error || !data?.length) {
      setPublicAd(null);
      return;
    }
    const selected = data[0] as PublicAd;
    setPublicAd(selected);
    await registerAdEvent(selected.id, "impresion");
  }

  useEffect(() => {
    if (view === "home" && !account) void loadPublicAdvertisement();
  // The loaders below intentionally synchronize remote Supabase state with the active screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, account]);

  useEffect(() => {
    if (providerView === "requests" && companyCanSell(account?.empresas)) {
      void loadRequestListAdvertisement();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerView, account?.empresas?.puede_vender, account?.empresas?.tipo]);

  useEffect(() => {
    const remembered = localStorage.getItem("miconect-remembered-email") ?? "";
    setLoginEmail(remembered);
    setRememberLoginEmail(Boolean(remembered));
  }, []);

  useEffect(() => {
    if (view !== "register") return;
    setRegistrationCategories(DEFAULT_CATEGORIES);
    void supabase
      .from("rubros")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => {
        if (data?.length)
          setRegistrationCategories(data as Category[]);
      });
  }, [view]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token) {
      setInviteToken(token);
      setView("invite");
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setAuthenticatedEmail(data.session.user.email ?? "");
        void loadAccount(data.session.user.id);
      } else setLoadingAccount(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
        setLoadingAccount(false);
        return;
      }
      if (session?.user) {
        setAuthenticatedEmail(session.user.email ?? "");
        if (activeUserRef.current !== session.user.id) {
          setTimeout(() => void loadAccount(session.user.id), 0);
        }
      } else {
        activeUserRef.current = null;
        setAccount(null);
        setOrphanUser(null);
        setAuthenticatedEmail("");
        setNotifications([]);
        setNotificationOpen(false);
        setLiveNotification(null);
        knownNotificationIdsRef.current = null;
        setLoadingAccount(false);
      }
    });
    return () => data.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const companyId = account?.empresas?.id;
    if (!companyId) return;

    let active = true;
    const refreshNotifications = () => {
      if (active) void loadNotifications(companyId);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshNotifications();
    };

    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 5000);
    window.addEventListener("focus", refreshNotifications);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    const channel = supabase
      .channel(`notificaciones-${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificaciones",
          filter: `empresa_destinataria_id=eq.${companyId}`,
        },
        refreshNotifications,
      )
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshNotifications);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void supabase.removeChannel(channel);
    };
  // The subscription intentionally refreshes the active company's remote state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.empresas?.id]);

  useEffect(() => {
    if (!quoteOpen) return;
    scrollToQuoteForm();
  }, [quoteOpen]);

  useEffect(() => {
    if (!liveNotification) return;
    const timeout = window.setTimeout(() => setLiveNotification(null), 15000);
    return () => window.clearTimeout(timeout);
  }, [liveNotification]);

  async function persistCompanyCategories(
    companyId: string,
    categoryIds: number[],
  ) {
    const { data: existing, error: readError } = await supabase
      .from("empresa_rubros")
      .select("rubro_id")
      .eq("empresa_id", companyId);
    if (readError) return readError.message;
    const current = (existing ?? []).map((item) => item.rubro_id);
    const toAdd = categoryIds.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !categoryIds.includes(id));
    if (toAdd.length) {
      const { error } = await supabase.from("empresa_rubros").insert(
        toAdd.map((rubro_id) => ({ empresa_id: companyId, rubro_id })),
      );
      if (error) return error.message;
    }
    if (toRemove.length) {
      const { error } = await supabase
        .from("empresa_rubros")
        .delete()
        .eq("empresa_id", companyId)
        .in("rubro_id", toRemove);
      if (error) return error.message;
    }
    return "";
  }

  async function finishPendingRegistration(
    pendingOverride?: Record<string, unknown> | null,
  ) {
    const raw = localStorage.getItem("miconect-pending-company");
    const pending = pendingOverride ?? (raw ? JSON.parse(raw) : null);
    if (!pending) return false;
    const {
      p_rubros,
      p_rubros_nombres,
      p_puede_comprar,
      p_puede_vender,
      ...companyPayload
    } = pending;
    const canBuy =
      typeof p_puede_comprar === "boolean"
        ? p_puede_comprar
        : companyPayload.p_tipo === "compradora";
    const canSell =
      typeof p_puede_vender === "boolean"
        ? p_puede_vender
        : companyPayload.p_tipo === "proveedora";
    const { error } = await supabase.rpc(
      "registrar_empresa_y_perfil_v2",
      {
        ...companyPayload,
        p_puede_comprar: canBuy,
        p_puede_vender: canSell,
      },
    );
    if (error) throw error;
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = userData.user
      ? await supabase
          .from("perfiles")
          .select("empresa_id")
          .eq("id", userData.user.id)
          .single()
      : { data: null };
    let categoryIds = Array.isArray(p_rubros) ? p_rubros.map(Number) : [];
    if (Array.isArray(p_rubros_nombres) && p_rubros_nombres.length) {
      const { data: availableCategories } = await supabase
        .from("rubros")
        .select("id, nombre")
        .eq("activo", true);
      const selectedNames = new Set(p_rubros_nombres.map(String));
      categoryIds = (availableCategories ?? [])
        .filter((category) => selectedNames.has(category.nombre))
        .map((category) => category.id);
    }
    if (profile?.empresa_id && categoryIds.length) {
      const categoryError = await persistCompanyCategories(
        profile.empresa_id,
        categoryIds,
      );
      if (categoryError)
        setMessage(
          `La empresa se vinculó, pero los rubros no pudieron guardarse: ${categoryError}`,
        );
    }
    localStorage.removeItem("miconect-pending-company");
    if (userData.user?.user_metadata?.miconect_pending_company) {
      await supabase.auth.updateUser({
        data: { miconect_pending_company: null },
      });
    }
    return true;
  }

  async function finishPendingInvite() {
    const raw = localStorage.getItem("miconect-pending-invite");
    if (!raw) return false;
    const pending = JSON.parse(raw) as {
      token: string;
      nombre: string;
      apellido: string;
    };
    const { error } = await supabase.rpc("aceptar_invitacion_empresa", {
      p_token: pending.token,
      p_nombre: pending.nombre,
      p_apellido: pending.apellido,
    });
    if (error) throw error;
    localStorage.removeItem("miconect-pending-invite");
    window.history.replaceState({}, "", window.location.pathname);
    return true;
  }

  async function loadAccount(userId: string) {
    if (loadingUserRef.current === userId) return;
    loadingUserRef.current = userId;
    try {
      let { data } = await supabase
        .from("perfiles")
        .select(
          "id, nombre, apellido, rol, empresas(id, tipo, puede_comprar, puede_vender, razon_social, nombre_comercial, estado, estado_operativo)",
        )
        .eq("id", userId)
        .maybeSingle();

      if (!data) {
        const completedInvite = await finishPendingInvite();
        const { data: currentUser } = await supabase.auth.getUser();
        const metadataPending = currentUser.user?.user_metadata
          ?.miconect_pending_company as Record<string, unknown> | undefined;
        const completedCompany = completedInvite
          ? false
          : await finishPendingRegistration(metadataPending ?? null);
        if (completedInvite || completedCompany) {
          const result = await supabase
            .from("perfiles")
            .select(
              "id, nombre, apellido, rol, empresas(id, tipo, puede_comprar, puede_vender, razon_social, nombre_comercial, estado, estado_operativo)",
            )
            .eq("id", userId)
            .single();
          data = result.data;
        }
      }

      const next = data as unknown as Account | null;
      if (next && (next.empresas || next.rol === "administrador_plataforma")) {
        activeUserRef.current = userId;
        setOrphanUser(null);
        setAccount(next);
        const canBuy = companyCanBuy(next.empresas);
        const canSell = companyCanSell(next.empresas);
        const rememberedMode = localStorage.getItem(
          "miconect-company-mode",
        ) as CompanyMode | null;
        const initialMode: CompanyMode =
          canBuy && canSell && rememberedMode === "provider"
            ? "provider"
            : canBuy
              ? "buyer"
              : "provider";
        setCompanyMode(initialMode);
        await loadRows(next, initialMode);
        if (next.empresas) await loadAwards(next);
        if (next.empresas) await loadNotifications(next.empresas.id);
        if (canSell && next.empresas) {
          await loadProviderCategories(next.empresas.id);
          await loadProviderQuotes(next.empresas.id);
          await loadProviderAdvertisement();
        }
        if (canBuy) {
          const { data: available } = await supabase
            .from("rubros")
            .select("id, nombre")
            .eq("activo", true)
            .order("nombre");
          setCategories((available ?? []) as Category[]);
          await loadBuyerQuotes(next.empresas?.id);
          await loadBuyerAdvertisement();
        }
      } else {
        const { data: currentUser } = await supabase.auth.getUser();
        setAccount(null);
        setOrphanUser({
          id: userId,
          email: currentUser.user?.email ?? "",
        });
        if (!inviteToken) setView("register");
        setMessage(
          "Tu cuenta está confirmada, pero falta vincularla. Completá los datos de la empresa o, si recibiste una invitación, volvé a abrir ese enlace.",
        );
      }
    } catch (error) {
      console.error("No se pudo completar el registro pendiente", error);
      setMessage(registrationErrorMessage(error, "No se pudo completar el registro."));
    } finally {
      setLoadingAccount(false);
      loadingUserRef.current = null;
    }
  }

  async function loadNotifications(companyId: string) {
    if (notificationRefreshInFlightRef.current) return;
    notificationRefreshInFlightRef.current = true;
    try {
      const { data, error } = await supabase
        .from("notificaciones")
        .select(
          "id, tipo, titulo, mensaje, entidad, entidad_id, leida_en, creada_en",
        )
        .eq("empresa_destinataria_id", companyId)
        .order("creada_en", { ascending: false })
        .limit(30);
      if (error) return;

      const nextNotifications = (data ?? []) as Notification[];
      const known = knownNotificationIdsRef.current;
      const incoming =
        known?.companyId === companyId
          ? nextNotifications.find(
              (item) => !item.leida_en && !known.ids.has(item.id),
            )
          : null;

      knownNotificationIdsRef.current = {
        companyId,
        ids: new Set(nextNotifications.map((item) => item.id)),
      };
      setNotifications(nextNotifications);

      if (incoming) {
        setLiveNotification(incoming);
        if (incoming.tipo === "cotizacion_recibida") {
          void loadBuyerQuotes(companyId);
        } else if (incoming.tipo === "nueva_solicitud" && account) {
          void loadRows(account, "provider");
        } else if (incoming.tipo === "adjudicacion_recibida" && account) {
          void loadAwards(account);
        }
      }
    } finally {
      notificationRefreshInFlightRef.current = false;
    }
  }

  async function markNotificationRead(notification: Notification) {
    if (!notification.leida_en) {
      const readAt = new Date().toISOString();
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida_en: readAt })
        .eq("id", notification.id);
      if (!error) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, leida_en: readAt } : item,
          ),
        );
      }
    }
    if (liveNotification?.id === notification.id) setLiveNotification(null);
    setNotificationOpen(false);
    if (notification.tipo === "nueva_solicitud") {
      setCompanyMode("provider");
      localStorage.setItem("miconect-company-mode", "provider");
      setProviderView("requests");
      if (account) await loadRows(account, "provider");
    } else if (notification.tipo === "cotizacion_recibida") {
      setCompanyMode("buyer");
      localStorage.setItem("miconect-company-mode", "buyer");
      const updatedQuotes = await loadBuyerQuotes();
      const relatedQuote = updatedQuotes.find(
        (quote) =>
          quote.id === notification.entidad_id ||
          quote.solicitud_id === notification.entidad_id,
      );
      if (relatedQuote) {
        await openRequest(relatedQuote.solicitud_id, "buyer");
      } else {
        setBuyerView("quotes");
      }
    } else if (notification.tipo === "adjudicacion_recibida" && account) {
      setCompanyMode("provider");
      localStorage.setItem("miconect-company-mode", "provider");
      setProviderView("awards");
      await loadAwards(account);
    }
  }

  async function markAllNotificationsRead() {
    if (!account?.empresas) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase
      .from("notificaciones")
      .update({ leida_en: readAt })
      .eq("empresa_destinataria_id", account.empresas.id)
      .is("leida_en", null);
    if (!error) {
      setNotifications((current) =>
        current.map((item) => ({ ...item, leida_en: item.leida_en || readAt })),
      );
    }
  }

  async function loadTeam() {
    if (!account?.empresas) return;
    setMessage("");
    const { data: members, error } = await supabase
      .from("perfiles")
      .select("id, nombre, apellido, rol")
      .eq("empresa_id", account.empresas.id)
      .order("nombre");
    if (error) {
      setMessage(error.message);
      return;
    }
    setTeamMembers((members ?? []) as TeamMember[]);
    if (account.rol === "administrador_empresa") {
      const { data: invitations } = await supabase
        .from("invitaciones_empresa")
        .select("id, email, rol, token, creada_en, vence_en, usada_en")
        .eq("empresa_id", account.empresas.id)
        .order("creada_en", { ascending: false });
      setTeamInvitations((invitations ?? []) as CompanyInvitation[]);
    } else {
      setTeamInvitations([]);
    }
  }

  async function createTeamInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("crear_invitacion_empresa", {
      p_email: form.get("email"),
      p_rol: form.get("rol"),
    });
    if (error || !data) {
      setMessage(error?.message || "No se pudo crear la invitación.");
      setBusy(false);
      return;
    }
    const link = `${window.location.origin}${window.location.pathname}?invite=${data}`;
    setInvitationLink(link);
    const { error: emailError } = await supabase.functions.invoke(
      "enviar-invitacion-empresa",
      {
        body: {
          token: data,
          invitationUrl: link,
        },
      },
    );
    setMessage(
      emailError
        ? "La invitación fue creada, pero el correo no pudo enviarse. Copiá el enlace y compartilo manualmente."
        : "Invitación creada y enviada por correo.",
    );
    event.currentTarget.reset();
    await loadTeam();
    setBusy(false);
  }

  async function manageTeamMember(
    memberId: string,
    action: "cambiar_rol" | "retirar",
    role?: "miembro" | "administrador_empresa",
  ) {
    if (
      action === "retirar" &&
      !window.confirm("¿Retirar a este integrante de la empresa?")
    )
      return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("gestionar_miembro_empresa", {
      p_perfil_id: memberId,
      p_accion: action,
      p_rol: role ?? null,
    });
    setMessage(
      error
        ? error.message
        : action === "retirar"
          ? "Integrante retirado correctamente."
          : "Rol actualizado correctamente.",
    );
    if (!error) await loadTeam();
    setBusy(false);
  }

  async function acceptTeamInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    const pending = {
      token: inviteToken,
      nombre: String(form.get("nombre")),
      apellido: String(form.get("apellido")),
    };
    localStorage.setItem("miconect-pending-invite", JSON.stringify(pending));
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}?invite=${inviteToken}`,
      },
    });
    if (error) {
      localStorage.removeItem("miconect-pending-invite");
      setMessage(error.message);
      setBusy(false);
      return;
    }
    if (!data.session) {
      setMessage(
        "Revisá tu correo y confirmá la cuenta. Después volvé a Miconect para completar el acceso.",
      );
      setBusy(false);
      return;
    }
    try {
      await finishPendingInvite();
      await loadAccount(data.user!.id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo aceptar la invitación.",
      );
    }
    setBusy(false);
  }

  async function completeAuthenticatedInvitation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage("La sesión venció. Volvé a ingresar.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.rpc("aceptar_invitacion_empresa", {
      p_token: inviteToken,
      p_nombre: form.get("nombre"),
      p_apellido: form.get("apellido"),
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    window.history.replaceState({}, "", window.location.pathname);
    setMessage("");
    await loadAccount(authData.user.id);
    setBusy(false);
  }

  async function loadProfile() {
    if (!account?.empresas) return;
    setMessage("");
    const [{ data: userData }, { data: profile }, { data: company }] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("perfiles")
          .select("nombre, apellido, cargo")
          .eq("id", account.id)
          .single(),
        supabase
          .from("empresas")
          .select(
            "razon_social, nombre_comercial, domicilio, email_empresa, telefono, whatsapp, sitio_web",
          )
          .eq("id", account.empresas.id)
          .single(),
      ]);
    setProfileForm({
      nombre: profile?.nombre ?? account.nombre,
      apellido: profile?.apellido ?? account.apellido,
      cargo: profile?.cargo ?? "",
      email: userData.user?.email ?? "",
    });
    setCompanyForm({
      razonSocial: company?.razon_social ?? account.empresas.razon_social,
      nombreComercial: company?.nombre_comercial ?? "",
      domicilio: company?.domicilio ?? "",
      email: company?.email_empresa ?? "",
      telefono: company?.telefono ?? "",
      whatsapp: company?.whatsapp ?? "",
      sitioWeb: company?.sitio_web ?? "",
    });
  }

  async function savePersonalProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("actualizar_mi_perfil", {
      p_nombre: profileForm.nombre,
      p_apellido: profileForm.apellido,
      p_cargo: profileForm.cargo || null,
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Datos personales actualizados.");
      await loadAccount(account!.id);
    }
    setBusy(false);
  }

  async function saveCompanyProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("actualizar_datos_empresa", {
      p_nombre_comercial: companyForm.nombreComercial || null,
      p_domicilio: companyForm.domicilio || null,
      p_email_empresa: companyForm.email,
      p_telefono: companyForm.telefono || null,
      p_whatsapp: companyForm.whatsapp || null,
      p_sitio_web: companyForm.sitioWeb || null,
    });
    setMessage(error ? error.message : "Datos empresariales actualizados.");
    if (!error) await loadProfile();
    setBusy(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Contraseña actualizada correctamente.");
    if (!error) event.currentTarget.reset();
    setBusy(false);
  }

  async function sendPasswordRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(
      String(form.get("email")),
      { redirectTo: window.location.origin + window.location.pathname },
    );
    setMessage(
      error
        ? friendlyAuthError(error)
        : "Si el correo está registrado, recibirás un enlace para cambiar la contraseña.",
    );
    setBusy(false);
  }

  async function finishPasswordRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(friendlyAuthError(error));
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    setPasswordRecovery(false);
    setView("login");
    setMessage("Contraseña actualizada. Ya podés ingresar.");
    setBusy(false);
  }

  async function loadAwards(currentAccount: Account) {
    if (!currentAccount.empresas) {
      setAwards([]);
      return;
    }
    const { data: awarded, error } = await supabase
      .from("adjudicaciones")
      .select(
        "id, solicitud_id, item_solicitud_id, cotizacion_id, item_cotizacion_id, empresa_proveedora_id, cantidad_adjudicada, precio_unitario_adjudicado, adjudicada_en",
      )
      .order("adjudicada_en", { ascending: false })
      .limit(200);
    if (error || !awarded?.length) {
      setAwards([]);
      if (error) {
        setMessage(
          "No se pudieron actualizar las adjudicaciones. Intentá nuevamente.",
        );
      }
      return;
    }
    const [
      { data: requests },
      { data: requestedItems },
      { data: quotes },
      { data: quotedItems },
    ] = await Promise.all([
      supabase
        .from("solicitudes")
        .select("id, codigo, titulo, empresa_compradora_id")
        .in("id", [...new Set(awarded.map((item) => item.solicitud_id))]),
      supabase
        .from("items_solicitud")
        .select("id, articulo, unidad")
        .in("id", [...new Set(awarded.map((item) => item.item_solicitud_id))]),
      supabase
        .from("cotizaciones")
        .select(
          "id, moneda, impuestos_incluidos, condiciones_pago, plazo_entrega",
        )
        .in("id", [...new Set(awarded.map((item) => item.cotizacion_id))]),
      supabase
        .from("items_cotizacion")
        .select("id, alicuota_iva")
        .in("id", [...new Set(awarded.map((item) => item.item_cotizacion_id))]),
    ]);
    const companyIds = [
      ...new Set([
        ...awarded.map((item) => item.empresa_proveedora_id),
        ...(requests ?? []).map((request) => request.empresa_compradora_id),
      ]),
    ];
    const { data: companies } = await supabase
      .from("empresas")
      .select("id, razon_social, nombre_comercial")
      .in("id", companyIds);
    const requestMap = new Map((requests ?? []).map((item) => [item.id, item]));
    const requestedItemMap = new Map(
      (requestedItems ?? []).map((item) => [item.id, item]),
    );
    const quoteMap = new Map((quotes ?? []).map((item) => [item.id, item]));
    const quotedItemMap = new Map(
      (quotedItems ?? []).map((item) => [item.id, item]),
    );
    const companyMap = new Map(
      (companies ?? []).map((item) => [item.id, item]),
    );
    setAwards(
      awarded.map((award) => {
        const request = requestMap.get(award.solicitud_id);
        const requestedItem = requestedItemMap.get(award.item_solicitud_id);
        const quote = quoteMap.get(award.cotizacion_id);
        const quotedItem = quotedItemMap.get(award.item_cotizacion_id);
        const provider = companyMap.get(award.empresa_proveedora_id);
        const buyerCompany = request
          ? companyMap.get(request.empresa_compradora_id)
          : null;
        const subtotal =
          Number(award.cantidad_adjudicada) *
          Number(award.precio_unitario_adjudicado);
        const total = quote?.impuestos_incluidos
          ? subtotal
          : subtotal * (1 + Number(quotedItem?.alicuota_iva ?? 0) / 100);
        return {
          id: award.id,
          requestId: award.solicitud_id,
          requestItemId: award.item_solicitud_id,
          quotationId: award.cotizacion_id,
          requestCode: request?.codigo ?? 0,
          requestTitle: request?.titulo ?? "Solicitud",
          article: requestedItem?.articulo ?? "Artículo",
          unit: requestedItem?.unidad ?? "unidad",
          providerName:
            provider?.nombre_comercial ||
            provider?.razon_social ||
            "Empresa proveedora",
          providerCompanyId: award.empresa_proveedora_id,
          buyerName:
            buyerCompany?.nombre_comercial ||
            buyerCompany?.razon_social ||
            "Empresa compradora",
          buyerCompanyId: request?.empresa_compradora_id ?? "",
          quantity: Number(award.cantidad_adjudicada),
          unitPrice: Number(award.precio_unitario_adjudicado),
          total,
          currency: quote?.moneda ?? "ARS",
          paymentTerms: quote?.condiciones_pago ?? "Sin especificar",
          deliveryTime: quote?.plazo_entrega ?? "Sin especificar",
          awardedAt: award.adjudicada_en,
        } as AwardRecord;
      }),
    );
  }

  async function loadBuyerQuotes(companyId = account?.empresas?.id ?? "") {
    const { data: requests, error: requestsError } = await supabase
      .from("solicitudes")
      .select("id, codigo, titulo, estado, fecha_limite")
      .eq("empresa_compradora_id", companyId)
      .order("creada_en", { ascending: false })
      .limit(100);
    if (requestsError) {
      setBuyerQuotes([]);
      setMessage(
        "No se pudieron actualizar las cotizaciones recibidas. Intentá nuevamente.",
      );
      return [] as BuyerQuote[];
    }
    if (!requests?.length) {
      setBuyerQuotes([]);
      return [] as BuyerQuote[];
    }

    const { data: quotes, error } = await supabase
      .from("cotizaciones")
      .select(
        "id, solicitud_id, empresa_proveedora_id, moneda, estado, impuestos_incluidos, condiciones_pago, plazo_entrega, observaciones, pdf_path, presentada_en",
      )
      .in(
        "solicitud_id",
        requests.map((request) => request.id),
      )
      .eq("estado", "presentada")
      .order("presentada_en", { ascending: false });
    if (error || !quotes?.length) {
      setBuyerQuotes([]);
      if (error) {
        setMessage(
          "No se pudieron actualizar las cotizaciones recibidas. Intentá nuevamente.",
        );
      }
      return [] as BuyerQuote[];
    }

    const [{ data: companies }, { data: quoteItems }] = await Promise.all([
      supabase
        .from("empresas")
        .select("id, razon_social, nombre_comercial, email_empresa, telefono")
        .in("id", [
          ...new Set(quotes.map((quote) => quote.empresa_proveedora_id)),
        ]),
      supabase
        .from("items_cotizacion")
        .select(
          "cotizacion_id, cantidad_ofertada, precio_unitario, alicuota_iva",
        )
        .in(
          "cotizacion_id",
          quotes.map((quote) => quote.id),
        ),
    ]);
    const requestMap = new Map(
      requests.map((request) => [request.id, request]),
    );
    const companyMap = new Map(
      (companies ?? []).map((company) => [company.id, company]),
    );
    const nextBuyerQuotes = quotes.map((quote) => {
        const request = requestMap.get(quote.solicitud_id);
        const company = companyMap.get(quote.empresa_proveedora_id);
        const total = (quoteItems ?? [])
          .filter((item) => item.cotizacion_id === quote.id)
          .reduce((sum, item) => {
            const subtotal =
              Number(item.cantidad_ofertada) * Number(item.precio_unitario);
            return (
              sum +
              (quote.impuestos_incluidos
                ? subtotal
                : subtotal * (1 + Number(item.alicuota_iva) / 100))
            );
          }, 0);
        return {
          id: quote.id,
          solicitud_id: quote.solicitud_id,
          empresa_proveedora_id: quote.empresa_proveedora_id,
          requestCode: request?.codigo ?? 0,
          requestTitle: request?.titulo ?? "Solicitud",
          requestState: request?.estado ?? "",
          requestDeadline: request?.fecha_limite ?? "",
          providerName:
            company?.nombre_comercial ||
            company?.razon_social ||
            "Empresa proveedora",
          providerEmail: company?.email_empresa ?? null,
          providerTelefono: company?.telefono ?? null,
          moneda: quote.moneda,
          estado: quote.estado,
          condiciones_pago: quote.condiciones_pago,
          plazo_entrega: quote.plazo_entrega,
          impuestos_incluidos: quote.impuestos_incluidos,
          observaciones: quote.observaciones,
          pdfPath: quote.pdf_path,
          presentada_en: quote.presentada_en,
          total,
        } as BuyerQuote;
      });
    setBuyerQuotes(nextBuyerQuotes);
    return nextBuyerQuotes;
  }

  async function loadProviderQuotes(companyId: string) {
    const { data: quotes, error } = await supabase
      .from("cotizaciones")
      .select(
        "id, solicitud_id, moneda, estado, impuestos_incluidos, condiciones_pago, plazo_entrega, observaciones, pdf_path, presentada_en",
      )
      .eq("empresa_proveedora_id", companyId)
      .order("presentada_en", { ascending: false })
      .limit(100);
    if (error || !quotes?.length) {
      setProviderQuotes([]);
      if (error) {
        setMessage(
          "No se pudieron actualizar tus cotizaciones. Intentá nuevamente.",
        );
      }
      return [] as ProviderQuote[];
    }
    const requestIds = [...new Set(quotes.map((quote) => quote.solicitud_id))];
    const quoteIds = quotes.map((quote) => quote.id);
    const [{ data: requests }, { data: quoteItems }, { data: quoteAwards }] =
      await Promise.all([
        supabase
          .from("solicitudes")
          .select(
            "id, codigo, titulo, estado, fecha_limite, empresa_compradora_id",
          )
          .in("id", requestIds),
        supabase
          .from("items_cotizacion")
          .select(
            "cotizacion_id, cantidad_ofertada, precio_unitario, alicuota_iva",
          )
          .in("cotizacion_id", quoteIds),
        supabase
          .from("adjudicaciones")
          .select("cotizacion_id")
          .in("cotizacion_id", quoteIds),
      ]);
    const buyerIds = [
      ...new Set((requests ?? []).map((item) => item.empresa_compradora_id)),
    ];
    const { data: buyers } = buyerIds.length
      ? await supabase
          .from("empresas")
          .select(
            "id, razon_social, nombre_comercial, email_empresa, telefono, whatsapp",
          )
          .in("id", buyerIds)
      : { data: [] };
    const requestMap = new Map((requests ?? []).map((item) => [item.id, item]));
    const buyerMap = new Map((buyers ?? []).map((item) => [item.id, item]));
    const awardedQuoteIds = new Set(
      (quoteAwards ?? []).map((item) => item.cotizacion_id),
    );
    const nextProviderQuotes = quotes.map((quote) => {
        const request = requestMap.get(quote.solicitud_id);
        const buyerCompany = request
          ? buyerMap.get(request.empresa_compradora_id)
          : null;
        const total = (quoteItems ?? [])
          .filter((item) => item.cotizacion_id === quote.id)
          .reduce((sum, item) => {
            const subtotal =
              Number(item.cantidad_ofertada) * Number(item.precio_unitario);
            return (
              sum +
              (quote.impuestos_incluidos
                ? subtotal
                : subtotal * (1 + Number(item.alicuota_iva) / 100))
            );
          }, 0);
        const displayState = awardedQuoteIds.has(quote.id)
          ? "Adjudicada"
          : request?.estado === "adjudicada" || request?.estado === "cerrada"
            ? "Cerrada"
            : "Presentada";
        return {
          id: quote.id,
          requestId: quote.solicitud_id,
          requestCode: request?.codigo ?? 0,
          requestTitle: request?.titulo ?? "Solicitud",
          buyerName:
            buyerCompany?.nombre_comercial ||
            buyerCompany?.razon_social ||
            "Empresa compradora",
          buyerEmail:
            displayState === "Adjudicada"
              ? (buyerCompany?.email_empresa ?? null)
              : null,
          buyerTelefono:
            displayState === "Adjudicada"
              ? (buyerCompany?.whatsapp ?? buyerCompany?.telefono ?? null)
              : null,
          currency: quote.moneda,
          state: quote.estado,
          displayState,
          paymentTerms: quote.condiciones_pago,
          deliveryTime: quote.plazo_entrega,
          taxesIncluded: quote.impuestos_incluidos,
          observations: quote.observaciones,
          pdfPath: quote.pdf_path,
          presentedAt: quote.presentada_en,
          deadline: request?.fecha_limite ?? "",
          total,
        } as ProviderQuote;
      });
    setProviderQuotes(nextProviderQuotes);
    return nextProviderQuotes;
  }

  async function openProviderQuote(quote: ProviderQuote) {
    setBusy(true);
    setMessage("");
    const { data: quotedItems, error } = await supabase
      .from("items_cotizacion")
      .select(
        "id, item_solicitud_id, cantidad_ofertada, precio_unitario, alicuota_iva, marca, especificacion_ofertada, plazo_entrega_item, observaciones",
      )
      .eq("cotizacion_id", quote.id)
      .order("id");
    if (error || !quotedItems) {
      setMessage(error?.message || "No se pudo abrir la cotización.");
      setBusy(false);
      return;
    }
    const { data: requestedItems } = await supabase
      .from("items_solicitud")
      .select("id, articulo, cantidad, unidad")
      .in(
        "id",
        quotedItems.map((item) => item.item_solicitud_id),
      );
    const requestItemMap = new Map(
      (requestedItems ?? []).map((item) => [item.id, item]),
    );
    setProviderQuoteItems(
      quotedItems.map((item) => {
        const requested = requestItemMap.get(item.item_solicitud_id);
        return {
          ...item,
          articulo: requested?.articulo ?? "Artículo",
          unidad: requested?.unidad ?? "unidad",
          cantidad_solicitada: Number(requested?.cantidad ?? 0),
          cantidad_ofertada: Number(item.cantidad_ofertada),
          precio_unitario: Number(item.precio_unitario),
          alicuota_iva: Number(item.alicuota_iva),
        } as BuyerQuoteItem;
      }),
    );
    setSelectedProviderQuote(quote);
    setProviderEditLines(
      quotedItems.map((item) => ({
        item_solicitud_id: item.item_solicitud_id,
        included: true,
        cantidad_ofertada: String(item.cantidad_ofertada),
        precio_unitario: String(item.precio_unitario),
        alicuota_iva: String(item.alicuota_iva),
        marca: item.marca ?? "",
        especificacion_ofertada: item.especificacion_ofertada ?? "",
        plazo_entrega_item: item.plazo_entrega_item ?? "",
        observaciones: item.observaciones ?? "",
      })),
    );
    setProviderEditHeader({
      currency: quote.currency,
      taxesIncluded: quote.taxesIncluded,
      paymentTerms: quote.paymentTerms,
      deliveryTime: quote.deliveryTime,
      observations: quote.observations ?? "",
    });
    setQuotePdfFile(null);
    setProviderQuoteEditOpen(false);
    setProviderView("quoteDetail");
    setBusy(false);
  }

  function updateProviderEditLine(
    index: number,
    field: keyof QuoteLine,
    value: string | boolean,
  ) {
    setProviderEditLines((lines) =>
      lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  }

  async function saveProviderQuoteChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProviderQuote || !account?.empresas) return;
    if (
      selectedProviderQuote.displayState !== "Presentada" ||
      !selectedProviderQuote.deadline ||
      new Date(selectedProviderQuote.deadline).getTime() <= Date.now()
    ) {
      setMessage(
        "Esta cotización ya no puede modificarse porque la solicitud cerró o fue adjudicada.",
      );
      setProviderQuoteEditOpen(false);
      return;
    }
    if (
      providerEditLines.some(
        (line) =>
          Number(line.cantidad_ofertada) <= 0 ||
          Number(line.precio_unitario) < 0 ||
          line.precio_unitario === "",
      )
    ) {
      setMessage("Completá correctamente las cantidades y precios.");
      return;
    }
    if (
      !providerEditHeader.paymentTerms.trim() ||
      !providerEditHeader.deliveryTime.trim()
    ) {
      setMessage("Completá las condiciones de pago y el plazo de entrega.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("modificar_cotizacion", {
      p_cotizacion_id: selectedProviderQuote.id,
      p_moneda: providerEditHeader.currency,
      p_impuestos_incluidos: providerEditHeader.taxesIncluded,
      p_condiciones_pago: providerEditHeader.paymentTerms,
      p_plazo_entrega: providerEditHeader.deliveryTime,
      p_observaciones: providerEditHeader.observations,
      p_items: providerEditLines.map(({ included: _included, ...line }) => ({
        ...line,
        cantidad_ofertada: Number(line.cantidad_ofertada),
        precio_unitario: Number(line.precio_unitario),
        alicuota_iva: Number(line.alicuota_iva),
      })),
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    setMessage("Cotización modificada correctamente.");
    setProviderQuoteEditOpen(false);
    await loadProviderQuotes(account.empresas.id);
    setProviderView("quotes");
    setBusy(false);
  }

  async function uploadQuotePdf() {
    if (!selectedProviderQuote || !quotePdfFile || !account?.empresas) return;
    if (
      quotePdfFile.type !== "application/pdf" &&
      !quotePdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("El archivo de la cotización debe estar en formato PDF.");
      return;
    }
    if (quotePdfFile.size > 10 * 1024 * 1024) {
      setMessage("El PDF debe pesar como máximo 10 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    const safeName = quotePdfFile.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${selectedProviderQuote.id}/${createUuid()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("pdf-cotizaciones")
      .upload(filePath, quotePdfFile, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (uploadError) {
      setMessage(uploadError.message);
      setBusy(false);
      return;
    }
    const { data: previousPath, error } = await supabase.rpc(
      "actualizar_pdf_cotizacion",
      {
        p_cotizacion_id: selectedProviderQuote.id,
        p_pdf_path: filePath,
      },
    );
    if (error) {
      await supabase.storage.from("pdf-cotizaciones").remove([filePath]);
      setMessage(error.message);
      setBusy(false);
      return;
    }
    if (typeof previousPath === "string" && previousPath !== filePath) {
      await supabase.storage.from("pdf-cotizaciones").remove([previousPath]);
    }
    const updatedQuote = { ...selectedProviderQuote, pdfPath: filePath };
    setSelectedProviderQuote(updatedQuote);
    setQuotePdfFile(null);
    setMessage(
      previousPath
        ? "PDF reemplazado correctamente."
        : "PDF cargado correctamente.",
    );
    await loadProviderQuotes(account.empresas.id);
    setBusy(false);
  }

  async function downloadQuotePdf(path: string) {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.storage
      .from("pdf-cotizaciones")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      setMessage(error?.message || "No se pudo abrir el PDF.");
      setBusy(false);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    setBusy(false);
  }

  async function openBuyerQuote(
    quote: BuyerQuote,
    originRequestId: string | null = null,
  ) {
    setBusy(true);
    setMessage("");
    const { data: quotedItems, error } = await supabase
      .from("items_cotizacion")
      .select(
        "id, item_solicitud_id, cantidad_ofertada, precio_unitario, alicuota_iva, marca, especificacion_ofertada, plazo_entrega_item, observaciones",
      )
      .eq("cotizacion_id", quote.id)
      .order("id");
    if (error || !quotedItems) {
      setMessage(error?.message || "No se pudo abrir la cotización.");
      setBusy(false);
      return;
    }
    const itemIds = quotedItems.map((item) => item.item_solicitud_id);
    const { data: requestedItems } = itemIds.length
      ? await supabase
          .from("items_solicitud")
          .select("id, articulo, cantidad, unidad")
          .in("id", itemIds)
      : { data: [] };
    const requestItemMap = new Map(
      (requestedItems ?? []).map((item) => [item.id, item]),
    );
    setSelectedBuyerQuote(quote);
    setBuyerQuoteItems(
      quotedItems.map((item) => {
        const requested = requestItemMap.get(item.item_solicitud_id);
        return {
          ...item,
          articulo: requested?.articulo ?? "Artículo",
          unidad: requested?.unidad ?? "unidad",
          cantidad_solicitada: Number(requested?.cantidad ?? 0),
          cantidad_ofertada: Number(item.cantidad_ofertada),
          precio_unitario: Number(item.precio_unitario),
          alicuota_iva: Number(item.alicuota_iva),
        } as BuyerQuoteItem;
      }),
    );
    setAwardSelections(
      Object.fromEntries(
        quotedItems.map((item) => [
          item.id,
          {
            selected: true,
            quantity: String(item.cantidad_ofertada),
          },
        ]),
      ),
    );
    setAwardOpen(false);
    setBuyerQuoteOriginRequestId(originRequestId);
    setBuyerView("quoteDetail");
    setBusy(false);
  }

  async function confirmAward() {
    if (!selectedBuyerQuote || !account?.empresas) return;
    if (
      selectedBuyerQuote.requestState !== "publicada" ||
      !selectedBuyerQuote.requestDeadline ||
      new Date(selectedBuyerQuote.requestDeadline).getTime() <= Date.now()
    ) {
      setMessage(
        "Esta solicitud ya no admite adjudicaciones. Actualizá la lista para ver su estado vigente.",
      );
      setAwardOpen(false);
      return;
    }
    const selected = buyerQuoteItems.filter(
      (item) => awardSelections[item.id]?.selected,
    );
    if (!selected.length) {
      setMessage("Seleccioná al menos un artículo para adjudicar.");
      return;
    }
    if (
      selected.some((item) => {
        const quantity = Number(awardSelections[item.id]?.quantity);
        return quantity <= 0 || quantity > item.cantidad_ofertada;
      })
    ) {
      setMessage(
        "La cantidad adjudicada debe ser mayor a cero y no superar la cantidad ofertada.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("adjudicar_cotizacion", {
      p_cotizacion_id: selectedBuyerQuote.id,
      p_items: selected.map((item) => ({
        item_cotizacion_id: item.id,
        cantidad_adjudicada: Number(awardSelections[item.id].quantity),
      })),
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    setMessage(
      selected.length === buyerQuoteItems.length
        ? "Cotización adjudicada correctamente."
        : "Artículos adjudicados correctamente.",
    );
    setAwardOpen(false);
    await loadBuyerQuotes();
    await loadRows(account);
    await loadAwards(account);
    setBuyerView("quotes");
    setBusy(false);
  }

  async function loadRows(next: Account, modeOverride?: CompanyMode) {
    if (next.rol === "administrador_plataforma") {
      const { data, error } = await supabase
        .from("empresas")
        .select(
          "id, razon_social, nombre_comercial, tipo, puede_comprar, puede_vender, cuit, localidad, domicilio, email_empresa, telefono, estado, estado_operativo, motivo_observacion, creada_en",
        )
        .order("creada_en", { ascending: false })
        .limit(100);
      if (error) {
        setReviews([]);
        setRows([]);
        setMessage(
          "No se pudo actualizar la actividad de empresas. Intentá nuevamente.",
        );
        return;
      }
      setReviews((data ?? []) as CompanyReview[]);
      setRows(
        (data ?? []).map((item) => ({
          id: item.id,
          title: item.razon_social,
          meta: companyCapabilityLabel(item as CompanyReview),
          state: item.estado,
        })),
      );
    } else if (
      companyCanBuy(next.empresas) &&
      ((modeOverride ?? companyMode) === "buyer" ||
        !companyCanSell(next.empresas))
    ) {
      const { data, error } = await supabase
        .from("solicitudes")
        .select("id, codigo, titulo, estado, fecha_limite")
        .eq("empresa_compradora_id", next.empresas?.id ?? "")
        .order("creada_en", { ascending: false })
        .limit(100);
      if (error) {
        setRows([]);
        setMessage(
          "No se pudieron actualizar tus solicitudes. Intentá nuevamente.",
        );
        return;
      }
      setRows(
        (data ?? []).map((item) => ({
          id: item.id,
          title: item.titulo,
          meta: `Solicitud #${item.codigo}`,
          state: item.estado,
        })),
      );
    } else {
      const { data, error } = await supabase
        .from("solicitudes")
        .select("id, codigo, titulo, estado, fecha_limite")
        .eq("estado", "publicada")
        .neq("empresa_compradora_id", next.empresas?.id ?? "")
        .gt("fecha_limite", new Date().toISOString())
        .order("fecha_limite", { ascending: true })
        .limit(100);
      if (error) {
        setRows([]);
        setMessage(
          "No se pudieron actualizar los pedidos disponibles. Intentá nuevamente.",
        );
        return;
      }
      setRows(
        (data ?? []).map((item) => ({
          id: item.id,
          title: item.titulo,
          meta: `Solicitud #${item.codigo}`,
          state: item.estado,
        })),
      );
    }
  }

  async function loadAdminSupervision() {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc(
      "supervision_solicitudes_admin",
    );
    if (error) {
      setMessage("No se pudo cargar la supervisión de solicitudes.");
      setSupervisionRequests([]);
    } else {
      setSupervisionRequests((data ?? []) as AdminSupervisionRequest[]);
    }
    setBusy(false);
  }

  async function loadAdminQuotes(requestId: string) {
    setLoadingAdminQuotes(true);
    setAdminQuotesError("");
    setAdminQuotes([]);
    const { data, error } = await supabase.rpc(
      "supervision_cotizaciones_admin",
      { p_solicitud_id: requestId },
    );
    if (error) {
      setAdminQuotesError(
        error.message.includes("protegidas")
          ? "Las ofertas están protegidas hasta su fecha de apertura."
          : "No se pudieron consultar las cotizaciones.",
      );
      setAdminQuotesOpen(false);
    } else {
      setAdminQuotes((data ?? []) as AdminQuote[]);
      setAdminQuotesOpen(true);
    }
    setLoadingAdminQuotes(false);
  }

  async function openAdminFile(tipo: "cotizacion" | "adjunto_solicitud", solicitudId: string, archivoId: string) {
    setOpeningAdminFile(archivoId);
    setMessage("");
    const { data, error } = await supabase.functions.invoke(
      "archivo-supervision-admin",
      { body: { tipo, solicitudId, archivoId } },
    );
    if (error || !data?.url) {
      setMessage("No se pudo abrir el archivo. Puede no existir o continuar protegido.");
    } else {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
    setOpeningAdminFile("");
  }

  async function loadAdvertising() {
    setBusy(true);
    setMessage("");
    const [advertiserResult, placementResult, campaignResult, creativeResult, metricResult] =
      await Promise.all([
        supabase
          .from("anunciantes")
          .select("id, nombre, razon_social, email, sitio_web, activo")
          .order("nombre"),
        supabase
          .from("ubicaciones_publicidad")
          .select("id, codigo, nombre, ancho_recomendado, alto_recomendado")
          .eq("activo", true)
          .order("nombre"),
        supabase
          .from("campanas_publicidad")
          .select("id, anunciante_id, nombre, estado, fecha_inicio, fecha_fin, prioridad, anunciantes(nombre)")
          .order("creado_en", { ascending: false }),
        supabase
          .from("anuncios")
          .select("id, campana_id, ubicacion_id, titulo, texto, texto_boton, imagen_path, enlace_destino, activo, ubicaciones_publicidad(nombre)")
          .order("creado_en", { ascending: false }),
        supabase.from("eventos_publicidad").select("anuncio_id, tipo"),
      ]);
    const error =
      advertiserResult.error ||
      placementResult.error ||
      campaignResult.error ||
      creativeResult.error ||
      metricResult.error;
    if (error) setMessage(error.message);
    else {
      setAdvertisers((advertiserResult.data ?? []) as Advertiser[]);
      setAdPlacements((placementResult.data ?? []) as AdPlacement[]);
      setAdCampaigns(campaignResult.data as unknown as AdCampaign[] ?? []);
      setAdCreatives(creativeResult.data as unknown as AdCreative[] ?? []);
      setAdMetrics((metricResult.data ?? []) as AdMetric[]);
    }
    setBusy(false);
  }

  async function createAdvertiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("anunciantes").insert({
      nombre: form.get("nombre"),
      razon_social: form.get("razon_social") || null,
      email: form.get("email") || null,
      sitio_web: form.get("sitio_web") || null,
    });
    setMessage(error ? error.message : "Anunciante creado correctamente.");
    if (!error) {
      event.currentTarget.reset();
      await loadAdvertising();
    }
    setBusy(false);
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("campanas_publicidad").insert({
      anunciante_id: form.get("anunciante_id"),
      nombre: form.get("nombre"),
      estado: form.get("estado"),
      fecha_inicio: new Date(String(form.get("fecha_inicio"))).toISOString(),
      fecha_fin: new Date(String(form.get("fecha_fin"))).toISOString(),
      prioridad: Number(form.get("prioridad")),
      creada_por: account?.id,
    });
    setMessage(error ? error.message : "Campaña creada correctamente.");
    if (!error) {
      event.currentTarget.reset();
      await loadAdvertising();
    }
    setBusy(false);
  }

  async function createAdvertisement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adImage) {
      setMessage("Seleccioná una imagen para el anuncio.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const extension = adImage.name.split(".").pop()?.toLowerCase() || "webp";
    const path = `${String(form.get("campana_id"))}/${createUuid()}.${extension}`;
    const upload = await supabase.storage.from("publicidad").upload(path, adImage, {
      contentType: adImage.type,
      upsert: false,
    });
    if (upload.error) {
      setMessage(upload.error.message);
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("anuncios").insert({
      campana_id: form.get("campana_id"),
      ubicacion_id: form.get("ubicacion_id"),
      titulo: form.get("titulo"),
      texto: form.get("texto") || null,
      imagen_path: path,
      enlace_destino: form.get("enlace_destino"),
      texto_boton: form.get("texto_boton") || "Conocer más",
    });
    if (error) await supabase.storage.from("publicidad").remove([path]);
    setMessage(error ? error.message : "Anuncio publicado correctamente.");
    if (!error) {
      event.currentTarget.reset();
      setAdImage(null);
      await loadAdvertising();
    }
    setBusy(false);
  }

  async function setCampaignState(campaignId: string, estado: string) {
    setBusy(true);
    const { error } = await supabase
      .from("campanas_publicidad")
      .update({ estado, actualizado_en: new Date().toISOString() })
      .eq("id", campaignId);
    setMessage(error ? error.message : `Campaña ${estado}.`);
    if (!error) await loadAdvertising();
    setBusy(false);
  }

  async function saveAdvertiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAdvertiser) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("anunciantes").update({
      nombre: form.get("nombre"), razon_social: form.get("razon_social") || null,
      email: form.get("email") || null, sitio_web: form.get("sitio_web") || null,
      activo: form.get("activo") === "on", actualizado_en: new Date().toISOString(),
    }).eq("id", editingAdvertiser.id);
    setMessage(error ? error.message : "Anunciante actualizado correctamente.");
    if (!error) { setEditingAdvertiser(null); await loadAdvertising(); }
    setBusy(false);
  }

  async function saveAdvertisement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAd) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    let nextPath = editingAd.imagen_path;
    if (replacementAdImage) {
      const extension = replacementAdImage.name.split(".").pop()?.toLowerCase() || "webp";
      nextPath = `${String(form.get("campana_id"))}/${createUuid()}.${extension}`;
      const upload = await supabase.storage.from("publicidad").upload(nextPath, replacementAdImage, { contentType: replacementAdImage.type, upsert: false });
      if (upload.error) { setMessage(upload.error.message); setBusy(false); return; }
    }
    const { error } = await supabase.from("anuncios").update({
      campana_id: form.get("campana_id"), ubicacion_id: form.get("ubicacion_id"),
      titulo: form.get("titulo"), texto: form.get("texto") || null,
      enlace_destino: form.get("enlace_destino"), texto_boton: form.get("texto_boton") || "Conocer más",
      imagen_path: nextPath, actualizado_en: new Date().toISOString(),
    }).eq("id", editingAd.id);
    if (error && nextPath !== editingAd.imagen_path) await supabase.storage.from("publicidad").remove([nextPath]);
    else if (!error && nextPath !== editingAd.imagen_path) await supabase.storage.from("publicidad").remove([editingAd.imagen_path]);
    setMessage(error ? error.message : "Pieza publicitaria actualizada.");
    if (!error) { setEditingAd(null); setReplacementAdImage(null); await loadAdvertising(); }
    setBusy(false);
  }

  async function toggleAdvertisement(creative: AdCreative) {
    setBusy(true); setMessage("");
    const { error } = await supabase.from("anuncios").update({ activo: !creative.activo, actualizado_en: new Date().toISOString() }).eq("id", creative.id);
    setMessage(error ? error.message : creative.activo ? "Anuncio pausado." : "Anuncio activado.");
    if (!error) await loadAdvertising();
    setBusy(false);
  }

  async function deleteAdvertisement(creative: AdCreative) {
    if (!window.confirm(`Vas a eliminar definitivamente el anuncio “${creative.titulo}”. ¿Continuar?`)) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.from("anuncios").delete().eq("id", creative.id);
    if (!error) await supabase.storage.from("publicidad").remove([creative.imagen_path]);
    setMessage(error ? error.message : "Anuncio eliminado correctamente.");
    if (!error) await loadAdvertising();
    setBusy(false);
  }

  async function loadProviderCategories(companyId: string) {
    const [{ data: available }, { data: current }] = await Promise.all([
      supabase
        .from("rubros")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("empresa_rubros")
        .select("rubro_id")
        .eq("empresa_id", companyId),
    ]);
    setCategories((available ?? []) as Category[]);
    setProviderSelectedCategories((current ?? []).map((item) => item.rubro_id));
  }

  function toggleProviderCategory(id: number) {
    setProviderSelectedCategories((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function toggleRequestCategory(id: number) {
    setRequestSelectedCategories((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function saveProviderCategories() {
    if (!account?.empresas || !companyCanSell(account.empresas)) return;
    if (!providerSelectedCategories.length) {
      setMessage("Seleccioná al menos un rubro.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data: existing } = await supabase
      .from("empresa_rubros")
      .select("rubro_id")
      .eq("empresa_id", account.empresas.id);
    const current = (existing ?? []).map((item) => item.rubro_id);
    const toAdd = providerSelectedCategories.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !providerSelectedCategories.includes(id));
    let errorMessage = "";
    if (toAdd.length) {
      const { error } = await supabase.from("empresa_rubros").insert(
        toAdd.map((rubro_id) => ({
          empresa_id: account.empresas!.id,
          rubro_id,
        })),
      );
      if (error) errorMessage = error.message;
    }
    if (!errorMessage && toRemove.length) {
      const { error } = await supabase
        .from("empresa_rubros")
        .delete()
        .eq("empresa_id", account.empresas.id)
        .in("rubro_id", toRemove);
      if (error) errorMessage = error.message;
    }
    setMessage(errorMessage || "Rubros guardados correctamente.");
    setBusy(false);
  }

  function updateRequestItem(
    index: number,
    field: keyof RequestItem,
    value: string,
  ) {
    setRequestItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function publishRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((account?.empresas?.estado_operativo ?? "activa") !== "activa") {
      setMessage("La empresa está pausada o bloqueada y no puede publicar solicitudes.");
      return;
    }
    if (!companyCanBuy(account?.empresas)) {
      setMessage("La empresa no tiene habilitada la actividad de compras.");
      return;
    }
    if (account?.empresas?.estado !== "verificada") {
      setMessage("Tu empresa debe estar verificada antes de publicar solicitudes.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const deadline = new Date(String(form.get("fecha_limite")));
    if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      setMessage("La fecha límite debe ser posterior al momento actual.");
      return;
    }
    if (!requestSelectedCategories.length) {
      setMessage("Seleccioná al menos un rubro para distribuir el pedido.");
      return;
    }
    if (
      requestItems.some(
        (item) =>
          !item.articulo.trim() ||
          Number(item.cantidad) <= 0 ||
          !item.unidad.trim(),
      )
    ) {
      setMessage("Completá correctamente todos los artículos.");
      return;
    }
    if (requestFiles.length > 5) {
      setMessage("Podés adjuntar hasta 5 archivos por solicitud.");
      return;
    }
    if (requestFiles.some((file) => file.size > 10 * 1024 * 1024)) {
      setMessage("Cada archivo debe pesar como máximo 10 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data: createdRequest, error } = await supabase.rpc(
      "publicar_solicitud",
      {
        p_titulo: form.get("titulo"),
        p_descripcion: form.get("descripcion"),
        p_proyecto: form.get("proyecto"),
        p_fecha_limite: deadline.toISOString(),
        p_permite_cotizacion_parcial: form.get("parcial") === "on",
        p_permite_cantidad_menor: form.get("cantidad_menor") === "on",
        p_apertura_al_vencimiento: form.get("apertura") === "vencimiento",
        p_rubros: requestSelectedCategories,
        p_items: requestItems.map((item) => ({
          ...item,
          cantidad: Number(item.cantidad),
        })),
      },
    );
    if (error) setMessage(error.message);
    else {
      const requestId =
        typeof createdRequest === "string"
          ? createdRequest
          : Array.isArray(createdRequest)
            ? createdRequest[0]?.id || createdRequest[0]
            : createdRequest && typeof createdRequest === "object"
              ? (createdRequest as { id?: string }).id
              : null;
      let attachmentError = false;
      if (requestFiles.length && requestId) {
        const { data: userData } = await supabase.auth.getUser();
        for (const file of requestFiles) {
          const safeName = file.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]/g, "-");
          const filePath = `${requestId}/${createUuid()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("adjuntos-solicitudes")
            .upload(filePath, file, {
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });
          if (uploadError || !userData.user) {
            attachmentError = true;
            continue;
          }
          const { error: recordError } = await supabase
            .from("adjuntos_solicitud")
            .insert({
              solicitud_id: requestId,
              nombre_archivo: file.name,
              archivo_path: filePath,
              tipo_mime: file.type || null,
              tamano_bytes: file.size,
              cargado_por: userData.user.id,
            });
          if (recordError) {
            attachmentError = true;
            await supabase.storage
              .from("adjuntos-solicitudes")
              .remove([filePath]);
          }
        }
      } else if (requestFiles.length) attachmentError = true;
      setMessage(
        attachmentError
          ? "La solicitud se publicó, pero uno o más archivos no pudieron cargarse."
          : "Solicitud publicada y distribuida a los proveedores correspondientes.",
      );
      setRequestItems([
        { articulo: "", cantidad: "", unidad: "unidad", especificacion: "" },
      ]);
      setRequestFiles([]);
      setRequestSelectedCategories([]);
      setBuyerView("summary");
      if (account) await loadRows(account);
    }
    setBusy(false);
  }

  async function openRequest(
    requestId: string,
    target: "provider" | "buyer" = "provider",
  ) {
    setBusy(true);
    setMessage("");
    const [{ data: request, error }, { data: items }, { data: attachments }] =
      await Promise.all([
        supabase
          .from("solicitudes")
          .select(
            "id, codigo, titulo, estado, descripcion, proyecto, fecha_limite, permite_cotizacion_parcial, permite_cantidad_menor, apertura_al_vencimiento, empresa_compradora_id",
          )
          .eq("id", requestId)
          .single(),
        supabase
          .from("items_solicitud")
          .select(
            "id, renglon, articulo, cantidad, unidad, especificacion, permite_cantidad_menor",
          )
          .eq("solicitud_id", requestId)
          .order("renglon"),
        supabase
          .from("adjuntos_solicitud")
          .select(
            "id, nombre_archivo, archivo_path, tipo_mime, tamano_bytes, cargado_en",
          )
          .eq("solicitud_id", requestId)
          .order("cargado_en"),
      ]);
    if (error || !request) {
      setMessage(error?.message || "No se pudo abrir la solicitud.");
      setBusy(false);
      return;
    }
    const { data: company } = await supabase
      .from("empresas")
      .select("razon_social, nombre_comercial, email_empresa, telefono")
      .eq("id", request.empresa_compradora_id)
      .single();
    if (target === "buyer") {
      await loadBuyerQuotes(account?.empresas?.id ?? "");
    } else if (account?.empresas?.id) {
      await loadProviderQuotes(account.empresas.id);
    }
    const detail = {
      ...request,
      comprador:
        company?.nombre_comercial ||
        company?.razon_social ||
        "Empresa compradora",
      compradorEmail: company?.email_empresa ?? null,
      compradorTelefono: company?.telefono ?? null,
      items: (items ?? []) as RequestLine[],
    } as RequestDetail;
    setRequestDetail(detail);
    setRequestAttachments((attachments ?? []) as RequestAttachment[]);
    setQuoteLines(
      detail.items.map((item) => ({
        item_solicitud_id: item.id,
        included: true,
        cantidad_ofertada: String(item.cantidad),
        precio_unitario: "",
        alicuota_iva: "21",
        marca: "",
        especificacion_ofertada: "",
        plazo_entrega_item: "",
        observaciones: "",
      })),
    );
    setQuoteOpen(false);
    if (target === "buyer") setBuyerView("requestDetail");
    else setProviderView("detail");
    setRequestAction(null);
    setRequestActionReason("");
    setBusy(false);
  }

  async function downloadRequestAttachment(attachment: RequestAttachment) {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.storage
      .from("adjuntos-solicitudes")
      .createSignedUrl(attachment.archivo_path, 60);
    if (error || !data?.signedUrl) {
      setMessage(error?.message || "No se pudo abrir el archivo.");
      setBusy(false);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    setBusy(false);
  }

  async function manageRequest() {
    if (!requestDetail || !requestAction || !account) return;
    if (requestAction === "cancelar" && !requestActionReason.trim()) {
      setMessage("Indicá el motivo de la cancelación.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } =
      requestAction === "reabrir"
        ? await supabase.rpc("reabrir_solicitud", {
            p_solicitud_id: requestDetail.id,
          })
        : await supabase.rpc("gestionar_solicitud", {
            p_solicitud_id: requestDetail.id,
            p_accion: requestAction,
            p_motivo: requestActionReason.trim() || null,
          });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    setMessage(
      requestAction === "cancelar"
        ? "Solicitud cancelada correctamente."
        : requestAction === "reabrir"
          ? "Solicitud reabierta. Ya podés adjudicarla."
          : "Solicitud cerrada correctamente.",
    );
    setRequestAction(null);
    setRequestActionReason("");
    await loadRows(account);
    setBuyerView("requests");
    setBusy(false);
  }

  function updateQuoteLine(
    index: number,
    field: keyof QuoteLine,
    value: string | boolean,
  ) {
    setQuoteLines((lines) =>
      lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestDetail) return;
    if (
      providerQuotes.some(
        (quote) => quote.requestId === requestDetail.id,
      )
    ) {
      setQuoteOpen(false);
      setMessage(
        "Esta empresa ya presentó una cotización para la solicitud. Podés verla o modificarla desde Mis cotizaciones.",
      );
      return;
    }
    if ((account?.empresas?.estado_operativo ?? "activa") !== "activa") {
      setQuoteOpen(false);
      setMessage("La empresa está pausada o bloqueada y no puede presentar cotizaciones.");
      return;
    }
    if (!companyCanSell(account?.empresas)) {
      setMessage("La empresa no tiene habilitada la actividad de ventas.");
      return;
    }
    if (requestDetail.empresa_compradora_id === account?.empresas?.id) {
      setQuoteOpen(false);
      setMessage("Una empresa no puede cotizar su propia solicitud.");
      return;
    }
    if (account?.empresas?.estado !== "verificada") {
      setMessage("Tu empresa debe estar verificada antes de presentar cotizaciones.");
      return;
    }
    if (
      requestDetail.estado !== "publicada" ||
      new Date(requestDetail.fecha_limite).getTime() <= Date.now()
    ) {
      setQuoteOpen(false);
      setMessage("Esta solicitud ya no está disponible para recibir cotizaciones.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const included = quoteLines.filter((line) => line.included);
    if (!included.length) {
      setMessage("Seleccioná al menos un artículo para cotizar.");
      return;
    }
    if (
      !requestDetail.permite_cotizacion_parcial &&
      included.length !== requestDetail.items.length
    ) {
      setMessage("Esta solicitud requiere cotizar todos los artículos.");
      return;
    }
    if (
      included.some(
        (line) =>
          Number(line.cantidad_ofertada) <= 0 ||
          Number(line.precio_unitario) < 0 ||
          line.precio_unitario === "",
      )
    ) {
      setMessage(
        "Completá cantidad y precio de todos los artículos seleccionados.",
      );
      return;
    }
    const offersDisallowedLowerQuantity = included.some((line) => {
      const item = requestDetail.items.find(
        (requestItem) => requestItem.id === line.item_solicitud_id,
      );
      if (!item) return true;
      const lowerQuantityAllowed =
        requestDetail.permite_cantidad_menor ||
        item.permite_cantidad_menor === true;
      return (
        !lowerQuantityAllowed &&
        Number(line.cantidad_ofertada) < Number(item.cantidad)
      );
    });
    if (offersDisallowedLowerQuantity) {
      setMessage(
        "Uno o más artículos no permiten ofrecer una cantidad menor a la solicitada.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.rpc("presentar_cotizacion", {
      p_solicitud_id: requestDetail.id,
      p_moneda: form.get("moneda"),
      p_impuestos_incluidos: form.get("impuestos_incluidos") === "on",
      p_condiciones_pago: form.get("condiciones_pago"),
      p_plazo_entrega: form.get("plazo_entrega"),
      p_observaciones: form.get("observaciones"),
      p_items: included.map(({ included: _included, ...line }) => ({
        ...line,
        cantidad_ofertada: Number(line.cantidad_ofertada),
        precio_unitario: Number(line.precio_unitario),
        alicuota_iva: Number(line.alicuota_iva),
      })),
    });
    if (error) setMessage(error.message);
    else {
      setMessage("Cotización presentada correctamente.");
      setQuoteOpen(false);
      setProviderView("summary");
      if (account) {
        await loadRows(account);
        if (account.empresas) await loadProviderQuotes(account.empresas.id);
      }
    }
    setBusy(false);
  }

  async function invokeCompanyAdministration(
    action: string,
    payload: Record<string, unknown> = {},
  ) {
    const { data, error } = await supabase.functions.invoke(
      "administrador-empresa",
      { body: { action, ...payload } },
    );
    if (error) throw new Error(error.message || "No se pudo completar la operación.");
    if (data?.error) throw new Error(String(data.error));
    return data as Record<string, unknown>;
  }

  async function loadCompanyAdministration(companyId: string) {
    const data = await invokeCompanyAdministration("detalle_empresa", {
      empresa_id: companyId,
    });
    setCompanyUsers((data.usuarios ?? []) as AdminCompanyUser[]);
    setCompanyActivity(
      (data.actividad ?? {
        solicitudes: 0,
        cotizaciones: 0,
        adjudicaciones: 0,
      }) as AdminCompanyActivity,
    );
    setCompanyCanDelete(Boolean(data.puede_eliminar));
  }

  async function runAdminCompanyAction(action: string, email?: string) {
    if (!selectedCompany) return;
    if (action === "bloquear" && !adminCompanyReason.trim()) {
      setMessage("Indicá el motivo del bloqueo.");
      return;
    }
    if (
      action === "eliminar_incompleta" &&
      !window.confirm(
        "Esta acción elimina definitivamente la empresa y sus usuarios. Solo continuará si no existe actividad comercial. ¿Confirmás?",
      )
    )
      return;

    setBusy(true);
    setMessage("");
    try {
      const result = await invokeCompanyAdministration(action, {
        empresa_id: selectedCompany.id,
        email,
        motivo: adminCompanyReason.trim() || null,
      });
      if (action === "eliminar_incompleta") {
        const pendingUsers = (result.usuarios_no_eliminados ?? []) as string[];
        setSelectedCompany(null);
        setMessage(
          pendingUsers.length
            ? `La empresa se eliminó, pero estos accesos requieren revisión manual: ${pendingUsers.join(", ")}.`
            : "La empresa y sus accesos fueron eliminados. El correo ya puede registrarse nuevamente.",
        );
      } else if (action === "reenviar_acceso") {
        setMessage("Correo de acceso reenviado.");
      } else if (action === "restablecer_password") {
        setMessage("Correo para crear una contraseña nueva enviado.");
      } else {
        const nextStatus = result.estado_operativo as OperationalStatus | undefined;
        if (nextStatus) {
          setSelectedCompany((current) =>
            current ? { ...current, estado_operativo: nextStatus } : current,
          );
        }
        setMessage(
          action === "bloquear"
            ? "Empresa y correos bloqueados. Sus usuarios ya no pueden ingresar."
            : action === "desbloquear"
              ? "Empresa desbloqueada y accesos rehabilitados."
              : action === "pausar"
                ? "Empresa pausada. Puede consultar información, pero no operar."
                : action === "archivar"
                  ? "Empresa archivada sin borrar su historial."
                  : "Empresa reactivada.",
        );
      }
      setAdminCompanyReason("");
      setAdminCompanyAction("");
      if (account) await loadRows(account);
      if (selectedCompany && action !== "eliminar_incompleta") {
        await loadCompanyAdministration(selectedCompany.id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la operación.");
    }
    setBusy(false);
  }

  async function openAdminCompanyCreate() {
    setMessage("");
    setAdminCreateCanBuy(true);
    setAdminCreateCanSell(false);
    setAdminCreateCategories([]);
    if (!categories.length) {
      const { data, error } = await supabase
        .from("rubros")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");
      if (error) {
        setMessage(error.message);
        return;
      }
      setCategories((data ?? []) as Category[]);
    }
    setAdminCompanyCreateOpen(true);
  }

  async function createCompanyByAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminCreateCanBuy && !adminCreateCanSell) {
      setMessage("Elegí al menos una actividad para la empresa.");
      return;
    }
    if (adminCreateCanSell && !adminCreateCategories.length) {
      setMessage("Asigná al menos un rubro al proveedor.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await invokeCompanyAdministration("crear_empresa", {
        razon_social: form.get("razon_social"),
        nombre_comercial: form.get("nombre_comercial"),
        cuit: form.get("cuit"),
        localidad: form.get("localidad"),
        domicilio: form.get("domicilio"),
        telefono: form.get("telefono"),
        whatsapp: form.get("whatsapp"),
        sitio_web: form.get("sitio_web"),
        email: form.get("email"),
        nombre: form.get("nombre"),
        apellido: form.get("apellido"),
        cargo: form.get("cargo"),
        puede_comprar: adminCreateCanBuy,
        puede_vender: adminCreateCanSell,
        rubros: adminCreateCanSell ? adminCreateCategories : [],
      });
      setAdminCompanyCreateOpen(false);
      setMessage("Empresa creada. El responsable recibió un correo para activar su acceso.");
      if (account) await loadRows(account);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la empresa.");
    }
    setBusy(false);
  }

  async function reviewCompany(
    status: "verificada" | "observada" | "rechazada" | "suspendida",
  ) {
    if (!selectedCompany || !account) return;
    if (
      (status === "observada" || status === "rechazada") &&
      !reviewNote.trim()
    ) {
      setMessage("Escribí el motivo antes de continuar.");
      return;
    }
    if (
      status === "verificada" &&
      reviewCanSell &&
      !reviewSelectedCategories.length
    ) {
      setMessage("Asigná al menos un rubro antes de aprobar al proveedor.");
      return;
    }
    setBusy(true);
    if (!reviewCanBuy && !reviewCanSell) {
      setMessage("La empresa debe poder comprar, vender o realizar ambas actividades.");
      return;
    }
    if (reviewCanSell) {
      const categoryError = await persistCompanyCategories(
        selectedCompany.id,
        reviewSelectedCategories,
      );
      if (categoryError) {
        setMessage(`No se pudieron guardar los rubros: ${categoryError}`);
        setBusy(false);
        return;
      }
    }
    const changes = {
      estado: status,
      puede_comprar: reviewCanBuy,
      puede_vender: reviewCanSell,
      motivo_observacion:
        status === "verificada" ? null : reviewNote.trim() || null,
      verificada_en: status === "verificada" ? new Date().toISOString() : null,
    };
    const { error } = await supabase
      .from("empresas")
      .update(changes)
      .eq("id", selectedCompany.id);
    if (!error) {
      await supabase.from("eventos_auditoria").insert({
        empresa_id: selectedCompany.id,
        usuario_id: (await supabase.auth.getUser()).data.user?.id,
        entidad: "empresa",
        entidad_id: selectedCompany.id,
        accion: `verificacion_${status}`,
        detalle: {
          motivo: changes.motivo_observacion,
          puede_comprar: reviewCanBuy,
          puede_vender: reviewCanSell,
        },
      });
      setMessage(`Empresa marcada como ${status}.`);
      setSelectedCompany(null);
      setReviewNote("");
      await loadRows(account);
    } else setMessage(error.message);
    setBusy(false);
  }

  async function openCompanyReview(company: CompanyReview) {
    setSelectedCompany(company);
    setCompanyUsers([]);
    setCompanyActivity({ solicitudes: 0, cotizaciones: 0, adjudicaciones: 0 });
    setCompanyCanDelete(false);
    setAdminCompanyReason("");
    setAdminCompanyAction("");
    setReviewCanBuy(companyCanBuy(company));
    setReviewCanSell(companyCanSell(company));
    setReviewNote(company.motivo_observacion ?? "");
    setMessage("");
    const [{ data }, { data: available }, { data: assigned }] =
      await Promise.all([
        supabase
          .from("documentos_empresa")
          .select("id, tipo_documento, archivo_path, estado, cargado_en")
          .eq("empresa_id", company.id)
          .order("cargado_en", { ascending: false }),
        supabase
          .from("rubros")
          .select("id, nombre")
          .eq("activo", true)
          .order("nombre"),
        supabase
          .from("empresa_rubros")
          .select("rubro_id")
          .eq("empresa_id", company.id),
      ]);
    setCompanyDocuments((data ?? []) as CompanyDocument[]);
    setCategories((available ?? []) as Category[]);
    setReviewSelectedCategories(
      (assigned ?? []).map((item) => item.rubro_id),
    );
    try {
      await loadCompanyAdministration(company.id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la administración de accesos.",
      );
    }
  }

  async function saveReviewedCompanyCategories() {
    if (!selectedCompany || !reviewCanSell) return;
    if (!reviewSelectedCategories.length) {
      setMessage("Seleccioná al menos un rubro.");
      return;
    }
    setBusy(true);
    const error = await persistCompanyCategories(
      selectedCompany.id,
      reviewSelectedCategories,
    );
    setMessage(error ? `No se pudieron guardar los rubros: ${error}` : "Rubros guardados correctamente.");
    setBusy(false);
  }

  async function openCompanyDocument(document: CompanyDocument) {
    const { data, error } = await supabase.storage
      .from("documentos-empresas")
      .createSignedUrl(document.archivo_path, 300);
    if (error) setMessage(error.message);
    else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account?.empresas || !verificationFile) {
      setMessage("Seleccioná la constancia de CUIT.");
      return;
    }
    setBusy(true);
    setMessage("");
    const user = (await supabase.auth.getUser()).data.user;
    const extension =
      verificationFile.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${account.empresas.id}/constancia-cuit-${Date.now()}.${extension}`;
    const upload = await supabase.storage
      .from("documentos-empresas")
      .upload(path, verificationFile, { upsert: false });
    if (upload.error) {
      setMessage(upload.error.message);
      setBusy(false);
      return;
    }
    const documentInsert = await supabase.from("documentos_empresa").insert({
      empresa_id: account.empresas.id,
      tipo_documento: "constancia_cuit",
      archivo_path: path,
      estado: "pendiente",
      cargado_por: user?.id,
    });
    if (documentInsert.error) {
      setMessage(documentInsert.error.message);
      setBusy(false);
      return;
    }
    const update = await supabase
      .from("empresas")
      .update({ estado: "pendiente", motivo_observacion: null })
      .eq("id", account.empresas.id);
    if (update.error) {
      setMessage(update.error.message);
      setBusy(false);
      return;
    }
    await supabase.from("eventos_auditoria").insert({
      empresa_id: account.empresas.id,
      usuario_id: user?.id,
      entidad: "empresa",
      entidad_id: account.empresas.id,
      accion: "verificacion_enviada",
      detalle: { documento: "constancia_cuit" },
    });
    setVerificationOpen(false);
    setVerificationFile(null);
    setMessage(
      "Documentación enviada. La empresa quedó pendiente de revisión.",
    );
    if (user) await loadAccount(user.id);
    setBusy(false);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: String(data.get("password")),
    });
    if (error) setMessage(friendlyAuthError(error));
    else if (authData.user) {
      if (rememberLoginEmail)
        localStorage.setItem("miconect-remembered-email", email);
      else localStorage.removeItem("miconect-remembered-email");
      await loadAccount(authData.user.id);
    }
    setBusy(false);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = orphanUser?.email || String(data.get("email"));
    const password = String(data.get("password"));
    const confirmation = String(data.get("confirmation"));
    if (!orphanUser && password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      setBusy(false);
      return;
    }
    if (!registrationCanBuy && !registrationCanSell) {
      setMessage("Elegí al menos una actividad para la empresa.");
      setBusy(false);
      return;
    }
    if (registrationCanSell && !registrationSelectedCategories.length) {
      setMessage("Seleccioná al menos un rubro para la empresa proveedora.");
      setBusy(false);
      return;
    }
    const cuit = String(data.get("cuit")).replace(/\D/g, "");
    const cuitAvailable = await validateRegistrationCuit(cuit);
    if (!cuitAvailable) {
      setBusy(false);
      return;
    }
    const { data: emailAvailable, error: emailAvailabilityError } =
      await supabase.rpc("email_disponible_registro", { p_email: email });
    if (emailAvailabilityError || emailAvailable !== true) {
      setMessage(
        emailAvailabilityError
          ? "No pudimos validar el correo en este momento. Intentá nuevamente."
          : "Este correo no está habilitado para registrarse. Contactá a soporte si necesitás revisarlo.",
      );
      setBusy(false);
      return;
    }
    const pending = {
      p_tipo: registrationCanBuy ? "compradora" : "proveedora",
      p_puede_comprar: registrationCanBuy,
      p_puede_vender: registrationCanSell,
      p_razon_social: data.get("razon_social"),
      p_nombre_comercial: data.get("nombre_comercial"),
      p_cuit: cuit,
      p_localidad: data.get("localidad"),
      p_domicilio: data.get("domicilio"),
      p_telefono: data.get("telefono"),
      p_whatsapp: data.get("whatsapp"),
      p_email_empresa: email,
      p_sitio_web: data.get("sitio_web"),
      p_nombre: data.get("nombre"),
      p_apellido: data.get("apellido"),
      p_cargo: data.get("cargo"),
      p_rubros: registrationCanSell ? registrationSelectedCategories : [],
      p_rubros_nombres:
        registrationCanSell
          ? registrationCategories
              .filter((category) =>
                registrationSelectedCategories.includes(category.id),
              )
              .map((category) => category.nombre)
          : [],
    };
    localStorage.setItem("miconect-pending-company", JSON.stringify(pending));
    if (orphanUser) {
      try {
        await finishPendingRegistration(pending);
        setOrphanUser(null);
        setMessage("Empresa vinculada. Ya podés completar la verificación.");
        await loadAccount(orphanUser.id);
      } catch (error) {
        console.error("No se pudo vincular la empresa", error);
        setMessage(registrationErrorMessage(error, "No se pudo vincular la empresa."));
      }
      setBusy(false);
      return;
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        data: { miconect_pending_company: pending },
      },
    });

    if (authError) {
      localStorage.removeItem("miconect-pending-company");
      setMessage(friendlyAuthError(authError));
      setBusy(false);
      return;
    }

    if (!authData.session) {
      if (authData.user?.identities?.length === 0) {
        localStorage.removeItem("miconect-pending-company");
        setLoginEmail(email);
        setMessage(
          "Este correo ya tiene una cuenta. Ingresá con tu contraseña o usá la recuperación de acceso.",
        );
        setView("login");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setBusy(false);
        return;
      }
      setPendingConfirmationEmail(email);
      setConfirmationMessage(
        `Cuenta creada. Enviamos la confirmación a ${email}. Revisá también Spam y Promociones.`,
      );
      setMessage("");
      setView("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setBusy(false);
      return;
    }

    try {
      await finishPendingRegistration();
      setMessage("Empresa registrada. Ya podés completar la verificación.");
      await loadAccount(authData.user!.id);
    } catch (error) {
      console.error("No se pudo crear la empresa", error);
      setMessage(registrationErrorMessage(error, "No se pudo crear la empresa."));
    }
    setBusy(false);
  }

  async function resendRegistrationConfirmation() {
    if (!pendingConfirmationEmail) return;
    setBusy(true);
    setConfirmationMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingConfirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });
      setConfirmationMessage(
        error
          ? friendlyAuthError(error)
          : `Reenviamos la confirmación a ${pendingConfirmationEmail}. Puede demorar unos minutos.`,
      );
    } catch (error) {
      console.error("No se pudo reenviar la confirmación", error);
      setConfirmationMessage(
        "No pudimos reenviar el correo en este momento. Esperá unos minutos y volvé a intentarlo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function validateRegistrationCuit(rawCuit: string) {
    const cuit = rawCuit.replace(/\D/g, "");
    setRegistrationCheckedCuit(cuit);
    if (cuit.length !== 11) {
      setRegistrationCuitStatus("invalid");
      return false;
    }
    setRegistrationCuitStatus("checking");
    const { data, error } = await supabase.rpc("cuit_disponible_registro", {
      p_cuit: cuit,
    });
    if (error) {
      console.error("No se pudo validar el CUIT", error);
      setRegistrationCuitStatus("service-error");
      setMessage(
        "No pudimos validar el CUIT en este momento. Intentá nuevamente.",
      );
      return false;
    }
    if (data !== true) {
      setRegistrationCuitStatus("unavailable");
      setMessage(
        "Ese CUIT ya pertenece a una empresa registrada. Ingresá con una cuenta existente o contactá a soporte para solicitar acceso.",
      );
      return false;
    }
    setRegistrationCuitStatus("available");
    return true;
  }

  if (loadingAccount)
    return (
      <main className="loading">
        <img className="brand-symbol loading-symbol" src="/miconect-symbol.png" alt="" />
        <p>Preparando Miconect…</p>
      </main>
    );

  if (passwordRecovery)
    return (
      <main className="password-recovery-shell">
        <section className="form-shell narrow">
          <div className="form-heading">
            <span>Recuperación segura</span>
            <h1>Creá una contraseña nueva</h1>
            <p>Ingresá una contraseña de al menos ocho caracteres.</p>
          </div>
          <form onSubmit={finishPasswordRecovery}>
            <label>
              Nueva contraseña
              <PasswordInput
                name="password"
                autoComplete="new-password"
              />
            </label>
            <label>
              Repetir contraseña
              <PasswordInput
                name="confirmation"
                autoComplete="new-password"
              />
            </label>
            <button className="primary full" disabled={busy}>
              {busy ? "Guardando…" : "Actualizar contraseña"}
            </button>
          </form>
          {message && <p className="notice">{message}</p>}
        </section>
      </main>
    );

  if (account) {
    const admin = account.rol === "administrador_plataforma";
    const canBuy = companyCanBuy(account.empresas);
    const canSell = companyCanSell(account.empresas);
    const buyer = !admin && canBuy && (!canSell || companyMode === "buyer");
    const verified = admin || account.empresas?.estado === "verificada";
    const operational = admin || (account.empresas?.estado_operativo ?? "activa") === "activa";
    const filteredCompanies = reviews.filter((company) => {
      const query = companySearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        company.razon_social.toLowerCase().includes(query) ||
        (company.nombre_comercial ?? "").toLowerCase().includes(query) ||
        company.cuit.includes(query) ||
        company.email_empresa.toLowerCase().includes(query);
      const matchesStatus =
        companyOperationalFilter === "todas" ||
        (company.estado_operativo ?? "activa") === companyOperationalFilter;
      return matchesSearch && matchesStatus;
    });
    const visibleAwards = awards.filter((award) =>
      buyer
        ? award.buyerCompanyId === account.empresas?.id
        : award.providerCompanyId === account.empresas?.id,
    );
    const unreadNotifications = notifications.filter((item) => !item.leida_en);
    const buyerUnreadCount = unreadNotifications.filter((item) =>
      ["cotizacion_recibida", "cotizacion_actualizada"].includes(item.tipo),
    ).length;
    const providerUnreadCount = unreadNotifications.filter((item) =>
      ["nueva_solicitud", "adjudicacion_recibida"].includes(item.tipo),
    ).length;
    const currentProviderQuote = requestDetail
      ? providerQuotes.find((quote) => quote.requestId === requestDetail.id)
      : undefined;
    const currentRequestBuyerQuotes = requestDetail
      ? buyerQuotes.filter(
          (quote) => quote.solicitud_id === requestDetail.id,
        )
      : [];
    const buyerQuoteGroups: Array<{
      requestId: string;
      requestCode: number;
      requestTitle: string;
      quotes: BuyerQuote[];
    }> = [];
    for (const quote of buyerQuotes) {
      const existingGroup = buyerQuoteGroups.find(
        (group) => group.requestId === quote.solicitud_id,
      );
      if (existingGroup) existingGroup.quotes.push(quote);
      else {
        buyerQuoteGroups.push({
          requestId: quote.solicitud_id,
          requestCode: quote.requestCode,
          requestTitle: quote.requestTitle,
          quotes: [quote],
        });
      }
    }
    const teamView =
      !admin && (buyer ? buyerView === "team" : providerView === "team");
    const profileView =
      !admin && (buyer ? buyerView === "profile" : providerView === "profile");
    const title = profileView
      ? "Mi perfil"
      : teamView
        ? "Equipo de la empresa"
        : admin
          ? "Administración de la red"
          : buyer
            ? "Panel de compras"
            : "Oportunidades para cotizar";
    const supervisionFiltered = supervisionRequests
      .filter((request) => {
        const query = supervisionSearch.trim().toLowerCase();
        const published = new Date(request.creada_en);
        return (
          (!query || `${request.codigo} ${request.titulo} ${request.empresa_compradora}`.toLowerCase().includes(query)) &&
          (supervisionStatus === "todos" || request.estado === supervisionStatus) &&
          (supervisionCompany === "todas" || request.empresa_compradora_id === supervisionCompany) &&
          (supervisionQuotes === "todas" || (supervisionQuotes === "con" ? request.cantidad_cotizaciones > 0 : request.cantidad_cotizaciones === 0)) &&
          (!supervisionFrom || published >= new Date(`${supervisionFrom}T00:00:00`)) &&
          (!supervisionTo || published <= new Date(`${supervisionTo}T23:59:59`))
        );
      })
      .sort((a, b) => {
        if (supervisionSort === "antiguas") return +new Date(a.creada_en) - +new Date(b.creada_en);
        if (supervisionSort === "ofertas") return b.cantidad_cotizaciones - a.cantidad_cotizaciones;
        if (supervisionSort === "vencimiento") return +new Date(a.fecha_limite) - +new Date(b.fecha_limite);
        return +new Date(b.creada_en) - +new Date(a.creada_en);
      });
    const supervisionPageSize = 10;
    const supervisionPages = Math.max(1, Math.ceil(supervisionFiltered.length / supervisionPageSize));
    const supervisionVisible = supervisionFiltered.slice((Math.min(supervisionPage, supervisionPages) - 1) * supervisionPageSize, Math.min(supervisionPage, supervisionPages) * supervisionPageSize);
    return (
      <main className="dashboard">
        <aside
          className={mobileMenuOpen ? "mobile-open" : ""}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest(".menu") && window.innerWidth <= 600) setMobileMenuOpen(false);
          }}
        >
          <div className="brand dashboard-brand">
            <img className="brand-symbol" src="/miconect-symbol.png" alt="" />
            <img className="brand-wordmark brand-wordmark-light" src="/miconect-wordmark-white.png" alt="Miconect" />
          </div>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMobileMenuOpen((open) => !open);
            }}
          >
            {mobileMenuOpen ? "Cerrar" : "Menú"}
          </button>
          <div className="menu-label">Principal</div>
          {!admin && canBuy && canSell && (
            <div className="company-mode-switch" aria-label="Espacio de trabajo">
              <span>Operar como</span>
              <div>
                <button
                  type="button"
                  className={buyer ? "active" : ""}
                  onClick={() => {
                    setCompanyMode("buyer");
                    localStorage.setItem("miconect-company-mode", "buyer");
                    setMessage("");
                    void loadRows(account, "buyer");
                    void loadBuyerQuotes();
                    void loadBuyerAdvertisement();
                  }}
                >
                  Compras
                  {buyerUnreadCount > 0 && (
                    <span
                      className="nav-alert-dot"
                      role="status"
                      aria-label={`${buyerUnreadCount} avisos pendientes de compras`}
                    />
                  )}
                </button>
                <button
                  type="button"
                  className={!buyer ? "active" : ""}
                  onClick={() => {
                    setCompanyMode("provider");
                    localStorage.setItem("miconect-company-mode", "provider");
                    setMessage("");
                    void loadRows(account, "provider");
                    if (account.empresas) {
                      void loadProviderQuotes(account.empresas.id);
                      void loadProviderCategories(account.empresas.id);
                    }
                    void loadProviderAdvertisement();
                  }}
                >
                  Ventas
                  {providerUnreadCount > 0 && (
                    <span
                      className="nav-alert-dot"
                      role="status"
                      aria-label={`${providerUnreadCount} avisos pendientes de ventas`}
                    />
                  )}
                </button>
              </div>
            </div>
          )}
          <button
            className={`menu ${(admin ? adminView === "summary" : buyer ? buyerView === "summary" : providerView === "summary") ? "active" : ""}`}
            onClick={() => {
              setAdminView("summary");
              setProviderView("summary");
              setBuyerView("summary");
            }}
          >
            Resumen
          </button>
          {admin && (
            <>
              <button
                className={`menu ${adminView === "supervision" ? "active" : ""}`}
                onClick={() => {
                  setAdminView("supervision");
                  void loadAdminSupervision();
                }}
              >
                Supervisión
              </button>
              <button
                className={`menu ${adminView === "reviews" ? "active" : ""}`}
                onClick={() => setAdminView("reviews")}
              >
                Verificaciones
              </button>
              <button
                className={`menu ${adminView === "companies" ? "active" : ""}`}
                onClick={() => setAdminView("companies")}
              >
                Empresas
              </button>
              <button
                className={`menu ${adminView === "categories" ? "active" : ""}`}
                onClick={() => setAdminView("categories")}
              >
                Rubros
              </button>
              <button
                className={`menu ${adminView === "advertising" ? "active" : ""}`}
                onClick={() => {
                  setAdminView("advertising");
                  loadAdvertising();
                }}
              >
                Publicidad
              </button>
            </>
          )}
          {buyer && (
            <>
              <button
                className={`menu ${buyerView === "requests" ? "active" : ""}`}
                onClick={() => {
                  setBuyerView("requests");
                  void loadRows(account);
                }}
              >
                Solicitudes
              </button>
              <button
                className={`menu ${buyerView === "new" ? "active" : ""}`}
                onClick={() => setBuyerView("new")}
                disabled={!verified || !operational}
                title={
                  !verified
                    ? "Verificá la empresa para publicar"
                    : !operational
                      ? "La empresa está pausada o bloqueada"
                      : undefined
                }
              >
                Nueva solicitud
              </button>
              <button
                className={`menu ${buyerView === "quotes" ? "active" : ""}`}
                onClick={() => {
                  setBuyerQuoteOriginRequestId(null);
                  setBuyerView("quotes");
                  void loadBuyerQuotes();
                }}
              >
                Cotizaciones
                {buyerUnreadCount > 0 && (
                  <span
                    className="nav-alert-dot"
                    role="status"
                    aria-label={`${buyerUnreadCount} cotizaciones nuevas`}
                  />
                )}
              </button>
              <button
                className={`menu ${buyerView === "awards" ? "active" : ""}`}
                onClick={() => {
                  setBuyerView("awards");
                  void loadAwards(account);
                }}
              >
                Adjudicaciones
              </button>
            </>
          )}
          {!admin && !buyer && (
            <>
              <button
                className={`menu ${providerView === "requests" ? "active" : ""}`}
                onClick={() => {
                  setProviderView("requests");
                  void loadRows(account);
                }}
              >
                Pedidos disponibles
                {providerUnreadCount > 0 && (
                  <span
                    className="nav-alert-dot"
                    role="status"
                    aria-label={`${providerUnreadCount} avisos pendientes de ventas`}
                  />
                )}
              </button>
              <button
                className={`menu ${providerView === "quotes" || providerView === "quoteDetail" ? "active" : ""}`}
                onClick={() => {
                  setProviderView("quotes");
                  if (account.empresas) {
                    void loadProviderQuotes(account.empresas.id);
                  }
                }}
              >
                Mis cotizaciones
              </button>
              <button
                className={`menu ${providerView === "awards" ? "active" : ""}`}
                onClick={() => {
                  setProviderView("awards");
                  void loadAwards(account);
                }}
              >
                Adjudicaciones
              </button>
              <button
                className={`menu ${providerView === "categories" ? "active" : ""}`}
                onClick={() => setProviderView("categories")}
              >
                Mis rubros
              </button>
            </>
          )}
          {!admin && (
            <button
              className={`menu ${teamView ? "active" : ""}`}
              onClick={() => {
                if (buyer) setBuyerView("team");
                else setProviderView("team");
                loadTeam();
              }}
            >
              Mi equipo
            </button>
          )}
          {!admin && (
            <button
              className={`menu ${profileView ? "active" : ""}`}
              onClick={() => {
                if (buyer) setBuyerView("profile");
                else setProviderView("profile");
                loadProfile();
              }}
            >
              Mi perfil
            </button>
          )}
          <button
            className="menu logout"
            onClick={() => supabase.auth.signOut()}
          >
            Cerrar sesión
          </button>
        </aside>
        <div className="dash-content">
          <header className="dash-header">
            <div>
              <span>
                {admin
                  ? "Plataforma"
                  : account.empresas?.nombre_comercial ||
                    account.empresas?.razon_social}
              </span>
              <h1>{title}</h1>
            </div>
            <div className="header-actions">
              {!admin && account.empresas && (
                <div className="notification-center">
                  <button
                    type="button"
                    className="notification-trigger"
                    aria-label="Abrir notificaciones"
                    aria-expanded={notificationOpen}
                    onClick={async () => {
                      await loadNotifications(account.empresas!.id);
                      setNotificationOpen((open) => !open);
                    }}
                  >
                    <span aria-hidden="true">Avisos</span>
                    {notifications.some((item) => !item.leida_en) && (
                      <b>
                        {notifications.filter((item) => !item.leida_en).length}
                      </b>
                    )}
                  </button>
                  {notificationOpen && (
                    <div className="notification-panel">
                      <div className="notification-heading">
                        <div>
                          <b>Notificaciones</b>
                          <span>
                            {
                              notifications.filter((item) => !item.leida_en)
                                .length
                            }{" "}
                            sin leer
                          </span>
                        </div>
                        {notifications.some((item) => !item.leida_en) && (
                          <button onClick={markAllNotificationsRead}>
                            Marcar todas como leídas
                          </button>
                        )}
                      </div>
                      <div className="notification-list">
                        {notifications.length ? (
                          notifications.map((notification) => (
                            <button
                              type="button"
                              key={notification.id}
                              className={notification.leida_en ? "" : "unread"}
                              onClick={() => markNotificationRead(notification)}
                            >
                              <i aria-hidden="true" />
                              <span>
                                <b>{notification.titulo}</b>
                                <small>{notification.mensaje}</small>
                                <time>
                                  {new Date(
                                    notification.creada_en,
                                  ).toLocaleString("es-AR")}
                                </time>
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="notification-empty">
                            <b>No hay notificaciones</b>
                            <span>Los nuevos avisos aparecerán acá.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="avatar">
                {account.nombre[0]}
                {account.apellido[0]}
              </div>
            </div>
          </header>
          {!verified && (
            <div className="verification-banner">
              <div>
                <b>
                  {account.empresas?.estado === "pendiente"
                    ? "Tu documentación está en revisión"
                    : "Tu empresa todavía no está verificada"}
                </b>
                <p>
                  {account.empresas?.estado === "pendiente"
                    ? "El administrador revisará la constancia enviada antes de habilitar las operaciones."
                    : "Podés explorar Miconect, pero para publicar o cotizar necesitás completar la documentación."}
                </p>
              </div>
              {account.empresas?.estado !== "pendiente" && (
                <button onClick={() => setVerificationOpen(true)}>
                  Completar verificación
                </button>
              )}
            </div>
          )}
          {!admin && !operational && (
            <div className={`operational-banner ${account.empresas?.estado_operativo}`}>
              <div>
                <b>
                  Empresa {operationalStatusLabel(account.empresas?.estado_operativo).toLowerCase()}
                </b>
                <p>
                  {account.empresas?.estado_operativo === "pausada"
                    ? "Podés consultar el historial, pero publicar solicitudes y presentar cotizaciones está temporalmente deshabilitado."
                    : account.empresas?.estado_operativo === "archivada"
                      ? "La cuenta conserva su historial en modo consulta. Contactá a soporte para reactivarla."
                      : "Los accesos y las operaciones están bloqueados. Contactá a soporte si necesitás revisar esta medida."}
                </p>
              </div>
            </div>
          )}
          {((admin && adminView === "summary") ||
            (buyer && buyerView === "summary") ||
            (!admin && !buyer && providerView === "summary")) && (
            <>
              <section className="stats">
                <article>
                  <span>
                    {admin
                      ? "Empresas registradas"
                      : buyer
                        ? "Solicitudes activas"
                        : "Pedidos disponibles"}
                  </span>
                  <strong>
                    {buyer
                      ? rows.filter((row) => row.state === "publicada").length
                      : rows.length}
                  </strong>
                  <small>
                    {buyer ? "Solicitudes todavía abiertas" : "Vista inicial"}
                  </small>
                </article>
                <article>
                  <span>
                    {admin
                      ? "Pendientes de revisión"
                      : buyer
                        ? "Cotizaciones recibidas"
                        : "Cotizaciones enviadas"}
                  </span>
                  <strong>
                    {admin
                      ? rows.filter((r) =>
                          [
                            "registro_incompleto",
                            "pendiente",
                            "observada",
                          ].includes(r.state),
                        ).length
                      : buyer
                        ? buyerQuotes.length
                        : providerQuotes.length}
                  </strong>
                  <small>
                    {admin
                      ? "Requieren control administrativo"
                      : buyer
                        ? buyerQuotes.length
                          ? "Ofertas disponibles para revisar"
                          : "Sin cotizaciones recibidas"
                        : providerQuotes.length
                          ? "Ofertas enviadas"
                          : "Todavía no enviaste cotizaciones"}
                  </small>
                </article>
                <article>
                  <span>{admin ? "Red verificada" : "Adjudicaciones"}</span>
                  <strong>
                    {admin
                      ? rows.filter((r) => r.state === "verificada").length
                      : new Set(awards.map((award) => award.requestId)).size}
                  </strong>
                  <small>
                    {admin
                      ? "Historial trazable"
                      : "Solicitudes con adjudicación"}
                  </small>
                </article>
              </section>
              {buyer && buyerAd && (
                <article className="sponsored-banner">
                  <img
                    src={supabase.storage.from("publicidad").getPublicUrl(buyerAd.imagen_path).data.publicUrl}
                    alt=""
                  />
                  <div>
                    <small>{buyerAd.etiqueta || "Publicidad"}</small>
                    <h2>{buyerAd.titulo}</h2>
                    {buyerAd.texto && <p>{buyerAd.texto}</p>}
                  </div>
                  <a
                    href={buyerAd.enlace_destino}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => registerAdEvent(buyerAd.id, "clic")}
                  >
                    {buyerAd.texto_boton || "Conocer más"}
                  </a>
                </article>
              )}
              {!admin && !buyer && providerAd && (
                <article className="sponsored-banner">
                  <img
                    src={supabase.storage.from("publicidad").getPublicUrl(providerAd.imagen_path).data.publicUrl}
                    alt=""
                  />
                  <div>
                    <small>{providerAd.etiqueta || "Publicidad"}</small>
                    <h2>{providerAd.titulo}</h2>
                    {providerAd.texto && <p>{providerAd.texto}</p>}
                  </div>
                  <a
                    href={providerAd.enlace_destino}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => registerAdEvent(providerAd.id, "clic")}
                  >
                    {providerAd.texto_boton || "Conocer más"}
                  </a>
                </article>
              )}
              <section className="panel-list">
                <div className="panel-title">
                  <div>
                    <span>
                      {admin
                        ? "Actividad de empresas"
                        : buyer
                          ? "Solicitudes recientes"
                          : "Pedidos del rubro"}
                    </span>
                    <h2>
                      {admin ? "Últimos registros" : "Actividad reciente"}
                    </h2>
                  </div>
                  <button
                    className="primary small"
                    disabled={!verified || !operational}
                    onClick={() =>
                      admin
                        ? setAdminView("reviews")
                        : buyer
                          ? setBuyerView("new")
                          : setProviderView("requests")
                    }
                  >
                    {admin
                      ? "Revisar empresas"
                      : buyer
                        ? "+ Nueva solicitud"
                        : "Ver pedidos"}
                  </button>
                </div>
                {rows.length ? (
                  rows.slice(0, 8).map((row) => (
                    <article className="list-row" key={row.id}>
                      <div className="row-icon">{admin ? "E" : "S"}</div>
                      <div>
                        <b>{row.title}</b>
                        <span>{row.meta}</span>
                      </div>
                      <em className={`state ${row.state}`}>
                        {row.state.replaceAll("_", " ")}
                      </em>
                      <button
                        onClick={() => {
                          if (admin) {
                            const company = reviews.find(
                              (review) => review.id === row.id,
                            );
                            if (company) void openCompanyReview(company);
                            else setAdminView("reviews");
                          } else {
                            void openRequest(
                              row.id,
                              buyer ? "buyer" : "provider",
                            );
                          }
                        }}
                      >
                        Ver →
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty">
                    <b>Todavía no hay actividad</b>
                    <p>Los nuevos registros y solicitudes aparecerán acá.</p>
                  </div>
                )}
              </section>
            </>
          )}
          {!admin && !buyer && providerView === "requests" && (
            <div className="request-list-view">
            {requestListAd && (
              <article className="sponsored-banner request-list-ad">
                <img src={supabase.storage.from("publicidad").getPublicUrl(requestListAd.imagen_path).data.publicUrl} alt="" />
                <div><small>{requestListAd.etiqueta || "Publicidad"}</small><h2>{requestListAd.titulo}</h2>{requestListAd.texto && <p>{requestListAd.texto}</p>}</div>
                <a href={requestListAd.enlace_destino} target="_blank" rel="noopener noreferrer sponsored" onClick={() => registerAdEvent(requestListAd.id, "clic")}>{requestListAd.texto_boton || "Conocer más"}</a>
              </article>
            )}
            <section className="panel-list">
              <div className="panel-title">
                <div>
                  <span>Oportunidades activas</span>
                  <h2>Pedidos disponibles</h2>
                </div>
                <div className="panel-title-actions">
                  <em>{rows.length} pedidos</em>
                  <button
                    className="secondary small"
                    disabled={busy}
                    onClick={() => void loadRows(account)}
                  >
                    Actualizar
                  </button>
                </div>
              </div>
              {rows.length ? (
                rows.map((row) => (
                  <article className="list-row" key={row.id}>
                    <div className="row-icon">S</div>
                    <div>
                      <b>{row.title}</b>
                      <span>{row.meta}</span>
                    </div>
                    <em className={`state ${row.state}`}>{row.state}</em>
                    <button onClick={() => openRequest(row.id)}>Ver →</button>
                  </article>
                ))
              ) : (
                <div className="empty">
                  <b>No hay pedidos para tus rubros</b>
                  <p>
                    Las nuevas solicitudes compatibles aparecerán
                    automáticamente.
                  </p>
                </div>
              )}
            </section>
            </div>
          )}
          {!admin && !buyer && providerView === "detail" && requestDetail && (
            <section className="panel-list request-detail-page">
              <div className="detail-top">
                <button
                  className="back"
                  onClick={() => setProviderView("requests")}
                >
                  ← Volver a pedidos
                </button>
                <span className="state publicada">
                  Solicitud #{requestDetail.codigo}
                </span>
              </div>
              <div className="detail-title">
                <div>
                  <span>{requestDetail.comprador}</span>
                  <h2>{requestDetail.titulo}</h2>
                  <p>
                    {requestDetail.descripcion || "Sin descripción general."}
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={
                    !currentProviderQuote &&
                    (!verified ||
                      !operational ||
                      requestDetail.estado !== "publicada" ||
                      new Date(requestDetail.fecha_limite).getTime() <= Date.now())
                  }
                  onClick={() => {
                    if (currentProviderQuote) {
                      void openProviderQuote(currentProviderQuote);
                    } else {
                      openQuoteForm();
                    }
                  }}
                  title={
                    currentProviderQuote
                      ? "Abrir la cotización que ya presentaste"
                      : !verified
                      ? "Verificá la empresa para cotizar"
                      : requestDetail.estado !== "publicada" ||
                          new Date(requestDetail.fecha_limite).getTime() <= Date.now()
                        ? "La solicitud ya no recibe cotizaciones"
                        : undefined
                  }
                >
                  {currentProviderQuote
                    ? "Ver cotización enviada"
                    : requestDetail.estado !== "publicada" ||
                        new Date(requestDetail.fecha_limite).getTime() <= Date.now()
                    ? "Cotización cerrada"
                    : "Preparar cotización"}
                </button>
              </div>
              <div className="detail-facts">
                <div>
                  <small>Proyecto</small>
                  <b>{requestDetail.proyecto || "Sin informar"}</b>
                </div>
                <div>
                  <small>Fecha límite</small>
                  <b>
                    {new Date(requestDetail.fecha_limite).toLocaleString(
                      "es-AR",
                    )}
                  </b>
                </div>
                <div>
                  <small>Oferta parcial</small>
                  <b>
                    {requestDetail.permite_cotizacion_parcial
                      ? "Permitida"
                      : "No permitida"}
                  </b>
                </div>
                <div>
                  <small>Apertura</small>
                  <b>
                    {requestDetail.apertura_al_vencimiento
                      ? "Al vencimiento"
                      : "Inmediata"}
                  </b>
                </div>
              </div>
              <div className="company-contact-card">
                <div>
                  <span>Contacto de la empresa compradora</span>
                  <b>{requestDetail.comprador}</b>
                  <small>
                    Usá estos canales para consultas comerciales o técnicas
                    sobre la solicitud.
                  </small>
                </div>
                <div className="company-contact-data">
                  {requestDetail.compradorEmail && (
                    <a href={`mailto:${requestDetail.compradorEmail}`}>
                      Enviar correo
                    </a>
                  )}
                  {requestDetail.compradorTelefono && (
                    <a
                      href={getWhatsAppUrl(requestDetail.compradorTelefono)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir WhatsApp
                    </a>
                  )}
                  {!requestDetail.compradorEmail &&
                    !requestDetail.compradorTelefono && (
                      <small>La empresa no informó datos de contacto.</small>
                    )}
                </div>
              </div>
              <div className="requested-lines">
                <div className="section-heading">
                  <div>
                    <b>Artículos solicitados</b>
                    <span>
                      {requestDetail.items.length}{" "}
                      {requestDetail.items.length === 1
                        ? "renglón"
                        : "renglones"}
                    </span>
                  </div>
                </div>
                {requestDetail.items.map((item) => (
                  <article key={item.id}>
                    <span>{item.renglon}</span>
                    <div>
                      <b>{item.articulo}</b>
                      <small>
                        {item.especificacion || "Sin especificación adicional"}
                      </small>
                    </div>
                    <strong>
                      {item.cantidad}{" "}
                      {formatUnit(item.unidad, Number(item.cantidad))}
                    </strong>
                  </article>
                ))}
              </div>
              {requestAttachments.length > 0 && (
                <div className="request-attachments">
                  <div className="section-heading">
                    <div>
                      <b>Documentación adjunta</b>
                      <span>{requestAttachments.length} archivos</span>
                    </div>
                  </div>
                  <div className="attachment-list">
                    {requestAttachments.map((attachment) => (
                      <button
                        type="button"
                        key={attachment.id}
                        onClick={() => downloadRequestAttachment(attachment)}
                      >
                        <span className="attachment-icon">A</span>
                        <span>
                          <b>{attachment.nombre_archivo}</b>
                          <small>
                            {attachment.tamano_bytes
                              ? `${(attachment.tamano_bytes / 1024 / 1024).toFixed(2)} MB`
                              : "Tamaño no informado"}
                          </small>
                        </span>
                        <em>Abrir →</em>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {quoteOpen && !currentProviderQuote && (
                <form
                  ref={quoteFormRef}
                  className="quote-form"
                  onSubmit={submitQuote}
                  tabIndex={-1}
                >
                  <div className="section-heading">
                    <div>
                      <b>Preparar oferta</b>
                      <span>Elegí los artículos y completá los valores.</span>
                    </div>
                    <button type="button" onClick={() => setQuoteOpen(false)}>
                      Cerrar
                    </button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Moneda
                      <select name="moneda">
                        <option value="ARS">Pesos argentinos (ARS)</option>
                        <option value="USD">
                          Dólares estadounidenses (USD)
                        </option>
                      </select>
                    </label>
                    <label>
                      Condiciones de pago
                      <input
                        name="condiciones_pago"
                        required
                        placeholder="Ej.: Transferencia a 30 días"
                      />
                    </label>
                    <label>
                      Plazo de entrega general
                      <input
                        name="plazo_entrega"
                        required
                        placeholder="Ej.: 5 días hábiles"
                      />
                    </label>
                    <label className="check-label">
                      <input type="checkbox" name="impuestos_incluidos" />
                      <span>Los precios incluyen impuestos</span>
                    </label>
                  </div>
                  <div className="quote-lines">
                    {quoteLines.map((line, index) => {
                      const item = requestDetail.items[index];
                      return (
                        <article
                          className={!line.included ? "excluded" : ""}
                          key={line.item_solicitud_id}
                        >
                          <label className="include-line">
                            <input
                              type="checkbox"
                              checked={line.included}
                              disabled={
                                !requestDetail.permite_cotizacion_parcial
                              }
                              onChange={(event) =>
                                updateQuoteLine(
                                  index,
                                  "included",
                                  event.target.checked,
                                )
                              }
                            />
                            <span>Cotizar</span>
                          </label>
                          <div className="quote-line-title">
                            <b>{item.articulo}</b>
                            <small>
                              Solicitado: {item.cantidad}{" "}
                              {formatUnit(item.unidad, Number(item.cantidad))}
                            </small>
                          </div>
                          <label>
                            Cantidad
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              disabled={!line.included}
                              value={line.cantidad_ofertada}
                              onChange={(event) =>
                                updateQuoteLine(
                                  index,
                                  "cantidad_ofertada",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <label>
                            Precio unitario
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!line.included}
                              value={line.precio_unitario}
                              onChange={(event) =>
                                updateQuoteLine(
                                  index,
                                  "precio_unitario",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <label>
                            IVA %
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={!line.included}
                              value={line.alicuota_iva}
                              onChange={(event) =>
                                updateQuoteLine(
                                  index,
                                  "alicuota_iva",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <label>
                            Marca
                            <input
                              disabled={!line.included}
                              value={line.marca}
                              onChange={(event) =>
                                updateQuoteLine(
                                  index,
                                  "marca",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </article>
                      );
                    })}
                  </div>
                  <label>
                    Observaciones generales
                    <textarea
                      name="observaciones"
                      placeholder="Información adicional de la propuesta"
                    />
                  </label>
                  <div className="publish-footer">
                    <p>
                      Una vez presentada, la empresa compradora podrá revisar
                      esta oferta según su modalidad de apertura.
                    </p>
                    <button className="primary" disabled={busy}>
                      {busy ? "Presentando…" : "Presentar cotización"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
          {!admin && !buyer && providerView === "quotes" && (
            <section className="panel-list provider-quotes-page">
              <div className="panel-title">
                <div>
                  <span>Ofertas enviadas</span>
                  <h2>Mis cotizaciones</h2>
                </div>
                <em>
                  {providerQuotes.length}{" "}
                  {providerQuotes.length === 1 ? "cotización" : "cotizaciones"}
                </em>
              </div>
              {providerQuotes.length ? (
                providerQuotes.map((quote) => (
                  <article className="provider-quote-row" key={quote.id}>
                    <div className="row-icon">C</div>
                    <div className="provider-quote-main">
                      <span>Solicitud #{quote.requestCode}</span>
                      <b>{quote.requestTitle}</b>
                      <small>Comprador: {quote.buyerName}</small>
                    </div>
                    <div>
                      <small>Presentada</small>
                      <b>
                        {quote.presentedAt
                          ? new Date(quote.presentedAt).toLocaleString("es-AR")
                          : "Sin fecha"}
                      </b>
                    </div>
                    <div className="provider-quote-total">
                      <small>Total</small>
                      <b>
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: quote.currency,
                        }).format(quote.total)}
                      </b>
                    </div>
                    <em
                      className={`state ${quote.displayState === "Adjudicada" ? "verificada" : quote.displayState === "Cerrada" ? "observada" : "publicada"}`}
                    >
                      {quote.displayState}
                    </em>
                    <button onClick={() => openProviderQuote(quote)}>
                      Ver detalle →
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty">
                  <b>Todavía no enviaste cotizaciones</b>
                  <p>
                    Las ofertas presentadas a los compradores aparecerán en esta
                    sección.
                  </p>
                </div>
              )}
            </section>
          )}
          {!admin &&
            !buyer &&
            providerView === "quoteDetail" &&
            selectedProviderQuote && (
              <section className="panel-list buyer-quote-detail">
                <div className="detail-top">
                  <button
                    className="back"
                    onClick={() => setProviderView("quotes")}
                  >
                    ← Volver a mis cotizaciones
                  </button>
                  <em
                    className={`state ${selectedProviderQuote.displayState === "Adjudicada" ? "verificada" : "publicada"}`}
                  >
                    {selectedProviderQuote.displayState}
                  </em>
                </div>
                <div className="detail-title quote-detail-title">
                  <div>
                    <span>
                      Solicitud #{selectedProviderQuote.requestCode} ·{" "}
                      {selectedProviderQuote.buyerName}
                    </span>
                    <h2>{selectedProviderQuote.requestTitle}</h2>
                    <p>
                      Presentada{" "}
                      {selectedProviderQuote.presentedAt
                        ? new Date(
                            selectedProviderQuote.presentedAt,
                          ).toLocaleString("es-AR")
                        : "sin fecha registrada"}
                    </p>
                  </div>
                  <div className="quote-grand-total">
                    <small>Total con impuestos</small>
                    <strong>
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: selectedProviderQuote.currency,
                      }).format(selectedProviderQuote.total)}
                    </strong>
                  </div>
                  {selectedProviderQuote.displayState === "Presentada" &&
                    Boolean(selectedProviderQuote.deadline) &&
                    new Date(selectedProviderQuote.deadline) > new Date() && (
                      <button
                        className="primary small"
                        onClick={() => setProviderQuoteEditOpen(true)}
                      >
                        Modificar cotización
                      </button>
                    )}
                </div>
                <div className="detail-facts quote-facts">
                  <div>
                    <small>Moneda</small>
                    <b>{selectedProviderQuote.currency}</b>
                  </div>
                  <div>
                    <small>Condiciones de pago</small>
                    <b>{selectedProviderQuote.paymentTerms}</b>
                  </div>
                  <div>
                    <small>Entrega general</small>
                    <b>{selectedProviderQuote.deliveryTime}</b>
                  </div>
                  <div>
                    <small>Fecha límite</small>
                    <b>
                      {selectedProviderQuote.deadline
                        ? new Date(
                            selectedProviderQuote.deadline,
                          ).toLocaleString("es-AR")
                        : "Sin informar"}
                    </b>
                  </div>
                </div>
                {selectedProviderQuote.displayState === "Adjudicada" && (
                  <div className="company-contact-card">
                    <div>
                      <span>Contacto de la empresa compradora</span>
                      <b>{selectedProviderQuote.buyerName}</b>
                      <small>
                        Tu cotización fue adjudicada. Usá estos canales para
                        coordinar la entrega y las condiciones comerciales.
                      </small>
                    </div>
                    <div className="company-contact-data">
                      {selectedProviderQuote.buyerEmail && (
                        <a href={`mailto:${selectedProviderQuote.buyerEmail}`}>
                          Enviar correo
                        </a>
                      )}
                      {selectedProviderQuote.buyerTelefono && (
                        <a
                          href={getWhatsAppUrl(
                            selectedProviderQuote.buyerTelefono,
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir WhatsApp
                        </a>
                      )}
                      {!selectedProviderQuote.buyerEmail &&
                        !selectedProviderQuote.buyerTelefono && (
                          <small>
                            La empresa compradora no informó datos de contacto.
                          </small>
                        )}
                    </div>
                  </div>
                )}
                <div className="quote-pdf-box">
                  <div>
                    <b>Presupuesto formal en PDF</b>
                    <p>
                      {selectedProviderQuote.pdfPath
                        ? "El PDF está disponible para la empresa compradora."
                        : "Todavía no cargaste un PDF para esta cotización."}
                    </p>
                  </div>
                  <div className="quote-pdf-actions">
                    {selectedProviderQuote.pdfPath && (
                      <button
                        className="secondary"
                        onClick={() =>
                          downloadQuotePdf(selectedProviderQuote.pdfPath!)
                        }
                      >
                        Abrir PDF
                      </button>
                    )}
                    {selectedProviderQuote.displayState === "Presentada" &&
                      Boolean(selectedProviderQuote.deadline) &&
                      new Date(selectedProviderQuote.deadline) > new Date() && (
                        <>
                          <label className="pdf-picker">
                            {selectedProviderQuote.pdfPath
                              ? "Seleccionar reemplazo"
                              : "Seleccionar PDF"}
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={(event) =>
                                setQuotePdfFile(event.target.files?.[0] ?? null)
                              }
                            />
                          </label>
                          <button
                            className="primary"
                            onClick={uploadQuotePdf}
                            disabled={!quotePdfFile || busy}
                          >
                            {busy
                              ? "Cargando…"
                              : selectedProviderQuote.pdfPath
                                ? "Reemplazar PDF"
                                : "Cargar PDF"}
                          </button>
                        </>
                      )}
                  </div>
                  {quotePdfFile && (
                    <small className="selected-pdf-name">
                      Seleccionado: {quotePdfFile.name} ·{" "}
                      {(quotePdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  )}
                </div>
                <div className="quote-detail-lines">
                  <div className="quote-detail-heading">
                    <b>Artículos cotizados</b>
                    <span>
                      {providerQuoteItems.length}{" "}
                      {providerQuoteItems.length === 1
                        ? "renglón"
                        : "renglones"}
                    </span>
                  </div>
                  {providerQuoteItems.map((item, index) => {
                    const subtotal =
                      item.cantidad_ofertada * item.precio_unitario;
                    const total = selectedProviderQuote.taxesIncluded
                      ? subtotal
                      : subtotal * (1 + item.alicuota_iva / 100);
                    return (
                      <article className="buyer-quote-line" key={item.id}>
                        <span className="item-number">{index + 1}</span>
                        <div className="buyer-quote-product">
                          <b>{item.articulo}</b>
                          <small>
                            {item.cantidad_ofertada}{" "}
                            {formatUnit(item.unidad, item.cantidad_ofertada)}{" "}
                            ofertadas
                          </small>
                          {item.marca && <em>Marca: {item.marca}</em>}
                        </div>
                        <div>
                          <small>Precio unitario</small>
                          <b>
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: selectedProviderQuote.currency,
                            }).format(item.precio_unitario)}
                          </b>
                        </div>
                        <div>
                          <small>IVA</small>
                          <b>{item.alicuota_iva}%</b>
                        </div>
                        <div className="line-total">
                          <small>Total</small>
                          <b>
                            {new Intl.NumberFormat("es-AR", {
                              style: "currency",
                              currency: selectedProviderQuote.currency,
                            }).format(total)}
                          </b>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {selectedProviderQuote.observations && (
                  <div className="quote-general-notes">
                    <small>Observaciones generales</small>
                    <p>{selectedProviderQuote.observations}</p>
                  </div>
                )}
                {providerQuoteEditOpen && (
                  <form
                    className="quote-form provider-edit-form"
                    onSubmit={saveProviderQuoteChanges}
                  >
                    <div className="section-heading">
                      <div>
                        <b>Modificar cotización</b>
                        <span>
                          Los cambios reemplazarán la oferta presentada.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProviderQuoteEditOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                    <div className="form-grid">
                      <label>
                        Moneda
                        <select
                          value={providerEditHeader.currency}
                          onChange={(event) =>
                            setProviderEditHeader((current) => ({
                              ...current,
                              currency: event.target.value as "ARS" | "USD",
                            }))
                          }
                        >
                          <option value="ARS">Pesos argentinos (ARS)</option>
                          <option value="USD">
                            Dólares estadounidenses (USD)
                          </option>
                        </select>
                      </label>
                      <label>
                        Condiciones de pago
                        <input
                          value={providerEditHeader.paymentTerms}
                          onChange={(event) =>
                            setProviderEditHeader((current) => ({
                              ...current,
                              paymentTerms: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Plazo de entrega general
                        <input
                          value={providerEditHeader.deliveryTime}
                          onChange={(event) =>
                            setProviderEditHeader((current) => ({
                              ...current,
                              deliveryTime: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label className="check-label edit-tax-check">
                        <input
                          type="checkbox"
                          checked={providerEditHeader.taxesIncluded}
                          onChange={(event) =>
                            setProviderEditHeader((current) => ({
                              ...current,
                              taxesIncluded: event.target.checked,
                            }))
                          }
                        />
                        Los precios incluyen impuestos
                      </label>
                    </div>
                    <div className="quote-lines provider-edit-lines">
                      {providerEditLines.map((line, index) => (
                        <article key={line.item_solicitud_id}>
                          <div className="quote-line-title">
                            <b>
                              {providerQuoteItems[index]?.articulo ||
                                `Artículo ${index + 1}`}
                            </b>
                            <small>
                              Solicitado:{" "}
                              {providerQuoteItems[index]?.cantidad_solicitada}{" "}
                              {providerQuoteItems[index]?.unidad}
                            </small>
                          </div>
                          <label>
                            Cantidad
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={line.cantidad_ofertada}
                              onChange={(event) =>
                                updateProviderEditLine(
                                  index,
                                  "cantidad_ofertada",
                                  event.target.value,
                                )
                              }
                              required
                            />
                          </label>
                          <label>
                            Precio unitario
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.precio_unitario}
                              onChange={(event) =>
                                updateProviderEditLine(
                                  index,
                                  "precio_unitario",
                                  event.target.value,
                                )
                              }
                              required
                            />
                          </label>
                          <label>
                            IVA %
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={line.alicuota_iva}
                              onChange={(event) =>
                                updateProviderEditLine(
                                  index,
                                  "alicuota_iva",
                                  event.target.value,
                                )
                              }
                              required
                            />
                          </label>
                          <label>
                            Marca
                            <input
                              value={line.marca}
                              onChange={(event) =>
                                updateProviderEditLine(
                                  index,
                                  "marca",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </article>
                      ))}
                    </div>
                    <label>
                      Observaciones generales
                      <textarea
                        value={providerEditHeader.observations}
                        onChange={(event) =>
                          setProviderEditHeader((current) => ({
                            ...current,
                            observations: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="publish-footer">
                      <p>
                        Solo se puede modificar mientras la solicitud siga
                        abierta y sin adjudicar.
                      </p>
                      <button className="primary" disabled={busy}>
                        {busy ? "Guardando…" : "Guardar cambios"}
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}
          {buyer && buyerView === "requests" && (
            <section className="panel-list">
              <div className="panel-title">
                <div>
                  <span>Compras publicadas</span>
                  <h2>Mis solicitudes</h2>
                </div>
                <div className="panel-title-actions">
                  <button
                    className="secondary small"
                    disabled={busy}
                    onClick={() => void loadRows(account)}
                  >
                    Actualizar
                  </button>
                  <button
                    className="primary small"
                    onClick={() => setBuyerView("new")}
                  >
                    + Nueva solicitud
                  </button>
                </div>
              </div>
              {rows.length ? (
                rows.map((row) => (
                  <article className="list-row" key={row.id}>
                    <div className="row-icon">S</div>
                    <div>
                      <b>{row.title}</b>
                      <span>{row.meta}</span>
                    </div>
                    <em className={`state ${row.state}`}>{row.state}</em>
                    <button onClick={() => openRequest(row.id, "buyer")}>
                      Ver →
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty">
                  <b>No hay solicitudes publicadas</b>
                  <p>
                    Creá el primer pedido para comenzar a recibir cotizaciones.
                  </p>
                </div>
              )}
            </section>
          )}
          {buyer && buyerView === "requestDetail" && requestDetail && (
            <section className="panel-list request-detail-page buyer-request-detail">
              <div className="detail-top">
                <button
                  className="back"
                  onClick={() => setBuyerView("requests")}
                >
                  ← Volver a solicitudes
                </button>
                <span className={`state ${requestDetail.estado}`}>
                  {requestDetail.estado.replaceAll("_", " ")}
                </span>
              </div>
              <div className="detail-title">
                <div>
                  <span>Solicitud #{requestDetail.codigo}</span>
                  <h2>{requestDetail.titulo}</h2>
                  <p>
                    {requestDetail.descripcion || "Sin descripción general."}
                  </p>
                </div>
              </div>
              <div className="detail-facts">
                <div>
                  <small>Proyecto</small>
                  <b>{requestDetail.proyecto || "Sin informar"}</b>
                </div>
                <div>
                  <small>Fecha límite</small>
                  <b>
                    {new Date(requestDetail.fecha_limite).toLocaleString(
                      "es-AR",
                    )}
                  </b>
                </div>
                <div>
                  <small>Cotizaciones recibidas</small>
                  <b>
                    {
                      buyerQuotes.filter(
                        (quote) => quote.solicitud_id === requestDetail.id,
                      ).length
                    }
                  </b>
                </div>
                <div>
                  <small>Renglones adjudicados</small>
                  <b>
                    {
                      awards.filter(
                        (award) => award.requestId === requestDetail.id,
                      ).length
                    }{" "}
                    de {requestDetail.items.length}
                  </b>
                </div>
              </div>
              <div className="requested-lines">
                <div className="section-heading">
                  <div>
                    <b>Artículos solicitados</b>
                    <span>
                      {requestDetail.items.length}{" "}
                      {requestDetail.items.length === 1
                        ? "renglón"
                        : "renglones"}
                    </span>
                  </div>
                </div>
                {requestDetail.items.map((item) => {
                  const award = awards.find(
                    (record) =>
                      record.requestId === requestDetail.id &&
                      record.requestItemId === item.id,
                  );
                  return (
                    <article key={item.id}>
                      <span>{item.renglon}</span>
                      <div>
                        <b>{item.articulo}</b>
                        <small>
                          {item.especificacion ||
                            "Sin especificación adicional"}
                        </small>
                      </div>
                      <strong>
                        {item.cantidad}{" "}
                        {formatUnit(item.unidad, Number(item.cantidad))}
                      </strong>
                      <em
                        className={`state ${award ? "verificada" : "pendiente"}`}
                      >
                        {award ? "Adjudicado" : "Pendiente"}
                      </em>
                    </article>
                  );
                })}
              </div>
              {requestAttachments.length > 0 && (
                <div className="request-attachments">
                  <div className="section-heading">
                    <div>
                      <b>Documentación adjunta</b>
                      <span>{requestAttachments.length} archivos</span>
                    </div>
                  </div>
                  <div className="attachment-list">
                    {requestAttachments.map((attachment) => (
                      <button
                        type="button"
                        key={attachment.id}
                        onClick={() => downloadRequestAttachment(attachment)}
                      >
                        <span className="attachment-icon">A</span>
                        <span>
                          <b>{attachment.nombre_archivo}</b>
                          <small>
                            {attachment.tamano_bytes
                              ? `${(attachment.tamano_bytes / 1024 / 1024).toFixed(2)} MB`
                              : "Tamaño no informado"}
                          </small>
                        </span>
                        <em>Abrir →</em>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="request-quotes-section">
                <div className="section-heading">
                  <div>
                    <b>Cotizaciones de esta solicitud</b>
                    <span>
                      {currentRequestBuyerQuotes.length}{" "}
                      {currentRequestBuyerQuotes.length === 1
                        ? "oferta recibida"
                        : "ofertas recibidas"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void loadBuyerQuotes(account.empresas?.id ?? "")
                    }
                  >
                    Actualizar
                  </button>
                </div>
                {currentRequestBuyerQuotes.length ? (
                  currentRequestBuyerQuotes.map((quote) => (
                    <article className="quote-received" key={quote.id}>
                      <div className="row-icon">C</div>
                      <div className="quote-received-main">
                        <span>Proveedor</span>
                        <b>{quote.providerName}</b>
                        <small>
                          {quote.presentada_en
                            ? new Date(quote.presentada_en).toLocaleString(
                                "es-AR",
                              )
                            : "Sin fecha registrada"}
                        </small>
                      </div>
                      <div className="quote-condition">
                        <small>Pago</small>
                        <b>{quote.condiciones_pago}</b>
                      </div>
                      <div className="quote-condition">
                        <small>Entrega</small>
                        <b>{quote.plazo_entrega}</b>
                      </div>
                      <div className="quote-total">
                        <small>Total con impuestos</small>
                        <b>
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: quote.moneda,
                            maximumFractionDigits: 2,
                          }).format(quote.total)}
                        </b>
                      </div>
                      <button
                        className="quote-detail-button"
                        onClick={() => openBuyerQuote(quote, requestDetail.id)}
                        disabled={busy}
                      >
                        Ver detalle →
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="empty compact-empty">
                    <b>Todavía no hay ofertas para esta solicitud</b>
                    <p>
                      Cuando un proveedor presente una cotización aparecerá
                      aquí, vinculada únicamente a este pedido.
                    </p>
                  </div>
                )}
              </div>
              {requestDetail.estado === "publicada" && (
                <div className="request-lifecycle">
                  <div>
                    <b>Gestión de la solicitud</b>
                    <p>
                      Cerrala cuando no quieras recibir más ofertas o cancelala
                      si el pedido dejó de ser necesario. Una solicitud cerrada
                      puede reabrirse mientras no haya vencido.
                    </p>
                  </div>
                  <div className="request-lifecycle-buttons">
                    <button
                      className="secondary"
                      onClick={() => setRequestAction("cerrar")}
                    >
                      Cerrar solicitud
                    </button>
                    <button
                      className="danger-outline"
                      onClick={() => setRequestAction("cancelar")}
                    >
                      Cancelar solicitud
                    </button>
                  </div>
                </div>
              )}
              {requestDetail.estado === "cerrada" && (
                <div className="request-lifecycle request-reopen">
                  <div>
                    <b>Solicitud cerrada</b>
                    <p>
                      Reabrila para volver a habilitar la adjudicación y la
                      recepción de ofertas hasta la fecha límite.
                    </p>
                  </div>
                  <div className="request-lifecycle-buttons">
                    <button
                      className="primary"
                      onClick={() => setRequestAction("reabrir")}
                    >
                      Reabrir solicitud
                    </button>
                  </div>
                </div>
              )}
              {requestAction && (
                <div className="request-action-confirm">
                  <div>
                    <b>
                      {requestAction === "cancelar"
                        ? "Confirmar cancelación"
                        : requestAction === "reabrir"
                          ? "Confirmar reapertura"
                          : "Confirmar cierre"}
                    </b>
                    <p>
                      {requestAction === "reabrir"
                        ? "La solicitud volverá a estar activa y podrás adjudicar las cotizaciones recibidas."
                        : "Después de confirmar, los proveedores no podrán presentar ni modificar cotizaciones."}
                    </p>
                  </div>
                  {requestAction !== "reabrir" && (
                    <label>
                      {requestAction === "cancelar"
                        ? "Motivo de la cancelación"
                        : "Observación del cierre (opcional)"}
                      <textarea
                        value={requestActionReason}
                        onChange={(event) =>
                          setRequestActionReason(event.target.value)
                        }
                        placeholder={
                          requestAction === "cancelar"
                            ? "Explicá por qué se cancela el pedido"
                            : "Información adicional"
                        }
                      />
                    </label>
                  )}
                  <div className="request-action-buttons">
                    <button
                      className="secondary"
                      onClick={() => {
                        setRequestAction(null);
                        setRequestActionReason("");
                      }}
                      disabled={busy}
                    >
                      Volver
                    </button>
                    <button
                      className={
                        requestAction === "cancelar" ? "danger" : "primary"
                      }
                      onClick={manageRequest}
                      disabled={busy}
                    >
                      {busy
                        ? "Guardando…"
                        : requestAction === "cancelar"
                          ? "Cancelar definitivamente"
                          : requestAction === "reabrir"
                            ? "Reabrir solicitud"
                            : "Cerrar solicitud"}
                    </button>
                  </div>
                </div>
              )}
              <div className="buyer-request-actions">
                <button
                  className="primary"
                  onClick={() => setBuyerView("awards")}
                >
                  Ver adjudicaciones
                </button>
              </div>
            </section>
          )}
          {buyer && buyerView === "quotes" && (
            <section className="panel-list quotes-page">
              <div className="panel-title">
                <div>
                  <span>Ofertas de proveedores</span>
                  <h2>Cotizaciones recibidas</h2>
                </div>
                <em>
                  {buyerQuotes.length}{" "}
                  {buyerQuotes.length === 1 ? "oferta" : "ofertas"}
                </em>
              </div>
              {buyerQuotes.length ? (
                <div className="quote-request-groups">
                  {buyerQuoteGroups.map((group) => (
                    <section className="quote-request-group" key={group.requestId}>
                      <div className="quote-request-heading">
                        <div>
                          <span>Solicitud #{group.requestCode}</span>
                          <b>{group.requestTitle}</b>
                          <small>
                            {group.quotes.length}{" "}
                            {group.quotes.length === 1
                              ? "cotización recibida"
                              : "cotizaciones recibidas"}
                          </small>
                        </div>
                        <button
                          type="button"
                          className="secondary small"
                          onClick={() => openRequest(group.requestId, "buyer")}
                        >
                          Ver solicitud completa
                        </button>
                      </div>
                      {group.quotes.map((quote) => (
                        <article className="quote-received" key={quote.id}>
                          <div className="row-icon">C</div>
                          <div className="quote-received-main">
                            <span>Proveedor</span>
                            <b>{quote.providerName}</b>
                            <small>
                              {quote.presentada_en
                                ? new Date(quote.presentada_en).toLocaleString(
                                    "es-AR",
                                  )
                                : "Sin fecha registrada"}
                            </small>
                          </div>
                          <div className="quote-condition">
                            <small>Pago</small>
                            <b>{quote.condiciones_pago}</b>
                          </div>
                          <div className="quote-condition">
                            <small>Entrega</small>
                            <b>{quote.plazo_entrega}</b>
                          </div>
                          <div className="quote-total">
                            <small>Total con impuestos</small>
                            <b>
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: quote.moneda,
                                maximumFractionDigits: 2,
                              }).format(quote.total)}
                            </b>
                          </div>
                          <button
                            className="quote-detail-button"
                            onClick={() =>
                              openBuyerQuote(quote, group.requestId)
                            }
                            disabled={busy}
                          >
                            Ver detalle →
                          </button>
                        </article>
                      ))}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <b>Todavía no hay cotizaciones visibles</b>
                  <p>
                    Las ofertas aparecerán aquí al ser presentadas, según la
                    modalidad de apertura de cada solicitud.
                  </p>
                </div>
              )}
            </section>
          )}
          {buyer && buyerView === "quoteDetail" && selectedBuyerQuote && (
            <section className="panel-list buyer-quote-detail">
              <div className="detail-top">
                <button
                  className="back"
                  onClick={() => {
                    if (buyerQuoteOriginRequestId && requestDetail?.id === buyerQuoteOriginRequestId)
                      setBuyerView("requestDetail");
                    else setBuyerView("quotes");
                    setBuyerQuoteOriginRequestId(null);
                  }}
                >
                  {buyerQuoteOriginRequestId
                    ? "← Volver a la solicitud"
                    : "← Volver a cotizaciones"}
                </button>
                <em className={`state ${selectedBuyerQuote.estado}`}>
                  {selectedBuyerQuote.estado}
                </em>
              </div>
              <div className="detail-title quote-detail-title">
                <div>
                  <span>
                    Solicitud #{selectedBuyerQuote.requestCode} · Oferta de{" "}
                    {selectedBuyerQuote.providerName}
                  </span>
                  <h2>{selectedBuyerQuote.requestTitle}</h2>
                  <p>
                    Presentada{" "}
                    {selectedBuyerQuote.presentada_en
                      ? new Date(
                          selectedBuyerQuote.presentada_en,
                        ).toLocaleString("es-AR")
                      : "sin fecha registrada"}
                  </p>
                </div>
                <div className="quote-grand-total">
                  <small>Total con impuestos</small>
                  <strong>
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: selectedBuyerQuote.moneda,
                      maximumFractionDigits: 2,
                    }).format(selectedBuyerQuote.total)}
                  </strong>
                </div>
              </div>
              <div className="detail-facts quote-facts">
                <div>
                  <small>Moneda</small>
                  <b>{selectedBuyerQuote.moneda}</b>
                </div>
                <div>
                  <small>Condiciones de pago</small>
                  <b>{selectedBuyerQuote.condiciones_pago}</b>
                </div>
                <div>
                  <small>Entrega general</small>
                  <b>{selectedBuyerQuote.plazo_entrega}</b>
                </div>
                <div>
                  <small>Precios</small>
                  <b>
                    {selectedBuyerQuote.impuestos_incluidos
                      ? "Impuestos incluidos"
                      : "Impuestos no incluidos"}
                  </b>
                </div>
              </div>
              <div className="company-contact-card">
                <div>
                  <span>Contacto de la empresa proveedora</span>
                  <b>{selectedBuyerQuote.providerName}</b>
                  <small>
                    Contactá al proveedor para coordinar aspectos comerciales,
                    técnicos o de entrega.
                  </small>
                </div>
                <div className="company-contact-data">
                  {selectedBuyerQuote.providerEmail && (
                    <a href={`mailto:${selectedBuyerQuote.providerEmail}`}>
                      Enviar correo
                    </a>
                  )}
                  {selectedBuyerQuote.providerTelefono && (
                    <a
                      href={getWhatsAppUrl(selectedBuyerQuote.providerTelefono)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir WhatsApp
                    </a>
                  )}
                  {!selectedBuyerQuote.providerEmail &&
                    !selectedBuyerQuote.providerTelefono && (
                      <small>La empresa no informó datos de contacto.</small>
                    )}
                </div>
              </div>
              {selectedBuyerQuote.pdfPath && (
                <div className="quote-pdf-box buyer-pdf-box">
                  <div>
                    <b>Presupuesto formal en PDF</b>
                    <p>Documento privado enviado por la empresa proveedora.</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() =>
                      downloadQuotePdf(selectedBuyerQuote.pdfPath!)
                    }
                  >
                    Abrir PDF
                  </button>
                </div>
              )}
              <div className="quote-detail-lines">
                <div className="quote-detail-heading">
                  <b>Artículos cotizados</b>
                  <span>
                    {buyerQuoteItems.length}{" "}
                    {buyerQuoteItems.length === 1 ? "renglón" : "renglones"}
                  </span>
                </div>
                {buyerQuoteItems.map((item, index) => {
                  const subtotal =
                    item.cantidad_ofertada * item.precio_unitario;
                  const total = selectedBuyerQuote.impuestos_incluidos
                    ? subtotal
                    : subtotal * (1 + item.alicuota_iva / 100);
                  return (
                    <article className="buyer-quote-line" key={item.id}>
                      {awardOpen ? (
                        <label className="award-selector">
                          <input
                            type="checkbox"
                            checked={
                              awardSelections[item.id]?.selected ?? false
                            }
                            onChange={(event) =>
                              setAwardSelections((current) => ({
                                ...current,
                                [item.id]: {
                                  ...current[item.id],
                                  selected: event.target.checked,
                                },
                              }))
                            }
                          />
                        </label>
                      ) : (
                        <span className="item-number">{index + 1}</span>
                      )}
                      <div className="buyer-quote-product">
                        <b>{item.articulo}</b>
                        <small>
                          Solicitado: {item.cantidad_solicitada}{" "}
                          {formatUnit(item.unidad, item.cantidad_solicitada)}
                        </small>
                        {item.marca && <em>Marca: {item.marca}</em>}
                      </div>
                      <div>
                        <small>Cantidad ofertada</small>
                        <b>
                          {item.cantidad_ofertada}{" "}
                          {formatUnit(item.unidad, item.cantidad_ofertada)}
                        </b>
                      </div>
                      <div>
                        <small>Precio unitario</small>
                        <b>
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: selectedBuyerQuote.moneda,
                          }).format(item.precio_unitario)}
                        </b>
                      </div>
                      <div>
                        <small>IVA</small>
                        <b>{item.alicuota_iva}%</b>
                      </div>
                      <div className="line-total">
                        <small>Total</small>
                        <b>
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: selectedBuyerQuote.moneda,
                          }).format(total)}
                        </b>
                      </div>
                      {awardOpen && awardSelections[item.id]?.selected && (
                        <label className="award-quantity">
                          Cantidad a adjudicar
                          <input
                            type="number"
                            min="0.001"
                            max={item.cantidad_ofertada}
                            step="0.001"
                            value={awardSelections[item.id]?.quantity ?? ""}
                            onChange={(event) =>
                              setAwardSelections((current) => ({
                                ...current,
                                [item.id]: {
                                  ...current[item.id],
                                  quantity: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                      )}
                      {(item.especificacion_ofertada ||
                        item.plazo_entrega_item ||
                        item.observaciones) && (
                        <div className="line-notes">
                          {item.especificacion_ofertada && (
                            <span>
                              <b>Especificación:</b>{" "}
                              {item.especificacion_ofertada}
                            </span>
                          )}
                          {item.plazo_entrega_item && (
                            <span>
                              <b>Entrega:</b> {item.plazo_entrega_item}
                            </span>
                          )}
                          {item.observaciones && (
                            <span>
                              <b>Observaciones:</b> {item.observaciones}
                            </span>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              {selectedBuyerQuote.observaciones && (
                <div className="quote-general-notes">
                  <small>Observaciones generales</small>
                  <p>{selectedBuyerQuote.observaciones}</p>
                </div>
              )}
              <div className="detail-next-step">
                <p>
                  {selectedBuyerQuote.requestState !== "publicada" ||
                  !selectedBuyerQuote.requestDeadline ||
                  new Date(selectedBuyerQuote.requestDeadline).getTime() <=
                    Date.now()
                    ? "La solicitud cerró, venció o ya fue adjudicada. La oferta queda disponible en modo lectura."
                    : awardOpen
                    ? "Seleccioná los artículos y confirmá las cantidades que se adjudicarán."
                    : "Podés adjudicar la oferta completa o solamente algunos artículos."}
                </p>
                <div className="award-actions">
                  {awardOpen && (
                    <button
                      className="secondary"
                      onClick={() => setAwardOpen(false)}
                      disabled={busy}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    className="primary"
                    onClick={() =>
                      awardOpen ? confirmAward() : setAwardOpen(true)
                    }
                    disabled={
                      busy ||
                      selectedBuyerQuote.requestState !== "publicada" ||
                      !selectedBuyerQuote.requestDeadline ||
                      new Date(selectedBuyerQuote.requestDeadline).getTime() <=
                        Date.now()
                    }
                  >
                    {busy
                      ? "Guardando…"
                      : selectedBuyerQuote.requestState !== "publicada" ||
                          !selectedBuyerQuote.requestDeadline ||
                          new Date(
                            selectedBuyerQuote.requestDeadline,
                          ).getTime() <= Date.now()
                        ? "Solicitud no disponible"
                      : awardOpen
                        ? "Confirmar adjudicación"
                        : "Adjudicar cotización"}
                  </button>
                </div>
              </div>
            </section>
          )}
          {!admin &&
            ((buyer && buyerView === "awards") ||
              (!buyer && providerView === "awards")) && (
              <section className="panel-list awards-page">
                <div className="panel-title">
                  <div>
                    <span>Resultados confirmados</span>
                    <h2>
                      {buyer
                        ? "Adjudicaciones realizadas"
                        : "Adjudicaciones recibidas"}
                    </h2>
                  </div>
                  <em>
                    {visibleAwards.length}{" "}
                    {visibleAwards.length === 1 ? "renglón" : "renglones"}
                  </em>
                </div>
                {visibleAwards.length ? (
                  <div className="award-history">
                    {visibleAwards.map((award) => (
                      <article className="award-card" key={award.id}>
                        <div className="award-card-head">
                          <div>
                            <span>Solicitud #{award.requestCode}</span>
                            <h3>{award.requestTitle}</h3>
                            <p>
                              {buyer
                                ? `Proveedor: ${award.providerName}`
                                : `Comprador: ${award.buyerName}`}
                            </p>
                          </div>
                          <em className="state verificada">Adjudicada</em>
                        </div>
                        <div className="award-card-data">
                          <div className="award-product">
                            <small>Artículo</small>
                            <b>{award.article}</b>
                          </div>
                          <div>
                            <small>Cantidad</small>
                            <b>
                              {award.quantity} {award.unit}
                            </b>
                          </div>
                          <div>
                            <small>Precio unitario</small>
                            <b>
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: award.currency,
                              }).format(award.unitPrice)}
                            </b>
                          </div>
                          <div>
                            <small>Importe adjudicado</small>
                            <strong>
                              {new Intl.NumberFormat("es-AR", {
                                style: "currency",
                                currency: award.currency,
                              }).format(award.total)}
                            </strong>
                          </div>
                        </div>
                        <div className="award-card-foot">
                          <span>Pago: {award.paymentTerms}</span>
                          <span>Entrega: {award.deliveryTime}</span>
                          <span>
                            Fecha:{" "}
                            {new Date(award.awardedAt).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <b>No hay adjudicaciones registradas</b>
                    <p>
                      {buyer
                        ? "Las adjudicaciones que confirmes aparecerán en este historial."
                        : "Cuando una empresa compradora seleccione tu oferta, aparecerá aquí."}
                    </p>
                  </div>
                )}
              </section>
            )}
          {buyer && buyerView === "new" && (
            <section className="panel-list request-form-page">
              <div className="panel-title">
                <div>
                  <span>Nueva oportunidad</span>
                  <h2>Publicar solicitud de cotización</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => setBuyerView("summary")}
                >
                  Cancelar
                </button>
              </div>
              <form onSubmit={publishRequest}>
                <div className="form-grid">
                  <label>
                    Título del pedido
                    <input
                      name="titulo"
                      required
                      placeholder="Ej.: Elementos de protección personal"
                    />
                  </label>
                  <label>
                    Proyecto u obra
                    <input
                      name="proyecto"
                      placeholder="Ej.: Proyecto Calingasta"
                    />
                  </label>
                  <label className="wide">
                    Descripción general
                    <textarea
                      name="descripcion"
                      placeholder="Contexto o instrucciones generales para los proveedores"
                    />
                  </label>
                  <label>
                    Fecha y hora límite
                    <input name="fecha_limite" type="datetime-local" required />
                  </label>
                  <label>
                    Modalidad de apertura
                    <select name="apertura">
                      <option value="inmediata">
                        Ver ofertas al recibirlas
                      </option>
                      <option value="vencimiento">Abrir al vencimiento</option>
                    </select>
                  </label>
                </div>
                <div className="request-section attachment-upload-section">
                  <div className="section-heading">
                    <div>
                      <b>Documentación adjunta</b>
                      <span>
                        Especificaciones, planos, imágenes o documentación
                        técnica. Máximo 5 archivos de 10 MB cada uno.
                      </span>
                    </div>
                  </div>
                  <label className="attachment-picker">
                    Seleccionar archivos
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                      onChange={(event) =>
                        setRequestFiles(
                          Array.from(event.target.files ?? []).slice(0, 5),
                        )
                      }
                    />
                  </label>
                  {requestFiles.length > 0 && (
                    <div className="selected-attachments">
                      {requestFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`}>
                          <span>
                            <b>{file.name}</b>
                            <small>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </small>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setRequestFiles((files) =>
                                files.filter(
                                  (_, fileIndex) => fileIndex !== index,
                                ),
                              )
                            }
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="request-section">
                  <div className="section-heading">
                    <div>
                      <b>Artículos solicitados</b>
                      <span>Agregá todos los renglones que necesites.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRequestItems((items) => [
                          ...items,
                          {
                            articulo: "",
                            cantidad: "",
                            unidad: "unidad",
                            especificacion: "",
                          },
                        ])
                      }
                    >
                      + Agregar artículo
                    </button>
                  </div>
                  {requestItems.map((item, index) => (
                    <div className="request-item" key={index}>
                      <span className="item-number">{index + 1}</span>
                      <label>
                        Artículo
                        <input
                          value={item.articulo}
                          onChange={(event) =>
                            updateRequestItem(
                              index,
                              "articulo",
                              event.target.value,
                            )
                          }
                          required
                        />
                      </label>
                      <label>
                        Cantidad
                        <input
                          value={item.cantidad}
                          onChange={(event) =>
                            updateRequestItem(
                              index,
                              "cantidad",
                              event.target.value,
                            )
                          }
                          type="number"
                          min="0.001"
                          step="0.001"
                          required
                        />
                      </label>
                      <label>
                        Unidad
                        <input
                          value={item.unidad}
                          onChange={(event) =>
                            updateRequestItem(
                              index,
                              "unidad",
                              event.target.value,
                            )
                          }
                          required
                        />
                      </label>
                      <label className="item-spec">
                        Especificación
                        <input
                          value={item.especificacion}
                          onChange={(event) =>
                            updateRequestItem(
                              index,
                              "especificacion",
                              event.target.value,
                            )
                          }
                          placeholder="Marca, medida, norma, características…"
                        />
                      </label>
                      {requestItems.length > 1 && (
                        <button
                          className="remove-item"
                          type="button"
                          onClick={() =>
                            setRequestItems((items) =>
                              items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="request-section">
                  <div className="section-heading">
                    <div>
                      <b>Rubros destinatarios</b>
                      <span>
                        Solo recibirán el pedido proveedores registrados en
                        estas categorías.
                      </span>
                    </div>
                  </div>
                  <div className="categories-grid compact">
                    {categories.map((category) => (
                      <label
                        className={`category-option ${requestSelectedCategories.includes(category.id) ? "selected" : ""}`}
                        key={category.id}
                      >
                        <input
                          type="checkbox"
                          checked={requestSelectedCategories.includes(category.id)}
                          onChange={() => toggleRequestCategory(category.id)}
                        />
                        <span>{category.nombre}</span>
                        <b>
                          {requestSelectedCategories.includes(category.id) ? "✓" : "+"}
                        </b>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="request-options">
                  <label>
                    <input type="checkbox" name="parcial" defaultChecked />
                    <span>
                      <b>Permitir cotización parcial</b>
                      <small>
                        El proveedor puede ofertar solo algunos artículos.
                      </small>
                    </span>
                  </label>
                  <label>
                    <input type="checkbox" name="cantidad_menor" />
                    <span>
                      <b>Permitir cantidad menor</b>
                      <small>
                        El proveedor puede ofrecer menos unidades que las
                        solicitadas.
                      </small>
                    </span>
                  </label>
                </div>
                <div className="publish-footer">
                  <p>
                    Al publicar, los proveedores de los rubros seleccionados
                    podrán acceder al pedido.
                  </p>
                  <button className="primary" disabled={busy}>
                    {busy ? "Publicando…" : "Publicar solicitud"}
                  </button>
                </div>
              </form>
            </section>
          )}
          {admin && adminView === "supervision" && (
            <section className="panel-list review-page supervision-page">
              <div className="panel-title">
                <div>
                  <span>Actividad de la plataforma</span>
                  <h2>Supervisión de solicitudes</h2>
                </div>
                <em>{supervisionRequests.length} solicitudes</em>
              </div>
              <div className="supervision-filters">
                <input
                  type="search"
                  value={supervisionSearch}
                  onChange={(event) => { setSupervisionSearch(event.target.value); setSupervisionPage(1); }}
                  placeholder="Buscar por código, solicitud o empresa…"
                  aria-label="Buscar solicitudes"
                />
                <select
                  value={supervisionStatus}
                  onChange={(event) => { setSupervisionStatus(event.target.value); setSupervisionPage(1); }}
                  aria-label="Filtrar por estado"
                >
                  <option value="todos">Todos los estados</option>
                  {[...new Set(supervisionRequests.map((request) => request.estado))].map((status) => (
                    <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <select value={supervisionCompany} onChange={(event) => { setSupervisionCompany(event.target.value); setSupervisionPage(1); }} aria-label="Filtrar por empresa">
                  <option value="todas">Todas las empresas</option>
                  {[...new Map(supervisionRequests.map((request) => [request.empresa_compradora_id, request.empresa_compradora])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                <select value={supervisionQuotes} onChange={(event) => { setSupervisionQuotes(event.target.value); setSupervisionPage(1); }} aria-label="Filtrar por cotizaciones">
                  <option value="todas">Con y sin cotizaciones</option><option value="con">Con cotizaciones</option><option value="sin">Sin cotizaciones</option>
                </select>
                <label>Desde<input type="date" value={supervisionFrom} onChange={(event) => { setSupervisionFrom(event.target.value); setSupervisionPage(1); }} /></label>
                <label>Hasta<input type="date" value={supervisionTo} onChange={(event) => { setSupervisionTo(event.target.value); setSupervisionPage(1); }} /></label>
                <select value={supervisionSort} onChange={(event) => setSupervisionSort(event.target.value)} aria-label="Ordenar solicitudes">
                  <option value="recientes">Más recientes</option><option value="antiguas">Más antiguas</option><option value="vencimiento">Próximo vencimiento</option><option value="ofertas">Más cotizaciones</option>
                </select>
                <button type="button" onClick={() => void loadAdminSupervision()} disabled={busy}>{busy ? "Actualizando…" : "Actualizar"}</button>
              </div>
              <div className="supervision-table-wrap">
                <table className="supervision-table">
                  <thead>
                    <tr>
                      <th>Solicitud</th><th>Emisor</th><th>Publicación</th><th>Vencimiento</th><th>Estado</th><th>Artículos</th><th>Destinatarios</th><th>Cotizaciones</th><th>Adjudicaciones</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisionVisible.map((request) => {
                      const deadline = new Date(request.fecha_limite);
                      const hoursRemaining = (deadline.getTime() - Date.now()) / 3600000;
                      const deadlineClass = hoursRemaining < 0 ? "expired" : hoursRemaining <= 48 ? "soon" : "";
                      return (
                        <tr key={request.id}>
                          <td><b>#{request.codigo}</b><span>{request.titulo}</span></td>
                          <td><b>{request.empresa_compradora}</b><span>{request.email_compradora}</span></td>
                          <td>{new Date(request.creada_en).toLocaleDateString("es-AR")}</td>
                          <td><span className={`deadline ${deadlineClass}`}>{deadline.toLocaleDateString("es-AR")}{deadlineClass === "expired" ? " · Vencida" : deadlineClass === "soon" ? " · Próxima" : ""}</span></td>
                          <td><em className={`state ${request.estado}`}>{request.estado.replaceAll("_", " ")}</em></td>
                          <td>{request.cantidad_articulos}</td>
                          <td>{request.cantidad_destinatarios}</td>
                          <td>{request.cantidad_cotizaciones}</td>
                          <td>{request.cantidad_adjudicaciones}</td>
                          <td><button type="button" onClick={() => { setSelectedSupervisionRequest(request); setAdminQuotes([]); setAdminQuotesOpen(false); setAdminQuotesError(""); }}>Ver detalle</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="supervision-pagination">
                <span>{supervisionFiltered.length} resultados · Página {Math.min(supervisionPage, supervisionPages)} de {supervisionPages}</span>
                <div><button type="button" disabled={supervisionPage <= 1} onClick={() => setSupervisionPage((page) => Math.max(1, page - 1))}>Anterior</button><button type="button" disabled={supervisionPage >= supervisionPages} onClick={() => setSupervisionPage((page) => Math.min(supervisionPages, page + 1))}>Siguiente</button></div>
              </div>
              {!busy && supervisionRequests.length === 0 && (
                <div className="empty"><b>No hay solicitudes para supervisar</b><p>Las solicitudes publicadas aparecerán en esta sección.</p></div>
              )}
            </section>
          )}
          {admin && adminView === "reviews" && (
            <section className="panel-list review-page">
              <div className="panel-title">
                <div>
                  <span>Control de acceso</span>
                  <h2>Verificaciones pendientes</h2>
                </div>
                <em>
                  {
                    reviews.filter((r) =>
                      [
                        "registro_incompleto",
                        "pendiente",
                        "observada",
                      ].includes(r.estado),
                    ).length
                  }{" "}
                  casos
                </em>
              </div>
              {reviews
                .filter((r) =>
                  ["registro_incompleto", "pendiente", "observada"].includes(
                    r.estado,
                  ),
                )
                .map((company) => (
                  <article
                    className="company-card"
                    key={company.id}
                    onClick={() => openCompanyReview(company)}
                  >
                    <div className="row-icon">
                      {companyCapabilityAbbreviation(company)}
                    </div>
                    <div>
                      <b>{company.razon_social}</b>
                      <span>
                        {company.cuit} · {company.localidad}
                      </span>
                    </div>
                    <em className={`state ${company.estado}`}>
                      {company.estado.replaceAll("_", " ")}
                    </em>
                    <button>Revisar →</button>
                  </article>
                ))}
              {!reviews.some((r) =>
                ["registro_incompleto", "pendiente", "observada"].includes(
                  r.estado,
                ),
              ) && (
                <div className="empty">
                  <b>No hay verificaciones pendientes</b>
                  <p>
                    Las nuevas empresas aparecerán automáticamente en esta
                    sección.
                  </p>
                </div>
              )}
            </section>
          )}
          {admin && adminView === "companies" && (
            <section className="panel-list review-page">
              <div className="panel-title">
                <div>
                  <span>Accesos y operación</span>
                  <h2>Administración de empresas</h2>
                </div>
                <div className="company-directory-heading-actions">
                  <em>{reviews.length} registradas</em>
                  <button className="primary small" type="button" onClick={() => void openAdminCompanyCreate()}>
                    Nueva empresa
                  </button>
                </div>
              </div>
              <div className="company-directory-toolbar">
                <input
                  type="search"
                  value={companySearch}
                  onChange={(event) => setCompanySearch(event.target.value)}
                  placeholder="Buscar por empresa, CUIT o correo…"
                />
                <select
                  value={companyOperationalFilter}
                  onChange={(event) => setCompanyOperationalFilter(event.target.value)}
                >
                  <option value="todas">Todos los estados</option>
                  <option value="activa">Activas</option>
                  <option value="pausada">Pausadas</option>
                  <option value="bloqueada">Bloqueadas</option>
                  <option value="archivada">Archivadas</option>
                </select>
              </div>
              {filteredCompanies.map((company) => (
                <article
                  className="company-card"
                  key={company.id}
                  onClick={() => openCompanyReview(company)}
                >
                  <div className="row-icon">
                    {companyCapabilityAbbreviation(company)}
                  </div>
                  <div>
                    <b>{company.razon_social}</b>
                    <span>
                      {companyCapabilityLabel(company)} · {company.email_empresa} · CUIT {company.cuit}
                    </span>
                  </div>
                  <div className="company-statuses">
                    <em className={`state operational ${company.estado_operativo ?? "activa"}`}>
                      {operationalStatusLabel(company.estado_operativo)}
                    </em>
                    <small>{company.estado.replaceAll("_", " ")}</small>
                  </div>
                  <button>Ver →</button>
                </article>
              ))}
              {!filteredCompanies.length && (
                <div className="empty">
                  <b>No encontramos empresas</b>
                  <p>Probá con otra búsqueda o cambiá el filtro de estado.</p>
                </div>
              )}
            </section>
          )}
          {admin && adminView === "categories" && (
            <section className="panel-list">
              <div className="panel-title">
                <div>
                  <span>Distribución automática</span>
                  <h2>Rubros del portal</h2>
                </div>
              </div>
              <div className="empty">
                <b>19 rubros iniciales configurados</b>
                <p>
                  En el próximo bloque agregaremos edición, altas y bajas desde
                  este panel.
                </p>
              </div>
            </section>
          )}
          {admin && adminView === "advertising" && (
            <section className="advertising-admin">
              <div className="ad-admin-heading">
                <div>
                  <span>Monetización</span>
                  <h2>Publicidad</h2>
                  <p>Administrá anunciantes, campañas, piezas y resultados desde un solo lugar.</p>
                </div>
                <button className="secondary" onClick={loadAdvertising} disabled={busy}>
                  Actualizar
                </button>
              </div>

              <div className="ad-kpis">
                <article><small>Anunciantes</small><strong>{advertisers.length}</strong></article>
                <article><small>Campañas activas</small><strong>{adCampaigns.filter((item) => item.estado === "activa").length}</strong></article>
                <article><small>Impresiones</small><strong>{adMetrics.filter((item) => item.tipo === "impresion").length}</strong></article>
                <article><small>Clics</small><strong>{adMetrics.filter((item) => item.tipo === "clic").length}</strong></article>
              </div>

              <div className="ad-admin-grid">
                <form className="ad-form-card" onSubmit={createAdvertiser}>
                  <div><span>Paso 1</span><h3>Nuevo anunciante</h3></div>
                  <label>Nombre comercial<input name="nombre" required /></label>
                  <label>Razón social<input name="razon_social" /></label>
                  <label>Correo<input name="email" type="email" /></label>
                  <label>Sitio web<input name="sitio_web" type="url" placeholder="https://" /></label>
                  <button className="primary" disabled={busy}>Crear anunciante</button>
                </form>

                <form className="ad-form-card" onSubmit={createCampaign}>
                  <div><span>Paso 2</span><h3>Nueva campaña</h3></div>
                  <label>Anunciante<select name="anunciante_id" required defaultValue=""><option value="" disabled>Seleccionar</option>{advertisers.filter((item) => item.activo).map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
                  <label>Nombre de campaña<input name="nombre" required /></label>
                  <div className="ad-form-pair"><label>Inicio<input name="fecha_inicio" type="datetime-local" required /></label><label>Final<input name="fecha_fin" type="datetime-local" required /></label></div>
                  <div className="ad-form-pair"><label>Estado<select name="estado" defaultValue="borrador"><option value="borrador">Borrador</option><option value="programada">Programada</option><option value="activa">Activa</option><option value="pausada">Pausada</option></select></label><label>Prioridad<input name="prioridad" type="number" min="0" max="100" defaultValue="0" /></label></div>
                  <button className="primary" disabled={busy || !advertisers.length}>Crear campaña</button>
                </form>

                <form className="ad-form-card ad-creative-form" onSubmit={createAdvertisement}>
                  <div><span>Paso 3</span><h3>Nueva pieza publicitaria</h3></div>
                  <div className="ad-form-pair"><label>Campaña<select name="campana_id" required defaultValue=""><option value="" disabled>Seleccionar</option>{adCampaigns.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><label>Ubicación<select name="ubicacion_id" required defaultValue=""><option value="" disabled>Seleccionar</option>{adPlacements.map((item) => <option key={item.id} value={item.id}>{item.nombre} ({item.ancho_recomendado}×{item.alto_recomendado})</option>)}</select></label></div>
                  <label>Título<input name="titulo" required /></label>
                  <label>Texto<textarea name="texto" /></label>
                  <div className="ad-form-pair"><label>Enlace de destino<input name="enlace_destino" type="url" placeholder="https://" required /></label><label>Texto del botón<input name="texto_boton" defaultValue="Conocer más" /></label></div>
                  <label>Imagen JPG, PNG o WebP<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setAdImage(event.target.files?.[0] ?? null)} /><small>Máximo 5 MB. Usá las dimensiones sugeridas para la ubicación.</small></label>
                  <button className="primary" disabled={busy || !adCampaigns.length}>Crear anuncio</button>
                </form>
              </div>

              <section className="ad-advertiser-list">
                <div className="panel-title"><div><span>Clientes comerciales</span><h2>Anunciantes</h2></div><em>{advertisers.length} registrados</em></div>
                {advertisers.map((advertiser) => (
                  <article key={advertiser.id}>
                    <div><b>{advertiser.nombre}</b><span>{advertiser.email || "Sin correo"} · {advertiser.activo ? "Activo" : "Inactivo"}</span></div>
                    <button className="secondary" onClick={() => setEditingAdvertiser(advertiser)}>Editar</button>
                  </article>
                ))}
              </section>

              <section className="ad-campaign-list">
                <div className="panel-title"><div><span>Control comercial</span><h2>Campañas</h2></div><em>{adCampaigns.length} registradas</em></div>
                {adCampaigns.length ? adCampaigns.map((campaign) => (
                  <article key={campaign.id}>
                    <div><b>{campaign.nombre}</b><span>{campaign.anunciantes?.nombre || "Anunciante"} · {new Date(campaign.fecha_inicio).toLocaleDateString("es-AR")}–{new Date(campaign.fecha_fin).toLocaleDateString("es-AR")}</span></div>
                    <em className={`state ${campaign.estado}`}>{campaign.estado}</em>
                    <select value={campaign.estado} onChange={(event) => setCampaignState(campaign.id, event.target.value)} disabled={busy}><option value="borrador">Borrador</option><option value="programada">Programada</option><option value="activa">Activa</option><option value="pausada">Pausada</option><option value="finalizada">Finalizada</option><option value="cancelada">Cancelada</option></select>
                  </article>
                )) : <div className="empty"><b>Todavía no hay campañas</b><p>Creá primero un anunciante y luego su primera campaña.</p></div>}
              </section>

              {adCreatives.length > 0 && (
                <section className="ad-creative-list">
                  <div className="panel-title"><div><span>Inventario</span><h2>Piezas publicitarias</h2></div><em>{adCreatives.length} anuncios</em></div>
                  <div>{adCreatives.map((creative) => {
                    const publicUrl = supabase.storage.from("publicidad").getPublicUrl(creative.imagen_path).data.publicUrl;
                    const impressions = adMetrics.filter((item) => item.anuncio_id === creative.id && item.tipo === "impresion").length;
                    const clicks = adMetrics.filter((item) => item.anuncio_id === creative.id && item.tipo === "clic").length;
                    return <article className={!creative.activo ? "is-paused" : ""} key={creative.id}><img src={publicUrl} alt="" /><div><small>{creative.ubicaciones_publicidad?.nombre} · {creative.activo ? "Activo" : "Pausado"}</small><b>{creative.titulo}</b><span>{impressions} impresiones · {clicks} clics</span></div><div className="ad-row-actions"><a href={creative.enlace_destino} target="_blank" rel="noreferrer">Abrir</a><button className="secondary" onClick={() => { setEditingAd(creative); setReplacementAdImage(null); }}>Editar</button><button className="secondary" onClick={() => toggleAdvertisement(creative)} disabled={busy}>{creative.activo ? "Pausar" : "Activar"}</button><button className="danger" onClick={() => deleteAdvertisement(creative)} disabled={busy}>Eliminar</button></div></article>;
                  })}</div>
                </section>
              )}
            </section>
          )}
          {!admin && !buyer && providerView === "categories" && (
            <section className="panel-list categories-page">
              <div className="panel-title">
                <div>
                  <span>Perfil comercial</span>
                  <h2>
                    Rubros de{" "}
                    {account.empresas?.nombre_comercial ||
                      account.empresas?.razon_social}
                  </h2>
                </div>
                <em>{providerSelectedCategories.length} seleccionados</em>
              </div>
              <p className="categories-help">
                Elegí únicamente las categorías que la empresa puede cotizar.
                Miconect utilizará esta información para mostrar pedidos
                relevantes.
              </p>
              <div className="categories-grid">
                {categories.map((category) => (
                  <label
                    className={`category-option ${providerSelectedCategories.includes(category.id) ? "selected" : ""}`}
                    key={category.id}
                  >
                    <input
                      type="checkbox"
                      checked={providerSelectedCategories.includes(category.id)}
                      onChange={() => toggleProviderCategory(category.id)}
                    />
                    <span>{category.nombre}</span>
                    <b>
                      {providerSelectedCategories.includes(category.id) ? "✓" : "+"}
                    </b>
                  </label>
                ))}
              </div>
              <div className="categories-footer">
                <span>
                  Podés actualizar esta selección cuando cambie la oferta de la
                  empresa.
                </span>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={saveProviderCategories}
                >
                  {busy ? "Guardando…" : "Guardar rubros"}
                </button>
              </div>
            </section>
          )}
          {teamView && (
            <section className="panel-list team-page">
              <div className="panel-title">
                <div>
                  <span>Accesos empresariales</span>
                  <h2>Integrantes de la empresa</h2>
                </div>
                <em>
                  {teamMembers.length}{" "}
                  {teamMembers.length === 1 ? "integrante" : "integrantes"}
                </em>
              </div>

              {account.rol === "administrador_empresa" && (
                <form
                  className="team-invite-form"
                  onSubmit={createTeamInvitation}
                >
                  <div>
                    <b>Invitar integrante</b>
                    <small>
                      El enlace será válido durante siete días y solo funcionará
                      con el correo indicado.
                    </small>
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="correo@empresa.com"
                  />
                  <select name="rol" defaultValue="miembro">
                    <option value="miembro">Miembro</option>
                    <option value="administrador_empresa">Administrador</option>
                  </select>
                  <button className="primary" disabled={busy}>
                    {busy ? "Creando…" : "Crear invitación"}
                  </button>
                </form>
              )}

              {invitationLink && (
                <div className="invitation-link-box">
                  <div>
                    <b>Enlace listo para compartir</b>
                    <small>{invitationLink}</small>
                  </div>
                  <button
                    className="secondary"
                    onClick={async () => {
                      await navigator.clipboard.writeText(invitationLink);
                      setMessage("Enlace copiado.");
                    }}
                  >
                    Copiar enlace
                  </button>
                </div>
              )}

              <div className="team-list">
                {teamMembers.map((member) => (
                  <article key={member.id}>
                    <span className="team-avatar">
                      {member.nombre[0]}
                      {member.apellido[0]}
                    </span>
                    <div>
                      <b>
                        {member.nombre} {member.apellido}
                      </b>
                      <small>
                        {member.id === account.id
                          ? "Tu usuario"
                          : "Usuario de la empresa"}
                      </small>
                    </div>
                    <em>
                      {member.rol === "administrador_empresa"
                        ? "Administrador"
                        : "Miembro"}
                    </em>
                    {account.rol === "administrador_empresa" &&
                      member.id !== account.id && (
                        <div className="team-actions">
                          <select
                            value={member.rol}
                            onChange={(event) =>
                              manageTeamMember(
                                member.id,
                                "cambiar_rol",
                                event.target.value as
                                  "miembro" | "administrador_empresa",
                              )
                            }
                            disabled={busy}
                          >
                            <option value="miembro">Miembro</option>
                            <option value="administrador_empresa">
                              Administrador
                            </option>
                          </select>
                          <button
                            className="danger-outline"
                            onClick={() =>
                              manageTeamMember(member.id, "retirar")
                            }
                            disabled={busy}
                          >
                            Retirar
                          </button>
                        </div>
                      )}
                  </article>
                ))}
              </div>

              {account.rol === "administrador_empresa" &&
                teamInvitations.some(
                  (invitation) =>
                    !invitation.usada_en &&
                    new Date(invitation.vence_en) > new Date(),
                ) && (
                  <div className="pending-invitations">
                    <b>Invitaciones pendientes</b>
                    {teamInvitations
                      .filter(
                        (invitation) =>
                          !invitation.usada_en &&
                          new Date(invitation.vence_en) > new Date(),
                      )
                      .map((invitation) => (
                        <div key={invitation.id}>
                          <span>
                            <b>{invitation.email}</b>
                            <small>
                              {invitation.rol === "administrador_empresa"
                                ? "Administrador"
                                : "Miembro"}{" "}
                              · vence{" "}
                              {new Date(invitation.vence_en).toLocaleDateString(
                                "es-AR",
                              )}
                            </small>
                          </span>
                          <button
                            className="secondary"
                            onClick={async () => {
                              const link = `${window.location.origin}${window.location.pathname}?invite=${invitation.token}`;
                              await navigator.clipboard.writeText(link);
                              setMessage("Enlace de invitación copiado.");
                            }}
                          >
                            Copiar enlace
                          </button>
                        </div>
                      ))}
                  </div>
                )}
            </section>
          )}
          {profileView && (
            <section className="profile-page">
              <div className="profile-grid">
                <form className="profile-card" onSubmit={savePersonalProfile}>
                  <div className="profile-card-heading">
                    <span>Datos personales</span>
                    <h2>Tu cuenta</h2>
                    <p>
                      Estos datos identifican tus acciones dentro de la empresa.
                    </p>
                  </div>
                  <label>
                    Nombre
                    <input
                      value={profileForm.nombre}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          nombre: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Apellido
                    <input
                      value={profileForm.apellido}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          apellido: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Cargo
                    <input
                      value={profileForm.cargo}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          cargo: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Correo de acceso
                    <input value={profileForm.email} disabled />
                    <small>
                      El correo de acceso no se modifica desde esta sección.
                    </small>
                  </label>
                  <button className="primary" disabled={busy}>
                    {busy ? "Guardando…" : "Guardar datos personales"}
                  </button>
                </form>

                <form className="profile-card" onSubmit={changePassword}>
                  <div className="profile-card-heading">
                    <span>Seguridad</span>
                    <h2>Cambiar contraseña</h2>
                    <p>
                      Utilizá una contraseña nueva de al menos ocho caracteres.
                    </p>
                  </div>
                  <label>
                    Nueva contraseña
                    <PasswordInput
                      name="password"
                      autoComplete="new-password"
                    />
                  </label>
                  <label>
                    Repetir contraseña
                    <PasswordInput
                      name="confirmation"
                      autoComplete="new-password"
                    />
                  </label>
                  <button className="secondary" disabled={busy}>
                    Actualizar contraseña
                  </button>
                </form>
              </div>

              <form
                className="profile-card company-profile-card"
                onSubmit={saveCompanyProfile}
              >
                <div className="profile-card-heading">
                  <span>Datos empresariales</span>
                  <h2>{companyForm.razonSocial}</h2>
                  <p>
                    Estos son los datos de contacto que visualizan las otras
                    empresas en solicitudes y cotizaciones.
                  </p>
                </div>
                <div className="profile-company-grid">
                  <label>
                    Razón social
                    <input value={companyForm.razonSocial} disabled />
                  </label>
                  <label>
                    Nombre comercial
                    <input
                      value={companyForm.nombreComercial}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          nombreComercial: event.target.value,
                        }))
                      }
                      disabled={account.rol !== "administrador_empresa"}
                    />
                  </label>
                  <label>
                    Correo empresarial
                    <input
                      type="email"
                      value={companyForm.email}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      required
                      disabled={account.rol !== "administrador_empresa"}
                    />
                  </label>
                  <label>
                    Domicilio
                    <input
                      value={companyForm.domicilio}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          domicilio: event.target.value,
                        }))
                      }
                      disabled={account.rol !== "administrador_empresa"}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      type="tel"
                      value={companyForm.telefono}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          telefono: event.target.value,
                        }))
                      }
                      disabled={account.rol !== "administrador_empresa"}
                    />
                  </label>
                  <label>
                    WhatsApp comercial
                    <input
                      type="tel"
                      value={companyForm.whatsapp}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          whatsapp: event.target.value,
                        }))
                      }
                      disabled={account.rol !== "administrador_empresa"}
                    />
                  </label>
                  <label className="wide">
                    Sitio web
                    <input
                      type="url"
                      value={companyForm.sitioWeb}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          sitioWeb: event.target.value,
                        }))
                      }
                      placeholder="https://"
                      disabled={account.rol !== "administrador_empresa"}
                    />
                  </label>
                </div>
                {account.rol === "administrador_empresa" ? (
                  <button className="primary" disabled={busy}>
                    {busy ? "Guardando…" : "Guardar datos empresariales"}
                  </button>
                ) : (
                  <small className="profile-readonly-note">
                    Solo un administrador puede modificar la información de la
                    empresa.
                  </small>
                )}
              </form>
            </section>
          )}
          {liveNotification && !admin && (
            <div
              className="live-notification-toast"
              role="status"
              aria-live="assertive"
            >
              <span className="live-notification-dot" aria-hidden="true" />
              <div>
                <small>Nuevo aviso</small>
                <b>{liveNotification.titulo}</b>
                <p>{liveNotification.mensaje}</p>
              </div>
              <div className="live-notification-actions">
                <button
                  type="button"
                  className="primary small"
                  onClick={() => void markNotificationRead(liveNotification)}
                >
                  Ver ahora
                </button>
                <button
                  type="button"
                  className="toast-close"
                  onClick={() => setLiveNotification(null)}
                  aria-label="Cerrar aviso"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {message && <p className="notice dashboard-notice">{message}</p>}
        </div>
        {editingAdvertiser && (
          <div className="modal-backdrop" onClick={() => setEditingAdvertiser(null)}>
            <form className="review-modal ad-edit-modal" onSubmit={saveAdvertiser} onClick={(event) => event.stopPropagation()}>
              <button type="button" className="modal-close" onClick={() => setEditingAdvertiser(null)}>×</button>
              <span className="modal-kicker">Gestión comercial</span><h2>Editar anunciante</h2>
              <label>Nombre comercial<input name="nombre" required defaultValue={editingAdvertiser.nombre} /></label>
              <label>Razón social<input name="razon_social" defaultValue={editingAdvertiser.razon_social || ""} /></label>
              <label>Correo<input name="email" type="email" defaultValue={editingAdvertiser.email || ""} /></label>
              <label>Sitio web<input name="sitio_web" type="url" defaultValue={editingAdvertiser.sitio_web || ""} /></label>
              <label className="ad-check"><input name="activo" type="checkbox" defaultChecked={editingAdvertiser.activo} /> Anunciante activo</label>
              <button className="primary" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
            </form>
          </div>
        )}
        {editingAd && (
          <div className="modal-backdrop" onClick={() => setEditingAd(null)}>
            <form className="review-modal ad-edit-modal" onSubmit={saveAdvertisement} onClick={(event) => event.stopPropagation()}>
              <button type="button" className="modal-close" onClick={() => setEditingAd(null)}>×</button>
              <span className="modal-kicker">Inventario publicitario</span><h2>Editar anuncio</h2>
              <div className="ad-form-pair"><label>Campaña<select name="campana_id" required defaultValue={editingAd.campana_id}>{adCampaigns.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label><label>Ubicación<select name="ubicacion_id" required defaultValue={editingAd.ubicacion_id}>{adPlacements.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label></div>
              <label>Título<input name="titulo" required defaultValue={editingAd.titulo} /></label>
              <label>Texto<textarea name="texto" defaultValue={editingAd.texto || ""} /></label>
              <div className="ad-form-pair"><label>Enlace de destino<input name="enlace_destino" type="url" required defaultValue={editingAd.enlace_destino} /></label><label>Texto del botón<input name="texto_boton" defaultValue={editingAd.texto_boton || "Conocer más"} /></label></div>
              <label>Reemplazar imagen (opcional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setReplacementAdImage(event.target.files?.[0] ?? null)} /><small>Si no elegís una imagen, se conserva la actual.</small></label>
              <button className="primary" disabled={busy}>{busy ? "Guardando…" : "Guardar cambios"}</button>
            </form>
          </div>
        )}
        {selectedSupervisionRequest && (
          <div className="modal-backdrop" onClick={() => { setSelectedSupervisionRequest(null); setAdminQuotesOpen(false); }}>
            <section className="review-modal supervision-modal" onClick={(event) => event.stopPropagation()}>
              <button className="modal-close" onClick={() => { setSelectedSupervisionRequest(null); setAdminQuotesOpen(false); }}>×</button>
              <span className="modal-kicker">Supervisión en modo lectura</span>
              <h2>Solicitud #{selectedSupervisionRequest.codigo}</h2>
              <p className="modal-description">{selectedSupervisionRequest.titulo}</p>
              <div className="review-data">
                <div><span>Empresa emisora</span><b>{selectedSupervisionRequest.empresa_compradora}</b></div>
                <div><span>Correo</span><b>{selectedSupervisionRequest.email_compradora}</b></div>
                <div><span>Estado</span><b>{selectedSupervisionRequest.estado.replaceAll("_", " ")}</b></div>
                <div><span>Fecha límite</span><b>{new Date(selectedSupervisionRequest.fecha_limite).toLocaleString("es-AR")}</b></div>
                <div><span>Proyecto</span><b>{selectedSupervisionRequest.proyecto || "Sin informar"}</b></div>
                <div><span>Publicada</span><b>{new Date(selectedSupervisionRequest.creada_en).toLocaleString("es-AR")}</b></div>
              </div>
              {selectedSupervisionRequest.descripcion && <p className="supervision-description">{selectedSupervisionRequest.descripcion}</p>}
              <div className="supervision-detail-block">
                <h3>Artículos solicitados</h3>
                {selectedSupervisionRequest.articulos.map((item) => (
                  <div className="supervision-detail-row" key={`${item.renglon}-${item.articulo}`}>
                    <b>{item.renglon}. {item.articulo}</b>
                    <span>{item.cantidad} {item.unidad}{item.especificacion ? ` · ${item.especificacion}` : ""}</span>
                  </div>
                ))}
              </div>
              <div className="supervision-detail-block">
                <h3>Empresas destinatarias</h3>
                {selectedSupervisionRequest.destinatarios.length ? selectedSupervisionRequest.destinatarios.map((recipient) => (
                  <div className="supervision-detail-row" key={recipient.empresa_id}><b>{recipient.empresa}</b><span>Notificación enviada</span></div>
                )) : <p>No se registraron empresas destinatarias.</p>}
              </div>
              <div className="supervision-detail-block">
                <h3>Adjuntos técnicos</h3>
                {selectedSupervisionRequest.adjuntos?.length ? selectedSupervisionRequest.adjuntos.map((attachment) => (
                  <div className="supervision-detail-row" key={attachment.id}>
                    <div><b>{attachment.nombre_archivo}</b><span>{attachment.tipo_mime || "Archivo"}{attachment.tamano_bytes ? ` · ${(attachment.tamano_bytes / 1024 / 1024).toFixed(2)} MB` : ""}</span></div>
                    <button type="button" onClick={() => void openAdminFile("adjunto_solicitud", selectedSupervisionRequest.id, attachment.id)} disabled={openingAdminFile === attachment.id}>
                      {openingAdminFile === attachment.id ? "Generando enlace…" : "Abrir archivo"}
                    </button>
                  </div>
                )) : <p>La solicitud no contiene adjuntos técnicos.</p>}
              </div>
              <div className="supervision-detail-block admin-quotes-block">
                <div className="admin-quotes-heading">
                  <div><h3>Cotizaciones recibidas</h3><p>{selectedSupervisionRequest.cantidad_cotizaciones} ofertas registradas</p></div>
                  {selectedSupervisionRequest.cantidad_cotizaciones > 0 && !adminQuotesOpen && (
                    <button type="button" onClick={() => void loadAdminQuotes(selectedSupervisionRequest.id)} disabled={loadingAdminQuotes}>
                      {loadingAdminQuotes ? "Comprobando apertura…" : "Ver cotizaciones"}
                    </button>
                  )}
                </div>
                {selectedSupervisionRequest.cantidad_cotizaciones === 0 && <p>No se recibieron cotizaciones para esta solicitud.</p>}
                {adminQuotesError && <div className="protected-quotes">{adminQuotesError}</div>}
                {adminQuotesOpen && adminQuotes.map((quote) => {
                  const total = quote.items.reduce((sum, item) => sum + Number(item.cantidad_ofertada) * Number(item.precio_unitario) * (quote.impuestos_incluidos ? 1 : 1 + Number(item.alicuota_iva || 0) / 100), 0);
                  return (
                    <article className="admin-quote-card" key={quote.id}>
                      <div className="admin-quote-summary">
                        <div><span>Proveedor</span><b>{quote.proveedor}</b><small>{quote.email_proveedor}</small></div>
                        <div><span>Total estimado</span><b>{quote.moneda} {total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</b><small>{quote.impuestos_incluidos ? "Impuestos incluidos" : "Más impuestos informados"}</small></div>
                        <div><span>Presentada</span><b>{quote.presentada_en ? new Date(quote.presentada_en).toLocaleString("es-AR") : "Sin fecha"}</b></div>
                      </div>
                      <div className="admin-quote-conditions">
                        <div><span>Condiciones de pago</span><b>{quote.condiciones_pago || "Sin especificar"}</b></div>
                        <div><span>Plazo de entrega</span><b>{quote.plazo_entrega || "Sin especificar"}</b></div>
                      </div>
                      {quote.observaciones && <p className="supervision-description">{quote.observaciones}</p>}
                      <div className="admin-quote-items">
                        {quote.items.map((item) => (
                          <div className="admin-quote-item" key={item.id}>
                            <div><b>{item.articulo}</b><span>{item.cantidad_ofertada} {item.unidad} · {item.marca || "Sin marca"}</span></div>
                            <div><b>{quote.moneda} {Number(item.precio_unitario).toLocaleString("es-AR")}</b><span>por {item.unidad}</span></div>
                            <em className={item.adjudicada ? "awarded" : ""}>{item.adjudicada ? "Adjudicada" : "No adjudicada"}</em>
                          </div>
                        ))}
                      </div>
                      {quote.pdf_path && (
                        <div className="pdf-access-row">
                          <span>PDF original presentado por el proveedor</span>
                          <button type="button" onClick={() => void openAdminFile("cotizacion", selectedSupervisionRequest.id, quote.id)} disabled={openingAdminFile === quote.id}>
                            {openingAdminFile === quote.id ? "Generando enlace…" : "Abrir PDF"}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
              <div className="supervision-readonly-note">Vista administrativa de auditoría. No permite modificar la solicitud ni intervenir en la adjudicación.</div>
            </section>
          </div>
        )}
        {selectedCompany && (
          <div
            className="modal-backdrop"
            onClick={() => setSelectedCompany(null)}
          >
            <section
              className="review-modal company-admin-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedCompany(null)}
              >
                ×
              </button>
              <span className="modal-kicker">Ficha de verificación</span>
              <h2>{selectedCompany.razon_social}</h2>
              <div className="company-data">
                <div>
                  <small>Actividades</small>
                  <b>{companyCapabilityLabel(selectedCompany)}</b>
                </div>
                <div>
                  <small>CUIT</small>
                  <b>{selectedCompany.cuit}</b>
                </div>
                <div>
                  <small>Localidad</small>
                  <b>{selectedCompany.localidad}</b>
                </div>
                <div>
                  <small>Correo</small>
                  <b>{selectedCompany.email_empresa}</b>
                </div>
                <div>
                  <small>Domicilio</small>
                  <b>{selectedCompany.domicilio || "Sin informar"}</b>
                </div>
                <div>
                  <small>Teléfono</small>
                  <b>{selectedCompany.telefono || "Sin informar"}</b>
                </div>
                <div>
                  <small>Estado operativo</small>
                  <b>{operationalStatusLabel(selectedCompany.estado_operativo)}</b>
                </div>
              </div>
              {admin && (
                <div className="admin-company-access">
                  <div className="admin-company-access-heading">
                    <div>
                      <span>Administración de acceso</span>
                      <h3>Usuarios, correos y estado de la cuenta</h3>
                    </div>
                    <em className={`state operational ${selectedCompany.estado_operativo ?? "activa"}`}>
                      {operationalStatusLabel(selectedCompany.estado_operativo)}
                    </em>
                  </div>
                  <div className="admin-company-activity">
                    <div><small>Solicitudes</small><b>{companyActivity.solicitudes}</b></div>
                    <div><small>Cotizaciones</small><b>{companyActivity.cotizaciones}</b></div>
                    <div><small>Adjudicaciones</small><b>{companyActivity.adjudicaciones}</b></div>
                  </div>
                  <div className="admin-user-list">
                    {companyUsers.map((user) => (
                      <article className="admin-user-row" key={user.id}>
                        <div>
                          <b>{user.nombre} {user.apellido}</b>
                          <span>{user.email || "Correo no disponible"} · {user.rol.replaceAll("_", " ")}</span>
                          <small>
                            {user.email_confirmado ? "Correo confirmado" : "Correo pendiente de confirmación"}
                            {user.bloqueado_hasta ? " · Acceso bloqueado" : ""}
                          </small>
                        </div>
                        <div>
                          {!user.email_confirmado && user.email && (
                            <button
                              type="button"
                              className="secondary small"
                              disabled={busy}
                              onClick={() => void runAdminCompanyAction("reenviar_acceso", user.email)}
                            >
                              Reenviar acceso
                            </button>
                          )}
                          {user.email && (
                            <button
                              type="button"
                              className="secondary small"
                              disabled={busy}
                              onClick={() => void runAdminCompanyAction("restablecer_password", user.email)}
                            >
                              Restablecer contraseña
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {!companyUsers.length && <p>No hay usuarios vinculados a esta empresa.</p>}
                  </div>
                  <div className="admin-company-actions">
                    {selectedCompany.estado_operativo === "bloqueada" ? (
                      <button type="button" className="approve" disabled={busy} onClick={() => void runAdminCompanyAction("desbloquear")}>Desbloquear empresa</button>
                    ) : selectedCompany.estado_operativo === "pausada" || selectedCompany.estado_operativo === "archivada" ? (
                      <button type="button" className="approve" disabled={busy} onClick={() => void runAdminCompanyAction("reactivar")}>Reactivar empresa</button>
                    ) : (
                      <>
                        <button type="button" className="observe" disabled={busy} onClick={() => setAdminCompanyAction("pausar")}>Pausar</button>
                        <button type="button" className="reject" disabled={busy} onClick={() => setAdminCompanyAction("bloquear")}>Bloquear correos y accesos</button>
                        <button type="button" className="secondary" disabled={busy} onClick={() => setAdminCompanyAction("archivar")}>Archivar</button>
                      </>
                    )}
                  </div>
                  {adminCompanyAction && (
                    <div className="admin-company-confirmation">
                      <label>
                        Motivo {adminCompanyAction === "bloquear" ? "obligatorio" : "opcional"}
                        <textarea
                          value={adminCompanyReason}
                          onChange={(event) => setAdminCompanyReason(event.target.value)}
                          placeholder="Dejá constancia administrativa de la decisión"
                        />
                      </label>
                      <div>
                        <button type="button" className="secondary" onClick={() => setAdminCompanyAction("")}>Cancelar</button>
                        <button type="button" className={adminCompanyAction === "bloquear" ? "reject" : "observe"} disabled={busy} onClick={() => void runAdminCompanyAction(adminCompanyAction)}>Confirmar</button>
                      </div>
                    </div>
                  )}
                  <div className="admin-danger-zone">
                    <div>
                      <b>Eliminar registro incompleto</b>
                      <p>
                        {companyCanDelete
                          ? "Borra la empresa y sus usuarios para liberar el correo y permitir un registro nuevo."
                          : "No disponible: esta empresa tiene actividad comercial. Podés pausarla, bloquearla o archivarla."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="reject"
                      disabled={busy || !companyCanDelete}
                      onClick={() => void runAdminCompanyAction("eliminar_incompleta")}
                    >
                      Eliminar definitivamente
                    </button>
                  </div>
                </div>
              )}
              <div className="review-capabilities-box">
                <div>
                  <b>Actividades habilitadas</b>
                  <p>
                    Una empresa puede operar en compras, ventas o en ambos
                    espacios con una sola verificación.
                  </p>
                </div>
                <div className="capability-options compact">
                  <label className={reviewCanBuy ? "selected" : ""}>
                    <input
                      type="checkbox"
                      checked={reviewCanBuy}
                      onChange={(event) => setReviewCanBuy(event.target.checked)}
                    />
                    <span><b>Compras</b><small>Publicar solicitudes y adjudicar ofertas</small></span>
                  </label>
                  <label className={reviewCanSell ? "selected" : ""}>
                    <input
                      type="checkbox"
                      checked={reviewCanSell}
                      onChange={(event) => setReviewCanSell(event.target.checked)}
                    />
                    <span><b>Ventas</b><small>Recibir pedidos y presentar cotizaciones</small></span>
                  </label>
                </div>
              </div>
              <div className="documents-box">
                <b>Documentación empresarial</b>
                {companyDocuments.length ? (
                  companyDocuments.map((document) => (
                    <button
                      className="document-row"
                      key={document.id}
                      onClick={() => openCompanyDocument(document)}
                    >
                      <span>Constancia de CUIT</span>
                      <em>{document.estado}</em>
                      <b>Abrir documento →</b>
                    </button>
                  ))
                ) : (
                  <p>La empresa todavía no cargó documentación.</p>
                )}
              </div>
              {reviewCanSell && (
                <div className="review-categories-box">
                  <div>
                    <b>Rubros del proveedor</b>
                    <p>
                      Definen qué solicitudes puede recibir. Debe tener al
                      menos uno antes de ser aprobado.
                    </p>
                  </div>
                  <div className="categories-grid compact">
                    {categories.map((category) => {
                      const selected = reviewSelectedCategories.includes(
                        category.id,
                      );
                      return (
                        <label
                          className={`category-option ${selected ? "selected" : ""}`}
                          key={category.id}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setReviewSelectedCategories((current) =>
                                current.includes(category.id)
                                  ? current.filter((id) => id !== category.id)
                                  : [...current, category.id],
                              )
                            }
                          />
                          <span>{category.nombre}</span>
                          <b>{selected ? "✓" : "+"}</b>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    className="secondary small"
                    type="button"
                    onClick={saveReviewedCompanyCategories}
                    disabled={busy || !reviewSelectedCategories.length}
                  >
                    Guardar rubros
                  </button>
                </div>
              )}
              <label>
                Observación o motivo
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Obligatorio para observar o rechazar"
                />
              </label>
              <div className="review-actions">
                <button
                  className="approve"
                  disabled={busy || !companyDocuments.length}
                  onClick={() => reviewCompany("verificada")}
                >
                  {selectedCompany.estado === "verificada"
                    ? "Guardar configuración"
                    : "Aprobar empresa"}
                </button>
                <button
                  className="observe"
                  disabled={busy}
                  onClick={() => reviewCompany("observada")}
                >
                  Observar
                </button>
                <button
                  className="reject"
                  disabled={busy}
                  onClick={() => reviewCompany("rechazada")}
                >
                  Rechazar
                </button>
              </div>
            </section>
          </div>
        )}
        {adminCompanyCreateOpen && (
          <div className="modal-backdrop" onClick={() => setAdminCompanyCreateOpen(false)}>
            <form
              className="review-modal company-admin-modal admin-create-modal"
              onSubmit={createCompanyByAdmin}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="modal-close" type="button" onClick={() => setAdminCompanyCreateOpen(false)}>×</button>
              <span className="modal-kicker">Alta asistida por administrador</span>
              <h2>Nueva empresa</h2>
              <p className="modal-description">
                Creá la empresa y su responsable. Miconect enviará un correo seguro para activar el acceso; el administrador no define ni conoce la contraseña.
              </p>
              <div className="admin-create-grid">
                <label>Razón social<input name="razon_social" required /></label>
                <label>Nombre comercial<input name="nombre_comercial" /></label>
                <label>CUIT<input name="cuit" inputMode="numeric" required /></label>
                <label>Localidad<input name="localidad" required /></label>
                <label>Domicilio<input name="domicilio" /></label>
                <label>Teléfono<input name="telefono" /></label>
                <label>WhatsApp<input name="whatsapp" /></label>
                <label>Sitio web<input name="sitio_web" type="url" placeholder="https://" /></label>
              </div>
              <div className="review-capabilities-box">
                <div><b>Actividades</b><p>Podés habilitar compras, ventas o ambas desde el inicio.</p></div>
                <div className="capability-options compact">
                  <label className={adminCreateCanBuy ? "selected" : ""}>
                    <input type="checkbox" checked={adminCreateCanBuy} onChange={(event) => setAdminCreateCanBuy(event.target.checked)} />
                    <span><b>Compras</b><small>Solicitar y adjudicar</small></span>
                  </label>
                  <label className={adminCreateCanSell ? "selected" : ""}>
                    <input type="checkbox" checked={adminCreateCanSell} onChange={(event) => setAdminCreateCanSell(event.target.checked)} />
                    <span><b>Ventas</b><small>Cotizar solicitudes</small></span>
                  </label>
                </div>
              </div>
              {adminCreateCanSell && (
                <div className="review-categories-box">
                  <div><b>Rubros del proveedor</b><p>Seleccioná en qué categorías recibirá pedidos.</p></div>
                  <div className="categories-grid compact">
                    {categories.map((category) => {
                      const selected = adminCreateCategories.includes(category.id);
                      return (
                        <label className={`category-option ${selected ? "selected" : ""}`} key={category.id}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => setAdminCreateCategories((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])}
                          />
                          <span>{category.nombre}</span><b>{selected ? "✓" : "+"}</b>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="admin-create-divider"><span>Responsable de la cuenta</span></div>
              <div className="admin-create-grid">
                <label>Nombre<input name="nombre" required /></label>
                <label>Apellido<input name="apellido" required /></label>
                <label>Cargo<input name="cargo" required /></label>
                <label>Correo de acceso<input name="email" type="email" required /></label>
              </div>
              <div className="review-actions">
                <button type="button" className="secondary" onClick={() => setAdminCompanyCreateOpen(false)}>Cancelar</button>
                <button className="approve" disabled={busy}>{busy ? "Creando…" : "Crear empresa y enviar acceso"}</button>
              </div>
            </form>
          </div>
        )}
        {verificationOpen && (
          <div
            className="modal-backdrop"
            onClick={() => setVerificationOpen(false)}
          >
            <section
              className="review-modal verification-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setVerificationOpen(false)}
              >
                ×
              </button>
              <span className="modal-kicker">Habilitación empresarial</span>
              <h2>Completar verificación</h2>
              <p className="modal-description">
                Cargá la constancia de inscripción de ARCA donde pueda
                verificarse la razón social y el CUIT informado.
              </p>
              <form onSubmit={submitVerification}>
                <label>
                  Constancia de CUIT
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    required
                    onChange={(event) =>
                      setVerificationFile(event.target.files?.[0] ?? null)
                    }
                  />
                  <small>PDF, JPG, PNG o WEBP. Máximo 10 MB.</small>
                </label>
                {verificationFile && (
                  <div className="selected-file">
                    <b>{verificationFile.name}</b>
                    <span>
                      {(verificationFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
                <button
                  className="primary full"
                  disabled={busy || !verificationFile}
                >
                  {busy ? "Enviando…" : "Enviar a verificación"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main>
      <nav className="nav">
        <button
          className="brand"
          onClick={() => setView("home")}
          aria-label="Inicio Miconect"
        >
          <img className="brand-symbol" src="/miconect-symbol.png" alt="" />
          <img className="brand-wordmark" src="/miconect-wordmark.png" alt="Miconect" />
        </button>
        <div className="nav-actions">
          <button className="text-button" onClick={() => setView("login")}>
            Ingresar
          </button>
          <button className="primary small" onClick={() => setView("register")}>
            Registrar empresa
          </button>
        </div>
      </nav>

      {view === "home" && (
        <>
          {pendingConfirmationEmail && (
            <section className="registration-confirmation" aria-live="polite">
              <div>
                <span>Registro iniciado</span>
                <h2>Confirmá tu correo para completar la empresa</h2>
                <p>{confirmationMessage}</p>
              </div>
              <div className="registration-confirmation-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={resendRegistrationConfirmation}
                >
                  {busy ? "Reenviando…" : "Reenviar correo"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setLoginEmail(pendingConfirmationEmail);
                    setMessage("");
                    setView("login");
                  }}
                >
                  Ir a ingresar
                </button>
              </div>
            </section>
          )}
          <section className="hero">
            <div className="eyebrow">PLATAFORMA EMPRESARIAL · SAN JUAN</div>
            <h1>
              Compraventa minera
              <br />
              de San Juan
            </h1>
            <p>
              Solicitudes claras, proveedores verificados y cotizaciones
              trazables en un solo lugar.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={() => setView("register")}>
                Quiero participar <span>→</span>
              </button>
              <button className="secondary" onClick={() => setView("login")}>
                Ya tengo una cuenta
              </button>
            </div>
            <div className="trust-row">
              <span>Empresas verificadas</span>
              <i />
              <span>Cotizaciones privadas</span>
              <i />
              <span>Operación local</span>
            </div>
          </section>
          {publicAd && (
            <section className="public-ad-shell">
              <article className="sponsored-banner public-sponsored-banner">
                <img src={supabase.storage.from("publicidad").getPublicUrl(publicAd.imagen_path).data.publicUrl} alt="" />
                <div><small>{publicAd.etiqueta || "Publicidad"}</small><h2>{publicAd.titulo}</h2>{publicAd.texto && <p>{publicAd.texto}</p>}</div>
                <a href={publicAd.enlace_destino} target="_blank" rel="noopener noreferrer sponsored" onClick={() => registerAdEvent(publicAd.id, "clic")}>{publicAd.texto_boton || "Conocer más"}</a>
              </article>
            </section>
          )}
          <section className="steps">
            <article>
              <b>01</b>
              <h2>Publicá</h2>
              <p>
                Creá una solicitud con productos, cantidades, archivos y fecha
                límite.
              </p>
            </article>
            <article>
              <b>02</b>
              <h2>Cotizá</h2>
              <p>
                Los proveedores del rubro reciben el pedido y presentan su
                oferta.
              </p>
            </article>
            <article>
              <b>03</b>
              <h2>Adjudicá</h2>
              <p>
                Compará propuestas y elegí por pedido completo o por cada ítem.
              </p>
            </article>
          </section>
        </>
      )}

      {view === "invite" && (
        <section className="form-shell narrow invite-join-page">
          <div className="form-heading">
            <span>Invitación empresarial</span>
            <h1>Sumate al equipo</h1>
            <p>
              Creá tu acceso personal. Tu usuario quedará vinculado a la empresa
              que te invitó y no se registrará una empresa nueva.
            </p>
          </div>
          {authenticatedEmail ? (
            <form onSubmit={completeAuthenticatedInvitation}>
              <div className="authenticated-invite-email">
                <small>Cuenta autenticada</small>
                <b>{authenticatedEmail}</b>
              </div>
              <label>
                Nombre
                <input name="nombre" required autoComplete="given-name" />
              </label>
              <label>
                Apellido
                <input name="apellido" required autoComplete="family-name" />
              </label>
              <button className="primary full" disabled={busy || !inviteToken}>
                {busy ? "Vinculando…" : "Completar acceso a la empresa"}
              </button>
            </form>
          ) : (
            <form onSubmit={acceptTeamInvitation}>
              <label>
                Nombre
                <input name="nombre" required autoComplete="given-name" />
              </label>
              <label>
                Apellido
                <input name="apellido" required autoComplete="family-name" />
              </label>
              <label>
                Correo invitado
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Contraseña
                <PasswordInput
                  name="password"
                  autoComplete="new-password"
                />
                <small>Mínimo 8 caracteres.</small>
              </label>
              <label>
                Repetir contraseña
                <PasswordInput
                  name="confirmation"
                  autoComplete="new-password"
                />
              </label>
              <button className="primary full" disabled={busy || !inviteToken}>
                {busy ? "Creando acceso…" : "Aceptar invitación"}
              </button>
            </form>
          )}
          {message && <p className="notice">{message}</p>}
        </section>
      )}

      {view === "login" && (
        <section className="form-shell narrow">
          <button className="back" onClick={() => setView("home")}>
            ← Volver
          </button>
          <div className="form-heading">
            <span>Acceso seguro</span>
            <h1>Ingresá a Miconect</h1>
            <p>Usá el correo registrado para acceder al panel de tu empresa.</p>
          </div>
          <form onSubmit={login}>
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label>
              Contraseña
              <PasswordInput
                name="password"
                autoComplete="current-password"
              />
            </label>
            <label className="remember-login">
              <input
                type="checkbox"
                checked={rememberLoginEmail}
                onChange={(event) => setRememberLoginEmail(event.target.checked)}
              />
              <span>Recordar mi correo en este dispositivo</span>
            </label>
            <button className="primary full" disabled={busy}>
              {busy ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
          <button
            className="password-forgot-button"
            onClick={() => {
              setMessage("");
              setView("recover");
            }}
          >
            Olvidé mi contraseña
          </button>
          {message && <p className="notice">{message}</p>}
        </section>
      )}

      {view === "recover" && (
        <section className="form-shell narrow">
          <button className="back" onClick={() => setView("login")}>
            ← Volver al acceso
          </button>
          <div className="form-heading">
            <span>Recuperación de cuenta</span>
            <h1>Restablecé tu contraseña</h1>
            <p>
              Ingresá el correo de tu cuenta. Te enviaremos un enlace seguro.
            </p>
          </div>
          <form onSubmit={sendPasswordRecovery}>
            <label>
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <button className="primary full" disabled={busy}>
              {busy ? "Enviando…" : "Enviar enlace de recuperación"}
            </button>
          </form>
          {message && <p className="notice">{message}</p>}
        </section>
      )}

      {view === "register" && (
        <section className="form-shell">
          <button className="back" onClick={() => setView("home")}>
            ← Volver
          </button>
          <div className="form-heading">
            <span>{orphanUser ? "Vinculación pendiente" : "Alta inicial"}</span>
            <h1>
              {orphanUser ? "Completá la vinculación" : "Registrá tu empresa"}
            </h1>
            <p>
              {orphanUser
                ? "Tu correo ya está confirmado. Completá estos datos para asociar la cuenta a su empresa."
                : "La cuenta podrá explorar la plataforma. Para operar deberá completar la verificación."}
            </p>
          </div>
          <form className="form-grid" onSubmit={register}>
            <div className="wide registration-capabilities">
              <div>
                <b>¿Qué actividades realizará la empresa?</b>
                <p>Podés elegir una o ambas. La verificación empresarial será única.</p>
              </div>
              <div className="capability-options">
                <label className={registrationCanBuy ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={registrationCanBuy}
                    onChange={(event) => setRegistrationCanBuy(event.target.checked)}
                  />
                  <span><b>Realizar compras</b><small>Publicar solicitudes y adjudicar ofertas</small></span>
                </label>
                <label className={registrationCanSell ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={registrationCanSell}
                    onChange={(event) => {
                      setRegistrationCanSell(event.target.checked);
                      if (!event.target.checked) setRegistrationSelectedCategories([]);
                    }}
                  />
                  <span><b>Ofrecer productos o servicios</b><small>Recibir pedidos y presentar cotizaciones</small></span>
                </label>
              </div>
            </div>
            <label>
              Razón social
              <input name="razon_social" required />
            </label>
            <label>
              Nombre comercial
              <input name="nombre_comercial" />
            </label>
            <label>
              CUIT
              <input
                name="cuit"
                inputMode="numeric"
                pattern="[0-9-]{11,13}"
                required
                placeholder="11 dígitos"
                aria-invalid={
                  registrationCuitStatus === "unavailable" ||
                  registrationCuitStatus === "invalid"
                }
                onChange={(event) => {
                  const cuit = event.target.value.replace(/\D/g, "");
                  if (cuit !== registrationCheckedCuit) {
                    setRegistrationCuitStatus("idle");
                    setMessage("");
                  }
                }}
                onBlur={(event) => {
                  const cuit = event.target.value.replace(/\D/g, "");
                  if (cuit.length === 11) void validateRegistrationCuit(cuit);
                  else if (cuit.length > 0) {
                    setRegistrationCheckedCuit(cuit);
                    setRegistrationCuitStatus("invalid");
                  }
                }}
              />
              {registrationCuitStatus === "checking" && (
                <small className="field-feedback">Verificando CUIT…</small>
              )}
              {registrationCuitStatus === "available" && (
                <small className="field-feedback success">CUIT disponible.</small>
              )}
              {registrationCuitStatus === "unavailable" && (
                <small className="field-feedback error">
                  Este CUIT ya está registrado. Solicitá acceso a la cuenta de la empresa.
                </small>
              )}
              {registrationCuitStatus === "invalid" && (
                <small className="field-feedback error">
                  Ingresá los 11 números del CUIT para validarlo.
                </small>
              )}
              {registrationCuitStatus === "service-error" && (
                <small className="field-feedback error">
                  No pudimos validar el CUIT. Intentá nuevamente.
                </small>
              )}
            </label>
            <label>
              Localidad
              <input name="localidad" required />
            </label>
            <label>
              Domicilio
              <input name="domicilio" />
            </label>
            <label>
              Teléfono
              <input name="telefono" type="tel" />
            </label>
            <label>
              WhatsApp comercial
              <input name="whatsapp" type="tel" />
            </label>
            <label>
              Sitio web
              <input name="sitio_web" type="url" placeholder="https://" />
            </label>
            {registrationCanSell && (
              <div className="wide registration-categories">
                <div>
                  <b>Rubros que provee</b>
                  <p>
                    Seleccioná uno o varios. Estos rubros determinan qué
                    solicitudes recibirá la empresa.
                  </p>
                </div>
                <div className="categories-grid compact">
                  {registrationCategories.map((category) => {
                    const selected = registrationSelectedCategories.includes(
                      category.id,
                    );
                    return (
                      <label
                        className={`category-option ${selected ? "selected" : ""}`}
                        key={category.id}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            setRegistrationSelectedCategories((current) =>
                              current.includes(category.id)
                                ? current.filter((id) => id !== category.id)
                                : [...current, category.id],
                            )
                          }
                        />
                        <span>{category.nombre}</span>
                        <b>{selected ? "✓" : "+"}</b>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="divider">Responsable de la cuenta</div>
            <label>
              Nombre
              <input name="nombre" required />
            </label>
            <label>
              Apellido
              <input name="apellido" required />
            </label>
            <label>
              Cargo
              <input name="cargo" />
            </label>
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={orphanUser?.email ?? ""}
                readOnly={Boolean(orphanUser)}
              />
            </label>
            {!orphanUser && (
              <>
                <label className="password-field-label">
                  Contraseña
                  <PasswordInput
                    name="password"
                    autoComplete="new-password"
                  />
                  <small>Mínimo 8 caracteres.</small>
                </label>
                <label className="password-field-label">
                  Repetir contraseña
                  <PasswordInput
                    name="confirmation"
                    autoComplete="new-password"
                  />
                </label>
              </>
            )}
            <label className="wide legal-acceptance">
              <input name="legal_acceptance" type="checkbox" required />
              <span>
                Declaro que la información ingresada es correcta y acepto los{" "}
                <button type="button" onClick={() => setLegalDocument("terms")}>
                  Términos y condiciones
                </button>{" "}
                y la{" "}
                <button type="button" onClick={() => setLegalDocument("privacy")}>
                  Política de privacidad
                </button>
                .
              </span>
            </label>
            <button className="primary full wide" disabled={busy}>
              {busy ? "Creando cuenta…" : "Crear cuenta empresarial"}
            </button>
          </form>
          {message && <p className="notice">{message}</p>}
        </section>
      )}

      <footer className="public-footer">
        <div>
          <img className="footer-wordmark" src="/miconect-wordmark-white.png" alt="Miconect" />
          <span>Una plataforma operada por MINPA S.A.S.</span>
        </div>
        <nav aria-label="Información legal y soporte">
          <button onClick={() => setLegalDocument("terms")}>Términos</button>
          <button onClick={() => setLegalDocument("privacy")}>Privacidad</button>
          <button onClick={() => setLegalDocument("advertising")}>Publicidad</button>
          <a href="mailto:info@miconect.com">Soporte</a>
        </nav>
        <small>San Juan, Argentina · info@miconect.com</small>
      </footer>

      {legalDocument && (
        <div className="legal-backdrop" onClick={() => setLegalDocument(null)}>
          <article className="legal-modal" onClick={(event) => event.stopPropagation()}>
            <button className="legal-close" onClick={() => setLegalDocument(null)} aria-label="Cerrar">
              ×
            </button>
            {legalDocument === "terms" && (
              <>
                <span>Vigencia: agosto de 2026</span>
                <h2>Términos y condiciones</h2>
                <p>Miconect es una plataforma B2B operada por MINPA S.A.S. que facilita el contacto, la solicitud de cotizaciones y la adjudicación entre empresas compradoras y proveedoras.</p>
                <h3>Uso de la plataforma</h3>
                <p>Cada empresa es responsable por la veracidad de sus datos, la seguridad de sus accesos y las acciones realizadas por sus integrantes. Está prohibido publicar información falsa, ilícita, engañosa o que vulnere derechos de terceros.</p>
                <h3>Operaciones entre empresas</h3>
                <p>Miconect brinda infraestructura tecnológica y no es parte de las compraventas, cotizaciones, contratos, pagos, entregas ni garantías celebradas entre usuarios. Cada empresa debe verificar por sí misma las condiciones técnicas, comerciales, tributarias y legales de la operación.</p>
                <h3>Disponibilidad y medidas de control</h3>
                <p>MINPA S.A.S. podrá verificar, observar, suspender o eliminar cuentas y contenidos ante incumplimientos o riesgos para la red. El servicio puede sufrir interrupciones por mantenimiento o causas técnicas, sin garantía de disponibilidad absoluta.</p>
                <h3>Jurisdicción</h3>
                <p>Estos términos se rigen por las leyes de la República Argentina. Toda controversia se someterá a los tribunales ordinarios de la Provincia de San Juan, salvo norma imperativa aplicable.</p>
              </>
            )}
            {legalDocument === "privacy" && (
              <>
                <span>Vigencia: agosto de 2026</span>
                <h2>Política de privacidad</h2>
                <p>MINPA S.A.S. trata datos de usuarios, empresas, contactos, documentos, solicitudes, cotizaciones, adjudicaciones y registros técnicos necesarios para operar y proteger Miconect.</p>
                <h3>Finalidades</h3>
                <p>Los datos se utilizan para autenticar usuarios, verificar empresas, prestar las funciones contratadas, distribuir oportunidades por rubro, mantener trazabilidad, prevenir abusos, brindar soporte y cumplir obligaciones legales.</p>
                <h3>Acceso y conservación</h3>
                <p>La información comercial se comparte únicamente según el flujo funcional de la plataforma y los permisos de cada empresa. Los datos pueden alojarse en proveedores tecnológicos contratados y conservarse durante la relación, los plazos legales y el tiempo razonable necesario para auditoría y seguridad.</p>
                <h3>Derechos del titular</h3>
                <p>El titular puede solicitar acceso, actualización, rectificación o supresión cuando corresponda conforme a la Ley 25.326, escribiendo a info@miconect.com. Algunas constancias deberán conservarse por obligaciones legales o de seguridad.</p>
              </>
            )}
            {legalDocument === "advertising" && (
              <>
                <span>Información comercial</span>
                <h2>Aviso sobre publicidad</h2>
                <p>Miconect muestra espacios identificados como “Publicidad”. Los anuncios son contratados por terceros y pueden dirigir a sitios externos.</p>
                <p>MINPA S.A.S. administra su publicación, pero la empresa anunciante es responsable por la exactitud, legalidad y vigencia de su oferta. La aparición de un anuncio no implica recomendación, certificación ni garantía de Miconect.</p>
                <p>La plataforma puede registrar impresiones y clics para medición comercial. No se venden adjudicaciones ni se altera el carácter privado de las cotizaciones por la contratación de publicidad.</p>
              </>
            )}
            <div className="legal-contact">Consultas: <a href="mailto:info@miconect.com">info@miconect.com</a></div>
          </article>
        </div>
      )}
    </main>
  );
}
