# FIND — Documentação de Funcionalidades & Mapa de Categorias

> Documento de referência consolidado do produto FIND.
> Cobre todas as áreas implementadas no app, suas funcionalidades e o **mapa completo de categorias / taxonomias** usadas em dados e filtros.

---

## Parte 1 — Funcionalidades

### 1. Visão Geral

FIND é um **hub middleware tributário** que conecta o ERP do cliente a um ecossistema curado de fornecedores (tecnologia, serviços, banking e benefícios), em um cenário de **Reforma Tributária** (IBS/CBS a partir de 01/01/2026).

Arquitetura em 4 camadas:

```
[ ERP do Cliente ]  →  [ FIND (orquestração) ]  →  [ Fornecedores credenciados ]  →  [ Resultados ]
```

- **ERP**: SAP S/4HANA, ECC, B1, TOTVS Protheus / RM / Datasul, Sankhya, Oracle NetSuite, EBS / Fusion, Microsoft Dynamics, Senior.
- **FIND**: governança, roteamento, RFP/BID, monitoramento, compliance.
- **Fornecedores**: APIs, plataformas, serviços, BPO, contabilidade, auditoria, banking.
- **Resultados**: economia tributária, conformidade, redução de risco, governança.

### 2. Mapa de Rotas

| Rota | Página | Público |
|------|--------|---------|
| `/` | Home institucional | Geral |
| `/pme` | Portal PME — Reforma-Ready | Empresário PME |
| `/enterprise` | Portal Enterprise | CFO / Tax Director |
| `/tax-transformers` | Plataforma de profissionais tax | Consultor / Advogado tributarista |
| `/marketplace` | Catálogo de fornecedores | Comprador corporativo |
| `/marketplace/conteudo` | Hub de Conteúdo (escolas e cursos) | Profissional tax |
| `/marketplace/tax-suppliers-club` | Clube de fornecedores tax | Fornecedor tax |
| `/marketplace/facilities` | Hub Corporativo de facilities | Empresa |
| `/marketplace/multiplanos` | Hub de seguros & benefícios (parceria oficial) | PJ / RH / Pessoa-chave |
| `/marketplace/:slug` | Detalhe do fornecedor | — |
| `/marketplace/conteudo/escola/:slug` | Detalhe de escola | — |
| `/marketplace/conteudo/curso/:slug` | Detalhe de curso | — |
| `/marketplace/facilities/:slug` | Detalhe de facility | — |
| `/marketplace/tax-suppliers-club/evento/:slug` | Evento do clube | — |
| `/marketplace/tax-suppliers-club/parceiro/:slug` | Parceiro do clube | — |
| `/marketplace/tax-suppliers-club/cadastro` | Signup do clube | — |
| `/marketplace/tax-suppliers-club/mentoria` | Trilha de mentoria | — |

### 3. Home (`/`)

- Hero institucional com mockup do produto (`find_mockup_hq.svg`) em layout 2 colunas.
- Bloco de features (pilares do FIND).
- Diagrama de arquitetura em 4 camadas.
- Preview do Marketplace (cards de fornecedores).
- CTA final.

### 4. Portal PME (`/pme`)

- **Hero Reforma-Ready** com contagem regressiva para 01/01/2026.
- **Termômetro interativo** (3 perguntas → score 0–100):
  - Regime tributário, faixa de faturamento, mix B2C.
  - Cores e mensagens dinâmicas por faixa de score.
  - Recomendação de plano de check-up baseada no regime.
- **Check-up pago**:
  - R$ 1.000 por CNPJ no **Simples Nacional**.
  - R$ 2.000 por CNPJ no **Lucro Presumido** ou **Lucro Real**.
- **Dialog de captura de lead** (nome, e-mail, CNPJ) integrado ao checkout.
- Estatísticas de mercado e prova social para empresário PME.

### 5. Portal Enterprise (`/enterprise`)

- Modal conversacional para abrir **RFP / Licitação** ou **BID / Cotação** com anexo de documentos.
- Painel de governança fiscal.
- Comparativo de fornecedores credenciados.
- Geração estruturada do briefing em JSON.

### 6. Tax Transformers (`/tax-transformers`)

- Marketplace de horas de profissionais tributaristas.
- Programa de certificação interna FIND.
- Onboarding do profissional e exposição na vitrine.

### 7. Marketplace e Sub-hubs

- **Catálogo principal**: filtros laterais (categoria, ERP, modelo de entrega, porte), cards de fornecedores com status `CREDENCIADO`, página de detalhe com features, endpoint, latência e CTAs.
- **Conteúdo**: 8 escolas parceiras, 9+ cursos, página de detalhe com ementa.
- **Tax Suppliers Club**: eventos (Live, Masterclass, Workshop), parceiros, signup e trilha de mentoria.
- **Facilities (Hub Corporativo)**: 6 facilities com parceiros, planos e FAQ.
- **Multiplanos**: catálogo de seguros e benefícios, parceria oficial, segmentação por perfil PJ / RH / Pessoa-chave.

