import { notFound } from "next/navigation";
import { AccountSectionPlaceholder } from "../../_components/AccountSectionPlaceholder";

const sectionConfig = {
  "genel-bakis": "Genel Bakış",
  "urunlerim": "Ürünlerim",
  "siparisler": "Siparişler",
  "mesajlar": "Mesajlar",
  "finans": "Finans",
  "sirket-bilgilerim": "Şirket Bilgilerim",
  "satici-sayfam": "Satıcı Sayfam",
} as const;

type SectionKey = keyof typeof sectionConfig;

type SellerPanelSectionPageProps = {
  params: {
    section: string;
  };
};

export default function SellerPanelSectionPage({
  params,
}: SellerPanelSectionPageProps) {
  const { section } = params;
  const title = sectionConfig[section as SectionKey];

  if (!title) {
    notFound();
  }

  return (
    <AccountSectionPlaceholder
      text={`${title} sayfası hazır. Bu alanı kendi iş akışına göre entegre edebilirsin.`}
    />
  );
}
