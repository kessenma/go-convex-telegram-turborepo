# Mobile App Dependencies Setup

## Required Dependencies for File Upload Functionality

To enable the file upload functionality in the mobile app, you need to install the following dependencies:

### 1. Install Dependencies

```bash
cd apps/mobile
npm install react-native-fs react-native-document-picker
```

### 2. iOS Setup (if targeting iOS)

For iOS, you need to add permissions to `ios/mobile/Info.plist`:

```xml
<key>NSDocumentPickerUsageDescription</key>
<string>This app needs access to documents to upload files to RAG system</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select documents</string>
```

Then run:
```bash
cd ios && pod install && cd ..
```

### 3. Android Setup

For Android, the permissions are already handled by the libraries, but you may need to add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 4. Metro Configuration

Make sure your `metro.config.js` includes the necessary resolver settings for the new dependencies.

## Features Implemented

1. **Real File Selection**: Uses `react-native-document-picker` to select actual files from device
2. **Local Storage**: Files are saved to device's document directory using `react-native-fs`
3. **Dual Upload Options**: 
   - Save to Device (for offline LLM)
   - Upload to Convex (for cloud sync)
4. **Permission Handling**: Proper Android permission requests
5. **File Management**: View selected files, remove files, and track upload progress

## File Storage Location

Files uploaded to device are stored in:
- iOS: `Documents/rag_documents/`
- Android: `Documents/rag_documents/`

You can access these files later for your offline LLM processing.