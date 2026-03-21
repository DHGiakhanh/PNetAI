import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;