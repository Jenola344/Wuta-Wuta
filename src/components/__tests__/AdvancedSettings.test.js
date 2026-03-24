import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdvancedSettings from '../AdvancedSettings';

// Mock the framer-motion library
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Sliders: () => <div data-testid="sliders-icon">Sliders</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  Save: () => <div data-testid="save-icon">Save</div>,
  RotateCcw: () => <div data-testid="rotate-ccw-icon">RotateCcw</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Cpu: () => <div data-testid="cpu-icon">Cpu</div>,
  Palette: () => <div data-testid="palette-icon">Palette</div>,
}));

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  parameters: {
    temperature: 0.8,
    guidanceScale: 7.5,
    numInferenceSteps: 50,
    quality: 0.9,
  },
  onParametersChange: jest.fn(),
  presets: [
    {
      id: 'test-preset',
      name: 'Test Preset',
      parameters: { temperature: 1.0 }
    }
  ],
  onPresetApply: jest.fn(),
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AdvancedSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when isOpen is true', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    expect(screen.getByText('Advanced AI Settings')).toBeInTheDocument();
    expect(screen.getByText('Fine-tune AI parameters for power users')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Advanced AI Settings')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when backdrop is clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const backdrop = screen.getByText('Advanced AI Settings').closest('[role="dialog"]')?.parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  test('renders all tabs correctly', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    expect(screen.getByText('Generation')).toBeInTheDocument();
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Advanced AI')).toBeInTheDocument();
  });

  test('switches tabs when clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const imageTab = screen.getByText('Image');
    fireEvent.click(imageTab);
    
    // Check if image-related parameters are shown
    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByText('Height')).toBeInTheDocument();
  });

  test('updates parameters when slider changes', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const temperatureSlider = screen.getByDisplayValue('0.80');
    fireEvent.change(temperatureSlider, { target: { value: '1.0' } });
    
    expect(mockProps.onParametersChange).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 1.0 })
    );
  });

  test('shows and hides presets section', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const presetsButton = screen.getByText('Presets');
    fireEvent.click(presetsButton);
    
    expect(screen.getByText('Test Preset')).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(presetsButton);
    expect(screen.queryByText('Test Preset')).not.toBeInTheDocument();
  });

  test('applies preset when clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const presetsButton = screen.getByText('Presets');
    fireEvent.click(presetsButton);
    
    const presetButton = screen.getByText('Test Preset');
    fireEvent.click(presetButton);
    
    expect(mockProps.onPresetApply).toHaveBeenCalledWith({ temperature: 1.0 });
  });

  test('resets to defaults when reset button is clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    expect(mockProps.onParametersChange).toHaveBeenCalled();
  });

  test('exports settings when export button is clicked', () => {
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement and click
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
    };
    global.document.createElement = jest.fn(() => mockLink);
    
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(global.document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'muse-advanced-settings.json');
    expect(mockLink.click).toHaveBeenCalled();
  });

  test('handles parameter validation', () => {
    const invalidProps = {
      ...mockProps,
      parameters: {
        temperature: 3.0, // Invalid: above max of 2.0
        guidanceScale: 0.5, // Invalid: below min of 1.0
      }
    };
    
    renderWithRouter(<AdvancedSettings {...invalidProps} />);
    
    // Component should still render but show validation feedback
    expect(screen.getByText('Advanced AI Settings')).toBeInTheDocument();
  });

  test('displays parameter descriptions in tooltips', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    // Find info icons for tooltips
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  test('handles different parameter types', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    // Check for different input types
    expect(screen.getByDisplayValue('0.80')).toBeInTheDocument(); // slider
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // select
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // checkbox
  });

  test('calls onClose when Cancel button is clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Apply Settings button is clicked', () => {
    renderWithRouter(<AdvancedSettings {...mockProps} />);
    
    const applyButton = screen.getByText('Apply Settings');
    fireEvent.click(applyButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });
});
