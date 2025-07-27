/**
 * Basic setup test to verify Jest configuration
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Simple component to test
const TestComponent = () => {
  return <div>Test Setup Working</div>
}

describe('Test Setup', () => {
  it('should render a simple component', () => {
    render(<TestComponent />)
    expect(screen.getByText('Test Setup Working')).toBeInTheDocument()
  })

  it('should run basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect(true).toBeTruthy()
  })
})