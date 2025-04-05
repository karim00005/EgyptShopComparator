import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">PriceWise Egypt</h3>
            <p className="text-gray-400">Find the best prices across all major Egyptian e-commerce platforms in one place.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Supported Platforms</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Amazon Egypt</li>
              <li>Noon</li>
              <li>Carrefour Egypt</li>
              <li>Talabat</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} PriceWise Egypt. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
