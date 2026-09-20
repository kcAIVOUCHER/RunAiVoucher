import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { createClient } from "@supabase/supabase-js";

// Supabase Client Initialization
let supabaseUrl = process.env.SUPABASE_URL || "";
if (supabaseUrl.endsWith("/rest/v1") || supabaseUrl.endsWith("/rest/v1/")) {
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "");
}
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;


// Resolve config dynamically to avoid breaking Render if file doesn't exist
let firebaseConfig: any = {};
try {
  
  
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.log("Could not load firebase-applet-config.json, falling back to environment variables");
}

try {
  admin.initializeApp({
    projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID
  });
} catch (e) {
  console.log("Firebase admin already initialized");
}

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

// Middleware para restringir acesso a ações administrativas do Painel Master
const checkMasterAuth = async (req: any, res: any, next: any) => {
  const email = (
    req.headers['x-user-email'] ||
    req.query.userEmail ||
    req.headers['x-user-id'] ||
    ''
  ).toString().toLowerCase().trim();

  // Permite o master oficial
  if (email === 'kcarrascosa.comercial@gmail.com') {
    return next();
  }

  // Verifica se o usuário tem role 'master' ou 'saas_admin'
  const store = await getStore();
  const storeUser = (store.agencyUsers || []).find(
    (u) => (u.email || '').toLowerCase().trim() === email
  );
  if (storeUser && (storeUser.role === 'master' || (storeUser.role as string) === 'saas_admin')) {
    return next();
  }

  return res.status(403).json({ error: 'Acesso negado: Ação restrita ao Master do SaaS' });
};

const app = express();
const PORT = 3000;

// Increase payload limit for PDF and image base64 uploads (up to 50MB for heavy documents)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Express JSON and body-parser error handler to ensure JSON response instead of HTML <!DOCTYPE>
app.use((err: any, req: any, res: any, next: any) => {
  if (err) {
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({
        success: false,
        error: "O arquivo PDF ou anexo enviado é muito pesado (excede o limite de 50MB). Envie um PDF mais leve ou selecione menos páginas."
      });
    }
    if (err.status === 400 || err instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        error: "Formato de requisição inválido enviado ao servidor."
      });
    }
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || "Erro no processamento da requisição."
    });
  }
  next();
});

// In-memory / file-backed persistent storage
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface SaasStore {
  plans: any[];
  agencies: any[];
  agencyUsers: any[];
  invoices: any[];
  companies: any[];
  vouchers: any[];
  platformSettings?: any;
}

const defaultPlans = [
  {
    id: "plan-starter",
    name: "Starter Agência",
    code: "starter",
    description: "Ideal para agências de pequeno porte, consultores independentes e novos agentes.",
    basePrice: 199.00,
    baseUsers: 2,
    pricePerExtraUser: 49.00,
    maxVouchersPerMonth: 150,
    aiVoucherExtractionsIncluded: 100,
    isPopular: false,
    features: [
      "Até 2 usuários/logins inclusos",
      "150 emissões de vouchers por mês",
      "Leitura IA com Gemini (PDF e fotos)",
      "Logo e identidade visual da agência",
      "Suporte por e-mail e base de conhecimento"
    ]
  },
  {
    id: "plan-pro",
    name: "Profissional Corp",
    code: "pro",
    description: "Para agências consolidadas com atendimento corporativo, operando em volume diário.",
    basePrice: 389.00,
    baseUsers: 5,
    pricePerExtraUser: 39.00,
    maxVouchersPerMonth: 600,
    aiVoucherExtractionsIncluded: 400,
    isPopular: true,
    features: [
      "Até 5 usuários/logins inclusos",
      "Assentos extras por apenas R$ 39/mês",
      "Vínculo ilimitado de empresas clientes",
      "Regras tarifárias pré-definidas por cliente",
      "Emissão com duplo logo (Agência + Empresa)",
      "Suporte prioritário via WhatsApp"
    ]
  },
  {
    id: "plan-enterprise",
    name: "Enterprise Corporate",
    code: "enterprise",
    description: "Para TMCs, grandes consolidadoras e redes com alta equipe e múltiplos departamentos.",
    basePrice: 890.00,
    baseUsers: 15,
    pricePerExtraUser: 29.00,
    maxVouchersPerMonth: -1, // Ilimitado
    aiVoucherExtractionsIncluded: 2500,
    isPopular: false,
    features: [
      "15 usuários inclusos + assentos flexíveis",
      "Vouchers e leituras com IA ilimitados",
      "Múltiplos centros de custo corporativos",
      "Gestão de permissões avançadas e auditoria",
      "SLA de suporte dedicado 24/7",
      "Faturamento e NFS-e automáticas customizadas"
    ]
  }
];

const initialSeedData: SaasStore = {
  plans: defaultPlans,
  agencies: [],
  agencyUsers: [],
  invoices: [],
  companies: [],
  vouchers: []
};


let memoryStore: SaasStore | null = null;

async function getStore(): Promise<SaasStore> {
  try {
    if (memoryStore) return memoryStore;

    // 1. Try Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('system_store').select('data').eq('id', 'main').single();
        if (!error && data && data.data) {
          memoryStore = data.data as SaasStore;
          // Sync to local file as backup cache
          try {
            if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
            fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2));
          } catch (e) {}
          return memoryStore;
        }
      } catch (sbErr) {
        console.warn("Supabase fetch failed, falling back to local:", sbErr);
      }
    }

    // 2. Try Local File Storage (data/store.json)
    if (fs.existsSync(STORE_FILE)) {
      try {
        const fileContent = fs.readFileSync(STORE_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (parsed && Array.isArray(parsed.agencies)) {
          memoryStore = parsed as SaasStore;
          return memoryStore;
        }
      } catch (fileErr) {
        console.warn("Local store.json read error, falling back:", fileErr);
      }
    }

    // 3. Default Seed
    memoryStore = initialSeedData;
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialSeedData, null, 2));
    } catch (e) {}
    return initialSeedData;
  } catch (err) {
    console.error("Error reading store:", err);
    if (!memoryStore) memoryStore = initialSeedData;
    return memoryStore;
  }
}

async function saveStore(store: SaasStore) {
  try {
    memoryStore = store;

    // 1. Save to Local File immediately
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    } catch (e) {
      console.warn("Error writing local store.json:", e);
    }

    // 2. Save to Supabase if available
    if (supabase) {
      try {
        const { error: sbErr } = await supabase.from('system_store').upsert({ id: 'main', data: store, updated_at: new Date().toISOString() });
        if (sbErr) {
          console.error("Supabase upsert error in system_store:", sbErr);
        } else {
          console.log("Successfully persisted system_store to Supabase.");
        }
      } catch (sbErr) {
        console.warn("Error syncing store to Supabase:", sbErr);
      }
    }
  } catch (err) {
    console.error("Error writing store:", err);
  }
}


// -------------------------------------------------------------
// Auth & Invites via Resend
// -------------------------------------------------------------

app.post("/api/auth/invite", async (req, res) => {
  try {
    const { email, role, agencyId, name, reqUserId } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      password: Math.random().toString(36).slice(-10) + "A!1", // Temporary random password
      displayName: name,
    });

    // Create user profile in SaaS store
    const store = await getStore();
    store.agencyUsers = store.agencyUsers || [];
    store.agencyUsers.unshift({
      id: userRecord.uid,
      agencyId: agencyId || null,
      name,
      email,
      role,
      status: "active",
      createdAt: new Date().toISOString()
    });
    await saveStore(store);

    // Generate password reset link
    const link = await getAuth().generatePasswordResetLink(email);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'AI Voucher <suporte@aivoucher.com.br>',
      to: [email],
      subject: 'Bem-vindo ao AI Voucher - Configure sua conta',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Olá, ${name}!</h2>
          <p>Você foi convidado para acessar a plataforma AI Voucher.</p>
          <p>Para criar sua senha e realizar o seu primeiro acesso, clique no link abaixo:</p>
          <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            Configurar minha senha
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
            Se o botão não funcionar, copie e cole este link no seu navegador: ${link}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Erro ao enviar e-mail de convite." });
    }

    res.status(200).json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    console.error("Error inviting user:", err);
    res.status(500).json({ error: err.message || "Erro interno" });
  }
});

// -------------------------------------------------------------
// SaaS Super Admin & Metrics Endpoints
// -------------------------------------------------------------

app.get("/api/saas/metrics", checkMasterAuth, async (req, res) => {
  const store = await getStore();
  const agencies = store.agencies || [];
  const invoices = store.invoices || [];
  const agencyUsers = store.agencyUsers || [];
  const vouchers = store.vouchers || [];

  const activeAgencies = agencies.filter((a) => a.subscription?.status === "active");
  const trialAgencies = agencies.filter((a) => a.subscription?.status === "trial");
  const blockedAgencies = agencies.filter((a) => a.subscription?.status === "blocked");

  const mrr = activeAgencies.reduce((acc, a) => acc + (Number(a.subscription?.monthlyFee) || 0), 0);
  const arr = mrr * 12;

  const pendingInvoicesAmount = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "overdue")
    .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);

  res.json({
    mrr,
    arr,
    activeAgenciesCount: activeAgencies.length,
    trialAgenciesCount: trialAgencies.length,
    blockedAgenciesCount: blockedAgencies.length,
    totalAgenciesCount: agencies.length,
    totalAgencyUsersCount: agencyUsers.filter((u) => u.status === "active").length,
    vouchersEmittedThisMonth: vouchers.length,
    pendingInvoicesAmount
  });
});

app.get("/api/saas/settings", async (req, res) => {
  const store = await getStore();
  res.json(store.platformSettings || {});
});

