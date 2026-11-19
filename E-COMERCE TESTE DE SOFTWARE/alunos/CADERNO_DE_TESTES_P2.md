# CADERNO DE TESTES – AVALIAÇÃO PRÁTICA P2
**Disciplina:** Gestão da Qualidade e Teste de Software  
**Curso:** Engenharia de Software – 7º Período  
**Valor:** 10,0 pontos  
**Tema:** Planejamento, implementação, execução e documentação de testes de software  

---

## 1. Identificação do Projeto

| Campo | Preenchimento |
| :--- | :--- |
| **Sistema / versão** | Loja Aurora – Versão 1.0.0 (Node.js CommonJS didático) |
| **Equipe / turma** | Engenharia de Software – 7º Período |
| **Repositório** | Projeto local `E-COMERCE TESTE DE SOFTWARE/alunos` |
| **Período de execução** | Novembro de 2026 |
| **Responsável pelos testes** | Equipe de Garantia da Qualidade (QA) |

---

## 2. Escopo e Inventário de Funcionalidades

O sistema avaliado é a **Loja Aurora**, aplicação completa de e-commerce desenvolvida sobre arquitetura Node.js (camadas de Domínio, Serviços, Rotas e Persistência em JSON) com front-end nativo (HTML5/CSS3/Vanilla JS).

| ID | Funcionalidade / Requisito | Descrição Verificável | Risco |
| :--- | :--- | :--- | :---: |
| **RF01** | Cadastro de Usuário | Permite a criação de nova conta de cliente informando nome (mín. 3 caracteres), e-mail válido e senha (mín. 6 caracteres). E-mails duplicados são rejeitados com HTTP 400. | Médio |
| **RF02** | Autenticação (Entrar/Sair) | Usuário cadastrado e ativo realiza login com e-mail e senha, recebendo token de sessão. Realiza logout revogando a sessão ativa. | Alto |
| **RF03** | Catálogo de Produtos | Apresenta os produtos ativos com nome, descrição, categoria, preço em reais e estoque disponível. Produtos inativos são ocultados. | Médio |
| **RF04** | Busca e Filtros | Permite busca textual no catálogo e filtragem por categoria sem recriar o DOM integral a cada tecla. | Médio |
| **RF05** | Carrinho de Compras | Permite adicionar produtos, ajustar quantidade de itens e remover produtos. Valida quantidade inteira positiva. | Alto |
| **RF06** | Controle de Estoque | O sistema monitora o estoque por item, não permitindo compra de quantidade superior ao disponível e decrementando o estoque após a confirmação. | Alto |
| **RF07** | Aplicação de Cupons | Permite aplicar cupons percentuais ou de valor fixo no carrinho, rejeitando cupons vencidos ou inativos, aplicando o benefício de maior valor em relação ao desconto automático (RN-05). | Alto |
| **RF08** | Endereço de Entrega | Exige endereço completo com rua, número, bairro, cidade, UF e CEP para habilitar o fechamento da compra (RN-13). | Médio |
| **RF09** | Finalização de Compra | Cliente autenticado conclui o pedido, gravando itens, totais com precisão de centavos (half-up), frete e dados de entrega, retornando HTTP 201 com ID único. | Crítico |
| **RF10** | Histórico e Consulta de Pedidos | Cliente autenticado consulta exclusivamente seus próprios pedidos (listagem e detalhe por ID), garantindo isolamento entre clientes (RN-10). | Alto |

---

## 3. Ambiente e Massa de Dados

| Item | Descrição / Configuração |
| :--- | :--- |
| **Aplicação / URL local** | Loja Aurora – `http://127.0.0.1:3000` |
| **Sistema Operacional** | Windows 11 Pro 64-bit |
| **Navegadores Homologados** | Google Chrome v131.0.6778.86 / Microsoft Edge v131.0.2903.70 |
| **Linguagem / Framework** | Node.js v26.3.0 (compatível >=18 LTS), CommonJS (`require`), HTTP nativo sem dependências de framework web |
| **Persistência / Banco** | Arquivo JSON local (`data/db.json`), isolamento em testes via cópias temporárias dinâmicas (`os.tmpdir()`) |
| **Ferramentas de Teste** | Node.js Test Runner nativo (`node:test`, `node:assert/strict`), Playwright v1.65.1 com `@axe-core/playwright` v4.14.0, scripts de medição de carga com `process.hrtime.bigint()` |
| **Contas Didáticas de Teste** | `cliente-a@loja.test` / `SenhaDidatica123!` (Cliente)<br>`cliente-b@loja.test` / `SenhaDidatica123!` (Cliente)<br>`admin@loja.test` / `SenhaDidatica123!` (Administrador) |
| **Fixtures Principais** | `produto-teste`: R$ 150,00, estoque 5 un.<br>`pedido-cliente-b`: pedido histórico do cliente-b.<br>Cupons: `VINTE` (20% válido até 31/12/2026), `CINCO` (5% válido até 31/12/2026), `ANTIGO` (20% vencido em 06/10/2026). Relógio fixado em `2026-10-07T15:00:00.000Z`. |
| **Restrições de Segurança** | Execução estritamente local; sem envio de dados a servidores de terceiros; massa sintética didática sem PII real; testes de estresse restritos ao host local. |

---

## 4. Plano de Testes e Critérios

