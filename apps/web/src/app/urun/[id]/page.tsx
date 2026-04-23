import { PublicProductDetailView } from '@/app/components/PublicProductDetailView';

type ProductDetailPageProps = {
  params: {
    id: string;
  };
};

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return <PublicProductDetailView id={params.id} />;
}
