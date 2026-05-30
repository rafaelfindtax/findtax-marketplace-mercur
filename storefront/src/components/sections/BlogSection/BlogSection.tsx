import { BlogPost } from '@/types/blog';
import { BlogCard } from '@/components/organisms';

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Tax Transformation Report',
    excerpt:
      'Faça parte do primeiro relatório de Tax Transformation do Brasil!',
    image: 'https://findtax.com.br/hubfs/Tax%20Transformation%20Report.png',
    category: 'RELATÓRIO',
    href: '#',
  },
  {
    id: 2,
    title: 'Conteúdo Tributário',
    excerpt:
      'Informativos, blog exclusivo, agenda de eventos, cursos, mentoria e redes de parceiros. Receba todas as novidades de forma prática e amigável.',
    image: 'https://findtax.com.br/hs-fs/hubfs/Icones%204%20m1.png',
    category: 'CONTEÚDO',
    href: '#',
  },
  {
    id: 3,
    title: 'Benefícios Exclusivos',
    excerpt:
      'Rede em expansão oferece vantagens, descontos em cursos e eventos, condições especiais em softwares e serviços.',
    image: 'https://findtax.com.br/hs-fs/hubfs/Icones%201%20m1-1.png',
    category: 'BENEFÍCIOS',
    href: '#',
  },
];

export function BlogSection() {
  return (
    <section className='bg-tertiary container'>
      <div className='flex items-center justify-between mb-12'>
        <h2 className='heading-lg text-tertiary'>
          FIQUE POR DENTRO
        </h2>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-3'>
        {blogPosts.map((post, index) => (
          <BlogCard
            key={post.id}
            index={index}
            post={post}
          />
        ))}
      </div>
    </section>
  );
}
