import React, { useState, useEffect } from 'react';
import { Book, ShieldAlert, Sparkles, Feather, Loader2, ArrowRight } from 'lucide-react';
import CharacterCreator from './components/CharacterCreator';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('landing'); // 'landing', 'creator', 'dashboard'
  const [charactersList, setCharactersList] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch characters on load or landing view
  useEffect(() => {
    if (view === 'landing') {
      fetchCharacters();
    }
  }, [view]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        const data = await res.json();
        setCharactersList(data);
      }
    } catch (err) {
      console.error('Erro ao buscar fichas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = async (charId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/characters/${charId}`);
      if (res.ok) {
        const fullChar = await res.json();
        setSelectedCharacter(fullChar.data);
        setView('dashboard');
      } else {
        alert('Erro ao carregar ficha selecionada.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao buscar a ficha.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCharacter = async (newCharacterSheet) => {
    setLoading(true);
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharacterSheet)
      });
      if (res.ok) {
        setSelectedCharacter(newCharacterSheet);
        setView('dashboard');
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar ficha: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao salvar ficha no grimório.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCharacter = async (updatedSheet) => {
    // Sincroniza em segundo plano com o SQLite
    try {
      await fetch(`/api/characters/${updatedSheet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSheet)
      });
    } catch (err) {
      console.error('Falha ao sincronizar ficha no SQLite:', err);
    }
  };

  return (
    <div className="min-h-screen bg-grimorio-bg text-grimorio-parchment-light flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-radial-gradient from-grimorio-panel via-grimorio-bg to-black opacity-60 pointer-events-none" />
      
      {/* Top Header Ornament */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-grimorio-gold-dark/40 pb-4 z-10">
        <div className="flex items-center gap-3">
          <Book className="w-6 h-6 text-grimorio-gold" />
          <h1 className="font-cinzel text-xl uppercase tracking-widest text-grimorio-gold">
            Grimório RPG
          </h1>
        </div>
        <span className="font-cinzel text-xs tracking-wider text-grimorio-gold-dark/70">
          D&D 5ª Edição
        </span>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-grow flex flex-col items-center justify-center py-12 z-10">
        
        {loading && (
          <div className="absolute inset-0 bg-grimorio-bg/80 flex items-center justify-center z-50">
            <div className="text-center text-grimorio-gold">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
              <p className="font-cinzel text-xs tracking-widest uppercase">Tecendo as magias do tomo...</p>
            </div>
          </div>
        )}

        {view === 'landing' && (
          <div className="text-center max-w-3xl flex flex-col items-center w-full">
            {/* Logo Emblem */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full border-2 border-grimorio-gold flex items-center justify-center bg-grimorio-panel shadow-rune-glow">
                <Sparkles className="w-10 h-10 text-grimorio-gold animate-pulse" />
              </div>
              <div className="absolute -top-1 -left-1 w-26 h-26 border border-grimorio-gold-dark/50 rounded-full animate-spin-slow pointer-events-none" style={{ animationDuration: '20s' }} />
            </div>

            <h2 className="font-cinzelDeco text-4xl md:text-5xl text-grimorio-gold mb-4 leading-tight">
              Grimório do Aventureiro
            </h2>
            <p className="font-garamond text-lg md:text-xl text-grimorio-parchment-light/80 italic mb-10 max-w-lg leading-relaxed">
              "Trace seu destino, conjure suas magias e gerencie seus atributos nas páginas deste tomo sagrado de Dungeons & Dragons."
            </p>

            {/* Menu Options */}
            <div className="flex flex-col md:flex-row gap-8 w-full items-start justify-center">
              
              {/* Box 1: Criar Personagem */}
              <div className="bg-grimorio-panel border border-grimorio-gold-dark/30 p-6 rounded text-center flex-1 w-full max-w-xs flex flex-col items-center justify-between min-h-[220px]">
                <Feather className="w-10 h-10 text-grimorio-gold mb-3" />
                <h3 className="font-cinzel text-sm text-grimorio-gold uppercase font-bold mb-2">Novo Herói</h3>
                <p className="text-xs font-garamond text-grimorio-parchment-light/60 mb-4 leading-relaxed">
                  Inicie a criação passo a passo do zero, com modificadores de Tasha e tabelas históricas do Xanathar.
                </p>
                <button 
                  onClick={() => setView('creator')}
                  className="rune-button w-full text-xs"
                >
                  Criar Ficha
                </button>
              </div>

              {/* Box 2: Fichas Salvas (SQLite backend list) */}
              <div className="bg-grimorio-panel border border-grimorio-gold-dark/30 p-6 rounded text-center flex-1 w-full max-w-xs flex flex-col justify-between min-h-[220px]">
                <Book className="w-10 h-10 text-grimorio-gold mb-3 mx-auto" />
                <h3 className="font-cinzel text-sm text-grimorio-gold uppercase font-bold mb-2">Carregar Ficha</h3>
                
                {charactersList.length === 0 ? (
                  <p className="text-xs font-garamond text-grimorio-parchment-light/60 mb-4 leading-relaxed">
                    Nenhuma ficha gravada nas runas do banco SQLite ainda.
                  </p>
                ) : (
                  <div className="max-h-[100px] overflow-y-auto space-y-1.5 mb-4 text-left">
                    {charactersList.map(char => (
                      <div 
                        key={char.id}
                        onClick={() => handleSelectCharacter(char.id)}
                        className="flex items-center justify-between p-1.5 rounded bg-[#251e19] hover:bg-grimorio-gold/20 cursor-pointer text-[11px] font-cinzel text-grimorio-parchment-light/80 border border-grimorio-gold-dark/20 transition-colors"
                      >
                        <span>{char.name} ({char.class} Lvl {char.level})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-grimorio-gold" />
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={fetchCharacters}
                  className="rune-button w-full text-[10px] bg-grimorio-bg/40 border-grimorio-gold-dark/25 text-grimorio-parchment-light/50"
                  disabled={loading}
                >
                  Atualizar Lista
                </button>
              </div>

            </div>
          </div>
        )}

        {view === 'creator' && (
          <CharacterCreator 
            onSave={handleSaveCharacter} 
            onCancel={() => setView('landing')} 
          />
        )}

        {view === 'dashboard' && (
          <Dashboard 
            character={selectedCharacter} 
            onBack={() => setView('landing')}
            onUpdate={handleUpdateCharacter}
          />
        )}
      </main>

      {/* Bottom Footer Ornament */}
      <footer className="w-full max-w-5xl border-t border-grimorio-gold-dark/40 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-grimorio-gold-dark/60 z-10 gap-2">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>PHB + Xanathar (XGtE) + Tasha (TCoE) Integrados • SQLite Sincronizado</span>
        </div>
        <span>Desenvolvido na Mesa de RPG • 2026</span>
      </footer>
    </div>
  );
}

export default App;
