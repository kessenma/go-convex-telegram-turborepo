// import React from 'react'
// import { screen, fireEvent } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { toast } from 'sonner'
// import { render, createMockFile } from '../utils/test-utils'
// import { UploadForm } from '../../components/rag/UploadForm'

// // Mock react-dropzone
// jest.mock('react-dropzone', () => ({
//     useDropzone: jest.fn(),
// }))

// // Mock moving-border component
// jest.mock('../../components/ui/moving-border', () => ({
//     Button: ({ children, containerClassName, borderClassName, ...props }: any) =>
//         <button {...props}>{children}</button>,
// }))

// // Mock sticky-banner component
// jest.mock('../../components/ui/sticky-banner', () => ({
//     StickyBanner: ({ children, ...props }: any) => <div {...props}>{children}</div>,
// }))

// import { useDropzone } from 'react-dropzone'
// const mockUseDropzone = useDropzone as jest.MockedFunction<typeof useDropzone>

// describe('UploadForm - Basic Tests', () => {
//     const defaultProps = {
//         uploadMethod: 'file' as const,
//         setUploadMethod: jest.fn(),
//         title: '',
//         setTitle: jest.fn(),
//         summary: '',
//         setSummary: jest.fn(),
//         textContent: '',
//         setTextContent: jest.fn(),
//         isUploading: false,
//         uploadStatus: 'idle' as const,
//         uploadMessage: '',
//         handleFileUpload: jest.fn(),
//         handleBatchFileUpload: jest.fn(),
//         handleTextUpload: jest.fn(),
//         isGeneratingEmbeddings: false,
//         handleGenerateEmbeddings: jest.fn(),
//         embeddingMessage: '',
//     }

//     beforeEach(() => {
//         jest.clearAllMocks()
//         mockUseDropzone.mockReturnValue({
//       getRootProps: (props?: any) => ({ 'data-testid': 'dropzone', ...props }),
//       getInputProps: (props?: any) => ({ 'data-testid': 'file-input', ...props }),
//             isDragActive: false,
//     } as any)
//     })

//     it('renders upload form correctly', () => {
//         render(<UploadForm {...defaultProps} />)

//         expect(screen.getByText('Choose Upload Method')).toBeInTheDocument()
//         expect(screen.getByText('Upload')).toBeInTheDocument()
//         expect(screen.getByText('Paste')).toBeInTheDocument()
//     })

//     it('shows file upload interface in file mode', () => {
//         render(<UploadForm {...defaultProps} />)

//         expect(screen.getByTestId('dropzone')).toBeInTheDocument()
//         expect(screen.getByText('Drop your files here or click to browse')).toBeInTheDocument()
//     })

//     it('shows text upload interface in text mode', () => {
//         render(<UploadForm {...defaultProps} uploadMethod="text" />)

//         expect(screen.getByPlaceholderText('Paste your text content here...')).toBeInTheDocument()
//         expect(screen.getByRole('button', { name: /upload text/i })).toBeInTheDocument()
//     })

//     it('handles title input correctly', async () => {
//         const user = userEvent.setup()
//         const setTitle = jest.fn()

//         render(<UploadForm {...defaultProps} setTitle={setTitle} />)

//         const titleInput = screen.getByPlaceholderText('Optional: Override filename')

//         // Simulate typing by firing change event directly
//         fireEvent.change(titleInput, { target: { value: 'New Title' } })

//         expect(setTitle).toHaveBeenCalledWith('New Title')
//     })

//     it('shows loading state during upload', () => {
//         render(<UploadForm {...defaultProps} isUploading={true} />)

//         expect(screen.getByText('Uploading...')).toBeInTheDocument()
//     })

//     it('shows success message on successful upload', () => {
//         render(
//             <UploadForm
//                 {...defaultProps}
//                 uploadStatus="success"
//                 uploadMessage="Upload successful!"
//             />
//         )

//         expect(screen.getByText('Upload successful!')).toBeInTheDocument()
//     })

//     it('shows error message on upload failure', () => {
//         render(
//             <UploadForm
//                 {...defaultProps}
//                 uploadStatus="error"
//                 uploadMessage="Upload failed!"
//             />
//         )

//         expect(screen.getByText('Upload failed!')).toBeInTheDocument()
//     })

//     it('disables text upload button when fields are empty', () => {
//         render(
//             <UploadForm
//                 {...defaultProps}
//                 uploadMethod="text"
//                 title=""
//                 textContent=""
//             />
//         )

//         const uploadButton = screen.getByRole('button', { name: /upload text/i })
//         expect(uploadButton).toBeDisabled()
//     })

//     it('enables text upload button when fields are filled', () => {
//         render(
//             <UploadForm
//                 {...defaultProps}
//                 uploadMethod="text"
//                 title="Test Title"
//                 textContent="Test content"
//             />
//         )

//         const uploadButton = screen.getByRole('button', { name: /upload text/i })
//         expect(uploadButton).not.toBeDisabled()
//     })
// })