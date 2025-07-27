import { render, screen } from '@testing-library/react';
import { BauhausLoader } from '../../components/ui/loading/BauhausLoader';

describe('BauhausLoader', () => {
  it('renders when visible', () => {
    render(
      <BauhausLoader
        isVisible={true}
        message="Testing"
        variant="thinking"
      />
    );
    
    expect(screen.getByText(/Testing/)).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <BauhausLoader
        isVisible={false}
        message="Testing"
        variant="thinking"
      />
    );
    
    expect(screen.queryByText(/Testing/)).not.toBeInTheDocument();
  });

  it('shows progress when provided', () => {
    render(
      <BauhausLoader
        isVisible={true}
        message="Processing"
        progress={50}
        variant="processing"
      />
    );
    
    expect(screen.getByText(/Processing/)).toBeInTheDocument();
  });
});