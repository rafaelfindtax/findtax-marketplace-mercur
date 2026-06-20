# Feature Specification: Filtros Facetados na Página de Categorias

**Feature Branch**: `004-category-filters`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Filtros na página de Categorias — exibir filtros facetados (checkbox) nas páginas de categoria para personalizar a busca de produtos, com contagem por opção, aplicação automática, tags dos filtros selecionados no topo (removíveis individualmente), opção de limpar tudo, e mensagem quando não há resultados. Design conforme `specs/design/prototype/filtros-faces-category-page.png`, mantendo cores/fontes da FIND."

## Visão Geral / Layout (conforme protótipo)

O protótipo `specs/design/prototype/filtros-faces-category-page.png` define o layout (que prevalece sobre eventuais divergências de texto "esquerda/direita"):
- **Painel de filtros à esquerda** (sidebar), com a grade de **produtos à direita**.
- Cada **seção de filtro** tem um **título** e é separada das demais por **divisória**.
- Cada **opção** de filtro é um **checkbox** com o rótulo e a **contagem à direita** (ex.: `Tecnologia (5)`, `Evollux (4)`).
- No **topo da página**: as **tags** dos filtros selecionados (cada uma removível por um "✕") e a ação **"Limpar filtros" / "Clear All"**.
- Mantém a identidade visual da FIND (cores e fontes existentes).

Aplica-se às páginas: `/{locale}/categories` (todos os produtos) e `/{locale}/categories/{category}` (categoria específica).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refinar a busca com filtros facetados (Priority: P1)

Um visitante abre a página de categorias e vê, à esquerda, as seções de filtros na ordem definida. Ao marcar checkboxes, a grade de produtos é refinada **automaticamente** (sem botão "aplicar"), mostrando apenas os produtos que atendem aos filtros. Cada opção exibe a quantidade de produtos correspondente.

**Why this priority**: É o núcleo da feature (CA001/CA002) — sem a exibição e a aplicação dos filtros não há valor.

**Independent Test**: Abrir `/br/categories` e `/br/categories/{category}`, confirmar que as seções de filtros aparecem na ordem correta com contagens, e que marcar opções refina os produtos automaticamente.

**Acceptance Scenarios**:

1. **Given** a página de categorias carregada, **When** ela é exibida, **Then** o painel de filtros é mostrado com as seções, na ordem: **Categorias do Produto → Nome do Fornecedor → Nome do Produto → Integrações com ERP → Modelo de Entrega → Produtos Avaliados**, cada uma separada por divisória.
2. **Given** uma seção de filtro com opções, **When** ela é exibida, **Then** cada opção aparece como checkbox com a **contagem** de produtos à direita (ex.: `Evollux (4)`).
3. **Given** o usuário marca uma opção de filtro, **When** o clique ocorre, **Then** a grade de produtos é atualizada automaticamente para refletir o filtro, sem recarregar manualmente nem precisar confirmar.
4. **Given** múltiplas opções marcadas, **When** aplicadas, **Then** os produtos exibidos atendem à combinação de filtros selecionados.
5. **Given** a página específica `/br/categories/{category}`, **When** exibida, **Then** os filtros operam dentro do contexto daquela categoria.

---

### User Story 2 - Tags dos filtros selecionados e limpeza (Priority: P1)

Conforme o usuário seleciona filtros, cada seleção vira uma **tag** no topo da página. Ele pode **remover uma tag individualmente** (recarregando a busca sem aquele filtro) ou usar **"Limpar filtros"** para resetar tudo e voltar a ver todos os produtos.

**Why this priority**: É o critério CA004 e essencial para o usuário entender e controlar o estado dos filtros.

**Independent Test**: Selecionar 2+ filtros, confirmar que aparecem como tags no topo; remover uma tag e ver a busca atualizar sem aquele filtro; clicar em "Limpar filtros" e ver todos os produtos retornarem.

**Acceptance Scenarios**:

1. **Given** um ou mais filtros selecionados, **When** aplicados, **Then** cada filtro aparece como uma **tag** na parte superior da página (conforme o protótipo).
2. **Given** uma tag de filtro no topo, **When** o usuário clica no "✕" da tag, **Then** apenas aquele filtro é removido e a busca é atualizada automaticamente.
3. **Given** filtros aplicados, **When** o usuário clica em **"Limpar filtros"**, **Then** todos os filtros são removidos e a página recarrega exibindo **todos** os produtos.

