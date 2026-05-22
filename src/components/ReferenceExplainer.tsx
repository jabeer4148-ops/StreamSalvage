export function ReferenceExplainer() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-2 mb-3">
        <span className="text-blue-600 mt-0.5" aria-hidden="true">
          i
        </span>
        <p className="text-sm font-medium text-blue-800">
          What is a reference file and why do you need one?
        </p>
      </div>

      <p className="text-xs text-blue-700 leading-relaxed mb-3">
        Your corrupted recording is missing its "playback instructions" - a small block written
        at the end of the file when recording stops. If OBS crashes, this block never gets
        written. A <strong>reference file</strong> is any healthy MP4 you recorded with the same
        OBS settings - it lends its instructions to repair yours.
      </p>

      <p className="text-xs font-medium text-blue-800 mb-2">
        How to create one right now (takes 10 seconds):
      </p>

      <ol className="space-y-1.5">
        {[
          'Open OBS, then click Start Recording',
          'Record for 5-10 seconds, then click Stop Recording',
          'Find the new file in your OBS recordings folder',
          'Drag it into the box below',
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] font-semibold mt-0.5">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
