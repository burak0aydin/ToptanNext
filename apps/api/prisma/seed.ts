import { Prisma, PrismaClient } from '@prisma/client';

type CategorySeedNode = {
  name: string;
  children?: CategorySeedNode[];
};

const CATEGORY_SEED: CategorySeedNode[] = [
  {
    name: 'GİYİM VE AKSESUARLAR',
    children: [
      {
        name: 'Kadın Giyim',
        children: [
          { name: 'Elbise' },
          { name: 'Üst Giyim' },
          { name: 'Alt Giyim' },
          { name: 'Dış Giyim' },
          { name: 'İç Giyim & Pijama' },
          { name: 'Hamile Giyim' },
          { name: 'Büyük Beden Giyim' },
        ],
      },
      {
        name: 'Erkek Giyim',
        children: [
          { name: 'Üst Giyim' },
          { name: 'Alt Giyim' },
          { name: 'Dış Giyim' },
          { name: 'Takım Elbise & Smokin' },
          { name: 'İç Giyim & Çorap' },
        ],
      },
      {
        name: 'Çocuk & Bebek Giyim',
        children: [
          { name: 'Bebek 0-2 Yaş' },
          { name: 'Küçük Çocuk 2-8 Yaş' },
          { name: 'Büyük Çocuk 9-16 Yaş' },
          { name: 'Mevsimlik Koleksiyonlar' },
        ],
      },
      {
        name: 'Spor Giyim',
        children: [
          { name: 'Koşu & Fitness Kıyafetleri' },
          { name: 'Takım Sporları' },
          { name: 'Outdoor & Dağcılık Giyimi' },
          { name: 'Yüzme & Su Sporları' },
        ],
      },
      {
        name: 'Ayakkabı',
        children: [
          { name: 'Kadın Ayakkabı' },
          { name: 'Erkek Ayakkabı' },
          { name: 'Çocuk Ayakkabı' },
          { name: 'Endüstriyel & İş Güvenliği Ayakkabısı' },
        ],
      },
      {
        name: 'Çanta & Valiz',
        children: [
          { name: 'Kadın Çantaları' },
          { name: 'Erkek Çantaları' },
          { name: 'Seyahat & Valiz' },
          { name: 'Okul & Spor Çantaları' },
        ],
      },
      {
        name: 'Aksesuarlar',
        children: [
          { name: 'Saat' },
          { name: 'Gözlük' },
          { name: 'Takı & Mücevher' },
          { name: 'Şapka & Bere' },
          { name: 'Atkı, Şal & Eldiven' },
          { name: 'Kemer' },
          { name: 'Cüzdan & Kartlık' },
        ],
      },
    ],
  },
  {
    name: 'ELEKTRONİK VE TEKNOLOJİ',
    children: [
      {
        name: 'Mobil Cihazlar',
        children: [
          { name: 'Akıllı Telefonlar' },
          { name: 'Tablet' },
          { name: 'Telefon Aksesuarları' },
        ],
      },
      {
        name: 'Bilgisayar & Donanım',
        children: [
          { name: 'Dizüstü Bilgisayar' },
          { name: 'Masaüstü Bilgisayar' },
          { name: 'Donanım Parçaları' },
          { name: 'Çevre Birimleri' },
        ],
      },
      {
        name: 'Beyaz Eşya',
        children: [
          { name: 'Buzdolabı' },
          { name: 'Çamaşır & Bulaşık' },
          { name: 'Pişirme & Fırın' },
        ],
      },
      {
        name: 'Küçük Ev Aletleri',
        children: [
          { name: 'Temizlik' },
          { name: 'Mutfak Aletleri' },
          { name: 'Kahve & Çay' },
        ],
      },
      {
        name: 'Akıllı Ev Sistemleri',
        children: [
          { name: 'Güvenlik' },
          { name: 'Otomasyon & IoT' },
          { name: 'Eğlence & Medya' },
        ],
      },
    ],
  },
  {
    name: 'KOZMETİK, SAĞLIK VE KİŞİSEL BAKIM',
    children: [
      {
        name: 'Makyaj Ürünleri',
        children: [
          { name: 'Yüz Makyajı' },
          { name: 'Göz Makyajı' },
          { name: 'Dudak' },
          { name: 'Makyaj Fırçası & Sünger Seti' },
          { name: 'Makyaj Sabitleyici & Spreyi' },
        ],
      },
      {
        name: 'Cilt Bakımı',
        children: [
          { name: 'Temizlik' },
          { name: 'Nem & Beslenme' },
          { name: 'Güneş Koruma' },
          { name: 'Vücut Bakımı' },
          { name: 'Cilt Tipi Özel' },
        ],
      },
      {
        name: 'Saç Bakımı',
        children: [
          { name: 'Şampuan & Saç Kremi' },
          { name: 'Saç Maskesi & Serumu' },
          { name: 'Saç Boyası & Rötuş' },
          { name: 'Saç Şekillendirici' },
          { name: 'Saç Bakım Aleti' },
        ],
      },
      {
        name: 'Kişisel Hijyen',
        children: [
          { name: 'Ağız & Diş' },
          { name: 'Vücut Temizliği' },
          { name: 'Deodorant & Parfüm' },
        ],
      },
      {
        name: 'Medikal & Sağlık Ürünleri',
        children: [
          { name: 'Koruyucu Ekipman' },
          { name: 'Bandaj & Yara Bakımı' },
          { name: 'Ölçüm & Takip Cihazları' },
          { name: 'Vitamin & Takviye' },
        ],
      },
    ],
  },
  {
    name: 'EV, YAŞAM VE BAHÇE',
    children: [
      {
        name: 'Mobilya',
        children: [
          { name: 'Oturma Odası' },
          { name: 'Yatak Odası' },
          { name: 'Mutfak Mobilyası' },
          { name: 'Ofis Mobilyası' },
          { name: 'Banyo Mobilyası' },
        ],
      },
      {
        name: 'Ev Tekstili',
        children: [
          { name: 'Yatak & Yorgan' },
          { name: 'Havlu & Bornoz' },
          { name: 'Perde & Stor' },
          { name: 'Halı & Kilim' },
          { name: 'Masa Örtüsü & Mutfak Tekstili' },
        ],
      },
      {
        name: 'Mutfak Ürünleri',
        children: [
          { name: 'Pişirme Ekipmanları' },
          { name: 'Fırın & Baking' },
          { name: 'Depolama & Saklama' },
          { name: 'Servis & Sofra' },
        ],
      },
      {
        name: 'Dekorasyon',
        children: [
          { name: 'Duvar Dekorasyonu' },
          { name: 'Obje & Heykel' },
          { name: 'Yapay Çiçek & Bitki' },
          { name: 'Mevsimsel Dekorasyon' },
        ],
      },
      {
        name: 'Aydınlatma',
        children: [
          { name: 'Tavan & Sarkıt' },
          { name: 'Masa & Zemin Lambası' },
          { name: 'LED & Akıllı Aydınlatma' },
          { name: 'Dış Mekan Aydınlatma' },
        ],
      },
      {
        name: 'Bahçe Ürünleri',
        children: [
          { name: 'Bahçe Mobilyası' },
          { name: 'Sulama Sistemleri' },
          { name: 'Bahçe Aletleri' },
          { name: 'Saksı, Viyol & Toprak' },
        ],
      },
    ],
  },
  {
    name: 'GIDA, İÇECEK VE TARIM',
    children: [
      {
        name: 'Paketli Gıdalar',
        children: [
          { name: 'Atıştırmalıklar' },
          { name: 'Kahvaltılık' },
          { name: 'Temel Gıda' },
          { name: 'Sos, Baharat & Çeşni' },
        ],
      },
      {
        name: 'İçecekler',
        children: [{ name: 'Soğuk İçecekler' }, { name: 'Sıcak İçecekler' }],
      },
      {
        name: 'Tarım Ürünleri',
        children: [
          { name: 'Taze Sebze' },
          { name: 'Taze Meyve' },
          { name: 'Tahıl & Bakliyat' },
          { name: 'Organik & Sertifikalı Ürünler' },
        ],
      },
      {
        name: 'Toptan Gıda HoReCa',
        children: [
          { name: 'Restoran & Otel Malzemeleri' },
          { name: 'Endüstriyel Mutfak Malzemeleri' },
        ],
      },
    ],
  },
  {
    name: 'ANNE, BEBEK VE OYUNCAK',
    children: [
      {
        name: 'Bebek Taşıma & Güvenlik',
        children: [
          { name: 'Bebek Arabası' },
          { name: 'Oto Koltuğu' },
          { name: 'Bebek Kanguru & Wrap' },
          { name: 'Bebek Yatağı & Beşik' },
          { name: 'Emniyet Ekipmanları' },
        ],
      },
      {
        name: 'Bebek Bakım',
        children: [
          { name: 'Bez & Islak Mendil' },
          { name: 'Beslenme' },
          { name: 'Banyo & Temizlik' },
        ],
      },
      {
        name: 'Oyuncaklar',
        children: [
          { name: 'Eğitici Oyuncaklar' },
          { name: 'Rol Yapma & Yaratıcı Oyun' },
          { name: 'Bebek & Küçük Çocuk Oyuncakları' },
          { name: 'Elektronik Oyuncaklar' },
          { name: 'Açık Hava Oyuncakları' },
        ],
      },
      {
        name: 'Anne & Hamile Ürünleri',
        children: [
          { name: 'Süt Pompası' },
          { name: 'Emzirme Ürünleri' },
          { name: 'Gebelik Takip Ürünleri' },
        ],
      },
    ],
  },
  {
    name: 'AMBALAJ, BASKI VE OFİS',
    children: [
      {
        name: 'Ambalaj Ürünleri',
        children: [
          { name: 'Kargo & Nakliye' },
          { name: 'Poşet & Torba' },
          { name: 'Gıda Ambalajı' },
        ],
      },
      {
        name: 'Matbaa & Baskı',
        children: [
          { name: 'Kartvizit' },
          { name: 'Broşür & Katalog' },
          { name: 'Afiş & Poster' },
          { name: 'Etiket & Barkod Etiketi' },
          { name: 'Roll-up & Fuar Tabelası' },
          { name: 'Promosyon Ürünleri' },
        ],
      },
      {
        name: 'Ofis Malzemeleri',
        children: [
          { name: 'Kağıt & Defter' },
          { name: 'Yazım Araçları' },
          { name: 'Dosyalama & Arşiv' },
          { name: 'Masa Aksesuarları' },
        ],
      },
    ],
  },
  {
    name: 'OTOMOTİV VE YEDEK PARÇA',
    children: [
      {
        name: 'Araç Aksesuarları',
        children: [{ name: 'İç Aksesuar' }, { name: 'Dış Aksesuar' }],
      },
      {
        name: 'Yedek Parçalar',
        children: [
          { name: 'Motor & Aktarma' },
          { name: 'Fren Sistemi' },
          { name: 'Süspansiyon & Direksiyon' },
          { name: 'Elektrik & Elektronik' },
        ],
      },
      {
        name: 'Lastik & Jant',
        children: [{ name: 'Lastik' }, { name: 'Jant' }, { name: 'Aksesuar' }],
      },
      {
        name: 'Araç Bakım Ürünleri',
        children: [
          { name: 'Dış Bakım' },
          { name: 'İç Temizlik' },
          { name: 'Oto Elektrik & Güvenlik' },
        ],
      },
    ],
  },
  {
    name: 'SPOR, HOBİ VE EVCİL HAYVAN',
    children: [
      {
        name: 'Spor Ekipmanları',
        children: [
          { name: 'Fitness & Gym' },
          { name: 'Takım Sporları' },
          { name: 'Mücadele Sporları' },
        ],
      },
      {
        name: 'Outdoor & Kamp',
        children: [
          { name: 'Kamp Ekipmanları' },
          { name: 'Dağcılık & Trekking' },
          { name: 'Su Sporları' },
        ],
      },
      {
        name: 'Hobi',
        children: [
          { name: 'Sanat & El Sanatları' },
          { name: 'Koleksiyonculuk' },
          { name: 'Bulmaca & Masa Oyunları' },
        ],
      },
      {
        name: 'Evcil Hayvan Petshop',
        children: [
          { name: 'Köpek' },
          { name: 'Kedi' },
          { name: 'Küçük Hayvanlar' },
          { name: 'Veteriner & Sağlık' },
        ],
      },
    ],
  },
  {
    name: 'İNŞAAT, HIRDAVAT VE YAPI MARKET',
    children: [
      {
        name: 'El Aletleri',
        children: [
          { name: 'Kesme & Kesici Aletler' },
          { name: 'Sıkma & Bağlama' },
          { name: 'Ölçüm & İşaretleme' },
        ],
      },
      {
        name: 'Elektrikli & Akülü Aletler',
        children: [
          { name: 'Matkap & Vidalama' },
          { name: 'Kesme & Taşlama' },
          { name: 'Kaynak & Kesim' },
        ],
      },
      {
        name: 'Tesisat Malzemeleri',
        children: [{ name: 'Su Tesisatı' }, { name: 'Doğalgaz Tesisat' }],
      },
      {
        name: 'Boya & Yapı Kimyasalları',
        children: [
          { name: 'Boya' },
          { name: 'Alçı & Sıva' },
          { name: 'Yapıştırıcı & Sızdırmazlık' },
        ],
      },
      {
        name: 'İş Güvenliği Ekipmanları',
        children: [
          { name: 'Kişisel Koruyucu Donanım KKD' },
          { name: 'Yüksekte Çalışma' },
          { name: 'Uyarı & İşaretleme' },
        ],
      },
    ],
  },
  {
    name: 'ELEKTRİK VE ENERJİ',
    children: [
      {
        name: 'Kablo & İletken',
        children: [{ name: 'Enerji Kabloları' }, { name: 'Koruma Boruları' }],
      },
      {
        name: 'Devre Elemanları',
        children: [
          { name: 'Koruma & Dağıtım' },
          { name: 'Priz, Anahtar & Fiş' },
        ],
      },
      {
        name: 'Güneş Enerjisi Sistemleri',
        children: [
          { name: 'Panel' },
          { name: 'İnverter' },
          { name: 'Depolama' },
          { name: 'Aksesuarlar' },
        ],
      },
    ],
  },
  {
    name: 'ENDÜSTRİYEL MAKİNE VE EKİPMAN',
    children: [
      {
        name: 'Üretim Makineleri',
        children: [
          { name: 'Metal İşleme' },
          { name: 'Ahşap İşleme' },
          { name: 'Plastik İşleme' },
        ],
      },
      {
        name: 'Paketleme Makineleri',
        children: [
          { name: 'Dolum Makinesi' },
          { name: 'Poşet & Vakum Paketleme' },
          { name: 'Shrink Paketleme' },
          { name: 'Etiket Yapıştırma' },
          { name: 'Tartılı Dolum Sistemi' },
        ],
      },
      {
        name: 'Tekstil Makineleri',
        children: [
          { name: 'Dikiş Makinesi' },
          { name: 'Kesim Makinesi' },
          { name: 'Nakış Makinesi' },
          { name: 'Baskı Makinesi' },
        ],
      },
      {
        name: 'Laboratuvar & Analiz Cihazları',
        children: [{ name: 'Ölçüm & Test' }, { name: 'Laboratuvar Donanımı' }],
      },
    ],
  },
  {
    name: 'HAM MADDE VE İMALAT',
    children: [
      {
        name: 'Plastik Hammaddeler',
        children: [
          { name: 'Granül & Pelet' },
          { name: 'Yeniden İşlenmiş Plastik' },
          { name: 'Plastik Katkı Maddeleri' },
        ],
      },
      {
        name: 'Metal & Çelik',
        children: [
          { name: 'Çelik Ürünleri' },
          { name: 'Alüminyum' },
          { name: 'Bakır & Pirinç' },
          { name: 'Paslanmaz Çelik' },
        ],
      },
      {
        name: 'Tekstil Hammaddeleri',
        children: [{ name: 'İplik' }, { name: 'Kumaş' }, { name: 'Aksesuar' }],
      },
      {
        name: 'Kimyasallar & Hammaddeler',
        children: [
          { name: 'Endüstriyel Kimyasal' },
          { name: 'Boya & Pigment' },
          { name: 'Yapıştırıcı & Tutkal' },
        ],
      },
      {
        name: 'Fason Üretim Hizmetleri',
        children: [
          { name: 'Konfeksiyon Fason' },
          { name: 'Plastik Enjeksiyon Fason' },
          { name: 'Metal İşleme Fason' },
          { name: 'Baskı & Etiketleme Fason' },
          { name: 'Montaj & Paketleme Fason' },
        ],
      },
    ],
  },
];

