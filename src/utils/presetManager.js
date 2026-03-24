// Preset management system for AI parameters

export const DEFAULT_PRESETS = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Highly detailed, realistic images with natural lighting',
    category: 'style',
    icon: '📷',
    parameters: {
      guidanceScale: 7.5,
      numInferenceSteps: 50,
      quality: 0.95,
      sharpness: 1.2,
      contrast: 1.1,
      detailEnhancement: 0.8,
      noiseLevel: 0.05,
      colorHarmony: 0.6,
      compositionBalance: 0.7
    },
    tags: ['realistic', 'detailed', 'photography'],
    compatibleModels: ['stable-diffusion', 'dall-e-3', 'midjourney']
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative and stylized outputs with artistic flair',
    category: 'style',
    icon: '🎨',
    parameters: {
      temperature: 1.2,
      guidanceScale: 6.0,
      numInferenceSteps: 40,
      strength: 0.9,
      colorHarmony: 0.8,
      compositionBalance: 0.7,
      saturation: 1.3,
      contrast: 1.2
    },
    tags: ['artistic', 'creative', 'stylized'],
    compatibleModels: ['stable-diffusion', 'midjourney']
  },
  {
    id: 'fast',
    name: 'Fast Generation',
    description: 'Quick results with optimized performance',
    category: 'performance',
    icon: '⚡',
    parameters: {
      numInferenceSteps: 20,
      quality: 0.7,
      enableAttentionSlicing: true,
      maxGenerationTime: 60,
      batchSize: 1,
      width: 512,
      height: 512
    },
    tags: ['fast', 'performance', 'quick'],
    compatibleModels: ['stable-diffusion', 'dall-e-3', 'midjourney']
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Maximum quality with longer generation time',
    category: 'quality',
    icon: '💎',
    parameters: {
      guidanceScale: 8.0,
      numInferenceSteps: 100,
      quality: 1.0,
      sharpness: 1.3,
      detailEnhancement: 0.9,
      maxGenerationTime: 180,
      enableModelCaching: true
    },
    tags: ['quality', 'detailed', 'premium'],
    compatibleModels: ['stable-diffusion', 'dall-e-3', 'midjourney']
  },
  {
    id: 'anime',
    name: 'Anime Style',
    description: 'Japanese anime and manga art style',
    category: 'style',
    icon: '🌸',
    parameters: {
      guidanceScale: 7.0,
      numInferenceSteps: 45,
      quality: 0.9,
      saturation: 1.4,
      contrast: 1.15,
      colorHarmony: 0.8,
      negativePrompt: 'realistic, photorealistic, 3d, blurry'
    },
    tags: ['anime', 'manga', 'japanese'],
    compatibleModels: ['stable-diffusion', 'midjourney']
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple designs with minimal elements',
    category: 'style',
    icon: '⭕',
    parameters: {
      guidanceScale: 6.5,
      numInferenceSteps: 35,
      quality: 0.85,
      contrast: 0.9,
      saturation: 0.8,
      compositionBalance: 0.9,
      noiseLevel: 0.02
    },
    tags: ['minimalist', 'clean', 'simple'],
    compatibleModels: ['stable-diffusion', 'dall-e-3', 'midjourney']
  },
  {
    id: 'low-memory',
    name: 'Low Memory',
    description: 'Optimized for systems with limited memory',
    category: 'performance',
    icon: '🧠',
    parameters: {
      enableAttentionSlicing: true,
      enableCpuOffload: true,
      enableModelCaching: false,
      batchSize: 1,
      width: 384,
      height: 384,
      numInferenceSteps: 25,
      maxGenerationTime: 90
    },
    tags: ['memory', 'performance', 'optimization'],
    compatibleModels: ['stable-diffusion']
  },
  {
    id: 'experimental',
    name: 'Experimental',
    description: 'Cutting-edge parameters for unique results',
    category: 'experimental',
    icon: '🔬',
    parameters: {
      temperature: 1.5,
      guidanceScale: 9.0,
      numInferenceSteps: 75,
      strength: 1.0,
      noiseLevel: 0.3,
      crossAttentionControl: 0.8,
      selfAttentionControl: 0.6,
      temporalConsistency: 0.4
    },
    tags: ['experimental', 'unique', 'creative'],
    compatibleModels: ['stable-diffusion', 'midjourney']
  }
];

export class PresetManager {
  constructor() {
    this.presets = [...DEFAULT_PRESETS];
    this.customPresets = [];
    this.loadCustomPresets();
  }