---

### User Story 3 - Sem resultados / erro (Priority: P2)

Quando a combinação de filtros não retorna produtos (ou ocorre um erro ao filtrar), o usuário vê uma mensagem clara em vez de uma área vazia.

**Why this priority**: É o critério CA003; melhora a experiência mas depende das histórias anteriores existirem.

**Independent Test**: Selecionar uma combinação de filtros sem produtos e confirmar a mensagem exata.

**Acceptance Scenarios**:

1. **Given** uma combinação de filtros sem produtos correspondentes, **When** o resultado é exibido, **Then** a página mostra a mensagem: **"Nenhum produto encontrado para o filtro selecionado."**
2. **Given** um erro ao aplicar/carregar os filtros, **When** ocorre, **Then** a mesma mensagem é exibida e a página permanece utilizável (filtros e tags continuam acessíveis para ajuste).

---

### User Story 4 - Seções de filtro sempre visíveis (Priority: P2)

As seis seções de filtro aparecem na página de categorias **mesmo quando não há produtos atrelados** àquela seção (ex.: Integrações com ERP, Modelo de Entrega, Produtos Avaliados ainda sem dados), preservando a ordem e as divisórias.

**Why this priority**: Requisito explícito do usuário; garante consistência visual e previsibilidade do layout, mesmo antes de os dados existirem.

**Independent Test**: Em uma base sem dados para ERP/Modelo de Entrega/Produtos Avaliados, confirmar que essas seções ainda aparecem (na ordem correta) na página de categorias.

**Acceptance Scenarios**:

1. **Given** seções de filtro sem nenhuma opção/produto atrelado, **When** a página é exibida, **Then** essas seções ainda aparecem (título + divisória), na ordem definida.
2. **Given** uma seção sem opções, **When** exibida, **Then** ela comunica o estado vazio de forma adequada (sem opções selecionáveis), sem quebrar o layout nem a ordem das demais seções.

---

### Edge Cases

- **Seção vazia** (sem opções/contagem): a seção aparece mesmo assim (US4), sem opções clicáveis.
- **Nenhum resultado**: mensagem "Nenhum produto encontrado para o filtro selecionado." (US3).
- **Erro ao filtrar**: mesma mensagem; página continua utilizável.
- **Combinação que zera resultados**: contagens podem ficar 0; o usuário ainda consegue remover filtros (tags/limpar) para recuperar resultados.
- **Compartilhamento/atualização de URL**: ao recarregar a página com filtros aplicados, o estado dos filtros e as tags devem permanecer consistentes com o que está sendo exibido.
- **Responsivo/mobile**: o acesso aos filtros e às tags deve permanecer utilizável em telas menores (conforme a dinâmica do protótipo).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: As páginas `/{locale}/categories` e `/{locale}/categories/{category}` MUST exibir um painel de filtros facetados (conforme o protótipo).
- **FR-002**: O painel MUST apresentar as seções na ordem exata: **(1) Categorias do Produto, (2) Nome do Fornecedor, (3) Nome do Produto, (4) Integrações com ERP, (5) Modelo de Entrega, (6) Produtos Avaliados**.
- **FR-003**: Cada seção MUST ser separada das demais por uma **divisória** e ter um **título** identificável.
- **FR-004**: A seleção de filtros MUST usar **checkboxes**; dentro de uma seção, múltiplas opções podem ser selecionadas.
- **FR-005**: Cada opção de filtro MUST exibir a **quantidade** de produtos correspondente, à direita do rótulo (ex.: `Tecnologia (5)`).
- **FR-006**: Ao selecionar/desmarcar uma opção, a grade de produtos MUST ser refinada **automaticamente**, sem ação manual de "aplicar".
- **FR-007**: Os filtros selecionados MUST ser exibidos como **tags** na parte superior da página (conforme o protótipo).
- **FR-008**: Cada tag MUST poder ser **removida individualmente**, atualizando a busca para refletir a remoção daquele filtro.
- **FR-009**: A página MUST oferecer uma ação **"Limpar filtros"** na parte superior que remove todos os filtros e recarrega a listagem com **todos** os produtos.
- **FR-010**: Quando nenhum produto corresponder aos filtros (ou em caso de erro), a página MUST exibir a mensagem exata: **"Nenhum produto encontrado para o filtro selecionado."**
- **FR-011**: As seis seções de filtro MUST aparecer na página **mesmo quando não houver produtos/opções atrelados** àquela seção, preservando ordem e divisórias.
- **FR-012**: O estado dos filtros aplicados MUST ser refletido de forma consistente entre o painel, as tags e a grade de produtos (inclusive ao recarregar a página).
- **FR-013**: A interface MUST manter a identidade visual da FIND (cores e fontes existentes) e seguir a dinâmica do protótipo.

