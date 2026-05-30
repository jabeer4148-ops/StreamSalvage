import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../components/DropZone';

describe('DropZone', () => {
  // ── Empty state ───────────────────────────────────────────────────────

  test('broken variant shows empty-state copy when no file selected', () => {
    render(<DropZone variant="broken" filePath={null} onClick={vi.fn()} />);
    expect(screen.getByText('Drop your corrupted recording here')).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/)).toBeInTheDocument();
  });

  test('reference variant shows different empty-state copy', () => {
    render(<DropZone variant="reference" filePath={null} onClick={vi.fn()} />);
    expect(screen.getByText('Drop your reference recording here')).toBeInTheDocument();
    expect(screen.queryByText(/corrupted recording/)).not.toBeInTheDocument();
  });

  test('broken variant has red dashed border in empty state', () => {
    render(<DropZone variant="broken" filePath={null} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-[#E24B4A]');
  });

  test('reference variant has blue dashed border in empty state', () => {
    render(<DropZone variant="reference" filePath={null} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-[#378ADD]');
  });

  // ── Filled state ──────────────────────────────────────────────────────

  test('shows filename (not full path) when file is selected', () => {
    render(
      <DropZone variant="broken" filePath="C:\\recordings\\stream_2024.mp4" onClick={vi.fn()} />,
    );
    expect(screen.getByText('stream_2024.mp4')).toBeInTheDocument();
    // Full path should not appear as visible text
    expect(screen.queryByText(/C:\\recordings/)).not.toBeInTheDocument();
  });

  test('shows "Corrupted file:" label when broken file selected', () => {
    render(
      <DropZone variant="broken" filePath="C:\\stream.mp4" onClick={vi.fn()} />,
    );
    expect(screen.getByText('Corrupted file:')).toBeInTheDocument();
  });

  test('shows "Reference file:" label when reference file selected', () => {
    render(
      <DropZone variant="reference" filePath="C:\\ref.mp4" onClick={vi.fn()} />,
    );
    expect(screen.getByText('Reference file:')).toBeInTheDocument();
  });

  test('shows "Click to change" affordance when file is selected', () => {
    render(<DropZone variant="broken" filePath="C:\\stream.mp4" onClick={vi.fn()} />);
    expect(screen.getByText('Click to change')).toBeInTheDocument();
  });

  test('switches to solid border when file is selected', () => {
    render(<DropZone variant="broken" filePath="C:\\stream.mp4" onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-solid');
    expect(button.className).toContain('border-neutral-200');
    // Color border should be gone in filled state
    expect(button.className).not.toContain('border-[#E24B4A]');
  });

  test('full path is preserved in title attribute for hover', () => {
    const fullPath = 'C:\\very\\long\\path\\stream.mp4';
    render(<DropZone variant="broken" filePath={fullPath} onClick={vi.fn()} />);
    // The filename element has the full path as title
    const filenameEl = screen.getByText('stream.mp4');
    expect(filenameEl).toHaveAttribute('title', fullPath);
  });

  // ── Interaction ───────────────────────────────────────────────────────

  test('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockClick = vi.fn();
    render(<DropZone variant="broken" filePath={null} onClick={mockClick} />);
    await user.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalledOnce();
  });

  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const mockClick = vi.fn();
    render(
      <DropZone variant="broken" filePath={null} onClick={mockClick} disabled={true} />,
    );
    await user.click(screen.getByRole('button'));
    expect(mockClick).not.toHaveBeenCalled();
  });

  test('disabled state applies opacity class', () => {
    render(
      <DropZone variant="broken" filePath={null} onClick={vi.fn()} disabled={true} />,
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('opacity-50');
    expect(button.className).toContain('cursor-not-allowed');
  });

  test('has focus ring class for keyboard accessibility', () => {
    render(<DropZone variant="broken" filePath={null} onClick={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('focus:ring-2');
    expect(button.className).toContain('focus:ring-[#1D9E75]');
  });

  // ── Icons ─────────────────────────────────────────────────────────────

  test('broken variant shows film icon', () => {
    render(<DropZone variant="broken" filePath={null} onClick={vi.fn()} />);
    expect(screen.getByText('🎬')).toBeInTheDocument();
  });

  test('reference variant shows camera icon', () => {
    render(<DropZone variant="reference" filePath={null} onClick={vi.fn()} />);
    expect(screen.getByText('📹')).toBeInTheDocument();
  });
});
