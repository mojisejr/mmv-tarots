import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const apiMocks = vi.hoisted(() => ({
  checkJobStatus: vi.fn(),
}));

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

vi.mock("@/lib/client/api", () => ({
  checkJobStatus: apiMocks.checkJobStatus,
}));

import {
  HistoryDetailView,
  ReadingNotesEditor,
} from "@/app/history/[id]/history-detail-view";

const completedReading = (notes = "") => ({
  jobId: "job-owner-reading",
  status: "COMPLETED" as const,
  question: "งานนี้ควรไปต่อยังไง",
  notes,
  createdAt: "2026-06-26T00:00:00.000Z",
  completedAt: "2026-06-26T00:01:00.000Z",
  result: {
    selectedCards: [],
    analysis: {},
    reading: {
      header: "ไพ่บอกให้ค่อยๆ ดู",
      cards_reading: [
        {
          position: 0,
          name_th: "ผู้เริ่มต้น",
          name_en: "The Fool",
          arcana: "Major Arcana",
          keywords: ["เริ่ม", "ทดลอง"],
          interpretation: "เริ่มจากหลักฐานจริง",
          image: "/cards/fool.png",
        },
      ],
      reading: "คำทำนายสำหรับเจ้าของ reading",
      suggestions: [],
      next_questions: [],
      final_summary: "",
      disclaimer: "",
    },
  },
});

describe("ReadingNotesEditor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    apiMocks.checkJobStatus.mockReset();
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

  it("persists saved, edited, and cleared notes across reload-style remounts", async () => {
    const user = userEvent.setup();
    let serverNotes = "";
    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      const payload = JSON.parse(String((init as RequestInit).body));
      serverNotes = payload.notes.trim().length > 0 ? payload.notes : "";
      return new Response(
        JSON.stringify({ prediction: { notes: serverNotes } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const renderEditor = () =>
      render(
        <ReadingNotesEditor
          predictionId="job-owner-reading"
          initialNotes={serverNotes}
        />,
      );

    let view = renderEditor();
    const firstNote = "บทเรียนแรก: save แล้ว reload ต้องยังอยู่";
    await user.type(screen.getByLabelText("โน้ตส่วนตัว"), firstNote);
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();

    view.unmount();
    view = renderEditor();
    expect(screen.getByLabelText("โน้ตส่วนตัว")).toHaveValue(firstNote);

    const editedNote = "บทเรียนที่แก้แล้ว: reload ต้องเห็นเวอร์ชันล่าสุด";
    await user.clear(screen.getByLabelText("โน้ตส่วนตัว"));
    await user.type(screen.getByLabelText("โน้ตส่วนตัว"), editedNote);
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();

    view.unmount();
    view = renderEditor();
    expect(screen.getByLabelText("โน้ตส่วนตัว")).toHaveValue(editedNote);

    await user.clear(screen.getByLabelText("โน้ตส่วนตัว"));
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));
    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();

    view.unmount();
    renderEditor();
    expect(screen.getByLabelText("โน้ตส่วนตัว")).toHaveValue("");
    expect(
      screen.getByText("ยังไม่มีโน้ตสำหรับ reading นี้"),
    ).toBeInTheDocument();
  });

  it("saves special characters, emoji, and multiline notes exactly", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ prediction: { notes: "" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const note = "บรรทัด 1\n<>&\"' /? 🔮💡 emoji + symbols";

    render(
      <ReadingNotesEditor predictionId="job-owner-reading" initialNotes="" />,
    );

    fireEvent.change(screen.getByLabelText("โน้ตส่วนตัว"), {
      target: { value: note },
    });
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/predictions/job-owner-reading/notes",
        expect.objectContaining({
          body: JSON.stringify({ notes: note }),
        }),
      );
    });
  });

  it("blocks over-limit notes before save", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ReadingNotesEditor predictionId="job-owner-reading" initialNotes="" />,
    );

    fireEvent.change(screen.getByLabelText("โน้ตส่วนตัว"), {
      target: { value: "x".repeat(5001) },
    });

    expect(screen.getByText("5001/5000")).toBeInTheDocument();
    const saveButton = screen.getByRole("button", { name: "บันทึกโน้ต" });
    expect(saveButton).toBeDisabled();
    await user.click(saveButton);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("disables save while a note is being saved", async () => {
    const user = userEvent.setup();
    let resolveSave: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveSave = resolve;
          }),
      ),
    );

    render(
      <ReadingNotesEditor predictionId="job-owner-reading" initialNotes="" />,
    );

    await user.type(screen.getByLabelText("โน้ตส่วนตัว"), "กำลังบันทึก");
    const saveButton = screen.getByRole("button", { name: "บันทึกโน้ต" });
    await user.click(saveButton);

    await waitFor(() => expect(saveButton).toBeDisabled());

    resolveSave(
      new Response(JSON.stringify({ prediction: { notes: "กำลังบันทึก" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });
});

describe("HistoryDetailView reading notes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    apiMocks.checkJobStatus.mockReset();
  });

  it("shows the owner reading and lets the owner edit notes", async () => {
    const user = userEvent.setup();
    apiMocks.checkJobStatus.mockResolvedValue(completedReading("โน้ตเจ้าของ"));
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ prediction: { notes: "โน้ตเจ้าของที่แก้แล้ว" } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<HistoryDetailView id="job-owner-reading" />);

    expect(await screen.findByText("งานนี้ควรไปต่อยังไง")).toBeInTheDocument();
    expect(
      screen.getByText("คำทำนายสำหรับเจ้าของ reading"),
    ).toBeInTheDocument();
    const textarea = screen.getByLabelText("โน้ตส่วนตัว");
    expect(textarea).toHaveValue("โน้ตเจ้าของ");

    await user.clear(textarea);
    await user.type(textarea, "โน้ตเจ้าของที่แก้แล้ว");
    await user.click(screen.getByRole("button", { name: "บันทึกโน้ต" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/predictions/job-owner-reading/notes",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ notes: "โน้ตเจ้าของที่แก้แล้ว" }),
        }),
      );
    });
    expect(await screen.findByText("บันทึกแล้ว")).toBeInTheDocument();
  });
});
