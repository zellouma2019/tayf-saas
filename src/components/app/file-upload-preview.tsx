"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, Image, File, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItem {
  name: string;
  size: number;
  type: string;
  progress: number;
}

interface FileUploadPreviewProps {
  files: FileItem[];
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
  maxSize?: number;
}

function getFileIcon(type: string) {
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-rose-500" />;
  if (type.includes("image") || type.includes("jpg") || type.includes("png")) return <Image className="h-5 w-5 text-sky-500" />;
  if (type.includes("doc") || type.includes("word")) return <FileText className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-zinc-500" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getSizeColor(bytes: number, maxSize: number): string {
  const ratio = bytes / maxSize;
  if (ratio > 0.9) return "text-rose-600 bg-rose-100 dark:bg-rose-900/30";
  if (ratio > 0.6) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
  return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30";
}

export function FileUploadPreview({
  files, onUpload, onRemove, maxSize = 10485760,
}: FileUploadPreviewProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragOver(true);
    else if (e.type === "dragleave") setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files);
  }, [onUpload]);

  return (
    <div className="space-y-3" dir="rtl">
      {/* منطقة الرفع */}
      <div
        ref={dropRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "upload-dropzone-active relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ai,.psd"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) onUpload(e.target.files); e.target.value = ""; }}
        />
        <Upload className={cn("h-8 w-8 mx-auto mb-2", isDragOver ? "text-primary" : "text-muted-foreground")} />
        <p className="text-sm font-medium text-foreground">اسحب الملفات هنا أو انقر للرفع</p>
        <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, JPG, PNG — حتى {formatSize(maxSize)}</p>
      </div>

      {/* قائمة الملفات */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="file-list space-y-2"
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="file-list-item flex items-center gap-3 p-3 rounded-xl border border-border bg-card group"
              >
                <div className="file-type-icon w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("file-size-badge text-[10px] px-1.5 py-0.5 rounded-full font-medium", getSizeColor(file.size, maxSize))}>
                      {formatSize(file.size)}
                    </span>
                    {file.progress < 100 && (
                      <div className="upload-progress flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                    {file.progress >= 100 && (
                      <span className="text-[10px] text-emerald-500 font-medium">✓ جاهز</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30"
                >
                  <X className="h-4 w-4 text-rose-500" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ملخص */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>{files.length} ملف</span>
          <span>الإجمالي: {formatSize(files.reduce((s, f) => s + f.size, 0))}</span>
        </div>
      )}
    </div>
  );
}
