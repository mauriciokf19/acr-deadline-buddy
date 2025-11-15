# Correções e Diagnóstico de Lembretes

## Parser PT Robusto

O sistema aceita as seguintes regras em português:

### Deadline Interna
- `"3d antes de deadline_interna"`
- `"3 dias antes de deadline interna"`
- `"3 dias antes da deadline interna"`

### Deadline Oficial
- `"5d antes de deadline_oficial"`
- `"5 dias antes de deadline oficial"`
- `"5 dias antes da deadline oficial"`

### Follow-up Senior
- `"48h após envio_senior"`
- `"48 horas após envio ao senior sem feedback"`
- `"48 horas apos envio senior"` (sem acento)

**Características:**
- Case-insensitive
- Remove acentos automaticamente
- Tolera múltiplos espaços
- Aceita variações "d"/"dia"/"dias", "h"/"hora"/"horas"

## Timezone e Hora Padrão

### Europe/Lisbon
Todos os cálculos respeitam o fuso horário `Europe/Lisbon`.

### Hora Padrão 08:00
Para lembretes de deadlines (all-day):
- **Interna**: `deadline_interna - X dias` → **08:00** local
- **Oficial**: `deadline_oficial - X dias` → **08:00** local

### Follow-up
Para lembretes após envio:
- Mantém hora original do `data_envio_senior + X horas`

## Janela de Silêncio

Configurável em **Definições → Lembretes**, exemplo: `20:00 - 08:00`

**Comportamento:**
- Se `proximo_disparo_em` cair dentro do silêncio, reagenda para o **fim do período** (ex.: 08:00 do dia seguinte).
- Aplicado após calcular a hora-alvo.

## Disparo Imediato

**Regra:**
- Se o horário calculado for no passado **recente** (últimas 24h) e o lembrete ainda não disparou, marca para **disparo imediato**.
- Se for muito antigo (>24h), ignora e não agenda.

## Página /dev → Debug Lembretes

### Funcionalidades

1. **Filtros:**
   - Por Projeto
   - Por Obrigação

2. **Ações Globais:**
   - **Recalcular TODOS**: executa `calculate-reminders` para todos os lembretes do user
   - **Despachar TODOS**: executa `dispatch-reminders` para lembretes pendentes
   - **Criar defaults (obrigação)**: cria lembretes padrão (interna/oficial) para obrigação selecionada

3. **Tabela de Lembretes:**
   - Checkbox para seleção múltipla
   - Colunas: Regra, Canal, Estado (Ativo/Inativo), Próximo Disparo, Último Disparo
   - Formato: `dd/MM/yyyy HH:mm` (24h)

4. **Alertas Recentes:**
   - Últimos 50 alertas do user
   - Título, mensagem, canal, timestamp
   - Botão "Marcar visto"
   - Visual diferenciado (visto/não visto)

## Backfill (Definições)

**Botão:** "Criar lembretes para obrigações existentes"

**Funcionamento:**
1. Percorre todas as obrigações ativas (`deleted_at IS NULL`) do utilizador
2. Para cada obrigação, verifica se já existem lembretes
3. Cria (se não existir):
   - Lembrete de `deadline_interna` com offset dos defaults (ex.: 3d)
   - Lembrete de `deadline_oficial` com offset dos defaults (ex.: 5d)
4. Não cria follow-up (só quando marca "Enviado ao Senior")
5. Retorna resumo: "Criados X lembretes..."

## Idempotência

- Lembretes com a mesma `(entidade_id, regra)` não são duplicados.
- `ultimo_disparo_em` previne re-disparo imediato.
- Edge functions validam `deleted_at` nas entidades.

## Testes

### Cenário 1: Deadline Próxima
- **Obrigação:** `deadline_interna = 18/11` (hoje = 15/11)
- **Default:** 3 dias antes
- **Esperado:** `proximo_disparo_em = 15/11 08:00` (Europe/Lisbon)
- **Resultado:** Se já passou das 08:00, dispara imediatamente na próxima execução.

### Cenário 2: Janela de Silêncio
- **Silêncio:** 20:00 - 08:00
- **Cálculo inicial:** 22:00 do dia 15/11
- **Ajustado:** 08:00 do dia 16/11

### Cenário 3: Follow-up
- **Ação:** Marcar "Enviado ao Senior" às 10:00 do dia 15/11
- **Default:** 48h após envio
- **Esperado:** `proximo_disparo_em = 17/11 10:00`

### Cenário 4: Cancelamento Follow-up
- **Ação:** Marcar "Aprovado pelo Senior"
- **Resultado:** Lembretes follow-up pendentes são desativados (`ativo=false`, `deleted_at=now()`)

## Edge Functions

### calculate-reminders
- **Frequência recomendada:** Cada 15 min (cron)
- **Ação:** Recalcula `proximo_disparo_em` para lembretes ativos

### dispatch-reminders
- **Frequência recomendada:** Cada 5 min (cron)
- **Ação:** Dispara lembretes com `proximo_disparo_em <= now()`
- **Throttle:** Máx. 50 por execução

### backfill-reminders
- **Trigger:** Manual (botão em Definições ou /dev)
- **Ação:** Cria lembretes padrão para obrigações do user

## Próximos Passos

- [ ] Configurar cron jobs para `calculate-reminders` e `dispatch-reminders`
- [ ] Integrar provider de email (Resend ou similar)
- [ ] Testar edge cases: obrigações apagadas, fuso DST, etc.
