"use client";

import SessionControls from "./mabel/components/SessionControls";

function App() {

  return (
      <div>
        <div className="flex items-center p-5 text-lg font-semibold justify-between">
            VoiceAct <span className="text-gray-500">Agents</span>
        </div>
       <SessionControls/>
      </div>
  );
}

export default App;
