import { useEffect } from "react";
import { Product } from "@/utils/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  similarProducts?: Product[];
}

export function ProductDetailModal({ isOpen, onClose, product, similarProducts = [] }: ProductDetailModalProps) {
  const { toast } = useToast();
  
  // When modal closes, clean up any state
  useEffect(() => {
    if (!isOpen) {
      // Reset any state if needed
    }
  }, [isOpen]);
  
  const setupPriceAlert = () => {
    toast({
      title: "Price Alert",
      description: "This feature will be available soon!",
    });
  };
  
  // Format price with currency
  const formatPrice = (price?: number) => {
    if (!price) return '';
    return `${price.toFixed(2)} EGP`;
  };
  
  // Get platform details
  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case 'amazon':
        return {
          name: 'Amazon Egypt',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png'
        };
      case 'noon':
        return {
          name: 'Noon',
          logo: 'https://e7.pngegg.com/pngimages/178/595/png-clipart-noon-hd-logo-thumbnail.png'
        };
      case 'carrefour':
        return {
          name: 'Carrefour Egypt',
          logo: 'https://play-lh.googleusercontent.com/Zz_8v5v8tKY4ZyNHwh0gU_P5JrQ018GYmpyui0r3-rC4S8qtd4LtWN0K9Z6KMUb4KA'
        };
      case 'talabat':
        return {
          name: 'Talabat Egypt',
          logo: 'https://play-lh.googleusercontent.com/KhGz6kt8AOi0vQSbH3cCH9jHQVw7oebQ9S9MUuKiLANhkdW6wfiHcl3uGVT4uoJR37wu'
        };
      default:
        return {
          name: platform,
          logo: 'https://via.placeholder.com/100x100?text=Logo'
        };
    }
  };
  
  // Sort products by price
  const sortedProducts = [...similarProducts];
  if (product) {
    sortedProducts.push(product);
  }
  sortedProducts.sort((a, b) => a.price - b.price);
  
  // Mark best price
  if (sortedProducts.length > 0) {
    sortedProducts[0].isBestPrice = true;
  }
  
  if (!product) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Product Details & Comparison</DialogTitle>
          <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-gray-700" />
        </DialogHeader>
        
        <div className="p-2">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/5 mb-4 md:mb-0">
              <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-64 object-contain mb-3"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
                  }}
                />
                <h2 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{product.title}</h2>
                
                {product.brand && (
                  <div className="mb-2 text-sm text-gray-600">
                    <span className="font-medium">Brand:</span> {product.brand}
                  </div>
                )}
                
                <div className="flex items-center mb-3">
                  <span className="text-xl font-bold text-gray-900 mr-2">{formatPrice(product.price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-sm line-through text-gray-500 mr-2">{formatPrice(product.originalPrice)}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                        Save {((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
                
                <a 
                  href={product.url} 
                  className="block w-full bg-primary-600 text-white py-2 px-4 rounded-md text-center font-medium hover:bg-primary-700 transition-colors mb-3"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Deal
                </a>
                
                <button 
                  className="w-full flex items-center justify-center border border-primary-500 text-primary-600 py-2 px-4 rounded-md font-medium hover:bg-primary-50 transition-colors"
                  onClick={setupPriceAlert}
                >
                  <span className="material-icons text-sm mr-1">notifications</span>
                  Set Price Alert
                </button>
              </div>
              
              {product.description && (
                <div className="border rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{product.description}</p>
                </div>
              )}
              
              {product.specs && product.specs.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Specifications</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {product.specs.map((spec, index) => (
                      <div key={index} className="flex text-sm">
                        <span className="font-medium text-gray-700 w-1/3">{spec.key}:</span>
                        <span className="text-gray-600 w-2/3">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:w-3/5">
              <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-primary-700 mb-1">
                  Price Comparison
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Available on {sortedProducts.length} platform{sortedProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-3">
                {sortedProducts.map((p, index) => {
                  const platformInfo = getPlatformInfo(p.platform);
                  return (
                    <div 
                      key={`${p.platform}-${p.id}`} 
                      className={`border rounded-lg p-4 ${p.isBestPrice ? 'border-green-300 bg-green-50' : 'border-gray-200'} transition-all hover:shadow-md`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <img 
                            src={platformInfo.logo} 
                            alt={platformInfo.name} 
                            className="h-8 w-8 object-contain mr-3"
                          />
                          <div>
                            <span className="font-medium text-gray-800 block">{platformInfo.name}</span>
                            {p.rating && (
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="material-icons text-yellow-400" style={{ fontSize: '14px' }}>star</span>
                                <span className="ml-1">{p.rating.toFixed(1)}</span>
                                {p.reviewCount && (
                                  <span className="ml-1 text-xs">({p.reviewCount})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline">
                            <span className="text-lg font-bold text-gray-900">{formatPrice(p.price)}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="ml-2 text-sm line-through text-gray-500">{formatPrice(p.originalPrice)}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-end mt-1">
                            {p.isBestPrice && (
                              <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-medium mr-2">Best Price</span>
                            )}
                            {p.isFreeDelivery && (
                              <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded border border-green-200">
                                Free Shipping
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <a 
                          href={p.url} 
                          className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700 transition-colors"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Go to Store
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {similarProducts.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Similar Products</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {similarProducts.slice(0, 3).map((p) => (
                      <div key={`similar-${p.id}`} className="flex border rounded-lg p-2 hover:shadow-sm transition-shadow">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          className="w-16 h-16 object-contain mr-3"
                        />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-800 line-clamp-2">{p.title}</h5>
                          <div className="flex items-baseline mt-1">
                            <span className="text-sm font-bold text-gray-900">{formatPrice(p.price)}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="ml-2 text-xs line-through text-gray-500">{formatPrice(p.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                        <a 
                          href={p.url} 
                          className="self-center bg-primary-100 text-primary-600 px-3 py-1 rounded text-xs font-medium hover:bg-primary-200 transition-colors ml-2"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
