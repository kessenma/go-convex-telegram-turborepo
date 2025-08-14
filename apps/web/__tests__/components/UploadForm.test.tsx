// import React from 'react'
// import { screen, fireEvent, waitFor } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { toast } from 'sonner'
// import { render, createMockFile } from '../utils/test-utils'
// import { UploadForm } from '../../components/rag/UploadForm'

// // Mock react-dropzone
// const mockUseDropzone = jest.fn()
// jest.mock('react-dropzone', () => ({
//   useDropzone: mockUseDropzone,
// }))

// describe('UploadForm', () => {
//   const defaultProps = {
//     uploadMethod: 'file' as const,
//     setUploadMethod: jest.fn(),
//     title: '',
//     setTitle: jest.fn(),
//     summary: '',
//     setSummary: jest.fn(),
//     textContent: '',
//     setTextContent: jest.fn(),
//     isUploading: false,
//     uploadStatus: 'idle' as const,
//     uploadMessage: '',
//     handleFileUpload: jest.fn(),
//     handleBatchFileUpload: jest.fn(),
//     handleTextUpload: jest.fn(),
//     isGeneratingEmbeddings: false,
//     handleGenerateEmbeddings: jest.fn(),
//     embeddingMessage: '',
//   }

//   beforeEach(() => {
//     jest.clearAllMocks()
//     mockUseDropzone.mockReturnValue({
//       getRootProps: () => ({ 'data-testid': 'dropzone' }),
//       getInputProps: () => ({ 'data-testid': 'file-input' }),
//       isDragActive: false,
//     })
//   })

//   describe('File Upload Mode', () => {
//     it('renders file upload interface correctly', () => {
//       render(<UploadForm {...defaultProps} />)
      
//       expect(screen.getByText('Choose Upload Method')).toBeInTheDocument()
//       expect(screen.getByText('Upload')).toBeInTheDocument()
//       expect(screen.getByText('Paste')).toBeInTheDocument()
//       expect(screen.getByTestId('dropzone')).toBeInTheDocument()
//       expect(screen.getByText('Drop your files here or click to browse')).toBeInTheDocument()
//     })

//     it('handles single file upload correctly', async () => {
//       const mockFile = createMockFile('test.txt', 'test content')
//       const handleFileUpload = jest.fn()
//       const setTitle = jest.fn()

//       mockUseDropzone.mockReturnValue({
//         getRootProps: () => ({ 'data-testid': 'dropzone' }),
//         getInputProps: () => ({ 'data-testid': 'file-input' }),
//         isDragActive: false,
//       })

//       render(
//         <UploadForm 
//           {...defaultProps} 
//           handleFileUpload={handleFileUpload}
//           setTitle={setTitle}
//         />
//       )

//       // Simulate file drop
//       const dropzone = screen.getByTestId('dropzone')
//       const mockOnDrop = mockUseDropzone.mock.calls[0][0].onDrop
      
//       mockOnDrop([mockFile])

//       expect(setTitle).toHaveBeenCalledWith('test')
//       expect(handleFileUpload).toHaveBeenCalledWith(mockFile)
//     })

//     it('handles multiple file upload correctly', async () => {
//       const mockFiles = [
//         createMockFile('test1.txt', 'content 1'),
//         createMockFile('test2.txt', 'content 2'),
//       ]
//       const handleBatchFileUpload = jest.fn()
//       const setTitle = jest.fn()

//       render(
//         <UploadForm 
//           {...defaultProps} 
//           handleBatchFileUpload={handleBatchFileUpload}
//           setTitle={setTitle}
//         />
//       )

//       // Simulate multiple file drop
//       const mockOnDrop = mockUseDropzone.mock.calls[0][0].onDrop
//       mockOnDrop(mockFiles)

//       expect(setTitle).toHaveBeenCalledWith('2 files selected')
//       expect(handleBatchFileUpload).toHaveBeenCalledWith(mockFiles)
//     })

//     it('shows loading state during upload', () => {
//       render(<UploadForm {...defaultProps} isUploading={true} />)
      
//       expect(screen.getByText('Uploading...')).toBeInTheDocument()
//       expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled()
//     })
//   })

//   describe('Text Upload Mode', () => {
//     const textProps = {
//       ...defaultProps,
//       uploadMethod: 'text' as const,
//       title: 'Test Title',
//       textContent: 'Test content for upload',
//     }

//     it('renders text upload interface correctly', () => {
//       render(<UploadForm {...textProps} />)
      
//       expect(screen.getByLabelText(/content/i)).toBeInTheDocument()
//       expect(screen.getByDisplayValue('Test content for upload')).toBeInTheDocument()
//       expect(screen.getByRole('button', { name: /upload text/i })).toBeInTheDocument()
//     })