const SECTOR_SEED = [
  'Oteller & Pansiyonlar',
  'Kafe & Restoranlar',
  'Süpermarketler',
  'Giyim Mağazaları',
  'Elektronik',
  'Kozmetik Mağazaları',
  'Petshoplar',
  'Spor Salonları',
  'Hastaneler',
  'Eczaneler',
  'Ofisler',
  'Oto Servisleri',
  'Lojistik Firmaları',
  'Okullar',
  'Organizasyon',
  'İnşaat Firmaları',
];

const prisma = new PrismaClient();

function slugify(value: string): string {
  const normalized = value
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function upsertCategoryNode(
  tx: Prisma.TransactionClient,
  node: CategorySeedNode,
  level: number,
  sortOrder: number,
  parentId: string | null,
  parentSlug: string | null,
): Promise<void> {
  if (level > 3) {
    throw new Error(`Kategori derinliği 3 seviyeyi aşamaz: ${node.name}`);
  }

  if (level === 3 && node.children && node.children.length > 0) {
    throw new Error(`Level 3 kategori altında alt kategori olamaz: ${node.name}`);
  }

  const ownSlug = slugify(node.name);
  const slug = parentSlug ? `${parentSlug}-${ownSlug}` : ownSlug;

  const category = await tx.category.upsert({
    where: { slug },
    update: {
      name: node.name,
      level,
      parentId,
      sortOrder,
      isActive: true,
    },
    create: {
      name: node.name,
      slug,
      level,
      parentId,
      sortOrder,
      isActive: true,
    },
  });

  if (!node.children || node.children.length === 0) {
    return;
  }

  for (let index = 0; index < node.children.length; index += 1) {
    await upsertCategoryNode(
      tx,
      node.children[index],
      level + 1,
      index + 1,
      category.id,
      slug,
    );
  }
}

async function seedCategoriesAndSectors(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < CATEGORY_SEED.length; index += 1) {
      await upsertCategoryNode(
        tx,
        CATEGORY_SEED[index],
        1,
        index + 1,
        null,
        null,
      );
    }

    for (let index = 0; index < SECTOR_SEED.length; index += 1) {
      const name = SECTOR_SEED[index];
      const slug = slugify(name);

      await tx.sector.upsert({
        where: { slug },
        update: {
          name,
          sortOrder: index + 1,
          isActive: true,
        },
        create: {
          name,
          slug,
          sortOrder: index + 1,
          isActive: true,
        },
      });
    }
  });
}

async function main(): Promise<void> {
  await seedCategoriesAndSectors();
  console.log('Kategori ve sektör seed işlemi başarıyla tamamlandı.');
}

main()
  .catch((error) => {
    console.error('Seed hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
