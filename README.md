# Grimório D&D 5e - Character Creator & Manager

Um aplicativo full-stack para criação e gerenciamento tático de fichas de personagens de **Dungeons & Dragons 5ª Edição** com estética Dark Medieval inspirada na interface de *Baldur's Gate 3*.

---

## 📖 Funcionalidades do Grimório

### 1. Criador de Personagens Passo a Passo (BG3 Style)
- **Fluxo Linear Orientado**: Impede pular etapas antes de cumprir pré-requisitos (Raça -> Classe -> Atributos -> Antecedentes -> Magias -> Conclusão).
- **Point Buy Integrado**: Distribuição clássica de 27 pontos para atributos base.
- **Regras da Tasha (TCoE)**: Ativação opcional da redistribuição de bônus de atributos raciais (+2 e +1 livre).
- **Históricos do Xanathar (XGtE)**: Rolador interativo de acontecimentos históricos e traços de antecedentes.

### 2. Dashboard de Combate e Grimório Ativo
- **Painel de Vida Dinâmico**: Controle rápido de HP Atual, HP Temporário e círculos de *Death Saves*.
- **Motor de Rolagem d20 Automático**: Clique em perícias ou atributos para rolar d20 calculando bônus e proficiências em tempo real.
- **Histórico de Rolagens (Console)**: Histórico visível na lateral com opções de rolar com Vantagem ou Desvantagem.

### 3. Automações de Mesa Real
- **Matriz de Condições**: Efeitos ativos aplicam automaticamente penalidades nas jogadas (ex: Envenenado/Impedido força desvantagem; Impedido reduz velocidade a zero).
- **Spell Concentration Guard**: Ao perder vida concentrado em uma magia, o sistema emite um alerta interativo para rolar Salvaguarda de Constituição calculando a CD de dano correta ($\text{CD} = \max(10, \lfloor\text{Dano}/2\rfloor)$).
- **Consumo de Munição**: Armas à distância reduzem automaticamente o estoque de flechas do inventário e avisam caso a munição acabe.
- **Carga Variante**: Rastreia peso total do inventário e reduz a velocidade do personagem proporcionalmente (Penalidade leve a partir de $\text{FOR} \times 5\text{ lbs}$ e desvantagens pesadas a partir de $\text{FOR} \times 10\text{ lbs}$).

---

## 🛠️ Stack Tecnológica

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide React Icons.
- **Backend**: Node.js, Express.js.
- **Banco de Dados**: SQLite3 (armazenamento portável relacional e JSON stringificado).

---

## 🚀 Como Executar

### Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado na máquina.

### Executando o Servidor (Backend)
1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor Express:
   ```bash
   npm start
   ```
   > O servidor backend rodará na porta `5000` e criará o arquivo `database.sqlite` automaticamente.

### Executando o Painel (Frontend)
1. Abra um novo terminal na pasta raiz e navegue até o frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
   > O painel rodará em `http://localhost:3000` configurado com proxy para a API.
