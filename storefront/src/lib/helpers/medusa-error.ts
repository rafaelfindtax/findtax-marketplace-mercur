export default function medusaError(error: any): never {
  // 1) Erro com shape Axios — preservado para compatibilidade.
  if (error?.response) {
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("[medusaError] axios", {
      resource: u.toString(),
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    })

    const raw = error.response.data?.message ?? error.response.data
    const text =
      typeof raw === "string"
        ? raw
        : raw != null
          ? JSON.stringify(raw)
          : `HTTP ${error.response.status ?? ""}`
    throw new Error(text.charAt(0).toUpperCase() + text.slice(1) + ".")
  }

  // 2) Erro do @medusajs/js-sdk (FetchError do fetch nativo) — expõe url/status/body.
  if (error?.status || error?.statusText || error?.url) {
    console.error("[medusaError] sdk fetch error", {
      url: error.url,
      method: error.method,
      status: error.status,
      statusText: error.statusText,
      body: error.body ?? error.message,
      stack: error.stack,
    })
    throw new Error(
      `${error.status ?? ""} ${error.statusText ?? ""} ${error.message ?? ""}`.trim()
    )
  }

  // 3) Request sem resposta (rede caiu, timeout etc.).
  if (error?.request) {
    console.error("[medusaError] no response", { request: error.request })
    throw new Error("No response received: " + error.request)
  }

  // 4) Erro genérico — pelo menos loga message + stack pra rastrear a origem.
  console.error("[medusaError] generic", {
    message: error?.message,
    name: error?.name,
    stack: error?.stack,
    error,
  })
  throw new Error("Error setting up the request: " + (error?.message ?? error))
}
