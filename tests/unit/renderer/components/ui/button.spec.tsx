/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "@/renderer/components/ui/button";

describe("ui/button", () => {
    it("renders native button by default", () => {
        render(<Button>Default</Button>);
        expect(screen.getByRole("button").tagName).toBe("BUTTON");
    });

    it("renders Slot child when asChild is true", () => {
        render(
            <Button asChild>
                <a href="/docs" data-testid="link-button">
                    Docs
                </a>
            </Button>
        );

        expect(screen.getByTestId("link-button").tagName).toBe("A");
    });
});