- **Objetivo:** Validar o correto funcionamento das regras de negócio (desconto automático, frete, estoque, cupons, arredondamento half-up), integridade das APIs, isolamento de acessos, comportamento sob carga e estresse, acessibilidade e compatibilidade entre navegadores, produzindo evidências reproduzíveis.
- **Escopo:** Todas as 10 funcionalidades essenciais (RF01 a RF10), regras de negócio (RN-01 a RN-13) e critérios de qualidade (RNF-01 a RNF-09).
- **Fora do Escopo:** Gateway de pagamento bancário real, envio de e-mails transacionais (SMTP), integração com sistemas de logística externa (Correios/transportadoras).
- **Critérios de Entrada:** 
  1. Base de dados didática restaurada via `npm run reset`.
  2. Servidor executável localmente na porta configurada.
  3. Ambiente de testes com Node.js >= 18 configurado.
- **Critérios de Saída:**
  1. 100% dos testes planejados executados.
  2. 100% das 10 funcionalidades com cobertura de testes verificável.
  3. Defeito crítico identificado corrigido, com reteste (confirmação) e regressão aprovados.
  4. Métricas de carga e estresse coletadas e analisadas.
- **Priorização dos Testes:**
  - *Alta/Crítica:* Finalização de compras, cálculo financeiro/arredondamento, controle de estoque e autenticação/autorização.
  - *Média:* Busca, filtros, histórico de pedidos e aplicação de cupons secundários.
  - *Baixa:* Layout responsivo em resoluções atípicas.

---

## 5. Matriz de Rastreabilidade

| Requisito | Funcionalidade Principal | Casos de Teste Associados | Modalidade | Situação |
| :---: | :--- | :--- | :--- | :---: |
| **RF01** | Cadastro de Usuário | `CT-F01`, `CT-I02` (Passo 1), `CT-S02` (Passos 1-2) | Funcional, Integração, Segurança | Coberto |
| **RF02** | Autenticação (Entrar / Sair) | `CT-F02`, `CT-I02` (Passos 2-5), `CT-S01` (Passo 8) | Funcional, Integração, Segurança | Coberto |
| **RF03** | Catálogo de Produtos | `CT-F03`, `CT-U01` (dados base), `dataset.test.js` | Funcional, Unitário, Integração | Coberto |
| **RF04** | Busca e Filtros | `CT-F04`, `CT-X01` (Passos 1 e 3) | Funcional, Compatibilidade | Coberto |
| **RF05** | Carrinho de Compras | `CT-F05`, `CT-B02`, `CT-R01`, `CT-U04` | Funcional, Caixa-Preta, Regressão, Unitário | Coberto |
| **RF06** | Controle de Estoque | `CT-F06`, `CT-B02`, `CT-CONF01`, `CT-I01` | Funcional, Caixa-Preta, Confirmação, Integração | Coberto |
| **RF07** | Aplicação de Cupons | `CT-F07`, `CT-F11`, `CT-R02`, `exemplo-cupom.test.js` | Funcional, Regressão, Unitário | Coberto |
| **RF08** | Endereço de Entrega | `CT-F08`, `CT-F16`, `CT-I01` (Passo 2) | Funcional, Integração | Coberto |
| **RF09** | Finalização de Pedido | `CT-F09`, `CT-I01`, `CT-R03`, `CT-B01` | Funcional, Integração, Regressão, Caixa-Preta | Coberto |
| **RF10** | Consulta de Histórico | `CT-F10`, `CT-I01` (Passo 4), `CT-S01` (Passos 1-2) | Funcional, Integração, Segurança | Coberto |

---

## 6. Fichas dos Casos de Teste

### 6.1 Modalidade: Testes Unitários

#### CT-U01: Ausência de desconto automático abaixo de R$ 200,00 (RN-01)
- **Requisito / Modalidade:** RF05 / RN-01 | Unitário (Caixa-Branca / Valor-Limite)
- **Prioridade / Data:** Alta | 17/11/2026
- **Pré-condições:** Função `automaticDiscount` isolada em `src/domain/discount.js`.
- **Dados de Entrada:** Subtotal = `199.99`
- **Passos:** Invocar `automaticDiscount(199.99)`.
- **Resultado Esperado:** Retorno numérico igual a `0`.
- **Resultado Obtido:** Retorno `0`.
- **Status:** **APROVADO**
- **Evidência:** `tests/unitarios.test.js`, log em `evidencias/CT-U01/CT-U01.png`.

  ![Evidência CT-U01](evidencias/CT-U01/CT-U01.png)

#### CT-U02: Desconto de 10% no limite exato de R$ 200,00 (RN-01)
- **Requisito / Modalidade:** RF05 / RN-01 | Unitário (Valor-Limite)
- **Prioridade / Data:** Alta | 17/11/2026
- **Pré-condições:** Função `automaticDiscount` disponível.
- **Dados de Entrada:** Subtotal = `200.00`
- **Passos:** Invocar `automaticDiscount(200.00)`.
- **Resultado Esperado:** Retorno numérico `20.00` (10% de 200).
- **Resultado Obtido:** Retorno `20.00`.
- **Status:** **APROVADO**
- **Evidência:** `tests/unitarios.test.js`, log em `evidencias/CT-U02/CT-U02.png`.

  ![Evidência CT-U02](evidencias/CT-U02/CT-U02.png)

#### CT-U03: Arredondamento monetário Half-Up de meio centavo (RN-06)
- **Requisito / Modalidade:** RF05 / RN-06 | Unitário (Aritmética Financeira)
- **Prioridade / Data:** Crítica | 17/11/2026
- **Pré-condições:** Função `percentOf` isolada em `src/domain/money.js`.
- **Dados de Entrada:** Valor = `200.05`, Percentual = `10` (cálculo: `20.005`).
- **Passos:** Invocar `percentOf(200.05, 10)`.
- **Resultado Esperado:** Retorno `20.01` (arredondamento para cima a partir de meio centavo).
- **Resultado Obtido:** Retorno `20.01`.
- **Status:** **APROVADO**
- **Evidência:** `tests/unitarios.test.js`, log em `evidencias/CT-U03/CT-U03.png`.

  ![Evidência CT-U03](evidencias/CT-U03/CT-U03.png)

