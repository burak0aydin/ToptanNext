import { KesfetListing } from './KesfetListing';

type KesfetPageProps = {
  searchParams?: {
    search?: string;
  };
};

export default function KesfetPage({ searchParams }: KesfetPageProps) {
  return <KesfetListing search={searchParams?.search} />;
}
