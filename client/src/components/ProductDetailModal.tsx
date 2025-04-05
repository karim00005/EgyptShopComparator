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
          <DialogTitle className="text-xl font-semibold text-gray-800">Product Comparison</DialogTitle>
          <DialogClose className="absolute right-4 top-4 text-gray-500 hover:text-gray-700" />
        </DialogHeader>
        
        <div className="p-2">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 mb-4 md:mb-0 md:pr-6">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-64 object-contain mb-4"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Not+Available';
                }}
              />
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}
              
              {product.specs && product.specs.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Specifications</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.specs.map((spec, index) => (
                      <li key={index}>• {spec.key}: {spec.value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="md:w-2/3">
              <h4 className="font-medium text-gray-700 mb-3">
                Available on {sortedProducts.length} platform{sortedProducts.length !== 1 ? 's' : ''}
              </h4>
              
              <div className="space-y-4">
                {sortedProducts.map((p, index) => {
                  const platformInfo = getPlatformInfo(p.platform);
                  return (
                    <div key={`${p.platform}-${p.id}`} className={`border border-gray-200 rounded-lg p-4 ${p.isBestPrice ? 'bg-gray-50' : ''}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <img 
                            src={platformInfo.logo} 
                            alt={platformInfo.name} 
                            className="h-6 mr-2"
                          />
                          <span className="font-medium">{platformInfo.name}</span>
                        </div>
                        <div className="flex items-center">
                          {p.isBestPrice && (
                            <span className="bg-green-500 text-white px-2 py-0.5 rounded-md text-xs font-medium mr-2">Best Price</span>
                          )}
                          <span className="text-lg font-semibold">{formatPrice(p.price)}</span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="ml-2 text-sm line-through text-gray-500">{formatPrice(p.originalPrice)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        {p.rating && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="material-icons text-yellow-400" style={{ fontSize: '14px' }}>star</span>
                            <span className="ml-1">{p.rating.toFixed(1)}</span>
                            {p.reviewCount && (
                              <span className="ml-1">({p.reviewCount} reviews)</span>
                            )}
                          </div>
                        )}
                        {p.isFreeDelivery && (
                          <div className="text-sm text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-md">
                            Free Delivery
                          </div>
                        )}
                        <a 
                          href={p.url} 
                          className="bg-primary-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-600 transition duration-300"
                          target="_blank" 
                          rel="noopener"
                        >
                          View on {platformInfo.name}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                <button 
                  className="text-primary-600 border border-primary-500 px-4 py-2 rounded text-sm font-medium hover:bg-primary-50 transition duration-300"
                  onClick={setupPriceAlert}
                >
                  <span className="material-icons text-sm mr-1">notifications</span>
                  Set Price Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
