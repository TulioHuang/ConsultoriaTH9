import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const G = "#C9A84C", B = "#0A0A0A", D = "#141414", GR = "#1C1C1C", LG = "#252525", W = "#FFFFFF";

const uid = () => Date.now() + "_" + Math.random().toString(36).slice(2, 6);
const now = () => new Date().toISOString();
const fmtDate = iso => { if (!iso) return "—"; const d = new Date(iso); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
const fmtDateInput = d => { if (!d) return "—"; const [y,m,dia] = d.split("-"); return `${dia}/${m}/${y}`; };
const fmtBRL = v => "R$" + Number(v||0).toLocaleString("pt-BR");
const mesAtual = () => new Date().toLocaleString("pt-BR",{month:"long",year:"numeric"});
const getDias = venc => { if (!venc) return null; const h = new Date(); h.setHours(0,0,0,0); return Math.round((new Date(venc+"T00:00:00") - h) / 864e5); };
const precoPlano = p => parseInt((p||"").split("R$")[1]||"0");

const PLANOS = ["Mensal - R$200","Trimestral - R$497","Semestral - R$697"];
const OBJETIVOS = ["Emagrecimento","Hipertrofia","Condicionamento","Saúde geral","Força"];
const CHECKINS = ["Toda segunda","Toda terça","Toda quarta","Toda quinta","Toda sexta","Todo sábado"];
const SK = "th9_sys_v1";

function load(k, def) { try { const d = localStorage.getItem(k); return d ? JSON.parse(d) : def; } catch { return def; } }
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function statusVenc(dias) {
  if (dias === null) return { l: "Sem data", c: "bgray" };
  if (dias < 0) return { l: `Vencido ${Math.abs(dias)}d`, c: "bred" };
  if (dias === 0) return { l: "Hoje!", c: "bred" };
  if (dias <= 5) return { l: `${dias}d`, c: "borg" };
  return { l: `${dias} dias`, c: "bgreen" };
}

function gerarMsgCobranca(a) {
  return `Olá, ${a.nome}! 👋\n\nSua mensalidade do plano *${a.plano?.split(" - ")[0]}* vence em breve.\n\n📅 Vencimento: ${fmtDateInput(a.vencimento)}\n💰 Valor: *${a.plano?.split(" - ")[1]}*\n\nPara renovar é só me chamar! 🔥\n— Tulio | Consultoria TH9`;
}

const HIST_MENSAL = [
  {mes:"Jan",fat:400,ativos:2},{mes:"Fev",fat:697,ativos:4},{mes:"Mar",fat:1394,ativos:8},
  {mes:"Abr",fat:1891,ativos:12},{mes:"Mai",fat:2388,ativos:16},{mes:"Jun",fat:3283,ativos:22},
];

const DEMO_ALUNOS = [
  {id:"a1",nome:"Carlos Souza",whatsapp:"48991234567",plano:"Mensal - R$200",vencimento:(()=>{const d=new Date();d.setDate(d.getDate()+3);return d.toISOString().split("T")[0];})(),objetivo:"Emagrecimento",checkin:"Toda segunda",obs:"Prefere treinos à noite"},
  {id:"a2",nome:"Fernanda Lima",whatsapp:"48998765432",plano:"Trimestral - R$497",vencimento:(()=>{const d=new Date();d.setDate(d.getDate()-2);return d.toISOString().split("T")[0];})(),objetivo:"Hipertrofia",checkin:"Toda quarta",obs:""},
  {id:"a3",nome:"Rafael Mendes",whatsapp:"48987654321",plano:"Semestral - R$697",vencimento:(()=>{const d=new Date();d.setDate(d.getDate()+60);return d.toISOString().split("T")[0];})(),objetivo:"Condicionamento",checkin:"Toda sexta",obs:""},
];

const DEMO_HIST = {
  a1: {
    dietas: [{id:"d1",data:now(),kcal:2200,prot:145,carbo:220,gord:65,obs:"Déficit 400kcal.",refeicoes:"Café: ovos + pão integral\nAlmoço: frango + arroz + legumes\nJantar: carne + batata-doce"}],
    pesos: [{id:"p1",data:now(),val:82.5,obs:"Início"},{id:"p2",data:(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString();})(),val:83.2,obs:""}],
    checkins: [{id:"c1",data:now(),nota:"5 de 6 treinos. Sono melhorou!",peso:82.5}],
  },
  a2: {
    dietas: [{id:"d2",data:now(),kcal:2800,prot:180,carbo:280,gord:80,obs:"Superávit 300kcal.",refeicoes:"Café: aveia + ovos\nAlmoço: frango + arroz\nJantar: carne + batata"}],
    pesos: [{id:"p3",data:now(),val:78.0,obs:""},{id:"p4",data:(()=>{const d=new Date();d.setDate(d.getDate()-14);return d.toISOString();})(),val:77.2,obs:""}],
    checkins: [],
  },
  a3: { dietas: [], pesos: [], checkins: [] },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${B};color:${W};font-family:'Montserrat',sans-serif;min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${B}}::-webkit-scrollbar-thumb{background:${G};border-radius:2px}

/* LAYOUT */
.layout{display:flex;min-height:100vh}

