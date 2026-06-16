import { useEffect, useRef, useState } from 'react';

interface Props {
  licenseValid: boolean;
  onCheckLicense: (key: string) => Promise<boolean>;
  onChangeLicense: () => Promise<void> | void;
  onExport: () => Promise<void>;
  onReset: () => void;
}

type ExportStep = 'license' | 'ready' | 'saving' | 'done' | 'error';

export function ExportPanel({
  licenseValid,
  onCheckLicense,
  onChangeLicense,
  onExport,
  onReset,
}: Props) {
  const [key, setKey] = useState('');
  const [checking, setChecking] = useState(false);
  const [exportStep, setExportStep] = useState<ExportStep>(
    licenseValid ? 'ready' : 'license',
  );
  const [error, setError] = useState<string | null>(null);
  const wasLicenseValidRef = useRef(licenseValid);

  useEffect(() => {
    const wasLicenseValid = wasLicenseValidRef.current;
    wasLicenseValidRef.current = licenseValid;

    if (!wasLicenseValid && licenseValid) {
      setExportStep('ready');
      setError(null);
    }
  }, [licenseValid]);

  const handleCheckLicense = async () => {
    if (!key.trim()) return;
    setChecking(true);
    setError(null);

    try {
      const valid = await onCheckLicense(key.trim());
      if (valid) {
        setExportStep('ready');
      } else {
        setError(
          'License key not recognized. Check your StreamSalvage purchase email. ' +
            'Keys look like: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        );
      }
    } catch {
      setError(
        'Could not verify license - check your internet connection and try again.',
      );
    } finally {
      setChecking(false);
    }
  };

  const handleExport = async () => {
    setExportStep('saving');
    setError(null);
    try {
      await onExport();
      setExportStep('done');
    } catch {
      setError(
        'Export failed - the save dialog may have been cancelled, ' +
          'or the destination folder may not be writable. Try again.',
      );
      setExportStep('ready');
    }
  };

  const handleChangeLicense = async () => {
    setKey('');
    setError(null);
    setExportStep('license');
    await onChangeLicense();
  };

  if (exportStep === 'done') {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3" role="img" aria-label="Success">
          🎉
        </div>
        <p className="text-base font-medium text-neutral-800 mb-1">
          File saved successfully
        </p>
        <p className="text-sm text-neutral-500 mb-6">
          Your recovered recording is ready to use.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-[#1D9E75] underline underline-offset-2 hover:opacity-75 transition-opacity"
        >
          Repair another file
        </button>
      </div>
    );
  }

  if (exportStep === 'license') {
    return (
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-sm font-medium text-amber-800 mb-1">
            Unlock your repaired video
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Enter the license key from your purchase email. Don't have one?{' '}
            <a
              href="https://streamsalvage.com/#download"
              className="underline text-amber-800 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy for $29 -&gt;
            </a>
          </p>
        </div>

        <label
          htmlFor="license-key-input"
          className="block text-xs font-medium text-neutral-600 mb-1"
        >
          License key
        </label>
        <input
          id="license-key-input"
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleCheckLicense()}
          placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono text-neutral-800 mb-1 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent tracking-wider"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
        />

        {error && (
          <p className="text-xs text-red-600 mb-3 leading-relaxed">
            {error}
          </p>
        )}

        {!error && (
          <p className="text-xs text-neutral-400 mb-3">
            Key is verified locally - never stored on our servers
          </p>
        )}

        <button
          type="button"
          onClick={handleCheckLicense}
          disabled={checking || !key.trim()}
          className={[
            'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
            checking || !key.trim()
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-[#1D9E75] text-white hover:opacity-90',
          ].join(' ')}
        >
          {checking ? 'Verifying...' : 'Verify license key'}
        </button>

        {import.meta.env.DEV && (
          <p className="text-xs text-neutral-300 text-center mt-2">
            Dev mode: use TEST-XXXX to bypass validation
          </p>
        )}
      </div>
    );
  }

  if (exportStep === 'ready' || exportStep === 'saving') {
    return (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
          <span className="text-green-600 text-base" aria-hidden="true">
            ✓
          </span>
          <p className="text-sm text-green-800 font-medium">
            License verified - ready to export
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Click below to choose where to save your repaired video. The file
            will be saved as an MP4 you can open in any media player or video
            editor.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={exportStep === 'saving'}
          className={[
            'w-full py-2.5 rounded-lg text-sm font-medium transition-colors mb-2',
            exportStep === 'saving'
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-[#1D9E75] text-white hover:opacity-90',
          ].join(' ')}
        >
          {exportStep === 'saving' ? 'Saving...' : 'Save repaired video to disk'}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          Save to any folder - keeps original untouched
        </p>

        <button
          type="button"
          onClick={handleChangeLicense}
          className="block mx-auto mt-3 text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-600 transition-colors"
        >
          Change license key
        </button>
      </div>
    );
  }

  return null;
}
