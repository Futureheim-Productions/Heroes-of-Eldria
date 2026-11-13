import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from 'i18next';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-fantasy flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-4xl">💀</div>
          <h2 className="text-lg text-gold">{i18n.t('common:error_title')}</h2>
          <p className="max-w-md text-[12px] text-ink-dim">{i18n.t('common:error_body')}</p>
          <pre className="max-w-[80vw] overflow-auto rounded bg-black/50 p-2 text-left text-[10px] text-blood-2">
            {this.state.error.message}
          </pre>
          <button
            className="rounded-lg bg-gold px-4 py-2 font-bold text-black"
            onClick={() => window.location.reload()}
          >
            {i18n.t('common:reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