// PWA Web App Manifest (dynamic, reflects configured platform icon and name)
app.get(["/manifest.webmanifest", "/manifest.json"], async (req, res) => {
  try {
    const store = await getStore();
    const pSettings = store.platformSettings || {};
    const appName = pSettings.platformName || "AiVoucher - Emissor de Vouchers & Gestão de Agências";
    const appShortName = "AiVoucher";
    const themeColor = pSettings.primaryColor || "#00277A";

    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.json({
      id: "/",
      name: appName,
      short_name: appShortName,
      description: "Plataforma SaaS para agências de viagens com emissão inteligente de vouchers por IA (AiVoucher).",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait-primary",
      background_color: themeColor,
      theme_color: themeColor,
      icons: [
        {
          src: "/api/pwa-icon?size=192",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/api/pwa-icon?size=512",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/api/pwa-icon?size=512&maskable=1",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load manifest" });
  }
});

// PWA Icon endpoint (serves the exact icon configured by the user, or SVG fallback)
app.get("/api/pwa-icon", async (req, res) => {
  try {
    const store = await getStore();
    const pSettings = store.platformSettings || {};
    const iconData = pSettings.platformIconUrl || pSettings.platformLogoUrl;

    if (iconData && typeof iconData === "string") {
      if (iconData.startsWith("data:")) {
        const matches = iconData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=3600");
          return res.send(buffer);
        }
      } else if (iconData.startsWith("http://") || iconData.startsWith("https://")) {
        return res.redirect(iconData);
      }
    }

    // Default fallback: serve public/logo-icon.svg
    const svgPath = path.join(process.cwd(), "public", "logo-icon.svg");
    if (fs.existsSync(svgPath)) {
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(svgPath);
    }

    res.status(404).send("Icon not found");
  } catch (err) {
    console.error("Error serving PWA icon:", err);
    res.status(500).send("Error serving icon");
  }
});

app.put("/api/saas/settings", checkMasterAuth, async (req, res) => {
  const store = await getStore();
  store.platformSettings = { ...store.platformSettings, ...req.body };
  await saveStore(store);
  res.json(store.platformSettings);
});

// Calculate business days overdue (excluding Saturdays and Sundays)
function calculateBusinessDaysOverdue(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const parts = dueDateStr.split("-");
  if (parts.length !== 3) return 0;
  const dueYear = parseInt(parts[0], 10);
  const dueMonth = parseInt(parts[1], 10) - 1;
  const dueDay = parseInt(parts[2], 10);
  const due = new Date(dueYear, dueMonth, dueDay, 0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today.getTime() <= due.getTime()) return 0;

  let count = 0;
  const cur = new Date(due.getTime());
  cur.setDate(cur.getDate() + 1);

  while (cur.getTime() <= today.getTime()) {
    const dayOfWeek = cur.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Evaluate delinquency and auto-block agencies past tolerance business days of unpaid due date
async function evaluateAgencyDelinquency(store: any): Promise<boolean> {
  let changed = false;
  const nowIso = new Date().toISOString();
  const invoices = store.invoices || [];
  const agencies = store.agencies || [];
  const pSettings = store.platformSettings || {};
  const toleranceDays = Number(pSettings.delinquencyDaysTolerance) || 3;

  for (const agency of agencies) {
    if (!agency.subscription) continue;

    // Agências em modo teste (trial) não são bloqueadas por faturas pendentes
    if (agency.subscription.status === "trial") {
      continue;
    }

    const unpaidInvoices = invoices.filter(
      (inv: any) => inv.agencyId === agency.id && (inv.status === "pending" || inv.status === "overdue")
    );

    let maxBusinessDays = 0;
    let shouldBlock = false;

    for (const inv of unpaidInvoices) {
      const bDays = calculateBusinessDaysOverdue(inv.dueDate);
      inv.businessDaysOverdue = bDays;
      if (bDays > 0 && inv.status === "pending") {
        inv.status = "overdue";
        changed = true;
      }
      if (bDays > maxBusinessDays) {
        maxBusinessDays = bDays;
      }
      if (bDays >= toleranceDays) {
        shouldBlock = true;
      }
    }

    agency.subscription.businessDaysOverdue = maxBusinessDays;

    if (shouldBlock && agency.subscription.status !== "blocked") {
      agency.subscription.status = "blocked";
      agency.subscription.blockedReason = `inadimplencia_${toleranceDays}_dias_uteis`;
      agency.subscription.blockedAt = nowIso;
      changed = true;
    } else if (!shouldBlock && agency.subscription.status === "blocked" && (agency.subscription.blockedReason?.startsWith("inadimplencia_") || agency.subscription.blockedReason === "inadimplencia_3_dias_uteis")) {
      // Se não há mais faturas inadimplentes (por terem sido quitadas ou excluídas pelo Master), desbloqueia
      agency.subscription.status = "active";
      agency.subscription.blockedReason = undefined;
      agency.subscription.blockedAt = undefined;
      agency.subscription.businessDaysOverdue = 0;
      changed = true;
    }
  }

  if (changed) {
    await saveStore(store);
  }
  return changed;
}

app.get("/api/saas/plans", async (req, res) => {
  const store = await getStore();
  if (!store.plans || store.plans.length === 0) {
    store.plans = defaultPlans.map(p => ({ ...p, isActive: true, createdAt: new Date().toISOString() }));
    await saveStore(store);
  }
  res.json(store.plans);
});

app.post("/api/saas/plans", checkMasterAuth, async (req, res) => {
  const store = await getStore();
  store.plans = store.plans && store.plans.length > 0 ? store.plans : [...defaultPlans];

  const newPlan = {
    id: `plan-${Date.now()}`,
    name: req.body.name || "Novo Plano",
    code: (req.body.name || "custom").toLowerCase().replace(/[^a-z0-9]/g, "-"),
    description: req.body.description || "Plano personalizado para agências",
    basePrice: Number(req.body.basePrice) || 199.00,
    baseUsers: Number(req.body.baseUsers) || 2,
    pricePerExtraUser: Number(req.body.pricePerExtraUser) || 39.00,
    maxVouchersPerMonth: Number(req.body.maxVouchersPerMonth ?? -1),
    aiVoucherExtractionsIncluded: Number(req.body.aiVoucherExtractionsIncluded ?? 100),
    isPopular: Boolean(req.body.isPopular),
    isActive: req.body.isActive !== false,
    features: Array.isArray(req.body.features) && req.body.features.length > 0 
      ? req.body.features 
      : ["Acesso completo ao emissor de vouchers", "Identidade visual personalizada"],
    createdAt: new Date().toISOString()
  };

  store.plans.push(newPlan);
  await saveStore(store);
  res.status(201).json(newPlan);
});

app.put("/api/saas/plans/:id", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  store.plans = store.plans && store.plans.length > 0 ? store.plans : [...defaultPlans];

  const index = store.plans.findIndex((p: any) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Plano não encontrado" });
  }

  store.plans[index] = {
    ...store.plans[index],
    ...req.body,
    basePrice: req.body.basePrice !== undefined ? Number(req.body.basePrice) : store.plans[index].basePrice,
    baseUsers: req.body.baseUsers !== undefined ? Number(req.body.baseUsers) : store.plans[index].baseUsers,
    pricePerExtraUser: req.body.pricePerExtraUser !== undefined ? Number(req.body.pricePerExtraUser) : store.plans[index].pricePerExtraUser,
    maxVouchersPerMonth: req.body.maxVouchersPerMonth !== undefined ? Number(req.body.maxVouchersPerMonth) : store.plans[index].maxVouchersPerMonth
  };

  await saveStore(store);
  res.json(store.plans[index]);
});

app.delete("/api/saas/plans/:id", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const linkedAgencies = (store.agencies || []).filter((a: any) => a.subscription?.planId === id);
  if (linkedAgencies.length > 0) {
    return res.status(400).json({ 
      error: `Não é possível excluir este plano pois existem ${linkedAgencies.length} agência(s) vinculadas a ele. Você pode desativá-lo para que novos clientes não o vejam.` 
    });
  }

  store.plans = (store.plans || []).filter((p: any) => p.id !== id);
  await saveStore(store);
  res.json({ success: true });
});

// SaaS Agencies Management (Master SuperAdmin & Switcher)
app.get("/api/saas/agencies", async (req, res) => {
  const store = await getStore();
  await evaluateAgencyDelinquency(store);
  const requesterEmail = (
    req.headers['x-user-email'] ||
    req.query.userEmail ||
    req.headers['x-user-id'] ||
    ''
  ).toString().toLowerCase().trim();

  const isMaster = requesterEmail === 'kcarrascosa.comercial@gmail.com' || (store.agencyUsers || []).some(
    (u) => (u.email || '').toLowerCase().trim() === requesterEmail && (u.role === 'master' || (u.role as string) === 'saas_admin')
  );

  let agenciesList = store.agencies || [];
  // If not master, filter agencies where this user is linked
  if (!isMaster && requesterEmail) {
    const userAgencyIds = (store.agencyUsers || [])
      .filter((u) => (u.email || '').toLowerCase().trim() === requesterEmail)
      .map((u) => u.agencyId);
    agenciesList = agenciesList.filter(
      (a) =>
        userAgencyIds.includes(a.id) ||
        (a.masterLoginEmail || '').toLowerCase().trim() === requesterEmail ||
        (a.email || '').toLowerCase().trim() === requesterEmail
    );
  }

  const agenciesWithCounts = agenciesList.map((agency) => {
    const usersCount = (store.agencyUsers || []).filter((u) => u.agencyId === agency.id && u.status === "active").length;
    const vouchersCount = (store.vouchers || []).filter((v) => v.agencyId === agency.id).length;
    const companiesCount = (store.companies || []).filter((c) => c.agencyId === agency.id).length;
    return {
      ...agency,
      activeUsersCount: usersCount,
      vouchersCount,
      companiesCount
    };
  });
  res.json(agenciesWithCounts);
});

app.post("/api/saas/agencies", checkMasterAuth, async (req, res) => {
  try {
    const store = await getStore();
    const agencyId = `agency-${Date.now()}`;
    const now = new Date().toISOString();

    const sub = req.body.subscription || {};
    const availablePlans = (store.plans && store.plans.length > 0) ? store.plans : defaultPlans;
    const planId = sub.planId || req.body.planId || availablePlans[0]?.id || "plan-custom";
    const plan = availablePlans.find((p: any) => p.id === planId) || availablePlans[0] || {
      id: planId,
      name: sub.planName || "Plano Personalizado",
      basePrice: 199.00,
      baseUsers: 2,
      pricePerExtraUser: 39.00,
      maxVouchersPerMonth: -1
    };

    const basePrice = Number(sub.basePrice ?? req.body.basePrice) || (plan.basePrice ?? 199);
    const maxUsers = Number(sub.maxUsers ?? req.body.maxUsers) || (plan.baseUsers ?? 2);
    const extraUsersCount = Math.max(0, maxUsers - (plan.baseUsers ?? 2));
    const extraUsersPrice = extraUsersCount * (plan.pricePerExtraUser ?? 39);
    const monthlyFee = Number(sub.monthlyFee ?? req.body.monthlyFee) || (basePrice + extraUsersPrice);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const newAgency = {
      id: agencyId,
      name: req.body.name || "Nova Agência de Turismo",
      tradeName: req.body.tradeName || req.body.name,
      cnpj: req.body.cnpj || "",
      logoUrl: req.body.logoUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop&q=80",
      email: req.body.email || req.body.masterLoginEmail || "",
      masterLoginEmail: req.body.masterLoginEmail || req.body.email || `admin@${agencyId}.com.br`,
      phone: req.body.phone || "",
      whatsapp: req.body.whatsapp || "",
      website: req.body.website || "",
      address: req.body.address || "",
      primaryColor: req.body.primaryColor || "#0284c7",
      footerNotes: req.body.footerNotes || "Apresente-se com documento oficial e antecedência de 2h.",
      emergencyPhone: req.body.emergencyPhone || "",
      defaultPriceDisplay: req.body.defaultPriceDisplay || "apenas_total",
      hideFareFamilyByDefault: false,
      hideClassByDefault: true,
      subscription: {
        planId: plan.id,
        planName: sub.planName || plan.name,
        status: sub.status || req.body.status || "active",
        billingCycle: sub.billingCycle || req.body.billingCycle || "monthly",
        maxUsers: maxUsers,
        basePrice: basePrice,
        extraUsersCount: extraUsersCount,
        extraUsersPrice: extraUsersPrice,
        monthlyFee: monthlyFee,
        maxVouchersPerMonth: Number(sub.maxVouchersPerMonth ?? req.body.maxVouchersPerMonth ?? plan.maxVouchersPerMonth ?? -1),
        nextDueDate: sub.nextDueDate || req.body.nextDueDate || nextMonth.toISOString().split("T")[0],
        paymentMethod: sub.paymentMethod || req.body.paymentMethod || "pix",
        notes: sub.notes || req.body.notes || ""
      },
      createdAt: now
    };

    store.agencies = store.agencies || [];
    store.agencyUsers = store.agencyUsers || [];
    store.invoices = store.invoices || [];

    store.agencies.unshift(newAgency);

    // Automatically create the Master user for this agency
    const masterUser = {
      id: `usr-${Date.now()}`,
      agencyId: agencyId,
      name: req.body.masterName || "Administrador Master",
      email: newAgency.masterLoginEmail,
      role: "agency_admin",
      status: "active",
      createdAt: now
    };
    
    let generatedPassword = "";
    let firebaseApiKey = process.env.FIREBASE_API_KEY || "";
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        firebaseApiKey = config.apiKey || process.env.FIREBASE_API_KEY;
      }
    } catch (e) {
      console.error("Could not read firebase config");
    }

    try {
      if (firebaseApiKey) {
        generatedPassword = req.body.password || (Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4) + "!");
        
        const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: masterUser.email,
            password: generatedPassword,
            returnSecureToken: true
          })
        });
        
        const data = await fbRes.json();
        
        if (data.error && data.error.message === "EMAIL_EXISTS") {
          console.log("Firebase Auth User already exists. Using existing user.");
          generatedPassword = "ALREADY_EXISTS";
        } else if (data.idToken) {
          masterUser.id = data.localId; // Use the Firebase Auth UID
          
          // Update display name
          await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idToken: data.idToken,
              displayName: masterUser.name,
              returnSecureToken: false
            })
          }).catch(console.warn);
        } else {
          console.warn("Firebase Auth response warning:", data.error);
          return res.status(400).json({ error: `Erro na Autenticação (Firebase): ${data.error?.message || "Erro desconhecido ao criar usuário de login."}` });
        }
      } else {
         return res.status(500).json({ error: "Configuração do Firebase API Key não encontrada no servidor." });
      }
    } catch (err: any) {
      console.warn("Error creating Firebase Auth User via REST:", err);
      return res.status(500).json({ error: `Erro de conexão ao criar usuário no Firebase: ${err.message}` });
    }
    
    if (generatedPassword && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: masterUser.email,
          subject: "Bem-vindo ao AiVoucher - Credenciais de Acesso",
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0284c7;">Olá, ${masterUser.name}!</h2>
              <p>Sua agência <strong>${newAgency.name}</strong> foi criada com sucesso em nossa plataforma.</p>
              <p>Aqui estão suas credenciais de acesso como Administrador Master:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>E-mail:</strong> ${masterUser.email}</p>
                <p style="margin: 5px 0;"><strong>Senha Temporária:</strong> ${generatedPassword}</p>
              </div>
              <p>Recomendamos que você altere sua senha no seu primeiro acesso.</p>
            </div>
          `
        }).catch(console.warn);
      } catch (emailErr) {
        console.warn("Error sending email via Resend:", emailErr);
      }
    }

    store.agencyUsers.push(masterUser);

    // Generate initial invoice
    const invNumber = `FAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      agencyId: agencyId,
      agencyName: newAgency.name,
      agencyCnpj: newAgency.cnpj,
      amount: monthlyFee,
      dueDate: newAgency.subscription.nextDueDate,
      status: "pending",
      billingPeriod: `Mensalidade ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
      usersCount: maxUsers,
      pixCode: `00020126580014BR.GOV.BCB.PIX0136${agencyId}-charge520400005303986540${monthlyFee.toFixed(2)}5802BR5925AIVOUCHER SAAS BRASIL6009SAO PAULO62070503***6304ABCD`,
      barcode: `34191.79001 01043.510047 91020.150008 8 98350000${Math.floor(monthlyFee * 100)}`,
      nfeTaxRate: 2.5,
      nfeTaxValue: Number((monthlyFee * 0.025).toFixed(2)),
      nfeServiceDescription: `Licenciamento de software em nuvem AiVoucher - RomamiaViagens® - Plano ${plan.name} (${maxUsers} usuários). Código 1.05.`,
      nfeStatus: "not_emitted"
    };
    store.invoices.unshift(initialInvoice);

    await saveStore(store);
    res.status(201).json({ ...newAgency, activeUsersCount: 1, generatedPassword });
  } catch (err: any) {
    console.error("Fatal error creating agency:", err);
    res.status(500).json({ error: err.message || "Erro no servidor ao criar agência." });
  }
});

app.put("/api/saas/agencies/:id", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = (store.agencies || []).findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Agência não encontrada" });
  }

  const existing = store.agencies[index];
  const updated = {
    ...existing,
    ...req.body,
    subscription: {
      ...existing.subscription,
      ...(req.body.subscription || {})
    }
  };

  store.agencies[index] = updated;
  await saveStore(store);

  const usersCount = (store.agencyUsers || []).filter((u) => u.agencyId === id && u.status === "active").length;
  res.json({ ...updated, activeUsersCount: usersCount });
});

app.delete("/api/saas/agencies/:id", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  store.agencies = (store.agencies || []).filter((a) => a.id !== id);
  store.agencyUsers = (store.agencyUsers || []).filter((u) => u.agencyId !== id);
  store.companies = (store.companies || []).filter((c) => c.agencyId !== id);
  store.vouchers = (store.vouchers || []).filter((v) => v.agencyId !== id);
  store.invoices = (store.invoices || []).filter((i) => i.agencyId !== id);
  await saveStore(store);
  res.json({ success: true });
});

// Reset Agency test data (vouchers & test companies)
app.post("/api/saas/agencies/:id/reset", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  store.vouchers = (store.vouchers || []).filter((v) => v.agencyId !== id);
  store.companies = (store.companies || []).filter(
    (c) => c.agencyId !== id || (!c.name.toLowerCase().includes("teste") && !c.name.toLowerCase().includes("test"))
  );
  await saveStore(store);
  res.json({ success: true, message: "Dados de teste da agência resetados com sucesso." });
});

// Reset Agency Master Password
app.post("/api/saas/agencies/:id/reset-password", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  
  const agency = (store.agencies || []).find((a) => a.id === id);
  if (!agency) return res.status(404).json({ error: "Agência não encontrada" });

  const masterUser = (store.agencyUsers || []).find(u => u.agencyId === id && u.role === "agency_admin");
  if (!masterUser) return res.status(404).json({ error: "Usuário master não encontrado" });

  let firebaseApiKey = process.env.FIREBASE_API_KEY || "";
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      firebaseApiKey = config.apiKey || process.env.FIREBASE_API_KEY;
    }
  } catch (e) {
    console.error("Could not read firebase config");
  }

  try {
    if (firebaseApiKey) {
      const resetRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: masterUser.email,
          requestType: "PASSWORD_RESET"
        })
      });
      const data = await resetRes.json();
      
      if (data.error) {
        console.error("Firebase Auth Reset Error:", data.error);
        return res.status(500).json({ error: "Erro ao enviar e-mail de redefinição pelo Firebase." });
      }
      
      res.json({ success: true, email: masterUser.email, message: "E-mail de redefinição de senha enviado!" });
    } else {
      res.status(500).json({ error: "Firebase API Key não configurada no servidor." });
    }
  } catch (err) {
    console.error("Erro geral reset password:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Agency self-reset of test data
app.post("/api/agencies/:id/reset-tests", async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  store.vouchers = (store.vouchers || []).filter((v) => v.agencyId !== id);
  store.companies = (store.companies || []).filter(
    (c) => c.agencyId !== id || (!c.name.toLowerCase().includes("teste") && !c.name.toLowerCase().includes("test"))
  );
  await saveStore(store);
  res.json({ success: true, message: "Testes e vouchers resetados com sucesso." });
});

// Batch delete test companies
app.delete("/api/companies/batch/test", async (req, res) => {
  const agencyId = (req.query.agencyId as string) || (req.body?.agencyId as string);
  const store = await getStore();
  const initialCount = (store.companies || []).length;
  store.companies = (store.companies || []).filter((c) => {
    if (agencyId && c.agencyId !== agencyId) return true;
    const n = (c.name || "").toLowerCase();
    const t = (c.tradeName || "").toLowerCase();
    const isTest = n.includes("teste") || n.includes("test") || n.includes("demo") || t.includes("teste") || t.includes("test");
    return !isTest;
  });
  const removedCount = initialCount - store.companies.length;
  await saveStore(store);
  res.json({ success: true, removedCount });
});

// Agency Users Management (with Subscription Limit Enforcement)
app.get("/api/users/check-role", async (req, res) => {
  const email = (req.query.email as string || "").toLowerCase().trim();
  if (email === "kcarrascosa.comercial@gmail.com") {
    return res.json({ role: "master", agencyId: "", name: "Administrador Master SaaS" });
  }
  const store = await getStore();
  const user = (store.agencyUsers || []).find(
    (u) => (u.email || "").toLowerCase().trim() === email
  );
  if (user) {
    return res.json({ role: user.role, agencyId: user.agencyId, name: user.name });
  }
  // Check if email matches an agency's masterLoginEmail or agency email
  const agency = (store.agencies || []).find(
    (a) =>
      (a.masterLoginEmail || "").toLowerCase().trim() === email ||
      (a.email || "").toLowerCase().trim() === email
  );
  if (agency) {
    return res.json({ role: "agency_admin", agencyId: agency.id, name: agency.tradeName || agency.name });
  }
  res.json({ role: "agency_user" });
});

app.get("/api/agencies/:agencyId/users", async (req, res) => {
  const { agencyId } = req.params;
  const store = await getStore();
  const users = (store.agencyUsers || []).filter((u) => u.agencyId === agencyId);
  res.json(users);
});

app.post("/api/agencies/:agencyId/users", async (req, res) => {
  const { agencyId } = req.params;
  const store = await getStore();
  const agency = (store.agencies || []).find((a) => a.id === agencyId);

  if (!agency) {
    return res.status(404).json({ error: "Agência não encontrada" });
  }

  // Check Subscription User Limit!
  const currentActiveCount = (store.agencyUsers || []).filter(
    (u) => u.agencyId === agencyId && u.status === "active"
  ).length;
  const maxAllowed = agency.subscription?.maxUsers || 2;

  if (currentActiveCount >= maxAllowed) {
    return res.status(403).json({
      error: `Limite de usuários atingido! Sua assinatura atual do plano ${agency.subscription?.planName || ""} permite até ${maxAllowed} usuários simultâneos.`
    });
  }

  try {
    const { email, name, role, status } = req.body;
    const apiKey = "AIzaSyA1FM9c328pqEdFCB51Xno6eELp11G3oDo";
    
    // Create user in Firebase Auth using REST API
    const createRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: Math.random().toString(36).slice(-10) + "A!1", returnSecureToken: true })
    });
    
    const createData = await createRes.json();
    if (createData.error) {
       throw new Error(createData.error.message || "Erro ao criar usuário na Autenticação");
    }
    
    const uid = createData.localId;

    // Send password reset email directly via Firebase REST API
    const resetRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email: email })
    });
    const resetData = await resetRes.json();
    if (resetData.error) {
       console.error("Erro ao enviar reset:", resetData.error);
    }

    // Determine standard system role mapping
    const systemRole = role === "admin" ? "agency_admin" : "agency_user";

    // Keep it in legacy store for the UI for now until full migration
    const newUser = {
      id: uid,
      agencyId,
      name,
      email,
      role: role || "issuer",
      status: status || "active",
      createdAt: new Date().toISOString()
    };

    store.agencyUsers.unshift(newUser);
    await saveStore(store);
    
    // Note: To persist in Firestore, the client-side code should intercept the response 
    // and write the profile using its own authenticated SDK session since server SDK is blocked.
    res.status(201).json(newUser);
  } catch (err: any) {
    console.error("Error creating user in Firebase:", err);
    return res.status(500).json({ error: err.message || "Erro ao criar usuário e enviar e-mail." });
  }
});

app.put("/api/agencies/:agencyId/users/:userId", async (req, res) => {
  const { agencyId, userId } = req.params;
  const store = await getStore();
  const index = (store.agencyUsers || []).findIndex((u) => u.agencyId === agencyId && u.id === userId);
  if (index === -1) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  store.agencyUsers[index] = { ...store.agencyUsers[index], ...req.body };
  await saveStore(store);
  res.json(store.agencyUsers[index]);
});

app.delete("/api/agencies/:agencyId/users/:userId", async (req, res) => {
  const { agencyId, userId } = req.params;
  const store = await getStore();
  store.agencyUsers = (store.agencyUsers || []).filter((u) => !(u.agencyId === agencyId && u.id === userId));
  await saveStore(store);
  res.json({ success: true });
});

// SaaS Invoices & NFS-e Management
app.get("/api/saas/invoices", async (req, res) => {
  const store = await getStore();
  const agencyId = req.query.agencyId as string;
  // If agency is fetching its own invoices
  if (agencyId) {
    const list = (store.invoices || []).filter((inv) => inv.agencyId === agencyId);
    return res.json(list);
  }
  // If querying all invoices across the entire SaaS, enforce Master auth
  return checkMasterAuth(req, res, () => {
    res.json(store.invoices || []);
  });
});

app.post("/api/saas/invoices", checkMasterAuth, async (req, res) => {
  const store = await getStore();
  const agencyId = req.body.agencyId;
  const agency = (store.agencies || []).find((a) => a.id === agencyId);

  const amount = Number(req.body.amount) || Number(agency?.subscription?.monthlyFee) || 199.00;
  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `FAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    agencyId: agencyId || "",
    agencyName: agency?.name || req.body.agencyName || "Agência",
    agencyCnpj: agency?.cnpj || req.body.agencyCnpj || "",
    amount: amount,
    dueDate: req.body.dueDate || new Date().toISOString().split("T")[0],
    status: req.body.status || "pending",
    billingPeriod: req.body.billingPeriod || `Mensalidade ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
    usersCount: Number(req.body.usersCount) || agency?.subscription?.maxUsers || 1,
    pixCode: `00020126580014BR.GOV.BCB.PIX0136pix-${Date.now()}520400005303986540${amount.toFixed(2)}5802BR5925AIVOUCHER SAAS BRASIL6009SAO PAULO62070503***6304E3A1`,
    barcode: `34191.79001 01043.510047 91020.150008 8 98350000${Math.floor(amount * 100)}`,
    nfeTaxRate: 2.5,
    nfeTaxValue: Number((amount * 0.025).toFixed(2)),
    nfeServiceDescription: `Licenciamento de software e plataforma SaaS de gestão de vouchers turísticos AiVoucher - RomamiaViagens®. Código 1.05.`,
    nfeStatus: "not_emitted"
  };

  store.invoices.unshift(newInvoice);
  await saveStore(store);
  res.status(201).json(newInvoice);
});

// Emit electronic service invoice (NFS-e)
app.post("/api/saas/invoices/:id/emit-nfe", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = (store.invoices || []).findIndex((inv) => inv.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Fatura não encontrada" });
  }

  const invoice = store.invoices[index];
  const nfeNum = `NFS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const verifCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  invoice.nfeNumber = nfeNum;
  invoice.nfeSeries = "E";
  invoice.nfeVerificationCode = verifCode;
  invoice.nfeEmittedAt = new Date().toISOString();
  invoice.nfeStatus = "emitted";
  invoice.nfeTaxRate = 2.5;
  invoice.nfeTaxValue = Number((invoice.amount * 0.025).toFixed(2));

  await saveStore(store);
  res.json({ success: true, invoice });
});

