import { KesfetListing } from '../KesfetListing';

type KesfetCategoryPageProps = {
  params: {
    slug: string;
  };
};

export default function KesfetCategoryPage({ params }: KesfetCategoryPageProps) {
  const { slug } = params;

  return <KesfetListing slug={slug} />;
}
