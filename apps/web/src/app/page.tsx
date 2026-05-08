import { MainFooter } from './components/MainFooter';
import { FeaturedSectorsCarousel } from './components/FeaturedSectorsCarousel';
import { HomeProductFeed } from './components/HomeProductFeed';
import { HomeHeroSlider } from './components/HomeHeroSlider';
import { MainHeader } from './components/MainHeader';

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col bg-background text-on-surface antialiased'>
      <MainHeader />

      <main className='flex-1 pb-24 lg:pb-0'>
        <HomeHeroSlider />

        <FeaturedSectorsCarousel />

        <HomeProductFeed />

      </main>

      <MainFooter />
    </div>
  );
}
