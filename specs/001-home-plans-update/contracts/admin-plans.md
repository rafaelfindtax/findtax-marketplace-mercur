# Contract — Admin API: `/admin/plans`

CRUD de planos para o admin-panel. Autenticação: sessão/token de admin (padrão Medusa admin API). Benefícios são gerenciados **embutidos** no payload do plano (replace-all na atualização).

## Plan payload (shared)

```jsonc
{
  "name": "Tax Partner",
  "value_label": "R$ 5.000",
  "tagline": "INCLUA SUA SOLUÇÃO TRIBUTÁRIA NA PLATAFORMA, E SEJA ENCONTRADO!",
  "cta_label": "INCLUIR MINHA SOLUÇÃO",
  "cta_url": "https://app.findtax.com.br/cadastro",
  "is_highlighted": true,
  "is_active": true,
  "rank": 1,
  "benefits": [
    { "text": "Inclusão da solução (softwares e serviços) na plataforma", "is_highlighted": false, "rank": 0 },
    { "text": "Benefícios exclusivos para Tax Partners!", "is_highlighted": true, "rank": 3 }
  ]
}
```

### Validation (zod, via `api/middlewares.ts`)
- `name`, `value_label`, `tagline`, `cta_label`, `cta_url` → string não vazia.
- `cta_url` → URL absoluta (`http(s)://`) ou caminho interno iniciado por `/`.
- `is_highlighted`, `is_active` → boolean (opcionais; defaults `false`/`true`).
- `rank` → inteiro ≥ 0 (opcional; default na criação).
- `benefits[]` → array; cada item `{ text (não vazio), is_highlighted?: bool, rank?: int≥0 }`.

---

## `GET /admin/plans`
Lista **todos** os planos (ativos e inativos), ordenados por `rank`, com `benefits`.

**200**
```json
{ "plans": [ { "id": "plan_...", "name": "...", "...": "...", "benefits": [] } ] }
```

## `POST /admin/plans`
Cria um plano (com benefícios). Se `is_highlighted=true`, o serviço desmarca os demais.

**Body**: Plan payload (sem `id`). **201/200**: `{ "plan": { ... } }`.

## `GET /admin/plans/:id`
**200**: `{ "plan": { ...comBenefits } }` · **404** se não existir.

## `POST /admin/plans/:id`  (atualização)
Atualiza campos do plano e **substitui** a lista de benefícios pela enviada (replace-all). Se `is_highlighted=true`, desmarca os demais.

**Body**: Plan payload parcial. **200**: `{ "plan": { ... } }`.

## `DELETE /admin/plans/:id`
Remove o plano e seus benefícios (cascade).

**200**: `{ "id": "plan_...", "object": "plan", "deleted": true }`.

---

## Invariante de destaque único (FR-017)
Aplicada na camada de serviço (`PlansModuleService`): qualquer create/update com `is_highlighted=true` executa, na mesma operação, o desmarque (`is_highlighted=false`) de todos os outros planos.

## Admin-panel consumer
`admin-panel/src/hooks/api/plans.ts` — hooks `@tanstack/react-query` (`usePlans`, `usePlan`, `useCreatePlan`, `useUpdatePlan`, `useDeletePlan`) usando o cliente `@medusajs/js-sdk` (`sdk.client.fetch`) contra os endpoints acima. Páginas em `admin-panel/src/routes/plans/` (list/create/edit) com `@medusajs/ui`.
