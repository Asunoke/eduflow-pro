import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  photo?: string;
  onPhotoChange: (photo: string | undefined) => void;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function PhotoUpload({ photo, onPhotoChange, fallback, size = 'md', className }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return; // Max 2MB
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onPhotoChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], 'border-2 border-border')}>
          <AvatarImage src={photo} alt="Photo" className="object-cover" />
          <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => onPhotoChange(undefined)}
            className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => inputRef.current?.click()}
      >
        {photo ? 'Changer la photo' : 'Ajouter une photo'}
      </Button>
    </div>
  );
}
