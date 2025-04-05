import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="border-t mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary-600">PriceWise Egypt</h3>
            <p className="text-gray-600 text-sm">Find the best prices across all major Egyptian e-commerce platforms in one place.</p>
            <div className="mt-4 flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <span className="material-icons">facebook</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <span className="material-icons">twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <span className="material-icons">instagram</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-800">Supported Platforms</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <span>Amazon Egypt</span>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <span>Noon</span>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <span>Carrefour Egypt</span>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <span>Talabat</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-800">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Popular Products</a>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Latest Deals</a>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Price Alerts</a>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Price Trends</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-800">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">About Us</a>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
              </li>
              <li className="flex items-center">
                <span className="material-icons text-gray-400 mr-2 text-xs">chevron_right</span>
                <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="py-6 border-t border-gray-200 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} PriceWise Egypt. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
