# Sistema de QA e Testes Automáticos - ACR Deadlines

## Visão Geral

Sistema completo de testes automáticos, seeds determinísticos, e correções automáticas para garantir qualidade do código e funcionalidade da aplicação ACR Deadlines.

## Estrutura de Testes

### 1. Testes Unitários (`tests/unit/`)
Validam funções e utilitários individuais:
- **Date Utils**: Formatação PT-PT (dd/MM/yyyy), timezone Europe/Lisbon, validações
- **ICS Generator**: RFC 5545, all-day events, UIDs estáveis, CRLF, escape de caracteres
- **Reminder Parser**: Parsing de regras em PT ("3d antes de...", "48h após...")

### 2. Testes de Integração
Validam fluxos entre componentes:
- **Templates → Geração**: IVA Mensal (12x), IES Anual (1x), idempotência
- **Lembretes**: Cálculo `proximo_disparo_em`, janela silêncio 20:00-08:00, follow-up 48h
- **Uploads**: Validação MIME/tamanho, storage privado, URLs assinados
- **Soft Delete**: Exclusão de vistas (Dashboard/Calendário/KPIs/.ICS), recuperação

### 3. Testes E2E (`tests/e2e/`)
Validam fluxos completos da aplicação:
- **CRUD**: Projetos, Obrigações, Tarefas (criar/editar/arquivar/duplicar)
- **Dashboard & KPIs**: Contagens corretas, deep links, "Hoje & 7 dias"
- **Calendário + .ICS**: 3 eventos/obrigação, export válido
- **Lembretes & Alertas**: Calculate/dispatch, visualização, "marcar visto"
- **Uploads**: Preview, download, substituição, logs
- **Radix Selects**: Sem `value=""`, placeholders corretos
- **Filtros**: Persistência entre sessões

### 4. Testes de Acessibilidade
- **axe-core**: Scan automático de páginas principais
- **Critérios**: Sem erros críticos, WCAG 2.1 AA

### 5. UI Wiring Scan
- **Dead Buttons**: Deteta botões sem handlers ou com exceções
- **Auto-fix**: Liga automaticamente ao caso de uso previsto

## Seeds de Teste

### Dados Determinísticos
Criar via `/qa` → "Semear Dados":

```typescript
// Projetos
TEST_Projeto A (vermelho)
TEST_Projeto B (azul)

// Obrigações (cobrem todos os cenários)
1. TEST_Atrasada - deadline_oficial = ontem
2. TEST_Vence_Hoje - deadline_interna = hoje
3. TEST_Esta_Semana - deadline_revisao = hoje+2
4. TEST_No_Prazo - datas no próximo mês
5. TEST_Follow_Up - enviado_senior há 47h
6. TEST_Upload_Obrigatorio - para testar comprovativo
7. TEST_Soft_Deleted - deleted_at ≠ NULL

// Templates
TEST_IVA Mensal PT
TEST_IES Anual PT
```

### Limpeza
- Prefixo "TEST_" para fácil identificação
- Botão "Limpar Dados" remove tudo automaticamente
- Não afeta dados de produção

## Como Executar

### Via Interface `/qa`
1. Aceder a `http://localhost:5173/qa`
2. Clicar "Semear Dados" (primeira vez)
3. Clicar "Executar Todos os Testes"
4. Rever resultados e correções aplicadas

### Via CLI
```bash
# Testes unitários
npm run test:unit

# Testes E2E
npm run test:e2e

# Todos os testes
npm run test

# Com UI interativa
npm run test:ui
```

