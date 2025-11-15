# Sistema de Lembretes Automáticos

## Visão Geral

Motor de lembretes que envia notificações por email e regista alertas no feed da aplicação.

## Regras Suportadas

### 1. Antes de Deadline Interna
```
"3d antes de deadline_interna"
"5 dias antes de deadline interna"
```

### 2. Antes de Deadline Oficial
```
"5d antes de deadline_oficial"
"7 dias antes de deadline oficial"
```

### 3. Follow-up Senior
```
"48h após envio_senior sem feedback"
"72 horas após envio senior"
```

## Configuração

### Defaults (Definições)
- **Deadline Interna**: dias antes (default: 3)
- **Deadline Oficial**: dias antes (default: 5)
- **Follow-up Senior**: horas após envio (default: 48)

### Janela de Silêncio
- Período opcional onde lembretes não são disparados
- Exemplo: 20:00-08:00
- Timezone: Europe/Lisbon
- Lembretes agendados durante silêncio são reagendados para o fim do período

## Funcionamento

### Cálculo (Edge Function: calculate-reminders)
- Corre periodicamente (recomendado: cada 15 min)
- Interpreta regras e calcula `proximo_disparo_em`
- Aplica janela de silêncio
- Desativa lembretes de obrigações apagadas

### Disparo (Edge Function: dispatch-reminders)
- Corre periodicamente (recomendado: cada 5 min)
- Envia emails/push (máx 50 por execução)
- Regista no feed de Alertas
- Lembretes "antes de" são one-shot (desativam após disparo)
- Follow-ups podem ser recorrentes (configurável)

## Integração com Obrigações

### Enviar ao Senior
- Preenche `data_envio_senior`
- Cria lembrete follow-up automático (48h default)

### Aprovar pelo Senior
- Preenche `data_feedback_senior`
- Desativa lembretes follow-up pendentes

### Alterar Deadlines
- Recalcula `proximo_disparo_em` de lembretes ativos

## Página Alertas

Feed de notificações com:
- Ordenação cronológica (desc)
- Badge de não vistos
- Filtros: visto/não visto
- Click para ver detalhes da obrigação
- Marcar como visto/não visto

## Teste

1. Em Definições, configurar defaults
2. Clicar "Enviar Teste" → verifica feed Alertas
3. Criar obrigação com deadlines futuros
4. Aguardar disparo dos lembretes

## Troubleshooting

- **Lembretes não disparam**: Verificar se edge functions estão a correr (logs)
- **Disparo durante silêncio**: Confirmar TZ Europe/Lisbon e horários configurados
- **Duplicação**: Sistema usa throttle (max 50/exec) e marca `ultimo_disparo_em`
