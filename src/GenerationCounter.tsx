import { ClipboardList } from 'lucide-react';

interface GenerationCounterProps {
  ideaSetsRemaining: number;
  playbooksRemaining: number;
}

export default function GenerationCounter({ ideaSetsRemaining, playbooksRemaining }: GenerationCounterProps) {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-6 py-3 mb-6">
      <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-600" />
          <span className="text-gray-700">
            <strong className="text-indigo-600">Idea sets remaining:</strong> {ideaSetsRemaining} of 2
          </span>
        </div>
        <div className="text-gray-300">|</div>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-600" />
          <span className="text-gray-700">
            <strong className="text-indigo-600">Playbooks remaining:</strong> {playbooksRemaining} of 2
          </span>
        </div>
      </div>
    </div>
  );
}
