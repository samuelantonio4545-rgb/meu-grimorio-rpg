import React, { useState } from 'react';
import { Shield, Sparkles, User, Sword, BookOpen, Compass, ArrowLeft, ArrowRight, Dices, Lock, HelpCircle } from 'lucide-react';

const RACES = {
  elf: {
    name: 'Elfo',
    description: 'Criaturas mágicas com afinidade sobrenatural, graça e longa expectativa de vida.',
    traits: ['Visão no Escuro (60ft)', 'Ancestralidade Feérica (Resistência a Encanto/Imunidade a Sono)', 'Sentidos Aguçados (Proficiência em Percepção)'],
    modifiers: { dex: 2 },
    subraces: {
      high_elf: { name: 'Alto Elfo', description: 'Estudiosos de magia arcana e arquearia.', modifiers: { int: 1 }, extraTraits: ['Truque de Mago Adicional'] },
      wood_elf: { name: 'Elfo da Floresta', description: 'Rápidos, furtivos e conectados com as matas.', modifiers: { wis: 1 }, extraTraits: ['Pés Ligeiros (Velocidade 35ft)', 'Máscara da Natureza'] }
    }
  },
  dwarf: {
    name: 'Anão',
    description: 'Guerreiros e ferreiros robustos das profundezas, conhecidos por sua resiliência.',
    traits: ['Visão no Escuro (60ft)', 'Resiliência Anã (Resistência a Veneno)', 'Treinamento de Combate Anão'],
    modifiers: { con: 2 },
    subraces: {
      hill_dwarf: { name: 'Anão da Colina', description: 'Possuem sentidos aguçados e vitalidade divina.', modifiers: { wis: 1 }, extraTraits: ['Robustez Anã (+1 PV por nível)'] },
      mountain_dwarf: { name: 'Anão da Montanha', description: 'Fortes e acostumados a armaduras pesadas.', modifiers: { str: 2 }, extraTraits: ['Treinamento com Armaduras Leves/Médias'] }
    }
  },
  human: {
    name: 'Humano',
    description: 'A mais adaptável, ambiciosa e diversa das raças mortais.',
    traits: ['Versatilidade Natural'],
    modifiers: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    subraces: null
  }
};

const CLASSES = {
  fighter: {
    name: 'Guerreiro',
    hitDie: 10,
    primaryAbility: 'str',
    skillsToSelect: 2,
    availableSkills: ['Atletismo', 'Acrobacia', 'Sobrevivência', 'Intimidação', 'História', 'Percepção'],
    features: ['Estilo de Combate', 'Retomar o Fôlego (Second Wind)'],
    spellcasting: null
  },
  wizard: {
    name: 'Mago',
    hitDie: 6,
    primaryAbility: 'int',
    skillsToSelect: 2,
    availableSkills: ['Arcanismo', 'História', 'Investigação', 'Religião', 'Perspicácia', 'Medicina'],
    features: ['Recuperação Arcana', 'Conjuração'],
    spellcasting: {
      ability: 'int',
      cantripsSelected: 3,
      spellsSelected: 2,
      cantrips: ['Prestidigitação', 'Raio de Gelo', 'Mãos Flamejantes (Truque)', 'Toque Chocante'],
      level1Spells: ['Mísseis Mágicos', 'Armadura Arcana', 'Escudo Bruxo', 'Deteção de Magia']
    }
  },
  cleric: {
    name: 'Clérigo',
    hitDie: 8,
    primaryAbility: 'wis',
    skillsToSelect: 2,
    availableSkills: ['História', 'Medicina', 'Perspicácia', 'Religião', 'Persuasão'],
    features: ['Domínio Divino (Subclasse)', 'Conjuração'],
    spellcasting: {
      ability: 'wis',
      cantripsSelected: 3,
      spellsSelected: 2,
      cantrips: ['Chama Sagrada', 'Orientação', 'Taumaturgia', 'Poupar os Moribundos'],
      level1Spells: ['Curar Ferimentos', 'Bênção', 'Escudo da Fé', 'Palavra de Cura']
    }
  }
};

