'use client';

type AttachmentPreviewProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function AttachmentPreview({ files, onRemove }: AttachmentPreviewProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs'
        >
          <span className='line-clamp-1 max-w-[170px]'>{file.name}</span>
          <button
            type='button'
            className='text-red-600 hover:text-red-700'
            onClick={() => onRemove(index)}
          >
            <span className='material-symbols-outlined text-[16px]'>close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
