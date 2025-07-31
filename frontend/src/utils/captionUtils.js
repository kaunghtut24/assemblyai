/**
 * Utility functions for generating caption files (SRT, VTT)
 */

// Format time for captions (HH:MM:SS,mmm for SRT, HH:MM:SS.mmm for VTT)
export const formatCaptionTime = (milliseconds, format = 'srt') => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const ms = milliseconds % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (format === 'srt') {
    return `${timeString},${ms.toString().padStart(3, '0')}`;
  } else {
    return `${timeString}.${ms.toString().padStart(3, '0')}`;
  }
};

// Generate SRT caption format
export const generateSRT = (words) => {
  if (!words || words.length === 0) {
    return 'No word-level timing data available';
  }

  let srtContent = '';
  let captionIndex = 1;
  let currentCaption = '';
  let captionStart = null;
  let captionEnd = null;
  const maxCaptionLength = 80; // Characters per caption
  const maxCaptionDuration = 5000; // 5 seconds max per caption

  words.forEach((word, index) => {
    if (captionStart === null) {
      captionStart = word.start;
    }

    currentCaption += (currentCaption ? ' ' : '') + word.text;
    captionEnd = word.end;

    const shouldBreak = 
      currentCaption.length >= maxCaptionLength ||
      (captionEnd - captionStart) >= maxCaptionDuration ||
      index === words.length - 1 ||
      /[.!?]$/.test(word.text);

    if (shouldBreak && currentCaption.trim()) {
      srtContent += `${captionIndex}\n`;
      srtContent += `${formatCaptionTime(captionStart, 'srt')} --> ${formatCaptionTime(captionEnd, 'srt')}\n`;
      srtContent += `${currentCaption.trim()}\n\n`;
      
      captionIndex++;
      currentCaption = '';
      captionStart = null;
    }
  });

  return srtContent;
};

// Generate VTT caption format
export const generateVTT = (words) => {
  if (!words || words.length === 0) {
    return 'WEBVTT\n\nNOTE\nNo word-level timing data available\n\n00:00:00.000 --> 00:00:10.000\nNo transcription available';
  }

  let vttContent = 'WEBVTT\n\n';
  let currentCaption = '';
  let captionStart = null;
  let captionEnd = null;
  const maxCaptionLength = 80;
  const maxCaptionDuration = 5000;

  words.forEach((word, index) => {
    if (captionStart === null) {
      captionStart = word.start;
    }

    currentCaption += (currentCaption ? ' ' : '') + word.text;
    captionEnd = word.end;

    const shouldBreak = 
      currentCaption.length >= maxCaptionLength ||
      (captionEnd - captionStart) >= maxCaptionDuration ||
      index === words.length - 1 ||
      /[.!?]$/.test(word.text);

    if (shouldBreak && currentCaption.trim()) {
      vttContent += `${formatCaptionTime(captionStart, 'vtt')} --> ${formatCaptionTime(captionEnd, 'vtt')}\n`;
      vttContent += `${currentCaption.trim()}\n\n`;
      
      currentCaption = '';
      captionStart = null;
    }
  });

  return vttContent;
};

// Test data for development
export const sampleWords = [
  { text: "Hello", start: 0, end: 500, confidence: 0.95 },
  { text: "world", start: 500, end: 1000, confidence: 0.98 },
  { text: "this", start: 1200, end: 1500, confidence: 0.92 },
  { text: "is", start: 1500, end: 1700, confidence: 0.99 },
  { text: "a", start: 1700, end: 1800, confidence: 0.97 },
  { text: "test", start: 1800, end: 2200, confidence: 0.94 },
  { text: "sentence.", start: 2200, end: 2800, confidence: 0.96 }
];

// Test the caption generation
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('SRT Test Output:');
  console.log(generateSRT(sampleWords));
  console.log('\nVTT Test Output:');
  console.log(generateVTT(sampleWords));
}
