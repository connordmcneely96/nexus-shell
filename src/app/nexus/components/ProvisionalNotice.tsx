// Undismissable chrome: no close control, no state. Rendered while tier is concept.
export default function ProvisionalNotice() {
  return (
    <div role="note" className="w-full border-b border-warn bg-surface-raised px-4 py-2 text-sm text-warn">
      Concept tier — provisional. Not verified or sealed; do not rely on it for decisions.
    </div>
  );
}