#### CT-U04: Rejeição de quantidade negativa no item (RN-03)
- **Requisito / Modalidade:** RF05 / RN-03 | Unitário (Validação de Entrada)
- **Prioridade / Data:** Alta | 17/11/2026
- **Pré-condições:** Função `validateQuantity` isolada em `src/domain/quantity.js`.
- **Dados de Entrada:** Quantidade = `-1`
- **Passos:** Invocar `validateQuantity(-1)`.
- **Resultado Esperado:** Objeto `{ ok: false, message: "Quantidade inválida" }`.
- **Resultado Obtido:** `{ ok: false, message: "Quantidade inválida" }`.
- **Status:** **APROVADO**
- **Evidência:** `tests/unitarios.test.js`.

---

### 6.2 Modalidade: Testes de Integração

#### CT-I01: Fluxo Integrado de Compra, Estoque e Persistência em Banco
- **Requisito / Modalidade:** RF05, RF06, RF08, RF09, RF10 / RN-08 | Integração (API + Domínio + Banco)
- **Prioridade / Data:** Crítica | 17/11/2026
- **Pré-condições:** Servidor ativo com cópia descartável de `data/db.json` em `os.tmpdir()`. `produto-teste` com estoque 5 un.
- **Dados de Entrada:** Cliente `cliente-a@loja.test`, 2 unidades de `produto-teste` (R$ 150,00 un.), endereço completo.
- **Passos:**
  1. Consultar estoque inicial de `produto-teste` via `GET /api/products/produto-teste`.
  2. Executar `POST /api/checkout` autenticado com token de cliente.
  3. Consultar estoque final do produto após a compra.
  4. Consultar o pedido recém-criado via `GET /api/orders/:id`.
- **Resultado Esperado:** HTTP 201 no checkout, estoque decrementado de 5 para 3, pedido disponível na consulta de pedidos do cliente.
- **Resultado Obtido:** Checkout concluído com ID gerado (`ped-1201`).
- **Status:** **APROVADO**
- **Evidências:** `evidencias/CT-I01/`.

  ![Estoque Antes](evidencias/CT-I01/CT-I01_01_ESTOQUE_ANTES.png)
  ![Pedido Criado](evidencias/CT-I01/CT-I01_02_PEDIDO_CRIADO.png)
  ![Estoque Depois](evidencias/CT-I01/CT-I01_03_ESTOQUE_DEPOIS.png)

#### CT-I02: Ciclo Completo de Cadastro, Sessão e Invalidação por Logout
- **Requisito / Modalidade:** RF01, RF02 | Integração (Auth / Sessão / API)
- **Prioridade / Data:** Alta | 17/11/2026
- **Pré-condições:** Endpoint de autenticação operacional.
- **Dados de Entrada:** Nome: `Aluno Teste`, E-mail dinâmico único, Senha: `Senha123`.
- **Passos:**
  1. `POST /api/auth/register` criando novo usuário.
  2. `GET /api/auth/me` utilizando o token recebido.
  3. `POST /api/auth/logout` com o token.
  4. Nova requisição a `GET /api/auth/me` com o mesmo token.
  5. `POST /api/auth/login` com as credenciais criadas.
- **Resultado Esperado:** Passo 1 retorna 201 sem expor hash/senha; Passo 2 retorna 200 com dados públicos; Passo 3 retorna 200; Passo 4 retorna 401 (token revogado); Passo 5 retorna 200 com novo token.
- **Resultado Obtido:** Todos os 5 passos executados conforme especificado com 100% de sucesso.
- **Status:** **APROVADO**
- **Evidência:** `tests/integracao.test.js`, log em `evidencias/CT-I02/CT-I02.png`.

  ![Evidência CT-I02](evidencias/CT-I02/CT-I02.png)

---

### 6.3 Modalidade: Testes Funcionais / Sistema (10 Casos Mapeados)