// Helper to generate next recurring invoice automatically upon payment
function generateNextRecurringInvoice(store: any, agency: any, paidInvoice?: any) {
  if (!agency || !agency.subscription || agency.subscription.status === "cancelled") return;
  const nextDueStr = agency.subscription.nextDueDate;
  if (!nextDueStr) return;

  const existingNextInv = (store.invoices || []).find(
    (i: any) => i.agencyId === agency.id && (i.status === "pending" || i.status === "overdue") && i.dueDate === nextDueStr
  );
  if (!existingNextInv) {
    const invNumber = `FAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nextDueDateObj = new Date(nextDueStr + "T00:00:00");
    const nextPeriod = `Mensalidade ${nextDueDateObj.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
    const monthlyFee = Number(agency.subscription.monthlyFee) || (paidInvoice ? Number(paidInvoice.amount) : 299);
    const nextInvoice = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber: invNumber,
      agencyId: agency.id,
      agencyName: agency.name,
      agencyCnpj: agency.cnpj,
      amount: monthlyFee,
      dueDate: nextDueStr,
      status: "pending",
      billingPeriod: nextPeriod,
      usersCount: agency.subscription.maxUsers || 5,
      pixCode: `00020126580014BR.GOV.BCB.PIX0136${agency.id}-charge520400005303986540${monthlyFee.toFixed(2)}5802BR5925AIVOUCHER SAAS BRASIL6009SAO PAULO62070503***6304ABCD`,
      barcode: `34191.79001 01043.510047 91020.150008 8 98350000${Math.floor(monthlyFee * 100)}`,
      nfeTaxRate: 2.5,
      nfeTaxValue: Number((monthlyFee * 0.025).toFixed(2)),
      nfeServiceDescription: `Licenciamento de software em nuvem AiVoucher - RomamiaViagens® - Plano ${agency.subscription.planName || "Assinatura"} (${agency.subscription.maxUsers || 5} usuários). Código 1.05.`,
      nfeStatus: "not_emitted"
    };
    store.invoices.unshift(nextInvoice);
  }
}

