# Data Model — Plans

Módulo backend `plans` (Medusa v2, `model.define`). Duas entidades: `Plan` e `Benefit` (1‑para‑N).

## Entity: Plan (`plan`)

Representa um plano/oferta exibido na seção de planos da home.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | id (pk) | sim | auto | `model.id().primaryKey()` |
| `name` | text | sim | — | Nome do plano (ex.: "Profissional", "Tax Partner", "Corporativo") |
| `value_label` | text | sim | — | Valor exibido como texto (ex.: "gratuito", "R$ 5.000", "sob demanda") |
| `tagline` | text | sim | — | Frase-chamada/subtítulo (ex.: "EXPERIMENTE ENCONTRAR…") |
| `cta_label` | text | sim | — | Rótulo do botão (ex.: "COMEÇAR AGORA!") |
| `cta_url` | text | sim | — | Destino do botão (URL absoluta ou caminho interno) |
| `is_highlighted` | boolean | sim | `false` | Plano em destaque (no máx. 1 por vez) |
| `is_active` | boolean | sim | `true` | Apenas ativos aparecem na home |
| `rank` | number | sim | `0` | Ordem de exibição (asc) |
| `benefits` | hasMany → Benefit | — | — | Lista de benefícios |
| `created_at` / `updated_at` | datetime | auto | auto | Gerenciados pelo Medusa |

**Validation rules** (aplicadas via zod nos endpoints admin + serviço):
- `name`, `value_label`, `tagline`, `cta_label`, `cta_url` não vazios.
- `cta_url`: URL absoluta válida (`http(s)://…`) **ou** caminho interno começando com `/`.
- `rank`: inteiro ≥ 0.
- `is_highlighted`: ao definir `true`, o serviço garante que todos os demais planos fiquem `false` (invariante de destaque único — FR-017).

## Entity: Benefit (`plan_benefit`)

Item de valor associado a um plano.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | id (pk) | sim | auto | |
| `text` | text | sim | — | Texto do benefício |
| `is_highlighted` | boolean | sim | `false` | Marcador especial (ícone "joia") vs. marcador padrão (check) |
| `rank` | number | sim | `0` | Ordem na lista (asc) |
| `plan` | belongsTo → Plan | sim | — | Plano dono |

**Validation rules**:
- `text` não vazio; `rank` inteiro ≥ 0.

## Relationships

- `Plan` **hasMany** `Benefit`; `Benefit` **belongsTo** `Plan` (relação interna do módulo `plans`, via `model.hasMany`/`model.belongsTo`). Deleção de um plano remove seus benefícios (cascade do módulo).
- Sem links para outros módulos (Product/Region) nesta versão.

## Ordering & exibição

- Home (`/store/plans`): filtra `is_active = true`, ordena planos por `rank` asc, e benefícios por `rank` asc.
- Admin: lista todos (ativos e inativos), permite reordenar (atualiza `rank`).

## State transitions

`Plan.is_active`: `ativo ⇄ inativo` (toggle pelo admin). Apenas `ativo` é visível na home. Sem outros estados.

## Default seed content (FR-020) — referência

1. **Profissional** — `value_label`="gratuito" — destaque=false — CTA "COMEÇAR AGORA!" → cadastro gratuito
   - Visualização das Soluções na Plataforma
   - Avaliação de Soluções e Comentários
   - Descontos e benefícios exclusivos! *(highlighted)*
   - *ASSINATURAS GRATUITAS POR TEMPO LIMITADO
2. **Tax Partner** — `value_label`="R$ 5.000" — **destaque=true** — CTA "INCLUIR MINHA SOLUÇÃO" → cadastro de fornecedor
   - Inclusão da solução (softwares e serviços) na plataforma
   - Ativação da marca no Report de Tax Transformation
   - Publicação no blog interno
   - Benefícios exclusivos para Tax Partners! *(highlighted)*
   - We create amazing digital products.
3. **Corporativo** — `value_label`="sob demanda" — destaque=false — CTA "FALAR COM UM CONSULTOR" → contato comercial
   - Demandas tributárias personalizadas
   - Busca e seleção de fornecedores
   - Acompanhamento com consultor
   - Benefícios na negociação de soluções! *(highlighted)*

`rank` sugerido: Profissional=0, Tax Partner=1, Corporativo=2 (benefícios na ordem listada).