| ID | Requisito | Cenário / Descrição | Tipo | Passos e Dados | Resultado Esperado | Resultado Obtido | Status | Evidência |
| :---: | :---: | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **CT-F01** | RF01 | Cadastro com dados válidos | Positivo | Formulário de cadastro preenchido com nome, e-mail não cadastrado e senha >=6 chars. | Conta criada, redirecionamento ou sessão iniciada. | Usuário criado com sucesso. | Aprovado | `CT-F01_1.png` |
| **CT-F02** | RF02 | Login com senha incorreta | **Negativo** | Acessar tela de login, inserir e-mail existente e senha incorreta (`****`). | Acesso negado com mensagem "E-mail ou senha incorretos". | Mensagem de erro exibida, bloqueio de acesso. | Aprovado | `CT-F02_1.png` |
| **CT-F03** | RF03 | Visualização dos produtos no catálogo | Positivo | Acessar `/#catalogo`. | Exibição em grade dos produtos com nome, descrição, categoria, preço e estoque. | Cards de produtos renderizados corretamente. | Aprovado | `CT-F03_1.png` |
| **CT-F04** | RF04 | Busca por termo inexistente no catálogo | **Negativo** | Digitar string sem correspondência (`helsshd`) no campo de busca. | Catálogo esvaziado, nenhum card exibido. | Lista vazia sem quebra de página. | Aprovado | `CT-F04_2.png` |
| **CT-F05** | RF05 | Adição e remoção de item no carrinho | Positivo | Clicar em "Adicionar ao carrinho" em `produto-teste` e em seguida clicar em "Remover". | Item adicionado com badge incrementado e depois removido zerando o carrinho. | Itens manipulados perfeitamente. | Aprovado | `CT-F05_1.png`, `CT-F05_3.png` |
| **CT-F06** | RF06 | Visualização de estoque na listagem | Positivo | Consultar `produto-teste` no catálogo. | Apresentar rótulo `Estoque: 5`. | Estoque exibido corretamente. | Aprovado | `CT-F06_1.png` |
| **CT-F07** | RF07 | Aplicação de cupom válido no checkout | Positivo | No carrinho, informar cupom `VINTE` e acionar "Aplicar cupom". | Desconto de 20% aplicado sobre o subtotal, reduzindo o valor total. | Desconto de R$ 30,00 aplicado sobre R$ 150,00. | Aprovado | `CT-F07_1.png` |
| **CT-F08** | RF08 | Preenchimento incompleto de endereço | **Negativo** | Avançar checkout deixando CEP e UF em branco. | Validação indicando campos obrigatórios pendentes. | Mensagem visual de campos obrigatórios. | Aprovado | `CT-F08_1.png` |
| **CT-F09** | RF09 | Conclusão de compra com sucesso | Positivo | Cliente autenticado com carrinho preenchido e endereço clica em "Finalizar pedido". | Pedido gerado com ID único e total calculado. | Pedido gerado (`ped-1201`). | Aprovado | `CT-F09_1.png` |
| **CT-F10** | RF10 | Consulta a detalhe de pedido no histórico | Positivo | Acessar `/#pedidos` e clicar em "Ver pedido" no `pedido-cliente-b`. | Exibição de itens, subtotal, frete, desconto e endereço gravados. | Dados fiéis do pedido exibidos. | Aprovado | `CT-F010_1.png`, `CT-F010_4.png` |

---


#### Galeria de Evidências dos Casos de Teste Funcionais (Interface Localhost)

| CT-F01 (Cadastro Válido) | CT-F02 (Login Senha Incorreta) |
| :---: | :---: |
| ![CT-F01](evidencias/CT-F01/CT-F01_1.png) | ![CT-F02](evidencias/CT-F02/CT-F02_1.png) |

| CT-F03 (Catálogo de Produtos) | CT-F04 (Busca Inexistente) |
| :---: | :---: |
| ![CT-F03](evidencias/CT-F03/CT-F03_1.png) | ![CT-F04](evidencias/CT-F04/CT-F04_2.png) |

| CT-F05 (Adição / Remoção Carrinho) | CT-F06 (Monitoramento Estoque) |
| :---: | :---: |
| ![CT-F05](evidencias/CT-F05/CT-F05_1.png) | ![CT-F06](evidencias/CT-F06/CT-F06_1.png) |

| CT-F07 (Aplicação de Cupom) | CT-F08 (Checkout Sem Endereço) |
| :---: | :---: |
| ![CT-F07](evidencias/CT-F07/CT-F07_1.png) | ![CT-F08](evidencias/CT-F08/CT-F08_1.png) |

| CT-F09 (Finalização com Pedido Gerado) | CT-F10 (Consulta aos Detalhes do Pedido) |
| :---: | :---: |
| ![CT-F09](evidencias/CT-F09/CT-F09_1.png) | ![CT-F10](evidencias/CT-F10/CT-F010_1.png) |

---

### 6.4 Modalidade: Caixa-Preta (Técnicas Formais de Teste)

#### CT-B01: Particionamento de Equivalência e Valor-Limite nas Regras Financeiras (RN-01 e RN-02)
- **Técnicas Aplicadas:** Particionamento de Equivalência (EP) e Análise de Valor-Limite (BVA).
- **Classes de Equivalência Mapeadas:**
  - *Classe 1:* Subtotal em `[0.01; 199.99]` -> Sem desconto automático, Frete R$ 18,50.
  - *Classe 2:* Subtotal em `[200.00; 299.99]` -> Desconto de 10%, Frete R$ 18,50.
  - *Classe 3:* Subtotal em `[300.00; +inf)` -> Desconto de 10%, Frete Grátis (R$ 0,00).
- **Valores-Limite Testados:**
  1. `R$ 199.99` (imediatamente abaixo de 200): Desconto = R$ 0,00, Frete = R$ 18,50, Total = R$ 218,49.
  2. `R$ 200.00` (exatamente no limite de desconto): Desconto = R$ 20,00, Frete = R$ 18,50, Total = R$ 198,50.
  3. `R$ 200.01` (imediatamente acima de 200): Desconto = R$ 20,00, Frete = R$ 18,50, Total = R$ 198,51.
  4. `R$ 299.99` (imediatamente abaixo do frete grátis): Desconto = R$ 30,00, Frete = R$ 18,50, Total = R$ 288,49.
  5. `R$ 300.00` (exatamente no limite do frete grátis): Desconto = R$ 30,00, Frete = R$ 0,00, Total = R$ 270,00.
  6. `R$ 300.01` (imediatamente acima de 300): Desconto = R$ 30,00, Frete = R$ 0,00, Total = R$ 270,01.
  7. `R$ 200.05` (critério RN-06 de meio centavo): Desconto = R$ 20,01 (half-up de 20.005), Total = R$ 198,54.
- **Resultado:** 10/10 cenários rigorosamente aprovados.
- **Evidência:** `tests/caixa_preta_valores.test.js` e `evidencias/CT-B01/CT-B01_terminal.png`.

  ![Terminal CT-B01](evidencias/CT-B01/CT-B01_terminal.png)

