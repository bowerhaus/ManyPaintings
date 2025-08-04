/**
 * Image Manager UI - Handles the image management modal interface
 */
export const ImageManagerUI = {
  modal: null,
  grid: null,
  loading: null,
  empty: null,
  uploadArea: null,
  uploadInput: null,
  uploadProgress: null,
  uploadProgressBar: null,
  uploadStatus: null,
  escKeyHandler: null,

  init() {
    this.modal = document.getElementById('image-manager-modal');
    this.grid = document.getElementById('images-grid');
    this.loading = document.getElementById('images-loading');
    this.empty = document.getElementById('images-empty');
    this.uploadArea = document.getElementById('upload-area');
    this.uploadInput = document.getElementById('image-upload-input');
    this.uploadProgress = document.getElementById('upload-progress');
    this.uploadProgressBar = document.getElementById('upload-progress-bar');
    this.uploadStatus = document.getElementById('upload-status');

    if (!this.modal || !this.grid) {
      console.warn('ImageManagerUI: Required elements not found');
      return;
    }

    this.setupEventListeners();
    console.log('ImageManagerUI: Initialized');
  },

  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('image-manager-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Upload area events
    if (this.uploadArea && this.uploadInput) {
      this.uploadArea.addEventListener('click', () => {
        this.uploadInput.click();
      });

      this.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.uploadArea.classList.add('border-black/40');
      });

      this.uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        this.uploadArea.classList.remove('border-black/40');
      });

      this.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        this.uploadArea.classList.remove('border-black/40');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.uploadFiles(Array.from(files));
        }
      });

      this.uploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
          this.uploadFiles(Array.from(files));
        }
      });
    }

    // Escape key handler
    this.escKeyHandler = (e) => {
      if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
        this.hide();
      }
    };
  },

  async show() {
    if (!this.modal) return;

    this.modal.classList.remove('hidden');
    document.addEventListener('keydown', this.escKeyHandler);
    
    await this.loadImages();
  },

  hide() {
    if (!this.modal) return;

    this.modal.classList.add('hidden');
    document.removeEventListener('keydown', this.escKeyHandler);
  },

  async loadImages() {
    this.showLoading();
    
    try {
      const response = await fetch('/api/images');
      const data = await response.json();
      
      if (data.images && data.images.length > 0) {
        this.displayImages(data.images);
      } else {
        this.showEmpty();
      }
    } catch (error) {
      console.error('ImageManagerUI: Failed to load images:', error);
      this.showEmpty();
    }
  },

  showLoading() {
    if (this.loading) this.loading.classList.remove('hidden');
    if (this.empty) this.empty.classList.add('hidden');
    if (this.grid) this.grid.innerHTML = '';
  },

  showEmpty() {
    if (this.loading) this.loading.classList.add('hidden');
    if (this.empty) this.empty.classList.remove('hidden');
    if (this.grid) this.grid.innerHTML = '';
  },

  displayImages(images) {
    if (this.loading) this.loading.classList.add('hidden');
    if (this.empty) this.empty.classList.add('hidden');
    
    if (!this.grid) return;

    this.grid.innerHTML = '';
    
    images.forEach(image => {
      // Create container like favorites manager
      const cardContainer = document.createElement('div');
      cardContainer.className = 'favorite-card-container';
      
      // Create the main card
      const card = document.createElement('div');
      card.className = 'bg-white border border-black/10 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow';
      card.innerHTML = `
        <div class="aspect-square bg-gray-100 relative">
          <img 
            src="${image.path}" 
            alt="${image.filename}"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div class="p-3">
          <p class="text-black/80 text-sm font-medium truncate" title="${image.filename}">
            ${image.filename}
          </p>
          <div class="text-black/50 text-xs mt-1 flex justify-between">
            <span>${image.width}×${image.height}</span>
            <span>${this.formatFileSize(image.size)}</span>
          </div>
        </div>
      `;
      
      // Create delete button as separate element like favorites manager
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'favorite-delete-btn';
      deleteBtn.title = 'Delete image';
      deleteBtn.dataset.filename = image.filename;
      deleteBtn.innerHTML = `
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      `;
      
      // Add both elements to container
      cardContainer.appendChild(card);
      cardContainer.appendChild(deleteBtn);
      
      // Add delete event listener
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.deleteImage(image.filename);
      });
      
      // Add to grid
      this.grid.appendChild(cardContainer);
    });
  },

  async uploadFiles(files) {
    const validFiles = files.filter(file => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
      alert('Please select valid image files (PNG, JPG, JPEG, GIF, WEBP)');
      return;
    }

    this.showUploadProgress();

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const progress = ((i + 1) / validFiles.length) * 100;
      
      this.updateUploadProgress(progress, `Uploading ${file.name}...`);

      try {
        await this.uploadSingleFile(file);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    this.hideUploadProgress();
    await this.loadImages(); // Refresh the grid
    
    // Clear the input
    if (this.uploadInput) {
      this.uploadInput.value = '';
    }
  },

  async uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result;
  },

  async deleteImage(filename) {
    try {
      const response = await fetch(`/api/images/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      // Refresh the grid
      await this.loadImages();
      
      // Refresh the main image catalog if ImageManager is available
      if (window.App && window.App.ImageManager) {
        await window.App.ImageManager.init();
      }

    } catch (error) {
      console.error('Failed to delete image:', error);
      alert(`Failed to delete image: ${error.message}`);
    }
  },

  showUploadProgress() {
    if (this.uploadProgress) {
      this.uploadProgress.classList.remove('hidden');
    }
  },

  hideUploadProgress() {
    if (this.uploadProgress) {
      this.uploadProgress.classList.add('hidden');
    }
  },

  updateUploadProgress(percentage, status) {
    if (this.uploadProgressBar) {
      this.uploadProgressBar.style.width = `${percentage}%`;
    }
    if (this.uploadStatus) {
      this.uploadStatus.textContent = status;
    }
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};