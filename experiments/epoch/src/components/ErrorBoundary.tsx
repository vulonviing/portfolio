/**
 * ErrorBoundary — catches React render errors and shows the message as text.
 * Makes "blank screen" crashes readable without needing a screenshot.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  label?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.label ?? "", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 p-4 rounded-xl border border-red-700/60 bg-red-900/10 text-red-300">
          <div className="font-semibold mb-2 text-sm">
            ⚠ {this.props.label ?? "Component"} crashed
          </div>
          <pre className="text-xs text-red-400 whitespace-pre-wrap break-all">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