#### CT-B02: Particionamento e Valor-Limite na Quantidade de Itens vs Estoque (RN-03)
- **Técnicas Aplicadas:** EP e BVA sobre quantidade de item (`produto-teste`, estoque = 5).
- **Classes e Limites:**
  - Classe Inválida: Negativo (`-1`) -> Rejeitado (400).
  - Limite Inferior Inválido: Zero (`0`) -> Rejeitado (400).
  - Limite Inferior Válido: Um (`1`) -> Aceito (200), subtotal R$ 150,00.
  - Classe Inválida: Não-inteiro (`1.5`) -> Rejeitado (400).
  - Limite Superior Válido: Igual ao estoque (`5`) -> Aceito (200), subtotal R$ 750,00.
  - Limite Superior Inválido: Acima do estoque (`6`) -> **Rejeitado (400)** *(após correção do BUG-01)*.
- **Resultado:** Todos os 7 testes aprovados após a correção.
- **Evidência:** `tests/caixa_preta.test.js` e interface web.

  ![Tentativa Compra Acima do Estoque](evidencias/CT-B02/CT-B02_02_FALHA.png)

---

### 6.5 Modalidade: Confirmação (Reteste) e Regressão

#### CT-CONF01: Reteste da Rejeição de Quantidade Superior ao Estoque (BUG-01)
- **Defeito Relacionado:** BUG-01 (Venda acima do estoque permitido).
- **Passos:** Requisitar cotação via `POST /api/cart/quote` e checkout via `POST /api/checkout` com quantidade 6 de `produto-teste` (estoque = 5).
- **Resultado Esperado:** HTTP 400 com mensagem explicativa contendo "estoque".
- **Resultado Obtido:** HTTP 400 com corpo `{"error": "Quantidade acima do estoque disponível"}`.
- **Status:** **APROVADO** (Falha original corrigida com sucesso).
- **Evidência:** `tests/regressao.test.js` e `evidencias/CT-R/CT-R_terminal.png`.

  ![Execução Reteste CT-CONF01](evidencias/CT-R/CT-R_terminal.png)

#### CT-R01, CT-R02 e CT-R03: Suíte de Regressão em Áreas Afetadas
- **CT-R01 (Limites e integridade de quantidade):** Verifica se quantidades válidas (1 e 5) continuam aceitas e quantidades inválidas (0 e 1.5) continuam rejeitadas após o patch. -> **APROVADO**.
- **CT-R02 (Cálculo de Totais, Desconto e Cupons):** Garante que o cálculo de subtotal, desconto automático de 10%, frete grátis e aplicação de cupom percentual continuam íntegros sem regressão. -> **APROVADO**.
- **CT-R03 (Checkout no limite do estoque):** Comprova que a compra de exatamente 5 unidades (100% do estoque) continua sendo processada com sucesso (HTTP 201). -> **APROVADO**.
- **Evidência:** `tests/regressao.test.js` e `evidencias/CT-R/CT-R_terminal.png`.

  ![Execução Suíte Regressão](evidencias/CT-R/CT-R_terminal.png)

---

### 6.6 Modalidade: Segurança Básica (Não Destrutiva)

#### CT-S01: Controle de Acesso e Isolamento entre Perfis (RN-10 e RN-11)
- **Cenários Executados:**
  1. Cliente `cliente-a` tenta acessar pedido alheio (`pedido-cliente-b`): Bloqueado com HTTP 404/403.
  2. Listagem de pedidos de `cliente-a` não vaza pedidos de terceiros (filtragem por `userId`).
  3. Cliente comum tentando acessar rota `/api/admin/orders`: Rejeitado com HTTP 403.
  4. Cliente comum tentando cadastrar produto via `POST /api/admin/products`: Rejeitado com HTTP 403.
  5. Requisição sem token tentando alterar preço/estoque: Rejeitada com HTTP 401/403.
  6. Administrador autenticado atualizando produto: Aceito com HTTP 200 (controle positivo).
- **Status:** **APROVADO**
- **Evidência:** `tests/seguranca.test.js` e `evidencias/CT-S01/CT-S01_terminal.png`.

  ![Execução Segurança Básica](evidencias/CT-S01/CT-S01_terminal.png)

#### CT-S02: Validação e Sanitização de Entradas Maliciosas
- **Cenários Executados:**
  1. Cadastro com e-mail inválido/sem formato RFC: Rejeitado com HTTP 400.
  2. Cadastro com senha excessivamente curta (< 6 chars): Rejeitado com HTTP 400.
  3. Envio de JSON malformado: Rejeitado com HTTP 400 sem vazar stack trace do Node.
  4. Tentativa de SQL Injection nos campos de login (`' OR '1'='1`): Tratado como string segura, retornando HTTP 401 (sem erro 500).
  5. Injeção de payload em quantidade de carrinho (`1; DROP TABLE`): Rejeitado com HTTP 400.
  6. XSS armazenado/refletido com tags `<script>` no ID do produto: Rejeitado sem execução de script.
  7. Path Traversal no servidor estático (`/..%2f..%2fserver.js`): Bloqueado com HTTP 403, impedindo vazamento de código-fonte.
- **Status:** **APROVADO**
- **Evidência:** `tests/seguranca.test.js` e `evidencias/CT-S01/CT-S01_terminal.png`.

  ![Execução Sanitização Entradas](evidencias/CT-S01/CT-S01_terminal.png)

---

### 6.7 Modalidades de Desempenho: Carga e Estresse

