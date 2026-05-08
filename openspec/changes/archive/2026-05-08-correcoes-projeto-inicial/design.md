# Design: Correções do Projeto Inicial

## Decisões de Arquitetura

### D-01 — Estratégia de integração de tokens nos componentes

**Decisão:** Cada `.component.scss` importa `_tokens.scss` diretamente via `@use` e usa as
variáveis de token em vez de valores hex crus.

```scss
// padrão adotado em todos os .component.scss que tocam cores/espaços do design system
@use '../../../estilos/tokens' as *;   // (path relativo ao arquivo)

.estado-vazio {
  background: $cor-fundo-cartao;   // antes: #1e293b
  color: $cor-texto-secundario;    // antes: #94a3b8
}
```

**Alternativas consideradas:**
1. Usar classes `ff-*` globais nos templates HTML (ex: `class="ff-estado-vazio"`) — descartada
   porque quebra o modelo mental de estilos scoped por componente e exige mudança nos templates.
2. Apenas alinhar os hex sem usar tokens — descartada porque não resolve a dívida estrutural
   (próxima mudança de cor voltaria ao mesmo problema).

**Motivo:** Mantém o encapsulamento CSS por componente (comportamento padrão Angular),
enquanto os tokens funcionam como fonte de verdade única para valores visuais.
Templates HTML não precisam ser alterados.

**Regra derivada:** Novos componentes devem sempre fazer `@use 'tokens' as *` e nunca
usar valores hex, rem ou px arbitrários para cores, bordas ou sombras.

---

### D-02 — URL base da API inclui prefixo `/api`

**Decisão:** `ambiente.urlApi` passa a incluir o caminho `/api`, tornando-se
`http://localhost:8080/api` em desenvolvimento.

**Motivo:** O contrato da API (`contratos-frontend-projeto-inicial.md`) e o Swagger UI
do backend confirmam que todos os endpoints são prefixados com `/api`
(ex: `GET /api/contas`). A implementação anterior gerava URLs sem esse prefixo.

**Impacto:** Os serviços Angular não precisam de alteração — continuam usando
`${urlApi}/contas`. Apenas os arquivos de ambiente mudam.

**Consistência com produção:** `ambiente.producao.ts` é atualizado de forma análoga
(`https://api.familyfinance.com.br` → `https://api.familyfinance.com.br/api`), assumindo
que o backend de produção usa a mesma estrutura. A ser confirmado no deploy.

---

### D-03 — `TipoContaPipe` como pipe standalone

**Decisão:** Criar `src/app/compartilhado/pipes/tipo-conta.pipe.ts` como pipe Angular
standalone, puro e sem dependências.

```typescript
@Pipe({ name: 'tipoContaLabel', standalone: true, pure: true })
export class TipoContaPipe implements PipeTransform {
  transform(tipo: TipoConta): string {
    return TIPOS_CONTA.find(t => t.valor === tipo)?.rotulo ?? tipo;
  }
}
```

**Local:** `src/app/compartilhado/pipes/` — nova pasta que segue o padrão da pasta
`compartilhado/componentes/` já existente.

**Alternativas consideradas:**
1. Método `tipoLabel()` no componente — descartado: chamado a cada change detection cycle.
2. Map dentro do componente — descartado: menos legível para quem lê o código como treinamento.

**Motivo:** Pipe puro é otimizado pelo Angular (só recalcula quando o input muda).
Fica em `compartilhado/` porque será reutilizável em telas futuras de transações.

---

### D-04 — `consultarSaldo()` mantido com comentário de versão

**Decisão:** O método `consultarSaldo()` em `ContaServico` é mantido, mas recebe um
comentário explicitando que será usado na v2.

```typescript
// v2: usado ao exibir saldo em tempo real após lançamento de transações
consultarSaldo(id: string): Observable<SaldoContaResposta> { ... }
```

**Motivo:** O serviço expõe a API completa do contrato de forma intencional. Remover o
método criaria dívida quando as transações forem implementadas. O comentário comunica
a intenção sem poluir o código com dead code silencioso.
