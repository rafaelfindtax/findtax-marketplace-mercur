# Feature Specification: Atualização da Área de Planos da Home Page

**Feature Branch**: `001-home-plans-update`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "Feature para atualização do area de planos da home page" (com referência visual de design contendo três planos: Profissional/gratuito, Tax Partner/R$ 5.000, Corporativo/sob demanda). Decisão de escopo: a área de planos deve ser **gerenciável por administradores**, com o conteúdo de referência usado como **conteúdo padrão (default)** inicial.

## User Scenarios & Testing *(mandatory)*

A home page da FIND deve apresentar, de forma clara e persuasiva, os planos disponíveis na plataforma, convidando diferentes perfis de visitantes a iniciarem sua jornada. Hoje essa área é exibida por uma seção reaproveitada ("NOSSOS PLANOS" dentro do bloco *Shop by Style*) que não reflete a oferta comercial real. Esta feature substitui essa área por uma seção de Planos dedicada, fiel ao design de referência, com três planos lado a lado e chamadas para ação distintas.

### User Story 1 - Visitante avalia e escolhe um plano (Priority: P1)

Um visitante que chega à home page rola até a área de planos, compara as três opções (Profissional, Tax Partner, Corporativo), entende o que cada uma oferece e clica na chamada para ação correspondente ao seu interesse.

**Why this priority**: É o coração da feature. Sem a comparação clara dos planos e os botões de ação funcionando, a seção não cumpre seu objetivo comercial de converter visitantes. Entrega valor mesmo isolada das demais histórias.

**Independent Test**: Pode ser testada acessando a home page, localizando a seção de planos, conferindo que os três planos aparecem com título, preço, descrição, lista de benefícios e botão de ação, e que cada botão leva ao destino esperado.

**Acceptance Scenarios**:

1. **Given** um visitante na home page, **When** ele rola até a área de planos, **Then** os três planos (Profissional, Tax Partner, Corporativo) são exibidos lado a lado, cada um com nome, valor em destaque, frase-chamada e lista de benefícios.
2. **Given** o plano Profissional exibido, **When** o visitante clica em "COMEÇAR AGORA!", **Then** ele é direcionado ao fluxo de cadastro gratuito da plataforma.
3. **Given** o plano Tax Partner exibido, **When** o visitante clica em "INCLUIR MINHA SOLUÇÃO", **Then** ele é direcionado ao fluxo de cadastro de fornecedor/solução.
4. **Given** o plano Corporativo exibido, **When** o visitante clica em "FALAR COM UM CONSULTOR", **Then** ele é direcionado ao canal de contato comercial.
5. **Given** a seção de planos, **When** ela é renderizada, **Then** o título de seção ("Comece junto com a gente essa jornada!" com a hashtag "#estounaFIND!") e o rótulo "Planos" são exibidos acima dos cards.

---

### User Story 2 - Administrador gerencia os planos (Priority: P1)

Um administrador da FIND acessa o painel administrativo e edita os planos exibidos na home page — alterando textos, valores, frases, benefícios, rótulos e destinos dos botões, marcando qual plano fica em destaque, reordenando e ativando/desativando planos — e as mudanças passam a valer na home page sem necessidade de alteração de código ou novo deploy.

**Why this priority**: O usuário definiu explicitamente que a área deve ser gerenciável por administradores. Sem isso, a equipe comercial não consegue atualizar a oferta de forma autônoma, que é o objetivo central desta versão. É independentemente testável e entrega valor por si só (capacidade de manter o conteúdo atualizado).

**Independent Test**: Pode ser testada acessando o painel administrativo, editando um plano (ex.: alterar o valor do Tax Partner ou um benefício), salvando, e confirmando que a home page reflete a alteração sem mudança de código.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado no painel, **When** ele edita o texto, valor, frase, benefícios, rótulo ou destino do botão de um plano e salva, **Then** a home page passa a exibir o conteúdo atualizado.
2. **Given** os planos existentes, **When** o administrador marca um plano diferente como "em destaque", **Then** a home page passa a destacar visualmente o plano escolhido.
3. **Given** os planos existentes, **When** o administrador reordena os planos, **Then** a home page exibe os planos na nova ordem.
4. **Given** um plano existente, **When** o administrador o desativa, **Then** ele deixa de ser exibido na home page; **When** o administrador o ativa novamente, **Then** ele volta a ser exibido.
5. **Given** um benefício de um plano, **When** o administrador adiciona, remove ou marca/desmarca um benefício como destacado, **Then** a lista exibida na home page reflete a mudança.
6. **Given** uma instalação nova/sem configuração prévia, **When** a área de planos é carregada pela primeira vez, **Then** ela já apresenta os três planos com o conteúdo padrão de referência (Profissional, Tax Partner, Corporativo).

---

### User Story 3 - Plano em destaque orienta a escolha (Priority: P2)

Um visitante indeciso percebe visualmente qual plano é o recomendado/destacado (Tax Partner, no centro) e dá mais atenção a ele.

**Why this priority**: Aumenta a conversão ao guiar a atenção para o plano comercialmente prioritário, mas a seção já é funcional sem o destaque visual.

