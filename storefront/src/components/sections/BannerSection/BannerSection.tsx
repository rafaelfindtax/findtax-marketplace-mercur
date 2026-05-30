import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

export const BannerSection = () => {
  return (
    <section className="bg-tertiary container text-tertiary">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
        <div className="py-6 px-6 flex flex-col h-full justify-between border border-secondary rounded-sm">
          <div className="mb-8 lg:mb-48">
            <span className="text-sm inline-block px-4 py-1 border border-secondary rounded-sm">
              #MARKETPLACETRIBUTARIO
            </span>
            <h2 className="display-sm">
              ENCONTRE SOLUÇÕES E SEJA ENCONTRADO!
            </h2>
            <p className="text-lg text-tertiary max-w-lg">
              O mundo tributário apresenta desafios, mas também oportunidades.
              Aqui é onde a conexão entre a demanda e a solução se concretiza!
            </p>
          </div>
          <LocalizedClientLink href="/categories">
            <Button size="large" className="w-fit bg-secondary/10">
              EXPLORAR
            </Button>
          </LocalizedClientLink>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full flex justify-end rounded-sm">
          <Image
            loading="lazy"
            fetchPriority="high"
            src="https://findtax.com.br/hs-fs/hubfs/tax%20(13)-1.png"
            alt="Marketplace tributário FindTax — onde a demanda encontra a solução"
            width={700}
            height={600}
            className="object-cover object-top rounded-sm"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </div>
    </section>
  )
}
