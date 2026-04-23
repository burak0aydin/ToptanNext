import { PublicListingView } from '@/app/components/PublicListingView';

type SectorListingPageProps = {
  params: {
    slug: string;
  };
};

export default function SectorListingPage({ params }: SectorListingPageProps) {
  return <PublicListingView mode='sector' slug={params.slug} />;
}
