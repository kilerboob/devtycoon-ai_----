import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { dbService } from './services/dbService';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = async () => {
    try {
        await dbService.deleteSave();
        window.location.reload();
    } catch (e) {
        alert("Ошибка сброса. Попробуйте очистить данные сайта вручную.");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-blue-900 text-white font-mono flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold mb-4">:(</h1>
          <h2 className="text-xl mb-4">CRITICAL SYSTEM FAILURE</h2>
          <div className="bg-blue-800 p-4 rounded border border-blue-400 mb-6 text-left w-full max-w-lg overflow-auto max-h-40">
            <code className="text-xs">{this.state.error?.toString()}</code>
          </div>
          <p className="mb-8 max-w-md">
            Похоже, сохранение игры повреждено или несовместимо с новой версией.
            Попробуйте сбросить прогресс.
          </p>
          <button 
            onClick={this.handleReset}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded font-bold shadow-lg transition-transform hover:scale-105"
          >
            FACTORY RESET (СБРОСИТЬ СОХРАНЕНИЕ)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);