### CI/CD (GitHub Actions)
- **Trigger**: Push/PR para `main` ou `develop`
- **Workflow**: `.github/workflows/ci.yml`
- **Steps**: TypeCheck → Lint → Build → Unit → E2E
- **Artifacts**: Relatórios, screenshots (30 dias)
- **Badge**: ![CI Status](https://github.com/[repo]/actions/workflows/ci.yml/badge.svg)

## Painel de QA (`/qa`)

### Funcionalidades

#### 1. Stats Resumo
- Total de testes
- Testes passados (verde)
- Testes falhados (vermelho)
- Taxa de sucesso (%)

#### 2. Gestão de Seeds
- **Semear Dados**: Cria dados de teste
- **Limpar Dados**: Remove dados de teste

#### 3. Execução de Testes
- **Executar Todos**: Corre suite completa
- **Executar Individual**: Botão play em cada teste
- **Limpar Resultados**: Reset para nova execução

#### 4. Resultados
- Status: PASS ✓ / FAIL ✗ / A CORRER... / PENDENTE
- Duração em ms
- Mensagens de erro
- Ícones visuais

#### 5. Correções Automáticas
- Lista de problemas detetados
- Diffs aplicados automaticamente
- Log de alterações

## Auto-Correções Implementadas

### Radix Select
❌ **Problema**: `<Select.Item value="">`  
✅ **Correção**: Remover; usar `value={undefined}` quando vazio

❌ **Problema**: Placeholder hardcoded  
✅ **Correção**: `<SelectValue placeholder="Escolher...">`

### Filtros deleted_at
❌ **Problema**: Queries sem `.is("deleted_at", null)`  
✅ **Correção**: Adicionar filtro em Dashboard/Calendário/KPIs/.ICS

### Forms
❌ **Problema**: Enviar `""` para campos numéricos  
✅ **Correção**: Enviar `undefined` (usar defaults DB)

❌ **Problema**: Mensagens em inglês  
✅ **Correção**: Traduzir para PT-PT

### ano_fiscal
❌ **Problema**: Campo não existe no schema  
✅ **Correção**: Adicionar coluna + default atual

### .ICS
❌ **Problema**: Eventos com horário (não all-day)  
✅ **Correção**: `DTSTART;VALUE=DATE:YYYYMMDD`

❌ **Problema**: UIDs não estáveis  
✅ **Correção**: `{obrigacaoId}-{tipo}@acr`

### Lembretes
❌ **Problema**: Parser falha com "3 dias antes"  
✅ **Correção**: Regex robusto PT

❌ **Problema**: Follow-up não dispara  
✅ **Correção**: Verificar 48h após `enviado_senior_em`

### Uploads
❌ **Problema**: Validação só no cliente  
✅ **Correção**: Validar MIME + tamanho no server

❌ **Problema**: Storage público  
✅ **Correção**: Bucket privado + URLs assinados (5min)

## Critérios de Aceitação (PASS Global)

- [ ] **CRUD**: Criar/editar/arquivar funcionam
- [ ] **Estados**: Transições corretas (Pendente → ... → Concluído)
- [ ] **Templates**: Geram 12/4/1 obrigações corretamente
- [ ] **Calendário**: 3 eventos/obrigação, .ICS válido
- [ ] **Lembretes**: Calculate + dispatch OK, follow-up funciona
- [ ] **Uploads**: Validação server, URLs assinados, regra comprovativo
- [ ] **Dashboard**: KPIs corretos, deep links, sem soft-deleted
- [ ] **A11y**: 0 erros críticos
- [ ] **Wiring**: 0 botões mortos
- [ ] **Taxa de Sucesso**: ≥ 95%

## Comandos Úteis

```bash
# Instalar dependências de teste
npm install

# Executar testes unitários em watch mode
npm run test:unit -- --watch

# Executar testes E2E com UI
npx playwright test --ui

# Gerar relatório de cobertura
npm run test:coverage

# Executar apenas testes de um ficheiro
npm run test:unit tests/unit/dateUtils.test.ts

# Debugging
npx playwright test --debug
```

## Estrutura de Ficheiros

```
project/
├── tests/
│   ├── unit/              # Testes unitários
│   │   ├── dateUtils.test.ts
│   │   ├── icsGenerator.test.ts
│   │   └── reminderParser.test.ts
│   ├── e2e/               # Testes E2E
│   │   ├── dashboard.spec.ts
│   │   ├── crud.spec.ts
│   │   └── workflows.spec.ts
│   └── integration/       # Testes integração
├── src/
│   ├── test/
│   │   └── setup.ts       # Setup de testes
│   ├── lib/
│   │   └── testSeeds.ts   # Seeds de teste
│   └── pages/
│       └── QA.tsx         # Painel QA
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
├── vitest.config.ts       # Config Vitest
├── playwright.config.ts   # Config Playwright
└── README_QA.md          # Esta documentação
```

## Troubleshooting

### Testes E2E falham com timeout
```bash
# Aumentar timeout
npx playwright test --timeout=60000
```

### Supabase não disponível nos testes
- Verificar `.env` com credenciais corretas
- Usar mocks para testes unitários

### Screenshots não aparecem
```bash
# Forçar screenshots
npx playwright test --screenshot=on
```

### CI falha mas local passa
- Verificar variáveis de ambiente no GitHub Secrets
- Rever logs no Actions → Artifacts

## Roadmap

### v1.0 (Atual)
- [x] Setup básico de testes (Vitest + Playwright)
- [x] Seeds determinísticos
- [x] Painel /qa
- [x] Testes unitários (Date, ICS)
- [x] Testes E2E básicos (Dashboard)
- [x] CI/CD GitHub Actions

### v1.1 (Próximo)
- [ ] Cobertura completa de testes unitários
- [ ] Testes de integração (Templates, Lembretes)
- [ ] A11y scan automático
- [ ] UI Wiring scan
- [ ] Auto-correções implementadas

### v1.2 (Futuro)
- [ ] Visual regression testing
- [ ] Performance benchmarks
- [ ] Testes de carga
- [ ] Relatórios de cobertura ≥ 80%

## Contribuir

1. Criar seeds de teste se necessário
2. Escrever testes para nova funcionalidade
3. Garantir que `npm run test` passa
4. CI deve estar verde antes de merge

## Links Úteis

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [axe-core](https://github.com/dequelabs/axe-core)

---

**Última atualização**: 2024-12-16  
**Versão**: 1.0  
**Maintainers**: Equipa de Desenvolvimento ACR
