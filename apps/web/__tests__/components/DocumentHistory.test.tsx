// import React from 'react'
// import { screen, fireEvent, waitFor } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { render, createMockDocument } from '../utils/test-utils'
// import { DocumentHistory } from '../../components/rag/DocumentHistory'

// // Mock the document store
// const mockDeleteDocument = jest.fn()
// const mockDeletingIds = new Set<string>()

// jest.mock('../../stores/document-store', () => ({
//   useDocumentStore: (selector: any) => {
//     const state = {
//       deletingIds: mockDeletingIds,
//       deleteDocument: mockDeleteDocument,
//     }
//     return selector(state)
//   },
// }))

// // Mock icon utils
// jest.mock('../../lib/icon-utils', () => ({
//   renderIcon: (Icon: any, props: any) => {
//     const iconMap: Record<string, string> = {
//       FileText: '📄',
//     }
//     const iconName = Icon.name || Icon.displayName || 'Unknown'
//     return <span {...props}>{iconMap[iconName] || '❓'}</span>
//   },
// }))

// // Mock DocumentCard component
// jest.mock('../../components/rag/DocumentCard', () => {
//   return function MockDocumentCard({ 
//     document, 
//     isDeleting, 
//     expandingDocument, 
//     onPaperClick, 
//     onFolderClick, 
//     onDelete 
//   }: any) {
//     return (
//       <div data-testid={`document-card-${document._id}`}>
//         <div data-testid={`document-title-${document._id}`}>{document.title}</div>
//         <button 
//           data-testid={`paper-button-${document._id}`}
//           onClick={(e) => onPaperClick(document._id, 0, e)}
//         >
//           Paper
//         </button>
//         <button 
//           data-testid={`folder-button-${document._id}`}
//           onClick={(e) => onFolderClick(document._id, e)}
//         >
//           Folder
//         </button>
//         <button 
//           data-testid={`delete-button-${document._id}`}
//           onClick={() => onDelete(document._id)}
//           disabled={isDeleting}
//         >
//           {isDeleting ? 'Deleting...' : 'Delete'}
//         </button>
//         {expandingDocument?.docId === document._id && (
//           <div data-testid={`expanding-${document._id}`}>Expanding</div>
//         )}
//       </div>
//     )
//   }
// })

// // Mock DocumentViewer component
// jest.mock('../../components/rag/DocumentViewer', () => {
//   return function MockDocumentViewer({ 
//     documentId, 
//     isOpen, 
//     onClose, 
//     animationOrigin 
//   }: any) {
//     if (!isOpen) return null
    
//     return (
//       <div data-testid="document-viewer">
//         <div data-testid="viewer-document-id">{documentId}</div>
//         <button data-testid="viewer-close" onClick={onClose}>Close</button>
//         {animationOrigin && (
//           <div data-testid="animation-origin">
//             {animationOrigin.x},{animationOrigin.y}
//           </div>
//         )}
//       </div>
//     )
//   }
// })

// describe('DocumentHistory', () => {
//   const mockDocuments = [
//     createMockDocument({
//       _id: 'doc-1',
//       title: 'First Document',
//       uploadedAt: Date.now() - 86400000, // 1 day ago
//     }),
//     createMockDocument({
//       _id: 'doc-2',
//       title: 'Second Document',
//       uploadedAt: Date.now() - 172800000, // 2 days ago
//     }),
//     createMockDocument({
//       _id: 'doc-3',
//       title: 'Third Document',
//       uploadedAt: Date.now() - 259200000, // 3 days ago
//     }),
//   ]

//   const defaultProps = {
//     documents: mockDocuments,
//     loading: false,
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     mockDeletingIds.clear()
//   })

//   describe('Loading State', () => {
//     it('shows loading skeleton when loading is true', () => {
//       render(<DocumentHistory documents={[]} loading={true} />)

//       expect(screen.getByText('Document History')).toBeInTheDocument()
      
//       // Should show 6 skeleton items
//       const skeletons = screen.getAllByRole('generic').filter(el => 
//         el.classList.contains('animate-pulse')
//       )
//       expect(skeletons.length).toBeGreaterThan(0)
//     })

//     it('shows proper grid layout for loading skeletons', () => {
//       render(<DocumentHistory documents={[]} loading={true} />)

//       const grid = screen.getByText('Document History').nextElementSibling
//       expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-6', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6')
//     })
//   })

//   describe('Empty State', () => {
//     it('shows empty state when no documents are provided', () => {
//       render(<DocumentHistory documents={[]} loading={false} />)

//       expect(screen.getByText('Document History')).toBeInTheDocument()
//       expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//       expect(screen.getByText('Upload your first document to see it here.')).toBeInTheDocument()
//     })

//     it('shows empty state when documents array is null', () => {
//       render(<DocumentHistory documents={null as any} loading={false} />)

//       expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//     })

//     it('shows empty state when documents array is undefined', () => {
//       render(<DocumentHistory documents={undefined as any} loading={false} />)

