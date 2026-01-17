const API_URL = 'http://localhost:3000';

let currentView = 'products';
let allProducts = [];
let allReviews = [];

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupProductForm();
    setupFilters();
    loadProducts();
    loadReviews();
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
    }
}

async function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<div class="loading">Loading products...</div>';
    
    try {
        const response = await fetch(`${API_URL}/products`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        allProducts = data.products || [];
        
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Error loading products</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayProducts(products) {
    const grid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No products found</h3>
                <p>Start by adding your first product!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card" onclick="showProductDetails('${product._id}')">
            ${product.featured ? '<div class="featured-badge">Featured</div>' : ''}
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock">${product.stock} in stock</div>
                </div>
            </div>
        </div>
    `).join('');
}

async function showProductDetails(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        
        if (!response.ok) {
            throw new Error('Product not found');
        }
        
        const product = await response.json();
        
        const reviewsResponse = await fetch(`${API_URL}/reviews/product/${productId}`);
        const reviewsData = await reviewsResponse.json();
        const productReviews = reviewsData.reviews || [];
        
        const modal = document.getElementById('product-modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <img src="${product.imageUrl}" 
                     alt="${product.name}" 
                     style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 16px; margin-bottom: 1.5rem;"
                     onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                
                <div style="margin-bottom: 1rem;">
                    <span class="product-category">${product.category}</span>
                    ${product.featured ? '<span class="featured-badge" style="position: static; margin-left: 0.5rem;">Featured</span>' : ''}
                </div>
                
                <h2 style="font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 1rem; color: var(--deep-blue);">
                    ${product.name}
                </h2>
                
                <p style="color: var(--text-medium); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">
                    ${product.description}
                </p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--light-blue); border-radius: 12px; margin-bottom: 1.5rem;">
                    <div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-blue);">
                            $${product.price.toFixed(2)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: var(--text-medium);">Stock</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${product.stock > 0 ? 'var(--primary-blue)' : '#E74C3C'};">
                            ${product.stock}
                        </div>
                    </div>
                </div>
                
                <div style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 1.5rem;">
                    <div>Created: ${new Date(product.createdAt).toLocaleDateString()}</div>
                    <div>Last updated: ${new Date(product.updatedAt).toLocaleDateString()}</div>
                </div>
                
                ${productReviews.length > 0 ? `
                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border-color);">
                        <h3 style="margin-bottom: 1rem; color: var(--deep-blue);">Reviews (${productReviews.length})</h3>
                        ${productReviews.map(review => `
                            <div style="background: var(--light-blue); padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${review.username}</strong>
                                    <div class="review-rating">
                                        ${[1,2,3,4,5].map(i => `<span class="star ${i <= review.rating ? '' : 'empty'}">★</span>`).join('')}
                                    </div>
                                </div>
                                <p style="color: var(--text-medium);">${review.comment}</p>
                                <div class="review-date">${new Date(review.createdAt).toLocaleDateString()}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="editProduct('${product._id}')">Edit Product</button>
                <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete Product</button>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading product details:', error);
        alert('Failed to load product details');
    }
}

document.querySelector('.modal-close')?.addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('active');
});

document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') {
        e.target.classList.remove('active');
    }
});

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete product');
        }
        
        document.getElementById('product-modal').classList.remove('active');
        await loadProducts();
        alert('Product deleted successfully!');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
    }
}

function editProduct(productId) {
    alert('Edit functionality: To edit this product, you would need to populate the form with existing data. For now, please create a new product or delete this one.');
    document.getElementById('product-modal').classList.remove('active');
}

function setupProductForm() {
    const form = document.getElementById('product-form');
    const messageDiv = document.getElementById('form-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            category: document.getElementById('product-category').value,
            imageUrl: document.getElementById('product-image').value.trim() || undefined,
            featured: document.getElementById('product-featured').checked
        };
        
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.details || result.error || 'Failed to create product');
            }
            
            messageDiv.className = 'form-message success';
            messageDiv.textContent = 'Product created successfully!';
            
            form.reset();
            
            await loadProducts();
            
            setTimeout(() => {
                messageDiv.className = 'form-message';
                messageDiv.textContent = '';
            }, 3000);
            
        } catch (error) {
            console.error('Error creating product:', error);
            messageDiv.className = 'form-message error';
            messageDiv.textContent = 'Error: ' + error.message;
        }
    });
}

function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');
    
    categoryFilter.addEventListener('change', filterProducts);
    searchInput.addEventListener('input', filterProducts);
}

function filterProducts() {
    const category = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    let filtered = allProducts;
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayProducts(filtered);
}

async function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '<div class="loading">Loading reviews...</div>';
    
    try {
        const response = await fetch(`${API_URL}/reviews`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const data = await response.json();
        allReviews = data.reviews || [];
        
        displayReviews(allReviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = `
            <div class="empty-state">
                <h3>Error loading reviews</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <h3>No reviews yet</h3>
                <p>Reviews will appear here once customers start rating products.</p>
            </div>
        `;
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user">${review.username}</div>
                <div class="review-rating">
                    ${[1, 2, 3, 4, 5].map(i => 
                        `<span class="star ${i <= review.rating ? '' : 'empty'}">★</span>`
                    ).join('')}
                </div>
            </div>
            <div class="review-product">
                ${review.productId?.name || 'Product'}
            </div>
            <div class="review-comment">${review.comment}</div>
            <div class="review-date">
                ${new Date(review.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            </div>
        </div>
    `).join('');
}

setInterval(() => {
    if (currentView === 'products') {
        loadProducts();
    } else if (currentView === 'reviews') {
        loadReviews();
    }
}, 30000);