### 8. Componentes Transversais

- `Navbar` fixa com dropdown do Marketplace (Todos, Conteúdo, Tax Suppliers Club, Hub Corporativo), atalhos para PME / Enterprise / Tax Transformers / API Docs, Login (→ findtax.com.br) e Sandbox.
- `Footer` com colunas Plataforma / Desenvolvedores / Empresa.
- Dialogs de captura de lead, toasts `sonner`.

### 9. Stack Técnica

React 18 · Vite 5 · TypeScript 5 · Tailwind CSS v3 · shadcn/ui · Framer Motion · React Router · TanStack Query · Lovable Cloud (Supabase) · fonte **Ubuntu** · paleta primary `#9C46CC`, cyan `#079ED4`, navy `#06102E`.

### 10. Roadmap (5 etapas)

1. Marketplace Tech & Services credenciado.
2. Termômetro PME + check-up monetizado.
3. RFP/BID Enterprise com governança.
4. Tax Transformers + certificação.
5. Hub Corporativo completo (Conteúdo, Club, Facilities, Multiplanos).

---

## Parte 2 — Mapa de Categorias

Listagem exaustiva, extraída diretamente do código (`src/data/*.ts`, páginas e navegação).

### 2.1 Marketplace de Fornecedores (`src/data/marketplace.ts`)

#### 2.1.1 Tipos de fornecedor (`ProviderType`)

| Slug | Label exibida | Cor |
|------|---------------|-----|
| `api` | Tecnologia | success |
| `pre-api` | Em Integração | muted |
| `service` | Serviços | primary |
| `platform` | API FIND | foreground |
| `bpo` | BPO | amber |
| `auditoria` | Auditoria | violet |
| `contabilidade` | Contabilidade | sky |
| `banking` | Banking | emerald |

#### 2.1.2 Segmentos (`ProviderSegment`)

| Slug | Label |
|------|-------|
| `tech` | Tecnologia |
| `servicos` | Serviços |
| `banking` | Banking |

#### 2.1.3 Categorias de fornecedor (campo `category`)

**APIs FIND (`platform`)**: Cálculo Tributário · Governança Fiscal · Dados Fiscais · Integração ERP.

**Tech (`api`)**: Reforma Tributária & Compliance · IA Tributária & Apuração · NF-e Inbound & Gestão de DFs · Compliance Fiscal · Captura & Distribuição de DFs · SPED & Obrigações Acessórias · Legislação & Inteligência Jurídica · Auditoria Eletrônica de SPED · Reforma Tributária (IBS/CBS) · Apuração & SPED · Integração & Automação Fiscal · Plataforma Fiscal · Gestão de Obrigações Acessórias.

**Serviços (`service`)**: Recuperação de Créditos & BPO · BPO Tributário & Consultoria · Consultoria & Diagnóstico Fiscal · Contencioso & Consultoria Tributária · Consultoria & Reforma Tributária · Recuperação de Créditos · BPO & Implementação ERP · Consultoria & Auditoria · Planejamento & Reforma Tributária.

**Banking (`banking`)**: Banking-as-a-Service.

#### 2.1.4 Filtros laterais — Tech (`techFilterGroups`)

| Grupo | Opções |
|-------|--------|
| Categoria de produto | Motor Fiscal, Emissão de DFs, SPED & obrigações, Auditoria tributária, Reforma Tributária, Inbound DFs, Transfer Pricing, Apuração assistida |
| Integração com ERP | SAP S/4HANA, SAP ECC, SAP Business One, TOTVS Protheus, TOTVS RM / Datasul, Sankhya, Oracle NetSuite, Oracle EBS / Fusion, Microsoft Dynamics, Senior |
| Modelo de entrega | API REST, SaaS web, Conector embarcado, On-premise |
| Porte do cliente alvo | Enterprise, Mid-market, PME |

#### 2.1.5 Filtros laterais — Serviços (`servicosFilterGroups`)

| Grupo | Opções |
|-------|--------|
| Tipo de serviço | Consultoria fiscal, BPO tributário, Auditoria, Recuperação de créditos, Contencioso, Implementação ERP, Diagnóstico fiscal, Reforma tributária |
| Especialidade tributária | ICMS, PIS/COFINS, IPI, ISS, IRPJ/CSLL, Transfer pricing, IBS / CBS, Comércio exterior |
| Setor de atuação | Indústria, Varejo & e-commerce, Serviços, Agronegócio, Energia & utilities, Financeiro, Saúde & farma |
| Modelo de contratação | Projeto pontual, Recorrente / mensal, Success fee, Sob consulta |
| Cobertura | Nacional, Regional, Internacional |

#### 2.1.6 Filtros laterais — Banking (`bankingFilterGroups`)

