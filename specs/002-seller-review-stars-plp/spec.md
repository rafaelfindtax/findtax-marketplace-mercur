# Feature Specification: Exibir Avaliação (Estrelas) do Seller na Vitrine de Produtos

**Feature Branch**: `002-seller-review-stars-plp`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Display Review Seller into Product Vitrine — exibir as estrelas de review do seller em cada produto na listagem (PLP), por busca ou categoria; estrelas cinza quando não há review; em caso de erro, não exibir as estrelas e manter o produto normalmente. Design conforme `specs/design/product-card-review.png`."

## User Scenarios & Testing *(mandatory)*

Hoje, na vitrine de produtos (PLP — página de listagem por busca ou por categoria), os cards de produto não mostram nenhuma indicação da reputação do fornecedor (seller). Esta feature passa a exibir, em cada card de produto, as **estrelas de avaliação do seller** responsável por aquele produto, ajudando o visitante a julgar a confiabilidade da solução já na listagem, sem precisar abrir cada produto. O design segue a referência `specs/design/product-card-review.png` (linha de 5 estrelas posicionada acima do título do produto).

### User Story 1 - Visitante vê a reputação do seller na listagem (Priority: P1)

Um visitante navega pela vitrine (por categoria ou por resultado de busca) e, em cada card de produto, vê uma linha de 5 estrelas que representa a avaliação média do seller daquele produto. Isso permite comparar a reputação dos fornecedores antes de clicar.

**Why this priority**: É o núcleo da feature e a única entrega que gera valor direto ao visitante. Sem isso, nada de novo aparece na vitrine.

**Independent Test**: Pode ser testada acessando a PLP (por categoria e por busca) e verificando que cada card exibe a linha de estrelas refletindo a avaliação média do seller do produto.

**Acceptance Scenarios**:

1. **Given** uma listagem de produtos por categoria com produtos de sellers avaliados, **When** a página carrega, **Then** cada card exibe a linha de 5 estrelas refletindo a avaliação média do seller daquele produto.
2. **Given** uma listagem de produtos por busca, **When** os resultados são exibidos, **Then** cada card exibe a linha de estrelas do seller, com o mesmo comportamento da listagem por categoria.
3. **Given** dois produtos do mesmo seller na listagem, **When** a página carrega, **Then** ambos exibem a mesma avaliação (a do seller), pois as estrelas representam o seller e não o produto.
4. **Given** um seller com avaliação média parcial (ex.: 4 de 5), **When** o card é exibido, **Then** o número de estrelas preenchidas reflete a avaliação, conforme o padrão visual da referência de design.

---

### User Story 2 - Produto sem avaliações ainda (Priority: P2)

Um visitante encontra na vitrine um produto cujo seller ainda não recebeu nenhuma avaliação. As estrelas aparecem em cinza (estado vazio), comunicando "sem avaliações" sem esconder o produto.

**Why this priority**: Garante consistência visual e evita confundir ausência de avaliação com erro; importante, mas secundário à exibição principal.

**Independent Test**: Pode ser testada exibindo um produto de seller sem reviews e confirmando que as 5 estrelas aparecem em cinza, com o card íntegro.

**Acceptance Scenarios**:

1. **Given** um produto cujo seller não possui nenhuma avaliação, **When** o card é exibido, **Then** as 5 estrelas aparecem na cor cinza (vazias) e o restante do card é exibido normalmente.

---

### User Story 3 - Falha ao obter a avaliação não quebra a vitrine (Priority: P1)

Quando a avaliação do seller de um produto não pode ser obtida/exibida (erro ou dado ausente/inválido), o card simplesmente não mostra as estrelas, mas continua exibindo o produto normalmente. A listagem nunca quebra por causa das estrelas.

**Why this priority**: É um requisito de robustez crítico (CA002): a vitrine de produtos deve continuar funcionando mesmo se o recurso de avaliação falhar.

**Independent Test**: Pode ser testada simulando falha/ausência do dado de avaliação para um produto e confirmando que o card é exibido sem a linha de estrelas e sem erro perceptível, enquanto os demais cards seguem normais.

**Acceptance Scenarios**:

1. **Given** um produto cuja avaliação do seller não pôde ser carregada (erro), **When** o card é exibido, **Then** nenhuma estrela (nem placeholder de erro) é mostrada nesse card e o produto aparece normalmente.
2. **Given** uma falha na avaliação de um único produto, **When** a listagem é exibida, **Then** os demais produtos continuam exibindo suas estrelas normalmente (a falha é isolada por card).

