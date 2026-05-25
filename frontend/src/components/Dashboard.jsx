import React, { useState, useEffect } from 'react';
import { Heart, Shield, Award, User, Flame, Sword, Sparkles, Coffee, Sunrise, Eye, Trash2, Edit3, Compass, Check, AlertTriangle } from 'lucide-react';

export default function Dashboard({ character: initialCharacter, onBack, onUpdate }) {
  const [character, setCharacter] = useState(initialCharacter);
  const [rollLog, setRollLog] = useState([]);
  const [rollModifierMode, setRollModifierMode] = useState('normal'); // 'normal', 'advantage', 'disadvantage'
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  
  // Modals / Panels
  const [showRestModal, setShowRestModal] = useState(false);
  const [showConcentrationAlert, setShowConcentrationAlert] = useState(false);
  const [pendingDamage, setPendingDamage] = useState(0);

  // Sync state changes with parent
  useEffect(() => {
    if (onUpdate) {
      onUpdate(character);
    }
  }, [character]);

  // Dice Roller Engine
  const rollDice = (rollName, modifier, isSavingThrow = false, isAbilityCheck = false) => {
    let finalModMode = rollModifierMode;

    // Apply Condition Matrix rules to rolls
    if (isAbilityCheck) {
      if (character.conditions.poisoned) {
        finalModMode = 'disadvantage';
      }
      if (character.conditions.exhaustion >= 1) {
        finalModMode = 'disadvantage';
      }
      if (character.conditions.restrained && rollName.toLowerCase().includes('destreza')) {
        finalModMode = 'disadvantage';
      }
    }

    if (!isSavingThrow && !isAbilityCheck) { // Weapon attack rolls
      if (character.conditions.poisoned || character.conditions.prone || character.conditions.blinded) {
        finalModMode = 'disadvantage';
      }
      if (character.conditions.exhaustion >= 3) {
        finalModMode = 'disadvantage';
      }
    }

    if (isSavingThrow) {
      if (character.conditions.restrained && rollName.toLowerCase() === 'destreza') {
        finalModMode = 'disadvantage';
      }
      if (character.conditions.exhaustion >= 3) {
        finalModMode = 'disadvantage';
      }
    }

    const d1 = Math.floor(Math.random() * 20) + 1;
    const d2 = Math.floor(Math.random() * 20) + 1;
    
    let rollVal = d1;
    let details = `d20(${d1})`;

    if (finalModMode === 'advantage') {
      rollVal = Math.max(d1, d2);
      details = `d20 com Vantagem: max(${d1}, ${d2})`;
    } else if (finalModMode === 'disadvantage') {
      rollVal = Math.min(d1, d2);
      details = `d20 com Desvantagem: min(${d1}, ${d2})`;
    }

    const total = rollVal + modifier;
    const newLog = {
      id: Date.now(),
      name: rollName,
      details,
      modifier: modifier >= 0 ? `+${modifier}` : modifier,
      result: rollVal,
      total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setRollLog(prev => [newLog, ...prev].slice(0, 10)); // keep last 10 rolls
    return total;
  };

  // HP Modifier (Damage / Heal)
  const handleModifyHP = (type) => {
    let amt = type === 'damage' ? parseInt(damageInput) : parseInt(healInput);
    if (isNaN(amt) || amt <= 0) return;

    if (type === 'damage') {
      setDamageInput('');
      
      // Save for concentration check before modifying
      const wasConcentrating = character.concentration.isConcentrating;

      setCharacter(prev => {
        let tempHp = prev.hp.temporary;
        let curHp = prev.hp.current;
        
        // Temporary HP absorbs damage first
        if (tempHp > 0) {
          if (tempHp >= amt) {
            tempHp -= amt;
            amt = 0;
          } else {
            amt -= tempHp;
            tempHp = 0;
          }
        }

        curHp = Math.max(0, curHp - amt);
        let deathSaves = { ...prev.hp.deathSaves };

        // Handle Death Saves trigger
        if (curHp === 0) {
          deathSaves = { successes: 0, failures: 0 };
        }

        return {
          ...prev,
          hp: { ...prev.hp, current: curHp, temporary: tempHp, deathSaves }
        };
      });

      // Spell Concentration Guard trigger
      if (wasConcentrating) {
        setPendingDamage(amt);
        setShowConcentrationAlert(true);
      }

    } else {
      setHealInput('');
      setCharacter(prev => {
        const curHp = Math.min(prev.hp.max, prev.hp.current + amt);
        return {
          ...prev,
          hp: { ...prev.hp, current: curHp }
        };
      });
    }
  };

  // Roll Spell Concentration Save
  const handleConcentrationSave = () => {
    const dc = Math.max(10, Math.floor(pendingDamage / 2));
    const conMod = Math.floor((character.attributes.constitution - 10) / 2);
    
    // Check if proficient in CON saves
    const isProf = character.savingThrows.con.proficient;
    const profBonus = 2; // Level 1 is +2
    const totalMod = conMod + (isProf ? profBonus : 0);

    const rollResult = rollDice('Salvaguarda de Concentração', totalMod, true);
    
    if (rollResult >= dc) {
      alert(`Sucesso! Você manteve a concentração na magia ${character.concentration.spellName} (CD ${dc}, Rolado: ${rollResult})`);
    } else {
      alert(`Falhou! Você perdeu a concentração na magia ${character.concentration.spellName} (CD ${dc}, Rolado: ${rollResult})`);
      setCharacter(prev => ({
        ...prev,
        concentration: { isConcentrating: false, spellId: null, spellName: null }
      }));
    }
    setShowConcentrationAlert(false);
  };

  // Toggle Spell Concentration Manually
  const handleToggleConcentration = () => {
    setCharacter(prev => ({
      ...prev,
      concentration: { isConcentrating: false, spellId: null, spellName: null }
    }));
  };

  // Cast Spell
  const handleCastSpell = (spell) => {
    if (spell.level > 0) {
      const slotKey = `level_${spell.level}`;
      const slot = character.spells.slots[slotKey];
      
      if (!slot || slot.current <= 0) {
        alert('Não restam espaços de magia deste nível.');
        return;
      }

      // Consume Slot
      setCharacter(prev => ({
        ...prev,
        spells: {
          ...prev.spells,
          slots: {
            ...prev.spells.slots,
            [slotKey]: { ...slot, current: slot.current - 1 }
          }
        }
      }));
    }

    // Set Concentration
    if (spell.concentration) {
      setCharacter(prev => ({
        ...prev,
        concentration: { isConcentrating: true, spellId: spell.id, spellName: spell.name }
      }));
      alert(`Concentrando na magia: ${spell.name}`);
    } else {
      alert(`Castou magia: ${spell.name}`);
    }
  };

  // Weapon Attack & Ammo consumption
  const handleWeaponAttack = (weapon) => {
    let modifier = Math.floor((character.attributes.strength - 10) / 2); // Default Strength
    
    if (weapon.properties && weapon.properties.includes('Finesse')) {
      // Use Dex if higher
      const dexMod = Math.floor((character.attributes.dexterity - 10) / 2);
      if (dexMod > modifier) modifier = dexMod;
    }

    // Add proficiency bonus (+2)
    modifier += 2;

    // Check Ammo
    if (weapon.consumesAmmunitionId) {
      const ammoItem = character.inventory.find(i => i.id === weapon.consumesAmmunitionId);
      
      if (!ammoItem || ammoItem.quantity <= 0) {
        alert(`Sem munição para ${weapon.name}! O ataque será feito com Desvantagem (Arma Improvisada).`);
        rollDice(`Ataque (${weapon.name} - Improvisado)`, modifier - 2, false);
        return;
      }

      // Deduct 1 ammo
      setCharacter(prev => ({
        ...prev,
        inventory: prev.inventory.map(item => {
          if (item.id === weapon.consumesAmmunitionId) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
      }));
    }

    rollDice(`Ataque (${weapon.name})`, modifier);
  };

  // Toggle Item Equipped State
  const handleToggleEquip = (itemId) => {
    setCharacter(prev => ({
      ...prev,
      inventory: prev.inventory.map(item => {
        if (item.id === itemId) {
          return { ...item, isEquipped: !item.isEquipped };
        }
        return item;
      })
    }));
  };

  // Calculate carrying capacity & Variant Encumbrance
  const getWeightLimits = () => {
    const str = character.attributes.strength;
    return {
      limitNormal: str * 5,
      limitHeavy: str * 10,
      limitMax: str * 15
    };
  };

  const getTotalWeight = () => {
    return character.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
  };

  const getEncumbranceState = () => {
    const weight = getTotalWeight();
    const limits = getWeightLimits();
    
    if (weight > limits.limitHeavy) return 'heavy';
    if (weight > limits.limitNormal) return 'normal';
    return 'none';
  };

  const getEffectiveSpeed = () => {
    const baseSpeed = 30; // standard speed
    const encState = getEncumbranceState();
    let speed = baseSpeed;

    if (encState === 'normal') speed -= 10;
    if (encState === 'heavy') speed -= 20;
    if (character.conditions.prone) speed = Math.floor(speed / 2);
    if (character.conditions.restrained) speed = 0;
    if (character.conditions.exhaustion >= 2) speed = Math.floor(speed / 2);
    if (character.conditions.exhaustion >= 5) speed = 0;

    return speed;
  };

  // Rest Functions (Descanso Curto/Longo)
  const handleShortRest = () => {
    setCharacter(prev => {
      // 1. Reset short rest abilities
      // 2. Refill pact magic slots if Warlock
      const updatedSlots = { ...prev.spells.slots };
      // Simulate Fighter second wind recovery etc.
      
      return {
        ...prev,
        spells: { ...prev.spells, slots: updatedSlots }
      };
    });
    alert('Descanso Curto finalizado! Recursos de Descanso Curto recarregados.');
    setShowRestModal(false);
  };

  const handleLongRest = () => {
    setCharacter(prev => {
      // Restore HP
      const hp = { ...prev.hp, current: prev.hp.max, deathSaves: { successes: 0, failures: 0 } };
      
      // Restore Spell Slots
      const updatedSlots = { ...prev.spells.slots };
      Object.keys(updatedSlots).forEach(key => {
        updatedSlots[key].current = updatedSlots[key].max;
      });

      // Reduce exhaustion by 1
      const exhaustion = Math.max(0, prev.conditions.exhaustion - 1);

      return {
        ...prev,
        hp,
        spells: { ...prev.spells, slots: updatedSlots },
        conditions: { ...prev.conditions, exhaustion }
      };
    });
    alert('Descanso Longo finalizado! HP e Espaços de Magia restaurados ao máximo.');
    setShowRestModal(false);
  };

  // Condition toggles
  const handleConditionToggle = (cond) => {
    setCharacter(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [cond]: !prev.conditions[cond] }
    }));
  };

  const handleExhaustionChange = (val) => {
    setCharacter(prev => ({
      ...prev,
      conditions: { ...prev.conditions, exhaustion: Math.min(6, Math.max(0, prev.conditions.exhaustion + val)) }
    }));
  };

  // Helpers
  const getAbilityMod = (val) => Math.floor((val - 10) / 2);

  const totalWeight = getTotalWeight();
  const limits = getWeightLimits();
  const encState = getEncumbranceState();

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 font-garamond text-grimorio-bg">
      
      {/* CONCENTRATION ALERT MODAL */}
      {showConcentrationAlert && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-grimorio-panel border-2 border-grimorio-blood p-6 rounded max-w-md w-full text-grimorio-parchment-light text-center shadow-blood-glow">
            <AlertTriangle className="w-12 h-12 text-grimorio-blood mx-auto mb-4 animate-bounce" />
            <h3 className="font-cinzel text-xl text-grimorio-blood mb-2 uppercase">Concentração em Perigo!</h3>
            <p className="text-sm mb-6 leading-relaxed">
              Você recebeu <strong>{pendingDamage} de dano</strong> enquanto se concentrava em <strong>{character.concentration.spellName}</strong>. 
              Você precisa realizar uma Salvaguarda de Constituição <strong>CD {Math.max(10, Math.floor(pendingDamage / 2))}</strong>.
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleConcentrationSave}
                className="rune-button bg-grimorio-blood hover:bg-red-700 text-white border-red-500"
              >
                Rolar Salvaguarda
              </button>
              <button 
                onClick={() => {
                  alert('Concentração desfeita.');
                  setCharacter(prev => ({ ...prev, concentration: { isConcentrating: false, spellId: null, spellName: null } }));
                  setShowConcentrationAlert(false);
                }}
                className="rune-button bg-grimorio-parchment-dark/30 border-grimorio-gold-dark/40 text-grimorio-parchment-light"
              >
                Falhar Automaticamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REST MANAGER MODAL */}
      {showRestModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="parchment-paper p-6 md:p-8 rounded max-w-md w-full text-center">
            <h3 className="font-cinzel text-2xl text-grimorio-gold-dark mb-4 border-b border-grimorio-gold-dark/20 pb-2">Gerenciador de Descanso</h3>
            <p className="text-sm mb-6 text-grimorio-panel/85">
              Escolha que tipo de repouso seu herói fará nas tavernas ou fogueiras da estrada.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleShortRest}
                className="rune-button flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
              >
                <Coffee className="w-4 h-4" />
                Descanso Curto (1 Hora)
              </button>
              <button 
                onClick={handleLongRest}
                className="rune-button flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
              >
                <Sunrise className="w-4 h-4" />
                Descanso Longo (8 Horas)
              </button>
              <button 
                onClick={() => setShowRestModal(false)}
                className="rune-button mt-4 bg-grimorio-panel text-grimorio-parchment-light"
                style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION (12 Columns) */}
      <header className="col-span-12 parchment-paper p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={character.meta.portraitUrl} 
            alt={character.meta.name} 
            className="w-16 h-16 rounded-full border-2 border-grimorio-gold-dark/60 object-cover bg-grimorio-bg" 
          />
          <div>
            <h2 className="font-cinzel text-2xl text-grimorio-gold-dark leading-tight">{character.meta.name}</h2>
            <p className="text-xs font-cinzel text-grimorio-panel/70 uppercase tracking-widest">
              Nível {character.meta.level} • {character.meta.race} ({character.meta.subrace || 'Sem Subraça'}) • {character.meta.class}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowRestModal(true)}
            className="rune-button text-xs flex items-center gap-1.5"
            style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
          >
            <Coffee className="w-3.5 h-3.5" />
            Descansar
          </button>
          <button 
            onClick={onBack} 
            className="rune-button text-xs"
            style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
          >
            Sair da Ficha
          </button>
        </div>
      </header>

      {/* LEFT SIDEBAR: ATTRIBUTES & SKILLS (3 Columns) */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-6">
        {/* Attributes Grid */}
        <div className="parchment-paper p-4">
          <h3 className="font-cinzel text-sm text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-3 text-center uppercase tracking-wider">Atributos</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(character.attributes).filter(k => k !== 'tashaCustomization').map(attr => {
              const val = character.attributes[attr];
              const mod = getAbilityMod(val);
              return (
                <div 
                  key={attr} 
                  onClick={() => rollDice(attr.toUpperCase(), mod, false, true)}
                  className="bg-[#fffdf8] border border-grimorio-gold-dark/30 hover:border-grimorio-gold p-2 rounded text-center cursor-pointer die-clickable flex flex-col items-center justify-between"
                >
                  <span className="text-[10px] font-cinzel text-grimorio-gold-dark font-bold uppercase">{attr}</span>
                  <span className="font-medieval text-xl my-1">{val}</span>
                  <span className="text-xs font-bold bg-grimorio-gold-dark/10 px-2 py-0.5 rounded text-grimorio-panel">
                    {mod >= 0 ? `+${mod}` : mod}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skills list */}
        <div className="parchment-paper p-4 max-h-[300px] overflow-y-auto">
          <h3 className="font-cinzel text-sm text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-3 text-center uppercase tracking-wider">Perícias</h3>
          <ul className="space-y-1.5 text-xs">
            {Object.keys(character.skills).map(skillName => {
              const skill = character.skills[skillName];
              const profBonus = 2; // Level 1
              const mod = skill.proficient ? profBonus : 0;
              return (
                <li 
                  key={skillName}
                  onClick={() => rollDice(skillName.toUpperCase(), mod, false, true)}
                  className="flex items-center justify-between p-1 hover:bg-[#fff9ea] rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${skill.proficient ? 'bg-grimorio-gold' : 'border border-grimorio-gold-dark/45'}`} />
                    <span className="capitalize">{skillName}</span>
                  </div>
                  <span className="font-bold">{mod >= 0 ? `+${mod}` : mod}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* CENTER: COMBAT PANE (6 Columns) */}
      <div className="col-span-12 md:col-span-8 lg:col-span-6 space-y-6">
        
        {/* Core Stats Pane */}
        <div className="parchment-paper p-4 md:p-6 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center justify-center border-r border-grimorio-gold-dark/15">
            <Shield className="w-6 h-6 text-grimorio-gold-dark mb-1" />
            <span className="text-[10px] font-cinzel text-grimorio-gold-dark uppercase font-bold">Armadura</span>
            <span className="font-medieval text-2xl">18</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-grimorio-gold-dark/15">
            <Flame className="w-6 h-6 text-grimorio-gold-dark mb-1" />
            <span className="text-[10px] font-cinzel text-grimorio-gold-dark uppercase font-bold">Iniciativa</span>
            <span className="font-medieval text-2xl">+2</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Award className="w-6 h-6 text-grimorio-gold-dark mb-1" />
            <span className="text-[10px] font-cinzel text-grimorio-gold-dark uppercase font-bold">Velocidade</span>
            <span className="font-medieval text-2xl">{getEffectiveSpeed()} ft</span>
          </div>
        </div>

        {/* HP Tracker */}
        <div className="parchment-paper p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-grimorio-blood" />
              <h3 className="font-cinzel text-sm text-grimorio-gold-dark uppercase font-bold">Pontos de Vida</h3>
            </div>
            <div className="text-xs font-cinzel text-grimorio-gold-dark">
              Temp: <span className="font-bold">{character.hp.temporary}</span> | Max: <span className="font-bold">{character.hp.max}</span>
            </div>
          </div>

          {/* HP Bar */}
          <div className="w-full bg-[#110e0c]/30 rounded-full h-4 border border-grimorio-gold-dark/30 mb-6 overflow-hidden relative">
            <div 
              className="bg-grimorio-blood h-full transition-all duration-300"
              style={{ width: `${(character.hp.current / character.hp.max) * 100}%` }}
            />
            {character.hp.temporary > 0 && (
              <div 
                className="bg-blue-500/40 h-full absolute top-0 right-0 transition-all duration-300"
                style={{ width: `${(character.hp.temporary / character.hp.max) * 100}%` }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-cinzel text-white">
              {character.hp.current} / {character.hp.max}
            </div>
          </div>

          {/* HP actions */}
          <div className="flex gap-4">
            <div className="flex-1 flex gap-2">
              <input 
                type="number" 
                placeholder="Dano" 
                value={damageInput}
                onChange={(e) => setDamageInput(e.target.value)}
                className="grimorio-input w-full text-center text-xs" 
              />
              <button 
                onClick={() => handleModifyHP('damage')}
                className="rune-button text-xs py-1.5"
                style={{ backgroundColor: '#9e2a2b', borderColor: '#8b0000', color: 'white' }}
              >
                Dano
              </button>
            </div>
            
            <div className="flex-1 flex gap-2">
              <input 
                type="number" 
                placeholder="Cura" 
                value={healInput}
                onChange={(e) => setHealInput(e.target.value)}
                className="grimorio-input w-full text-center text-xs" 
              />
              <button 
                onClick={() => handleModifyHP('heal')}
                className="rune-button text-xs py-1.5"
                style={{ backgroundColor: '#2d6a4f', borderColor: '#1b4332', color: 'white' }}
              >
                Cura
              </button>
            </div>
          </div>
        </div>

        {/* Weapons and Attacks */}
        <div className="parchment-paper p-6">
          <h3 className="font-cinzel text-sm text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-4 uppercase tracking-wider">Ataques & Armas</h3>
          <div className="space-y-3">
            <div className="border border-grimorio-gold-dark/20 p-3 rounded flex items-center justify-between bg-[#fffcf5]/50">
              <div>
                <h4 className="font-cinzel text-sm font-bold">Espada Curta</h4>
                <p className="text-[10px] font-garamond text-grimorio-panel/75">Dano: 1d6 + DEX (Perfurante) • Finesse</p>
              </div>
              <button 
                onClick={() => handleWeaponAttack({ name: 'Espada Curta', properties: ['Finesse'] })}
                className="rune-button text-[10px] py-1 px-3"
                style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
              >
                Ataque
              </button>
            </div>

            <div className="border border-grimorio-gold-dark/20 p-3 rounded flex items-center justify-between bg-[#fffcf5]/50">
              <div>
                <h4 className="font-cinzel text-sm font-bold">Arco Longo</h4>
                <p className="text-[10px] font-garamond text-grimorio-panel/75">
                  Dano: 1d8 + DEX (Perfurante) • Munição (Flechas: {character.inventory.find(i => i.name === 'Flechas')?.quantity || 0})
                </p>
              </div>
              <button 
                onClick={() => handleWeaponAttack({ name: 'Arco Longo', consumesAmmunitionId: 'inv_ammo_arrow' })}
                className="rune-button text-[10px] py-1 px-3"
                style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
              >
                Atirar
              </button>
            </div>
          </div>
        </div>

        {/* Active Conditions and Exhaustion */}
        <div className="parchment-paper p-6">
          <h3 className="font-cinzel text-sm text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-4 uppercase tracking-wider">Condições Ativas</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {['poisoned', 'restrained', 'blinded', 'prone'].map(cond => {
              const isAct = character.conditions[cond];
              return (
                <button
                  key={cond}
                  onClick={() => handleConditionToggle(cond)}
                  className={`px-2.5 py-1 border rounded text-[10px] font-cinzel transition-all uppercase ${isAct ? 'bg-grimorio-blood text-white border-grimorio-blood shadow-rune-glow' : 'bg-[#fffcf5]/40 border-grimorio-gold-dark/30 text-grimorio-panel/70'}`}
                >
                  {cond === 'poisoned' ? 'Envenenado' : cond === 'restrained' ? 'Impedido' : cond === 'blinded' ? 'Cego' : 'Caído'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs border-t border-grimorio-gold-dark/15 pt-3">
            <span className="font-cinzel text-grimorio-gold-dark">Nível de Exaustão: <strong>{character.conditions.exhaustion}</strong></span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => handleExhaustionChange(-1)} 
                className="w-5 h-5 rounded border border-grimorio-gold-dark flex items-center justify-center text-xs font-bold bg-[#fff5df]"
              >
                -
              </button>
              <button 
                onClick={() => handleExhaustionChange(1)} 
                className="w-5 h-5 rounded border border-grimorio-gold-dark flex items-center justify-center text-xs font-bold bg-[#fff5df]"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: SPELLS, INVENTORY, LOGS (3 Columns) */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        
        {/* Concentration Monitor */}
        <div className="parchment-paper p-4">
          <h3 className="font-cinzel text-xs text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-3 uppercase tracking-wider">Monitor de Concentração</h3>
          {character.concentration.isConcentrating ? (
            <div className="bg-grimorio-gold/15 border border-grimorio-gold/40 p-2.5 rounded text-center flex flex-col items-center">
              <Sparkles className="w-4 h-4 text-grimorio-gold animate-pulse mb-1" />
              <span className="text-[10px] font-cinzel text-grimorio-gold uppercase font-bold">Ativa em:</span>
              <span className="text-xs font-bold italic mt-0.5 text-grimorio-panel">{character.concentration.spellName}</span>
              <button 
                onClick={handleToggleConcentration}
                className="text-[10px] text-grimorio-blood underline mt-2 hover:text-red-700 transition-colors"
              >
                Quebrar Concentração
              </button>
            </div>
          ) : (
            <div className="text-xs italic text-grimorio-panel/60 text-center py-2">
              Nenhuma magia ativa concentrada.
            </div>
          )}
        </div>

        {/* Spells List */}
        {character.spells.spellcastingAbility !== 'none' && (
          <div className="parchment-paper p-4">
            <h3 className="font-cinzel text-xs text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-3 uppercase tracking-wider">Tomo de Magias</h3>
            
            {/* Spell slots */}
            <div className="flex justify-between items-center text-xs mb-3 font-cinzel border-b border-grimorio-gold-dark/10 pb-1.5">
              <span>Espaços Nível 1:</span>
              <span className="font-bold text-grimorio-gold-dark">
                {character.spells.slots.level_1?.current} / {character.spells.slots.level_1?.max}
              </span>
            </div>

            <ul className="space-y-2 text-xs">
              {character.spells.list.map(spell => (
                <li key={spell.id} className="border border-grimorio-gold-dark/15 p-2 rounded bg-[#fffdf8]/60 flex items-center justify-between">
                  <div>
                    <h5 className="font-cinzel text-[11px] font-bold">{spell.name}</h5>
                    <p className="text-[9px] text-grimorio-panel/70">Nível {spell.level} {spell.concentration ? '• Conc' : ''}</p>
                  </div>
                  <button 
                    onClick={() => handleCastSpell(spell)}
                    className="rune-button text-[9px] py-0.5 px-2"
                    style={{ backgroundColor: '#1c140e', color: '#f2e6cf' }}
                  >
                    Cast
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Inventory Visual & Weight */}
        <div className="parchment-paper p-4">
          <h3 className="font-cinzel text-xs text-grimorio-gold-dark border-b border-grimorio-gold-dark/20 pb-1.5 mb-3 uppercase tracking-wider">Inventário & Carga</h3>
          
          <ul className="space-y-1.5 text-xs max-h-[150px] overflow-y-auto mb-4 border-b border-grimorio-gold-dark/10 pb-2">
            {character.inventory.map(item => (
              <li key={item.id} className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={item.isEquipped} 
                    onChange={() => handleToggleEquip(item.id)}
                    className="accent-grimorio-gold"
                  />
                  <span className={item.isEquipped ? 'font-bold' : ''}>{item.name} (x{item.quantity})</span>
                </label>
                <span className="text-[10px] text-grimorio-panel/70">{(item.weight * item.quantity).toFixed(1)} lbs</span>
              </li>
            ))}
            {/* Adding fake ammunition display for ammo tracker demonstration */}
            <li className="flex items-center justify-between text-grimorio-gold-dark/80 italic font-bold">
              <span>Flechas (Aba Ataque)</span>
              <span>19 uni</span>
            </li>
          </ul>

          {/* Encumbrance gauge */}
          <div className="text-xs">
            <div className="flex justify-between mb-1 font-cinzel">
              <span>Peso Total:</span>
              <span className="font-bold">{totalWeight.toFixed(1)} / {limits.limitMax} lbs</span>
            </div>
            
            {/* Load bar */}
            <div className="w-full bg-[#110e0c]/20 h-2 border border-grimorio-gold-dark/20 rounded-full overflow-hidden">
              <div 
                className={`h-full ${encState === 'heavy' ? 'bg-red-600' : encState === 'normal' ? 'bg-yellow-500' : 'bg-grimorio-gold-dark'}`}
                style={{ width: `${(totalWeight / limits.limitMax) * 100}%` }}
              />
            </div>
            
            {encState !== 'none' && (
              <div className="mt-2 text-[10px] text-red-700 font-cinzel text-center uppercase tracking-wide flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{encState === 'heavy' ? 'Sobrecarga Pesada (Penalidades)' : 'Sobrecarga leve (-10ft Vel)'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dice roll logs console */}
        <div className="bg-[#14100d] text-grimorio-parchment-light border border-grimorio-gold-dark/30 rounded p-4">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-grimorio-gold-dark/15 text-[10px] uppercase font-cinzel text-grimorio-gold">
            <span>Console de Rolagens</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setRollModifierMode('advantage')}
                className={`px-1 rounded ${rollModifierMode === 'advantage' ? 'bg-grimorio-gold text-grimorio-bg' : 'text-grimorio-gold-dark'}`}
              >
                Vant
              </button>
              <button 
                onClick={() => setRollModifierMode('normal')}
                className={`px-1 rounded ${rollModifierMode === 'normal' ? 'bg-grimorio-gold text-grimorio-bg' : 'text-grimorio-gold-dark'}`}
              >
                Norm
              </button>
              <button 
                onClick={() => setRollModifierMode('disadvantage')}
                className={`px-1 rounded ${rollModifierMode === 'disadvantage' ? 'bg-grimorio-gold text-grimorio-bg' : 'text-grimorio-gold-dark'}`}
              >
                Desv
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto text-[11px] font-mono leading-tight">
            {rollLog.length === 0 ? (
              <div className="italic text-grimorio-parchment-light/40 text-center py-4">Nenhum dado rolado nesta sessão.</div>
            ) : (
              rollLog.map(log => (
                <div key={log.id} className="border-b border-grimorio-gold-dark/10 pb-1 flex flex-col">
                  <div className="flex justify-between">
                    <span className="text-grimorio-gold font-bold">{log.name}</span>
                    <span className="text-white/40">{log.time}</span>
                  </div>
                  <span className="text-white/70 text-[10px]">{log.details} {log.modifier}</span>
                  <span className="text-grimorio-gold-light text-right text-xs font-bold">Total: {log.total}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