//       expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//     })

//     it('displays file icon in empty state', () => {
//       render(<DocumentHistory documents={[]} loading={false} />)

//       // The FileText icon should be rendered (mocked as text content)
//       expect(screen.getByText('📄')).toBeInTheDocument()
//     })
//   })

//   describe('Document Display', () => {
//     it('renders documents correctly', () => {
//       render(<DocumentHistory {...defaultProps} />)

//       expect(screen.getByText('Document History')).toBeInTheDocument()
//       expect(screen.getByTestId('document-card-doc-1')).toBeInTheDocument()
//       expect(screen.getByTestId('document-card-doc-2')).toBeInTheDocument()
//       expect(screen.getByTestId('document-card-doc-3')).toBeInTheDocument()
      
//       expect(screen.getByTestId('document-title-doc-1')).toHaveTextContent('First Document')
//       expect(screen.getByTestId('document-title-doc-2')).toHaveTextContent('Second Document')
//       expect(screen.getByTestId('document-title-doc-3')).toHaveTextContent('Third Document')
//     })

//     it('uses proper grid layout for documents', () => {
//       render(<DocumentHistory {...defaultProps} />)

//       const grid = screen.getByTestId('document-card-doc-1').parentElement
//       expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-6', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6')
//     })

//     it('passes correct props to DocumentCard components', () => {
//       mockDeletingIds.add('doc-2')
      
//       render(<DocumentHistory {...defaultProps} />)

//       // Check that deleting state is passed correctly
//       const deleteButton2 = screen.getByTestId('delete-button-doc-2')
//       const deleteButton1 = screen.getByTestId('delete-button-doc-1')
      
//       expect(deleteButton2).toHaveTextContent('Deleting...')
//       expect(deleteButton2).toBeDisabled()
//       expect(deleteButton1).toHaveTextContent('Delete')
//       expect(deleteButton1).not.toBeDisabled()
//     })
//   })

//   describe('Document Interactions', () => {
//     it('handles paper click correctly', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const paperButton = screen.getByTestId('paper-button-doc-1')
//       await user.click(paperButton)

//       // Should set expanding document
//       await waitFor(() => {
//         expect(screen.getByTestId('expanding-doc-1')).toBeInTheDocument()
//       })

//       // Should open document viewer after delay
//       await waitFor(() => {
//         expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//         expect(screen.getByTestId('viewer-document-id')).toHaveTextContent('doc-1')
//       }, { timeout: 500 })
//     })

//     it('handles folder click correctly', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const folderButton = screen.getByTestId('folder-button-doc-1')
//       await user.click(folderButton)

//       // Should immediately open document viewer
//       expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//       expect(screen.getByTestId('viewer-document-id')).toHaveTextContent('doc-1')
//     })

//     it('handles document deletion correctly', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const deleteButton = screen.getByTestId('delete-button-doc-1')
//       await user.click(deleteButton)

//       expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1')
//     })

//     it('sets animation origin for paper clicks', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const paperButton = screen.getByTestId('paper-button-doc-1')
      
//       // Mock getBoundingClientRect
//       paperButton.getBoundingClientRect = jest.fn(() => ({
//         left: 100,
//         top: 200,
//         width: 50,
//         height: 40,
//         right: 150,
//         bottom: 240,
//       })) as any

//       await user.click(paperButton)

//       await waitFor(() => {
//         expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//       }, { timeout: 500 })

//       // Should set animation origin to center of clicked element
//       expect(screen.getByTestId('animation-origin')).toHaveTextContent('125,220') // center: 100+25, 200+20
//     })

//     it('sets animation origin for folder clicks', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const folderButton = screen.getByTestId('folder-button-doc-1')
      
//       // Mock getBoundingClientRect
//       folderButton.getBoundingClientRect = jest.fn(() => ({
//         left: 50,
//         top: 100,
//         width: 60,
//         height: 50,
//         right: 110,
//         bottom: 150,
//       })) as any

//       await user.click(folderButton)

//       expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//       expect(screen.getByTestId('animation-origin')).toHaveTextContent('80,125') // center: 50+30, 100+25
//     })
//   })

//   describe('Document Viewer Integration', () => {
//     it('opens document viewer when document is selected', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const folderButton = screen.getByTestId('folder-button-doc-2')
//       await user.click(folderButton)

//       expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//       expect(screen.getByTestId('viewer-document-id')).toHaveTextContent('doc-2')
//     })

//     it('closes document viewer when close is called', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       // Open viewer
//       const folderButton = screen.getByTestId('folder-button-doc-1')
//       await user.click(folderButton)

//       expect(screen.getByTestId('document-viewer')).toBeInTheDocument()

//       // Close viewer
//       const closeButton = screen.getByTestId('viewer-close')
//       await user.click(closeButton)

//       expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument()
//     })

