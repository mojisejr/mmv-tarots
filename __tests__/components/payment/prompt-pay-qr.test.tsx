import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PromptPayQR } from '../../../components/features/payment/PromptPayQR';

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => <img alt={alt} {...props} />,
}));

vi.mock('promptpay-qr', () => ({
  default: vi.fn(() => 'promptpay-payload'),
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr-code'),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

vi.mock('@/components', () => ({
  GlassButton: ({ children, onClick, disabled, className }: { children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) => (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe('PromptPayQR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:slip-preview'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('enables submit after selecting a slip and posts multipart form data', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'SLIP_UPLOADED' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order: {
            referenceCode: 'REF-001',
            status: 'VERIFYING',
            verificationErrorMessage: 'กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที',
          },
        }),
      } as Response);

    render(
      <PromptPayQR
        orderId="order_001"
        referenceCode="REF-001"
        expiresAt="2099-03-19T00:00:00.000Z"
        amount={99}
        promptPayTargetId="0812345678"
        initialStatus="PENDING_PAYMENT"
        onCredited={vi.fn()}
        onExpired={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'ส่งสลิปเพื่อยืนยัน' });
    expect(submitButton).toBeDisabled();

    const file = new File(['slip'], 'slip.png', { type: 'image/png' });
    const input = screen.getByLabelText('อัปโหลดรูปสลิปการโอน');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('slip.png')).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
    expect(requestUrl).toBe('/api/payment/orders/order_001/slip');
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.body).toBeInstanceOf(FormData);

    const slipFile = (requestInit?.body as FormData).get('slipFile');
    expect(slipFile).toBeInstanceOf(File);
    expect((slipFile as File).name).toBe('slip.png');

    expect(await screen.findByText('กรุณารอการตรวจสอบสลิปหลังการโอนประมาณ 7 นาที')).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith('ส่งสลิปแล้ว ระบบกำลังตรวจสอบ');
  });

  it('shows actionable Thai error when the upload is rejected', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        status: 'REJECTED',
        error: {
          message: 'รองรับเฉพาะไฟล์ภาพ JPG, PNG, WEBP เท่านั้น',
        },
      }),
    } as Response);

    render(
      <PromptPayQR
        orderId="order_002"
        referenceCode="REF-002"
        expiresAt="2099-03-19T00:00:00.000Z"
        amount={199}
        promptPayTargetId="0812345678"
        initialStatus="PENDING_PAYMENT"
        onCredited={vi.fn()}
        onExpired={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const file = new File(['slip'], 'slip.webp', { type: 'image/webp' });
    const input = screen.getByLabelText('อัปโหลดรูปสลิปการโอน');
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'ส่งสลิปเพื่อยืนยัน' }));

    expect(await screen.findByText('รองรับเฉพาะไฟล์ภาพ JPG, PNG, WEBP เท่านั้น')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});