| Grupo | Opções |
|-------|--------|
| Categoria | BaaS, Antecipação de recebíveis, Conta digital PJ, Crédito tributário / compensação, Câmbio e pagamentos internacionais |
| Porte | Enterprise, Mid-market, PME |

### 2.2 Marketplace de Conteúdo (`src/data/conteudo.ts`)

#### 2.2.1 Escolas parceiras

FISCOnet Academy · TaxEduca · RC Treinamentos · ABAT Educação · Tax Prime Institute · GF Tax School · Trevisan · Live University.

#### 2.2.2 Categorias de curso

Reforma Tributária · SPED & Obrigações · Tax Planning · Compliance · Transfer Pricing · Contencioso.

#### 2.2.3 Especialidades de escola

SPED & Obrigações · Reforma Tributária · EFD · Compliance · Transfer Pricing · Tributação Internacional · OCDE · Tax Planning · Contencioso · Planejamento Estratégico · M&A Fiscal · Defesa Fiscal · Jurisprudência · Catálogo em curadoria.

### 2.3 Tax Suppliers Club (`src/data/suppliers-club.ts`)

#### 2.3.1 Tipos de evento

Live · Masterclass · Workshop.

#### 2.3.2 Categorias de parceiro

Cloud & Infra · CRM & Marketing · Pagamentos · Produtividade · Deploy & Infra · Analytics · Gestão de Produto · Agendamentos · Assessoria de Imprensa · Marketing de Autoridade · Educação Executiva.

### 2.4 Facilities (`src/data/facilities.ts`)

| Slug | Categoria |
|------|-----------|
| certificados-digitais | Identidade Digital Corporativa |
| cash-management | Cash Management & Treasury |
| risk-management | Risk Management & Proteção |
| people-ops | People Operations & Compliance |
| corporate-finance | Corporate Finance |
| total-rewards | Total Rewards & Tax Optimization |

### 2.5 Multiplanos (`src/data/multiplanos.ts`)

#### 2.5.1 Categorias de solução

| ID | Label |
|----|-------|
| `saude` | Saúde & Bem-estar |
| `patrimonio` | Patrimônio & Operação |
| `pessoas` | Pessoas-chave & Governança |
| `garantias` | Garantias & Contratos |
| `cyber` | Cyber & Riscos Digitais |

#### 2.5.2 Perfis de público (`Profile`)

| ID | Significado |
|----|-------------|
| `pj` | Empresa / Pessoa Jurídica |
| `rh` | Área de RH |
| `key` | Pessoa-chave (sócio, executivo) |

### 2.6 PME — Termômetro Reforma-Ready (`src/pages/SMB.tsx`)

#### 2.6.1 Regimes tributários

| ID | Label | Plano de check-up |
|----|-------|-------------------|
| `simples` | Simples Nacional | Check-up Simples — R$ 1.000 / CNPJ |
| `presumido` | Lucro Presumido | Check-up Completo — R$ 2.000 / CNPJ |
| `real` | Lucro Real | Check-up Completo — R$ 2.000 / CNPJ |

#### 2.6.2 Faixas de faturamento (`Faixa`)

| ID | Label |
|----|-------|
| `ate360` | Até R$ 360 mil/ano |
| `ate4_8M` | R$ 360 mil – 4,8 mi |
| `ate30M` | R$ 4,8 mi – 30 mi |
| `acima30M` | Acima de R$ 30 mi |

#### 2.6.3 Mix B2C (`MixB2C`)

| ID | Label |
|----|-------|
| `baixo` | Até 20% B2C |
| `medio` | 20–60% B2C |
| `alto` | Acima de 60% B2C |

#### 2.6.4 Faixas de score

| Score | Exposição | Mensagem |
|-------|-----------|----------|
| ≥ 70 | Baixa | "Vale validar com check-up para travar oportunidades." |
| 40–69 | Média | Recomendado check-up. |
| < 40 | Alta | "Check-up imediato para evitar perda de caixa em 2026." |

### 2.7 Enterprise — RFP/BID (`src/pages/Enterprise.tsx`)

| ID | Label |
|----|-------|
| `rfp` | RFP / Licitação |
| `bid` | BID / Cotação |

### 2.8 Navegação global

**Navbar (links principais)**: Marketplace (dropdown) · Para PMEs · Enterprise · Tax Transformers · API Docs · Login · Sandbox.

**Dropdown Marketplace**: Todos os Fornecedores · Conteúdo · Tax Suppliers Club · Hub Corporativo.

**Footer (colunas)**:
- **Plataforma**: Marketplace, Governança, APIs, Conectores ERP.
- **Desenvolvedores**: Documentação, API Reference, SDKs, Status.
- **Empresa**: Sobre, Blog, Compliance, Contato.

---

_Última atualização: gerada automaticamente a partir do código-fonte._