/* SIDEBAR — desktop */
.sidebar{width:220px;background:${D};border-right:1px solid ${G}18;display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100;transition:transform .3s}
.sb-logo{padding:22px 18px 18px;border-bottom:1px solid ${G}15}
.sb-lbox{width:42px;height:42px;background:${G};border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:${B};margin-bottom:10px}
.sb-ltxt{font-size:15px;font-weight:800;letter-spacing:2px;color:${W};text-transform:uppercase}
.sb-lsub{font-size:11px;color:${G};font-weight:600;letter-spacing:1px;margin-top:1px}
.sb-nav{flex:1;padding:16px 10px;display:flex;flex-direction:column;gap:4px}
.sb-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:9px;font-size:13px;font-weight:700;color:#555;cursor:pointer;transition:all .2s;border:none;background:none;font-family:'Montserrat',sans-serif;width:100%;text-align:left;letter-spacing:.3px}
.sb-item:hover{background:${GR};color:#aaa}
.sb-item.active{background:${G}18;color:${G};border:1px solid ${G}22}
.sb-icon{font-size:17px;width:20px;text-align:center;flex-shrink:0}
.sb-live{display:flex;align-items:center;gap:5px;padding:14px 18px;border-top:1px solid ${G}15;font-size:9px;color:#22c55e;font-weight:700;letter-spacing:.5px}
.ldot{width:5px;height:5px;border-radius:50%;background:#22c55e;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* MAIN */
.main{flex:1;margin-left:220px;min-height:100vh;display:flex;flex-direction:column}
.topbar{background:${D};border-bottom:1px solid ${G}15;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.topbar-title{font-size:20px;font-weight:800;color:${W}}
.topbar-sub{font-size:12px;color:#444;font-weight:600;margin-top:1px}
.page{padding:24px 28px 60px;flex:1}

/* MOBILE HEADER */
.mob-hdr{display:none;background:${D};border-bottom:1px solid ${G}18;padding:14px 16px 0;position:sticky;top:0;z-index:100}
.mob-hrow{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.mob-logo{display:flex;align-items:center;gap:9px}
.mob-lbox{width:32px;height:32px;background:${G};border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:${B}}
.mob-ltxt{font-size:10px;font-weight:800;letter-spacing:1.5px;color:${W};text-transform:uppercase}
.mob-lsub{font-size:8px;color:${G};font-weight:600}
.mob-live{display:flex;align-items:center;gap:4px;font-size:8px;color:#22c55e;font-weight:700}
.mob-nav{display:flex}
.mob-tab{flex:1;padding:9px 3px;text-align:center;font-size:8px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#444;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;background:none;border-top:none;border-left:none;border-right:none;font-family:'Montserrat',sans-serif}
.mob-tab.active{color:${G};border-bottom-color:${G}}
.mob-content{padding:14px 14px 60px}

/* DESKTOP GRID */
.d-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
.d-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px}
.d-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.d-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;align-items:start}

/* CARDS */
.card{background:${D};border:1px solid ${GR};border-radius:12px;padding:16px;margin-bottom:10px;transition:border-color .2s}
.card:hover{border-color:${G}33}
.chd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.cn{font-size:16px;font-weight:700;color:${W}}
.cs{font-size:12px;color:#555;margin-top:2px;font-weight:500}
.div{height:1px;background:${GR};margin:8px 0}
.inf{display:flex;align-items:flex-start;gap:7px;margin-top:6px}
.il{font-size:11px;color:#444;font-weight:700;letter-spacing:.3px;text-transform:uppercase;min-width:70px;padding-top:1px}
.iv{font-size:13px;color:${W};font-weight:500;flex:1}
.iva{color:#ef4444}.ivw{color:#f97316}.ivg{color:#22c55e}

/* BADGES */
.badge{padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.3px;white-space:nowrap}
.bg{background:${G}22;color:${G};border:1px solid ${G}33}
.bgreen{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}
.bred{background:#ef444422;color:#ef4444;border:1px solid #ef444433}
.borg{background:#f9731622;color:#f97316;border:1px solid #f9731633}
.bgray{background:#ffffff0a;color:#555;border:1px solid #ffffff15}
.bblue{background:#3b82f622;color:#60a5fa;border:1px solid #3b82f633}

/* BUTTONS */
.btn{display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 14px;border-radius:9px;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;cursor:pointer;border:none;width:100%;margin-top:9px;font-family:'Montserrat',sans-serif;transition:all .2s}
.btn-g{background:${G};color:${B}}.btn-g:hover{background:#d4af55}
.btn-o{background:transparent;color:${G};border:1px solid ${G}33}.btn-o:hover{background:${G}11}
.btn-wp{background:#25D366;color:#fff}.btn-wp:hover{background:#20c85d}
.btn-del{background:#ef444411;color:#ef4444;border:1px solid #ef444422}
.btn-blue{background:#3b82f611;color:#60a5fa;border:1px solid #3b82f622}
.btn-sm{padding:6px 11px;font-size:9px;width:auto;margin-top:0}
.brow{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
.fab{position:fixed;bottom:24px;right:24px;width:50px;height:50px;border-radius:50%;background:${G};color:${B};border:none;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${G}44;z-index:150;transition:all .2s}
.fab:hover{transform:scale(1.1)}

/* HERO FIN */
.hero-fin{background:linear-gradient(135deg,${GR},${D});border:1px solid ${G}33;border-radius:14px;padding:20px;margin-bottom:16px;position:relative;overflow:hidden}
.hero-fin::before{content:'';position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:${G}08;border:1px solid ${G}15}
.hero-lbl{font-size:11px;font-weight:700;letter-spacing:2px;color:${G};text-transform:uppercase;margin-bottom:5px;opacity:.8}
.hero-val{font-size:42px;font-weight:900;color:${W};line-height:1;margin-bottom:3px;letter-spacing:-1px}
.hero-sub{font-size:12px;color:#555;font-weight:500;margin-bottom:14px}
.hero-chips{display:flex;gap:7px;flex-wrap:wrap}
.chip{padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700}
.chip-g{background:#22c55e22;color:#22c55e;border:1px solid #22c55e33}
.chip-gold{background:${G}22;color:${G};border:1px solid ${G}33}
.chip-r{background:#ef444422;color:#ef4444;border:1px solid #ef444433}
.chip-b{background:#3b82f622;color:#60a5fa;border:1px solid #3b82f633}

/* META */
.meta-card{background:${GR};border:1px solid ${LG};border-radius:12px;padding:14px;margin-bottom:14px}
.meta-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}
.meta-lbl{font-size:11px;font-weight:700;color:#555;letter-spacing:.3px;text-transform:uppercase}
.meta-pct{font-size:22px;font-weight:900;color:${G}}
.prog-bg{height:7px;background:${LG};border-radius:4px;overflow:hidden}
.prog-fill{height:100%;background:linear-gradient(90deg,${G},#e8c56a);border-radius:4px;transition:width .8s ease}
.meta-vals{display:flex;justify-content:space-between;margin-top:5px}
.meta-inp{background:${LG};border:1px solid #333;border-radius:7px;padding:7px 11px;color:${W};font-family:'Montserrat',sans-serif;font-size:13px;font-weight:700;outline:none;flex:1;transition:border-color .2s}
.meta-inp:focus{border-color:${G}}
.meta-btn{padding:7px 13px;border-radius:7px;background:${G};color:${B};font-family:'Montserrat',sans-serif;font-size:9px;font-weight:800;border:none;cursor:pointer}

/* KPI */
.kpi{background:${GR};border:1px solid ${LG};border-radius:12px;padding:14px}
.kpi-lbl{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#444;margin-bottom:5px}
.kpi-val{font-size:26px;font-weight:900;line-height:1;margin-bottom:2px}
.kpi-sub{font-size:11px;font-weight:600;margin-top:2px}
.kup{color:#22c55e}.kdown{color:#ef4444}.kgold{color:${G}}.kblue{color:#60a5fa}.korg{color:#f97316}

/* CHART */
.cc{background:${GR};border:1px solid ${LG};border-radius:12px;padding:16px;margin-bottom:14px}
.cc-title{font-size:11px;font-weight:700;color:#555;letter-spacing:.4px;text-transform:uppercase;margin-bottom:14px}
.tt-box{background:${D};border:1px solid ${G}44;border-radius:7px;padding:9px 11px}
.tt-lbl{font-size:8px;color:${G};font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px}
.tt-val{font-size:11px;color:${W};font-weight:700}

/* ALERTS */
.alert-b{background:#ef444411;border:1px solid #ef444422;border-radius:9px;padding:10px 13px;margin-bottom:13px;display:flex;align-items:center;gap:8px}
.ad{width:6px;height:6px;border-radius:50%;background:#ef4444;flex-shrink:0;animation:pulse 1.5s infinite}
.at{font-size:13px;color:#ef4444;font-weight:600}
.warn-b{background:#f9731611;border:1px solid #f9731622;border-radius:9px;padding:10px 13px;margin-bottom:13px;display:flex;align-items:center;gap:8px}
.wd{width:6px;height:6px;border-radius:50%;background:#f97316;flex-shrink:0}
.wt{font-size:13px;color:#f97316;font-weight:600}

/* SEC */
.sec{font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${G};margin-bottom:12px;display:flex;align-items:center;gap:7px}
.sec::after{content:'';flex:1;height:1px;background:${G}22}

/* SGRID */
.sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.sc{background:${GR};border:1px solid ${LG};border-radius:11px;padding:12px 8px;text-align:center}
.sn{font-size:28px;font-weight:900;color:${G};line-height:1}
.sl{font-size:11px;color:#444;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-top:3px}

/* SEARCH */
.srch{background:${GR};border:1px solid ${LG};border-radius:9px;padding:9px 13px;color:${W};font-family:'Montserrat',sans-serif;font-size:12px;width:100%;outline:none;margin-bottom:14px;transition:border-color .2s}
.srch:focus{border-color:${G}}
.srch::placeholder{color:#333}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fi .2s}
@keyframes fi{from{opacity:0}to{opacity:1}}
.modal{background:${D};border-top:1px solid ${G}44;border-radius:20px 20px 0 0;padding:20px 18px 44px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;animation:su .28s ease}
@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}
.mh{width:36px;height:3px;background:${GR};border-radius:2px;margin:0 auto 16px}
.mt{font-size:15px;font-weight:800;color:${W};margin-bottom:16px}
.field{margin-bottom:11px}
.fl{font-size:9px;font-weight:700;color:${G};letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px}
.field input,.field select,.field textarea{width:100%;background:${LG};border:1px solid #2a2a2a;border-radius:8px;padding:10px 12px;color:${W};font-family:'Montserrat',sans-serif;font-size:12px;font-weight:500;outline:none;transition:border-color .2s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:${G}}
.field select option{background:${D}}
.field textarea{resize:vertical;min-height:72px;line-height:1.6}
.tab-inner{display:flex;gap:0;margin-bottom:14px;background:${LG};border-radius:8px;padding:3px}
.ti{flex:1;padding:7px 4px;text-align:center;font-size:8.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#444;cursor:pointer;border-radius:6px;transition:all .2s;border:none;background:none;font-family:'Montserrat',sans-serif}
.ti.active{background:${G};color:${B}}
.hist-item{background:${B};border:1px solid ${GR};border-radius:8px;padding:10px 12px;margin-bottom:7px;cursor:pointer;transition:border-color .2s}
.hist-item:hover,.hist-item.active{border-color:${G}}
.hi-date{font-size:11px;color:${G};font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:3px}
.hi-prev{font-size:13px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hi-full{font-size:11px;color:#ccc;line-height:1.7;white-space:pre-wrap;margin-top:7px;padding-top:7px;border-top:1px solid ${GR}}
.peso-item{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid ${GR}22}
.peso-val{font-size:20px;font-weight:900;color:${G}}
.peso-data{font-size:11px;color:#444;font-weight:600;margin-top:1px}
.ci-card{background:${B};border:1px solid ${GR};border-radius:8px;padding:12px;margin-bottom:8px}
.ci-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.ci-date{font-size:11px;color:${G};font-weight:700}
.ci-nota{font-size:13px;color:#bbb;line-height:1.6}
.num-inp{display:flex;align-items:center;gap:7px}
.num-inp button{width:30px;height:30px;border-radius:6px;background:${LG};border:1px solid #333;color:${W};font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Montserrat',sans-serif}
.macro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}
.macro-card{background:${LG};border-radius:8px;padding:10px 8px;text-align:center}
.macro-lbl{font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:4px}
.wp-prev{background:#075E5415;border:1px solid #25D36633;border-radius:10px;padding:12px;margin:10px 0}
.wp-lbl{font-size:8px;color:#25D366;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px}
.wp-txt{font-size:11px;color:#ccc;line-height:1.65;white-space:pre-wrap}
.empty{text-align:center;padding:32px 16px}
.ei{font-size:32px;margin-bottom:8px}
.et{font-size:12px;font-weight:700;color:#333;margin-bottom:4px}
.proj-card{background:linear-gradient(135deg,${G}12,${G}06);border:1px solid ${G}22;border-radius:11px;padding:14px;margin-bottom:12px}
.proj-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ${G}12}
.proj-row:last-child{border-bottom:none}
.proj-lbl{font-size:13px;color:#777;font-weight:500}
.proj-val{font-size:15px;font-weight:800}
.rec-item{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid ${LG}}
.rec-item:last-child{border-bottom:none}.cobranca-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}

/* RESPONSIVE */
@media(max-width:768px){
  .sidebar{display:none}
  .main{margin-left:0;display:none}
  .mob-hdr{display:block}
  .mob-content{display:block}
  .d-grid2,.d-grid3,.d-grid4,.d-row{grid-template-columns:1fr}
}
@media(min-width:769px){
  .mob-hdr{display:none}
  .mob-content{display:none}
  .layout{display:flex}
  .main{display:flex;flex-direction:column}
}
`;

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="tt-box"><div className="tt-lbl">{label}</div>{payload.map((p,i)=><div key={i} className="tt-val" style={{color:p.color}}>{p.name}: {typeof p.value==="number"&&p.value>100?fmtBRL(p.value):p.value}</div>)}</div>;
};

const NAVS = [
  {id:"dashboard",icon:"📊",l:"Dashboard"},
  {id:"alunos",icon:"👥",l:"Alunos"},
  {id:"cobrancas",icon:"💰",l:"Cobranças"},
  {id:"projecao",icon:"📈",l:"Projeção"},
];

export default function TH9Sistema() {
  const [nav, setNav] = useState("dashboard");
  const [alunos, setAlunos] = useState(() => load(SK+"_al", DEMO_ALUNOS));
  const [historico, setHistorico] = useState(() => load(SK+"_hi", DEMO_HIST));
  const [meta, setMeta] = useState(() => parseFloat(load(SK+"_meta","5000")||5000));
  const [metaInput, setMetaInput] = useState("");
  const [editMeta, setEditMeta] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [histTab, setHistTab] = useState("dieta");
  const [expandHist, setExpandHist] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({});
  const [dietaForm, setDietaForm] = useState({kcal:"",prot:"",carbo:"",gord:"",obs:"",refeicoes:""});
  const [novoHist, setNovoHist] = useState({peso:"",pesObs:"",ciNota:"",ciPeso:""});
  const [wpModal, setWpModal] = useState(null);

  useEffect(()=>{ save(SK+"_al",alunos); },[alunos]);
  useEffect(()=>{ save(SK+"_hi",historico); },[historico]);
  useEffect(()=>{ save(SK+"_meta",String(meta)); },[meta]);

  const getH = id => historico[id]||{dietas:[],pesos:[],checkins:[]};
  const setH = (id,fn) => setHistorico(prev=>({...prev,[id]:fn(getH(id))}));

  const ativos = alunos.filter(a=>getDias(a.vencimento)>=0);
  const vencidos = alunos.filter(a=>getDias(a.vencimento)<0);
  const proxVenc = alunos.filter(a=>{ const d=getDias(a.vencimento); return d!==null&&d>=0&&d<=5; });
  const receita = ativos.reduce((s,a)=>s+precoPlano(a.plano),0);
  const inadimp = vencidos.reduce((s,a)=>s+precoPlano(a.plano),0);
  const metaPct = Math.min(100,Math.round((receita/meta)*100));
  const ticketMedio = ativos.length>0?Math.round(receita/ativos.length):0;
  const crescFat = HIST_MENSAL[HIST_MENSAL.length-2].fat>0?((receita-HIST_MENSAL[HIST_MENSAL.length-2].fat)/HIST_MENSAL[HIST_MENSAL.length-2].fat*100).toFixed(1):0;
  const filtrados = alunos.filter(a=>a.nome.toLowerCase().includes(search.toLowerCase())||a.objetivo?.toLowerCase().includes(search.toLowerCase()));

  function abrirCadastro(a=null) { setForm(a||{nome:"",whatsapp:"",plano:PLANOS[0],vencimento:"",objetivo:"",checkin:"",obs:""}); setModal("cadastro"); }
  function salvarAluno() {
    if(!form.nome||!form.whatsapp) return;
    if(form.id) { setAlunos(prev=>prev.map(a=>a.id===form.id?form:a)); }
    else { const id="a"+uid(); setAlunos(prev=>[...prev,{...form,id}]); setH(id,()=>({dietas:[],pesos:[],checkins:[]})); }
    setModal(null);
  }
  function excluirAluno(id) { if(confirm("Excluir aluno?")){ setAlunos(prev=>prev.filter(a=>a.id!==id)); setModal(null); } }
  function abrirHistorico(a) { setSelected(a); setDietaForm({kcal:"",prot:"",carbo:"",gord:"",obs:"",refeicoes:""}); setNovoHist({peso:"",pesObs:"",ciNota:"",ciPeso:""}); setExpandHist(null); setModal("historico"); }
  function salvarDieta() { if(!dietaForm.kcal) return; setH(selected.id, h=>({...h,dietas:[{id:uid(),data:now(),...dietaForm},...(h.dietas||[])]})); setDietaForm({kcal:"",prot:"",carbo:"",gord:"",obs:"",refeicoes:""}); }
  function salvarPeso() { if(!novoHist.peso) return; setH(selected.id, h=>({...h,pesos:[{id:uid(),data:now(),val:parseFloat(novoHist.peso),obs:novoHist.pesObs},...(h.pesos||[])]})); setNovoHist(n=>({...n,peso:"",pesObs:""})); }
  function salvarCheckin() { if(!novoHist.ciNota) return; setH(selected.id, h=>({...h,checkins:[{id:uid(),data:now(),nota:novoHist.ciNota,peso:novoHist.ciPeso},...(h.checkins||[])]})); setNovoHist(n=>({...n,ciNota:"",ciPeso:""})); }
  function excluirHist(tipo,id) { setH(selected.id, h=>({...h,[tipo]:(h[tipo]||[]).filter(x=>x.id!==id)})); }
  function abrirWP(a,tipo){ setWpModal({a,tipo}); }
  function enviarWP(msg,tel) { window.open(`https://wa.me/55${tel.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank"); setWpModal(null); }

  const selH = selected?getH(selected.id):null;
  function pesoDiff(pesos,i) { if(i>=pesos.length-1) return null; const d=pesos[i].val-pesos[i+1].val; if(Math.abs(d)<0.05) return {v:"=",c:""}; return d>0?{v:`+${d.toFixed(1)}kg`,c:"kup"}:{v:`${d.toFixed(1)}kg`,c:"kdown"}; }

  // Conteúdo das páginas
  function PageDashboard() { return <>
    <div className="d-row" style={{gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <div>
        <div className="hero-fin">
          <div className="hero-lbl">Faturamento Ativo — {mesAtual()}</div>
          <div className="hero-val">{fmtBRL(receita)}</div>
          <div className="hero-sub">{parseFloat(crescFat)>=0?`▲ ${crescFat}%`:`▼ ${Math.abs(crescFat)}%`} vs mês anterior</div>
          <div className="hero-chips">
            <span className="chip chip-g">✓ {ativos.length} ativos</span>
            <span className="chip chip-gold">🎯 Meta: {fmtBRL(meta)}</span>
            {vencidos.length>0&&<span className="chip chip-r">⚠ {vencidos.length} vencidos</span>}
            {proxVenc.length>0&&<span className="chip chip-b">🔔 {proxVenc.length} a vencer</span>}
          </div>
        </div>
        <div className="meta-card">
          <div className="meta-row">
            <div>
              <div className="meta-lbl">Meta do Mês</div>
              {!editMeta
                ?<div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}><span style={{fontSize:13,fontWeight:700,color:"#ccc"}}>{fmtBRL(meta)}</span><button onClick={()=>setEditMeta(true)} style={{background:"none",border:"none",color:G,fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"Montserrat,sans-serif"}}>✏️</button></div>
                :<div style={{display:"flex",alignItems:"center",gap:7,marginTop:3}}><input className="meta-inp" value={metaInput} onChange={e=>setMetaInput(e.target.value)} placeholder="Ex: 5000" type="number"/><button className="meta-btn" onClick={()=>{const v=parseFloat(metaInput);if(v>0){setMeta(v);setEditMeta(false);setMetaInput("");}}}>OK</button><button onClick={()=>setEditMeta(false)} style={{background:"none",border:"none",color:"#444",fontSize:11,cursor:"pointer",fontFamily:"Montserrat,sans-serif"}}>✕</button></div>
              }
            </div>
            <div className="meta-pct">{metaPct}%</div>
          </div>
          <div className="prog-bg"><div className="prog-fill" style={{width:`${metaPct}%`}}/></div>
          <div className="meta-vals"><span style={{fontSize:11,fontWeight:700,color:W}}>{fmtBRL(receita)} atingido</span><span style={{fontSize:11,fontWeight:600,color:"#444"}}>faltam {fmtBRL(Math.max(0,meta-receita))}</span></div>
        </div>
      </div>
      <div>
        <div className="d-grid2" style={{marginBottom:14}}>
          <div className="kpi"><div className="kpi-lbl">Alunos Ativos</div><div className="kpi-val kgold">{ativos.length}</div><div className="kpi-sub" style={{color:"#555"}}>{alunos.length} total</div></div>
          <div className="kpi"><div className="kpi-lbl">Ticket Médio</div><div className="kpi-val kblue">{fmtBRL(ticketMedio)}</div><div className="kpi-sub" style={{color:"#555"}}>por aluno</div></div>
          <div className="kpi"><div className="kpi-lbl">Inadimplência</div><div className="kpi-val kdown">{fmtBRL(inadimp)}</div><div className="kpi-sub kdown">{vencidos.length} em atraso</div></div>
          <div className="kpi"><div className="kpi-lbl">A Receber 7d</div><div className="kpi-val korg">{fmtBRL(proxVenc.reduce((s,a)=>s+precoPlano(a.plano),0))}</div><div className="kpi-sub korg">{proxVenc.length} renovações</div></div>
        </div>
      </div>
    </div>
    <div className="d-grid2">
      <div className="cc">
        <div className="cc-title">Faturamento mensal (R$)</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={HIST_MENSAL} barSize={28}>
            <XAxis dataKey="mes" tick={{fill:"#444",fontSize:8,fontFamily:"Montserrat"}} axisLine={false} tickLine={false}/>
            <YAxis hide/><Tooltip content={<TT/>}/>
            <Bar dataKey="fat" name="Faturamento" radius={[4,4,0,0]}>
              {HIST_MENSAL.map((_,i)=><Cell key={i} fill={i===HIST_MENSAL.length-1?G:`${G}44`}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="cc">
        <div className="cc-title">Alunos ativos por mês</div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={HIST_MENSAL}>
            <XAxis dataKey="mes" tick={{fill:"#444",fontSize:8,fontFamily:"Montserrat"}} axisLine={false} tickLine={false}/>
            <YAxis hide/><Tooltip content={<TT/>}/>
            <Line type="monotone" dataKey="ativos" name="Ativos" stroke={G} strokeWidth={2.5} dot={{fill:G,r:3}} activeDot={{r:5}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </>; }

  function PageAlunos() { return <>
    <div className="sgrid">
      <div className="sc"><div className="sn">{alunos.length}</div><div className="sl">Total</div></div>
      <div className="sc"><div className="sn" style={{color:"#22c55e"}}>{ativos.length}</div><div className="sl">Ativos</div></div>
      <div className="sc"><div className="sn" style={{color:"#ef4444"}}>{vencidos.length}</div><div className="sl">Vencidos</div></div>
    </div>
    <input className="srch" placeholder="🔍  Buscar aluno..." value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="sec">Alunos</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
      {filtrados.length===0&&<div className="empty"><div className="ei">👥</div><div className="et">Nenhum aluno</div></div>}
      {filtrados.map(a=>{
        const dias=getDias(a.vencimento); const st=statusVenc(dias); const h=getH(a.id);
        const dietaOk=h.dietas?.length>0; const ultPeso=h.pesos?.[0];
        return <div key={a.id} className="card">
          <div className="chd"><div><div className="cn">{a.nome}</div><div className="cs">{a.objetivo}</div></div><span className={`badge ${st.c}`}>{st.l}</span></div>
          <div className="div"/>
          <div className="inf"><span className="il">Plano</span><span className="iv">{a.plano?.split(" - ")[0]}</span></div>
          <div className="inf"><span className="il">Vencimento</span><span className={`iv ${dias!==null&&dias<0?"iva":dias!==null&&dias<=5?"ivw":"ivg"}`}>{fmtDateInput(a.vencimento)}</span></div>
          <div className="inf"><span className="il">Dieta</span><span className={`iv ${dietaOk?"ivg":""}`}>{dietaOk?`${h.dietas.length} versão${h.dietas.length>1?"ões":""} · ${h.dietas[0].kcal}kcal`:"Pendente"}</span></div>
          <div className="inf"><span className="il">Peso atual</span><span className="iv kgold">{ultPeso?`${ultPeso.val}kg`:"—"}</span></div>
          <div className="brow">
            <button className="btn btn-o btn-sm" onClick={()=>abrirCadastro(a)}>✏️ Editar</button>
            <button className="btn btn-blue btn-sm" onClick={()=>abrirHistorico(a)}>📊 Histórico</button>
            <button className="btn btn-wp btn-sm" onClick={()=>abrirWP(a,"cobranca")}>💬 WP</button>
          </div>
        </div>;
      })}
    </div>
  </>; }

  function PageCobrancas() { return <>
    <div className="sgrid">
      <div className="sc"><div className="sn" style={{fontSize:16,color:G}}>R${receita}</div><div className="sl">Ativo</div></div>
      <div className="sc"><div className="sn" style={{color:"#ef4444"}}>{vencidos.length}</div><div className="sl">Vencidos</div></div>
      <div className="sc"><div className="sn" style={{color:"#f97316"}}>{proxVenc.length}</div><div className="sl">A Vencer</div></div>
    </div>
    {vencidos.length>0&&<><div className="alert-b"><div className="ad"/><div className="at">{vencidos.length} aluno{vencidos.length>1?"s":""} com mensalidade vencida</div></div>
    <div className="sec">Vencidos</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
      {vencidos.map(a=>{const d=getDias(a.vencimento); return <div key={a.id} className="card" style={{borderColor:"#ef444433"}}>
        <div className="chd"><div><div className="cn">{a.nome}</div><div className="cs">{a.plano?.split(" - ")[0]}</div></div><span className="badge bred">Vencido {Math.abs(d)}d</span></div>
        <div className="inf"><span className="il">Venceu</span><span className="iv iva">{fmtDateInput(a.vencimento)}</span></div>
        <div className="inf"><span className="il">Valor</span><span className="iv">{a.plano?.split(" - ")[1]}</span></div>
        <button className="btn btn-wp" onClick={()=>abrirWP(a,"cobranca")}>💬 Enviar Cobrança no WhatsApp</button>
      </div>;})}
    </div></>}
    {proxVenc.length>0&&<><div className="warn-b"><div className="wd"/><div className="wt">{proxVenc.length} vence{proxVenc.length>1?"m":""} em breve</div></div>
    <div className="sec">A Vencer</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
      {proxVenc.map(a=>{const d=getDias(a.vencimento); return <div key={a.id} className="card" style={{borderColor:"#f9731622"}}>
        <div className="chd"><div><div className="cn">{a.nome}</div><div className="cs">{a.plano?.split(" - ")[0]}</div></div><span className="badge borg">{d===0?"Hoje!":d+"d"}</span></div>
        <div className="inf"><span className="il">Vence</span><span className="iv ivw">{fmtDateInput(a.vencimento)}</span></div>
        <button className="btn btn-wp" onClick={()=>abrirWP(a,"cobranca")}>💬 Enviar Lembrete</button>
      </div>;})}
    </div></>}
    {vencidos.length===0&&proxVenc.length===0&&<div className="empty"><div className="ei">✅</div><div className="et">Tudo em dia!</div></div>}
    <div className="sec" style={{marginTop:16}}>Todos</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
      {alunos.map(a=>{const d=getDias(a.vencimento);const st=statusVenc(d);return <div key={a.id} className="card">
        <div className="chd"><div><div className="cn">{a.nome}</div><div className="cs">{a.plano?.split(" - ")[0]} — {a.plano?.split(" - ")[1]}</div></div><span className={`badge ${st.c}`}>{st.l}</span></div>
        <button className="btn btn-o" style={{marginTop:8}} onClick={()=>abrirWP(a,"cobranca")}>💬 Gerar Mensagem</button>
      </div>;})}
    </div>
  </>; }

  function PageProjecao() { return <>
    <div className="d-grid2">
      <div>
        <div className="sec">Cenário Atual</div>
        <div className="proj-card">
          <div className="proj-row"><div className="proj-lbl">Receita ativa</div><div className="proj-val" style={{color:G}}>{fmtBRL(receita)}</div></div>
          <div className="proj-row"><div className="proj-lbl">Recuperando inadimplentes</div><div className="proj-val kup">{fmtBRL(receita+inadimp)}</div></div>
          <div className="proj-row"><div className="proj-lbl">Em risco (7 dias)</div><div className="proj-val korg">{fmtBRL(proxVenc.reduce((s,a)=>s+precoPlano(a.plano),0))}</div></div>
          <div className="proj-row"><div className="proj-lbl">Inadimplência</div><div className="proj-val kdown">{fmtBRL(inadimp)}</div></div>
        </div>
        <div className="sec">Próximos 3 Meses</div>
        <div className="cc">
          {[1,2,3].map(n=>{const proj=receita+(ticketMedio*7*n);const d=new Date();d.setMonth(d.getMonth()+n);return <div key={n} className="rec-item"><div><div style={{fontSize:12,fontWeight:700,color:W}}>{d.toLocaleString("pt-BR",{month:"short",year:"numeric"})}</div><div style={{fontSize:9,color:"#444",marginTop:2}}>+{7*n} alunos projetados</div></div><div style={{fontSize:13,fontWeight:800,color:G}}>{fmtBRL(proj)}</div></div>;})}
        </div>
      </div>
      <div>
        <div className="sec">Metas de Escala</div>
        <div className="cc">
          {[{a:30,l:"Próximo marco"},{a:50,l:"Escala média"},{a:100,l:"Escala premium"}].map(m=>{
            const fat=m.a*ticketMedio; const pct=Math.min(100,Math.round((ativos.length/m.a)*100));
            return <div key={m.a} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div><span style={{fontSize:11,fontWeight:700,color:W}}>{m.l}</span><span style={{fontSize:9,color:"#444",marginLeft:6}}>{m.a} alunos</span></div><span style={{fontSize:12,fontWeight:800,color:G}}>{fmtBRL(fat)}/mês</span></div>
              <div style={{height:5,background:LG,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${G},#e8c56a)`,borderRadius:3}}/></div>
              <div style={{fontSize:8,color:"#333",marginTop:3}}>{ativos.length} de {m.a} ({pct}%)</div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </>; }

  const pages = {dashboard:<PageDashboard/>, alunos:<PageAlunos/>, cobrancas:<PageCobrancas/>, projecao:<PageProjecao/>};
  const navLabel = NAVS.find(n=>n.id===nav)?.l||"";

  const Modais = () => <>
    {modal==="cadastro"&&(
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="modal">
          <div className="mh"/>
          <div className="mt">{form.id?"Editar Aluno":"Novo Aluno"}</div>
          <div className="field"><div className="fl">Nome completo</div><input value={form.nome||""} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome do aluno"/></div>
          <div className="field"><div className="fl">WhatsApp</div><input value={form.whatsapp||""} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="48999999999" type="tel"/></div>
          <div className="field"><div className="fl">Plano</div><select value={form.plano||PLANOS[0]} onChange={e=>setForm(f=>({...f,plano:e.target.value}))}>{PLANOS.map(p=><option key={p}>{p}</option>)}</select></div>
          <div className="field"><div className="fl">Vencimento</div><input type="date" value={form.vencimento||""} onChange={e=>setForm(f=>({...f,vencimento:e.target.value}))}/></div>
          <div className="field"><div className="fl">Objetivo</div><select value={form.objetivo||""} onChange={e=>setForm(f=>({...f,objetivo:e.target.value}))}><option value="">Selecionar...</option>{OBJETIVOS.map(o=><option key={o}>{o}</option>)}</select></div>
          <div className="field"><div className="fl">Dia de Check-in</div><select value={form.checkin||""} onChange={e=>setForm(f=>({...f,checkin:e.target.value}))}><option value="">Selecionar...</option>{CHECKINS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="field"><div className="fl">Observações</div><textarea value={form.obs||""} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Alergias, restrições..."/></div>
          <div className="brow">
            {form.id&&<button className="btn btn-del" style={{flex:1}} onClick={()=>excluirAluno(form.id)}>🗑️</button>}
            <button className="btn btn-g" style={{flex:3}} onClick={salvarAluno}>{form.id?"✓ Salvar":"✓ Cadastrar Aluno"}</button>
          </div>
        </div>
      </div>
    )}
    {modal==="historico"&&selected&&(
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
        <div className="modal">
          <div className="mh"/>
          <div className="mt">📊 {selected.nome}</div>
          <div className="tab-inner">
            {[{id:"dieta",l:"🥗 Dieta"},{id:"peso",l:"⚖️ Peso"},{id:"checkin",l:"📋 Check-in"}].map(t=>(
              <button key={t.id} className={`ti ${histTab===t.id?"active":""}`} onClick={()=>setHistTab(t.id)}>{t.l}</button>
            ))}
          </div>
          {histTab==="dieta"&&<>
            <div className="sec">Nova Dieta</div>
            <div className="macro-grid">
              <div className="macro-card"><div className="macro-lbl" style={{color:G}}>Kcal</div><input style={{background:"transparent",border:"none",color:W,fontWeight:800,fontSize:16,textAlign:"center",width:"100%",outline:"none",fontFamily:"Montserrat,sans-serif"}} value={dietaForm.kcal} onChange={e=>setDietaForm(f=>({...f,kcal:e.target.value}))} placeholder="0" type="number"/></div>
              <div className="macro-card"><div className="macro-lbl" style={{color:"#22c55e"}}>Prot (g)</div><input style={{background:"transparent",border:"none",color:W,fontWeight:800,fontSize:16,textAlign:"center",width:"100%",outline:"none",fontFamily:"Montserrat,sans-serif"}} value={dietaForm.prot} onChange={e=>setDietaForm(f=>({...f,prot:e.target.value}))} placeholder="0" type="number"/></div>
              <div className="macro-card"><div className="macro-lbl" style={{color:"#60a5fa"}}>Carbo (g)</div><input style={{background:"transparent",border:"none",color:W,fontWeight:800,fontSize:16,textAlign:"center",width:"100%",outline:"none",fontFamily:"Montserrat,sans-serif"}} value={dietaForm.carbo} onChange={e=>setDietaForm(f=>({...f,carbo:e.target.value}))} placeholder="0" type="number"/></div>
            </div>
            <div className="field"><div className="fl">Gordura (g)</div><input value={dietaForm.gord} onChange={e=>setDietaForm(f=>({...f,gord:e.target.value}))} placeholder="0" type="number"/></div>
            <div className="field"><div className="fl">Refeições</div><textarea value={dietaForm.refeicoes} onChange={e=>setDietaForm(f=>({...f,refeicoes:e.target.value}))} placeholder="Café: ovos + pão&#10;Almoço: frango + arroz&#10;Jantar: carne + batata" style={{minHeight:90}}/></div>
            <div className="field"><div className="fl">Observações</div><textarea value={dietaForm.obs} onChange={e=>setDietaForm(f=>({...f,obs:e.target.value}))} placeholder="Ex: déficit 400kcal..."/></div>
            <button className="btn btn-g" onClick={salvarDieta}>✓ Salvar Dieta</button>
            <div className="sec" style={{marginTop:16}}>Histórico</div>
            {(selH?.dietas||[]).length===0&&<div style={{color:"#333",fontSize:11,textAlign:"center",padding:"12px 0"}}>Nenhuma dieta</div>}
            {(selH?.dietas||[]).map((d,i)=>(
              <div key={d.id} className={`hist-item ${expandHist===d.id?"active":""}`} onClick={()=>setExpandHist(expandHist===d.id?null:d.id)}>
                <div className="hi-date">{i===0?"Atual — ":""}{fmtDate(d.data)}</div>
                <div className="hi-prev">{d.kcal}kcal · {d.prot}g prot{d.carbo?` · ${d.carbo}g carbo`:""}</div>
                {expandHist===d.id&&<><div className="hi-full">{d.refeicoes}</div>{d.obs&&<div style={{fontSize:10,color:"#666",marginTop:6,fontStyle:"italic"}}>{d.obs}</div>}{i!==0&&<button className="btn btn-del btn-sm" style={{marginTop:8,width:"auto"}} onClick={e=>{e.stopPropagation();excluirHist("dietas",d.id)}}>🗑️</button>}</>}
              </div>
            ))}
          </>}
          {histTab==="peso"&&<>
            <div className="sec">Registrar Peso</div>
            <div className="field"><div className="fl">Peso (kg)</div>
              <div className="num-inp">
                <button onClick={()=>setNovoHist(n=>({...n,peso:Math.max(0,(parseFloat(n.peso)||0)-.1).toFixed(1)}))}>−</button>
                <input value={novoHist.peso} onChange={e=>setNovoHist(n=>({...n,peso:e.target.value}))} placeholder="00.0" type="number" step="0.1"/>
                <button onClick={()=>setNovoHist(n=>({...n,peso:((parseFloat(n.peso)||0)+.1).toFixed(1)}))}>+</button>
              </div>
            </div>
            <div className="field"><div className="fl">Obs</div><input value={novoHist.pesObs} onChange={e=>setNovoHist(n=>({...n,pesObs:e.target.value}))} placeholder="Ex: manhã em jejum"/></div>
            <button className="btn btn-g" onClick={salvarPeso}>✓ Registrar Peso</button>
            <div className="sec" style={{marginTop:16}}>Evolução</div>
            {(selH?.pesos||[]).length===0&&<div style={{color:"#333",fontSize:11,textAlign:"center",padding:"12px 0"}}>Nenhum peso</div>}
            {(selH?.pesos||[]).map((p,i)=>{const diff=pesoDiff(selH.pesos,i);return <div key={p.id} className="peso-item"><div><div className="peso-val">{p.val}kg</div><div className="peso-data">{fmtDate(p.data)}{p.obs&&` · ${p.obs}`}</div></div><div style={{display:"flex",alignItems:"center",gap:8}}>{diff&&<span style={{fontSize:10,fontWeight:700}} className={diff.c}>{diff.v}</span>}{i===0&&<span style={{fontSize:8,color:G,fontWeight:700}}>ATUAL</span>}</div></div>;})}
          </>}
          {histTab==="checkin"&&<>
            <div className="sec">Novo Check-in</div>
            <div className="field"><div className="fl">Anotações</div><textarea value={novoHist.ciNota} onChange={e=>setNovoHist(n=>({...n,ciNota:e.target.value}))} placeholder="Treinos, dieta, sono, feedback..." style={{minHeight:80}}/></div>
            <div className="field"><div className="fl">Peso (opcional)</div><input value={novoHist.ciPeso} onChange={e=>setNovoHist(n=>({...n,ciPeso:e.target.value}))} placeholder="82.5" type="number" step="0.1"/></div>
            <button className="btn btn-g" onClick={salvarCheckin}>✓ Salvar Check-in</button>
            <div className="sec" style={{marginTop:16}}>Anteriores</div>
            {(selH?.checkins||[]).length===0&&<div style={{color:"#333",fontSize:11,textAlign:"center",padding:"12px 0"}}>Nenhum check-in</div>}
            {(selH?.checkins||[]).map(c=><div key={c.id} className="ci-card"><div className="ci-top"><div className="ci-date">{fmtDate(c.data)}</div>{c.peso&&<span className="badge bg">⚖️ {c.peso}kg</span>}</div><div className="ci-nota">{c.nota}</div></div>)}
          </>}
        </div>
      </div>
    )}
    {wpModal&&(
      <div className="overlay" onClick={e=>e.target===e.currentTarget&&setWpModal(null)}>
        <div className="modal">
          <div className="mh"/>
          <div className="mt">💬 Cobrança</div>
          <div className="wp-prev"><div className="wp-lbl">Prévia — {wpModal.a.nome}</div><div className="wp-txt">{gerarMsgCobranca(wpModal.a)}</div></div>
          <button className="btn btn-wp" onClick={()=>enviarWP(gerarMsgCobranca(wpModal.a),wpModal.a.whatsapp)}>📤 Abrir WhatsApp</button>
          <button className="btn btn-o" style={{marginTop:7}} onClick={()=>setWpModal(null)}>Cancelar</button>
        </div>
      </div>
    )}
  </>;

  return (
    <>
      <style>{css}</style>

      {/* DESKTOP */}
      <div className="layout">
        <div className="sidebar">
          <div className="sb-logo">
            <div className="sb-lbox">TH9</div>
            <div className="sb-ltxt">Consultoria TH9</div>
            <div className="sb-lsub">consultoriath9.com.br</div>
          </div>
          <div className="sb-nav">
            {NAVS.map(n=>(
              <button key={n.id} className={`sb-item ${nav===n.id?"active":""}`} onClick={()=>setNav(n.id)}>
                <span className="sb-icon">{n.icon}</span>{n.l}
              </button>
            ))}
          </div>
          <div className="sb-live"><div className="ldot"/>Ao vivo</div>
        </div>
        <div className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{navLabel}</div>
              <div className="topbar-sub">{mesAtual()}</div>
            </div>
            {nav==="alunos"&&<button className="btn btn-g btn-sm" onClick={()=>abrirCadastro()}>+ Novo Aluno</button>}
          </div>
          <div className="page">{pages[nav]}</div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="mob-hdr">
        <div className="mob-hrow">
          <div className="mob-logo">
            <div className="mob-lbox">TH9</div>
            <div><div className="mob-ltxt">Consultoria TH9</div><div className="mob-lsub">consultoriath9.com.br</div></div>
          </div>
          <div className="mob-live"><div className="ldot"/>Ao vivo</div>
        </div>
        <div className="mob-nav">
          {NAVS.map(n=><button key={n.id} className={`mob-tab ${nav===n.id?"active":""}`} onClick={()=>setNav(n.id)}>{n.icon} {n.l}</button>)}
        </div>
      </div>
      <div className="mob-content">{pages[nav]}</div>
      {nav==="alunos"&&<button className="fab" onClick={()=>abrirCadastro()}>+</button>}

      <Modais/>
    </>
  );
}
