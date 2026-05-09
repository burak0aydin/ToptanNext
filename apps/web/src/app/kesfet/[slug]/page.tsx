import { KesfetListing } from '../KesfetListing';

type KesfetCategoryPageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    search?: string;
  };
};

export default function KesfetCategoryPage({ params, searchParams }: KesfetCategoryPageProps) {
  const { slug } = params;

  return <KesfetListing search={searchParams?.search} slug={slug} />;
}
