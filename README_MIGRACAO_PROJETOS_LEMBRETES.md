# Migração: Remoção de Projetos e Lembretes

## Resumo Executivo

Este documento descreve a migração para eliminar o conceito de **Projetos** e mover todas as funcionalidades para **Clientes**. Também documenta a remoção dos **Lembretes** (que não estão funcionais).

---

## 🔎 Inventário - Descoberta

### Tabelas de Base de Dados

| Tabela | Coluna/Referência | Impacto |
|--------|-------------------|---------|
| `projetos` | Tabela completa | **DEPRECAR** - Não apagar imediatamente |
| `obrigacoes` | `projeto_id FK` | Migrar para `client_id` |
| `template_instancias` | `projeto_id FK` | Migrar para `client_id` |
| `lembretes` | Tabela completa | **REMOVER** lógica e UI |
| `alertas` | Tabela | Manter (usada por outros sistemas) |

### Ficheiros de UI a Remover/Modificar

| Ficheiro | Ação |
|----------|------|
| `src/pages/Projetos.tsx` | **REMOVER** |
| `src/pages/ProjetoDetail.tsx` | **REMOVER** |
| `src/pages/Lembretes.tsx` | **REMOVER** |
| `src/components/ProjetoForm.tsx` | **REMOVER** |
| `src/components/ProjetoCard.tsx` | **REMOVER** |
| `src/components/ProjetoProgress.tsx` | **REMOVER** |
| `src/components/LembreteForm.tsx` | **REMOVER** |
| `src/components/GenerateObrigacoesForm.tsx` | Modificar: projeto → cliente |
| `src/components/ObrigacaoForm.tsx` | Modificar: projeto → cliente |
| `src/components/Layout.tsx` | Remover nav "Projetos" e "Lembretes" |
| `src/App.tsx` | Remover rotas projetos e lembretes |

### Hooks a Remover/Modificar

| Hook | Ação |
|------|------|
| `src/hooks/useProjetosFilters.tsx` | **REMOVER** |
| `src/hooks/useLembretesFilters.tsx` | **REMOVER** |
| `src/hooks/useObrigacoesFilters.tsx` | Modificar: `projeto_id` → `client_id` |
| `src/hooks/useTarefasFilters.tsx` | Modificar: `projeto_id` → `client_id` |
| `src/hooks/useDashboardFilters.tsx` | Modificar: projetos → clientes |

### Edge Functions a Remover

| Function | Ação |
|----------|------|
| `supabase/functions/backfill-reminders/` | **REMOVER** |
| `supabase/functions/calculate-reminders/` | **REMOVER** |
| `supabase/functions/dispatch-reminders/` | **REMOVER** |

### Outros Ficheiros

| Ficheiro | Ação |
|----------|------|
| `src/lib/testSeeds.ts` | Remover seeds de projetos |
| `src/lib/demoData.ts` | Atualizar para cliente-only |
| `README_LEMBRETES.md` | Marcar como obsoleto |
| `README_LEMBRETES_CORRECOES.md` | Marcar como obsoleto |

---

## 🗃️ Plano de Migração

### Fase 1: Migração Aditiva (Segura)

1. **Adicionar `client_id` a `obrigacoes`**
   - Nova coluna: `client_id UUID REFERENCES clients(id)`
   - Índice: `(tenant_id, client_id, deadline_oficial)`
   - Preencher via `projetos.cliente_id`

2. **Adicionar `client_id` a `template_instancias`** (se necessário)
   - Nova coluna: `client_id UUID REFERENCES clients(id)`

3. **Criar work_item_links para obrigações existentes**
   - Ligação obrigação ↔ cliente via `work_item_links`

### Fase 2: Atualização de UI

1. Remover navegação para Projetos e Lembretes
2. Atualizar formulários para selecionar Cliente em vez de Projeto
3. Atualizar filtros e KPIs para usar `client_id`
4. Client 360 passa a mostrar obrigações diretamente

### Fase 3: Deprecação

1. Marcar tabela `projetos` como deprecated (feature flag)
2. Bloquear criação/edição de projetos
3. **Após 30 dias**: DROP TABLE IF EXISTS projetos

### Fase 4: Limpeza

1. Remover edge functions de lembretes
2. Remover ficheiros de UI não utilizados
3. Atualizar testes

---

## 📋 Checklist de Validação

- [ ] Obrigações aparecem em Client 360
- [ ] Dashboard filtra por cliente
- [ ] Calendário filtra por cliente
- [ ] work_item_links não aceita `external_table='projeto'`
- [ ] Navegação sem "Projetos" e "Lembretes"
- [ ] Demo Mode funciona sem projetos
- [ ] Testes smoke passam

---

## ⚠️ Rollback

Caso seja necessário reverter:

1. As colunas adicionadas podem ser ignoradas
2. A tabela `projetos` permanece intacta durante 30 dias
3. Restaurar UI via git revert

---

## Cronograma

| Fase | Descrição | Prazo |
|------|-----------|-------|
| 1 | Migração aditiva DB | Imediato |
| 2 | Atualização UI | Imediato |
| 3 | Deprecação projetos | Após validação |
| 4 | Drop projetos | +30 dias |

---

## Notas Técnicas

### Lembretes
Os lembretes automáticos foram removidos por não estarem funcionais. Futuras notificações serão implementadas via:
- Inbox/Triage (emails)
- Dashboard "My Week" (KPIs visuais)
- Alertas na app (feed existente)

### Datas das Obrigações
As 3 datas (revisão/interna/oficial) continuam funcionais e alimentam:
- Calendário
- KPIs do Dashboard
- Filtros de vencimento

---

*Documento gerado em 2025-12-27*
