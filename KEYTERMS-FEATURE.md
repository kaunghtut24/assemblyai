# 🎯 Domain-Specific Terms Feature (Keyterms Prompt)

## Overview

The **Keyterms Prompt** feature leverages AssemblyAI's slam-1 model to improve transcription accuracy for domain-specific vocabulary. This feature allows users to provide contextual terms that help the AI better understand specialized language in their audio content.

## How It Works

### Backend Implementation
- **Parameter**: `keyterms_prompt` (string, optional)
- **Model Support**: Only available with `slam-1` speech model
- **API Endpoint**: `/transcribe` (POST)
- **Validation**: Automatically applied only when slam-1 model is selected

### Frontend Implementation
- **Component**: `KeytermsPrompt.jsx` - Dedicated UI for entering domain-specific terms
- **Conditional Display**: Only shows when slam-1 model is selected
- **Character Limit**: 500 characters with live counter
- **Examples**: Built-in examples for different domains

## Usage

### 1. Select slam-1 Model
First, choose the "Slam-1" model in the Speech Model selection:
- Enhanced accuracy for specialized vocabulary
- Contextual understanding capabilities
- Domain-specific term support

### 2. Enter Domain-Specific Terms
When slam-1 is selected, the "Domain-Specific Terms" section appears:
- Enter relevant terms, names, or context
- Use the provided examples as templates
- Include technical jargon, proper names, acronyms

### 3. Example Use Cases

**Medical Transcription:**
```
Medical terms: stethoscope, diagnosis, prescription, symptoms, cardiovascular, hypertension
```

**Legal Transcription:**
```
Legal terms: plaintiff, defendant, jurisdiction, litigation, deposition, subpoena
```

**Technical Meetings:**
```
Technical terms: API, database, authentication, deployment, microservices, Kubernetes
```

**Business Calls:**
```
Business terms: revenue, stakeholder, quarterly, metrics, ROI, KPI, synergy
```

## Technical Details

### Backend Changes
- **File**: `backend/app.py`
  - Added `keyterms_prompt` parameter to `/transcribe` endpoint
  - Parameter passed to transcription function

- **File**: `backend/transcriber.py`
  - Added `keyterms_prompt` parameter to `transcribe_with_local_file()`
  - Conditional application only for slam-1 model
  - Included in caching configuration
  - Added logging for keyterms usage

### Frontend Changes
- **File**: `frontend/src/components/KeytermsPrompt.jsx`
  - New component for keyterms input
  - Conditional rendering based on model selection
  - Built-in examples and tips
  - Character counter and validation

- **File**: `frontend/src/App.jsx`
  - Added `keytermsPrompt` state management
  - Integrated KeytermsPrompt component
  - Passed keyterms to FileUpload component

- **File**: `frontend/src/components/FileUpload.jsx`
  - Added `keytermsPrompt` parameter
  - Conditional inclusion in FormData for slam-1 model

- **File**: `frontend/src/components/ModelSelection.jsx`
  - Updated slam-1 description to highlight keyterms feature
  - Enhanced feature descriptions

## Benefits

### Improved Accuracy
- Better recognition of technical terms
- Accurate transcription of proper names
- Enhanced understanding of domain-specific language

### User Experience
- Intuitive interface with helpful examples
- Automatic feature availability based on model selection
- Clear guidance on effective usage

### Performance
- Cached results include keyterms configuration
- Efficient parameter passing
- Minimal performance impact

## Best Practices

### Effective Keyterms
1. **Be Specific**: Include exact terms that appear in your audio
2. **Include Variations**: Add different forms of the same term
3. **Proper Names**: Include names of people, companies, products
4. **Acronyms**: Spell out acronyms and their full forms
5. **Context**: Provide brief context for ambiguous terms

### Example Format
```
Company names: Acme Corp, TechStart Inc
Product names: CloudSync, DataFlow Pro
Technical terms: API gateway, microservices architecture
People: Dr. Sarah Johnson, CEO Mike Chen
```

## Limitations

- **Model Dependency**: Only works with slam-1 model
- **Character Limit**: Maximum 500 characters
- **Language**: Optimized for English content
- **Context**: Works best with clear, relevant terms

## Future Enhancements

- **Auto-suggestions**: Based on uploaded file type
- **Domain Templates**: Pre-built templates for common industries
- **Term Validation**: Real-time suggestions and corrections
- **Multi-language Support**: Extended language support

---

This feature significantly improves transcription quality for specialized content while maintaining the simplicity and performance of the existing application.
