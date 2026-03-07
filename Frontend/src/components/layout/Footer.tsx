export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16">
      <div className="max-w-6xl mx-auto px-6 text-center">

        <h3 className="text-white text-2xl font-bold mb-6">
          🐾 PetEcho
        </h3>

        <p className="text-gray-400 mb-6">
          A joyful community for pet lovers.
        </p>

        <div className="flex justify-center gap-6 text-sm">
          <a>About</a>
          <a>Help</a>
          <a>Contact</a>
          <a>Privacy</a>
        </div>

        <p className="text-gray-500 text-sm mt-10">
          © 2026 PetEcho
        </p>
      </div>
    </footer>
  );
}