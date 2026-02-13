import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Copy, RotateCw } from "lucide-react";
import { withTranslation, WithTranslation } from "react-i18next";
import { Trans } from "react-i18next";

interface Props extends WithTranslation {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundaryBase extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleCopyError = () => {
        const { error, errorInfo } = this.state;
        const text = `Error: ${error?.message}\n\nStack:\n${error?.stack}\n\nComponent Stack:\n${errorInfo?.componentStack}`;
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Failed to copy error details:", err);
        });
    };
    // ... (中略) ...
    render() {
        // ... (render content) ...
        const { t } = this.props;
        if (this.state.hasError) {
            // ... same render logic ...
            return (
                <div
                    style={{
                        height: "100vh",
                        width: "100vw",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#1a1a1a",
                        color: "#e5e5e5",
                        padding: "20px",
                        boxSizing: "border-box",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                    data-testid="error-boundary-ui"
                >
                    <div
                        style={{
                            maxWidth: "600px",
                            width: "100%",
                            backgroundColor: "#262626",
                            padding: "30px",
                            borderRadius: "12px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                            textAlign: "center",
                        }}
                    >
                        <AlertTriangle
                            size={64}
                            color="#ef4444"
                            style={{ marginBottom: "20px" }}
                        />
                        <h1
                            style={{
                                margin: "0 0 10px 0",
                                fontSize: "24px",
                                fontWeight: "bold",
                            }}
                        >
                            {t("render.error_boundary.title")}
                        </h1>
                        <p
                            style={{
                                margin: "0 0 30px 0",
                                color: "#a3a3a3",
                                fontSize: "16px",
                            }}
                        >
                            <Trans
                                i18nKey="render.error_boundary.description"
                                components={{ br: <br /> }}
                            />
                        </p>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                onClick={this.handleReload}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 20px",
                                    backgroundColor: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                <RotateCw size={16} />
                                {t("render.error_boundary.reload")}
                            </button>
                            <button
                                onClick={this.handleCopyError}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 20px",
                                    backgroundColor: "#404040",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                }}
                                data-testid="copy-error-button"
                            >
                                <Copy size={16} />
                                {t("render.error_boundary.copy_details")}
                            </button>
                        </div>

                        {this.state.error && (
                            <div
                                style={{
                                    marginTop: "30px",
                                    textAlign: "left",
                                    backgroundColor: "#171717",
                                    padding: "15px",
                                    borderRadius: "6px",
                                    overflow: "auto",
                                    maxHeight: "200px",
                                    fontSize: "12px",
                                    fontFamily: "monospace",
                                    color: "#f87171",
                                }}
                            >
                                {this.state.error.toString()}
                                <br />
                                {this.state.errorInfo?.componentStack}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
export default ErrorBoundary;
