/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/renderer/components/ui/popover";

describe("ui/popover", () => {
    it("renders popover content with default props when opened", () => {
        render(
            <Popover defaultOpen>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent data-testid="popover-content">
                    Content
                </PopoverContent>
            </Popover>
        );

        expect(screen.getByTestId("popover-content")).toBeTruthy();
        expect(screen.getByText("Content")).toBeTruthy();
    });
});
