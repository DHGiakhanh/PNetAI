import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import FloatingChatAgent from "./components/common/FloatingChatAgent";
import { SocketProvider } from "./context/SocketContext";
import { ChatWindowProvider } from "./context/ChatWindowContext";
import { FloatingChatWindowsContainer } from "./components/social/FloatingChatWindowsContainer";

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <SocketProvider>
        <ChatWindowProvider>
          <div className="min-h-screen bg-gray-900">
            <AppRoutes />
            <FloatingChatAgent />
            <FloatingChatWindowsContainer />
          </div>
        </ChatWindowProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;