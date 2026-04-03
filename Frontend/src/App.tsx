import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <div className="min-h-screen bg-gray-900">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;