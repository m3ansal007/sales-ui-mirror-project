
import { Calendar, ChevronDown, Mic, Send, Sparkles } from "lucide-react";

export const BottomBar = () => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-2 text-white transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Meeting</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          <button className="bg-green-600 hover:bg-green-700 rounded-full p-3 text-white transition-colors">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 max-w-2xl mx-4">
          <div className="bg-slate-800 border border-slate-700 rounded-full px-6 py-3 flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask me anything about your sales..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
            />
            <button className="text-slate-400 hover:text-white transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button className="bg-green-600 hover:bg-green-700 rounded-full p-3 text-white transition-colors">
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
