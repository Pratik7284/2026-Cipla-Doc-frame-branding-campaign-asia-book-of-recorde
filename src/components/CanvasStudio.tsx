/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, ZoomIn, ZoomOut, CheckCircle, Download, Move } from 'lucide-react';
import { Doctor, CampaignFrame } from '../types';
import { CAMPAIGN_FRAMES } from '../data/frames';

interface CanvasStudioProps {
  doctor: Partial<Doctor>;
  selectedFrameId: string;
  photoFile: File | null;
  photoUrl: string; // If already existing (like in editing) or base64
  onCreativeGenerated: (creativeBase64: string) => void;
  onDownloaded?: () => void;
  readOnly?: boolean;
}

export default function CanvasStudio({
  doctor,
  selectedFrameId,
  photoFile,
  photoUrl,
  onCreativeGenerated,
  onDownloaded,
  readOnly = false
}: CanvasStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [frameLogoImg, setFrameLogoImg] = useState<HTMLImageElement | null>(null);
  
  // Controls for adjusting doctor photo inside frame area
  const [zoom, setZoom] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // Load the selected campaign frame metadata
  const activeFrame = CAMPAIGN_FRAMES.find(f => f.id === selectedFrameId) || CAMPAIGN_FRAMES[0];

  // Load doctor photo when photoUrl or photoFile changes
  useEffect(() => {
    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setPhotoImage(img);
        setOffsetX(0);
        setOffsetY(0);
        setZoom(1.0);
      };
      img.src = photoUrl;
    } else {
      setPhotoImage(null);
    }
  }, [photoUrl]);

  // Handle canvas drawing & generation
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Output dimension: 1080 x 1350 px (3:4 ratio)
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // 1. Clear background to white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // 2. Draw Maroon Corner Accents (CIPLA Theme Corner Triangles)
    // Top-Right triangle
    ctx.fillStyle = '#7A1512';
    ctx.beginPath();
    ctx.moveTo(W - 140, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 140);
    ctx.closePath();
    ctx.fill();

    // Bottom-Left triangle
    ctx.fillStyle = '#7A1512';
    ctx.beginPath();
    ctx.moveTo(0, H - 140);
    ctx.lineTo(0, H);
    ctx.lineTo(140, H);
    ctx.closePath();
    ctx.fill();

    // Fine inner border lines around the layout
    ctx.strokeStyle = 'rgba(122, 21, 18, 0.15)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // 3. Draw Doctor Photo Container (Center Top area: 880w x 780h)
    const photoArea = {
      x: 100,
      y: 105,
      w: 880,
      h: 780
    };

    // Fill placeholder if no image loaded
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);

    if (photoImage) {
      // Draw zoomed/panned doctor photo inside a clipped area which matches the frame
      ctx.save();
      // Clip to photo area boundary
      ctx.beginPath();
      ctx.rect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
      ctx.clip();

      // Calculate placement maintains aspect ratio
      const imgRatio = photoImage.width / photoImage.height;
      const areaRatio = photoArea.w / photoArea.h;
      
      let renderW = photoArea.w;
      let renderH = photoArea.h;
      
      if (imgRatio > areaRatio) {
        renderH = photoArea.w / imgRatio;
      } else {
        renderW = photoArea.h * imgRatio;
      }

      // Scaling factor
      renderW *= zoom;
      renderH *= zoom;

      // Centered positions
      const defaultX = photoArea.x + (photoArea.w - renderW) / 2;
      const defaultY = photoArea.y + (photoArea.h - renderH) / 2;

      ctx.drawImage(
        photoImage,
        defaultX + offsetX,
        defaultY + offsetY,
        renderW,
        renderH
      );
      ctx.restore();
    } else {
      // Draw clinical placeholder text & logo
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DOCTOR PHOTO', W / 2, photoArea.y + photoArea.h / 2 - 30);
      ctx.font = '24px sans-serif';
      ctx.fillText('(Drag to align, scroll to zoom)', W / 2, photoArea.y + photoArea.h / 2 + 20);
    }

    // Draw clean frame outline around the photo
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 16;
    ctx.strokeRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);

    // Fine inner outline
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoArea.x - 8, photoArea.y - 8, photoArea.w + 16, photoArea.h + 16);


    // 4. Draw Styled Campaign Bands (Orange & Navy Blue as in prompt image)
    const bandArea = {
      x: 100,
      y: 915,
      w: 880,
      h: 220
    };

    // Orange Campaign Banner Block (Top portion of campaign frame footer)
    ctx.fillStyle = '#E0533C'; // Campaign Orange Banner
    ctx.fillRect(bandArea.x, bandArea.y, bandArea.w, 120);

    // Blue CIPLA Banner Block (Bottom portion of campaign frame footer)
    ctx.fillStyle = '#1E2E5C'; // Campaign Navy Blue Banner
    ctx.fillRect(bandArea.x, bandArea.y + 120, bandArea.w, 100);

    // Orange band border
    ctx.strokeStyle = '#7A1512';
    ctx.lineWidth = 6;
    ctx.strokeRect(bandArea.x, bandArea.y, bandArea.w, 220);

    // Draw white center line divide
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bandArea.x, bandArea.y + 120);
    ctx.lineTo(bandArea.x + bandArea.w, bandArea.y + 120);
    ctx.stroke();

    // 5. Draw Doctor Name in Orange banner and Specialization / Location in Blue banner
    ctx.fillStyle = '#FFFFFF';
    
    // Doctor Title & Name inside Orange Block
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    const docTitle = doctor.doctorName 
      ? (doctor.doctorName.toLowerCase().startsWith('dr') ? doctor.doctorName : `Dr. ${doctor.doctorName}`)
      : 'Dr. Doctor Name';
    ctx.fillText(docTitle.toUpperCase(), W / 2, bandArea.y + 70);

    // Specialization & Location inside Blue Block
    ctx.font = '900 26px sans-serif';
    ctx.letterSpacing = '3px';
    const docSpecLoc = `${(doctor.specialization || 'SPECIALIZATION').toUpperCase()}  |  ${(doctor.city || 'LOCATION').toUpperCase()}`;
    ctx.fillText(docSpecLoc, W / 2, bandArea.y + 180);

    // 6. Render CIPLA Campaign Slogans in designated bottom area for professional density
    const textYStart = 1185;

    // Cipla Logo Slogan
    ctx.fillStyle = '#7A1512'; // Primary Maroon
    ctx.font = '900 32px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText('CIPLA • DEFEAT HEPATITIS CAMPAIGN', W / 2, textYStart);

    // Frame Slogan / Tagline
    ctx.fillStyle = '#E0533C'; // Orange
    ctx.font = 'bold 24px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(activeFrame.tagline.toUpperCase(), W / 2, textYStart + 60);

    // Top Brand Logos on the extreme frames
    ctx.fillStyle = '#7A1512';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CIPLA LIVER HEALTH', 100, 75);

    ctx.textAlign = 'right';
    ctx.fillText(activeFrame.badgeText || 'INTERNATIONAL BOOK OF RECORDS', W - 100, 75);

    setIsRendered(true);
  };

  // Redraw when elements or offsets update
  useEffect(() => {
    drawCanvas();
  }, [doctor, selectedFrameId, photoImage, zoom, offsetX, offsetY, activeFrame]);

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly || !photoImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || readOnly || !photoImage) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffsetX(prev => prev + dx);
    setOffsetY(prev => prev + dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // Export current image base64 status to parent component
      triggerBase64Export();
    }
  };

  const triggerBase64Export = () => {
    const canvas = canvasRef.current;
    if (canvas && photoImage) {
      const b64 = canvas.toDataURL('image/jpeg', 0.82);
      onCreativeGenerated(b64);
    }
  };

  // Touch handlers for responsive tablets & phones
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly || !photoImage || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || readOnly || !photoImage || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setOffsetX(prev => prev + dx);
    setOffsetY(prev => prev + dy);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const downloadCreative = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const docNameClean = doctor.doctorName ? doctor.doctorName.replace(/\s+/g, '_') : 'Doctor';
    const filename = `${docNameClean}_CampaignCreative.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onDownloaded) {
      onDownloaded();
    }
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm w-full max-w-xl">
      <div className="flex justify-between items-center w-full mb-3">
        <h4 className="font-heading font-semibold text-gray-800 text-sm flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-maroon" />
          Photo Branding Studio Live
        </h4>
        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-gray-500">HD Output (1080×1350)</span>
        </div>
      </div>

      {/* Responsive interactive viewport wrapper */}
      <div className="relative aspect-[3/4] w-full max-w-[380px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden group">
        <canvas
          id="branding-canvas"
          ref={canvasRef}
          className={`w-full h-full cursor-all-scroll active:cursor-grabbing transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          title={photoImage ? "Drag to pan doctor photo, use sliders to zoom" : "Please upload a photo"}
        />

        {/* Dynamic tooltips on canvas container */}
        {photoImage && !readOnly && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="bg-gray-900/90 text-white text-[11px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Move className="w-3 h-3" /> Drag image inside to reposition
            </span>
          </div>
        )}

        {!photoImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-brand-maroon/5 flex items-center justify-center text-brand-maroon mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Waiting for Doctor Photo</p>
            <p className="text-[10px] text-gray-400 mt-1">Upload a JPG or PNG of the doctor to start generation</p>
          </div>
        )}
      </div>

      {/* Alignment / Scale Controls (Only available if image uploaded and not read-only) */}
      {photoImage && !readOnly && (
        <div className="w-full mt-4 space-y-3.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
              <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> Adjust Image Zoom</span>
              <span className="text-brand-maroon font-mono">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              id="slider-zoom"
              type="range"
              min="0.5"
              max="2.5"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-maroon"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              id="btn-recenter"
              onClick={() => { setOffsetX(0); setOffsetY(0); setZoom(1.0); }}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded text-gray-600 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Recenter Photo
            </button>
            <button
              id="btn-auto-fit"
              onClick={() => {
                if (canvasRef.current && photoImage) {
                  // Fit photo perfectly to height
                  setZoom(1.15);
                  setOffsetX(0);
                  setOffsetY(0);
                }
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded text-gray-600 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              👑 Clinical Auto-Fit
            </button>
          </div>
        </div>
      )}

      {/* Action panel */}
      {photoImage && (
        <div className="w-full mt-4 border-t border-gray-100 pt-4 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-generate-creative"
            onClick={triggerBase64Export}
            className="flex-1 py-2 px-3 bg-brand-maroon hover:bg-brand-maroon-dark text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Style & Text
          </button>
          <button
            id="btn-download-png"
            onClick={downloadCreative}
            className="flex-1 py-2 px-3 bg-brand-navy hover:bg-opacity-95 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all text-center"
          >
            <Download className="w-4 h-4" />
            Download Brand Creative
          </button>
        </div>
      )}
    </div>
  );
}
