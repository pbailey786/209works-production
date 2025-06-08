# Supabase Setup for 209 Works

## 🚀 Quick Setup Guide

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `209-works`
5. Enter database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

### 2. Get Environment Variables

Once your project is created, go to **Settings** → **API**:

```bash
# Add these to your Netlify environment variables:

# Supabase URL (from API settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key (from API settings)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role Key (from API settings - keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click "Create a new bucket"
3. Name: `uploads`
4. Make it **Public** (so resume files can be accessed)
5. Click "Create bucket"

### 4. Set Storage Policies

In the Storage section, click on your `uploads` bucket, then go to **Policies**:

#### Allow Public Read Access:
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');
```

#### Allow Authenticated Upload:
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
```

#### Allow Users to Update Their Own Files:
```sql
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Test the Setup

Once deployed, the resume parsing will:
- ✅ Upload files to Supabase Storage
- ✅ Support multiple file formats (DOCX, PDF, images, etc.)
- ✅ Extract text using AI
- ✅ Store parsed data in your database

### 6. File Organization

Files will be stored in this structure:
```
uploads/
  resumes/
    user-id_timestamp.docx
    user-id_timestamp.pdf
    user-id_timestamp.jpg
```

### 7. Troubleshooting

**If file uploads fail:**
1. Check that all environment variables are set in Netlify
2. Verify the storage bucket exists and is public
3. Check storage policies are correctly set
4. Look at the browser console for detailed error messages

**If text extraction fails:**
- DOCX/DOC files: Should work immediately
- PDF files: Requires `pdf-parse` package (may need manual installation)
- Images: Requires `tesseract.js` for OCR (may need manual installation)
- TXT/RTF: Should work immediately

### 8. Optional: Install Additional Packages

For full file format support, you may need to install:

```bash
npm install pdf-parse tesseract.js
```

These packages are large and may cause build issues, so they're loaded dynamically and will gracefully fall back if not available.
