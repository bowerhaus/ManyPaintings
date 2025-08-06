/**
 * Favorites Gallery Manager - Handles the favorites gallery modal UI
 * Extracted from main.js for better modularity
 */
export const FavoritesGallery = {
  modal: null,
  grid: null,
  loading: null,
  empty: null,

  init() {
    this.modal = document.getElementById('favorites-modal');
    this.grid = document.getElementById('favorites-grid');
    this.loading = document.getElementById('favorites-loading');
    this.empty = document.getElementById('favorites-empty');

    const closeBtn = document.getElementById('favorites-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Close modal when clicking outside content
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });
    }

    // Close modal with ESC key
    this.escKeyHandler = (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.style.display !== 'none') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escKeyHandler);

    console.log('FavoritesGallery: Initialized', {
      modal: !!this.modal,
      grid: !!this.grid,
      loading: !!this.loading,
      empty: !!this.empty
    });
  },

  async show() {
    if (!this.modal) return;

    this.modal.classList.remove('hidden');
    this.showLoading();

    try {
      // Ensure ImageManager is loaded before showing favorites
      if (!window.App.ImageManager.images || window.App.ImageManager.images.size === 0) {
        console.log('FavoritesGallery: Refreshing ImageManager before showing favorites');
        await window.App.ImageManager.init();
      }
      
      // Access FavoritesManager through global App object
      const FavoritesManager = window.App?.FavoritesManager;
      if (!FavoritesManager) {
        throw new Error('FavoritesManager not available');
      }

      const favorites = await FavoritesManager.listFavorites();
      this.renderFavorites(favorites);
    } catch (error) {
      console.error('FavoritesGallery: Failed to load favorites:', error);
      this.showEmpty();
    }
  },

  hide() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  },

  showLoading() {
    if (this.loading) this.loading.classList.remove('hidden');
    if (this.empty) this.empty.classList.add('hidden');
    if (this.grid) this.grid.classList.add('hidden');
  },

  showEmpty() {
    if (this.loading) this.loading.classList.add('hidden');
    if (this.empty) this.empty.classList.remove('hidden');
    if (this.grid) this.grid.classList.add('hidden');
  },

  showGrid() {
    if (this.loading) this.loading.classList.add('hidden');
    if (this.empty) this.empty.classList.add('hidden');
    if (this.grid) this.grid.classList.remove('hidden');
  },

  renderFavorites(favorites) {
    console.log('FavoritesGallery: Rendering favorites:', favorites);
    console.log('FavoritesGallery: Number of favorites:', favorites.length);
    if (favorites.length > 0) {
      console.log('FavoritesGallery: First favorite structure:', favorites[0]);
    }
    
    if (!this.grid) return;

    if (favorites.length === 0) {
      this.showEmpty();
      return;
    }

    this.showGrid();
    this.grid.innerHTML = '';

    favorites.forEach((favorite, index) => {
      console.log(`FavoritesGallery: Creating card for favorite ${index}:`, favorite);
      console.log(`FavoritesGallery: Preview data:`, favorite.preview);
      const card = this.createFavoriteCard(favorite);
      this.grid.appendChild(card);
    });
  },

  createFavoriteCard(favorite) {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'favorite-card-container';

    const card = document.createElement('div');
    card.className = 'favorite-card';

    // All favorites now use canvas thumbnails
    const preview = this.createCanvasThumbnail(favorite.thumbnail);
    const date = new Date(favorite.created_at).toLocaleDateString();
    const time = new Date(favorite.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <div class="favorite-preview">
        ${preview}
        <div class="preview-overlay"></div>
      </div>
      <div class="favorite-info">
        <div class="info-row">
          <div>
            <div class="date-info">${date}</div>
            <div class="time-info">${time}</div>
          </div>
          <div class="layer-count">
            ${favorite.layer_count} layer${favorite.layer_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    `;

    // Create delete button as separate element
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'favorite-delete-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = `
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    `;

    // Add both elements to container
    cardContainer.appendChild(card);
    cardContainer.appendChild(deleteBtn);

    // Add event handlers with debugging
    deleteBtn.addEventListener('click', (e) => {
      console.log('Delete button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      console.log('Deleting favorite:', favorite.id);
      this.deleteFavorite(favorite.id, cardContainer);
    });

    card.addEventListener('click', (e) => {
      console.log('Card clicked!', e);
      console.log('Loading favorite:', favorite.id);
      this.loadFavorite(favorite.id);
    });

    return cardContainer;
  },

  createCanvasThumbnail(thumbnailData) {
    console.log('FavoritesGallery: Using canvas thumbnail');
    
    if (!thumbnailData) {
      return '<div class="preview-no-image">No Thumbnail</div>';
    }
    
    return `<img src="${thumbnailData}" alt="Favorite thumbnail" style="width: 100%; height: 100%; object-fit: cover;" />`;
  },


  async loadFavorite(favoriteId) {
    try {
      this.hide();
      
      // Access managers through global App object
      const FavoritesManager = window.App?.FavoritesManager;
      const UI = window.App?.UI;
      
      if (!FavoritesManager) {
        throw new Error('FavoritesManager not available');
      }

      await FavoritesManager.loadFavorite(favoriteId);
      
      if (UI) {
        UI.showSuccess('Favorite loaded');
      }
    } catch (error) {
      console.error('FavoritesGallery: Failed to load favorite:', error);
      const UI = window.App?.UI;
      if (UI) {
        UI.showError('Failed to load favorite: ' + error.message);
      }
    }
  },

  async deleteFavorite(favoriteId, cardElement) {
    try {
      // Access managers through global App object
      const FavoritesManager = window.App?.FavoritesManager;
      const UI = window.App?.UI;
      
      if (!FavoritesManager) {
        throw new Error('FavoritesManager not available');
      }

      await FavoritesManager.deleteFavorite(favoriteId);
      cardElement.remove();

      // Check if grid is now empty
      if (this.grid && this.grid.children.length === 0) {
        this.showEmpty();
      }

      if (UI) {
        UI.showSuccess('Favorite deleted');
      }
    } catch (error) {
      console.error('FavoritesGallery: Failed to delete favorite:', error);
      const UI = window.App?.UI;
      if (UI) {
        UI.showError('Failed to delete favorite: ' + error.message);
      }
    }
  }
};