import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPreview } from '../components/VideoPreview';

const noop = vi.fn();

describe('VideoPreview', () => {
  // ── Null path (error state) ───────────────────────────────────────────

  test('shows error message when repairedFilePath is null', () => {
    render(
      <VideoPreview repairedFilePath={null} onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.getByText(/output file path is missing/i)).toBeInTheDocument();
  });

  test('does not show play button when repairedFilePath is null', () => {
    render(
      <VideoPreview repairedFilePath={null} onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.queryByLabelText(/play preview/i)).not.toBeInTheDocument();
  });

  // ── Success state ─────────────────────────────────────────────────────

  test('shows "Repair successful" banner with valid path', () => {
    render(
      <VideoPreview repairedFilePath="C:\\fixed.mp4" onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.getByText('Repair successful')).toBeInTheDocument();
  });

  test('shows play button with valid path', () => {
    render(
      <VideoPreview repairedFilePath="C:\\fixed.mp4" onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.getByLabelText(/play preview in system media player/i)).toBeInTheDocument();
  });

  test('shows "Unlock full video" CTA with price', () => {
    render(
      <VideoPreview repairedFilePath="C:\\fixed.mp4" onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.getByText(/Unlock full video.*\$29/)).toBeInTheDocument();
  });

  test('shows free preview label', () => {
    render(
      <VideoPreview repairedFilePath="C:\\fixed.mp4" onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.getByText(/Free preview/i)).toBeInTheDocument();
    expect(screen.getByText(/Full video locked/i)).toBeInTheDocument();
  });

  test('shows trust copy about no subscription', () => {
    render(
      <VideoPreview repairedFilePath="C:\\fixed.mp4" onPlayInPlayer={noop} onProceedToExport={noop} />,
    );
    expect(screen.getByText(/No subscription/i)).toBeInTheDocument();
  });

  // ── Filename display ──────────────────────────────────────────────────

  test('shows filename only, not full Windows path', () => {
    render(
      <VideoPreview
        repairedFilePath="C:\\long\\path\\to\\stream_recovered.mp4"
        onPlayInPlayer={noop}
        onProceedToExport={noop}
      />,
    );
    expect(screen.getByText(/stream_recovered\.mp4/)).toBeInTheDocument();
    expect(screen.queryByText(/C:\\long\\path/)).not.toBeInTheDocument();
  });

  test('shows filename only, not full Unix path', () => {
    render(
      <VideoPreview
        repairedFilePath="/home/user/videos/stream_recovered.mp4"
        onPlayInPlayer={noop}
        onProceedToExport={noop}
      />,
    );
    expect(screen.getByText(/stream_recovered\.mp4/)).toBeInTheDocument();
    expect(screen.queryByText(/\/home\/user\/videos/)).not.toBeInTheDocument();
  });

  // ── Interactions ──────────────────────────────────────────────────────

  test('calls onPlayInPlayer when play button is clicked', async () => {
    const user = userEvent.setup();
    const mockPlay = vi.fn();
    render(
      <VideoPreview
        repairedFilePath="C:\\fixed.mp4"
        onPlayInPlayer={mockPlay}
        onProceedToExport={noop}
      />,
    );
    await user.click(screen.getByLabelText(/play preview in system media player/i));
    expect(mockPlay).toHaveBeenCalledOnce();
  });

  test('calls onProceedToExport when unlock button is clicked', async () => {
    const user = userEvent.setup();
    const mockExport = vi.fn();
    render(
      <VideoPreview
        repairedFilePath="C:\\fixed.mp4"
        onPlayInPlayer={noop}
        onProceedToExport={mockExport}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Unlock full video/i }));
    expect(mockExport).toHaveBeenCalledOnce();
  });

  test('onPlayInPlayer and onProceedToExport are independent', async () => {
    const user = userEvent.setup();
    const mockPlay = vi.fn();
    const mockExport = vi.fn();
    render(
      <VideoPreview
        repairedFilePath="C:\\fixed.mp4"
        onPlayInPlayer={mockPlay}
        onProceedToExport={mockExport}
      />,
    );
    await user.click(screen.getByLabelText(/play preview/i));
    expect(mockPlay).toHaveBeenCalledOnce();
    expect(mockExport).not.toHaveBeenCalled();
  });
});
