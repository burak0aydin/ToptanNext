import { PublicListingView } from '@/app/components/PublicListingView';

type CategoryListingPageProps = {
  params: {
    slug: string;
  };
};

export default function CategoryListingPage({ params }: CategoryListingPageProps) {
  return <PublicListingView mode='category' slug={params.slug} />;
}
