# Feature Specification: Estrelas de Avaliação por Padrão na Vitrine (Default Review Stars)

**Feature Branch**: `003-default-review-stars`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Show Review Seller Default — exibir as estrelas no produto da vitrine mesmo que ainda não tenha review preenchido; todos os produtos exibem estrelas em cinza claro por padrão; quando o produto for avaliado as estrelas são preenchidas automaticamente."

## Visão Geral / Relação com a feature 002

Esta feature **refina** a `002-seller-review-stars-plp`. Hoje (após a 002), a linha de estrelas só é exibida quando há dado de avaliação válido no card; quando o dado está ausente/indisponível, **nenhuma** estrela é mostrada. Esta feature muda o comportamento padrão: **toda** card de produto na vitrine passa a exibir a linha de 5 estrelas **por padrão** (cinza claro quando não há avaliação), e o preenchimento reflete a avaliação automaticamente conforme avaliações surgem. Ou seja, a presença das estrelas deixa de depender da existência de avaliações — elas são o estado-base de todo card.

> **Supersede**: a regra da 002 de "não exibir estrelas quando o dado está ausente" é substituída por "exibir estrelas cinza por padrão". A robustez permanece: o bloco de estrelas nunca pode quebrar o card.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estrelas sempre visíveis por padrão (Priority: P1)

Um visitante navega pela vitrine (busca ou categoria) e vê, em **todos** os cards de produto, uma linha de 5 estrelas. Para produtos ainda sem avaliação, as estrelas aparecem em **cinza claro** (estado vazio padrão), comunicando que a avaliação existe como recurso e ainda não foi preenchida — sem nunca ocultar a linha de estrelas.

**Why this priority**: É o objetivo central da feature (CA001). Garante consistência visual da vitrine e a presença permanente do indicador de avaliação.

**Independent Test**: Abrir a vitrine por categoria e por busca e confirmar que 100% dos cards exibem a linha de 5 estrelas, com produtos sem avaliação mostrando todas as estrelas em cinza claro.

**Acceptance Scenarios**:

1. **Given** uma vitrine com produtos sem nenhuma avaliação, **When** a listagem carrega, **Then** todos os cards exibem 5 estrelas em cinza claro (estado padrão).
2. **Given** um produto cujo dado de avaliação está ausente/indisponível, **When** o card é exibido, **Then** a linha de 5 estrelas cinza claro ainda é exibida por padrão (em vez de nenhuma estrela) e o card é renderizado normalmente.
3. **Given** a vitrine por busca e por categoria, **When** os produtos são exibidos, **Then** o comportamento padrão das estrelas é idêntico nas duas origens.

---

### User Story 2 - Preenchimento automático conforme avaliações (Priority: P1)

À medida que um produto passa a ter avaliações, as estrelas do card são preenchidas automaticamente para refletir a avaliação atual, sem qualquer ação manual.

**Why this priority**: É o segundo critério de aceite (CA002) e dá sentido ao indicador: o estado padrão evolui para refletir a reputação real.

**Independent Test**: Para um produto que recebeu avaliações, abrir a vitrine e confirmar que as estrelas preenchidas correspondem à avaliação; comparar com um produto sem avaliação (cinza claro).

**Acceptance Scenarios**:

1. **Given** um produto que passou a ter avaliações, **When** a vitrine é exibida (em um novo carregamento da listagem), **Then** as estrelas aparecem preenchidas conforme a avaliação atual.
2. **Given** dois produtos — um avaliado e um sem avaliação — **When** ambos aparecem na vitrine, **Then** o avaliado mostra estrelas preenchidas e o sem avaliação mostra estrelas cinza claro.

---

### Edge Cases