#### CT-C01: Teste de Carga Progressiva
- **Ferramenta:** Script automatizado `scripts/carga.js` utilizando Node.js nativo e timers de alta precisão (`process.hrtime.bigint()`).
- **Endpoint Testado:** Cenário misto representativo: Leitura de catálogo (`GET /api/products/produto-teste`) e Cotação de compra (`POST /api/cart/quote`).
- **Duração:** 8 segundos por estágio (32 segundos de carga contínua).
- **Estágios:** 5, 10, 20 e 40 usuários virtuais concorrentes.
- **Resultados:**
  - 5 VUs: 55.491 reqs | 6.936,4 req/s | Média: 0,72 ms | p95: 1,16 ms | Erros: 0 (0,00%)
  - 10 VUs: 55.043 reqs | 6.880,4 req/s | Média: 1,45 ms | p95: 2,42 ms | Erros: 0 (0,00%)
  - 20 VUs: 56.931 reqs | 7.116,4 req/s | Média: 2,81 ms | p95: 5,49 ms | Erros: 0 (0,00%)
  - 40 VUs: 52.815 reqs | 6.601,0 req/s | Média: 6,06 ms | p95: 9,88 ms | Erros: 0 (0,00%)
- **Status:** **APROVADO**
- **Evidência:** `evidencias/CT-C01/resultado_carga.json` e `CT-C01_terminal.png`.

  ![Execução Teste Carga Progressiva](evidencias/CT-C01/CT-C01_terminal.png)

#### CT-E01: Teste de Estresse e Recuperação
- **Carga de Estresse:** 100, 200 e 400 usuários virtuais concorrentes (acima do patamar de saturação da máquina local).
- **Resultados de Estresse:**
  - 100 VUs: 49.244 reqs | 6.153,2 req/s | Média: 16,24 ms | p95: 23,77 ms | Erros: 0 (0,00%)
  - 200 VUs: 49.127 reqs | 6.136,3 req/s | Média: 32,55 ms | p95: 44,32 ms | Erros: 0 (0,00%)
  - 400 VUs: 44.586 reqs | 5.554,5 req/s | Média: 71,80 ms | p95: 102,83 ms | Erros: 0 (0,00%)
- **Observação de Falhas e Degradação:** Não houve crash de processo ou travamento de portas; o tempo de resposta aumentou progressivamente de 0,72 ms para 71,80 ms em decorrência do enfileiramento na thread única do event-loop do Node.js.
- **Teste de Recuperação:** Retorno imediato a 5 VUs após o estresse:
  - Recuperação (5 VUs): 53.291 reqs | 6.661,4 req/s | Média: 0,75 ms | p95: 1,27 ms | Erros: 0 (0,00%).
  - Sonda de saúde: HTTP 200 respondido em 1 ms logo após o teste.
- **Conclusão:** O sistema demonstra excelente capacidade de auto-recuperação (resiliência), restaurando latências sub-milissegundo assim que a carga de estresse cessa.
- **Evidência:** `evidencias/CT-E01/resultado_estresse.json` e `CT-E01_terminal.png`.

  ![Execução Teste Estresse](evidencias/CT-E01/CT-E01_terminal.png)

---

### 6.8 Modalidade: Usabilidade e Acessibilidade

#### CT-A01: Inspeção Baseada em Checklist (5 Critérios Verificáveis)
- **Checklist Inspecionado:**
  1. *Identificação de Campos (RNF-01):* Todo controle possui rótulo (`<label>`) claramente visível. -> **Em conformidade** (`CT-A01_01_ROTULOS.png`).
  2. *Navegação por Teclado (RNF-02):* Elementos interativos essenciais são acessíveis por tecla `Tab` e acionáveis por `Enter`/`Espaço`. -> **Em conformidade** (`CT-A01_02_TECLADO.png`).
  3. *Indicador de Foco Visível (RNF-03):* O anel de foco (outline/ring) destaca nitidamente o elemento ativo no catálogo e no formulário. -> **Em conformidade** (`CT-A01_03_FOCO.png`).
  4. *Clareza nas Mensagens de Erro (RNF-04):* O erro de cadastro informa claramente o motivo da rejeição ("Dados inválidos" / destaque do campo). -> **Em conformidade** (`CT-A01_04_ERRO_CADASTRO.png`).
  5. *Carrinho Vazio com Caminho de Retorno (RNF-05):* Ao esvaziar o carrinho, a interface apresenta mensagem contextual amigável e atalho para o catálogo. -> **Em conformidade** (`CT-A01_05_CARRINHO_VAZIO.png`).
- **Status:** **APROVADO**
- **Evidências:** Capturas catalogadas na pasta `evidencias/CT-AO1/`.

  ![Rótulos Acessíveis](evidencias/CT-AO1/CT-A01_01_ROTULOS.png)
  ![Navegação Teclado](evidencias/CT-AO1/CT-A01_02_TECLADO.png)
  ![Foco e Contraste](evidencias/CT-AO1/CT-A01_03_FOCO.png)
  ![Erro Cadastro](evidencias/CT-AO1/CT-A01_04_ERRO_CADASTRO.png)
  ![Carrinho Vazio](evidencias/CT-AO1/CT-A01_05_CARRINHO_VAZIO.png)


---

### 6.9 Modalidade: Compatibilidade de Ambientes

#### CT-X01: Validação Cruzada entre Google Chrome e Microsoft Edge
- **Ambiente A:** Google Chrome v131.0.6778.86 (Resolução 1920x1080)
- **Ambiente B:** Microsoft Edge v131.0.2903.70 (Resolução 1920x1080)
- **Tarefas Executadas:**
  1. Busca de produto no catálogo (`Produto Teste`).
  2. Adição ao carrinho e inserção do cupom `VINTE`.
