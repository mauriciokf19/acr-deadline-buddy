# Integração Gmail - MVP Google-Only

Este documento descreve como configurar e utilizar a integração Gmail neste projeto.

## 📋 Índice

- [Requisitos](#requisitos)
- [Configuração do Google Cloud](#configuração-do-google-cloud)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Testar](#como-testar)
- [Resolução de Problemas](#resolução-de-problemas)
- [Nota sobre Outlook/Nylas](#nota-sobre-outlooknylas)

---

## Requisitos

- Conta Google Cloud Platform
- Projeto GCP com a API Gmail ativada
- Credenciais OAuth 2.0 configuradas

---

## Configuração do Google Cloud

### 1. Criar projeto no Google Cloud Console

1. Acede a [console.cloud.google.com](https://console.cloud.google.com)
2. Clica em **Selecionar projeto** → **Novo projeto**
3. Dá um nome ao projeto e clica em **Criar**

### 2. Ativar a API Gmail

1. Vai a **APIs e Serviços** → **Biblioteca**
2. Pesquisa por "Gmail API"
3. Clica em **Gmail API** e depois em **Ativar**

### 3. Configurar ecrã de consentimento OAuth

1. Vai a **APIs e Serviços** → **Ecrã de consentimento OAuth**
2. Escolhe **Externo** (ou **Interno** se for apenas para uso empresarial)
3. Preenche:
   - **Nome da aplicação**: Nome do teu projeto
   - **E-mail de suporte**: O teu e-mail
   - **Domínios autorizados**: O domínio do teu frontend
4. Em **Scopes**, adiciona:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
5. Adiciona utilizadores de teste (enquanto estiver em modo de teste)

### 4. Criar credenciais OAuth 2.0

1. Vai a **APIs e Serviços** → **Credenciais**
2. Clica em **Criar credenciais** → **ID de cliente OAuth**
3. Tipo de aplicação: **Aplicação Web**
4. Nome: Nome descritivo (ex: "Gmail Integration")
5. **URIs de redirecionamento autorizados**:
   - Desenvolvimento: `http://localhost:5173/definicoes/integracoes`
   - Produção: `https://teu-dominio.com/definicoes/integracoes`
6. Clica em **Criar**
7. Guarda o **Client ID** e **Client Secret**

---

## Variáveis de Ambiente

### Gerar OAUTH_ENCRYPTION_KEY

Esta chave é usada para encriptar os tokens OAuth armazenados na base de dados.

**macOS / Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

### Configurar no Lovable Cloud

No painel de administração do Lovable Cloud, adiciona os seguintes secrets:

| Secret | Descrição |
|--------|-----------|
| `GOOGLE_CLIENT_ID` | Client ID OAuth do Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth do Google Cloud |
| `OAUTH_ENCRYPTION_KEY` | Chave de 32 bytes em base64 (gerada acima) |

### Exemplo .env (apenas para referência local)

```env
# Google OAuth (obrigatório)
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
OAUTH_ENCRYPTION_KEY=your-32-byte-base64-key

# Configuração de sync (opcional, valores por omissão)
TIMEZONE=Europe/Lisbon
EMAIL_SYNC_LOOKBACK_DAYS=30
CRON_SYNC_INTERVAL_MINUTES=5
EMAIL_MAX_ATTACHMENT_MB=15
```

---

## Como Testar

### Fluxo de teste completo:

1. **Conectar Gmail**
   - Vai a **Definições** → **Integrações**
   - Clica em **Conectar Gmail**
   - Autoriza o acesso no ecrã do Google
   - Verifica que a conta aparece como "Conectada"

2. **Verificar Inbox**
   - Vai a **Inbox**
   - Verifica que os e-mails dos últimos 30 dias aparecem
   - Clica num thread para ver os detalhes

3. **Criar Tarefa a partir de E-mail**
   - Abre um thread de e-mail
   - Clica em **Transformar e-mail em tarefa**
   - Preenche os detalhes e guarda
   - Verifica que a tarefa aparece em **Tarefas**

4. **Associar a Cliente**
   - Abre um thread de e-mail
   - Clica em **Associar a Cliente**
   - Escolhe um cliente
   - Verifica que aparece no **Client 360** do cliente

5. **Responder / Encaminhar**
   - Abre um thread
   - Usa **Responder** (R) ou **Encaminhar** (F)
   - Escreve a mensagem e envia
   - Verifica que a mensagem aparece no thread

6. **Verificar Healthcheck**
   - Em **Integrações**, verifica o "Estado do Sistema"
   - Deve mostrar `status: ok` e `provider: gmail`

---

## Resolução de Problemas

### `redirect_uri_mismatch`

**Causa:** O URI de redirecionamento no Google Cloud não corresponde ao usado pela aplicação.

**Solução:**
1. Vai às credenciais OAuth no Google Cloud Console
2. Verifica os **URIs de redirecionamento autorizados**
3. Adiciona exatamente: `https://teu-dominio.com/definicoes/integracoes`
4. Inclui também `http://localhost:5173/definicoes/integracoes` para desenvolvimento

### `invalid_client`

**Causa:** Client ID ou Client Secret incorretos.

**Solução:**
1. Verifica os secrets no Lovable Cloud
2. Confirma que copiaste os valores corretos do Google Cloud Console
3. Regenera as credenciais se necessário

### Sem threads no Inbox

**Causa:** Lookback period muito curto ou conta sem e-mails recentes.

**Solução:**
1. Verifica se a conta tem e-mails nos últimos 30 dias
2. Aumenta `EMAIL_SYNC_LOOKBACK_DAYS` se necessário
3. Clica em **Sincronizar agora** nas Integrações

### Erro de consentimento

**Causa:** Aplicação ainda em modo de teste e utilizador não está na lista de testers.

**Solução:**
1. Vai ao ecrã de consentimento OAuth no Google Cloud
2. Adiciona o e-mail do utilizador como "Utilizador de teste"
3. Ou publica a aplicação (requer verificação do Google)

### Tokens expirados

**Causa:** Refresh token inválido ou revogado.

**Solução:**
1. Desconecta a conta nas Integrações
2. Reconecta (vai pedir nova autorização)

---

## Nota sobre Outlook/Nylas

### Estado atual (MVP)

A integração Microsoft Outlook / Office 365 e Nylas **está desativada** neste MVP. Apenas Gmail é suportado.

### Reativar no futuro

Para adicionar suporte a Outlook/Microsoft:

1. Criar Azure App Registration com permissões:
   - `Mail.Read`
   - `Mail.Send`
   - `offline_access`

2. Adicionar variáveis:
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_TENANT_ID`

3. Implementar `OutlookProvider` seguindo o padrão do `GmailProvider`

4. Atualizar UI em `Integracoes.tsx` para mostrar opção Outlook

5. Adicionar edge function `microsoft-oauth` similar à `google-oauth`

---

## Atalhos de Teclado (InboxThread)

| Tecla | Ação |
|-------|------|
| `R` | Responder |
| `F` | Encaminhar |
| `T` | Transformar e-mail em tarefa |
| `A` | Associar a cliente |
| `S` | Snooze (adormecer) |
| `Ctrl+Enter` | Enviar comentário |

---

## Suporte

Para questões ou problemas, consulta a documentação ou contacta a equipa de suporte.
