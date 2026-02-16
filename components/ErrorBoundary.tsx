import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    declare props: Props;
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-quirky-cream flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white border-4 border-black rounded-3xl p-8 shadow-hard text-center">
                        <div className="text-6xl mb-4">😵</div>
                        <h2 className="font-heading text-2xl mb-2">OOPS! SOMETHING BROKE</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Don't worry, it's not your fault. Try refreshing the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-quirky-green border-2 border-black px-6 py-3 rounded-full font-heading font-bold shadow-hard-sm hover:scale-105 transition-transform"
                        >
                            REFRESH PAGE
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