// Pay invoice
app.post("/api/saas/invoices/:id/pay", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = (store.invoices || []).findIndex((inv) => inv.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Fatura não encontrada" });
  }

  const invoice = store.invoices[index];
  invoice.status = "paid";
  invoice.paidAt = new Date().toISOString();
  if (req.body.paymentType) invoice.paymentType = req.body.paymentType;

  // If not yet emitted NFS-e, auto-emit upon payment
  if (invoice.nfeStatus !== "emitted") {
    invoice.nfeNumber = `NFS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    invoice.nfeSeries = "E";
    invoice.nfeVerificationCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    invoice.nfeEmittedAt = invoice.paidAt;
    invoice.nfeStatus = "emitted";
  }

  // Auto-desbloqueio da agência caso estivesse suspensa por falta de pagamento
  const agency = (store.agencies || []).find((a) => a.id === invoice.agencyId);
  if (agency && agency.subscription) {
    const tolerance = Number(store.platformSettings?.delinquencyDaysTolerance) || 3;
    const otherDelinquent = (store.invoices || []).some(
      (inv) => inv.id !== invoice.id && inv.agencyId === agency.id && (inv.status === "pending" || inv.status === "overdue") && calculateBusinessDaysOverdue(inv.dueDate) >= tolerance
    );
    if (!otherDelinquent) {
      agency.subscription.status = "active";
      agency.subscription.blockedReason = undefined;
      agency.subscription.blockedAt = undefined;
      agency.subscription.businessDaysOverdue = 0;
    }
    if (agency.subscription.nextDueDate) {
      const curDue = new Date(agency.subscription.nextDueDate + "T00:00:00");
      curDue.setMonth(curDue.getMonth() + 1);
      agency.subscription.nextDueDate = curDue.toISOString().split("T")[0];
    }
    // Geração recorrente automática da próxima fatura
    generateNextRecurringInvoice(store, agency, invoice);
  }

  await saveStore(store);
  res.json({ success: true, invoice, agencySubscription: agency?.subscription });
});

// Delete invoice (Exclusão definitiva de fatura pelo Master)
app.delete("/api/saas/invoices/:id", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = (store.invoices || []).findIndex((inv) => inv.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Fatura não encontrada" });
  }

  const deletedInvoice = store.invoices.splice(index, 1)[0];

  // Re-avalia se a agência deve ser desbloqueada após a remoção da fatura
  await evaluateAgencyDelinquency(store);
  await saveStore(store);

  res.json({ success: true, deletedInvoice });
});

// Desbloqueio direto pelo Master
app.post("/api/saas/agencies/:id/unblock", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const agency = (store.agencies || []).find((a) => a.id === id);
  if (!agency) return res.status(404).json({ error: "Agência não encontrada" });

  if (agency.subscription) {
    agency.subscription.status = "active";
    agency.subscription.blockedReason = undefined;
    agency.subscription.blockedAt = undefined;
    agency.subscription.businessDaysOverdue = 0;
  }
  await saveStore(store);
  res.json({ success: true, agency });
});

// Helper: Calculate PIX CRC16 CCITT
function calculatePixCRC16(payload: string): string {
  const data = payload + '6304';
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generateValidPixCopiaECola(pixKey: string, merchantName: string, merchantCity: string, amount: number, txId: string): string {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  let payload = formatField('00', '01');
  payload += formatField('01', '12');

  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', pixKey);
  payload += formatField('26', gui + key);

  payload += formatField('52', '0000');
  payload += formatField('53', '986');
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }
  payload += formatField('58', 'BR');
  payload += formatField('59', merchantName.slice(0, 25));
  payload += formatField('60', merchantCity.slice(0, 15));

  const txIdField = formatField('05', txId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25));
  payload += formatField('62', txIdField);

  payload += '6304';
  const crc = calculatePixCRC16(payload.slice(0, -4));
  return payload + crc;
}

// Mercado Pago Payment Creation for Invoice
app.post("/api/saas/invoices/:id/create-mp-payment", async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const invoice = (store.invoices || []).find((inv) => inv.id === id);
  if (!invoice) return res.status(404).json({ error: "Fatura não encontrada" });

  const agency = (store.agencies || []).find((a) => a.id === invoice.agencyId);
  const settings = store.platformSettings || {};
  const mpToken = settings.mercadopagoAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (mpToken) {
    try {
      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const notificationUrl = `${protocol}://${host}/api/webhooks/mercadopago`;

      const cleanCnpj = invoice.agencyCnpj ? invoice.agencyCnpj.replace(/\D/g, "") : "";
      const payerObj: any = {
        email: agency?.email || agency?.masterLoginEmail || "financeiro@aivoucher.com.br",
        first_name: (invoice.agencyName || "Agencia").split(" ")[0].slice(0, 30),
        last_name: (invoice.agencyName || "Agencia").split(" ").slice(1).join(" ").slice(0, 30) || "Cliente"
      };
      if (cleanCnpj.length === 14) {
        payerObj.identification = { type: "CNPJ", number: cleanCnpj };
      } else if (cleanCnpj.length === 11) {
        payerObj.identification = { type: "CPF", number: cleanCnpj };
      }

      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `inv-${invoice.id}-${Date.now()}`
        },
        body: JSON.stringify({
          transaction_amount: Number(invoice.amount.toFixed(2)),
          description: `AiVoucher - Fatura ${invoice.invoiceNumber} (${invoice.agencyName})`,
          payment_method_id: "pix",
          payer: payerObj,
          notification_url: notificationUrl,
          external_reference: invoice.id
        })
      });

      const mpData = await mpResponse.json();
      if (mpResponse.ok && mpData.id) {
        invoice.mpPaymentId = String(mpData.id);
        invoice.mpStatus = mpData.status;
        invoice.paymentType = "mercadopago_pix";
        if (mpData.point_of_interaction?.transaction_data) {
          invoice.mpQrCode = mpData.point_of_interaction.transaction_data.qr_code;
          invoice.mpQrCodeBase64 = mpData.point_of_interaction.transaction_data.qr_code_base64;
          invoice.pixCode = mpData.point_of_interaction.transaction_data.qr_code;
          invoice.mpTicketUrl = mpData.point_of_interaction.transaction_data.ticket_url;
        }
        await saveStore(store);
        return res.json({ success: true, invoice, live: true });
      } else {
        console.warn("Mercado Pago API response error/warning:", mpData);
      }
    } catch (mpErr) {
      console.warn("Mercado Pago request error, using robust fallback code:", mpErr);
    }
  }

  // Fallback: PIX dinâmico formatado com CRC16 válido (Chave PIX da plataforma ou default)
  const pixKeyFallback = settings.itauPixKey || "54.892.120/0001-44";
  const merchantName = "AIVOUCHER SAAS";
  const merchantCity = "SAO PAULO";
  const generatedPix = generateValidPixCopiaECola(pixKeyFallback, merchantName, merchantCity, Number(invoice.amount), invoice.id);
  
  invoice.pixCode = generatedPix;
  invoice.mpQrCode = generatedPix;
  invoice.paymentType = "mercadopago_pix";
  await saveStore(store);

  res.json({ success: true, invoice, live: false, warning: "Usando PIX dinâmico com CRC16 válido (API do Mercado Pago não retornou transação)" });
});

