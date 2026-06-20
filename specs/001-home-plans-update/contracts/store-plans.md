# Contract — Store API: `GET /store/plans`

Endpoint público (storefront) que retorna os planos a exibir na home.

## Request

```
GET /store/plans
Headers:
  x-publishable-api-key: <pk_...>   # obrigatório (padrão Medusa store API)
```

Sem query params nesta versão (retorna todos os ativos, ordenados).

## Behavior

- Retorna **apenas** planos com `is_active = true`.
- Planos ordenados por `rank` asc; benefícios de cada plano ordenados por `rank` asc.

## Response `200 OK`

```json
{
  "plans": [
    {
      "id": "plan_01J...",
      "name": "Profissional",
      "value_label": "gratuito",
      "tagline": "EXPERIMENTE ENCONTRAR O QUE VOCÊ PRECISA, SEM CUSTO!",
      "cta_label": "COMEÇAR AGORA!",
      "cta_url": "https://app.findtax.com.br/",
      "is_highlighted": false,
      "rank": 0,
      "benefits": [
        { "id": "pben_01...", "text": "Visualização das Soluções na Plataforma", "is_highlighted": false, "rank": 0 },
        { "id": "pben_02...", "text": "Descontos e benefícios exclusivos!", "is_highlighted": true, "rank": 2 }
      ]
    }
  ]
}
```

## Errors

- `400` — publishable key ausente/ inválida (comportamento padrão do Medusa).
- Storefront: em qualquer falha, `listPlans()` retorna `{ plans: [] }` (degradação graciosa; a seção não quebra a home).

## Storefront consumer

`storefront/src/lib/data/plans.ts`:

```ts
"use server"
import { sdk } from "../config"
import { getCacheOptions } from "./cookies"

export const listPlans = async () => {
  const next = { ...(await getCacheOptions("plans")), revalidate: 3600 }
  return sdk.client
    .fetch<{ plans: StorePlan[] }>("/store/plans", { method: "GET", next, cache: "force-cache" })
    .then(({ plans }) => plans)
    .catch(() => [])
}
```
