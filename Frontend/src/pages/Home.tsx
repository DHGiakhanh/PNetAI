import { Button } from '../components/common/Button';

export const Home = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome Home</h1>
          <p className="text-gray-400 mb-8">This is the home page</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => alert('Clicked!')}>
              Click Me
            </Button>
            <Button variant="secondary">
              Secondary
            </Button>
            <Button variant="danger" size="small">
              Danger
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
