# Sistema de Comprovativos

Este documento descreve o sistema de upload, armazenamento e gestão de comprovativos para obrigações fiscais.

## Características Principais

### 1. Upload de Ficheiros
- **Tipos suportados**: PDF, JPG, PNG
- **Tamanho máximo**: 10 MB
- **Armazenamento**: Bucket privado no Lovable Cloud (Supabase Storage)
- **Segurança**: Acesso apenas para o owner da obrigação via URLs assinados

### 2. Metadados Armazenados
Cada comprovativo guarda os seguintes metadados na tabela `obrigacoes`:
- `comprovativo_storage_path`: Caminho no bucket (privado)
- `comprovativo_mime`: Tipo MIME (application/pdf, image/jpeg, image/png)
- `comprovativo_size_bytes`: Tamanho em bytes (validação ≤ 10MB)
- `comprovativo_nome_original`: Nome original do ficheiro
- `comprovativo_uploaded_by`: ID do utilizador que fez upload
- `comprovativo_uploaded_at`: Data/hora do upload

### 3. Funcionalidades na UI

#### Upload
1. Clique em "Carregar ficheiro" no detalhe da obrigação
2. Selecione um ficheiro PDF, JPG ou PNG (máx 10MB)
3. Aguarde o upload (barra de progresso)
4. Confirmação com toast: "Upload concluído"

#### Preview
- **PDF**: Ícone + botão "Descarregar"
- **Imagem (JPG/PNG)**: Miniatura da imagem

#### Ações Disponíveis
- **Descarregar**: Gera URL assinado (válido por 5 minutos) e inicia download
- **Substituir**: Permite fazer upload de um novo ficheiro (sobrescreve o anterior)
- **Remover**: Apaga o comprovativo do storage e limpa metadados (requer confirmação)

### 4. Regra de Validação: "Exigir Comprovativo para Submetido"

#### Como Ativar
1. Ir a **Definições** → **Regras de Validação**
2. Ativar o toggle "Exigir comprovativo para marcar 'Submetido'"
3. Clicar em "Guardar Configurações"

#### Comportamento
Quando a regra está **ativa**:
- A transição para o estado "Submetido" requer:
  - ✅ Data de submissão preenchida
  - ✅ Comprovativo anexado
- Se faltar o comprovativo:
  - ❌ **Bloqueio da transição**
  - 📢 Mensagem de erro: "Para marcar como Submetido, tens de anexar o comprovativo e preencher a data de submissão."
  - 📝 Criação de log de auditoria: `submissao_bloqueada`

Quando a regra está **desativa**:
- Apenas a data de submissão é obrigatória
- O comprovativo é opcional

### 5. Logs de Auditoria

O sistema cria registos de log para todas as ações relacionadas com comprovativos:

| Ação | Evento | Detalhes |
|------|--------|----------|
| Upload | `upload_comprovativo` | Nome, tamanho, MIME, autor |
| Substituir | `substituir_comprovativo` | Info do anterior + novo |
| Remover | `remover_comprovativo` | Ficheiro removido |
| Bloqueio | `submissao_bloqueada` | Motivo: "Comprovativo em falta" |

Estes logs podem ser visualizados no histórico da obrigação.

### 6. Integração com Soft Delete

#### Obrigação Apagada (Soft Delete)
- O ficheiro **permanece** no storage
- O acesso através da UI é **bloqueado**
- URLs assinados só funcionam para obrigações ativas (`deleted_at IS NULL`)

#### Obrigação Restaurada
- O comprovativo **volta a aparecer** automaticamente
- Sem necessidade de ações adicionais

### 7. Segurança (RLS)

#### Bucket: `comprovativos`
- **Privado**: Sem acesso público direto
- **Políticas RLS**:
  - Upload: Apenas owner da obrigação
  - Download: Apenas owner da obrigação via URL assinado (5 min)
  - Delete: Apenas owner da obrigação

#### Validações Server-Side
- ✅ Tipo MIME permitido
- ✅ Tamanho ≤ 10MB
- ✅ Autorização (owner ou perfis elevados)
- ✅ Obrigação não apagada (`deleted_at IS NULL`)

## Cenários de Teste (QA)

