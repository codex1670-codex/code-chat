import { SearchIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function SearchInput() {
  const { searchTerm, setSearchTerm } = useChatStore();

  return (
    <div className="px-4 pb-2">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
}

export default SearchInput;