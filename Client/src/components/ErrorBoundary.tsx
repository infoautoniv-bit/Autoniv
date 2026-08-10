import * as Sentry from '@sentry/react';
import { type ReactNode, type ReactElement } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
}

export function ErrorBoundary({ children, fallback }: Props): ReactElement {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }): ReactElement => (
        fallback ? (
          fallback
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
              <p className="text-slate-400 mb-6">An unexpected error occurred. Please try again.</p>
              <button
                onClick={resetError}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