// Mercado Pago Webhook / IPN Notification Endpoint
app.post("/api/webhooks/mercadopago", async (req, res) => {
  try {
    const store = await getStore();
    const settings = store.platformSettings || {};
    const mpToken = settings.mercadopagoAccessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;

    const paymentId = req.body?.data?.id || req.body?.id || req.query?.id || req.query?.["data.id"];
    console.log("Recebido Webhook Mercado Pago:", { paymentId, body: req.body });

    let isApproved = false;
    let externalRef = "";
    let approvedPaymentId = String(paymentId || "");

    if (mpToken && paymentId) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { "Authorization": `Bearer ${mpToken}` }
        });
        if (mpRes.ok) {
          const paymentDetails = await mpRes.json();
          if (paymentDetails.status === "approved") {
            isApproved = true;
            externalRef = paymentDetails.external_reference || "";
          }
        }
      } catch (e) {
        console.warn("Error querying Mercado Pago payment status:", e);
      }
    }

    if (isApproved && (externalRef || approvedPaymentId)) {
      const invoice = (store.invoices || []).find(
        (inv) => inv.id === externalRef || inv.mpPaymentId === approvedPaymentId
      );

      if (invoice && invoice.status !== "paid") {
        invoice.status = "paid";
        invoice.paidAt = new Date().toISOString();
        invoice.mpStatus = "approved";

        // Auto emit NFS-e
        if (invoice.nfeStatus !== "emitted") {
          invoice.nfeNumber = `NFS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
          invoice.nfeSeries = "E";
          invoice.nfeVerificationCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          invoice.nfeEmittedAt = invoice.paidAt;
          invoice.nfeStatus = "emitted";
        }

        // DESBLOQUEIO AUTOMÁTICO DA AGÊNCIA
        const agency = (store.agencies || []).find((a) => a.id === invoice.agencyId);
        if (agency && agency.subscription) {
          agency.subscription.status = "active";
          agency.subscription.blockedReason = undefined;
          agency.subscription.blockedAt = undefined;
          agency.subscription.businessDaysOverdue = 0;

          if (agency.subscription.nextDueDate) {
            const curDue = new Date(agency.subscription.nextDueDate + "T00:00:00");
            curDue.setMonth(curDue.getMonth() + 1);
            agency.subscription.nextDueDate = curDue.toISOString().split("T")[0];
          }

          // Geração recorrente automática da próxima fatura
          generateNextRecurringInvoice(store, agency, invoice);
        }

        await saveStore(store);
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook Mercado Pago error:", err);
    res.status(200).send("OK");
  }
});

// -------------------------------------------------------------
// Agency, Companies & Vouchers Endpoints (Tenant-Aware)
// -------------------------------------------------------------

app.get("/api/agency", async (req, res) => {
  const store = await getStore();
  await evaluateAgencyDelinquency(store);

  const targetId = (req.query.agencyId as string) || (req.headers["x-agency-id"] as string);

  if (!targetId) {
    return res.status(400).json({ error: "ID da agência não fornecido" });
  }

  const agency = (store.agencies || []).find((a) => a.id === targetId);
  
  if (!agency) {
    return res.status(404).json({ error: "Agência não encontrada" });
  }

  // Calculate monthly vouchers count for this agency
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyVouchersCount = (store.vouchers || []).filter(
    (v: any) => v.agencyId === agency.id && (v.createdAt || "").startsWith(currentYearMonth)
  ).length;

  if (agency.subscription) {
    agency.subscription.vouchersIssuedThisMonth = monthlyVouchersCount;
  }

  // Attach dynamic active users count
  const usersCount = (store.agencyUsers || []).filter((u) => u.agencyId === agency.id && u.status === "active").length;
  res.json({ 
    ...agency, 
    activeUsersCount: usersCount,
    vouchersCount: (store.vouchers || []).filter((v) => v.agencyId === agency.id).length 
  });
});

app.put("/api/agency", async (req, res) => {
  const store = await getStore();
  const targetId = req.body.id || (req.query.agencyId as string) || (req.headers["x-agency-id"] as string) || (store.agencies[0] && store.agencies[0].id);

  const index = (store.agencies || []).findIndex((a) => a.id === targetId);
  if (index === -1) {
    store.agencies.push(req.body);
    await saveStore(store);
    return res.json(req.body);
  }

  store.agencies[index] = { ...store.agencies[index], ...req.body };
  await saveStore(store);
  res.json(store.agencies[index]);
});

// Companies endpoints (Tenant-Aware)
app.get("/api/companies", async (req, res) => {
  const store = await getStore();
  const agencyId = (req.query.agencyId as string) || (req.headers["x-agency-id"] as string);

  let list = store.companies || [];
  if (agencyId) {
    list = list.filter((c) => c.agencyId === agencyId || !c.agencyId);
  }
  res.json(list);
});

app.post("/api/companies", async (req, res) => {
  const store = await getStore();
  const agencyId = req.body.agencyId || (req.query.agencyId as string) || (req.headers["x-agency-id"] as string) || (store.agencies[0] && store.agencies[0].id);

  const newCompany = {
    id: `comp-${Date.now()}`,
    agencyId,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  store.companies.unshift(newCompany);
  await saveStore(store);
  res.status(201).json(newCompany);
});

app.put("/api/companies/:id", async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = store.companies.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Empresa não encontrada" });
  }
  store.companies[index] = { ...store.companies[index], ...req.body };
  await saveStore(store);
  res.json(store.companies[index]);
});

app.delete("/api/companies/:id", async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  store.companies = store.companies.filter((c) => c.id !== id);
  await saveStore(store);
  res.json({ success: true });
});

// Vouchers endpoints (Tenant-Aware)
app.get("/api/vouchers", async (req, res) => {
  const agencyId = (req.query.agencyId as string) || (req.headers["x-agency-id"] as string);
  try {
    const store = await getStore();
    let list = store.vouchers || [];
    if (agencyId) {
      list = list.filter((v: any) => v.agencyId === agencyId);
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

app.post("/api/vouchers", async (req, res) => {
  const agencyId = req.body.agencyId || (req.query.agencyId as string) || (req.headers["x-agency-id"] as string);

  try {
    const store = await getStore();
    await evaluateAgencyDelinquency(store);

    if (agencyId) {
      const agency = (store.agencies || []).find((a: any) => a.id === agencyId);
      if (agency && agency.subscription) {
        if (agency.subscription.status === "blocked") {
          return res.status(403).json({
            error: "Acesso suspenso por pendência financeira. Regularize sua assinatura no menu de cobrança para emitir novos vouchers.",
            code: "AGENCY_BLOCKED"
          });
        }

        const maxVouchers = agency.subscription.maxVouchersPerMonth;
        if (maxVouchers !== undefined && maxVouchers > 0) {
          const now = new Date();
          const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const currentMonthCount = (store.vouchers || []).filter(
            (v: any) => v.agencyId === agencyId && (v.createdAt || "").startsWith(currentYearMonth)
          ).length;

          if (currentMonthCount >= maxVouchers) {
            return res.status(403).json({
              error: `Você atingiu o limite mensal de emissão de PDFs do seu plano (${currentMonthCount}/${maxVouchers} vouchers emitidos neste mês). Entre em contato com o suporte para solicitar um upgrade de plano.`,
              code: "PDF_LIMIT_REACHED",
              limit: maxVouchers,
              current: currentMonthCount
            });
          }
        }
      }
    }

    const newVoucher = {
      ...req.body,
      id: req.body.id || `vouch-${Date.now()}`,
      agencyId,
      voucherNumber: req.body.voucherNumber || `VOU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: req.body.status || "emitted"
    };

    store.vouchers = store.vouchers || [];
    const idx = store.vouchers.findIndex((v: any) => v.id === newVoucher.id);
    if (idx >= 0) {
      store.vouchers[idx] = newVoucher;
    } else {
      store.vouchers.push(newVoucher);
    }
    await saveStore(store);
    res.status(201).json(newVoucher);
  } catch (err) {
    res.status(500).json({ error: "Failed to save voucher" });
  }
});