### Non-Functional Requirements

- **NFR-001**: Os filtros MUST operar sobre o mecanismo de busca facetada já utilizado pela vitrine (Algolia), incluindo as contagens por faceta.
- **NFR-002**: A aplicação de um filtro MUST refletir na grade de produtos de forma praticamente imediata (percepção de resposta instantânea).

### Key Entities *(include if feature involves data)*

- **Seção de Filtro**: agrupamento nomeado de opções (ex.: "Nome do Fornecedor"), exibido em ordem fixa, com divisória. Pode estar vazia.
- **Opção de Filtro**: valor selecionável dentro de uma seção (ex.: "Evollux"), com uma **contagem** de produtos associada e estado marcado/desmarcado.
- **Filtro Ativo (Tag)**: representação, no topo, de uma opção selecionada; removível individualmente.
- **Produto (na grade)**: item exibido que atende (ou não) ao conjunto de filtros ativos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (CA001)**: Em **100%** dos acessos às páginas de categoria (geral e específica), o painel de filtros é exibido com as seis seções na ordem definida.
- **SC-002 (CA002)**: Ao marcar qualquer opção, a grade passa a exibir **apenas** produtos que atendem ao(s) filtro(s) selecionado(s), de forma automática.
- **SC-003 (CA003)**: Quando não há produtos para os filtros, **100%** dos casos exibem a mensagem "Nenhum produto encontrado para o filtro selecionado.".
- **SC-004 (CA004)**: Cada filtro selecionado aparece como tag no topo e pode ser removido individualmente; ao remover, a busca é atualizada removendo apenas aquele filtro.
- **SC-005**: A ação "Limpar filtros" remove todos os filtros e a listagem volta a exibir todos os produtos em **100%** dos casos.
- **SC-006**: As contagens exibidas por opção correspondem ao número de produtos que seriam retornados ao aplicar aquela opção (consistência faceta/contagem).
- **SC-007**: As seções sem dados ainda aparecem na ordem correta em **100%** dos casos (nenhuma seção definida some por falta de dados).
- **SC-008**: O refinamento percebido após um clique ocorre em menos de ~1 segundo na grande maioria das interações (resposta instantânea ao usuário).

## Assumptions

- **Layout (protótipo prevalece)**: filtros em sidebar à esquerda, produtos à direita; contagem à **direita** de cada opção; tags + "Limpar filtros" no **topo**. Isso resolve a divergência textual "lado direito/esquerdo" do pedido.
- **Mapeamento das seções para facetas** (rótulos amigáveis substituem os nomes técnicos vistos no protótipo): Categorias do Produto → categorias do produto; Nome do Fornecedor → fornecedor (seller); Nome do Produto → título do produto; Produtos Avaliados → avaliação do produto/seller.
- **Dependência de dados para ERP/Modelo de Entrega/Produtos Avaliados**: "Integrações com ERP" e "Modelo de Entrega" correspondem a **atributos de produto que podem ainda não existir nos dados nem no índice de busca**. Esta feature garante a **exibição das seções** (mesmo vazias, FR-011) e o **filtro funcional quando os dados/facetas existirem**. A criação/indexação desses atributos (no backend e no índice) é uma **dependência** que, se ausente, mantém a seção visível porém sem opções até os dados serem providos.
- **Seleção múltipla por seção**: dentro de uma seção, marcar várias opções amplia o resultado (lógica "ou" entre opções da mesma seção), comportamento padrão de filtros facetados.
- **Escopo de renderização**: as páginas de categoria usam a listagem com busca facetada (Algolia) para visitantes; cenários de fallback sem Algolia (ex.: rastreadores/SSR sem busca) estão fora do escopo desta feature.
- **Persistência de estado**: o estado dos filtros é refletido na URL/contexto da página, de modo que recarregar mantém filtros e tags consistentes (FR-012).
- **Idioma/visual**: rótulos em pt-BR e identidade visual da FIND.
- Escopo limitado à **experiência de filtros** nas páginas de categoria; não inclui redesenho do card de produto nem criação de novas telas.
