import Link from 'next/link';
import BookinnChatbot from "@/components/BookinnChatbot";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">BookInn</h1>
          <div className="space-x-4">
            <Link href="/rooms" className="hover:underline">Rooms</Link>
            <Link href="/bookings" className="hover:underline">Bookings</Link>
            <Link href="/login" className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100">
              Login
            </Link>
          </div>
        </nav>
        
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-5xl font-bold mb-4">Welcome to BookInn</h2>
          <p className="text-xl mb-8">Luxury stays at affordable prices</p>
          <Link 
            href="/rooms" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-block"
          >
            Browse Rooms
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose BookInn?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🏨</div>
            <h4 className="text-xl font-semibold mb-2">Luxury Rooms</h4>
            <p className="text-gray-600">Spacious and well-appointed rooms for your comfort</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💰</div>
            <h4 className="text-xl font-semibold mb-2">Best Prices</h4>
            <p className="text-gray-600">Competitive rates and special offers</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🛎️</div>
            <h4 className="text-xl font-semibold mb-2">24/7 Support</h4>
            <p className="text-gray-600">Round-the-clock customer service</p>
          </div>
        </div>
      </section>

      {/* Chatbot Section */}
      <section className="fixed bottom-4 right-4">
        <BookinnChatbot />
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2026 BookInn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}