# 📥 Export Features Documentation

## Overview

The Audio Transcriber App now supports multiple export formats to meet different use cases and integration needs. Users can export transcripts in various formats including subtitle/caption files for video editing and accessibility.

## Export Formats

### 1. 📄 Plain Text (.txt)
- **Use Case**: Simple text documents, note-taking, basic sharing
- **Content**: Clean transcript text without timing information
- **Compatibility**: Universal - works with any text editor
- **Requirements**: None - always available

### 2. 🎬 SRT Captions (.srt)
- **Use Case**: Video subtitles, accessibility, video editing
- **Content**: Timed captions in SubRip format
- **Compatibility**: Most video players and editing software
- **Requirements**: Word-level timing data from transcription
- **Features**:
  - Automatic caption segmentation (max 80 characters per caption)
  - Maximum 5-second duration per caption
  - Sentence-aware breaking at punctuation
  - Sequential numbering

### 3. 🌐 VTT Captions (.vtt)
- **Use Case**: Web video players, HTML5 video, accessibility
- **Content**: Timed captions in WebVTT format
- **Compatibility**: Modern web browsers, HTML5 video players
- **Requirements**: Word-level timing data from transcription
- **Features**:
  - Web-standard format for online video
  - Same segmentation logic as SRT
  - Better web integration than SRT

### 4. 📊 JSON Data (.json)
- **Use Case**: Data analysis, custom integrations, backup
- **Content**: Complete transcript data with metadata
- **Compatibility**: Programming languages, data analysis tools
- **Requirements**: None - always available
- **Includes**:
  - Full transcript text
  - Word-level timing and confidence data
  - Speaker diarization data (if available)
  - Processing metadata (confidence, timing, file size)
  - Export timestamp

## User Interface

### Export Button
- **Location**: Transcript Results section, next to Copy button
- **Appearance**: Green "📥 Export ▼" dropdown button
- **Behavior**: Click to open export options menu

### Export Options Menu
- **Layout**: Dropdown menu with 4 export format options
- **Actions**: Each format has Copy (📋) and Download (💾) buttons
- **Feedback**: Visual confirmation when copying to clipboard
- **Accessibility**: Disabled options when requirements not met

## Technical Implementation

### Caption Generation Logic

#### SRT Format Example:
```
1
00:00:00,000 --> 00:00:02,800
Hello world this is a test sentence.

2
00:00:03,000 --> 00:00:05,500
This is the second caption segment.
```

#### VTT Format Example:
```
WEBVTT

00:00:00.000 --> 00:00:02.800
Hello world this is a test sentence.

00:00:03.000 --> 00:00:05.500
This is the second caption segment.
```

### Caption Segmentation Rules
1. **Length Limit**: Maximum 80 characters per caption
2. **Duration Limit**: Maximum 5 seconds per caption
3. **Sentence Breaks**: Break at punctuation (. ! ?)
4. **Word Boundaries**: Never break in the middle of words

### File Naming Convention
- **Pattern**: `{type}_{timestamp}.{extension}`
- **Timestamp**: ISO format with colons replaced by hyphens
- **Examples**:
  - `transcript_2025-01-31T15-30-45.txt`
  - `captions_2025-01-31T15-30-45.srt`
  - `captions_2025-01-31T15-30-45.vtt`
  - `transcript_data_2025-01-31T15-30-45.json`

## Requirements and Limitations

### Word-Level Timing Data
- **Required For**: SRT and VTT caption formats
- **Source**: AssemblyAI transcription with word-level timestamps
- **Fallback**: When not available, caption options are disabled
- **Note**: Universal and slam-1 models both provide word-level data

### Browser Compatibility
- **Modern Browsers**: Full support for all export features
- **Older Browsers**: Fallback clipboard functionality
- **Mobile**: Touch-optimized interface with proper button sizing

### File Size Considerations
- **Text Files**: Minimal size impact
- **Caption Files**: Slightly larger due to timing data
- **JSON Files**: Largest due to complete data structure
- **Typical Sizes**: 1-hour audio → ~50KB text, ~100KB captions, ~500KB JSON

## Integration Examples

### Video Editing Software
1. Export SRT or VTT captions
2. Import into video editor (Premiere, Final Cut, DaVinci Resolve)
3. Sync with video timeline
4. Customize appearance and positioning

### Web Video Players
1. Export VTT captions
2. Add to HTML5 video element:
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="en" label="English">
</video>
```

### Data Analysis
1. Export JSON format
2. Load into analysis tools (Python, R, Excel)
3. Analyze confidence scores, timing patterns, speaker data

## Accessibility Benefits

### Screen Readers
- Caption files provide structured timing information
- JSON format includes confidence data for quality assessment

### Hearing Impaired
- SRT/VTT files enable video accessibility
- Proper timing ensures synchronized captions

### Multi-language Support
- Export formats support Unicode text
- Caption timing works with any language

## Future Enhancements

### Planned Features
- **Custom Caption Settings**: User-configurable length and duration limits
- **Speaker-Aware Captions**: Include speaker labels in caption text
- **Batch Export**: Export multiple formats simultaneously
- **Cloud Integration**: Direct upload to cloud storage services

### Format Extensions
- **TTML**: Advanced web caption format
- **SBV**: YouTube-specific subtitle format
- **CSV**: Spreadsheet-compatible timing data
- **PDF**: Formatted transcript documents

---

This comprehensive export system ensures that transcripts can be used across a wide range of applications and workflows, from simple text sharing to professional video production and accessibility compliance.
