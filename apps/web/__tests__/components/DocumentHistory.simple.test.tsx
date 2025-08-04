// import React from 'react'
// import { screen, fireEvent } from '@testing-library/react'
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

// // Mock components with simple implementations
// jest.mock('../../components/rag/DocumentCard', () => {
//   return function MockDocumentCard({ document, isDeleting, onDelete }: any) {
//     return (
//       <div data-testid={`document-card-${document._id}`}>
//         <h3>{document.title}</h3>
//         <button 
//           onClick={() => onDelete(document._id)}
//           disabled={isDeleting}
//         >
//           {isDeleting ? 'Deleting...' : 'Delete'}
//         </button>
//       </div>
//     )
//   }
// })

// jest.mock('../../components/rag/DocumentViewer', () => {
//   return function MockDocumentViewer({ isOpen, onClose }: any) {
//     if (!isOpen) return null
//     return (
//       <div data-testid="document-viewer">
//         <button onClick={onClose}>Close Viewer</button>
//       </div>
//     )
//   }
// })

// describe('DocumentHistory - Basic Tests', () => {
//   const mockDocuments = [
//     createMockDocument({
//       _id: 'doc-1',
//       title: 'First Document',
//     }),
//     createMockDocument({
//       _id: 'doc-2',
//       title: 'Second Document',
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

//   it('renders document history correctly', () => {
//     render(<DocumentHistory {...defaultProps} />)

//     expect(screen.getByText('Document History')).toBeInTheDocument()
//     expect(screen.getByText('First Document')).toBeInTheDocument()
//     expect(screen.getByText('Second Document')).toBeInTheDocument()
//   })

//   it('shows loading state', () => {
//     render(<DocumentHistory documents={[]} loading={true} />)

//     expect(screen.getByText('Document History')).toBeInTheDocument()
    
//     // Should show loading skeletons
//     const skeletons = screen.getAllByRole('generic').filter(el => 
//       el.classList.contains('animate-pulse')
//     )
//     expect(skeletons.length).toBeGreaterThan(0)
//   })

//   it('shows empty state when no documents', () => {
//     render(<DocumentHistory documents={[]} loading={false} />)

//     expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//     expect(screen.getByText('Upload your first document to see it here.')).toBeInTheDocument()
//   })

//   it('handles document deletion', async () => {
//     const user = userEvent.setup()

//     render(<DocumentHistory {...defaultProps} />)

//     const deleteButton = screen.getAllByText('Delete')[0]
//     await user.click(deleteButton)

//     expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1')
//   })

//   it('shows deleting state for documents being deleted', () => {
//     mockDeletingIds.add('doc-1')

//     render(<DocumentHistory {...defaultProps} />)

//     expect(screen.getByText('Deleting...')).toBeInTheDocument()
    
//     const deletingButton = screen.getByText('Deleting...')
//     expect(deletingButton).toBeDisabled()
//   })

//   it('renders document cards for each document', () => {
//     render(<DocumentHistory {...defaultProps} />)

//     expect(screen.getByTestId('document-card-doc-1')).toBeInTheDocument()
//     expect(screen.getByTestId('document-card-doc-2')).toBeInTheDocument()
//   })

//   it('handles null documents gracefully', () => {
//     render(<DocumentHistory documents={null as any} loading={false} />)

//     expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//   })

//   it('handles undefined documents gracefully', () => {
//     render(<DocumentHistory documents={undefined as any} loading={false} />)

//     expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//   })

//   it('uses proper grid layout', () => {
//     render(<DocumentHistory {...defaultProps} />)

//     const grid = screen.getByTestId('document-card-doc-1').parentElement
//     expect(grid).toHaveClass('grid')
//   })

//   it('shows proper heading structure', () => {
//     render(<DocumentHistory {...defaultProps} />)

//     const heading = screen.getByRole('heading', { level: 2 })
//     expect(heading).toHaveTextContent('Document History')
//   })

//   it('handles empty array of documents', () => {
//     render(<DocumentHistory documents={[]} loading={false} />)

//     expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument()
//     expect(screen.queryByTestId('document-card-doc-1')).not.toBeInTheDocument()
//   })
// })