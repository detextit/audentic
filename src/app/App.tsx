"use client";

import Events from "./components/Events";
import SessionControls from "./components/SessionControls";
import Transcript from "./components/Transcript";

function App() {

  return (
    <div>
      <div className="flex items-center p-5 text-lg font-semibold justify-between">
          VoiceAct <span className="text-gray-500">Agents</span>
      </div>
      <div className="flex flex-1 gap-2 px-2 overflow-hidden relative">
        <Transcript/>
          <Events isExpanded={true} />
        </div>
        <SessionControls/>
    </div>
  );
}

export default App;
