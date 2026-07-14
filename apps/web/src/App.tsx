import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./features.css";
import { api, download, saveSession, upload, type Session } from "./lib/api";
import { useRealtime } from "./lib/realtime";

type IconProps = { name: string; size?: number };
const paths: Record<string, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  folder: "M3 6h7l2 2h9v11H3z",
  check: "M9 11l3 3L22 4M21 12a9 9 0 1 1-5.3-8.2",
  calendar: "M3 5h18v16H3zM8 3v4m8-4v4M3 10h18",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87m-2-12a4 4 0 0 1 0 7.75",
  chart: "M4 20V10m6 10V4m6 16v-7m6 7H2",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  spark:
    "M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6zM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34L7 19.8 4.17 17l.06-.06A1.7 1.7 0 0 0 4.57 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88L4.2 7 7 4.17l.06.06A1.7 1.7 0 0 0 9 4.57 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.57 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06A1.7 1.7 0 0 0 19.4 9 1.7 1.7 0 0 0 21 10h.08v4H21a1.7 1.7 0 0 0-1.6 1z",
  search: "M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  plus: "M12 5v14M5 12h14",
  chevron: "M9 18l6-6-6-6",
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6L7 7m10 10 1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};
function Icon({ name, size = 19 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

const nav = [
  { id: "dashboard", label: "Visão geral", icon: "grid" },
  { id: "projects", label: "Projetos", icon: "folder", badge: "8" },
  { id: "tasks", label: "Minhas tarefas", icon: "check", badge: "12" },
  { id: "calendar", label: "Calendário", icon: "calendar" },
  { id: "team", label: "Equipe", icon: "users" },
  { id: "reports", label: "Relatórios", icon: "chart" },
];
const tasks = [
  {
    title: "Finalizar protótipo da nova experiência",
    project: "NexusOps AI",
    color: "#7c6cf2",
    date: "Hoje",
    priority: "Alta",
    avatar: "AM",
    done: false,
  },
  {
    title: "Revisar estratégia de conteúdo",
    project: "Website 2.0",
    color: "#f5a623",
    date: "Hoje",
    priority: "Média",
    avatar: "LC",
    done: false,
  },
  {
    title: "Preparar apresentação para investidores",
    project: "Pitch Series A",
    color: "#ec6f8e",
    date: "Amanhã",
    priority: "Alta",
    avatar: "ER",
    done: false,
  },
  {
    title: "Documentar endpoints da API",
    project: "NexusOps AI",
    color: "#7c6cf2",
    date: "18 Jul",
    priority: "Baixa",
    avatar: "JV",
    done: true,
  },
];
const projects = [
  {
    name: "NexusOps AI",
    desc: "Plataforma inteligente de operações",
    color: "#7765e8",
    progress: 76,
    team: ["AM", "JV", "ER"],
    date: "28 Jul",
    status: "No prazo",
  },
  {
    name: "Website 2.0",
    desc: "Novo site institucional e blog",
    color: "#f3a72e",
    progress: 54,
    team: ["LC", "AM"],
    date: "05 Ago",
    status: "Atenção",
  },
  {
    name: "Mobile App",
    desc: "Aplicativo para iOS e Android",
    color: "#37b389",
    progress: 32,
    team: ["JV", "ER", "LC"],
    date: "20 Ago",
    status: "No prazo",
  },
];

type SearchResults = {
  projects: { id: string; name: string; color: string; status: string }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    project: { name: string; color: string };
  }[];
};
function App() {
  const [page, setPage] = useState("dashboard"),
    [dark, setDark] = useState(false),
    [mobile, setMobile] = useState(false),
    [copilot, setCopilot] = useState(false),
    [query, setQuery] = useState("");
  const [entry, setEntry] = useState<
    "landing" | "login" | "onboarding" | "app"
  >(() => (localStorage.getItem("taskflow-session") ? "app" : "landing"));
  const [searchResults, setSearchResults] = useState<SearchResults>({
    projects: [],
    tasks: [],
  });
  const { notificationCount, connected } = useRealtime();
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (query.trim().length < 2 || !localStorage.getItem("taskflow-token")) {
      setSearchResults({ projects: [], tasks: [] });
      return;
    }
    const timer = setTimeout(
      () =>
        void api<SearchResults>(`/search?q=${encodeURIComponent(query)}`)
          .then(setSearchResults)
          .catch(() => undefined),
      250,
    );
    return () => clearTimeout(timer);
  }, [query]);
  const title =
    nav.find((n) => n.id === page)?.label ||
    ({
      notifications: "Notificações",
      history: "Histórico de atividades",
      admin: "Administração",
      profile: "Meu perfil",
      settings: "Configurações",
    }[page] ??
      "Visão geral");
  if (entry === "onboarding")
    return <Onboarding finish={() => setEntry("app")} />;
  if (entry !== "app") return <PublicSite mode={entry} setMode={setEntry} />;
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Icon name="check" size={18} />
          </span>
          <strong>TaskFlow</strong>
          <em>AI</em>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-logo">N</span>
          <span>
            <small>ESPAÇO DE TRABALHO</small>
            <b>Nexora Labs</b>
          </span>
          <Icon name="chevron" size={15} />
        </div>
        <p className="nav-label">MENU</p>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => {
                setPage(n.id);
                setMobile(false);
              }}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.badge && <i>{n.badge}</i>}
            </button>
          ))}
        </nav>
        <p className="nav-label">FERRAMENTAS</p>
        <nav>
          <button onClick={() => setCopilot(true)}>
            <Icon name="spark" />
            <span>Copiloto IA</span>
            <i className="beta">BETA</i>
          </button>
          <button
            className={page === "notifications" ? "active" : ""}
            onClick={() => setPage("notifications")}
            title={connected ? "Tempo real conectado" : "Modo offline"}
          >
            <Icon name="bell" />
            <span>Notificações</span>
            {notificationCount > 0 && (
              <i className="dot">{notificationCount}</i>
            )}
          </button>
          <button className={page === "history" ? "active" : ""} onClick={() => setPage("history")}>
            <Icon name="clock" />
            <span>Histórico</span>
          </button>
          <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>
            <Icon name="settings" />
            <span>Administração</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setPage("settings")}>
            <Icon name="settings" />
            <span>Configurações</span>
          </button>
          <div className="help-card">
            <span>?</span>
            <b>Precisa de ajuda?</b>
            <small>Acesse nossa central</small>
          </div>
        </div>
      </aside>
      {mobile && <div className="overlay" onClick={() => setMobile(false)} />}
      <main>
        <header>
          <button className="menu-btn" onClick={() => setMobile(true)}>
            <Icon name="menu" />
          </button>
          <h2>{title}</h2>
          <div className="top-actions">
            <div className="search-wrap">
              <label className="search">
                <Icon name="search" size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar projetos e tarefas..."
                />
                <kbd>⌘ K</kbd>
              </label>
              {query.length >= 2 && (
                <div className="search-results">
                  {searchResults.projects.length === 0 &&
                  searchResults.tasks.length === 0 ? (
                    <p>Nenhum resultado encontrado</p>
                  ) : (
                    <>
                      {searchResults.projects.length > 0 && (
                        <>
                          <small>PROJETOS</small>
                          {searchResults.projects.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setPage("projects");
                                setQuery("");
                              }}
                            >
                              <i style={{ background: p.color }} />
                              <span>
                                <b>{p.name}</b>
                                <em>{p.status}</em>
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                      {searchResults.tasks.length > 0 && (
                        <>
                          <small>TAREFAS</small>
                          {searchResults.tasks.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setPage("tasks");
                                setQuery("");
                              }}
                            >
                              <Icon name="check" size={15} />
                              <span>
                                <b>{t.title}</b>
                                <em>{t.project.name}</em>
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={() => setDark(!dark)}>
              <Icon name="sun" />
            </button>
            <button
              className="icon-btn notification"
              onClick={() => setPage("notifications")}
              title={`${notificationCount} notificações não lidas`}
            >
              <Icon name="bell" />
              {notificationCount > 0 && <span />}
            </button>
            <button className="profile" onClick={() => setPage("profile")}>
              <span className="avatar">ER</span>
              <div>
                <b>Erick Reis</b>
                <small>Administrador</small>
              </div>
              <Icon name="chevron" size={14} />
            </button>
          </div>
        </header>
        <div className="content">
          {page === "dashboard" ? (
            <Dashboard
              onCopilot={() => setCopilot(true)}
              onNavigate={setPage}
            />
          ) : page === "notifications" ? (
            <Notifications />
          ) : page === "history" ? (
            <ActivityTimeline />
          ) : page === "admin" ? (
            <AdminPage />
          ) : page === "profile" || page === "settings" ? (
            <AccountPage
              page={page}
              onLogout={() => {
                localStorage.removeItem("taskflow-token");
                localStorage.removeItem("taskflow-session");
                setEntry("landing");
              }}
            />
          ) : (
            <ModulePage page={page} />
          )}
        </div>
      </main>
      {copilot && <Copilot close={() => setCopilot(false)} />}
    </div>
  );
}

function Onboarding({ finish }: { finish: () => void }) {
  const [step, setStep] = useState(0),
    [projectName, setProjectName] = useState("Meu primeiro projeto"),
    [goal, setGoal] = useState("Organizar tarefas e prazos"),
    [loading, setLoading] = useState(false);
  let session: any = {};
  try {
    session = JSON.parse(localStorage.getItem("taskflow-session") ?? "{}");
  } catch {
    session = {};
  }
  const complete = async () => {
    setLoading(true);
    try {
      if (projectName.trim())
        await api("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: projectName,
            description: goal,
            color: "#6f60df",
          }),
        });
    } catch {
      /* onboarding may finish even if the optional project fails */
    } finally {
      localStorage.setItem("taskflow-onboarded", "true");
      setLoading(false);
      finish();
    }
  };
  return (
    <div className="onboarding-page">
      <div className="onboarding-brand">
        <span className="brand-mark">
          <Icon name="check" />
        </span>
        <strong>TaskFlow</strong>
        <em>AI</em>
      </div>
      <div className="onboarding-progress">
        {[0, 1, 2].map((i) => (
          <i key={i} className={step >= i ? "active" : ""} />
        ))}
      </div>
      <div className="onboarding-card">
        {step === 0 && (
          <>
            <span className="onboarding-visual">👋</span>
            <small>PASSO 1 DE 3</small>
            <h1>Bem-vindo, {session.user?.name?.split(" ")[0] ?? "Erick"}!</h1>
            <p>
              Vamos preparar seu espaço para que sua equipe comece com clareza
              desde o primeiro dia.
            </p>
            <div className="onboarding-benefits">
              <span>
                <Icon name="folder" />
                <b>Projetos organizados</b>
              </span>
              <span>
                <Icon name="users" />
                <b>Equipe alinhada</b>
              </span>
              <span>
                <Icon name="spark" />
                <b>IA como copiloto</b>
              </span>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <span className="onboarding-visual">
              <Icon name="folder" />
            </span>
            <small>PASSO 2 DE 3</small>
            <h1>Crie seu primeiro projeto</h1>
            <p>Você poderá alterar tudo depois nas configurações do projeto.</p>
            <div className="onboarding-form">
              <label>
                Nome do projeto
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
              </label>
              <label>
                Principal objetivo
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </label>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <span className="onboarding-visual">
              <Icon name="spark" />
            </span>
            <small>PASSO 3 DE 3</small>
            <h1>Tudo pronto para começar</h1>
            <p>
              Seu espaço foi configurado. O copiloto pode ajudar a criar as
              primeiras tarefas automaticamente.
            </p>
            <div className="ready-box">
              <Icon name="check" />
              <div>
                <b>{session.organization?.name ?? "Seu espaço"}</b>
                <small>Ambiente seguro e colaborativo</small>
              </div>
            </div>
          </>
        )}
        <footer>
          {step > 0 && (
            <button className="secondary" onClick={() => setStep((s) => s - 1)}>
              Voltar
            </button>
          )}
          <button
            className="primary"
            onClick={() => (step < 2 ? setStep((s) => s + 1) : void complete())}
            disabled={loading}
          >
            {loading
              ? "Preparando..."
              : step < 2
                ? "Continuar"
                : "Ir para o dashboard"}
            <Icon name="arrow" />
          </button>
        </footer>
      </div>
      <button className="skip-onboarding" onClick={finish}>
        Pular configuração
      </button>
    </div>
  );
}

function PublicSite({
  mode,
  setMode,
}: {
  mode: "landing" | "login";
  setMode: (v: "landing" | "login" | "onboarding" | "app") => void;
}) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("demo@taskflow.ai"),
    [password, setPassword] = useState("taskflow"),
    [name, setName] = useState(""),
    [organizationName, setOrganizationName] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [authFlow,setAuthFlow]=useState<'auth'|'forgot'|'reset'>(()=>new URLSearchParams(location.search).get('resetToken')?'reset':'auth'),
    [resetToken,setResetToken]=useState(()=>new URLSearchParams(location.search).get('resetToken')??''),
    [authMessage,setAuthMessage]=useState('');
  const enter = () => {
    localStorage.setItem("taskflow-session", "demo");
    setMode("app");
  };
  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await api<Session>(
        signup ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            signup
              ? { name, email, password, organizationName }
              : { email, password },
          ),
        },
      );
      saveSession(session);
      setMode(signup ? "onboarding" : "app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };
  const forgot=async()=>{setLoading(true);setError('');try{const result=await api<{message:string;developmentToken?:string}>('/auth/forgot-password',{method:'POST',body:JSON.stringify({email})});setAuthMessage(result.message);if(result.developmentToken){setResetToken(result.developmentToken);setAuthFlow('reset')}}catch(e){setError(e instanceof Error?e.message:'Não foi possível solicitar a recuperação')}finally{setLoading(false)}};
  const reset=async()=>{setLoading(true);setError('');try{const result=await api<{message:string}>('/auth/reset-password',{method:'POST',body:JSON.stringify({token:resetToken,password})});setAuthMessage(result.message);history.replaceState({},'',location.pathname);setAuthFlow('auth')}catch(e){setError(e instanceof Error?e.message:'Não foi possível redefinir a senha')}finally{setLoading(false)}};
  if(mode==='login'&&authFlow!=='auth')return <div className="auth-page"><div className="auth-brand" onClick={()=>setMode('landing')}><span className="brand-mark"><Icon name="check"/></span><strong>TaskFlow</strong><em>AI</em></div><div className="auth-card"><span className="auth-spark"><Icon name={authFlow==='forgot'?'bell':'check'}/></span><h1>{authFlow==='forgot'?'Recupere sua conta':'Crie uma nova senha'}</h1><p>{authFlow==='forgot'?'Enviaremos um link seguro e válido por 30 minutos.':'Escolha uma senha forte com pelo menos 8 caracteres.'}</p>{authFlow==='forgot'?<label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com"/></label>:<label>Nova senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres"/></label>}{error&&<p className="auth-error">{error}</p>}{authMessage&&<p className="auth-success">{authMessage}</p>}<button className="primary auth-submit" onClick={()=>void(authFlow==='forgot'?forgot():reset())} disabled={loading}>{loading?'Aguarde...':authFlow==='forgot'?'Enviar instruções':'Redefinir senha'}<Icon name="arrow"/></button><small><button onClick={()=>{setAuthFlow('auth');setError('')}}>Voltar para o login</button></small></div></div>;
  if (mode === "login")
    return (
      <div className="auth-page">
        <div className="auth-brand" onClick={() => setMode("landing")}>
          <span className="brand-mark">
            <Icon name="check" />
          </span>
          <strong>TaskFlow</strong>
          <em>AI</em>
        </div>
        <div className="auth-card">
          <span className="auth-spark">
            <Icon name="spark" />
          </span>
          <h1>{signup ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
          <p>
            {signup
              ? "Comece a organizar sua equipe em poucos minutos."
              : "Entre para continuar no seu espaço de trabalho."}
          </p>
          <button className="google-btn">
            G&nbsp;&nbsp; Continuar com Google
          </button>
          <div className="divider">
            <span>ou continue com e-mail</span>
          </div>
          {signup && (
            <>
              <label>
                Nome completo
                <input
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Nome da empresa
                <input
                  placeholder="Ex.: Nexora Labs"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </label>
            </>
          )}
          <label>
            E-mail
            <input
              type="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha <a onClick={()=>setAuthFlow('forgot')}>Esqueceu a senha?</a>
            <input
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button
            className="primary auth-submit"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? "Aguarde..."
              : signup
                ? "Criar minha conta"
                : "Entrar na plataforma"}
            <Icon name="arrow" />
          </button>
          <small>
            {signup ? "Já possui uma conta?" : "Ainda não tem uma conta?"}{" "}
            <button
              onClick={() => {
                setSignup(!signup);
                setError("");
              }}
            >
              {signup ? "Entrar" : "Criar conta grátis"}
            </button>
          </small>
        </div>
        <p className="auth-legal">
          Ao continuar, você concorda com os Termos de Uso e a Política de
          Privacidade.
        </p>
      </div>
    );
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="check" />
          </span>
          <strong>TaskFlow</strong>
          <em>AI</em>
        </div>
        <div className="landing-links">
          <a href="#recursos">Recursos</a>
          <a href="#ia">Inteligência Artificial</a>
          <a href="#precos">Preços</a>
        </div>
        <div>
          <button onClick={() => setMode("login")}>Entrar</button>
          <button
            className="primary"
            onClick={() => {
              setMode("login");
              setSignup(true);
            }}
          >
            Começar grátis
          </button>
        </div>
      </nav>
      <main className="landing-main">
        <section className="landing-hero">
          <span className="eyebrow">
            <Icon name="spark" size={14} /> Planeje melhor. Entregue mais
            rápido.
          </span>
          <h1>
            Projetos fluindo.
            <br />
            <em>Equipes crescendo.</em>
          </h1>
          <p>
            Centralize projetos, tarefas e pessoas em uma plataforma inteligente
            que transforma trabalho complexo em progresso claro.
          </p>
          <div>
            <button className="primary" onClick={enter}>
              Explorar conta demo <Icon name="arrow" />
            </button>
            <button className="secondary" onClick={() => setMode("login")}>
              Criar conta grátis
            </button>
          </div>
          <small>Grátis por 14 dias · Sem cartão de crédito</small>
        </section>
        <section className="product-preview">
          <div className="preview-top">
            <span />
            <span />
            <span />
            <b>taskflow.ai/dashboard</b>
          </div>
          <div className="preview-body">
            <aside>
              <strong>✓ TaskFlow</strong>
              {[
                "Visão geral",
                "Projetos",
                "Minhas tarefas",
                "Calendário",
                "Equipe",
              ].map((x, i) => (
                <i key={x} className={i === 0 ? "active" : ""}>{x}</i>
              ))}
            </aside>
            <div>
              <p>VISÃO GERAL</p>
              <h2>Bom dia, Erick 👋</h2>
              <div className="preview-stats">
                {[
                  ["8", "Projetos ativos"],
                  ["64", "Tarefas concluídas"],
                  ["23", "Em andamento"],
                ].map((x) => (
                  <span key={x[1]}>
                    <b>{x[0]}</b>
                    <small>{x[1]}</small>
                  </span>
                ))}
              </div>
              <div className="preview-chart">
                {[35, 60, 48, 78, 65, 42, 70].map((x, index) => (
                  <i key={index} style={{ height: x + "%" }} />
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="logos">
          <p>Times que constroem o futuro trabalham com clareza</p>
          <div>
            <b>VERTEX</b>
            <b>Northstar</b>
            <b>● ACME</b>
            <b>NEXORA</b>
            <b>Quantum</b>
          </div>
        </section>
      </main>
    </div>
  );
}

type DashboardData = {
  stats: {
    activeProjects: number;
    projectsThisMonth: number;
    completed: number;
    completedWeek: number;
    inProgress: number;
    dueToday: number;
    members: number;
  };
  productivity: { date: string; value: number }[];
  distribution: Record<string, number>;
};
function Dashboard({
  onCopilot,
  onNavigate,
}: {
  onCopilot: () => void;
  onNavigate: (p: string) => void;
}) {
  const [done, setDone] = useState(tasks.map((t) => t.done));
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  useEffect(() => {
    if (localStorage.getItem("taskflow-token"))
      void api<DashboardData>("/dashboard")
        .then(setDashboard)
        .catch(() => undefined);
  }, []);
  const stats = dashboard?.stats,
    series = dashboard?.productivity.map((x) => x.value) ?? [
      15, 21, 17, 26, 22, 12, 19,
    ],
    distribution = dashboard?.distribution ?? {
      DONE: 64,
      IN_PROGRESS: 23,
      REVIEW: 12,
      TODO: 9,
    },
    total = Object.values(distribution).reduce((a, b) => a + b, 0);
  return (
    <>
      <section className="welcome">
        <div>
          <p>Domingo, 12 de julho</p>
          <h1>
            Bom dia, Erick <span>👋</span>
          </h1>
          <small>
            Aqui está o que está acontecendo com seus projetos hoje.
          </small>
        </div>
        <div className="welcome-actions">
          <button className="secondary" onClick={onCopilot}>
            <Icon name="spark" /> Perguntar à IA
          </button>
          <button className="primary">
            <Icon name="plus" /> Novo projeto
          </button>
        </div>
      </section>
      <section className="stats">
        <Stat
          icon="folder"
          tone="violet"
          label="Projetos ativos"
          value={String(stats?.activeProjects ?? 8)}
          delta={`+${stats?.projectsThisMonth ?? 2} este mês`}
        />
        <Stat
          icon="check"
          tone="blue"
          label="Tarefas concluídas"
          value={String(stats?.completed ?? 64)}
          delta={`+${stats?.completedWeek ?? 12} esta semana`}
          progress={68}
        />
        <Stat
          icon="clock"
          tone="orange"
          label="Em andamento"
          value={String(stats?.inProgress ?? 23)}
          delta={`${stats?.dueToday ?? 5} vencem hoje`}
        />
        <Stat
          icon="users"
          tone="green"
          label="Membros da equipe"
          value={String(stats?.members ?? 12)}
          delta="Colaboração em tempo real"
        />
      </section>
      <section className="grid-main">
        <div className="card activity-card">
          <CardHead
            title="Produtividade da equipe"
            sub="Tarefas concluídas nos últimos 7 dias"
            action="Esta semana"
          />
          <div className="chart">
            <div className="axis">
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            <div className="bars">
              {series.map((v, i) => (
                <div className="bar-col" key={i}>
                  <div
                    className="bar"
                    style={{ height: `${Math.max(3, v * 3.2)}px` }}
                  >
                    <span>{v}</span>
                  </div>
                  <small>
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i]}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card workload">
          <CardHead title="Distribuição de tarefas" sub="Por status" />
          <div className="donut-wrap">
            <div className="donut">
              <span>
                <b>{total}</b>
                <small>Total</small>
              </span>
            </div>
            <div className="legend">
              <Legend
                color="#7667e8"
                label="Concluídas"
                value={String(distribution.DONE ?? 0)}
              />
              <Legend
                color="#5fa6ee"
                label="Em andamento"
                value={String(distribution.IN_PROGRESS ?? 0)}
              />
              <Legend
                color="#f5ad48"
                label="Em revisão"
                value={String(distribution.REVIEW ?? 0)}
              />
              <Legend
                color="#d9dce5"
                label="A fazer"
                value={String(
                  (distribution.TODO ?? 0) + (distribution.BACKLOG ?? 0),
                )}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="grid-bottom">
        <div className="card">
          <CardHead
            title="Minhas tarefas"
            sub="Prioridades para hoje"
            action="Ver todas"
            onAction={() => onNavigate("tasks")}
          />
          <div className="task-list">
            {tasks.map((t, i) => (
              <div
                className={`task-row ${done[i] ? "completed" : ""}`}
                key={t.title}
              >
                <button
                  className="check-btn"
                  onClick={() =>
                    setDone((d) => d.map((x, j) => (j === i ? !x : x)))
                  }
                >
                  {done[i] ? "✓" : ""}
                </button>
                <div className="task-info">
                  <b>{t.title}</b>
                  <span>
                    <i style={{ background: t.color }} /> {t.project}
                  </span>
                </div>
                <span
                  className={`priority ${t.priority.toLowerCase().replace("é", "e")}`}
                >
                  {t.priority}
                </span>
                <span className="date">
                  <Icon name="calendar" size={14} />
                  {t.date}
                </span>
                <span className="mini-avatar">{t.avatar}</span>
                <Icon name="more" />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <CardHead
            title="Projetos recentes"
            sub="Acompanhe o progresso"
            action="Ver todos"
            onAction={() => onNavigate("projects")}
          />
          <div className="project-list">
            {projects.map((p) => (
              <div className="project-row" key={p.name}>
                <span className="project-icon" style={{ background: p.color }}>
                  {p.name[0]}
                </span>
                <div>
                  <b>{p.name}</b>
                  <small>{p.desc}</small>
                  <div className="progress">
                    <i
                      style={{ width: p.progress + "%", background: p.color }}
                    />
                  </div>
                </div>
                <span className="percent">{p.progress}%</span>
                <div className="avatar-stack">
                  {p.team.map((x) => (
                    <i key={x}>{x}</i>
                  ))}
                </div>
                <span className="date">
                  <Icon name="calendar" size={14} />
                  {p.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
function Stat({
  icon,
  tone,
  label,
  value,
  delta,
  progress,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  delta: string;
  progress?: number;
}) {
  return (
    <div className="stat card">
      <span className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <p className={tone === "orange" ? "warning" : ""}>{delta}</p>
      </div>
      {progress && (
        <div className="stat-progress">
          <i style={{ width: progress + "%" }} />
        </div>
      )}
    </div>
  );
}
function CardHead({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        <p>{sub}</p>
      </div>
      {action && (
        <button onClick={onAction}>
          {action}
          <Icon name="chevron" size={14} />
        </button>
      )}
    </div>
  );
}
function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <i style={{ background: color }} />
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ModulePage({ page }: { page: string }) {
  const labels: Record<string, [string, string]> = {
    projects: [
      "Projetos",
      "Gerencie iniciativas, prazos e responsáveis em um só lugar.",
    ],
    tasks: [
      "Minhas tarefas",
      "Organize seu trabalho e mantenha o foco nas prioridades.",
    ],
    calendar: [
      "Calendário",
      "Visualize prazos, reuniões e entregas da equipe.",
    ],
    team: ["Equipe", "Pessoas, funções e capacidade de trabalho."],
    reports: ["Relatórios", "Indicadores claros para decisões mais rápidas."],
  };
  const [title, sub] = labels[page] || ["Módulo", "Em construção"];
  const [creating, setCreating] = useState(false),
    [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="module">
      <section className="module-title">
        <div>
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
        {(page === "projects" || page === "tasks") && (
          <button className="primary" onClick={() => setCreating(true)}>
            <Icon name="plus" />
            Adicionar
          </button>
        )}
      </section>
      {page === "projects" ? (
        <Projects refreshKey={refreshKey} />
      ) : page === "tasks" ? (
        <Kanban refreshKey={refreshKey} />
      ) : page === "calendar" ? (
        <Calendar />
      ) : page === "team" ? (
        <Team />
      ) : (
        <Reports />
      )}
      {creating && (
        <CreateModal
          type={page as "projects" | "tasks"}
          close={() => setCreating(false)}
          created={() => {
            setCreating(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
type ApiProject = {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: string;
  dueDate?: string;
  tasks?: { status: string }[];
  _count?: { tasks: number };
};
function Projects({ refreshKey = 0 }: { refreshKey?: number }) {
  const fallback = [
    ...projects,
    {
      name: "Design System",
      desc: "Biblioteca de componentes da marca",
      color: "#e6688d",
      progress: 88,
      team: ["AM", "LC"],
      date: "19 Jul",
      status: "No prazo",
    },
    {
      name: "Growth Experiments",
      desc: "Testes para aquisição e retenção",
      color: "#438dc9",
      progress: 41,
      team: ["ER", "LC"],
      date: "12 Ago",
      status: "Atenção",
    },
  ].map((p, i) => ({ ...p, id: `demo-${i}` }));
  const [data, setData] = useState(fallback),
    [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!localStorage.getItem("taskflow-token")) return;
    void api<ApiProject[]>("/projects")
      .then((items) =>
        setData(
          items.map((p) => {
            const total = p._count?.tasks ?? p.tasks?.length ?? 0,
              done = p.tasks?.filter((t) => t.status === "DONE").length ?? 0;
            return {
              id: p.id,
              name: p.name,
              desc: p.description ?? "Sem descrição",
              color: p.color,
              progress: total ? Math.round((done / total) * 100) : 0,
              team: ["ER"],
              date: p.dueDate
                ? new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  }).format(new Date(p.dueDate))
                : "Sem prazo",
              status: p.status === "ON_HOLD" ? "Atenção" : "No prazo",
            };
          }),
        ),
      )
      .catch(() => undefined);
  }, [refreshKey]);
  return (
    <>
      <div className="project-grid">
        {data.map((p) => (
          <article
            className="project-card card"
            key={p.name}
            onClick={() => !p.id.startsWith("demo-") && setSelected(p.id)}
          >
            <div className="project-card-top">
              <span style={{ background: p.color }}>{p.name[0]}</span>
              <Icon name="more" />
            </div>
            <h3>{p.name}</h3>
            <p>{p.desc}</p>
            <div className="project-meta">
              <span>{p.status}</span>
              <b>{p.progress}%</b>
            </div>
            <div className="progress big">
              <i style={{ width: p.progress + "%", background: p.color }} />
            </div>
            <footer>
              <div className="avatar-stack">
                {p.team.map((x) => (
                  <i key={x}>{x}</i>
                ))}
              </div>
              <span className="date">
                <Icon name="calendar" size={14} />
                {p.date}
              </span>
            </footer>
          </article>
        ))}
      </div>
      {selected && (
        <ProjectDetail projectId={selected} close={() => setSelected(null)} />
      )}
    </>
  );
}
type ProjectDetailData = Omit<ApiProject, "tasks"> & {
  description?: string;
  startDate?: string;
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
  }[];
};
function ProjectDetail({
  projectId,
  close,
}: {
  projectId: string;
  close: () => void;
}) {
  const [project, setProject] = useState<ProjectDetailData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    void api<ProjectDetailData>(`/projects/${projectId}`)
      .then(setProject)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar"),
      );
  }, [projectId]);
  const done = project?.tasks.filter((t) => t.status === "DONE").length ?? 0,
    total = project?.tasks.length ?? 0;
  return (
    <>
      <div className="modal-backdrop" onClick={close} />
      <aside className="project-detail">
        <header>
          <div>
            {project && (
              <span
                className="project-icon"
                style={{ background: project.color }}
              >
                {project.name[0]}
              </span>
            )}
            <span>
              <small>PROJETO</small>
              <h2>{project?.name ?? "Carregando..."}</h2>
            </span>
          </div>
          <button onClick={close}>
            <Icon name="close" />
          </button>
        </header>
        {project && (
          <div className="project-detail-content">
            <section className="project-summary">
              <div>
                <small>PROGRESSO GERAL</small>
                <b>{total ? Math.round((done / total) * 100) : 0}%</b>
                <div className="progress big">
                  <i
                    style={{
                      width: `${total ? (done / total) * 100 : 0}%`,
                      background: project.color,
                    }}
                  />
                </div>
              </div>
              <div>
                <small>STATUS</small>
                <b>{project.status}</b>
              </div>
              <div>
                <small>PRAZO</small>
                <b>
                  {project.dueDate
                    ? new Intl.DateTimeFormat("pt-BR").format(
                        new Date(project.dueDate),
                      )
                    : "Sem prazo"}
                </b>
              </div>
            </section>
            <section className="project-about">
              <h3>Sobre o projeto</h3>
              <p>{project.description || "Nenhuma descrição adicionada."}</p>
            </section>
            <section className="project-task-table">
              <h3>
                Tarefas <i>{total}</i>
              </h3>
              {project.tasks.length === 0 ? (
                <div className="empty-state">Nenhuma tarefa neste projeto.</div>
              ) : (
                project.tasks.map((t) => (
                  <div key={t.id}>
                    <span
                      className={`status-dot ${t.status === "DONE" ? "s2" : t.status === "IN_PROGRESS" ? "s1" : "s0"}`}
                    />
                    <b>{t.title}</b>
                    <span
                      className={`priority ${t.priority === "HIGH" || t.priority === "URGENT" ? "alta" : t.priority === "MEDIUM" ? "media" : "baixa"}`}
                    >
                      {t.priority}
                    </span>
                    <small>
                      {t.dueDate
                        ? new Intl.DateTimeFormat("pt-BR").format(
                            new Date(t.dueDate),
                          )
                        : "Sem prazo"}
                    </small>
                  </div>
                ))
              )}
            </section>
            {error && <p className="form-error">{error}</p>}
          </div>
        )}
      </aside>
    </>
  );
}
type ApiTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  project: { name: string; color: string };
  assignee?: { name: string };
};
function Kanban({ refreshKey = 0 }: { refreshKey?: number }) {
  const initial: ApiTask[] = tasks.map((t, i) => ({
    id: `demo-${i}`,
    title: t.title,
    status: i < 2 ? "TODO" : i === 2 ? "IN_PROGRESS" : "DONE",
    priority:
      t.priority === "Alta"
        ? "HIGH"
        : t.priority === "Média"
          ? "MEDIUM"
          : "LOW",
    dueDate: t.date,
    project: { name: t.project, color: t.color },
    assignee: { name: t.avatar },
  }));
  const [data, setData] = useState(initial),
    [dragged, setDragged] = useState<string | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!localStorage.getItem("taskflow-token")) return;
    void api<ApiTask[]>("/tasks")
      .then(setData)
      .catch(() => undefined);
  }, [refreshKey]);
  const labels: Record<string, string> = {
      LOW: "Baixa",
      MEDIUM: "Média",
      HIGH: "Alta",
      URGENT: "Urgente",
    },
    columns = [
      ["TODO", "A fazer"],
      ["IN_PROGRESS", "Em andamento"],
      ["DONE", "Concluído"],
    ];
  const move = async (status: string) => {
    if (!dragged) return;
    const previous = data;
    setData((items) =>
      items.map((t) => (t.id === dragged ? { ...t, status } : t)),
    );
    if (!dragged.startsWith("demo-"))
      try {
        await api(`/tasks/${dragged}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
      } catch {
        setData(previous);
      }
    setDragged(null);
  };
  return (
    <>
      <div className="kanban">
        {columns.map((c, ci) => {
          const items = data.filter(
            (t) =>
              t.status === c[0] ||
              (c[0] === "TODO" && t.status === "BACKLOG") ||
              (c[0] === "IN_PROGRESS" && t.status === "REVIEW"),
          );
          return (
            <div
              className="kanban-col"
              key={c[0]}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void move(c[0])}
            >
              <header>
                <span className={`status-dot s${ci}`} />
                <b>{c[1]}</b>
                <i>{items.length}</i>
                <Icon name="more" />
              </header>
              {items.map((t) => (
                <article
                  draggable
                  onDragStart={() => setDragged(t.id)}
                  onClick={() => !t.id.startsWith("demo-") && setSelected(t.id)}
                  className="kanban-task card"
                  key={t.id}
                >
                  <span
                    className={`priority ${(labels[t.priority] ?? t.priority).toLowerCase().replace("é", "e")}`}
                  >
                    {labels[t.priority] ?? t.priority}
                  </span>
                  <h3>{t.title}</h3>
                  <p>
                    <i style={{ background: t.project.color }} />
                    {t.project.name}
                  </p>
                  <footer>
                    <span className="date">
                      <Icon name="calendar" size={14} />
                      {t.dueDate
                        ? /^[A-Z]/.test(t.dueDate)
                          ? t.dueDate
                          : new Intl.DateTimeFormat("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            }).format(new Date(t.dueDate))
                        : "Sem prazo"}
                    </span>
                    <span className="mini-avatar">
                      {t.assignee?.name
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("") ?? "—"}
                    </span>
                  </footer>
                </article>
              ))}
              <button className="add-task">
                <Icon name="plus" /> Adicionar tarefa
              </button>
            </div>
          );
        })}
      </div>
      {selected && (
        <TaskDetail
          taskId={selected}
          close={() => setSelected(null)}
          updated={() => {
            setSelected(null);
            void api<ApiTask[]>("/tasks").then(setData);
          }}
        />
      )}
    </>
  );
}
type TaskComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; avatarUrl?: string };
};
type TaskAttachment = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
};
type TaskDetailData = {
  id: string;
  projectId:string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  subtasks: { id: string; title: string; status: string }[];
};
function TaskDetail({
  taskId,
  close,
  updated,
}: {
  taskId: string;
  close: () => void;
  updated: () => void;
}) {
  const [task, setTask] = useState<TaskDetailData | null>(null),
    [comment, setComment] = useState(""),
    [subtaskTitle, setSubtaskTitle] = useState(""),
    [sending, setSending] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(() =>
    void api<TaskDetailData>(`/tasks/${taskId}`)
      .then(setTask)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar"),
      ), [taskId]);
  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("taskflow:comment", refresh);
    window.addEventListener("taskflow:attachment", refresh);
    return () => {
      window.removeEventListener("taskflow:comment", refresh);
      window.removeEventListener("taskflow:attachment", refresh);
    };
  }, [load]);
  const change = async (field: string, value: string) => {
    if (!task) return;
    setTask({ ...task, [field]: value });
    try {
      await api(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    }
  };
  const send = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await api(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment }),
      });
      setComment("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao comentar");
    } finally {
      setSending(false);
    }
  };
  const addFile = async (file?: File) => {
    if (!file) return;
    setSending(true);
    try {
      await upload(`/tasks/${taskId}/attachments`, file);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setSending(false);
    }
  };
  const addSubtask=async()=>{if(!task||!subtaskTitle.trim())return;setSending(true);try{await api('/tasks',{method:'POST',body:JSON.stringify({title:subtaskTitle,projectId:task.projectId,parentId:task.id,priority:'MEDIUM'})});setSubtaskTitle('');load()}catch(e){setError(e instanceof Error?e.message:'Erro ao criar subtarefa')}finally{setSending(false)}};
  return (
    <>
      <div className="modal-backdrop" onClick={close} />
      <aside className="task-detail">
        <header>
          <div>
            <span className="task-breadcrumb">
              Tarefa · {task?.id.slice(-6)}
            </span>
            <h2>{task?.title ?? "Carregando..."}</h2>
          </div>
          <button
            onClick={() => {
              updated();
              close();
            }}
          >
            <Icon name="close" />
          </button>
        </header>
        {task && (
          <div className="task-detail-body">
            <div className="task-main">
              <section className="task-properties">
                <label>
                  Status
                  <select
                    value={task.status}
                    onChange={(e) => void change("status", e.target.value)}
                  >
                    <option value="TODO">A fazer</option>
                    <option value="IN_PROGRESS">Em andamento</option>
                    <option value="REVIEW">Em revisão</option>
                    <option value="DONE">Concluído</option>
                  </select>
                </label>
                <label>
                  Prioridade
                  <select
                    value={task.priority}
                    onChange={(e) => void change("priority", e.target.value)}
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </label>
                <label>
                  Prazo
                  <input
                    type="date"
                    value={task.dueDate?.slice(0, 10) ?? ""}
                    onChange={(e) => void change("dueDate", e.target.value)}
                  />
                </label>
              </section>
              <section className="task-description">
                <h3>Descrição</h3>
                <p>{task.description || "Nenhuma descrição adicionada."}</p>
              </section>
              <section className="comments">
                <h3>
                  Comentários <i>{task.comments.length}</i>
                </h3>
                <div className="comment-composer">
                  <span className="mini-avatar">ER</span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                  />
                  <button onClick={() => void send()} disabled={sending}>
                    <Icon name="arrow" />
                  </button>
                </div>
                {task.comments.map((c) => (
                  <article key={c.id}>
                    <span className="mini-avatar">
                      {c.author.name
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <b>{c.author.name}</b>
                      <small>
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(c.createdAt))}
                      </small>
                      <p>{c.body}</p>
                    </div>
                  </article>
                ))}
              </section>
            </div>
            <aside className="task-side">
              <h3>Anexos</h3>
              <label className="upload-zone">
                <Icon name="plus" />
                <b>Adicionar arquivo</b>
                <small>Máximo de 20 MB</small>
                <input
                  type="file"
                  onChange={(e) => void addFile(e.target.files?.[0])}
                />
              </label>
              <div className="attachment-list">
                {task.attachments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      void download(`/attachments/${a.id}/download`, a.name)
                    }
                  >
                    <span>
                      <Icon name="folder" />
                    </span>
                    <div>
                      <b>{a.name}</b>
                      <small>{(a.size / 1024).toFixed(0)} KB</small>
                    </div>
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
              <h3>Subtarefas</h3>
              <div className="subtask-add"><input value={subtaskTitle} onChange={e=>setSubtaskTitle(e.target.value)} placeholder="Nova subtarefa..."/><button onClick={()=>void addSubtask()} disabled={sending}><Icon name="plus"/></button></div>
              {task.subtasks.length > 0 && (
                <>
                  {task.subtasks.map((s) => (
                    <div className="subtask" key={s.id}>
                      <Icon name="check" />
                      {s.title}
                    </div>
                  ))}
                </>
              )}
              {error && <p className="form-error">{error}</p>}
            </aside>
          </div>
        )}
      </aside>
    </>
  );
}

function CreateModal({
  type,
  close,
  created,
}: {
  type: "projects" | "tasks";
  close: () => void;
  created: () => void;
}) {
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [dueDate, setDueDate] = useState(""),
    [color, setColor] = useState("#6f60df"),
    [priority, setPriority] = useState("MEDIUM"),
    [projectId, setProjectId] = useState(""),
    [projectOptions, setProjectOptions] = useState<ApiProject[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (type === "tasks" && localStorage.getItem("taskflow-token"))
      void api<ApiProject[]>("/projects").then((items) => {
        setProjectOptions(items);
        setProjectId(items[0]?.id ?? "");
      });
  }, [type]);
  const submit = async () => {
    if (!localStorage.getItem("taskflow-token"))
      return setError(
        "Entre com uma conta conectada à API para criar novos registros.",
      );
    if (!name.trim()) return setError("Informe um nome.");
    if (type === "tasks" && !projectId)
      return setError("Crie ou selecione um projeto.");
    setLoading(true);
    setError("");
    try {
      await api(type === "projects" ? "/projects" : "/tasks", {
        method: "POST",
        body: JSON.stringify(
          type === "projects"
            ? { name, description, color, dueDate: dueDate || undefined }
            : {
                title: name,
                description,
                projectId,
                priority,
                dueDate: dueDate || undefined,
              },
        ),
      });
      created();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="modal-backdrop" onClick={close} />
      <div className="modal-card">
        <header>
          <div>
            <span className="modal-icon">
              <Icon name={type === "projects" ? "folder" : "check"} />
            </span>
            <h2>{type === "projects" ? "Novo projeto" : "Nova tarefa"}</h2>
            <p>
              {type === "projects"
                ? "Organize uma nova iniciativa da equipe."
                : "Transforme uma prioridade em trabalho claro."}
            </p>
          </div>
          <button onClick={close}>
            <Icon name="close" />
          </button>
        </header>
        <div className="modal-form">
          <label>
            {type === "projects" ? "Nome do projeto" : "Título da tarefa"}
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === "projects"
                  ? "Ex.: Lançamento do produto"
                  : "Ex.: Revisar protótipo"
              }
            />
          </label>
          <label>
            Descrição
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione contexto e objetivos..."
            />
          </label>
          {type === "tasks" && (
            <div className="form-row">
              <label>
                Projeto
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prioridade
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </label>
            </div>
          )}
          <div className="form-row">
            <label>
              Prazo
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            {type === "projects" && (
              <label>
                Cor do projeto
                <input
                  className="color-input"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <footer>
          <button className="secondary" onClick={close}>
            Cancelar
          </button>
          <button
            className="primary"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Criar agora"}
            <Icon name="arrow" />
          </button>
        </footer>
      </div>
    </>
  );
}

function Calendar() {
  const [month, setMonth] = useState(
      () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [calendarTasks, setCalendarTasks] = useState<ApiTask[]>([]);
  useEffect(() => {
    if (localStorage.getItem("taskflow-token"))
      void api<ApiTask[]>("/tasks")
        .then(setCalendarTasks)
        .catch(() => undefined);
  }, []);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay(),
    daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate(),
    daysPrevious = new Date(month.getFullYear(), month.getMonth(), 0).getDate(),
    today = new Date();
  return (
    <div className="calendar card">
      <div className="calendar-head">
        <button
          onClick={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
        >
          ‹
        </button>
        <h3>
          {new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
          }).format(month)}
        </h3>
        <button
          onClick={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
        >
          ›
        </button>
      </div>
      <div className="week">
        {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((x) => (
          <b key={x}>{x}</b>
        ))}
      </div>
      <div className="days">
        {Array.from({ length: 42 }, (_, i) => {
          const raw = i - firstDay + 1,
            inCurrent = raw >= 1 && raw <= daysInMonth,
            d =
              raw < 1
                ? daysPrevious + raw
                : raw > daysInMonth
                  ? raw - daysInMonth
                  : raw;
          const events = inCurrent
            ? calendarTasks.filter((t) => {
                if (!t.dueDate || !/^\d/.test(t.dueDate)) return false;
                const date = new Date(t.dueDate);
                return (
                  date.getFullYear() === month.getFullYear() &&
                  date.getMonth() === month.getMonth() &&
                  date.getDate() === d
                );
              })
            : [];
          return (
            <div
              key={i}
              className={`${inCurrent && d === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear() ? "today" : ""} ${!inCurrent ? "muted" : ""}`}
            >
              <span>{d}</span>
              {events.slice(0, 2).map((task, index) => (
                <i key={task.id} className={`event e${index % 3}`}>
                  {task.title}
                </i>
              ))}
              {events.length > 2 && (
                <small className="more-events">
                  +{events.length - 2} tarefas
                </small>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
type TeamMember = {
  id: string;
  role: string;
  user: { name: string; email: string; _count?: { assignedTasks: number } };
};
function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]),
    [invite, setInvite] = useState(false),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("MEMBER"),
    [error, setError] = useState("");
  const load = () => {
    if (localStorage.getItem("taskflow-token"))
      void api<TeamMember[]>("/team")
        .then(setMembers)
        .catch(() => undefined);
  };
  useEffect(load, []);
  const labels: Record<string, string> = {
    OWNER: "Proprietário",
    ADMIN: "Administrador",
    MANAGER: "Gestor",
    MEMBER: "Membro",
    VIEWER: "Observador",
  };
  const add = async () => {
    setError("");
    try {
      await api("/team", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      setInvite(false);
      setEmail("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar");
    }
  };
  const updateRole = async (id: string, next: string) => {
    try {
      await api(`/team/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: next }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar função");
    }
  };
  const remove = async (id: string) => {
    try {
      await api(`/team/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
    }
  };
  if (!members.length)
    return (
      <div className="team-empty card">
        <span>
          <Icon name="users" />
        </span>
        <h3>Monte sua equipe</h3>
        <p>Adicione usuários que já possuem uma conta no TaskFlow AI.</p>
        <button className="primary" onClick={() => setInvite(true)}>
          <Icon name="plus" />
          Adicionar membro
        </button>
        {invite && (
          <TeamInvite
            email={email}
            setEmail={setEmail}
            role={role}
            setRole={setRole}
            error={error}
            close={() => setInvite(false)}
            add={add}
          />
        )}
      </div>
    );
  return (
    <>
      <div className="team-toolbar">
        <p>{members.length} membro(s) no espaço</p>
        <button className="primary" onClick={() => setInvite(true)}>
          <Icon name="plus" />
          Adicionar membro
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="team-admin card">
        {members.map((m, i) => (
          <div className="team-admin-row" key={m.id}>
            <span className={`member-avatar a${i}`}>
              {m.user.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <b>{m.user.name}</b>
              <small>{m.user.email}</small>
            </div>
            <span className="task-count">
              {m.user._count?.assignedTasks ?? 0} tarefas
            </span>
            <select
              value={m.role}
              disabled={m.role === "OWNER"}
              onChange={(e) => void updateRole(m.id, e.target.value)}
            >
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <i className="online">Ativo</i>
            <button
              className="remove-member"
              disabled={m.role === "OWNER"}
              onClick={() => void remove(m.id)}
            >
              <Icon name="close" />
            </button>
          </div>
        ))}
      </div>
      {invite && (
        <TeamInvite
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
          error={error}
          close={() => setInvite(false)}
          add={add}
        />
      )}
    </>
  );
}
function TeamInvite({
  email,
  setEmail,
  role,
  setRole,
  error,
  close,
  add,
}: {
  email: string;
  setEmail: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  error: string;
  close: () => void;
  add: () => Promise<void>;
}) {
  return (
    <>
      <div className="modal-backdrop" onClick={close} />
      <div className="modal-card invite-modal">
        <header>
          <div>
            <span className="modal-icon">
              <Icon name="users" />
            </span>
            <h2>Adicionar membro</h2>
            <p>O usuário precisa já possuir uma conta.</p>
          </div>
          <button onClick={close}>
            <Icon name="close" />
          </button>
        </header>
        <div className="modal-form">
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pessoa@empresa.com"
            />
          </label>
          <label>
            Função
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gestor</option>
              <option value="MEMBER">Membro</option>
              <option value="VIEWER">Observador</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
        </div>
        <footer>
          <button className="secondary" onClick={close}>
            Cancelar
          </button>
          <button className="primary" onClick={() => void add()}>
            Adicionar à equipe
          </button>
        </footer>
      </div>
    </>
  );
}
type ProjectRisk = {
  id: string;
  name: string;
  score: number;
  level: string;
  overdueTasks: number;
  highPriorityTasks: number;
  daysToDeadline: number | null;
};
function Reports() {
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  useEffect(() => {
    if (localStorage.getItem("taskflow-token"))
      void api<ProjectRisk[]>("/dashboard/risks")
        .then(setRisks)
        .catch(() => undefined);
  }, []);
  const top = risks[0];
  const exportReport=()=>{const rows=['Projeto,Risco,Nível,Tarefas atrasadas,Alta prioridade,Dias para o prazo',...risks.map(r=>`"${r.name}",${r.score},${r.level},${r.overdueTasks},${r.highPriorityTasks},${r.daysToDeadline??''}`)];const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`taskflow-relatorio-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)};
  return (
    <div className="reports">
      <div className="card report-hero">
        <CardHead
          title="Visão geral de desempenho"
          sub="Últimos 30 dias"
          action="Exportar CSV"
          onAction={exportReport}
        />
        <div className="line-chart">
          <svg viewBox="0 0 700 220" preserveAspectRatio="none">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7466e8" stopOpacity=".28" />
                <stop offset="1" stopColor="#7466e8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 190 C80 180 90 130 150 140 S250 175 310 100 S400 130 460 72 S580 110 700 34 V220H0Z"
              fill="url(#g)"
            />
            <path
              d="M0 190 C80 180 90 130 150 140 S250 175 310 100 S400 130 460 72 S580 110 700 34"
              fill="none"
              stroke="#7466e8"
              strokeWidth="4"
            />
          </svg>
        </div>
      </div>
      <div className="report-side card">
        <h3>Insights da IA</h3>
        <span className="insight-icon">
          <Icon name="spark" />
        </span>
        <b>{top ? `${top.name} requer atenção` : "Produtividade em alta"}</b>
        <p>
          {top
            ? `Índice de risco ${top.score}/100, com ${top.overdueTasks} tarefa(s) atrasada(s) e ${top.highPriorityTasks} prioridade(s) alta(s).`
            : "Nenhum risco crítico foi identificado nos projetos ativos."}
        </p>
        <button
          className="secondary"
          onClick={() =>
            document
              .querySelector(".risk-table")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Ver análise completa
        </button>
      </div>
      <div className="risk-table card">
        <div className="card-head">
          <div>
            <h3>Risco dos projetos</h3>
            <p>Calculado a partir de prazos, bloqueios e prioridades</p>
          </div>
        </div>
        {risks.length === 0 ? (
          <div className="empty-state">
            <span>
              <Icon name="chart" />
            </span>
            <h3>Nenhum risco identificado</h3>
            <p>Os projetos ativos estão dentro do esperado.</p>
          </div>
        ) : (
          risks.map((r) => (
            <div className="risk-row" key={r.id}>
              <span className={`risk-badge ${r.level.toLowerCase()}`}>
                {r.score}
              </span>
              <div>
                <b>{r.name}</b>
                <small>
                  {r.overdueTasks} atrasadas · {r.highPriorityTasks} alta
                  prioridade
                </small>
              </div>
              <div className="risk-meter">
                <i style={{ width: `${r.score}%` }} />
              </div>
              <strong>
                {r.level === "HIGH"
                  ? "Alto"
                  : r.level === "MEDIUM"
                    ? "Médio"
                    : "Baixo"}
              </strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function AdminPage(){const[stats,setStats]=useState<DashboardData['stats']|null>(null),[members,setMembers]=useState<TeamMember[]>([]),[workspace,setWorkspace]=useState<{name:string;slug:string}|null>(null);useEffect(()=>{if(!localStorage.getItem('taskflow-token'))return;void Promise.all([api<DashboardData>('/dashboard'),api<TeamMember[]>('/team'),api<{name:string;slug:string}>('/workspace')]).then(([dashboard,team,space])=>{setStats(dashboard.stats);setMembers(team);setWorkspace(space)}).catch(()=>undefined)},[]);return <div className="admin-page"><section className="module-title"><div><h1>Administração</h1><p>Visão geral, governança e segurança do espaço de trabalho.</p></div><span className="admin-status"><i/>Todos os sistemas operacionais</span></section><div className="admin-stats"><div className="card"><small>MEMBROS</small><b>{members.length}</b><p>Usuários com acesso</p></div><div className="card"><small>PROJETOS ATIVOS</small><b>{stats?.activeProjects??0}</b><p>Iniciativas em andamento</p></div><div className="card"><small>TAREFAS CONCLUÍDAS</small><b>{stats?.completed??0}</b><p>Histórico do espaço</p></div><div className="card"><small>ORGANIZAÇÃO</small><b className="workspace-title">{workspace?.name??'Nexora Labs'}</b><p>{workspace?.slug??'workspace'}</p></div></div><div className="admin-grid"><div className="card role-matrix"><h3>Matriz de permissões</h3><p>Permissões aplicadas e validadas pela API.</p>{[['Proprietário','Acesso total e propriedade'],['Administrador','Equipe, projetos e configurações'],['Gestor','Projetos e tarefas'],['Membro','Colaboração e execução'],['Observador','Acesso somente leitura']].map((r,i)=><div key={r[0]}><span className={`role-dot r${i}`}/><b>{r[0]}</b><small>{r[1]}</small><Icon name="check"/></div>)}</div><div className="card security-card"><h3>Segurança</h3><div><Icon name="check"/><span><b>Autenticação JWT</b><small>Sessões protegidas e assinadas</small></span></div><div><Icon name="check"/><span><b>Isolamento multiempresa</b><small>Consultas limitadas à organização</small></span></div><div><Icon name="check"/><span><b>Rate limiting</b><small>Proteção contra abuso e força bruta</small></span></div><div><Icon name="check"/><span><b>Auditoria em tempo real</b><small>Trilha completa de alterações</small></span></div></div></div></div>}

type ActivityItem={id:string;action:string;entityType:string;entityId:string;metadata?:Record<string,unknown>;createdAt:string;actor:{name:string;avatarUrl?:string}}
function ActivityTimeline(){const[items,setItems]=useState<ActivityItem[]>([]),[filter,setFilter]=useState('all'),[loading,setLoading]=useState(true);const load=()=>{if(!localStorage.getItem('taskflow-token')){setLoading(false);return}void api<ActivityItem[]>('/activities').then(setItems).finally(()=>setLoading(false))};useEffect(()=>{load();const refresh=()=>load();window.addEventListener('taskflow:activity',refresh);window.addEventListener('taskflow:comment',refresh);return()=>{window.removeEventListener('taskflow:activity',refresh);window.removeEventListener('taskflow:comment',refresh)}},[]);const labels:Record<string,string>={'project.created':'criou o projeto','project.updated':'atualizou o projeto','project.archived':'arquivou o projeto','task.created':'criou a tarefa','task.updated':'atualizou a tarefa','task.status_changed':'alterou o status da tarefa','task.deleted':'excluiu a tarefa','comment.created':'comentou em uma tarefa','ai.plan_applied':'aplicou um plano da IA'};const visible=filter==='all'?items:filter==='ai'?items.filter(x=>x.action.startsWith('ai.')):items.filter(x=>x.entityType===filter);return <div className="history-page"><section className="module-title"><div><h1>Histórico de atividades</h1><p>Uma trilha completa e segura das mudanças no espaço.</p></div><select className="history-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas as atividades</option><option value="project">Projetos</option><option value="task">Tarefas</option><option value="ai">Inteligência Artificial</option></select></section><div className="activity-card card">{loading?<div className="empty-state">Carregando histórico...</div>:visible.length===0?<div className="empty-state"><span><Icon name="clock"/></span><h3>Nenhuma atividade</h3><p>As mudanças realizadas pela equipe aparecerão aqui.</p></div>:visible.map((item,index)=>{const name=String(item.metadata?.name??item.metadata?.title??item.entityType);return <article className="activity-item" key={item.id}><div className="activity-line">{index<visible.length-1&&<i/>}</div><span className={`activity-symbol ${item.entityType}`}><Icon name={item.action.startsWith('ai.')?'spark':item.entityType==='project'?'folder':item.action.includes('comment')?'check':'clock'}/></span><div><p><b>{item.actor.name}</b> {labels[item.action]??'realizou uma alteração'} <strong>{name}</strong></p><small>{new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.createdAt))}</small>{item.action==='task.status_changed'&&<em>{String(item.metadata?.from??'')} → {String(item.metadata?.to??'')}</em>}</div></article>})}</div></div>}

type AppNotification = {
  id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string;
  createdAt: string;
};
function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([]),
    [loading, setLoading] = useState(true);
  const load = () => {
    if (!localStorage.getItem("taskflow-token")) {
      setLoading(false);
      return;
    }
    void api<AppNotification[]>("/notifications")
      .then(setItems)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const read = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    setItems((list) =>
      list.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
  };
  const readAll = async () => {
    await api("/notifications/read-all", { method: "PATCH" });
    setItems((list) =>
      list.map((n) => ({ ...n, readAt: new Date().toISOString() })),
    );
  };
  return (
    <div className="notifications-page">
      <section className="module-title">
        <div>
          <h1>Central de notificações</h1>
          <p>Acompanhe comentários, prazos e mudanças importantes.</p>
        </div>
        {items.some((n) => !n.readAt) && (
          <button className="secondary" onClick={() => void readAll()}>
            <Icon name="check" />
            Marcar todas como lidas
          </button>
        )}
      </section>
      <div className="notification-panel card">
        {loading ? (
          <div className="empty-state">Carregando notificações...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <span>
              <Icon name="bell" />
            </span>
            <h3>Tudo em dia</h3>
            <p>Novas atualizações da sua equipe aparecerão aqui.</p>
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              className={`notification-item ${n.readAt ? "read" : ""}`}
              onClick={() => !n.readAt && void read(n.id)}
            >
              <span className="notification-kind">
                <Icon name={n.type.includes("COMMENT") ? "check" : "bell"} />
              </span>
              <div>
                <b>{n.title}</b>
                <p>{n.body}</p>
                <small>
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(n.createdAt))}
                </small>
              </div>
              {!n.readAt && <i />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function AccountPage({
  page,
  onLogout,
}: {
  page: string;
  onLogout: () => void;
}) {
  let session: any = {};
  try {
    session = JSON.parse(localStorage.getItem("taskflow-session") ?? "{}");
  } catch {
    session = {};
  }
  const user = session.user ?? {
      name: "Erick Reis",
      email: "demo@taskflow.ai",
    },
    organization = session.organization ?? { name: "Nexora Labs" };
  const [weekly, setWeekly] = useState(user.preferences?.weekly??true),
    [mentions, setMentions] = useState(user.preferences?.mentions??true),
    [deadline, setDeadline] = useState(user.preferences?.deadline??true),
    [timezone,setTimezone]=useState(user.preferences?.timezone??'America/Manaus'),
    [profileName, setProfileName] = useState(user.name),
    [workspaceName, setWorkspaceName] = useState(organization.name),
    [saved, setSaved] = useState("");
  const saveProfile = async () => {
    if (!localStorage.getItem("taskflow-token"))
      return setSaved("Disponível para contas conectadas à API.");
    try {
      const updated = await api<{ name: string }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: profileName }),
      });
      const next = { ...session, user: { ...session.user, ...updated } };
      localStorage.setItem("taskflow-session", JSON.stringify(next));
      setSaved("Perfil atualizado com sucesso.");
    } catch (e) {
      setSaved(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };
  const saveWorkspace = async () => {
    if (!localStorage.getItem("taskflow-token"))
      return setSaved("Disponível para contas conectadas à API.");
    try {
      const [updated]=await Promise.all([api<{ name: string }>("/workspace", {method: "PATCH",body: JSON.stringify({ name: workspaceName })}),api('/auth/preferences',{method:'PATCH',body:JSON.stringify({mentions,deadline,weekly,timezone})})]);
      const next = {
        ...session,
        organization: { ...session.organization, ...updated },
      };
      localStorage.setItem("taskflow-session", JSON.stringify(next));
      setSaved("Espaço atualizado com sucesso.");
    } catch (e) {
      setSaved(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };
  const persistPreference=async(key:'mentions'|'deadline'|'weekly',value:boolean)=>{if(!localStorage.getItem('taskflow-token'))return;try{await api('/auth/preferences',{method:'PATCH',body:JSON.stringify({mentions,deadline,weekly,[key]:value,timezone})})}catch(e){setSaved(e instanceof Error?e.message:'Erro ao salvar preferência')}};
  if (page === "profile")
    return (
      <div className="account-page">
        <section className="module-title">
          <div>
            <h1>Meu perfil</h1>
            <p>Suas informações pessoais e preferências de conta.</p>
          </div>
        </section>
        <div className="account-grid">
          <div className="card profile-card">
            <span className="profile-avatar">
              {user.name
                .split(" ")
                .map((x: string) => x[0])
                .slice(0, 2)
                .join("")}
            </span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <i>Administrador</i>
            <button className="secondary">Alterar foto</button>
          </div>
          <div className="card settings-card">
            <h3>Informações pessoais</h3>
            <label>
              Nome completo
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </label>
            <label>
              E-mail
              <input defaultValue={user.email} disabled />
            </label>
            <label>
              Cargo
              <input defaultValue="Administrador" />
            </label>
            <footer>
              {saved && <small className="save-feedback">{saved}</small>}
              <button className="primary" onClick={() => void saveProfile()}>
                Salvar alterações
              </button>
            </footer>
          </div>
        </div>
      </div>
    );
  return (
    <div className="account-page">
      <section className="module-title">
        <div>
          <h1>Configurações</h1>
          <p>Personalize seu espaço de trabalho e suas notificações.</p>
        </div>
      </section>
      <div className="settings-layout">
        <div className="card settings-card">
          <h3>Espaço de trabalho</h3>
          <label>
            Nome da empresa
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </label>
          <label>
            Fuso horário
            <select value={timezone} onChange={e=>setTimezone(e.target.value)}>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
            </select>
          </label>
          <footer>
            {saved && <small className="save-feedback">{saved}</small>}
            <button className="primary" onClick={() => void saveWorkspace()}>
              Salvar configurações
            </button>
          </footer>
        </div>
        <div className="card preferences">
          <h3>Notificações</h3>
          <Toggle
            label="Menções e comentários"
            description="Quando alguém mencionar você"
            value={mentions}
            set={(v)=>{setMentions(v);void persistPreference('mentions',v)}}
          />
          <Toggle
            label="Lembretes de prazo"
            description="Alertas para tarefas próximas do vencimento"
            value={deadline}
            set={(v)=>{setDeadline(v);void persistPreference('deadline',v)}}
          />
          <Toggle
            label="Resumo semanal"
            description="Relatório de produtividade por e-mail"
            value={weekly}
            set={(v)=>{setWeekly(v);void persistPreference('weekly',v)}}
          />
          <div className="danger-zone">
            <b>Sessão atual</b>
            <p>Saia com segurança deste dispositivo.</p>
            <button onClick={onLogout}>Encerrar sessão</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Toggle({
  label,
  description,
  value,
  set,
}: {
  label: string;
  description: string;
  value: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <div>
        <b>{label}</b>
        <small>{description}</small>
      </div>
      <button className={value ? "on" : ""} onClick={() => set(!value)}>
        <i />
      </button>
    </div>
  );
}

type PlannedTask={title:string;description:string;priority:string;estimateHours:number}
type AiPlan={summary:string;tasks:PlannedTask[];source:string;model?:string}
function Copilot({ close }: { close: () => void }) {
  const [text,setText]=useState(''),[answer,setAnswer]=useState(''),[loading,setLoading]=useState(false),[plan,setPlan]=useState<AiPlan|null>(null),[projectOptions,setProjectOptions]=useState<ApiProject[]>([]),[projectId,setProjectId]=useState(''),[applied,setApplied]=useState('');
  const suggestions=useMemo(()=>['Crie as tarefas necessárias para uma landing page','Quais projetos estão em risco?','Organize minhas tarefas da semana','Gere um resumo executivo'],[]);
  useEffect(()=>{if(localStorage.getItem('taskflow-token'))void api<ApiProject[]>('/projects').then(items=>{setProjectOptions(items);setProjectId(items[0]?.id??'')}).catch(()=>undefined)},[]);
  const send=async()=>{if(!text.trim())return;setLoading(true);setAnswer('');setPlan(null);setApplied('');try{const wantsPlan=/(crie|criar|divida|planej|tarefas necessárias)/i.test(text);if(wantsPlan){const result=await api<AiPlan>('/ai/plan',{method:'POST',body:JSON.stringify({prompt:text,projectId:projectId||undefined})});setPlan(result)}else{const result=await api<{answer:string}>('/ai/ask',{method:'POST',body:JSON.stringify({message:text})});setAnswer(result.answer)}}catch(e){setAnswer(e instanceof Error?e.message:'Não foi possível consultar o copiloto')}finally{setLoading(false)}};
  const apply=async()=>{if(!plan||!projectId)return setApplied('Selecione um projeto para continuar.');setLoading(true);try{const result=await api<{created:number}>('/ai/apply-plan',{method:'POST',body:JSON.stringify({projectId,tasks:plan.tasks})});setApplied(`${result.created} tarefa(s) foram criadas com sucesso.`)}catch(e){setApplied(e instanceof Error?e.message:'Não foi possível criar as tarefas')}finally{setLoading(false)}};
  return (
    <>
      <div className="copilot-overlay" onClick={close} />
      <aside className="copilot">
        <header>
          <span className="brand-mark">
            <Icon name="spark" />
          </span>
          <div>
            <b>Copiloto TaskFlow</b>
            <small>Seu assistente de produtividade</small>
          </div>
          <button onClick={close}>
            <Icon name="close" />
          </button>
        </header>
        <div className="chat">
          <div className="ai-hero">
            <span>
              <Icon name="spark" size={25} />
            </span>
            <h2>Como posso ajudar?</h2>
            <p>Analiso seus projetos e transformo ideias em ações.</p>
          </div>
          {plan ? <div className="ai-plan"><div className="ai-plan-summary"><Icon name="spark"/><p>{plan.summary}</p></div><label>Adicionar ao projeto<select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Selecione um projeto</option>{projectOptions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="planned-tasks">{plan.tasks.map((task,index)=><article key={`${task.title}-${index}`}><span>{index+1}</span><div><b>{task.title}</b><small>{task.priority} · {task.estimateHours}h</small></div><button onClick={()=>setPlan({...plan,tasks:plan.tasks.filter((_,i)=>i!==index)})}><Icon name="close" size={14}/></button></article>)}</div>{applied?<p className="apply-feedback">{applied}</p>:<button className="primary apply-plan" onClick={()=>void apply()} disabled={loading||!plan.tasks.length}><Icon name="check"/>Confirmar e criar {plan.tasks.length} tarefas</button>}</div>:answer ? (
            <div className="ai-answer">
              <Icon name="spark" />
              <p>{answer}</p>
            </div>
          ) : (
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setText(s)}>
                  <Icon name="spark" size={15} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="composer">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Peça para criar, resumir ou organizar..."
          />
          <button onClick={send} disabled={loading}>
            {loading ? "…" : <Icon name="arrow" />}
          </button>
          <small>
            A IA pode cometer erros. Confira informações importantes.
          </small>
        </div>
      </aside>
    </>
  );
}
export default App;
