// Product skeleton loader handler
class ProductSkeletonLoader {
    constructor() {
        this.init();
    }

    init() {
        // Handle initial page load
        this.handleImagesOnLoad();
        
        // Handle dynamic content changes (pagination, filtering)
        this.observeContentChanges();
    }

    handleImagesOnLoad() {
        const productItems = document.querySelectorAll('product-item');
        productItems.forEach(item => this.initializeProductItem(item));
    }

    initializeProductItem(productItem) {
        const image = productItem.querySelector('img');
        const skeleton = productItem.querySelector('.product-collection-skeleton');
        
        if (image && skeleton) {
            if (image.complete) {
                this.hideSkeletonLoader(skeleton, productItem);
            } else {
                image.addEventListener('load', () => this.hideSkeletonLoader(skeleton, productItem));
                image.addEventListener('error', () => this.hideSkeletonLoader(skeleton, productItem));
            }
        }
    }

    hideSkeletonLoader(skeleton, productItem) {
        skeleton.style.opacity = '0';
        setTimeout(() => {
            skeleton.style.display = 'none';
            productItem.classList.add('product-loaded');
        }, 300);
    }

    observeContentChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check for newly added product items
                            if (node.tagName.toLowerCase() === 'product-item') {
                                this.initializeProductItem(node);
                            }
                            // Check for product items within added containers
                            const productItems = node.querySelectorAll('product-item');
                            productItems.forEach(item => this.initializeProductItem(item));
                        }
                    });
                }
            });
        });

        // Observe the collection grid for changes
        const collectionGrid = document.getElementById('CollectionProductGrid');
        if (collectionGrid) {
            observer.observe(collectionGrid, {
                childList: true,
                subtree: true
            });
        }
    }
}

// Initialize the skeleton loader handler
document.addEventListener('DOMContentLoaded', () => {
    window.productSkeletonLoader = new ProductSkeletonLoader();
});
