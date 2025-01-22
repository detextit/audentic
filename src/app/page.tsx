import React from "react";
import App from "./App";
import { createTables } from "../../mabel/services/db";

// Initialize tables when the app starts
createTables().catch(console.error);

export default function Page() {
  return <App />;
}
