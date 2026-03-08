export default function TickMark({ deliveredTo = [], seenBy = [], totalMembers = 0 }) {
  const allSeen = seenBy.length > 0;
  const allDelivered = deliveredTo.length >= totalMembers;
  if (allSeen) return (
    <span className="inline-flex ml-1">
      <svg viewBox="0 0 16 11" className="w-4 h-3 fill-[#53bdeb]">
        <path d="M11.071.653a.75.75 0 0 0-1.06 0L4.975 5.69 2.99 3.704A.75.75 0 0 0 1.93 4.764l2.571 2.572a.75.75 0 0 0 1.06 0l5.51-5.51a.75.75 0 0 0 0-1.173zM15.07.653a.75.75 0 0 0-1.06 0L8.975 5.69l-.586-.586A.75.75 0 1 0 7.33 6.164l1.116 1.117a.75.75 0 0 0 1.06 0l5.565-5.565a.75.75 0 0 0 0-1.063z"/>
      </svg>
    </span>
  );
  if (allDelivered) return (
    <span className="inline-flex ml-1">
      <svg viewBox="0 0 16 11" className="w-4 h-3 fill-[#8696a0]">
        <path d="M11.071.653a.75.75 0 0 0-1.06 0L4.975 5.69 2.99 3.704A.75.75 0 0 0 1.93 4.764l2.571 2.572a.75.75 0 0 0 1.06 0l5.51-5.51a.75.75 0 0 0 0-1.173zM15.07.653a.75.75 0 0 0-1.06 0L8.975 5.69l-.586-.586A.75.75 0 1 0 7.33 6.164l1.116 1.117a.75.75 0 0 0 1.06 0l5.565-5.565a.75.75 0 0 0 0-1.063z"/>
      </svg>
    </span>
  );
  return (
    <span className="inline-flex ml-1">
      <svg viewBox="0 0 12 11" className="w-3 h-3 fill-[#8696a0]">
        <path d="M10.28 1.72a.75.75 0 0 0-1.06 0L4.5 6.44 2.78 4.72a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l5.25-5.25a.75.75 0 0 0 0-1.06z"/>
      </svg>
    </span>
  );
}
