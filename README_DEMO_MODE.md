# Demo Mode

## Descrição

O Demo Mode permite testar a aplicação sem necessidade de OAuth real ou ligação a contas Gmail externas. Quando activado, a aplicação carrega dados fictícios que simulam um ambiente de produção completo.

## Activação

Para activar o Demo Mode, adicione a seguinte variável de ambiente no ficheiro `.env`:

```env
VITE_SEED_ENABLED=true
```

Para desactivar, remova a linha ou defina:

```env
VITE_SEED_ENABLED=false
```

## Dados Fictícios Incluídos

Quando o Demo Mode está activo, são criados automaticamente:

### Cliente Demo
- **Empresa Exemplo Lda** - Cliente fictício com NIF, email e morada de exemplo

### Contactos
- Maria Santos (Directora Financeira) - Contacto principal
- João Ferreira (Contabilista)

### Threads de Email (Inbox)
1. **IVA do 4º Trimestre** - Thread com prioridade alta, 3 mensagens, anexos
2. **Modelo 22 - Confirmação de valores** - Thread normal, 2 mensagens
3. **Reunião de fecho de contas** - Thread em pausa (snoozed)

### Tarefas
- 2 tarefas atrasadas
- 1 tarefa que vence hoje
- 2 tarefas nos próximos 7 dias

### Obrigações Fiscais
- IVA 4º Trimestre 2024
- IES 2023

### Documentos
- Contrato 2024
- Comprovativo IVA 3T 2024

### Activity Log
- Entradas de criação, recepção de emails, ligações e actualizações de estado

## Funcionalidades Simuladas

Em Demo Mode, as seguintes acções funcionam **localmente** (não persistem no servidor):

### Inbox
- ✅ Ver lista de threads
- ✅ Filtrar por estado (abertas, em pausa, fechadas)
- ✅ Filtrar por prioridade
- ✅ Pesquisar por assunto
- ✅ Marcar como lida
- ✅ Adiar (snooze)
- ✅ Fechar/Reabrir

### Thread Detail
- ✅ Ver mensagens
- ✅ Ver anexos (simulados)
- ⚠️ Responder/Encaminhar (apenas simula, não envia)
- ✅ Criar tarefa a partir do email

### Dashboard
- ✅ KPIs calculados com dados demo
- ✅ My Week com tarefas demo
- ✅ Marcar tarefas como concluídas
- ✅ Adiar tarefas

### Client 360
- ✅ Ver detalhes do cliente demo
- ✅ Ver contactos
- ✅ Ver obrigações associadas
- ✅ Ver timeline de actividade

## Limitações

1. **Sem persistência real** - As alterações feitas em Demo Mode são armazenadas apenas em memória e perdem-se ao recarregar a página.

2. **Sem envio de emails** - As acções de Responder e Encaminhar são simuladas e não enviam emails reais.

3. **Sem sincronização Gmail** - A funcionalidade de sync com Gmail está desactivada.

4. **Dados estáticos** - Os dados demo são reiniciados a cada refresh da página.

## Uso para Desenvolvimento

O Demo Mode é útil para:

- Desenvolvimento de UI sem necessidade de OAuth configurado
- Testes manuais de fluxos de utilização
- Demonstrações a stakeholders
- Debugging de componentes visuais

## Reset de Dados

Para reiniciar os dados demo ao estado original, basta recarregar a página (F5).

---

**Nota:** Em ambiente de produção, certifique-se de que `VITE_SEED_ENABLED` está definido como `false` ou não existe.
