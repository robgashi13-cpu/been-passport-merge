import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="font-display text-2xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-white/60 mb-6 max-w-sm">
                        The application encountered a critical error. Please restart the app.
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left w-full max-w-lg overflow-auto max-h-[300px] mb-6">
                        <code className="text-xs text-red-400 font-mono block mb-2">
                            {this.state.error?.toString()}
                        </code>
                        <pre className="text-[10px] text-white/40 font-mono whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-colors"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
