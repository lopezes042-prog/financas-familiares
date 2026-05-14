## Context

O projeto `familyfinance-web` (Angular 21) foi criado com 6 bugs intencionais documentados via comentários `🐛 BUG-INTENCIONAL-XX` no código — um exercício para analista júnior. Os bugs cobrem as camadas de serviço HTTP, componente de listagem, componente de formulário e template HTML. Todos estão concentrados no módulo de contas (único módulo da v1).

O estado atual impede que qualquer fluxo de contas funcione end-to-end: a URL errada (BUG-01) garante 404 em todas as requisições, e o botão sem submit (BUG-06) impede a criação via clique.

## Goals / Non-Goals

**Goals:**
- Corrigir os 6 bugs para que o CRUD de contas funcione de ponta a ponta
- Adicionar cobertura de teste para o cenário de erro descoberto no BUG-03
- Limpar todos os comentários de exercício que ficam obsoletos após as correções

**Non-Goals:**
- Melhorias além da correção mínima necessária para cada bug
- Novos comportamentos ou fluxos não cobertos pelo spec `conta-gerenciar`
- Refatoração de código que não seja diretamente exigida pela correção

## Decisions

**D-01 — Não criar spec delta para `conta-gerenciar`**

As correções alinham a implementação ao spec existente — nenhum requisito muda. Criar um delta seria ruído.

Alternativa considerada: criar `specs/conta-gerenciar/delta.md` descrevendo o comportamento correto. Descartada porque o spec original já descreve o comportamento correto; o problema era puramente de implementação.

**D-02 — Remover os comentários de bug após cada correção**

Os comentários `🐛 BUG-INTENCIONAL-XX` têm valor didático apenas enquanto o bug está presente. Após a correção, viram ruído e podem confundir futuros leitores.

Alternativa considerada: manter os comentários como histórico. Descartada — o histórico fica no git e no commit message. O código correto não precisa de obituário.

**D-03 — Teste de BUG-03: usar `Subject` + `throwError` em vez de mock de Observable**

O padrão já existente no spec (`new Subject<Conta[]>()`) controla o ciclo de vida do Observable manualmente. Para o teste de erro, o mesmo padrão se aplica: emitir erro via `subject.error(new Error())` e verificar `carregando() === false`. Consistente com o estilo de teste já presente no arquivo.

**D-04 — BUG-05: manter o cast `as EditarContaComando` removendo apenas o campo extra**

O TypeScript aceitaria o objeto sem o cast após remover `saldoInicial`, mas manter o cast explicita a intenção de conformidade com a interface. Sem custo, sem risco.

## Risks / Trade-offs

- **[Risco baixo] Teste de BUG-03 pode falhar por timing** → O Subject permite controle explícito do ciclo; sem async surpresas esperadas.
- **[Risco nulo] Regressão de funcionalidade** → Cada correção é cirúrgica (1–2 linhas). Os testes existentes cobrem o caminho feliz e continuarão passando.

## Migration Plan

Não há migration de dados ou deploy gradual. As mudanças são locais ao frontend. Basta aplicar, rodar `npm test` e fazer o merge para `desenvolvimento`.

## Open Questions

Nenhuma.
