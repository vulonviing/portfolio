import './App.css';
import { LanguageProvider } from './i18n/LanguageProvider';
import Nav from './components/Nav';
import Hero from './components/Hero';
import ActOneMachine from './components/ActOneMachine';
import StackScroller from './components/StackScroller';
import CallTrace from './components/CallTrace';
import SiteFooter from './components/SiteFooter';

export default function App() {
  return (
    <LanguageProvider>
      <div className="app">
        <Nav />
        <Hero />
        <ActOneMachine />
        <StackScroller />
        <CallTrace />
        <SiteFooter />
      </div>
    </LanguageProvider>
  );
}
