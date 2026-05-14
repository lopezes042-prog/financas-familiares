## 1. Serviço de contas (conta.servico.ts)

- [x] 1.1 BUG-01: corrigir `urlBase` de `/conta` para `/contas`
- [x] 1.2 BUG-02: corrigir `atualizar()` de `http.post` para `http.put`
- [x] 1.3 Remover os comentários `🐛 BUG-INTENCIONAL-01` e `🐛 BUG-INTENCIONAL-02` do arquivo

## 2. Componente de lista de contas (lista-contas.component.ts)

- [x] 2.1 BUG-03: adicionar callback `error: () => this.carregando.set(false)` no subscribe de `carregarContas()`
- [x] 2.2 Remover o comentário `🐛 BUG-INTENCIONAL-03` do arquivo

## 3. Spec de lista de contas (lista-contas.component.spec.ts)

- [x] 3.1 Remover o comentário "Nota BUG-03" do teste existente (`deve exibir spinner enquanto a requisição está pendente`)
- [x] 3.2 Adicionar teste `deve parar o spinner após erro na requisição` usando `Subject` + `subject.error()` e verificando `carregando() === false`

## 4. Componente de formulário de conta (formulario-conta.component.ts)

- [x] 4.1 BUG-04: adicionar `Validators.minLength(2)` na lista de validators do campo `nome`
- [x] 4.2 BUG-05: remover `saldoInicial: valor.saldoInicial` do objeto `comando` em `atualizar()`
- [x] 4.3 Remover os comentários `🐛 BUG-INTENCIONAL-04` e `🐛 BUG-INTENCIONAL-05` do arquivo

## 5. Template do formulário de conta (formulario-conta.component.html)

- [x] 5.1 BUG-06: alterar o botão "Salvar/Atualizar" de `type="button"` para `type="submit"`
- [x] 5.2 Remover o bloco de comentário HTML `<!-- 🐛 BUG-INTENCIONAL-06 ... -->` do template

## 6. Verificação final

- [x] 6.1 Executar `npm test` e confirmar que todos os testes passam (incluindo o novo de BUG-03)
- [x] 6.2 Executar `npm run lint` e confirmar que não há erros de lint
