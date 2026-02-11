import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File as FileIcon, 
  Trash2, 
  FileText,
  X,
  Paperclip,
  Sparkles
} from 'lucide-react';
import { useUserFiles, useUploadUserFile, useDeleteUserFile } from '../hooks/useUserFiles';
import { cn } from '../lib/utils';

interface FileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachFile?: (fileId: number, filepath: string, filename: string, size: number) => void;
  onSelectForAI?: (fileId: number) => void;
}

export function FileManager({ 
  isOpen, 
  onClose, 
  onAttachFile,
  onSelectForAI 
}: FileManagerProps) {
  const [fileType, setFileType] = useState('document');
  
  const { data: userFiles = [], isLoading } = useUserFiles();
  const uploadMutation = useUploadUserFile();
  const deleteMutation = useDeleteUserFile();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(file => {
        uploadMutation.mutate({ file, fileType });
      });
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">My Files</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6 border-b">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">
              Upload resumes, templates, or any documents you frequently use
            </p>
          </div>

          {/* File Type Selection */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFileType('resume')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                fileType === 'resume' ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}
            >
              Resume
            </button>
            <button
              onClick={() => setFileType('template')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                fileType === 'template' ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}
            >
              Template
            </button>
            <button
              onClick={() => setFileType('document')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                fileType === 'document' ? "bg-primary text-primary-foreground" : "bg-secondary"
              )}
            >
              Document
            </button>
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : userFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No files uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {userFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.original_filename}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{file.file_type}</span>
                      <span>•</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onAttachFile && (
                      <button
                        onClick={() => {
                          onAttachFile(file.id, file.filepath, file.original_filename, file.size);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        title="Attach to email"
                      >
                        <Paperclip className="w-3 h-3" />
                        Attach
                      </button>
                    )}

                    {onSelectForAI && (
                      <button
                        onClick={() => {
                          onSelectForAI(file.id);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        title="Use for AI context"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteMutation.mutate(file.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-md disabled:opacity-50"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}