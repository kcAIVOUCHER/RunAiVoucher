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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for PDF and image base64 uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

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

app.put("/api/saas/settings", checkMasterAuth, async (req, res) => {
  const store = await getStore();
  store.platformSettings = { ...store.platformSettings, ...req.body };
  await saveStore(store);
  res.json(store.platformSettings);
});

app.get("/api/saas/plans", async (req, res) => {
  const store = await getStore();
  res.json((store.plans && store.plans.length > 0) ? store.plans : defaultPlans);
});

app.put("/api/saas/plans/:id", checkMasterAuth, async (req, res) => {
  const { id } = req.params;
  const store = await getStore();
  const index = (store.plans || []).findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Plano não encontrado" });
  }
  store.plans[index] = { ...store.plans[index], ...req.body };
  await saveStore(store);
  res.json(store.plans[index]);
});

// SaaS Agencies Management (Master SuperAdmin & Switcher)
app.get("/api/saas/agencies", async (req, res) => {
  const store = await getStore();
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
    const planId = sub.planId || req.body.planId || "plan-pro";
    const plan = (store.plans || defaultPlans).find((p) => p.id === planId) || defaultPlans[1];

    const basePrice = Number(sub.basePrice ?? req.body.basePrice) || plan.basePrice;
    const maxUsers = Number(sub.maxUsers ?? req.body.maxUsers) || plan.baseUsers;
    const extraUsersCount = Math.max(0, maxUsers - plan.baseUsers);
    const extraUsersPrice = extraUsersCount * plan.pricePerExtraUser;
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

  // If not yet emitted NFS-e, auto-emit upon payment
  if (invoice.nfeStatus !== "emitted") {
    invoice.nfeNumber = `NFS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    invoice.nfeSeries = "E";
    invoice.nfeVerificationCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    invoice.nfeEmittedAt = invoice.paidAt;
    invoice.nfeStatus = "emitted";
  }

  await saveStore(store);
  res.json({ success: true, invoice });
});

// -------------------------------------------------------------
// Agency, Companies & Vouchers Endpoints (Tenant-Aware)
// -------------------------------------------------------------

app.get("/api/agency", async (req, res) => {
  const store = await getStore();
  const targetId = (req.query.agencyId as string) || (req.headers["x-agency-id"] as string);

  if (!targetId) {
    return res.status(400).json({ error: "ID da agência não fornecido" });
  }

  const agency = (store.agencies || []).find((a) => a.id === targetId);
  
  if (!agency) {
    return res.status(404).json({ error: "Agência não encontrada" });
  }

  // Attach dynamic active users count
  const usersCount = (store.agencyUsers || []).filter((u) => u.agencyId === agency.id && u.status === "active").length;
  res.json({ ...agency, activeUsersCount: usersCount });
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

  const newVoucher = {
    ...req.body,
    id: req.body.id || `vouch-${Date.now()}`,
    agencyId,
    voucherNumber: req.body.voucherNumber || `VOU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    status: req.body.status || "emitted"
  };

  try {
    const store = await getStore();
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

      let serviceType: any = "flight";
      if (isPackage) serviceType = "package";
      else if (isCruise) serviceType = "cruise";
      else if (isTicket) serviceType = "ticket";
      else if (isInsurance) serviceType = "insurance";
      else if (isCar) serviceType = "car";
      else if (isHotel) serviceType = "hotel";

      const isGol = /gol/i.test(rawText);
      const isLatam = /latam/i.test(rawText);
      const isAzul = /azul/i.test(rawText);
      const airline = isLatam ? "LATAM Airlines" : isGol ? "GOL Linhas Aéreas" : isAzul ? "Azul Linhas Aéreas" : "Companhia Aérea";
      const airlineCode = isLatam ? "LA" : isGol ? "G3" : isAzul ? "AD" : "XX";

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
        flights: isCar || isInsurance || isTicket || isCruise || isHotel ? [] : [
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
        ],
        hotel: isHotel || isPackage ? {
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
        } : null,
        carRental: isCar || isPackage ? {
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
        } : null,
        insurance: isInsurance || isPackage ? {
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
        } : null,
        ticket: isTicket || isPackage ? {
          attractionName: "Magic Kingdom Park - Walt Disney World",
          supplierOrPark: "Disney Destinations",
          ticketType: "1-Day Standard Theme Park Ticket",
          ticketNumberOrCode: "WDW-88390218",
          date: "22/10/2026",
          time: "09:00",
          locationOrAddress: "Catracas Principais - Magic Kingdom Entrance, Orlando FL",
          passengersOrHolders: ["EDUARDO CARVALHO DA SILVA"],
          importantInstructions: "Vincule o código ao app My Disney Experience ou apresente este voucher na catraca."
        } : null,
        cruise: isCruise ? {
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
        } : null,
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

    const systemPrompt = `Você é um extrator de dados de comprovantes de viagem (aéreo, hotel, carro, seguro, ingressos, cruzeiro).

Extraia os dados de forma precisa e retorne APENAS um JSON válido seguindo este esquema:

{
  "pnr": "string",
  "serviceType": "flight" | "hotel" | "car" | "insurance" | "ticket" | "cruise" | "package",
  "passengers": [{"name": "string", "ticketNumber": "string", "document": "string", "birthDate": "string", "loyaltyNumber": "string", "seat": "string"}],
  "flights": [{"airline": "string", "airlineCode": "string", "flightNumber": "string", "isInternational": boolean, "departureAirport": "string", "departureCode": "string", "departureCity": "string", "departureDate": "string", "departureTime": "string", "arrivalAirport": "string", "arrivalCode": "string", "arrivalCity": "string", "arrivalDate": "string", "arrivalTime": "string", "cabinClass": "string", "bookingClass": "string", "fareFamily": "string", "baggageHand": "string", "baggageChecked": "string", "aircraft": "string", "duration": "string"}],
  "hotel": {"hotelName": "string", "address": "string", "city": "string", "checkInDate": "string", "checkInTime": "string", "checkOutDate": "string", "checkOutTime": "string", "nights": number, "roomType": "string", "mealPlan": "string", "confirmationCode": "string", "guestsNames": ["string"]},
  "carRental": {"rentalCompany": "string", "confirmationCode": "string", "carModelOrCategory": "string", "pickupLocation": "string", "pickupDate": "string", "pickupTime": "string", "dropoffLocation": "string", "dropoffDate": "string", "dropoffTime": "string", "driverName": "string", "driverDocument": "string", "includedCoverage": "string", "notes": "string"},
  "insurance": {"provider": "string", "policyNumber": "string", "planName": "string", "startDate": "string", "endDate": "string", "medicalCoverage": "string", "covidCoverage": "string", "baggageCoverage": "string", "emergencyPhone24h": "string", "insuredNames": ["string"]},
  "ticket": {"attractionName": "string", "supplierOrPark": "string", "ticketType": "string", "ticketNumberOrCode": "string", "date": "string", "time": "string", "locationOrAddress": "string", "passengersOrHolders": ["string"], "importantInstructions": "string"},
  "cruise": {"cruiseLine": "string", "shipName": "string", "bookingNumber": "string", "cabinNumber": "string", "cabinCategory": "string", "departurePort": "string", "departureDate": "string", "departureTime": "string", "arrivalPort": "string", "arrivalDate": "string", "itinerarySummary": "string", "mealPlan": "string", "passengers": ["string"]},
  "transfer": {"serviceType": "string", "pickupLocation": "string", "pickupDateTime": "string", "dropoffLocation": "string", "vehicleType": "string", "contactPhone": "string"},
  "pricing": {"currency": "BRL" | "USD", "fare": number, "taxes": number, "serviceFee": number, "otherFees": number, "total": number},
  "notes": "string"
}

REGRAS DE EXTRAÇÃO:
- Se não houver City, extraia a partir do aeroporto.
- Preencha null em campos não aplicáveis.
- Use float para valores numéricos (sem R$ ou vírgulas).
- CALCULE A DURAÇÃO DO VOO (Saída - Chegada, ajuste fuso) se não estiver explícita. JAMAIS deixe vazio.
- Formate a bagagem: Bagagem: 🎒 Item pessoal + 🧳 Mala de bordo (10kg) [+ 🧳 Mala despachada]. APENAS itens inclusos.
- Retorne APENAS o JSON puro. Sem markdown, sem explicações.`;

    const parts: any[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
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
            inlineData: {
              data: cleanBase64,
              mimeType: resolvedMime
            }
          });
        }
      }
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

    if (text && text.trim()) {
      parts.push({
        text: `Aqui está o conteúdo do bilhete/e-mail/GDS ou observações adicionais para extração:\n\n${text.trim()}`
      });
    } else {
      parts.push({
        text: "Analise minuciosamente este documento de viagem/bilhete anexo e extraia todos os dados estruturados conforme o schema JSON solicitado."
      });
    }

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
