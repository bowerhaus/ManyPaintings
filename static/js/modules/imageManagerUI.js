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
      // Add cache-busting parameter to prevent stale data
      const cacheBuster = Date.now();
      const response = await fetch(`/api/images?_t=${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
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
      // Create container for positioning delete button
      const cardContainer = document.createElement('div');
      cardContainer.className = 'image-card-container';
      
      // Create the main card
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = `
        <div class="image-card-thumbnail">
          <img 
            src="${image.path}" 
            alt="${image.filename}"
            loading="lazy"
          />
        </div>
        <div class="image-card-info">
          <p class="image-card-filename" title="${image.filename}">
            ${image.filename}
          </p>
          <div class="image-card-details">
            <span>${image.width}×${image.height}</span>
            <span>${this.formatFileSize(image.size)}</span>
          </div>
        </div>
      `;
      
      // Create delete button as separate element
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'image-delete-btn';
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

    const uploadedImageIds = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const progress = ((i + 1) / validFiles.length) * 100;
      
      this.updateUploadProgress(progress, `Uploading ${file.name}...`);

      try {
        const uploadResult = await this.uploadSingleFile(file);
        if (uploadResult && uploadResult.image && uploadResult.image.id) {
          uploadedImageIds.push(uploadResult.image.id);
          if (uploadResult.duplicate) {
            console.log(`ImageManagerUI: Duplicate detected for ${file.name}, triggering existing image with ID: ${uploadResult.image.id}`);
          } else {
            console.log(`ImageManagerUI: Uploaded ${file.name} with ID: ${uploadResult.image.id}`);
          }
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    this.hideUploadProgress();
    await this.loadImages(); // Refresh the grid
    
    // Refresh the main ImageManager catalog so new images appear in the animation sequence
    if (window.App && window.App.ImageManager) {
      await window.App.ImageManager.init();
      console.log('ImageManagerUI: Refreshed main ImageManager catalog after upload');
      
      // Force newly uploaded images to be shown immediately
      if (window.App.PatternManager && uploadedImageIds.length > 0) {
        // Verify uploaded image IDs exist in the catalog
        const catalogImageIds = Array.from(window.App.ImageManager.images.keys());
        const validUploadedIds = uploadedImageIds.filter(id => catalogImageIds.includes(id));
        const invalidIds = uploadedImageIds.filter(id => !catalogImageIds.includes(id));
        
        if (invalidIds.length > 0) {
          console.warn('ImageManagerUI: Some uploaded image IDs not found in catalog:', invalidIds);
        }
        
        if (validUploadedIds.length > 0) {
          // Preload the newly uploaded images immediately
          if (window.App.ImageManager) {
            await window.App.ImageManager.preloadImages(validUploadedIds, true);
          }
          
          const currentIndex = window.App.PatternManager.sequenceIndex;
          const sequenceLengthBefore = window.App.PatternManager.imageSequence.length;
          
          // Insert new images at the current position, pushing existing images forward
          // Reverse the array so they appear in the same order they were uploaded
          validUploadedIds.reverse().forEach(imageId => {
            window.App.PatternManager.imageSequence.splice(currentIndex, 0, imageId);
          });
          
          console.log('ImageManagerUI: Successfully inserted uploaded images');
          console.log('ImageManagerUI: Valid uploaded image IDs:', validUploadedIds.reverse()); // reverse back for logging
          console.log('ImageManagerUI: Inserted at sequence position:', currentIndex);
          console.log('ImageManagerUI: Sequence length before/after:', sequenceLengthBefore, '→', window.App.PatternManager.imageSequence.length);
          console.log('ImageManagerUI: Next few images in sequence:', window.App.PatternManager.imageSequence.slice(currentIndex, currentIndex + 5));
          
          // Free up one layer slot if we're at the limit
          const config = window.APP_CONFIG || {};
          const maxLayers = config.layer_management?.max_concurrent_layers || 5;
          const currentLayerCount = window.App.AnimationEngine.activeLayers.size;
          
          if (currentLayerCount >= maxLayers) {
            console.log(`ImageManagerUI: At layer limit (${currentLayerCount}/${maxLayers}), removing oldest layer to make room`);
            
            // Find the oldest layer (earliest startTime) and remove it immediately
            let oldestLayer = null;
            let oldestTime = Date.now();
            
            window.App.AnimationEngine.activeLayers.forEach((layerInfo, imageId) => {
              if (layerInfo.startTime < oldestTime) {
                oldestTime = layerInfo.startTime;
                oldestLayer = layerInfo;
              }
            });
            
            if (oldestLayer) {
              console.log('ImageManagerUI: Removing oldest layer to make room for uploaded image');
              window.App.AnimationEngine.removeLayer(oldestLayer);
            }
          }
          
          // Immediately show the uploaded image
          console.log('ImageManagerUI: Triggering immediate display of uploaded images');
          await window.App.PatternManager.showNextImage();
        } else {
          console.error('ImageManagerUI: No valid uploaded image IDs found in catalog');
        }
      }
    }
    
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
      // Find and disable the delete button to prevent double-clicks
      const deleteBtn = document.querySelector(`[data-filename="${filename}"]`);
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.5';
      }

      const response = await fetch(`/api/images/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      console.log(`ImageManagerUI: Successfully deleted ${filename}`);

      // Show success toast
      if (window.App && window.App.UI) {
        window.App.UI.showSuccess(`Image "${filename}" deleted`);
      }

      // Clear any cached images from ImageManager
      if (window.App && window.App.ImageManager) {
        // Clear the specific image from loaded images cache
        const imageInfo = Array.from(window.App.ImageManager.images.values())
          .find(img => img.filename === filename);
        if (imageInfo) {
          window.App.ImageManager.loadedImages.delete(imageInfo.id);
        }
        
        // Refresh the main image catalog
        await window.App.ImageManager.init();
      }

      // Refresh the grid with a short delay to ensure backend is updated
      setTimeout(async () => {
        await this.loadImages();
      }, 100);

    } catch (error) {
      console.error('Failed to delete image:', error);
      alert(`Failed to delete image: ${error.message}`);
      
      // Re-enable the delete button on error
      const deleteBtn = document.querySelector(`[data-filename="${filename}"]`);
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.style.opacity = '1';
      }
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