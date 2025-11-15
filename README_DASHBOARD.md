# Dashboard - Visão Operacional

## Visão Geral

O Dashboard fornece uma visão operacional completa das obrigações fiscais, com KPIs, eventos próximos, progresso por projeto e ações rápidas. Todas as consultas filtram automaticamente obrigações soft-deleted (`deleted_at IS NULL`).

## Componentes Principais

### 1. KPIs (Cards no Topo)

Quatro indicadores principais com deep links para a página de Obrigações:

#### Atrasadas (Vermelho)
- **Definição**: Obrigações ativas onde `deadline_oficial < hoje` e `estado NOT IN ('concluido', 'submetido')`
- **Deep Link**: `/obrigacoes?prazo=atrasadas`
- **Ícone**: AlertCircle

#### Vencem Hoje (Laranja)
- **Definição**: Obrigações ativas com pelo menos uma das três datas igual a hoje:
  - `deadline_revisao_senior = hoje` OU
  - `deadline_interna = hoje` OU
  - `deadline_oficial = hoje`
- **Deep Link**: `/obrigacoes?prazo=hoje`
- **Ícone**: Clock

#### Esta Semana (Amarelo)
- **Definição**: Obrigações ativas com alguma das 3 datas dentro da semana ISO atual (segunda a domingo)
- **Deep Link**: `/obrigacoes?prazo=semana`
- **Ícone**: Calendar

#### No Prazo (Verde)
- **Definição**: Obrigações ativas não concluídas/submetidas com `deadline_oficial > hoje + 7 dias`
- **Deep Link**: `/obrigacoes?prazo=futuro`
- **Ícone**: CheckCircle

### 2. Hoje & Próximos 7 Dias

Lista de eventos agrupados por dia, mostrando os próximos 7 dias.

#### Expansão de Eventos
Cada obrigação ativa gera até 3 eventos (se as datas existirem):
- **Revisão** (azul): `deadline_revisao_senior`
- **Interna** (amarelo): `deadline_interna`
- **Oficial** (vermelho): `deadline_oficial`

#### Seleção e Ordenação
- Eventos onde `data_evento BETWEEN hoje AND (hoje + 7)`
- Ordenados por data ascendente
- Agrupados por dia com cabeçalho formatado: "Dia da semana, dd/MM/yyyy"

#### Informações do Card
- Badge colorido com tipo de evento
- Badge de estado (Pendente, Em Revisão, etc.)
- Título da obrigação
- Período de referência e nome do projeto
- Cor do projeto (círculo)

#### Interação
- **Tap no card**: Navega para `/obrigacoes?id={obrigacao_id}` (destaca a obrigação na lista)

### 3. Progresso por Projeto

Top 5 projetos com mais entregas esta semana.

#### Cálculo
Para cada projeto ativo:
- **Total**: Número de obrigações ativas (`deleted_at IS NULL`)
- **Concluídas**: Obrigações com `estado IN ('submetido', 'concluido')`
- **Progresso**: `(Concluídas / Total) * 100%`
- **Eventos na Semana**: Contagem de eventos (das 3 datas) que caem dentro da semana atual

#### Ordenação
- Ordenado por número de eventos na semana (descendente)
- Mostra apenas os Top 5
- Se nenhum projeto tiver eventos na semana, mostra mensagem vazia

#### Interação
- **Tap no card**: Navega para `/obrigacoes?projeto_id={projeto_id}`

### 4. FAB (Floating Action Button)

Botão flutuante no canto inferior direito com 3 ações rápidas:

#### Ações Disponíveis
1. **Novo Projeto** (Azul)
   - Ícone: FolderKanban
   - Abre ProjetoForm em Dialog

2. **Nova Obrigação** (Verde)
   - Ícone: ClipboardCheck
   - Abre ObrigacaoForm em Dialog

3. **Nova Tarefa** (Roxo)
   - Ícone: CheckSquare
   - Abre TarefaForm em Dialog

#### Comportamento
- Toque no botão principal expande/colapsa as ações
- Animação de rotação 45° quando expandido
- Ao selecionar ação, o menu colapsa e o Dialog abre
- Após sucesso, fecha o Dialog e recarrega dados

## Filtros Persistentes

### Armazenamento
Filtros salvos em `localStorage` com chave `acr-dashboard-filters`.

### Filtros Disponíveis
- **Projetos**: Array de IDs de projeto (multi-seleção)
- **Tipos**: Array de tipos de obrigação (IVA, IES, SAF-T, etc.)
- **Estados**: Array de estados (Pendente, Em Revisão, etc.)
- **Prioridades**: Array de prioridades
- **País**: Array de países

### Aplicação
Os filtros afetam:
- ✅ Cálculo de KPIs
- ✅ Lista "Hoje & Próximos 7 dias"
- ❌ Progresso por Projeto (mostra todos os projetos ativos)

### Persistência
- Carregados automaticamente ao abrir o Dashboard
- Salvos automaticamente a cada alteração
- Podem ser limpos com botão "Limpar filtros"

## Deep Links

### Estrutura de URLs

#### Da Dashboard para Obrigações
```
/obrigacoes?prazo=atrasadas
/obrigacoes?prazo=hoje
/obrigacoes?prazo=semana
/obrigacoes?prazo=futuro
/obrigacoes?projeto_id={uuid}
/obrigacoes?id={uuid}
```

#### Comportamento na Página Obrigações
- Lê query parameters na montagem
- Aplica filtros automaticamente
- Atualiza estado do hook `useObrigacoesFilters`
- Se `id` estiver presente, destaca a obrigação correspondente

## Performance e Otimizações

