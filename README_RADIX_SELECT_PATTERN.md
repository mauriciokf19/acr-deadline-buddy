# Padrão de Uso do Radix Select

## ❌ NÃO FAZER

```tsx
// ERRADO: SelectItem com value vazio
<SelectContent>
  <SelectItem value="">Sem seleção</SelectItem>
  <SelectItem value="opcao1">Opção 1</SelectItem>
</SelectContent>

// ERRADO: defaultValue com campo controlado
<Select 
  onValueChange={field.onChange}
  defaultValue={field.value}  // ❌ Não usar defaultValue
>
```

## ✅ PADRÃO CORRETO

### 1. Campos Obrigatórios com Valor Inicial

```tsx
<FormField
  control={form.control}
  name="campo"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Campo Obrigatório</FormLabel>
      <Select 
        onValueChange={field.onChange} 
        value={field.value}  // ✅ Usar value (não defaultValue)
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {/* Nunca adicionar item com value="" */}
          {options.filter(opt => opt.id).map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 2. Campos Opcionais com Botão Limpar

```tsx
<FormField
  control={form.control}
  name="campo_opcional"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Campo Opcional</FormLabel>
      <div className="flex gap-2">
        <Select 
          onValueChange={field.onChange}
          value={field.value || undefined}  // ✅ undefined quando vazio
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {/* Sem item vazio - filtrar valores falsy */}
            {options.filter(opt => opt.id).map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Botão para limpar seleção */}
        {field.value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => field.onChange(undefined)}
          >
            ✕
          </Button>
        )}
      </div>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Regras Importantes

1. **Nunca usar `<SelectItem value="">`**
   - O Radix Select não permite value vazio
   - Usar `value={undefined}` quando não há seleção

2. **Sempre usar `value` (não `defaultValue`)**
   - Com react-hook-form, sempre usar modo controlado
   - `value={field.value}` para campos obrigatórios
   - `value={field.value || undefined}` para campos opcionais

3. **Filtrar opções com valores falsy**
   ```tsx
   {options.filter(opt => opt.id).map(...)}
   ```

4. **Converter valores para string**
   ```tsx
   value={String(opt.id)}
   ```

5. **Campos opcionais: botão "Limpar"**
   - Nunca adicionar item vazio na lista
   - Implementar botão separado que chama `field.onChange(undefined)`

6. **Placeholder sempre no SelectValue**
   ```tsx
   <SelectValue placeholder="Texto do placeholder" />
   ```

## Exemplos de Forms Corrigidos

- ✅ `ProjetoForm.tsx` - cliente_id opcional com botão limpar
- ✅ `TarefaForm.tsx` - obrigacao_id opcional com botão limpar
- ✅ `ObrigacaoForm.tsx` - todos os selects com value controlado
- ✅ `LembreteForm.tsx` - selects com filtragem de valores
- ✅ `TemplateForm.tsx` - selects com value controlado
- ✅ `GenerateObrigacoesForm.tsx` - projeto_id com filtragem

## Tratamento de Erros Evitados

Este padrão resolve:
- ❌ "A <Select.Item /> must have a value prop that is not an empty string"
- ❌ Tela branca por crash do Radix Select
- ❌ Valores undefined não controlados
- ❌ Placeholder não aparecendo quando campo vazio
