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

    this.grid.innerHTML = images.map(image => `
      <div class="relative group bg-white border border-black/10 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div class="aspect-square bg-gray-100 relative">
          <img 
            src="${image.path}" 
            alt="${image.filename}"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <button 
            class="delete-image-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            data-filename="${image.filename}"
            title="Delete image"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
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
      </div>
    `).join('');

    // Add delete event listeners
    this.grid.querySelectorAll('.delete-image-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filename = btn.dataset.filename;
        this.deleteImage(filename);
      });
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