app.put("/api/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = store.vouchers.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Voucher não encontrado" });
  }
  store.vouchers[index] = { ...store.vouchers[index], ...req.body };
  await saveStore(store);
  res.json(store.vouchers[index]);
});

app.delete("/api/vouchers/:id", async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  store.vouchers = store.vouchers.filter((v) => v.id !== id);
  await saveStore(store);
  res.json({ success: true });
});

// -------------------------------------------------------------
// Gemini Voucher Parser endpoint
// -------------------------------------------------------------
app.post("/api/parse-voucher", async (req, res) => {
  try {
    const { text, fileBase64, mimeType, files } = req.body;

    if (!text && !fileBase64 && (!files || files.length === 0)) {
      return res.status(400).json({ error: "Envie um texto ou anexe arquivos (PDF ou imagem) para extração." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Helper to extract heuristically if Gemini key is absent or on transient error
    const fallbackParse = (rawText: string) => {
      const pnrMatch = rawText.match(/\b([A-Z0-9]{6})\b/) || rawText.match(/localizador[:\s]+([A-Z0-9]+)/i) || rawText.match(/reserva[:\s]+([A-Z0-9-]+)/i) || rawText.match(/ap[óo]lice[:\s]+([A-Z0-9-]+)/i);
      const isCar = /localiza|movida|avis|hertz|alamo|loca[çc][ãa]o|ve[íi]culo|rent a car/i.test(rawText);
      const isInsurance = /assist card|seguro|ap[óo]lice|universal assistance|gta|affinity|allianz|dmh/i.test(rawText);
      const isTicket = /ingresso|disney|beto carrero|atra[çc][ãa]o|parque|universal studios|passaporte/i.test(rawText);
      const isCruise = /cruzeiro|navio|msc|costa|royal caribbean|cabine|porto de/i.test(rawText);
      const isPackage = /pacote|combo multisservi[çc]o|a[ée]reo.*hotel.*carro/i.test(rawText);
      const isHotel = /hotel|pousada|resort|hospedagem|check-in|check-out|bourbon|di[áa]rias/i.test(rawText);

      const isGol = /gol/i.test(rawText);
      const isLatam = /latam/i.test(rawText);
      const isAzul = /azul/i.test(rawText);
      const hasFlightTerms = isGol || isLatam || isAzul || /voo|bilhete|a[ée]reo|embarque|aeroporto|escala|conex[ãa]o/i.test(rawText);

      const servicesDetectedCount = [hasFlightTerms, isHotel, isCar, isInsurance, isTicket, isCruise].filter(Boolean).length;

      let serviceType: any = "flight";
      if (servicesDetectedCount > 1 || isPackage) serviceType = "package";
      else if (isCruise) serviceType = "cruise";
      else if (isTicket) serviceType = "ticket";
      else if (isInsurance) serviceType = "insurance";
      else if (isCar) serviceType = "car";
      else if (isHotel) serviceType = "hotel";
      else if (hasFlightTerms) serviceType = "flight";

      const airline = isLatam ? "LATAM Airlines" : isGol ? "GOL Linhas Aéreas" : isAzul ? "Azul Linhas Aéreas" : "Companhia Aérea";
      const airlineCode = isLatam ? "LA" : isGol ? "G3" : isAzul ? "AD" : "XX";

      const includeFlights = serviceType === "flight" || serviceType === "package" || hasFlightTerms;

      const demoHotel = isHotel || isPackage ? {
        hotelName: "Bourbon Curitiba Hotel & Suites",
        address: "Rua Cândido Lopes, 102 - Centro",
        city: "Curitiba - PR",
        checkInDate: "18/10/2026",
        checkInTime: "14:00",
        checkOutDate: "21/10/2026",
        checkOutTime: "12:00",
        nights: 3,
        roomType: "Superior Casal",
        mealPlan: "Café da Manhã Incluso",
        confirmationCode: "HTL-99824",
        guestsNames: ["Hóspede Titular"]
      } : null;

      const demoCar = isCar || isPackage ? {
        rentalCompany: "Localiza Hertz",
        confirmationCode: "LOC-882941X",
        carModelOrCategory: "Grupo C - Sedan Automático (Onix Plus)",
        pickupLocation: "Balcão Aeroporto Guarulhos (GRU) Terminal 2",
        pickupDate: "15/09/2026",
        pickupTime: "10:00",
        dropoffLocation: "Balcão Aeroporto Guarulhos (GRU) Terminal 2",
        dropoffDate: "20/09/2026",
        dropoffTime: "18:00",
        driverName: "EDUARDO CARVALHO DA SILVA",
        driverDocument: "04981294819",
        includedCoverage: "Proteção Total LDW com KM Livre",
        notes: "Apresentar CNH física ou digital e cartão de crédito para caução."
      } : null;

      const demoInsurance = isInsurance || isPackage ? {
        provider: "Assist Card",
        policyNumber: "AC-BR-9902183",
        planName: "Assist Card 60K Internacional",
        startDate: "15/10/2026",
        endDate: "30/10/2026",
        medicalCoverage: "USD 60.000,00",
        covidCoverage: "USD 15.000,00",
        baggageCoverage: "USD 1.200,00",
        emergencyPhone24h: "+54 9 11 2703-9665 (WhatsApp 24h) ou 0800 770 1664",
        insuredNames: ["EDUARDO CARVALHO DA SILVA"]
      } : null;

      const demoTicket = isTicket || isPackage ? {
        attractionName: "Magic Kingdom Park - Walt Disney World",
        supplierOrPark: "Disney Destinations",
        ticketType: "1-Day Standard Theme Park Ticket",
        ticketNumberOrCode: "WDW-88390218",
        date: "22/10/2026",
        time: "09:00",
        locationOrAddress: "Catracas Principais - Magic Kingdom Entrance, Orlando FL",
        passengersOrHolders: ["EDUARDO CARVALHO DA SILVA"],
        importantInstructions: "Vincule o código ao app My Disney Experience ou apresente este voucher na catraca."
      } : null;

      const demoCruise = isCruise ? {
        cruiseLine: "MSC Cruzeiros",
        shipName: "MSC Grandiosa",
        bookingNumber: "MSC-7749102",
        cabinNumber: "11042",
        cabinCategory: "Varanda Fantastica com Vista para o Mar",
        departurePort: "Concais - Porto de Santos, SP",
        departureDate: "14/11/2026",
        departureTime: "11:30",
        arrivalPort: "Porto de Santos, SP",
        arrivalDate: "21/11/2026",
        itinerarySummary: "Santos > Ilhabela > Búzios > Salvador > Ilhéus > Santos (7 noites)",
        mealPlan: "All Inclusive de Bebidas Easy Drink & Refeições Principais",
        passengers: ["CARLOS EDUARDO VALENÇA"]
      } : null;

      return {
        pnr: pnrMatch ? pnrMatch[1].toUpperCase() : "BR" + Math.floor(1000 + Math.random() * 9000),
        serviceType,
        passengers: [
          {
            name: "PASSAGEIRO / TITULAR",
            ticketNumber: "957-" + Math.floor(1000000000 + Math.random() * 9000000000),
            document: "CPF",
            birthDate: "",
            loyaltyNumber: "",
            seat: "12A"
          }
        ],
        flights: includeFlights ? [
          {
            airline,
            airlineCode,
            flightNumber: `${airlineCode} ${Math.floor(1000 + Math.random() * 9000)}`,
            departureAirport: "Aeroporto de Origem",
            departureCode: "GRU",
            departureCity: "São Paulo - SP",
            departureDate: new Date().toLocaleDateString("pt-BR"),
            departureTime: "08:30",
            departureTerminal: "Terminal 2",
            arrivalAirport: "Aeroporto de Destino",
            arrivalCode: "SDU",
            arrivalCity: "Rio de Janeiro - RJ",
            arrivalDate: new Date().toLocaleDateString("pt-BR"),
            arrivalTime: "09:40",
            arrivalTerminal: "Terminal 1",
            cabinClass: "Econômica",
            bookingClass: "Y",
            fareFamily: "Plus",
            baggageHand: "1 Mochila + 1 Mala de bordo até 10kg",
            baggageChecked: "1 Peça até 23kg inclusa",
            aircraft: "Airbus A320",
            duration: "1h 10m"
          }
        ] : [],
        hotel: demoHotel,
        hotels: demoHotel ? [demoHotel] : [],
        carRental: demoCar,
        carRentals: demoCar ? [demoCar] : [],
        insurance: demoInsurance,
        insurances: demoInsurance ? [demoInsurance] : [],
        ticket: demoTicket,
        tickets: demoTicket ? [demoTicket] : [],
        cruise: demoCruise,
        cruises: demoCruise ? [demoCruise] : [],
        pricing: {
          currency: "BRL",
          fare: 1250.00,
          taxes: 78.90,
          serviceFee: 50.00,
          otherFees: 0.00,
          total: 1378.90
        },
        notes: ""
      };
    };

    if (!apiKey) {
      console.warn("GEMINI_API_KEY não configurada no servidor. Utilizando parser de demonstração estruturado.");
      const demoData = fallbackParse(text || "Voo G3 1500 São Paulo Rio de Janeiro");
      return res.json({
        success: true,
        data: demoData,
        warning: "Chave GEMINI_API_KEY não detectada nas variáveis de ambiente. Configure no painel Settings > Secrets do Google AI Studio para ativar a chamada direta com a API do Gemini."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const systemPrompt = `Você é o AiVoucher Intelligence Engine, especialista em consolidação de viagens e emissão de vouchers de turismo profissionais no padrão A4.

O usuário pode anexar 1 OU MÚLTIPLOS DOCUMENTOS/ARQUIVOS (exemplo: bilhetes aéreos, confirmações de hotéis distintos, locações de veículos, apólices de seguro, ingressos, cruzeiros, traslados).

================================================================================
DIRETRIZ MÁXIMA MULTI-DOCUMENTOS (LEITURA COMPLETA DE TODOS OS ANEXOS):
================================================================================
1. VOCÊ DEVE OBRIGATORIAMENTE ANALISAR CADA UM DOS ARQUIVOS/DOCUMENTOS ANEXADOS DO INÍCIO AO FIM.
2. É ESTRITAMENTE PROIBIDO parar após ler o primeiro documento ou ignorar qualquer anexo!
3. Se foram enviados 3 documentos (por exemplo: Hotel A, Hotel B e um Aéreo, ou 3 Hotéis com datas distintas), você DEVE extrair as informações de TODOS OS 3 DOCUMENTOS!
4. Se houver múltiplos comprovantes ou mais de 1 serviço, defina OBRIGATORIAMENTE "serviceType": "package".

================================================================================
REGRA ABSOLUTA DE SEPARAÇÃO: CADA HOTEL DEVE SER UM BLOCO INDEPENDENTE
================================================================================
JAMAIS, SOB HIPÓTESE ALGUMA, CONCATENE, JUNTE OU MISTURE HOTÉIS DIFERENTES EM UMA ÚNICA LINHA OU STRING!
- É expressamente PROIBIDO retornar no nome do hotel textos como: "Hotel A de 14 a 17, Hotel B de 17 a 18"!
- É expressamente PROIBIDO juntar endereços em uma linha única!
- SE HOUVER 2 OU MAIS HOTÉIS (ou 2 ou mais anexos de hospedagem):
  CRIE OBRIGATORIAMENTE UM OBJETO INDEPENDENTE PARA CADA HOTEL no array "hotels":
  * hotels[0]: Hotel A (com seu respectivo hotelName, checkInDate, checkOutDate, address, confirmationCode, roomType, mealPlan, guestsNames, etc.).
  * hotels[1]: Hotel B (com seu respectivo hotelName, checkInDate, checkOutDate, address, confirmationCode, roomType, mealPlan, guestsNames, etc.).
  * hotels[2]: Hotel C (se houver, com seus dados próprios).
- CADA HOTEL DEVE TER SEU PRÓPRIO CÓDIGO DE CONFIRMAÇÃO/RESERVA ESPECÍFICO em "confirmationCode".

- O MESMO VALE PARA OS DEMAIS PRODUTOS:
  * "carRentals": Cada locação de veículo é um item separado no array (empresa, categoria, datas/locais de retirada e devolução, condutor, etc.).
  * "insurances": Cada apólice de seguro é um item separado (seguradora, plano, apólice, vigência início/fim, coberturas, telefone de emergência).
  * "tickets": Cada atração ou ingresso é um item separado (nome da atração, fornecedor, tipo de ingresso, data, horário, código, instruções).
  * "cruises": Cada cruzeiro é um item separado.
  * "transfers": Cada traslado/transfer é um item separado.
  * "flights": Cada trecho de voo em ordem cronológica de embarque.

================================================================================
REGRA ABSOLUTA E RESTRITIVA DE QR CODE E CÓDIGO DE BARRAS:
================================================================================
1. SOMENTE extraia "qrCodeData" ou "barcodeData" se o documento anexado contiver VISIVELMENTE e GRAFICAMENTE uma imagem real de QR Code ou Código de Barras escaneável (como em cartões de embarque de companhias aéreas ou ingressos de parques/catracas).
2. Se o documento contiver apenas texto, tabelas, números de confirmação, localizador (PNR), CPF ou e-ticket sem imagem real de código de barras ou QR Code:
   DEIXE OBRIGATORIAMENTE os campos "qrCodeData", "barcodeData", "barcodeType" e "codeImageBase64" como VAZIOS/UNDEFINED/NULL!
3. É TERMINANTEMENTE PROIBIDO:
   - Inventar, simular ou gerar QR Code a partir de PNR, localizador, código de confirmação, CPF ou número do bilhete se não houver um código gráfico no comprovante original.
   - Colocar QR Code no nível da raiz do voucher. Cada código deve pertencer EXCLUSIVAMENTE ao quadro do serviço correspondente (ex: dentro do voo específico em "flights[].qrCodeData", no hotel em "hotels[].qrCodeData", ou no ingresso em "tickets[].barcodeData").
4. Se houver código de barras tradicional escaneável no documento, identifique o padrão no campo "barcodeType" ("CODE128", "EAN13", "CODE39", "PDF417", "AZTEC", "QR_CODE").

Retorne APENAS um JSON válido estritamente no esquema abaixo:

{
  "pnr": "string",
  "serviceType": "flight" | "hotel" | "car" | "insurance" | "ticket" | "cruise" | "package",
  "passengers": [
    {"name": "string", "ticketNumber": "string", "document": "string", "birthDate": "string", "loyaltyNumber": "string", "seat": "string"}
  ],
  "flights": [
    {
      "airline": "string",
      "airlineCode": "string",
      "flightNumber": "string",
      "isInternational": boolean,
      "departureAirport": "string",
      "departureCode": "string",
      "departureCity": "string",
      "departureDate": "string",
      "departureTime": "string",
      "arrivalAirport": "string",
      "arrivalCode": "string",
      "arrivalCity": "string",
      "arrivalDate": "string",
      "arrivalTime": "string",
      "cabinClass": "string",
      "bookingClass": "string",
      "fareFamily": "string",
      "baggageHand": "string",
      "baggageChecked": "string",
      "aircraft": "string",
      "duration": "string",
      "qrCodeData": "string",
      "barcodeData": "string",
      "barcodeType": "string"
    }
  ],
  "hotels": [
    {
      "hotelName": "string",
      "address": "string",
      "city": "string",
      "checkInDate": "string",
      "checkInTime": "string",
      "checkOutDate": "string",
      "checkOutTime": "string",
      "nights": number,
      "roomType": "string",
      "mealPlan": "string",
      "confirmationCode": "string",
      "guestsNames": ["string"],
      "qrCodeData": "string",
      "barcodeData": "string",
      "barcodeType": "string",
      "notes": "string"
    }
  ],
  "carRentals": [
    {
      "rentalCompany": "string",
      "confirmationCode": "string",
      "carModelOrCategory": "string",
      "pickupLocation": "string",
      "pickupDate": "string",
      "pickupTime": "string",
      "dropoffLocation": "string",
      "dropoffDate": "string",
      "dropoffTime": "string",
      "driverName": "string",
      "driverDocument": "string",
      "includedCoverage": "string",
      "qrCodeData": "string",
      "barcodeData": "string",
      "notes": "string"
    }
  ],
  "insurances": [
    {
      "provider": "string",
      "policyNumber": "string",
      "planName": "string",
      "startDate": "string",
      "endDate": "string",
      "medicalCoverage": "string",
      "covidCoverage": "string",
      "baggageCoverage": "string",
      "emergencyPhone24h": "string",
      "insuredNames": ["string"],
      "qrCodeData": "string",
      "barcodeData": "string",
      "notes": "string"
    }
  ],
  "tickets": [
    {
      "attractionName": "string",
      "supplierOrPark": "string",
      "ticketType": "string",
      "ticketNumberOrCode": "string",
      "date": "string",
      "time": "string",
      "locationOrAddress": "string",
      "passengersOrHolders": ["string"],
      "importantInstructions": "string",
      "qrCodeData": "string",
      "barcodeData": "string",
      "barcodeType": "string"
    }
  ],
  "cruises": [
    {
      "cruiseLine": "string",
      "shipName": "string",
      "bookingNumber": "string",
      "cabinNumber": "string",
      "cabinCategory": "string",
      "departurePort": "string",
      "departureDate": "string",
      "departureTime": "string",
      "arrivalPort": "string",
      "arrivalDate": "string",
      "itinerarySummary": "string",
      "mealPlan": "string",
      "passengers": ["string"],
      "qrCodeData": "string",
      "barcodeData": "string"
    }
  ],
  "transfers": [
    {
      "serviceType": "string",
      "pickupLocation": "string",
      "pickupDateTime": "string",
      "dropoffLocation": "string",
      "vehicleType": "string",
      "contactPhone": "string",
      "qrCodeData": "string",
      "barcodeData": "string"
    }
  ],
  "pricing": {
    "currency": "BRL" | "USD",
    "fare": number,
    "taxes": number,
    "serviceFee": number,
    "otherFees": number,
    "total": number
  },
  "qrCodeData": "string",
  "barcodeData": "string",
  "barcodeType": "string",
  "notes": "string"
}

DIRETRIZES CRÍTICAS DE CONSOLIDAÇÃO:
1. SE HOUVER MÚLTIPLOS SERVIÇOS (aéreo + hotel, ou múltiplos hotéis, aéreo + carro, etc.) OU MÚLTIPLOS ARQUIVOS, DEFINE OBRIGATORIAMENTE "serviceType": "package".
2. UNIFICAÇÃO DE PASSAGEIROS E HÓSPEDES:
   - Bilhetes aéreos podem ter certos passageiros, hotéis podem ter outros hóspedes.
   - Junte todos os viajantes no array "passengers" na raiz (sem duplicar).
   - Nos itens individuais ("hotels[].guestsNames", "insurances[].insuredNames", "tickets[].passengersOrHolders"), liste quem especificamente usufrui daquele serviço.
3. VALORES E TARIFAS: Some todas as tarifas e taxas para compor o total consolidado da viagem em "pricing".
4. RETORNE EXCLUSIVAMENTE O JSON PURO, sem markdown (\`\`\`json) e sem explicações externas.`;

    const parts: any[] = [];

    if (files && files.length > 0) {
      files.forEach((file: any, index: number) => {
        const cleanBase64 = file.base64 ? file.base64.replace(/^data:[^;]+;base64,/, "") : "";
        if (cleanBase64) {
          let resolvedMime = file.mimeType || "application/pdf";
          if (!file.mimeType) {
            if (cleanBase64.startsWith("JVBERi")) {
              resolvedMime = "application/pdf";
            } else if (cleanBase64.startsWith("/9j/")) {
              resolvedMime = "image/jpeg";
            } else if (cleanBase64.startsWith("iVBORw0KGgo")) {
              resolvedMime = "image/png";
            }
          }
          parts.push({
            text: `=== DOCUMENTO ANEXADO ${index + 1} de ${files.length}: "${file.name || `Comprovante_${index + 1}`}" ===`
          });
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: resolvedMime
            }
          });
        }
      });
    } else if (fileBase64) {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
      if (cleanBase64) {
        let resolvedMime = mimeType || "application/pdf";
        if (!mimeType) {
          if (cleanBase64.startsWith("JVBERi")) {
            resolvedMime = "application/pdf";
          } else if (cleanBase64.startsWith("/9j/")) {
            resolvedMime = "image/jpeg";
          } else if (cleanBase64.startsWith("iVBORw0KGgo")) {
            resolvedMime = "image/png";
          }
        }
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: resolvedMime
          }
        });
      }
    }

    const filesCount = (files && files.length > 0) ? files.length : (fileBase64 ? 1 : 0);
    const instructionMessage = filesCount > 1
      ? `ATENÇÃO MÁXIMA - MULTI-DOCUMENTOS: Foram enviados ${filesCount} arquivos/comprovantes de viagem distintos.
Você DEVE OBRIGATORIAMENTE analisar todos os ${filesCount} documentos do início ao fim e consolidar TUDO em um único PACOTE COMPLETO ('serviceType': 'package').
NÃO PARE após ler o primeiro anexo! Se foram enviados 3 comprovantes, extraia os dados de TODOS OS 3 COMPROVANTES!
- Para HOTÉIS: Cada reserva de hotel anexada DEVE SER um objeto separado no array 'hotels' (ex: hotels[0] para Hotel A com datas 14 a 17 e seu código de reserva, hotels[1] para Hotel B com datas 17 a 18 e seu código de reserva). JAMAIS concatene nomes de hotéis ou períodos em uma linha única!
- Para VOOS: Todos os trechos no array 'flights'.
- Para CARROS: Cada locação no array 'carRentals'.
- Para SEGUROS: Cada apólice no array 'insurances'.
- Para INGRESSOS: Cada atração no array 'tickets'.
- Para PASSAGEIROS: Junte todos os viajantes no array 'passengers' na raiz sem duplicar.

${text && text.trim() ? `Observações adicionais fornecidas:\n${text.trim()}` : ""}`
      : `Analise minuciosamente este comprovante de viagem e extraia com precisão cirúrgica todos os dados estruturados conforme o schema JSON solicitado.

${text && text.trim() ? `Observações adicionais fornecidas:\n${text.trim()}` : ""}`;

    parts.push({
      text: instructionMessage
    });

    try {
      const modelsToTry = ["gemini-3.8-flash", "gemini-1.5-flash", "gemini-flash-lite-latest"];
      let responseText = "";
      let successfulModel = "";
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
          try {
            attempts++;
            const response = await ai.models.generateContent({
              model: modelName,
              contents: { parts },
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.1,
                responseMimeType: "application/json"
              }
            });
            responseText = response.text || "";
            successfulModel = modelName;
            success = true;
          } catch (err: any) {
            lastError = err;
            const errString = String(err?.message || err);
            const isTransient = errString.includes("503") || errString.includes("429") || errString.includes("UNAVAILABLE") || errString.includes("RESOURCE_EXHAUSTED") || errString.includes("high demand");
            
            if (isTransient && attempts < maxAttempts) {
              const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
              console.warn(`[Gemini API] Model ${modelName} returned temporary error (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              break; // Try next model or fail
            }
          }
        }

        if (success) break;
        console.warn(`[Gemini API] Model ${modelName} failed after ${attempts} attempts. Trying fallback model...`);
      }

      if (!responseText) {
        throw lastError || new Error("All Gemini models exhausted or unavailable.");
      }

      let parsedData = null;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleanJson);
      }

      if (parsedData && typeof parsedData === "object") {
        // Collect raw hotels
        let rawHotels: any[] = [];
        if (Array.isArray(parsedData.hotels) && parsedData.hotels.length > 0) {
          rawHotels = parsedData.hotels;
        } else if (parsedData.hotel) {
          rawHotels = [parsedData.hotel];
        }

        // Smart hotel separation if hotels were concatenated in a single string (e.g. "Hotel A de 14 a 17, Hotel B de 17 a 18")
        const processedHotels: any[] = [];
        for (const h of rawHotels) {
          const hName = (h.hotelName || "").trim();
          const hasMultiple =
            (hName.includes(", Hotel ") || hName.includes("; Hotel ") || hName.includes("\nHotel ")) ||
            /\bhotel\b.*?\bhotel\b/i.test(hName) ||
            (hName.includes(",") && (hName.includes(" de ") || hName.includes(" - ")) && /\d{1,2}/.test(hName));

          if (hasMultiple) {
            const segments = hName.split(/(?:,|\;|\n|\/)\s*(?=[A-ZÀ-Ú][a-zà-ú]*\s+Hotel|Hotel\s+|Pousada\s+|Resort\s+)/i);
            if (segments.length > 1) {
              const addressParts = (h.address || "").split(/(?:;|\n|\|)\s*/);
              const codeParts = (h.confirmationCode || "").split(/(?:,|\;|\/|\s*\|\s*)/);

              segments.forEach((seg: string, idx: number) => {
                const trimmedSeg = seg.trim();
                if (!trimmedSeg) return;

                let cleanName = trimmedSeg;
                let checkIn = h.checkInDate || "";
                let checkOut = h.checkOutDate || "";

                const dateMatch = trimmedSeg.match(/(?:de\s+)?(\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?)?)\s*(?:a|até|-)\s*(\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?)?)/i);
                if (dateMatch) {
                  checkIn = dateMatch[1];
                  checkOut = dateMatch[2];
                  cleanName = trimmedSeg.replace(dateMatch[0], "").replace(/\(\s*\)/g, "").trim();
                }

                processedHotels.push({
                  ...h,
                  hotelName: cleanName.replace(/^[,\s-]+|[,\s-]+$/g, "") || `Hotel #${idx + 1}`,
                  address: addressParts[idx] ? addressParts[idx].trim() : (idx === 0 ? h.address : ""),
                  checkInDate: checkIn,
                  checkOutDate: checkOut,
                  confirmationCode: codeParts[idx] ? codeParts[idx].trim() : (idx === 0 ? h.confirmationCode : "")
                });
              });
              continue;
            }
          }
          processedHotels.push(h);
        }

        parsedData.hotels = processedHotels;
        parsedData.hotel = processedHotels.length > 0 ? processedHotels[0] : null;

        // Normalize carRentals
        if (Array.isArray(parsedData.carRentals) && parsedData.carRentals.length > 0) {
          parsedData.carRental = parsedData.carRentals[0];
        } else if (parsedData.carRental) {
          parsedData.carRentals = [parsedData.carRental];
        } else {
          parsedData.carRentals = [];
        }

        // Normalize insurances
        if (Array.isArray(parsedData.insurances) && parsedData.insurances.length > 0) {
          parsedData.insurance = parsedData.insurances[0];
        } else if (parsedData.insurance) {
          parsedData.insurances = [parsedData.insurance];
        } else {
          parsedData.insurances = [];
        }

        // Normalize tickets
        if (Array.isArray(parsedData.tickets) && parsedData.tickets.length > 0) {
          parsedData.ticket = parsedData.tickets[0];
        } else if (parsedData.ticket) {
          parsedData.tickets = [parsedData.ticket];
        } else {
          parsedData.tickets = [];
        }

        // Normalize cruises
        if (Array.isArray(parsedData.cruises) && parsedData.cruises.length > 0) {
          parsedData.cruise = parsedData.cruises[0];
        } else if (parsedData.cruise) {
          parsedData.cruises = [parsedData.cruise];
        } else {
          parsedData.cruises = [];
        }

        // Normalize transfers
        if (Array.isArray(parsedData.transfers) && parsedData.transfers.length > 0) {
          parsedData.transfer = parsedData.transfers[0];
        } else if (parsedData.transfer) {
          parsedData.transfers = [parsedData.transfer];
        } else {
          parsedData.transfers = [];
        }

        // Multi-block / package auto-detection
        const totalItemsCount =
          (parsedData.flights?.length || 0) +
          (parsedData.hotels?.length || 0) +
          (parsedData.carRentals?.length || 0) +
          (parsedData.insurances?.length || 0) +
          (parsedData.tickets?.length || 0);

        if (
          parsedData.hotels.length > 1 ||
          parsedData.carRentals.length > 1 ||
          parsedData.insurances.length > 1 ||
          parsedData.tickets.length > 1 ||
          totalItemsCount > 1
        ) {
          parsedData.serviceType = "package";
        }

        // Elimina qualquer QR Code / Código de barras no nível raiz do voucher.
        // O usuário determinou estritamente que códigos só devem existir no quadro do respectivo serviço
        delete parsedData.qrCodeData;
        delete parsedData.barcodeData;
        delete parsedData.barcodeType;
      }

      res.json({
        success: true,
        data: parsedData,
        source: successfulModel
      });
    } catch (geminiError: any) {
      console.error("Erro na chamada do Gemini API após retentativas e fallbacks:", geminiError);
      // Fallback to structured parser so user form state is never lost
      const fallbackData = fallbackParse(text || "Voo");
      res.json({
        success: true,
        data: fallbackData,
        source: "fallback",
        warning: `Aviso Gemini API: ${geminiError?.message || "Serviço temporariamente sobrecarregado (503)"}. Carregamos dados estruturados preliminares para garantir que nenhum dado do seu formulário seja perdido.`
      });
    }
  } catch (error: any) {
    console.error("Gemini endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Falha ao processar o voucher."
    });
  }
});

