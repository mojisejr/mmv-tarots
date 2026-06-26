import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

vi.mock("@/components", () => ({
  GlassCard: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  GlassButton: ({
    children,
    isLoading: _isLoading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean;
  }) => <button {...props}>{children}</button>,
  ChevronLeft: () => <span data-testid="chevron-left" />,
  Loader2: () => <span data-testid="loader" />,
  AlertCircle: () => <span data-testid="alert" />,
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/reading", () => ({
  ReadingHeader: () => null,
  CardSpread: () => null,
  SuggestionsList: () => null,
  NextQuestions: () => null,
  FinalSummary: () => null,
  Disclaimer: () => null,
  ShareActions: () => null,
}));

vi.mock("@/components/features/tarot", () => ({
  TarotCardImage: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/client/providers/navigation-provider", () => ({
  useNavigation: () => ({ setCurrentPage: vi.fn() }),
}));

import { ReadingNotesEditor } from "@/app/history/[id]/history-detail-view";

describe("ReadingNotesEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders an empty note editor", () => {
    render(
      <ReadingNotesEditor predictionId="job-123-abcdefghi" initialNotes="" />,
    );

    expect(
      screen.getByRole("heading", { name: "โน้ตส่วนตัว" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("โน้ตส่วนตัว")).toHaveValue("");
    expect(
      screen.getByText("ยังไม่มีโน้ตสำหรับ reading นี้"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "บันทึกโน้ต" })).toBeDisabled();
  });

  it("saves edited notes through the PATCH endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ prediction: { notes: "โน้ตใหม่" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ReadingNotesEditor
        predictionId="job-123-abcdefghi"
        initialNotes="โน้ตเดิม"
      />,
    );

    const textarea = screen.getByLabelText("โน้ตส่วนตัว");
    await user.clear(textarea);
    await user.type(textarea, "โน้ตใหม่");
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/predictions/job-123-abcdefghi/notes",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: "โน้ตใหม่" }),
        },
      );
    });
    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
    expect(textarea).toHaveValue("โน้ตใหม่");
    expect(screen.getByRole("button", { name: "บันทึกโน้ต" })).toBeDisabled();
  });

  it("shows save errors without clearing typed notes", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "notes must be shorter" }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(
      <ReadingNotesEditor predictionId="job-123-abcdefghi" initialNotes="" />,
    );

    const textarea = screen.getByLabelText("โน้ตส่วนตัว");
    await user.type(textarea, "ยาวเกินไป");
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));

    expect(
      await screen.findByText("notes must be shorter"),
    ).toBeInTheDocument();
    expect(textarea).toHaveValue("ยาวเกินไป");
    expect(
      screen.getByRole("button", { name: "บันทึกโน้ต" }),
    ).not.toBeDisabled();
  });
});