const BACKGROUNDS = {
  acolyte: { name: 'Acólito', skills: ['Intuição (Perspicácia)', 'Religião'], feature: 'Abrigo do Fiel' },
  criminal: { name: 'Criminoso', skills: ['Enganação', 'Furtividade'], feature: 'Contato Criminoso' },
  folk_hero: { name: 'Herói do Povo', skills: ['Adestrar Animais', 'Sobrevivência'], feature: 'Hospitalidade Rústica' }
};

const XANATHAR_LIFE_EVENTS = [
  "Você escapou por pouco de um ataque de Goblins quando criança.",
  "Um mago excêntrico lhe deu um livro em branco que brilha à meia-noite.",
  "Você foi abençoado por um clérigo viajante após realizar uma boa ação.",
  "Você perdeu tudo em uma aposta arriscada com um nobre local.",
  "Você encontrou uma adaga enferrujada de herança de família em um poço antigo."
];

export default function CharacterCreator({ onSave, onCancel }) {
  const [step, setStep] = useState(1);
  const [selectedRace, setSelectedRace] = useState('elf');
  const [selectedSubrace, setSelectedSubrace] = useState('high_elf');
  const [selectedClass, setSelectedClass] = useState('fighter');
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  // Tasha's customization toggles & score allocations
  const [tashaEnabled, setTashaEnabled] = useState(false);
  const [tashaPlus2, setTashaPlus2] = useState('str');
  const [tashaPlus1, setTashaPlus1] = useState('dex');

  // Point Buy stats state (default 8)
  const [baseStats, setBaseStats] = useState({
    str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
  });
  
  // Background & Xanathar states
  const [selectedBackground, setSelectedBackground] = useState('acolyte');
  const [xanatharStory, setXanatharStory] = useState("Clique no dado para sortear seu acontecimento histórico...");
  const [traits, setTraits] = useState({ bond: '', flaw: '', ideal: '', personality: '' });

  // Spells Selected
  const [spells, setSpells] = useState([]);
  const [cantrips, setCantrips] = useState([]);

  // Character Metadata
  const [charName, setCharName] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');

  // Point Buy Helper functions
  const getPointCost = (value) => {
    if (value <= 8) return 0;
    if (value <= 13) return value - 8;
    if (value === 14) return 7;
    if (value === 15) return 9;
    return 9;
  };

  const getPointsRemaining = () => {
    const spent = Object.values(baseStats).reduce((acc, val) => acc + getPointCost(val), 0);
    return 27 - spent;
  };

  const adjustStat = (stat, amount) => {
    const current = baseStats[stat];
    const next = current + amount;
    if (next < 8 || next > 15) return;
    
    // Check points
    const costCurrent = getPointCost(current);
    const costNext = getPointCost(next);
    const diff = costNext - costCurrent;
    
    if (getPointsRemaining() >= diff) {
      setBaseStats(prev => ({ ...prev, [stat]: next }));
    }
  };

  // Calculating racial modifiers or Tasha overrides
  const getStatBonus = (stat) => {
    if (tashaEnabled) {
      let bonus = 0;
      if (tashaPlus2 === stat) bonus += 2;
      if (tashaPlus1 === stat) bonus += 1;
      return bonus;
    }

    let bonus = 0;
    const raceConfig = RACES[selectedRace];
    if (raceConfig.modifiers[stat]) {
      bonus += raceConfig.modifiers[stat];
    }
    if (raceConfig.subraces && selectedSubrace && raceConfig.subraces[selectedSubrace]) {
      const subraceConfig = raceConfig.subraces[selectedSubrace];
      if (subraceConfig.modifiers[stat]) {
        bonus += subraceConfig.modifiers[stat];
      }
    }
    return bonus;
  };

  const getTotalStat = (stat) => {
    return baseStats[stat] + getStatBonus(stat);
  };

  const handleNextStep = () => {
    if (step === 1) {
      const raceConfig = RACES[selectedRace];
      if (raceConfig.subraces && !selectedSubrace) {
        alert('Por favor, selecione uma subraça.');
        return;
      }
    }
    if (step === 2) {
      const classConfig = CLASSES[selectedClass];
      if (selectedSkills.length !== classConfig.skillsToSelect) {
        alert(`Selecione exatamente ${classConfig.skillsToSelect} perícias de classe.`);
        return;
      }
    }
    if (step === 3) {
      if (getPointsRemaining() !== 0) {
        alert('Por favor, distribua todos os 27 pontos de atributos antes de prosseguir.');
        return;
      }
      if (tashaEnabled && tashaPlus2 === tashaPlus1) {
        alert('Os bônus de +2 e +1 da personalização da Tasha devem ser alocados em atributos diferentes.');
        return;
      }
    }
    if (step === 6) {
      if (!charName.trim()) {
        alert('Por favor, dê um nome ao seu herói para gravá-lo no grimório.');
        return;
      }
      saveCharacter();
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleSkillToggle = (skill) => {
    const limit = CLASSES[selectedClass].skillsToSelect;
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else if (selectedSkills.length < limit) {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleSpellToggle = (spell, isCantrip) => {
    const list = isCantrip ? cantrips : spells;
    const setter = isCantrip ? setCantrips : setSpells;
    const limit = isCantrip ? CLASSES[selectedClass].spellcasting.cantripsSelected : CLASSES[selectedClass].spellcasting.spellsSelected;

    if (list.includes(spell)) {
      setter(prev => prev.filter(s => s !== spell));
    } else if (list.length < limit) {
      setter(prev => [...prev, spell]);
    }
  };

  const rollXanatharEvent = () => {
    const randomIdx = Math.floor(Math.random() * XANATHAR_LIFE_EVENTS.length);
    setXanatharStory(XANATHAR_LIFE_EVENTS[randomIdx]);
  };

  // Compile full JSON structure based on character_schema
  const saveCharacter = () => {
    const finalId = 'char_' + Date.now();
    const classConfig = CLASSES[selectedClass];
    const raceConfig = RACES[selectedRace];
    const subConfig = raceConfig.subraces ? raceConfig.subraces[selectedSubrace] : null;

    // Create DND5e Character JSON matching JSON Schema
    const characterSheet = {
      id: finalId,
      meta: {
        name: charName,
        level: 1,
        experience: 0,
        class: classConfig.name,
        subclass: subConfig ? subConfig.name : '',
        race: raceConfig.name,
        subrace: subConfig ? subConfig.name : '',
        background: BACKGROUNDS[selectedBackground].name,
        alignment: 'Neutro',
        portraitUrl: portraitUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
      },
      attributes: {
        strength: getTotalStat('str'),
        dexterity: getTotalStat('dex'),
        constitution: getTotalStat('con'),
        intelligence: getTotalStat('int'),
        wisdom: getTotalStat('wis'),
        charisma: getTotalStat('cha'),
        tashaCustomization: {
          enabled: tashaEnabled,
          abilityScoreSwaps: tashaEnabled ? [
            { from: selectedRace === 'elf' ? 'dex' : 'con', to: tashaPlus2, value: 2 },
            { from: 'other', to: tashaPlus1, value: 1 }
          ] : [],
          customLanguages: [],
          customProficiencies: []
        }
      },
      hp: {
        max: classConfig.hitDie + Math.floor((getTotalStat('con') - 10) / 2),
        current: classConfig.hitDie + Math.floor((getTotalStat('con') - 10) / 2),
        temporary: 0,
        deathSaves: { successes: 0, failures: 0 }
      },
      skills: selectedSkills.reduce((acc, skill) => {
        acc[skill.toLowerCase()] = { proficient: true, expertise: false, customModifier: 0 };
        return acc;
      }, {}),
      savingThrows: {
        str: { proficient: selectedClass === 'fighter', customModifier: 0 },
        dex: { proficient: false, customModifier: 0 },
        con: { proficient: selectedClass === 'fighter' || selectedClass === 'cleric', customModifier: 0 },
        int: { proficient: selectedClass === 'wizard', customModifier: 0 },
        wis: { proficient: selectedClass === 'wizard' || selectedClass === 'cleric', customModifier: 0 },
        cha: { proficient: false, customModifier: 0 }
      },
      inventory: [
        { id: 'inv_1', name: 'Armadura de Couro', quantity: 1, weight: 10, isEquipped: true, description: 'Armadura básica' },
        { id: 'inv_2', name: 'Espada Curta', quantity: 1, weight: 3, isEquipped: true, description: 'Dano: 1d6 perfurante' }
      ],
      spells: {
        spellcastingAbility: classConfig.spellcasting ? classConfig.spellcasting.ability : 'none',
        spellSaveDC: classConfig.spellcasting ? (8 + 2 + Math.floor((getTotalStat(classConfig.spellcasting.ability) - 10) / 2)) : 0,
        spellAttackBonus: classConfig.spellcasting ? (2 + Math.floor((getTotalStat(classConfig.spellcasting.ability) - 10) / 2)) : 0,
        slots: {
          level_1: { max: classConfig.spellcasting ? 2 : 0, current: classConfig.spellcasting ? 2 : 0 }
        },
        list: [
          ...cantrips.map(c => ({ id: 'cant_' + c, name: c, level: 0, school: 'Evocação', castingTime: '1 Ação', range: '60ft', components: 'V, S', duration: 'Instantâneo', concentration: false, description: 'Truque básico', prepared: true })),
          ...spells.map(s => ({ id: 'spell_' + s, name: s, level: 1, school: 'Abjuração', castingTime: '1 Ação', range: 'Toque', components: 'V, S, M', duration: '1 Hora', concentration: true, description: 'Magia de 1º Círculo', prepared: true }))
        ]
      },
      conditions: {
        blinded: false, charmed: false, deafened: false, frightened: false, grappled: false,
        incapacitated: false, invisible: false, paralyzed: false, petrified: false, poisoned: false,
        prone: false, restrained: false, stunned: false, unconscious: false, exhaustion: 0
      },
      restState: {
        hitDiceTotal: { [classConfig.hitDie]: 1 },
        hitDiceRemaining: { [classConfig.hitDie]: 1 },
        customResources: []
      },
      concentration: { isConcentrating: false, spellId: null, spellName: null },
      notes: `História do Xanathar: ${xanatharStory}\nTraços: Vínculo: ${traits.bond || 'Nenhum'}`
    };

    onSave(characterSheet);
  };

  const stepsLabels = ['Raça', 'Classe', 'Atributos & TCoE', 'Antecedente', 'Magias', 'Grimório'];

  return (
    <div className="w-full max-w-5xl bg-grimorio-panel border-2 border-grimorio-gold/60 rounded shadow-2xl flex flex-col md:flex-row min-h-[600px] overflow-hidden text-grimorio-parchment-light relative z-20">
      
      {/* Sidebar - BG3 Navigation */}
      <div className="w-full md:w-64 bg-[#14100d] border-b md:border-b-0 md:border-r border-grimorio-gold-dark/30 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-grimorio-gold-dark/20">
            <Compass className="w-5 h-5 text-grimorio-gold" />
            <h4 className="font-cinzel text-sm uppercase text-grimorio-gold">Criação</h4>
          </div>
          
          <ul className="space-y-2">
            {stepsLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isPassed = step > stepNum;
              return (
                <li key={idx} className={`flex items-center gap-3 p-2 text-sm font-cinzel tracking-wider rounded ${isActive ? 'bg-grimorio-gold/10 text-grimorio-gold border border-grimorio-gold/20 shadow-rune-glow' : 'text-grimorio-parchment-light/50'}`}>
                  <span className={`w-5 h-5 flex items-center justify-center text-xs border rounded-full ${isActive ? 'border-grimorio-gold text-grimorio-gold' : isPassed ? 'border-grimorio-gold-dark text-grimorio-gold-dark' : 'border-grimorio-parchment-light/30'}`}>
                    {stepNum}
                  </span>
                  <span>{label}</span>
                  {!isActive && !isPassed && stepNum > 3 && <Lock className="w-3.5 h-3.5 ml-auto text-grimorio-parchment-light/20" />}
                </li>
              );
            })}
          </ul>
        </div>
        
        <button onClick={onCancel} className="mt-8 text-xs text-grimorio-gold-dark hover:text-grimorio-gold transition-colors font-cinzel uppercase tracking-widest text-center">
          Abandonar Criação
        </button>
      </div>

      {/* Main Form Area */}
      <div className="flex-grow parchment-paper p-6 md:p-8 flex flex-col justify-between text-grimorio-panel min-h-[500px]">
        <div>
          {/* STEP 1: RACE */}
          {step === 1 && (
            <div>
              <h2 className="font-cinzel text-2xl text-grimorio-gold-dark mb-2">Selecione sua Linhagem</h2>
              <p className="font-garamond italic text-sm text-grimorio-panel/70 mb-6">A sua origem define suas habilidades naturais, feições e cultura.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {Object.keys(RACES).map(raceKey => (
                  <div 
                    key={raceKey}
                    onClick={() => { setSelectedRace(raceKey); setSelectedSubrace(raceKey === 'human' ? null : raceKey === 'elf' ? 'high_elf' : 'hill_dwarf'); }}
                    className={`p-4 border cursor-pointer rounded transition-all ${selectedRace === raceKey ? 'bg-grimorio-gold/20 border-grimorio-gold shadow-md' : 'bg-[#fffcf4]/80 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                  >
                    <h3 className="font-cinzel text-lg text-grimorio-gold-dark">{RACES[raceKey].name}</h3>
                    <p className="text-xs font-garamond mt-1 leading-relaxed">{RACES[raceKey].description}</p>
                  </div>
                ))}
              </div>

              {RACES[selectedRace].subraces && (
                <div className="mt-6 border-t border-grimorio-gold-dark/20 pt-4">
                  <h4 className="font-cinzel text-sm text-grimorio-gold-dark mb-3">Escolha uma Subraça</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(RACES[selectedRace].subraces).map(subKey => {
                      const sub = RACES[selectedRace].subraces[subKey];
                      return (
                        <div 
                          key={subKey}
                          onClick={() => setSelectedSubrace(subKey)}
                          className={`p-4 border cursor-pointer rounded transition-all text-sm ${selectedSubrace === subKey ? 'bg-grimorio-gold/20 border-grimorio-gold' : 'bg-[#fffcf4]/60 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                        >
                          <h5 className="font-cinzel font-bold text-grimorio-gold-dark">{sub.name}</h5>
                          <p className="text-xs font-garamond mt-1">{sub.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CLASS */}
          {step === 2 && (
            <div>
              <h2 className="font-cinzel text-2xl text-grimorio-gold-dark mb-2">Escolha sua Vocação</h2>
              <p className="font-garamond italic text-sm text-grimorio-panel/70 mb-6">Sua classe define seu treinamento em armas, magia e papel de combate.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {Object.keys(CLASSES).map(classKey => (
                  <div 
                    key={classKey}
                    onClick={() => { setSelectedClass(classKey); setSelectedSkills([]); setSelectedCantrips([]); setSelectedSpells([]); }}
                    className={`p-4 border cursor-pointer rounded transition-all ${selectedClass === classKey ? 'bg-grimorio-gold/20 border-grimorio-gold shadow-md' : 'bg-[#fffcf4]/80 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                  >
                    <h3 className="font-cinzel text-lg text-grimorio-gold-dark">{CLASSES[classKey].name}</h3>
                    <p className="text-xs font-garamond mt-1">Dado de Vida: d{CLASSES[classKey].hitDie}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-grimorio-gold-dark/20 pt-4">
                <h4 className="font-cinzel text-sm text-grimorio-gold-dark mb-2">
                  Escolha Perícias de Classe (Selecione {CLASSES[selectedClass].skillsToSelect})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {CLASSES[selectedClass].availableSkills.map(skill => {
                    const isSel = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1.5 border rounded text-xs font-cinzel transition-all ${isSel ? 'bg-grimorio-gold text-[#110e0c] border-grimorio-gold' : 'bg-[#fffcf4]/60 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STATS & TASHA */}
          {step === 3 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-cinzel text-2xl text-grimorio-gold-dark">Distribuição de Atributos</h2>
                  <p className="font-garamond italic text-sm text-grimorio-panel/70">Point Buy: Gaste seus 27 pontos disponíveis de forma equilibrada.</p>
                </div>
                <div className="bg-[#1a1512] text-grimorio-gold border border-grimorio-gold/30 px-4 py-2 font-cinzel rounded shadow-md text-center">
                  Pontos Restantes: {getPointsRemaining()}
                </div>
              </div>

              {/* Tasha's Customization Trigger */}
              <div className="mb-6 bg-[#fff9ea]/50 border border-grimorio-gold-dark/20 p-4 rounded flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tashaEnabled} 
                    onChange={(e) => setTashaEnabled(e.target.checked)} 
                    className="accent-grimorio-gold"
                  />
                  <span className="font-cinzel text-xs font-bold text-grimorio-gold-dark flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Ativar Regra de Customização Rácial (Tasha - TCoE)
                  </span>
                </label>
                <p className="text-xs font-garamond leading-relaxed">
                  Permite realocar o bônus de +2 e +1 da sua raça em qualquer atributo que você desejar, ao invés de usar os valores padrão da sua linhagem.
                </p>
                
                {tashaEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-cinzel text-grimorio-gold-dark mb-1">Recebe +2:</label>
                      <select 
                        value={tashaPlus2} 
                        onChange={(e) => setTashaPlus2(e.target.value)}
                        className="w-full text-xs p-1.5 bg-[#fcf8ef] border border-grimorio-gold-dark/40 rounded font-garamond"
                      >
                        <option value="str">Força (STR)</option>
                        <option value="dex">Destreza (DEX)</option>
                        <option value="con">Constituição (CON)</option>
                        <option value="int">Inteligência (INT)</option>
                        <option value="wis">Sabedoria (WIS)</option>
                        <option value="cha">Carisma (CHA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-cinzel text-grimorio-gold-dark mb-1">Recebe +1:</label>
                      <select 
                        value={tashaPlus1} 
                        onChange={(e) => setTashaPlus1(e.target.value)}
                        className="w-full text-xs p-1.5 bg-[#fcf8ef] border border-grimorio-gold-dark/40 rounded font-garamond"
                      >
                        <option value="str">Força (STR)</option>
                        <option value="dex">Destreza (DEX)</option>
                        <option value="con">Constituição (CON)</option>
                        <option value="int">Inteligência (INT)</option>
                        <option value="wis">Sabedoria (WIS)</option>
                        <option value="cha">Carisma (CHA)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Point Buy Sliders/Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.keys(baseStats).map(stat => {
                  const val = baseStats[stat];
                  const bonus = getStatBonus(stat);
                  const total = val + bonus;
                  const mod = Math.floor((total - 10) / 2);
                  return (
                    <div key={stat} className="bg-[#fffdf8] border border-grimorio-gold-dark/30 p-3 rounded flex flex-col items-center justify-between">
                      <span className="font-cinzel text-xs font-bold uppercase tracking-wider text-grimorio-gold-dark">
                        {stat === 'str' ? 'Força' : stat === 'dex' ? 'Destreza' : stat === 'con' ? 'Constituição' : stat === 'int' ? 'Inteligência' : stat === 'wis' ? 'Sabedoria' : 'Carisma'}
                      </span>
                      
                      <div className="flex items-center gap-3 my-2">
                        <button 
                          onClick={() => adjustStat(stat, -1)}
                          className="w-6 h-6 border border-grimorio-gold-dark/50 bg-[#fff5df] font-bold rounded flex items-center justify-center hover:bg-grimorio-gold hover:text-white"
                        >
                          -
                        </button>
                        <span className="font-medieval text-xl font-bold text-grimorio-panel">{val}</span>
                        <button 
                          onClick={() => adjustStat(stat, 1)}
                          className="w-6 h-6 border border-grimorio-gold-dark/50 bg-[#fff5df] font-bold rounded flex items-center justify-center hover:bg-grimorio-gold hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-xs font-garamond text-grimorio-panel/70 flex flex-col items-center">
                        <span>Bônus Rácial: +{bonus}</span>
                        <span className="font-bold text-grimorio-gold-dark">Total: {total} ({mod >= 0 ? `+${mod}` : mod})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: BACKGROUND & XANATHAR */}
          {step === 4 && (
            <div>
              <h2 className="font-cinzel text-2xl text-grimorio-gold-dark mb-2">Antecedente & História</h2>
              <p className="font-garamond italic text-sm text-grimorio-panel/70 mb-6">O passado moldou quem você é. Sorteie eventos com o Guia do Xanathar.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {Object.keys(BACKGROUNDS).map(bgKey => (
                  <div 
                    key={bgKey}
                    onClick={() => setSelectedBackground(bgKey)}
                    className={`p-4 border cursor-pointer rounded transition-all ${selectedBackground === bgKey ? 'bg-grimorio-gold/20 border-grimorio-gold shadow-md' : 'bg-[#fffcf4]/80 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                  >
                    <h3 className="font-cinzel text-lg text-grimorio-gold-dark">{BACKGROUNDS[bgKey].name}</h3>
                    <p className="text-xs font-garamond mt-1">Habilidade: {BACKGROUNDS[bgKey].feature}</p>
                  </div>
                ))}
              </div>

              {/* Xanathar Event Roller */}
              <div className="bg-[#1a1512] text-grimorio-parchment-light border border-grimorio-gold/30 p-5 rounded-md flex flex-col sm:flex-row items-center gap-4 mt-6">
                <button 
                  onClick={rollXanatharEvent}
                  className="w-14 h-14 rounded-full border border-grimorio-gold bg-grimorio-panel hover:bg-grimorio-gold hover:text-grimorio-bg flex items-center justify-center shadow-rune-glow transition-all"
                >
                  <Dices className="w-7 h-7 text-grimorio-gold hover:text-grimorio-bg" />
                </button>
                <div className="flex-grow">
                  <h4 className="font-cinzel text-xs text-grimorio-gold uppercase tracking-wider mb-1">Acontecimento de Vida (XGtE)</h4>
                  <p className="font-garamond italic text-sm leading-relaxed text-grimorio-parchment-light/80">
                    "{xanatharStory}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SPELLS & EQUIPMENT */}
          {step === 5 && (
            <div>
              <h2 className="font-cinzel text-2xl text-grimorio-gold-dark mb-2">Preparação & Magias</h2>
              <p className="font-garamond italic text-sm text-grimorio-panel/70 mb-6">
                {CLASSES[selectedClass].spellcasting ? 'Selecione seus Truques e Magias de Primeiro Círculo.' : 'Seus recursos físicos e equipamentos iniciais estão prontos.'}
              </p>

              {CLASSES[selectedClass].spellcasting ? (
                <div className="space-y-6">
                  {/* Cantrips selection */}
                  <div>
                    <h4 className="font-cinzel text-sm text-grimorio-gold-dark mb-2">
                      Escolha Truques (Selecione {CLASSES[selectedClass].spellcasting.cantripsSelected - cantrips.length} restantes)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {CLASSES[selectedClass].spellcasting.cantrips.map(c => {
                        const isSel = cantrips.includes(c);
                        return (
                          <button
                            key={c}
                            onClick={() => handleSpellToggle(c, true)}
                            className={`px-3 py-1.5 border rounded text-xs font-cinzel transition-all ${isSel ? 'bg-grimorio-gold text-grimorio-bg border-grimorio-gold' : 'bg-[#fffcf4]/60 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level 1 spells selection */}
                  <div>
                    <h4 className="font-cinzel text-sm text-grimorio-gold-dark mb-2">
                      Escolha Magias de 1º Nível (Selecione {CLASSES[selectedClass].spellcasting.spellsSelected - spells.length} restantes)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {CLASSES[selectedClass].spellcasting.level1Spells.map(s => {
                        const isSel = spells.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => handleSpellToggle(s, false)}
                            className={`px-3 py-1.5 border rounded text-xs font-cinzel transition-all ${isSel ? 'bg-grimorio-gold text-grimorio-bg border-grimorio-gold' : 'bg-[#fffcf4]/60 border-grimorio-gold-dark/30 hover:bg-[#fff9ea]'}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#fff9ea]/50 border border-grimorio-gold-dark/20 p-6 rounded-md">
                  <h4 className="font-cinzel text-base text-grimorio-gold-dark mb-2">Equipamento Inicial de Classe</h4>
                  <ul className="list-disc list-inside font-garamond text-sm leading-relaxed space-y-1.5">
                    <li>Cota de Malha Pesada (CA 16)</li>
                    <li>Espada Longa (+5 para atingir, 1d8 cortante)</li>
                    <li>Escudo de Carvalho Revestido de Ferro (+2 CA)</li>
                    <li>Pacote de Masmorra (tochas, rações, corda, pederneira)</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: SUMMARY & FINISH */}
          {step === 6 && (
            <div>
              <h2 className="font-cinzel text-2xl text-grimorio-gold-dark mb-2">Finalização do Grimório</h2>
              <p className="font-garamond italic text-sm text-grimorio-panel/70 mb-6">Nomeie seu personagem e selecione um retrato para selar o pacto.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-cinzel text-grimorio-gold-dark mb-1">Nome do Personagem:</label>
                    <input 
                      type="text" 
                      value={charName} 
                      onChange={(e) => setCharName(e.target.value)} 
                      placeholder="Ex: Aldaron Hérion"
                      className="w-full text-sm p-2 bg-[#fcf8ef] border border-grimorio-gold-dark/40 rounded font-garamond outline-none focus:border-grimorio-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-cinzel text-grimorio-gold-dark mb-1">URL da Imagem do Retrato (Opcional):</label>
                    <input 
                      type="text" 
                      value={portraitUrl} 
                      onChange={(e) => setPortraitUrl(e.target.value)} 
                      placeholder="https://exemplo.com/retrato.jpg"
                      className="w-full text-xs p-2 bg-[#fcf8ef] border border-grimorio-gold-dark/40 rounded font-garamond outline-none focus:border-grimorio-gold"
                    />
                  </div>
                </div>

                <div className="border border-grimorio-gold-dark/20 p-4 rounded bg-[#fff9ea]/50 flex flex-col justify-between text-xs font-cinzel tracking-wider text-grimorio-gold-dark/80">
                  <h4 className="font-bold border-b border-grimorio-gold-dark/15 pb-1 mb-2 text-center text-sm uppercase">Revisão Rápida</h4>
                  <div className="space-y-1.5">
                    <div>Linhagem: <span className="font-bold text-grimorio-panel">{RACES[selectedRace].name} {selectedSubrace ? `(${RACES[selectedRace].subraces[selectedSubrace].name})` : ''}</span></div>
                    <div>Vocação: <span className="font-bold text-grimorio-panel">{CLASSES[selectedClass].name}</span></div>
                    <div>Atributos base: <span className="font-bold text-grimorio-panel">{Object.keys(baseStats).map(s => `${s.toUpperCase()}:${getTotalStat(s)}`).join(' | ')}</span></div>
                    <div>Antecedente: <span className="font-bold text-grimorio-panel">{BACKGROUNDS[selectedBackground].name}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-grimorio-gold-dark/20 pt-4 mt-8">
          <button 
            onClick={handlePrevStep}
            disabled={step === 1}
            className="rune-button flex items-center gap-1.5 text-xs"
            style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
          
          <button 
            onClick={handleNextStep}
            className="rune-button flex items-center gap-1.5 text-xs"
            style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
          >
            {step === 6 ? 'Gravar Ficha' : 'Próximo'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