  loadCustomPresets() {
    try {
      const stored = localStorage.getItem('muse-custom-presets');
      if (stored) {
        this.customPresets = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  }

  saveCustomPresets() {
    try {
      localStorage.setItem('muse-custom-presets', JSON.stringify(this.customPresets));
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }

  getAllPresets() {
    return [...this.presets, ...this.customPresets];
  }

  getPresetById(id) {
    return this.getAllPresets().find(preset => preset.id === id);
  }

  getPresetsByCategory(category) {
    return this.getAllPresets().filter(preset => preset.category === category);
  }

  getPresetsByModel(modelId) {
    return this.getAllPresets().filter(preset => 
      preset.compatibleModels.includes(modelId)
    );
  }

  searchPresets(query, filters = {}) {
    const presets = this.getAllPresets();
    
    return presets.filter(preset => {
      // Text search
      const matchesQuery = !query || 
        preset.name.toLowerCase().includes(query.toLowerCase()) ||
        preset.description.toLowerCase().includes(query.toLowerCase()) ||
        preset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      // Category filter
      const matchesCategory = !filters.category || preset.category === filters.category;

      // Model compatibility filter
      const matchesModel = !filters.model || preset.compatibleModels.includes(filters.model);

      // Tag filter
      const matchesTags = !filters.tags?.length || 
        filters.tags.some(tag => preset.tags.includes(tag));

      return matchesQuery && matchesCategory && matchesModel && matchesTags;
    });
  }

  createCustomPreset(presetData) {
    const customPreset = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: presetData.name,
      description: presetData.description || 'Custom preset',
      category: presetData.category || 'custom',
      icon: presetData.icon || '⚙️',
      parameters: presetData.parameters,
      tags: presetData.tags || [],
      compatibleModels: presetData.compatibleModels || ['stable-diffusion'],
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    this.customPresets.push(customPreset);
    this.saveCustomPresets();
    return customPreset;
  }

  updateCustomPreset(id, updates) {
    const index = this.customPresets.findIndex(preset => preset.id === id);
    if (index === -1) return false;

    this.customPresets[index] = {
      ...this.customPresets[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveCustomPresets();
    return true;
  }

  deleteCustomPreset(id) {
    const index = this.customPresets.findIndex(preset => preset.id === id);
    if (index === -1) return false;

    this.customPresets.splice(index, 1);
    this.saveCustomPresets();
    return true;
  }

  duplicatePreset(id, newName) {
    const original = this.getPresetById(id);
    if (!original) return null;

    const duplicate = {
      ...original,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${original.name} (Copy)`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: null
    };

    if (original.isCustom) {
      this.customPresets.push(duplicate);
      this.saveCustomPresets();
    } else {
      // Duplicating a default preset creates a custom one
      this.customPresets.push(duplicate);
      this.saveCustomPresets();
    }

    return duplicate;
  }

  exportPresets(presetIds = null) {
    const presetsToExport = presetIds 
      ? presetIds.map(id => this.getPresetById(id)).filter(Boolean)
      : this.getAllPresets();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      presets: presetsToExport
    };
  }

  importPresets(importData, options = {}) {
    try {
      const { presets } = importData;
      const imported = [];
      const skipped = [];

      presets.forEach(preset => {
        // Check for duplicates
        const existing = this.getPresetById(preset.id);
        if (existing && !options.overwrite) {
          skipped.push({ preset, reason: 'Already exists' });
          return;
        }

        // Validate preset structure
        if (!this.validatePreset(preset)) {
          skipped.push({ preset, reason: 'Invalid structure' });
          return;
        }

        if (existing && options.overwrite) {
          // Update existing custom preset
          this.updateCustomPreset(preset.id, preset);
          imported.push(preset);
        } else {
          // Add as new custom preset
          this.customPresets.push({
            ...preset,
            isCustom: true,
            importedAt: new Date().toISOString()
          });
          imported.push(preset);
        }
      });

      this.saveCustomPresets();
      return { imported, skipped };
    } catch (error) {
      console.error('Failed to import presets:', error);
      throw error;
    }
  }

  validatePreset(preset) {
    const required = ['id', 'name', 'parameters'];
    return required.every(field => preset[field] !== undefined);
  }

  getPresetCategories() {
    const categories = new Set();
    this.getAllPresets().forEach(preset => {
      categories.add(preset.category);
    });
    return Array.from(categories);
  }

  getPresetTags() {
    const tags = new Set();
    this.getAllPresets().forEach(preset => {
      preset.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  getRecommendedPresets(baseParameters, modelId, limit = 5) {
    const compatiblePresets = this.getPresetsByModel(modelId);
    
    // Calculate similarity scores based on parameter overlap
    const scored = compatiblePresets.map(preset => {
      let score = 0;
      let matches = 0;
      
      Object.keys(preset.parameters).forEach(key => {
        if (baseParameters[key] !== undefined) {
          matches++;
          const diff = Math.abs(preset.parameters[key] - baseParameters[key]);
          const maxDiff = Math.max(Math.abs(baseParameters[key]), Math.abs(preset.parameters[key]));
          const similarity = maxDiff > 0 ? 1 - (diff / maxDiff) : 1;
          score += similarity;
        }
      });
      
      return {
        preset,
        score: matches > 0 ? score / matches : 0,
        matches
      };
    });

    return scored
      .filter(item => item.matches > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.preset);
  }
}

// Create singleton instance
export const presetManager = new PresetManager();

// Utility functions
export const createPresetFromParameters = (name, parameters, metadata = {}) => {
  return {
    name,
    description: metadata.description || `Custom preset: ${name}`,
    category: metadata.category || 'custom',
    icon: metadata.icon || '⚙️',
    parameters,
    tags: metadata.tags || [],
    compatibleModels: metadata.compatibleModels || ['stable-diffusion']
  };
};

export const mergePresets = (basePreset, overlayPreset) => {
  return {
    ...basePreset,
    ...overlayPreset,
    parameters: {
      ...basePreset.parameters,
      ...overlayPreset.parameters
    },
    tags: [...new Set([...basePreset.tags, ...overlayPreset.tags])]
  };
};
