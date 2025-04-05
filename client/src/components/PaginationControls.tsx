import { useSearch } from "@/context/SearchContext";

interface PaginationControlsProps {
  totalItems: number;
  itemsPerPage?: number;
}

export function PaginationControls({ totalItems, itemsPerPage = 20 }: PaginationControlsProps) {
  const { searchParams, updateSearchParams } = useSearch();
  const currentPage = searchParams.page || 1;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    updateSearchParams({
      ...searchParams,
      page
    });
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    // Always show first page
    pages.push(1);
    
    // Calculate range to show around current page
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust range if at the beginning or end
    if (currentPage <= 2) {
      rangeEnd = Math.min(totalPages - 1, maxPagesToShow - 1);
    } else if (currentPage >= totalPages - 1) {
      rangeStart = Math.max(2, totalPages - maxPagesToShow + 2);
    }
    
    // Add ellipsis before range if needed
    if (rangeStart > 2) {
      pages.push('ellipsis-start');
    }
    
    // Add range pages
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    // Add ellipsis after range if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis-end');
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="my-8 flex flex-col items-center">
      <div className="text-sm text-gray-600 mb-3">
        Showing page {currentPage} of {totalPages} ({totalItems} products)
      </div>
      <div className="inline-flex rounded-md shadow">
        <button 
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>chevron_left</span>
        </button>
        
        {pageNumbers.map((page, i) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <button 
                key={`ellipsis-${i}`}
                className="px-4 py-2 text-sm font-medium text-gray-400 bg-white border-t border-b border-gray-300"
                disabled
              >
                •••
              </button>
            );
          }
          
          return (
            <button 
              key={page}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                currentPage === page 
                  ? 'text-white bg-primary-600 border-t border-b border-primary-600 hover:bg-primary-700' 
                  : 'text-gray-700 bg-white border-t border-b border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handlePageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
        
        <button 
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
}
