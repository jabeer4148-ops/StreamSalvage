import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepTabs } from '../components/StepTabs';

describe('StepTabs', () => {
  test('shows all 5 step labels', () => {
    render(<StepTabs currentStep="broken" />);
    expect(screen.getByText(/Broken file/)).toBeInTheDocument();
    expect(screen.getByText(/Reference file/)).toBeInTheDocument();
    expect(screen.getByText(/Repairing/)).toBeInTheDocument();
    expect(screen.getByText(/Preview/)).toBeInTheDocument();
    expect(screen.getByText(/Export/)).toBeInTheDocument();
  });

  test('active step uses neutral text colour, not muted or green', () => {
    render(<StepTabs currentStep="reference" />);
    // Find all step divs; the one containing "Reference file" must be active
    const allDivs = document.querySelectorAll('.flex-1');
    const referenceDiv = Array.from(allDivs).find((el) =>
      el.textContent?.includes('Reference file'),
    ) as HTMLElement;
    expect(referenceDiv).toBeDefined();
    expect(referenceDiv.className).toContain('text-neutral-700');
    // Active step must NOT have the done (green) colour
    expect(referenceDiv.className).not.toContain('text-[#1D9E75]');
  });

  test('completed steps show "Done" prefix', () => {
    render(<StepTabs currentStep="repairing" />);
    // Steps 0 ("Broken file") and 1 ("Reference file") are done
    expect(screen.getByText(/Done Broken file/)).toBeInTheDocument();
    expect(screen.getByText(/Done Reference file/)).toBeInTheDocument();
  });

  test('active step does NOT show "Done" prefix', () => {
    render(<StepTabs currentStep="repairing" />);
    // "Repairing" is the active step
    const allDivs = document.querySelectorAll('.flex-1');
    const repairingDiv = Array.from(allDivs).find((el) =>
      el.textContent?.trim() === 'Repairing',
    );
    expect(repairingDiv).toBeDefined();
    expect(repairingDiv!.textContent).not.toContain('Done');
  });

  test('future steps use muted styling', () => {
    render(<StepTabs currentStep="broken" />);
    const allDivs = document.querySelectorAll('.flex-1');
    const referenceDiv = Array.from(allDivs).find((el) =>
      el.textContent?.includes('Reference file'),
    ) as HTMLElement;
    expect(referenceDiv.className).toContain('text-neutral-500');
    expect(referenceDiv.className).toContain('bg-neutral-50');
  });

  test('done steps use green text colour', () => {
    render(<StepTabs currentStep="repairing" />);
    const allDivs = document.querySelectorAll('.flex-1');
    const brokenDiv = Array.from(allDivs).find((el) =>
      el.textContent?.includes('Broken file'),
    ) as HTMLElement;
    expect(brokenDiv.className).toContain('text-[#1D9E75]');
  });

  test('renders all steps correctly for export state (all prior steps done)', () => {
    render(<StepTabs currentStep="export" />);
    expect(screen.getByText(/Done Broken file/)).toBeInTheDocument();
    expect(screen.getByText(/Done Reference file/)).toBeInTheDocument();
    expect(screen.getByText(/Done Repairing/)).toBeInTheDocument();
    expect(screen.getByText(/Done Preview/)).toBeInTheDocument();
    // Export is active, not done
    expect(screen.getByText(/Export/)).toBeInTheDocument();
    expect(screen.queryByText(/Done Export/)).not.toBeInTheDocument();
  });

  test('renders correctly for broken step (no done steps)', () => {
    render(<StepTabs currentStep="broken" />);
    expect(screen.queryByText(/Done/)).not.toBeInTheDocument();
  });
});
