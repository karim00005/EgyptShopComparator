import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="mt-20">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-3">Stay updated with the best deals</h3>
            <p className="text-primary-100 mb-6">Subscribe to our newsletter and never miss out on price drops and exclusive offers.</p>
            
            <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300 w-full sm:w-auto sm:min-w-[300px]"
              />
              <button className="bg-white text-primary-700 font-medium px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors">
                Subscribe
              </button>
            </div>
            
            <p className="text-xs text-primary-200 mt-3">We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </div>
      </div>
      
      {/* Main Footer */}
      <div className="bg-gray-50 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <span className="material-icons text-primary-600" style={{ fontSize: '20px' }}>
                    price_check
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
                  PriceWise
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">
                Find the best prices across all major Egyptian e-commerce platforms in one place. Compare, track, and save with our smart shopping tools.
              </p>
              
              <div className="flex space-x-4">
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-primary-100 transition-colors group">
                  <span className="material-icons text-gray-500 group-hover:text-primary-600" style={{ fontSize: '18px' }}>facebook</span>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-primary-100 transition-colors group">
                  <span className="material-icons text-gray-500 group-hover:text-primary-600" style={{ fontSize: '18px' }}>flutter_dash</span>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-primary-100 transition-colors group">
                  <span className="material-icons text-gray-500 group-hover:text-primary-600" style={{ fontSize: '18px' }}>photo_camera</span>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-5 text-gray-800 flex items-center">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                Supported Platforms
              </h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Amazon Egypt</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Noon</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Carrefour Egypt</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Talabat</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Jumia</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-5 text-gray-800 flex items-center">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Popular Products</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Latest Deals</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Price Alerts</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Price History</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Compare Products</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-5 text-gray-800 flex items-center">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                Resources
              </h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">About Us</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
                </li>
                <li className="flex items-center group">
                  <span className="material-icons text-primary-400 mr-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  <a href="#" className="hover:text-primary-600 transition-colors">FAQ</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center pt-10 mt-10 border-t border-gray-200 text-gray-500 text-sm">
            <div className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} PriceWise Egypt. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">Cookies</a>
              <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
