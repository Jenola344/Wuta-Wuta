import { 
  DEFAULT_PRESETS, 
  PresetManager, 
  presetManager,
  createPresetFromParameters,
  mergePresets
} from '../presetManager';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Preset Manager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('DEFAULT_PRESETS', () => {
    test('has expected presets', () => {
      expect(DEFAULT_PRESETS).toHaveLength(8);
      expect(DEFAULT_PRESETS.map(p => p.id)).toContain('photorealistic');
      expect(DEFAULT_PRESETS.map(p => p.id)).toContain('artistic');
      expect(DEFAULT_PRESETS.map(p => p.id)).toContain('fast');
    });

    test('all presets have required fields', () => {
      DEFAULT_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('category');
        expect(preset).toHaveProperty('parameters');
        expect(preset).toHaveProperty('tags');
        expect(preset).toHaveProperty('compatibleModels');
      });
    });
  });

  describe('PresetManager class', () => {
    let manager;

    beforeEach(() => {
      manager = new PresetManager();
    });

    describe('getAllPresets', () => {
      test('returns default and custom presets', () => {
        const allPresets = manager.getAllPresets();
        expect(allPresets).toHaveLength(8); // Default presets only
      });

      test('includes custom presets when added', () => {
        const customPreset = {
          name: 'Custom Test',
          parameters: { temperature: 1.0 }
        };
        manager.createCustomPreset(customPreset);
        
        const allPresets = manager.getAllPresets();
        expect(allPresets).toHaveLength(9);
      });
    });

    describe('getPresetById', () => {
      test('finds default preset by id', () => {
        const preset = manager.getPresetById('photorealistic');
        expect(preset).toBeDefined();
        expect(preset.name).toBe('Photorealistic');
      });

      test('returns undefined for unknown id', () => {
        const preset = manager.getPresetById('unknown');
        expect(preset).toBeUndefined();
      });

      test('finds custom preset by id', () => {
        const customPreset = manager.createCustomPreset({
          name: 'Custom Test',
          parameters: { temperature: 1.0 }
        });
        
        const found = manager.getPresetById(customPreset.id);
        expect(found).toBeDefined();
        expect(found.name).toBe('Custom Test');
      });
    });

    describe('getPresetsByCategory', () => {
      test('filters presets by category', () => {
        const stylePresets = manager.getPresetsByCategory('style');
        expect(stylePresets.length).toBeGreaterThan(0);
        stylePresets.forEach(preset => {
          expect(preset.category).toBe('style');
        });
      });

      test('returns empty array for unknown category', () => {
        const unknown = manager.getPresetsByCategory('unknown');
        expect(unknown).toHaveLength(0);
      });
    });

    describe('getPresetsByModel', () => {
      test('filters presets by model compatibility', () => {
        const compatiblePresets = manager.getPresetsByModel('stable-diffusion');
        expect(compatiblePresets.length).toBeGreaterThan(0);
        compatiblePresets.forEach(preset => {
          expect(preset.compatibleModels).toContain('stable-diffusion');
        });
      });

      test('returns empty array for incompatible model', () => {
        const incompatible = manager.getPresetsByModel('unknown-model');
        expect(incompatible).toHaveLength(0);
      });
    });

    describe('searchPresets', () => {
      test('searches by name', () => {
        const results = manager.searchPresets('photo');
        expect(results.length).toBeGreaterThan(0);
        results.forEach(preset => {
          expect(preset.name.toLowerCase()).toContain('photo');
        });
      });

      test('searches by description', () => {
        const results = manager.searchPresets('realistic');
        expect(results.length).toBeGreaterThan(0);
      });

      test('searches by tags', () => {
        const results = manager.searchPresets('fast');
        expect(results.length).toBeGreaterThan(0);
      });

      test('filters by category', () => {
        const results = manager.searchPresets('', { category: 'style' });
        expect(results.length).toBeGreaterThan(0);
        results.forEach(preset => {
          expect(preset.category).toBe('style');
        });
      });

      test('filters by model', () => {
        const results = manager.searchPresets('', { model: 'midjourney' });
        results.forEach(preset => {
          expect(preset.compatibleModels).toContain('midjourney');
        });
      });

      test('returns all presets for empty query', () => {
        const results = manager.searchPresets('');
        expect(results.length).toBe(8);
      });
    });

    describe('createCustomPreset', () => {
      test('creates custom preset with required fields', () => {
        const presetData = {
          name: 'Test Preset',
          description: 'Test description',
          parameters: { temperature: 1.0 }
        };
        
        const preset = manager.createCustomPreset(presetData);
        
        expect(preset.name).toBe('Test Preset');
        expect(preset.description).toBe('Test description');
        expect(preset.parameters).toEqual({ temperature: 1.0 });
        expect(preset.isCustom).toBe(true);
        expect(preset.category).toBe('custom');
        expect(preset.createdAt).toBeDefined();
      });

      test('generates unique ID', () => {
        const preset1 = manager.createCustomPreset({
          name: 'Test 1',
          parameters: {}
        });
        const preset2 = manager.createCustomPreset({
          name: 'Test 2',
          parameters: {}
        });
        
        expect(preset1.id).not.toBe(preset2.id);
      });

      test('saves to localStorage', () => {
        manager.createCustomPreset({
          name: 'Test Preset',
          parameters: {}
        });
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'muse-custom-presets',
          expect.any(String)
        );
      });
    });

    describe('updateCustomPreset', () => {
      test('updates existing custom preset', () => {
        const preset = manager.createCustomPreset({
          name: 'Original Name',
          parameters: { temperature: 0.8 }
        });
        
        const success = manager.updateCustomPreset(preset.id, {
          name: 'Updated Name',
          parameters: { temperature: 1.0 }
        });
        
        expect(success).toBe(true);
        
        const updated = manager.getPresetById(preset.id);
        expect(updated.name).toBe('Updated Name');
        expect(updated.parameters.temperature).toBe(1.0);
        expect(updated.updatedAt).toBeDefined();
      });

      test('returns false for non-existent preset', () => {
        const success = manager.updateCustomPreset('non-existent', {
          name: 'Updated'
        });
        
        expect(success).toBe(false);
      });
    });

    describe('deleteCustomPreset', () => {
      test('deletes custom preset', () => {
        const preset = manager.createCustomPreset({
          name: 'To Delete',
          parameters: {}
        });
        
        const success = manager.deleteCustomPreset(preset.id);
        expect(success).toBe(true);
        
        const deleted = manager.getPresetById(preset.id);
        expect(deleted).toBeUndefined();
      });

      test('returns false for non-existent preset', () => {
        const success = manager.deleteCustomPreset('non-existent');
        expect(success).toBe(false);
      });
    });

    describe('duplicatePreset', () => {
      test('duplicates existing preset', () => {
        const original = manager.getPresetById('photorealistic');
        const duplicate = manager.duplicatePreset('photorealistic', 'Copy of Photorealistic');
        
        expect(duplicate).toBeDefined();
        expect(duplicate.id).not.toBe(original.id);
        expect(duplicate.name).toBe('Copy of Photorealistic');
        expect(duplicate.isCustom).toBe(true);
        expect(duplicate.parameters).toEqual(original.parameters);
      });

      test('generates default name if none provided', () => {
        const original = manager.getPresetById('photorealistic');
        const duplicate = manager.duplicatePreset('photorealistic');
        
        expect(duplicate.name).toBe('Photorealistic (Copy)');
      });

      test('returns null for non-existent preset', () => {
        const duplicate = manager.duplicatePreset('non-existent');
        expect(duplicate).toBeNull();
      });
    });

    describe('exportPresets', () => {
      test('exports all presets by default', () => {
        const exportData = manager.exportPresets();
        
        expect(exportData).toHaveProperty('version', '1.0');
        expect(exportData).toHaveProperty('exportDate');
        expect(exportData).toHaveProperty('presets');
        expect(exportData.presets).toHaveLength(8);
      });

      test('exports specific presets', () => {
        const exportData = manager.exportPresets(['photorealistic', 'artistic']);
        
        expect(exportData.presets).toHaveLength(2);
        expect(exportData.presets.map(p => p.id)).toContain('photorealistic');
        expect(exportData.presets.map(p => p.id)).toContain('artistic');
      });
    });

    describe('importPresets', () => {
      test('imports valid presets', () => {
        const importData = {
          presets: [
            {
              id: 'imported-1',
              name: 'Imported Preset 1',
              parameters: { temperature: 1.0 }
            },
            {
              id: 'imported-2',
              name: 'Imported Preset 2',
              parameters: { guidanceScale: 8.0 }
            }
          ]
        };
        
        const result = manager.importPresets(importData);
        
        expect(result.imported).toHaveLength(2);
        expect(result.skipped).toHaveLength(0);
        
        expect(manager.getPresetById('imported-1')).toBeDefined();
        expect(manager.getPresetById('imported-2')).toBeDefined();
      });

      test('skips invalid presets', () => {
        const importData = {
          presets: [
            {
              id: 'valid',
              name: 'Valid Preset',
              parameters: {}
            },
            {
              // Missing required fields
              id: 'invalid'
            }
          ]
        };
        
        const result = manager.importPresets(importData);
        
        expect(result.imported).toHaveLength(1);
        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].reason).toBe('Invalid structure');
      });

      test('handles overwrite option', () => {
        // Create a custom preset first
        const existing = manager.createCustomPreset({
          name: 'Existing Preset',
          parameters: { temperature: 0.8 }
        });
        
        const importData = {
          presets: [
            {
              id: existing.id,
              name: 'Updated Preset',
              parameters: { temperature: 1.2 }
            }
          ]
        };
        
        // Without overwrite
        let result = manager.importPresets(importData);
        expect(result.imported).toHaveLength(0);
        expect(result.skipped).toHaveLength(1);
        
        // With overwrite
        result = manager.importPresets(importData, { overwrite: true });
        expect(result.imported).toHaveLength(1);
        expect(result.skipped).toHaveLength(0);
        
        const updated = manager.getPresetById(existing.id);
        expect(updated.name).toBe('Updated Preset');
        expect(updated.parameters.temperature).toBe(1.2);
      });
    });

    describe('validatePreset', () => {
      test('validates valid preset', () => {
        const preset = {
          id: 'test',
          name: 'Test',
          parameters: {}
        };
        
        expect(manager.validatePreset(preset)).toBe(true);
      });

      test('rejects invalid preset', () => {
        const preset = {
          id: 'test'
          // Missing name and parameters
        };
        
        expect(manager.validatePreset(preset)).toBe(false);
      });
    });

    describe('getPresetCategories', () => {
      test('returns all unique categories', () => {
        const categories = manager.getPresetCategories();
        expect(categories).toContain('style');
        expect(categories).toContain('performance');
        expect(categories).toContain('quality');
        expect(categories).toContain('experimental');
      });
    });

    describe('getPresetTags', () => {
      test('returns all unique tags', () => {
        const tags = manager.getPresetTags();
        expect(tags).toContain('realistic');
        expect(tags).toContain('fast');
        expect(tags).toContain('quality');
      });
    });

    describe('getRecommendedPresets', () => {
      test('recommends presets based on similarity', () => {
        const baseParams = { guidanceScale: 7.0, temperature: 0.8 };
        const recommendations = manager.getRecommendedPresets(baseParams, 'stable-diffusion', 3);
        
        expect(recommendations.length).toBeLessThanOrEqual(3);
        recommendations.forEach(preset => {
          expect(preset.compatibleModels).toContain('stable-diffusion');
        });
      });

      test('returns empty when no compatible presets', () => {
        const recommendations = manager.getRecommendedPresets({}, 'unknown-model');
        expect(recommendations).toHaveLength(0);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('createPresetFromParameters', () => {
      test('creates preset from parameters', () => {
        const parameters = { temperature: 1.0, guidanceScale: 8.0 };
        const metadata = {
          description: 'Test preset',
          category: 'custom',
          tags: ['test']
        };
        
        const preset = createPresetFromParameters('Test Preset', parameters, metadata);
        
        expect(preset.name).toBe('Test Preset');
        expect(preset.description).toBe('Test preset');
        expect(preset.category).toBe('custom');
        expect(preset.parameters).toEqual(parameters);
        expect(preset.tags).toEqual(['test']);
      });

      test('uses default metadata', () => {
        const preset = createPresetFromParameters('Test', { temperature: 1.0 });
        
        expect(preset.description).toBe('Custom preset: Test');
        expect(preset.category).toBe('custom');
        expect(preset.icon).toBe('⚙️');
        expect(preset.tags).toEqual([]);
        expect(preset.compatibleModels).toEqual(['stable-diffusion']);
      });
    });

    describe('mergePresets', () => {
      test('merges two presets', () => {
        const base = {
          id: 'base',
          name: 'Base',
          parameters: { temperature: 0.8, guidanceScale: 7.5 },
          tags: ['base']
        };
        
        const overlay = {
          id: 'overlay',
          name: 'Overlay',
          parameters: { guidanceScale: 8.0, quality: 0.9 },
          tags: ['overlay']
        };
        
        const merged = mergePresets(base, overlay);
        
        expect(merged.name).toBe('Overlay');
        expect(merged.parameters).toEqual({
          temperature: 0.8,
          guidanceScale: 8.0,
          quality: 0.9
        });
        expect(merged.tags).toEqual(['base', 'overlay']);
      });
    });
  });

  describe('Singleton Instance', () => {
    test('exports singleton instance', () => {
      expect(presetManager).toBeInstanceOf(PresetManager);
    });

    test('singleton persists across imports', () => {
      const manager1 = require('../presetManager').presetManager;
      const manager2 = require('../presetManager').presetManager;
      
      expect(manager1).toBe(manager2);
    });
  });
});
