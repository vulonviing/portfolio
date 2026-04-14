import './App.css';
import { AudioProvider } from './audio/AudioProvider';
import { LanguageProvider } from './i18n/LanguageProvider';
import Nav from './components/Nav';
import Hero from './components/Hero';
import MelodyVisualizer from './components/MelodyVisualizer';
import TimeToggle from './components/TimeToggle';
import EcstaticProjection from './components/EcstaticProjection';
import BrainMap from './components/BrainMap';
import Voices from './components/Voices';
import AudioToggle from './components/AudioToggle';
import IntroOverlay from './components/IntroOverlay';
import LanguageSwitcher from './components/LanguageSwitcher';
import SiteFooter from './components/SiteFooter';

export default function App() {
  return (
    <LanguageProvider>
      <AudioProvider>
        <div className="app">
          <Nav />
          <Hero />

          <div className="section-divider" />
          <MelodyVisualizer />

          <div className="section-divider" />
          <TimeToggle />

          <div className="section-divider" />
          <EcstaticProjection />

          <div className="section-divider" />
          <Voices />

          <div className="section-divider" />
          <BrainMap />

          <SiteFooter />

          <AudioToggle />
          <LanguageSwitcher />
          <IntroOverlay />
        </div>
      </AudioProvider>
    </LanguageProvider>
  );
}
