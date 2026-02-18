/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ErrorBoundary } from "@/renderer/main-window/components/ErrorBoundary";

// コンソールエラーを抑制するためのセットアップ
const originalConsoleError = console.error;
const consoleErrorMock = vi.fn();

// エラーを投げるコンポーネント
const ErrorThrower = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error("Test Error");
    }
    return <div>No Error</div>;
};

// navigator.clipboard のモック
Object.defineProperty(navigator, "clipboard", {
    value: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    writable: true,
});

// react-i18next のモック
vi.mock("react-i18next", () => ({
    // withTranslation HOCのモック: コンポーネントに t 関数を注入してそのまま返す
    withTranslation: () => (Component: any) => {
        Component.defaultProps = { ...Component.defaultProps, t: (key: string) => key };
        return Component;
    },
    // Trans コンポーネントのモック: i18nKey を表示する
    Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
}));

describe("ErrorBoundary", () => {
    beforeEach(() => {
        console.error = consoleErrorMock;
        vi.clearAllMocks();
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    it("should render children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <ErrorThrower shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText("No Error")).toBeTruthy();
        expect(screen.queryByTestId("error-boundary-ui")).toBeNull();
    });

    it("should render error UI when an error occurs", () => {
        render(
            <ErrorBoundary>
                <ErrorThrower shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("error-boundary-ui")).toBeTruthy();
        expect(screen.getByText("render.error_boundary.title")).toBeTruthy();
        expect(screen.getByText("render.error_boundary.description")).toBeTruthy();
        // エラー内容が表示されているか（開発者向け情報）
        expect(screen.getByText(/Error: Test Error/)).toBeTruthy();
    });

    it("should copy error details when copy button is clicked", async () => {
        render(
            <ErrorBoundary>
                <ErrorThrower shouldThrow={true} />
            </ErrorBoundary>
        );

        await waitFor(() => {
            expect(screen.getByTestId("copy-error-button")).toBeTruthy();
        });

        const copyButton = screen.getByTestId("copy-error-button");
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("Error: Test Error")
        );
    });

    it("should call onError when render error is caught", () => {
        const onError = vi.fn();
        render(
            <ErrorBoundary onError={onError}>
                <ErrorThrower shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(onError.mock.calls[0][1]).toBeTruthy();
    });

    it("should call onError when copy fails", async () => {
        const onError = vi.fn();
        vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
            new Error("copy failed")
        );

        render(
            <ErrorBoundary onError={onError}>
                <ErrorThrower shouldThrow={true} />
            </ErrorBoundary>
        );

        await waitFor(() => {
            expect(screen.getByTestId("copy-error-button")).toBeTruthy();
        });
        fireEvent.click(screen.getByTestId("copy-error-button"));

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "copy failed" }),
                null
            );
        });
    });
});
