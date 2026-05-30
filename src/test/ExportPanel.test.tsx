import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportPanel } from '../components/ExportPanel';

const makeMockProps = () => ({
  licenseValid: false,
  onCheckLicense: vi.fn(),
  onExport: vi.fn(),
  onReset: vi.fn(),
});

describe('ExportPanel', () => {
  let mockProps: ReturnType<typeof makeMockProps>;

  beforeEach(() => {
    mockProps = makeMockProps();
  });

  // ── License input screen ──────────────────────────────────────────────

  test('shows license input when licenseValid is false', () => {
    render(<ExportPanel {...mockProps} />);
    expect(screen.getByLabelText(/License key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify license key/i })).toBeInTheDocument();
  });

  test('shows "Buy for $29" checkout link', () => {
    render(<ExportPanel {...mockProps} />);
    const link = screen.getByRole('link', { name: /Buy for \$29/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://streamsalvage.lemonsqueezy.com/buy/');
  });

  test('verify button is disabled when input is empty', () => {
    render(<ExportPanel {...mockProps} />);
    expect(screen.getByRole('button', { name: /Verify license key/i })).toBeDisabled();
  });

  test('verify button becomes enabled after typing', async () => {
    const user = userEvent.setup();
    render(<ExportPanel {...mockProps} />);
    await user.type(screen.getByLabelText(/License key/i), 'TEST-1234');
    expect(screen.getByRole('button', { name: /Verify license key/i })).not.toBeDisabled();
  });

  test('input converts typed text to uppercase', async () => {
    const user = userEvent.setup();
    render(<ExportPanel {...mockProps} />);
    const input = screen.getByLabelText(/License key/i);
    await user.type(input, 'test-1234');
    expect(input).toHaveValue('TEST-1234');
  });

  test('calls onCheckLicense with trimmed key on button click', async () => {
    const user = userEvent.setup();
    mockProps.onCheckLicense.mockResolvedValue(true);
    render(<ExportPanel {...mockProps} />);

    await user.type(screen.getByLabelText(/License key/i), 'TEST-1234');
    await user.click(screen.getByRole('button', { name: /Verify license key/i }));

    expect(mockProps.onCheckLicense).toHaveBeenCalledWith('TEST-1234');
  });

  test('Enter key triggers verification', async () => {
    const user = userEvent.setup();
    mockProps.onCheckLicense.mockResolvedValue(false);
    render(<ExportPanel {...mockProps} />);

    await user.type(screen.getByLabelText(/License key/i), 'TEST-1234');
    await user.keyboard('{Enter}');

    expect(mockProps.onCheckLicense).toHaveBeenCalledWith('TEST-1234');
  });

  test('shows "Verifying..." while check is in progress', async () => {
    const user = userEvent.setup();
    let resolveCheck: (v: boolean) => void;
    mockProps.onCheckLicense.mockReturnValue(
      new Promise<boolean>((res) => {
        resolveCheck = res;
      }),
    );
    render(<ExportPanel {...mockProps} />);

    await user.type(screen.getByLabelText(/License key/i), 'TEST-1234');
    await user.click(screen.getByRole('button', { name: /Verify license key/i }));

    expect(screen.getByText('Verifying...')).toBeInTheDocument();

    resolveCheck!(true);
    await waitFor(() =>
      expect(screen.queryByText('Verifying...')).not.toBeInTheDocument(),
    );
  });

  test('shows "License verified" state after successful validation', async () => {
    const user = userEvent.setup();
    mockProps.onCheckLicense.mockResolvedValue(true);
    render(<ExportPanel {...mockProps} />);

    await user.type(screen.getByLabelText(/License key/i), 'TEST-1234');
    await user.click(screen.getByRole('button', { name: /Verify license key/i }));

    await waitFor(() =>
      expect(screen.getByText(/License verified/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /Save repaired video to disk/i }),
    ).toBeInTheDocument();
  });

  test('shows "not recognized" error after failed validation', async () => {
    const user = userEvent.setup();
    mockProps.onCheckLicense.mockResolvedValue(false);
    render(<ExportPanel {...mockProps} />);

    await user.type(screen.getByLabelText(/License key/i), 'BAD-KEY');
    await user.click(screen.getByRole('button', { name: /Verify license key/i }));

    await waitFor(() =>
      expect(screen.getByText(/not recognized/i)).toBeInTheDocument(),
    );
    // Input must still be present so user can retry
    expect(screen.getByLabelText(/License key/i)).toBeInTheDocument();
  });

  test('shows internet connection error on network failure', async () => {
    const user = userEvent.setup();
    mockProps.onCheckLicense.mockRejectedValue(new Error('Network'));
    render(<ExportPanel {...mockProps} />);

    await user.type(screen.getByLabelText(/License key/i), 'TEST-1234');
    await user.click(screen.getByRole('button', { name: /Verify license key/i }));

    await waitFor(() =>
      expect(screen.getByText(/internet connection/i)).toBeInTheDocument(),
    );
  });

  // ── Ready state (licenseValid=true) ───────────────────────────────────

  test('starts directly in ready state when licenseValid is true', () => {
    render(<ExportPanel {...mockProps} licenseValid={true} />);
    expect(
      screen.getByRole('button', { name: /Save repaired video to disk/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/License key/i)).not.toBeInTheDocument();
  });

  test('calls onExport when save button is clicked', async () => {
    const user = userEvent.setup();
    mockProps.onExport.mockResolvedValue(undefined);
    render(<ExportPanel {...mockProps} licenseValid={true} />);

    await user.click(screen.getByRole('button', { name: /Save repaired video to disk/i }));
    expect(mockProps.onExport).toHaveBeenCalledOnce();
  });

  test('shows "Saving..." while export is in progress', async () => {
    const user = userEvent.setup();
    let resolveExport: () => void;
    mockProps.onExport.mockReturnValue(
      new Promise<void>((res) => {
        resolveExport = res;
      }),
    );
    render(<ExportPanel {...mockProps} licenseValid={true} />);

    await user.click(screen.getByRole('button', { name: /Save repaired video to disk/i }));
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    resolveExport!();
    await waitFor(() =>
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument(),
    );
  });

  // ── Done state ────────────────────────────────────────────────────────

  test('shows "File saved successfully" after successful export', async () => {
    const user = userEvent.setup();
    mockProps.onExport.mockResolvedValue(undefined);
    render(<ExportPanel {...mockProps} licenseValid={true} />);

    await user.click(screen.getByRole('button', { name: /Save repaired video to disk/i }));

    await waitFor(() =>
      expect(screen.getByText('File saved successfully')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Repair another file/i)).toBeInTheDocument();
  });

  test('calls onReset when "Repair another file" is clicked', async () => {
    const user = userEvent.setup();
    mockProps.onExport.mockResolvedValue(undefined);
    render(<ExportPanel {...mockProps} licenseValid={true} />);

    await user.click(screen.getByRole('button', { name: /Save repaired video to disk/i }));
    await waitFor(() => screen.getByText(/Repair another file/i));

    await user.click(screen.getByText(/Repair another file/i));
    expect(mockProps.onReset).toHaveBeenCalledOnce();
  });

  // ── Export error state ────────────────────────────────────────────────

  test('shows error message and save button when export throws', async () => {
    const user = userEvent.setup();
    mockProps.onExport.mockRejectedValue(new Error('Copy failed'));
    render(<ExportPanel {...mockProps} licenseValid={true} />);

    await user.click(screen.getByRole('button', { name: /Save repaired video to disk/i }));

    await waitFor(() =>
      expect(screen.getByText(/Export failed/i)).toBeInTheDocument(),
    );
    // Save button remains so user can retry
    expect(
      screen.getByRole('button', { name: /Save repaired video to disk/i }),
    ).toBeInTheDocument();
  });
});
