import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { RepairProgress } from '../components/RepairProgress';

const defaultProps = {
  progress: 50,
  log: [],
  hasReferenceFile: true,
  repairError: null,
};

describe('RepairProgress', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Progress bar ──────────────────────────────────────────────────────

  test('progress bar width reflects progress prop', () => {
    render(<RepairProgress {...defaultProps} progress={65} />);
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('65%');
  });

  test('progress clamped to 100% maximum', () => {
    render(<RepairProgress {...defaultProps} progress={150} />);
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  test('progress clamped to 0% minimum — both bar width and display text', () => {
    // After fix: Math.max(0, Math.min(progress, 100)) applied to bar width.
    render(<RepairProgress {...defaultProps} progress={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    const bar = document.querySelector('[style*="width"]') as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('0%');
  });

  test('percentage display rounds to nearest integer', () => {
    render(<RepairProgress {...defaultProps} progress={66.7} />);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  // ── Log terminal ──────────────────────────────────────────────────────

  test('log lines are rendered', () => {
    const log = ['Line one', 'Line two', 'Line three'];
    render(<RepairProgress {...defaultProps} log={log} />);
    expect(screen.getByText('Line one')).toBeInTheDocument();
    expect(screen.getByText('Line two')).toBeInTheDocument();
    expect(screen.getByText('Line three')).toBeInTheDocument();
  });

  test('log lines appear in DOM order', () => {
    const log = ['First', 'Second'];
    render(<RepairProgress {...defaultProps} log={log} />);
    const lines = screen.getAllByText(/First|Second/);
    expect(lines[0].textContent).toBe('First');
    expect(lines[1].textContent).toBe('Second');
  });

  test('shows placeholder when log is empty', () => {
    render(<RepairProgress {...defaultProps} log={[]} />);
    expect(screen.getByText('Starting repair engine...')).toBeInTheDocument();
  });

  // ── Reference file warning ────────────────────────────────────────────

  test('shows no-reference warning when hasReferenceFile is false', () => {
    render(<RepairProgress {...defaultProps} hasReferenceFile={false} />);
    // Actual copy: "Running without reference file - if this fails, try again with one."
    // Note: the ~40% success rate text lives in NoReferenceWarning, not RepairProgress.
    expect(screen.getByText(/Running without reference file/i)).toBeInTheDocument();
  });

  test('does not show no-reference warning when hasReferenceFile is true', () => {
    render(<RepairProgress {...defaultProps} hasReferenceFile={true} />);
    expect(screen.queryByText(/without reference file/i)).not.toBeInTheDocument();
  });

  // ── Error display ─────────────────────────────────────────────────────

  test('shows error box when repairError is not null', () => {
    render(
      <RepairProgress {...defaultProps} repairError="FFmpeg stream copy failed" />,
    );
    expect(screen.getByText('FFmpeg stream copy failed')).toBeInTheDocument();
  });

  test('does not show error box when repairError is null', () => {
    render(<RepairProgress {...defaultProps} repairError={null} />);
    // No red error container
    expect(document.querySelector('.bg-red-50')).toBeNull();
  });

  // ── Long-wait message (timer-based) ──────────────────────────────────

  test('does not show long-wait message initially', () => {
    render(<RepairProgress {...defaultProps} progress={50} />);
    expect(screen.queryByText(/Still working/)).not.toBeInTheDocument();
  });

  test('shows long-wait message after 60 seconds', () => {
    vi.useFakeTimers();
    render(<RepairProgress {...defaultProps} progress={50} />);

    expect(screen.queryByText(/Still working/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(61_000);
    });

    expect(screen.getByText(/Still working/)).toBeInTheDocument();
  });

  test('long-wait message does not appear if progress reaches 100 before timer fires', () => {
    vi.useFakeTimers();
    const { rerender } = render(<RepairProgress {...defaultProps} progress={50} />);

    // Complete before 60s
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    rerender(<RepairProgress {...defaultProps} progress={100} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.queryByText(/Still working/)).not.toBeInTheDocument();
  });

  test('long-wait timer resets when progress changes', () => {
    vi.useFakeTimers();
    const { rerender } = render(<RepairProgress {...defaultProps} progress={50} />);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // Progress update resets the timer
    rerender(<RepairProgress {...defaultProps} progress={60} />);

    act(() => {
      vi.advanceTimersByTime(50_000);
    });

    // Total elapsed since last progress change is 50s, not 80s — should NOT show yet
    expect(screen.queryByText(/Still working/)).not.toBeInTheDocument();
  });
});