### ✅ Caso 1: Upload Sucesso
- Upload PDF (4MB) → Concluir, preview (ícone), download OK, log criado

### ❌ Caso 2: Upload Ficheiro Demasiado Grande
- Upload PNG (12MB) → **Recusar** com mensagem "máx 10MB"

### ❌ Caso 3: Bloqueio de Submissão (Regra ON)
- Toggle **ON**, sem comprovativo → Tentar "Submetido" → **Bloquear** + mensagem + log

### ✅ Caso 4: Submissão Permitida (Regra ON)
- Toggle **ON**, com comprovativo + data → Tentar "Submetido" → **Permitir**

### ❌ Caso 5: Remoção + Bloqueio
- Remover comprovativo → Tentar "Submetido" com toggle ON → **Bloquear**

### ✅ Caso 6: Soft Delete + Restore
- Soft delete obrigação com comprovativo → UI não mostra
- Restaurar → Comprovativo **volta a aparecer**

### ❌ Caso 7: URL Expirado
- Download link expirado → **Recusar** → Gerar novo link ao clicar "Descarregar"

## Fluxo de Trabalho Recomendado

1. **Criar obrigação** com deadlines e projeto
2. **Preparar documentação** (reunir comprovativos)
3. **Anexar comprovativo** antes de marcar "Submetido" (se regra ativa)
4. **Preencher data de submissão**
5. **Marcar como "Submetido"** → Sistema valida e permite transição
6. **Enviar ao Senior** para revisão → Follow-up automático
7. **Aprovar** → **Concluir**

## Troubleshooting

### "Ficheiro demasiado grande"
- **Causa**: Ficheiro > 10MB
- **Solução**: Comprimir o ficheiro ou dividir em partes

### "Tipo de ficheiro não suportado"
- **Causa**: MIME type não permitido
- **Solução**: Converter para PDF, JPG ou PNG

### "Para marcar como Submetido, tens de anexar o comprovativo..."
- **Causa**: Regra "Exigir comprovativo" ativa + sem ficheiro anexado
- **Solução**: 
  1. Anexar comprovativo primeiro, OU
  2. Desativar a regra em Definições (se apropriado)

### "Erro ao descarregar"
- **Causa**: URL assinado expirado (5 min)
- **Solução**: Clicar novamente em "Descarregar" para gerar novo link

## Estrutura de Dados

```sql
-- Metadados na tabela obrigacoes
comprovativo_storage_path TEXT        -- ex: "user-id/obrigacao-id/file.pdf"
comprovativo_mime TEXT                -- ex: "application/pdf"
comprovativo_size_bytes INTEGER       -- ex: 4194304 (4MB)
comprovativo_nome_original TEXT       -- ex: "Declaração IVA T1 2024.pdf"
comprovativo_uploaded_by UUID         -- ex: "uuid-do-user"
comprovativo_uploaded_at TIMESTAMPTZ  -- ex: "2024-01-15 14:30:00+00"

-- Preferência por utilizador na tabela profiles
exigir_comprovativo_para_submetido BOOLEAN DEFAULT false
```

## Edge Functions

### `manage-comprovativo`
**Endpoint**: `POST /manage-comprovativo`

**Operações**:
- `generate-upload-url`: Gera URL PUT pré-assinado para upload
- `finalize-upload`: Regista metadados após upload bem-sucedido
- `get-download-url`: Gera URL GET assinado (5 min)
- `remove`: Apaga ficheiro do storage e limpa metadados

**Exemplo de chamada (upload)**:
```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/manage-comprovativo`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    operation: 'generate-upload-url',
    obrigacaoId: 'uuid-da-obrigacao',
    fileName: 'comprovativo.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024000
  })
});
```

## Próximas Melhorias (Roadmap)

- [ ] Suporte para múltiplos comprovativos por obrigação
- [ ] Preview inline de PDFs (viewer embebido)
- [ ] Compressão automática de imagens grandes
- [ ] Notificações quando comprovativo está em falta
- [ ] Template de e-mail com link direto ao comprovativo
- [ ] Assinatura digital de comprovativos
- [ ] Versionamento de ficheiros substituídos
- [ ] OCR para extração automática de dados

---

**Última atualização**: 2024-01-15  
**Versão**: 1.0
