# Padrão de Soft Delete

## Visão Geral

O sistema implementa **soft delete** como mecanismo padrão de remoção de dados, permitindo recuperação e auditoria completa de todas as operações de eliminação.

## Conceitos

### Soft Delete vs Hard Delete

- **Soft Delete** (Padrão): Marca registos como eliminados através da coluna `deleted_at`, mantendo os dados na base de dados. Os registos são excluídos das queries normais mas podem ser recuperados.
- **Hard Delete** (Permanente): Remove fisicamente os dados da base de dados. Operação irreversível, disponível apenas em Definições → Manutenção.

## Implementação

### Estrutura de Base de Dados

Todas as tabelas principais têm a coluna `deleted_at`:

```sql
-- Adicionada a obrigacoes, tarefas, lembretes
deleted_at TIMESTAMPTZ
```

**Índices** para otimizar queries de ativos:
```sql
CREATE INDEX idx_obrigacoes_ativas ON obrigacoes (owner_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tarefas_ativas ON tarefas (owner_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_lembretes_ativos ON lembretes (owner_id, deleted_at) WHERE deleted_at IS NULL;
```

### Queries

**SEMPRE** filtrar por `deleted_at IS NULL` em queries de listagem:

```typescript
// ✅ CORRETO
const { data } = await supabase
  .from("obrigacoes")
  .select("*")
  .is("deleted_at", null);

// ❌ INCORRETO (mostra registos apagados)
const { data } = await supabase
  .from("obrigacoes")
  .select("*");
```

### Soft Delete com Cascatas

Ao apagar uma obrigação, o sistema automaticamente:
1. Marca `obrigacoes.deleted_at = now()`
2. Arquiva todas as tarefas relacionadas (`tarefas.deleted_at = now()`)
3. Desativa e arquiva lembretes relacionados (`lembretes.ativo = false`, `deleted_at = now()`)
4. Cria logs de auditoria para cada operação

**Exemplo de uso:**

```typescript
import { softDeleteObrigacao } from "@/lib/obrigacoesService";

const result = await softDeleteObrigacao({ obrigacaoId: "..." });

if (result.success) {
  console.log(`Arquivadas: ${result.affectedTarefas} tarefas, ${result.affectedLembretes} lembretes`);
}
```

### Restauração (Undo)

O sistema permite desfazer uma eliminação durante 10 segundos através de snackbar:

```typescript
import { restoreObrigacao } from "@/lib/obrigacoesService";

const result = await restoreObrigacao({ obrigacaoId: "..." });

if (result.success) {
  console.log(`Restauradas: ${result.affectedTarefas} tarefas, ${result.affectedLembretes} lembretes`);
}
```

A restauração:
1. Remove `deleted_at` da obrigação e entidades relacionadas
2. Reativa lembretes (`ativo = true`)
3. Cria logs de auditoria

### Hard Delete

Disponível em **Definições → Manutenção → Limpeza Permanente**.

**Proteções de segurança:**
- Lista apenas obrigações já soft-deleted
- Requer confirmação: utilizador deve escrever o nome exato da obrigação
- Modal de alto risco com avisos claros
- Remove permanentemente: obrigação + todas as tarefas + todos os lembretes
- Operação irreversível

```typescript
import { hardDeleteObrigacao } from "@/lib/obrigacoesService";

const result = await hardDeleteObrigacao({ obrigacaoId: "..." });
// Remove fisicamente da BD
```

## Logs de Auditoria

Todas as operações geram logs:

| Ação | Tipo de Log | Detalhes Armazenados |
|------|------------|---------------------|
| Soft Delete | `soft_delete` | `{ cascade: { tarefas_afetadas: N, lembretes_desativados: M } }` |
| Restauração | `restore` | `{ cascade: { tarefas_restauradas: N, lembretes_reativados: M } }` |
| Hard Delete | `hard_delete` | `{ cascade: { tarefas_apagadas: N, lembretes_apagados: M } }` |

Ver logs:
```typescript
import { getLogsForEntity } from "@/lib/logUtils";

const logs = await getLogsForEntity("obrigacao", obrigacaoId);
```

## UI/UX

### Fluxo de Soft Delete

1. Utilizador clica em "Apagar" no card da obrigação
2. Modal de confirmação aparece com:
   - Explicação do soft delete
   - Info sobre cascatas (tarefas, lembretes)
   - Checkbox "Entendo e quero continuar"
3. Ao confirmar: snackbar com botão "Desfazer" (10s)
4. Obrigação desaparece imediatamente da lista (optimistic UI)

### Fluxo de Recuperação (Restore)

1. Utilizador vai a **Definições → Manutenção**
2. Vê lista de obrigações arquivadas (soft-deleted)
3. Clica "Recuperar" na obrigação desejada
4. Sistema:
   - Limpa `deleted_at` da obrigação e entidades relacionadas
   - Reativa lembretes
   - Cria logs de auditoria
5. Snackbar com opção "Desfazer" (10s):
   - Permite reverter a recuperação
   - Re-aplica soft delete se clicado
6. Obrigação volta a aparecer nas listagens normais

### Fluxo de Hard Delete

1. Utilizador vai a **Definições → Manutenção**
2. Vê lista de obrigações arquivadas (soft-deleted)
3. Clica "Apagar Definitivamente"
4. Modal de alto risco:
   - Aviso de operação irreversível
   - Campo de texto: deve escrever o nome exato
   - Botão desabilitado até confirmação correta
5. Remoção permanente após dupla confirmação

## Checklist de Implementação

Ao adicionar soft delete a uma nova entidade:

- [ ] Adicionar coluna `deleted_at TIMESTAMPTZ` via migração
- [ ] Criar índice `WHERE deleted_at IS NULL`
- [ ] Atualizar queries de listagem com `.is("deleted_at", null)`
- [ ] Implementar funções `softDelete`, `restore`, `hardDelete` no service
- [ ] Adicionar botões de editar/apagar nos cards
- [ ] Criar modal de confirmação
- [ ] Implementar snackbar com undo (10s)
- [ ] Adicionar secção em Definições para hard delete
- [ ] Criar logs de auditoria para todas as operações
- [ ] Documentar cascatas (se aplicável)

## Boas Práticas

1. **Nunca** fazer queries sem filtrar `deleted_at` em produção
2. **Sempre** usar soft delete por padrão; hard delete é excepcional
3. **Cascatas**: pensar em integridade ao apagar (ex: obrigação → tarefas)
4. **Logs**: registar tudo para auditoria e troubleshooting
5. **UI**: dar feedback claro (snackbar, confirmações)
6. **Undo**: período de 10s é suficiente mas ajustável
7. **Hard delete**: múltiplas confirmações e apenas para admin

## Troubleshooting

### Registos não aparecem depois de restaurar
- Verificar se a query tem `.is("deleted_at", null)`
- Confirmar que `restoreObrigacao` foi executado com sucesso
- Verificar logs de auditoria
- Fazer refresh do Dashboard/lista após restaurar

### Dashboard mostra obrigações apagadas
- Confirmar que todas as queries incluem `.is("deleted_at", null)`
- Verificar índices parciais (idx_obrigacoes_ativas, idx_tarefas_ativas)
- Fazer hard reload do frontend se necessário

### Cascatas não funcionam
- Confirmar que as foreign keys estão corretas
- Verificar se as queries de cascata usam `obrigacao_id`, `tarefa_id`, etc.
- Ver logs para confirmar quantos registos foram afetados

### Hard delete falha
- Confirmar que o utilizador tem permissões (RLS)
- Verificar se há constraints de foreign key bloqueando
- Ver console para erros específicos do Supabase