### Queries
- ✅ Sempre incluem `deleted_at IS NULL`
- ✅ Usam índices existentes:
  - `idx_obrigacoes_ativas`
  - `idx_obrigacoes_estado`
  - (Opcional) `idx_obrigacoes_ativas_oficial ON obrigacoes(deadline_oficial) WHERE deleted_at IS NULL`

### Carregamento
- Queries executadas em paralelo com `Promise.all()`
- Loading states independentes por seção
- Skeleton loaders durante carregamento

### Paginação
- Lista "Hoje & 7 dias": Paginada se > 200 eventos (preparado para lazy loading futuro)
- KPIs: Agregados (não paginados)
- Progresso: Limitado a Top 5

## Formato de Datas

### Timezone
- **Europe/Lisbon** para todas as datas
- Funções usadas: `dateUtils.ts` (`formatDatePT`, `fromUTC`, etc.)

### Exibição
- Datas: `dd/MM/yyyy` (ex: 15/11/2024)
- Hora (quando aplicável): `HH:mm` formato 24h
- Dia da semana: Capitalizado em português (ex: "Segunda-feira")

### Comparações
- Todas as datas são normalizadas para início do dia (`setHours(0, 0, 0, 0)`)
- Comparações usam ISO strings ou timestamps

## Cores e Legenda

### Tipos de Evento
- 🔵 **Azul** (`#3B82F6`): Revisão Sénior
- 🟡 **Amarelo** (`#EAB308`): Deadline Interna
- 🔴 **Vermelho** (`#EF4444`): Deadline Oficial

### Estados de KPI
- 🔴 **Vermelho** (`destructive`): Atrasadas
- 🟠 **Laranja** (`orange-500`): Vencem Hoje
- 🟡 **Amarelo** (`yellow-500`): Esta Semana
- 🟢 **Verde** (`green-500`): No Prazo

### Legenda
Visível no topo do Dashboard para referência rápida.

## Mobile First

### Design Responsivo
- Grid 2 colunas para KPIs
- Cards full-width com padding adequado
- Áreas de toque ≥ 44px (iOS guidelines)
- Bottom padding para evitar sobreposição com navegação

### Navegação
- FAB posicionado acima da barra de navegação inferior
- Z-index adequado (40 para FAB, 50 para bottom nav)
- Animações suaves e performáticas

## Testes de Aceitação

### Cenário 1: KPIs
- [ ] Criar obrigação com `deadline_oficial = ontem` → Deve aparecer em "Atrasadas"
- [ ] Criar obrigação com `deadline_interna = hoje` → Deve aparecer em "Vencem Hoje"
- [ ] Criar obrigação com `deadline_revisao_senior` esta semana → "Esta Semana"
- [ ] Criar obrigação com datas > 7 dias → "No Prazo"
- [ ] Soft-delete obrigação → Não deve aparecer em nenhum KPI

### Cenário 2: Eventos
- [ ] Obrigação com 3 datas nos próximos 7 dias → Mostra 3 eventos
- [ ] Eventos ordenados por data ascendente
- [ ] Cores corretas por tipo (azul/amarelo/vermelho)
- [ ] Tap abre lista de obrigações (deep link funciona)

### Cenário 3: Progresso
- [ ] Projetos ordenados por entregas na semana
- [ ] Progresso = Concluídas/Total calculado corretamente
- [ ] Se 0 eventos na semana, mostra mensagem vazia
- [ ] Tap abre lista filtrada por projeto

### Cenário 4: Deep Links
- [ ] Clicar em "Atrasadas" aplica filtro correto
- [ ] Navegação back/forward mantém filtros
- [ ] URL com projeto_id filtra corretamente
- [ ] URL com id destaca obrigação

### Cenário 5: Filtros
- [ ] Filtros aplicados persistem ao recarregar
- [ ] Filtros afetam KPIs e eventos
- [ ] Limpar filtros volta ao estado inicial
- [ ] Filtros via deep link sobrescrevem salvos

### Cenário 6: FAB
- [ ] Expandir/colapsar funciona
- [ ] Cada ação abre form correto
- [ ] Sucesso fecha dialog e recarrega
- [ ] FAB não sobrepõe navegação inferior

## Manutenção

### Adicionar Novo KPI
1. Adicionar cálculo em `loadKPIs()`
2. Adicionar prop em `DashboardKPIs`
3. Adicionar `KPICard` no render
4. Adicionar deep link handler
5. Adicionar filtro correspondente em `Obrigacoes.tsx`

### Adicionar Novo Filtro
1. Adicionar ao `DashboardFilters` interface
2. Adicionar valor padrão em `useDashboardFilters`
3. Aplicar nas queries em `loadKPIs` e `loadEventos`
4. (Opcional) Adicionar UI de filtro no Dashboard

### Modificar Cores
- Editar variáveis CSS em `index.css`
- Atualizar `tailwind.config.ts`
- Manter consistência com sistema de design

## Troubleshooting

### KPIs não atualizam
- Verificar `filters` no `useEffect` dependency array
- Confirmar `deleted_at IS NULL` em todas as queries
- Verificar timezone das datas

### Deep links não funcionam
- Confirmar `useSearchParams` importado
- Verificar `updateFilter` chamado corretamente
- Testar navegação direta via URL

### Performance lenta
- Adicionar índice: `idx_obrigacoes_ativas_oficial`
- Verificar número de obrigações (considerar paginação)
- Usar React DevTools Profiler

### Eventos duplicados
- Confirmar `key={evento.id}-${evento.tipo_evento}`
- Verificar lógica de expansão de eventos
- Confirmar datas únicas por tipo
