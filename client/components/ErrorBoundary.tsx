import React, { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("🔴 ERROR BOUNDARY CAUGHT:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 Error details:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#1a1a2e",
            color: "#fff",
            fontFamily: "monospace",
            padding: "20px",
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            <h1 style={{ color: "#ff6b6b", marginBottom: "20px" }}>
              Application Error
            </h1>
            <pre
              style={{
                backgroundColor: "#0f1419",
                padding: "15px",
                borderRadius: "8px",
                overflow: "auto",
                color: "#ff6b6b",
              }}
            >
              {this.state.error?.toString()}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
            <p style={{ marginTop: "20px", color: "#aaa" }}>
              Check the browser console for more details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