**Independent Test**: Pode ser testada verificando que o plano central recebe ênfase visual distinta dos demais (ex.: realce/elevação) em relação aos outros dois cards.

**Acceptance Scenarios**:

1. **Given** os três planos exibidos em telas largas, **When** o visitante observa a seção, **Then** o plano central (Tax Partner) recebe ênfase visual que o diferencia dos planos laterais.

---

### User Story 4 - Visualização em dispositivos móveis (Priority: P2)

Um visitante em smartphone acessa a home page e consegue ler e comparar os planos confortavelmente, com os cards reorganizados para a tela menor.

**Why this priority**: Parte relevante do tráfego é mobile; sem boa leitura em telas pequenas a seção perde efetividade. Ainda assim depende da história P1 já existir.

**Independent Test**: Pode ser testada abrindo a home page em viewport de smartphone e confirmando que os planos empilham verticalmente, permanecem legíveis e os botões continuam acionáveis.

**Acceptance Scenarios**:

1. **Given** um visitante em tela estreita (smartphone), **When** ele acessa a área de planos, **Then** os planos são reorganizados (empilhados) de forma legível e todos os botões permanecem acessíveis.

---

### Edge Cases

- **Benefícios de comprimento variável**: quando as listas de benefícios têm quantidades diferentes de itens, os cards devem manter alinhamento visual coerente sem quebrar o layout.
- **Texto longo / traduções**: títulos, descrições ou rótulos de botão mais longos não devem transbordar nem cortar o conteúdo dos cards.
- **Destino de CTA indisponível**: se um destino de chamada para ação não estiver configurado, o botão deve ter um comportamento de fallback seguro (ex.: apontar para a página inicial/contato) em vez de levar a um link quebrado.
- **Itens com ênfase especial**: alguns benefícios aparecem com marcador diferenciado (ícone de "joia"/destaque) — a seção deve suportar marcar itens como destacados sem quebrar a lista.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A home page MUST exibir uma seção de Planos dedicada, substituindo a atual exibição de planos feita pela seção reaproveitada "NOSSOS PLANOS".
- **FR-002**: A seção MUST apresentar um cabeçalho com a hashtag "#estounaFIND!", o título "Comece junto com a gente essa jornada!" e o rótulo "Planos".
- **FR-003**: A seção MUST exibir exatamente três planos: **Profissional** (valor "gratuito"), **Tax Partner** (valor "R$ 5.000") e **Corporativo** (valor "sob demanda").
- **FR-004**: Cada plano MUST exibir: nome do plano, valor em destaque, frase-chamada (subtítulo), um botão de chamada para ação e uma lista de benefícios.
- **FR-005**: Cada item de benefício MUST ser exibido com um marcador visual (ícone de confirmação), suportando também um marcador de destaque para itens especiais.
- **FR-006**: O botão do plano Profissional MUST exibir o rótulo "COMEÇAR AGORA!" e direcionar ao fluxo de cadastro gratuito da plataforma.
- **FR-007**: O botão do plano Tax Partner MUST exibir o rótulo "INCLUIR MINHA SOLUÇÃO" e direcionar ao fluxo de cadastro de fornecedor/solução.
- **FR-008**: O botão do plano Corporativo MUST exibir o rótulo "FALAR COM UM CONSULTOR" e direcionar ao canal de contato comercial.
- **FR-009**: A seção MUST destacar visualmente o plano central (Tax Partner) em relação aos demais em telas largas.
- **FR-010**: A seção MUST ser responsiva, reorganizando os planos para leitura confortável em telas estreitas (empilhamento vertical em smartphones).
- **FR-011**: A home page MUST exibir os planos a partir do conteúdo gerenciado pelos administradores, refletindo as alterações salvas sem necessidade de alteração de código ou novo deploy.
- **FR-012**: A seção MUST seguir a identidade visual da FIND (paleta/tipografia já usada na home page), mantendo consistência com as demais seções.
- **FR-013**: A seção MUST ser acessível: botões operáveis por teclado, contraste adequado e rótulos compreensíveis por leitores de tela.

#### Gerenciamento por administradores

- **FR-014**: Administradores autenticados MUST poder gerenciar os planos da home page por meio do painel administrativo, sem necessidade de acesso ao código.
- **FR-015**: Administradores MUST poder criar, editar e remover planos, e editar de cada plano: nome, valor exibido, frase-chamada, rótulo do botão e destino do botão.
- **FR-016**: Administradores MUST poder gerenciar a lista de benefícios de cada plano (adicionar, editar, remover, reordenar) e marcar/desmarcar cada benefício como destacado.
- **FR-017**: Administradores MUST poder definir qual plano fica em destaque, garantindo que no máximo um plano esteja em destaque por vez.
- **FR-018**: Administradores MUST poder reordenar os planos e ativar/desativar cada plano; apenas planos ativos MUST ser exibidos na home page.
- **FR-019**: O sistema MUST validar as edições antes de salvar (ex.: campos obrigatórios preenchidos, destino de botão em formato válido) e impedir o salvamento de conteúdo inválido.
- **FR-020**: O sistema MUST prover o conteúdo padrão (default) de referência dos três planos (Profissional, Tax Partner, Corporativo, incluindo benefícios e destaque no Tax Partner) na primeira inicialização, de forma que a área de planos já apareça preenchida e consistente com o design antes de qualquer edição.
- **FR-021**: As alterações feitas por administradores MUST ser persistidas de forma durável, permanecendo após reinicializações do sistema.

