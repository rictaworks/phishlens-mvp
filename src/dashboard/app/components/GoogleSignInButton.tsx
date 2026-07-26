'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleIdentityAuth } from '../../lib/auth/google-identity';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleSignInButtonProps {
  clientId: string;
  onCredential: (idToken: string) => void;
}

function loadGisScript(onLoad: () => void): void {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
  if (existing !== null) {
    onLoad();
    return;
  }

  const script = document.createElement('script');
  script.src = GIS_SCRIPT_SRC;
  script.async = true;
  script.addEventListener('load', onLoad);
  document.body.appendChild(script);
}

export function GoogleSignInButton({ clientId, onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const authRef = useRef<GoogleIdentityAuth | null>(null);
  if (authRef.current === null) {
    authRef.current = new GoogleIdentityAuth();
  }
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadGisScript(() => setScriptLoaded(true));
  }, []);

  useEffect(() => {
    if (!scriptLoaded || containerRef.current === null) {
      return;
    }

    authRef.current!.initialize(clientId, onCredential);
    authRef.current!.renderButton(containerRef.current);
  }, [scriptLoaded, clientId, onCredential]);

  return <div ref={containerRef} data-testid="google-signin-button" />;
}
