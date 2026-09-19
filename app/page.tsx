'use client';

import { useSyncExternalStore } from 'react';
import ChatApp from './components/ChatApp';

const subscribe = () => () => {};

export default function Home() {
  // ChatApp reads localStorage on first render, so only mount it in the browser.
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return isClient ? <ChatApp /> : <div className="h-full bg-paper" />;
}