import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { X, Check, RotateCcw } from 'lucide-react';

interface ImageCropperModalProps {
  image: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void | Promise<void>;
  aspect?: number;
}

type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const ASPECT_RATIOS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];

export const ImageCropperModal = ({
  image,
  onClose,
  onCropComplete,
  aspect = undefined
}: ImageCropperModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentAspect, setCurrentAspect] = useState(aspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  const onCropChange = (nextCrop: { x: number; y: number }) => setCrop(nextCrop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteInternal = useCallback((_croppedArea: unknown, nextCroppedAreaPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const handleDone = async () => {
    try {
      if (!croppedAreaPixels) return;

      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const cropWidth = Math.max(1, Math.round(croppedAreaPixels.width));
      const cropHeight = Math.max(1, Math.round(croppedAreaPixels.height));

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          Promise.resolve(onCropComplete(blob))
            .then(() => {
              onClose();
            })
            .catch((error) => {
              console.error(error);
            });
        }
      }, 'image/jpeg', 0.90);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-ink/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border border-sand/30"
      >
        <div className="px-10 py-8 border-b border-sand/20 flex justify-between items-center bg-warm/10">
           <div>
              <h3 className="text-xl font-serif font-bold italic text-ink">Scale & Precision</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted/30">PNetAI Atelier Asset Engine</p>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-warm rounded-2xl transition">
              <X className="w-6 h-6 text-muted" />
           </button>
        </div>

        <div className="relative h-[450px] bg-warm/5">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={currentAspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            classes={{
                containerClassName: "bg-transparent",
                mediaClassName: "max-h-[80%]",
            }}
          />
        </div>

        <div className="p-10 bg-white border-t border-sand/10 space-y-6">
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Crop Aspect</label>
              <div className="flex gap-2 flex-wrap">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.label}
                    onClick={() => setCurrentAspect(ratio.value)}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      currentAspect === ratio.value
                        ? 'bg-ink text-white shadow-md'
                        : 'bg-warm border border-sand text-muted hover:border-caramel'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex items-center gap-6">
              <RotateCcw className="w-4 h-4 text-muted/20" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-caramel h-1 bg-warm rounded-full appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-black text-ink w-8">{(zoom * 100).toFixed(0)}%</span>
           </div>

           <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-5 rounded-full border border-sand font-bold text-xs uppercase tracking-widest hover:bg-warm transition text-muted"
              >
                Cancel Processing
              </button>
              <button
                onClick={handleDone}
                className="flex-[2] py-5 rounded-full bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-caramel transition shadow-xl flex items-center justify-center gap-3"
              >
                <Check className="w-4 h-4" />
                Commit Digital Asset
              </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