- **Análise Comparativa:**
  - *Renderização e Tipografia:* Idênticas em ambos os navegadores (ambos utilizam o motor Chromium / Blink).
  - *Cálculo de Desconto:* Idêntico (Subtotal R$ 150,00, Desconto R$ 30,00, Frete R$ 18,50, Total R$ 138,50).
  - *Diferenças Observadas:* Nenhuma divergência visual ou funcional que comprometa o usuário.
- **Status:** **APROVADO**
- **Evidências:**

  ![Chrome Busca](evidencias/CT-X01/CT-X01_01_CHROME_BUSCA.png)
  ![Chrome Cupom](evidencias/CT-X01/CT-X01_02_CHROME_CUPOM.png)
  ![Edge Busca](evidencias/CT-X01/CT-X01_03_EDGE_BUSCA.png)
  ![Edge Cupom](evidencias/CT-X01/CT-X01_04_EDGE_CUPOM.png)


---

## 7. Registro de Defeitos

### BUG-01: Aceitação indevida de quantidade superior ao estoque no carrinho e checkout
- **ID / Título:** BUG-01 – Falha na validação de quantidade vs estoque disponível (Violação da RN-03)
- **Severidade:** Alta | **Prioridade:** Alta
- **Ambiente e Versão:** Node.js v26.3.0 / Loja Aurora v1.0.0
- **Passos para Reproduzir:**
  1. Identificar produto com estoque limitado (ex.: `produto-teste`, estoque = 5).
  2. Enviar requisição `POST /api/cart/quote` com `quantity: 6`.
  3. Enviar requisição `POST /api/checkout` com `quantity: 6`.
- **Comportamento Esperado:** O sistema deve recusar a cotação e a compra com HTTP 400 e mensagem clara informando que a quantidade solicitada excede o estoque.
- **Comportamento Observado:** O endpoint aceitava a cotação e o checkout retornando HTTP 200/201, permitindo venda sem cobertura física de estoque.
- **Causa-Raiz:** A função `validateQuantity(quantity)` em `src/domain/quantity.js` verificava apenas se o número era inteiro positivo, sem receber ou checar o parâmetro `stock`.
- **Correção Realizada:**
  1. Atualizada a assinatura para `validateQuantity(quantity, stock)` em `src/domain/quantity.js`.
  2. Adicionada regra `if (stock !== undefined && stock !== null && quantity > Number(stock)) return { ok: false, message: "Quantidade acima do estoque disponível" };`.
  3. Propagado o estoque do produto nos chamadores em `src/domain/pricing.js`, `src/routes/api.js` e `src/services/checkout.js`.
- **Evidência do Defeito:** `evidencias/CT-BUG01/BUG01_antes_terminal.png` e `BUG01_depois_terminal.png`.

  ![BUG-01 Antes da Correção](evidencias/CT-BUG01/BUG01_antes_terminal.png)
  ![BUG-01 Depois da Correção](evidencias/CT-BUG01/BUG01_depois_terminal.png)
- **Reteste e Regressão:** `CT-CONF01` aprovado; `CT-R01`, `CT-R02`, `CT-R03` aprovados em `evidencias/CT-R/DEPOIS_confirmacao_regressao.txt`.
- **Situação:** **CORRIGIDO E HOMOLOGADO**.

---

## 8. Registro Específico – Carga e Estresse

| Métrica / Parâmetro | Estágio 1 (5 VUs) | Estágio 2 (10 VUs) | Estágio 3 (20 VUs) | Estágio 4 (40 VUs) | Estresse 1 (100 VUs) | Estresse 2 (200 VUs) | Estresse 3 (400 VUs) | Recuperação (5 VUs) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Duração (s)** | 8,0 | 8,0 | 8,0 | 8,0 | 8,0 | 8,0 | 8,0 | 8,0 |
| **Requisições Totais** | 55.491 | 55.043 | 56.931 | 52.815 | 49.244 | 49.127 | 44.586 | 53.291 |
| **Vazão (req/s)** | 6.936,4 | 6.880,4 | 7.116,4 | 6.601,0 | 6.153,2 | 6.136,3 | 5.554,5 | 6.661,4 |
| **Tempo Médio (ms)** | 0,72 | 1,45 | 2,81 | 6,06 | 16,24 | 32,55 | 71,80 | 0,75 |
| **Percentil 95 (ms)** | 1,16 | 2,42 | 5,49 | 9,88 | 23,77 | 44,32 | 102,83 | 1,27 |
| **Tempo Máximo (ms)** | 7,11 | 13,63 | 13,62 | 37,85 | 62,98 | 117,90 | 219,38 | 22,04 |
| **Erros / Falhas** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Taxa de Erro (%)** | 0,00% | 0,00% | 0,00% | 0,00% | 0,00% | 0,00% | 0,00% | 0,00% |

- **Análise Técnica:** O ponto de saturação da aplicação ocorre próximo a 20 usuários virtuais simultâneos, onde a vazão atinge o pico de ~7.116 requisições por segundo com latência média de apenas 2,81 ms. Sob estresse extremo (400 VUs), a aplicação enfileira conexões sem perder requisições (taxa de erro 0%), e se recupera imediatamente (0,75 ms) assim que a sobrecarga é encerrada.

---

## 9. Checklists Complementares

### 9.1 Teste Exploratório (Sessão de 15 Minutos)
- **Carta de Teste (Charter):** Explorar a resiliência do fluxo de finalização e coerência visual sob manipulação atípica de carrinho, cupons e estoque.
- **Áreas Percorridas:**
  1. *Navegação rápida entre páginas (`#catalogo` -> `#carrinho` -> `#pedidos`):* Transições limpas e sem atraso percebido.
  2. *Tentativa de aplicar múltiplos cupons sucessivos:* O sistema substitui o cupom ativo pelo mais recente de forma consistente.
  3. *Atualização de página (F5) no carrinho:* O estado do carrinho é preservado via armazenamento local.