---

### Edge Cases

- **Sem reviews** (lista vazia): 5 estrelas cinza (estado vazio), não tratado como erro.
- **Dado de avaliação ausente/malformado** (seller ou reviews indisponíveis/ inválidos): não exibir estrelas; manter o produto. (distinto do estado "cinza")
- **Avaliação fracionária** (ex.: 4,5): exibida conforme o padrão visual da referência de design (arredondamento consistente).
- **Avaliação fora do intervalo** (valores inesperados): limitada ao intervalo de 0 a 5 estrelas.
- **Produto sem seller associado**: tratado como ausência de avaliação (não exibir estrelas), mantendo o produto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Em toda a vitrine de produtos (PLP), seja por **busca** ou por **categoria**, cada card de produto MUST exibir uma linha de 5 estrelas representando a **avaliação média do seller** do produto.
- **FR-002**: As estrelas MUST representar a avaliação do **seller** (agregada a partir das avaliações recebidas pelo seller), e não a avaliação individual do produto.
- **FR-003**: A quantidade de estrelas preenchidas MUST refletir a avaliação média do seller, conforme o padrão visual definido na referência de design.
- **FR-004**: Quando o seller não possui **nenhuma** avaliação, o card MUST exibir as 5 estrelas em **cinza** (estado vazio), sem ocultar o produto.
- **FR-005**: Em caso de **erro** ou dado de avaliação ausente/inválido, o card MUST **não exibir nada** no lugar das estrelas e MUST continuar exibindo o produto normalmente.
- **FR-006**: A falha de avaliação em um card MUST ser isolada, sem impedir a exibição das estrelas dos demais produtos nem o carregamento da listagem.
- **FR-007**: A apresentação das estrelas (formato, tamanho, posição no card, cores de preenchido/vazio) MUST estar de acordo com a referência de design `specs/design/product-card-review.png`.
- **FR-008**: O comportamento das estrelas MUST ser consistente entre as duas origens da listagem (busca e categoria).

### Key Entities *(include if feature involves data)*

- **Seller**: fornecedor responsável por um produto. Para esta feature, importa sua **avaliação média** (derivada das avaliações recebidas) e a **quantidade de avaliações** (para distinguir "sem avaliações").
- **Review (Avaliação)**: avaliação recebida por um seller; cada uma possui uma nota (rating). A avaliação média do seller é derivada do conjunto de suas avaliações.
- **Produto (na vitrine)**: item exibido em card na PLP; está associado a um seller, cuja avaliação é exibida no card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (CA001)**: Ao carregar a vitrine (busca ou categoria), **100%** dos cards de produtos cujo seller possui avaliação exibem a linha de estrelas correspondente à avaliação média do seller.
- **SC-002 (CA002)**: Em caso de erro na obtenção/exibição da avaliação, **100%** dos produtos afetados continuam sendo exibidos normalmente (sem estrelas), e a listagem nunca deixa de carregar por esse motivo.
- **SC-003**: Produtos de sellers sem avaliações exibem as 5 estrelas em cinza em **100%** dos casos (nenhum é confundido com erro/ocultado).
- **SC-004**: A apresentação das estrelas corresponde à referência de design (verificação visual aprovada) em todos os tamanhos de tela suportados pela vitrine.
- **SC-005**: A inclusão das estrelas não aumenta perceptivelmente o tempo de carregamento da vitrine em relação ao comportamento atual.

## Assumptions

- A avaliação exibida é a **média das avaliações do seller**, calculada a partir das avaliações já disponíveis no card do produto (o dado de seller e suas avaliações já é carregado junto da listagem hoje), reutilizando o mesmo critério de cálculo de média já adotado em outras telas (página do seller e detalhe do produto).
- O preenchimento das estrelas segue o **padrão visual já existente** no componente de estrelas do produto (preenchimento por estrela inteira conforme a média), mantendo coerência com a referência de design; meia-estrela não é requerida.
- "Estado vazio" (sem avaliações = estrelas cinza) e "estado de erro" (não exibir nada) são **distintos**: ausência de avaliações NÃO é erro.
- A feature abrange apenas a **exibição** das estrelas na vitrine (PLP). Não inclui criar/editar avaliações, nem alterar a página de detalhe do produto ou a página do seller.
- O intervalo de avaliação é de **0 a 5 estrelas**.
- O idioma e o contexto visual seguem o restante da vitrine da FIND.