### Content Reference *(conteúdo de referência dos planos)*

- **Profissional — gratuito** — "EXPERIMENTE ENCONTRAR O QUE VOCÊ PRECISA, SEM CUSTO!" — Botão: COMEÇAR AGORA!
  - Visualização das Soluções na Plataforma
  - Avaliação de Soluções e Comentários
  - Descontos e benefícios exclusivos! *(destaque)*
  - *ASSINATURAS GRATUITAS POR TEMPO LIMITADO
- **Tax Partner — R$ 5.000** *(plano em destaque)* — "INCLUA SUA SOLUÇÃO TRIBUTÁRIA NA PLATAFORMA, E SEJA ENCONTRADO!" — Botão: INCLUIR MINHA SOLUÇÃO
  - Inclusão da solução (softwares e serviços) na plataforma
  - Ativação da marca no Report de Tax Transformation
  - Publicação no blog interno
  - Benefícios exclusivos para Tax Partners! *(destaque)*
  - We create amazing digital products.
- **Corporativo — sob demanda** — "Encontre soluções de acordo com a demanda da sua empresa!" — Botão: FALAR COM UM CONSULTOR
  - Demandas tributárias personalizadas
  - Busca e seleção de fornecedores
  - Acompanhamento com consultor
  - Benefícios na negociação de soluções! *(destaque)*

### Key Entities *(include if feature involves data)*

- **Plano**: registro gerenciável que representa uma oferta exibida na seção. Atributos: nome, valor (texto exibido), frase-chamada, indicador de destaque, rótulo do botão, destino do botão, ordem de exibição, situação (ativo/inativo) e lista de benefícios. Persistido e editável pelos administradores.
- **Benefício**: item de valor associado a um plano. Atributos: texto, indicador de destaque (marcador especial vs. marcador padrão) e ordem na lista. Gerenciável junto com o plano.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos visitantes da home page passam a ver os três planos com conteúdo correto (nome, valor, frase, benefícios e botão), substituindo completamente a antiga exibição reaproveitada.
- **SC-002**: Cada um dos três botões de chamada para ação leva ao destino correto em 100% dos cliques, sem links quebrados.
- **SC-003**: A seção é legível e totalmente operável em telas de 360px de largura (smartphones) até telas largas, sem transbordo de conteúdo ou botões inacessíveis.
- **SC-004**: Um visitante consegue identificar o plano em destaque e iniciar a ação desejada em menos de 30 segundos a partir do momento em que a seção entra em tela.
- **SC-005**: A seção atende aos critérios de acessibilidade essenciais (navegação por teclado e contraste adequado) verificados em auditoria automatizada sem erros bloqueantes.
- **SC-006**: Um administrador consegue atualizar um plano (texto, valor, benefício, destaque ou ordem) e ver a mudança refletida na home page em menos de 5 minutos, sem alteração de código nem novo deploy.
- **SC-007**: Em uma instalação nova, 100% dos três planos padrão (Profissional, Tax Partner, Corporativo) aparecem corretamente preenchidos antes de qualquer edição administrativa.

## Assumptions

- O conteúdo dos planos é **gerenciável por administradores** e persistido de forma durável; o conteúdo de referência do design é usado como **conteúdo padrão (default)** inicial. A gestão reutiliza o painel administrativo já existente da plataforma (área "Admin"), sem introduzir um sistema de administração paralelo.
- Os **destinos padrão** das chamadas para ação reutilizam os canais já existentes da FIND e podem ser editados pelos administradores: "COMEÇAR AGORA!" → cadastro gratuito (mesmo destino do botão "Começar gratuitamente" do Hero, `app.findtax.com.br`); "INCLUIR MINHA SOLUÇÃO" → cadastro de fornecedor (variável `NEXT_PUBLIC_VENDOR_URL` / `app.findtax.com.br/cadastro`); "FALAR COM UM CONSULTOR" → canal de contato comercial da FIND.
- O controle de acesso ao gerenciamento de planos reutiliza a autenticação/perfis de administrador já existentes no painel; nenhum novo modelo de permissões é introduzido nesta versão.
- A seção de Planos substitui a exibição atual feita pela seção *Shop by Style* ("NOSSOS PLANOS"); o objetivo é uma área de planos fiel ao design de referência, e não um redesign das demais seções da home.
- A feature abrange apenas a apresentação dos planos na home page; o processamento de pagamento, a contratação e o gerenciamento de assinaturas estão fora do escopo.
- Os textos e valores seguem o design de referência fornecido (Profissional/gratuito, Tax Partner/R$ 5.000, Corporativo/sob demanda) e podem ser ajustados posteriormente sem mudança estrutural.
- O idioma de exibição é o português (pt-BR), consistente com o restante da home page da FIND.
