import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Effect to attach stream to video element when it becomes available
  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      onImageSelected(base64, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      let mediaStream: MediaStream;
      try {
        // Try to get the environment (rear) camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err) {
        // Fallback to any available camera if environment constraint fails
        console.warn("Could not access environment camera, trying default:", err);
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }
      
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        stopCamera();
        onImageSelected(base64, 'image/jpeg');
      }
    }
  };

  return (
    <div className="w-full">
      {isCameraOpen ? (
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             className="w-full h-full object-cover"
           />
           <canvas ref={canvasRef} className="hidden" />
           
           <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
             <button 
               onClick={stopCamera}
               className="p-3 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition backdrop-blur-sm"
               title="Close Camera"
             >
               <X size={24} />
             </button>
             <button 
               onClick={capturePhoto}
               className="p-4 bg-white text-indigo-600 rounded-full hover:bg-gray-100 transition ring-4 ring-indigo-500/30 shadow-lg"
               title="Capture Photo"
             >
               <Camera size={28} />
             </button>
           </div>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Upload size={32} />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Product Photo</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Drag and drop your image here, or choose an option below
          </p>
          
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              Browse Files
            </button>
            <span className="text-gray-400 flex items-center text-sm font-medium">OR</span>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
            >
              <Camera size={16} /> Take Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;