// Diagnostic endpoint to check database status (Supabase / Store)
app.get("/api/debug/database", async (req, res) => {
  const status: any = {
    supabaseConfigured: !!(supabaseUrl && supabaseKey),
    supabaseUrlPresent: !!supabaseUrl,
    supabaseKeyPresent: !!supabaseKey,
    supabaseKeyLength: supabaseKey ? supabaseKey.length : 0,
    timestamp: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from("system_store").select("id, updated_at").limit(5);
      if (error) {
        status.supabaseStatus = "ERROR";
        status.supabaseError = error.message;
        status.supabaseDetails = error;
      } else {
        status.supabaseStatus = "CONNECTED";
        status.recordsFound = data?.length || 0;
        status.records = data;
      }
    } catch (e: any) {
      status.supabaseStatus = "EXCEPTION";
      status.supabaseError = e.message;
    }
  } else {
    status.supabaseStatus = "NOT_CONFIGURED (Missing SUPABASE_URL or SUPABASE_KEY in environment variables)";
  }

  const store = await getStore();
  status.currentMemoryStore = {
    agenciesCount: (store.agencies || []).length,
    usersCount: (store.agencyUsers || []).length,
    vouchersCount: (store.vouchers || []).length,
    companiesCount: (store.companies || []).length,
    invoicesCount: (store.invoices || []).length,
    sampleAgencies: (store.agencies || []).slice(0, 3).map(a => ({ id: a.id, name: a.name, email: a.email, masterLoginEmail: a.masterLoginEmail }))
  };

  res.json(status);
});

// -------------------------------------------------------------
// Start Server & Mount Vite Middleware
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        setHeaders: (res) => {
          res.setHeader("Access-Control-Allow-Origin", "*");
        }
      })
    );
    app.get("*", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AiVoucher (RomamiaViagens®) server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