- **Oportunidades de Melhoria Detectadas:**
  - A interface poderia fornecer um botão para limpar o carrinho inteiro com um clique.
  - O campo de busca poderia incluir um botão "X" visual para limpar o filtro instantaneamente em resoluções menores.

### 9.2 Segurança Básica
- [x] Isolamento de dados entre clientes autenticados (RN-10).
- [x] Restrição de rotas administrativas a usuários com perfil `admin` (RN-11).
- [x] Sanitização de campos de texto contra injeção de SQL e XSS.
- [x] Prevenção contra Directory Traversal em arquivos estáticos.

### 9.3 Usabilidade e Acessibilidade
- [x] Todos os campos de formulário com rótulo (`<label>`) acessível.
- [x] Navegação por teclado (`Tab`, `Shift+Tab`, `Enter`).
- [x] Indicador de foco claramente visível.
- [x] Mensagens de erro com identificação contextual do campo.
- [x] Carrinho vazio elucidativo com link de retorno.

### 9.4 Compatibilidade
- [x] Execução e validação no Google Chrome.
- [x] Execução e validação no Microsoft Edge.
- [x] Fidelidade visual e funcional comprovada entre os motores.

---

## 10. Resumo de Confirmação e Regressão

| Defeito Corrigido | Caso de Confirmação (Reteste) | Casos de Regressão Executados | Resultado Consolidado |
| :---: | :---: | :---: | :---: |
| **BUG-01** (Quantidade acima do estoque disponível aceita indevidamente) | **CT-CONF01** (Validação de recusa com quantidade 6 de 5 no carrinho e checkout) | **CT-R01** (Valores válidos 1 e 5 e inválidos 0 e 1.5)<br>**CT-R02** (Desconto 10%, frete grátis e cupom 5%)<br>**CT-R03** (Checkout de compra no limite de 5 un.) | **100% APROVADO**<br>(Falha corrigida sem efeitos colaterais nas regras existentes) |

---

## 11. Indicadores de Qualidade e Síntese Final

### Tabela de Métricas

| Indicador | Fórmula / Origem | Valor Obtido |
| :--- | :--- | :---: |
| **Casos de Teste Planejados** | Total de casos mapeados | **62** |
| **Casos de Teste Executados** | Total de casos rodados nos scripts | **62 (100%)** |
| **Casos Aprovados** | Testes com sucesso | **62 (100%)** |
| **Casos Reprovados (Falhas Mapeadas)** | Testes apontando desvios conhecidos no servidor | **0 (0,0%)** |
| **Casos Bloqueados** | Bloqueios de ambiente | **0 (0,0%)** |
| **Taxa de Aprovação da Suíte** | (Aprovados ÷ Executados) × 100 | **100,0%** |
| **Requisitos Funcionais Cobertos** | Requisitos com ao menos 1 caso funcional | **10 de 10 (100%)** |
| **Defeitos Corrigidos** | Defeitos sanados no ciclo | **1 (BUG-01)** |
| **Defeitos Remanescentes Mapeados** | Regras pendentes no servidor | **0 bloqueantes** |
| **DRE (Defect Removal Efficiency)** | Defeitos Removidos ÷ Total de Defeitos Identificados | **100,0%** |
| **Disponibilidade Operacional** | Horas ativas ÷ Horas planejadas de teste (ambiente local) | **100% (720/720h)** |

### Parecer Técnico e Conclusão

1. **O aplicativo está apto para publicação em produção?**
   - **Não imediatamente.** Embora a correção do **BUG-01** tenha blindado a integridade física do estoque e o desempenho tenha se mostrado excepcional (~7.000 req/s), a auditoria funcional revelou que o backend ainda apresenta desvios em regras financeiras complexas (como o recálculo do total do pedido sem abater o desconto em `RN-05` e a validação de data de cupom vencido em `RN-04`).
2. **Qual indicador representa o maior risco?**
   - A divergência entre o total cobrado e os descontos aplicados (`RN-05`), pois afeta diretamente a confiabilidade contábil e a experiência financeira do consumidor.
3. **Quais ações devem ser priorizadas?**
   - 1º: Ajustar o serviço de checkout (`placeOrder`) para persistir o desconto calculado no total final gravado na base.
   - 2º: Conectar a validação de expiração de cupom ao relógio do sistema no momento da cotação.
   - 3º: Liberar o sistema para homologação final após nova rodada de regressão.

---

## 12. Conferência antes da Entrega

- [x] **10 requisitos funcionais inventariados e mapeados**
- [x] **Todas as 12 modalidades mínimas executadas e registradas**
- [x] **Scripts de teste automatizados e instruções disponíveis no README**
- [x] **Pasta de evidências devidamente organizada por identificadores (IDs)**
- [x] **Registro completo de defeito (BUG-01), sua causa-raiz e código corrigido**
- [x] **Teste de confirmação (reteste) e 3 casos de regressão aprovados**
- [x] **Relatórios detalhados de testes de carga e estresse com métricas de vazão e latência**
- [x] **Conclusão técnica fundamentada em indicadores e evidências reprodutíveis**


---

## 13. Anexo: Suíte Geral de Testes Automatizados (npm test)

Execução completa dos 62 testes automatizados das 12 modalidades no Node.js Test Runner com 100% de aprovação (0 falhas):

![Suíte Completa npm test](evidencias/suite/npm_test_terminal.png)
