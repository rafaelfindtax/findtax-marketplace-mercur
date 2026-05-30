# Credenciais dos Sellers — FINDTAX Marketplace

> Gerado automaticamente a partir de `app_provider_202605022139.csv`.
> Estas credenciais são usadas para login no **Vendor Panel** (http://localhost:7001).

## Padrão de credenciais

- **Login (email):** `{slug-do-nome}@findtax.com` — nome do seller sem espaços/acentos, minúsculo
- **Senha:** o mesmo slug. Slugs com menos de 8 caracteres recebem o sufixo `@findtax` (requisito de tamanho mínimo do Medusa).
- **store_status:** `ACTIVE` para sellers `ATIVO` no CSV, `SUSPENDED` para `INATIVO`.

**Total:** 29 sellers (27 ACTIVE / 2 SUSPENDED)

## Tabela de credenciais

| # | Seller | Login | Senha | Status |
|---|--------|-------|-------|--------|
| 1 | Brinta | `brinta@findtax.com` | `brinta@findtax` | ACTIVE |
| 2 | Busca Legal | `buscalegal@findtax.com` | `buscalegal` | ACTIVE |
| 3 | Camu | `camu@findtax.com` | `camu@findtax` | ACTIVE |
| 4 | e-Auditoria | `eauditoria@findtax.com` | `eauditoria` | ACTIVE |
| 5 | Elo Fiscal | `elofiscal@findtax.com` | `elofiscal` | ACTIVE |
| 6 | Evollux | `evollux@findtax.com` | `evollux@findtax` | ACTIVE |
| 7 | FIND Tax Solutions | `findtaxsolutions@findtax.com` | `findtaxsolutions` | ACTIVE |
| 8 | FS4YOU | `fs4you@findtax.com` | `fs4you@findtax` | ACTIVE |
| 9 | LogisBank | `logisbank@findtax.com` | `logisbank` | ACTIVE |
| 10 | Lopti | `lopti@findtax.com` | `lopti@findtax` | ACTIVE |
| 11 | MA Tecnologias | `matecnologias@findtax.com` | `matecnologias` | ACTIVE |
| 12 | Mastery E-commerce Solutions | `masteryecommercesolutions@findtax.com` | `masteryecommercesolutions` | ACTIVE |
| 13 | Menndel & Melo Advocacia | `menndelmeloadvocacia@findtax.com` | `menndelmeloadvocacia` | ACTIVE |
| 14 | Numix Tech | `numixtech@findtax.com` | `numixtech` | ACTIVE |
| 15 | Planning | `planning@findtax.com` | `planning` | ACTIVE |
| 16 | Revizia | `revizia@findtax.com` | `revizia@findtax` | **SUSPENDED** |
| 17 | ROIT | `roit@findtax.com` | `roit@findtax` | ACTIVE |
| 18 | Simões Pires | `simoespires@findtax.com` | `simoespires` | ACTIVE |
| 19 | Sittax | `sittax@findtax.com` | `sittax@findtax` | ACTIVE |
| 20 | Solutio | `solutio@findtax.com` | `solutio@findtax` | ACTIVE |
| 21 | Tax Stragegy | `taxstragegy@findtax.com` | `taxstragegy` | **SUSPENDED** |
| 22 | TAX5 CONSULT | `tax5consult@findtax.com` | `tax5consult` | ACTIVE |
| 23 | Taxcel | `taxcel@findtax.com` | `taxcel@findtax` | ACTIVE |
| 24 | Taxly | `taxly@findtax.com` | `taxly@findtax` | ACTIVE |
| 25 | Taxly Serviços e Tecnologia | `taxlyservicosetecnologia@findtax.com` | `taxlyservicosetecnologia` | ACTIVE |
| 26 | Trevisan Escola de Negócios | `trevisanescoladenegocios@findtax.com` | `trevisanescoladenegocios` | ACTIVE |
| 27 | Tributariou Business | `tributarioubusiness@findtax.com` | `tributarioubusiness` | ACTIVE |
| 28 | TSCTI  Soluções Fiscais | `tsctisolucoesfiscais@findtax.com` | `tsctisolucoesfiscais` | ACTIVE |
| 29 | V360 | `v360@findtax.com` | `v360@findtax` | ACTIVE |

## Observações

- Sellers **SUSPENDED** existem no admin mas seus produtos **não aparecem na vitrine** (filtro do storefront `NOT seller.store_status:SUSPENDED`).
- O usuário **admin** da plataforma é separado: `admin@test.com` / `supersecret` (painel admin em http://localhost:5173).
- Para recriar todos os sellers: `make findtax-bootstrap`.

<sub>Documento gerado em 2026-05-15 12:20 — não editar manualmente; regenerar via script.</sub>
