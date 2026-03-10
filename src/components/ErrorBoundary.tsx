"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in child component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-black border-l border-white/10 text-white z-[100] relative">
          <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 max-w-sm w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-tight text-red-400 mb-2">Erreur Critique</h2>
            <p className="text-xs text-red-300/80 mb-6 uppercase tracking-widest font-bold">
              Le composant a planté
            </p>
            
            <div className="bg-black/50 p-4 rounded-xl text-left overflow-x-auto text-[10px] font-mono text-red-300">
              <span className="font-bold block mb-1">Message d'erreur :</span>
              {this.state.error?.message || 'Erreur inconnue'}
            </div>

            <button
              className="mt-6 h-12 w-full bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-600 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Fermer la vue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
