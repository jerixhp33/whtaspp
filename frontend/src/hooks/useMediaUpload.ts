import { useState } from 'react';

export const useMediaUpload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const upload = async (_file: File) => {
    setIsUploading(true);
    // mock upload
    setProgress(100);
    setIsUploading(false);
  };
  
  return { upload, progress, isUploading };
};
