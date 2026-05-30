/**
 * CSV parser e helpers — utilizados pelos scripts de setup do marketplace FINDTAX.
 * Sem dependências externas para evitar adicionar libs ao backend.
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// CSV PARSER — suporta fields multi-linha, aspas escapadas ("") e vírgulas em quotes
// ============================================================================
export function parseCsv(content: string): Array<Record<string, string>> {
  const records: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === ',') {
        current.push(field)
        field = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && content[i + 1] === '\n') i++
        current.push(field)
        if (current.length > 1 || current[0] !== '') {
          records.push(current)
        }
        current = []
        field = ''
      } else {
        field += c
      }
    }
  }
  if (field !== '' || current.length > 0) {
    current.push(field)
    if (current.length > 1 || current[0] !== '') {
      records.push(current)
    }
  }

  if (records.length === 0) return []
  const headers = records[0]
  return records.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (row[idx] ?? '').trim()
    })
    return obj
  })
}

export function readCsv(filePath: string): Array<Record<string, string>> {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath)
  const content = fs.readFileSync(abs, 'utf-8')
  return parseCsv(content)
}

// ============================================================================
// SLUG — normaliza acentos e gera identificadores seguros
// ============================================================================

/** Slug compacto sem separadores (para email/password): "Tax Strategy" → "taxstrategy" */
export function slugCompact(s: string): string {
  return (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()
}

/** Slug com hífen (para handle/URL): "Tax Strategy" → "tax-strategy" */
export function slugHandle(s: string): string {
  return (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// PREÇOS — gerador reprodutível (mesmo produto, mesmo preço sempre)
// ============================================================================

/**
 * Gera um preço pseudo-aleatório entre min e max BRL, usando o handle como seed.
 * Como o seed depende do handle, rodar 2x produz o MESMO preço para o MESMO produto.
 *
 * @param key   string usada como seed (geralmente o handle do produto)
 * @param min   valor mínimo (default R$ 2.000,00)
 * @param max   valor máximo (default R$ 10.000,00)
 * @returns     valor em centavos (Medusa armazena valores monetários em inteiro)
 */
export function generatePriceCents(
  key: string,
  min = 2000_00,
  max = 10000_00
): number {
  // hash simples e estável (djb2)
  let hash = 5381
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) ^ key.charCodeAt(i)
  }
  const positive = Math.abs(hash)
  // arredonda para múltiplos de R$ 50,00 para ficar visualmente limpo
  const range = max - min
  const raw = min + (positive % range)
  return Math.round(raw / 5000) * 5000
}

// ============================================================================
// CSV PATHS — defaults usados pelos scripts
// ============================================================================
export const CSV_PATHS = {
  providers: path.join(process.cwd(), 'src/sample/app_provider_202605022139.csv'),
  apps: path.join(process.cwd(), 'src/sample/apps_202605022139.csv'),
  categories: path.join(
    process.cwd(),
    'src/sample/app_categories_202605022139.csv'
  ),
  subCategories: path.join(
    process.cwd(),
    'src/sample/app_sub_categories_202605022139.csv'
  ),
} as const

// ============================================================================
// PLACEHOLDER IMAGES — usado para produtos (CSV só tem UUIDs)
// ============================================================================
export function productPlaceholderImage(name: string): string {
  const label = encodeURIComponent((name || 'product').slice(0, 30))
  return `https://placehold.co/600x400/2563eb/ffffff.png?text=${label}`
}

export function sellerFallbackImage(name: string): string {
  const label = encodeURIComponent((name || 'seller').slice(0, 30))
  return `https://placehold.co/400x400/0f172a/ffffff.png?text=${label}`
}
