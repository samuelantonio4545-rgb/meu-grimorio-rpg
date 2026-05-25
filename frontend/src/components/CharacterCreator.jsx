import React, { useState, useEffect } from 'react';
import { Compass, ArrowLeft, ArrowRight, Dices, Lock, Sparkles, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STAT_NAMES = { str:'Força', dex:'Destreza', con:'Constituição', int:'Inteligência', wis:'Sabedoria', cha:'Carisma' };

const RACAS_FALLBACK = [
  {index:'human',name:'Humano'},{index:'elf',name:'Elfo'},{index:'dwarf',name:'Anão'},
  {index:'halfling',name:'Halfling'},{index:'dragonborn',name:'Draconato'},
  {index:'gnome',name:'Gnomo'},{index:'half-elf',name:'Meio-Elfo'},
  {index:'half-orc',name:'Meio-Orc'},{index:'tiefling',name:'Tiefling'}
];

const CLASSES_FALLBACK = [
  {index:'barbarian',name:'Bárbaro',hit_die:12},{index:'bard',name:'Bardo',hit_die:8},
  {index:'cleric',name:'Clérigo',hit_die:8},{index:'druid',name:'Druida',hit_die:8},
  {index:'fighter',name:'Guerreiro',hit_die:10},{index:'monk',name:'Monge',hit_die:8},
  {index:'paladin',name:'Paladino',hit_die:10},{index:'ranger',name:'Patrulheiro',hit_die:10},
  {index:'rogue',name:'Ladino',hit_die:8},{index:'sorcerer',name:'Feiticeiro',hit_die:6},
  {index:'warlock',name:'Bruxo',hit_die:8},{index:'wizard',name:'Mago',hit_die:6}
];

const BACKGROUNDS = {
  acolyte:{name:'Acólito',feature:'Abrigo do Fiel'},
  criminal:{name:'Criminoso',feature:'Contato Criminoso'},
  folk_hero:{name:'Herói do Povo',feature:'Hospitalidade Rústica'},
  noble:{name:'Nobre',feature:'Privilégio de Posição'},
  sage:{name:'Sábio',feature:'Pesquisador'},
  soldier:{name:'Soldado',feature:'Patente Militar'},
  outlander:{name:'Forasteiro',feature:'Andarilho'},
  entertainer:{name:'Artista',feature:'Por Aclamação Popular'},
  hermit:{name:'Eremita',feature:'Descoberta'},
  sailor:{name:'Marinheiro',feature:'Passagem Segura'},
  charlatan:{name:'Charlatão',feature:'Identidade Falsa'},
  guild_artisan:{name:'Artesão de Guilda',feature:'Membro de Guilda'},
};

const XANATHAR_EVENTS = [
  "Você escapou por pouco de um ataque de Goblins quando criança.",
  "Um mago excêntrico lhe deu um livro em branco que brilha à meia-noite.",
  "Você foi abençoado por um clérigo viajante após realizar uma boa ação.",
  "Você perdeu tudo em uma aposta arriscada com um nobre local.",
  "Uma bruxa lhe fez uma profecia enigmática quando você tinha 7 anos.",
  "Você sobreviveu a um naufrágio que matou toda a sua tripulação.",
  "Um dragão passou sobre sua vila quando você era jovem e mudou sua vida.",
  "Você foi aprendiz de um aventureiro famoso por três anos.",
  "Uma cicatriz misteriosa apareceu em seu corpo sem explicação.",
  "Você encontrou um mapa do tesouro dentro de um livro antigo.",
];

const getPointCost = v => v<=8?0:v<=13?v-8:v===14?7:9;

export default function CharacterCreator({ onSave, onCancel }) {
  const [step, setStep] = useState(1);
  const [races, setRaces] = useState(RACAS_FALLBACK);
  const [classes, setClasses] = useState(CLASSES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedBackground, setSelectedBackground] = useState('acolyte');
  const [xanatharStory, setXanatharStory] = useState(null);
  const [tashaEnabled, setTashaEnabled] = useState(false);
  const [tashaPlus2, setTashaPlus2] = useState('str');
  const [tashaPlus1, setTashaPlus1] = useState('dex');
  const [baseStats, setBaseStats] = useState({str:8,dex:8,con:8,int:8,wis:8,cha:8});
  const [charName, setCharName] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/races`).then(r=>r.json()).catch(()=>null),
      fetch(`${API}/api/classes`).then(r=>r.json()).catch(()=>null),
    ]).then(([racesData, classesData]) => {
      if (racesData?.results?.length) { setRaces(racesData.results); setApiOnline(true); }
      if (classesData?.results?.length) setClasses(classesData.results);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const pointsLeft = () => 27 - Object.values(baseStats).reduce((a,v)=>a+getPointCost(v),0);
  const getBonus = s => tashaEnabled?(tashaPlus2===s?2:0)+(tashaPlus1===s?1:0):0;
  const getTotal = s => baseStats[s]+getBonus(s);
  const getMod   = s => Math.floor((getTotal(s)-10)/2);

  const adjustStat = (stat, amount) => {
    const next = baseStats[stat]+amount;
    if (next<8||next>15) return;
    const diff = getPointCost(next)-getPointCost(baseStats[stat]);
    if (pointsLeft()>=diff) setBaseStats(p=>({...p,[stat]:next}));
  };

  const next = () => {
    if (step===1&&!selectedRace) return alert('Selecione uma raça.');
    if (step===2&&!selectedClass) return alert('Selecione uma classe.');
    if (step===3&&pointsLeft()!==0) return alert('Distribua todos os 27 pontos.');
    if (step===5) { if(!charName.trim()) return alert('Dê um nome ao personagem.'); return saveChar(); }
    setStep(p=>p+1);
  };

  const saveChar = () => onSave({
    id:'char_'+Date.now(),
    meta:{name:charName,level:1,race:selectedRace?.name||'',class:selectedClass?.name||'',background:BACKGROUNDS[selectedBackground].name,portraitUrl},
    attributes:{strength:getTotal('str'),dexterity:getTotal('dex'),constitution:getTotal('con'),intelligence:getTotal('int'),wisdom:getTotal('wis'),charisma:getTotal('cha')},
    hp:{max:8+getMod('con'),current:8+getMod('con'),temporary:0},
    notes:xanatharStory?`Evento Xanathar: ${xanatharStory}`:''
  });

  const STEPS = ['Raça','Classe','Atributos','Antecedente','Finalizar'];

  return (
    <div className="fixed inset-0 bg-[#0d0a08] flex flex-col overflow-hidden">
      {/* Top bar mobile */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#14100d] border-b border-yellow-900/40 md:hidden overflow-x-auto">
        {STEPS.map((label,i)=>{
          const s=i+1,active=step===s,done=step>s;
          return <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-cinzel shrink-0 ${active?'bg-yellow-900/40 text-yellow-500':'text-yellow-900/40'}`}>
            <span className={`w-4 h-4 flex items-center justify-center rounded-full border text-xs ${active?'border-yellow-500':done?'border-yellow-800':''}`}>{s}</span>
            <span>{label}</span>
          </div>;
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden md:flex w-52 bg-[#14100d] border-r border-yellow-900/40 flex-col p-5 gap-2">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-yellow-600"/>
            <span className="font-cinzel text-xs text-yellow-600 uppercase">Criação</span>
          </div>
          {STEPS.map((label,i)=>{
            const s=i+1,active=step===s,done=step>s;
            return <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-cinzel ${active?'bg-yellow-900/30 text-yellow-500 border border-yellow-700/40':'text-yellow-900/50'}`}>
              <span className={`w-5 h-5 flex items-center justify-center rounded-full border text-xs ${active?'border-yellow-500 text-yellow-500':done?'border-yellow-800 text-yellow-800':'border-yellow-900/30'}`}>{s}</span>
              {label}
              {!active&&!done&&s>2&&<Lock className="w-3 h-3 ml-auto text-yellow-900/30"/>}
            </div>;
          })}
          <button onClick={onCancel} className="mt-auto text-xs text-yellow-900/40 hover:text-yellow-700 font-cinzel">Cancelar</button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8" style={{background:'#f5f0e8'}}>

            {/* Aviso backend dormindo */}
            {!apiOnline && !loading && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded flex items-center gap-3">
                <span className="text-yellow-800 text-xs font-cinzel">⚠️ Usando dados locais. Backend acordando...</span>
                <button onClick={fetchData} className="flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 font-cinzel border border-yellow-400 px-2 py-1 rounded">
                  <RefreshCw className="w-3 h-3"/> Tentar novamente
                </button>
              </div>
            )}

            {/* STEP 1 */}
            {step===1&&(
              <div>
                <h2 className="font-cinzel text-xl md:text-2xl text-yellow-800 mb-1">Selecione sua Linhagem</h2>
                <p className="text-sm text-yellow-900/60 italic mb-5">Sua origem define habilidades naturais e cultura.</p>
                {loading?<div className="text-center py-12 text-yellow-800 font-cinzel animate-pulse">Carregando raças do grimório...</div>:(
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {races.map(race=>(
                      <div key={race.index} onClick={()=>setSelectedRace(race)}
                        className={`p-4 border rounded cursor-pointer transition-all ${selectedRace?.index===race.index?'bg-yellow-200 border-yellow-600 shadow-md':'bg-white/80 border-yellow-300/50 hover:bg-yellow-50'}`}>
                        <h3 className="font-cinzel text-sm font-bold text-yellow-800">{race.name}</h3>
                      </div>
                    ))}
                  </div>
                )}
                {selectedRace&&<div className="mt-4 p-3 bg-yellow-800 rounded text-yellow-100 text-xs font-cinzel">✦ {selectedRace.name} selecionado</div>}
              </div>
            )}

            {/* STEP 2 */}
            {step===2&&(
              <div>
                <h2 className="font-cinzel text-xl md:text-2xl text-yellow-800 mb-1">Escolha sua Vocação</h2>
                <p className="text-sm text-yellow-900/60 italic mb-5">Sua classe define combate, magia e papel na aventura.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {classes.map(cls=>(
                    <div key={cls.index} onClick={()=>setSelectedClass(cls)}
                      className={`p-4 border rounded cursor-pointer transition-all ${selectedClass?.index===cls.index?'bg-yellow-200 border-yellow-600 shadow-md':'bg-white/80 border-yellow-300/50 hover:bg-yellow-50'}`}>
                      <h3 className="font-cinzel text-sm font-bold text-yellow-800">{cls.name}</h3>
                      <p className="text-xs text-yellow-700/60 mt-1">d{cls.hit_die} HP</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step===3&&(
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-cinzel text-xl md:text-2xl text-yellow-800">Atributos</h2>
                    <p className="text-sm text-yellow-900/60 italic">Point Buy — 27 pontos.</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-cinzel text-sm font-bold border ${pointsLeft()===0?'bg-green-700 text-green-100 border-green-500':'bg-yellow-800 text-yellow-200 border-yellow-600'}`}>
                    {pointsLeft()} pontos restantes
                  </div>
                </div>
                <div className="mb-4 bg-yellow-800/10 border border-yellow-700/30 rounded p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={tashaEnabled} onChange={e=>setTashaEnabled(e.target.checked)} className="accent-yellow-600"/>
                    <span className="font-cinzel text-xs font-bold text-yellow-800 flex items-center gap-1"><Sparkles className="w-3 h-3"/>Regra da Tasha (TCoE)</span>
                  </label>
                  {tashaEnabled&&(
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {[['Recebe +2',tashaPlus2,setTashaPlus2],['Recebe +1',tashaPlus1,setTashaPlus1]].map(([label,val,set])=>(
                        <div key={label}>
                          <p className="text-xs font-cinzel text-yellow-800 mb-1">{label}:</p>
                          <select value={val} onChange={e=>set(e.target.value)} className="w-full text-xs p-1.5 border border-yellow-400 rounded bg-yellow-50">
                            {Object.entries(STAT_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.keys(baseStats).map(stat=>(
                    <div key={stat} className="bg-white border border-yellow-300 rounded p-3 flex flex-col items-center gap-2">
                      <span className="font-cinzel text-xs font-bold text-yellow-800 uppercase">{STAT_NAMES[stat]}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={()=>adjustStat(stat,-1)} className="w-7 h-7 rounded-full border border-yellow-400 bg-yellow-50 hover:bg-yellow-200 font-bold text-yellow-800 text-lg">−</button>
                        <span className="font-bold text-xl text-yellow-900 w-6 text-center">{baseStats[stat]}</span>
                        <button onClick={()=>adjustStat(stat,1)} className="w-7 h-7 rounded-full border border-yellow-400 bg-yellow-50 hover:bg-yellow-200 font-bold text-yellow-800 text-lg">+</button>
                      </div>
                      {getBonus(stat)>0&&<span className="text-xs text-green-700 font-cinzel">+{getBonus(stat)} racial</span>}
                      <span className="font-bold text-yellow-700 text-sm font-cinzel">Total: {getTotal(stat)} ({getMod(stat)>=0?'+':''}{getMod(stat)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step===4&&(
              <div>
                <h2 className="font-cinzel text-xl md:text-2xl text-yellow-800 mb-1">Antecedente & História</h2>
                <p className="text-sm text-yellow-900/60 italic mb-5">Seu passado moldou quem você é.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {Object.entries(BACKGROUNDS).map(([key,bg])=>(
                    <div key={key} onClick={()=>setSelectedBackground(key)}
                      className={`p-3 border rounded cursor-pointer transition-all ${selectedBackground===key?'bg-yellow-200 border-yellow-600 shadow-md':'bg-white/80 border-yellow-300/50 hover:bg-yellow-50'}`}>
                      <h3 className="font-cinzel text-sm font-bold text-yellow-800">{bg.name}</h3>
                      <p className="text-xs text-yellow-700/60 mt-1">{bg.feature}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-yellow-900 rounded border border-yellow-700/50 p-5 flex flex-col sm:flex-row items-center gap-4">
                  <button onClick={()=>setXanatharStory(XANATHAR_EVENTS[Math.floor(Math.random()*XANATHAR_EVENTS.length)])}
                    className="w-14 h-14 rounded-full border-2 border-yellow-500 flex items-center justify-center hover:bg-yellow-700 transition-all shrink-0">
                    <Dices className="w-7 h-7 text-yellow-400"/>
                  </button>
                  <div>
                    <p className="font-cinzel text-xs text-yellow-500 uppercase mb-1">Evento de Vida — Guia do Xanathar</p>
                    <p className="text-sm text-yellow-100/80 italic">{xanatharStory||'Clique no dado para sortear seu passado...'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {step===5&&(
              <div>
                <h2 className="font-cinzel text-xl md:text-2xl text-yellow-800 mb-1">Selar o Grimório</h2>
                <p className="text-sm text-yellow-900/60 italic mb-5">Dê um nome ao seu herói para gravar sua história.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-cinzel text-yellow-800 mb-1">Nome do Personagem *</label>
                      <input value={charName} onChange={e=>setCharName(e.target.value)} placeholder="Ex: Aldaron Hérion"
                        className="w-full p-3 border border-yellow-400 rounded bg-yellow-50 font-cinzel text-yellow-900 outline-none focus:border-yellow-600"/>
                    </div>
                    <div>
                      <label className="block text-xs font-cinzel text-yellow-800 mb-1">URL do Retrato (opcional)</label>
                      <input value={portraitUrl} onChange={e=>setPortraitUrl(e.target.value)} placeholder="https://..."
                        className="w-full p-3 border border-yellow-400 rounded bg-yellow-50 text-xs text-yellow-900 outline-none focus:border-yellow-600"/>
                    </div>
                  </div>
                  <div className="bg-yellow-800 rounded p-5 text-yellow-100 space-y-2 text-sm font-cinzel">
                    <h4 className="text-yellow-400 uppercase text-xs tracking-widest mb-3">Revisão Final</h4>
                    <p>Raça: <strong>{selectedRace?.name}</strong></p>
                    <p>Classe: <strong>{selectedClass?.name}</strong></p>
                    <p>Antecedente: <strong>{BACKGROUNDS[selectedBackground].name}</strong></p>
                    <p>FOR {getTotal('str')} · DEX {getTotal('dex')} · CON {getTotal('con')}</p>
                    <p>INT {getTotal('int')} · SAB {getTotal('wis')} · CAR {getTotal('cha')}</p>
                    <p>HP Inicial: <strong>{8+getMod('con')}</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-[#14100d] border-t border-yellow-900/40 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <button onClick={()=>step>1&&setStep(p=>p-1)} disabled={step===1}
              className="flex items-center gap-2 px-4 py-2 rounded border border-yellow-800/50 text-yellow-700 font-cinzel text-xs disabled:opacity-30 hover:bg-yellow-900/30 transition-all">
              <ArrowLeft className="w-4 h-4"/> Anterior
            </button>
            <span className="font-cinzel text-xs text-yellow-800">{step} / {STEPS.length}</span>
            <button onClick={next}
              className="flex items-center gap-2 px-5 py-2 rounded bg-yellow-700 text-yellow-100 font-cinzel text-xs hover:bg-yellow-600 transition-all">
              {step===5?'Gravar Ficha':'Próximo'} <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