- **Sem avaliações**: estado padrão = 5 estrelas cinza claro (não é erro).
- **Dado de avaliação ausente/indisponível**: ainda assim exibir o estado padrão (5 estrelas cinza claro) — a presença das estrelas não depende do dado. (mudança em relação à 002)
- **Falha ao renderizar as estrelas**: o card do produto deve continuar sendo exibido; o bloco de estrelas nunca pode quebrar a listagem (no pior caso, recai no estado padrão cinza ou simplesmente não interfere no restante do card).
- **Avaliação fracionária / fora do intervalo**: preenchimento conforme o padrão visual existente, limitado ao intervalo de 0 a 5.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao listar produtos na vitrine (busca ou categoria), **todos** os cards MUST exibir uma linha de 5 estrelas por padrão.
- **FR-002**: Quando o produto não possui nenhuma avaliação, as 5 estrelas MUST ser exibidas em **cinza claro** (estado vazio/padrão).
- **FR-002a**: As estrelas vazias (cinza claro) MUST ter contraste suficiente para serem **claramente visíveis** sobre o fundo claro/branco do card. Em particular, NÃO podem ser brancas (ou quase brancas) a ponto de se tornarem invisíveis sobre o card. *(Regra estabelecida após constatar que as estrelas vazias estavam sendo pintadas de branco e, portanto, invisíveis sobre o card branco.)*
- **FR-002b**: As estrelas vazias e as estrelas preenchidas MUST ser visualmente distinguíveis entre si: estrela preenchida em tom escuro (avaliação) vs. estrela vazia em **cinza claro** (ausência de avaliação naquela posição).
- **FR-003**: A linha de estrelas MUST aparecer por padrão mesmo quando ainda não há avaliação ou quando o dado de avaliação está ausente/indisponível (a presença das estrelas não depende da existência de avaliações).
- **FR-004**: Conforme o produto recebe avaliações, as estrelas MUST refletir automaticamente a avaliação atual (preenchimento proporcional), sem intervenção manual.
- **FR-005**: O bloco de estrelas MUST nunca impedir a exibição do produto; qualquer falha é isolada ao card e recai no estado padrão (cinza claro), mantendo a vitrine funcional.
- **FR-006**: O comportamento padrão das estrelas MUST ser consistente entre as origens da vitrine (busca e categoria).
- **FR-007**: A apresentação das estrelas (posição no card, tamanho, cor de preenchido vs. cinza claro) MUST seguir o padrão visual já adotado na vitrine (consistente com a referência de design da 002).

### Key Entities *(include if feature involves data)*

- **Avaliação (Review)**: avaliação que contribui para a nota exibida no card; cada uma possui uma nota. A nota exibida é derivada do conjunto de avaliações associadas.
- **Produto (na vitrine)**: item exibido em card; sempre apresenta a linha de estrelas (estado padrão cinza claro quando sem avaliação; preenchida quando avaliado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (CA001)**: **100%** dos cards de produto na vitrine exibem a linha de estrelas, independentemente de haver ou não avaliações (produtos sem avaliação mostram cinza claro).
- **SC-002 (CA002)**: Para produtos com avaliações, **100%** dos cards exibem o preenchimento correspondente à avaliação atual em um novo carregamento da vitrine.
- **SC-003**: **Nenhum** card deixa de exibir a linha de estrelas por ausência/indisponibilidade de dado de avaliação.
- **SC-004**: A vitrine continua sendo exibida normalmente em **100%** dos casos de falha do recurso de estrelas (nenhuma quebra de listagem).
- **SC-005**: A mudança não aumenta perceptivelmente o tempo de carregamento da vitrine.
- **SC-006**: Em **100%** dos cards, as estrelas vazias (cinza claro) são perceptivelmente visíveis sobre o fundo do card (nenhuma estrela "invisível"/branca), e distinguíveis das estrelas preenchidas.

## Assumptions

- **Fonte da avaliação**: a nota exibida no card é a **avaliação agregada do seller** do produto (continuidade direta da 002 e do título "Show Review Seller Default"). A expressão "avaliação do produto" nos critérios é interpretada como "as estrelas exibidas no card do produto", cuja fonte é a reputação do seller. *(Se o objetivo for uma nota por produto a partir de avaliações específicas do produto, o escopo muda — confirmar antes do planejamento.)*
- **"Preenchidas automaticamente"**: significa que, em um novo carregamento da listagem após existirem avaliações, o preenchimento reflete a nota atual — respeitando o cache existente da vitrine. Não é exigida atualização em tempo real (sem recarregar) nesta versão.
- **"Cinza claro"** = um cinza claro **visível** sobre o card (tom claro porém perceptível), distinto do tom escuro das estrelas preenchidas. A regra anterior (002) reutilizava a cor de "conteúdo sobre ação", que neste contexto resultava em estrelas **brancas/invisíveis** sobre o card branco; esta feature estabelece que a estrela vazia deve usar um cinza claro visível.
- Esta feature **substitui** a regra da 002 de ocultar as estrelas quando o dado está ausente: o padrão passa a ser sempre exibir as estrelas (cinza claro por padrão).
- Escopo limitado à **exibição** das estrelas na vitrine (PLP). Não inclui criação/edição de avaliações nem alterações na página de detalhe do produto ou do seller.
- Intervalo de avaliação de **0 a 5** estrelas; idioma/contexto visual conforme o restante da vitrine.