//     it('handles text upload correctly', async () => {
//       const user = userEvent.setup()
//       const handleTextUpload = jest.fn()

//       render(
//         <UploadForm 
//           {...textProps} 
//           handleTextUpload={handleTextUpload}
//         />
//       )

//       const uploadButton = screen.getByRole('button', { name: /upload text/i })
//       await user.click(uploadButton)

//       expect(handleTextUpload).toHaveBeenCalled()
//     })

//     it('disables upload button when required fields are missing', () => {
//       render(
//         <UploadForm 
//           {...defaultProps} 
//           uploadMethod="text"
//           title=""
//           textContent=""
//         />
//       )

//       const uploadButton = screen.getByRole('button', { name: /upload text/i })
//       expect(uploadButton).toBeDisabled()
//     })

//     it('enables upload button when all required fields are filled', () => {
//       render(
//         <UploadForm 
//           {...defaultProps} 
//           uploadMethod="text"
//           title="Test Title"
//           textContent="Test content"
//         />
//       )

//       const uploadButton = screen.getByRole('button', { name: /upload text/i })
//       expect(uploadButton).not.toBeDisabled()
//     })
//   })

//   describe('Upload Status and Notifications', () => {
//     it('shows success toast on successful upload', () => {
//       const { rerender } = render(
//         <UploadForm {...defaultProps} uploadStatus="idle" />
//       )

//       // Simulate status change to success
//       rerender(
//         <UploadForm 
//           {...defaultProps} 
//           uploadStatus="success" 
//           uploadMessage="Upload successful!"
//         />
//       )

//       expect(toast.success).toHaveBeenCalledWith('Upload successful!')
//     })

//     it('shows error toast on upload failure', () => {
//       const { rerender } = render(
//         <UploadForm {...defaultProps} uploadStatus="idle" />
//       )

//       // Simulate status change to error
//       rerender(
//         <UploadForm 
//           {...defaultProps} 
//           uploadStatus="error" 
//           uploadMessage="Upload failed!"
//         />
//       )

//       expect(toast.error).toHaveBeenCalledWith('Upload failed!')
//     })

//     it('displays status banner for success', () => {
//       render(
//         <UploadForm 
//           {...defaultProps} 
//           uploadStatus="success" 
//           uploadMessage="Upload successful!"
//         />
//       )

//       expect(screen.getByText('Upload successful!')).toBeInTheDocument()
//     })

//     it('displays status banner for error', () => {
//       render(
//         <UploadForm 
//           {...defaultProps} 
//           uploadStatus="error" 
//           uploadMessage="Upload failed!"
//         />
//       )

//       expect(screen.getByText('Upload failed!')).toBeInTheDocument()
//     })
//   })

//   describe('Form Validation', () => {
//     it('updates title field correctly', async () => {
//       const user = userEvent.setup()
//       const setTitle = jest.fn()

//       render(<UploadForm {...defaultProps} setTitle={setTitle} />)

//       const titleInput = screen.getByLabelText(/title/i)
//       await user.type(titleInput, 'New Title')

//       expect(setTitle).toHaveBeenCalledWith('New Title')
//     })

//     it('updates summary field correctly', async () => {
//       const user = userEvent.setup()
//       const setSummary = jest.fn()

//       render(<UploadForm {...defaultProps} setSummary={setSummary} />)

//       const summaryInput = screen.getByLabelText(/summary/i)
//       await user.type(summaryInput, 'New Summary')

//       expect(setSummary).toHaveBeenCalledWith('New Summary')
//     })

//     it('switches between upload methods correctly', async () => {
//       const user = userEvent.setup()
//       const setUploadMethod = jest.fn()

//       render(<UploadForm {...defaultProps} setUploadMethod={setUploadMethod} />)

//       const pasteTab = screen.getByText('Paste')
//       await user.click(pasteTab)

//       expect(setUploadMethod).toHaveBeenCalledWith('text')
//     })
//   })

//   describe('Accessibility', () => {
//     it('has proper ARIA labels and roles', () => {
//       render(<UploadForm {...defaultProps} />)

//       expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
//       expect(screen.getByLabelText(/summary/i)).toBeInTheDocument()
//       expect(screen.getByRole('button', { name: /choose files/i })).toBeInTheDocument()
//     })

//     it('shows required field indicators', () => {
//       render(<UploadForm {...defaultProps} uploadMethod="text" />)

//       expect(screen.getByText('*')).toBeInTheDocument() // Required indicator
//     })
//   })
// })