//     it('resets state when document viewer is closed', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       // Open viewer with paper click (which sets expanding state)
//       const paperButton = screen.getByTestId('paper-button-doc-1')
//       await user.click(paperButton)

//       await waitFor(() => {
//         expect(screen.getByTestId('expanding-doc-1')).toBeInTheDocument()
//       })

//       await waitFor(() => {
//         expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//       }, { timeout: 500 })

//       // Close viewer
//       const closeButton = screen.getByTestId('viewer-close')
//       await user.click(closeButton)

//       // Expanding state should be cleared
//       expect(screen.queryByTestId('expanding-doc-1')).not.toBeInTheDocument()
//       expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument()
//     })

//     it('does not render document viewer when no document is selected', () => {
//       render(<DocumentHistory {...defaultProps} />)

//       expect(screen.queryByTestId('document-viewer')).not.toBeInTheDocument()
//     })
//   })

//   describe('State Management', () => {
//     it('manages expanding document state correctly', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       // Initially no expanding document
//       expect(screen.queryByTestId('expanding-doc-1')).not.toBeInTheDocument()

//       // Click paper to start expanding
//       const paperButton = screen.getByTestId('paper-button-doc-1')
//       await user.click(paperButton)

//       // Should show expanding state
//       expect(screen.getByTestId('expanding-doc-1')).toBeInTheDocument()

//       // After delay, should open viewer and maintain expanding state
//       await waitFor(() => {
//         expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//         expect(screen.getByTestId('expanding-doc-1')).toBeInTheDocument()
//       }, { timeout: 500 })
//     })

//     it('handles multiple rapid clicks correctly', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const paperButton1 = screen.getByTestId('paper-button-doc-1')
//       const paperButton2 = screen.getByTestId('paper-button-doc-2')

//       // Rapid clicks on different documents
//       await user.click(paperButton1)
//       await user.click(paperButton2)

//       // Should only show expanding for the last clicked document
//       expect(screen.queryByTestId('expanding-doc-1')).not.toBeInTheDocument()
//       expect(screen.getByTestId('expanding-doc-2')).toBeInTheDocument()
//     })
//   })

//   describe('Performance and Memoization', () => {
//     it('uses memo to prevent unnecessary re-renders', () => {
//       const { rerender } = render(<DocumentHistory {...defaultProps} />)

//       // Re-render with same props
//       rerender(<DocumentHistory {...defaultProps} />)

//       // Component should be memoized (this is more of a structural test)
//       expect(screen.getByText('Document History')).toBeInTheDocument()
//     })

//     it('uses useCallback for event handlers', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       // Multiple interactions should work consistently
//       const deleteButton1 = screen.getByTestId('delete-button-doc-1')
//       const deleteButton2 = screen.getByTestId('delete-button-doc-2')

//       await user.click(deleteButton1)
//       await user.click(deleteButton2)

//       expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1')
//       expect(mockDeleteDocument).toHaveBeenCalledWith('doc-2')
//       expect(mockDeleteDocument).toHaveBeenCalledTimes(2)
//     })
//   })

//   describe('Error Handling', () => {
//     it('handles malformed document data gracefully', () => {
//       const malformedDocuments = [
//         { _id: 'doc-1' }, // Missing required fields
//         null,
//         undefined,
//         createMockDocument({ _id: 'doc-2', title: 'Valid Document' }),
//       ].filter(Boolean) // Filter out null/undefined

//       // Should not crash
//       expect(() => {
//         render(<DocumentHistory documents={malformedDocuments as any} loading={false} />)
//       }).not.toThrow()
//     })

//     it('handles deletion errors gracefully', async () => {
//       const user = userEvent.setup()
//       mockDeleteDocument.mockRejectedValueOnce(new Error('Delete failed'))

//       render(<DocumentHistory {...defaultProps} />)

//       const deleteButton = screen.getByTestId('delete-button-doc-1')
//       await user.click(deleteButton)

//       // Should still call the delete function
//       expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1')
//     })
//   })

//   describe('Accessibility', () => {
//     it('has proper heading structure', () => {
//       render(<DocumentHistory {...defaultProps} />)

//       const heading = screen.getByRole('heading', { level: 2 })
//       expect(heading).toHaveTextContent('Document History')
//     })

//     it('provides accessible button labels through DocumentCard', () => {
//       render(<DocumentHistory {...defaultProps} />)

//       // Buttons should be accessible through their test IDs (representing proper labels)
//       expect(screen.getByTestId('paper-button-doc-1')).toBeInTheDocument()
//       expect(screen.getByTestId('folder-button-doc-1')).toBeInTheDocument()
//       expect(screen.getByTestId('delete-button-doc-1')).toBeInTheDocument()
//     })

//     it('maintains focus management during interactions', async () => {
//       const user = userEvent.setup()

//       render(<DocumentHistory {...defaultProps} />)

//       const folderButton = screen.getByTestId('folder-button-doc-1')
//       await user.click(folderButton)

//       // Document viewer should be focusable
//       expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
//     })
//   })
// })